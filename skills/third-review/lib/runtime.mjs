import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fail } from "./errors.mjs";
import { providerRuntimeKey } from "./provider-ids.mjs";

function file(root, id) { return path.join(root, id, "state.json"); }
function now() { return Date.now(); }
const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
const cancellationSources = new Set(["user", "workflow_shutdown", "broker_idle_timeout", "broker_max_duration"]);
const terminationEscalations = new Map();
export const INVALID_CANCELLATION_SOURCE = "invalid";
function pause(ms = 2) { Atomics.wait(waitBuffer, 0, 0, ms); }
function alive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  if (process.platform === "win32") {
    const result = spawnSync("tasklist", ["/FI", `PID eq ${pid}`, "/NH"], { encoding: "utf8", windowsHide: true });
    return result.status === 0 && new RegExp(`\\b${pid}\\b`).test(result.stdout ?? "");
  }
  try { process.kill(pid, 0); return true; } catch { return false; }
}
export function processIdentity(pid) {
  if (!Number.isInteger(pid) || pid < 1 || process.platform === "win32") return null;
  const result = spawnSync("ps", ["-o", "uid=", "-o", "stat=", "-o", "lstart=", "-p", String(pid)], { encoding: "utf8", windowsHide: true });
  const match = String(result.stdout ?? "").trim().match(/^(\d+)\s+(\S+)\s+(.+)$/);
  // A killed detached manager can remain a child-process zombie until its
  // original parent reaps it.  It cannot hold a lock or supervise providers.
  return result.status === 0 && match && !match[2].startsWith("Z") ? { pid, uid: Number(match[1]), started: match[3] } : null;
}
export function currentOwnerIdentity() { return processIdentity(process.pid); }
export function ownerConfirmedDead(owner) {
  if (!owner || !Number.isInteger(owner.pid) || !Number.isInteger(owner.uid) || typeof owner.started !== "string") return false;
  const current = processIdentity(owner.pid);
  return current === null || current.uid !== owner.uid || current.started !== owner.started;
}
export function workerIdentityMatches(worker) {
  if (!worker || !Number.isInteger(worker.pid) || !Number.isInteger(worker.uid) || typeof worker.started !== "string") return false;
  const current = processIdentity(worker.pid);
  return current !== null && current.uid === worker.uid && current.started === worker.started;
}
function validProcessIdentity(identity) { return identity && Number.isInteger(identity.pid) && identity.pid > 0 && Number.isInteger(identity.uid) && typeof identity.started === "string"; }
function sameProcessIdentity(left, right) {
  return validProcessIdentity(left) && validProcessIdentity(right)
    && left.pid === right.pid && left.uid === right.uid && left.started === right.started;
}
function terminationKey(identity) { return JSON.stringify([identity.pid, identity.uid, identity.started]); }
function clearTerminationEscalation(identity) {
  if (!validProcessIdentity(identity)) return;
  const key = terminationKey(identity); const escalation = terminationEscalations.get(key);
  if (escalation?.timer) clearTimeout(escalation.timer);
  terminationEscalations.delete(key);
}
export function terminateProcessTreeWithEscalation(pid, worker, graceMs = 5_000) {
  if (!validProcessIdentity(worker) || !workerIdentityMatches(worker)) return false;
  const key = terminationKey(worker); const existing = terminationEscalations.get(key);
  if (existing?.phase === "sigterm") return true;
  if (existing?.phase === "sigkill") return workerIdentityMatches(worker) && terminateProcessTree(pid, "SIGKILL");
  if (!terminateProcessTree(pid, "SIGTERM")) return false;
  const escalation = { phase: "sigterm", timer: null };
  terminationEscalations.set(key, escalation);
  escalation.timer = setTimeout(() => {
    if (terminationEscalations.get(key) !== escalation) return;
    if (!workerIdentityMatches(worker)) { terminationEscalations.delete(key); return; }
    escalation.phase = "sigkill";
    escalation.timer = null;
    terminateProcessTree(pid, "SIGKILL");
  }, graceMs);
  escalation.timer.unref?.();
  return true;
}
function providerMayStillBeAlive(item) {
  // Keep the guardian/runtime until the reaper has persisted confirmation,
  // not merely until one racing observer first sees the PID disappear.
  if (item?.cleanup_status === "cleanup_pending") return true;
  if (item?.status !== "running") return false;
  return !validProcessIdentity(item.worker) || workerIdentityMatches(item.worker);
}
function runtimeHasLiveOrUnverifiedWorker(state) { return Object.values(state.providers ?? {}).some(providerMayStillBeAlive); }
function write(target, value) { const temp = `${target}.${process.pid}.${randomUUID()}.tmp`; fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 }); fs.renameSync(temp, target); }
function owner(directory) { try { return JSON.parse(fs.readFileSync(path.join(directory, "owner.json"), "utf8")); } catch { return null; } }
function fileOwner(target) { try { return JSON.parse(fs.readFileSync(target, "utf8")); } catch { return null; } }
function staleOwner(current) {
  if (current && Number.isInteger(current.uid) && typeof current.started === "string") return ownerConfirmedDead(current);
  // Pre-identity locks may be reclaimed only when their recorded PID no
  // longer exists. An alive legacy PID is intentionally not trusted: it could
  // have been reused by an unrelated process.
  if (current && Number.isInteger(current.pid)) return !alive(current.pid);
  return false;
}
function stale(directory, _graceMs) { return staleOwner(owner(directory)); }
function acquireStateLock(root, runtime_id) {
  const runtime = path.join(root, runtime_id); const target = path.join(runtime, ".state-lock.json"); const reaper = path.join(runtime, ".state-lock-reaper"); const token = randomUUID(); const deadline = now() + 5_000;
  while (now() < deadline) {
    if (fs.existsSync(reaper)) { pause(); continue; }
    const temporary = `${target}.${process.pid}.${token}.tmp`;
    try {
      // Write a complete owner record before the atomic link makes the lock
      // visible. A reaper never observes a live lock without identity.
      fs.writeFileSync(temporary, `${JSON.stringify({ version: 1, token, ...currentOwnerIdentity(), created_at_ms: now() })}\n`, { mode: 0o600, flag: "wx" }); fs.linkSync(temporary, target); fs.unlinkSync(temporary); return { file: target, token };
    }
    catch (error) {
      try { fs.rmSync(temporary, { force: true }); } catch { /* best effort */ }
      if (error?.code !== "EEXIST") throw error;
      try { fs.mkdirSync(reaper, { mode: 0o700 }); try { const current = fileOwner(target); if (!current || staleOwner(current)) fs.rmSync(target, { force: true }); } finally { fs.rmSync(reaper, { recursive: true, force: true }); } }
      catch (reapError) { if (reapError?.code !== "EEXIST") throw reapError; pause(); }
    }
  }
  fail("RUNTIME_BUSY", "runtime state is locked by another broker");
}
function releaseLock(claim) {
  try {
    if (claim.file) { if (fileOwner(claim.file)?.token === claim.token) fs.rmSync(claim.file, { force: true }); }
    else if (owner(claim.directory)?.token === claim.token) fs.rmSync(claim.directory, { recursive: true, force: true });
  } catch { /* a crashed owner is recovered by the next caller */ }
}
function unlockForRemoval(target) {
  const stat = fs.lstatSync(target); if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(target)) unlockForRemoval(path.join(target, child));
    fs.chmodSync(target, 0o700);
  } else fs.chmodSync(target, 0o600);
}
export function removeRuntimeDirectory(root, runtime_id) {
  if (!/^[0-9a-f-]{36}$/i.test(runtime_id)) fail("REQUEST_INVALID", "runtime_id must be a UUID");
  removeDirectory(path.join(root, runtime_id));
}
function removeDirectory(target) {
  if (!fs.existsSync(target)) return;
  unlockForRemoval(target); fs.rmSync(target, { recursive: true, force: true });
}

