import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const labels = ['判什么', '怎么判', '证据从哪来', '谁提供', '何时能拿到', '成本类别', '拿不到怎么办'];
// Test-only reader: checks the human contract without adding a runtime gate.
function readPlan(text) {
  const line = text.split('\n').find(line => line.includes('证据计划：'));
  if (!line) throw new Error('missing evidence plan');
  const fields = Object.fromEntries(line.slice(line.indexOf('证据计划：') + 5).split('；').map(part => part.split('=')));
  for (const label of labels) if (!fields[label]?.trim() || /占位|待填|\.\.\.|…|<|\[/.test(fields[label])) throw new Error('invalid ' + label);
  const gap = text.split('\n').find(line => line.startsWith('incomplete：'));
  if (!gap || !/试过=.*quality\/tests\/[^；\s]+/.test(gap)) throw new Error('missing attempt ref');
  for (const label of ['卡在', '谁提供', '恢复条件']) if (!new RegExp(label + '=[^；\\n]+').test(gap)) throw new Error('missing gap ' + label);
  return fields;
}

describe('ORACLE-ACCEPT-PLAN', () => {
  it('real templates and planning steps carry seven fields and truthful incomplete instructions', () => {
    for (const path of ['skills/spec-specify/templates/spec-template.md', 'skills/spec-plan/templates/phase-template.md']) {
      const text = read(path);
      for (const label of labels) expect(text, path + ': ' + label).toContain(label + '=');
      for (const label of ['试过=', '卡在=', '谁提供=', '恢复条件=']) expect(text, path).toContain(label);
      expect(text, path).toMatch(/无[^\n]*尝试[^\n]*ref[^\n]*不得[^\n]*incomplete/);
      expect(text, path).toContain('最终报告逐条列缺口');
    }
    const workflow = read('workflows/build-plan/SKILL.md');
    expect(workflow).toMatch(/^7\.[^\n]*七字段[^\n]*缺一项不得开工/m);
    expect(workflow).toMatch(/^9\.[^\n]*七字段[^\n]*incomplete/m);
  });

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
