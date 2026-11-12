import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';

const firstDecision = `#### WP1 — controlled
- **结果与消费者**：受控结果；消费者是 controlled consumer。
#### D-001 — controlled decision
- **做什么**：读取受控原件并报告缺口。
- **不做什么**：不写运行时。
- **风险**：缺证据误报。
| AC-01 | 受控结果可回读 | 目标内容明确 |
| OI-001 | 待独立核对 | owner：受控维护者 |
细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`
`;
const secondDecision = `#### WP2 — second
- **结果与消费者**：受控第二结果；消费者是 WP1。
#### D-002 — second decision
- **做什么**：准备第二输入。
- **不做什么**：不变更第一输入。
- **风险**：输入缺失。
`;
const validOne = '| 1 controlled | D-001 做什么 | D-001 不做什么 | D-001＋details§1 | AC-01 | D-001 风险 | 无 | controlled consumer | OI-001 | 已收敛 |\n';
const validTwo = '| 2 second | D-002 做什么 | D-002 不做什么 | details§2 | AC-01 | D-002 风险 | WP1 | WP1 | 无 | 已收敛 |\n';
const detailsBody = '# 受控细化\n## 1 第一模块\n实现只读报告；原件与退出码分开记录。\n## 2 第二模块\n消费第一模块结果；不新增运行时。\n## 历史提及\n曾提到details§8和D-099、AC-99、OI-099，不是当前锚。\n';

// ORACLE-P1-STAGE-STEPS: current P1/T002 approves CLI/report public seam.
// Missing implementation is observed by a named assertion, not import failure.
const entry = resolve('tools/cli/check-stage-steps.mjs');
const checker = existsSync(entry) ? await import(/* @vite-ignore */ entry) : {};
describe('ORACLE-P1-STAGE-STEPS checker', () => {
  it('real CLI names missing eighth evidence, preserves inputs and reports removed mapping', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-checker-')));
    const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(repo, 'specs/controlled');
    const put = (base, name, value) => { const path = join(base, name); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value)); };
    try {
      mkdirSync(materials, { recursive: true });
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'controlled', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(materials, 'decision-log.md', '# Complete decision body\n## 级别与路线\n- 推荐级别：复杂\n## 工作包与决定\n' + firstDecision + '清单：`quality/evidence/decision-log-refs/controlled-convergence-checklist.md`\n');
      put(materials, 'phases/index.md', '# Pure pointer index\n');
      for (const stage of ['make-decision', 'build-plan', 'build-code', 'build-prd']) {
        put(repo, `workflows/${stage}/steps.json`, readFileSync(resolve(`workflows/${stage}/steps.json`), 'utf8'));
      }
      put(task, 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md', validOne);
      put(task, 'quality/evidence/decision-log-refs/controlled-module-details.md', detailsBody);
      // Input invariance below compares the exact stage evidence bytes.
      const invoke = () => spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${repo}`, '--json'], { encoding: 'utf8', cwd: repo });
      const source = 'workflows/make-decision/steps.json';
      const owned = JSON.parse(readFileSync(join(repo, source), 'utf8')).steps;
      put(repo, 'workflows/make-decision/SKILL.md', '# Controlled method\n## 方法\nOwned observation.\n');
      // Keep real 15-step identities/mapping, bind all criteria to the owned method.
      for (const step of owned) step.observable_result = 'Observed controlled behavior. 判定消费：SKILL.md#方法；原件：owned human record';
      put(repo, source, { schema_version: '2.0.0', stage_slug: 'make-decision', steps: owned });
      put(materials, 'step-consumer-design.md', owned.map(step => `| [controlled](../../${source}#L1) \`${step.step_slug}\` | observation | human | owner |`).join('\n'));
      const entries = owned.map(step => {
        const ref = `quality/evidence/${step.step_slug}.json`;
        put(task, ref, { source, step_slug: step.step_slug, reader: 'controlled independent reader', inputs: ['owned observation'], observation: 'Read the named controlled observation.', criteria_ref: 'workflows/make-decision/SKILL.md#方法', conclusion: 'completed', limits: [] });
        return { ref, source, step_slug: step.step_slug };
      });
      put(task, 'facts.jsonl', JSON.stringify({ record_kind: 'stage', task_id: 'controlled', stage: 'make-decision', source: 'controlled test observations, not actual user approval', evidence: { value: entries } }) + '\n');
      const producer = () => runFinalChainCheck({ taskPath: task, materialRoot: materials });
      expect(producer().workflow_steps.filter(row => row.stage === 'make-decision').map(row => row.state)).toEqual(Array(15).fill('completed'));
      expect(JSON.parse(invoke().stdout).stages[0].steps[7]).toMatchObject({ judgment: '已完成', state: 'completed' });
      const eighthPath = join(task, entries[7].ref), eighthBytes = readFileSync(eighthPath);
      rmSync(eighthPath);
      expect(producer().workflow_steps.filter(row => row.stage === 'make-decision').map(row => row.state)).toEqual([...Array(7).fill('completed'), 'unavailable', ...Array(7).fill('completed')]);
      const first = invoke();
      expect(first.status).toBe(0);
      const report = JSON.parse(first.stdout);
      expect(report.stages[0].steps[7]).toMatchObject({ step_id: 8, judgment: '未留痕' });
      expect(report.level).toBe('- 推荐级别：复杂');
      expect(report.modules[0].fields).toHaveLength(8);
      expect(report.convergence.complete).toBe(true);
      const textInvoke = () => spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${repo}`], { encoding: 'utf8', cwd: repo });
      const text = textInvoke();
      expect(text.status).toBe(0);
      expect(text.stdout).toContain('1 controlled：已收敛');
      for (const [name, value] of [['目标','D-001 做什么'],['边界','D-001 不做什么'],['方案与取舍','D-001＋details§1'],['验收','AC-01'],['风险','D-001 风险'],['依赖','无'],['消费者','controlled consumer'],['未决/无','OI-001']]) expect(text.stdout).toContain(`  ${name}：${value}；present=true`);
      expect(text.stdout).toContain('收敛 complete=true；gaps=[]');
      expect(report.errors.join('\n')).not.toContain('phases/index.md');
      expect(readFileSync(join(task, 'facts.jsonl'), 'utf8')).toBe(JSON.stringify({ record_kind: 'stage', task_id: 'controlled', stage: 'make-decision', source: 'controlled test observations, not actual user approval', evidence: { value: entries } }) + '\n');
      writeFileSync(eighthPath, eighthBytes);
      expect(producer().workflow_steps[7].state).toBe('completed');
      expect(JSON.parse(invoke().stdout).stages[0].steps[7]).toMatchObject({ judgment: '已完成', state: 'completed' });
      const manifest = JSON.parse(readFileSync(join(repo, 'workflows/build-prd/steps.json'), 'utf8'));
      manifest.steps[0].observable_result = 'Controlled missing mapping marker';
      put(repo, 'workflows/build-prd/steps.json', manifest);
      put(task, 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md', validOne.replace('D-001 不做什么', '').replace('已收敛', '待收敛'));
      const second = invoke();
      expect(second.status).toBe(1);
      const secondConvergence = JSON.parse(second.stdout).convergence;
      expect(secondConvergence.complete).toBe(false);
      expect(secondConvergence.gaps).toEqual(expect.arrayContaining(['1 controlled', '未收敛：1 controlled']));
      expect(JSON.parse(second.stdout).modules[0].fields[1]).toMatchObject({ name: '边界', present: false });
      const incompleteText = textInvoke().stdout;
      expect(incompleteText).toContain('1 controlled：待收敛');
      expect(incompleteText).toContain('  边界：缺项；present=false');
      expect(incompleteText).toContain('未收敛：1 controlled');
      expect(JSON.parse(second.stdout).stages[3]).toMatchObject({ mapping: '未配置' });
      expect(JSON.parse(second.stdout).stages[3].steps[0]).toMatchObject({ judgment: '映射未配置', evidence_location: null });
      const decisionPath = join(materials, 'decision-log.md');
      const decision = readFileSync(decisionPath, 'utf8');
      const ref = 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md';
      const one = validOne;
      const two = validTwo;
      writeFileSync(decisionPath, decision + secondDecision);
      put(task, ref, one + two);
      expect(JSON.parse(invoke().stdout).convergence.complete).toBe(true);
      for (const [body, gap] of [[one, '缺模块 WP2'], [one + two + two, '重复模块 WP2'], [one + two + two.replace('2 second', '3 unknown'), '未知模块 WP3']]) {
        put(task, ref, body);
        const value = JSON.parse(invoke().stdout).convergence;
        expect(value.complete).toBe(false);
        expect(value.gaps).toContain(gap);
        const gapText = textInvoke().stdout;
        expect(gapText).toContain('收敛 complete=false');
        expect(gapText).toContain(gap);
      }
      writeFileSync(decisionPath, decision.replace('#### WP1 — controlled', 'plain reference WP1'));
      expect(JSON.parse(invoke().stdout).convergence.complete).toBe(false);
      writeFileSync(decisionPath, decision.replace(ref, 'quality/evidence/../escape-convergence-checklist.md'));
      expect(JSON.parse(invoke().stdout).errors.join('\n')).toContain('未取得唯一当前任务收敛清单指针');
      writeFileSync(decisionPath, decision + 'other `quality/evidence/another-convergence-checklist.md`\n');
      expect(JSON.parse(invoke().stdout).convergence.complete).toBe(false);
    } finally { rmSync(root, { recursive: true }); }
  });
  it('reports the actual four mapping manifests independently of evidence availability', () => {
    expect(checker.runStageStepsCheck, 'report checker public entry is available').toBeTypeOf('function');
    const report = checker.runStageStepsCheck({ taskPath: resolve('/nonexistent/p1-controlled-task'), repoRoot: resolve('.') });
    expect(report.stages.map(row => [row.stage, row.mapping, row.steps.length])).toEqual([
      ['make-decision', '已配置', 15], ['build-plan', '已配置', 12],
      ['build-code', '已配置', 12], ['build-prd', '已配置', 6],
    ]);
    expect(report.stages.every(row => row.definition === 'available')).toBe(true);
    expect(report.errors.join('\n')).toContain('task.json');
    expect(report.stages[0].steps[7]).toMatchObject({ judgment: '未留痕' });
  });
});

describe('step definition source and failure wording', () => {
  const taskPath = root => join(root, 'missing-task');
  const lineSaysUntraced = text => text.split('\n').some(line => /：未留痕/.test(line));
  it('reads the installed workflow manifests when cwd has no workflows/', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-cwd-')));
    try {
      const business = join(root, 'business');
      mkdirSync(join(business, 'workflows/build-code'), { recursive: true });
      // A decoy next to the caller must not win over the installed package.
      writeFileSync(join(business, 'workflows/build-code/steps.json'), '{"stage_slug":"build-code","steps":[]}\n');
      const result = spawnSync(process.execPath, [entry, '--stage=build-code', `--task-path=${taskPath(root)}`, '--json'], { cwd: business, encoding: 'utf8' });
      expect(result.status).toBe(0);
      const report = JSON.parse(result.stdout);
      const installed = JSON.parse(readFileSync(resolve('workflows/build-code/steps.json'), 'utf8'));
      expect(report.stages).toHaveLength(1);
      expect(report.stages[0]).toMatchObject({ stage: 'build-code', definition: 'available', mapping: '已配置' });
      expect(report.stages[0].steps.map(step => step.step_slug)).toEqual(installed.steps.map(step => step.step_slug));
      expect(result.stdout).not.toContain('读不到步骤定义');
    } finally { rmSync(root, { recursive: true }); }
  });
  it('maps a producer definition failure to 未判定 wording, never a step verdict', () => {
    expect(checker.producerDefinitionError(['workflows/make-decision/steps.json: steps manifest is unreadable: ENOENT', 'other'], 'make-decision'))
      .toBe('steps manifest is unreadable: ENOENT');
    expect(checker.producerDefinitionError(['workflows/build-plan/steps.json: other'], 'make-decision')).toBeNull();
    expect(checker.producerDefinitionError(undefined, 'make-decision')).toBeNull();
  });
  it.each([
    ['a missing manifest', null],
    ['an invalid manifest', '{"stage_slug":"build-plan","steps":[]}\n'],
  ])('names %s as unreadable instead of judging steps 未留痕', (_label, content) => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-definition-')));
    try {
      const source = join(root, 'repo');
      mkdirSync(join(source, 'workflows/build-plan'), { recursive: true });
      if (content !== null) writeFileSync(join(source, 'workflows/build-plan/steps.json'), content);
      const args = [entry, '--stage=build-plan', `--task-path=${taskPath(root)}`, `--repo-root=${source}`];
      const result = spawnSync(process.execPath, [...args, '--json'], { encoding: 'utf8' });
      expect(result.status).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.stages[0]).toMatchObject({ stage: 'build-plan', definition: 'unavailable', mapping: '未配置', steps: [] });
      expect(report.stages[0].definition_error).toContain('build-plan/steps.json');
      expect(report.errors.join('\n')).toContain('读不到步骤定义');
      const text = spawnSync(process.execPath, args, { encoding: 'utf8' }).stdout;
      expect(text).toContain('读不到步骤定义');
      expect(text).toContain('未判定');
      expect(lineSaysUntraced(text)).toBe(false);
    } finally { rmSync(root, { recursive: true }); }
  });
});

function convergenceFixture(check) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-pointers-')));
  const task = join(root, 'task'), materials = join(root, 'materials');
  const ref = 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md';
  const put = (base, name, value) => { const path = join(base, name); mkdirSync(dirnameOf(path), { recursive: true }); writeFileSync(path, value); };
  const decision = '# Controlled\n## 级别与路线\n- 推荐级别：复杂\n' + firstDecision + secondDecision + `清单：\`${ref}\`\n`;
  const invoke = () => { const result = spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${resolve('.')}`, '--json'], { encoding: 'utf8' }); expect(result.status).toBe(0); return JSON.parse(result.stdout); };
  try {
    put(task, 'task.json', JSON.stringify({ schema_version:'1.0.0', task_id:'controlled', target_repo_root:resolve('.'), baseline_commit:'HEAD', activation_cohort:'post' }));
    put(task, 'facts.jsonl', ''); put(materials, 'phases/index.md', '# Index\n');
    put(materials, 'decision-log.md', decision); put(task, ref, validOne + validTwo);
    put(task, 'quality/evidence/decision-log-refs/controlled-module-details.md', detailsBody);
    check({ task, materials, ref, decision, put, invoke });
  } finally { rmSync(root, { recursive:true }); }
}
function dirnameOf(path) { return resolve(path, '..'); }

describe('convergence evidence pointer validation', () => {
  it('rejects nonempty claims without readable anchors and preserves their text', () => convergenceFixture(({task,ref,put,invoke}) => {
    put(task, ref, '| 1 controlled | goal | boundary | choice | AC | risk | none | consumer | none | 已收敛 |\n' + validTwo);
    const report = invoke();
    expect(report.modules[0].fields.map(field=>field.present)).toEqual(Array(8).fill(false));
    expect(report.modules[0].fields[0].reference).toBe('goal');
    expect(report.convergence.complete).toBe(false);
    expect(report.convergence.gaps).toContain('1 controlled');
    expect(report.errors.join('\n')).toContain('1 controlled/目标');
  }));
  it('resolves current source text, explicit none, WP dependencies and real consumers', () => convergenceFixture(({invoke}) => {
    const report=invoke();
    expect(report.modules.map(row=>row.fields.map(field=>field.present))).toEqual([Array(8).fill(true),Array(8).fill(true)]);
    expect(report.convergence.complete).toBe(true);
  }));
  it.each([
    ['missing decision', 'decision', firstDecision.replace('#### D-001 — controlled decision','历史提到D-001'), [false,false,false,true,false,true,true,true]],
    ['empty decision section', 'decision', firstDecision.replace('读取受控原件并报告缺口。',''), [false,true,true,true,true,true,true,true]],
    ['missing details section', 'details', detailsBody.replace('## 1 第一模块','历史提到details§1'), [true,true,false,true,true,true,true,true]],
    ['mixed true and false anchor', 'row', validOne.replace('details§1','details§99'), [true,true,false,true,true,true,true,true]],
    ['historical details eight', 'row', validOne.replace('details§1','details§8'), [true,true,false,true,true,true,true,true]],
    ['historical AC mention', 'row', validOne.replace('| AC-01 |','| AC-99 |'), [true,true,true,false,true,true,true,true]],
    ['historical OI mention', 'row', validOne.replace('| OI-001 |','| OI-099 |'), [true,true,true,true,true,true,true,false]],
    ['missing WP', 'row', validOne.replace('| 无 |','| WP99 |'), [true,true,true,true,true,false,true,true]],
    ['untraceable consumer with real AC', 'row', validOne.replace('controlled consumer','another consumer AC-01'), [true,true,true,true,true,true,false,true]],
    ['none outside allowed field', 'row', validOne.replace('D-001 做什么','无'), [false,true,true,true,true,true,true,true]],
    ['unanchored substantive prose', 'row', validOne.replace('D-001 做什么','只读受控输入，不写运行时'), [false,true,true,true,true,true,true,true]],
  ])('%s is reported field by field', (_label, kind, value, expected) => convergenceFixture(({task,materials,ref,decision,put,invoke}) => {
    if(kind==='decision') put(materials,'decision-log.md',decision.replace(firstDecision,value));
    if(kind==='details') put(task,'quality/evidence/decision-log-refs/controlled-module-details.md',value);
    if(kind==='row') put(task,ref,value+validTwo);
    const before=readFileSync(join(materials,'decision-log.md'));
    const report=invoke();
    expect(report.modules[0].fields.map(field=>field.present)).toEqual(expected);
    expect(report.convergence.complete).toBe(false);
    expect(report.errors.join('\n')).toContain('1 controlled/');
    expect(readFileSync(join(materials,'decision-log.md'))).toEqual(before);
  }));
  it('reports missing files and does not accept a readable sibling instead', () => convergenceFixture(({task,invoke}) => {
    rmSync(join(task,'quality/evidence/decision-log-refs/controlled-module-details.md'));
    const report=invoke(); expect(report.modules[0].fields[2].present).toBe(false); expect(report.convergence.complete).toBe(false);
  }));
  it('accepts only existing members in WP ranges and slash references', () => convergenceFixture(({task,ref,put,invoke}) => {
    for(const dependency of ['WP1～WP2','WP1/2','全部包','无（本实验没有其它依赖）']) {
      put(task,ref,validOne.replace('| 无 |',`| ${dependency} |`)+validTwo);
      expect(invoke().modules[0].fields[5].present).toBe(true);
    }
    put(task,ref,validOne.replace('| 无 |','| WP1～WP3 |')+validTwo);
    expect(invoke().modules[0].fields[5].present).toBe(false);
  }));
  it('names the missing checklist without a null diagnostic prefix', () => convergenceFixture(({materials,decision,put,invoke}) => {
    put(materials,'decision-log.md',decision.replace(/清单：[^\n]+/,'无清单'));
    const errors=invoke().errors.join('\n');
    expect(errors).toContain('收敛清单: 未取得唯一当前任务收敛清单指针');
    expect(errors).not.toContain('null:');
  }));
});

describe('five-column status table names unconverged packages', () => {
  function statusFixture(rows, check) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-status-')));
    const task = join(root, 'task'), materials = join(root, 'materials');
    const ref = 'quality/evidence/decision-log-refs/convergence-checklist.md';
    const put = (base, name, value) => { const path = join(base, name); mkdirSync(resolve(path, '..'), { recursive: true }); writeFileSync(path, value); };
    const decision = '# Controlled\n## 级别与路线\n- 推荐级别：复杂\n#### WP1 — controlled\n- **结果与消费者**：受控结果；消费者是 controlled consumer。\n#### WP2 — second\n- **结果与消费者**：受控第二结果；消费者是 WP1。\n清单：`' + ref + '`\n';
    try {
      put(task, 'task.json', JSON.stringify({ schema_version:'1.0.0', task_id:'controlled', target_repo_root:resolve('.'), baseline_commit:'HEAD', activation_cohort:'post' }));
      put(task, 'facts.jsonl', ''); put(materials, 'phases/index.md', '# Index\n');
      put(materials, 'decision-log.md', decision); put(task, ref, rows);
      const invoke = json => spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${resolve('.')}`, ...(json ? ['--json'] : [])], { encoding:'utf8' });
      check({ invoke });
    } finally { rmSync(root, { recursive:true }); }
  }
  const header = '| 包 | 状态 | 五段表位置 | 证据 | 未决 |\n| --- | --- | --- | --- | --- |\n';
  it('names the package not marked 已收敛 and exits non-zero', () => statusFixture(header + '| 1 controlled | 未收敛 | details§1 | ev-1 | 待你定 |\n| 2 second | 已收敛 | details§2 | ev-2 | 无 |\n', ({ invoke }) => {
    const result = invoke(true);
    expect(result.status).not.toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.convergence.gaps).toContain('未收敛：1 controlled');
    expect(report.convergence.complete).toBe(false);
    const text = invoke(false);
    expect(text.status).not.toBe(0);
    expect(text.stdout).toContain('未收敛：1 controlled');
    expect(text.stdout).not.toContain('格式未判');
  }));
  it('names a five-column package with an empty state and exits non-zero', () => statusFixture(header + '| 1 controlled |  | details§1 | ev-1 | 待你定 |\n| 2 second | 已收敛 | details§2 | ev-2 | 无 |\n', ({ invoke }) => {
    const result = invoke(true);
    expect(result.status).not.toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.convergence.gaps).toContain('未收敛：1 controlled');
    expect(report.convergence.complete).toBe(false);
    const text = invoke(false);
    expect(text.status).not.toBe(0);
    expect(text.stdout).toContain('未收敛：1 controlled');
  }));
  it('exits 0 when every five-column package is 已收敛', () => statusFixture(header + '| 1 controlled | 已收敛 | details§1 | ev-1 | 无 |\n| 2 second | 已收敛 | details§2 | ev-2 | 无 |\n', ({ invoke }) => {
    const result = invoke(true);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.convergence.gaps).toEqual([]);
    expect(report.convergence.complete).toBe(true);
  }));
});

