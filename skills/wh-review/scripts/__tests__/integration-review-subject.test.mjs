import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  assertNoUntracedFormalPhase,
  prevalidatePhaseReviewCorrections,
  selectCanonicalPhaseTraces,
  verifiedHistoricalLineage,
  verifiedPhaseReviewCorrections,
} from "../integration-review-subject.mjs";

const OID = "a".repeat(40);
const TREE = "b".repeat(40);
const HASH = "c".repeat(64);
const REVIEW_REF = "reviews/results/historical-pass.json";
const ATTEMPT_REF = "reviews/attempts/historical-pass/attempt.json";
const TRACE_REF = `evidence/phases/phase-history/${TREE}/phase-map-trace-${HASH}.json`;
const LINEAGE_REF = `identity/phase-trace-lineage/phase-history-${TREE}-${HASH}.json`;
const SUPERSESSION_REF = (hash) => `identity/phase-trace-lineage-supersessions/phase-history-${TREE}-${hash}.json`;
const OLD_TREE = "d".repeat(40);
const NEW_TREE = "e".repeat(40);
const OLD_REVIEW_REF = "reviews/results/phase-history-old.json";
const NEW_REVIEW_REF = "reviews/results/phase-history-repaired.json";
const REPLACEMENT_TRACE_REF = `evidence/phases/phase-history/${NEW_TREE}/phase-map-trace-${HASH}.json`;

function sha(raw) { return createHash("sha256").update(raw).digest("hex"); }
function binding(ref, value = HASH) { return { ref, sha256: value }; }

function reviewResult(verdict = "pass") {
  const providerFinding = {
    severity: "major", path: "src/history.mjs", issue: "historical defect",
    recommendation: "repair the sibling snapshot",
  };
  const resultFinding = {
    provider: "fixture", severity: "major", path: "src/history.mjs",
    issue: "historical defect", recommendation: "repair the sibling snapshot",
  };
  return {
    version: "wh-review-result.v1", task_id: "selector-lineage", stage: "build-code", review_track: null,
    subject_kind: "phase", phase_id: "phase-history", review_scope: "phase", base_tree: OID, candidate_tree: TREE,
    source: { target_commit: OID, base_commit: OID, base_tree: OID, captured_head: OID }, snapshot_tree: TREE,
    material_id: HASH, attempt_ref: ATTEMPT_REF,
    provider_results: [{
      provider: "fixture",
      output: { verdict, summary: `historical ${verdict}`, findings: verdict === "pass" ? [] : [providerFinding] },
    }],
    verdict, findings: verdict === "pass" ? [] : [resultFinding],
  };
}

