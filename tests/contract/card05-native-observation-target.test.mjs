// AC-C05AUD-26/27: local fake provider CLIs drive the real native hook/MCP and host adapter.
// No providerExecutor echo, real provider/network request, global config change or version probe.
// Each temporary Kimi native home and packet is owned; existing frozen tests remain untouched.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test } from 'vitest';
import { runConfiguredOcrHostReview } from '../../runtime/review/ocr-delegation-adapter.mjs';
import { appendRecord } from '../../runtime/interface/safe-write.mjs';
const roots=[];
const request={stage:'build-code',review_scope:'phase',subject_kind:'phase',phase_id:'P10',candidate_experiment:true};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});

const CLI_PROGRAM = String.raw`const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process'),readline=require('node:readline');
const root=path.dirname(fs.realpathSync(process.argv[1])),scenario=JSON.parse(fs.readFileSync(path.join(root,'scenario.json'),'utf8'));
const args=process.argv.slice(2),cwd=fs.realpathSync(process.cwd()),adapter=args[0]==='exec'?'codex':args.includes('--agent-file')?'kimi':'antigravity';
const session='owned-native-observation',output=value=>process.stdout.write(JSON.stringify(value)+'\n');
const good={severity:'major',path:'src/read.mjs',line:1,issue:'Owned sibling finding survives another provider failure',recommendation:'Preserve the owned finding',evidence_kind:'direct',evidence:'export const read = true;',root_cause:'Deterministic sibling fixture'};
function finished(){
 fs.appendFileSync(path.join(root,'launches.jsonl'),JSON.stringify({adapter,cwd})+'\n');
 if(adapter==='kimi'&&scenario.mode==='output-truncated'){
  // Only stdout contributes to the real 16 MiB host cap. The second retry
  // starts 32 bytes before the boundary, so the saved final line is incomplete.
  const limit=16*1024*1024;
  const header=Buffer.from(JSON.stringify({role:'meta',type:'session.resume_hint',session_id:session})+'\n'
   +JSON.stringify({role:'meta',type:'turn.step.retrying',failed_attempt:1,next_attempt:2,max_attempts:10,delay_ms:1,error_name:'APIConnectionError',error_message:'Connection error.'})+'\n');
  const nextRetry=Buffer.from(JSON.stringify({role:'meta',type:'turn.step.retrying',failed_attempt:2,next_attempt:3,max_attempts:10,delay_ms:1,error_name:'APIConnectionError',error_message:'Connection error.'})+'\n');
  const payload=Buffer.concat([header,Buffer.alloc(limit-32-header.length-1,0x70),Buffer.from('\n'),nextRetry,Buffer.alloc(64*1024,0x71)]);
  process.stdout.write(payload);
  setInterval(()=>{},1000); // The real output limit terminates this child.
  return;
 }
 if(adapter==='kimi')output({role:'meta',type:'session.resume_hint',session_id:session});
 else output({event:'init',conversation_id:session});
 if(scenario.mode==='cancel'){process.stderr.write('NATIVE_READ_COMPLETE\n');setInterval(()=>{},1000);return;}
 if(adapter==='kimi'&&scenario.mode==='retry-nine'){
  for(let i=1;i<=9;i++)output({role:'meta',type:'turn.step.retrying',failed_attempt:i,next_attempt:i+1,max_attempts:10,delay_ms:1,error_name:'APIConnectionError',error_message:'Connection error.'});
  output({role:'meta',type:'provider.connection_error',message:'Connection error.'});process.stderr.write('APIConnectionError: Connection error.\n');process.exitCode=7;return;
 }
 if(adapter==='kimi'&&scenario.mode==='unknown-retry'){process.stderr.write('APIConnectionError; native retry history unavailable\n');process.exitCode=7;return;}
 if(adapter==='kimi'&&scenario.mode==='cleanup-failure'){
  const trustDir=path.join(process.env.KIMI_CODE_HOME,'workspace-trust');
  const name=fs.readdirSync(trustDir).find(n=>JSON.parse(fs.readFileSync(path.join(trustDir,n),'utf8')).root===cwd);
  assert(name);fs.appendFileSync(path.join(trustDir,name),' ');
 }
 if(adapter==='kimi')output({role:'assistant',content:JSON.stringify({findings:[]})});
 else output({event:'result',result:{conversation_id:session,status:'SUCCESS',response:JSON.stringify({findings:[]})}});
}
async function main(){
 if(adapter==='codex'){
  output({type:'item.completed',item:{type:'agent_message',text:JSON.stringify({findings:[good]})}});
  output({type:'turn.completed'});return;
 }
 if(adapter==='antigravity'){
  if(scenario.mode==='ag-prompt-partial'){
   const hook=path.join(cwd,'.ocr-ag-guard/hook.cjs');
   for(const file of ['review-prompt.md','src/read.mjs','src/unread.mjs']){
    const AbsolutePath=path.join(cwd,file),partial=file==='review-prompt.md';
    const toolArgs={AbsolutePath,...(partial?{StartLine:1,EndLine:1}:{})};
    const pre=spawnSync(process.execPath,[hook,'pre'],{input:JSON.stringify({conversationId:session,toolCall:{name:'view_file',args:toolArgs}}),encoding:'utf8',timeout:3000});
    assert.equal(pre.status,0,pre.stderr);assert.equal(JSON.parse(pre.stdout).decision,'allow');
    const whole=fs.readFileSync(AbsolutePath,'utf8'),toolResult=partial?whole.split('\n')[0]+'\n':whole;
    if(partial)assert(Buffer.byteLength(toolResult)<Buffer.byteLength(whole));
    const post=spawnSync(process.execPath,[hook,'post'],{input:JSON.stringify({conversationId:session,toolCall:{name:'view_file',args:toolArgs},toolResult:{content:toolResult}}),encoding:'utf8',timeout:3000});
    assert.equal(post.status,0,post.stderr);
    if(partial)output({event:'owned.prompt-partial',path:file,StartLine:1,EndLine:1,visible:toolResult,total_bytes:Buffer.byteLength(whole)});
   }
   finished();return;
  }
  if(scenario.mode==='ag-partial-lines'){
   const hook=path.join(cwd,'.ocr-ag-guard/hook.cjs');
   for(const file of ['review-prompt.md','src/read.mjs','src/unread.mjs']){
    const AbsolutePath=path.join(cwd,file),partial=file==='src/read.mjs';
    const toolArgs={AbsolutePath,...(partial?{StartLine:1,EndLine:1}:{})};
    const pre=spawnSync(process.execPath,[hook,'pre'],{input:JSON.stringify({conversationId:session,toolCall:{name:'view_file',args:toolArgs}}),encoding:'utf8',timeout:3000});
    assert.equal(pre.status,0,pre.stderr);assert.equal(JSON.parse(pre.stdout).decision,'allow');
    // Tool implementation reads bytes; only this result is returned to the fake provider.
    const toolResult=partial?fs.readFileSync(AbsolutePath,'utf8').split('\n')[0]+'\n':fs.readFileSync(AbsolutePath,'utf8');
    if(partial)assert.equal(toolResult,'export const first = 1;\n');
    const post=spawnSync(process.execPath,[hook,'post'],{input:JSON.stringify({conversationId:session,toolCall:{name:'view_file',args:toolArgs},toolResult:{content:toolResult}}),encoding:'utf8',timeout:3000});
    assert.equal(post.status,0,post.stderr);
    if(partial)output({event:'owned.partial-observation',path:file,StartLine:toolArgs.StartLine,EndLine:toolArgs.EndLine,visible:toolResult});
   }
   finished();return;
  }
  const hook=path.join(cwd,'.ocr-ag-guard/hook.cjs');
  for(const file of ['review-prompt.md','src/read.mjs']){
   const AbsolutePath=path.join(cwd,file);
   const pre=spawnSync(process.execPath,[hook,'pre'],{input:JSON.stringify({conversationId:session,toolCall:{name:'view_file',args:{AbsolutePath}}}),encoding:'utf8',timeout:3000});
   assert.equal(pre.status,0,pre.stderr);assert.equal(JSON.parse(pre.stdout).decision,'allow');
   const toolResult=fs.readFileSync(AbsolutePath,'utf8');
   const post=spawnSync(process.execPath,[hook,'post'],{input:JSON.stringify({conversationId:scenario.mode==='bad-session'?'wrong-session':session,toolCall:{name:'view_file',args:{AbsolutePath}},toolResult:{content:toolResult}}),encoding:'utf8',timeout:3000});
   assert.equal(post.status,0,post.stderr);
  }
  finished();return;
 }
 const config=JSON.parse(fs.readFileSync(path.join(cwd,'.kimi-code/mcp.json'),'utf8')).mcpServers.card06_packet;
 const mcp=spawn(config.command,config.args,{cwd:config.cwd,stdio:['pipe','pipe','pipe']});
 const pending=new Map();let id=0,stderr='';
 mcp.stderr.on('data',b=>stderr+=b);
 const closed=new Promise(resolve=>mcp.once('close',code=>{for(const p of pending.values())p.reject(Error('MCP closed '+stderr));resolve(code);}));
 readline.createInterface({input:mcp.stdout}).on('line',line=>{const response=JSON.parse(line),p=pending.get(response.id);if(p){pending.delete(response.id);p.resolve(response);}});
 const rpc=(method,params)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});mcp.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n');});
 const read=async(file,offset=0,limit)=>{const response=(await rpc('tools/call',{name:'Read',arguments:{path:file,offset,...(limit?{limit}:{})}})).result;assert.equal(response.isError,false);return JSON.parse(response.content[0].text);};
 try{
  await rpc('initialize',{protocolVersion:'2024-11-05'});
  if(['kimi-prompt-partial','kimi-prompt-hole','kimi-prompt-pages'].includes(scenario.mode)){
   const pages=[];
   if(scenario.mode==='kimi-prompt-pages'){
    let page,offset=0;do{page=await read('review-prompt.md',offset,32);pages.push(page);offset=page.next_offset;}while(page.has_more);
   }else{
    const first=await read('review-prompt.md',0,32);pages.push(first);
    assert(first.total_bytes>96);assert.equal(first.has_more,true);assert.equal(first.bytes_returned,32);
    if(scenario.mode==='kimi-prompt-hole'){
     pages.push(await read('review-prompt.md',0,32));
     pages.push(await read('review-prompt.md',first.total_bytes-32,32));
    }
   }
   output({role:'meta',type:'owned.prompt-pages',path:'review-prompt.md',pages:pages.map(page=>({offset:page.offset,bytes_returned:page.bytes_returned,total_bytes:page.total_bytes,has_more:page.has_more,sha256:page.sha256,content_bytes:Buffer.byteLength(page.content)}))});
   let page,offset=0;do{page=await read('src/read.mjs',offset);offset=page.next_offset;}while(page.has_more);
  }else
  for(const file of ['review-prompt.md','src/read.mjs']){let page,offset=0;do{page=await read(file,offset);offset=page.next_offset;}while(page.has_more);}
  if(scenario.mode==='kimi-page-hole'){
   const pages=[await read('src/unread.mjs',0,128),await read('src/unread.mjs',0,128),await read('src/unread.mjs',224,64)];
   const expected=[[0,128,true],[0,128,true],[224,64,false]];
   for(let i=0;i<pages.length;i++){
    const page=pages[i];assert.deepEqual([page.offset,page.bytes_returned,page.has_more],expected[i]);
    assert.equal(page.total_bytes,288);assert.equal(page.sha256,pages[0].sha256);
    assert.equal(page.content,i<2?'//'+'h'.repeat(126):'h'.repeat(63)+'\n');
   }
   output({role:'meta',type:'owned.page-observation',path:'src/unread.mjs',pages:pages.map(page=>({offset:page.offset,bytes_returned:page.bytes_returned,total_bytes:page.total_bytes,has_more:page.has_more,sha256:page.sha256}))});
  }else
  if(scenario.mode==='hash-mismatch'){
   fs.appendFileSync(path.join(cwd,'src/unread.mjs'),'tampered');
   const denied=(await rpc('tools/call',{name:'Read',arguments:{path:'src/unread.mjs',offset:0,limit:32}})).result;
   assert.equal(denied.isError,true);assert(JSON.stringify(denied).includes('file changed'));
 }else{
   const partial=await read('src/unread.mjs',0,32);assert.equal(partial.has_more,true);assert.equal(partial.bytes_returned,32);
 }
 }finally{mcp.stdin.end();assert.equal(await closed,0,stderr);}
 finished();
}
main().catch(error=>{process.stderr.write('FIXTURE_FAILURE: '+(error.stack||error));process.exitCode=9;});
`;

