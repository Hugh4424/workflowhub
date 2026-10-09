import {
  closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, mkdirSync,
  openSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

// Reuse the approved record-lock/safe-write function bodies locally: each
// narrow tool must remain a standalone single file importing only node:*.
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
const sameFile = (a, b) => a.dev === b.dev && a.ino === b.ino;
const errorWithCode = (code, message, details = {}) => Object.assign(new Error(message), { code, ...details });

function storageDirectory(dir) {
  if (typeof dir !== "string" || !dir) throw errorWithCode("INVALID_DIRECTORY", "lock directory is required");
  const absolute = resolve(dir);
  const paths = [];
  let cursor = parse(absolute).root;
  paths.push(cursor);
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    paths.push(cursor);
  }
  const snapshot = paths.map((path) => {
    const stat = lstatSync(path);
    const alias = stat.isSymbolicLink() && process.platform === "darwin"
      && ((path === "/tmp" && realpathSync(path) === "/private/tmp")
        || (path === "/var" && realpathSync(path) === "/private/var"));
    if (stat.isSymbolicLink() && !alias) throw errorWithCode("SYMLINK_TARGET", `symlinked lock directory: ${path}`);
    if (!stat.isDirectory() && !alias) throw errorWithCode("NOT_A_DIRECTORY", `not a lock directory: ${path}`);
    return { path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) };
  });
  const root = realpathSync(absolute);
  const rootIdentity = lstatSync(root);
  const verify = () => {
    for (const before of snapshot) {
      const current = lstatSync(before.path);
      if (!sameFile(current, before) || realpathSync(before.path) !== before.real) {
        throw errorWithCode("ANCESTOR_REPLACED", `lock directory ancestor replaced: ${before.path}`);
      }
    }
  };
  verify();
  return { root, rootIdentity, verify };
}

function syncDirectory(storage) {
  storage.verify();
  const fd = openSync(storage.root, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!sameFile(fstatSync(fd), storage.rootIdentity)) {
      throw errorWithCode("ANCESTOR_REPLACED", `lock directory changed: ${storage.root}`);
    }
    fsyncSync(fd);
  } finally { closeSync(fd); }
}

function readOwner(path, storage) {
  storage.verify();
  const named = lstatSync(path);
  if (named.isSymbolicLink()) throw errorWithCode("SYMLINK_TARGET", `symlinked lock: ${path}`);
  if (!named.isFile()) throw errorWithCode("LOCK_INVALID", `lock is not a regular file: ${path}`);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!sameFile(opened, named)) throw errorWithCode("LOCK_CHANGED", `lock changed while opening: ${path}`);
    const raw = readFileSync(fd, "utf8");
    const after = lstatSync(path);
    if (after.isSymbolicLink() || !sameFile(opened, after)) throw errorWithCode("LOCK_CHANGED", `lock replaced while reading: ${path}`);
    storage.verify();
    let owner;
    try { owner = JSON.parse(raw); }
    catch (cause) { throw errorWithCode("LOCK_INVALID", `invalid lock JSON: ${path}`, { cause, raw }); }
    if (!owner || !Number.isSafeInteger(owner.pid) || owner.pid <= 0
      || typeof owner.host !== "string" || !owner.host.trim()
      || typeof owner.nonce !== "string" || !owner.nonce
      || typeof owner.started_at !== "string" || !Number.isFinite(Date.parse(owner.started_at))) {
      throw errorWithCode("LOCK_INVALID", `invalid lock owner fields: ${path}`);
    }
    return { owner, identity: opened };
  } finally { closeSync(fd); }
}

function processAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

