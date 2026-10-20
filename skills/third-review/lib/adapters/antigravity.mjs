import { fail } from "../errors.mjs";
import { invalid, plan } from "./shared.mjs";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const self = fileURLToPath(import.meta.url);
const nativeSupport = new Map();
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

function requireNativeHooks(provider) {
  try {
    const requested = provider.command.includes(path.sep) ? provider.command : String(process.env.PATH ?? "").split(path.delimiter).map((directory) => path.join(directory, provider.command)).find((file) => fs.existsSync(file));
    const command = fs.realpathSync(requested);
    const stat = fs.statSync(command); const identity = `${command}:${stat.size}:${stat.mtimeMs}`;
    if (nativeSupport.has(identity)) return;
    const version = spawnSync(command, ["--version"], { encoding: "utf8", timeout: 10_000 });
    if (version.status !== 0 || !/^1\.4\.\d+\s*$/.test(version.stdout)) throw new Error("unverified native CLI version");
    // The installed native CLI embeds its own hook contract. A command shim or
    // an executor with only the same version string is not a native hook API.
    const bytes = fs.readFileSync(command);
    for (const marker of ["PreToolUse", ".agents/hooks.json", "Hard block"]) if (!bytes.includes(Buffer.from(marker))) throw new Error("native hook contract absent");
    nativeSupport.set(identity, true);
  } catch {
    fail("PROVIDER_PACKET_GUARD_UNAVAILABLE", "Antigravity native packet hooks are unavailable or their installed version is unverified");
  }
}

function packetPolicy(cwd) {
  try {
    const root = fs.realpathSync(cwd); const bundle = path.join(root, "bundle");
    if (fs.realpathSync(bundle) !== bundle || !fs.lstatSync(bundle).isDirectory()) throw new Error("unsafe bundle");
    const manifestPath = path.join(bundle, "attachments-manifest.json");
    const manifestStat = fs.lstatSync(manifestPath);
    if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.nlink !== 1) throw new Error("unsafe manifest");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error("missing packet members");
    const files = manifest.files.map((item) => {
      if (typeof item.target !== "string" || item.target.includes("\\") || item.target.split("/").some((part) => !part || part === "." || part === "..") || path.isAbsolute(item.target)) throw new Error("unsafe member path");
      const file = path.join(bundle, item.target); const stat = fs.lstatSync(file);
      if (fs.realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size !== item.size || digest(fs.readFileSync(file)) !== item.sha256) throw new Error("packet member changed");
      return { file, size: item.size, sha256: item.sha256 };
    });
    if (new Set(files.map((item) => item.file)).size !== files.length) throw new Error("duplicate packet members");
    return { root, files };
  } catch {
    fail("PROVIDER_PACKET_GUARD_UNAVAILABLE", "Antigravity requires an intact frozen packet manifest and regular exact members");
  }
}

function hookDecision(policy, payload) {
  const denied = { decision: "deny", reason: "The packet boundary permits only exact current regular-file reads" };
  try {
    const call = payload?.toolCall;
    let tool = null, file = null;
    if (call !== undefined) {
      if (!call || !["view_file", "read_file"].includes(call.name) || !call.args || typeof call.args !== "object" || Array.isArray(call.args)) return denied;
      tool = call.name; file = tool === "read_file" ? call.args.Path : call.args.AbsolutePath;
      if (typeof file !== "string" || [call.args.Path, call.args.AbsolutePath].some(value => value !== undefined && value !== file)) return denied;
    }
    if (payload?.tool_name !== undefined || payload?.tool_info !== undefined) {
      const info = payload.tool_info, parameters = info?.parameters;
      if (!["view_file", "read_file"].includes(payload.tool_name) || !parameters || typeof parameters !== "object" || Array.isArray(parameters)
          || (info.name !== undefined && info.name !== payload.tool_name) || typeof parameters.Path !== "string"
          || (parameters.AbsolutePath !== undefined && parameters.AbsolutePath !== parameters.Path)) return denied;
      if (tool !== null && (tool !== payload.tool_name || file !== parameters.Path)) return denied;
      if (tool === null) { tool = payload.tool_name; file = parameters.Path; }
    }
    if (tool === null || typeof file !== "string" || !path.isAbsolute(file) || path.resolve(file) !== file) return denied;
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) return denied;
    const resolved = fs.realpathSync(file);
    const member = policy.files.find((item) => item.file === resolved);
    if (!member) return denied;
    if (stat.size !== member.size || digest(fs.readFileSync(resolved)) !== member.sha256) return denied;
    return { decision: "allow" };
  } catch { return denied; }
}

