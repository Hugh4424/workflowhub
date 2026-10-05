#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("stdin-opencode 1.0"); process.exit(0); }
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => { console.log(JSON.stringify({ type: "session.completed", session_id: "opencode-stdin-session", text: JSON.stringify({ bytes: Buffer.byteLength(input), head: input.slice(0, 128), tail: input.slice(-128) }) })); });
