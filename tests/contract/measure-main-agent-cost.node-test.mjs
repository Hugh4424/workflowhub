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

// Independently approved additive TCR: 2026-10-18-079-build-prd-cost-test-tcr.md.
test('BUILD-PRD cost label accepts real CLI session input while unknown stage remains invalid',()=>{
 const argv=['--session='+join(fixtures,'dsh-v4.jsonl')];
 const accepted=run([...argv,'--stage=build-prd']);
 assert.equal(accepted.status,0,'build-prd cost label must be accepted: '+accepted.stderr);
 assert.match(accepted.stdout,/inputTokens \(token\): 8923/);
 const rejected=run([...argv,'--stage=unknown-stage']);
 assert.equal(rejected.status,2);assert.match(rejected.stderr,/invalid stage/);
});

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
 for(const key of ['toolCalls','commandCalls'])missing(r.totals.counts[key],'unsupported_in_this_task');
 unavailable(r.totals.counts.subagentCalls);
 assert.equal(r.sessions[0].counts.subagentCalls.reason,'incomplete_count_source');
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

// Approved narrow root-paginated compatibility TCR; original frozen prefix unchanged.
{
const f=await measure();
const rootPaginatedTest=(name,fn)=>test('ROOT-PAGINATED '+name,fn);
const time=n=>new Date(Date.UTC(2026,9,18,0,0,n)).toISOString();
const tokens=n=>({input_tokens:n,output_tokens:n,cached_input_tokens:n,cache_write_input_tokens:0,reasoning_output_tokens:n});
function src(){return {sourcePath:'/constructed/root.jsonl',records:[
 {ordinal:0,timestamp:time(0),type:'session_meta',payload:{id:'root',history_mode:'paginated',source:'vscode'}},
 {ordinal:1,timestamp:time(1),type:'token_usage_record',payload:{thread_id:'root',thread_token_usage:tokens(10)}},
 {ordinal:2,timestamp:time(2),type:'turn_context',payload:{turn_id:'t1'}},
 {ordinal:3,timestamp:time(3),type:'response_item',payload:{type:'function_call',id:'call-1'}},
 {ordinal:4,timestamp:time(4),type:'token_usage_record',payload:{thread_id:'root',thread_token_usage:tokens(22)}},
 {ordinal:5,timestamp:time(5),type:'event_msg',payload:{type:'token_count',info:{total_token_usage:tokens(9999)}}},
 ]};}
const opts={window:{from:time(1),until:time(5),includeFrom:false}};
const unavailable=m=>assert.equal(m.status,'unavailable');
rootPaginatedTest('complete root paginated uses same-thread 10→22 delta, response/turn counts and no fallback double count',()=>{
 const r=f([src()],opts);assert.deepEqual(r.totals.usage.inputTokens,{status:'available',value:12});
 assert.deepEqual(r.totals.counts.codexResponseItems,{status:'available',value:1});assert.deepEqual(r.totals.counts.turns,{status:'available',value:1});
 assert.equal(r.totals.counts.commandCalls.reason,'unsupported_in_this_task');
 assert.equal(r.sessions[0].observedBoundaries[0].lastPosition.ordinal,5);
});
for(const [key,value]of [['parent_thread_id','parent'],['source',{subagent:{id:'child'}}],['history_base',{id:'base'}],['forked_from_id','fork'],['subagent_history_start_ordinal',-1]])rootPaginatedTest('preserve fail closed '+key,()=>{
 const s=src();s.records[0].payload[key]=value;const r=f([s],opts);unavailable(r.totals.usage.inputTokens);assert.ok(r.issues.some(x=>x.code.startsWith('inherited_boundary_')));
});
rootPaginatedTest('paginated ordinal gap cannot establish root prefix',()=>{const s=src();s.records.splice(2,1);unavailable(f([s],opts).totals.usage.inputTokens);});
rootPaginatedTest('foreign thread cumulative cannot become valid delta',()=>{const s=src();s.records[4].payload.thread_id='foreign';unavailable(f([s],opts).totals.usage.inputTokens);});
rootPaginatedTest('conflicting ordinal cannot become valid delta',()=>{const s=src();s.records.push({...s.records[4],payload:{thread_id:'root',thread_token_usage:tokens(23)}});unavailable(f([s],opts).totals.usage.inputTokens);});
rootPaginatedTest('paginated root without baseline does not invent zero',()=>{const s=src();s.records=s.records.filter(r=>r.ordinal!==1);s.records.forEach((r,i)=>r.ordinal=i);unavailable(f([s],{window:{from:time(0),until:time(5),includeFrom:true}}).totals.usage.inputTokens);});
rootPaginatedTest('missing declared child remains incomplete and visible',()=>{const s=src();s.records.push({ordinal:6,timestamp:time(5),type:'event_msg',payload:{type:'item_completed',item:{type:'CollabAgentToolCall',tool:'spawn_agent',receiver_thread_ids:['child-missing']}}});const r=f([s],opts);assert.equal(r.status,'incomplete');assert.ok(r.issues.some(x=>x.code==='missing_child'));});
rootPaginatedTest('changed observed prefix remains rejected',()=>{const s=src();const first=f([s],opts);const b=first.sessions[0].observedBoundaries;if(!b[0].lastPosition)return;const changed=structuredClone(s);changed.records[3].payload.id='changed';const r=f([changed],{window:{from:time(5),until:time(6),includeFrom:false,previousBoundaries:b}});assert.ok(r.issues.some(x=>x.code==='previous_boundary_mismatch'));unavailable(r.totals.usage.inputTokens);});

}

