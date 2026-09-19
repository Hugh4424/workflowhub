import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SHA256_HEX_CASE_INSENSITIVE } from "../../../runtime/evidence/canonical-utils.mjs";
import { parseReviewerOutput } from "./review-output.mjs";

const protocol = "workflowhub-result.v3";
const reviewModes = new Set(["single_round", "adaptive", "full_only", "full_on_structural_rework", "legacy"]);
// v4 3rd-review owns provider liveness and terminal state. WorkflowHub must
// not add a second wall-clock deadline that kills a healthy provider midway
// through a review. A timeout remains an explicit test/operator override.
const DEFAULT_REVIEW_BROKER_TIMEOUT_MS = null;
const REVIEW_BROKER_TIMEOUT_FROM_ENV = (() => {
  const raw = process.env.WH_REVIEW_BROKER_TIMEOUT_MS;
  if (raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
})();
const EFFECTIVE_REVIEW_BROKER_TIMEOUT_MS = REVIEW_BROKER_TIMEOUT_FROM_ENV ?? DEFAULT_REVIEW_BROKER_TIMEOUT_MS;

function failure(code, message) { const error = new Error(`${code}: ${message}`); error.code = code; return error; }

function validateMinimumHeterologous(minimumHeterologous, minimum_heterologous) {
  if (minimumHeterologous !== undefined && minimum_heterologous !== undefined
      && minimumHeterologous !== minimum_heterologous) {
    throw failure("THRESHOLD_INVALID", "minimum_heterologous aliases disagree");
  }
  const value = minimumHeterologous === undefined ? minimum_heterologous : minimumHeterologous;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw failure("THRESHOLD_INVALID", "minimum_heterologous must be an explicit positive integer");
  }
  return value;
}

// Only structural path fields and broker error metadata are checked. Issue,
// recommendation, and provider output prose remain opaque reviewer text.
const pathBoundary = "(?:^|[\\s(\"'`=,:;])";
const absoluteWindowsPath = new RegExp(`${pathBoundary}(?:[A-Za-z]:[\\\\/]|\\\\\\\\)`);
const windowsDrivePrefix = new RegExp(`${pathBoundary}[A-Za-z]:`);
const windowsRootPath = new RegExp(`${pathBoundary}\\\\`);
const privateUnixPath = new RegExp(`${pathBoundary}(?:\\/\\/|\\/(?!api(?:\\/|$)))`);
const opaqueUrl = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const dotPath = /(?:^|[\\/])\.\.?(?:[\\/]|$)/;
const fileUri = new RegExp(`${pathBoundary}file:\\/\\/`, "i");

function containsPrivatePath(value) {
  return typeof value === "string" && (fileUri.test(value) || opaqueUrl.test(value) || absoluteWindowsPath.test(value) || windowsDrivePrefix.test(value) || windowsRootPath.test(value) || privateUnixPath.test(value) || dotPath.test(value));
}

function containsBrokerPath(value) {
  return typeof value === "string" && (fileUri.test(value) || absoluteWindowsPath.test(value) || windowsDrivePrefix.test(value) || windowsRootPath.test(value) || privateUnixPath.test(value) || dotPath.test(value));
}

const providerErrorFields = new Set(["cause_code", "code", "message", "parse_error", "truncated"]);
const brokerHostPath = /\/(?:Users|home|private|workspace|srv|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library|secret|data)\/[^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+/g;

function redactBrokerErrorMessage(value) {
  const redacted = value.replace(brokerHostPath, "<host-path-redacted>");
  return containsPrivatePath(redacted) ? "<host-path-redacted>" : redacted;
}

function safeProviderErrorFacts(value, label, { allowUnknown = false } = {}) {
  if (!allowUnknown && Object.keys(value).some((key) => !providerErrorFields.has(key))) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} has unsupported fields`);
  }
  const facts = {};
  for (const field of ["cause_code", "parse_error"]) {
    if (!Object.hasOwn(value, field)) continue;
    if (typeof value[field] !== "string" || value[field].trim().length === 0) {
      throw failure("PROTOCOL_INCOMPATIBLE", `${label}.${field} is invalid`);
    }
    if (containsPrivatePath(value[field])) {
      throw failure("PUBLIC_RESULT_INVALID", `${label}.${field} contains a private path`);
    }
    facts[field] = value[field];
  }
  if (Object.hasOwn(value, "truncated")) {
    if (typeof value.truncated !== "boolean") throw failure("PROTOCOL_INCOMPATIBLE", `${label}.truncated is invalid`);
    facts.truncated = value.truncated;
  }
  return facts;
}

function digest(value) {
  return createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function wireSummary(wire) {
  return `exit=${Number.isInteger(wire?.exitCode) ? wire.exitCode : "spawn_error"}; stdout_sha256=${digest(wire?.stdout)}; stderr_sha256=${digest(wire?.stderr)}`;
}

function contractFailure(error, wire) {
  Object.defineProperty(error, "diagnostic", {
    value: Object.freeze({
      classification: "contract_failure",
      raw_stdout: String(wire?.stdout ?? ""),
      raw_stderr: String(wire?.stderr ?? ""),
      stdout_sha256: digest(wire?.stdout),
      stderr_sha256: digest(wire?.stderr),
    }),
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return error;
}

function safeBrokerError(value) {
  const error = value?.error ?? value;
  if (!error || typeof error !== "object" || Array.isArray(error) || typeof error.code !== "string" || typeof error.message !== "string") return null;
  if (containsPrivatePath(error.code)) throw failure("PUBLIC_RESULT_INVALID", "broker error code contains a private path");
  if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(error.code) || error.message.length === 0) return null;
  const facts = safeProviderErrorFacts(error, "broker error", { allowUnknown: true });
  return Object.assign(failure(error.code, redactBrokerErrorMessage(error.message)), facts);
}

function execute(command, args, { timeoutMs = EFFECTIVE_REVIEW_BROKER_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      // A timed-out broker must not leave its provider descendants behind.
      // Put the broker in its own process group so the bounded termination
      // path can reap the whole invocation on POSIX hosts.
      detached: process.platform !== "win32",
    });
    let stdout = "", stderr = "", settled = false, timedOut = false, timeoutTimer = null, killTimer = null;
    const terminate = (signal) => {
      if (process.platform !== "win32" && Number.isInteger(child.pid)) {
        try { process.kill(-child.pid, signal); return; } catch { /* fall through to the direct child */ }
      }
      try { child.kill(signal); } catch { /* the child may already be gone */ }
    };
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer !== null) clearTimeout(timeoutTimer);
      if (killTimer !== null) clearTimeout(killTimer);
      resolve(value);
    };
    child.stdout.on("data", (bytes) => { stdout += bytes; }); child.stderr.on("data", (bytes) => { stderr += bytes; });
    child.once("error", (error) => {
      if (settled) return;
      finish({ exitCode: null, stdout, stderr, spawnError: { code: error?.code ?? "SPAWN_ERROR" }, timedOut });
    });
    child.once("close", (exitCode, signal) => finish({ exitCode, signal, stdout, stderr, timedOut }));
    if (timeoutMs !== null) timeoutTimer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      terminate("SIGTERM");
      killTimer = setTimeout(() => {
        if (!settled) terminate("SIGKILL");
      }, 250);
    }, timeoutMs);
  });
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\u0000") !== [...expected].sort().join("\u0000")) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} has unsupported fields`);
  }
}

