import { fail } from "../errors.mjs";
import { invalid, plan } from "./shared.mjs";

const reviewInstruction = "Review only the supplied instruction and the frozen files in the current directory. Do not access parent directories, use git, shell, network, host paths, or any files outside the current directory. Do not write or edit files. Return only the requested review.";
const printTimeoutPattern = /\bprint timeout\b/i;

function parse(stdout, stderr = "") {
  if (printTimeoutPattern.test(String(stderr))) return { ok: false, error: { code: "PROCESS_TIMEOUT", cause_code: "PROVIDER_PRINT_TIMEOUT", message: "Antigravity reported a print timeout" } };
  const text = stdout.trim();
  return text ? { ok: true, text, session_id: null, usage: null } : invalid("Antigravity emitted no final text", "empty_output");
}

function observeLine(stream, line) {
  if (!line.trim()) return { progress: false };
  return stream === "stdout" ? { liveness: true, progress: true, event: "text" } : { liveness: true, progress: false, event: "stderr" };
}

function start(provider, cwd, prompt) {
  if (!provider.allow_host_state) fail("PROVIDER_HOST_STATE_UNACKNOWLEDGED", "Antigravity persists prompts and conversations in the native CLI profile; set allow_host_state=true only for trusted material");
  if (provider.effort) fail("PROVIDER_OPTION_UNSUPPORTED", "Antigravity does not support generic provider.effort; select a compatible model instead");
  const argv = ["--new-project", "--mode", "plan", "--sandbox", "--dangerously-skip-permissions"];
  if (provider.model) argv.push("--model", provider.model);
  argv.push("-p", prompt);
  return { ...plan(provider, cwd, argv, null), observeLine };
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