const ownedPacketHooks = new Map();
function installPacketHook(cwd) {
  const policy = packetPolicy(cwd);
  const command = [process.execPath, self, "--packet-pretool-use", Buffer.from(JSON.stringify(policy)).toString("base64url")].map(shellQuote).join(" ");
  const config = { "n3-packet-readonly": { PreToolUse: [{ matcher: "*", hooks: [{ type: "command", command, timeout: 10 }] }] } };
  try {
    const directory = path.join(policy.root, ".agents");
    // Packet delivery owns cleanup. Never replace material-supplied or ambient
    // hooks, and never grant the model read access to this configuration.
    const file = path.join(directory, "hooks.json");
    const bytes = `${JSON.stringify(config)}\n`;
    const owned = ownedPacketHooks.get(directory);
    if (owned) {
      const dirStat = fs.lstatSync(directory), fileStat = fs.lstatSync(file);
      if (!dirStat.isDirectory() || dirStat.isSymbolicLink() || dirStat.dev !== owned.directory.dev || dirStat.ino !== owned.directory.ino
          || !fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.nlink !== 1 || fileStat.dev !== owned.file.dev || fileStat.ino !== owned.file.ino
          || (dirStat.mode & 0o222) !== 0 || (fileStat.mode & 0o222) !== 0 || fs.readFileSync(file, "utf8") !== bytes || bytes !== owned.bytes) {
        throw new Error("owned packet hook changed");
      }
      return;
    }
    fs.mkdirSync(directory, { mode: 0o700 });
    fs.writeFileSync(file, bytes, { mode: 0o400, flag: "wx" });
    fs.chmodSync(directory, 0o500);
    ownedPacketHooks.set(directory, { directory: fs.lstatSync(directory), file: fs.lstatSync(file), bytes });
  } catch {
    fail("PROVIDER_PACKET_GUARD_UNAVAILABLE", "Antigravity native workspace hook could not be installed without replacing existing state");
  }
}

// This is the existing adapter's private native hook entry, not another model
// runner. Unknown input and all helper failures emit an explicit native deny.
if (process.argv[1] && path.resolve(process.argv[1]) === self && process.argv[2] === "--packet-pretool-use") {
  let decision = { decision: "deny", reason: "The packet boundary could not validate this tool call" };
  try {
    const input = fs.readFileSync(0, "utf8");
    if (input.length <= 1_048_576) decision = hookDecision(JSON.parse(Buffer.from(process.argv[3], "base64url").toString("utf8")), JSON.parse(input));
  } catch { /* Native deny is emitted below, including for malformed payloads. */ }
  process.stdout.write(`${JSON.stringify(decision)}\n`);
}

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
    const completedRead = step.state === "DONE" && (step.step_type === "tool" || step.step_type === undefined) && !step.tool_info?.error;
    return completedRead
      ? { liveness: true, progress: true, cursor, progress_key: `${step.step_index}:DONE`, event: "step_update" }
      : { liveness: true, progress: false, cursor, event: "step_update" };
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
  requireNativeHooks(provider);
  installPacketHook(cwd);
  // With slash expansion disabled the CLI explicitly ignores --mode plan.
  // The native match-all hook owns this boundary; plan mode cannot stand in.
  const argv = ["--new-project", "--sandbox", "--disable-slash-commands"];
  if (provider.model) argv.push("--model", provider.model);
  argv.push("--output-format", "stream-json", "-p", prompt);
  return { ...plan(provider, cwd, argv, null), observeLine, streamProgress: true };
}

export default {
  capabilities: { continuation: false, attachment_delivery: ["file_only"] },
  modelInstruction: reviewInstruction,
  requiresWritableCwd: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start,
  resume: () => fail("PROVIDER_OPTION_UNSUPPORTED", "Antigravity continuation is not supported"),
  parse,
  observeLine,
};