export function cleanup(root, ttlHours) {
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const removed = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    if (entry.name === "managed-requests") continue;
    const target = file(root, entry.name);
    let state = null;
    try {
      state = JSON.parse(fs.readFileSync(target, "utf8"));
      // A managed session has a detached manager and publishes its own public
      // terminal result.  A short-lived start/status caller is not its owner;
      // never turn that caller loss into an implicit provider cancellation.
      if (state.managed?.version === 1 && state.managed.operations?.some((operation) => operation.state !== "terminal")) continue;
      const orphaned = Object.values(state.providers ?? {}).some((item) => item.status === "running" || item.cleanup_status === "cleanup_pending");
      // Keep the runtime directory and guardian while an exact worker is still
      // alive (or its identity cannot be verified). The shared reaper owns the
      // SIGTERM -> SIGKILL escalation and marks terminal only after confirmation.
      if (orphaned && ownerConfirmedDead(state.owner) && /^[0-9a-f-]{36}$/i.test(entry.name)) {
        reapRuntimeIfOwnerDead(root, entry.name);
        try { state = JSON.parse(fs.readFileSync(target, "utf8")); } catch { continue; }
      }
      const running = runtimeHasLiveOrUnverifiedWorker(state);
      if (!running && (!Number.isFinite(state.expires_at_ms) || state.expires_at_ms <= now())) { removeDirectory(path.join(root, entry.name)); removed.push(entry.name); }
    } catch {
      // A successfully parsed runtime remains authoritative even if reaping
      // or its state write failed. Never age-delete evidence of a live,
      // unverifiable, or cleanup-pending worker.
      if (state && runtimeHasLiveOrUnverifiedWorker(state)) continue;
      // This root is broker-owned. A crash between temp-write and rename must
      // not create a directory that can never be collected.
      try { if (now() - fs.statSync(path.join(root, entry.name)).mtimeMs > ttlHours * 3_600_000) { removeDirectory(path.join(root, entry.name)); removed.push(entry.name); } } catch { /* leave a currently changing directory alone */ }
    }
  }
  cleanupManagedRequestBindings(root);
  return removed;
}

