#!/usr/bin/env node
process.stdout.write(`${JSON.stringify({ type: "system", subtype: "init", session_id: "claude-session" })}\n`);
process.stdout.write(`${JSON.stringify({ type: "assistant", session_id: "claude-session", message: { content: [{ type: "text", text: "working" }] } })}\n`);
process.stdout.write(`${JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "CLAUDE_FINAL", session_id: "claude-session", usage: { input_tokens: 1 } })}\n`);
setInterval(() => {}, 60_000);
