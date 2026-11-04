import {resolve,dirname,relative,join,sep} from 'node:path';
import {readFile,writeFile,mkdir,mkdtemp,access,unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {collectPerf,collect as normalizePerf} from './collect-perf.mjs';
import {collect as normalizeOverflow} from './collect-overflow.mjs';
import {collect as normalizeA11y} from './collect-a11y.mjs';
import {ownedEgoContext,collectOwnedEgoNavigation,observeOwnedEgoReload} from './collect-console.mjs';
import {checkNormConsumption,applyNormFacts} from './check-norm-consumption.mjs';
import {collectErrors} from './check-page-audit.mjs';
import {connectCdp,validateEndpoint} from '../../isolated-browser-qa/scripts/browser-qa-tickets.mjs';
import {fileURLToPath} from 'node:url';
import {selectBrowserEngine} from '../../isolated-browser-qa/scripts/browser-qa-session.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const identityFlags={'--workspace':'workspace','--service':'service','--route':'route','--object-version':'object_version','--engine-session':'engine_session'};
const required=['--cdp-url','--state','--viewport','--out'];
const optional=['--engine','--collector-root','--judgments'];
const text=v=>typeof v==='string'&&v.trim().length>0;
const fault=(code,path,message,exitCode=1)=>Object.assign(new Error(message),{code,path,exitCode});
export function readIdentity(argv,{egoPage}={}){
  const values={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];if(![...required,...optional,...Object.keys(identityFlags)].includes(key)||values[key]!==undefined||argv[i+1]===undefined||argv[i+1].startsWith('--'))throw fault('E_USAGE',key,'Unknown, duplicate or missing command argument');
    values[key]=argv[++i];
  }
  for(const key of required)if(!(egoPage&&key==='--cdp-url')&&!text(values[key]))throw fault('E_USAGE',key,'Required audit argument missing');
  if(!/^[1-9]\d*x[1-9]\d*$/.test(values['--viewport']))throw fault('E_USAGE','--viewport','Expected positive WxH');
  if(egoPage&&values['--cdp-url'])throw fault('E_USAGE','--cdp-url','Owned SDK page and raw endpoint cannot be mixed');
  if(!egoPage)try{
    const u=new URL(values['--cdp-url']);
    if(u.protocol==='ws:')validateEndpoint(u.href,'receiver');
    else if(u.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||!u.port||u.pathname!=='/json/version'||u.search||u.hash||u.username||u.password)throw Error('Discovery must be a local /json/version endpoint');
  }catch(error){throw fault('E_USAGE','--cdp-url',error.code??error.message);}
  for(const key of Object.keys(identityFlags))if(!text(values[key]))throw fault('E_IDENTITY_INCOMPLETE',key,'Identity declaration missing; supply '+key,2);
  return values;
}
export async function lockEngine(values,env,{probe}={}){
  const local={...env};if(values['--engine']!==undefined)local.BROWSER_QA_ENGINE=values['--engine'];
  try{return await selectBrowserEngine(local,{probe});}catch(error){error.exitCode=2;throw error;}
}
export async function runPageAudit(argv,{env=process.env,cwd=process.cwd(),probe,runTask,windowTimeoutMs,egoPage}={}){
  try{
    const values=readIdentity(argv,{egoPage}),selection=await lockEngine(values,env,{probe});
    return await collectAudit(values,selection,{env,cwd,runTask,windowTimeoutMs,egoPage});
  }catch(error){return {code:error.exitCode??1,ok:false,outcome:'unavailable',errors:(error.errors??[{code:error.code??'E_AUDIT_TOOL_ERROR',path:error.path??'$',message:error.message}]).map(e=>({...e,message:e.message+(error.originals?'; originals: '+error.originals:'')})),...(error.observations?{observations:error.observations}:{})};}
}
const dimensions=['console','network','overflow','perf','a11y'];
const bone=['业务任务','IA 导航','交互状态','内容数据','视觉规范','响应式布局','无障碍','真实代码交接'];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const exists=path=>access(path).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const routeMatches=(url,route)=>{try{const parsed=new URL(url);return /^https?:\/\//.test(route)?parsed.href===new URL(route).href:parsed.pathname+parsed.search+parsed.hash===route;}catch{return false;}};
function launch(script,config,env,cwd){
  if(!existsSync(script))throw fault('E_COLLECT_NOT_STARTED',script,'Collector script is missing',2);
  const child=spawn(process.execPath,[script,'--cdp-url',config.endpoint,'--out',config.out,'--viewport',config.viewport,'--state',config.state],{cwd,env,stdio:['ignore','pipe','pipe']});
  const job={child,done:false,stdout:'',stderr:''};
  child.stdout.on('data',b=>job.stdout+=b);child.stderr.on('data',b=>job.stderr+=b);
  const timer=setTimeout(()=>child.kill('SIGTERM'),40000);timer.unref();
  job.result=new Promise(resolve=>{child.on('error',error=>{job.error=error;});child.on('close',(code,signal)=>{clearTimeout(timer);job.done=true;resolve({code,signal});});});return job;
}
function documentFailure(doc,dimension){
  const errors=[];
  for(const f of doc.failures){
    const code={NOT_STARTED:'E_COLLECT_NOT_STARTED',TOOL_ERROR:'E_COLLECT_TOOL_ERROR',IDENTITY_MISMATCH:'E_COLLECT_IDENTITY_MISMATCH'}[f.class];
    if(code)errors.push({code,path:dimension,message:f.detail+(f.class==='IDENTITY_MISMATCH'?'; compare declared and observed identity in the collector original; reacquire matching endpoint/identity through the QA gateway before retry':'')});
  }
  if(errors.length)throw Object.assign(fault(errors[0].code,dimension,errors[0].message,2),{errors});
}
async function readDocument(job,path,dimension){
  const status=await job.result;
  if(job.stderr)await writeFile(path+'.stderr.txt',job.stderr,{flag:'wx'});
  if(job.error)throw fault('E_COLLECT_NOT_STARTED',dimension,job.error.message,2);
  let doc;try{doc=JSON.parse(job.stdout);}catch{if(!await exists(path)||await readFile(path,'utf8')!==job.stdout)await writeFile(path+'.stdout.txt',job.stdout,{flag:'wx'});throw fault('E_COLLECT_PROTOCOL',dimension,'Collector output is not one JSON document; '+job.stderr);}
  if(!await exists(path))await writeFile(path+'.stdout.txt',job.stdout,{flag:'wx'});
  if(!doc||!dimensions.includes(dimension)||!['engine','observed_at','object','items','failures'].every(k=>Object.hasOwn(doc,k))||!doc.object||!Array.isArray(doc.items)||!Array.isArray(doc.failures)||doc.failures.some(f=>!['NOT_STARTED','UNREACHABLE','TOOL_ERROR','IDENTITY_MISMATCH'].includes(f?.class)))throw fault('E_COLLECT_PROTOCOL',dimension,'Collector document violates the existing five-key/four-class protocol; '+job.stderr);
  if(status.code!==0)throw fault('E_COLLECT_TOOL_ERROR',dimension,'Collector execution failed: '+job.stderr,2);
  const bytes=await readFile(path);if(bytes.toString().trim()!==job.stdout.trim())throw fault('E_COLLECT_PROTOCOL',dimension,'Collector stdout and original file differ');
  return doc;
}
export async function runNavigationWindow({endpoint,route,config,env,cwd,dir,collectorRoot,timeoutMs=5000,observations,paths}){
  let cdp,disconnected=false,collectorLost=false,windowReady=false,loaded=false,loaderId;const jobs={};
  try{
    try{cdp=await connectCdp(endpoint);}catch(error){throw fault('E_COLLECT_NOT_STARTED','--cdp-url',error.code??error.message,2);}
    cdp.onDisconnect(()=>{disconnected=true;});
    const targets=(await cdp.call('Target.getTargets')).targetInfos;
    if(!Array.isArray(targets))throw fault('E_COLLECT_PROTOCOL','Target.getTargets','Target list missing');
    const matches=targets.filter(t=>t.type==='page'&&routeMatches(t.url,route));
    if(matches.length!==1)throw fault('E_COLLECT_NOT_STARTED','--route','Expected exactly one page target for declared route',2);
    const targetId=matches[0].targetId,{sessionId}=await cdp.call('Target.attachToTarget',{targetId,flatten:true});
    if(!sessionId)throw fault('E_COLLECT_TOOL_ERROR','Target.attachToTarget','Session unavailable',2);
    cdp.onEvent(e=>{if(e.sessionId!==sessionId)return;if(e.method==='Page.loadEventFired')loaded=true;if(e.method==='Page.frameNavigated'&&!e.params.frame.parentId){if(loaderId&&loaderId!==e.params.frame.loaderId)loaderId='multiple';else loaderId=e.params.frame.loaderId;}});
    await cdp.call('Page.enable',{},sessionId);
    const windowId=randomUUID(),local={...env,PAGE_AUDIT_WINDOW_DIR:dir,PAGE_AUDIT_TARGET_ID:targetId,PAGE_AUDIT_WINDOW_ID:windowId,PAGE_AUDIT_WINDOW_TIMEOUT_MS:String(timeoutMs+1000)};
    for(const dim of ['console','network'])jobs[dim]=launch(join(collectorRoot,'collect-'+dim+'.mjs'),{...config,out:paths[dim]},local,cwd);
    const deadline=Date.now()+timeoutMs;
    while(!await exists(join(dir,'console.ready'))||!await exists(join(dir,'network.ready'))){
      for(const [dim,job]of Object.entries(jobs))if(job.done){observations[dim]=await readDocument(job,paths[dim],dim);documentFailure(observations[dim],dim);if(observations[dim].failures.some(f=>f.class==='UNREACHABLE')){collectorLost=true;throw Object.assign(new Error('CDP_CONNECTION_CLOSED'),{code:'CDP_CONNECTION_CLOSED'});}throw fault('E_COLLECT_NOT_STARTED',dim,'Collector ended before window ready',2);}
      if(disconnected)throw Object.assign(new Error('CDP_CONNECTION_CLOSED'),{code:'CDP_CONNECTION_CLOSED'});
      if(Date.now()>deadline)throw fault('E_COLLECT_NOT_STARTED','window','Both collectors did not become ready; no navigation issued',2);await delay(10);
    }
    windowReady=true;
    await cdp.call('Page.reload',{},sessionId);
    while(!loaded){if(disconnected)break;if(Date.now()>deadline)throw fault('E_COLLECT_TOOL_ERROR','window','Window load/finish timed out',2);await delay(10);}
    if(!disconnected)await delay(500);
    await writeFile(join(dir,'finish'),'finish',{flag:'wx'});
    let finishTimer;
    try{await Promise.race([Promise.all(Object.values(jobs).map(j=>j.result)),new Promise((_,reject)=>{finishTimer=setTimeout(()=>reject(fault('E_COLLECT_TOOL_ERROR','window','Collector finish timed out',2)),timeoutMs);})]);}
    finally{clearTimeout(finishTimer);}
    for(const dim of ['console','network']){observations[dim]=await readDocument(jobs[dim],paths[dim],dim);documentFailure(observations[dim],dim);}
    if(!Object.values(observations).some(d=>d.failures.some(f=>f.class==='UNREACHABLE'))){
      if(!loaderId||loaderId==='multiple')throw fault('E_COLLECT_IDENTITY_MISMATCH','window','Expected one observed main-frame loader',2);
      for(const dim of ['console','network'])for(const item of observations[dim].items)if(item.window_id!==windowId||item.loader_id!==loaderId)throw fault('E_COLLECT_IDENTITY_MISMATCH',dim,'Window/loader differs from the navigation original',2);
    }
  }catch(error){
    if((!disconnected&&!collectorLost)||error.exitCode!==undefined)throw error;
    const stopped=new Set();
    if(!windowReady){for(const [dim,job]of Object.entries(jobs))if(!job.done){stopped.add(dim);job.child.kill('SIGTERM');}}
    else await writeFile(join(dir,'finish'),'finish',{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
    let timer;
    try{await Promise.race([Promise.all(Object.values(jobs).map(j=>j.result)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(fault('E_COLLECT_TOOL_ERROR','window','Collector did not settle after disconnect',2)),timeoutMs);})]);}
    finally{clearTimeout(timer);}
    for(const [dim,job]of Object.entries(jobs)){
      if(observations[dim])continue;
      const status=await job.result;
      if(stopped.has(dim)&&status.signal==='SIGTERM'){
        if(job.stdout&&(!await exists(paths[dim])||await readFile(paths[dim],'utf8')!==job.stdout))await writeFile(paths[dim]+'.stdout.txt',job.stdout,{flag:'wx'});
        if(job.stderr)await writeFile(paths[dim]+'.stderr.txt',job.stderr,{flag:'wx'});
        continue;
      }
      observations[dim]=await readDocument(job,paths[dim],dim);documentFailure(observations[dim],dim);
    }
    return {unreachable:true,code:error.code??'CDP_CONNECTION_CLOSED'};
  }finally{
    for(const job of Object.values(jobs))if(!job.done)job.child.kill('SIGTERM');
    await Promise.all(Object.values(jobs).map(j=>j.result));cdp?.close();
    for(const file of ['console.ready','network.ready','finish'])await unlink(join(dir,file)).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
}
function matchingDimensions(criterion){
  const d=criterion.dimension;
  if(/perf|performance|运行性能|交互/.test(d))return ['perf'];
  if(/layout|overflow|响应式|typography|colors|spacing|shadows|borders|radius|icons|视觉/.test(d))return ['overflow'];
  if(/a11y|无障碍/.test(d))return ['a11y'];
  if(/console/.test(d))return ['console'];if(/network/.test(d))return ['network'];return [];
}
export function mergeJudgments(criteria,observations,refs,{interrupted=false}={}){
  return criteria.map(original=>{
    const c=structuredClone(original),selected=matchingDimensions(c),docs=selected.map(d=>observations[d]);
    const currentRefs=selected.filter(d=>observations[d]?.items.length).map(d=>refs[d]),callerRefs=c.evidence??[];
    const unverified=callerRefs.filter(e=>!currentRefs.some(r=>r?.ref===e?.ref&&r?.sha256===e?.sha256));
    c.evidence=[...callerRefs,...currentRefs];
    const hasObservation=docs.some(d=>d?.items.length);
    const unreachable=interrupted||docs.some(d=>d?.failures.some(f=>f.class==='UNREACHABLE'));
    const navDeclared=/导航|navigation|ttfb|domContentLoadedEventEnd|loadEventEnd/i.test(c.dimension)||(/perf|performance|运行性能/i.test(c.dimension)&&!/交互|interaction/i.test(c.dimension));
    const unknownNav=navDeclared&&selected.includes('perf')&&observations.perf?.items.some(item=>Object.values(item.perf?.nav??{}).some(value=>value.median==='unknown'));
    const interactionDeclared=/交互|interaction/i.test(c.dimension)||(/perf|performance|运行性能/i.test(c.dimension)&&!/导航|navigation|ttfb|domContentLoadedEventEnd|loadEventEnd/i.test(c.dimension));
    const unknownInteraction=interactionDeclared&&selected.length===1&&selected[0]==='perf'&&observations.perf?.items.some(item=>item.perf?.interaction.status==='unknown');
    if(c.state!=='失败'&&(unreachable||unknownNav||unknownInteraction)){c.state='未测';c.untested_reason=unreachable?'采集失联：保留已观察，后续采集未执行；提供者为采集执行者，恢复同一对象后重跑':[unknownNav?'导航性能未测：三次观测存在缺失；由采集执行者恢复同一对象后补齐并重跑':null,unknownInteraction?'交互未测：未提供任务动作或实际耗时缺失；由页面任务作者提供可等待真实终态的闭包并补观测后重跑':null].filter(Boolean).join('；');}
    if(original.state==='通过'&&unverified.length){
      c.state='未测';c.untested_reason=[c.untested_reason,!hasObservation?'本项无对应采集观察':null,'外部证据的对象绑定与判据覆盖未核实；外部证据未采用为当前对象通过依据；由调用方及原独立执行者（独立页面验收者）核实当前对象、业务终态与判据覆盖，补证后恢复，不能用其它维观测替代'].filter(Boolean).join('；');
    }
    if(c.state==='通过'&&!hasObservation)throw fault('E_PASS_WITHOUT_OBSERVATION',c.id,'A pass has no observation',2);
    return c;
  });
}
async function collectAudit(values,selection,{env,cwd,runTask,windowTimeoutMs=5000,egoPage}){
  if(egoPage&&(!['ego-lite','ego'].includes(selection.engine)||runTask!==undefined))throw fault('E_USAGE','owned-page','Owned Ego page requires Ego engine; task-performance actions remain on their existing route',2);
  const out=resolve(cwd,values['--out']);
  const input=values['--judgments']?JSON.parse(await readFile(resolve(cwd,values['--judgments']),'utf8')):{criteria:bone.map((dimension,i)=>({id:'dimension-'+(i+1),dimension,state:'未测',evidence:[],untested_reason:'未提供判定文件；由页面执行者提供判定与来源后重跑'})),norm_candidates:[]};
  if(!Array.isArray(input.criteria)||!input.criteria.length)throw fault('E_USAGE','--judgments','Judgment input must have criteria[]');
  const originalErrors=collectErrors(input).filter(e=>['E_STATE_OUT_OF_ENUM','E_TOTAL_SCORE'].includes(e.code)||(input.coverage_limits!==undefined&&e.code==='E_REPORT_SHAPE'&&e.path.startsWith('$.coverage_limits'))||(e.code==='E_REPORT_SHAPE'&&/^\$\.criteria\[\d+\]\.evidence$/.test(e.path)));
  if(originalErrors.length){const e=fault('E_REPORT_REJECTED','--judgments','Original judgment violates frozen shape rules',2);e.errors=originalErrors;throw e;}
  for(const [i,c]of input.criteria.entries())if(Array.isArray(c?.evidence))for(const [j,e]of c.evidence.entries())if(!text(e?.ref)||typeof e.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(e.sha256))throw fault('E_MISSING_EVIDENCE',`$.criteria[${i}].evidence[${j}]`,'Formal producer requires ref and sha256; original byte/object verification remains with the evidence consumer',2);
  if(await exists(out))throw fault('E_OUTPUT_EXISTS','--out','Report original already exists; choose a new report path');
  const marker=sep+'quality'+sep+'evidence'+sep,at=out.lastIndexOf(marker);
  if(at<0)throw fault('E_USAGE','--out','Formal report must be inside quality/evidence');
  const evidenceRoot=out.slice(0,at),collectorRoot=values['--collector-root']?resolve(cwd,values['--collector-root']):here;
  let endpoint=values['--cdp-url'];
  if(!egoPage&&endpoint.startsWith('http:')){
    let response;try{response=await fetch(endpoint,{redirect:'error',headers:{Connection:'close'},signal:AbortSignal.timeout(3000)});}catch(error){throw fault('E_COLLECT_NOT_STARTED','--cdp-url',error.message,2);}
    if(!response.ok)throw fault('E_COLLECT_TOOL_ERROR','--cdp-url','Discovery HTTP '+response.status,2);endpoint=(await response.json()).webSocketDebuggerUrl;
  }
  if(!egoPage)try{endpoint=validateEndpoint(endpoint,'receiver');}catch(error){throw fault('E_USAGE','--cdp-url',error.code??error.message);}
  await mkdir(dirname(out),{recursive:true});const dir=await mkdtemp(join(dirname(out),'p5-audit-'));
  const paths=Object.fromEntries(dimensions.map(d=>[d,join(dir,d+'.json')])),observations={};
  const local={...env,BROWSER_QA_ENGINE:selection.engine,...Object.fromEntries(Object.entries(identityFlags).map(([flag,key])=>['PAGE_AUDIT_'+key.toUpperCase(),values[flag]]))};
  for(const key of ['PAGE_AUDIT_WINDOW_DIR','PAGE_AUDIT_TARGET_ID','PAGE_AUDIT_WINDOW_ID','PAGE_AUDIT_WINDOW_TIMEOUT_MS'])delete local[key];
  const config={endpoint,viewport:values['--viewport'],state:values['--state']};
  let owned;
  if(egoPage)try{owned=await ownedEgoContext(egoPage,config,local);}catch(error){throw fault(error.kind==='IDENTITY_MISMATCH'?'E_COLLECT_IDENTITY_MISMATCH':'E_COLLECT_NOT_STARTED','owned-page',error.message,2);}
  try{
    let windowResult;
    if(owned){
      windowResult=await collectOwnedEgoNavigation(owned,windowTimeoutMs);
      for(const dim of ['console','network']){observations[dim]=windowResult[dim];await writeFile(paths[dim],JSON.stringify(observations[dim])+'\n',{flag:'wx'});documentFailure(observations[dim],dim);}
    }else windowResult=await runNavigationWindow({endpoint,route:values['--route'],config,env:local,cwd,dir,collectorRoot,timeoutMs:windowTimeoutMs,observations,paths});
    let interrupted=Boolean(windowResult?.unreachable)||Object.values(observations).some(doc=>doc.failures.some(f=>f.class==='UNREACHABLE'));
    for(const dim of ['overflow','perf','a11y']){
      if(interrupted)break;
      if(owned){
        const doc={engine:'ego',observed_at:new Date().toISOString(),object:{...owned.object},items:[],failures:[]};observations[dim]=doc;
        try{
          if(dim==='overflow')doc.items.push(normalizeOverflow((await owned.read()).facts.scroll));
          else if(dim==='a11y'){await owned.read();await owned.call('Accessibility.enable');const nodes=normalizeA11y(await owned.call('Accessibility.getFullAXTree'));await owned.read();doc.items.push(...nodes);}
          else {const facts={nav:{ttfb:[],domContentLoadedEventEnd:[],loadEventEnd:[]}};for(let i=0;i<3;i++){const sample=await observeOwnedEgoReload(owned,windowTimeoutMs),nav=sample.observation.facts.navigation;if(!nav||!routeMatches(nav.url,owned.object.route))throw Object.assign(Error('Registered navigation timing identity missing'),{kind:'IDENTITY_MISMATCH'});for(const key of Object.keys(facts.nav))if(typeof nav[key]==='number'&&Number.isFinite(nav[key])&&nav[key]>=0)facts.nav[key].push(nav[key]);}doc.items.push({state:doc.object.state,viewport:doc.object.viewport,perf:normalizePerf(facts)});}
        }catch(error){doc.failures.push({class:error.kind||'TOOL_ERROR',detail:error.message});}
        await writeFile(paths[dim],JSON.stringify(doc)+'\n',{flag:'wx'});
      }else if(dim==='perf'){observations.perf=await collectPerf(config,local,runTask);await writeFile(paths.perf,JSON.stringify(observations.perf)+'\n',{flag:'wx'});}
      else observations[dim]=await readDocument(launch(join(collectorRoot,'collect-'+dim+'.mjs'),{...config,out:paths[dim]},local,cwd),paths[dim],dim);
      documentFailure(observations[dim],dim);
      interrupted=observations[dim].failures.some(f=>f.class==='UNREACHABLE');
    }
    for(const [dim,doc]of Object.entries(observations))for(const [flag,key]of Object.entries(identityFlags))if(doc.object[key]!==values[flag])throw fault('E_COLLECT_IDENTITY_MISMATCH',key,'Collector '+dim+' differs from declared '+key+'; inspect '+paths[dim]+' and reacquire matching identity through the QA gateway',2);
    const observedEngine=selection.engine==='ego-lite'?'ego':selection.engine;
    for(const [dim,doc]of Object.entries(observations))if(doc.object.state!==config.state||!doc.object.viewport?.startsWith(config.viewport+'@')||doc.object.engine!==observedEngine)throw fault('E_COLLECT_IDENTITY_MISMATCH',dim,'Observed state, viewport or engine differs; inspect '+paths[dim],2);
    const refs=Object.fromEntries(await Promise.all(Object.keys(observations).map(async d=>[d,{ref:relative(evidenceRoot,paths[d]).split(sep).join('/'),sha256:sha(await readFile(paths[d]))}])));
    let windowEvidence;
    if(windowResult?.unreachable){const path=join(dir,'window-unreachable.json'),bytes=JSON.stringify({class:'UNREACHABLE',code:windowResult.code,detail:'P5 navigation window lost CDP; subsequent collectors were not started'})+'\n';await writeFile(path,bytes,{flag:'wx'});windowEvidence={ref:relative(evidenceRoot,path).split(sep).join('/'),sha256:sha(bytes)};refs.window=windowEvidence;}
    const facts=await checkNormConsumption(input,{cwd}),normPath=join(dir,'norm-facts.json'),normBytes=JSON.stringify(facts)+'\n';
    await writeFile(normPath,normBytes,{flag:'wx'});
    const normEvidence={ref:relative(evidenceRoot,normPath).split(sep).join('/'),sha256:sha(normBytes)};
    const criteria=applyNormFacts(mergeJudgments(input.criteria,observations,refs,{interrupted}),facts).map(c=>({...c,evidence:[...(c.evidence??[]),normEvidence,...(windowEvidence?[windowEvidence]:[])]})),coverage_limits=[...(input.coverage_limits??[])];
    if(interrupted)coverage_limits.push('采集失联：仅保留已观察；后续采集未执行，恢复同一对象后重跑');
    if(criteria.some(c=>c.state==='未测'))coverage_limits.push('存在未测检查项；退出 0 仅表示报告形状合法');
    if(observations.perf?.items.some(i=>Object.values(i.perf?.nav??{}).some(value=>value.median==='unknown')))coverage_limits.push('导航性能未测：三次观测存在缺失，保原始unknown；由采集执行者恢复同一对象后补齐重跑');
    if(observations.perf?.items.some(i=>i.perf?.interaction.status==='unknown'))coverage_limits.push('交互性能未测：未提供动作或实际耗时缺失，不采信页面预置 measure');
    const object={...Object.fromEntries(Object.entries(identityFlags).map(([flag,key])=>[key,values[flag]])),state:config.state,viewport:observations.console?.object.viewport??config.viewport,engine:selection.engine};
    if(selection.fallbacks.length)object.engine_fallback=Object.fromEntries(['from','to','reason','probe'].map(k=>[k,selection.fallbacks[0][k]]));
    const report={object,criteria,coverage_limits,summary:{overall:coverage_limits.length?'incomplete':criteria.some(c=>c.state==='失败')?'fail':'pass'}};
    await writeFile(out,JSON.stringify(report)+'\n',{flag:'wx'});
    // Ego's Node-compatible host is an Electron helper, not a child Node CLI.
    // Use the exact existing validator function on the published bytes; the raw
    // endpoint route retains its original subprocess and command behavior.
    const ownedErrors=egoPage?collectErrors(JSON.parse(await readFile(out,'utf8'))):null;
    const checked=egoPage?{code:ownedErrors.length?2:0,stdout:JSON.stringify({errors:ownedErrors}),stderr:''}:await launchChecker(out,cwd);
    if(checked.code!==0){if(!egoPage)await unlink(out);if(checked.code===2){const e=fault('E_REPORT_REJECTED','$','Shape validator rejected report',2);e.errors=JSON.parse(checked.stdout).errors;throw e;}throw fault('E_AUDIT_TOOL_ERROR','$','Shape validator failed: '+checked.stderr);}
    return {code:0,report,observations,evidence_refs:refs};
  }catch(error){error.observations=observations;error.originals=dir;throw error;}
}
function launchChecker(out,cwd){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[join(here,'check-page-audit.mjs'),'--input',out],{cwd,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));});}
export async function runCli(argv=process.argv.slice(2),options={}){
  const result=await runPageAudit(argv,options);const output=options.output??process.stdout,stderr=options.stderr??process.stderr;
  if(result.code===0)output.write(JSON.stringify(result.report)+'\n');else {output.write(JSON.stringify({ok:false,outcome:result.outcome,errors:result.errors})+'\n');if(result.code===1)stderr.write(result.errors.map(e=>e.message).join('\n')+'\n');}
  return result.code;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=await runCli();
