// ORACLE-P3-NEGATIVES — P3/T006. Independent literal expectations from the approved P3 card.
// Frozen production, PLAN oracle and real task materials are read-only.
import {describe,it,expect,afterEach} from 'vitest';
import {mkdtempSync,realpathSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runFinalChainCheck} from '../../runtime/task/final-chain-runner.mjs';
import {captureCommand} from '../../runtime/interface/run-command.mjs';
import {evaluateRing,resolveLevel,evaluateWorkflowSteps} from '../../runtime/task/final-chain.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const owned=[];
const put=(root,path,value)=>{const p=join(root,path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,typeof value==='string'?value:JSON.stringify(value));return p;};
const get=(root,path)=>readFileSync(join(root,path),'utf8');
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const ring=(report,n)=>report.rings.find(row=>row.ring===n);
const temporary=()=>{const root=realpathSync(mkdtempSync(join(tmpdir(),'n9-p3-owned-')));owned.push(root);return root;};
afterEach(()=>{for(const root of owned.splice(0))rmSync(root,{recursive:true,force:true});});
function fixture(name){
 const root=temporary(),taskPath=join(root,'task'),repo=join(taskPath,'repo'),id='fixture-'+name,materialRoot=join(repo,'specs',id);
 // Copy only the exact individually declared seeds, never a directory snapshot.
 const card=get(ROOT,'specs/archive/n9-final-chain-verification-20261020/phases/P3-七个受控负例.md');
 const header=card.split('\n').find(line=>line.startsWith('- **Write set**'));
 for(const [,path]of header.matchAll(/`([^`]+)`/g))if(path.startsWith(`tests/fixtures/final-chain/${name}/`))put(taskPath,path.slice(`tests/fixtures/final-chain/${name}/`.length),get(ROOT,path));
 mkdirSync(materialRoot,{recursive:true});
 const task=JSON.parse(get(taskPath,'task.json'));task.target_repo_root=repo;task.baseline_commit='HEAD';put(taskPath,'task.json',task);
 git(repo,'init','-q');git(repo,'config','user.email','p3@fixture.invalid');git(repo,'config','user.name','P3 fixture');put(repo,'owned.txt','owned baseline\n');git(repo,'add','owned.txt');git(repo,'commit','-qm','owned baseline');
 return {root,taskPath,repo,materialRoot,id};
}
const report=f=>runFinalChainCheck({taskPath:f.taskPath,materialRoot:f.materialRoot});
function rows(f,items=[],stages=['make-decision']){put(f.taskPath,'facts.jsonl',stages.map(stage=>JSON.stringify({record_kind:'stage',task_id:f.id,stage,evidence:{value:stage==='make-decision'?items:[]}})).join('\n')+'\n');}
async function command(f,name,argv){mkdirSync(join(f.taskPath,'quality/tests'),{recursive:true});const result=await captureCommand({cwd:f.repo,recordDir:join(f.taskPath,'quality/tests'),slug:name,argv,timeoutMs:10000});return {ref:result.receipt_ref,receipt_ref:result.receipt_ref,command:JSON.stringify(argv),exit_code:result.exit_code};}
function choice(f,level){
 const decision=get(f.materialRoot,'decision-log.md').replace(/\n## 级别与路线\n[\s\S]*?(?=\n## |$)/,'');
 const ref='quality/evidence/choice.md';put(f.taskPath,ref,`受控用户明确选择 ${level}；无架构/迁移/安全风险；只作测试，不授权真实工作。\n`);
 put(f.taskPath,'quality/evidence/entry.json',{flags:{boundary_clear:true,single_outcome:true,limited_impact:true,major_architecture:false,migration:false,permission:false,security:false}});
 const facts={scope:'bounded',change_kind:'code',independent_units:1,risk:'bounded',credentials:false,dependencies:'none',acceptance:'observable test'};
 put(f.materialRoot,'decision-log.md',decision+`\n## 级别与路线\n用户选择：${level}\n原 ref：${ref}\n入口返回原 ref：quality/evidence/entry.json\n`+Object.entries(facts).map(([k,v])=>`${k}：${v}；来源：${ref}`).join('\n')+'\n');
}
function timing(f,reached=true){const ref='quality/evidence/timing.json';put(f.taskPath,ref,{task_id:f.id,stage:'make-decision',timing_verified:true,reached,reader:'independent fixture reader',observation:'受控交付时点，PR原件缺失'});put(f.taskPath,'facts.jsonl',JSON.stringify({record_kind:'stage',task_id:f.id,stage:'make-decision',source:ref,evidence:{value:[]}})+'\n');}
function routes(f,level){
 const stages=level==='complex'?['make-decision','build-plan','build-code','verify-code']:['make-decision'];const expected=[];
 for(const stage of stages){const source=`workflows/${stage}/steps.json`;
  let manifest=JSON.parse(get(ROOT,source));
  if(stage==='make-decision'&&level!=='complex'){const flow=`workflows/make-decision/flows/${level}/steps.json`;put(f.repo,source,manifest);manifest=JSON.parse(get(ROOT,flow));put(f.repo,flow,manifest);expected.push(...manifest.steps.map(step=>[flow,step.step_slug]));}
  else {put(f.repo,source,manifest);expected.push(...manifest.steps.map(step=>[source,step.step_slug]));}
  // Actual methods are copied individually, not whole directories.
  put(f.repo,`workflows/${stage}/SKILL.md`,get(ROOT,`workflows/${stage}/SKILL.md`));
 }
 rows(f,[],stages);return expected;
}
describe('ORACLE-P3-NEGATIVES controlled seven cases',()=>{
 it('missing-ring: named unavailable research remains a required unknown, not fake completion',()=>{const f=fixture('missing-ring'),value=report(f),r=ring(value,3);expect(r).toMatchObject({state:'unavailable',applicability:'required',evidence_type:null});expect(JSON.stringify(r.basis)).toContain('原件未取得');expect(value.limits.join('\n')).toContain('quality/evidence/research-missing.md');});
 it('files-without-facts: files and prose cannot replace command-exit facts',()=>{const f=fixture('files-without-facts'),r=report(f);for(const n of [5,8]){expect(ring(r,n)).toMatchObject({state:'unavailable',applicability:'required',evidence_type:null});expect(JSON.stringify(ring(r,n).basis)).toContain('原件未取得');}});
 it('declared-vs-facts: a reached PR declaration without PR readback is incomplete with its actual missing-original reason',()=>{const f=fixture('declared-vs-facts');timing(f);const r=ring(report(f),10);expect(r.state).toBe('incomplete');expect(JSON.stringify(r.basis)).toContain('已到交付时点，应有 PR 原件未取得');expect(r.conflict).toBeNull();});
 it('planning has sourced choice and excludes code through PR',()=>{const f=fixture('planning-no-code-pr');choice(f,'planning');const r=report(f);expect(r.level).toMatchObject({value:'planning',declared:true});for(let n=5;n<=10;n++)expect(ring(r,n)).toMatchObject({state:'not_applicable',counted_in_denominator:false});});
 it('legacy is fallback complex and never silently becomes normal',()=>{const f=fixture('legacy-no-level'),r=report(f);expect(r.level).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});for(const item of r.rings)expect(JSON.stringify(item.basis)).toContain('级别未取得');for(const n of [5,6,7,8])expect(ring(r,n).applicability).toBe('required');});
 it('unreadable-spec: a genuine nonempty decision observation completes only ring 2; empty scan cannot',async()=>{const f=fixture('unreadable-spec');const checker=put(f.repo,'tools/cli/check-decision-log-chain.mjs',get(ROOT,'tools/cli/check-decision-log-chain.mjs'));const cmd=await command(f,'decision',[process.execPath,checker,'--file',join(f.materialRoot,'decision-log.md')]);rows(f,[cmd]);let r=report(f);expect(ring(r,2).state).toBe('completed');expect(ring(r,5).state).toBe('unavailable');const original=get(f.materialRoot,'decision-log.md');put(f.materialRoot,'decision-log.md','');expect(ring(report(f),2).state).not.toBe('completed');put(f.materialRoot,'decision-log.md',original);expect(ring(report(f),2).state).toBe('completed');});
 it('empty-input returns ten failed/unknown rings and never vacuous decision/spec success',()=>{const r=report(fixture('empty-input'));expect(r.rings).toHaveLength(10);for(const row of r.rings)expect(['incomplete','unavailable']).toContain(row.state);for(const n of [2,5])expect(ring(r,n).state).not.toBe('completed');});
});
describe('P3 sourced levels, route originals and independent failures',()=>{
 const matrix={small:['required','required','on_demand','required','required','required','required','required','not_applicable','on_demand'],normal:['required','required','required','required','required','required','required','required','required','on_demand'],complex:['required','required','required','required','required','required','required','required','required','on_demand'],planning:['required','required','required','required','not_applicable','not_applicable','not_applicable','not_applicable','not_applicable','on_demand']};
 it.each(['small','normal','complex','planning'])('%s: forty matrix cells and actual selected source/slug sets',level=>{const f=fixture(level==='planning'?'planning-no-code-pr':`level-${level}`);choice(f,level);const expected=routes(f,level),r=report(f);expect(r.level).toMatchObject({value:level,declared:true});expect(r.rings.map(x=>x.applicability)).toEqual(matrix[level]);for(let n=1;n<=10;n++){const excluded=(level==='planning'&&n>=5)||(level==='small'&&(n===3||n===9));expect(ring(r,n).counted_in_denominator).toBe(!excluded);if(excluded)expect(ring(r,n).state).toBe('not_applicable');}expect(r.workflow_steps.map(x=>[x.source,x.step_slug])).toEqual(expected);expect(r.workflow_steps.every(x=>x.state!=='completed')).toBe(true);expect(r.workflow_steps.every(x=>x.human.length===0)).toBe(true);});
 it.each(['recommended','unanswered','missing-ref','unreadable-ref','outside-ref','missing-fact'])('source failure %s falls back, then restores the valid selection',kind=>{const f=fixture('level-small');choice(f,'small');const original=get(f.materialRoot,'decision-log.md');expect(report(f).level.declared).toBe(true);let bad=original;if(kind==='recommended')bad=bad.replace('用户选择：small','推荐：small');if(kind==='unanswered')bad=bad.replace('用户选择：small','用户未答：small');if(kind==='missing-ref')bad=bad.replace('原 ref：quality/evidence/choice.md','原 ref：');if(kind==='unreadable-ref')bad=bad.replace('原 ref：quality/evidence/choice.md','原 ref：quality/evidence/absent.md');if(kind==='outside-ref')bad=bad.replace('原 ref：quality/evidence/choice.md','原 ref：../outside.md');if(kind==='missing-fact')bad=bad.replace(/^risk：.*\n/m,'');put(f.materialRoot,'decision-log.md',bad);expect(report(f).level).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});put(f.materialRoot,'decision-log.md',original);expect(report(f).level).toMatchObject({value:'small',declared:true});});
 it('latest recommendation unanswered preserves prior sourced choice; later confirmed choice takes effect',()=>{const f=fixture('level-small');choice(f,'small');const original=get(f.materialRoot,'decision-log.md');put(f.materialRoot,'decision-log.md',original+'推荐：normal；用户未答\n');expect(report(f).level).toMatchObject({value:'small',declared:true});choice(f,'normal');expect(report(f).level).toMatchObject({value:'normal',declared:true});});
 it('historical risk and unresolved choice conflict cannot be silently accepted by the declaration producer',()=>{const safe={ref:'choice.md',safe:true,readable:true,verified:true},facts=Object.fromEntries(['scope','change_kind','independent_units','risk','credentials','dependencies','acceptance'].map(k=>[k,{value:'known',source:safe}]));const base={selected:'small',confirmed:true,source:safe,entrySource:safe,facts};const decisionLog='## 级别与路线\n用户选择：small\n原 ref：choice.md\n';expect(resolveLevel({decisionLog,levelDeclaration:base}).declared).toBe(true);for(const changed of [{invalidatedByRisk:true},{conflict:true}])expect(resolveLevel({decisionLog,levelDeclaration:{...base,...changed}})).toMatchObject({declared:false,source:'fallback-complex'});expect(resolveLevel({decisionLog,levelDeclaration:base}).declared).toBe(true);});
 it('duplicate_of binds only the actual first identical original and never trusts a forged label',()=>{const original={ref:'source.md',sha256:'a'.repeat(64),evidence_type:'file_sha256',verified:true,readable:true};const distinct={...original,ref:'different.md',duplicate_of:'forged'};const r=evaluateRing({rings:{1:{...original,basis:[{...original,duplicate_of:'forged'},original,distinct]}}},1,{value:'complex',declared:true});expect(r.basis[0]).not.toHaveProperty('duplicate_of');expect(r.basis[1].duplicate_of).toBe('source.md');expect(r.basis[2]).not.toHaveProperty('duplicate_of');});
 it('real source/slug and owned method require genuine human original; missing consumer and cross-route slug do not pass',()=>{const f=fixture('level-normal');choice(f,'normal');const expected=routes(f,'normal');const source=expected[0][0],slug=expected[0][1],owner='workflows/make-decision/flows/normal/SKILL.md#判据';put(f.materialRoot,'step-consumer-design.md',`| [controlled](<../../${source}#L7>) \`${slug}\` | result | source；human | owner |\n`);const path='quality/evidence/human.json';put(f.repo,'workflows/make-decision/flows/normal/SKILL.md','# 方法\n## 判据\n核实际选择来源；缺失不可完成。\n');let manifest=JSON.parse(get(f.repo,source));manifest.steps[0].observable_result=manifest.steps[0].observable_result.replace(/判定消费[：:]\s*[^；;\n]+/,'判定消费：'+owner);put(f.repo,source,manifest);const human={source,step_slug:slug,reader:'P3 independent controlled reader',inputs:'controlled selection original',observation:'observed actual controlled source and matching choice',criteria_ref:owner,conclusion:'completed',limits:[]};put(f.taskPath,path,human);rows(f,[{ref:path,source,step_slug:slug}]);let r=report(f);expect(r.workflow_steps[0].state).toBe('completed');put(f.taskPath,path,{...human,source:'workflows/make-decision/flows/small/steps.json'});expect(report(f).workflow_steps[0].state).not.toBe('completed');put(f.taskPath,path,human);expect(report(f).workflow_steps[0].state).toBe('completed');const withConsumer=manifest.steps[0].observable_result;manifest.steps[0].observable_result='缺判定消费';put(f.repo,source,manifest);expect(report(f).workflow_steps[0].state).not.toBe('completed');manifest.steps[0].observable_result=withConsumer;put(f.repo,source,manifest);rmSync(join(f.repo,'workflows/make-decision/flows/normal/SKILL.md'));mkdirSync(join(f.repo,'workflows/make-decision/flows/normal/SKILL.md'));expect(report(f).workflow_steps[0].state).not.toBe('completed');});
 it('missing stage collection and zero candidate denominator are null, not invented zero success',()=>{const f=fixture('level-small');choice(f,'small');let r=report(f);expect(r.workflow_metrics).toBeNull();routes(f,'small');put(f.taskPath,'facts.jsonl','');r=report(f);expect(r.workflow_metrics.stage_skip_rate).toBeNull();});
});
// The full-worktree check is deliberately unconditional: run only in the root-coordinated writer-free window.
describe('P3 baseline and complete worktree preservation',()=>{
 it('restores the real read-only baseline and keeps complete git status identical',()=>{const before=execFileSync('git',['status','--porcelain'],{cwd:ROOT,encoding:'utf8'});const taskPath=temporary();put(taskPath,'task.json',{schema_version:'1.0.0',task_id:'n9-final-chain-verification-20261020',baseline_commit:'924cae2a1811c7939741ea6b0721f3949f567ea9',target_repo_root:ROOT});const options={taskPath,materialRoot:join(ROOT,'specs/archive/n9-final-chain-verification-20261020')};const baseline=runFinalChainCheck(options);for(const name of ['missing-ring','files-without-facts','declared-vs-facts','planning-no-code-pr','legacy-no-level','unreadable-spec','empty-input'])report(fixture(name));expect(runFinalChainCheck(options)).toEqual(baseline);const after=execFileSync('git',['status','--porcelain'],{cwd:ROOT,encoding:'utf8'});console.log('P3 COMPLETE STATUS BEFORE\n'+before+'P3 COMPLETE STATUS AFTER\n'+after);expect(after).toBe(before);console.log('P3 BASELINE RESTORED',JSON.stringify(baseline));});
});

