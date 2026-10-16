// Frozen build-plan target tests. DO NOT TOUCH after recorded target RED; changes require an explicit reviewed request.
// EFACT-005/006: minimal real-event selections, NOT complete-session acceptance.
// dsh-v0: ~/.dsh/sessions/--Users-Hugh-Hugh-Project-workflowhub--/dd997862-5ea6-43e2-bc3b-163e0e66a00e/session.jsonl.zstd
// raw sha256 071350da7db8b94142f7c7f336fb2f5d142ff200490a78ceaa25e3aaedcb75d1; selected header + seq 4,7,8,773,774,782,14184.
// dsh-v3: ~/.dsh/sessions/--Users-Hugh-Hugh-Project-KnowledgeDigest--/015db1f5-380e-4a35-9f6e-d1bf69015769/session.v3.jsonl.zstd
// raw sha256 708f49fc5c7c00419a8ed8eae360a3447ff0530294e37099f88ba2b015c590c5; header + seq 5,7,9,16,17,19,58.
// dsh-v4: ~/.dsh/sessions/--Users-Hugh-Hugh-Project-workflowhub--/session-7088960d-5f55-4116-ae6d-318b8d9833c3/session.v4.jsonl.zstd
// raw sha256 957a6a3faa28e4f42282269ddaeffcd82619c91333e8d6d16348eca5815f86cf; header + seq 5,7,9,17,18,22,168.
// codex: ~/.codex/sessions/2026/10/03/rollout-2026-10-03T07-02-22-01a0feda-b95f-7163-a9c1-0ea058d0fa95.jsonl.zst
// raw sha256 310f3a8d1959f3a03a9894ea5707fd2a959697f8cd6dc026902ce780373f3046; selected ordinals retain all 3 cumulative points and turn boundaries.
// IDs and cwd are consistently anonymized; content/arguments/tool results/env/preset/credentials removed.
// Times, usage values and selected event ordering are unchanged (verified against originals on 2026-10-15).
// Omitted real events mean fixture counts describe the selected sample only. Synthetic mutations below are explicitly constructed negatives.
// These files use only Node built-ins, and are NOT included by the existing **/*.test.mjs Vitest default.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, realpathSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const entry = join(repo, 'tools/cli/measure-main-agent-cost.mjs');
const fixtures = join(repo, 'tests/fixtures/main-agent-cost');
const fixtureHashes = {
 'dsh-v0':'d8c32336a128e860f3ea3f95a20b0edf5ea6ec38e4828d5ee23f5f66a4dc6422',
 'dsh-v3':'b87882e968dd7d6516c132a5a05f367ca80f2f10a7d1bd70945109a1cf9efcbf',
 'dsh-v4':'cb5822bb908d38a0a3846032fa8258fd35b4bc5669140ada37e4b0a7fcae013a',
 codex:'ebec4ff8fef973099ee17c712e57c754926a36f2b5c4c4d7753db387fad63dcf',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function source(name) {
 const sourcePath = join(fixtures, name + '.jsonl'), bytes = readFileSync(sourcePath);
 assert.equal(hash(bytes), fixtureHashes[name], 'frozen real-event fixture bytes');
 return {sourcePath, records: bytes.toString('utf8').trim().split('\n').map(JSON.parse)};
}
function target() { assert.ok(existsSync(entry), 'TARGET_ENTRY: tools/cli/measure-main-agent-cost.mjs must exist'); }
async function measure() { target(); const module = await import(pathToFileURL(entry)); assert.equal(typeof module.measureSessions, 'function', 'TARGET_EXPORT: measureSessions must be a function'); return module.measureSessions; }
function available(metric, value) { assert.deepEqual(metric, {status:'available', value}); }
function missing(metric, reason) { assert.equal(metric.status, 'not_reported'); if(reason!==undefined)assert.equal(metric.reason, reason);else assert.ok(metric.reason); assert.equal(Object.hasOwn(metric,'value'), false); }
function unavailable(metric) { assert.equal(metric.status,'unavailable'); assert.equal(Object.hasOwn(metric,'value'), false); assert.ok(metric.reason); }
const iso = ms => new Date(ms).toISOString();
function window(from, until, includeFrom=false) { return {window:{from,until,includeFrom,startRef:null}}; }
function run(args, options={}) { target(); return spawnSync(process.execPath,[entry,...args],{cwd:repo,encoding:'utf8',timeout:10000,env:{...process.env,DSH_SESSION_ID:'',CODEX_THREAD_ID:'',CODEX_SESSION_ID:'',...options.env},...options}); }
function scratch(t) { const root=realpathSync(mkdtempSync(join(tmpdir(),'wh-cost-contract-')));t.after(()=>rmSync(root,{recursive:true,force:true}));return root; }
function put(root,name,records) { const path=join(root,name);writeFileSync(path,records.map(JSON.stringify).join('\n')+'\n');return path; }
function deepFreeze(value) { if(value&&typeof value==='object'){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value; }

for (const [name,input,output,cache,span,command] of [
 ['dsh-v0',6909,868,8192,210288,1],['dsh-v3',6858,74,8960,362347,0],['dsh-v4',8923,210,16384,252131,1],
]) test('READ '+name+': official usage once; exact selected-sample tokens, span and counts',async()=>{
 const f=await measure(),s=source(name),before=JSON.stringify(s),r=f([deepFreeze(s)]);
 assert.equal(r.status,'available'); assert.equal(r.sessions.length,1); assert.equal(r.sessions[0].family,'dsh');
 available(r.totals.usage.inputTokens,input);available(r.totals.usage.outputTokens,output);available(r.totals.usage.cacheReadTokens,cache);
 available(r.totals.wallMs,span);available(r.totals.sessionSpanSumMs,span);available(r.totals.activeUnionMs,span);available(r.totals.waitingMs,0);
 for(const [key,value]of Object.entries({dshSteps:1,turns:1,toolCalls:1,subagentCalls:0,commandCalls:command}))available(r.totals.counts[key],value);
 missing(r.totals.counts.codexResponseItems,'not_applicable');missing(r.totals.usage.cacheWriteTokens);
 if(name==='dsh-v0')available(r.totals.usage.reasoningTokens,538);else assert.equal(r.totals.usage.reasoningTokens.status,'not_reported');
 assert.equal(JSON.stringify(s),before,'pure function must not mutate source objects');
});

test('WINDOW duplicate session, official message, step/turn/tool events do not double count',async()=>{
 const f=await measure(),s=source('dsh-v4');s.records.push(...structuredClone(s.records.slice(1)));const r=f([s,structuredClone(s)]);
 assert.equal(r.sessions.length,1);available(r.totals.usage.inputTokens,8923);available(r.totals.counts.dshSteps,1);available(r.totals.counts.toolCalls,1);
});
test('WINDOW same message ID with conflicting usage cannot be selected or summed',async()=>{
 const f=await measure(),s=source('dsh-v4'),copy=structuredClone(s.records.find(x=>x.type==='assistant/message'));copy.data.usage.inputTokens=8924;s.records.push(copy);
 const r=f([s]);assert.equal(r.status,'incomplete');unavailable(r.totals.usage.inputTokens);assert.ok(r.issues.some(x=>x.code==='conflicting_usage'));
});
test('MISSING required field cannot be inferred from totalTokens or stream usage',async()=>{
 const f=await measure(),s=source('dsh-v4');delete s.records.find(x=>x.type==='assistant/message').data.usage.inputTokens;
 const r=f([s]);assert.equal(r.status,'incomplete');unavailable(r.totals.usage.inputTokens);available(r.totals.usage.outputTokens,210);
});
test('MISSING absent message ID cannot be replaced by content hashing',async()=>{
 const f=await measure(),s=source('dsh-v4');delete s.records.find(x=>x.type==='assistant/message').data.message.id;
 unavailable(f([s]).totals.usage.inputTokens);
});
for(const value of [-1,-0,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])test('MISSING invalid token value '+String(value)+' is unavailable, never zero',async()=>{
 const f=await measure(),s=source('dsh-v4');s.records.find(x=>x.type==='assistant/message').data.usage.inputTokens=value;unavailable(f([s]).totals.usage.inputTokens);
});
test('MISSING zero sources, unknown generation and source read issue remain incomplete',async()=>{
 const f=await measure();const empty=f([]);assert.equal(empty.status,'incomplete');unavailable(empty.totals.usage.inputTokens);
 const s=source('dsh-v4');s.records[0].version=99;assert.equal(f([s]).status,'incomplete');
 const broken=source('dsh-v4');broken.readIssue={code:'truncated_tail',sourcePath:broken.sourcePath,line:9,message:'constructed truncated tail',expected:false};const r=f([broken]);assert.equal(r.status,'incomplete');assert.ok(r.issues.some(x=>x.code==='truncated_tail'));
});
test('WINDOW DSH inherited seed prefix excluded only by explicit inherited boundary',async()=>{
 const f=await measure(),s=source('dsh-v4');s.records[0].isSeeded=true;for(const row of s.records)if(row.seq>=18)row.seq+=1;s.records.splice(5,0,{type:'session/end-seed',seq:18,time:1792031434553,data:{inherited:true}});
 // Constructed suffix keeps a distinct official message; the frozen original is inherited.
 s.records.push({type:'assistant/message',seq:170,time:1792031682909,data:{turn:2,step:1,message:{id:'constructed-own-message',role:'assistant'},usage:{inputTokens:11,outputTokens:2,cacheReadTokens:3}}});
 available(f([s]).totals.usage.inputTokens,11);
 const missingBoundary=structuredClone(s);missingBoundary.records=missingBoundary.records.filter(x=>x.type!=='session/end-seed');unavailable(f([missingBoundary]).totals.usage.inputTokens);
});
test('WINDOW Codex inherited markers without a valid ordinal boundary exclude source events and dependent metrics',async()=>{
 const f=await measure(),base=source('codex'),from='2026-10-02T23:03:07.088Z',until='2026-10-02T23:04:01.933Z';
 const cases=[
  ['paginated marker',p=>{p.history_mode='paginated';}],
  ['parent marker',p=>{p.parent_thread_id='fixture-parent';}],
  ['subagent marker',p=>{p.source={subagent:{id:'fixture-subagent'}};}],
  ['invalid numeric ordinal',p=>{p.history_mode='paginated';p.subagent_history_start_ordinal=-1;}],
  ['invalid string ordinal',p=>{p.history_mode='paginated';p.subagent_history_start_ordinal='2';}],
 ];
 for(const [label,markInherited]of cases){
  const s=structuredClone(base),p=s.records[0].payload;delete p.history_mode;delete p.parent_thread_id;delete p.subagent_history_start_ordinal;p.source={};markInherited(p);
  const r=f([s],window(from,until)),session=r.sessions[0];assert.equal(r.status,'incomplete',label);available(r.totals.wallMs,54845);
  for(const key of ['inputTokens','outputTokens','cacheReadTokens','cacheWriteTokens','reasoningTokens'])unavailable(session.usage[key]);
  for(const key of ['inputTokens','outputTokens','cacheReadTokens','cacheWriteTokens','reasoningTokens'])unavailable(r.totals.usage[key]);
  unavailable(session.counts.codexResponseItems);unavailable(session.counts.turns);unavailable(session.spanMs);unavailable(session.activeMs);
  unavailable(r.totals.sessionSpanSumMs);unavailable(r.totals.activeUnionMs);unavailable(r.totals.waitingMs);
  assert.equal(session.observedBoundaries[0].lastPosition,null,label+' has no trusted latest position');
  assert.ok(session.cumulativePoints.every(point=>point.from===null&&point.until===null),label+' has no fabricated cumulative endpoints');
  assert.ok(r.issues.some(issue=>issue.code.startsWith('inherited_boundary_')),label+' explains missing boundary');
 }
});
test('WINDOW Codex cumulative same-thread delta ignores usage, turn usage and fallback duplicate',async()=>{
 const f=await measure(),s=source('codex'),r=f([s],window('2026-10-02T23:03:07.088Z','2026-10-02T23:04:01.933Z'));
 assert.equal(r.status,'available');const a=r.sessions[0];assert.equal(a.sessionId,'fixture-codex-1');assert.equal(a.parentSessionId,'fixture-codex-3');
 for(const [key,value]of Object.entries({inputTokens:186557,outputTokens:259,cacheReadTokens:173568,cacheWriteTokens:0,reasoningTokens:88}))available(r.totals.usage[key],value);
 available(r.totals.wallMs,54845);available(r.totals.activeUnionMs,7328);available(r.totals.waitingMs,47517);available(r.totals.counts.codexResponseItems,7);available(r.totals.counts.turns,2);
 for(const key of ['toolCalls','subagentCalls','commandCalls'])missing(r.totals.counts[key],'unsupported_in_this_task');
 const point=a.cumulativePoints.find(x=>x.metric==='inputTokens');assert.ok(point);assert.equal(point.threadId,'fixture-codex-1');assert.equal(point.series,'token_usage_record.thread_token_usage');assert.equal(point.from.value,84812);assert.equal(point.until.value,271369);assert.equal(point.from.at,'2026-10-02T23:03:07.086Z');assert.equal(point.until.at,'2026-10-02T23:04:01.929Z');assert.ok(point.from.eventRef);assert.ok(point.until.eventRef);
});
test('WINDOW Codex fallback selected only when preferred cumulative series entirely absent',async()=>{
 const f=await measure(),s=source('codex');s.records=s.records.filter(x=>x.type!=='token_usage_record');const r=f([s],window('2026-10-02T23:03:07.088Z','2026-10-02T23:04:01.933Z'));
 available(r.totals.usage.inputTokens,186557);assert.equal(r.sessions[0].cumulativePoints.find(x=>x.metric==='inputTokens').series,'event_msg.token_count.total_token_usage');
});
test('WINDOW Codex partial preferred series does not switch cumulative source for a missing field',async()=>{
 const f=await measure(),s=source('codex');delete s.records.find(x=>x.ordinal===15).payload.thread_token_usage.input_tokens;
 const r=f([s],window('2026-10-02T23:03:07.088Z','2026-10-02T23:04:01.933Z'));unavailable(r.totals.usage.inputTokens);available(r.totals.usage.outputTokens,259);
});
test('WINDOW Codex reset/foreign thread/conflicting cumulative duplicate never fabricated delta',async()=>{
 const f=await measure();for(const mode of ['reset','foreign','conflict']){const s=source('codex'),last=s.records.find(x=>x.ordinal===40);
 if(mode==='reset')last.payload.thread_token_usage.input_tokens=1;if(mode==='foreign')last.payload.thread_id='foreign-thread';if(mode==='conflict'){const c=structuredClone(last);c.payload.thread_token_usage.input_tokens++;s.records.push(c);}
 unavailable(f([s],window('2026-10-02T23:03:07.088Z','2026-10-02T23:04:01.933Z')).totals.usage.inputTokens);}
});
test('WINDOW unknown task start and missing inherited baseline do not become session start or zero',async()=>{
 const f=await measure(),s=source('codex');const r=f([s],window(null,'2026-10-02T23:04:01.933Z'));unavailable(r.totals.wallMs);unavailable(r.totals.activeUnionMs);unavailable(r.totals.waitingMs);
 const b=f([s],window('2026-10-02T23:02:22.378Z','2026-10-02T23:04:01.933Z'));unavailable(b.totals.usage.inputTokens);
});
test('WINDOW cross-session activity uses interval union, span sum remains separate',async()=>{
 const f=await measure(),a=source('dsh-v4'),b=structuredClone(a);b.sourcePath=join(dirname(a.sourcePath),'constructed-child.jsonl');b.records[0].id='constructed-child';b.records[0].parentSession=a.records[0].id;
 for(const r of b.records){if(typeof r.time==='number')r.time+=1000;if(r.data?.message?.id)r.data.message.id+='-child';if(r.data?.callId)r.data.callId+='-child';}
 const r=f([a,b],window(iso(1792031430777),iso(1792031683908),true));available(r.totals.wallMs,253131);available(r.totals.sessionSpanSumMs,504262);available(r.totals.activeUnionMs,253131);available(r.totals.waitingMs,0);available(r.totals.usage.inputTokens,17846);
});
test('WINDOW open turn clips at cutoff; orphan end invalidates activity only',async()=>{
 const f=await measure(),s=source('dsh-v4');s.records=s.records.filter(x=>x.type!=='turn/end');const r=f([s],window(iso(1792031430777),iso(1792031440777),true));available(r.totals.activeUnionMs,10000);assert.ok(r.issues.some(x=>x.code==='open_turn'));
 const o=source('dsh-v4');o.records=o.records.filter(x=>x.type!=='turn/start');unavailable(f([o]).totals.activeUnionMs);
});
test('WINDOW DSH and Codex turn boundaries with missing or invalid IDs never pair',async()=>{
 const f=await measure(),cases=[
  ['DSH missing ID',source('dsh-v4'),r=>delete r.data.turn,r=>r.type==='turn/start'||r.type==='turn/end'],
  ['DSH invalid ID',source('dsh-v4'),r=>{r.data.turn=-1;},r=>r.type==='turn/start'||r.type==='turn/end'],
  ['Codex missing ID',source('codex'),r=>delete r.payload.turn_id,r=>r.type==='event_msg'&&(r.payload?.type==='task_started'||r.payload?.type==='task_complete')],
  ['Codex invalid ID',source('codex'),r=>{r.payload.turn_id='';},r=>r.type==='event_msg'&&(r.payload?.type==='task_started'||r.payload?.type==='task_complete')],
 ];
 for(const [label,s,mutate,isBoundary]of cases){for(const row of s.records.filter(isBoundary))mutate(row);const r=f([s]);assert.equal(r.status,'incomplete',label);unavailable(r.sessions[0].activeMs);unavailable(r.totals.activeUnionMs);unavailable(r.totals.waitingMs);assert.ok(r.issues.some(issue=>issue.code==='invalid_turn_id'),label+' records the missing association');}
});
test('BOUNDARY three independent source facts retained exactly and function input immutable',async()=>{
 const f=await measure(),s=source('dsh-v4'),facts={hostInjectedBytes:{metric:{status:'not_reported',reason:'no_authoritative_host_injection_source'},refs:[],scope:'host injection',unit:'byte'},reviewProviderUsage:{metric:{status:'available',value:[{provider:'constructed-provider',usage:{prompt_tokens:19},usage_status:'reported',ref:'quality/reviews/current.json'}]},refs:['quality/reviews/current.json'],scope:'current stage report',unit:'provider original'},materialBytes:{metric:{status:'available',value:7},refs:['decision-log.md','spec.md'],scope:'current material sample',unit:'byte'}};
 const options=deepFreeze({sourceFacts:structuredClone(facts)}),r=f([deepFreeze(s)],options);assert.deepEqual(r.sources,facts);assert.equal(r.sources.materialBytes.metric.value,7);assert.equal(r.sources.reviewProviderUsage.metric.value[0].usage.prompt_tokens,19);
});
test('MISSING invalid API window/source shapes throw instead of silently defaulting',async()=>{
 const f=await measure();for(const bad of [null,{},['path'],[{sourcePath:'relative.jsonl',records:[]}]])assert.throws(()=>f(bad));
 assert.throws(()=>f([source('dsh-v4')],window('2026-10-15T00:00:00Z','2026-10-14T00:00:00Z')));
});
test('CLI explicit input readable groups, missing-source explanations and no price/savings claims',t=>{
 target();const root=scratch(t),path=put(root,'session.v4.jsonl',source('dsh-v4').records),before=hash(readFileSync(path)),r=run(['--session='+path]);
 assert.equal(r.status,0,r.stderr);for(const word of ['8923','210','16384','task_not_supplied','no_authoritative_host_injection_source'])assert.ok(r.stdout.includes(word),word);assert.match(r.stdout,/时间|多久/);assert.match(r.stdout,/轮次内/);assert.match(r.stdout,/等待/);assert.match(r.stdout,/token/i);assert.match(r.stdout,/步骤/);assert.match(r.stdout,/子代理/);assert.match(r.stdout,/命令/);assert.match(r.stdout,/N10/);assert.match(r.stdout,/N11/);assert.doesNotMatch(r.stdout,/[$¥￥]|节省了|成本下降|收益率/);assert.equal(hash(readFileSync(path)),before);
});
test('CLI repeated explicit session deduplicated and invalid environment ignored',t=>{
 target();const root=scratch(t),path=put(root,'session.v4.jsonl',source('dsh-v4').records);const r=run(['--session='+path,'--session='+path],{env:{...process.env,DSH_SESSION_ID:'not-current',DSH_HOME:join(root,'absent'),CODEX_THREAD_ID:'not-current',CODEX_HOME:join(root,'absent-codex')}});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/8923/);assert.doesNotMatch(r.stdout,/17846/);
});
for(const extension of ['zst','zstd'])test('CLI '+extension+' decoded by real zstd; input bytes untouched',t=>{
 target();const root=scratch(t),plain=put(root,'session.v4.jsonl',source('dsh-v4').records),path=plain+'.'+extension;const compression=spawnSync('zstd',['-q','-c',plain]);assert.equal(compression.status,0,'zstd fixture compression prerequisite');writeFileSync(path,compression.stdout);const before=hash(readFileSync(path)),r=run(['--session='+path]);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/8923/);assert.equal(hash(readFileSync(path)),before);
});
test('CLI argument errors exit2, not runtime success or source fallback',t=>{
 target();const root=scratch(t),path=put(root,'session.v4.jsonl',source('dsh-v4').records);
 for(const args of [['--unknown'],['--project=p'],['--session='+path,'--from=bad'],['--session='+path,'--from=2026-10-15T00:00:00Z','--from=2026-10-15T00:00:00Z'],['--record','--project=p','--task=t','--stage=other'],['--record','--project=p','--task=t','--stage=build-plan','--from=2026-10-15T00:00:00Z'],['--session=relative.jsonl']]){const r=run(args);assert.equal(r.status,2,JSON.stringify(args)+' '+r.stderr);}
});
test('CLI source failures exit1; malformed/truncated/compression/unknown version never fake zero',t=>{
 target();const root=scratch(t);for(const [name,raw]of [['session.v4.jsonl','{bad}\n'],['session.v3.jsonl',JSON.stringify(source('dsh-v3').records[0])],['session.v99.jsonl',JSON.stringify({...source('dsh-v4').records[0],version:99})+'\n'],['session.v4.jsonl.zstd','not compressed']]){const path=join(root,name);writeFileSync(path,raw);const before=hash(readFileSync(path)),r=run(['--session='+path]);assert.equal(r.status,1,r.stderr);assert.match(r.stdout+r.stderr,/unavailable|incomplete|错误|缺|invalid/i);assert.equal(hash(readFileSync(path)),before);}
});
test('CLI symlink/directory and filename/header mismatch rejected without write or shell expansion',t=>{
 target();const root=scratch(t),path=put(root,'session.v4.jsonl',source('dsh-v4').records),link=join(root,'link.jsonl');symlinkSync(path,link);const mismatch=put(root,'session.v3.jsonl',source('dsh-v4').records);
 for(const input of [link,root,mismatch])assert.equal(run(['--session='+input]).status,1);
 const tricky=join(root,'session;$(touch SENTINEL).v4.jsonl');writeFileSync(tricky,readFileSync(path));assert.equal(run(['--session='+tricky]).status,0);assert.equal(existsSync(join(repo,'SENTINEL')),false);assert.equal(statSync(path).isFile(),true);
});
test('CLI import does not execute CLI or fail on invalid discovery environment',()=>{
 target();const r=spawnSync(process.execPath,['--input-type=module','-e','await import('+JSON.stringify(pathToFileURL(entry).href)+')'],{cwd:repo,encoding:'utf8',timeout:10000,env:{...process.env,DSH_SESSION_ID:'invalid',CODEX_THREAD_ID:'invalid'}});assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,'');assert.equal(r.stderr,'');
});

