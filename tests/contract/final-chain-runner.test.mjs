// ORACLE-P2-CHAIN: N9 P2 T003/T004/T005, spec §7.1–7.3 and Appendix A.
// Independent test owner; frozen build-prd/PLAN tests remain read-only.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, realpathSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as kernel from '../../runtime/task/portable-workflow-run.mjs';
import { writeStageRow } from '../../runtime/task/task-store.mjs';
import { captureCommand } from '../../runtime/interface/run-command.mjs';
import { stageRuntimeCliMain } from '../../tools/cli/stage-runtime.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const roots = [];
afterEach(() => { vi.restoreAllMocks(); for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true }); });
function temporary() { const root = realpathSync(mkdtempSync(join(tmpdir(), 'n9-final-chain-'))); roots.push(root); return root; }
function put(root, name, value) { const path = join(root, name); mkdirSync(dirname(path), {recursive:true}); writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value)); return path; }
const step = { step_id: 1, step_slug: 'owned-check', observable_result: 'The owned source is checked against its independent criterion.' };
const manifest = workflow => ({ schema_version:'2.0.0', stage_slug:workflow, steps:[{...step}] });
function outcomes(workflow, ref) { return { task_id:'owned-task', workflow, step_results:[{task_id:'owned-task', workflow, step_id:1, step_slug:'owned-check', status:'completed', result_ref:ref}] }; }

describe('final-chain kernel', () => {
  it('preserves the actual default build-prd declaration and accepts an injected final-chain declaration at its own path', () => {
    const actual = kernel.loadPortableWorkflowManifest({worktreeRoot:ROOT});
    expect(actual.stage_slug).toBe('build-prd');
    expect(actual.steps).toEqual(JSON.parse(readFileSync(join(ROOT,'workflows/build-prd/steps.json'),'utf8')).steps);
    let observed;
    const injected = kernel.loadPortableWorkflowManifest({worktreeRoot:ROOT, workflow:'final-chain', read:(path) => { observed=path; return JSON.stringify(manifest('final-chain')); }});
    expect(observed).toBe(join(ROOT,'workflows/final-chain/steps.json'));
    expect(injected.stage_slug).toBe('final-chain');
    expect(injected.steps).toEqual([step]);
  });
  it('exports all four reusable functions without exposing a terminal writer', () => {
    for (const name of ['loadPortableWorkflowManifest','validateStepResultEvidence','validateStepResults','stateForStepResults']) expect(kernel[name],name).toBeTypeOf('function');
    expect(kernel).not.toHaveProperty('writeTerminal');
  });
  it('retains default attestation semantics and rejects final-chain references in the default namespace', () => {
    const taskPath=temporary(), task={taskPath};
    const ref='quality/evidence/portable-workflow-outcomes/build-prd/owned.json';
    const input=outcomes('build-prd',ref);
    put(taskPath,ref,{task_id:'owned-task',workflow:'build-prd',step_results:input.step_results});
    expect(kernel.validateStepResults(input,'owned-task',[step],task)).toEqual({results:input.step_results,refs:[ref]});
    const cross=outcomes('build-prd','quality/evidence/portable-workflow-outcomes/final-chain/owned.json');
    expect(kernel.validateStepResults(cross,'owned-task',[step],task).error).toContain('outside the canonical outcome namespace');
    put(taskPath,ref,{task_id:'owned-task',workflow:'build-prd',step_results:[{...input.step_results[0],status:'failed'}]});
    expect(kernel.validateStepResults(input,'owned-task',[step],task).error).toContain('does not attest');
  });
  it('uses injected original verification for final-chain and preserves its concrete failure', () => {
    const task={taskPath:temporary()}, ref='quality/evidence/portable-workflow-outcomes/final-chain/owned.json';
    const input=outcomes('final-chain',ref);
    const verified=kernel.validateStepResults(input,'owned-task',[step],task,{workflow:'final-chain',verifyEvidence:()=>null});
    expect(verified).toEqual({results:input.step_results,refs:[ref]});
    const failed=kernel.validateStepResults(input,'owned-task',[step],task,{workflow:'final-chain',verifyEvidence:()=> 'original sha256 mismatch'});
    expect(failed.error).toBe('original sha256 mismatch');
  });
  it('does not allow an injected verifier to bypass the selected namespace or input identity', () => {
    const task={taskPath:temporary()}, ref='quality/evidence/portable-workflow-outcomes/build-prd/owned.json';
    const input=outcomes('final-chain',ref);
    expect(kernel.validateStepResults(input,'owned-task',[step],task,{workflow:'final-chain',verifyEvidence:()=>null}).error).toContain('outside the canonical outcome namespace');
    expect(kernel.validateStepResults({...input,task_id:'other'},'owned-task',[step],task,{workflow:'final-chain',verifyEvidence:()=>null}).error).toContain('task_id is invalid');
  });
  it.each([null, [], {schema_version:'2.0.0',stage_slug:'final-chain',steps:[]}])('rejects invalid manifests (%j)', value => {
    expect(()=>kernel.loadPortableWorkflowManifest({worktreeRoot:ROOT,workflow:'final-chain',read:()=>JSON.stringify(value)})).toThrow(/manifest is invalid/);
  });
  it.each(['../escape','', 'final-chain/escape'])('rejects unsafe workflow namespace %j before reading', workflow => {
    let read=false;
    expect(()=>kernel.loadPortableWorkflowManifest({worktreeRoot:ROOT,workflow,read:()=>{read=true;return JSON.stringify(manifest(workflow));}})).toThrow();
    expect(read).toBe(false);
  });
  it('retains concrete unreadable-manifest failure and state projection shape', () => {
    expect(()=>kernel.loadPortableWorkflowManifest({worktreeRoot:ROOT,read:()=>{throw Error('owned missing');}})).toThrow('portable build-prd steps manifest is unreadable: owned missing');
    expect(kernel.stateForStepResults([{step_slug:'owned-check',status:'completed'}])).toEqual({state:'succeeded',failedStep:null,reason:'all supplied portable step outcomes are completed'});
    expect(kernel.stateForStepResults([{step_slug:'owned-check',status:'unverified'}])).toEqual({state:'unverified',failedStep:'owned-check',reason:'portable step requires verification: owned-check'});
  });
});

const NAMES=['原始需求','decision-log','调研方案','方案','spec','phase','代码实现','测试验证','最终审查','提交 PR'];
const STATES=['completed','skipped','not_applicable','incomplete','unavailable'];
const hash = text => createHash('sha256').update(text).digest('hex');
async function report(options) { const api=await import('../../runtime/task/final-chain-runner.mjs'); return await api.runFinalChainCheck(options); }
function taskFixture({materials=true}={}) {
  const root=temporary(), taskPath=join(root,'task'), repo=join(root,'repo'), materialRoot=join(repo,'specs/owned-task');
  mkdirSync(materialRoot,{recursive:true});
  put(taskPath,'task.json',{schema_version:'1.0.0',task_id:'owned-task',baseline_commit:'HEAD',target_repo_root:repo,activation_cohort:'post'});
  put(taskPath,'facts.jsonl','');
  if(materials) {
    put(materialRoot,'decision-log.md','# Controlled task\n## 任务身份\n任务ID：owned-task\n## 原始需求\n保留真实依据。\n## 工作包与决定\n### D-001 — 独立测试\n已确认：只读核对。\n## 未决项\n无真实未知。\n');
    put(materialRoot,'raw-requirements/owned.md','用户原始需求：只读核对，不把缺失伪装成功。\n');
  }
  return {root,taskPath,repo,materialRoot};
}
function stageEvidence(f, stage, items) { put(f.taskPath,'facts.jsonl',JSON.stringify({record_kind:'stage',task_id:'owned-task',stage,evidence:{value:items,reason:'Controlled actual observations.'}})+'\n'); }
function commandEvidence(f,name,command,exit_code=0,extra={}) {
  const ref=`quality/tests/${name}.json`, outputRef=`quality/tests/${name}.output`;
  put(f.taskPath,outputRef,`${name}: actual controlled output\n`);
  put(f.taskPath,ref,{argv:['node',...command.split(' ').slice(1)],cwd:f.repo,exit_code,signal:null,timed_out:false,cancelled:false,truncated:false,output_ref:join(f.taskPath,outputRef),...extra});
  return {command,exit_code,ref,receipt_ref:ref,output_ref:outputRef,failure_signature:'controlled source'};
}
function choice(f,level,{choiceRef='quality/evidence/choice.md',entryRef='quality/evidence/entry.json',sourceHash=false}={}) {
  const source=`Controlled user: 我选择 ${level}。这是受控输入，非真实任务授权。边界明确、一个独立单元、有限影响；无架构变化、迁移、权限或安全风险；无需凭证，无外部依赖；验收为独立行为测试。\n`;
  put(f.taskPath,choiceRef,source);
  put(f.taskPath,entryRef,{status:'suitable',user_requested:true,flags:{boundary_clear:true,single_outcome:true,limited_impact:true,major_architecture:false,migration:false,permission:false,security:false}});
  const facts={scope:'single bounded change',change_kind:'code',independent_units:1,risk:'bounded',credentials:false,dependencies:'none',acceptance:'owned behavior test'};
  const original=readFileSync(join(f.materialRoot,'decision-log.md'),'utf8');
  const section=`## 级别与路线\n用户选择：${level}\n原 ref：${choiceRef}\n${sourceHash?`sha256：${hash(source)}\n`:''}入口调用：node workflows/make-decision/scripts/entry-evaluation.mjs\n入口返回原 ref：${entryRef}\n${Object.entries(facts).map(([k,v])=>`${k}：${v}；来源：${choiceRef}`).join('\n')}\nboundary_clear：true；来源：${choiceRef}\nsingle_outcome：true；来源：${choiceRef}\nlimited_impact：true；来源：${choiceRef}\nmajor_architecture：false；来源：${choiceRef}\nmigration：false；来源：${choiceRef}\npermission：false；来源：${choiceRef}\nsecurity：false；来源：${choiceRef}\n`;
  put(f.materialRoot,'decision-log.md',original+'\n'+section);
  return {choiceRef,entryRef};
}
function controlledWorkflow(f) {
  const names=['make-decision','build-plan','build-code','verify-code','build-prd'];
  const make = (stage,slug)=>({schema_version:'2.0.0',stage_slug:stage,steps:[{step_id:1,step_slug:slug,observable_result:`Human reads the owned observation. 判定消费：workflows/${stage}/SKILL.md#方法；原件：当前stage evidence`,completion_evidence:[{kind:'phase_task_facts',uri_or_path:'facts.jsonl'}]}]});
  for(const name of names) { put(f.repo,`workflows/${name}/steps.json`,make(name,'shared-slug')); put(f.repo,`workflows/${name}/SKILL.md`,'# Owned method\n## 方法\n独立读者核实际输入及输出；缺输入不能通过。\n'); put(f.repo,`workflows/${name}/skill-deps.yaml`,'skills: []\n'); }
  const root=make('make-decision','root-only'); root.flows={};
  for(const level of ['small','normal','planning']) {
    const source=`workflows/make-decision/flows/${level}/steps.json`;
    root.flows[level]={skill:`workflows/make-decision/flows/${level}/SKILL.md`,steps:source};
    const flow=make('make-decision',`${level}-only`);
    flow.steps[0].observable_result=`Human reads the owned observation. 判定消费：workflows/make-decision/flows/${level}/SKILL.md#方法；原件：当前stage evidence`;
    put(f.repo,source,flow);
    put(f.repo,`workflows/make-decision/flows/${level}/SKILL.md`,'# Owned flow\n## 方法\n逐项人读原件，不能关键词代通过。\n');
  }
  put(f.repo,'workflows/make-decision/steps.json',root);
}
function ringAt(value,n) { return value.rings.find(r=>r.ring===n); }

describe('final-chain report',()=>{
  it('returns all required report fields and fixed ten rings while leaving missing execution unavailable',async()=>{
    const f=taskFixture({materials:false});
    const value=await report(f);
    expect(Object.keys(value)).toEqual(expect.arrayContaining(['schema_version','task_id','baseline_commit','material_root','level','rings','completion','metrics','limits','chain_state','workflow_steps','workflow_metrics']));
    expect(value.task_id).toBe('owned-task'); expect(value.material_root).toBe(f.materialRoot);
    expect(value.rings.map(r=>r.ring)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(value.rings.map(r=>r.name)).toEqual(NAMES);
    for(const row of value.rings) { expect(STATES).toContain(row.state); expect(Object.keys(row)).toEqual(expect.arrayContaining(['ring','name','applicability','state','evidence_type','basis','counted_in_denominator','conflict'])); expect(row.counted_in_denominator).toBe(row.state!=='not_applicable'); expect(Array.isArray(row.basis)).toBe(true); }
    expect(ringAt(value,5).state).toBe('unavailable');
    expect(ringAt(value,9).state).toBe('unavailable');
    expect(value.level).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});
    expect(['failed','in-progress','unverified','succeeded']).toContain(value.chain_state);
    expect(value.chain_state).not.toBe('succeeded');
  });
  it('hashes the original raw requirement and preserves task bytes over repeat reads',async()=>{
    const f=taskFixture(), file=join(f.materialRoot,'raw-requirements/owned.md'), raw=readFileSync(file,'utf8');
    const before=[readFileSync(join(f.taskPath,'task.json'),'utf8'),readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')];
    const a=await report(f), b=await report(f);
    expect(ringAt(a,1).state).toBe('completed');
    expect(JSON.stringify(ringAt(a,1).basis)).toContain(hash(raw));
    expect(ringAt(b,1)).toEqual(ringAt(a,1));
    expect(readFileSync(file,'utf8')).toBe(raw);
    expect([readFileSync(join(f.taskPath,'task.json'),'utf8'),readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')]).toEqual(before);
  });
  it.each(['missing-directory','invalid-json','missing-task-json'])('rejects %s with a concrete task.json error, never half a report',async(kind)=>{
    const f=taskFixture();
    if(kind==='missing-directory') rmSync(f.taskPath,{recursive:true});
    if(kind==='missing-task-json') rmSync(join(f.taskPath,'task.json'));
    if(kind==='invalid-json') put(f.taskPath,'task.json','{bad');
    await expect(report(f)).rejects.toThrow(/final-chain task\.json is unreadable:/);
  });
  it('does not treat advisory exit 0 with empty decision/spec inputs as completed',async()=>{
    const f=taskFixture();
    put(f.materialRoot,'decision-log.md','');put(f.materialRoot,'spec.md','');
    stageEvidence(f,'make-decision',[commandEvidence(f,'decision','node tools/cli/check-decision-log-chain.mjs',0),commandEvidence(f,'contract','node validatePostPhaseContract',0)]);
    const value=await report(f);
    expect(ringAt(value,2).state).not.toBe('completed');expect(ringAt(value,5).state).not.toBe('completed');
  });
  it('does not promote decision/spec files missing required sections or decisions even with successful commands',async()=>{
    const f=taskFixture();put(f.materialRoot,'decision-log.md','# Decision without decisions\n');put(f.materialRoot,'spec.md','# Spec without required sections\n');
    stageEvidence(f,'make-decision',[commandEvidence(f,'decision','node tools/cli/check-decision-log-chain.mjs',0),commandEvidence(f,'contract','node validatePostPhaseContract',0)]);
    const value=await report(f);expect(ringAt(value,2).state).not.toBe('completed');expect(ringAt(value,5).state).not.toBe('completed');
  });
  it.each(['../outside.md','/etc/passwd','quality/evidence/missing.md'])('falls back on unsafe or unreadable choice source %s',async(ref)=>{
    const f=taskFixture();
    put(f.materialRoot,'decision-log.md',`## 级别与路线\n用户选择：small\n原 ref：${ref}\n`);
    const value=await report(f);expect(value.level).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});expect(value.limits.length+JSON.stringify(value.level).length).toBeGreaterThan(0);
  });
  it('keeps recommendation and unanswered choice from becoming normal',async()=>{
    const f=taskFixture();put(f.materialRoot,'decision-log.md','## 级别与路线\n推荐级别：normal\n用户选择：未答\n');
    expect((await report(f)).level).toMatchObject({value:'complex',declared:false});
  });
  it('detects a changed source hash rather than trusting an otherwise readable choice',async()=>{
    const f=taskFixture();const refs=choice(f,'small',{sourceHash:true});put(f.taskPath,refs.choiceRef,'changed source bytes');
    expect((await report(f)).level).toMatchObject({value:'complex',declared:false});
  });
  it.each(['small','normal','complex','planning'])('selects only current %s make-decision source, preserving source plus slug identity',async(level)=>{
    const f=taskFixture();choice(f,level);controlledWorkflow(f);
    const value=await report(f);
    expect(value.level).toMatchObject({value:level,declared:true});
    const makeRows=value.workflow_steps.filter(row=>row.stage==='make-decision');
    expect(makeRows.map(row=>[row.source,row.step_slug])).toEqual(level==='complex'?[['workflows/make-decision/steps.json','root-only']]:[[`workflows/make-decision/flows/${level}/steps.json`,`${level}-only`]]);
    for(const row of makeRows) expect(row.state).not.toBe('completed');
    expect(value.workflow_steps.filter(row=>row.source==='workflows/build-prd/steps.json')).toEqual([]);
    if(level==='planning') for(const n of [5,6,7,8,9]) expect(ringAt(value,n).state).toBe('not_applicable');
    if(level==='small') expect(ringAt(value,9).state).toBe('not_applicable');
  });
  it('does not count a human DONE keyword or owner pointer as semantic completion',async()=>{
    const f=taskFixture();choice(f,'normal');controlledWorkflow(f);
    put(f.taskPath,'quality/evidence/human.md','DONE completed 所有完成，未提供source身份、原判据或实际观察。\n');
    stageEvidence(f,'make-decision',[{ref:'quality/evidence/human.md',source:'workflows/make-decision/flows/normal/steps.json',step_slug:'normal-only'}]);
    const value=await report(f), row=value.workflow_steps.find(row=>row.step_slug==='normal-only');
    expect(row).toBeDefined();expect(row.state).not.toBe('completed');
  });
  it('keeps workflow denominators independent and unknown stages null rather than inventing zero',async()=>{
    const f=taskFixture();choice(f,'normal');controlledWorkflow(f);
    const value=await report(f), m=value.workflow_metrics;
    expect(m).not.toBeNull();expect(m.stage_skip_rate).toBeNull();
    expect(m.stage_skip_denominator).toBeNull();
    expect(m.step_attestation_denominator).toBe(value.workflow_steps.filter(row=>row.state!=='not_applicable').length);
    expect(m.step_attestation_numerator).toBe(0);expect(m.step_attestation_coverage).toBe(0);
    expect(m.declared_steps).toEqual(value.workflow_steps.map(({source,step_slug})=>({source,step_slug})));
    expect(m.step_attestation_denominator).not.toBe(53);expect(m.step_attestation_denominator).not.toBe(84);
  });
  it('reports zero workflow input as null metrics and no completed workflow row',async()=>{
    const f=taskFixture();const value=await report(f);
    expect(value.workflow_steps).toEqual([]);expect(value.workflow_metrics).toBeNull();
  });
  it('distinguishes absent delivery declaration from a sourced no-delivery declaration',async()=>{
    const f=taskFixture();expect(ringAt(await report(f),10).state).toBe('unavailable');
    const raw=readFileSync(join(f.materialRoot,'decision-log.md'),'utf8');
    put(f.materialRoot,'decision-log.md',raw+'\n## 交付声明\n明确不做提交 PR 交付。\n');
    expect(ringAt(await report(f),10).state).toBe('not_applicable');
  });
  it('does not infer an unreached delivery time from a missing PR',async()=>{
    const f=taskFixture(), raw=readFileSync(join(f.materialRoot,'decision-log.md'),'utf8');
    put(f.materialRoot,'decision-log.md',raw+'\n## 交付声明\n声明要做提交 PR 交付。\n');
    expect(ringAt(await report(f),10).state).toBe('unavailable');
  });
});

