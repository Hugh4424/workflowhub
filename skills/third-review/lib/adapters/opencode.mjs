import { createHash, randomInt } from "node:crypto";
import fs from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { invalid, lines, nonempty, plan, publicOutputRewritePrompt } from "./shared.mjs";
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
      const reported = message.info?.error?.message ?? `OpenCode session finished with ${reason ?? "an error"}`;
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
  cwd = fs.realpathSync(cwd);
  const dataHome = isolatedDataHome(provider, runtime);
  const extraEnv = { OPENCODE_DISABLE_CLAUDE_CODE: "1", ...(dataHome ? { XDG_DATA_HOME: dataHome } : {}) };
  // OpenCode decodes percent escapes in --dir. Runtime provider keys use
  // `%2F` to keep `provider/model` in one directory name, so escape the
  // percent sign once more before handing the path to OpenCode.
  const cliCwd = cwd.replaceAll("%", "%25");
  if (!/^opencode(?:$|[-_.])/.test(path.basename(provider.command))) {
    const argv = ["run", ...(session ? ["--session", session] : []), "--pure", "--dir", cliCwd, "--format", "json"];
    if (provider.model) argv.push("--model", provider.model); if (provider.effort) argv.push("--variant", provider.effort);
    return { ...plan(provider, cwd, argv, prompt, extraEnv), observeLine };
  }
  const port = randomInt(49152, 65536); const url = `http://127.0.0.1:${port}`;
  const clientArgv = ["run", "--attach", url, "--pure", "--dir", cliCwd, "--format", "json"];
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
  promptViaStdin: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start(provider, cwd, prompt, runtime) { return executionPlan(provider, cwd, prompt, null, runtime); },
  resume(provider, cwd, session, prompt, runtime) { return executionPlan(provider, cwd, prompt, session, runtime); },
  parse,
};
