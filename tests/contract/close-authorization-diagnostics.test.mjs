import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeCanonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(taskId = "close-authorization-diagnostics") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-close-diagnostics-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-03T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  return { task, candidate, artifacts, kernel };
}

function resolvedInput({ evidence = [] } = {}) {
  return {
    kind: "review",
    status: "recorded",
    review_status: "resolved",
    subject: "code_review",
    evidence,
  };
}

function reviewEvidence(review) {
  return [{ ref: review.resultRef, sha256: review.hash, evidence_type: "review_result" }];
}

function captureFailure(action) {
  try {
    action();
    return null;
  } catch (error) {
    return error;
  }
}

describe("resolved-review close authorization diagnostics", () => {
  it("diagnoses a missing resolved-review outcome binding without changing the original TypeError", () => {
    const state = fixture("close-diagnostics-bind-outcome");
    const error = captureFailure(() => state.kernel.publishVNextQualityFact("verify-code", resolvedInput(), {
      resolved_review: undefined,
    }));

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe("resolved review authorization must be an object");
    expect(Object.keys(error)).not.toContain("diagnostic");
    expect(error.diagnostic).toEqual({
      check_id: "bind_outcome",
      expected: "resolved-review authorization object",
      actual: "missing",
    });
    expect(Object.keys(error.diagnostic)).toEqual(["check_id", "expected", "actual"]);
    expect(Object.isFrozen(error.diagnostic)).toBe(true);
    expect(Object.getOwnPropertyDescriptor(error, "diagnostic")).toMatchObject({
      enumerable: false,
      configurable: false,
      writable: false,
    });
  });

  it("diagnoses an invalid outcome ref/hash pair before reading the stage outcome", () => {
    const state = fixture("close-diagnostics-outcome-ref");
    const error = captureFailure(() => publishResolved(state, resolvedInput(), {
      stage_outcome_ref: `quality/evidence/stage-outcomes/verify-code/${"a".repeat(64)}.json`,
      stage_outcome_hash: "b".repeat(64),
    }));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("resolved review authorization stage outcome ref/hash do not match");
    expect(error.diagnostic).toEqual({
      check_id: "outcome_ref",
      expected: "stage outcome ref basename equals its sha256",
      actual: { ref: `quality/evidence/stage-outcomes/verify-code/${"a".repeat(64)}.json`, hash: "b".repeat(64) },
    });
  });

  it("diagnoses a stale or incomplete outcome before checking review binding", () => {
    const state = fixture("close-diagnostics-outcome-current");
    const review = currentReview(state);
    const outcome = currentOutcome(state, review, { status: "incomplete" });
    const error = captureFailure(() => publishResolved(state, resolvedInput({ evidence: reviewEvidence(review) }), authorizationFor(outcome)));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("resolved review authorization stage outcome is not current and completed");
    expect(error.diagnostic).toMatchObject({
      check_id: "outcome_current",
      expected: { status: "completed" },
      actual: { status: "incomplete" },
    });
    expect(Object.keys(error.diagnostic)).toEqual(["check_id", "expected", "actual"]);
  });

  it("diagnoses missing review evidence before reading the review result", () => {
    const state = fixture("close-diagnostics-review-binding");
    const review = currentReview(state);
    const outcome = currentOutcome(state, review);
    const error = captureFailure(() => publishResolved(state, resolvedInput(), authorizationFor(outcome)));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("resolved review authorization does not bind the current review evidence");
    expect(error.diagnostic).toMatchObject({
      check_id: "review_binding",
      expected: { ref: review.resultRef, hash: review.hash },
      actual: "missing",
    });
  });

  it("diagnoses a review identity mismatch after the binding has been proven", () => {
    const state = fixture("close-diagnostics-review-identity");
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "build-code",
      snapshotTree: state.kernel.currentVNextSnapshot().tree,
      verdict: "pass",
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const raw = state.task.readRecord(review.resultRef);
    const boundReview = { ...review, hash: sha256(raw) };
    const outcome = currentOutcome(state, boundReview);
    const error = captureFailure(() => publishResolved(
      state,
      resolvedInput({ evidence: reviewEvidence(boundReview) }),
      authorizationFor(outcome),
    ));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("resolved review authorization review result identity mismatch");
    expect(error.diagnostic).toEqual({
      check_id: "review_identity",
      expected: { task_id: state.task.identity.taskId, stage: "verify-code" },
      actual: { task_id: state.task.identity.taskId, stage: "build-code" },
    });
  });

  it("diagnoses finding coverage after the review identity is valid", () => {
    const state = fixture("close-diagnostics-finding-coverage");
    const review = currentReview(state, { verdict: "fail" });
    const outcome = outcomeWithReviewResult(state, review, {
      status: "findings",
      findings: review.value.findings,
      repairs: [],
    });
    const error = captureFailure(() => publishResolved(
      state,
      resolvedInput({ evidence: reviewEvidence(review) }),
      authorizationFor(outcome),
    ));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("resolved review authorization does not cover every actionable finding");
    expect(error.diagnostic).toEqual({
      check_id: "finding_coverage",
      expected: { actionable_finding_count: 1, repaired_finding_count: 1 },
      actual: { actionable_finding_count: 1, repaired_finding_count: 0 },
    });
  });

  it("retains the resolved-review authorization on a valid repaired finding", () => {
    const state = fixture("close-diagnostics-valid-resolution");
    const review = currentReview(state, { verdict: "fail" });
    const finding = review.value.findings[0];
    const outcome = outcomeWithReviewResult(state, review, {
      status: "findings",
      findings: review.value.findings,
      repairs: [{ finding_id: finding.id, status: "fixed" }],
    });
    const input = resolvedInput({ evidence: reviewEvidence(review) });
    const result = publishResolved(state, input, authorizationFor(outcome));

    expect(result).toMatchObject({ ref: expect.stringMatching(/^quality\/facts\//) });
    expect(JSON.parse(state.task.readRecord(result.ref))).toMatchObject({
      subject: "code_review",
      review_status: "resolved",
    });
  });
});

function currentReview(state, { verdict = "pass", findingSeverity = "major", provider = "fixture-provider" } = {}) {
  const snapshot = state.kernel.currentVNextSnapshot();
  const review = writeFormalReviewFixture({
    task: state.task,
    stage: "verify-code",
    snapshotTree: snapshot.tree,
    verdict,
    findingSeverity,
    provider,
    materialRevision: state.kernel.currentVNextMaterialRevision(),
  });
  const raw = state.task.readRecord(review.resultRef);
  return { ...review, hash: sha256(raw), raw, value: JSON.parse(raw), snapshot };
}

function currentOutcome(state, review, { status = "completed", attemptId = "attempt-close-diagnostics" } = {}) {
  return writeStageOutcomeFixture({
    task: state.task,
    kernel: state.kernel,
    artifacts: state.artifacts,
    candidateWorkspace: state.candidate,
    stage: "verify-code",
    attemptId,
    status,
    qualityReview: review ? { ref: review.resultRef, sha256: review.hash } : null,
  });
}

function outcomeWithReviewResult(state, review, { status = "findings", findings = [], repairs = [] } = {}) {
  const outcome = currentOutcome(state, review);
  const value = JSON.parse(state.task.readRecord(outcome.ref));
  value.code_review.result = {
    ...value.code_review.result,
    status,
    findings,
    repairs,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/stage-outcomes/verify-code/${sha256(raw)}.json`;
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: sha256(raw), value };
}

function authorizationFor(outcome) {
  return { stage_outcome_ref: outcome.ref, stage_outcome_hash: outcome.sha256 };
}

function publishResolved(state, input, authorization) {
  return state.kernel.publishVNextQualityFact("verify-code", input, { resolved_review: authorization });
}

export { fixture, resolvedInput, currentReview, currentOutcome, authorizationFor, publishResolved };