describe('ten-column status table names unconverged packages', () => {
  const header = '| 包 | 目标 | 边界 | 方案与取舍 | 验收 | 风险 | 依赖 | 消费者 | 未决/无 | 状态 | 目标与成功意图 | 范围与旅程 | 数据与状态 | 成功失败验收 | 约束非目标与风险 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
  const withStatus = (line, state) => line.replace('| 已收敛 |\n', `| ${state} | 已答 | 已答 | 已答 | 已答 | 已答 |\n`);
  function tenColumnFixture(rows, check) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-ten-column-')));
    const task = join(root, 'task'), materials = join(root, 'materials');
    const ref = 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md';
    const put = (base, name, value) => { const path = join(base, name); mkdirSync(dirnameOf(path), { recursive: true }); writeFileSync(path, value); };
    const decision = '# Controlled\n## 级别与路线\n- 推荐级别：复杂\n' + firstDecision + secondDecision + `清单：\`${ref}\`\n`;
    const invoke = json => spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${resolve('.')}`, ...(json ? ['--json'] : [])], { encoding: 'utf8' });
    try {
      put(task, 'task.json', JSON.stringify({ schema_version:'1.0.0', task_id:'controlled', target_repo_root:resolve('.'), baseline_commit:'HEAD', activation_cohort:'post' }));
      put(task, 'facts.jsonl', ''); put(materials, 'phases/index.md', '# Index\n');
      put(materials, 'decision-log.md', decision); put(task, ref, rows);
      put(task, 'quality/evidence/decision-log-refs/controlled-module-details.md', detailsBody);
      check({ invoke });
    } finally { rmSync(root, { recursive:true, force:true }); }
  }
  it('names an unconverged ten-column package and exits non-zero', () => tenColumnFixture(header + withStatus(validOne, '未收敛') + withStatus(validTwo, '已收敛'), ({ invoke }) => {
    const result = invoke(true);
    expect(result.status).not.toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.convergence.gaps).toContain('未收敛：1 controlled');
    expect(report.convergence.gaps).not.toContain('未收敛：2 second');
    expect(report.convergence.complete).toBe(false);
    const text = invoke(false);
    expect(text.status).not.toBe(0);
    expect(text.stdout).toContain('未收敛：1 controlled');
  }));
  it('names a ten-column package with an empty state and exits non-zero', () => tenColumnFixture(header + withStatus(validOne, '') + withStatus(validTwo, '已收敛'), ({ invoke }) => {
    const result = invoke(true);
    expect(result.status).not.toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.convergence.gaps).toContain('未收敛：1 controlled');
    expect(report.convergence.gaps).not.toContain('未收敛：2 second');
    expect(report.convergence.complete).toBe(false);
    const text = invoke(false);
    expect(text.status).not.toBe(0);
    expect(text.stdout).toContain('未收敛：1 controlled');
  }));
  it('exits 0 when every ten-column package is 已收敛', () => tenColumnFixture(header + withStatus(validOne, '已收敛') + withStatus(validTwo, '已收敛'), ({ invoke }) => {
    const result = invoke(true);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.convergence.gaps).toEqual([]);
    expect(report.convergence.complete).toBe(true);
  }));
});

// P1-TEXT-GUARD-START
function assertP1TextContract(methods, template) {
  const required=['缺失即未完成','跨包不合批','确认与推进分开问','少打扰不等于跳过步骤','`steps.json`','不在决策日志新增步骤节','问答原件开头写明批次类型','不证明完成','- 推荐级别：复杂','既有日志不回改'];
  for(const [stage,body] of Object.entries(methods)) {
    const lines=body.split(/\r?\n/).filter(line=>line.startsWith('执行纪律：'));
    if(lines.length!==1)throw Error(`discipline:${stage}`);
    for(const text of required)if(!lines[0].includes(text))throw Error(`discipline:${stage}:${text}`);
    if(!lines[0].includes(`node tools/cli/check-stage-steps.mjs --stage=${stage} --task-path=<任务目录>`))throw Error(`command:${stage}`);
    if(stage==='make-decision'&&!['第9步逐包收敛','更新8项证据指针与包状态','第10步细节审查前','有未收敛包就停在细节审查前','5 列状态表点名未收敛包并以非 0 退出'].every(text=>lines[0].includes(text)))throw Error('make-decision:advance');
  }
  const pointer=template.split(/\r?\n/).filter(line=>line.includes('步骤证据清单指针'));
  if(pointer.length!==1||!pointer[0].startsWith('步骤证据清单指针：'))throw Error('template:pointer');
  const map=/^## 大纲地图\s*\n([\s\S]*?)(?=^## )/m.exec(template)?.[1];
  if(!map)throw Error('template:map');
  const entries=map.split(/\r?\n/).filter(line=>line.startsWith('- ')).map(line=>line.slice(2));
  const headings=[...template.matchAll(/^## (.+)$/gm)].map(match=>match[1]).filter(title=>title!=='大纲地图');
  if(JSON.stringify(entries)!==JSON.stringify(headings))throw Error('template:directory');
}
// P1-TEXT-GUARD-END

describe('P1 execution discipline text contract', () => {
  const methods=Object.fromEntries(['make-decision','build-plan','build-code'].map(stage=>[stage,readFileSync(resolve(`workflows/${stage}/SKILL.md`),'utf8')]));
  const template=readFileSync(resolve('skills/decision-log/templates/decision-log-template.md'),'utf8');
  it('reads the real three methods and the single table-external template pointer', () => {
    expect(()=>assertP1TextContract(methods,template)).not.toThrow();
  });
  it('rejects each removed discipline and each wrong stage command', () => {
    for(const stage of Object.keys(methods)) {
      expect(()=>assertP1TextContract({...methods,[stage]:methods[stage].replace(/^执行纪律：.*$/m,'')},template)).toThrow(`discipline:${stage}`);
      expect(()=>assertP1TextContract({...methods,[stage]:methods[stage].replaceAll(`--stage=${stage}`, '--stage=wrong')},template)).toThrow(`command:${stage}`);
    }
  });
  it('rejects deleted, duplicated and directory-inserted template pointer', () => {
    const line=template.split('\n').find(value=>value.startsWith('步骤证据清单指针：'));
    expect(()=>assertP1TextContract(methods,template.replace(line,''))).toThrow('template:pointer');
    expect(()=>assertP1TextContract(methods,template+'\n'+line)).toThrow('template:pointer');
    expect(()=>assertP1TextContract(methods,template.replace('- 任务身份','- 步骤证据清单指针\n- 任务身份'))).toThrow();
  });
});

describe('U-025 step-consumer declaration coverage', () => {
  const canonical=readFileSync(resolve('workflows/make-decision/step-consumer-design.md'),'utf8');
  const steps=JSON.parse(readFileSync(resolve('workflows/make-decision/steps.json'),'utf8')).steps;
  it('covers every current stage step_slug in the canonical declaration', () => {
    expect(canonical).toContain('来源 N9');
    expect(canonical).toContain('按当前 steps.json 复核');
    expect(canonical).toContain('覆盖全部 76 步');
    expect(canonical).toContain('任务开工时复制到材料根');
    const declared=new Set(canonical.split(/\r?\n/).filter(line=>line.startsWith('| [')).map(line=>{
      const source=line.match(/((?:workflows)\/[^#>]+)#/)?.[1];
      const slug=line.match(/\]\([^)]*\)\s*`([^`]+)`/)?.[1];
      return source&&slug?`${source}\0${slug}`:null;
    }).filter(Boolean));
    expect(declared.size).toBe(76);
    const manifests=[
      ['workflows/make-decision/steps.json',15],
      ['workflows/make-decision/flows/small/steps.json',9],
      ['workflows/make-decision/flows/normal/steps.json',11],
      ['workflows/make-decision/flows/planning/steps.json',11],
      ['workflows/build-plan/steps.json',12],
      ['workflows/build-code/steps.json',12],
      ['workflows/build-prd/steps.json',6],
    ];
    let total=0;
    for(const [source,count] of manifests){
      const manifest=JSON.parse(readFileSync(resolve(source),'utf8')).steps;
      expect(manifest).toHaveLength(count);
      total+=manifest.length;
      for(const step of manifest) expect(declared.has(`${source}\0${step.step_slug}`),`${source} ${step.step_slug}`).toBe(true);
    }
    expect(total).toBe(76);
    expect(steps).toHaveLength(15);
  });
});

