import { closeSync, constants, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, isAbsolute, resolve } from "node:path";
import { isMonitoringFact, validateMonitoringFact } from "../evidence/monitoring-facts.mjs";

const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const DIRECTORY = constants.O_DIRECTORY ?? 0;
const HASH = /^[a-f0-9]{64}$/;
const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const FACT_KEYS = Object.freeze(["task_id", "stage", "material_digest", "source_digest", "invocation_id", "source", "status", "content_hash", "created_at", "output_ref"]);
const FORBIDDEN_INDEX_KEYS = new Set(["current", "parent", "previous", "generation", "selector", "successor"]);
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

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function initialIndex(taskId, verifyHash = null) {
  return {
    schema_version: "task-index.v1",
    task_id: taskId,
    facts: [],
    quality: {
      reviews: [],
      tests: [],
      verify: verifyHash === null ? null : indexRef({
        ref: "quality/verify.json", sha256: verifyHash, schema: "quality-verify.v1", task_id: taskId,
        logical_ref: "quality/verify.json", content_hash: verifyHash, version: "v1", related_task_id: taskId,
        external_raw_ref: "task.json", external_governance_archive_ref: null,
      }),
    },
    archives: [],
  };
}

function indexRef(value) {
  return {
    ref: value.ref,
    sha256: value.sha256,
    schema: value.schema,
    task_id: value.task_id,
    logical_ref: value.logical_ref ?? value.ref,
    content_hash: value.content_hash ?? value.sha256,
    version: value.version ?? "v1",
    related_task_id: value.related_task_id ?? value.task_id,
    external_raw_ref: value.external_raw_ref ?? null,
    external_governance_archive_ref: value.external_governance_archive_ref ?? null,
    ...(value.stage === undefined ? {} : { stage: value.stage }),
  };
}

function validateIndexRef(value, label) {
  if (!value || typeof value !== "object"
      || typeof value.ref !== "string" || !HASH.test(value.sha256 ?? "")
      || typeof value.schema !== "string" || typeof value.task_id !== "string"
      || typeof value.logical_ref !== "string" || !HASH.test(value.content_hash ?? "")
      || typeof value.version !== "string" || typeof value.related_task_id !== "string"
      || !["string", "object"].includes(typeof value.external_raw_ref)
      || !["string", "object"].includes(typeof value.external_governance_archive_ref)) {
    throw new Error(`${label} is not a complete task index reference`);
  }
  if (value.external_raw_ref !== null && typeof value.external_raw_ref !== "string") throw new Error(`${label}.external_raw_ref is invalid`);
  if (value.external_governance_archive_ref !== null && typeof value.external_governance_archive_ref !== "string") throw new Error(`${label}.external_governance_archive_ref is invalid`);
  return value;
}

function validateIndex(value, taskId) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.schema_version !== "task-index.v1" || value.task_id !== taskId) throw new Error("task index identity is invalid");
  for (const key of Object.keys(value)) if (FORBIDDEN_INDEX_KEYS.has(key)) throw new Error(`task index contains forbidden lineage field: ${key}`);
  if (!Array.isArray(value.facts) || !value.quality || !Array.isArray(value.quality.reviews) || !Array.isArray(value.quality.tests)) throw new Error("task index shape is invalid");
  value.facts.forEach((item, index) => validateIndexRef(item, `facts[${index}]`));
  value.quality.reviews.forEach((item, index) => validateIndexRef(item, `quality.reviews[${index}]`));
  value.quality.tests.forEach((item, index) => validateIndexRef(item, `quality.tests[${index}]`));
  if (value.quality.verify !== null) validateIndexRef(value.quality.verify, "quality.verify");
  value.archives.forEach((item, index) => validateIndexRef(item, `archives[${index}]`));
  return value;
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
    const indexPath = safeRecordPath(identity.root, "index.json");
    if (!existsSync(indexPath)) atomicWrite(identity.root, "index.json", `${JSON.stringify(initialIndex(identity.taskId, sha256(verifyRaw)), null, 2)}\n`, { createOnly: true });
    const index = validateIndex(JSON.parse(readFileSync(indexPath, "utf8")), identity.taskId);
    return Object.freeze({ task_id: identity.taskId, root: identity.root, index });
  });
}

export function readTaskFacts(taskRoot) {
  const identity = assertRoot(taskRoot);
  const raw = readFileSync(safeRecordPath(identity.root, "facts.jsonl"), "utf8");
  if (raw === "") return [];
  return raw.trimEnd().split("\n").map((line, index) => {
    let value;
    try { value = JSON.parse(line); } catch { throw new Error(`facts.jsonl line ${index + 1} is invalid JSON`); }
    if (!isMonitoringFact(value)) validateFact(value, identity.taskId);
    else if (value.task_id !== identity.taskId) throw new Error(`monitoring fact task identity mismatch on line ${index + 1}`);
    return value;
  });
}

export function readTaskIndex(taskRoot) {
  const identity = assertRoot(taskRoot);
  return validateIndex(JSON.parse(readFileSync(safeRecordPath(identity.root, "index.json"), "utf8")), identity.taskId);
}

export function replaceTaskIndex(taskRoot, value, options = {}) {
  const identity = assertRoot(taskRoot, value?.task_id);
  validateIndex(value, identity.taskId);
  return atomicWrite(identity.root, "index.json", `${JSON.stringify(value, null, 2)}\n`, options);
}

