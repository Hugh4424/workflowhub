import { createHash, randomInt } from "node:crypto";
import fs from "node:fs";
import { homedir, constants as osConstants } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { invalid, lines, nonempty, plan, publicOutputRewritePrompt } from "./shared.mjs";
import { fail } from "../errors.mjs";
import { failureCode, failureMessage } from "../provider-failure.mjs";

function normalizeAssistantText(value) {
  const text = value.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return fenced ? fenced[1].trim() : text;
}
function parse(stdout) { let session = null; let text = null; let usage = null; let done = false; for (const item of lines(stdout)) { session ??= nonempty(item.sessionID ?? item.session_id ?? item.session?.id); usage ??= item.usage ?? item.part?.tokens ?? null; text = nonempty(item.text ?? item.part?.text ?? item.message?.text ?? item.message?.content) ?? text; done ||= ["step_finish", "session.completed", "runner.completed"].includes(item.type); } return text && done ? { ok: true, text: normalizeAssistantText(text), session_id: session, usage } : invalid("OpenCode emitted no completed final message"); }
const reviewInstruction = "Review only the supplied instruction and the frozen files in the current directory. Do not access parent directories, use git, shell, network, host paths, or any files outside the current directory. Do not use write or edit tools and do not create an output file. Return exactly the requested JSON object directly as the final assistant response: no preface, explanation, or Markdown code fence before or after the JSON.";
const terminalRecoveryPrompt = "The previous review turn ended without a terminal assistant response. Continue this existing session and return the complete requested JSON object now. Do not perform any further tool calls. Use the information already present in this session. Return only one JSON object, with no preface, explanation, Markdown code fence, or trailing text. This is the one bounded terminal recovery attempt; if you cannot produce the object, terminate clearly.";
function parseTerminalRecovery(stdout, stderr, expectedSession = null) {
  const result = parse(stdout, stderr);
  if (!result.ok) return result;
  if (expectedSession && result.session_id !== expectedSession) return invalid("OpenCode terminal recovery changed its native session");
  try {
    const value = JSON.parse(result.text);
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("OpenCode terminal recovery did not emit a JSON object");
  } catch {
    return invalid("OpenCode terminal recovery emitted non-JSON assistant text");
  }
  return result;
}
const controller = fileURLToPath(new URL("./opencode-supervised-cli.mjs", import.meta.url));
const nativeSupport = new Map();

function requireNativePermissions(provider) {
  try {
    const requested = provider.command.includes(path.sep) ? provider.command : String(process.env.PATH ?? "").split(path.delimiter).map((directory) => path.join(directory, provider.command)).find((file) => fs.existsSync(file));
    const command = fs.realpathSync(requested); const stat = fs.statSync(command);
    const identity = `${command}:${stat.size}:${stat.mtimeMs}`;
    if (nativeSupport.has(identity)) return;
    const version = spawnSync(command, ["--version"], { encoding: "utf8", timeout: 10_000 });
    if (version.status !== 0 || !/^1\.19\.\d+\s*$/.test(version.stdout)) throw new Error("unverified native CLI version");
    const bytes = fs.readFileSync(command);
    for (const marker of ["OPENCODE_CONFIG_CONTENT", "OPENCODE_PERMISSION", "external_directory"]) if (!bytes.includes(Buffer.from(marker))) throw new Error("native permissions absent");
    nativeSupport.set(identity, true);
  } catch {
    fail("PROVIDER_PACKET_GUARD_UNAVAILABLE", "OpenCode native packet permissions are unavailable or their installed version is unverified");
  }
}

export function packetPermissions(cwd, worktree = null) {
  try {
    const bundle = path.join(cwd, "bundle");
    if (fs.realpathSync(bundle) !== bundle || !fs.lstatSync(bundle).isDirectory()) throw new Error("unsafe bundle");
    const manifestFile = path.join(bundle, "attachments-manifest.json"); const manifestStat = fs.lstatSync(manifestFile);
    if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.nlink !== 1) throw new Error("unsafe manifest");
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error("missing packet members");
    const read = { "*": "deny" };
    for (const item of manifest.files) {
      if (typeof item.target !== "string" || item.target.includes("\\") || path.isAbsolute(item.target) || item.target.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("unsafe member path");
      const file = path.join(bundle, item.target); const stat = fs.lstatSync(file);
      // Native permission patterns are globs. Refuse metacharacters rather
      // than broadening an exact member into a wildcard grant.
      if (/[\*?\[\]{}]/.test(file) || fs.realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size !== item.size || createHash("sha256").update(fs.readFileSync(file)).digest("hex") !== item.sha256 || Object.hasOwn(read, file)) throw new Error("unsafe packet member");
      const pattern = worktree === null ? file : path.relative(worktree, file);
      if (!pattern || /[\*?\[\]{}]/.test(pattern) || Object.hasOwn(read, pattern)) throw new Error("unsafe native read coordinate");
      read[pattern] = "allow";
    }
    return { "*": "deny", read };
  } catch {
    fail("PROVIDER_PACKET_GUARD_UNAVAILABLE", "OpenCode requires an intact frozen packet manifest and regular exact members without glob metacharacters");
  }
}

