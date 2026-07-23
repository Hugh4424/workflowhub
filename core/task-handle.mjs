import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { hostname } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

import { deriveTaskPath, validateProjectName, validateTaskId } from "./task-identity.mjs";
import { inspectRunnerIdentity } from "./runner-identity.mjs";
import { buildTaskKernel } from "./task-kernel-implementation.mjs";

const FORBIDDEN_MANIFEST_FIELDS = new Set([
  "status", "stage_map", "updated_at", "lock", "worktree", "worktree_root",
]);
const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const TASK_HANDLES = new WeakSet();
const TASK_KERNELS = new WeakSet();
const CANONICAL_RECORD_WRITERS = new WeakMap();
const CANONICAL_ACCEPTED_REPLACERS = new WeakMap();
const TARGET_REPO_ROOT_MIGRATORS = new WeakMap();
const RUNNER_ROOT_MIGRATORS = new WeakMap();
const CREATE_CLAIM_MAX_AGE_MS = 15 * 60 * 1000;
const RECORD_LOCK_WAIT_MS = 10_000;
const CANONICAL_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const TARGET_REPO_ROOT_MIGRATION_REF = /^identity\/migrations\/target-repo-root\/[a-f0-9]{64}\.json$/;
const RUNNER_ROOT_MIGRATION_REF = /^identity\/migrations\/runner-root\/[a-f0-9]{64}\.json$/;
const HASH = /^[a-f0-9]{64}$/;

export function assertTaskHandle(value) {
  if (!value || typeof value !== "object" || !TASK_HANDLES.has(value)) {
    throw new TypeError("expected a WorkflowHub TaskHandle capability");
  }
  return value;
}

export function assertTaskKernel(value) {
  if (!value || typeof value !== "object" || !TASK_KERNELS.has(value)) {
    throw new TypeError("expected a WorkflowHub TaskKernel capability");
  }
  return value;
}


function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function validateManifest(manifest) {
  assertPlainObject(manifest, "task manifest");
  const projectName = validateProjectName(manifest.project_name);
  const taskId = validateTaskId(manifest.task_id);
  if (manifest.schema_version !== "1.0.0") throw new TypeError('task manifest schema_version must be "1.0.0"');
  if (typeof manifest.created_at !== "string" || !Number.isFinite(Date.parse(manifest.created_at))) {
    throw new TypeError("task manifest created_at must be an ISO-compatible timestamp");
  }
  if (typeof manifest.target_repo_root !== "string" || !isAbsolute(manifest.target_repo_root)) {
    throw new TypeError("task manifest target_repo_root must be an absolute path");
  }
  if (!Array.isArray(manifest.issue_ids) || !manifest.issue_ids.every((id) => typeof id === "string" && id.trim() !== "")) {
    throw new TypeError("task manifest issue_ids must be an array of non-empty strings");
  }
  assertPlainObject(manifest.inputs, "task manifest inputs");
  const hasRunnerRoot = Object.prototype.hasOwnProperty.call(manifest, "runner_root");
  const hasRunnerOid = Object.prototype.hasOwnProperty.call(manifest, "runner_oid");
  const hasRunnerMigration = Object.prototype.hasOwnProperty.call(manifest, "runner_root_migration");
  if (hasRunnerRoot !== hasRunnerOid || hasRunnerRoot !== hasRunnerMigration) throw new TypeError("task manifest runner_root, runner_oid, and runner_root_migration must be present together");
  if (hasRunnerRoot) {
    if (typeof manifest.runner_root !== "string" || !isAbsolute(manifest.runner_root)) throw new TypeError("task manifest runner_root must be an absolute path");
    if (!/^[a-f0-9]{40}$/.test(manifest.runner_oid ?? "")) throw new TypeError("task manifest runner_oid must be a full Git commit OID");
    assertPlainObject(manifest.runner_root_migration, "task manifest runner_root_migration");
    const migration = manifest.runner_root_migration;
    if (Object.keys(migration).some((key) => key !== "ref") || !RUNNER_ROOT_MIGRATION_REF.test(migration.ref ?? "")) {
      throw new TypeError("task manifest runner_root_migration is invalid");
    }
  }
  if (manifest.target_repo_root_migration !== undefined) {
    assertPlainObject(manifest.target_repo_root_migration, "task manifest target_repo_root_migration");
    const migration = manifest.target_repo_root_migration;
    if (Object.keys(migration).some((key) => !["ref", "integrity_hash"].includes(key)) || !TARGET_REPO_ROOT_MIGRATION_REF.test(migration.ref ?? "") || !HASH.test(migration.integrity_hash ?? "")) {
      throw new TypeError("task manifest target_repo_root_migration is invalid");
    }
  }
  for (const field of FORBIDDEN_MANIFEST_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest, field)) throw new TypeError(`task manifest must not contain mutable field: ${field}`);
  }
  return { projectName, taskId };
}

function sha256(raw) { return createHash("sha256").update(raw).digest("hex"); }

function runnerMigrationRef(previousManifestHash, runnerIdentity) {
  return `identity/migrations/runner-root/${sha256(`${previousManifestHash}\0${JSON.stringify(runnerIdentity)}`)}.json`;
}

