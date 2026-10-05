import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import pi, { createPiProbe } from "../lib/adapters/pi.mjs";
import { execute } from "../lib/process.mjs";
import { isAlive } from "../lib/runtime.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const fake = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-pi-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-pi-health-"));
const provider = (overrides = {}) => ({ id: "pi", command: fake, model: "deepseek/deepseek-v4-flash", effort: "low", thinking: null, auth: { type: "native", env: [] }, env: [], ...overrides });
const SESSION = "5f0e8f4c-1111-4222-8333-abcdefabcdef";
const message = (id, role, extra = {}) => ({ type: "message", id, parentId: null, timestamp: "fixture", message: { role, content: [{ type: "text", text: `${id}-text` }], ...extra } });
const user = message("entry-user", "user");
const assistant = (extra = {}) => message("entry-assistant", "assistant", { stopReason: "stop", model: "k3", usage: { totalTokens: 9 }, ...extra });
const snapshot = (overrides = {}) => ({ version: 1, session_id: SESSION, is_streaming: false, entries: [], leaf_id: null, baseline_leaf_id: null, baseline_known: true, ...overrides });
const probeWith = (value) => createPiProbe({ url: "http://127.0.0.1:49152", expectedSession: SESSION, fetchImpl: async () => ({ ok: true, json: async () => value }) });
const responseWith = (body, ok = true) => ({ ok, json: async () => body });
const waitFor = async (check, timeoutMs = 2_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) { if (check()) return true; await new Promise((resolve) => setTimeout(resolve, 20)); }
  return check();
};

test("Pi probe reports a streaming session as non-terminal activity", async () => {
  const streaming = snapshot({ is_streaming: true, entries: [user, assistant()], leaf_id: user.id, baseline_leaf_id: user.id });
  const busy = await probeWith(streaming)({ session_id: SESSION, cursor: user.id });
  assert.equal(busy.status, "busy");
  assert.equal(busy.terminal, undefined);
  assert.equal(busy.raw, null);
  assert.equal(busy.session_id, SESSION);
  const progressed = await probeWith(streaming)({ session_id: SESSION, cursor: "older-leaf" });
  assert.equal(progressed.status, "progressing");
  assert.equal(progressed.cursor, user.id);
  assert.equal(progressed.terminal, undefined);
});

test("Pi probe classifies a terminal assistant error with the stream parser whitelist", async () => {
  const terminal = (errorMessage) => snapshot({ entries: [user, assistant({ stopReason: "error", errorMessage })], leaf_id: "entry-assistant", baseline_leaf_id: user.id });
  const limited = await probeWith(terminal("429 The engine is currently overloaded, please try again later"))({ session_id: SESSION });
  assert.equal(limited.status, "failed");
  assert.equal(limited.terminal, true);
  assert.deepEqual(limited.error, { code: "RATE_LIMITED", message: "provider rate limit was reached" });
  assert.equal((await probeWith(terminal("401 unauthorized"))({ session_id: SESSION })).error.code, "AUTHENTICATION_FAILED");
  assert.equal((await probeWith(terminal("provider internal failure"))({ session_id: SESSION })).error.code, "PROVIDER_HEALTH_FAILED");
});

test("Pi probe harvests a settled terminal assistant as parser-valid raw", async () => {
  const done = snapshot({ entries: [user, assistant()], leaf_id: "entry-assistant", baseline_leaf_id: user.id });
  const result = await probeWith(done)({ session_id: SESSION, cursor: user.id });
  assert.equal(result.status, "completed");
  assert.equal(result.cursor, "entry-assistant");
  assert.equal(result.error, null);
  assert.deepEqual(pi.parse(result.raw.stdout, result.raw.stderr, SESSION), { ok: true, text: "entry-assistant-text", session_id: SESSION, usage: { totalTokens: 9 } });
  assert.equal(pi.parse(result.raw.stdout, result.raw.stderr, "another-session").ok, false);
});

