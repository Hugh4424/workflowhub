#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

// Fixture for both Pi wire modes.  `--mode rpc` is what the adapter uses: the
// prompt arrives as a `{"id","type":"prompt","message"}` command on stdin, the
// session answers `get_state`/`get_entries`, and command answers are kept out of
// the event stream.  `--mode json | --print` keeps the older one-shot behavior
// so the fixture still documents the mode Pi replaced.
const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("pi 0.81.1"); process.exit(0); }
const flagValue = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] ?? null : null; };
const rpcMode = flagValue("--mode") === "rpc";
// Values are deliberately not "1": provider env values are redacted out of the
// broker's transcript, so a numeric flag value can corrupt a session id.
const enabled = (name) => (process.env[name] ?? "") !== "" && process.env[name] !== "0";
const keepAlive = enabled("PI_FAKE_KEEP_ALIVE");
const sessionFlag = args.includes("--session") ? "--session" : "--session-id";
const session = process.env.PI_FAKE_SESSION_ID ?? flagValue(sessionFlag) ?? "pi-fake-session";
const sessionDir = flagValue("--session-dir") ?? path.join(os.tmpdir(), "pi-fake-sessions");
const storePath = path.join(sessionDir, `${session}.json`);
const TIMESTAMP = "fixture";

let entries = [];
try { const stored = JSON.parse(fs.readFileSync(storePath, "utf8")); if (Array.isArray(stored?.entries)) entries = stored.entries; } catch {}
function appendEntry(entry) {
  fs.mkdirSync(sessionDir, { recursive: true });
  entries.push(entry);
  fs.writeFileSync(storePath, `${JSON.stringify({ entries })}\n`);
  return entry;
}
if (!entries.length) {
  appendEntry({ type: "model_change", id: "fixture-model", parentId: null, timestamp: TIMESTAMP, provider: "fixture", modelId: flagValue("--model") ?? "fixture-model" });
  appendEntry({ type: "thinking_level_change", id: "fixture-thinking", parentId: "fixture-model", timestamp: TIMESTAMP, thinkingLevel: flagValue("--thinking") ?? "high" });
}
const nextEntryId = () => `fixture-${entries.length + 1}`;

let streaming = false;
let ended = false;
const emit = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
const append = (parentId, message) => appendEntry({ type: "message", id: nextEntryId(), parentId, timestamp: TIMESTAMP, message });

function finishTurn() {
  // Real RPC mode keeps the process alive until stdin closes; the fixture keeps
  // its default exiting shape so the stream transcript stays the primary path,
  // and a set `PI_FAKE_KEEP_ALIVE` reproduces the real long-lived session.
  if (keepAlive || ended) return;
  ended = true;
  try { process.stdin.pause(); process.stdin.removeAllListeners("data"); process.stdin.unref?.(); } catch {}
}

