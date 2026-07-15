#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("exact-copy-review-provider 1.0"); process.exit(0); }
const sha = (value) => createHash("sha256").update(value).digest("hex");
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const packetBytes = readFileSync(join(process.cwd(), "review-packet.v1.json"));
  const diffBytes = readFileSync(join(process.cwd(), "changes.diff"));
  const manifestBytes = readFileSync(join(process.cwd(), "manifest.json"));
  const packet = JSON.parse(packetBytes);
  const ids = ["C1", "C2", "C3", "H1", "H2", "H3"];
  const evidence = ["PROVIDER_READ", sha(packetBytes), sha(diffBytes), sha(manifestBytes), diffBytes.includes("MARKER_HEAD"), diffBytes.includes("MARKER_MIDDLE"), diffBytes.includes("MARKER_TAIL")].join(":");
  const review = { packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, contract_hash: packet.contract_hash, skill_bundle_hash: packet.skill_bundle_hash,
    packet_status: "complete", verdict: "pass", summary: evidence, findings: [], checklist: ids.map((id) => ({ id, passed: true, evidence: `changes.diff:1 verifies ${id}` })), pass_items: ids.map((id) => ({ rule_id: id, artifact_anchor: `changes.diff:1#${id}`, evidence: `exact material verifies ${id}` })), skillResults: [] };
  console.log(JSON.stringify({ type: "session.completed", session_id: "exact-copy-session", text: JSON.stringify(review) }));
});
