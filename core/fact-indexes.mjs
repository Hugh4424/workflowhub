import { canonicalJson, contentHash } from "./canonical-source.mjs";

export const FACT_SCHEMA_VERSION = "v1";
export const COLLECTOR_VERSION = "v1";
export const SKILLS_SCHEMA_ID = "https://workflowhub.local/schemas/skills-inventory.schema.json";
export const RUNTIME_FACT_SCHEMA_VERSION = "runtime-facts.v1";
export const RUNTIME_FACT_COLLECTOR_VERSION = "1.0.0";
export const RUNTIME_FACT_TYPES = Object.freeze(["cost", "conversation", "session", "subagent", "step_skip", "automation"]);
export const RUNTIME_FACT_SOURCE_CLASSES = Object.freeze({
  cost: "billing_usage_receipt",
  conversation: "message_metadata",
  session: "launcher_adapter_registry",
  subagent: "launcher_adapter_registry",
  step_skip: "canonical_skipped_receipt",
  automation: "launcher_orchestrator_dispatch",
});
export const RUNTIME_FACT_V2_SCHEMA_VERSION = "runtime-facts.v2";
export const RUNTIME_FACT_V2_COLLECTOR_VERSION = "1.0.0";
export const RUNTIME_FACT_V2_TYPES = Object.freeze([
  "cost", "token", "duration", "tool_count", "attribution", "review",
  "verification", "stage_reconciliation", "human_intervention", "automation_rate",
]);
export const RUNTIME_FACT_V2_SOURCE_CLASSES = Object.freeze({
  cost: "usage_receipt", token: "usage_receipt", duration: "usage_receipt", tool_count: "usage_receipt",
  attribution: "launcher_transcript_metadata", review: "review_record", verification: "verification_receipt",
  stage_reconciliation: "stage_topology_journal", human_intervention: "human_confirmation_record",
  automation_rate: "orchestrator_dispatch",
});
export const RUNTIME_FACT_V2_VALUE_ID_FIELDS = Object.freeze({
  cost: "cost_id", token: "usage_id", duration: "execution_id", tool_count: "execution_id",
  attribution: "attribution_id", review: "review_id", verification: "verification_id",
  stage_reconciliation: "reconciliation_id", human_intervention: "intervention_id", automation_rate: "aggregation_id",
});

const STATUSES = new Set(["present", "missing", "unknown"]);
const TRANSCRIPT_KINDS = new Set(["transcript", "source_status", "parse_error"]);
const ARTIFACT_KINDS = new Set(["stage_result", "handoff", "artifact", "evidence", "review", "test"]);
const TRANSCRIPT_REASONS = new Set(["no_registered_source", "not_found", "read_error", "unsupported_format", "malformed_line", "duplicate_id_conflict"]);
const ARTIFACT_REASONS = new Set(["not_found", "read_error", "unsupported_format", "duplicate_id_conflict"]);
const HEALTH_DOMAINS = new Set([
  "task_dir", "worktree", "review", "verify", "handoff", "transcript",
  "skill_missing", "artifact_missing", "token_waste",
]);
const SKILL_FIELDS = new Set(["name", "path", "version", "stage", "owner", "source", "portable", "metrics_expected", "subagent_friendly", "description", "inputs", "outputs", "required_reads", "notes"]);
const TRANSCRIPT_FIELDS = new Set(["schema_version", "collector_version", "record_kind", "id", "run_id", "status", "source_ref", "source_format", "source_version", "line_number", "content_hash", "payload", "reason", "error", "variant_hashes", "variant_source_refs"]);
const ARTIFACT_FIELDS = new Set(["schema_version", "collector_version", "record_kind", "id", "run_id", "stage", "status", "ref", "required", "content_hash", "source_ref", "reason", "error"]);
const HEALTH_FIELDS = new Set(["schema_version", "collector_version", "fact_id", "run_id", "stage", "domain", "status", "observed_value", "source_ref", "reason", "error"]);
const RUNTIME_FACT_FIELDS = new Set(["schema_version", "collector_version", "fact_id", "fact_type", "status", "value", "source", "observed_at", "reason", "error", "scope"]);
const RUNTIME_SOURCE_FIELDS = new Set(["class", "registration_id", "object_id"]);
const RUNTIME_SCOPE_FIELDS = new Set(["run_id", "session_id", "agent_id", "stage", "step", "attempt_id"]);
const RUNTIME_UNKNOWN_REASONS = new Set(["read_error", "unsupported_format", "malformed_line", "duplicate_id_conflict", "legacy_not_collected"]);
const RUNTIME_MISSING_REASONS = new Set(["no_registered_source", "not_found"]);

const text = (value) => typeof value === "string" && value.trim() ? value : null;
const nullableText = (value) => value == null || typeof value === "string";
const nullableObject = (value) => value == null || (typeof value === "object" && !Array.isArray(value));
const sortedUnique = (values) => [...new Set(values.filter(text))].sort((a, b) => a.localeCompare(b));
const sameOrNull = (values) => values.every((value) => value === values[0]) ? values[0] : null;

export function safeError(code, message) {
  const known = {
    MALFORMED_LINE: "Malformed JSONL record",
    DUPLICATE_ID_CONFLICT: "Conflicting records share the same identity",
    UNSUPPORTED_FORMAT: "Unsupported schema version",
    CONTRACT_MISMATCH: "Skills inventory schema contract does not match",
    RUNTIME_FACT_READ_ERROR: "Runtime fact source could not be read",
    RUNTIME_FACT_UNSUPPORTED_FORMAT: "Runtime fact source format is unsupported",
    RUNTIME_FACT_MALFORMED_LINE: "Runtime fact source contains a malformed line",
    RUNTIME_FACT_DUPLICATE_ID_CONFLICT: "Runtime facts share the same identity with different values",
    RUNTIME_FACT_LEGACY_NOT_COLLECTED: "Legacy runtime fact was not collected",
    RUNTIME_FACT_V2_READ_ERROR: "Runtime fact v2 source could not be read",
    RUNTIME_FACT_V2_UNSUPPORTED_FORMAT: "Runtime fact v2 source format is unsupported",
    RUNTIME_FACT_V2_MALFORMED_LINE: "Runtime fact v2 source contains a malformed line",
    RUNTIME_FACT_V2_DUPLICATE_ID_CONFLICT: "Runtime facts v2 share the same identity with different values",
  };
  return { code, message: known[code] ?? "Fact index error" };
}

