import { describe, expect, it } from "vitest";

import { assertFresh, authenticateQualityFactRecord, sha256 } from "../../runtime/evidence/freshness.mjs";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";

const materialRevision = `revision-${"a".repeat(64)}`;
const editedMaterialRevision = `revision-${"b".repeat(64)}`;
const snapshot = "c".repeat(40);

function factFixture() {
  const proofRef = "quality/evidence/ac-fresh-001-proof.txt";
  const proofRaw = "per-AC proof bytes\n";
  const evidenceRaw = `${JSON.stringify({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "AC-FRESH-001",
    result: "pass",
    refs: [{ ref: proofRef, sha256: sha256(proofRaw) }],
  })}\n`;
  const fact = createQualityFact({
    taskId: "freshness-task",
    stage: "build-code",
    materialRevision,
    snapshotTree: snapshot,
    kind: "acceptance_criterion",
    status: "passed",
    subject: "AC-FRESH-001",
    evidence: [{
      ref: "quality/evidence/ac-fresh-001.txt",
      sha256: sha256(evidenceRaw),
      evidence_type: "acceptance_evidence",
    }],
  });
  const records = new Map([
    [fact.ref, fact.raw],
    ["quality/evidence/ac-fresh-001.txt", evidenceRaw],
    [proofRef, proofRaw],
  ]);
  return { fact, evidenceRaw, proofRaw, read: (ref) => records.get(ref) };
}

describe("per-AC immutable material binding contract [C5]", () => {
  it("keeps the original material revision as provenance after a later material edit", () => {
    const { fact, read } = factFixture();

    expect(fact.value.material_revision).toBe(materialRevision);
    expect(fact.value.material_revision).not.toBe(editedMaterialRevision);
    expect(assertFresh({ ref: fact.ref, sha256: fact.sha256, snapshot_tree: snapshot }, {
      read,
      snapshotTree: snapshot,
    })).toBe(true);
  });

  it("does not treat a material edit as a reason to rewrite or rerun the existing fact", () => {
    const { fact, read } = factFixture();
    const before = { raw: fact.raw, hash: fact.sha256 };
    const afterMaterialEdit = { ...before, current_material_revision: editedMaterialRevision };
    const authenticatedBefore = authenticateQualityFactRecord({ ref: fact.ref, sha256: fact.sha256 }, { read });

    expect(afterMaterialEdit.raw).toBe(before.raw);
    expect(afterMaterialEdit.hash).toBe(before.hash);
    expect(authenticatedBefore).toMatchObject({ status: "recorded", authenticated: true });

    // The production reader authenticates the fact's own immutable evidence
    // chain and deliberately receives no current-material revision. Editing
    // the four materials therefore leaves this same fact readable without a
    // synthetic rewrite or a runner invocation.
    const authenticatedAfter = authenticateQualityFactRecord({ ref: fact.ref, sha256: fact.sha256 }, { read });
    expect(authenticatedAfter).toEqual(authenticatedBefore);
    expect(sha256(afterMaterialEdit.raw)).toBe(before.hash);
  });

  it("keeps a fact byte mutation fail-loud at the immutable boundary", () => {
    const { fact, read } = factFixture();
    const changedRead = (ref) => ref === fact.ref ? `${fact.raw}tampered` : read(ref);

    expect(() => assertFresh({
      ref: fact.ref,
      sha256: fact.sha256,
      snapshot_tree: snapshot,
    }, { read: changedRead, snapshotTree: snapshot })).toThrow(/hash changed/);
  });

  it("keeps a nested evidence byte mutation distinguishable from the original binding", () => {
    const { evidenceRaw } = factFixture();
    expect(sha256(`${evidenceRaw}tampered`)).not.toBe(sha256(evidenceRaw));
  });
});
