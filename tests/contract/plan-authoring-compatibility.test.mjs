// build-plan prewritten compatibility oracle, 2026-10-28, independent test-author context.
// Sources: current spec-plan template full examples; decision source correction §7;
// stage-content-contracts.mjs:215-268/580-585 and material-workspace.mjs:8-36/90-109.
// Independent expectation: the authored two-example contract has P1/T001 and P2/T002.
// This is structural compatibility/P2P, not target RED, method effectiveness or UI proof.
// No production or old frozen test changes. Physical read-only isolation is not established.
import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { inspectMaterialWorkspace, phaseFilesFromIndex } from '../../runtime/task/material-workspace.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const template = join(root, 'skills/spec-plan/templates/phase-template.md');
const phasePaths = ['phases/P1-行为结果.md', 'phases/P2-文档核对.md'];
const temporary = new Set();
afterEach(() => {
  for (const path of temporary) {
    if (dirname(path) !== realpathSync(tmpdir()) || !basename(path).startsWith('plan-authoring-compatibility-')) {
      throw new Error(`refuse cleanup outside owned temporary root: ${path}`);
    }
    rmSync(path, { recursive: true, force: true });
  }
  temporary.clear();
});

function authorMaterials() {
  const source = readFileSync(template, 'utf8');
  const blocks = {};
  for (const name of ['spec', 'index', 'phase-behavior', 'phase-document']) {
    const marker = `<!-- card05-author-example:${name} -->`;
    const parts = source.split(marker);
    if (parts.length !== 2) throw new Error(`source fixture: expected one ${name} author example`);
    const match = parts[1].match(/^\s*(`{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
    if (!match) throw new Error(`source fixture: missing complete ${name} example`);
    blocks[name] = match[2].replaceAll('{{TASK_ID}}', 'plan-authoring-compatibility')
      .replaceAll('{{TASK_ROOT}}', '/controlled/task')
      .replaceAll('{{WORKTREE_ROOT}}', '/controlled/worktree');
  }
  return { spec: blocks.spec, index: blocks.index,
    phases: { [phasePaths[0]]: blocks['phase-behavior'], [phasePaths[1]]: blocks['phase-document'] } };
}

// Human-only navigation outside the machine section: no duplicated commands or AC body.
// P2 consumes P1's result and therefore is not claimed to run in P1's parallel batch.
const navigation = `\n\n## 并行导航（人读指针）\n\n| 并行组 | Phase | 前置 | 共享路径 | 合并点 |\n| --- | --- | --- | --- | --- |\n| 组一 | P1 | 无 | 无 | P1 原件交回 |\n| 组二 | P2 | P1 | 无 | P2 全项读回 |\n`;
const facts = result => result.facts.phase_rows.map(({ id, path, write_set, task_ids }) => ({ id, path, write_set, task_ids }));
const expected = [
  { id: 'P1', path: 'phases/P1-行为结果.md', write_set: ['src/owned.mjs'], task_ids: ['T001'] },
  { id: 'P2', path: 'phases/P2-文档核对.md', write_set: ['docs/owned.md'], task_ids: ['T002'] },
];

test('ORACLE-PLAN-AUTHORING preserves actual two-example contract through separate parallel navigation', () => {
  const input = authorMaterials();
  input.index += navigation;
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  expect(facts(result)).toEqual(expected);
  expect(phaseFilesFromIndex(input.index)).toEqual(phasePaths);
  expect(result.facts.ac_coverage.accepted_ids).toEqual(['AC-EXAMPLE-001', 'AC-EXAMPLE-002']);
  expect(result.facts.ac_coverage.covered_ids).toEqual(['AC-EXAMPLE-001', 'AC-EXAMPLE-002']);
});

test('ORACLE-PLAN-AUTHORING human navigation cannot replace or enlarge the six-cell execution contract', () => {
  const input = authorMaterials();
  input.index = input.index.split('\n').map(line => /^\| `P[12]` \|/.test(line)
    ? line.replace(/\|$/, '| 组一 |') : line).join('\n') + navigation;
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors.filter(error => /requires 5 or 6 cells; found 7/.test(error))).toHaveLength(2);
  expect(result.facts.phase_rows).toEqual([]);
});

test('ORACLE-PLAN-AUTHORING navigation text cannot hide a missing actual Task action', () => {
  const input = authorMaterials();
  input.index += navigation + '\nAction: preserve source and failure.\n';
  input.phases[phasePaths[0]] = input.phases[phasePaths[0]].replace(/^- \*\*Action\*\*[^\n]*\n/m, '');
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors).toContain('phases/P1-行为结果.md T001 task card missing concrete Action');
});

test.each(['L1', 'L2'])('ORACLE-PLAN-AUTHORING identifies a missing %s heading in the complete author material', heading => {
  const input = authorMaterials();
  input.phases[phasePaths[0]] = input.phases[phasePaths[0]].replace(new RegExp(`^## ${heading}[^\\n]*\\n`, 'm'), '');
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors).toContain(`phases/P1-行为结果.md is missing ${heading}`);
});

test('ORACLE-PLAN-AUTHORING preserves outer-reader unindexed-file warning rather than masking it with selected-map success', () => {
  const input = authorMaterials();
  input.index += navigation;
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'plan-authoring-compatibility-')));
  temporary.add(dir);
  const files = { 'decision-log.md': '## 任务身份\n\n- **任务类型**：普通任务\n',
    'spec.md': input.spec, 'phases/index.md': input.index, ...input.phases,
    'phases/P1.md': '# Historical draft retained by its owner; not current authority.\n' };
  for (const [path, bytes] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), bytes);
  }
  expect(validatePostPhaseContract(input).ok).toBe(true);
  const inspection = inspectMaterialWorkspace(dir);
  expect(inspection.status).toBe('not_ready');
  expect(inspection.errors).toEqual(['phases/P1.md:unindexed_phase']);
  expect(readFileSync(join(dir, 'phases/P1.md'), 'utf8')).toBe(files['phases/P1.md']);
  expect(phaseFilesFromIndex(inspection.files['phases/index.md'])).toEqual(phasePaths);
});