describe('current module reference compatibility', () => {
  it('reads bold WP headings and includes this modules D consumer declarations', () => convergenceFixture(({materials,decision,task,ref,put,invoke}) => {
    put(materials,'decision-log.md',decision.replace('#### WP2 — second','**WP2 — second**').replace('- **风险**：缺证据误报。','- **风险**：缺证据误报。\n- **改动**：只读；消费者：specific reader、WP2。'));
    put(task,ref,validOne.replace('controlled consumer','specific reader、WP2').replace('| 无 |','| 全部包 |')+validTwo);
    expect(invoke().modules[0].fields.map(f=>f.present)).toEqual(Array(8).fill(true));
    expect(invoke().convergence.complete).toBe(true);
  }));
  it('normalizes explicit consumer list punctuation without matching fragments', () => convergenceFixture(({materials,decision,task,ref,put,invoke}) => {
    put(materials,'decision-log.md',decision.replace('- **风险**：缺证据误报。','- **风险**：缺证据误报。\n- **改动**：只读；消费者为执行阶段与 WP2。'));
    put(task,ref,validOne.replace('controlled consumer','WP2、执行阶段')+validTwo);
    expect(invoke().modules[0].fields[6].present).toBe(true);
    put(task,ref,validOne.replace('controlled consumer','WP2、执行')+validTwo);
    expect(invoke().modules[0].fields[6].present).toBe(false);
  }));
  it('validates every abbreviated range endpoint', () => convergenceFixture(({task,ref,put,invoke}) => {
    put(task,ref,validOne.replace('| 无 |','| WP1～2 |')+validTwo);
    expect(invoke().modules[0].fields[5].present).toBe(true);
    put(task,ref,validOne.replace('| 无 |','| WP1～99 |')+validTwo);
    expect(invoke().modules[0].fields[5].present).toBe(false);
  }));
  it('does not let explicit none or exact consumer prose bypass a bad mixed reference', () => convergenceFixture(({materials,decision,task,ref,put,invoke}) => {
    put(materials,'decision-log.md',decision.replace('controlled consumer','controlled consumer details§99'));
    put(task,ref,validOne.replace('| 无 |','| 无（details§99） |').replace('controlled consumer','controlled consumer details§99')+validTwo);
    const fields=invoke().modules[0].fields;
    expect(fields[5].present).toBe(false); expect(fields[6].present).toBe(false);
    put(materials,'decision-log.md',decision.replace('controlled consumer','controlled consumer AC-99'));
    put(task,ref,validOne.replace('controlled consumer','controlled consumer AC-99')+validTwo);
    expect(invoke().modules[0].fields[6].present).toBe(false);
  }));
});

describe('module range admission before expansion', () => {
  it('keeps both modules when an invalid range cannot be represented by the authority', () => convergenceFixture(({task,ref,put,invoke}) => {
    // Both lengths throw immediately in the old Array.from path; no large valid allocation.
    for(const dependency of ['WP1～4294967296','WP1～9007199254740992']) {
      put(task,ref,validOne.replace('| 无 |',`| ${dependency} |`)+validTwo);
      const report=invoke();
      expect(report.modules).toHaveLength(2);
      expect(report.modules[0].fields[5]).toMatchObject({reference:dependency,present:false});
      expect(report.modules[1].fields.every(field=>field.present)).toBe(true);
      expect(report.convergence.complete).toBe(false);
    }
  }));
});

