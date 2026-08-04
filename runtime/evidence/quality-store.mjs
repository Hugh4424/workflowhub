import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, existsSync, fsyncSync, linkSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { readTaskIndex, replaceTaskIndex, withStoreLock } from "../task/task-store.mjs";

const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const DIRECTORY = constants.O_DIRECTORY ?? 0;
const HASH = /^[a-f0-9]{64}$/;
const KINDS = new Set(["reviews", "tests"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fsyncDirectory(path) {
  const fd = openSync(path, constants.O_RDONLY | DIRECTORY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function atomicCreate(root, relativePath, raw, { testHooks } = {}) {
  const target = resolve(root, relativePath);
  if (!target.startsWith(`${resolve(root)}/`) || relativePath.split("/").includes("..")) throw new TypeError("unsafe quality path");
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  if (existsSync(target)) {
    const current = readFileSync(target, "utf8");
    if (current === raw) return { idempotent: true };
    throw new Error(`quality fact conflict: ${relativePath}`);
  }
  const temporary = resolve(parent, `.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
    writeSync(fd, raw, null, "utf8");
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    testHooks?.beforeRename?.({ target, raw });
    try {
      linkSync(temporary, target);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const current = readFileSync(target, "utf8");
      if (current === raw) return { idempotent: true };
      throw new Error(`quality fact conflict: ${relativePath}`);
    }
    rmSync(temporary, { force: true });
    fsyncDirectory(parent);
    return { idempotent: false };
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) rmSync(temporary, { force: true });
  }
}

function assertQualityValue(root, kind, value) {
  if (!KINDS.has(kind)) throw new TypeError("quality kind must be reviews or tests");
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.task_id !== "string" || typeof value.stage !== "string" || typeof value.status !== "string" || typeof value.source !== "string" || typeof value.schema_version !== "string" || !/^[a-f0-9]{64}$/.test(value.content_hash ?? "")) {
    throw new TypeError("quality fact fields are invalid");
  }
  const index = readTaskIndex(root);
  if (index.task_id !== value.task_id) throw new Error("quality fact task identity mismatch");
}

const VERIFY_LEAF_KEYS = new Set([
  "acceptance_criterion_id", "result", "status", "source_digest", "acceptance_leaf", "nested_evidence",
  "scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions",
]);

function verifyLeafStatus(criterion) {
  const values = [criterion.scenario, criterion.oracle, criterion.actual_outcome, criterion.evidence_type,
    ...(criterion.coverage_limits ?? []), ...(criterion.exceptions ?? [])];
  if (criterion.result === "fail") return "failed";
  return values.some((value) => value === "unknown") ? "incomplete" : "passed";
}

export function validateVerifyLeaves(criteria, { sourceDigest } = {}) {
  if (!Array.isArray(criteria) || criteria.length === 0) throw new TypeError("verify criteria must contain at least one leaf");
  if (!HASH.test(sourceDigest ?? "")) throw new TypeError("verify source digest is required");
  const seen = new Set();
  return criteria.map((criterion, index) => {
    if (!criterion || typeof criterion !== "object" || Array.isArray(criterion)
        || [...Object.keys(criterion)].some((key) => !VERIFY_LEAF_KEYS.has(key))
        || typeof criterion.acceptance_criterion_id !== "string" || criterion.acceptance_criterion_id.trim() === ""
        || seen.has(criterion.acceptance_criterion_id)
        || !new Set(["pass", "fail"]).has(criterion.result)
        || criterion.status !== undefined && !new Set(["passed", "failed", "unknown", "unavailable", "incomplete", "missing"]).has(criterion.status)
        || criterion.source_digest !== sourceDigest
        || typeof criterion.scenario !== "string" || criterion.scenario.trim() === ""
        || typeof criterion.oracle !== "string" || criterion.oracle.trim() === ""
        || typeof criterion.actual_outcome !== "string" || criterion.actual_outcome.trim() === ""
        || typeof criterion.evidence_type !== "string" || criterion.evidence_type.trim() === ""
        || !Array.isArray(criterion.coverage_limits) || criterion.coverage_limits.length === 0
        || criterion.coverage_limits.some((value) => typeof value !== "string" || value.trim() === "")
        || !Array.isArray(criterion.exceptions) || criterion.exceptions.length === 0
        || criterion.exceptions.some((value) => typeof value !== "string" || value.trim() === "")
        || !criterion.acceptance_leaf || typeof criterion.acceptance_leaf.ref !== "string" || !/^(?:evidence|quality\/evidence)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(criterion.acceptance_leaf.ref)
        || !HASH.test(criterion.acceptance_leaf.sha256 ?? "")
        || !Array.isArray(criterion.nested_evidence) || criterion.nested_evidence.length === 0
        || criterion.nested_evidence.some((entry) => !entry || typeof entry.ref !== "string" || !/^(?:evidence|quality\/evidence)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(entry.ref) || !HASH.test(entry.sha256 ?? ""))) {
      throw new TypeError(`verify criterion ${index} is incomplete or duplicated`);
    }
    seen.add(criterion.acceptance_criterion_id);
    const status = verifyLeafStatus(criterion);
    if (criterion.status !== undefined && criterion.status !== status) throw new TypeError(`verify criterion ${index} status does not match its evidence fields`);
    return Object.freeze({
      acceptance_criterion_id: criterion.acceptance_criterion_id,
      result: criterion.result,
      status,
      source_digest: criterion.source_digest,
      acceptance_leaf: { ref: criterion.acceptance_leaf.ref, sha256: criterion.acceptance_leaf.sha256 },
      nested_evidence: criterion.nested_evidence.map((entry) => ({ ref: entry.ref, sha256: entry.sha256 })),
      scenario: criterion.scenario, oracle: criterion.oracle, actual_outcome: criterion.actual_outcome,
      evidence_type: criterion.evidence_type,
      coverage_limits: [...criterion.coverage_limits], exceptions: [...criterion.exceptions],
    });
  });
}

export function publishQualityFact(taskRoot, kind, value, options = {}) {
  assertQualityValue(taskRoot, kind, value);
  return withStoreLock(resolve(taskRoot), () => {
    const logicalHash = sha256(canonical(value));
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    const ref = `quality/${kind}/${logicalHash}.json`;
    const created = atomicCreate(taskRoot, ref, raw, options);
    const index = structuredClone(readTaskIndex(taskRoot));
    const entry = {
      ref, sha256: sha256(raw), schema: value.schema_version, task_id: value.task_id, stage: value.stage,
      logical_ref: ref, content_hash: value.content_hash, version: "v1", related_task_id: value.task_id,
      external_raw_ref: value.evidence_ref ?? null, external_governance_archive_ref: value.external_governance_archive_ref ?? null,
    };
    const entries = index.quality[kind].filter((item) => item.ref !== ref);
    entries.push(entry);
    entries.sort((left, right) => left.ref.localeCompare(right.ref));
    index.quality[kind] = entries;
    replaceTaskIndex(taskRoot, index);
    return Object.freeze({ ref, sha256: entry.sha256, idempotent: created.idempotent, value });
  });
}

export function publishVerifySummary(taskRoot, summary, options = {}) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary) || typeof summary.status !== "string") throw new TypeError("verify summary is invalid");
  return withStoreLock(resolve(taskRoot), () => {
    const index = structuredClone(readTaskIndex(taskRoot));
    const taskRaw = readFileSync(resolve(taskRoot, "task.json"), "utf8");
    const sourceDigest = summary.source_digest ?? null;
    const criteria = summary.criteria === undefined ? undefined : validateVerifyLeaves(summary.criteria, { sourceDigest });
    const value = {
      schema_version: "quality-verify.v1",
      task_id: index.task_id,
      stage: "verify-code",
      ac_id: "verify-summary",
      method: "quality-summary",
      evidence_ref: "task.json",
      evidence_hash: sha256(taskRaw),
      material_digest: "0".repeat(64),
      created_at: new Date().toISOString(),
      ...summary,
      ...(sourceDigest === null ? {} : { source_digest: sourceDigest }),
      ...(criteria === undefined ? {} : { criteria }),
    };
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    const target = resolve(taskRoot, "quality/verify.json");
    const temporary = resolve(dirname(target), `.${randomUUID()}.tmp`);
    mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
    let fd;
    try {
      fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
      writeSync(fd, raw, null, "utf8");
      fsyncSync(fd);
      closeSync(fd);
      fd = undefined;
      options.testHooks?.beforeRename?.();
      renameSync(temporary, target);
      fsyncDirectory(dirname(target));
    } finally {
      if (fd !== undefined) closeSync(fd);
      if (existsSync(temporary)) rmSync(temporary, { force: true });
    }
    const verifyHash = sha256(raw);
    index.quality.verify = {
      ref: "quality/verify.json", sha256: verifyHash, schema: value.schema_version, task_id: index.task_id,
      logical_ref: "quality/verify.json", content_hash: verifyHash, version: "v1", related_task_id: index.task_id,
      external_raw_ref: value.evidence_ref ?? null, external_governance_archive_ref: value.external_governance_archive_ref ?? null,
    };
    replaceTaskIndex(taskRoot, index);
    return Object.freeze({ ref: "quality/verify.json", sha256: sha256(raw), value });
  });
}
