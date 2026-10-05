// CARD-09: read-only session metadata accounting for stage human readback.
// Writes stdout only; never task facts, reports or a new continuation gate.
import {createReadStream,readFileSync,readdirSync,realpathSync,statSync} from 'node:fs';
import {join,resolve,dirname,basename,isAbsolute} from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const classes=['platform_interrupt','human_wait','provider_activity','tool_subagent','unattributed'];
const time=v=>typeof v==='number'?v:Date.parse(v);
async function rows(file,consume){const encoded=createReadStream(file),hash=createHash('sha256');let bytesRead=0;encoded.on('data',bytes=>{hash.update(bytes);bytesRead+=bytes.length;});let stream=encoded,child,done,fed,inputError=null;if(file.endsWith('.zstd')){child=spawn('zstd',['-dc'],{stdio:['pipe','pipe','pipe']});let error='';child.stderr.on('data',b=>error+=b);done=new Promise((ok,bad)=>{child.once('error',bad);child.once('close',code=>code===0?ok():bad(new Error('zstd failed: '+error)));});fed=pipeline(encoded,child.stdin).catch(error=>{inputError=error;child.kill();});stream=child.stdout;}let line=0;try{for await(const text of createInterface({input:stream,crlfDelay:Infinity})){line++;if(text.trim()){let value;try{value=JSON.parse(text);}catch{throw new Error('invalid JSONL at line '+line);}consume(value);}}if(fed)await fed;if(done)await done;if(inputError)throw inputError;return{sha256:hash.digest('hex'),bytes_read:bytesRead};}catch(error){child?.kill();encoded.destroy();if(fed)await fed;if(done)await done.catch(()=>{});throw error;}}

