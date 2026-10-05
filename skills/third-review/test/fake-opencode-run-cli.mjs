#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("fake-opencode 1.0"); process.exit(0); }
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const sessionIndex = args.indexOf("--session");
  const session_id = sessionIndex >= 0 ? args[sessionIndex + 1] : "capture-opencode-session";
  const bundle = fs.existsSync(path.join(process.cwd(), "bundle")) ? path.join(process.cwd(), "bundle") : process.cwd();
  const has_triage_files = ["review-packet.v1.json", "changes.diff", "manifest.json"].every((file) => fs.existsSync(path.join(bundle, file)));
  const text = JSON.stringify({ resumed_session_id: sessionIndex >= 0 ? session_id : null, cwd_sha256: createHash("sha256").update(process.cwd()).digest("hex"), has_triage_files });
  console.log(JSON.stringify({ type: "session.completed", session_id, text }));
});
