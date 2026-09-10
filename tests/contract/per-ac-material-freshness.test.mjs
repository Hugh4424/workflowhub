import { describe, expect, it } from "vitest";

import { evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";
import { deriveCurrentProductRelease } from "../../runtime/stage/completion-predicates.mjs";

const oldRevision = "a".repeat(64);
const currentRevision = "b".repeat(64);
const snapshot = "c".repeat(40);

function factFixture(overrides = {}) {
  const proofRaw = "freshness proof\n";
  const acceptanceRaw = `${JSON.stringify({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "AC-FRESH-001",
    result: "pass",
    refs: [{ ref: "quality/evidence/ac-fresh-001-proof.txt", sha256: sha256(proofRaw) }],
    snapshot_tree: snapshot,
  })}\n`;
  const fact = {
    schema_version: "quality-fact.v1",
    fact_id: "fact-freshness-001",
    task_id: "freshness-task",
    stage: "build-code",
    material_revision: oldRevision,
    snapshot_tree: snapshot,
    kind: "acceptance_criterion",
    status: "passed",
    subject: "AC-FRESH-001",
    ref: "quality/facts/freshness-fact.json",
    evidence: [{
      ref: "quality/evidence/ac-fresh-001.json",
      sha256: sha256(acceptanceRaw),
      evidence_type: "acceptance_evidence",
    }],
    ...overrides,
  };
  const raw = JSON.stringify(fact);
  const records = new Map([
    [fact.ref, raw],
    ["quality/evidence/ac-fresh-001.json", acceptanceRaw],
    ["quality/evidence/ac-fresh-001-proof.txt", proofRaw],
  ]);
  return { fact: { ...fact, sha256: sha256(raw) }, raw, read: (ref) => records.get(ref) };
}

describe("per-AC material freshness contract [P5]", () => {
  it("keeps an AC fact current when only the bound material revision changes", () => {
    const { fact, read } = factFixture();
    const result = evaluateFactFreshness(fact, {
      task_id: fact.task_id,
      material_revision: currentRevision,
      snapshot_tree: snapshot,
    }, { read });
    expect(result).toMatchObject({ status: "current", authenticated: true, dependencies: { material: "current", tree: "current", fact: "current" } });
    expect(result.provenance?.material_revision ?? fact.material_revision).toBe(oldRevision);
  });

  it("exposes the material-revision-only AC through the current product projection", () => {
    const { fact, read } = factFixture();
    const projection = deriveCurrentProductRelease({
      task_id: fact.task_id,
      read,
      refs: [fact.ref],
      snapshot_tree: snapshot,
      material_revision: currentRevision,
      expected_acceptance_ids: [fact.subject],
      evaluate_freshness: evaluateFactFreshness,
    });
    expect(projection.input_refs).toEqual(expect.arrayContaining([{ ref: fact.ref, hash: expect.any(String) }]));
    expect(projection.reasons).not.toContain(`acceptance_result_missing:${fact.subject}`);
  });

  it("does not tolerate a material-revision-only change for non-AC facts", () => {
    const { fact, read } = factFixture({
      kind: "test",
      subject: "integration_tests",
      evidence: [],
    });
    expect(evaluateFactFreshness(fact, {
      task_id: fact.task_id,
      material_revision: currentRevision,
      snapshot_tree: snapshot,
    }, { read }).status).toBe("stale");
  });

  it.each([
    ["snapshot_tree", { snapshot_tree: "d".repeat(40) }],
    ["fact bytes", { fact_id: "tampered-fact" }],
  ])("marks %s changes stale instead of reusing the fact", (_label, change) => {
    const { fact, read } = factFixture();
    const result = evaluateFactFreshness(fact, {
      task_id: fact.task_id,
      material_revision: currentRevision,
      snapshot_tree: change.snapshot_tree ?? snapshot,
    }, { read: (ref) => change.fact_id && ref === fact.ref
      ? JSON.stringify({ ...JSON.parse(read(ref)), fact_id: change.fact_id })
      : read(ref) });
    expect(result.status).toBe("stale");
    expect(result.authenticated).toBe(false);
  });
});
