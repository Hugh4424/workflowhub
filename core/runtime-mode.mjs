import { randomUUID } from "node:crypto";
import { closeSync, constants, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, hostname } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

const MODES = new Set(["legacy", "active", "quiescing"]);
export function runtimeModePath(home = homedir()) { return join(resolve(home), ".workflowhub", "runtime-mode"); }
function lockPath(home) { return `${runtimeModePath(home)}.lock`; }
function validate(state) {
  if (state?.schema_version !== "task-v1" || !MODES.has(state.mode) || !isAbsolute(state.storage_root ?? "") || typeof state.cutover_epoch !== "string" || state.cutover_epoch === "") throw new Error("runtime-mode authority record is invalid");
  return Object.freeze({ ...state, storage_root: resolve(state.storage_root) });
}
export function readRuntimeMode({ home = homedir() } = {}) { return validate(JSON.parse(readFileSync(runtimeModePath(home), "utf8"))); }
function writeMode(state, home) {
  const path = runtimeModePath(home), parent = dirname(path), temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  mkdirSync(parent, { recursive: true });
  const fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  try { writeFileSync(fd, `${JSON.stringify(validate(state), null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, path); const dir = openSync(parent, constants.O_RDONLY); try { fsyncSync(dir); } finally { closeSync(dir); }
  return validate(state);
}
function alive(pid) { try { process.kill(pid, 0); return true; } catch (error) { return error?.code === "EPERM"; } }
function withAuthorityLock(home, operation) {
  const path = lockPath(home), parent = dirname(path); mkdirSync(parent, { recursive: true });
  let fd;
  try { fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    let owner; try { owner = JSON.parse(readFileSync(path, "utf8")); } catch { throw new Error("runtime-mode lock is unreadable"); }
    if (owner.host !== hostname() || alive(owner.pid)) throw new Error("runtime-mode authority transition already active");
    unlinkSync(path); fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  }
  const nonce = randomUUID();
  try { writeFileSync(fd, `${JSON.stringify({ pid: process.pid, host: hostname(), nonce })}\n`); fsyncSync(fd); closeSync(fd); fd = undefined; return operation(); }
  finally { if (fd !== undefined) closeSync(fd); let owner; try { owner = JSON.parse(readFileSync(path, "utf8")); } catch {} if (owner?.nonce === nonce) unlinkSync(path); }
}
export function assertRuntimeAuthority(storageRoot, { home = homedir(), expectedEpoch } = {}) {
  const root = resolve(storageRoot), path = runtimeModePath(home);
  if (!existsSync(path)) return withAuthorityLock(home, () => {
    if (existsSync(path)) return assertRuntimeAuthority(root, { home, expectedEpoch });
    return writeMode({ schema_version: "task-v1", mode: "active", storage_root: root, cutover_epoch: randomUUID() }, home);
  });
  const state = readRuntimeMode({ home });
  if (state.storage_root !== root) throw new Error(`runtime storage root mismatch: authority=${state.storage_root} launcher=${root}`);
  if (expectedEpoch !== undefined && expectedEpoch !== state.cutover_epoch) throw new Error("runtime cutover epoch mismatch");
  if (state.mode !== "active") throw new Error(`runtime is ${state.mode}; new stage launches are refused`);
  return state;
}
export function quiesceRuntime({ storageRoot, home = homedir(), expectedEpoch } = {}) {
  return withAuthorityLock(home, () => { const current = readRuntimeMode({ home });
    if (current.mode !== "active" || current.storage_root !== resolve(storageRoot) || current.cutover_epoch !== expectedEpoch) throw new Error("quiesce mode/root/epoch CAS does not match authority");
    return writeMode({ ...current, mode: "quiescing", cutover_epoch: randomUUID(), source_root: current.storage_root }, home); });
}
export function rebindRuntimeRoot({ sourceRoot, targetRoot, home = homedir(), expectedEpoch } = {}) {
  if (typeof targetRoot !== "string" || !isAbsolute(targetRoot)) throw new TypeError("target root must be absolute");
  const target = resolve(targetRoot);
  return withAuthorityLock(home, () => { const current = readRuntimeMode({ home });
    if (current.mode !== "quiescing" || current.storage_root !== resolve(sourceRoot) || current.cutover_epoch !== expectedEpoch) throw new Error("rebind mode/root/epoch CAS must match unchanged quiescing authority");
    return writeMode({ schema_version: "task-v1", mode: "active", storage_root: target, source_root: current.storage_root, target_root: target, cutover_epoch: randomUUID() }, home); });
}
export function assertMigrationAuthority(storageRoot, { home = homedir(), expectedEpoch } = {}) {
  const state = readRuntimeMode({ home });
  if (state.mode !== "quiescing" || state.storage_root !== resolve(storageRoot) || state.cutover_epoch !== expectedEpoch) throw new Error("migration requires matching quiescing root and epoch");
  return state;
}
export function assertLegacyBridgeReadOnly({ home = homedir(), write = false } = {}) {
  const state = readRuntimeMode({ home });
  if (write) throw new Error("migration bridge is legacy read-only");
  if (!["legacy", "quiescing"].includes(state.mode)) throw new Error("legacy bridge disabled after cutover");
  return state;
}
