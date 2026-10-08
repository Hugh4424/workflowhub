import assert from "node:assert/strict";
import { test } from "vitest";
import { createHealthRunner } from "../lib/health-runner.mjs";

class FakeClock {
  nowMs = 0; nextId = 1; timers = new Map();
  now = () => this.nowMs;
  setTimeout = (fn, delay) => { const id = this.nextId++; this.timers.set(id, { at: this.nowMs + delay, fn }); return id; };
  clearTimeout = (id) => { this.timers.delete(id); };
  async tick(ms) { const target = this.nowMs + ms; while (true) { const next = [...this.timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; this.timers.delete(next[0]); this.nowMs = next[1].at; next[1].fn(); await Promise.resolve(); await Promise.resolve(); } this.nowMs = target; await Promise.resolve(); await Promise.resolve(); }
}
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
function setup(options = {}) { const clock = new FakeClock(); const decisions = []; const diagnostics = []; const runner = createHealthRunner({ clock, onDecision: (value) => decisions.push(value), onDiagnostic: (value) => diagnostics.push(value), ...options }); runner.start(); return { clock, decisions, diagnostics, runner }; }

test("health probes start at the default 60 second interval and never overlap", async () => {
  const pending = deferred(); let calls = 0; const { clock, runner } = setup({ probeSession: () => { calls += 1; return pending.promise; } });
  await clock.tick(59_999); assert.equal(calls, 0); await clock.tick(1); assert.equal(calls, 1); await clock.tick(60_000); assert.equal(calls, 1);
  pending.resolve({ status: "busy", session_id: "s", cursor: "c", raw: null, error: null, evidence: "running" }); await clock.tick(0); runner.stop();
});

test("completed health harvest requires parseable raw", async () => {
  const valid = setup({ intervalMs: 10, probeSession: async () => ({ status: "completed", session_id: "s", cursor: "done", raw: { stdout: "FINAL", stderr: "" }, error: null, evidence: "terminal" }), validateCompleted: (raw) => raw.stdout === "FINAL" });
  await valid.clock.tick(10); assert.equal(valid.decisions[0].status, "completed"); assert.deepEqual(valid.decisions[0].raw, { stdout: "FINAL", stderr: "" });
  const invalid = setup({ intervalMs: 10, probeSession: async () => ({ status: "completed", session_id: "s", cursor: null, raw: { stdout: "PARTIAL", stderr: "" }, error: null, evidence: "terminal" }), validateCompleted: () => false });
  await invalid.clock.tick(10); assert.deepEqual(invalid.decisions, []); assert.equal(invalid.diagnostics[0].code, "HEALTH_INVALID"); invalid.runner.stop();
});

test("abort-aware probe deadlines settle before a later probe may start", async () => {
  let active = 0; let maxActive = 0; let calls = 0; const probeSession = ({ signal }) => new Promise((resolve, reject) => { assert.ok(signal instanceof AbortSignal); active += 1; maxActive = Math.max(maxActive, active); calls += 1; signal.addEventListener("abort", () => { active -= 1; reject(new Error("aborted")); }, { once: true }); });
  const { clock, decisions, diagnostics } = setup({ intervalMs: 10, probeDeadlineMs: 3, probeSession });
  await clock.tick(10); assert.equal(active, 1); await clock.tick(3); assert.equal(active, 0); assert.equal(calls, 1); assert.deepEqual(decisions, []);
  await clock.tick(10); assert.equal(active, 1); await clock.tick(3); assert.equal(active, 0); assert.deepEqual(decisions, []); assert.ok(diagnostics.some((item) => item.code === "HEALTH_UNVERIFIABLE")); assert.equal(maxActive, 1);
});

test("a probe that ignores abort is PROBE_ABORT_FAILED after grace without a second probe", async () => {
  let calls = 0; const { clock, decisions, diagnostics, runner } = setup({ intervalMs: 10, probeDeadlineMs: 3, probeAbortGraceMs: 2, probeSession: () => { calls += 1; return new Promise(() => {}); } });
  await clock.tick(13); assert.deepEqual(decisions, []); await clock.tick(2); assert.equal(diagnostics[0].code, "PROBE_ABORT_FAILED"); assert.equal(runner.snapshot().unverifiable, 0); await clock.tick(100); assert.ok(calls > 1); runner.stop();
});

test("runner stop aborts an active probe and leaves no closure timer", async () => {
  let active = 0; const { clock, decisions, runner } = setup({ intervalMs: 10, probeDeadlineMs: 100, probeSession: ({ signal }) => new Promise((resolve, reject) => { active += 1; signal.addEventListener("abort", () => { active -= 1; reject(new Error("stopped")); }, { once: true }); }) });
  await clock.tick(10); assert.equal(active, 1); runner.stop(); await clock.tick(0); assert.equal(active, 0); assert.equal(clock.timers.size, 0); assert.deepEqual(decisions, []);
});

test("runner cancellation aborts an active probe before publishing CANCELLED", async () => {
  let active = 0; const { clock, decisions, runner } = setup({ intervalMs: 10, probeDeadlineMs: 100, probeSession: ({ signal }) => new Promise((resolve, reject) => { active += 1; signal.addEventListener("abort", () => { active -= 1; reject(new Error("cancelled")); }, { once: true }); }) });
  await clock.tick(10); assert.equal(active, 1); runner.cancel(); await clock.tick(0); assert.equal(active, 0); assert.equal(decisions[0].error.code, "CANCELLED"); assert.equal(clock.timers.size, 0);
});

test("new structured progress wins a stale dead probe and updates cursor", async () => {
  const pending = deferred(); const { clock, decisions, runner } = setup({ intervalMs: 10, probeDeadlineMs: 100, probeSession: () => pending.promise });
  await clock.tick(10); runner.noteProgress({ cursor: "stream-2" }); pending.resolve({ status: "dead", session_id: "s", cursor: "old", raw: null, error: { code: "PROCESS_DEAD" }, evidence: "stale" }); await clock.tick(0);
  assert.deepEqual(decisions, []); assert.equal(runner.snapshot().cursor, "stream-2"); runner.stop();
});

test("explicit cancellation remains terminal even when probe is advisory", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10, probeSession: async () => ({ status: "dead", session_id: "s", cursor: null, raw: null, error: null, evidence: "dead" }) });
  runner.cancel(); await clock.tick(10); assert.equal(decisions[0].error.code, "CANCELLED");
});

