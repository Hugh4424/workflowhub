// ORACLE-VISUAL-REVIEW
// 本文件通过只证明当前视觉审查报告的形状、固定视口/环境/对象身份、设计对分径与字节、固定八态覆盖
// 与差异处置；不证明实际页面视觉无差异，也不替代独立设计审查者看图判断。实际截图与语义结论由
// 独立审查者经 appendRecord 保存到真实报告目录，本文件只对固定形状夹具与真实采集骨架做正负判定。
// RED 只落视觉合同目标断言；浏览器不可用与收集/导入失败另记，独立语义结论不由退出码产生。
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=process.cwd();
const SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-visual-review.mjs");
const VISUAL_DIR=join(ROOT,"tests/fixtures/design-port-sample/visual");
const SELF_PATH=fileURLToPath(import.meta.url);
const SCENARIO=process.argv.includes("--browser-scenario");
// P4 固定八态（实际可观察）。timeout 页态不进本轮固定八态截图，是 unavailable 具名缺口，不进 observed/required。
const REQUIRED_ACTUAL=["success","loading","empty","error","sample-write-refused","real-success","receipt","recovered"];

if(SCENARIO){ await runBrowserScenario(); }
else { const vitest=await import('vitest'); defineTests(vitest); }

function runCheck(args){return spawnSync(process.execPath,[SCRIPT,...args],{cwd:ROOT,encoding:"utf8",timeout:120000});}
function readJson(file){return JSON.parse(readFileSync(file,"utf8"));}
function sha(file){return createHash("sha256").update(readFileSync(file)).digest("hex");}
function clean(dir){try{rmSync(dir,{recursive:true,force:true});}catch{/* keep first failure */}}
function codeOf(result){try{return JSON.parse(result.stderr).error.code;}catch{return null;}}
function outJson(result){try{return JSON.parse(result.stdout);}catch{return null;}}
function mutateReview(mutate){
  const dir=mkdtempSync(join(tmpdir(),"p4-visual-break-"));
  cpSync(VISUAL_DIR,dir,{recursive:true});
  const file=join(dir,"review.json");
  const doc=readJson(file);
  mutate(doc,dir);
  writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
  return dir;
}