function fixture(providers=['antigravity/owned'],mode='partial'){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'card05-native-observation-')));roots.push(root);
 const packetRoot=join(root,'packet'),directory=join(root,'quality/reviews'),nativeHome=join(root,'kimi-home'),executable=join(root,'owned-cli');
 mkdirSync(join(packetRoot,'src'),{recursive:true});mkdirSync(directory,{recursive:true});mkdirSync(join(nativeHome,'workspace-trust'),{recursive:true});
 writeFileSync(executable,'#!/usr/bin/env node\n'+CLI_PROGRAM,{mode:0o700});writeFileSync(join(root,'scenario.json'),JSON.stringify({mode}));
 const files={'src/read.mjs':'export const read = true;\n','src/unread.mjs':'export const unread = "'+'x'.repeat(256)+'";\n'};
 if(mode==='ag-partial-lines')files['src/read.mjs']='export const first = 1;\nexport const second = 2;\nexport const third = 3;\n';
 if(mode==='kimi-page-hole')files['src/unread.mjs']='//'+'h'.repeat(285)+'\n'; // Exactly 288 bytes before manifest/hash.
 const manifest=Object.entries(files).map(([path,content])=>{writeFileSync(join(packetRoot,path),content);return{path,bytes:Buffer.byteLength(content),sha256:hash(content)};});
 const packet={root:packetRoot,material_id:'a'.repeat(64),preview:{reviewable_files:manifest.map(({path})=>({path}))},rules:{rules:manifest.map(({path})=>({path,rule:'Inspect correctness.'}))},manifest};
 const trustedContext={trusted:{},route:{mode:'single_round',},selection:{providers,provider_identities:Object.fromEntries(providers.map(provider=>[provider,{source_id:provider+'-source',config_id:provider+'-config'}]))},providerConfig:{providers:Object.fromEntries(providers.map(provider=>[provider,{enabled:true,command:executable,model:'owned-test'}]))}};
 const saved=[],auditCallbacks=[];
 const auditKind=bytes=>{const text=bytes.toString('utf8');return text.includes('"tool":"view_file"')&&text.includes('"phase":"post"')?'ag':text.includes('"tool":"Read"')&&text.includes('"allowed":true')?'kimi':null;};
 const launches=()=>existsSync(join(root,'launches.jsonl'))?readFileSync(join(root,'launches.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
 const sink=async(_hint,bytes,metadata)=>{
  expect(Buffer.isBuffer(bytes)).toBe(true);
  const kind=auditKind(bytes);
  if(kind){
   const launch=launches().find(item=>item.adapter===(kind==='ag'?'antigravity':'kimi'));
   expect(launch,'audit must reach sink before native packet cleanup').toBeDefined();
   expect(existsSync(launch.cwd),'ORACLE-P10-AUDIT-BEFORE-CLEANUP').toBe(true);
   const original=join(launch.cwd,kind==='ag'?'.ocr-ag-guard/events.jsonl':'.ocr-kimi-read/audit.jsonl');
   expect(readFileSync(original),'raw sink gets original native audit bytes').toEqual(bytes);
   auditCallbacks.push({provider:metadata.provider,bytes:Buffer.from(bytes),cwd:launch.cwd});
   if(mode==='save-failure')throw new Error('owned native audit save failed');
  }
  const slug='native-'+metadata.provider.replace(/[^a-z0-9-]/gi,'-')+'-'+String(metadata.stream).replace(/[^a-z0-9-]/gi,'-');
  const actual=await appendRecord(directory,slug,'output',bytes),ref=relative(root,actual).split('\\').join('/');
  saved.push({ref,provider:metadata.provider,stream:metadata.stream,bytes:readFileSync(actual),kind});return ref;
 };
 const run=async(options={})=>{
  const previous=process.env.KIMI_CODE_HOME;process.env.KIMI_CODE_HOME=nativeHome;
  const controller=options.controller??new AbortController();
  const watchdog=setTimeout(()=>controller.abort('owned test deadline'),10_000);
  try{return await runConfiguredOcrHostReview({request,packet,signal:controller.signal},{trustedContext,rawOutputSink:sink,healthPollMs:20,...options,controller:undefined});}
  finally{clearTimeout(watchdog);if(previous===undefined)delete process.env.KIMI_CODE_HOME;else process.env.KIMI_CODE_HOME=previous;}
 };
 return{root,packet,saved,auditCallbacks,launches,run,auditKind};
}
function persistedAudit(state,member){
 const audits=state.saved.filter(item=>item.provider===member.provider&&item.kind);
 expect(audits,'ORACLE-P10-AUDIT-BEFORE-CLEANUP native audit survives packet disposal as one original').toHaveLength(1);
 expect(member.evidence_refs).toContain(audits[0].ref);
 expect(readFileSync(join(state.root,audits[0].ref))).toEqual(audits[0].bytes);
 return audits[0];
}
test('ORACLE-P10-PARTIAL-READ AG keeps a fully observed file while leaving other selected files undetermined',async()=>{
 const s=fixture(),result=await s.run(),member=result.provider_results[0];
 expect(member.status,'real native guard and CLI complete').toBe('completed');
 expect(member.coverage.read_confirmed).not.toBe(true);
 expect(member.material_coverage).toEqual({provider:'antigravity/owned',read:['src/read.mjs'],unread:[],undetermined:['src/unread.mjs']});
 persistedAudit(s,member);
});
test('ORACLE-P10-PARTIAL-READ Kimi full path is observed but one page never certifies the whole file',async()=>{
 const s=fixture(['kimi/owned']),result=await s.run(),member=result.provider_results[0];
 expect(member.status,'real MCP reader and CLI complete').toBe('completed');expect(member.coverage.read_confirmed).not.toBe(true);
 expect(member.material_coverage).toEqual({provider:'kimi/owned',read:['src/read.mjs'],unread:[],undetermined:['src/unread.mjs']});
 const audit=persistedAudit(s,member);const rows=audit.bytes.toString('utf8').trim().split('\n').map(JSON.parse);
 expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({path:'src/unread.mjs',allowed:true,offset:0,bytes_returned:32,has_more:true})]));
});
test('ORACLE-P10-AUDIT-BEFORE-CLEANUP actual guard bytes reach the sink before disposal and remain readable afterwards',async()=>{
 const s=fixture(),result=await s.run(),member=result.provider_results[0];expect(member.status).toBe('completed');
 const audit=persistedAudit(s,member);expect(s.auditCallbacks).toHaveLength(1);
 expect(s.launches()).toHaveLength(1);expect(existsSync(s.launches()[0].cwd)).toBe(false);expect(readFileSync(join(s.root,audit.ref))).toEqual(audit.bytes);
});
test('ORACLE-P10-RETRY-FACTS nine native retry events stay separate from zero fresh executions',async()=>{
 const s=fixture(['kimi/owned'],'retry-nine'),result=await s.run(),member=result.provider_results[0];
 expect(member.status).toBe('failed');expect(member.execution.retry.count).toBe(0);
 const stdout=s.saved.find(item=>item.stream==='stdout').bytes.toString('utf8');
 expect(stdout.split('\n').filter(line=>line.includes('"type":"turn.step.retrying"'))).toHaveLength(9);
 expect(member.execution.recovery,'ORACLE-P10-RETRY-FACTS observed native retries are not host retry count').toEqual({fresh_execution_retry_count:0,provider_internal_retry_count:9,same_session_repair_count:0});
 expect(member.material_coverage.read).toEqual([]);persistedAudit(s,member);
});
test('ORACLE-P10-UNKNOWN-RETRY missing native retry history stays unknown with a specific explanation',async()=>{
 const s=fixture(['kimi/owned'],'unknown-retry'),result=await s.run(),member=result.provider_results[0];
 expect(member.status).toBe('failed');
 expect(member.execution.recovery??null,'no fabricated native retry zero').toBeNull();
 expect(member.unavailable_diagnostics?.message,'ORACLE-P10-UNKNOWN-RETRY diagnostics name unknown native retries').toMatch(/(?:retry|retries|重试)[\s\S]*(?:unknown|unavailable|undetermined|未知|不完整)/i);
});
test('ORACLE-P10-FAILURE-SIBLING rejected native session keeps a valid independent sibling finding and original failure',async()=>{
 const s=fixture(['antigravity/owned','codex/good'],'bad-session'),result=await s.run(),[bad,good]=result.provider_results;
 expect(result.status).toBe('available-with-failures');expect(bad.status).toBe('failed');expect(bad.material_coverage.read).toEqual([]);
 expect(good.status).toBe('completed');expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({provider:'codex/good',issue:'Owned sibling finding survives another provider failure'})]));
 expect(bad.evidence_refs.length).toBeGreaterThan(0);expect(good.evidence_refs.length).toBeGreaterThan(0);
 for(const member of [bad,good])for(const ref of member.evidence_refs)expect(existsSync(join(s.root,ref))).toBe(true);
});
test('ORACLE-P10-AUDIT-SAVE-FAILURE native audit failure is explicit while already saved streams and sibling remain',async()=>{
 const s=fixture(['antigravity/owned','codex/good'],'save-failure'),result=await s.run(),[bad,good]=result.provider_results;
 expect(s.auditCallbacks,'native audit save was attempted').toHaveLength(1);
 expect(bad.status,'ORACLE-P10-AUDIT-SAVE-FAILURE').toBe('failed');
 expect(bad.unavailable_diagnostics?.message).toContain('owned native audit save failed');
 expect(s.saved.some(item=>item.provider===bad.provider&&item.stream==='stdout')).toBe(true);
 expect(good.status).toBe('completed');expect(result.findings.some(item=>item.provider==='codex/good')).toBe(true);
});
test('ORACLE-P10-CANCEL-AUDIT cancellation retains already observed native events as original evidence',async()=>{
 const s=fixture(['antigravity/owned'],'cancel'),controller=new AbortController();
 const result=await s.run({controller,onProviderHealth:health=>{if(health.stderr_bytes>0)controller.abort('owned cancellation after read');}}),member=result.provider_results[0];
 expect(member.status).toBe('cancelled');expect(member.material_coverage.read).toEqual([]);
 persistedAudit(s,member);
 expect(s.saved.some(item=>item.stream==='stderr'&&item.bytes.includes(Buffer.from('NATIVE_READ_COMPLETE')))).toBe(true);
});
test('ORACLE-P10-CLEANUP-FAILURE owned Kimi trust cleanup error is explicit and saved provider originals remain',async()=>{
 const s=fixture(['kimi/owned'],'cleanup-failure');
 await expect(s.run()).rejects.toMatchObject({code:'OCR_PROVIDER_TRUST_CLEANUP_FAILED'});
 expect(s.saved.some(item=>item.stream==='stdout')).toBe(true);
 for(const original of s.saved)expect(readFileSync(join(s.root,original.ref))).toEqual(original.bytes);
});