function verifyNativePolicy(provider, cwd, env, permission) {
  let reason = "debug-exit", exit = null, signal = null;
  try {
    const result = spawnSync(provider.command, ["--pure", "debug", "agent", "build"], { cwd, env, encoding: "utf8", timeout: 15_000, maxBuffer: 4 * 1024 * 1024 });
    exit = Number.isInteger(result.status) && result.status >= 0 && result.status <= 255 ? result.status : null;
    signal = typeof result.signal === "string" && Object.hasOwn(osConstants.signals, result.signal) ? result.signal : null;
    if (result.error || result.status !== 0 || result.signal) {
      reason = signal === null ? "debug-exit" : "debug-signal";
      throw new Error("native agent policy unavailable");
    }
    reason = "debug-json";
    const agent = JSON.parse(result.stdout);
    reason = "permission-mismatch";
    verifyNativeAgentPolicy(agent, permission);
  } catch {
    fail("PROVIDER_PACKET_GUARD_UNAVAILABLE", `OpenCode did not confirm the final native default-deny exact-read policy; reason=${reason}; exit=${exit}; signal=${signal}`);
  }
}

// Shared only with the owned native supervisor final-server readback.
export function verifyNativeAgentPolicy(agent, permission, requireTools = true) {
    if (agent.name !== "build" || (requireTools && (agent.tools?.read !== true || Object.entries(agent.tools).some(([tool, enabled]) => tool !== "read" && enabled !== false)))) throw new Error("native tools exceed packet scope");
    const rules = agent.permission;
    if (!Array.isArray(rules) || rules.some(rule => !rule || typeof rule.permission !== "string" || typeof rule.pattern !== "string" || !["allow","ask","deny"].includes(rule.action))) throw new Error("native permission readback missing");
    const lastDefault = rules.findLastIndex((rule) => rule.permission === "*" && rule.pattern === "*");
    if (lastDefault < 0 || rules[lastDefault].action !== "deny") throw new Error("native default deny missing");
    const current = rules.slice(lastDefault + 1);
    const reads = current.filter((rule) => rule.permission === "read");
    const expected = Object.entries(permission.read);
    if (JSON.stringify(reads.map((rule) => [rule.pattern, rule.action])) !== JSON.stringify(expected)) throw new Error("native exact read grants differ");
    if (current.some((rule) => rule.permission !== "read" && !(rule.permission === "external_directory" && rule.action === "allow" && rule.pattern.endsWith("/opencode/tool-output/*")))) throw new Error("native policy adds another tool grant");
}

function cursorFor(messages, status = null) {
  if (!messages.length && !status) return null;
  return createHash("sha256").update(JSON.stringify({ messages, status })).digest("hex");
}
function assistantTerminal(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]; if (message?.info?.role !== "assistant") continue;
    const finishPart = message.parts?.findLast?.((part) => part?.type === "step-finish");
    const finished = message.info?.time?.completed || message.info?.finish || finishPart;
    if (!finished) return null;
    const reason = message.info?.finish ?? finishPart?.reason;
    if (["tool-calls", "tool_calls", "tool-use", "tool_use"].includes(String(reason).toLowerCase())) {
      return { failed: true, tool_only: true, code: "PROVIDER_NO_TERMINAL_RESULT", message: "OpenCode session ended after tool-only steps without a terminal assistant result" };
    }
    if (["error", "failed", "cancelled", "canceled"].includes(String(reason).toLowerCase()) || message.info?.error) {
      const reported = message.info?.error?.message ?? message.info?.error?.data?.message ?? `OpenCode session finished with ${reason ?? "an error"}`;
      const classified = failureCode(reported);
      const code = [
        "AUTHENTICATION_FAILED", "NETWORK_TLS_CERTIFICATE", "NETWORK_UNAVAILABLE", "RATE_LIMITED",
        "PROCESS_TIMEOUT", "PROVIDER_OUTPUT_INVALID", "PROVIDER_PERMISSION_DENIED", "PROCESS_EXIT_NONZERO",
      ].includes(classified) ? classified : "PROVIDER_HEALTH_FAILED";
      return { failed: true, code, message: failureMessage(code) };
    }
    const text = message.parts?.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("").trim();
    if (!text) return { failed: true, code: "PROVIDER_NO_TERMINAL_RESULT", message: "OpenCode session ended without a terminal assistant result" };
    return { text, usage: message.info?.tokens ?? null };
  }
  return null;
}
async function json(url, signal, fetchImpl) {
  const response = await fetchImpl(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`OpenCode health API returned HTTP ${response.status}`);
  return response.json();
}

