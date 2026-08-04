import { sha256 } from "./freshness.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const KINDS = new Set(["test", "review", "acceptance_criterion", "confirmation"]);
const EVIDENCE_TYPES = Object.freeze({
  test: "test_receipt",
  review: "review_result",
  acceptance_criterion: "acceptance_evidence",
  confirmation: "human_confirmation",
});

/** Fields that define an immutable quality fact's content identity. */
export function qualityFactIdentity(value) {
  return {
    task_id: value?.task_id,
    stage: value?.stage,
    material_revision: value?.material_revision,
    snapshot_tree: value?.snapshot_tree,
    kind: value?.kind,
    status: value?.status,
    subject: value?.subject,
    evidence: value?.evidence,
  };
}

export function qualityFactDigest(value) {
  return sha256(JSON.stringify(qualityFactIdentity(value)));
}

export function createQualityFact({ taskId, stage, materialRevision, snapshotTree, kind, status, subject, evidence = [], recordedAt = new Date().toISOString() }) {
  if (typeof taskId !== "string" || taskId.trim() === "" || !STAGES.has(stage)) throw new TypeError("quality fact identity is invalid");
  if (!/^revision-[a-f0-9]{64}$/.test(materialRevision ?? "") || typeof snapshotTree !== "string" || snapshotTree.trim() === "") throw new TypeError("quality fact material revision and snapshot tree are required");
  if (!KINDS.has(kind) || typeof subject !== "string" || subject.trim() === "") throw new TypeError("quality fact kind and subject are required");
  if (!new Set(["passed", "failed", "unavailable", "missing"]).has(status)) throw new TypeError("quality fact status is invalid");
  if (!Array.isArray(evidence) || evidence.length === 0 || evidence.some((entry) =>
    !entry || typeof entry !== "object" || typeof entry.ref !== "string"
    || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || entry.evidence_type !== EVIDENCE_TYPES[kind])) {
    throw new TypeError("quality fact requires typed canonical evidence");
  }
  if (!Number.isFinite(Date.parse(recordedAt))) throw new TypeError("quality fact recordedAt is invalid");
  const identity = qualityFactIdentity({
    task_id: taskId, stage, material_revision: materialRevision, snapshot_tree: snapshotTree,
    kind, status, subject, evidence,
  });
  const digest = qualityFactDigest(identity);
  const value = Object.freeze({ schema_version: "quality-fact.v1", fact_id: `quality-${digest}`, ...identity, recorded_at: recordedAt });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  return Object.freeze({ value, raw, ref: `quality/facts/${digest}.json`, sha256: sha256(raw) });
}

export function publishQualityFact({ fact, read, create }) {
  let existing;
  try { existing = read(fact.ref); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (existing !== undefined) {
    const current = JSON.parse(existing);
    const { recorded_at: _currentTime, ...currentLogical } = current;
    const { recorded_at: _nextTime, ...nextLogical } = fact.value;
    if (JSON.stringify(currentLogical) !== JSON.stringify(nextLogical)) throw new Error("quality fact identity collision");
    return Object.freeze({ ref: fact.ref, sha256: sha256(existing), idempotent: true });
  }
  try { create(fact.ref, fact.raw); } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const winner = JSON.parse(read(fact.ref));
    const { recorded_at: _winnerTime, ...winnerLogical } = winner;
    const { recorded_at: _nextTime, ...nextLogical } = fact.value;
    if (JSON.stringify(winnerLogical) !== JSON.stringify(nextLogical)) throw new Error("quality fact identity collision");
    return Object.freeze({ ref: fact.ref, sha256: sha256(read(fact.ref)), idempotent: true });
  }
  return Object.freeze({ ref: fact.ref, sha256: fact.sha256, idempotent: false });
}
