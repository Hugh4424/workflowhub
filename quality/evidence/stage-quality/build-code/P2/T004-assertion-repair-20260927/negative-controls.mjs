import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const path = 'docs/architecture/complexity-baseline.json';
const raw = readFileSync(path, 'utf8');
const oldRaw = execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8' });
const oldFormal = JSON.parse(oldRaw).budgets.formal_test_lines;
const current = JSON.parse(raw).budgets.formal_test_lines.actual;
const block = /^    "formal_test_lines": \{[\s\S]*?^    \},$/gm;
const strip = (bytes) => {
  if ([...bytes.matchAll(block)].length !== 1) throw Error('formal block count');
  return bytes.replace(block, '    "formal_test_lines": "<measured>"');
};
const check = (bytes, measured = current) => {
  if (strip(bytes) !== strip(oldRaw)) throw Error('outside bytes');
  const formal = JSON.parse(bytes).budgets.formal_test_lines;
  const fields = ['actual', 'caliber', 'delta_from_target', 'limit', 'target', 'within_limit'];
  if (JSON.stringify(Object.keys(formal).sort()) !== JSON.stringify(fields.sort())) throw Error('field set');
  if (formal.target !== oldFormal.target) throw Error('target');
  if (formal.limit !== oldFormal.limit) throw Error('limit');
  if (formal.actual !== measured) throw Error('actual');
  if (formal.delta_from_target !== formal.actual - formal.target) throw Error('delta');
  if (formal.within_limit !== (formal.actual <= formal.limit)) throw Error('within limit');
  if (!formal.caliber.includes(`约为 ${formal.limit} 行上限的 ${(formal.actual / formal.limit).toFixed(1)} 倍`)) throw Error('ratio');
  if (!formal.caliber.includes('副作用')) throw Error('side effect');
  return 'pass';
};
const swap = (before, after) => {
  if (!raw.includes(before)) throw Error(`fixture missing: ${before}`);
  return raw.replace(before, after);
};
const cases = [
  ['unchanged', raw, current, 'pass'],
  ['outside-byte', swap('"source_files": 296', '"source_files": 297'), current, 'outside bytes'],
  ['extra-field', swap('"delta_from_target": 74015,', '"delta_from_target": 74015,\n      "unexpected": true,'), current, 'field set'],
  ['target-change', swap('"target": 10000', '"target": 10001'), current, 'target'],
  ['limit-change', swap('"limit": 12000', '"limit": 12001'), current, 'limit'],
  ['old-ratio', swap('12000 行上限的 7.0 倍', '12000 行上限的 6.3 倍'), current, 'ratio'],
  ['wrong-within', swap('"within_limit": false,\n      "caliber"', '"within_limit": true,\n      "caliber"'), current, 'within limit'],
  ['old-delta', swap('"delta_from_target": 74015', '"delta_from_target": 73996'), current, 'delta'],
  ['future-below-limit', raw.replace('"actual": 84015', '"actual": 11999').replace('"delta_from_target": 74015', '"delta_from_target": 1999').replace('"within_limit": false,\n      "caliber"', '"within_limit": true,\n      "caliber"').replace('12000 行上限的 7.0 倍', '12000 行上限的 1.0 倍'), 11999, 'pass'],
];
const results = cases.map(([name, bytes, measured, expected]) => {
  let actual;
  try { actual = check(bytes, measured); } catch (error) { actual = error.message; }
  return { name, expected, actual, ok: actual === expected };
});
writeFileSync('quality/evidence/stage-quality/build-code/P2/T004-assertion-repair-20260927/negative-controls.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some(({ ok }) => !ok)) process.exitCode = 1;
