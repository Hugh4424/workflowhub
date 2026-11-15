// ORACLE-PORT-MANIFEST
// 本文件通过只证明当前 manifest、固定样本与生成规则；不证明任意框架、真实数据、
// 未来真实设计源或长期使用。所有受控破坏只发生在临时副本，原样本与原型不改。
// RED 只落目标断言；收集、导入与环境失败另记。
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync, readdirSync, statSync, mkdirSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=process.cwd();
const SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-port-manifest.mjs");
const FIXTURE_ROOT=join(ROOT,"tests/fixtures/design-port-sample");
const MANIFEST=join(FIXTURE_ROOT,"port/manifest.json");
const DESIGN=join(FIXTURE_ROOT,"prototype");
const SESSION_MODULE=new URL('../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs',import.meta.url).href;
const SELF_PATH=fileURLToPath(import.meta.url);

const SCENARIO=process.argv.includes("--browser-scenario");
if(SCENARIO){
  await runBrowserScenario();
}else{
  const vitest=await import('vitest');
  definePortTests(vitest);
}

function runScript(args,{cwd=ROOT}={}){return spawnSync(process.execPath,[SCRIPT,...args],{cwd,encoding:"utf8",timeout:180000});}
function generate(output,{manifest=MANIFEST,design=DESIGN}={}){return runScript(["--mode=generate","--manifest",manifest,"--design-root",design,"--output",output]);}
function check({manifest=MANIFEST,design=DESIGN,output}={}){const args=["--mode=check","--manifest",manifest,"--design-root",design];if(output)args.push("--output",output);return runScript(args);}
function sha(file){return createHash("sha256").update(readFileSync(file)).digest("hex");}
function copyInto(tag,from){const root=mkdtempSync(join(tmpdir(),tag));const to=join(root,basename(from));cpSync(from,to,{recursive:true});return {root,to};}
function copyDirInto(tag,from){const root=mkdtempSync(join(tmpdir(),tag));const to=join(root,"copy");cpSync(from,to,{recursive:true});return {root,to};}
function workspace(){const root=mkdtempSync(join(tmpdir(),"p2-port-ws-"));const base=join(root,"design-port-sample");cpSync(FIXTURE_ROOT,base,{recursive:true});return {root,base,manifest:join(base,"port/manifest.json"),design:join(base,"prototype")};}
function outputDir(){return mkdtempSync(join(tmpdir(),"p2-port-out-"));}
function clean(dir){rmSync(dir,{recursive:true,force:true});}
function readJson(file){return JSON.parse(readFileSync(file,"utf8"));}
function writeJson(file,value){writeFileSync(file,JSON.stringify(value,null,2)+"\n");}
function failed(result,code){return result.status!==0&&result.stderr.includes(code);}

function applyRegistered(sourceText,changes){
  const lines=sourceText.split("\n");
  const ordered=[...changes].sort((left,right)=>left.line-right.line);
  const output=[];
  let cursor=0;
  for(const change of ordered){
    output.push(...lines.slice(cursor,change.line-1));
    output.push(...change.to.split("\n"));
    cursor=change.line;
  }
  output.push(...lines.slice(cursor));
  return output.join("\n");
}

