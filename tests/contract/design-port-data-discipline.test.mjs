// ORACLE-DATA-DISCIPLINE
// 本文件通过只证明当前八份数据夹具、失败分档纯函数与本地受控服务；不证明真实外部
// 业务服务、其它视口或长期稳定性。受控破坏只发生在临时副本，原夹具与原型不改。
// RED 只落目标断言；收集、导入与环境失败另记。浏览器场景只读驱动实际输出，不向
// 页面注入字节、不替页面调用网关。
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, statSync, cpSync, readdirSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, dirname, basename} from 'node:path';
import {spawnSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer as createNetServer} from 'node:net';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT=process.cwd();
const SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-data-discipline.mjs");
const FIXTURE=join(ROOT,"tests/fixtures/design-port-sample/data");
const PROTOTYPE=join(ROOT,"tests/fixtures/design-port-sample/prototype");
const PORT_SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-port-manifest.mjs");
const MANIFEST=join(ROOT,"tests/fixtures/design-port-sample/port/manifest.json");
const SELF_PATH=fileURLToPath(import.meta.url);
const WIRING_TEST=new URL('./design-port-wiring.test.mjs', import.meta.url);
const SESSION_MODULE=new URL('../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs',import.meta.url).href;
const SCENARIO=process.argv.includes("--browser-scenario");

if(SCENARIO){ await runBrowserScenario(); }
else { const vitest=await import('vitest'); const data=await import(pathToFileURL(SCRIPT).href); defineTests(vitest,data); }

function runCheck(args,{cwd=ROOT}={}){return spawnSync(process.execPath,[SCRIPT,...args],{cwd,encoding:"utf8",timeout:120000});}
function sha(file){return createHash("sha256").update(readFileSync(file)).digest("hex");}
function readJson(file){return JSON.parse(readFileSync(file,"utf8"));}
function clean(dir){try{rmSync(dir,{recursive:true,force:true});}catch{/* keep first failure */}}
function codesOf(result){try{const e=JSON.parse(result.stderr);return (e.error.issues||[]).map(item=>item.code);}catch{return [];}}
function brokeFixture(name,mutate){
  const dir=mkdtempSync(join(tmpdir(),"p3-data-break-"));
  cpSync(FIXTURE,dir,{recursive:true});
  const file=join(dir,`${name}.json`);
  const value=readJson(file);
  mutate(value);
  writeFileSync(file,JSON.stringify(value,null,2)+"\n");
  return dir;
}
function generateOutput(out){
  return spawnSync(process.execPath,[PORT_SCRIPT,"--mode=generate","--manifest",MANIFEST,"--design-root",PROTOTYPE,"--output",out],{cwd:ROOT,encoding:"utf8",timeout:180000});
}
function freePort(){return new Promise((res)=>{const s=createNetServer();s.listen(0,"127.0.0.1",()=>{const p=s.address().port;s.close(()=>res(p));});});}
async function httpGet(url,{headers={},timeoutMs=5000}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(Object.assign(new Error("ABORT"),{name:"AbortError"})),timeoutMs);
  try{const response=await fetch(url,{headers,signal:controller.signal});const text=await response.text();let body=null;try{body=JSON.parse(text);}catch{body=text;}return {status:response.status,body};}
  finally{clearTimeout(timer);}
}
async function httpPost(url,payload,{timeoutMs=5000}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(Object.assign(new Error("ABORT"),{name:"AbortError"})),timeoutMs);
  try{const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});const text=await response.text();let body=null;try{body=JSON.parse(text);}catch{body=text;}return {status:response.status,body};}
  finally{clearTimeout(timer);}
}
async function waitReady(baseUrl,{attempts=80,interval=100}={}){
  for(let i=0;i<attempts;i+=1){try{const {status,body}=await httpGet(baseUrl+"/identity",{timeoutMs:1000});if(status===200&&body&&body.ok)return body;}catch{/* retry */}await new Promise(r=>setTimeout(r,interval));}
  return null;
}
function startService({port,store,portRecord}){
  const child=spawn(process.execPath,[SCRIPT,"--mode=serve","--fixture",FIXTURE,"--listen=127.0.0.1","--port",String(port),"--port-output-record",portRecord,"--store",store],{cwd:ROOT,stdio:["ignore","pipe","pipe"]});
  let stdout="",stderr="";
  child.stdout.on("data",c=>{stdout+=c;});
  child.stderr.on("data",c=>{stderr+=c;});
  return {child,getStdout:()=>stdout,getStderr:()=>stderr};
}
async function stopService(child){
  if(!child||child.exitCode!==null)return;
  await new Promise(res=>{child.once("exit",()=>res());try{child.kill("SIGTERM");}catch{res();}setTimeout(()=>{try{child.kill("SIGKILL");}catch{/* gone */}res();},3000);});
}

