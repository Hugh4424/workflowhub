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
  it("guard:unregistered-rejected",()=>{expect(read(session)).toMatch(/unregistered|未登记|not-registered/);});
  it("guard:no-arbitrary-eval",()=>{const s=read(session);expect(s).not.toMatch(/eval\(/);});
  it("guard:reference-documents-get-styles",()=>{const ref=readFileSync(join(ROOT,"skills/isolated-browser-qa/references/agent-browser.md"),"utf8");expect(ref).toContain("get styles");expect(ref).toContain("get box");});
});

import {tmpdir} from "node:os";
import {mkdtempSync,writeFileSync,chmodSync,rmSync} from "node:fs";

// TCR-P2: production seams only; fake DOM is not real-browser guard evidence.
const api=await import('../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs');
describe('ORACLE-EXTRACT-ENTRY / ORACLE-EXTRACT-GUARD production seams',()=>{
  it('selection:ego-available-preferred',async()=>{expect((await api.selectBrowserEngine({},{probe:async()=>({available:true})})).engine).toBe('ego-lite');});
  it('selection:missing-fallback-records-probe',async()=>{const probe={available:false,reason:'ENOENT'};const r=await api.selectBrowserEngine({},{probe:async()=>probe});expect(r.engine).toBe('agent-browser');expect(r.fallbacks).toEqual([{event:'engine-fallback',from:'ego-lite',to:'agent-browser',reason:expect.any(String),probe}]);});
  for(const engine of ['agent-browser','browser-use'])it(`selection:explicit-${engine}`,async()=>{expect(await api.selectBrowserEngine({BROWSER_QA_ENGINE:engine},{probe:()=>{throw Error('must not probe');}})).toEqual({engine,fallbacks:[]});});
  for(const error of ['CANCELLED','EACCES','SOURCE_RECEIVER_IDENTICAL'])it(`selection:no-fallback-${error}`,async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>{throw Object.assign(Error(error),{code:error});}})).rejects.toMatchObject({code:error});});

  it('registration:unknown-never-reaches-page',async()=>{let calls=0;await expect(api.runRegisteredScript({evaluate(){calls++;}},'unregistered',{elements:[]})).rejects.toMatchObject({code:'UNREGISTERED_SCRIPT'});expect(calls).toBe(0);});
  it('registration:reject-code-or-extra-keys-before-page',async()=>{for(const args of [{elements:[],script:'document.body.remove()'},{elements:[{selector:'h1',properties:[()=>42]}]}]){let calls=0;await expect(api.runRegisteredScript({evaluate(){calls++;}},'design-source-read-v1',args)).rejects.toMatchObject({code:'INVALID_COLLECTION_ARGUMENTS'});expect(calls).toBe(0);}});
  function fakePage(mode='read'){
    let requests=0,writes=0,calls=0;const previous=new Map();
    class FakeNode{appendChild(){writes++;}insertBefore(){writes++;}replaceChild(){writes++;}removeChild(){writes++;}get textContent(){return 'heading';}set textContent(v){writes++;}}
    class FakeElement extends FakeNode{get innerHTML(){return 'heading';}set innerHTML(v){writes++;}get outerHTML(){return '<h1>heading</h1>';}set outerHTML(v){writes++;}setAttribute(){writes++;}getAttribute(){return null;}getBoundingClientRect(){return{x:0,y:0,width:100,height:20};}click(){if(mode==='click-fetch')win.fetch('/click');if(mode==='click-append')this.appendChild({});}}
    class XHR{open(){requests++;}}
    const element=new FakeElement();element.tagName='H1';
    const win={fetch(){requests++;}};
    const document={body:element,documentElement:element,querySelector(){if(mode==='fetch')win.fetch('/probe');if(mode==='xhr')new XHR().open('GET','/probe');if(mode==='append')element.appendChild({});if(mode==='html')element.innerHTML='changed';if(mode==='throw')throw Error('CANCELLED');return element;}};
    const bindings={window:win,XMLHttpRequest:XHR,Node:FakeNode,Element:FakeElement,document,MutationObserver:class{observe(){}disconnect(){}takeRecords(){return[];}},getComputedStyle:()=>({getPropertyValue:()=> '100px'})};
    return {page:{async evaluate(fn,arg){calls++;for(const [k,v]of Object.entries(bindings)){previous.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});}try{return fn(arg);}finally{for(const [k,v]of previous)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}}},stats:()=>({requests,writes,calls}),restored:()=>{win.fetch();new XHR().open();element.appendChild({});return{requests,writes};}};
  }
  it('guard:registered-fixed-read-reaches-wrapper',async()=>{const f=fakePage();const r=await api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:['width']}]});expect(r[0].rendered.styles.width).toBe('100px');expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  it('guard:registered-prepare-click-reaches-wrapper',async()=>{const f=fakePage();expect(await api.runRegisteredScript(f.page,'design-source-prepare-v1',{actions:[{type:'click',selector:'h1'}]})).toEqual([]);expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  for(const mode of ['click-fetch','click-append'])it(`guard:prepare-${mode}-no-side-effect`,async()=>{const f=fakePage(mode);await expect(api.runRegisteredScript(f.page,'design-source-prepare-v1',{actions:[{type:'click',selector:'h1'}]})).rejects.toThrow(mode==='click-fetch'?'READ_ONLY_NETWORK':'READ_ONLY_DOM_WRITE');expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  for(const mode of ['fetch','xhr','append','html'])it(`guard:fake-${mode}-no-side-effect-restores`,async()=>{const f=fakePage(mode);await expect(api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:[]}]})).rejects.toThrow(mode==='fetch'||mode==='xhr'?'READ_ONLY_NETWORK':'READ_ONLY_DOM_WRITE');expect(f.stats()).toEqual({requests:0,writes:0,calls:1});expect(f.restored()).toEqual({requests:2,writes:1});});
  it('guard:exception-restores',async()=>{const f=fakePage('throw');await expect(api.runRegisteredScript(f.page,'design-source-read-v1',{elements:[{selector:'h1',properties:[]}]})).rejects.toThrow('CANCELLED');expect(f.restored()).toEqual({requests:2,writes:1});});
});

