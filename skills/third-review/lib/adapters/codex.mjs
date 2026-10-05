import { randomInt } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { invalid, jsonProgress, lines, nonempty, plan } from "./shared.mjs";

const client = path.join(path.dirname(fileURLToPath(import.meta.url)), "codex-app-server-client.mjs");
// Turn states app-server only reaches once the turn can no longer run. The
// bridge tags `turn/interrupt` it sent itself, so an `interrupted` turn seen
// through the live query is a provider-side end rather than our own shutdown.
const terminalTurnStates = new Set(["failed"]);

function turnFailure(state) {
  const turn = state?.provider?.last_turn ?? null;
  const status = turn?.status;
  if (status === "failed") {
    const reported = typeof turn.error?.message === "string" && turn.error.message.trim() ? turn.error.message : null;
    return { code: "PROVIDER_HEALTH_FAILED", message: reported ?? "Codex app-server reported a failed turn" };
  }
  if (status === "interrupted") return { code: "PROVIDER_NO_TERMINAL_RESULT", message: "Codex app-server reported an interrupted turn without a terminal result" };
  if (state?.provider?.thread_status?.type === "systemError") return { code: "PROVIDER_HEALTH_FAILED", message: "Codex app-server reported a thread system error" };
  return null;
}

export function createCodexProbe({ url, fetchImpl = fetch } = {}) {
  return async ({ session_id = null, cursor = null, signal } = {}) => {
    const unknown = (code, evidence, message = null) => ({ status: "unverifiable", session_id, cursor, raw: null, error: { code, ...(message ? { message } : {}) }, evidence });
    if (!url) return unknown("PROBE_UNAVAILABLE", "Codex bridge exposes no health endpoint");
    if (signal?.aborted) return unknown("PROBE_ABORTED", "Codex probe aborted");
    let state;
    try {
      const response = await fetchImpl(`${url}/session/status`, { signal, headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Codex bridge health endpoint returned HTTP ${response.status}`);
      state = await response.json();
    } catch (error) {
      return unknown(signal?.aborted ? "PROBE_ABORTED" : "PROBE_FAILED", signal?.aborted ? "Codex probe aborted" : "Codex bridge health endpoint unavailable", error?.message);
    }
    if (!state || state.ok !== true) return unknown("PROBE_STATUS_INVALID", "Codex bridge returned an unrecognized health payload");
    const bridge = state.bridge ?? {}; const provider = state.provider ?? {};
    const threadId = nonempty(bridge.thread_id) ?? null;
    if (session_id && threadId && session_id !== threadId) return unknown("SESSION_MISMATCH", "Codex bridge is running a different thread than the supervised session");
    if (!threadId) return unknown("SESSION_UNKNOWN", "Codex app-server has not published a thread id yet");
    const nextCursor = nonempty(state.cursor) ?? cursor;
    // 1. A terminal turn the bridge already observed on the app-server stream.
    //    This is a provider fact, not a clock reading, and it survives the
    //    app-server exiting before the next probe.
    if (bridge.terminal === true && bridge.interrupt_requested !== true) {
      if (bridge.failed === true) return { status: "failed", terminal: true, session_id: threadId, cursor: nextCursor, raw: null, error: { code: "PROVIDER_HEALTH_FAILED", message: "Codex bridge reported a terminal protocol failure" }, evidence: "bridge recorded a terminal protocol failure" };
      if (bridge.turn_status === "completed" && bridge.stdout_complete === true && typeof state.stdout === "string") {
        return { status: "completed", session_id: threadId, cursor: nextCursor, raw: { stdout: state.stdout, stderr: typeof state.stderr === "string" ? state.stderr : "" }, error: null, evidence: "bridge recorded a completed Codex turn" };
      }
      if (typeof bridge.turn_status === "string") {
        const status = bridge.turn_status;
        const failure = terminalTurnStates.has(status) ? { code: "PROVIDER_HEALTH_FAILED", message: `Codex turn ended with ${status}` } : { code: "PROVIDER_NO_TERMINAL_RESULT", message: `Codex turn ended with ${status} without a terminal result` };
        return { status: "failed", terminal: true, session_id: threadId, cursor: nextCursor, raw: null, error: failure, evidence: `bridge recorded turn/completed with status ${status}` };
      }
      return unknown("PROBE_STATUS_UNKNOWN", "Codex bridge reached a terminal state without a reportable outcome");
    }
    if (bridge.interrupt_requested === true) return unknown("PROBE_SHUTDOWN", "Codex bridge is shutting down");
    // 2. Live app-server query. Only a state that proves the turn can no
    //    longer run is terminal; everything else stays advisory.
    // `PROVIDER_NO_TERMINAL_RESULT` is the existing taxonomy code for a
    // session that can no longer produce a terminal result, so no new public
    // failure code is introduced for a lost thread.
    if (provider.query === "thread_not_found") return { status: "failed", terminal: true, session_id: threadId, cursor: nextCursor, raw: null, error: { code: "PROVIDER_NO_TERMINAL_RESULT", message: "Codex app-server no longer holds this session thread" }, evidence: "app-server reported the thread as not loaded" };
    if (provider.query !== "ok") return unknown("PROBE_STATUS_UNKNOWN", `Codex app-server session state is ${provider.query ?? "unknown"}`);
    const failure = turnFailure(state);
    if (failure) return { status: "failed", terminal: true, session_id: threadId, cursor: nextCursor, raw: null, error: failure, evidence: "Codex app-server reported a terminal turn state" };
    const turnStatus = provider.last_turn?.status ?? null;
    const inFlight = provider.thread_status?.type === "active" || turnStatus === null || turnStatus === "inProgress" || turnStatus === "completed";
    if (!inFlight) return unknown("PROBE_STATUS_UNKNOWN", "Codex app-server reported no live turn and no terminal turn state");
    // Inactivity is never a verdict: a working session stays busy/progressing
    // until the app-server reports a terminal state or the process ends.
    const moved = nextCursor !== null && nextCursor !== cursor;
    return { status: moved ? "progressing" : "busy", session_id: threadId, cursor: nextCursor, raw: null, error: null, evidence: moved ? "Codex session state changed" : "Codex app-server reports a turn in flight" };
  };
}

function parse(stdout) {
  let session = null; let text = null; let usage = null; let done = false;
  for (const item of lines(stdout)) { if (item.type === "thread.started") session ??= nonempty(item.thread_id); if (item.type === "item.completed" && item.item?.type === "agent_message") text = nonempty(item.item.text ?? item.item.content) ?? text; usage ??= item.usage ?? null; done ||= ["turn.completed", "thread.completed"].includes(item.type); }
  return text && done ? { ok: true, text, session_id: session, usage } : invalid("Codex emitted no completed final message");
}

function executionPlan(provider, cwd, session, prompt) {
  // Codex app-server is stdio-only and the bridge consumes stdin to EOF, so
  // session health is served over a loopback side channel owned by this plan.
  const port = randomInt(49_152, 65_536); const url = `http://127.0.0.1:${port}`;
  const input = JSON.stringify({ command: provider.command, cwd, prompt, session, model: provider.model, effort: provider.effort, healthPort: port });
  return { ...plan({ ...provider, command: process.execPath }, cwd, [client], input), healthServer: { url, bind: { hostname: "127.0.0.1", port } }, probeSession: createCodexProbe({ url }), observeLine: jsonProgress };
}

export default {
  capabilities: { continuation: true, attachment_delivery: ["file_only", "always_embed"] },
  // File-only prompts address bundle/... relative to the provider workspace.
  // The app-server itself still enforces a read-only sandbox.
  runFromWritableRoot: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start(provider, cwd, prompt) { return this.resume(provider, cwd, null, prompt); },
  resume(provider, cwd, session, prompt) { return executionPlan(provider, cwd, session, prompt); },
  parse,
};