function gitValue(root, args, label) {
  try { return String(execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
  catch (error) { throw new Error(`${label} validation failed: ${error.stderr?.toString().trim() || error.message}`); }
}

function gitCheckout(path, branch, label) {
  const root = realDirectoryNoSymlink(resolve(path), label);
  const top = realpathSync(gitValue(root, ["rev-parse", "--show-toplevel"], label));
  if (top !== root) throw new Error(`${label} must be a Git toplevel directory`);
  const commonRaw = gitValue(root, ["rev-parse", "--git-common-dir"], label);
  const common = realpathSync(resolve(root, commonRaw));
  const checkedOut = gitValue(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], label);
  if (checkedOut !== branch) throw new Error(`${label} must have target branch checked out`);
  const head = gitValue(root, ["rev-parse", "--verify", "HEAD^{commit}"], label).toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error(`${label} HEAD must be a full Git commit OID`);
  return { root, common, branch: checkedOut, head };
}

function gitRepository(path, label) {
  const root = realDirectoryNoSymlink(resolve(path), label);
  const top = realpathSync(gitValue(root, ["rev-parse", "--show-toplevel"], label));
  if (top !== root) throw new Error(`${label} must be a Git toplevel directory`);
  return { root, common: realpathSync(resolve(root, gitValue(root, ["rev-parse", "--git-common-dir"], label))) };
}

function validateTargetRepoRootMigration(task, manifest) {
  const pointer = manifest.target_repo_root_migration;
  if (!pointer) return;
  const raw = task.readRecord(pointer.ref);
  if (sha256(raw) !== pointer.integrity_hash) throw new Error("target repository migration integrity hash mismatch");
  const record = JSON.parse(raw);
  const allowed = new Set(["schema_version", "project_name", "task_id", "previous_target_repo_root", "previous_manifest_hash", "previous_migration_ref", "previous_migration_hash", "target_repo_root", "target_git_common_dir", "target_branch", "target_head", "migrated_at"]);
  if (!record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).some((key) => !allowed.has(key)) || record.schema_version !== "task-target-repo-root-migration.v1" || record.project_name !== task.identity.projectName || record.task_id !== task.identity.taskId || record.target_repo_root !== manifest.target_repo_root || !isAbsolute(record.previous_target_repo_root ?? "") || !HASH.test(record.previous_manifest_hash ?? "") || !isAbsolute(record.target_git_common_dir ?? "") || typeof record.target_branch !== "string" || !/^[a-f0-9]{40}$/.test(record.target_head ?? "") || !Number.isFinite(Date.parse(record.migrated_at))) {
    throw new Error("target repository migration record is invalid");
  }
  if ((record.previous_migration_ref === undefined) !== (record.previous_migration_hash === undefined) || (record.previous_migration_ref !== undefined && (!TARGET_REPO_ROOT_MIGRATION_REF.test(record.previous_migration_ref) || !HASH.test(record.previous_migration_hash)))) throw new Error("target repository migration source chain is invalid");
  const seen = new Set([pointer.ref]);
  let successor = record;
  while (successor.previous_migration_ref !== undefined) {
    const ref = successor.previous_migration_ref;
    if (seen.has(ref)) throw new Error("target repository migration source chain contains a cycle");
    seen.add(ref);
    const previousRaw = task.readRecord(ref);
    if (sha256(previousRaw) !== successor.previous_migration_hash) throw new Error("target repository migration source chain hash mismatch");
    const previous = JSON.parse(previousRaw);
    if (!previous || typeof previous !== "object" || Array.isArray(previous) || previous.schema_version !== "task-target-repo-root-migration.v1" || previous.project_name !== task.identity.projectName || previous.task_id !== task.identity.taskId || previous.target_repo_root !== successor.previous_target_repo_root) throw new Error("target repository migration source chain mismatch");
    if ((previous.previous_migration_ref === undefined) !== (previous.previous_migration_hash === undefined)) throw new Error("target repository migration source chain is invalid");
    successor = previous;
  }
  const target = gitRepository(manifest.target_repo_root, "migrated target repository");
  if (target.root !== record.target_repo_root || target.common !== record.target_git_common_dir) throw new Error("target repository migration repository identity mismatch");
}

function validateRunnerRootMigration(task, manifest, manifestRaw) {
  const pointer = manifest.runner_root_migration;
  if (!pointer) return;
  const raw = task.readRecord(pointer.ref);
  let record;
  try { record = JSON.parse(raw); }
  catch (error) { throw new Error(`runner root migration record is invalid: ${error.message}`); }
  const allowed = new Set(["schema_version", "project_name", "task_id", "previous_manifest_hash", "new_manifest_hash", "runner_identity"]);
  if (!record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).some((key) => !allowed.has(key)) ||
      record.schema_version !== "task-runner-root-migration.v1" || record.project_name !== task.identity.projectName ||
      record.task_id !== task.identity.taskId || !HASH.test(record.previous_manifest_hash ?? "") || !HASH.test(record.new_manifest_hash ?? "")) {
    throw new Error("runner root migration record is invalid");
  }
  const identity = record.runner_identity;
  const identityKeys = new Set(["runner_root", "runner_oid", "runner_branch", "project", "task", "stage", "agents_ref", "stage_skill_ref"]);
  if (!identity || typeof identity !== "object" || Array.isArray(identity) || Object.keys(identity).some((key) => !identityKeys.has(key)) ||
      identity.runner_root !== manifest.runner_root || identity.runner_oid !== manifest.runner_oid || !/^[a-f0-9]{40}$/.test(identity.runner_oid ?? "") || identity.project !== task.identity.projectName || identity.task !== task.identity.taskId ||
      typeof identity.stage !== "string" || identity.agents_ref !== "AGENTS.md" || identity.stage_skill_ref !== `workflows/${identity.stage}/SKILL.md`) {
    throw new Error("runner root migration identity mismatch");
  }
  if (runnerMigrationRef(record.previous_manifest_hash, identity) !== pointer.ref) throw new Error("runner root migration lineage mismatch");
  let migrationManifest = manifest;
  let migrationManifestRaw = manifestRaw;
  let targetPointer = manifest.target_repo_root_migration;
  while (sha256(migrationManifestRaw) !== record.new_manifest_hash && targetPointer) {
    const targetRecord = JSON.parse(task.readRecord(targetPointer.ref));
    const prior = { ...migrationManifest, target_repo_root: targetRecord.previous_target_repo_root };
    if (targetRecord.previous_migration_ref) {
      prior.target_repo_root_migration = { ref: targetRecord.previous_migration_ref, integrity_hash: targetRecord.previous_migration_hash };
    } else {
      delete prior.target_repo_root_migration;
    }
    const priorRaw = `${JSON.stringify(prior, null, 2)}\n`;
    if (sha256(priorRaw) !== targetRecord.previous_manifest_hash) throw new Error("target repository migration previous manifest hash mismatch");
    migrationManifest = prior;
    migrationManifestRaw = priorRaw;
    targetPointer = prior.target_repo_root_migration;
  }
  if (sha256(migrationManifestRaw) !== record.new_manifest_hash) throw new Error("runner root migration new manifest hash mismatch");
  const previousManifest = { ...migrationManifest };
  delete previousManifest.runner_root;
  delete previousManifest.runner_oid;
  delete previousManifest.runner_root_migration;
  const reconstructedPreviousRaw = `${JSON.stringify(previousManifest, null, 2)}\n`;
  if (sha256(reconstructedPreviousRaw) !== record.previous_manifest_hash) throw new Error("runner root migration previous manifest hash mismatch");
}

