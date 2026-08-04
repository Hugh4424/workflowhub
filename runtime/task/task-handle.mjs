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

import { deriveTaskPath, validateProjectName, validateTaskId } from "../task/task-identity.mjs";
import { buildTaskKernel } from "./task-kernel-implementation.mjs";
import {
  assertTaskHandle,
  assertTaskKernel,
  brandTaskHandle,
  brandTaskKernel,
} from "../../core/task-capability.mjs";
export { publishImmutable } from "../stage/publication.mjs";
export { assertTaskHandle, assertTaskKernel } from "../../core/task-capability.mjs";

const FORBIDDEN_MANIFEST_FIELDS = new Set([
  "status", "stage_map", "updated_at", "lock", "worktree", "worktree_root",
]);
const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const CANONICAL_RECORD_WRITERS = new WeakMap();
const STAGE_CONTENT_POINTER_REPLACERS = new WeakMap();
const INVOCATION_IDENTITY_WRITERS = new WeakMap();
const PATH_CARD_WRITERS = new WeakMap();
const CREATE_CLAIM_MAX_AGE_MS = 15 * 60 * 1000;
const RECORD_LOCK_WAIT_MS = 10_000;
const CANONICAL_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const LEGACY_RUNNER_MIGRATION_REF = /^identity\/migrations\/runner-root\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;

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
  if (manifest.execution_mode !== undefined && !new Set(["per_invocation", "legacy_pinned"]).has(manifest.execution_mode)) {
    throw new TypeError('task manifest execution_mode must be "per_invocation" or "legacy_pinned" when present');
  }
  const legacyRunnerFields = ["runner_root", "runner_oid", "runner_root_migration"];
  const presentLegacyRunnerFields = legacyRunnerFields.filter((field) => Object.prototype.hasOwnProperty.call(manifest, field));
  if (presentLegacyRunnerFields.length > 0) {
    if (manifest.execution_mode === "per_invocation") {
      throw new TypeError("per_invocation task manifest must not contain legacy runner fields");
    }
    if (presentLegacyRunnerFields.length !== legacyRunnerFields.length) {
      throw new TypeError("legacy runner_root, runner_oid, and runner_root_migration must be present together");
    }
    if (typeof manifest.runner_root !== "string" || !isAbsolute(manifest.runner_root)) {
      throw new TypeError("legacy runner_root must be an absolute path");
    }
    if (!/^[a-f0-9]{40}$/.test(manifest.runner_oid)) {
      throw new TypeError("legacy runner_oid must be a full Git commit OID");
    }
    assertPlainObject(manifest.runner_root_migration, "legacy runner_root_migration");
    if (Object.keys(manifest.runner_root_migration).some((key) => key !== "ref")
        || !LEGACY_RUNNER_MIGRATION_REF.test(manifest.runner_root_migration.ref ?? "")) {
      throw new TypeError("legacy runner_root_migration must contain one safe migration ref");
    }
  }
  if (manifest.record_model !== "vnext-single-write") {
    throw new TypeError('task manifest record_model must be "vnext-single-write"');
  }
  for (const field of FORBIDDEN_MANIFEST_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest, field)) throw new TypeError(`task manifest must not contain mutable field: ${field}`);
  }
  return { projectName, taskId };
}