const runtimeError = (reason) => safeError(`RUNTIME_FACT_${reason.toUpperCase()}`, reason);

function runtimeSourceKey(source = {}) {
  return {
    class: source.class ?? null,
    registration_id: source.registration_id ?? null,
    object_id: source.object_id ?? null,
  };
}

export function runtimeFactId({ fact_type, source = {} } = {}) {
  if (!RUNTIME_FACT_TYPES.includes(fact_type)) return null;
  const key = runtimeSourceKey(source);
  return `rf_${contentHash({ fact_type, source: key })}`;
}

function runtimeScope(input = {}) {
  const scope = input.scope ?? input;
  return {
    run_id: scope.run_id ?? input.run_id ?? null,
    session_id: scope.session_id ?? input.session_id ?? null,
    agent_id: scope.agent_id ?? input.agent_id ?? null,
    stage: scope.stage ?? input.stage ?? null,
    step: scope.step ?? input.step ?? null,
    attempt_id: scope.attempt_id ?? input.attempt_id ?? null,
  };
}

export function createRuntimeFact(input = {}) {
  const source = runtimeSourceKey(input.source ?? {
    class: input.source_class,
    registration_id: input.registration_id,
    object_id: input.object_id,
  });
  const fact_type = input.fact_type ?? null;
  return {
    schema_version: input.schema_version ?? RUNTIME_FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? RUNTIME_FACT_COLLECTOR_VERSION,
    fact_id: input.fact_id ?? runtimeFactId({ fact_type, source }),
    fact_type,
    status: input.status ?? "unknown",
    value: input.value ?? null,
    source,
    observed_at: input.observed_at ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
    scope: runtimeScope(input),
  };
}

function exactObject(value, fields) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every((field) => fields.has(field))
    && [...fields].every((field) => Object.hasOwn(value, field));
}