function expectedIdentity(expected = {}, expectedTaskId) {
  if (typeof expected === "string") {
    return { projectName: validateProjectName(expected), taskId: validateTaskId(expectedTaskId) };
  }
  return {
    projectName: validateProjectName(expected.projectName ?? expected.project_name),
    taskId: validateTaskId(expected.taskId ?? expected.task_id),
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function assertInside(basePath, candidatePath, label = "path") {
  const rel = relative(basePath, candidatePath);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return;
  throw new Error(`${label} escapes trusted root: ${candidatePath}`);
}

function assertTaskPathShape(taskPath, projectName, taskId) {
  if (typeof taskPath !== "string" || !isAbsolute(taskPath)) throw new TypeError("taskPath must be absolute");
  const path = resolve(taskPath);
  if (basename(path) !== taskId || basename(dirname(path)) !== "tasks" ||
      basename(dirname(dirname(path))) !== projectName ||
      basename(dirname(dirname(dirname(path)))) !== "Projects") {
    throw new Error(`taskPath does not match Projects/${projectName}/tasks/${taskId}: ${path}`);
  }
  return path;
}

function realDirectoryNoSymlink(path, label) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a real directory: ${path}`);
  return realpathSync(path);
}

function assertNoSymlinkChain(path, label) {
  const absolute = resolve(path);
  const parts = absolute.split("/").filter(Boolean);
  let cursor = "/";
  for (const part of parts) {
    cursor = resolve(cursor, part);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) throw new Error(`${label} contains a symlink: ${cursor}`);
  }
}

function ensureChildDirectories(root, segments) {
  let cursor = root;
  for (const segment of segments) {
    cursor = resolve(cursor, segment);
    assertInside(root, cursor);
    if (existsSync(cursor)) realDirectoryNoSymlink(cursor, "trusted directory");
    else {
      try { mkdirSync(cursor); }
      catch (error) { if (error?.code !== "EEXIST") throw error; }
      realDirectoryNoSymlink(cursor, "trusted directory");
    }
    assertInside(root, realpathSync(cursor));
  }
  return cursor;
}

function fsyncDirectory(path) {
  const fd = openSync(path, constants.O_RDONLY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function assertOpenedPath(fd, path, trustedRoot, label) {
  const opened = fstatSync(fd);
  const pathStat = lstatSync(path);
  if (pathStat.isSymbolicLink() || opened.dev !== pathStat.dev || opened.ino !== pathStat.ino) {
    throw new Error(`${label} changed while opening: ${path}`);
  }
  assertInside(trustedRoot, realpathSync(path), label);
}

function readRegularFileNoFollow(path, label, trustedRoot = dirname(path)) {
  const trustedRootReal = realpathSync(trustedRoot);
  const fd = openSync(path, constants.O_RDONLY | NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw new Error(`${label} must be a regular file: ${path}`);
    assertOpenedPath(fd, path, trustedRootReal, label);
    return readFileSync(fd, "utf8");
  } finally {
    closeSync(fd);
  }
}

function directorySnapshot(root, parent) {
  const realRoot = realpathSync(root);
  assertInside(realRoot, realpathSync(parent), "record parent");
  const rel = relative(realRoot, parent);
  const paths = [realRoot];
  let cursor = realRoot;
  for (const segment of rel.split("/").filter(Boolean)) {
    cursor = resolve(cursor, segment);
    paths.push(cursor);
  }
  return paths.map((path) => {
    const stat = lstatSync(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`trusted ancestor must be a real directory: ${path}`);
    return { path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) };
  });
}

function verifyDirectorySnapshot(snapshot) {
  for (const before of snapshot) {
    const stat = lstatSync(before.path);
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.dev !== before.dev || stat.ino !== before.ino || realpathSync(before.path) !== before.real) {
      throw new Error(`trusted directory changed during operation: ${before.path}`);
    }
  }
}

function verifyDirectoryIdentity(identity, label) {
  const stat = lstatSync(identity.path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.dev !== identity.dev || stat.ino !== identity.ino || realpathSync(identity.path) !== identity.real) {
    throw new Error(`${label} directory identity changed: ${identity.path}`);
  }
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return error?.code === "EPERM"; }
}

function clearStaleClaim(claimPath, taskPath, parent) {
  if (!existsSync(claimPath) || existsSync(taskPath)) return false;
  let claim;
  try { claim = JSON.parse(readRegularFileNoFollow(claimPath, "task create claim", parent)); }
  catch { return false; }
  const age = Date.now() - Date.parse(claim.started_at);
  const expired = Number.isFinite(age) && age > CREATE_CLAIM_MAX_AGE_MS;
  const ownerDead = claim.host === hostname() && !processAlive(claim.pid);
  if (!ownerDead && !expired) return false;
  if (typeof claim.nonce !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claim.nonce)) return false;
  if (existsSync(taskPath)) return false;
  const temporary = resolve(parent, `.${basename(taskPath)}.${claim.nonce}.tmp`);
  assertInside(parent, temporary, "task create temporary");
  if (existsSync(temporary)) {
    const stat = lstatSync(temporary);
    if (!stat.isDirectory() || stat.isSymbolicLink() || dirname(temporary) !== parent) return false;
    rmSync(temporary, { recursive: true, force: true });
  }
  rmSync(claimPath, { force: true });
  fsyncDirectory(parent);
  return true;
}

function lockOwnerDeadOrExpired(lockPath, taskRoot) {
  let owner;
  try { owner = JSON.parse(readRegularFileNoFollow(lockPath, "record lock", taskRoot)); }
  catch { return false; }
  const age = Date.now() - Date.parse(owner.started_at);
  // PID liveness is authoritative only on this host. Never steal a live local
  // lock by age, and never guess about a remote host without a lease service.
  return owner.host === hostname() && !processAlive(owner.pid)
    && Number.isFinite(age) && age >= 0;
}

function waitBriefly(milliseconds = 10) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function recordLockWaitMs(options) {
  if (options === undefined) return RECORD_LOCK_WAIT_MS;
  assertPlainObject(options, "record lock options");
  if (Object.keys(options).some((key) => key !== "waitMs") || !Number.isSafeInteger(options.waitMs) || options.waitMs < 0) {
    throw new TypeError("record lock waitMs must be a non-negative safe integer");
  }
  return options.waitMs;
}

function withRecordLockAt(taskRoot, relativePath, operation, options) {
  if (typeof operation !== "function") throw new TypeError("record lock operation must be a function");
  const waitMs = recordLockWaitMs(options);
  const { candidate, parent } = resolveRecord(taskRoot, relativePath, { createParents: true });
  const ancestorSnapshot = directorySnapshot(taskRoot, parent);
  const nonce = randomUUID();
  const started = Date.now();
  let fd;
  let owned = false;
  while (!owned) {
    verifyDirectorySnapshot(ancestorSnapshot);
    try {
      fd = openSync(candidate, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
      writeSync(fd, `${JSON.stringify({ pid: process.pid, host: hostname(), started_at: new Date().toISOString(), nonce })}\n`, null, "utf8");
      fsyncSync(fd);
      closeSync(fd); fd = undefined;
      fsyncDirectory(parent);
      owned = true;
    } catch (error) {
      if (fd !== undefined) { closeSync(fd); fd = undefined; }
      if (error?.code !== "EEXIST") throw error;
      if (lockOwnerDeadOrExpired(candidate, taskRoot)) {
        // A lock owner never replaces its live claim. Recovery is restricted to
        // a provably dead process on this host, then acquisition is retried.
        try { unlinkSync(candidate); fsyncDirectory(parent); } catch (unlinkError) {
          if (unlinkError?.code !== "ENOENT") throw unlinkError;
        }
        continue;
      }
      const elapsed = Date.now() - started;
      if (elapsed >= waitMs) throw new Error(`timed out waiting for record lock: ${relativePath}`);
      waitBriefly(Math.min(10, waitMs - elapsed));
    }
  }
  const release = () => {
    if (fd !== undefined) closeSync(fd);
    if (owned) {
      let owner;
      try { owner = JSON.parse(readRegularFileNoFollow(candidate, "record lock", taskRoot)); } catch {}
      if (owner?.nonce !== nonce) throw new Error(`record lock ownership changed: ${relativePath}`);
      unlinkSync(candidate);
      fsyncDirectory(parent);
      verifyDirectorySnapshot(ancestorSnapshot);
    }
  };
  try {
    verifyDirectorySnapshot(ancestorSnapshot);
    const result = operation();
    if (result && typeof result.then === "function") return Promise.resolve(result).finally(release);
    release();
    return result;
  } catch (error) {
    release();
    throw error;
  }
}

function relativeSegments(relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") throw new TypeError(`${label} must be non-empty`);
  if (isAbsolute(relativePath) || relativePath.includes("\\")) throw new TypeError(`${label} must be relative: ${relativePath}`);
  const segments = relativePath.split("/");
  if (segments.some((part) => part === "" || part === "." || part === "..")) {
    throw new TypeError(`${label} contains an unsafe segment: ${relativePath}`);
  }
  return segments;
}

function assertPublicRecordWritable(relativePath) {
  if (/^identity\//.test(relativePath)) throw new Error(`record is identity-owned and cannot be written through TaskHandle: ${relativePath}`);
  if (relativePath === "task.json" || /^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/(?:attempt-[0-9]{4}|accepted(?:-attempt-[0-9]{4}(?:-canonical-[a-f0-9]{64})?)?)\.json$/.test(relativePath) || /^results\/build-code\/revisions\/reopen-[0-9]{4}\.json$/.test(relativePath) || /^confirmations\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/attempt-[0-9]{4}\.json$/.test(relativePath)) {
    throw new Error(`record is kernel-owned and cannot be written through TaskHandle: ${relativePath}`);
  }
  if (relativePath.startsWith("results/")) throw new Error(`results records are kernel-owned and cannot be written through TaskHandle: ${relativePath}`);
  if (/^(?:receipts|reviews|evidence)\//.test(relativePath)) throw new Error(`record is canonical-receipt-owned and cannot be written through TaskHandle: ${relativePath}`);
}

function resolveRecord(taskRoot, relativePath, { createParents = false } = {}) {
  const segments = relativeSegments(relativePath, "record path");
  const parentSegments = segments.slice(0, -1);
  const parent = createParents
    ? ensureChildDirectories(taskRoot, parentSegments)
    : parentSegments.reduce((cursor, segment) => realDirectoryNoSymlink(resolve(cursor, segment), "record parent"), taskRoot);
  const candidate = resolve(parent, segments.at(-1));
  assertInside(taskRoot, candidate, "record path");
  if (existsSync(candidate) && lstatSync(candidate).isSymbolicLink()) throw new Error(`record must not be a symlink: ${candidate}`);
  return { candidate, parent };
}

function displayRecordPath(taskRoot, relativePath) {
  const segments = relativeSegments(relativePath, "record path");
  const candidate = resolve(taskRoot, ...segments);
  assertInside(taskRoot, candidate, "record path");
  let cursor = candidate;
  while (!existsSync(cursor)) cursor = dirname(cursor);
  assertInside(taskRoot, realpathSync(cursor), "record path");
  if (existsSync(candidate) && lstatSync(candidate).isSymbolicLink()) throw new Error(`record must not be a symlink: ${candidate}`);
  return candidate;
}

function writeAtomicAt(taskRoot, relativePath, data, { encoding = "utf8", mode = 0o600, testHooks, validator, expectedPriorRaw } = {}) {
  const { candidate, parent } = resolveRecord(taskRoot, relativePath, { createParents: true });
  const ancestorSnapshot = directorySnapshot(taskRoot, parent);
  const temporary = resolve(parent, `.${randomUUID()}.tmp`);
  let fd;
  let openedTemporary;
  try {
    testHooks?.afterParentPrecheck?.();
    verifyDirectorySnapshot(ancestorSnapshot);
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, mode);
    assertOpenedPath(fd, temporary, ancestorSnapshot[0].real, "record temporary");
    openedTemporary = realpathSync(temporary);
    writeFileSync(fd, data, { encoding });
    testHooks?.beforeFileFsync?.();
    fsyncSync(fd);
    closeSync(fd); fd = undefined;
    testHooks?.afterOpenBeforeRename?.();
    verifyDirectorySnapshot(ancestorSnapshot);
    if (validator !== undefined) {
      if (typeof validator !== "function") throw new TypeError("atomic record validator must be a function");
      if (typeof expectedPriorRaw !== "string") throw new TypeError("atomic record expectedPriorRaw must be a string");
      validator("pre");
      if (readRegularFileNoFollow(candidate, "atomic record compare-and-swap source", ancestorSnapshot[0].real) !== expectedPriorRaw) {
        throw new Error("atomic record compare-and-swap source changed before replacement");
      }
      testHooks?.afterRevalidateBeforeRename?.();
      verifyDirectorySnapshot(ancestorSnapshot);
      if (readRegularFileNoFollow(candidate, "atomic record compare-and-swap source", ancestorSnapshot[0].real) !== expectedPriorRaw) {
        throw new Error("atomic record compare-and-swap source changed before replacement");
      }
    }
    renameSync(temporary, candidate);
    if (validator !== undefined) {
      validator("post");
      if (readRegularFileNoFollow(candidate, "atomic record replacement", ancestorSnapshot[0].real) !== data) {
        throw new Error("atomic record replacement changed after rename");
      }
    }
    testHooks?.beforeDirectoryFsync?.();
    fsyncDirectory(parent);
    verifyDirectorySnapshot(ancestorSnapshot);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) rmSync(temporary, { force: true });
    if (openedTemporary && openedTemporary !== temporary && existsSync(openedTemporary)) rmSync(openedTemporary, { force: true });
  }
  return candidate;
}

function createOnlyAt(taskRoot, relativePath, data, { encoding = "utf8", mode = 0o600, testHooks } = {}) {
  const { candidate, parent } = resolveRecord(taskRoot, relativePath, { createParents: true });
  const ancestorSnapshot = directorySnapshot(taskRoot, parent);
  const temporary = resolve(parent, `.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, mode);
    assertOpenedPath(fd, temporary, ancestorSnapshot[0].real, "create-only temporary");
    writeFileSync(fd, data, { encoding });
    testHooks?.beforeFileFsync?.();
    fsyncSync(fd);
    closeSync(fd); fd = undefined;
    testHooks?.afterOpenBeforeRename?.();
    verifyDirectorySnapshot(ancestorSnapshot);
    linkSync(temporary, candidate);
    testHooks?.beforeDirectoryFsync?.();
    fsyncDirectory(parent);
    verifyDirectorySnapshot(ancestorSnapshot);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return candidate;
}