describe('ORACLE-EXTRACT-ENTRY probe failure classification',()=>{
  it('probe:permission-result-is-not-missing',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>({available:false,reason:'EACCES'})})).rejects.toMatchObject({code:'EACCES'});});
  it('probe:invalid-result-is-not-availability',async()=>{await expect(api.selectBrowserEngine({},{probe:async()=>({available:'yes'})})).rejects.toMatchObject({code:'ENGINE_PROBE_INVALID'});});
});

describe('ORACLE-EXTRACT-ENTRY existing ego workspace lifecycle seam (not real background proof)',()=>{
  function boundary({running=true,error,takeover=false}={}){
    const events=[];const task={spaceId:71,ownership:'agent',page(label){events.push('page:'+label);return{label,openedBy:'agent',goto:async url=>events.push('goto:'+url)};},finish:async args=>{events.push(['finish',args]);return{spaceId:71,closedSpace:true,keptManagedLabels:[],closedManagedLabels:['p1'],preservedUnmanagedCount:0};}};
    const sdk={taskSpace:async name=>{events.push('space:'+name);return task;}};
    return{events,task,options:{sdk,name:'whqa-test',isRunning:async()=>running,url:'http://localhost:3000',operation:async({task,page})=>{events.push('scenario:'+page.label);if(takeover)throw Object.assign(Error('EGO_CONTROL_LOST'),{code:'EGO_CONTROL_LOST'});if(error)throw Error(error);return{read:true};}}};
  }
  it('workspace:production-single-space-initial-page-success-finish-once',async()=>{const b=boundary();expect(await api.runEgoWorkspace(b.options)).toMatchObject({spaceId:71,result:{read:true}});expect(b.events).toEqual(['space:whqa-test','page:p1','goto:http://localhost:3000','scenario:p1',['finish',{keep:[]}]]);});
  it('workspace:task-continues-reuses-handle-without-finish',async()=>{const b=boundary();expect(await api.runEgoWorkspace({...b.options,finish:false})).toMatchObject({spaceId:71,result:{read:true}});expect(b.events.some(e=>Array.isArray(e)&&e[0]==='finish')).toBe(false);});
  it('workspace:absent-app-no-sdk-autostart',async()=>{const b=boundary({running:false});await expect(api.runEgoWorkspace(b.options)).rejects.toMatchObject({code:'EGO_NOT_RUNNING'});expect(b.events).toEqual([]);});
  for(const error of ['CANCELLED','EACCES','SCENARIO_FAILED'])it('workspace:error-retains-handle-no-finish-'+error,async()=>{const b=boundary({error});await expect(api.runEgoWorkspace(b.options)).rejects.toThrow(error);expect(b.events.some(e=>Array.isArray(e)&&e[0]==='finish')).toBe(false);});
  it('workspace:takeover-no-finish',async()=>{const b=boundary({takeover:true});await expect(api.runEgoWorkspace(b.options)).rejects.toMatchObject({code:'EGO_CONTROL_LOST'});expect(b.events.some(e=>Array.isArray(e)&&e[0]==='finish')).toBe(false);});
});