function removeObserved(path, storage, observed, releasing) {
  let current;
  try { current = readOwner(path, storage); }
  catch (error) {
    if (!releasing && (error.code === "ENOENT" || error.code === "LOCK_CHANGED")) return false;
    throw error;
  }
  if (current.owner.nonce !== observed.owner.nonce || !sameFile(current.identity, observed.identity)) {
    if (releasing) throw errorWithCode("LOCK_OWNERSHIP_CHANGED", `refusing to release another owner's lock: ${path}`);
    return false;
  }
  // Recheck immediately before removal; a fresh owner's inode/nonce may never
  // be removed merely because an earlier read described a dead process.
  storage.verify();
  const named = lstatSync(path);
  if (named.isSymbolicLink() || !sameFile(named, observed.identity)) {
    if (releasing) throw errorWithCode("LOCK_OWNERSHIP_CHANGED", `lock replaced before release: ${path}`);
    return false;
  }
  try { unlinkSync(path); }
  catch (error) { if (!releasing && error.code === "ENOENT") return false; throw error; }
  syncDirectory(storage);
  return true;
}

async function withLock(dir, name, fn, { waitMs = 2000 } = {}) {
  if (!Number.isInteger(constants.O_NOFOLLOW)) throw errorWithCode("UNSUPPORTED_PLATFORM", "O_NOFOLLOW is required for record locks");
  if (typeof name !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(name) || name.includes("..")) {
    throw errorWithCode("INVALID_LOCK_NAME", "lock name must be a simple lowercase name, without path segments");
  }
  if (typeof fn !== "function") throw errorWithCode("INVALID_CALLBACK", "lock callback must be a function");
  if (!Number.isSafeInteger(waitMs) || waitMs < 0) throw errorWithCode("INVALID_WAIT", "waitMs must be a nonnegative safe integer");
  const storage = storageDirectory(dir);
  const path = join(storage.root, `.${name}.lock`);
  const owner = { pid: process.pid, host: hostname(), started_at: new Date().toISOString(), nonce: randomUUID() };
  const started = performance.now();
  let acquired;
  while (!acquired) {
    storage.verify();
    let fd;
    try {
      fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let observed;
      try { observed = readOwner(path, storage); }
      catch (readError) {
        if (readError.code === "ENOENT" || readError.code === "LOCK_CHANGED") continue;
        // An O_EXCL creator may be descheduled before publishing its JSON.
        // Wait only within the caller's existing lock deadline; persistent
        // invalid bytes still fail explicitly rather than becoming success.
        if (readError.code !== "LOCK_INVALID" || !(readError.cause instanceof SyntaxError)) throw readError;
        const remaining = waitMs - (performance.now() - started);
        if (remaining <= 0) throw readError;
        await delay(Math.min(10, remaining));
        continue;
      }
      const sameHost = observed.owner.host.trim().toLowerCase() === owner.host.trim().toLowerCase();
      if (sameHost && !processAlive(observed.owner.pid)) {
        removeObserved(path, storage, observed, false);
        continue;
      }
      const remaining = waitMs - (performance.now() - started);
      if (remaining <= 0) throw errorWithCode("LOCK_HELD", `lock held by pid ${observed.owner.pid} on ${observed.owner.host}: ${path}`, { exitCode: 75, holder: observed.owner });
      await delay(Math.min(10, remaining));
      continue;
    }
    const identity = fstatSync(fd);
    try {
      storage.verify();
      const named = lstatSync(path);
      if (named.isSymbolicLink() || !sameFile(named, identity)) throw errorWithCode("LOCK_CHANGED", `lock changed during creation: ${path}`);
      writeFileSync(fd, `${JSON.stringify(owner)}\n`);
      fsyncSync(fd);
    } catch (error) {
      closeSync(fd);
      // Remove only this attempt's inode on a failed write; expose cleanup
      // failures together with the original error instead of hiding either.
      try {
        storage.verify();
        const named = lstatSync(path);
        if (!named.isSymbolicLink() && sameFile(named, identity)) unlinkSync(path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") throw Object.assign(new AggregateError([error, cleanupError], "lock creation and cleanup failed"), { code: "LOCK_CREATE_FAILED" });
      }
      throw error;
    }
    closeSync(fd);
    acquired = { owner, identity };
    // If directory fsync fails, release in the same finally path as a callback.
  }
  let callbackError;
  try {
    syncDirectory(storage);
    storage.verify();
    return await fn();
  } catch (error) { callbackError = error; throw error; }
  finally {
    try { removeObserved(path, storage, acquired, true); }
    catch (releaseError) {
      if (callbackError) throw Object.assign(new AggregateError([callbackError, releaseError], "callback and lock release failed"), { code: "LOCK_RELEASE_FAILED" });
      throw releaseError;
    }
  }
}

function failure(code, message) {
  return Object.assign(new Error(message), { code });
}

function sameStorageFile(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}

function inside(root, path) {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function optionalStat(path) {
  try { return lstatSync(path); }
  catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

// Only fixed macOS system aliases may be normalized; caller-owned symlinks
// anywhere in the storage ancestry are rejected before realpath is used.
function rootPath(root) {
  if (typeof root !== "string" || root.length === 0) {
    throw failure("INVALID_ROOT", "root must be a nonempty directory path");
  }
  const absolute = resolve(root);
  let cursor = parse(absolute).root;
  const ancestry = [];
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) {
      const platformAlias = process.platform === "darwin"
        && ((cursor === "/tmp" && realpathSync(cursor) === "/private/tmp")
          || (cursor === "/var" && realpathSync(cursor) === "/private/var"));
      if (!platformAlias) throw failure("SYMLINK_TARGET", `symlink in root ancestry: ${cursor}`);
    } else if (!stat.isDirectory()) {
      throw failure("NOT_A_DIRECTORY", `storage ancestor is not a directory: ${cursor}`);
    }
    ancestry.push({ path: cursor, dev: stat.dev, ino: stat.ino, real: realpathSync(cursor) });
  }
  const canonical = realpathSync(absolute);
  for (const before of ancestry) {
    if (!sameStorageFile(lstatSync(before.path), before) || realpathSync(before.path) !== before.real) {
      throw failure("ANCESTOR_REPLACED", `root ancestor changed during resolution: ${before.path}`);
    }
  }
  return canonical;
}

function directorySnapshot(parent) {
  const paths = [];
  let cursor = parse(parent).root;
  paths.push(cursor);
  for (const part of parent.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    paths.push(cursor);
  }
  return paths.map((path) => {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw failure("SYMLINK_TARGET", `symlinked directory: ${path}`);
    if (!stat.isDirectory()) throw failure("NOT_A_DIRECTORY", `not a directory: ${path}`);
    return { path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) };
  });
}