export async function sessionLedger({session,since=null,until=null,reviews=null}={}){
 const file=resolve(session);const initial=statSync(file).isDirectory()?join(file,'session.v4.jsonl.zstd'):file;
 const sources=[],limitations=[],intervals=[],calls=new Map(),byName={},seenCalls=new Set(),reads=new Map(),messages={user:0,assistant:0,coordination:0},children=new Set();let min=Infinity,max=-Infinity,subagents=0,human=0,self=0,openTurn=null,schema=null;
 const add=(category,start,end)=>{if(Number.isFinite(start)&&Number.isFinite(end)&&end>=start)intervals.push({category,start,end});};
 const selected=[];
 async function consumeFile(path,main){let first=Infinity,last=-Infinity,localSchema=null,sessionCwd=null;
 const inputIdentity=await rows(path,row=>{
 // DSH's v4 session header owns this file's cwd. Never infer it from a parent or this process.
 if(row.type==='session'&&row.version===4){localSchema='dsh';if(typeof row.cwd==='string'&&isAbsolute(row.cwd))sessionCwd=row.cwd;else limitations.push('DSH session cwd metadata unavailable; relative reads not inferred');return;}
 const t=time(row.time??row.timestamp);if(!Number.isFinite(t))return;first=Math.min(first,t);last=Math.max(last,t);min=Math.min(min,t);max=Math.max(max,t);const data=row.data??row.payload??{},kind=row.type;
 if(kind==='session_meta'){localSchema='codex';return;}if(kind==='tool/call'||kind==='tool/result'||kind==='turn/start'||kind==='user/message')localSchema='dsh';
 const active=t>=(since??-Infinity)&&(until===null||t<until);
 if(kind==='turn/start'||kind==='event_msg'&&data.type==='task_started')openTurn=t;
 if(kind==='turn/end'&&data.reason?.kind==='aborted'&&/safety|security|policy|安全|策略/i.test(JSON.stringify({reason:data.reason,error:data.error})))add('platform_interrupt',openTurn??t,t);
 if(kind==='user/message'&&data.source?.senderSessionId)children.add(data.source.senderSessionId);
 if(kind==='agent/inbox/spliced'&&data.senderSessionId)children.add(data.senderSessionId);
 let name,id,args,isCall=false,isResult=false;
 if(kind==='tool/call'){name=data.name;id=data.callId;args=data.arguments;isCall=true;}
 if(kind==='tool/result'){id=data.callId??data.toolCallId??data.message?.toolCallId;isResult=true;}
 if(kind==='response_item'&&['function_call','custom_tool_call'].includes(data.type)){name=data.name;id=data.call_id;args=data.arguments??data.input;isCall=true;}
 if(kind==='response_item'&&['function_call_output','custom_tool_call_output'].includes(data.type)){id=data.call_id;isResult=true;}
 if(isCall&&id&&name){const key=path+'\0'+id;if(seenCalls.has(key))throw new Error('duplicate call id in one session');seenCalls.add(key);const dshCall=kind==='tool/call'&&localSchema==='dsh',dshBash=dshCall&&name==='bash',dshSubagent=dshCall&&name==='subagent',dshRead=dshCall&&name==='read';const humanCall=/ask_user_question|request_user_input/.test(name),asyncHuman=name==='request_user_input_async';calls.set(key,{start:t,category:humanCall&&!asyncHuman?'human_wait':'tool_subagent'});if(active){if(asyncHuman)limitations.push('async human response timing unavailable; immediate tool result is not an answer interval');if(main)byName[name]=(byName[name]??0)+1;if(humanCall)human++;if(/spawn_agent|followup_task/.test(name)||dshSubagent)subagents++;if(main&&(/^(?:exec_command|run_command|terminal_execute)$/.test(name)||dshBash))self++;if(main&&/^(?:exec|functions[.]exec)$/.test(name))limitations.push('wrapper execution cannot establish inner execution/read counts');if(/send_message|followup_task|wait_agent/.test(name))messages.coordination++;
 // Count only explicitly recognizable reads in tool arguments, never conversation bodies.
 let argument=args;if(typeof argument==='string'){try{argument=JSON.parse(argument);}catch{argument=null;}}
 const cmd=dshBash?argument?.command:argument?.cmd??argument?.command,cwd=argument?.cwd??argument?.workdir??(dshCall?sessionCwd:null);
 const recordRead=(named)=>{if(!cwd&&!isAbsolute(named)){limitations.push('relative read has no cwd metadata');return;}let p=resolve(cwd??'/',named);try{p=realpathSync(p);}catch(error){limitations.push('read path physical identity unavailable: '+error.code);}reads.set(p,(reads.get(p)??0)+1);};
 if(dshBash&&(typeof argument?.command!=='string'||!argument.command.trim()))limitations.push('DSH bash command metadata unavailable; reads not inferred');
 if(dshSubagent&&(typeof argument?.description!=='string'||typeof argument?.prompt!=='string'))limitations.push('DSH subagent arguments unavailable; named dispatch call counted but child execution not inferred');
 if(dshRead){if(typeof argument?.file_path==='string'&&argument.file_path.trim())recordRead(argument.file_path);else limitations.push('DSH read file_path metadata unavailable; reads not inferred');}
 if(typeof cmd==='string'&&(/^(?:exec_command|run_command|terminal_execute)$/.test(name)||dshBash)){
  const tokens=cmd.match(/"[^"\n]*"|'[^'\n]*'|[^\s]+/g)??[];let files=[];
  const bare=t=>t.replace(/^["']|["']$/g,'');
  const executable=basename(bare(tokens[0]??''));
  if(executable==='cat')files=tokens.slice(1).filter(t=>!t.startsWith('-'));
  else if(executable==='sed'&&tokens[1]==='-n'&&tokens.length>=4)files=tokens.slice(3);
  else if(executable==='rg')limitations.push('rg pattern/path ambiguity: repeated reads not inferred');
  else limitations.push('unsupported read command form; paths not inferred');
  if(['cat','sed'].includes(executable)&&files.length===0)limitations.push('read command has no attributable literal file path');
  if(files.some(t=>/[;|><&]/.test(t)))limitations.push('compound read command not attributable');
  else for(const token of files){const named=bare(token);if(/[\x24\x60*?\[\]\n]/.test(named)){limitations.push('nonliteral read path; physical reads not inferred');continue;}if(!named||named.startsWith('-'))continue;recordRead(named);}
 }

 }}
 if(isResult&&id){const key=path+'\0'+id,call=calls.get(key);if(call){add(call.category,call.start,t);calls.delete(key);}}
 if(active){if(kind==='user/message')messages.user++;if(kind==='assistant/message')messages.assistant++;if(kind==='response_item'&&data.type==='message'&&['user','assistant'].includes(data.role))messages[data.role]++;}
 });
 sources.push({ref:path,...inputIdentity,hash_scope:"exact encoded bytes consumed (prefix for a growing session)",schema:localSchema??'unknown',first_ms:Number.isFinite(first)?first:null,last_ms:Number.isFinite(last)?last:null});if(!localSchema)limitations.push('unrecognized session schema: '+basename(path));if(!main&&Number.isFinite(first))add('tool_subagent',first,last);if(main)schema=localSchema;}
 await consumeFile(initial,true);
 for(const id of children){if(!/^[a-zA-Z0-9-]+$/.test(id)){limitations.push('invalid child session metadata');continue;}const child=join(dirname(dirname(initial)),'session-'+id,'session.v4.jsonl.zstd');try{statSync(child);selected.push(child);}catch(error){if(error.code!=='ENOENT')throw error;limitations.push('referenced child session unavailable: '+id);}}
 for(const child of [...new Set(selected)])await consumeFile(child,false);
 if(reviews){for(const name of readdirSync(reviews).filter(name=>name.endsWith('.json')).sort()){const path=join(reviews,name);const reviewBytes=readFileSync(path);const values=[JSON.parse(reviewBytes.toString("utf8"))];for(const value of values)for(const member of value.provider_results??[]){const timing=member.timing??{};if(!Number.isFinite(timing.started_at_ms)||!Number.isFinite(timing.completed_at_ms))limitations.push('review provider timing incomplete; activity not inferred');add('provider_activity',timing.started_at_ms,timing.completed_at_ms);}sources.push({ref:resolve(path),sha256:createHash("sha256").update(reviewBytes).digest("hex"),schema:'review'});}}
 if(children.size!==selected.length)limitations.push('some referenced child session metadata is unavailable; child spans are not inferred');
 const start=since??(Number.isFinite(min)?min:0),end=until??(Number.isFinite(max)?max:start);if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)throw new Error('invalid time window');
 for(const call of calls.values()) {add(call.category,call.start,end);limitations.push('unfinished tool call clipped to window end');}
 const clipped=intervals.map(i=>({...i,start:Math.max(start,i.start),end:Math.min(end,i.end)})).filter(i=>i.end>i.start);
 const durations=Object.fromEntries(classes.map(key=>[key,0]));
 const endpoints=[...new Set([start,end,...clipped.flatMap(i=>[i.start,i.end])])].sort((a,b)=>a-b);
 for(let n=0;n<endpoints.length-1;n++){const left=endpoints[n],right=endpoints[n+1];const category=classes.find(key=>clipped.some(i=>i.category===key&&i.start<=left&&i.end>=right))??"unattributed";durations[category]+=right-left;}

 const total=Object.values(durations).reduce((a,b)=>a+b,0),span=end-start;
 if(schema==='codex')limitations.push('Codex has no DSH senderSessionId/turn-end safety taxonomy; unavailable classes are not inferred');
 return{window:{since_ms:start,until_ms:end,span_ms:span,counts_boundary:'[since,until) for explicit bounds'},sources,counts:{tool_calls:Object.values(byName).reduce((a,b)=>a+b,0),tool_calls_by_name:byName,subagent_dispatches:subagents,human_questions:human,human_wait_ms:durations.human_wait,main_self_execution:self,messages,same_path_repeat_reads:[...reads.values()].reduce((sum,count)=>sum+Math.max(0,count-1),0)},accounting_ms:durations,accounted_ms:total,self_check:total===span,status:limitations.length?'inconclusive':'computed',coverage_limits:[...new Set(limitations)],comparison:'inconclusive: workload equivalence is not provided by event metadata; tool_calls/tool_calls_by_name/main_self_execution count the explicitly selected main session only; subagent_dispatches/human_questions/messages/same_path_repeat_reads count all parsed main and child sessions (dispatch/execution scalars are named tool-call events, not completed child jobs); five time classes and human_wait_ms use the union across all parsed sources; human_wait_ms contains only confirmed synchronous wait intervals, asynchronous answer waiting remains unknown without a bound answer timestamp'};
}
async function main(){const args=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2){const key=args[i];if(!['--session','--since','--until','--reviews'].includes(key)||args[i+1]===undefined)throw new Error('usage: --session <dir|file> [--since <ms>] [--until <ms>] [--reviews <dir>]');opts[key.slice(2)]=['--since','--until'].includes(key)?Number(args[i+1]):args[i+1];}if(!opts.session)throw new Error('--session required');const result=await sessionLedger(opts);process.stdout.write(JSON.stringify(result)+'\n');if(!result.self_check)process.exitCode=1;}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href)main().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
