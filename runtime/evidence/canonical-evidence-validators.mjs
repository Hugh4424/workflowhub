import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const TEST_OUTPUT_REF = /^quality\/tests\/output\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const FULL_TEST_COMMAND = "npm test";
const IMPLEMENTATION_DIFF_REF = /^quality\/evidence\/implementation\/[a-f0-9]{64}\.diff$/;
const STAGE_REFLECTION_NAMESPACE = "quality/stage-reflection/";
const STAGE_REFLECTION_REF = /^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\.json$/;
const SAFE_PATH = /^(?:(?:[A-Za-z0-9_][A-Za-z0-9._-]*|\.[A-Za-z0-9._-]+))(?:\/(?:(?:[A-Za-z0-9_][A-Za-z0-9._-]*|\.[A-Za-z0-9._-]+)))*$/;
const hashText = (value) => createHash("sha256").update(value).digest("hex");

// v1 remains readable for historical records. Only v2/v3 carry the material
// and Workspace provenance required by current authorization and release
// decisions, so callers must opt into the stricter current set explicitly.
export const HUMAN_CONFIRMATION_VERSIONS = Object.freeze([
  "human-confirmation.v1",
  "human-confirmation.v2",
  "human-confirmation.v3",
]);
export const CURRENT_HUMAN_CONFIRMATION_VERSIONS = Object.freeze([
  "human-confirmation.v2",
  "human-confirmation.v3",
]);
export function isHumanConfirmationVersion(value, { current = false } = {}) {
  return (current ? CURRENT_HUMAN_CONFIRMATION_VERSIONS : HUMAN_CONFIRMATION_VERSIONS).includes(value?.schema_version);
}