const v3MemberFields = ["attempts", "continuable", "deadline_ms", "error", "identity", "material", "output", "provenance", "recovery", "result_protocol", "session_id", "status", "timing", "usage"];
const v3GroupFields = ["host_provider", "material_id", "outcome", "providers", "round", "runtime_id", "selected_tier", "version"];
const v3AttemptFields = ["attempt_id", "completed_at_ms", "duration_ms", "error", "kind", "provider_retry_count", "session_id", "started_at_ms", "status"];
const v3OptionalAttemptFields = ["process_outcome", "parse_outcome"];
const processOutcomes = new Set(["ok", "exit_nonzero", "timeout", "launch_failure"]);
const parseOutcomes = new Set(["ok", "invalid", "empty_output"]);
const v3MemberStates = new Set(["running", "completed", "failed", "cancelled"]);
const v3PublicationStates = new Set(["not_published", "initial_published", "late_open", "late_closed"]);
const v3ExtendedGroupFields = [...v3GroupFields, "initial_result_ref", "publication", "supplements"];
const v3SupplementFields = ["arrival_at", "arrival_elapsed_ms", "findings", "initial_result_ref", "provider", "supplement_id", "window_status"];
const v3SupplementFieldsWithIdentity = [...v3SupplementFields, "identity"];
const LATE_SUPPLEMENT_WINDOW_MS = 600000;
const managedStates = new Set(["starting", "running", "terminal"]);
const managedGroupFields = ["host_provider", "outcome", "providers", "round", "runtime_id", "selected_tier", "version"];
const managedMemberFields = ["adapter", "continuable", "effort", "error", "material_id", "model", "output", "provider", "raw_output_ref", "result_protocol", "retry", "runtime_id", "session_file_path", "session_id", "status", "thinking", "timing", "unavailable_diagnostics", "usage"];
const managedHealthMemberFields = ["status", "error", "last_progress_at_ms"];
const managedOutcomes = new Set(["completed", "unavailable", "cancelled", "stalled", "unverifiable", "invalid_output"]);
// workflowhub-result.v3 has its own terminal outcome set (3rd-review
// lib/workflowhub-result-v3.mjs `outcomes`). It is not a superset of the v2 set:
// v3 replaces the v2-only stalled/unverifiable/invalid_output outcomes with
// `partial`. Version 4 groups keep using managedOutcomes above, unchanged.
const managedV3Outcomes = new Set(["completed", "partial", "unavailable", "cancelled"]);

function validateV3Error(value, label) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.code !== "string" || typeof value.message !== "string") throw failure("PROTOCOL_INCOMPATIBLE", `${label} is invalid`);
  if (value.code.length === 0 || value.message.length === 0) throw failure("PROTOCOL_INCOMPATIBLE", `${label} is invalid`);
  if (containsPrivatePath(value.code) || containsPrivatePath(value.message)) throw failure("PUBLIC_RESULT_INVALID", `${label} contains a private path`);
  return { code: value.code, message: value.message, ...safeProviderErrorFacts(value, label) };
}

function validateV3Timing(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || !["started_at_ms", "completed_at_ms", "duration_ms"].every((key) => value[key] === null || (Number.isSafeInteger(value[key]) && value[key] >= 0))
      || (value.started_at_ms !== null && value.completed_at_ms !== null && value.completed_at_ms < value.started_at_ms)
      || (value.started_at_ms !== null && value.completed_at_ms !== null && value.duration_ms !== null
        && value.duration_ms !== value.completed_at_ms - value.started_at_ms)) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} timing is invalid`);
  }
  return value;
}

function validateV3String(value, label, { nullable = false, publicMetadata = false } = {}) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.trim().length === 0) throw failure("PROTOCOL_INCOMPATIBLE", `${label} is invalid`);
  if (publicMetadata && containsPrivatePath(value)) throw failure("PUBLIC_RESULT_INVALID", `${label} contains a private path`);
  return value;
}

function validateV3Sha256(value, label) {
  if (value !== null && (typeof value !== "string" || !SHA256_HEX_CASE_INSENSITIVE.test(value))) throw failure("PROTOCOL_INCOMPATIBLE", `${label} is invalid`);
  return value;
}

function validateV3Publication(value, label = "v3 publication") {
  exactKeys(value, ["append_window", "published_at", "published_at_least_sources", "running_member_count", "status"], label);
  if (!v3PublicationStates.has(value.status)) throw failure("PROTOCOL_INCOMPATIBLE", `${label}.status is invalid`);
  if (!(value.published_at === null || (Number.isSafeInteger(value.published_at) && value.published_at >= 0))) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.published_at is invalid`);
  }
  if (!Number.isSafeInteger(value.published_at_least_sources) || value.published_at_least_sources < 0) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.published_at_least_sources is invalid`);
  }
  if (!Number.isSafeInteger(value.running_member_count) || value.running_member_count < 0) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.running_member_count is invalid`);
  }
  if (value.status === "not_published" && value.published_at !== null) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.not_published cannot have published_at`);
  }
  if (value.status !== "not_published" && !Number.isSafeInteger(value.published_at)) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} published state requires published_at`);
  }
  if (value.append_window === null && value.status === "not_published") {
    return Object.freeze({ ...value });
  }
  exactKeys(value.append_window, ["duration_ms", "ends_at", "starts_at"], `${label}.append_window`);
  const window = value.append_window;
  if (![window.starts_at, window.ends_at, window.duration_ms].every((item) => Number.isSafeInteger(item) && item >= 0)
      || window.duration_ms !== LATE_SUPPLEMENT_WINDOW_MS
      || value.published_at === null
      || window.starts_at !== value.published_at
      || window.ends_at !== window.starts_at + LATE_SUPPLEMENT_WINDOW_MS) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.append_window is invalid`);
  }
  return Object.freeze({ ...value, append_window: Object.freeze({ ...window }) });
}

function validateV3Supplement(value, publication, label = "v3 supplement") {
  exactKeys(value, Object.hasOwn(value ?? {}, "identity") ? v3SupplementFieldsWithIdentity : v3SupplementFields, label);
  validateV3String(value.supplement_id, `${label}.supplement_id`, { publicMetadata: true });
  validateV3String(value.initial_result_ref, `${label}.initial_result_ref`, { publicMetadata: true });
  validateV3String(value.provider, `${label}.provider`, { publicMetadata: true });
  if (!Number.isSafeInteger(value.arrival_at) || value.arrival_at < 0
      || !Number.isSafeInteger(value.arrival_elapsed_ms) || value.arrival_elapsed_ms < 0
      || !Array.isArray(value.findings)
      || !["in_window", "over_window_unjudged"].includes(value.window_status)) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} is invalid`);
  }
  if (publication?.published_at !== null && Number.isSafeInteger(publication?.published_at)
      && value.arrival_elapsed_ms !== value.arrival_at - publication.published_at) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.arrival_elapsed_ms is not bound to published_at`);
  }
  const expectedWindowStatus = value.arrival_elapsed_ms < LATE_SUPPLEMENT_WINDOW_MS ? "in_window" : "over_window_unjudged";
  if (value.window_status !== expectedWindowStatus) throw failure("PROTOCOL_INCOMPATIBLE", `${label}.window_status is invalid`);
  try {
    // A supplement is another provider output, not an opaque metadata array.
    // Validate its findings through the same findings-only parser used for the
    // initial result before the runner adds trusted provider attribution.
    parseReviewerOutput(JSON.stringify({ findings: value.findings }), { requireEvidence: true });
  } catch (error) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.findings are invalid: ${error.message}`);
  }
  let identity;
  if (Object.hasOwn(value, "identity")) {
    identity = value.identity;
    exactKeys(identity, ["adapter", "config_id", "model", "provider", "source_id"], `${label}.identity`);
    validateV3String(identity.provider, `${label}.identity.provider`, { publicMetadata: true });
    validateV3String(identity.adapter, `${label}.identity.adapter`, { publicMetadata: true });
    validateV3String(identity.source_id, `${label}.identity.source_id`, { publicMetadata: true });
    validateV3String(identity.config_id, `${label}.identity.config_id`, { publicMetadata: true });
    if (identity.model !== null) validateV3String(identity.model, `${label}.identity.model`, { publicMetadata: true });
  }
  return Object.freeze({
    ...value,
    ...(identity ? { identity: Object.freeze({ ...identity }) } : {}),
    findings: structuredClone(value.findings),
  });
}