function git(f,args) { const r=spawnSync('git',args,{cwd:f.repo,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1'}}); if(r.status!==0) throw Error(`SETUP git ${args.join(' ')}: ${r.stderr}`); return r.stdout.trim(); }
function implementation(f) {
  git(f,['init','-q']);git(f,['config','user.name','Owned fixture']);git(f,['config','user.email','owned@fixture.invalid']);
  put(f.repo,'owned.mjs','export const observed = false;\n');git(f,['add','owned.mjs']);git(f,['commit','-qm','controlled baseline']);
  const baseline=git(f,['rev-parse','HEAD']);
  const task=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));put(f.taskPath,'task.json',{...task,baseline_commit:baseline});
  put(f.repo,'owned.mjs','export const observed = true;\n');git(f,['add','owned.mjs']);git(f,['commit','-qm','controlled implementation']);
  const heads=['## 1. 需求解释：问题与紧迫性','## 2. 背景、目标与范围','## 3. 用户场景与状态覆盖','## 4. 产品事实与假设（PFACT）','## 5. 功能需求','## 6. 模块划分','## 7. 关键实体','## 8. 数据和生命周期','## 9. 兼容性预留','## 10. 明确不做与默认必须成立','## 验收流程','## 测试标准','## 架构边界'];
  put(f.materialRoot,'spec.md','# Controlled spec\n'+heads.map(h=>`${h}\nOwned criterion, input and failure remain visible.\n`).join('\n')+'\n## 实现设计（全局权威）\n### 全局文件边界与依赖\n- **修改**：`owned.mjs`。\n### 需求到任务追踪\n| source | FR/AC | Phase/Task | oracle |\n| --- | --- | --- | --- |\n| R-001 | FR-001/AC-001 | P1/T001 | ORACLE-OWNED |\n## Appendix A — 验收判据（唯一权威）\n- [ ] AC-001: owned implementation is observed.\n');
  put(f.materialRoot,'phases/index.md','# Phase index\n| phase | authority ref |\n| --- | --- |\n| P1 | `phases/P1.md` |\n');
  put(f.materialRoot,'phases/P1.md','# Phase P1\n- **Global spec**：`spec.md`\n- **Write set**：`owned.mjs`\n- **Dependency**：none\n- **Consumer**：owned task reader\n- **gate_cmd**：`node owned-check.mjs`\n- **oracle**：ORACLE-OWNED\n- **evidence_path**：`quality/tests/owned.json`\n- **STOP**：retain real failure\n- **Done**：actual observable result\n');
  return baseline;
}
function reviewFixture(f, mutate=x=>x) {
  const rawRef='quality/reviews/owned-provider.output';put(f.taskPath,rawRef,JSON.stringify({findings:[],explanation:'Owned independent implementation readback.'}));
  const coverage={provider:'owned-independent',read:['actual_diff'],unread:[],undetermined:['business semantics not fully observed']};
  const rec=mutate({version:'wh-review-result.v1',status:'available',outcome:'completed',task_id:'owned-task',stage:'build-code',review_scope:'phase',subject_kind:'phase',review_kind:null,phase_id:null,surface:'code',authoritative:false,
    request:{stage:'build-code',review_scope:'phase',subject_kind:'phase',review_kind:null,phase_id:null,surface:'code',material_keys:['actual_diff'],material_id:'controlled-id',subject:{changed_files:['owned.mjs'],scope:'whole implementation'}},
    provider_results:[{provider:'owned-independent',status:'completed',execution:{parse_outcome:'ok'},raw_output_ref:rawRef}],material_coverage:[coverage],findings:[],discarded_facts:[{fact_kind:'provider_output_reused',reason:'same bytes retained by original owner'}]});
  const ref='quality/reviews/owned-review.json';put(f.taskPath,ref,rec);
  const test=commandEvidence(f,'implementation','node --test owned.test.mjs',0);
  put(f.taskPath,test.output_ref,'TAP version 13\n# Controlled Node test output; not real external task acceptance.\nok 1 - owned behavioral observation\n1..1\n# tests 1\n# pass 1\n# fail 0\n');
  put(f.taskPath,'facts.jsonl',JSON.stringify({record_kind:'stage',task_id:'owned-task',stage:'make-decision',source:'controlled actual make-decision implementation',evidence:{value:[test]},review_origin:'conducted',review_result_ref:{value:ref,reason:'Whole implementation independent review, actual raw provider source.'}})+'\n');
  return {ref,rawRef};
}

describe('final-chain report real consumer boundaries',()=>{
  it('reads normal implementation/tests/review from a make-decision-only stage and real producer provider fields',async()=>{
    const f=taskFixture();choice(f,'normal');implementation(f);reviewFixture(f);
    const value=await report(f);
    expect(value.level).toMatchObject({value:'normal',declared:true});
    expect(ringAt(value,7).state).toBe('completed');expect(ringAt(value,8).state).toBe('completed');expect(ringAt(value,9).state).toBe('completed');
    const basis=JSON.stringify(ringAt(value,9).basis);
    expect(basis).toContain('owned-provider.output');expect(basis).toContain('business semantics not fully observed');
    expect(basis).toContain('same bytes retained by original owner');
    expect(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')).not.toContain('"stage":"build-code"');
  });
  it.each([
    ['foreign task',r=>({...r,task_id:'other-task'})],
    ['single phase',r=>({...r,phase_id:'P1',request:{...r.request,phase_id:'P1'}})],
    ['document plan',r=>({...r,surface:'document',subject_kind:'document'})],
    ['missing subject identity',r=>{const x={...r};delete x.subject_kind;return x;}],
    ['no successful semantic provider',r=>({...r,provider_results:[{...r.provider_results[0],status:'unavailable',execution:{parse_outcome:'error'}}]})],
    ['provider mismatch coverage',r=>({...r,material_coverage:[{provider:'other-provider',read:[],unread:[],undetermined:[]}]})],
    ['missing raw opinion',r=>({...r,provider_results:[{...r.provider_results[0],raw_output_ref:'quality/reviews/missing.output'}]})],
  ])('does not complete normal ring 9 for %s',async(_name,mutate)=>{
    const f=taskFixture();choice(f,'normal');implementation(f);reviewFixture(f,mutate);
    const value=await report(f);expect(ringAt(value,9).state).not.toBe('completed');
  });
  it('uses the material repository for the committed diff even when target_repo_root points elsewhere',async()=>{
    const f=taskFixture();choice(f,'normal');implementation(f);
    const other=join(f.root,'other-repo');mkdirSync(other);const task=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));put(f.taskPath,'task.json',{...task,target_repo_root:other});
    const value=await report(f);expect(ringAt(value,7).state).toBe('completed');expect(JSON.stringify(ringAt(value,7).basis)).toContain('owned.mjs');
  });
  it('rejects a choice symlink escaping the task/material roots without reading it as a valid selection',async()=>{
    const {symlinkSync}=await import('node:fs');const f=taskFixture();const refs=choice(f,'small');
    const original=join(f.taskPath,refs.choiceRef);rmSync(original);const outside=put(f.root,'outside-choice.md','用户已确认：small\n');symlinkSync(outside,original);
    expect((await report(f)).level).toMatchObject({value:'complex',declared:false});
  });
  it('keeps missing seven-source facts undeclared instead of filling their values',async()=>{
    const f=taskFixture();const refs=choice(f,'small');
    put(f.materialRoot,'decision-log.md',`## 级别与路线\n用户选择：small\n原 ref：${refs.choiceRef}\n入口返回原 ref：${refs.entryRef}\n`);
    expect((await report(f)).level).toMatchObject({value:'complex',declared:false});
  });
  it('requires explicit actual delivery timing instead of promoting field-only PR data',async()=>{
    const f=taskFixture();choice(f,'normal');
    put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+'\n## 交付声明\n声明要做提交 PR 交付。\n');
    put(f.taskPath,'quality/evidence/pr.json',{number:12,url:'https://github.com/owned/fixture/pull/12',head:'owned-head',base:'main'});
    stageEvidence(f,'make-decision',[{ref:'quality/evidence/pr.json'}]);
    expect(ringAt(await report(f),10).state).not.toBe('completed');
  });
});

function cli(args,cwd=ROOT,script=join(ROOT,'tools/cli/run-checks.mjs'),env={}) {
  const clean={...process.env,...env};delete clean.RUN_CHECKS_FORCE_FAIL_CHECKER;
  return spawnSync(process.execPath,[script,...args],{cwd,encoding:'utf8',env:clean,timeout:15000});
}
async function aggregateFixture() {
  const {copyFileSync,symlinkSync}=await import('node:fs');const root=temporary();
  // Exact import closure, not a saved tree. Stub only unrelated child checkers.
  for(const name of ['tools/cli/run-checks.mjs','runtime/adapters/local-skill-resolver.mjs','runtime/evidence/skill-static-deps.mjs','runtime/evidence/validate-contract.mjs','metrics/record-schema.mjs','metrics/execution-record.mjs','metrics/knowledge-card.mjs','contracts/execution-record.contract.json','contracts/knowledge-card.contract.json']) {
    mkdirSync(dirname(join(root,name)),{recursive:true});copyFileSync(join(ROOT,name),join(root,name));
  }
  mkdirSync(join(root,'node_modules'),{recursive:true});
  symlinkSync(dirname(createRequire(import.meta.url).resolve('js-yaml/package.json')),join(root,'node_modules/js-yaml'),'dir');
  for(const name of ['check-anti-host','check-stage-quality','check-decision-log-chain','check-skill-consistency']) put(root,`tools/cli/${name}.mjs`,'process.exit(0);\n');
  put(root,'skills/catalog.yaml','skills: []\n');
  return root;
}
describe('run-checks task path',()=>{
  it('prints exactly one JSON report and exits 0 for a task with missing rings',()=>{
    const f=taskFixture({materials:false}), result=cli(['--task-path',f.taskPath]);
    expect(result.error).toBeUndefined();expect(result.signal).toBeNull();expect(result.status,result.stderr).toBe(0);expect(result.stderr).toBe('');
    const value=JSON.parse(result.stdout);
    expect(value.task_id).toBe('owned-task');expect(value.rings.map(r=>r.ring)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(value.rings.some(r=>r.state==='unavailable')).toBe(true);expect(result.stdout).not.toContain('[run-checks]');
  });
  it.each([['--task-path'],['--task-path','x','extra'],['--self-test'],['--materialRoot','x']])('keeps unsupported arguments %j at exit 1',args=>{
    const result=cli(args);expect(result.status).toBe(1);expect(result.stderr).toContain('unsupported arguments');expect(result.stdout).toBe('');
  });
  it('rejects an unreadable task with exit 2 and no half JSON or checker logs',()=>{
    const missing=join(temporary(),'missing-task'), result=cli(['--task-path',missing]);
    expect(result.status).toBe(2);expect(result.stderr).toContain('final-chain task.json is unreadable:');expect(result.stdout).toBe('');
  });
  it('preserves the no-argument aggregate output and exit in an owned exact import fixture',async()=>{
    const root=await aggregateFixture(), result=cli([],root,join(root,'tools/cli/run-checks.mjs'));
    expect(result.error).toBeUndefined();expect(result.signal).toBeNull();expect(result.status,result.stderr).toBe(0);expect(result.stderr).toBe('');
    expect(result.stdout).toBe('[run-checks] running check-anti-host ...\n[run-checks] running check-metrics-schema ...\n[check-metrics-schema] PASS — retained validator and contract samples checked\n[run-checks] running skill-static-deps ...\n[skill-static-deps] PASS — retained validator and contract samples checked\n[run-checks] running check-skill-consistency ...\n[run-checks] running check-stage-quality ...\n[run-checks] running check-decision-log-chain (non-blocking) ...\n[run-checks] ALL CHECKS PASSED\n');
  });
});

async function deliveryEvent(f,{reached,pr=false}={}) {
  writerIdentity(f);
  const eventRef='quality/evidence/delivery-event.md';
  put(f.taskPath,eventRef,`# 当前任务实际流程事件\n任务：owned-task\n执行者：owned-fixture-reader\n阶段：make-decision\n步骤：${reached?'closeout':'implement-and-test'}\n观察时间：2026-10-20T00:00:00Z\n实际观察：${reached?'已到交付时点，已声明交付。':'实际仍在实施与测试，流程尚未到交付时点。'}\n限制：受控事实，仅验证读取；非真实任务完成。\n`);
  const items=[];
  let source=eventRef;
  if(pr) {
    implementation(f);git(f,['branch','-M','owned-head']);
    const task=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));
    git(f,['branch','main',task.baseline_commit]);git(f,['remote','add','origin','https://github.com/owned/fixture.git']);
    const actualBranch=git(f,['branch','--show-current']),headOid=git(f,['rev-parse','HEAD']),baseOid=git(f,['rev-parse','main']),remote=git(f,['remote','get-url','origin']);
    const outputRef='quality/tests/pr-readback.output', receiptRef='quality/tests/pr-readback.json';
    put(f.taskPath,outputRef,JSON.stringify({number:12,url:'https://github.com/owned/fixture/pull/12',headRefName:'owned-head',baseRefName:'main',headRefOid:headOid,baseRefOid:baseOid}));
    put(f.taskPath,receiptRef,{argv:['gh','pr','view','12','--json','number,url,headRefName,baseRefName'],cwd:f.repo,exit_code:0,signal:null,timed_out:false,cancelled:false,truncated:false,output_ref:join(f.taskPath,outputRef)});
    items.push({command:'gh pr view 12 --json number,url,headRefName,baseRefName',exit_code:0,failure_signature:'Controlled non-network external-response fixture; no gh command was executed',receipt_ref:receiptRef,output_ref:outputRef});
    source+=`; receipt: ${receiptRef}; output: ${outputRef}`;
    put(f.taskPath,eventRef,readFileSync(join(f.taskPath,eventRef),'utf8')+`
交付目标：本任务提交 PR 并取得读回，不要求合并。
目标仓库：${f.repo}
Git remote origin：${remote}
PR：#12
PR URL：https://github.com/owned/fixture/pull/12
head：${actualBranch}
head commit：${headOid}
base：main
base commit：${baseOid}
PR 读回原件：${receiptRef}
PR 返回输出：${outputRef}
响应限制：上述 PR 返回为受控 non-network external-response fixture，未执行真实 gh，也不证明真实用户交付；Git 身份由本次自有仓库实际命令取得。
`);

  }
  await writeStageRow(f.taskPath,{stage:'make-decision',source,evidence:{value:items.length?items:null,reason:items.length?'Controlled non-network PR response; actual local Git identity only.':'No command executed; timing is the ordinary source event.'}});
}
function humanEvent(f,{complete=true,source='workflows/make-decision/flows/normal/steps.json',slug='normal-only',observation=true}={}) {
  const ref='quality/evidence/owned-human-readback.md';
  put(f.taskPath,ref,`# 普通原始读回件\n执行者：owned-independent-reader\nsource：${source}\nstep_slug：${slug}\n实际输入：受控任务需求、原方法和实际产物。\n${observation?'实际观察：需求每项对上产物，反例缺少实际输入时不能完成。\n':''}原方法判据：workflows/make-decision/flows/normal/SKILL.md#方法\n结论：${complete?'completed':'incomplete'}\n限制：受控输入，不证明真实用户验收。\n`);
  stageEvidence(f,'make-decision',[{ref}]);return ref;
}
describe('final-chain report actual timing and original readback',()=>{
  it.each([[false,false,'skipped'],[true,false,'incomplete'],[true,true,'completed']])('delivery reached=%s PR=%s is %s only from actual event/readback',async(reached,pr,state)=>{
    const f=taskFixture();choice(f,'normal');
    put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+'\n## 交付声明\n声明要做提交 PR 交付。\n');
    await deliveryEvent(f,{reached,pr});
    const value=await report(f);expect(ringAt(value,10).state).toBe(state);
    if(state==='completed') { const basis=JSON.stringify(ringAt(value,10).basis);expect(basis).toContain('pr-readback');expect(basis).toContain('owned-head'); }
  });
  it('reads a complete ordinary human original, removes required observation, and restores the same bytes',async()=>{
    const f=taskFixture();choice(f,'normal');controlledWorkflow(f);const ref=humanEvent(f),raw=readFileSync(join(f.taskPath,ref),'utf8');
    const value=await report(f), get=v=>v.workflow_steps.find(r=>r.source==='workflows/make-decision/flows/normal/steps.json'&&r.step_slug==='normal-only');
    expect(get(value).state).toBe('completed');expect(JSON.stringify(get(value).basis)).toContain(ref);
    humanEvent(f,{observation:false});expect(get(await report(f)).state).not.toBe('completed');
    put(f.taskPath,ref,raw);expect(get(await report(f)).state).toBe('completed');
  });
  it('does not reuse a same-slug human original from another source',async()=>{
    const f=taskFixture();choice(f,'normal');controlledWorkflow(f);humanEvent(f,{source:'workflows/build-code/steps.json'});
    const value=await report(f);expect(value.workflow_steps.find(r=>r.step_slug==='normal-only').state).not.toBe('completed');
  });
});