function validateFact(value, taskId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("task fact must be an object");
  const keys = Object.keys(value).sort();
  if (keys.join("\0") !== [...FACT_KEYS].sort().join("\0")) throw new Error("task fact contains unsupported fields");
  if (value.task_id !== taskId || !STAGES.has(value.stage) || !HASH.test(value.material_digest) || !HASH.test(value.source_digest) || !HASH.test(value.content_hash)) throw new Error("task fact identity or digest is invalid");
  if (typeof value.invocation_id !== "string" || value.invocation_id.trim() === "" || typeof value.source !== "string" || value.source.trim() === "" || typeof value.status !== "string" || typeof value.output_ref !== "string" || !Number.isFinite(Date.parse(value.created_at))) throw new Error("task fact fields are invalid");
  return value;
}

export function appendTaskFact(taskRoot, input, options = {}) {
  const identity = assertRoot(taskRoot, input?.task_id);
  return withStoreLock(identity.root, () => {
    const record = {
      task_id: identity.taskId,
      stage: input.stage,
      material_digest: input.material_digest,
      source_digest: input.source_digest,
      invocation_id: input.invocation_id,
      source: input.source,
      status: input.status,
      content_hash: input.content_hash,
      created_at: input.created_at ?? new Date().toISOString(),
      output_ref: input.output_ref,
    };
    validateFact(record, identity.taskId);
    const oldFactsRaw = readFileSync(safeRecordPath(identity.root, "facts.jsonl"), "utf8");
    const lineRaw = `${JSON.stringify(record)}\n`;
    const lineNumber = oldFactsRaw === "" ? 1 : oldFactsRaw.trimEnd().split("\n").length + 1;
    const ref = `facts.jsonl#${lineNumber}`;
    const oldIndex = readTaskIndex(identity.root);
    const nextIndex = structuredClone(oldIndex);
    nextIndex.facts.push(indexRef({
      ref, sha256: sha256(lineRaw), schema: "task-fact.v1", task_id: identity.taskId, stage: record.stage,
      logical_ref: ref, content_hash: record.content_hash, version: "v1", related_task_id: identity.taskId,
      external_raw_ref: record.output_ref, external_governance_archive_ref: null,
    }));
    try {
      atomicWrite(identity.root, "facts.jsonl", oldFactsRaw + lineRaw, { testHooks: options.testHooks, hookName: "beforeFactsRename" });
      atomicWrite(identity.root, "index.json", `${JSON.stringify(nextIndex, null, 2)}\n`, { testHooks: options.indexTestHooks, hookName: "beforeIndexRename" });
    } catch (error) {
      try { atomicWrite(identity.root, "facts.jsonl", oldFactsRaw); } catch {}
      throw error;
    }
    return Object.freeze({ ref, sha256: sha256(lineRaw), value: Object.freeze(record) });
  });
}

export function appendMonitoringFacts(taskRoot, { task_id: taskId, records } = {}, options = {}) {
  const identity = assertRoot(taskRoot, taskId);
  if (!Array.isArray(records) || records.length === 0) throw new TypeError("monitoring records must be a non-empty array");
  records.forEach((record) => {
    validateMonitoringFact(record);
    if (record.task_id !== identity.taskId) throw new Error("monitoring fact task identity mismatch");
  });
  return withStoreLock(identity.root, () => {
    const factsPath = safeRecordPath(identity.root, "facts.jsonl");
    const oldFactsRaw = readFileSync(factsPath, "utf8");
    const oldRecords = oldFactsRaw === "" ? [] : oldFactsRaw.trimEnd().split("\n").map((line) => JSON.parse(line));
    const existingIds = new Set(oldRecords.filter((item) => isMonitoringFact(item)).map((item) => item.fact_id));
    const incomingIds = new Set();
    for (const record of records) {
      if (existingIds.has(record.fact_id)) throw new Error(`monitoring fact id already exists: ${record.fact_id}`);
      if (incomingIds.has(record.fact_id)) throw new Error(`duplicate monitoring fact id in batch: ${record.fact_id}`);
      incomingIds.add(record.fact_id);
    }
    const lines = records.map((record) => `${JSON.stringify(record)}\n`);
    const separator = oldFactsRaw === "" || oldFactsRaw.endsWith("\n") ? "" : "\n";
    const nextFactsRaw = oldFactsRaw + separator + lines.join("");
    const oldIndex = readTaskIndex(identity.root);
    const nextIndex = structuredClone(oldIndex);
    const startingLine = oldFactsRaw === "" ? 1 : oldFactsRaw.trimEnd().split("\n").length + 1;
    records.forEach((record, offset) => {
      const lineRaw = lines[offset];
      const ref = `facts.jsonl#${startingLine + offset}`;
      nextIndex.facts.push(indexRef({
        ref, sha256: sha256(lineRaw), schema: "monitoring-fact.v1", task_id: identity.taskId, stage: record.stage ?? undefined,
        logical_ref: ref, content_hash: sha256(JSON.stringify(record)), version: "v1", related_task_id: identity.taskId,
        external_raw_ref: record.source.ref, external_governance_archive_ref: null,
      }));
    });
    try {
      atomicWrite(identity.root, "facts.jsonl", nextFactsRaw, { testHooks: options.testHooks, hookName: "beforeFactsRename" });
      atomicWrite(identity.root, "index.json", `${JSON.stringify(nextIndex, null, 2)}\n`, { testHooks: options.indexTestHooks, hookName: "beforeIndexRename" });
    } catch (error) {
      try { atomicWrite(identity.root, "facts.jsonl", oldFactsRaw); } catch {}
      throw error;
    }
    return Object.freeze({ refs: Object.freeze(records.map((_, offset) => `facts.jsonl#${startingLine + offset}`)), records: Object.freeze(records) });
  });
}

export { FACT_KEYS, withStoreLock };
