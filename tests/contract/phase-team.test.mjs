// Frozen P2 target after recorded RED; assertion changes require an independently reviewed TCR.
// Controlled local reader/replay only: not a production scheduler, provider or Git delivery proof.
import {describe,it,expect,afterEach} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync,lstatSync,readlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {openTask} from '../../runtime/task/task-handle.mjs';
import {validatePostPhaseContract} from '../../runtime/stage/stage-content-contracts.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const methodPath='workflows/build-code/SKILL.md';
const docs=[methodPath,'docs/standard-workflow.md','AGENTS.md','skills/wh-review/SKILL.md','skills/stage-handoff/SKILL.md'];
const roots=[];
afterEach(()=>{for(const path of roots.splice(0))rmSync(path,{recursive:true,force:true});});
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const read=path=>readFileSync(join(root,path),'utf8');

// This independent reader consumes the actual method, not an implementation export.
// The numbered actions have one source; a removed/reordered action invalidates the reader.
function readContract(body=read(methodPath)) {
  const section=body.split('### Phase 三角色与七步顺序\n')[1]?.split(/^#{1,3} /m)[0];
  if(!section)throw new Error('missing Phase method');
  const steps=[...section.matchAll(/^([1-7])\. (.+)$/gm)];
  if(steps.length!==7||steps.some((s,i)=>Number(s[1])!==i+1))throw new Error('seven ordered steps required');
  const meanings=[/Phase packet/,/开发.*目标测试.*通知/,/再派审查.*测试/,/finding.*开发.*受影响/,/开发.*最后确认/,/四项.*open finding.*测试失败.*Done.*AC/,/AC.*方向.*用户独占.*严重风险/];
  meanings.forEach((pattern,i)=>{if(!pattern.test(steps[i][2]))throw new Error(`step ${i+1} meaning missing`);});
  for(const text of ['1 开发、1 审查、1 测试','开发是唯一 writer','审查与测试不改代码、测试或材料','审查回报列 finding 与未解决项','测试回报列命令、退出码、失败归因与覆盖限制','开发最后确认之前','受影响方重新明确回报','每轮审后一次提交','同一开发子代理'])if(!section.includes(text))throw new Error(`missing rule: ${text}`);
  return {steps:steps.map(s=>s[2])};
}

function buildControlledPhase() {
  const base=mkdtempSync(join(tmpdir(),'phase-team-'));roots.push(base);
  const repo=join(base,'repo'),wt=join(base,'worktree'),id='phase-team-fixture',taskDir=join(base,'Projects','workflowhub','tasks',id);
  mkdirSync(repo);mkdirSync(taskDir,{recursive:true});mkdirSync(join(base,'hooks'));
  git(repo,'init','-q','-b','main');git(repo,'config','user.name','Phase fixture');git(repo,'config','user.email','fixture@example.invalid');git(repo,'config','commit.gpgsign','false');git(repo,'config','core.hooksPath',join(base,'hooks'));
  writeFileSync(join(repo,'owned.mjs'),'export const result=0;\n');writeFileSync(join(repo,'sentinel.txt'),'tracked readonly\n');writeFileSync(join(repo,'.gitignore'),'ignored.txt\n');git(repo,'add','.');git(repo,'commit','-qm','fixture baseline');git(repo,'worktree','add','-q','-b','fixture',wt);
  const materials=join(wt,'specs',id);mkdirSync(join(materials,'phases'),{recursive:true});
  const command="node --input-type=module -e \"import {result} from './owned.mjs';if(result!==1)process.exit(1)\"";
  writeFileSync(join(materials,'spec.md'),'# Controlled Phase\n\nR-001: return integer 1.\n\n- **FR-PHASE-001**: source R-001; integer 1; AC-PHASE-001.\n\n## 实现设计（全局权威）\n\n### 代码锚点\n\n`owned.mjs` exports result to local Node import.\n\n### 接口与失败语义\n\nESM returns integer 1; wrong values and import failures remain errors.\n\n### 全局验证策略\n\n`node --version` is an environment probe only; the Task gate_cmd imports the actual module and compares integer 1; controlled invalid traces fail independently.\n\n### 需求到任务追踪\n\n| Source | FR | AC | Phase/Task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-PHASE-001 | AC-PHASE-001 | P1/T002 | ORACLE-PHASE-TEAM |\n\n## Appendix A\n\n- **AC-PHASE-001**: result is 1; other values fail.\n');
  writeFileSync(join(materials,'phases/index.md'),'# Index\n\n## Execution Index\n\n| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1-fixture.md | L0 — local result | `owned.mjs` | none | reader |\n');
  const fields={
    'Source / FR / AC':'R-001 / FR-PHASE-001 / AC-PHASE-001: integer 1.',
    'Files / symbols':'`owned.mjs`; symbol: result',Action:'Change result from 0 to 1; only the declared file is writable.',Inputs:'none; current owned.mjs and local Node executable.',
    'Outputs / failure':'Integer 1; wrong result or import failure is nonzero.',
    'Boundary / DO NOT TOUCH':'Other files and materials remain readonly.',Dependency:'none',
    'Test tier / skill':'feature / backend-testing; local module only.',
    'Scenario / fixture or service':'Temporary Git worktree and real local ESM import, no network.',
    'RED/GREEN gate_cmd':'`'+command+'`',expected_exit:'RED nonzero; GREEN 0',
    'RED target failure':'ORACLE-PHASE-TEAM expected result 1; baseline result 0 assertion fails.',
    'GREEN oracle':'ORACLE-PHASE-TEAM imported result strictly equals 1.',Evidence:'Actual capture command and output; no prefilled execution claim.',
    'STOP / recovery':'Keep import failure distinct from result assertion failure; return to original developer.',
    'Coverage limit':'Local fixture only, no platform scheduling or provider guarantee.',Done:'AC-PHASE-001 has actual command and independent result; no automatic quality claim.'
  };
  writeFileSync(join(materials,'phases/P1-fixture.md'),'# Phase P1 — local result\n\n- **Global spec**: `spec.md#实现设计全局权威`\n- **Write set**: `owned.mjs`\n- **Dependency**: none\n- **Consumer**: reader\n- **gate_cmd**: `'+command+'`\n- **oracle**: ORACLE-PHASE-TEAM\n- **evidence_path**: `quality/tests/result.output`\n- **STOP**: Missing input returns to developer, preserving failure.\n- **Done**: AC-PHASE-001 actual result and evidence.\n\n## L0 — local result\n\nFR-PHASE-001 / AC-PHASE-001 return integer 1.\n\n## L1 — executable contract\n\n### T002 — local result\n\n'+Object.entries(fields).map(([key,value])=>`- **${key}**: ${value}`).join('\n')+'\n\n## L2 — reference\n\nControlled local input.\n');
  git(wt,'add','.');git(wt,'commit','-qm','fixture materials');
  writeFileSync(join(wt,'untracked.txt'),'existing untracked readonly\n');writeFileSync(join(wt,'ignored.txt'),'ignored readonly\n');
  writeFileSync(join(taskDir,'task.json'),JSON.stringify({schema_version:'1.0.0',project_name:'workflowhub',task_id:id,target_repo_root:repo,record_model:'vnext-single-write',activation_cohort:'post',workspace_mode:'existing',workspace_root:wt}));writeFileSync(join(taskDir,'facts.jsonl'),'');
  const task=openTask(taskDir,{projectName:'workflowhub',taskId:id});
  const tree=()=>Object.fromEntries(['owned.mjs',...['spec.md','phases/index.md','phases/P1-fixture.md'].map(p=>`specs/${id}/${p}`)].map(p=>[p,readFileSync(join(wt,p),'utf8')]));
  return {wt,task,tree,events:[],commits:0,phase:'P1',dev:'dev-session-1'};
}

// Full set/type/content comparison stays in memory; only differences leave this helper.
// Git administration is outside the observed product worktree. This observes stable
// boundary changes, not write-and-restore activity or operating-system permissions.
function workspaceState(wt) {
  const state={};
  function visit(relative='') {for(const name of readdirSync(join(wt,relative))){if(!relative&&name==='.git')continue;const path=relative?relative+'/'+name:name,absolute=join(wt,path),stat=lstatSync(absolute);if(stat.isSymbolicLink())state[path]='link:'+readlinkSync(absolute);else if(stat.isDirectory()){state[path]='directory';visit(path);}else state[path]='file:'+createHash('sha256').update(readFileSync(absolute)).digest('hex');}}
  visit();return state;
}
function changePaths(before,after) {return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(path=>before[path]!==after[path]);}
function mutateReadonly(f,role) {
  const input=f.roleMutation;if(input?.role!==role)return;
  const path=input.kind==='new-untracked'?'new-by-readonly.txt':input.kind==='existing-untracked'?'untracked.txt':input.kind==='ignored'?'ignored.txt':'sentinel.txt';
  if(input.kind==='type-change'){rmSync(join(f.wt,path));mkdirSync(join(f.wt,path));}else writeFileSync(join(f.wt,path),'readonly role changed bytes\n');
}
async function roleReport(f,run,role,{open=[],omit=false,devReceipt,limits='local fixture only'}={}) {
  run(role,'start');const before=workspaceState(f.wt);mutateReadonly(f,role);
  let receipt;
  if(role==='test'){receipt=await f.task.captureCommand({cwd:f.wt,slug:'test-role-result',argv:[process.execPath,'--input-type=module','-e',"import {result} from './owned.mjs';if(result!==1)process.exit(1)"]});run('test','executed',{receipt,dev_receipt_ref:devReceipt.receipt_ref});}
  run(role,'readonly',{changes:changePaths(before,workspaceState(f.wt))});
  if(!omit)run(role,'report',{open,unresolved:[],...(role==='test'?{command:receipt.argv,exit:receipt.exit_code,execution_ref:receipt.receipt_ref,limits}:{})});
}
async function playSevenSteps(f,{finding=false,late=false,omit,devAlone=false,early=false,mutateRole,roleMutation,secondWriter=false,doubleCommit=false,hostAction,route='dev-session-1',missingFinal=false,skipRetestReport=false}={}) {
  const contract=readContract(); // Gate replay on the real current body, including report obligations.
  const run=(role,step,extra={})=>f.events.push({role,step,at:f.events.length+1,phase:f.phase,session:role==='dev'?f.dev:role,...extra});
  run('host','packet',{steps:contract.steps.length});
  if(early)run('review','start');
  writeFileSync(join(f.wt,'owned.mjs'),'export const result=1;\n');run('dev','write',{paths:['owned.mjs']});
  const receipt=await f.task.captureCommand({cwd:f.wt,slug:'local-target',argv:[process.execPath,'--input-type=module','-e',"import {result} from './owned.mjs';if(result!==1)process.exit(1)"]});
  run('dev','tested',{receipt});run('dev','done');
  const before=f.tree();f.roleMutation=roleMutation;
  if(mutateRole){writeFileSync(join(f.wt,'owned.mjs'),'export const result=99;\n');run(mutateRole,'write',{paths:['owned.mjs']});}
  if(secondWriter)run('test','write',{paths:['owned.mjs']});
  for(const role of ['review','test'])await roleReport(f,run,role,{open:finding?['F1']:[],omit:devAlone||(Array.isArray(omit)?omit:[omit]).includes(role),devReceipt:receipt});
  const after=f.tree();
  if(devAlone)run('dev','declared-pass');
  if(finding)await injectFinding(f,run,route,skipRetestReport);
  if(hostAction)run('host',hostAction);
  if(!missingFinal)run('dev','final');
  run('host','check',{checks:['no open finding','no unexplained test failure','Phase Done','AC complete']});
  git(f.wt,'add','owned.mjs');git(f.wt,'commit','-qm','fixture reviewed round');f.commits++;run('dev','commit',{round:1});
  if(doubleCommit){f.commits++;run('dev','commit',{round:1});}
  if(late)await reopenLateFinding(f,run,route,skipRetestReport);
  return {input:{finding,late,omit,devAlone},before,after,events:f.events,changed:git(f.wt,'diff','--name-only','HEAD~1','HEAD').split('\n'),commits:f.commits};
}
async function injectFinding(f,run,route,skipRetestReport,late=false) {
  run('review','finding',{target:route});const bytes='export const result=1;\n'+(late?'// late repair: retain declared result\n':'// ordinary repair: retain declared result\n');writeFileSync(join(f.wt,'owned.mjs'),bytes);run('dev','write',{paths:['owned.mjs'],bytes});run('dev','repair',{paths:['owned.mjs'],cases:['result']});
  const receipt=await f.task.captureCommand({cwd:f.wt,slug:'affected-result',argv:[process.execPath,'--input-type=module','-e',"import {result} from './owned.mjs';if(result!==1)process.exit(1)"]});run('dev','retested',{receipt,cases:['result']});
  if(!skipRetestReport)for(const role of ['review','test'])await roleReport(f,run,role,{devReceipt:receipt,limits:'affected result only'});
}
async function reopenLateFinding(f,run,route,skip) {
  run('review','late',{target:route});run('host','reopen');await injectFinding(f,run,route,skip,true);run('dev','final');run('host','check',{checks:['no open finding','no unexplained test failure','Phase Done','AC complete']});
  // A real second fixture commit, while retaining the same Phase and developer context.
  git(f.wt,'add','owned.mjs');git(f.wt,'commit','-qm','fixture late reviewed repair');f.commits++;run('dev','commit',{round:2});
}
function verifyReplay(r) {
  const e=r.events,done=e.find(x=>x.step==='done');
  if(e.some(x=>x.step==='start'&&x.at<=done.at))throw new Error('early dispatch');
  if(e.filter(x=>x.step==='write').some(x=>x.role!=='dev'))throw new Error('second writer');
  if(e.some(x=>x.step==='readonly'&&x.changes.length))throw new Error('readonly workspace changed');
  if(JSON.stringify(r.before)!==JSON.stringify(r.after))throw new Error('readonly bytes changed');
  if(r.changed.join(',')!=='owned.mjs')throw new Error('outside write set');
  for(const c of e.filter(x=>x.step==='commit')) {
    if(e.filter(x=>x.step==='commit'&&x.round===c.round).length!==1)throw new Error('duplicate commit');
    const previous=e.filter(x=>x.step==='commit'&&x.at<c.at).at(-1),prior=e.filter(x=>x.at<c.at&&x.at>(previous?.at??0)),last=step=>prior.filter(x=>x.step===step).at(-1),final=last('final'),repair=last('repair');
    if(!final||final.at<Math.max(done.at,repair?.at??0))throw new Error('missing dev final');
    for(const role of ['review','test']) {
      const report=prior.filter(x=>x.role===role&&x.step==='report').at(-1);
      if(!report||report.at>=final.at||report.at<(repair?.at??0)||report.open.length||report.unresolved.length)throw new Error('missing or unresolved report');
      if(role==='test'&&(!Array.isArray(report.command)||report.exit!==0||!report.limits))throw new Error('test report facts missing');
      if(role==='test'){
        const executed=prior.filter(x=>x.role==='test'&&x.step==='executed').at(-1),start=prior.filter(x=>x.role==='test'&&x.step==='start').at(-1),dev=prior.filter(x=>['tested','retested'].includes(x.step)).at(-1);
        if(!executed||!start||!dev||executed.at<=start.at||executed.at<=dev.at||report.at<=executed.at||report.execution_ref!==executed.receipt.receipt_ref||executed.receipt.receipt_ref===dev.receipt.receipt_ref||executed.dev_receipt_ref!==dev.receipt.receipt_ref||Date.parse(executed.receipt.started_at)<Date.parse(dev.receipt.ended_at)||Date.parse(executed.receipt.ended_at)<Date.parse(executed.receipt.started_at)||executed.receipt.exit_code!==report.exit||JSON.stringify(executed.receipt.argv)!==JSON.stringify(report.command))throw new Error('independent test execution');
      }
    }
    const check=last('check');if(!check)throw new Error('host check order');
    if(check.checks?.join('|')!=='no open finding|no unexplained test failure|Phase Done|AC complete')throw new Error('host checks');
    if(check.at<=final.at||['review','test'].some(role=>check.at<=prior.filter(x=>x.role===role&&x.step==='report').at(-1).at))throw new Error('host check order');
  }
  if(e.some(x=>x.role==='host'&&!['packet','check','reopen'].includes(x.step)))throw new Error('host exceeded role');
  if(e.some(x=>['finding','late'].includes(x.step)&&x.target!=='dev-session-1'))throw new Error('wrong repair owner');
  if(e.some(x=>x.phase!=='P1'||(x.role==='dev'&&x.session!=='dev-session-1')))throw new Error('changed phase/context');
  if(r.input.late&&(!e.some(x=>x.step==='late')||!e.some(x=>x.step==='reopen')||r.commits!==2))throw new Error('late finding lost');
  return true;
}
function showProof(r) {
  const hash=value=>createHash('sha256').update(value).digest('hex');
  // Actual outer task capture preserves these observations before fixture cleanup;
  // temporary receipt paths are deliberately excluded rather than left dangling.
  console.log('P2_LOCAL_PROOF '+JSON.stringify({input:r.input,events:r.events.map(({receipt,execution_ref,dev_receipt_ref,...event})=>({...event,...(receipt?{command:{argv:receipt.argv,exit:receipt.exit_code,signal:receipt.signal,timed_out:receipt.timed_out,cancelled:receipt.cancelled,started_at:receipt.started_at,ended_at:receipt.ended_at},independent_ref:receipt.receipt_ref!==dev_receipt_ref}:{})})),selected_bytes:{before:r.before['owned.mjs'],after:r.after['owned.mjs']},materials_unchanged:Object.keys(r.before).filter(p=>p!=='owned.mjs').map(path=>({path,before_sha256:hash(r.before[path]),after_sha256:hash(r.after[path])})),changed:r.changed,commits:r.commits,coverage:'Static method reader + controlled local Git/openTask/capture only; no real provider, platform role permissions, dispatch or performance proof. Complete in-memory worktree comparison observes stable boundary changes, not write-and-restore activity.'}));
}

describe('ORACLE-PHASE-TEAM',()=>{
  it('consumes the actual seven-step body and all five consumer documents',()=>{
    expect(readContract().steps).toHaveLength(7);
    for(const path of docs.slice(1)){const body=read(path);expect(body,path).toContain('三角色');expect(body,path).toContain('build-code');}
    const entry=JSON.parse(read('docs/architecture/move-map.json')).entries.find(e=>e.source==='tests/contract/phase-team.test.mjs');expect(entry?.consumer).toContain('P2');expect(entry?.delete_condition).toBeTruthy();
  });
  it('rejects absent or reordered method actions instead of accepting labels alone',()=>{
    const body=read(methodPath);expect(()=>readContract(body.replace('3. 主会话再派审查','3. 省略审查'))).toThrow();expect(()=>readContract(body.replace('开发最后确认之前','开发最后确认之后'))).toThrow();
  });
  it('uses a complete 17-field task card accepted by the real material parser',()=>{
    const f=buildControlledPhase(),p=join(f.wt,'specs','phase-team-fixture');
    const phases=Object.fromEntries(readdirSync(join(p,'phases')).filter(x=>x!== 'index.md').map(x=>['phases/'+x,readFileSync(join(p,'phases',x),'utf8')]));
    const result=validatePostPhaseContract({spec:readFileSync(join(p,'spec.md'),'utf8'),index:readFileSync(join(p,'phases/index.md'),'utf8'),phases,phase_id:'P1'});
    expect(result.errors).toEqual([]);expect(result.ok).toBe(true);
  });
  it('requires every late repair byte to precede its retest, reports and final confirmation',async()=>{
    const f=buildControlledPhase(),r=await playSevenSteps(f,{late:true});
    const late=r.events.find(x=>x.step==='late'),writes=r.events.filter(x=>x.role==='dev'&&x.step==='write'&&x.at>late.at);
    expect(writes).toHaveLength(1);
    expect(writes[0].at).toBeLessThan(r.events.find(x=>x.step==='retested'&&x.at>late.at).at);
    expect(readFileSync(join(f.wt,'owned.mjs'),'utf8')).toBe(writes[0].bytes);
  });
  it('retains the declared result===1 command through ordinary and late repair',async()=>{
    for(const options of [{finding:true},{late:true}]){
      const f=buildControlledPhase(),r=await playSevenSteps(f,options),original=r.events.find(e=>e.step==='tested').receipt.argv;
      for(const event of r.events.filter(e=>e.step==='retested'))expect(event.receipt.argv).toEqual(original);
      const module=await import('file://'+join(f.wt,'owned.mjs'));expect(module.result).toBe(1);
    }
  });
  it('rejects actual result 2 with otherwise complete role and report events',async()=>{
    const f=buildControlledPhase(),r=await playSevenSteps(f);expect(verifyReplay(r)).toBe(true);
    writeFileSync(join(f.wt,'owned.mjs'),'export const result=2;\n');
    const receipt=await f.task.captureCommand({cwd:f.wt,slug:'invalid-result-two',argv:r.events.find(e=>e.step==='tested').receipt.argv});
    expect(receipt.exit_code).toBe(1);
    const report=r.events.find(e=>e.role==='test'&&e.step==='report');report.exit=receipt.exit_code;
    expect(()=>verifyReplay(r)).toThrow('test report facts missing');
    console.log('P2_INVALID_RESULT '+JSON.stringify({source:readFileSync(join(f.wt,'owned.mjs'),'utf8'),argv:receipt.argv,exit:receipt.exit_code,complete_events:r.events.map(e=>({role:e.role,step:e.step})),coverage:'actual local result failure; no provider/platform claim'}));
  });
  it('rejects developer receipt substituted for the test role execution',async()=>{
    const r=await playSevenSteps(buildControlledPhase());r.events.find(e=>e.role==='test'&&e.step==='report').execution_ref=r.events.find(e=>e.step==='tested').receipt.receipt_ref;
    expect(()=>verifyReplay(r)).toThrow('independent test execution');
  });
  it('rejects previous round test receipt reused after an affected repair',async()=>{
    const r=await playSevenSteps(buildControlledPhase(),{late:true}),reports=r.events.filter(e=>e.role==='test'&&e.step==='report');reports.at(-1).execution_ref=reports[0].execution_ref;
    expect(()=>verifyReplay(r)).toThrow('independent test execution');
  });
  for(const role of ['review','test'])for(const kind of ['new-untracked','tracked-other','existing-untracked','ignored','type-change'])it(`rejects ${role} ${kind} write outside the four selected paths`,async()=>{
    const r=await playSevenSteps(buildControlledPhase(),{roleMutation:{role,kind}});expect(()=>verifyReplay(r)).toThrow('readonly workspace changed');
  });
  for(const scenario of ['normal','ordinary','late'])for(const boundary of ['before-final','before-report','old-round-check'])it(`rejects ${scenario} host check ${boundary}`,async()=>{
    const r=await playSevenSteps(buildControlledPhase(),{finding:scenario==='ordinary',late:scenario==='late'}),checks=r.events.filter(e=>e.step==='check'),check=checks.at(-1),finals=r.events.filter(e=>e.step==='final'),reports=r.events.filter(e=>e.role==='test'&&e.step==='report');
    // Move the event itself and regenerate monotonic logical timestamps; do not
    // leave array order contradicting the claimed execution order.
    r.events.splice(r.events.indexOf(check),1);
    const target=boundary==='before-final'?finals.at(-1):boundary==='before-report'?reports.at(-1):r.events[0];
    r.events.splice(r.events.indexOf(target),0,check);r.events.forEach((event,index)=>{event.at=index+1;});
    expect(()=>verifyReplay(r)).toThrow('host check order');
  });
  it('rejects independently missing both reports and a developer-only pass message',async()=>{
    for(const options of [{omit:['review','test']},{devAlone:true}]){const r=await playSevenSteps(buildControlledPhase(),options);expect(()=>verifyReplay(r)).toThrow('missing or unresolved report');}
  });
  it('rejects a silently changed byte even when no second writer event exists',async()=>{
    const r=await playSevenSteps(buildControlledPhase());r.after['owned.mjs']='silently corrupted';expect(()=>verifyReplay(r)).toThrow('readonly bytes changed');
  });
  for(const mutation of ['drop late','no reopen','change phase','change developer'])it(`rejects ${mutation} independently`,async()=>{
    const r=await playSevenSteps(buildControlledPhase(),{late:true});
    if(mutation==='drop late')r.events=r.events.filter(e=>!['late','reopen'].includes(e.step));
    if(mutation==='no reopen')r.events=r.events.filter(e=>e.step!=='reopen');
    if(mutation==='change phase')r.events.at(-1).phase='P3';
    if(mutation==='change developer')r.events.at(-1).session='new-developer';
    expect(()=>verifyReplay(r)).toThrow(mutation==='drop late'?'late finding lost':mutation==='no reopen'?'late finding lost':'changed phase/context');
  });
  it('replays real local writes, readonly bytes, command receipts and one reviewed commit',async()=>{const f=buildControlledPhase(),r=await playSevenSteps(f);expect(verifyReplay(r)).toBe(true);expect(readdirSync(f.task.recordPath('quality/tests')).some(p=>p.endsWith('.json'))).toBe(true);showProof(r);});
  it('returns ordinary findings to the same developer and re-reports affected cases',async()=>{const r=await playSevenSteps(buildControlledPhase(),{finding:true});expect(verifyReplay(r)).toBe(true);showProof(r);});
  it('reopens late findings in the same Phase with one additional reviewed commit',async()=>{const r=await playSevenSteps(buildControlledPhase(),{late:true});expect(verifyReplay(r)).toBe(true);showProof(r);});
  for(const [name,options,error] of [
    ['early dispatch',{early:true},'early dispatch'],['second writer',{secondWriter:true},'second writer'],['review writes bytes',{mutateRole:'review'},'second writer'],['test writes bytes',{mutateRole:'test'},'second writer'],['no dev final',{missingFinal:true},'missing dev final'],['host writes',{hostAction:'write'},'second writer'],['host runs tests',{hostAction:'test'},'host exceeded role'],['duplicate commit',{doubleCommit:true},'duplicate commit'],['wrong finding owner',{finding:true,route:'review'},'wrong repair owner'],['no review report',{omit:'review'},'missing or unresolved report'],['no test report',{omit:'test'},'missing or unresolved report'],['dev alone declares pass',{devAlone:true},'missing or unresolved report'],['repair without report',{finding:true,skipRetestReport:true},'missing or unresolved report'],['late repair without report',{late:true,skipRetestReport:true},'missing or unresolved report']
  ])it(`rejects ${name}`,async()=>{const replay=await playSevenSteps(buildControlledPhase(),options);expect(()=>verifyReplay(replay)).toThrow(error);});
});