function definePortTests({describe,it,expect}){
  describe("ORACLE-PORT-MANIFEST accepts the registered fixture",()=>{
    it("check mode accepts the fixture manifest with source-read specificity budget",()=>{
      const result=check();
      expect(result.status,result.stderr).toBe(0);
      const summary=JSON.parse(result.stdout);
      expect(summary.ok).toBe(true);
      expect(summary.mode).toBe("check");
      expect(summary.budget).toEqual([0,3,1]);
      expect(summary.files.map(item=>item.target).sort()).toEqual(["app.js","index.html","styles.css"]);
      expect(summary.used_classes).toBe(26);
    });
    it("generate mode writes the port files and reports actual hashes",()=>{
      const out=outputDir();
      try{
        const result=generate(out);
        expect(result.status,result.stderr).toBe(0);
        const summary=JSON.parse(result.stdout);
        expect(summary.mode).toBe("generate");
        expect(resolve(summary.output_root)).toBe(resolve(out));
        const files=readdirSync(out).sort();
        expect(files).toEqual(["app.js","index.html","manual-overrides.css","styles.css"]);
        for(const item of summary.files)expect(sha(join(out,item.target))).toBe(item.sha256);
        expect(summary.manual.status).toBe("copied");
      }finally{clean(out);}
    });
    it("re-running generation is byte-stable and never touches the design source",()=>{
      const first=outputDir(),second=outputDir();
      const before=[sha(join(DESIGN,"index.html")),sha(join(DESIGN,"styles.css")),sha(join(DESIGN,"app.js"))];
      try{
        expect(generate(first).status).toBe(0);
        expect(generate(second).status).toBe(0);
        for(const name of ["index.html","styles.css","app.js","manual-overrides.css"]){
          expect(sha(join(first,name)),name+" must be byte-stable").toBe(sha(join(second,name)));
        }
        expect([sha(join(DESIGN,"index.html")),sha(join(DESIGN,"styles.css")),sha(join(DESIGN,"app.js"))]).toEqual(before);
      }finally{clean(first);clean(second);}
    });
    it("pure copy keeps app.js and the scoped stylesheet byte-identical",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        expect(readFileSync(join(out,"app.js"))).toEqual(readFileSync(join(DESIGN,"app.js")));
        expect(readFileSync(join(out,"styles.css"))).toEqual(readFileSync(join(DESIGN,"styles.css")));
      }finally{clean(out);}
    });
    it("registered import and direct changes explain every index.html difference",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const manifest=readJson(MANIFEST);
        const entry=manifest.files.find(file=>file.target==="index.html");
        const changes=[...(entry.import_changes||[]),...(entry.direct_changes||[])];
        expect(changes.some(change=>change.reason)).toBe(true);
        const sourceText=readFileSync(join(DESIGN,"index.html"),"utf8");
        expect(applyRegistered(sourceText,changes)).toBe(readFileSync(join(out,"index.html"),"utf8"));
        for(const change of changes)expect(sourceText.split("\n")[change.line-1],`change anchor at line ${change.line}`).toBe(change.from);
      }finally{clean(out);}
    });
    it("check --output accepts the generated output",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const result=check({output:out});
        expect(result.status,result.stderr).toBe(0);
        expect(JSON.parse(result.stdout).ok).toBe(true);
      }finally{clean(out);}
    });
    it("compares specificity lexicographically and accepts a compliant descendant selector",()=>{
      const ws=workspace();
      try{
        const stylesPath=join(ws.design,"styles.css");
        const original=readFileSync(stylesPath,"utf8");
        const next=original+"\n.sample-page div p {\n  margin: 0;\n}\n";
        writeFileSync(stylesPath,next);
        const manifest=readJson(ws.manifest);
        const entry=manifest.files.find(file=>file.target==="styles.css");
        entry.source_sha256=createHash("sha256").update(Buffer.from(next)).digest("hex");
        writeJson(ws.manifest,manifest);
        const result=check({manifest:ws.manifest,design:ws.design});
        expect(result.status,result.stderr).toBe(0);
      }finally{clean(ws.root);}
    });
    it("scopes an unscoped selector and never prefixes an at-rule prelude",()=>{
      const ws=workspace();
      const out=outputDir();
      try{
        const stylesPath=join(ws.design,"styles.css");
        const next=readFileSync(stylesPath,"utf8")+"\n.loose-rule {\n  color: #002fa7;\n}\n@media (prefers-reduced-motion: reduce) {\n  .loose-rule {\n    transition: none;\n  }\n}\n";
        writeFileSync(stylesPath,next);
        const manifest=readJson(ws.manifest);
        const entry=manifest.files.find(file=>file.target==="styles.css");
        entry.source_sha256=createHash("sha256").update(Buffer.from(next)).digest("hex");
        manifest.used_classes.push("loose-rule");
        writeJson(ws.manifest,manifest);
        const generated=generate(out,{manifest:ws.manifest,design:ws.design});
        expect(generated.status,generated.stderr).toBe(0);
        const css=readFileSync(join(out,"styles.css"),"utf8");
        expect(css).toContain(".sample-page .loose-rule");
        expect(css).toContain("@media (prefers-reduced-motion: reduce)");
        expect(css).not.toContain(".sample-page @media");
        expect(JSON.parse(generated.stdout).style_scope_applied).toBe(true);
      }finally{clean(out);clean(ws.root);}
    });
    it("records the client adapter mapping and generates it without runtime injection",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const manifest=readJson(MANIFEST);
        expect(manifest.client_adapter).toMatchObject({
          gateway_class:"LegacySampleGateway",
          methods:{read:"readRecord",write:"writeRecord"},
          endpoints:{read:"GET /records/:recordId",write:"POST /records"},
          handler:"#next-sample",
          runtime_injection:false,
        });
        const text=readFileSync(join(out,"app.js"),"utf8");
        for(const token of ["class LegacySampleGateway","async readRecord({ recordId }","async writeRecord({ recordId, value, requestId }","/records/","#next-sample"])expect(text,`generated app.js must carry ${token}`).toContain(token);
        expect(text).toBe(readFileSync(join(DESIGN,"app.js"),"utf8"));
      }finally{clean(out);}
    });
  });

  describe("ORACLE-PORT-MANIFEST rejects controlled breakage",()=>{
    it("rejects an unused style rule injected into the output",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const copy=copyDirInto("p2-port-unused-",out);
        try{
        writeFileSync(join(copy.to,"styles.css"),readFileSync(join(copy.to,"styles.css"),"utf8")+"\n.sample-page .unused-sample-rule {\n  color: red;\n}\n");
        const result=check({output:copy.to});
        expect(failed(result,"UNUSED_STYLE"),result.stderr).toBe(true);
        }finally{clean(copy.root);}
      }finally{clean(out);}
    });
    it("rejects a used class whose style rule was removed",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const copy=copyDirInto("p2-port-missing-",out);
        try{
          const text=readFileSync(join(copy.to,"styles.css"),"utf8");
          writeFileSync(join(copy.to,"styles.css"),text.replace(/\.sample-page \.receipt-line \{[^}]*\}\n?/,""));
          const result=check({output:copy.to});
          expect(failed(result,"MISSING_USED_STYLE"),result.stderr).toBe(true);
        }finally{clean(copy.root);}
      }finally{clean(out);}
    });
    it("rejects an unregistered change in the output",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const copy=copyDirInto("p2-port-unregistered-",out);
        try{
          writeFileSync(join(copy.to,"app.js"),readFileSync(join(copy.to,"app.js"),"utf8")+"\n// 未登记改动\n");
          const result=check({output:copy.to});
          expect(failed(result,"UNREGISTERED_CHANGE"),result.stderr).toBe(true);
        }finally{clean(copy.root);}
      }finally{clean(out);}
    });
    it("rejects a selector moved outside the page root",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const copy=copyDirInto("p2-port-scope-",out);
        try{
          const text=readFileSync(join(copy.to,"styles.css"),"utf8");
          writeFileSync(join(copy.to,"styles.css"),text.replace(".sample-page .state-sequence__list",".state-sequence__list"));
          const result=check({output:copy.to});
          expect(failed(result,"SCOPE_VIOLATION"),result.stderr).toBe(true);
        }finally{clean(copy.root);}
      }finally{clean(out);}
    });
    it("rejects a selector raised beyond the host specificity budget",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const copy=copyDirInto("p2-port-specificity-",out);
        try{
          const text=readFileSync(join(copy.to,"styles.css"),"utf8");
          writeFileSync(join(copy.to,"styles.css"),text.replace(".sample-page .result-panel__title",".sample-page #result-title"));
          const result=check({output:copy.to});
          expect(failed(result,"SPECIFICITY_EXCEEDED"),result.stderr).toBe(true);
        }finally{clean(copy.root);}
      }finally{clean(out);}
    });
    it("rejects a manifest that empties the host shell ownership",()=>{
      const ws=workspace();
      try{
        const manifest=readJson(ws.manifest);
        manifest.target.chrome.host_shell_selectors=[];
        writeJson(ws.manifest,manifest);
        const result=check({manifest:ws.manifest,design:ws.design});
        expect(failed(result,"CHROME_OWNERSHIP_MISSING"),result.stderr).toBe(true);
      }finally{clean(ws.root);}
    });
    it("rejects a host shell registered as ported content",()=>{
      const ws=workspace();
      try{
        const manifest=readJson(ws.manifest);
        manifest.target.chrome.content_selectors.push(".host-frame");
        writeJson(ws.manifest,manifest);
        const result=check({manifest:ws.manifest,design:ws.design});
        expect(failed(result,"CHROME_OWNERSHIP_CONFLICT"),result.stderr).toBe(true);
      }finally{clean(ws.root);}
    });
    it("rejects a changed design source against the recorded hash",()=>{
      const ws=workspace();
      try{
        writeFileSync(join(ws.design,"styles.css"),readFileSync(join(ws.design,"styles.css"),"utf8")+"\n/* 来源漂移 */\n");
        const result=check({manifest:ws.manifest,design:ws.design});
        expect(failed(result,"SOURCE_DRIFT"),result.stderr).toBe(true);
      }finally{clean(ws.root);}
    });
    it("rejects a fabricated specificity number with no readable basis",()=>{
      const ws=workspace();
      try{
        const manifest=readJson(ws.manifest);
        manifest.specificity_basis.host_rules[0].specificity=[0,9,9];
        writeJson(ws.manifest,manifest);
        const result=check({manifest:ws.manifest,design:ws.design});
        expect(failed(result,"SPECIFICITY_BASIS_MISMATCH"),result.stderr).toBe(true);
      }finally{clean(ws.root);}
    });
    it("rejects a manual file whose sentinel is missing, in both check and generate",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const manual=join(out,"manual-overrides.css");
        writeFileSync(manual,"/* 丢失哨兵 */\n.sample-page .hand-edit { color: red; }\n");
        const checked=check({output:out});
        expect(failed(checked,"MANUAL_SENTINEL_MISSING"),checked.stderr).toBe(true);
        const regenerated=generate(out);
        expect(regenerated.status,regenerated.stderr).not.toBe(0);
        expect(regenerated.stderr).toContain("MANUAL_SENTINEL_MISSING");
      }finally{clean(out);}
    });
    it("scopes loose selectors but leaves @keyframes frame selectors unscoped",()=>{
      const ws=workspace();
      const out=outputDir();
      try{
        const stylesPath=join(ws.design,"styles.css");
        const next=readFileSync(stylesPath,"utf8")+"\n.loose-keyframe-rule {\n  animation: sample-pulse 1s;\n}\n@keyframes sample-pulse {\n  from { opacity: 0; }\n  50% { opacity: 0.5; }\n  to { opacity: 1; }\n}\n";
        writeFileSync(stylesPath,next);
        const manifest=readJson(ws.manifest);
        const entry=manifest.files.find(file=>file.target==="styles.css");
        entry.source_sha256=createHash("sha256").update(Buffer.from(next)).digest("hex");
        manifest.used_classes.push("loose-keyframe-rule");
        writeJson(ws.manifest,manifest);
        const generated=generate(out,{manifest:ws.manifest,design:ws.design});
        expect(generated.status,generated.stderr).toBe(0);
        const css=readFileSync(join(out,"styles.css"),"utf8");
        expect(css).toContain(".sample-page .loose-keyframe-rule");
        expect(css).toContain("@keyframes sample-pulse");
        expect(css).not.toMatch(/\.sample-page\s+from\s*\{/);
        expect(css).not.toMatch(/\.sample-page\s+to\s*\{/);
        expect(css).not.toMatch(/\.sample-page\s+50%\s*\{/);
        const checked=check({manifest:ws.manifest,design:ws.design,output:out});
        expect(checked.status,checked.stderr).toBe(0);
        const rerun=generate(out,{manifest:ws.manifest,design:ws.design});
        expect(rerun.status,rerun.stderr).toBe(0);
        expect(sha(join(out,"styles.css"))).toBe(createHash("sha256").update(Buffer.from(css)).digest("hex"));
      }finally{clean(out);clean(ws.root);}
    });
    it("rejects an output directory symlinked into the design source subtree",()=>{
      const ws=workspace();
      try{
        const inside=join(ws.design,"ported-inside-source");
        mkdirSync(inside,{recursive:true});
        const before=readdirSync(inside).sort();
        const link=join(ws.root,"out-link");
        symlinkSync(inside,link);
        const result=generate(link,{manifest:ws.manifest,design:ws.design});
        expect(result.status,result.stderr).not.toBe(0);
        expect(result.stderr).toContain("OUTPUT_INSIDE_SOURCE");
        expect(readdirSync(inside).sort()).toEqual(before);
      }finally{clean(ws.root);}
    });
    it("rejects a generated target that is also the registered manual file, before overwriting it",()=>{
      const out=outputDir();
      const ws=workspace();
      try{
        const manifest=readJson(ws.manifest);
        manifest.files.find(file=>file.mode==="generated").target="manual-overrides.css";
        writeJson(ws.manifest,manifest);
        const handEdit=readFileSync(join(ws.base,"port","manual-overrides.css"),"utf8")+"\n.sample-page .hand-edit { color: #123456; }\n";
        writeFileSync(join(out,"manual-overrides.css"),handEdit);
        const result=generate(out,{manifest:ws.manifest,design:ws.design});
        expect(result.status,result.stderr).not.toBe(0);
        expect(result.stderr).toContain("MANUAL_TARGET_OVERLAP");
        expect(readFileSync(join(out,"manual-overrides.css"),"utf8")).toBe(handEdit);
      }finally{clean(out);clean(ws.root);}
    });
    it("rejects an output that resolves to the design source itself",()=>{
      const ws=workspace();
      try{
        const before=readdirSync(ws.design).sort();
        const result=generate(ws.design,{manifest:ws.manifest,design:ws.design});
        expect(result.status,result.stderr).not.toBe(0);
        expect(result.stderr,result.stderr).toContain("OUTPUT_INSIDE_SOURCE");
        expect(readdirSync(ws.design).sort()).toEqual(before);
      }finally{clean(ws.root);}
    });
  });

  describe("ORACLE-PORT-MANIFEST manual overrides survive a rerun",()=>{
    it("preserves the sentinel and human edits when generating twice into the same output",()=>{
      const out=outputDir();
      try{
        expect(generate(out).status).toBe(0);
        const manual=join(out,"manual-overrides.css");
        const firstStyles=sha(join(out,"styles.css"));
        writeFileSync(manual,readFileSync(manual,"utf8")+"\n.sample-page .action-row {\n  gap: 12px;\n}\n");
        const rerun=generate(out);
        expect(rerun.status,rerun.stderr).toBe(0);
        const summary=JSON.parse(rerun.stdout);
        expect(summary.manual.status).toBe("preserved");
        const text=readFileSync(manual,"utf8");
        expect(text.startsWith("/* KEEP:manual-overrides */")).toBe(true);
        expect(text).toContain(".sample-page .action-row {");
        expect(sha(join(out,"styles.css"))).toBe(firstStyles);
      }finally{clean(out);}
    });
  });

  describe("ORACLE-PORT-MANIFEST browser scenario entry",()=>{
    it("carries its own service, evidence publishing and fixed viewport",()=>{
      const source=readFileSync(SELF_PATH,"utf8");
      expect(source).toContain("--browser-scenario");
      expect(source).toContain("P2_PORT_OUTPUT_REF");
      expect(source).toContain("8767");
      expect(source).toContain("1440");
      expect(source).toContain("BROWSER_QA_TASK_ID");
    });
  });
}

