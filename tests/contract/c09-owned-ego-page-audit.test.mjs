import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,sep} from 'node:path';
import {runInNewContext} from 'node:vm';
import {runPageAudit} from '../../skills/frontend-testing/scripts/run-page-audit.mjs';
import {egoTaskSpaceName,executeEgoFinishCommand,requireTaskIdFromHost,runOwnedEgoTaskSpace} from '../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs';
import * as browserQaSession from '../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs';
// Controlled SDK transport double, not a browser or real page observation.
const route='http://127.0.0.1:3100/audit',env={BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_EGO_SPACE_ID:'50'};
// The page double is already an owned Ego page; selector state is synthetic so this transport test never probes the host's install registry.
const ownedPageProbe=async()=>({appInstallation:'present',helperPath:'/private/tmp/c09-owned-ego-browser',running:true});
function pageDouble(options={}){let loader='initial',buffer=[],count=0,consoleArmed=false;const calls=[];return{label:'p1',spaceId:50,calls,url:async()=>options.url||route,waitForSelector:async()=>{},async cdp(method){calls.push(method);assert(!method.startsWith('Target.'),'owned SDK must not enumerate/attach targets');if(method==='egoAutomated.disable')consoleArmed=true;if(options.notReady&&method==='Network.enable')throw Error('SDK control lost before ready');if(method==='Page.getFrameTree')return{frameTree:{frame:{id:'main',loaderId:loader}}};if(method==='Accessibility.getFullAXTree')return{nodes:[{nodeId:'1',role:{value:'main'},name:{value:'Audit'}}]};return{};},async evaluate(fn,args){assert.equal(typeof fn,'function');assert.equal(args.id,'design-source-read-v1');return[{selector:'html',viewport_observed:{width:options.width||1440,height:900},structure:{tag:'HTML',text:'audit'},rendered:{styles:{},box:{width:1440,height:900}},facts:{viewport:{width:options.width||1440,height:900,dpr:1},scroll:{scrollWidth:1440,clientWidth:1440},navigation:{url:route,ttfb:10,domContentLoadedEventEnd:20,loadEventEnd:30}}}];},async events(){if(options.lost&&count)throw Error('EGO_CONTROL_LOST');const events=buffer;buffer=[];return events;},async reload(){calls.push('reload');count++;loader='loader-'+count;buffer=[{method:'Page.frameNavigated',params:{frame:{id:'main',loaderId:loader}}},{method:'Runtime.executionContextCreated',params:{context:{id:count,auxData:{frameId:'main'}}}},{method:'Network.requestWillBeSent',params:{requestId:String(count),loaderId:loader,frameId:'main',type:'Document',request:{url:route,method:'GET',headers:{Authorization:'secret'}}}},{method:'Network.responseReceived',params:{requestId:String(count),loaderId:loader,type:'Document',response:{url:route,status:200}}},...(options.suppressConsoleUntilDisable&&!consoleArmed?[]:[{method:'Runtime.consoleAPICalled',params:{executionContextId:count,type:'log',args:[{type:'string',value:'secret'}]}}]),{method:'Page.loadEventFired',params:{timestamp:1}}];if(options.multiple)buffer.push({method:'Page.frameNavigated',params:{frame:{id:'main',loaderId:'another-loader'}}});}};}
async function run(page,extra={}){const cwd=await mkdtemp(join(tmpdir(),'c09-owned-audit-'));await mkdir(join(cwd,'quality/evidence'),{recursive:true});const args=['--state','default','--viewport','1440x900','--out','quality/evidence/report.json','--workspace','/owned','--service','http://127.0.0.1:3100','--route',route,'--object-version','test-source-hash','--engine-session','ego-50-p1','--engine','ego-lite'];const result=await runPageAudit(args,{cwd,env,egoPage:page,probe:ownedPageProbe,windowTimeoutMs:100,...extra});return{result,cwd};}
test('existing audit accepts its already-owned SDK page without raw endpoint or target enumeration',async()=>{const page=pageDouble(),{result,cwd}=await run(page);assert.equal(result.code,0,JSON.stringify(result));const report=JSON.parse(await readFile(join(cwd,'quality/evidence/report.json'),'utf8'));assert.equal(report.object.engine,'ego-lite');assert.equal(report.object.viewport,'1440x900@1');assert.equal(report.criteria.length,8);assert.equal(report.summary.overall,'incomplete');assert(page.calls.indexOf('Network.enable')<page.calls.indexOf('reload'));assert.equal(page.calls.filter(x=>x==='reload').length,4);const network=result.observations.network;assert(network.items.some(x=>x.response?.status===200));assert(network.items.every(x=>x.window_id&&x.loader_id));assert(!JSON.stringify(result).includes('Authorization'));assert(!JSON.stringify(result).includes('secret'));});
test('owned Ego console stream enables the documented SDK event path before Runtime',async()=>{
  const page=pageDouble({suppressConsoleUntilDisable:true}),{result}=await run(page);
  assert.equal(result.code,0,JSON.stringify(result));
  assert(result.observations.console.items.some(item=>item.event==='Runtime.consoleAPICalled'),JSON.stringify(result.observations.console));
  const disable=page.calls.indexOf('egoAutomated.disable'),runtime=page.calls.indexOf('Runtime.enable'),reload=page.calls.indexOf('reload');
  assert(disable>=0&&runtime>disable&&reload>runtime,page.calls.join(' -> '));
  assert(!JSON.stringify(result.observations.console).includes('secret'),'console message text remains redacted');
});
test('wrong route rejects before navigation',async()=>{const page=pageDouble({url:route+'-wrong'}),{result}=await run(page);assert.notEqual(result.code,0);assert.equal(page.calls.includes('reload'),false);});
test('wrong viewport rejects before navigation',async()=>{const page=pageDouble({width:1280}),{result}=await run(page);assert.notEqual(result.code,0);assert.equal(page.calls.includes('reload'),false);});
test('unready SDK window issues zero navigation',async()=>{const page=pageDouble({notReady:true}),{result}=await run(page);assert.notEqual(result.code,0);assert.equal(page.calls.includes('reload'),false);});
test('owned identity mismatch rejects before any page command',async()=>{const page=pageDouble();page.spaceId=51;const{result}=await run(page);assert.notEqual(result.code,0);assert.deepEqual(page.calls,[]);});
test('multiple loaders are not merged into a valid window',async()=>{const{result}=await run(pageDouble({multiple:true}));assert.notEqual(result.code,0);});
test('control loss preserves unavailable dimension and incomplete report, not pass',async()=>{const{result}=await run(pageDouble({lost:true}));assert.equal(result.code,0,JSON.stringify(result));assert.equal(result.report.summary.overall,'incomplete');assert(result.observations.console.failures.some(x=>x.class==='UNREACHABLE'));assert.equal(result.observations.perf,undefined);});

test('viewport drift after the initial context is rejected instead of relabeled with old identity',async()=>{const page=pageDouble(),original=page.evaluate.bind(page);let reads=0;page.evaluate=async(...args)=>{const rows=await original(...args);if(++reads>1){rows[0].facts.viewport.width=1280;rows[0].viewport_observed.width=1280;}return rows;};const{result}=await run(page);assert.notEqual(result.code,0,'later 1280 sample cannot remain a 1440 report');assert(result.errors.some(error=>error.code==='E_COLLECT_IDENTITY_MISMATCH'));});

test('owned SDK validation uses the existing validator independently of a non-Node process executable',async()=>{const original=process.execPath;try{process.execPath='/private/tmp/c09-not-a-node-executable';const{result}=await run(pageDouble());assert.equal(result.code,0,JSON.stringify(result));}finally{process.execPath=original;}});

test('Ego run name uses the current TaskHandle task_id and a fresh UUID',async()=>{
  const taskId='workflowhub-ui-frontend-c09-dual-path-verification-20261103';
  const first=egoTaskSpaceName(taskId,'11111111-1111-4111-8111-111111111111');
  const second=egoTaskSpaceName(taskId,'22222222-2222-4222-8222-222222222222');
  assert.match(first,new RegExp(`^workflowhub-qa-${taskId}-`));
  assert.notEqual(first,second);
  assert.equal(requireTaskIdFromHost(taskId),taskId);
  for(const invalid of [undefined,'../task','not a TaskHandle ID'])assert.throws(()=>requireTaskIdFromHost(invalid),error=>error.code==='BROWSER_QA_TASK_HANDLE_UNAVAILABLE');
});

