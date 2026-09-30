// Read-only local self-check: node /tmp/card03-bp/validate-post.mjs <repo-root> <specs-dir>
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const [repo, dir] = process.argv.slice(2);
const { validatePostPhaseContract, projectPostPhaseAcceptanceExecutionData } = await import(join(repo, "runtime/stage/stage-content-contracts.mjs"));
const { phaseFilesFromIndex, validateMaterialNavigation } = await import(join(repo, "runtime/task/material-workspace.mjs"));
const spec = readFileSync(join(dir, "spec.md"), "utf8");
const index = readFileSync(join(dir, "phases/index.md"), "utf8");
const phases = Object.fromEntries(readdirSync(join(dir, "phases")).filter((n) => /^P\d+\.md$/.test(n)).map((n) => [`phases/${n}`, readFileSync(join(dir, "phases", n), "utf8")]));
let refs; try { refs = phaseFilesFromIndex(index); } catch (e) { refs = `ERROR ${e.message}`; }
const r = validatePostPhaseContract({ spec, index, phases });
const acc = projectPostPhaseAcceptanceExecutionData({ spec, index, phases });
console.log(JSON.stringify({ phaseFilesFromIndex: refs, specNav: validateMaterialNavigation(spec.replace(/\r\n?/g, "\n")), ok: r.ok, errors: r.errors, phase_count: r.facts?.phase_count, task_count: r.facts?.task_count, fr: r.facts?.fr_coverage?.accepted_count, ac: r.facts?.ac_coverage?.accepted_count, acceptance: { status: acc.status, errors: acc.errors } }, null, 1));
