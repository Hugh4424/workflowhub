#!/usr/bin/env node
const args = process.argv.slice(2);

if (args.includes("--version")) { console.log("agy 1.1.5"); process.exit(0); }
if (process.env.AGY_FAKE_EMPTY === "1") process.exit(0);
const prompt = args[args.indexOf("-p") + 1] ?? "";
const cwd = process.cwd();
const cwdResult = cwd.endsWith("/workspace/antigravity") ? "workspace/antigravity" : "unexpected-cwd";
console.log(process.env.AGY_FAKE_CWD_MODE === "true" ? `AGY_FINAL:${cwdResult}` : `AGY_FINAL:${prompt}`);