// TCR204 + 213 + addendum218: real ordinary-source consumer, preserving old oracles.
function originalVerifier(root,expectedHash) {
  return (task,result,taskId) => {
    try {
      if(result.result_ref.startsWith('/')||result.result_ref.split('/').includes('..')||result.result_ref.includes('\0')) return 'unsafe original path';
      const path=join(root,result.result_ref);
      if(realpathSync(path)!==path) return 'original path alias/symlink';
      const raw=readFileSync(path,'utf8'), value=JSON.parse(raw);
      if(value.task_id!==taskId) return 'original task identity mismatch';
      if(hash(raw)!==expectedHash) return 'original sha256 mismatch';
      return null;
    } catch(error) {return `original unavailable: ${error.code??error.message}`;}
  };
}
function ordinaryOriginal() {
  const taskPath=temporary(), ref='quality/tests/owned-original.json';
  const raw=JSON.stringify({task_id:'owned-task',command:'node --test owned.test.mjs',exit_code:0,observation:'owned controlled test output'});
  put(taskPath,ref,raw);
  return {taskPath,ref,raw,task:{taskPath},input:outcomes('final-chain',ref),verifyEvidence:originalVerifier(taskPath,hash(raw))};
}
describe('final-chain kernel real consumer',()=>{
  it('accepts a real ordinary source only through explicit bound original verification',()=>{
    const f=ordinaryOriginal();
    expect(kernel.validateStepResults(f.input,'owned-task',[step],f.task,{workflow:'final-chain',verifyEvidence:f.verifyEvidence})).toEqual({results:f.input.step_results,refs:[f.ref]});
    expect(kernel.validateStepResults(f.input,'owned-task',[step],f.task,{workflow:'final-chain'}).error).toBeTypeOf('string');
  });
  it.each(['missing','hash','task'])('retains concrete verifier rejection for %s original',kind=>{
    const f=ordinaryOriginal();
    if(kind==='missing')rmSync(join(f.taskPath,f.ref));
    if(kind==='hash')put(f.taskPath,f.ref,f.raw+'\n');
    if(kind==='task')put(f.taskPath,f.ref,JSON.stringify({task_id:'foreign-task'}));
    const value=kernel.validateStepResults(f.input,'owned-task',[step],f.task,{workflow:'final-chain',verifyEvidence:f.verifyEvidence});
    expect(value.error).toContain(kind==='missing'?'original unavailable':kind==='hash'?'original sha256 mismatch':'original task identity mismatch');
  });
  it.each(['/etc/passwd','../owned.json','quality/tests/invalid\0.json','quality/evidence/portable-workflow-outcomes/build-prd/owned.json','quality/evidence/portable-workflow-outcomes/other/owned.json'])('cannot bypass unsafe or foreign outcome %j with a permissive callback',ref=>{
    const f=ordinaryOriginal();expect(kernel.validateStepResults(outcomes('final-chain',ref),'owned-task',[step],f.task,{workflow:'final-chain',verifyEvidence:()=>null}).error).toBeTypeOf('string');
  });
  it.each(['final-file','ancestor-directory'])('rejects %s symlink through the real original verifier',async(kind)=>{
    const {symlinkSync}=await import('node:fs');const f=ordinaryOriginal();
    if(kind==='final-file'){rmSync(join(f.taskPath,f.ref));const external=put(temporary(),'original.json',f.raw);symlinkSync(external,join(f.taskPath,f.ref));}
    else {rmSync(join(f.taskPath,'quality/tests'),{recursive:true});const external=temporary();put(external,'owned-original.json',f.raw);symlinkSync(external,join(f.taskPath,'quality/tests'),'dir');}
    expect(kernel.validateStepResults(f.input,'owned-task',[step],f.task,{workflow:'final-chain',verifyEvidence:f.verifyEvidence}).error).toContain('alias/symlink');
  });
  it('does not use an injected callback to replace build-prd attestation content validation',()=>{
    const f=ordinaryOriginal(), ref='quality/evidence/portable-workflow-outcomes/build-prd/owned.json', input=outcomes('build-prd',ref);
    put(f.taskPath,ref,{task_id:'owned-task',workflow:'build-prd',step_results:[{...input.step_results[0],status:'failed'}]});
    expect(kernel.validateStepResults(input,'owned-task',[step],f.task,{verifyEvidence:()=>null}).error).toContain('does not attest');
  });
  it.each(['wrong-task','wrong-workflow','duplicate-step','unknown-step'])('keeps structural %s guards with real source verification',kind=>{
    const f=ordinaryOriginal(), input=structuredClone(f.input);
    if(kind==='wrong-task')input.task_id='foreign-task';
    if(kind==='wrong-workflow')input.workflow='build-prd';
    if(kind==='duplicate-step')input.step_results.push({...input.step_results[0]});
    if(kind==='unknown-step')input.step_results.push({...input.step_results[0],step_id:2,step_slug:'unknown'});
    expect(kernel.validateStepResults(input,'owned-task',[step],f.task,{workflow:'final-chain',verifyEvidence:f.verifyEvidence}).error).toBeTypeOf('string');
  });
});
function runnerOriginalFixture() {
  const f=taskFixture();choice(f,'normal');
  const output='TAP version 13\n# controlled source\nok 1 - owned behavior\n1..1\n# tests 1\n# pass 1\n# fail 0\n';
  const evidence=commandEvidence(f,'owned-behavior','node --test owned.test.mjs',0,{task_id:'owned-task',output_sha256:hash(output)});
  put(f.taskPath,evidence.output_ref,output);
  const receiptRaw=readFileSync(join(f.taskPath,evidence.receipt_ref),'utf8');
  evidence.sha256=hash(receiptRaw);evidence.output_sha256=hash(output);
  stageEvidence(f,'make-decision',[evidence]);
  return {...f,evidence,receiptRaw,output};
}
describe('final-chain report real validator consumer',()=>{
  it('accepts bound ordinary test evidence, then rejects task/hash/output tampering and restores the original',async()=>{
    const f=runnerOriginalFixture(), receiptPath=join(f.taskPath,f.evidence.receipt_ref), outputPath=join(f.taskPath,f.evidence.output_ref);
    expect(ringAt(await report(f),8).state).toBe('completed');
    for(const kind of ['task','hash','output']) {
      if(kind==='task')put(f.taskPath,f.evidence.receipt_ref,JSON.stringify({...JSON.parse(f.receiptRaw),task_id:'foreign-task'}));
      if(kind==='hash')put(f.taskPath,f.evidence.receipt_ref,f.receiptRaw+'\n');
      if(kind==='output')put(f.taskPath,f.evidence.output_ref,'changed output bytes');
      const failed=await report(f);expect(ringAt(failed,8).state,kind).not.toBe('completed');
      expect(JSON.stringify([ringAt(failed,8).basis,failed.limits])).toMatch(/task|identity|sha256|hash|任务|身份|绑定/i);
      writeFileSync(receiptPath,f.receiptRaw);writeFileSync(outputPath,f.output);
      expect(ringAt(await report(f),8).state).toBe('completed');
    }
  });
  it('takes the actual validator rejection into the same runner ring rather than just recording calls',async()=>{
    const f=runnerOriginalFixture();expect(ringAt(await report(f),8).state).toBe('completed');
    vi.spyOn(kernel,'validateStepResults').mockReturnValue({error:'ORACLE-P2-VALIDATOR-REJECTED-ORIGINAL',failedStep:'owned-source',refs:[]});
    const failed=await report(f);
    expect(ringAt(failed,8).state).not.toBe('completed');
    expect(JSON.stringify([ringAt(failed,8).basis,failed.limits])).toContain('ORACLE-P2-VALIDATOR-REJECTED-ORIGINAL');
  });
  it.each(['missing','final-file-link','ancestor-link'])('does not complete runner evidence for %s source',async(kind)=>{
    const {symlinkSync}=await import('node:fs');const f=runnerOriginalFixture(), path=join(f.taskPath,f.evidence.receipt_ref);
    if(kind==='missing')rmSync(path);
    if(kind==='final-file-link'){rmSync(path);const external=put(temporary(),'receipt.json',f.receiptRaw);symlinkSync(external,path);}
    if(kind==='ancestor-link'){rmSync(join(f.taskPath,'quality/tests'),{recursive:true});const external=temporary();put(external,'owned-behavior.json',f.receiptRaw);put(external,'owned-behavior.output',f.output);symlinkSync(external,join(f.taskPath,'quality/tests'),'dir');}
    expect(ringAt(await report(f),8).state).not.toBe('completed');
  });
  it('does not promote a non-test exit 0 and preserves a real failing test as failure',async()=>{
    const f=taskFixture();choice(f,'normal');stageEvidence(f,'make-decision',[commandEvidence(f,'not-test','node generate-document.mjs',0)]);
    expect(ringAt(await report(f),8).state).not.toBe('completed');
    stageEvidence(f,'make-decision',[commandEvidence(f,'failing-test','node --test owned.test.mjs',1)]);
    const failed=await report(f);expect(ringAt(failed,8).state).toBe('incomplete');expect(JSON.stringify(ringAt(failed,8).basis)).toContain('failing-test');
  });
  it('does not create virtual result references or outcomes for absent sources',async()=>{
    const {existsSync}=await import('node:fs');const f=taskFixture({materials:false});
    const value=await report(f);expect(ringAt(value,8).state).toBe('unavailable');
    expect(existsSync(join(f.taskPath,'quality/evidence/portable-workflow-outcomes'))).toBe(false);
    for(const row of value.rings)for(const b of row.basis)if(b.evidence_level!==null)expect(b.ref).toBeTruthy();
  });
});

// TCR232/235/238 and E addendum239: canonical writers, not new persisted fields.
function writerIdentity(f,extra={}) {
  const manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));
  put(f.taskPath,'task.json',{...manifest,project_name:'workflowhub',...extra});
}
function actualWorkflowSources(f,level) {
  const source='workflows/make-decision/steps.json', root=JSON.parse(readFileSync(join(ROOT,source),'utf8'));
  put(f.repo,source,JSON.stringify(root));
  if(level!=='complex')put(f.repo,root.flows[level].steps,readFileSync(join(ROOT,root.flows[level].steps),'utf8'));
  else for(const stage of ['build-plan','build-code','verify-code'])put(f.repo,`workflows/${stage}/steps.json`,readFileSync(join(ROOT,`workflows/${stage}/steps.json`),'utf8'));
  return level==='complex'?source:root.flows[level].steps;
}
async function nativeProducerFixture() {
  const f=taskFixture();implementation(f);
  const {renameSync}=await import('node:fs');
  const canonical=join(f.root,'Projects/workflowhub/tasks/owned-task');mkdirSync(dirname(canonical),{recursive:true});renameSync(f.taskPath,canonical);f.taskPath=canonical;
  const targetRepo=f.repo, linked=join(f.root,'native-worktree');git(f,['worktree','add','-q','-b','task/workflowhub/owned-task',linked,'HEAD']);
  const linkedMaterial=join(linked,'specs/owned-task');mkdirSync(dirname(linkedMaterial),{recursive:true});renameSync(f.materialRoot,linkedMaterial);f.repo=linked;f.materialRoot=linkedMaterial;
  writerIdentity(f,{target_repo_root:targetRepo,workspace_mode:'existing',workspace_root:f.repo,record_model:'vnext-single-write',execution_mode:'per_invocation',issue_ids:[],inputs:{},created_at:'2026-10-20T00:00:00Z'});
  put(f.repo,'native-owned.test.mjs',"import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';test('controlled owned observation',()=>assert.equal(readFileSync(new URL('./native-value.txt',import.meta.url),'utf8'),'pass'));\n");
  const invoke=async(value,slug,priorReceipt)=>{
    put(f.repo,'native-value.txt',value);
    const input=put(f.taskPath,`quality/evidence/${slug}-input.json`,{argv:[process.execPath,'--test','native-owned.test.mjs'],slug,timeoutMs:15000,...(priorReceipt?{receipt_ref:priorReceipt.receipt_ref,output_ref:priorReceipt.output_ref}:{})});
    const prior=process.env.WORKFLOWHUB_TASK_DIR;process.env.WORKFLOWHUB_TASK_DIR=f.root;
    try{return await stageRuntimeCliMain(['verify','--action=execute','--stage=build-code','--project=workflowhub','--task=owned-task','--task-path='+f.taskPath,'--input='+input],{cwd:f.repo});}
    finally{if(prior===undefined)delete process.env.WORKFLOWHUB_TASK_DIR;else process.env.WORKFLOWHUB_TASK_DIR=prior;}
  };
  const red=await invoke('fail','native-controlled-red'),green=await invoke('pass','native-controlled-green');
  expect(red.exit_code,'SETUP: actual controlled test must fail before restoration').toBe(1);
  expect(green.exit_code,'SETUP: actual controlled test must pass after restoration').toBe(0);
  return {...f,red,green,invoke};
}
describe('final-chain report native producer seams',()=>{
  it('finds actual successful native evidence with no entry ref and retains old RED as history',async()=>{
    const f=await nativeProducerFixture(), rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse), row=rows.find(r=>r.stage==='build-code');
    expect(row.evidence.value.at(-1)).toMatchObject({command:JSON.stringify(f.green.argv),exit_code:0});
    expect(row.evidence.value.at(-1)).not.toHaveProperty('ref');expect(row.evidence.value.at(-1)).not.toHaveProperty('receipt_ref');
    const value=await report(f);expect(ringAt(value,8).state).toBe('completed');
    expect(JSON.stringify(ringAt(value,8).basis)).toContain(f.green.receipt_ref.split('/').at(-1));
    expect(readFileSync(f.red.output_ref,'utf8')).toContain('fail');
  });
  it('does not use an unrelated receipt named by the same stage source for a native successful evidence row',async()=>{
    const f=await nativeProducerFixture();const unrelated=commandEvidence(f,'unrelated-native','node --test other.test.mjs',0);
    const rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='build-code');
    await writeStageRow(f.taskPath,{...row,source:`receipt: ${unrelated.receipt_ref}; output: ${unrelated.output_ref}`,evidence:{value:[row.evidence.value.at(-1)],reason:'only a mismatched source pointer remains'}});
    rmSync(f.green.receipt_ref);rmSync(f.red.receipt_ref);
    expect(ringAt(await report(f),8).state).not.toBe('completed');
  });
  it('does not silently choose the last file when identical successful argv and exit have ambiguous native receipts',async()=>{
    const f=await nativeProducerFixture(),second=await f.invoke('pass','native-controlled-second',f.green);
    expect(second.exit_code).toBe(0);expect(second.receipt_ref).not.toBe(f.green.receipt_ref);
    expect(JSON.parse(readFileSync(second.receipt_ref,'utf8')).started_at).not.toBe(JSON.parse(readFileSync(f.green.receipt_ref,'utf8')).started_at);
    const rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='build-code');
    await writeStageRow(f.taskPath,{...row,source:'Native command fact; exact original pointer unavailable',evidence:{value:[row.evidence.value.at(-1)],reason:'No source pointer can disambiguate equal argv/exit/time.'}});
    expect(ringAt(await report(f),8).state).not.toBe('completed');
  });
  it('does not let a native success whose output has disappeared hide behind an earlier RED or file name',async()=>{
    const f=await nativeProducerFixture();rmSync(f.green.output_ref);
    expect(ringAt(await report(f),8).state).not.toBe('completed');
  });
});
describe('final-chain report index and scoped write-set sources',()=>{
  it('ignores an explanatory P<n> placeholder but still reads the actual indexed Phase',async()=>{
    const f=taskFixture();implementation(f);
    put(f.materialRoot,'phases/index.md','> 每个 `phases/P<n>.md` 恰好一行；这是说明，不是具体Phase。\n'+readFileSync(join(f.materialRoot,'phases/index.md'),'utf8'));
    const value=await report(f);expect(ringAt(value,6).state).toBe('completed');expect(value.limits.join(' ')).not.toContain('phases/P<n>.md');
  });
  it('does not discard a concrete indexed missing Phase while ignoring the placeholder',async()=>{
    const f=taskFixture();implementation(f);put(f.materialRoot,'phases/index.md',readFileSync(join(f.materialRoot,'phases/index.md'),'utf8')+'| P2 | `phases/P2.md` |\n> 说明 `phases/P<n>.md`\n');
    const value=await report(f);expect(ringAt(value,6).state).not.toBe('completed');expect(JSON.stringify([ringAt(value,6).basis,value.limits])).toContain('phases/P2.md');
  });
  it.each([['tests/fixtures/final-chain/owned/source.json',false],['tests/fixtures/final-chain-other/source.json',true],['tests/outside/source.json',true]])('matches only the declared trailing subtree for %s',async(path,conflict)=>{
    const f=taskFixture();implementation(f);
    put(f.materialRoot,'spec.md',readFileSync(join(f.materialRoot,'spec.md'),'utf8').replace('- **修改**：`owned.mjs`','- **修改**：`tests/fixtures/final-chain/**`'));
    put(f.materialRoot,'phases/P1.md',readFileSync(join(f.materialRoot,'phases/P1.md'),'utf8').replace('`owned.mjs`',`\`${path}\``));
    const value=await report(f);expect(ringAt(value,6).state).toBe(conflict?'incomplete':'completed');
    if(conflict)expect(JSON.stringify(ringAt(value,6))).toContain(path);
  });
});
describe('final-chain report real stage denominator sources',()=>{
  it.each(['small','normal','planning'])('uses the real %s flow and a canonical actual make-decision row as one stage',async(level)=>{
    const f=taskFixture();writerIdentity(f);choice(f,level);const source=actualWorkflowSources(f,level);
    await writeStageRow(f.taskPath,{stage:'make-decision',source:'quality/evidence/choice.md'});
    const value=await report(f),m=value.workflow_metrics;
    const expected=JSON.parse(readFileSync(join(ROOT,source),'utf8')).steps.map(row=>[source,row.step_slug]);
    expect(value.workflow_steps.filter(r=>r.stage==='make-decision').map(r=>[r.source,r.step_slug])).toEqual(expected);
    expect(m.stage_skip_rate).toBe(0);expect(m.stage_skip_denominator).toBe(1);expect(m.stage_skip_numerator).toBe(0);
    expect(m.declared_stages).toEqual(['make-decision']);expect(m.actual_stages.map(r=>typeof r==='string'?r:r.stage)).toEqual(['make-decision']);
    expect(m.stage_source_refs).toContain('facts.jsonl');
  });
  it('uses four confirmed complex formal sources and actual rows, without turning flows or unstarted build-prd into stages',async()=>{
    const f=taskFixture();writerIdentity(f);choice(f,'complex');actualWorkflowSources(f,'complex');
    const expected=['make-decision','build-plan','build-code','verify-code'];
    for(const stage of expected)await writeStageRow(f.taskPath,{stage,source:'quality/evidence/choice.md'});
    const value=await report(f),m=value.workflow_metrics;expect([...m.declared_stages].sort()).toEqual([...expected].sort());expect(m.stage_skip_denominator).toBe(4);expect(m.stage_skip_rate).toBe(0);
    expect(m.declared_stages).not.toContain('build-prd');
  });
  it('keeps absent route/actual identity unknown without a persisted candidate or skip field',async()=>{
    const f=taskFixture();writerIdentity(f);choice(f,'normal');actualWorkflowSources(f,'normal');
    const value=await report(f);expect(value.workflow_metrics.stage_skip_rate).toBeNull();expect(value.workflow_metrics.stage_skip_denominator).toBeNull();
    expect(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')).not.toMatch(/declared_stages|skipped_stages/);
  });
});

// TCR237/240: original semantic rules, exercised through actual runner inputs.
describe('final-chain report actual diff conflict',()=>{
  it('keeps a concrete outside-write-set conflict incomplete and restores the legal commit observation',async()=>{
    const f=taskFixture();implementation(f);const legalHead=git(f,['rev-parse','HEAD']);
    expect(ringAt(await report(f),7).state).toBe('completed');
    put(f.repo,'outside.mjs','export const outside = true;\n');git(f,['add','outside.mjs']);git(f,['commit','-qm','controlled outside-scope change']);
    const bad=await report(f);expect(ringAt(bad,7).state).toBe('incomplete');expect(JSON.stringify(ringAt(bad,7))).toContain('outside.mjs');
    expect(JSON.stringify([ringAt(bad,7).basis,bad.limits])).toContain('baseline');
    git(f,['checkout','--detach',legalHead]);expect(ringAt(await report(f),7).state).toBe('completed');
  });
});
async function closeMergeFixture({withPR=true}={}) {
  const f=taskFixture();implementation(f);writerIdentity(f);git(f,['branch','-M','task/workflowhub/owned-task']);git(f,['remote','add','origin','https://github.com/owned/fixture.git']);
  const head=git(f,['rev-parse','HEAD']);
  const mergeRef='quality/tests/owned-merge.json';
  put(f.taskPath,mergeRef,{argv:['git','merge','--ff-only','origin/main'],cwd:f.repo,exit_code:0,signal:null,timed_out:false,cancelled:false,truncated:false,output_ref:join(f.taskPath,'quality/tests/owned-merge.output')});
  put(f.taskPath,'quality/tests/owned-merge.output','Controlled merge observation; non-network fixture.\n');
  const evidence=[];let source=`Controlled delivered task; receipt: ${mergeRef}; output: quality/tests/owned-merge.output`;
  if(withPR){
    const ref='quality/tests/pr-post-merge.json',output='quality/tests/pr-post-merge.output',argv=['gh','pr','view','12','--repo','owned/fixture','--json','number,url,state,mergedAt,mergeCommit,headRefName,headRefOid,baseRefName,baseRefOid'];
    put(f.taskPath,ref,{argv,cwd:f.repo,exit_code:0,signal:null,timed_out:false,cancelled:false,truncated:false,started_at:'2026-10-20T00:00:00Z',ended_at:'2026-10-20T00:00:01Z',output_ref:join(f.taskPath,output)});
    put(f.taskPath,output,{number:12,url:'https://github.com/owned/fixture/pull/12',state:'MERGED',mergedAt:'2026-10-20T00:00:00Z',mergeCommit:{oid:head},headRefName:'task/workflowhub/owned-task',headRefOid:head,baseRefName:'main',baseRefOid:head});
    evidence.push({command:'gh pr view 12 and git remote branch readback after merge',exit_code:0,failure_signature:`PR MERGED; readback receipts ${ref} and siblings.`});source+=`; receipt: ${ref}; output: ${output}`;
  }
  await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source,close_action:{action:'merge',result:`Controlled task PR #12 merged with head ${head}.`,ref:mergeRef},evidence:{value:evidence.length?evidence:null,reason:evidence.length?'Actual-shape controlled PR original.':'PR original unavailable; merge event still observed.'}});
  return f;
}
describe('final-chain report canonical merged delivery',()=>{
  it('reads the existing close_action merge plus the task-bound native PR original',async()=>{
    const f=await closeMergeFixture(),value=await report(f);expect(ringAt(value,10).state).toBe('completed');expect(JSON.stringify(ringAt(value,10).basis)).toContain('pr-post-merge');
  });
  it('keeps a proven delivered merge without its required PR original incomplete',async()=>{
    const f=await closeMergeFixture({withPR:false});expect(ringAt(await report(f),10).state).toBe('incomplete');
  });
  it('does not turn an unbound merge mention into a verified delivery time',async()=>{
    const f=taskFixture();writerIdentity(f);await writeStageRow(f.taskPath,{stage:'make-decision',source:'Some other task may have merged; no actual bound event'});
    expect(ringAt(await report(f),10).state).toBe('unavailable');
  });
  it('does not accept an unrelated repository/head PR original for the same merge row',async()=>{
    const f=await closeMergeFixture();put(f.taskPath,'quality/tests/pr-post-merge.output',{number:12,url:'https://github.com/foreign/repo/pull/12',state:'MERGED',headRefName:'foreign-head',baseRefName:'main'});
    expect(ringAt(await report(f),10).state).not.toBe('completed');
  });
});
// TCR335/independent337: real owned source and real process output for existing research claims.
async function prepareOwnedResearchSources(f) {
  writerIdentity(f);
  put(f.materialRoot,'owned.mjs',[
    '// Controlled source fixture; no production or external system is involved.',
    '// Lines 3–9 are the interface actually read by the report.',
    'export function observe(values) {',
    "  if (!Array.isArray(values)) throw new TypeError('expected object array');",
    "  if (!values.every(value => value !== null && typeof value === 'object')) throw new TypeError('expected object array');",
    '  return values.length;',
    '}',
    'export const inputKind = \'object array\';',
    'export const failureIsExplicit = true;',
  ].join('\n')+'\n');
  put(f.materialRoot,'owned-module.mjs',"export { observe, inputKind, failureIsExplicit } from './owned.mjs';\n");
  put(f.materialRoot,'caller.mjs',[
    "import { observe } from './owned-module.mjs';",
    "import assert from 'node:assert/strict';",
    '// Controlled caller consumes both the valid input and explicit failure.',
    'const values = [{ observed: true }];',
    'assert.equal(observe(values), 1);',
    "console.log('input: object array accepted');",
    'let received;',
    'try { observe(\'invalid string\'); } catch (error) { received = error; }',
    "assert.equal(received?.message, 'expected object array');",
    "console.log('observation: explicit expected object array error');",
    "console.log('caller: error received and checked');",
    "console.log('coverage: valid array and invalid string; external services not checked');",
  ].join('\n')+'\n');
  mkdirSync(join(f.taskPath,'quality/tests'),{recursive:true});
  const receipt=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'research-caller',argv:[process.execPath,join(f.materialRoot,'caller.mjs')],timeoutMs:10000});
  if(receipt.exit_code!==0||receipt.signal||receipt.timed_out||receipt.cancelled)throw Error('SETUP: actual owned research producer failed');
  const raw=readFileSync(receipt.output_ref,'utf8');
  if(raw!==['input: object array accepted','observation: explicit expected object array error','caller: error received and checked','coverage: valid array and invalid string; external services not checked',''].join('\n'))throw Error('SETUP: owned research output differs from actual independent observation');
  await writeStageRow(f.taskPath,{stage:'build-code',source:`receipt: ${receipt.receipt_ref}; output: ${receipt.output_ref}`,evidence:{value:[{command:JSON.stringify(receipt.argv),exit_code:receipt.exit_code,failure_signature:'output: '+receipt.output_ref,receipt_ref:receipt.receipt_ref,output_ref:receipt.output_ref}]}});
  f.researchReceipt=receipt;
}

