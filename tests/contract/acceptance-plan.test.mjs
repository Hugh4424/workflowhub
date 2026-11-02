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

// ORACLE-P2-COST: test-only readers keep the frozen worked examples independent
// from the templates and do not add a runtime budget gate.
const costLabels = ['executor', 'estimate_min', 'hard_cap_min', 'resources', 'observation', 'retry_cap', 'evidence_tier'];
function costField(text, label) {
  return text.match(new RegExp('(?:^|[；\\s])' + label + '=([^；\\n]+)'))?.[1]?.trim();
}
function costFieldGaps(text) {
  return costLabels.filter(label => !costField(text, label) || /占位|待填|\.\.\.|…|<|\[/.test(costField(text, label)));
}
function readCostFields(text) {
  const gaps = costFieldGaps(text);
  if (gaps.length) throw new Error('invalid ' + gaps[0]);
  return Object.fromEntries(costLabels.map(label => [label, costField(text, label)]));
}
const historicalAC = Array.from({ length: 11 }, (_, index) => `AC-HISTORY-${index + 1}`);
const splitHistoricalAC = () => [
  { kind: 'cheap', acceptance: historicalAC.slice(0, 8) },
  { kind: 'real-environment', acceptance: historicalAC.slice(8) },
];
const costLine = estimate => `executor=独立测试；estimate_min=${estimate}；hard_cap_min=240；resources=现有模板与只读材料；observation=重算输出；retry_cap=1；evidence_tier=合同测试`;
function costPlan() {
  return {
    costs: { 'AC-001': costLine(30), 'AC-002': costLine(60), 'AC-003': costLine(45) },
    serial: ['AC-001'], parallel: [['AC-002', 'AC-003']], sharedPrepare: 10, retryReserve: 15,
    declaredTotal: 115, softMin: 120, hardMin: 240, softAction: '', hardConfirmation: '',
    finalSegments: splitHistoricalAC(),
    taskShape: { acceptanceCount: 3, modules: ['cost-template'], dataBytes: 0,
      longestTestMin: 1, externalInputs: [], dataTier: 'S', classification: '可直接做',
      splitRequirement: { required: false, source: '本测试具名S合成形状' } },
    acceptanceTestMapping: {
      'AC-001': { testAgent: 'independent-config-test', oracle: 'ORACLE-CONFIG-ERROR', dataTier: 'S' },
      'AC-002': { testAgent: 'independent-cost-test', oracle: 'ORACLE-COST-READBACK', dataTier: 'S' },
      'AC-003': { testAgent: 'independent-budget-test', oracle: 'ORACLE-BUDGET-READBACK', dataTier: 'S' },
    },
  };
}
function readCostPlan(plan) {
  const shape = plan.taskShape;
  if (!shape || typeof shape !== 'object' || Array.isArray(shape)) throw new Error('missing shape');
  for (const field of ['acceptanceCount', 'modules', 'dataBytes', 'longestTestMin', 'externalInputs', 'dataTier']) {
    if (!Object.hasOwn(shape, field) || shape[field] === null || shape[field] === undefined
        || (typeof shape[field] === 'string' && !shape[field].trim())) throw new Error('missing shape ' + field);
  }
  if (![shape.acceptanceCount, shape.dataBytes, shape.longestTestMin].every(value => Number.isFinite(value) && value >= 0)
      || !Array.isArray(shape.modules) || !shape.modules.length || !Array.isArray(shape.externalInputs)
      || !['S', 'M', 'L'].includes(shape.dataTier)
      || !['可直接做', '需拆分', '需用户确认的长跑'].includes(shape.classification)
      || typeof shape.splitRequirement?.required !== 'boolean' || !shape.splitRequirement.source?.trim()) {
    throw new Error('invalid shape');
  }
  // This checks the declared upstream requirement, never a numeric production threshold.
  if (shape.splitRequirement.required && shape.classification !== '需拆分') throw new Error('declared shape requires split');
  const mapping = plan.acceptanceTestMapping;
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw new Error('missing mapping');
  for (const id of Object.keys(plan.costs)) {
    if (!mapping[id]) throw new Error('missing mapping ' + id);
    for (const field of ['testAgent', 'oracle', 'dataTier']) {
      if (typeof mapping[id][field] !== 'string' || !mapping[id][field].trim()) throw new Error('missing mapping ' + id + ' ' + field);
    }
    if (!['S', 'M', 'L'].includes(mapping[id].dataTier)) throw new Error('invalid mapping dataTier ' + id);
  }
  const costs = Object.fromEntries(Object.entries(plan.costs).map(([id, text]) => [id, readCostFields(text)]));
  const estimate = id => {
    if (!costs[id]) throw new Error('missing cost ' + id);
    const value = Number(costs[id].estimate_min);
    if (!Number.isFinite(value) || value < 0) throw new Error('invalid estimate_min ' + id);
    return value;
  };
  const total = plan.serial.reduce((sum, id) => sum + estimate(id), 0)
    + plan.parallel.reduce((sum, group) => sum + Math.max(...group.map(estimate)), 0)
    + plan.sharedPrepare + plan.retryReserve;
  if (total !== plan.declaredTotal) throw new Error(`cost total mismatch: computed ${total}`);
  if (total > plan.softMin && !plan.softAction) throw new Error('soft cap requires split or reduction');
  if (total > plan.hardMin && !plan.hardConfirmation) throw new Error('hard cap confirmation required');
  const finalAC = plan.finalSegments.flatMap(segment => segment.acceptance);
  if (new Set(finalAC).size === 11) {
    const kinds = new Set(plan.finalSegments.map(segment => segment.kind));
    if (plan.finalSegments.length < 2 || !kinds.has('cheap') || !kinds.has('real-environment')) {
      throw new Error('eleven AC require cheap and real-environment segments');
    }
  }
  return total;
}

describe('ORACLE-P2-COST', () => {
  it('requires all seven cost fields in every spec template acceptance example', () => {
    const spec = read('skills/spec-specify/templates/spec-template.md');
    const appendix = spec.split('## Appendix A')[1]?.split('## Appendix B')[0] ?? '';
    const examples = appendix.split(/\n(?=- \[ \] \*\*AC-)/).filter(block => block.startsWith('- [ ] **AC-'));
    expect(examples.length).toBeGreaterThanOrEqual(2);
    for (const example of examples) expect(costFieldGaps(example), example.split('\n')[0]).toEqual([]);
  });

  it('rejects omission of every cost field through the same plan reader', () => {
    expect(readCostPlan(costPlan())).toBe(115);
    for (const label of costLabels) {
      const plan = costPlan();
      plan.costs['AC-001'] = plan.costs['AC-001'].replace(new RegExp(label + '=[^；]+'), '');
      expect(() => readCostPlan(plan), label).toThrow('invalid ' + label);
    }
  });

  it('recomputes 30 plus max(60,45) plus 10 plus 15 as 115 and rejects a wrong total', () => {
    expect(readCostPlan(costPlan())).toBe(115);
    const wrong = { ...costPlan(), declaredTotal: 116 };
    expect(() => readCostPlan(wrong)).toThrow('cost total mismatch: computed 115');
    const phase = read('skills/spec-plan/templates/phase-template.md');
    for (const term of ['acceptance_cost_total', 'phase_budget', 'soft_min', 'hard_min', '并行最大', '共享准备', '重试预留', '用户等待']) {
      expect(phase, term).toContain(term);
    }
  });

  it('uses soft 120 and hard 240 and rejects 255 without real confirmation', () => {
    const overSoft = costPlan();
    overSoft.costs['AC-004'] = costLine(10);
    overSoft.serial.push('AC-004');
    overSoft.taskShape.acceptanceCount = 4;
    overSoft.acceptanceTestMapping['AC-004'] = { testAgent: 'independent-extra-test', oracle: 'ORACLE-EXTRA-COST', dataTier: 'S' };
    overSoft.declaredTotal = 125;
    expect(() => readCostPlan(overSoft)).toThrow('soft cap requires split or reduction');
    overSoft.softAction = 'split';
    expect(readCostPlan(overSoft)).toBe(125);

    const overHard = costPlan();
    overHard.costs['AC-004'] = costLine(140);
    overHard.serial.push('AC-004');
    overHard.taskShape.acceptanceCount = 4;
    overHard.acceptanceTestMapping['AC-004'] = { testAgent: 'independent-extra-test', oracle: 'ORACLE-EXTRA-COST', dataTier: 'S' };
    overHard.declaredTotal = 255;
    overHard.softAction = 'split';
    expect(() => readCostPlan(overHard)).toThrow('hard cap confirmation required');
    overHard.hardConfirmation = '用户确认超硬上限；根因=真实环境验收';
    expect(readCostPlan(overHard)).toBe(255);
  });

  it('rejects eleven historical acceptance items stuffed into one final Phase segment', () => {
    const plan = costPlan();
    plan.finalSegments = [{ kind: 'cheap', acceptance: historicalAC }];
    expect(() => readCostPlan(plan)).toThrow('eleven AC require cheap and real-environment segments');
    plan.finalSegments = splitHistoricalAC();
    expect(readCostPlan(plan)).toBe(115);
  });

  it('rejects a missing shape or each missing shape field and accepts restoration including zero data', () => {
    const missing = costPlan();
    delete missing.taskShape;
    expect(() => readCostPlan(missing)).toThrow('missing shape');
    for (const field of ['acceptanceCount', 'modules', 'dataBytes', 'longestTestMin', 'externalInputs', 'dataTier']) {
      const plan = costPlan();
      delete plan.taskShape[field];
      expect(() => readCostPlan(plan), field).toThrow('missing shape ' + field);
    }
    const restored = costPlan();
    expect(restored.taskShape.dataBytes).toBe(0);
    expect(restored.taskShape.externalInputs).toEqual([]);
    expect(readCostPlan(restored)).toBe(115);
  });

  it('rejects a missing mapping or each missing AC agent, oracle or data tier and accepts restoration', () => {
    const missing = costPlan();
    delete missing.acceptanceTestMapping;
    expect(() => readCostPlan(missing)).toThrow('missing mapping');
    for (const id of ['AC-001', 'AC-002', 'AC-003']) {
      const plan = costPlan();
      delete plan.acceptanceTestMapping[id];
      expect(() => readCostPlan(plan), id).toThrow('missing mapping ' + id);
      for (const field of ['testAgent', 'oracle', 'dataTier']) {
        const incomplete = costPlan();
        delete incomplete.acceptanceTestMapping[id][field];
        expect(() => readCostPlan(incomplete), id + '/' + field).toThrow('missing mapping ' + id + ' ' + field);
      }
    }
    expect(readCostPlan(costPlan())).toBe(115);
  });

  it('rejects only the wrong classification of the declared 189 file, 22GB, 3.7h split requirement', () => {
    const plan = costPlan();
    plan.taskShape = { acceptanceCount: 3, modules: Array.from({ length: 189 }, (_, i) => 'file-' + i),
      dataBytes: 22000000000, longestTestMin: 222, externalInputs: [], dataTier: 'S',
      classification: '需拆分', splitRequirement: { required: true,
        source: 'P2 T003输出/失败：189文件、22GB、3.7h单测必须标需拆分；S为合成形状，无真实22GB数据' } };
    expect(readCostPlan(plan)).toBe(115);
    plan.taskShape.classification = '可直接做';
    expect(() => readCostPlan(plan)).toThrow('declared shape requires split');
    plan.taskShape.classification = '需拆分';
    expect(readCostPlan(plan)).toBe(115);
  });
});

// ORACLE-P3-CONTROL: independent method fixtures, not a runtime watchdog or gate.
function readExecutionBudget(budget, observed) {
  for (const key of ['window_minutes', 'command_cap', 'wait_cap']) {
    if (observed[key] > budget[key] * 1.5) return 'stop-expansion';
  }
  return 'continue';
}
function readFailureDecision(events) {
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    if (event.nonRetryable) return { action: 'stop', at: index + 1, reason: 'non-retryable' };
    if (index > 0 && event.signature === events[index - 1].signature
        && !(event.newFact || event.newEvidence || event.approved)) {
      return { action: 'stop', at: index + 1, reason: 'same-signature' };
    }
  }
  return { action: 'continue' };
}
function readHeartbeatDecision(heartbeats) {
  let empty = 0;
  for (const heartbeat of heartbeats) {
    empty = heartbeat.phase && heartbeat.expectedCompletion && heartbeat.newFact ? 0 : empty + 1;
    if (empty === 2) return 'stop';
  }
  return 'continue';
}
function readApproval(minutes, answered) {
  return answered ? 'continue' : minutes >= 15 ? 'awaiting_user' : 'waiting';
}
const gateChangeFields = ['changeRequest', 'costImpact', 'independentApproval', 'userConfirmation'];
function readGateChange(change) {
  if (change.kind === 'bug-fix' && !change.touchesOracle && !change.touchesGateCommand) return 'allowed';
  const missing = gateChangeFields.filter(field => !change[field]);
  if (missing.length) throw new Error('frozen gate change missing ' + missing[0]);
  return 'allowed';
}
function readEvidenceReuse(records, currentRun) {
  const groups = new Map();
  for (const record of records) {
    const key = [record.hash, record.command, record.exit].join('\0');
    if (!groups.has(key)) groups.set(key, { hash: record.hash, provenance: [], current: false });
    const group = groups.get(key);
    group.provenance.push({ run: record.run, step: record.step, ref: record.ref });
    group.current ||= record.run === currentRun;
  }
  return { stored: groups.size, groups: [...groups.values()] };
}

