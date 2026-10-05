import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { execute } from "../lib/process.mjs";
import { jsonProgress } from "../lib/adapters/shared.mjs";
import { terminateProcess } from "../lib/runtime.mjs";

const silent = migratedFilePath(new URL("../test/silent-cli.mjs", import.meta.url));
const stream = migratedFilePath(new URL("../test/stream-cli.mjs", import.meta.url));
const fail = migratedFilePath(new URL("../test/fail-cli.mjs", import.meta.url));
const slow = migratedFilePath(new URL("../test/slow-cli.mjs", import.meta.url));
const duplicate = migratedFilePath(new URL("../test/duplicate-progress-cli.mjs", import.meta.url));
const providerFailure = migratedFilePath(new URL("../test/provider-failure-cli.mjs", import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function plan(command, env = {}) { return { command, argv: [], cwd: fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-process-test-")), input: null, env: { ...process.env, ...env }, redact: [] }; }

test("silent live process emits liveness without activity", async () => {
  const liveness = []; const activity = [];
  const result = await execute(plan(silent), { maxOutputBytes: 4096, livenessIntervalMs: 10, onLiveness: () => liveness.push(Date.now()), onActivity: () => activity.push(Date.now()) });
  assert.equal(result.ok, true);
  assert.ok(liveness.length >= 3);
  assert.deepEqual(activity, []);
  const settled = liveness.length;
  await delay(35);
  assert.equal(liveness.length, settled);
});

test("a healthy provider continues past a legacy time threshold", async () => {
  const result = await execute(plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "80" }), { maxOutputBytes: 4096, livenessIntervalMs: 5 });
  assert.equal(result.ok, true); assert.ok(result.duration_ms >= 60);
});
test("health completion terminates a hanging wrapper without a wall-clock race", async () => {
  const raw = `${JSON.stringify({ type: "session.completed", session_id: "early", text: "done" })}\n`;
  const result = await execute({ ...plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "500" }), probeSession: async () => ({ status: "completed", raw: { stdout: raw, stderr: "" } }) }, { maxOutputBytes: 4096, healthCheckIntervalMs: 1, validateCompleted: () => true });
  assert.equal(result.ok, true); assert.equal(result.health_harvested, true); assert.equal(result.stdout, raw);
});

test("health busy without progress does not terminate a live process", async () => {
  const result = await execute({ ...plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "500" }), probeSession: async () => ({ status: "busy", session_id: "s", cursor: "same", raw: null, error: null, evidence: "busy" }) }, {
    maxOutputBytes: 4096, healthCheckIntervalMs: 10, terminationGraceMs: 10,
  });
  assert.equal(result.ok, true);
  assert.ok(result.duration_ms >= 400);
});

test("PID liveness remains diagnostic for a stream-only provider", async () => {
  const liveness = []; const result = await execute(plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "80" }), { maxOutputBytes: 4096, healthCheckIntervalMs: 10, livenessIntervalMs: 5, onLiveness: (value) => liveness.push(value) });
  assert.ok(liveness.length > 0); assert.equal(result.ok, true);
});

test("sequenced heartbeat events update liveness but never progress", async () => {
  const liveness = [];
  const result = await execute({ ...plan(process.execPath), argv: [duplicate], observeLine: jsonProgress }, { maxOutputBytes: 4096, livenessIntervalMs: 1_000, onLiveness: (value) => liveness.push(value) });
  assert.equal(result.ok, true); assert.equal(result.progress_events, 0); assert.equal(result.last_progress_at_ms, null); assert.ok(liveness.length >= 4);
});

test("dead health is diagnostic and does not terminate a live process", async () => {
  const started = Date.now(); const result = await execute({ ...plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "80" }), probeSession: async () => ({ status: "dead", session_id: null, cursor: null, raw: null, error: { code: "PROCESS_DEAD" }, evidence: "dead" }) }, { maxOutputBytes: 4096, healthCheckIntervalMs: 10 });
  assert.equal(result.ok, true); assert.ok(Date.now() - started >= 50);
});

test("an injected diagnostic health probe does not override process completion", async () => {
  let planCalls = 0; let injectedCalls = 0;
  const result = await execute({ ...plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "80" }), probeSession: async () => { planCalls += 1; return { status: "busy", session_id: null, cursor: null, raw: null, error: null, evidence: "adapter" }; } }, { maxOutputBytes: 4096, healthCheckIntervalMs: 10, probeSession: async () => { injectedCalls += 1; return { status: "dead", session_id: null, cursor: null, raw: null, error: { code: "PROCESS_DEAD" }, evidence: "injected" }; } });
  assert.equal(result.ok, true); assert.ok(injectedCalls > 0); assert.equal(planCalls, 0);
});

test("PID liveness with unchanged health remains non-terminal", async () => {
  const liveness = []; const result = await execute({ ...plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "200" }), probeSession: async () => ({ status: "busy", session_id: "s", cursor: "same", raw: null, error: null, evidence: "unchanged" }) }, { maxOutputBytes: 4096, healthCheckIntervalMs: 10, livenessIntervalMs: 2, onLiveness: (value) => liveness.push(value) });
  assert.ok(liveness.length > 5); assert.equal(result.ok, true);
});

