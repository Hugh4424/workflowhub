import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import qualityFactSchema from "../schemas/quality-fact.v1.json" with { type: "json" };
import { validateTestRuntimeProfile } from "../stage/stage-content-contracts.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const TEST_OUTPUT_REF = /^quality\/tests\/output\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const FULL_TEST_COMMAND = "npm test";
const IMPLEMENTATION_DIFF_REF = /^quality\/evidence\/implementation\/[a-f0-9]{64}\.diff$/;
const STAGE_REFLECTION_NAMESPACE = "quality/stage-reflection/";
const STAGE_REFLECTION_REF = /^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)(?:\/[a-f0-9]{64})?\.json$/;
const SAFE_PATH = /^(?:(?:[A-Za-z0-9_][A-Za-z0-9._-]*|\.[A-Za-z0-9._-]+))(?:\/(?:(?:[A-Za-z0-9_][A-Za-z0-9._-]*|\.[A-Za-z0-9._-]+)))*$/;
const hashText = (value) => createHash("sha256").update(value).digest("hex");
const qualityFactValidator = new Ajv2020({ allErrors: true, strict: false,
  formats: { "date-time": (value) => Number.isFinite(Date.parse(value)) },
}).compile(qualityFactSchema);

export function validateCanonicalQualityFact(value) {
  if (!qualityFactValidator(value)) throw new Error("canonical quality fact does not match quality-fact.v1");
  return value;
}