function fixture(mode = "valid") {
  const verdict = mode === "revise" ? "revise_required" : "pass";
  const reviewRaw = `${JSON.stringify(reviewResult(verdict))}\n`;
  const reviewHash = sha(reviewRaw);
  const trace = {
    traceRef: TRACE_REF, traceSha256: HASH,
    review: { ref: REVIEW_REF, hash: reviewHash, value: reviewResult(verdict) },
    trace: {
      phase_id: "phase-history", snapshot_tree: TREE, material_id: HASH, verdict,
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

function correctionFixture(overrides = {}) {
  const oldValue = {
    ...reviewResult("revise_required"),
    candidate_tree: OLD_TREE,
    snapshot_tree: OLD_TREE,
    source: { ...reviewResult().source, captured_head: OLD_TREE },
  };
  const newValue = {
    ...reviewResult("pass"),
    candidate_tree: NEW_TREE,
    snapshot_tree: NEW_TREE,
    source: { ...reviewResult().source, captured_head: NEW_TREE },
  };
  Object.assign(oldValue, overrides.oldReview);
  Object.assign(newValue, overrides.newReview);
  const oldRaw = `${JSON.stringify(oldValue)}\n`;
  const newRaw = `${JSON.stringify(newValue)}\n`;
  const oldHash = sha(oldRaw);
  const newHash = sha(newRaw);
  const replacementTrace = {
    traceRef: REPLACEMENT_TRACE_REF,
    traceSha256: HASH,
    review: { ref: NEW_REVIEW_REF, sha256: newHash, value: newValue },
    trace: {
      phase_id: "phase-history",
      base_tree: OID,
      snapshot_tree: NEW_TREE,
      verdict: "pass",
    },
  };
  Object.assign(replacementTrace.trace, overrides.replacementTrace);
  const correction = {
    schema_version: "phase-review-correction.v1",
    project_name: "workflowhub",
    task_id: "selector-lineage",
    stage: "build-code",
    phase_id: "phase-history",
    base_tree: OID,
    supersedes: binding(OLD_REVIEW_REF, oldHash),
    replacement: {
      ref: NEW_REVIEW_REF,
      sha256: newHash,
      snapshot_tree: NEW_TREE,
      trace: binding(REPLACEMENT_TRACE_REF),
    },
    reason_code: "historical_phase_repaired",
    created_at: "2026-07-25T00:00:00.000Z",
    result: "superseded",
    ...overrides.correction,
  };
  const correctionRaw = `${JSON.stringify(correction)}\n`;
  const correctionHash = sha(correctionRaw);
  const correctionRef = overrides.correctionRef
    ?? `identity/phase-review-corrections/phase-phase-history-${OLD_TREE}-${NEW_TREE}-${correctionHash}.json`;
  const records = new Map([
    [OLD_REVIEW_REF, oldRaw],
    [NEW_REVIEW_REF, newRaw],
    [correctionRef, correctionRaw],
  ]);
  const correctionRefs = [correctionRef];
  if (overrides.duplicate) {
    const duplicate = { ...correction, created_at: "2026-07-25T00:00:01.000Z" };
    const duplicateRaw = `${JSON.stringify(duplicate)}\n`;
    const duplicateHash = sha(duplicateRaw);
    const duplicateRef = `identity/phase-review-corrections/phase-phase-history-${OLD_TREE}-${NEW_TREE}-${duplicateHash}.json`;
    records.set(duplicateRef, duplicateRaw);
    correctionRefs.push(duplicateRef);
  }
  const task = {
    identity: { projectName: "workflowhub", taskId: "selector-lineage" },
    listCanonicalPhaseReviewCorrectionRefs: () => correctionRefs,
    listCanonicalReviewResultRefs: () => [OLD_REVIEW_REF],
    readRecord: (ref) => {
      if (!records.has(ref)) throw new Error("missing");
      return records.get(ref);
    },
  };
  return {
    task,
    replacementTrace,
    oldHash,
    newHash,
    coverage: [{
      review_result: binding(NEW_REVIEW_REF, newHash),
      base_tree: OID,
      snapshot_tree: NEW_TREE,
    }],
  };
}

describe("integration selector historical lineage", () => {
  it("releases a historical semantic review that is bound to its exact canonical trace", () => {
    const f = fixture();
    const bindings = verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace });
    expect(bindings).toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: [{ review_result: binding("reviews/results/current-path.json"), base_tree: OID, snapshot_tree: TREE }],
      lineageReviews: bindings,
    })).not.toThrow();
  });

  it("keeps revise_required as the bound historical quality verdict", () => {
    const f = fixture("revise");
    expect(verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
      .toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
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

  it("does not release an unbound historical semantic review", () => {
    const f = fixture();
    f.task.listCanonicalPhaseTraceLineageRefs = () => [];
    const bindings = verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace });
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: [{ review_result: binding("reviews/results/current-path.json"), base_tree: OID, snapshot_tree: TREE }],
      lineageReviews: bindings,
    })).toThrow(/formal Phase review has no phase-map trace/);
  });
});