test("an adapter-marked terminal provider failure ends supervision immediately", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10, probeSession: async () => ({
    status: "unverifiable", terminal: true, session_id: "s", cursor: "idle", raw: null,
    error: { code: "PROVIDER_PERMISSION_DENIED", message: "provider permission was denied" },
    evidence: "permission denial",
  }) });
  await clock.tick(10);
  assert.deepEqual(decisions[0], {
    status: "failed",
    error: { code: "PROVIDER_PERMISSION_DENIED", message: "provider permission was denied" },
    evidence: "permission denial",
    session_id: "s",
    cursor: "idle",
  });
  assert.equal(runner.snapshot().stopped, true);
});

test("adapters without a probe do not turn stream silence into an idle timeout", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10 }); await clock.tick(1_000); assert.deepEqual(decisions, []); runner.noteProgress({ cursor: "event-1" }); await clock.tick(1_000); assert.deepEqual(decisions, []); runner.stop();
});

test("unchanged busy health ends as PROCESS_STALLED after five no-progress intervals", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10, probeSession: async () => ({ status: "busy", session_id: "s", cursor: "same", raw: null, error: null, evidence: "busy" }) });
  await clock.tick(50); assert.deepEqual(decisions, []);
  await clock.tick(10); assert.equal(decisions.length, 1); assert.equal(decisions[0].status, "failed"); assert.equal(decisions[0].error.code, "PROCESS_STALLED"); assert.equal(decisions[0].session_id, "s"); assert.equal(decisions[0].cursor, "same"); assert.equal(clock.timers.size, 0); runner.stop();
});