function verifyDirectories(snapshot) {
  for (const before of snapshot) {
    let stat;
    try { stat = lstatSync(before.path); }
    catch (cause) { throw Object.assign(failure("ANCESTOR_REPLACED", `directory disappeared: ${before.path}`), { cause }); }
    if (!stat.isDirectory() || stat.isSymbolicLink() || !sameStorageFile(stat, before)
      || realpathSync(before.path) !== before.real) {
      throw failure("ANCESTOR_REPLACED", `directory replaced during write: ${before.path}`);
    }
  }
}

function destination(root, relPath) {
  if (typeof relPath !== "string" || !relPath || isAbsolute(relPath)
    || relPath.split(/[\\/]/).includes("..")) {
    throw failure("PATH_ESCAPE", `expected a relative path within root: ${relPath}`);
  }
  const canonicalRoot = rootPath(root);
  const path = resolve(canonicalRoot, relPath);
  if (path === canonicalRoot || !inside(canonicalRoot, path)) {
    throw failure("PATH_ESCAPE", `path escapes root: ${relPath}`);
  }
  // Parents must exist. Creating missing storage silently masks bad callers.
  const parent = dirname(path);
  const snapshot = directorySnapshot(parent);
  if (!inside(canonicalRoot, realpathSync(parent))) {
    throw failure("PATH_ESCAPE", `parent escapes root: ${parent}`);
  }
  return { path, parent, snapshot, root: canonicalRoot };
}

function targetStat(path) {
  const stat = optionalStat(path);
  if (stat?.isSymbolicLink()) throw failure("SYMLINK_TARGET", `symlink destination: ${path}`);
  if (stat && !stat.isFile()) throw failure("NOT_A_FILE", `destination is not a regular file: ${path}`);
  return stat;
}

function verifyOpen(fd, path, root) {
  const stat = fstatSync(fd);
  const named = lstatSync(path);
  if (!stat.isFile() || named.isSymbolicLink() || !sameStorageFile(stat, named)
    || !inside(root, realpathSync(path))) {
    throw failure("ANCESTOR_REPLACED", `opened file changed identity: ${path}`);
  }
  return stat;
}

