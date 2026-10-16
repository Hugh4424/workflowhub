// Frozen build-plan target tests. DO NOT TOUCH after recorded target RED; changes require an explicit reviewed request.
// Real-event fixture provenance and redaction are documented in the paired contract test.
// All mutations, temporary task manifests, review reports, parent/child identities and environment trees below are constructed seam fixtures.
// No provider runs. No user session is modified. Four-stage instruction replay and second real-source acceptance require independent P2 reader execution; these tests do not claim them.
// Only Node built-ins are statically imported so missing production code fails a named target assertion, never test collection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, realpathSync, readdirSync, chmodSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),entry=join(repo,'tools/cli/measure-main-agent-cost.mjs');
const fixturePath=join(repo,'tests/fixtures/main-agent-cost');
const HEADER='| 记录时间(UTC) | 阶段 | from(UTC) | until(UTC) | 起点来源 | 窗口状态 | 任务墙钟(ms) | 会话跨度和(ms) | 轮次内并集(ms) | 等待(ms) | 输入(token) | 输出(token) | 缓存读(token) | 缓存写(token) | 推理(token) | DSH步骤(次) | Codex响应项(次) | 轮次(次) | 工具调用(次) | 子代理调用(次) | 命令调用(次) | 宿主实际注入(byte) | 审查provider上报(原口径) | 当前材料(byte) | 来源refs | 会话明细与累计点 | 缺报与错误 |';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function target(){assert.ok(existsSync(entry),'TARGET_ENTRY: tools/cli/measure-main-agent-cost.mjs must exist for automatic record');}
function load(name='dsh-v4'){return readFileSync(join(fixturePath,name+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse);}
function put(path,records){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,records.map(JSON.stringify).join('\n')+'\n');return path;}
function git(cwd,args){const r=spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,'temporary Git fixture setup: '+r.stderr);return r.stdout.trim();}
function setup(t){
 target();const root=realpathSync(mkdtempSync(join(tmpdir(),'wh-cost-closeout-')));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const main=join(root,'target'),workspace=join(root,'task-workspace'),storage=join(root,'storage'),taskPath=join(storage,'Projects/cost-project/tasks/cost-task');
 mkdirSync(main);git(main,['init','-q','-b','main']);git(main,['config','user.email','fixture@test.invalid']);git(main,['config','user.name','Cost fixture']);git(main,['commit','--allow-empty','-qm','fixture']);git(main,['worktree','add','-qb','task/cost-project/cost-task',workspace]);
 mkdirSync(taskPath,{recursive:true});const manifest={schema_version:'1.0.0',project_name:'cost-project',task_id:'cost-task',created_at:'2026-10-15T23:59:00.000Z',target_repo_root:main,activation_cohort:'post',execution_mode:'per_invocation',record_model:'vnext-single-write',workspace_mode:'existing',workspace_root:workspace,issue_ids:[],inputs:{}};
 writeFileSync(join(taskPath,'task.json'),JSON.stringify(manifest)+'\n');writeFileSync(join(taskPath,'facts.jsonl'),'');
 const materials=join(workspace,'specs/cost-task');mkdirSync(join(materials,'phases'),{recursive:true});
 const materialText={'decision-log.md':'decision\n','spec.md':'spec\n','phases/index.md':'## Execution Index\n| Phase | Authority ref |\n| --- | --- |\n| '+String.fromCharCode(96)+'P1'+String.fromCharCode(96)+' | '+String.fromCharCode(96)+'phases/P1.md'+String.fromCharCode(96)+' |\n','phases/P1.md':'phase\n'};
 for(const [name,text]of Object.entries(materialText))writeFileSync(join(materials,name),text);
 // Poison main checkout materials: using manifest.target_repo_root instead of authenticated task checkout is observable.
 mkdirSync(join(main,'specs/cost-task'),{recursive:true});writeFileSync(join(main,'specs/cost-task/decision-log.md'),'MAIN_MUST_NOT_BE_READ\n');
 const records=load();records[0].cwd=workspace;const session=put(join(root,'explicit/session.v4.jsonl'),records);
 const env={...process.env,HOME:join(root,'home'),XDG_CONFIG_HOME:join(root,'config'),WORKFLOWHUB_TASK_DIR:storage,DSH_HOME:join(root,'dsh'),DSH_SESSION_ID:'',CODEX_HOME:join(root,'codex'),CODEX_THREAD_ID:'',CODEX_SESSION_ID:''};
 mkdirSync(env.HOME);mkdirSync(env.XDG_CONFIG_HOME);
 return {root,main,workspace,storage,taskPath,materials,materialText,manifest,records,session,env,ledger:join(taskPath,'main-agent-cost.md')};
}
function args(f,stage='build-plan',extra=[]){return ['--project=cost-project','--task=cost-task','--stage='+stage,'--record','--session='+f.session,...extra];}
function run(f,argv,env=f.env){target();return spawnSync(process.execPath,[entry,...argv],{cwd:f.workspace,env,encoding:'utf8',timeout:15000});}
function runWithRenameFault(f,mode){
 target();const preload=join(f.root,'rename-fault-'+mode+'.cjs');
 writeFileSync(preload,[
  "const fs=require('node:fs');",
  'const original=fs.renameSync;',
  'const fail=()=>{const error=new Error("constructed rename fault");error.code="EIO";return error;};',
  'fs.renameSync=function(from,to,...args){',
  ' const mode=process.env.WH_COST_RENAME_FAULT;',
  ' if(mode==="before")throw fail();',
  ' const result=original.call(this,from,to,...args);',
  ' if(mode==="after")throw fail();',
  ' if(mode==="replace-after"){fs.writeFileSync(to,"unexpected replacement\\n");throw fail();}',
  ' return result;',
  '};',
  "require('node:module').syncBuiltinESMExports();",
 ].join('\n'));
 return spawnSync(process.execPath,['--require='+preload,entry,...args(f,'build-code',['--start-ref='+f.session+'#seq=9'])],{cwd:f.workspace,env:{...f.env,WH_COST_RENAME_FAULT:mode},encoding:'utf8',timeout:15000});
}
function record(f,stage='build-plan',extra=[]){return run(f,args(f,stage,extra));}
function first(f,stage='build-plan'){return record(f,stage,['--start-ref='+f.session+'#seq=9']);}
const unescapeCell=cell=>cell.replace(/&(amp|#92|#124|#13|#10|lt|gt);/g,(_,entity)=>({amp:'&','#92':'\\','#124':'|','#13':'\r','#10':'\n',lt:'<',gt:'>'}[entity]));
function readLedger(f){const raw=readFileSync(f.ledger,'utf8'),lines=raw.trimEnd().split('\n');assert.equal(lines[0],HEADER,'fixed ledger header');assert.equal(lines[1].split('|').slice(1,-1).length,27);const rows=lines.slice(2).map(line=>{assert.ok(line.startsWith('|')&&line.endsWith('|'),'complete row');const cells=line.split('|').slice(1,-1).map(x=>unescapeCell(x.trim()));assert.equal(cells.length,27,'fixed 27-column row');return cells;});return{raw,rows};}
function ok(r){assert.equal(r.status,0,r.stderr+'\n'+r.stdout);}
function numeric(cell,value){assert.match(cell,/^(0|[1-9][0-9]*)$/);assert.equal(Number(cell),value);}
function dshPath(f,id='fixture-dsh-v4-1',cwd=f.workspace){const key='--'+cwd.replace(/[\\/:]+/g,'-').replace(/^-+/,'')+'--';return join(f.env.DSH_HOME,'sessions',key,id,'session.v4.jsonl');}
function spawnRecord(f,argv=args(f)){target();const child=spawn(process.execPath,[entry,...argv],{cwd:f.workspace,env:f.env,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);const done=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('target CLI did not finish within 15s'));},15000);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('close',(status,signal)=>{clearTimeout(timer);resolve({status,signal,stdout,stderr});});});return{child,done};}

