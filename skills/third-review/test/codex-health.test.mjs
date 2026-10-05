import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import codex, { createCodexProbe } from "../lib/adapters/codex.mjs";
import { createHealthRunner } from "../lib/health-runner.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const fakeAppServer = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-codex-app-server.mjs", import.meta.url)));
const provider = (command) => ({ id: "provider", command, model: null, effort: null, auth: { type: "native", env: [] }, env: [] });
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-codex-health-"));

function startBridge(prompt) {
  const plan = codex.start(provider(fakeAppServer), temp(), prompt);
  const child = spawn(plan.command, plan.argv, { cwd: plan.cwd, env: plan.env, stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.end(plan.input);
  let stdout = ""; let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const stopped = new Promise((resolve) => child.once("close", resolve));
  return { plan, url: plan.healthServer.url, child, stopped, output: () => ({ stdout, stderr }) };
}
async function stopBridge(bridge) { bridge.child.kill("SIGKILL"); await bridge.stopped; }
async function readStatus(url) {
  try { const response = await fetch(`${url}/session/status`, { signal: AbortSignal.timeout(500) }); return response.ok ? await response.json() : null; }
  catch { return null; }
}
// Test harness synchronisation only: it waits for the bridge to publish a
// state, it never supplies a verdict to the probe under test.
async function waitForStatus(url, predicate, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await readStatus(url);
    if (value && predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail(`codex bridge health endpoint never reported the expected state: ${url}`);
}

test("Codex plan owns a loopback health endpoint for its one-shot stdio bridge", () => {
  const plan = codex.start(provider(fakeAppServer), temp(), "review");
  assert.match(plan.healthServer.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.deepEqual(plan.healthServer.bind, { hostname: "127.0.0.1", port: Number(new URL(plan.healthServer.url).port) });
  assert.equal(typeof plan.probeSession, "function");
  assert.equal(JSON.parse(plan.input).healthPort, plan.healthServer.bind.port);
  // The one-shot bridge contract is unchanged: same command, same stdout parser.
  assert.equal(plan.command, process.execPath);
  assert.deepEqual(codex.capabilities, { continuation: true, attachment_delivery: ["file_only", "always_embed"] });
});

test("Codex turn restricts file reads to its provider workspace", async () => {
  const bridge = startBridge("REQUIRE_RESTRICTED_SANDBOX");
  try {
    await bridge.stopped;
    assert.match(bridge.output().stdout, /CODEX_FINAL/);
  } finally { if (bridge.child.exitCode === null) await stopBridge(bridge); }
});

test("Codex probe reports an authoritative terminal verdict for a failed turn the stream never delivered", async () => {
  const bridge = startBridge("TURN_FAILS_SILENT");
  try {
    await waitForStatus(bridge.url, (state) => state.provider?.query === "ok" && state.provider?.last_turn?.status === "failed");
    const result = await createCodexProbe({ url: bridge.url })({ session_id: "codex-thread", cursor: null, signal: AbortSignal.timeout(4_000) });
    assert.equal(result.status, "failed");
    assert.equal(result.terminal, true);
    assert.equal(result.session_id, "codex-thread");
    assert.match(result.error.message, /fake app-server rejected the turn/);
    assert.equal(bridge.output().stdout.includes("turn.completed"), false);
  } finally { await stopBridge(bridge); }
});

test("Codex probe reports a terminal verdict when app-server no longer holds the session thread", async () => {
  const bridge = startBridge("THREAD_LOST");
  try {
    await waitForStatus(bridge.url, (state) => state.provider?.query === "thread_not_found");
    const result = await createCodexProbe({ url: bridge.url })({ session_id: "codex-thread", cursor: null, signal: AbortSignal.timeout(4_000) });
    assert.equal(result.status, "failed");
    assert.equal(result.terminal, true);
    assert.equal(result.error.code, "PROVIDER_NO_TERMINAL_RESULT");
    assert.equal(bridge.output().stdout.includes("turn.completed"), false);
  } finally { await stopBridge(bridge); }
});

test("Codex probe stays non-terminal for a turn in flight and never ages silence into a verdict", async () => {
  const bridge = startBridge("HOLD_TURN");
  try {
    await waitForStatus(bridge.url, (state) => state.provider?.last_turn?.status === "inProgress");
    const probe = createCodexProbe({ url: bridge.url });
    const first = await probe({ session_id: "codex-thread", cursor: null, signal: AbortSignal.timeout(4_000) });
    assert.ok(["busy", "progressing"].includes(first.status));
    assert.notEqual(first.terminal, true);
    const settled = [];
    for (let index = 0; index < 3; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      settled.push(await probe({ session_id: "codex-thread", cursor: first.cursor, signal: AbortSignal.timeout(4_000) }));
    }
    for (const result of settled) {
      // Identical provider state and an unchanged cursor must give an identical
      // answer however much wall-clock time has passed. Nothing here derives
      // from elapsed time or stream silence.
      assert.deepEqual(result, settled[0]);
      assert.equal(result.status, "busy");
      assert.notEqual(result.terminal, true);
      assert.equal(result.error, null);
    }
    for (const key of Object.keys(settled[0])) assert.doesNotMatch(key, /elapsed|duration|age|since|_ms$/i);
  } finally { await stopBridge(bridge); }
});

test("Codex health supervision over a stalled-but-live turn produces diagnostics and no terminal decision", async () => {
  const bridge = startBridge("HOLD_TURN");
  try {
    await waitForStatus(bridge.url, (state) => state.provider?.last_turn?.status === "inProgress");
    const decisions = []; const diagnostics = []; let calls = 0;
    const probe = createCodexProbe({ url: bridge.url });
    const runner = createHealthRunner({
      intervalMs: 20, probeDeadlineMs: 4_000,
      probeSession: (ctx) => { calls += 1; return probe(ctx); },
      onDecision: (value) => decisions.push(value),
      onDiagnostic: (value) => diagnostics.push(value),
    });
    runner.start();
    await new Promise((resolve) => setTimeout(resolve, 400));
    runner.stop();
    assert.equal(calls >= 3, true, `expected repeated probes, saw ${calls}`);
    assert.deepEqual(decisions, []);
    assert.equal(diagnostics.some((value) => value.code === "PROCESS_STALLED"), true);
    assert.deepEqual(diagnostics.filter((value) => value.code === "HEALTH_INVALID"), []);
    const result = await probe({ session_id: "codex-thread", cursor: null, signal: AbortSignal.timeout(4_000) });
    assert.notEqual(result.terminal, true);
  } finally { await stopBridge(bridge); }
});

test("Codex probe republishes a completed turn the bridge recorded when the app-server refuses to exit", async () => {
  const bridge = startBridge("COMPLETE_HOLD");
  try {
    const state = await waitForStatus(bridge.url, (value) => value.bridge?.terminal === true && value.bridge?.turn_status === "completed");
    assert.equal(state.bridge.stdout_complete, true);
    assert.equal(state.provider.query, "bridge_terminal");
    assert.equal(bridge.child.exitCode, null);
    const result = await createCodexProbe({ url: bridge.url })({ session_id: "codex-thread", cursor: null, signal: AbortSignal.timeout(4_000) });
    assert.equal(result.status, "completed");
    assert.equal(result.terminal, undefined);
    const parsed = codex.parse(result.raw.stdout);
    assert.deepEqual({ ok: parsed.ok, text: parsed.text, session_id: parsed.session_id }, { ok: true, text: "CODEX_FINAL", session_id: "codex-thread" });
  } finally { await stopBridge(bridge); }
});

test("Codex probe reports unverifiable when its side channel is gone", async () => {
  const result = await createCodexProbe({ url: "http://127.0.0.1:1" })({ session_id: "codex-thread", cursor: "c", signal: AbortSignal.timeout(1_000) });
  assert.equal(result.status, "unverifiable");
  assert.notEqual(result.terminal, true);
  assert.equal(result.error.code, "PROBE_FAILED");
});