function validateV3Usage(value, label = "v3 usage") {
  if (value === null) return null;
  const visit = (current, path, allowDecimal = false) => {
    if (Number.isSafeInteger(current) && current >= 0) return current;
    if (allowDecimal && typeof current === "number" && Number.isFinite(current)
        && current >= 0 && current <= Number.MAX_SAFE_INTEGER) return current;
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      throw failure("PROTOCOL_INCOMPATIBLE", `${path} must contain only non-negative safe integers or objects`);
    }
    const keys = Object.keys(current);
    if (keys.length === 0 || keys.some((key) => key.trim() === "")) {
      throw failure("PROTOCOL_INCOMPATIBLE", `${path} must not be empty`);
    }
    if (keys.some((key) => containsPrivatePath(key))) {
      throw failure("PUBLIC_RESULT_INVALID", `${path} contains a private path key`);
    }
    return Object.fromEntries(keys.map((key) => [key, visit(current[key], `${path}.${key}`, allowDecimal || (path === label && key === "cost"))]));
  };
  return visit(value, label);
}

function validateV3Member(value, providers, materialId, runtimeId, contractId = null, contractHash = null, semanticHash = null) {
  exactKeys(value, v3MemberFields, "3rd-review v3 provider result");
  if (value.result_protocol !== protocol || !providers.has(value.identity?.provider)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned an incompatible v3 provider result");
  if (value.material?.material_id !== materialId || value.provenance?.runtime_id !== runtimeId) throw failure("MATERIAL_INCOMPLETE", "3rd-review v3 result is bound to different material/runtime");
  if ((contractId !== null && value.material.contract_id !== contractId)
      || (contractHash !== null && value.material.contract_hash !== contractHash)
      || (semanticHash !== null && value.material.semantic_hash !== semanticHash)) {
    throw failure("MATERIAL_INCOMPLETE", "3rd-review v3 result is bound to different semantic material identity");
  }
  if (!v3MemberStates.has(value.status)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review v3 provider status is invalid");
  if (["running", "completed"].includes(value.status) && value.error !== null) throw failure("PROTOCOL_INCOMPATIBLE", `${value.status} v3 provider result must not contain an error`);
  if (["failed", "cancelled"].includes(value.status) && value.error === null) throw failure("PROTOCOL_INCOMPATIBLE", `${value.status} v3 provider result must contain an error`);
  const error = validateV3Error(value.error, "v3 error");
  const identity = value.identity;
  if (!identity) throw failure("PROTOCOL_INCOMPATIBLE", "v3 identity is invalid");
  exactKeys(identity, ["adapter", "config_id", "model", "provider", "source_id"], "v3 identity");
  validateV3String(identity.provider, "v3 identity.provider", { publicMetadata: true });
  validateV3String(identity.adapter, "v3 identity.adapter", { publicMetadata: true });
  validateV3String(identity.source_id, "v3 identity.source_id", { publicMetadata: true });
  validateV3String(identity.config_id, "v3 identity.config_id", { publicMetadata: true });
  if (identity.model !== null) validateV3String(identity.model, "v3 identity.model", { publicMetadata: true });
  const material = value.material;
  if (!material) throw failure("PROTOCOL_INCOMPATIBLE", "v3 material identity is invalid");
  exactKeys(material, ["contract_hash", "contract_id", "material_id", "semantic_hash"], "v3 material");
  validateV3String(material.material_id, "v3 material.material_id");
  validateV3String(material.contract_id, "v3 material.contract_id");
  validateV3String(material.contract_hash, "v3 material.contract_hash");
  validateV3String(material.semantic_hash, "v3 material.semantic_hash");
  validateV3Sha256(value.provenance?.raw_output_sha256, "v3 provenance.raw_output_sha256");
  validateV3Sha256(value.provenance?.raw_stderr_sha256, "v3 provenance.raw_stderr_sha256");
  exactKeys(value.provenance, ["raw_output_sha256", "raw_stderr_sha256", "runtime_id"], "v3 provenance");
  validateV3String(value.provenance?.runtime_id, "v3 provenance.runtime_id", { publicMetadata: true });
  const recovery = value.recovery;
  exactKeys(recovery, ["fresh_execution_retry_count", "provider_internal_retry_count", "same_session_repair_count"], "v3 recovery");
  if (!recovery || ["provider_internal_retry_count", "fresh_execution_retry_count", "same_session_repair_count"].some((key) => !Number.isSafeInteger(recovery[key]) || recovery[key] < 0)) throw failure("PROTOCOL_INCOMPATIBLE", "v3 recovery counters are invalid");
  if (!Array.isArray(value.attempts)) throw failure("PROTOCOL_INCOMPATIBLE", "v3 attempts must be an array");
  for (const attempt of value.attempts) {
    const attemptKeys = Object.keys(attempt);
    if (!v3AttemptFields.every((field) => Object.hasOwn(attempt, field))
        || attemptKeys.some((field) => !v3AttemptFields.includes(field) && !v3OptionalAttemptFields.includes(field))) {
      throw failure("PROTOCOL_INCOMPATIBLE", "v3 attempt has unsupported fields");
    }
    if (!Number.isSafeInteger(attempt.provider_retry_count) || attempt.provider_retry_count < 0 || !v3MemberStates.has(attempt.status)) throw failure("PROTOCOL_INCOMPATIBLE", "v3 attempt is invalid");
    validateV3String(attempt.attempt_id, "v3 attempt.attempt_id", { publicMetadata: true });
    validateV3String(attempt.kind, "v3 attempt.kind", { publicMetadata: true });
    if (attempt.session_id !== null) validateV3String(attempt.session_id, "v3 attempt.session_id", { publicMetadata: true });
    const attemptError = validateV3Error(attempt.error, "v3 attempt error");
    if (["running", "completed"].includes(attempt.status) && attemptError !== null) throw failure("PROTOCOL_INCOMPATIBLE", `${attempt.status} v3 attempt must not contain an error`);
    if (["failed", "cancelled"].includes(attempt.status) && attemptError === null) throw failure("PROTOCOL_INCOMPATIBLE", `${attempt.status} v3 attempt must contain an error`);
    validateV3Timing(attempt, "v3 attempt");
    if (Object.hasOwn(attempt, "process_outcome") && attempt.process_outcome !== null
        && (!processOutcomes.has(attempt.process_outcome) || containsPrivatePath(attempt.process_outcome))) {
      throw failure("PROTOCOL_INCOMPATIBLE", "v3 attempt.process_outcome is invalid");
    }
    if (Object.hasOwn(attempt, "parse_outcome") && attempt.parse_outcome !== null
        && (!parseOutcomes.has(attempt.parse_outcome) || containsPrivatePath(attempt.parse_outcome))) {
      throw failure("PROTOCOL_INCOMPATIBLE", "v3 attempt.parse_outcome is invalid");
    }
  }
  exactKeys(value.timing, ["completed_at_ms", "duration_ms", "started_at_ms"], "v3 timing");
  if (!value.timing || Object.keys(value.timing).sort().join("\0") !== ["completed_at_ms", "duration_ms", "started_at_ms"].join("\0")) throw failure("PROTOCOL_INCOMPATIBLE", "v3 timing is invalid");
  validateV3Timing(value.timing, "v3");
  if (value.status === "running" && (value.output !== null || value.timing.completed_at_ms !== null || value.timing.duration_ms !== null)) {
    throw failure("PROTOCOL_INCOMPATIBLE", "running v3 provider result must not carry terminal output or timing");
  }
  if (value.status !== "running" && value.attempts.some((attempt) => attempt.status === "running")) {
    throw failure("PROTOCOL_INCOMPATIBLE", "terminal v3 provider result must not carry a running attempt");
  }
  if (value.deadline_ms !== null || typeof value.continuable !== "boolean") throw failure("PROTOCOL_INCOMPATIBLE", "v3 execution facts are invalid");
  if (value.output !== null) {
    validateV3String(value.output, "v3 output");
  }
  if (value.session_id !== null) validateV3String(value.session_id, "v3 session_id", { publicMetadata: true });
  const usage = validateV3Usage(value.usage);
  const latestAttempt = value.attempts.at(-1) ?? null;
  return Object.freeze({
    ...value,
    provider: identity.provider,
    error,
    unavailable_diagnostics: error,
    raw_output_ref: null,
    execution: Object.freeze({
      adapter: identity.adapter, model: identity.model, effort: null, thinking: null,
      timing: Object.freeze({ ...value.timing }), usage,
      retry: Object.freeze({ count: recovery.provider_internal_retry_count, progress_events: 0 }), runtime_id: runtimeId,
      deadline_ms: value.deadline_ms,
      recovery: Object.freeze({ ...recovery }),
      ...(latestAttempt?.process_outcome === undefined ? {} : { process_outcome: latestAttempt.process_outcome }),
      ...(latestAttempt?.parse_outcome === undefined ? {} : { parse_outcome: latestAttempt.parse_outcome }),
    }),
  });
}

function validateV3PublicationEnvelope(value, members, hasPublicationExtension, label) {
  const runningCount = members.filter((member) => member.status === "running").length;
  if (runningCount > 0 && !hasPublicationExtension) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} running members require the publication envelope`);
  }
  if (runningCount > 0 && value.outcome !== "partial") {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} running members require partial group outcome`);
  }
  if (!hasPublicationExtension) return null;
  const publication = validateV3Publication(value.publication, `${label}.publication`);
  if (publication.running_member_count !== runningCount) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label}.publication.running_member_count does not match provider members`);
  }
  if (publication.status === "not_published") {
    if (value.initial_result_ref !== null) throw failure("PROTOCOL_INCOMPATIBLE", `${label}.initial_result_ref must be null before initial publication`);
  } else {
    validateV3String(value.initial_result_ref, `${label}.initial_result_ref`, { publicMetadata: true });
  }
  if (!Array.isArray(value.supplements)) throw failure("PROTOCOL_INCOMPATIBLE", `${label}.supplements must be an array`);
  const supplements = value.supplements.map((item, index) => validateV3Supplement(item, publication, `${label} supplement ${index}`));
  return { publication, supplements };
}

function validateV3Group(value, { hostProvider, providers, materialId, contractId = null, contractHash = null, semanticHash = null }) {
  const hasPublicationExtension = Object.hasOwn(value ?? {}, "initial_result_ref")
    || Object.hasOwn(value ?? {}, "publication")
    || Object.hasOwn(value ?? {}, "supplements");
  exactKeys(value, hasPublicationExtension ? v3ExtendedGroupFields : v3GroupFields, "3rd-review v3 public group");
  if (value.version !== protocol || value.host_provider !== hostProvider || value.material_id !== materialId || !["completed", "partial", "unavailable", "cancelled"].includes(value.outcome) || !Number.isSafeInteger(value.round) || value.round < 1 || typeof value.runtime_id !== "string" || !Array.isArray(value.providers) || value.providers.length === 0) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review v3 public group is invalid");
  if (containsPrivatePath(value.runtime_id)) throw failure("PUBLIC_RESULT_INVALID", "3rd-review v3 group runtime_id contains a private path");
  if (!(value.selected_tier === null || (Number.isSafeInteger(value.selected_tier) && value.selected_tier >= 0))) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review v3 selected_tier is invalid");
  const received = new Set();
  const members = value.providers.map((item) => {
    const member = validateV3Member(item, providers, materialId, value.runtime_id, contractId, contractHash, semanticHash);
    if (received.has(member.provider)) throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review returned duplicate provider ${member.provider}`);
    received.add(member.provider);
    return member;
  });
  if (received.size !== providers.size || [...providers].some((provider) => !received.has(provider))) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review v3 omitted configured provider result(s)");
  const extension = validateV3PublicationEnvelope(value, members, hasPublicationExtension, "3rd-review v3 public group");
  if (!extension) return Object.freeze({ ...value, providers: Object.freeze(members) });
  return Object.freeze({
    ...value,
    providers: Object.freeze(members),
    initial_result_ref: value.initial_result_ref,
    publication: extension.publication,
    supplements: Object.freeze(extension.supplements),
  });
}

