import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import grok from "../lib/adapters/grok.mjs";
import { execute } from "../lib/process.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const fakeGrok = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-grok-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-grok-adapter-"));
const provider = { id: "grok/grok-4-5", command: fakeGrok, model: "grok-4.5", effort: "high", auth: { env: [] }, env: [] };

test("Grok uses read-only streaming headless arguments and parses a completed turn", async () => {
  const plan = grok.start(provider, temp(), "review");
  assert.deepEqual(plan.clientArgv, ["--prompt-file", path.join(plan.cwd, ".3rd-review-grok-prompt.txt"), "--cwd", plan.cwd, "--output-format", "streaming-json", "--permission-mode", "plan", "--max-turns", "12", "--disable-web-search", "--no-subagents", "--no-memory", "--no-plan", "--tools", "read_file,grep,list_dir", "--model", "grok-4.5", "--reasoning-effort", "high"]);
  assert.equal(fs.readFileSync(path.join(plan.cwd, ".3rd-review-grok-prompt.txt"), "utf8"), "review");
  assert.equal(grok.capabilities.continuation, true);
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.equal(grok.parse(result.stdout).text, "GROK_FINAL");
  assert.equal(grok.parse(result.stdout).session_id, "grok-session");
});

test("Grok continuation resumes the same session", () => {
  const plan = grok.resume(provider, temp(), "grok-session", "continue");
  assert.equal(plan.clientArgv[plan.clientArgv.indexOf("--resume") + 1], "grok-session");
});

test("Grok rejects malformed, unsuccessful, and empty terminal output", () => {
  assert.equal(grok.parse("not-json\n").ok, false);
  assert.equal(grok.parse(`${JSON.stringify({ type: "end", stopReason: "MaxTurns", sessionId: "s" })}\n`).ok, false);
  assert.equal(grok.parse(`${JSON.stringify({ type: "text", data: "x" })}\n`).ok, false);
  assert.equal(grok.parse(`${JSON.stringify({ type: "error", message: "bad" })}\n`).ok, false);
  assert.equal(grok.parse(`${JSON.stringify({ type: "text", data: "x" })}\n${JSON.stringify({ type: "end", stopReason: "EndTurn" })}\n`).ok, false);
});

test("Grok observes terminal health decisions", () => {
  const completed = grok.observeLine("stdout", JSON.stringify({ type: "end", stopReason: "EndTurn", sessionId: "s" }));
  assert.deepEqual(completed.terminal, { state: "completed", session_id: "s" });
  const snakeCaseCompleted = grok.observeLine("stdout", JSON.stringify({ type: "end", stopReason: "end_turn", sessionId: "s" }));
  assert.deepEqual(snakeCaseCompleted.terminal, { state: "completed", session_id: "s" });
  const failed = grok.observeLine("stdout", JSON.stringify({ type: "end", stopReason: "MaxTurns", sessionId: "s" }));
  assert.equal(failed.terminal.state, "failed");
  const error = grok.observeLine("stdout", JSON.stringify({ type: "error", sessionId: "s" }));
  assert.equal(error.terminal.state, "failed");
});
