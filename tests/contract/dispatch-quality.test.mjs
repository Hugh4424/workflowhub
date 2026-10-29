// ORACLE-DISPATCH-QUALITY. Local controlled replay; no production scheduler/provider.
// Independent design: task quality/evidence/2026-10-28-058-c05-p1-p2-independent-test-design.md.
import {describe,it,expect,afterEach} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {openTask} from '../../runtime/task/task-handle.mjs';
const root=resolve(import.meta.dirname,'../..');
const dirs=[];afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
const labels=['做什么','为什么','读什么','只能改什么','怎么做','算做完','何时停','回什么'];
const returns=['任务','结论与状态','已做与未做','产物或原件引用','失败与限制','下一消费者动作'];
function policy(){
 const agents=readFileSync(join(root,'AGENTS.md'),'utf8');
 const method=readFileSync(join(root,'workflows/build-code/SKILL.md'),'utf8');
 const review=readFileSync(join(root,'skills/wh-review/SKILL.md'),'utf8');
 // Absence preserves the old policy's lack of this restriction, so new cases expose it.
 const eight=/八节 brief[：:]([^\n]+)/.exec(agents)?.[1]??'';
 const limit=/正文不超过\s*(\d+)\s*字/.exec(agents);
 return {brief:labels.filter(x=>eight.includes(x)),limit:limit?Number(limit[1]):Infinity,
 pointer:/超长[^\n]*5 行摘要/.test(agents),
 ready:/不得早于开发完成并明确通知/.test(method),
 axes:/两个互不继承对方上下文的独立执行者/.test(method),
 late:/迟到 finding：重开同一 Phase，回同一开发子代理修/.test(method),
 unchanged:/三检查/.test(method),
 unavailable:/不可用.*不是空 findings/.test(review),
 readonly:/审查与测试不改代码、测试或材料/.test(method)};
}
// Explicit local event model: requirements at each boundary stay together instead of
// treating optional events as proof that a required event occurred. Full host packet,
// four-check and commit behavior remains in the unchanged frozen phase-team replay.
function parallelRules(e,reject){
 const shared=[],serial=e.b.dependencies.includes(e.a.id)&&e.serial;
 const left=new Set(e.a.paths.map(x=>realpathSync(x)));
 if(e.b.paths.some(x=>left.has(realpathSync(x))))shared.push('shared path');
 for(const dimension of ['input','interface','data','port']){
  const values=[e.a,e.b].map(phase=>{
   const fact=phase.dimensions?.[dimension];
   if(fact?.notApplicable?.trim())return null;
   if(!fact||!['read','write'].includes(fact.access)||(!fact.path&&!fact.id)){
    reject(`parallel dimension ${dimension} requires concrete resource fact or named N/A reason`);return null;
   }
   return {id:fact.path?realpathSync(fact.path):fact.id,access:fact.access};
  });
  if(values.every(Boolean)&&values[0].id===values[1].id&&values.some(x=>x.access==='write'))shared.push(`shared mutable resource ${dimension}`);
 }
 if(shared.length&&!serial)reject(`${shared.join(', ')} requires dependency/serial writer`);
 if(e.b.dependencies.includes(e.a.id)&&!e.serial)reject('dependency requires serial execution');
}
function retryRules(e,reject){
 if(!e.changed||!e.checks?.rootCause||!e.checks?.complexity||!e.checks?.alternative)reject('no new facts: root cause/complexity/simpler alternative before repeat');
 const fields=['input','failure','method'];
 if(fields.some(key=>typeof e.before?.[key]!=='string'||!e.before[key]||typeof e.after?.[key]!=='string'||!e.after[key]))reject('no new facts: comparable input/failure/method facts required');
 else if(fields.every(key=>e.before[key]===e.after[key]))reject('no substantive input/failure/method change; timestamp/text change is not progress');
}
function replay(events,p=policy()){
 const seen=new Map(),errors=[];let last=0;
 const requiresDone={start:'review/test starts before developer completion',axis:'supplement axis starts before developer completion',repair:'repair before developer completion',report:'report before developer completion','test-result':'test before developer completion',final:'final before developer completion'};
 for(const e of events){
  const reject=rule=>errors.push(`${e.phase??'packet'} event ${e.n}: ${rule}`);
  if(e.n<=last)reject('event order');last=e.n;
  switch(e.kind){
   case 'brief':for(const key of p.brief)if(!e.body[key]?.trim())reject(`brief ${key}`);continue;
   case 'return':
    for(const key of returns)if(!e.body[key]?.trim())reject(`return ${key}`);
    if(e.text.length>p.limit)reject('return 2000');
    if(p.pointer&&e.rawLog)reject('return raw log requires original pointer');continue;
   case 'parallel':parallelRules(e,reject);continue;
   case 'repeat':if(p.unchanged)retryRules(e,reject);continue;
   case 'time-stop':reject('elapsed time cannot stop task');continue;
   case 'provider':{
    if(p.unavailable){const valid=e.results.filter(x=>x.status==='completed'&&x.parse==='ok');
     if(!valid.length&&e.claim==='pass')reject('provider unavailable/failed/invalid/empty is not empty findings pass');
     if(valid.length<e.results.length&&e.claim!=='partial')reject('provider failures must remain partial');}
    continue;
   }
  }
  let s=seen.get(e.phase);
  if(!s){s={writer:e.dev,done:false,reports:new Set(),axes:new Map(),open:new Set(),repair:0,validRetest:false};seen.set(e.phase,s);}
  if(p.ready&&requiresDone[e.kind]&&!s.done)reject(requiresDone[e.kind]);
  switch(e.kind){
   case 'dev-done':
    if(s.writer&&e.dev&&e.dev!==s.writer)reject('unique writer: completion changes Phase developer');
    s.writer??=e.dev;s.done=true;break;
   case 'axis':
    if(p.axes&&(!e.session?.trim()||e.session===s.writer))reject('developer cannot execute independent Standards/Spec axis; distinct session required');
    if(p.axes&&[...s.axes.values()].includes(e.session))reject('Standards/Spec require independent sessions');
    s.axes.set(e.axis,e.session);break;
   case 'write':
    if(p.readonly){if(e.role!=='dev')reject('readonly role changed workspace');
     else if(!s.writer||e.session!==s.writer)reject('unique writer: developer session differs from Phase writer');}
    break;
   case 'finding':s.open.add(e.id);break;
   case 'repair':
    if(p.late&&(e.targetPhase!==e.phase||e.session!==s.writer))reject('finding must return to same Phase/developer');
    s.open.delete(e.id);s.repair=e.n;s.reports.clear();s.validRetest=false;break;
   case 'test-result':
    if(e.session===s.writer||e.receiptRef===e.devReceiptRef)reject('independent test receipt required');
    if(e.receiptAt<s.repair)reject('old receipt predates repair');
    if(e.exit!==0)reject('target command failed');
    s.validRetest=Boolean(e.session&&e.session!==s.writer&&e.receiptRef&&e.receiptRef!==e.devReceiptRef&&e.receiptAt>=s.repair&&e.exit===0);break;
   case 'report':s.reports.add(e.role);break;
   case 'final':
    if(s.repair&&!s.validRetest)reject('post-repair independent test result with current receipt required before final');
    if(p.axes)for(const axis of ['Standards','Spec'])if(!s.axes.has(axis))reject(`required independent axis ${axis} missing before final`);
    if(s.open.size)reject('open finding including late finding');
    if(!s.reports.has('test')||!s.reports.has('review'))reject('affected test/review reports required before final');break;
  }
 }
 return errors;
}
const trace=(extra=[])=>[{kind:'dev-done',phase:'P2',dev:'dev-2'},
 {kind:'start',phase:'P2',role:'review'},{kind:'start',phase:'P2',role:'test'},
 {kind:'axis',phase:'P2',axis:'Standards',session:'standards-2'},
 {kind:'axis',phase:'P2',axis:'Spec',session:'spec-2'},
 {kind:'report',phase:'P2',role:'review'},{kind:'report',phase:'P2',role:'test'},
 ...extra,{kind:'final',phase:'P2'}].map((e,i)=>({...e,n:i+1}));
