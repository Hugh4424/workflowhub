import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import opencode, { createOpenCodeProbe } from "../lib/adapters/opencode.mjs";
import { execute } from "../lib/process.mjs";

const provider = { id: "opencode", command: "opencode", model: null, effort: null, auth: { env: [] }, env: [] };
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
const healthFixture = migratedFilePath(new URL("../test/opencode-health-fixture.mjs", import.meta.url));
const supervisorFixture = migratedFilePath(new URL("../test/opencode-supervisor-fixture.mjs", import.meta.url));
const supervisor = migratedFilePath(new URL("../lib/adapters/opencode-supervised-cli.mjs", import.meta.url));
let supervisorPort = 49152 + (process.pid % 1_000) * 10;
async function assertEventuallyUnavailable(url, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { await fetch(url, { signal: AbortSignal.timeout(50) }); }
    catch { return; }
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail(`OpenCode health server remained available: ${url}`);
}

test("OpenCode start and resume attach to one loopback server owned by the plan", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-provider-work-"));
  const first = opencode.start(provider, cwd, "review", "/tmp/runtime");
  assert.match(first.healthServer.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.equal(first.clientArgv.includes("--attach"), true);
  assert.equal(first.clientArgv[first.clientArgv.indexOf("--attach") + 1], first.healthServer.url);
  assert.equal(first.clientArgv.includes("--session"), false);

  const resumed = opencode.resume(provider, cwd, "ses_keep", "delta", "/tmp/runtime");
  assert.equal(resumed.clientArgv[resumed.clientArgv.indexOf("--attach") + 1], resumed.healthServer.url);
  assert.equal(resumed.clientArgv[resumed.clientArgv.indexOf("--session") + 1], "ses_keep");
  assert.deepEqual(resumed.healthServer.bind, { hostname: "127.0.0.1", port: Number(new URL(resumed.healthServer.url).port) });
  assert.match(opencode.terminalRecoveryPrompt, /Do not perform any further tool calls/i);
  assert.doesNotMatch(opencode.terminalRecoveryPrompt, /unless strictly necessary/i);
});

test("OpenCode isolates its data directory per runtime and provider profile", () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-data-isolation-"));
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-data-work-"));
  const coding = { ...provider, id: "opencode/coding", runtime_key: "opencode%2Fcoding" };
  const v4flash = { ...provider, id: "opencode/v4flash", runtime_key: "opencode%2Fv4flash" };
  const first = opencode.start(coding, cwd, "review", runtime);
  const resumed = opencode.resume(coding, cwd, "ses_keep", "continue", runtime);
  const other = opencode.start(v4flash, cwd, "review", runtime);
  assert.match(first.env.XDG_DATA_HOME, new RegExp(`^${runtime.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}${path.sep}opencode-data${path.sep}[a-f0-9]{64}$`));
  assert.equal(first.env.XDG_DATA_HOME, resumed.env.XDG_DATA_HOME);
  assert.notEqual(first.env.XDG_DATA_HOME, other.env.XDG_DATA_HOME);
  assert.equal(fs.statSync(first.env.XDG_DATA_HOME).mode & 0o777, 0o700);
  assert.equal(fs.statSync(other.env.XDG_DATA_HOME).mode & 0o777, 0o700);
});

test("OpenCode keeps native auth available when its data directory is isolated", () => {
  const hostData = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-native-auth-"));
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-native-auth-runtime-"));
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-native-auth-work-"));
  const authDir = path.join(hostData, "opencode");
  const authFile = path.join(authDir, "auth.json");
  fs.mkdirSync(authDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(authFile, '{"provider":"fixture"}\n', { mode: 0o600 });
  const prior = process.env.XDG_DATA_HOME;
  process.env.XDG_DATA_HOME = hostData;
  try {
    const plan = opencode.start(provider, cwd, "review", runtime);
    const isolatedAuth = path.join(plan.env.XDG_DATA_HOME, "opencode", "auth.json");
    assert.equal(fs.lstatSync(isolatedAuth).isSymbolicLink(), false);
    assert.equal(fs.readFileSync(isolatedAuth, "utf8"), fs.readFileSync(authFile, "utf8"));
    assert.equal(fs.statSync(isolatedAuth).mode & 0o777, 0o600);
  } finally {
    if (prior === undefined) delete process.env.XDG_DATA_HOME;
    else process.env.XDG_DATA_HOME = prior;
  }
});

test("OpenCode preserves a terminal permission failure instead of hiding it as health failure", async () => {
  const messages = [{
    info: { id: "msg_permission", sessionID: "ses_permission", role: "assistant", finish: "error", time: { completed: 42 }, error: { message: "permission denied while reading the provider workspace" } },
    parts: [{ id: "prt_error", type: "step-finish", reason: "error" }],
  }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({}) : response(messages);
  const result = await createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl })({ session_id: "ses_permission" });
  assert.equal(result.status, "failed");
  assert.equal(result.error.code, "PROVIDER_PERMISSION_DENIED");
});