describe('ORACLE-P3-CONTROL', () => {
  it('exposes execution budget, stop, heartbeat and evidence rules at their method seams', () => {
    const buildCode = read('workflows/build-code/SKILL.md');
    for (const term of ['execution_budget', 'window_minutes', 'command_cap', 'wait_cap', 'retry_reserve', '1.5', 'awaiting_user', '空心跳', 'provenance']) {
      expect(buildCode, term).toContain(term);
    }
    expect(read('skills/spec-plan/templates/phase-template.md')).toContain('execution_budget');
    expect(read('workflows/build-code/steps.json')).toContain('execution_budget');
    const standard = read('docs/standard-workflow.md');
    for (const term of ['同字节', 'provenance', '旧运行']) expect(standard, term).toContain(term);
  });

  it('stops expansion beyond 1.5 times the 120 minute, 50 command and 30 wait budget', () => {
    const budget = { window_minutes: 120, command_cap: 50, wait_cap: 30, retry_reserve: 30 };
    expect(readExecutionBudget(budget, { window_minutes: 120, command_cap: 50, wait_cap: 30 })).toBe('continue');
    for (const observed of [
      { window_minutes: 181, command_cap: 0, wait_cap: 0 },
      { window_minutes: 0, command_cap: 76, wait_cap: 0 },
      { window_minutes: 0, command_cap: 0, wait_cap: 46 },
    ]) expect(readExecutionBudget(budget, observed)).toBe('stop-expansion');
  });

  it('stops non-retryable failure immediately and two same-signature rounds without new facts', () => {
    expect(readFailureDecision([{ signature: 'E1', nonRetryable: true }, { signature: 'E2' }]))
      .toEqual({ action: 'stop', at: 1, reason: 'non-retryable' });
    expect(readFailureDecision([{ signature: 'E1' }, { signature: 'E1' }]))
      .toEqual({ action: 'stop', at: 2, reason: 'same-signature' });
    expect(readFailureDecision([
      { signature: 'E1' }, { signature: 'E1', newEvidence: true }, { signature: 'E1', approved: true },
    ])).toEqual({ action: 'continue' });
  });

  it('marks unanswered approval awaiting_user and does not let empty heartbeats extend execution', () => {
    expect(readApproval(15, false)).toBe('awaiting_user');
    expect(readApproval(15, true)).toBe('continue');
    expect(readHeartbeatDecision([{}, { phase: 'P3' }])).toBe('stop');
    expect(readHeartbeatDecision([
      { phase: 'P3', expectedCompletion: '16:00', newFact: 'diff ready' },
      { phase: 'P3', expectedCompletion: '16:05', newFact: 'test recorded' },
    ])).toBe('continue');
  });

  it('rejects 132 to 168 without the complete change request but allows a legal bug fix', () => {
    const change = { from: 132, to: 168, changeRequest: true, costImpact: true, independentApproval: true, userConfirmation: true };
    expect(readGateChange(change)).toBe('allowed');
    for (const field of gateChangeFields) {
      const incomplete = { ...change, [field]: false };
      expect(() => readGateChange(incomplete), field).toThrow('frozen gate change missing ' + field);
    }
    expect(readGateChange({ kind: 'bug-fix', touchesOracle: false, touchesGateCommand: false })).toBe('allowed');
  });

  it('deduplicates same-run bytes with provenance and never treats old-run bytes as current', () => {
    const common = { hash: 'same-sha', command: 'npx vitest', exit: 1 };
    const current = readEvidenceReuse([
      { ...common, run: 'run-current', step: 'red', ref: 'red.output' },
      { ...common, run: 'run-current', step: 'retry', ref: 'retry.output' },
    ], 'run-current');
    expect(current.stored).toBe(1);
    expect(current.groups[0].current).toBe(true);
    expect(current.groups[0].provenance).toEqual([
      { run: 'run-current', step: 'red', ref: 'red.output' },
      { run: 'run-current', step: 'retry', ref: 'retry.output' },
    ]);
    const old = readEvidenceReuse([{ ...common, run: 'run-old', step: 'red', ref: 'old.output' }], 'run-current');
    expect(old.groups[0].current).toBe(false);
    expect(readEvidenceReuse([
      { ...common, run: 'run-current', step: 'one', ref: 'one.output' },
      { ...common, hash: 'different-sha', run: 'run-current', step: 'two', ref: 'two.output' },
    ], 'run-current').stored).toBe(2);
  });
});

