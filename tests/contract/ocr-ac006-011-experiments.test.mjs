// Direct native completion, explicit cancellation and owned-owner loss; no WorkflowHub provider wall-clock or env-gated live reviews.
import{afterEach,expect,it}from"vitest";import{createHash}from"node:crypto";import{existsSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync}from"node:fs";import{tmpdir}from"node:os";import{join}from"node:path";import{prepareConfiguredOcrHostContext,runConfiguredOcrHostReview}from"../../runtime/review/ocr-delegation-adapter.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});const sha=b=>createHash("sha256").update(b).digest("hex");
function packet(){const root=realpathSync(mkdtempSync(join(tmpdir(),"owned-ocr-experiment-")));roots.push(root);mkdirSync(join(root,"src"));const body="export const reviewed = true;\n",path="src/reviewed.mjs";writeFileSync(join(root,path),body);return{root,preview:{reviewable_files:[{path}]},rules:{rules:[{path,rule:"Inspect actual correctness."}]},manifest:[{path,bytes:Buffer.byteLength(body),sha256:sha(body)}]};}
const request={stage:"verify-code",surface:"code",subject_kind:"worktree"};const output=()=>JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\n"+JSON.stringify({type:"turn.completed"})+"\n";
function context(root,profiles,initial=Object.keys(profiles),mode="single_round"){const config=join(root,"providers.json");writeFileSync(config,JSON.stringify({providers:profiles}));return prepareConfiguredOcrHostContext(request,{loadConfig:()=>({config,whReview:{version:2,stages:{"verify-code":{initial,mode}}}})});}
import{spawn}from"node:child_process";import{appendRecord}from"../../runtime/interface/safe-write.mjs";
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,limit=5000){const end=Date.now()+limit;while(!fn()&&Date.now()<end)await delay(20);expect(fn()).toBe(true);}
function native(p,providers=["codex/active"]){const marker=join(p.root,"started.json"),command=join(p.root,"owned-provider");writeFileSync(command,`#!${process.execPath}\nconst fs=require('node:fs');const model=process.argv[process.argv.indexOf('--model')+1];if(model==='fast'){process.stdout.write(${JSON.stringify(output())});}else{fs.writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:process.pid,cwd:process.cwd()}));process.stdout.write(Buffer.from([255,65,0]));process.on('SIGTERM',()=>process.exit(0));setInterval(()=>process.stderr.write('owned healthy tick\\n'),20);}`,{mode:0o700});return{marker,command,trustedContext:context(p.root,Object.fromEntries(providers.map(x=>[x,{enabled:true,command,model:x.split('/')[1],source_id:x}]))) };}
function alive(pid){try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;throw e;}}
it("direct native completion beyond the former 600000ms boundary preserves completed sibling and actual raw bytes",async()=>{
 const p=packet(),n=native(p,["codex/fast","codex/active"]);
 // Only this owned fixture completes normally; cancellation/ownerloss cases
 // keep their existing long-lived native helper unchanged.
 writeFileSync(n.command,String.raw`#!${process.execPath}
const fs=require('node:fs');const model=process.argv[process.argv.indexOf('--model')+1];
if(model==='fast')process.stdout.write(${JSON.stringify(output())});
else{
 fs.writeFileSync(${JSON.stringify(n.marker)},JSON.stringify({pid:process.pid,cwd:process.cwd()}));
 process.stdout.write(Buffer.from([255,65,0]));
 process.on('SIGTERM',()=>process.exit(0));
 const activity=setInterval(()=>process.stderr.write('owned healthy tick\n'),20);
 setTimeout(()=>{clearInterval(activity);process.stdout.write('\n'+${JSON.stringify(output())});},250);
}
`,{mode:0o700});
 const realTimer=globalThis.setTimeout,realClear=globalThis.clearTimeout,realNow=Date.now,start=realNow(),scheduled=[],raw=new Map(),c=new AbortController();
 let now=start,watchdogFired=false,pending;
 const watchdog=realTimer(()=>{watchdogFired=true;c.abort(Error('owned native completion watchdog'));},4000);
 Date.now=()=>now;
 globalThis.setTimeout=(fn,ms,...args)=>{if(ms!==600000)return realTimer(fn,ms,...args);scheduled.push(ms);return realTimer(fn,1500,...args);};
 try{
  pending=runConfiguredOcrHostReview({request,packet:p,signal:c.signal},{trustedContext:n.trustedContext,healthPollMs:20,
   onProviderHealth:health=>{if(health.provider==='codex/active'&&health.stdout_bytes>0)now=start+700000;},
   rawOutputSink:async(_hint,bytes,meta)=>{const dir=join(p.root,'quality','reviews');mkdirSync(dir,{recursive:true});const file=await appendRecord(dir,meta.provider.replaceAll('/','-')+'-'+meta.stream,'output',bytes);raw.set(meta.provider+':'+meta.stream,readFileSync(file));return 'quality/reviews/'+file.split('/').at(-1);}});
  const r=await pending,slow=r.provider_results.find(x=>x.provider==='codex/active'),fast=r.provider_results.find(x=>x.provider==='codex/fast');
  expect(watchdogFired).toBe(false);expect(scheduled).toEqual([]);
  expect(r.status).toBe('available');
  expect(slow).toMatchObject({status:'completed',process_outcome:'ok',parse_outcome:'ok',error:null});
  expect(slow.timing.duration_ms).toBeGreaterThanOrEqual(600000);
  expect(slow.execution.health).toMatchObject({status:'completed',liveness:false});
  expect(fast).toMatchObject({status:'completed',process_outcome:'ok',parse_outcome:'ok'});
  expect(raw.get('codex/fast:stdout').equals(Buffer.from(output()))).toBe(true);
  expect(raw.get('codex/active:stdout').equals(Buffer.concat([Buffer.from([255,65,0]),Buffer.from('\n'+output())]))).toBe(true);
  expect(raw.get('codex/active:stderr').toString()).toContain('owned healthy tick');
  const observed=JSON.parse(readFileSync(n.marker,'utf8'));
  expect(alive(observed.pid)).toBe(false);expect(existsSync(observed.cwd)).toBe(false);
 }finally{Date.now=realNow;globalThis.setTimeout=realTimer;globalThis.clearTimeout=realClear;realClear(watchdog);c.abort(Error('owned cleanup'));if(pending)await pending;}
});
it("explicit cancellation reaps the actual owned provider and removes its packet while preserving cancelled facts",async()=>{const p=packet(),n=native(p),c=new AbortController();let pending;try{pending=runConfiguredOcrHostReview({request,packet:p,signal:c.signal},{trustedContext:n.trustedContext,healthPollMs:20});await until(()=>existsSync(n.marker));const observed=JSON.parse(readFileSync(n.marker,'utf8'));expect(alive(observed.pid)).toBe(true);c.abort(Error('explicit owned cancellation'));const r=await pending;expect(r).toMatchObject({status:'unavailable',outcome:'cancelled',provider_results:[{status:'cancelled',error:{code:'OCR_PROVIDER_CANCELLED'}}]});expect(alive(observed.pid)).toBe(false);expect(existsSync(observed.cwd)).toBe(false);}finally{c.abort(Error('owned cleanup'));if(pending)await pending;}});
it.skipIf(process.platform==='win32')("uncatchable owned host loss reaps only its actual provider and packet",async()=>{const p=packet(),n=native(p),module=new URL('../../runtime/review/ocr-delegation-adapter.mjs',import.meta.url).href;const program=`import{runConfiguredOcrHostReview}from ${JSON.stringify(module)};await runConfiguredOcrHostReview({request:${JSON.stringify(request)},packet:${JSON.stringify(p)}},{trustedContext:${JSON.stringify(n.trustedContext)},healthPollMs:20});`;const child=spawn(process.execPath,['--input-type=module','-e',program],{stdio:['ignore','pipe','pipe']});let errors='',closed=false;child.stderr.on('data',b=>errors+=b);const closedPromise=new Promise(resolve=>child.once('close',()=>{closed=true;resolve();}));let observed;
 try{await until(()=>existsSync(n.marker)||closed);expect(existsSync(n.marker),errors).toBe(true);observed=JSON.parse(readFileSync(n.marker,'utf8'));expect(alive(observed.pid)).toBe(true);child.kill('SIGKILL');await closedPromise;await until(()=>!alive(observed.pid)&&!existsSync(observed.cwd),6000);}
 finally{if(!closed){child.kill('SIGTERM');await closedPromise;}if(observed&&alive(observed.pid))process.kill(observed.pid,'SIGKILL');}
});
it("controlled provider failure stays on its declared verify-code surface and never claims a clean review",async()=>{const p=packet(),ctx=context(p.root,{"codex/one":{enabled:true,model:'one'}});let calls=0;const r=await runConfiguredOcrHostReview({request,packet:p},{trustedContext:ctx,providerExecutor:async()=>{calls++;return{status:'failed',error:{code:'OWNED_UNAVAILABLE',message:'controlled unavailable'},output:null};}});expect(calls).toBe(1);expect(r.stage).toBe('verify-code');expect(r.status).toBe('unavailable');expect(r.findings).toEqual([]);expect(r.provider_results[0]).toMatchObject({status:'failed',error:{code:'OWNED_UNAVAILABLE'}});});