test('WINDOW DSH first window includes exact boundary and later open boundary excludes it',async()=>{
 const f=await measure(),s=source('dsh-v4'),at='2026-10-15T02:30:34.553Z',end='2026-10-15T02:34:42.908Z';
 available(f([s],window(at,end,true)).totals.usage.inputTokens,8923);available(f([s],window(at,end,false)).totals.usage.inputTokens,0);
 const zero=f([s],window(at,at,true));available(zero.totals.wallMs,0);available(zero.totals.activeUnionMs,0);available(zero.totals.waitingMs,0);
 const noCutoff=f([s],window(at,null));unavailable(noCutoff.totals.wallMs);
});
test('COUNTS DSH command and subagent tools count issued calls only, duplicate call ID once',async()=>{
 const f=await measure(),s=source('dsh-v4');s.records.push({type:'tool/call',seq:169,time:1792031682908,data:{turn:1,step:1,callId:'constructed-subagent',name:'subagent'}},{type:'tool/call',seq:170,time:1792031682908,data:{turn:1,step:1,callId:'constructed-pwsh',name:'pwsh',arguments:{command:'a; b; c'}}});s.records.push(structuredClone(s.records.at(-1)));
 const r=f([s]);available(r.totals.counts.toolCalls,3);available(r.totals.counts.subagentCalls,1);available(r.totals.counts.commandCalls,2);
});
test('COUNTS conflicting call ID exposes invalid tool count instead of choosing latest',async()=>{
 const f=await measure(),s=source('dsh-v4'),c=structuredClone(s.records.find(x=>x.type==='tool/call'));c.data.name='pwsh';s.records.push(c);const r=f([s]);assert.equal(r.status,'incomplete');unavailable(r.totals.counts.toolCalls);
});
test('COUNTS mixed DSH and Codex retain separate family counts; Codex tool forms stay unsupported',async()=>{
 const f=await measure(),a=source('dsh-v4'),b=source('codex');b.records.push({type:'response_item',timestamp:'2026-10-02T23:04:01.933Z',ordinal:43,payload:{type:'function_call',name:'exec_command',call_id:'constructed-command'}},{type:'event_msg',timestamp:'2026-10-02T23:04:01.933Z',ordinal:44,payload:{type:'item_completed',item:{type:'CommandExecution',id:'constructed-command'}}});
 const r=f([b],window('2026-10-02T23:03:07.088Z','2026-10-02T23:04:01.933Z'));missing(r.totals.counts.commandCalls,'unsupported_in_this_task');available(r.totals.counts.codexResponseItems,8);
 const m=f([a,b]);available(m.totals.counts.dshSteps,1);assert.equal(m.totals.counts.codexResponseItems.status,'available');assert.equal(m.sessions.length,2);assert.notEqual(m.totals.counts.toolCalls.status,'available','DSH subset cannot masquerade as complete mixed-family tool total');
});
test('MISSING one required session metric invalidates complete total while preserving trusted session detail',async()=>{
 const f=await measure(),a=source('dsh-v4'),b=source('dsh-v3');delete b.records.find(x=>x.type==='assistant/message').data.usage.outputTokens;const r=f([a,b]);unavailable(r.totals.usage.outputTokens);available(r.sessions.find(x=>x.sessionId==='fixture-dsh-v4-1').usage.outputTokens,210);available(r.totals.usage.inputTokens,15781);
});

