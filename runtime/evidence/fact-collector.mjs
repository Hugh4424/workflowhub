import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import { artifactReference, assertArtifactDir } from "../../core/artifact-dir.mjs";
import { checkSkillClosure } from "./check-skill-closure.mjs";
import {
  createArtifactRecord,
  createHealthFact,
  createRuntimeFact,
  createRuntimeFactV2,
  createTranscriptRecord,
  mergeArtifactRecords,
  mergeHealthFacts,
  mergeRuntimeFacts,
  mergeRuntimeFactsV2,
  mergeSkills,
  mergeTranscriptRecords,
  parseJsonl,
  RUNTIME_FACT_SOURCE_CLASSES,
  RUNTIME_FACT_TYPES,
  RUNTIME_FACT_V2_SOURCE_CLASSES,
  RUNTIME_FACT_V2_TYPES,
  runtimeFactId,
  safeError,
  toJsonl,
  validateRuntimeFactV2,
  validateSkillsInventory,
  validateSkillsSchemaContract,
} from "../../core/fact-indexes.mjs";
import { captureGitWorktreeSnapshot } from "../task/git-worktree-snapshot.mjs";
import { assertTaskHandle, assertTaskKernel } from "../../core/task-handle.mjs";
import { assertWorkspace } from "../../core/workspace.mjs";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const INDEX_REFS = Object.freeze([
  "indexes/transcript-index.jsonl",
  "indexes/artifact-index.jsonl",
  "indexes/flow-health-facts.jsonl",
  "indexes/skills-inventory.json",
  "indexes/runtime-facts.jsonl",
  "indexes/runtime-facts-v2.jsonl",
]);
const REGISTRIES = new WeakSet();
const READERS = new WeakSet();
const RUNTIME_REGISTRIES = new WeakSet();
const RUNTIME_READERS = new WeakSet();
const RUNTIME_V2_REGISTRIES = new WeakSet();
const RUNTIME_V2_READERS = new WeakSet();
const WRITE_TEST_HOOKS = new WeakSet();
const ENTRY_FIELDS = new Set(["source_id", "source_ref", "source_format", "source_version", "required", "reader"]);
const RUNTIME_ENTRY_FIELDS = new Set(["fact_type", "source_class", "registration_id", "source_format", "source_version", "reader"]);
const RUNTIME_V2_ENTRY_FIELDS = new Set(["fact_type", "source_class", "registration_id", "source_format", "source_version", "reader"]);
const WRITE_HOOK_NAMES = new Set(["afterParentPrecheck", "beforeFileFsync", "afterOpenBeforeRename", "beforeDirectoryFsync"]);
const text = (value) => typeof value === "string" && value.trim() !== "";
const plain = (value) => value && typeof value === "object" && !Array.isArray(value);

function safeRef(value) {
  return text(value) && !path.isAbsolute(value) && !value.includes("\\")
    && !value.split("/").some((part) => part === "" || part === "." || part === "..");
}

/** Minted only by a launcher (or a test launcher); paths never leave this capability. */
export function createTranscriptSourceReader(read) {
  if (typeof read !== "function") throw new TypeError("transcript reader must be a function");
  const reader = Object.freeze({ read: () => read() });
  READERS.add(reader);
  return reader;
}

/** Validate and brand the complete, closed transcript-source registry. */
export function createTranscriptSourceRegistry(entries) {
  if (!Array.isArray(entries)) throw new TypeError("transcript registry entries must be an array");
  const ids = new Set();
  const normalized = entries.map((entry) => {
    if (!plain(entry) || Object.keys(entry).length !== ENTRY_FIELDS.size || Object.keys(entry).some((field) => !ENTRY_FIELDS.has(field))) {
      throw new TypeError("transcript source entry must contain exactly the registered fields");
    }
    if (!text(entry.source_id) || !safeRef(entry.source_ref) || !text(entry.source_format) || !text(entry.source_version) || typeof entry.required !== "boolean") {
      throw new TypeError("invalid transcript source entry");
    }
    if (ids.has(entry.source_id)) throw new TypeError(`duplicate transcript source_id: ${entry.source_id}`);
    if (!READERS.has(entry.reader)) throw new TypeError("launcher-issued transcript reader capability required");
    ids.add(entry.source_id);
    return Object.freeze({ ...entry });
  });
  const registry = Object.freeze(normalized);
  REGISTRIES.add(registry);
  return registry;
}

/** Minted only by a launcher (or a controlled test fixture); it carries no path access. */
export function createRuntimeFactReader(read) {
  if (typeof read !== "function") throw new TypeError("runtime fact reader must be a function");
  const reader = Object.freeze({ read: () => read() });
  RUNTIME_READERS.add(reader);
  return reader;
}

/** Closed source registry. Each fact type has one source class and registration. */
export function createRuntimeFactRegistry(entries) {
  if (!Array.isArray(entries)) throw new TypeError("runtime fact registry entries must be an array");
  const factTypes = new Set();
  const normalized = entries.map((entry) => {
    if (!plain(entry) || Object.keys(entry).some((field) => !RUNTIME_ENTRY_FIELDS.has(field))) {
      throw new TypeError("runtime fact source entry contains unsupported fields");
    }
    const keys = Object.keys(entry);
    for (const field of ["fact_type", "source_class", "registration_id", "reader"]) if (!keys.includes(field)) {
      throw new TypeError(`runtime fact source entry requires ${field}`);
    }
    if (!RUNTIME_FACT_TYPES.includes(entry.fact_type)) throw new TypeError("runtime fact source fact_type is invalid");
    if (RUNTIME_FACT_SOURCE_CLASSES[entry.fact_type] !== entry.source_class) throw new TypeError("runtime fact source class does not match fact_type");
    if (!text(entry.registration_id) || !text(entry.source_format ?? "json") || !text(entry.source_version ?? "v1")) throw new TypeError("invalid runtime fact source entry");
    if (!RUNTIME_READERS.has(entry.reader)) throw new TypeError("launcher-issued runtime fact reader capability required");
    if (factTypes.has(entry.fact_type)) throw new TypeError(`duplicate runtime fact fact_type: ${entry.fact_type}`);
    factTypes.add(entry.fact_type);
    return Object.freeze({
      fact_type: entry.fact_type,
      source_class: entry.source_class,
      registration_id: entry.registration_id,
      source_format: entry.source_format ?? "json",
      source_version: entry.source_version ?? "v1",
      reader: entry.reader,
    });
  });
  const registry = Object.freeze(normalized);
  RUNTIME_REGISTRIES.add(registry);
  return registry;
}