function defineTests({describe,it,expect},data){
  const {classifyReadFailure,resolveReadState,validateFixtureDir}=data;

  describe("ORACLE-DATA-DISCIPLINE accepts the eight state fixtures",()=>{
    it("check script exists and accepts all declared states",()=>{
      expect(existsSync(SCRIPT),"check-data-discipline.mjs must exist").toBe(true);
      const result=runCheck(["--fixture",FIXTURE]);
      expect(result.status,result.stderr).toBe(0);
      const summary=JSON.parse(result.stdout);
      expect(summary.ok,result.stdout).toBe(true);
      expect(summary.states).toEqual(["loading","success","empty","error","timeout","receipt","sample","real"]);
      expect(summary.issue_count).toBe(0);
    });
  });

  describe("ORACLE-DATA-DISCIPLINE refuses sample-as-real, filled-empty, fake-receipt and timeout-not-slower",()=>{
    const breaks=[
      ["sample-mode",value=>{value.source.kind="real_controlled_source";},"SAMPLE_POSES_AS_REAL"],
      ["sample-mode",value=>{value.write_policy.allowed=true;},"SAMPLE_WRITE_ALLOWED"],
      ["empty",value=>{value.read_route.body.records.push({name:"伪造",value:"补零"});},"EMPTY_FILLED"],
      ["write-receipt",value=>{value.expected_receipt=null;},"NO_RECEIPT_SUCCESS"],
      ["timeout",value=>{value.delay_ms=10;},"TIMEOUT_NOT_SLOWER"],
      ["sample-mode",value=>{value.write_policy.control="removed";},"CONTROL_DEGRADED"],
      ["real-mode",value=>{value.sample_annotations_expected=1;},"REAL_SAMPLE_RESIDUAL"],
      ["real-mode",value=>{value.conflict_rulings[0].adjudicator="";},"CONFLICT_RULING_INCOMPLETE"],
      ["error",value=>{value.unknown_code_policy="trust_unknown";},"UNKNOWN_NOT_CONSERVATIVE"],
    ];
    for(const [name,mutate,code] of breaks){
      it(`rejects a controlled break (${code})`,()=>{
        const dir=brokeFixture(name,mutate);
        try{
          const result=runCheck(["--fixture",dir]);
          expect(result.status,result.stdout+result.stderr).not.toBe(0);
          expect(codesOf(result),result.stderr).toContain(code);
        }finally{clean(dir);}
      });
    }
  });

  describe("ORACLE-DATA-DISCIPLINE fixture declares the sample client budget and service delay",()=>{
    it("keeps timeout_ms=25 and delay_ms=100 in the fixture (not a generic checker constant)",()=>{
      const timeout=readJson(join(FIXTURE,"timeout.json"));
      expect(timeout.timeout_ms).toBe(25);
      expect(timeout.delay_ms).toBe(100);
      expect(timeout.delay_ms).toBeGreaterThan(timeout.timeout_ms);
    });
  });

  describe("ORACLE-DATA-DISCIPLINE failure classification is a falsifiable pure function",()=>{
    it("maps unknown or missing status to the conservative failure class, never success",()=>{
      expect(classifyReadFailure({status:0})).toBe("unknown_failure");
      expect(classifyReadFailure({})).toBe("unknown_failure");
      expect(classifyReadFailure({status:299})).not.toBe("unknown_failure");
      expect(classifyReadFailure({status:199})).toBe("unknown_failure");
    });
    it("distinguishes timeout from ordinary errors and success",()=>{
      expect(classifyReadFailure({status:200,error_name:"AbortError",code:"TIMEOUT"})).toBe("timeout");
      expect(classifyReadFailure({status:500})).toBe("server_error");
      expect(classifyReadFailure({status:404})).toBe("not_found");
      expect(classifyReadFailure({status:400})).toBe("client_error");
      expect(classifyReadFailure({status:200})).toBe("success");
    });
    it("collapses one response into exactly one state kind and never fills empty",()=>{
      expect(resolveReadState({status:200,body:{records:[{name:"a",value:"b"}]}}).kind).toBe("success");
      expect(resolveReadState({status:200,body:{records:[]}}).kind).toBe("empty");
      expect(resolveReadState({status:200,body:{records:[]}}).records).toEqual([]);
      expect(resolveReadState({status:200,error_name:"AbortError",code:"TIMEOUT"}).kind).toBe("timeout");
      expect(resolveReadState({status:0}).kind).toBe("error");
      expect(resolveReadState({status:200,body:{}}).kind).toBe("error");
    });
  });

  describe("ORACLE-DATA-DISCIPLINE real controlled service serves states and real receipts",()=>{
    it("serves the actual page, read routes, identity, timeout and a real store receipt",async()=>{      const base=mkdtempSync(join(tmpdir(),"p3-data-serve-"));
      const out=join(base,"port-output");
      const storeFile=join(base,"store","records.json");
      const portRecord=join(base,"p2-port-output.json");
      const gen=generateOutput(out);
      expect(gen.status,gen.stderr).toBe(0);
      writeFileSync(portRecord,JSON.stringify({output_root:out})+"\n");
      const port=await freePort();
      const {child}=startService({port,store:storeFile,portRecord});
      const baseUrl=`http://127.0.0.1:${port}`;
      try{
        const identity=await waitReady(baseUrl);
        expect(identity,`service must become ready: ${child.exitCode}`).not.toBeNull();
        expect(identity.output_root).toBe(out);
        expect(typeof identity.pid).toBe("number");
        expect(identity.url).toContain(String(port));

        const served=await httpGet(baseUrl+"/index.html");
        expect(served.status).toBe(200);
        const appServed=await httpGet(baseUrl+"/app.js");
        expect(appServed.status).toBe(200);
        expect(createHash("sha256").update(String(appServed.body)).digest("hex")).toBe(sha(join(PROTOTYPE,"app.js")));

        const success=await httpGet(baseUrl+"/records/sample-01");
        expect(success.status).toBe(200);
        expect(success.body.records.length).toBe(3);
        const empty=await httpGet(baseUrl+"/records/empty");
        expect(empty.status).toBe(200);
        expect(empty.body.records).toEqual([]);
        const error=await httpGet(baseUrl+"/records/error");
        expect(error.status).toBe(500);
        expect(classifyReadFailure({status:error.status})).toBe("server_error");

        let timeoutClass=null;
        try{await httpGet(baseUrl+"/records/timeout",{timeoutMs:25});}
        catch(err){timeoutClass=classifyReadFailure({status:0,error_name:err.name,code:err.code});}
        expect(timeoutClass).toBe("timeout");
        expect(timeoutClass).not.toBe("server_error");

        const posted=await httpPost(baseUrl+"/records",{recordId:"sample-01",value:"legacy-write",requestId:"req-01"});
        expect(posted.status).toBe(200);
        expect(posted.body.source).toBe("service_store");
        expect(typeof posted.body.receipt_id).toBe("string");
        const rows=readJson(storeFile);
        const stored=rows.find(r=>r.recordId==="sample-01"&&r.value==="legacy-write"&&r.requestId==="req-01");
        expect(stored,JSON.stringify(rows)).toBeTruthy();
        expect(stored.receipt_id).toBe(posted.body.receipt_id);

        const spy=await httpGet(baseUrl+"/requests");
        expect(spy.body.requests.some(r=>r.method==="GET"&&r.record_id==="sample-01")).toBe(true);
        expect(spy.body.requests.some(r=>r.method==="POST"&&r.body&&r.body.requestId==="req-01")).toBe(true);
      }finally{
        await stopService(child);
        expect(child.exitCode!==null||child.signalCode!==null).toBe(true);
        clean(base);
      }
    },30000);
    it("fails cleanly when the upstream output record is unreadable",()=>{
      const base=mkdtempSync(join(tmpdir(),"p3-data-noref-"));
      try{
        const result=runCheck(["--mode=serve","--fixture",FIXTURE,"--port-output-record",join(base,"missing.json"),"--store",join(base,"store.json"),"--port","8799"]);
        expect(result.status,result.stdout+result.stderr).not.toBe(0);
        expect(result.status).toBe(2);
        expect(result.stderr).toContain("PORT_OUTPUT_RECORD_UNAVAILABLE");
      }finally{clean(base);}
    });
  });

  describe("ORACLE-DATA-DISCIPLINE refuses to overwrite an unreadable store and non-loopback binds",()=>{
    it("keeps corrupt store bytes and returns an explicit failure instead of a receipt",async()=>{
      const base=mkdtempSync(join(tmpdir(),"p3-data-corrupt-"));
      const storeFile=join(base,"store","records.json");
      const portRecord=join(base,"p2-port-output.json");
      mkdirSync(join(base,"store"),{recursive:true});
      const corrupt="{not json\n";
      writeFileSync(storeFile,corrupt);
      writeFileSync(portRecord,JSON.stringify({output_root:PROTOTYPE})+"\n");
      const port=await freePort();
      const {child}=startService({port,store:storeFile,portRecord});
      try{
        const identity=await waitReady(`http://127.0.0.1:${port}`);
        expect(identity).not.toBeNull();
        const posted=await httpPost(`http://127.0.0.1:${port}/records`,{recordId:"sample-01",value:"after-corrupt",requestId:"req-99"});
        expect(posted.status).toBe(500);
        expect(posted.body&&posted.body.error).toBe("STORE_CORRUPT");
        expect(readFileSync(storeFile,"utf8")).toBe(corrupt);
      }finally{await stopService(child);clean(base);}
    },30000);
    it("treats a store that is not a JSON array as corrupt, not empty",async()=>{
      const base=mkdtempSync(join(tmpdir(),"p3-data-shape-"));
      const storeFile=join(base,"store.json");
      writeFileSync(storeFile,JSON.stringify({records:[]})+"\n");
      const portRecord=join(base,"p2-port-output.json");
      writeFileSync(portRecord,JSON.stringify({output_root:PROTOTYPE})+"\n");
      const port=await freePort();
      const {child}=startService({port,store:storeFile,portRecord});
      try{
        expect(await waitReady(`http://127.0.0.1:${port}`)).not.toBeNull();
        const posted=await httpPost(`http://127.0.0.1:${port}/records`,{recordId:"sample-01",value:"x",requestId:"req-1"});
        expect(posted.status).toBe(500);
        expect(posted.body&&posted.body.error).toBe("STORE_CORRUPT");
        expect(readFileSync(storeFile,"utf8")).toBe(JSON.stringify({records:[]})+"\n");
      }finally{await stopService(child);clean(base);}
    },30000);
    it("rejects a non-loopback listen address before serving",()=>{
      const base=mkdtempSync(join(tmpdir(),"p3-data-listen-"));
      try{
        const portRecord=join(base,"p2-port-output.json");
        writeFileSync(portRecord,JSON.stringify({output_root:PROTOTYPE})+"\n");
        const result=spawnSync(process.execPath,[SCRIPT,"--mode=serve","--fixture",FIXTURE,"--listen=0.0.0.0","--port","8797","--port-output-record",portRecord,"--store",join(base,"store.json")],{cwd:ROOT,encoding:"utf8",timeout:20000});
        expect(result.status,result.stdout+result.stderr).toBe(2);
        expect(result.stderr).toContain("LISTEN_NOT_LOOPBACK");
      }finally{clean(base);}
    });
  });

  describe("ORACLE-DATA-DISCIPLINE browser scenario entry (smoke: tokens present, not behaviour evidence)",()=>{
    it("declares its own service, evidence publishing, fixed viewport and wiring delegation tokens",()=>{
      const source=readFileSync(SELF_PATH,"utf8");
      for(const token of ["--browser-scenario","P2_PORT_OUTPUT_REF","8768","1440","BROWSER_QA_TASK_ID","runWiringBrowserScenario","design-port-wiring.test.mjs"])expect(source,`entry must carry ${token}`).toContain(token);
    });
  });
}