function validTimestamp(value) {
  return text(value) && /Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function validNullableTimestamp(value) {
  return value === null || validTimestamp(value);
}

function validRuntimeValue(factType, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (factType === "cost") {
    return exactObject(value, new Set(["receipt_id", "amount_minor", "currency", "unit"]))
      && text(value.receipt_id) && Number.isInteger(value.amount_minor) && value.amount_minor >= 0
      && typeof value.currency === "string" && /^[A-Z]{3}$/.test(value.currency) && text(value.unit);
  }
  if (factType === "conversation") {
    return exactObject(value, new Set(["conversation_id", "message_id", "role", "message_created_at", "channel"]))
      && text(value.conversation_id) && text(value.message_id) && nullableText(value.role)
      && validNullableTimestamp(value.message_created_at) && nullableText(value.channel);
  }
  if (factType === "session") {
    return exactObject(value, new Set(["session_id", "adapter_id", "parent_session_id", "started_at", "ended_at"]))
      && text(value.session_id) && text(value.adapter_id) && nullableText(value.parent_session_id)
      && validNullableTimestamp(value.started_at) && validNullableTimestamp(value.ended_at);
  }
  if (factType === "subagent") {
    return exactObject(value, new Set(["agent_id", "adapter_id", "parent_agent_id", "session_id", "started_at", "ended_at"]))
      && text(value.agent_id) && text(value.adapter_id) && nullableText(value.parent_agent_id)
      && nullableText(value.session_id) && validNullableTimestamp(value.started_at) && validNullableTimestamp(value.ended_at);
  }
  if (factType === "step_skip") {
    return exactObject(value, new Set(["skipped", "step_id", "skip_reason", "authorizer", "receipt_ref"]))
      && value.skipped === true && text(value.step_id) && text(value.skip_reason)
      && text(value.authorizer) && text(value.receipt_ref) && !pathLike(value.receipt_ref);
  }
  if (factType === "automation") {
    return exactObject(value, new Set(["dispatch_id", "orchestrator_id", "action", "outcome", "dispatched_at"]))
      && text(value.dispatch_id) && text(value.orchestrator_id) && text(value.action)
      && text(value.outcome) && validTimestamp(value.dispatched_at);
  }
  return false;
}

function runtimeValueObjectId(factType, value) {
  return value?.[{
    cost: "receipt_id", conversation: "message_id", session: "session_id",
    subagent: "agent_id", step_skip: "receipt_ref", automation: "dispatch_id",
  }[factType]];
}

function pathLike(value) {
  return typeof value === "string" && (value.startsWith("/") || value.includes("\\") || value.split("/").some((part) => part === ".."));
}

function safeRuntimeError(error) {
  return exactObject(error, new Set(["code", "message"])) && text(error.code) && text(error.message)
    && !pathLike(error.message) && !/(?:token|secret|password|credential|authorization|bearer|body|content)/i.test(error.message);
}

export function validateRuntimeFact(record) {
  const errors = [];
  validateShape(record, RUNTIME_FACT_FIELDS, errors);
  if (record?.schema_version !== RUNTIME_FACT_SCHEMA_VERSION) errors.push("schema_version is unsupported");
  if (!text(record?.collector_version)) errors.push("collector_version is required");
  if (!text(record?.fact_id) || !/^rf_[a-f0-9]{64}$/.test(record.fact_id)) errors.push("fact_id is invalid");
  if (!RUNTIME_FACT_TYPES.includes(record?.fact_type)) errors.push("fact_type is invalid");
  if (!STATUSES.has(record?.status)) errors.push("status is invalid");
  if (!exactObject(record?.source, RUNTIME_SOURCE_FIELDS)) errors.push("source is invalid");
  if (record?.source && record.source.class !== RUNTIME_FACT_SOURCE_CLASSES[record.fact_type]) errors.push("source class is invalid");
  if (record?.source && (!nullableText(record.source.registration_id) || !nullableText(record.source.object_id))) errors.push("source identifiers are invalid");
  if (!validTimestamp(record?.observed_at)) errors.push("observed_at is invalid");
  if (!exactObject(record?.scope, RUNTIME_SCOPE_FIELDS)) errors.push("scope is invalid");
  if (record?.scope && (!text(record.scope.run_id) || ["session_id", "agent_id", "stage", "step", "attempt_id"].some((field) => !nullableText(record.scope[field])))) errors.push("scope values are invalid");
  if (record?.error !== null && !safeRuntimeError(record?.error)) errors.push("error is invalid or unsafe");
  if (record?.fact_id && record?.fact_type && record?.source && runtimeFactId(record) !== record.fact_id) errors.push("fact_id does not match source identity");
  if (record?.status === "present") {
    if (!validRuntimeValue(record.fact_type, record.value)) errors.push("value is invalid");
    if (!text(record?.source?.registration_id) || !text(record?.source?.object_id)) errors.push("present source identifiers are required");
    if (validRuntimeValue(record.fact_type, record.value) && runtimeValueObjectId(record.fact_type, record.value) !== record.source.object_id) errors.push("source object_id does not match value identity");
    if (record.reason !== null || record.error !== null) errors.push("present reason and error must be null");
  } else if (record?.status === "missing") {
    if (record.value !== null || !RUNTIME_MISSING_REASONS.has(record.reason) || record.error !== null) errors.push("missing record is invalid");
    if (record.reason === "no_registered_source" && (record.source?.registration_id !== null || record.source?.object_id !== null)) errors.push("unregistered source identifiers must be null");
  } else if (record?.status === "unknown") {
    if (record.value !== null || !RUNTIME_UNKNOWN_REASONS.has(record.reason) || !safeRuntimeError(record.error)) errors.push("unknown record is invalid");
  }
  return { ok: errors.length === 0, errors };
}

export function runtimeFactHash(record) {
  const { observed_at: _observedAt, collector_version: _collectorVersion, ...stable } = record;
  return contentHash(stable);
}

export function mergeRuntimeFacts(records) {
  if (!Array.isArray(records)) return { ok: false, code: "INVALID_RECORD", errors: ["records must be an array"] };
  if (records.some((record) => record?.schema_version !== RUNTIME_FACT_SCHEMA_VERSION)) {
    return { ok: false, code: "UNSUPPORTED_FORMAT", error: safeError("UNSUPPORTED_FORMAT", "Unsupported schema version") };
  }
  const errors = records.flatMap((record) => validateRuntimeFact(record).errors);
  if (errors.length) return { ok: false, code: "INVALID_RECORD", errors };
  const groups = group(records, (record) => record.fact_id);
  const merged = [];
  for (const entries of groups.values()) {
    const hashes = new Set(entries.map(runtimeFactHash));
    if (hashes.size === 1) {
      merged.push(createRuntimeFact(deterministic(entries)));
      continue;
    }
    const first = deterministic(entries);
    merged.push(createRuntimeFact({
      ...first,
      status: "unknown",
      value: null,
      reason: "duplicate_id_conflict",
      error: runtimeError("duplicate_id_conflict"),
      fact_id: first.fact_id,
    }));
  }
  return { ok: true, records: merged.sort((left, right) => left.fact_type.localeCompare(right.fact_type) || left.fact_id.localeCompare(right.fact_id)) };
}

export const createRuntimeFactRecord = createRuntimeFact;
export const validateRuntimeFactRecord = validateRuntimeFact;
export const mergeRuntimeFactRecords = mergeRuntimeFacts;

const RUNTIME_FACT_V2_FIELDS = new Set(["schema_version", "collector_version", "fact_id", "fact_type", "status", "value", "source", "observed_at", "reason", "error", "scope"]);
const RUNTIME_FACT_V2_SOURCE_FIELDS = new Set(["class", "registration_id", "object_id"]);
const RUNTIME_FACT_V2_SCOPE_FIELDS = new Set(["run_id", "session_id", "agent_id", "stage", "step", "attempt_id"]);
const RUNTIME_FACT_V2_MISSING_REASONS = new Set(["no_registered_source", "not_found"]);
const RUNTIME_FACT_V2_UNKNOWN_REASONS = new Set(["read_error", "unsupported_format", "malformed_line", "duplicate_id_conflict"]);

const RUNTIME_FACT_V2_VALUE_FIELDS = Object.freeze({
  cost: new Set(["cost_id", "receipt_id", "amount_minor", "currency", "unit", "line_item_id", "period_start", "period_end"]),
  token: new Set(["usage_id", "input_tokens", "output_tokens", "total_tokens", "unit"]),
  duration: new Set(["execution_id", "duration_ms", "started_at", "ended_at", "measure"]),
  tool_count: new Set(["execution_id", "total_calls", "successful_calls", "failed_calls", "unknown_calls"]),
  attribution: new Set(["attribution_id", "subject_kind", "subject_id", "attributed_kind", "attributed_id", "relation"]),
  review: new Set(["review_id", "stage", "verdict", "finding_count", "reviewer_count", "evidence_id"]),
  verification: new Set(["verification_id", "stage", "result", "passed_count", "failed_count", "evidence_id"]),
  stage_reconciliation: new Set(["reconciliation_id", "stage", "expected_topology_id", "expected_step_id", "observed_state", "terminal_fact_id", "skip_receipt_id"]),
  human_intervention: new Set(["intervention_id", "kind", "actor_id", "action", "reason", "started_at", "ended_at"]),
  automation_rate: new Set(["aggregation_id", "scope_kind", "automated_count", "manual_count", "denominator", "rate_ppm", "period_start", "period_end"]),
});

const v2ExactObject = (value, fields) => exactObject(value, fields);
const v2Timestamp = (value) => text(value) && /Z$/.test(value) && !Number.isNaN(Date.parse(value));
const v2NullableTimestamp = (value) => value === null || v2Timestamp(value);
const v2NonNegativeInteger = (value) => Number.isSafeInteger(value) && value >= 0;
const v2PositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;
const v2SafeString = (value) => text(value) && !pathLike(value);
const V2_FORBIDDEN_KEYS = new Set(["body", "content", "text", "raw", "private_path", "cache", "credential", "password", "secret", "provider_output", "private_session"]);

function v2PrivacySafe(value) {
  if (!value || typeof value !== "object") return true;
  if (Array.isArray(value)) return value.every(v2PrivacySafe);
  return Object.entries(value).every(([key, item]) => !V2_FORBIDDEN_KEYS.has(key) && v2PrivacySafe(item)
    && (typeof item !== "string" || !pathLike(item)));
}

function validRuntimeFactV2Value(factType, value) {
  if (!v2PrivacySafe(value) || !value || typeof value !== "object" || Array.isArray(value)) return false;
  if (factType === "cost") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.cost)
    && v2SafeString(value.cost_id) && v2SafeString(value.receipt_id) && v2NonNegativeInteger(value.amount_minor)
    && /^[A-Z]{3}$/.test(value.currency) && v2SafeString(value.unit) && (value.line_item_id === null || v2SafeString(value.line_item_id))
    && v2NullableTimestamp(value.period_start) && v2NullableTimestamp(value.period_end);
  if (factType === "token") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.token)
    && v2SafeString(value.usage_id) && v2NonNegativeInteger(value.input_tokens) && v2NonNegativeInteger(value.output_tokens)
    && v2NonNegativeInteger(value.total_tokens) && value.unit === "tokens";
  if (factType === "duration") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.duration)
    && v2SafeString(value.execution_id) && v2NonNegativeInteger(value.duration_ms)
    && v2Timestamp(value.started_at) && v2Timestamp(value.ended_at) && new Set(["wall_clock", "active"]).has(value.measure);
  if (factType === "tool_count") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.tool_count)
    && v2SafeString(value.execution_id) && [value.total_calls, value.successful_calls, value.failed_calls, value.unknown_calls].every(v2NonNegativeInteger)
    && value.total_calls === value.successful_calls + value.failed_calls + value.unknown_calls;
  if (factType === "attribution") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.attribution)
    && [value.attribution_id, value.subject_kind, value.subject_id, value.attributed_kind, value.attributed_id, value.relation].every(v2SafeString);
  if (factType === "review") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.review)
    && v2SafeString(value.review_id) && v2SafeString(value.stage) && new Set(["pass", "revise_required", "unavailable"]).has(value.verdict)
    && v2NonNegativeInteger(value.finding_count) && v2PositiveInteger(value.reviewer_count) && v2SafeString(value.evidence_id);
  if (factType === "verification") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.verification)
    && v2SafeString(value.verification_id) && v2SafeString(value.stage) && new Set(["pass", "fail"]).has(value.result)
    && v2NonNegativeInteger(value.passed_count) && v2NonNegativeInteger(value.failed_count) && v2SafeString(value.evidence_id);
  if (factType === "stage_reconciliation") {
    return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.stage_reconciliation)
      && v2SafeString(value.reconciliation_id) && v2SafeString(value.stage) && v2SafeString(value.expected_topology_id)
      && v2SafeString(value.expected_step_id) && new Set(["completed", "failed", "skipped", "missing-stage"]).has(value.observed_state)
      && (value.terminal_fact_id === null || v2SafeString(value.terminal_fact_id)) && (value.skip_receipt_id === null || v2SafeString(value.skip_receipt_id))
      && ((value.observed_state === "completed" || value.observed_state === "failed") && value.terminal_fact_id !== null && value.skip_receipt_id === null
        || value.observed_state === "skipped" && value.terminal_fact_id === null && value.skip_receipt_id !== null
        || value.observed_state === "missing-stage" && value.terminal_fact_id === null && value.skip_receipt_id === null);
  }
  if (factType === "human_intervention") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.human_intervention)
    && [value.intervention_id, value.kind, value.actor_id, value.action, value.reason].every(v2SafeString)
    && v2NullableTimestamp(value.started_at) && v2NullableTimestamp(value.ended_at);
  if (factType === "automation_rate") return v2ExactObject(value, RUNTIME_FACT_V2_VALUE_FIELDS.automation_rate)
    && v2SafeString(value.aggregation_id) && new Set(["run", "stage", "step"]).has(value.scope_kind)
    && v2PositiveInteger(value.denominator) && v2NonNegativeInteger(value.automated_count) && v2NonNegativeInteger(value.manual_count)
    && value.denominator === value.automated_count + value.manual_count && v2NonNegativeInteger(value.rate_ppm) && value.rate_ppm <= 1_000_000
    && value.rate_ppm === Math.round(value.automated_count * 1_000_000 / value.denominator)
    && v2NullableTimestamp(value.period_start) && v2NullableTimestamp(value.period_end);
  return false;
}