export function isStageReflectionRef(value) {
  return typeof value === "string" && value.startsWith(STAGE_REFLECTION_NAMESPACE) && STAGE_REFLECTION_REF.test(value);
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

export function validateCanonicalTestReceipt(value, {
  taskId, stage, snapshotTree, expectedProducerComponent = undefined, allowedProducerComponents = undefined, expectedCommand = undefined, requirePassed = false,
} = {}) {
  object(value, "canonical test receipt");
  if (value.schema_version !== "workflowhub-receipt.v1"
      || value.task_id !== taskId || value.stage !== stage
      || value.producer?.stage !== stage
      || typeof value.producer?.component !== "string" || value.producer.component.trim() === ""
      || (expectedProducerComponent !== undefined && value.producer.component !== expectedProducerComponent)
      || value.snapshot_tree !== snapshotTree || !OID.test(value.snapshot_tree ?? "")
      || !HASH.test(value.command_hash ?? "")
      || hashText(value.command ?? "") !== value.command_hash
      || (expectedCommand !== undefined && value.command !== expectedCommand)
      || !Number.isInteger(value.exit_code)
      || !HASH.test(value.output_hash ?? "") || typeof value.output_ref !== "string" || !TEST_OUTPUT_REF.test(value.output_ref)) {
    throw new Error("canonical test receipt provenance is invalid");
  }
  if (allowedProducerComponents !== undefined
      && (!Array.isArray(allowedProducerComponents)
        || !allowedProducerComponents.includes(value.producer.component))) {
    throw new Error("canonical test receipt producer component is not allowed");
  }
  if (value.source_digest !== undefined && !HASH.test(value.source_digest)) throw new Error("canonical test receipt source_digest is invalid");
  if (requirePassed && value.exit_code !== 0) throw new Error("canonical test receipt did not pass");
  return value;
}

export function validateCanonicalFullTestReceipt(value, {
  taskId, snapshotTree = value?.snapshot_tree, requirePassed = false, allowMiniTaskFocused = false,
} = {}) {
  object(value, "canonical full test receipt");
  const isMiniTaskFocused = allowMiniTaskFocused
    && value.stage === "verify-code"
    && value.producer?.component === "mini-task-focused-tests";
  const allowedProducerComponents = isMiniTaskFocused
    ? ["mini-task-focused-tests"]
    : value.stage === "build-code"
    ? ["build-code-test-capture"]
    : value.stage === "verify-code"
      ? ["verify-code-test-capture"]
      : [];
  if (allowedProducerComponents.length === 0) throw new Error("canonical full test receipt stage is invalid");
  return validateCanonicalTestReceipt(value, {
    taskId,
    stage: value.stage,
    snapshotTree,
    allowedProducerComponents,
    ...(isMiniTaskFocused ? {} : { expectedCommand: FULL_TEST_COMMAND }),
    requirePassed,
  });
}

export function validateMiniTaskAcTrace(value, {
  taskId, snapshotTree, receiptRef, receiptHash, read,
} = {}) {
  object(value, "mini-task AC trace");
  if (typeof read !== "function") throw new TypeError("mini-task AC trace read function is required");
  const allowed = new Set(["schema_version", "snapshot_tree", "acceptance_ids", "entries"]);
  if (Object.keys(value).some((key) => !allowed.has(key))
      || value.schema_version !== "ac-change-test-trace.v1"
      || value.snapshot_tree !== snapshotTree
      || !OID.test(value.snapshot_tree ?? "")
      || !Array.isArray(value.acceptance_ids) || value.acceptance_ids.length === 0
      || new Set(value.acceptance_ids).size !== value.acceptance_ids.length
      || value.acceptance_ids.some((id) => typeof id !== "string" || id.trim() === "")
      || !Array.isArray(value.entries) || value.entries.length !== value.acceptance_ids.length) {
    throw new Error("mini-task AC trace is incomplete or not bound to the focused test snapshot");
  }
  if (typeof receiptRef !== "string" || !receiptRef.startsWith("quality/tests/") || !HASH.test(receiptHash ?? "")) {
    throw new Error("mini-task AC trace focused test binding is invalid");
  }
  const readBound = (binding, label) => {
    if (!binding || typeof binding !== "object" || Array.isArray(binding)
        || typeof binding.ref !== "string" || !SAFE_PATH.test(binding.ref) || !HASH.test(binding.sha256 ?? "")) {
      throw new Error(`${label} binding is invalid`);
    }
    let raw;
    try { raw = read(binding.ref); } catch { throw new Error(`${label} is unavailable: ${binding.ref}`); }
    if (hashText(raw) !== binding.sha256) throw new Error(`${label} hash mismatch: ${binding.ref}`);
    let bound;
    try { bound = JSON.parse(raw); } catch { throw new Error(`${label} is not canonical JSON: ${binding.ref}`); }
    return { raw, value: bound };
  };
  const ids = new Set();
  for (const entry of value.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || ids.has(entry.acceptance_criterion_id)
        || !value.acceptance_ids.includes(entry.acceptance_criterion_id)
        || !["passed", "failed", "unknown", "not_applicable"].includes(entry.status)) {
      throw new Error("mini-task AC trace is incomplete");
    }
    for (const field of ["expected", "actual"]) {
      if (typeof entry[field] !== "string" || entry[field].trim() === "") throw new Error(`AC ${entry.acceptance_criterion_id}.${field} is required`);
    }
    if (!Array.isArray(entry.change) || entry.change.length === 0
        || entry.change.some((change) => !change || typeof change !== "object" || Array.isArray(change)
          || (change.task_id !== null && typeof change.task_id !== "string")
          || typeof change.summary !== "string" || change.summary.trim() === "")) {
      throw new Error("mini-task AC trace change mapping is incomplete");
    }
    if (!Array.isArray(entry.test) || entry.test.length === 0) throw new Error("mini-task AC trace test mapping is incomplete");
    if (entry.status === "not_applicable"
        && (!new Set(["out_of_scope", "no_ui", "no_code_change", "no_runtime_path", "deferred_scope"]).has(entry.reason_code)
          || typeof entry.not_applicable_reason !== "string" || entry.not_applicable_reason.trim() === "")) {
      throw new Error(`mini-task AC ${entry.acceptance_criterion_id} not_applicable reason_code and reason are required`);
    }
    if (entry.status === "unknown"
        && (typeof entry.unknown_reason !== "string" || entry.unknown_reason.trim() === "")) {
      throw new Error(`mini-task AC ${entry.acceptance_criterion_id} unknown reason is required`);
    }
    let currentReceipt = false;
    for (const test of entry.test) {
      if (!test || typeof test.receipt_ref !== "string" || !test.receipt_ref.startsWith("quality/tests/") || !HASH.test(test.receipt_hash ?? "")) {
        throw new Error("mini-task AC trace test binding is invalid");
      }
      const bound = readBound({ ref: test.receipt_ref, sha256: test.receipt_hash }, "mini-task AC trace test").value;
      validateCanonicalFullTestReceipt(bound, { taskId, snapshotTree, requirePassed: false, allowMiniTaskFocused: true });
      let output;
      try { output = read(bound.output_ref); } catch { throw new Error(`mini-task AC trace test output is unavailable: ${bound.output_ref}`); }
      if (hashText(output) !== bound.output_hash) throw new Error(`mini-task AC trace test output hash mismatch: ${bound.output_ref}`);
      const testStatusMatches = entry.status === "passed"
        ? bound.exit_code === 0
        : entry.status === "failed"
          ? bound.exit_code !== 0
          : true;
      if (!testStatusMatches) throw new Error(`mini-task AC ${entry.acceptance_criterion_id} test status does not match its current-snapshot receipt`);
      if (test.receipt_ref === receiptRef && test.receipt_hash === receiptHash) currentReceipt = true;
    }
    if (!currentReceipt) throw new Error(`mini-task AC ${entry.acceptance_criterion_id} is not bound to the focused test receipt`);
    if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) throw new Error("mini-task AC trace evidence mapping is incomplete");
    for (const evidence of entry.evidence) {
      if (!evidence || typeof evidence.ref !== "string" || !evidence.ref.startsWith("quality/") || !SAFE_PATH.test(evidence.ref) || !HASH.test(evidence.sha256 ?? "")) {
        throw new Error("mini-task AC trace evidence binding is invalid");
      }
      const bound = readBound(evidence, "mini-task AC trace evidence").value;
      if (!bound || typeof bound !== "object" || Array.isArray(bound)
          || bound.task_id !== taskId || bound.snapshot_tree !== snapshotTree
          || typeof bound.schema_version !== "string" || bound.schema_version.trim() === "") {
        throw new Error("mini-task AC trace evidence is not a current-snapshot fact");
      }
    }
    if (!Array.isArray(entry.anchors) || entry.anchors.length === 0 || entry.anchors.some((anchor) => !anchor || typeof anchor !== "object" || Array.isArray(anchor)
        || typeof anchor.id !== "string" || anchor.id.trim() === "" || !SAFE_PATH.test(anchor.path ?? "") || anchor.path.split("/").includes("..")
        || !Number.isSafeInteger(anchor.start_line) || anchor.start_line < 1
        || !Number.isSafeInteger(anchor.end_line) || anchor.end_line < anchor.start_line
        || typeof anchor.role !== "string" || anchor.role.trim() === ""
        || typeof anchor.reason !== "string" || anchor.reason.trim() === "")) {
      throw new Error("mini-task AC trace implementation anchors are incomplete");
    }
    ids.add(entry.acceptance_criterion_id);
  }
  if (ids.size !== value.acceptance_ids.length) throw new Error("mini-task AC trace omits an accepted AC");
  return value;
}

