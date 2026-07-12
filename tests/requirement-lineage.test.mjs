import { describe, expect, it } from "vitest";
import {
  calculateCoverage,
  computeRequirementContentHash,
  propagateStale,
  validateRequirementLedger,
  verifyRequirementHashes,
} from "../core/requirement-ledger.mjs";

function ref(kind, id, content_hash = `hash-${id}`) {
  return { kind, uri_or_path: `memory://${kind}/${id}`, content_hash };
}

function requirement(requirement_id, status = "accepted") {
  const record = {
    requirement_id,
    status,
    source_ref: ref("source", requirement_id),
    decision_ref: ref("decision", requirement_id),
    artifact_refs: [ref("artifact", requirement_id)],
    acceptance_criteria_refs: [ref("acceptance", requirement_id)],
    upstream_hashes: [`hash-source-${requirement_id}`, `hash-decision-${requirement_id}`],
    stale: false,
  };
  record.content_hash = computeRequirementContentHash(record);
  return record;
}

function ledger() {
  return {
    schema_version: "1.0.0",
    requirements: [
      ...Array.from({ length: 9 }, (_, index) => requirement(`R${index + 1}`)),
      requirement("R10", "withdrawn"),
    ],
  };
}

describe("immutable requirement ledger", () => {
  it("validates full source-to-decision-to-artifact-to-acceptance lineage for R1–R9", () => {
    expect(validateRequirementLedger(ledger())).toEqual({ ok: true, errors: [] });
  });

  it("reports 9/9 accepted coverage and excludes withdrawn R10 from the denominator", () => {
    expect(calculateCoverage(ledger())).toEqual({
      covered: 9,
      total: 9,
      withdrawn: 1,
      missing_ids: [],
    });
  });

  it("rejects an accepted requirement without acceptance-criteria lineage", () => {
    const input = ledger();
    input.requirements[0].acceptance_criteria_refs = [];
    input.requirements[0].content_hash = computeRequirementContentHash(input.requirements[0]);

    const result = validateRequirementLedger(input);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/R1.*acceptance|acceptance.*R1/i);
  });

  it("rejects a withdrawn requirement without source lineage", () => {
    const input = ledger();
    const withdrawn = input.requirements.find((item) => item.requirement_id === "R10");
    delete withdrawn.source_ref;
    withdrawn.content_hash = computeRequirementContentHash(withdrawn);

    const result = validateRequirementLedger(input);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/R10.*source|source.*R10/i);
  });

  it("rejects a withdrawn requirement without artifact lineage", () => {
    const input = ledger();
    const withdrawn = input.requirements.find((item) => item.requirement_id === "R10");
    delete withdrawn.artifact_refs;
    withdrawn.content_hash = computeRequirementContentHash(withdrawn);

    const result = validateRequirementLedger(input);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/R10.*artifact|artifact.*R10/i);
  });

  it("accepts a withdrawn requirement with empty lineage arrays", () => {
    const input = ledger();
    const withdrawn = input.requirements.find((item) => item.requirement_id === "R10");
    withdrawn.artifact_refs = [];
    withdrawn.acceptance_criteria_refs = [];
    withdrawn.content_hash = computeRequirementContentHash(withdrawn);

    expect(validateRequirementLedger(input)).toEqual({ ok: true, errors: [] });
  });

  it("rejects a tampered requirement content hash", () => {
    const input = ledger();
    input.requirements[0].content_hash = "tampered";

    const result = verifyRequirementHashes(input);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/R1.*hash|hash.*R1/i);
  });

  it("propagates stale state without replacing acceptance lineage or changing its content hash", () => {
    const input = ledger();
    const originalHash = input.requirements[0].content_hash;
    const originalAcceptanceRefs = structuredClone(input.requirements[0].acceptance_criteria_refs);
    const changedDecisionHash = input.requirements[0].decision_ref.content_hash;

    const result = propagateStale(input, [changedDecisionHash]);
    const r1 = result.requirements.find((item) => item.requirement_id === "R1");

    expect(r1.stale).toBe(true);
    expect(r1.artifact_refs.every((item) => item.stale === true)).toBe(true);
    expect(r1.acceptance_criteria_refs.every((item) => item.stale === true)).toBe(true);
    expect(r1.acceptance_criteria_refs).toEqual(originalAcceptanceRefs.map((item) => ({ ...item, stale: true })));
    expect(computeRequirementContentHash(r1)).toBe(originalHash);
    expect(result.requirements.find((item) => item.requirement_id === "R2").stale).toBe(false);
  });

  it("does not mark incomplete lineage stale when changed hashes contain undefined", () => {
    const input = ledger();
    delete input.requirements[0].source_ref;

    const result = propagateStale(input, [undefined]);

    expect(result.requirements[0].stale).toBe(false);
  });
});