// Reviewed fresh-child narrow compatibility TCR; all preceding frozen bytes unchanged.
{
const freshChildTest=(name,fn)=>test('FRESH-CHILD '+name,fn);
const f=await measure();const t=n=>new Date(Date.UTC(2026,9,18,0,0,n)).toISOString();const u=n=>({input_tokens:n,output_tokens:n,cached_input_tokens:n,cache_write_input_tokens:0,reasoning_output_tokens:n});
const row=(ordinal,second,type,payload)=>({ordinal,timestamp:t(second),type,payload});
function sources(){return [{sourcePath:'/fresh/root.jsonl',records:[row(0,0,'session_meta',{id:'root',history_mode:'paginated',cli_version:'0.163.0-alpha.10.2',source:'vscode'}),row(1,1,'token_usage_record',{thread_id:'root',thread_token_usage:u(10)}),row(2,2,'response_item',{type:'function_call',namespace:'collaboration',name:'spawn_agent',call_id:'spawn-1',arguments:JSON.stringify({fork_turns:'none'})}),row(3,2,'event_msg',{type:'item_completed',item:{type:'SubAgentActivity',kind:'started',id:'spawn-1',agent_thread_id:'child',agent_path:'/root/test'}}),row(4,6,'token_usage_record',{thread_id:'root',thread_token_usage:u(22)})]}, {sourcePath:'/fresh/child.jsonl',records:[row(0,3,'session_meta',{id:'child',parent_thread_id:'root',history_mode:'paginated',cli_version:'0.163.0-alpha.10.2',source:{subagent:{thread_spawn:{parent_thread_id:'root',agent_path:'/root/test'}}}}),row(1,3,'event_msg',{type:'task_started',turn_id:'child-turn'}),row(2,4,'token_usage_record',{thread_id:'child',thread_token_usage:u(7)}),row(3,5,'token_usage_record',{thread_id:'child',thread_token_usage:u(11)})]}];}
const opts={window:{from:t(2),until:t(6),includeFrom:false}};const child=r=>r.sessions.find(s=>s.sessionId==='child');const unavailable=r=>assert.equal(child(r).usage.inputTokens.status,'unavailable');
freshChildTest('parent fresh spawn chain authorizes child own source and positive birth zero baseline',()=>{const r=f(sources(),opts);assert.deepEqual(child(r).usage.inputTokens,{status:'available',value:11});assert.equal(child(r).observedBoundaries[0].lastPosition.ordinal,3);assert.deepEqual(r.totals.usage.inputTokens,{status:'available',value:23});});
freshChildTest('child born before window needs real prewindow cumulative, not birth zero',()=>{const r=f(sources(),{window:{from:t(4),until:t(6),includeFrom:false}});assert.deepEqual(child(r).usage.inputTokens,{status:'available',value:4});});
const mutations=[['no parent',s=>s.shift()],['fork all',s=>s[0].records[2].payload.arguments='{"fork_turns":"all"}'],['no issue',s=>{s[0].records[2].payload.type='not_function_call';}],['wrong namespace',s=>{s[0].records[2].payload.namespace='untrusted';}],['missing association',s=>{s[0].records[3].payload.item.id='other';}],['wrong header parent',s=>{s[1].records[0].payload.parent_thread_id='other';}],['wrong spawn parent',s=>{s[1].records[0].payload.source.subagent.thread_spawn.parent_thread_id='other';}],['wrong agent path',s=>{s[1].records[0].payload.source.subagent.thread_spawn.agent_path='other';}],['history base',s=>{s[1].records[0].payload.history_base={id:'ancestor'};}],['explicit invalid seed',s=>{s[1].records[0].payload.subagent_history_start_ordinal=-1;}],['foreign cumulative',s=>{s[1].records[3].payload.thread_id='other';}],['child gap',s=>{s[1].records[2].ordinal=20;}],['parent gap',s=>{s[0].records[2].ordinal=20;}],['unknown generation',s=>{s[1].records[0].payload.cli_version='unknown';}],['ancestor header',s=>{s[1].records[1].type='session_meta';s[1].records[1].payload={id:'ancestor'};}],['child read failure',s=>{s[1].readIssue={code:'truncated_tail',sourcePath:s[1].sourcePath,message:'constructed',expected:false};}],['parent read failure',s=>{s[0].readIssue={code:'truncated_tail',sourcePath:s[0].sourcePath,message:'constructed',expected:false};}],['reused spawn identity',s=>{s[0].records.splice(4,0,row(4,3,'response_item',{...s[0].records[2].payload,arguments:'{"fork_turns":"all"}'}));s[0].records.at(-1).ordinal=5;}],['reused started identity',s=>{s[0].records.splice(4,0,row(4,3,'event_msg',{type:'item_completed',item:{...s[0].records[3].payload.item,agent_thread_id:'other'}}));s[0].records.at(-1).ordinal=5;}],['parent foreign cumulative',s=>{s[0].records[1].payload.thread_id='other';}],['child predates birth',s=>{s[1].records[1].timestamp=t(0);}],['future spawn',s=>{s[0].records[3].timestamp=t(7);}]];
for(const[name,mutate]of mutations)freshChildTest('fresh child fail closed: '+name,()=>{const s=sources();mutate(s);unavailable(f(s,opts));});
freshChildTest('fresh child before window without real baseline cannot use birth zero',()=>{const s=sources();s[1].records.splice(2,1);s[1].records.forEach((r,i)=>r.ordinal=i);unavailable(f(s,{window:{from:t(4),until:t(6),includeFrom:false}}));});
freshChildTest('cyclic parent ancestry never proves fresh history',()=>{const s=sources();s[0].records[0].payload.parent_thread_id='child';s[0].records[0].payload.source={subagent:{thread_spawn:{parent_thread_id:'child',agent_path:'/root/parent'}}};unavailable(f(s,opts));});

freshChildTest('observed 0.164 exact version retains original birth proof',()=>{const s=sources();for(const x of s)x.records[0].payload.cli_version='0.164.0-alpha.11.1';assert.deepEqual(child(f(s,opts)).usage.inputTokens,{status:'available',value:11});});
for(const [name,mutate] of mutations)freshChildTest('observed 0.164 keeps negative proof: '+name,()=>{const s=sources();for(const x of s)x.records[0].payload.cli_version='0.164.0-alpha.11.1';mutate(s);unavailable(f(s,opts));});

freshChildTest('P4 proof context excludes parent from measured totals',()=>{const [parent,own]=sources();const r=f([own],{...opts,proofSources:[parent]});assert.equal(r.sessions.length,1);assert.equal(r.sessions[0].sessionId,'child');assert.deepEqual(r.totals.usage.inputTokens,{status:'available',value:11});assert.deepEqual(r.totals.usage.outputTokens,{status:'available',value:11});assert.deepEqual(r.totals.wallMs,{status:'available',value:4000});assert.deepEqual(r.totals.counts.codexResponseItems,{status:'available',value:0});assert.deepEqual(r.totals.counts.subagentCalls,{status:'available',value:0});assert.ok(r.issues.some(i=>i.code==='birth_proof_source'&&i.sourcePath===parent.sourcePath&&i.expected));});
for(const [name,mutate] of mutations)freshChildTest('P4 proof context keeps negative proof: '+name,()=>{const s=sources();mutate(s);const own=s.find(x=>x.records[0]?.payload?.id==='child');if(!own)return;const r=f([own],{...opts,proofSources:s.filter(x=>x!==own)});assert.equal(r.sessions.length,1);assert.equal(r.sessions[0].usage.inputTokens.status,'unavailable');});
freshChildTest('P4 explicit measured parent and child remain aggregated',()=>{const s=sources();const r=f(s,{...opts,proofSources:[]});assert.equal(r.sessions.length,2);assert.deepEqual(r.totals.usage.inputTokens,{status:'available',value:23});});

freshChildTest('trusted parent may not issue spawn before its own header birth',()=>{const s=sources();s[0].records[0].timestamp=t(5);unavailable(f(s,opts));});

}

