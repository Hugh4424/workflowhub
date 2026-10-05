#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const send = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
// Minimal but faithful view of the app-server read API: threads are loaded,
// thread/read exposes a ThreadStatus, and thread/turns/list is unavailable
// until the first user message (as upstream reports "list_turns is not
// supported yet"), newest turn first.
const threads = new Map();
// COMPLETE_HOLD models an app-server that published a completed turn and then
// refuses to exit; it exercises the side channel's completed-turn republish.
let holdOpen = false;
let experimentalApi = false;
process.on("SIGTERM", () => { if (!holdOpen) process.exit(0); });
const notLoaded = (threadId) => ({ code: -32600, message: `thread not loaded: ${threadId}` });
const summarize = (turn) => ({ id: turn.id, items: turn.items, itemsView: "summary", status: turn.status, error: turn.error ?? null, startedAt: null, completedAt: null, durationMs: null });
readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    experimentalApi = message.params?.capabilities?.experimentalApi === true;
    send({ id: message.id, result: { userAgent: "fake" } });
  }
  if (message.method === "thread/start" || message.method === "thread/resume") {
    const config = fs.readFileSync(path.join(process.env.CODEX_HOME, "config.toml"), "utf8");
    if (message.params.permissions !== "review_packet"
        || message.params.sandbox !== undefined
        || message.params.sandboxPolicy !== undefined
        || !experimentalApi
        || !config.includes('":root" = "deny"')
        || !config.includes('":minimal" = "read"')
        || !config.includes(`${JSON.stringify(message.params.cwd)} = true`)
        || !config.includes('"." = "read"')
        || !config.includes('[permissions.review_packet.network]')
        || !config.includes('enabled = false')) {
      send({ id: message.id, error: { code: -32602, message: "thread must select the restricted profile without a legacy sandbox override" } });
      return;
    }
    const id = message.params.threadId ?? "codex-thread";
    if (!threads.has(id)) threads.set(id, { id, status: { type: "idle" }, turns: [] });
    send({ id: message.id, result: { thread: { id } } });
  }
  if (message.method === "thread/read") {
    const thread = threads.get(message.params?.threadId);
    if (!thread) { send({ id: message.id, error: notLoaded(message.params?.threadId) }); return; }
    send({ id: message.id, result: { thread: { id: thread.id, sessionId: thread.id, status: thread.status, turns: [] } } });
  }
  if (message.method === "thread/turns/list") {
    const thread = threads.get(message.params?.threadId);
    if (!thread) { send({ id: message.id, error: notLoaded(message.params?.threadId) }); return; }
    if (!thread.turns.length) { send({ id: message.id, error: { code: -32601, message: "list_turns is not supported yet" } }); return; }
    send({ id: message.id, result: { data: thread.turns.map(summarize), nextCursor: null, backwardsCursor: null } });
  }
  if (message.method === "turn/start") {
    const text = message.params.input?.[0]?.text;
    if (text === "REQUIRE_RESTRICTED_SANDBOX") {
      if (message.params.permissions !== undefined
          || message.params.sandbox !== undefined
          || message.params.sandboxPolicy !== undefined) {
        send({ id: message.id, error: { code: -32602, message: "turn must inherit the restricted thread profile" } });
        return;
      }
    }
    if (text === "FAIL_PROTOCOL") { send({ id: message.id, error: { code: -32602, message: "bad turn" } }); return; }
    const thread = threads.get(message.params.threadId) ?? { id: message.params.threadId, status: { type: "idle" }, turns: [] };
    threads.set(thread.id, thread);
    const turn = { id: "codex-turn", items: [], status: "inProgress", error: null };
    thread.turns.unshift(turn);
    thread.status = { type: "active", activeFlags: [] };
    send({ id: message.id, result: { turn: { id: turn.id, status: "inProgress", items: [] } } });
    send({ method: "turn/started", params: { threadId: thread.id, turn: { id: turn.id, status: "inProgress", items: [] } } });
    // HOLD_TURN models a turn that is still running: the side channel must
    // report it as non-terminal no matter how long it stays that way.
    if (text === "HOLD_TURN") return;
    // TURN_FAILS_SILENT models a terminal provider verdict that this bridge
    // never receives on its stdout stream.
    if (text === "TURN_FAILS_SILENT") { turn.status = "failed"; turn.error = { message: "fake app-server rejected the turn" }; thread.status = { type: "systemError" }; return; }
    // THREAD_LOST models an app-server that no longer holds the session thread,
    // so no turn can reach a terminal result.
    if (text === "THREAD_LOST") { threads.delete(thread.id); return; }
    if (text === "COMPLETE_HOLD") holdOpen = true;
    turn.status = "completed";
    turn.items = [{ id: "item-1", type: "agentMessage", text: "CODEX_FINAL" }];
    thread.status = { type: "idle" };
    send({ method: "item/completed", params: { threadId: thread.id, turnId: turn.id, item: { id: "item-1", type: "agentMessage", text: "CODEX_FINAL" } } });
    send({ method: "turn/completed", params: { threadId: thread.id, turn: { id: turn.id, status: "completed", items: [] } } });
  }
  if (message.method === "turn/interrupt") process.exit(0);
});
