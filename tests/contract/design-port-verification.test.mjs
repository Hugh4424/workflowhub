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
// Content identity has two sides. Design paths are repo-relative; implementation paths are
// relative to content_binding.implementation.root (the committed verification output snapshot,
// which must stay byte-identical to a fresh generation), so changing either side invalidates
// the report.
const DESIGN_SIDE={
  geometry:["tests/fixtures/design-port-sample/prototype/styles.css"],
  "dom-parity":["tests/fixtures/design-port-sample/prototype/index.html"],
  "feature-keep":["tests/fixtures/design-port-sample/prototype/index.html"],
  "port-parity":["tests/fixtures/design-port-sample/prototype/index.html","tests/fixtures/design-port-sample/prototype/styles.css","tests/fixtures/design-port-sample/prototype/app.js"],
};
const IMPLEMENTATION_SIDE={
  geometry:["styles.css"],
  "dom-parity":["index.html"],
  "feature-keep":["index.html"],
  "port-parity":["index.html","styles.css","app.js"],
};
const OUTPUT_ROOT="tests/fixtures/design-port-sample/port-output";
function copyOutput(){
  const dir=mkdtempSync(join(tmpdir(),"p4-verify-out-copy-"));
  cpSync(resolve(ROOT,OUTPUT_ROOT),dir,{recursive:true});
  return dir;
}
function bindings(name,{design=DESIGN_SIDE[name],implementation=IMPLEMENTATION_SIDE[name],implRoot=OUTPUT_ROOT}={}){
  return {
    design:{files:design.map(p=>({path:p,sha256:sha(resolve(ROOT,p))}))},
    implementation:{root:implRoot,files:implementation.map(p=>({path:p,sha256:sha(resolve(ROOT,implRoot,p))}))},
  };
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
  const runChecker=(name,{config=CONFIGS[name]}={})=>runCheck(SCRIPTS[name],["--config",config]);
  describe("ORACLE-PORT-VERIFICATION accepts the four verification configs",()=>{
    it("each checker exists and accepts its committed config with a content-bound report",()=>{
      for(const name of Object.keys(SCRIPTS)){
        expect(existsSync(SCRIPTS[name]),`${name} script must exist`).toBe(true);
        const r=runChecker(name);
        expect(r.status,`${name}: ${r.stdout}${r.stderr}`).toBe(0);
        const report=outJson(r);
        expect(report.ok,`${name} ok`).toBe(true);
        expect(report.kind,name).toBe(name);
        expect(report.content&&report.content.config_sha256,`${name} config digest`).toMatch(/^[0-9a-f]{64}$/);
        const sides=(report.content.inputs||[]).map(entry=>entry.side);
        expect(sides.includes("design")&&sides.includes("implementation"),`${name} must bind both sides`).toBe(true);
        expect(typeof report.head==="string"||report.head===null,name).toBe(true);
      }
    });
  });

  describe("ORACLE-PORT-VERIFICATION reports the specified category geometry with 0.5px tolerance",()=>{
    it("accepts a diff exactly at 0.5px and rejects 0.5001px",()=>{
      const {dir,file}=mutateConfig("geometry",doc=>{doc.probes[0].design=100;doc.probes[0].implementation=100.5;doc.content_binding=bindings("geometry");});
      try{
        const ok=runChecker("geometry",{config:file});
        expect(ok.status,ok.stderr).toBe(0);
        const doc=readJson(file);doc.probes[0].implementation=100.5001;writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
        const over=runChecker("geometry",{config:file});
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
        const {dir,file}=mutateConfig(name,doc=>{mutate(doc);doc.content_binding=bindings(name);});
        try{
          const r=runChecker(name,{config:file});
          expect(r.status,r.stdout+r.stderr).not.toBe(0);
          expect(codeOf(r),r.stderr).toBe(code);
        }finally{clean(dir);}
      });
    }
    it("rejects a probe missing implementation as a shape error, not a silent pass (F4)",()=>{
      const {dir,file}=mutateConfig("geometry",doc=>{delete doc.probes[0].implementation;doc.content_binding=bindings("geometry");});
      try{
        const r=runChecker("geometry",{config:file});
        expect(r.status,r.stdout+r.stderr).toBe(2);
        expect(codeOf(r),r.stderr).toBe("GEOMETRY_SHAPE_INVALID");
      }finally{clean(dir);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION binds current content, not only the commit id",()=>{
    it("independently recomputes config and input digests with crypto and matches the report",()=>{
      for(const name of Object.keys(SCRIPTS)){
        const r=runChecker(name);
        expect(r.status,r.stderr).toBe(0);
        const report=outJson(r);
        expect(report.content.config_sha256,`${name} config sha`).toBe(sha(CONFIGS[name]));
        for(const entry of report.content.inputs){
          const root=entry.side==="implementation"?resolve(ROOT,OUTPUT_ROOT):ROOT;
          expect(entry.sha256,`${name} ${entry.side} input ${entry.path}`).toBe(sha(resolve(root,entry.path)));
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
        doc.content_binding={design:{files:[{path:target,sha256:sha(target)}]},implementation:{root:OUTPUT_ROOT,files:[{path:"styles.css",sha256:sha(resolve(ROOT,OUTPUT_ROOT,"styles.css"))}]}};
        writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
        const first=runChecker("geometry",{config:file});
        expect(first.status,first.stderr).toBe(0);
        writeFileSync(target,readFileSync(target,"utf8")+"\n/* dirty change after registration */\n");
        const changed=runChecker("geometry",{config:file});
        expect(changed.status,changed.stdout+changed.stderr).not.toBe(0);
        expect(codeOf(changed)).toBe("CONTENT_MISMATCH");
        clean(copyDir);
      }finally{clean(dir);}
    });
    it("binds the implementation output bytes for every class: changing port-output fails CONTENT_MISMATCH (F2/SP-F3)",()=>{
      for(const [name,file] of [["geometry","styles.css"],["dom-parity","index.html"],["feature-keep","index.html"],["port-parity","index.html"]]){
        const out=copyOutput();
        const cfgDir=mkdtempSync(join(tmpdir(),"p4-verify-implcfg-"));
        try{
          const file2=join(cfgDir,`${name}.json`);
          const doc=readJson(CONFIGS[name]);
          doc.content_binding=bindings(name,{implRoot:out});
          writeFileSync(file2,JSON.stringify(doc,null,2)+"\n");
          const ok=runChecker(name,{config:file2});
          expect(ok.status,`${name}: ${ok.stderr}`).toBe(0);
          writeFileSync(join(out,file),readFileSync(join(out,file),"utf8")+"\n/* implementation changed after registration */\n");
          const changed=runChecker(name,{config:file2});
          expect(changed.status,changed.stdout+changed.stderr).not.toBe(0);
          expect(codeOf(changed),`${name} must fail on changed implementation bytes`).toBe("CONTENT_MISMATCH");
        }finally{clean(cfgDir);clean(out);}
      }
    });
    it("keeps the committed implementation snapshot byte-identical to a fresh generation",()=>{
      const out=mkdtempSync(join(tmpdir(),"p4-verify-regen-"));
      try{
        const gen=spawnSync(process.execPath,[PORT_SCRIPT,"--mode=generate","--manifest",MANIFEST,"--design-root",PROTOTYPE,"--output",out],{cwd:ROOT,encoding:"utf8",timeout:180000});
        expect(gen.status,gen.stderr).toBe(0);
        for(const name of ["index.html","styles.css","app.js"]){
          expect(sha(join(out,name)),`${name} snapshot must match a fresh generation`).toBe(sha(resolve(ROOT,OUTPUT_ROOT,name)));
        }
      }finally{clean(out);}
    });
    it("reports an unverified side when a config binds only the design source",()=>{
      for(const name of Object.keys(SCRIPTS)){
        const {dir,file}=mutateConfig(name,doc=>{delete doc.content_binding.implementation;});
        try{
          const r=runChecker(name,{config:file});
          expect(r.status,`${name}: ${r.stdout}${r.stderr}`).toBe(2);
          expect(codeOf(r),`${name} needs a named unverified code`).toMatch(/_CONTENT_BINDING_INCOMPLETE$/);
        }finally{clean(dir);}
      }
    });
    it("reports an unverified side when the implementation output root is not declared",()=>{
      for(const name of Object.keys(SCRIPTS)){
        const {dir,file}=mutateConfig(name,doc=>{delete doc.content_binding.implementation.root;});
        try{
          const r=runChecker(name,{config:file});
          expect(r.status,`${name}: ${r.stdout}${r.stderr}`).toBe(2);
          expect(codeOf(r),`${name} needs a named unverified code`).toMatch(/_CONTENT_BINDING_INCOMPLETE$/);
        }finally{clean(dir);}
      }
    });
  });

  describe("ORACLE-PORT-VERIFICATION port parity reads the actual output, not only config arrays",()=>{
    function configFor(name,out){
      const dir=mkdtempSync(join(tmpdir(),"p4-verify-pp-cfg-"));
      const file=join(dir,`${name}.json`);
      const doc=readJson(CONFIGS[name]);
      doc.content_binding=bindings(name,{implRoot:out});
      writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
      return {dir,file,doc};
    }
    it("rejects a file that really exists in the output but is not registered",()=>{
      const out=copyOutput();
      const cfg=configFor("port-parity",out);
      try{
        writeFileSync(join(out,"extra-generated.css"),".sample-page .rogue { color: red; }\n");
        const r=runChecker("port-parity",{config:cfg.file});
        expect(r.status,r.stdout+r.stderr).not.toBe(0);
        expect(codeOf(r)).toBe("UNREGISTERED_FILE");
      }finally{clean(cfg.dir);clean(out);}
    });
    it("rejects a used class whose compiled rule is gone from the actual stylesheet",()=>{
      const out=copyOutput();
      const cfg=configFor("port-parity",out);
      try{
        const styles=join(out,"styles.css");
        writeFileSync(styles,readFileSync(styles,"utf8").replace(/\.sample-page \.receipt-line \{[^}]*\}\n?/,""));
        const entry=cfg.doc.content_binding.implementation.files.find(file=>file.path==="styles.css");
        entry.sha256=sha(styles);
        writeFileSync(cfg.file,JSON.stringify(cfg.doc,null,2)+"\n");
        const r=runChecker("port-parity",{config:cfg.file});
        expect(r.status,r.stdout+r.stderr).not.toBe(0);
        expect(codeOf(r)).toBe("UNCOMPILED_CLASS");
      }finally{clean(cfg.dir);clean(out);}
    });
    it("rejects a registered output missing from the actual directory",()=>{
      const out=copyOutput();
      const cfg=configFor("port-parity",out);
      try{
        rmSync(join(out,"manual-overrides.css"));
        const r=runChecker("port-parity",{config:cfg.file});
        expect(r.status,r.stdout+r.stderr).not.toBe(0);
        expect(codeOf(r)).toBe("OUTPUT_FILE_MISSING");
      }finally{clean(cfg.dir);clean(out);}
    });
  });

  describe("ORACLE-PORT-VERIFICATION keeps three states distinct (unverified / unavailable / target_failure)",()=>{
    it("missing config is unverified (exit 2), an unavailable object is unavailable (exit 2), a real mismatch is a target failure (exit 1)",()=>{
      const missing=runCheck(SCRIPTS.geometry,["--config",join(DIR,"does-not-exist.json")]);
      expect(missing.status).toBe(2);
      expect(codeOf(missing)).toBe("GEOMETRY_CONFIG_UNAVAILABLE");
      const {dir,file}=mutateConfig("port-parity",doc=>{doc.content_binding={design:{files:[{path:"tests/fixtures/design-port-sample/prototype/index.html",sha256:sha(resolve(ROOT,"tests/fixtures/design-port-sample/prototype/index.html"))}]},implementation:{root:OUTPUT_ROOT,files:[{path:"/nonexistent/p4/object.css",sha256:"0".repeat(64)}]}};});
      try{
        const unavailable=runChecker("port-parity",{config:file});
        expect(unavailable.status).toBe(2);
        expect(codeOf(unavailable)).toBe("PORT_PARITY_OBJECT_UNAVAILABLE");
      }finally{clean(dir);}
      const {dir:bd,file:bf}=mutateConfig("feature-keep",doc=>{doc.features[0].observed.text="变了";doc.content_binding=bindings("feature-keep");});
      try{
        const target=runChecker("feature-keep",{config:bf});
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
      doc.content_binding=bindings("geometry");
      writeFileSync(file,JSON.stringify(doc,null,2)+"\n");
      try{
        const r=runChecker("geometry",{config:file});
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
