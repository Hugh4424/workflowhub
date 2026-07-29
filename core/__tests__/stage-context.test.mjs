import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { bootstrapStage } from "../stage-context.mjs";
import { createTask, migrateTaskRunnerRoot } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { prepareTaskWorkspace } from "../workspace.mjs";
import { hashAuditSummary } from "../audit-summary-carrier.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { writeOfficialComponentReceipt } from "../canonical-receipt-writer.mjs";

const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
const temporaryDirs = [];

function auditedMakeDecisionFacts(kernel, candidate, { worktreeRoot, baselineCommit }) {
  const active = kernel.activeStageRun("make-decision", { required: false });
  const started = active ?? kernel.startStageRun("make-decision", { reason: "test fixture publication" });
  const snapshot = candidate.captureSnapshot();
  const content = {
    schema_version: "stage-content-evidence.v1",
    kind: "make-decision.test",
    task_id: kernel.task.identity.taskId,
    stage: "make-decision",
    workflow_run_id: started.run.workflow_run_id,
    snapshot_tree: snapshot.tree,
  };
  const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
  const contentHash = createHash("sha256").update(contentRaw).digest("hex");
  const contentRef = `evidence/stage-content/${contentHash}/make-decision-test.json`;
  kernel.publishCanonicalRecord(contentRef, contentRaw);
  const contentEvidenceRefs = [{ kind: content.kind, ref: contentRef, hash: contentHash }];
  const unsignedSummary = {
    schema_version: "stage-audit-summary.v1",
    task_id: kernel.task.identity.taskId,
    stage_slug: "make-decision",
    workflow_run_id: started.run.workflow_run_id,
    snapshot_tree: snapshot.tree,
    verdict: "pass",
    content_evidence_refs: contentEvidenceRefs,
  };
  const summaryHash = hashAuditSummary(unsignedSummary);
  const summaryRef = `evidence/audits/make-decision/${summaryHash}.json`;
  kernel.publishCanonicalRecord(summaryRef, `${JSON.stringify({ ...unsignedSummary, summary_hash: summaryHash }, null, 2)}\n`);
  const decision = writeOfficialComponentReceipt({
    task: kernel.task,
    stage: "make-decision",
    component: "decision",
    payload: { decision_log: "# Decision\n\nProceed.\n" },
  });
  return {
    worktree_root: worktreeRoot,
    baseline_commit: baselineCommit,
    decision_ref: decision.value.decision_ref,
    decision_hash: decision.value.decision_hash,
    audit_contract_version: "v1",
    audit_summary_ref: summaryRef,
    audit_summary_hash: summaryHash,
    audit_verdict: "pass",
    content_evidence_refs: contentEvidenceRefs,
  };
}

function publishAuditedMakeDecisionAttempt(kernel, candidate, facts) {
  return kernel.publishAttempt("make-decision", {
    facts: auditedMakeDecisionFacts(kernel, candidate, facts),
  });
}