function runTurn(prompt) {
  const rewrite = prompt.startsWith("Your prior final response cannot be published");
  const rateLimitFixture = prompt === "PI_RATE_LIMIT_FIXTURE";
  const stopReason = rateLimitFixture ? "error" : process.env.PI_FAKE_STOP_REASON ?? "stop";
  const willRetry = process.env.PI_FAKE_WILL_RETRY === "1";
  const settled = rewrite ? process.env.PI_FAKE_REWRITE_NO_SETTLED !== "1" : process.env.PI_FAKE_NO_SETTLED !== "1";
  if (process.env.PI_FAKE_PROMPT_LOG) fs.appendFileSync(process.env.PI_FAKE_PROMPT_LOG, `${JSON.stringify({ session, prompt })}\n`);
  streaming = true;
  const userMessage = { role: "user", content: [{ type: "text", text: prompt }], timestamp: 1 };
  const userEntry = append(entries.at(-1)?.id ?? null, userMessage);
  emit({ type: "agent_start" });
  emit({ type: "turn_start" });
  emit({ type: "message_start", message: userMessage });
  emit({ type: "message_end", message: userMessage });
  emit({ type: "message_start", message: { role: "assistant", content: [], model: "deepseek-v4-flash", timestamp: 2 } });
  emit({ type: "message_update", assistantMessageEvent: { type: "thinking_delta", delta: "x".repeat(
  process.env.PI_FAKE_OVERSIZED_UPDATE === "1" ? 10 * 1024 * 1024 + 1
    : process.env.PI_FAKE_LARGE_LEGAL_EVENT === "1" ? 2 * 1024 * 1024
      : 8192) } });
  const fixturePath = String.fromCharCode(47, 112, 114, 105, 118, 97, 116, 101, 47, 102, 105, 120, 116, 117, 114, 101);
  const outputCase = process.env.PI_FAKE_OUTPUT_CASE;
  const text = outputCase === "private-then-safe"
    ? (rewrite ? '{"verdict":"pass","summary":"safe","findings":[]}' : `finding=${fixturePath}`)
    : outputCase === "private-twice"
      ? `finding=${fixturePath}`
      : rewrite ? (process.env.PI_FAKE_REWRITE_OUTPUT ?? `PI_FINAL:${prompt}`) : (process.env.PI_FAKE_INITIAL_OUTPUT ?? `PI_FINAL:${prompt}`);
  const assistantMessage = {
    role: "assistant",
    content: [{ type: "thinking", thinking: "private" }, { type: "text", text }],
    model: "deepseek-v4-flash",
    usage: { totalTokens: 7 },
    stopReason,
    timestamp: 3,
    ...(rateLimitFixture ? { errorMessage: "429 The engine is currently overloaded, please try again later" } : process.env.PI_FAKE_ERROR_MESSAGE ? { errorMessage: process.env.PI_FAKE_ERROR_MESSAGE } : {}),
  };
  emit({ type: "message_end", message: assistantMessage });
  append(userEntry.id, assistantMessage);
  streaming = false;
  emit({ type: "turn_end", message: assistantMessage, toolResults: [] });
  emit(process.env.PI_FAKE_MISSING_WILL_RETRY === "1" ? { type: "agent_end" } : { type: "agent_end", willRetry });
  if (settled) emit({ type: "agent_settled" });
  finishTurn();
}

function reply(command, data, error) {
  const response = { id: command?.id, type: "response", command: command?.type ?? "parse", success: error === undefined };
  if (error === undefined && data !== undefined) response.data = data;
  if (error !== undefined) response.error = error;
  process.stdout.write(`${JSON.stringify(response)}\n`);
}
function handle(line) {
  // `PI_FAKE_RPC_SILENT=1` models a live session whose command channel never
  // answers: the supervisor must stay unable to verify anything.
  if (enabled("PI_FAKE_RPC_SILENT")) return;
  let command; try { command = JSON.parse(line); } catch { reply({ type: "parse" }, undefined, "Failed to parse command"); return; }
  if (command?.type === "get_state") { reply(command, { isStreaming: streaming, sessionId: session, messageCount: entries.filter((entry) => entry.type === "message").length }); return; }
  if (command?.type === "get_entries") { reply(command, { entries, leafId: entries.at(-1)?.id ?? null }); return; }
  if (command?.type === "prompt") {
    if (process.env.PI_FAKE_PROMPT_REJECT) { reply(command, undefined, process.env.PI_FAKE_PROMPT_REJECT); return; }
    reply(command);
    setImmediate(() => runTurn(command.message));
    return;
  }
  reply(command, undefined, `Unknown command: ${command?.type}`);
}

let buffered = "";
process.stdin.setEncoding("utf8");
if (rpcMode) {
  process.stdin.on("data", (chunk) => {
    buffered += chunk;
    let newline;
    while ((newline = buffered.indexOf("\n")) !== -1) {
      const line = buffered.slice(0, newline).replace(/\r$/, "");
      buffered = buffered.slice(newline + 1);
      if (line.trim()) handle(line);
    }
  });
  process.stdin.resume();
} else {
  process.stdin.on("data", (chunk) => { buffered += chunk; });
  process.stdin.on("end", () => {
    emit({ type: "session", version: 3, id: session });
    runTurn(buffered);
  });
}