test('ORACLE-P10-HASH-REJECT Kimi real reader rejects changed packet bytes and retains that raw denial',async()=>{
 const s=fixture(['kimi/owned'],'hash-mismatch'),result=await s.run(),member=result.provider_results[0];
 expect(member.material_coverage.read).not.toContain('src/unread.mjs');
 const audit=persistedAudit(s,member);
 const rows=audit.bytes.toString('utf8').trim().split('\n').map(JSON.parse);
 expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({path:'src/unread.mjs',allowed:false,code:'PACKET_READ_DENIED',reason:'file changed'})]));
});


test('ORACLE-P10-OUTPUT-TRUNCATION real native cap preserves prefix, unknown retry total and partial audit',async()=>{
 const s=fixture(['kimi/owned'],'output-truncated'),controller=new AbortController();
 const result=await s.run({controller}),member=result.provider_results[0];
 expect(controller.signal.aborted,'fixture watchdog must not cause this terminal outcome').toBe(false);
 expect(member.status).toBe('failed');expect(member.error?.code).toBe('OCR_PROVIDER_OUTPUT_LIMIT');
 const diagnostic=member.unavailable_diagnostics?.message??'';
 expect(diagnostic).toContain('captured_output_limited=true');
 expect(diagnostic).toContain('captured_stdout_bytes=16777216');
 const stdout=s.saved.find(item=>item.provider===member.provider&&item.stream==='stdout');
 expect(Boolean(stdout),'actual stdout original exists').toBe(true);
 expect(stdout.bytes.length,'actual native captured prefix length').toBe(16*1024*1024);
 const header=Buffer.from('{"role":"meta","type":"session.resume_hint","session_id":"owned-native-observation"}\n'
  +'{"role":"meta","type":"turn.step.retrying","failed_attempt":1,"next_attempt":2,"max_attempts":10,"delay_ms":1,"error_name":"APIConnectionError","error_message":"Connection error."}\n');
 const nextRetry=Buffer.from('{"role":"meta","type":"turn.step.retrying","failed_attempt":2,"next_attempt":3,"max_attempts":10,"delay_ms":1,"error_name":"APIConnectionError","error_message":"Connection error."}\n');
 const expectedPrefix=Buffer.concat([header,Buffer.alloc(16*1024*1024-32-header.length-1,0x70),Buffer.from('\n'),nextRetry.subarray(0,32)]);
 expect(stdout.bytes.equals(expectedPrefix),'ORACLE-P10-OUTPUT-TRUNCATION raw bytes are the exact emitted prefix').toBe(true);
 expect(stdout.bytes.subarray(-32).equals(nextRetry.subarray(0,32)),'second retry event is actually incomplete').toBe(true);
 expect(member.raw_output_ref).toBe(stdout.ref);expect(member.evidence_refs).toContain(stdout.ref);
 expect(readFileSync(join(s.root,stdout.ref)).equals(expectedPrefix),'stdout ref still reads original bytes').toBe(true);
 expect(member.raw_output_sha256).toBe(hash(expectedPrefix));
 expect(member.execution.recovery??null,'visible retry prefix cannot establish complete count zero or one').toBeNull();
 expect(member.coverage.read_confirmed).not.toBe(true);
 expect(member.material_coverage).toEqual({provider:'kimi/owned',read:[],unread:[],undetermined:['src/read.mjs','src/unread.mjs']});
 console.log('ORACLE-P10-OUTPUT-TRUNCATION reached: native output limit; exact 16777216-byte prefix and incomplete retry suffix; original stdout ref/hash; recovery unknown; failed coverage undetermined; watchdog=false');
 const audit=persistedAudit(s,member);
 const rows=audit.bytes.toString('utf8').trim().split('\n').map(JSON.parse);
 expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({path:'src/unread.mjs',allowed:true,offset:0,bytes_returned:32,has_more:true})]));
 expect(s.auditCallbacks).toHaveLength(1);expect(s.launches()).toHaveLength(1);
 expect(existsSync(s.launches()[0].cwd),'native packet disposed after originals were persisted').toBe(false);
 expect(readFileSync(join(s.root,audit.ref)).equals(audit.bytes),'audit survives packet cleanup').toBe(true);
 expect(readFileSync(join(s.root,stdout.ref)).equals(expectedPrefix),'stdout survives packet cleanup').toBe(true);
},15_000);