export const createRuntimeFactSourceReader = createRuntimeFactReader;
export const createRuntimeFactSourceRegistry = createRuntimeFactRegistry;

/** Minted only by a launcher (or controlled fixture) for runtime-facts.v2. */
export function createRuntimeFactV2Reader(read) {
  if (typeof read !== "function") throw new TypeError("runtime fact v2 reader must be a function");
  const reader = Object.freeze({ read: () => read() });
  RUNTIME_V2_READERS.add(reader);
  return reader;
}

/** Closed v2 registry. One registration per fact type; shared usage registration is allowed across usage facts. */
export function createRuntimeFactV2Registry(entries) {
  if (!Array.isArray(entries)) throw new TypeError("runtime fact v2 registry entries must be an array");
  const factTypes = new Set();
  const normalized = entries.map((entry) => {
    if (!plain(entry) || Object.keys(entry).length !== RUNTIME_V2_ENTRY_FIELDS.size || Object.keys(entry).some((field) => !RUNTIME_V2_ENTRY_FIELDS.has(field))) {
      throw new TypeError("runtime fact v2 source entry must contain exactly the registered fields");
    }
    if (!text(entry.fact_type) || !RUNTIME_FACT_V2_TYPES.includes(entry.fact_type)) throw new TypeError("runtime fact v2 source fact_type is invalid");
    if (RUNTIME_FACT_V2_SOURCE_CLASSES[entry.fact_type] !== entry.source_class) throw new TypeError("runtime fact v2 source class does not match fact_type");
    if (!text(entry.registration_id) || !text(entry.source_format ?? "json") || !text(entry.source_version ?? "v1")) throw new TypeError("invalid runtime fact v2 source entry");
    if (!RUNTIME_V2_READERS.has(entry.reader)) throw new TypeError("launcher-issued runtime fact v2 reader capability required");
    if (factTypes.has(entry.fact_type)) throw new TypeError(`duplicate runtime fact v2 fact_type: ${entry.fact_type}`);
    factTypes.add(entry.fact_type);
    return Object.freeze({ fact_type: entry.fact_type, source_class: entry.source_class, registration_id: entry.registration_id, source_format: entry.source_format ?? "json", source_version: entry.source_version ?? "v1", reader: entry.reader });
  });
  const registry = Object.freeze(normalized);
  RUNTIME_V2_REGISTRIES.add(registry);
  return registry;
}

export const createRuntimeV2FactReader = createRuntimeFactV2Reader;
export const createRuntimeV2FactRegistry = createRuntimeFactV2Registry;

/** Test-only capability. Launchers never receive raw atomic-write hooks. */
export function createFactCollectorWriteTestHooks(hooks) {
  if (!plain(hooks) || Object.keys(hooks).some((name) => !WRITE_HOOK_NAMES.has(name) || typeof hooks[name] !== "function")) {
    throw new TypeError("fact collector write test hooks must be known functions");
  }
  const capability = Object.freeze({ ...hooks });
  WRITE_TEST_HOOKS.add(capability);
  return capability;
}

function assertRegistry(registry) {
  if (!REGISTRIES.has(registry)) throw new TypeError("branded transcript source registry required");
  return registry;
}

function assertRuntimeRegistry(registry) {
  if (!RUNTIME_REGISTRIES.has(registry)) throw new TypeError("branded runtime fact source registry required");
  return registry;
}

function assertRuntimeV2Registry(registry) {
  if (!RUNTIME_V2_REGISTRIES.has(registry)) throw new TypeError("branded runtime fact v2 source registry required");
  return registry;
}

let emptyRuntimeRegistry;
function defaultRuntimeRegistry() {
  emptyRuntimeRegistry ??= createRuntimeFactRegistry([]);
  return emptyRuntimeRegistry;
}

let emptyRuntimeV2Registry;
function defaultRuntimeV2Registry() {
  emptyRuntimeV2Registry ??= createRuntimeFactV2Registry([]);
  return emptyRuntimeV2Registry;
}

function wrongWorktree(message) {
  const error = new Error(message);
  error.code = "WRONG_WORKTREE";
  return error;
}