// Valid formal112 finding: a malformed exact-UUID candidate cannot vanish behind a good copy.
test('FRESH-CHILD-COPY CLI keeps headerless failed copy and blocks inferred child birth zero',t=>{
 const root=scratch(t),leaf=join(root,'sessions','2026','10','18');mkdirSync(leaf,{recursive:true});
 const parent='01a14c6d-0000-7000-8000-000000000001',child='01a14c6e-0000-7000-8000-000000000002';
 const at=n=>'2026-10-18T00:00:0'+n+'.000Z',usage=n=>({input_tokens:n,output_tokens:n,cached_input_tokens:n,cache_write_input_tokens:0,reasoning_output_tokens:n});
 const row=(ordinal,n,type,payload)=>({ordinal,timestamp:at(n),type,payload});
 const parentPath=put(leaf,'rollout-parent-'+parent+'.jsonl',[
  row(0,0,'session_meta',{id:parent,history_mode:'paginated',cli_version:'0.163.0-alpha.10.2',source:'vscode'}),
  row(1,1,'token_usage_record',{thread_id:parent,thread_token_usage:usage(10)}),
  row(2,2,'response_item',{type:'function_call',namespace:'collaboration',name:'spawn_agent',call_id:'copy-spawn',arguments:'{"fork_turns":"none"}'}),
  row(3,2,'event_msg',{type:'item_completed',item:{type:'SubAgentActivity',kind:'started',id:'copy-spawn',agent_thread_id:child,agent_path:'/root/copy'}}),
  row(4,6,'token_usage_record',{thread_id:parent,thread_token_usage:usage(22)}),
 ]);
 put(leaf,'rollout-good-'+child+'.jsonl',[
  row(0,3,'session_meta',{id:child,parent_thread_id:parent,history_mode:'paginated',cli_version:'0.163.0-alpha.10.2',source:{subagent:{thread_spawn:{parent_thread_id:parent,agent_path:'/root/copy'}}}}),
  row(1,3,'event_msg',{type:'task_started',turn_id:'copy-turn'}),
  row(2,4,'token_usage_record',{thread_id:child,thread_token_usage:usage(7)}),
  row(3,5,'token_usage_record',{thread_id:child,thread_token_usage:usage(11)}),
 ]);
 const argv=['--session='+parentPath,'--from='+at(1),'--until='+at(6)];
 const clean=run(argv);assert.equal(clean.status,0,clean.stderr);assert.match(clean.stdout,/inputTokens \(token\): 23/);
 const broken=join(leaf,'rollout-broken-'+child+'.jsonl');writeFileSync(broken,'not valid JSON\n');
 const result=run(argv);assert.equal(result.status,1,'unreadable candidate must make whole measurement incomplete');
 assert.match(result.stdout,/child session copies include incomplete source/);assert.match(result.stdout,/inherited_boundary_missing/);
 assert.match(result.stdout,/inputTokens \(token\): unavailable:source_read_incomplete/);
});