export function createOpenCodeProbe({ url, fetchImpl = fetch } = {}) {
  return async ({ session_id, cursor = null, signal } = {}) => {
    if (!session_id) return { status: "unverifiable", session_id: null, cursor, raw: null, error: { code: "SESSION_UNKNOWN" }, evidence: "OpenCode has not emitted a session id" };
    if (signal?.aborted) return { status: "unverifiable", session_id, cursor, raw: null, error: { code: "PROBE_ABORTED" }, evidence: "OpenCode probe aborted" };
    try {
      const [statuses, messages] = await Promise.all([
        json(`${url}/session/status`, signal, fetchImpl),
        json(`${url}/session/${encodeURIComponent(session_id)}/message`, signal, fetchImpl),
      ]);
      if (!Array.isArray(messages) || messages.some((message) => message?.info?.sessionID !== session_id)) throw new Error("OpenCode returned messages for an unexpected session");
      const status = statuses?.[session_id]?.type;
      const nextCursor = cursorFor(messages, statuses?.[session_id] ?? null); const terminal = assistantTerminal(messages);
      if (status === "busy") return { status: "busy", session_id, cursor: nextCursor, raw: null, error: null, evidence: "OpenCode session status is busy" };
      if (status === "retry") return { status: "retry", session_id, cursor: nextCursor, raw: null, error: null, evidence: "OpenCode session status is retry" };
      if (terminal?.failed) return { status: "failed", terminal: true, session_id, cursor: nextCursor, raw: null, error: { code: terminal.code ?? "PROVIDER_HEALTH_FAILED", message: terminal.message }, evidence: terminal.tool_only ? "OpenCode tool-only turn ended without a terminal assistant result" : "OpenCode terminal failure" };
      if (terminal) {
        const stdout = `${JSON.stringify({ type: "session.completed", session_id, text: terminal.text, usage: terminal.usage })}\n`;
        return { status: "completed", session_id, cursor: nextCursor, raw: { stdout, stderr: "" }, error: null, evidence: "OpenCode assistant terminal message" };
      }
      if (nextCursor && nextCursor !== cursor) return { status: "progressing", session_id, cursor: nextCursor, raw: null, error: null, evidence: "OpenCode message or part changed" };
      if (status === "idle") return { status: "failed", terminal: true, session_id, cursor: nextCursor, raw: null, error: { code: "PROVIDER_NO_TERMINAL_RESULT", message: "OpenCode session ended without a terminal assistant result" }, evidence: "OpenCode session is not busy and has no terminal assistant message" };
      // An unknown health status is advisory. The attached process remains
      // authoritative until a terminal message, explicit idle failure, or
      // process loss is observed.
      return { status: "unverifiable", session_id, cursor: nextCursor, raw: null, error: { code: "PROBE_STATUS_UNKNOWN", message: "OpenCode returned an unknown session status" }, evidence: "OpenCode session status is unknown and has no terminal assistant message" };
    } catch (error) {
      return { status: "unverifiable", session_id, cursor, raw: null, error: { code: signal?.aborted ? "PROBE_ABORTED" : "PROBE_FAILED", message: error.message }, evidence: signal?.aborted ? "OpenCode probe aborted" : "OpenCode health API unavailable" };
    }
  };
}