function publishTaskDirectory(parent, taskPath, manifest, testHooks) {
  const nonce = randomUUID();
  const temporary = resolve(parent, `.${manifest.task_id}.${nonce}.tmp`);
  const claimPath = resolve(parent, `.${manifest.task_id}.create.lock`);
  let claimFd;
  let claimed = false;
  try {
    try {
      claimFd = openSync(claimPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
    } catch (error) {
      if (error?.code !== "EEXIST" || !clearStaleClaim(claimPath, taskPath, parent)) throw error;
      claimFd = openSync(claimPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
    }
    claimed = true;
    writeSync(claimFd, `${JSON.stringify({ pid: process.pid, host: hostname(), started_at: new Date().toISOString(), nonce })}\n`, null, "utf8");
    fsyncSync(claimFd);
    testHooks?.afterClaim?.();
    if (existsSync(taskPath)) throw new Error(`task already exists: ${taskPath}`);
    mkdirSync(temporary, { mode: 0o700 });
    testHooks?.afterTemporary?.();
    writeAtomicAt(temporary, "task.json", `${JSON.stringify(manifest, null, 2)}\n`);
    fsyncDirectory(temporary);
    if (existsSync(taskPath)) throw new Error(`task already exists: ${taskPath}`);
    testHooks?.beforeRename?.();
    renameSync(temporary, taskPath);
    fsyncDirectory(parent);
  } finally {
    if (claimFd !== undefined) closeSync(claimFd);
    if (existsSync(temporary)) rmSync(temporary, { recursive: true, force: true });
    if (claimed && existsSync(claimPath)) rmSync(claimPath, { force: true });
  }
}

function makeTaskHandle(taskPath, manifest) {
  const realTaskPath = realpathSync(taskPath);
  const taskRootIdentity = directorySnapshot(realTaskPath, realTaskPath)[0];
  const manifestPath = resolve(realTaskPath, "task.json");
  const manifestSnapshot = readRegularFileNoFollow(manifestPath, "task manifest", realTaskPath);
  const verifyManifest = () => {
    const current = readRegularFileNoFollow(manifestPath, "task manifest", realTaskPath);
    if (current !== manifestSnapshot) throw new Error(`task manifest changed after TaskHandle bootstrap: ${manifestPath}`);
  };
  const identity = Object.freeze({ projectName: manifest.project_name, taskId: manifest.task_id });
  const handle = {
    taskPath: realTaskPath,
    identity,
    manifest: deepFreeze(structuredClone(manifest)),
    // Display/diagnostic only. Runtime I/O must use the controlled methods below.
    recordPath(relativePath) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      return displayRecordPath(realTaskPath, relativePath);
    },
    readRecord(relativePath) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const { candidate } = resolveRecord(realTaskPath, relativePath);
      const value = readRegularFileNoFollow(candidate, "record", taskRootIdentity.real);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return value;
    },
    /** Enumerate only canonical attempt envelopes in one trusted stage namespace. */
    listStageAttemptRefs(stage) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      if (!CANONICAL_STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
      const resultsRoot = resolve(realTaskPath, "results");
      const stageRoot = resolve(resultsRoot, stage);
      assertInside(realTaskPath, resultsRoot, "results directory");
      assertInside(realTaskPath, stageRoot, "stage results directory");
      if (!existsSync(stageRoot)) return [];
      const resultsIdentity = directorySnapshot(realTaskPath, resultsRoot);
      const stageIdentity = directorySnapshot(realTaskPath, stageRoot);
      const refs = readdirSync(stageRoot, { withFileTypes: true })
        .filter((entry) => /^attempt-[0-9]{4}\.json$/.test(entry.name))
        .map((entry) => {
          const candidate = resolve(stageRoot, entry.name);
          const stat = lstatSync(candidate);
          if (!entry.isFile() || stat.isSymbolicLink() || !stat.isFile()) {
            throw new Error(`stage attempt must be a regular non-symlink file: ${entry.name}`);
          }
          return `results/${stage}/${entry.name}`;
        })
        .sort((left, right) => left.localeCompare(right));
      verifyDirectorySnapshot(stageIdentity);
      verifyDirectorySnapshot(resultsIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate only canonical wh-review result records. */
    listCanonicalReviewResultRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const reviewsRoot = resolve(realTaskPath, "reviews");
      const resultsRoot = resolve(reviewsRoot, "results");
      assertInside(realTaskPath, reviewsRoot, "reviews directory");
      assertInside(realTaskPath, resultsRoot, "review results directory");
      if (!existsSync(resultsRoot)) return [];
      const reviewsIdentity = directorySnapshot(realTaskPath, reviewsRoot);
      const resultsIdentity = directorySnapshot(realTaskPath, resultsRoot);
      const refs = readdirSync(resultsRoot, { withFileTypes: true })
        .filter((entry) => entry.name.endsWith(".json"))
        .map((entry) => {
          const candidate = resolve(resultsRoot, entry.name);
          const stat = lstatSync(candidate);
          if (!entry.isFile() || stat.isSymbolicLink() || !stat.isFile() || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(entry.name)) {
            throw new Error(`canonical review result must be a regular non-symlink JSON file: ${entry.name}`);
          }
          return `reviews/results/${entry.name}`;
        })
        .sort((left, right) => left.localeCompare(right));
      verifyDirectorySnapshot(resultsIdentity);
      verifyDirectorySnapshot(reviewsIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate only content-addressed Phase map traces; this is not a generic evidence walk. */
    listCanonicalPhaseMapTraceRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const evidenceRoot = resolve(realTaskPath, "evidence");
      const phasesRoot = resolve(evidenceRoot, "phases");
      assertInside(realTaskPath, evidenceRoot, "evidence directory");
      assertInside(realTaskPath, phasesRoot, "Phase evidence directory");
      if (!existsSync(phasesRoot)) return [];
      const evidenceIdentity = directorySnapshot(realTaskPath, evidenceRoot);
      const phasesIdentity = directorySnapshot(realTaskPath, phasesRoot);
      const identities = [];
      const refs = [];
      for (const phaseEntry of readdirSync(phasesRoot, { withFileTypes: true })) {
        if (!/^[A-Za-z0-9._-]+$/.test(phaseEntry.name)) throw new Error(`Phase trace namespace has an invalid phase directory: ${phaseEntry.name}`);
        const phaseRoot = resolve(phasesRoot, phaseEntry.name);
        const phaseStat = lstatSync(phaseRoot);
        if (!phaseEntry.isDirectory() || phaseStat.isSymbolicLink() || !phaseStat.isDirectory()) {
          throw new Error(`Phase trace namespace must use real phase directories: ${phaseEntry.name}`);
        }
        const phaseIdentity = directorySnapshot(realTaskPath, phaseRoot);
        identities.push(phaseIdentity);
        for (const snapshotEntry of readdirSync(phaseRoot, { withFileTypes: true })) {
          if (!/^[a-f0-9]{40,64}$/.test(snapshotEntry.name)) throw new Error(`Phase trace namespace has an invalid snapshot directory: ${snapshotEntry.name}`);
          const snapshotRoot = resolve(phaseRoot, snapshotEntry.name);
          const snapshotStat = lstatSync(snapshotRoot);
          if (!snapshotEntry.isDirectory() || snapshotStat.isSymbolicLink() || !snapshotStat.isDirectory()) {
            throw new Error(`Phase trace namespace must use real snapshot directories: ${snapshotEntry.name}`);
          }
          const snapshotIdentity = directorySnapshot(realTaskPath, snapshotRoot);
          identities.push(snapshotIdentity);
          for (const traceEntry of readdirSync(snapshotRoot, { withFileTypes: true })) {
            const trace = /^phase-map-trace-[a-f0-9]{64}\.json$/.test(traceEntry.name);
            const supporting = /^(?:phase-evidence|diff-scan)-[a-f0-9]{64}\.json$/.test(traceEntry.name);
            if (!trace && !supporting) {
              throw new Error(`Phase trace namespace has an invalid trace record: ${traceEntry.name}`);
            }
            const tracePath = resolve(snapshotRoot, traceEntry.name);
            const traceStat = lstatSync(tracePath);
            if (!traceEntry.isFile() || traceStat.isSymbolicLink() || !traceStat.isFile()) {
              throw new Error(`Phase trace must be a regular non-symlink JSON file: ${traceEntry.name}`);
            }
            if (trace) refs.push(`evidence/phases/${phaseEntry.name}/${snapshotEntry.name}/${traceEntry.name}`);
          }
        }
      }
      refs.sort((left, right) => left.localeCompare(right));
      for (const identity of identities) verifyDirectorySnapshot(identity);
      verifyDirectorySnapshot(phasesIdentity);
      verifyDirectorySnapshot(evidenceIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate external wh-review audit records. They are never stage receipts. */
    listCanonicalReviewResolutionRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const reviewsRoot = resolve(realTaskPath, "reviews");
      const resolutionsRoot = resolve(reviewsRoot, "resolutions");
      assertInside(realTaskPath, reviewsRoot, "reviews directory");
      assertInside(realTaskPath, resolutionsRoot, "review resolutions directory");
      if (!existsSync(resolutionsRoot)) return [];
      const reviewsIdentity = directorySnapshot(realTaskPath, reviewsRoot);
      const resolutionsIdentity = directorySnapshot(realTaskPath, resolutionsRoot);
      const refs = readdirSync(resolutionsRoot, { withFileTypes: true })
        .filter((entry) => entry.name.endsWith(".json"))
        .map((entry) => {
          const candidate = resolve(resolutionsRoot, entry.name);
          const stat = lstatSync(candidate);
          if (!entry.isFile() || stat.isSymbolicLink() || !stat.isFile() || !/^[a-f0-9]{64}\.json$/.test(entry.name)) {
            throw new Error(`canonical review resolution must be a regular SHA-256 JSON file: ${entry.name}`);
          }
          return `reviews/resolutions/${entry.name}`;
        })
        .sort((left, right) => left.localeCompare(right));
      verifyDirectorySnapshot(resolutionsIdentity);
      verifyDirectorySnapshot(reviewsIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate only canonical wh-review attempt envelopes. */
    listCanonicalReviewAttemptRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const reviewsRoot = resolve(realTaskPath, "reviews");
      const attemptsRoot = resolve(reviewsRoot, "attempts");
      assertInside(realTaskPath, reviewsRoot, "reviews directory");
      assertInside(realTaskPath, attemptsRoot, "review attempts directory");
      if (!existsSync(attemptsRoot)) return [];
      const reviewsIdentity = directorySnapshot(realTaskPath, reviewsRoot);
      const attemptsIdentity = directorySnapshot(realTaskPath, attemptsRoot);
      const attemptIdentities = [];
      const refs = readdirSync(attemptsRoot, { withFileTypes: true })
        .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entry.name))
        .map((entry) => {
          const attemptRoot = resolve(attemptsRoot, entry.name);
          const stat = lstatSync(attemptRoot);
          if (!entry.isDirectory() || stat.isSymbolicLink() || !stat.isDirectory()) {
            throw new Error(`canonical review attempt must be a real directory: ${entry.name}`);
          }
          const identity = directorySnapshot(realTaskPath, attemptRoot);
          attemptIdentities.push(identity);
          const candidate = resolve(attemptRoot, "attempt.json");
          const candidateStat = lstatSync(candidate);
          if (candidateStat.isSymbolicLink() || !candidateStat.isFile()) {
            throw new Error(`canonical review attempt must be a regular non-symlink JSON file: ${entry.name}/attempt.json`);
          }
          return `reviews/attempts/${entry.name}/attempt.json`;
        })
        .sort((left, right) => left.localeCompare(right));
      for (const identity of attemptIdentities) verifyDirectorySnapshot(identity);
      verifyDirectorySnapshot(attemptsIdentity);
      verifyDirectorySnapshot(reviewsIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    writeRecordAtomic(relativePath, data, options) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      assertPublicRecordWritable(relativePath);
      const result = writeAtomicAt(realTaskPath, relativePath, data, options);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return result;
    },
    createRecordAtomic(relativePath, data, options) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      assertPublicRecordWritable(relativePath);
      const result = createOnlyAt(realTaskPath, relativePath, data, options);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return result;
    },
    // Internal publication authority. Stage code receives TaskHandle but must
    // publish canonical attempts/accepted records only through TaskKernel.
    withRecordLock(relativePath, operation, options) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const result = withRecordLockAt(realTaskPath, relativePath, operation, options);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return result;
    },
    appendJournal(event) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      assertPlainObject(event, "journal event");
      const { candidate, parent } = resolveRecord(realTaskPath, "journal.jsonl", { createParents: true });
      const ancestorSnapshot = directorySnapshot(realTaskPath, parent);
      const fd = openSync(candidate, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | NOFOLLOW, 0o600);
      try {
        if (!fstatSync(fd).isFile()) throw new Error(`journal must be a regular file: ${candidate}`);
        assertOpenedPath(fd, candidate, realTaskPath, "journal");
        writeSync(fd, `${JSON.stringify(event)}\n`, null, "utf8");
        fsyncSync(fd);
      } finally { closeSync(fd); }
      fsyncDirectory(parent);
      verifyDirectorySnapshot(ancestorSnapshot);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
    },
  };
  TASK_HANDLES.add(handle);
  const frozen = Object.freeze(handle);
  CANONICAL_RECORD_WRITERS.set(frozen, (relativePath, data, options) => {
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    if (!/^(?:(?:results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/(?:attempt-[0-9]{4}|accepted(?:-attempt-[0-9]{4}(?:-canonical-[a-f0-9]{64})?)?)|results\/build-code\/revisions\/reopen-[0-9]{4}|confirmations\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/attempt-[0-9]{4})\.json|(?:receipts|reviews|evidence)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*)$/.test(relativePath) || relativePath.includes("..")) throw new Error("kernel record path required");
    const result = createOnlyAt(realTaskPath, relativePath, data, options);
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    return result;
  });
  CANONICAL_ACCEPTED_REPLACERS.set(frozen, (relativePath, data, options) => {
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    if (!new Set(["results/build-code/accepted.json", "results/verify-code/accepted.json"]).has(relativePath)) {
      throw new Error("only controlled build-code or verify-code canonical accepted records may be replaced");
    }
    if (relativePath === "results/verify-code/accepted.json" && (typeof options?.validator !== "function" || typeof options?.expectedPriorRaw !== "string")) {
      throw new Error("verify-code canonical accepted replacement requires validator and prior record binding");
    }
    const { candidate } = resolveRecord(realTaskPath, relativePath);
    const prior = readRegularFileNoFollow(candidate, "canonical accepted record", taskRootIdentity.real);
    if (options?.expectedPriorRaw !== undefined && options.expectedPriorRaw !== prior) {
      throw new Error("canonical accepted replacement prior record binding mismatch");
    }
    const stage = relativePath.split("/")[1];
    if (typeof options?.archiveRef !== "string" || !new RegExp(`^results/${stage}/accepted-attempt-[0-9]{4}(?:-canonical-[a-f0-9]{64})?\\.json$`).test(options.archiveRef)) {
      throw new Error("canonical accepted replacement archive path is invalid");
    }
    if (options.archiveRaw !== prior) throw new Error("canonical accepted replacement archive does not match the prior record");
    const { candidate: archiveCandidate, parent: archiveParent } = resolveRecord(realTaskPath, options.archiveRef);
    const archiveExisted = existsSync(archiveCandidate);
    if (archiveExisted && readRegularFileNoFollow(archiveCandidate, "canonical accepted archive", taskRootIdentity.real) !== prior) {
      throw new Error("canonical accepted replacement archive conflicts with the prior record");
    }
    let result;
    try {
      result = writeAtomicAt(realTaskPath, relativePath, data, options);
      if (!archiveExisted) createOnlyAt(realTaskPath, options.archiveRef, options.archiveRaw);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
    } catch (error) {
      let current;
      try { current = readRegularFileNoFollow(candidate, "canonical accepted record", taskRootIdentity.real); }
      catch (readError) { if (readError?.code !== "ENOENT") throw readError; }
      try {
        if (current !== prior) writeAtomicAt(realTaskPath, relativePath, prior);
        if (readRegularFileNoFollow(candidate, "canonical accepted record", taskRootIdentity.real) !== prior) {
          throw new Error("canonical accepted rollback verification failed");
        }
      } catch (rollbackError) {
        throw new Error("canonical accepted replacement failed and rollback did not restore the prior record", { cause: rollbackError });
      }
      if (!archiveExisted && existsSync(archiveCandidate)) {
        const archiveCurrent = readRegularFileNoFollow(archiveCandidate, "canonical accepted rollback archive", taskRootIdentity.real);
        if (archiveCurrent === prior) {
          unlinkSync(archiveCandidate);
          fsyncDirectory(archiveParent);
        }
      }
      throw error;
    }
    return result;
  });
  TARGET_REPO_ROOT_MIGRATORS.set(frozen, ({ recordRef, recordRaw, manifestRaw, testHooks } = {}) => {
    if (!TARGET_REPO_ROOT_MIGRATION_REF.test(recordRef ?? "")) throw new Error("target repository migration record path is invalid");
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    try { createOnlyAt(realTaskPath, recordRef, recordRaw); }
    catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (readRegularFileNoFollow(resolveRecord(realTaskPath, recordRef).candidate, "target repository migration", taskRootIdentity.real) !== recordRaw) throw new Error("target repository migration conflicts with immutable record");
    }
    testHooks?.beforeManifestReplace?.();
    writeAtomicAt(realTaskPath, "task.json", manifestRaw);
    verifyDirectoryIdentity(taskRootIdentity, "task root");
  });
  RUNNER_ROOT_MIGRATORS.set(frozen, ({ recordRef, recordRaw, previousManifestRaw, manifestRaw, revalidate, testHooks } = {}) => {
    if (!RUNNER_ROOT_MIGRATION_REF.test(recordRef ?? "")) throw new Error("runner root migration record path is invalid");
    if (typeof revalidate !== "function") throw new TypeError("runner root migration revalidator is required");
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    try { createOnlyAt(realTaskPath, recordRef, recordRaw); }
    catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (readRegularFileNoFollow(resolveRecord(realTaskPath, recordRef).candidate, "runner root migration", taskRootIdentity.real) !== recordRaw) {
        throw new Error("runner root migration conflicts with immutable record");
      }
    }
    testHooks?.beforeManifestReplace?.();
    const atomicHooks = {
      ...testHooks,
      afterRevalidateBeforeRename() {
        testHooks?.afterRevalidateBeforeRename?.();
        revalidate();
      },
    };
    try {
      writeAtomicAt(realTaskPath, "task.json", manifestRaw, {
        expectedPriorRaw: previousManifestRaw,
        validator: () => revalidate(),
        testHooks: atomicHooks,
      });
      verifyDirectoryIdentity(taskRootIdentity, "task root");
    } catch (error) {
      let current;
      try { current = readRegularFileNoFollow(resolve(realTaskPath, "task.json"), "task manifest", realTaskPath); }
      catch (readError) { throw new Error("runner root migration failed and task manifest could not be read", { cause: readError }); }
      if (current === manifestRaw) {
        try {
          writeAtomicAt(realTaskPath, "task.json", previousManifestRaw, {
            expectedPriorRaw: manifestRaw,
            validator: () => {},
          });
        } catch (rollbackError) {
          throw new Error("runner root migration failed and rollback did not restore the previous manifest", { cause: rollbackError });
        }
      }
      const restored = readRegularFileNoFollow(resolve(realTaskPath, "task.json"), "task manifest", realTaskPath);
      if (restored !== previousManifestRaw) throw new Error("runner root migration failure left task manifest changed", { cause: error });
      throw error;
    }
  });
  return frozen;
}

