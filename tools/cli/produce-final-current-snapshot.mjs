#!/usr/bin/env node

import { SHA256_HEX_CASE_INSENSITIVE } from "../../runtime/evidence/canonical-utils.mjs";
/**
 * Produce the one final, current acceptance snapshot for T013.
 *
 * This is an evidence producer, not a new current store.  It reads the four
 * controlled materials and task-local immutable evidence, derives one entry
 * for every active AC, and writes the result create-only under quality/tests.
 * A non-passing source fact remains non-passing in the entry; it is never
 * converted into a green aggregate merely because the file was readable.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  linkSync,
  writeSync,
} from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";

const OID = /^[a-f0-9]{40,64}$/i;
const AC = /^AC-[A-Za-z0-9_-]+$/;
const TOP_LEVEL_AC = "AC-GOV-001";
const FINAL_SCHEMA = "workflowhub-final-current-snapshot.v1";
const CURRENT_SURFACES = Object.freeze([
  "runtime", "core", "tools", "skills", "scripts", "config", "workflows",
]);
const SCAN_TOKENS = Object.freeze([
  "publishVerifySummary", "deriveCurrentProductRelease", "verifySummary",
  "verify_summary", "quality/verify.json", "verify.json",
]);
const REQUIRED_RECEIPTS = Object.freeze({
  S3: ["quality/tests/S3/green/result.json", "quality/evidence/performance-profile/S3.json"],
  S4S: ["quality/tests/S4-slicing/green/result.json", "quality/evidence/S4-slicing/current-tasks-self-check.json"],
  S4R: ["quality/tests/S4-review-budget/green/result.json"],
  S7: ["quality/tests/S7/green/result.json"],
  FINAL_PLAN: ["quality/tests/final/plan-acceptance-task-gate.json"],
});

function object(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function readText(path, label) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`${label} cannot be read: ${error.message}`);
  }
}

function readJson(path, label) {
  const raw = readText(path, label);
  try {
    return { raw, value: JSON.parse(raw), sha256: sha256(raw) };
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function pathFromArg(value, label, cwd = process.cwd()) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required`);
  return isAbsolute(value) ? resolve(value) : resolve(cwd, value);
}

function immutableWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  let fd;
  try {
    fd = openSync(temporary, "wx");
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    // Link creation refuses to replace a previous final receipt.
    linkSync(temporary, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

export function writeFinalSnapshot(path, value) {
  if (!isAbsolute(path)) throw new TypeError("final snapshot output must be absolute");
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  immutableWrite(path, bytes);
  return { ref: path, sha256: sha256(bytes) };
}

// `--acceptance-output` selects the canonical acceptance document on stdout.
// It is a bare flag, so it is matched before the `--key=value` loop.  Holding
// the declaration's acceptance args in the producer's own option namespace
// keeps the executable scenario bound to the producer (T013 acceptance_data)
// without introducing a second command or an unexpanded shell placeholder.
const ACCEPTANCE_OUTPUT_FLAG = "--acceptance-output";

function parseArgs(args, cwd = process.cwd()) {
  const allowed = new Set(["--task-id", "--spec", "--plan", "--tasks", "--task-dir", "--output", "--source-root"]);
  const values = {};
  const acceptanceOutput = args.filter((arg) => arg === ACCEPTANCE_OUTPUT_FLAG).length;
  if (acceptanceOutput > 1) throw new Error(`duplicate final snapshot option: ${ACCEPTANCE_OUTPUT_FLAG}`);
  for (const arg of args) {
    if (arg === ACCEPTANCE_OUTPUT_FLAG) continue;
    const match = /^(--[^=]+)=(.*)$/.exec(arg);
    if (!match || !allowed.has(match[1]) || values[match[1]] !== undefined) {
      throw new Error(`unknown or duplicate final snapshot option: ${arg}`);
    }
    values[match[1]] = match[2];
  }
  for (const name of ["--task-id", "--spec", "--plan", "--tasks", "--task-dir", "--output"])
    if (values[name] === undefined || values[name] === "") throw new Error(`${name} is required`);
  return Object.freeze({
    taskId: values["--task-id"],
    specPath: pathFromArg(values["--spec"], "--spec", cwd),
    planPath: pathFromArg(values["--plan"], "--plan", cwd),
    tasksPath: pathFromArg(values["--tasks"], "--tasks", cwd),
    taskDir: pathFromArg(values["--task-dir"], "--task-dir", cwd),
    outputPath: pathFromArg(values["--output"], "--output", cwd),
    sourceRoot: values["--source-root"] === undefined ? cwd : pathFromArg(values["--source-root"], "--source-root", cwd),
    acceptanceOutput: acceptanceOutput === 1,
  });
}

export const parseProducerArgs = parseArgs;

function normaliseAc(id) {
  const value = String(id ?? "").trim();
  return value.toUpperCase();
}

/** Derive normative AC headings plus the explicitly declared top-level AC. */
export function deriveActiveAcIds(specText) {
  if (typeof specText !== "string" || specText.trim() === "") throw new TypeError("spec content is required");
  const ids = [];
  const seen = new Set();
  for (const match of specText.matchAll(/^####\s+(AC-[A-Za-z0-9_-]+)\b/gm)) {
    const id = normaliseAc(match[1]);
    if (!AC.test(id)) throw new Error(`invalid normative AC heading: ${id}`);
    if (seen.has(id)) throw new Error(`duplicate normative AC heading: ${id}`);
    seen.add(id);
    ids.push(id);
  }
  const topLevel = [...specText.matchAll(/^\s*[-*]\s*(?:\[[ xX]\]\s*)?\*\*(AC-[A-Za-z0-9_-]+)\*\*/gm)]
    .map((match) => normaliseAc(match[1]))
    .filter((id) => id === TOP_LEVEL_AC);
  if (topLevel.length !== 1) throw new Error(`${TOP_LEVEL_AC} must be declared exactly once in the top-level acceptance list`);
  if (!seen.has(TOP_LEVEL_AC)) {
    seen.add(TOP_LEVEL_AC);
    ids.unshift(TOP_LEVEL_AC);
  }
  if (ids.length === 0) throw new Error("canonical spec has no active AC");
  return Object.freeze(ids);
}

function t013Block(tasksText) {
  const start = tasksText.search(/^####\s+T013\b[^\n]*$/m);
  if (start < 0) throw new Error("tasks.md is missing T013");
  const rest = tasksText.slice(start);
  // Skip the T013 heading itself before looking for a later task. Searching
  // the unsliced remainder always finds the current heading at offset 0 and
  // accidentally lets later task fields bleed into the FINAL declaration.
  const next = rest.slice(1).search(/^####\s+T[A-Za-z0-9_-]+\b/m);
  return next >= 0 ? rest.slice(0, next + 1) : rest;
}

function parseJsonField(block, field) {
  const pattern = new RegExp(`^-\\s+\\*\\*${field}\\*\\*\\s*[:：]\\s*(.+?)\\s*$`, "mi");
  const raw = block.match(pattern)?.[1]?.trim();
  if (!raw) return null;
  const unwrapped = raw.replace(/^`([\s\S]*)`$/, "$1");
  try { return JSON.parse(unwrapped); } catch { return null; }
}

/**
 * Read the T013 declaration without treating every phase's small AC link as
 * the final set.  Current cards use the explicit “all active ...” declaration;
 * future cards may provide active_ac_ids or covered_ac directly.
 */
export function deriveTaskDeclaredAcIds(tasksText, activeIds = []) {
  const block = t013Block(tasksText);
  const explicit = parseJsonField(block, "active_ac_ids") ?? parseJsonField(block, "covered_ac");
  if (Array.isArray(explicit) && explicit.length > 0) {
    const ids = explicit.map(normaliseAc);
    if (ids.some((id) => !AC.test(id))) throw new Error("T013 active AC declaration contains an invalid AC id");
    if (new Set(ids).size !== ids.length) throw new Error("T013 active AC declaration contains duplicate AC ids");
    return Object.freeze(ids);
  }
  const covered = block.match(/^-\s+\*\*covered_ac\*\*：([^\n]+)$/mi)?.[1]?.trim() ?? "";
  if (covered && !/^N\/A\b|^not started$/i.test(covered)) {
    const ids = [...covered.matchAll(/\b(AC-[A-Za-z0-9_-]+)\b/g)].map((match) => normaliseAc(match[1]));
    if (ids.some((id) => !AC.test(id))) throw new Error("T013 covered_ac declaration contains an invalid AC id");
    if (new Set(ids).size !== ids.length) throw new Error("T013 covered_ac declaration contains duplicate AC ids");
    return Object.freeze(ids);
  }
  const acceptanceData = parseJsonField(block, "acceptance_data");
  const declarationText = JSON.stringify(acceptanceData ?? "") + "\n" + block;
  if (/all active(?: non-ui)? AC derived from canonical spec/i.test(declarationText)
      && declarationText.includes(TOP_LEVEL_AC)) return Object.freeze([...activeIds]);
  throw new Error("T013 has no exact active AC declaration");
}

function sameSet(left, right) {
  const a = left.map(normaliseAc).sort();
  const b = right.map(normaliseAc).sort();
  if (new Set(a).size !== a.length || new Set(b).size !== b.length) return false;
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function materialIdentity(materials) {
  const joined = materials.map(({ name, raw }) => `${name}\0${raw}`).join("\0");
  return `revision-${sha256(joined)}`;
}

function currentSnapshotTree(cwd) {
  try {
    const value = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return OID.test(value) ? value : null;
  } catch {
    return null;
  }
}

function relativeTaskRef(taskDir, path) {
  const rel = relative(taskDir, path).split(sep).join("/");
  if (!rel || rel.startsWith("../") || rel === ".." || isAbsolute(rel)) throw new Error(`evidence path escapes task directory: ${path}`);
  return rel;
}

function evidencePath(taskDir, ref) {
  const target = resolve(taskDir, ref);
  const relativeRef = relativeTaskRef(taskDir, target);
  try {
    const realTaskDir = realpathSync(taskDir);
    const realTarget = realpathSync(target);
    const realRelative = relative(realTaskDir, realTarget).split(sep).join("/");
    if (!realRelative || realRelative.startsWith("../") || realRelative === ".." || isAbsolute(realRelative)) {
      throw new Error("evidence path resolves outside task directory");
    }
  } catch (error) {
    // A missing target is authenticated as unavailable by the read below. A
    // present symlink or path component resolving outside the task namespace
    // is rejected before any host file is read.
    if (error?.code !== "ENOENT") throw error;
  }
  return { target, relativeRef };
}

function evidenceStatus(value) {
  if (!object(value)) return "unknown";
  const positive = new Set(["passed", "pass", "success", "green"]);
  const negative = new Set(["failed", "fail", "partial", "incomplete", "unavailable", "unknown", "conflict"]);
  const declared = ["status", "result"]
    .map((key) => String(value[key] ?? "").toLowerCase())
    .filter((status) => status !== "");
  const negativeStatus = declared.find((status) => negative.has(status));
  if (negativeStatus) return negativeStatus === "fail" ? "failed" : negativeStatus;
  const explicitPositive = declared.some((status) => positive.has(status));
  const exits = [value.observed_exit, value.exit_code].filter((exit) => exit !== undefined && exit !== null);
  const invalidExit = exits.some((exit) => !Number.isInteger(exit));
  const nonZeroExit = exits.some((exit) => exit !== 0);
  if (invalidExit || nonZeroExit) return explicitPositive ? "conflict" : "failed";
  if (value.expected_exit !== undefined && !Number.isInteger(value.expected_exit)) return "conflict";
  if (value.expected_exit !== undefined && exits.length > 0 && exits.some((exit) => exit !== value.expected_exit)) return "conflict";
  if (explicitPositive) return "passed";
  if (exits.length > 0) return exits.every((exit) => exit === 0) ? "passed" : "failed";
  return "unknown";
}

function evidenceCandidates(value) {
  const candidates = [];
  for (const field of ["evidence", "evidence_refs", "raw_refs"]) {
    const entries = value?.[field];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry === "string") candidates.push({ ref: entry, sha256: null, field });
      else if (object(entry)) candidates.push({
        ref: entry.ref ?? entry.raw_ref ?? entry.path ?? null,
        sha256: entry.sha256 ?? entry.raw_sha256 ?? entry.hash ?? null,
        field,
      });
    }
  }
  return candidates.filter(({ ref }) => typeof ref === "string" && ref.trim() !== "");
}

function authenticateEvidence(value, taskDir, receiptPath) {
  const candidates = evidenceCandidates(value);
  if (candidates.length === 0) return Object.freeze({ status: "not_provided", refs: [], errors: [] });
  const refs = [];
  const errors = [];
  let status = "passed";
  for (const candidate of candidates) {
    const declared = candidate.sha256;
    const ref = candidate.ref;
    let target;
    let relativeRef;
    try {
      ({ target, relativeRef } = evidencePath(taskDir, ref));
    } catch {
      status = "conflict";
      errors.push("evidence path is outside task directory");
      refs.push({ ref: "outside-task-directory", sha256: declared, field: candidate.field });
      continue;
    }
    const record = { ref: relativeRef, sha256: declared, field: candidate.field };
    if (!SHA256_HEX_CASE_INSENSITIVE.test(String(declared ?? ""))) {
      status = "conflict";
      errors.push(`${ref} has no valid sha256`);
      refs.push(record);
      continue;
    }
    try {
      const raw = readFileSync(target);
      const actual = sha256(raw);
      record.actual_sha256 = actual;
      if (actual !== declared.toLowerCase()) {
        status = "conflict";
        errors.push(`${ref} sha256 mismatch`);
      }
    } catch (error) {
      if (status === "passed") status = "unavailable";
      errors.push(`${ref} cannot be authenticated: ${error.message}`);
    }
    refs.push(record);
  }
  return Object.freeze({ status, refs: Object.freeze(refs), errors: Object.freeze(errors), source: receiptPath });
}

function receiptIdentity(value, { taskId, materialRevision, snapshotTree }) {
  const missing = [];
  const conflicts = [];
  if (value.task_id === undefined) missing.push("task_id");
  else if (value.task_id !== taskId) conflicts.push("task_id");
  for (const [field, expected] of [["material_revision", materialRevision], ["snapshot_tree", snapshotTree]]) {
    if (value[field] === undefined) missing.push(field);
    else if (value[field] !== expected) conflicts.push(field);
  }
  return Object.freeze({
    status: conflicts.length > 0 ? "conflict" : missing.length > 0 ? "incomplete" : "passed",
    missing: Object.freeze(missing),
    conflicts: Object.freeze(conflicts),
  });
}

function receiptFor(taskDir, ref, label, taskId, identity = {}) {
  const path = resolve(taskDir, ref);
  const { raw, value, sha256: hash } = readJson(path, `${label} receipt ${ref}`);
  if (!SHA256_HEX_CASE_INSENSITIVE.test(hash)) throw new Error(`${label} receipt hash could not be computed`);
  if (value.task_id !== undefined && typeof value.task_id === "string" && value.task_id.trim() === "") throw new Error(`${label} receipt task_id is empty`);
  const identityStatus = value.task_id !== undefined && value.task_id !== taskId ? "conflict" : null;
  const authentication = authenticateEvidence(value, taskDir, ref);
  const binding = receiptIdentity(value, {
    taskId,
    materialRevision: identity.material_revision,
    snapshotTree: identity.snapshot_tree,
  });
  let status = evidenceStatus(value);
  if (identityStatus) status = identityStatus;
  else if (status === "passed" && ["unavailable", "conflict"].includes(authentication.status)) status = authentication.status;
  else if (status === "passed" && binding.status !== "passed") status = binding.status;
  const covered = coveredAcIds(value);
  return Object.freeze({
    ref,
    sha256: hash,
    status,
    value,
    raw,
    task_id: value.task_id ?? null,
    covered_ac_ids: covered,
    authentication,
    identity: binding,
  });
}

function coveredAcIds(value) {
  const fields = ["covered_ac", "active_ac_ids", "acceptance_criterion_ids"];
  const values = [];
  for (const field of fields) {
    if (Array.isArray(value?.[field])) values.push(...value[field]);
  }
  if (Array.isArray(value?.assertions)) {
    values.push(...value.assertions.map((entry) => entry?.ac_id ?? entry?.acceptance_criterion_id));
  }
  const ids = values.filter((id) => typeof id === "string" && AC.test(normaliseAc(id))).map(normaliseAc);
  return ids.length === 0 ? null : Object.freeze([...new Set(ids)]);
}

function routeNameForAc(id) {
  if (id.startsWith("AC-S3-")) return "S3";
  if (id.startsWith("AC-S4S-")) return "S4S";
  if (id.startsWith("AC-S4R-")) return "S4R";
  if (id.startsWith("AC-S7-")) return "S7";
  if (id.startsWith("AC-GOV-")) return "GOV";
  throw new Error(`active AC has no targeted route: ${id}`);
}

function loadReceipts(taskDir, taskId, identity = {}) {
  const byRoute = {};
  for (const [route, refs] of Object.entries(REQUIRED_RECEIPTS)) {
    byRoute[route] = refs.map((ref) => receiptFor(taskDir, ref, route, taskId, identity));
  }
  return byRoute;
}

function routeReceipts(receipts, route) {
  if (route === "GOV") return [...receipts.S3, ...receipts.S4S, ...receipts.S4R, ...receipts.S7, ...receipts.FINAL_PLAN];
  if (route === "S3") return receipts.S3;
  if (route === "S4S") return receipts.S4S;
  if (route === "S4R") return receipts.S4R;
  if (route === "S7") return receipts.S7;
  throw new Error(`unknown route ${route}`);
}

function routeStatus(receipts) {
  if (receipts.length === 0) return "incomplete";
  const statuses = receipts.map((receipt) => receipt.status);
  if (statuses.some((status) => ["failed", "conflict", "unknown"].includes(status))) return "incomplete";
  if (statuses.some((status) => ["partial", "incomplete", "unavailable"].includes(status))) return "incomplete";
  return "passed";
}

function evidenceRefFor(receipt) {
  return { ref: receipt.ref, sha256: receipt.sha256 };
}

function evidenceRefsFor(receipt) {
  const refs = [evidenceRefFor(receipt)];
  for (const candidate of receipt.authentication?.refs ?? []) {
    if (candidate.actual_sha256 === undefined || candidate.actual_sha256 !== String(candidate.sha256 ?? "").toLowerCase()) continue;
    const ref = { ref: candidate.ref, sha256: candidate.actual_sha256 };
    if (SHA256_HEX_CASE_INSENSITIVE.test(String(ref.sha256 ?? ""))) refs.push(ref);
  }
  const seen = new Set();
  return refs.filter((ref) => {
    const key = `${ref.ref}\0${ref.sha256}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function receiptsForAc(receipts, acId) {
  const scoped = receipts.filter((receipt) => Array.isArray(receipt.covered_ac_ids));
  if (scoped.length === 0) return receipts;
  return scoped.filter((receipt) => receipt.covered_ac_ids.includes(acId));
}

function findProductionFiles(root, readErrors = []) {
  const output = [];
  const visit = (directory) => {
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); }
    catch (error) { readErrors.push({ path: directory, error: error.message }); return; }
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "archive" || entry.name === "__snapshots__") continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { visit(path); continue; }
      const rel = relative(root, path).split(sep).join("/");
      const top = rel.split("/")[0];
      if (!CURRENT_SURFACES.includes(top) && !["package.json", "vitest.config.mjs"].includes(rel)) continue;
      if (!/[.](?:mjs|js|cjs|json|yaml|yml|md|ts|tsx|jsx)$/.test(rel) && !["package.json", "vitest.config.mjs"].includes(rel)) continue;
      output.push({ path, rel });
    }
  };
  visit(root);
  return output.sort((a, b) => a.rel.localeCompare(b.rel));
}

function classifyScanPath(rel) {
  if (/(?:^|\/)(?:test|tests|__tests__|fixtures?)(?:\/|[.])|[.]test[.]/i.test(rel)) return "test_only";
  if (/(?:^|\/)tools\/architecture(?:\/|$)|(?:^|\/)docs(?:\/|$)/i.test(rel)) return "audit_only";
  // The old quality-store export remains audit-only for vNext task roots; it
  // rejects canonical writes and is not the current writer.  The TaskKernel
  // method is the one current writer used by the public stage runtime.
  if (rel === "runtime/evidence/quality-store.mjs") return "audit_only";
  return "current";
}

function isWriterDeclaration(line) {
  return /(?:^|\b)(?:export\s+)?function\s+publishVerifySummary\s*\(|^\s*publishVerifySummary\s*\([^)]*\)\s*\{/.test(line)
    || /^\s*publishVerifySummary\s*[:=]\s*(?:async\s+)?function\b/.test(line);
}

/** Classify scanner rows; unknown is intentionally not silently accepted. */
export function classifyProductionScan(entries, { read_errors = [] } = {}) {
  if (!Array.isArray(entries)) throw new TypeError("production scan entries must be an array");
  if (!Array.isArray(read_errors)) throw new TypeError("production scan read_errors must be an array");
  const rows = entries.map((entry, index) => {
    if (!object(entry) || typeof entry.path !== "string" || typeof entry.token !== "string") throw new TypeError(`production scan entry ${index} is invalid`);
    const classification = entry.classification ?? classifyScanPath(entry.path);
    if (!["current", "audit_only", "test_only", "unknown"].includes(classification)) throw new Error(`unknown production scan classification: ${classification}`);
    return { path: entry.path, line: entry.line ?? null, token: entry.token, classification, writer: entry.writer === true, reason: entry.reason ?? "classified by final production scan" };
  });
  const unknown = rows.filter((row) => row.classification === "unknown");
  const writerPaths = [...new Set(rows
    .filter((row) => row.writer === true || (row.token === "publishVerifySummary" && row.path === "runtime/task/task-kernel-implementation.mjs"))
    .filter((row) => row.classification === "current")
    .map((row) => row.path))];
  return Object.freeze({
    status: unknown.length === 0 && read_errors.length === 0 && writerPaths.length === 1 ? "complete" : "failed",
    entries: Object.freeze(rows),
    unknown_entries: Object.freeze(unknown),
    read_errors: Object.freeze(read_errors.map((entry) => ({ path: entry.path ?? null, error: entry.error ?? "unreadable" }))),
    writer_paths: Object.freeze(writerPaths),
    unique_writer_count: writerPaths.length,
    zero_second_writer: writerPaths.length <= 1,
  });
}

export function scanProductionSurface(root) {
  const entries = [];
  const readErrors = [];
  if (!existsSync(root)) readErrors.push({ path: root, error: "source root does not exist" });
  const files = existsSync(root) ? findProductionFiles(root, readErrors) : [];
  for (const file of files) {
    let text;
    try { text = readFileSync(file.path, "utf8"); }
    catch (error) { readErrors.push({ path: file.rel, error: error.message }); continue; }
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const token of SCAN_TOKENS) {
        if (!line.includes(token)) continue;
        const classification = classifyScanPath(file.rel);
        entries.push({
          path: file.rel,
          line: index + 1,
          token,
          classification,
          writer: token === "publishVerifySummary"
            && classification === "current"
            && file.rel !== "tools/cli/produce-final-current-snapshot.mjs"
            && isWriterDeclaration(line),
          reason: classification === "test_only" ? "test fixture or contract consumer" : "known current authority/consumer reference",
        });
      }
    });
  }
  return classifyProductionScan(entries, { read_errors: readErrors });
}

function validateMaterialShape(materials) {
  const missing = materials.filter(({ raw }) => raw.trim() === "").map(({ name }) => name);
  if (missing.length) throw new Error(`current material is empty: ${missing.join(", ")}`);
}

function phaseHeadings(text) {
  return [...text.matchAll(/^##\s+(Phase\s+[^\n]+)$/gm)].map((match) => match[1].trim());
}

function planAcceptanceCheck({ planText, tasksText, t013Declared, activeIds, materialHashes = {} }) {
  const errors = [];
  const plans = phaseHeadings(planText);
  const tasks = phaseHeadings(tasksText);
  if (plans.length === 0 || plans.length !== tasks.length || plans.some((value, index) => value !== tasks[index])) errors.push("plan/tasks Phase headings or order differ");
  const expectedPhases = ["Phase P1 — S3", "Phase P2 — S4-slicing", "Phase P3 — S4-review-budget", "Phase P4 — S7"];
  if (plans.length !== expectedPhases.length || plans.some((value, index) => value !== expectedPhases[index])) {
    errors.push(`expected exact serial Phase headings: ${expectedPhases.join(", ")}`);
  }
  if (!sameSet(t013Declared, activeIds)) errors.push("T013 active AC declaration does not equal canonical active AC set");
  const block = t013Block(tasksText);
  if (!/^-\s+\*\*acceptance_role\*\*：acceptance$/mi.test(block)) errors.push("T013 must be the acceptance task");
  if (!/^-\s+\*\*e2e_scope\*\*：not_required$/mi.test(block)) errors.push("T013 e2e_scope must be not_required");
  const gate = block.match(/^-\s+\*\*gate_cmd\*\*\s*[:：]\s*`([^`]+)`/mi)?.[1] ?? "";
  const shellQuoteFreeGate = gate.replaceAll(/[\"']/g, "");
  if (!shellQuoteFreeGate.includes("produce-final-current-snapshot.mjs") || !shellQuoteFreeGate.includes("--task-dir=$TASK_DIR")
      || !/--output=\$TASK_DIR\/quality\/tests\/final\/current-snapshot(?:-[A-Za-z0-9._-]+)?\.json/.test(shellQuoteFreeGate)) {
    errors.push("T013 gate_cmd does not bind the final snapshot producer and task-local output");
  }
  const oracle = block.match(/^-\s+\*\*oracle\*\*\s*[:：]\s*`([^`]+)`/mi)?.[1] ?? "";
  const normalisedOracle = oracle.replaceAll("**", "").replaceAll("|", " ");
  if (!/exactly one assertion per active AC|恰(?:好)?\s*一\s*条/i.test(normalisedOracle)
      || !/unknown.*unavailable.*incomplete.*conflict/i.test(normalisedOracle)) {
    errors.push("T013 oracle does not state exact AC assertions and non-passing preservation");
  }
  const acceptanceData = parseJsonField(block, "acceptance_data");
  const scenario = Array.isArray(acceptanceData) ? acceptanceData[0] : null;
  const args = scenario?.execution?.args;
  if (!scenario || scenario.tier !== "command" || scenario.execution?.command !== "node"
      || !Array.isArray(args) || !args.includes("tools/cli/produce-final-current-snapshot.mjs")) {
    errors.push("T013 acceptance_data does not bind the executable final snapshot scenario");
  }
  const versionedRefs = parseJsonField(block, "versioned_refs");
  if (Array.isArray(versionedRefs)) {
    for (const name of ["spec", "plan"]) {
      const expected = versionedRefs.find((entry) => entry?.artifact_kind === name);
      if (!expected || expected.hash !== materialHashes[`${name}.md`]) errors.push(`T013 versioned ${name} ref does not match current material hash`);
    }
  }
  return Object.freeze({ status: errors.length === 0 ? "passed" : "failed", errors: Object.freeze(errors), phase_count: plans.length });
}

function captureCurrentSnapshotIdentity(sourceRoot, taskId, materialRevision) {
  let snapshot;
  try { snapshot = captureExecutionSnapshot(sourceRoot, taskId); }
  catch (error) { throw new Error(`current worktree snapshot cannot be captured: ${error.message}`); }
  if (!OID.test(snapshot?.tree ?? "") || !OID.test(snapshot?.commit ?? "") || !SHA256_HEX_CASE_INSENSITIVE.test(snapshot?.source_digest ?? "")) {
    throw new Error("current worktree snapshot has incomplete tree/commit/source identity");
  }
  return Object.freeze({
    material_revision: materialRevision,
    snapshot_tree: snapshot.tree,
    snapshot_commit: snapshot.commit,
    source_digest: snapshot.source_digest,
    snapshot_head: snapshot.head,
  });
}

function profileEvidenceCandidates(value) {
  const candidates = [];
  const add = (ref, sha256, field) => {
    if (object(ref)) candidates.push({ ref: ref.ref, sha256: ref.sha256, field });
    else if (typeof ref === "string") candidates.push({ ref, sha256, field });
  };
  add(value?.profile_source, null, "profile_source");
  add(value?.manifests?.inner, null, "inner_manifest");
  add(value?.manifests?.medium, null, "medium_manifest");
  for (const group of [
    ...Object.values(value?.groups?.inner_files ?? {}),
    value?.groups?.inner_collection,
    value?.groups?.medium_collection,
  ]) {
    for (const run of group?.runs ?? []) {
      for (const member of run?.members ?? [run]) {
        add(member.stdout_ref, member.stdout_hash, "stdout");
        add(member.stderr_ref, member.stderr_hash, "stderr");
      }
    }
  }
  for (const observation of Object.values(value?.capability_observations ?? {})) {
    add(observation?.evidence_ref, observation?.evidence_hash, "capability_observation");
  }
  return candidates.filter((entry) => typeof entry.ref === "string" && entry.ref.trim() !== "");
}

function profileRunStatus(run) {
  if (!object(run)) return false;
  const members = Array.isArray(run.members) ? run.members : [run];
  return members.length > 0 && members.every((member) => (
    object(member)
      && Number.isSafeInteger(member.pid)
      && member.pid > 0
      && member.exit_code === 0
      && member.signal === null
      && member.cleanup?.status === "completed"
      && SHA256_HEX_CASE_INSENSITIVE.test(String(member.stdout_hash ?? ""))
      && SHA256_HEX_CASE_INSENSITIVE.test(String(member.stderr_hash ?? ""))
      && typeof member.stdout_ref === "string"
      && typeof member.stderr_ref === "string"
  ));
}

function profileGroupComplete(group, { workerCeiling, requireOverlap = false } = {}) {
  if (!object(group) || group.sample_count !== 5 || !Array.isArray(group.runs) || group.runs.length !== 5) return false;
  if (!(["pass", "passed"].includes(String(group.result ?? "").toLowerCase()))) return false;
  if (!Number.isSafeInteger(group.threshold_ms) || group.threshold_ms < 1
      || !Number.isSafeInteger(group.max_ms) || !Number.isSafeInteger(group.p95_ms)
      || group.max_ms > group.threshold_ms || group.p95_ms > group.threshold_ms
      || group.independent_processes !== true || group.all_exit_zero !== true || group.cleanup_complete !== true) return false;
  if (workerCeiling !== undefined) {
    if (!Number.isSafeInteger(group.worker_ceiling) || group.worker_ceiling !== workerCeiling
        || group.actual_workers > workerCeiling || group.worker_bound_ok !== true) return false;
  }
  if (requireOverlap && (group.overlap_observed !== true || group.actual_workers < 2)) return false;
  return group.runs.every((run) => profileRunStatus(run));
}

function fiveSampleProfileStatus(value, taskDir) {
  if (evidenceStatus(value) !== "passed") return evidenceStatus(value);
  const groups = value?.groups;
  const files = object(groups?.inner_files) ? Object.values(groups.inner_files) : [];
  const collections = [groups?.inner_collection, groups?.medium_collection];
  const samples = [...files, ...collections];
  const innerWorkerCeiling = value?.profiles?.inner?.worker_ceiling;
  const mediumWorkerCeiling = value?.profiles?.medium?.worker_ceiling;
  const complete = files.length > 0
    && files.every((group) => profileGroupComplete(group))
    && profileGroupComplete(groups?.inner_collection, { workerCeiling: innerWorkerCeiling, requireOverlap: true })
    && profileGroupComplete(groups?.medium_collection, { workerCeiling: mediumWorkerCeiling });
  const profileInputs = object(value.profile_source)
    && SHA256_HEX_CASE_INSENSITIVE.test(String(value.profile_source.sha256 ?? ""))
    && object(value.profiles?.inner)
    && object(value.profiles?.medium)
    && object(value.manifests?.inner)
    && object(value.manifests?.medium);
  const capability = value.capability_observations;
  const capabilityComplete = object(capability)
    && ["inner", "medium"].every((name) => (
      object(capability[name])
        && capability[name].status === "observed"
        && object(capability[name].counts)
        && Object.values(capability[name].counts).every((count) => Number.isSafeInteger(count) && count >= 0)
    ));
  const authentication = authenticateEvidence({ evidence: profileEvidenceCandidates(value) }, taskDir, "performance-profile");
  return complete && profileInputs && capabilityComplete && authentication.status === "passed" ? "passed" : "incomplete";
}

function s3EvidenceSummary(receipts, taskDir) {
  const profileReceipt = receipts.find((receipt) => receipt.ref.includes("performance-profile"));
  const testReceipt = receipts.find((receipt) => receipt.ref.includes("quality/tests/S3/"));
  const profileValue = profileReceipt?.value ?? null;
  const testValue = testReceipt?.value ?? null;
  const performanceStatus = profileReceipt ? fiveSampleProfileStatus(profileValue, taskDir) : "unavailable";
  const conservation = testValue?.conservation ?? testValue?.assertion_conservation ?? null;
  const conservationStatus = object(conservation) ? evidenceStatus(conservation) : "unavailable";
  return {
    status: [routeStatus(receipts), performanceStatus, conservationStatus].every((status) => status === "passed") ? "passed" : "incomplete",
    profile: profileValue ? { status: fiveSampleProfileStatus(profileValue, taskDir), value: profileValue } : { status: "unavailable", value: null },
    performance: profileValue ? { status: performanceStatus, groups: profileValue.groups ?? null } : { status: "unavailable", groups: null },
    conservation: object(conservation) ? { status: conservationStatus, value: conservation } : { status: "unavailable", value: null },
    evidence_refs: receipts.flatMap(evidenceRefsFor),
  };
}

function s4SlicingSummary(receipts, materialHashes) {
  const selfCheck = receipts.find((receipt) => receipt.ref.includes("current-tasks-self-check"));
  const value = selfCheck?.value ?? null;
  const advisory = value?.slice_advisory;
  const markerText = JSON.stringify(advisory?.markers ?? []);
  const zeroCrossPhaseProducer = value?.zero_cross_phase_producer === true
    || /no\s+cross[- ]Phase\s+producer|SIG-CROSS-PHASE\s*[=:]\s*0/i.test(markerText);
  const materialsCurrent = object(value?.materials)
    && ["spec", "plan", "tasks"].every((name) => value.materials[name]?.sha256 === materialHashes[`${name}.md`]);
  const status = selfCheck && selfCheck.status === "passed"
    && value?.validator?.ok === true
    && advisory?.status !== "unexplained_overage"
    && value.exit_code === 0
    && materialsCurrent
    && zeroCrossPhaseProducer
    ? "passed" : "incomplete";
  return {
    status,
    zero_cross_phase_producer: zeroCrossPhaseProducer,
    materials_current: materialsCurrent,
    self_check: value,
    evidence_refs: selfCheck ? evidenceRefsFor(selfCheck) : [],
  };
}

function s4ReviewSummary(receipts) {
  const receipt = receipts[0] ?? null;
  const value = receipt?.value ?? null;
  const provenance = value?.provenance ?? value?.provenance_summary ?? null;
  const provenanceStatus = object(provenance) ? evidenceStatus(provenance) : "unavailable";
  const provenanceComplete = provenanceStatus === "passed"
    && provenance.public_entrypoint === true
    && provenance.bare_cli === true;
  return {
    status: receipt && receipt.status === "passed" && provenanceComplete ? "passed" : "incomplete",
    provenance: object(provenance) ? provenance : { status: "unavailable" },
    provenance_complete: provenanceComplete,
    evidence_refs: receipt ? evidenceRefsFor(receipt) : [],
  };
}

function s7EvidenceSummary(receipts, productionScan) {
  const receipt = receipts[0] ?? null;
  const value = receipt?.value ?? null;
  const close = value?.close ?? value?.close_evidence ?? null;
  const fourDomain = value?.four_domain ?? value?.four_domain_status ?? null;
  const closeStatus = object(close) ? evidenceStatus(close) : "unavailable";
  const domainStatus = object(fourDomain) ? evidenceStatus(fourDomain) : "unavailable";
  const closeComplete = closeStatus === "passed"
    && (close.unique_completed === true
      || (object(close.plan) && Array.isArray(close.step_records) && object(close.completed)));
  const fourDomainComplete = domainStatus === "passed" && fourDomain.consistent === true;
  return {
    status: receipt && receipt.status === "passed" && productionScan.status === "complete"
      && closeComplete && fourDomainComplete ? "passed" : "incomplete",
    close: object(close) ? close : { status: "unavailable" },
    four_domain: object(fourDomain) ? fourDomain : { status: "unavailable" },
    close_status: closeStatus,
    four_domain_status: domainStatus,
    close_complete: closeComplete,
    four_domain_complete: fourDomainComplete,
    production_scan: productionScan,
    evidence_refs: receipt ? evidenceRefsFor(receipt) : [],
  };
}

function acAssertion(id, receipts) {
  const route = routeNameForAc(id);
  const source = receiptsForAc(routeReceipts(receipts, route), id);
  const status = routeStatus(source);
  const actual = source.length === 0
    ? [{ ref: null, status: "unavailable", reason: "no receipt explicitly covers this active AC" }]
    : source.map((receipt) => ({
      ref: receipt.ref,
      status: receipt.status,
      covered_ac_ids: receipt.covered_ac_ids,
      authentication: receipt.authentication?.status ?? "not_provided",
      identity: receipt.identity?.status ?? "unknown",
    }));
  return {
    ac_id: id,
    oracle_id: `ORACLE-${route}`,
    status,
    actual,
    evidence_refs: source.flatMap(evidenceRefsFor),
    source_receipt: source[0]?.ref ?? null,
  };
}

function buildSnapshot({ taskId, materials, taskDir, outputPath, sourceRoot = process.cwd() }) {
  validateMaterialShape(materials);
  const materialHashes = Object.fromEntries(materials.map(({ name, raw }) => [name, sha256(raw)]));
  const materialRevision = materialIdentity(materials);
  const snapshotIdentity = captureCurrentSnapshotIdentity(resolve(sourceRoot), taskId, materialRevision);
  const spec = materials.find(({ name }) => name === "spec.md").raw;
  const plan = materials.find(({ name }) => name === "plan.md").raw;
  const tasks = materials.find(({ name }) => name === "tasks.md").raw;
  const activeAcIds = deriveActiveAcIds(spec);
  const taskDeclaredAcIds = deriveTaskDeclaredAcIds(tasks, activeAcIds);
  const planAcceptance = planAcceptanceCheck({
    planText: plan,
    tasksText: tasks,
    t013Declared: taskDeclaredAcIds,
    activeIds: activeAcIds,
    materialHashes,
  });
  if (planAcceptance.status !== "passed") throw new Error(`plan acceptance failed: ${planAcceptance.errors.join("; ")}`);
  const receipts = loadReceipts(taskDir, taskId, snapshotIdentity);
  const productionScan = scanProductionSurface(resolve(sourceRoot));
  if (productionScan.status !== "complete") throw new Error("production authority scan failed: unknown reference or second writer");
  const assertions = activeAcIds.map((id) => acAssertion(id, receipts));
  if (new Set(assertions.map((entry) => entry.ac_id)).size !== activeAcIds.length) throw new Error("final snapshot has duplicate AC assertions");
  const routeSummary = Object.fromEntries(["S3", "S4S", "S4R", "S7", "GOV"].map((route) => [route, {
    status: routeStatus(routeReceipts(receipts, route)),
    receipts: routeReceipts(receipts, route).map((receipt) => ({
      ref: receipt.ref,
      sha256: receipt.sha256,
      status: receipt.status,
      command: receipt.value.command ?? receipt.value.gate_command ?? null,
      expected_exit: receipt.value.expected_exit ?? null,
      observed_exit: receipt.value.observed_exit ?? receipt.value.exit_code ?? null,
      raw_refs: evidenceRefsFor(receipt),
      identity: receipt.identity,
    })),
    evidence_refs: routeReceipts(receipts, route).flatMap(evidenceRefsFor),
  }]));
  const productionRoot = resolve(sourceRoot);
  const s3 = s3EvidenceSummary(receipts.S3, taskDir);
  const s4Slicing = s4SlicingSummary(receipts.S4S, materialHashes);
  const s4Review = s4ReviewSummary(receipts.S4R);
  const s7 = s7EvidenceSummary(receipts.S7, productionScan);
  const qualityStatuses = [
    ["S3", s3.status],
    ["S4S", s4Slicing.status],
    ["S4R", s4Review.status],
    ["S7", s7.status],
  ];
  const nonPassing = [
    ...assertions.filter((entry) => entry.status !== "passed").map((entry) => entry.ac_id),
    ...qualityStatuses.filter(([, status]) => status !== "passed").map(([route]) => `QUALITY-${route}`),
  ];
  return {
    schema_version: FINAL_SCHEMA,
    task_id: taskId,
    aggregate_status: nonPassing.length === 0 ? "passed" : "incomplete",
    generated_status: "complete",
    material_identity: {
      material_revision: materialRevision,
      snapshot_tree: snapshotIdentity.snapshot_tree,
      snapshot_commit: snapshotIdentity.snapshot_commit,
      source_digest: snapshotIdentity.source_digest,
      files: Object.fromEntries(materials.map(({ name, raw }) => [name, { ref: `specs/${taskId}/${name}`, sha256: sha256(raw) }])),
    },
    snapshot_identity: {
      task_id: taskId,
      ...snapshotIdentity,
      source_root: productionRoot,
    },
    active_ac_ids: activeAcIds,
    task_declared_ac_ids: taskDeclaredAcIds,
    assertions,
    targeted_routes: routeSummary,
    receipts: Object.fromEntries(Object.entries(receipts).map(([name, values]) => [name, values.map((receipt) => ({
      ref: receipt.ref,
      sha256: receipt.sha256,
      status: receipt.status,
      command: receipt.value.command ?? receipt.value.gate_command ?? receipt.value.execution?.command ?? null,
      expected_exit: receipt.value.expected_exit ?? null,
      observed_exit: receipt.value.observed_exit ?? receipt.value.exit_code ?? null,
      raw_refs: evidenceRefsFor(receipt),
      covered_ac_ids: receipt.covered_ac_ids,
      authentication: receipt.authentication?.status ?? "not_provided",
      identity: receipt.identity,
    }))])),
    production_scan: productionScan,
    plan_acceptance: planAcceptance,
    s3,
    p2_slicing: s4Slicing,
    p3_review_budget: s4Review,
    s7,
    limitations: [
      "This snapshot is evidence, not a second product-release authority or current store.",
      "Non-passing source facts remain incomplete and do not become pass.",
      "The scan does not prove remote permissions, network delivery, or irreversible cleanup.",
    ],
    aggregate_notes: nonPassing.length === 0 ? [] : [`non-passing AC evidence remains explicit: ${nonPassing.join(", ")}`],
    output_ref: relativeTaskRef(taskDir, outputPath),
  };
}

export function produceFinalCurrentSnapshot({ taskId, specPath, planPath, tasksPath, taskDir, outputPath, sourceRoot = process.cwd() } = {}) {
  if (typeof taskId !== "string" || taskId.trim() === "") throw new TypeError("taskId is required");
  for (const [label, path] of [["spec", specPath], ["plan", planPath], ["tasks", tasksPath], ["task-dir", taskDir], ["output", outputPath]]) {
    if (typeof path !== "string" || path.trim() === "") throw new TypeError(`${label} path is required`);
  }
  if (!isAbsolute(taskDir) || !isAbsolute(outputPath)) throw new TypeError("task-dir and output must be absolute");
  const materials = [
    { name: "spec.md", path: resolve(specPath), raw: readText(resolve(specPath), "spec.md") },
    { name: "plan.md", path: resolve(planPath), raw: readText(resolve(planPath), "plan.md") },
    { name: "tasks.md", path: resolve(tasksPath), raw: readText(resolve(tasksPath), "tasks.md") },
  ];
  const snapshot = buildSnapshot({ taskId, materials, taskDir: resolve(taskDir), outputPath: resolve(outputPath), sourceRoot: resolve(sourceRoot) });
  const publication = writeFinalSnapshot(resolve(outputPath), snapshot);
  return Object.freeze({ ...snapshot, output: publication });
}

export function main(args = process.argv.slice(2)) {
  try {
    const options = parseArgs(args);
    const result = produceFinalCurrentSnapshot(options);
    if (options.acceptanceOutput === true) {
      // The declared acceptance scenario runs as bare argv with no shell, so it
      // cannot post-process the summary.  Emit the canonical acceptance
      // document the runtime validator reads instead: one entry per active AC,
      // each carrying this snapshot's own assertion and its real status.
      const entries = (result.assertions ?? []).map((assertion) => ({
        acceptance_criterion_id: assertion.ac_id,
        assertions: [{
          id: assertion.oracle_id,
          expected: "passed",
          actual: assertion.status,
        }],
      }));
      process.stdout.write(`${JSON.stringify({ entries })}\n`);
      return result;
    }
    process.stdout.write(`${JSON.stringify({ output: result.output.ref, sha256: result.output.sha256, aggregate_status: result.aggregate_status })}\n`);
    return result;
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
    return null;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