function runSupervisor(specification) {
  const encoded = Buffer.from(JSON.stringify(specification), "utf8").toString("base64url");
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [supervisor, encoded], { cwd: process.cwd(), env: { ...process.env, OPENCODE_FIXTURE_DELAY_MS: String(specification.delayMs), OPENCODE_FIXTURE_MODE: specification.mode ?? "complete" }, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.stdin.end(); child.once("close", (code, signal) => resolve({ code, signal, stdout, stderr, url: specification.url }));
  });
}

function supervisorSpecification(delayMs, mode = "complete", session = null) {
  const port = supervisorPort++; const url = `http://127.0.0.1:${port}`;
  return { command: supervisorFixture, url, port, clientArgv: ["run", "--attach", url], session, delayMs, mode };
}

test("OpenCode supervisor waits for a fresh session after the attached client exits", async () => {
  const result = await runSupervisor(supervisorSpecification(80));
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /FIXTURE_SUPERVISOR_OK/);
  await assertEventuallyUnavailable(`${result.url}/global/health`);
});

test("OpenCode supervisor never terminates a health-confirmed active session by fixed elapsed time", async () => {
  for (const session of [null, "fixture_session"]) {
    const specification = supervisorSpecification(2_000, "complete", session);
    const encoded = Buffer.from(JSON.stringify(specification), "utf8").toString("base64url");
    const child = spawn(process.execPath, [supervisor, encoded], { cwd: process.cwd(), env: { ...process.env, OPENCODE_FIXTURE_DELAY_MS: "2000", OPENCODE_FIXTURE_MODE: "complete" }, stdio: ["pipe", "pipe", "pipe"] });
    let stderr = ""; child.stderr.on("data", (chunk) => { stderr += chunk; }); child.stdin.end();
    const closed = new Promise((resolve) => child.once("close", (code, signal) => resolve({ code, signal })));
    await new Promise((resolve) => setTimeout(resolve, 250));
    assert.equal(child.exitCode, null, stderr);
    child.kill("SIGTERM");
    await closed;
    await assertEventuallyUnavailable(`${specification.url}/global/health`);
  }
});

test("OpenCode supervisor classifies an unstartable server", async () => {
  const specification = supervisorSpecification(0);
  specification.command = path.join(os.tmpdir(), "missing-opencode-server");
  const result = await runSupervisor(specification);
  assert.equal(result.code, 1);
  const failure = result.stderr.split(/\r?\n/).find((line) => line.startsWith("3RD_REVIEW_FAILURE "));
  assert.ok(failure, result.stderr);
  assert.equal(JSON.parse(failure.slice("3RD_REVIEW_FAILURE ".length)).code, "PROCESS_START_FAILED");
});

test("OpenCode supervisor emits a structured failure for a terminal session without assistant text", async () => {
  const result = await runSupervisor(supervisorSpecification(0, "no-terminal"));
  assert.equal(result.code, 1);
  const failure = result.stderr.split(/\r?\n/).find((line) => line.startsWith("3RD_REVIEW_FAILURE "));
  assert.ok(failure, result.stderr);
  assert.deepEqual(JSON.parse(failure.slice("3RD_REVIEW_FAILURE ".length)), {
    version: 1,
    code: "PROVIDER_NO_TERMINAL_RESULT",
    message: "provider session ended without a terminal assistant result",
    session_id: "fixture_session",
  });
  await assertEventuallyUnavailable(`${result.url}/global/health`);
});

test("OpenCode supervisor classifies a health-confirmed inactive tool-only session", async () => {
  const result = await runSupervisor(supervisorSpecification(0, "tool-only"));
  assert.equal(result.code, 1);
  const failure = result.stderr.split(/\r?\n/).find((line) => line.startsWith("3RD_REVIEW_FAILURE "));
  assert.ok(failure, result.stderr);
  assert.equal(JSON.parse(failure.slice("3RD_REVIEW_FAILURE ".length)).code, "PROVIDER_NO_TERMINAL_RESULT");
  await assertEventuallyUnavailable(`${result.url}/global/health`);
});

test("OpenCode escapes percent-encoded runtime workspace names for --dir", () => {
  const cwd = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "opencode-encoded-work-")), "opencode%2Fdeepseek-v4-pro");
  fs.mkdirSync(cwd);
  const plan = opencode.start(provider, cwd, "review", "/tmp/runtime");
  assert.equal(plan.clientArgv[plan.clientArgv.indexOf("--dir") + 1], fs.realpathSync(cwd).replaceAll("%", "%25"));
});

