import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

import { createTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { ArtifactDir } from "../artifact-dir.mjs";
import { verifyGitCheckpoint } from "../git-checkpoint.mjs";

const temporary = [];
const execFileAsync = promisify(execFile);
function confirmation(kernel, stage, attemptRef) {
  return kernel.confirmAttempt(stage, attemptRef, "accepted").ref;
}
function fixture(inputs = {}) {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-kernel-publish-")));
  temporary.push(storageRoot);
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const taskPath = join(storageRoot, "Projects", "Demo", "tasks", "task-one");
  const task = createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task-one",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs,
  } });
  return { task, kernel: createTaskKernel(task) };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("TaskKernel append-only publication", () => {
  it("rejects an upstream reference whose task identity is forged", () => {
    const { kernel } = fixture();
    const cp = { ref: "refs/checkpoint", commit_oid: "a".repeat(40), tree_oid: "b".repeat(40), artifacts: [] };
    expect(() => kernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: cp }, checkpoint: cp,
      upstream_refs: [{ task_id: "other-task", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    })).toThrow(/task|identity|upstream/i);
  });
  it("rejects a syntactically valid upstream ref when no authentic accepted record exists", () => {
    const { kernel } = fixture();
    const cp = { ref: "refs/checkpoint", commit_oid: "a".repeat(40), tree_oid: "b".repeat(40), artifacts: [] };
    expect(() => kernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: cp }, checkpoint: cp,
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    })).toThrow(/accepted|upstream|not found|ENOENT/i);
  });
  it("publishes monotonically numbered attempts without overwrite", () => {
    const { task, kernel } = fixture();
    const first = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const second = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "revise" } });
    expect(first.attempt_ref).toBe("attempt-0001.json");
    expect(second.attempt_ref).toBe("attempt-0002.json");
    expect(JSON.parse(task.readRecord(`results/make-decision/${first.attempt_ref}`)).facts.decision).toBe("go");
  });

  it("accepts create-only with human confirmation and exact attempt hash", () => {
    const { kernel } = fixture();
    const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const accepted = kernel.acceptAttempt("make-decision", attempt.attempt_ref, confirmation(kernel, "make-decision", attempt.attempt_ref));
    expect(accepted).toMatchObject({ task_id: "task-one", stage: "make-decision", attempt_ref: attempt.attempt_ref,
      human_confirmation_ref: `confirmations/make-decision/${attempt.attempt_ref}`, integrity_hash: attempt.integrity_hash });
    expect(() => kernel.acceptAttempt("make-decision", attempt.attempt_ref, "journal:2")).toThrow();
    expect(() => kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40) } }))
      .toThrow(/accepted|closed/i);
  });

  it("requires checkpoint provenance for accepted design stages", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];
    expect(() => kernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: {} }, upstream_refs }))
      .toThrow(/checkpoint/i);
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const boundKernel = createTaskKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    expect(checkpoint).toMatchObject({ schema_version: "git-checkpoint-plan.v1",
      artifacts: [{ path: "specs/task-one/spec.md" }],
    });
    expect(() => execFileSync("git", ["show-ref", "--verify", checkpoint.ref], { cwd: task.manifest.target_repo_root, stdio: "ignore" })).toThrow();
    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: structuredClone(checkpoint) }, upstream_refs,
    })).toThrow(/authentic GitCheckpoint/i);
    artifacts.writeAtomic("spec.md", "tampered\n");
    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint }, upstream_refs,
    })).toThrow(/differs|checkpoint|artifact/i);
    const revisedCheckpoint = boundKernel.createCheckpoint("build-spec");
    expect(revisedCheckpoint).not.toHaveProperty("ref");
    const attempt = boundKernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: revisedCheckpoint }, upstream_refs });
    expect(String(execFileSync("git", ["for-each-ref", "--format=%(refname)", "refs/workflowhub/checkpoints/"], { cwd: task.manifest.target_repo_root }))).toBe("");
    const acceptedSpec = boundKernel.acceptAttempt("build-spec", attempt.attempt_ref, confirmation(boundKernel, "build-spec", attempt.attempt_ref));
    expect(acceptedSpec.checkpoint.ref).toMatch(/^refs\/workflowhub\/checkpoints\/Demo\/task-one\/build-spec\//);
    expect(() => verifyGitCheckpoint({ repoRoot: workspace.worktreeRoot, checkpoint: acceptedSpec.checkpoint, projectName: "Demo", taskId: "task-one", stage: "build-spec" })).not.toThrow();
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    const planCheckpoint = boundKernel.createCheckpoint("build-plan");
    const planUpstream = [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }];
    const planAttempt = boundKernel.publishAttempt("build-plan", {
      facts: { plan_ref: "specs/task-one/plan.md", tasks_ref: "specs/task-one/tasks.md", checkpoint: planCheckpoint },
      upstream_refs: planUpstream,
    });
    const acceptedPlan = boundKernel.acceptAttempt("build-plan", planAttempt.attempt_ref, confirmation(boundKernel, "build-plan", planAttempt.attempt_ref));
    expect(() => execFileSync("git", ["merge-base", "--is-ancestor", acceptedSpec.checkpoint.commit_oid, acceptedPlan.checkpoint.commit_oid], { cwd: task.manifest.target_repo_root })).not.toThrow();
  });

  it("resolves only declared upstream slots and keeps source read-only", () => {
    const source = fixture();
    const published = source.kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    source.kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation(source.kernel, "make-decision", published.attempt_ref));
    const consumer = fixture({ decision: `${source.task.taskPath}/results/make-decision/accepted.json` });
    expect(consumer.kernel.readInput("decision").facts.decision).toBe("go");
    expect(() => consumer.kernel.readInput("unknown")).toThrow(/slot|input/i);
    expect(() => consumer.kernel.publishInput("decision", {})).toThrow(/read-only|unsupported/i);
  });

  it("linearizes publish and accept across processes", async () => {
    const { task, kernel } = fixture();
    const initial = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40) } });
    const confirmationRef = confirmation(kernel, "make-decision", initial.attempt_ref);
    const handleModule = pathToFileURL(join(process.cwd(), "core/task-handle.mjs")).href;
    const kernelModule = pathToFileURL(join(process.cwd(), "core/task-kernel.mjs")).href;
    const worker = async (operation) => execFileAsync(process.execPath, ["--input-type=module", "-e", `
      import { openTask } from ${JSON.stringify(handleModule)};
      import { createTaskKernel } from ${JSON.stringify(kernelModule)};
      const task = openTask(${JSON.stringify(task.taskPath)}, { projectName: "Demo", taskId: "task-one" });
      const kernel = createTaskKernel(task);
      try {
        if (${JSON.stringify(operation)} === "accept") kernel.acceptAttempt("make-decision", ${JSON.stringify(initial.attempt_ref)}, ${JSON.stringify(confirmationRef)});
        else kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "b".repeat(40) } });
        process.stdout.write("ok");
      } catch (error) {
        process.stdout.write("blocked:" + error.message);
      }
    `]);
    const [accept, publish] = await Promise.all([worker("accept"), worker("publish")]);
    expect(accept.stdout).toBe("ok");
    expect(publish.stdout === "ok" || /accepted|closed/i.test(publish.stdout)).toBe(true);
    expect(() => kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "c".repeat(40) } }))
      .toThrow(/accepted|closed/i);
  });
});