function validateDirectionFlow(value) {
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const expectedSteps = [
    { id: "reconstruct", visible: ["raw_requirement", "objective_facts"], hidden_until: "reveal" },
    { id: "reveal", after: ["reconstruct"], visible: ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"] },
    { id: "challenge", after: ["reveal"], visible: ["revealed_choice", "independent_reconstruction"], output: "findings" },
  ];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    exactKeys(value, ["output", "public_request_count", "steps", "version"], "direction-review");
    validateV3String(value.version, "direction-review.version", { publicMetadata: true });
    exactKeys(value.output, ["one_logical_fact", "one_provider_result"], "direction-review.output");
    if (Array.isArray(value.steps)) {
      for (const [index, step] of value.steps.entries()) {
        if (!step || typeof step !== "object" || Array.isArray(step)) continue;
        for (const field of ["id", "hidden_until", "output"]) {
          if (typeof step[field] === "string" && containsPrivatePath(step[field])) {
            throw failure("PUBLIC_RESULT_INVALID", `direction-review.steps[${index}].${field} contains a private path`);
          }
        }
        for (const field of ["visible", "after"]) {
          if (Array.isArray(step[field])) {
            for (const [itemIndex, item] of step[field].entries()) {
              if (typeof item === "string" && containsPrivatePath(item)) {
                throw failure("PUBLIC_RESULT_INVALID", `direction-review.steps[${index}].${field}[${itemIndex}] contains a private path`);
              }
            }
          }
        }
      }
    }
  }
  const stepsValid = Array.isArray(value?.steps)
    && value.steps.length === expectedSteps.length
    && value.steps.every((step, index) => {
      const expected = expectedSteps[index];
      return step && typeof step === "object" && !Array.isArray(step)
        && step.id === expected.id
        && (!expected.visible || same(step.visible, expected.visible))
        && (!expected.after || same(step.after, expected.after))
        && (!expected.hidden_until || step.hidden_until === expected.hidden_until)
        && (!expected.output || step.output === expected.output)
        && Object.keys(step).sort().join("\u0000") === Object.keys(expected).sort().join("\u0000");
    });
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.version !== "direction-review.v1"
      || value.public_request_count !== 1
      || !stepsValid
      || value.output?.one_provider_result !== true
      || value.output?.one_logical_fact !== true
      ) {
    throw failure("PROTOCOL_INCOMPATIBLE", "direction-review.v1 flow is invalid");
  }
  return structuredClone(value);
}

