import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { deriveCurrentProductRelease, deriveProductRelease } from "../../runtime/stage/completion-predicates.mjs";

const taskId = "task";
const snapshotTree = "a".repeat(40);
const materialRevision = `revision-${"b".repeat(64)}`;
const identity = { task_id: taskId, material_revision: materialRevision, snapshot_tree: snapshotTree };

function rawFact({ stage = "verify-code", subject = "AC-1", status = "passed", recorded_at = "2026-09-10T01:00:00.000Z" } = {}) {
  return `${JSON.stringify({
    schema_version: "quality-fact.v1",
    fact_id: `${stage}-${subject}-${recorded_at}`,
    ...identity,
    stage,
    kind: "acceptance_criterion",
    subject,
    status,
    recorded_at,
  })}\n`;
}

function currentProduct(refs, records, expectedAcceptanceIds = ["AC-1"]) {
  return deriveCurrentProductRelease({
    ...identity,
    refs,
    read: (ref) => records.get(ref),
    expected_acceptance_ids: expectedAcceptanceIds,
    evaluate_freshness: () => ({ status: "current", authenticated: true }),
  });
}

function allStageCompletions() {
  return ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].map((stage, index) => ({
    stage,
    status: "completed",
    current: true,
    ...identity,
    ref: `quality/facts/stage-${index}.json`,
    hash: "c".repeat(64),
  }));
}

describe("S7 current per-AC authority boundary", () => {
  it.each([
    ["make-decision", "AC-1"],
    ["build-spec", "AC-1"],
    ["build-plan", "AC-1"],
    ["verify-code", "not-an-ac"],
  ])("rejects %s/%s facts from the product authority", (stage, subject) => {
    const ref = `quality/facts/${stage}-${subject}.json`;
    const records = new Map([[ref, rawFact({ stage, subject })]]);
    const result = currentProduct([ref], records);

    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_result_missing:AC-1");
  });

  it("fails closed for tied latest facts instead of choosing by filename or insertion order", () => {
    const firstRef = "quality/facts/ac-1-first.json";
    const secondRef = "quality/facts/ac-1-second.json";
    const records = new Map([
      [firstRef, rawFact({ recorded_at: "2026-09-10T01:00:00.000Z" })],
      [secondRef, rawFact({ recorded_at: "2026-09-10T01:00:00.000Z" })],
    ]);
    const result = currentProduct([secondRef, firstRef], records);

    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_result_conflicting:AC-1");
  });

  it("fails closed for a bad recorded_at rather than treating it as current", () => {
    const ref = "quality/facts/ac-1-bad-time.json";
    const result = currentProduct([ref], new Map([[ref, rawFact({ recorded_at: "not-a-time" })]]));

    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_result_missing:AC-1");
  });

  it("accepts only the uniquely latest current fact and keeps the canonical result shape", () => {
    const olderRef = "quality/facts/ac-1-old.json";
    const newerRef = "quality/facts/ac-1-new.json";
    const records = new Map([
      [olderRef, rawFact({ status: "failed", recorded_at: "2026-09-10T01:00:00.000Z" })],
      [newerRef, rawFact({ status: "passed", recorded_at: "2026-09-10T02:00:00.000Z" })],
    ]);
    const result = currentProduct([olderRef, newerRef], records);

    expect(result.reasons).not.toContain("acceptance_result_not_pass:AC-1:failed");
  });

  it("does not let a current failed verify summary fall back to a passing stage leaf", () => {
    const ref = "quality/facts/build-ac.json";
    const verifyRef = "quality/verify.json";
    const records = new Map([
      [ref, rawFact({ stage: "build-code", status: "passed" })],
      [verifyRef, `${JSON.stringify({
        schema_version: "quality-verify.v1",
        task_id: taskId,
        stage: "verify-code",
        status: "failed",
        material_revision: materialRevision,
        material_digest: materialRevision.slice("revision-".length),
        snapshot_tree: snapshotTree,
        source_digest: "c".repeat(64),
        evidence_ref: "quality/evidence/verify-source.json",
        evidence_hash: "d".repeat(64),
        criteria: [],
      })}\n`],
    ]);

    const result = currentProduct([ref, verifyRef], records);

    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_result_not_pass:AC-1:failed");
  });

  it("does not create a second product authority from a parallel result input", () => {
    const result = deriveProductRelease({
      stage_completions: allStageCompletions(),
      acceptance_results: [{ ...identity, acceptance_criterion_id: "AC-1", result: "pass", status: "passed", current: true, ref: "quality/verify.json", hash: "d".repeat(64) }],
      product_results: [{ ...identity, acceptance_criterion_id: "AC-1", result: "pass", status: "passed", current: true, ref: "quality/parallel.json", hash: "e".repeat(64) }],
      expected_acceptance_ids: ["AC-1"],
    });

    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_results_product_results_conflict");
  });
});