// ---------------------------------------------------------------------------
// Browser scenario: node tests/contract/design-port-data-discipline.test.mjs --browser-scenario
// under isolated-browser-qa. It owns the 8768 data service, drives the owned Ego page,
// delegates wiring to design-port-wiring.test.mjs, publishes originals, stops only its own service.
// ---------------------------------------------------------------------------
async function runBrowserScenario(){
  const exit=(code,payload)=>{process.stdout.write(JSON.stringify(payload)+"\n");process.exitCode=code;};
  const refPath=process.env.P2_PORT_OUTPUT_REF;
  if(!refPath||!existsSync(refPath))return exit(2,{ok:false,code:"P2_PORT_OUTPUT_REF_UNAVAILABLE",ref:refPath??null});
  let record;try{record=JSON.parse(readFileSync(refPath,"utf8"));}catch(error){return exit(2,{ok:false,code:"P2_PORT_OUTPUT_REF_UNREADABLE",detail:String(error.message)});}
  const outputRoot=record&&record.output_root;
  if(typeof outputRoot!=="string"||!outputRoot.startsWith("/")||!existsSync(outputRoot))return exit(2,{ok:false,code:"P2_OUTPUT_ROOT_UNAVAILABLE",output_root:outputRoot??null});
  const taskSpaceName=process.env.BROWSER_QA_EGO_TASKSPACE_NAME;
  const helperPath=process.env.BROWSER_QA_EGO_HELPER_PATH||"ego-browser";
  if(!taskSpaceName)return exit(2,{ok:false,code:"EGO_TASKSPACE_NAME_UNAVAILABLE"});
  const evidenceDir=process.env.BROWSER_QA_EVIDENCE_DIR||mkdtempSync(join(tmpdir(),"p3-browser-evidence-"));
  const baseUrl=process.env.BROWSER_QA_TARGET_URL||"http://127.0.0.1:8768/index.html";
  const origin=new URL(baseUrl).origin;
  const storeFile=join(evidenceDir,"data-store.json");
  if(!existsSync(storeFile))writeFileSync(storeFile,"[]\n");
  const port=Number(new URL(origin).port||8768);
  const {child}=startService({port,store:storeFile,portRecord:refPath});
  const resultPath=join(evidenceDir,"p3-data-observation.json");
  const screenshotPath=join(evidenceDir,"p3-data-1440x1000.png");
  const published=[];
  try{
    const identity=await waitReady(origin);
    if(!identity)return exit(2,{ok:false,code:"SERVICE_NOT_READY",stderr:child.stderr&&String(child.stderr).slice(0,1000)});
    const worker=buildDataWorker({origin,resultPath,screenshotPath,taskSpaceName});
    const run=await runEgoWorker(helperPath,worker);
    if(!existsSync(resultPath))return exit(6,{ok:false,code:"BROWSER_WORKER_NO_ORIGINAL",exit:run.status,stderr:String(run.stderr||"").slice(0,2000)});
    const envelope=JSON.parse(readFileSync(resultPath,"utf8"));
    if(envelope.ok!==true)return exit(6,{ok:false,code:envelope.code||"BROWSER_WORKER_FAILED",detail:envelope.message||""});
    const facts=envelope.facts;
    const checks=evaluateDataFacts(facts,identity);
    // wiring delegation: reuse owned session + service + store + evidence dir.
    let wiring=null;
    try{
      const mod=await import(WIRING_TEST.href);
      wiring=await mod.runWiringBrowserScenario({taskSpaceName,helperPath,baseUrl,storeFile,evidenceDir,origin});
    }catch(error){wiring={ok:false,code:"WIRING_SCENARIO_FAILED",detail:String(error&&error.message||error)};}
    const payload={schema_version:"1.0.0",kind:"p3-data-browser-observation",ok:checks.every(c=>c.passed)&&Boolean(wiring&&wiring.ok),object:{output_root:outputRoot,url:origin,viewport:"1440x1000@1",service_pid:child.pid},checks,facts,wiring,worker:{exit:run.status,stderr:String(run.stderr||"").slice(0,1500)},published:[]};
    writeFileSync(resultPath,JSON.stringify(payload,null,2)+"\n");
    const {openTask}=await import(new URL('../../runtime/task/task-handle.mjs',import.meta.url).href);
    const taskRoot=process.env.TASK_RECORD_ROOT;const taskId=process.env.BROWSER_QA_TASK_ID;
    if(taskRoot&&taskId&&existsSync(taskRoot)){
      const handle=openTask(taskRoot,{projectName:"workflowhub",taskId});
      if(existsSync(screenshotPath))published.push(await handle.appendRecord({dir:"quality/evidence/build-code/P3",slug:"p3-data-browser-1440x1000",ext:"png",bytes:readFileSync(screenshotPath)}));
      published.push(await handle.appendRecord({dir:"quality/evidence/build-code/P3",slug:"p3-data-browser-observation",ext:"json",bytes:readFileSync(resultPath)}));
      payload.published=published;writeFileSync(resultPath,JSON.stringify(payload,null,2)+"\n");
    }
    return exit(payload.ok?0:6,{ok:payload.ok,checks,wiring:Boolean(wiring&&wiring.ok),published,result_ref:resultPath,screenshot_ref:existsSync(screenshotPath)?screenshotPath:null});
  }catch(error){
    return exit(6,{ok:false,code:"BROWSER_SCENARIO_FAILED",detail:String(error&&error.message||error)});
  }finally{
    await stopService(child);
    for(const file of [screenshotPath]){try{rmSync(file,{force:true});}catch{/* preserve first */}}
  }
}

