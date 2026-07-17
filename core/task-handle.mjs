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
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

import { deriveTaskPath, validateProjectName, validateTaskId } from "./task-identity.mjs";
import { buildTaskKernel } from "./task-kernel-implementation.mjs";

const FORBIDDEN_MANIFEST_FIELDS = new Set([
  "status", "stage_map", "updated_at", "lock", "worktree", "worktree_root",
]);
const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const TASK_HANDLES = new WeakSet();
const TASK_KERNELS = new WeakSet();
const CANONICAL_RECORD_WRITERS = new WeakMap();
const CREATE_CLAIM_MAX_AGE_MS = 15 * 60 * 1000;
const RECORD_LOCK_WAIT_MS = 10_000;

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
  if (manifest.schema_id === "https://workflowhub.dev/schemas/task-manifest.v1.schema.json") {
    for (const field of ["target_repository_ref", "release_manifest_ref"]) {
      if (typeof manifest[field] !== "string" || manifest[field].length === 0) throw new TypeError(`task manifest ${field} is required`);
    }
    if (!/^[a-f0-9]{64}$/.test(manifest.release_manifest_hash)) throw new TypeError("task manifest release_manifest_hash must be SHA-256");
    if (Object.prototype.hasOwnProperty.call(manifest, "target_repo_root")) throw new TypeError("task manifest must not serialize target_repo_root");
    if (manifest.inputs !== undefined) {
      assertPlainObject(manifest.inputs, "task manifest inputs");
      for (const value of Object.values(manifest.inputs)) {
        assertPlainObject(value, "task manifest input ref");
        if (typeof value.ref !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256) || Object.keys(value).some((key) => !["ref", "sha256"].includes(key))) throw new TypeError("task manifest inputs must contain canonical ref/hash pairs");
      }
    }
    for (const field of ["issue_ids"]) if (Object.prototype.hasOwnProperty.call(manifest, field)) throw new TypeError(`task manifest v1 must not contain ${field}`);
    return { projectName, taskId };
  }
  if (typeof manifest.target_repo_root !== "string" || !isAbsolute(manifest.target_repo_root)) throw new TypeError("task manifest target_repo_root must be an absolute path");
  if (!Array.isArray(manifest.issue_ids) || !manifest.issue_ids.every((id) => typeof id === "string" && id.trim() !== "")) {
    throw new TypeError("task manifest issue_ids must be an array of non-empty strings");
  }
  assertPlainObject(manifest.inputs, "task manifest inputs");
  for (const field of FORBIDDEN_MANIFEST_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest, field)) throw new TypeError(`task manifest must not contain mutable field: ${field}`);
  }
  return { projectName, taskId };
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
    else mkdirSync(cursor);
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

function withRecordLockAt(taskRoot, relativePath, operation) {
  if (typeof operation !== "function") throw new TypeError("record lock operation must be a function");
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
      if (Date.now() - started >= RECORD_LOCK_WAIT_MS) throw new Error(`timed out waiting for record lock: ${relativePath}`);
      waitBriefly();
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
  if (relativePath === "task.json" || /^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/(?:attempt-[0-9]{4}|accepted)\.json$/.test(relativePath) || /^confirmations\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/attempt-[0-9]{4}\.json$/.test(relativePath)) {
    throw new Error(`record is kernel-owned and cannot be written through TaskHandle: ${relativePath}`);
  }
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

function writeAtomicAt(taskRoot, relativePath, data, { encoding = "utf8", mode = 0o600, testHooks } = {}) {
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
    fsyncSync(fd);
    closeSync(fd); fd = undefined;
    testHooks?.afterOpenBeforeRename?.();
    verifyDirectorySnapshot(ancestorSnapshot);
    renameSync(temporary, candidate);
    fsyncDirectory(parent);
    verifyDirectorySnapshot(ancestorSnapshot);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) rmSync(temporary, { force: true });
    if (openedTemporary && openedTemporary !== temporary && existsSync(openedTemporary)) rmSync(openedTemporary, { force: true });
  }
  return candidate;
}

