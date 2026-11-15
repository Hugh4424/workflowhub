// ORACLE-WIRING-RECOVERY
// 本文件通过只证明当前接线映射、受控旧接口间谍与临时副本恢复；不证明所有历史项目、
// 未走真实入口的功能或外部服务。受控破坏与回退只在临时副本，原样本与原型不改。
// RED 只落接线/恢复目标断言；收集、导入与环境失败另记。
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer as createNetServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const ROOT=process.cwd();
const SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-wiring.mjs");
const SERVICE=join(ROOT,"skills/design-source-extraction/scripts/check-data-discipline.mjs");
const PORT_SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-port-manifest.mjs");
const MANIFEST=join(ROOT,"tests/fixtures/design-port-sample/port/manifest.json");
const PROTOTYPE=join(ROOT,"tests/fixtures/design-port-sample/prototype");
const DATA_FIXTURE=join(ROOT,"tests/fixtures/design-port-sample/data");
const MAP=join(ROOT,"tests/fixtures/design-port-sample/wiring/wiring.md");
const APP=join(PROTOTYPE,"app.js");
const SELF_PATH=fileURLToPath(import.meta.url);

function runWiring(args){return spawnSync(process.execPath,[SCRIPT,...args],{cwd:ROOT,encoding:"utf8",timeout:120000});}
function readText(file){return readFileSync(file,"utf8");}
function readJson(file){return JSON.parse(readFileSync(file,"utf8"));}
function clean(dir){try{rmSync(dir,{recursive:true,force:true});}catch{/* keep first failure */}}
function sha(file){return createHash("sha256").update(readFileSync(file)).digest("hex");}
function codeOf(result){try{return JSON.parse(result.stderr).error.code;}catch{return null;}}

// 用真实 app.js 字节在受控 DOM/网络沙箱里加载样本客户端适配层；spy 只观察边界。
// makeElement 记录 addEventListener 注册的处理器，使测试能驱动真实按钮点击，而不是替页面补成功。
function makeElement(){
  const listeners={};
  const el={_attrs:{},textContent:"",className:"",dataset:{},style:{},classList:{toggle(){return undefined;}},setAttribute(key,value){this._attrs[key]=String(value);},removeAttribute(key){delete this._attrs[key];},getAttribute(key){return this._attrs[key]??null;},append(){},appendChild(){},replaceChildren(){},addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn);},querySelector(){return null;},remove(){},__listeners:listeners};
  return el;
}
export function loadLegacyClient(appText,{origin,fetchImpl,search=""}={}){
  const cache=new Map();
  const element=(selector)=>{if(!cache.has(selector))cache.set(selector,makeElement());return cache.get(selector);};
  const documentStub={querySelector:(selector)=>element(selector),querySelectorAll:()=>[],createElement:()=>makeElement(),createTextNode:(text)=>({textContent:String(text)}),documentElement:{dataset:{}}};
  const windowStub={location:{href:String(origin)+"/index.html"+(search||""),origin:String(origin)},setTimeout:(fn,ms)=>setTimeout(fn,ms),fetch:(input,init)=>fetchImpl?fetchImpl(input,init):fetch(input,init)};
  windowStub.window=windowStub;
  const sandbox={window:windowStub,document:documentStub,URL,JSON,Date,String,Array,Object,Number,Boolean,encodeURIComponent,setTimeout,clearTimeout,console,Error,Promise,AbortController};
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(String(appText),sandbox,{filename:"app.js"});
  const fire=(selector,type="click")=>{const el=cache.get(selector);if(el&&el.__listeners[type])for(const fn of el.__listeners[type])fn({});};
  return {LegacySampleGateway:windowStub.LegacySampleGateway,resolveViewModel:windowStub.resolveViewModel,window:windowStub,fire};
}
const wait=(ms)=>new Promise((resolveWait)=>setTimeout(resolveWait,ms));

