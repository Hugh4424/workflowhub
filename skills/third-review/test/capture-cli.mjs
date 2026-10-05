#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("capture-cli 1.0"); process.exit(0); }
function captured(input) {
  const bundle = fs.existsSync(path.join(process.cwd(), "bundle")) ? path.join(process.cwd(), "bundle") : process.cwd();
  const has_triage_files = ["review-packet.v1.json", "changes.diff", "manifest.json"].every((file) => fs.existsSync(path.join(bundle, file)));
  const diff = has_triage_files ? fs.readFileSync(path.join(bundle, "changes.diff"), "utf8") : "";
  const packet = has_triage_files ? JSON.parse(fs.readFileSync(path.join(bundle, "review-packet.v1.json"), "utf8")) : null;
  const manifest = has_triage_files ? JSON.parse(fs.readFileSync(path.join(bundle, "manifest.json"), "utf8")) : null;
  return JSON.stringify({ args, input, cwd: process.cwd(), has_triage_files, diff_head: diff.includes("DIFF_HEAD"), diff_middle: diff.includes("DIFF_MIDDLE"), diff_tail: diff.includes("DIFF_TAIL"), packet_hash: packet?.packet_hash ?? null, manifest_hash: manifest?.manifest_hash ?? null, diff_sha256: manifest?.diff_sha256 ?? null });
}
if (args.includes("--wire")) {
  const sessionIndex = args.indexOf("--session"); const session = sessionIndex >= 0 ? args[sessionIndex + 1] : "12345678-1234-1234-1234-123456789abc";
  const lines = readline.createInterface({ input: process.stdin });
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    if (message.method === "initialize") console.log(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocol_version: "1.10" } }));
    if (message.method === "prompt") {
      console.log(JSON.stringify({ jsonrpc: "2.0", method: "event", params: { type: "ContentPart", payload: { type: "text", text: captured(message.params.user_input) } } }));
      console.log(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { status: "finished" } }));
    }
  });
  lines.on("close", () => console.error(`To resume this session: kimi -r ${session}`));
} else {
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const text = captured(input);
  if (args.includes("--output-format")) console.log(JSON.stringify({ type: "final", session_id: "capture-kimi-session", text }));
  else if (args.includes("run")) console.log(JSON.stringify({ type: "session.completed", session_id: "capture-opencode-session", text }));
  else console.log(JSON.stringify({ type: "thread.started", thread_id: "capture-codex-session" }) + "\n" + JSON.stringify({ type: "item.completed", item: { type: "agent_message", text } }) + "\n" + JSON.stringify({ type: "turn.completed" }));
});
}