describe('ORACLE-EXTRACT-ENTRY SDK command real child stream boundary',()=>{
  it('sdk:stderr-console-handle-is-not-discarded',async()=>{const script=`console.error('SDK notice');console.error('WHQA_OWNED_HANDLE='+JSON.stringify({spaceId:71,label:'p1'}));`;const result=await api.executeEgoWorkspaceCommand([process.execPath,'-e',script],process.env);expect(result.handle).toEqual({spaceId:71,label:'p1'});expect(result.stderr).toContain('SDK notice');});
});

describe('ORACLE-EXTRACT-ENTRY current user no implicit browser startup',()=>{
  it('entry:missing-ego-errors-before-any-backup-launch',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-no-backup-')),marker=join(root,'attempted');try{const fake=join(root,'agent-browser');writeFileSync(fake,`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');process.exit(7);`);chmodSync(fake,0o700);let error;try{await api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_AUTH_MODE:'none'});}catch(e){error=e;}expect(existsSync(marker),'backup launch count must be zero').toBe(false);expect(error).toMatchObject({code:'EGO_EXISTING_MODE_NO_IMPLICIT_LAUNCH'});}finally{rmSync(root,{recursive:true,force:true});}});
  it('entry:inner-sdk-error-does-not-launch-backup',async()=>{const root=mkdtempSync(join(tmpdir(),'whqa-sdk-error-')),marker=join(root,'backup');try{for(const [name,body]of [['ps',`console.log('/Applications/ego lite.app/Contents/MacOS/ego lite');`],['ego-browser',`console.error('CONTROLLED_SDK_ERROR');process.exit(7);`],['agent-browser',`require('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');`]]){const path=join(root,name);writeFileSync(path,`#!${process.execPath}\n${body}`);chmodSync(path,0o700);}await expect(api.runBrowserQa(['--url','http://localhost:3000','--evidence-dir',root,'--','must-not-run'],{PATH:root,HOME:root,BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_AUTH_MODE:'none'})).rejects.toMatchObject({code:'EGO_WORKSPACE_HANDLE_UNAVAILABLE'});expect(existsSync(marker)).toBe(false);}finally{rmSync(root,{recursive:true,force:true});}});
});