function spyFetch(responseFor){
  const calls=[];
  const impl=async(input,init)=>{calls.push({url:String(input),method:(init&&init.method)||"GET",headers:(init&&init.headers)||{},body:init&&init.body});const {status=200,body={}}=responseFor?responseFor({url:String(input),init}):{status:200,body:{records:[{name:"a",value:"b"}]}};return {ok:status>=200&&status<300,status,text:async()=>typeof body==="string"?body:JSON.stringify(body)};};
  return {impl,calls};
}

function freePort(){return new Promise((res)=>{const s=createNetServer();s.listen(0,"127.0.0.1",()=>{const p=s.address().port;s.close(()=>res(p));});});}

// Standalone probe (run as: node design-port-wiring.test.mjs --probe-disconnect --out <json>)
// Drives the real app.js button binding through the vm page seam: connected reaches the old
// interface, a removed binding does not. Leaves a counterexample original for F1.
export async function runDisconnectionProbe(){
  const original=readText(APP);
  const edit=original.replace('elements.button.addEventListener("click", function () {','elements.button.addEventListener("click", function () { return; /* disconnected */');
  const connected=spyFetch(()=>({status:200,body:{records:[{name:"a",value:"b"}]}}));
  loadLegacyClient(original,{origin:"http://127.0.0.1:8768",fetchImpl:connected.impl,search:"?mode=real&recordId=sample-01&action=read"}).fire("#next-sample","click");
  await wait(30);
  const dir=mkdtempSync(join(tmpdir(),"p3-disconnect-probe-"));
  let disconnectedReaches;
  try{
    writeFileSync(join(dir,"app.js"),edit);
    const broken=spyFetch(()=>({status:200,body:{records:[{name:"a",value:"b"}]}}));
    loadLegacyClient(readText(join(dir,"app.js")),{origin:"http://127.0.0.1:8768",fetchImpl:broken.impl,search:"?mode=real&recordId=sample-01&action=read"}).fire("#next-sample","click");
    await wait(30);
    disconnectedReaches=broken.calls.length>0;
  }finally{clean(dir);}
  return {probe:"real app.js button-binding removal",connectedReaches:connected.calls.some(c=>c.method==="GET"&&c.url.endsWith("/records/sample-01")),disconnectedReaches,detection_holds:connected.calls.some(c=>c.method==="GET"&&c.url.endsWith("/records/sample-01"))&&disconnectedReaches===false,original_app_sha256:sha(APP),broken_variant_sha256:createHash("sha256").update(edit).digest("hex")};
}
async function runDisconnectionProbeCli(){
  const outIndex=process.argv.indexOf("--out");
  const outPath=outIndex>-1?process.argv[outIndex+1]:null;
  const result=await runDisconnectionProbe();
  const text=JSON.stringify(result,null,2)+"\n";
  if(outPath)writeFileSync(outPath,text);
  process.stdout.write(text);
}

