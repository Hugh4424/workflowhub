#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const input = JSON.parse(raw);
// Reviews are attachment-only. Give each run a minimal Codex home so
// unrelated host MCP integrations (notably an unauthenticated Figma server)
// cannot keep app-server progressing. Copy only the native auth token needed
// for the configured Codex account; all other host configuration is excluded.
const sourceCodexHome = process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
const isolatedCodexHome = fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-codex-home-"));
const permissionProfile = "review_packet";
try {
  const auth = path.join(sourceCodexHome, "auth.json");
  if (fs.existsSync(auth)) fs.copyFileSync(auth, path.join(isolatedCodexHome, "auth.json"), fs.constants.COPYFILE_EXCL);
  const config = [
    `default_permissions = "${permissionProfile}"`,
    "[mcp_servers]",
    `[permissions.${permissionProfile}.workspace_roots]`,
    `${JSON.stringify(input.cwd)} = true`,
    `[permissions.${permissionProfile}.filesystem]`,
    '":root" = "deny"',
    '":minimal" = "read"',
    `[permissions.${permissionProfile}.filesystem.":workspace_roots"]`,
    '"." = "read"',
    `[permissions.${permissionProfile}.network]`,
    "enabled = false",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(isolatedCodexHome, "config.toml"), config, { mode: 0o600, flag: "wx" });
} catch (error) {
  fs.rmSync(isolatedCodexHome, { recursive: true, force: true });
  throw error;
}
const server = spawn(input.command, ["app-server", "--stdio"], { cwd: input.cwd, env: { ...process.env, CODEX_HOME: isolatedCodexHome }, stdio: ["pipe", "pipe", "pipe"] });
// The bridge transcript and the app-server transcript are the only state this
// process keeps. Recording them lets the read-only health endpoint answer even
// after the app-server has stopped talking to us.
const transcriptLimit = 1_048_576;
let recordedStdout = ""; let recordedStderr = ""; let stdoutComplete = true; let stderrComplete = true;
const send = (message) => server.stdin.write(`${JSON.stringify(message)}\n`);
const emit = (message) => { const line = `${JSON.stringify(message)}\n`; if (stdoutComplete) { if (recordedStdout.length + line.length > transcriptLimit) stdoutComplete = false; else recordedStdout += line; } process.stdout.write(line); };
let threadId = null; let turnId = null; let terminal = false; let failed = false; let turnOutcome = null; let interruptRequested = false;

const cleanup = () => { health?.close(); try { fs.rmSync(isolatedCodexHome, { recursive: true, force: true }); } catch { /* private temp cleanup is best effort */ } };
const finish = () => { if (terminal) return; terminal = true; if (!server.killed) server.kill("SIGTERM"); };
const fail = (message) => { failed = true; emit({ type: "error", message }); finish(); };
const startTurn = () => send({
  method: "turn/start", id: 2,
  params: {
    threadId, input: [{ type: "text", text: input.prompt }], cwd: input.cwd,
    approvalPolicy: "never",
    ...(input.model ? { model: input.model } : {}),
    ...(input.effort ? { effort: input.effort } : {}),
  },
});