test('ORACLE-P10-AG-PARTIAL-LINES successful one-line tool result does not certify a three-line file',async()=>{
 const s=fixture(['antigravity/owned'],'ag-partial-lines'),result=await s.run(),member=result.provider_results[0];
 expect(member.status,'fixture real AG hook/CLI must complete without hash or protocol error').toBe('completed');
 const stdout=s.saved.find(item=>item.provider===member.provider&&item.stream==='stdout');
 expect(Boolean(stdout)).toBe(true);
 const observed=stdout.bytes.toString('utf8').trim().split('\n').map(JSON.parse).find(row=>row.event==='owned.partial-observation');
 expect(observed).toEqual({event:'owned.partial-observation',path:'src/read.mjs',StartLine:1,EndLine:1,visible:'export const first = 1;\n'});
 expect(readFileSync(join(s.packet.root,'src/read.mjs'),'utf8')).toBe('export const first = 1;\nexport const second = 2;\nexport const third = 3;\n');
 console.log('ORACLE-P10-AG-PARTIAL-LINES reached: real pre/post allowed StartLine=1 EndLine=1; fake provider visible result is only first of three lines; other selected path fully read');
 expect(member.coverage.read_confirmed,'ORACLE-P10-AG-PARTIAL-LINES path presence cannot certify full file').not.toBe(true);
 expect(member.material_coverage).toEqual({provider:'antigravity/owned',read:['src/unread.mjs'],unread:[],undetermined:['src/read.mjs']});
 const audit=persistedAudit(s,member);
 const raw=audit.bytes.toString('utf8');
 expect(raw,'original requested line range is retained in native audit').toContain('"StartLine":1');
 expect(raw).toContain('"EndLine":1');
 expect(s.auditCallbacks).toHaveLength(1);expect(s.launches()).toHaveLength(1);
 expect(existsSync(s.launches()[0].cwd)).toBe(false);
 expect(readFileSync(join(s.root,audit.ref)).equals(audit.bytes)).toBe(true);
},15_000);

