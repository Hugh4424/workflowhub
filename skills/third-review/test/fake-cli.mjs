#!/usr/bin/env node
import fs from "node:fs";
import readline from "node:readline";
const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("fake-cli 1.0"); process.exit(0); }
if (args.includes("app-server")) {
  const send = (value) => console.log(JSON.stringify(value));
  readline.createInterface({ input: process.stdin }).on("line", (line) => {
    const message = JSON.parse(line);
    if (message.method === "initialize") send({ id: message.id, result: { userAgent: "fake" } });
    else if (["thread/start", "thread/resume"].includes(message.method)) send({ id: message.id, result: { thread: { id: message.params.threadId ?? "codex-session" } } });
    else if (message.method === "turn/start") {
      send({ id: message.id, result: { turn: { id: "turn-1", status: "inProgress", items: [] } } });
      send({ method: "turn/started", params: { threadId: message.params.threadId, turn: { id: "turn-1", status: "inProgress", items: [] } } });
      send({ method: "item/completed", params: { threadId: message.params.threadId, turnId: "turn-1", item: { id: "item-1", type: "agentMessage", text: "codex opinion" } } });
      send({ method: "turn/completed", params: { threadId: message.params.threadId, turn: { id: "turn-1", status: "completed", items: [] } } });
    }
  });
}
else if (args.includes("--wire")) {
  const sessionIndex = args.indexOf("--session");
  const session = sessionIndex >= 0 ? args[sessionIndex + 1] : "12345678-1234-1234-1234-123456789abc";
  readline.createInterface({ input: process.stdin }).on("line", (line) => {
    const message = JSON.parse(line);
    if (message.method === "initialize") console.log(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocol_version: "1.10" } }));
    if (message.method === "prompt") {
      const userInput = message.params?.user_input ?? "";
      const output = userInput.includes("cannot be published")
        ? (process.env.THIRD_REVIEW_FAKE_KIMI_REWRITE_OUTPUT ?? process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT ?? "kimi opinion")
        : (process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT ?? "kimi opinion");
      console.log(JSON.stringify({ jsonrpc: "2.0", method: "event", params: { type: "TextPart", payload: { text: output } } }));
      console.log(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { status: "finished" } }));
      console.error(`To resume this session: kimi -r ${session}`);
    }
  });
}
else if (args.includes("-p")) {
  const model = args[args.indexOf("--model") + 1] ?? null;
  const session_id = model === "emit-private-session" ? "session:/private/session" : "claude-session";
  const usage = model === "emit-private-usage" ? "file:///private/usage" : undefined;
  console.log(`${JSON.stringify({ type: "system", subtype: "init", session_id })}\n${JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "claude opinion", session_id, ...(usage === undefined ? {} : { usage }) })}`);
}
else if (args.includes("--prompt") && args.includes("--output-format")) {
  const prompt = args[args.indexOf("--prompt") + 1] ?? "";
  const instruction = fs.existsSync(".3rd-review-kimi-prompt.md") ? fs.readFileSync(".3rd-review-kimi-prompt.md", "utf8") : prompt;
  const sessionIndex = args.indexOf("--session");
  const session = sessionIndex >= 0 ? args[sessionIndex + 1] : "kimi-session";
  const output = instruction.includes("cannot be published")
    ? (process.env.THIRD_REVIEW_FAKE_KIMI_REWRITE_OUTPUT ?? process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT ?? "kimi opinion")
    : (process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT ?? "kimi opinion");
  console.log(JSON.stringify({ role: "meta", type: "system.version", version: "0.40.1" }));
  console.log(JSON.stringify({ role: "assistant", content: output }));
  console.log(JSON.stringify({ role: "meta", type: "session.resume_hint", session_id: session, command: `kimi -r ${session}` }));
}
else if (args.includes("exec")) console.log(`${JSON.stringify({ type: "thread.started", thread_id: "codex-session" })}\n${JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "codex opinion" } })}\n${JSON.stringify({ type: "turn.completed" })}`);
else if (args.includes("--output-format")) console.log(JSON.stringify({ type: "final", session_id: "kimi-session", text: "kimi opinion" }));
else if (args.includes("run")) console.log(JSON.stringify({ type: "session.completed", session_id: "opencode-session", text: "opencode opinion" }));
else { console.error("unknown fake invocation"); process.exit(1); }
