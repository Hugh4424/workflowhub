#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("derived-review-provider 1.0"); process.exit(0); }
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const match = input.match(/<attachment destination="review-packet\.v1\.json"[^>]*>\n([\s\S]*?)\n<\/attachment>/u);
  if (!match && !input.includes("Return the same review as schema-valid JSON only.")) { console.error("derived packet missing"); process.exit(2); }
  if (match) JSON.parse(match[1]);
  const ids = ["C1", "C2", "C3", "H1", "H2", "H3"];
  const review = { packet_status: "complete", verdict: "pass", summary: "derived packet reviewed", findings: [], checklist: ids.map((id) => ({ id, passed: true, evidence: `changes.diff:1 verifies ${id}` })), pass_items: ids.map((id) => ({ rule_id: id, artifact_anchor: `changes.diff:1#${id}`, evidence: `derived material verifies ${id}` })), skillResults: [] };
  console.log(JSON.stringify({ type: "session.completed", session_id: "derived-session", text: JSON.stringify(review) }));
});