test('one Ego QA session creates, runs, then finishes its own TaskSpace exactly once',async()=>{
  const calls=[],facts=[],taskId='workflowhub-c09';
  const result=await runOwnedEgoTaskSpace({taskId,uuid:()=> '33333333-3333-4333-8333-333333333333',
    createSpace:async name=>{calls.push(['create',name]);return{handle:{name,spaceId:731,label:'p1'}};},
    runScenario:async handle=>{calls.push(['run',handle.name]);return'page evidence';},
    finishSpace:async handle=>{calls.push(['finish',handle.name,'keep:[]']);return{resolved:true,receipt:{closed_page_label_p1:true,closed_page_count:1,retained_page_count:0,closed_space:true,preserved_unmanaged_count:0}};},
    report:fact=>facts.push(fact)});
  assert.equal(result.value,'page evidence');
  assert.deepEqual(calls,[['create','workflowhub-qa-workflowhub-c09-33333333-3333-4333-8333-333333333333'],['run','workflowhub-qa-workflowhub-c09-33333333-3333-4333-8333-333333333333'],['finish','workflowhub-qa-workflowhub-c09-33333333-3333-4333-8333-333333333333','keep:[]']]);
  assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'succeeded',cleanup:'finished'});
});

test('Ego create failure and name collision stop before run or finish without retry',async()=>{
  for(const code of ['EGO_WORKSPACE_CREATE_FAILED','EGO_TASK_SPACE_NAME_IN_USE']){
    const calls=[],facts=[];
    await assert.rejects(runOwnedEgoTaskSpace({taskId:'workflowhub-c09',uuid:()=> '44444444-4444-4444-8444-444444444444',
      createSpace:async name=>{calls.push(['create',name]);throw Object.assign(new Error('synthetic create failure'),{code});},
      runScenario:async()=>{calls.push(['run']);},finishSpace:async()=>{calls.push(['finish']);},report:fact=>facts.push(fact)}),error=>error.code===code);
    assert.equal(calls.length,1);assert.equal(calls[0][0],'create');
    assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'failed',run:'not_started',cleanup:'not_attempted'});
  }
});

test('Ego scenario errors and cancellation both finish the created space once',async()=>{
  for(const [code,status] of [['SYNTHETIC_RUN_FAILURE','failed'],['CANCELLED','cancelled']]){
    const calls=[],facts=[],original=Object.assign(new Error('synthetic scenario stop'),{code});
    await assert.rejects(runOwnedEgoTaskSpace({taskId:'workflowhub-c09',uuid:()=> '55555555-5555-4555-8555-555555555555',
      createSpace:async name=>{calls.push(['create',name]);return{name,spaceId:732,label:'p1'};},
      runScenario:async handle=>{calls.push(['run',handle.name]);throw original;},
      finishSpace:async handle=>{calls.push(['finish',handle.name]);return{resolved:true,receipt:{closed_page_label_p1:true,closed_page_count:1,retained_page_count:0,closed_space:true,preserved_unmanaged_count:0}};},report:fact=>facts.push(fact)}),error=>error===original);
    assert.deepEqual(calls.map(call=>call[0]),['create','run','finish']);
    assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:status,cleanup:'finished'});
  }
});

test('Ego cleanup failure is recorded once and keeps the run result incomplete',async()=>{
  const calls=[],facts=[];
  await assert.rejects(runOwnedEgoTaskSpace({taskId:'workflowhub-c09',uuid:()=> '66666666-6666-4666-8666-666666666666',
    createSpace:async name=>({name,spaceId:733,label:'p1'}),runScenario:async()=>{calls.push('run');return'completed';},
    finishSpace:async()=>{calls.push('finish');throw Object.assign(new Error('finish unavailable'),{code:'EGO_WORKSPACE_FINISH_FAILED'});},
    report:fact=>facts.push(fact)}),error=>error.code==='EGO_WORKSPACE_CLEANUP_INCOMPLETE');
  assert.deepEqual(calls,['run','finish']);
  assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'succeeded',cleanup:'incomplete'});
  assert.equal(facts.filter(fact=>fact.event==='ego-workspace-cleanup-incomplete').length,1);
});

test('Ego finish closes this run managed Page while preserving user and unknown tabs',async()=>{
  const tabs=new Map([['p1','managed'],['user-page','user'],['unknown-page','unknown']]);
  const calls=[],facts=[];
  const result=await runOwnedEgoTaskSpace({taskId:'workflowhub-c09',uuid:()=> '88888888-8888-4888-8888-888888888888',
    createSpace:async name=>{calls.push(['taskSpace',name]);return{name,spaceId:734,label:'p1'};},
    runScenario:async handle=>{assert.equal(handle.label,'p1');return'page evidence';},
    finishSpace:async handle=>{
      const keep=[];calls.push(['finish',handle.name,keep]);assert.deepEqual(keep,[]);
      const closed=[...tabs].filter(([,owner])=>owner==='managed').map(([label])=>label);
      for(const label of closed)tabs.delete(label);
      const preservedUnmanagedCount=[...tabs.values()].filter(owner=>owner!=='managed').length;
      return{resolved:true,receipt:{closed_page_label_p1:closed.includes('p1'),closed_page_count:closed.length,retained_page_count:0,closed_space:false,preserved_unmanaged_count:preservedUnmanagedCount}};
    },report:fact=>facts.push(fact)});
  assert.equal(result.lifecycle.cleanup,'finished');
  assert.deepEqual([...tabs],[['user-page','user'],['unknown-page','unknown']]);
  assert.deepEqual(calls.map(call=>call[0]),['taskSpace','finish']);
  assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'succeeded',cleanup:'finished'});
});

test('Ego finish confirmation must be singular and resolved',async()=>{
  const receipt={receipt_keys:['closedManagedLabels','keptManagedLabels'],closed_page_label_p1:true,closed_page_count:1,retained_page_count:0,closed_space:false,preserved_unmanaged_count:2};
  const handle={name:'workflowhub-qa-workflowhub-c09-99999999-9999-4999-8999-999999999999',spaceId:735,label:'p1'};
  const execute=events=>{
    const script=events.map(event=>'console.log('+JSON.stringify(typeof event==='string'?event:JSON.stringify(event))+');').join('');
    return executeEgoFinishCommand([process.execPath,'-e',script],process.env,undefined,handle);
  };
  for(const events of [
    [],
    [{event:'ego-workspace-finished',resolved:true,receipt},{event:'ego-workspace-finished',resolved:true,receipt}],
    ['{not-json'],
    [{event:'ego-workspace-finished',resolved:false,receipt}],
    [{event:'ego-workspace-finished',resolved:true}]
  ])await assert.rejects(execute(events),error=>error.code==='EGO_WORKSPACE_FINISH_CONFIRMATION_UNAVAILABLE');
  assert.deepEqual(await execute([{event:'ego-workspace-finished',resolved:true,receipt}]),{resolved:true,receipt});
});

test('Ego cleanup is incomplete when the finish receipt cannot bind closure to this run p1',async()=>{
  const facts=[],calls=[];
  await assert.rejects(runOwnedEgoTaskSpace({taskId:'workflowhub-c09',uuid:()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    createSpace:async name=>({name,spaceId:736,label:'p1'}),runScenario:async()=>calls.push('run'),
    finishSpace:async()=>{calls.push('finish');return{resolved:true,receipt:{closed_page_label_p1:false,closed_page_count:0,retained_page_count:1,closed_space:false,preserved_unmanaged_count:2}};},
    report:fact=>facts.push(fact)}),error=>error.code==='EGO_WORKSPACE_CLEANUP_INCOMPLETE');
  assert.deepEqual(calls,['run','finish']);
  assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'succeeded',cleanup:'incomplete'});
});

test('Ego created space without a verifiable owned handle is never finished',async()=>{
  const calls=[],facts=[];
  await assert.rejects(runOwnedEgoTaskSpace({taskId:'workflowhub-c09',uuid:()=> '77777777-7777-4777-8777-777777777777',
    createSpace:async name=>({name,spaceId:'733',label:'p1'}),runScenario:async()=>{calls.push('run');},
    finishSpace:async()=>{calls.push('finish');},report:fact=>facts.push(fact)}),error=>error.code==='EGO_WORKSPACE_HANDLE_INVALID');
  assert.deepEqual(calls,[]);
  assert.deepEqual(facts.find(fact=>fact.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'not_started',cleanup:'unavailable'});
});