function sha256(raw) { return createHash("sha256").update(raw).digest("hex"); }

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
    if (stat.isSymbolicLink()) {
      // macOS exposes the system temporary directory as /tmp -> /private/tmp.
      // Normalize that fixed platform alias without weakening the no-symlink
      // rule for caller-controlled storage paths.
      if (cursor === "/tmp" && realpathSync(cursor) === "/private/tmp") continue;
      throw new Error(`${label} contains a symlink: ${cursor}`);
    }
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
  if (/^runs\//.test(relativePath)) throw new Error(`record is kernel-owned and cannot be written through TaskHandle: ${relativePath}`);
  if (relativePath === "task.json") {
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
    testHooks?.afterTemporaryWrite?.();
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
    testHooks?.afterTemporaryWrite?.();
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
      return Object.freeze([]);
    },
    /** Enumerate only canonical wh-review result records. */
    listCanonicalReviewResultRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const reviewRootRef = "quality/reviews";
      const reviewsRoot = resolve(realTaskPath, ...reviewRootRef.split("/"));
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
          return `${reviewRootRef}/results/${entry.name}`;
        })
        .sort((left, right) => left.localeCompare(right));
      verifyDirectorySnapshot(resultsIdentity);
      verifyDirectorySnapshot(reviewsIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate immutable vNext quality facts without exposing storage paths. */
    listCanonicalQualityFactRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const qualityRoot = resolve(realTaskPath, "quality");
      const factsRoot = resolve(qualityRoot, "facts");
      assertInside(realTaskPath, qualityRoot, "quality directory");
      assertInside(realTaskPath, factsRoot, "quality facts directory");
      if (!existsSync(factsRoot)) return Object.freeze([]);
      const qualityIdentity = directorySnapshot(realTaskPath, qualityRoot);
      const factsIdentity = directorySnapshot(realTaskPath, factsRoot);
      const refs = readdirSync(factsRoot, { withFileTypes: true })
        .filter((entry) => /^[a-f0-9]{64}\.json$/.test(entry.name))
        .map((entry) => {
          const candidate = resolve(factsRoot, entry.name);
          const stat = lstatSync(candidate);
          if (!entry.isFile() || stat.isSymbolicLink() || !stat.isFile()) {
            throw new Error(`quality fact must be a regular non-symlink JSON file: ${entry.name}`);
          }
          return `quality/facts/${entry.name}`;
        })
        .sort((left, right) => left.localeCompare(right));
      verifyDirectorySnapshot(factsIdentity);
      verifyDirectorySnapshot(qualityIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate one-time irreversible authorizations; consumed markers are excluded. */
    listCanonicalAuthorizationRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const qualityRoot = resolve(realTaskPath, "quality");
      const authorizationsRoot = resolve(qualityRoot, "authorizations");
      assertInside(realTaskPath, qualityRoot, "quality directory");
      assertInside(realTaskPath, authorizationsRoot, "authorizations directory");
      if (!existsSync(authorizationsRoot)) return Object.freeze([]);
      const qualityIdentity = directorySnapshot(realTaskPath, qualityRoot);
      const authorizationsIdentity = directorySnapshot(realTaskPath, authorizationsRoot);
      const refs = readdirSync(authorizationsRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^[a-f0-9]{64}\.json$/.test(entry.name))
        .map((entry) => {
          const candidate = resolve(authorizationsRoot, entry.name);
          const stat = lstatSync(candidate);
          if (stat.isSymbolicLink() || !stat.isFile()) {
            throw new Error(`irreversible authorization must be a regular non-symlink JSON file: ${entry.name}`);
          }
          return `quality/authorizations/${entry.name}`;
        })
        .sort((left, right) => left.localeCompare(right));
      verifyDirectorySnapshot(authorizationsIdentity);
      verifyDirectorySnapshot(qualityIdentity);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return Object.freeze(refs);
    },
    /** Enumerate only canonical wh-review attempt envelopes. */
    listCanonicalReviewAttemptRefs() {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const reviewRootRef = "quality/reviews";
      const reviewsRoot = resolve(realTaskPath, ...reviewRootRef.split("/"));
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
          return `${reviewRootRef}/attempts/${entry.name}/attempt.json`;
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
    createInvocationIdentityRecord(relativePath, data) {
      const writer = INVOCATION_IDENTITY_WRITERS.get(handle);
      if (typeof writer !== "function") throw new TypeError("authentic invocation identity writer required");
      return writer(relativePath, data);
    },
    createPathCardRecord(relativePath, data) {
      const writer = PATH_CARD_WRITERS.get(handle);
      if (typeof writer !== "function") throw new TypeError("authentic path card writer required");
      return writer(relativePath, data);
    },
    // Internal publication authority. Stage code receives TaskHandle but must
    // publish canonical evidence only through TaskKernel.
    withRecordLock(relativePath, operation, options) {
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      verifyManifest();
      const result = withRecordLockAt(realTaskPath, relativePath, operation, options);
      verifyDirectoryIdentity(taskRootIdentity, "task root");
      return result;
    },
  };
  const frozen = Object.freeze(brandTaskHandle(handle));
  CANONICAL_RECORD_WRITERS.set(frozen, (relativePath, data, options) => {
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    if (!/^(?:(?:receipts|reviews|evidence|quality|publications)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*|runs\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/run-[0-9]{4}\.json)$/.test(relativePath) || relativePath.includes("..")) throw new Error("kernel record path required");
    const result = createOnlyAt(realTaskPath, relativePath, data, options);
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    return result;
  });
  INVOCATION_IDENTITY_WRITERS.set(frozen, (relativePath, data) => {
    if (!/^identity\/executions\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$/.test(relativePath ?? "")) {
      throw new Error("invocation identity path is invalid");
    }
    if (typeof data !== "string" || data.length === 0) throw new TypeError("invocation identity data is required");
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    return createOnlyAt(realTaskPath, relativePath, data);
  });
  PATH_CARD_WRITERS.set(frozen, (relativePath, data) => {
    if (!/^identity\/path-cards\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/[a-f0-9]{64}\.json$/.test(relativePath ?? "")) {
      throw new Error("path card record path is invalid");
    }
    if (typeof data !== "string" || data.length === 0) throw new TypeError("path card record data is required");
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    return createOnlyAt(realTaskPath, relativePath, data);
  });
  STAGE_CONTENT_POINTER_REPLACERS.set(frozen, (relativePath, data, options = {}) => {
    verifyDirectoryIdentity(taskRootIdentity, "task root");
    verifyManifest();
    if (!/^evidence\/stage-content\/[a-f0-9]{64}\/[a-z0-9][a-z0-9.-]*\.latest\.json$/.test(relativePath ?? "")) {
      throw new Error("stage content latest pointer path is invalid");
    }
    if (typeof options.validator !== "function" || typeof options.expectedPriorRaw !== "string") {
      throw new Error("stage content latest pointer replacement requires CAS binding");
    }
    return writeAtomicAt(realTaskPath, relativePath, data, options);
  });
  return frozen;
}