/** Create and atomically publish a complete task directory under a trusted storage root. */
export function createTask({ storageRoot, taskPath, manifest, testHooks } = {}) {
  if (manifest && (Object.prototype.hasOwnProperty.call(manifest, "runner_root") || Object.prototype.hasOwnProperty.call(manifest, "runner_oid") || Object.prototype.hasOwnProperty.call(manifest, "runner_root_migration"))) {
    throw new TypeError("createTask cannot set runner_root; use controlled runner migration for an existing task");
  }
  const identity = validateManifest(manifest);
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("storageRoot must be absolute");
  assertNoSymlinkChain(storageRoot, "storageRoot");
  const root = realDirectoryNoSymlink(resolve(storageRoot), "storageRoot");
  const derived = deriveTaskPath(root, identity.projectName, identity.taskId);
  if (taskPath !== undefined && resolve(taskPath) !== derived) throw new Error(`taskPath does not match trusted storageRoot: ${taskPath}`);
  const parent = ensureChildDirectories(root, ["Projects", identity.projectName, "tasks"]);
  if (existsSync(derived)) throw new Error(`task already exists: ${derived}`);
  publishTaskDirectory(parent, derived, manifest, testHooks);
  return openTask(derived, identity);
}

/** Open a task after path, expected identity, and manifest agree. */
export function openTask(taskPath, expected, expectedTaskId) {
  const wanted = expectedIdentity(expected, expectedTaskId);
  const normalized = assertTaskPathShape(taskPath, wanted.projectName, wanted.taskId);
  const realTaskPath = realDirectoryNoSymlink(normalized, "taskPath");
  assertTaskPathShape(realTaskPath, wanted.projectName, wanted.taskId);
  let manifest;
  let manifestRaw;
  try {
    manifestRaw = readRegularFileNoFollow(resolve(realTaskPath, "task.json"), "task manifest", realTaskPath);
    manifest = JSON.parse(manifestRaw);
  }
  catch (error) { throw new Error(`invalid task manifest ${realTaskPath}/task.json: ${error.message}`); }
  const actual = validateManifest(manifest);
  if (actual.projectName !== wanted.projectName || actual.taskId !== wanted.taskId) {
    throw new Error(`task identity mismatch: expected ${wanted.projectName}/${wanted.taskId}, manifest has ${actual.projectName}/${actual.taskId}`);
  }
  const handle = makeTaskHandle(realTaskPath, manifest);
  validateTargetRepoRootMigration(handle, manifest);
  validateRunnerRootMigration(handle, manifest, manifestRaw);
  return handle;
}