test('ORACLE-P10-KIMI-PAGE-HOLE duplicate bytes and a last page do not fill an unread middle range',async()=>{
 const s=fixture(['kimi/owned'],'kimi-page-hole'),result=await s.run(),member=result.provider_results[0];
 expect(member.status,'fixture real MCP/CLI must complete without hash or parameter error').toBe('completed');
 const expectedHash=hash('//'+'h'.repeat(285)+'\n');
 expect(readFileSync(join(s.packet.root,'src/unread.mjs')).length).toBe(288);
 const stdout=s.saved.find(item=>item.provider===member.provider&&item.stream==='stdout');
 expect(Boolean(stdout)).toBe(true);
 const observed=stdout.bytes.toString('utf8').trim().split('\n').map(JSON.parse).find(row=>row.type==='owned.page-observation');
 expect(observed).toEqual({role:'meta',type:'owned.page-observation',path:'src/unread.mjs',pages:[
  {offset:0,bytes_returned:128,total_bytes:288,has_more:true,sha256:expectedHash},
  {offset:0,bytes_returned:128,total_bytes:288,has_more:true,sha256:expectedHash},
  {offset:224,bytes_returned:64,total_bytes:288,has_more:false,sha256:expectedHash},
 ]});
 expect(observed.pages.reduce((sum,page)=>sum+page.bytes_returned,0)).toBe(320);
 expect(member.material_coverage.read,'ORACLE-P10-KIMI-PAGE-HOLE [128,224) remains unread').not.toContain('src/unread.mjs');
 expect(member.material_coverage.undetermined).toContain('src/unread.mjs');
 expect(member.coverage.read_confirmed).not.toBe(true);
 console.log('ORACLE-P10-KIMI-PAGE-HOLE reached: real MCP returned (0,128,true),(0,128,true),(224,64,false) from 288 bytes; 320 returned with fixed 96-byte hole; partial path remains undetermined');
 const audit=persistedAudit(s,member);
 const rows=audit.bytes.toString('utf8').trim().split('\n').map(JSON.parse).filter(row=>row.path==='src/unread.mjs');
 expect(rows.map(row=>({allowed:row.allowed,bytes:row.bytes,sha256:row.sha256,offset:row.offset,bytes_returned:row.bytes_returned,has_more:row.has_more}))).toEqual([
  {allowed:true,bytes:288,sha256:expectedHash,offset:0,bytes_returned:128,has_more:true},
  {allowed:true,bytes:288,sha256:expectedHash,offset:0,bytes_returned:128,has_more:true},
  {allowed:true,bytes:288,sha256:expectedHash,offset:224,bytes_returned:64,has_more:false},
 ]);
 expect(member.material_coverage.read).toContain('src/read.mjs');
 expect(s.auditCallbacks).toHaveLength(1);expect(s.launches()).toHaveLength(1);
 expect(existsSync(s.launches()[0].cwd)).toBe(false);
 expect(readFileSync(join(s.root,audit.ref)).equals(audit.bytes)).toBe(true);
},15_000);

