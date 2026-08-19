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
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture({ testVariant = "valid", reviewStatus = "recorded", acceptanceResult = "pass", duplicateHumanConfirmation = false, materialOnlyWriteback = false, omitSubjects = [], nestedAcceptanceVariant = "valid", nonterminalAttempt = false, crossStageIntegrationReview = false } = {}) {
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
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    const content = name === "tasks.md"
      ? "# tasks.md\n\n### 执行状态填写区\n- pending\n\n### Verify\n- current\n"
      : `# ${name}\n`;
    artifacts.writeAtomic(name, content);
  }
  if (testVariant === "clean-head") {
    git(worktreeRoot, ["add", "specs"]);
    git(worktreeRoot, ["commit", "-qm", "publish current materials"]);
  }
  const kernel = testVariant === "clean-head"
    ? createTaskKernel(task, { workspace: openCurrentTaskWorkspace(task), artifacts })
    : createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = captureGitWorktreeSnapshot(worktreeRoot);
  const evidenceRawFor = (subject, tree) => {
    if (subject === "human_confirmation") {
      return `${JSON.stringify({ schema_version: "human-confirmation.v2", task_id: taskId, stage: "verify-code", decision: "accepted", subject_ref: "verify-code", snapshot_tree: tree })}\n`;
    }
    const nestedRef = `quality/evidence/verify-code/stage-quality-${subject}.json`;
    const nestedValue = {
      schema_version: "stage-quality-evidence.v1", task_id: nestedAcceptanceVariant === "wrong-task" ? "other-task" : taskId, stage: "verify-code", subject,
      status: "passed", snapshot_tree: tree,
      subject_fact: {
        status: "passed",
        detail: "fixture",
        evidence_refs: nestedAcceptanceVariant === "missing-subject-evidence"
          ? []
          : [{ ref: testRef, sha256: sha256(testRaw) }],
        ...(subject === "finding_dispositions" ? { disposition_items: [], source_review_refs: [], risk_acceptance_refs: [] } : {}),
      },
    };
    const nestedRaw = `${JSON.stringify(nestedValue)}\n`;
    kernel.publishCanonicalRecord(nestedRef, nestedRaw);
    return `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: subject, result: acceptanceResult, refs: [{ ref: nestedRef, sha256: sha256(nestedRaw) }], snapshot_tree: tree, summary: { actual_outcome: acceptanceResult === "pass" ? "passed" : "failed", evidence_type: "stage quality fact" } })}\n`;
  };
  const reviewRawFor = (subject, tree) => `${JSON.stringify({
    version: "wh-review-result.v1", task_id: taskId, stage: "verify-code", review_track: null,
    review_kind: null, subject_kind: "worktree", phase_id: null, review_scope: null,
    source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: tree, captured_head: snapshot.head },
    snapshot_tree: tree, material_id: "b".repeat(64),
    attempt_ref: `quality/reviews/attempts/${subject}.json`,
    provider_results: [{ provider: "fixture", output: { findings: [] } }], findings: [],
    adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
  })}\n`;
  const testRef = "quality/tests/verify-code.json";
  const testStage = testVariant === "focused-build-receipt" ? "build-code" : "verify-code";
  const testComponent = testVariant === "focused-build-receipt"
    ? "focused-test-capture"
    : testVariant === "focused-mini-receipt"
      ? "mini-task-focused-tests"
      : `${testStage}-test-capture`;
  const testValue = {
    schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: testStage,
    producer: { stage: testStage, component: testComponent, version: "1.0.0" },
    command: "npm test", command_hash: sha256("npm test"), exit_code: 0,
    snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
    source_digest: snapshot.source_digest,
    started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z",
    output_ref: "quality/tests/output/verify-code.output", output_hash: sha256("pass\n"),
  };
  if (testVariant === "failed-receipt") testValue.exit_code = 1;
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
  kernel.publishCanonicalRecord("quality/tests/output/verify-code.output", "pass\n");
  if (testVariant !== "missing") kernel.publishCanonicalRecord(testRef, testRaw);
  const testEvidence = { ref: testRef, sha256: sha256(testRaw), evidence_type: "test_receipt" };
  kernel.publishVNextQualityFact("verify-code", { kind: "test", status: "passed", subject: "full_tests_fresh", evidence: [testEvidence] });
  for (const subject of ["code_review"]) {
    if (omitSubjects.includes(subject)) continue;
    const review = writeFormalReviewFixture({
      task,
      stage: crossStageIntegrationReview && subject === "same_build_integration_review" ? "build-code" : "verify-code",
      snapshotTree: snapshot.tree,
      provider: "fixture",
    });
    const ref = nonterminalAttempt ? review.attemptRef : review.resultRef;
    const raw = task.readRecord(ref);
    kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: reviewStatus, subject: "code_review",
      evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }],
    });
  }
  for (const [subject, kind, evidenceType] of [
    ["finding_dispositions", "acceptance_criterion", "acceptance_evidence"],
    ["acceptance_criteria", "acceptance_criterion", "acceptance_evidence"],
    ["exceptions", "acceptance_criterion", "acceptance_evidence"],
    ["human_confirmation", "confirmation", "human_confirmation"],
  ]) {
    if (omitSubjects.includes(subject)) continue;
    if (subject === "human_confirmation") {
      kernel.publishHumanConfirmation("verify-code", { decision: "accepted", subject_ref: "verify-code" });
      continue;
    }
    const ref = `quality/evidence/verify-code/${subject}.json`;
    const raw = evidenceRawFor(subject, snapshot.tree);
    kernel.publishCanonicalRecord(ref, raw);
    kernel.publishVNextQualityFact("verify-code", {
      kind, status: "passed", subject,
      evidence: [{ ref, sha256: sha256(raw), evidence_type: evidenceType }],
    });
  }
  if (duplicateHumanConfirmation) {
    if (!omitSubjects.includes("human_confirmation")) {
      kernel.publishHumanConfirmation("verify-code", { decision: "accepted", subject_ref: "verify-code-old" });
      kernel.publishHumanConfirmation("verify-code", { decision: "accepted", subject_ref: "verify-code-new" });
    }
  }
  const receiptSnapshot = { ...snapshot, commit: testValue.snapshot_commit };
  if (materialOnlyWriteback) {
    artifacts.writeAtomic("tasks.md", "# tasks.md\n\n### 执行状态填写区\n- result written back\n\n### Verify\n- current\n");
    const current = captureGitWorktreeSnapshot(worktreeRoot);
    return { task, kernel, repo, taskId, candidate, artifacts, receiptSnapshot, snapshot: current };
  }
  return { task, kernel, repo, taskId, candidate, artifacts, receiptSnapshot, snapshot: receiptSnapshot };
}