/** Validate the immutable implementation receipt and its bound diff bytes. */
export function validateCanonicalImplementationReceipt(value, { taskId, snapshotTree = value?.snapshot_tree, read } = {}) {
  object(value, "canonical implementation receipt");
  const allowed = new Set(["schema_version", "task_id", "stage", "producer", "changed", "snapshot_head", "snapshot_tree", "snapshot_commit", "diff_ref", "diff_hash"]);
  if (Object.keys(value).some((key) => !allowed.has(key))
      || value.schema_version !== "workflowhub-receipt.v1"
      || value.task_id !== taskId
      || value.stage !== "build-code"
      || !value.producer || typeof value.producer !== "object" || Array.isArray(value.producer)
      || value.producer.stage !== "build-code"
      || value.producer.component !== "implementation"
      || typeof value.producer.version !== "string" || value.producer.version.trim() === ""
      || !Array.isArray(value.changed)
      || value.changed.some((path) => typeof path !== "string" || !SAFE_PATH.test(path) || path.split("/").includes(".."))
      || !OID.test(value.snapshot_head ?? "")
      || !OID.test(value.snapshot_tree ?? "")
      || !OID.test(value.snapshot_commit ?? "")
      || value.snapshot_tree !== snapshotTree
      || !IMPLEMENTATION_DIFF_REF.test(value.diff_ref ?? "")
      || value.diff_ref.slice("quality/evidence/implementation/".length, -".diff".length) !== value.diff_hash
      || !HASH.test(value.diff_hash ?? "")) {
    throw new Error("canonical implementation receipt provenance is invalid");
  }
  if (typeof read !== "function") return value;
  let raw;
  try { raw = read(value.diff_ref); } catch { throw new Error("canonical implementation diff evidence is missing"); }
  if (hashText(raw) !== value.diff_hash) throw new Error("canonical implementation diff evidence hash mismatch");
  let diff;
  try { diff = JSON.parse(raw); } catch { throw new Error("canonical implementation diff evidence is invalid JSON"); }
  const diffAllowed = new Set(["schema_version", "baseline_commit", "snapshot_head", "snapshot_tree", "patch", "untracked"]);
  if (Object.keys(diff).some((key) => !diffAllowed.has(key))
      || diff.schema_version !== "workflowhub-diff-evidence.v1"
      || !OID.test(diff.baseline_commit ?? "")
      || diff.snapshot_head !== value.snapshot_head
      || diff.snapshot_tree !== value.snapshot_tree
      || typeof diff.patch !== "string"
      || !Array.isArray(diff.untracked)
      || diff.untracked.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry)
        || typeof entry.path !== "string" || !SAFE_PATH.test(entry.path) || entry.path.split("/").includes("..")
        || !OID.test(entry.blob_oid ?? ""))) {
    throw new Error("canonical implementation diff evidence provenance is invalid");
  }
  return value;
}

