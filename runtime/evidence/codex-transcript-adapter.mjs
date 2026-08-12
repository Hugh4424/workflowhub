import { createMonitoringFact, safePublicRef } from "./monitoring-facts.mjs";
import { isTranscriptSourceReader } from "./fact-collector.mjs";

const SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const TYPED_FACT_TYPES = new Set(["stage", "step", "skill", "session", "subagent", "review", "test", "verify", "artifact", "health", "automation", "human_intervention"]);
const FACT_STATUSES = new Set(["present", "missing", "unknown", "partial", "fatal", "conflict"]);

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function publicRef(value) {
  text(value, "source_ref");
  if (!SAFE_REF.test(value)) throw new Error("source ref must be opaque, not a raw path");
  return safePublicRef(value, "source_ref");
}

export function createRegisteredCodexSource(input = {}) {
  const allowed = new Set(["source_id", "source_ref", "registration_id", "required", "task_id", "run_id", "session_id", "source_format", "source_version", "cli_version", "adapter_version", "reader"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`registered source contains unsupported fields: ${unknown.join(", ")}`);
  publicRef(input.source_ref);
  for (const key of ["source_id", "source_ref", "registration_id", "task_id", "run_id", "session_id", "source_format", "source_version", "cli_version", "adapter_version"]) {
    text(input[key], key);
    if (["source_id", "source_ref", "registration_id", "task_id", "run_id", "session_id"].includes(key) && !SAFE_REF.test(input[key])) throw new Error(`${key} must be an opaque identifier`);
  }
  if (typeof input.required !== "boolean") throw new TypeError("registered Codex source required semantic is required");
  if (input.source_format !== "jsonl" || input.source_version !== "v1") throw new Error("registered Codex source format is unsupported");
  if (!isTranscriptSourceReader(input.reader)) throw new TypeError("launcher-issued transcript reader capability required");
  return Object.freeze({ ...input });
}

function fact(source, options, value) {
  const now = options.now ?? (() => new Date());
  return createMonitoringFact({
    ...value,
    task_id: source.task_id,
    project_name: options.project_name ?? "workflowhub",
    run_id: value.run_id ?? source.run_id,
    attempt_id: value.attempt_id ?? options.attempt_id ?? source.attempt_id ?? null,
    session_id: value.session_id ?? source.session_id,
    source: { kind: "registered_codex", ref: source.source_ref, source_id: source.source_id, source_version: source.source_version },
    adapter_version: source.adapter_version,
    observed_at: value.observed_at ?? now().toISOString(),
  });
}

function effectiveAttemptId(options, payload) {
  return payload?.attempt_id ?? options.attempt_id ?? null;
}

function eventFactId(source, options, kind, id, payload = null) {
  const attemptId = effectiveAttemptId(options, payload);
  return `${kind}:${source.session_id}:${attemptId ? `${attemptId}:` : ""}${id}`;
}

function statusFact(source, options, status, reason, error = null, observed = 0, expected = null) {
  const effectiveReason = reason ?? (status === "partial" ? "source_records_partial" : null);
  return fact(source, options, {
    fact_id: `source:${source.source_id}:status:${status}:${effectiveReason ?? "none"}`,
    fact_type: "source_status", status, value: status === "present" ? { source_id: source.source_id, registration_id: source.registration_id, required: source.required } : null,
    reason: effectiveReason, error, coverage: { observed, expected },
  });
}

function attributionSignature(source, payload, options = {}) {
  const factType = payload.fact_type ?? payload.type;
  return {
    stage: payload.stage ?? null,
    step_id: payload.step_id ?? null,
    skill_id: payload.skill_id ?? null,
    subagent_id: payload.subagent_id ?? null,
    skill_version: payload.skill_version ?? null,
    attempt_id: effectiveAttemptId(options, payload),
    grain: payload.grain ?? (factType === "message" ? "message" : factType === "tool_use" ? "tool_use" : null),
    source_id: payload.source_id ?? source.source_id,
    source_ref: payload.source_ref ?? source.source_ref,
    registration_id: payload.registration_id ?? source.registration_id,
  };
}

function tokenRecord(source, options, line, payload) {
  const attemptId = effectiveAttemptId(options, payload);
  const usage = payload.usage;
  const inputTokens = usage?.input_tokens;
  const outputTokens = usage?.output_tokens;
  const aggregateTokens = usage?.total_tokens ?? usage?.tokens;
  const hasPair = Number.isInteger(inputTokens) && Number.isInteger(outputTokens) && inputTokens >= 0 && outputTokens >= 0;
  const hasAggregate = Number.isInteger(aggregateTokens) && aggregateTokens >= 0;
  if (!hasPair && !hasAggregate) {
    return fact(source, options, {
      fact_id: eventFactId(source, options, "token", payload.id, payload),
      fact_type: "token", stage: payload.stage ?? null, attempt_id: attemptId,
      status: "partial", value: null, reason: "usage_tokens_unavailable", error: null,
      coverage: { observed: 0, expected: 1 },
    });
  }
  return fact(source, options, {
    fact_id: eventFactId(source, options, "token", payload.id, payload),
    fact_type: "token", stage: payload.stage ?? null, step_id: payload.step_id ?? null,
    skill_id: payload.skill_id ?? null, subagent_id: payload.subagent_id ?? null, attempt_id: attemptId,
    status: "present", value: {
      message_id: payload.id,
      ...(hasPair ? { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens } : { total_tokens: aggregateTokens }),
      grain: payload.grain ?? "message",
    },
    coverage: { observed: 1, expected: 1 },
  });
}

function toolRecord(source, options, payload, tool) {
  const attemptId = effectiveAttemptId(options, payload);
  return fact(source, options, {
    fact_id: eventFactId(source, options, "tool", tool.id, payload),
    fact_type: "tool_use", stage: payload.stage ?? null, step_id: payload.step_id ?? null,
    skill_id: payload.skill_id ?? null, subagent_id: payload.subagent_id ?? null, attempt_id: attemptId,
    status: "present", value: { tool_use_id: tool.id, name: tool.name ?? null, grain: payload.grain ?? "tool_use" }, coverage: { observed: 1, expected: 1 },
  });
}

function typedRecord(source, options, payload) {
  const attemptId = effectiveAttemptId(options, payload);
  const factType = payload.fact_type ?? payload.type;
  if (!TYPED_FACT_TYPES.has(factType)) return null;
  const explicitStatus = payload.status;
  const status = explicitStatus === undefined ? "present" : explicitStatus;
  if (!FACT_STATUSES.has(status)) {
    return fact(source, options, {
      fact_id: `${eventFactId(source, options, factType, payload.id, payload)}:status`, fact_type: "source_status", status: "unknown", value: null,
      reason: "unsupported_status", error: "INVALID_FACT_STATUS", coverage: { observed: 0, expected: 1 },
    });
  }
  const value = status === "present" ? payload.value : null;
  if (status === "present" && (!value || typeof value !== "object" || Array.isArray(value))) {
    return fact(source, options, {
      fact_id: eventFactId(source, options, factType, payload.id, payload), fact_type: factType, stage: payload.stage ?? null,
      step_id: payload.step_id ?? null, skill_id: payload.skill_id ?? null, subagent_id: payload.subagent_id ?? null,
      attempt_id: attemptId, status: "partial", value: null, reason: "typed_value_unavailable",
      coverage: { observed: 0, expected: 1 },
    });
  }
  return fact(source, options, {
    fact_id: eventFactId(source, options, factType, payload.id, payload), fact_type: factType, stage: payload.stage ?? null,
    step_id: payload.step_id ?? null, skill_id: payload.skill_id ?? null, subagent_id: payload.subagent_id ?? null,
    attempt_id: attemptId, status, value, reason: status === "present" ? null : (payload.reason ?? "typed_fact_unavailable"),
    error: status === "present" ? null : (payload.error ?? null), coverage: { observed: status === "present" ? 1 : 0, expected: 1 },
    skill_version: payload.skill_version ?? null,
  });
}

export function parseRegisteredCodexTranscript(source, options = {}) {
  if (source === null || source === undefined) {
    return { status: "missing", records: [createMonitoringFact({ fact_id: "source:codex:missing", task_id: options.task_id ?? "unknown-task", project_name: options.project_name ?? "workflowhub", fact_type: "source_status", status: "missing", reason: "no_registered_source", source: { kind: "unknown", ref: "codex-source-missing", source_id: "codex-source", source_version: "v1" }, coverage: { observed: 0, expected: null } })] };
  }
  let raw;
  try { raw = source.reader.read(); }
  catch (error) {
    const status = error?.code === "ENOENT" ? "missing" : "unknown";
    return { status, records: [statusFact(source, options, status, error?.code === "ENOENT" ? "not_found" : "read_error", error?.code ?? "READ_ERROR")] };
  }
  const records = [statusFact(source, options, "present", null, null, 0, null)];
  const messages = new Map();
  const tools = new Map();
  const typedEvents = new Map();
  const durations = new Map();
  const retries = new Map();
  let malformed = false;
  let conflict = false;
  let fatalBinding = false;
  let degraded = false;
  let observed = 0;
  for (const [index, line] of String(raw).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let payload;
    try { payload = JSON.parse(line); if (!payload || typeof payload !== "object" || typeof payload.id !== "string") throw new Error("invalid transcript record"); }
    catch {
      malformed = true;
      records.push(fact(source, options, { fact_id: `source:${source.source_id}:line:${index + 1}:malformed`, fact_type: "source_status", status: "unknown", value: null, reason: "malformed_line", error: "MALFORMED_LINE", coverage: { observed: 0, expected: null } }));
      continue;
    }
    try {
    const bindingMismatch = Object.prototype.hasOwnProperty.call(payload, 'task_id') && payload.task_id !== source.task_id
      ? ['TASK_ID_MISMATCH', 'task_id']
      : Object.prototype.hasOwnProperty.call(payload, 'run_id') && payload.run_id !== source.run_id
        ? ['RUN_ID_MISMATCH', 'run_id']
        : Object.prototype.hasOwnProperty.call(payload, 'session_id') && payload.session_id !== source.session_id
          ? ['SESSION_ID_MISMATCH', 'session_id']
          : Object.prototype.hasOwnProperty.call(payload, 'source_id') && payload.source_id !== source.source_id
            ? ['SOURCE_ID_MISMATCH', 'source_id']
            : null;
    if (bindingMismatch) {
      fatalBinding = true;
      records.push(fact(source, options, { fact_id: `source:${source.source_id}:line:${index + 1}:binding`, fact_type: "source_status", status: "fatal", value: null, reason: "binding_conflict", error: bindingMismatch[0], coverage: { observed: 0, expected: null } }));
      continue;
    }
    const attemptId = effectiveAttemptId(options, payload);
    const typed = typedRecord(source, options, payload);
    if (typed) {
      const factType = payload.fact_type ?? payload.type;
      const identity = `${factType}:${effectiveAttemptId(options, payload) ?? "default"}:${payload.id}`;
      const signature = JSON.stringify({
        value: payload.value ?? null,
        status: payload.status ?? "present",
        attribution: attributionSignature(source, payload, options),
      });
      const prior = typedEvents.get(identity);
      if (prior && prior !== signature) {
        conflict = true;
        records.push(fact(source, options, {
          fact_id: `${eventFactId(source, options, factType, payload.id, payload)}:conflict:${index + 1}`,
          fact_type: factType,
          stage: payload.stage ?? null,
          step_id: payload.step_id ?? null,
          skill_id: payload.skill_id ?? null,
          subagent_id: payload.subagent_id ?? null,
          attempt_id: attemptId,
          status: "conflict",
          value: null,
          reason: "duplicate_id_conflict",
          error: "TYPED_EVENT_ID_CONFLICT",
          coverage: { observed: 0, expected: 1 },
        }));
      } else if (!prior) {
        typedEvents.set(identity, signature);
        records.push(typed);
        if (typed.status !== "present") degraded = true;
        else observed += 1;
      }
    } else if (payload.type === "message") {
      const messageKey = `${attemptId ?? "default"}:${payload.id}`;
      const prior = messages.get(messageKey);
      const signature = JSON.stringify({ usage: payload.usage ?? null, attribution: attributionSignature(source, payload, options) });
      if (prior && prior !== signature) {
        conflict = true;
        records.push(fact(source, options, { fact_id: `${eventFactId(source, options, "token", payload.id, payload)}:conflict:${index + 1}`, fact_type: "token", stage: payload.stage ?? null, attempt_id: attemptId, status: "conflict", value: null, reason: "duplicate_id_conflict", error: "MESSAGE_ID_CONFLICT", coverage: { observed: 0, expected: 1 } }));
      } else if (!prior) {
        messages.set(messageKey, signature);
        const record = tokenRecord(source, options, null, payload);
        if (record.status !== "present") degraded = true;
        records.push(record); observed += 1;
      }
    } else if (payload.type === "tool_use" && payload.tool_use?.id) {
      const id = payload.tool_use.id;
      const signature = JSON.stringify({ tool_use: payload.tool_use, attribution: attributionSignature(source, payload, options) });
      const toolKey = `${attemptId ?? "default"}:${id}`;
      const prior = tools.get(toolKey);
      if (prior && prior !== signature) {
        conflict = true;
        records.push(fact(source, options, { fact_id: `${eventFactId(source, options, "tool", id, payload)}:conflict:${index + 1}`, fact_type: "tool_use", stage: payload.stage ?? null, attempt_id: attemptId, status: "conflict", value: null, reason: "duplicate_id_conflict", error: "TOOL_USE_ID_CONFLICT", coverage: { observed: 0, expected: 1 } }));
      } else if (!prior) {
        tools.set(toolKey, signature); records.push(toolRecord(source, options, payload, payload.tool_use)); observed += 1;
      }
    } else if (payload.type === "duration" || Number.isInteger(payload.duration_ms)) {
      const durationId = payload.id;
      const durationKey = `${attemptId ?? "default"}:${durationId}`;
      const durationValue = payload.duration_ms;
      const signature = JSON.stringify({ duration: durationValue, grain: payload.grain ?? "session", attribution: attributionSignature(source, payload, options) });
      const prior = durations.get(durationKey);
      if (prior && prior !== signature) {
        conflict = true;
        records.push(fact(source, options, { fact_id: `${eventFactId(source, options, "duration", durationId, payload)}:conflict:${index + 1}`, fact_type: "duration", stage: payload.stage ?? null, session_id: source.session_id, attempt_id: attemptId, status: "conflict", value: null, reason: "duplicate_id_conflict", error: "DURATION_ID_CONFLICT", coverage: { observed: 0, expected: 1 } }));
      } else if (!prior) {
        durations.set(durationKey, signature);
        if (!Number.isInteger(durationValue) || durationValue < 0) {
          degraded = true;
          records.push(fact(source, options, { fact_id: eventFactId(source, options, "duration", durationId, payload), fact_type: "duration", stage: payload.stage ?? null, session_id: source.session_id, attempt_id: attemptId, status: "partial", value: null, reason: "duration_unavailable", coverage: { observed: 0, expected: 1 } }));
        } else {
          records.push(fact(source, options, { fact_id: eventFactId(source, options, "duration", durationId, payload), fact_type: "duration", stage: payload.stage ?? null, session_id: source.session_id, attempt_id: attemptId, status: "present", value: { duration_ms: durationValue, event_id: durationId, grain: payload.grain ?? "session" }, coverage: { observed: 1, expected: 1 } }));
          observed += 1;
        }
      }
    } else if (payload.type === "retry" || Number.isInteger(payload.retry_count)) {
      const retryId = payload.retry_id ?? payload.id;
      const retryKey = `${attemptId ?? "default"}:${retryId}`;
      const retryValue = payload.retry_count;
      const signature = JSON.stringify({ retry: retryValue, attempt_id: attemptId, grain: payload.grain ?? "session", attribution: attributionSignature(source, payload, options) });
      const prior = retries.get(retryKey);
      if (prior && prior !== signature) {
        conflict = true;
          records.push(fact(source, options, { fact_id: `${eventFactId(source, options, "retry", retryId, payload)}:conflict:${index + 1}`, fact_type: "retry", stage: payload.stage ?? null, session_id: source.session_id, status: "conflict", value: null, reason: "duplicate_id_conflict", error: "RETRY_ID_CONFLICT", coverage: { observed: 0, expected: 1 } }));
      } else if (!prior) {
        retries.set(retryKey, signature);
        if (!Number.isInteger(retryValue) || retryValue < 0) {
          degraded = true;
          records.push(fact(source, options, { fact_id: eventFactId(source, options, "retry", retryId, payload), fact_type: "retry", stage: payload.stage ?? null, session_id: source.session_id, attempt_id: attemptId, status: "partial", value: null, reason: "retry_count_unavailable", coverage: { observed: 0, expected: 1 } }));
        } else {
          records.push(fact(source, options, { fact_id: eventFactId(source, options, "retry", retryId, payload), fact_type: "retry", stage: payload.stage ?? null, session_id: source.session_id, attempt_id: attemptId, status: "present", value: { retry_id: retryId, retry_count: retryValue, attempt_id: attemptId, grain: payload.grain ?? "session" }, coverage: { observed: 1, expected: 1 } }));
          observed += 1;
        }
      }
    } else {
      records.push(fact(source, options, { fact_id: eventFactId(source, options, "event", payload.id, payload), fact_type: "transcript_event", stage: payload.stage ?? null, step_id: payload.step_id ?? null, skill_id: payload.skill_id ?? null, status: "present", value: { event_id: payload.id, event_type: payload.type ?? "unknown" }, coverage: { observed: 1, expected: 1 } }));
      observed += 1;
    }
    } catch (error) {
      malformed = true;
      records.push(fact(source, options, {
        fact_id: `source:${source.source_id}:line:${index + 1}:unsupported`, fact_type: "source_status", status: "unknown",
        value: null, reason: "unsupported_record", error: error?.message ?? "UNSUPPORTED_RECORD", coverage: { observed: 0, expected: null },
      }));
    }
  }
  const overallStatus = fatalBinding ? "fatal" : (malformed || conflict || degraded ? "partial" : "present");
  const bindingError = records.find((record) => record.status === "fatal" && record.error)?.error ?? null;
  records[0] = statusFact(source, options, overallStatus, fatalBinding ? "binding_conflict" : null, bindingError, observed, null);
  return { status: overallStatus, records };
}
