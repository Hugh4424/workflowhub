import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import {
  authorizeMiniTaskDelivery,
  confirmMiniTaskDelivery,
  createMiniTaskRunner,
  executeMiniTaskDelivery,
  prepareMiniTaskDelivery,
  recordMiniTaskDesignReview,
  recordMiniTaskQuality,
} from "../../skills/mini-task/scripts/mini-task-runner.mjs";

describe("mini-task delivery RED contract", () => {
  it("requires a mini-task runner boundary", async () => {
    await expect(import("../../skills/mini-task/scripts/mini-task-runner.mjs")).resolves.toBeDefined();
  });

  it("requires the thin skill to preserve the four-material and two-review contract", async () => {
    const module = await import("../../skills/mini-task/scripts/mini-task-runner.mjs");
    expect(module).toHaveProperty("createMiniTaskRunner");
  });

  it("delivers a real mini-task through the existing six-step close and reads back Git state", async () => {
    const state = deliveryFixture();
    publishMiniTaskQualityFixture(state);
    const candidateRoot = state.candidate.worktreeRoot;
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    const completed = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(completed.status).toBe("completed");
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(git(state.repo, ["rev-parse", "refs/remotes/origin/main"]));
    expect(git(state.repo, ["show", `main:specs/archive/${state.taskId}/spec.md`])).toContain("mini-task");
    expect(git(state.repo, ["cat-file", "-e", `main:specs/${state.taskId}/spec.md`], true).ok).toBe(false);
    expect(git(state.repo, ["show-ref", "--verify", "--quiet", `refs/heads/task/WorkflowHub/${state.taskId}`], true).ok).toBe(false);
    expect(existsSync(candidateRoot)).toBe(false);
    expect(state.task.readRecord("operations/close/completed.json")).toContain("completed");
    expect(state.task.taskPath.includes("successor")).toBe(false);
  });

  it("does not mutate Git when the confirmed plan has no irreversible authorization", async () => {
    const state = deliveryFixture();
    publishMiniTaskQualityFixture(state);
    const candidateRoot = state.candidate.worktreeRoot;
    const before = git(state.repo, ["rev-parse", "refs/heads/main"]);
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref })).rejects.toThrow("IRREVERSIBLE_AUTHORIZATION_REQUIRED");
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(before);
    expect(existsSync(candidateRoot)).toBe(true);
  });

  it("cancels after the design review and preserves materials, facts, and workspace", async () => {
    const state = deliveryFixture();
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const raw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.design", snapshot_tree: snapshot.tree })}\n`;
    const ref = "quality/reviews/results/mini-task-design-cancelled.json";
    state.kernel.publishCanonicalRecord(ref, raw);
    const designFact = recordMiniTaskDesignReview({ task: state.task, kernel: state.kernel, review: { ref, sha256: sha256(raw), status: "passed" } });
    const before = git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`]);
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, outcome: "rejected" });
    const cancelled = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(cancelled).toMatchObject({ status: "blocked", confirmationOutcome: "rejected" });
    expect(git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`])).toBe(before);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
    expect(state.task.readRecord(designFact.ref)).toContain("mini_task_design_review");
    expect(readFileSync(join(state.candidateRoot, "specs", state.taskId, "spec.md"), "utf8")).toContain("mini-task");
  });

  it("requires the implementation review, AC trace, and verified user result before close readiness", async () => {
    const state = deliveryFixture();
    const reviewRaw = JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.implementation", snapshot_tree: captureGitWorktreeSnapshot(state.candidate.worktreeRoot).tree });
    const reviewRef = "quality/reviews/results/mini-task-implementation.json";
    state.kernel.publishCanonicalRecord(reviewRef, reviewRaw);
    const review = { ref: reviewRef, sha256: sha256(reviewRaw), status: "passed" };
    await expect(() => recordMiniTaskQuality({ task: state.task, kernel: state.kernel, testCommand: "true", implementationReview: review, userResult: { status: "verified" } })).toThrow("AC trace is required");
  });

  it("binds design review, implementation review, focused tests, and user result to one snapshot", async () => {
    const state = deliveryFixture();
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const designRaw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.design", snapshot_tree: snapshot.tree })}\n`;
    const designRef = "quality/reviews/results/mini-task-design.json";
    state.kernel.publishCanonicalRecord(designRef, designRaw);
    const designFact = recordMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      review: { ref: designRef, sha256: sha256(designRaw), status: "passed" },
    });
    expect(JSON.parse(state.task.readRecord(designFact.ref)).subject).toBe("mini_task_design_review");

    const implementationRaw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.implementation", snapshot_tree: snapshot.tree })}\n`;
    const implementationRef = "quality/reviews/results/mini-task-implementation-positive.json";
    state.kernel.publishCanonicalRecord(implementationRef, implementationRaw);
    const quality = recordMiniTaskQuality({
      task: state.task,
      kernel: state.kernel,
      workspace: openCurrentTaskWorkspace(state.task),
      testCommand: "true",
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw), status: "passed" },
      userResult: { status: "verified", observed: "mini-task result" },
      acTrace: { "AC-020": "verified" },
      coverageLimits: ["temporary Git fixture only"],
      skipReasons: ["no real remote push"],
      remainingRisks: ["caller must rerun the original stage after A resume"],
    });
    expect(quality.status).toBe("ready");
    expect(quality.snapshot_tree).toBe(snapshot.tree);
    expect(quality.evidence_ref).toMatch(/^quality\/evidence\/mini-task-implementation\//);

    const before = git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`]);
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, outcome: "rejected" });
    const cancelled = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(cancelled).toMatchObject({ status: "blocked", confirmationOutcome: "rejected" });
    expect(git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`])).toBe(before);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
    expect(state.task.readRecord(quality.evidence_ref)).toContain("mini-task-implementation-evidence");
  });

  it("accepts design review on the pre-implementation snapshot and implementation quality on the final snapshot", async () => {
    const state = deliveryFixture();
    const designSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const designRaw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.design", snapshot_tree: designSnapshot.tree })}\n`;
    const designRef = "quality/reviews/results/mini-task-design-before-implementation.json";
    state.kernel.publishCanonicalRecord(designRef, designRaw);
    recordMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      review: { ref: designRef, sha256: sha256(designRaw), status: "passed" },
    });

    writeFileSync(join(state.candidate.worktreeRoot, "src", "feature.txt"), "implemented after design review\n");
    const implementationSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    expect(implementationSnapshot.tree).not.toBe(designSnapshot.tree);
    const implementationRaw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.implementation", snapshot_tree: implementationSnapshot.tree })}\n`;
    const implementationRef = "quality/reviews/results/mini-task-implementation-after-design.json";
    state.kernel.publishCanonicalRecord(implementationRef, implementationRaw);
    const quality = recordMiniTaskQuality({
      task: state.task,
      kernel: state.kernel,
      workspace: openCurrentTaskWorkspace(state.task),
      testCommand: "true",
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw), status: "passed" },
      userResult: { status: "verified", observed: "implemented mini-task result" },
      acTrace: { "AC-020": "verified" },
      coverageLimits: ["temporary Git fixture only"],
      skipReasons: ["no real remote push"],
      remainingRisks: [],
    });
    expect(quality.status).toBe("ready");
    expect(quality.snapshot_tree).toBe(implementationSnapshot.tree);

    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: { ...state.delivery, task_commit: quality.snapshot_commit } });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref }))
      .resolves.toMatchObject({ status: "completed" });
  });

  it("does not let ordinary verify facts bypass mini-task implementation quality", async () => {
    const state = deliveryFixture();
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref }))
      .rejects.toThrow("mini-task design review is incomplete");
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
  });

  it("keeps a failed implementation review incomplete and blocks delivery", async () => {
    const state = deliveryFixture();
    const quality = publishMiniTaskQualityFixture(state, { implementationStatus: "failed" });
    expect(quality.status).toBe("incomplete");
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref }))
      .rejects.toThrow("mini-task implementation review is incomplete");
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
  });

  it("cancels after a partial Git object exists without reset, deletion, or rollback", async () => {
    const state = deliveryFixture();
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    git(state.candidate.worktreeRoot, ["add", "."]);
    git(state.candidate.worktreeRoot, ["commit", "-qm", "partial mini-task operation"]);
    const partialTip = git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`]);
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, outcome: "rejected" });
    const cancelled = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(cancelled).toMatchObject({ status: "blocked", confirmationOutcome: "rejected" });
    expect(git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`])).toBe(partialTip);
    expect(existsSync(state.candidateRoot)).toBe(true);
    expect(readFileSync(join(state.candidateRoot, "specs", state.taskId, "spec.md"), "utf8")).toContain("mini-task");
  });
});

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function git(cwd, args, allowFailure = false) {
  if (allowFailure) {
    const result = requireGit(cwd, args, true);
    return { ok: result.status === 0, stdout: result.stdout, stderr: result.stderr };
  }
  return requireGit(cwd, args, false).stdout;
}
function requireGit(cwd, args, allowFailure) {
  try {
    return { status: 0, stdout: String(execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(), stderr: "" };
  } catch (error) {
    if (!allowFailure) throw error;
    return { status: error.status ?? 1, stdout: String(error.stdout ?? "").trim(), stderr: String(error.stderr ?? "").trim() };
  }
}
function deliveryFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-mini-task-delivery-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo); mkdirSync(bare);
  git(repo, ["init", "-q", "-b", "main"]); git(repo, ["config", "user.name", "WorkflowHub Tests"]); git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n"); git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "base"]);
  git(bare, ["init", "--bare", "-q"]); git(repo, ["remote", "add", "origin", bare]); git(repo, ["push", "-q", "origin", "main"]);
  const taskId = "mini-task-delivery";
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId, created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write" } });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\nmini-task\n`);
  mkdirSync(join(candidate.worktreeRoot, "src"), { recursive: true }); writeFileSync(join(candidate.worktreeRoot, "src", "feature.txt"), "mini-task\n");
  const kernel = createTaskKernel(task, { workspace: openCurrentTaskWorkspace(task), artifacts });
  const snapshot = captureGitWorktreeSnapshot(candidate.worktreeRoot);
  const testOutput = "mini-task focused tests passed\n";
  const testRaw = `${JSON.stringify({ schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: "verify-code", producer: { stage: "verify-code", component: "mini-task-test-capture", version: "1.0.0" }, command: "printf mini-task", command_hash: sha256("printf mini-task"), exit_code: 0, snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit, started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z", output_ref: "quality/tests/output/mini-task.output", output_hash: sha256(testOutput) }, null, 2)}\n`;
  kernel.publishCanonicalRecord("quality/tests/output/mini-task.output", testOutput); kernel.publishCanonicalRecord("quality/tests/mini-task.json", testRaw);
  kernel.publishVNextQualityFact("verify-code", { kind: "test", status: "passed", subject: "full_tests_fresh", evidence: [{ ref: "quality/tests/mini-task.json", sha256: sha256(testRaw), evidence_type: "test_receipt" }] });
  for (const subject of ["same_build_integration_review", "independent_review"]) {
    const raw = `${JSON.stringify({ schema_version: "review-fact", task_id: taskId, snapshot_tree: snapshot.tree, subject })}\n`;
    const ref = `quality/reviews/results/${subject}.json`; kernel.publishCanonicalRecord(ref, raw);
    kernel.publishVNextQualityFact("verify-code", { kind: "review", status: "passed", subject, evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }] });
  }
  return { root, repo, task, kernel, candidate, candidateRoot: candidate.worktreeRoot, taskId, delivery: { remote: "origin", task_branch: `task/WorkflowHub/${taskId}`, target_branch: "main", task_commit: snapshot.commit, spec_source_path: `specs/${taskId}`, spec_archive_path: `specs/archive/${taskId}` } };
}

