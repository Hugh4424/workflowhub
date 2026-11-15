// ORACLE-PORT-VERIFICATION
// 本文件通过只证明当前四份配置、固定样本、受控探针事实与真实 8768 服务身份；不证明任意目标项目、
// 其它页面状态或真实外部服务。受控破坏只在测试自建临时副本进行，原配置/样本/服务字节不改，
// 首次失败原件保留。RED 只落四类校验、内容身份或三态目标断言；导入、收集、环境失败另记，不当 RED。
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=process.cwd();
const DIR=join(ROOT,"tests/fixtures/design-port-sample/verification");
const SCRIPTS={
  geometry:join(ROOT,"skills/design-source-extraction/scripts/check-geometry.mjs"),
  "dom-parity":join(ROOT,"skills/design-source-extraction/scripts/check-dom-parity.mjs"),
  "port-parity":join(ROOT,"skills/design-source-extraction/scripts/check-port-parity.mjs"),
  "feature-keep":join(ROOT,"skills/design-source-extraction/scripts/check-feature-keep.mjs"),
};
const CONFIGS={
  geometry:join(DIR,"geometry.json"),
  "dom-parity":join(DIR,"dom-parity.json"),
  "port-parity":join(DIR,"port-parity.json"),
  "feature-keep":join(DIR,"feature-keep.json"),
};
const SERVICE=join(ROOT,"skills/design-source-extraction/scripts/check-data-discipline.mjs");
const PORT_SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-port-manifest.mjs");
const MANIFEST=join(ROOT,"tests/fixtures/design-port-sample/port/manifest.json");
const PROTOTYPE=join(ROOT,"tests/fixtures/design-port-sample/prototype");
const DATA_FIXTURE=join(ROOT,"tests/fixtures/design-port-sample/data");
const REAL_MODE=join(DATA_FIXTURE,"real-mode.json");
const SOURCE_FILES={
  "index.html":join(PROTOTYPE,"index.html"),
  "styles.css":join(PROTOTYPE,"styles.css"),
  "app.js":join(PROTOTYPE,"app.js"),
};

function runCheck(script,args){return spawnSync(process.execPath,[script,...args],{cwd:ROOT,encoding:"utf8",timeout:120000});}
function sha(file){return createHash("sha256").update(readFileSync(file)).digest("hex");}
function shaText(text){return createHash("sha256").update(text).digest("hex");}
function readJson(file){return JSON.parse(readFileSync(file,"utf8"));}
function clean(dir){try{rmSync(dir,{recursive:true,force:true});}catch{/* keep first failure */}}
function codeOf(result){try{return JSON.parse(result.stderr).error.code;}catch{return null;}}
function outJson(result){try{return JSON.parse(result.stdout);}catch{return null;}}
// Copy the whole verification fixture to a temp dir, mutate one config, and return its path.
function mutateConfig(name,mutate){
  const dir=mkdtempSync(join(tmpdir(),`p4-verify-break-${name}-`));
  cpSync(DIR,dir,{recursive:true});
  const file=join(dir,`${name}.json`);
  const doc=readJson(file);
  mutate(doc);
  writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
  return {dir,file};
}
// Rewrite content_binding files with repo-root-relative or absolute paths to stable real files.
function withBinding(doc,paths){
  doc.content_binding={files:paths.map(p=>({path:p,sha256:sha(resolve(ROOT,p))}))};
}

// Standalone probe: recompute the backend identity digest from the real service response, the
// process receipt and the real-mode config (never a self-declared report string).
function identityDigest({identity,receipt,realModeSha}){
  const stable={url:identity.url,pid:identity.pid,port:identity.port,output_root:identity.output_root,fixture_ref:identity.fixture_ref,mode:identity.mode,record_ids:identity.record_ids,receipt_pid:receipt&&receipt.pid,real_mode_sha:realModeSha};
  return shaText(JSON.stringify(stable));
}

if(process.argv.includes("--identity-probe")){ await identityProbe(); }
else { const vitest=await import('vitest'); defineTests(vitest); }

