import {
  closeSync, constants, fstatSync, fsyncSync, lstatSync, openSync,
  readFileSync, realpathSync, unlinkSync, writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { constants as osConstants, hostname } from "node:os";
import { join, parse, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

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

export async function withLock(dir, name, fn, { waitMs = 2000 } = {}) {
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

async function main(argv) {
  const split = argv.indexOf("--");
  if (split < 0 || split === argv.length - 1) throw errorWithCode("INVALID_ARGUMENT", "usage: --dir DIR --name NAME [--wait-ms N] -- COMMAND");
  const flags = argv.slice(0, split);
  const command = argv.slice(split + 1);
  const options = {};
  for (let index = 0; index < flags.length; index += 2) {
    const key = flags[index]; const value = flags[index + 1];
    if (!["--dir", "--name", "--wait-ms"].includes(key) || !value || options[key] !== undefined) throw errorWithCode("INVALID_ARGUMENT", `invalid lock option: ${key}`);
    options[key] = value;
  }
  if (!options["--dir"] || !options["--name"] || (options["--wait-ms"] !== undefined && !/^\d+$/.test(options["--wait-ms"]))) throw errorWithCode("INVALID_ARGUMENT", "--dir and --name are required; --wait-ms must be a nonnegative integer");
  process.exitCode = await withLock(options["--dir"], options["--name"], () => new Promise((done, reject) => {
    const child = command.length === 1 ? spawn("/bin/sh", ["-c", command[0]], { stdio: "inherit" }) : spawn(command[0], command.slice(1), { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code, signal) => done(code ?? (128 + (osConstants.signals[signal] ?? 0))));
  }), { waitMs: options["--wait-ms"] === undefined ? 2000 : Number(options["--wait-ms"]) });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "RECORD_LOCK_FAILED", message: error.message, ...(error.holder ? { holder: error.holder } : {}) })}\n`);
    process.exitCode = error.exitCode ?? 1;
  });
}