async function nestedResearch(f,{referenced=true,body}={}) {
  if(body===undefined)await prepareOwnedResearchSources(f);
  const ref='quality/evidence/research/owned-module-design-facts.md';
  put(f.taskPath,ref,body??'# Controlled module research\n## 来源与覆盖\n来源：当前owned-module.mjs原始接口与调用者。\n查了：实际输入、输出和失败分支。\n实际观察：调用方接收明确错误，未伪造成功。\n没查：外部在线服务。限制：受控读取，不冒外部效果。\n具名来源：owned-module.mjs:1、owned.mjs:3–9、caller.mjs:5–11；原始执行输出：'+f.researchReceipt.output_ref+':1–4。\n');
  if(referenced)put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+`\n## 外置事实索引\n| ref | 读取时机 |\n| --- | --- |\n| \`${ref}\` | 逐模块调研事实、来源与覆盖 |\n`);
  return ref;
}
describe('final-chain report explicit nested research source',()=>{
  it('reads the explicitly referenced nested same-task original with provenance',async()=>{
    const f=taskFixture();const ref=await nestedResearch(f);const value=await report(f);expect(ringAt(value,3).state).toBe('completed');expect(JSON.stringify(ringAt(value,3).basis)).toContain(ref);expect(JSON.stringify(ringAt(value,3).basis)).toContain(hash(readFileSync(join(f.taskPath,ref),'utf8')));
  });
  it.each(['unreferenced','empty','missing','symlink'])('does not complete %s nested research by basename or directory presence',async(kind)=>{
    const f=taskFixture(),ref=await nestedResearch(f,{referenced:kind!=='unreferenced',...(kind==='empty'?{body:'# research\n'}:{})});
    if(kind==='missing')rmSync(join(f.taskPath,ref));
    if(kind==='symlink'){const{symlinkSync}=await import('node:fs');const raw=readFileSync(join(f.taskPath,ref),'utf8');rmSync(join(f.taskPath,ref));symlinkSync(put(temporary(),'external-research.md',raw),join(f.taskPath,ref));}
    expect(ringAt(await report(f),3).state).not.toBe('completed');
  });
});

async function ordinaryContractFixture() {
  const f=taskFixture();writerIdentity(f);choice(f,'normal');
  const command='node --test tests/owned.test.mjs';
  const spec='# Controlled contract\n- **FR-001**：Visible owned result.\n- [ ] **AC-001 — visible result**\n  - **需求**：FR-001\n  - **通过条件**：visible result is returned.\n  - **失败条件**：result is lost.\n## 5. 功能需求\nFR-001 owns output.\n## 验收流程\nRead actual output.\n## 测试标准\nObserve success and failure.\n## 架构边界\nOnly owned source.\n## 实现设计（全局权威）\n### Code Anchors\n`README.md` owns visible output.\n### Interfaces and Failure Semantics\nReturn visible output and preserve failure.\n### Requirement-to-Task Trace\n| source | FR | AC | task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 |\n### Global Verification Strategy\n`'+command+'`\n';
  const index='# Phase index\n## Execution Index\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1.md` | `phase-p1` | `README.md` | `none` | build-code |\n';
  const phase=['# Phase P1 — owned result','- **Global spec**：`spec.md`','- **Write set**：`README.md`','- **Dependency**：none','- **Consumer**：build-code','## L0 — Outcome','- **gate_cmd**：`'+command+'`','- **expected_exit**：RED nonzero; GREEN 0','- **oracle**：ORACLE-P1','- **evidence_path**：quality/tests/owned.output','- **STOP**：preserve actual failure','- **Done**：real target result','## L1 — Contract','### T001 — deliver owned result','- **Source / FR / AC**：R-001 / FR-001 / AC-001','- **Files / symbols**：`README.md` symbol: N/A — fixture source text','- **Action**：return the owned result','- **Inputs**：owned input and a negative case','- **Outputs / failure**：visible output or explicit failure','- **Boundary / DO NOT TOUCH**：no external repository changes','- **Dependency**：none','- **Test tier / skill**：feature / backend-testing','- **Scenario / fixture or service**：owned local result','- **RED/GREEN gate_cmd**：`'+command+'`','- **expected_exit**：RED target nonzero; GREEN 0','- **RED target failure**：ORACLE-P1 assertion fails when result lost','- **GREEN oracle**：ORACLE-P1 visible output assertion','- **Evidence**：quality/tests/owned.output','- **STOP / recovery**：preserve failure and continue safe repair','- **Coverage limit**：no external provider quality','- **Done**：real result and evidence','## L2 — Removable reference','Owned fixture, not a workflow permit.',''].join('\n');
  put(f.materialRoot,'spec.md',spec);put(f.materialRoot,'phases/index.md',index);put(f.materialRoot,'phases/P1.md',phase);
  const script=put(f.root,'validatePostPhaseContract.mjs',`import{readFileSync}from'node:fs';import{join}from'node:path';import{validatePostPhaseContract}from${JSON.stringify(join(ROOT,'runtime/stage/stage-content-contracts.mjs'))};const root=process.argv[2],read=n=>readFileSync(join(root,n),'utf8');const result=validatePostPhaseContract({spec:read('spec.md'),index:read('phases/index.md'),phases:{'phases/P1.md':read('phases/P1.md')}});console.log(JSON.stringify(result));process.exitCode=result.ok?0:1;`);
  mkdirSync(join(f.taskPath,'quality/tests'),{recursive:true});
  const producer=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'actual-ordinary-contract',argv:[process.execPath,script,f.materialRoot],timeoutMs:10000});
  const run={status:producer.exit_code,stdout:readFileSync(producer.output_ref,'utf8'),stderr:''};
  expect(run.status,`SETUP: current public checker must validate controlled input: ${run.stdout} ${run.stderr}`).toBe(0);
  const actual=JSON.parse(run.stdout),ref='quality/evidence/current-contract-original.json';
  put(f.taskPath,ref,{command:`${process.execPath} ${script} ${f.materialRoot}`,exit_code:run.status,contract:{...actual,error_count:actual.errors.length}});
  await writeStageRow(f.taskPath,{stage:'make-decision',source:`${ref}; receipt: ${producer.receipt_ref}; output: ${producer.output_ref}`,evidence:{value:[{command:JSON.stringify(producer.argv),exit_code:producer.exit_code,receipt_ref:producer.receipt_ref,output_ref:producer.output_ref,failure_signature:'Actual ordinary checker producer; output: '+producer.output_ref}]}});
  return {...f,ref,actual,producer,script};
}
describe('final-chain report ordinary contract applicability',()=>{
  it('retains actual current ordinary checker facts after unrelated prose changes',async()=>{
    const f=await ordinaryContractFixture(),before=await report(f);expect(ringAt(before,5).state).toBe('completed');
    expect(JSON.stringify(ringAt(before,5).basis)).toContain('声明');
    put(f.materialRoot,'spec.md',readFileSync(join(f.materialRoot,'spec.md'),'utf8')+'\n<!-- Unrelated editorial explanation, no checked structure or rule anchor changed. -->\n');
    expect(ringAt(await report(f),5).state).toBe('completed');
  });
  it.each(['wrong-material-root','missing-contract-body','unreadable-original'])('keeps %s contract evidence unavailable rather than inventing pass or business failure',async(kind)=>{
    const f=await ordinaryContractFixture();
    if(kind==='wrong-material-root'){const value=JSON.parse(readFileSync(join(f.taskPath,f.ref),'utf8'));value.command='validatePostPhaseContract current input /unrelated/material-root';put(f.taskPath,f.ref,value);}
    if(kind==='missing-contract-body')put(f.taskPath,f.ref,{command:`validatePostPhaseContract current input ${f.materialRoot}`,exit_code:0});
    if(kind==='unreadable-original')rmSync(join(f.taskPath,f.ref));
    expect(ringAt(await report(f),5).state).toBe('unavailable');
  });
  it('does not reuse a prior actual contract when an identified checked Phase dependency became invalid',async()=>{
    const f=await ordinaryContractFixture();
    put(f.materialRoot,'phases/P1.md',readFileSync(join(f.materialRoot,'phases/P1.md'),'utf8').replace('- **Dependency**：none','- **Dependency**：P999'));
    const value=await report(f);expect(ringAt(value,5).state).not.toBe('completed');
    expect(JSON.stringify([ringAt(value,5).basis,value.limits])).toMatch(/dependency|依赖|P999|无法|未取得|范围|适用/i);
  });
});

// TCR259/263, independent264: only legal decision depth and observed Git paths.
describe('final-chain report legal decision heading depth',()=>{
  it.each(['###','####'])('counts a sourced complete %s D decision with real nonempty advisory execution',async(depth)=>{
    const f=taskFixture();writerIdentity(f);
    put(f.materialRoot,'decision-log.md',`# Controlled decision\n## 任务身份\n任务：owned-task\n## 原始需求\nR-001：实际原件与失败不伪造。\n## 工作包与决定\n### 工作包 — owned result\n${depth} D-001 — owned bounded decision\n- **做什么**：只读真实原件。\n- **不做什么**：不虚构成功。\n- **风险**：来源不足必须暴露。\n- **改动**：只改当前已声明写集。\n- module: owned\n- requirement_ids: [R-001]\n- derived_from: []\n- artifacts: [owned.mjs]\n来源：quality/evidence/choice.md\n## 未决项\n无真实未知。\n`);
    put(f.taskPath,'quality/evidence/choice.md','Controlled source: user chose bounded readback and preserving failures.\n');
    const {captureCommand}=await import('../../runtime/interface/run-command.mjs');mkdirSync(join(f.taskPath,'quality/tests'),{recursive:true});
    const receipt=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'owned-decision-check',argv:[process.execPath,join(ROOT,'tools/cli/check-decision-log-chain.mjs'),'--file',join(f.materialRoot,'decision-log.md')]});
    expect(receipt.exit_code).toBe(0);
    await writeStageRow(f.taskPath,{stage:'make-decision',source:`receipt: ${receipt.receipt_ref}; output: ${receipt.output_ref}`,evidence:{value:[{command:JSON.stringify(receipt.argv),exit_code:receipt.exit_code,failure_signature:'advisory actual nonempty file scan'}],reason:'Actual advisory checker, not an invented pass.'}});
    expect(ringAt(await report(f),2).state).toBe('completed');
  });
});
describe('final-chain report Unicode Git path identity',()=>{
  it('keeps Unicode and space paths inside their exact declaration, reports a real Unicode outside path, then restores',async()=>{
    const f=taskFixture();implementation(f);const inside='界面/新 页.mjs',outside='真正越界.mjs';
    put(f.materialRoot,'spec.md',readFileSync(join(f.materialRoot,'spec.md'),'utf8').replace('- **修改**：`owned.mjs`',`- **修改**：\`owned.mjs\`、\`${inside}\``));
    put(f.materialRoot,'phases/P1.md',readFileSync(join(f.materialRoot,'phases/P1.md'),'utf8').replace('- **Write set**：`owned.mjs`',`- **Write set**：\`owned.mjs\`、\`${inside}\``));
    put(f.repo,inside,'export const text = "真实中文路径";\n');git(f,['add',inside]);git(f,['commit','-qm','controlled Unicode path']);const legal=git(f,['rev-parse','HEAD']);
    const value=await report(f),basis=ringAt(value,7).basis.find(b=>Array.isArray(b.changed_files));
    expect(basis).toBeDefined();expect(basis.changed_files).toContain(inside);expect(basis.changed_files.some(path=>path.startsWith('"')||path.includes('\\347'))).toBe(false);expect(ringAt(value,7).state).toBe('completed');
    put(f.repo,outside,'export const outside = true;\n');git(f,['add',outside]);git(f,['commit','-qm','controlled Unicode outside path']);
    const bad=await report(f);expect(ringAt(bad,7).state).toBe('incomplete');expect(JSON.stringify(ringAt(bad,7))).toContain(outside);
    git(f,['checkout','--detach',legal]);expect(ringAt(await report(f),7).state).toBe('completed');
  });
});

