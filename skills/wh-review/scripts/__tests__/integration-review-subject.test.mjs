import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { assertNoUntracedFormalPhase, verifiedHistoricalLineage } from "../integration-review-subject.mjs";

const OID = "a".repeat(40);
const TREE = "b".repeat(40);
const HASH = "c".repeat(64);
const REVIEW_REF = "reviews/results/historical-pass.json";
const ATTEMPT_REF = "reviews/attempts/historical-pass/attempt.json";
const TRACE_REF = `evidence/phases/phase-history/${TREE}/phase-map-trace-${HASH}.json`;
const LINEAGE_REF = `identity/phase-trace-lineage/phase-history-${TREE}-${HASH}.json`;
const SUPERSESSION_REF = (hash) => `identity/phase-trace-lineage-supersessions/phase-history-${TREE}-${hash}.json`;

function sha(raw) { return createHash("sha256").update(raw).digest("hex"); }
function binding(ref, value = HASH) { return { ref, sha256: value }; }

function reviewResult() {
  return {
    version: "wh-review-result.v1", task_id: "selector-lineage", stage: "build-code", review_track: null,
    subject_kind: "phase", phase_id: "phase-history", review_scope: "phase", base_tree: OID, candidate_tree: TREE,
    source: { target_commit: OID, base_commit: OID, base_tree: OID, captured_head: OID }, snapshot_tree: TREE,
    material_id: HASH, attempt_ref: ATTEMPT_REF,
    provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "historical pass", findings: [] } }],
    verdict: "pass", findings: [],
  };
}

function fixture(mode = "valid") {
  const reviewRaw = `${JSON.stringify(reviewResult())}\n`;
  const reviewHash = sha(reviewRaw);
  const trace = {
    traceRef: TRACE_REF, traceSha256: HASH,
    review: { value: { verdict: "pass" } },
    trace: {
      phase_id: "phase-history", snapshot_tree: TREE, material_id: HASH, verdict: "pass",
      canonical_phase_evidence: binding("evidence/phases/phase-history/evidence.json"),
      diff_scan: binding("evidence/phases/phase-history/diff.json"),
      implementation_receipt: binding("receipts/revisions/implementation/history.json"),
      green_test_receipt: binding("receipts/build-tests-history.json"), red_test_receipt: null,
      review_result: binding(REVIEW_REF, reviewHash), review_attempt: binding(ATTEMPT_REF),
    },
  };
  const lineage = {
    schema_version: "phase-trace-lineage-generation.v1", project_name: "workflowhub", task_id: "selector-lineage",
    stage: "build-code", phase_id: "phase-history", snapshot_tree: TREE, trace: binding(TRACE_REF),
    phase_evidence: trace.trace.canonical_phase_evidence, diff_scan: trace.trace.diff_scan,
    implementation_receipt: trace.trace.implementation_receipt, green_test_receipt: trace.trace.green_test_receipt,
    red_test_receipt: null, review_result: trace.trace.review_result, review_attempt: trace.trace.review_attempt,
    material_id: HASH, created_at: "2026-07-25T00:00:00.000Z", result: "bound",
  };
  if (mode === "tampered") lineage.trace = binding(TRACE_REF, "d".repeat(64));
  if (mode === "misbound") lineage.review_result = binding("reviews/results/other.json");
  if (mode === "nonpass") lineage.result = "rejected";
  const lineageRef = mode === "tampered"
    ? `identity/phase-trace-lineage/phase-history-${TREE}-${lineage.trace.sha256}.json`
    : LINEAGE_REF;
  const records = new Map([[REVIEW_REF, reviewRaw], [lineageRef, `${JSON.stringify(lineage)}\n`]]);
  const supersessions = [];
  if (mode === "superseded" || mode === "supersession-tampered") {
    const legacy = {
      ...lineage,
      phase_evidence: { ref: lineage.phase_evidence.ref }, diff_scan: { ref: lineage.diff_scan.ref },
      implementation_receipt: { ref: lineage.implementation_receipt.ref }, green_test_receipt: { ref: lineage.green_test_receipt.ref },
      review_result: { ref: lineage.review_result.ref }, review_attempt: { ref: lineage.review_attempt.ref },
    };
    const legacyRaw = `${JSON.stringify(legacy)}\n`; const legacyHash = sha(legacyRaw);
    records.set(LINEAGE_REF, legacyRaw);
    const supersession = {
      ...lineage, schema_version: "phase-trace-lineage-supersession.v1", supersedes: binding(LINEAGE_REF, legacyHash), result: "superseded",
    };
    if (mode === "supersession-tampered") supersession.green_test_receipt = binding("receipts/other.json");
    const ref = SUPERSESSION_REF(legacyHash);
    records.set(ref, `${JSON.stringify(supersession)}\n`); supersessions.push(ref);
  }
  const task = {
    identity: { projectName: "workflowhub", taskId: "selector-lineage" },
    listCanonicalPhaseTraceLineageRefs: () => [lineageRef],
    listCanonicalPhaseTraceLineageSupersessionRefs: () => supersessions,
    listCanonicalReviewResultRefs: () => [REVIEW_REF],
    readRecord: (ref) => {
      if (!records.has(ref)) throw new Error("missing");
      return records.get(ref);
    },
  };
  return { task, trace, reviewHash };
}

describe("integration selector historical lineage", () => {
  it("releases only a historical PASS that is bound to its exact canonical trace", () => {
    const f = fixture();
    const bindings = verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace });
    expect(bindings).toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: [{ review_result: binding("reviews/results/current-path.json"), base_tree: OID, snapshot_tree: TREE }],
      lineageReviews: bindings,
    })).not.toThrow();
  });

  for (const mode of ["tampered", "misbound", "nonpass"]) {
    it(`fails closed for ${mode} lineage`, () => {
      const f = fixture(mode);
      expect(() => verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
        .toThrow(/MATERIAL_INCOMPLETE/);
    });
  }

  it("releases only the narrowly verified missing-hash lineage through an append-only supersession", () => {
    const f = fixture("superseded");
    expect(verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
      .toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
  });

  it("fails closed for a tampered lineage supersession", () => {
    const f = fixture("supersession-tampered");
    expect(() => verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
      .toThrow(/MATERIAL_INCOMPLETE/);
  });

  it("does not release an unbound historical PASS", () => {
    const f = fixture();
    f.task.listCanonicalPhaseTraceLineageRefs = () => [];
    const bindings = verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace });
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: [{ review_result: binding("reviews/results/current-path.json"), base_tree: OID, snapshot_tree: TREE }],
      lineageReviews: bindings,
    })).toThrow(/formal PASS Phase review has no phase-map trace/);
  });
});