function fixture({ acceptDecision = true, migrateRunner = false, perInvocation = false } = {}) {
  const storageRoot = realpathSync(
    mkdtempSync(join(tmpdir(), "workflowhub-stage-context-")),
  );
  temporaryDirs.push(storageRoot);
  const taskPath = join(
    storageRoot,
    "Projects",
    "PaperBuilder",
    "tasks",
    "paperbuilder-phase-foundation",
  );
  const targetRepoRoot = join(storageRoot, "PaperBuilder");
  const worktreeRoot = join(storageRoot, "PaperBuilder-paperbuilder-phase-foundation");
  mkdirSync(targetRepoRoot, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: targetRepoRoot });
  execFileSync("git", ["config", "user.email", "tests@workflowhub.local"], { cwd: targetRepoRoot });
  execFileSync("git", ["config", "user.name", "WorkflowHub Tests"], { cwd: targetRepoRoot });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: targetRepoRoot });
  const baselineCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: targetRepoRoot, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-qb", "task/PaperBuilder/paperbuilder-phase-foundation", worktreeRoot, baselineCommit], { cwd: targetRepoRoot });
  const manifest = Object.freeze({
    schema_version: "1.0.0",
    ...(perInvocation ? { execution_mode: "per_invocation" } : {}),
    project_name: "PaperBuilder",
    task_id: "paperbuilder-phase-foundation",
    created_at: "2026-07-16T00:00:00.000Z",
    target_repo_root: targetRepoRoot,
    issue_ids: [],
    inputs: {},
  });
  const task = createTask({ storageRoot, taskPath, manifest });
  let activeTask = task;
  let runnerRoot;
  if (migrateRunner || perInvocation) {
    runnerRoot = join(storageRoot, "runner");
    mkdirSync(runnerRoot);
    execFileSync("git", ["init", "-q", "-b", "task/PaperBuilder/paperbuilder-phase-foundation"], { cwd: runnerRoot });
    execFileSync("git", ["config", "user.email", "tests@workflowhub.local"], { cwd: runnerRoot });
    execFileSync("git", ["config", "user.name", "WorkflowHub Tests"], { cwd: runnerRoot });
    writeFileSync(join(runnerRoot, "AGENTS.md"), "# Runner\n");
    writeFileSync(join(runnerRoot, "CONSTITUTION.md"), "# Constitution\n");
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      mkdirSync(join(runnerRoot, "workflows", stage), { recursive: true });
      writeFileSync(join(runnerRoot, "workflows", stage, "SKILL.md"), `# ${stage}\n`);
    }
    execFileSync("git", ["add", "."], { cwd: runnerRoot });
    execFileSync("git", ["commit", "-qm", "runner"], { cwd: runnerRoot });
    if (migrateRunner) {
      activeTask = migrateTaskRunnerRoot({ taskPath, projectName: "PaperBuilder", taskId: "paperbuilder-phase-foundation", runnerRoot: realpathSync(runnerRoot), stage: "verify-code" }).task;
    }
  }
  const candidate = prepareTaskWorkspace(activeTask);
  const kernel = createTaskKernel(activeTask, { candidateWorkspace: candidate });
  if (acceptDecision) {
    const published = publishAuditedMakeDecisionAttempt(kernel, candidate, { worktreeRoot, baselineCommit });
    kernel.acceptAttempt("make-decision", published.attempt_ref, writeHumanConfirmation(kernel, "make-decision", published));
  }
  mkdirSync(join(worktreeRoot, "specs", manifest.task_id), { recursive: true });
  return { storageRoot, taskPath, worktreeRoot, baselineCommit, manifest, task: activeTask, kernel, runnerRoot: runnerRoot && realpathSync(runnerRoot) };
}

function writeCurrentMaterials(worktreeRoot, taskId = "paperbuilder-phase-foundation") {
  const root = join(worktreeRoot, "specs", taskId);
  mkdirSync(root, { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(root, name), `# ${name}\n`);
  }
}