// Standalone probe (run as: node design-port-wiring.test.mjs --probe-recovery --out <json>)
// Breaks THIS task's real /records route in a repo-external temp copy, shows real writes fail,
// shows deleting only a new file does not restore, and shows reverting the block restores.
export async function runRecoveryProbe(){
  const originalService=readText(SERVICE);
  const broken=originalService.replace('if (request.method === "POST" && pathname === "/records") {','if (false && request.method === "POST" && pathname === "/records") {');
  const dir=mkdtempSync(join(tmpdir(),"p3-recovery-probe-"));
  const brokenScript=join(dir,"broken-service.mjs");writeFileSync(brokenScript,broken);
  const marker=join(dir,"new-from-this-task.mjs");writeFileSync(marker,"// a new file this task adds\n");
  const state={baselineOk:false,brokenFails:false,stillFailsAfterDelete:false,recoveredOk:false};
  try{
    await withService(async({origin})=>{const gw=new (loadLegacyClient(readText(APP),{origin,fetchImpl:(i,n)=>fetch(i,n)}).LegacySampleGateway)({});const r=await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});state.baselineOk=r.receipt.source==="service_store";});
    await withService(async({origin})=>{const gw=new (loadLegacyClient(readText(APP),{origin,fetchImpl:(i,n)=>fetch(i,n)}).LegacySampleGateway)({});try{await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});}catch(e){state.brokenFails=/WRITE_FAILED/.test(e.message);}rmSync(marker,{force:true});try{await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});}catch(e){state.stillFailsAfterDelete=/WRITE_FAILED/.test(e.message);}},{script:brokenScript});
    writeFileSync(brokenScript,originalService);
    await withService(async({origin})=>{const gw=new (loadLegacyClient(readText(APP),{origin,fetchImpl:(i,n)=>fetch(i,n)}).LegacySampleGateway)({});const r=await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});state.recoveredOk=r.receipt.source==="service_store";},{script:brokenScript});
  }finally{clean(dir);}
  return {probe:"this task's real /records route",...state,detection_holds:state.baselineOk&&state.brokenFails&&state.stillFailsAfterDelete&&state.recoveredOk,broken_route_variant:"POST /records route disabled (if false && ...)",service_sha256:sha(SERVICE)};
}
async function runRecoveryProbeCli(){
  const outIndex=process.argv.indexOf("--out");
  const outPath=outIndex>-1?process.argv[outIndex+1]:null;
  const result=await runRecoveryProbe();
  const text=JSON.stringify(result,null,2)+"\n";
  if(outPath)writeFileSync(outPath,text);
  process.stdout.write(text);
}

async function httpJson(url,{method="GET",payload,timeoutMs=5000}={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(Object.assign(new Error("ABORT"),{name:"AbortError"})),timeoutMs);
  try{const response=await fetch(url,{method,headers:payload?{"content-type":"application/json"}:undefined,body:payload?JSON.stringify(payload):undefined,signal:controller.signal});const text=await response.text();let body=null;try{body=JSON.parse(text);}catch{body=text;}return {status:response.status,body};}finally{clearTimeout(timer);}
}
async function waitReady(baseUrl,{attempts=80,interval=100}={}){for(let i=0;i<attempts;i+=1){try{const {status,body}=await httpJson(baseUrl+"/identity",{timeoutMs:1000});if(status===200&&body&&body.ok)return body;}catch{/* retry */}await new Promise(r=>setTimeout(r,interval));}return null;}

async function withService(fn,{script=SERVICE}={}){
  const base=mkdtempSync(join(tmpdir(),"p3-wiring-svc-"));
  const out=join(base,"port-output");
  const storeFile=join(base,"store.json");
  const portRecord=join(base,"p2-port-output.json");
  const gen=spawnSync(process.execPath,[PORT_SCRIPT,"--mode=generate","--manifest",MANIFEST,"--design-root",PROTOTYPE,"--output",out],{cwd:ROOT,encoding:"utf8",timeout:180000});
  if(gen.status!==0)throw new Error("generate failed: "+gen.stderr);
  writeFileSync(portRecord,JSON.stringify({output_root:out})+"\n");
  const port=await freePort();
  const child=spawn(process.execPath,[script,"--mode=serve","--fixture",DATA_FIXTURE,"--listen=127.0.0.1","--port",String(port),"--port-output-record",portRecord,"--store",storeFile],{cwd:ROOT,stdio:["ignore","pipe","pipe"]});
  let stderr="";child.stderr.on("data",c=>{stderr+=c;});
  const origin=`http://127.0.0.1:${port}`;
  try{
    const identity=await waitReady(origin);
    if(!identity)throw new Error("service not ready: "+stderr.slice(0,500));
    return await fn({origin,storeFile,identity});
  }finally{
    await new Promise(res=>{if(child.exitCode!==null)return res();child.once("exit",()=>res());try{child.kill("SIGTERM");}catch{res();}setTimeout(()=>{try{child.kill("SIGKILL");}catch{/* gone */}res();},3000);});
    clean(base);
  }
}

