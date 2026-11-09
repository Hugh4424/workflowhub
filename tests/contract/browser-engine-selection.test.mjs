import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const ROOT=process.cwd();
const session=join(ROOT,"skills/isolated-browser-qa/scripts/browser-qa-session.mjs");
const doctor=join(ROOT,"skills/isolated-browser-qa/scripts/browser-qa-doctor.sh");
const cleanup=join(ROOT,"skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh");
const context=join(ROOT,"skills/isolated-browser-qa/scripts/browser-qa-context.sh");
const read=p=>existsSync(p)?readFileSync(p,"utf8"):"";
describe("ORACLE-EXTRACT-ENTRY / ORACLE-EXTRACT-GUARD",()=>{
  it("engine:prefers-ego-lite",()=>{expect(read(session)).toMatch(/ego-?lite/i);});
  it("engine:fallback-recorded",()=>{expect(read(session)).toMatch(/fallback|engine_switch|回退/);});
  it("engine:shell-cases-synced",()=>{for(const p of [doctor,cleanup,context]){expect(read(p),`${p} must know ego-lite`).toMatch(/ego-?lite/i);}});
  it("engine:shell-defaults-ego-lite",()=>{for(const p of [doctor,cleanup]){expect(read(p),`${p} default engine must be ego-lite`).toMatch(/BROWSER_QA_ENGINE:-ego-lite/);}expect(read(context),"context keeps auto discovery to ego-lite then documented fallback").toContain('BROWSER_QA_ENGINE:-auto');});
  it("guard:unregistered-rejected",()=>{expect(read(session)).toMatch(/unregistered|未登记|not-registered/);});
  it("guard:no-arbitrary-eval",()=>{const s=read(session);expect(s).not.toMatch(/eval\(/);});
  it("guard:reference-documents-get-styles",()=>{const ref=readFileSync(join(ROOT,"skills/isolated-browser-qa/references/agent-browser.md"),"utf8");expect(ref).toContain("get styles");expect(ref).toContain("get box");});
});

import {tmpdir} from "node:os";
import {mkdtempSync,mkdirSync,writeFileSync,chmodSync,rmSync,realpathSync,symlinkSync} from "node:fs";

// TCR-P2: production seams only; fake DOM is not real-browser guard evidence.
const api=await import('../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs');
describe('ORACLE-EXTRACT-ENTRY / ORACLE-EXTRACT-GUARD production seams',()=>{
  const egoHelperPath=join(tmpdir(),'ego-browser');
  const installed={appInstallation:'present',helperPath:egoHelperPath,running:true};
  // Selector branch tests use explicit facts; detector tests below exercise production discovery.
  const absent={appInstallation:'absent',reason:'test-only-confirmed-absence'};
  it('selection:installed-ego-preferred',async()=>{expect(await api.selectBrowserEngine({},{probe:async()=>installed})).toEqual({engine:'ego-lite',fallbacks:[],egoHelperPath});});
  it('selection:synthetic-absence-branch-records-probe',async()=>{const r=await api.selectBrowserEngine({},{probe:async()=>absent});expect(r.engine).toBe('agent-browser');expect(r.fallbacks).toEqual([{event:'engine-fallback',from:'ego-lite',to:'agent-browser',reason:expect.any(String),probe:absent}]);});
  it('selection:unknown-installation-fails-closed-without-fallback',async()=>{const result=await api.selectBrowserEngine({},{probe:async()=>({appInstallation:'unknown',reason:'registry-unavailable'})}).catch(error=>error);expect(result).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});expect(result).not.toHaveProperty('fallbacks');});
  it('selection:installed-helper-missing-fails-closed',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>({appInstallation:'present',helperPath:null,running:true})})).rejects.toMatchObject({code:'EGO_HELPER_UNAVAILABLE'});});
  it('selection:installed-ego-not-running-fails-closed',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>({appInstallation:'present',helperPath:egoHelperPath,running:false})})).rejects.toMatchObject({code:'EGO_NOT_RUNNING'});});
  it('selection:explicit-agent-browser-is-guarded-when-ego-present',async()=>{await expect(api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'},{probe:async()=>installed})).rejects.toMatchObject({code:'EGO_INSTALLED_AGENT_BROWSER_FORBIDDEN'});});
  it('selection:explicit-agent-browser-is-guarded-when-ego-unknown',async()=>{await expect(api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'},{probe:async()=>({appInstallation:'unknown'})})).rejects.toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});});
  it('selection:explicit-agent-browser-only-with-synthetic-confirmed-absence',async()=>{expect(await api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'},{probe:async()=>absent})).toEqual({engine:'agent-browser',fallbacks:[]});});
  it('selection:explicit-browser-use-preserves-native-route',async()=>{expect(await api.selectBrowserEngine({BROWSER_QA_ENGINE:'browser-use'},{probe:()=>{throw Error('must not probe');}})).toEqual({engine:'browser-use',fallbacks:[]});});
  for(const error of ['CANCELLED','EACCES'])it(`selection:probe-error-never-falls-back-${error}`,async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>{throw Object.assign(Error(error),{code:error});}})).rejects.toMatchObject({code:error});});
  it('selection:probe-error-is-not-absence',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>{throw Error('system probe failed');}})).rejects.toMatchObject({code:'ENGINE_PROBE_UNAVAILABLE'});});

  it('registration:unknown-never-reaches-page',async()=>{let calls=0;await expect(api.runRegisteredScript({evaluate(){calls++;}},'unregistered',{elements:[]})).rejects.toMatchObject({code:'UNREGISTERED_SCRIPT'});expect(calls).toBe(0);});
  it('registration:reject-code-or-extra-keys-before-page',async()=>{for(const args of [{elements:[],script:'document.body.remove()'},{elements:[],viewport:{width:1280,height:800}},{elements:[{selector:'h1',properties:[()=>42]}]}]){let calls=0;await expect(api.runRegisteredScript({evaluate(){calls++;}},'design-source-read-v1',args)).rejects.toMatchObject({code:'INVALID_COLLECTION_ARGUMENTS'});expect(calls).toBe(0);}});
  function fakePage(mode='read'){
    let requests=0,writes=0,calls=0;const previous=new Map();
    class FakeNode{appendChild(){writes++;}insertBefore(){writes++;}replaceChild(){writes++;}removeChild(){writes++;}get textContent(){return 'heading';}set textContent(v){writes++;}}
    class FakeElement extends FakeNode{get innerHTML(){return 'heading';}set innerHTML(v){writes++;}get outerHTML(){return '<h1>heading</h1>';}set outerHTML(v){writes++;}setAttribute(){writes++;}getAttribute(){return null;}getBoundingClientRect(){return{x:0,y:0,width:100,height:20};}click(){if(mode==='click-fetch')win.fetch('/click');if(mode==='click-append')this.appendChild({});}}
    class XHR{open(){requests++;}}
    const element=new FakeElement();element.tagName='H1';
    const win={innerWidth:1280,innerHeight:800,fetch(){requests++;}};
    const document={body:element,documentElement:element,querySelector(){if(mode==='fetch')win.fetch('/probe');if(mode==='xhr')new XHR().open('GET','/probe');if(mode==='append')element.appendChild({});if(mode==='html')element.innerHTML='changed';if(mode==='throw')throw Error('CANCELLED');return element;}};
    const bindings={window:win,XMLHttpRequest:XHR,Node:FakeNode,Element:FakeElement,document,MutationObserver:class{observe(){}disconnect(){}takeRecords(){return[];}},getComputedStyle:()=>({getPropertyValue:()=> '100px'})};
    return {page:{async evaluate(fn,arg){calls++;for(const [k,v]of Object.entries(bindings)){previous.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});}try{return fn(arg);}finally{for(const [k,v]of previous)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}}},stats:()=>({requests,writes,calls}),restored:()=>{win.fetch();new XHR().open();element.appendChild({});return{requests,writes};}};
  }
  it('guard:registered-fixed-read-reaches-wrapper',async()=>{const f=fakePage();const r=await api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:['width']}]});expect(r[0].rendered.styles.width).toBe('100px');expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  it('guard:registered-read-binds-actual-viewport',async()=>{const f=fakePage();const r=await api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:[]}]});expect(r[0].viewport_observed).toEqual({width:1280,height:800});expect(f.stats()).toEqual({requests:0,writes:0,calls:1});});
  it('guard:registered-prepare-click-reaches-wrapper',async()=>{const f=fakePage();expect(await api.runRegisteredScript(f.page,'design-source-prepare-v1',{actions:[{type:'click',selector:'h1'}]})).toEqual([]);expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  for(const mode of ['click-fetch','click-append'])it(`guard:prepare-${mode}-no-side-effect`,async()=>{const f=fakePage(mode);await expect(api.runRegisteredScript(f.page,'design-source-prepare-v1',{actions:[{type:'click',selector:'h1'}]})).rejects.toThrow(mode==='click-fetch'?'READ_ONLY_NETWORK':'READ_ONLY_DOM_WRITE');expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  for(const mode of ['fetch','xhr','append','html'])it(`guard:fake-${mode}-no-side-effect-restores`,async()=>{const f=fakePage(mode);await expect(api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:[]}]})).rejects.toThrow(mode==='fetch'||mode==='xhr'?'READ_ONLY_NETWORK':'READ_ONLY_DOM_WRITE');expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  it('guard:exception-restores',async()=>{const f=fakePage('throw');await expect(api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:[]}]})).rejects.toThrow('CANCELLED');expect(f.restored()).toEqual({requests:2,writes:1});});
});

