// W1 command source: replay the real entry routing on the real recorded input
// and compare it field by field with the archived original return.
import { readFileSync } from 'node:fs';
import { evaluateEntryRoute } from '/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/workflows/make-decision/scripts/entry-evaluation.mjs';

const originalPath = '/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/entry-evaluation/2026-10-28-001-entry-evaluation.json';
const original = JSON.parse(readFileSync(originalPath, 'utf8'));
const replay = evaluateEntryRoute(original.input);
const keys = ['status', 'user_requested', 'reason', 'expanded_risks', 'choices', 'flags'];
const diffs = keys.filter(key => JSON.stringify(replay[key]) !== JSON.stringify(original.returned[key]));
const record = {
  walked_at: new Date().toISOString(),
  entry: 'workflows/make-decision/scripts/entry-evaluation.mjs#evaluateEntryRoute',
  input_source: originalPath,
  input: original.input,
  original_returned: original.returned,
  replayed_returned: replay,
  compared_fields: keys,
  differing_fields: diffs,
  verdict: diffs.length === 0 ? 'route_matches_original' : 'route_differs',
};
console.log(JSON.stringify(record, null, 2));
process.exitCode = diffs.length === 0 ? 0 : 1;