function runtimeFactV2Scope(input = {}) {
  const scope = input.scope ?? input;
  return {
    run_id: scope.run_id ?? input.run_id ?? null,
    session_id: scope.session_id ?? input.session_id ?? null,
    agent_id: scope.agent_id ?? input.agent_id ?? null,
    stage: scope.stage ?? input.stage ?? null,
    step: scope.step ?? input.step ?? null,
    attempt_id: scope.attempt_id ?? input.attempt_id ?? null,
  };
}

function runtimeFactV2Source(source = {}) {
  return { class: source.class ?? null, registration_id: source.registration_id ?? null, object_id: source.object_id ?? null };
}

export function runtimeFactV2Id({ fact_type, source = {}, scope = {} } = {}) {
  if (!RUNTIME_FACT_V2_TYPES.includes(fact_type)) return null;
  return `rf2_${contentHash({ fact_type, source: runtimeFactV2Source(source), scope: runtimeFactV2Scope({ scope }) })}`;
}

export function createRuntimeFactV2(input = {}) {
  const fact_type = input.fact_type ?? null;
  const source = runtimeFactV2Source(input.source ?? { class: input.source_class, registration_id: input.registration_id, object_id: input.object_id });
  const scope = runtimeFactV2Scope(input);
  return {
    schema_version: input.schema_version ?? RUNTIME_FACT_V2_SCHEMA_VERSION,
    collector_version: input.collector_version ?? RUNTIME_FACT_V2_COLLECTOR_VERSION,
    fact_id: input.fact_id ?? runtimeFactV2Id({ fact_type, source, scope }),
    fact_type,
    status: input.status ?? "unknown",
    value: input.value ?? null,
    source,
    observed_at: input.observed_at ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
    scope,
  };
}