// TCR112: append-only configured-host -> round -> canonical review-writer regression.
import { runOcrDelegationRound } from '../../runtime/review/ocr-delegation-adapter.mjs';
import { recordSimpleReviewRequest } from '../../runtime/review/review-record-route.mjs';

async function runCleanupThroughWriter(cancelDuringFinalization){
 const s=fixture(['kimi/owned','codex/good'],'cleanup-failure');
 const providers=['kimi/owned','codex/good'],executable=join(s.root,'owned-cli');
 writeFileSync(join(s.root,'task.json'),JSON.stringify({task_id:'owned-round-writer-cleanup',activation_cohort:'post'}));
 const instructions='Do not invoke Agent, subagent, child-agent, or other agent tools.\nDo not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools.\nInspect only this supplied packet.\n';
 writeFileSync(join(s.packet.root,'review-instructions.md'),instructions);
 const manifest=[...s.packet.manifest,{path:'review-instructions.md',bytes:Buffer.byteLength(instructions),sha256:hash(instructions)}];
 const bundle={bundleRoot:s.packet.root,materialId:s.packet.material_id,manifest};
 const materials=Object.fromEntries(manifest.map(({path})=>[path,readFileSync(join(s.packet.root,path),'utf8')]));
 const trustedContext={trusted:{},route:{mode:'single_round',},selection:{providers,provider_identities:Object.fromEntries(providers.map(provider=>[provider,{source_id:provider+'-source',config_id:provider+'-config'}]))},providerConfig:{providers:Object.fromEntries(providers.map(provider=>[provider,{enabled:true,command:executable,model:'owned-test'}]))}};
 const observed=[],originals=[],controller=new AbortController();
 let dispatched=false,hostRejection=null,watchdogFired=false,receipt;
 const previousHome=process.env.KIMI_CODE_HOME;process.env.KIMI_CODE_HOME=join(s.root,'kimi-home');
 const watchdog=setTimeout(()=>{watchdogFired=true;controller.abort('owned round-writer watchdog');},20_000);
 try{
  receipt=await recordSimpleReviewRequest({taskDir:s.root,request:{...request,materials},signal:controller.signal,
   runRound:(roundRequest,{signal,onProviderOutput})=>runOcrDelegationRound(roundRequest,{
    signal,buildBundle:()=>bundle,
    onProviderResult:event=>{
     observed.push(event.result);
     if(cancelDuringFinalization&&observed.length===2&&observed.every(member=>['completed','failed','cancelled'].includes(member.status))
      &&observed.some(member=>member.provider==='codex/good'&&member.status==='completed'&&member.findings.some(finding=>finding.issue==='Owned sibling finding survives another provider failure'))){
      controller.abort('owned cancellation during terminal group finalization');
     }
    },
    executor:async context=>{
     dispatched=true;
     try{return await runConfiguredOcrHostReview(context,{trustedContext,healthPollMs:20,onProviderResult:context.onProviderResult,
      rawOutputSink:async(_hint,bytes,metadata)=>{
       expect(Buffer.isBuffer(bytes),'fixture sink receives real original bytes').toBe(true);
       const kind=s.auditKind(bytes);
       if(kind){
        const launch=s.launches().find(item=>item.adapter==='kimi');
        expect(launch,'setup: actual Kimi CLI reached terminal output').toBeDefined();
        expect(existsSync(launch.cwd),'setup: native audit captured before packet disposal').toBe(true);
        expect(readFileSync(join(launch.cwd,'.ocr-kimi-read/audit.jsonl')),'real native audit source equals writer input').toEqual(bytes);
       }
       const ref=await onProviderOutput({provider:metadata.provider,role:metadata.stream,output:bytes});
       originals.push({provider:metadata.provider,stream:metadata.stream,kind,ref,bytes:Buffer.from(bytes)});
       return ref;
      },
     });}catch(error){hostRejection=error;throw error;}
    },
   }),
  });
 }finally{
  clearTimeout(watchdog);
  if(previousHome===undefined)delete process.env.KIMI_CODE_HOME;else process.env.KIMI_CODE_HOME=previousHome;
 }
 const record=JSON.parse(readFileSync(receipt.path,'utf8'));
 expect(watchdogFired,'setup: watchdog is not the requested cancellation trigger').toBe(false);
 expect(dispatched,'setup: installed OCR packet preparation must reach the real executor').toBe(true);
 expect(observed.map(member=>member.provider).sort(),'setup: both real member terminal callbacks occurred').toEqual(['codex/good','kimi/owned']);
 expect(observed.every(member=>['completed','failed','cancelled'].includes(member.status)),'setup: no unknown member terminal state').toBe(true);
 const observedGood=observed.find(member=>member.provider==='codex/good');
 expect(observedGood.status,'fixed sibling positive control').toBe('completed');
 expect(observedGood.findings).toEqual(expect.arrayContaining([expect.objectContaining({provider:'codex/good',severity:'major',path:'src/read.mjs',line:1,issue:'Owned sibling finding survives another provider failure',evidence:'export const read = true;'})]));
 expect(hostRejection?.code,'setup: real trust cleanup failed, not a synthetic executor error').toBe('OCR_PROVIDER_TRUST_CLEANUP_FAILED');
 for(const original of originals)expect(original.bytes.toString('utf8'),'setup: owned CLI completed without fixture failure').not.toContain('FIXTURE_FAILURE:');
 expect(originals.some(item=>item.provider==='kimi/owned'&&item.kind==='kimi'),'setup: real Kimi audit reached the writer sink').toBe(true);
 expect(originals.some(item=>item.provider==='codex/good'&&item.stream==='stdout'&&item.bytes.length>0),'setup: real Codex output reached the writer sink').toBe(true);
 console.log(`ORACLE-P10-ROUND-WRITER-${cancelDuringFinalization?'CANCEL-CLEANUP':'CLEANUP'} reached: real configured host, two terminal observations, literal sibling finding, genuine trust-cleanup rejection, persisted writer JSON; watchdog=false; terminal-finalization cancellation=${controller.signal.aborted}`);
 expect(record.provider_results.map(member=>member.provider).sort(),'ORACLE-P10-ROUND-WRITER real members survive persisted round conversion').toEqual(['codex/good','kimi/owned']);
 for(const member of observed){
  const persisted=record.provider_results.find(item=>item.provider===member.provider);
  for(const key of ['status','identity','raw_output_ref','evidence_refs','raw_output_sha256','material_coverage','coverage','execution','parse_outcome','process_outcome']){
   expect(persisted[key],`${member.provider} retains observed ${key}`).toEqual(member[key]);
  }
  expect(persisted.identity).toMatchObject({provider:member.provider,source_id:member.provider+'-source',config_id:member.provider+'-config',model:'owned-test'});
 }
 expect(record.provider_results.find(member=>member.provider==='codex/good').status).toBe('completed');
 expect(record.findings).toEqual(expect.arrayContaining([expect.objectContaining({provider:'codex/good',severity:'major',path:'src/read.mjs',line:1,issue:'Owned sibling finding survives another provider failure',recommendation:'Preserve the owned finding',evidence_kind:'direct',evidence:'export const read = true;',root_cause:'Deterministic sibling fixture'})]));
 for(const original of originals.filter(item=>item.ref)){
  const member=record.provider_results.find(item=>item.provider===original.provider);
  expect([member.raw_output_ref,...(member.evidence_refs??[])],`${original.provider} retains its own original reference`).toContain(original.ref);
  const reread=readFileSync(join(s.root,original.ref));
  expect(reread,'persisted reference reads exact original bytes').toEqual(original.bytes);
  expect(hash(reread)).toBe(hash(original.bytes));
  if(member.raw_output_ref===original.ref)expect(member.raw_output_sha256).toBe(hash(original.bytes));
 }
 expect(record.status,'cleanup failure remains unavailable despite surviving facts').toBe('unavailable');
 expect(controller.signal.aborted).toBe(cancelDuringFinalization);
 if(cancelDuringFinalization){
  expect(record.error.code).toBe('REVIEW_CANCELLED');
  expect(record.cancellation.termination_confirmed).toBe(true);
  expect(record.executor_error,'cancellation retains actual cleanup diagnostic').toContain('OCR_PROVIDER_TRUST_CLEANUP_FAILED');
 }else expect(record.error.code).toBe('OCR_PROVIDER_TRUST_CLEANUP_FAILED');
 expect(process.env.KIMI_CODE_HOME).toBe(previousHome);
 for(const launch of s.launches())expect(existsSync(launch.cwd),'round packet disposed after retaining originals').toBe(false);
 return record;
}

