#!/usr/bin/env node
import { spawn } from "node:child_process";
import http from "node:http";
import process from "node:process";
import { failureCode, failureMessage, PROVIDER_FAILURE_PREFIX } from "../provider-failure.mjs";

// Pi owns the agent turn but exposes no socket and no file that can answer
// "is this session still alive".  Its RPC mode multiplexes commands and events
// over the child's own stdin/stdout, so only this supervisor, which owns that
// stdio pair, can ask the authoritative question.  The supervisor keeps the
// child's stdin open, answers broker-side health queries on a loopback HTTP
// server from `get_state`/`get_entries` responses, and never decides anything
// from elapsed time: there is no timer in this file.
// A review answer is a single JSONL event and can exceed 1 MiB. The platform
// tolerates 10 MiB of provider output (runtime.max_output_bytes), so a legal
// event must not be rejected below that budget: doing so killed the provider
// with "Pi emitted an event larger than 1048576 bytes". Keep this >= that.
const MAX_RAW_EVENT_BYTES = 10 * 1024 * 1024;
const specification = JSON.parse(Buffer.from(process.argv[2], "base64url").toString("utf8"));

let child = null;
let server = null;
let stopping = false;
let protocolInvalid = false;
let failed = false;
let sessionEmitted = false;
let baselineLeafId = null;
let baselineKnown = false;
let rpcSequence = 0;
const pendingRpc = new Map();

const emit = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
const textBlocks = (content) => Array.isArray(content) ? content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("") : "";
const errorMessage = (message) => {
  for (const value of [message?.errorMessage, message?.error?.message, message?.error, message?.providerError?.message]) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
};
function rejectProtocol(message) {
  if (protocolInvalid) return;
  protocolInvalid = true;
  process.stderr.write(`${message}\n`);
  if (child && !child.killed) child.kill("SIGTERM");
}
function emitFailure(code, session_id = null) {
  const value = { version: 1, code, message: failureMessage(code), ...(session_id ? { session_id } : {}) };
  process.stderr.write(`${PROVIDER_FAILURE_PREFIX}${JSON.stringify(value)}\n`);
}
function rejectPending(message) {
  const pending = [...pendingRpc.values()];
  pendingRpc.clear();
  for (const entry of pending) entry.reject(new Error(message));
}
function cleanup() {
  rejectPending("Pi RPC channel is closed");
  try { server?.closeAllConnections?.(); server?.close(); } catch {}
  if (child && child.exitCode === null && !child.killed) child.kill("SIGTERM");
  try { process.stdin.pause(); process.stdin.unref?.(); } catch {}
}
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(signal, () => { stopping = true; cleanup(); });

// Every RPC command is correlated by `id`.  A pending query is settled by the
// matching `{"type":"response"}` line, by the child closing, or by the requester
// abandoning the query (an expired broker-side health probe).
function rpc(command, signal = null) {
  const { id } = command;
  return new Promise((resolve, reject) => {
    if (stopping || !child || child.exitCode !== null) { reject(new Error("Pi RPC channel is not available")); return; }
    const settle = (finish) => { if (!pendingRpc.has(id)) return; pendingRpc.delete(id); signal?.removeEventListener("abort", onAbort); finish(); };
    const onAbort = () => settle(() => reject(new Error("Pi RPC query was abandoned")));
    pendingRpc.set(id, { resolve: (value) => settle(() => resolve(value)), reject: (error) => settle(() => reject(error)) });
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener("abort", onAbort, { once: true });
    child.stdin.write(`${JSON.stringify(command)}\n`, (error) => { if (error) settle(() => reject(error)); });
  });
}
const query = (type, signal = null) => rpc({ id: `supervisor-${++rpcSequence}`, type }, signal);

function forward(value) {
  if (!value || typeof value !== "object" || typeof value.type !== "string") return rejectProtocol("Pi emitted an invalid JSON event");
  if (value.type === "session") {
    // RPC mode emits no session header; the supervisor publishes the id it read
    // from `get_state`.  Ignore a duplicate header instead of invalidating an
    // otherwise valid transcript.
    if (sessionEmitted) return;
    sessionEmitted = true;
    emit({ type: "pi.session", id: value.id, version: value.version ?? null });
    return;
  }
  if (value.type === "message_update") { emit({ type: "pi.progress", event: value.assistantMessageEvent?.type ?? "message_update" }); return; }
  if (value.type === "message_end" && value.message?.role === "assistant") {
    emit({ type: "pi.final", text: textBlocks(value.message.content), model: value.message.model ?? null, usage: value.message.usage ?? null, stop_reason: value.message.stopReason ?? null, ...(value.message.stopReason === "error" && errorMessage(value.message) ? { error_message: errorMessage(value.message) } : {}) });
    return;
  }
  if (value.type === "agent_end") {
    if (typeof value.willRetry !== "boolean") return rejectProtocol("Pi emitted agent_end without boolean willRetry");
    emit({ type: "pi.agent_end", will_retry: value.willRetry });
    return;
  }
  if (value.type === "agent_settled") { emit({ type: "pi.agent_settled" }); return; }
  if (["turn_start", "turn_end", "tool_execution_start", "tool_execution_end", "message_start"].includes(value.type)) emit({ type: "pi.progress", event: value.type });
}

function consume(line) {
  if (Buffer.byteLength(line, "utf8") > MAX_RAW_EVENT_BYTES) return rejectProtocol(`Pi emitted an event larger than ${MAX_RAW_EVENT_BYTES} bytes`);
  let value; try { value = JSON.parse(line); } catch { return rejectProtocol("Pi emitted malformed JSONL"); }
  // Command answers are supervisor-private: forwarding them to the broker would
  // make the provider transcript unparseable.
  if (value?.type === "response" && typeof value.id === "string" && pendingRpc.has(value.id)) {
    const entry = pendingRpc.get(value.id);
    // Pi's own error text is carried for classification only.  It is never
    // forwarded to the broker and never printed by this supervisor.
    if (value.success === false) entry.reject(new Error(`Pi rejected ${value.command ?? "a command"}: ${typeof value.error === "string" ? value.error : "unknown error"}`));
    else entry.resolve(value);
    return;
  }
  forward(value);
}