// Additive root-birth regression: constructed first-request history, not a real-session copy.
// The earlier ROOT-PAGINATED no-baseline and inherited-history assertions stay unchanged.
{
 const f=await measure(),at=n=>new Date(Date.UTC(2026,9,19,1,0,n)).toISOString();
 const totals={inputTokens:139,outputTokens:21,cacheReadTokens:92,cacheWriteTokens:0,reasoningTokens:8};
 const usage=(input,output,cache,reasoning)=>({input_tokens:input,output_tokens:output,cached_input_tokens:cache,cache_write_input_tokens:0,reasoning_output_tokens:reasoning});
 const row=(ordinal,timestamp,type,payload)=>({ordinal,timestamp:at(timestamp),type,payload});
 function bornRoot(){return {sourcePath:'/constructed/root-birth.jsonl',records:[
  row(0,1,'session_meta',{id:'born-root',session_id:'born-root',history_mode:'paginated',source:'vscode'}),
  row(1,1,'event_msg',{type:'task_started',turn_id:'first-turn'}),
  row(2,2,'response_item',{type:'message',role:'user'}),
  row(3,2,'turn_context',{turn_id:'first-turn'}),
  row(4,2,'event_msg',{type:'item_completed',thread_id:'born-root',turn_id:'first-turn',item:{type:'UserMessage',id:'first-user'}}),
  row(5,3,'event_msg',{type:'item_completed',thread_id:'born-root',turn_id:'first-turn',item:{type:'AgentMessage',id:'first-agent'}}),
  row(6,3,'response_item',{type:'message',role:'assistant'}),
  row(7,3,'response_item',{type:'custom_tool_call'}),
  row(8,4,'token_usage_record',{thread_id:'born-root',turn_id:'first-turn',thread_token_usage:usage(101,13,70,5)}),
  row(9,5,'event_msg',{type:'task_complete',turn_id:'first-turn'}),
  row(10,6,'event_msg',{type:'task_started',turn_id:'second-turn'}),
  row(11,6,'turn_context',{turn_id:'second-turn'}),
  row(12,7,'token_usage_record',{thread_id:'born-root',turn_id:'second-turn',thread_token_usage:usage(139,21,92,8)}),
  row(13,8,'event_msg',{type:'task_complete',turn_id:'second-turn'}),
 ]};}
 const opts={window:{from:at(0),until:at(8),includeFrom:false}};
 const unavailableAll=(r,label)=>{for(const k of Object.keys(totals))assert.equal(r.sessions[0].usage[k].status,'unavailable',label+' '+k);};
 const remove=(s,index)=>{s.records.splice(index,1);s.records.forEach((r,i)=>r.ordinal=i);};
 test('ROOT-BIRTH complete paginated first request born inside window retains all five cumulative values',()=>{
  const s=bornRoot(),before=JSON.stringify(s),r=f([s],opts);
  for(const [k,value] of Object.entries(totals))assert.deepEqual(r.sessions[0].usage[k],{status:'available',value},k);
  assert.equal(r.status,'available');assert.equal(JSON.stringify(s),before,'source records remain immutable');
  for(const p of r.sessions[0].cumulativePoints){assert.equal(p.from.value,0);assert.equal(p.from.eventRef,s.sourcePath+'#ordinal=0');assert.equal(p.until.value,totals[p.metric]);}
 });
 const cases=[
  ['parent',s=>{s.records[0].payload.parent_thread_id='other';}],
  ['subagent',s=>{s.records[0].payload.source={subagent:{id:'child'}};}],
  ['history-base',s=>{s.records[0].payload.history_base={id:'base'};}],
  ['fork',s=>{s.records[0].payload.forked_from_id='other';}],
  ['seed',s=>{s.records[0].payload.subagent_history_start_ordinal=0;}],
  ['ordinal gap',s=>{s.records.splice(2,1);}],
  ['conflicting ordinal',s=>{s.records.push({...s.records[8],payload:{thread_id:'born-root',turn_id:'first-turn',thread_token_usage:usage(102,13,70,5)}});}],
  ['read issue',s=>{s.readIssue={code:'truncated_tail',sourcePath:s.sourcePath,message:'constructed missing suffix',expected:false};}],
  ['compaction',s=>{s.records[2].payload.type='compaction';}],
  ['foreign usage thread',s=>{s.records[8].payload.thread_id='other';}],
  ['foreign first usage turn',s=>{s.records[8].payload.turn_id='other';}],
  ['foreign user thread',s=>{s.records[4].payload.thread_id='other';}],
  ['foreign user turn',s=>{s.records[4].payload.turn_id='other';}],
  ['foreign initial context turn',s=>{s.records[3].payload.turn_id='other';}],
  ['no user origin',s=>{remove(s,4);}],
  ['no task start',s=>{remove(s,1);}],
  ['assistant before user',s=>{s.records[2].payload={type:'message',role:'assistant'};}],
  ['tool before user',s=>{s.records[2].payload={type:'function_call_output'};}],
  ['no usage',s=>{s.records=s.records.filter(r=>r.type!=='token_usage_record');s.records.forEach((r,i)=>r.ordinal=i);}],
  ['second header',s=>{s.records[2].type='session_meta';s.records[2].payload={id:'born-root'};}],
 ];
 for(const [label,mutate]of cases)test('ROOT-BIRTH rejects '+label+' without inventing a zero baseline',()=>{const s=bornRoot();mutate(s);const r=f([s],opts);if(label==='no usage'){for(const k of ['inputTokens','outputTokens','cacheReadTokens'])assert.equal(r.sessions[0].usage[k].status,'unavailable',k);for(const k of ['cacheWriteTokens','reasoningTokens'])assert.deepEqual(r.sessions[0].usage[k],{status:'not_reported',reason:'field_not_reported'},k);}else unavailableAll(r,label);});
 test('ROOT-BIRTH birth at window boundary cannot prove a new zero baseline',()=>{unavailableAll(f([bornRoot()],{window:{from:at(1),until:at(8),includeFrom:true}}),'birth at from');});
 test('ROOT-BIRTH response prefix before window without a cumulative observation stays unavailable',()=>{unavailableAll(f([bornRoot()],{window:{from:at(3),until:at(8),includeFrom:false}}),'response before from');});
 test('ROOT-BIRTH missing child usage remains incomplete even if its proven parent has complete cumulative values',()=>{
  const root=bornRoot();root.records.push(row(14,8,'event_msg',{type:'item_completed',item:{type:'SubAgentActivity',kind:'started',id:'child-start',agent_thread_id:'usage-missing-child'}}));
  const child={sourcePath:'/constructed/usage-missing-child.jsonl',records:[row(0,8,'session_meta',{id:'usage-missing-child',parent_thread_id:'born-root',subagent_history_start_ordinal:0}),row(1,8,'event_msg',{type:'task_started',turn_id:'child-turn'})]};
  const r=f([root,child],opts);for(const k of Object.keys(totals)){assert.deepEqual(r.sessions[0].usage[k],{status:'available',value:totals[k]},'root '+k);assert.equal(r.sessions[1].usage[k].status,['cacheWriteTokens','reasoningTokens'].includes(k)?'not_reported':'unavailable','child '+k);assert.equal(Object.hasOwn(r.sessions[1].usage[k],'value'),false,'no fabricated child value '+k);assert.equal(r.totals.usage[k].status,'unavailable','total '+k);}
 });
}

