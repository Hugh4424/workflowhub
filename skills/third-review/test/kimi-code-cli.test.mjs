import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import kimi from "../lib/adapters/kimi.mjs";
import { execute } from "../lib/process.mjs";

const provider = { id: "kimi", command: "kimi", model: "kimi-code/kimi-for-coding", thinking: true, auth: { type: "native", env: [] }, env: [] };
const session = "session_0123456789abcdef";

test("Kimi Code uses the current non-interactive stream-json CLI", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-plan-"));
  try {
    const start = kimi.start(provider, cwd, "review", "/tmp/runtime");
    assert.equal(start.argv.includes("--wire"), false);
    assert.equal(start.argv.includes("--work-dir"), false);
    assert.deepEqual(start.argv.slice(0, 4), ["--prompt", "Read .3rd-review-kimi-prompt.md with the Read tool first. Follow its complete review instruction and return only the requested final review.", "--output-format", "stream-json"]);
    assert.equal(start.argv.join(" ").includes(cwd), false);
    assert.equal(fs.readFileSync(path.join(cwd, ".3rd-review-kimi-prompt.md"), "utf8"), "review");
    assert.equal(start.keepStdinOpen, undefined);
    assert.equal(start.input, null);

    const resumed = kimi.resume(provider, cwd, session, "delta", "/tmp/runtime");
    assert.equal(resumed.argv.includes("--session"), true);
    assert.equal(resumed.argv[resumed.argv.indexOf("--session") + 1], session);
    assert.equal(resumed.expectedSession, session);
    assert.equal(kimi.stableContinuationCwd, true);
    assert.equal(kimi.runFromWritableRoot, true);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test("Kimi Code maps the old configured model namespace to the installed CLI config", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-model-"));
  try {
    const start = kimi.start(provider, cwd, "review", "/tmp/runtime");
    const modelIndex = start.argv.indexOf("--model");
    assert.notEqual(modelIndex, -1);
    assert.equal(start.argv[modelIndex + 1], "kimi-for-coding/kimi-for-coding");
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test("Kimi Code stream-json parser ignores meta and tool rows and keeps final assistant text", () => {
  const stdout = [
    { role: "meta", type: "system.version", version: "0.40.1" },
    { role: "assistant", tool_calls: [{ type: "function", id: "tool_1", function: { name: "Read", arguments: "{}" } }] },
    { role: "tool", tool_call_id: "tool_1", content: "packet" },
    { role: "assistant", content: "{\"findings\":[]}" },
    { role: "meta", type: "session.resume_hint", session_id: session, command: `kimi -r ${session}` },
  ].map(JSON.stringify).join("\n");
  assert.deepEqual(kimi.parse(stdout), { ok: true, text: "{\"findings\":[]}", session_id: session, usage: null });
});

test("Kimi Code rejects malformed or non-terminal stream-json output", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-invalid-"));
  const malformed = kimi.start(provider, cwd, "review", "/tmp/runtime").observeLine("stdout", "not-json");
  assert.equal(malformed.terminal.state, "failed");
  assert.equal(malformed.terminal.error.code, "PROVIDER_OUTPUT_INVALID");

  const noFinal = kimi.parse(JSON.stringify({ role: "meta", type: "session.resume_hint", session_id: session }));
  assert.equal(noFinal.ok, false);
  assert.equal(noFinal.error.code, "PROVIDER_OUTPUT_INVALID");
  fs.rmSync(cwd, { recursive: true, force: true });
});

test("Kimi Code requires an explicit resume hint and counts stream retry metadata", () => {
  const ordinary = kimi.parse(JSON.stringify({ role: "assistant", content: "answer", session_id: session }));
  assert.equal(ordinary.ok, false);
  const legacyFinal = kimi.parse(JSON.stringify({ type: "final", text: "answer", session_id: session }));
  assert.equal(legacyFinal.ok, false);
  const plan = kimi.start(provider, fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-retry-")), "review", "/tmp/runtime");
  const retry = plan.observeLine("stdout", JSON.stringify({ role: "meta", type: "turn.step.retrying", failed_attempt: 1, next_attempt: 2 }));
  assert.equal(retry.progress, true);
  assert.equal(retry.retry_count, 1);
});

test("Kimi Code fixture completes through the generic process runner", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-fixture-"));
  const fakePath = migratedFilePath(new URL("../test/fake-kimi-code-cli.mjs", import.meta.url));
  fs.chmodSync(fakePath, 0o755);
  try {
    const fake = { ...provider, command: fakePath };
    const result = await execute(kimi.start(fake, cwd, "review", cwd), { maxOutputBytes: 100_000, healthCheckIntervalMs: 60_000 });
    assert.equal(result.ok, true);
    const parsed = kimi.parse(result.stdout, result.stderr);
    assert.deepEqual(parsed, { ok: true, text: "KIMI_CODE_FIXTURE_OK", session_id: session, usage: null });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("Kimi Code does not add a provider wall-clock timeout", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-hanging-"));
  try {
    const plan = kimi.start({ ...provider, command: migratedFilePath(new URL("../test/fake-kimi-wire-hanging-cli.mjs", import.meta.url)) }, cwd, "review", cwd);
    assert.equal(plan.maxDurationMs, undefined);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
