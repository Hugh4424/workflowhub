// Read-only: print the real source line each finding points at.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [root, resultPath] = process.argv.slice(2);
const task = join(root, "specs/workflowhub-ui-frontend-c07-real-page-verification-20261028");
const map = (p) => p === "materials/02-draft_spec.md" ? join(task, "spec.md")
  : p.startsWith("requirements/phases/") ? join(task, p.slice("requirements/".length))
  : p.startsWith("materials/01-decision_baseline.md") ? join(root, "quality/evidence/build-code/2026-10-30-p10-real-review/decision-baseline.md")
  : null;
const result = JSON.parse(readFileSync(resultPath, "utf8"));
const out = [];
for (const [i, f] of result.findings.entries()) {
  const file = map(f.path);
  const record = { n: i + 1, path: f.path, line: f.line, providers: f.providers, roles: f.roles, resolved: Boolean(file) };
  if (file) {
    const lines = readFileSync(file, "utf8").split("\n");
    record.total_lines = lines.length;
    record.exists = f.line >= 1 && f.line <= lines.length;
    record.anchor_text = record.exists ? lines[f.line - 1] : null;
    record.window = record.exists ? lines.slice(Math.max(0, f.line - 3), f.line + 2) : null;
  }
  out.push(record);
}
console.log(JSON.stringify(out, null, 2));