// T016 harness integration: real shell/gateway/session and original SDK script;
// the SDK PATH omits ego-browser to verify reuse of the gateway-selected helper fact.
import {spawn,spawnSync} from 'node:child_process';
import {writeFile,chmod,rm,readdir,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createTask,openTask} from '../../runtime/task/task-handle.mjs';
import {fileURLToPath} from 'node:url';
const t016Wt=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,'');
const t016Root=process.env.TASK_ROOT?resolve(process.env.TASK_ROOT):null;
if(!t016Root)throw new Error('TASK_ROOT_REQUIRED: pass the authenticated task root through the environment');
const digest=b=>createHash('sha256').update(b).digest('hex');
const t016Harness=t016Root+'/quality/tests/2026-11-06-181-c09-p4-t016-v2.sh';
const t016PreviousHarness=t016Root+'/quality/tests/2026-11-06-168-c09-p4-t016-owned-space-v2.sh';
const t016ObservationHarness=t016Root+'/quality/tests/2026-11-06-186-c09-p4-t016-observe-v2.sh';
const t016Gate=t016Root+'/quality/tests/2026-11-06-170-c09-p4-gate-owned-space-v2-current.sh';
const t016LegacyHarness=t016Root+'/quality/tests/2026-11-06-138-c09-p4-t016-owned-space.sh';
const t016LegacyGate=t016Root+'/quality/tests/2026-11-06-140-c09-p4-gate-owned-space.sh';
const t018aBrowser=process.env.C09_T018A_POSTFINISH_RUNNER?resolve(process.env.C09_T018A_POSTFINISH_RUNNER):t016Root+'/quality/tests/2026-11-07-021-c09-p4-t018a-postfinish-report-append-only.sh';
function sdkPage(){let url='about:blank',width=1440,height=900,loader='initial',pending=[],count=0;return{label:'p1',spaceId:Number(process.env.BROWSER_QA_EGO_SPACE_ID),async goto(value){url=value;},async waitForSelector(){},async screenshot({path}){const fs=await import('node:fs/promises');await fs.writeFile(path,Buffer.from('synthetic screenshot, not visual acceptance'));},async cdp(method,params){if(method==='Emulation.setDeviceMetricsOverride'){width=params.width;height=params.height;}if(method==='Page.getFrameTree')return{frameTree:{frame:{id:'main',loaderId:loader}}};if(method==='Accessibility.getFullAXTree')return{nodes:[]};return{};},async evaluate(){return[{selector:'html',viewport_observed:{width,height},structure:{tag:'HTML',text:'synthetic'},rendered:{styles:{},box:{width,height}},facts:{viewport:{width,height,dpr:1},scroll:{scrollWidth:width,clientWidth:width},navigation:{url,ttfb:1,domContentLoadedEventEnd:2,loadEventEnd:3}}}];},async url(){return url;},async events(){const value=pending;pending=[];return value;},async reload(){count++;loader='l'+count;pending=[{method:'Page.frameNavigated',params:{frame:{id:'main',loaderId:loader}}},{method:'Runtime.executionContextCreated',params:{context:{id:count,auxData:{frameId:'main'}}}},{method:'Network.requestWillBeSent',params:{requestId:String(count),loaderId:loader,frameId:'main',type:'Document',request:{url,method:'GET'}}},{method:'Network.responseReceived',params:{requestId:String(count),loaderId:loader,type:'Document',response:{url,status:200}}},{method:'Page.loadEventFired',params:{timestamp:1}}];}};}
async function t016Fixture(){
 const dir=await realpath(await mkdtemp(join(tmpdir(),'c09-t016-chain-'))),root=join(dir,'Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-dual-path-verification-20261103'),bin=join(dir,'bin'),sdkBin=join(dir,'sdk-bin');
 const manifest={schema_version:'1.0.0',project_name:'workflowhub',task_id:'workflowhub-ui-frontend-c09-dual-path-verification-20261103',target_repo_root:t016Wt,activation_cohort:'post',execution_mode:'per_invocation',record_model:'vnext-single-write',created_at:new Date().toISOString(),issue_ids:[],inputs:{}};await createTask({storageRoot:dir,taskPath:root,manifest});const admitted=openTask(root,{projectName:manifest.project_name,taskId:manifest.task_id});assert.equal(admitted.manifest.record_model,'vnext-single-write');await mkdir(join(root,'quality/evidence/P4'),{recursive:true});await mkdir(bin);await mkdir(sdkBin);await mkdir(join(root,'quality/tests'));const judgments=await readFile(t016Root+'/quality/tests/P4-T016-judgments-v1.json');await writeFile(join(root,'quality/tests/P4-T016-judgments-v2.json'),judgments);assert.equal(digest(judgments),'7ed7b619aa015688b34a235b5b1f10f29c732d920dcce67b3d7602ddc585a1e3','canonical v1 judgment bytes are copied only as a synthetic v2 fixture');
 const priorV1Refs=['T016-page-audit-board-judgments-v1.json','T016-page-audit-workbench-judgments-v1.json','T016-page-audit-board-1280x900-judgments-v1.json','T016-page-audit-workbench-1280x900-judgments-v1.json','T016-board-1440x900-judgments-v1.png','T016-workbench-1440x900-judgments-v1.png','T016-board-1280x900-judgments-v1.png','T016-workbench-1280x900-judgments-v1.png'];
 const protectedV1Outputs=await Promise.all(priorV1Refs.map(async ref=>{const bytes=await readFile(t016Root+'/quality/evidence/P4/'+ref);await writeFile(join(root,'quality/evidence/P4',ref),bytes);return{ref,bytes,sha256:digest(bytes)};}));
 const gateSource=await readFile(t016Gate,'utf8'),currentRunnerBytes=await readFile(t016Harness),previousRunnerBytes=await readFile(t016PreviousHarness),observationRunnerBytes=await readFile(t016ObservationHarness),currentGateBytes=Buffer.from(gateSource),legacyRunnerBytes=await readFile(t016LegacyHarness),legacyGateBytes=await readFile(t016LegacyGate);
 assert.equal(digest(currentRunnerBytes,'sha256'),'a280bb474fe126bf2b53e01fabc3c19f8e6787fd52b99d31641532a62b3d6c95');
 assert.equal(digest(previousRunnerBytes,'sha256'),'5c80c78112a84313c6204d852f89a1ffb327a6b7d31a5db32cb60309b47df5f2');
 const currentRunner=currentRunnerBytes.toString('utf8'),previousRunner=previousRunnerBytes.toString('utf8');assert.equal(currentRunner.split('P4-T016-judgments-v2.json').length-1,1);assert.equal(previousRunner.split('P4-T016-judgments-v1.json').length-1,1);assert.equal(currentRunner.replace('P4-T016-judgments-v2.json','P4-T016-judgments-v1.json'),previousRunner,'181 differs from 168 only at its judgments input path');
 const observationRunner=observationRunnerBytes.toString('utf8');assert.equal(digest(observationRunnerBytes),'f38393256ea40a54c0ed0a4369e3a4ca3b6f50ef0dcd6d836ae0be8c3a35f88b');assert(!observationRunner.includes('--judgments'));assert(!observationRunner.includes('P4-T016-judgments-v2.json'));assert(observationRunner.includes("'T016-observation-v2-'+view+sizeSuffix+'.json'"));assert(observationRunner.includes("'T016-observation-'+view+'-'+size+'-observation-v2.png'"));assert(!observationRunner.includes("'T016-page-audit-"),'observation output avoids the formal T016 report namespace');
 assert.equal(digest(currentGateBytes,'sha256'),'ac84b914984c02fdb13564402a71166bcfdce2d1a9b300e88e1cdc5916c0d2a9');
 assert.equal(digest(legacyRunnerBytes,'sha256'),'ba5232435ab337921ea8e965f99afd2b4d48cdf83025e70fa502ad9cd061967b');
 assert.equal(digest(legacyGateBytes,'sha256'),'7d08d2c09de00e61c4e4a6a4718b2d779857a1d15fe52bf7d762043211788ead');
 assert(gateSource.includes('bash "$TASK_ROOT/quality/tests/2026-11-06-168-c09-p4-t016-owned-space-v2.sh" all'),'gate uses exact TaskRoot-relative runner command');
 assert(!gateSource.includes('$TASK_ROOT//Users/'));
 const original=await readFile(t016Harness,'utf8'),substitutions=[[t016Root,root],['/private/tmp/c09-p4-t016-owned-qa',join(dir,'gateway')],['/private/tmp/c09-p4-',dir+'/shot-']];let copy=original;
 assert.match(original,/const env=\{PATH:process\.env\.PATH,HOME:process\.env\.HOME/);assert(original.includes('BROWSER_QA_EGO_HELPER_PATH')&&original.includes('probe:selectedEngineProbe'),'formal T016 reuses the gateway-selected helper fact');assert(original.includes('BROWSER_QA_TASK_ID')&&original.includes('task.identity.taskId'),'T016 passes TaskHandle identity through the host adapter');assert(!original.includes('C09_T016_REQUESTED_SPACE_ID')&&!/export BROWSER_QA_EGO_KEEP_OPEN=/.test(original),'T016 does not retain or resume a TaskSpace');
 for(const[index,[from,to]]of substitutions.entries()){assert.equal(copy.split(from).length-1,[2,1,1][index],'fixed output-root substitution count');copy=copy.split(from).join(to);}let restored=copy;for(const[from,to]of [...substitutions].reverse())restored=restored.split(to).join(from);assert.equal(restored,original,'only output-root substitutions differ');
 const observationOriginal=observationRunnerBytes.toString('utf8'),observationSubstitutions=[[t016Root,root],['/private/tmp/c09-p4-t016-owned-qa',join(dir,'gateway')],['/private/tmp/c09-p4-',dir+'/shot-']];let observationCopy=observationOriginal;for(const[index,[from,to]]of observationSubstitutions.entries()){assert.equal(observationCopy.split(from).length-1,[2,1,1][index],'observation output-root substitution count');observationCopy=observationCopy.split(from).join(to);}let observationRestored=observationCopy;for(const[from,to]of [...observationSubstitutions].reverse())observationRestored=observationRestored.split(to).join(from);assert.equal(observationRestored,observationOriginal,'observation runner changes only its output roots for the fixture');
 console.log(JSON.stringify({t016_isolation:'output-root substitutions only; selected helper fact is not replaced',original_sha256:digest(original),copy_sha256:digest(copy),judgments_sha256:digest(judgments),substitutions,formal_root:t016Root,temporary_root:root,gate_sha256:digest(currentGateBytes),legacy_script_hashes:{runner:digest(legacyRunnerBytes),gate:digest(legacyGateBytes)},protected_v1_outputs:protectedV1Outputs.map(({ref,sha256})=>({ref,sha256}))}));const script=join(root,'quality/tests/P4-T016-page-audit.sh');await writeFile(script,copy);const observationScript=join(root,'quality/tests/P4-T016-observation-page-audit.sh');await writeFile(observationScript,observationCopy);
 const log=join(dir,'native.jsonl');await writeFile(log,'');
 const ps=`#!${process.execPath}\nconst{spawnSync}=require('node:child_process'),fs=require('node:fs');const a=process.argv.slice(2);fs.appendFileSync(process.env.T016_LOG,JSON.stringify({kind:'ps',args:a,pid:process.pid,path:process.env.PATH})+'\\n');if(a.join(' ')==='-ww -axo comm='){if(process.env.T016_RUNNING!=='0')console.log('/synthetic/ego lite.app/Contents/MacOS/ego lite');}else{const r=spawnSync('/bin/ps',a,{encoding:'utf8'});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exitCode=r.status??1;}\n`;
 await writeFile(join(bin,'ps'),ps);await chmod(join(bin,'ps'),0o700);await writeFile(join(sdkBin,'ps'),ps);await chmod(join(sdkBin,'ps'),0o700);
 const sdk=`#!${process.execPath}\nconst fs=require('node:fs'),fsp=require('node:fs/promises');const log=x=>fs.appendFileSync(process.env.T016_LOG,JSON.stringify(x)+'\\n');const script=process.argv[4];if(process.argv[2]!=='nodejs'||process.argv[3]!=='-e')throw Error('UNEXPECTED_SDK_ARGV');log({kind:'sdk-script',pid:process.pid,script,helper_path:process.argv[1]});const formal=${JSON.stringify(t016Root)};const check=p=>{if(typeof p==='string'&&(p===formal||p.startsWith(formal+'/')))throw Error('FORMAL_ROOT_WRITE_REJECTED');};for(const name of ['writeFile','appendFile','mkdir','rename','unlink','rm','open']){const fn=fsp[name];fsp[name]=(...args)=>{check(args[0]);if(name==='rename')check(args[1]);return fn(...args);};}for(const name of ['writeFileSync','appendFileSync','mkdirSync','renameSync','unlinkSync','rmSync','openSync']){const fn=fs[name];fs[name]=(...args)=>{if(name!=='openSync'||args[1]!=='r')check(args[0]);if(name==='renameSync')check(args[1]);return fn(...args);};}require('node:module').syncBuiltinESMExports();const page=(${sdkPage.toString()})();const taskSpace=async id=>{log({kind:'taskSpace',id,pid:process.pid});if(process.env.T016_FAIL==='scenario'&&script.startsWith('const input='))throw Error('SYNTHETIC_SCENARIO_FAILURE');if(process.env.T016_FAIL==='cancel'&&script.startsWith('const input=')){log({kind:'cancel-ready',pid:process.pid});await new Promise(()=>setInterval(()=>{},1000));}const created=typeof id==='string',spaceId=created?Number(process.env.T016_CREATED_SPACE_ID||731):(process.env.T016_MISMATCH==='1'?id+1:id);page.spaceId=spaceId;const lifecycle=method=>()=>{log({kind:'lifecycle',method,id:spaceId});throw Error('LIFECYCLE_FORBIDDEN');};const finish=async()=>{log({kind:'lifecycle',method:'finish',id:spaceId});if(script.includes('task.finish({keep:[]})'))return{spaceId,closedSpace:true,keptManagedLabels:[],closedManagedLabels:['p1'],preservedUnmanagedCount:0};throw Error('LIFECYCLE_FORBIDDEN');};return{spaceId,name:process.env.T016_MISMATCH==='1'&&script.startsWith('const input=')?'different-taskspace':id,ownership:'owned',page(label){if(label!=='p1')throw Error('LABEL');return page;},create:lifecycle('create'),resume:lifecycle('resume'),claim:lifecycle('claim'),finish,close:lifecycle('close')};};for(const name of ['create','resume','claim','finish','close'])globalThis[name]=()=>{log({kind:'lifecycle',method:name});throw Error('LIFECYCLE_FORBIDDEN');};if(script.startsWith('const input=')&&process.env.T016_SDK_PATH)process.env.PATH=process.env.T016_SDK_PATH;new (Object.getPrototypeOf(async function(){}).constructor)('taskSpace',script)(taskSpace).catch(e=>{console.error(e.stack);process.exitCode=1;});\n`;
 await writeFile(join(bin,'ego-browser'),sdk);await chmod(join(bin,'ego-browser'),0o700);
 const refs=['T016-page-audit-board.json','T016-page-audit-workbench.json','T016-page-audit-board-1280x900.json','T016-page-audit-workbench-1280x900.json','T016-board-1440x900.png','T016-workbench-1440x900.png','T016-board-1280x900.png','T016-workbench-1280x900.png','T016-page-audit-board-judgments-v2.json','T016-page-audit-workbench-judgments-v2.json','T016-page-audit-board-1280x900-judgments-v2.json','T016-page-audit-workbench-1280x900-judgments-v2.json','T016-board-1440x900-judgments-v2.png','T016-workbench-1440x900-judgments-v2.png','T016-board-1280x900-judgments-v2.png','T016-workbench-1280x900-judgments-v2.png','T016-observation-v2-board.json','T016-observation-v2-workbench.json','T016-observation-v2-board-1280x900.json','T016-observation-v2-workbench-1280x900.json','T016-observation-board-1440x900-observation-v2.png','T016-observation-workbench-1440x900-observation-v2.png','T016-observation-board-1280x900-observation-v2.png','T016-observation-workbench-1280x900-observation-v2.png'];
 const before=await Promise.all(refs.map(async f=>{try{return digest(await readFile(t016Root+'/quality/evidence/P4/'+f));}catch(e){if(e.code==='ENOENT')return null;throw e;}}));
 return{dir,root,bin,sdkBin,script,observationScript,log,original,observationOriginal,gateSource,protectedV1Outputs,taskId:admitted.identity.taskId,async rows(){return(await readFile(log,'utf8')).trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));},async verify(){assert.equal(await readFile(t016Harness,'utf8'),original);assert((await readFile(t016PreviousHarness)).equals(previousRunnerBytes),'168 remains unchanged');assert((await readFile(t016ObservationHarness)).equals(observationRunnerBytes),'186 remains unchanged');assert.equal(await readFile(t016Gate,'utf8'),gateSource);for(let i=0;i<refs.length;i++){let now;try{now=digest(await readFile(t016Root+'/quality/evidence/P4/'+refs[i]));}catch(e){if(e.code!=='ENOENT')throw e;now=null;}assert.equal(now,before[i],'formal output unchanged '+refs[i]);}for(const item of protectedV1Outputs){const formal=await readFile(t016Root+'/quality/evidence/P4/'+item.ref),temporary=await readFile(join(root,'quality/evidence/P4',item.ref));assert(formal.equals(item.bytes),'formal v1 original unchanged '+item.ref);assert(temporary.equals(item.bytes),'fixture v1 original unchanged '+item.ref);assert.equal(digest(formal),item.sha256,'v1 original hash '+item.ref);}},async clean(){await this.verify();await rm(dir,{recursive:true,force:true});}};
}
function identity(pid){const r=spawnSync('/bin/ps',['-p',String(pid),'-o','pid=,ppid=,pgid=,lstart='],{encoding:'utf8'});return r.status===0?r.stdout.trim():null;}
function ownedIdentity(pid){const row=identity(pid);assert(row,'owned process must be live');const fields=row.split(/\s+/);assert.equal(Number(fields[0]),pid);assert.equal(Number(fields[1]),process.pid,'PPID must be the test owner');assert.equal(Number(fields[2]),pid,'detached process must lead its own PGID');assert(Number.isFinite(Date.parse(fields.slice(3).join(' '))),'real process start required');return row;}
function signalOwnedGroup(pid,expected,signal){const fresh=ownedIdentity(pid);assert.equal(fresh,expected,'PID/PPID/PGID/start rechecked before group signal');process.kill(-Number(fresh.split(/\s+/)[2]),signal);}
async function assertSelectedHelperReuse(f,rows,expectedSdkRuns,expectedProcessProbes){const helperPath=await realpath(join(f.bin,'ego-browser')),sdkRuns=rows.filter(x=>x.kind==='sdk-script'),processProbes=rows.filter(x=>x.kind==='ps'&&x.args.join(' ')==='-ww -axo comm=');assert.equal(sdkRuns.length,expectedSdkRuns);assert(sdkRuns.every(x=>x.helper_path===helperPath),'create, scenario, and finish use the same absolute helper');const scenario=sdkRuns.find(x=>x.script.startsWith('const input=')),create=sdkRuns.find(x=>x.script.includes('WHQA_OWNED_HANDLE=')),finish=sdkRuns.find(x=>x.script.includes('task.finish({keep:[]})'));assert(scenario&&create&&finish,'one create, scenario, and finish SDK call are present');const prefix=scenario.script.slice('const input='.length),end=prefix.indexOf(';\n');assert(end>0,'gateway fact is serialized at the T016 scenario boundary');assert.equal(JSON.parse(prefix.slice(0,end)).egoHelperPath,helperPath,'T016 receives the gateway-resolved helper');assert.equal(processProbes.length,expectedProcessProbes,'only the outer gateway checks Ego process state');assert(processProbes.every(x=>!x.path.startsWith(f.sdkBin)),'SDK child PATH without ego-browser is not re-probed');}
async function runHarness(f,overrides={},cancel=false,sentinel=null,mode='all',script=f.script){const local={...process.env,PATH:f.bin+':'+process.env.PATH,T016_LOG:f.log,T016_SDK_PATH:f.sdkBin,BROWSER_QA_ENGINE:'ego-lite',C09_AUDIT_CHANGE:undefined,...overrides};for(const[k,v]of Object.entries(local))if(v===undefined)delete local[k];const child=spawn('/bin/bash',[script,mode],{cwd:t016Wt,env:local,detached:true,stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);let timer;const done=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('TEST_CHILD_TIMEOUT')),20000);child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal,out,err}));});const owned=await new Promise((resolve,reject)=>{child.once('spawn',()=>{try{resolve(ownedIdentity(child.pid));}catch(error){reject(error);}});child.once('error',reject);});if(sentinel){const guard=ownedIdentity(sentinel.pid);assert.equal(guard,sentinel.start);assert.notEqual(Number(guard.split(/\s+/)[2]),Number(owned.split(/\s+/)[2]),'sentinel must be in a different process group');}try{if(cancel){for(let i=0;i<200;i++){if((await f.rows()).some(r=>r.kind==='cancel-ready'))break;await new Promise(r=>setTimeout(r,20));}assert((await f.rows()).some(r=>r.kind==='cancel-ready'),'cancel reached original SDK scenario');const current=ownedIdentity(child.pid);assert.equal(current,owned,'cancel owner identity unchanged');process.kill(child.pid,'SIGTERM');}return await done;}finally{clearTimeout(timer);if(identity(child.pid)!==null)signalOwnedGroup(child.pid,owned,'SIGKILL');}}
test('T016 rejects legacy Space reuse options and explicit non-Ego engines',async()=>{const f=await t016Fixture();try{for(const options of [{BROWSER_QA_EGO_SPACE_ID:'731'},{BROWSER_QA_EGO_KEEP_OPEN:'1'}]){const r=await runHarness(f,options);assert.equal(r.code,2,r.err);assert.match(r.err,/EGO_TASKSPACE_REUSE_OPTIONS_UNSUPPORTED/);assert.deepEqual(await f.rows(),[]);}for(const engine of ['agent-browser','browser-use','auto','unknown']){const r=await runHarness(f,{BROWSER_QA_ENGINE:engine});assert.equal(r.code,2,r.err);assert.deepEqual(await f.rows(),[]);}}finally{await f.clean();}});
test('T016 all mode creates one unique TaskSpace, runs all four audits, and finishes it',async()=>{const f=await t016Fixture();try{const r=await runHarness(f,{T016_CREATED_SPACE_ID:'731'});const rows=await f.rows();assert.equal(r.code,0,r.out+r.err+JSON.stringify(rows));const spaces=rows.filter(x=>x.kind==='taskSpace'),events=r.out.split('\n').map(row=>{try{return JSON.parse(row);}catch{return null;}}).filter(Boolean);assert.equal(spaces.length,3);assert.match(spaces[0].id,new RegExp(`^workflowhub-qa-${f.taskId}-[0-9a-f-]{36}$`));assert.deepEqual(spaces.map(x=>x.id),[spaces[0].id,spaces[0].id,spaces[0].id]);await assertSelectedHelperReuse(f,rows,3,2);assert.deepEqual(rows.filter(x=>x.kind==='lifecycle').map(x=>[x.method,x.id]),[['finish',731]]);assert.deepEqual(events.find(x=>x.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'succeeded',cleanup:'finished'});assert(!r.out.includes(spaces[0].id),'TaskSpace name is not printed');assert(!/\"spaceId\"\s*:\s*\d+/.test(r.out),'numeric handle is not printed');for(const fName of ['T016-page-audit-board-judgments-v2.json','T016-page-audit-workbench-judgments-v2.json','T016-page-audit-board-1280x900-judgments-v2.json','T016-page-audit-workbench-1280x900-judgments-v2.json']){const report=JSON.parse(await readFile(join(f.root,'quality/evidence/P4',fName),'utf8'));assert.equal(report.summary.overall,'incomplete');assert.equal(report.criteria.length,8);assert(report.criteria.every(c=>c.state==='未测'),fName);assert(report.criteria.every(c=>typeof c.untested_reason==='string'&&c.untested_reason.trim()),fName);assert(report.criteria.every(c=>Array.isArray(c.cited_norms)&&c.cited_norms.length>0),fName);assert(report.criteria.every(c=>!Array.isArray(c.norms_missing)||c.norms_missing.length===0),fName);}for(const fName of ['T016-board-1440x900-judgments-v2.png','T016-workbench-1440x900-judgments-v2.png','T016-board-1280x900-judgments-v2.png','T016-workbench-1280x900-judgments-v2.png'])assert.equal((await readFile(join(f.root,'quality/evidence/P4',fName))).toString(),'synthetic screenshot, not visual acceptance',fName);}finally{await f.clean();}});
test('T016 observation successor writes fixed separate reports and screenshots without judgments and stays incomplete',async()=>{const f=await t016Fixture();try{const r=await runHarness(f,{T016_CREATED_SPACE_ID:'741'},false,null,'all',f.observationScript),rows=await f.rows();assert.equal(r.code,0,r.out+r.err+JSON.stringify(rows));await assertSelectedHelperReuse(f,rows,3,2);for(const fName of ['T016-observation-v2-board.json','T016-observation-v2-workbench.json','T016-observation-v2-board-1280x900.json','T016-observation-v2-workbench-1280x900.json']){const report=JSON.parse(await readFile(join(f.root,'quality/evidence/P4',fName),'utf8'));assert.equal(report.summary.overall,'incomplete',fName);assert.equal(report.criteria.length,8,fName);assert(report.criteria.every(c=>c.state==='未测'&&typeof c.untested_reason==='string'&&c.untested_reason.trim()),fName);}for(const fName of ['T016-observation-board-1440x900-observation-v2.png','T016-observation-workbench-1440x900-observation-v2.png','T016-observation-board-1280x900-observation-v2.png','T016-observation-workbench-1280x900-observation-v2.png'])assert.equal((await readFile(join(f.root,'quality/evidence/P4',fName))).toString(),'synthetic screenshot, not visual acceptance',fName);await f.verify();}finally{await f.clean();}});
test('T016 separate all and rerun sessions create different TaskSpaces and finish each',async()=>{const f=await t016Fixture();try{const first=await runHarness(f,{T016_CREATED_SPACE_ID:'731'});assert.equal(first.code,0,first.out+first.err);const firstRows=await f.rows();await writeFile(f.log,'');const second=await runHarness(f,{T016_CREATED_SPACE_ID:'732',C09_AUDIT_CASES:'["board-1440x900"]'},false,null,'rerun');assert.equal(second.code,0,second.out+second.err);const secondRows=await f.rows();await assertSelectedHelperReuse(f,firstRows,3,2);await assertSelectedHelperReuse(f,secondRows,3,2);const firstName=firstRows.find(x=>x.kind==='taskSpace'&&typeof x.id==='string').id,secondName=secondRows.find(x=>x.kind==='taskSpace'&&typeof x.id==='string').id;assert.match(firstName,new RegExp(`^workflowhub-qa-${f.taskId}-[0-9a-f-]{36}$`));assert.match(secondName,new RegExp(`^workflowhub-qa-${f.taskId}-[0-9a-f-]{36}$`));assert.notEqual(firstName,secondName);assert.deepEqual(firstRows.filter(x=>x.kind==='lifecycle').map(x=>x.id),[731]);assert.deepEqual(secondRows.filter(x=>x.kind==='lifecycle').map(x=>x.id),[732]);assert(!second.out.includes(secondName));assert(!/"spaceId"\s*:\s*\d+/.test(second.out),'numeric Space handle is not printed');}finally{await f.clean();}});
test('T016 rejects an unsafe new handle before the scenario and records cleanup unavailable',async()=>{const f=await t016Fixture();try{const r=await runHarness(f,{T016_CREATED_SPACE_ID:'9007199254740992'});assert.notEqual(r.code,0);assert.match(r.err,/EGO_WORKSPACE_HANDLE_INVALID/);const rows=await f.rows(),events=r.out.split('\n').map(row=>{try{return JSON.parse(row);}catch{return null;}}).filter(Boolean);assert.equal(rows.filter(x=>x.kind==='sdk-script').length,1);assert.equal(rows.filter(x=>x.kind==='lifecycle').length,0);assert.deepEqual(events.find(x=>x.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'not_started',cleanup:'unavailable'});}finally{await f.clean();}});
test('T016 stopped Ego creates no space; a mismatched returned handle never reaches finish',async()=>{for(const option of [{T016_RUNNING:'0'},{T016_MISMATCH:'1'}]){const f=await t016Fixture();try{const r=await runHarness(f,option);assert.notEqual(r.code,0);const rows=await f.rows(),events=r.out.split('\n').map(row=>{try{return JSON.parse(row);}catch{return null;}}).filter(Boolean);if(option.T016_RUNNING){assert.match(r.err,/EGO_NOT_RUNNING/);assert.equal(rows.filter(x=>x.kind==='sdk-script').length,0);assert.equal(rows.filter(x=>x.kind==='taskSpace').length,0);}else{assert.match(r.err,/SCENARIO_FAILED/);assert.equal(rows.filter(x=>x.kind==='sdk-script').length,3);assert.deepEqual(rows.filter(x=>x.kind==='lifecycle').map(x=>x.method),['finish']);assert.deepEqual(events.find(x=>x.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:'failed',cleanup:'finished'});}}finally{await f.clean();}}});
test('T016 scenario failure and cancellation finish only the created TaskSpace and preserve an unrelated process',async()=>{for(const mode of ['scenario','cancel']){const f=await t016Fixture();const sentinel=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'});const own=ownedIdentity(sentinel.pid);try{const r=await runHarness(f,{T016_FAIL:mode},mode==='cancel',{pid:sentinel.pid,start:own});assert.notEqual(r.code,0);assert.equal(ownedIdentity(sentinel.pid),own,'independent live sentinel survives cancellation with unchanged identity');const rows=await f.rows(),events=r.out.split('\n').map(row=>{try{return JSON.parse(row);}catch{return null;}}).filter(Boolean);assert.deepEqual(rows.filter(x=>x.kind==='lifecycle').map(x=>[x.method,x.id]),[['finish',731]]);assert.deepEqual(events.find(x=>x.event==='ego-workspace-lifecycle'),{event:'ego-workspace-lifecycle',create:'created',run:mode==='cancel'?'cancelled':'failed',cleanup:'finished'});if(mode==='cancel'){const ps=rows.filter(x=>x.kind==='ps');assert(ps.some(x=>x.args.includes('pid=,ppid=,pgid=,lstart=,stat=')),'real process identity query delegated');for(const row of rows.filter(x=>x.kind==='cancel-ready'))assert.equal(identity(row.pid),null,'scenario SDK child reclaimed');}}finally{const closed=new Promise(resolve=>sentinel.once('close',resolve));if(identity(sentinel.pid)!==null)signalOwnedGroup(sentinel.pid,own,'SIGTERM');if(sentinel.exitCode===null&&sentinel.signalCode===null)await closed;await f.clean();}}});


test('T018A routes the gateway-selected helper and keeps browser events separate', async () => {
  const source = await readFile(t018aBrowser, 'utf8');
  for (const required of [
    "const path = await import('node:path');",
    'const task=openTask(taskRoot,{projectName:manifest.project_name,taskId:manifest.task_id});',
    'export BROWSER_QA_TASK_ID',
    'const egoHelperPath=process.env.BROWSER_QA_EGO_HELPER_PATH;',
    "if(typeof egoHelperPath!=='string'||!path.isAbsolute(egoHelperPath))throw Error('EGO_HELPER_UNAVAILABLE');",
    "const selectedEngineFact=Object.freeze({appInstallation:'present',helperPath:egoHelperPath,running:true});",
    "const selectedEngineProbe=async selectedEnvironment=>{if(selectedEnvironment.BROWSER_QA_ENGINE!=='ego-lite'||selectedEnvironment.BROWSER_QA_EGO_HELPER_PATH!==egoHelperPath)throw Error('T018A_EGO_HELPER_SELECTION_MISMATCH');return selectedEngineFact;};",
    'BROWSER_QA_EGO_HELPER_PATH:egoHelperPath',
    'probe:selectedEngineProbe',
    'T018A-browser-events-2026-11-06-001.jsonl'
  ]) assert(source.includes(required), required);
  assert(source.includes('EGO_TASKSPACE_REUSE_OPTIONS_UNSUPPORTED'), 'legacy Space inputs fail fast');
  assert(!source.includes('T018A_EGO_TASKSPACE_ID_REQUIRED')&&!source.includes('supply a user-selected existing TaskSpace ID'), 'the caller must not ask for a Space ID');
  const keepOpenGuard=source.indexOf('BROWSER_QA_EGO_KEEP_OPEN'),ownedCreate=source.indexOf('const owned = await taskSpace(taskSpaceName)');assert(keepOpenGuard>=0&&keepOpenGuard<ownedCreate,'legacy keep-open input is rejected before TaskSpace access');
  assert(!source.includes('T018A-events.jsonl'), 'browser runner must not reuse the API/SQLite event file');

  assert(source.includes('const taskId=process.env.BROWSER_QA_TASK_ID;'), 'scenario uses the host-validated TaskHandle task id');
  assert(source.includes('const owned = await taskSpace(taskSpaceName);')&&source.includes("const page = owned.page('p1');"), 'scenario reopens this run-owned Agent space by its gateway name and uses its existing p1');
  assert(source.includes('BROWSER_QA_EGO_SPACE_ID:String(spaceId)'), 'numeric space id is derived from the returned handle only for private page identity validation');
  const scenarioStart=source.indexOf('const taskId=process.env.BROWSER_QA_TASK_ID;');
  const scenarioEnd=source.indexOf('const boardLive =',scenarioStart);
  assert(scenarioStart>=0&&scenarioEnd>scenarioStart,'scenario handle lookup source boundaries exist');
  const taskId='workflowhub-ui-frontend-c09-dual-path-verification-20261103';
  const createdName='workflowhub-qa-'+taskId+'-11111111-1111-4111-8111-111111111111';
  const gatewayPage={label:'p1'};
  const gatewayOwned={name:createdName,spaceId:731,page(label){assert.equal(label,'p1');return gatewayPage;}};
  const ownedByName=new Map([[createdName,gatewayOwned]]),lookups=[];
  const acquisition='(async()=>{const taskSpaceName=process.env.BROWSER_QA_EGO_TASKSPACE_NAME;'
    +'const session=process.env.BROWSER_QA_SESSION;const egoHelperPath=process.env.BROWSER_QA_EGO_HELPER_PATH;'
    +source.slice(scenarioStart,scenarioEnd)
    +'return {taskId,spaceId,page,owned};})()';
  const acquired=await runInNewContext(acquisition,{process:{env:{BROWSER_QA_EGO_TASKSPACE_NAME:createdName,BROWSER_QA_TASK_ID:taskId,BROWSER_QA_SESSION:'fake-session',BROWSER_QA_EGO_HELPER_PATH:'/fake/ego-browser'}},taskSpace:async name=>{lookups.push(name);return ownedByName.get(name);}});
  assert.deepEqual(lookups,[createdName],'T018A resolves only the Agent-owned Space created by this run');
  assert.equal(acquired.owned,gatewayOwned,'scenario uses the same Agent-owned handle returned to the gateway name');
  assert.equal(acquired.page,gatewayPage,'scenario keeps the gateway-owned p1 Page');
  assert.equal(acquired.spaceId,731,'numeric id comes from that same handle');
  const captureAt=source.indexOf('const capture=await task.captureCommand(');
  const finishAt=source.indexOf('const finishValid=Boolean(');
  const finishBranchAt=source.indexOf('if(finishValid){',finishAt);
  const artifactWriteAt=source.indexOf('artifacts.push(await writeOriginalPreserving',finishBranchAt);
  const reportAppendAt=source.indexOf("slug:'t018a-browser-2026-11-07-name-bridge'",finishBranchAt);
  assert(captureAt>=0&&finishAt>captureAt&&finishBranchAt>finishAt&&artifactWriteAt>finishBranchAt&&reportAppendAt>artifactWriteAt,'TaskRoot artifact and append-only report writes wait for capture return and a verified finish receipt');
  assert(source.includes("await task.appendRecord({dir:'quality/evidence/P4',slug,ext,bytes:original})")&&source.includes('await task.writeRecordAtomic(ref,bytes)'), 'existing output bytes are preserved before atomic TaskHandle writeback');
  const reportStart=source.indexOf('const reportLines=['),reportEnd=source.indexOf('\n  ];',reportStart);
  assert(reportStart>=0&&reportEnd>reportStart,'post-finish browser report exists');
  assert.doesNotMatch(source.slice(reportStart,reportEnd),/spaceId|workflowhub-qa-/i,'current report omits TaskSpace name and numeric id');
  const shell = spawnSync('/bin/bash', ['-n', t018aBrowser], {encoding:'utf8'});
  assert.equal(shell.status, 0, shell.stderr || shell.stdout);

  const marker = "sdk=\"$(cat <<'SDK'\n";
  const sdkStart = source.indexOf(marker);
  assert.notEqual(sdkStart, -1, 'embedded SDK source exists');
  const bodyStart = sdkStart + marker.length;
  const bodyEnd = source.indexOf('\nSDK\n)\"', bodyStart);
  assert(bodyEnd > bodyStart, 'embedded SDK source terminator exists');
  const javascript = spawnSync(process.execPath, ['--check', '--input-type=module', '-'], {
    input: source.slice(bodyStart, bodyEnd),
    encoding:'utf8'
  });
  assert.equal(javascript.status, 0, javascript.stderr || javascript.stdout);
  const writerMarker = "node --input-type=module - \"$WT\" \"$TASK_ROOT\" \"$RUN_TMP\" <<'NODE'\n";
  const writerStart=source.lastIndexOf(writerMarker);
  assert(writerStart>=0,'post-finish TaskHandle writer exists');
  const writerBodyStart=writerStart+writerMarker.length;
  const writerEnd=source.indexOf('\nNODE\n',writerBodyStart);
  assert(writerEnd>writerBodyStart,'post-finish writer heredoc terminates');
  const writerSyntax=spawnSync(process.execPath,['--check','--input-type=module','-'],{input:source.slice(writerBodyStart,writerEnd),encoding:'utf8'});
  assert.equal(writerSyntax.status,0,writerSyntax.stderr||writerSyntax.stdout);
});


test('T018A preserves POST events and stops before screenshots or the second route', async () => {
  const source = await readFile(t018aBrowser, 'utf8');
  const extract = (startMarker, endMarker) => {
    const start = source.indexOf(startMarker);
    assert.notEqual(start, -1, 'missing source function: ' + startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert(end > start, 'missing source boundary: ' + endMarker);
    return source.slice(start, end);
  };
  const functions = [
    extract('function safeLocation(value) {', 'function recordEvents(label, events) {'),
    extract('function recordEvents(label, events) {', 'function recordAuditNetwork(observations) {'),
    extract('function eventBytes() {', 'async function persistEventRows() {'),
    extract('async function persistEventRows() {', 'async function rejectNonReadOnlyRequest(label) {'),
    extract('async function rejectNonReadOnlyRequest(label) {', 'async function capture(route,label) {'),
    extract('async function capture(route,label) {', 'async function captureReadOnlyRoutes() {'),
    extract('async function captureReadOnlyRoutes() {', 'const currentUrl = await page.url();')
  ].join('\n');

  const boardLive = 'http://127.0.0.1:3100/simulation-board?source=live';
  const workbenchLive = 'http://127.0.0.1:3100/sim-workbench?source=live';
  const exercise = async method => {
    const visited = [];
    const screenshots = [];
    const writes = [];
    const page = {
      async goto(route) { visited.push(route); },
      async waitForSelector() {},
      async events() {
        return [{method:'Network.requestWillBeSent',params:{request:{
          method, url:'http://127.0.0.1:18844/api/v2/simulation-cards?fixture=hidden'
        }}}];
      },
      async screenshot({path}) { screenshots.push(path); }
    };
    const context = {
      Buffer, URL, boardLive, workbenchLive,
      RUN_TMP:'/private/tmp/c09-t018a-readonly-contract',
      p4:'quality/evidence/P4/',
      eventRows:[],
      eventRowsPersisted:false,
      page,
      fs:{readFileSync:()=>Buffer.from('synthetic screenshot'),writeFileSync(path,bytes){writes.push({ref:path.split('/').pop(),bytes:Buffer.from(bytes)});}}
    };
    const outcome = await runInNewContext(
      functions + '\n(async()=>{try{return {status:"completed",value:await captureReadOnlyRoutes()};}'
        + 'catch(error){return {status:"stopped",message:error.message};}})()',
      context
    );
    return {outcome,visited,screenshots,writes};
  };

  for (const method of ['POST', undefined]) {
    const result = await exercise(method);
    assert.equal(result.outcome.status, 'stopped');
    assert.match(result.outcome.message, /^T018A_NON_READ_ONLY_REQUEST board-live$/);
    assert.deepEqual(result.visited, [boardLive], 'first route must stop before opening workbench');
    assert.deepEqual(result.screenshots, [], 'first route must stop before any screenshot');
    assert.equal(result.writes.length, 1, 'observed failure events are staged once before finish');
    assert.equal(result.writes[0].ref, 'T018A-browser-events-2026-11-06-001.jsonl');
    const events = result.writes[0].bytes.toString('utf8');
    assert.match(events, /"method":"(?:POST|unknown)"/);
    assert.match(events, /\/api\/v2\/simulation-cards/);
    assert.doesNotMatch(events, /fixture=hidden/);
  }

  for (const method of ['GET','HEAD','OPTIONS']) {
    const result = await exercise(method);
    assert.equal(result.outcome.status, 'completed', method);
    assert.deepEqual(result.visited, [boardLive,workbenchLive], method);
    assert.equal(result.screenshots.length, 2, method);
    assert.equal(result.writes.length, 0, method);
  }
});

test('T018A owned TaskSpace name transfers to embedded Nodejs and missing name remains fail-closed', async () => {
  const runner = await readFile(t018aBrowser, 'utf8');
  const marker = "sdk=\"$(cat <<'SDK'\n";
  const sdkStart = runner.indexOf(marker);
  assert.notEqual(sdkStart, -1, 'T018A embedded SDK source exists');
  const bodyStart = sdkStart + marker.length;
  const bodyEnd = runner.indexOf('\nSDK\n)\"', bodyStart);
  assert(bodyEnd > bodyStart, 'T018A embedded SDK source terminates');
  const sdk = runner.slice(bodyStart, bodyEnd);
  const guardStart = sdk.indexOf('const taskSpaceName=process.env.BROWSER_QA_EGO_TASKSPACE_NAME;');
  const guardEnd = sdk.indexOf('const session = process.env.BROWSER_QA_SESSION;', guardStart);
  assert(guardStart >= 0 && guardEnd > guardStart, 'the existing gateway-owned-name guard remains in the runner');
  const guardedPageAccess = sdk.slice(guardStart, guardEnd)
    + "const owned=await taskSpace(taskSpaceName);const page=owned.page('p1');globalThis.pageAccessCount++;return {taskSpaceName,page};";
  const taskId = 'workflowhub-ui-frontend-c09-dual-path-verification-20261103';
  const gatewayName = `workflowhub-qa-${taskId}-\";globalThis.nameInjection=true;//\\tail`;
  const bind = browserQaSession.bindEgoTaskSpaceNameToNodejsScript;
  const bindForRun = typeof bind === 'function' ? bind : source => source;
  const fakeNodejs = async source => {
    const lookups = [];
    const context = {
      process: {env: {}},
      pageAccessCount: 0,
      taskSpace: async name => {
        lookups.push(name);
        return {page: label => {assert.equal(label, 'p1');return {label};}};
      }
    };
    try {
      const value = await runInNewContext(`(async()=>{${source}})()`, context);
      return {value,lookups,pageAccessCount:context.pageAccessCount,injected:context.nameInjection};
    } catch (error) {
      return {error,lookups,pageAccessCount:context.pageAccessCount,injected:context.nameInjection};
    }
  };

  const transferred = await fakeNodejs(bindForRun(guardedPageAccess, gatewayName));
  assert.equal(transferred.error, undefined, transferred.error?.message);
  assert.equal(transferred.value.taskSpaceName, gatewayName);
  assert.deepEqual(transferred.lookups, [gatewayName], 'fake Nodejs receives the exact gateway-owned name');
  assert.equal(transferred.pageAccessCount, 1, 'the owned name reaches the expected p1 only after the guard');
  assert.equal(transferred.injected, undefined, 'the JSON-escaped name is data, not executable code');

  const missing = await fakeNodejs(bindForRun(guardedPageAccess, undefined));
  assert.equal(missing.error?.message, 'GATEWAY_OWNED_EGO_TASKSPACE_REQUIRED');
  assert.deepEqual(missing.lookups, [], 'missing ownership never reaches taskSpace');
  assert.equal(missing.pageAccessCount, 0, 'missing ownership rejects before page access');
  assert.match(runner, /bindEgoTaskSpaceNameToNodejsScript\(source,process\.env\.BROWSER_QA_EGO_TASKSPACE_NAME\)/, 'the active runner binds only the gateway-injected name');
  assert.match(runner, /ego-browser nodejs -e "\$bridged_sdk"/, 'the bound source reaches the documented Nodejs -e entry');
});

test('T018A post-finish report uses immutable append-only versions across retries', async () => {
  const source = await readFile(t018aBrowser, 'utf8');
  const phasePath = join(t016Wt, 'specs/archive/workflowhub-ui-frontend-c09-dual-path-verification-20261103/phases/P4-新侧流程贯通.md');
  const phase = await readFile(phasePath, 'utf8');
  const eventsRow = phase.split(/\r?\n/).find(line => line.includes('T018A-browser-events-2026-11-06-001.jsonl'));
  assert(eventsRow, 'P4 still identifies the T018A browser events artifact');
  const consumer = eventsRow.split('|')[4]?.trim();
  assert.match(consumer, /gate capture output.*T018A-postfinish-writeback\.artifacts\[\]\.ref/, 'current consumer resolves the report from this run’s captured artifacts ref');
  assert.match(consumer, /T018A-browser\.md.*只读保留/, 'the fixed historical report is not the active consumer target');

  const reportStart = source.indexOf('  const reportLines=[');
  const artifactLine = '  artifacts.push({ref:reportRef,sha256:digest(report),bytes:report.length});';
  const reportEnd = source.indexOf(artifactLine, reportStart);
  const summaryStart = source.indexOf("process.stdout.write(JSON.stringify({event:'T018A-postfinish-writeback'", reportEnd);
  const summaryEnd = source.indexOf('));', summaryStart) + 3;
  assert(reportStart >= 0 && reportEnd > reportStart, 'post-finish report writer source exists');
  assert(summaryStart > reportEnd && summaryEnd > summaryStart, 'runner exposes the writeback artifact ref in its capture output');
  const writerSource = source.slice(reportStart, reportEnd + artifactLine.length);
  const summarySource = source.slice(summaryStart, summaryEnd);
  const storageRoot = await mkdtemp(join(tmpdir(), 'c09-t018a-report-retry-'));
  try {
    const task = await createTask({
      storageRoot,
      manifest: {
        schema_version: '1.0.0',
        project_name: 'workflowhub',
        task_id: 'c09-t018a-report-retry-test',
        created_at: new Date().toISOString(),
        target_repo_root: resolve('.'),
        activation_cohort: 'post',
        record_model: 'vnext-single-write',
        execution_mode: 'per_invocation',
        issue_ids: [],
        inputs: {}
      }
    });
    const digest = bytes => createHash('sha256').update(bytes).digest('hex');
    const rel = path => relative(task.taskPath, path).split(sep).join('/');
    const legacyRef = 'quality/evidence/P4/T018A-browser.md';
    const legacyBytes = await readFile(join(t016Root, legacyRef));
    assert.equal(digest(legacyBytes), '1a02847a945a0c5d0f5994b260c1888bb67e6257699629e7cde4e0c20ca3cbf4', 'the real fixed report remains the original historical bytes');
    await task.createRecord(legacyRef, legacyBytes);

    const runAttempt = async exitCode => {
      const artifacts = [];
      const capture = {
        exit_code: exitCode,
        receipt_ref: join(task.taskPath, 'quality/tests/c09-t018a-receipt.json'),
        output_ref: join(task.taskPath, 'quality/tests/c09-t018a-output.txt')
      };
      const output = {text: ''};
      await runInNewContext(
        '(async()=>{if(finishValid){' + writerSource + '}' + summarySource + ';return output.text;})()',
        {
          Buffer, task, capture, artifacts, rel, digest, finishValid: true, output,
          process: {stdout: {write(value) {output.text += value;}}},
          scenario: {
            routes: ['/simulation-board?source=live'],
            viewport: '1440x900',
            performance: 'not_measured; synthetic contract',
            report_overall: 'incomplete'
          }
        }
      );
      return JSON.parse(output.text);
    };
    const reportFromCapture = summary => {
      assert.equal(summary.event, 'T018A-postfinish-writeback');
      const reportRef = summary.artifacts.find(item => item.ref.endsWith('t018a-browser-2026-11-07-name-bridge.md'))?.ref;
      assert(reportRef, 'the current captured runner output contains its append-only report ref');
      assert.notEqual(reportRef, legacyRef, 'the legacy fixed report is never treated as current');
      return {ref: reportRef, bytes: task.readRecordBytes(reportRef)};
    };

    const first = await runAttempt(17);
    assert.equal(first.gateway_exit_code, 17);
    assert.equal(first.finish_receipt_valid, true);
    const firstCurrent = reportFromCapture(first);
    const firstBytes = firstCurrent.bytes;
    const firstReport = firstBytes.toString('utf8');
    assert.match(firstReport, /scenario failed; see captured output/);
    assert.match(firstReport, /Owned Page cleanup：finished; gateway receipt confirms p1 closed and 0 managed Pages retained/);
    assert.match(firstReport, /TaskSpace record deletion：unavailable/);
    assert.equal(task.readRecordBytes(legacyRef).equals(legacyBytes), true, 'the fixed historical report stays byte-identical');

    const second = await runAttempt(0);
    assert.equal(second.gateway_exit_code, 0);
    assert.equal(second.finish_receipt_valid, true);
    const secondCurrent = reportFromCapture(second);
    assert.notEqual(secondCurrent.ref, firstCurrent.ref);
    assert.equal(task.readRecordBytes(firstCurrent.ref).equals(firstBytes), true, 'the earlier failed report keeps identical bytes');
    assert.equal(secondCurrent.bytes.toString('utf8').includes('- Gateway exit：0'), true);
    for (const report of [firstReport, secondCurrent.bytes.toString('utf8')]) {
      assert.match(report, /Owned Page cleanup：finished; gateway receipt confirms p1 closed and 0 managed Pages retained/);
      assert.match(report, /TaskSpace record deletion：unavailable/);
    }
    assert.equal(task.readRecordBytes(legacyRef).equals(legacyBytes), true, 'the legacy fixed report still is not overwritten after retry');
  } finally {
    await rm(storageRoot, {recursive: true, force: true});
  }
});