describe('current-shape 工作包 N / 决定 N mapping', () => {
  function currentShapeFixture(check) {
    return convergenceFixture(({ task, materials, ref, put, invoke }) => {
      const mapping = '## 旧编号对照\n| 正文编号 | 旧编号 | 说明 |\n| --- | --- | --- |\n| 工作包 1 | WP1 | controlled |\n| 决定 1 | D-001 | controlled |\n';
      const decision = `# Controlled\n- 推荐级别：复杂\n### 工作包 1：controlled\n- **要交付什么**：受控结果；消费者是 controlled consumer。\n#### 决定 1：controlled decision\n- **做什么**：读取受控原件并报告缺口。\n- **不做什么**：不写运行时。\n- **风险**：缺证据误报。\n| AC-01 | 受控结果可回读 | 目标内容明确 |\n| OI-001 | 待独立核对 | owner：受控维护者 |\n细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`\n${mapping}\n清单：\`${ref}\`\n`;
      put(materials, 'decision-log.md', decision);
      const row = validOne.replaceAll('D-001', '决定 1');
      check({ task, materials, ref, put, invoke, decision, row });
    });
  }
  it('maps 工作包 1 and 决定 1 through 旧编号对照 and resolves all eight fields', () => currentShapeFixture(({ task, ref, put, invoke, row }) => {
    put(task, ref, row);
    const report = invoke();
    expect(report.errors).toEqual([]);
    expect(report.convergence.complete).toBe(true);
    expect(report.modules.map(module => module.fields.map(field => field.present))).toEqual([Array(8).fill(true)]);
  }));
  it('reports a missing 决定 1 mapping instead of silently skipping the field', () => currentShapeFixture(({ task, materials, ref, put, invoke, row, decision }) => {
    put(task, ref, row);
    // Rewrite without the decision row. The fixture's check callback owns the
    // material root, so the decision is re-put here with the same checklist.
    const withoutDecision = decision.replace('| 决定 1 | D-001 | controlled |\n', '');
    put(materials, 'decision-log.md', withoutDecision);
    const report = invoke();
    expect(report.errors.join('\n')).toContain('决定 1');
    expect(report.convergence.gaps).toContain('决定 1 未取得旧编号映射或正文');
    expect(report.convergence.complete).toBe(false);
  }));
  it('recognizes 工作包 1 without a mapping row instead of treating the module set as empty', () => currentShapeFixture(({ task, materials, ref, put, invoke, row, decision }) => {
    put(task, ref, row);
    const withoutPackage = decision.replace('| 工作包 1 | WP1 | controlled |\n', '');
    put(materials, 'decision-log.md', withoutPackage);
    const report = invoke();
    expect(report.errors.join('\n')).not.toContain('未取得 WP 旧编号映射');
    expect(report.convergence.expected_modules).toEqual(['1']);
    expect(report.convergence.complete).toBe(true);
  }));
  it('keeps an explicit mapping when it names a different WP id', () => currentShapeFixture(({ task, materials, ref, put, invoke, row, decision }) => {
    put(task, ref, row.replace('| 1 controlled |', '| 7 controlled |'));
    put(materials, 'decision-log.md', decision.replace('| 工作包 1 | WP1 | controlled |', '| 工作包 1 | WP7 | controlled |'));
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual(['7']);
    expect(report.convergence.complete).toBe(true);
  }));
});

describe('WPn package table behavior', () => {
  it('keeps the archived WPn fields unchanged', () => convergenceFixture(({ invoke }) => {
    const report = invoke();
    expect(report.convergence).toEqual({
      source: 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md',
      expected_modules: ['1', '2'],
      complete: true,
      gaps: [],
    });
    expect(report.modules.map(module => [module.name, module.state, module.fields.map(field => field.present)])).toEqual([
      ['1 controlled', '已收敛', Array(8).fill(true)],
      ['2 second', '已收敛', Array(8).fill(true)],
    ]);
    expect(report.level).toBe('- 推荐级别：复杂');
    expect(report.errors).toEqual([]);
  }));
  it('reads the hyphenated WP-n heading form', () => convergenceFixture(({ task, materials, ref, put, invoke }) => {
    const decision = `# Controlled\n- 推荐级别：复杂\n#### WP-3 — controlled\n- **结果与消费者**：受控结果；消费者是 controlled consumer。\n#### D-001 — controlled decision\n- **做什么**：读取受控原件并报告缺口。\n- **不做什么**：不写运行时。\n- **风险**：缺证据误报。\n| AC-01 | 受控结果可回读 | 目标内容明确 |\n| OI-001 | 待独立核对 | owner：受控维护者 |\n细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`\n清单：\`${ref}\`\n`;
    put(materials, 'decision-log.md', decision);
    put(task, ref, validOne.replace('| 1 controlled |', '| 3 controlled |'));
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual(['3']);
    expect(report.convergence.complete).toBe(true);
  }));
});

describe('Chinese-numbered 工作包 package table', () => {
  function chinesePackageFixture(heading, row, check) {
    return convergenceFixture(({ task, materials, ref, put, invoke }) => {
      const decision = `# Controlled\n- 推荐级别：复杂\n${heading}\n- **要交付什么**：受控结果；消费者是 controlled consumer。\n#### D-001 — controlled decision\n- **做什么**：读取受控原件并报告缺口。\n- **不做什么**：不写运行时。\n- **风险**：缺证据误报。\n| AC-01 | 受控结果可回读 | 目标内容明确 |\n| OI-001 | 待独立核对 | owner：受控维护者 |\n细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`\n清单：\`${ref}\`\n`;
      put(materials, 'decision-log.md', decision);
      put(task, ref, row);
      check({ task, materials, ref, put, invoke, decision });
    });
  }
  const rowFor = id => validOne.replace('| 1 controlled |', `| ${id} controlled |`);
  it.each([
    ['Arabic', '### 工作包 1 — controlled', '1'],
    ['circled one', '### 工作包 ① — controlled', '1'],
    ['circled ten', '### 工作包 ⑩ — controlled', '10'],
    ['Chinese one', '### 工作包 一 — controlled', '1'],
    ['Chinese ten', '### 工作包 十 — controlled', '10'],
    ['full-width parentheses', '### 工作包（1）— controlled', '1'],
    ['full-width parentheses Chinese', '### 工作包（一）— controlled', '1'],
    ['ASCII parentheses circled', '### 工作包(②) — controlled', '2'],
    ['colon separator', '### 工作包 3：controlled', '3'],
    ['bare', '### 工作包 4', '4'],
    ['bold', '**工作包 5 — controlled**', '5'],
  ])('reads %s heading as a package', (_label, heading, id) => chinesePackageFixture(heading, rowFor(id), ({ invoke }) => {
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual([id]);
    expect(report.convergence.complete).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.modules.map(module => module.fields.map(field => field.present))).toEqual([Array(8).fill(true)]);
  }));
  it('mixes WPn and Chinese headings without double counting', () => convergenceFixture(({ task, materials, ref, put, invoke }) => {
    const decision = `# Controlled\n- 推荐级别：复杂\n#### WP1 — controlled\n- **结果与消费者**：受控结果；消费者是 controlled consumer。\n#### D-001 — controlled decision\n- **做什么**：读取受控原件并报告缺口。\n- **不做什么**：不写运行时。\n- **风险**：缺证据误报。\n| AC-01 | 受控结果可回读 | 目标内容明确 |\n| OI-001 | 待独立核对 | owner：受控维护者 |\n### 工作包 2 — second\n- **结果与消费者**：受控第二结果；消费者是 WP1。\n#### D-002 — second decision\n- **做什么**：准备第二输入。\n- **不做什么**：不变更第一输入。\n- **风险**：输入缺失。\n细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`\n清单：\`${ref}\`\n`;
    put(materials, 'decision-log.md', decision);
    put(task, ref, validOne + validTwo);
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual(['1', '2']);
    expect(report.convergence.complete).toBe(true);
    expect(report.modules.map(module => module.name)).toEqual(['1 controlled', '2 second']);
  }));
  it('does not count the same package twice when both forms name it', () => convergenceFixture(({ materials, decision, put, invoke }) => {
    put(materials, 'decision-log.md', decision.replace('#### WP2 — second', '#### WP2 — second\n### 工作包 2 — duplicate'));
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual(['1', '2']);
    expect(report.errors.join('\n')).not.toContain('权威模块集合未取得或重复');
  }));
  it('still reports duplicate Chinese package headings as an unusable package set', () => chinesePackageFixture('### 工作包 1 — controlled', rowFor('1'), ({ materials, put, invoke, decision }) => {
    put(materials, 'decision-log.md', decision.replace('### 工作包 1 — controlled', '### 工作包 1 — controlled\n### 工作包 1 — duplicate'));
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual(['1', '1']);
    expect(report.convergence.gaps).toContain('权威模块集合未取得或重复');
    expect(report.errors.join('\n')).toContain('decision-log.md: 权威模块集合未取得或重复');
  }));
  it('does not treat prose or mapping-table rows as package headings', () => convergenceFixture(({ materials, decision, put, invoke }) => {
    put(materials, 'decision-log.md', decision.replace('#### WP1 — controlled', '### 结果 — controlled').replace('#### WP2 — second', '### 第二结果 — second') + '\n正文提到 工作包 1 — 旧映射见附录。\n\n| 工作包 1 | WP1 | controlled |\n');
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual([]);
    expect(report.convergence.gaps).toContain('权威模块集合未取得或重复');
  }));
  it('still requires a package table when neither form exists', () => convergenceFixture(({ materials, decision, put, invoke }) => {
    put(materials, 'decision-log.md', decision.replace('#### WP1 — controlled', '### 结果 — controlled').replace('#### WP2 — second', '### 第二结果 — second'));
    const report = invoke();
    expect(report.convergence.expected_modules).toEqual([]);
    expect(report.convergence.complete).toBe(false);
    expect(report.errors.join('\n')).toContain('decision-log.md: 权威模块集合未取得或重复');
  }));
});

