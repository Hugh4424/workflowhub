import {afterEach,describe,expect,it} from "vitest";
import {execFileSync,spawnSync,spawn} from "node:child_process";
import {mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync,existsSync,readdirSync,symlinkSync,linkSync} from "node:fs";
import {tmpdir} from "node:os";import{join}from"node:path";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function env(){const e={...process.env};for(const k of Object.keys(e))if(k.startsWith("GIT_"))delete e[k];return e;}
const git=(cwd,...args)=>execFileSync("git",args,{cwd,env:env(),encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
function root(){const p=realpathSync(mkdtempSync(join(tmpdir(),"card06-ordinary-consumer-")));roots.push(p);return p;}
function repository(p){mkdirSync(p);git(p,"init","-q","-b","main");git(p,"config","user.name","Owned ordinary test");git(p,"config","user.email","owned@test.invalid");writeFileSync(join(p,"README.md"),"owned baseline\n");git(p,"add",".");git(p,"commit","-qm","baseline");}
import{runPrivateTargetedCapture}from"../../workflows/build-code/targeted-capture.mjs";import{runTargetedCases}from"../../workflows/build-code/targeted-runner.mjs";
import{lstatSync,watch}from"node:fs";
import{createHash}from"node:crypto";
import{createTask,openTask}from"../../runtime/task/task-handle.mjs";
async function captureFixture(){const r=root();const task=await createTask({storageRoot:r,manifest:{schema_version:"1.0.0",project_name:"capture-fixture",task_id:"owned-process",created_at:"2026-11-02T00:00:00Z",target_repo_root:r,activation_cohort:"post",execution_mode:"per_invocation",record_model:"vnext-single-write",issue_ids:[],inputs:{}}});const records=task.recordPath("quality/tests");mkdirSync(records,{recursive:true});return{r,records,task};}
const cap=(f,slug,code,extra={})=>runPrivateTargetedCapture({task:f.task,cwd:f.r,recordDir:f.records,slug,argv:[process.execPath,"-e",code],...extra});
async function targetFixture(){const f=await captureFixture();mkdirSync(join(f.r,"tests"));const marker=join(f.r,"ran.marker"),target="tests/effect.test.mjs";writeFileSync(join(f.r,target),`import{test}from"node:test";import{writeFileSync}from"node:fs";test("owned effect",()=>writeFileSync(${JSON.stringify(marker)},"actual"));\n`);return{...f,target,marker};}
const selection=(target)=>({status:"selected",cases:[{id:"OWNED",execution:{target,expected_test_identity:"owned effect",runner:"node:test"}}]});
const run=(f,s=selection(f.target))=>runTargetedCases({workspaceRoot:f.r,selection:s,runner:{executable:process.execPath,fixedArgs:["--test","--test-reporter=tap"]}});
describe("ORACLE-P3-CAPTURE targeted command facts and owned process protection",()=>{
 it("preserves first pass and second real failure stdout/stderr in distinct immutable originals",async()=>{const f=await captureFixture(),first=await cap(f,"first",String.raw`process.stdout.write("first-pass\n");`),before=readFileSync(first.output_ref),second=await cap(f,"second",String.raw`process.stdout.write("second-fail\n");process.stderr.write("actual-stderr\n");process.exit(7);`);expect(first.exit_code).toBe(0);expect(second.exit_code).toBe(7);expect(readFileSync(second.output_ref,"utf8")).toContain("second-fail");expect(readFileSync(second.output_ref,"utf8")).toContain("actual-stderr");expect(readFileSync(first.output_ref)).toEqual(before);expect(first.output_ref).not.toBe(second.output_ref);expect(JSON.parse(readFileSync(second.receipt_ref))).toMatchObject({exit_code:7,output_ref:second.output_ref});});
 it("runs the fresh selected child and retains raw TAP and actual effect without receipt certification",async()=>{const f=await targetFixture();expect(existsSync(f.marker)).toBe(false);const result=await run(f);expect(result.status).toBe("completed");expect(readFileSync(f.marker,"utf8")).toBe("actual");expect(result.execution).toMatchObject({exit_code:0,source:"direct_runner",canonical_receipt:false});expect(result.execution.raw_output).toContain("ok 1 - owned effect");expect(result.observations).toMatchObject([{case_id:"OWNED",status:"passed",canonical_receipt:false}]);});
 it.each(["../outside.test.mjs","/tmp/outside.test.mjs","tests/missing.test.mjs"])("rejects %s before a target starts",async target=>{const f=await targetFixture(),result=await run(f,selection(target));expect(result.status).toBe("unavailable");expect(result.reason).toBe(target.includes("missing")?"missing_target":"unsafe_target");expect(existsSync(f.marker)).toBe(false);});
 it("rejects a later unsafe target before the earlier safe child can run",async()=>{const f=await targetFixture(),s=selection(f.target);s.cases.push({id:"UNSAFE",execution:{target:"../outside.test.mjs",expected_test_identity:"outside"}});expect(await run(f,s)).toMatchObject({status:"unavailable",reason:"unsafe_target",observations:[]});expect(existsSync(f.marker)).toBe(false);});
 it("does not execute unknown selection, duplicate case identities or shared target assignments",async()=>{const f=await targetFixture();expect(await run(f,{status:"unavailable",cases:[]})).toMatchObject({reason:"unknown_change_scope"});const s=selection(f.target);s.cases.push({...s.cases[0]});expect(await run(f,s)).toMatchObject({reason:"duplicate_case_id"});s.cases[1].id="OTHER";expect(await run(f,s)).toMatchObject({reason:"reporter_identity_mismatch"});expect(existsSync(f.marker)).toBe(false);});
 it("rejects a target symlink before running a declared test",async()=>{const f=await targetFixture(),outside=join(f.r,"outside.test.mjs");writeFileSync(outside,'process.exit(99);');rmSync(join(f.r,f.target));symlinkSync(outside,join(f.r,f.target));expect(await run(f)).toMatchObject({status:"unavailable",reason:"unsafe_target"});expect(existsSync(f.marker)).toBe(false);});
 it("uses the explicit timeout to stop a delayed side effect and preserves partial raw",async()=>{const f=await captureFixture(),late=join(f.r,"late.marker"),result=await cap(f,"timeout",`process.stdout.write("started");setTimeout(()=>require("node:fs").writeFileSync(${JSON.stringify(late)},"late"),5000);`,{timeoutMs:400});expect(result).toMatchObject({exit_code:124,timed_out:true,cancelled:false});expect(readFileSync(result.output_ref,"utf8")).toContain("started");expect(existsSync(late)).toBe(false);});
 it("cancels an actually started owned child and drains its output before return",async()=>{const f=await captureFixture(),marker=join(f.r,"child.json"),controller=new AbortController();const promise=cap(f,"cancel",`process.stdout.write("alive",()=>{require("node:fs").writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:process.pid}));setInterval(()=>{},1000);});`,{signal:controller.signal,timeoutMs:3000}).then(value=>({ok:true,value}),error=>({ok:false,error}));const deadline=Date.now()+2000;while(!existsSync(marker)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));try{expect(existsSync(marker)).toBe(true);const pid=JSON.parse(readFileSync(marker)).pid;controller.abort(Object.assign(new Error("owned cancel"),{code:"REVIEW_CANCELLED"}));const observed=await promise;expect(observed.ok).toBe(false);expect(observed.error.code).toBe("ABORT_ERR");const result=JSON.parse(readFileSync(observed.error.receipt_ref));expect(result.cancelled).toBe(true);expect(result.exit_code).toBe(130);expect(readFileSync(result.output_ref,"utf8")).toContain("alive");expect(()=>process.kill(pid,0)).toThrow();}finally{controller.abort();await promise.catch(()=>{});}});
 it("bounds oversized raw output without silently claiming the full stream",async()=>{const f=await captureFixture(),result=await cap(f,"large",'process.stdout.write("x".repeat(9*1024*1024));');expect(result.truncated).toBe(true);const raw=readFileSync(result.output_ref);expect(raw.subarray(0,8*1024*1024)).toEqual(Buffer.alloc(8*1024*1024,"x"));expect(raw.subarray(8*1024*1024).toString()).toBe("\n[TRUNCATED: output exceeded 8 MiB]\n");});
});

// Evidence sink is explicit test-run context, never an implicit task discovery.
// All absent means ephemeral unit-test mode; partial/invalid configuration fails.
const sinkKeys=["WH_CAPTURE_EVIDENCE_TASK_PATH","WH_CAPTURE_EVIDENCE_PROJECT","WH_CAPTURE_EVIDENCE_TASK"];
function evidenceSink(config=process.env){
 const values=sinkKeys.map(key=>config[key]);
 if(values.every(value=>value===undefined))return null;
 if(values.some(value=>typeof value!=="string"||!value.trim()))throw new Error("incomplete capture evidence sink configuration");
 return openTask(values[0],values[1],values[2]);
}
function bounded(promise,ms,label){
 let timer;
 return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+" deadline exceeded")),ms);})])
  .finally(()=>clearTimeout(timer));
}
const sha256=bytes=>createHash("sha256").update(bytes).digest("hex");
async function preserveNative(f,outcome,sink){
 const receiptRef=outcome?.value?.receipt_ref??outcome?.error?.receipt_ref;
 const receiptBytes=receiptRef&&existsSync(receiptRef)?readFileSync(receiptRef):null;
 const receipt=receiptBytes?JSON.parse(receiptBytes):null;
 const outputRefs=receipt?[receipt.output_ref]:readdirSync(f.records).filter(name=>name.endsWith(".output")).map(name=>join(f.records,name));
 if(!sink){const result={evidence_mode:"ephemeral",native_receipt_available:!!receiptBytes,retained:false};console.log(JSON.stringify(result));return result;}
 const mappings=[];
 // Each file is the original fact of this one invocation, never a fixture tree.
 for(const originalRef of outputRefs){
  const bytes=readFileSync(originalRef);
  const canonicalRef=await sink.appendRecord({dir:"quality/tests",slug:"p3-native-tree-raw",ext:"output",bytes});
  if(!readFileSync(canonicalRef).equals(bytes))throw new Error("native raw evidence readback differs");
  const item={kind:"raw",original_ref:originalRef,canonical_ref:canonicalRef,sha256:sha256(bytes),bytes:bytes.length};
  mappings.push(item);console.log(JSON.stringify({preserved_native_part:item}));
 }
 if(receiptBytes){
  const canonicalRef=await sink.appendRecord({dir:"quality/tests",slug:"p3-native-tree-receipt",ext:"json",bytes:receiptBytes});
  if(!readFileSync(canonicalRef).equals(receiptBytes))throw new Error("native receipt evidence readback differs");
  const item={kind:"receipt",original_ref:receiptRef,canonical_ref:canonicalRef,sha256:sha256(receiptBytes),bytes:receiptBytes.length};
  mappings.push(item);console.log(JSON.stringify({preserved_native_part:item}));
 }
 const result={evidence_mode:"authenticated-task",task_id:sink.identity.taskId,run_id:receiptRef??"unavailable: capture did not publish receipt",step_slug:"ORACLE-P3-CAPTURE",created_at:receipt?.started_at??new Date().toISOString(),native_receipt_available:!!receiptBytes,mappings,
  original_ref_cleanup:"fixture originals will be removed; immutable saved receipt retains old output_ref; resolve that path using raw mapping above"};
 console.log(JSON.stringify({native_evidence:result}));return result;
}
function cleanupOwned(state){
 if(!state)return;
 // Captured child is the leader of the group this fixture created.
 try{process.kill(-state.child,"SIGKILL");}catch(error){if(error.code!=="ESRCH")throw error;}
 for(const pid of [state.child,state.grandchild])if(pidExists(pid)){try{process.kill(pid,"SIGKILL");}catch(error){if(error.code!=="ESRCH")throw error;}}
}