describe('ORACLE-EXTRACT-ENTRY probe failure classification',()=>{
  it('probe:permission-result-is-not-missing',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>{throw Object.assign(Error('EACCES'),{code:'EACCES'});}})).rejects.toMatchObject({code:'EACCES'});});
  it('probe:invalid-installation-state-is-rejected',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>({appInstallation:'maybe'})})).rejects.toMatchObject({code:'ENGINE_PROBE_INVALID'});});
});

describe('ORACLE-EXTRACT-ENTRY SDK command real child stream boundary',()=>{
  it('sdk:owned-handle-is-extracted-from-stderr-console-stream',async()=>{const script=`console.error('SDK notice');console.error('WHQA_OWNED_HANDLE='+JSON.stringify({name:'whqa-test',spaceId:71,label:'p1'}));`;const result=await api.executeEgoWorkspaceCommand([process.execPath,'-e',script],process.env);expect(result).toEqual({code:0,handle:{name:'whqa-test',spaceId:71,label:'p1'}});});
});

describe('ORACLE-EXTRACT-ENTRY current user no implicit browser startup',()=>{
  it('entry:synthetic-absence-branch-falls-back-before-agent-launch',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-fallback-')),marker=join(root,'attempted'),probe={appInstallation:'absent',reason:'app-bundle-not-found'};const out=[],err=[];const log=console.log,error=console.error;try{for(const [name,body] of [['agent-browser',`require('node:fs').appendFileSync(${JSON.stringify(marker)},'attempted\\n');process.exit(7);`],['bash','process.exit(0);']]){const fake=join(root,name);writeFileSync(fake,`#!${process.execPath}\n${body}`);chmodSync(fake,0o700);}console.log=(...v)=>out.push(v.join(' '));console.error=(...v)=>err.push(v.join(' '));const code=await api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>probe});expect(code).toBe(1);expect(existsSync(marker)).toBe(true);expect(readFileSync(marker,'utf8')).toBe('attempted\n');const facts=out.filter(v=>v.startsWith('{')).map(v=>JSON.parse(v)).filter(v=>v.event==='engine-fallback');expect(facts).toEqual([{event:'engine-fallback',from:'ego-lite',to:'agent-browser',reason:expect.any(String),probe}]);expect(err.join('\n')).toContain('ENGINE_LAUNCH_FAILED');}finally{console.log=log;console.error=error;rmSync(root,{recursive:true,force:true});}});
  it('entry:unknown-installation-never-launches-agent-browser',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-unknown-install-')),marker=join(root,'attempted');try{writeFileSync(join(root,'agent-browser'),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify('MARKER')},'attempted');`.replace('MARKER',JSON.stringify(marker)));chmodSync(join(root,'agent-browser'),0o700);await expect(api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>({appInstallation:'unknown',reason:'search-incomplete'})})).rejects.toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});expect(existsSync(marker)).toBe(false);}finally{rmSync(root,{recursive:true,force:true});}});
  it('entry:installed-but-not-running-never-launches-agent-browser',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-installed-not-running-')),marker=join(root,'attempted'),probe={appInstallation:'present',helperPath:join(root,'ego-browser'),running:false};try{writeFileSync(join(root,'agent-browser'),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');`);chmodSync(join(root,'agent-browser'),0o700);await expect(api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>probe})).rejects.toMatchObject({code:'EGO_NOT_RUNNING'});expect(existsSync(marker)).toBe(false);}finally{rmSync(root,{recursive:true,force:true});}});
  it('entry:explicit-agent-browser-present-never-launches-agent-browser',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-explicit-agent-guard-')),marker=join(root,'attempted');try{writeFileSync(join(root,'agent-browser'),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');`);chmodSync(join(root,'agent-browser'),0o700);await expect(api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_ENGINE:'agent-browser',BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>({appInstallation:'present',helperPath:join(root,'ego-browser'),running:true})})).rejects.toMatchObject({code:'EGO_INSTALLED_AGENT_BROWSER_FORBIDDEN'});expect(existsSync(marker)).toBe(false);}finally{rmSync(root,{recursive:true,force:true});}});
  it('identity:receiver-reparsed-after-cdp-url',()=>{const source=read(session),run=source.slice(source.indexOf('export async function runBrowserQa'));const cdp=run.indexOf("'get','cdp-url'"),endpoint=run.indexOf("endpoint=validateEndpoint(endpoint,'receiver')"),ownership=run.indexOf('const ownership=await ownedReceiver');expect(cdp).toBeGreaterThan(-1);expect(endpoint).toBeGreaterThan(cdp);expect(ownership).toBeGreaterThan(endpoint);const body=source.slice(source.indexOf('async function ownedReceiver'),source.indexOf('async function nativePython'));expect(body.match(/command\(\['ps'/g)).toHaveLength(1);expect(body).toContain('lstart=,command=');expect(body).toContain('profileIdentity');expect(run).toContain('RECEIVER_IDENTITY_CHANGED');});
  it('entry:inner-sdk-error-does-not-launch-backup',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-sdk-error-')),marker=join(root,'backup'),helperPath=join(root,'ego-browser');try{for(const [name,body]of [['ps',`console.log('/Applications/ego lite.app/Contents/MacOS/ego lite');`],['ego-browser',`console.error('CONTROLLED_SDK_ERROR');process.exit(7);`],['agent-browser',`require('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');`]]){const path=join(root,name);writeFileSync(path,`#!${process.execPath}\n${body}`);chmodSync(path,0o700);}await expect(api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_TASK_ID:'workflowhub-c09-contract',BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>({appInstallation:'present',helperPath,running:true})})).rejects.toMatchObject({code:'EGO_WORKSPACE_CREATE_FAILED'});expect(existsSync(marker)).toBe(false);}finally{rmSync(root,{recursive:true,force:true});}});
  it('entry:resolved-ego-helper-path-is-used-for-acquire-and-finish',async()=>{
    const root=mkdtempSync(join(tmpdir(),'whqa-helper-path-'));
    const helperPath=join(root,'resolved-ego-helper'),calls=join(root,'helper-calls.jsonl'),count=join(root,'count');
    const helper="const fs=require(\"node:fs\");const calls="+JSON.stringify(calls)+";const source=process.argv[4]||\"\";const match=source.match(/const name=(.*?);/);const name=JSON.parse(match[1]);fs.appendFileSync(calls,JSON.stringify({executable:process.argv[1]})+\"\\n\");if(source.includes(\"WHQA_OWNED_HANDLE=\"))console.log(\"WHQA_OWNED_HANDLE=\"+JSON.stringify({name,spaceId:71,label:\"p1\"}));else console.log(JSON.stringify({event:\"ego-workspace-finished\",resolved:true,receipt:{receipt_keys:[\"closedManagedLabels\",\"keptManagedLabels\"],closed_page_label_p1:true,closed_page_count:1,retained_page_count:0,closed_space:true,preserved_unmanaged_count:0}}));";
    try {
      writeFileSync(join(root,'ps'),`#!${process.execPath}\nconsole.log('/Applications/ego lite.app/Contents/MacOS/ego lite');`);chmodSync(join(root,'ps'),0o700);
      writeFileSync(helperPath,`#!${process.execPath}\n${helper}`);chmodSync(helperPath,0o700);
      const result=await api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--',process.execPath,'-e','process.exit(0)'],{PATH:root,HOME:root,BROWSER_QA_TASK_ID:'workflowhub-c09-contract',BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>({appInstallation:'present',helperPath,running:true})});
      expect(result).toBe(0);
      const invocations=readFileSync(calls,'utf8').trim().split('\n').map(JSON.parse);
      expect(invocations).toHaveLength(2);expect(invocations.map(item=>item.executable)).toEqual([helperPath,helperPath]);
    } finally {rmSync(root,{recursive:true,force:true});}
  });
});

// Documented context -> eval -> --run must retain the no-implicit-start boundary.
import {spawnSync} from 'node:child_process';
describe('ORACLE-EXTRACT-ENTRY documented shell boundary',()=>{
  it('entry:context-auto-missing-never-becomes-explicit-backup',()=>{const root=mkdtempSync(join(tmpdir(),'whqa-context-')),marker=join(root,'backup');try{writeFileSync(join(root,'agent-browser'),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');process.exit(7);`);chmodSync(join(root,'agent-browser'),0o700);writeFileSync(join(root,'node'),`#!/bin/sh\nexec ${process.execPath} "$@"`);chmodSync(join(root,'node'),0o700);const result=spawnSync('/bin/bash',['-c',`set -e; context_exports="$(/bin/bash "$1" http://localhost:3000)"; eval "$context_exports"; /bin/bash "$1" --run --url http://localhost:3000 --evidence-dir "$2" -- must-not-run`,'qa-test',context,root],{env:{...process.env,PATH:root+':/usr/bin:/bin',HOME:root,BROWSER_QA_ENGINE:'auto',BROWSER_QA_AUTH_MODE:'none'},encoding:'utf8'});expect(existsSync(marker),'documented context path must not launch backup').toBe(false);expect(result.status).not.toBe(0);expect(result.stdout).not.toContain('export BROWSER_QA_ENGINE=agent-browser');}finally{rmSync(root,{recursive:true,force:true});}});
  it('entry:context-explicit-agent-browser-matches-selector-guard',async()=>{let selectorAllows=false;try{selectorAllows=(await api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'})).engine==='agent-browser';}catch{}const result=spawnSync('/bin/bash',[context,'http://localhost:3000'],{env:{...process.env,BROWSER_QA_ENGINE:'agent-browser'},encoding:'utf8'});expect(result.status===0).toBe(selectorAllows);expect(result.stdout.includes('export BROWSER_QA_ENGINE=agent-browser')).toBe(selectorAllows);});
  it('context:explicit-engine-always-calls-selector',()=>{const source=readFileSync(context,'utf8');expect(source).toContain('selectBrowserEngine(process.env)');expect(source).not.toMatch(/if \[ "\$ENGINE" = auto \]/);});
});

import {validateSkillBundle,resolveSkillPackage} from '../../runtime/adapters/local-skill-resolver.mjs';
import {resolvePortableStageFiles} from '../../runtime/distribution/skill-bundle-release.mjs';
describe('ORACLE-C07-COLLECT gateway',()=>{
  it('gateway:one-selection-chain-preserves-evidence-contract',()=>{const text=read(join(ROOT,'skills/isolated-browser-qa/SKILL.md'));expect(text).toContain('已安装 Ego app 时不选择 agent-browser');expect(text).toContain('只有系统确认 app 未安装');expect(text).toContain('选定后');expect(text).not.toContain('### 5. Launch With `browser-use`');for(const key of ['from','to','reason','probe','engine_switch: no','profile content must not'])expect(text).toContain(key);});
  it('gateway:cleanup-only-owned-agent-browser',()=>{const text=read(cleanup);for(const word of ['browser_use_roots','all_browser_use_roots','browser-use'])expect(text).not.toContain(word);expect(text).toContain('ego-lite)');expect(text).toContain('agent-browser)');});
  it('gateway:fallback-reference-has-four-fields',()=>{const text=read(join(ROOT,'skills/isolated-browser-qa/references/fallback.md'));for(const field of ['from','to','reason','probe'])expect(text).toContain('`'+field+'`');});
  it('gateway:bundle-twelve-preserves-native-delivery',()=>{const helper='skills/isolated-browser-qa/scripts/browser-qa-browser-use.py',portable=resolvePortableStageFiles({packageRoot:ROOT,stage:'build-code'}),pkg=resolveSkillPackage({packageRoot:ROOT,manifestPath:'workflows/build-code/skill-deps.yaml',dependency:{name:'isolated-browser-qa',path:'skills/isolated-browser-qa/SKILL.md'}});expect(portable.files.includes(helper),'real portable consumer must deliver private helper').toBe(true);expect(pkg.resolved_bundle_paths.includes(join(ROOT,helper)),'real skill resolver must deliver private helper').toBe(true);const bundle=JSON.parse(read(join(ROOT,'skills/isolated-browser-qa/skill-bundle.json')));expect(bundle.files).toHaveLength(12);expect(bundle.files).not.toContain('references/browser-use.md');expect(bundle.files).toContain('scripts/browser-qa-browser-use.py');for(const file of ['references/browser-use.md','scripts/browser-qa-browser-use.py'])expect(existsSync(join(ROOT,'skills/isolated-browser-qa',file))).toBe(true);expect(validateSkillBundle(ROOT,'skills/isolated-browser-qa/skill-bundle.json','skills/isolated-browser-qa/SKILL.md').files).toHaveLength(12);});
});

describe('ORACLE-C07-COLLECT running probe failures',()=>{
  it('probe:invalid-running-state-is-rejected',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>({appInstallation:'present',helperPath:'/tmp/ego-browser',running:'no'})})).rejects.toMatchObject({code:'ENGINE_PROBE_INVALID'});});
  it('probe:process-observation-failed-is-not-missing',async()=>{
    const root=mkdtempSync(join(tmpdir(),'whqa-probe-')),appPath=join(root,'ego lite.app');
    mkdirSync(appPath);
    try{
      const systemProbe={platform:'darwin',appCandidates:[appPath],commandProbe:async argv=>{
        if(argv[0]==='/usr/bin/plutil')return {code:0,stdout:'com.citrolabs.ego.lite'};
        if(argv[0]==='ps')return {code:7,stdout:''};
        throw Error('unexpected system probe command');
      }};
      await expect(api.selectBrowserEngine({PATH:root},{systemProbe})).rejects.toMatchObject({code:'ENGINE_PROBE_UNAVAILABLE'});
    }finally{rmSync(root,{recursive:true,force:true});}
  });
});

describe('ORACLE-C09 Ego installation detector completeness',()=>{
  function makeSystemProbe({searchCode=0,searchOutput='',swiftCode=0,swiftState='unknown',swiftSource='application-domain-scan-incomplete',swiftOutput=null,plutilCode=0,plutilOutput='com.citrolabs.ego.lite'}={}){
    const calls=[];
    return {calls,systemProbe:{platform:'darwin',appCandidates:[],commandProbe:async argv=>{
      calls.push([...argv]);
      if(argv[0]==='/usr/bin/mdfind')return {code:searchCode,stdout:searchOutput};
      if(argv[0]==='/usr/bin/swift')return {code:swiftCode,stdout:swiftOutput??JSON.stringify({state:swiftState,source:swiftSource})};
      if(argv[0]==='/usr/bin/plutil')return {code:plutilCode,stdout:plutilOutput};
      if(argv[0]==='ps')return {code:0,stdout:''};
      throw Error('unexpected system probe command');
    }}};
  }

  it('probe:empty-spotlight-does-not-prove-absence-with-unindexed-app',async()=>{
    const root=mkdtempSync(join(tmpdir(),'whqa-ego-unindexed-'));
    mkdirSync(join(root,'ego lite.app'));
    const {systemProbe}=makeSystemProbe({searchOutput:''});
    try{
      const auto=await api.selectBrowserEngine({}, {systemProbe}).catch(error=>error);
      const explicit=await api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'}, {systemProbe}).catch(error=>error);
      expect(auto).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
      expect(explicit).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
    }finally{rmSync(root,{recursive:true,force:true});}
  });

  it('probe:mdfind-hit-is-checked-as-a-bundle-before-routing',async()=>{
    const root=mkdtempSync(join(tmpdir(),'whqa-ego-search-hit-'));
    const appPath=join(root,'ego lite.app');
    mkdirSync(appPath);
    const {systemProbe,calls}=makeSystemProbe({searchOutput:appPath+'\0'});
    try{
      await expect(api.selectBrowserEngine({}, {systemProbe})).rejects.toMatchObject({code:'EGO_HELPER_UNAVAILABLE'});
      const resolvedAppPath=realpathSync(appPath);
      expect(calls.some(argv=>argv[0]==='/usr/bin/plutil'&&argv.at(-1)===join(resolvedAppPath,'Contents','Info.plist'))).toBe(true);
      expect(calls.some(argv=>argv[0]==='/usr/bin/swift')).toBe(false);
    }finally{rmSync(root,{recursive:true,force:true});}
  });

  it('probe:launch-services-registered-app-prevents-fallback',async()=>{
    const {systemProbe,calls}=makeSystemProbe({swiftState:'present',swiftSource:'launch-services'});
    await expect(api.selectBrowserEngine({}, {systemProbe})).rejects.toMatchObject({code:'EGO_HELPER_UNAVAILABLE'});
    expect(calls.some(argv=>argv[0]==='/usr/bin/swift')).toBe(true);
  });

  it('probe:unregistered-application-domain-bundle-prevents-fallback',async()=>{
    const {systemProbe}=makeSystemProbe({swiftState:'present',swiftSource:'application-domain-scan'});
    await expect(api.selectBrowserEngine({}, {systemProbe})).rejects.toMatchObject({code:'EGO_HELPER_UNAVAILABLE'});
  });

  it('probe:complete-empty-application-domains-confirm-absence-for-auto-route',async()=>{
    const {systemProbe,calls}=makeSystemProbe({swiftState:'absent',swiftSource:'application-domain-scan-complete'});
    const auto=await api.selectBrowserEngine({}, {systemProbe});
    expect(auto).toEqual({engine:'agent-browser',fallbacks:[{
      event:'engine-fallback',from:'ego-lite',to:'agent-browser',
      reason:'Ego app confirmed absent before launch',
      probe:{appInstallation:'absent',reason:'application-domain-scan-complete'}
    }]});
    expect(await api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'}, {systemProbe})).toEqual({engine:'agent-browser',fallbacks:[]});
    expect(calls.some(argv=>argv[0]==='/usr/bin/swift')).toBe(true);
  });

  it('probe:query-errors-or-incomplete-application-domains-preserve-unknown',async()=>{
    const cases=[
      {swiftCode:1},
      {swiftOutput:'not-json'},
      {swiftState:'unknown',swiftSource:'application-domain-metadata-unreadable'}
    ];
    for(const scenario of cases){
      const {systemProbe}=makeSystemProbe(scenario);
      const auto=await api.selectBrowserEngine({}, {systemProbe}).catch(error=>error);
      const explicit=await api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'}, {systemProbe}).catch(error=>error);
      expect(auto).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
      expect(explicit).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
    }
  });

  it('probe:zero-application-directory-roots-preserve-unknown',async()=>{
    const {systemProbe}=makeSystemProbe({swiftState:'unknown',swiftSource:'application-domain-list-unavailable'});
    const auto=await api.selectBrowserEngine({}, {systemProbe}).catch(error=>error);
    const explicit=await api.selectBrowserEngine({BROWSER_QA_ENGINE:'agent-browser'}, {systemProbe}).catch(error=>error);
    expect(auto).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
    expect(explicit).toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
    expect(auto).not.toHaveProperty('fallbacks');
    expect(explicit).not.toHaveProperty('fallbacks');
  });

  it('probe:stale-spotlight-hit-remains-unknown-even-with-complete-no-match-scan',async()=>{
    const root=mkdtempSync(join(tmpdir(),'whqa-ego-stale-'));
    const stalePath=join(root,'missing ego lite.app');
    const {systemProbe}=makeSystemProbe({searchOutput:stalePath+'\0',swiftState:'absent',swiftSource:'application-domain-scan-complete'});
    try{
      await expect(api.selectBrowserEngine({}, {systemProbe})).rejects.toMatchObject({code:'EGO_INSTALLATION_UNAVAILABLE'});
    }finally{rmSync(root,{recursive:true,force:true});}
  });

  it('probe:direct-installed-bundle-prevents-fallback-even-with-missing-helper',async()=>{
    const root=mkdtempSync(join(tmpdir(),'whqa-ego-bundle-'));
    const appPath=join(root,'ego lite.app');
    mkdirSync(appPath);
    try{
      const systemProbe={platform:'darwin',appCandidates:[appPath],commandProbe:async argv=>{
        if(argv[0]==='/usr/bin/plutil')return {code:0,stdout:'com.citrolabs.ego.lite'};
        if(argv[0]==='ps')return {code:0,stdout:''};
        throw Error('unexpected system probe command');
      }};
      await expect(api.selectBrowserEngine({}, {systemProbe})).rejects.toMatchObject({code:'EGO_HELPER_UNAVAILABLE'});
    }finally{rmSync(root,{recursive:true,force:true});}
  });
});

describe('ORACLE-C09 runner exact live-query scope',()=>{
  const localLiveUrls=[
    'http://127.0.0.1:3100/simulation-board?source=live',
    'http://127.0.0.1:3100/sim-workbench?source=live'
  ];
  async function runWithFakeEgo(url){
    const root=mkdtempSync(join(tmpdir(),'whqa-live-scope-'));
    const helperPath=join(root,'ego-browser'),marker=join(root,'target-url'),count=join(root,'helper-count');
    const ps=join(root,'ps');
    try {
      writeFileSync(ps,`#!${process.execPath}\nprocess.stdout.write('/Applications/ego lite.app/Contents/MacOS/ego lite\\n');`);chmodSync(ps,0o700);
      const helper="const source=process.argv[4]||\"\";const match=source.match(/const name=(.*?);/);const name=JSON.parse(match[1]);if(source.includes(\"WHQA_OWNED_HANDLE=\"))console.log(\"WHQA_OWNED_HANDLE=\"+JSON.stringify({name,spaceId:71,label:\"p1\"}));else console.log(JSON.stringify({event:\"ego-workspace-finished\",resolved:true,receipt:{receipt_keys:[\"closedManagedLabels\",\"keptManagedLabels\"],closed_page_label_p1:true,closed_page_count:1,retained_page_count:0,closed_space:true,preserved_unmanaged_count:0}}));";
      writeFileSync(helperPath,`#!${process.execPath}\n${helper}`);chmodSync(helperPath,0o700);
      const scenario=`require('node:fs').writeFileSync(${JSON.stringify(marker)},process.env.BROWSER_QA_TARGET_URL);`;
      const result=await api.runBrowserQa(['--url',url,'--evidence-dir',root,'--',process.execPath,'-e',scenario],{PATH:root,HOME:root,BROWSER_QA_TASK_ID:'workflowhub-c09-contract',BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_AUTH_MODE:'none'},{probe:async()=>({appInstallation:'present',helperPath,running:true})});
      expect(result).toBe(0);
      expect(readFileSync(marker,'utf8')).toBe(url);
    } finally {rmSync(root,{recursive:true,force:true});}
  }
  it.each(localLiveUrls)('runner:accepts-and-preserves-exact-local-live-query %s',async url=>{await runWithFakeEgo(url);});
  it.each([
    ['unknown query','http://127.0.0.1:3100/simulation-board?source=live&extra=1'],
    ['noncanonical query','http://127.0.0.1:3100/simulation-board?source=%6cive'],
    ['hash','http://127.0.0.1:3100/simulation-board?source=live#section'],
    ['userinfo','http://user:pass@127.0.0.1:3100/simulation-board?source=live']
  ])('runner:rejects %s before engine selection',async(_label,url)=>{
    let probed=false;
    await expect(api.runBrowserQa(['--url',url,'--evidence-dir',tmpdir(),'--','must-not-run'],{BROWSER_QA_ENGINE:'ego-lite'},{probe:async()=>{probed=true;return{appInstallation:'present',helperPath:'/tmp/ego-browser',running:true};}})).rejects.toMatchObject({code:'INVALID_TARGET_SCOPE'});
    expect(probed).toBe(false);
  });
  it('runner:external-live-target-stays-outside-existing-domain-allowlist',async()=>{
    let probed=false;
    await expect(api.runBrowserQa(['--url','https://outside.example/simulation-board?source=live','--evidence-dir',tmpdir(),'--','must-not-run'],{BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_ALLOWED_DOMAINS:'localhost,127.0.0.1'},{probe:async()=>{probed=true;return{appInstallation:'present',helperPath:'/tmp/ego-browser',running:true};}})).rejects.toMatchObject({code:'TARGET_OUTSIDE_ALLOWED_DOMAINS'});
    expect(probed).toBe(true);
  });
});

// Regression for a logical .codex scripts link whose ESM URL resolves to its real owner.
it('entry:symlink-context-run-executes-validator-instead-of-silent-success',()=>{
  const root=realpathSync(mkdtempSync(join(tmpdir(),'whqa-symlink-entry-'))),logical=join(root,'logical-scripts');
  try{
    symlinkSync(join(ROOT,'skills/isolated-browser-qa/scripts'),logical,'dir');
    const argv=['--run','--not-a-run-option'];
    for(const entry of [context,join(logical,'browser-qa-context.sh')]){
      const result=spawnSync('/bin/bash',[entry,...argv],{cwd:ROOT,env:process.env,encoding:'utf8'});
      expect(result.error).toBeUndefined();expect(result.signal).toBeNull();
      expect(result.status).toBe(1);expect(result.stderr).toContain('INVALID_RUN_ARGUMENT');
    }
    const imported=spawnSync(process.execPath,['--input-type=module','-e','await import('+JSON.stringify(new URL('file://'+join(logical,'browser-qa-session.mjs')).href)+');console.log("import-only")'],{cwd:ROOT,env:process.env,encoding:'utf8'});
    expect(imported.status).toBe(0);expect(imported.stdout.trim()).toBe('import-only');expect(imported.stderr).toBe('');
  }finally{rmSync(root,{recursive:true,force:true});}
});