function defineTests({describe,it,expect}){
  describe("ORACLE-PORT-VERIFICATION accepts the four verification configs",()=>{
    it("each checker exists and accepts its committed config with a content-bound report",()=>{
      for(const name of Object.keys(SCRIPTS)){
        expect(existsSync(SCRIPTS[name]),`${name} script must exist`).toBe(true);
        const r=runCheck(SCRIPTS[name],["--config",CONFIGS[name]]);
        expect(r.status,`${name}: ${r.stdout}${r.stderr}`).toBe(0);
        const report=outJson(r);
        expect(report.ok,`${name} ok`).toBe(true);
        expect(report.kind,name).toBe(name);
        expect(report.content&&report.content.config_sha256,`${name} config digest`).toMatch(/^[0-9a-f]{64}$/);
        expect(Array.isArray(report.content.inputs)&&report.content.inputs.length>=1,`${name} input digests`).toBe(true);
        expect(typeof report.head==="string"||report.head===null,name).toBe(true);
      }
    });
  });

  describe("ORACLE-PORT-VERIFICATION reports the specified category geometry with 0.5px tolerance",()=>{
    it("accepts a diff exactly at 0.5px and rejects 0.5001px",()=>{
      const {dir,file}=mutateConfig("geometry",doc=>{doc.probes[0].design=100;doc.probes[0].implementation=100.5;withBinding(doc,["tests/fixtures/design-port-sample/prototype/styles.css"]);});
      try{
        const ok=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(ok.status,ok.stderr).toBe(0);
        const doc=readJson(file);doc.probes[0].implementation=100.5001;writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
        const over=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(over.status,over.stdout+over.stderr).not.toBe(0);
        expect(codeOf(over)).toBe("GEOMETRY_TOLERANCE_EXCEEDED");
      }finally{clean(dir);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION refuses a controlled break in every category",()=>{
    const cases=[
      ["geometry",doc=>{doc.probes[1].implementation=doc.probes[1].design+3;},"GEOMETRY_TOLERANCE_EXCEEDED"],
      ["geometry",doc=>{doc.probes[4].implementation="rgb(0, 0, 0)";},"GEOMETRY_VALUE_MISMATCH"],
      ["dom-parity",doc=>{doc.implementation[2].tag="h2";},"DOM_TAG_MISMATCH"],
      ["dom-parity",doc=>{doc.implementation[2].direct_text="被改过的标题";},"DOM_TEXT_MISMATCH"],
      ["dom-parity",doc=>{doc.implementation[3].direct_text=null;},"DOM_TEXT_MISMATCH"],
      ["dom-parity",doc=>{doc.implementation[5].depth=5;},"DOM_DEPTH_MISMATCH"],
      ["dom-parity",doc=>{doc.implementation[6].classes=["result-panel__title","rogue"];},"DOM_CLASS_MISMATCH"],
      ["port-parity",doc=>{doc.outputs.push({target:"extra-generated.css",registered:false});},"UNREGISTERED_FILE"],
      ["port-parity",doc=>{doc.sources[2].target="missing-app.js";},"SOURCE_UNCOVERED"],
      ["port-parity",doc=>{doc.used_classes.push("never-compiled-class");},"UNCOMPILED_CLASS"],
      ["feature-keep",doc=>{doc.features[0].observed.present=false;},"FEATURE_SELECTOR_MISSING"],
      ["feature-keep",doc=>{doc.features[3].observed.text="读取结果（改）";},"FEATURE_TEXT_CHANGED"],
      ["feature-keep",doc=>{doc.features[0].observed.role="link";},"FEATURE_ROLE_CHANGED"],
      ["feature-keep",doc=>{doc.features[1].observed.value="other-hook";},"FEATURE_HOOK_MISSING"],
    ];
    for(const [name,mutate,code] of cases){
      it(`rejects ${name} break -> ${code}`,()=>{
        const {dir,file}=mutateConfig(name,doc=>{mutate(doc);withBinding(doc,["tests/fixtures/design-port-sample/prototype/index.html"]);});
        try{
          const r=runCheck(SCRIPTS[name],["--config",file]);
          expect(r.status,r.stdout+r.stderr).not.toBe(0);
          expect(codeOf(r),r.stderr).toBe(code);
        }finally{clean(dir);}
      });
    }
    it("rejects a probe missing implementation as a shape error, not a silent pass (F4)",()=>{
      const {dir,file}=mutateConfig("geometry",doc=>{delete doc.probes[0].implementation;withBinding(doc,["tests/fixtures/design-port-sample/prototype/styles.css"]);});
      try{
        const r=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(r.status,r.stdout+r.stderr).toBe(2);
        expect(codeOf(r),r.stderr).toBe("GEOMETRY_SHAPE_INVALID");
      }finally{clean(dir);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION binds current content, not only the commit id",()=>{
    it("independently recomputes config and input digests with crypto and matches the report",()=>{
      for(const name of Object.keys(SCRIPTS)){
        const r=runCheck(SCRIPTS[name],["--config",CONFIGS[name]]);
        expect(r.status,r.stderr).toBe(0);
        const report=outJson(r);
        expect(report.content.config_sha256,`${name} config sha`).toBe(sha(CONFIGS[name]));
        for(const entry of report.content.inputs){
          expect(entry.sha256,`${name} input ${entry.path}`).toBe(sha(resolve(ROOT,entry.path)));
        }
      }
    });
    it("a post-commit change to a compared file with an unchanged HEAD fails on content mismatch",()=>{
      const {dir,file}=mutateConfig("geometry",()=>{});
      try{
        const copyDir=mkdtempSync(join(tmpdir(),"p4-verify-dirty-"));
        const target=join(copyDir,"styles.css");
        writeFileSync(target,readFileSync(SOURCE_FILES["styles.css"]));
        const doc=readJson(file);
        doc.content_binding={files:[{path:target,sha256:sha(target)}]};
        writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
        const first=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(first.status,first.stderr).toBe(0);
        writeFileSync(target,readFileSync(target,"utf8")+"\n/* dirty change after registration */\n");
        const changed=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(changed.status,changed.stdout+changed.stderr).not.toBe(0);
        expect(codeOf(changed)).toBe("CONTENT_MISMATCH");
        clean(copyDir);
      }finally{clean(dir);}
    });
    it("binds the implementation output bytes: changing the generated impl fails CONTENT_MISMATCH (F2/SP-F3)",()=>{
      const base=mkdtempSync(join(tmpdir(),"p4-verify-impl-"));
      const out=join(base,"port-output");
      const gen=spawnSync(process.execPath,[PORT_SCRIPT,"--mode=generate","--manifest",MANIFEST,"--design-root",PROTOTYPE,"--output",out],{cwd:ROOT,encoding:"utf8",timeout:180000});
      expect(gen.status,gen.stderr).toBe(0);
      const implFile=join(out,"index.html");
      const cfgDir=mkdtempSync(join(tmpdir(),"p4-verify-implcfg-"));
      const file=join(cfgDir,"geometry.json");
      const doc=readJson(CONFIGS.geometry);
      doc.content_binding={files:[{path:implFile,sha256:sha(implFile)}]};
      writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
      try{
        const ok=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(ok.status,ok.stderr).toBe(0);
        writeFileSync(implFile,readFileSync(implFile,"utf8")+"\n<!-- implementation changed after registration -->\n");
        const changed=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(changed.status,changed.stdout+changed.stderr).not.toBe(0);
        expect(codeOf(changed)).toBe("CONTENT_MISMATCH");
      }finally{clean(cfgDir);clean(base);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION keeps three states distinct (unverified / unavailable / target_failure)",()=>{
    it("missing config is unverified (exit 2), an unavailable object is unavailable (exit 2), a real mismatch is a target failure (exit 1)",()=>{
      const missing=runCheck(SCRIPTS.geometry,["--config",join(DIR,"does-not-exist.json")]);
      expect(missing.status).toBe(2);
      expect(codeOf(missing)).toBe("GEOMETRY_CONFIG_UNAVAILABLE");
      const {dir,file}=mutateConfig("port-parity",doc=>{doc.content_binding={files:[{path:"/nonexistent/p4/object.css",sha256:"0".repeat(64)}]};});
      try{
        const unavailable=runCheck(SCRIPTS["port-parity"],["--config",file]);
        expect(unavailable.status).toBe(2);
        expect(codeOf(unavailable)).toBe("PORT_PARITY_OBJECT_UNAVAILABLE");
      }finally{clean(dir);}
      const {dir:bd,file:bf}=mutateConfig("feature-keep",doc=>{doc.features[0].observed.text="变了";withBinding(doc,["tests/fixtures/design-port-sample/prototype/index.html"]);});
      try{
        const target=runCheck(SCRIPTS["feature-keep"],["--config",bf]);
        expect(target.status).toBe(1);
        expect(codeOf(target)).toBe("FEATURE_TEXT_CHANGED");
      }finally{clean(bd);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION is input-driven, not sample-hardcoded",()=>{
    it("accepts a different geometry config that declares its own probes",()=>{
      const dir=mkdtempSync(join(tmpdir(),"p4-verify-alt-"));
      const file=join(dir,"geometry.json");
      const doc={schema_version:"1.0.0",kind:"geometry-config",tolerance_px:0.5,probes:[
        {id:"alt-w",selector:".alt-row",property:"width",unit:"px",design:320,implementation:320.4},
      ],content_binding:{files:[]}};
      withBinding(doc,["tests/fixtures/design-port-sample/prototype/styles.css"]);
      writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
      try{
        const r=runCheck(SCRIPTS.geometry,["--config",file]);
        expect(r.status,r.stderr).toBe(0);
      }finally{clean(dir);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION real backend identity comes from the actual 8768 service (evidence-only provenance)",()=>{
    it("reads GET /identity, a process receipt and the real-mode config, and detects a swapped backend",async()=>{
      const base=mkdtempSync(join(tmpdir(),"p4-verify-serve-"));
      const out=join(base,"port-output");
      const storeFile=join(base,"store.json");
      const portRecord=join(base,"p2-port-output.json");
      const gen=spawnSync(process.execPath,[PORT_SCRIPT,"--mode=generate","--manifest",MANIFEST,"--design-root",PROTOTYPE,"--output",out],{cwd:ROOT,encoding:"utf8",timeout:180000});
      expect(gen.status,gen.stderr).toBe(0);
      writeFileSync(portRecord,JSON.stringify({output_root:out})+"\n");
      const port=8768;
      const realModeSha=sha(REAL_MODE);
      const {child,getStdout}=startService({port,store:storeFile,portRecord});
      try{
        const ready=await waitReady(`http://127.0.0.1:${port}`);
        expect(ready,`service must be ready on 8768; stderr=${child.exitCode}`).not.toBeNull();
        const identity=ready;
        const receipt=parseReceipt(getStdout());
        expect(receipt,`process receipt must be present: ${getStdout()}`).not.toBeNull();
        expect(identity.pid).toBe(receipt.pid);
        expect(identity.output_root).toBe(out);
        expect(receipt.output_root).toBe(out);
        expect(identity.mode).toBe("serve");
        const realMode=readJson(REAL_MODE);
        expect(realMode.source.identity_route).toBe("/identity");
        const good=identityDigest({identity,receipt,realModeSha});
        expect(good).toMatch(/^[0-9a-f]{64}$/);
        const swapped=identityDigest({identity:{...identity,pid:identity.pid+1},receipt,realModeSha});
        expect(swapped).not.toBe(good);
        const swappedConfig=identityDigest({identity,receipt,realModeSha:shaText(JSON.stringify(realMode)+" ")});
        expect(swappedConfig).not.toBe(good);
      }finally{
        await stopService(child);
        expect(child.exitCode!==null||child.signalCode!==null).toBe(true);
        clean(base);
      }
    },40000);
  });
}

function startService({port,store,portRecord}){
  const child=spawn(process.execPath,[SERVICE,"--mode=serve","--fixture",DATA_FIXTURE,"--listen=127.0.0.1","--port",String(port),"--port-output-record",portRecord,"--store",store],{cwd:ROOT,stdio:["ignore","pipe","pipe"]});
  let stdout="",stderr="";
  child.stdout.on("data",c=>{stdout+=c;});
  child.stderr.on("data",c=>{stderr+=c;});
  return {child,getStdout:()=>stdout,getStderr:()=>stderr};
}
async function stopService(child){
  if(!child||child.exitCode!==null)return;
  await new Promise(res=>{child.once("exit",()=>res());try{child.kill("SIGTERM");}catch{res();}setTimeout(()=>{try{child.kill("SIGKILL");}catch{/* gone */}res();},3000);});
}
function parseReceipt(stdout){
  for(const line of String(stdout||"").split("\n")){
    const trimmed=line.trim();
    if(!trimmed)continue;
    try{const value=JSON.parse(trimmed);if(value&&value.event==="data-service-ready")return value;}catch{/* skip non-json */}
  }
  return null;
}
async function httpGet(url,{timeoutMs=1000}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(Object.assign(new Error("ABORT"),{name:"AbortError"})),timeoutMs);
  try{const response=await fetch(url,{signal:controller.signal});const text=await response.text();let body=null;try{body=JSON.parse(text);}catch{body=text;}return {status:response.status,body};}
  finally{clearTimeout(timer);}
}
async function waitReady(baseUrl,{attempts=80,interval=100}={}){
  for(let i=0;i<attempts;i+=1){try{const {status,body}=await httpGet(baseUrl+"/identity");if(status===200&&body&&body.ok)return body;}catch{/* retry */}await new Promise(r=>setTimeout(r,interval));}
  return null;
}
async function identityProbe(){
  const outIndex=process.argv.indexOf("--out");
  const outPath=outIndex>-1?process.argv[outIndex+1]:null;
  const base=mkdtempSync(join(tmpdir(),"p4-identity-probe-"));
  const out=join(base,"port-output");
  const portRecord=join(base,"p2-port-output.json");
  const store=join(base,"store.json");
  spawnSync(process.execPath,[PORT_SCRIPT,"--mode=generate","--manifest",MANIFEST,"--design-root",PROTOTYPE,"--output",out],{cwd:ROOT,encoding:"utf8",timeout:180000});
  writeFileSync(portRecord,JSON.stringify({output_root:out})+"\n");
  const port=8768;
  const {child,getStdout}=startService({port,store,portRecord});
  let result;
  try{
    const identity=await waitReady(`http://127.0.0.1:${port}`);
    const receipt=parseReceipt(getStdout());
    const realModeSha=sha(REAL_MODE);
    result={ok:Boolean(identity&&receipt),identity,receipt,real_mode_sha:realModeSha,digest:identity&&receipt?identityDigest({identity,receipt,realModeSha}):null,port};
  }finally{await stopService(child);clean(base);}
  const text=JSON.stringify(result,null,2)+"\n";
  if(outPath)writeFileSync(outPath,text);
  process.stdout.write(text);
}
