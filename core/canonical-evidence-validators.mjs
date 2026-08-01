const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;

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
      || value.producer?.stage !== stage || value.producer?.component !== subject
      || value.snapshot_tree !== snapshotTree || !OID.test(value.snapshot_tree ?? "")
      || !Number.isInteger(value.exit_code)
      || !HASH.test(value.output_hash ?? "") || typeof value.output_ref !== "string") {
    throw new Error("canonical test receipt provenance is invalid");
  }
  if (requirePassed && value.exit_code !== 0) throw new Error("canonical test receipt did not pass");
  return value;
}

export function validateHumanConfirmation(value, {
  taskId, stage, subject, requireAccepted = false,
} = {}) {
  object(value, "human confirmation");
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