// The same reader consumes actual method bytes, controlled missing-clause
// variants, and restored bytes. It adds no production validator or budget gate.
const controlClauses = {
 checkpoint: /Phase 边界、长命令前后与阻塞时/,
 checkpointContents: /目标、已完成、未完成、实际命令、证据指针、下一动作/,
 eventWait: /等待用事件通知与宿主完成回报，禁止 sleep\/轮询空转/,
 noFact: /达到计划两倍或连续一个检查窗无新增验收事实/,
 providerExclusion: /以上通用超时、停止、心跳及回收规则不适用于审查 provider\/broker/,
 finalData: /最终声明的完整数据与全部验收覆盖仍须执行/,
 parallel: /有两个以上可独立并行面至少两个代理，不足两个一个并写明理由/,
 pointer: /大件只留内容哈希、外部指针和摘要/,
 identity: /task_id、run_id（本次真实执行身份）、step_slug、artifact_sha、created_at/,
 separateWaits: /用户等待、provider 审查等待、真实环境纯等待分账/,
 ownedOnly: /只回收本任务拥有的 POSIX 进程组/,
 freeze: /变更先给请求、成本影响、独立批准及用户重新确认/,
};
function readControlMethod(text) {
 for (const [key,clause] of Object.entries(controlClauses)) {
  if (!clause.test(text)) throw new Error('missing control clause ' + key);
 }
 return 'usable';
}
function reviewWindow(observed) {
 if (observed.elapsed >= observed.planned * 2 || observed.newAcceptanceFacts === 0) return 'review-current-path';
 return 'continue';
}
describe('ORACLE-P3-CONTROL actual method negative controls', () => {
 it('consumes the real method, rejects each removed clause, and accepts restored bytes', () => {
  const source=read('workflows/build-code/SKILL.md');
  expect(readControlMethod(source)).toBe('usable');
  for (const [key,clause] of Object.entries(controlClauses)) {
   const missing=source.replace(clause,'');
   expect(missing,key).not.toBe(source);
   expect(()=>readControlMethod(missing),key).toThrow('missing control clause '+key);
   expect(readControlMethod(source),key).toBe('usable');
  }
 });
 it('observes twice the plan or no new acceptance facts without declaring product failure', () => {
  expect(readControlMethod(read('workflows/build-code/SKILL.md'))).toBe('usable');
  expect(reviewWindow({elapsed:240,planned:120,newAcceptanceFacts:1})).toBe('review-current-path');
  expect(reviewWindow({elapsed:30,planned:120,newAcceptanceFacts:0})).toBe('review-current-path');
  expect(reviewWindow({elapsed:180,planned:120,newAcceptanceFacts:1})).toBe('continue');
 });
 it('wires the shared template, step evidence and standard back to the original method', () => {
  const template=read('skills/spec-plan/templates/phase-template.md');
  expect(template).toContain('workflows/build-code/SKILL.md#长任务怎么控制');
  const steps=JSON.parse(read('workflows/build-code/steps.json')).steps;
  expect(steps.find(step=>step.step_id===1).observable_result).toContain('execution_budget');
  expect(steps.find(step=>step.step_id===9).observable_result).toContain('独立oracle面并行只读测试');
  expect(steps.find(step=>step.step_id===9).observable_result).toContain('provider/broker排除域');
  const standard=read('docs/standard-workflow.md');
  expect(standard).toContain('../workflows/build-code/SKILL.md#长任务怎么控制');
  expect(standard).toContain('审查 provider/broker 保 wh-review 排除域');
 });
});