describe("vNext formal delivery close", () => {
  it("will be extended by P3 RED coverage for mini-task/A resume without changing the existing close contract", () => {
    expect(prepareDeliveryClosePlan).toBeTypeOf("function");
  });

  it("accepts an empty current review without creating a retry requirement", () => {
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

  it("accepts the verify-code code-review fact without a second integration review", () => {
    const state = fixture({ crossStageIntegrationReview: true });
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

  it("does not let an unavailable current code review reach the close consumer", () => {
    const state = fixture({ reviewStatus: "unavailable" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).toThrow(/current verify-code quality facts are incomplete:.*code_review/);
  });

  it("rejects a non-terminal code-review attempt used as a non-recorded quality fact", () => {
    const state = fixture({ reviewStatus: "failed", nonterminalAttempt: true });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).toThrow(/unavailable terminal fact/);
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

  it("accepts a material-only writeback after the test receipt without rerunning or invalidating the test", () => {
    const state = fixture({ materialOnlyWriteback: true });
    expect(state.snapshot.tree).not.toBe(state.receiptSnapshot.tree);
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

  it("ignores unrelated legacy quality references during code-review close", () => {
    const state = fixture();
    state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: "recorded", subject: "legacy_independent_review",
      evidence: [{ ref: "quality/", sha256: "a".repeat(64), evidence_type: "review_result" }],
    });
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

  it("does not treat a failed review fact as a formal close fact", () => {
    const state = fixture({ reviewStatus: "failed" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).toThrow(/code_review/);
  });

  it("reads an unavailable code-review disclosure and reports the missing close fact", () => {
    const state = fixture({ omitSubjects: ["code_review"] });
    const ref = "quality/evidence/stage-quality-missing/verify-code/code_review-test.json";
    const raw = `${JSON.stringify({
      schema_version: "stage-quality-missing.v1",
      task_id: state.taskId,
      stage: "verify-code",
      subject: "code_review",
      status: "missing",
      snapshot_tree: state.snapshot.tree,
      reason: "the independent review execution was unavailable",
    }, null, 2)}\n`;
    state.kernel.publishCanonicalRecord(ref, raw);
    state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: "missing", subject: "code_review",
      evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }],
    });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).toThrow(/current verify-code quality facts are incomplete:.*code_review/);
  });

  it("accepts the canonical recorded status used by review quality facts", () => {
    const state = fixture({ reviewStatus: "recorded" });
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

  it("ignores acceptance-result variants because close consumes the code review only", () => {
    const state = fixture({ acceptanceResult: "fail" });
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

  it("ignores detached legacy acceptance evidence during code-review close", () => {
    const state = fixture({ nestedAcceptanceVariant: "wrong-task" });
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

  it("ignores legacy acceptance wrappers without underlying evidence", () => {
    const state = fixture({ nestedAcceptanceVariant: "missing-subject-evidence" });
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

  it.each(["code_review"])(
    "rejects close when the formal code-review fact is missing: %s",
    (subject) => {
      const state = fixture({ omitSubjects: [subject] });
      expect(() => prepareDeliveryClosePlan({
        task: state.task,
        kernel: state.kernel,
        delivery: {
          remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
          task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
          spec_archive_path: `specs/archive/${state.taskId}`,
        },
      })).toThrow(new RegExp(subject));
    },
  );

  it.each(["missing", "tree-mismatch", "commit-mismatch", "extra-parent", "failed-receipt"])("ignores verify test snapshot variants: %s", (testVariant) => {
    const state = fixture({ testVariant });
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

  it("does not require a verify-code full-test receipt", () => {
    const state = fixture({ testVariant: "focused-build-receipt" });
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

  it("does not let a mini-task receipt become a code-review prerequisite", () => {
    const state = fixture({ testVariant: "focused-mini-receipt" });
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
});
