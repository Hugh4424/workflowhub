// Independent expectations: quality/evidence/2026-10-28-058-c05-p1-p2-independent-test-design.md, P1 items 1-5.
// Real template -> production reader seam. Human comprehension is assessed separately.
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { phaseFilesFromIndex } from '../../runtime/task/material-workspace.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const paths = ['phases/P1-行为结果.md', 'phases/P2-文档核对.md'];
function authorMaterials() {
  const source = readFileSync(root + 'skills/spec-plan/templates/phase-template.md', 'utf8');
  const blocks = {};
  for (const name of ['spec', 'index', 'phase-behavior', 'phase-document']) {
    const parts = source.split(`<!-- card05-author-example:${name} -->`);
    expect(parts, `one complete ${name} author example`).toHaveLength(2);
    const block = parts[1].match(/^\s*(`{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
    expect(block, `complete ${name} source block`).not.toBeNull();
    blocks[name] = block[2].replaceAll('{{TASK_ID}}', 'c05-phase-navigation')
      .replaceAll('{{TASK_ROOT}}', '/controlled/task').replaceAll('{{WORKTREE_ROOT}}', '/controlled/worktree');
  }
  return { spec: blocks.spec, index: blocks.index,
    phases: { [paths[0]]: blocks['phase-behavior'], [paths[1]]: blocks['phase-document'] } };
}
function realNavigation() {
  const source = readFileSync(root + 'skills/spec-plan/templates/index-template.md', 'utf8');
  const heading = '## 并行与合并导航（人读指针）';
  expect(source.includes(heading), 'ORACLE-PLAN-AUTHORING actual index template supplies separate human navigation').toBe(true);
  return source.slice(source.indexOf(heading));
}

test('ORACLE-PLAN-AUTHORING consumes the actual index navigation without changing Phase/Task/AC facts', () => {
  const input = authorMaterials();
  const before = validatePostPhaseContract(input);
  expect(before.ok).toBe(true);
  input.index += '\n\n' + realNavigation();
  const after = validatePostPhaseContract(input);
  expect(after.errors).toEqual([]);
  expect(after.facts).toEqual(before.facts);
  expect(phaseFilesFromIndex(input.index)).toEqual(paths);
  expect(after.facts.phase_rows.map(row => row.task_ids)).toEqual([['T001'], ['T002']]);
  expect(after.facts.ac_coverage.accepted_ids).toEqual(['AC-EXAMPLE-001', 'AC-EXAMPLE-002']);
});

test('ORACLE-PLAN-AUTHORING actual navigation cannot legalize a seven-column machine row', () => {
  const input = authorMaterials();
  input.index = input.index.split('\n').map(line => /^\| `P[12]` \|/.test(line)
    ? line.replace(/\|$/, '| 组一 |') : line).join('\n') + '\n\n' + realNavigation();
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors.filter(error => /requires 5 or 6 cells; found 7/.test(error))).toHaveLength(2);
  expect(result.facts.phase_rows).toEqual([]);
});