function evaluateDataFacts(facts,identity){
  const checks=[];
  const vp=facts.viewport;
  checks.push({id:"viewport",passed:Boolean(vp)&&vp.width===1440&&vp.height===1000&&vp.dpr===1,observed:vp??null});
  const scroll=facts.scroll;
  checks.push({id:"no-horizontal-overflow",passed:Boolean(scroll)&&scroll.scrollWidth<=scroll.clientWidth,observed:scroll??null});
  const sample=facts.sample||{};
  checks.push({id:"sample-layers",passed:Number(sample.sampleTags)>=2&&Number(sample.valueTags)>=1,observed:{sample_tags:sample.sampleTags??null,value_tags:sample.valueTags??null}});
  checks.push({id:"sample-states",passed:Array.isArray(sample.states)&&sample.states.length===3,observed:(sample.states||[]).map(s=>({label:s.stateLabel,status:s.status}))});
  const sampleWrite=facts.sampleWrite||{};
  checks.push({id:"sample-write-refused",passed:sampleWrite.resultState==="refused"&&sampleWrite.buttonPresent===true,observed:sampleWrite});
  const loading=facts.loading||{};
  checks.push({id:"loading-distinct",passed:loading.ariaBusy==="true"&&String(loading.buttonLabel||"").includes("读取"),observed:{aria_busy:loading.ariaBusy??null,button:loading.buttonLabel??null}});
  const real=facts.real||{};
  checks.push({id:"real-no-sample-tags",passed:Number(real.sampleTags)===0,observed:{sample_tags:real.sampleTags??null}});
  checks.push({id:"real-idle-before-request",passed:real.idle&&real.idle.resultState==="idle"&&Number(real.idle.records)===0,observed:real.idle??null});
  checks.push({id:"real-success",passed:real.success&&real.success.resultState==="success"&&Number(real.success.records)>=1,observed:real.success??null});
  checks.push({id:"real-empty",passed:real.empty&&real.empty.resultState==="empty"&&Number(real.empty.records)===0,observed:real.empty??null});
  checks.push({id:"real-error",passed:real.error&&real.error.resultState==="error",observed:real.error??null});
  checks.push({id:"real-timeout",passed:real.timeout&&real.timeout.resultState==="timeout"&&real.timeout.afterLateState==="timeout"&&Number(real.timeout.records)===0,observed:real.timeout??null});
  checks.push({id:"write-receipt",passed:real.write&&real.write.resultState==="receipt"&&typeof real.write.receipt==="string"&&real.write.receipt.length>0,observed:real.write??null});
  checks.push({id:"legacy-hook",passed:facts.hook==="sample-result",observed:facts.hook??null});
  return checks;
}