test("default health supervision ends an unchanged busy provider after five no-progress checks", async () => {
  const { clock, decisions, runner } = setup({ probeSession: async () => ({ status: "busy", session_id: "s", cursor: "same", raw: null, error: null, evidence: "busy" }) });
  await clock.tick(5 * 60_000); assert.deepEqual(decisions, []);
  await clock.tick(60_000); assert.equal(decisions[0].error.code, "PROCESS_STALLED");
  runner.stop();
});

test("default health supervision lets a moving busy cursor run beyond sixteen minutes", async () => {
  let cursor = 0;
  const { clock, decisions, runner } = setup({ probeSession: async () => ({ status: "busy", session_id: "s", cursor: `moving-${++cursor}`, raw: null, error: null, evidence: "busy" }) });
  await clock.tick(16 * 60_000); assert.deepEqual(decisions, []); assert.equal(runner.snapshot().stagnant, 0); runner.stop();
});

test("unchanged progressing and retry statuses remain diagnostic", async () => {
  for (const status of ["progressing", "retry"]) {
    const { clock, decisions, diagnostics, runner } = setup({ intervalMs: 10, probeSession: async () => ({ status, session_id: "s", cursor: "same", raw: null, error: null, evidence: status }) });
    await clock.tick(60); assert.deepEqual(decisions, [], status); assert.equal(diagnostics[0].code, status === "progressing" ? "HEALTH_PROGRESSING" : "HEALTH_RETRY", status); runner.stop();
  }
});

test("changing probe cursor keeps a long-running provider healthy", async () => {
  let cursor = 0; const { clock, decisions, runner } = setup({ intervalMs: 10, probeSession: async () => ({ status: "busy", session_id: "s", cursor: `c-${++cursor}`, raw: null, error: null, evidence: "moving" }) });
  await clock.tick(120); assert.deepEqual(decisions, []); assert.equal(runner.snapshot().stagnant, 0); runner.stop();
});

test("stream progress resets an almost-stalled busy provider", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10, probeSession: async ({ cursor }) => ({ status: "busy", session_id: "s", cursor: cursor ?? "same", raw: null, error: null, evidence: "busy" }) });
  await clock.tick(50); assert.deepEqual(decisions, []); runner.noteProgress({ cursor: "stream-new" });
  await clock.tick(40); assert.deepEqual(decisions, []); await clock.tick(10); assert.equal(decisions[0].error.code, "PROCESS_STALLED"); runner.stop();
});

test("streamProgress silence ends on the fifth health interval", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10, streamProgress: true });
  await clock.tick(40); assert.deepEqual(decisions, []);
  await clock.tick(10); assert.equal(decisions[0].error.code, "PROCESS_STALLED"); assert.equal(clock.timers.size, 0); runner.stop();
});

test("streamProgress resets an almost-stalled stream and has no total duration limit", async () => {
  const { clock, decisions, runner } = setup({ intervalMs: 10, streamProgress: true });
  for (let index = 0; index < 300; index += 1) { runner.noteProgress({ cursor: `${index}:DONE` }); await clock.tick(10); }
  await clock.tick(40); assert.deepEqual(decisions, []); runner.noteProgress({ cursor: "new:DONE" });
  await clock.tick(40); assert.deepEqual(decisions, []);
  await clock.tick(20); assert.equal(decisions[0].error.code, "PROCESS_STALLED"); runner.stop();
});

test("cancellation wins when streamProgress would otherwise stall", async () => {
  let cancelled = false;
  const { clock, decisions, runner } = setup({ intervalMs: 10, streamProgress: true, isCancelled: () => cancelled });
  await clock.tick(40); cancelled = true; await clock.tick(10);
  assert.equal(decisions.length, 1); assert.equal(decisions[0].error.code, "CANCELLED"); runner.stop();
});