// Side channel for the health probe. Codex app-server only speaks stdio and
// this bridge already consumed stdin to EOF, so authoritative session state is
// republished over a loopback HTTP endpoint instead. Every id used here is
// above the fixed protocol ids so the existing stdout contract is untouched.
let probeSequence = 100;
const probeRequests = new Map();
const askServer = (method, params, timeoutMs = 1_500) => new Promise((resolve) => {
  if (server.exitCode !== null || server.stdin.destroyed) { resolve({ unavailable: true }); return; }
  const id = (probeSequence += 1);
  // A query that does not come back is reported as unknown; it is never
  // treated as provider inactivity, so it can never end a live session.
  const timer = setTimeout(() => { probeRequests.delete(id); resolve({ timeout: true }); }, timeoutMs);
  probeRequests.set(id, (message) => { clearTimeout(timer); resolve(message); });
  try { send({ method, id, params }); }
  catch (error) { clearTimeout(timer); probeRequests.delete(id); resolve({ unavailable: true, message: error.message }); }
});
function normalizeTurn(turn) {
  const itemCount = Array.isArray(turn?.items) ? turn.items.length : null;
  const code = turn?.error?.code ?? turn?.error?.codexErrorInfo ?? null;
  const message = typeof turn?.error?.message === "string" ? turn.error.message : null;
  return { id: turn?.id ?? null, status: typeof turn?.status === "string" ? turn.status : null, items_view: turn?.itemsView ?? null, item_count: itemCount, error: message || code ? { code, message } : null };
}
async function providerState() {
  if (!threadId) return { query: "no_thread", thread_id: null };
  const read = await askServer("thread/read", { threadId });
  if (read.timeout) return { query: "timeout", thread_id: threadId };
  if (read.unavailable) return { query: "app_server_unavailable", thread_id: threadId };
  if (read.error) {
    const message = String(read.error.message ?? "");
    const code = read.error.code ?? null;
    // A thread this app-server started and no longer holds cannot run a turn.
    return /thread not loaded/i.test(message) ? { query: "thread_not_found", thread_id: threadId, error: { code, message } } : { query: "error", thread_id: threadId, error: { code, message } };
  }
  const thread = read.result?.thread ?? {};
  const listed = await askServer("thread/turns/list", { threadId });
  let turnsSupported = true; let turnCount = null; let ownTurn = null; let newestTurn = null; let turnsError = null;
  if (listed.timeout) turnsError = { code: "TIMEOUT", message: "thread/turns/list timed out" };
  else if (listed.unavailable) turnsError = { code: "UNAVAILABLE", message: "thread/turns/list unavailable" };
  else if (listed.error) {
    const message = String(listed.error.message ?? "");
    if (/not supported yet/i.test(message)) turnsSupported = false;
    else if (/thread not loaded/i.test(message)) return { query: "thread_not_found", thread_id: threadId, error: { code: listed.error.code ?? null, message } };
    else turnsError = { code: listed.error.code ?? null, message };
  } else {
    const data = Array.isArray(listed.result?.data) ? listed.result.data : [];
    turnCount = data.length;
    if (data[0]) newestTurn = normalizeTurn(data[0]);
    // thread/turns/list is newest first and may include turns from earlier
    // rounds of a resumed thread. Only this bridge's own turn id may ever
    // support a terminal verdict; a stale turn or an unknown position must
    // stay advisory.
    const own = turnId ? data.find((turn) => turn?.id === turnId) : null;
    if (own) ownTurn = normalizeTurn(own);
  }
  return { query: "ok", thread_id: threadId, thread_status: thread?.status ?? null, turns_supported: turnsSupported, turn_count: turnCount, last_turn: ownTurn, newest_turn: newestTurn, turns_error: turnsError };
}
function healthPayload(state) {
  const completed = terminal && !failed && !interruptRequested && turnOutcome === "completed" && stdoutComplete;
  return {
    ok: true,
    bridge: {
      thread_id: threadId, turn_id: turnId, turn_status: turnOutcome, terminal, failed,
      interrupt_requested: interruptRequested,
      app_server_exited: server.exitCode !== null,
      stdout_complete: stdoutComplete, stderr_complete: stderrComplete,
      stdout_bytes: Buffer.byteLength(recordedStdout, "utf8"), stderr_bytes: Buffer.byteLength(recordedStderr, "utf8"),
    },
    provider: state,
    // The transcript is republished only for a completed turn this bridge
    // already observed, so the harvest is the review's own record and not a
    // reconstruction.
    stdout: completed ? recordedStdout : null,
    stderr: stderrComplete ? recordedStderr : null,
    cursor: createHash("sha256").update(JSON.stringify([threadId, turnId, turnOutcome, terminal, failed, state, recordedStdout.length, recordedStderr.length])).digest("hex"),
  };
}
const health = Number.isInteger(input.healthPort) && input.healthPort > 0 && input.healthPort < 65_536 ? http.createServer((request, response) => {
  request.on("error", () => { /* an aborted health request must never fail the review */ });
  response.on("error", () => { /* an aborted health request must never fail the review */ });
  const pathname = (() => { try { return new URL(request.url ?? "/", "http://127.0.0.1").pathname; } catch { return "/"; } })();
  if (request.method !== "GET" || pathname !== "/session/status") { response.writeHead(404, { "content-type": "application/json" }); response.end('{"ok":false}'); return; }
  const finishResponse = (payload) => { try { const body = JSON.stringify(payload); response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "content-length": Buffer.byteLength(body) }); response.end(body); } catch { /* an aborted health request must never fail the review */ } };
  // A terminal turn already observed on the stream needs no further provider
  // query: the bridge transcript is the authoritative record at that point.
  if (terminal) { finishResponse(healthPayload({ query: "bridge_terminal", thread_id: threadId })); return; }
  providerState().then((state) => finishResponse(healthPayload(state)), (error) => finishResponse({ ok: false, error: String(error?.message ?? error) }));
}) : null;
if (health) { health.on("error", () => { /* a busy health port must never fail the review */ }); health.listen(input.healthPort, "127.0.0.1"); health.unref?.(); }

