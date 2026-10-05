import { randomInt, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { invalid, nonempty, plan, restrictedFiles } from "./shared.mjs";
import { failureCode, failureMessage } from "../provider-failure.mjs";

const controller = fileURLToPath(new URL("./pi-supervised-cli.mjs", import.meta.url));
const workspaceGuard = fileURLToPath(new URL("./pi-workspace-guard.mjs", import.meta.url));
const publicOutputPathContract = "Treat any host or absolute path shown inside review material as sensitive host-path fixture data: never quote, reproduce, construct, suggest, or create it in your output. Refer to it only as `host-path fixture`.";
const publicOutputRewritePrompt = "Your prior final response cannot be published because it included prohibited host-path data. Return one complete replacement JSON review that preserves the original verdict and findings. Never quote, reproduce, construct, suggest, or create an absolute path or file URI. Refer to any such fixture only as `host-path fixture`. Findings may name only change_id, context anchors, or logical bundle/<file> names.";
const reviewSystemPrompt = `You are an independent, read-only review analyst. Follow the supplied review instruction exactly. Use only the approved review tool and return only the requested review. ${publicOutputPathContract}`;
const reviewInstruction = `Review only the supplied instruction and the frozen packet files. Use read only with logical bundle/<file> paths. Do not access parent directories, use git, shell, network, host paths, absolute paths, or file URIs. ${publicOutputPathContract} Findings may name only change_id, context anchors, or logical bundle/<file> names. Do not use write or edit tools. Return only the requested review.`;

function text(value) {
  return typeof value === "string" && value.trim() ? value : null;
}

function thinking(provider) {
  if (provider.effort) return provider.effort;
  if (provider.thinking === true) return "low";
  if (provider.thinking === false) return "off";
  return null;
}

function parse(stdout, _stderr = "", expectedSession = null) {
  let session = null; let final = null; let phase = "session"; let malformed = false;
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let item; try { item = JSON.parse(line); } catch { malformed = true; continue; }
    if (item.type === "pi.session") {
      const value = nonempty(item.id); if (!value || session || phase !== "session") { malformed = true; continue; }
      session = value; phase = "turn";
    } else if (item.type === "pi.progress") {
      if (phase !== "turn") malformed = true;
    } else if (item.type === "pi.final") {
      if (phase !== "turn") malformed = true; else final = item;
    } else if (item.type === "pi.agent_end") {
      if (phase !== "turn" || typeof item.will_retry !== "boolean") malformed = true;
      else if (item.will_retry === false) phase = "ending";
    } else if (item.type === "pi.agent_settled") {
      if (phase !== "ending") malformed = true; else phase = "settled";
    } else malformed = true;
  }
  if (malformed) return invalid("Pi supervised stream is malformed");
  if (!session) return invalid("Pi emitted no session header");
  if (expectedSession && session !== expectedSession) return invalid("Pi emitted an unexpected session id");
  if (!final) return invalid("Pi emitted no final assistant message");
  if (final.stop_reason === "error") return { ok: false, error: piFailure(final.error_message ?? ""), session_id: session };
  if (phase !== "settled") return invalid("Pi did not settle its agent turn");
  if (final.stop_reason !== "stop") return invalid("Pi emitted no successful final assistant message");
  const result = text(final.text);
  return result ? { ok: true, text: result, session_id: session, usage: final.usage ?? null } : invalid("Pi emitted no final assistant text");
}

// Pi reports provider failures inside the assistant message rather than through
// its exit status, so both the stream parser and the RPC probe classify the
// same message with the same whitelist.
function piFailure(message) {
  const classified = failureCode(message ?? "");
  const code = ["AUTHENTICATION_FAILED", "NETWORK_TLS_CERTIFICATE", "NETWORK_UNAVAILABLE", "PROVIDER_PERMISSION_DENIED", "RATE_LIMITED"].includes(classified) ? classified : "PROVIDER_HEALTH_FAILED";
  return { code, message: failureMessage(code) };
}
const NO_TERMINAL_RESULT = { code: "PROVIDER_NO_TERMINAL_RESULT", message: failureMessage("PROVIDER_NO_TERMINAL_RESULT") };
const assistantText = (entry) => entry?.message?.role === "assistant" && Array.isArray(entry.message.content)
  ? entry.message.content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("")
  : "";
