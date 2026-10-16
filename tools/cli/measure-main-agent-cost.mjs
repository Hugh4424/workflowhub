#!/usr/bin/env node
/**
 * N1 explicit measurement, owner P1/T001; P2 consumes measureSessions.
 * Adopts addyosmani/agent-skills aeac41d4d005999432bb7312f7ff06383a91d59d:
 * skills/observability-and-instrumentation/SKILL.md (questions + numeric self-check),
 * skills/performance-optimization/SKILL.md (repeatable inputs; no benefit verdict).
 * Adopts backnotprop/pstack package f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8:
 * skills/principle-explain-the-number/SKILL.md (scope and missing-data explanations).
 * Local differences: raw quantities only, no telemetry platform, profiler, score,
 * fixed question count or benefit claim. Verification: frozen COST contract tests,
 * independent full output/source readback; P2 owns retained ledger attempts.
 * Fixed source hashes and MIT notices: THIRD_PARTY_NOTICES.md, skills/catalog.yaml.
 */
import { closeSync, constants, existsSync, fstatSync, lstatSync, openSync, readSync, readdirSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, parse, resolve, sep } from 'node:path';
import { resolveCanonicalTaskPath } from '../../runtime/task/load-config.mjs';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { readTaskFacts } from '../../runtime/task/task-store.mjs';
import { materialFilesForCohort } from '../../runtime/task/material-workspace.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const usageKeys = ['inputTokens','outputTokens','cacheReadTokens','cacheWriteTokens','reasoningTokens'];
const countKeys = ['dshSteps','codexResponseItems','turns','toolCalls','subagentCalls','commandCalls'];
const nativeKeys = ['input_tokens','output_tokens','cached_input_tokens','cache_write_input_tokens','reasoning_output_tokens'];
const available = value => ({status:'available',value});
const missing = reason => ({status:'not_reported',reason});
const unavailable = reason => ({status:'unavailable',reason});
const validNumber = value => Number.isSafeInteger(value) && value >= 0 && !Object.is(value,-0);
const validCodexTurnId = value => typeof value==='string' && value.trim().length>0;
const canonical = value => JSON.stringify(sort(value));
function sort(value) { if(Array.isArray(value))return value.map(sort);if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));return value; }
const hash = value => createHash('sha256').update(value).digest('hex');
const recordTime = r => typeof r?.time==='number' ? r.time : typeof r?.timestamp==='string' ? Date.parse(r.timestamp) : NaN;
function date(value) { if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)||!Number.isFinite(Date.parse(value)))throw new TypeError('invalid ISO timestamp');return Date.parse(value); }
const iso = time => Number.isFinite(time) ? new Date(time).toISOString() : null;
const eventId = r => r.type==='assistant/message' ? r.data?.message?.id??null : r.data?.id??r.data?.callId??r.payload?.response_id??r.payload?.item?.id??(r.type==='response_item'?r.payload?.id:null)??null;
function union(intervals) { const sorted=intervals.filter(([a,b])=>b>=a).sort((a,b)=>a[0]-b[0]);let sum=0,end=-Infinity;for(const [a,b] of sorted){sum+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return sum; }
function metricSum(metrics) { if(!metrics.length)return unavailable('no_sources');if(metrics.some(x=>x.status==='unavailable'))return unavailable('incomplete_sources');const xs=metrics.filter(x=>x.status==='available');if(!xs.length)return missing(metrics[0].reason);if(metrics.some(x=>x.status==='not_reported'&&x.reason!=='not_applicable'))return unavailable('incomplete_sources');const value=xs.reduce((n,x)=>n+x.value,0);return validNumber(value)?available(value):unavailable('unsafe_sum'); }
function sourceDefaults() { return {hostInjectedBytes:{metric:missing('no_authoritative_host_injection_source'),refs:[],scope:'host injection',unit:'byte'},reviewProviderUsage:{metric:missing('task_not_supplied'),refs:[],scope:'current stage review',unit:'provider original'},materialBytes:{metric:missing('task_not_supplied'),refs:[],scope:'current task materials',unit:'byte'}}; }

/** Pure transformation of explicitly loaded, immutable source records. */
export function measureSessions(sources, options={}) {
 if(!Array.isArray(sources)||!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('invalid measurement input');
 for(const source of sources)if(!source||typeof source.sourcePath!=='string'||!isAbsolute(source.sourcePath)||!Array.isArray(source.records)||source.records.some(r=>!r||typeof r!=='object'||Array.isArray(r)))throw new TypeError('invalid LoadedSource');
 const explicit=Object.hasOwn(options,'window'),w=options.window;
 if(explicit&&(!w||typeof w!=='object'||typeof w.includeFrom!=='boolean'||!Object.hasOwn(w,'from')||!Object.hasOwn(w,'until')))throw new TypeError('invalid window');
 const from=explicit?(w.from===null?NaN:date(w.from)):NaN,until=explicit?(w.until===null?NaN:date(w.until)):NaN;
 if(from>until)throw new TypeError('reversed window');
 if(w?.previousBoundaries!==undefined&&!Array.isArray(w.previousBoundaries))throw new TypeError('invalid previous boundaries');
 const issues=[],sessions=[],allIntervals=[],effectiveTimes=[];let activityFailed=false;
 const issue=(code,path,message,expected=false,metric)=>issues.push({code,sourcePath:path,message,expected,...(metric?{metric}:{})});
 const groups=new Map();
 for(const source of sources){const header=source.records[0],id=header?.type==='session'?header.id:header?.type==='session_meta'?header.payload?.id:null;const key=id?header.type+':'+id:source.sourcePath;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(source);}
 for(const group of groups.values()){
  const refs=[...new Set(group.map(s=>s.sourcePath))],path=refs[0],header=group[0].records[0],dsh=header?.type==='session',codex=header?.type==='session_meta',family=dsh?'dsh':'codex',id=dsh?header.id:header?.payload?.id;
  let invalid=false;const bad=(code,message,metric)=>{invalid=true;issue(code,path,message,false,metric);};
  if(!id||(!dsh&&!codex)||(dsh&&![0,3,4].includes(header.version)))bad('unknown_format','missing identity or unsupported generation');
  const version=dsh?header?.version:null,key=dsh?'seq':'ordinal';
  const transport=r=>dsh&&['reasoning-chunks','text-chunks','tool-call-chunks'].includes(r.type)&&r.seq===undefined;
  const records=[],seen=new Map();
  for(const source of group){if(source.readIssue){issues.push({...source.readIssue});invalid=true;}for(const r of source.records){const identity=r===source.records[0]?'header':transport(r)?'transport:'+source.records.indexOf(r):r[key];const fingerprint=canonical(r);if(seen.has(identity)){if(seen.get(identity)!==fingerprint){bad('conflicting_event','same position has different content');records.push(r);}continue;}seen.set(identity,fingerprint);records.push(r);}}
  let last=-1;for(const r of records.slice(1).filter(r=>!transport(r))){if(!validNumber(r[key])||r[key]<=last)bad('invalid_position','positions must be unique and increasing');if(!validNumber(recordTime(r)))bad('invalid_event_time','formal event timestamp must be valid');last=r[key];}
  let seed=-Infinity,inheritedBoundaryIssue=null;if(dsh&&header?.isSeeded){const b=records.find(r=>r.type==='session/end-seed'&&r.data?.inherited===true);if(!b)bad('inherited_boundary_missing','seed prefix has no explicit boundary');else seed=b.seq;}
  if(codex){const boundary=codexHistoryBoundary(header);seed=boundary.seed;inheritedBoundaryIssue=boundary.issueCode;if(inheritedBoundaryIssue)bad(inheritedBoundaryIssue,'inherited history has no valid ordinal boundary');}
  const times=records.slice(1).filter(r=>r[key]>seed&&(!dsh||/^(turn|step|user|assistant|tool)\//.test(r.type))).map(recordTime).filter(Number.isFinite);
  effectiveTimes.push(...times);
  const lo=explicit?from:Math.min(...times),hi=explicit?until:Math.max(...times),windowValid=Number.isFinite(lo)&&Number.isFinite(hi)&&hi>=lo;
  if(!windowValid)bad('window_unavailable','task start or cutoff is unavailable');
  let consumed=[];for(const r of records){if(Number.isFinite(hi)&&recordTime(r)>hi)break;consumed.push(r);}
  const positioned=consumed.filter(r=>validNumber(r[key])&&r[key]>seed),lastRecord=positioned.at(-1);
  const previous=w?.previousBoundaries?.find(b=>b.sourcePath===path);let previousIndex=-1,boundaryInvalid=false;
  if(previous){previousIndex=records.findIndex(r=>r[key]===previous.lastPosition?.[key]);const r=records[previousIndex];const expectedKind=dsh?'dsh_seq':'codex_ordinal';if(previous.observedAt!==iso(lo)||previous.sessionId!==id||previous.family!==family||!previous.lastPosition||previous.lastPosition.kind!==expectedKind||previousIndex<0||eventId(r)!==previous.lastPosition.eventId||hash(canonical(r))!==previous.lastPosition.recordSha256||hash(records.slice(0,previousIndex+1).map(r=>canonical(r)+'\n').join(''))!==previous.prefixSha256){boundaryInvalid=true;bad('previous_boundary_mismatch','previous source identity, position or prefix changed');}}
  const selected=r=>{const t=recordTime(r);if(!windowValid||r[key]<=seed)return false;const index=records.indexOf(r);if(previous){if(index<=previousIndex)return false;if(t<lo){boundaryInvalid=true;bad('late_event_before_window','newly observed event precedes prior cutoff');return false;}return t<=hi;}return (w?.includeFrom||!explicit?t>=lo:t>lo)&&t<=hi;};
  const chosen=consumed.filter(selected);
  if(w?.previousBoundaries&&!previous&&!w.includeFrom&&consumed.some(r=>r[key]>seed&&recordTime(r)===lo)) {boundaryInvalid=true;bad('boundary_position_unavailable','new source has no observed position at shared timestamp');}
  const usage={},counts={},cumulativePoints=[],snapshots=[];let intervals=[],activeInvalid=false;
  if(dsh){
   // Identity consistency spans the observed prefix; only its first occurrence
   // belongs to the selected slice. A new position is not a new request.
   const messages=new Map(),messageHistory=new Map(),chosenSet=new Set(chosen);
   for(const r of consumed.filter(r=>r.seq>seed&&r.type==='assistant/message')) {
    const messageId=r.data?.message?.id;
    if(typeof messageId!=='string'||!messageId) {
     bad('missing_message_id','formal usage has no stable message id');
     for(const k of usageKeys)usage[k]=unavailable('missing_message_id');
     continue;
    }
    const value=r.data?.usage;
    if(messageHistory.has(messageId)) {
     if(canonical(messageHistory.get(messageId))!==canonical(value)) {
      bad('conflicting_usage','same message id has conflicting usage');
      for(const k of usageKeys)usage[k]=unavailable('conflicting_usage');
     }
     continue;
    }
    messageHistory.set(messageId,value);
    if(chosenSet.has(r))messages.set(messageId,value);
   }
   if(!records.some(r=>r.type==='assistant/message')){bad('no_formal_usage','source has no formal usage events');for(const k of usageKeys)usage[k]=unavailable('no_formal_usage');}
   for(const [index,k] of usageKeys.entries()) {
    if(usage[k])continue;
    const values=[...messages.values()].map(u=>u?.[k]);
    const reported=values.filter(v=>v!==undefined);
    if(reported.some(v=>!validNumber(v))||(index<3&&reported.length!==values.length)) {
     usage[k]=unavailable('invalid_or_missing_field');
     bad('invalid_usage','required or reported token field invalid',k);
    } else if(index>=3&&reported.length!==values.length) {
     usage[k]=missing('field_not_reported');
    } else {
     const sum=values.reduce((a,b)=>a+b,0);
     usage[k]=validNumber(sum)?available(sum):unavailable('unsafe_sum');
     if(!validNumber(sum))bad('unsafe_sum','token sum is unsafe',k);
    }
   }
   const countRows=new Map();
   const uniqueCount=(type,identity)=>{
    const seen=new Map(),selectedRows=[];let conflict=false;
    for(const r of consumed.filter(r=>r.seq>seed&&r.type===type)) {
     const id=identity(r);
     if(id===undefined||id===null){conflict=true;continue;}
     const value=canonical(r.data);
     if(seen.has(id)){if(seen.get(id)!==value)conflict=true;continue;}
     seen.set(id,value);
     if(chosenSet.has(r))selectedRows.push(r);
    }
    countRows.set(type,selectedRows);
    if(conflict){bad('conflicting_count','count identity conflict');return unavailable('conflicting_count');}
    return available(selectedRows.length);
   };
   counts.dshSteps=uniqueCount('step/start',r=>validNumber(r.data?.turn)&&validNumber(r.data?.step)?r.data.turn+':'+r.data.step:undefined);counts.turns=uniqueCount('turn/start',r=>validNumber(r.data?.turn)?r.data.turn:undefined);counts.codexResponseItems=missing('not_applicable');
   counts.toolCalls=uniqueCount('tool/call',r=>r.data?.callId);for(const [k,names] of [['subagentCalls',['subagent']],['commandCalls',['bash','pwsh']]])counts[k]=counts.toolCalls.status==='available'?available((countRows.get('tool/call')??[]).filter(r=>names.includes(r.data?.name)).length):unavailable('conflicting_count');
  }else{
   counts.dshSteps=missing('not_applicable');counts.codexResponseItems=available(chosen.filter(r=>r.type==='response_item').length);const turnContexts=chosen.filter(r=>r.type==='turn_context');if(turnContexts.some(r=>!validCodexTurnId(r.payload?.turn_id))){counts.turns=unavailable('invalid_turn_id');bad('invalid_turn_id','turn_context has no valid turn_id','turns');}else counts.turns=available(new Set(turnContexts.map(r=>r.payload.turn_id)).size);for(const k of ['toolCalls','subagentCalls','commandCalls'])counts[k]=missing('unsupported_in_this_task');
   const preferred=records.some(r=>r.type==='token_usage_record'),series=preferred?'token_usage_record.thread_token_usage':'event_msg.token_count.total_token_usage';
   const points=consumed.filter(r=>preferred?r.type==='token_usage_record':r.type==='event_msg'&&r.payload?.type==='token_count');
   const container=r=>preferred?r?.payload?.thread_token_usage:r?.payload?.info?.total_token_usage;
   const point=(r,value)=>({eventRef:path+'#ordinal='+r.ordinal,at:iso(recordTime(r)),value});
   for(const [i,k] of usageKeys.entries()){
    if(inheritedBoundaryIssue){usage[k]=unavailable('inherited_boundary_unavailable');cumulativePoints.push({sourceRef:path,threadId:id,series,metric:k,from:null,until:null});continue;}
    const relevant=points.filter(r=>r.ordinal>seed);let error=points.some(r=>preferred&&r.payload?.thread_id!==id);let prev=-1;for(const r of relevant){const n=container(r)?.[nativeKeys[i]];if(n===undefined&&i>=3)continue;if(!validNumber(n)||n<prev)error=true;else prev=n;}
    const end=relevant.at(-1),endValue=container(end)?.[nativeKeys[i]],saved=previous?.cumulative?.find(p=>p.metric===k);let start=null;
    if(saved){const original=points.find(r=>path+'#ordinal='+r.ordinal===saved.eventRef);if(saved.series!==series||!original||iso(recordTime(original))!==saved.at||container(original)?.[nativeKeys[i]]!==saved.value||records.indexOf(original)>previousIndex){boundaryInvalid=true;bad('previous_boundary_mismatch','previous cumulative observation changed');}else start={eventRef:saved.eventRef,at:saved.at,value:saved.value};}
    else{const base=points.filter(r=>previous||w?.previousBoundaries?recordTime(r)<lo:recordTime(r)<=lo).at(-1);if(base&&validNumber(container(base)?.[nativeKeys[i]]))start=point(base,container(base)[nativeKeys[i]]);else if(!header?.payload?.history_mode&&!header?.payload?.parent_thread_id&&!header?.payload?.source?.subagent&&seed===-Infinity&&!group.some(s=>s.readIssue)&&records.every((r,i)=>r.ordinal===i)&&!records.some(r=>r.payload?.type==='compaction')&&records.filter(r=>recordTime(r)<=lo).every(r=>r.type==='session_meta'||r.type==='turn_context'||r.type==='event_msg'&&(r.payload?.type==='task_started'||recordTime(r)===lo&&r.payload?.type==='item_completed'&&r.payload?.item?.type==='UserMessage')))start={eventRef:path+'#ordinal=0',at:iso(recordTime(header)),value:0};}
    const endPoint=end&&validNumber(endValue)?point(end,endValue):null;cumulativePoints.push({sourceRef:path,threadId:id,series,metric:k,from:start,until:endPoint});
    if(endPoint)snapshots.push({metric:k,series,...endPoint});
    if(endValue===undefined&&i>=3){usage[k]=missing('field_not_reported');continue;}
    if(error||!start||!endPoint||endPoint.value<start.value){usage[k]=unavailable('cumulative_baseline_or_field_invalid');bad('invalid_cumulative','cumulative baseline, identity or field unavailable',k);}else usage[k]=available(endPoint.value-start.value);
   }
  }
  const starts=new Map(),turnHistory=new Map();let invalidTurnId=false;for(const r of consumed.filter(r=>r[key]>seed)){const start=dsh?r.type==='turn/start':r.type==='event_msg'&&r.payload?.type==='task_started',end=dsh?r.type==='turn/end':r.type==='event_msg'&&r.payload?.type==='task_complete';if(!start&&!end)continue;const turn=dsh?r.data?.turn:r.payload?.turn_id,validTurn=dsh?validNumber(turn):validCodexTurnId(turn);if(!validTurn){invalidTurnId=true;activeInvalid=true;continue;}const t=recordTime(r),identity=(start?'start:':'end:')+turn,body=canonical(dsh?r.data:r.payload);if(turnHistory.has(identity)){if(turnHistory.get(identity)!==body)activeInvalid=true;continue;}turnHistory.set(identity,body);if(start){if(starts.has(turn))activeInvalid=true;starts.set(turn,t);}else{if(!starts.has(turn)){activeInvalid=true;continue;}const a=starts.get(turn);if(t<a)activeInvalid=true;else if(windowValid&&Math.min(t,hi)>=Math.max(a,lo))intervals.push([Math.max(a,lo),Math.min(t,hi)]);starts.delete(turn);}}
  for(const a of starts.values())if(windowValid&&hi>=a){intervals.push([Math.max(a,lo),hi]);issue('open_turn',path,'open turn clipped at cutoff',true);}
  const declaredChildren=consumed.filter(record=>record[key]>seed).flatMap(record=>declaredChildIds(record,dsh));
  const missingChildren=[...new Set(declaredChildren)].filter(child=>!sources.some(s=>{const h=s.records[0];return dsh?h?.id===child&&h.parentSession===id:h?.payload?.id===child&&h.payload.parent_thread_id===id;}));for(const child of missingChildren)bad('missing_child','declared child source unavailable: '+child);
  if(invalid||boundaryInvalid){for(const k of usageKeys)if(usage[k]?.status==='available'&&(boundaryInvalid||issues.some(x=>x.sourcePath===path&&['unknown_format','inherited_boundary_missing','conflicting_event','invalid_position','invalid_event_time'].includes(x.code))))usage[k]=unavailable('source_integrity_invalid');}
  const unknownFormat=issues.some(x=>x.sourcePath===path&&x.code==='unknown_format');
  if(unknownFormat||group.some(source=>source.readIssue)||issues.some(x=>x.sourcePath===path&&['inherited_boundary_missing','inherited_boundary_invalid','conflicting_event','invalid_position','invalid_event_time'].includes(x.code)))for(const k of countKeys)if(unknownFormat||counts[k]?.status==='available')counts[k]=unavailable(inheritedBoundaryIssue?'inherited_boundary_unavailable':'source_integrity_invalid');
  if(!windowValid){for(const k of usageKeys)usage[k]=unavailable('window_unavailable');for(const k of countKeys)if(counts[k]?.status==='available')counts[k]=unavailable('window_unavailable');}
  if(!times.length)for(const k of usageKeys)usage[k]=unavailable('no_execution_events');
  const span=Number.isFinite(hi)&&times.length?Math.max(0,Math.min(hi,Math.max(...times))-Math.max(Number.isFinite(lo)?lo:Math.min(...times),Math.min(...times))):NaN;
  const sourceActivityInvalid=issues.some(x=>x.sourcePath===path&&['unknown_format','inherited_boundary_missing','inherited_boundary_invalid','invalid_turn_id','conflicting_event','invalid_position','invalid_event_time','source_read_failed','truncated_tail'].includes(x.code));
  const active=windowValid&&!activeInvalid&&!boundaryInvalid&&!sourceActivityInvalid?available(union(intervals)):unavailable('activity_boundary_invalid');if(active.status!=='available')activityFailed=true;
  if(activeInvalid)bad('invalid_turn_interval','turn boundary has no matching start or conflicts');if(invalidTurnId)bad('invalid_turn_id','turn boundary has no valid association id');
  const position=lastRecord?{kind:dsh?'dsh_seq':'codex_ordinal',[key]:lastRecord[key],eventId:eventId(lastRecord),recordSha256:hash(canonical(lastRecord))}:null;
  const boundary={sourcePath:path,sessionId:id??'unknown',family,observedAt:iso(hi),lastPosition:position,prefixSha256:position?hash(consumed.slice(0,consumed.indexOf(lastRecord)+1).map(r=>canonical(r)+'\n').join('')):null,cumulative:snapshots};
  sessions.push({sessionId:id??'unknown',parentSessionId:dsh?header?.parentSession??null:header?.payload?.parent_thread_id??null,family,version,sourceRefs:refs,spanMs:inheritedBoundaryIssue?unavailable('inherited_boundary_unavailable'):validNumber(span)?available(span):unavailable('window_unavailable'),activeMs:active,usage,counts,observedBoundaries:[boundary],cumulativePoints,missingChildren});
  allIntervals.push(...intervals);
 }
 const globalFrom=explicit?from:Math.min(...effectiveTimes),globalUntil=explicit?until:Math.max(...effectiveTimes),wall=Number.isFinite(globalFrom)&&Number.isFinite(globalUntil)?globalUntil-globalFrom:NaN;
 const missingDescendants=sessions.some(s=>s.missingChildren.length);
 const totals={wallMs:validNumber(wall)?available(wall):unavailable('window_unavailable'),sessionSpanSumMs:metricSum(sessions.map(s=>s.spanMs)),activeUnionMs:sessions.length&&!activityFailed?available(union(allIntervals)):unavailable('activity_boundary_invalid'),waitingMs:unavailable('window_unavailable'),usage:{},counts:{}};
 if(totals.wallMs.status==='available'&&totals.activeUnionMs.status==='available')totals.waitingMs=available(wall-totals.activeUnionMs.value);
 for(const k of usageKeys)totals.usage[k]=metricSum(sessions.map(s=>s.usage[k]??unavailable('unknown_format')));for(const k of countKeys)totals.counts[k]=metricSum(sessions.map(s=>s.counts[k]??unavailable('unknown_format')));
 if(missingDescendants||sources.some(s=>s.readIssue)){const reason=missingDescendants?'missing_child':'source_read_incomplete';for(const k of usageKeys)totals.usage[k]=unavailable(reason);for(const k of countKeys)if(totals.counts[k].status==='available')totals.counts[k]=unavailable(reason);totals.activeUnionMs=unavailable(reason);totals.waitingMs=unavailable(reason);totals.sessionSpanSumMs=unavailable(reason);}
 if(!sources.length)issue('no_sources',undefined,'zero sources is not a successful measurement');
 return {status:issues.some(x=>!x.expected)?'incomplete':'available',window:{from:iso(globalFrom),until:iso(globalUntil),includeFrom:explicit?w.includeFrom:true,startRef:w?.startRef??null,waitingIncluded:true},sessions,totals,sources:options.sourceFacts?structuredClone(options.sourceFacts):sourceDefaults(),issues};
}

// Read only the opened byte bound and revalidate the named source and ancestry.
function safeReadBytes(path) {
 if(!isAbsolute(path)||path.split(/[\\/]/).includes('..'))throw new Error('source path traversal is invalid');
 let cursor=parse(path).root;
 const ancestry=[];
 for(const part of path.slice(cursor.length).split(sep).filter(Boolean).slice(0,-1)) {
  cursor=join(cursor,part);const stat=lstatSync(cursor),real=realpathSync(cursor);
  const alias=process.platform==='darwin'&&((cursor==='/tmp'&&real==='/private/tmp')||(cursor==='/var'&&real==='/private/var'));
  if(stat.isSymbolicLink()&&!alias||!stat.isDirectory()&&!alias)throw new Error('unsafe source ancestor');
  ancestry.push({path:cursor,dev:stat.dev,ino:stat.ino,real});
 }
 const before=lstatSync(path);
 if(!before.isFile()||before.isSymbolicLink())throw new Error('source must be regular non-symlink file');
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try {
  const opened=fstatSync(fd);
  if(opened.dev!==before.dev||opened.ino!==before.ino)throw new Error('source replaced during open');
  const bytes=Buffer.alloc(opened.size);let offset=0;
  while(offset<bytes.length){const read=readSync(fd,bytes,offset,bytes.length-offset,offset);if(!read)throw new Error('source truncated during read');offset+=read;}
  const after=fstatSync(fd),named=lstatSync(path);
  if(after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs||named.ino!==opened.ino||named.dev!==opened.dev||named.isSymbolicLink())throw new Error('source changed while reading');
  for(const old of ancestry){const current=lstatSync(old.path);if(current.dev!==old.dev||current.ino!==old.ino||realpathSync(old.path)!==old.real)throw new Error('source ancestor replaced');}
  return bytes;
 } finally {closeSync(fd);}
}
function declaredChildIds(record,dsh) {
 if(dsh)return record.type==='subagent/catalog'&&typeof record.data?.childId==='string'?[record.data.childId]:[];
 if(record.type!=='event_msg'||record.payload?.type!=='item_completed')return [];
 const item=record.payload.item;
 const ids=item?.type==='SubAgentActivity'&&item.kind==='started'?[item.agent_thread_id]
  :item?.type==='CollabAgentToolCall'&&item.tool==='spawn_agent'&&Array.isArray(item.receiver_thread_ids)?item.receiver_thread_ids:[];
 return ids.filter(id=>typeof id==='string');
}
function childIds(source, cutoff=Infinity) {
 const dsh=source.records[0]?.type==='session';
 const boundary=dsh?null:codexHistoryBoundary(source.records[0]);
 if(boundary?.issueCode)return [];
 const prefix=[];for(const record of source.records){if(recordTime(record)>cutoff)break;prefix.push(record);}
 return [...new Set(prefix.filter(record=>dsh||record.ordinal>boundary.seed).flatMap(record=>declaredChildIds(record,dsh)))];
}
function codexHistoryBoundary(header) {
 const payload=header?.type==='session_meta'&&header.payload&&typeof header.payload==='object'&&!Array.isArray(header.payload)?header.payload:{};
 const seedPresent=Object.hasOwn(payload,'subagent_history_start_ordinal');
 const parentHint=Object.hasOwn(payload,'parent_thread_id')&&payload.parent_thread_id!==undefined&&payload.parent_thread_id!==null&&payload.parent_thread_id!=='';
 const subagentHint=payload.source?.subagent!==undefined&&payload.source?.subagent!==null&&payload.source?.subagent!==false;
 const inherited=payload.history_mode==='paginated'||parentHint||subagentHint||seedPresent;
 if(!inherited)return {seed:-Infinity};
 if(validNumber(payload.subagent_history_start_ordinal))return {seed:payload.subagent_history_start_ordinal};
 return {seed:Infinity,issueCode:seedPresent?'inherited_boundary_invalid':'inherited_boundary_missing'};
}
function encodeSegment(value) {
 if(value==='.'||value==='..')return value.replaceAll('.','~002E');
 let result='';for(let i=0;i<value.length;i++){const c=value[i];result+=/[A-Za-z0-9._-]/.test(c)?c:'~'+value.charCodeAt(i).toString(16).toUpperCase().padStart(4,'0');}return result;
}
function dshProjectKey(cwd) {
 if(typeof cwd!=='string'||!isAbsolute(cwd))throw new Error('parent header.cwd must be an absolute project identity');
 const separated=cwd.replace(/[\\/:]+/g,'-');
 let encoded='';
 for(let index=0;index<separated.length;index++) {
  const char=separated[index];
  encoded+=/[A-Za-z0-9._-]/.test(char)?char:'~'+separated.charCodeAt(index).toString(16).toUpperCase().padStart(4,'0');
 }
 const body=encoded.replace(/^-+/,'')||'root';
 return '--'+body.slice(0,251)+'--';
}
async function explicitDescendants(initial, cutoff, load) {
 if(typeof load!=='function')throw new TypeError('explicit asynchronous source loader required');
 const sources=[...initial],visited=new Set();
 for(let i=0;i<sources.length;i++) {
  const parent=sources[i],header=parent.records[0],dsh=header?.type==='session',parentId=dsh?header.id:header?.payload?.id;
  if(!parentId||visited.has(parentId))continue;visited.add(parentId);
  for(const child of childIds(parent,cutoff)) {
   if(visited.has(child)||sources.some(s=>(dsh?s.records[0]?.id:s.records[0]?.payload?.id)===child))continue;
   let candidates=[];
   try {
    if(dsh) {
     const home=process.env.DSH_HOME||join(homedir(),'.dsh');
     if(!isAbsolute(home))throw new Error('DSH_HOME must be an absolute root');
     const directory=join(home,'sessions',dshProjectKey(header.cwd),encodeSegment(child));
     const names=readdirSync(directory).filter(n=>/^session(?:\.v\d+)?\.jsonl(?:\.zst(?:d)?)?$/.test(n));
     const generation=n=>Number(n.match(/\.v(\d+)\.jsonl/)?.[1]??0);
     const highest=Math.max(...names.map(generation));candidates=names.filter(n=>generation(n)===highest).map(n=>join(directory,n));
    } else {
     if(!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(child))continue;
     const parts=parent.sourcePath.split(sep),marker=parts.findLastIndex(p=>p==='sessions'||p==='archived_sessions');if(marker<0)continue;
     const root=parts.slice(0,marker).join(sep)||sep,millis=Number.parseInt(child.replaceAll('-','').slice(0,12),16);
     for(const delta of [-1,0,1]){const date=new Date(millis+delta*86400000).toISOString().slice(0,10).replaceAll('-',sep);for(const kind of ['sessions','archived_sessions']){const directory=join(root,kind,date);let names;try{names=readdirSync(directory);}catch(error){if(error.code==='ENOENT')continue;throw error;}candidates.push(...names.filter(n=>n.includes(child)&&/\.jsonl(?:\.zst(?:d)?)?$/.test(n)).map(n=>join(directory,n)));}}
    }
   } catch(error) {if(error.code!=='ENOENT')parent.readIssue={code:'child_source_failed',sourcePath:parent.sourcePath,message:error.message,expected:false};}
   const loaded=await Promise.all(candidates.map(load)),valid=loaded.filter(s=>{const h=s.records[0];return dsh?h?.id===child&&h.parentSession===parentId:h?.payload?.id===child&&h.payload.parent_thread_id===parentId;});
   if(valid.length){const selected=valid.find(source=>!source.readIssue)??valid[0],broken=valid.filter(source=>source.readIssue);const first=canonical(selected.records);if(broken.length)selected.readIssue={code:'source_read_failed',sourcePath:broken[0].sourcePath,message:'child session copies include incomplete source: '+broken.map(source=>source.sourcePath+': '+source.readIssue.message).join('; '),expected:false};else if(valid.some(source=>canonical(source.records)!==first))selected.readIssue={code:'conflicting_child_source',sourcePath:selected.sourcePath,message:'same child identity has conflicting source copies',expected:false};sources.push(selected);}
  }
 }
 return sources;
}
function parseArgs(argv){const args={session:[]};const single=new Set(['from','until','project','task','stage','start-ref']);for(const arg of argv){if(arg==='--record'){if(args.record)throw new Error('duplicate record');args.record=true;continue;}const match=arg.match(/^--([^=]+)=(.*)$/s);if(!match||(!single.has(match[1])&&match[1]!=='session'))throw new Error('unknown argument '+arg);const [,key,value]=match;if(!value)throw new Error('empty argument '+key);if(key==='session'){if(!isAbsolute(value))throw new Error('session must be absolute file');args.session.push(value);}else{if(Object.hasOwn(args,key))throw new Error('duplicate '+key);args[key]=value;}}
 if(Boolean(args.project)!==Boolean(args.task))throw new Error('project/task must be paired');if(args.stage&&!['make-decision','build-plan','build-code','verify-code'].includes(args.stage))throw new Error('invalid stage');for(const key of ['from','until'])if(args[key])date(args[key]);if(args.from&&args.until&&date(args.from)>date(args.until))throw new Error('reversed window');if(args['start-ref'])parseSelector(args['start-ref']);if(args.record&&(!args.project||!args.stage||args.from||args.until))throw new Error('record requires identity/stage and disallows explicit window');return args;
}
function taskSourceFacts(args, result) {
 const facts=sourceDefaults();
 if(!args.task)return facts;
 const taskPath=resolveCanonicalTaskPath({project:args.project,task:args.task}).taskPath;
 const task=openTask(taskPath,{projectName:args.project,taskId:args.task});
 const fail=(code,message)=>result.issues.push({code,message,expected:false});
 try {
  const root=authenticatedWorkspace(task);
  const materialRoot=join(root,'specs',args.task),map={},sampled=new Map();
  if(args.stage!=='make-decision'){const path=join(materialRoot,'phases/index.md'),bytes=safeReadBytes(path);sampled.set(path,bytes);map['phases/index.md']=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
  const names=materialFilesForCohort(task.manifest.activation_cohort,map,{stage:args.stage});
  const details=names.map(name=>{const path=join(materialRoot,name),stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('invalid material file '+name);const bytes=sampled.get(path)??safeReadBytes(path);return {path,byteCount:bytes.length,sha256:hash(bytes)};});
  facts.materialBytes={metric:available(details.reduce((n,x)=>n+x.byteCount,0)),refs:details.map(x=>x.path),scope:'authenticated checkout material sample: '+JSON.stringify(details),unit:'byte'};
 } catch(error){facts.materialBytes={metric:unavailable('material_source_unavailable'),refs:[],scope:'current task materials',unit:'byte'};fail('material_source_unavailable',error.message);}
 facts.reviewProviderUsage={metric:missing('stage_not_supplied'),refs:[],scope:'current stage review',unit:'provider original'};
 if(!args.stage)return facts;
 try {
  const rows=readTaskFacts(taskPath).filter(r=>r.record_kind==='stage'&&r.stage===args.stage);
  if(!rows.length){facts.reviewProviderUsage.metric=missing('no_stage_fact');return facts;}
  if(rows.length!==1)throw new Error('review_source_ambiguity: multiple stage rows');
  const wrapped=rows[0].review_result_ref;
  if(wrapped===null||wrapped===undefined){facts.reviewProviderUsage.metric=missing('review_not_reported');return facts;}
  const wrapper=typeof wrapped==='object'&&!Array.isArray(wrapped),ref=wrapper?wrapped.value:wrapped;
  if(wrapper&&ref===null&&typeof wrapped.reason==='string'&&wrapped.reason.trim()){facts.reviewProviderUsage.metric=missing('review_not_reported');return facts;}
  if(typeof ref!=='string'||!ref.trim()||ref!==ref.trim())throw new Error('review_source_ambiguity: no unique review ref');
  const report=JSON.parse(task.readRecord(ref));facts.reviewProviderUsage.refs=[ref];
  const completed=date(report.completed_at),from=result.window.from?date(result.window.from):NaN,until=result.window.until?date(result.window.until):NaN;
  if(!Number.isFinite(from)||!Number.isFinite(until))throw new Error('review window unavailable');
  if(completed<from||completed>until){facts.reviewProviderUsage.metric=missing('no_new_report_in_window');return facts;}
  const providers=report.review_facts?.providers;if(!Array.isArray(providers))throw new Error('review providers unavailable');
  const values=[];for(const p of providers){if(p.usage_status!=='reported'){values.push({provider:p.provider,usage_status:p.usage_status??'not_reported',ref});continue;}if(!p.usage||typeof p.usage!=='object'||Array.isArray(p.usage))throw new Error('reported usage invalid');const usage={};for(const key of ['input','output','cacheRead','cacheWrite','reasoning','totalTokens','prompt_tokens','completion_tokens','input_tokens','output_tokens','cached_input_tokens','cache_read_input_tokens','cache_creation_input_tokens','reasoning_output_tokens'])if(Object.hasOwn(p.usage,key)){if(!validNumber(p.usage[key]))throw new Error('reported quantity invalid');usage[key]=p.usage[key];}const omitted=Object.keys(p.usage).filter(k=>!Object.hasOwn(usage,k));if(omitted.length)result.issues.push({code:'review_usage_fields_omitted',message:'unverified quantity or amount categories omitted; ref='+ref,expected:true});values.push({provider:p.provider,usage,usage_status:Object.keys(usage).length?'reported':'not_reported',ref});}
  facts.reviewProviderUsage.metric=values.some(x=>x.usage_status==='reported')?available(values):missing('quantities_not_reported');
 } catch(error){const reason=error.message.includes('review_source_ambiguity')?'review_source_ambiguity':'review_source_unavailable';facts.reviewProviderUsage.metric=unavailable(reason);fail(reason,error.message);}
 return facts;
}
function human(result){const render=m=>m.status==='available'?JSON.stringify(m.value):m.status+':'+m.reason;const lines=['N1 原始读数；不产 N10 检查器 / N11 总分。', '时间：这段多久、轮次内/等待各多久？等待计入任务墙钟。'];for(const k of ['wallMs','sessionSpanSumMs','activeUnionMs','waitingMs'])lines.push(k+' (ms): '+render(result.totals[k]));lines.push('token：上报哪些输入/输出/缓存量？');for(const [k,m]of Object.entries(result.totals.usage))lines.push(k+' (token): '+render(m));lines.push('步骤/轮次：源发生多少步骤或响应项、多少轮？');for(const k of ['dshSteps','codexResponseItems','turns'])lines.push(k+' (次): '+render(result.totals.counts[k]));lines.push('调用：发起多少子代理与命令工具调用？');for(const k of ['toolCalls','subagentCalls','commandCalls'])lines.push(k+' (次): '+render(result.totals.counts[k]));lines.push('三来源（各自口径，不能互替）：');for(const [k,fact]of Object.entries(result.sources))lines.push(k+' ['+fact.unit+']: '+render(fact.metric)+'; scope='+fact.scope+'; refs='+JSON.stringify(fact.refs));lines.push('会话明细：'+JSON.stringify(result.sessions),'缺报与错误：'+JSON.stringify({issues:result.issues,missing:Object.entries(result.totals.usage).concat(Object.entries(result.totals.counts)).filter(([,v])=>v.status!=='available')}));return lines.join('\n')+'\n';}

function authenticatedWorkspace(task) {
 const directory=path=>{const stat=lstatSync(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('unsafe checkout metadata directory');return realpathSync(path);};
 const text=path=>safeReadBytes(path).toString('utf8').trim();
 const common=root=>{
  const marker=join(root,'.git'),stat=lstatSync(marker);let gitdir;
  if(stat.isDirectory()&&!stat.isSymbolicLink())gitdir=directory(marker);
  else if(stat.isFile()&&!stat.isSymbolicLink()){const match=text(marker).match(/^gitdir: ([^\r\n]+)$/);if(!match)throw new Error('invalid checkout gitdir metadata');gitdir=directory(resolve(root,match[1]));}
  else throw new Error('unsafe checkout gitdir metadata');
  const head=text(join(gitdir,'HEAD'));if(!/^(?:ref: refs\/[^\s]+|[0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/.test(head))throw new Error('invalid checkout HEAD metadata');
  const commonPath=join(gitdir,'commondir');let result=gitdir;
  try{const value=text(commonPath);if(!value||/[\r\n]/.test(value))throw new Error('invalid checkout commondir metadata');result=directory(resolve(gitdir,value));}catch(error){if(error.code!=='ENOENT')throw error;}
  directory(join(result,'objects'));directory(join(result,'refs'));return result;
 };
 let root=realpathSync(process.cwd());
 while(true){try{lstatSync(join(root,'.git'));break;}catch(error){if(error.code!=='ENOENT')throw error;const parent=dirname(root);if(parent===root)throw new Error('authenticated checkout is unavailable');root=parent;}}
 if(task.manifest.workspace_root&&realpathSync(task.manifest.workspace_root)!==root)throw new Error('task workspace identity mismatch');
 if(common(root)!==common(realpathSync(task.manifest.target_repo_root)))throw new Error('task checkout belongs to another repository');
 return root;
}
function taskFor(args) {
 const taskPath=resolveCanonicalTaskPath({project:args.project,task:args.task}).taskPath;
 return openTask(taskPath,{projectName:args.project,taskId:args.task});
}
function parseSelector(value) {
 const match=typeof value==='string'&&value.match(/^(.*)#(seq|item_id)=(.*)$/s);
 if(!match||!isAbsolute(match[1]))throw new TypeError('invalid start selector');
 if(match[2]==='seq') {
  if(!/^\d+$/.test(match[3])||!validNumber(Number(match[3])))throw new TypeError('invalid seq selector');
  return {sourcePath:match[1],kind:'seq',value:Number(match[3])};
 }
 let id;try{id=decodeURIComponent(match[3]);}catch{throw new TypeError('invalid encoded item_id');}
 if(!id||/[\x00-\x1f\x7f/\\]/.test(id))throw new TypeError('invalid item_id selector');
 return {sourcePath:match[1],kind:'item_id',value:id};
}
function startFrom(ref,sources) {
 if(!ref)return {from:null,issue:{code:'task_start_unavailable',message:'first record has no authoritative start-ref',expected:false}};
 const selector=parseSelector(ref),source=sources.find(s=>s.sourcePath===selector.sourcePath);
 const matches=(source?.records??[]).filter(r=>selector.kind==='seq'
  ?r.type==='user/message'&&r.seq===selector.value
  :r.type==='event_msg'&&r.payload?.type==='item_completed'&&r.payload?.item?.type==='UserMessage'&&r.payload.item.id===selector.value);
 if(matches.length!==1||!validNumber(recordTime(matches[0])))return {from:null,issue:{code:'task_start_unavailable',sourcePath:selector.sourcePath,message:'start-ref must match exactly one real user event',expected:false}};
 return {from:iso(recordTime(matches[0]))};
}
function decodeSource(sourcePath,bytes) {
 const records=[];
 try {
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(text&&!text.endsWith('\n'))throw new Error('truncated_tail: incomplete final line');
  for(const [index,line]of text.split('\n').entries()) {
   if(!line.trim())continue;
   let value;try{value=JSON.parse(line);}catch{throw new Error('invalid_json line '+(index+1));}
   if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('invalid source object line '+(index+1));
   records.push(value);
  }
  const h=records[0],match=sourcePath.match(/\.v(\d+)\.jsonl(?:\.zst(?:d)?)?$/);
  if(h?.type==='session'&&match&&Number(match[1])!==h.version)throw new Error('filename/header version mismatch');
  return {sourcePath,records};
 }catch(error){return {sourcePath,records,readIssue:{code:'source_read_failed',sourcePath,message:error.message,expected:false}};}
}
async function readSourceAsync(sourcePath,signal) {
 try {
  signal?.throwIfAborted();let bytes=safeReadBytes(sourcePath);
  if(/\.zst(?:d)?$/.test(sourcePath)) {
   bytes=await new Promise((resolve,reject)=>{
    const child=spawn('zstd',['-dc'],{stdio:['pipe','pipe','pipe'],signal});
    const chunks=[],errors=[];let size=0,settled=false;
    const fail=error=>{if(!settled){settled=true;reject(error);}};
    child.on('error',fail);child.stdin.on('error',error=>{if(error.code!=='EPIPE')fail(error);});
    child.stdout.on('data',chunk=>{size+=chunk.length;if(size>Math.max(bytes.length*100,64*1024*1024)){child.kill('SIGTERM');fail(new Error('decoded source exceeds bounded buffer'));}else chunks.push(chunk);});
    child.stderr.on('data',chunk=>errors.push(chunk));
    child.on('close',(code,killed)=>{if(settled)return;settled=true;if(code!==0)reject(new Error('invalid compressed source: '+Buffer.concat(errors).toString('utf8')+' '+(killed??'')));else resolve(Buffer.concat(chunks));});
    child.stdin.end(bytes);
   });
  }
  signal?.throwIfAborted();return decodeSource(sourcePath,bytes);
 }catch(error){if(signal?.aborted)throw error;return {sourcePath,records:[],readIssue:{code:'source_read_failed',sourcePath,message:error.message,expected:false}};}
}
function generationPaths(directory) {
 const names=readdirSync(directory).filter(n=>/^session(?:\.v\d+)?\.jsonl(?:\.zst(?:d)?)?$/.test(n));
 const generation=n=>Number(n.match(/\.v(\d+)\.jsonl/)?.[1]??0),highest=Math.max(...names.map(generation));
 return names.filter(n=>generation(n)===highest).map(n=>join(directory,n));
}
function codexPaths(id,root) {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new Error('current thread UUIDv7 date is unavailable');
 const millis=Number.parseInt(id.replaceAll('-','').slice(0,12),16),paths=[];
 for(const delta of [-1,0,1])for(const kind of ['sessions','archived_sessions']) {
  const date=new Date(millis+delta*86400000).toISOString().slice(0,10).replaceAll('-',sep),directory=join(root,kind,date);
  let names;try{names=readdirSync(directory);}catch(error){if(error.code==='ENOENT')continue;throw error;}
  const suffix=new RegExp(id+'\\.jsonl(?:\\.zst(?:d)?)?$','i');
  paths.push(...names.filter(n=>suffix.test(n)).map(n=>join(directory,n)));
 }
 return paths;
}
async function discoverCurrent(task,signal) {
 const dsh=process.env.DSH_SESSION_ID,thread=process.env.CODEX_THREAD_ID,fallback=process.env.CODEX_SESSION_ID;
 if(dsh&&thread)throw new Error('ambiguous current host identities');
 const load=path=>readSourceAsync(path,signal);let candidates=[],expected;
 if(dsh) {
  const home=process.env.DSH_HOME||join(homedir(),'.dsh');if(!isAbsolute(home))throw new Error('DSH_HOME must be absolute');
  const projects=[...new Set([process.cwd(),task?.manifest.workspace_root,task?.manifest.target_repo_root].filter(Boolean))];
  for(const cwd of projects) {
   const directory=join(home,'sessions',dshProjectKey(cwd),encodeSegment(dsh));
   let paths;try{paths=generationPaths(directory);}catch(error){if(error.code==='ENOENT')continue;throw error;}
   for(const path of paths){const source=await load(path),h=source.records[0];if(h?h.id!==dsh||h.cwd!==cwd:!source.readIssue)throw new Error('current DSH header identity mismatch');candidates.push(source);}
  }
  expected=dsh;
 }else {
  const id=thread||fallback;if(!id)throw new Error('current session environment is unavailable');
  const home=process.env.CODEX_HOME||join(homedir(),'.codex');if(!isAbsolute(home))throw new Error('CODEX_HOME must be absolute');
  for(const path of codexPaths(id,home)) {
   const source=await load(path),h=source.records[0];
   if(h?h.type!=='session_meta'||h.payload?.id!==id:!source.readIssue)throw new Error('current Codex header/thread identity mismatch');
   if(!thread&&h?.type==='session_meta'&&(h.payload.parent_thread_id||h.payload.source?.subagent))throw new Error('root session fallback is not a current main thread');
   candidates.push(source);
  }
  expected=id;
 }
 if(!candidates.length)throw new Error('current session source unavailable for '+expected);
 const broken=candidates.filter(source=>source.readIssue);
 if(broken.length) {
  const selected=candidates.find(source=>!source.readIssue)??candidates[0];
  return {...selected,readIssue:{code:'source_read_failed',sourcePath:broken[0].sourcePath,
   message:'current session copies include incomplete source: '+broken.map(source=>source.sourcePath+': '+source.readIssue.message).join('; '),expected:false}};
 }
 const first=canonical(candidates[0].records);
 if(candidates.some(s=>canonical(s.records)!==first))throw new Error('current session copies conflict');
 return candidates[0];
}
const LEDGER_HEADER='| 记录时间(UTC) | 阶段 | from(UTC) | until(UTC) | 起点来源 | 窗口状态 | 任务墙钟(ms) | 会话跨度和(ms) | 轮次内并集(ms) | 等待(ms) | 输入(token) | 输出(token) | 缓存读(token) | 缓存写(token) | 推理(token) | DSH步骤(次) | Codex响应项(次) | 轮次(次) | 工具调用(次) | 子代理调用(次) | 命令调用(次) | 宿主实际注入(byte) | 审查provider上报(原口径) | 当前材料(byte) | 来源refs | 会话明细与累计点 | 缺报与错误 |';
const ledgerEscape=value=>String(value).replaceAll('&','&amp;').replaceAll('\\','&#92;').replaceAll('|','&#124;').replaceAll('\r','&#13;').replaceAll('\n','&#10;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const ledgerUnescape=value=>value.replace(/&(amp|#92|#124|#13|#10|lt|gt);/g,(_,e)=>({amp:'&','#92':'\\','#124':'|','#13':'\r','#10':'\n',lt:'<',gt:'>'}[e]));
const renderMetric=m=>m.status==='available'?JSON.stringify(m.value):m.status+':'+m.reason;
function parseLedger(raw) {
 if(raw==='')return [];
 if(!raw.endsWith('\n'))throw new Error('ledger_format_invalid: truncated final row');
 const lines=raw.slice(0,-1).split('\n');
 if(lines[0]!==LEDGER_HEADER||!/^\|(?:\s*-{3,}\s*\|){27}$/.test(lines[1]??''))throw new Error('ledger_format_invalid: header');
 return lines.slice(2).map(line=>{
  if(!line.startsWith('|')||!line.endsWith('|'))throw new Error('ledger_format_invalid: row boundary');
  const cells=line.split('|').slice(1,-1).map(c=>ledgerUnescape(c.trim()));
  if(cells.length!==27)throw new Error('ledger_format_invalid: column count');
  try{date(cells[0]);date(cells[3]);for(const index of [24,25,26])if(!Array.isArray(JSON.parse(cells[index])))throw new Error('not an array');}
  catch(error){throw new Error('ledger_format_invalid: '+error.message);}
  return cells;
 });
}
function ledgerRow(args,result,startRef) {
 const t=result.totals;
 const material=result.sources.materialBytes;
 if(material.metric.status==='available')result.issues.push({code:'material_sample',message:material.scope,expected:true});
 const cells=[new Date().toISOString(),args.stage,result.window.from??'unavailable:task_start_unavailable',result.window.until,startRef??'unavailable:task_start_unavailable',result.status,
  ...['wallMs','sessionSpanSumMs','activeUnionMs','waitingMs'].map(k=>renderMetric(t[k])),
  ...usageKeys.map(k=>renderMetric(t.usage[k])),...countKeys.map(k=>renderMetric(t.counts[k])),
  renderMetric(result.sources.hostInjectedBytes.metric),renderMetric(result.sources.reviewProviderUsage.metric),renderMetric(material.metric),
  JSON.stringify(result.sessions.flatMap(s=>s.sourceRefs)),JSON.stringify(result.sessions),JSON.stringify(result.issues)];
 return '| '+cells.map(ledgerEscape).join(' | ')+' |\n';
}
async function recordMeasurement(args,signal) {
 const task=taskFor(args);if(task.manifest.activation_cohort!=='post')throw new Error('pre/history task is read-only');
 authenticatedWorkspace(task);let publicationState='not_published',publicationWarning=null;
 try {
  return await task.withRecordLock('main-agent-cost',async()=>{
   signal.throwIfAborted();let old='';try{old=task.readRecord('main-agent-cost.md');}catch(error){if(error.code!=='ENOENT')throw error;}
   const rows=parseLedger(old),last=rows.at(-1);
   if(last&&args['start-ref'])throw Object.assign(new TypeError('start-ref cannot reset an existing ledger'),{argumentError:true});
   const until=new Date().toISOString(),load=path=>readSourceAsync(path,signal),explicit=args.session.length>0;
   let sources=[],loadIssue;
   try {
    if(explicit)sources=await Promise.all([...new Set(args.session)].map(load));
    else {
     const current=await discoverCurrent(task,signal),h=current.records[0];
     if(h?.type==='session_meta'&&(h.payload.parent_thread_id||h.payload.source?.subagent)||h?.type==='session'&&(h.origin==='subagent'||h.delegationDepth>0))throw new Error('stage_caller_is_subagent');
     sources=[current];
    }
   }catch(error){if(signal.aborted)throw error;loadIssue={code:'current_source_unavailable',message:error.message,expected:false};}
   const previousSources=last?JSON.parse(last[24]):[],startRef=last?last[4]:args['start-ref']??null;
   const selector=!last&&args['start-ref']?parseSelector(args['start-ref']):null;
   const extra=[...new Set([...previousSources,...(selector?[selector.sourcePath]:[])])].filter(path=>!sources.some(s=>s.sourcePath===path));
   sources.push(...await Promise.all(extra.map(load)));
   sources=await explicitDescendants(sources,date(until),load);
   const start=last?{from:last[3]}:startFrom(startRef,sources),previousBoundaries=last?JSON.parse(last[25]).flatMap(s=>s.observedBoundaries):[];
   const result=measureSessions(sources,{window:{from:start.from,until,includeFrom:!last,startRef,previousBoundaries}});
   if(start.issue)result.issues.push(start.issue);if(loadIssue)result.issues.push(loadIssue);
   try{result.sources=taskSourceFacts(args,result);}catch(error){result.sources.reviewProviderUsage.metric=unavailable('task_source_unavailable');result.sources.materialBytes.metric=unavailable('task_source_unavailable');result.issues.push({code:'task_source_unavailable',message:error.message,expected:false});}
   result.status=result.issues.some(x=>!x.expected)?'incomplete':'available';signal.throwIfAborted();
   const prefix=old||LEDGER_HEADER+'\n| '+Array(27).fill('---').join(' | ')+' |\n',next=prefix+ledgerRow(args,result,startRef);
   let writeError,readback,readbackError;publicationState='uncertain';
   try{await task.writeRecordAtomic('main-agent-cost.md',next);}catch(error){writeError=error;}
   try{readback=task.readRecord('main-agent-cost.md');}catch(error){readbackError=error;}
   const writerMessage=writeError?.message??'atomic writer returned without publishing the intended row';
   if(!readbackError&&readback===next&&readback.startsWith(old)){publicationState='published';publicationWarning=writeError??null;}
   else if(!readbackError&&readback===old){publicationState='not_published';throw new Error('publication_not_published: readback equals prior ledger: '+writerMessage);}
   else if(writeError&&readbackError&&old===''&&readbackError.code==='ENOENT'){publicationState='not_published';throw new Error('publication_not_published: no ledger exists: '+writerMessage);}
   else {publicationState='uncertain';throw new Error('publication_uncertain: readback could not confirm prior or intended ledger: '+writerMessage+(readbackError?'; readback: '+readbackError.message:''));}
   process.stdout.write(human(result));process.stdout.write('已发布一条任务账本记录: '+task.recordPath('main-agent-cost.md')+'\n');
   if(publicationWarning)process.stderr.write('发布已由读回确认，但原子写入器随后报错：'+publicationWarning.message+'；请先核对该行再决定后续操作。\n');
   if(signal.aborted){process.stderr.write('已发布，随后取消；本笔实际until之后动作未计入。\n');return 1;}
   return result.status==='available'&&!publicationWarning?0:1;
  });
 }catch(error){if(error.argumentError)throw error;const prefix=publicationState==='published'?'已发布后失败: ':publicationState==='uncertain'?'发布状态不确定: ':'本阶段无记录: ';process.stderr.write(prefix+(signal.aborted?'cancelled: ':'')+error.message+'\n');return 1;}
}
async function cliMain(argv=process.argv.slice(2)) {
 let args;try{args=parseArgs(argv);}catch(error){process.stderr.write('参数错误: '+error.message+'\n');return 2;}
 const controller=new AbortController(),interrupt=()=>controller.abort(new Error('cancelled'));
 process.on('SIGTERM',interrupt);process.on('SIGINT',interrupt);
 try {
  if(args.record)return await recordMeasurement(args,controller.signal);
  const task=args.task?taskFor(args):null,load=path=>readSourceAsync(path,controller.signal);
  let sources=[];
  try{sources=args.session.length?await Promise.all([...new Set(args.session)].map(load)):[await discoverCurrent(task,controller.signal)];}
  catch(error){process.stderr.write('unavailable: '+error.message+'\n');return 1;}
  sources=await explicitDescendants(sources,args.until?date(args.until):Infinity,load);
  const options={};if(args.from||args.until)options.window={from:args.from??null,until:args.until??null,includeFrom:false,startRef:null};
  const result=measureSessions(sources,options);
  try{result.sources=taskSourceFacts(args,result);}catch(error){result.sources.reviewProviderUsage.metric=unavailable('task_source_unavailable');result.sources.materialBytes.metric=unavailable('task_source_unavailable');result.issues.push({code:'task_source_unavailable',message:error.message,expected:false});}
  if(result.issues.some(x=>!x.expected))result.status='incomplete';process.stdout.write(human(result));return result.status==='available'?0:1;
 }catch(error){process.stderr.write((args.record?'本阶段无记录: ':'工具错误: ')+error.message+'\n');return error.argumentError?2:args.record?1:2;}
 finally{process.off('SIGTERM',interrupt);process.off('SIGINT',interrupt);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)process.exitCode=await cliMain();
