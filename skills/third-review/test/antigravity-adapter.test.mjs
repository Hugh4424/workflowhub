import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import antigravity from "../lib/adapters/antigravity.mjs";
import { execute } from "../lib/process.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const fake = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-antigravity-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-agy-test-"));
const provider = (overrides = {}) => ({ id: "antigravity", command: fake, model: "Gemini 3.5 Flash (Low)", effort: null, thinking: null, allow_host_state: true, auth: { type: "native", env: [] }, env: [], ...overrides });

test("Antigravity uses the supported noninteractive plan-mode contract", async () => {
  const execution = antigravity.start(provider(), temp(), "review");
  assert.deepEqual(antigravity.capabilities, { continuation: false, attachment_delivery: ["file_only"] });
  assert.equal(execution.input, null);
  assert.equal(execution.argv[execution.argv.indexOf("--model") + 1], "Gemini 3.5 Flash (Low)");
  assert.ok(execution.argv.includes("--new-project"));
  assert.ok(execution.argv.includes("--sandbox"));
  assert.ok(execution.argv.includes("--dangerously-skip-permissions"));
  assert.equal(execution.argv[execution.argv.indexOf("-p") + 1], "review");
  assert.equal(execution.argv[execution.argv.indexOf("--output-format") + 1], "stream-json");
  assert.equal(execution.streamProgress, true);
  const result = await execute(execution, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.deepEqual(antigravity.parse(result.stdout), { ok: true, text: "AGY_FINAL:review", session_id: null, usage: null });
});

test("Antigravity rejects unsupported generic effort but preserves large prompts", () => {
  assert.throws(() => antigravity.start(provider({ allow_host_state: false }), temp(), "review"), { code: "PROVIDER_HOST_STATE_UNACKNOWLEDGED" });
  assert.throws(() => antigravity.start(provider({ effort: "high" }), temp(), "review"), { code: "PROVIDER_OPTION_UNSUPPORTED" });
  assert.equal(antigravity.start(provider(), temp(), "x".repeat(64 * 1024 + 1)).argv.at(-1).length, 64 * 1024 + 1);
});

test("Antigravity accepts successful stream-json results and never resumes", () => {
  assert.equal(antigravity.parse("\n").parse_outcome, "empty_output");
  const step = JSON.stringify({ event: "step_update", step_update: { conversation_id: "not-a-native-session", step_index: 7, state: "ACTIVE" } });
  assert.deepEqual(antigravity.observeLine("stdout", step), { liveness: true, progress: true, cursor: "7:ACTIVE", progress_key: "7:ACTIVE", event: "step_update" });
  assert.deepEqual(antigravity.observeLine("stdout", "final"), { liveness: true, progress: false, event: "text" });
  assert.equal(antigravity.observeLine("stdout", JSON.stringify({ event: "init" })).progress, false);
  assert.equal(antigravity.observeLine("stdout", JSON.stringify({ event: "step_update", step_update: {} })).progress, false);
  assert.deepEqual(antigravity.observeLine("stderr", "warning"), { liveness: true, progress: false, event: "stderr" });
  assert.equal(antigravity.observeLine("stdout", "  ").progress, false);
  const result = (status, response) => JSON.stringify({ event: "result", result: { status, response } });
  assert.deepEqual(antigravity.observeLine("stdout", result("SUCCESS", "done")).terminal, { state: "completed", wait_for_close: true });
  assert.equal(antigravity.observeLine("stdout", result("ERROR", "")).terminal.error.code, "PROVIDER_HEALTH_FAILED");
  assert.deepEqual(antigravity.parse([step, result("SUCCESS", "first"), result("SUCCESS", "last")].join("\n")), { ok: true, text: "last", session_id: null, usage: null });
  for (const text of [step, "plain text", result("SUCCESS", " "), result("SUCCESS", 42), [result("SUCCESS", "first"), result("ERROR", "")].join("\n")]) assert.equal(antigravity.parse(text).error.code, "PROVIDER_OUTPUT_INVALID");
  assert.equal(antigravity.parse("", "print timeout").error.code, "PROCESS_TIMEOUT");
  assert.throws(() => antigravity.resume(provider(), temp(), "session", "continue"), { code: "PROVIDER_OPTION_UNSUPPORTED" });
});