describe("integration selector legacy Phase review corrections", () => {
  it("releases only an exact prevalidated correction on the selected replacement path", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    const corrections = verifiedPhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", coverage: f.coverage, prevalidated,
    });
    expect(corrections).toEqual(new Map([[OLD_REVIEW_REF, f.oldHash]]));
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: f.coverage,
      lineageReviews: new Map(),
      correctionReviews: corrections,
    })).not.toThrow();
  });

  it("preserves behavior when the task has no correction reader", () => {
    const f = correctionFixture();
    delete f.task.listCanonicalPhaseReviewCorrectionRefs;
    expect(prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    })).toEqual(new Map());
  });

  it("fails closed for a filename content hash mismatch", () => {
    const f = correctionFixture({
      correctionRef: `identity/phase-review-corrections/phase-phase-history-${OLD_TREE}-${NEW_TREE}-${"f".repeat(64)}.json`,
    });
    expect(() => prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    })).toThrow(/correction ref is invalid/);
  });

  for (const [label, overrides] of [
    ["wrong task", { oldReview: { task_id: "other-task" } }],
    ["wrong phase", { newReview: { phase_id: "other-phase" } }],
    ["wrong base", { oldReview: { base_tree: "f".repeat(40) } }],
    ["wrong old verdict", { oldReview: { verdict: "pass" } }],
    ["wrong replacement verdict", { newReview: { verdict: "revise_required" } }],
  ]) {
    it(`fails closed for ${label}`, () => {
      const f = correctionFixture(overrides);
      expect(() => prevalidatePhaseReviewCorrections({
        task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
      })).toThrow(/MATERIAL_INCOMPLETE/);
    });
  }

  it("fails closed for duplicate superseded reviews", () => {
    const f = correctionFixture({ duplicate: true });
    expect(() => prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    })).toThrow(/duplicates a historical review/);
  });

  it("fails closed when the replacement review is not on the selected path", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    expect(() => verifiedPhaseReviewCorrections({
      task: f.task,
      sourceRoot: "fixture",
      coverage: [{ review_result: binding("reviews/results/other.json"), base_tree: OID, snapshot_tree: NEW_TREE }],
      prevalidated,
    })).toThrow(/replacement is not in path/);
  });

  it("fails closed when the superseded snapshot remains on the selected path", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    expect(() => verifiedPhaseReviewCorrections({
      task: f.task,
      sourceRoot: "fixture",
      coverage: [...f.coverage, { review_result: null, base_tree: OLD_TREE, snapshot_tree: "f".repeat(40) }],
      prevalidated,
    })).toThrow(/superseded snapshot is in path/);
  });

  it("does not release the same review ref when its trace binding has the wrong hash", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    expect(prevalidated.get(OLD_REVIEW_REF)?.sha256).toBe(f.oldHash);
    expect(prevalidated.get(OLD_REVIEW_REF)?.sha256).not.toBe("f".repeat(64));
    expect(() => assertNoUntracedFormalPhase({
      task: {
        ...f.task,
        readRecord: (ref) => {
          if (ref === OLD_REVIEW_REF) {
            const changed = `${JSON.stringify({ ...reviewResult("revise_required"), candidate_tree: OLD_TREE, snapshot_tree: OLD_TREE })}\n`;
            return changed;
          }
          return f.task.readRecord(ref);
        },
      },
      coverage: [{ review_result: null, base_tree: OID, snapshot_tree: OLD_TREE }],
      lineageReviews: new Map(),
      correctionReviews: new Map([[OLD_REVIEW_REF, f.oldHash]]),
    })).toThrow(/formal Phase review has no phase-map trace/);
  });

  it("does not skip an invalid trace when only the superseded review ref matches", () => {
    const traceRef = `evidence/phases/phase-history/${OLD_TREE}/phase-map-trace-${"9".repeat(64)}.json`;
    const original = new Error("canonical Phase trace is invalid: fixture failure");
    const task = {
      listCanonicalPhaseMapTraceRefs: () => [traceRef],
      readRecord: () => `${JSON.stringify({
        review_result: { ref: OLD_REVIEW_REF, sha256: "f".repeat(64) },
      })}\n`,
    };
    const corrections = new Map([[OLD_REVIEW_REF, { sha256: "e".repeat(64) }]]);

    expect(() => selectCanonicalPhaseTraces({
      task,
      sourceRoot: "fixture",
      corrections,
      readTrace: () => { throw original; },
    })).toThrow(original);
  });
});