test('ORACLE-P10-ROUND-WRITER-CLEANUP real cleanup failure retains provider facts and originals in persisted review',async()=>{
 await runCleanupThroughWriter(false);
},30_000);

test('ORACLE-P10-ROUND-WRITER-CANCEL-CLEANUP terminal-finalization cancellation retains cleanup failure and sibling in persisted review',async()=>{
 await runCleanupThroughWriter(true);
},30_000);


// E135/E138/E140: real native prompt completeness and custom-executor audit ownership.
import { execFileSync } from 'node:child_process';

test.each([
 ['kimi-prompt-partial','failed'],
 ['kimi-prompt-hole','failed'],
 ['kimi-prompt-pages','completed'],
])('ORACLE-P10-PROMPT-CHAIN %s uses actual MCP page proof',async(mode,status)=>{
 const s=fixture(['kimi/owned'],mode),result=await s.run(),member=result.provider_results[0];
 const stdout=s.saved.find(item=>item.provider==='kimi/owned'&&item.stream==='stdout');
 expect(stdout,'setup: actual Kimi stdout is persisted').toBeDefined();
 expect(stdout.bytes.toString('utf8'),'setup: no fixture protocol failure').not.toContain('FIXTURE_FAILURE:');
 const observed=stdout.bytes.toString('utf8').trim().split('\n').map(JSON.parse).find(row=>row.type==='owned.prompt-pages');
 expect(observed,'setup: real MCP prompt pages observed').toBeDefined();
 const pages=observed.pages,total=pages[0].total_bytes;
 expect(total).toBeGreaterThan(96);
 for(const page of pages){expect(page.total_bytes).toBe(total);expect(page.content_bytes).toBe(page.bytes_returned);expect(page.sha256).toBe(pages[0].sha256);expect(page.sha256).toMatch(/^[a-f0-9]{64}$/);}
 if(mode==='kimi-prompt-partial')expect(pages.map(({offset,bytes_returned,has_more})=>({offset,bytes_returned,has_more}))).toEqual([{offset:0,bytes_returned:32,has_more:true}]);
 else if(mode==='kimi-prompt-hole'){
  expect(pages.map(({offset,bytes_returned,has_more})=>({offset,bytes_returned,has_more}))).toEqual([
   {offset:0,bytes_returned:32,has_more:true},{offset:0,bytes_returned:32,has_more:true},{offset:total-32,bytes_returned:32,has_more:false},
  ]);
  expect(total-64,'setup: genuine nonzero unread middle remains').toBeGreaterThan(32);
 }else{
  expect(pages.length).toBeGreaterThan(1);let next=0;
  for(const page of pages){expect(page.offset).toBe(next);next+=page.bytes_returned;expect(page.has_more).toBe(next<total);}
  expect(next).toBe(total);expect(pages.at(-1).has_more).toBe(false);
 }
 expect(member.status,'ORACLE-P10-PROMPT-CHAIN full prompt proof determines acceptance').toBe(status);
 if(status==='failed'){expect(member.error.code).toBe('OCR_PROVIDER_PACKET_GUARD_FAILED');expect(member.error.message).toMatch(/prompt read was not confirmed/);expect(member.material_coverage.read).toEqual([]);}
 else expect(member.material_coverage.read).toContain('src/read.mjs');
 const audit=persistedAudit(s,member),rows=audit.bytes.toString('utf8').trim().split('\n').map(JSON.parse).filter(row=>row.path==='review-prompt.md');
 expect(rows.map(row=>({allowed:row.allowed,offset:row.offset,bytes_returned:row.bytes_returned,bytes:row.bytes,has_more:row.has_more,sha256:row.sha256}))).toEqual(pages.map(page=>({allowed:true,offset:page.offset,bytes_returned:page.bytes_returned,bytes:page.total_bytes,has_more:page.has_more,sha256:page.sha256})));
 expect(s.auditCallbacks).toHaveLength(1);expect(existsSync(s.launches()[0].cwd)).toBe(false);
 expect(hash(readFileSync(join(s.root,audit.ref)))).toBe(hash(audit.bytes));
},15_000);