export function validateHumanConfirmation(value, {
  taskId, stage, subject, requireAccepted = false, requireSubjectRef = false,
} = {}) {
  object(value, "human confirmation");
  if (value.schema_version === "human-confirmation.v3") {
    const allowed = new Set(["schema_version", "task_id", "stage", "attempt_ref", "decision", "subject_ref", "material_revision", "snapshot_tree", "confirmed_at", "reply_text", "step_slug"]);
    if (Object.keys(value).some((key) => !allowed.has(key))
        || value.task_id !== taskId || value.stage !== stage
        || !new Set(["accepted", "rejected"]).has(value.decision)
        || (value.attempt_ref !== undefined && (typeof value.attempt_ref !== "string" || value.attempt_ref.trim() === ""))
        || (value.subject_ref !== undefined && value.subject_ref !== null && typeof value.subject_ref !== "string")
        || (requireSubjectRef && (typeof value.subject_ref !== "string" || value.subject_ref.trim() === ""))
        || (subject !== undefined && value.subject_ref !== subject && value.attempt_ref !== subject)
        || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
        || !OID.test(value.snapshot_tree ?? "")
        || !Number.isFinite(Date.parse(value.confirmed_at))
        || typeof value.reply_text !== "string" || value.reply_text.trim() === ""
        || typeof value.step_slug !== "string" || value.step_slug.trim() === "") {
      throw new Error("human confirmation v3 binding is invalid");
    }
    if (requireAccepted && value.decision !== "accepted") throw new Error("human confirmation was not accepted");
    return value;
  }
  if (value.schema_version === "human-confirmation.v2") {
    const allowed = new Set(["schema_version", "task_id", "stage", "decision", "subject_ref", "material_revision", "snapshot_tree", "confirmed_at"]);
    if (Object.keys(value).some((key) => !allowed.has(key))
        || value.task_id !== taskId || value.stage !== stage
        || !new Set(["accepted", "rejected"]).has(value.decision)
        || (value.subject_ref !== undefined && value.subject_ref !== null && typeof value.subject_ref !== "string")
        || (requireSubjectRef && (typeof value.subject_ref !== "string" || value.subject_ref.trim() === ""))
        || (subject !== undefined && value.subject_ref !== subject)
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