// Real, bounded POSIX fixture. Readiness is an event, never inferred from exit 0.
function readyEvent(directory, path) {
 let watcher,timer;
 const promise=new Promise((resolve,reject)=>{
  watcher=watch(directory,()=>{
   if(!existsSync(path))return;
   try{resolve(JSON.parse(readFileSync(path,"utf8")));}catch(error){reject(error);}
  });
  timer=setTimeout(()=>reject(new Error("owned process tree readiness unavailable")),2000);
 });
 return {promise,close(){watcher.close();clearTimeout(timer);}};
}
function pidExists(pid){try{process.kill(pid,0);return true;}catch(error){if(error.code==="ESRCH")return false;throw error;}}
function processTree(f){
 const ready=join(f.r,"tree-ready.json"),childEffect=join(f.r,"child-effect"),grandEffect=join(f.r,"grandchild-effect");
 const grand=join(f.r,"grandchild.cjs"),child=join(f.r,"child.cjs");
 writeFileSync(grand,`const due=Date.now()+2200;setTimeout(()=>require("node:fs").writeFileSync(${JSON.stringify(grandEffect)},"survived"),2200);process.send({pid:process.pid,due});setInterval(()=>{},1000);`);
 writeFileSync(child,`const fs=require("node:fs"),due=Date.now()+2200;setTimeout(()=>fs.writeFileSync(${JSON.stringify(childEffect)},"survived"),2200);const grand=require("node:child_process").fork(${JSON.stringify(grand)},[],{stdio:["ignore","inherit","inherit","ipc"]});grand.once("message",message=>{const state={child:process.pid,grandchild:message.pid,child_due:due,grandchild_due:message.due,ready_at:Date.now()};fs.writeFileSync(${JSON.stringify(ready+'.tmp')},JSON.stringify(state));process.stdout.write("tree-ready\\n",()=>fs.renameSync(${JSON.stringify(ready+'.tmp')},${JSON.stringify(ready)}));});setInterval(()=>{},1000);`);
 return {ready,child,childEffect,grandEffect};
}
describe("ORACLE-P3-CAPTURE actual child and grandchild",()=>{
 it.each(["timeout","cancel"])("reaps both ready PIDs on %s and observes past both delayed writes",async mode=>{
  const sink=evidenceSink(),f=await captureFixture(),tree=processTree(f),readiness=readyEvent(f.r,tree.ready),controller=new AbortController();
  let state,observed,cleanupError;
  const execution=runPrivateTargetedCapture({task:f.task,cwd:f.r,recordDir:f.records,slug:"tree-"+mode,argv:[process.execPath,tree.child],timeoutMs:mode==="timeout"?1200:4000,signal:controller.signal})
   .then(value=>({value}),error=>({error}));
  try{
   state=await readiness.promise;
   expect(state.child).toBeGreaterThan(0);expect(state.grandchild).toBeGreaterThan(0);
   expect(state.child).not.toBe(state.grandchild);
   expect(pidExists(state.child)).toBe(true);expect(pidExists(state.grandchild)).toBe(true);
   if(mode==="cancel")controller.abort(new Error("owned fixture cancellation"));
   // Independent fixture deadline starts after both PIDs are ready; below Vitest 10s.
   observed=await bounded(execution,4500,"owned capture execution");
   if(mode==="cancel")expect(observed.error?.code).toBe("ABORT_ERR");
   else expect(observed.error).toBeUndefined();
   const receipt=mode==="cancel"?JSON.parse(readFileSync(observed.error.receipt_ref,"utf8")):JSON.parse(readFileSync(observed.value.receipt_ref,"utf8"));
   expect(receipt).toMatchObject({exit_code:mode==="timeout"?124:130,timed_out:mode==="timeout",cancelled:mode==="cancel",signal:"SIGKILL"});
   expect(state.ready_at).toBeLessThan(Date.parse(receipt.ended_at));
   const raw=readFileSync(receipt.output_ref,"utf8");expect(raw).toContain("tree-ready");
   // One bounded observation timer crosses the original fixture deadlines; it is not polling.
   const due=Math.max(state.child_due,state.grandchild_due);
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,due-Date.now())+150));
   expect(Date.now()).toBeGreaterThan(due);
   expect(pidExists(state.child)).toBe(false);expect(pidExists(state.grandchild)).toBe(false);
   expect(existsSync(tree.childEffect)).toBe(false);expect(existsSync(tree.grandEffect)).toBe(false);
   console.log(JSON.stringify({oracle:"ORACLE-P3-CAPTURE",mode,ready:state,observed_at:Date.now(),receipt,raw,child_absent:true,grandchild_absent:true,delayed_effects_absent:true}));
  }finally{
   readiness.close();controller.abort(new Error("owned fixture final cleanup"));
   if(!state&&existsSync(tree.ready))state=JSON.parse(readFileSync(tree.ready,"utf8"));
   try{cleanupOwned(state);}catch(error){cleanupError=error;}
   // Teardown begins here: no unbounded await of the call being tested.
   let settled=observed;
   try{settled=await bounded(execution,500,"owned capture teardown");}catch(error){cleanupError??=error;}
   // Save before afterEach removes fixture; errors propagate, never fall back.
   await bounded(preserveNative(f,settled,sink),1500,"native evidence preservation");
   if(cleanupError)throw cleanupError;
  }
 },10000);
});