export function validateRuntimeFactV2(record) {
  const errors = [];
  validateShape(record, RUNTIME_FACT_V2_FIELDS, errors);
  if (record?.schema_version !== RUNTIME_FACT_V2_SCHEMA_VERSION) errors.push("schema_version is unsupported");
  if (!text(record?.collector_version)) errors.push("collector_version is required");
  if (!/^rf2_[a-f0-9]{64}$/.test(record?.fact_id ?? "")) errors.push("fact_id is invalid");
  if (!RUNTIME_FACT_V2_TYPES.includes(record?.fact_type)) errors.push("fact_type is invalid");
  if (!STATUSES.has(record?.status)) errors.push("status is invalid");
  if (!v2ExactObject(record?.source, RUNTIME_FACT_V2_SOURCE_FIELDS)) errors.push("source is invalid");
  if (record?.source?.class !== RUNTIME_FACT_V2_SOURCE_CLASSES[record?.fact_type]) errors.push("source class is invalid");
  if (record?.source && (!nullableText(record.source.registration_id) || !nullableText(record.source.object_id))) errors.push("source identifiers are invalid");
  if (!v2Timestamp(record?.observed_at)) errors.push("observed_at is invalid");
  if (!v2ExactObject(record?.scope, RUNTIME_FACT_V2_SCOPE_FIELDS) || !text(record?.scope?.run_id)
    || ["session_id", "agent_id", "stage", "step", "attempt_id"].some((key) => !nullableText(record.scope[key]))) errors.push("scope is invalid");
  if (record?.error !== null && !safeRuntimeError(record?.error)) errors.push("error is invalid or unsafe");
  if (record?.fact_type && record?.source && record?.scope && runtimeFactV2Id(record) !== record.fact_id) errors.push("fact_id does not match identity");
  if (record?.status === "present") {
    if (!validRuntimeFactV2Value(record.fact_type, record.value)) errors.push("value is invalid");
    const idField = RUNTIME_FACT_V2_VALUE_ID_FIELDS[record.fact_type];
    if (!text(record?.source?.registration_id) || !text(record?.source?.object_id) || !text(record?.value?.[idField])) errors.push("present identity is required");
    if (validRuntimeFactV2Value(record.fact_type, record.value) && record.source.object_id !== record.value[idField]) errors.push("source object_id does not match value identity");
    if (record.reason !== null || record.error !== null) errors.push("present reason and error must be null");
  } else if (record?.status === "missing") {
    if (record.value !== null || !RUNTIME_FACT_V2_MISSING_REASONS.has(record.reason) || record.error !== null) errors.push("missing record is invalid");
    if (record.reason === "no_registered_source" && (record.source?.registration_id !== null || record.source?.object_id !== null)) errors.push("unregistered source identifiers must be null");
  } else if (record?.status === "unknown") {
    if (record.value !== null || !RUNTIME_FACT_V2_UNKNOWN_REASONS.has(record.reason) || !safeRuntimeError(record.error)) errors.push("unknown record is invalid");
  }
  return { ok: errors.length === 0, errors };
}

export function runtimeFactV2Hash(record) {
  const { observed_at: _observedAt, collector_version: _collectorVersion, ...stable } = record;
  return contentHash(stable);
}

export function mergeRuntimeFactsV2(records) {
  if (!Array.isArray(records)) return { ok: false, code: "INVALID_RECORD", errors: ["records must be an array"] };
  const errors = records.flatMap((record) => validateRuntimeFactV2(record).errors);
  if (errors.length) return { ok: false, code: "INVALID_RECORD", errors };
  const merged = [];
  for (const entries of group(records, (record) => record.fact_id).values()) {
    if (new Set(entries.map(runtimeFactV2Hash)).size === 1) {
      merged.push(createRuntimeFactV2(deterministic(entries)));
      continue;
    }
    const first = deterministic(entries);
    merged.push(createRuntimeFactV2({ ...first, status: "unknown", value: null, reason: "duplicate_id_conflict", error: safeError("RUNTIME_FACT_V2_DUPLICATE_ID_CONFLICT") }));
  }
  return { ok: true, records: merged.sort((left, right) => left.fact_type.localeCompare(right.fact_type) || left.fact_id.localeCompare(right.fact_id)) };
}

export const createRuntimeFactV2Record = createRuntimeFactV2;
export const validateRuntimeFactV2Record = validateRuntimeFactV2;
export const mergeRuntimeFactV2Records = mergeRuntimeFactsV2;
export const createRuntimeV2Fact = createRuntimeFactV2;
export const validateRuntimeV2Fact = validateRuntimeFactV2;
export const mergeRuntimeV2Facts = mergeRuntimeFactsV2;