describe('P3 checker and human counterexamples',()=>{
 it('zero scan/advisory success, field-only human, and unsupported checker never become completed; failure restores',()=>{
 const step={source:'workflows/make-decision/flows/normal/steps.json',step_slug:'entry-route',stage:'make-decision',owner_ref:'method.md#criteria',human_required:true};
 const human={ref:'human.json',readable:true,verified:true,source:step.source,step_slug:step.step_slug,reader:'independent reader',inputs:'actual input ref',observation:'actual controlled observation',criteria_ref:step.owner_ref,conclusion:'completed',limits:[]};
 const program={ref:'receipt.json',readable:true,verified:true,evidence_type:'command_exit',command:'node checker.mjs',exit_code:0,scan_count:1};
 const call=(h,p)=>evaluateWorkflowSteps({steps:[step],evidence:[{source:step.source,step_slug:step.step_slug,human:h,program:p}],level:{value:'normal',declared:true},stageScope:{actual:[{stage:'make-decision'}]}})[0];
 expect(call(human,program).state).toBe('completed');
 for(const bad of [{...program,scan_count:0},{...program,supported:false}])expect(call(human,bad).state).toBe('unavailable');
 expect(call({...human,observation:''},undefined).state).not.toBe('completed');
 expect(call(human,{...program,exit_code:1}).state).toBe('incomplete');
 expect(call(human,program).state).toBe('completed');
 });
});

