import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
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
      expect(JSON.parse(invoke().stdout).stages[0].steps[7]).toMatchObject({ judgment: '已留痕', state: 'completed' });
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
      expect(JSON.parse(invoke().stdout).stages[0].steps[7]).toMatchObject({ judgment: '已留痕', state: 'completed' });
      const manifest = JSON.parse(readFileSync(join(repo, 'workflows/build-prd/steps.json'), 'utf8'));
      manifest.steps[0].observable_result = 'Controlled missing mapping marker';
      put(repo, 'workflows/build-prd/steps.json', manifest);
      put(task, 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md', validOne.replace('D-001 不做什么', '').replace('已收敛', '待收敛'));
      const second = invoke();
      expect(second.status).toBe(0);
      expect(JSON.parse(second.stdout).convergence).toMatchObject({ complete: false, gaps: ['1 controlled'] });
      expect(JSON.parse(second.stdout).modules[0].fields[1]).toMatchObject({ name: '边界', present: false });
      const incompleteText = textInvoke().stdout;
      expect(incompleteText).toContain('1 controlled：待收敛');
      expect(incompleteText).toContain('  边界：缺项；present=false');
      expect(incompleteText).toContain('收敛 complete=false；gaps=["1 controlled"]');
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
  const decision = '# Controlled\n- 推荐级别：复杂\n' + firstDecision + secondDecision + `清单：\`${ref}\`\n`;
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

// P1-TEXT-GUARD-START
function assertP1TextContract(methods, template) {
  const required=['缺失即未完成','跨包不合批','确认与推进分开问','少打扰不等于跳过步骤','`steps.json`','不在决策日志新增步骤节','问答原件开头写明批次类型','检查器只报告、退出 0，不证明完成','- 推荐级别：复杂','既有日志不回改'];
  for(const [stage,body] of Object.entries(methods)) {
    const lines=body.split(/\r?\n/).filter(line=>line.startsWith('执行纪律：'));
    if(lines.length!==1)throw Error(`discipline:${stage}`);
    for(const text of required)if(!lines[0].includes(text))throw Error(`discipline:${stage}:${text}`);
    if(!lines[0].includes(`node tools/cli/check-stage-steps.mjs --stage=${stage} --task-path=<任务目录>`))throw Error(`command:${stage}`);
    if(stage==='make-decision'&&!['第9步逐包收敛','更新8项证据指针与包状态','第10步细节审查前','有未收敛包就停在细节审查前'].every(text=>lines[0].includes(text)))throw Error('make-decision:advance');
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