/** No optional source is read before this check completes. */
export function preflightFactCollection(ctx) {
  if (!plain(ctx)) throw wrongWorktree("WRONG_WORKTREE: branded StageContext required");
  const task = assertTaskHandle(ctx.task);
  const kernel = assertTaskKernel(ctx.kernel);
  const workspace = assertWorkspace(ctx.workspace);
  const artifacts = assertArtifactDir(ctx.artifacts);
  if (ctx.identity?.projectName !== task.identity.projectName || ctx.identity?.taskId !== task.identity.taskId || kernel.task !== task) {
    throw wrongWorktree("WRONG_WORKTREE: StageContext identity mismatch");
  }
  let decision;
  try { decision = kernel.readAccepted("make-decision"); }
  catch (error) { throw wrongWorktree(`WRONG_WORKTREE: accepted make-decision unavailable (${error.code ?? "invalid"})`); }
  const accepted = decision?.accepted;
  const attempt = decision?.attempt;
  const facts = decision?.facts;
  const attemptRef = accepted?.attempt_ref;
  if (!text(attemptRef) || !/^attempt-[0-9]{4}\.json$/.test(attemptRef)) throw wrongWorktree("WRONG_WORKTREE: accepted make-decision attempt reference invalid");
  if (attempt?.task_id !== task.identity.taskId || attempt?.stage !== "make-decision" || !plain(facts)
      || facts.worktree_root !== workspace.worktreeRoot || facts.baseline_commit !== workspace.baselineCommit) {
    throw wrongWorktree("WRONG_WORKTREE: accepted Workspace binding mismatch");
  }
  let snapshot;
  try { workspace.assertValid(); snapshot = captureGitWorktreeSnapshot(workspace.worktreeRoot); }
  catch { throw wrongWorktree("WRONG_WORKTREE: Workspace snapshot unavailable"); }
  return Object.freeze({ task, kernel, workspace, artifacts, accepted, decisionAttempt: attempt, snapshot });
}

function transcriptError(entry, status, reason, code) {
  return createTranscriptRecord({
    record_kind: "source_status", id: entry.source_id, status, source_ref: entry.source_ref,
    source_format: entry.source_format, source_version: entry.source_version, reason,
    error: code ? safeError(code, code) : null,
  });
}

function transcriptLines(entry, bytes) {
  const records = [];
  String(bytes).split(/\r?\n/).forEach((line, offset) => {
    if (!line.trim()) return;
    try {
      const value = JSON.parse(line);
      if (!plain(value) || !text(value.id)) throw new Error("invalid transcript line");
      records.push(createTranscriptRecord({
        record_kind: "transcript", id: value.id, run_id: text(value.run_id) ? value.run_id : null,
        status: "present", source_ref: entry.source_ref, source_format: entry.source_format,
        source_version: entry.source_version, line_number: offset + 1, payload: value.payload ?? null,
      }));
    } catch {
      records.push(createTranscriptRecord({
        record_kind: "parse_error", id: `bad-line:${entry.source_id}:${offset + 1}`, status: "unknown",
        source_ref: entry.source_ref, source_format: entry.source_format, source_version: entry.source_version,
        line_number: offset + 1, reason: "malformed_line", error: safeError("MALFORMED_LINE", "Malformed JSONL record"),
      }));
    }
  });
  return records;
}