afterEach(() => {
  if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
  else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("bootstrapStage", () => {
  it("rejects a prepared candidate after its HEAD changes before acceptance",()=>{
    const {task}=fixture({acceptDecision:false});
    const candidate = prepareTaskWorkspace(task);
    execFileSync("git",["commit","--allow-empty","-qm","advanced"],{cwd:candidate.worktreeRoot});
    expect(()=>candidate.worktreeRoot).toThrow(/HEAD|baseline|changed/i);
  });
  it("launcher mode resolves env once and derives taskPath from project/task", () => {
    const { storageRoot, taskPath } = fixture();
    const env = { WORKFLOWHUB_TASK_DIR: storageRoot };

    const context = bootstrapStage(
      "make-decision",
      {
        mode: "launcher",
        home: storageRoot,
        projectName: "PaperBuilder",
        taskId: "paperbuilder-phase-foundation",
        env,
      },
    );

    expect(context.task.taskPath).toBe(taskPath);
  });

  it("sidecar mode uses absolute taskPath and never reads storage-root env", () => {
    const { storageRoot, taskPath } = fixture();
    const poisonEnv = { WORKFLOWHUB_TASK_DIR: join(storageRoot, "poison-root") };

    const context = bootstrapStage(
      "build-spec",
      {
        mode: "sidecar",
        taskPath,
        projectName: "PaperBuilder",
        taskId: "paperbuilder-phase-foundation",
        env: poisonEnv,
      },
    );

    expect(context.task.taskPath).toBe(taskPath);
  });

  it("sidecar mode never reads the global WorkflowHub config", () => {
    const { storageRoot, taskPath } = fixture();
    const configHome = mkdtempSync(join(tmpdir(), "workflowhub-poison-config-"));
    temporaryDirs.push(configHome);
    const configDirectory = join(configHome, "workflowhub");
    mkdirSync(configDirectory, { recursive: true });
    writeFileSync(join(configDirectory, "config.json"), "{", "utf8");

    const context = bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      home: storageRoot,
      env: { XDG_CONFIG_HOME: configHome },
    });

    expect(context.task.taskPath).toBe(taskPath);
  });

  it("sidecar mode rejects runner drift immediately after opening the task", () => {
    const { taskPath, runnerRoot } = fixture({ migrateRunner: true });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "runner drift"], { cwd: runnerRoot });

    expect(() => bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      runnerRoot,
    })).toThrow(/runner identity mismatch/i);
  });

  it("fails a dirty official write before mutation and shares one authenticated boundary across child writes", async () => {
    const { taskPath, runnerRoot } = fixture({ migrateRunner: true });
    const context = bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      runnerRoot,
    });
    const { authenticateStageWriteBoundary } = await import("../stage-context.mjs");
    expect(typeof authenticateStageWriteBoundary).toBe("function");

    writeFileSync(join(runnerRoot, "dirty.txt"), "not committed\n");
    expect(() => authenticateStageWriteBoundary(context, {
      runnerRoot,
      operation: "accept",
      runId: "dirty-write",
    })).toThrow(/clean/i);
    expect(() => context.task.readRecord("identity/executions/dirty-write.json")).toThrow();

    rmSync(join(runnerRoot, "dirty.txt"));
    expect(authenticateStageWriteBoundary(context, {
      runnerRoot,
      operation: "accept",
      runId: "clean-write",
    })).toMatchObject({
      status: "valid",
      worktree_root: realpathSync(context.workspace.worktreeRoot),
      path_card: {
        worktree_root: realpathSync(context.workspace.worktreeRoot),
        source: { invocation_ref: "identity/executions/clean-write.json" },
        authority: "informational_only",
      },
    });
    context.kernel.publishCanonicalRecord("evidence/shared-preflight-child-a.json", '{"child":"a"}\n');
    context.kernel.publishCanonicalRecord("evidence/shared-preflight-child-b.json", '{"child":"b"}\n');
    expect(readdirSync(join(taskPath, "identity", "executions"))).toEqual(["clean-write.json"]);
  });

  it("persists one per-invocation identity only at the final Workspace-bound write boundary", async () => {
    const { taskPath, runnerRoot, worktreeRoot } = fixture({ perInvocation: true });
    const context = bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      runnerRoot,
    });
    const identityRoot = join(taskPath, "identity", "executions");
    expect(() => readdirSync(identityRoot)).toThrow();

    const { authenticateStageWriteBoundary } = await import("../stage-context.mjs");
    const boundary = authenticateStageWriteBoundary(context, {
      runnerRoot,
      operation: "accept",
      runId: "single-owner-write",
    });

    expect(readdirSync(identityRoot)).toEqual(["single-owner-write.json"]);
    expect(boundary).toMatchObject({
      worktree_root: realpathSync(worktreeRoot),
      invocation_ref: "identity/executions/single-owner-write.json",
    });
  });

  it("leaves no per-invocation record when the final shared boundary fails", async () => {
    const { taskPath, runnerRoot } = fixture({ perInvocation: true });
    const context = bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      runnerRoot,
    });
    writeFileSync(join(runnerRoot, "dirty.txt"), "dirty\n");

    const { authenticateStageWriteBoundary } = await import("../stage-context.mjs");
    expect(() => authenticateStageWriteBoundary(context, {
      runnerRoot,
      operation: "accept",
      runId: "failed-owner-write",
    })).toThrow(/clean/i);
    expect(() => readdirSync(join(taskPath, "identity", "executions"))).toThrow();
  });

  it("binds make-decision write authentication to the prepared CandidateWorkspace", async () => {
    const { storageRoot, taskPath, runnerRoot, worktreeRoot } = fixture({
      acceptDecision: false,
      perInvocation: true,
    });
    const context = bootstrapStage("make-decision", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
      runnerRoot,
      workspaceLifecycle: "prepare",
    });
    const { authenticateStageWriteBoundary } = await import("../stage-context.mjs");
    const boundary = authenticateStageWriteBoundary(context, {
      runnerRoot,
      operation: "prepare",
      runId: "make-decision-write",
    });
    expect(boundary.worktree_root).toBe(realpathSync(worktreeRoot));
    expect(boundary.path_card.worktree_root).toBe(realpathSync(worktreeRoot));
    expect(readdirSync(join(taskPath, "identity", "executions"))).toEqual(["make-decision-write.json"]);
  });

  it("persists an append-only source-bound path card and rejects stale source reuse without mutation", async () => {
    const { taskPath, runnerRoot } = fixture({ migrateRunner: true });
    const context = bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      runnerRoot,
    });
    const { authenticateStageWriteBoundary } = await import("../stage-context.mjs");
    const { persistWriteBoundaryPathCard } = await import("../write-boundary-preflight.mjs");
    const boundary = authenticateStageWriteBoundary(context, {
      runnerRoot,
      operation: "accept",
      runId: "path-card",
    });
    const sourceRef = "test-source.json";
    const sourceRaw = '{"result":"pass"}\n';
    context.task.createRecordAtomic(sourceRef, sourceRaw);
    const sourceHash = createHash("sha256").update(sourceRaw).digest("hex");
    const first = persistWriteBoundaryPathCard({
      task: context.task,
      boundary,
      source: { ref: sourceRef, hash: sourceHash },
    });
    expect(JSON.parse(context.task.readRecord(first.ref))).toMatchObject({
      authority: "informational_only",
      source: { ref: sourceRef, hash: sourceHash },
    });
    expect(persistWriteBoundaryPathCard({
      task: context.task,
      boundary,
      source: { ref: sourceRef, hash: sourceHash },
    })).toEqual(first);

    const before = readdirSync(taskPath, { recursive: true }).map(String).sort();
    expect(() => persistWriteBoundaryPathCard({
      task: context.task,
      boundary,
      source: { ref: sourceRef, hash: "b".repeat(64) },
    })).toThrow(/source|hash|stale/i);
    expect(readdirSync(taskPath, { recursive: true }).map(String).sort()).toEqual(before);
  });

  it("ignores a stale informational path card when resolving the current task and worktree", () => {
    const { taskPath, worktreeRoot, task, runnerRoot } = fixture({ migrateRunner: true });
    const staleCardRaw = `${JSON.stringify({
      schema_version: "workflowhub-path-card.v1",
      task_id: "paperbuilder-phase-foundation",
      stage: "build-spec",
      operation: "accept",
      task_path: "/tmp/stale-task",
      target_repo_root: "/tmp/stale-repository",
      worktree_root: "/tmp/stale-worktree",
      invocation: { ref: "identity/executions/stale.json", hash: "a".repeat(64) },
      source: { ref: "results/verify-code/accepted.json", hash: "b".repeat(64) },
      authority: "informational_only",
    }, null, 2)}\n`;
    const staleRef = `identity/path-cards/build-spec/${createHash("sha256").update(staleCardRaw).digest("hex")}.json`;
    task.createPathCardRecord(staleRef, staleCardRaw);

    const context = bootstrapStage("build-spec", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      runnerRoot,
    });
    expect(context.task.taskPath).toBe(realpathSync(taskPath));
    expect(context.workspace.worktreeRoot).toBe(realpathSync(worktreeRoot));
  });

  it("rejects taskPath, expected identity, and manifest disagreement", () => {
    const { taskPath } = fixture();

    expect(() =>
      bootstrapStage(
        "build-spec",
        {
          mode: "sidecar",
          taskPath,
          projectName: "PaperBuilder",
          taskId: "wrong-task",
        },
      ),
    ).toThrow(/identity|mismatch|task/i);
  });

  it("gives make-decision no Workspace or ArtifactDir", () => {
    const { storageRoot } = fixture();
    const context = bootstrapStage(
      "make-decision",
      {
        mode: "launcher",
        home: storageRoot,
        projectName: "PaperBuilder",
        taskId: "paperbuilder-phase-foundation",
        env: { WORKFLOWHUB_TASK_DIR: storageRoot },
      },
    );

    expect(context.workspace).toBeUndefined();
    expect(context.artifacts).toBeUndefined();
  });

  it("prepares a deterministic CandidateWorkspace and binds make-decision acceptance to it", () => {
    const { storageRoot, baselineCommit } = fixture({ acceptDecision: false });
    const context = bootstrapStage("make-decision", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
      workspaceLifecycle: "prepare",
    });
    const worktreeRoot = join(storageRoot, "PaperBuilder-paperbuilder-phase-foundation");
    expect(context.candidateWorkspace).toMatchObject({ worktreeRoot: realpathSync(worktreeRoot), baselineCommit });
    const facts = auditedMakeDecisionFacts(context.kernel, context.candidateWorkspace, { worktreeRoot, baselineCommit });
    expect(() => context.kernel.publishAttempt("make-decision", {
      facts: { ...facts, baseline_commit: "a".repeat(40) },
    }))
      .toThrow(/CandidateWorkspace|match/i);
    const correct = context.kernel.publishAttempt("make-decision", {
      facts,
    });
    expect(() => context.kernel.acceptAttempt("make-decision", correct.attempt_ref, writeHumanConfirmation(context.kernel, "make-decision", correct))).not.toThrow();
  });

  it.each(["build-spec", "build-plan", "verify-code"])(
    "builds %s Workspace and ArtifactDir from the current task worktree",
    (stage) => {
      const fixtureValue = fixture();
      if (stage === "verify-code") writeCurrentMaterials(fixtureValue.worktreeRoot);
      if (stage !== "build-spec") {
        fixtureValue.kernel.startStageRun(stage, { reason: "stage-context workspace coverage" });
      }
      const { storageRoot, worktreeRoot, baselineCommit } = fixtureValue;
      const context = bootstrapStage(
        stage,
        {
          mode: "launcher",
          home: storageRoot,
          projectName: "PaperBuilder",
          taskId: "paperbuilder-phase-foundation",
          env: { WORKFLOWHUB_TASK_DIR: storageRoot },
        },
      );

      expect(context.workspace).toEqual({
        worktreeRoot: realpathSync(worktreeRoot),
        baselineCommit,
      });
      expect(context.artifacts.root).toBe(
        join(realpathSync(worktreeRoot), "specs", "paperbuilder-phase-foundation"),
      );
    },
  );

  it("allows build-code without accepted design history when all four current materials are readable", () => {
    const { storageRoot, worktreeRoot } = fixture({ acceptDecision: false });
    writeCurrentMaterials(worktreeRoot);
    expect(() => bootstrapStage("build-code", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
    })).not.toThrow();
  });

  it("names every missing current material before build-code starts", () => {
    const { storageRoot } = fixture({ acceptDecision: false });
    expect(() => bootstrapStage("build-code", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
    })).toThrow(/decision-log\.md[\s\S]*spec\.md[\s\S]*plan\.md[\s\S]*tasks\.md/i);
  });

  it("invalidates Workspace automatically when its worktree path is replaced", () => {
    const { storageRoot, worktreeRoot } = fixture();
    const context = bootstrapStage("build-spec", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
    });
    const displaced = `${worktreeRoot}-displaced`;
    const artifact = context.artifacts;
    // Use the fixture path, not the capability property, to perform the hostile
    // replacement. Reading the old capability after this point must validate.
    renameSync(worktreeRoot, displaced);
    mkdirSync(worktreeRoot);
    execFileSync("git", ["init", "-q"], { cwd: worktreeRoot });
    execFileSync("git", ["config", "user.email", "tests@workflowhub.local"], { cwd: worktreeRoot });
    execFileSync("git", ["config", "user.name", "WorkflowHub Tests"], { cwd: worktreeRoot });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "replacement"], { cwd: worktreeRoot });

    expect(() => context.workspace.worktreeRoot).toThrow(
      /changed|replaced|stale|identity|worktree/i,
    );
    expect(() => artifact.path("spec.md")).toThrow(
      /changed|replaced|stale|identity|worktree/i,
    );
  });
});