// TCR252/241/262 + addendum267: exact parent RAW; never a general reader root.
function parentRawFixture(form='parent-definition') {
  const root=temporary(),repo=join(root,'repo'),nonce=randomUUID().slice(0,8),childId=`child-${nonce}`,parentId=`parent-${nonce}`;
  const taskPath=join(root,'Projects/workflowhub/tasks',childId),parentRoot=join(root,'Projects/workflowhub/tasks',parentId),materialRoot=join(repo,'specs',childId);
  mkdirSync(materialRoot,{recursive:true});const rawRef=`quality/evidence/raw-requirements/original-${nonce}.md`,rawPath=join(parentRoot,rawRef),raw=`Controlled original ${nonce}: preserve exact requirement provenance and expose missing facts.\n`;
  const manifest={schema_version:'1.0.0',project_name:'workflowhub',task_id:childId,target_repo_root:repo,activation_cohort:'post',baseline_commit:'HEAD',inputs:{}};
  put(taskPath,'task.json',manifest);put(taskPath,'facts.jsonl','');
  put(parentRoot,'task.json',{...manifest,task_id:parentId,inputs:{raw_requirement:{ref:rawRef,sha256:hash(raw)}}});put(parentRoot,'facts.jsonl','');put(parentRoot,rawRef,raw);
  put(materialRoot,'decision-log.md',`# Controlled child\n## 任务身份\n任务：${childId}\n## 原始需求\n父原需由以下唯一具名来源核验。\n`);
  if(form==='spec-parent-prd') {
    const prdRef=`specs/archive/${parentId}/prd.md`;put(repo,prdRef,`# Parent PRD\n[raw](<${rawPath}>)\n`);
    put(materialRoot,'spec.md',`# Child spec\n父任务库：\`${parentRoot}\`\n父 PRD：\`${prdRef}\`\n父原始需求由该PRD的raw精确引用核验，不是旁边known-red。\n`);
  } else if(form==='parent-definition')put(materialRoot,'spec.md',`# Child spec\n下文 \`parent:\` 指父任务库 \`${parentRoot}\`。\n原始需求：\`parent:${rawRef}\`\n`);
  else {
    const researchRef=`quality/evidence/decision-log-refs/research-${nonce}-raw.md`;
    put(taskPath,researchRef,`# Child named RAW research\n原始需求 RAW：\`${rawPath}\`\n来源与覆盖：只核这一份已具名原需；未读旁文件。\n`);
    put(materialRoot,'decision-log.md',readFileSync(join(materialRoot,'decision-log.md'),'utf8')+`\n## 外置事实索引\n原需研究：\`${researchRef}\`\n`);
  }
  return {root,repo,taskPath,parentRoot,materialRoot,childId,parentId,rawRef,rawPath,raw,form};
}
function editParent(f,change) {const value=JSON.parse(readFileSync(join(f.parentRoot,'task.json'),'utf8'));change(value);put(f.parentRoot,'task.json',value);}
describe('final-chain report exact parent RAW boundary',()=>{
  it.each(['spec-parent-prd','parent-definition','named-research'])('consumes only the exact same-project parent original through %s',async(form)=>{
    const f=parentRawFixture(form),value=await report(f);expect(value.task_id).toBe(f.childId);expect(ringAt(value,1).state).toBe('completed');
    expect(JSON.stringify(ringAt(value,1).basis)).toContain(hash(f.raw));expect(JSON.stringify(ringAt(value,1).basis)).toContain(f.rawRef);
  });
  it('prefers an existing valid child raw input over parent source and keeps the two identities distinct',async()=>{
    const f=parentRawFixture(),ref='quality/evidence/raw-requirements/child-original.md',raw='Controlled child-owned exact original.\n';put(f.taskPath,ref,raw);
    const manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));manifest.inputs.raw_requirement={ref,sha256:hash(raw)};put(f.taskPath,'task.json',manifest);
    const value=await report(f);expect(ringAt(value,1).state).toBe('completed');expect(JSON.stringify(ringAt(value,1).basis)).toContain(hash(raw));expect(JSON.stringify(ringAt(value,1).basis)).not.toContain(hash(f.raw));
  });
  it.each(['wrong-id','missing-id','wrong-project','missing-project','wrong-repo','missing-repo'])('rejects %s parent manifest identity without equating parent and child IDs',async(kind)=>{
    const f=parentRawFixture();editParent(f,p=>{if(kind==='wrong-id')p.task_id='other-parent';if(kind==='missing-id')delete p.task_id;if(kind==='wrong-project')p.project_name='foreign-project';if(kind==='missing-project')delete p.project_name;if(kind==='wrong-repo')p.target_repo_root=f.root;if(kind==='missing-repo')delete p.target_repo_root;});
    expect(ringAt(await report(f),1).state).toBe('unavailable');
  });
  it.each(['missing-hash','bad-hash','changed-bytes','absolute-ref','traversal-ref'])('rejects %s in the declared parent exact input',async(kind)=>{
    const f=parentRawFixture();
    if(kind==='changed-bytes')put(f.parentRoot,f.rawRef,f.raw+'changed');
    else editParent(f,p=>{if(kind==='missing-hash')delete p.inputs.raw_requirement.sha256;if(kind==='bad-hash')p.inputs.raw_requirement.sha256='not-a-hash';if(kind==='absolute-ref')p.inputs.raw_requirement.ref=f.rawPath;if(kind==='traversal-ref')p.inputs.raw_requirement.ref='../outside.md';});
    expect(ringAt(await report(f),1).state).toBe('unavailable');
  });
  it.each(['manifest-link','raw-link','raw-ancestor-link','parent-root-alias','manifest-hardlink','raw-hardlink','raw-directory'])('rejects %s while keeping the parent root outside general reader authority',async(kind)=>{
    const {symlinkSync,linkSync,renameSync}=await import('node:fs');const f=parentRawFixture(),manifest=join(f.parentRoot,'task.json');
    if(kind==='manifest-link'){const raw=readFileSync(manifest);rmSync(manifest);symlinkSync(put(f.root,'external-parent.json',raw.toString()),manifest);}
    if(kind==='raw-link'){rmSync(f.rawPath);symlinkSync(put(f.root,'external-raw.md',f.raw),f.rawPath);}
    if(kind==='raw-ancestor-link'){const dir=dirname(f.rawPath),external=join(f.root,'external-raw-directory');renameSync(dir,external);symlinkSync(external,dir,'dir');}
    if(kind==='parent-root-alias'){const external=join(f.root,'aliased-parent-directory');renameSync(f.parentRoot,external);symlinkSync(external,f.parentRoot,'dir');}
    if(kind==='manifest-hardlink')linkSync(manifest,join(f.root,'parent-manifest-second-link.json'));
    if(kind==='raw-hardlink')linkSync(f.rawPath,join(f.root,'parent-raw-second-link.md'));
    if(kind==='raw-directory'){rmSync(f.rawPath);mkdirSync(f.rawPath);}
    expect(ringAt(await report(f),1).state).toBe('unavailable');
  });
  it.each(['short-parent-name','arbitrary-source','conflicting-parents','unreferenced-same-name','second-research-hop'])('does not discover an exact parent original from %s',async(kind)=>{
    const f=parentRawFixture(kind==='second-research-hop'?'named-research':'parent-definition');
    if(kind==='short-parent-name')put(f.materialRoot,'spec.md',`# Spec\n父任务：${f.parentId}\n`);
    if(kind==='arbitrary-source')put(f.materialRoot,'spec.md',`# Spec\nsource: ${f.rawPath}\n`);
    if(kind==='unreferenced-same-name')put(f.materialRoot,'spec.md','# Spec\nRaw filename may exist somewhere, but no source was declared.\n');
    if(kind==='conflicting-parents') {
      const other=join(f.root,'Projects/workflowhub/tasks',`other-${randomUUID().slice(0,8)}`);mkdirSync(other,{recursive:true});
      put(f.materialRoot,'spec.md',readFileSync(join(f.materialRoot,'spec.md'),'utf8')+`\n另一个同等parent:父任务库 \`${other}\`，与上述父来源冲突未决定。\n`);
    }
    if(kind==='second-research-hop'){
      const first=`quality/evidence/decision-log-refs/research-${f.childId.slice(6)}-raw.md`,second='quality/evidence/decision-log-refs/not-directly-named.md';
      put(f.taskPath,first,`# First research\n下一研究：\`${second}\`\n`);put(f.taskPath,second,`# Second research\n原始RAW：\`${f.rawPath}\`\n`);
    }
    expect(ringAt(await report(f),1).state).toBe('unavailable');
  });
  it('does not promote the nearby known-red file or extend other ring read permissions',async()=>{
    const f=parentRawFixture(),sideRef='quality/evidence/raw-requirements/known-red.md',side='Controlled historical disposition; not original requirements.\n';put(f.parentRoot,sideRef,side);
    put(f.materialRoot,'spec.md',readFileSync(join(f.materialRoot,'spec.md'),'utf8')+`\n[red-decision](<${join(f.parentRoot,sideRef)}>)\n`);
    const research='quality/evidence/research/not-approved-side-research.md';put(f.parentRoot,research,'# Parent side research\n## 来源与覆盖\n来源：owned interface; 实际观察：controlled result; 限制：not authorized for child ring3.\n');
    put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+`\n## 外置事实索引\n调研来源：\`${join(f.parentRoot,research)}\`\n`);
    const value=await report(f);expect(ringAt(value,1).state).toBe('completed');expect(JSON.stringify(ringAt(value,1).basis)).not.toContain(sideRef);expect(JSON.stringify(ringAt(value,1).basis)).not.toContain(hash(side));expect(ringAt(value,3).state).not.toBe('completed');
  });
  it('downgrades changed parent bytes and identity, restores the same original, and leaves all source bytes read-only',async()=>{
    const {existsSync}=await import('node:fs');const f=parentRawFixture(),parentManifest=readFileSync(join(f.parentRoot,'task.json'),'utf8'),childManifest=readFileSync(join(f.taskPath,'task.json'),'utf8');
    expect(ringAt(await report(f),1).state).toBe('completed');put(f.parentRoot,f.rawRef,f.raw+'tampered');
    const altered=await report(f);expect(ringAt(altered,1).state).toBe('unavailable');expect(JSON.stringify([ringAt(altered,1).basis,altered.limits])).toMatch(/hash|sha256|原件|匹配|绑定/i);
    put(f.parentRoot,f.rawRef,f.raw);expect(ringAt(await report(f),1).state).toBe('completed');
    editParent(f,p=>{p.task_id='foreign-parent';});expect(ringAt(await report(f),1).state).toBe('unavailable');put(f.parentRoot,'task.json',parentManifest);
    expect(ringAt(await report(f),1).state).toBe('completed');
    expect(readFileSync(join(f.parentRoot,'task.json'),'utf8')).toBe(parentManifest);expect(readFileSync(join(f.taskPath,'task.json'),'utf8')).toBe(childManifest);expect(readFileSync(f.rawPath,'utf8')).toBe(f.raw);
    expect(readFileSync(join(f.parentRoot,'facts.jsonl'),'utf8')).toBe('');expect(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')).toBe('');
    expect(existsSync(join(f.taskPath,'quality/evidence/raw-requirements'))).toBe(false);expect(existsSync(join(f.taskPath,'quality/evidence/portable-workflow-outcomes'))).toBe(false);
  });
});

// TCR285 / independent291+292: real source forms, no new persisted protocol.
async function sourceShapeResearch(f,body,{alsoMethod=false}={}) {
  if(body===observedResearch)await prepareOwnedResearchSources(f);
  if(body===observedResearch){body=body.replaceAll('owned-check.output',f.researchReceipt.output_ref);f.ownedResearchBody=body;}
  const ref='quality/evidence/research/observed-interface-facts.md';put(f.taskPath,ref,body);
  put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+`\n## 外置事实索引\n| 原件 | 何时读 | 用途 |\n| --- | --- | --- |\n| \`${ref}\` | 核接口形状时读 | 本任务实际研究的来源、观察和覆盖限制 |\n`);
  if(alsoMethod)put(f.taskPath,'quality/evidence/earlier-research-method.md','# Deep Research\n## 来源与覆盖\n执行研究时应记录来源和覆盖；尚未执行本任务研究。\n');
  return ref;
}
const observedResearch='# 本任务接口实测事实\n工作区为本次受控任务，取值均为本次实读。\n## A. 接口与调用方\nA1 输入实际为对象数组，不是字符串。原始来源：owned.mjs:3–9与caller.mjs:5–11。\nA2 实际调用返回显式错误，原始输出owned-check.output:1–4；调用者已消费该错误。\n实际检查范围：输入字段与失败返回；未查在线服务和其他模块，不能证明在线效果。\n';
describe('final-chain report research source content identity',()=>{
  it('uses the current explicitly consumed nested report without a frozen heading, rather than a method backup',async()=>{
    const f=taskFixture(),ref=await sourceShapeResearch(f,observedResearch,{alsoMethod:true});const value=await report(f);
    expect(ringAt(value,3).state).toBe('completed');expect(JSON.stringify(ringAt(value,3).basis)).toContain(ref);expect(JSON.stringify(ringAt(value,3).basis)).not.toContain('earlier-research-method.md');
  });
  it.each([
    ['decision history','# 决策日志（decision-log）\n读者：本任务make-decision主会话。状态：历史make-decision已确认。\n## 来源与覆盖\n后续作者应读取本日志与研究原件；本文件没有本次实际研究观察。\n'],
    ['method backup','---\nname: deep-research\ndescription: 调研方向问题的方法\n---\n# Deep Research\n## 来源与覆盖\n研究者应按R0–R5读取来源、记录覆盖和不确定性。这里是方法说明，不含本任务实际观察。\n'],
    ['keyword-only','# Research\n来源与覆盖。研究。完成。\n'],
  ])('does not complete research from %s content under the same generic reference',async(_label,body)=>{
    const f=taskFixture();await sourceShapeResearch(f,body);expect(ringAt(await report(f),3).state).not.toBe('completed');
  });
  it('changes only the actual report bytes to a method and restores the original observation',async()=>{
    const f=taskFixture(),ref=await sourceShapeResearch(f,observedResearch);
    expect(ringAt(await report(f),3).state).toBe('completed');
    put(f.taskPath,ref,'# Research Method\n## 来源与覆盖\n应当记录来源与覆盖，尚未执行研究。\n');expect(ringAt(await report(f),3).state).not.toBe('completed');
    put(f.taskPath,ref,f.ownedResearchBody);expect(ringAt(await report(f),3).state).toBe('completed');
  });
});
async function historicalExecutionFixture({authenticated=true}={}) {
  const f=await nativeProducerFixture(),oldWorkspace=f.repo,manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8')),target=manifest.target_repo_root;
  const baseline=manifest.baseline_commit,branch=git(f,['branch','--show-current']),head=git(f,['rev-parse','HEAD']);
  if(authenticated)put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+`\n## 历史任务身份\n本任务读取基准：认证 worktree \`${oldWorkspace}\`，分支 \`${branch}\`，基线提交 \`${baseline}\`；该工作区属于 owned-task 的本次受控执行，已实际回收。\n`);
  const mainMaterial=join(target,'specs/owned-task');mkdirSync(dirname(mainMaterial),{recursive:true});
  const {renameSync}=await import('node:fs');renameSync(f.materialRoot,mainMaterial);
  rmSync(join(oldWorkspace,'native-owned.test.mjs'));rmSync(join(oldWorkspace,'native-value.txt'));
  git({repo:target},['worktree','remove',oldWorkspace]);
  const next={...manifest};delete next.workspace_mode;delete next.workspace_root;put(f.taskPath,'task.json',next);
  await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source:'Controlled own worktree cleanup after preserving native receipt and source identity',close_action:{action:'worktree_cleanup',result:`Removed owned task worktree ${oldWorkspace}; original task head ${head} preserved.`}});
  return {...f,repo:target,materialRoot:mainMaterial,oldWorkspace,branch,baseline,head};
}
describe('final-chain report native historical identity and absolute refs',()=>{
  it('records authenticated same-task historical execution after its owned workspace was removed, with snapshot limits',async()=>{
    const f=await historicalExecutionFixture(),value=await report(f),ring=ringAt(value,8);
    expect(ring.state).toBe('completed');expect(JSON.stringify([ring.basis,value.limits])).toContain(f.oldWorkspace);
    expect(JSON.stringify([ring.basis,value.limits])).toMatch(/历史|historical/i);expect(JSON.stringify([ring.basis,value.limits])).toMatch(/不证明|不能证明|does not prove|cannot prove/i);
    expect(JSON.stringify(ring.basis)).toContain(hash(readFileSync(f.green.receipt_ref,'utf8')));
  });
  it('keeps a removed historical cwd without a certified task workspace declaration unavailable',async()=>{
    const f=await historicalExecutionFixture({authenticated:false});expect(ringAt(await report(f),8).state).toBe('unavailable');
  });
  it('normalizes a unique absolute same-task receipt/output without leaking a rejected fallback-root error',async()=>{
    const f=await nativeProducerFixture(),value=await report(f);expect(ringAt(value,8).state).toBe('completed');
    expect(value.limits.some(note=>note.includes(f.green.receipt_ref)&&note.includes('original escapes allowed root'))).toBe(false);
    expect(value.limits.some(note=>note.includes(f.green.output_ref)&&note.includes('original escapes allowed root'))).toBe(false);
  });
  it('does not turn a root-prefix lookalike or an unknown old cwd into an accepted historical execution',async()=>{
    const f=runnerOriginalFixture(),raw=JSON.parse(f.receiptRaw);raw.cwd=join(f.root,'repo-lookalike-task');put(f.taskPath,f.evidence.receipt_ref,raw);
    expect(ringAt(await report(f),8).state).not.toBe('completed');
    raw.cwd=f.repo;raw.output_ref=put(f.root,'task-lookalike/quality/tests/owned.output',f.output);put(f.taskPath,f.evidence.receipt_ref,raw);
    expect(ringAt(await report(f),8).state).not.toBe('completed');
  });
  it('downgrades a historical receipt identity/hash mismatch and restores the original bound execution',async()=>{
    const f=await historicalExecutionFixture(),raw=readFileSync(f.green.receipt_ref,'utf8');expect(ringAt(await report(f),8).state).toBe('completed');
    writeFileSync(f.green.receipt_ref,JSON.stringify({...JSON.parse(raw),task_id:'foreign-task'}));expect(ringAt(await report(f),8).state).not.toBe('completed');
    writeFileSync(f.green.receipt_ref,raw);expect(ringAt(await report(f),8).state).toBe('completed');
  });
});
async function handoffPRFixture() {
  const f=await closeMergeFixture(),rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),close=rows.find(row=>row.record_kind==='close_action');
  await writeStageRow(f.taskPath,{...close,source:'Controlled same-task physical merge completion, exact readback is in the named verify-code handoff.'});
  const ref='quality/evidence/handoff/owned-verify-code-handoff.md',head=git(f,['rev-parse','HEAD']);
  put(f.taskPath,ref,`# Stage Handoff\n任务：owned-task\n项目：workflowhub\n阶段：verify-code\n仓库：${f.repo}\n分支：task/workflowhub/owned-task\nHEAD：${head}\n## 当前结果\nPR #12 已合并，质量仍incomplete；物理交付不等于质量通过。\n## 核心方案\n仅复用同任务、同仓库、head/base匹配的PR原件。\nPR实际返回：\`quality/tests/pr-post-merge.json\`；原输出：\`quality/tests/pr-post-merge.output\`。\n`);
  await writeStageRow(f.taskPath,{stage:'verify-code',source:'Controlled final readback and handoff',handoff:{value:ref,reason:'Actual-shape ordinary task-bound handoff points to exact PR receipt.'}});
  return {...f,handoffRef:ref};
}
describe('final-chain report nested close handoff PR chain',()=>{
  it('reads native GitHub RefName/Oid JSON only through the same-task nested close and explicit handoff',async()=>{
    const f=await handoffPRFixture(),value=await report(f);expect(ringAt(value,10).state).toBe('completed');expect(JSON.stringify(ringAt(value,10).basis)).toContain('pr-post-merge');
  });
  it.each(['foreign-task','text-only','wrong-pr','wrong-commit','missing-output'])('does not complete a handoff PR chain with %s',async(kind)=>{
    const f=await handoffPRFixture();
    if(kind==='foreign-task')put(f.taskPath,f.handoffRef,readFileSync(join(f.taskPath,f.handoffRef),'utf8').replace('任务：owned-task','任务：foreign-task'));
    if(kind==='text-only')put(f.taskPath,f.handoffRef,'# Stage Handoff\n任务：owned-task\nPR #12已合并；没有具名原返回。\n');
    if(kind==='missing-output')rmSync(join(f.taskPath,'quality/tests/pr-post-merge.output'));
    if(kind==='wrong-pr'||kind==='wrong-commit'){const p=JSON.parse(readFileSync(join(f.taskPath,'quality/tests/pr-post-merge.output'),'utf8'));if(kind==='wrong-pr')p.number=99;else{p.headRefOid='b'.repeat(40);p.mergeCommit={oid:'c'.repeat(40)};}put(f.taskPath,'quality/tests/pr-post-merge.output',p);}
    expect(ringAt(await report(f),10).state).not.toBe('completed');
  });
  it('retains the delivered-but-required-PR-missing branch and recovers when the same original returns',async()=>{
    const f=await handoffPRFixture(),path=join(f.taskPath,'quality/tests/pr-post-merge.output'),raw=readFileSync(path,'utf8');
    expect(ringAt(await report(f),10).state).toBe('completed');rmSync(path);expect(ringAt(await report(f),10).state).toBe('incomplete');
    writeFileSync(path,raw);expect(ringAt(await report(f),10).state).toBe('completed');
  });
});
describe('final-chain report repeated exact RAW reference definitions',()=>{
  it('deduplicates the same named parent PRD and consumes only its explicit raw reference definition',async()=>{
    const f=parentRawFixture('spec-parent-prd'),prd=`specs/archive/${f.parentId}/prd.md`,sideRef='quality/evidence/raw-requirements/known-red.md';put(f.parentRoot,sideRef,'Historical red disposition is not the original requirement.\n');
    put(f.repo,prd,`# Parent PRD\n原始需求见[raw]；红处置见[red-decision]。\n[raw]: ${f.rawPath}\n[red-decision]: ${join(f.parentRoot,sideRef)}\n`);
    put(f.materialRoot,'spec.md',readFileSync(join(f.materialRoot,'spec.md'),'utf8')+`\n再次引用同一父PRD：\`${prd}\`。\n`);
    const value=await report(f);expect(ringAt(value,1).state).toBe('completed');expect(JSON.stringify(ringAt(value,1).basis)).toContain(hash(f.raw));expect(JSON.stringify(ringAt(value,1).basis)).not.toContain(sideRef);
  });
  it('deduplicates repeated exact RAW pointers in the one currently named research original',async()=>{
    const f=parentRawFixture('named-research'),ref=`quality/evidence/decision-log-refs/research-${f.childId.slice(6)}-raw.md`;
    put(f.taskPath,ref,readFileSync(join(f.taskPath,ref),'utf8')+`\n同一原需再次定位：\`${f.rawPath}\`，不是另一父来源。\n`);
    const value=await report(f);expect(ringAt(value,1).state).toBe('completed');expect(JSON.stringify(ringAt(value,1).basis)).toContain(hash(f.raw));
  });
});
describe('final-chain report historical main diff view',()=>{
  it('reports later-main visibility without removing a true outside path or blaming the original task',async()=>{
    const f=await historicalExecutionFixture();
    await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source:'Controlled merged historical task',close_action:{action:'merge',result:`Task branch ${f.branch} head ${f.head} integrated into the main material repository.`}});
    const m=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));m.target_repo_root=f.repo+'/';put(f.taskPath,'task.json',m);
    put(f.repo,'later-main-only.mjs','export const later = true;\n');git(f,['add','later-main-only.mjs']);git(f,['commit','-qm','controlled later main commit']);
    const value=await report(f);expect(ringAt(value,7).state).toBe('incomplete');expect(JSON.stringify(ringAt(value,7))).toContain('later-main-only.mjs');
    expect(value.limits.join(' ')).toMatch(/后续提交|已合并主仓|later.main|historical.*diff/i);
  });
});

