import {spawn} from 'node:child_process';
import {readFile, mkdir, realpath, mkdtemp, rm, writeFile, chmod, access, lstat} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {connectCdp,validateEndpoint,makeScope,transferTargetCookies,safeError} from './browser-qa-tickets.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const nativeHelper=join(here,'browser-qa-browser-use.py');
function command(argv,env,{signal,inherit=false,outputSecrets}={}) {
  if(signal?.aborted)return Promise.reject(safeError('CANCELLED'));
  return new Promise((resolve,reject)=>{
    // Ticket values may cross arbitrary chunk boundaries. Keep protected output
    // in memory until it can be checked in full, before forwarding either stream.
    const protectedOutput=inherit&&Boolean(outputSecrets?.size);
    const c=spawn(argv[0],argv.slice(1),{env,detached:true,stdio:inherit&&!protectedOutput?'inherit':[inherit?'inherit':'ignore','pipe','pipe']});
    const stdoutChunks=[],stderrChunks=[];
    if(!inherit||protectedOutput){c.stdout.on('data',b=>stdoutChunks.push(b));if(protectedOutput)c.stderr.on('data',b=>stderrChunks.push(b));else c.stderr.resume();}
    const abort=()=>{try{process.kill(-c.pid,'SIGTERM');}catch{}};
    signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
    c.once('error',()=>reject(safeError('COMMAND_UNAVAILABLE')));
    c.once('close',(code)=>{
      signal?.removeEventListener('abort',abort);
      const stdout=Buffer.concat(stdoutChunks),stderr=Buffer.concat(stderrChunks);let resultCode=code??143;
      if(protectedOutput){
        const leaked=[...outputSecrets].some(value=>value&&(stdout.includes(Buffer.from(value))||stderr.includes(Buffer.from(value))));
        if(leaked){console.error(JSON.stringify({error:'SECRET_OUTPUT_BLOCKED'}));resultCode=resultCode||1;}
        else{process.stdout.write(stdout);process.stderr.write(stderr);}
        resolve({code:resultCode,stdout:''});
      }else resolve({code:resultCode,stdout:stdout.toString()});
    });
  });
}
async function ownedReceiver(env,session,signal) {
  const home=env.AGENT_BROWSER_SOCKET_DIR||env.AGENT_BROWSER_HOME||join(env.HOME,'.agent-browser');
  let pid;try {pid=Number((await readFile(join(home,session+'.pid'),'utf8')).trim());}catch{throw safeError('RECEIVER_OWNERSHIP_MISSING');}
  const rows=(await command(['ps','-axo','pid=,ppid=,lstart=,command='],env,{signal})).stdout.split('\n').map(x=>x.trim()).filter(Boolean);
  if(signal?.aborted)throw safeError('CANCELLED');
  const root=rows.find(r=>Number(r.split(/\s+/)[0])===pid);
  if(!root||!/(agent-browser|browser_use\.skill_cli)/.test(root))throw safeError('RECEIVER_OWNERSHIP_INVALID');
  const plain=(await command(['ps','-axo','pid=,ppid=,command='],env,{signal})).stdout.split('\n').map(r=>r.trim().split(/\s+/));
  const owned=new Set([pid]);let changed=true;while(changed){changed=false;for(const r of plain)if(owned.has(Number(r[1]))&&!owned.has(Number(r[0]))){owned.add(Number(r[0]));changed=true;}}
  const profile=plain.find(r=>owned.has(Number(r[0]))&&r.join(' ').includes('--user-data-dir='));
  if(!profile)throw safeError('RECEIVER_PROFILE_MISSING');
  return {pid,identity:root,profilePid:Number(profile[0]),profileIdentity:rows.find(r=>Number(r.split(/\s+/)[0])===Number(profile[0]))};
}
async function nativePython(env,signal) {
  if(env.BROWSER_QA_BROWSER_USE_PYTHON)return env.BROWSER_QA_BROWSER_USE_PYTHON;
  const located=await command(['which','browser-use'],env,{signal});
  if(located.code)throw safeError('BROWSER_USE_CAPABILITY_UNAVAILABLE');
  const line=(await readFile(located.stdout.trim(),'utf8')).split('\n')[0];
  if(!line.startsWith('#!')||!line.includes('python'))throw safeError('BROWSER_USE_CAPABILITY_UNAVAILABLE');
  return line.slice(2).trim();
}
async function processIdentity(pid,env) {
  const result=await command(['ps','-ww','-p',String(pid),'-o','pid=,ppid=,lstart=,command='],env);
  if(result.code)return null;
  const row=result.stdout.trim(), fields=row.split(/\s+/);
  return fields.length>=8?{row,pid:Number(fields[0]),ppid:Number(fields[1]),start:fields.slice(2,7).join(' '),command:fields.slice(7).join(' ')}:null;
}
async function documentGuard(receiver,{allowed,reject,fault,signal}) {
  const filter=[{type:'tab',exclude:false},{type:'page',exclude:false},{type:'iframe',exclude:false},{exclude:true}];
  const tabFilter=[{type:'tab',exclude:false},{exclude:true}];
  const documentFilter=[{type:'page',exclude:false},{type:'iframe',exclude:false},{exclude:true}];
  const iframeFilter=[{type:'iframe',exclude:false},{exclude:true}];
  const sessions=new Map(),targets=new Map(),waiting=new Map();let closing=false;
  const failed=error=>{if(!closing)fault('NATIVE_NAVIGATION_GUARD_FAILED',error?.method);};
  const auto={autoAttach:true,waitForDebuggerOnStart:true,flatten:true};
  const present=async targetId=>(await receiver.call('Target.getTargets',{filter})).targetInfos.some(t=>t.targetId===targetId);
  const setup=async event=>{
    const {sessionId,targetInfo}=event;if(!sessionId||!targetInfo?.targetId)throw safeError('NATIVE_NAVIGATION_GUARD_FAILED');
    if(sessions.has(sessionId))return sessions.get(sessionId).ready;
    const entry={targetId:targetInfo.targetId};sessions.set(sessionId,entry);
    if(!targets.has(entry.targetId))targets.set(entry.targetId,new Set());targets.get(entry.targetId).add(sessionId);
    entry.ready=(async()=>{
      if(closing||signal.aborted)return;
      // A tab is a container: capture its descendants before releasing it.
      await receiver.call('Target.setAutoAttach',{...auto,filter:targetInfo.type==='tab'?documentFilter:iframeFilter},sessionId);
      if(targetInfo.type==='page'||targetInfo.type==='iframe')await receiver.call('Fetch.enable',{patterns:[{urlPattern:'*',resourceType:'Document',requestStage:'Request'}]},sessionId);
      if(closing||signal.aborted)return;
      await receiver.call('Runtime.runIfWaitingForDebugger',{},sessionId);
      entry.installed=true;waiting.get(entry.targetId)?.resolve();
    })();
    try{await entry.ready;}catch(error){if(!closing&&await present(entry.targetId))throw error;}
  };
  const detached=async sessionId=>{
    const entry=sessions.get(sessionId);if(!entry){if(!closing)failed();return;}
    if(closing)return;
    // A real target destruction (e.g. native close-tab) is not coverage loss.
    if(await present(entry.targetId))throw safeError('NATIVE_NAVIGATION_GUARD_FAILED');
    sessions.delete(sessionId);targets.get(entry.targetId)?.delete(sessionId);
  };
  const paused=async message=>{
    const {sessionId,params}=message;
    if(closing&&!params?.requestId)return;
    if(!sessions.has(sessionId)||!params?.requestId||params.resourceType!=='Document')throw safeError('NATIVE_NAVIGATION_GUARD_FAILED');
    if(!allowed(params.request?.url)){reject();await receiver.call('Fetch.failRequest',{requestId:params.requestId,errorReason:'Aborted'},sessionId);return;}
    if(closing||signal.aborted){await receiver.call('Fetch.failRequest',{requestId:params.requestId,errorReason:'Aborted'},sessionId);return;}
    if(allowed(params.request?.url))await receiver.call('Fetch.continueRequest',{requestId:params.requestId},sessionId);
  };
  const unsubscribe=receiver.onEvent(message=>{
    let action;
    if(message.method==='Target.attachedToTarget')action=setup(message.params);
    else if(message.method==='Target.detachedFromTarget')action=detached(message.params?.sessionId);
    else if(message.method==='Fetch.requestPaused')action=paused(message);
    if(action)void action.catch(failed);
  });
  const disconnected=receiver.onDisconnect(failed);
  const ready=targetId=>{
    const entry=[...(targets.get(targetId)||[])].map(id=>sessions.get(id)).find(e=>e?.installed);
    if(entry)return Promise.resolve();
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(safeError('NATIVE_NAVIGATION_GUARD_FAILED')),3000);
      const abort=()=>{clearTimeout(timer);reject(safeError('CANCELLED'));};signal.addEventListener('abort',abort,{once:true});
      waiting.set(targetId,{resolve:()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);waiting.delete(targetId);resolve();}});
      if(signal.aborted)abort();});
  };
  const guard={expectClose(){closing=true;},release(){closing=true;unsubscribe();disconnected();sessions.clear();targets.clear();}};
  try{
    // Chrome rejects a filter that includes both tab containers and pages.
    // Capture tabs at the browser root, then pages/iframes recursively below.
    await receiver.call('Target.setAutoAttach',{...auto,filter:tabFilter});
    const initial=await receiver.call('Target.getTargets',{filter});
    await Promise.all(initial.targetInfos.map(target=>ready(target.targetId)));
    if(signal.aborted)throw safeError('CANCELLED');
    return guard;
  }catch(error){failed(error);guard.expectClose();throw error;}
}
async function runNativeQa({env,session,evidence,scenario,scope,sourceEndpoint,mode}) {
  const aborter=new AbortController();let cancelled=0;
  const stop=s=>{cancelled=s==='SIGINT'?130:143;aborter.abort();};
  const int=()=>stop('SIGINT'),term=()=>stop('SIGTERM');process.on('SIGINT',int);process.on('SIGTERM',term);
  let ownedRoot,profile,helper,browser,helperIdentity,helperBaseline,browserIdentity,receiver,source,guard,adapterFailure;
  let helperExit,browserExit,helperDone,browserDone,helperClosed,browserClosed;
  let code=1,commandFailed=false,teardown=false,closing,distinct=!sourceEndpoint,sourceCollision=false;
  const secrets=new Set(sourceEndpoint?[sourceEndpoint]:[]),events=[],waiters=[];
  const report=(event,fields={})=>console.log(JSON.stringify({native_qa:event,...fields}));
  const allowed=url=>{try{const parsed=new URL(url);return ['http:','https:'].includes(parsed.protocol)&&env.BROWSER_QA_ALLOWED_DOMAINS.split(',').includes(parsed.hostname);}catch{return false;}};
  let domainRejected=false;
  const rejectDomain=()=>{commandFailed=true;if(!domainRejected){domainRejected=true;console.error(JSON.stringify({error:'TARGET_OUTSIDE_ALLOWED_DOMAINS'}));}};
  const guardFault=(error,method)=>{commandFailed=true;const known=['Target.setAutoAttach','Target.getTargets','Fetch.enable','Fetch.continueRequest','Fetch.failRequest','Runtime.runIfWaitingForDebugger'];console.error(JSON.stringify({error,...(known.includes(method)?{method}:{})}));aborter.abort();};
  const send=message=>{if(helper?.stdin.writable)helper.stdin.write(JSON.stringify(message)+'\n');};
  const eventWait=(name,ms,signal)=>{
    if(signal?.aborted)return Promise.reject(safeError('CANCELLED'));
    if(adapterFailure)return Promise.reject(adapterFailure);
    const existing=events.findIndex(e=>e.event===name);if(existing>=0)return Promise.resolve(events.splice(existing,1)[0]);
    return new Promise((resolve,reject)=>{const entry={name,reject:e=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(e);},resolve:e=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(e);}};
      const remove=()=>{const n=waiters.indexOf(entry);if(n>=0)waiters.splice(n,1);};
      const abort=()=>{remove();clearTimeout(timer);reject(safeError('CANCELLED'));};
      const timer=setTimeout(()=>{remove();reject(safeError('NATIVE_ADAPTER_TIMEOUT'));},ms);waiters.push(entry);signal?.addEventListener('abort',abort,{once:true});});
  };
  const bounded=async(promise,ms)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(safeError('NATIVE_CLEANUP_TIMEOUT')),ms);})]);}finally{clearTimeout(timer);}};
  const helperMatches=identity=>Boolean(identity&&identity.pid===helper?.pid&&identity.ppid===process.pid&&identity.command.includes(nativeHelper+' adapter '+session+' '+ownedRoot+' '+profile));
  const exactTerm=async(child,identity,label)=>{
    if(child.exitCode!==null||child.signalCode!==null)return;
    const now=await processIdentity(child.pid,env);
    // Early cancellation may precede the launch handshake. Authenticate the
    // same direct child against its recorded start and all owned argv markers.
    if(label==='helper'&&!identity&&helperBaseline&&now?.start===helperBaseline.start&&helperMatches(now)){identity=now;helperIdentity=now;}
    if(!identity||!now||now.row!==identity.row||now.ppid!==process.pid||child.pid<=0)throw safeError('NATIVE_IDENTITY_CHANGED');
    report('term',{resource:label,pid:child.pid,start:identity.start});
    if(!child.kill('SIGTERM'))throw safeError('NATIVE_TERM_FAILED');
  };
  const closeBrowser=()=>closing||=(async()=>{
    if(!distinct){
      // A transport not yet compared is not permission to send Browser.close.
      // Its separately authenticated direct child is still ours to reclaim.
      if(sourceCollision)throw safeError('SOURCE_RECEIVER_IDENTICAL');
      if(browser){await exactTerm(browser,browserIdentity,'browser');await bounded(browserDone,10000);await bounded(browserClosed,1000);}
      return;
    }
    guard?.expectClose();
    if(helper&&!helperExit){send({command:'detach'});try{await eventWait('detached',3000);}catch{}}
    if(receiver){try{await receiver.call('Browser.close');report('browser_close');}catch{report('browser_close_unavailable');}}
    if(browser){try{await bounded(browserDone,3000);}catch{await exactTerm(browser,browserIdentity,'browser');await bounded(browserDone,10000);}await bounded(browserClosed,1000);}
  })();
  try {
    let python;
    try {python=await nativePython(env,aborter.signal);const probe=await command([python,nativeHelper,'probe'],env,{signal:aborter.signal});
      if(probe.code)throw safeError('BROWSER_USE_CAPABILITY_UNAVAILABLE');JSON.parse(probe.stdout);
    }catch(e){throw safeError(cancelled?'CANCELLED':'BROWSER_USE_CAPABILITY_UNAVAILABLE');}
    if(aborter.signal.aborted)throw safeError('CANCELLED');
    await mkdir(resolve(evidence),{recursive:true});
    // Darwin AF_UNIX paths are short; the caller's TMPDIR/HOME remain untouched.
    ownedRoot=await realpath(await mkdtemp(join(process.platform==='darwin'?'/tmp':env.TMPDIR||tmpdir(),'whqa-native-')));await chmod(ownedRoot,0o700);
    profile=join(ownedRoot,'browser-use-user-data-dir-owned');await mkdir(profile,{mode:0o700});
    const bin=join(ownedRoot,'bin');await mkdir(bin,{mode:0o700});
    await writeFile(join(bin,'browser-use'),'#!/bin/sh\nexec '+[python,nativeHelper,'cli'].map(x=>"'"+x.replaceAll("'","'\\''")+"'").join(' ')+' "$@"\n',{mode:0o700});
    Object.assign(env,{BROWSER_USE_HOME:ownedRoot,BROWSER_USE_SESSION:session,BROWSER_QA_SESSION:session,
      BROWSER_QA_ENGINE:'browser-use',BROWSER_QA_ALLOWED_DOMAINS:scope.hostname==='localhost'||scope.hostname==='127.0.0.1'?'localhost,127.0.0.1':scope.hostname,
      PATH:bin+':'+env.PATH,BROWSER_QA_OWNED_ROOT:ownedRoot});
    if(aborter.signal.aborted)throw safeError('CANCELLED');
    helper=spawn(python,[nativeHelper,'adapter',session,ownedRoot,profile],{env,stdio:['pipe','pipe','pipe']});helper.stderr.resume();
    helperDone=new Promise(resolve=>helper.once('exit',(code,signal)=>{helperExit={code,signal};if(!teardown)commandFailed=true;resolve();}));
    helperClosed=new Promise(resolve=>helper.once('close',resolve));helper.once('error',()=>{commandFailed=true;});
    const lines=createInterface({input:helper.stdout});
    lines.on('line',line=>{let e;try{e=JSON.parse(line);}catch{commandFailed=true;return;}
      if(e.event==='navigation'){if(aborter.signal.aborted){send({command:'approve',token:e.token,response:'cancelled'});return;}const permitted=allowed(e.url);if(!permitted)rejectDomain();send({command:'approve',token:e.token,response:permitted});return;}
      if(e.event==='response'){
        const respond=async()=>{let response=e.response;
          if([...secrets].some(s=>s&&JSON.stringify(response).includes(s)))response={id:response.id,success:false,error:'SECRET_OUTPUT_BLOCKED'};
          if(response.success&&response.data?.shutdown){try{await closeBrowser();}catch{response={id:response.id,success:false,error:'NATIVE_CLEANUP_FAILED'};}}
          if(response.success!==true)commandFailed=true;
          send({command:'approve',token:e.token,response});};void respond();return;
      }
      if(e.event==='failure'){commandFailed=true;adapterFailure=safeError(['BROWSER_USE_BROWSER_UNAVAILABLE','BROWSER_USE_CAPABILITY_UNAVAILABLE'].includes(e.error)?e.error:'NATIVE_ADAPTER_FAILED');for(const waiter of waiters.splice(0))waiter.reject(adapterFailure);return;}
      const index=waiters.findIndex(w=>w.name===e.event);if(index>=0)waiters.splice(index,1)[0].resolve(e);else events.push(e);
    });
    // A platform Python launcher may not yet expose the final argv. Capture
    // the direct child's start first; the private launch pipe is not permission
    // to skip the strict identity check before creating a browser.
    helperBaseline=await processIdentity(helper.pid,env);
    const identityFlags=identity=>({resource:'helper',pid:helper.pid,present:Boolean(identity),
      parent_matches:identity?.ppid===process.pid,marker_matches:helperMatches(identity),
      helper_path_matches:Boolean(identity?.command.includes(nativeHelper)),
      role_matches:Boolean(identity?.command.includes(' adapter ')),
      session_matches:Boolean(identity?.command.includes(session)),
      root_matches:Boolean(identity?.command.includes(ownedRoot)),
      profile_matches:Boolean(identity?.command.includes(profile))});
    if(!helperBaseline||helperBaseline.pid!==helper.pid||helperBaseline.ppid!==process.pid){
      report('identity_unavailable',identityFlags(helperBaseline));throw adapterFailure||safeError('NATIVE_IDENTITY_INVALID');
    }
    if(helperMatches(helperBaseline))helperIdentity=helperBaseline;
    else report('identity_pending',identityFlags(helperBaseline));
    const launch=await eventWait('launch',10000,aborter.signal);
    const confirmed=await processIdentity(helper.pid,env);
    if(!helperMatches(confirmed)||confirmed.start!==helperBaseline.start){
      report('identity_unavailable',identityFlags(confirmed));throw adapterFailure||safeError('NATIVE_IDENTITY_INVALID');
    }
    helperIdentity=confirmed;
    await access(launch.executable);
    if(launch.args.filter(x=>x.startsWith('--user-data-dir=')).join('')!=='--user-data-dir='+profile)throw safeError('NATIVE_PROFILE_INVALID');
    if(aborter.signal.aborted)throw safeError('CANCELLED');
    browser=spawn(launch.executable,[...launch.args,'--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','about:blank'],{env,stdio:'ignore'});
    browserDone=new Promise(resolve=>browser.once('exit',(code,signal)=>{browserExit={code,signal};report('browser_exit',browserExit);resolve();}));
    browserClosed=new Promise(resolve=>browser.once('close',resolve));
    const browserCandidate=await processIdentity(browser.pid,env);
    if(!browserCandidate||browserCandidate.ppid!==process.pid||!browserCandidate.command.includes('--user-data-dir='+profile)){
      report('identity_unavailable',{resource:'browser',pid:browser.pid,present:Boolean(browserCandidate),parent_matches:browserCandidate?.ppid===process.pid,marker_matches:Boolean(browserCandidate?.command.includes('--user-data-dir='+profile))});
      throw safeError('NATIVE_IDENTITY_INVALID');
    }
    browserIdentity=browserCandidate;
    let active;
    for(let n=0;n<200;n++){
      if(aborter.signal.aborted)throw safeError('CANCELLED');
      if(browserExit)throw safeError('NATIVE_BROWSER_START_FAILED');
      try{active=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');if(active.length===2)break;}catch{}
      await new Promise(r=>setTimeout(r,50));
    }
    if(!active)throw safeError('NATIVE_ENDPOINT_UNAVAILABLE');
    const endpoint=validateEndpoint('ws://127.0.0.1:'+active[0]+active[1],'receiver');secrets.add(endpoint);
    receiver=await connectCdp(endpoint,{signal:aborter.signal,closeOnAbort:false});
    const info=await receiver.call('SystemInfo.getProcessInfo');
    if(info.processInfo.filter(p=>p.type==='browser').map(p=>Number(p.id)).join('')!==String(browser.pid))throw safeError('NATIVE_ENDPOINT_IDENTITY_INVALID');
    if(sourceEndpoint){source=await connectCdp(sourceEndpoint,{signal:aborter.signal});if(source.peerIdentity===receiver.peerIdentity){sourceCollision=true;throw safeError('SOURCE_RECEIVER_IDENTICAL');}distinct=true;
      await transferTargetCookies({source,receiver,scope,signal:aborter.signal,onSecret:s=>secrets.add(s),report:r=>console.log(JSON.stringify(r))});source.close();source=null;}
    guard=await documentGuard(receiver,{allowed,reject:rejectDomain,fault:guardFault,signal:aborter.signal});
    send({endpoint});await eventWait('ready',35000,aborter.signal);
    const socketPath=join(ownedRoot,session+'.sock'),socketIdentity=await lstat(socketPath);
    if(!socketIdentity.isSocket())throw safeError('NATIVE_SESSION_UNAVAILABLE');
    Object.assign(env,{BROWSER_QA_OWNED_BROWSER_PID:String(browser.pid),BROWSER_QA_OWNED_HELPER_PID:String(helper.pid)});
    report('owned',{browser_pid:browser.pid,browser_start:browserIdentity.start,helper_pid:helper.pid,helper_start:helperIdentity.start,profile});
    const opened=await command([join(bin,'browser-use'),'open',scope.targetUrl],env,{signal:aborter.signal});
    if(opened.code)throw safeError('TARGET_NAVIGATION_FAILED');
    const result=await command(scenario,env,{signal:aborter.signal,inherit:true});
    code=result.code||Number(commandFailed);
    try{const current=await lstat(socketPath);if(!current.isSocket()||current.dev!==socketIdentity.dev||current.ino!==socketIdentity.ino)throw safeError('NATIVE_SESSION_UNAVAILABLE');}
    catch{console.error(JSON.stringify({error:'NATIVE_SESSION_UNAVAILABLE'}));code=code||1;}
  }catch(e){console.error(JSON.stringify({error:e.code||'NATIVE_QA_FAILED'}));code=cancelled||1;}
  finally {
    teardown=true;source?.close();let clean=true;
    try{await closeBrowser();}catch{clean=false;}
    const releaseGuard=()=>{receiver?.close();guard?.release();};
    // A failed bounded cleanup must not release paused Documents on a live
    // owned browser. The existing foreground ChildProcess owner stays attached;
    // release this connection only when its actual browser exit is observed.
    if(sourceCollision){
      // No guard or helper endpoint was installed before the comparison. Leave
      // the source browser alive, but release our transport and foreground ref.
      releaseGuard();browser?.unref();
    }else if(browser&&!browserExit)void browserDone.then(releaseGuard);else releaseGuard();
    if(helper&&!helperExit){send({command:'stop'});try{await bounded(helperDone,3000);}catch{try{await exactTerm(helper,helperIdentity,'helper');await bounded(helperDone,5000);}catch{clean=false;}}}
    if(helper){try{await bounded(helperClosed,1000);}catch{clean=false;}}
    if(sourceCollision)clean=false;
    if(browser&&!browserExit||helper&&!helperExit)clean=false;
    if(ownedRoot&&clean){
      const rows=(await command(['ps','-ww','-axo','pid=,command='],env)).stdout.split('\n');
      if(rows.some(row=>row.includes('--user-data-dir='+profile)))clean=false;
      else await rm(ownedRoot,{recursive:true,force:true});
    }
    if(!clean){code=code||1;console.log('cleanup_incomplete=native_owned_resources');
      console.log('cleanup_owned_root='+JSON.stringify(ownedRoot||'unknown'));console.log('cleanup_session='+JSON.stringify(session));
      console.log('cleanup_last_verified_browser_pid='+(browser?.pid??'unknown'));console.log('cleanup_last_verified_browser_start='+JSON.stringify(browserIdentity?.start||'unknown'));
      console.log('cleanup_last_verified_daemon_pid='+(helper?.pid??'unknown'));console.log('cleanup_last_verified_daemon_start='+JSON.stringify(helperIdentity?.start||'unknown'));}
    else report('cleanup_complete',{helper_exit:helperExit||null,browser_exit:browserExit||null});
    secrets.clear();const unlisten=()=>{process.off('SIGINT',int);process.off('SIGTERM',term);};
    if(browser&&!browserExit||helper&&!helperExit)void Promise.all([browserDone,helperDone].filter(Boolean)).then(unlisten);else unlisten();
  }
  return cancelled||code||Number(commandFailed);
}
export async function runBrowserQa(args=process.argv.slice(2),inputEnv=process.env) {
  let url,evidence;const a=[...args];while(a.length&&a[0]!=='--'){const flag=a.shift();if(flag==='--url')url=a.shift();else if(flag==='--evidence-dir')evidence=a.shift();else throw safeError('INVALID_RUN_ARGUMENT');}if(a.shift()!=='--'||!a.length||!evidence)throw safeError('INVALID_RUN_ARGUMENT');
  const env={...inputEnv};const sourceInput=env.BROWSER_QA_TICKET_SOURCE_WS;const site=env.BROWSER_QA_TICKET_TOP_LEVEL_SITE;delete env.BROWSER_QA_TICKET_SOURCE_WS;delete env.BROWSER_QA_TICKET_TOP_LEVEL_SITE;
  const scope=makeScope(url,site);const mode=env.BROWSER_QA_AUTH_MODE||'none';const engine=env.BROWSER_QA_ENGINE||'agent-browser';
  if(!['agent-browser','browser-use'].includes(engine))throw safeError('UNSUPPORTED_ENGINE');
  if(!['none','read-only-ticket-export'].includes(mode))throw safeError('UNSUPPORTED_AUTH_MODE');
  if(mode==='read-only-ticket-export'&&!sourceInput)throw safeError('SOURCE_UNAVAILABLE');
  const sourceEndpoint=mode==='read-only-ticket-export'?validateEndpoint(sourceInput):null;
  const host=scope.hostname;const allowed=host==='localhost'||host==='127.0.0.1'?'localhost,127.0.0.1':host;
  if(env.BROWSER_QA_ALLOWED_DOMAINS&&!env.BROWSER_QA_ALLOWED_DOMAINS.split(',').includes(host))throw safeError('TARGET_OUTSIDE_ALLOWED_DOMAINS');
  const root=await realpath(process.cwd());const session='whqa-'+createHash('sha256').update(root).digest('hex').slice(0,8)+'-'+process.pid;
  Object.assign(env,{BROWSER_QA_SESSION:session,BROWSER_QA_ENGINE:engine,BROWSER_QA_ALLOWED_DOMAINS:allowed,BROWSER_QA_AUTH_MODE:mode});
  if(engine==='browser-use')return runNativeQa({env,session,evidence,scenario:a,scope,sourceEndpoint,mode});
  await mkdir(resolve(evidence),{recursive:true});
  const ownedRoot=await mkdtemp(join(env.TMPDIR||tmpdir(),'whqa-'));
  Object.assign(env,{AGENT_BROWSER_SOCKET_DIR:ownedRoot,AGENT_BROWSER_HOME:ownedRoot});
  const aborter=new AbortController();let cancelled=0;let source,receiver;let cleanupOwnership;let sourceCollision=false;let receiverDistinct=!sourceEndpoint;let code=1;const secrets=new Set();
  const stop=s=>{cancelled=s==='SIGINT'?130:143;aborter.abort();};const int=()=>stop('SIGINT'),term=()=>stop('SIGTERM');process.on('SIGINT',int);process.on('SIGTERM',term);
  try {
    const launch=engine==='agent-browser'?[engine,'--session',session,'--allowed-domains',allowed,'--content-boundaries','open']:[engine,'--session',session,'open'];
    const opened=await command(launch,env,{signal:aborter.signal});if(opened.code)throw safeError('ENGINE_LAUNCH_FAILED');
    {
      const ownership=await ownedReceiver(env,session,aborter.signal);
      const cdp=await command([engine,'--session',session,'get','cdp-url'],env,{signal:aborter.signal});
      let endpoint=cdp.stdout.trim();try{const parsed=JSON.parse(endpoint);endpoint=parsed.data?.url||parsed.data?.cdpUrl||parsed.data||parsed.url||endpoint;}catch{}
      endpoint=validateEndpoint(endpoint,'receiver');
      receiver=await connectCdp(endpoint,{signal:aborter.signal,closeOnAbort:false});
      if(aborter.signal.aborted)throw safeError('CANCELLED');
      const identities=(await command(['ps','-axo','pid=,ppid=,lstart=,command='],env,{signal:aborter.signal})).stdout.split('\n').map(r=>r.trim());
      if(!identities.includes(ownership.identity)||!ownership.profileIdentity||!identities.includes(ownership.profileIdentity))throw safeError('RECEIVER_IDENTITY_CHANGED');
      const start=row=>{const fields=row.trim().split(/\s+/);return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(fields[2]||'')?fields.slice(2,7).join(' '):'unknown';};
      cleanupOwnership={daemonPid:ownership.pid,daemonStart:start(ownership.identity),browserPid:ownership.profilePid,browserStart:start(ownership.profileIdentity)};
      if(sourceEndpoint){source=await connectCdp(sourceEndpoint,{signal:aborter.signal});
      if(source.peerIdentity===receiver.peerIdentity){sourceCollision=true;throw safeError('SOURCE_RECEIVER_IDENTICAL');}
      receiverDistinct=true;
      await transferTargetCookies({source,receiver,scope,signal:aborter.signal,onSecret:value=>secrets.add(value),report:r=>console.log(JSON.stringify(r))});source.close();source=null;}
    }
    const navigated=await command([engine,'--session',session,'open',scope.targetUrl],env,{signal:aborter.signal});if(navigated.code)throw safeError('TARGET_NAVIGATION_FAILED');
    const result=await command(a,env,{signal:aborter.signal,inherit:true,outputSecrets:secrets});code=result.code;
  } catch(e){console.error(JSON.stringify({error:e.code||'QA_RUN_FAILED',...(e.method?{method:e.method}:{})}));code=cancelled||1;}
  finally {
    source?.close();
    if(receiver){try{if(receiverDistinct)await receiver.call('Browser.close');}catch{code=code||1;}receiver.close();}
    const cleaned=!receiverDistinct?{code:1,stdout:'cleanup_incomplete=source_receiver_identity_'+(sourceCollision?'collision':'unverified')+'\n'}:await command(['bash',join(here,'browser-qa-cleanup.sh'),session,engine],env);process.stdout.write(cleaned.stdout);
    if(cleaned.code){
      console.log('cleanup_owned_root='+JSON.stringify(ownedRoot));
      console.log('cleanup_session='+JSON.stringify(session));
      console.log('cleanup_last_verified_daemon_pid='+(cleanupOwnership?.daemonPid??'unknown'));
      console.log('cleanup_last_verified_daemon_start='+JSON.stringify(cleanupOwnership?.daemonStart??'unknown'));
      console.log('cleanup_last_verified_browser_pid='+(cleanupOwnership?.browserPid??'unknown'));
      console.log('cleanup_last_verified_browser_start='+JSON.stringify(cleanupOwnership?.browserStart??'unknown'));
      code=code||cleaned.code;
    }
    if(!cleaned.code)await rm(ownedRoot,{recursive:true,force:true});
    process.off('SIGINT',int);process.off('SIGTERM',term);
    secrets.clear();
  }
  return cancelled||code;
}
if(process.argv[1]===fileURLToPath(import.meta.url))runBrowserQa().then(code=>{process.exitCode=code;}).catch(e=>{console.error(JSON.stringify({error:e.code||'QA_RUN_FAILED'}));process.exitCode=1;});