function cleanupManagedRequestBindings(root) {
  const directory = path.join(root, "managed-requests");
  let entries; try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const binding = path.join(directory, entry.name, "binding.json");
    try {
      const value = JSON.parse(fs.readFileSync(binding, "utf8"));
      if (!/^[0-9a-f-]{36}$/i.test(value.runtime_id) || !fs.existsSync(file(root, value.runtime_id))) fs.rmSync(path.join(directory, entry.name), { recursive: true, force: true });
    } catch { fs.rmSync(path.join(directory, entry.name), { recursive: true, force: true }); }
  }
}

export function createRuntime(root, ttlHours, host, orphanTimeoutMs = 30_000) {
  const runtime_id = randomUUID(); const directory = path.join(root, runtime_id); fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const state = { version: 4, runtime_id, host_provider: host, created_at_ms: now(), expires_at_ms: now() + ttlHours * 3_600_000, orphan_timeout_ms: orphanTimeoutMs, owner: { ...currentOwnerIdentity(), started_at_ms: now() }, round: 0, providers: {} };
  write(path.join(directory, "state.json"), state); return state;
}

export function readRuntime(root, runtime_id) {
  if (!/^[0-9a-f-]{36}$/i.test(runtime_id)) fail("REQUEST_INVALID", "runtime_id must be a UUID");
  try { const state = JSON.parse(fs.readFileSync(file(root, runtime_id), "utf8")); if (state.runtime_id !== runtime_id) fail("RUNTIME_INVALID", "runtime state does not match runtime_id"); return state; }
  catch (error) { if (error?.code) throw error; fail("RUNTIME_NOT_FOUND", `runtime is unavailable: ${error.message}`); }
}

export function updateRuntime(root, runtime_id, update) {
  const claim = acquireStateLock(root, runtime_id);
  try { const state = readRuntime(root, runtime_id); const next = update(structuredClone(state)); write(file(root, runtime_id), next); return next; }
  finally { releaseLock(claim); }
}