describe('P3 approved 484/495 TCR distinct inputs',()=>{
 it('literal missing report ring fails the first report completeness assertion; missing required pure item stays visible',()=>{
 const value=report(fixture('empty-input'));
 const consume=report=>expect(report.rings.map(row=>row.ring)).toEqual([1,2,3,4,5,6,7,8,9,10]);
 consume(value);expect(()=>consume({...value,rings:value.rings.filter(row=>row.ring!==3)})).toThrow();
 expect(()=>consume({...value,rings:[...value.rings,value.rings[0]]})).toThrow();
 const missing=evaluateRing({rings:{}},3,{value:'complex',declared:true});expect(missing).toMatchObject({ring:3,state:'unavailable',applicability:'required'});
 const known=evaluateRing({rings:{3:{trigger:true,executed:false}}},3,{value:'complex',declared:true});
 expect(known).toMatchObject({state:'incomplete',applicability:'required',evidence_type:null});expect(JSON.stringify(known.basis)).toContain('应做但未执行');
 });
 it('real controlled test command: successful execution, nonzero failure, and restored execution have exact states',async()=>{
 const f=fixture('files-without-facts'),script=put(f.repo,'owned-test.mjs',"console.log('owned behavior: result observed');\n");
 const run=async()=>{const entry=await command(f,'actual-test',[process.execPath,'--test',script]);rows(f,[entry]);return report(f);};
 const good=await run();expect(ring(good,8).state).toBe('completed');
 put(f.repo,'owned-test.mjs',"throw Error('owned behavior failed');\n");const failed=await run();expect(ring(failed,8).state).toBe('incomplete');expect(JSON.stringify(ring(failed,8).basis)).toContain('实际命令失败');
 put(f.repo,'owned-test.mjs',"console.log('owned behavior: result observed');\n");expect(ring(await run(),8).state).toBe('completed');
 });
 it('ordinary unmerged PR authentic local identity: completed, one declaration contradiction, restored completed',async()=>{
 const f=fixture('declared-vs-facts');git(f.repo,'branch','-M','main');const head=`task/${f.id}`;git(f.repo,'branch',head);const oid=git(f.repo,'rev-parse','HEAD'),remote='https://example.invalid/p3/owned';git(f.repo,'remote','add','origin',remote);
 const pr={number:17,url:remote+'/pull/17',headRefName:head,baseRefName:'main',headRefOid:oid,baseRefOid:oid,state:'OPEN'};
 const input=put(f.repo,'controlled-pr.json',pr),producer=put(f.repo,'controlled-pr-readback.mjs',"import {readFileSync} from 'node:fs';process.stdout.write(readFileSync(process.argv[2]));\n");
 const entry=await command(f,'actual-pr-readback',[process.execPath,producer,input]);const receipt=JSON.parse(readFileSync(entry.ref,'utf8'));
 const eventRef='quality/evidence/ordinary-pr-event.md';
 const event=[`任务：${f.id}`,'阶段：make-decision','步骤：delivery','执行者：P3 controlled independent observer','观察时间：2026-10-20T00:00:00.000Z','实际观察：已到交付时点；真实执行受控本地PR读回；未调用网络GitHub','交付目标：提交PR，不要求合并',`目标仓库：${f.repo}`,`Git remote origin：${remote}`,`PR URL：${pr.url}`,'PR：#17',`head：${head}`,'base：main',`head commit：${oid}`,`base commit：${oid}`,`PR 读回原件：${entry.ref}`,`PR 返回输出：${receipt.output_ref}`].join('\n')+'\n';
 const bind=raw=>{put(f.taskPath,eventRef,raw);put(f.taskPath,'facts.jsonl',JSON.stringify({record_kind:'stage',task_id:f.id,stage:'make-decision',source:eventRef,evidence:{value:[entry]}})+'\n');};
 bind(event);const valid=report(f);bind(event.replace('PR：#17\n','PR：#18\n'));const conflicting=report(f);bind(event);const restored=report(f);
 expect(ring(valid,10).state).toBe('completed');expect(ring(restored,10).state).toBe('completed');expect(ring(conflicting,10).state).toBe('incomplete');
 expect(JSON.stringify(ring(conflicting,10).basis)+ring(conflicting,10).conflict).toMatch(/冲突|矛盾/);
 });
});
describe('P3 actual specification checker evidence',()=>{
 it('valid actual contract completes; actual advisory contract failure is incomplete; restoring the input restores completion',async()=>{
  const f=fixture('files-without-facts');
  const spec=['# Controlled specification','- **FR-001**：Read the visible owned result.','- [ ] **AC-001 — owned output**','  - **需求**：FR-001','  - **通过条件**：owned result is visible.','  - **失败条件**：result is missing.','## 功能需求','FR-001 reads output.','## 验收流程','Read the actual output.','## 测试标准','Observe failure and recovery.','## 架构边界','Self-owned temporary files only.','## 实现设计（全局权威）','### Code Anchors','`owned.txt` owns the visible output.','### Interfaces and Failure Semantics','Return actual output and preserve missing-source failures.','### Requirement-to-Task Trace','| source | FR | AC | task | oracle |','| --- | --- | --- | --- | --- |','| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P3-NEGATIVES |','### Global Verification Strategy','`node --test owned.mjs`',''].join('\n');
  put(f.materialRoot,'spec.md',spec);
  const phasePath='phases/P1-受控副本.md',phase=get(f.materialRoot,phasePath).replace('- **Consumer**：独立读者','- **Consumer**：build-code').replace('- **Files / symbols**：`owned.txt`','- **Files / symbols**：`owned.txt` symbol: N/A — controlled text file').replace('- **RED target failure**：缺退出码。','- **RED target failure**：ORACLE-P3-NEGATIVES expected assertion fails when output is missing.').replace('- **GREEN oracle**：实际执行可读。','- **GREEN oracle**：ORACLE-P3-NEGATIVES actual visible output.');put(f.materialRoot,phasePath,phase);put(f.materialRoot,'phases/index.md','# Phase index\n## Execution Index\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1-受控副本.md` | `phase-p1` | `owned.txt` | `none` | build-code |\n');
  const producer=put(f.repo,'validatePostPhaseContract.mjs',`import{readFileSync}from'node:fs';import{join}from'node:path';import{validatePostPhaseContract}from${JSON.stringify(join(ROOT,'runtime/stage/stage-content-contracts.mjs'))};const root=process.argv[2],read=n=>readFileSync(join(root,n),'utf8');const result=validatePostPhaseContract({spec:read('spec.md'),index:read('phases/index.md'),phases:{'${phasePath}':read('${phasePath}')}});console.log(JSON.stringify(result));`);
  const run=async()=>{const entry=await command(f,'actual-contract',[process.execPath,producer,f.materialRoot]);rows(f,[entry]);const receipt=JSON.parse(readFileSync(entry.ref,'utf8')),body=JSON.parse(readFileSync(receipt.output_ref,'utf8'));return {body,value:report(f),entry};};
  const good=await run();expect(good.body.ok,'SETUP: real public checker must validate the controlled specification').toBe(true);expect(ring(good.value,5).state).toBe('completed');
  put(f.materialRoot,phasePath,phase.replace('- **Dependency**：none','- **Dependency**：P999'));const failed=await run();expect(failed.entry.exit_code).toBe(0);expect(failed.body.ok).toBe(false);expect(failed.body.errors.length).toBeGreaterThan(0);expect(ring(failed.value,5).state).toBe('incomplete');
  put(f.materialRoot,phasePath,phase);const restored=await run();expect(restored.body.ok).toBe(true);expect(ring(restored.value,5).state).toBe('completed');
 });
});

