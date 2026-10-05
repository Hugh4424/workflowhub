import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import kimi from "../lib/adapters/kimi.mjs";
import { environment } from "../lib/adapters/shared.mjs";

const provider = { id: "kimi", command: "kimi", model: null, thinking: null, auth: { env: [] }, env: [] };
const session = "session_0123456789abcdef";

test("Kimi native auth keeps the real user profile when the caller isolates HOME", () => {
  const isolatedHome = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-wire-home-"));
  try {
    const env = environment({ ...provider, auth: { type: "native", env: [] } }, { HOME: isolatedHome, PATH: "/bin" });
    assert.equal(env.HOME, os.userInfo().homedir);
    fs.mkdirSync(path.join(isolatedHome, ".kimi"), { recursive: true });
    fs.writeFileSync(path.join(isolatedHome, ".kimi", "config.toml"), "[models]\n");
    assert.equal(environment({ ...provider, auth: { type: "native", env: [] } }, { HOME: isolatedHome, PATH: "/bin" }).HOME, isolatedHome);
  } finally { fs.rmSync(isolatedHome, { recursive: true, force: true }); }
});

function attachmentWorkspace() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-attachments-"));
  const bundle = path.join(cwd, "bundle");
  fs.mkdirSync(path.join(bundle, "skills", "review"), { recursive: true });
  fs.writeFileSync(path.join(bundle, "review-packet.v1.json"), "packet");
  fs.writeFileSync(path.join(bundle, "changes.diff"), "diff");
  fs.writeFileSync(path.join(bundle, "skills", "review", "SKILL.md"), "skill");
  fs.writeFileSync(path.join(bundle, "attachments-manifest.json"), JSON.stringify({ files: [
    { target: "review-packet.v1.json" }, { target: "changes.diff" }, { target: "skills/review/SKILL.md" },
  ] }));
  return { cwd, bundle: fs.realpathSync(bundle) };
}

test("Kimi Code passes logical attachment paths to the current Read tool contract", () => {
  const workspace = attachmentWorkspace();
  try {
    const plan = kimi.start(provider, workspace.cwd, "review", "/tmp/runtime");
    const prompt = fs.readFileSync(path.join(workspace.cwd, ".3rd-review-kimi-prompt.md"), "utf8");
    assert.equal(prompt.includes("First Read target: \"bundle/review-packet.v1.json\"."), true);
    assert.match(prompt, /"bundle\/changes\.diff"/);
    assert.match(prompt, /Read only these relative bundle paths with the Read tool/);
    assert.match(prompt, /never create or reproduce absolute paths in the final response/);
    assert.match(prompt, /Do not recompute or validate hashes/);
    assert.equal(plan.argv[plan.argv.indexOf("--skills-dir") + 1], "bundle/skills");
    assert.equal(plan.argv.join(" ").includes(workspace.cwd), false);
  } finally { fs.rmSync(workspace.cwd, { recursive: true, force: true }); }
});

test("Kimi Code reads review instructions before the packet when delivered", () => {
  const workspace = attachmentWorkspace();
  try {
    fs.writeFileSync(path.join(workspace.bundle, "review-instructions.md"), "instructions");
    fs.writeFileSync(path.join(workspace.bundle, "attachments-manifest.json"), JSON.stringify({ files: [
      { target: "review-packet.v1.json" }, { target: "review-instructions.md" }, { target: "changes.diff" },
    ] }));
    const plan = kimi.start(provider, workspace.cwd, "review", "/tmp/runtime");
    const prompt = fs.readFileSync(path.join(workspace.cwd, ".3rd-review-kimi-prompt.md"), "utf8");
    assert.equal(prompt.includes("First Read target: \"bundle/review-instructions.md\"."), true);
  } finally { fs.rmSync(workspace.cwd, { recursive: true, force: true }); }
});

test("Kimi Code preserves the explicit native session on continuation", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-resume-"));
  const plan = kimi.resume(provider, cwd, session, "delta", "/tmp/runtime");
  assert.equal(plan.argv[plan.argv.indexOf("--session") + 1], session);
  assert.equal(plan.expectedSession, session);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test("Kimi Code does not add a provider wall-clock timeout", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-code-hanging-"));
  try {
    const plan = kimi.start({ ...provider, command: migratedFilePath(new URL("../test/fake-kimi-wire-hanging-cli.mjs", import.meta.url)) }, cwd, "review", cwd);
    assert.equal(plan.maxDurationMs, undefined);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