export function createTranscriptRecord(input = {}) {
  return {
    schema_version: input.schema_version ?? FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? COLLECTOR_VERSION,
    record_kind: input.record_kind ?? "transcript",
    id: input.id ?? null,
    run_id: input.run_id ?? null,
    status: input.status ?? "unknown",
    source_ref: input.source_ref ?? null,
    source_format: input.source_format ?? null,
    source_version: input.source_version ?? null,
    line_number: input.line_number ?? null,
    content_hash: input.content_hash ?? null,
    payload: input.payload ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
    variant_hashes: sortedUnique(input.variant_hashes ?? []),
    variant_source_refs: sortedUnique(input.variant_source_refs ?? []),
  };
}

export function createArtifactRecord(input = {}) {
  return {
    schema_version: input.schema_version ?? FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? COLLECTOR_VERSION,
    record_kind: input.record_kind ?? "artifact",
    id: input.id ?? null,
    run_id: input.run_id ?? null,
    stage: input.stage ?? null,
    status: input.status ?? "unknown",
    ref: input.ref ?? null,
    required: input.required ?? false,
    content_hash: input.content_hash ?? null,
    source_ref: input.source_ref ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
  };
}

export function createHealthFact(input = {}) {
  return {
    schema_version: input.schema_version ?? FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? COLLECTOR_VERSION,
    fact_id: input.fact_id ?? null,
    run_id: input.run_id ?? null,
    stage: input.stage ?? null,
    domain: input.domain ?? "artifact_missing",
    status: input.status ?? "unknown",
    observed_value: input.observed_value ?? null,
    source_ref: input.source_ref ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
  };
}

function validateCommon(record, errors) {
  if (!record || typeof record !== "object" || Array.isArray(record)) { errors.push("record must be an object"); return; }
  if (record?.schema_version !== FACT_SCHEMA_VERSION) errors.push("schema_version is unsupported");
  if (!text(record?.collector_version)) errors.push("collector_version is required");
  if (!STATUSES.has(record?.status)) errors.push("status is invalid");
  if (!nullableText(record?.run_id) || !nullableText(record?.source_ref) || !nullableText(record?.reason)) errors.push("nullable text field is invalid");
  if (!nullableObject(record?.error)) errors.push("error must be an object or null");
  if (record?.error && (!text(record.error.code) || !text(record.error.message) || Object.keys(record.error).some((key) => key !== "code" && key !== "message"))) {
    errors.push("error must contain only code and message");
  }
}

function validateShape(record, fields, errors) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return;
  for (const field of fields) if (!Object.hasOwn(record, field)) errors.push(`${field} is required`);
  for (const field of Object.keys(record)) if (!fields.has(field)) errors.push(`field ${field} is not allowed`);
}

export function validateTranscriptRecord(record) {
  const errors = [];
  validateShape(record, TRANSCRIPT_FIELDS, errors);
  validateCommon(record, errors);
  if (!TRANSCRIPT_KINDS.has(record?.record_kind)) errors.push("record_kind is invalid");
  if (!text(record?.id)) errors.push("id is required");
  for (const field of ["source_format", "source_version"]) if (!nullableText(record?.[field])) errors.push(`${field} is invalid`);
  if (record?.line_number != null && (!Number.isInteger(record.line_number) || record.line_number < 1)) errors.push("line_number is invalid");
  if (!nullableText(record?.content_hash) || !nullableObject(record?.payload)) errors.push("content fields are invalid");
  for (const field of ["variant_hashes", "variant_source_refs"]) if (!Array.isArray(record?.[field]) || record[field].some((value) => !text(value))) errors.push(`${field} is invalid`);
  if (record?.reason != null && !TRANSCRIPT_REASONS.has(record.reason)) errors.push("reason is invalid");
  if (record?.reason === "duplicate_id_conflict") {
    if (record.status !== "unknown" || record.content_hash !== null || record.payload !== null || record.variant_hashes.length === 0) errors.push("conflict record is invalid");
  } else if (record?.variant_hashes?.length || record?.variant_source_refs?.length) errors.push("variant fields are reserved for conflicts");
  return { ok: errors.length === 0, errors };
}

export function validateArtifactRecord(record) {
  const errors = [];
  validateShape(record, ARTIFACT_FIELDS, errors);
  validateCommon(record, errors);
  if (!ARTIFACT_KINDS.has(record?.record_kind)) errors.push("record_kind is invalid");
  if (!text(record?.id) || !text(record?.ref) || !text(record?.source_ref)) errors.push("id, ref, and source_ref are required");
  if (!nullableText(record?.stage) || !nullableText(record?.content_hash)) errors.push("nullable artifact field is invalid");
  if (typeof record?.required !== "boolean") errors.push("required must be boolean");
  if (record?.reason != null && !ARTIFACT_REASONS.has(record.reason)) errors.push("reason is invalid");
  if (record?.reason === "duplicate_id_conflict" && (record.status !== "unknown" || record.content_hash !== null)) errors.push("conflict record is invalid");
  return { ok: errors.length === 0, errors };
}

export function validateHealthFact(record) {
  const errors = [];
  validateShape(record, HEALTH_FIELDS, errors);
  validateCommon(record, errors);
  if (!text(record?.fact_id)) errors.push("fact_id is required");
  if (!HEALTH_DOMAINS.has(record?.domain)) errors.push("domain is invalid");
  if (!nullableText(record?.stage)) errors.push("stage is invalid");
  const value = record?.observed_value;
  if (!(value == null || typeof value === "boolean" || typeof value === "string" || (Number.isInteger(value)))) errors.push("observed_value is invalid");
  return { ok: errors.length === 0, errors };
}

