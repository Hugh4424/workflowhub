import { fail } from "../errors.mjs";
import { invalid, plan } from "./shared.mjs";

const reviewInstruction = "Review only the supplied instruction and the frozen files in the current directory. Do not access parent directories, use git, shell, network, host paths, or any files outside the current directory. Do not write or edit files. Return only the requested review.";
const printTimeoutPattern = /\bprint timeout\b/i;

function parse(stdout, stderr = "") {
  if (printTimeoutPattern.test(String(stderr))) return { ok: false, error: { code: "PROCESS_TIMEOUT", cause_code: "PROVIDER_PRINT_TIMEOUT", message: "Antigravity reported a print timeout" } };
  if (!stdout.trim()) return invalid("Antigravity emitted no final text", "empty_output");
  let terminal = null;
  for (const line of stdout.split(/\r?\n/)) {
    try { const event = JSON.parse(line); if (event?.event === "result") terminal = event.result; }
    catch { /* Non-JSON progress remains in the raw transcript. */ }
  }
  return terminal?.status === "SUCCESS" && typeof terminal.response === "string" && terminal.response.trim()
    ? { ok: true, text: terminal.response, session_id: null, usage: null }
    : invalid("Antigravity emitted no successful terminal text");
}

function observeLine(stream, line) {
  if (!line.trim()) return { progress: false };
  if (stream !== "stdout") return { liveness: true, progress: false, event: "stderr" };
  let event;
  try { event = JSON.parse(line); } catch { return { liveness: true, progress: false, event: "text" }; }
  const step = event?.step_update;
  if (event?.event === "step_update" && Number.isSafeInteger(step?.step_index) && step.step_index >= 0 && ["ACTIVE", "DONE", "ERROR"].includes(step.state)) {
    const cursor = `${step.step_index}:${step.state}`;
    return { liveness: true, progress: true, cursor, progress_key: cursor, event: "step_update" };
  }
  if (event?.event === "result") {
    const terminal = event.result?.status === "SUCCESS"
      ? { state: "completed", wait_for_close: true }
      : { state: "failed", wait_for_close: true, error: { code: "PROVIDER_HEALTH_FAILED", message: "Antigravity reported a failed terminal result" } };
    return { liveness: true, progress: false, event: "result", terminal };
  }
  return { liveness: true, progress: false, event: event?.event ?? null };
}

function start(provider, cwd, prompt) {
  if (!provider.allow_host_state) fail("PROVIDER_HOST_STATE_UNACKNOWLEDGED", "Antigravity persists prompts and conversations in the native CLI profile; set allow_host_state=true only for trusted material");
  if (provider.effort) fail("PROVIDER_OPTION_UNSUPPORTED", "Antigravity does not support generic provider.effort; select a compatible model instead");
  const argv = ["--new-project", "--mode", "plan", "--sandbox", "--dangerously-skip-permissions"];
  if (provider.model) argv.push("--model", provider.model);
  argv.push("--output-format", "stream-json", "-p", prompt);
  return { ...plan(provider, cwd, argv, null), observeLine, streamProgress: true };
}

export default {
  capabilities: { continuation: false, attachment_delivery: ["file_only"] },
  modelInstruction: reviewInstruction,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start,
  resume: () => fail("PROVIDER_OPTION_UNSUPPORTED", "Antigravity continuation is not supported"),
  parse,
  observeLine,
};