test("OpenCode probe binds status and message-part cursor to the requested session", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith("/session/status")) return response({ other: { type: "idle" }, ses_target: { type: "busy" } });
    return response([{ info: { id: "msg_1", sessionID: "ses_target", role: "assistant" }, parts: [{ id: "prt_2", type: "reasoning", text: "working" }] }]);
  };
  const probe = createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl });
  const result = await probe({ session_id: "ses_target", cursor: null, signal: new AbortController().signal });
  assert.equal(result.status, "busy");
  assert.equal(result.session_id, "ses_target");
  assert.match(result.cursor, /^[a-f0-9]{64}$/);
  assert.deepEqual(calls, ["http://127.0.0.1:43210/session/status", "http://127.0.0.1:43210/session/ses_target/message"]);
});

test("OpenCode cursor observes progress outside the last message and retry metadata", async () => {
  let reasoning = "working"; let attempt = 1;
  const fetchImpl = async (url) => {
    if (url.endsWith("/session/status")) return response({ ses_target: { type: "retry", attempt } });
    return response([
      { info: { id: "msg_1", sessionID: "ses_target", role: "assistant" }, parts: [{ id: "reasoning", type: "reasoning", text: reasoning }] },
      { info: { id: "msg_2", sessionID: "ses_target", role: "user" }, parts: [{ id: "prompt", type: "text", text: "review" }] },
    ]);
  };
  const probe = createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl });
  const first = await probe({ session_id: "ses_target" });
  reasoning = "working more"; const second = await probe({ session_id: "ses_target", cursor: first.cursor });
  assert.notEqual(second.cursor, first.cursor);
  attempt = 2; const third = await probe({ session_id: "ses_target", cursor: second.cursor });
  assert.notEqual(third.cursor, second.cursor);
});

test("OpenCode probe harvests a terminal assistant message as parser-valid canonical raw", async () => {
  const messages = [{
    info: { id: "msg_done", sessionID: "ses_done", role: "assistant", finish: "stop", time: { completed: 42 }, tokens: { input: 3, output: 2 } },
    parts: [{ id: "prt_text", type: "text", text: "APPROVED" }, { id: "prt_done", type: "step-finish", reason: "stop" }],
  }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({}) : response(messages);
  const result = await createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl })({ session_id: "ses_done", signal: new AbortController().signal });
  assert.equal(result.status, "completed");
  assert.equal(opencode.parse(result.raw.stdout, result.raw.stderr).ok, true);
  assert.equal(opencode.parse(result.raw.stdout, result.raw.stderr).text, "APPROVED");
});

test("OpenCode parser unwraps one JSON Markdown fence without accepting surrounding prose", () => {
  const text = "```json\n{\"findings\":[]}\n```";
  const raw = `${JSON.stringify({ type: "session.completed", session_id: "ses_json", text })}\n`;
  const parsed = opencode.parse(raw, "");
  assert.equal(parsed.ok, true);
  assert.equal(parsed.text, '{"findings":[]}');
});

test("OpenCode does not harvest a completed tool step while the session is still busy", async () => {
  const messages = [{ info: { id: "msg_tool", sessionID: "ses_busy", role: "assistant", finish: "tool-calls", time: { completed: 42 } }, parts: [{ id: "prt_tool", type: "step-finish", reason: "tool-calls" }] }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({ ses_busy: { type: "busy" } }) : response(messages);
  const result = await createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl })({ session_id: "ses_busy" });
  assert.equal(result.status, "busy"); assert.equal(result.raw, null);
});

test("OpenCode classifies an idle tool-only turn as an explicit terminal failure", async () => {
  const messages = [{
    info: { id: "msg_tool", sessionID: "ses_tool_only", role: "assistant", finish: "tool-calls", time: { completed: 42 } },
    parts: [
      { id: "prt_tool", type: "tool", tool: "read", state: { status: "completed" } },
      { id: "prt_done", type: "step-finish", reason: "tool-calls" },
    ],
  }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({}) : response(messages);
  const result = await createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl })({ session_id: "ses_tool_only" });
  assert.equal(result.status, "failed");
  assert.deepEqual(result.error, {
    code: "PROVIDER_NO_TERMINAL_RESULT",
    message: "OpenCode session ended after tool-only steps without a terminal assistant result",
  });
  assert.match(result.evidence, /tool-only/i);
});

test("OpenCode classifies an explicit idle session without a terminal assistant as terminal failure", async () => {
  const messages = [{
    info: { id: "msg_idle", sessionID: "ses_idle", role: "assistant" },
    parts: [{ id: "prt_reasoning", type: "reasoning", text: "stopped" }],
  }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({ ses_idle: { type: "idle" } }) : response(messages);
  const probe = createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl });
  const first = await probe({ session_id: "ses_idle" });
  const result = await probe({ session_id: "ses_idle", cursor: first.cursor });
  assert.equal(result.status, "failed");
  assert.deepEqual(result.error, {
    code: "PROVIDER_NO_TERMINAL_RESULT",
    message: "OpenCode session ended without a terminal assistant result",
  });
  assert.match(result.evidence, /not busy/i);
});

