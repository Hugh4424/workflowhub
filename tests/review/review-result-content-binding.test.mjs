import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { aggregateCanonicalProviderResults } from "../../runtime/review/canonical-review-result.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");

function historicalSimpleResultFixture() {
  const taskId = "review-content-binding-task";
  const tree = "a".repeat(40);
  const materialId = "b".repeat(64);
  const attemptId = "historical-review-attempt";
  const resultRef = `quality/reviews/results/historical-simple-${attemptId}.json`;
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/fixture.output.json`;
  const provider = "fixture-provider";
  const providerReview = {
    findings: [{
      severity: "major",
      path: "runtime/example.mjs",
      issue: "fixture implementation finding",
      root_cause: "fixture root cause",
      recommendation: "fixture recommendation",
      evidence_kind: "direct",
      evidence: "fixture evidence",
    }],
  };
  const aggregation = aggregateCanonicalProviderResults([{ provider, review: providerReview }], 1);
  const result = {
    version: "wh-review-result.v1",
    task_id: taskId,
    stage: "build-spec",
    review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree },
    snapshot_tree: tree,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: null,
    base_tree: tree,
    candidate_tree: tree,
    material_id: materialId,
    attempt_ref: attemptRef,
    provider_results: [{ provider, output: providerReview }],
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  const attempt = {
    version: "wh-review-attempt.v1",
    attempt_id: attemptId,
    task_id: taskId,
    stage: "build-spec",
    review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree },
    snapshot_tree: tree,
    material_id: materialId,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: null,
    base_tree: tree,
    candidate_tree: tree,
    provider_attempts: [{
    provider,
    status: "completed",
      session_id: "fixture-session",
      runtime_id: "fixture-runtime",
      output_ref: outputRef,
      error: null,
      execution: null,
    }],
    terminal_status: "semantic",
    error: null,
  };
  const outputContent = JSON.stringify(providerReview);
  const output = {
    schema_version: "wh-review-provider-output.v1",
    task_id: taskId,
    stage: "build-spec",
    attempt_id: attemptId,
    provider,
    content: outputContent,
    content_hash: hash(outputContent),
    evidence_anchor_valid: [true],
  };
  const records = new Map([
    [resultRef, { value: result, sha256: hash(JSON.stringify(result)) }],
    [attemptRef, { value: attempt, sha256: hash(JSON.stringify(attempt)) }],
    [outputRef, { value: output, sha256: hash(JSON.stringify(output)) }],
  ]);
  const findingId = result.findings[0].id;
  const worker = {
    stage: "build-spec",
    identity: { taskId },
    manifest: { record_model: "vnext-single-write" },
    currentMaterialRevision: "revision-current",
    readArtifact: (name) => name === "spec.md" ? "# Spec\n" : "## UI applicability\n\nbackend contract\n",
    artifactRef: (name) => `specs/${taskId}/${name}`,
    snapshotWorkspace: () => ({ tree }),
    readReceipt: (ref) => records.get(ref),
  };
  return {
    worker,
    input: {
      receipts: { review: resultRef },
      finding_dispositions: [{
        finding_id: findingId,
        original_fact: "fixture finding",
        source: "wh-review",
        consequence: "fixture consequence",
        status: "fixed",
        next_action: "continue current stage",
        evidence_ref: resultRef,
        owner: "runtime/stage",
        consumer: "build-spec completion",
        retain_or_delete: "retain",
        classification: "implementation_defect",
        kind: "implementation_defect",
        impact_dimensions: ["runtime"],
        evidence_refs: [resultRef],
      }],
    },
  };
}

describe("review result content binding", () => {
  it("accepts a canonical result whose historical simple filename differs from the attempt id", async () => {
    const fixture = historicalSimpleResultFixture();
    const result = await officialStageHandler("build-spec")(fixture.worker, fixture.input);
    expect(result.facts.review.status).toBe("recorded");
    expect(result.facts.review.result_ref).toBe(fixture.input.receipts.review);
  });
});
