#!/usr/bin/env node

const args = process.argv.slice(2);
const promptIndex = args.indexOf("--prompt");
if (promptIndex < 0 || typeof args[promptIndex + 1] !== "string") process.exit(2);

const session = "session_0123456789abcdef";
const rows = [
  { role: "meta", type: "system.version", version: "0.40.1" },
  { role: "assistant", content: "KIMI_CODE_FIXTURE_OK" },
  { role: "meta", type: "session.resume_hint", session_id: session, command: `kimi -r ${session}` },
];
for (const row of rows) process.stdout.write(`${JSON.stringify(row)}\n`);