function publishMiniTaskQualityFixture(state, { implementationStatus = "passed" } = {}) {
  const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
  const designRaw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.design", snapshot_tree: snapshot.tree })}\n`;
  const designRef = "quality/reviews/results/mini-task-design-fixture.json";
  state.kernel.publishCanonicalRecord(designRef, designRaw);
  const designFact = recordMiniTaskDesignReview({ task: state.task, kernel: state.kernel, review: { ref: designRef, sha256: sha256(designRaw), status: "passed" } });
  const implementationRaw = `${JSON.stringify({ version: "wh-review-result.v1", task_id: state.taskId, review_kind: "mini_task.implementation", snapshot_tree: snapshot.tree })}\n`;
  const implementationRef = "quality/reviews/results/mini-task-implementation-fixture.json";
  state.kernel.publishCanonicalRecord(implementationRef, implementationRaw);
  const quality = recordMiniTaskQuality({
    task: state.task,
    kernel: state.kernel,
    workspace: openCurrentTaskWorkspace(state.task),
    testCommand: "true",
    implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw), status: implementationStatus },
    userResult: { status: "verified", observed: "mini-task result" },
    acTrace: { "AC-020": "verified" },
    coverageLimits: ["temporary Git fixture only"],
    skipReasons: ["no real remote review"],
    remainingRisks: ["caller must rerun the original stage after A resume"],
  });
  return { ...quality, designFact };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