// Reads the actual method and its step projection; variants model contradictory ordering.
function readPhaseSequence(method, steps) {
 const step5 = steps.find(step => step.step_id === 5).observable_result;
 const step9 = steps.find(step => step.step_id === 9).observable_result;
 if (!step5.includes('开发期定向测试') || step5.includes('派发独立测试')) throw new Error('developer tests');
 if (!method.includes('主会话再派审查与测试；两者可并行，不得早于实现就绪并明确通知')) throw new Error('ready and parallel dispatch');
 if (!method.includes('首次派发不等待审查或第9步完成')) throw new Error('parallel dispatch without review wait');
 if (!method.includes('开发在两方明确回报后，最后确认无待改项')) throw new Error('final confirmation');
 if (!step9.includes('两方实际回报汇合与受影响复验') || !step9.includes('不作首次派发前置')) throw new Error('convergence');
 if (step9.includes('第9步完成后才派发独立测试')) throw new Error('delayed dispatch');
 return 'usable';
}
describe('ORACLE-P3-CONTROL sequence actual method negative controls', () => {
 it('accepts actual order, rejects premature or delayed dispatch and missing convergence, then accepts restored input', () => {
  const method = read('workflows/build-code/SKILL.md');
  const steps = JSON.parse(read('workflows/build-code/steps.json')).steps;
  expect(readPhaseSequence(method, steps)).toBe('usable');
  const variants = [
   [method.replace('不得早于实现就绪并明确通知', '可以早于实现就绪'), steps, 'ready and parallel dispatch'],
   [method.replace('首次派发不等待审查或第9步完成', '首次派发等待审查或第9步完成'), steps, 'parallel dispatch without review wait'],
   [method.replace('开发在两方明确回报后，最后确认无待改项', '开发直接确认无待改项'), steps, 'final confirmation'],
   [method, steps.map(s => s.step_id === 5 ? {...s, observable_result: s.observable_result + '派发独立测试'} : s), 'developer tests'],
   [method, steps.map(s => s.step_id === 9 ? {...s, observable_result: s.observable_result.replace('两方实际回报汇合与受影响复验', '')} : s), 'convergence'],
   [method, steps.map(s => s.step_id === 9 ? {...s, observable_result: s.observable_result + '第9步完成后才派发独立测试'} : s), 'delayed dispatch'],
  ];
  for (const [alteredMethod, alteredSteps, reason] of variants) {
   expect(() => readPhaseSequence(alteredMethod, alteredSteps), reason).toThrow(reason);
   expect(readPhaseSequence(method, steps), reason).toBe('usable');
  }
 });
});