function buildDataWorker({origin,resultPath,screenshotPath,taskSpaceName}){
  const input=JSON.stringify({origin,resultPath,screenshotPath,taskSpaceName});
  return `process.env.BROWSER_QA_EGO_TASKSPACE_NAME=${JSON.stringify(taskSpaceName)};
const input=${input};
const fs=await import("node:fs");
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
try{
  const task=await taskSpace(input.taskSpaceName);
  const page=task.page(process.env.BROWSER_QA_EGO_PAGE_LABEL||"p1");
  const result={ok:true,engine:"ego-lite",url:input.origin,facts:{}};
  await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const read=()=>page.evaluate(()=>{
    const text=(s)=>{const n=document.querySelector(s);return n?n.textContent.trim():null;};
    const panel=document.querySelector("#result-panel");
    return {
      stateLabel:text("#state-label"),stateNumber:text("#state-number"),status:text("#status-message"),
      resultState:panel?panel.getAttribute("data-state"):null,
      records:document.querySelectorAll("#result-content .sample-values__row").length,
      receipt:(()=>{const n=document.querySelector("#result-content .receipt-line");return n?n.textContent.trim():null;})(),
      sampleTags:document.querySelectorAll("[data-sample-tag]").length,
      valueTags:document.querySelectorAll(".value-tag").length,
      buttonLabel:text("#next-sample"),
      ariaBusy:panel?panel.getAttribute("aria-busy"):null,
      hook:panel?panel.getAttribute("data-legacy-hook"):null,
      viewport:{width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio},
      scroll:{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth},
      resultRole:(()=>{const n=document.querySelector("#result-content [role=alert]");return n?"alert":null;})()
    };
  },{});
  const click=()=>page.evaluate(()=>{const b=document.querySelector("#next-sample");if(b)b.click();},{});
  // sample mode: default success; capture loading immediately after click then settled states.
  await page.goto(input.origin+"/index.html");
  await page.waitForSelector("#next-sample");
  const first=await read();
  result.facts.viewport=first.viewport;result.facts.scroll=first.scroll;result.facts.hook=first.hook;
  const sampleStates=[first];
  await click();
  const loadingNow=await read();
  result.facts.loading={ariaBusy:loadingNow.ariaBusy,buttonLabel:loadingNow.buttonLabel};
  await wait(360);sampleStates.push(await read());
  await click();await wait(360);sampleStates.push(await read());
  await click();await wait(360);sampleStates.push(await read());
  result.facts.sample={sampleTags:first.sampleTags,valueTags:first.valueTags,states:sampleStates.slice(1)};
  // sample mode write click: must be refused with the control still present.
  await page.goto(input.origin+"/index.html?action=write");
  await page.waitForSelector("#next-sample");
  await click();await wait(260);
  const refused=await read();
  const buttonPresent=await page.evaluate(()=>Boolean(document.querySelector("#next-sample")),{});
  result.facts.sampleWrite={resultState:refused.resultState,buttonPresent};
  // real mode read success/empty/error, timeout page state and write receipt.
  const realRead=async(params)=>{await page.goto(input.origin+"/index.html?"+params);await page.waitForSelector("#next-sample");const init=await read();await click();await wait(500);const done=await read();return {init,done};};
  const rSuccess=await realRead("mode=real&recordId=sample-01&action=read");
  const rEmpty=await realRead("mode=real&recordId=empty&action=read");
  const rError=await realRead("mode=real&recordId=error&action=read");
  const rWrite=await realRead("mode=real&recordId=sample-01&action=write&value=legacy-write");
  // timeout budget 25ms < fixture delay 100ms: the client must abort and keep the timeout state
  // after the late 200 arrives.
  const rTimeout=await realRead("mode=real&recordId=timeout&action=read&timeoutMs=25");
  await wait(400);
  const rTimeoutLate=await read();
  result.facts.real={
    sampleTags:rSuccess.init.sampleTags,
    idle:{resultState:rSuccess.init.resultState,records:rSuccess.init.records},
    success:{resultState:rSuccess.done.resultState,records:rSuccess.done.records},
    empty:{resultState:rEmpty.done.resultState,records:rEmpty.done.records},
    error:{resultState:rError.done.resultState,role:rError.done.resultRole},
    write:{resultState:rWrite.done.resultState,receipt:rWrite.done.receipt},
    timeout:{resultState:rTimeout.done.resultState,afterLateState:rTimeoutLate.resultState,records:rTimeoutLate.records}
  };
  result.facts.timeout_page={status:"observed",state:rTimeout.done.resultState,after_late:rTimeoutLate.resultState};
  await page.screenshot({path:input.screenshotPath});
  result.facts.screenshot=input.screenshotPath;
  fs.writeFileSync(input.resultPath,JSON.stringify(result));
}catch(error){fs.writeFileSync(input.resultPath,JSON.stringify({ok:false,engine:"ego-lite",code:error&&error.code||null,message:String(error&&error.message||error).slice(0,2000)}));}
`;
}

async function runEgoWorker(helper,source){
  return new Promise(resolveRun=>{
    const child=spawn(helper,["nodejs","-e",source],{env:{...process.env},stdio:["ignore","pipe","pipe"]});
    let stdout="",stderr="";
    const timer=setTimeout(()=>{try{child.kill("SIGTERM");}catch{/* preserve timeout */}},300000);
    child.stdout.on("data",c=>{stdout+=c;});
    child.stderr.on("data",c=>{stderr+=c;});
    child.on("error",error=>{clearTimeout(timer);resolveRun({status:null,signal:null,stdout,stderr:String(error.message)});});
    child.on("close",(code,signal)=>{clearTimeout(timer);resolveRun({status:code,signal,stdout,stderr});});
  });
}