const stopReasons = Object.freeze({
  aborted: "Pi aborted the agent run without a terminal assistant result",
  length: "Pi stopped at its output limit without a terminal assistant result",
  toolUse: "Pi stopped after tool calls without a terminal assistant result",
  pending: "Pi settled while the assistant message was still pending",
});

async function probeSnapshot(url, signal, fetchImpl) {
  const response = await fetchImpl(`${url}/probe`, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("Pi RPC probe is unavailable");
  const value = await response.json();
  if (!value || typeof value !== "object" || !Array.isArray(value.entries)) throw new Error("Pi RPC probe returned an invalid snapshot");
  return value;
}

// The probe answers one question that only the supervised stdio pair can
// answer: has this native session reached a terminal state, and in which way?
// `get_state.isStreaming` is the authoritative activity flag and `get_entries`
// is an append-only entry log whose `leafId` is a durable cursor.  No part of
// this decision reads a clock, a timestamp, silence, or elapsed time; an
// unreachable or timed-out RPC endpoint can only ever be `unverifiable`, which
// the health runner treats as advisory.
export function createPiProbe({ url, expectedSession = null, fetchImpl = fetch } = {}) {
  return async ({ session_id, cursor = null, signal } = {}) => {
    const unavailable = (code, evidence) => ({ status: "unverifiable", session_id, cursor, raw: null, error: { code, message: code === "PROBE_ABORTED" ? "Pi RPC probe was aborted" : "Pi RPC probe failed" }, evidence });
    if (signal?.aborted) return unavailable("PROBE_ABORTED", "Pi RPC probe aborted");
    let snapshot;
    try { snapshot = await probeSnapshot(url, signal, fetchImpl); }
    catch (error) { return unavailable(signal?.aborted ? "PROBE_ABORTED" : "PROBE_FAILED", signal?.aborted ? "Pi RPC probe aborted" : "Pi RPC health endpoint unavailable"); }
    const entries = snapshot.entries;
    const leafId = nonempty(snapshot.leaf_id);
    const sessionId = nonempty(snapshot.session_id);
    if (!sessionId) return unavailable("PROBE_FAILED", "Pi RPC probe returned no session id");
    if (expectedSession && sessionId !== expectedSession) {
      return { status: "failed", terminal: true, session_id: null, cursor: leafId, raw: null, error: { code: "PROVIDER_OUTPUT_INVALID", message: "Pi emitted an unexpected session id" }, evidence: "Pi reported an unexpected session id" };
    }
    const leaf = leafId ? entries.find((entry) => entry?.id === leafId) ?? null : null;
    if (leafId && !leaf) return unavailable("PROBE_FAILED", "Pi RPC probe returned a leaf outside its entry log");
    if (snapshot.is_streaming === true) {
      const progressed = leafId !== null && leafId !== cursor;
      return progressed
        ? { status: "progressing", session_id: sessionId, cursor: leafId, raw: null, error: null, evidence: "Pi session leaf advanced while streaming" }
        : { status: "busy", session_id: sessionId, cursor: leafId, raw: null, error: null, evidence: "Pi session is streaming" };
    }
    if (snapshot.is_streaming !== false) return unavailable("PROBE_FAILED", "Pi RPC probe returned no activity state");
    // The baseline leaf was captured before this round's prompt was sent.  A
    // session that has not moved past it still holds the previous round's
    // entries, which must never be reported as this round's completion.
    if (snapshot.baseline_known !== true || leafId === nonempty(snapshot.baseline_leaf_id)) {
      return { status: "busy", session_id: sessionId, cursor: leafId, raw: null, error: null, evidence: "Pi has not accepted this round's prompt yet" };
    }
    if (leaf?.type === "message" && leaf.message?.role === "assistant") {
      const stopReason = leaf.message.stopReason ?? null;
      if (stopReason === "error") {
        return { status: "failed", terminal: true, session_id: sessionId, cursor: leafId, raw: null, error: piFailure(leaf.message.errorMessage ?? ""), evidence: "Pi session ended with a terminal assistant error" };
      }
      const text = assistantText(leaf);
      if (stopReason === "stop" && text) {
        const stdout = [
          JSON.stringify({ type: "pi.session", id: sessionId, version: null }),
          JSON.stringify({ type: "pi.progress", event: "health_entries" }),
          JSON.stringify({ type: "pi.final", text, model: leaf.message.model ?? null, usage: leaf.message.usage ?? null, stop_reason: "stop" }),
          JSON.stringify({ type: "pi.agent_end", will_retry: false }),
          JSON.stringify({ type: "pi.agent_settled" }),
        ].join("\n");
        return { status: "completed", session_id: sessionId, cursor: leafId, raw: { stdout: `${stdout}\n`, stderr: "" }, error: null, evidence: "Pi settled with a terminal assistant message" };
      }
      return { status: "failed", terminal: true, session_id: sessionId, cursor: leafId, raw: null, error: NO_TERMINAL_RESULT, evidence: stopReasons[stopReason] ?? "Pi settled without a terminal assistant result" };
    }
    return { status: "failed", terminal: true, session_id: sessionId, cursor: leafId, raw: null, error: NO_TERMINAL_RESULT, evidence: "Pi settled without a terminal assistant result" };
  };
}

function observeLine(stream, line) {
  if (stream !== "stdout") return { progress: false };
  try {
    const item = JSON.parse(line);
    if (item.type === "pi.session") return { liveness: true, progress: false, event: item.type, session_id: nonempty(item.id) };
    if (item.type === "pi.progress") return { liveness: true, progress: true, event: item.event ?? item.type };
    if (["pi.final", "pi.agent_end", "pi.agent_settled"].includes(item.type)) return { liveness: true, progress: true, event: item.type };
    return { progress: false };
  } catch { return { progress: false }; }
}

function executionPlan(provider, cwd, prompt, runtime, session = null) {
  const root = restrictedFiles(runtime, provider); const sessions = path.join(root, "sessions"); fs.mkdirSync(sessions, { recursive: true, mode: 0o700 }); fs.chmodSync(sessions, 0o700);
  const expectedSession = session ?? randomUUID();
  // RPC mode is the only mode that answers "is this session alive" while the
  // turn runs.  `--print` would close the command channel, so the prompt is
  // delivered as an RPC frame and stdin stays open for the supervisor's queries.
  const clientArgv = ["--mode", "rpc"];
  if (provider.model) clientArgv.push("--model", provider.model);
  const level = thinking(provider); if (level) clientArgv.push("--thinking", level);
  clientArgv.push("--no-extensions", "--no-skills", "--no-prompt-templates", "--no-themes", "--no-context-files", "--no-approve", "--system-prompt", reviewSystemPrompt, "--extension", workspaceGuard, "--tools", "read", "--session-dir", sessions);
  clientArgv.push(session ? "--session" : "--session-id", expectedSession);
  const port = randomInt(49152, 65536); const url = `http://127.0.0.1:${port}`;
  const specification = Buffer.from(JSON.stringify({ command: provider.command, argv: clientArgv, cwd, port, url, expectedSession }), "utf8").toString("base64url");
  const input = `${JSON.stringify({ id: "prompt-1", type: "prompt", message: prompt })}\n`;
  return {
    ...plan({ ...provider, command: process.execPath }, cwd, [controller, specification], input),
    keepStdinOpen: true, clientArgv, expectedSession, observeLine,
    healthServer: { url, bind: { hostname: "127.0.0.1", port } },
    probeSession: createPiProbe({ url, expectedSession }),
  };
}

export default {
  capabilities: { continuation: true, attachment_delivery: ["file_only", "always_embed"] },
  modelInstruction: reviewInstruction,
  publicOutputRewritePrompt,
  requiresWritableCwd: true,
  stableContinuationCwd: true,
  runFromWritableRoot: true,
  promptViaStdin: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start: (provider, cwd, prompt, runtime) => executionPlan(provider, cwd, prompt, runtime),
  resume: (provider, cwd, session, prompt, runtime) => executionPlan(provider, cwd, prompt, runtime, session),
  parse,
  observeLine,
};