// ---------------------------------------------------------------------------
// Browser scenario: invoked only as
//   node tests/contract/design-port-port-manifest.test.mjs --browser-scenario
// under the isolated-browser-qa gateway. It serves the published port output,
// drives the gateway-owned Ego page, publishes screenshot + JSON originals
// through openTask.appendRecord, and stops only its own service and temp files.
// ---------------------------------------------------------------------------

async function runBrowserScenario(){
  const exit=(code,payload)=>{process.stdout.write(JSON.stringify(payload)+"\n");process.exitCode=code;};
  const refPath=process.env.P2_PORT_OUTPUT_REF;
  if(!refPath||!existsSync(refPath))return exit(2,{ok:false,code:"P2_PORT_OUTPUT_REF_UNAVAILABLE",ref:refPath??null});
  let record;
  try{record=JSON.parse(readFileSync(refPath,"utf8"));}
  catch(error){return exit(2,{ok:false,code:"P2_PORT_OUTPUT_REF_UNREADABLE",detail:String(error.message)});}
  const outputRoot=record&&record.output_root;
  if(typeof outputRoot!=="string"||!outputRoot.startsWith("/")||!existsSync(outputRoot))return exit(2,{ok:false,code:"P2_OUTPUT_ROOT_UNAVAILABLE",output_root:outputRoot??null});
  const evidenceDir=process.env.BROWSER_QA_EVIDENCE_DIR||mkdtempSync(join(tmpdir(),"p2-browser-evidence-"));
  const url=process.env.BROWSER_QA_TARGET_URL||"http://127.0.0.1:8767/index.html";
  const screenshotPath=join(evidenceDir,"p2-browser-1440x1000.png");
  const resultPath=join(evidenceDir,"p2-browser-observation.json");
  const {createServer}=await import("node:http");
  const {spawn}=await import("node:child_process");
  const server=createServer((request,response)=>{
    const pathname=decodeURIComponent(new URL(request.url,"http://127.0.0.1").pathname);
    const file=join(outputRoot,pathname==="/"?"index.html":pathname.replace(/^\/+/,""));
    if(!file.startsWith(resolve(outputRoot)+"/")||!existsSync(file)||statSync(file).isDirectory()){
      response.writeHead(404,{"content-type":"text/plain"});response.end("not found");return;
    }
    const type=file.endsWith(".css")?"text/css":file.endsWith(".js")?"text/javascript":file.endsWith(".html")?"text/html":"application/octet-stream";
    response.writeHead(200,{"content-type":type,"cache-control":"no-store"});response.end(readFileSync(file));
  });
  let portError=null;
  try{await new Promise((resolveListen,rejectListen)=>{server.once("error",rejectListen);server.listen(8767,"127.0.0.1",()=>{server.off("error",rejectListen);resolveListen();});});}
  catch(error){portError=error;}
  if(portError)return exit(2,{ok:false,code:"PORT_UNAVAILABLE",detail:String(portError.message)});
  const helper=process.env.BROWSER_QA_EGO_HELPER_PATH||"ego-browser";
  const taskSpaceName=process.env.BROWSER_QA_EGO_TASKSPACE_NAME;
  if(!taskSpaceName)return exit(2,{ok:false,code:"EGO_TASKSPACE_NAME_UNAVAILABLE",detail:"the gateway did not inject an owned TaskSpace name"});
  const worker=buildEgoWorker({url,resultPath,screenshotPath,sessionModule:SESSION_MODULE,taskSpaceName});
  const run=await runWorker(helper,worker);
  const published=[];
  let facts=null,workerFailure=null;
  try{
    if(!existsSync(resultPath))workerFailure={code:"BROWSER_WORKER_NO_ORIGINAL",exit:run.status,stderr:String(run.stderr||"").slice(0,2000)};
    else facts=JSON.parse(readFileSync(resultPath,"utf8"));
    if(facts&&facts.ok!==true)workerFailure={code:facts.code||"BROWSER_WORKER_FAILED",detail:facts.message||""};
    if(facts&&facts.ok===true){
      const envelope=facts;
      facts={...envelope.facts,engine:envelope.engine,space:envelope.space,url:envelope.url,object_ok:true};
    }
    const checks=facts?evaluateScenarioFacts(facts):[];
    if(Array.isArray(facts?.console)&&facts.console.status==="observed"&&facts.console.errors.length===0)checks.push({id:"console",passed:true});
    const payload={schema_version:"1.0.0",ok:checks.length>0&&checks.every(item=>item.passed),object:{output_root:outputRoot,url,viewport:"1440x1000@1",engine:"ego-lite",service_pid:process.pid},checks,facts,worker:{exit:run.status,signal:run.signal,stderr:String(run.stderr||"").slice(0,2000)},failure:workerFailure,published:[]};
    writeFileSync(resultPath,JSON.stringify(payload,null,2)+"\n");
    const {openTask}=await import(new URL('../../runtime/task/task-handle.mjs',import.meta.url).href);
    const taskRoot=process.env.TASK_RECORD_ROOT;
    const taskId=process.env.BROWSER_QA_TASK_ID;
    if(taskRoot&&taskId&&existsSync(taskRoot)){
      const handle=openTask(taskRoot,{projectName:"workflowhub",taskId});
      if(existsSync(screenshotPath))published.push(await handle.appendRecord({dir:"quality/evidence/build-code/P2",slug:"p2-port-browser-1440x1000",ext:"png",bytes:readFileSync(screenshotPath)}));
      payload.published=published;
      writeFileSync(resultPath,JSON.stringify(payload,null,2)+"\n");
      published.push(await handle.appendRecord({dir:"quality/evidence/build-code/P2",slug:"p2-port-browser-observation",ext:"json",bytes:readFileSync(resultPath)}));
    }
    return exit(payload.ok?0:6,{ok:payload.ok,checks,failure:workerFailure,published,result_ref:resultPath,screenshot_ref:existsSync(screenshotPath)?screenshotPath:null});
  }catch(error){
    return exit(6,{ok:false,code:"BROWSER_SCENARIO_FAILED",detail:String(error.message),worker:{exit:run.status,stderr:String(run.stderr||"").slice(0,2000)}});
  }finally{
    await new Promise(resolveClose=>server.close(()=>resolveClose()));
    for(const file of [screenshotPath,resultPath]){try{rmSync(file,{force:true});}catch{/* preserve first error */}}
  }
}