export function updateRunningProvider(root, runtime_id, provider, patch) {
  return updateRuntime(root, runtime_id, (next) => {
    const current = next.providers?.[provider];
    if (!current || current.status !== "running") return next;
    return { ...next, providers: { ...next.providers, [provider]: { ...current, ...patch } } };
  });
}

export function reapRuntimeIfOwnerDead(root, runtime_id, { allowManaged = false } = {}) {
  const state = readRuntime(root, runtime_id);
  const activeManaged = state.managed?.version === 1 ? state.managed.operations?.find((operation) => operation.state !== "terminal") : null;
  if (!allowManaged && activeManaged && !sameProcessIdentity(state.owner, activeManaged.manager)) {
    return { reaped: false, running: runtimeHasLiveOrUnverifiedWorker(state) };
  }
  if (!ownerConfirmedDead(state.owner)) return { reaped: false, running: runtimeHasLiveOrUnverifiedWorker(state) };
  const orphaned = Object.entries(state.providers ?? {}).filter(([, item]) => item.status === "running" || item.cleanup_status === "cleanup_pending");
  const confirmedGone = new Set();
  for (const [provider, item] of orphaned) {
    if (!validProcessIdentity(item.worker)) continue;
    if (workerIdentityMatches(item.worker)) terminateProcessTreeWithEscalation(item.pid, item.worker);
    else { clearTerminationEscalation(item.worker); confirmedGone.add(provider); }
  }
  const needsWrite = orphaned.some(([provider, item]) => confirmedGone.has(provider)
    ? item.status !== "failed" || item.cleanup_status !== "confirmed" || item.error?.code !== "ORPHANED_BROKER"
    : item.status !== "running" || item.cleanup_status !== "cleanup_pending" || item.orphan !== true || item.dispatch_status !== "dispatched_unavailable");
  if (needsWrite) updateRuntime(root, runtime_id, (next) => {
    if (!ownerConfirmedDead(next.owner)) return next;
    const completed = now(); const observed = new Map(orphaned);
    return { ...next, providers: Object.fromEntries(Object.entries(next.providers ?? {}).map(([id, item]) => {
      const previous = observed.get(id);
      if (!previous || (validProcessIdentity(previous.worker) && !sameProcessIdentity(item.worker, previous.worker))
        || (!validProcessIdentity(previous.worker) && validProcessIdentity(item.worker))) return [id, item];
      // Another guardian/status caller may have observed this exact worker
      // alive before acquiring the state lock. Recheck under the lock so a
      // stale pending write can never overwrite a confirmed cleanup.
      const goneNow = confirmedGone.has(id)
        || (validProcessIdentity(item.worker) && !workerIdentityMatches(item.worker));
      if (goneNow) {
        return [id, { ...item, status: "failed", completed_at_ms: completed, error: { code: "ORPHANED_BROKER", message: "provider outlived its broker" }, cancellation_source: item.cancellation_source ?? "broker_lost", dispatch_status: "dispatched_unavailable", orphan: true, cleanup_status: "confirmed" }];
      }
      const pending = { ...item, status: "running", cancellation_source: item.cancellation_source ?? "broker_lost", dispatch_status: "dispatched_unavailable", orphan: true, cleanup_status: "cleanup_pending" };
      delete pending.completed_at_ms;
      if (pending.error?.code === "ORPHANED_BROKER") delete pending.error;
      return [id, pending];
    })) };
  });
  const latest = readRuntime(root, runtime_id);
  const running = runtimeHasLiveOrUnverifiedWorker(latest);
  return { reaped: orphaned.length > 0 && !running, running };
}