// Numeric expectations are independent hand constants from retained fixture fields, not production-derived totals.
test('LEDGER first explicit record uses selected real user event; fixed columns and all source gaps visible',t=>{
 const f=setup(t),before=hash(readFileSync(f.session)),r=first(f);ok(r);const {rows}=readLedger(f);assert.equal(rows.length,1);const row=rows[0];assert.equal(row[1],'build-plan');assert.equal(row[2],'2026-10-15T02:30:30.809Z');assert.equal(row[4],f.session+'#seq=9');numeric(row[10],8923);numeric(row[11],210);numeric(row[12],16384);numeric(row[15],1);assert.match(row[21],/^not_reported:no_authoritative_host_injection_source$/);assert.match(row[22],/^not_reported:/);assert.ok(JSON.parse(row[24]).includes(f.session));assert.equal(JSON.parse(row[25])[0].sessionId,'fixture-dsh-v4-1');assert.equal(hash(readFileSync(f.session)),before);
 assert.equal(existsSync(join(f.workspace,'main-agent-cost.md')),false);assert.equal(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8'),'');assert.equal(existsSync(join(f.taskPath,'index.json')),false);
});
test('LEDGER first record without start-ref appends unknown window then later valid incremental window',t=>{
 const f=setup(t),r=record(f);assert.equal(r.status,1,r.stderr);let ledger=readLedger(f);assert.equal(ledger.rows.length,1);const old=ledger.raw,until=ledger.rows[0][3];assert.match(ledger.rows[0][6],/^unavailable:/);assert.ok(Number.isFinite(Date.parse(until)));const next=record(f);ok(next);ledger=readLedger(f);assert.ok(ledger.raw.startsWith(old));assert.equal(ledger.rows.length,2);assert.equal(ledger.rows[1][2],until);numeric(ledger.rows[1][10],0);assert.match(ledger.rows[0][6],/^unavailable:/,'unknown historic window stays unknown');
});
test('LEDGER same-stage rework appends every attempt, keeps old bytes and refuses start-ref reset',t=>{
 const f=setup(t);ok(first(f));const before=readLedger(f);ok(record(f));const after=readLedger(f);assert.equal(after.rows.length,2);assert.ok(after.raw.startsWith(before.raw));assert.equal(after.rows[1][1],'build-plan');assert.equal(after.rows[1][2],before.rows[0][3]);numeric(after.rows[1][10],0);
 const refused=record(f,'build-plan',['--start-ref='+f.session+'#seq=9']);assert.equal(refused.status,2);assert.equal(readFileSync(f.ledger,'utf8'),after.raw);
});
test('LEDGER missing required source still records real cutoff and gap, never claims added success',t=>{
 const f=setup(t);ok(first(f));const old=readLedger(f);rmSync(f.session);const r=record(f);assert.equal(r.status,1);const next=readLedger(f);assert.equal(next.rows.length,2);assert.ok(next.raw.startsWith(old.raw));assert.ok(Number.isFinite(Date.parse(next.rows[1][3])));assert.match(next.rows[1][10],/^unavailable:/);assert.match(next.rows[1][26],/source|ENOENT|read|missing/i);
});
test('LEDGER malformed header/truncated row/column mismatch refused without any old-byte repair',t=>{
 const f=setup(t);ok(first(f));const valid=readFileSync(f.ledger,'utf8');for(const bad of [valid.replace('记录时间(UTC)','wrong'),valid.slice(0,-2),valid.replace('| build-plan |','| build-plan | extra |')]){writeFileSync(f.ledger,bad);const r=record(f);assert.equal(r.status,1);assert.equal(readFileSync(f.ledger,'utf8'),bad);assert.match(r.stdout+r.stderr,/ledger_format_invalid/);assert.match(r.stderr,/本阶段无记录/);}
});
test('LEDGER symlink write target refuses publication, preserves external file and handoff-visible gap',t=>{
 const f=setup(t),outside=join(f.root,'outside.md');writeFileSync(outside,'keep\n');symlinkSync(outside,f.ledger);const r=first(f);assert.equal(r.status,1);assert.equal(readFileSync(outside,'utf8'),'keep\n');assert.match(r.stderr,/本阶段无记录/);assert.doesNotMatch(r.stdout,/已新增|added record|recorded successfully/i);
});
test('LEDGER failed atomic rename classifies prior, published and uncertain readbacks',t=>{
 const before=setup(t),beforeFailure=runWithRenameFault(before,'before');assert.equal(beforeFailure.status,1);assert.match(beforeFailure.stderr,/本阶段无记录: publication_not_published/);assert.equal(existsSync(before.ledger),false);
 const after=setup(t),afterFailure=runWithRenameFault(after,'after');assert.equal(afterFailure.status,1);assert.match(afterFailure.stdout,/已发布一条任务账本记录/);assert.match(afterFailure.stderr,/发布已由读回确认/);assert.doesNotMatch(afterFailure.stderr,/本阶段无记录/);assert.equal(readLedger(after).rows.length,1);
 const changed=setup(t),uncertain=runWithRenameFault(changed,'replace-after');assert.equal(uncertain.status,1);assert.match(uncertain.stderr,/发布状态不确定: publication_uncertain/);assert.doesNotMatch(uncertain.stderr,/本阶段无记录/);assert.equal(readFileSync(changed.ledger,'utf8'),'unexpected replacement\n');
});
test('LEDGER concurrent writers serialize cutoff and append; previous bytes never lost',async t=>{
 const f=setup(t);ok(first(f));const old=readLedger(f),a=spawnRecord(f),b=spawnRecord(f);const results=await Promise.all([a.done,b.done]);for(const r of results)ok(r);const next=readLedger(f);assert.equal(next.rows.length,3);assert.ok(next.raw.startsWith(old.raw));assert.equal(next.rows[1][2],next.rows[0][3]);assert.equal(next.rows[2][2],next.rows[1][3]);assert.ok(Date.parse(next.rows[2][3])>=Date.parse(next.rows[1][3]));assert.equal(existsSync(join(f.taskPath,'.main-agent-cost.lock')),false);
});
test('LEDGER cancel while another owner holds lock leaves old ledger and other lock intact',async t=>{
 const f=setup(t);ok(first(f));const before=readFileSync(f.ledger,'utf8');
 // Invoke the existing lock owner in its own process, not a forged lock protocol.
 const owner=spawn(process.execPath,['--input-type=module','-e','import {withLock} from '+JSON.stringify(new URL('../../runtime/interface/record-lock.mjs',import.meta.url).href)+'; await withLock('+JSON.stringify(f.taskPath)+',"main-agent-cost",async()=>{process.stdout.write("LOCKED\\n");await new Promise(r=>setTimeout(r,10000));});'],{stdio:['ignore','pipe','pipe']});
 t.after(()=>owner.kill('SIGTERM'));await new Promise((resolve,reject)=>{owner.stdout.once('data',resolve);owner.once('error',reject);owner.once('exit',code=>reject(new Error('lock owner exited '+code)));});
 const {child,done}=spawnRecord(f);await new Promise(resolve=>setTimeout(resolve,150));child.kill('SIGTERM');const result=await done;assert.equal(result.status,1,'cancellation handled as required runtime failure, not unhandled signal');assert.equal(readFileSync(f.ledger,'utf8'),before);assert.equal(existsSync(join(f.taskPath,'.main-agent-cost.lock')),true);assert.ok(!readFileSync(f.ledger,'utf8').endsWith('| '));owner.kill('SIGTERM');await new Promise(resolve=>owner.once('exit',resolve));
});
test('LEDGER special-character source refs round-trip through fixed entity escaping',t=>{
 const f=setup(t),path=join(f.root,'pipes|back\\slash&<x>\n/session.v4.jsonl');put(path,f.records);f.session=path;ok(first(f));const {raw,rows}=readLedger(f);assert.ok(raw.includes('&#124;'));assert.ok(raw.includes('&#92;'));assert.ok(raw.includes('&amp;'));assert.ok(raw.includes('&lt;'));assert.ok(raw.includes('&#10;'));assert.ok(JSON.parse(rows[0][24]).includes(path));
});
test('AUTO DSH parameterized home/cwd discovers only exact session, highest generation once',t=>{
 const f=setup(t),path=dshPath(f);put(path,f.records);put(join(dirname(path),'session.v3.jsonl'),[{...f.records[0],version:3},...f.records.slice(1)]);const env={...f.env,DSH_SESSION_ID:'fixture-dsh-v4-1'};const r=run(f,['--project=cost-project','--task=cost-task','--stage=build-plan','--record','--start-ref='+path+'#seq=9'],env);ok(r);const row=readLedger(f).rows[0];numeric(row[10],8923);assert.deepEqual(JSON.parse(row[24]),[path]);
});
test('AUTO DSH unknown higher generation and missing ID never silently fallback or scan other history',t=>{
 const f=setup(t),path=dshPath(f);put(path,f.records);put(join(dirname(path),'session.v99.jsonl'),[{...f.records[0],version:99},...f.records.slice(1)]);const env={...f.env,DSH_SESSION_ID:'fixture-dsh-v4-1'};assert.equal(run(f,['--project=cost-project','--task=cost-task'],env).status,1);
 const unrelated=put(dshPath(f,'other-session'),f.records),before=hash(readFileSync(unrelated));assert.equal(run(f,['--project=cost-project','--task=cost-task'],{...env,DSH_SESSION_ID:'absent-session'}).status,1);assert.equal(hash(readFileSync(unrelated)),before);
});
test('AUTO DSH explicit catalog discovers owned child; missing and foreign parent remain visible',t=>{
 const f=setup(t),parent=f.records;parent.push({type:'subagent/catalog',seq:170,time:1792031682909,data:{childId:'constructed-child',childCreatedAt:1792030881272}});put(f.session,parent);const child=load();child[0].id='constructed-child';child[0].parentSession=parent[0].id;child[0].cwd=f.workspace;put(dshPath(f,'constructed-child'),child);ok(first(f));const sessions=JSON.parse(readLedger(f).rows[0][25]);assert.equal(sessions.length,2);assert.ok(sessions.some(x=>x.sessionId==='constructed-child'));numeric(readLedger(f).rows[0][10],17846);
 // A separate record attempt cannot silently accept a child claiming a different parent.
 child[0].parentSession='foreign-parent';put(dshPath(f,'constructed-child'),child);assert.equal(record(f).status,1);assert.match(readLedger(f).rows.at(-1)[26],/parent|child|归属/i);
});
test('AUTO current DSH and Codex EACCES remain source read issues instead of header identity errors',t=>{
 const dsh=setup(t),dshRecords=load();dshRecords[0].cwd=dsh.workspace;const dshId=dshRecords[0].id,dshSource=put(dshPath(dsh,dshId),dshRecords);let dshResult;
 chmodSync(dshSource,0);try{dshResult=run(dsh,['--project=cost-project','--task=cost-task','--stage=build-plan','--record'],{...dsh.env,DSH_SESSION_ID:dshId});}finally{chmodSync(dshSource,0o600);}
 assert.equal(dshResult.status,1);assert.doesNotMatch(dshResult.stdout+dshResult.stderr,/current DSH header identity mismatch/);assert.match(readLedger(dsh).rows[0][26],/EACCES|permission denied/i);
 const codex=setup(t),id='01a0feda-b95f-7163-a9c1-0ea058d0fa95',codexRecords=load('codex');codexRecords[0].payload.id=id;const codexSource=put(join(codex.env.CODEX_HOME,'sessions/2026/10/03/rollout-2026-10-03T07-02-22-'+id+'.jsonl'),codexRecords);let codexResult;
 chmodSync(codexSource,0);try{codexResult=run(codex,['--project=cost-project','--task=cost-task','--stage=build-plan','--record'],{...codex.env,CODEX_THREAD_ID:id});}finally{chmodSync(codexSource,0o600);}
 assert.equal(codexResult.status,1);assert.doesNotMatch(codexResult.stdout+codexResult.stderr,/current Codex header\/thread identity mismatch/);assert.match(readLedger(codex).rows[0][26],/EACCES|permission denied/i);
});
test('AUTO DSH and Codex reject a wrong current header even when a later line is malformed',t=>{
 const dsh=setup(t),dshId=dsh.records[0].id,dshHeader={...dsh.records[0],cwd:dsh.workspace,id:'wrong-dsh-identity'},dshSource=dshPath(dsh,dshId);
 mkdirSync(dirname(dshSource),{recursive:true});
 writeFileSync(dshSource,JSON.stringify(dshHeader)+'\n{malformed\n');
 const dshResult=run(dsh,[],{...dsh.env,DSH_SESSION_ID:dshId});assert.equal(dshResult.status,1);assert.match(dshResult.stderr,/current DSH header identity mismatch/);assert.doesNotMatch(dshResult.stdout,/8923/);
 const codex=setup(t),id='01a0feda-b95f-7163-a9c1-0ea058d0fa95',codexRecords=load('codex'),codexHeader=structuredClone(codexRecords[0]);codexHeader.payload.id='wrong-codex-identity';const codexSource=join(codex.env.CODEX_HOME,'sessions/2026/10/03/rollout-2026-10-03T07-02-22-'+id+'.jsonl');
 mkdirSync(dirname(codexSource),{recursive:true});
 writeFileSync(codexSource,JSON.stringify(codexHeader)+'\n{malformed\n');
 const codexResult=run(codex,[],{...codex.env,CODEX_THREAD_ID:id});assert.equal(codexResult.status,1);assert.match(codexResult.stderr,/current Codex header\/thread identity mismatch/);assert.doesNotMatch(codexResult.stdout,/186557/);
});
test('AUTO Codex thread identity beats root session and current subagent cannot record stage',t=>{
 const f=setup(t),id='01a0feda-b95f-7163-a9c1-0ea058d0fa95',parent='01a0feda-b95f-7163-a9c1-0ea058d0fa94',records=load('codex');records[0].payload.id=id;records[0].payload.session_id=parent;records[0].payload.parent_thread_id=parent;for(const r of records)if(r.type==='token_usage_record'){r.payload.thread_id=id;r.payload.session_id=parent;}
 const path=put(join(f.env.CODEX_HOME,'sessions/2026/10/03/rollout-2026-10-03T07-02-22-'+id+'.jsonl'),records),env={...f.env,CODEX_THREAD_ID:id,CODEX_SESSION_ID:parent};
 const read=run(f,['--project=cost-project','--task=cost-task','--from=2026-10-02T23:03:07.088Z','--until=2026-10-02T23:04:01.933Z'],env);ok(read);assert.match(read.stdout,/186557/);const r=run(f,['--project=cost-project','--task=cost-task','--stage=build-code','--record'],env);assert.equal(r.status,1);assert.match(r.stdout+r.stderr,/stage_caller_is_subagent/);assert.ok(!existsSync(f.ledger)||readLedger(f).rows.length===1);assert.ok(existsSync(path));
});
test('AUTO Codex root session fallback cannot select parent or a non-v7 unknown thread',t=>{
 const f=setup(t);for(const env of [{...f.env,CODEX_SESSION_ID:'not-a-v7-id'},{...f.env,CODEX_THREAD_ID:'not-a-v7-id',CODEX_SESSION_ID:'parent-root'}]){const r=run(f,['--project=cost-project','--task=cost-task'],env);assert.equal(r.status,1);assert.match(r.stdout+r.stderr,/unavailable|incomplete|thread|定位/i);}
});
test('START DSH selector must uniquely identify a user event; invalid selectors exit2',t=>{
 const f=setup(t);for(const suffix of ['#seq=-1','#seq=NaN','#seq=9007199254740992','#item_id=%2Fbad']){const r=record(f,'build-plan',['--start-ref='+f.session+suffix]);assert.equal(r.status,2,suffix+' '+r.stderr);}
 for(const selector of ['#seq=17','#seq=999']){const r=record(f,'build-plan',['--start-ref='+f.session+selector]);assert.equal(r.status,1);assert.match(readLedger(f).rows.at(-1)[6],/^unavailable:/);rmSync(f.ledger);}
});
test('SOURCE material bytes use authenticated checkout/index only, never main or post plan/tasks',t=>{
 const f=setup(t);writeFileSync(join(f.materials,'plan.md'),'POISON'.repeat(100));writeFileSync(join(f.materials,'tasks.md'),'POISON'.repeat(100));ok(first(f));const expected=Object.values(f.materialText).reduce((sum,text)=>sum+Buffer.byteLength(text),0);numeric(readLedger(f).rows[0][23],expected);
 rmSync(join(f.materials,'phases/P1.md'));assert.equal(record(f).status,1);assert.match(readLedger(f).rows.at(-1)[23],/^unavailable:/);
});
test('SOURCE make-decision counts only decision-log; missing later material is not zero',t=>{
 const f=setup(t);rmSync(join(f.materials,'spec.md'));ok(first(f,'make-decision'));numeric(readLedger(f).rows[0][23],9);const r=record(f,'build-plan');assert.equal(r.status,1);assert.match(readLedger(f).rows.at(-1)[23],/^unavailable:/);
});
test('SOURCE current stage provider raw usage retained; historical report not re-counted and bad reported usage exposed',t=>{
 const f=setup(t),ref='quality/reviews/current.json',report={completed_at:new Date().toISOString(),review_facts:{providers:[{provider:'fixture-provider',status:'completed',usage:{prompt_tokens:19,unusual_count:7},usage_status:'reported'}],usage_coverage:{reported:1,total:1}}};mkdirSync(dirname(join(f.taskPath,ref)),{recursive:true});writeFileSync(join(f.taskPath,ref),JSON.stringify(report));writeFileSync(join(f.taskPath,'facts.jsonl'),JSON.stringify({record_kind:'stage',task_id:'cost-task',stage:'build-plan',review_result_ref:{value:ref}})+'\n');ok(first(f));let value=JSON.parse(readLedger(f).rows[0][22]);assert.ok(JSON.stringify(value).includes('fixture-provider'));assert.ok(JSON.stringify(value).includes('prompt_tokens'));assert.ok(JSON.stringify(value).includes('19'));assert.ok(JSON.stringify(value).includes(ref));
 ok(record(f));assert.equal(readLedger(f).rows[1][22],'not_reported:no_new_report_in_window');report.completed_at=new Date().toISOString();report.review_facts.providers[0].usage=[];writeFileSync(join(f.taskPath,ref),JSON.stringify(report));assert.equal(record(f).status,1);assert.match(readLedger(f).rows.at(-1)[22],/^unavailable:/);
});
test('SOURCE review ref escaping task root and pre/history write attempt fail without external change',t=>{
 const f=setup(t),outside=join(f.root,'review.json');writeFileSync(outside,'KEEP');writeFileSync(join(f.taskPath,'facts.jsonl'),JSON.stringify({record_kind:'stage',task_id:'cost-task',stage:'build-plan',review_result_ref:{value:'../../../../review.json'}})+'\n');assert.equal(first(f).status,1);assert.equal(readFileSync(outside,'utf8'),'KEEP');
 writeFileSync(join(f.taskPath,'task.json'),JSON.stringify({...f.manifest,activation_cohort:'pre'}));const before=existsSync(f.ledger)?readFileSync(f.ledger,'utf8'):null;assert.notEqual(record(f).status,0);assert.equal(existsSync(f.ledger)?readFileSync(f.ledger,'utf8'):null,before);
});
test('BOUNDARY existing four workflow final-step IDs and completion evidence remain unchanged',()=>{
 for(const [stage,count,lastSlug]of [['make-decision',15,'stage-handoff'],['build-plan',12,'confirm-plan-and-handoff'],['build-code',12,'stage-handoff'],['verify-code',8,'stage-handoff']]){const manifest=JSON.parse(readFileSync(join(repo,'workflows',stage,'steps.json'),'utf8'));assert.equal(manifest.steps.length,count);assert.deepEqual(manifest.steps.map(x=>x.step_id),Array.from({length:count},(_,i)=>i+1));assert.equal(manifest.steps.at(-1).step_slug,lastSlug);assert.deepEqual(manifest.steps.at(-1).completion_evidence,[{kind:'phase_task_facts',uri_or_path:'facts.jsonl'}]);}
 // This structural preservation test is deliberately not evidence that a natural-language workflow actually invoked record.
});

function codexMain(f,id='01a0feda-b95f-7163-a9c1-0ea058d0fa95'){
 // TCR-N1-P2-001: explicitly constructed COMPLETE synthetic history, not a stripped real paginated sample.
 // Header/user start are simultaneous; all events are enumerated here, ordinal0..14, with no inherited/compacted prefix or pre-start consumption.
 const records=[
  {timestamp:'2026-10-02T23:02:22.379Z',ordinal:0,type:'session_meta',payload:{id,session_id:id,cwd:f.workspace}},
  {timestamp:'2026-10-02T23:02:22.379Z',ordinal:1,type:'event_msg',payload:{type:'item_completed',item:{type:'UserMessage',id:'constructed user-start'}}},
  {timestamp:'2026-10-02T23:03:03.468Z',ordinal:2,type:'event_msg',payload:{type:'task_started',turn_id:'constructed-turn-1'}},
  {timestamp:'2026-10-02T23:03:03.471Z',ordinal:3,type:'turn_context',payload:{turn_id:'constructed-turn-1'}},
  {timestamp:'2026-10-02T23:03:07.002Z',ordinal:4,type:'response_item',payload:{type:'message',id:'constructed-response-1',role:'assistant'}},
  {timestamp:'2026-10-02T23:03:07.086Z',ordinal:5,type:'token_usage_record',payload:{thread_id:id,session_id:id,response_id:'constructed-r1',thread_token_usage:{input_tokens:84812,output_tokens:123,cached_input_tokens:8960,cache_write_input_tokens:0,reasoning_output_tokens:45}}},
  {timestamp:'2026-10-02T23:03:07.091Z',ordinal:6,type:'event_msg',payload:{type:'task_complete',turn_id:'constructed-turn-1'}},
  {timestamp:'2026-10-02T23:03:34.085Z',ordinal:7,type:'event_msg',payload:{type:'task_started',turn_id:'constructed-turn-2'}},
  {timestamp:'2026-10-02T23:03:34.087Z',ordinal:8,type:'turn_context',payload:{turn_id:'constructed-turn-2'}},
  {timestamp:'2026-10-02T23:03:38.011Z',ordinal:9,type:'token_usage_record',payload:{thread_id:id,session_id:id,response_id:'constructed-r2',thread_token_usage:{input_tokens:175599,output_tokens:273,cached_input_tokens:92672,cache_write_input_tokens:0,reasoning_output_tokens:111}}},
  {timestamp:'2026-10-02T23:03:38.016Z',ordinal:10,type:'event_msg',payload:{type:'task_complete',turn_id:'constructed-turn-2'}},
  {timestamp:'2026-10-02T23:03:58.539Z',ordinal:11,type:'event_msg',payload:{type:'task_started',turn_id:'constructed-turn-3'}},
  {timestamp:'2026-10-02T23:03:58.542Z',ordinal:12,type:'turn_context',payload:{turn_id:'constructed-turn-3'}},
  {timestamp:'2026-10-02T23:04:01.929Z',ordinal:13,type:'token_usage_record',payload:{thread_id:id,session_id:id,response_id:'constructed-r3',thread_token_usage:{input_tokens:271369,output_tokens:382,cached_input_tokens:182528,cache_write_input_tokens:0,reasoning_output_tokens:133}}},
  {timestamp:'2026-10-02T23:04:01.933Z',ordinal:14,type:'event_msg',payload:{type:'task_complete',turn_id:'constructed-turn-3'}},
 ];
 assert.deepEqual(records.map(r=>r.ordinal),Array.from({length:15},(_,i)=>i),'constructed fresh history must enumerate every position');
 assert.equal(records[0].timestamp,records[1].timestamp,'creation is inside the selected first window');
 assert.equal(records[1].payload.item.type,'UserMessage');
 for(const key of ['parent_thread_id','source','subagent_history_start_ordinal','history_mode'])assert.equal(Object.hasOwn(records[0].payload,key),false,'fresh main synthetic history has no '+key);
 assert.equal(records.some(r=>r.type==='response_item'&&r.payload.type==='compaction'),false);
 const path=join(f.env.CODEX_HOME,'sessions/2026/10/03/rollout-2026-10-03T07-02-22-'+id+'.jsonl');put(path,records);return{id,path,records,env:{...f.env,CODEX_THREAD_ID:id,CODEX_SESSION_ID:id}};
}
test('START AUTO Codex main thread resolves item_id user start and reports cumulative absolute only with proven fresh prefix',t=>{
 const f=setup(t),c=codexMain(f);const r=run(f,['--project=cost-project','--task=cost-task','--stage=build-code','--record','--start-ref='+c.path+'#item_id=constructed%20user-start'],c.env);ok(r);const row=readLedger(f).rows[0];assert.equal(row[2],'2026-10-02T23:02:22.379Z');numeric(row[10],271369);numeric(row[11],382);numeric(row[12],182528);assert.equal(row[18],'not_reported:unsupported_in_this_task');assert.equal(JSON.parse(row[25])[0].sessionId,c.id);
});
test('AUTO Codex child refs use actual agent_thread_id and parent header; foreign receivers excluded',t=>{
 const f=setup(t),p=codexMain(f),childId='01a0feda-b95f-7163-a9c1-0ea058d0fa96',c=codexMain(f,childId);c.records[0].payload.parent_thread_id=p.id;c.records[0].payload.source={subagent:{other:'constructed'}};
 // Explicitly constructed child boundary and reported zero point;
 // not evidence of a real historical child session.
 c.records[0].payload.subagent_history_start_ordinal=0;
 c.records[0].timestamp='2026-10-02T23:02:22.378Z';
 for(const r of c.records.slice(1))r.ordinal+=1;
 c.records.splice(1,0,{
  timestamp:'2026-10-02T23:02:22.378Z',
  ordinal:1,
  type:'token_usage_record',
  payload:{
   thread_id:childId,
   session_id:childId,
   response_id:'constructed-child-zero',
   thread_token_usage:{
    input_tokens:0,
    output_tokens:0,
    cached_input_tokens:0,
    cache_write_input_tokens:0,
    reasoning_output_tokens:0
   }
  }
 });
 put(c.path,c.records);
 p.records.push({timestamp:'2026-10-02T23:04:01.934Z',ordinal:15,type:'event_msg',payload:{type:'item_completed',item:{type:'SubAgentActivity',id:'constructed-spawn',kind:'started',agent_thread_id:childId}}});put(p.path,p.records);
 const argv=['--project=cost-project','--task=cost-task','--stage=build-code','--record','--start-ref='+p.path+'#item_id=constructed%20user-start'];ok(run(f,argv,p.env));const row=readLedger(f).rows[0];numeric(row[10],542738);assert.deepEqual(JSON.parse(row[25]).map(x=>x.sessionId).sort(),[p.id,childId].sort());
 c.records[0].payload.parent_thread_id='01a0feda-b95f-7163-a9c1-0ea058d0fa97';put(c.path,c.records);assert.equal(run(f,['--project=cost-project','--task=cost-task','--stage=build-code','--record'],p.env).status,1);assert.match(readLedger(f).rows.at(-1)[26],/parent|child|归属/i);
});
test('START Codex paginated inherited sample with valid user start never invents a zero token baseline',t=>{
 const f=setup(t),records=load('codex');
 // Deliberate negative: real minimal sample retains its parent, paginated history, inherited cut, compaction and ordinal gaps.
 // Only this selector event is constructed; the sample is NOT asserted to be a complete fresh history.
 records.splice(2,0,{timestamp:'2026-10-02T23:02:22.379Z',ordinal:2,type:'event_msg',payload:{type:'item_completed',item:{type:'UserMessage',id:'constructed inherited-start'}}});
 assert.equal(records[0].payload.history_mode,'paginated');assert.ok(records[0].payload.parent_thread_id);assert.equal(records[0].payload.subagent_history_start_ordinal,2);assert.ok(records.some(r=>r.type==='response_item'&&r.payload.type==='compaction'));assert.ok(records.some((r,i)=>i>0&&r.ordinal>records[i-1].ordinal+1));
 f.session=put(join(f.root,'paginated/rollout-fragment.jsonl'),records);const r=record(f,'build-code',['--start-ref='+f.session+'#item_id=constructed%20inherited-start']);assert.equal(r.status,1,r.stdout+'\n'+r.stderr);const row=readLedger(f).rows[0];
 assert.equal(row[2],'2026-10-02T23:02:22.379Z','known task start survives missing token baseline');
 for(const index of [10,11,12])assert.match(row[index],/^unavailable:/,'required token baseline must not become zero');
 const session=JSON.parse(row[25]).find(x=>x.sessionId==='fixture-codex-1');assert.ok(session);
 for(const metric of ['inputTokens','outputTokens','cacheReadTokens']){const point=session.cumulativePoints.find(x=>x.metric===metric);assert.ok(point,metric+' retained cumulative provenance');assert.equal(point.from,null,metric+' has no proven C(from)');}
});
test('AUTO DSH missing catalog child invalidates complete totals and lists exact missing ID',t=>{
 const f=setup(t);f.records.push({type:'subagent/catalog',seq:170,time:1792031682909,data:{childId:'constructed-missing-child',childCreatedAt:1792031682909}});put(f.session,f.records);const r=first(f);assert.equal(r.status,1);const row=readLedger(f).rows[0];assert.match(row[10],/^unavailable:/);assert.match(row[8],/^unavailable:/);assert.ok(JSON.parse(row[25])[0].missingChildren.includes('constructed-missing-child'));assert.match(row[26],/constructed-missing-child/);
});

test('LEDGER cancel after own lock acquisition aborts real decompression and leaves no half row or owned lock',async t=>{
 const f=setup(t);ok(first(f));const old=readLedger(f),plain=join(f.root,'large/session.v4.jsonl'),compressed=plain+'.zstd';mkdirSync(dirname(plain),{recursive:true});
 // Repeated real-event sample bytes provide a bounded 12MB-ish real zstd workload; no decoder stub or background service.
 const header=JSON.stringify(f.records[0])+'\n',body=f.records.slice(1).map(JSON.stringify).join('\n')+'\n';writeFileSync(plain,header+body.repeat(5000));const packed=spawnSync('zstd',['-q','-c',plain]);assert.equal(packed.status,0,'real zstd prerequisite');writeFileSync(compressed,packed.stdout);const sourceBefore=hash(readFileSync(compressed));f.session=compressed;
 const active=spawnRecord(f),lock=join(f.taskPath,'.main-agent-cost.lock');const deadline=Date.now()+3000;while(!existsSync(lock)&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,2));assert.ok(existsSync(lock),'target must acquire owned record lock before cancellation');active.child.kill('SIGTERM');const r=await active.done;assert.equal(r.status,1,'SIGTERM converted to runtime cancellation');assert.equal(existsSync(lock),false,'own lock released');const now=readLedger(f);assert.ok(now.raw.startsWith(old.raw));assert.ok(now.rows.length===old.rows.length||now.rows.length===old.rows.length+1,'zero publication or one complete publication');if(now.rows.length===old.rows.length+1)assert.match(r.stdout+r.stderr,/已发布|published/i);assert.equal(hash(readFileSync(compressed)),sourceBefore);assert.equal(readdirSync(f.taskPath).some(name=>/\.tmp(?:-|$)/.test(name)),false);
});