/** Atomically rebind one task to a checked-out branch in the same Git repository. */
export function migrateTaskTargetRepoRoot({ taskPath, projectName, taskId, targetRepoRoot, targetBranch, now = () => new Date().toISOString(), testHooks } = {}) {
  if (typeof targetBranch !== "string" || targetBranch.trim() === "" || /[\0\r\n\t]/.test(targetBranch)) throw new TypeError("target branch is required");
  if (typeof now !== "function") throw new TypeError("migration clock must be a function");
  const task = openTask(taskPath, { projectName, taskId });
  const source = gitRepository(task.manifest.target_repo_root, "current target repository");
  const target = gitCheckout(targetRepoRoot, targetBranch, "new target repository");
  if (source.common !== target.common) throw new Error("new target repository must share the current target Git common directory");
  if (source.root === target.root) {
    const pointer = task.manifest.target_repo_root_migration;
    return Object.freeze({ task, migration_ref: pointer?.ref, integrity_hash: pointer?.integrity_hash, previous_target_repo_root: source.root, target_repo_root: target.root, target_branch: target.branch, target_head: target.head, idempotent_replay: true });
  }
  const decision = createTaskKernel(task).readAccepted("make-decision");
  if (gitRepository(decision.facts.worktree_root, "accepted make-decision worktree").common !== target.common) throw new Error("new target repository must share the accepted make-decision worktree Git common directory");
  const manifestRaw = task.readRecord("task.json");
  const oldManifest = JSON.parse(manifestRaw);
  const prior = oldManifest.target_repo_root_migration;
  const recordRef = `identity/migrations/target-repo-root/${sha256(`${sha256(manifestRaw)}\0${target.root}`)}.json`;
  return task.withRecordLock("locks/task-identity-migration.lock", () => {
    const record = {
      schema_version: "task-target-repo-root-migration.v1",
      project_name: task.identity.projectName,
      task_id: task.identity.taskId,
      previous_target_repo_root: source.root,
      previous_manifest_hash: sha256(manifestRaw),
      ...(prior ? { previous_migration_ref: prior.ref, previous_migration_hash: prior.integrity_hash } : {}),
      target_repo_root: target.root,
      target_git_common_dir: target.common,
      target_branch: target.branch,
      target_head: target.head,
      migrated_at: now(),
    };
    let recordRaw = `${JSON.stringify(record, null, 2)}\n`;
    try {
      const existing = task.readRecord(recordRef);
      const replay = JSON.parse(existing);
      const comparable = { ...record }; delete comparable.migrated_at;
      const existingComparable = { ...replay }; delete existingComparable.migrated_at;
      if (JSON.stringify(existingComparable) !== JSON.stringify(comparable)) throw new Error("target repository migration conflicts with immutable record");
      recordRaw = existing;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const nextManifest = { ...oldManifest, target_repo_root: target.root, target_repo_root_migration: { ref: recordRef, integrity_hash: sha256(recordRaw) } };
    const nextManifestRaw = `${JSON.stringify(nextManifest, null, 2)}\n`;
    const migrator = TARGET_REPO_ROOT_MIGRATORS.get(task);
    if (typeof migrator !== "function") throw new TypeError("authentic TaskHandle target repository migrator required");
    migrator({ recordRef, recordRaw, manifestRaw: nextManifestRaw, testHooks });
    const migrated = openTask(task.taskPath, task.identity);
    return Object.freeze({ task: migrated, migration_ref: recordRef, integrity_hash: sha256(recordRaw), previous_target_repo_root: source.root, target_repo_root: target.root, target_branch: target.branch, target_head: target.head });
  });
}

/** One-shot migration that binds an existing task to one explicit runner root. */
export function migrateTaskRunnerRoot({ taskPath, projectName, taskId, runnerRoot, stage, testHooks } = {}) {
  const task = openTask(taskPath, { projectName, taskId });
  const identity = inspectRunnerIdentity({
    runnerRoot,
    projectName: task.identity.projectName,
    taskId: task.identity.taskId,
    stage,
  });
  if (task.manifest.runner_root !== undefined) {
    const record = JSON.parse(task.readRecord(task.manifest.runner_root_migration.ref));
    if (task.manifest.runner_root !== identity.runner_root || task.manifest.runner_oid !== identity.runner_oid || JSON.stringify(record.runner_identity) !== JSON.stringify(identity)) {
      throw new Error("task runner_root is already bound to a different runner identity");
    }
    return Object.freeze({
      task,
      migration_ref: task.manifest.runner_root_migration.ref,
      runner_identity: identity,
      idempotent_replay: true,
    });
  }
  const previousManifestRaw = task.readRecord("task.json");
  const previousManifestHash = sha256(previousManifestRaw);
  const recordRef = runnerMigrationRef(previousManifestHash, identity);
  return task.withRecordLock("locks/task-identity-migration.lock", () => {
    const freshPreviousRaw = task.readRecord("task.json");
    if (freshPreviousRaw !== previousManifestRaw) throw new Error("task manifest changed before runner root migration");
    const nextManifest = {
      ...task.manifest,
      runner_root: identity.runner_root,
      runner_oid: identity.runner_oid,
      runner_root_migration: { ref: recordRef },
    };
    const nextManifestRaw = `${JSON.stringify(nextManifest, null, 2)}\n`;
    const record = {
      schema_version: "task-runner-root-migration.v1",
      project_name: task.identity.projectName,
      task_id: task.identity.taskId,
      previous_manifest_hash: previousManifestHash,
      new_manifest_hash: sha256(nextManifestRaw),
      runner_identity: identity,
    };
    let recordRaw = `${JSON.stringify(record, null, 2)}\n`;
    try {
      const existingRaw = task.readRecord(recordRef);
      const existing = JSON.parse(existingRaw);
      if (JSON.stringify(existing) !== JSON.stringify(record)) throw new Error("runner root migration conflicts with immutable record");
      recordRaw = existingRaw;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const revalidate = () => {
      const actual = inspectRunnerIdentity({
        runnerRoot: identity.runner_root,
        projectName: task.identity.projectName,
        taskId: task.identity.taskId,
        stage: identity.stage,
      });
      if (JSON.stringify(actual) !== JSON.stringify(identity)) throw new Error("runner identity changed during migration");
    };
    const migrator = RUNNER_ROOT_MIGRATORS.get(task);
    if (typeof migrator !== "function") throw new TypeError("authentic TaskHandle runner root migrator required");
    migrator({ recordRef, recordRaw, previousManifestRaw, manifestRaw: nextManifestRaw, revalidate, testHooks });
    const migrated = openTask(task.taskPath, task.identity);
    return Object.freeze({ task: migrated, migration_ref: recordRef, runner_identity: identity, idempotent_replay: false });
  });
}

/** Create the only canonical publication capability for an authentic task. */
export function createTaskKernel(taskHandle, options) {
  const kernel = buildTaskKernel(taskHandle, options, Object.freeze({
    assertTaskHandle,
    openTask,
    createKernelRecordFor(task) {
      assertTaskHandle(task);
      const writer = CANONICAL_RECORD_WRITERS.get(task);
      if (typeof writer !== "function") throw new TypeError("authentic TaskHandle canonical writer required");
      return writer;
    },
    replaceKernelAcceptedFor(task) {
      assertTaskHandle(task);
      const replacer = CANONICAL_ACCEPTED_REPLACERS.get(task);
      if (typeof replacer !== "function") throw new TypeError("authentic TaskHandle accepted-record replacer required");
      return replacer;
    },
  }));
  TASK_KERNELS.add(kernel);
  return Object.freeze(kernel);
}
