import { createHash, randomUUID } from "node:crypto";

import { createCanonicalReviewWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { aggregateProviderResults } from "../../skills/wh-review/scripts/review-result.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/** Write a complete create-only wh-review attempt/provider/result chain for tests. */
export function writeFormalReviewFixture({ task, stage, snapshotTree, reviewTrack = null, verdict = "pass", provider = "fixture-provider", subjectKind = "worktree", phaseId = null, reviewScope = stage === "build-code" ? (subjectKind === "phase" ? "phase" : "integration") : null, reviewChain } = {}) {
  const attemptId = randomUUID();
  const writer = createCanonicalReviewWriter({ task, taskId: task.identity.taskId, stage });
  const reviewRoot = task.manifest.record_model === "vnext-single-write" ? "quality/reviews" : "reviews";
  const attemptRef = `${reviewRoot}/attempts/${attemptId}/attempt.json`;
  const outputRef = `${reviewRoot}/attempts/${attemptId}/providers/${provider}.output.json`;
  const resultRef = `${reviewRoot}/results/${stage}-${reviewTrack ?? "default"}-${attemptId}.json`;
  const source = { target_commit: snapshotTree, base_commit: snapshotTree, base_tree: snapshotTree, captured_head: snapshotTree };
  const finding = {
    severity: "major",
    path: "fixture",
    issue: "fixture finding",
    root_cause: "fixture intentionally models an anchored review finding",
    recommendation: "revise fixture",
    evidence_kind: "direct",
    evidence: "fixture evidence is intentionally anchored to the fixture path",
  };
  const providerOutput = { verdict, summary: "fixture review", findings: verdict === "pass" ? [] : [finding] };
  writer.writeProviderOutput(outputRef, JSON.stringify(providerOutput), 1);
  const materialId = sha256(`${stage}:${reviewTrack}:${snapshotTree}:${attemptId}`);
  const lineage = {
    request_id: `${stage}-${attemptId}`,
    prompt_hash: materialId,
    round: "initial",
    prior_attempt_refs: [],
    prior_runtime_ids: {},
    correction_ref: null,
    dispatch_sequence: 0,
  };
  const subject = { subject_kind: subjectKind, phase_id: phaseId, review_scope: reviewScope, base_tree: snapshotTree, candidate_tree: snapshotTree };
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: task.identity.taskId, stage,
    review_track: reviewTrack, source, snapshot_tree: snapshotTree, material_id: materialId, lineage, ...subject,
    ...(reviewChain === undefined ? {} : { review_chain: reviewChain }),
    provider_attempts: [{ provider, status: "completed", session_id: "fixture-session", runtime_id: "fixture-runtime", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
  });
  const aggregation = aggregateProviderResults([{ provider, review: providerOutput }], 1);
  const findings = aggregation.adjudication.reportFindings.map((item) => ({ provider: item.providers[0], ...item }));
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: task.identity.taskId, stage, review_track: reviewTrack,
    source, snapshot_tree: snapshotTree, material_id: materialId, attempt_ref: attemptRef, lineage, ...subject,
    ...(reviewChain === undefined ? {} : { review_chain: reviewChain }),
    provider_results: [{ provider, output: providerOutput }], verdict: aggregation.verdict,
    findings, adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  });
  return Object.freeze({ resultRef, attemptRef, outputRef, materialId });
}