const SCENARIO=process.argv.includes("--browser-scenario");
const PROBE=process.argv.includes("--probe-disconnect");
const RECOVERY_PROBE=process.argv.includes("--probe-recovery");
if(PROBE){ await runDisconnectionProbeCli(); }
else if(RECOVERY_PROBE){ await runRecoveryProbeCli(); }
else if(SCENARIO){ /* wiring browser scenario is only invoked through the data scenario */ }
else { const vitest=await import('vitest'); defineTests(vitest); }

function defineTests({describe,it,expect}){
  describe("ORACLE-WIRING-RECOVERY accepts the three-chain map",()=>{
    it("wiring script exists and accepts the fixture map",()=>{
      expect(existsSync(SCRIPT),"check-wiring.mjs must exist").toBe(true);
      const result=runWiring(["--map",MAP]);
      expect(result.status,result.stderr).toBe(0);
      const summary=JSON.parse(result.stdout);
      expect(summary.wiring_valid,result.stdout).toBe(true);
      expect(summary.chain_dimensions).toEqual(["function","interface","entry"]);
      expect(summary.chains.map(chain=>chain.id)).toEqual(["read-record","write-record"]);
      expect(summary.recovery_restored).toBe(true);
    });
  });

  describe("ORACLE-WIRING-RECOVERY refuses incoherent wiring maps (declaration level, self-reported status)",()=>{
    const mutate=(fn)=>{const dir=mkdtempSync(join(tmpdir(),"p3-wiring-break-"));const text=readText(MAP);const match=/```json\r?\n([\s\S]*?)```/.exec(text);const doc=JSON.parse(match[1]);fn(doc);writeFileSync(join(dir,"wiring.md"),text.replace(/```json\r?\n[\s\S]*?```/,"```json\n"+JSON.stringify(doc,null,2)+"\n```"));return dir;};
    const breaks=[
      ["map declares a disconnected handler",(doc)=>{doc.chains[0].status="disconnected";},"DISCONNECTED_HANDLER"],
      ["map points at the wrong interface",(doc)=>{doc.chains[0].interface="GET /v2/records/:recordId";},"WRONG_INTERFACE"],
      ["gap without attempt",(doc)=>{doc.gaps.push({id:"extra",function:"x",interface:"GET /x",entry:"#x",reason:"接不上",review_ref:"r"});},"GAP_WITHOUT_ATTEMPT"],
      ["gap is not an object",(doc)=>{doc.gaps.push(null);},"GAP_INVALID"],
      ["recovery not restored",(doc)=>{doc.recovery.restored=false;},"RECOVERY_NOT_RESTORED"],
      ["missing expected params",(doc)=>{delete doc.chains[0].expected_params;},"PARAM_MISMATCH"],
      ["wired chain without attempt record",(doc)=>{delete doc.chains[1].attempt_ref;},"WIRED_MISSING_ATTEMPT"],
      ["legacy hook missing",(doc)=>{doc.chains[0].hooks=[];},"LEGACY_HOOK_MISSING"],
    ];
    for(const [name,fn,code] of breaks){
      it(`rejects a map-level break (${name})`,()=>{
        const dir=mutate(fn);
        try{const result=runWiring(["--map",join(dir,"wiring.md")]);expect(result.status,result.stdout+result.stderr).not.toBe(0);expect(codeOf(result),result.stderr).toBe(code);}
        finally{clean(dir);}
      });
    }
  });

  describe("ORACLE-WIRING-RECOVERY real button-binding removal breaks the page seam",()=>{
    it("a connected handler reaches the old interface and a removed binding does not",async()=>{
      const original=readText(APP);
      const edit=original.replace('elements.button.addEventListener("click", function () {','elements.button.addEventListener("click", function () { return; /* disconnected */');
      expect(edit).not.toBe(original);
      // connected: a real-mode read click reaches GET /records/sample-01
      const s1=spyFetch(()=>({status:200,body:{records:[{name:"a",value:"b"}]}}));
      const c1=loadLegacyClient(original,{origin:"http://127.0.0.1:8768",fetchImpl:s1.impl,search:"?mode=real&recordId=sample-01&action=read"});
      c1.fire("#next-sample","click"); await wait(30);
      expect(s1.calls.some(c=>c.method==="GET"&&c.url.endsWith("/records/sample-01")), "connected binding must reach the old interface").toBe(true);
      // disconnected: the same real click must not reach the old interface, so the old-params read assertion fails
      const dir=mkdtempSync(join(tmpdir(),"p3-disconnect-"));
      try{
        writeFileSync(join(dir,"app.js"),edit);
        const s2=spyFetch(()=>({status:200,body:{records:[{name:"a",value:"b"}]}}));
        const c2=loadLegacyClient(readText(join(dir,"app.js")),{origin:"http://127.0.0.1:8768",fetchImpl:s2.impl,search:"?mode=real&recordId=sample-01&action=read"});
        c2.fire("#next-sample","click"); await wait(30);
        expect(s2.calls.length, "a disconnected handler must not reach the old interface").toBe(0);
      }finally{clean(dir);}
    });
  });

  describe("ORACLE-WIRING-RECOVERY legacy interface receives the exact expected parameters",()=>{
    it("readRecord hits GET /records/sample-01 and writeRecord posts the exact legacy body",async()=>{
      const {impl,calls}=spyFetch(({url,init})=>{
        if((init&&init.method)==="POST")return {status:200,body:{receipt_id:"rcpt-01",recordId:"sample-01",value:"legacy-write",requestId:"req-01",status:"stored",source:"service_store"}};
        return {status:200,body:{records:[{name:"记录名称",value:"x"}]}};
      });
      const client=loadLegacyClient(readText(APP),{origin:"http://127.0.0.1:8768",fetchImpl:impl});
      const gw=new client.LegacySampleGateway({});
      const read=await gw.readRecord({recordId:"sample-01"});
      const write=await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});
      const readCall=calls.find(c=>c.method==="GET");
      const writeCall=calls.find(c=>c.method==="POST");
      expect(readCall.url).toBe("http://127.0.0.1:8768/records/sample-01");
      expect(writeCall.url).toBe("http://127.0.0.1:8768/records");
      const body=JSON.parse(writeCall.body);
      expect(body).toEqual({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});
      expect(writeCall.headers["content-type"]).toBe("application/json");
      expect(read.status).toBe(200);
      expect(write.receipt.source).toBe("service_store");
    });
  });

  describe("ORACLE-WIRING-RECOVERY real legacy interface returns a real receipt and store record",()=>{
    it("writes through the real gateway against the real service and matches the store",async()=>{
      await withService(async({origin,storeFile})=>{
        const client=loadLegacyClient(readText(APP),{origin,fetchImpl:(input,init)=>fetch(input,init)});
        const gw=new client.LegacySampleGateway({});
        const read=await gw.readRecord({recordId:"sample-01"});
        expect(read.record.records.length).toBe(3);
        const write=await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});
        expect(write.receipt.source).toBe("service_store");
        expect(typeof write.receipt.receipt_id).toBe("string");
        const rows=readJson(storeFile);
        const stored=rows.find(r=>r.recordId==="sample-01"&&r.value==="legacy-write"&&r.requestId==="req-01");
        expect(stored,JSON.stringify(rows)).toBeTruthy();
        expect(stored.receipt_id).toBe(write.receipt.receipt_id);
      });
    },30000);
  });

  describe("ORACLE-WIRING-RECOVERY recovers this task's real /records route",()=>{
    it("breaking this task's service route fails real writes; deleting only a new file does not restore; reverting the block does",async()=>{
      // baseline against the real service: write gets a real receipt
      await withService(async({origin})=>{
        const gw=new (loadLegacyClient(readText(APP),{origin,fetchImpl:(input,init)=>fetch(input,init)}).LegacySampleGateway)({});
        const ok=await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});
        expect(ok.receipt.source).toBe("service_store");
      });
      // break THIS task's real block (the POST /records route) in a repo-external temp copy
      const dir=mkdtempSync(join(tmpdir(),"p3-wiring-recover-"));
      const originalService=readText(SERVICE);
      const broken=originalService.replace('if (request.method === "POST" && pathname === "/records") {','if (false && request.method === "POST" && pathname === "/records") {');
      expect(broken).not.toBe(originalService);
      const brokenScript=join(dir,"broken-service.mjs");writeFileSync(brokenScript,broken);
      const marker=join(dir,"new-from-this-task.mjs");writeFileSync(marker,"// a new file this task adds\n");
      try{
        await withService(async({origin})=>{
          const gw=new (loadLegacyClient(readText(APP),{origin,fetchImpl:(input,init)=>fetch(input,init)}).LegacySampleGateway)({});
          await expect(gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"})).rejects.toThrow(/WRITE_FAILED/);
          rmSync(marker,{force:true});
          await expect(gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"})).rejects.toThrow(/WRITE_FAILED/);
        },{script:brokenScript});
        // revert THIS task's block by restoring the original bytes, then real writes recover
        writeFileSync(brokenScript,originalService);
        await withService(async({origin})=>{
          const gw=new (loadLegacyClient(readText(APP),{origin,fetchImpl:(input,init)=>fetch(input,init)}).LegacySampleGateway)({});
          const recovered=await gw.writeRecord({recordId:"sample-01",value:"legacy-write",requestId:"req-01"});
          expect(recovered.receipt.source).toBe("service_store");
        },{script:brokenScript});
      }finally{clean(dir);}
    },60000);
  });

  describe("ORACLE-WIRING-RECOVERY wiring map check is input-driven, not sample-hardcoded",()=>{
    it("accepts a different map that declares its own legacy interface and hooks, and rejects one out of that interface",()=>{
      const alt=(writeInterface)=>({
        schema_version:"1.0.0",kind:"wiring-map",version:"wiring-map.v1",chain_dimensions:["function","interface","entry"],
        legacy_interface:"/api/records",legacy_hooks:[{selector:"#alt-panel",attribute:"data-legacy-hook",value:"alt-result"}],
        chains:[
          {id:"read",function:"AltGateway.read",interface:"GET /api/records/:id",entry:"#alt-next",expected_params:{id:"alpha"},receipt_ref:"read resp",hooks:[{selector:"#alt-panel",attribute:"data-legacy-hook",value:"alt-result"}],status:"wired",attempt_ref:"t",review_ref:"v"},
          {id:"write",function:"AltGateway.write",interface:writeInterface||"POST /api/records",entry:"#alt-next",expected_params:{id:"alpha",value:"v"},receipt_ref:"write resp",hooks:[{selector:"#alt-panel",attribute:"data-legacy-hook",value:"alt-result"}],status:"wired",attempt_ref:"t",review_ref:"v"},
        ],
        gaps:[],recovery:{object:"temp",replay:["x"],restored:true,ref:"r"},
      });
      const writeMap=(doc)=>{const dir=mkdtempSync(join(tmpdir(),"p3-wiring-alt-"));writeFileSync(join(dir,"wiring.md"),"# alt\n\n```json\n"+JSON.stringify(doc,null,2)+"\n```\n");return dir;};
      const okDir=writeMap(alt());
      try{const r=runWiring(["--map",join(okDir,"wiring.md")]);expect(r.status,r.stderr).toBe(0);expect(JSON.parse(r.stdout).legacy_interface).toBe("/api/records");}finally{clean(okDir);}
      const badDir=writeMap(alt("POST /elsewhere"));
      try{const r=runWiring(["--map",join(badDir,"wiring.md")]);expect(r.status,r.stderr).not.toBe(0);expect(codeOf(r)).toBe("WRONG_INTERFACE");}finally{clean(badDir);}
    });
  });

  describe("ORACLE-WIRING-RECOVERY browser scenario entry (smoke: tokens present, not behaviour evidence)",()=>{
    it("declares a wiring scenario that reuses the owned session and service tokens",()=>{
      const source=readText(SELF_PATH);
      for(const token of ["runWiringBrowserScenario","BROWSER_QA_EGO_TASKSPACE_NAME","reuse","store"])expect(source,`entry must carry ${token}`).toContain(token);
    });
  });
}