function createOnlyAt(taskRoot, relativePath, data, { encoding = "utf8", mode = 0o600 } = {}) {
  const { candidate, parent } = resolveRecord(taskRoot, relativePath, { createParents: true });
  const ancestorSnapshot = directorySnapshot(taskRoot, parent);
  const temporary = resolve(parent, `.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, mode);
    assertOpenedPath(fd, temporary, ancestorSnapshot[0].real, "create-only temporary");
    writeFileSync(fd, data, { encoding });
    fsyncSync(fd);
    closeSync(fd); fd = undefined;
    verifyDirectorySnapshot(ancestorSnapshot);
    linkSync(temporary, candidate);
    fsyncDirectory(parent);
    verifyDirectorySnapshot(ancestorSnapshot);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return candidate;
}

function publishTaskDirectory(parent, taskPath, taskId, prepareManifest, testHooks) {
  const nonce = randomUUID();
  const temporary = resolve(parent, `.${taskId}.${nonce}.tmp`);
  const claimPath = resolve(parent, `.${taskId}.create.lock`);
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
    const manifest = prepareManifest();
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
    withRecordLock(relativePath, operation) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const result = withRecordLockAt(realTaskPath, relativePath, operation);
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
    if (!/^(?:(?:results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/(?:attempt-[0-9]{4}|accepted)|confirmations\/(?:(?:make-decision|build-spec|build-plan|build-code|verify-code)\/attempt-[0-9]{4}|source-events\/[a-f0-9]{64}))\.json|(?:receipts|reviews|evidence|snapshots)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*)$/.test(relativePath) || relativePath.includes("..")) throw new Error("kernel record path required");
    const result = createOnlyAt(realTaskPath, relativePath, data, options);
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    return result;
  });
  return frozen;
}

/** Create and atomically publish a complete task directory under a trusted storage root. */
export function createTask({ storageRoot, taskPath, manifest, testHooks } = {}) {
  const identity = validateManifest(manifest);
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("storageRoot must be absolute");
  assertNoSymlinkChain(storageRoot, "storageRoot");
  const root = realDirectoryNoSymlink(resolve(storageRoot), "storageRoot");
  const derived = deriveTaskPath(root, identity.projectName, identity.taskId);
  if (taskPath !== undefined && resolve(taskPath) !== derived) throw new Error(`taskPath does not match trusted storageRoot: ${taskPath}`);
  const parent = ensureChildDirectories(root, ["Projects", identity.projectName, "tasks"]);
  if (existsSync(derived)) throw new Error(`task already exists: ${derived}`);
  const prepareManifest = () => manifest;
  publishTaskDirectory(parent, derived, identity.taskId, prepareManifest, testHooks);
  return openTask(derived, identity);
}

/** Prepare the immutable manifest while the task create lock is held. */
export function createTaskUnderLock({ storageRoot, projectName, taskId, prepareManifest, testHooks } = {}) {
  const identity = { projectName: validateProjectName(projectName), taskId: validateTaskId(taskId) };
  if (typeof prepareManifest !== "function") throw new TypeError("prepareManifest function is required");
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("storageRoot must be absolute");
  assertNoSymlinkChain(storageRoot, "storageRoot");
  const root = realDirectoryNoSymlink(resolve(storageRoot), "storageRoot");
  const derived = deriveTaskPath(root, identity.projectName, identity.taskId);
  const parent = ensureChildDirectories(root, ["Projects", identity.projectName, "tasks"]);
  if (existsSync(derived)) throw new Error(`task already exists: ${derived}`);
  const lockedPrepare = () => {
    const manifest = prepareManifest();
    const actual = validateManifest(manifest);
    if (actual.projectName !== identity.projectName || actual.taskId !== identity.taskId) throw new Error("prepared task manifest identity mismatch");
    return manifest;
  };
  publishTaskDirectory(parent, derived, identity.taskId, lockedPrepare, testHooks);
  return openTask(derived, identity.projectName, identity.taskId);
}

/** Open a task after path, expected identity, and manifest agree. */
export function openTask(taskPath, expected, expectedTaskId) {
  const wanted = expectedIdentity(expected, expectedTaskId);
  const normalized = assertTaskPathShape(taskPath, wanted.projectName, wanted.taskId);
  const realTaskPath = realDirectoryNoSymlink(normalized, "taskPath");
  assertTaskPathShape(realTaskPath, wanted.projectName, wanted.taskId);
  let manifest;
  try { manifest = JSON.parse(readRegularFileNoFollow(resolve(realTaskPath, "task.json"), "task manifest", realTaskPath)); }
  catch (error) { throw new Error(`invalid task manifest ${realTaskPath}/task.json: ${error.message}`); }
  const actual = validateManifest(manifest);
  if (actual.projectName !== wanted.projectName || actual.taskId !== wanted.taskId) {
    throw new Error(`task identity mismatch: expected ${wanted.projectName}/${wanted.taskId}, manifest has ${actual.projectName}/${actual.taskId}`);
  }
  return makeTaskHandle(realTaskPath, manifest);
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
  }));
  TASK_KERNELS.add(kernel);
  return Object.freeze(kernel);
}
