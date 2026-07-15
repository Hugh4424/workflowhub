#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("sealed-review-provider 1.0"); process.exit(0); }
const sha = (value) => createHash("sha256").update(value).digest("hex");
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const packetBytes = readFileSync(join(process.cwd(), "review-packet.v1.json"));
  const diffBytes = readFileSync(join(process.cwd(), "changes.diff"));
  const manifestBytes = readFileSync(join(process.cwd(), "manifest.json"));
  JSON.parse(packetBytes); JSON.parse(manifestBytes);
  const correction = input.includes("Your prior review output failed");
  const continuation = args.includes("--session");
  const valid = correction || continuation;
  const ids = ["C1", "C2", "C3", "H1", "H2", "H3"];
  const summary = ["PROVIDER_READ", sha(packetBytes), sha(diffBytes), sha(manifestBytes), diffBytes.includes("MARKER_HEAD"), diffBytes.includes("MARKER_MIDDLE"), diffBytes.includes("MARKER_TAIL")].join(":");
  const review = {
    packet_status: "complete", verdict: "pass", summary, findings: [],
    checklist: ids.map((id) => ({ id, passed: true, evidence: `changes.diff:1 verifies ${id}` })),
    ...(valid ? { pass_items: ids.map((id) => ({ rule_id: id, artifact_anchor: `changes.diff:1#${id}`, evidence: `sealed material verifies ${id}` })) } : {}),
    skillResults: [],
  };
  console.log(JSON.stringify({ type: "session.completed", session_id: "sealed-session", text: JSON.stringify(review) }));
});
