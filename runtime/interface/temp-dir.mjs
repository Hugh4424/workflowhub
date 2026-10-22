import { constants, closeSync, fstatSync, lstatSync, mkdtempSync, openSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const markerName = ".workflowhub-temp.json";
const owner = "workflowhub-temp-dir-v1";
const tracked = new Map();
let installed = false;
const uid = () => process.getuid?.() ?? null;
const uidMatches = (stat, expected) => expected === null || stat.uid === expected;
function report(error) { process.stderr.write(`TEMP_CLEANUP_FAILED: ${error?.code ?? "ERROR"}: ${error?.message ?? error}\n`); }
function checkedRoot(root) {
  const path = resolve(root), stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(path) !== path) throw Object.assign(new Error("temporary root must be a real directory"), { code: "TEMP_ROOT_UNSAFE" });
  return path;
}
function validPrefix(prefix) {
  if (typeof prefix !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*-$/.test(prefix)) throw new TypeError("temporary prefix must be a basename ending with '-'");
}
function sameDirectory(path, identity) {
  const stat = lstatSync(path);
  return stat.isDirectory() && !stat.isSymbolicLink() && stat.dev === identity.dev && stat.ino === identity.ino;
}
function installCleanup() {
  if (installed) return;
  installed = true;
  process.on("exit", cleanupTrackedTempDirs);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    function onSignal() {
      // Preserve application handlers; with no other handler, restore the native
      // signal exit (including the parent's observed signal rather than exit 0).
      // The exit hook performs cleanup after any application-owned cancellation
      // drain; deleting active provider material here would race that drain.
      if (process.listenerCount(signal) === 1) {
        cleanupTrackedTempDirs();
        process.removeListener(signal, onSignal);
        process.kill(process.pid, signal);
      }
    }
    process.on(signal, onSignal);
  }
}

/** Synchronous lifetime owner for this process; dispose is idempotent. */
export function createTrackedTempDir(prefix, { root = realpathSync(tmpdir()) } = {}) {
  validPrefix(prefix);
  root = checkedRoot(root);
  const path = mkdtempSync(join(root, prefix));
  const identity = lstatSync(path);
  try {
    writeFileSync(join(path, markerName), `${JSON.stringify({ owner, pid: process.pid, created_at: new Date().toISOString(), prefix, uid: uid(), dev: identity.dev, ino: identity.ino })}\n`, { flag: "wx", mode: 0o600 });
  } catch (error) {
    try { if (sameDirectory(path, identity)) rmSync(path, { recursive: true, force: true }); }
    catch (cleanupError) { if (cleanupError?.code !== "ENOENT") report(cleanupError); }
    throw error;
  }
  const dispose = () => {
    if (!tracked.has(path)) return;
    try {
      if (!sameDirectory(path, identity)) throw Object.assign(new Error("tracked temporary directory identity changed"), { code: "TEMP_IDENTITY_CHANGED" });
      rmSync(path, { recursive: true, force: true });
      tracked.delete(path);
    } catch (error) {
      if (error?.code === "ENOENT") { tracked.delete(path); return; }
      throw error;
    }
  };
  tracked.set(path, dispose);
  installCleanup();
  return Object.freeze({ path, dispose });
}

/** Best effort at process exit: report failures without replacing exit semantics. */
export function cleanupTrackedTempDirs() {
  const errors = [];
  for (const dispose of [...tracked.values()]) {
    try { dispose(); } catch (error) { errors.push(error); report(error); }
  }
  return errors;
}

function isPidAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error?.code === "ESRCH" ? false : null; }
}

/** Only an allowlisted, marked, old directory whose owner is proven dead. */
export function cleanupStaleTempDirs({ root = realpathSync(tmpdir()), prefixes = [], olderThanMs = 24 * 60 * 60 * 1000, pidAlive = isPidAlive } = {}) {
  root = checkedRoot(root);
  for (const prefix of prefixes) validPrefix(prefix);
  if (!Number.isFinite(olderThanMs) || olderThanMs < 0 || typeof pidAlive !== "function") throw new TypeError("invalid stale temporary cleanup options");
  const removed = [];
  for (const name of readdirSync(root)) {
    const prefix = prefixes.find((value) => name.startsWith(value));
    if (!prefix) continue;
    const path = join(root, name);
    try {
      const identity = lstatSync(path);
      const currentUid = uid();
      if (!identity.isDirectory() || identity.isSymbolicLink() || !uidMatches(identity, currentUid)) continue;
      const markerPath = join(path, markerName), named = lstatSync(markerPath);
      if (!named.isFile() || named.isSymbolicLink() || named.nlink !== 1 || !uidMatches(named, currentUid) || (named.mode & 0o077) !== 0 || named.size > 4096) continue;
      const fd = openSync(markerPath, constants.O_RDONLY | constants.O_NOFOLLOW);
      let marker;
      try {
        const stat = fstatSync(fd);
        if (stat.dev !== named.dev || stat.ino !== named.ino) continue;
        marker = JSON.parse(readFileSync(fd, "utf8"));
      } finally { closeSync(fd); }
      const created = Date.parse(marker.created_at);
      if (marker.owner !== owner || marker.prefix !== prefix || (currentUid !== null && marker.uid !== currentUid) || marker.dev !== identity.dev || marker.ino !== identity.ino
          || !Number.isSafeInteger(marker.pid) || marker.pid < 1 || marker.pid === process.pid || !Number.isFinite(created) || Date.now() - created < olderThanMs) continue;
      let alive;
      try { alive = pidAlive(marker.pid); } catch { continue; }
      if (alive !== false || !sameDirectory(path, identity)) continue;
      // Recheck the named marker before destructive work; aliases are never followed.
      const finalMarker = lstatSync(markerPath);
      if (finalMarker.isSymbolicLink() || finalMarker.dev !== named.dev || finalMarker.ino !== named.ino) continue;
      rmSync(path, { recursive: true, force: true });
      removed.push(path);
    } catch (error) {
      // Unknown/foreign entries are deliberately retained. Real cleanup I/O
      // failures remain visible; missing or malformed markers are not ours.
      if (!["ENOENT", "ENOTDIR", "ELOOP"].includes(error?.code) && !(error instanceof SyntaxError)) report(error);
    }
  }
  return removed;
}
