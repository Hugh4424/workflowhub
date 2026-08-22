import { createHash } from "node:crypto";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const FACT_TYPES = new Set(["stage", "step", "skill", "session", "subagent", "token", "tool_use", "duration", "retry", "review", "test", "acceptance_criterion", "confirmation", "verify", "artifact", "health", "automation", "human_intervention", "source_status", "transcript_event"]);
// These are event facts, not page/readiness states.  "partial" and "fatal"
// belong to derived diagnostics and projections; keeping them out here
// prevents an unavailable or incomplete observation from masquerading as a
// product outcome.
const STATUSES = new Set(["present", "missing", "skipped", "not_applicable", "unknown", "unavailable", "unsupported", "conflict", "incomplete"]);
const SOURCE_KINDS = new Set(["stage", "registered_codex", "task", "fact", "quality", "derived", "unknown"]);
const SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const KEYS = Object.freeze([
  "schema_version", "fact_id", "task_id", "project_name", "fact_type", "stage", "step_id", "step_slug", "skill_id",
  "session_id", "subagent_id", "run_id", "attempt_id", "status", "value", "reason", "error", "observed_at",
  "source", "coverage", "contract_version", "collector_version", "adapter_version", "skill_version", "evidence_refs",
]);
const KEY_SET = new Set(KEYS);
const LEGACY_KEYS = new Set(KEYS.filter((key) => key !== "step_slug"));
const HISTORICAL_MONITORING_STATUSES = new Set(["partial", "fatal"]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function plain(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}
function nullableText(value, label) {
  if (value !== null && (typeof value !== "string" || value.trim() === "")) throw new TypeError(`${label} must be a string or null`);
  return value;
}
export function safePublicRef(value, label = "ref") {
  text(value, label);
  if (value.startsWith("/") || value.startsWith("~") || value.includes("\\") || value.split("/").includes("..")) throw new Error(`${label} must be an opaque non-path reference`);
  return value;
}

export function validateMonitoringFact(value) {
  if (!plain(value)) throw new TypeError("monitoring fact must be an object");
  const unknown = Object.keys(value).filter((key) => !KEYS.includes(key));
  if (unknown.length) throw new Error(`monitoring fact contains unsupported fields: ${unknown.join(", ")}`);
  if (Object.keys(value).length !== KEYS.length && !(Object.keys(value).length === LEGACY_KEYS.size && Object.keys(value).every((key) => LEGACY_KEYS.has(key)))) throw new Error("monitoring fact is missing required fields");
  if (value.schema_version !== "monitoring-fact.v1") throw new Error("monitoring fact schema_version is invalid");
  for (const [key, label] of [["fact_id", "fact_id"], ["task_id", "task_id"], ["project_name", "project_name"]]) {
    text(value[key], label);
    if (!SAFE_ID.test(value[key])) throw new Error(`${label} contains unsafe characters`);
  }
  if (!FACT_TYPES.has(value.fact_type)) throw new Error("monitoring fact fact_type is invalid");
  if (value.stage !== null && !STAGES.has(value.stage)) throw new Error("monitoring fact stage is invalid");
  for (const key of ["step_id", "step_slug", "skill_id", "session_id", "subagent_id", "run_id", "attempt_id"]) {
    if (!(key in value)) continue;
    nullableText(value[key], key);
    if (value[key] !== null && !SAFE_REF.test(value[key])) throw new Error(`${key} must be an opaque identifier`);
  }
  if (!STATUSES.has(value.status)) throw new Error("monitoring fact status is invalid");
  if (value.status === "present" && !plain(value.value)) throw new Error("present monitoring fact requires an object value");
  if (value.status !== "present" && value.value !== null) throw new Error("non-present monitoring fact value must be null");
  nullableText(value.reason, "reason");
  nullableText(value.error, "error");
  if (value.status !== "present" && !value.reason && !value.error) throw new Error("non-present monitoring fact requires reason or error");
  if (!Number.isFinite(Date.parse(value.observed_at))) throw new Error("monitoring fact observed_at is invalid");
  if (!plain(value.source)) throw new Error("monitoring fact source is required");
  const sourceKeys = Object.keys(value.source).sort();
  if (sourceKeys.join("\0") !== ["kind", "ref", "source_id", "source_version"].sort().join("\0")) throw new Error("monitoring fact source shape is invalid");
  if (!SOURCE_KINDS.has(value.source.kind)) throw new Error("monitoring fact source kind is invalid");
  if (!SAFE_REF.test(value.source.ref)) throw new Error("monitoring fact source ref must be an opaque identifier");
  if (!SAFE_REF.test(value.source.source_id)) throw new Error("monitoring fact source_id must be an opaque identifier");
  text(value.source.source_version, "monitoring fact source_version");
  if (!plain(value.coverage) || Object.keys(value.coverage).sort().join("\0") !== ["expected", "observed"].join("\0") || !Number.isInteger(value.coverage.observed) || value.coverage.observed < 0 || (value.coverage.expected !== null && (!Number.isInteger(value.coverage.expected) || value.coverage.expected < 0 || value.coverage.observed > value.coverage.expected))) throw new Error("monitoring fact coverage is invalid");
  text(value.contract_version, "contract_version");
  text(value.collector_version, "collector_version");
  nullableText(value.adapter_version, "adapter_version");
  nullableText(value.skill_version, "skill_version");
  if (!Array.isArray(value.evidence_refs)) throw new Error("monitoring fact evidence_refs is invalid");
  for (const [index, ref] of value.evidence_refs.entries()) {
    try { safePublicRef(ref, `monitoring fact evidence_refs[${index}]`); }
    catch { throw new Error("monitoring fact evidence_refs is invalid"); }
  }
  const allowedValueKeys = {
    stage: ["outcome", "reason", "result_summary", "execution_id", "started_at", "completed_at"], step: ["outcome", "reason", "result_summary", "execution_id", "started_at", "completed_at"], skill: ["trigger", "reason", "executed", "version", "result_summary", "execution_id", "started_at", "completed_at"],
    session: ["duration_ms", "retry_id", "event_id", "event", "timestamp"], subagent: ["parent_id", "origin", "duration_ms"], duration: ["duration_ms", "event_id", "grain", "execution_id"], retry: ["retry_id", "retry_count", "attempt_id", "grain"],
    token: ["message_id", "input_tokens", "output_tokens", "total_tokens", "tokens", "retry_id", "grain", "execution_id"],
    tool_use: ["tool_use_id", "name", "retry_id", "grain"], review: ["invoked", "independent", "outcome", "freshness", "source_ref"],
    test: ["invoked", "independent", "outcome", "freshness", "source_ref"], verify: ["invoked", "fresh", "outcome", "source_ref"], artifact: ["record_kind", "ref", "hash", "name"],
    acceptance_criterion: ["acceptance_criterion_id", "outcome", "freshness", "source_ref"], confirmation: ["subject", "outcome", "freshness", "source_ref"],
    health: ["domain", "status", "friction_type", "error_code", "configured", "used", "expected", "actual", "mismatch"],
    automation: ["origin", "action", "retry_id"], human_intervention: ["origin", "action", "reply", "approval", "override", "request"],
    source_status: ["source_id", "registration_id", "required", "scope", "capabilities"], transcript_event: ["event_id", "event_type", "timestamp"],
  };
  if (value.status === "present") {
    const keys = Object.keys(value.value);
    if (keys.some((key) => !(allowedValueKeys[value.fact_type] ?? []).includes(key))) {
      throw new Error(`monitoring fact ${value.fact_type} value contains unsupported fields`);
    }
    const optionalText = (field) => {
      if (field in value.value && value.value[field] !== null) text(value.value[field], `${value.fact_type}.${field}`);
    };
    const optionalOpaqueRef = (field) => {
      if (field in value.value && value.value[field] !== null) {
        text(value.value[field], `${value.fact_type}.${field}`);
        if (!SAFE_REF.test(value.value[field])) throw new Error(`monitoring fact ${value.fact_type}.${field} must be an opaque identifier`);
      }
    };
    const optionalTimestamp = (field) => {
      if (field in value.value && value.value[field] !== null && (typeof value.value[field] !== "string" || !Number.isFinite(Date.parse(value.value[field])))) {
        throw new Error(`monitoring fact ${value.fact_type}.${field} is invalid`);
      }
    };
    const nonNegativeInteger = (field) => {
      if (!(field in value.value) || !Number.isInteger(value.value[field]) || value.value[field] < 0) {
        throw new Error(`monitoring fact ${value.fact_type}.${field} must be a non-negative integer`);
      }
    };
    const optionalNonNegativeInteger = (field) => {
      if (field in value.value && value.value[field] !== null && (!Number.isInteger(value.value[field]) || value.value[field] < 0)) {
        throw new Error(`monitoring fact ${value.fact_type}.${field} must be a non-negative integer or null`);
      }
    };
    const boolean = (field) => {
      if (!(field in value.value) || typeof value.value[field] !== "boolean") throw new Error(`monitoring fact ${value.fact_type}.${field} must be boolean`);
    };
    const optionalBoolean = (field) => {
      if (field in value.value && value.value[field] !== null && typeof value.value[field] !== "boolean") throw new Error(`monitoring fact ${value.fact_type}.${field} must be boolean or null`);
    };
    const scalar = (field) => {
      if (field in value.value && value.value[field] !== null && !["string", "number", "boolean"].includes(typeof value.value[field])) throw new Error(`monitoring fact ${value.fact_type}.${field} must be a scalar or null`);
    };
    switch (value.fact_type) {
      case "stage":
      case "step":
        optionalText("reason");
        optionalText("result_summary");
        optionalOpaqueRef("execution_id");
        optionalTimestamp("started_at");
        optionalTimestamp("completed_at");
        if (!("outcome" in value.value)) throw new Error(`monitoring fact ${value.fact_type}.outcome is required`);
        text(value.value.outcome, `${value.fact_type}.outcome`);
        break;
      case "skill":
        boolean("trigger");
        optionalBoolean("executed");
        optionalText("reason");
        optionalText("version");
        optionalText("result_summary");
        optionalOpaqueRef("execution_id");
        optionalTimestamp("started_at");
        optionalTimestamp("completed_at");
        break;
      case "session":
        optionalNonNegativeInteger("duration_ms");
        for (const field of ["retry_id", "event_id", "event"]) optionalText(field);
        if ("event" in value.value && !["start", "end"].includes(value.value.event)) throw new Error("monitoring fact session.event is invalid");
        if ("timestamp" in value.value && !Number.isFinite(Date.parse(value.value.timestamp))) throw new Error("monitoring fact session.timestamp is invalid");
        break;
      case "subagent":
        for (const field of ["parent_id", "origin"]) optionalText(field);
        optionalNonNegativeInteger("duration_ms");
        break;
      case "duration":
        nonNegativeInteger("duration_ms");
        optionalText("event_id");
        optionalText("grain");
        optionalOpaqueRef("execution_id");
        if ("grain" in value.value && !SAFE_REF.test(value.value.grain)) throw new Error("monitoring fact duration.grain must be an opaque identifier");
        break;
      case "retry":
        optionalText("retry_id");
        nonNegativeInteger("retry_count");
        optionalText("attempt_id");
        optionalText("grain");
        if ("grain" in value.value && !SAFE_REF.test(value.value.grain)) throw new Error("monitoring fact retry.grain must be an opaque identifier");
        break;
      case "token": {
        text(value.value.message_id, "token.message_id");
        const tokenFields = ["input_tokens", "output_tokens", "total_tokens", "tokens"].filter((field) => field in value.value);
        const hasPair = "input_tokens" in value.value && "output_tokens" in value.value;
        const hasAggregate = "total_tokens" in value.value || "tokens" in value.value;
        if (!hasPair && !hasAggregate) throw new Error("monitoring fact token requires input/output pair or aggregate token count");
        for (const field of tokenFields) nonNegativeInteger(field);
        optionalText("retry_id");
        optionalOpaqueRef("execution_id");
        text(value.value.grain, "token.grain");
        if (!SAFE_REF.test(value.value.grain)) throw new Error("monitoring fact token.grain must be an opaque identifier");
        break;
      }
      case "tool_use":
        text(value.value.tool_use_id, "tool_use.tool_use_id");
        if (!("name" in value.value) || (value.value.name !== null && typeof value.value.name !== "string")) throw new Error("monitoring fact tool_use.name must be a string or null");
        optionalText("retry_id");
        text(value.value.grain, "tool_use.grain");
        if (!SAFE_REF.test(value.value.grain)) throw new Error("monitoring fact tool_use.grain must be an opaque identifier");
        break;
      case "review":
      case "test":
        for (const field of ["invoked", "independent"]) optionalBoolean(field);
        for (const field of ["outcome", "freshness"]) optionalText(field);
        if ("source_ref" in value.value && value.value.source_ref !== null) safePublicRef(value.value.source_ref, "monitoring fact review.source_ref");
        break;
      case "acceptance_criterion":
        text(value.value.acceptance_criterion_id, "acceptance_criterion.acceptance_criterion_id");
        for (const field of ["outcome", "freshness"]) optionalText(field);
        if ("source_ref" in value.value && value.value.source_ref !== null) safePublicRef(value.value.source_ref, "acceptance_criterion.source_ref");
        break;
      case "confirmation":
        text(value.value.subject, "confirmation.subject");
        for (const field of ["outcome", "freshness"]) optionalText(field);
        if ("source_ref" in value.value && value.value.source_ref !== null) safePublicRef(value.value.source_ref, "confirmation.source_ref");
        break;
      case "verify":
        for (const field of ["invoked", "fresh"]) optionalBoolean(field);
        optionalText("outcome");
        if ("source_ref" in value.value && value.value.source_ref !== null) safePublicRef(value.value.source_ref, "monitoring fact verify.source_ref");
        break;
      case "artifact":
        for (const field of ["record_kind", "hash", "name"]) optionalText(field);
        if ("ref" in value.value) safePublicRef(value.value.ref, "monitoring fact artifact.ref");
        break;
      case "health":
        text(value.value.domain, "health.domain");
        optionalText("status");
        for (const field of ["friction_type", "error_code"]) optionalText(field);
        for (const field of ["configured", "used", "mismatch"]) optionalBoolean(field);
        for (const field of ["expected", "actual"]) scalar(field);
        break;
      case "automation":
      case "human_intervention":
        text(value.value.origin, `${value.fact_type}.origin`);
        for (const field of ["action", "reply", "request"]) optionalText(field);
        for (const field of ["approval", "override"]) optionalBoolean(field);
        optionalText("retry_id");
        break;
      case "source_status":
        if (!SAFE_REF.test(value.value.source_id)) throw new Error("monitoring fact source_status.source_id must be an opaque identifier");
        if (!SAFE_REF.test(value.value.registration_id)) throw new Error("monitoring fact source_status.registration_id must be an opaque identifier");
        if (typeof value.value.required !== "boolean") throw new Error("monitoring fact source_status.required must be boolean");
        if ("scope" in value.value && !["task", "stage"].includes(value.value.scope)) throw new Error("monitoring fact source_status.scope must be task or stage");
        if ("capabilities" in value.value && (!Array.isArray(value.value.capabilities) || value.value.capabilities.some((item) => !SAFE_REF.test(item)) || new Set(value.value.capabilities).size !== value.value.capabilities.length)) throw new Error("monitoring fact source_status.capabilities must be unique opaque identifiers");
        break;
      case "transcript_event":
        text(value.value.event_id, "transcript_event.event_id");
        text(value.value.event_type, "transcript_event.event_type");
        if ("timestamp" in value.value && !Number.isFinite(Date.parse(value.value.timestamp))) throw new Error("monitoring fact transcript_event.timestamp is invalid");
        break;
      default:
        throw new Error(`monitoring fact ${value.fact_type} has no typed value contract`);
    }
  }
  return value;
}

export function createMonitoringFact(input = {}) {
  const value = {
    schema_version: "monitoring-fact.v1",
    fact_id: input.fact_id,
    task_id: input.task_id,
    project_name: input.project_name,
    fact_type: input.fact_type,
    stage: input.stage ?? null,
    step_id: input.step_id ?? null,
    step_slug: input.step_slug ?? null,
    skill_id: input.skill_id ?? null,
    session_id: input.session_id ?? null,
    subagent_id: input.subagent_id ?? null,
    run_id: input.run_id ?? null,
    attempt_id: input.attempt_id ?? null,
    status: input.status,
    value: input.value ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
    observed_at: input.observed_at ?? new Date().toISOString(),
    source: input.source,
    coverage: input.coverage ?? { observed: 0, expected: null },
    contract_version: input.contract_version ?? "m15-monitoring-contract.v1",
    collector_version: input.collector_version ?? "m15-monitoring-collector.v1",
    adapter_version: input.adapter_version ?? null,
    skill_version: input.skill_version ?? null,
    evidence_refs: input.evidence_refs ?? [],
  };
  validateMonitoringFact(value);
  return Object.freeze(value);
}

export function monitoringFactHash(value) {
  validateMonitoringFact(value);
  return sha256(JSON.stringify(value));
}

export function isMonitoringFact(value) {
  try { validateMonitoringFact(value); return true; } catch { return false; }
}

/**
 * Read-only compatibility predicate for monitoring rows written before
 * partial/fatal were removed from the event-fact contract. These rows remain
 * immutable historical evidence; current writers still reject those states.
 */
export function isHistoricalMonitoringFact(value) {
  if (!plain(value) || value.schema_version !== "monitoring-fact.v1" || !HISTORICAL_MONITORING_STATUSES.has(value.status)) return false;
  if (Object.keys(value).some((key) => !KEY_SET.has(key)) || (Object.keys(value).length !== KEYS.length && !(Object.keys(value).length === LEGACY_KEYS.size && Object.keys(value).every((key) => LEGACY_KEYS.has(key))))) return false;
  try {
    validateMonitoringFact({ ...value, status: "unknown" });
    return true;
  } catch {
    return false;
  }
}

export { FACT_TYPES, STAGES, STATUSES };
