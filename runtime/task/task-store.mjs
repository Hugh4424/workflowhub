import { closeSync, constants, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, writeSync } from "node:fs";
import { SHA256_HEX } from "../evidence/canonical-utils.mjs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, isAbsolute, resolve } from "node:path";

const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const DIRECTORY = constants.O_DIRECTORY ?? 0;
const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const FACT_KEYS = Object.freeze(["task_id", "stage", "material_digest", "source_digest", "invocation_id", "source", "status", "content_hash", "created_at", "output_ref"]);
const HISTORICAL_FACT_TYPES = new Set(["stage", "step", "skill", "session", "subagent", "token", "tool_use", "duration", "retry", "review", "test", "acceptance_criterion", "confirmation", "verify", "artifact", "health", "automation", "human_intervention", "source_status", "transcript_event"]);
const HISTORICAL_FACT_STATUSES = new Set(["present", "missing", "skipped", "not_applicable", "unknown", "unavailable", "unsupported", "conflict", "incomplete", "partial", "fatal"]);
const HISTORICAL_SOURCE_KINDS = new Set(["stage", "registered_codex", "task", "fact", "quality", "derived", "unknown"]);
const HISTORICAL_FACT_SCHEMA = ["monitoring", "fact.v1"].join("-");
const HISTORICAL_FACT_KEYS = Object.freeze(["schema_version", "fact_id", "task_id", "project_name", "fact_type", "stage", "step_id", "step_slug", "skill_id", "session_id", "subagent_id", "run_id", "attempt_id", "status", "value", "reason", "error", "observed_at", "source", "coverage", "contract_version", "collector_version", "adapter_version", "skill_version", "evidence_refs"]);
const HISTORICAL_FACT_KEY_SET = new Set(HISTORICAL_FACT_KEYS);
const HISTORICAL_LEGACY_FACT_KEY_SET = new Set(HISTORICAL_FACT_KEYS.filter((key) => key !== "step_slug"));
const HISTORICAL_SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fsyncDirectory(path) {
  const fd = openSync(path, constants.O_RDONLY | DIRECTORY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function assertRoot(taskRoot, taskId) {
  if (typeof taskRoot !== "string" || !isAbsolute(taskRoot)) throw new TypeError("task root must be absolute");
  const root = resolve(taskRoot);
  const manifestPath = resolve(root, "task.json");
  const stat = lstatSync(manifestPath);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("task.json must be a regular file");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (typeof taskId === "string" && manifest.task_id !== taskId) throw new Error("task identity mismatch");
  if (typeof manifest.task_id !== "string" || manifest.task_id.trim() === "") throw new Error("task manifest task_id is required");
  return Object.freeze({ root, taskId: manifest.task_id, projectName: manifest.project_name });
}

/** Sole consumer: confirmation publication recovers an immutable record whose
 * quality fact write was interrupted. Remove with that publication path. */
export function listCanonicalConfirmationRefs(taskRoot, taskId) {
  const { root } = assertRoot(taskRoot, taskId);
  for (const relative of ["quality", "quality/confirmations"]) {
    let stat;
    try { stat = lstatSync(resolve(root, relative)); }
    catch (error) { if (error?.code === "ENOENT") return []; throw error; }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${relative} must be a real directory`);
  }
  return readdirSync(resolve(root, "quality/confirmations")).filter((name) => /^[a-f0-9]{64}\.json$/.test(name)).sort().map((name) => {
    const relative = `quality/confirmations/${name}`;
    const stat = lstatSync(resolve(root, relative));
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${relative} must be a regular file`);
    return relative;
  });
}

function safeRecordPath(root, relativePath) {
  const target = resolve(root, relativePath);
  if (!relativePath || relativePath.startsWith("/") || relativePath.split(/[\\/]+/).includes("..") || !target.startsWith(`${root}/`)) {
    throw new TypeError(`unsafe task store path: ${relativePath}`);
  }
  return target;
}