async function runWorker(helper,source){
  const {spawn}=await import("node:child_process");
  return new Promise(resolve=>{
    const child=spawn(helper,["nodejs","-e",source],{env:{...process.env},stdio:["ignore","pipe","pipe"]});
    let stdout="",stderr="";
    const timer=setTimeout(()=>{try{child.kill("SIGTERM");}catch{/* preserve the original timeout */}},300000);
    child.stdout.on("data",chunk=>{stdout+=chunk;});
    child.stderr.on("data",chunk=>{stderr+=chunk;});
    child.on("error",error=>{clearTimeout(timer);resolve({status:null,signal:null,stdout,stderr:String(error.message)});});
    child.on("close",(code,signal)=>{clearTimeout(timer);resolve({status:code,signal,stdout,stderr});});
  });
}

function evaluateScenarioFacts(facts){
  const checks=[];
  const viewport=facts.viewport;
  checks.push({id:"viewport",passed:Boolean(viewport)&&viewport.width===1440&&viewport.height===1000&&viewport.dpr===1,observed:viewport??null});
  const scroll=facts.scroll;
  checks.push({id:"no-horizontal-overflow",passed:Boolean(scroll)&&scroll.scrollWidth<=scroll.clientWidth,observed:scroll??null});
  const initial=facts.initial||{};
  const expectedClasses=["sample-page","sample-notice","state-sequence","result-panel","read-next-button"];
  checks.push({id:"components",passed:expectedClasses.every(name=>(initial.classes||[]).includes(name)),observed:{classes:initial.classes??[]}});
  checks.push({id:"legacy-hook",passed:initial.resultHook==="sample-result",observed:initial.resultHook??null});
  checks.push({id:"sample-annotations",passed:Number(initial.sampleTags)>=2,observed:{sample_tags:initial.sampleTags??null}});
  const states=Array.isArray(facts.states)?facts.states:[];
  const expectedStates=["空","错误","成功"];
  checks.push({id:"states-reachable",passed:states.length===3&&states.every((state,index)=>state.stateLabel===expectedStates[index]),observed:states.map(state=>({label:state.stateLabel,number:state.stateNumber,status:state.status}))});
  checks.push({id:"state-sequence-sync",passed:states.length===3&&states.every((state,index)=>(state.currentSequence||[]).length===1&&state.currentSequence[0]===["empty","error","success"][index]),observed:states.map(state=>state.currentSequence)});
  const keyboard=facts.keyboard;
  const active=keyboard&&keyboard.active;
  checks.push({id:"keyboard-reachable",passed:Boolean(keyboard)&&keyboard.status==="observed"&&Boolean(active)&&active.selected===true&&active.outlineStyle!=="none",observed:{status:keyboard?keyboard.status:null,reason:keyboard?keyboard.reason:null,active:active??null,steps:keyboard?keyboard.steps:[]}});
  checks.push({id:"accessible-name",passed:typeof initial.buttonLabel==="string"&&initial.buttonLabel.trim().length>0,observed:initial.buttonLabel??null});
  return checks;
}