export function transcriptHash(record) {
  return contentHash({ record_kind: record.record_kind, id: record.id, run_id: record.run_id, payload: record.payload });
}

export function artifactHash(record) {
  return record.content_hash ?? contentHash({
    record_kind: record.record_kind, id: record.id, run_id: record.run_id, stage: record.stage,
    status: record.status, required: record.required,
  });
}

export function healthHash(record) {
  return contentHash({
    fact_id: record.fact_id, run_id: record.run_id, stage: record.stage, domain: record.domain,
    status: record.status, observed_value: record.observed_value, reason: record.reason,
  });
}

function unsupported(records) {
  return records.some((record) => record?.schema_version !== FACT_SCHEMA_VERSION)
    ? { ok: false, code: "UNSUPPORTED_FORMAT", error: safeError("UNSUPPORTED_FORMAT", "Unsupported schema version") }
    : null;
}

function stableRecord(record) {
  return canonicalJson(record);
}

function group(records, key) {
  const groups = new Map();
  for (const record of records) {
    const id = key(record);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(record);
  }
  return groups;
}

function deterministic(records) {
  return [...records].sort((left, right) => stableRecord(left).localeCompare(stableRecord(right)))[0];
}

function mergeTranscriptGroup(records) {
  const hashes = sortedUnique(records.map(transcriptHash));
  if (hashes.length === 1) {
    const record = deterministic(records);
    return createTranscriptRecord({ ...record, content_hash: hashes[0], source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null });
  }
  const first = deterministic(records);
  return createTranscriptRecord({
    ...first, status: "unknown", content_hash: null, payload: null, reason: "duplicate_id_conflict",
    error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting records share the same identity"),
    run_id: sameOrNull(records.map((item) => item.run_id)),
    source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null,
    variant_hashes: hashes, variant_source_refs: sortedUnique(records.map((item) => item.source_ref)),
  });
}

function mergeArtifactGroup(records) {
  const hashes = sortedUnique(records.map(artifactHash));
  if (hashes.length === 1) {
    const record = deterministic(records);
    return createArtifactRecord({ ...record, content_hash: record.content_hash, ref: sortedUnique(records.map((item) => item.ref))[0], source_ref: sortedUnique(records.map((item) => item.source_ref))[0] });
  }
  const first = deterministic(records);
  return createArtifactRecord({
    ...first, run_id: sameOrNull(records.map((item) => item.run_id)), stage: sameOrNull(records.map((item) => item.stage)),
    status: "unknown", ref: sortedUnique(records.map((item) => item.ref))[0], required: records.some((item) => item.required),
    content_hash: null, source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null,
    reason: "duplicate_id_conflict", error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting records share the same identity"),
  });
}

function mergeHealthGroup(records) {
  const hashes = sortedUnique(records.map(healthHash));
  if (hashes.length === 1) {
    const record = deterministic(records);
    return createHealthFact({ ...record, source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null });
  }
  const first = deterministic(records);
  return createHealthFact({
    ...first, run_id: sameOrNull(records.map((item) => item.run_id)), stage: sameOrNull(records.map((item) => item.stage)),
    status: "unknown", observed_value: null, source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null,
    reason: "duplicate_id_conflict", error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting facts share the same identity"),
  });
}

function merge(records, key, validator, merger, sorter) {
  const version = unsupported(records);
  if (version) return version;
  const errors = records.flatMap((record) => validator(record).errors);
  if (errors.length) return { ok: false, code: "INVALID_RECORD", errors };
  return { ok: true, records: [...group(records, key).values()].map(merger).sort(sorter) };
}

export function mergeTranscriptRecords(records) {
  return merge(records, (record) => `${record.record_kind}\u0000${record.id}`, validateTranscriptRecord, mergeTranscriptGroup,
    (left, right) => left.record_kind.localeCompare(right.record_kind) || left.id.localeCompare(right.id));
}

export function mergeArtifactRecords(records) {
  return merge(records, (record) => `${record.record_kind}\u0000${record.id}`, validateArtifactRecord, mergeArtifactGroup,
    (left, right) => left.record_kind.localeCompare(right.record_kind) || left.id.localeCompare(right.id) || left.ref.localeCompare(right.ref));
}

export function mergeHealthFacts(records) {
  return merge(records, (record) => record.fact_id, validateHealthFact, mergeHealthGroup,
    (left, right) => left.fact_id.localeCompare(right.fact_id));
}

export function validateSkill(skill) {
  const errors = [];
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) return { ok: false, errors: ["skill must be an object"] };
  for (const field of ["name", "path", "version", "stage", "owner", "source", "portable", "metrics_expected", "subagent_friendly"]) if (!Object.hasOwn(skill, field)) errors.push(`${field} is required`);
  if (!text(skill.name) || !text(skill.path)) errors.push("skill name and path are required");
  for (const field of ["version", "stage", "owner", "description", "notes"]) if (!nullableText(skill[field])) errors.push(`${field} is invalid`);
  if (!["repo", "external_adapted", "unknown"].includes(skill.source)) errors.push("source is invalid");
  for (const field of ["portable", "metrics_expected", "subagent_friendly"]) if (typeof skill[field] !== "boolean") errors.push(`${field} must be boolean`);
  for (const field of ["inputs", "outputs", "required_reads"]) if (skill[field] != null && (!Array.isArray(skill[field]) || skill[field].some((value) => !text(value)))) errors.push(`${field} is invalid`);
  for (const field of Object.keys(skill)) if (!SKILL_FIELDS.has(field)) errors.push(`skill field ${field} is not allowed`);
  return { ok: errors.length === 0, errors };
}

