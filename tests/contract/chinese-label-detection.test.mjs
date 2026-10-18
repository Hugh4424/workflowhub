// ORACLE-N4-LABEL-GATE: frozen before the production repair.
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';

const phase1 = 'phases/P1-行为结果.md';
function materials() {
  const text = readFileSync(new URL('../../skills/spec-plan/templates/phase-template.md', import.meta.url), 'utf8');
  const blocks = {};
  for (const name of ['spec', 'index', 'phase-behavior', 'phase-document']) {
    const marker = `<!-- card05-author-example:${name} -->`;
    expect(text.split(marker), `unique author example ${name}`).toHaveLength(2);
    const match = text.slice(text.indexOf(marker) + marker.length).match(/^\s*(`{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
    expect(match, `complete author example ${name}`).not.toBeNull();
    blocks[name] = match[2].replace(/\{\{(TASK_ID|TASK_ROOT|WORKTREE_ROOT)\}\}/g, (_, key) => ({ TASK_ID: 'n4-control', TASK_ROOT: '/owned/task', WORKTREE_ROOT: '/owned/worktree' })[key]);
  }
  return { spec: blocks.spec, index: blocks.index, phases: { [phase1]: blocks['phase-behavior'], 'phases/P2-文档核对.md': blocks['phase-document'] } };
}
const purityError = 'Phase index must remain pointer-only; command, oracle, and evidence belong to Phase files';
const labels = [['预期退出码', 'expected_exit'], ['门禁命令', 'gate_cmd'], ['判定器', 'oracle'], ['证据路径', 'evidence_path']];
function check(m) { return validatePostPhaseContract(m); }
test('ORACLE-N4-LABEL-GATE legal author control is fully accepted', () => {
  const actual = check(materials());
  expect(actual.errors).toEqual([]);
  expect(actual.ok).toBe(true);
  expect(actual.facts.command_oracle_checks).toEqual({ valid: true });
  expect(actual.facts.dependency_validation).toEqual({ valid: true });
});
test.each(labels)('ORACLE-N4-LABEL-GATE Chinese %s is rejected, restored, and isolated from both valid facts', (chinese) => {
  const m = materials();
  const original = m.index;
  m.index += `\n- **${chinese}**：0\n`;
  const actual = check(m);
  expect(actual.errors).toEqual([purityError]);
  expect(actual.ok).toBe(false);
  expect(actual.facts.command_oracle_checks.valid).toBe(true);
  expect(actual.facts.dependency_validation.valid).toBe(true);
  m.index = original;
  expect(check(m).errors).toEqual([]);
  expect(check(m).ok).toBe(true);
});
test.each(labels)('ORACLE-N4-LABEL-GATE English %s counterpart stays rejected with unpolluted facts', (_, english) => {
  const m = materials(); m.index += `\n- **${english}**: 0\n`;
  const actual = check(m);
  expect(actual.errors).toEqual([purityError]);
  expect(actual.facts.command_oracle_checks.valid).toBe(true);
  expect(actual.facts.dependency_validation.valid).toBe(true);
});
test.each(labels)('ORACLE-N4-LABEL-GATE near-prefix %s说明 is ordinary prose', (chinese) => {
  const m = materials(); m.index += `\n- **${chinese}说明**：合法说明\n`;
  expect(check(m).errors).toEqual([]);
});
test.each(['- 预期退出码：0', '* 门禁命令: node check.mjs', '- 判定器 ORACLE-N4', '* 证据路径'])('ORACLE-N4-LABEL-GATE Chinese legal delimiter %s is rejected', (line) => {
  const m = materials(); m.index += `\n${line}\n`;
  expect(check(m).errors).toEqual([purityError]);
});
test('ORACLE-N4-LABEL-GATE actual dependency failure invalidates dependency facts', () => {
  const m = materials();
  m.phases[phase1] = m.phases[phase1].replace('- **Dependency**：none', '- **Dependency**：P2');
  const actual = check(m);
  expect(actual.errors).toContain(`${phase1} dependency must match the index and reference only earlier Phase IDs`);
  expect(actual.facts.dependency_validation.valid).toBe(false);
});
test('ORACLE-N4-LABEL-GATE actual oracle mismatch invalidates command facts', () => {
  const m = materials();
  m.phases[phase1] = m.phases[phase1].replace('- **GREEN oracle**：ORACLE-EXAMPLE-BEHAVIOR', '- **GREEN oracle**：ORACLE-WRONG');
  const actual = check(m);
  expect(actual.errors).toContain(`${phase1} T001 RED oracle must match GREEN oracle`);
  expect(actual.facts.command_oracle_checks.valid).toBe(false);
});

// OCR Luna finding: an earlier numeric ID is not necessarily a real Phase.
test.each(['P0', 'P00', 'P9'])('ORACLE-N4-LABEL-GATE unknown Phase dependency %s is rejected in matching index and body', (dependency) => {
  const m = materials();
  m.index = m.index.replace('| none | Node模块调用者与P2文档作者 |', `| ${dependency} | Node模块调用者与P2文档作者 |`);
  m.phases[phase1] = m.phases[phase1].replace('- **Dependency**：none', `- **Dependency**：${dependency}`);
  const actual = check(m);
  expect(actual.errors).toContain(`${phase1} dependency must match the index and reference only earlier Phase IDs`);
  expect(actual.ok).toBe(false);
  expect(actual.facts.dependency_validation.valid).toBe(false);
});
test('ORACLE-N4-LABEL-GATE dependency on a Phase missing from parsed rows is invalid', () => {
  const m = materials();
  m.index = m.index.replace('`src/owned.mjs`', '`../outside.mjs`');
  const actual = check(m);
  expect(actual.errors).toContain('phases/P2-文档核对.md dependency must match the index and reference only earlier Phase IDs');
  expect(actual.facts.dependency_validation.valid).toBe(false);
});

// P3-TCR-002: the leading dependency declaration may carry ownership prose.
function setTaskDependency(m, path, task, value) {
  const offset = m.phases[path].indexOf(`### ${task} `);
  expect(offset).toBeGreaterThan(-1);
  m.phases[path] = m.phases[path].slice(0, offset) + m.phases[path].slice(offset)
    .replace(/^- \*\*Dependency\*\*[:：].*$/m, `- **Dependency**：${value}`);
}
test.each(['`none`；独立建立目标判据，后续消费者在 Task order 中声明。', 'none；独立交付。', '`无`；独立交付。', '无前序；独立交付。', '无依赖；独立交付。'])('ORACLE-N4-LABEL-GATE leading no-prerequisite declaration accepts prose: %s', (value) => {
  const m = materials(); setTaskDependency(m, phase1, 'T001', value);
  expect(check(m).errors).toEqual([]);
  expect(check(m).facts.dependency_validation.valid).toBe(true);
});
test.each(['`P1`；由前序交付输入。', '`T001`；由前序交付输入。', '`P1`、`T001`；保留两个真实前置。'])('ORACLE-N4-LABEL-GATE real earlier dependencies retain prose: %s', (value) => {
  const m = materials(); setTaskDependency(m, 'phases/P2-文档核对.md', 'T002', value);
  expect(check(m).errors).toEqual([]);
});
test.each(['T999；说明内 none 不豁免', 'T002；说明内 none 不豁免', 'P1；说明内 none 不豁免', 'P2；说明内 none 不豁免', 'P9；说明内 none 不豁免', 'P0；说明内 none 不豁免', '说明里偶然 none', '`noneExtra`；并非无前置声明', '无依赖说明不是字段声明'])('ORACLE-N4-LABEL-GATE invalid declaration cannot be exempted by prose: %s', (value) => {
  const m = materials(); setTaskDependency(m, phase1, 'T001', value);
  expect(check(m).ok).toBe(false);
  expect(check(m).facts.dependency_validation.valid).toBe(false);
});
test('ORACLE-N4-LABEL-GATE a later second prerequisite is not swallowed by leading valid token', () => {
  const m = materials(); setTaskDependency(m, 'phases/P2-文档核对.md', 'T002', '`T001`、`T999`；none只是说明');
  expect(check(m).errors).toContain('P2/T002 dependency T999 must be an existing earlier task');
  expect(check(m).facts.dependency_validation.valid).toBe(false);
});
