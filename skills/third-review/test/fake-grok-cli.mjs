#!/usr/bin/env node

const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("fake-grok 1.0"); process.exit(0); }
const resumeIndex = args.indexOf("--resume");
const sessionId = resumeIndex >= 0 ? args[resumeIndex + 1] : "grok-session";
console.log(JSON.stringify({ type: "thought", data: "checking" }));
console.log(JSON.stringify({ type: "text", data: "GROK_" }));
console.log(JSON.stringify({ type: "text", data: "FINAL" }));
console.log(JSON.stringify({ type: "end", stopReason: "end_turn", sessionId }));