readline.createInterface({ input: server.stdout }).on("line", (line) => {
  let message; try { message = JSON.parse(line); } catch { fail("Codex app-server emitted invalid JSON"); return; }
  if (message.id !== undefined && probeRequests.has(message.id)) { probeRequests.get(message.id)(message); return; }
  if (message.error) { fail(message.error.message ?? "Codex app-server request failed"); return; }
  if (message.id === 0) {
    send({ method: "initialized", params: {} });
    send(input.session ? { method: "thread/resume", id: 1, params: { threadId: input.session, cwd: input.cwd, approvalPolicy: "never", permissions: permissionProfile, ...(input.model ? { model: input.model } : {}) } } : { method: "thread/start", id: 1, params: { cwd: input.cwd, approvalPolicy: "never", permissions: permissionProfile, ...(input.model ? { model: input.model } : {}), serviceName: "3rd-review" } });
  } else if (message.id === 1) {
    threadId = message.result?.thread?.id ?? input.session; if (!threadId) { fail("Codex app-server returned no thread id"); return; }
    emit({ type: "thread.started", thread_id: threadId }); startTurn();
  } else if (message.id === 2) turnId = message.result?.turn?.id ?? turnId;
  else if (message.method === "turn/started") { turnId = message.params?.turn?.id ?? turnId; emit({ type: "turn.started", turn_id: turnId }); }
  else if (message.method === "item/completed") {
    const item = message.params?.item;
    if (item?.type === "agentMessage") emit({ type: "item.completed", item: { type: "agent_message", text: item.text ?? item.content } });
    else emit({ type: "item.completed", item });
  } else if (message.method === "turn/completed") {
    const status = message.params?.turn?.status;
    turnOutcome = typeof status === "string" ? status : null;
    if (status === "completed") emit({ type: "turn.completed", usage: message.params?.turn?.usage ?? null });
    else emit({ type: "turn.failed", error: { message: `Codex turn ended with ${status ?? "unknown"}` } });
    finish();
  }
});
server.stderr.on("data", (chunk) => { if (stderrComplete) { const value = chunk.toString(); if (recordedStderr.length + value.length > 65_536) stderrComplete = false; else recordedStderr += value; } process.stderr.write(chunk); });
server.once("error", (error) => fail(error.message));
server.once("close", (code) => { cleanup(); process.exit(failed ? 1 : (terminal && code === 0 ? 0 : (code || (terminal ? 0 : 1)))); });
send({ method: "initialize", id: 0, params: { clientInfo: { name: "3rd_review", title: "3rd-review", version: "4.0.0" }, capabilities: { experimentalApi: true } } });

const interrupt = () => {
  interruptRequested = true;
  if (threadId && turnId && !server.killed) send({ method: "turn/interrupt", id: 99, params: { threadId, turnId } });
  finish();
};
process.once("SIGTERM", interrupt);
process.once("SIGINT", interrupt);
