// Read-only material assembly for the C07 post build-plan review.
// Reads spec.md / phases/*.md plus a pre-generated decision baseline, and
// writes one request.json. Does not modify any material file.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const [worktreeArg, outDirArg, baselinePathArg] = process.argv.slice(2);
const worktree = resolve(worktreeArg ?? ".");
const outDir = resolve(outDirArg ?? ".");
const taskDir = join(worktree, "specs/workflowhub-ui-frontend-c07-real-page-verification-20261028");

const spec = readFileSync(join(taskDir, "spec.md"), "utf8");
const index = readFileSync(join(taskDir, "phases/index.md"), "utf8");
const decision_baseline = readFileSync(resolve(baselinePathArg), "utf8");

// Appendix A is the single acceptance-criteria authority (spec.md:2109).
const appendixStart = spec.indexOf("## Appendix A — 验收判据（唯一权威）");
if (appendixStart < 0) throw new Error("Appendix A heading not found");
const appendixEnd = spec.indexOf("\n## Appendix B", appendixStart);
if (appendixEnd < 0) throw new Error("Appendix B heading not found");
const acceptance_criteria = spec.slice(appendixStart, appendixEnd).trim() + "\n";

const phaseFiles = readdirSync(join(taskDir, "phases")).filter((name) => /^P\d+-.*\.md$/.test(name));
phaseFiles.sort((a, b) => Number(a.match(/^P(\d+)/)[1]) - Number(b.match(/^P(\d+)/)[1]));
const phase_authorities = {};
for (const name of phaseFiles) phase_authorities[`phases/${name}`] = readFileSync(join(taskDir, "phases", name), "utf8");

const request = {
  stage: "build-plan",
  activation_cohort: "post",
  materials: { decision_baseline, draft_spec: spec, acceptance_criteria, phase_authorities, phase_index: index },
};

writeFileSync(join(outDir, "request.json"), JSON.stringify(request) + "\n");
console.log(JSON.stringify({
  out: join(outDir, "request.json"),
  phase_count: phaseFiles.length,
  phase_names: phaseFiles,
  detail: {
    decision_baseline: Buffer.byteLength(decision_baseline),
    draft_spec: Buffer.byteLength(spec),
    acceptance_criteria: Buffer.byteLength(acceptance_criteria),
    phase_authorities: Object.values(phase_authorities).reduce((n, v) => n + Buffer.byteLength(v), 0),
    phase_index: Buffer.byteLength(index),
  },
  total_request_bytes: Buffer.byteLength(JSON.stringify(request)),
}, null, 2));