export function validateSkillsInventory(inventory) {
  const errors = [];
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) return { ok: false, errors: ["inventory must be an object"] };
  for (const field of ["schema_version", "generated_at", "skills"]) if (!Object.hasOwn(inventory, field)) errors.push(`${field} is required`);
  for (const field of Object.keys(inventory)) if (!(["schema_version", "generated_at", "skills"].includes(field))) errors.push(`inventory field ${field} is not allowed`);
  if (!text(inventory.schema_version) || inventory.schema_version !== FACT_SCHEMA_VERSION) errors.push("schema_version is unsupported");
  if (!text(inventory.generated_at) || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(inventory.generated_at) || Number.isNaN(Date.parse(inventory.generated_at))) errors.push("generated_at must be date-time");
  if (!Array.isArray(inventory.skills)) errors.push("skills must be an array");
  else errors.push(...inventory.skills.flatMap((skill) => validateSkill(skill).errors));
  return { ok: errors.length === 0, errors };
}

export function validateSkillsSchemaContract(schema) {
  const skill = schema?.properties?.skills?.items;
  const required = ["name", "path", "version", "stage", "owner", "source", "portable", "metrics_expected", "subagent_friendly"];
  const exactTop = schema?.$id === SKILLS_SCHEMA_ID && schema?.type === "object" && schema?.additionalProperties === false;
  const exactSkill = skill?.type === "object" && skill?.additionalProperties === false && required.every((field) => skill.required?.includes(field));
  return exactTop && exactSkill
    ? { ok: true }
    : { ok: false, code: "CONTRACT_MISMATCH", error: safeError("CONTRACT_MISMATCH", "Skills inventory schema contract does not match") };
}

export function mergeSkills(skills, { schema_version = FACT_SCHEMA_VERSION, generated_at } = {}) {
  if (!text(schema_version) || schema_version !== FACT_SCHEMA_VERSION) return { ok: false, saved: false, code: "UNSUPPORTED_FORMAT", error: safeError("UNSUPPORTED_FORMAT", "Unsupported schema version") };
  if (!text(generated_at)) return { ok: false, saved: false, code: "INVALID_RECORD", errors: ["generated_at is required"] };
  const groups = group(skills, (skill) => `${skill?.name}\u0000${skill?.path}`);
  const merged = [];
  for (const entries of groups.values()) {
    const errors = entries.flatMap((skill) => validateSkill(skill).errors);
    if (errors.length) return { ok: false, saved: false, code: "INVALID_RECORD", errors };
    if (new Set(entries.map(contentHash)).size !== 1) return { ok: false, saved: false, code: "DUPLICATE_ID_CONFLICT", error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting skills share the same identity") };
    merged.push(deterministic(entries));
  }
  const inventory = { schema_version, generated_at, skills: merged.sort((left, right) => left.name.localeCompare(right.name) || left.path.localeCompare(right.path)) };
  const validation = validateSkillsInventory(inventory);
  return validation.ok ? { ok: true, saved: true, inventory } : { ok: false, saved: false, code: "INVALID_RECORD", errors: validation.errors };
}

export function parseJsonl(input, { index = "transcript", source_ref = null } = {}) {
  const records = [];
  const malformed = (line_number) => {
    if (index === "artifact") return createArtifactRecord({ id: `bad-line:artifact-index:${line_number}`, status: "unknown", ref: "indexes/artifact-index.jsonl", required: false, source_ref: "indexes/artifact-index.jsonl", reason: "unsupported_format", error: safeError("MALFORMED_LINE", "Malformed JSONL record") });
    if (index === "health") return createHealthFact({ fact_id: `bad-line:flow-health:${line_number}`, domain: "artifact_missing", status: "unknown", reason: "malformed_line", error: safeError("MALFORMED_LINE", "Malformed JSONL record") });
    if (index === "runtime" || index === "runtime-facts") return createRuntimeFact({
      fact_type: "automation", status: "unknown", source: { class: RUNTIME_FACT_SOURCE_CLASSES.automation, registration_id: "parser", object_id: `bad-line:${line_number}` },
      observed_at: "1970-01-01T00:00:00.000Z", run_id: "parse-jsonl", reason: "malformed_line", error: runtimeError("malformed_line"),
    });
    if (index === "runtime-v2" || index === "runtime-facts-v2") return createRuntimeFactV2({
      fact_type: "cost", status: "unknown", source: { class: RUNTIME_FACT_V2_SOURCE_CLASSES.cost, registration_id: "parser", object_id: `bad-line:${line_number}` },
      observed_at: "1970-01-01T00:00:00.000Z", run_id: "parse-jsonl", reason: "malformed_line", error: safeError("RUNTIME_FACT_V2_MALFORMED_LINE"),
    });
    return createTranscriptRecord({ record_kind: "parse_error", id: `bad-line:${source_ref ?? "transcript-index"}:${line_number}`, status: "unknown", source_ref, line_number, reason: "malformed_line", error: safeError("MALFORMED_LINE", "Malformed JSONL record") });
  };
  String(input).split(/\r?\n/).forEach((line, offset) => {
    if (!line.trim()) return;
    try {
      const record = JSON.parse(line);
      const isRuntimeV2 = index === "runtime-v2" || index === "runtime-facts-v2";
      if (record?.schema_version != null && record.schema_version !== (isRuntimeV2 ? RUNTIME_FACT_V2_SCHEMA_VERSION : FACT_SCHEMA_VERSION)) { records.push(record); return; }
      const validator = index === "artifact" ? validateArtifactRecord : index === "health" ? validateHealthFact : isRuntimeV2 ? validateRuntimeFactV2 : index === "runtime" || index === "runtime-facts" ? validateRuntimeFact : validateTranscriptRecord;
      if (!validator(record).ok) records.push(malformed(offset + 1));
      else records.push(record);
    } catch {
      const line_number = offset + 1;
      records.push(malformed(line_number));
    }
  });
  return records;
}

export function toJsonl(records) {
  return records.map((record) => canonicalJson(record)).join("\n") + (records.length ? "\n" : "");
}