test("completed health raw is harvested and a hanging wrapper is internally terminated", async () => {
  const raw = `${JSON.stringify({ type: "session.completed", session_id: "health-session", text: "health opinion" })}\n`;
  const result = await execute({ ...plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "80" }), probeSession: async () => ({ status: "completed", session_id: "health-session", cursor: "done", raw: { stdout: raw, stderr: "" }, error: null, evidence: "terminal" }) }, { maxOutputBytes: 4096, healthCheckIntervalMs: 10, validateCompleted: (value) => value.stdout === raw });
  assert.equal(result.ok, true); assert.equal(result.stdout, raw); assert.equal(result.health_harvested, true); assert.equal(result.error, undefined);
});

test("stream-only provider silence is governed by process exit, not an implicit timeout", async () => {
  const result = await execute(plan(silent, { THIRD_REVIEW_TEST_DURATION_MS: "80" }), { maxOutputBytes: 4096, healthCheckIntervalMs: 10 });
  assert.equal(result.ok, true); assert.ok(result.duration_ms >= 50);
});

test("stream output reports activity and monitors stop after close or error", async () => {
  const activity = []; const liveness = [];
  const streamed = await execute(plan(stream), { maxOutputBytes: 4096, livenessIntervalMs: 5, onLiveness: () => liveness.push(Date.now()), onActivity: () => activity.push(Date.now()) });
  assert.equal(streamed.ok, true);
  assert.ok(activity.length >= 3);
  const afterClose = liveness.length;
  await delay(25);
  assert.equal(liveness.length, afterClose);

  const failedLiveness = [];
  const failed = await execute(plan(fail), { maxOutputBytes: 4096, livenessIntervalMs: 5, onLiveness: () => failedLiveness.push(Date.now()) });
  assert.equal(failed.ok, false);
  const afterError = failedLiveness.length;
  await delay(25);
  assert.equal(failedLiveness.length, afterError);
});

test("external termination stops liveness monitoring", async () => {
  let pid = null; const liveness = [];
  const started = Date.now(); const running = execute(plan(slow), { maxOutputBytes: 4096, livenessIntervalMs: 5, onStart: (value) => { pid = value; }, onLiveness: () => liveness.push(Date.now()) });
  while (pid === null || liveness.length < 2) await delay(5);
  assert.equal(terminateProcess(pid), true);
  const result = await running;
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_DEAD");
  assert.ok(Date.now() - started < 500);
  const settled = liveness.length;
  await delay(25);
  assert.equal(liveness.length, settled);
});

test("large stdin write to an immediately exiting provider is a structured failure", async () => {
  const result = await execute({
    command: process.execPath,
    argv: ["-e", "process.exit(0)"],
    cwd: fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-process-test-")),
    input: "x".repeat(1024 * 1024),
    env: process.env,
    redact: [],
  }, { maxOutputBytes: 4096 });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_STDIN_FAILED");
});

test("large output is streamed without terminating the provider", async () => {
  const raw = [];
  const result = await execute({ ...plan(process.execPath), argv: ["-e", "process.stdout.write('x'.repeat(20000))"] }, { maxOutputBytes: 128, onOutput: ({ chunk }) => raw.push(chunk) });
  assert.equal(result.ok, true);
  assert.equal(raw.join("").length, 20_000);
  assert.equal(result.stdout_truncated, true);
  assert.match(result.stdout, /retained privately/);
});

test("a provider line cannot grow the pending-line buffer without bound", async () => {
  const result = await execute({ ...plan(process.execPath), argv: ["-e", "process.stdout.write('x'.repeat(20000))"] }, { maxOutputBytes: 4096, maxPendingLineBytes: 128 });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROVIDER_OUTPUT_LINE_TOO_LARGE");
});

test("provider failure classification ignores review material on stdout", async () => {
  const result = await execute({ ...plan(process.execPath), argv: [providerFailure], observeLine: (streamName, line) => {
    if (streamName !== "stdout") return {};
    try {
      const value = JSON.parse(line);
      return { progress: true, session_id: value.session_id, cursor: value.id ?? null };
    } catch { return {}; }
  } }, { maxOutputBytes: 4096 });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROVIDER_HEALTH_FAILED");
  assert.equal(result.error.message, "provider session reported a terminal failure");
  assert.equal(result.session_id, "ses_failure_fixture");
});

test("an adapter can write follow-up stdin after observing provider output", async () => {
  const source = "process.stdout.write('ready\\n'); process.stdin.once('data', (chunk) => { if (chunk.toString() === 'prompt\\n') process.stdout.write('done\\n'); else process.exit(1); }); process.stdin.once('end', () => process.exit(0));";
  const result = await execute({
    ...plan(process.execPath),
    argv: ["-e", source],
    keepStdinOpen: true,
    observeLine: (_stream, line) => line === "ready" ? { stdin_write: "prompt\n" } : line === "done" ? { terminal: { state: "completed", wait_for_close: true } } : {},
  }, { maxOutputBytes: 4096 });
  assert.equal(result.ok, true);
  assert.match(result.stdout, /done/);
});