// A readable original is a trace fact, not a completion verdict. Completion is
// only the existing final-chain producer's completed state; these cases keep
// the two layers separate without adding a new state or progress object.
describe('declared originals are trace only', () => {
  function traceCase({ evidence, material = '# Controlled\n', files = [], facts = '' }) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-trace-')));
    const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
    const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(root, 'materials');
    try {
      put(repo, 'workflows/make-decision/SKILL.md', '# Controlled\n## 方法\nOwned observation.\n');
      put(repo, 'workflows/make-decision/steps.json', { schema_version: '2.0.0', stage_slug: 'make-decision', steps: [{ step_id: 1, step_slug: 'case-step', observable_result: 'Controlled. 判定消费：workflows/make-decision/SKILL.md#方法；原件：controlled original', completion_evidence: evidence }] });
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'trace-case', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
      put(task, 'facts.jsonl', facts);
      put(materials, 'decision-log.md', material);
      put(materials, 'step-consumer-design.md', '| [controlled](../../workflows/make-decision/steps.json#L1) `case-step` | observation | human | owner |');
      for (const [path, value] of files) put(task, path, value);
      const report = checker.runStageStepsCheck({ taskPath: task, materialRoot: materials, repoRoot: repo, stage: 'make-decision' });
      return report.stages[0].steps[0];
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  const facts = { kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' };
  const human = { source: 'workflows/make-decision/steps.json', step_slug: 'case-step', reader: 'controlled independent reader', inputs: ['owned observation'], observation: 'Read the named controlled observation.', criteria_ref: 'workflows/make-decision/SKILL.md#方法', conclusion: 'completed', limits: [] };
  const humanFacts = JSON.stringify({ record_kind: 'stage', task_id: 'trace-case', stage: 'make-decision', source: 'controlled', evidence: { value: [{ ref: 'quality/evidence/case.json', source: 'workflows/make-decision/steps.json', step_slug: 'case-step' }] } }) + '\n';

  it('a readable original is 已留痕/unavailable, never completed', () => {
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n真实记录。\n' })).toMatchObject({ judgment: '已留痕', state: 'unavailable' });
  });
  it('a self-report without the declared original is 未留痕', () => {
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n本步已完成。\n', facts: JSON.stringify({ record_kind: 'stage', task_id: 'trace-case', stage: 'make-decision', source: 'self report', note: '已完成' }) + '\n' })).toMatchObject({ judgment: '未留痕' });
  });
  it('an empty-shell section is 未留痕', () => {
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n   \n' })).toMatchObject({ judgment: '未留痕' });
  });
  it('an unrelated research file is trace only', () => {
    expect(traceCase({ evidence: [{ kind: 'research_report', uri_or_path: 'quality/evidence/research/' }, facts], files: [['quality/evidence/research/other-topic.json', { topic: 'unrelated' }]] })).toMatchObject({ judgment: '已留痕', state: 'unavailable' });
  });
  it('a stored user reply is trace only', () => {
    expect(traceCase({ evidence: [{ kind: 'human_confirmation', uri_or_path: 'quality/evidence/human-confirmations/' }, facts], files: [['quality/evidence/human-confirmations/reply.json', { stage: 'make-decision', decision: 'approved', reply: '好' }]] })).toMatchObject({ judgment: '已留痕', state: 'unavailable' });
  });
  it('an old direction review is trace only', () => {
    expect(traceCase({ evidence: [{ kind: 'review', uri_or_path: 'quality/reviews/' }, facts], files: [['quality/reviews/direction.json', { stage: 'make-decision', review_track: 'direction', status: 'available' }]] })).toMatchObject({ judgment: '已留痕', state: 'unavailable' });
  });
  function stageScopeCase(material) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-scope-')));
    const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
    const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(root, 'materials');
    try {
      put(repo, 'workflows/make-decision/SKILL.md', '# C\n## 方法\nOwned.\n');
      put(repo, 'workflows/build-code/SKILL.md', '# C\n## 方法\nOwned.\n');
      const manifest = (stage, slug) => ({ schema_version: '2.0.0', stage_slug: stage, steps: [{ step_id: 1, step_slug: slug, observable_result: `Controlled. 判定消费：workflows/${stage}/SKILL.md#方法；原件：decision-log.md#级别与路线`, completion_evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, { kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }] }] });
      put(repo, 'workflows/make-decision/steps.json', manifest('make-decision', 'case-step'));
      put(repo, 'workflows/build-code/steps.json', manifest('build-code', 'first'));
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'scope-case', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(materials, 'decision-log.md', material);
      put(materials, 'step-consumer-design.md', '| [make](x) `case-step` | observation | human | owner |\n| [build](x) `first` | observation | human | owner |\n');
      return checker.runStageStepsCheck({ taskPath: task, materialRoot: materials, repoRoot: repo });
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  it('scopes a numeric invalidation to its named stage and leaves another stage alone', () => {
    const report = stageScopeCase('# C\n## 级别与路线\n- 推荐级别：复杂\n- 失效步骤：1；阶段：make-decision\n');
    expect(report.stages.find(stage => stage.stage === 'make-decision').steps[0]).toMatchObject({ judgment: '待重做', state: 'incomplete' });
    expect(report.stages.find(stage => stage.stage === 'build-code').steps[0].judgment).not.toBe('待重做');
  });
  it('reports an unknown invalidated slug instead of silently ignoring it', () => {
    const report = stageScopeCase('# C\n## 级别与路线\n- 推荐级别：复杂\n- 失效步骤：no-such-step；阶段：make-decision\n');
    expect(report.errors.join('\n')).toContain('未匹配当前阶段步骤表');
    expect(report.limits.join('\n')).toContain('未知失效范围未判');
    expect(report.stages.find(stage => stage.stage === 'make-decision').steps[0].judgment).not.toBe('待重做');
  });
  it('does not apply an invalidation without a recognizable stage', () => {
    const report = stageScopeCase('# C\n## 级别与路线\n- 推荐级别：复杂\n- 失效步骤：1\n');
    expect(report.errors.join('\n')).toContain('未写可识别阶段');
    expect(report.stages.find(stage => stage.stage === 'make-decision').steps[0].judgment).not.toBe('待重做');
  });
  function levelCase(material) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-level-')));
    const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
    const task = join(root, 'task'), materials = join(root, 'materials');
    try {
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'level-case', baseline_commit: 'HEAD', target_repo_root: resolve('.'), activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(materials, 'decision-log.md', material);
      return checker.runStageStepsCheck({ taskPath: task, materialRoot: materials, repoRoot: resolve('.'), stage: 'make-decision' });
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  it('does not pick the first or last recommendation when the authority section conflicts', () => {
    const report = levelCase('# C\n## 级别与路线\n- 推荐级别：轻档\n- 推荐级别：复杂\n');
    expect(report.stages[0].definition).toBe('unavailable');
    expect(report.errors.join('\n')).toContain('多个不同推荐');
  });
  it('does not trust a fenced-only declaration when no current choice exists outside fences', () => {
    const report = levelCase('# C\n## 级别与路线\n```\n- 用户选择：轻档\n```\n');
    expect(report.stages[0].source).toBe('workflows/make-decision/steps.json');
  });
  it('ignores a fenced level example and uses the single current recommendation', () => {
    const report = levelCase('# C\n## 级别与路线\n```\n- 推荐级别：轻档\n```\n- 推荐级别：复杂\n');
    expect(report.stages[0].source).toBe('workflows/make-decision/steps.json');
    expect(report.level).toBe('- 推荐级别：复杂');
  });
  it('uses the existing 小改动 level name for the light flow', () => {
    const report = levelCase('# C\n## 级别与路线\n- 推荐级别：小改动\n');
    expect(report.stages[0].source).toContain('/flows/small/');
    expect(report.stages[0].steps).toHaveLength(9);
  });
  it('keeps the complex fallback when no level is recorded', () => {
    const report = levelCase('# C\n');
    expect(report.stages[0].source).toBe('workflows/make-decision/steps.json');
    expect(report.level).toContain('未读到级别事实');
  });
  it('does not treat a 级别与路线历史 heading as the current section', () => {
    const report = levelCase('# C\n## 级别与路线历史\n- 推荐级别：轻档\n');
    expect(report.stages[0].source).toBe('workflows/make-decision/steps.json');
  });
  it('reports conflicting user choices as unjudged', () => {
    const report = levelCase('# C\n## 级别与路线\n- 推荐级别：复杂\n- 用户选择：轻档\n- 用户选择：复杂\n');
    expect(report.stages[0].definition).toBe('unavailable');
    expect(report.errors.join('\n')).toContain('多个不同用户选择');
  });
  function sharedTraceCase() {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-shared-')));
    const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
    const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(root, 'materials');
    try {
      put(repo, 'workflows/make-decision/SKILL.md', '# C\n## 方法\nOwned.\n');
      const evidence = [{ kind: 'review', uri_or_path: 'quality/reviews/' }, { kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }];
      put(repo, 'workflows/make-decision/steps.json', { schema_version: '2.0.0', stage_slug: 'make-decision', steps: [
        { step_id: 1, step_slug: 'first', observable_result: 'Controlled. 判定消费：workflows/make-decision/SKILL.md#方法；原件：quality/reviews/', completion_evidence: evidence },
        { step_id: 2, step_slug: 'second', observable_result: 'Controlled. 判定消费：workflows/make-decision/SKILL.md#方法；原件：quality/reviews/', completion_evidence: evidence },
      ] });
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'shared-case', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(task, 'quality/reviews/one.json', { stage: 'make-decision', status: 'available' });
      put(materials, 'decision-log.md', '# C\n## 级别与路线\n- 推荐级别：复杂\n');
      put(materials, 'step-consumer-design.md', '| [x](x) `first` | observation | human | owner |\n| [x](x) `second` | observation | human | owner |\n');
      return checker.runStageStepsCheck({ taskPath: task, materialRoot: materials, repoRoot: repo, stage: 'make-decision' }).stages[0].steps;
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  it('labels a shared directory as generic trace rather than step-specific evidence', () => {
    const steps = sharedTraceCase();
    expect(steps).toHaveLength(2);
    for (const step of steps) {
      expect(step.judgment).toBe('已留痕');
      expect(step.evidence[0].reason).toContain('多步共用');
      expect(step.gap).toContain('共用目录/文件');
    }
  });
  it('keeps a producer completed row complete when its declared physical piece is missing', () => {
    const row = traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n', files: [['quality/evidence/case.json', human]], facts: humanFacts });
    expect(row).toMatchObject({ judgment: '已完成', state: 'completed' });
    expect(row.gap).toContain('声明原件未取得');
  });
  it('a historical-looking heading is not the declared section', () => {
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线历史\n旧方向\n' })).toMatchObject({ judgment: '未留痕' });
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线（历史）\n旧方向\n' })).toMatchObject({ judgment: '未留痕' });
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线：走哪条路线？\n真实记录。\n' })).toMatchObject({ judgment: '已留痕' });
  });
  it('only the existing producer can establish completed', () => {
    expect(traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n真实记录。\n', files: [['quality/evidence/case.json', human]], facts: humanFacts })).toMatchObject({ judgment: '已完成', state: 'completed' });
  });
  it('reads numeric and multiple invalidation lines', () => {
    const numeric = traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n真实记录。\n- 失效步骤：1；阶段：make-decision\n', files: [['quality/evidence/case.json', human]], facts: humanFacts });
    expect(numeric).toMatchObject({ judgment: '待重做', state: 'incomplete' });
    const ranged = traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n真实记录。\n- 失效步骤：1～2；阶段：make-decision\n', files: [['quality/evidence/case.json', human]], facts: humanFacts });
    expect(ranged).toMatchObject({ judgment: '待重做', state: 'incomplete' });
    const multiple = traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n真实记录。\n- 失效步骤：other-step；阶段：make-decision\n- 失效步骤：case-step；阶段：make-decision\n', files: [['quality/evidence/case.json', human]], facts: humanFacts });
    expect(multiple).toMatchObject({ judgment: '待重做', state: 'incomplete' });
  });
  it('an invalidated step cannot stay completed from old producer facts', () => {
    const row = traceCase({ evidence: [{ kind: 'decision_log_section', uri_or_path: 'decision-log.md#级别与路线' }, facts], material: '# C\n## 级别与路线\n真实记录。\n- 失效步骤：case-step；阶段：make-decision\n', files: [['quality/evidence/case.json', human]], facts: humanFacts });
    expect(row).toMatchObject({ judgment: '待重做', state: 'incomplete' });
  });
});

describe('AC token boundaries, ranges and D-001 field scope', () => {
  function acField(ac, acRows, fullReport = false) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-ac-')));
    const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
    const task = join(root, 'task'), materials = join(root, 'materials');
    try {
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'ac-case', baseline_commit: 'HEAD', target_repo_root: root, activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(materials, 'decision-log.md', ['# C', '', '## 级别与路线', '- 推荐级别：复杂', '', '## 工作包与决定', '', '#### WP1 — controlled', '- **结果与消费者**：受控结果；消费者是 controlled consumer。', '', '#### D-001 — controlled decision', '- **做什么**：读取受控原件并报告缺口。', '- **不做什么**：不写运行时。', '- **风险**：缺证据误报。', '', ...acRows.map(row => `| ${row} | 受控结果可回读 | 目标内容明确 |`), '| OI-001 | 待独立核对 | owner：受控维护者 |', '', '## 旧编号对照', '| 决定 1 | D-001 |', '', '细化：`quality/evidence/decision-log-refs/module-details.md`', '清单：`quality/evidence/decision-log-refs/convergence-checklist.md`', ''].join('\n'));
      put(task, 'quality/evidence/decision-log-refs/module-details.md', '# Details\n## 1 module\nread only.\n');
      put(task, 'quality/evidence/decision-log-refs/convergence-checklist.md', `| 1 controlled | D-001 做什么 | D-001 不做什么 | D-001＋details§1 | ${ac} | D-001 风险 | 无 | controlled consumer | OI-001 | 已收敛 |\n`);
      const report = checker.runStageStepsCheck({ taskPath: task, materialRoot: materials, repoRoot: resolve('.'), stage: 'make-decision' });
      return fullReport ? report : report.modules[0]?.fields.find(field => field.name === '验收')?.present;
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  it.each([['AC-01', ['AC-01']], ['AC-C06-1', ['AC-C06-1']], ['AC-D01', ['AC-D01']]])('accepts legal %s', (ac, rows) => expect(acField(ac, rows)).toBe(true));
  it.each([['AC-C06-1-junk', ['AC-C06-1']], ['AC-C06', ['AC-C06-1']], ['AC-C06-1～3 with one row', ['AC-C06-1']]])('rejects %s instead of truncating', (ac, rows) => expect(acField(ac, rows)).toBe(false));
  it('expands a full range only when every endpoint row exists', () => {
    expect(acField('AC-C06-1～3', ['AC-C06-1', 'AC-C06-2', 'AC-C06-3'])).toBe(true);
    expect(acField('AC-C06-1～3', ['AC-C06-1', 'AC-C06-2'])).toBe(false);
  });
  it('a bare D-001 does not fill the acceptance field', () => {
    expect(acField('D-001', ['AC-C06-1'])).toBe(false);
    expect(acField('D-001＋AC-C06-1', ['AC-C06-1'])).toBe(true);
  });  it('supports AC-D01 numeric-suffix ranges and rejects left-adjacent tokens', () => {
    expect(acField('AC-D01～D03', ['AC-D01', 'AC-D02', 'AC-D03'])).toBe(true);
    expect(acField('XAC-01', ['AC-01'])).toBe(false);
    expect(acField('AC-C06-1＋AC-C06-1-junk', ['AC-C06-1'])).toBe(false);
  });
  it('rejects cross-prefix range ends and prefix-adjacent contamination', () => {
    expect(acField('AC-D01～AC-X03', ['AC-D01', 'AC-D02', 'AC-D03'])).toBe(false);
    expect(acField('AC-D01～AC-E03', ['AC-D01', 'AC-D02', 'AC-D03'])).toBe(false);
    expect(acField('AC-C07-010～AC-OTHER-011', ['AC-C07-010', 'AC-C07-011'])).toBe(false);
    expect(acField('AC-C07-010、prefixAC-C07-010', ['AC-C07-010'])).toBe(false);
    expect(acField('AC-C07-010～AC-C07-011', ['AC-C07-010', 'AC-C07-011'])).toBe(true);
    expect(acField('AC-C07-010', ['AC-C07-010'])).toBe(true);
    const report = acField('AC-D01～AC-X03', ['AC-D01', 'AC-D02', 'AC-D03'], true);
    expect(report.errors.join('\n')).toContain('AC-D01～AC-X03');
    expect(report.convergence.complete).toBe(false);
  });
  it('treats Chinese decision references with the same field boundary as D ids', () => {
    expect(acField('决定 1', ['AC-C06-1'])).toBe(false);
    expect(acField('决定 1＋AC-C06-1', ['AC-C06-1'])).toBe(true);
    expect(acField('决定 01＋AC-C06-1', ['AC-C06-1'])).toBe(true);
  });

});

describe('light route reads its declared step table', () => {
  it('uses flows/small/steps.json when the decision declares 轻档', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-light-')));
    const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
    const task = join(root, 'task'), materials = join(root, 'materials');
    try {
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'light-case', baseline_commit: 'HEAD', target_repo_root: root, activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(materials, 'decision-log.md', '# C\n## 级别与路线\n- 推荐级别：轻档\n');
      const report = checker.runStageStepsCheck({ taskPath: task, materialRoot: materials, repoRoot: resolve('.'), stage: 'make-decision' });
      expect(report.stages[0].source).toBe('workflows/make-decision/flows/small/steps.json');
      expect(report.stages[0].steps).toHaveLength(9);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});

// C06 P1/T001-T002 frozen oracle. The public seams are the checker CLI and the
// three workflow method/step contracts; expected values come from D-026/D-032,
// FR-C06-012 and AC-C06-7, not from the current implementation.
// DO NOT TOUCH in this prewrite task: checker, steps, SKILL, spec/Phase/index,
// final-chain-runner, task-store, run-checks, build-prd and every other test.
function p1CurrentCardFixture({ singleStep = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-current-card-')));
  const task = join(root, 'Projects/controlled/tasks/card-case');
  const repo = join(root, 'repo'), materials = join(repo, 'specs/card-case');
  const put = (base, path, value) => {
    const file = join(base, path);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
  };
  const stages = ['make-decision', 'build-plan', 'build-code'];
  for (const stage of stages) {
    put(repo, `workflows/${stage}/SKILL.md`, readFileSync(resolve(`workflows/${stage}/SKILL.md`), 'utf8'));
    put(repo, `workflows/${stage}/steps.json`, readFileSync(resolve(`workflows/${stage}/steps.json`), 'utf8'));
  }
  if (singleStep) {
    put(repo, 'workflows/make-decision/steps.json', {
      schema_version: '2.0.0', stage_slug: 'make-decision', steps: [{
        step_id: 1, step_slug: 'current-step',
        observable_result: 'Controlled current identity. 判定消费：SKILL.md#方法；原件：quality/evidence/steps/current.json',
        completion_evidence: [
          { kind: 'quality_evidence', uri_or_path: 'quality/evidence/steps/current.json' },
          { kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' },
        ],
      }],
    });
  }
  put(task, 'task.json', {
    schema_version: '1.0.0', project_name: 'controlled', task_id: 'card-case',
    baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post',
  });
  put(task, 'facts.jsonl', '');
  put(materials, 'decision-log.md', '# Controlled\n## 级别与路线\n- 推荐级别：复杂\n');
  put(materials, 'spec.md', '# Controlled current specification\n');
  put(materials, 'phases/index.md', '# Pure pointer index\n## Execution Index\n| 阶段 | 权威引用 |\n| --- | --- |\n| `P1` | `phases/P1-controlled.md` |\n');
  put(materials, 'phases/P1-controlled.md', '# Phase P1\n## L1\n### T001\nControlled current task.\n');
  const mappings = [];
  for (const stage of stages) {
    const manifest = JSON.parse(readFileSync(join(repo, `workflows/${stage}/steps.json`), 'utf8'));
    for (const step of manifest.steps) mappings.push(`| [controlled](../../workflows/${stage}/steps.json#L1) \`${step.step_slug}\` | observation | human | owner |`);
  }
  put(materials, 'step-consumer-design.md', mappings.join('\n'));
  // TCR-P1-001: enrich only fixture prerequisites. A successful skip now has
  // tracked Phase material and the real existing current cursor, not a label.
  for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Controlled fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Controlled current materials']]) {
    const git = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    if (git.status !== 0) throw Error(`fixture git setup failed: ${git.stderr}`);
  }
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim();
  const cursor = { record_kind: 'stage', task_id: 'card-case', stage: 'build-code', phase_progress: {
    phase_id: 'P1', task_id: 'T001', phases_head: head, base_head: head, recorded_at: new Date().toISOString(),
  } };
  put(task, 'facts.jsonl', JSON.stringify(cursor) + '\n');
  const invoke = args => {
    const result = spawnSync(process.execPath, [
      entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${repo}`, ...args, '--json',
    ], { cwd: repo, encoding: 'utf8' });
    return { ...result, report: JSON.parse(result.stdout) };
  };
  return { root, task, repo, materials, put, invoke, head, cursor };
}

describe('ORACLE-P1-CARD current step public CLI contract', () => {
  it.each([
    [5, 'outline-talk', true],
    [6, 'adversarial-direction-check', false],
    [8, 'module-breadth-confirm', true],
  ])('make-decision step %i projects only itself and prerequisites, with an executable card', (stepId, slug, needsReply) => {
    const fixture = p1CurrentCardFixture();
    try {
      const result = fixture.invoke(['--stage=make-decision', `--step=${stepId}`, '--card', '--phase=P1']);
      expect(result.status).toBe(0);
      expect(result.report.stages).toHaveLength(1);
      expect(result.report.stages[0].steps.map(step => step.step_id),
        '--step must not expand the whole stage').toEqual(Array.from({ length: stepId }, (_, index) => index + 1));
      const card = result.report.card;
      expect(card).toMatchObject({ stage: 'make-decision', step_id: stepId, step_slug: slug });
      for (const field of ['result', 'entry', 'stop', 'self_check']) {
        expect(card[field], `card.${field} must be readable`).toEqual(expect.any(String));
        expect(card[field].trim().length, `card.${field} must not be empty`).toBeGreaterThan(0);
      }
      expect(card.self_check).toContain(`--step=${stepId}`);
      expect(card.paths.length).toBeGreaterThan(0);
      expect(card.paths.length).toBeLessThanOrEqual(3);
      expect(card.evidence.length).toBeGreaterThan(0);
      expect(card.requires_user_reply).toBe(needsReply);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it.each(['build-plan', 'build-code'])('%s step 1 also projects a readable current card', (stage) => {
    const fixture = p1CurrentCardFixture();
    try {
      const result = fixture.invoke([`--stage=${stage}`, '--step=1', '--card', '--phase=P1']);
      expect(result.status).toBe(0);
      expect(result.report.card).toMatchObject({ stage, step_id: 1 });
      expect(result.report.stages[0].steps.map(step => step.step_id),
        '--step must not expand the whole stage').toEqual([1]);
      expect(result.report.card.paths.length).toBeGreaterThan(0);
      expect(result.report.card.paths.length).toBeLessThanOrEqual(3);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it('rejects identical artifact bytes whose identity belongs to an old run', () => {
    const fixture = p1CurrentCardFixture({ singleStep: true });
    try {
      const oldArtifact = {
        task_id: 'card-case', run_id: 'old-run', step_slug: 'current-step',
        artifact_sha: 'a'.repeat(64), created_at: '2026-11-01T00:00:00.000Z', observation: 'same bytes',
      };
      const oldBytes = JSON.stringify(oldArtifact);
      fixture.put(fixture.task, 'quality/evidence/steps/current.json', oldBytes);
      fixture.put(fixture.task, 'quality/evidence/steps/old-run-copy.json', oldBytes);
      expect(readFileSync(join(fixture.task, 'quality/evidence/steps/current.json'), 'utf8'))
        .toBe(readFileSync(join(fixture.task, 'quality/evidence/steps/old-run-copy.json'), 'utf8'));
      const oldRun = fixture.invoke(['--stage=make-decision', '--step=1', '--run-id=current-run']);
      expect(oldRun.status).toBe(0);
      expect(oldRun.report.stages[0].steps[0].judgment,
        'same bytes from old-run must not become current-run evidence').toBe('未留痕');
      expect(oldRun.report.stages[0].steps[0].evidence[0].present).toBe(false);
      expect(oldRun.report.stages[0].steps[0].evidence[0].reason).toContain('old-run');

      fixture.put(fixture.task, 'quality/evidence/steps/current.json', {
        ...oldArtifact, run_id: 'current-run', created_at: '2026-11-01T01:00:00.000Z',
      });
      const currentRun = fixture.invoke(['--stage=make-decision', '--step=1', '--run-id=current-run']);
      expect(currentRun.status).toBe(0);
      expect(currentRun.report.stages[0].steps[0].judgment).toBe('已留痕');
      expect(currentRun.report.stages[0].steps[0].evidence[0].present).toBe(true);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it('requires reason/owner/recovery for a skip and keeps its unresolved closeout gap incomplete at exit 0', () => {
    const fixture = p1CurrentCardFixture();
    const reason = '等待真实骨架答复';
    const owner = '阶段主会话';
    const recovery = '取得真实骨架答复后重跑第5步';
    try {
      const missingOwner = fixture.invoke([
        '--stage=make-decision', '--skip-with-gap=5', `--reason=${reason}`, `--recovery=${recovery}`,
        '--phase=P1', '--card',
      ]);
      expect(missingOwner.status).toBe(0);
      expect(missingOwner.report.errors.join('\n')).toMatch(/owner|负责人/);
      expect(missingOwner.report.card.step_id).toBe(5);
      expect(missingOwner.report.skip_gap).toBeNull();

      const skipped = fixture.invoke([
        '--stage=make-decision', '--skip-with-gap=5', `--reason=${reason}`, `--owner=${owner}`,
        `--recovery=${recovery}`, '--phase=P1', '--card',
      ]);
      expect(skipped.status).toBe(0);
      expect(skipped.report.card.step_id).toBe(5);
      expect(skipped.report.skip_next).toEqual({ step_id: 6, step_slug: 'adversarial-direction-check' });
      expect(skipped.report.skip_gap).toMatchObject({
        stage: 'make-decision', step_id: 5, step_slug: 'outline-talk', reason, owner, recovery, phase: 'P1',
      });
      const ref = skipped.report.skip_gap.evidence_ref;
      expect(ref).toMatch(/^quality\/evidence\//);
      const saved = JSON.parse(readFileSync(join(fixture.task, ref), 'utf8'));
      expect(saved).toMatchObject({
        task_id: 'card-case', stage: 'make-decision', step_id: 5, step_slug: 'outline-talk',
        reason, owner, recovery, phase: 'P1',
      });
      expect(saved.created_at).toEqual(expect.any(String));
      expect(skipped.report.closeout).toMatchObject({ state: 'incomplete' });
      expect(skipped.report.closeout.gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ step_id: 5, reason, owner, recovery }),
      ]));

      const closeoutReadback = fixture.invoke(['--stage=make-decision', '--step=6', '--card', '--phase=P1']);
      expect(closeoutReadback.status).toBe(0);
      expect(closeoutReadback.report.closeout.state,
        'an unresolved named skip must not be closed as completed').toBe('incomplete');
      expect(closeoutReadback.report.closeout.gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ step_id: 5, evidence_ref: ref }),
      ]));
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });
});

describe('ORACLE-P1-BASELINE material simplification and reading baseline', () => {
  it('removes the duplicate make-decision observable-result table while retaining steps.json as authority', () => {
    const skill = readFileSync(resolve('workflows/make-decision/SKILL.md'), 'utf8');
    const manifest = JSON.parse(readFileSync(resolve('workflows/make-decision/steps.json'), 'utf8'));
    expect(manifest.steps).toHaveLength(15);
    expect(skill).not.toContain('可核运行清单：以下15行投影本阶段步骤表');
    expect(skill).not.toContain('| step_slug | 完成判据（observable_result） |');
    for (const step of manifest.steps) expect(skill).not.toContain(`| \`${step.step_slug}\` |`);
  });

  it('binds each of the seven build-code fact steps to named step-specific originals, never facts-only or generic directories', () => {
    const manifest = JSON.parse(readFileSync(resolve('workflows/build-code/steps.json'), 'utf8'));
    const expected = new Map([
      [3, [/diff|commit/i]],
      [6, [/acceptance|ac[-_]|ui/i]],
      [7, [/diff[-_/]?scan|diff/i]],
      [10, [/acceptance[-_/]?trace|ac[-_/]?trace/i]],
      [11, [/spec[-_/]?analyze/i]],
      [12, [/handoff/i]],
    ]);
    const first = manifest.steps.find(step => step.step_id === 1);
    const firstNamed = (first.completion_evidence ?? []).filter(item =>
      item.uri_or_path && item.uri_or_path !== 'facts.jsonl' && item.uri_or_path !== './facts.jsonl' && !item.uri_or_path.endsWith('/'));
    expect(firstNamed.length, 'read-current-task-documents must not remain facts-only').toBeGreaterThan(0);
    expect(firstNamed.length).toBeLessThanOrEqual(3);
    for (const pattern of [/decision-log\.md/, /spec\.md/, /phases\/[^/]+\.md/]) {
      expect(firstNamed.some(item => pattern.test(item.uri_or_path)),
        `read-current-task-documents missing ${pattern}`).toBe(true);
    }
    for (const [stepId, patterns] of expected) {
      const step = manifest.steps.find(item => item.step_id === stepId);
      const named = (step.completion_evidence ?? []).filter(item =>
        item.uri_or_path && item.uri_or_path !== 'facts.jsonl' && item.uri_or_path !== './facts.jsonl' && !item.uri_or_path.endsWith('/'));
      expect(named.length, `${step.step_slug} must not remain facts-only or use a generic directory`).toBeGreaterThan(0);
      expect(named.length, `${step.step_slug} declares at most three original paths`).toBeLessThanOrEqual(3);
      for (const pattern of patterns) {
        expect(named.some(item => pattern.test(item.uri_or_path)), `${step.step_slug} missing ${pattern}`).toBe(true);
      }
    }
  });

  it('requires five raw before/after baseline readings in every main-stage method without an improvement claim', () => {
    for (const stage of ['make-decision', 'build-plan', 'build-code']) {
      const skill = readFileSync(resolve(`workflows/${stage}/SKILL.md`), 'utf8');
      const lines = skill.split(/\r?\n/).filter(line => line.startsWith('阅读基线：'));
      expect(lines, `${stage} needs one explicit reading-baseline contract`).toHaveLength(1);
      const line = lines[0] ?? '';
      for (const field of ['路径', '字节', '跳步', '返工', 'Phase 时长', '前后', '原始读数']) {
        expect(line, `${stage} baseline missing ${field}`).toContain(field);
      }
      expect(line).toMatch(/不宣称|只建立基线/);
      expect(line, `${stage} baseline must not claim a percentage improvement`).not.toMatch(/\d+(?:\.\d+)?\s*%/);
    }
  });
});

// TCR-P1-001 approved by original independent Spec reader, task original 026.
// Existing ORACLE-P1 assertions above remain unchanged.
describe('ORACLE-P1-CARD TCR-P1-001 current originals and unresolved gaps', () => {
  async function gapOriginal(f, identity = { phase: 'P1' }) {
    const { openTask } = await import('../../runtime/task/task-handle.mjs');
    const task = openTask(f.task, { projectName: 'controlled', taskId: 'card-case' });
    const gap = { task_id: 'card-case', stage: 'make-decision', step_id: 1, step_slug: 'current-step',
      reason: 'missing current input', owner: 'controlled owner', recovery: 'provide current input',
      created_at: '2026-01-01T00:00:00.000Z', ...identity };
    const path = await task.appendRecord({ dir: 'quality/evidence', slug: 'step-gap', ext: 'json', bytes: JSON.stringify(gap) });
    return { ...gap, evidence_ref: path.slice(f.task.length + 1) };
  }
  function completion(f, { phase = 'P1', invalidated = false } = {}) {
    const ref = 'quality/evidence/2026-11-02-099-current-observation.json';
    const source = 'workflows/make-decision/steps.json';
    const human = { task_id: 'card-case', source, step_slug: 'current-step', phase,
      reader: 'controlled independent reader', inputs: ['owned observation'], observation: 'Read current owned result.',
      criteria_ref: 'workflows/make-decision/SKILL.md#方法', conclusion: 'completed', limits: [],
      created_at: '2026-02-01T00:00:00.000Z' };
    f.put(f.repo, 'workflows/make-decision/SKILL.md', '# Controlled\n## 方法\nOwned observation.\n');
    f.put(f.materials, 'decision-log.md', '# Controlled\n## 级别与路线\n- 推荐级别：复杂\n' + (invalidated ? '- 失效步骤：current-step；阶段：make-decision\n' : ''));
    f.put(f.materials, 'step-consumer-design.md', '| [controlled](../../workflows/make-decision/steps.json#L1) `current-step` | observation | human | owner |');
    f.put(f.task, ref, human);
    f.put(f.task, 'facts.jsonl', [f.cursor, { record_kind: 'stage', task_id: 'card-case', stage: 'make-decision', source: 'controlled',
      evidence: { value: [{ ref, source, step_slug: 'current-step' }] } }].map(row => JSON.stringify(row)).join('\n') + '\n');
    return ref;
  }
  it.each([['--phase=P2', { phase: 'P1' }], ['--commit=new-sha', { commit: 'old-sha' }], ['--run-id=new-run', { run_id: 'old-run' }]])('keeps unresolved original visible after %s', async (flag, identity) => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      const gap = await gapOriginal(f, identity);
      const result = f.invoke(['--stage=make-decision', '--step=1', flag]);
      expect(result.status).toBe(0);
      expect(result.report.closeout).toMatchObject({ state: 'incomplete', gaps: [expect.objectContaining({ evidence_ref: gap.evidence_ref, owner: gap.owner, recovery: gap.recovery })] });
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each([['P0', false], ['P1', true]])('does not clear a current gap with producer completion phase=%s invalidated=%s', async (phase, invalidated) => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      const gap = await gapOriginal(f);
      completion(f, { phase, invalidated });
      // A current trace is not the old producer's completion proof.
      f.put(f.task, 'quality/evidence/steps/current.json', { task_id: 'card-case', step_slug: 'current-step', phase: 'P1', observation: 'Current readable trace only.' });
      const producer = runFinalChainCheck({ taskPath: f.task, materialRoot: f.materials, workflowRoot: f.repo });
      // This must hit the real producer-completed seam, not an unavailable fixture.
      expect(producer.workflow_steps.find(row => row.step_slug === 'current-step').state).toBe('completed');
      const result = f.invoke(['--stage=make-decision', '--step=1', '--phase=P1']);
      expect(result.report.closeout.gaps).toEqual([expect.objectContaining({ evidence_ref: gap.evidence_ref })]);
      expect(result.report.stages[0].steps[0].state).not.toBe('completed');
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each([false, true])('rejects a producer note for current invalid trace even with self-declared completed=%s', async selfDeclared => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      const gap = await gapOriginal(f);
      completion(f, { phase: 'P0' });
      const ref = 'quality/evidence/current-invalid-observation.json';
      const source = 'workflows/make-decision/steps.json', step_slug = 'current-step';
      f.put(f.task, ref, { task_id: 'card-case', source, step_slug, phase: 'P1',
        observation: 'Current trace has no reader, inputs or criterion.', created_at: '2026-02-02T00:00:00.000Z',
        ...(selfDeclared ? { conclusion: 'completed' } : {}) });
      const facts = readFileSync(join(f.task, 'facts.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
      facts.find(row => row.stage === 'make-decision').evidence.value.push({ ref, source, step_slug });
      f.put(f.task, 'facts.jsonl', facts.map(row => JSON.stringify(row)).join('\n') + '\n');
      const producer = runFinalChainCheck({ taskPath: f.task, materialRoot: f.materials, workflowRoot: f.repo });
      const step = producer.workflow_steps.find(row => row.step_slug === step_slug);
      expect(step.state).toBe('completed');
      expect(step.basis).toEqual(expect.arrayContaining([expect.objectContaining({ ref, evidence_level: null })]));
      const result = f.invoke(['--stage=make-decision', '--step=1', '--phase=P1', '--card']);
      console.log(JSON.stringify({ case: 'invalid current human note cannot complete old producer result', selfDeclared,
        projected: result.report.stages[0].steps[0].state, closeout: result.report.closeout }));
      expect.soft(result.report.stages[0].steps[0].state).not.toBe('completed');
      expect.soft(result.report.closeout.gaps).toEqual([expect.objectContaining({ evidence_ref: gap.evidence_ref })]);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it('clears only a matching current gap through its real producer original', async () => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      await gapOriginal(f);
      const ref = completion(f);
      const result = f.invoke(['--stage=make-decision', '--step=1', '--phase=P1', '--card']);
      expect(result.status).toBe(0);
      expect(result.report.stages[0].steps[0]).toMatchObject({ state: 'completed' });
      expect(result.report.card.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ ref, present: true })]));
      expect(result.report.closeout.gaps).toEqual([]);
      expect(existsSync(join(f.task, 'quality/evidence/steps/current.json'))).toBe(false);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each(['--commit=does-not-exist', '--commit=' + '0'.repeat(40), '--phase=P999', '--run-id=made-up-run'])('refuses unverified skip identity %s without writing or advancing', flag => {
    const f = p1CurrentCardFixture();
    try {
      const result = f.invoke(['--stage=make-decision', '--skip-with-gap=5', '--card', '--reason=missing input', '--owner=controlled owner', '--recovery=provide input', flag]);
      expect(result.status).toBe(0);
      expect(result.report.skip_gap).toBeNull();
      expect(result.report.card.step_id).toBe(5);
      expect(result.report.errors.join('\n')).toMatch(/身份|unavailable|HEAD|Phase|run/);
      expect(result.report.closeout.gaps).toEqual([]);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it('accepts the actual temporary repository HEAD as a skip identity', () => {
    const f = p1CurrentCardFixture();
    try {
      const result = f.invoke(['--stage=make-decision', '--skip-with-gap=5', '--card', '--reason=missing input', '--owner=controlled owner', '--recovery=provide input', `--commit=${f.head}`]);
      expect(result.status).toBe(0);
      expect(result.report.skip_gap).toMatchObject({ commit: f.head, step_id: 5 });
      expect(result.report.card.step_id).toBe(5);
      expect(result.report.skip_next).toEqual({ step_id: 6, step_slug: 'adversarial-direction-check' });
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it('real step6 does not accept an unrelated old original in a generic directory', () => {
    const f = p1CurrentCardFixture();
    try {
      f.put(f.task, 'quality/tests/unrelated.json', { task_id: 'another-task', run_id: 'old-run', observation: 'old' });
      const result = f.invoke(['--stage=make-decision', '--step=6', '--card', '--run-id=current-run']);
      expect(result.report.card.evidence.some(item => item.ref.endsWith('/') && item.present === true)).toBe(false);
      expect(result.report.stages[0].steps.at(-1).judgment).toBe('未留痕');
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it('real step6 consumes its unique current appendRecord ref and rejects changed task/step/phase identities', async () => {
    const f = p1CurrentCardFixture();
    try {
      const { openTask } = await import('../../runtime/task/task-handle.mjs');
      const task = openTask(f.task, { projectName: 'controlled', taskId: 'card-case' });
      const source = 'workflows/make-decision/steps.json', step_slug = 'adversarial-direction-check';
      const original = { task_id: 'card-case', source, step_slug, phase: 'P1', observation: 'Current step6 named controlled observation.' };
      const path = await task.appendRecord({ dir: 'quality/evidence', slug: 'step6-observation', ext: 'json', bytes: JSON.stringify(original) });
      const ref = path.slice(f.task.length + 1);
      f.put(f.task, 'facts.jsonl', [f.cursor, { record_kind: 'stage', task_id: 'card-case', stage: 'make-decision',
        evidence: { value: [{ ref, source, step_slug }] } }].map(row => JSON.stringify(row)).join('\n') + '\n');
      const valid = f.invoke(['--stage=make-decision', '--step=6', '--card', '--phase=P1']);
      expect(valid.report.card.paths).toContain(ref);
      expect(valid.report.card.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ ref, present: true })]));
      expect(valid.report.stages[0].steps.at(-1).judgment).toBe('已留痕');
      // Controlled negative inputs change only identity bytes at the same ref.
      for (const changed of [{ task_id: 'other-task' }, { step_slug: 'other-step' }, { phase: 'P0' }]) {
        f.put(f.task, ref, { ...original, ...changed });
        const invalid = f.invoke(['--stage=make-decision', '--step=6', '--card', '--phase=P1']);
        expect(invalid.report.card.evidence.find(item => item.ref === ref).present).toBe(false);
        expect(invalid.report.stages[0].steps.at(-1).judgment).toBe('未留痕');
      }
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each(['absolute', 'parent', 'ancestor-symlink'])('does not accept external content through a %s original ref', mode => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      f.put(f.root, 'outside.json', { task_id: 'card-case', run_id: 'current-run', observation: 'outside source' });
      if (mode === 'ancestor-symlink') symlinkSync(f.root, join(f.materials, 'escape'));
      const ref = mode === 'absolute' ? join(f.root, 'outside.json') : mode === 'parent' ? '../outside.json' : 'escape/outside.json';
      const manifestPath = 'workflows/make-decision/steps.json';
      const manifest = JSON.parse(readFileSync(join(f.repo, manifestPath), 'utf8'));
      manifest.steps[0].completion_evidence = [{ kind: 'quality_evidence', uri_or_path: ref }];
      f.put(f.repo, manifestPath, manifest);
      const result = f.invoke(['--stage=make-decision', '--step=1', '--run-id=current-run']);
      expect(result.report.stages[0].steps[0].evidence[0]).toMatchObject({ present: false });
      expect(result.report.stages[0].steps[0].evidence[0].reason).toMatch(/越界|符号链接/);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
});

describe('ORACLE-P1-BASELINE TCR-P1-001 actual current reading denominator', () => {
  it.each([5, 6, 8])('measures actual step%i method sections and marks unobserved duration explicitly', stepId => {
    const f = p1CurrentCardFixture();
    try {
      const inputs = new Map([
        [5, '5. <a id="step-outline-talk"></a>Read the fifth controlled input.'],
        [6, '6. <a id="step-adversarial-direction-check"></a>Read the sixth controlled input.'],
        [8, '8. <a id="step-module-breadth-confirm"></a>Read the eighth controlled input.'],
      ]);
      f.put(f.repo, 'workflows/make-decision/SKILL.md', '# Controlled reader\n## 方法\n' + [...inputs.values()].join('\n') + '\n## End\n');
      const result = f.invoke(['--stage=make-decision', `--step=${stepId}`, '--card', '--phase=P1']);
      const baseline = result.report.card.reading_baseline;
      expect(baseline).toMatchObject({ paths: expect.any(Array), path_count: expect.any(Number), bytes: expect.any(Number) });
      expect(baseline.path_count).toBe(baseline.paths.length);
      expect(baseline.path_count).toBeLessThanOrEqual(3);
      expect(baseline.bytes).toBeGreaterThan(0);
      const method = baseline.paths.find(item => item.ref.includes('SKILL.md#'));
      expect(method).toMatchObject({ observed: true, bytes: expect.any(Number) });
      expect(method.bytes).toBe(Buffer.byteLength(inputs.get(stepId)));
      expect(baseline.bytes).toBe(Buffer.byteLength(inputs.get(stepId)) + Buffer.byteLength(readFileSync(join(f.repo, 'workflows/make-decision/steps.json'))));
      expect(method.bytes).toBeLessThan(Buffer.byteLength(readFileSync(join(f.repo, 'workflows/make-decision/SKILL.md'))));
      expect(baseline.phase_duration).toMatchObject({ value: null, reason: expect.any(String) });
      expect(baseline.skips).toMatchObject({ value: null, reason: expect.any(String) });
      expect(baseline.rework).toMatchObject({ value: null, reason: expect.any(String) });
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
});


describe('P7 terminal current-proof regression', () => {
  function original(f, { markdown = false, identity = { phase: 'P1' }, source = 'workflows/make-decision/steps.json' } = {}) {
    const ref = `quality/evidence/p7-current-proof.${markdown ? 'md' : 'json'}`;
    const criteria = source.replace('steps.json', 'SKILL.md') + '#方法';
    f.put(f.repo, source.replace('steps.json', 'SKILL.md'), '# Controlled\n## 方法\nOwned observation.\n');
    f.put(f.materials, 'step-consumer-design.md', `| [controlled](../../${source}#L1) \`current-step\` | observation | human | owner |`);
    const human = { task_id: 'card-case', source, step_slug: 'current-step', ...identity,
      reader: 'independent fixture reader', inputs: ['owned source'], observation: 'Owned observation.',
      criteria_ref: criteria, conclusion: 'completed', limits: [], created_at: '2026-01-02T00:00:00Z' };
    f.put(f.task, ref, markdown ? [
      `task_id: ${human.task_id}`, `source: ${source}`, 'step_slug: current-step',
      ...Object.entries(identity).map(([key,value]) => `${key}: ${value}`),
      '执行者: independent fixture reader', '实际输入: owned source', '实际观察: Owned observation.',
      `原方法判据: ${criteria}`, '结论: completed', '限制: controlled fixture only',
    ].join('\n') + '\n' : human);
    f.put(f.task, 'facts.jsonl', [f.cursor, { record_kind: 'stage', task_id: 'card-case', stage: 'make-decision',
      evidence: { value: [{ ref, source, step_slug: 'current-step' }] } }].map(row => JSON.stringify(row)).join('\n') + '\n');
    const producer = runFinalChainCheck({ taskPath: f.task, materialRoot: f.materials, workflowRoot: f.repo });
    expect(producer.workflow_steps.find(row => row.source === source && row.step_slug === 'current-step')?.state, JSON.stringify(producer.limits)).toBe('completed');
    return ref;
  }
  it.each([
    [[], { phase: 'P0' }],
    [['--phase=P9'], { phase: 'P9' }],
    [['--commit=' + 'f'.repeat(40)], { commit: 'f'.repeat(40) }],
    [['--run-id=invented-run'], { run_id: 'invented-run' }],
  ])('does not advance a current card with missing or unverified identity %j', (flags, identity) => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      original(f, { identity });
      const result = f.invoke(['--stage=make-decision', '--card', ...flags]);
      expect(result.report.stages[0].steps[0].state).not.toBe('completed');
      expect(result.report.card?.step_id).toBe(1);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each([['phase', 'P0', '--phase=P1'], ['commit', 'old-head', null], ['run_id', 'old-run', '--run-id=new-run']])('rejects old legitimate Markdown %s proof for a new identity', (field, value, flag) => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      original(f, { markdown: true, identity: { [field]: value } });
      const result = f.invoke(['--stage=make-decision', '--step=1', flag ?? '--commit=' + f.head]);
      expect(result.report.stages[0].steps[0].state).not.toBe('completed');
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each([false, true])('keeps a legitimate current proof usable, Markdown=%s', markdown => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      original(f, { markdown });
      const result = f.invoke(['--stage=make-decision', '--step=1', '--phase=P1']);
      expect(result.report.stages[0].steps[0].state).toBe('completed');
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it.each([['small', '小改动'], ['normal', '普通任务'], ['planning', '规划任务']])('clears an actual completed gap using the active %s flow source', async (flow, label) => {
    const f = p1CurrentCardFixture({ singleStep: true });
    try {
      const source = `workflows/make-decision/flows/${flow}/steps.json`;
      const definition = JSON.parse(readFileSync(join(f.repo, 'workflows/make-decision/steps.json'), 'utf8'));
      f.put(f.repo, source, definition);
      f.put(f.repo, 'workflows/make-decision/steps.json', { ...definition, flows: { [flow]: { steps: source } } });
      const choiceRef = 'quality/evidence/p7-controlled-choice.md';
      f.put(f.task, choiceRef, `受控夹具选择 ${flow}；不授权真实任务。\n`);
      f.put(f.task, 'quality/evidence/p7-controlled-entry.json', { flags: { boundary_clear: true, single_outcome: true, limited_impact: true, major_architecture: false, migration: false, permission: false, security: false } });
      const facts = { scope: 'bounded', change_kind: 'code', independent_units: 1, risk: 'bounded', credentials: false, dependencies: 'none', acceptance: 'observable test' };
      f.put(f.materials, 'decision-log.md', `# Controlled\n## 级别与路线\n用户选择：${flow}\n原 ref：${choiceRef}\n入口返回原 ref：quality/evidence/p7-controlled-entry.json\n` + Object.entries(facts).map(([key, value]) => `${key}：${value}；来源：${choiceRef}`).join('\n') + '\n');
      const { openTask } = await import('../../runtime/task/task-handle.mjs');
      const task = openTask(f.task, { projectName: 'controlled', taskId: 'card-case' });
      await task.appendRecord({ dir: 'quality/evidence', slug: 'step-gap', ext: 'json', bytes: JSON.stringify({
        task_id: 'card-case', stage: 'make-decision', step_id: 1, step_slug: 'current-step', phase: 'P1',
        reason: 'owned missing step', owner: 'fixture reader', recovery: 'supply same-flow completion', created_at: '2026-01-01T00:00:00Z',
      }) });
      original(f, { source });
      const result = f.invoke(['--stage=make-decision', '--step=1', '--phase=P1']);
      expect(result.report.stages[0].source).toBe(source);
      expect(result.report.closeout.gaps).toEqual([]);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
});
