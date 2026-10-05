import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import kimi from "../lib/adapters/kimi.mjs";

test("Kimi accepts only its explicit UUID resume hint", () => {
  const id = "6cfb5bd8-2e73-48ed-9c6b-d04480f6dfc0";
  const parsed = kimi.parse('{"role":"assistant","content":"code says kimi -r something"}', `To resume this session: kimi -r ${id}`);
  assert.equal(parsed.session_id, id);
});

test("Kimi does not trust a session-like string inside reviewer text", () => {
  const parsed = kimi.parse('{"role":"assistant","content":"use kimi -r evil-session"}', "");
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "PROVIDER_OUTPUT_INVALID");
});

test("Kimi does not turn a partial assistant event into success", () => {
  const parsed = kimi.parse('{"role":"assistant","content":"partial"}\n', "");
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "PROVIDER_OUTPUT_INVALID");
});

test("Kimi rejects a terminal resume hint when the assistant emitted thinking only", () => {
  const id = "57d02175-7367-499e-b72a-84465218ae4e";
  const parsed = kimi.parse(`${JSON.stringify({ type: "final", role: "assistant", content: [{ type: "think", think: "private reasoning" }] })}\n`, `To resume this session: kimi -r ${id}`);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "PROVIDER_OUTPUT_INVALID");
});

test("Kimi accepts a text terminal transcript with its explicit native resume hint", () => {
  const id = "57d02175-7367-499e-b72a-84465218ae4e";
  const parsed = kimi.parse(`${JSON.stringify({ role: "assistant", content: [{ type: "think", think: "reasoning" }, { type: "text", text: "R1_ACK kimi DIFF_HEAD DIFF_TAIL" }] })}\n`, `To resume this session: kimi -r ${id}`);
  assert.deepEqual(parsed, { ok: true, text: "R1_ACK kimi DIFF_HEAD DIFF_TAIL", session_id: id, usage: null });
});

test("Kimi continuation passes the parser-issued native session to --session", () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-resume-")); const cwd = path.join(runtime, "work", "kimi"); fs.mkdirSync(cwd, { recursive: true });
  const id = "57d02175-7367-499e-b72a-84465218ae4e";
  const result = kimi.resume({ id: "kimi", command: "kimi", model: null, thinking: null, auth: { env: [] }, env: [] }, cwd, id, "delta", runtime);
  assert.equal(result.argv[result.argv.indexOf("--session") + 1], id);
});

test("Kimi does not create a provider profile beside its attachment workspace", () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-private-skills-")); const cwd = path.join(runtime, "work", "kimi"); const bundle = path.join(cwd, "bundle"); const skills = path.join(bundle, "skills"); fs.mkdirSync(path.join(skills, "review"), { recursive: true }); fs.writeFileSync(path.join(skills, "review", "SKILL.md"), "review"); fs.writeFileSync(path.join(bundle, "review-packet.v1.json"), "{}"); fs.mkdirSync(path.join(bundle, "contracts")); fs.writeFileSync(path.join(bundle, "contracts", "review.md"), "contract"); fs.chmodSync(bundle, 0o500);
  const hostAttachmentRoot = "/host/attachment-root/never-disclose";
  const result = kimi.start({ id: "kimi", command: "kimi", model: null, thinking: null, auth: { env: [] }, env: [] }, cwd, "review", runtime);
  assert.equal(result.cwd, cwd); assert.equal(fs.statSync(cwd).mode & 0o200, 0o200); assert.equal(result.argv[0], "--prompt"); assert.equal(result.argv[result.argv.indexOf("--skills-dir") + 1], "bundle/skills"); assert.equal(result.argv.includes("--agent-file"), false); assert.equal(fs.existsSync(path.join(cwd, ".broker-profile")), false); assert.doesNotMatch(result.argv.join(" "), new RegExp(hostAttachmentRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("Kimi continuation still scopes an empty skills directory", () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-delta-no-skills-")); const cwd = path.join(runtime, "work", "kimi"); const bundle = path.join(cwd, "bundle"); fs.mkdirSync(path.join(bundle, "skills"), { recursive: true }); fs.writeFileSync(path.join(bundle, "changes.diff"), "delta");
  const result = kimi.resume({ id: "kimi", command: "kimi", model: null, thinking: null, auth: { env: [] }, env: [] }, cwd, "57d02175-7367-499e-b72a-84465218ae4e", "review delta", runtime);
  assert.equal(result.argv[result.argv.indexOf("--skills-dir") + 1], "bundle/skills");
});
