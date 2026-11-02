import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const labels = ['判什么', '怎么判', '证据从哪来', '谁提供', '何时能拿到', '成本类别', '拿不到怎么办'];
// The original seven-field reader is shared by the template and historical filled plans.
function readEvidenceFields(text) {
  const line = text.split('\n').find(line => line.includes('证据计划：'));
  if (!line) throw new Error('missing evidence plan');
  const fields = Object.fromEntries(line.slice(line.indexOf('证据计划：') + 5).split('；').map(part => part.split('=')));
  for (const label of labels) if (!fields[label]?.trim() || /占位|待填|\.\.\.|…|<|\[/.test(fields[label])) throw new Error('invalid ' + label);
  return fields;
}
// Test-only reader: checks the human contract without adding a runtime gate.
function readPlan(text) {
  const fields = readEvidenceFields(text);
  const gap = text.split('\n').find(line => line.startsWith('incomplete：'));
  if (!gap || !/试过=.*quality\/tests\/[^；\s]+/.test(gap)) throw new Error('missing attempt ref');
  for (const label of ['卡在', '谁提供', '恢复条件']) if (!new RegExp(label + '=[^；\\n]+').test(gap)) throw new Error('missing gap ' + label);
  return fields;
}

// The Phase template points these duties to existing Task fields (field table, lines 244–263).
// This observes compatibility and missing-field facts, not provider/time/cost semantics or real evidence.
const dutyFields = {
  判什么: ['Source / FR / AC'],
  怎么判: ['RED/GREEN gate_cmd', 'expected_exit', 'RED target failure', 'GREEN oracle', 'Scenario / fixture or service'],
  证据从哪来: ['Evidence'],
  谁提供: ['Inputs'],
  何时能拿到: ['Inputs', 'Dependency'],
  成本类别: ['Test tier / skill', 'Scenario / fixture or service', 'RED/GREEN gate_cmd'],
  拿不到怎么办: ['STOP / recovery'],
};
const phaseExamples = [
  { name: 'phase-behavior', path: 'phases/P1-行为结果.md', phase_id: 'P1', task_id: 'T001' },
  { name: 'phase-document', path: 'phases/P2-文档核对.md', phase_id: 'P2', task_id: 'T002' },
];
function authorMaterials() {
  const source = read('skills/spec-plan/templates/phase-template.md'), blocks = {};
  for (const name of ['spec', 'index', ...phaseExamples.map(example => example.name)]) {
    const parts = source.split('<!-- card05-author-example:' + name + ' -->');
    if (parts.length !== 2) throw new Error('expected one complete author example ' + name);
    const match = parts[1].match(/^\s*(`{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
    if (!match) throw new Error('missing complete author example ' + name);
    blocks[name] = match[2].replaceAll('{{TASK_ID}}', 'acceptance-plan')
      .replaceAll('{{TASK_ROOT}}', '/owned/task').replaceAll('{{WORKTREE_ROOT}}', '/owned/worktree');
  }
  return { spec: blocks.spec, index: blocks.index,
    phases: Object.fromEntries(phaseExamples.map(example => [example.path, blocks[example.name]])) };
}
function changeTaskField(materials, example, field, mode) {
  const body = materials.phases[example.path];
  const card = body.indexOf(`- **任务编号**：${example.task_id}`);
  const at = card < 0 ? -1 : body.lastIndexOf('### ', card);
  if (at < 0) throw new Error('missing source task ' + example.task_id);
  const task = body.slice(at), line = task.split('\n').find(value => value.startsWith('- **' + field + '**'));
  if (!line) throw new Error('missing source field ' + field);
  const replacement = mode === 'remove' ? '' : line.replace('**' + field + '**', '**unknown_' + field + '**');
  return { ...materials, phases: { ...materials.phases,
    [example.path]: body.slice(0, at) + task.replace(line, replacement) } };
}

describe('ORACLE-ACCEPT-PLAN', () => {
  it('real templates and planning steps carry seven fields and truthful incomplete instructions', () => {
    for (const path of ['skills/spec-specify/templates/spec-template.md', 'skills/spec-plan/templates/phase-template.md']) {
      const text = read(path);
      if (path.includes('/spec-specify/')) {
        expect(Object.keys(readEvidenceFields(text))).toEqual(expect.arrayContaining(labels));
      } else {
        const result = validatePostPhaseContract(authorMaterials());
        expect(result.errors, path).toEqual([]);
        expect(result.facts.field_gaps, path).toEqual([]);
      }
      for (const label of ['试过=', '卡在=', '谁提供=', '恢复条件=']) expect(text, path).toContain(label);
      expect(text, path).toMatch(/无[^\n]*尝试[^\n]*ref[^\n]*不得[^\n]*incomplete/);
      expect(text, path).toContain('最终报告逐条列缺口');
    }
    const workflow = read('workflows/build-plan/SKILL.md');
    expect(workflow).toMatch(/^7\.[^\n]*七字段[^\n]*缺一项不得开工/m);
    expect(workflow).toMatch(/^9\.[^\n]*七字段[^\n]*incomplete/m);
  });

  for (const label of labels) for (const mode of ['remove', 'rename', 'empty', 'placeholder']) {
    it(`rejects ${mode} of the spec example's ${label}`, () => {
      const source = read('skills/spec-specify/templates/spec-template.md').split('\n').find(line => line.includes('证据计划：'));
      const replacement = { remove: '', rename: 'unknown_' + label + '=value', empty: label + '=', placeholder: label + '=占位' }[mode];
      const bad = source.replace(new RegExp(label + '=[^；\\n]*'), replacement);
      expect(bad).not.toBe(source);
      expect(() => readEvidenceFields(bad)).toThrow('invalid ' + label);
      expect(Object.keys(readEvidenceFields(source))).toEqual(expect.arrayContaining(labels));
    });
  }
  for (const example of phaseExamples) for (const field of new Set(Object.values(dutyFields).flat())) {
    for (const mode of ['remove', 'rename']) it(`${example.task_id}: reports ${mode} of duty field ${field}`, () => {
      const good = authorMaterials();
      expect(validatePostPhaseContract(good).facts.field_gaps).toEqual([]);
      const result = validatePostPhaseContract(changeTaskField(good, example, field, mode));
      expect(result.facts.field_gaps).toContainEqual({
        phase_id: example.phase_id, task_id: example.task_id, path: example.path, field,
      });
      expect(validatePostPhaseContract(good).facts.field_gaps).toEqual([]);
    });
  }

  it('filled Phase fixture accepts concrete fields and rejects each deliberate omission', () => {
    const directory = mkdtempSync(join(tmpdir(), 'wh-acceptance-plan-'));
    const plan = '证据计划：判什么=配置错误位置；怎么判=ORACLE-CONFIG-ERROR；证据从哪来=quality/tests/config-error.output；谁提供=配置加载器测试作者；何时能拿到=P1命令退出后；成本类别=命令级；拿不到怎么办=按下行缺口恢复\n' +
      'incomplete：AC-DOMAIN-001；试过=node config-error.test.mjs 原 ref quality/tests/config-error.output；卡在=加载入口缺失；谁提供=配置模块owner；恢复条件=入口可导入并重放错误位置\n';
    const path = join(directory, 'P1.md');
    try {
      writeFileSync(path, plan);
      expect(readPlan(readFileSync(path, 'utf8'))['谁提供']).toBe('配置加载器测试作者');
      expect(() => readPlan(plan.replace('；成本类别=命令级', ''))).toThrow('invalid 成本类别');
      expect(() => readPlan(plan.replace('试过=node config-error.test.mjs 原 ref quality/tests/config-error.output', '拿不到'))).toThrow('missing attempt ref');
      expect(() => readPlan(plan.replace('谁提供=配置加载器测试作者', '谁提供=占位'))).toThrow('invalid 谁提供');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('three current task AC samples name actual providers and preserve the stage-end gap', () => {
    const base = 'specs/archive/workflowhub-build-code-efficiency-verify-merge-20261026/';
    const phase = read(base + 'phases/P4-每Phase证据与验收记录.md');
    const spec = read(base + 'spec.md');
    const gap = phase.split('\n').find(line => line.startsWith('incomplete：AC-ACCEPT-002；'));
    for (const ac of ['AC-ACCEPT-001', 'AC-ACCEPT-002', 'AC-EVID-002']) {
      expect(spec).toContain('**' + ac + '**');
      const block = phase.split('#### ' + ac + '\n')[1]?.split('\n#### ')[0];
      expect(block, ac).toBeTruthy();
      const fields = readPlan(block + '\n' + gap);
      expect(fields['谁提供']).toContain('/root/p4_execution');
      expect(fields['谁提供']).toContain('/root/p4_independent_test');
      expect(fields['何时能拿到']).not.toMatch(/占位|待填/);
    }
    expect(gap).toContain('真实build-code尚未结束');
    expect(gap).toContain('原P4开发/root/p4_execution回核');
  });
});
