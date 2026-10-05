#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("slow-success 1.0"); process.exit(0); }
setTimeout(() => {
  console.log(JSON.stringify({ role: "meta", type: "system.version", version: "0.40.1" }));
  console.log(JSON.stringify({ role: "assistant", content: "slow opinion" }));
  console.log(JSON.stringify({ role: "meta", type: "session.resume_hint", session_id: "kimi-session", command: "kimi -r kimi-session" }));
}, 150);