function canonicalJson(value) {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("acceptance assertion must contain finite JSON values");
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

/** Pure semantic checks shared by the host outcome reader and nested freshness. */
export function validateStageOutcomeProducerIdentity(record, stage, { requireSource = false } = {}) {
  const producer = record?.producer;
  const nonempty = (value) => typeof value === "string" && value.trim() !== "";
  if (!producer || typeof producer !== "object" || Array.isArray(producer)) throw new Error(`${stage} stage outcome producer identity is invalid`);
  if (!nonempty(producer.kind)) throw new Error(`${stage} stage outcome producer.kind must be non-empty`);
  if (!new Set(["stage-agent", "workflowhub-session"]).has(producer.kind)) throw new Error(`${stage} stage outcome producer.kind is invalid`);
  if (!nonempty(producer.host)) throw new Error(`${stage} stage outcome producer.host must be non-empty`);
  if (!nonempty(producer.agent_run_id)) throw new Error(`${stage} stage outcome producer.agent_run_id must be non-empty`);
  if (producer.session_id !== undefined && !nonempty(producer.session_id)) throw new Error(`${stage} stage outcome producer.session_id must be non-empty`);
  if ((producer.kind === "workflowhub-session" || producer.source_ref !== undefined) && !nonempty(producer.source_ref)) throw new Error(`${stage} stage outcome producer.source_ref must be non-empty`);
  let sourceId = null, sourceFamily = null;
  if (requireSource || producer.source_id !== undefined || producer.source_family !== undefined) {
    if (!nonempty(producer.source_id)) throw new Error(`${stage} stage outcome producer.source_id must be non-empty`);
    if (!nonempty(producer.source_family)) throw new Error(`${stage} stage outcome producer.source_family must be non-empty`);
    if (producer.source_family !== producer.source_id.split("/")[0]) throw new Error(`${stage} stage outcome producer source identity mismatch`);
    sourceId = producer.source_id; sourceFamily = producer.source_family;
  }
  return Object.freeze({ kind: producer.kind, sourceId, sourceFamily, agentRunId: producer.agent_run_id });
}

export function validateStageOutcomeProof(raw, reference, binding, label = "stage outcome proof") {
  const match = /^quality\/evidence\/stage-outcome-proofs\/([a-f0-9]{64})\.json$/.exec(reference?.ref ?? "");
  if (!match || match[1] !== reference.sha256 || hashText(raw) !== reference.sha256) throw new Error(`${label}.ref hash mismatch`);
  let evidence;
  try { evidence = JSON.parse(raw); } catch { throw new Error(`${label}.ref must contain structured semantic evidence`); }
  if (evidence?.schema_version !== "workflowhub-stage-outcome-evidence.v1") throw new Error(`${label}.ref has an invalid evidence schema`);
  for (const [key, expected] of Object.entries({
    task_id: binding.taskId, attempt_id: binding.attemptId, stage: binding.stage,
    snapshot_tree: binding.snapshotTree, material_revision: binding.materialRevision,
    subject_kind: binding.subjectKind, subject_id: binding.subjectId,
    outcome_status: binding.outcomeStatus, result_summary: binding.resultSummary,
  })) {
    if (evidence[key] !== expected) throw new Error(`${label}.ref semantic binding mismatch: ${key}`);
  }
  if (!(evidence.producer_identity === undefined && binding.allowLegacyApprovalProof === true)
      && canonicalJson(evidence.producer_identity) !== canonicalJson(binding.producerIdentity)) throw new Error(`${label}.ref producer identity binding mismatch`);
  return evidence;
}

/** Derive assertions from actual child JSON; its claimed verdict is never consumed. */
export function deriveAcceptanceExecutionAssertions(raw, criterionIds) {
  let value;
  try {
    const text = Buffer.isBuffer(raw) ? new TextDecoder("utf-8", { fatal: true }).decode(raw) : raw;
    value = JSON.parse(text);
  } catch { throw new Error("acceptance execution output is not valid UTF-8 JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.entries)
      || !Array.isArray(criterionIds) || criterionIds.length === 0 || value.entries.length !== criterionIds.length) throw new Error("acceptance execution must return every declared AC exactly once");
  const seen = new Set();
  return value.entries.map((entry) => {
    const id = entry?.acceptance_criterion_id;
    if (!criterionIds.includes(id) || seen.has(id) || !Array.isArray(entry.assertions) || entry.assertions.length === 0) throw new Error("acceptance execution has unknown, duplicate, missing AC or empty assertions");
    seen.add(id);
    const assertions = new Set();
    return { acceptance_criterion_id: id, assertions: entry.assertions.map((assertion) => {
      if (!assertion || typeof assertion !== "object" || Array.isArray(assertion)
          || typeof assertion.id !== "string" || assertion.id.trim() === "" || assertions.has(assertion.id)
          || !Object.hasOwn(assertion, "expected") || !Object.hasOwn(assertion, "actual")) throw new Error("acceptance execution assertion is incomplete or duplicate");
      assertions.add(assertion.id);
      return { id: assertion.id, expected: assertion.expected, actual: assertion.actual,
        result: canonicalJson(assertion.expected) === canonicalJson(assertion.actual) ? "passed" : "failed" };
    }) };
  });
}

export function validateAcceptanceExecutionEvidence(value) {
  const subject = value?.subject_fact;
  const execution = subject?.execution;
  if (value?.schema_version !== "stage-quality-evidence.v1" || value.stage !== "build-code"
      || typeof value.task_id !== "string" || !value.task_id || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
      || !OID.test(value.snapshot_tree ?? "") || typeof value.subject !== "string" || !value.subject.startsWith("AC-")
      || !subject || !new Set(["passed", "failed", "missing"]).has(subject.status) || value.status !== subject.status
      || !execution || !new Set(["command", "service"]).has(execution.tier)
      || !(execution.exit_code === null || Number.isInteger(execution.exit_code))
      || !(execution.signal === null || (typeof execution.signal === "string" && execution.signal.trim() !== ""))
      || typeof execution.timed_out !== "boolean" || typeof execution.cancelled !== "boolean"
      || (execution.timed_out && execution.cancelled)
      || !new Set(["completed", "failed", "not_started"]).has(execution.cleanup?.status)
      || !Number.isSafeInteger(execution.timeout_ms) || execution.timeout_ms < 1
      || !Array.isArray(subject.assertions)) throw new Error("acceptance execution per-AC evidence is invalid");
  for (const stream of ["stdout", "stderr"]) {
    const hash = execution[`${stream}_hash`];
    if (!HASH.test(hash ?? "") || execution[`${stream}_ref`] !== `quality/evidence/stage-quality/build-code/acceptance-${stream}-${hash}.bin`) throw new Error(`acceptance ${stream} bytes binding is invalid`);
  }
  if (!["source", "sample", "scenario"].every((key) => typeof execution[key] === "string" && execution[key].trim())) throw new Error("acceptance execution scenario identity is incomplete");
  if (execution.tier === "command") {
    if (typeof execution.command !== "string" || !execution.command.trim() || !Array.isArray(execution.args) || execution.args.some((arg) => typeof arg !== "string")) throw new Error("acceptance argv identity is invalid");
  } else if (typeof execution.module_ref !== "string" || !SAFE_PATH.test(execution.module_ref)
      || typeof execution.export_name !== "string" || !execution.export_name.trim()
      || !HASH.test(execution.module_sha256 ?? "") || !Object.hasOwn(execution, "input")) throw new Error("acceptance service identity is invalid");
  const binding = subject.execution_binding;
  if (!binding || !HASH.test(binding.stage_outcome_hash ?? "")
      || binding.stage_outcome_ref !== `quality/evidence/stage-outcomes/build-code/${binding.stage_outcome_hash}.json`) throw new Error("acceptance execution stage outcome binding is invalid");
  const actor = subject.executor_actor;
  if (!actor || !new Set(["stage-agent", "workflowhub-session"]).has(actor.source_kind)
      || typeof actor.source_id !== "string" || !actor.source_id.trim() || typeof actor.run_id !== "string" || !actor.run_id.trim()) throw new Error("acceptance execution actor is unavailable");
  const seen = new Set();
  for (const assertion of subject.assertions) {
    if (!assertion || typeof assertion.id !== "string" || !assertion.id.trim() || seen.has(assertion.id)
        || !Object.hasOwn(assertion, "expected") || !Object.hasOwn(assertion, "actual")
        || assertion.result !== (canonicalJson(assertion.expected) === canonicalJson(assertion.actual) ? "passed" : "failed")) throw new Error("acceptance assertion result is not runtime-derived");
    seen.add(assertion.id);
  }
  if (subject.status === "passed" && (execution.exit_code !== 0 || execution.signal !== null
      || execution.timed_out || execution.cancelled || execution.cleanup.status !== "completed"
      || subject.assertions.length === 0 || subject.assertions.some((assertion) => assertion.result !== "passed"))) throw new Error("acceptance execution cannot pass without successful process and assertions");
  return value;
}

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
  taskId, stage, snapshotTree, expectedProducerComponent = undefined, allowedProducerComponents = undefined, expectedCommand = undefined, requirePassed = false, requireRuntimeProfile = false,
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
  if (requireRuntimeProfile && value.runtime_profile === undefined) throw new Error("canonical test receipt runtime profile is required");
  let runtimeProfileStatus = "ready";
  if (value.runtime_profile !== undefined) {
    const profile = validateTestRuntimeProfile(value.runtime_profile, { allowUnavailable: true });
    if (profile.errors.length > 0) throw new Error(`canonical test receipt runtime profile is ${profile.status}`);
    runtimeProfileStatus = profile.status;
    if (value.duration_ms !== undefined && value.runtime_profile.ceiling_ms < value.duration_ms) throw new Error("canonical test receipt duration exceeds runtime profile ceiling");
    if (value.runtime_profile_status !== undefined && value.runtime_profile_status !== profile.status) throw new Error("canonical test receipt runtime profile status is not bound");
    if (value.runtime_profile_authenticated !== undefined && value.runtime_profile_authenticated !== (profile.ok && profile.status === "ready")) throw new Error("canonical test receipt runtime profile authentication is not bound");
    if (value.runtime_profile_status === "ready" && (!profile.ok || profile.status !== "ready")) throw new Error("canonical test receipt cannot claim an unauthenticated runtime profile");
  }
  if (value.capability_proof !== undefined || requireRuntimeProfile) {
    const proof = validateTestRuntimeProfile({
      ...(value.runtime_profile ?? {}),
      capability_proof: value.capability_proof,
      behavior_fingerprint: value.behavior_fingerprint ?? value.runtime_profile?.behavior_fingerprint,
    }, { requireProof: requireRuntimeProfile, allowUnavailable: true });
    if (proof.errors.length > 0) throw new Error(`canonical test receipt capability proof is ${proof.status}`);
  }
  if (value.duration_ms !== undefined && (!Number.isSafeInteger(value.duration_ms) || value.duration_ms < 0)) throw new Error("canonical test receipt duration_ms is invalid");
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
