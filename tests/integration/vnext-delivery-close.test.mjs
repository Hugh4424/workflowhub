import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { prepareDeliveryClosePlan } from "../../core/task-close.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture({ testVariant = "valid", reviewStatus = "passed", duplicateHumanConfirmation = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-vnext-delivery-close-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo);
  mkdirSync(bare);
  const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base-2"]);
  git(bare, ["init", "--bare", "-q"]);
  git(repo, ["remote", "add", "origin", bare]);
  git(repo, ["push", "-q", "origin", "main"]);
  const taskId = "vnext-delivery-close";
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId,
    created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
    record_model: "vnext-single-write",
  } });
  const candidate = prepareTaskWorkspace(task);
  const worktreeRoot = candidate.worktreeRoot;
  const artifacts = ArtifactDir.open(worktreeRoot, task);
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\n`);
  if (testVariant === "clean-head") {
    git(worktreeRoot, ["add", "specs"]);
    git(worktreeRoot, ["commit", "-qm", "publish current materials"]);
  }
  const kernel = testVariant === "clean-head"
    ? createTaskKernel(task, { workspace: openCurrentTaskWorkspace(task), artifacts })
    : createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = captureGitWorktreeSnapshot(worktreeRoot);
  const testRef = "quality/tests/verify-code.json";
  const testValue = {
    schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: "verify-code",
    producer: { stage: "verify-code", component: "verify-code-test-capture", version: "1.0.0" },
    command: "true", command_hash: sha256("true"), exit_code: 0,
    snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
    started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z",
    output_ref: "evidence/verify-code.output", output_hash: sha256("pass\n"),
  };
  if (testVariant === "clean-head") testValue.snapshot_commit = snapshot.head;
  if (testVariant === "tree-mismatch") testValue.snapshot_tree = "0".repeat(40);
  if (testVariant === "commit-mismatch") testValue.snapshot_commit = snapshot.head;
  if (testVariant === "extra-parent") {
    const alternateParent = git(repo, ["rev-parse", `${snapshot.head}^`]);
    testValue.snapshot_commit = git(repo, ["commit-tree", snapshot.tree, "-p", snapshot.head, "-p", alternateParent], {
      env: { ...process.env, GIT_AUTHOR_NAME: "WorkflowHub Tests", GIT_AUTHOR_EMAIL: "tests@workflowhub.local", GIT_COMMITTER_NAME: "WorkflowHub Tests", GIT_COMMITTER_EMAIL: "tests@workflowhub.local" },
    });
  }
  const testRaw = `${JSON.stringify(testValue, null, 2)}\n`;
  kernel.publishCanonicalRecord("evidence/verify-code.output", "pass\n");
  if (testVariant !== "missing") kernel.publishCanonicalRecord(testRef, testRaw);
  const testEvidence = { ref: testRef, sha256: sha256(testRaw), evidence_type: "test_receipt" };
  kernel.publishVNextQualityFact("verify-code", { kind: "test", status: "passed", subject: "full_tests_fresh", evidence: [testEvidence] });
  for (const subject of ["same_build_integration_review", "independent_review"]) {
    const ref = `quality/reviews/results/${subject}.json`;
    const raw = "{}\n";
    kernel.publishCanonicalRecord(ref, raw);
    kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: reviewStatus, subject,
      evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }],
    });
  }
  if (duplicateHumanConfirmation) {
    for (const suffix of ["old", "new"]) {
      const ref = `quality/confirmations/${suffix}.json`;
      const raw = `${suffix}\n`;
      kernel.publishCanonicalRecord(ref, raw);
      kernel.publishVNextQualityFact("verify-code", {
        kind: "confirmation", status: suffix === "old" ? "missing" : "passed", subject: "human_confirmation",
        evidence: [{ ref, sha256: sha256(raw), evidence_type: "human_confirmation" }],
      });
    }
  }
  return { task, kernel, repo, taskId, candidate, snapshot: { ...snapshot, commit: testValue.snapshot_commit } };
}

describe("vNext formal delivery close", () => {
  it("accepts the authenticated test receipt snapshot commit", () => {
    const state = fixture();
    const targetBaseline = execFileSync("git", ["rev-parse", "refs/heads/main"], { cwd: state.repo, encoding: "utf8" }).trim();
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery).toMatchObject({
      task_commit: state.snapshot.commit, target_baseline: targetBaseline, remote_target_baseline: targetBaseline,
    });
  });

  it("accepts a clean task-head snapshot commit", () => {
    const state = fixture({ testVariant: "clean-head" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.task_commit).toBe(state.snapshot.head);
  });

  it("selects the newest duplicate current quality fact", () => {
    const state = fixture({ duplicateHumanConfirmation: true });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("does not treat a non-pass review verdict as a close gate", () => {
    const state = fixture({ reviewStatus: "failed" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it.each(["missing", "tree-mismatch", "commit-mismatch", "extra-parent"])("rejects an unauthenticated test snapshot: %s", (testVariant) => {
    const state = fixture({ testVariant });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).toThrow(/verify-code test receipt snapshot_commit is unavailable/);
  });
});
