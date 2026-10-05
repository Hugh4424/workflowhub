#!/usr/bin/env node
const args = process.argv.slice(2);
const resumed = args[0] === "--resume";
const session_id = resumed && process.env.CLAUDE_TEST_MISMATCH === "1" ? "different-session" : resumed ? args[1] : "claude-empty-session";
if (!resumed) {
  process.stdout.write(`${JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "", session_id })}\n`);
} else {
  process.stdout.write(`${JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "CLAUDE_RESUMED_FINAL", session_id })}\n`);
}
