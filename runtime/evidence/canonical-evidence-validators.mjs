import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const hashText = (value) => createHash("sha256").update(value).digest("hex");

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

export function validateCanonicalTestReceipt(value, {
  taskId, stage, snapshotTree, subject, requirePassed = false,
} = {}) {
  object(value, "canonical test receipt");
  if (value.schema_version !== "workflowhub-receipt.v1"
      || value.task_id !== taskId || value.stage !== stage
      || value.producer?.stage !== stage
      || typeof value.producer?.component !== "string" || value.producer.component.trim() === ""
      || value.snapshot_tree !== snapshotTree || !OID.test(value.snapshot_tree ?? "")
      || !HASH.test(value.command_hash ?? "")
      || hashText(value.command ?? "") !== value.command_hash
      || !Number.isInteger(value.exit_code)
      || !HASH.test(value.output_hash ?? "") || typeof value.output_ref !== "string") {
    throw new Error("canonical test receipt provenance is invalid");
  }
  if (value.source_digest !== undefined && !HASH.test(value.source_digest)) throw new Error("canonical test receipt source_digest is invalid");
  if (requirePassed && value.exit_code !== 0) throw new Error("canonical test receipt did not pass");
  return value;
}

export function validateHumanConfirmation(value, {
  taskId, stage, subject, requireAccepted = false,
} = {}) {
  object(value, "human confirmation");
  if (value.schema_version === "human-confirmation.v2") {
    const allowed = new Set(["schema_version", "task_id", "stage", "decision", "subject_ref", "material_revision", "snapshot_tree", "confirmed_at"]);
    if (Object.keys(value).some((key) => !allowed.has(key))
        || value.task_id !== taskId || value.stage !== stage
        || !new Set(["accepted", "rejected"]).has(value.decision)
        || (value.subject_ref !== undefined && value.subject_ref !== null && typeof value.subject_ref !== "string")
        || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
        || !OID.test(value.snapshot_tree ?? "")
        || !Number.isFinite(Date.parse(value.confirmed_at))) {
      throw new Error("human confirmation v2 binding is invalid");
    }
    if (requireAccepted && value.decision !== "accepted") throw new Error("human confirmation was not accepted");
    return value;
  }
  const allowed = new Set(["schema_version", "task_id", "stage", "attempt_ref", "decision", "confirmed_at", "checkpoint_plan_hash"]);
  if (Object.keys(value).some((key) => !allowed.has(key))
      || value.schema_version !== "human-confirmation.v1"
      || value.task_id !== taskId || value.stage !== stage
      || value.attempt_ref !== subject
      || !new Set(["accepted", "rejected"]).has(value.decision)
      || !Number.isFinite(Date.parse(value.confirmed_at))
      || value.checkpoint_plan_hash !== undefined && !HASH.test(value.checkpoint_plan_hash)) {
    throw new Error("human confirmation binding is invalid");
  }
  if (requireAccepted && value.decision !== "accepted") throw new Error("human confirmation was not accepted");
  return value;
}