export function buildTranscriptProjection(registry) {
  const sources = assertRegistry(registry);
  if (sources.length === 0) return [createTranscriptRecord({
    record_kind: "source_status", id: "transcript-source-registry", status: "missing", reason: "no_registered_source",
  })];
  const candidates = [];
  for (const entry of sources) {
    if (entry.source_format !== "jsonl" || entry.source_version !== "v1") {
      candidates.push(transcriptError(entry, "unknown", "unsupported_format", "UNSUPPORTED_FORMAT"));
      continue;
    }
    try {
      const value = entry.reader.read();
      if (!(typeof value === "string" || Buffer.isBuffer(value) || value instanceof Uint8Array)) throw new TypeError("reader must return bytes");
      candidates.push(...transcriptLines(entry, value));
    } catch (error) {
      const missing = error?.code === "ENOENT";
      candidates.push(transcriptError(entry, missing ? "missing" : "unknown", missing ? "not_found" : "read_error", missing ? null : "READ_ERROR"));
    }
  }
  const merged = mergeTranscriptRecords(candidates);
  if (!merged.ok) throw new Error(`transcript projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

const RUNTIME_ERROR_CODES = Object.freeze({
  read_error: "RUNTIME_FACT_READ_ERROR",
  unsupported_format: "RUNTIME_FACT_UNSUPPORTED_FORMAT",
  malformed_line: "RUNTIME_FACT_MALFORMED_LINE",
  duplicate_id_conflict: "RUNTIME_FACT_DUPLICATE_ID_CONFLICT",
  legacy_not_collected: "RUNTIME_FACT_LEGACY_NOT_COLLECTED",
});

function runtimeError(reason) {
  return safeError(RUNTIME_ERROR_CODES[reason] ?? "RUNTIME_FACT_READ_ERROR", reason);
}

function runtimeScope(options = {}) {
  const scope = options.scope ?? options;
  const runId = scope.run_id ?? options.runId ?? options.run_id ?? "runtime-fact-collection";
  if (!text(runId)) throw new Error("runtime fact collection run_id is required");
  return {
    run_id: runId,
    session_id: scope.session_id ?? null,
    agent_id: scope.agent_id ?? null,
    stage: scope.stage ?? "build-code",
    step: scope.step ?? null,
    attempt_id: scope.attempt_id ?? null,
  };
}

function runtimeObjectId(factType, value, item = {}) {
  if (text(item.object_id)) return item.object_id;
  const ids = {
    cost: value?.receipt_id,
    conversation: value?.message_id,
    session: value?.session_id,
    subagent: value?.agent_id,
    step_skip: value?.receipt_ref,
    automation: value?.dispatch_id,
  };
  return text(ids[factType]) ? ids[factType] : null;
}

function runtimeFactCandidate(entry, item, options, now) {
  const factType = entry.fact_type;
  const source = { class: entry.source_class, registration_id: entry.registration_id, object_id: null };
  const base = runtimeScope(options);
  const value = plain(item) && Object.hasOwn(item, "value") ? item.value : item;
  const objectId = runtimeObjectId(factType, value, item);
  source.object_id = objectId;
  const observedAt = item?.observed_at ?? now().toISOString();
  const scope = { ...base, ...(plain(item?.scope) ? item.scope : {}) };
  if (item?.legacy_not_collected === true || item?.status === "unknown" && item?.reason === "legacy_not_collected") {
    return createRuntimeFact({ fact_type: factType, source, observed_at: observedAt, scope, status: "unknown", reason: "legacy_not_collected", error: runtimeError("legacy_not_collected") });
  }
  if (item?.status === "missing" || value == null) {
    return createRuntimeFact({ fact_type: factType, source, observed_at: observedAt, scope, status: "missing", reason: item?.reason === "not_found" ? "not_found" : "not_found" });
  }
  if (item?.status === "unknown") {
    const reason = ["read_error", "unsupported_format", "malformed_line", "legacy_not_collected"].includes(item.reason) ? item.reason : "malformed_line";
    return createRuntimeFact({ fact_type: factType, source, observed_at: observedAt, scope, status: "unknown", reason, error: runtimeError(reason) });
  }
  if (plain(value) && ["body", "content", "text"].some((field) => Object.hasOwn(value, field))) {
    return createRuntimeFact({ fact_type: factType, source, observed_at: observedAt, scope, status: "unknown", reason: "unsupported_format", error: runtimeError("unsupported_format") });
  }
  if (factType === "step_skip" && value?.skipped !== true) return null;
  if (!plain(value)) return createRuntimeFact({ fact_type: factType, source, observed_at: observedAt, scope, status: "unknown", reason: "malformed_line", error: runtimeError("malformed_line") });
  const candidate = createRuntimeFact({ fact_type: factType, source, observed_at: observedAt, scope, status: "present", value });
  return candidate;
}

function runtimeSourceItems(entry, raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (Buffer.isBuffer(raw) || raw instanceof Uint8Array) raw = Buffer.from(raw).toString("utf8");
  if (typeof raw === "string") {
    const lines = raw.split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return [];
    const items = [];
    for (const [index, line] of lines.entries()) {
      try { items.push(JSON.parse(line)); }
      catch { items.push({ status: "unknown", reason: "malformed_line", object_id: `bad-line:${index + 1}` }); }
    }
    return items;
  }
  if (plain(raw) && Array.isArray(raw.records)) return raw.records;
  return [raw];
}

function runtimeMissing(entry, options, now) {
  return createRuntimeFact({
    fact_type: entry.fact_type,
    source: { class: entry.source_class, registration_id: null, object_id: null },
    observed_at: now().toISOString(), scope: runtimeScope(options), status: "missing", reason: "no_registered_source",
  });
}

/** Project only launcher-registered direct machine records into runtime-facts.v1. */
export function buildRuntimeFactProjection(registry, options = {}) {
  const sources = assertRuntimeRegistry(registry);
  const now = options.now ?? (() => new Date());
  const candidates = [];
  const byType = new Map(sources.map((entry) => [entry.fact_type, entry]));
  for (const factType of RUNTIME_FACT_TYPES) {
    const entry = byType.get(factType);
    if (!entry) {
      if (factType !== "step_skip") candidates.push(runtimeMissing({ fact_type: factType, source_class: RUNTIME_FACT_SOURCE_CLASSES[factType] }, options, now));
      continue;
    }
    if (entry.source_version !== "v1" || !["json", "jsonl"].includes(entry.source_format)) {
      candidates.push(createRuntimeFact({
        fact_type: factType,
        source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null },
        observed_at: now().toISOString(), scope: runtimeScope(options), status: "unknown", reason: "unsupported_format", error: runtimeError("unsupported_format"),
      }));
      continue;
    }
    let raw;
    try { raw = entry.reader.read(); }
    catch (error) {
      if (error?.code === "ENOENT") candidates.push(createRuntimeFact({
        fact_type: factType,
        source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null },
        observed_at: now().toISOString(), scope: runtimeScope(options), status: "missing", reason: "not_found",
      }));
      else candidates.push(createRuntimeFact({
        fact_type: factType,
        source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null },
        observed_at: now().toISOString(), scope: runtimeScope(options), status: "unknown", reason: "read_error", error: runtimeError("read_error"),
      }));
      continue;
    }
    const items = runtimeSourceItems(entry, raw);
    if (!items.length) {
      if (factType !== "step_skip") candidates.push(createRuntimeFact({
        fact_type: factType,
        source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null },
        observed_at: now().toISOString(), scope: runtimeScope(options), status: "missing", reason: "not_found",
      }));
      continue;
    }
    for (const item of items) {
      const candidate = runtimeFactCandidate(entry, item, options, now);
      if (candidate) candidates.push(candidate);
    }
  }
  const merged = mergeRuntimeFacts(candidates);
  if (!merged.ok) throw new Error(`runtime fact projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

const RUNTIME_V2_ID_FIELDS = Object.freeze({
  cost: "cost_id", token: "usage_id", duration: "execution_id", tool_count: "execution_id",
  attribution: "attribution_id", review: "review_id", verification: "verification_id",
  stage_reconciliation: "reconciliation_id", human_intervention: "intervention_id", automation_rate: "aggregation_id",
});
const RUNTIME_V2_UNKNOWN_REASONS = new Set(["read_error", "unsupported_format", "malformed_line", "duplicate_id_conflict"]);

function runtimeV2Error(reason) {
  return safeError(`RUNTIME_FACT_V2_${reason.toUpperCase()}`);
}

function runtimeV2Scope(options = {}, item = {}) {
  const base = options.scope ?? options;
  const itemScope = plain(item.scope) ? item.scope : {};
  const runId = base.run_id ?? options.runId ?? options.run_id;
  if (!text(runId)) throw new Error("runtime fact v2 collection run_id is required");
  return {
    run_id: runId,
    session_id: itemScope.session_id ?? base.session_id ?? null,
    agent_id: itemScope.agent_id ?? base.agent_id ?? null,
    stage: itemScope.stage ?? base.stage ?? "build-code",
    step: itemScope.step ?? base.step ?? null,
    attempt_id: itemScope.attempt_id ?? base.attempt_id ?? null,
  };
}

function runtimeV2SourceItems(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (Buffer.isBuffer(raw) || raw instanceof Uint8Array) raw = Buffer.from(raw).toString("utf8");
  if (typeof raw === "string") {
    const lines = raw.split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return [];
    return lines.map((line, index) => {
      try { return JSON.parse(line); }
      catch { return { status: "unknown", reason: "malformed_line", object_id: `bad-line:${index + 1}` }; }
    });
  }
  if (plain(raw) && Array.isArray(raw.records)) return raw.records;
  return [raw];
}

function runtimeV2Candidate(entry, item, options, now) {
  const scope = runtimeV2Scope(options, item);
  const observedAt = item?.observed_at ?? now().toISOString();
  const baseSource = { class: entry.source_class, registration_id: entry.registration_id, object_id: null };
  const status = item?.status;
  const reason = item?.reason;
  if (plain(item?.source) && (item.source.class !== entry.source_class || (item.source.registration_id != null && item.source.registration_id !== entry.registration_id))) {
    throw new Error("runtime fact v2 source registration identity mismatch");
  }
  const sourceScope = plain(item?.scope) && item.scope.run_id != null ? item.scope.run_id : scope.run_id;
  if (sourceScope !== scope.run_id) throw new Error("runtime fact v2 source run identity mismatch");
  let value = plain(item) && Object.hasOwn(item, "value") ? item.value : item;
  if (entry.fact_type === "cost" && plain(value) && !Object.hasOwn(value, "cost_id") && text(value.receipt_id)) {
    value = { ...value, cost_id: value.line_item_id ?? value.receipt_id };
  }
  if (entry.fact_type === "cost" && plain(value)) value = { line_item_id: null, period_start: null, period_end: null, ...value };
  if (entry.fact_type === "human_intervention" && plain(value)) value = { started_at: null, ended_at: null, ...value };
  if (status === "missing" || reason === "not_found" || value == null) {
    return createRuntimeFactV2({ fact_type: entry.fact_type, source: baseSource, scope, observed_at: observedAt, status: "missing", reason: "not_found" });
  }
  if (status === "unknown" || reason === "read_error" || reason === "unsupported_format" || reason === "malformed_line" || reason === "duplicate_id_conflict") {
    const objectId = text(item?.object_id) ? item.object_id : null;
    return createRuntimeFactV2({ fact_type: entry.fact_type, source: { ...baseSource, object_id: objectId }, scope, observed_at: observedAt, status: "unknown", reason: RUNTIME_V2_UNKNOWN_REASONS.has(reason) ? reason : "malformed_line", error: runtimeV2Error(RUNTIME_V2_UNKNOWN_REASONS.has(reason) ? reason : "malformed_line") });
  }
  const idField = RUNTIME_V2_ID_FIELDS[entry.fact_type];
  const objectId = value?.[idField];
  const candidate = createRuntimeFactV2({ fact_type: entry.fact_type, source: { ...baseSource, object_id: objectId ?? null }, scope, observed_at: observedAt, status: "present", value });
  if (!validateRuntimeFactV2(candidate).ok) {
    return createRuntimeFactV2({ fact_type: entry.fact_type, source: { ...baseSource, object_id: text(item?.object_id) ? item.object_id : null }, scope, observed_at: observedAt, status: "unknown", reason: "unsupported_format", error: runtimeV2Error("unsupported_format") });
  }
  return candidate;
}

function runtimeV2Missing(entry, options, now, reason = "no_registered_source") {
  return createRuntimeFactV2({ fact_type: entry.fact_type, source: { class: entry.source_class, registration_id: null, object_id: null }, scope: runtimeV2Scope(options), observed_at: now().toISOString(), status: "missing", reason });
}

/** Project only registered, direct machine records into the independent runtime-facts.v2 index. */
export function buildRuntimeFactV2Projection(registry, options = {}) {
  const sources = assertRuntimeV2Registry(registry);
  const now = options.now ?? (() => new Date());
  const byType = new Map(sources.map((entry) => [entry.fact_type, entry]));
  const candidates = [];
  for (const factType of RUNTIME_FACT_V2_TYPES) {
    const entry = byType.get(factType);
    if (!entry) {
      candidates.push(runtimeV2Missing({ fact_type: factType, source_class: RUNTIME_FACT_V2_SOURCE_CLASSES[factType] }, options, now));
      continue;
    }
    if (entry.source_version !== "v1" || !["json", "jsonl"].includes(entry.source_format)) {
      candidates.push(createRuntimeFactV2({ fact_type: factType, source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null }, scope: runtimeV2Scope(options), observed_at: now().toISOString(), status: "unknown", reason: "unsupported_format", error: runtimeV2Error("unsupported_format") }));
      continue;
    }
    let raw;
    try { raw = entry.reader.read(); }
    catch (error) {
      candidates.push(error?.code === "ENOENT"
        ? createRuntimeFactV2({ fact_type: factType, source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null }, scope: runtimeV2Scope(options), observed_at: now().toISOString(), status: "missing", reason: "not_found" })
        : createRuntimeFactV2({ fact_type: factType, source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null }, scope: runtimeV2Scope(options), observed_at: now().toISOString(), status: "unknown", reason: "read_error", error: runtimeV2Error("read_error") }));
      continue;
    }
    const items = runtimeV2SourceItems(raw);
    if (!items.length) {
      candidates.push(createRuntimeFactV2({ fact_type: factType, source: { class: entry.source_class, registration_id: entry.registration_id, object_id: null }, scope: runtimeV2Scope(options), observed_at: now().toISOString(), status: "missing", reason: "not_found" }));
      continue;
    }
    for (const item of items) candidates.push(runtimeV2Candidate(entry, item, options, now));
  }
  const merged = mergeRuntimeFactsV2(candidates);
  if (!merged.ok) throw new Error(`runtime fact v2 projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

export const createRuntimeFactV2SourceReader = createRuntimeFactV2Reader;
export const createRuntimeFactV2SourceRegistry = createRuntimeFactV2Registry;

function referenceRecord(preflight, ref) {
  try {
    const probeRef = artifactReference(preflight.task.identity.taskId, "fact-collector-probe");
    const artifactPrefix = `${probeRef.split("/").slice(0, -1).join("/")}/`;
    if (ref.startsWith(artifactPrefix)) {
      const name = ref.slice(artifactPrefix.length);
      return preflight.artifacts.read(name);
    }
    return preflight.task.readRecord(ref);
  } catch (error) {
    throw error;
  }
}

function trustedContentHash(value) {
  const hash = typeof value === "string" ? value.replace(/^sha256:/, "") : "";
  return /^[a-f0-9]{64}$/.test(hash) ? hash : null;
}

function artifactForReference(preflight, { kind, ref, source_ref, run_id = null, stage = null, required = true, content_hash = null }) {
  try {
    referenceRecord(preflight, ref);
    return createArtifactRecord({ record_kind: kind, id: ref, run_id, stage, status: "present", ref, required, content_hash: trustedContentHash(content_hash), source_ref });
  } catch (error) {
    const missing = error?.code === "ENOENT";
    return createArtifactRecord({ record_kind: kind, id: ref, run_id, stage, status: missing ? "missing" : "unknown", ref, required, source_ref, reason: missing ? "not_found" : "read_error", error: missing ? null : safeError("READ_ERROR", "READ_ERROR") });
  }
}

function addFactRefs(target, facts, sourceRef, stage, runId) {
  const add = (kind, ref, content_hash = null) => { if (text(ref) && safeRef(ref)) target.push({ kind, ref, content_hash: trustedContentHash(content_hash), source_ref: sourceRef, stage, run_id: runId }); };
  add("artifact", facts?.decision_ref, facts?.decision_hash);
  for (const key of ["spec_ref", "plan_ref", "tasks_ref"]) add("artifact", facts?.[key]);
  for (const ref of facts?.changed ?? []) add("artifact", ref);
  for (const item of [facts?.review, ...(Object.values(facts?.reviews ?? {}))]) add("review", item?.result_ref, item?.result_hash);
  add("test", facts?.tests?.receipt_ref, facts?.tests?.receipt_hash); add("test", facts?.tests?.output_ref, facts?.tests?.output_hash);
  for (const entry of facts?.evidence_refs ?? []) add("evidence", typeof entry === "string" ? entry : entry?.ref, entry?.sha256);
  for (const entry of facts?.handoff_refs ?? []) add("handoff", entry?.ref ?? entry, entry?.sha256);
  add("handoff", facts?.handoff_ref, facts?.handoff_hash);
}

function readAttempt(preflight, ref, stage) {
  try {
    const raw = preflight.task.readRecord(ref);
    const value = JSON.parse(raw);
    if (value?.task_id !== preflight.task.identity.taskId || value?.stage !== stage || !plain(value.facts)) throw new Error("canonical attempt identity mismatch");
    return { value, raw };
  } catch (error) { return { error }; }
}

export function buildArtifactProjection(preflight) {
  const candidates = [];
  const attempts = [];
  for (const stage of STAGES) {
    const refs = new Set(preflight.task.listStageAttemptRefs(stage));
    try {
      const accepted = preflight.kernel.readAccepted(stage).accepted;
      if (/^attempt-[0-9]{4}\.json$/.test(accepted?.attempt_ref ?? "")) {
        const ref = `results/${stage}/${accepted.attempt_ref}`;
        refs.add(ref);
        attempts.push({ stage, ref, content_hash: trustedContentHash(accepted.integrity_hash) });
      }
    } catch (error) { if (error?.code && error.code !== "ENOENT") candidates.push(createArtifactRecord({ record_kind: "stage_result", id: `${stage}:accepted`, stage, status: "unknown", ref: `results/${stage}/accepted.json`, required: false, source_ref: `results/${stage}/accepted.json`, reason: "read_error", error: safeError("READ_ERROR", "READ_ERROR") })); }
    for (const ref of [...refs].sort()) if (!attempts.some((item) => item.stage === stage && item.ref === ref)) attempts.push({ stage, ref, content_hash: null });
  }
  for (const { stage, ref, content_hash } of attempts) {
    const parsed = readAttempt(preflight, ref, stage);
    if (parsed.error) {
      const missing = parsed.error?.code === "ENOENT";
      candidates.push(createArtifactRecord({ record_kind: "stage_result", id: `${stage}:${path.basename(ref)}`, stage, status: missing ? "missing" : "unknown", ref, required: true, source_ref: ref, reason: missing ? "not_found" : "read_error", error: missing ? null : safeError("READ_ERROR", "READ_ERROR") }));
      continue;
    }
    const runId = text(parsed.value.run_id) ? parsed.value.run_id : null;
    candidates.push(createArtifactRecord({ record_kind: "stage_result", id: `${stage}:${path.basename(ref)}`, run_id: runId, stage, status: "present", ref, required: true, content_hash, source_ref: ref }));
    const declared = [];
    addFactRefs(declared, parsed.value.facts, ref, stage, runId);
    for (const item of parsed.value.evidence_refs ?? []) if (plain(item)) addFactRefs(declared, { evidence_refs: [item] }, ref, stage, runId);
    for (const item of declared) candidates.push(artifactForReference(preflight, item));
  }
  const merged = mergeArtifactRecords(candidates);
  if (!merged.ok) throw new Error(`artifact projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

function inventorySkill(entry) {
  return {
    name: entry.name, path: entry.path, version: entry.local_version ?? null,
    stage: Array.isArray(entry.used_by_stages) && entry.used_by_stages.length === 1 ? entry.used_by_stages[0] : null,
    owner: "workflowhub", source: entry.status === "native" ? "repo" : "external_adapted",
    portable: true, metrics_expected: false, subagent_friendly: true,
    description: entry.purpose ?? null,
  };
}

export function buildSkillsProjection(preflight, now = () => new Date()) {
  const root = preflight.workspace.worktreeRoot;
  const schema = JSON.parse(fs.readFileSync(path.join(root, "runtime/schemas/skills-inventory.schema.json"), "utf8"));
  const contract = validateSkillsSchemaContract(schema);
  if (!contract.ok) throw new Error(contract.error.message);
  const catalog = yaml.load(fs.readFileSync(path.join(root, "skills/catalog.yaml"), "utf8"));
  if (!Array.isArray(catalog?.skills)) throw new Error("skills catalog is invalid");
  const closure = checkSkillClosure(root);
  const result = mergeSkills(catalog.skills.map(inventorySkill), { generated_at: now().toISOString() });
  if (!result.ok) throw new Error(result.error?.message ?? result.code ?? "skills inventory invalid");
  return Object.freeze({ inventory: result.inventory, closure });
}

export function buildHealthProjection(preflight, transcript, artifacts, skills) {
  const transcriptStatus = transcript.some((item) => item.status === "unknown") ? "unknown" : transcript.some((item) => item.status === "present") ? "present" : "missing";
  const artifactStatus = artifacts.some((item) => item.status === "unknown") ? "unknown" : artifacts.some((item) => item.status === "missing") ? "missing" : "present";
  const artifactRefs = artifacts.filter((item) => item.record_kind === "review");
  const verify = artifacts.filter((item) => item.stage === "verify-code" && item.record_kind === "stage_result");
  const handoff = artifacts.filter((item) => item.record_kind === "handoff");
  const facts = [
    createHealthFact({ fact_id: "health:task_dir", domain: "task_dir", status: "present", observed_value: true, source_ref: "task.json" }),
    createHealthFact({ fact_id: "health:worktree", domain: "worktree", status: "present", observed_value: preflight.snapshot.tree, source_ref: "results/make-decision/accepted.json" }),
    createHealthFact({ fact_id: "health:review", domain: "review", status: artifactRefs.some((item) => item.status === "unknown") ? "unknown" : artifactRefs.some((item) => item.status === "missing") ? "missing" : artifactRefs.length ? "present" : "unknown", observed_value: artifactRefs.length, source_ref: artifactRefs[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:verify", domain: "verify", status: verify.some((item) => item.status === "unknown") ? "unknown" : verify.some((item) => item.status === "missing") ? "missing" : verify.length ? "present" : "unknown", observed_value: verify.length, source_ref: verify[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:handoff", domain: "handoff", status: handoff.some((item) => item.status === "unknown") ? "unknown" : handoff.some((item) => item.status === "missing") ? "missing" : handoff.length ? "present" : "unknown", observed_value: handoff.length, source_ref: handoff[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:transcript", domain: "transcript", status: transcriptStatus, observed_value: transcript.filter((item) => item.status === "present").length, source_ref: transcript[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:artifact_missing", domain: "artifact_missing", status: artifactStatus, observed_value: artifacts.filter((item) => item.status === "missing").length, source_ref: artifacts.find((item) => item.status !== "present")?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:skill_missing", domain: "skill_missing", status: skills.closure.ok ? "present" : "missing", observed_value: skills.closure.ok, source_ref: "skills/catalog.yaml", reason: skills.closure.ok ? null : "not_found" }),
    createHealthFact({ fact_id: "health:token_waste", domain: "token_waste", status: "unknown", observed_value: null, reason: "not_found" }),
  ];
  const merged = mergeHealthFacts(facts);
  if (!merged.ok) throw new Error(`health projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

export function collectTaskFacts(ctx, { transcriptRegistry, runtimeRegistry, runtimeFactRegistry, runtimeV2Registry, runtimeFactV2Registry, now = () => new Date(), runId, scope, writeTestHooks } = {}) {
  const preflight = preflightFactCollection(ctx);
  assertRegistry(transcriptRegistry);
  const registeredRuntimeSources = runtimeRegistry ?? runtimeFactRegistry ?? defaultRuntimeRegistry();
  assertRuntimeRegistry(registeredRuntimeSources);
  const registeredRuntimeV2Sources = runtimeV2Registry ?? runtimeFactV2Registry ?? defaultRuntimeV2Registry();
  assertRuntimeV2Registry(registeredRuntimeV2Sources);
  const atomicWriteOptions = writeTestHooks === undefined ? undefined : { testHooks: assertWriteTestHooks(writeTestHooks) };
  const warnings = [];
  let lockFailed = false;
  const files = new Map(INDEX_REFS.map((ref) => [ref, { ref, saved: false, error: null }]));
  const fail = (ref, error) => {
    files.set(ref, { ref, saved: false, error: resultError(error) });
  };
  const save = (ref) => files.set(ref, { ref, saved: true, error: null });

  try {
    const result = preflight.task.withRecordLock("locks/indexes/fact-collection.lock", () => {
      const transcript = persistJsonl(preflight.task, INDEX_REFS[0], "transcript", mergeTranscriptRecords, atomicWriteOptions,
        () => buildTranscriptProjection(transcriptRegistry));
      transcript.saved ? save(INDEX_REFS[0]) : fail(INDEX_REFS[0], transcript.error);

      const artifacts = persistJsonl(preflight.task, INDEX_REFS[1], "artifact", mergeArtifactRecords, atomicWriteOptions,
        () => buildArtifactProjection(preflight));
      artifacts.saved ? save(INDEX_REFS[1]) : fail(INDEX_REFS[1], artifacts.error);

      let skills;
      try { skills = buildSkillsProjection(preflight, now); }
      catch (error) { skills = { error, closure: { ok: false } }; }
      if (!skills.closure.ok) warnings.push({ code: "SKILL_CLOSURE_FAILED", message: "Skill closure validation failed" });

      const health = persistJsonl(preflight.task, INDEX_REFS[2], "health", mergeHealthFacts, atomicWriteOptions,
        () => buildHealthProjection(preflight, transcript.records, artifacts.records, skills),
        (existing, fresh) => fresh.some((fact) => fact.fact_id === existing.fact_id));
      health.saved ? save(INDEX_REFS[2]) : fail(INDEX_REFS[2], health.error);

      const savedSkills = persistSkills(preflight.task, skills, atomicWriteOptions);
      savedSkills.saved ? save(INDEX_REFS[3]) : fail(INDEX_REFS[3], savedSkills.error);

      const runtime = persistJsonl(preflight.task, INDEX_REFS[4], "runtime", mergeRuntimeFacts, atomicWriteOptions,
        () => buildRuntimeFactProjection(registeredRuntimeSources, {
          now,
          runId: runId ?? `${preflight.task.identity.taskId}:${preflight.workspace.baselineCommit}`,
          scope: { ...(scope ?? {}), stage: scope?.stage ?? "build-code" },
        }));
      runtime.saved ? save(INDEX_REFS[4]) : fail(INDEX_REFS[4], runtime.error);

      const runtimeV2 = persistJsonl(preflight.task, INDEX_REFS[5], "runtime-v2", mergeRuntimeFactsV2, atomicWriteOptions,
        () => buildRuntimeFactV2Projection(registeredRuntimeV2Sources, {
          now,
          runId: runId ?? `${preflight.task.identity.taskId}:${preflight.workspace.baselineCommit}`,
          scope: { ...(scope ?? {}), stage: scope?.stage ?? "build-code" },
        }));
      runtimeV2.saved ? save(INDEX_REFS[5]) : fail(INDEX_REFS[5], runtimeV2.error);
    });
    if (result && typeof result.then === "function") throw new Error("asynchronous record locks are unsupported by collectTaskFacts");
  } catch (error) {
    lockFailed = true;
    for (const ref of INDEX_REFS) if (!files.get(ref).saved) fail(ref, error);
    warnings.push({ code: "RECORD_LOCK_FAILED", message: "Fact index lock operation failed" });
  }
  const ordered = INDEX_REFS.map((ref) => files.get(ref));
  return { status: !lockFailed && ordered.every((file) => file.saved) ? "success" : "failed", files: ordered, warnings };
}

function assertWriteTestHooks(value) {
  if (!WRITE_TEST_HOOKS.has(value)) throw new TypeError("branded fact collector write test hooks required");
  return value;
}

function resultError(error) {
  const code = typeof error?.code === "string" && error.code ? error.code : "WRITE_FAILED";
  return { code, message: safeError(code, "Fact index write failed").message };
}

function existingJsonl(task, ref, index) {
  try { return parseJsonl(task.readRecord(ref), { index, source_ref: ref }); }
  catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function finalJsonl(task, ref, index, fallback) {
  try { return existingJsonl(task, ref, index); }
  catch { return fallback; }
}

function persistJsonl(task, ref, index, merge, atomicWriteOptions, candidates, replacesExisting = () => false) {
  let existing = [];
  try {
    existing = existingJsonl(task, ref, index);
    const fresh = candidates();
    const merged = merge([...existing.filter((record) => !replacesExisting(record, fresh)), ...fresh]);
    if (!merged.ok) return { saved: false, error: merged.error ?? { code: merged.code }, records: existing };
    task.writeRecordAtomic(ref, toJsonl(merged.records), atomicWriteOptions);
    return { saved: true, records: merged.records };
  } catch (error) {
    return { saved: false, error, records: finalJsonl(task, ref, index, existing) };
  }
}

function existingSkills(task) {
  try {
    const parsed = JSON.parse(task.readRecord(INDEX_REFS[3]));
    if (parsed?.schema_version !== "v1") throw Object.assign(new Error("skills inventory schema is unsupported"), { code: "UNSUPPORTED_FORMAT" });
    if (!validateSkillsInventory(parsed).ok) throw Object.assign(new Error("skills inventory is invalid"), { code: "INVALID_RECORD" });
    return parsed.skills;
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function persistSkills(task, skills, atomicWriteOptions) {
  if (skills.error) return { saved: false, error: skills.error };
  try {
    const merged = mergeSkills([...existingSkills(task), ...skills.inventory.skills], {
      schema_version: skills.inventory.schema_version,
      generated_at: skills.inventory.generated_at,
    });
    if (!merged.ok) return { saved: false, error: merged.error ?? { code: merged.code } };
    task.writeRecordAtomic(INDEX_REFS[3], `${JSON.stringify(merged.inventory, null, 2)}\n`, atomicWriteOptions);
    return { saved: true };
  } catch (error) {
    return { saved: false, error };
  }
}
