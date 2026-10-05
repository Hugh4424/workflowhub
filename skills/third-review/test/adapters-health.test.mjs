import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";
import claude from "../lib/adapters/claude-code.mjs";
import codex from "../lib/adapters/codex.mjs";
import { execute } from "../lib/process.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fakeAppServer = nodeFixtureCommand(path.join(here, "fake-codex-app-server.mjs"));
const hangingClaude = nodeFixtureCommand(path.join(here, "hanging-claude-stream.mjs"));
const lateClose = nodeFixtureCommand(path.join(here, "terminal-then-close.mjs"));
const terminalBeforeClose = nodeFixtureCommand(path.join(here, "terminal-before-close.mjs"));
const emptyThenResume = nodeFixtureCommand(path.join(here, "claude-empty-then-resume.mjs"));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-adapter-health-"));
const provider = (command) => ({ id: "provider", command, model: null, effort: null, auth: { type: "native", env: [] }, env: [] });

test("Claude uses official stream-json events and harvests result without waiting for CLI exit", async () => {
  const plan = claude.start(provider(hangingClaude), temp(), "review");
  assert.ok(plan.clientArgv.includes("stream-json"));
  assert.ok(plan.clientArgv.includes("--include-partial-messages"));
  assert.ok(plan.clientArgv.includes("--verbose"));
  assert.ok(plan.clientArgv.includes("--bare"));
  assert.equal(plan.clientArgv[plan.clientArgv.indexOf("--tools") + 1], "Read");
  assert.equal(plan.clientArgv[plan.clientArgv.indexOf("--allowedTools") + 1], "Read(bundle/**)");
  assert.deepEqual(claude.capabilities.attachment_delivery, ["file_only", "always_embed"]);
  assert.equal(Object.hasOwn(JSON.parse(Buffer.from(plan.argv[1], "base64url").toString("utf8")), "env"), false);
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.equal(result.health_harvested, true);
  assert.match(result.stdout, /CLAUDE_FINAL/);
  const parsed = claude.parse(result.stdout);
  assert.deepEqual({ ok: parsed.ok, text: parsed.text, session_id: parsed.session_id }, { ok: true, text: "CLAUDE_FINAL", session_id: "claude-session" });
});

test("Claude rejects a changed session identity during supervised continuation", async () => {
  process.env.CLAUDE_TEST_MISMATCH = "1";
  try {
    const plan = claude.start({ ...provider(emptyThenResume), env: ["CLAUDE_TEST_MISMATCH"] }, temp(), "review");
    const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
    assert.equal(result.ok, false); assert.match(result.stderr, /changed session identity/);
  } finally { delete process.env.CLAUDE_TEST_MISMATCH; }
});

test("Claude continues an empty successful turn in the same native session", async () => {
  const plan = claude.start(provider(emptyThenResume), temp(), "review");
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  const parsed = claude.parse(result.stdout);
  assert.deepEqual({ text: parsed.text, session_id: parsed.session_id }, { text: "CLAUDE_RESUMED_FINAL", session_id: "claude-empty-session" });
});

test("Claude result errors are terminal but remain semantic provider failures", () => {
  const line = JSON.stringify({ type: "result", subtype: "error_during_execution", is_error: true, result: "bad", session_id: "s" });
  assert.equal(claude.observeLine("stdout", line).terminal.state, "failed");
  assert.equal(claude.parse(`${line}\n`).ok, false);
});

test("Codex uses stable stdio app-server thread and turn protocol", async () => {
  const cwd = temp();
  const plan = codex.start(provider(fakeAppServer), cwd, "review");
  assert.equal(plan.command, process.execPath);
  const request = JSON.parse(plan.input);
  assert.deepEqual({ command: request.command, cwd: request.cwd, prompt: request.prompt, session: request.session }, { command: fakeAppServer, cwd, prompt: "review", session: null });
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.match(result.stdout, /CODEX_FINAL/);
  const parsed = codex.parse(result.stdout);
  assert.deepEqual({ ok: parsed.ok, text: parsed.text, session_id: parsed.session_id }, { ok: true, text: "CODEX_FINAL", session_id: "codex-thread" });
});

test("Codex continuation sends thread/resume for the same session", () => {
  const plan = codex.resume(provider(fakeAppServer), temp(), "codex-thread", "continue");
  assert.equal(JSON.parse(plan.input).session, "codex-thread");
});

test("Codex app-server request errors remain process failures", async () => {
  const result = await execute(codex.start(provider(fakeAppServer), temp(), "FAIL_PROTOCOL"), { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, false);
});

test("terminal wait_for_close keeps stdin open until the provider publishes late raw evidence", async () => {
  const result = await execute({ command: lateClose, argv: [], cwd: temp(), input: "go\n", env: process.env, redact: [], keepStdinOpen: true, observeLine: (_stream, line) => line === "TERMINAL" ? { terminal: { state: "completed", wait_for_close: true } } : {} }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.match(result.stderr, /LATE_SESSION/);
});

test("a semantic terminal result completes without waiting for a wrapper close", async () => {
  const result = await execute({ command: terminalBeforeClose, argv: [], cwd: temp(), input: "go\n", env: process.env, redact: [], keepStdinOpen: true, observeLine: (_stream, line) => line === "TERMINAL" ? { terminal: { state: "completed" } } : {} }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.match(result.stdout, /TERMINAL/);
  assert.doesNotMatch(result.stdout, /LATE_AFTER_TERMINAL/);
});