// Documented context -> eval -> --run must retain the no-implicit-start boundary.
import {spawnSync} from 'node:child_process';
describe('ORACLE-EXTRACT-ENTRY documented shell boundary',()=>{
  it('entry:context-auto-missing-never-becomes-explicit-backup',()=>{const root=mkdtempSync(join(tmpdir(),'whqa-context-')),marker=join(root,'backup');try{writeFileSync(join(root,'agent-browser'),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'attempted');process.exit(7);`);chmodSync(join(root,'agent-browser'),0o700);writeFileSync(join(root,'node'),`#!/bin/sh\nexec ${process.execPath} "$@"`);chmodSync(join(root,'node'),0o700);const result=spawnSync('/bin/bash',['-c',`set -e; eval "$(/bin/bash "$1" http://localhost:3000)"; /bin/bash "$1" --run --url http://localhost:3000 --evidence-dir "$2" -- must-not-run`,'qa-test',context,root],{env:{...process.env,PATH:root+':/usr/bin:/bin',HOME:root,BROWSER_QA_ENGINE:'auto',BROWSER_QA_AUTH_MODE:'none'},encoding:'utf8'});expect(existsSync(marker),'documented context path must not launch backup').toBe(false);expect(result.status).not.toBe(0);expect(result.stdout).not.toContain('export BROWSER_QA_ENGINE=agent-browser');}finally{rmSync(root,{recursive:true,force:true});}});
});

describe('ORACLE-EXTRACT-ENTRY OCR037 lifecycle failures',()=>{
  for(const reason of ['PAGE_LOOKUP_FAILED','CANCELLED'])it('handle:reported-before-page-lookup-'+reason,async()=>{const facts=[];await expect(api.runEgoWorkspace({sdk:{taskSpace:async()=>({spaceId:71,page(){throw Object.assign(Error(reason),{code:reason});}})},name:'owned',url:'http://localhost:3000',isRunning:async()=>true,operation:async()=>{},report:fact=>facts.push(fact)})).rejects.toThrow(reason);expect(facts[0]).toMatchObject({event:'ego-workspace-owned',spaceId:71,label:'p1'});expect(facts.at(-1)).toMatchObject({event:'ego-workspace-retained',spaceId:71});});
  const valid={spaceId:71,closedSpace:true,keptManagedLabels:[],closedManagedLabels:['p1'],preservedUnmanagedCount:0};
  const execute=events=>api.executeEgoFinishCommand([process.execPath,'-e',events.map(e=>`console.error(${JSON.stringify(typeof e==='string'?e:JSON.stringify(e))});`).join('')],process.env,undefined,{spaceId:71,label:'p1'});
  for(const [name,events]of [['missing',[]],['duplicate',[{event:'ego-workspace-finished',spaceId:71,receipt:valid},{event:'ego-workspace-finished',spaceId:71,receipt:valid}]],['malformed',['{bad-json']],['wrong-space',[{event:'ego-workspace-finished',spaceId:72,receipt:valid}]],['no-receipt',[{event:'ego-workspace-finished',spaceId:71}]],['unknown-receipt',[{event:'ego-workspace-finished',spaceId:71,receipt:{closed:true}}]],['p1-not-closed',[{event:'ego-workspace-finished',spaceId:71,receipt:{...valid,closedManagedLabels:[]}}]],['unexplained-open-space',[{event:'ego-workspace-finished',spaceId:71,receipt:{...valid,closedSpace:false}}]]])it('finish:exit-zero-but-'+name+'-fails',async()=>{await expect(execute(events)).rejects.toMatchObject({code:'EGO_WORKSPACE_FINISH_RECEIPT_INVALID',handle:{spaceId:71,label:'p1'}});});
  it('finish:matching-receipt-closes-owned-p1',async()=>{expect(await execute([{event:'ego-workspace-finished',spaceId:71,receipt:valid}])).toMatchObject({spaceId:71,receipt:valid});});
  it('finish:protected-unmanaged-retained-does-not-claim-space-close',async()=>{const receipt={...valid,closedSpace:false,preservedUnmanagedCount:1};expect(await execute([{event:'ego-workspace-finished',spaceId:71,receipt}])).toMatchObject({receipt});});
});