function validateManagedMember(value, provider, runtimeId, materialId) {
  exactKeys(value, managedMemberFields, "3rd-review managed provider result");
  if (value.provider !== provider || value.runtime_id !== runtimeId || value.material_id !== materialId
      || value.result_protocol !== "workflowhub-result.v2" || !["completed", "failed", "cancelled"].includes(value.status)
      || typeof value.continuable !== "boolean"
      || !(value.thinking === null || typeof value.thinking === "boolean")) {
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed provider result is invalid");
  }
  validateV3String(value.provider, "managed provider", { publicMetadata: true });
  validateV3String(value.adapter, "managed provider adapter", { publicMetadata: true });
  validateV3String(value.material_id, "managed provider material_id", { publicMetadata: true });
  validateV3String(value.runtime_id, "managed provider runtime_id", { publicMetadata: true });
  if (value.model !== null) validateV3String(value.model, "managed provider model", { publicMetadata: true });
  if (value.effort !== null) validateV3String(value.effort, "managed provider effort", { publicMetadata: true });
  if (value.session_id !== null) validateV3String(value.session_id, "managed provider session_id", { publicMetadata: true });
  if (value.session_file_path !== null || value.raw_output_ref !== null) throw failure("PUBLIC_RESULT_INVALID", "managed provider result exposed a private reference");
  exactKeys(value.timing, ["completed_at_ms", "duration_ms", "started_at_ms"], "managed provider timing");
  const timing = Object.freeze({ ...validateV3Timing(value.timing, "managed provider") });
  exactKeys(value.retry, ["count", "progress_events"], "managed provider retry");
  if (!Number.isSafeInteger(value.retry.count) || value.retry.count < 0 || !Number.isSafeInteger(value.retry.progress_events) || value.retry.progress_events < 0) throw failure("PROTOCOL_INCOMPATIBLE", "managed provider retry facts are invalid");
  const retry = Object.freeze({ ...value.retry });
  const error = value.error === null ? null : Object.freeze(validateV3Error(value.error, "managed provider error"));
  const unavailableDiagnostics = value.unavailable_diagnostics === null
    ? null
    : Object.freeze(validateV3Error(value.unavailable_diagnostics, "managed provider unavailable diagnostics"));
  if (value.status === "completed" ? error !== null || unavailableDiagnostics !== null : error === null || unavailableDiagnostics === null
      || error.code !== unavailableDiagnostics.code || error.message !== unavailableDiagnostics.message) {
    throw failure("PROTOCOL_INCOMPATIBLE", "managed provider diagnostics do not match its status");
  }
  if (value.output !== null && typeof value.output !== "string") throw failure("PROTOCOL_INCOMPATIBLE", "managed provider output is invalid");
  const usage = validateV3Usage(value.usage, "managed provider usage");
  return Object.freeze({
    ...value,
    error,
    retry,
    timing,
    unavailable_diagnostics: unavailableDiagnostics,
    usage: usage === null ? null : Object.freeze(usage),
  });
}