describe("ORACLE-P3-CAPTURE evidence and fixture failure boundaries",()=>{
 it("treats all-absent sink as ephemeral but rejects partial configuration and a real identity mismatch",async()=>{
  expect(evidenceSink({})).toBe(null);
  expect(()=>evidenceSink({WH_CAPTURE_EVIDENCE_TASK_PATH:"/not-a-task"})).toThrow("incomplete capture evidence sink");
  const f=await captureFixture();
  expect(()=>evidenceSink({WH_CAPTURE_EVIDENCE_TASK_PATH:f.task.taskPath,WH_CAPTURE_EVIDENCE_PROJECT:"wrong-project",WH_CAPTURE_EVIDENCE_TASK:"owned-process"})).toThrow();
 });
 it("exposes a genuine sink write failure without reporting saved evidence",async()=>{
  const f=await captureFixture(),result=await cap(f,"sink-failure-source",'process.stdout.write("actual original");');
  const bad=await captureFixture();rmSync(bad.records,{recursive:true});
  symlinkSync(f.r,bad.records);
  await expect(preserveNative(f,{value:result},bad.task)).rejects.toThrow();
 });
 it("preserves a real failing command receipt and raw bytes with the configured sink",async()=>{
  const f=await captureFixture(),result=await cap(f,"failure-original",'process.stdout.write("real failed command");process.exit(7);');
  expect(result.exit_code).toBe(7);
  const saved=await preserveNative(f,{value:result},evidenceSink());
  if(saved.evidence_mode==="authenticated-task"){
   expect(saved.native_receipt_available).toBe(true);expect(saved.mappings).toHaveLength(2);
   for(const mapping of saved.mappings)expect(sha256(readFileSync(mapping.canonical_ref))).toBe(mapping.sha256);
  }else expect(saved.retained).toBe(false);
 });
 it("bounds a deliberately non-settling fixture input and cleans only its actually started process",async()=>{
  const child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{detached:true,stdio:"ignore"});
  const closed=new Promise(resolve=>child.once("close",resolve));
  await new Promise((resolve,reject)=>{child.once("spawn",resolve);child.once("error",reject);});
  const never=new Promise(()=>{}),start=Date.now();
  try{
   // The former direct await never settles for this controlled input.
   expect(await Promise.race([never.then(()=>"settled"),new Promise(resolve=>setTimeout(()=>resolve("still-pending"),30))])).toBe("still-pending");
   await expect(bounded(never,40,"controlled non-settling capture")).rejects.toThrow("deadline exceeded");
  }finally{cleanupOwned({child:child.pid,grandchild:child.pid});await bounded(closed,500,"controlled owned child cleanup");}
  expect(pidExists(child.pid)).toBe(false);expect(Date.now()-start).toBeLessThan(1000);
  console.log(JSON.stringify({fixture_fault:"never-settling input",pid:child.pid,owned_pid_absent:true,elapsed_ms:Date.now()-start,production_changed:false}));
 });
});