// Review518/plan519: actual condition observation, not a claim that the professional skill executed.
async function skillTriggerObservation(f,{requested,omitRule=false,identityPath}={}) {
 const dependency='workflows/make-decision/skill-deps.yaml';
 const request=put(f.repo,'controlled-decision-request.json',{target_skill:'decision-log',record_decision:requested,omit_rule_ref:omitRule,...identityPath?{fault_identity_path:identityPath}:{}});
 const script=put(f.repo,'observe-decision-trigger.mjs',`import{readFileSync}from'node:fs';const [deps,request]=process.argv.slice(2),input=JSON.parse(readFileSync(request,'utf8')),raw=readFileSync(deps,'utf8');const block=raw.match(/- name: decision-log\\n\\s+path: ([^\\n]+)\\n\\s+trigger: ([^\\n]+)/);if(!block)throw Error('declared decision-log trigger unavailable');console.log(JSON.stringify({skill_name:'decision-log',skill_path:input.fault_identity_path??block[1].trim(),trigger:block[2].trim(),triggered:input.record_decision===true,executed:false,...input.omit_rule_ref?{}:{rule_ref:'${dependency}'},observation:'Read current declaration and controlled request; no professional skill execution claimed.'}));`);
 const entry=await command(f,'actual-skill-trigger',[process.execPath,script,join(f.repo,dependency),request]);
 const receipt=JSON.parse(readFileSync(entry.ref,'utf8')),raw=readFileSync(receipt.output_ref,'utf8'),observation=JSON.parse(raw);
 console.log('P3 CONDITIONAL SKILL OBSERVATION',JSON.stringify({receipt,receipt_ref:entry.ref,output:raw,controlled_request:JSON.parse(readFileSync(request,'utf8'))}));
 return {...entry,...observation,failure_signature:'Actual controlled condition observation; no skill execution.'};
}
describe('P3 Review518 on-demand skill source and denominator first acceptance',()=>{
 it('current dependency condition true, lawful false, missing rule, foreign identity, and restoration keep precise candidate sets',async()=>{
  const f=fixture('level-normal');choice(f,'normal');const base=routes(f,'normal');
  const dependency='workflows/make-decision/skill-deps.yaml',source='skills/decision-log/SKILL.md',slug='decision-log';
  put(f.repo,dependency,get(ROOT,dependency));put(f.repo,source,get(ROOT,source));
  const key=row=>[row.source,row.step_slug],find=r=>r.workflow_steps.find(row=>row.source===source&&row.step_slug===slug);
  const bind=items=>{rows(f,items);return report(f);};
  const trueFact=await skillTriggerObservation(f,{requested:true});
  expect(trueFact).toMatchObject({skill_name:'decision-log',skill_path:source,trigger:'decision_record',triggered:true,executed:false,exit_code:0});
  const active=bind([trueFact]);expect(find(active)).toMatchObject({state:'unavailable',applicability:'on_demand',trigger:true,executed:false});
  expect(active.workflow_steps.map(key)).toEqual([...base,[source,slug]]);expect(active.workflow_metrics.applicable_steps).toContainEqual({source,step_slug:slug});expect(active.workflow_metrics.step_attestation_denominator).toBe(base.length+1);
  const falseFact=await skillTriggerObservation(f,{requested:false});const skipped=bind([falseFact]);
  expect(find(skipped)).toMatchObject({state:'not_applicable',trigger:false,executed:false,rule_ref:dependency});expect(skipped.workflow_metrics.applicable_steps).not.toContainEqual({source,step_slug:slug});expect(skipped.workflow_metrics.step_attestation_denominator).toBe(base.length);
  const noRule=await skillTriggerObservation(f,{requested:false,omitRule:true});const unknown=bind([noRule]);
  expect(find(unknown)).toMatchObject({state:'unavailable',trigger:false,executed:false});expect(find(unknown).rule_ref).toBeUndefined();expect(unknown.workflow_metrics.step_attestation_denominator).toBe(base.length+1);expect(unknown.workflow_metrics.applicable_steps).toContainEqual({source,step_slug:slug});
  const lawfulAgain=bind([falseFact]);expect(find(lawfulAgain).state).toBe('not_applicable');expect(lawfulAgain.workflow_metrics.step_attestation_denominator).toBe(base.length);
  const foreign='skills/unrelated/SKILL.md',wrong=await skillTriggerObservation(f,{requested:false,identityPath:foreign});
  // An unrelated record alone is no proof that this declared condition was evaluated; it cannot create a new candidate.
  const unrelated=bind([wrong]);expect(unrelated.workflow_steps.map(key)).toEqual(base);expect(unrelated.workflow_metrics.step_attestation_denominator).toBe(base.length);
  // Preserve the independently observed canonical trigger: an impostor skip cannot erase it or make it NA.
  const mixed=bind([trueFact,wrong]);expect(mixed.workflow_steps.map(key)).toEqual([...base,[source,slug]]);expect(find(mixed).state).toBe('unavailable');expect(mixed.workflow_metrics.step_attestation_denominator).toBe(base.length+1);expect(mixed.workflow_steps.some(row=>row.source===foreign)).toBe(false);
  const restored=bind([trueFact]);expect(find(restored).state).toBe('unavailable');expect(restored.workflow_metrics.applicable_steps).toContainEqual({source,step_slug:slug});expect(restored.workflow_metrics.step_attestation_denominator).toBe(base.length+1);
 });
});

