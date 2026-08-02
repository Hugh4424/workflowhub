import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTask } from "../../core/task-handle.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { verifyGitCheckpoint } from "../../core/git-checkpoint.mjs";
import { evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";
import { requiresHumanConfirmation } from "../../runtime/stage/stage-acceptance-policy.mjs";
import { writeHumanConfirmation } from "../helpers/human-confirmation.mjs";

// T017/T018 GREEN — ORACLE-PROGRESSION：材料可改可执行；stale 仅阻止正式 verify/close。
// 目标行为：
//   1. build-spec/build-plan accepted 之后编辑 spec.md/plan.md，历史 accepted
//      仍只读可读，普通工作（如 build-code 消费 build-plan）不被历史许可阻塞。
//   2. checkpoint 作为历史事实保持只读，完整性只对 git refs 校验，不与活材料比较。
//   3. 绑定旧 snapshot_tree 的质量事实被判 stale，stale 只阻止正式完成，不阻止工作。
// T017 的历史失败见 phase-4 RED 证据；当前实现必须通过全部断言。

const temporary = [];
afterAll(() => {
  while (temporary.length > 0) rmSync(temporary.pop(), { recursive: true, force: true });
});

function git(cwd, args) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      timeout: 5_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(`git ${args.join(" ")} failed or timed out after 5s: ${error.message}`);
  }
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-progression-")));
  temporary.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "repo-chain-task");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.email", "t@example.com"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  const oid = git(repo, ["rev-parse", "HEAD"]).trim();
  git(repo, ["worktree", "add", "-q", "-b", "task/Demo/chain-task", worktree, oid]);
  const taskPath = join(root, "Projects", "Demo", "tasks", "chain-task");
  const task = createTask({
    storageRoot: root,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "chain-task",
      created_at: new Date().toISOString(),
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  return { root, repo, task, taskPath, worktree, oid };
}

async function runStageFixture(stage, context, handler) {
  const { bootstrapStage } = await import("../../core/stage-context.mjs");
  const runtime = await import("../../core/stage-runner.mjs");
  if (stage === "build-spec" && context.kernel.activeStageRun(stage, { required: false }) === null) {
    context.kernel.startStageRun(stage, { reason: "progression fixture publication" });
  }
  const runtimeContext = stage === "build-spec"
    ? bootstrapStage(stage, {
        mode: "sidecar",
        taskPath: context.task.taskPath,
        projectName: context.identity.projectName,
        taskId: context.identity.taskId,
      })
    : context;
  const wrapped = async (...args) => {
    const result = await handler(...args);
    if (stage !== "make-decision") {
      return { ...result, missing_items: [...new Set([...(result.missing_items ?? []), "support:audit"])] };
    }
    const decisionRaw = "# Progression fixture decision\n";
    const decisionHash = createHash("sha256").update(decisionRaw).digest("hex");
    const decisionRef = `receipts/decision-log/${decisionHash}.md`;
    try {
      runtimeContext.kernel.publishCanonicalRecord(decisionRef, decisionRaw);
    } catch (error) {
      if (error?.code !== "EEXIST" || runtimeContext.task.readRecord(decisionRef) !== decisionRaw) throw error;
    }
    const activeWorkspace = args[0].candidateWorkspace ?? args[0].workspace;
    const worktreeRoot = activeWorkspace?.worktreeRoot ?? result.facts?.worktree_root;
    const artifactRoot = join(worktreeRoot, "specs", runtimeContext.identity.taskId);
    mkdirSync(artifactRoot, { recursive: true });
    writeFileSync(join(artifactRoot, "decision-log.md"), decisionRaw);
    return {
      ...result,
      facts: {
        ...result.facts,
        snapshot_tree: captureGitWorktreeSnapshot(worktreeRoot).tree,
        decision_ref: decisionRef,
        decision_hash: decisionHash,
      },
      missing_items: [...new Set([...(result.missing_items ?? []), "support:audit"])],
    };
  };
  return runtime.runStage(stage, runtimeContext, wrapped);
}

async function acceptedChain({ taskPath, worktree, oid }) {
  const { acceptStageAttempt } = await import("../../core/stage-runner.mjs");
  const { bootstrapStage } = await import("../../core/stage-context.mjs");
  const contextFor = (stage) => bootstrapStage(stage, {
    mode: "sidecar",
    taskPath,
    projectName: "Demo",
    taskId: "chain-task",
  });
  const execute = async (stage, handler) => {
    const context = contextFor(stage);
    const attempt = await runStageFixture(stage, context, handler);
    const request = { attemptRef: attempt.attempt_ref };
    if (requiresHumanConfirmation(stage)) {
      request.humanConfirmationRef = writeHumanConfirmation(context.kernel, stage, attempt);
    }
    acceptStageAttempt(stage, context, request);
    return { context, attempt };
  };
  await execute("make-decision", async () => ({
    facts: { worktree_root: worktree, baseline_commit: oid },
  }));
  await execute("build-spec", async (context) => {
    context.artifacts.writeAtomic("spec.md", "spec\n");
    const checkpoint = context.createCheckpoint("build-spec");
    return { facts: { spec_ref: "specs/chain-task/spec.md", checkpoint } };
  });
  await execute("build-plan", async (context) => {
    context.artifacts.writeAtomic("plan.md", "plan\n");
    context.artifacts.writeAtomic("tasks.md", "tasks\n");
    const checkpoint = context.createCheckpoint("build-plan");
    return { facts: { plan_ref: "specs/chain-task/plan.md", tasks_ref: "specs/chain-task/tasks.md", checkpoint } };
  });
  return { contextFor };
}

describe("progression without historical permits", () => {
  let shared;

  beforeAll(async () => {
    const base = fixture();
    shared = { ...base, ...await acceptedChain(base) };
  }, 30_000);

  beforeEach(() => {
    writeFileSync(join(shared.worktree, "specs", "chain-task", "spec.md"), "spec\n");
    writeFileSync(join(shared.worktree, "specs", "chain-task", "plan.md"), "plan\n");
  });

  it("材料修改后历史 accepted 仍只读可读，普通工作不被历史许可阻塞", async () => {
    const { worktree } = shared;
    const { contextFor } = shared;

    // 普通工作：accepted 之后修订材料（Phase 4 后这是合法工作流，不需要 reopen/rebind）。
    writeFileSync(join(worktree, "specs", "chain-task", "spec.md"), "spec revised\n");
    writeFileSync(join(worktree, "specs", "chain-task", "plan.md"), "plan revised\n");

    // build-code 消费面实际调用路径：kernel.readAccepted("build-plan")。
    const consumer = contextFor("build-code");
    let specAccepted;
    let planAccepted;
    expect(() => { specAccepted = consumer.kernel.readAccepted("build-spec"); }).not.toThrow();
    expect(() => { planAccepted = consumer.kernel.readAccepted("build-plan"); }).not.toThrow();
    expect(specAccepted.accepted_ref).toBe("results/build-spec/accepted.json");
    expect(planAccepted.accepted_ref).toBe("results/build-plan/accepted.json");
  });

  it("真实 build-code runner 在材料修订后仍能到达业务 handler", async () => {
    const { worktree, contextFor } = shared;
    writeFileSync(join(worktree, "specs", "chain-task", "spec.md"), "spec revised\n");
    writeFileSync(join(worktree, "specs", "chain-task", "plan.md"), "plan revised\n");

    const consumer = contextFor("build-code");
    let reached = false;
    await expect(runStageFixture("build-code", consumer, async () => {
      reached = true;
      throw new Error("business handler reached");
    })).rejects.toThrow("business handler reached");
    expect(reached).toBe(true);
  });

  it("checkpoint 历史事实保持只读，完整性只对 git refs 校验", async () => {
    const { task, worktree } = shared;

    writeFileSync(join(worktree, "specs", "chain-task", "spec.md"), "spec revised\n");

    const accepted = JSON.parse(task.readRecord("results/build-spec/accepted.json"));
    const checkpoint = accepted.checkpoint;
    expect(checkpoint).toBeDefined();

    // 传入活 ArtifactDir 也不能触发历史 checkpoint 与活材料比较。
    expect(() => verifyGitCheckpoint({
      repoRoot: worktree,
      checkpoint,
      projectName: "Demo",
      taskId: "chain-task",
      stage: "build-spec",
      artifacts: ArtifactDir.open(worktree, task),
    })).not.toThrow();

    // 历史内容仍可从 git refs 只读读取，且与修订后的活材料无关。
    const historical = git(worktree, ["show", `${checkpoint.commit_oid}:specs/chain-task/spec.md`]);
    expect(historical).toBe("spec\n");
  });

  it("旧 snapshot_tree 绑定的质量事实判 stale，stale 不阻止普通工作", async () => {
    const { worktree } = shared;
    const treeBeforeRevision = captureGitWorktreeSnapshot(worktree).tree;

    writeFileSync(join(worktree, "specs", "chain-task", "spec.md"), "spec revised\n");
    const treeAfterRevision = captureGitWorktreeSnapshot(worktree).tree;
    expect(treeAfterRevision).not.toBe(treeBeforeRevision);

    const value = {
      task_id: "chain-task",
      stage: "build-code",
      material_revision: "revision-a",
      snapshot_tree: treeBeforeRevision,
      kind: "test",
      subject: "subject",
      status: "passed",
      evidence: [],
    };
    const raw = JSON.stringify(value);
    const fact = { ...value, ref: "fact.json", sha256: sha256(raw) };
    const assessment = evaluateFactFreshness(fact, {
      material_revision: "revision-a",
      snapshot_tree: treeAfterRevision,
    }, { read: () => raw });
    expect(assessment.status).toBe("stale");
    expect(assessment.dependencies.tree).toBe("stale");
  });
});