// N10 cost202 additive regression; existing frozen assertions remain unchanged.
{
 const f=await measure(),base=Date.parse('2026-10-21T13:51:58.043Z');
 const at=n=>new Date(base+n).toISOString();
 const u=n=>({input_tokens:n,output_tokens:n,cached_input_tokens:n,cache_write_input_tokens:0,reasoning_output_tokens:n});
 const row=(ordinal,ms,type,payload)=>({ordinal,timestamp:at(ms),type,payload});
 const input='const briefs = [{message: `owned task`, reasoning_effort: "high"}];\nconst spawned = await Promise.all(briefs.map(b => tools.multi_agent_v1__spawn_agent({message: b.message, reasoning_effort: b.reasoning_effort, fork_context: false})));\nfor (const item of spawned) text(item);';
 function sources(){return [{sourcePath:'/cost202/root.jsonl',records:[
  row(0,0,'session_meta',{id:'root',session_id:'root',history_mode:'paginated',cli_version:'0.163.0-alpha.10.2',source:'vscode'}),
  row(1,1,'event_msg',{type:'task_started',turn_id:'root-turn'}),
  row(2,2,'turn_context',{turn_id:'root-turn'}),
  row(3,3,'event_msg',{type:'item_completed',thread_id:'root',turn_id:'root-turn',item:{type:'UserMessage',id:'user-1'}}),
  row(4,4,'token_usage_record',{thread_id:'root',turn_id:'root-turn',usage:u(10),thread_token_usage:u(10)}),
  row(5,5,'response_item',{type:'custom_tool_call',name:'exec',status:'completed',call_id:'call-1',input}),
  row(6,7,'event_msg',{type:'item_completed',thread_id:'root',turn_id:'root-turn',item:{type:'CollabAgentToolCall',id:'exec-1',tool:'spawn_agent',status:'completed',sender_thread_id:'root',receiver_thread_ids:['child'],receiver_agents:[{thread_id:'child',agent_nickname:'Owned'}],prompt:'owned task'},started_at_ms:base+6,completed_at_ms:base+7}),
  row(7,9,'response_item',{type:'custom_tool_call_output',call_id:'call-1',output:[{type:'input_text',text:'Script completed\nWall time 0.1 seconds\nOutput:\n'},{type:'input_text',text:'{"agent_id":"child","nickname":"Owned"}'}],internal_chat_message_metadata_passthrough:{turn_id:'root-turn'}}),
  row(8,12,'token_usage_record',{thread_id:'root',turn_id:'root-turn',usage:u(12),thread_token_usage:u(22)}),
  row(9,13,'event_msg',{type:'task_complete',turn_id:'root-turn'}),
 ]},{sourcePath:'/cost202/child.jsonl',records:[
  row(0,8,'session_meta',{id:'child',session_id:'root',parent_thread_id:'root',history_mode:'paginated',cli_version:'0.163.0-alpha.10.2',source:{subagent:{thread_spawn:{parent_thread_id:'root',agent_path:null,agent_nickname:'Owned'}}}}),
  row(1,8,'event_msg',{type:'task_started',turn_id:'child-turn'}),
  row(2,9,'token_usage_record',{thread_id:'child',turn_id:'child-turn',usage:u(7),thread_token_usage:u(7)}),
  row(3,11,'token_usage_record',{thread_id:'child',turn_id:'child-turn',usage:u(4),thread_token_usage:u(11)}),
  row(4,12,'event_msg',{type:'task_complete',turn_id:'child-turn'}),
 ]}];}
 const opts={window:{from:at(-1),until:at(13),includeFrom:false}};
 test('COST202 real-format root 1ms and exec spawn completed chain recover exact own tokens',()=>{
  const s=sources(),before=JSON.stringify(s),r=f(s,opts);
  available(r.sessions[0].usage.inputTokens,22);available(r.sessions[1].usage.inputTokens,11);available(r.totals.usage.inputTokens,33);
  assert.equal(r.status,'available');assert.equal(JSON.stringify(s),before);
 });

// P4 Standards135 / exact TCR007 independently approved030.
const desktopCount=(s,w=opts)=>f(s,w).sessions.find(x=>x.sessionId==='root').counts.subagentCalls;
test('P4 DESKTOP COUNTS existing complete single spawn is one own invocation',()=>{
 const s=sources(),before=JSON.stringify(s),r=f(s,opts);
 available(r.sessions[0].counts.subagentCalls,1);available(r.sessions[1].counts.subagentCalls,0);available(r.totals.counts.subagentCalls,1);
 available(r.totals.usage.inputTokens,33);assert.equal(JSON.stringify(s),before);
});
test('P4 DESKTOP COUNTS repeated source copies and same completion identity count once',()=>{
 const s=sources();available(f([...s,...structuredClone(s)],opts).totals.counts.subagentCalls,1);
 const duplicate=structuredClone(s[0].records[6]);s[0].records.splice(7,0,duplicate);s[0].records.forEach((r,i)=>r.ordinal=i);
 available(desktopCount(s),1);
});
test('P4 DESKTOP COUNTS one exec wrapper can contain two actual invocation identities',()=>{
 const s=sources(),root=s[0];
 root.records[5].payload.input='const briefs = [{message: '+JSON.stringify('owned task')+', reasoning_effort: "high"}, {message: '+JSON.stringify('second task')+', reasoning_effort: "high"}];\nconst spawned = await Promise.all(briefs.map(b => tools.multi_agent_v1__spawn_agent({message: b.message, reasoning_effort: b.reasoning_effort, fork_context: false})));\nfor (const item of spawned) text(item);';
 const second=structuredClone(root.records[6]);second.payload.item={...second.payload.item,id:'exec-2',receiver_thread_ids:['child2'],receiver_agents:[{thread_id:'child2',agent_nickname:'Second'}],prompt:'second task'};
 root.records.splice(7,0,second);root.records.find(r=>r.payload?.type==='custom_tool_call_output').payload.output.push({type:'input_text',text:'{"agent_id":"child2","nickname":"Second"}'});root.records.forEach((r,i)=>r.ordinal=i);
 available(desktopCount(s),2);
});
test('P4 DESKTOP COUNTS trusted failed attempt counts but missing failed identity does not become zero',()=>{
 const failureShape=()=>{const s=sources();s[0].records[6].payload.item.status='failed';s[0].records[6].payload.item.receiver_thread_ids=[];s[0].records[6].payload.item.receiver_agents=[];s[0].records[7].payload.output=[{type:'input_text',text:'Script completed\nWall time 0.1 seconds\nOutput:\n'},{type:'input_text',text:'{"error":"constructed spawn rejection"}'}];return [s[0]];};
 const failed=failureShape();available(desktopCount(failed),1);
 const unknown=failureShape();delete unknown[0].records[6].payload.item.id;unavailable(desktopCount(unknown));
});
for(const [name,mutate]of [
 ['missing exec call identity',s=>{delete s[0].records[5].payload.call_id;}],
 ['missing completion',s=>{s[0].records.splice(6,1);s[0].records.forEach((r,i)=>r.ordinal=i);}],
 ['missing output',s=>{s[0].records.splice(7,1);s[0].records.forEach((r,i)=>r.ordinal=i);}],
 ['wrong sender',s=>{s[0].records[6].payload.item.sender_thread_id='other';}],
 ['wrong turn',s=>{s[0].records[6].payload.turn_id='other-turn';}],
 ['unknown exec expression',s=>{s[0].records[5].payload.input='await tools.multi_agent_v1__spawn_agent(dynamicInput);';}],
 ['conflicting completion identity',s=>{const c=structuredClone(s[0].records[6]);c.payload.item.prompt='other task';s[0].records.splice(7,0,c);s[0].records.forEach((r,i)=>r.ordinal=i);}],
 ['conflicting exec identity',s=>{const c=structuredClone(s[0].records[5]);c.payload.input='changed input';s[0].records.splice(6,0,c);s[0].records.forEach((r,i)=>r.ordinal=i);}]
])test('P4 DESKTOP COUNTS insufficient or conflicting proof: '+name,()=>{const s=sources();mutate(s);unavailable(desktopCount(s));});
test('P4 DESKTOP COUNTS original initiation boundary excludes completed earlier-window attempts',()=>{
 available(desktopCount(sources(),{window:{from:at(6),until:at(13),includeFrom:false}}),0);
 available(desktopCount(sources(),{window:{from:at(5),until:at(13),includeFrom:false}}),1);
 unavailable(desktopCount(sources(),{window:{from:at(-1),until:at(6),includeFrom:false}}));
});
test('P4 DESKTOP COUNTS native and desktop forms combine without double-counting the same stable invocation',()=>{
 const distinct=sources();distinct[0].records.splice(6,0,row(6,6,'response_item',{type:'function_call',namespace:'collaboration',name:'followup_task',call_id:'native-distinct',arguments:'{}'}));distinct[0].records.forEach((r,i)=>r.ordinal=i);available(desktopCount(distinct),2);
 const same=sources();same[0].records.splice(6,0,row(6,6,'response_item',{type:'function_call',namespace:'collaboration',name:'spawn_agent',call_id:'exec-1',arguments:'{}'}));same[0].records.forEach((r,i)=>r.ordinal=i);available(desktopCount(same),1);
 const conflict=sources();conflict[0].records.splice(6,0,row(6,6,'response_item',{type:'function_call',namespace:'collaboration',name:'followup_task',call_id:'exec-1',arguments:'{}'}));conflict[0].records.forEach((r,i)=>r.ordinal=i);unavailable(desktopCount(conflict));
 const wrongNamespace=sources();wrongNamespace[0].records.splice(6,0,row(6,6,'response_item',{type:'function_call',namespace:'other',name:'spawn_agent',call_id:'native-other',arguments:'{}'}));wrongNamespace[0].records.forEach((r,i)=>r.ordinal=i);available(desktopCount(wrongNamespace),1);
});
 const negatives=[
  ['root 2ms',s=>{s[0].records[1].timestamp=at(2);},'root'],
  ['root negative gap',s=>{s[0].records[1].timestamp=at(-1);},'root'],
  ['root wrong generation',s=>{s[0].records[0].payload.cli_version='unknown';},'root'],
  ['root inherited totals',s=>{s[0].records[4].payload.usage=u(1);},'root'],
  ['root foreign user',s=>{s[0].records[3].payload.thread_id='other';},'root'],
  ['child inherited',s=>{s[1].records[0].payload.history_base={id:'ancestor'};},'child'],
  ['child wrong parent',s=>{s[1].records[0].payload.parent_thread_id='other';},'child'],
  ['child session identity mismatch',s=>{s[1].records[0].payload.session_id='other';},'child'],
  ['child foreign usage',s=>{s[1].records[2].payload.thread_id='other';},'child'],
  ['fork true',s=>{s[0].records[5].payload.input=input.replace('fork_context: false','fork_context: true');},'child'],
  ['quoted spoof',s=>{s[0].records[5].payload.input=JSON.stringify(input);},'child'],
  ['dead code',s=>{s[0].records[5].payload.input='if(false){'+input+'}';},'child'],
  ['extra executable code',s=>{s[0].records[5].payload.input=input+'; globalThis.sideEffect=true;';},'child'],
  ['template interpolation',s=>{s[0].records[5].payload.input=input.replace('owned task','${danger()}');},'child'],
  ['wrong tool',s=>{s[0].records[5].payload.input=input.replace('multi_agent_v1__spawn_agent','other');},'child'],
  ['prompt mismatch',s=>{s[0].records[6].payload.item.prompt='other';},'child'],
  ['completion failed',s=>{s[0].records[6].payload.item.status='failed';},'child'],
  ['sender mismatch',s=>{s[0].records[6].payload.item.sender_thread_id='other';},'child'],
  ['completion turn mismatch',s=>{s[0].records[6].payload.turn_id='other';},'child'],
  ['receiver mismatch',s=>{s[0].records[6].payload.item.receiver_thread_ids=['other'];},'child'],
  ['receiver metadata mismatch',s=>{s[0].records[6].payload.item.receiver_agents[0].thread_id='other';},'child'],
  ['malformed receiver metadata',s=>{s[0].records[6].payload.item.receiver_agents=[null];},'child'],
  ['output call mismatch',s=>{s[0].records[7].payload.call_id='other';},'child'],
  ['output child mismatch',s=>{s[0].records[7].payload.output[1].text='{"agent_id":"other","nickname":"Owned"}';},'child'],
  ['nickname mismatch',s=>{s[1].records[0].payload.source.subagent.thread_spawn.agent_nickname='Other';},'child'],
  ['completion after birth',s=>{s[0].records[6].payload.completed_at_ms=base+9;},'child'],
  ['ordinal gap',s=>{s[1].records[2].ordinal=20;},'child'],
 ];
 for(const[label,mutate,id]of negatives)test('COST202 rejects '+label,()=>{const s=sources();mutate(s);const r=f(s,opts);unavailable(r.sessions.find(x=>x.sessionId===id).usage.inputTokens);});
 test('COST202 an output after cutoff cannot prove fresh child birth',()=>{const r=f(sources(),{window:{from:at(-1),until:at(8),includeFrom:false}});unavailable(r.sessions[1].usage.inputTokens);});
}