function readTarget(target) {
  targetStat(target.path);
  const fd = openSync(target.path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    verifyDirectories(target.snapshot);
    verifyOpen(fd, target.path, target.root);
    const bytes = readFileSync(fd);
    verifyOpen(fd, target.path, target.root);
    verifyDirectories(target.snapshot);
    return bytes;
  } finally { closeSync(fd); }
}

function syncWriteDirectory(target) {
  const fd = openSync(target.parent, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = target.snapshot[target.snapshot.length - 1];
    if (!sameStorageFile(fstatSync(fd), before)) throw failure("ANCESTOR_REPLACED", `directory changed: ${target.parent}`);
    fsyncSync(fd);
  } finally { closeSync(fd); }
}

function publish(target, bytes, createOnly, acceptIdentical) {
  if (!Number.isInteger(constants.O_NOFOLLOW)) {
    throw failure("UNSUPPORTED_PLATFORM", "O_NOFOLLOW is required for safe writes");
  }
  const data = typeof bytes === "string" ? Buffer.from(bytes) : Buffer.from(bytes);
  verifyDirectories(target.snapshot);
  const prior = targetStat(target.path);
  if (createOnly && prior) {
    if (acceptIdentical && readTarget(target).equals(data)) return { path: target.path, idempotent: true };
    throw failure(acceptIdentical ? "RECORD_CONFLICT" : "EEXIST", `record already exists: ${target.path}`);
  }
  const temporary = join(target.parent, `.${basename(target.path)}.${randomUUID()}.tmp`);
  let fd;
  let identity;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    identity = verifyOpen(fd, temporary, target.root);
    verifyDirectories(target.snapshot);
    writeFileSync(fd, data);
    fsyncSync(fd);
    verifyOpen(fd, temporary, target.root);
    verifyDirectories(target.snapshot);
    closeSync(fd);
    fd = undefined;
    const beforePublish = lstatSync(temporary);
    if (beforePublish.isSymbolicLink() || !sameStorageFile(beforePublish, identity)) {
      throw failure("ANCESTOR_REPLACED", `temporary file replaced before publication: ${temporary}`);
    }
    targetStat(target.path);
    if (createOnly) {
      try { linkSync(temporary, target.path); }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        targetStat(target.path);
        if (acceptIdentical && readTarget(target).equals(data)) return { path: target.path, idempotent: true };
        throw failure(acceptIdentical ? "RECORD_CONFLICT" : "EEXIST", `record already exists: ${target.path}`);
      }
    } else {
      // Atomic overwrite replaces a pathname, never follows its final symlink.
      renameSync(temporary, target.path);
    }
    const published = targetStat(target.path);
    if (!published || !sameStorageFile(published, identity)) {
      throw failure("ANCESTOR_REPLACED", `published file changed identity: ${target.path}`);
    }
    verifyDirectories(target.snapshot);
    syncWriteDirectory(target);
    verifyDirectories(target.snapshot);
    return { path: target.path, idempotent: false };
  } finally {
    if (fd !== undefined) closeSync(fd);
    // Never remove a different file if somebody replaced the temp pathname.
    if (identity) {
      verifyDirectories(target.snapshot);
      const named = optionalStat(temporary);
      if (named && sameStorageFile(named, identity) && !named.isSymbolicLink()) unlinkSync(temporary);
    }
  }
}

async function appendRecord(dir, slug, ext, bytes) {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,48}$/.test(slug)) {
    throw failure("INVALID_SLUG", "slug must match [a-z0-9-]{1,48}");
  }
  if (typeof ext !== "string" || !/^[a-z0-9]{1,16}$/.test(ext)) {
    throw failure("INVALID_EXTENSION", "extension must contain 1 to 16 lowercase letters or digits");
  }
  const root = rootPath(dir);
  const day = new Date().toISOString().slice(0, 10);
  let sequence = 1;
  for (const name of readdirSync(root)) {
    const match = name.match(/^(\d{4}-\d{2}-\d{2})-(\d{3})-[a-z0-9-]+\.[a-z0-9]+$/);
    if (match?.[1] === day) sequence = Math.max(sequence, Number(match[2]) + 1);
  }
  for (; sequence <= 999; sequence += 1) {
    const name = `${day}-${String(sequence).padStart(3, "0")}-${slug}.${ext}`;
    try { return publish(destination(root, name), bytes, true, false).path; }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  throw failure("RECORD_SEQUENCE_EXHAUSTED", `record sequence exhausted for ${day}: ${root}`);
}


