import path from "node:path";
import { invalid, nonempty, plan, publicOutputRewritePrompt, writeFile } from "./shared.mjs";

const reviewInstruction = "Review only the supplied instruction and the frozen files in the current directory. Use only the read-only tools available to you. Do not access parent directories, use shell, network, web tools, subagents, host paths, or write/edit tools. Return exactly the requested final response as visible assistant text: no preface, explanation, or Markdown code fence before or after the JSON.";
const successfulStops = new Set(["endturn", "end_turn", "stop", "completed"]);

function eventSession(value) { return nonempty(value?.sessionId ?? value?.session_id); }

function parse(stdout) {
  let text = ""; let session_id = null; let terminal = null; let usage = null;
  for (const line of String(stdout ?? "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let value;
    try { value = JSON.parse(line); }
    catch { return invalid("Grok emitted malformed streaming JSON"); }
    session_id ??= eventSession(value);
    if (value.type === "text") {
      if (typeof value.data !== "string") return invalid("Grok emitted a text event without string data");
      text += value.data;
    } else if (value.type === "end") {
      if (terminal) return invalid("Grok emitted multiple terminal events");
      terminal = nonempty(value.stopReason)?.toLowerCase() ?? null;
      usage ??= value.usage ?? null;
    } else if (value.type === "error") {
      return invalid("Grok emitted a terminal error event");
    }
  }
  if (!session_id) return invalid("Grok emitted no session id");
  if (!terminal || !successfulStops.has(terminal)) return invalid("Grok emitted no successful terminal event");
  const result = nonempty(text);
  return result ? { ok: true, text: result, session_id, usage } : invalid("Grok emitted no final assistant text");
}

function observeLine(stream, line) {
  if (stream !== "stdout") return { progress: false };
  try {
    const value = JSON.parse(line); const session_id = eventSession(value);
    if (value.type === "end") {
      const stop = nonempty(value.stopReason)?.toLowerCase();
      return { liveness: true, progress: true, event: value.type, session_id, terminal: successfulStops.has(stop) ? { state: "completed", session_id } : { state: "failed", session_id, error: { code: "PROVIDER_HEALTH_FAILED", message: "Grok returned a non-success terminal status" } } };
    }
    if (value.type === "error") return { liveness: true, progress: true, event: value.type, session_id, terminal: { state: "failed", session_id, error: { code: "PROVIDER_HEALTH_FAILED", message: "Grok emitted a terminal error event" } } };
    if (value.type === "text" || value.type === "thought" || value.type === "tool_use" || value.type === "tool_start" || value.type === "tool_call" || value.type === "tool_result" || value.type === "tool_end") return { liveness: true, progress: true, event: value.type, session_id };
    return { liveness: true, progress: false, event: value.type ?? "json", session_id };
  } catch { return { progress: false }; }
}

function executionPlan(provider, cwd, prompt, session = null) {
  const promptFile = writeFile(path.join(cwd, ".3rd-review-grok-prompt.txt"), prompt);
  const argv = ["--prompt-file", promptFile, "--cwd", cwd, "--output-format", "streaming-json", "--permission-mode", "plan", "--max-turns", "12", "--disable-web-search", "--no-subagents", "--no-memory", "--no-plan", "--tools", "read_file,grep,list_dir"];
  if (provider.model) argv.push("--model", provider.model);
  if (provider.effort) argv.push("--reasoning-effort", provider.effort);
  if (session) argv.push("--resume", session);
  return { ...plan(provider, cwd, argv, null), clientArgv: argv, observeLine };
}

export default {
  capabilities: { continuation: true, attachment_delivery: ["file_only"] },
  modelInstruction: reviewInstruction,
  publicOutputRewritePrompt,
  requiresWritableCwd: true,
  stableContinuationCwd: true,
  runFromWritableRoot: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start: (provider, cwd, prompt) => executionPlan(provider, cwd, prompt),
  resume: (provider, cwd, session, prompt) => executionPlan(provider, cwd, prompt, session),
  parse,
  observeLine,
};
