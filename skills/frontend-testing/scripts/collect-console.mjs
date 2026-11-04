import {readFile,writeFile,open,link,lstat,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runRegisteredScript} from '../../isolated-browser-qa/scripts/browser-qa-session.mjs';
import {connectCdp,validateEndpoint} from '../../isolated-browser-qa/scripts/browser-qa-tickets.mjs';

// The five portable collectors share this CLI/lifecycle; transport stays in the gateway.
export const failure=(kind,detail)=>({class:kind,detail});
const fail=(kind,detail)=>Object.assign(new Error(detail),{kind});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const identityKeys={workspace:'PAGE_AUDIT_WORKSPACE',service:'PAGE_AUDIT_SERVICE',route:'PAGE_AUDIT_ROUTE',object_version:'PAGE_AUDIT_OBJECT_VERSION',engine_session:'PAGE_AUDIT_ENGINE_SESSION'};
export async function writeAtomic(path,value) {
  const target=resolve(path),temporary=target+'.'+process.pid+'.'+crypto.randomUUID()+'.tmp',bytes=Buffer.from(JSON.stringify(value)+'\n');
  const sameFile=(a,b)=>a.dev===b.dev&&a.ino===b.ino;
  let file,identity,problem;
  try {
    if(!Number.isInteger(constants.O_NOFOLLOW))throw new Error('Evidence output requires O_NOFOLLOW');
    file=await open(temporary,'wx');identity=await file.stat({bigint:true});
    await file.writeFile(bytes);await file.close();file=undefined;
    const ready=await lstat(temporary,{bigint:true});
    if(ready.isSymbolicLink()||!sameFile(ready,identity))throw new Error('Temporary evidence file ownership changed');
    // A hard link atomically creates the target without replacing an original.
    try {await link(temporary,target);}
    catch(publicationError) {
      if(publicationError.code!=='EEXIST')throw publicationError;
      let existing,comparisonError;
      try {
        existing=await open(target,constants.O_RDONLY|constants.O_NOFOLLOW);
        const before=await existing.stat({bigint:true});
        if(!before.isFile())throw publicationError;
        const prior=await existing.readFile(),after=await existing.stat({bigint:true}),named=await lstat(target,{bigint:true});
        if(!prior.equals(bytes)||!sameFile(before,after)||!sameFile(after,named)||named.isSymbolicLink()||before.size!==after.size||before.mtimeNs!==after.mtimeNs)throw publicationError;
      }catch(error){comparisonError=error;}
      finally {try{await existing?.close();}catch(error){comparisonError??=error;}}
      if(comparisonError){if(comparisonError!==publicationError&&comparisonError.cause===undefined)comparisonError.cause=publicationError;throw comparisonError;}
    }
  }catch(error){problem=error;}
  finally {
    try{await file?.close();}catch(error){problem??=error;}
    if(identity)try{
      const named=await lstat(temporary,{bigint:true});
      if(named.isSymbolicLink()||!sameFile(named,identity))throw new Error('Temporary evidence file ownership changed; not removed');
      await unlink(temporary);
    }catch(error){if(error.code!=='ENOENT')problem??=error;}
  }
  if(problem)throw problem;
}
export async function evaluate(call,expression) {
  const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result?.exceptionDetails||!result?.result||!Object.hasOwn(result.result,'value'))throw fail('TOOL_ERROR','Runtime.evaluate did not return an observed value');
  return result.result.value;
}
function parse(argv,env) {
  const config={};
  for(let i=0;i<argv.length;i++){
    const key={'--cdp-url':'endpoint','--out':'out','--viewport':'viewport','--state':'state'}[argv[i]];
    if(!key||config[key]!==undefined||!argv[i+1]||argv[i+1].startsWith('--'))throw Object.assign(new Error('Invalid collector arguments'),{code:'E_ARGUMENT',path:argv[i]});
    config[key]=argv[++i];
  }
  for(const key of ['endpoint','out'])if(!config[key])throw Object.assign(new Error('Required collector argument missing'),{code:'E_ARGUMENT',path:key});
  return validateConfig(config,env);
}
function validateConfig(config,env) {
  for(const [key,name] of Object.entries(identityKeys))if(typeof env[name]!=='string'||!env[name].trim())throw Object.assign(new Error('Identity declaration missing'),{code:'E_IDENTITY_INCOMPLETE',path:key});
  if(config.viewport&&!/^[1-9]\d*x[1-9]\d*$/.test(config.viewport))throw Object.assign(new Error('Invalid viewport'),{code:'E_ARGUMENT',path:'viewport'});
  let url;try {url=new URL(config.endpoint);}catch{throw Object.assign(new Error('Invalid CDP endpoint'),{code:'E_ARGUMENT',path:'cdp-url'});}
  try {
    if(url.protocol==='ws:')validateEndpoint(url.href,'receiver');
    else if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||!url.port||url.pathname!=='/json/version'||url.search||url.hash||url.username||url.password)throw new Error('Invalid endpoint');
  }catch{throw Object.assign(new Error('Invalid CDP endpoint'),{code:'E_ARGUMENT',path:'cdp-url'});}
  const windowKeys=['PAGE_AUDIT_WINDOW_DIR','PAGE_AUDIT_TARGET_ID','PAGE_AUDIT_WINDOW_ID'];
  if(windowKeys.some(k=>env[k])&&!windowKeys.every(k=>typeof env[k]==='string'&&env[k]))throw Object.assign(new Error('Incomplete navigation window'),{code:'E_ARGUMENT',path:'window'});
  if(env.PAGE_AUDIT_WINDOW_TIMEOUT_MS!==undefined&&(!/^\d+$/.test(env.PAGE_AUDIT_WINDOW_TIMEOUT_MS)||Number(env.PAGE_AUDIT_WINDOW_TIMEOUT_MS)<=0))throw Object.assign(new Error('Invalid window timeout'),{code:'E_ARGUMENT',path:'window_timeout'});
  return config;
}
function addFailure(doc,kind,detail){if(!doc.failures.some(f=>f.class===kind&&f.detail===detail))doc.failures.push(failure(kind,detail));}
const routeMatches=(url,route)=>{try{const parsed=new URL(url);return /^https?:\/\//.test(route)?parsed.href===new URL(route).href:parsed.pathname+parsed.search+parsed.hash===route;}catch{return false;}};
const parseUrl=value=>{try{return new URL(value);}catch{return null;}};
const observedRoute=url=>{const parsed=parseUrl(url);return parsed?parsed.pathname+parsed.search+parsed.hash:url;};
// Identity is compared, never echoed. Each coordinate the page can report is
// checked against its declaration before any dimension collects; a coordinate
// with no observation source stays unknown and is never counted as verified.
const unknownReason={
  workspace:'the page reports no filesystem origin for its bytes; the collector cwd is a different fact',
  object_version:'the pinned object hash is derived by the orchestrator from served bytes; the page exposes no version stamp',
  engine_session:'the session name is a gateway-owned pid/profile binding; the browser protocol reports no session id',
  engine:'the declared engine id and the browser product are different namespaces',
  state:'the observed URL carries no state parameter',
  service:'the declared service is not a parseable http(s) origin'};
// A declared service is either a URL (it must name the audited origin) or a human
// label (the page cannot be matched to it). A string with a URL shape that does not
// parse is a broken declaration, not a label, so it is reported instead of ignored.
const serviceShape=value=>typeof value!=='string'?null:/^[a-z][a-z0-9+.-]*:\/\//i.test(value)?'url':/^[a-z0-9.-]+:\d+(\/.*)?$/i.test(value)?'host-port':'label';
export function compareIdentity(declared={},observation={}) {
  const value=path=>declared[path]??null,page=parseUrl(observation.url),
    declaredService=typeof declared.service==='string'?declared.service:'',service=parseUrl(declaredService),
    serviceLooksLikeUrl=['url','host-port'].includes(serviceShape(declaredService)),
    observedState=page?page.searchParams.get('state'):null,
    observedViewport=typeof observation.viewport==='string'&&/^\d+x\d+@[0-9.]+$/.test(observation.viewport)?observation.viewport:null,
    row=(path,observed,matches)=>{const declaredValue=value(path);
      if(declaredValue===null||observed===null)return {path,declared:declaredValue,observed,result:'unknown',reason:unknownReason[path]};
      return {path,declared:declaredValue,observed,result:matches?'match':'mismatch'};};
  const serviceRow=(()=>{
    const declaredValue=value('service');
    if(declaredValue===null||!page)return {path:'service',declared:declaredValue,observed:page?page.origin:null,result:'unknown',reason:unknownReason.service};
    if(!service)return {path:'service',declared:declaredValue,observed:page.origin,result:serviceLooksLikeUrl?'mismatch':'unknown',
      reason:serviceLooksLikeUrl?'declared service has a URL shape but is not a parseable http(s) URL; it cannot name the audited origin':unknownReason.service};
    const opaque=service.origin==='null';
    return {path:'service',declared:declaredValue,observed:page.origin,result:!opaque&&service.origin===page.origin?'match':'mismatch',
      ...(opaque?{reason:'declared service parses as a URI with an opaque origin; it cannot name an http(s) origin'}:{})};
  })();
  const comparisons=[
    row('workspace',null,false),
    serviceRow,
    row('route',page?page.pathname+page.search+page.hash:null,Boolean(page&&routeMatches(observation.url,declared.route))),
    row('object_version',null,false),
    row('engine_session',null,false),
    row('state',observedState,observedState!==null&&String(declared.state)===observedState),
    row('viewport',observedViewport,Boolean(observedViewport&&declared.viewport&&observedViewport.split('@')[0]===declared.viewport.split('@')[0])),
    row('engine',null,false)];
  // The --viewport argument carries no device pixel ratio, so the verdict compares
  // WxH only. A differing observed dpr is recorded on the row instead of hidden.
  const viewportRow=comparisons.find(c=>c.path==='viewport'),declaredDpr=String(declared.viewport??'').split('@')[1],observedDpr=String(observedViewport??'').split('@')[1];
  if(viewportRow.result==='match'&&declaredDpr&&observedDpr&&declaredDpr!==observedDpr)viewportRow.note='declared dpr '+declaredDpr+' but observed dpr '+observedDpr+'; the viewport argument carries no dpr, so only WxH is compared';
  return {comparisons,verdict:comparisons.some(c=>c.result==='mismatch')?'mismatch':comparisons.every(c=>c.result==='match')?'match':'unknown',mismatches:comparisons.filter(c=>c.result==='mismatch')};
}
export async function collectWith(config,env,observe) {
  validateConfig(config,env);
  const engine=new Map([['ego-lite','ego'],['ego','ego'],['agent-browser','agent-browser'],['browser-use','browser-use']]).get(env.BROWSER_QA_ENGINE)??null;
  const object={...Object.fromEntries(Object.entries(identityKeys).map(([k,v])=>[k,env[v]])),state:config.state??null,viewport:config.viewport?config.viewport+'@1':null,engine};
  const doc={engine,observed_at:new Date().toISOString(),object,items:[],failures:[]};
  for(const key of ['state','viewport','engine'])if(object[key]===null)addFailure(doc,'IDENTITY_MISMATCH','Missing identity coordinate: '+key);
  if(doc.failures.length)return doc;
  let cdp,finished=false,connected=false,disconnected=false;
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),35000);
  try {
    let endpoint=config.endpoint;
    if(endpoint.startsWith('http:')){
      let response;try{response=await fetch(endpoint,{signal:controller.signal,redirect:'error'});}catch(error){throw fail('NOT_STARTED',error.cause?.code||error.code||'CDP discovery unavailable');}
      if(!response.ok)throw fail('TOOL_ERROR','CDP discovery HTTP '+response.status);
      try{endpoint=validateEndpoint((await response.json()).webSocketDebuggerUrl,'receiver');}catch{throw fail('TOOL_ERROR','Invalid CDP discovery response');}
    }
    cdp=await connectCdp(endpoint,{signal:controller.signal});connected=true;
    cdp.onDisconnect(()=>{if(!finished){disconnected=true;addFailure(doc,'UNREACHABLE','CDP connection lost; observed items retained');}});
    const targets=(await cdp.call('Target.getTargets'))?.targetInfos;
    if(!Array.isArray(targets))throw fail('TOOL_ERROR','Target list missing');
    const pages=targets.filter(t=>t.type==='page');
    if(!pages.length)throw fail('NOT_STARTED','Page target not started');
    const matches=pages.filter(t=>routeMatches(t.url,object.route)&&(!env.PAGE_AUDIT_TARGET_ID||t.targetId===env.PAGE_AUDIT_TARGET_ID));
    if(matches.length!==1)throw fail('IDENTITY_MISMATCH','route: declared '+JSON.stringify(object.route)+' but observed '+JSON.stringify(pages.map(page=>observedRoute(page.url)))+'; expected exactly one receiver target');
    const target=matches[0];
    try{if(new URL(target.url).origin!==new URL(object.service).origin)throw fail('IDENTITY_MISMATCH','service: declared '+JSON.stringify(object.service)+' but observed '+JSON.stringify(new URL(target.url).origin));}catch(error){if(error.kind)throw error;}
    const attached=await cdp.call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
    if(!attached?.sessionId)throw fail('TOOL_ERROR','CDP target attachment missing session');
    const sessionId=attached.sessionId,call=(method,params={})=>cdp.call(method,params,sessionId);
    const observed=await evaluate(call,"({url:location.href,viewport:innerWidth+'x'+innerHeight+'@'+(devicePixelRatio||1)})");
    if(!observed||typeof observed.url!=='string'||typeof observed.viewport!=='string'||!/^\d+x\d+@[0-9.]+$/.test(observed.viewport))throw fail('TOOL_ERROR','Receiver identity observation missing');
    const identity=compareIdentity(object,{url:observed.url,viewport:observed.viewport}),mismatch=identity.mismatches[0];
    if(mismatch)throw fail('IDENTITY_MISMATCH',mismatch.path+': declared '+JSON.stringify(mismatch.declared)+' but observed '+JSON.stringify(mismatch.observed));
    object.viewport=observed.viewport;
    await observe({cdp,call,sessionId,target,doc,env,config,evaluate:expression=>evaluate(call,expression),isDisconnected:()=>disconnected});
  }catch(error){
    const kind=error.kind||(disconnected?'UNREACHABLE':!connected&&['CDP_CONNECT_FAILED','CDP_CONNECT_TIMEOUT'].includes(error.code)?'NOT_STARTED':'TOOL_ERROR');
    addFailure(doc,kind,error.message||error.code||'Collector error');
  }finally {finished=true;clearTimeout(timeout);cdp?.close();}
  return doc;
}
export async function stream(context,dimension,normalize=collect) {
  const {cdp,call,sessionId,doc,env,isDisconnected}=context,windowed=Boolean(env.PAGE_AUDIT_WINDOW_DIR);
  let loaderId,committedLoaderId,frameId,ready=false,started=false;const loaderIds=new Set(),requests=new Map(),contexts=new Map(),pending=[];
  const selectLoader=id=>{if(typeof id==='string'&&id){loaderId=id;loaderIds.add(id);}};
  const append=(item,owner,force=false)=>{
    if(!windowed){doc.items.push(item);return;}
    if(!loaderId&&!force){pending.push({item,owner});return;}
    if(owner?.frameId&&owner.frameId!==frameId||owner?.loaderId&&loaderId&&owner.loaderId!==loaderId)return;
    const known=Boolean(loaderId&&owner?.loaderId===loaderId);
    doc.items.push({...item,window_id:env.PAGE_AUDIT_WINDOW_ID,loader_id:known?owner.loaderId:null});
    if(!known)addFailure(doc,'IDENTITY_MISMATCH','Event document ownership could not be observed');
  };
  const remove=cdp.onEvent(event=>{
    if(event.sessionId!==sessionId)return;const p=event.params??{};
    if(event.method==='Runtime.executionContextCreated'){const c=p.context,old=contexts.get(c?.id),owner={frameId:c?.auxData?.frameId,loaderId:c?.auxData?.frameId===frameId?committedLoaderId:undefined};if(old&&old.loaderId!==owner.loaderId)owner.loaderId=undefined;contexts.set(c?.id,owner);return;}
    if(event.method==='Network.requestWillBeSent')requests.set(p.requestId,{loaderId:p.loaderId,frameId:p.frameId});
    if(event.method==='Page.frameNavigated'&&!p.frame.parentId){frameId=p.frame.id;committedLoaderId=p.frame.loaderId;if(ready){started=true;selectLoader(committedLoaderId);for(const entry of pending.splice(0))append(entry.item,entry.owner);}}
    if(windowed&&!ready)return;
    if(event.method==='Page.frameStartedNavigating'&&p.frameId===frameId){started=true;selectLoader(p.loaderId);}
    if(event.method==='Network.requestWillBeSent'&&p.type==='Document'&&p.frameId===frameId){started=true;selectLoader(p.loaderId);}
    const wanted=dimension==='console'?['Runtime.consoleAPICalled','Runtime.exceptionThrown']:['Network.requestWillBeSent','Network.responseReceived','Network.loadingFailed'];
    if(!wanted.includes(event.method)||windowed&&!started)return;
    let owner;
    if(dimension==='console')owner=contexts.get(p.executionContextId??p.exceptionDetails?.executionContextId);
    else {const prior=requests.get(p.requestId);if(!(prior?.loaderId&&p.loaderId&&prior.loaderId!==p.loaderId)&&!(prior?.frameId&&p.frameId&&prior.frameId!==p.frameId))owner={loaderId:p.loaderId||prior?.loaderId,frameId:p.frameId||prior?.frameId};}
    append(normalize(event),owner);
  });
  try {
    await call('Page.enable');
    if(windowed){const tree=await call('Page.getFrameTree');frameId=tree?.frameTree?.frame?.id;committedLoaderId=tree?.frameTree?.frame?.loaderId;if(!frameId)throw fail('TOOL_ERROR','Main frame identity missing');}
    await call(dimension==='console'?'Runtime.enable':'Network.enable');
    if(windowed){
      ready=true;
      try{await writeAtomic(resolve(env.PAGE_AUDIT_WINDOW_DIR,dimension+'.ready'),{target_id:env.PAGE_AUDIT_TARGET_ID,window_id:env.PAGE_AUDIT_WINDOW_ID});}catch{throw fail('TOOL_ERROR','Cannot write '+dimension+'.ready');}
      const deadline=Date.now()+Number(env.PAGE_AUDIT_WINDOW_TIMEOUT_MS||30000);
      while(!isDisconnected()){
        try {await readFile(resolve(env.PAGE_AUDIT_WINDOW_DIR,'finish'));break;}catch(error){if(error.code!=='ENOENT')throw error;}
        if(Date.now()>=deadline)throw fail('TOOL_ERROR','Navigation window finish timeout');
        await pause(10);
      }
      if(!isDisconnected()&&(!loaderId||loaderIds.size!==1))throw fail('IDENTITY_MISMATCH','Window must contain exactly one main-frame loader');
    }else await pause(100);
  }finally {remove();for(const entry of pending.splice(0))append(entry.item,entry.owner,true);}
}
export {stream as window};
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value&&Object.hasOwn(value,k)).map(k=>[k,value[k]]));
const safeUrl=value=>{try{const u=new URL(value);return ['http:','https:','ws:','wss:'].includes(u.protocol)?u.origin+u.pathname:u.protocol+'[redacted]';}catch{return 'unknown';}};
const sourceStack=stack=>({callFrames:(stack?.callFrames??[]).map(frame=>({...pick(frame,['scriptId','lineNumber','columnNumber']),...(frame.url?{url:safeUrl(frame.url)}:{})}))});
// Only diagnostic metadata crosses this boundary. Headers, bodies, remote values
// and descriptions are deliberately never retained as raw evidence or stdout.
export function collect(event,window={}) {
  const p=event.params??{},item={event:event.method,...pick(p,['type','requestId','frameId','loaderId','executionContextId','timestamp','wallTime','errorText','canceled','blockedReason'])};
  if(p.documentURL)item.documentURL=safeUrl(p.documentURL);
  if(p.request)item.request={...pick(p.request,['method']),url:safeUrl(p.request.url)};
  if(p.response)item.response={...pick(p.response,['status','mimeType','protocol','fromDiskCache','fromServiceWorker','encodedDataLength']),url:safeUrl(p.response.url)};
  if(Array.isArray(p.args))item.args=p.args.map(arg=>({type:['object','function','undefined','string','number','boolean','symbol','bigint'].includes(arg.type)?arg.type:'unknown'}));
  if(p.stackTrace)item.stackTrace=sourceStack(p.stackTrace);
  if(p.exceptionDetails)item.exceptionDetails={...pick(p.exceptionDetails,['exceptionId','lineNumber','columnNumber','executionContextId']),...(p.exceptionDetails.url?{url:safeUrl(p.exceptionDetails.url)}:{}),...(p.exceptionDetails.stackTrace?{stackTrace:sourceStack(p.exceptionDetails.stackTrace)}:{})};
  return {...item,...pick(window,['window_id','loader_id'])};
}
// The SDK page is supplied by the existing QA gateway caller. No endpoint,
// target enumeration, profile access or new browser lifecycle is introduced.
export async function ownedEgoContext(page,config,env) {
  const space=Number(env.BROWSER_QA_EGO_SPACE_ID);
  if(!Number.isSafeInteger(space)||space<1||page?.spaceId!==space||page.label!=='p1'||typeof page.cdp!=='function'||typeof page.events!=='function')throw fail('IDENTITY_MISMATCH','Expected the gateway-owned Ego space and its existing p1');
  const engine=env.BROWSER_QA_ENGINE;
  if(!['ego-lite','ego'].includes(engine))throw fail('IDENTITY_MISMATCH','Owned Ego page cannot be relabeled as another engine');
  for(const name of Object.values(identityKeys))if(typeof env[name]!=='string'||!env[name].trim())throw fail('IDENTITY_MISMATCH','Identity declaration missing: '+name);
  const url=await page.url();
  if(!routeMatches(url,env.PAGE_AUDIT_ROUTE))throw fail('IDENTITY_MISMATCH','Owned page route differs; no navigation issued');
  let pinnedViewport;
  const read=async()=>{
    if(!routeMatches(await page.url(),env.PAGE_AUDIT_ROUTE))throw fail('IDENTITY_MISMATCH','Owned page route drifted');
    const rows=await runRegisteredScript(page,'design-source-read-v1',{elements:[{selector:'html',properties:[],facts:['viewport','scroll','navigation']}]});
    const viewport=rows?.[0]?.facts?.viewport;
    if(!viewport)throw fail('TOOL_ERROR','Registered viewport observation missing');
    if(!routeMatches(await page.url(),env.PAGE_AUDIT_ROUTE)||pinnedViewport&&['width','height','dpr'].some(key=>viewport[key]!==pinnedViewport[key]))throw fail('IDENTITY_MISMATCH','Owned page route or viewport/DPR drifted during audit');
    return rows[0];
  };
  const observed=await read(),viewport=observed.facts.viewport;
  if(!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||!Number.isFinite(viewport.dpr)||viewport.dpr<=0)throw fail('TOOL_ERROR','Registered viewport coordinates invalid');
  const object={...Object.fromEntries(Object.entries(identityKeys).map(([key,name])=>[key,env[name]])),state:config.state,viewport:viewport.width+'x'+viewport.height+'@'+viewport.dpr,engine};
  const identity=compareIdentity({...object,viewport:config.viewport},{url,viewport:object.viewport});
  if(identity.mismatches.length)throw fail('IDENTITY_MISMATCH','Owned page '+identity.mismatches[0].path+' differs from declaration; no navigation issued');
  const allowed=new Set(['Page.enable','Runtime.enable','Network.enable','Page.getFrameTree','Accessibility.enable','Accessibility.getFullAXTree']);
  const call=(method,params={})=>{if(!allowed.has(method))throw fail('TOOL_ERROR','Unsupported owned-page audit command: '+method);return page.cdp(method,params);};
  pinnedViewport={...viewport};
  return {page,object,read,call};
}
export async function observeOwnedEgoReload(context,timeoutMs=5000) {
  const {page,call,read}=context;
  // Every observer is enabled before draining old events and issuing reload.
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  const before=(await call('Page.getFrameTree'))?.frameTree?.frame;
  if(!before?.id||!before.loaderId)throw fail('TOOL_ERROR','Owned main frame identity missing; no navigation issued');
  await page.events();
  let navigated=false;
  try {
    navigated=true;await page.reload();await page.waitForSelector('body');
    const events=[],deadline=Date.now()+timeoutMs;
    while(true){events.push(...await page.events());if(events.some(e=>e.method==='Page.loadEventFired'))break;if(Date.now()>=deadline)throw fail('TOOL_ERROR','Owned navigation load was not observed');await pause(20);}
    await pause(Math.min(500,timeoutMs));events.push(...await page.events());
    const frames=events.filter(e=>e.method==='Page.frameNavigated'&&!e.params?.frame?.parentId).map(e=>e.params.frame);
    const loaders=new Set(frames.map(frame=>frame.loaderId));
    if(loaders.size!==1||!frames.length||frames.some(frame=>frame.id!==before.id)||frames[0].loaderId===before.loaderId)throw fail('IDENTITY_MISMATCH','Owned window must contain exactly one new main-frame loader');
    const frame=(await call('Page.getFrameTree'))?.frameTree?.frame,loaderId=frames[0].loaderId;
    if(frame?.id!==before.id||frame.loaderId!==loaderId||!routeMatches(await page.url(),context.object.route))throw fail('IDENTITY_MISMATCH','Owned page changed during navigation observation');
    return {events,frameId:frame.id,loaderId,windowId:crypto.randomUUID(),observation:await read()};
  }catch(error){if(error.kind)throw error;throw fail(navigated?'UNREACHABLE':'NOT_STARTED',error.message||'Owned page control lost');}
}
export async function collectOwnedEgoNavigation(context,timeoutMs=5000) {
  const doc=()=>({engine:context.object.engine,observed_at:new Date().toISOString(),object:{...context.object},items:[],failures:[]});
  const consoleDoc=doc(),networkDoc=doc();
  try {
    const window=await observeOwnedEgoReload(context,timeoutMs),contexts=new Map(),requests=new Map();let committed=false;
    for(const event of window.events){const p=event.params??{};
      if(event.method==='Page.frameNavigated'&&p.frame?.id===window.frameId&&p.frame.loaderId===window.loaderId)committed=true;
      if(event.method==='Runtime.executionContextCreated'&&committed&&p.context?.auxData?.frameId===window.frameId)contexts.set(p.context.id,window.loaderId);
      if(event.method==='Network.requestWillBeSent')requests.set(p.requestId,{loaderId:p.loaderId,frameId:p.frameId});
      if(['Network.requestWillBeSent','Network.responseReceived','Network.loadingFailed'].includes(event.method)){
        const prior=requests.get(p.requestId),loader=p.loaderId||prior?.loaderId,frame=p.frameId||prior?.frameId;
        if(loader===window.loaderId&&frame===window.frameId)networkDoc.items.push(collect(event,{window_id:window.windowId,loader_id:window.loaderId}));
      }
      if(['Runtime.consoleAPICalled','Runtime.exceptionThrown'].includes(event.method)){
        const owner=contexts.get(p.executionContextId??p.exceptionDetails?.executionContextId);
        if(owner===window.loaderId)consoleDoc.items.push(collect(event,{window_id:window.windowId,loader_id:window.loaderId}));
        else if(committed)addFailure(consoleDoc,'IDENTITY_MISMATCH','Console event document ownership was not observed');
      }
    }
    // A real lifecycle checkpoint distinguishes observed-zero console messages
    // from a collector that never reached the document. It is not a log message.
    const loaded=window.events.find(e=>e.method==='Page.loadEventFired');
    consoleDoc.items.push(collect(loaded,{window_id:window.windowId,loader_id:window.loaderId}));
    return {console:consoleDoc,network:networkDoc,unreachable:false};
  }catch(error){const kind=error.kind||'TOOL_ERROR';for(const value of [consoleDoc,networkDoc])addFailure(value,kind,error.message);return {console:consoleDoc,network:networkDoc,unreachable:kind==='UNREACHABLE'};}
}

const collectConsole=(config,env)=>collectWith(config,env,context=>stream(context,'console'));
export async function runCollectorCli(argv,env,collector) {
  let config;try{config=parse(argv,env);}catch(error){console.error(JSON.stringify({ok:false,outcome:'unavailable',errors:[{code:error.code,path:error.path,message:error.message}]}));return 2;}
  const doc=await collector(config,env);
  try{await writeAtomic(config.out,doc);}catch(error){console.error(JSON.stringify({ok:false,errors:[{code:'E_WRITE',message:error.code||error.message}]}));return 1;}
  console.log(JSON.stringify(doc));return 0;
}
export const runCli=(argv=process.argv.slice(2),env=process.env)=>runCollectorCli(argv,env,collectConsole);
if(process.argv[1]===fileURLToPath(import.meta.url))process.exitCode=await runCli();