// ---------------------------------------------------------------------------
// Exported for the data scenario. Reuses the owned Ego session and the already
// running 8768 service; starts no second service or browser.
// ---------------------------------------------------------------------------
export async function runWiringBrowserScenario({taskSpaceName,helperPath,baseUrl,storeFile,evidenceDir,origin}){
  const exitv=(code,payload)=>{process.stdout.write(JSON.stringify(payload)+"\n");return {code,payload};};
  const resultPath=join(evidenceDir||tmpdir(),"p3-wiring-observation.json");
  const screenshotPath=join(evidenceDir||tmpdir(),"p3-wiring-1440x1000.png");
  const worker=buildWiringWorker({origin,resultPath,screenshotPath,taskSpaceName:taskSpaceName||process.env.BROWSER_QA_EGO_TASKSPACE_NAME});
  const run=await runEgoWorker(helperPath||process.env.BROWSER_QA_EGO_HELPER_PATH||"ego-browser",worker);
  if(!existsSync(resultPath))return {ok:false,code:"WIRING_WORKER_NO_ORIGINAL",exit:run.status,stderr:String(run.stderr||"").slice(0,1500)};
  const envelope=JSON.parse(readFileSync(resultPath,"utf8"));
  if(envelope.ok!==true)return {ok:false,code:envelope.code||"WIRING_WORKER_FAILED",detail:envelope.message||""};
  const facts=envelope.facts;
  // spy service requests (boundary observation, not a substitute for the page seam)
  const spy=await httpJson(origin+"/requests");
  const requests=spy.body.requests||[];
  const readSeen=requests.some(r=>r.method==="GET"&&r.record_id==="sample-01");
  let pageReceipt=null;
  try{pageReceipt=JSON.parse(String(facts.write&&facts.write.receipt||"").replace(/^回执：/,""));}catch{pageReceipt=null;}
  const writeReq=pageReceipt?requests.find(r=>r.method==="POST"&&r.body&&r.body.recordId===pageReceipt.recordId&&r.body.value===pageReceipt.value&&r.body.requestId===pageReceipt.requestId):undefined;
  let stored=[];try{stored=readJson(storeFile);}catch{/* keep empty */}
  // exact match: the page receipt, the store row and the POST spy must be the same record by requestId AND receipt_id
  const storedRow=pageReceipt?stored.find(r=>r.requestId===pageReceipt.requestId):undefined;
  const exactMatch=Boolean(pageReceipt&&writeReq&&storedRow&&storedRow.receipt_id===pageReceipt.receipt_id&&pageReceipt.source==="service_store"&&storedRow.recordId===pageReceipt.recordId&&storedRow.value===pageReceipt.value);
  const checks=[
    {id:"old-params-read",passed:readSeen},
    {id:"old-params-write",passed:Boolean(writeReq),observed:{requestId:pageReceipt&&pageReceipt.requestId}},
    {id:"page-consumes-real-receipt",passed:facts.write&&facts.write.resultState==="receipt"&&typeof facts.write.receipt==="string"&&facts.write.receipt.length>0},
    {id:"store-has-record",passed:Boolean(storedRow),observed:{requestId:storedRow&&storedRow.requestId}},
    {id:"receipt-store-exact-match",passed:exactMatch,observed:{page_receipt_id:pageReceipt&&pageReceipt.receipt_id,store_receipt_id:storedRow&&storedRow.receipt_id,requestId:pageReceipt&&pageReceipt.requestId}},
    {id:"legacy-hook-kept",passed:facts.hook==="sample-result"},
    {id:"real-read-success",passed:facts.read&&facts.read.resultState==="success"&&Number(facts.read.records)>=1},
  ];
  const payload={schema_version:"1.0.0",kind:"p3-wiring-browser-observation",ok:checks.every(c=>c.passed),checks,facts,spy:{readSeen,writeSeen:Boolean(writeReq),pageReceipt,storedRow:storedRow??null},worker:{exit:run.status,stderr:String(run.stderr||"").slice(0,1000)}};
  writeFileSync(resultPath,JSON.stringify(payload,null,2)+"\n");
  try{
    const {openTask}=await import(new URL('../../runtime/task/task-handle.mjs',import.meta.url).href);
    const taskRoot=process.env.TASK_RECORD_ROOT;const taskId=process.env.BROWSER_QA_TASK_ID;
    if(taskRoot&&taskId&&existsSync(taskRoot)&&evidenceDir){
      const handle=openTask(taskRoot,{projectName:"workflowhub",taskId});
      if(existsSync(screenshotPath))await handle.appendRecord({dir:"quality/evidence/build-code/P3",slug:"p3-wiring-browser-1440x1000",ext:"png",bytes:readFileSync(screenshotPath)});
      await handle.appendRecord({dir:"quality/evidence/build-code/P3",slug:"p3-wiring-browser-observation",ext:"json",bytes:readFileSync(resultPath)});
    }
  }catch{/* evidence publication failure is reported via result_ref */ }
  return {ok:payload.ok,checks,facts,result_ref:resultPath};
}