// P4 reviewed TCR022: constructed counting cases, not benchmark evidence.
{
const f=await measure(),at=n=>new Date(Date.UTC(2026,9,26,0,0,n)).toISOString();
const row=(ordinal,n,type,payload)=>({ordinal,timestamp:at(n),type,payload});
const u=n=>({input_tokens:n,output_tokens:n,cached_input_tokens:0,cache_write_input_tokens:0,reasoning_output_tokens:0});
const call=(id,name='spawn_agent',namespace='collaboration',args='{}')=>({type:'function_call',namespace,name,call_id:id,arguments:args});
function complete(calls=[]){return {sourcePath:'/constructed/p4-counts.jsonl',records:[row(0,0,'session_meta',{id:'p4-counts'}),row(1,1,'token_usage_record',{thread_id:'p4-counts',thread_token_usage:u(10)}),...calls.map((p,i)=>row(i+2,2,'response_item',p)),row(calls.length+2,3,'token_usage_record',{thread_id:'p4-counts',thread_token_usage:u(20)})]};}
const opts=window(at(1),at(3));
test('P4 COUNTS complete zero differs from incomplete source',()=>{
 const s=complete();available(f([s],opts).totals.counts.subagentCalls,0);
 s.records[1].ordinal=8;unavailable(f([s],opts).totals.counts.subagentCalls);
 const broken=complete();broken.readIssue={code:'source_read_failed',sourcePath:broken.sourcePath,message:'constructed missing tail',expected:false};unavailable(f([broken],opts).totals.counts.subagentCalls);
});
test('P4 COUNTS spawn and followup deduplicate stable calls and exclude messaging',()=>{
 const s=complete([call('a'),call('b','followup_task'),call('c','send_message'),call('d','spawn_agent','other'),call('a')]);
 const r=f([s],opts);available(r.totals.counts.subagentCalls,2);available(r.totals.counts.turns,0);available(r.totals.counts.codexResponseItems,5);missing(r.totals.counts.dshSteps,'not_applicable');
 available(f([s,structuredClone(s)],opts).totals.counts.subagentCalls,2);
});
test('P4 COUNTS missing and conflicting stable IDs stay unavailable',()=>{
 unavailable(f([complete([call(undefined)])],opts).totals.counts.subagentCalls);
 unavailable(f([complete([call('a'),call('a','followup_task')])],opts).totals.counts.subagentCalls);
});
test('P4 COUNTS outside-window prior call does not count twice',()=>{
 const s=complete([call('a')]);s.records[2].timestamp=at(1);available(f([s],opts).totals.counts.subagentCalls,0);
});
}