// TCR309/independent311: observe report consumption of actual parameter identities.
async function parameterReceiptFixture({shell=false,historical=false}={}) {
  const f=await nativeProducerFixture();
  const filename='owned space.test.mjs';put(f.repo,filename,"import test from 'node:test';test('actual spaced filename',()=>{});\n");
  const literal=JSON.stringify(process.execPath)+' --test "'+filename+'"';
  const argv=shell?['/bin/sh','-c',literal]:[process.execPath,'--test',filename];
  const input=put(f.taskPath,'quality/evidence/parameter-input.json',{argv,slug:'actual-parameter-identity',timeoutMs:15000});
  const prior=process.env.WORKFLOWHUB_TASK_DIR;process.env.WORKFLOWHUB_TASK_DIR=f.root;
  let receipt;try{receipt=await stageRuntimeCliMain(['verify','--action=execute','--stage=build-code','--project=workflowhub','--task=owned-task','--task-path='+f.taskPath,'--input='+input],{cwd:f.repo});}
  finally{if(prior===undefined)delete process.env.WORKFLOWHUB_TASK_DIR;else process.env.WORKFLOWHUB_TASK_DIR=prior;}
  expect(receipt.exit_code,'SETUP: real parameter command must succeed').toBe(0);
  if(historical){
    const oldWorkspace=f.repo,m=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8')),branch=git(f,['branch','--show-current']),head=git(f,['rev-parse','HEAD']);
    put(f.materialRoot,'decision-log.md',readFileSync(join(f.materialRoot,'decision-log.md'),'utf8')+`\n## 历史任务身份\n本任务读取基准：认证 worktree \`${oldWorkspace}\`，分支 \`${branch}\`，基线提交 \`${m.baseline_commit}\`；该工作区属于 owned-task 的本次受控执行，已实际回收。\n`);
    const materialRoot=join(m.target_repo_root,'specs/owned-task');mkdirSync(dirname(materialRoot),{recursive:true});const {renameSync}=await import('node:fs');renameSync(f.materialRoot,materialRoot);
    for(const path of ['native-owned.test.mjs','native-value.txt',filename])rmSync(join(oldWorkspace,path));
    git({repo:m.target_repo_root},['worktree','remove',oldWorkspace]);delete m.workspace_mode;delete m.workspace_root;put(f.taskPath,'task.json',m);
    await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source:'Controlled own worktree cleanup after preserving actual parameter receipt',close_action:{action:'worktree_cleanup',result:`Removed owned task worktree ${oldWorkspace}; original task head ${head} preserved.`}});
    return {...f,repo:m.target_repo_root,materialRoot,parameterReceipt:receipt,literal,filename};
  }
  return {...f,parameterReceipt:receipt,literal,filename};
}
async function bindParameterCommand(f,command) {
  const rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='build-code');
  await writeStageRow(f.taskPath,{...row,source:'receipt: '+f.parameterReceipt.receipt_ref+'; output: '+f.parameterReceipt.output_ref,evidence:{value:[{command,exit_code:0,failure_signature:'output: '+f.parameterReceipt.output_ref}]}});
}
describe('final-chain report command parameter identity',()=>{
  it('rejects equal-join shell args with different file boundaries and restores exact JSON argv',async()=>{
    const f=await parameterReceiptFixture(),argv=f.parameterReceipt.argv;
    await bindParameterCommand(f,JSON.stringify(argv));expect(ringAt(await report(f),8).state).toBe('completed');
    await bindParameterCommand(f,argv.join(' '));expect(ringAt(await report(f),8).state).not.toBe('completed');
    await bindParameterCommand(f,JSON.stringify(argv));expect(ringAt(await report(f),8).state).toBe('completed');
  });
  it.each(['quoted','escaped'])('keeps %s shell boundaries safe, rejects stripped spelling and restores JSON',async(kind)=>{
    const f=await parameterReceiptFixture(),argv=f.parameterReceipt.argv,exe=JSON.stringify(argv[0]);
    const command=exe+' --test '+(kind==='quoted'?JSON.stringify(f.filename):f.filename.replaceAll(' ','\\ '));
    await bindParameterCommand(f,command);const parsed=ringAt(await report(f),8);expect(['completed','unavailable','incomplete']).toContain(parsed.state);
    await bindParameterCommand(f,argv.join(' '));expect(ringAt(await report(f),8).state).not.toBe('completed');
    await bindParameterCommand(f,JSON.stringify(argv));expect(ringAt(await report(f),8).state).toBe('completed');
  });
  it('compares JSON argv items rather than flattening a space-bearing argument',async()=>{
    const f=await parameterReceiptFixture(),argv=f.parameterReceipt.argv;
    await bindParameterCommand(f,JSON.stringify(argv));expect(ringAt(await report(f),8).state).toBe('completed');
    await bindParameterCommand(f,JSON.stringify([...argv.slice(0,-1),...f.filename.split(' ')]));expect(ringAt(await report(f),8).state).not.toBe('completed');
    await bindParameterCommand(f,JSON.stringify(argv));expect(ringAt(await report(f),8).state).toBe('completed');
  });
  it('preserves actual sh-c literal identity and rejects altered quoting before restoration',async()=>{
    const f=await parameterReceiptFixture({shell:true});await bindParameterCommand(f,f.literal);expect(ringAt(await report(f),8).state).toBe('completed');
    await bindParameterCommand(f,f.literal.replace('"'+f.filename+'"',f.filename));expect(ringAt(await report(f),8).state).not.toBe('completed');
    await bindParameterCommand(f,f.literal);expect(ringAt(await report(f),8).state).toBe('completed');
  });
  it('rejects the same parameter boundary collision in authenticated historical execution',async()=>{
    const f=await parameterReceiptFixture({historical:true}),argv=f.parameterReceipt.argv;
    await bindParameterCommand(f,JSON.stringify(argv));expect(ringAt(await report(f),8).state).toBe('completed');
    await bindParameterCommand(f,argv.join(' '));expect(ringAt(await report(f),8).state).not.toBe('completed');
    await bindParameterCommand(f,JSON.stringify(argv));const value=await report(f);expect(ringAt(value,8).state).toBe('completed');expect(JSON.stringify(value.limits)).toMatch(/历史|historical/i);
  });
});

// TCR310/independent313: ordinary source representations, existing canonical fields only.
async function ordinaryCloseHandoffFixture() {
  const f=await closeMergeFixture(),rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),merge=rows.find(r=>r.close_action?.action==='merge'),head=git(f,['rev-parse','HEAD']);
  const handoffRef='quality/evidence/handoff/ordinary-final-handoff.md';
  put(f.taskPath,handoffRef,`# verify-code handoff

## 1. 任务身份
任务：owned-task，post cohort。当前阶段 verify-code。
Task root：${f.taskPath}
当前材料：${f.materialRoot}/
目标仓库：${f.repo}
本地 main 与 origin/main 均为 ${head}。PR #12 已合并。任务 worktree、本地任务分支、远端同名任务分支均已按用户确认移除。
当前阶段状态：unverified；quality_status=incomplete。

## 5. 核心方案
PR #12 创建、合并与合并后远端读回见 quality/tests/pr-post-merge.json。物理交付不改变质量结论。
`);
  const handoff={value:join(f.taskPath,handoffRef),reason:'Final task-bound verify-code handoff; ordinary source reference.'};
  await writeStageRow(f.taskPath,{stage:'verify-code',source:'Controlled ordinary handoff',handoff});
  await writeStageRow(f.taskPath,{...merge,source:'Controlled physical main fast-forward; PR original is in final handoff.',close_action:{...merge.close_action,result:`Local main fast-forwarded to merged PR #12 commit ${head}; remote main matches.`},handoff,evidence:{value:[{command:'Local main fast-forward',exit_code:0,failure_signature:'git merge --ff-only origin/main exit0; local main now equals merged PR commit; receipt quality/tests/owned-merge.json'}]}});
  await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source:'Controlled physical cleanup',close_action:{action:'worktree_cleanup',result:'Confirmed task worktree and task branches removed; active specifications and external evidence preserved.'},handoff});
  return {...f,handoffRef};
}
describe('final-chain report ordinary physical PR handoff combination',()=>{
  it('consumes bare PR receipt in ordinary task handoff after nested merge then cleanup',async()=>{
    const f=await ordinaryCloseHandoffFixture(),value=await report(f);expect(ringAt(value,10).state).toBe('completed');expect(JSON.stringify(ringAt(value,10).basis)).toContain('pr-post-merge');
    expect(readFileSync(join(f.taskPath,f.handoffRef),'utf8')).toContain('quality_status=incomplete');
  });
  it.each(['missing-output','foreign-task','foreign-repo','wrong-head','missing-pointer'])('rejects ordinary PR chain %s and restores original bytes',async(kind)=>{
    const f=await ordinaryCloseHandoffFixture(),ref=kind==='missing-output'||kind==='wrong-head'?'quality/tests/pr-post-merge.output':f.handoffRef,path=join(f.taskPath,ref),raw=readFileSync(path,'utf8');
    expect(ringAt(await report(f),10).state).toBe('completed');
    if(kind==='missing-output')rmSync(path);
    else if(kind==='wrong-head'){const p=JSON.parse(raw);p.headRefOid='b'.repeat(40);p.mergeCommit={oid:'c'.repeat(40)};put(f.taskPath,ref,p);}
    else put(f.taskPath,ref,raw.replace(kind==='foreign-task'?'任务：owned-task':kind==='foreign-repo'?`目标仓库：${f.repo}`:'quality/tests/pr-post-merge.json',kind==='foreign-task'?'任务：foreign-task':kind==='foreign-repo'?'目标仓库：/foreign/repository':'no PR original reference'));
    expect(ringAt(await report(f),10).state).not.toBe('completed');writeFileSync(path,raw);expect(ringAt(await report(f),10).state).toBe('completed');
  });
  it('retains a later same-object merge failure rather than silently selecting older success',async()=>{
    const f=await ordinaryCloseHandoffFixture(),head=git(f,['rev-parse','HEAD']);
    const ref='quality/tests/later-same-pr-merge.json',out='quality/tests/later-same-pr-merge.output';
    put(f.taskPath,out,'Actual-shape later merge command failed for the same PR; unresolved observation.\n');
    put(f.taskPath,ref,{argv:['git','merge','--ff-only','origin/main'],cwd:f.repo,exit_code:1,signal:null,timed_out:false,cancelled:false,truncated:false,output_ref:join(f.taskPath,out)});
    await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source:`Later same PR #12 merge readback; receipt: ${ref}; output: ${out}`,close_action:{action:'merge',result:`PR #12 commit ${head}: later same-object merge command failed; conflict unresolved.`,ref},evidence:{value:[{command:'git merge --ff-only origin/main',exit_code:1,failure_signature:`Same PR #12 merge conflict; output: ${out}`}]}});
    const value=await report(f);expect(JSON.stringify([ringAt(value,10),value.limits])).toMatch(/later.same|后续|conflict|冲突|failed|失败/i);
    expect(ringAt(value,10).state).not.toBe('completed');
  });
});
async function canonicalMainDiffFixture() {
  const f=await ordinaryCloseHandoffFixture(),manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8'));
  git(f,['checkout','-q','-b','main',manifest.baseline_commit]);
  const output=git(f,['merge','--no-ff','-m','controlled task merge','task/workflowhub/owned-task']);
  put(f.taskPath,'quality/tests/owned-merge.output',output+'\n');
  const r=JSON.parse(readFileSync(join(f.taskPath,'quality/tests/owned-merge.json'),'utf8'));r.argv=['git','merge','--no-ff','-m','controlled task merge','task/workflowhub/owned-task'];put(f.taskPath,'quality/tests/owned-merge.json',r);
  put(f.repo,'after-task-main.mjs','export const laterMain = true;\n');git(f,['add','after-task-main.mjs']);git(f,['commit','-qm','controlled subsequent main change']);
  expect(manifest.target_repo_root).toBe(f.repo);return f;
}
describe('final-chain report canonical main historical diff visibility',()=>{
  it('explains genuine baseline-to-current-main scope with identical canonical roots while preserving outside conflict',async()=>{
    const f=await canonicalMainDiffFixture(),value=await report(f);expect(ringAt(value,7).state).toBe('incomplete');expect(JSON.stringify(ringAt(value,7))).toContain('after-task-main.mjs');
    expect(value.limits.join(' ')).toMatch(/后续提交|已合并主仓|later.main|historical.*diff/i);
  });
  it('does not infer a historical merge from root equality alone and restores explicit physical facts',async()=>{
    const f=await canonicalMainDiffFixture(),path=join(f.taskPath,'facts.jsonl'),raw=readFileSync(path,'utf8');
    const rows=raw.trim().split('\n').map(JSON.parse);writeFileSync(path,rows.filter(r=>r.record_kind!=='close_action'&&r.stage!=='verify-code').map(JSON.stringify).join('\n')+'\n');
    const unknown=await report(f);expect(ringAt(unknown,7).state).toBe('incomplete');expect(JSON.stringify(ringAt(unknown,7))).toContain('after-task-main.mjs');
    expect(unknown.limits.some(note=>/已合并主仓|merged historical task/i.test(note))).toBe(false);
    writeFileSync(path,raw);const restored=await report(f);expect(ringAt(restored,7).state).toBe('incomplete');expect(restored.limits.join(' ')).toMatch(/后续提交|已合并主仓|later.main|historical.*diff/i);
  });
});

