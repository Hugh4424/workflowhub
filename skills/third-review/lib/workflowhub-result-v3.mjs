import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { fail } from "./errors.mjs";
import { recoveryCounters } from "./recovery-policy.mjs";

export const WORKFLOWHUB_RESULT_PROTOCOL_V3 = "workflowhub-result.v3";

const memberFields = Object.freeze([
  "attempts", "continuable", "deadline_ms", "error", "identity", "material", "output",
  "provenance", "recovery", "result_protocol", "session_id", "status", "timing", "usage",
].sort());
const identityFields = Object.freeze(["adapter", "config_id", "model", "provider", "source_id"].sort());
const materialFields = Object.freeze(["contract_hash", "contract_id", "material_id", "semantic_hash"].sort());
const provenanceFields = Object.freeze(["raw_output_sha256", "raw_stderr_sha256", "runtime_id"].sort());
const timingFields = Object.freeze(["completed_at_ms", "duration_ms", "started_at_ms"].sort());
const recoveryFields = Object.freeze(["fresh_execution_retry_count", "provider_internal_retry_count", "same_session_repair_count"].sort());
const attemptFields = Object.freeze(["attempt_id", "completed_at_ms", "duration_ms", "error", "kind", "parse_outcome", "process_outcome", "provider_retry_count", "session_id", "started_at_ms", "status"].sort());
const groupFields = Object.freeze(["host_provider", "material_id", "outcome", "providers", "round", "runtime_id", "selected_tier", "version"].sort());
const statuses = new Set(["completed", "failed", "cancelled"]);
const outcomes = new Set(["completed", "partial", "unavailable", "cancelled"]);
const processOutcomes = new Set(["ok", "timeout", "launch_failure", "exit_nonzero"]);
const parseOutcomes = new Set(["ok", "empty_output", "invalid"]);
// Reject host absolute paths while preserving logical API routes and ordinary
// review prose such as `map/AC`, `criterion / rationale`, and
// `currentVNextSnapshot()/currentVNextMaterialRevision()`. The generic check
// deliberately does not treat `)` as a path boundary; private host roots are
// checked separately so a path hidden in code syntax is still rejected.
// Keep generic absolute-path detection while allowing reviewer prose that
// quotes JSX/HTML (`</tag>` and `/>`). The prior pattern treated those markup
// slashes as host paths and rejected otherwise valid provider findings.
const pathPattern = /(?:^|[\s"'`=,:;([{])(?:\/(?![>\s]|api(?:\/|$))[A-Za-z0-9._~%-]+\/[A-Za-z0-9._~%/-]+|[A-Za-z]:[\\/])/u;
const privatePathPattern = /(?:^|[\s("'`=,:;([{])\/(?:Users|home|private|workspace|srv|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)(?:\/|$|[\])},.;:])/u;
const fileUriPattern = /\bfile:\/\//i;
const sha256Pattern = /^[a-f0-9]{64}$/i;

function hasPrivatePath(value) {
  if (typeof value === "string") return pathPattern.test(value) || privatePathPattern.test(value) || fileUriPattern.test(value);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some(hasPrivatePath);
}
function integerOrNull(value, label = "integer") {
  if (value === undefined || value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) fail("PUBLIC_RESULT_INVALID", `${label} must be a non-negative integer or null`);
  return value;
}
function requiredString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0 || hasPrivatePath(value)) fail("PUBLIC_RESULT_INVALID", `${label} must be a safe non-empty string`);
  return value;
}
function enumOrNull(value, allowed, label) {
  if (value === undefined || value === null) return null;
  if (!allowed.has(value)) fail("PUBLIC_RESULT_INVALID", `${label} is invalid`);
  return value;
}
function exactKeys(value, fields, label, code = "PUBLIC_RESULT_INVALID") {
  if (!value || typeof value !== "object" || Array.isArray(value) || !isDeepStrictEqual(Object.keys(value).sort(), fields)) fail(code, `${label} does not match the workflowhub-result.v3 schema`);
}
function safeError(error) {
  if (error === null || error === undefined) return null;
  if (typeof error !== "object" || Array.isArray(error)) fail("PUBLIC_RESULT_INVALID", "v3 error must be an object or null");
  const code = requiredString(error.code, "error.code"); const message = requiredString(error.message, "error.message");
  const causeCode = error.cause_code === undefined || error.cause_code === null ? null : requiredString(error.cause_code, "error.cause_code");
  return { code, message, ...(causeCode === null ? {} : { cause_code: causeCode }) };
}
function safeUsage(value) {
  if (value === undefined || value === null) return null;
  const visit = (current, label, allowDecimal = false) => {
    if (Number.isSafeInteger(current) && current >= 0) return current;
    if (allowDecimal && typeof current === "number" && Number.isFinite(current)
        && current >= 0 && current <= Number.MAX_SAFE_INTEGER) return current;
    if (!current || typeof current !== "object" || Array.isArray(current)) fail("PUBLIC_RESULT_INVALID", `${label} must contain only non-negative safe integers or objects`);
    const keys = Object.keys(current).filter((key) => !["service_tier", "inference_geo", "iterations", "speed"].includes(key));
    if (keys.length === 0) return null;
    if (keys.some((key) => key.trim() === "")) fail("PUBLIC_RESULT_INVALID", `${label} must not be empty`);
    return Object.fromEntries(keys.map((key) => [key, visit(current[key], `${label}.${key}`, allowDecimal || (label === "v3 usage" && key === "cost"))]));
  };
  return visit(value, "v3 usage");
}
function safeAttempt(attempt, index) {
  if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) fail("PUBLIC_RESULT_INVALID", "v3 attempt must be an object");
  if (!statuses.has(attempt.status)) fail("PUBLIC_RESULT_INVALID", "v3 attempt.status is invalid");
  if (!Number.isSafeInteger(attempt.provider_retry_count) || attempt.provider_retry_count < 0) fail("PUBLIC_RESULT_INVALID", "v3 attempt.provider_retry_count is invalid");
  // Rebuild from the public allow-list; broker-only fields remain private.
  const value = {
    attempt_id: requiredString(attempt.attempt_id ?? `attempt-${index + 1}`, "attempt.attempt_id"),
    completed_at_ms: integerOrNull(attempt.completed_at_ms, "attempt.completed_at_ms"),
    duration_ms: integerOrNull(attempt.duration_ms, "attempt.duration_ms"),
    error: safeError(attempt.error ?? null),
    kind: requiredString(attempt.kind ?? "initial", "attempt.kind"),
    parse_outcome: enumOrNull(attempt.parse_outcome, parseOutcomes, "attempt.parse_outcome"),
    process_outcome: enumOrNull(attempt.process_outcome, processOutcomes, "attempt.process_outcome"),
    provider_retry_count: attempt.provider_retry_count,
    session_id: attempt.session_id === null || attempt.session_id === undefined ? null : requiredString(attempt.session_id, "attempt.session_id"),
    started_at_ms: integerOrNull(attempt.started_at_ms, "attempt.started_at_ms"),
    status: attempt.status,
  };
  exactKeys(value, attemptFields, "v3 attempt");
  if (value.started_at_ms !== null && value.completed_at_ms !== null && value.completed_at_ms < value.started_at_ms) {
    fail("PUBLIC_RESULT_INVALID", "v3 attempt completed_at_ms precedes started_at_ms");
  }
  if (value.started_at_ms !== null && value.completed_at_ms !== null && value.duration_ms !== null && value.duration_ms !== value.completed_at_ms - value.started_at_ms) {
    fail("PUBLIC_RESULT_INVALID", "v3 attempt duration_ms does not match its timestamps");
  }
  return value;
}

function validateTiming(value) {
  const timing = {
    started_at_ms: integerOrNull(value?.started_at_ms, "v3 timing.started_at_ms"),
    completed_at_ms: integerOrNull(value?.completed_at_ms, "v3 timing.completed_at_ms"),
    duration_ms: integerOrNull(value?.duration_ms, "v3 timing.duration_ms"),
  };
  exactKeys(timing, timingFields, "v3 timing");
  if (timing.started_at_ms !== null && timing.completed_at_ms !== null && timing.completed_at_ms < timing.started_at_ms) fail("PUBLIC_RESULT_INVALID", "v3 timing completed_at_ms precedes started_at_ms");
  if (timing.started_at_ms !== null && timing.completed_at_ms !== null && timing.duration_ms !== null && timing.duration_ms !== timing.completed_at_ms - timing.started_at_ms) fail("PUBLIC_RESULT_INVALID", "v3 timing duration_ms does not match its timestamps");
  return timing;
}

function timingFromAttempts(attempts) {
  const started = attempts.map((attempt) => attempt.started_at_ms).filter((value) => value !== null);
  const completed = attempts.map((attempt) => attempt.completed_at_ms).filter((value) => value !== null);
  const started_at_ms = started.length ? Math.min(...started) : null;
  const completed_at_ms = completed.length ? Math.max(...completed) : null;
  return {
    started_at_ms,
    completed_at_ms,
    duration_ms: started_at_ms !== null && completed_at_ms !== null
      ? completed_at_ms - started_at_ms
      : null,
  };
}

export function projectWorkflowHubMemberV3(value = {}, context = {}) {
  const provider = requiredString(value.provider, "identity.provider");
  const adapter = requiredString(value.adapter ?? context.adapter, "identity.adapter");
  const identity = {
    provider,
    adapter,
    model: value.model === null || value.model === undefined ? context.model ?? null : requiredString(value.model, "identity.model"),
    source_id: requiredString(context.source_id ?? provider, "identity.source_id"),
    config_id: requiredString(context.config_id ?? createHash("sha256").update(provider).digest("hex"), "identity.config_id"),
  };
  exactKeys(identity, identityFields, "v3 identity");
  const material = {
    material_id: requiredString(context.material_id ?? "unavailable", "material.material_id"),
    contract_id: requiredString(context.contract_id ?? "unavailable", "material.contract_id"),
    contract_hash: requiredString(context.contract_hash ?? "unavailable", "material.contract_hash"),
    semantic_hash: requiredString(context.semantic_hash ?? "unavailable", "material.semantic_hash"),
  };
  exactKeys(material, materialFields, "v3 material");
  if (context.attempts !== undefined && !Array.isArray(context.attempts)) fail("PUBLIC_RESULT_INVALID", "v3 attempts must be an array");
  const attempts = (context.attempts ?? []).map(safeAttempt);
  // `value.retry.count` is legacy adapter telemetry and may include a
  // WorkflowHub recovery turn. Public v3 recovery facts must come from the
  // typed attempt list so fresh execution and same-session repair remain
  // separate from provider-internal retries.
  const recovery = recoveryCounters({ attempts });
  exactKeys(recovery, recoveryFields, "v3 recovery");
  const status = statuses.has(value.status) ? value.status : "failed";
  const result = {
    attempts,
    continuable: value.continuable === true,
    deadline_ms: Number.isSafeInteger(context.deadline_ms) && context.deadline_ms > 0 ? context.deadline_ms : null,
    error: status === "completed" ? null : safeError(value.error ?? { code: "RESULT_UNAVAILABLE", message: "provider result is unavailable" }),
    identity,
    material,
    output: value.output === undefined || value.output === null ? null : requiredString(value.output, "output"),
    provenance: {
      raw_output_sha256: context.raw_output_sha256 === null || context.raw_output_sha256 === undefined ? null : (sha256Pattern.test(context.raw_output_sha256) ? context.raw_output_sha256 : fail("PUBLIC_RESULT_INVALID", "provenance.raw_output_sha256 must be sha256 or null")),
      raw_stderr_sha256: context.raw_stderr_sha256 === null || context.raw_stderr_sha256 === undefined ? null : (sha256Pattern.test(context.raw_stderr_sha256) ? context.raw_stderr_sha256 : fail("PUBLIC_RESULT_INVALID", "provenance.raw_stderr_sha256 must be sha256 or null")),
      runtime_id: requiredString(context.runtime_id, "provenance.runtime_id"),
    },
    recovery,
    result_protocol: WORKFLOWHUB_RESULT_PROTOCOL_V3,
    session_id: value.session_id === null || value.session_id === undefined ? null : requiredString(value.session_id, "session_id"),
    status,
    timing: validateTiming(value.timing ?? timingFromAttempts(attempts)),
    usage: safeUsage(value.usage),
  };
  if (hasPrivatePath(result)) fail("PUBLIC_RESULT_INVALID", "v3 result contains a private path");
  exactKeys(result, memberFields, "v3 member");
  return result;
}

export function assertWorkflowHubResultV3(value) {
  if (value?.version !== WORKFLOWHUB_RESULT_PROTOCOL_V3) fail("PROTOCOL_INCOMPATIBLE", "value is not workflowhub-result.v3");
  exactKeys(value, groupFields, "v3 group");
  if (!outcomes.has(value.outcome) || !Number.isSafeInteger(value.round) || value.round < 1 || typeof value.host_provider !== "string" || !Array.isArray(value.providers) || value.providers.length === 0) fail("PUBLIC_RESULT_INVALID", "v3 group has invalid terminal facts");
  requiredString(value.runtime_id, "runtime_id"); requiredString(value.material_id, "material_id");
  if (!(value.selected_tier === null || (Number.isSafeInteger(value.selected_tier) && value.selected_tier >= 0))) fail("PUBLIC_RESULT_INVALID", "v3 selected_tier is invalid");
  for (const member of value.providers) {
    if (member?.result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V3) fail("PROTOCOL_INCOMPATIBLE", "v3 group contains a mixed-version member");
    exactKeys(member, memberFields, "v3 member");
    if (member.error !== null) {
      const projectedError = safeError(member.error);
      if (!isDeepStrictEqual(projectedError, member.error)) fail("PUBLIC_RESULT_INVALID", "v3 member error is not a canonical public error");
    }
    if (!Array.isArray(member.attempts)) fail("PUBLIC_RESULT_INVALID", "v3 member attempts must be an array");
    for (const [index, attempt] of member.attempts.entries()) {
      const projectedAttempt = safeAttempt(attempt, index);
      if (!isDeepStrictEqual(projectedAttempt, attempt)) fail("PUBLIC_RESULT_INVALID", "v3 member attempt is not a canonical public attempt");
    }
    if (member.provenance.runtime_id !== value.runtime_id || member.material.material_id !== value.material_id) fail("PUBLIC_RESULT_INVALID", "v3 member binding does not match its group");
  }
  if (hasPrivatePath(value)) fail("PUBLIC_RESULT_INVALID", "v3 group contains a private path");
  return value;
}

export function createWorkflowHubResultV3(context = {}) {
  if (!Array.isArray(context.providers) || context.providers.length === 0) fail("PUBLIC_RESULT_INVALID", "v3 group needs providers");
  if (context.providers.some((provider) => provider?.result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V3)) fail("PROTOCOL_INCOMPATIBLE", "v3 group cannot mix result protocols");
  const completed = context.providers.filter((provider) => provider.status === "completed").length;
  const cancelled = context.providers.filter((provider) => provider.status === "cancelled").length;
  const outcome = completed === context.providers.length ? "completed" : completed > 0 ? "partial" : cancelled > 0 ? "cancelled" : "unavailable";
  return assertWorkflowHubResultV3({
    host_provider: requiredString(context.host_provider, "host_provider"),
    material_id: requiredString(context.material_id, "material_id"),
    outcome,
    providers: context.providers,
    round: Number.isSafeInteger(context.round) && context.round > 0 ? context.round : 1,
    runtime_id: requiredString(context.runtime_id, "runtime_id"),
    selected_tier: context.selected_tier === undefined ? null : context.selected_tier,
    version: WORKFLOWHUB_RESULT_PROTOCOL_V3,
  });
}

export const WORKFLOWHUB_RESULT_V3_MEMBER_FIELDS = memberFields;
export const WORKFLOWHUB_RESULT_V3_GROUP_FIELDS = groupFields;