test('BOUNDARY DSH observed prefix and same-timestamp newly appended official usage belong only to next slice',async()=>{
 const f=await measure(),s=source('dsh-v4'),cutoff='2026-10-15T02:34:42.908Z';const before=f([s],window('2026-10-15T02:30:30.777Z',cutoff,true));
 const previous=before.sessions.flatMap(x=>x.observedBoundaries);assert.equal(previous.length,1);assert.deepEqual(previous[0].lastPosition,{kind:'dsh_seq',seq:168,eventId:null,recordSha256:'0151aa8d9996a04f8de0f4315cb23c4ed625ef571f2bd0f605b93e5a635dd734'});assert.equal(previous[0].prefixSha256,'926993771a37b5b04a2b456d3cade98fa01501fa3b1f3f17de2bff24cce06353');assert.equal(previous[0].observedAt,cutoff);assert.deepEqual(previous[0].cumulative,[]);
 s.records.push({type:'assistant/message',seq:169,time:1792031682908,data:{turn:1,step:1,message:{id:'constructed-same-timestamp',role:'assistant'},usage:{inputTokens:11,outputTokens:2,cacheReadTokens:3}}});
 const r=f([s],{window:{from:cutoff,until:'2026-10-15T02:34:42.918Z',includeFrom:false,startRef:null,previousBoundaries:deepFreeze(previous)}});available(r.totals.usage.inputTokens,11);available(r.totals.usage.outputTokens,2);available(r.totals.usage.cacheReadTokens,3);available(r.totals.wallMs,10);assert.equal(r.sessions[0].observedBoundaries[0].lastPosition.seq,169);
});
test('BOUNDARY Codex next same-timestamp cumulative point uses prior observed cumulative, never recomputed C(from)',async()=>{
 const f=await measure(),s=source('codex');s.records=s.records.filter(x=>x.ordinal<=28);const cutoff='2026-10-02T23:03:38.011Z',first=f([s],window('2026-10-02T23:03:07.088Z',cutoff)),previous=first.sessions.flatMap(x=>x.observedBoundaries);
 available(first.totals.usage.inputTokens,90787);assert.equal(previous[0].prefixSha256,'6815186fe6c5a53abf7a2fd33e88134fa3ff4287aa6b08c5cec2dcc106db38d1');assert.deepEqual(previous[0].lastPosition,{kind:'codex_ordinal',ordinal:28,eventId:'fixture-codex-17',recordSha256:'9b837a72e5b036d632c882874a4bcfd8c77d38cc76f5efd785df256a28223c5f'});
 const newPoint=structuredClone(s.records.at(-1));newPoint.ordinal=29;newPoint.payload.response_id='constructed-new-same-time';newPoint.payload.thread_token_usage={input_tokens:176000,output_tokens:274,cached_input_tokens:93000,cache_write_input_tokens:0,reasoning_output_tokens:112,total_tokens:176274};s.records.push(newPoint);
 const r=f([s],{window:{from:cutoff,until:'2026-10-02T23:03:38.012Z',includeFrom:false,startRef:null,previousBoundaries:previous}});
 for(const [key,value]of Object.entries({inputTokens:401,outputTokens:1,cacheReadTokens:328,cacheWriteTokens:0,reasoningTokens:1}))available(r.totals.usage[key],value);
 const point=r.sessions[0].cumulativePoints.find(x=>x.metric==='inputTokens');assert.equal(point.from.value,175599);assert.equal(point.until.value,176000);assert.equal(point.from.at,point.until.at);assert.notEqual(point.from.eventRef,point.until.eventRef);
});
test('BOUNDARY changed observed prefix, absent read position and earlier late event expose explicit gaps',async()=>{
 const f=await measure(),s=source('dsh-v4'),cutoff='2026-10-15T02:34:42.908Z',first=f([s],window('2026-10-15T02:30:30.777Z',cutoff,true)),boundaries=first.sessions.flatMap(x=>x.observedBoundaries);
 for(const mode of ['rewrite','missing-position','late']){const a=structuredClone(s),previous=structuredClone(boundaries);if(mode==='rewrite')a.records[0].cwd='/constructed-rewritten-prefix';if(mode==='missing-position'){previous[0].lastPosition=null;previous[0].prefixSha256=null;previous[0].cumulative=[];}if(mode==='late')a.records.push({type:'assistant/message',seq:169,time:1792031682907,data:{turn:1,step:1,message:{id:'constructed-late',role:'assistant'},usage:{inputTokens:11,outputTokens:2,cacheReadTokens:3}}});
 const r=f([a],{window:{from:cutoff,until:'2026-10-15T02:34:42.918Z',includeFrom:false,startRef:null,previousBoundaries:previous}});assert.equal(r.status,'incomplete');unavailable(r.totals.usage.inputTokens);assert.ok(r.issues.some(x=>x.code===(mode==='late'?'late_event_before_window':'previous_boundary_mismatch')),mode);}
});
