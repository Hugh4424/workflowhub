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
  const result = await execute(execution, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.deepEqual(antigravity.parse(result.stdout), { ok: true, text: "AGY_FINAL:review", session_id: null, usage: null });
});

test("Antigravity rejects unsupported generic effort but preserves large prompts", () => {
  assert.throws(() => antigravity.start(provider({ allow_host_state: false }), temp(), "review"), { code: "PROVIDER_HOST_STATE_UNACKNOWLEDGED" });
  assert.throws(() => antigravity.start(provider({ effort: "high" }), temp(), "review"), { code: "PROVIDER_OPTION_UNSUPPORTED" });
  assert.equal(antigravity.start(provider(), temp(), "x".repeat(64 * 1024 + 1)).argv.at(-1).length, 64 * 1024 + 1);
});

test("Antigravity only accepts non-empty plain-text results and never resumes", () => {
  assert.equal(antigravity.parse("\n").ok, false);
  assert.deepEqual(antigravity.observeLine("stdout", "final"), { liveness: true, progress: true, event: "text" });
  assert.deepEqual(antigravity.observeLine("stderr", "warning"), { liveness: true, progress: false, event: "stderr" });
  assert.equal(antigravity.observeLine("stdout", "  ").progress, false);
  assert.throws(() => antigravity.resume(provider(), temp(), "session", "continue"), { code: "PROVIDER_OPTION_UNSUPPORTED" });
});