const OPERATIONS = new Set(["commit", "push", "merge", "archive", "cleanup", "pr"]);

function requireOperation(operation) {
  if (!OPERATIONS.has(operation)) throw failure("UNSUPPORTED_OPERATION", `unsupported Git operation: ${operation}`);
}

function requiredText(value, code, label) {
  if (typeof value !== "string" || !value.trim()) throw failure(code, `${label} must be a nonempty string`);
  return value;
}

function recordDirectory(dir) {
  const absolute = resolve(dir);
  let cursor = parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    if (!optionalStat(cursor)) {
      try { mkdirSync(cursor, { mode: 0o700 }); }
      catch (error) { if (error.code !== "EEXIST") throw error; }
    }
    const stat = lstatSync(cursor);
    const platformAlias = stat.isSymbolicLink() && process.platform === "darwin"
      && ((cursor === "/tmp" && realpathSync(cursor) === "/private/tmp")
        || (cursor === "/var" && realpathSync(cursor) === "/private/var"));
    if (stat.isSymbolicLink() && !platformAlias) throw failure("SYMLINK_TARGET", `symlinked record directory: ${cursor}`);
    if (!stat.isDirectory() && !platformAlias) throw failure("NOT_A_DIRECTORY", `not a record directory: ${cursor}`);
  }
  return rootPath(absolute);
}