// P4 exact CLI proof-context assertions, not applied; built-in constructed fixtures only.
for(const variant of ['valid','missing parent','wrong parent id','parent gap','wrong spawn','failed parent copy','conflicting parent copy','cycle','damaged unrelated sibling','explicit parent and child'])test('P4 PROOF CLI '+variant,t=>{
 const root=scratch(t),leaf=join(root,'sessions','2026','10','18');mkdirSync(leaf,{recursive:true});
 const parent='01a14c6d-0000-7000-8000-000000000001',child='01a14c6e-0000-7000-8000-000000000002',sibling='01a14c6f-0000-7000-8000-000000000003';
 const at=n=>'2026-10-18T00:00:0'+n+'.000Z',u=n=>({input_tokens:n,output_tokens:n,cached_input_tokens:n,cache_write_input_tokens:0,reasoning_output_tokens:n});
 const row=(ordinal,n,type,payload)=>({ordinal,timestamp:at(n),type,payload});
 const pr=[row(0,0,'session_meta',{id:parent,history_mode:'paginated',cli_version:'0.164.0-alpha.11.1',source:'vscode'}),row(1,1,'token_usage_record',{thread_id:parent,thread_token_usage:u(10)}),row(2,2,'response_item',{type:'function_call',namespace:'collaboration',name:'spawn_agent',call_id:'proof-spawn',arguments:'{"fork_turns":"none"}'}),row(3,2,'event_msg',{type:'item_completed',item:{type:'SubAgentActivity',kind:'started',id:'proof-spawn',agent_thread_id:child,agent_path:'/root/proof'}}),row(4,6,'token_usage_record',{thread_id:parent,thread_token_usage:u(22)})];
 const cr=[row(0,3,'session_meta',{id:child,parent_thread_id:parent,history_mode:'paginated',cli_version:'0.164.0-alpha.11.1',source:{subagent:{thread_spawn:{parent_thread_id:parent,agent_path:'/root/proof'}}}}),row(1,3,'event_msg',{type:'task_started',turn_id:'child-turn'}),row(2,4,'token_usage_record',{thread_id:child,thread_token_usage:u(7)}),row(3,5,'token_usage_record',{thread_id:child,thread_token_usage:u(11)})];
 if(variant==='wrong parent id')pr[0].payload.id='other';
 if(variant==='parent gap')pr[2].ordinal=8;
 if(variant==='wrong spawn')pr[2].payload.arguments='{"fork_turns":"all"}';
 if(variant==='cycle'){pr[0].payload.parent_thread_id=child;pr[0].payload.source={subagent:{thread_spawn:{parent_thread_id:child,agent_path:'/root/cycle'}}};}
 if(variant==='damaged unrelated sibling'){pr.splice(4,0,row(4,3,'event_msg',{type:'item_completed',item:{type:'SubAgentActivity',kind:'started',id:'sibling-spawn',agent_thread_id:sibling,agent_path:'/root/sibling'}}));pr.at(-1).ordinal=5;writeFileSync(join(leaf,'rollout-broken-'+sibling+'.jsonl'),'{not-json}\n');}
 const parentPath=join(leaf,'rollout-parent-'+parent+'.jsonl');if(variant!=='missing parent')put(leaf,'rollout-parent-'+parent+'.jsonl',pr);
 if(variant==='failed parent copy')writeFileSync(join(leaf,'rollout-bad-copy-'+parent+'.jsonl'),'{not-json}\n');
 if(variant==='conflicting parent copy'){const copy=structuredClone(pr);copy[2].payload.arguments='{"fork_turns":"all"}';put(leaf,'rollout-conflicting-'+parent+'.jsonl',copy);}
 const childPath=put(leaf,'rollout-child-'+child+'.jsonl',cr);
 const args=['--session='+childPath,'--from='+at(2),'--until='+at(6)];if(variant==='explicit parent and child')args.push('--session='+parentPath);
 const r=run(args,{env:{CODEX_HOME:root}});assert.notEqual(r.status,2,r.stderr);assert.equal(r.signal,null);
 const detail=r.stdout.split('\n').find(line=>line.startsWith('会话明细：'));assert.ok(detail,r.stdout+r.stderr);const sessions=JSON.parse(detail.slice('会话明细：'.length));
 const good=['valid','damaged unrelated sibling','explicit parent and child'].includes(variant);
 assert.equal(sessions.length,variant==='explicit parent and child'?2:1);assert.ok(sessions.some(s=>s.sessionId===child));
 if(good){
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout,/^wallMs \(ms\): 4000$/m);assert.match(r.stdout,new RegExp('^inputTokens \\(token\\): '+(variant==='explicit parent and child'?23:11)+'$','m'));assert.match(r.stdout,new RegExp('^outputTokens \\(token\\): '+(variant==='explicit parent and child'?23:11)+'$','m'));assert.match(r.stdout,/^codexResponseItems \(次\): 0$/m);assert.match(r.stdout,/^subagentCalls \(次\): 0$/m);
  if(variant!=='explicit parent and child'){assert.deepEqual(sessions.map(s=>s.sessionId),[child]);assert.ok(r.stdout.includes(parentPath));assert.match(r.stdout,/birth_proof_source/);}
 }else{assert.equal(r.status,1,r.stdout+r.stderr);assert.equal(sessions[0].usage.inputTokens.status,'unavailable');assert.match(r.stdout,/^inputTokens \(token\): unavailable:/m);}
});