/** Create and atomically publish a complete task directory under a trusted storage root. */
export function createTask({ storageRoot, taskPath, manifest, testHooks } = {}) {
  if (manifest && (Object.prototype.hasOwnProperty.call(manifest, "runner_root") || Object.prototype.hasOwnProperty.call(manifest, "runner_oid") || Object.prototype.hasOwnProperty.call(manifest, "runner_root_migration"))) {
    throw new TypeError("createTask cannot pin legacy runner identity");
  }
  const normalizedManifest = manifest && typeof manifest === "object" && !Array.isArray(manifest)
    ? { ...manifest, record_model: manifest.record_model ?? "vnext-single-write" }
    : manifest;
  const identity = validateManifest(normalizedManifest);
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("storageRoot must be absolute");
  assertNoSymlinkChain(storageRoot, "storageRoot");
  const root = realDirectoryNoSymlink(resolve(storageRoot), "storageRoot");
  const derived = deriveTaskPath(root, identity.projectName, identity.taskId);
  if (taskPath !== undefined && resolve(taskPath) !== derived) throw new Error(`taskPath does not match trusted storageRoot: ${taskPath}`);
  const parent = ensureChildDirectories(root, ["Projects", identity.projectName, "tasks"]);
  if (existsSync(derived)) throw new Error(`task already exists: ${derived}`);
  publishTaskDirectory(parent, derived, normalizedManifest, testHooks);
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
  return handle;
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
    replaceStageContentPointerFor(task) {
      assertTaskHandle(task);
      const replacer = STAGE_CONTENT_POINTER_REPLACERS.get(task);
      if (typeof replacer !== "function") throw new TypeError("authentic stage content pointer replacer required");
      return replacer;
    },
  }));
  brandTaskKernel(kernel);
  return Object.freeze(kernel);
}
