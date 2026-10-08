#!/usr/bin/env node
const args = process.argv.slice(2);

if (args.includes("--version")) { console.log("agy 1.1.5"); process.exit(0); }
if (process.env.AGY_FAKE_EMPTY === "1") process.exit(0);
const prompt = args[args.indexOf("-p") + 1] ?? "";
const cwd = process.cwd();
const cwdResult = cwd.endsWith("/workspace/antigravity") ? "workspace/antigravity" : "unexpected-cwd";
console.log(JSON.stringify({ event: "init" }));
console.log(JSON.stringify({ event: "step_update", step_update: { conversation_id: "fake-agy", step_index: 1, state: "DONE" } }));
console.log(JSON.stringify({ event: "result", result: { status: "SUCCESS", response: process.env.AGY_FAKE_CWD_MODE === "true" ? `AGY_FINAL:${cwdResult}` : `AGY_FINAL:${prompt}` } }));
