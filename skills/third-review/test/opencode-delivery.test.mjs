import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import opencode from "../lib/adapters/opencode.mjs";

test("OpenCode receives the complete 80KB provider prompt on stdin", () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-stdin-")); const cwd = path.join(runtime, "embed", "opencode"); fs.mkdirSync(cwd, { recursive: true }); const prompt = `ATTACHMENT_HEAD\n${"x".repeat(80 * 1024)}\nATTACHMENT_TAIL`;
  const result = opencode.start({ id: "opencode", command: "opencode", model: null, effort: null, auth: { env: [] }, env: [] }, cwd, prompt, runtime);
  assert.equal(result.input, prompt); assert.ok(Buffer.byteLength(result.input) > 80_000); assert.match(result.input, /^ATTACHMENT_HEAD/); assert.match(result.input, /ATTACHMENT_TAIL$/); assert.equal(result.argv.includes("--file"), false); assert.equal(result.argv.includes("--agent"), false); assert.doesNotMatch(result.argv.join(" "), /review-input|Read tool|offset|EOF/i); assert.equal(result.argv.join(" ").includes(process.cwd()), false); assert.equal(result.env.OPENCODE_CONFIG, undefined); assert.equal(fs.existsSync(path.join(cwd, ".broker-profile")), false); assert.equal(fs.existsSync(path.join(cwd, "review-input.md")), false);
});

test("OpenCode uses one canonical cwd for the process and --dir", () => {
  const cwd = fs.mkdtempSync("/tmp/opencode-canonical-cwd-"); const canonical = fs.realpathSync(cwd);
  const result = opencode.start({ id: "opencode", command: "opencode", model: null, effort: null, auth: { env: [] }, env: [] }, cwd, "review");
  assert.equal(result.cwd, canonical);
  assert.equal(result.clientArgv[result.clientArgv.indexOf("--dir") + 1], canonical);
});

test("OpenCode must return the verdict as final stdout instead of writing an output file", () => {
  assert.match(opencode.modelInstruction, /Do not use write or edit tools/i);
  assert.match(opencode.modelInstruction, /final assistant response/i);
  assert.match(opencode.modelInstruction, /current directory/i);
  assert.match(opencode.modelInstruction, /Do not access parent directories/i);
  assert.doesNotMatch(opencode.modelInstruction, /reviewer-output\.json/);
  assert.doesNotMatch(opencode.modelInstruction, /under bundle\//i);
});