test("Pi probe never harvests a terminal entry left behind by an earlier round", async () => {
  const previous = assistant();
  const resumed = snapshot({ entries: [user, previous], leaf_id: previous.id, baseline_leaf_id: previous.id, baseline_known: true });
  const result = await probeWith(resumed)({ session_id: SESSION, cursor: previous.id });
  assert.equal(result.status, "busy");
  assert.equal(result.terminal, undefined);
  assert.equal(result.raw, null);
  assert.match(result.evidence, /has not accepted this round's prompt/i);
  const unknownBaseline = await probeWith({ ...resumed, baseline_known: false })({ session_id: SESSION });
  assert.equal(unknownBaseline.status, "busy");
  assert.equal(unknownBaseline.raw, null);
});

test("Pi probe reports a settled session without a terminal assistant as no terminal result", async () => {
  const cases = [
    { entries: [user, assistant({ stopReason: "aborted" })], evidence: /aborted/i },
    { entries: [user, assistant({ stopReason: "toolUse" })], evidence: /tool calls/i },
    { entries: [user, assistant({ stopReason: "length" })], evidence: /output limit/i },
    { entries: [user, assistant({ stopReason: "stop" })], replace: { text: "" }, evidence: /terminal assistant result/i },
    { entries: [user, message("entry-tool", "toolResult")], evidence: /terminal assistant result/i },
  ];
  for (const value of cases) {
    const entries = value.replace?.text === "" ? [user, message("entry-assistant", "assistant", { stopReason: "stop", content: [] })] : value.entries;
    const result = await probeWith(snapshot({ entries, leaf_id: entries.at(-1).id, baseline_leaf_id: user.id }))({ session_id: SESSION });
    assert.equal(result.status, "failed", JSON.stringify(entries.at(-1).message));
    assert.equal(result.terminal, true);
    assert.equal(result.error.code, "PROVIDER_NO_TERMINAL_RESULT");
    assert.equal(result.raw, null);
    assert.match(result.evidence, value.evidence);
  }
  const rejected = await probeWith(snapshot({ entries: [user], leaf_id: user.id, baseline_leaf_id: "entry-model-change" }))({ session_id: SESSION });
  assert.equal(rejected.status, "failed");
  assert.equal(rejected.error.code, "PROVIDER_NO_TERMINAL_RESULT");
});

test("Pi probe keeps an unexpected session identity terminal without publishing it", async () => {
  const result = await probeWith(snapshot({ session_id: "pi-fake-other-session", entries: [user, assistant()], leaf_id: "entry-assistant" }))({ session_id: SESSION });
  assert.equal(result.status, "failed");
  assert.equal(result.terminal, true);
  assert.equal(result.session_id, null);
  assert.deepEqual(result.error, { code: "PROVIDER_OUTPUT_INVALID", message: "Pi emitted an unexpected session id" });
  assert.equal(JSON.stringify(result).includes("pi-fake-other-session"), false);
});

test("Pi probe can only be unverifiable when the RPC endpoint is unreachable", async () => {
  const unreachable = [
    async () => { throw new Error("connect ECONNREFUSED"); },
    async () => responseWith({ error: "child exited" }, false),
    async () => responseWith({ version: 1, session_id: SESSION, is_streaming: null, entries: null }),
    async () => responseWith(null),
  ];
  for (const fetchImpl of unreachable) {
    const result = await createPiProbe({ url: "http://127.0.0.1:49152", expectedSession: SESSION, fetchImpl })({ session_id: SESSION, cursor: "leaf" });
    assert.equal(result.status, "unverifiable");
    assert.equal(result.terminal, undefined);
    assert.equal(result.raw, null);
    assert.equal(result.cursor, "leaf");
    assert.equal(result.session_id, SESSION);
  }
  const controller = new AbortController(); controller.abort();
  const aborted = await probeWith(snapshot())({ session_id: SESSION, signal: controller.signal });
  assert.equal(aborted.status, "unverifiable");
  assert.equal(aborted.error.code, "PROBE_ABORTED");
  assert.equal(aborted.terminal, undefined);
  const noState = await probeWith(snapshot({ is_streaming: null }))({ session_id: SESSION });
  assert.equal(noState.status, "unverifiable");
  assert.equal(noState.terminal, undefined);
  const unknownLeaf = await probeWith(snapshot({ entries: [user], leaf_id: "entry-missing" }))({ session_id: SESSION });
  assert.equal(unknownLeaf.status, "unverifiable");
  assert.equal(unknownLeaf.terminal, undefined);
});

test("Pi probe maps only structural session fields and reads no wall clock", async () => {
  const real = { now: Date.now, performance: performance.now, hrtime: process.hrtime };
  Date.now = () => { throw new Error("Pi probe read the wall clock"); };
  performance.now = () => { throw new Error("Pi probe read the wall clock"); };
  process.hrtime = () => { throw new Error("Pi probe read the wall clock"); };
  try {
    const cases = [
      snapshot({ is_streaming: true, entries: [user], leaf_id: user.id, baseline_leaf_id: user.id }),
      snapshot({ entries: [user, assistant()], leaf_id: "entry-assistant", baseline_leaf_id: user.id }),
      snapshot({ entries: [user, assistant({ stopReason: "error", errorMessage: "429 overloaded" })], leaf_id: "entry-assistant", baseline_leaf_id: user.id }),
      snapshot({ entries: [user], leaf_id: user.id, baseline_leaf_id: user.id }),
      snapshot({ session_id: null }),
    ];
    const statuses = [];
    for (const value of cases) statuses.push((await probeWith(value)({ session_id: SESSION, cursor: user.id })).status);
    assert.deepEqual(statuses, ["busy", "completed", "failed", "busy", "unverifiable"]);
    const failing = await createPiProbe({ url: "http://127.0.0.1:49152", fetchImpl: async () => { throw new Error("ECONNREFUSED"); } })({ session_id: SESSION });
    assert.equal(failing.status, "unverifiable");
  } finally {
    Date.now = real.now; performance.now = real.performance; process.hrtime = real.hrtime;
  }
  const sources = ["lib/adapters/pi.mjs", "lib/adapters/pi-supervised-cli.mjs"].map((file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
  for (const source of sources) {
    for (const forbidden of [/Date\.now/, /\bnew Date\b/, /performance\.now/, /process\.hrtime/, /setTimeout/, /setInterval/, /AbortSignal\.timeout/, /\.timestamp/, /\bmtime\b/]) {
      assert.doesNotMatch(source, forbidden);
    }
  }
});

test("Pi RPC probe harvests a settled session while the process is still alive", async () => {
  const runtime = temp(); const cwd = temp();
  process.env.PI_FAKE_KEEP_ALIVE = "keep-alive";
  const pids = [];
  try {
    const execution = pi.start(provider({ env: ["PI_FAKE_KEEP_ALIVE"] }), cwd, "review", runtime);
    const result = await execute(execution, {
      maxOutputBytes: 100_000, healthCheckIntervalMs: 50, probeDeadlineMs: 2_000, livenessIntervalMs: 20,
      validateCompleted: (raw) => pi.parse(raw.stdout, raw.stderr, execution.expectedSession).ok,
      onStart: (pid) => pids.push(pid),
    });
    assert.equal(result.ok, true, result.stderr);
    assert.equal(result.health_harvested, true);
    assert.deepEqual(pi.parse(result.stdout, result.stderr, execution.expectedSession), { ok: true, text: "PI_FINAL:review", session_id: execution.expectedSession, usage: { totalTokens: 7 } });
    assert.equal(result.session_id, execution.expectedSession);
    assert.equal(await waitFor(() => !isAlive(pids[0])), true, "the harvested supervisor process tree is still alive");
  } finally { delete process.env.PI_FAKE_KEEP_ALIVE; }
});

test("Pi RPC probe classifies a live session that settled with a provider error", async () => {
  const runtime = temp(); const cwd = temp();
  process.env.PI_FAKE_KEEP_ALIVE = "keep-alive";
  try {
    const execution = pi.start(provider({ env: ["PI_FAKE_KEEP_ALIVE"] }), cwd, "PI_RATE_LIMIT_FIXTURE", runtime);
    const result = await execute(execution, { maxOutputBytes: 100_000, healthCheckIntervalMs: 50, probeDeadlineMs: 2_000 });
    assert.equal(result.ok, false);
    assert.deepEqual(result.error, { code: "RATE_LIMITED", message: "provider rate limit was reached" });
    assert.equal(result.health_harvested, undefined);
    assert.equal(pi.parse(result.stdout, result.stderr, execution.expectedSession).error.code, "RATE_LIMITED");
  } finally { delete process.env.PI_FAKE_KEEP_ALIVE; }
});

test("Pi RPC probe keeps an unresponsive live session unverifiable and never terminal", async () => {
  const runtime = temp(); const cwd = temp();
  process.env.PI_FAKE_KEEP_ALIVE = "keep-alive"; process.env.PI_FAKE_RPC_SILENT = "silent";
  let cancelled = false; const diagnostics = [];
  try {
    const execution = pi.start(provider({ env: ["PI_FAKE_KEEP_ALIVE", "PI_FAKE_RPC_SILENT"] }), cwd, "review", runtime);
    const result = await execute({ ...execution, onHealthDiagnostic: (diagnostic) => { diagnostics.push(diagnostic); if (diagnostics.length >= 2) cancelled = true; } }, {
      maxOutputBytes: 100_000, healthCheckIntervalMs: 40, probeDeadlineMs: 60, isCancelled: () => cancelled,
    });
    assert.equal(diagnostics.length >= 2, true, JSON.stringify(diagnostics));
    assert.equal(diagnostics.every((diagnostic) => diagnostic.code === "HEALTH_UNVERIFIABLE"), true, JSON.stringify(diagnostics));
    assert.equal(diagnostics.every((diagnostic) => ["PROBE_DEADLINE", "PROBE_ABORTED", "PROBE_FAILED"].includes(diagnostic.error_code)), true, JSON.stringify(diagnostics));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "CANCELLED");
    const store = JSON.parse(fs.readFileSync(path.join(runtime, "pi", "sessions", `${execution.expectedSession}.json`), "utf8"));
    assert.deepEqual(store.entries.filter((entry) => entry.type === "message"), []);
  } finally { delete process.env.PI_FAKE_KEEP_ALIVE; delete process.env.PI_FAKE_RPC_SILENT; }
});

test("Pi supervisor reports a rejected prompt as a classified failure without publishing it", async () => {
  const runtime = temp(); const cwd = temp();
  process.env.PI_FAKE_PROMPT_REJECT = "No API key found for provider \"fixture\": run /login fixture";
  try {
    const execution = pi.start(provider({ env: ["PI_FAKE_PROMPT_REJECT"] }), cwd, "review", runtime);
    const result = await execute(execution, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
    assert.equal(result.ok, false);
    assert.deepEqual(result.error, { code: "AUTHENTICATION_FAILED", message: "provider authentication failed" });
    assert.doesNotMatch(result.stderr, /No API key found for provider/);
    assert.doesNotMatch(result.stderr, /\/login fixture/);
  } finally { delete process.env.PI_FAKE_PROMPT_REJECT; }
});