const guardianProgram = fileURLToPath(new URL("./runtime-guardian.mjs", import.meta.url));
export function ensureRuntimeGuardian(root, runtime_id) {
  const runtime = runtimeDirectory(root, runtime_id); const directory = path.join(runtime, ".guardian");
  try { fs.mkdirSync(directory, { mode: 0o700 }); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    let owner = null; try { owner = JSON.parse(fs.readFileSync(path.join(directory, "owner.json"), "utf8")); } catch {}
    if (!ownerConfirmedDead(owner)) return false;
    fs.rmSync(directory, { recursive: true, force: true }); fs.mkdirSync(directory, { mode: 0o700 });
  }
  const child = spawn(process.execPath, [guardianProgram, root, runtime_id], { detached: true, stdio: "ignore" }); child.unref();
  const identity = processIdentity(child.pid);
  if (!identity) {
    terminateProcessTree(child.pid, "SIGTERM");
    fs.rmSync(directory, { recursive: true, force: true });
    fail("RUNTIME_GUARDIAN_START_FAILED", "guardian process identity could not be verified");
  }
  fs.writeFileSync(path.join(directory, "owner.json"), `${JSON.stringify({ ...identity, guardian_pid: child.pid })}\n`, { mode: 0o600, flag: "wx" });
  return true;
}

export function runtimeDirectory(root, runtime_id) { const state = readRuntime(root, runtime_id); return path.join(root, state.runtime_id); }
export function isAlive(pid) { return Number.isInteger(pid) && pid > 0 && alive(pid); }
export function requestCancellation(root, runtime_id, provider, source = "user") {
  if (!cancellationSources.has(source)) fail("REQUEST_INVALID", "cancel source must be user, workflow_shutdown, broker_idle_timeout, or broker_max_duration");
  const key = providerRuntimeKey(provider) ?? provider;
  write(path.join(runtimeDirectory(root, runtime_id), `.cancel-${key}`), { version: 1, source });
}
export function cancellationSource(root, runtime_id, provider) {
  const key = providerRuntimeKey(provider) ?? provider;
  try { const raw = fs.readFileSync(path.join(runtimeDirectory(root, runtime_id), `.cancel-${key}`), "utf8").trim(); try { const value = JSON.parse(raw); return value?.version === 1 && cancellationSources.has(value.source) ? value.source : INVALID_CANCELLATION_SOURCE; } catch { return cancellationSources.has(raw) ? raw : INVALID_CANCELLATION_SOURCE; } }
  catch { return null; }
}
export function cancellationRequested(root, runtime_id, provider) { return cancellationSource(root, runtime_id, provider) !== null; }
export function claimProvider(root, runtime_id, provider, staleMs = 30_000) {
  const key = providerRuntimeKey(provider) ?? provider;
  const claims = path.join(runtimeDirectory(root, runtime_id), ".claims"); fs.mkdirSync(claims, { recursive: true, mode: 0o700 }); const directory = path.join(claims, key); const reaper = path.join(claims, `.reap-${key}`);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const token = randomUUID();
    try { fs.mkdirSync(directory, { mode: 0o700 }); fs.writeFileSync(path.join(directory, "owner.json"), `${JSON.stringify({ version: 1, token, ...currentOwnerIdentity(), created_at_ms: now() })}\n`, { mode: 0o600, flag: "wx" }); return { directory, token }; }
    catch (error) {
      if (error?.code !== "EEXIST") { try { fs.rmSync(directory, { recursive: true, force: true }); } catch { /* best effort */ } throw error; }
      try {
        fs.mkdirSync(reaper, { mode: 0o700 });
        try { if (stale(directory, staleMs)) fs.rmSync(directory, { recursive: true, force: true }); else return null; }
        finally { fs.rmSync(reaper, { recursive: true, force: true }); }
      } catch (reapError) { if (reapError?.code !== "EEXIST") throw reapError; pause(); }
    }
  }
  return null;
}
export function releaseProviderClaim(claim) { if (claim) releaseLock(claim); }
export function terminateProcessTree(pid, signal = "SIGTERM") {
  if (!isAlive(pid)) return false;
  if (process.platform === "win32") return spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }).status === 0;
  const descendants = spawnSync("pgrep", ["-P", String(pid)], { encoding: "utf8", windowsHide: true });
  for (const child of String(descendants.stdout ?? "").trim().split(/\s+/).filter(Boolean).map(Number)) terminateProcessTree(child, signal);
  try { process.kill(pid, signal); } catch { return false; }
  return true;
}

export const terminateProcess = terminateProcessTree;