function buildEgoWorker({url,resultPath,screenshotPath,sessionModule,taskSpaceName}){
  const input=JSON.stringify({url,resultPath,screenshotPath,sessionModule,taskSpaceName});
  return `process.env.BROWSER_QA_EGO_TASKSPACE_NAME=${JSON.stringify(taskSpaceName)};
const input = ${input};
const fs = await import("node:fs");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const task = await taskSpace(input.taskSpaceName);
  const page = task.page(process.env.BROWSER_QA_EGO_PAGE_LABEL || "p1");
  const result = { ok: true, engine: "ego-lite", url: input.url, space: task.name, facts: {} };
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  let consoleState = { status: "unavailable", reason: "console events not armed", errors: [] };
  try {
    await page.cdp("egoAutomated.disable");
    await page.cdp("Page.enable");
    await page.cdp("Runtime.enable");
    await page.events();
    consoleState = { status: "observed", reason: "", errors: [] };
  } catch (error) {
    consoleState = { status: "unavailable", reason: String(error && error.message || error), errors: [] };
  }
  const readPage = () => page.evaluate(() => {
    const classes = new Set();
    for (const node of document.querySelectorAll("[class]")) {
      for (const name of String(node.getAttribute("class") || "").trim().split(" ")) if (name) classes.add(name);
    }
    const text = (selector) => { const node = document.querySelector(selector); return node ? node.textContent.trim() : null; };
    const active = document.activeElement;
    return {
      classes: [...classes].sort(),
      title: document.title,
      ready: document.documentElement.dataset.sampleReady || null,
      htmlLang: document.documentElement.lang || null,
      sampleTags: document.querySelectorAll("[data-sample-tag]").length,
      stateNumber: text("#state-number"),
      stateLabel: text("#state-label"),
      status: text("#status-message"),
      resultHook: document.querySelector("#result-panel") ? document.querySelector("#result-panel").getAttribute("data-legacy-hook") : null,
      resultState: document.querySelector("#result-panel") ? document.querySelector("#result-panel").getAttribute("data-state") : null,
      resultText: text("#result-content"),
      buttonLabel: text("#next-sample"),
      buttonDisabled: document.querySelector("#next-sample") ? document.querySelector("#next-sample").getAttribute("aria-disabled") : null,
      currentSequence: [...document.querySelectorAll("[data-state]")].filter((node) => node.getAttribute("aria-current") === "step").map((node) => node.getAttribute("data-state")),
      viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
      scroll: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
      bodyScroll: { scrollWidth: document.body.scrollWidth, clientWidth: document.body.clientWidth },
      activeElement: active ? { id: active.id || null, tag: active.tagName || null, outlineStyle: getComputedStyle(active).outlineStyle, selected: active.id === "next-sample" } : null,
    };
  }, {});
  await page.goto(input.url);
  await page.waitForSelector("#next-sample");
  const first = await readPage();
  result.facts.viewport = first.viewport;
  result.facts.scroll = first.scroll;
  result.facts.initial = first;
  let keyboardState = { status: "unavailable", reason: "keyboard dispatch not attempted", steps: [], active: null };
  try {
    await page.evaluate(() => { if (document.body) document.body.focus(); }, {});
    for (let index = 0; index < 4; index += 1) {
      await page.cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      await page.cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      await wait(60);
      const focused = await readPage();
      keyboardState.steps.push({ step: index + 1, active: focused.activeElement });
      if (focused.activeElement && focused.activeElement.id === "next-sample") break;
    }
    keyboardState.status = "observed";
    keyboardState.reason = "";
    keyboardState.active = keyboardState.steps[keyboardState.steps.length - 1] ? keyboardState.steps[keyboardState.steps.length - 1].active : null;
  } catch (error) {
    keyboardState = { status: "unavailable", reason: String(error && error.message || error), steps: keyboardState.steps, active: null };
  }
  result.facts.keyboard = keyboardState;
  result.facts.activeElement = keyboardState.active;
  const states = [];
  for (let index = 0; index < 3; index += 1) {
    await page.evaluate(() => { const button = document.querySelector("#next-sample"); if (button) button.click(); }, {});
    await wait(320);
    states.push(await readPage());
  }
  result.facts.states = states;
  if (consoleState.status === "observed") {
    const events = await page.events();
    for (const event of events) {
      if (event.method === "Runtime.exceptionThrown") consoleState.errors.push({ kind: "exception", detail: event.params && event.params.exceptionDetails ? event.params.exceptionDetails.text : "" });
      if (event.method === "Runtime.consoleAPICalled" && event.params && event.params.type === "error") consoleState.errors.push({ kind: "console", detail: "console.error" });
    }
  }
  result.facts.console = consoleState;
  await page.screenshot({ path: input.screenshotPath });
  result.facts.screenshot = input.screenshotPath;
  fs.writeFileSync(input.resultPath, JSON.stringify(result));
} catch (error) {
  fs.writeFileSync(input.resultPath, JSON.stringify({ ok: false, engine: "ego-lite", url: input.url, code: error && error.code || null, message: String(error && error.message || error).slice(0, 2000) }));
}
`;
}