// A managed operation publishes the group its request protocol produced, so a
// workflowhub-result.v3 terminal group must be validated with the v3 field set.
// v3 is not a superset of v2: the group gains `material_id` and every member
// replaces the flat v2 member shape with identity/material/provenance/recovery/
// attempts. Running the v2 exact-key check first rejected every real v3 group
// with "unsupported fields" after the provider had already been dispatched.
// Only the field sets differ here; every managed binding check is preserved.
function validateManagedV3Group(value, { hostProvider, providers, runtimeId, materialId }) {
  const hasPublicationExtension = Object.hasOwn(value ?? {}, "initial_result_ref")
    || Object.hasOwn(value ?? {}, "publication")
    || Object.hasOwn(value ?? {}, "supplements");
  exactKeys(value, hasPublicationExtension ? v3ExtendedGroupFields : v3GroupFields, "3rd-review managed v3 group");
  if (value.host_provider !== hostProvider || value.runtime_id !== runtimeId || value.material_id !== materialId
      || !managedV3Outcomes.has(value.outcome)
      || !Number.isSafeInteger(value.round) || value.round < 1
      || !(value.selected_tier === null || (Number.isSafeInteger(value.selected_tier) && value.selected_tier >= 0))
      || !Array.isArray(value.providers) || value.providers.length !== providers.size) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed v3 group is invalid");
  // host_provider and material_id are equality-bound to caller-supplied values
  // above; only the broker-chosen runtime identity can carry an unchecked path.
  validateV3String(value.runtime_id, "managed v3 group runtime_id", { publicMetadata: true });
  const seen = new Set();
  const members = value.providers.map((member) => {
    const provider = member?.identity?.provider;
    if (!providers.has(provider) || seen.has(provider)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed v3 group provider selection is invalid");
    seen.add(provider);
    // Managed binding stays explicit here (and keeps the managed path's
    // PROTOCOL_INCOMPATIBLE classification) instead of relying on the shared
    // public-v3 binding branch, which reports MATERIAL_INCOMPLETE.
    if (member?.material?.material_id !== materialId || member?.provenance?.runtime_id !== runtimeId) {
      throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed v3 member is bound to a different material/runtime");
    }
    // v3 member shape, status/error consistency, provider selection, and
    // material_id/runtime_id binding are the shared public-v3 checks. Contract
    // identity is deliberately not bound: 3rd-review publishes `unavailable`
    // contract sentinels on managed failure members, exactly as the v2 managed
    // member omitted contract identity entirely.
    return validateV3Member(member, providers, materialId, runtimeId);
  });
  if (seen.size !== providers.size) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed v3 group omitted a configured provider");
  const extension = validateV3PublicationEnvelope(value, members, hasPublicationExtension, "3rd-review managed v3 group");
  if (!extension) return Object.freeze({ ...value, providers: Object.freeze(members) });
  return Object.freeze({
    ...value,
    providers: Object.freeze(members),
    initial_result_ref: value.initial_result_ref,
    publication: extension.publication,
    supplements: Object.freeze(extension.supplements),
  });
}

function validateManagedGroup(value, { hostProvider, providers, runtimeId, materialId }) {
  if (value?.version === protocol) return validateManagedV3Group(value, { hostProvider, providers, runtimeId, materialId });
  exactKeys(value, managedGroupFields, "3rd-review managed group");
  if (value.version !== 4 || value.host_provider !== hostProvider || value.runtime_id !== runtimeId || !managedOutcomes.has(value.outcome)
      || !Number.isSafeInteger(value.round) || value.round < 0 || !(value.selected_tier === null || (Number.isSafeInteger(value.selected_tier) && value.selected_tier >= 0))
      || !Array.isArray(value.providers) || value.providers.length !== providers.size) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed group is invalid");
  const seen = new Set();
  const members = value.providers.map((member) => {
    const provider = member?.provider;
    if (!providers.has(provider) || seen.has(provider)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed group provider selection is invalid");
    seen.add(provider);
    return validateManagedMember(member, provider, runtimeId, materialId);
  });
  if (seen.size !== providers.size) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed group omitted a configured provider");
  return Object.freeze({ ...value, providers: Object.freeze(members) });
}

function validateManagedHealthProviders(value, providers) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed health providers map is invalid");
  }
  const providerIds = Object.keys(value);
  if (providerIds.length !== providers.size || providerIds.some((provider) => !providers.has(provider))) {
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed health providers map does not match the configured providers");
  }
  const normalized = Object.fromEntries([...providers].map((provider) => {
    const member = value[provider];
    if (!member || typeof member !== "object" || Array.isArray(member)
        || managedHealthMemberFields.some((field) => !Object.hasOwn(member, field))) {
      throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review managed health provider ${provider} is invalid`);
    }
    if (Object.hasOwn(member, "provider") && member.provider !== provider) {
      throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review managed health provider ${provider} is invalid`);
    }
    if (!v3MemberStates.has(member.status)) {
      throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review managed health provider ${provider} status is invalid`);
    }
    let error = null;
    if (member.error !== null) {
      if (!member.error || typeof member.error !== "object" || Array.isArray(member.error)) {
        throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review managed health provider ${provider} error is invalid`);
      }
      const code = validateV3String(member.error.code, `managed health provider ${provider} error.code`, { publicMetadata: true });
      for (const field of Object.values(member.error)) {
        if (typeof field === "string" && containsPrivatePath(field)) {
          throw failure("PUBLIC_RESULT_INVALID", `managed health provider ${provider} error contains a private path`);
        }
      }
      error = Object.freeze({ code });
    }
    if (!(member.last_progress_at_ms === null
        || (Number.isSafeInteger(member.last_progress_at_ms) && member.last_progress_at_ms >= 0))) {
      throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review managed health provider ${provider} last_progress_at_ms is invalid`);
    }
    return [provider, Object.freeze({
      status: member.status,
      error,
      last_progress_at_ms: member.last_progress_at_ms,
    })];
  }));
  return Object.freeze(normalized);
}

function parseManagedEnvelope(wire, context) {
  if (wire?.timedOut) throw failure("PROCESS_TIMEOUT", "3rd-review managed lifecycle exceeded the local broker timeout");
  let result;
  try { result = JSON.parse(wire?.stdout ?? ""); }
  catch {
    // stderr is a diagnostic channel. A broker may emit ordinary text there
    // on a malformed/non-JSON response; do not let that text escape as a raw
    // SyntaxError and bypass the typed lifecycle failure classification.
    try {
      const brokerError = safeBrokerError(JSON.parse(wire?.stderr ?? ""));
      if (brokerError) throw brokerError;
    } catch (error) {
      if (error?.code && error.code !== "SyntaxError") throw error;
    }
    throw failure(wire?.spawnError ? "BROKER_SPAWN_FAILED" : "PROTOCOL_INCOMPATIBLE", `3rd-review managed lifecycle did not return JSON; ${wireSummary(wire)}`);
  }
  const brokerError = safeBrokerError(result);
  if (brokerError) throw brokerError;
  if (wire?.exitCode !== 0) throw failure("BROKER_EXIT_NONZERO", `3rd-review managed lifecycle exited without a public result; ${wireSummary(wire)}`);
  if (!result || result.version !== "workflowhub-run.v1" || typeof result.request_id !== "string" || typeof result.runtime_id !== "string"
      || !managedStates.has(result.state) || result.material_id !== context.materialId
      || (context.requestId !== null && result.request_id !== context.requestId)
      || (context.runtimeId !== null && result.runtime_id !== context.runtimeId)
      || containsPrivatePath(result.request_id) || containsPrivatePath(result.runtime_id)) {
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review managed lifecycle envelope is invalid");
  }
  if (result.state === "terminal") {
    exactKeys(result, ["group", "material_id", "request_id", "runtime_id", "state", "version"], "3rd-review managed lifecycle envelope");
    return Object.freeze({ ...result, group: validateManagedGroup(result.group, { ...context, runtimeId: result.runtime_id }) });
  }
  if (Object.hasOwn(result, "group")) throw failure("PROTOCOL_INCOMPATIBLE", "non-terminal managed lifecycle envelope contains a group");
  if (!Object.hasOwn(result, "providers")) return Object.freeze({
    version: result.version,
    request_id: result.request_id,
    runtime_id: result.runtime_id,
    state: result.state,
    material_id: result.material_id,
  });
  return Object.freeze({
    version: result.version,
    request_id: result.request_id,
    runtime_id: result.runtime_id,
    state: result.state,
    material_id: result.material_id,
    providers: validateManagedHealthProviders(result.providers, context.providers),
  });
}

function parsePublicRun(wire) {
  const timeout = () => failure("PROCESS_TIMEOUT", "3rd-review public run exceeded the local broker timeout");
  let result = null;
  try { result = JSON.parse(wire?.stdout ?? ""); }
  catch {
    if (wire?.timedOut) throw timeout();
    // stderr is a diagnostic channel, not a second result channel. Only the
    // explicitly safe public error object may cross it; a JSON-looking group
    // or findings object there must not be mistaken for a terminal result.
    try {
      const stderrValue = JSON.parse(wire?.stderr ?? "");
      const brokerError = safeBrokerError(stderrValue);
      if (brokerError) throw brokerError;
    } catch (error) {
      if (error?.code && error.code !== "SyntaxError") throw error;
    }
    if (wire?.spawnError) throw failure("BROKER_SPAWN_FAILED", `3rd-review public run could not start; ${wireSummary(wire)}`);
    throw contractFailure(failure("PROTOCOL_INCOMPATIBLE", `3rd-review public run did not return JSON; ${wireSummary(wire)}`), wire);
  }
  if (wire?.timedOut) {
    // Only a terminal public v3 object emitted by this very child can survive
    // cancellation. Its full binding is checked in runGroup before exposure.
    const controlledExit = [0, 3, 143].includes(wire.exitCode)
      || (wire.exitCode === null && wire.signal === "SIGTERM");
    if (!controlledExit || result?.version !== protocol) throw timeout();
    return result;
  }
  const brokerError = safeBrokerError(result);
  if (brokerError) throw brokerError;
  // `run` exits 3 when the terminal provider group is unavailable. Its stdout
  // is still the authoritative public result and must not be discarded.
  if (wire?.exitCode !== 0 && wire?.exitCode !== 3) {
    throw failure("BROKER_EXIT_NONZERO", `3rd-review public run exited without a terminal result; ${wireSummary(wire)}`);
  }
  return result;
}

export function registerReviewSupplement(initialResult, supplement) {
  if (!initialResult || typeof initialResult !== "object" || Array.isArray(initialResult)
      || !supplement || typeof supplement !== "object" || Array.isArray(supplement)) {
    throw failure("SUPPLEMENT_INVALID", "initial result and supplement must be objects");
  }
  const initialResultRef = initialResult.initial_result_ref ?? initialResult.result_ref ?? initialResult.resultRef;
  validateV3String(initialResultRef, "initial result reference", { publicMetadata: true });
  const publication = initialResult.publication;
  const publishedAt = publication?.published_at ?? initialResult.published_at;
  if (!Number.isSafeInteger(publishedAt) || publishedAt < 0) {
    throw failure("SUPPLEMENT_INVALID", "initial result published_at is required");
  }
  validateV3String(supplement.supplement_id, "supplement_id", { publicMetadata: true });
  validateV3String(supplement.initial_result_ref, "supplement.initial_result_ref", { publicMetadata: true });
  validateV3String(supplement.provider, "supplement.provider", { publicMetadata: true });
  if (supplement.initial_result_ref !== initialResultRef
      || !Number.isSafeInteger(supplement.arrival_at) || supplement.arrival_at < publishedAt
      || !Array.isArray(supplement.findings)) {
    throw failure("SUPPLEMENT_INVALID", "supplement is not bound to the initial result and publication clock");
  }
  let normalizedFindings;
  try {
    normalizedFindings = parseReviewerOutput(JSON.stringify({ findings: supplement.findings }), { requireEvidence: true }).findings
      .map((finding) => ({ ...finding, provider: supplement.provider }));
  } catch (error) {
    throw failure("SUPPLEMENT_INVALID", `supplement findings are invalid: ${error.message}`);
  }
  const arrivalElapsedMs = supplement.arrival_at - publishedAt;
  const windowStatus = arrivalElapsedMs < LATE_SUPPLEMENT_WINDOW_MS ? "in_window" : "over_window_unjudged";
  if (supplement.arrival_elapsed_ms !== undefined && supplement.arrival_elapsed_ms !== arrivalElapsedMs) {
    throw failure("SUPPLEMENT_INVALID", "supplement arrival_elapsed_ms is invalid");
  }
  if (supplement.window_status !== undefined && supplement.window_status !== windowStatus) {
    throw failure("SUPPLEMENT_INVALID", "supplement window_status is invalid");
  }
  const existing = initialResult.supplements ?? [];
  if (!Array.isArray(existing)) throw failure("SUPPLEMENT_INVALID", "initial result supplements must be an array");
  const duplicate = existing.find((item) => item?.supplement_id === supplement.supplement_id);
  if (duplicate) {
    const same = duplicate.initial_result_ref === supplement.initial_result_ref
      && duplicate.provider === supplement.provider
      && duplicate.arrival_at === supplement.arrival_at
      && JSON.stringify(duplicate.findings) === JSON.stringify(normalizedFindings);
    if (!same) throw failure("SUPPLEMENT_CONFLICT", "supplement_id is already bound to different bytes");
    return initialResult;
  }
  const record = Object.freeze({
    supplement_id: supplement.supplement_id,
    initial_result_ref: initialResultRef,
    provider: supplement.provider,
    arrival_at: supplement.arrival_at,
    arrival_elapsed_ms: arrivalElapsedMs,
    window_status: windowStatus,
    ...(supplement.identity ? { identity: Object.freeze(structuredClone(supplement.identity)) } : {}),
    findings: Object.freeze(structuredClone(normalizedFindings)),
  });
  const findings = Array.isArray(initialResult.findings) ? [...initialResult.findings] : [];
  if (windowStatus === "in_window") {
    findings.push(...structuredClone(normalizedFindings));
  }
  return Object.freeze({
    ...initialResult,
    initial_result_ref: initialResultRef,
    findings: Object.freeze(findings),
    supplements: Object.freeze([...existing, record]),
  });
}

export class ReviewProviderClient {
  constructor({ command = null, config = null, invoke = null, timeoutMs = EFFECTIVE_REVIEW_BROKER_TIMEOUT_MS } = {}) {
    if (!invoke && (!command || !config)) throw new TypeError("command and config are required without an injected invoke function");
    if (timeoutMs !== null && (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)) throw new TypeError("timeoutMs must be null or a positive safe integer");
    this.command = Array.isArray(command) ? command : command ? [command] : null; this.config = config; this.invoke = invoke ?? ((value) => this.#invokeCli(value));
    this.timeoutMs = timeoutMs;
  }

  async startManaged({ requestId, hostProvider, providers, materials, prompt, reviewMode = null, reviewFlow = null, minimumHeterologous, minimum_heterologous } = {}) {
    if (!(typeof requestId === "string" && requestId.trim() !== "" && !containsPrivatePath(requestId)
        && typeof hostProvider === "string" && hostProvider.trim() !== "" && !containsPrivatePath(hostProvider)
        && Array.isArray(providers) && providers.length > 0
        && materials?.bundleRoot && materials?.materialId && prompt)) {
      throw new TypeError("requestId, hostProvider, providers, materials, and prompt are required");
    }
    if (providers.some((provider) => typeof provider !== "string" || provider.trim() === "") || new Set(providers).size !== providers.length) {
      throw new TypeError("providers must be a unique non-empty string array");
    }
    const minimum = validateMinimumHeterologous(minimumHeterologous, minimum_heterologous);
    if (reviewMode !== null && !reviewModes.has(reviewMode)) throw new TypeError("reviewMode is unsupported");
    if (reviewFlow && reviewMode !== "single_round") throw failure("PROTOCOL_INCOMPATIBLE", "direction-review.v1 requires single_round review mode");
    const entries = (materials.deliveryManifest ?? materials.manifest ?? []).map(({ path, bytes, sha256 }) => ({
      source: String(materials.sourcePrefix ?? "") + "/" + path, destination: path, size: bytes, sha256, embed: false,
    }));
    const request = {
      version: 4,
      host_provider: hostProvider,
      // Option 1 (user decision 2026-09-11), both halves landed: 3rd-review now
      // accepts v3 for managed sessions and this caller uses the same protocol +
      // negotiated delivery as runGroup. Before this, an embedded-only provider
      // (codex declares attachment_delivery ["always_embed"]) was structurally
      // excluded from every managed review: it failed closed with
      // ATTACHMENT_DELIVERY_UNSUPPORTED before dispatch (observed:
      // started_at_ms null, duration_ms null).
      required_result_protocol: protocol,
      provider_allowlist: [...providers],
      minimum_heterologous: minimum,
      prompt,
      deadline_ms: null,
      ...(reviewMode ? { review_mode: reviewMode } : {}),
      ...(reviewFlow ? { review_flow: validateDirectionFlow(reviewFlow) } : {}),
      ...(materials.contractId ? { contract_id: materials.contractId } : {}),
      ...(materials.contractHash ? { contract_hash: materials.contractHash } : {}),
      ...(materials.semanticHash ? { semantic_hash: materials.semanticHash } : {}),
    };
    const attachments = { version: 1, bundle_id: materials.materialId, entries };
    const wire = await this.invoke({
      command: "start", requestId, request, attachments,
      attachmentsRoot: materials.attachmentRoot, attachmentDelivery: "negotiated",
    });
    return parseManagedEnvelope(wire, {
      command: "start", requestId, runtimeId: null, materialId: materials.materialId,
      hostProvider, providers: new Set(providers),
    });
  }

  async statusManaged({ runtimeId = null, requestId = null, hostProvider, providers, materials } = {}) {
    if (typeof hostProvider === "string" && containsPrivatePath(hostProvider)) {
      throw failure("PUBLIC_RESULT_INVALID", "hostProvider contains a private path");
    }
    if (!(((runtimeId === null && this.command === null)
        || (typeof runtimeId === "string" && runtimeId.trim() !== "" && !containsPrivatePath(runtimeId)))
        && typeof hostProvider === "string" && hostProvider.trim() !== "" && !containsPrivatePath(hostProvider)
        && Array.isArray(providers) && providers.length > 0 && materials?.materialId)) {
      throw new TypeError("runtimeId, hostProvider, providers, and materials are required");
    }
    if (requestId !== null && (typeof requestId !== "string" || requestId.trim() === "" || containsPrivatePath(requestId))) {
      throw new TypeError("requestId must be null or a non-empty public identifier");
    }
    if (providers.some((provider) => typeof provider !== "string" || provider.trim() === "") || new Set(providers).size !== providers.length) {
      throw new TypeError("providers must be a unique non-empty string array");
    }
    const wire = await this.invoke({ command: "status", runtimeId });
    return parseManagedEnvelope(wire, {
      command: "status", requestId, runtimeId, materialId: materials.materialId,
      hostProvider, providers: new Set(providers),
    });
  }

  async cancelManaged({ runtimeId, requestId = null, hostProvider, providers, materials } = {}) {
    if (typeof hostProvider === "string" && containsPrivatePath(hostProvider)) {
      throw failure("PUBLIC_RESULT_INVALID", "hostProvider contains a private path");
    }
    if (!(typeof runtimeId === "string" && runtimeId.trim() !== "" && !containsPrivatePath(runtimeId)
        && typeof hostProvider === "string" && hostProvider.trim() !== ""
        && Array.isArray(providers) && providers.length > 0 && materials?.materialId)) {
      throw new TypeError("runtimeId, hostProvider, providers, and materials are required");
    }
    if (requestId !== null && (typeof requestId !== "string" || requestId.trim() === "" || containsPrivatePath(requestId))) {
      throw new TypeError("requestId must be null or a non-empty public identifier");
    }
    if (providers.some((provider) => typeof provider !== "string" || provider.trim() === "") || new Set(providers).size !== providers.length) {
      throw new TypeError("providers must be a unique non-empty string array");
    }
    const wire = await this.invoke({ command: "cancel", runtimeId });
    return parseManagedEnvelope(wire, {
      command: "cancel", requestId, runtimeId, materialId: materials.materialId,
      hostProvider, providers: new Set(providers),
    });
  }

  async runGroup({ hostProvider, providers, materials, prompt, attachmentDelivery = null, reviewFlow = null, reviewMode = null, strictProtocol = true, minimumHeterologous, minimum_heterologous } = {}) {
    if (!(hostProvider && Array.isArray(providers) && providers.length > 0 && materials?.bundleRoot && materials?.materialId && prompt)) throw new TypeError("hostProvider, providers, materials, and prompt are required");
    if (providers.some((provider) => typeof provider !== "string" || provider.length === 0) || new Set(providers).size !== providers.length) throw new TypeError("providers must be a unique non-empty string array");
    const minimum = validateMinimumHeterologous(minimumHeterologous, minimum_heterologous);
    if (reviewMode !== null && !reviewModes.has(reviewMode)) throw new TypeError("reviewMode is unsupported");
    if (reviewFlow && reviewMode !== "single_round") throw failure("PROTOCOL_INCOMPATIBLE", "direction-review.v1 requires single_round review mode");
    // A v3 provider group may contain profiles with different attachment
    // capabilities (for example Kimi/Antigravity=file_only and
    // Codex=always_embed). Let 3rd-review negotiate per provider instead of
    // deriving one group-wide mode from the presence of a Codex profile.
    // Negotiated delivery keeps the shared material identity embed:false;
    // the broker resolves the actual provider transport after capability
    // selection. Explicit delivery remains available for single-provider or
    // deliberately constrained callers.
    const effectiveAttachmentDelivery = attachmentDelivery ?? "negotiated";
    if (!["file_only", "always_embed", "negotiated"].includes(effectiveAttachmentDelivery)) throw new TypeError("attachmentDelivery must be file_only, always_embed, or negotiated");
    if (providers.length > 1 && attachmentDelivery !== null && effectiveAttachmentDelivery !== "negotiated") {
      throw failure("PROTOCOL_INCOMPATIBLE", "multi-provider review groups must use negotiated attachment delivery");
    }
    const entries = (materials.deliveryManifest ?? materials.manifest ?? []).map(({ path, bytes, sha256 }) => ({ source: `${materials.sourcePrefix}/${path}`, destination: path, size: bytes, sha256, embed: effectiveAttachmentDelivery === "always_embed" }));
    // Each caller makes one public broker run. 3rd-review owns the group-level
    // heterologous filter, dispatch, native-session lifecycle, and all public
    // per-provider outcomes. Its public run contract does not promise
    // cross-caller deduplication, so WorkflowHub does not claim it here.
    const request = {
      version: 4,
      host_provider: hostProvider,
      required_result_protocol: protocol,
      provider_allowlist: [...providers],
      minimum_heterologous: minimum,
      prompt,
      // A public WorkflowHub request never supplies a wall-clock deadline.
      // The broker owns health/liveness termination and may only expose a
      // PROCESS_STALLED terminal after its configured no-progress rule.
      deadline_ms: null,
      ...(reviewMode ? { review_mode: reviewMode } : {}),
      ...(reviewFlow ? { review_flow: validateDirectionFlow(reviewFlow) } : {}),
      ...(materials.contractId ? { contract_id: materials.contractId } : {}),
      ...(materials.contractHash ? { contract_hash: materials.contractHash } : {}),
      ...(materials.semanticHash ? { semantic_hash: materials.semanticHash } : {}),
    };
    const attachments = { version: 1, bundle_id: materials.materialId, entries };
    const wire = await this.invoke({
      command: "run", request, attachments, attachmentsRoot: materials.attachmentRoot, attachmentDelivery: effectiveAttachmentDelivery,
    });
    const result = parsePublicRun(wire);
    if (result.version === protocol) {
      if (strictProtocol === false && wire?.timedOut !== true) {
        return Object.freeze({
          runtimeId: typeof result.runtime_id === "string" ? result.runtime_id : null,
          outcome: typeof result.outcome === "string" ? result.outcome : null,
          round: Number.isSafeInteger(result.round) ? result.round : null,
          selectedTier: Number.isSafeInteger(result.selected_tier) ? result.selected_tier : null,
          ...(Object.hasOwn(result, "initial_result_ref") ? { initial_result_ref: result.initial_result_ref } : {}),
          ...(result.publication ? { publication: result.publication } : {}),
          ...(Array.isArray(result.supplements) ? { supplements: result.supplements } : {}),
          providers: Object.freeze(Array.isArray(result.providers) ? result.providers.map((item) => Object.freeze({
            ...item,
            provider: item?.identity?.provider ?? item?.provider ?? "unknown",
          })) : []),
        });
      }
      const validated = validateV3Group(result, {
        hostProvider,
        providers: new Set(providers),
        materialId: materials.materialId,
        contractId: materials.contractId ?? null,
        contractHash: materials.contractHash ?? null,
        semanticHash: materials.semanticHash ?? null,
      });
      // The broker wire uses snake_case; keep the group terminal facts beside
      // the normalized members. Dropping `outcome` makes a partial/unavailable
      // group look like an ordinary completed member set.
      return Object.freeze({
        runtimeId: validated.runtime_id,
        outcome: validated.outcome,
        round: validated.round,
        selectedTier: validated.selected_tier,
        providers: validated.providers,
        ...(Object.hasOwn(validated, "initial_result_ref") ? { initial_result_ref: validated.initial_result_ref } : {}),
        ...(validated.publication ? { publication: validated.publication } : {}),
        ...(validated.supplements ? { supplements: validated.supplements } : {}),
        ...(wire?.timedOut ? { transport_timeout: Object.freeze({
          code: "PROCESS_TIMEOUT", exit_code: wire.exitCode ?? null, signal: wire.signal ?? null,
        }) } : {}),
      });
    }
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned a legacy result; this WorkflowHub consumer requires workflowhub-result.v3");
  }

  async #invokeCli({ command, request = null, requestId = null, runtimeId = null, attachments = null, attachmentsRoot = null, attachmentDelivery = null }) {
    let temporary = null;
    try {
      temporary = mkdtempSync(join(tmpdir(), "wh-review-public-"));
      let args;
      if (["run", "start"].includes(command)) {
        const requestPath = join(temporary, "request.json"); const attachmentsPath = join(temporary, "attachments.json");
        writeFileSync(requestPath, `${JSON.stringify(request)}\n`, { mode: 0o600 }); writeFileSync(attachmentsPath, `${JSON.stringify(attachments)}\n`, { mode: 0o600 });
        args = [...this.command.slice(1), command, `--config=${this.config}`, `--request=${requestPath}`, ...(command === "start" ? [`--request-id=${requestId ?? ""}`] : []), `--attachments=${attachmentsPath}`, `--attachments-root=${attachmentsRoot}`, `--attachment-delivery=${attachmentDelivery}`];
      } else if (["status", "cancel"].includes(command)) {
        if (typeof runtimeId !== "string" || runtimeId.trim() === "") throw failure("PROTOCOL_INCOMPATIBLE", `${command} requires a runtime id`);
        args = [...this.command.slice(1), command, `--config=${this.config}`, `--runtime-id=${runtimeId}`];
      } else throw failure("PROTOCOL_INCOMPATIBLE", `unsupported public broker command: ${command}`);
      return await execute(this.command[0], args, { timeoutMs: this.timeoutMs });
    } catch (error) {
      // Local filesystem, spawn, and configuration failures can include host
      // paths. Preserve only a safe typed diagnostic; do not flatten every
      // invocation problem into a protocol mismatch.
      if (error?.code === "PROCESS_TIMEOUT" || error?.code === "PROTOCOL_INCOMPATIBLE" || error?.code === "PUBLIC_RESULT_INVALID" || error?.code === "MATERIAL_INCOMPLETE" || error?.code === "MATERIAL_TOO_LARGE" || error?.code === "BROKER_SPAWN_FAILED" || error?.code === "BROKER_EXIT_NONZERO") throw error;
      throw failure("BROKER_INVOCATION_FAILED", `3rd-review public ${command} could not be invoked`);
    } finally {
      if (temporary !== null) {
        try { rmSync(temporary, { recursive: true, force: true }); }
        catch { /* cleanup failures are local and never part of review evidence */ }
      }
    }
  }
}