function defineTests({describe,it,expect}){
  describe("ORACLE-VISUAL-REVIEW accepts the committed visual review fixture",()=>{
    it("check script exists and accepts the shape fixture with a content-bound report",()=>{
      expect(existsSync(SCRIPT),"check-visual-review.mjs must exist").toBe(true);
      const r=runCheck(["--dir",VISUAL_DIR]);
      expect(r.status,r.stdout+r.stderr).toBe(0);
      const report=outJson(r);
      expect(report.ok,report).toBe(true);
      expect(report.kind).toBe("visual-review");
      expect(report.content&&report.content.review_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(typeof report.head==="string"||report.head===null).toBe(true);
      expect(report.states_observed).toEqual(REQUIRED_ACTUAL);
    });
  });

  describe("ORACLE-VISUAL-REVIEW refuses unresolved, unreasoned, old-image and incomplete reviews",()=>{
    const cases=[
      ["an unresolved diff",doc=>{doc.diffs[0].status="unresolved";},"UNRESOLVED_DIFF"],
      ["an accepted diff without reason",doc=>{doc.diffs[2].reason="";},"ACCEPTANCE_WITHOUT_REASON"],
      ["a missing environment identity",doc=>{delete doc.environment.font;},"ENVIRONMENT_IDENTITY_MISSING"],
      ["a missing read_at timestamp",doc=>{delete doc.read_at;},"READ_AT_MISSING"],
      ["a missing object identity",doc=>{delete doc.object_identity;},"OBJECT_IDENTITY_MISSING"],
      ["a design/implementation self comparison",doc=>{doc.design_pairs[0].implementation.path=doc.design_pairs[0].design.path;},"SELF_COMPARISON"],
      ["old prototype image reuse",doc=>{doc.screenshots[0].sha256=doc.forbidden_old_hashes[0];},"OLD_IMAGE_REUSE"],
      ["missing screenshots",doc=>{doc.screenshots=[];},"SCREENSHOT_MISSING"],
      ["a non-fixed viewport",doc=>{doc.viewport.dpr=2;},"FIXED_VIEWPORT_REQUIRED"],
      ["required_states drops a required state",doc=>{doc.required_states=doc.required_states.filter(s=>s!=="real-success");},"REQUIRED_STATES_INCOMPLETE"],
      ["a required state with neither screenshot nor gap",doc=>{doc.screenshots=doc.screenshots.filter(s=>s.state!=="real-success");},"STATE_NOT_OBSERVED"],
    ];
    for(const [name,mutate,code] of cases){
      it(`rejects ${name} -> ${code}`,()=>{
        const dir=mutateReview(mutate);
        try{
          const r=runCheck(["--dir",dir]);
          expect(r.status,r.stdout+r.stderr).not.toBe(0);
          expect(codeOf(r),r.stderr).toBe(code);
        }finally{clean(dir);}
      });
    }
  });

  describe("ORACLE-VISUAL-REVIEW binds real bytes when verify is on (implementation change must fail)",()=>{
    function validDesignPair(dir){
      // design = real prototype index.html; implementation = a temp copy with matching bytes (not self).
      const implCopy=join(dir,"impl-index.html");
      writeFileSync(implCopy,readFileSync(join(ROOT,"tests/fixtures/design-port-sample/prototype/index.html")));
      return {state:"success",design:{path:join(ROOT,"tests/fixtures/design-port-sample/prototype/index.html"),sha256:sha(join(ROOT,"tests/fixtures/design-port-sample/prototype/index.html"))},implementation:{path:implCopy,sha256:sha(implCopy)},url:"http://localhost.test/index.html"};
    }
    it("rejects a changed implementation byte via design-pair recompute (DESIGN_PAIR_HASH_MISMATCH)",()=>{
      const dir=mutateReview((doc,d)=>{doc.verify_screenshot_bytes=true;doc.design_pairs=[validDesignPair(d)];});
      try{
        writeFileSync(join(dir,"impl-index.html"),readFileSync(join(dir,"impl-index.html"),"utf8")+"\n<!-- impl changed after registration -->\n");
        const r=runCheck(["--dir",dir]);
        expect(r.status,r.stdout+r.stderr).not.toBe(0);
        expect(codeOf(r),r.stderr).toBe("DESIGN_PAIR_HASH_MISMATCH");
      }finally{clean(dir);}
    });
    it("rejects missing or mismatched screenshot files when verify_screenshot_bytes is true",()=>{
      const dir=mutateReview((doc,d)=>{doc.verify_screenshot_bytes=true;doc.design_pairs=[validDesignPair(d)];doc.screenshots[0].path="missing.png";});
      try{
        const missing=runCheck(["--dir",dir]);
        expect(missing.status,missing.stdout+missing.stderr).not.toBe(0);
        expect(codeOf(missing),missing.stderr).toBe("SCREENSHOT_MISSING");
        const tdir=mutateReview((doc,d)=>{doc.verify_screenshot_bytes=true;doc.design_pairs=[validDesignPair(d)];writeFileSync(join(d,"shot.png"),"bytes\n");doc.screenshots[0].path="shot.png";doc.screenshots[0].sha256="0".repeat(64);});
        try{
          const mismatch=runCheck(["--dir",tdir]);
          expect(mismatch.status).not.toBe(0);
          expect(codeOf(mismatch)).toBe("SCREENSHOT_HASH_MISMATCH");
        }finally{clean(tdir);}
      }finally{clean(dir);}
    });
    it("a config that is missing is unverified (exit 2)",()=>{
      const missing=runCheck(["--dir",join(tmpdir(),"no-such-visual-dir")]);
      expect(missing.status).toBe(2);
      expect(codeOf(missing)).toBe("VISUAL_REVIEW_CONFIG_UNAVAILABLE");
    });
  });

  describe("ORACLE-VISUAL-REVIEW counts a timeout gap as gap, never as observed (F1)",()=>{
    const baseFacts=()=>({viewport:{width:1440,height:1000,dpr:1},environment:{userAgent:"ua",fontFamily:"font",dpr:1},scroll:{scrollWidth:1440,clientWidth:1440},
      states:{success:{stateLabel:"成功"},loading:{stateLabel:"成功"},empty:{stateLabel:"空"},error:{stateLabel:"错误"},"sample-write-refused":{stateLabel:"拒绝写入"},"real-success":{stateLabel:"成功"},receipt:{stateLabel:"写入回执"},recovered:{stateLabel:"成功"},timeout:{status:"unavailable",reason:"no client seam"}},
      screenshots:REQUIRED_ACTUAL.map(s=>({state:s,file:s+".png"}))});
    it("passes on the fixed eight observed states and lists timeout only as a gap",()=>{
      const checks=evaluateVisualFacts(baseFacts());
      const dso=checks.find(c=>c.id==="declared-states-observed");
      expect(dso.passed).toBe(true);
      expect(dso.observed).not.toContain("timeout");
      expect(dso.gaps).toContain("timeout");
      expect(checks.find(c=>c.id==="screenshots-per-state").passed).toBe(true);
    });
    it("fails when a real state is missing (timeout cannot backfill it)",()=>{
      const facts=baseFacts();delete facts.states["real-success"];
      expect(evaluateVisualFacts(facts).find(c=>c.id==="declared-states-observed").passed).toBe(false);
    });
  });
}

// ---------------------------------------------------------------------------
// Browser scenario: node tests/contract/design-port-visual-review.test.mjs --browser-scenario
// under isolated-browser-qa. It reuses the service object readied by task 1 (address from BROWSER_QA_TARGET_URL), drives the owned
// Ego page at 1440x1000/DPR1, captures per-state screenshots + facts, builds a content-bound
// observation + review skeleton, and publishes originals. It starts no second service.
// All task-specific coordinates come from env: BROWSER_QA_TARGET_URL / BROWSER_QA_EVIDENCE_DIR
// / BROWSER_QA_TASK_ID / TASK_RECORD_ROOT / P4_VISUAL_RECORD_DIR / P4_VISUAL_SLUG_PREFIX /
// P4_FORBIDDEN_OLD_HASHES. Nothing about this task's dir, port or slug is hardcoded here.
// ---------------------------------------------------------------------------
function evaluateVisualFacts(facts){
  const checks=[];
  const vp=facts.viewport||{};
  checks.push({id:"fixed-viewport",passed:vp.width===1440&&vp.height===1000&&vp.dpr===1,observed:vp});
  const env=facts.environment||{};
  checks.push({id:"environment-identity",passed:Boolean(env.userAgent)&&Boolean(env.fontFamily)&&Number(env.dpr)===1,observed:env});
  checks.push({id:"no-horizontal-overflow",passed:Boolean(facts.scroll)&&facts.scroll.scrollWidth<=facts.scroll.clientWidth,observed:facts.scroll||null});
  const states=facts.states||{};
  const gapKeys=Object.entries(states).filter(([,v])=>v&&v.status==="unavailable").map(([k])=>k);
  const observedKeys=Object.keys(states).filter(k=>!gapKeys.includes(k));
  checks.push({id:"declared-states-observed",passed:REQUIRED_ACTUAL.every(s=>observedKeys.includes(s)),observed:observedKeys,gaps:gapKeys});
  const shotStates=new Set((facts.screenshots||[]).map(s=>s.state));
  checks.push({id:"screenshots-per-state",passed:REQUIRED_ACTUAL.every(s=>shotStates.has(s)),observed:[...shotStates]});
  return checks;
}
async function httpGet(url,{timeoutMs=1500}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(Object.assign(new Error("ABORT"),{name:"AbortError"})),timeoutMs);
  try{const response=await fetch(url,{signal:controller.signal});const text=await response.text();let body=null;try{body=JSON.parse(text);}catch{body=text;}return {status:response.status,body};}
  finally{clearTimeout(timer);}
}
async function waitReady(baseUrl,{attempts=60,interval=100}={}){
  for(let i=0;i<attempts;i+=1){try{const {status,body}=await httpGet(baseUrl+"/identity");if(status===200&&body&&body.ok)return body;}catch{/* retry */}await new Promise(r=>setTimeout(r,interval));}
  return null;
}
async function runBrowserScenario(){
  const exit=(code,payload)=>{process.stdout.write(JSON.stringify(payload)+"\n");process.exitCode=code;};
  const baseUrl=process.env.BROWSER_QA_TARGET_URL;
  if(!baseUrl)return exit(2,{ok:false,code:"TARGET_URL_UNAVAILABLE"});
  const origin=new URL(baseUrl).origin;
  const taskSpaceName=process.env.BROWSER_QA_EGO_TASKSPACE_NAME;
  const helperPath=process.env.BROWSER_QA_EGO_HELPER_PATH||"ego-browser";
  if(!taskSpaceName)return exit(2,{ok:false,code:"EGO_TASKSPACE_NAME_UNAVAILABLE"});
  const evidenceDir=process.env.BROWSER_QA_EVIDENCE_DIR||mkdtempSync(join(tmpdir(),"p4-visual-evidence-"));
  const recordDir=process.env.P4_VISUAL_RECORD_DIR||null;
  const slugPrefix=process.env.P4_VISUAL_SLUG_PREFIX||"p4-visual";
  const identity=await waitReady(origin);
  if(!identity)return exit(2,{ok:false,code:"SERVICE_NOT_READY",origin});
  const outputRoot=identity.output_root;
  if(typeof outputRoot!=="string"||!existsSync(outputRoot))return exit(2,{ok:false,code:"P2_OUTPUT_ROOT_UNAVAILABLE",output_root:outputRoot??null});
  const readAt=new Date().toISOString();
  const observationPath=join(evidenceDir,"p4-visual-observation.json");
  const worker=buildVisualWorker({origin,evidenceDir,taskSpaceName});
  const run=await runEgoWorker(helperPath,worker);
  if(!existsSync(observationPath))return exit(6,{ok:false,code:"BROWSER_WORKER_NO_ORIGINAL",exit:run.status,stderr:String(run.stderr||"").slice(0,2000)});
  const envelope=JSON.parse(readFileSync(observationPath,"utf8"));
  if(envelope.ok!==true)return exit(6,{ok:false,code:envelope.code||"BROWSER_WORKER_FAILED",detail:envelope.message||""});
  const facts=envelope.facts;
  const checks=evaluateVisualFacts(facts);
  const review=buildReviewSkeleton({facts,identity,outputRoot,readAt,evidenceDir});
  const reviewPath=join(evidenceDir,"review.json");
  writeFileSync(reviewPath,JSON.stringify(review,null,2)+"\n");
  const checkRun=spawnSync(process.execPath,[SCRIPT,"--dir",evidenceDir],{cwd:ROOT,encoding:"utf8",timeout:120000});
  const payload={schema_version:"1.0.0",kind:"p4-visual-observation",ok:checks.every(c=>c.passed)&&checkRun.status===0,object:{output_root:outputRoot,url:origin,viewport:"1440x1000@1",service_pid:identity.pid,read_at:readAt},checks,facts,review_check:{exit:checkRun.status,stdout:String(checkRun.stdout||"").slice(0,800),stderr:String(checkRun.stderr||"").slice(0,800)},worker:{exit:run.status,stderr:String(run.stderr||"").slice(0,1500)},published:[]};
  writeFileSync(observationPath,JSON.stringify(payload,null,2)+"\n");
  const published=[];
  try{
    const {openTask}=await import(new URL('../../runtime/task/task-handle.mjs',import.meta.url).href);
    const taskRoot=process.env.TASK_RECORD_ROOT;const taskId=process.env.BROWSER_QA_TASK_ID;
    if(taskRoot&&taskId&&recordDir&&existsSync(taskRoot)){
      const handle=openTask(taskRoot,{projectName:"workflowhub",taskId});
      for(const shot of (facts.screenshots||[])){
        const abs=join(evidenceDir,shot.file);
        if(existsSync(abs))published.push(await handle.appendRecord({dir:recordDir,slug:`${slugPrefix}-${shot.state}-1440x1000`,ext:"png",bytes:readFileSync(abs)}));
      }
      // Publish the skeleton first, snapshot the observation with the real refs, then append the
      // observation LAST: the archived copy can never carry an empty published list (order defect).
      published.push(await handle.appendRecord({dir:recordDir,slug:`${slugPrefix}-review-skeleton`,ext:"json",bytes:readFileSync(reviewPath)}));
      payload.published=published.slice();writeFileSync(observationPath,JSON.stringify(payload,null,2)+"\n");
      published.push(await handle.appendRecord({dir:recordDir,slug:`${slugPrefix}-observation`,ext:"json",bytes:readFileSync(observationPath)}));
    }
  }catch{/* evidence publication failure is reported via review_check/observation_ref */}
  return exit(payload.ok?0:6,{ok:payload.ok,checks,review_check:{exit:checkRun.status},published,observation_ref:observationPath,evidence_dir:evidenceDir});
}
function buildReviewSkeleton({facts,identity,outputRoot,readAt,evidenceDir}){
  const designFile=join(ROOT,"tests/fixtures/design-port-sample/prototype/index.html");
  const implFile=join(outputRoot,"index.html");
  const shots=(facts.screenshots||[]).map(s=>({state:s.state,path:s.file,sha256:sha(join(evidenceDir,s.file)),viewport:"1440x1000@1"}));
  const env=facts.environment||{};
  const forbidden=(process.env.P4_FORBIDDEN_OLD_HASHES||"").split(",").map(s=>s.trim()).filter(Boolean);
  const implSha=existsSync(implFile)?sha(implFile):null;
  return {
    schema_version:"1.0.0",kind:"visual-review",verify_screenshot_bytes:true,
    viewport:{width:1440,height:1000,dpr:1},
    environment:{browser:env.userAgent||null,font:env.fontFamily||null,dpr:env.dpr??null},
    read_at:readAt,
    object_identity:{workspace:process.env.BROWSER_QA_WORKSPACE||ROOT,service:identity.url||null,route:"/index.html",state:"success",viewport:"1440x1000@1",engine:"ego-lite/chromium 156",engine_session:process.env.BROWSER_QA_EGO_TASKSPACE_NAME||"owned-p1",object_version:implSha},
    design_pairs:[{state:"success",design:{path:designFile,sha256:existsSync(designFile)?sha(designFile):null},implementation:{path:implFile,sha256:implSha},url:(identity.url||"")+"/index.html"}],
    screenshots:shots,
    states_observed:shots.map(s=>s.state),
    required_states:REQUIRED_ACTUAL.slice(),
    forbidden_old_hashes:forbidden,
    diffs:[{id:"machine-viewport",state:"success",item:"fixed viewport 1440x1000 DPR1",status:"none"}],
    unresolved:0,
    gaps:[{state:"timeout",status:"unavailable",reason:"固定八态未采 timeout 截图；超时页态由 P3 数据面与客户端页面反例覆盖"}],
    note:"机器采集骨架：仅记录可机器核对的维度与真实截图字节；视觉差异结论须由独立审查者看图补全。"
  };
}
function buildVisualWorker({origin,evidenceDir,taskSpaceName}){
  const input=JSON.stringify({origin,evidenceDir,taskSpaceName});
  return `process.env.BROWSER_QA_EGO_TASKSPACE_NAME=${JSON.stringify(taskSpaceName)};
const input=${input};const fs=await import("node:fs");const path=await import("node:path");
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
try{
  const task=await taskSpace(input.taskSpaceName);
  const page=task.page(process.env.BROWSER_QA_EGO_PAGE_LABEL||"p1");
  const result={ok:true,engine:"ego-lite",url:input.origin,facts:{screenshots:[]}};
  await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const shot=async(state)=>{const file=state+"-1440x1000.png";await page.screenshot({path:path.join(input.evidenceDir,file)});result.facts.screenshots.push({state,file});};
  const read=()=>page.evaluate(()=>{const t=(s)=>{const n=document.querySelector(s);return n?n.textContent.trim():null;};const p=document.querySelector("#result-panel");return{stateLabel:t("#state-label"),resultState:p?p.getAttribute("data-state"):null,records:document.querySelectorAll("#result-content .sample-values__row").length,receipt:(()=>{const n=document.querySelector("#result-content .receipt-line");return n?n.textContent.trim():null;})(),sampleTags:document.querySelectorAll("[data-sample-tag]").length,buttonLabel:t("#next-sample"),ariaBusy:p?p.getAttribute("aria-busy"):null,hook:p?p.getAttribute("data-legacy-hook"):null,viewport:{width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio},scroll:{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}};},{});
  const click=()=>page.evaluate(()=>{const b=document.querySelector("#next-sample");if(b)b.click();},{});
  await page.goto(input.origin+"/index.html");await page.waitForSelector("#next-sample");
  const first=await read();
  result.facts.viewport=first.viewport;result.facts.scroll=first.scroll;
  result.facts.environment=await page.evaluate(()=>({userAgent:navigator.userAgent,fontFamily:getComputedStyle(document.querySelector(".sample-page")).fontFamily,dpr:window.devicePixelRatio}),{});
  const states={};
  states.success=await read();await shot("success");
  await click();states.loading=await read();await shot("loading");await wait(360);
  states.empty=await read();await shot("empty");
  await click();await wait(360);states.error=await read();await shot("error");
  await page.goto(input.origin+"/index.html?action=write");await page.waitForSelector("#next-sample");await click();await wait(260);states["sample-write-refused"]=await read();await shot("sample-write-refused");
  const real=async(p)=>{await page.goto(input.origin+"/index.html?"+p);await page.waitForSelector("#next-sample");const init=await read();await click();await wait(500);return {init,done:await read()};};
  const rs=await real("mode=real&recordId=sample-01&action=read");states["real-success"]=rs.done;await shot("real-success");
  const rw=await real("mode=real&recordId=sample-01&action=write&value=legacy-write");states.receipt=rw.done;await shot("receipt");
  const re=await real("mode=real&recordId=error&action=read");states.errorReal=re.done;
  const rrec=await real("mode=real&recordId=sample-01&action=read");states.recovered=rrec.done;await shot("recovered");
  states.timeout={status:"unavailable",reason:"固定八态未采 timeout 截图；超时页态由 P3 数据面与客户端页面反例覆盖"};
  result.facts.states={loading:states.loading,success:states.success,empty:states.empty,error:states.error,"sample-write-refused":states["sample-write-refused"],"real-success":states["real-success"],receipt:states.receipt,recovered:states.recovered,timeout:states.timeout};
  result.facts.hook=first.hook;
  fs.writeFileSync(path.join(input.evidenceDir,"p4-visual-observation.json"),JSON.stringify(result));
}catch(error){fs.writeFileSync(path.join(input.evidenceDir,"p4-visual-observation.json"),JSON.stringify({ok:false,engine:"ego-lite",code:error&&error.code||null,message:String(error&&error.message||error).slice(0,2000)}));}
`;
}
async function runEgoWorker(helper,source){
  return new Promise(resolveRun=>{
    const child=spawn(helper,["nodejs","-e",source],{env:{...process.env},stdio:["ignore","pipe","pipe"]});
    let stdout="",stderr="";const timer=setTimeout(()=>{try{child.kill("SIGTERM");}catch{/* preserve timeout */}},300000);
    child.stdout.on("data",c=>{stdout+=c;});child.stderr.on("data",c=>{stderr+=c;});
    child.on("error",error=>{clearTimeout(timer);resolveRun({status:null,signal:null,stdout,stderr:String(error.message)});});
    child.on("close",(code,signal)=>{clearTimeout(timer);resolveRun({status:code,signal,stdout,stderr});});
  });
}