function buildWiringWorker({origin,resultPath,screenshotPath,taskSpaceName}){
  const input=JSON.stringify({origin,resultPath,screenshotPath,taskSpaceName});
  return `process.env.BROWSER_QA_EGO_TASKSPACE_NAME=${JSON.stringify(taskSpaceName)};
const input=${input};const fs=await import("node:fs");const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
try{
  const task=await taskSpace(input.taskSpaceName);const page=task.page(process.env.BROWSER_QA_EGO_PAGE_LABEL||"p1");
  const result={ok:true,engine:"ego-lite",url:input.origin,facts:{}};
  await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const read=()=>page.evaluate(()=>{const t=(s)=>{const n=document.querySelector(s);return n?n.textContent.trim():null;};const p=document.querySelector("#result-panel");return{resultState:p?p.getAttribute("data-state"):null,records:document.querySelectorAll("#result-content .sample-values__row").length,receipt:(()=>{const n=document.querySelector("#result-content .receipt-line");return n?n.textContent.trim():null;})(),hook:p?p.getAttribute("data-legacy-hook"):null};},{});
  const click=()=>page.evaluate(()=>{const b=document.querySelector("#next-sample");if(b)b.click();},{});
  await page.goto(input.origin+"/index.html?mode=real&recordId=sample-01&action=read");await page.waitForSelector("#next-sample");await click();await wait(500);
  const r=await read();result.facts.hook=r.hook;result.facts.read={resultState:r.resultState,records:r.records};
  await page.goto(input.origin+"/index.html?mode=real&recordId=sample-01&action=write&value=legacy-write");await page.waitForSelector("#next-sample");await click();await wait(600);
  const w=await read();result.facts.write={resultState:w.resultState,receipt:w.receipt};
  await page.screenshot({path:input.screenshotPath});result.facts.screenshot=input.screenshotPath;
  fs.writeFileSync(input.resultPath,JSON.stringify(result));
}catch(error){fs.writeFileSync(input.resultPath,JSON.stringify({ok:false,engine:"ego-lite",code:error&&error.code||null,message:String(error&&error.message||error).slice(0,2000)}));}
`;
}

function runEgoWorker(helper,source){
  return new Promise(resolveRun=>{
    const child=spawn(helper,["nodejs","-e",source],{env:{...process.env},stdio:["ignore","pipe","pipe"]});
    let stdout="",stderr="";const timer=setTimeout(()=>{try{child.kill("SIGTERM");}catch{/* preserve timeout */}},300000);
    child.stdout.on("data",c=>{stdout+=c;});child.stderr.on("data",c=>{stderr+=c;});
    child.on("error",error=>{clearTimeout(timer);resolveRun({status:null,signal:null,stdout,stderr:String(error.message)});});
    child.on("close",(code,signal)=>{clearTimeout(timer);resolveRun({status:code,signal,stdout,stderr});});
  });
}