function gitIdentity(cwd) {
  // These are readonly identity calls, not arbitrary user Git commands. A Git
  // hook/parent may select another repository or inject configuration through
  // any GIT_* variable; only the caller's cwd may select this identity.
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  const read = (args) => {
    try { return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
    catch (cause) { throw Object.assign(failure("GIT_IDENTITY_UNAVAILABLE", "cannot read the current Git identity"), { cause }); }
  };
  const head = read(["rev-parse", "--verify", "HEAD"]);
  const branch = read(["branch", "--show-current"]);
  if (!branch) throw failure("DETACHED_HEAD", "authorization requires a named Git branch");
  return { head, branch };
}

function assertTaskRepositoryScope(dir, cwd) {
  // This is the existing task-owned producer endpoint, not the generic
  // historical quality/authorizations directory. A broken manifest here
  // must fail closed rather than silently switching to the generic contract.
  const endpoint = resolve(dir);
  if (basename(endpoint) !== "git-authorizations" || basename(dirname(endpoint)) !== "evidence" || basename(dirname(dirname(endpoint))) !== "quality") return;
  const taskRoot = rootPath(dirname(dirname(dirname(endpoint))));
  const target = destination(taskRoot, "task.json");
  if (lstatSync(target.path).nlink !== 1) throw failure("AUTH_SCOPE", "task authorization manifest must be a single-link file");
  const manifestBytes = readTarget(target), manifest = JSON.parse(manifestBytes.toString("utf8"));
  const parts = taskRoot.split(sep).slice(-4);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)
    || manifest.schema_version !== "1.0.0" || typeof manifest.project_name !== "string" || typeof manifest.task_id !== "string"
    || parts.join("/") !== `Projects/${manifest.project_name}/tasks/${manifest.task_id}`
    || typeof manifest.target_repo_root !== "string" || !isAbsolute(manifest.target_repo_root)) throw failure("AUTH_SCOPE", "task authorization directory and manifest identity differ");
  const env = { ...process.env }; for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key]; env.GIT_OPTIONAL_LOCKS = "0";
  const read = (root, args) => {
    try { return execFileSync("git", args, { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd(); }
    catch (cause) { throw Object.assign(failure("GIT_IDENTITY_UNAVAILABLE", "cannot read task authorization repository scope"), { cause }); }
  };
  const repository = rootPath(manifest.target_repo_root), actual = rootPath(cwd);
  if (rootPath(read(repository, ["rev-parse", "--show-toplevel"])) !== repository || rootPath(read(actual, ["rev-parse", "--show-toplevel"])) !== actual) throw failure("AUTH_SCOPE", "authorization requires an actual repository worktree root");
  const common = rootPath(resolve(repository, read(repository, ["rev-parse", "--git-common-dir"])));
  if (rootPath(resolve(actual, read(actual, ["rev-parse", "--git-common-dir"]))) !== common) throw failure("AUTH_SCOPE", "current repository differs from the task-owned authorization repository");
  const registered = read(repository, ["worktree", "list", "--porcelain", "-z"]).split("\0").filter(line => line.startsWith("worktree ")).map(line => line.slice(9));
  if (!registered.includes(actual)) throw failure("AUTH_SCOPE", "authorization cwd is not a registered task repository worktree");
  if (manifest.workspace_mode !== undefined || manifest.workspace_root !== undefined) {
    if (manifest.workspace_mode !== "existing" || typeof manifest.workspace_root !== "string" || !isAbsolute(manifest.workspace_root)) throw failure("AUTH_SCOPE", "task workspace scope is invalid");
    const workspace = rootPath(manifest.workspace_root);
    if (!registered.includes(workspace) || rootPath(read(workspace, ["rev-parse", "--show-toplevel"])) !== workspace || rootPath(resolve(workspace, read(workspace, ["rev-parse", "--git-common-dir"]))) !== common) throw failure("AUTH_SCOPE", "declared task workspace differs from its repository scope");
  }
  verifyDirectories(target.snapshot);
  if (!readTarget(target).equals(manifestBytes)) throw failure("ANCESTOR_REPLACED", "task authorization manifest changed during repository scope reads");
}

function records(dir, operation) {
  const result = { authorizations: [], consumptions: [] };
  for (const name of readdirSync(dir).sort()) {
    const match = name.match(/^\d{4}-\d{2}-\d{2}-\d{3}-(authorize|consumed)-(commit|push|merge|archive|cleanup|pr)\.json$/);
    if (!match || match[2] !== operation) continue;
    const path = join(dir, name);
    const raw = readTarget(destination(dir, name));
    let value;
    try { value = JSON.parse(raw.toString("utf8")); }
    catch (cause) { throw Object.assign(failure("AUTHORIZATION_RECORD_INVALID", `invalid authorization JSON: ${path}`), { cause }); }
    const timestamp = match[1] === "authorize" ? value?.created_at : value?.consumed_at;
    if (!value || value.operation !== operation || typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))) {
      throw failure("AUTHORIZATION_RECORD_INVALID", `invalid authorization fields: ${path}`);
    }
    if (match[1] === "authorize") {
      if (typeof value.branch !== "string" || !value.branch || typeof value.head !== "string" || !/^[a-f0-9]{40,64}$/.test(value.head)
        || typeof value.confirmation_ref !== "string" || !value.confirmation_ref.trim()) {
        throw failure("AUTHORIZATION_RECORD_INVALID", `invalid grant fields: ${path}`);
      }
      result.authorizations.push({ path, value });
    } else {
      if (typeof value.step_id !== "string" || !value.step_id.trim() || typeof value.authorization_ref !== "string" || !value.authorization_ref) {
        throw failure("AUTHORIZATION_RECORD_INVALID", `invalid consumption fields: ${path}`);
      }
      result.consumptions.push({ path, value });
    }
  }
  const grants = new Set(result.authorizations.map((grant) => grant.path));
  for (const item of result.consumptions) {
    if (!grants.has(item.value.authorization_ref)) throw failure("AUTHORIZATION_RECORD_INVALID", `consumption references a missing grant: ${item.path}`);
  }
  return result;
}