test('ORACLE-P10-AG-PROMPT-PARTIAL actual one-line prompt result fails despite valid full packet file reads',async()=>{
 const s=fixture(['antigravity/owned'],'ag-prompt-partial'),result=await s.run(),member=result.provider_results[0];
 const stdout=s.saved.find(item=>item.stream==='stdout');expect(stdout).toBeDefined();
 expect(stdout.bytes.toString('utf8'),'setup: actual CLI has no protocol failure').not.toContain('FIXTURE_FAILURE:');
 const observed=stdout.bytes.toString('utf8').trim().split('\n').map(JSON.parse).find(row=>row.event==='owned.prompt-partial');
 expect(observed).toMatchObject({path:'review-prompt.md',StartLine:1,EndLine:1});
 expect(Buffer.byteLength(observed.visible)).toBeLessThan(observed.total_bytes);expect(observed.visible.split('\n')).toHaveLength(2);
 expect(member.status,'ORACLE-P10-AG-PROMPT-PARTIAL full_file_result is required for prompt').toBe('failed');
 expect(member.error.code).toBe('OCR_PROVIDER_PACKET_GUARD_FAILED');expect(member.error.message).toMatch(/prompt read was not confirmed/);
 expect(member.material_coverage.read).toEqual([]);
 const audit=persistedAudit(s,member),rows=audit.bytes.toString('utf8').trim().split('\n').map(JSON.parse);
 expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({path:'review-prompt.md',phase:'post',StartLine:1,EndLine:1,full_file_result:false})]));
 for(const file of ['src/read.mjs','src/unread.mjs'])expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({path:file,phase:'post',full_file_result:true})]));
 expect(s.auditCallbacks).toHaveLength(1);expect(existsSync(s.launches()[0].cwd)).toBe(false);expect(hash(readFileSync(join(s.root,audit.ref)))).toBe(hash(audit.bytes));
},15_000);

function realAgExecutorWithoutRawBuffers(observed){
 return async({profile,cwd})=>{
  const output=execFileSync(profile.command,[],{cwd,encoding:'utf8',timeout:5000});
  const init=output.trim().split('\n').map(JSON.parse).find(row=>row.event==='init');
  expect(init,'setup: actual owned CLI emitted native session').toBeDefined();
  observed.push({cwd,bytes:readFileSync(join(cwd,'.ocr-ag-guard/events.jsonl'))});
  return {status:'completed',output,session_id:init.conversation_id};
 };
}

test.each(['saved','save-failure','no-sink'])('ORACLE-P10-AUDIT-ONLY %s keeps genuine AG audit without raw stdout/stderr',async(mode)=>{
 const s=fixture(['antigravity/owned'],mode==='save-failure'?'save-failure':'partial'),observed=[];
 const result=await s.run({providerExecutor:realAgExecutorWithoutRawBuffers(observed),...(mode==='no-sink'?{rawOutputSink:null}:{})}),member=result.provider_results[0];
 expect(observed,'setup: actual custom CLI completed, not fabricated output').toHaveLength(1);
 const rows=observed[0].bytes.toString('utf8').trim().split('\n').map(JSON.parse);
 expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({path:'review-prompt.md',phase:'post',full_file_result:true})]));
 expect(member.unavailable_diagnostics.message).toContain('executor did not return stdout/stderr Buffers');
 if(mode==='saved'){
  expect(member.status).toBe('completed');
  const audit=persistedAudit(s,member);expect(s.saved).toHaveLength(1);expect(s.auditCallbacks).toHaveLength(1);
  expect(audit.bytes).toEqual(observed[0].bytes);expect(member.raw_output_ref).toBe(audit.ref);expect(member.raw_output_sha256).toBe(hash(observed[0].bytes));
  expect(readFileSync(join(s.root,audit.ref))).toEqual(observed[0].bytes);
 }else if(mode==='save-failure'){
  expect(s.auditCallbacks,'ORACLE-P10-AUDIT-ONLY original audit reaches actual failing sink').toHaveLength(1);
  expect(s.auditCallbacks[0].bytes).toEqual(observed[0].bytes);expect(member.status).toBe('failed');expect(member.error.code).toBe('OCR_PROVIDER_OUTPUT_SAVE_FAILED');
  expect(member.unavailable_diagnostics.message).toContain('raw_output_save_error=native-audit:');expect(member.unavailable_diagnostics.message).toContain('owned native audit save failed');
  expect(s.saved).toHaveLength(0);expect(member.raw_output_ref).toBeNull();expect(member.evidence_refs??[]).toEqual([]);expect(member.material_coverage.read).toEqual([]);
 }else{
  expect(s.auditCallbacks).toHaveLength(0);expect(s.saved).toHaveLength(0);expect(member.raw_output_ref).toBeNull();expect(member.evidence_refs??[]).toEqual([]);
  expect(member.unavailable_diagnostics.message,'ORACLE-P10-AUDIT-ONLY absent sink diagnoses native audit loss').toContain('native-audit original bytes not persisted: raw output sink is absent');
  expect(member.material_coverage.read).toEqual([]);
 }
 expect(existsSync(observed[0].cwd),'actual packet disposed after audit observation').toBe(false);
},15_000);