function atomicWrite(root, relativePath, data, { testHooks, createOnly = false, hookName = "beforeRename" } = {}) {
  const target = safeRecordPath(root, relativePath);
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  if (createOnly && existsSync(target)) {
    const current = readFileSync(target, "utf8");
    if (current === data) return { idempotent: true };
    throw new Error(`immutable task store record conflict: ${relativePath}`);
  }
  const temporary = resolve(parent, `.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
    writeSync(fd, data, null, "utf8");
    testHooks?.afterTemporaryWrite?.();
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    testHooks?.[hookName]?.();
    if (createOnly) {
      try { linkSync(temporary, target); }
      catch (error) {
        if (error?.code !== "EEXIST") throw error;
        const current = readFileSync(target, "utf8");
        if (current !== data) throw new Error(`immutable task store record conflict: ${relativePath}`);
        return { idempotent: true };
      }
      rmSync(temporary, { force: true });
    } else {
      renameSync(temporary, target);
    }
    fsyncDirectory(parent);
    return { idempotent: false };
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) rmSync(temporary, { force: true });
  }
}

function withStoreLock(root, operation) {
  const lock = safeRecordPath(root, ".workflowhub-task-store.lock");
  let fd;
  try {
    fd = openSync(lock, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
  } catch (error) {
    throw new Error(`task store write conflict: ${error.message}`);
  }
  try { return operation(); } finally { closeSync(fd); rmSync(lock, { force: true }); }
}

function plainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyHistoricalText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function validHistoricalFactKeys(value) {
  const keys = Object.keys(value);
  return keys.every((key) => HISTORICAL_FACT_KEY_SET.has(key))
    && (keys.length === HISTORICAL_FACT_KEYS.length
      || (keys.length === HISTORICAL_LEGACY_FACT_KEY_SET.size && keys.every((key) => HISTORICAL_LEGACY_FACT_KEY_SET.has(key))));
}

function validateHistoricalMonitoringFact(value, taskId, projectName) {
  if (!plainRecord(value) || value.schema_version !== HISTORICAL_FACT_SCHEMA) throw new Error("schema_version is invalid");
  if (!validHistoricalFactKeys(value)) throw new Error("required fields are missing or unsupported fields are present");
  if (value.task_id !== taskId) throw new Error("task identity mismatch");
  if (value.project_name !== projectName) throw new Error("project identity mismatch");
  for (const key of ["fact_id", "task_id", "project_name"]) {
    if (!nonEmptyHistoricalText(value[key]) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(value[key])) throw new Error(`${key} is invalid`);
  }
  if (!HISTORICAL_FACT_TYPES.has(value.fact_type)) throw new Error("fact_type is invalid");
  if (value.stage !== null && !STAGES.has(value.stage)) throw new Error("stage is invalid");
  for (const key of ["step_id", "step_slug", "skill_id", "session_id", "subagent_id", "run_id", "attempt_id"]) {
    if (!(key in value)) continue;
    if (value[key] !== null && (!nonEmptyHistoricalText(value[key]) || !HISTORICAL_SAFE_REF.test(value[key]))) throw new Error(`${key} is invalid`);
  }
  if (!HISTORICAL_FACT_STATUSES.has(value.status)) throw new Error("status is invalid");
  if (value.status === "present" && !plainRecord(value.value)) throw new Error("present fact requires an object value");
  if (value.status !== "present" && value.value !== null) throw new Error("non-present fact value must be null");
  for (const key of ["reason", "error"]) {
    if (value[key] !== null && !nonEmptyHistoricalText(value[key])) throw new Error(`${key} is invalid`);
  }
  if (value.status !== "present" && !value.reason && !value.error) throw new Error("non-present fact requires reason or error");
  if (!nonEmptyHistoricalText(value.observed_at) || !Number.isFinite(Date.parse(value.observed_at))) throw new Error("observed_at is invalid");
  if (!plainRecord(value.source) || Object.keys(value.source).sort().join("\0") !== ["kind", "ref", "source_id", "source_version"].sort().join("\0")) throw new Error("source shape is invalid");
  if (!HISTORICAL_SOURCE_KINDS.has(value.source.kind) || !nonEmptyHistoricalText(value.source.ref) || !HISTORICAL_SAFE_REF.test(value.source.ref) || !nonEmptyHistoricalText(value.source.source_id) || !HISTORICAL_SAFE_REF.test(value.source.source_id) || !nonEmptyHistoricalText(value.source.source_version)) throw new Error("source is invalid");
  if (!plainRecord(value.coverage) || Object.keys(value.coverage).sort().join("\0") !== ["expected", "observed"].sort().join("\0") || !Number.isInteger(value.coverage.observed) || value.coverage.observed < 0 || (value.coverage.expected !== null && (!Number.isInteger(value.coverage.expected) || value.coverage.expected < 0 || value.coverage.observed > value.coverage.expected))) throw new Error("coverage is invalid");
  if (!nonEmptyHistoricalText(value.contract_version) || !nonEmptyHistoricalText(value.collector_version)) throw new Error("collector or contract version is invalid");
  for (const key of ["adapter_version", "skill_version"]) {
    if (value[key] !== null && !nonEmptyHistoricalText(value[key])) throw new Error(`${key} is invalid`);
  }
  // Historical evidence refs predate the safe-ref grammar and legitimately use
  // task-relative paths. Read them without rewriting anything; a traversal or
  // absolute path is still rejected.
  const historicalEvidenceRef = (ref) => nonEmptyHistoricalText(ref)
    && (HISTORICAL_SAFE_REF.test(ref)
      || (!ref.startsWith("/") && !ref.split(/[\\/]+/).includes("..") && /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(ref)));
  if (!Array.isArray(value.evidence_refs) || value.evidence_refs.some((ref) => !historicalEvidenceRef(ref))) throw new Error("evidence_refs is invalid");
  return value;
}

function parseFactRecords(raw, taskId, projectName) {
  if (raw === "") return [];
  return raw.trimEnd().split("\n").map((line, index) => {
    let value;
    try { value = JSON.parse(line); } catch { throw new Error(`facts.jsonl line ${index + 1} is invalid JSON`); }
    if (value?.schema_version === HISTORICAL_FACT_SCHEMA) {
      try { validateHistoricalMonitoringFact(value, taskId, projectName); }
      catch (error) { throw new Error(`historical monitoring fact is invalid on line ${index + 1}: ${error.message}`); }
      return Object.freeze({ kind: "monitoring", value });
    }
    if (["quality-fact.v1", "quality-verify.v1"].includes(value?.schema_version)) {
      throw new Error(`quality facts must be stored under quality/facts, not facts.jsonl line ${index + 1}`);
    }
    if (TASK_RECORD_KINDS.includes(value?.record_kind)) {
      try { validateStageRow(value, taskId); }
      catch (error) { throw new Error(`task record row is invalid on line ${index + 1}: ${error.message}`); }
      return Object.freeze({ kind: "task-record", value });
    }
    validateFact(value, taskId);
    return Object.freeze({ kind: "task", value });
  });
}

export function initializeTaskStore(taskRoot, { taskId } = {}) {
  const identity = assertRoot(taskRoot, taskId);
  return withStoreLock(identity.root, () => {
    mkdirSync(resolve(identity.root, "quality", "reviews"), { recursive: true, mode: 0o700 });
    mkdirSync(resolve(identity.root, "quality", "tests"), { recursive: true, mode: 0o700 });
    const factsPath = safeRecordPath(identity.root, "facts.jsonl");
    if (!existsSync(factsPath)) atomicWrite(identity.root, "facts.jsonl", "", { createOnly: true });
    const verifyRaw = `${JSON.stringify({
      schema_version: "quality-verify.v1",
      task_id: identity.taskId,
      stage: "verify-code",
      ac_id: "task-store-initialization",
      status: "unknown",
      method: "task-store-initialization",
      evidence_ref: "task.json",
      evidence_hash: sha256(readFileSync(safeRecordPath(identity.root, "task.json"))),
      material_digest: "0".repeat(64),
      created_at: new Date().toISOString(),
      missing: [],
    }, null, 2)}\n`;
    const verifyPath = safeRecordPath(identity.root, "quality/verify.json");
    if (!existsSync(verifyPath)) atomicWrite(identity.root, "quality/verify.json", verifyRaw, { createOnly: true });
    // A new task owns exactly one execution record file. The retired index
    // object is no longer created, read, or written for current tasks.
    return Object.freeze({ task_id: identity.taskId, root: identity.root, record_ref: "facts.jsonl" });
  });
}

export function readTaskFacts(taskRoot) {
  const identity = assertRoot(taskRoot);
  const raw = readFileSync(safeRecordPath(identity.root, "facts.jsonl"), "utf8");
  return parseFactRecords(raw, identity.taskId, identity.projectName).map(({ value }) => value);
}

function validateFact(value, taskId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("task fact must be an object");
  const keys = Object.keys(value).sort();
  if (keys.join("\0") !== [...FACT_KEYS].sort().join("\0")) throw new Error("task fact contains unsupported fields");
  if (value.task_id !== taskId || !STAGES.has(value.stage) || !SHA256_HEX.test(value.material_digest) || !SHA256_HEX.test(value.source_digest) || !SHA256_HEX.test(value.content_hash)) throw new Error("task fact identity or digest is invalid");
  if (typeof value.invocation_id !== "string" || value.invocation_id.trim() === "" || typeof value.source !== "string" || value.source.trim() === "" || typeof value.status !== "string" || typeof value.output_ref !== "string" || !Number.isFinite(Date.parse(value.created_at))) throw new Error("task fact fields are invalid");
  return value;
}

/** The frozen 16-key row contract shared by stage rows and close-action rows. */
export const TASK_RECORD_KINDS = Object.freeze(["stage", "close_action"]);
export const STAGE_ROW_KEYS = Object.freeze([
  "record_kind", "task_id", "stage", "source", "created_at",
  "material_digest", "snapshot_tree",
  "review_origin", "review_result_ref", "finding_dispositions", "spec_analyze",
  "evidence", "layer_states", "serious_issue_disposition",
  "close_action", "handoff",
]);
export const LAYER_STATE_VALUES = Object.freeze(["completed", "unavailable", "incomplete", "partial"]);
export const REVIEW_ORIGINS = Object.freeze(["conducted", "unavailable", "not_run", "same_source_degraded", "dispatched_uncollected"]);
export const FINDING_DISPOSITIONS = Object.freeze(["fixed", "rejected_invalid", "accepted_risk", "needs_human"]);
export const CLOSE_ACTIONS = Object.freeze(["delivery_committed", "archive", "merge", "push", "worktree_cleanup"]);

function recordError(message) { return new Error(`task record row is invalid: ${message}`); }

function exactKeys(value, expected, label) {
  const keys = Object.keys(value).sort();
  if (keys.join("\0") !== [...expected].sort().join("\0")) throw recordError(`${label} key set must equal the frozen field table`);
}

/**
 * A conditional field carries its value when it has one, and otherwise carries
 * the fixed empty-with-reason encoding: value stays empty and the reason says
 * why. A reason without an empty value position is not accepted either.
 */
function conditionValue(value, label, { allowNull = false } = {}) {
  if (value === null && allowNull) return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw recordError(`${label} must be a value-or-reason object`);
  const keys = Object.keys(value).sort();
  // Exactly the two frozen field names, and `value` must be present.
  if (!keys.includes("value") || keys.some((key) => !["reason", "value"].includes(key))) {
    throw recordError(`${label} must carry only value and reason`);
  }
  if (value.value === null) {
    if (typeof value.reason !== "string" || value.reason.trim() === "") throw recordError(`${label} requires a reason when its value is empty`);
    return value;
  }
  if (typeof value.value === "string" && value.value.trim() === "") throw recordError(`${label} value must be null or a real value`);
  if (value.reason !== undefined && value.reason !== null && (typeof value.reason !== "string" || value.reason.trim() === "")) {
    throw recordError(`${label} reason must be non-empty when present`);
  }
  return value;
}

/**
 * Evidence carries the commands that really ran: command, integer exit code,
 * and a one-line reproducible failure signature. It is still a conditional
 * field, so a row with no command keeps the empty-with-reason encoding.
 */
function evidenceValue(value, label) {
  const condition = conditionValue(value, label);
  if (condition.value === null) return condition;
  if (!Array.isArray(condition.value) || condition.value.length === 0) throw recordError(`${label} value must be a non-empty list of executed commands`);
  for (const entry of condition.value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw recordError(`${label} entries must be objects`);
    const keys = Object.keys(entry).sort().join("\0");
    if (keys !== ["command", "exit_code", "failure_signature"].sort().join("\0")) throw recordError(`${label} entries must carry command, exit_code, and failure_signature`);
    if (typeof entry.command !== "string" || entry.command.trim() === "") throw recordError(`${label} entries require a command`);
    if (!Number.isInteger(entry.exit_code)) throw recordError(`${label} entries require an integer exit code`);
    if (typeof entry.failure_signature !== "string" || entry.failure_signature.trim() === "") throw recordError(`${label} entries require a one-line failure signature`);
  }
  return condition;
}

function validateLayerStates(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw recordError(`${label} must be an object`);
  if (Object.keys(value).sort().join("\0") !== ["delivery", "implementation_completion", "stage_quality", "task_closure"].sort().join("\0")) {
    throw recordError(`${label} must carry exactly the four independent layers`);
  }
  for (const [layer, state] of Object.entries(value)) {
    if (!LAYER_STATE_VALUES.includes(state)) throw recordError(`${label}.${layer} must be one of the four machine values`);
  }
  return value;
}

function validateFindingDispositions(value, label) {
  if (!Array.isArray(value)) throw recordError(`${label} must be an array`);
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw recordError(`${label} entries must be objects`);
    if (Object.keys(entry).sort().join("\0") !== "disposition\0finding") throw recordError(`${label} entries must carry exactly finding and disposition`);
    if (typeof entry.finding !== "string" || entry.finding.trim() === "") throw recordError(`${label} entries require a finding id`);
    if (!FINDING_DISPOSITIONS.includes(entry.disposition)) throw recordError(`${label} disposition must be one of the four frozen values`);
  }
  return value;
}

function validateStageRow(value, taskId) {
  exactKeys(value, STAGE_ROW_KEYS, "stage row");
  if (!TASK_RECORD_KINDS.includes(value.record_kind)) throw recordError("record_kind must be stage or close_action");
  if (value.task_id !== taskId) throw recordError("task identity mismatch");
  if (value.record_kind === "stage") {
    if (!STAGES.has(value.stage)) throw recordError("stage must be one of the five formal stages");
    // A stage row never carries a close action, and like every other
    // conditional field it must still use the frozen empty-with-reason
    // encoding: an empty value needs a non-empty reason.
    conditionValue(value.close_action, "close_action");
    if (value.close_action.value !== null) throw recordError("stage rows must leave close_action empty with a reason");
  } else {
    if (value.stage !== "close") throw recordError("close-action rows must use stage close");
    if (value.close_action === null || !CLOSE_ACTIONS.includes(value.close_action.action)) throw recordError("close-action rows require one of the five physical actions");
    if (typeof value.close_action.result !== "string" || value.close_action.result.trim() === "") throw recordError("close-action rows require a result");
    if (value.close_action.ref !== undefined && value.close_action.ref !== null
        && (typeof value.close_action.ref !== "string" || value.close_action.ref.trim() === "")) {
      throw recordError("close-action ref must be null or a non-empty named reference");
    }
  }
  if (typeof value.source !== "string" || value.source.trim() === "") throw recordError("source must be a non-empty writer identity");
  if (!Number.isFinite(Date.parse(value.created_at))) throw recordError("created_at must be an ISO-compatible timestamp");
  // The spec's fixed empty-with-reason encoding applies to every conditional
  // field, including the two material fields.
  conditionValue(value.material_digest, "material_digest");
  conditionValue(value.snapshot_tree, "snapshot_tree");
  if (value.material_digest.value !== null && !SHA256_HEX.test(value.material_digest.value)) throw recordError("material_digest value must be a sha256");
  if (value.snapshot_tree.value !== null && !/^[a-f0-9]{40,64}$/.test(value.snapshot_tree.value)) throw recordError("snapshot_tree value must be a Git tree id");
  if (!REVIEW_ORIGINS.includes(value.review_origin)) throw recordError("review_origin must be one of the five frozen values");
  const reviewRef = value.review_result_ref && typeof value.review_result_ref === "object" && !Array.isArray(value.review_result_ref)
    ? value.review_result_ref.value
    : value.review_result_ref;
  if (value.review_origin === "conducted" && !(typeof reviewRef === "string" && reviewRef.trim() !== "")) {
    throw recordError("conducted reviews require a named review_result_ref");
  }
  if (value.review_origin !== "conducted") {
    if (value.review_result_ref === null) throw recordError("review_result_ref must stay empty-with-reason unless the review was conducted");
    conditionValue(value.review_result_ref, "review_result_ref");
    if (value.review_result_ref.value !== null) throw recordError("review_result_ref must stay empty unless the review was conducted");
  }
  validateFindingDispositions(value.finding_dispositions, "finding_dispositions");
  conditionValue(value.spec_analyze, "spec_analyze");
  evidenceValue(value.evidence, "evidence");
  validateLayerStates(value.layer_states, "layer_states");
  conditionValue(value.serious_issue_disposition, "serious_issue_disposition");
  conditionValue(value.handoff, "handoff");
  return value;
}

function materialiseStageRow(input, taskId, createdAt) {
  const row = {
    record_kind: input?.record_kind === "close_action" ? "close_action" : "stage",
    task_id: taskId,
    stage: input?.stage,
    source: input?.source,
    created_at: input?.created_at ?? createdAt,
    material_digest: input?.material_digest ?? { value: null, reason: "no material digest recorded for this row" },
    snapshot_tree: input?.snapshot_tree ?? { value: null, reason: "no snapshot tree recorded for this row" },
    review_origin: input?.review_origin ?? "not_run",
    review_result_ref: input?.review_result_ref ?? { value: null, reason: "no review result reference for this row" },
    finding_dispositions: input?.finding_dispositions ?? [],
    spec_analyze: input?.spec_analyze ?? { value: null, reason: "spec analysis not run for this row" },
    evidence: input?.evidence ?? { value: null, reason: "no command evidence recorded for this row" },
    layer_states: input?.layer_states ?? {
      implementation_completion: "incomplete", stage_quality: "incomplete", delivery: "unavailable", task_closure: "unavailable",
    },
    serious_issue_disposition: input?.serious_issue_disposition ?? { value: null, reason: "no serious issue recorded for this row" },
    close_action: input?.close_action ?? { value: null, reason: "this row carries no close action" },
    handoff: input?.handoff ?? { value: null, reason: "no handoff item recorded for this row" },
  };
  return row;
}

/**
 * Write the current row for one stage, or one close action, into the single
 * execution record file. A same-stage (or same-action) write replaces that row
 * in place; a different stage appends. Failure keeps the previous bytes.
 */
export function writeStageRow(taskRoot, input, options = {}) {
  const identity = assertRoot(taskRoot, input?.task_id);
  return withStoreLock(identity.root, () => {
    const row = materialiseStageRow(input, identity.taskId, options.now ?? new Date().toISOString());
    validateStageRow(row, identity.taskId);
    const factsPath = safeRecordPath(identity.root, "facts.jsonl");
    const oldRaw = readFileSync(factsPath, "utf8");
    const lines = oldRaw === "" ? [] : oldRaw.trimEnd().split("\n");
    const rows = lines.map((line, index) => {
      try { return JSON.parse(line); } catch { throw new Error(`facts.jsonl line ${index + 1} is invalid JSON`); }
    });
    const sameRow = (value) => value?.record_kind === row.record_kind
      && (row.record_kind === "stage" ? value.stage === row.stage : value.close_action?.action === row.close_action?.action);
    const index = rows.findIndex(sameRow);
    const action = index >= 0 ? "replaced" : "inserted";
    if (action === "inserted") rows.push(row); else rows[index] = row;
    const lineRaw = `${JSON.stringify(row)}\n`;
    const nextRaw = rows.map((value) => `${JSON.stringify(value)}\n`).join("");
    const ref = `facts.jsonl#${(action === "inserted" ? rows.length : index + 1)}`;
    atomicWrite(identity.root, "facts.jsonl", nextRaw, { testHooks: options.testHooks, hookName: "beforeFactsRename" });
    return Object.freeze({ action, ref, sha256: sha256(lineRaw), value: Object.freeze(row) });
  });
}

export { FACT_KEYS, withStoreLock };
