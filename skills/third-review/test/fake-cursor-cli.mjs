#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
if (argv.includes("--version")) {
  process.stdout.write("cursor-agent fake\n");
  process.exit(0);
}

let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;
if (!prompt) {
  process.stderr.write("missing prompt\n");
  process.exit(2);
}

const resumeAt = argv.indexOf("--resume");
const session_id = resumeAt >= 0 ? argv[resumeAt + 1] : "cursor-session";
let result = "CURSOR_FINAL";
const bundleDiff = path.join(process.cwd(), "bundle", "changes.diff");
if (prompt.includes("DIFF_FOR_always_embed")) {
  result = "ALWAYS_EMBED:DIFF_FOR_always_embed";
} else if (fs.existsSync(bundleDiff)) {
  const diff = fs.readFileSync(bundleDiff, "utf8").trim();
  if (prompt.includes(diff)) {
    process.stderr.write("file_only prompt unexpectedly embedded the diff\n");
    process.exit(3);
  }
  result = `FILE_ONLY:${diff}`;
}
const emit = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
emit({ type: "system", subtype: "init", session_id });
if (prompt.includes("EMIT_RETRY")) emit({ type: "retry", subtype: "starting", session_id });
// Prompt-only escape simulation. The escalated retry prompt starts with STOP.,
// so DENY_ONCE attempts a denied native read only on the first turn, while
// DENY_ALWAYS attempts one on every turn.
const escalated = prompt.startsWith("STOP.");
if (prompt.includes("DENY_ALWAYS") || (prompt.includes("DENY_ONCE") && !escalated)) {
  emit({
    type: "tool_call", subtype: "started", session_id, call_id: "native-escape",
    tool_call: { readToolCall: { args: { path: "lib/broker.mjs" } } },
  });
  // Supervision terminates the process here; nothing after this is reached.
  setTimeout(() => {}, 10_000);
} else {
  if (escalated) result = "CURSOR_AFTER_ESCALATION";
  emit({ type: "assistant", message: { content: [{ type: "text", text: result }] }, session_id });
  emit({ type: "result", subtype: "success", is_error: false, result, session_id, usage: { inputTokens: 10, outputTokens: 2 } });
}
