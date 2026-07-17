import { createHash } from "node:crypto";
import { assertTaskHandle } from "./task-handle.mjs";
import { validateAccepted, validateAttempt } from "./task-kernel-implementation.mjs";

const OID = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const brand = new WeakSet();

function sha(raw) { return createHash("sha256").update(raw).digest("hex"); }
function exact(value, allowed, label) { const unknown = Object.keys(value).filter((key) => !allowed.has(key)); if (unknown.length) throw new TypeError(`${label} contains unknown fields: ${unknown.join(", ")}`); }
function validateArtifacts(artifacts, label) {
  if (!Array.isArray(artifacts)) throw new TypeError(`${label} artifacts must be an array`);
  for (const item of artifacts) { if (!item || typeof item !== "object" || Array.isArray(item)) throw new TypeError(`${label} artifact must be an object`); exact(item, new Set(["path", "blob_oid", "content_hash"]), `${label} artifact`); if (typeof item.path !== "string" || item.path.startsWith("/") || !OID.test(item.blob_oid) || !HASH.test(item.content_hash)) throw new Error(`${label} artifact fields invalid`); }
}
function readonly(kind, ref, raw, value) {
  const result = Object.freeze({ kind, ref, sha256: sha(raw), raw, value: Object.freeze(structuredClone(value)) });
  brand.add(result); return result;
}
export function assertLegacyReadResult(value) {
  if (!brand.has(value)) throw new TypeError("branded readonly legacy result required");
  return value;
}
export function validateFrozenLegacyV2Pair({ attemptRaw, acceptedRaw } = {}) {
  if (typeof attemptRaw !== "string" || typeof acceptedRaw !== "string") throw new TypeError("frozen legacy pair requires exact raw bytes");
  const attempt = JSON.parse(attemptRaw); const accepted = JSON.parse(acceptedRaw);
  exact(attempt, new Set(["schema_version", "task_id", "stage", "attempt_id", "created_at", "facts", "evidence_refs", "missing_items", "upstream_refs", "checkpoint", "reason"]), "frozen legacy attempt");
  exact(accepted, new Set(["schema_version", "task_id", "stage", "attempt_ref", "integrity_hash", "acceptance_mode", "human_confirmation_ref", "accepted_at", "upstream_refs", "checkpoint"]), "frozen legacy accepted");
  if (attempt.schema_version !== "task-attempt.v2" || accepted.schema_version !== "task-accepted.v2" || attempt.task_id !== accepted.task_id || attempt.stage !== accepted.stage || !Number.isFinite(Date.parse(attempt.created_at)) || !Number.isFinite(Date.parse(accepted.accepted_at))) throw new Error("frozen legacy v2 pair identity invalid");
  if (!Array.isArray(attempt.evidence_refs) || !Array.isArray(attempt.missing_items) || !Array.isArray(attempt.upstream_refs) || !Array.isArray(accepted.upstream_refs) || typeof attempt.facts !== "object" || Array.isArray(attempt.facts)) throw new Error("frozen legacy v2 pair structure invalid");
  if (accepted.checkpoint) validateLegacyCheckpoint(accepted.checkpoint); if (attempt.checkpoint) validateLegacyCheckpoint(attempt.checkpoint);
  const actual = sha(attemptRaw); const declared = String(accepted.integrity_hash).replace(/^sha256:/, "");
  return readonly("frozen-task-v2-pair", "fixture-pair", `${attemptRaw}${acceptedRaw}`, { attempt, accepted, integrity: { declared, actual, matches: declared === actual } });
}
export function validateLegacyCheckpoint(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("legacy checkpoint must be an object");
  const materialized = Object.prototype.hasOwnProperty.call(value, "ref");
  const allowed = materialized ? new Set(["ref", "commit_oid", "tree_oid", "artifacts"]) : new Set(["schema_version", "stage", "parent_commit", "artifacts", "plan_hash"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError("legacy checkpoint contains unknown fields");
  if (materialized) {
    if (typeof value.ref !== "string" || !value.ref.startsWith("refs/workflowhub/checkpoints/") || !OID.test(value.commit_oid) || !OID.test(value.tree_oid) || !Array.isArray(value.artifacts)) throw new Error("legacy materialized checkpoint fields invalid");
    validateArtifacts(value.artifacts, "legacy materialized checkpoint");
    return Object.freeze(structuredClone(value));
  }
  if (value.schema_version !== "git-checkpoint-plan.v1" || !["build-spec", "build-plan"].includes(value.stage)) throw new Error("legacy checkpoint schema/stage invalid");
  if (!OID.test(value.parent_commit) || !HASH.test(value.plan_hash) || !Array.isArray(value.artifacts)) throw new Error("legacy checkpoint fields invalid");
  validateArtifacts(value.artifacts, "legacy checkpoint plan");
  return Object.freeze(structuredClone(value));
}
export function readLegacyAcceptedRecord(taskHandle, stage) {
  const task = assertTaskHandle(taskHandle);
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  const ref = `results/${stage}/accepted.json`; const raw = task.readRecord(ref); const value = JSON.parse(raw);
  if (value.schema_version !== "task-accepted.v2") throw new Error("legacy reader accepts only task-accepted.v2");
  exact(value, new Set(["schema_version", "task_id", "stage", "attempt_ref", "integrity_hash", "acceptance_mode", "human_confirmation_ref", "accepted_at", "upstream_refs", "checkpoint"]), "legacy accepted");
  validateAccepted(value, { taskId: task.identity.taskId, stage });
  const attemptRef = `results/${stage}/${value.attempt_ref}`; const attemptRaw = task.readRecord(attemptRef); const attempt = JSON.parse(attemptRaw);
  exact(attempt, new Set(["schema_version", "task_id", "stage", "attempt_id", "created_at", "facts", "evidence_refs", "missing_items", "upstream_refs", "checkpoint", "reason"]), "legacy attempt");
  validateAttempt(attempt, { taskId: task.identity.taskId, stage });
  if (sha(attemptRaw) !== String(value.integrity_hash).replace(/^sha256:/, "")) throw new Error("legacy accepted attempt hash mismatch");
  if (attempt.checkpoint) validateLegacyCheckpoint(attempt.checkpoint);
  return readonly("task-accepted.v2", ref, raw, value);
}
export function readAcceptedRecordExact(taskHandle, stage) {
  const task = assertTaskHandle(taskHandle); const ref = `results/${stage}/accepted.json`; const raw = task.readRecord(ref); const value = JSON.parse(raw);
  if (value.schema_version === "task-accepted.v2") return readLegacyAcceptedRecord(task, stage);
  if (value.schema_version === "task-accepted.v1") throw new Error("task-accepted.v1 exact validator is not installed; refusing unvalidated record");
  throw new Error(`unsupported accepted record schema_version: ${value.schema_version}`);
}