// TCR328/independent329: stage evidence reaches PR fallback, not only strict-close guards.
async function fallbackPRFixture({separate=false}={}) {
  const f=await ordinaryCloseHandoffFixture(),ref=separate?'quality/tests/fallback-candidate.json':'quality/tests/pr-post-merge.json',out=separate?'quality/tests/fallback-candidate.output':'quality/tests/pr-post-merge.output';
  if(separate){put(f.taskPath,out,readFileSync(join(f.taskPath,'quality/tests/pr-post-merge.output'),'utf8'));const r=JSON.parse(readFileSync(join(f.taskPath,'quality/tests/pr-post-merge.json'),'utf8'));r.output_ref=join(f.taskPath,out);put(f.taskPath,ref,r);}
  const receipt=JSON.parse(readFileSync(join(f.taskPath,ref),'utf8'));
  // No declared hashes are stale: each controlled receipt points to its actual readable output.
  await writeStageRow(f.taskPath,{stage:'build-code',source:`Controlled non-network gh fixture; receipt: ${ref}; output: ${out}`,evidence:{value:[{command:JSON.stringify(receipt.argv),exit_code:0,receipt_ref:ref,output_ref:out,failure_signature:'Controlled actual-shape non-network PR readback'}]}});
  return {...f,prRef:ref,prOutput:out};
}
describe('final-chain report actual gh fallback identity',()=>{
  it.each(['foreign-repo','foreign-task','wrong-head','wrong-number','wrong-base','open-state','missing-mergedAt','missing-mergeCommit'])('rejects %s with valid stage receipt binding and restores the same task PR',async(kind)=>{
    const f=await fallbackPRFixture(),path=join(f.taskPath,f.prOutput),raw=readFileSync(path,'utf8'),pr=JSON.parse(raw);
    const original=ringAt(await report(f),10);expect(original.state).toBe('completed');expect(JSON.stringify(original.basis)).toContain(f.prRef);
    if(kind==='foreign-repo')pr.url='https://github.com/foreign/repository/pull/'+pr.number;
    if(kind==='foreign-task')pr.headRefName='task/workflowhub/foreign-task';
    if(kind==='wrong-head'){pr.headRefOid='b'.repeat(40);pr.mergeCommit={oid:'c'.repeat(40)};}
    if(kind==='wrong-number'){pr.number=99;pr.url='https://github.com/owned/fixture/pull/99';}
    if(kind==='wrong-base')pr.baseRefName='foreign-base';
    if(kind==='open-state')pr.state='OPEN';
    if(kind==='missing-mergedAt')delete pr.mergedAt;
    if(kind==='missing-mergeCommit')delete pr.mergeCommit;
    put(f.taskPath,f.prOutput,pr);
    const facts=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),entry=facts.find(r=>r.stage==='build-code').evidence.value[0],receipt=JSON.parse(readFileSync(join(f.taskPath,f.prRef),'utf8'));
    expect(JSON.parse(entry.command)).toEqual(receipt.argv);expect(receipt.exit_code).toBe(0);expect(receipt.cwd).toBe(f.repo);expect(readFileSync(receipt.output_ref,'utf8')).toBe(JSON.stringify(pr));
    const rejected=ringAt(await report(f),10);expect(rejected.state,JSON.stringify(rejected)).not.toBe('completed');
    writeFileSync(path,raw);expect(ringAt(await report(f),10).state).toBe('completed');
  });
  it('does not overwrite the strict authenticated PR basis with a foreign later gh candidate',async()=>{
    const f=await fallbackPRFixture({separate:true}),path=join(f.taskPath,f.prOutput),raw=readFileSync(path,'utf8'),pr=JSON.parse(raw);pr.url='https://github.com/foreign/repository/pull/'+pr.number;pr.headRefName='task/workflowhub/foreign-task';put(f.taskPath,f.prOutput,pr);
    const value=await report(f),ring=ringAt(value,10);expect(ring.state).toBe('completed');expect(JSON.stringify(ring.basis),JSON.stringify(ring)).not.toContain(f.prRef);expect(JSON.stringify([ring,value.limits])).toMatch(/reject|identity|not bound|拒绝|身份|不匹配|异对象/i);
    writeFileSync(path,raw);expect(ringAt(await report(f),10).state).toBe('completed');
  });
});
async function groundedResearchFixture() {
  const f=await nativeProducerFixture();const source='research-input/owned-source.mjs';put(f.materialRoot,source,'export function observedInput(value) { return Array.isArray(value); }\n');
  const ref=await sourceShapeResearch(f,`# 受控接口研究原始观察
本任务实际读取 ${join(f.materialRoot,source)}:1；原始来源：${join(f.materialRoot,source)}。
实际观察：源码导出函数对数组执行 Array.isArray，真实受控测试输出见 ${f.green.output_ref}；该原输出包含测试通过与测试数量。
实际检查范围：该源码一行和具名Node test原输出。未查网络、外部系统及其余模块，限制：不能据此证明在线效果。
`);
  return {...f,researchRef:ref,sourceRef:source};
}
describe('final-chain report research keywords are not executed coverage',()=>{
  it.each([false,true])('rejects complete keyword bait with explicit consumption=%s',async(named)=>{
    const f=taskFixture(),body='# Source notes\n来源：missing.md；实际观察：未执行；限制：无。\n';
    if(named)await sourceShapeResearch(f,body);else put(f.taskPath,'quality/evidence/unrelated-research-notes.md',body);
    const ring=ringAt(await report(f),3);expect(ring.applicability).not.toBe('not_applicable');expect(ring.state,JSON.stringify(ring)).not.toBe('completed');
  });
  it.each([
    ['method','# 方法说明\n来源：missing.md；实际观察：未执行本任务，仅说明研究方法；限制：无。\n'],
    ['plan','# 后续计划\n来源：missing.md；实际观察：计划明天读取；限制：无。\n'],
    ['missing-source','# 观察记录\n来源：missing.md；实际观察：完成读取并发现输入为数组；限制：只查输入。\n'],
  ])('rejects %s despite all three regex groups and a named report',async(_kind,body)=>{
    const f=taskFixture();await sourceShapeResearch(f,body);expect(ringAt(await report(f),3).state).not.toBe('completed');
  });
  it.each(['missing-source','missing-output','unexecuted','contradictory-output'])('does not treat %s as reliable research and restores the prior actual conclusion',async(kind)=>{
    const f=await groundedResearchFixture(),original=await report(f),initial=ringAt(original,3);expect(['completed','unavailable']).toContain(initial.state);
    const path=kind==='missing-source'?join(f.materialRoot,f.sourceRef):kind==='unexecuted'?join(f.taskPath,f.researchRef):f.green.output_ref,raw=readFileSync(path,'utf8');
    if(kind==='missing-source'||kind==='missing-output')rmSync(path);
    if(kind==='unexecuted')put(f.taskPath,f.researchRef,'# 研究记录\n来源：'+join(f.materialRoot,f.sourceRef)+'；实际观察：未执行；限制：无。\n');
    if(kind==='contradictory-output')writeFileSync(path,'Original controlled test output: no tests executed, observation unavailable.\n');
    const bad=ringAt(await report(f),3);expect(bad.state,JSON.stringify(bad)).not.toBe('completed');
    writeFileSync(path,raw);const restored=ringAt(await report(f),3);expect(restored.state).toBe(initial.state);
    if(initial.state==='unavailable')expect(JSON.stringify([initial,original.limits])).toMatch(/unavailable|来源|研究|覆盖|未取得|不能|无法|不足/i);
  });
});
describe('final-chain report gh fallback preserves merge failure',()=>{
  it('cannot revive old delivery success through a valid gh candidate after same-object merge failure',async()=>{
    const f=await fallbackPRFixture(),ref='quality/tests/fallback-later-merge.json',out='quality/tests/fallback-later-merge.output',head=git(f,['rev-parse','HEAD']);
    put(f.taskPath,out,'Same PR #12 later merge failed; conflict unresolved.\n');put(f.taskPath,ref,{argv:['git','merge','--ff-only','origin/main'],cwd:f.repo,exit_code:1,signal:null,timed_out:false,cancelled:false,truncated:false,output_ref:join(f.taskPath,out)});
    await writeStageRow(f.taskPath,{record_kind:'close_action',stage:'close',source:`Later same-object merge; receipt: ${ref}; output: ${out}`,close_action:{action:'merge',result:`PR #12 commit ${head}: later same-object merge failed, conflict unresolved.`,ref},evidence:{value:[{command:'git merge --ff-only origin/main',exit_code:1,failure_signature:'Same-object merge failed; output: '+out}]}});
    const value=await report(f);expect(ringAt(value,10).state).not.toBe('completed');expect(JSON.stringify([ringAt(value,10),value.limits])).toMatch(/conflict|失败|failed|冲突/i);
  });
});

// TCR352/353/independent354: actual producer identity is distinct from matching text.
function handwrittenResearchSources(f) {
  const code=put(f.materialRoot,'unexecuted-caller.mjs',"import assert from 'node:assert/strict';\nassert.equal(1, 1);\nconsole.log('input: object array accepted');\nconsole.log('observation: explicit error consumed');\n");
  const output=put(f.materialRoot,'unexecuted.output','input: object array accepted\nobservation: explicit error consumed\n');
  return {code,output};
}
async function producerResearchFixture() {
  const f=taskFixture(),ref=await nestedResearch(f);return {...f,researchRef:ref};
}
describe('final-chain report research execution producer identity',()=>{
  it('rejects hand-written matching stdout without ever executing the claimed caller',async()=>{
    const f=taskFixture(),{code,output}=handwrittenResearchSources(f);
    await sourceShapeResearch(f,`# 本任务执行研究
原始来源：${code}:1–4。
实际观察：实际调用返回显式错误，调用者已消费；原始执行输出：${output}:1–2。
实际检查范围：这次调用与错误；未查外部服务，限制：只核本任务。
`);
    expect(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')).toBe('');
    const value=await report(f),ring=ringAt(value,3);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');expect(JSON.stringify([ring,value.limits])).toMatch(/执行|producer|来源|未取得|unavailable/i);
  });
  it('does not use a different real input producer merely because stdout bytes match',async()=>{
    const f=await producerResearchFixture(),expected=f.researchReceipt;
    const other=put(f.materialRoot,'other-input-caller.mjs',readFileSync(join(f.materialRoot,'caller.mjs'),'utf8').replace("'./owned-module.mjs'","'./owned-module.mjs'").replace('const values = [{ observed: true }];','const values = [{ unrelatedInput: true }];'));
    const actual=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'other-research-input',argv:[process.execPath,other],timeoutMs:10000});
    expect(actual.exit_code).toBe(0);expect(readFileSync(actual.output_ref,'utf8')).toBe(readFileSync(expected.output_ref,'utf8'));expect(actual.output_ref).not.toBe(expected.output_ref);
    await writeStageRow(f.taskPath,{stage:'build-code',source:`receipt: ${actual.receipt_ref}; output: ${actual.output_ref}`,evidence:{value:[{command:JSON.stringify(actual.argv),exit_code:actual.exit_code,receipt_ref:actual.receipt_ref,output_ref:actual.output_ref,failure_signature:'output: '+actual.output_ref}]}});
    const ring=ringAt(await report(f),3);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');
    await writeStageRow(f.taskPath,{stage:'build-code',source:`receipt: ${expected.receipt_ref}; output: ${expected.output_ref}`,evidence:{value:[{command:JSON.stringify(expected.argv),exit_code:expected.exit_code,receipt_ref:expected.receipt_ref,output_ref:expected.output_ref,failure_signature:'output: '+expected.output_ref}]}});
    expect(ringAt(await report(f),3).state).toBe('completed');
  });
  it('completes the originally static structure-only research within its explicit scope without requiring execution',async()=>{
    const f=taskFixture(),code=put(f.materialRoot,'static-structure.mjs','export const supportedInput = "array";\nexport function describeInput(values) { return values; }\n');
    await sourceShapeResearch(f,`# 接口声明结构研究
研究目标：仅核源码导出的名字和形参，不验证行为。
来源：${code}:1–2。
本次实读观察：第1行导出supportedInput常量，第2行导出describeInput函数且形参为values。
实际检查范围：两行源码声明结构；未执行程序、未查运行结果和外部系统，限制：仅静态源码结构。
`);
    expect(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')).toBe('');
    const value=await report(f),ring=ringAt(value,3);expect(ring.state).toBe('completed');expect(JSON.stringify(ring.basis)).toContain('static-structure.mjs');expect(JSON.stringify([ring,value.limits])).toMatch(/静态|static/i);expect(JSON.stringify([ring,value.limits])).toMatch(/未证明运行|未执行|not.*execut|运行.*未/i);
  });
  it.each(['command','exit','cancel','hash','foreign-output','same-bytes-unbound-output','coverage-input'])('rejects %s in a complete research producer chain and restores the original',async(kind)=>{
    const f=await producerResearchFixture(),first=await report(f);expect(ringAt(first,3).state).toBe('completed');
    const factsPath=join(f.taskPath,'facts.jsonl'),receiptPath=f.researchReceipt.receipt_ref,reportPath=join(f.taskPath,f.researchRef),factsRaw=readFileSync(factsPath,'utf8'),receiptRaw=readFileSync(receiptPath,'utf8'),reportRaw=readFileSync(reportPath,'utf8');
    const rows=factsRaw.trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='build-code'),receipt=JSON.parse(receiptRaw);
    if(kind==='command'){row.evidence.value[0].command=JSON.stringify([process.execPath,join(f.materialRoot,'other-input-caller.mjs')]);writeFileSync(factsPath,rows.map(JSON.stringify).join('\n')+'\n');}
    if(kind==='exit'){receipt.exit_code=1;row.evidence.value[0].exit_code=1;writeFileSync(receiptPath,JSON.stringify(receipt));writeFileSync(factsPath,rows.map(JSON.stringify).join('\n')+'\n');}
    if(kind==='cancel'){receipt.cancelled=true;writeFileSync(receiptPath,JSON.stringify(receipt));}
    if(kind==='hash'){row.evidence.value[0].sha256='a'.repeat(64);writeFileSync(factsPath,rows.map(JSON.stringify).join('\n')+'\n');}
    if(kind==='foreign-output'){receipt.output_ref=put(f.root,'foreign-task/quality/tests/other.output',readFileSync(f.researchReceipt.output_ref,'utf8'));writeFileSync(receiptPath,JSON.stringify(receipt));}
    if(kind==='same-bytes-unbound-output'){const other=put(f.materialRoot,'unbound-copy.output',readFileSync(f.researchReceipt.output_ref,'utf8'));writeFileSync(reportPath,reportRaw.replaceAll(f.researchReceipt.output_ref,other));}
    if(kind==='coverage-input')writeFileSync(reportPath,reportRaw+'\n实际观察：本次执行输入为3个字符串，成功无错误返回；覆盖结论与具名调用的实际对象数组和显式错误相反。\n');
    const bad=ringAt(await report(f),3);expect(bad.state,JSON.stringify(bad)).not.toBe('completed');
    writeFileSync(factsPath,factsRaw);writeFileSync(receiptPath,receiptRaw);writeFileSync(reportPath,reportRaw);expect(ringAt(await report(f),3).state).toBe('completed');
  });
});

// TCR377/independent378: ordinary checker provenance, not a native-only contract.
describe('final-chain report ordinary contract actual execution source',()=>{
  it('rejects a fully shaped handwritten ordinary result when its actual producer link is absent',async()=>{
    const f=await ordinaryContractFixture();expect(ringAt(await report(f),5).state).toBe('completed');
    const path=join(f.taskPath,'facts.jsonl'),raw=readFileSync(path,'utf8'),rows=raw.trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='make-decision');
    row.source=f.ref;row.evidence={value:null,reason:'Deliberate unbound self-reported contract bait; no claimed execution source.'};writeFileSync(path,rows.map(JSON.stringify).join('\n')+'\n');
    const ring=ringAt(await report(f),5);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');
    writeFileSync(path,raw);expect(ringAt(await report(f),5).state).toBe('completed');
  });
  it.each(['forged-ok','wrong-producer-input','wrong-command'])('rejects %s while ordinary contract shape remains applicable and restores the genuine source',async(kind)=>{
    const f=await ordinaryContractFixture();expect(ringAt(await report(f),5).state).toBe('completed');
    const path=join(f.taskPath,'facts.jsonl'),factsRaw=readFileSync(path,'utf8'),sourcePath=join(f.taskPath,f.ref),sourceRaw=readFileSync(sourcePath,'utf8');
    if(kind==='forged-ok'){
      const badRoot=join(f.root,'contract-negative-input');mkdirSync(join(badRoot,'phases'),{recursive:true});put(badRoot,'spec.md','# Deliberately missing required contract\n');put(badRoot,'phases/index.md','# no contract phases\n');put(badRoot,'phases/P1.md','# absent contract\n');
      const failed=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'ordinary-contract-real-failure',argv:[process.execPath,f.script,badRoot],timeoutMs:10000});expect(failed.exit_code).not.toBe(0);
      // The ordinary body lies about that actual checker execution; its checked structure is unchanged bait.
      const rows=factsRaw.trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='make-decision');row.source=`${f.ref}; receipt: ${failed.receipt_ref}; output: ${failed.output_ref}`;row.evidence={value:[{command:JSON.stringify(failed.argv),exit_code:failed.exit_code,receipt_ref:failed.receipt_ref,output_ref:failed.output_ref,failure_signature:'Actual failure output: '+failed.output_ref}]};writeFileSync(path,rows.map(JSON.stringify).join('\n')+'\n');
    }else{
      const rows=factsRaw.trim().split('\n').map(JSON.parse),row=rows.find(r=>r.stage==='make-decision');row.evidence.value[0].command=JSON.stringify([process.execPath,kind==='wrong-command'?join(f.root,'not-the-checker.mjs'):f.script,kind==='wrong-producer-input'?join(f.root,'another-material-root'):f.materialRoot]);writeFileSync(path,rows.map(JSON.stringify).join('\n')+'\n');
    }
    const ring=ringAt(await report(f),5);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');
    writeFileSync(path,factsRaw);writeFileSync(sourcePath,sourceRaw);expect(ringAt(await report(f),5).state).toBe('completed');
  });
});

async function actualPortableBranchFixture(level='complex',{invoke=true}={}) {
  const f=taskFixture();writerIdentity(f);choice(f,level);actualWorkflowSources(f,level);
  put(f.repo,'workflows/build-prd/steps.json',readFileSync(join(ROOT,'workflows/build-prd/steps.json'),'utf8'));
  const stages=level==='complex'?['make-decision','build-plan','build-code','verify-code']:['make-decision'];
  for(const stage of stages)await writeStageRow(f.taskPath,{stage,source:'quality/evidence/choice.md'});
  const task={taskPath:f.taskPath,identity:{taskId:'owned-task'}};
  const result=await kernel.runPortableWorkflow({task,worktreeRoot:f.repo,...(invoke?{input:{task_id:'owned-task',workflow:'build-prd',step_results:[]}}:{})});
  if(invoke){expect(result.ref).toBeTypeOf('string');expect(result.terminal.workflow).toBe('build-prd');expect(result.state).toBe('failed');await writeStageRow(f.taskPath,{stage:'make-decision',source:result.ref,evidence:{value:null,reason:'Actual portable invocation returned the exact terminal source; no shell command executed.'}});}
  return {...f,portable:result,formalStages:stages};
}
describe('final-chain report actual portable branch stage denominator',()=>{
  it.each(['complex','planning'])('counts the actual %s portable invocation as a branch, without turning its failed terminal into human completion',async(level)=>{
    const f=await actualPortableBranchFixture(level),value=await report(f),metric=value.workflow_metrics,source='workflows/build-prd/steps.json',declared=JSON.parse(readFileSync(join(f.repo,source),'utf8')).steps;
    expect(value.workflow_steps.filter(r=>r.source===source).map(r=>r.step_slug)).toEqual(declared.map(r=>r.step_slug));
    expect(metric.actual_stages.map(r=>typeof r==='string'?r:r.stage)).toContain('build-prd');expect(metric.declared_stages).toEqual(expect.arrayContaining([...f.formalStages,'build-prd']));expect(metric.stage_skip_denominator).toBe(f.formalStages.length+1);
    expect(metric.stage_source_refs).toContain(f.portable.ref);expect(value.workflow_steps.filter(r=>r.source===source).every(r=>r.state!=='completed')).toBe(true);
    const path=join(f.taskPath,f.portable.ref),raw=readFileSync(path,'utf8');rmSync(path);const bad=await report(f);expect(bad.workflow_metrics.stage_skip_denominator).toBeNull();writeFileSync(path,raw);expect((await report(f)).workflow_metrics.stage_skip_denominator).toBe(f.formalStages.length+1);
  });
  it('does not count undefined portable input or a manifest merely being present as an actual branch',async()=>{
    const f=await actualPortableBranchFixture('planning',{invoke:false});expect(f.portable).toEqual({state:'not-started',ref:null,terminal:null});const value=await report(f);expect(value.workflow_metrics.stage_skip_denominator).toBe(1);expect(value.workflow_metrics.actual_stages.map(r=>typeof r==='string'?r:r.stage)).not.toContain('build-prd');
  });
  it('keeps a missing formal stage unknown even when a real portable terminal is linked',async()=>{
    const f=await actualPortableBranchFixture(),path=join(f.taskPath,'facts.jsonl'),raw=readFileSync(path,'utf8');writeFileSync(path,raw.trim().split('\n').map(JSON.parse).filter(row=>row.stage!=='verify-code').map(JSON.stringify).join('\n')+'\n');
    expect((await report(f)).workflow_metrics.stage_skip_denominator).toBeNull();writeFileSync(path,raw);expect((await report(f)).workflow_metrics.stage_skip_denominator).toBe(5);
  });
});