function observeLine(stream, line) {
  if (stream !== "stdout") return { progress: false };
  try { const value = JSON.parse(line); const session_id = nonempty(value.sessionID ?? value.session_id ?? value.session?.id); const cursor = nonempty(value.part?.id ?? value.message?.id ?? value.id); return { liveness: true, progress: true, event: value.type ?? "json", session_id, cursor }; }
  catch { return { progress: false }; }
}
function isolatedDataHome(provider, runtime = null) {
  if (!runtime) return null;
  const runtimeKey = provider.runtime_key ?? provider.id ?? "opencode";
  const key = createHash("sha256").update(String(runtimeKey), "utf8").digest("hex");
  const dataHome = path.join(runtime, "opencode-data", key);
  fs.mkdirSync(dataHome, { recursive: true, mode: 0o700 });
  fs.chmodSync(dataHome, 0o700);
  preserveNativeAuth(dataHome);
  return dataHome;
}
function preserveNativeAuth(dataHome) {
  const sourceDataHome = process.env.XDG_DATA_HOME || path.join(homedir(), ".local", "share");
  const source = path.join(sourceDataHome, "opencode", "auth.json");
  try {
    if (!fs.statSync(source).isFile()) return;
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  const target = path.join(dataHome, "opencode", "auth.json");
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  try {
    const existing = fs.lstatSync(target);
    if (existing.isSymbolicLink()) fs.unlinkSync(target);
    else if (existing.isFile()) return;
    else throw new Error("isolated OpenCode auth path is not a regular file");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  // Copy the credential at runtime start. A symlink would keep the native
  // credential available, but would also let concurrent isolated runtimes
  // write the same host auth.json while OpenCode refreshes a token.
  fs.copyFileSync(source, target);
  fs.chmodSync(target, 0o600);
}
function executionPlan(provider, cwd, prompt, session = null, runtime = null) {
  requireNativePermissions(provider);
  cwd = fs.realpathSync(cwd);
  const permission = packetPermissions(cwd);
  const dataHome = isolatedDataHome(provider, runtime);
  const extraEnv = {
    OPENCODE_DISABLE_CLAUDE_CODE: "1", OPENCODE_DISABLE_EXTERNAL_SKILLS: "1", OPENCODE_DISABLE_DEFAULT_PLUGINS: "1", OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_CONFIG_CONTENT: JSON.stringify({ permission, default_agent: "build", agent: { build: { permission } }, plugin: [], instructions: [], autoupdate: false, share: "disabled" }),
    OPENCODE_PERMISSION: JSON.stringify(permission),
    ...(dataHome ? { XDG_DATA_HOME: dataHome } : {}),
  };
  verifyNativePolicy(provider, cwd, plan(provider, cwd, [], null, extraEnv).env, permission);
  // The native CLI consumes the literal owner; API encoding belongs to the HTTP boundary.
  const cliCwd = cwd;
  if (!/^opencode(?:$|[-_.])/.test(path.basename(provider.command))) {
    const argv = ["run", ...(session ? ["--session", session] : []), "--pure", "--agent", "build", "--dir", cliCwd, "--format", "json"];
    if (provider.model) argv.push("--model", provider.model); if (provider.effort) argv.push("--variant", provider.effort);
    return { ...plan(provider, cwd, argv, prompt, extraEnv), observeLine };
  }
  const port = randomInt(49152, 65536); const url = `http://127.0.0.1:${port}`;
  const clientArgv = ["run", "--attach", url, "--pure", "--agent", "build", "--dir", cliCwd, "--format", "json"];
  if (session) clientArgv.push("--session", session);
  if (provider.model) clientArgv.push("--model", provider.model);
  if (provider.effort) clientArgv.push("--variant", provider.effort);
  const specification = Buffer.from(JSON.stringify({ command: provider.command, url, port, clientArgv, session, workspace: cwd }), "utf8").toString("base64url");
  const result = plan(provider, cwd, [specification], prompt, extraEnv);
  return { ...result, command: controller, clientArgv, healthServer: { url, bind: { hostname: "127.0.0.1", port } }, observeLine, probeSession: createOpenCodeProbe({ url }) };
}

export default {
  capabilities: { continuation: true, terminal_recovery: true, attachment_delivery: ["file_only", "always_embed"] },
  modelInstruction: reviewInstruction,
  terminalRecoveryPrompt,
  parseTerminalRecovery,
  publicOutputRewritePrompt,
  requiresWritableCwd: true,
  stableContinuationCwd: true,
  runFromWritableRoot: true,
  promptViaStdin: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start(provider, cwd, prompt, runtime) { return executionPlan(provider, cwd, prompt, null, runtime); },
  resume(provider, cwd, session, prompt, runtime) { return executionPlan(provider, cwd, prompt, session, runtime); },
  parse,
};