test("OpenCode keeps an unknown session status advisory while the process is still alive", async () => {
  const messages = [{
    info: { id: "msg_unknown_status", sessionID: "ses_unknown_status", role: "assistant" },
    parts: [{ id: "prt_reasoning", type: "reasoning", text: "still running" }],
  }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({ ses_unknown_status: { type: "paused" } }) : response(messages);
  const probe = createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl });
  const first = await probe({ session_id: "ses_unknown_status" });
  assert.equal(first.status, "progressing");
  const result = await probe({ session_id: "ses_unknown_status", cursor: first.cursor });
  assert.equal(result.status, "unverifiable");
  assert.equal(result.terminal, undefined);
  assert.equal(result.error.code, "PROBE_STATUS_UNKNOWN");
});

test("OpenCode probe maps retry, failed, idle progress, unknown session, HTTP failure, and abort", async () => {
  const message = [{ info: { id: "m", sessionID: "ses", role: "assistant" }, parts: [{ id: "p", type: "reasoning", text: "x" }] }];
  const make = (status, messages = message) => createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl: async (url) => url.endsWith("/session/status") ? response(status) : response(messages) });
  assert.equal((await make({ ses: { type: "retry", attempt: 2 } })({ session_id: "ses" })).status, "retry");
  assert.equal((await make({ ses: { type: "idle" } })({ session_id: "ses", cursor: "old" })).status, "progressing");
  const failedMessage = [{ info: { id: "mf", sessionID: "ses", role: "assistant", finish: "error", error: { message: "boom" }, time: { completed: 9 } }, parts: [{ id: "pf", type: "step-finish", reason: "error" }] }];
  assert.equal((await make({}, failedMessage)({ session_id: "ses" })).status, "failed");
  assert.equal((await make({})({ session_id: "missing" })).status, "unverifiable");
  const badHttp = createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl: async () => response({ error: "no" }, 503) });
  assert.equal((await badHttp({ session_id: "ses" })).status, "unverifiable");
  const controller = new AbortController(); controller.abort();
  assert.equal((await make({})({ session_id: "ses", signal: controller.signal })).status, "unverifiable");
});

test("OpenCode probe distinguishes finish=unknown without assistant text", async () => {
  const messages = [{
    info: { id: "msg_unknown", sessionID: "ses_unknown", role: "assistant", finish: "unknown", time: { completed: 42 } },
    parts: [{ id: "prt_unknown", type: "step-finish", reason: "unknown" }],
  }];
  const fetchImpl = async (url) => url.endsWith("/session/status") ? response({}) : response(messages);
  const result = await createOpenCodeProbe({ url: "http://127.0.0.1:43210", fetchImpl })({ session_id: "ses_unknown" });
  assert.equal(result.status, "failed");
  assert.equal(result.error.code, "PROVIDER_NO_TERMINAL_RESULT");
});

test("OpenCode harvests a terminal session when its attached CLI hangs and cleans up the server", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-health-plan-")); const plan = opencode.start({ ...provider, command: healthFixture }, cwd, "review");
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 100, probeDeadlineMs: 1_000, validateCompleted: (raw) => opencode.parse(raw.stdout, raw.stderr).ok });
  assert.equal(result.ok, true); assert.equal(result.health_harvested, true); assert.equal(opencode.parse(result.stdout, result.stderr).text, "FIXTURE_APPROVED");
  await assertEventuallyUnavailable(`${plan.healthServer.url}/global/health`);
});

test("OpenCode continuation harvests its known session when the attached client exits with no output", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-health-resume-")); const plan = opencode.resume({ ...provider, command: healthFixture }, cwd, "fixture_session", "continue");
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000, probeDeadlineMs: 1_000, validateCompleted: (raw) => opencode.parse(raw.stdout, raw.stderr).ok });
  assert.equal(result.ok, true); assert.equal(opencode.parse(result.stdout, result.stderr).session_id, "fixture_session"); assert.equal(opencode.parse(result.stdout, result.stderr).text, "FIXTURE_APPROVED");
});

test("OpenCode continuation fails explicitly when a zero-output client has no terminal session", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-health-missing-")); const plan = opencode.resume({ ...provider, command: healthFixture }, cwd, "missing_session", "continue");
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000, probeDeadlineMs: 1_000, validateCompleted: (raw) => opencode.parse(raw.stdout, raw.stderr).ok });
  assert.equal(result.ok, false); assert.match(result.stderr, /3RD_REVIEW_FAILURE /); assert.equal(result.error.code, "PROBE_FAILED"); assert.equal(result.session_id, "missing_session"); assert.equal(result.stdout, "");
});