// OCR057/independent707: appended behavior slices; former assertions remain unchanged.
import {runPortableWorkflow} from '../../runtime/task/portable-workflow-run.mjs';
import {writeStageRow} from '../../runtime/task/task-store.mjs';
import {summarizeWorkflow} from '../../runtime/task/final-chain.mjs';
function currentOwnerFixture(level){
 const f=fixture(level==='planning'?'planning-no-code-pr':`level-${level}`);choice(f,level);const keys=routes(f,level),stages=level==='complex'?['make-decision','build-plan','build-code','verify-code']:['make-decision'];
 put(f.materialRoot,'step-consumer-design.md',keys.map(([source,step_slug])=>`| [controlled](<../../${source}#L7>) \`${step_slug}\` | result | source；human | owner |`).join('\n')+'\n');
 const expected=keys.map(([source,step_slug])=>({source,step_slug,owner_ref:join(dirname(source),'SKILL.md')+'#'+(source.includes('/flows/')?'步骤':'方法')}));
 for(const method of new Set(expected.map(row=>row.owner_ref.split('#')[0])))put(f.repo,method,get(ROOT,method));
 return {...f,expected,stages};
}
function actualHumanFor(f,row,ref='quality/evidence/owned-current-human.json'){
 const method=row.owner_ref.split('#')[0],methodRaw=get(f.repo,method),input=get(f.materialRoot,'decision-log.md');
 expect(methodRaw).toContain('## '+(row.source.includes('/flows/')?'步骤':'方法'));expect(input).toContain('用户选择：');
 put(f.taskPath,ref,{source:row.source,step_slug:row.step_slug,reader:'Controlled independent source reader',inputs:`Current ${row.source} and decision-log user choice`,observation:`Read actual adjacent method ${method}; controlled choice and source identity are readable. This is one selected step readback, not all professional skills execution.`,criteria_ref:row.owner_ref,conclusion:'completed',limits:[]});
 return {ref,source:row.source,step_slug:row.step_slug};
}
describe('P3 OCR707 four-level current owner and human/program boundaries',()=>{
 it.each(['small','normal','complex','planning'])('%s actual adjacent consumers have exact owners; missing human, wrong anchor and actual failed program restore',async level=>{
  const f=currentOwnerFixture(level),first=f.expected[0],owned=r=>r.workflow_steps.find(row=>row.source===first.source&&row.step_slug===first.step_slug);
  const initial=report(f);expect(initial.workflow_steps.map(row=>({source:row.source,step_slug:row.step_slug,owner_ref:row.owner_ref}))).toEqual(f.expected);
  for(const row of initial.workflow_steps){expect(row.owner_ref).toBeTypeOf('string');expect(row.state).toBe('unavailable');expect(row.human).toEqual([]);expect(row.program).toEqual([]);expect(row.limits.join(' ')).toMatch(/human|原件|reader/);}
  const human=actualHumanFor(f,first);const script=put(f.repo,'observe-owned-program.mjs',"console.log('actual controlled program observation');\n"),success={...await command(f,'current-owner-program',[process.execPath,script]),source:first.source,step_slug:first.step_slug};
  const completeEvidence=first.step_slug==='load-context'?[human,success]:[human];
  const bind=items=>{rows(f,items,f.stages);return report(f);};expect(owned(bind(completeEvidence)).state).toBe('completed');
  expect(owned(bind([])).state).toBe('unavailable');expect(owned(bind(completeEvidence)).state).toBe('completed');
  const manifestRaw=get(f.repo,first.source),manifest=JSON.parse(manifestRaw);manifest.steps[0].observable_result=manifest.steps[0].observable_result.replace(/判定消费[：:]\s*[^；;\n]+/,'判定消费：SKILL.md#nonexistent-owned-anchor');put(f.repo,first.source,manifest);
  const wrong=owned(bind(completeEvidence));expect(wrong).toMatchObject({owner_ref:null,state:'unavailable'});put(f.repo,first.source,manifestRaw);expect(owned(bind(completeEvidence)).state).toBe('completed');
  expect(owned(bind([success])).state).toBe('unavailable');expect(owned(bind([success])).program).toHaveLength(1);
  put(f.repo,'observe-owned-program.mjs',"throw Error('actual controlled program failure');\n");const failed={...await command(f,'current-owner-program-failure',[process.execPath,script]),source:first.source,step_slug:first.step_slug};expect(failed.exit_code).toBe(1);expect(owned(bind([failed])).state).toBe('incomplete');expect(owned(bind(completeEvidence)).state).toBe('completed');
 });
});
describe('P3 OCR707 actual portable build-prd invocation branch',()=>{
 it.each(['complex','planning'])('%s only actual canonical terminal invocation adds the build-prd declaration and stage denominator',async level=>{
  const f=currentOwnerFixture(level),source='workflows/build-prd/steps.json',declared=JSON.parse(get(ROOT,source)).steps,prdKeys=declared.map(row=>({source,step_slug:row.step_slug}));
  put(f.repo,source,get(ROOT,source));put(f.repo,'workflows/build-prd/SKILL.md',get(ROOT,'workflows/build-prd/SKILL.md'));
  const manifest=JSON.parse(get(f.taskPath,'task.json'));put(f.taskPath,'task.json',{...manifest,project_name:'workflowhub',activation_cohort:'post'});
  const task={taskPath:f.taskPath,identity:{taskId:f.id}};const none=await runPortableWorkflow({task,worktreeRoot:f.repo});expect(none).toEqual({state:'not-started',ref:null,terminal:null});
  const before=report(f);expect(before.workflow_steps.filter(row=>row.source===source)).toEqual([]);expect(before.workflow_metrics.declared_stages).toEqual(f.stages);expect(before.workflow_metrics.stage_skip_numerator).toBe(0);expect(before.workflow_metrics.stage_skip_denominator).toBe(f.stages.length);expect(before.workflow_metrics.stage_skip_rate).toBe(0);
  const actual=await runPortableWorkflow({task,worktreeRoot:f.repo,input:{task_id:f.id,workflow:'build-prd',step_results:[]}});expect(actual.state).toBe('failed');expect(actual.terminal.workflow).toBe('build-prd');
  await writeStageRow(f.taskPath,{stage:'make-decision',source:actual.ref,evidence:{value:null,reason:'Actual portable call returned this failed canonical terminal; no human completion or shell command is claimed.'}});
  const branch=report(f),branchRows=branch.workflow_steps.filter(row=>row.source===source);expect(branchRows.map(({source,step_slug})=>({source,step_slug}))).toEqual(prdKeys);expect(branchRows).toHaveLength(declared.length);expect(branchRows.every(row=>row.state==='unavailable')).toBe(true);
  expect(branch.workflow_steps).toHaveLength(f.expected.length+declared.length);expect(branch.workflow_metrics.declared_stages).toEqual([...f.stages,'build-prd']);expect(branch.workflow_metrics.stage_skip_numerator).toBe(0);expect(branch.workflow_metrics.stage_skip_denominator).toBe(f.stages.length+1);expect(branch.workflow_metrics.stage_skip_rate).toBe(0);expect(branch.workflow_metrics.stage_source_refs).toContain(actual.ref);
  const terminalRaw=get(f.taskPath,actual.ref);console.log('P3 OCR707 ACTUAL PORTABLE TERMINAL',terminalRaw);rmSync(join(f.taskPath,actual.ref));const missing=report(f);expect(missing.workflow_steps.filter(row=>row.source===source)).toEqual([]);expect(missing.workflow_metrics.stage_skip_rate).toBeNull();expect(missing.limits.join(' ')).toContain(actual.ref);
  put(f.taskPath,actual.ref,terminalRaw);const restored=report(f);expect(restored.workflow_steps.filter(row=>row.source===source).map(({source,step_slug})=>({source,step_slug}))).toEqual(prdKeys);expect(restored.workflow_metrics.stage_skip_denominator).toBe(f.stages.length+1);
  const wrongIdentity={...JSON.parse(terminalRaw),task_id:'unrelated-task'};put(f.taskPath,actual.ref,wrongIdentity);expect(report(f).workflow_metrics.stage_skip_rate).toBeNull();put(f.taskPath,actual.ref,terminalRaw);expect(report(f).workflow_metrics.stage_skip_denominator).toBe(f.stages.length+1);
 });
});
describe('P3 OCR707 independent metric arithmetic',()=>{
 it('keeps a lawful skip conflict incomplete instead of dropping it from the denominator',()=>{
  const source='workflows/build-code/steps.json',step={source,step_slug:'conflicted-skip',trigger:false,executed:false,rule_ref:'controlled-skip-rule',owner_ref:'method.md#criteria'};
  const row=evaluateWorkflowSteps({steps:[step],evidence:[{source,step_slug:step.step_slug,conflict:true}],level:{value:'complex',declared:true},stageScope:{actual:[]}})[0];
  expect(row.state).toBe('incomplete');expect(row.applicability).toBe('required');expect(row.limits.join(' ')).toContain('冲突');
  const human=(conclusion)=>({ref:`human-${conclusion}.json`,readable:true,verified:true,reader:'independent reader',source,step_slug:step.step_slug,inputs:'actual skip decision',observation:'actual human readback',criteria_ref:step.owner_ref,conclusion,limits:[]});
  const humanConflict=evaluateWorkflowSteps({steps:[{...step,human_required:true}],evidence:[{source,step_slug:step.step_slug,human:human('completed')},{source,step_slug:step.step_slug,human:human('incomplete')}],level:{value:'complex',declared:true},stageScope:{actual:[]}})[0];
  expect(humanConflict.state).toBe('incomplete');
  const programFailure=evaluateWorkflowSteps({steps:[step],evidence:[{source,step_slug:step.step_slug,program:{ref:'failed-skip.json',evidence_type:'command_exit',command:'node checker.mjs',exit_code:1,readable:true,verified:true}}],level:{value:'complex',declared:true},stageScope:{actual:[]}})[0];
  expect(programFailure.state).toBe('incomplete');
 });
 it('counts a shared real command original once per step among eleven applicable current normal steps, with duplicate reuse and lawful NA',async()=>{
  const f=currentOwnerFixture('normal');expect(f.expected).toHaveLength(11);const source='skills/decision-log/SKILL.md';put(f.repo,'workflows/make-decision/skill-deps.yaml',get(ROOT,'workflows/make-decision/skill-deps.yaml'));put(f.repo,source,get(ROOT,source));
  const skip=await skillTriggerObservation(f,{requested:false}),script=put(f.repo,'metric-observation.mjs',"console.log('bounded actual metric observation');\n"),a=await command(f,'metric-original-a',[process.execPath,script]),b=await command(f,'metric-original-b',[process.execPath,script]);
  const evidence=[{...a,source:f.expected[0].source,step_slug:f.expected[0].step_slug},{...b,source:f.expected[1].source,step_slug:f.expected[1].step_slug},{...a,source:f.expected[2].source,step_slug:f.expected[2].step_slug},skip];rows(f,evidence,f.stages);const r=report(f),m=r.workflow_metrics;
  const applicable=f.expected.map(({source,step_slug})=>({source,step_slug})),attested=[{...applicable[0],ref:a.ref},{...applicable[1],ref:b.ref},{...applicable[2],ref:a.ref}];expect(m.declared_steps).toEqual([...applicable,{source,step_slug:'decision-log'}]);expect(m.applicable_steps).toEqual(applicable);expect(m.attested_steps).toEqual(attested);expect(m.step_attestation_numerator).toBe(3);expect(m.step_attestation_denominator).toBe(11);expect(m.step_attestation_coverage).toBe(3/11);expect(m.stage_skip_numerator).toBe(0);expect(m.stage_skip_denominator).toBe(1);expect(m.stage_skip_rate).toBe(0);expect(r.workflow_steps.filter(row=>row.state==='completed')).toEqual([]);
 });
 it('trusted pure caller confirmed skip is exactly 1/4; it does not claim any persisted skip producer',()=>{
  const pure=summarizeWorkflow([{source:'owned/source.json',step_slug:'observed',state:'unavailable',basis:[]}],{verified:true,declared:['make-decision','build-plan','build-code','verify-code'],actual:[{stage:'make-decision'},{stage:'build-plan'},{stage:'build-code'}],skipped:[{stage:'verify-code',confirmed:true,rule_ref:'trusted-caller-confirmed-skip'}]});expect(pure.stage_skip_numerator).toBe(1);expect(pure.stage_skip_denominator).toBe(4);expect(pure.stage_skip_rate).toBe(1/4);
 });
});
