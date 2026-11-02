// W4 command source: independent 15-row bidirectional check of the runlist
// against steps.json, written outside the contract test so the walker observes it directly.
import { readFileSync } from 'node:fs';
const repo = '/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028';
const skill = readFileSync(`${repo}/workflows/make-decision/SKILL.md`, 'utf8');
const steps = JSON.parse(readFileSync(`${repo}/workflows/make-decision/steps.json`, 'utf8'));
const close = skill.split(/^## /m).find(chunk => chunk.split('\n')[0] === '安全写入与收口');
if (!close) { console.log(JSON.stringify({ verdict: 'section_missing' })); process.exit(1); }
const rows = [...close.matchAll(/^\| `([a-z][a-z-]+)` \| (.+) \|$/gm)].map(([, slug, criterion]) => ({ slug, criterion }));
const manifest = steps.steps.map(step => ({ slug: step.step_slug, criterion: step.observable_result }));
const rowSlugs = rows.map(row => row.slug), manifestSlugs = manifest.map(row => row.slug);
const missing = manifestSlugs.filter(slug => !rowSlugs.includes(slug));
const extra = rowSlugs.filter(slug => !manifestSlugs.includes(slug));
const criterionDiffs = rows.filter(row => manifest.find(step => step.slug === row.slug)?.criterion !== row.criterion).map(row => row.slug);
const ok = rows.length === 15 && rowSlugs.length === new Set(rowSlugs).size
  && JSON.stringify(rowSlugs) === JSON.stringify(manifestSlugs)
  && missing.length === 0 && extra.length === 0 && criterionDiffs.length === 0;
console.log(JSON.stringify({
  walked_at: new Date().toISOString(),
  runlist_rows: rows.length, manifest_steps: manifest.length,
  order_equal: JSON.stringify(rowSlugs) === JSON.stringify(manifestSlugs),
  duplicates: rowSlugs.length - new Set(rowSlugs).size,
  missing_in_runlist: missing, extra_in_runlist: extra, criterion_diffs: criterionDiffs,
  verdict: ok ? 'runlist_matches_steps_15x15' : 'runlist_differs',
}, null, 2));
process.exitCode = ok ? 0 : 1;
