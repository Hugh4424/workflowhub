#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("sealed-review-provider 1.0"); process.exit(0); }
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const packetBytes = readFileSync(join(process.cwd(), "review-packet.v1.json"));
  const diffBytes = readFileSync(join(process.cwd(), "changes.diff"));
  const manifestBytes = readFileSync(join(process.cwd(), "manifest.json"));
  JSON.parse(packetBytes); JSON.parse(manifestBytes);
  const review = { findings: [] };
  console.log(JSON.stringify({ type: "session.completed", session_id: "sealed-session", text: JSON.stringify(review) }));
});