const rejected=(events,why)=>expect(replay(events).join('\n')).toMatch(why);
function fixture(){const base=mkdtempSync(join(tmpdir(),'dispatch-quality-'));dirs.push(base);mkdirSync(join(base,'work'));const path=join(base,'work','same.mjs');writeFileSync(path,'export const value=7;\n');return {base,path};}
async function capturedIndependentResult(){
 const {base,path}=fixture(),id='dispatch-repair-fixture',taskRoot=join(base,'Projects','workflowhub','tasks',id);
 mkdirSync(taskRoot,{recursive:true});writeFileSync(join(taskRoot,'task.json'),JSON.stringify({schema_version:'1.0.0',record_model:'vnext-single-write',activation_cohort:'post',project_name:'workflowhub',task_id:id,target_repo_root:base}));writeFileSync(join(taskRoot,'facts.jsonl'),'');
 const task=openTask(taskRoot,{projectName:'workflowhub',taskId:id});
 const receipt=await task.captureCommand({cwd:base,slug:'independent-repair-result',argv:[process.execPath,'--input-type=module','-e',`import {value} from ${JSON.stringify('file://'+path)};if(value!==7)throw Error('expected independent literal 7');`]});
 return {kind:'test-result',phase:'P2',session:'test-2',receiptRef:receipt.receipt_ref,devReceiptRef:'developer-original',receiptAt:10,exit:receipt.exit_code};
}
function independentParallelFixture(){
 const {base,path}=fixture(),other=join(base,'work','other.mjs');writeFileSync(other,'export const value=9;\n');
 const phase=(id,output)=>{const input=join(base,id+'-input.json'),data=join(base,id+'-data.json');writeFileSync(input,JSON.stringify({seed:id}));writeFileSync(data,'[]');return {id,paths:[output],dependencies:[],dimensions:{input:{path:input,access:'read'},interface:{id:output+'#value',access:'write'},data:{path:data,access:'write'},port:{notApplicable:'local Node import fixture; no service or listener'}}};};
 return {n:1,kind:'parallel',a:phase('P1',path),b:phase('P2',other),serial:false};
}
describe('ORACLE-DISPATCH-QUALITY controlled local trace',()=>{
 it('accepts seven-step notification/reports with independent axes',()=>expect(replay(trace())).toEqual([]));
 it.each(['review','test'])('rejects %s started before explicit developer completion',role=>{const t=trace();t.unshift({n:0,kind:'start',phase:'P2',role});t.forEach((e,i)=>e.n=i+1);rejected(t,/before developer completion/);});
 it('rejects one executor producing both axis summaries',()=>{const t=trace();t.find(e=>e.axis==='Spec').session='standards-2';rejected(t,/independent sessions/);});
 it.each(['Standards','Spec','both'])('rejects missing required independent axis %s',axis=>{
  const events=trace().filter(e=>e.kind!=='axis'||(axis!=='both'&&e.axis!==axis));
  rejected(events,/required independent axis/);
 });
 it.each(['Standards','Spec'])('rejects developer self-review in %s axis',axis=>{
  const events=trace().map(e=>e.kind==='axis'&&e.axis===axis?{...e,session:'dev-2'}:e);
  rejected(events,/developer cannot execute/);
 });
 it('rejects a second developer session writing the Phase',()=>{
  rejected(trace([{kind:'write',phase:'P2',role:'dev',session:'other-developer'}]),/unique writer/);
  expect(replay(trace([{kind:'write',phase:'P2',role:'dev',session:'dev-2'}]))).toEqual([]);
 });
 it.each(['Standards','Spec'])('rejects early supplement axis %s before dev-done',axis=>{
  const events=trace();const index=events.findIndex(e=>e.kind==='axis'&&e.axis===axis);
  events.unshift(...events.splice(index,1));events.forEach((e,i)=>e.n=i+1);
  rejected(events,/supplement axis starts before developer completion/);
 });
 it('rejects repair reports without an independent post-repair test result',()=>{
  rejected(trace([{kind:'finding',phase:'P2',id:'F-no-result'},
   {kind:'repair',phase:'P2',id:'F-no-result',targetPhase:'P2',session:'dev-2'},
   {kind:'report',phase:'P2',role:'review'},{kind:'report',phase:'P2',role:'test'}]),/post-repair independent test result/);
 });
 it.each(['input','interface','data','port'])('rejects different files sharing mutable %s',dimension=>{
  const event=independentParallelFixture();
  if(dimension==='port')event.a.dimensions.port={id:'synthetic-fixture-port-31001',access:'write'};
  event.a.dimensions[dimension].access='write';event.b.dimensions[dimension]={...event.a.dimensions[dimension]};
  rejected([event],/shared mutable resource/);
  event.b.dependencies=['P1'];event.serial=true;expect(replay([event])).toEqual([]);
 });
 it('rejects a dimension without facts or a named N/A reason',()=>{
  const event=independentParallelFixture();delete event.b.dimensions.port;
  rejected([event],/parallel dimension port/);
 });
 it('rejects timestamp-only ping-pong despite nonempty changed and checks',()=>{
  const before={input:'fixture-hash-1',failure:'value mismatch',method:'node literal-7',at:1};
  rejected(trace([{kind:'repeat',phase:'P2',changed:'timestamp refreshed',checks:{rootCause:'same check',complexity:'same assertion',alternative:'same method'},before,after:{...before,at:2}}]),/no substantive input\/failure\/method change/);
 });
 it('accepts independent write sets and serializes shared aliases',()=>{
  const {base,path}=fixture();const other=join(base,'work','other.mjs');writeFileSync(other,'export const value=9;\n');
  const event=independentParallelFixture();event.a.paths=[path];event.b.paths=[other];
  expect(replay([event])).toEqual([]);event.b.paths=[join(base,'work','..','work','same.mjs')];rejected([event],/shared path/);
  event.b.dependencies=['P1'];rejected([event],/serial execution/);event.serial=true;expect(replay([event])).toEqual([]);
 });
 it.each([false,true])('keeps ordinary/late finding open until same-writer repair (late=%s)',async late=>{
  rejected(trace([{kind:'finding',phase:'P2',id:'F1',late}]),/open finding/);
  const repair=[{kind:'finding',phase:'P2',id:'F1',late},{kind:'repair',phase:'P2',id:'F1',session:'dev-2',targetPhase:'P2'},await capturedIndependentResult(),
   {kind:'report',phase:'P2',role:'review'},{kind:'report',phase:'P2',role:'test'}];
  expect(replay(trace(repair))).toEqual([]);
  for(const patch of [{session:'other-dev'},{targetPhase:'P4'}])rejected(trace(repair.map(e=>e.kind==='repair'?{...e,...patch}:e)),/same Phase\/developer/);
  rejected(trace(repair.filter(e=>e.role!=='test')),/reports required/);
 });
 it('rejects unchanged ping-pong but accepts a concrete three-check alternative',()=>{
  rejected(trace([{kind:'repeat',phase:'P2',changed:'',checks:{}}]),/no new facts/);
  expect(replay(trace([{kind:'repeat',phase:'P2',changed:'replace stale fixture with exact source case',checks:{rootCause:'fixture mismatch',complexity:'retain one target assertion',alternative:'source fixture'},before:{input:'fixture-old',failure:'value mismatch',method:'node literal-7'},after:{input:'fixture-current',failure:'value mismatch',method:'node literal-7'}}]))).toEqual([]);
  rejected(trace([{kind:'time-stop',phase:'P2'}]),/elapsed time/);
 });
 it('consumes eight-section brief rather than accepting missing stop condition',()=>{
  const body=Object.fromEntries(labels.map(x=>[x,`${x}: fixture scope; evidence/ref.md`]));
  expect(replay([{n:1,kind:'brief',body}])).toEqual([]);
  delete body['何时停'];rejected([{n:1,kind:'brief',body}],/brief 何时停/);
 });
 it('rejects overlong return and raw log; explicit unavailable reason is valid',()=>{
  const body=Object.fromEntries(returns.map(x=>[x,'未取得：本地fixture无provider；由P4核实']));
  const event={n:1,kind:'return',body,text:'六项摘要；quality/evidence/original.md',rawLog:false};
  expect(replay([event])).toEqual([]);rejected([{...event,text:'字'.repeat(2001)}],/return 2000/);
  rejected([{...event,rawLog:true}],/raw log/);
  const short={...body};delete short['失败与限制'];rejected([{...event,body:short}],/return 失败与限制/);
 });
 it.each([{status:'unavailable',parse:null},{status:'failed',parse:null},{status:'completed',parse:'invalid'},{status:'completed',parse:'empty_output'}])('retains failed provider result %j',bad=>{
  rejected([{n:1,kind:'provider',results:[bad],claim:'pass'}],/not empty findings pass/);
  expect(replay([{n:1,kind:'provider',results:[bad,{status:'completed',parse:'ok',findings:[]}],claim:'partial'}])).toEqual([]);
 });
 it('accepts completed parsed empty findings only as observed result',()=>expect(replay([{n:1,kind:'provider',results:[{status:'completed',parse:'ok',findings:[]}],claim:'observed-empty'}])).toEqual([]));
 it('rejects readonly writer and borrowed or stale independent test receipt',()=>{
  rejected(trace([{kind:'write',phase:'P2',role:'review'}]),/readonly role/);
  rejected(trace([{kind:'test-result',phase:'P2',session:'dev-2',receiptRef:'same',devReceiptRef:'same',receiptAt:1,exit:0}]),/independent test receipt/);
 });
 it('executes actual fixture assertion and independent capture after repair',async()=>{
  const {base,path}=fixture(),id='controlled-dispatch',taskRoot=join(base,'Projects','workflowhub','tasks',id);mkdirSync(taskRoot,{recursive:true});
  writeFileSync(join(taskRoot,'task.json'),JSON.stringify({schema_version:'1.0.0',record_model:'vnext-single-write',activation_cohort:'post',project_name:'workflowhub',task_id:id,target_repo_root:base}));writeFileSync(join(taskRoot,'facts.jsonl'),'');
  const task=openTask(taskRoot,{projectName:'workflowhub',taskId:id});const argv=[process.execPath,'--input-type=module','-e',`import {value} from ${JSON.stringify('file://'+path)};if(value!==7)throw Error('expected independent literal 7');`];
  const receipt=await task.captureCommand({cwd:base,slug:'independent-fixture',argv});expect(receipt.exit_code).toBe(0);
  const events=trace([{kind:'finding',phase:'P2',id:'F2'},{kind:'repair',phase:'P2',id:'F2',targetPhase:'P2',session:'dev-2'},
   {kind:'test-result',phase:'P2',session:'test-2',receiptRef:receipt.receipt_ref,devReceiptRef:'developer-original',receiptAt:12,exit:receipt.exit_code},
   {kind:'report',phase:'P2',role:'review'},{kind:'report',phase:'P2',role:'test'}]);
  expect(replay(events)).toEqual([]);const old=events.map(e=>e.kind==='test-result'?{...e,receiptAt:1}:e);rejected(old,/old receipt/);
 });
});
