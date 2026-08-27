import { sha256 } from "./freshness.mjs";
import { STAGE_FACT_MATERIALS } from "../stage/completion-predicates.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const KINDS = new Set(["test", "review", "acceptance_criterion", "confirmation"]);
const STATUSES = new Set(["passed", "failed", "unavailable", "missing", "recorded"]);
const REVIEW_STATUSES = new Set(["clean", "findings", "resolved", "unavailable"]);
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
    ...(value?.material_scope === undefined ? {} : { material_scope: value.material_scope }),
    ...(value?.material_scope_revision === undefined ? {} : { material_scope_revision: value.material_scope_revision }),
    snapshot_tree: value?.snapshot_tree,
    kind: value?.kind,
    status: value?.status,
    ...(value?.review_status === undefined ? {} : { review_status: value.review_status }),
    subject: value?.subject,
    evidence: value?.evidence,
  };
}

export function qualityFactDigest(value) {
  return sha256(JSON.stringify(qualityFactIdentity(value)));
}

export function createQualityFact({ taskId, stage, materialRevision, materialScope, materialScopeRevision, snapshotTree, kind, status, reviewStatus, subject, evidence = [], recordedAt = new Date().toISOString() }) {
  if (typeof taskId !== "string" || taskId.trim() === "" || !STAGES.has(stage)) throw new TypeError("quality fact identity is invalid");
  if (!/^revision-[a-f0-9]{64}$/.test(materialRevision ?? "") || typeof snapshotTree !== "string" || snapshotTree.trim() === "") throw new TypeError("quality fact material revision and snapshot tree are required");
  if (materialScope !== undefined || materialScopeRevision !== undefined) {
    if (!Array.isArray(materialScope) || materialScope.length === 0 || materialScope.some((file) => typeof file !== "string" || file.trim() === "")) {
      throw new TypeError("quality fact material scope is invalid");
    }
    if (JSON.stringify(materialScope) !== JSON.stringify(STAGE_FACT_MATERIALS[stage])) {
      throw new TypeError("quality fact material scope must match the fixed stage scope");
    }
    if (!/^revision-[a-f0-9]{64}$/.test(materialScopeRevision ?? "")) throw new TypeError("quality fact material scope revision is invalid");
  }
  if (!KINDS.has(kind) || typeof subject !== "string" || subject.trim() === "") throw new TypeError("quality fact kind and subject are required");
  if (!STATUSES.has(status)) throw new TypeError("quality fact status is invalid");
  if (status === "recorded" && kind !== "review") throw new TypeError("recorded quality fact status is only valid for review facts");
  if (reviewStatus !== undefined && (kind !== "review" || !REVIEW_STATUSES.has(reviewStatus))) throw new TypeError("quality fact reviewStatus is invalid");
  if (reviewStatus !== undefined && reviewStatus === "resolved"
      && (stage !== "verify-code" || subject !== "code_review")) {
    throw new TypeError("resolved quality fact reviewStatus is only valid for verify-code code_review");
  }
  if (!Array.isArray(evidence) || evidence.length === 0 || evidence.some((entry) =>
    !entry || typeof entry !== "object" || typeof entry.ref !== "string"
    || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || entry.evidence_type !== EVIDENCE_TYPES[kind])) {
    throw new TypeError("quality fact requires typed canonical evidence");
  }
  if (!Number.isFinite(Date.parse(recordedAt))) throw new TypeError("quality fact recordedAt is invalid");
  const identity = qualityFactIdentity({
    task_id: taskId, stage, material_revision: materialRevision, snapshot_tree: snapshotTree,
    ...(materialScope === undefined ? {} : { material_scope: [...materialScope], material_scope_revision: materialScopeRevision }),
    kind, status, ...(reviewStatus === undefined ? {} : { review_status: reviewStatus }), subject, evidence,
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
