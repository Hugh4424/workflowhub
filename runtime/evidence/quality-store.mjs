import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, existsSync, fsyncSync, linkSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { readTaskIndex, replaceTaskIndex, withStoreLock } from "../task/task-store.mjs";

const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const DIRECTORY = constants.O_DIRECTORY ?? 0;
const HASH = /^[a-f0-9]{64}$/;
const ANCHOR_PATH = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*)(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const EVIDENCE_REF = /^(?:evidence|quality\/(?:evidence|tests))\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
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
  "scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions", "implementation_anchor", "verification_anchor",
]);

function validAnchor(value, expectedRole = null) {
  return value && typeof value === "object" && !Array.isArray(value)
    && typeof value.id === "string" && value.id.trim() !== ""
    && typeof value.path === "string" && ANCHOR_PATH.test(value.path) && !value.path.split("/").includes("..")
    && Number.isSafeInteger(value.start_line) && value.start_line >= 1
    && Number.isSafeInteger(value.end_line) && value.end_line >= value.start_line
    && typeof value.role === "string" && value.role.trim() !== ""
    && (expectedRole === null || value.role === expectedRole)
    && (value.reason === undefined || (typeof value.reason === "string" && value.reason.trim() !== ""));
}

function anchorsOverlap(left, right) {
  return validAnchor(left) && validAnchor(right)
    && left.path === right.path
    && left.start_line <= right.end_line
    && right.start_line <= left.end_line;
}

function copyAnchor(value) {
  return value === undefined ? undefined : {
    id: value.id, path: value.path, start_line: value.start_line, end_line: value.end_line, role: value.role,
    ...(value.reason === undefined ? {} : { reason: value.reason }),
  };
}

function verifyLeafStatus(criterion) {
  const values = [criterion.scenario, criterion.oracle, criterion.actual_outcome, criterion.evidence_type,
    ...(criterion.coverage_limits ?? []), ...(criterion.exceptions ?? [])];
  if (criterion.result === "fail") return "failed";
  if (["inconclusive", "deferred"].includes(criterion.result)) return "incomplete";
  return values.some((value) => value === "unknown")
    || !validAnchor(criterion.implementation_anchor, "implementation")
    || !validAnchor(criterion.verification_anchor, "verification")
    ? "incomplete" : "passed";
}

function normalizeCriterionText(value) {
  return String(value ?? "").replace(/\bAC-[A-Za-z0-9][A-Za-z0-9._-]*\b/g, "AC-*").trim();
}

function semanticProofWarnings(criterion, all) {
  if (all.length < 2) return [];
  const warnings = [];
  const signatures = all.map((item) => JSON.stringify([
    normalizeCriterionText(item.scenario),
    normalizeCriterionText(item.oracle),
    normalizeCriterionText(item.actual_outcome),
  ]));
  if (new Set(signatures).size === 1) warnings.push("criterion-specific scenario/oracle/outcome are generic or shared across acceptance criteria");

  const outcomes = all.map((item) => normalizeCriterionText(item.actual_outcome));
  if (outcomes.every((value) => /^(?:pass|passed|result|通过|测试通过|当前快照测试通过)$/i.test(value))) {
    warnings.push("actual outcome is generic across acceptance criteria");
  }

  const nested = all.map((item) => JSON.stringify(item.nested_evidence));
  if (new Set(nested).size === 1) warnings.push("nested evidence is shared across acceptance criteria");
  return warnings;
}

export function validateVerifyLeaves(criteria, { sourceDigest } = {}) {
  if (!Array.isArray(criteria) || criteria.length === 0) throw new TypeError("verify criteria must contain at least one leaf");
  if (!HASH.test(sourceDigest ?? "")) throw new TypeError("verify source digest is required");
  const seen = new Set();
  const suppliedStatuses = [];
  return criteria.map((criterion, index) => {
    if (!criterion || typeof criterion !== "object" || Array.isArray(criterion)
        || [...Object.keys(criterion)].some((key) => !VERIFY_LEAF_KEYS.has(key))
        || typeof criterion.acceptance_criterion_id !== "string" || criterion.acceptance_criterion_id.trim() === ""
        || seen.has(criterion.acceptance_criterion_id)
        || !new Set(["pass", "fail", "inconclusive", "deferred"]).has(criterion.result)
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
        || criterion.nested_evidence.some((entry) => !entry || typeof entry.ref !== "string" || !EVIDENCE_REF.test(entry.ref) || !HASH.test(entry.sha256 ?? ""))) {
      throw new TypeError(`verify criterion ${index} is incomplete or duplicated`);
    }
    seen.add(criterion.acceptance_criterion_id);
    suppliedStatuses[index] = criterion.status;
    const status = verifyLeafStatus(criterion);
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
      ...(validAnchor(criterion.implementation_anchor, "implementation") ? { implementation_anchor: copyAnchor(criterion.implementation_anchor) } : {}),
      ...(validAnchor(criterion.verification_anchor, "verification") ? { verification_anchor: copyAnchor(criterion.verification_anchor) } : {}),
    });
  }).map((criterion, _index, all) => {
    if (criterion.status !== "passed") return criterion;
    const shared = all.some((other) => other !== criterion
      && [criterion.implementation_anchor, criterion.verification_anchor].some((left) =>
        [other.implementation_anchor, other.verification_anchor].some((right) => anchorsOverlap(left, right))));
    const warnings = [
      ...(shared ? ["proof anchor is shared across acceptance criteria"] : []),
      ...semanticProofWarnings(criterion, all),
    ];
    const normalized = warnings.length
      ? Object.freeze({ ...criterion, status: "incomplete", exceptions: [...criterion.exceptions, ...warnings] })
      : criterion;
    if (suppliedStatuses[_index] !== undefined && suppliedStatuses[_index] !== normalized.status) throw new TypeError(`verify criterion ${_index} status does not match its evidence fields`);
    return normalized;
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