// Same code-surface wh-review executor used when deterministic OCR is absent.
// Both current client entry paths execute an owned real process; no model runs.
import { ReviewProviderClient } from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
it("code-surface wh-review native fallback completes beyond the former document budget with both current client entry paths",async()=>{
 for(const managed of [true,false]){
  const p=packet(),n=native(p),groups=[];
  const configPath=n.trustedContext.trusted.config;
  writeFileSync(configPath,JSON.stringify({...JSON.parse(readFileSync(configPath,"utf8")),tiers:[["codex/active"]]}));
  writeFileSync(n.command,String.raw`#!${process.execPath}
const fs=require('node:fs');
fs.writeFileSync(${JSON.stringify(n.marker)},JSON.stringify({pid:process.pid,cwd:process.cwd()}));
process.stdout.write(Buffer.from([255,10]));process.stderr.write(Buffer.from([254,0,10]));
process.stdout.write(JSON.stringify({type:'thread.started',thread_id:'owned-code-fallback'})+'\n');
setTimeout(()=>process.stdout.write(${JSON.stringify(output())}),250);
`,{mode:0o700});
  class ObservedClient extends ReviewProviderClient{
   async startManaged(options){const value=await super.startManaged(options);groups.push(value.group);return value;}
   async runGroup(options){const value=await super.runGroup(options);groups.push(value);return value;}
  }
  const client=new ObservedClient({command:[n.command],config:n.trustedContext.trusted.config});
  if(!managed)client.startManaged=undefined;
  const realTimer=globalThis.setTimeout,realClear=globalThis.clearTimeout,realNow=Date.now,start=realNow(),scheduled=[],controller=new AbortController();
  let watchdogFired=false,pending;
  const watchdog=realTimer(()=>{watchdogFired=true;controller.abort(Error('owned code fallback watchdog'));},5000);
  Date.now=()=>existsSync(n.marker)?start+700000:start;
  globalThis.setTimeout=(fn,ms,...args)=>{if(ms!==600000)return realTimer(fn,ms,...args);scheduled.push(ms);return realTimer(fn,1000,...args);};
  try{
   pending=runSimpleReview({stage:'verify-code',...(managed?{surface:'code'}:{}),activation_cohort:'post',materials:{
    changed_files:['src/reviewed.mjs'],implementation_assessment:'Inspect the complete owned source.',test_context:'Owned terminal evidence.',open_risks:'None declared.',review_instructions:'Review owned code.'
   }},{client,signal:controller.signal,
    loadConfig:()=>({...n.trustedContext.trusted,attachmentRoot:p.root,command:[n.command]}),
    resolveRoute:()=>({initial:['codex/active'],mode:'single_round',minimum_heterologous:1}),
    buildBundle:()=>({bundleRoot:p.root,attachmentRoot:p.root,materialId:'owned-code-fallback',deliveryManifest:p.manifest,dispose(){}}),
    onManagedTerminal:()=>{throw Error('native terminal must not enter managed polling');}
   });
   const result=await pending;
   expect(result.status,JSON.stringify(result.error)).toBe('available');
   expect(result.findings).toEqual([]);expect(watchdogFired).toBe(false);expect(scheduled).toEqual([]);
   expect(groups).toHaveLength(1);const member=groups[0].providers[0];
   expect(member).toMatchObject({status:'completed',session_id:'owned-code-fallback',observed_completed_response:true});
   expect(member.timing.duration_ms).toBeGreaterThanOrEqual(700000);expect(member.error).toBeNull();
   expect(member.raw_outputs).toHaveLength(1);
   const expected=Buffer.concat([Buffer.from([255,10]),Buffer.from(JSON.stringify({type:'thread.started',thread_id:'owned-code-fallback'})+'\n'),Buffer.from(output())]);
   expect(member.raw_outputs[0].stdout.equals(expected)).toBe(true);
   expect(member.raw_outputs[0].stderr.equals(Buffer.from([254,0,10]))).toBe(true);
   const marker=JSON.parse(readFileSync(n.marker,'utf8'));expect(alive(marker.pid)).toBe(false);expect(existsSync(marker.cwd)).toBe(false);
  }finally{controller.abort();if(pending)await pending.catch(()=>{});Date.now=realNow;globalThis.setTimeout=realTimer;globalThis.clearTimeout=realClear;realClear(watchdog);}
 }
});
