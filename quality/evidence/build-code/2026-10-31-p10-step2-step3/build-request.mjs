// Build the two-card re-verification request for P10 step 3.
// Reads current bytes of spec.md / phases index / the two named Phase cards,
// reuses the decision baseline of the 2026-10-30 review (same decision-log bytes),
// and writes request.json. Read-only on materials.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [worktreeArg, outDirArg, baselinePathArg] = process.argv.slice(2);
const worktree = resolve(worktreeArg ?? ".");
const outDir = resolve(outDirArg ?? ".");
const taskDir = join(worktree, "specs/workflowhub-ui-frontend-c07-real-page-verification-20261028");

const spec = readFileSync(join(taskDir, "spec.md"), "utf8");
const index = readFileSync(join(taskDir, "phases/index.md"), "utf8");
const decision_baseline = readFileSync(resolve(baselinePathArg), "utf8");

const appendixStart = spec.indexOf("## Appendix A — 验收判据（唯一权威）");
if (appendixStart < 0) throw new Error("Appendix A heading not found");
const appendixEnd = spec.indexOf("\n## Appendix B", appendixStart);
if (appendixEnd < 0) throw new Error("Appendix B heading not found");
const acceptance_criteria = spec.slice(appendixStart, appendixEnd).trim() + "\n";

// Step 3 scope: the revised card P4 and the downstream card its body names (P8).
const cards = [
  "P4-报告接入与回修闭环.md",
  "P8-全AC终验.md",
];
const phase_authorities = {};
for (const name of cards) phase_authorities[`phases/${name}`] = readFileSync(join(taskDir, "phases", name), "utf8");

const request = {
  stage: "build-plan",
  activation_cohort: "post",
  materials: { decision_baseline, draft_spec: spec, acceptance_criteria, phase_authorities, phase_index: index },
};

writeFileSync(join(outDir, "request.json"), JSON.stringify(request) + "\n");
console.log(JSON.stringify({
  out: join(outDir, "request.json"),
  phase_count: cards.length,
  phase_names: cards,
  detail: {
    decision_baseline: Buffer.byteLength(decision_baseline),
    draft_spec: Buffer.byteLength(spec),
    acceptance_criteria: Buffer.byteLength(acceptance_criteria),
    phase_authorities: Object.values(phase_authorities).reduce((n, v) => n + Buffer.byteLength(v), 0),
    phase_index: Buffer.byteLength(index),
  },
  total_request_bytes: Buffer.byteLength(JSON.stringify(request)),
}, null, 2));
