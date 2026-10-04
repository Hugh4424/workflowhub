import { execFileSync } from "node:child_process";
import {
  closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, mkdirSync,
  openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { join, parse, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

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

async function withConfirmationLock(dir, name, fn, { waitMs = 2000 } = {}) {
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
      while (!observed) {
        try { observed = readOwner(path, storage); }
        catch (readError) {
          if (readError.code === "ENOENT" || readError.code === "LOCK_CHANGED") break;
          // O_EXCL publishes the pathname before the owner bytes are complete.
          // Slow/busy creators get the caller's existing wait budget, rather
          // than an arbitrary single retry. Persistent bad JSON remains an
          // explicit LOCK_INVALID failure; IO/permission errors are not hidden.
          if (readError.code !== "LOCK_INVALID" || !(readError.cause instanceof SyntaxError)) throw readError;
          const remaining = waitMs - (performance.now() - started);
          if (remaining <= 0) throw readError;
          await delay(Math.min(10, remaining));
        }
      }
      if (!observed) continue;
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

function optionalStat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function ensureStorage(dir) {
  const absolute = resolve(dir);
  let cursor = parse(absolute).root;
  const ancestry = [];
  const verify = () => {
    for (const before of ancestry) {
      if (!sameFile(lstatSync(before.path), before) || realpathSync(before.path) !== before.real) {
        throw errorWithCode("ANCESTOR_REPLACED", `confirmation directory replaced: ${before.path}`);
      }
    }
  };
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    verify();
    cursor = join(cursor, part);
    if (!optionalStat(cursor)) {
      try { mkdirSync(cursor, { mode: 0o700 }); }
      catch (error) { if (error.code !== "EEXIST") throw error; }
    }
    const stat = lstatSync(cursor);
    const alias = stat.isSymbolicLink() && process.platform === "darwin"
      && ((cursor === "/tmp" && realpathSync(cursor) === "/private/tmp")
        || (cursor === "/var" && realpathSync(cursor) === "/private/var"));
    if (stat.isSymbolicLink() && !alias) throw errorWithCode("SYMLINK_TARGET", `symlinked confirmation directory: ${cursor}`);
    if (!stat.isDirectory() && !alias) throw errorWithCode("NOT_A_DIRECTORY", `not a confirmation directory: ${cursor}`);
    ancestry.push({ path: cursor, dev: stat.dev, ino: stat.ino, real: realpathSync(cursor) });
  }
  verify();
  return storageDirectory(absolute);
}

function currentHead(cwd) {
  const env = { ...process.env };
  // Keep Git configuration injection/discovery limits from changing the
  // repository selected by this confirmation call's explicit cwd.
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  try {
    const head = execFileSync("git", ["rev-parse", "--verify", "HEAD^{commit}"], {
      cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(head)) throw errorWithCode("GIT_HEAD_INVALID", "Git returned an invalid HEAD OID");
    return head;
  } catch (cause) {
    if (cause.code === "GIT_HEAD_INVALID") throw cause;
    throw errorWithCode("GIT_COMMAND_FAILED", `cannot read current Git HEAD in ${cwd}: ${String(cause.stderr ?? cause.message).trim()}`, { cause, exitCode: cause.status, stderr: String(cause.stderr ?? "") });
  }
}

function appendConfirmation(storage, slug, record) {
  const day = record.created_at.slice(0, 10);
  let sequence = 1;
  // Historical hash-named files are ignored; no old confirmation is read.
  for (const name of readdirSync(storage.root)) {
    const match = name.match(/^(\d{4}-\d{2}-\d{2})-(\d{3})-[a-z0-9-]+\.json$/);
    if (match?.[1] === day) sequence = Math.max(sequence, Number(match[2]) + 1);
  }
  const temporary = join(storage.root, `.${randomUUID()}.tmp`);
  let fd;
  let identity;
  try {
    storage.verify();
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    identity = fstatSync(fd);
    if (!sameFile(lstatSync(temporary), identity)) throw errorWithCode("ANCESTOR_REPLACED", "confirmation temporary identity changed");
    writeFileSync(fd, `${JSON.stringify(record, null, 2)}\n`);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    for (; sequence <= 999; sequence += 1) {
      storage.verify();
      const named = lstatSync(temporary);
      if (named.isSymbolicLink() || !sameFile(named, identity)) throw errorWithCode("ANCESTOR_REPLACED", "confirmation temporary replaced before publication");
      const path = join(storage.root, `${day}-${String(sequence).padStart(3, "0")}-${slug}.json`);
      try { linkSync(temporary, path); }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        if (lstatSync(path).isSymbolicLink()) throw errorWithCode("SYMLINK_TARGET", `symlinked confirmation destination: ${path}`);
        continue;
      }
      storage.verify();
      const published = lstatSync(path);
      if (published.isSymbolicLink() || !sameFile(published, identity)) throw errorWithCode("ANCESTOR_REPLACED", "confirmation changed during publication");
      syncDirectory(storage);
      return { path, ...record };
    }
    throw errorWithCode("RECORD_SEQUENCE_EXHAUSTED", `confirmation sequence exhausted for ${day}`);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (identity) {
      storage.verify();
      const named = optionalStat(temporary);
      if (named && !named.isSymbolicLink() && sameFile(named, identity)) unlinkSync(temporary);
    }
  }
}

export async function recordConfirmation(fields, context = {}) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw errorWithCode("INVALID_CONFIRMATION", "confirmation fields are required");
  const { stage, decision, reply, materialRefs } = fields;
  if (typeof reply !== "string" || reply.length === 0) throw errorWithCode("CONFIRMATION_REPLY_REQUIRED", "a verbatim reply is required");
  if (Object.keys(fields).some((key) => !["stage", "decision", "reply", "materialRefs"].includes(key))) throw errorWithCode("INVALID_CONFIRMATION", "only stage, decision, reply and materialRefs are accepted; HEAD is read from Git");
  if (typeof stage !== "string" || typeof decision !== "string"
    || !/^[a-z0-9-]+$/.test(stage) || !/^[a-z0-9-]+$/.test(decision)
    || `${stage}-${decision}`.length > 48) throw errorWithCode("INVALID_CONFIRMATION", "stage-decision must match [a-z0-9-]{1,48}");
  if (!Array.isArray(materialRefs) || materialRefs.some((ref) => typeof ref !== "string" || !ref || ref.includes("\0"))) throw errorWithCode("INVALID_MATERIAL_REFS", "materialRefs must be an array of nonempty plain path strings");
  if (!context || typeof context !== "object" || Array.isArray(context)
    || Object.keys(context).some((key) => !["cwd", "dir"].includes(key))) throw errorWithCode("INVALID_CONTEXT", "context accepts only cwd and dir");
  if (context.cwd !== undefined && (typeof context.cwd !== "string" || !context.cwd)) throw errorWithCode("INVALID_CONTEXT", "context cwd must be a nonempty path");
  if (context.dir !== undefined && (typeof context.dir !== "string" || !context.dir)) throw errorWithCode("INVALID_CONTEXT", "context dir must be a nonempty path");
  // Bind each call to its actual cwd before waiting; never cache import-time HEAD.
  const cwd = realpathSync(resolve(context.cwd ?? process.cwd()));
  currentHead(cwd); // Reject non-Git/unborn/failed contexts before any writes.
  const storage = ensureStorage(context.dir === undefined ? join(cwd, "quality", "confirmations") : resolve(cwd, context.dir));
  return withConfirmationLock(storage.root, "human-confirm", () => {
    storage.verify();
    return appendConfirmation(storage, `${stage}-${decision}`, {
      stage, decision, reply, material_refs: [...materialRefs], head: currentHead(cwd), created_at: new Date().toISOString(),
    });
  });
}

async function main(argv) {
  const fields = { materialRefs: [] };
  const context = {};
  let hasReply = false;
  const keys = { "--cwd": "cwd", "--dir": "dir", "--stage": "stage", "--decision": "decision", "--reply": "reply", "--material-ref": "materialRef" };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]; const equals = token.indexOf("=");
    const flag = equals < 0 ? token : token.slice(0, equals);
    const value = equals < 0 ? argv[++index] : token.slice(equals + 1);
    const key = keys[flag];
    if (!key || value === undefined) throw errorWithCode("INVALID_ARGUMENT", `unknown or missing argument: ${flag}`);
    if (key === "materialRef") { fields.materialRefs.push(value); continue; }
    const destination = key === "cwd" || key === "dir" ? context : fields;
    if (Object.hasOwn(destination, key)) throw errorWithCode("INVALID_ARGUMENT", `duplicate option: ${flag}`);
    destination[key] = value;
    if (key === "reply") hasReply = true;
  }
  if (!hasReply) {
    if (process.stdin.isTTY) throw errorWithCode("CONFIRMATION_REPLY_REQUIRED", "provide --reply or pipe the verbatim reply to stdin");
    fields.reply = readFileSync(0, "utf8");
  }
  const result = await recordConfirmation(fields, context);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "CONFIRMATION_FAILED", message: error.message })}\n`);
    process.exitCode = error.code === "LOCK_HELD" ? 75 : 1;
  });
}