export async function record({ operation, confirmationRef, dir = join(process.cwd(), "quality", "authorizations") } = {}) {
  requireOperation(operation);
  requiredText(confirmationRef, "CONFIRMATION_REFERENCE_REQUIRED", "confirmationRef");
  requiredText(dir, "INVALID_DIRECTORY", "authorization directory");
  const cwd = process.cwd();
  const storage = recordDirectory(dir);
  return withLock(storage, "git-authorize", () => {
    const { branch, head } = gitIdentity(cwd);
    return appendRecord(storage, `authorize-${operation}`, "json", `${JSON.stringify({
      operation, branch, head, confirmation_ref: confirmationRef, created_at: new Date().toISOString(),
    }, null, 2)}\n`);
  });
}

export async function consume({ operation, stepId, dir = join(process.cwd(), "quality", "authorizations") } = {}) {
  requireOperation(operation);
  requiredText(stepId, "AUTHORIZATION_STEP_REQUIRED", "stepId");
  requiredText(dir, "INVALID_DIRECTORY", "authorization directory");
  const cwd = process.cwd();
  const storage = recordDirectory(dir);
  return withLock(storage, "git-authorize", async () => {
    assertTaskRepositoryScope(storage, cwd);
    const { authorizations, consumptions } = records(storage, operation);
    const retry = consumptions.find((item) => item.value.step_id === stepId);
    if (retry) {
      const grant = authorizations.find((item) => item.path === retry.value.authorization_ref);
      const current = gitIdentity(cwd);
      if (!grant || grant.value.operation !== operation || grant.value.branch !== current.branch) throw failure("AUTH_SCOPE", "current Git branch does not cover the previously consumed authorization");
      // This is an immutable receipt for an action already consumed, not a
      // fresh grant. Its original HEAD remains historical after that action
      // commits/merges; do not reject a same-branch retry for that legal move.
      return { ...retry.value, path: retry.path };
    }
    const used = new Set(consumptions.map((item) => item.value.authorization_ref));
    const grant = authorizations.filter((item) => !used.has(item.path)).at(-1);
    if (!grant) throw failure(authorizations.length ? "AUTHORIZATION_ALREADY_CONSUMED" : "IRREVERSIBLE_AUTHORIZATION_REQUIRED",
      `no unused authorization for ${operation}`);
    const current = gitIdentity(cwd);
    if (current.head !== grant.value.head) throw failure("AUTHORIZATION_HEAD_MISMATCH", `HEAD changed since authorization: ${grant.path}`);
    const path = await appendRecord(storage, `consumed-${operation}`, "json", `${JSON.stringify({
      operation, step_id: stepId, authorization_ref: grant.path, consumed_at: new Date().toISOString(),
    }, null, 2)}\n`);
    const value = JSON.parse(readTarget(destination(storage, basename(path))).toString("utf8"));
    return { ...value, path };
  });
}

// Both names occur in the existing spec/Phase contract; they share one implementation.
export { record as recordAuthorization, consume as consumeAuthorization };

async function main(argv) {
  const action = argv.shift();
  if (!["record", "consume"].includes(action)) throw failure("INVALID_ARGUMENT", "usage: record|consume --operation OP --confirmation-ref REF|--step-id ID [--dir DIR]");
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index], value = argv[index + 1];
    if (!["--operation", "--confirmation-ref", "--step-id", "--dir"].includes(key) || !value || value.startsWith("--") || options[key] !== undefined) {
      throw failure("INVALID_ARGUMENT", `invalid authorization option: ${key}`);
    }
    options[key] = value;
  }
  if (!options["--operation"] || (action === "record" && (options["--step-id"] || !options["--confirmation-ref"]))
    || (action === "consume" && (options["--confirmation-ref"] || !options["--step-id"]))) throw failure("INVALID_ARGUMENT", "action requires its operation and confirmation-ref or step-id");
  const input = { operation: options["--operation"], ...(options["--dir"] ? { dir: options["--dir"] } : {}) };
  const result = action === "record" ? await record({ ...input, confirmationRef: options["--confirmation-ref"] }) : await consume({ ...input, stepId: options["--step-id"] });
  const path = action === "record" ? result : result.path;
  process.stdout.write(`${JSON.stringify({ path })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "GIT_AUTHORIZATION_FAILED", message: error.message })}\n`);
    process.exitCode = 1;
  });
}
