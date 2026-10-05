import fs from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { invalid, jsonProgress, lines, nonempty, plan, publicOutputRewritePrompt } from "./shared.mjs";

const reviewInstruction = "Review only the supplied instruction and the hash-verified frozen files in the bundle directory. Read bundle/review-packet.v1.json, bundle/manifest.json, and bundle/changes.diff when present. Do not access parent directories, use network, or write files. Return exactly the requested final response as visible assistant text.";
const controller = fileURLToPath(new URL("./claude-supervised-cli.mjs", import.meta.url));

function parse(stdout) {
  let result = null; let session = null;
  for (const value of lines(stdout)) {
    session ??= nonempty(value.session_id);
    if (value.type === "result") result = value;
  }
  if (!result) return invalid("Claude Code emitted no terminal result event");
  if (result.is_error === true || result.subtype !== "success") return invalid("Claude Code returned a terminal error");
  const text = nonempty(result.result);
  return text ? { ok: true, text, session_id: nonempty(result.session_id) ?? session, usage: result.usage ?? result.modelUsage ?? null } : invalid("Claude Code returned no final text");
}

function observeLine(stream, line) {
  const observed = jsonProgress(stream, line); if (stream !== "stdout") return observed;
  try {
    const value = JSON.parse(line); const session_id = nonempty(value.session_id);
    if (value.type === "result") return { ...observed, session_id, terminal: value.is_error === true || value.subtype !== "success" ? { state: "failed", session_id, error: { code: "PROVIDER_OUTPUT_INVALID", message: "Claude Code returned a terminal error" } } : { state: "completed", session_id } };
    return { ...observed, session_id };
  } catch { return observed; }
}

function executionPlan(provider, cwd, prompt, session = null) {
  const argv = ["-p", "--bare", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "dontAsk", "--safe-mode", "--disable-slash-commands", "--tools", "Read", "--allowedTools", "Read(bundle/**)"];
  if (provider.model) argv.push("--model", provider.model); if (provider.effort) argv.push("--effort", provider.effort);
  const base = plan(provider, cwd, argv, prompt);
  const specification = Buffer.from(JSON.stringify({ command: base.command, argv: base.argv, cwd: base.cwd, session }), "utf8").toString("base64url");
  const beforeSpawn = provider.command.includes("/") ? () => {
    try { fs.accessSync(provider.command, fs.constants.X_OK); }
    catch { const error = new Error(`Claude Code executable is unavailable: ${provider.command}`); error.code = "PROCESS_START_FAILED"; throw error; }
  } : undefined;
  return { ...base, command: process.execPath, argv: [controller, specification], clientArgv: argv, beforeSpawn, observeLine };
}

export default {
  capabilities: { continuation: true, attachment_delivery: ["file_only", "always_embed"] },
  modelInstruction: reviewInstruction,
  publicOutputRewritePrompt,
  requiresWritableCwd: true,
  stableContinuationCwd: true,
  runFromWritableRoot: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start: (provider, cwd, prompt) => executionPlan(provider, cwd, prompt),
  resume: (provider, cwd, session, prompt) => executionPlan(provider, cwd, prompt, session),
  parse, observeLine,
};
