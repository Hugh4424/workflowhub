import { createHash, randomUUID } from "node:crypto";

import { createCanonicalReviewWriter } from "../../core/canonical-receipt-writer.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/** Write a complete create-only wh-review attempt/provider/result chain for tests. */
export function writeFormalReviewFixture({ task, stage, snapshotTree, reviewTrack = null, verdict = "pass", provider = "fixture-provider", subjectKind = "worktree", phaseId = null, reviewScope = stage === "build-code" ? (subjectKind === "phase" ? "phase" : "integration") : null } = {}) {
  const attemptId = randomUUID();
  const writer = createCanonicalReviewWriter({ task, taskId: task.identity.taskId, stage });
  const attemptRef = `reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `reviews/attempts/${attemptId}/providers/${provider}.output.json`;
  const resultRef = `reviews/results/${stage}-${reviewTrack ?? "default"}-${attemptId}.json`;
  const source = { target_commit: snapshotTree, base_commit: snapshotTree, base_tree: snapshotTree, captured_head: snapshotTree };
  const finding = { severity: "major", path: "fixture", issue: "fixture finding", recommendation: "revise fixture" };
  const providerOutput = { verdict, summary: "fixture review", findings: verdict === "pass" ? [] : [finding] };
  writer.writeProviderOutput(outputRef, JSON.stringify(providerOutput), 1);
  const materialId = sha256(`${stage}:${reviewTrack}:${snapshotTree}:${attemptId}`);
  const subject = { subject_kind: subjectKind, phase_id: phaseId, review_scope: reviewScope, base_tree: snapshotTree, candidate_tree: snapshotTree };
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: task.identity.taskId, stage,
    review_track: reviewTrack, source, snapshot_tree: snapshotTree, material_id: materialId, ...subject,
    provider_attempts: [{ provider, status: "completed", session_id: "fixture-session", runtime_id: "fixture-runtime", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
  });
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: task.identity.taskId, stage, review_track: reviewTrack,
    source, snapshot_tree: snapshotTree, material_id: materialId, attempt_ref: attemptRef, ...subject,
    provider_results: [{ provider, output: providerOutput }], verdict,
    findings: verdict === "pass" ? [] : [{ provider, ...finding }],
  });
  return Object.freeze({ resultRef, attemptRef, outputRef, materialId });
}