async function ownerSourceFixture() {
  const f=taskFixture();writerIdentity(f);choice(f,'normal');controlledWorkflow(f);const humanRef=humanEvent(f);return {...f,humanRef,stepsRef:'workflows/make-decision/flows/normal/steps.json',methodRef:'workflows/make-decision/flows/normal/SKILL.md'};
}
function ownedWorkflowRow(value,f){return value.workflow_steps.find(row=>row.source===f.stepsRef&&row.step_slug==='normal-only');}
describe('final-chain report declared owner anchor source',()=>{
  it.each(['missing-heading','same-bad-pointer','missing-file'])('does not verify %s by matching the human criteria string alone, then restores the original',async(kind)=>{
    const f=await ownerSourceFixture();expect(ownedWorkflowRow(await report(f),f).state).toBe('completed');
    const method=join(f.repo,f.methodRef),steps=join(f.repo,f.stepsRef),human=join(f.taskPath,f.humanRef),original={method:readFileSync(method,'utf8'),steps:readFileSync(steps,'utf8'),human:readFileSync(human,'utf8')};
    if(kind==='missing-heading')writeFileSync(method,original.method.replace('## 方法','## Another heading'));
    if(kind==='same-bad-pointer'){writeFileSync(steps,original.steps.replaceAll('#方法','#不存在的判据'));writeFileSync(human,original.human.replaceAll('#方法','#不存在的判据'));}
    if(kind==='missing-file')rmSync(method);
    const value=await report(f),row=ownedWorkflowRow(value,f);expect(row.state,JSON.stringify(row)).not.toBe('completed');expect(JSON.stringify([row,value.limits])).toMatch(/owner|判据|anchor|锚|unavailable|未取得|不可读|ENOENT/i);
    writeFileSync(method,original.method);writeFileSync(steps,original.steps);writeFileSync(human,original.human);expect(ownedWorkflowRow(await report(f),f).state).toBe('completed');
  });
  it('retains an existing whole-file owner with no anchor as a legal criterion source',async()=>{
    const f=await ownerSourceFixture(),steps=join(f.repo,f.stepsRef),human=join(f.taskPath,f.humanRef);writeFileSync(steps,readFileSync(steps,'utf8').replaceAll('#方法',''));writeFileSync(human,readFileSync(human,'utf8').replaceAll('#方法',''));expect(ownedWorkflowRow(await report(f),f).state).toBe('completed');
  });
});

describe('final-chain report historical workspace role binding',()=>{
  it('does not authorize a same-line comparison path as historical cwd and restores the real workspace',async()=>{
    const f=await historicalExecutionFixture(),decision=join(f.materialRoot,'decision-log.md'),raw=readFileSync(decision,'utf8'),other=join(f.root,'unrelated-comparison-repo');
    writeFileSync(decision,raw.replace('已实际回收。','已实际回收；对照材料路径 `'+other+'`，不是本任务工作区。'));
    expect(ringAt(await report(f),8).state).toBe('completed');
    const receiptRaw=readFileSync(f.green.receipt_ref,'utf8'),r=JSON.parse(receiptRaw);expect(r.task_id).toBeUndefined();r.cwd=other;writeFileSync(f.green.receipt_ref,JSON.stringify(r));
    const ring=ringAt(await report(f),8);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');writeFileSync(f.green.receipt_ref,receiptRaw);expect(ringAt(await report(f),8).state).toBe('completed');
  });
  it('keeps conflicting explicit workspaces unknown rather than accepting either token',async()=>{
    const f=await historicalExecutionFixture(),path=join(f.materialRoot,'decision-log.md'),raw=readFileSync(path,'utf8');expect(ringAt(await report(f),8).state).toBe('completed');
    writeFileSync(path,raw.replace('已实际回收。','已实际回收；另一个认证 worktree `'+join(f.root,'contradictory','owned-task')+'`，与原声明冲突。'));
    expect(ringAt(await report(f),8).state).not.toBe('completed');writeFileSync(path,raw);expect(ringAt(await report(f),8).state).toBe('completed');
  });
});

// TCR403/independent405: real command transport is not a checker result oracle.
async function bindNativeContractOnly(f,producer) {
  await writeStageRow(f.taskPath,{stage:'make-decision',source:`receipt: ${producer.receipt_ref}; output: ${producer.output_ref}`,evidence:{value:[{command:JSON.stringify(producer.argv),exit_code:producer.exit_code,receipt_ref:producer.receipt_ref,output_ref:producer.output_ref,failure_signature:'Actual native contract candidate output: '+producer.output_ref}]}});
  const rows=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  if(rows.some(row=>String(row.source??'').split(';')[0].trim()===f.ref))throw Error('SETUP: ordinary original remains linked and would mask native fallback');
}
describe('final-chain report native contract fallback result identity',()=>{
  it('does not complete from a real exit-zero command that only prints the checker name',async()=>{
    const f=await ordinaryContractFixture();expect(ringAt(await report(f),5).state).toBe('completed');const facts=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8');
    const script=put(f.materialRoot,'validatePostPhaseContract-name-only.mjs',"console.log('validatePostPhaseContract');\n");
    const actual=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'name-only-contract',argv:[process.execPath,script,f.materialRoot],timeoutMs:10000});expect(actual.exit_code).toBe(0);expect(readFileSync(actual.output_ref,'utf8')).toBe('validatePostPhaseContract\n');await bindNativeContractOnly(f,actual);
    const value=await report(f),ring=ringAt(value,5);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');expect(JSON.stringify([ring,value.limits])).toMatch(/contract|checker|结果|扫描|来源|未取得|unavailable/i);
    writeFileSync(join(f.taskPath,'facts.jsonl'),facts);expect(ringAt(await report(f),5).state).toBe('completed');
  });
  it('retains an actual failed checker result even when its advisory wrapper exits zero',async()=>{
    const f=await ordinaryContractFixture();expect(ringAt(await report(f),5).state).toBe('completed');const facts=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8'),phasePath=join(f.materialRoot,'phases/P1.md'),phaseRaw=readFileSync(phasePath,'utf8');
    writeFileSync(phasePath,phaseRaw.replace('- **Dependency**：none','- **Dependency**：P999'));
    const script=put(f.materialRoot,'validatePostPhaseContract-advisory.mjs',readFileSync(f.script,'utf8').replace('process.exitCode=result.ok?0:1','process.exitCode=0'));
    const actual=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'false-contract-exit-zero',argv:[process.execPath,script,f.materialRoot],timeoutMs:10000});const output=JSON.parse(readFileSync(actual.output_ref,'utf8'));expect(actual.exit_code).toBe(0);expect(output.ok).toBe(false);expect(output.errors.length).toBeGreaterThan(0);await bindNativeContractOnly(f,actual);
    const ring=ringAt(await report(f),5);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');
    writeFileSync(phasePath,phaseRaw);writeFileSync(join(f.taskPath,'facts.jsonl'),facts);expect(ringAt(await report(f),5).state).toBe('completed');
  });
  it('consumes genuine current native checker result without requiring an ordinary JSON alias',async()=>{
    const f=await ordinaryContractFixture();expect(ringAt(await report(f),5).state).toBe('completed');const facts=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8');
    const output=JSON.parse(readFileSync(f.producer.output_ref,'utf8'));expect(output.ok).toBe(true);expect(output.facts.phase_count).toBeGreaterThan(0);await bindNativeContractOnly(f,f.producer);
    const value=await report(f),ring=ringAt(value,5);expect(ring.state).toBe('completed');expect(JSON.stringify(ring.basis)).toContain(f.producer.receipt_ref);expect(JSON.stringify(ring.basis)).toContain('validatePostPhaseContract');
    writeFileSync(join(f.taskPath,'facts.jsonl'),facts);expect(ringAt(await report(f),5).state).toBe('completed');
  });
  it('does not certify the current material from another material roots real successful output',async()=>{
    const f=await ordinaryContractFixture(),other=await ordinaryContractFixture();expect(ringAt(await report(f),5).state).toBe('completed');const facts=readFileSync(join(f.taskPath,'facts.jsonl'),'utf8');
    const actual=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'contract-other-input',argv:[process.execPath,f.script,other.materialRoot],timeoutMs:10000});expect(actual.exit_code).toBe(0);expect(JSON.parse(readFileSync(actual.output_ref,'utf8')).ok).toBe(true);expect(actual.argv).not.toContain(f.materialRoot);await bindNativeContractOnly(f,actual);
    const ring=ringAt(await report(f),5);expect(ring.state,JSON.stringify(ring)).not.toBe('completed');
    writeFileSync(join(f.taskPath,'facts.jsonl'),facts);expect(ringAt(await report(f),5).state).toBe('completed');
  });
});


// P8 consumer616/205: actual P7 source-relative chapter and numbered selectors.
async function p7OwnerSyntaxFixture(level='normal',pointer='SKILL.md#步骤 第1/2步') {
  const f=taskFixture();writerIdentity(f);choice(f,level);controlledWorkflow(f);
  const source=level==='complex'?'workflows/make-decision/steps.json':'workflows/make-decision/flows/'+level+'/steps.json';
  const method=join(dirname(source),'SKILL.md'),steps=JSON.parse(readFileSync(join(f.repo,source),'utf8'));
  steps.steps[0].observable_result='Actual P7 criterion. 判定消费：'+pointer+'；原件：真实human原件';put(f.repo,source,steps);
  put(f.repo,method,'# Owned route\n## '+(level==='complex'?'方法':'步骤')+'\n'+(level==='complex'?'1. First root rule\n2. Second root rule\n':'### 1. First flow rule\nFlow criterion.\n### 2. Second flow rule\nFlow criterion.\n')+'## Outside selected chapter\n999. Outside rule must not count.\n');
  return {...f,source,method,slug:steps.steps[0].step_slug,pointer};
}
describe('final-chain report actual P7 owner source syntax',()=>{
  it.each([['complex','方法','1'],['normal','步骤','1/2'],['small','步骤','2'],['planning','步骤','1/2']])('resolves current %s source-relative chapter and selector without inventing human completion',async(level,chapter,selector)=>{
    const f=await p7OwnerSyntaxFixture(level,'SKILL.md#'+chapter+' 第'+selector+'步'),value=await report(f),row=value.workflow_steps.find(row=>row.source===f.source&&row.step_slug===f.slug);
    expect(row.owner_ref).toBe(f.method+'#'+chapter);expect(row.state).toBe('unavailable');expect(row.observable_result).toContain(f.pointer);
    const ref=humanEvent(f,{source:f.source,slug:f.slug});put(f.taskPath,ref,readFileSync(join(f.taskPath,ref),'utf8').replaceAll('workflows/make-decision/flows/normal/SKILL.md#方法',f.method+'#'+chapter));
    expect((await report(f)).workflow_steps.find(row=>row.source===f.source&&row.step_slug===f.slug).state).toBe('completed');
  });
  it.each(['SKILL.md#不存在 第1步','SKILL.md#步骤 第999步','SKILL.md#步骤 第1/999步','../SKILL.md#步骤 第1步','/tmp/SKILL.md#步骤 第1步'])('rejects missing chapter/selector or unsafe owner %s rather than guessing',async(pointer)=>{
    const f=await p7OwnerSyntaxFixture('normal',pointer);put(f.repo,'workflows/make-decision/SKILL.md','# Root decoy\n## 步骤\n999. Root is not the chosen flow.\n');
    const value=await report(f),row=value.workflow_steps.find(row=>row.source===f.source&&row.step_slug===f.slug);expect(row.owner_ref).toBeNull();expect(row.state).toBe('unavailable');expect(value.limits.join(' ')).toMatch(/owner|判据|anchor|定位/);
  });
});


// P8 actual205/188: a task-owned command is not proof of scanning its decision log.
async function boundDecisionScanFixture() {
 const f=taskFixture();writerIdentity(f);
 mkdirSync(join(f.taskPath,'quality/tests'),{recursive:true});
 put(f.materialRoot,'decision-log.md','# Controlled decision\n## 任务身份\n任务：owned-task\n## 原始需求\nR-001：保留来源。\n## 工作包与决定\n### D-001 — owned\n- **做什么**：只读\n- **不做什么**：造成功\n- **风险**：缺源\n- **改动**：原范围\n- module: owned\n- requirement_ids: [R-001]\n- derived_from: []\n- artifacts: [owned.mjs]\n## 未决项\n无真实未知。\n');
 const decision=join(f.materialRoot,'decision-log.md'),original=readFileSync(decision,'utf8');
 const scan=async target=>{const r=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'decision-bound-source',argv:[process.execPath,join(ROOT,'tools/cli/check-decision-log-chain.mjs'),'--file',target]});await writeStageRow(f.taskPath,{stage:'make-decision',source:'receipt: '+r.receipt_ref+'; output: '+r.output_ref,evidence:{value:[{command:JSON.stringify(r.argv),exit_code:r.exit_code,receipt_ref:r.receipt_ref,output_ref:r.output_ref,failure_signature:'Actual advisory input '+target}]}});return r;};
 return {...f,decision,original,scan};
}
describe('final-chain report exact decision scanner input and advisory meaning',()=>{
 it.each(['wrong-document','wrong-task','unknown-advisory'])('does not borrow %s under the current task writer and restores genuine current scanning',async(kind)=>{
  const f=await boundDecisionScanFixture();await f.scan(f.decision);expect(ringAt(await report(f),2).state).toBe('completed');
  if(kind==='unknown-advisory'){put(f.materialRoot,'decision-log.md','# No decision entries\n');const receipt=await f.scan(f.decision);expect(receipt.exit_code).toBe(0);expect(readFileSync(receipt.output_ref,'utf8')).toMatch(/unknown.decision_entries|coverage is unavailable/);put(f.materialRoot,'decision-log.md',f.original);}
  else {const target=kind==='wrong-document'?put(f.materialRoot,'coverage-matrix-5d.md','# Coverage table, no decision entries\n'):put(f.root,'other-task/decision-log.md',f.original);const receipt=await f.scan(target);expect(receipt.exit_code).toBe(0);}
  const bad=await report(f);expect(ringAt(bad,2).state).toBe('unavailable');expect(JSON.stringify([ringAt(bad,2),bad.limits])).toMatch(/input|来源|扫描|advisory|unavailable|target/);
  await f.scan(f.decision);expect(ringAt(await report(f),2).state).toBe('completed');
 });
});


// Independent638: actual Node entry, not a checker filename passed as data.
describe('final-chain report actual decision checker execution entry',()=>{
 it.each(['eval','print','other-script','delimiter-other-script'])('rejects a real %s stdout-marker producer and restores the actual checker entry',async(kind)=>{
  const f=await boundDecisionScanFixture();await f.scan(f.decision);expect(ringAt(await report(f),2).state).toBe('completed');
  const marker='[check-decision-log-chain] advisory complete: 0 warning(s), non-blocking, exit 0',checker=join(ROOT,'tools/cli/check-decision-log-chain.mjs');
  const other=put(f.materialRoot,'marker-only.mjs','console.log('+JSON.stringify(marker)+');\n');
  const args=kind==='eval'?['-e','console.log('+JSON.stringify(marker)+')']:kind==='print'?['-p',JSON.stringify(marker)]:kind==='delimiter-other-script'?['--',other]:[other];
  const r=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'entry-marker-bait',argv:[process.execPath,...args,checker,'--file',f.decision]});
  expect(r.exit_code).toBe(0);expect(readFileSync(r.output_ref,'utf8')).toBe(marker+'\n');
  await writeStageRow(f.taskPath,{stage:'make-decision',source:'receipt: '+r.receipt_ref+'; output: '+r.output_ref,evidence:{value:[{command:JSON.stringify(r.argv),exit_code:r.exit_code,receipt_ref:r.receipt_ref,output_ref:r.output_ref,failure_signature:'Real non-checker entry; exact marker stdout'}]}});
  const bad=await report(f);expect(ringAt(bad,2).state).toBe('unavailable');expect(JSON.stringify([ringAt(bad,2),bad.limits])).toMatch(/entry|入口|profile|未取得|unavailable/);
  await f.scan(f.decision);expect(ringAt(await report(f),2).state).toBe('completed');
 });
});


// Independent645: same main-script suffix is not actual checker source identity.
describe('final-chain report decision checker trusted source bytes',()=>{
 it.each([false,true])('rejects a same-named decoy main inside the existing repo (Node delimiter=%s), then restores the real checker',async(delimiter)=>{
  const f=await boundDecisionScanFixture();await f.scan(f.decision);expect(ringAt(await report(f),2).state).toBe('completed');
  const marker='[check-decision-log-chain] advisory complete: 0 warning(s), non-blocking, exit 0',decoy=put(f.repo,'decoy/tools/cli/check-decision-log-chain.mjs','console.log('+JSON.stringify(marker)+');\n');
  const r=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'same-name-decoy-main',argv:[process.execPath,...(delimiter?['--']:[]),decoy,'--file',f.decision]});expect(r.exit_code).toBe(0);expect(readFileSync(r.output_ref,'utf8')).toBe(marker+'\n');
  await writeStageRow(f.taskPath,{stage:'make-decision',source:'receipt: '+r.receipt_ref+'; output: '+r.output_ref,evidence:{value:[{command:JSON.stringify(r.argv),exit_code:r.exit_code,receipt_ref:r.receipt_ref,output_ref:r.output_ref,failure_signature:'Real decoy main, not WorkflowHub checker source'}]}});
  const bad=await report(f);expect(ringAt(bad,2).state).toBe('unavailable');expect(JSON.stringify([ringAt(bad,2),bad.limits])).toMatch(/source|源码|字节|身份|来源/);
  await f.scan(f.decision);expect(ringAt(await report(f),2).state).toBe('completed');
 });
 it.each([false,true])('retains a byte-identical actual checker copy in the approved repo (Node delimiter=%s)',async(delimiter)=>{
  const f=await boundDecisionScanFixture(),copy=put(f.repo,'tools/cli/check-decision-log-chain.mjs',readFileSync(join(ROOT,'tools/cli/check-decision-log-chain.mjs'),'utf8'));
  const r=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:'trusted-checker-copy',argv:[process.execPath,...(delimiter?['--']:[]),copy,'--file',f.decision]});expect(r.exit_code).toBe(0);
  await writeStageRow(f.taskPath,{stage:'make-decision',source:'receipt: '+r.receipt_ref+'; output: '+r.output_ref,evidence:{value:[{command:JSON.stringify(r.argv),exit_code:r.exit_code,receipt_ref:r.receipt_ref,output_ref:r.output_ref,failure_signature:'Actual genuine source copy'}]}});
  expect(ringAt(await report(f),2).state).toBe('completed');
  const raw=readFileSync(copy,'utf8');put(f.repo,'tools/cli/check-decision-log-chain.mjs','console.log("different current source");\n');expect(ringAt(await report(f),2).state).toBe('unavailable');put(f.repo,'tools/cli/check-decision-log-chain.mjs',raw);expect(ringAt(await report(f),2).state).toBe('completed');
 });
});