// The broker writes exactly one prompt frame (`{"id","type":"prompt","message"}`)
// and keeps stdin open so RPC health queries stay possible after the turn.
function readPromptFrame() {
  return new Promise((resolve, reject) => {
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline === -1) return;
      const line = buffer.slice(0, newline).replace(/\r$/, "");
      buffer = buffer.slice(newline + 1);
      process.stdin.pause();
      if (buffer.trim()) { rejectProtocol("Pi supervisor received more than one prompt frame"); return; }
      let value; try { value = JSON.parse(line); } catch { rejectProtocol("Pi supervisor received a malformed prompt frame"); return; }
      if (value?.type !== "prompt" || typeof value.message !== "string" || !value.message.length) { rejectProtocol("Pi supervisor received an invalid prompt frame"); return; }
      resolve({ id: typeof value.id === "string" && value.id ? value.id : "prompt-1", message: value.message });
    });
    process.stdin.on("end", () => reject(new Error("Pi supervisor received no prompt frame")));
    process.stdin.on("error", (error) => reject(error));
    process.stdin.resume();
  });
}

async function probeSnapshot(signal) {
  const [state, entries] = await Promise.all([query("get_state", signal), query("get_entries", signal)]);
  return {
    version: 1,
    session_id: typeof state?.data?.sessionId === "string" && state.data.sessionId ? state.data.sessionId : null,
    is_streaming: typeof state?.data?.isStreaming === "boolean" ? state.data.isStreaming : null,
    entries: Array.isArray(entries?.data?.entries) ? entries.data.entries : null,
    leaf_id: typeof entries?.data?.leafId === "string" && entries.data.leafId ? entries.data.leafId : null,
    baseline_leaf_id: baselineLeafId,
    baseline_known: baselineKnown,
  };
}
function respond(response, status, value) {
  if (response.writableEnded || response.destroyed) return;
  const body = JSON.stringify(value);
  response.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  response.end(body);
}
function serve() {
  server = http.createServer((request, response) => {
    const path = (() => { try { return new URL(request.url ?? "/", "http://127.0.0.1").pathname; } catch { return null; } })();
    if (request.method !== "GET" || path !== "/probe") { respond(response, 404, { error: "not_found" }); return; }
    const controller = new AbortController();
    response.on("close", () => controller.abort());
    probeSnapshot(controller.signal).then(
      (snapshot) => respond(response, 200, snapshot),
      (error) => respond(response, 502, { error: String(error?.message ?? error) }),
    );
  });
  server.on("error", (error) => process.stderr.write(`Pi health server failed: ${error.message}\n`));
  server.listen(specification.port, "127.0.0.1");
}

child = spawn(specification.command, specification.argv, { cwd: specification.cwd, env: process.env, stdio: ["pipe", "pipe", "pipe"] });
const closed = new Promise((resolve) => {
  child.once("error", (error) => { process.stderr.write(`${error.message}\n`); resolve(1); });
  child.once("close", (value) => resolve(value ?? 1));
});
child.stderr.pipe(process.stderr);
child.stdin.once("error", (error) => { if (error.code !== "EPIPE") process.stderr.write(`Pi stdin failed: ${error.message}\n`); });
let pending = "";
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  if (protocolInvalid) return;
  pending += chunk;
  let newline;
  while ((newline = pending.indexOf("\n")) !== -1) {
    const line = pending.slice(0, newline).replace(/\r$/, "");
    pending = pending.slice(newline + 1);
    consume(line);
    if (protocolInvalid) { pending = ""; return; }
  }
  if (Buffer.byteLength(pending, "utf8") > MAX_RAW_EVENT_BYTES) rejectProtocol(`Pi emitted an event larger than ${MAX_RAW_EVENT_BYTES} bytes`);
});
child.stdout.once("end", () => {
  if (!protocolInvalid && pending) consume(pending.replace(/\r$/, ""));
});
serve();
try {
  const frame = await readPromptFrame();
  // Snapshot the session before the prompt so a terminal entry left behind by
  // an earlier round can never be harvested as this round's result.
  const [state, entries] = await Promise.all([query("get_state"), query("get_entries")]);
  baselineLeafId = typeof entries?.data?.leafId === "string" && entries.data.leafId ? entries.data.leafId : null;
  baselineKnown = true;
  const nativeSession = typeof state?.data?.sessionId === "string" && state.data.sessionId ? state.data.sessionId : null;
  sessionEmitted = true;
  emit({ type: "pi.session", id: nativeSession ?? specification.expectedSession ?? null, version: null });
  try {
    await rpc({ id: frame.id, type: "prompt", message: frame.message });
  } catch (error) {
    // The prompt command can also fail before acceptance (missing credentials,
    // invalid model, compaction in progress).  Nothing runs afterwards, so
    // report the rejection instead of leaving the attempt silent.  Only the
    // classification is published; Pi's own error text stays private.
    if (!protocolInvalid && !stopping) { emitFailure(failureCode(error.message), nativeSession); failed = true; cleanup(); }
  }
} catch (error) {
  if (!protocolInvalid && !stopping) process.stderr.write(`Pi RPC session did not start: ${failureCode(error?.message)}\n`);
}
const code = await closed;
cleanup();
process.exitCode = protocolInvalid || stopping || failed ? 1 : code;
