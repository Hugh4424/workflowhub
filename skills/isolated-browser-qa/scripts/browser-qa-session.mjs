import {spawn} from 'node:child_process';
import {readFile, mkdir, realpath, mkdtemp, rm, writeFile, chmod, access, lstat} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {dirname,join,resolve,delimiter,isAbsolute} from 'node:path';
import {constants} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {connectCdp,validateEndpoint,makeScope,transferTargetCookies,safeError} from './browser-qa-tickets.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const nativeHelper=join(here,'browser-qa-browser-use.py');
function command(argv,env,{signal,inherit=false,outputSecrets,captureStderr=false,outputOnFailure=false}={}) {
  if(signal?.aborted)return Promise.reject(safeError('CANCELLED'));
  return new Promise((resolve,reject)=>{
    // Ticket values may cross arbitrary chunk boundaries. Keep protected output
    // in memory until it can be checked in full, before forwarding either stream.
    const protectedOutput=inherit&&Boolean(outputSecrets?.size);
    const c=spawn(argv[0],argv.slice(1),{env,detached:true,stdio:inherit&&!protectedOutput?'inherit':[inherit?'inherit':'ignore','pipe','pipe']});
    const stdoutChunks=[],stderrChunks=[];
    if(!inherit||protectedOutput){c.stdout.on('data',b=>stdoutChunks.push(b));if(protectedOutput||captureStderr||outputOnFailure)c.stderr.on('data',b=>stderrChunks.push(b));else c.stderr.resume();}
    let observeClose,cancellation,cleanupFailure;
    const childClosed=new Promise(resolve=>{observeClose=resolve;});
    const group=async()=>{
      if(!Number.isInteger(c.pid)||c.pid<=0)throw safeError('COMMAND_GROUP_IDENTITY_UNAVAILABLE');
      const result=await command(['ps','-ww','-axo','pid=,ppid=,pgid=,lstart=,stat='],env);
      if(result.code)throw safeError('COMMAND_GROUP_IDENTITY_UNAVAILABLE');
      return result.stdout.split('\n').map(row=>row.trim().split(/\s+/)).filter(fields=>fields.length>=9&&Number(fields[2])===c.pid)
        .map(fields=>({pid:Number(fields[0]),ppid:Number(fields[1]),pgid:Number(fields[2]),start:fields.slice(3,8).join(' '),state:fields[8]}));
    };
    const live=members=>members.filter(member=>!member.state.startsWith('Z'));
    const signalGroup=signal=>{try{process.kill(-c.pid,signal);}catch(error){if(error.code!=='ESRCH')throw safeError('COMMAND_GROUP_SIGNAL_FAILED');}};
    const abort=()=>{
      if(cancellation)return;
      cancellation=(async()=>{
        // detached:true creates a new group. Authenticate its actual leader
        // before TERM, retaining members so a surviving child can prove group
        // continuity after the leader exits and leaves inherited pipes open.
        const before=await group();
        if(!live(before).length)return;
        if(!before.some(member=>member.pid===c.pid&&member.ppid===process.pid))throw safeError('COMMAND_GROUP_IDENTITY_UNAVAILABLE');
        const expires=Date.now()+1500;signalGroup('SIGTERM');
        let timer;
        try{await Promise.race([childClosed,new Promise(resolve=>{timer=setTimeout(resolve,1500);})]);}finally{clearTimeout(timer);}
        let current=live(await group());if(!current.length)return;
        const remaining=expires-Date.now();if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
        current=live(await group());if(!current.length)return;
        const continuous=current.some(member=>before.some(original=>member.pid===original.pid&&member.pgid===original.pgid&&member.start===original.start));
        if(!continuous)throw safeError('COMMAND_GROUP_IDENTITY_CHANGED');
        signalGroup('SIGKILL');
        const deadline=Date.now()+3000;
        while(live(await group()).length){if(Date.now()>=deadline)throw safeError('COMMAND_GROUP_CLEANUP_TIMEOUT');await new Promise(resolve=>setTimeout(resolve,50));}
      })().catch(error=>{
        cleanupFailure=error;
        console.error(JSON.stringify({error:error.code||'COMMAND_GROUP_CLEANUP_FAILED',owned_group:c.pid??null}));
        console.error('cleanup_incomplete=command_owned_group');
      });
    };
    signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
    c.once('error',()=>reject(safeError('COMMAND_UNAVAILABLE')));
    c.once('close',async(code)=>{
      observeClose();
      // With inherited stdio, close of the leader alone does not mean its work
      // stopped. Cancellation must also finish reclaiming the owned group.
      await cancellation;
      signal?.removeEventListener('abort',abort);
      if(cleanupFailure){reject(cleanupFailure);return;}
      const stdout=Buffer.concat(stdoutChunks),stderr=Buffer.concat(stderrChunks);let resultCode=code??143;
      if(protectedOutput||(outputOnFailure&&resultCode!==0)){
        const leaked=[...(outputSecrets||[])].some(value=>value&&(stdout.includes(Buffer.from(value))||stderr.includes(Buffer.from(value))));
        if(leaked){console.error(JSON.stringify({error:'SECRET_OUTPUT_BLOCKED'}));resultCode=resultCode||1;}
        else{process.stdout.write(stdout);process.stderr.write(stderr);}
        resolve({code:resultCode,stdout:''});
      }else resolve({code:resultCode,stdout:stdout.toString(),...(captureStderr?{stderr:stderr.toString()}: {})});
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
  const plain=rows.map(r=>r.split(/\s+/));
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
export function egoTaskSpaceName(taskId,runId=randomUUID()) {
  if(typeof taskId!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId))||taskId.includes('..'))throw safeError('BROWSER_QA_TASK_HANDLE_UNAVAILABLE');
  if(typeof runId!=='string'||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)))throw safeError('EGO_RUN_ID_INVALID');
  return `workflowhub-qa-${taskId}-${runId}`;
}
export function requireTaskIdFromHost(taskId) {
  if(typeof taskId!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId))||taskId.includes('..'))throw safeError('BROWSER_QA_TASK_HANDLE_UNAVAILABLE');
  return taskId;
}
function validEgoHandle(value,expectedName) {
  if(!value||typeof value!=='object'||value.name!==expectedName||!Number.isSafeInteger(value.spaceId)||value.spaceId<1||value.label!=='p1')throw safeError('EGO_WORKSPACE_HANDLE_INVALID');
  return {name:value.name,spaceId:value.spaceId,label:value.label};
}
function safeEgoErrorCode(error) {return typeof error?.code==='string'&&/^[A-Z0-9_]+$/.test(error.code)?error.code:'EGO_WORKSPACE_FAILED';}
function verifiedEgoFinish(outcome) {
  const receipt=outcome?.receipt;
  return outcome?.resolved===true&&receipt&&typeof receipt==='object'&&receipt.closed_page_label_p1===true
    &&receipt.closed_page_count===1&&receipt.retained_page_count===0
    &&(receipt.preserved_unmanaged_count===null
      ||(Number.isSafeInteger(receipt.preserved_unmanaged_count)&&receipt.preserved_unmanaged_count>=0));
}
// One logical QA run owns one newly named TaskSpace. The injected callbacks
// keep creation, scenario execution and exactly-once cleanup testable without
// opening a real Ego space.
export async function runOwnedEgoTaskSpace({taskId,createSpace,runScenario,finishSpace,report=()=>{},uuid=randomUUID}={}) {
  if(typeof createSpace!=='function'||typeof runScenario!=='function'||typeof finishSpace!=='function')throw safeError('EGO_WORKSPACE_ADAPTER_UNAVAILABLE');
  const name=egoTaskSpaceName(taskId,uuid());
  let create='pending',run='not_started',cleanup='not_attempted',handle=null,value,operationError,cleanupError;
  try {
    const created=await createSpace(name);
    create='created';
    handle=validEgoHandle(created?.handle??created,name);
    report({event:'ego-workspace-created',page_label:handle.label,storage:'shared-profile',background:'not-guaranteed'});
    if(created?.code)throw safeError('EGO_WORKSPACE_ACQUISITION_FAILED');
    run='running';
    value=await runScenario(handle);
    run='succeeded';
  } catch(error) {
    if(create==='pending')create=['CANCELLED','EGO_WORKSPACE_HANDLE_UNAVAILABLE','EGO_WORKSPACE_HANDLE_AMBIGUOUS'].includes(error?.code)?'unavailable':'failed';
    if(create==='created'&&run==='running')run=error?.code==='CANCELLED'?'cancelled':'failed';
    else if(create==='created'&&run==='not_started'&&handle)run='not_started';
    operationError=error;
  } finally {
    if(handle) {
      cleanup='running';
      try {
        const outcome=await finishSpace(handle);
        if(!verifiedEgoFinish(outcome))throw safeError('EGO_WORKSPACE_FINISH_CONFIRMATION_UNAVAILABLE');
        cleanup='finished';
        report({event:'ego-workspace-finished',page_label:handle.label,receipt:outcome.receipt});
      } catch(error) {
        cleanup='incomplete';
        cleanupError=error;
        report({event:'ego-workspace-cleanup-incomplete',reason:safeEgoErrorCode(error)});
      }
    } else if(create==='created'||create==='unavailable')cleanup='unavailable';
    report({event:'ego-workspace-lifecycle',create,run,cleanup});
  }
  if(cleanupError) {
    const error=safeError('EGO_WORKSPACE_CLEANUP_INCOMPLETE');
    error.cause=operationError??cleanupError;
    throw error;
  }
  if(operationError)throw operationError;
  return {value,lifecycle:{create,run,cleanup}};
}
const egoBundleIdentifier='com.citrolabs.ego.lite';
const egoBundleName='ego lite.app';
const egoApplicationInventoryScript=String.raw`
import AppKit
import CoreServices
import Foundation
let target = "com.citrolabs.ego.lite"
let targetName = "ego lite.app"
func emit(_ state: String, _ source: String) {
  let value = ["state": state, "source": source]
  if let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
     let line = String(data: data, encoding: .utf8) {
    print(line)
  } else {
    print("{\"state\":\"unknown\",\"source\":\"probe-output-invalid\"}")
  }
}
func verifiedBundle(_ url: URL) -> Bool? {
  guard url.isFileURL else { return nil }
  do {
    let info = try Data(contentsOf: url.appendingPathComponent("Contents/Info.plist"), options: [.mappedIfSafe])
    guard let plist = try PropertyListSerialization.propertyList(from: info, options: [], format: nil) as? [String: Any] else { return nil }
    guard let bundleId = plist["CFBundleIdentifier"] as? String, !bundleId.isEmpty else { return false }
    return bundleId == target
  } catch {
    return nil
  }
}
if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: target) {
  guard let match = verifiedBundle(url) else { emit("unknown", "launch-services-metadata-incomplete"); exit(0) }
  if match { emit("present", "launch-services") }
  else { emit("unknown", "launch-services-inconsistent") }
  exit(0)
}
var lsError: Unmanaged<CFError>?
if let raw = LSCopyApplicationURLsForBundleIdentifier(target as CFString, &lsError) {
  guard let urls = raw.takeRetainedValue() as? [URL] else { emit("unknown", "launch-services-result-invalid"); exit(0) }
  var metadataIncomplete = false
  for url in urls {
    guard let match = verifiedBundle(url) else { metadataIncomplete = true; continue }
    if match { emit("present", "launch-services"); exit(0) }
  }
  emit("unknown", metadataIncomplete ? "launch-services-metadata-incomplete" : "launch-services-inconsistent")
  exit(0)
}
if let error = lsError?.takeRetainedValue() {
  if CFErrorGetCode(error) != Int(kLSApplicationNotFoundErr) {
    emit("unknown", "launch-services-query-failed")
    exit(0)
  }
} else {
  emit("unknown", "launch-services-result-missing")
  exit(0)
}
let roots = Array(Set(NSSearchPathForDirectoriesInDomains(.applicationDirectory, .allDomainsMask, true))).sorted()
if roots.isEmpty { emit("unknown", "application-domain-list-unavailable"); exit(0) }
let manager = FileManager.default
var incomplete = false
for path in roots {
  let root = URL(fileURLWithPath: path, isDirectory: true).resolvingSymlinksInPath()
  let attributes: [FileAttributeKey: Any]
  do {
    attributes = try manager.attributesOfItem(atPath: root.path)
  } catch {
    let failure = error as NSError
    if failure.domain == NSCocoaErrorDomain && [NSFileNoSuchFileError, NSFileReadNoSuchFileError].contains(failure.code) { continue }
    incomplete = true
    continue
  }
  guard attributes[.type] as? FileAttributeType == .typeDirectory else { incomplete = true; continue }
  guard let entries = manager.enumerator(at: root, includingPropertiesForKeys: [.isDirectoryKey], options: [.skipsHiddenFiles, .skipsPackageDescendants], errorHandler: { _, _ in incomplete = true; return true }) else {
    incomplete = true
    continue
  }
  while let item = entries.nextObject() as? URL {
    guard item.pathExtension.lowercased() == "app", item.lastPathComponent.lowercased() == targetName.lowercased() else { continue }
    guard let match = verifiedBundle(item) else { incomplete = true; continue }
    if match { emit("present", "application-domain-scan"); exit(0) }
  }
}
if incomplete { emit("unknown", "application-domain-scan-incomplete") }
else { emit("absent", "application-domain-scan-complete") }
`;
async function egoProcessPath(env,commandProbe=command) {
  const result=await commandProbe(['ps','-ww','-axo','comm='],env);
  if(result.code)throw safeError('EGO_PROCESS_OBSERVATION_FAILED');
  return result.stdout.split('\n').map(row=>row.trim()).find(row=>/^\/.*\/ego lite\.app\/Contents\/MacOS\/ego lite$/.test(row))||null;
}
async function egoAlreadyRunning(env) {return Boolean(await egoProcessPath(env));}
async function inspectEgoBundle(candidate,env,commandProbe=command) {
  let resolved,info;
  try {resolved=await realpath(candidate);info=await lstat(resolved);}
  catch(error) {if(['ENOENT','ENOTDIR'].includes(error.code))return {state:'absent'};throw error;}
  if(!info.isDirectory())return {state:'absent'};
  const plist=await commandProbe(['/usr/bin/plutil','-extract','CFBundleIdentifier','raw','-o','-',join(resolved,'Contents','Info.plist')],env);
  if(plist.code)return {state:'unknown',reason:'bundle-metadata-unavailable'};
  if(plist.stdout.trim()!==egoBundleIdentifier)return {state:'absent'};
  return {state:'present',appPath:resolved};
}
async function detectEgoApplicationDomainState(env,commandProbe) {
  let probe;
  try {probe=await commandProbe(['/usr/bin/swift','-e',egoApplicationInventoryScript],env);}
  catch(error) {
    if(error.code==='CANCELLED')throw error;
    return {state:'unknown',reason:error.code==='EACCES'?'application-domain-probe-permission-denied':'application-domain-probe-failed'};
  }
  if(probe.code)return {state:'unknown',reason:'application-domain-probe-failed'};
  let result;
  try {result=JSON.parse(probe.stdout.trim());}
  catch {return {state:'unknown',reason:'application-domain-probe-invalid'};}
  if(!result||typeof result!=='object'||Array.isArray(result)||typeof result.state!=='string'||typeof result.source!=='string')return {state:'unknown',reason:'application-domain-probe-invalid'};
  if(result.state==='present'&&['launch-services','application-domain-scan'].includes(result.source))return {state:'present'};
  if(result.state==='absent'&&result.source==='application-domain-scan-complete')return {state:'absent',reason:'application-domain-scan-complete'};
  if(result.state==='unknown')return {state:'unknown',reason:result.source};
  return {state:'unknown',reason:'application-domain-probe-inconsistent'};
}
async function detectEgoAppInstallation(env,{platform=process.platform,appCandidates,commandProbe=command}={}) {
  if(platform!=='darwin')return {state:'unknown',reason:'unsupported-platform'};
  const candidates=appCandidates??['/Applications/'+egoBundleName,...(env.HOME?[join(env.HOME,'Applications',egoBundleName)]:[])];
  let inspectionUnknown=false;
  for(const candidate of candidates) {
    const result=await inspectEgoBundle(candidate,env,commandProbe);
    if(result.state==='present')return result;
    if(result.state==='unknown')inspectionUnknown=true;
  }
  if(inspectionUnknown)return {state:'unknown',reason:'bundle-metadata-unavailable'};
  let searchWasStale=false;
  try {
    const search=await commandProbe(['/usr/bin/mdfind','-0',`kMDItemCFBundleIdentifier == "${egoBundleIdentifier}"c`],{...env,LC_ALL:'C'});
    if(!search.code)for(const candidate of search.stdout.split('\0').filter(Boolean)) {
      const result=await inspectEgoBundle(candidate,env,commandProbe);
      if(result.state==='present')return {state:'present',appPath:result.appPath};
      if(result.state==='unknown')return result;
      searchWasStale=true;
    }
  } catch(error) {
    if(error.code==='CANCELLED')throw error;
  }
  const installation=await detectEgoApplicationDomainState(env,commandProbe);
  if(installation.state==='present')return installation;
  if(searchWasStale)return {state:'unknown',reason:'application-search-stale'};
  return installation;
}
async function resolveEgoHelperPath(env) {
  for(const root of (env.PATH||'').split(delimiter)) {
    if(!root)continue;
    const candidate=join(root,'ego-browser');
    try {
      await access(candidate,constants.X_OK);
      const resolved=await realpath(candidate),info=await lstat(resolved);
      if(info.isFile())return resolved;
    } catch(error) {
      if(['ENOENT','ENOTDIR'].includes(error.code))continue;
      throw safeError('EGO_HELPER_UNAVAILABLE');
    }
  }
  return null;
}
async function probeEgoEnvironment(env,requested,systemProbe={}) {
  const installation=await detectEgoAppInstallation(env,systemProbe);
  if(requested==='agent-browser'&&installation.state==='present')return {appInstallation:'present',appPath:installation.appPath};
  const processPath=await egoProcessPath(env,systemProbe.commandProbe||command);
  const appInstallation=processPath?'present':installation.state;
  if(appInstallation!=='present')return {appInstallation,reason:installation.reason};
  const helperPath=await resolveEgoHelperPath(env);
  return {appInstallation,appPath:installation.appPath||processPath?.split('/Contents/')[0]||null,helperPath,running:Boolean(processPath)};
}
export async function executeEgoWorkspaceCommand(argv,env,signal) {
  let result;try{result=await command(argv,env,{signal,captureStderr:true});}catch(error){if(error.code==='COMMAND_UNAVAILABLE')throw safeError('EGO_HELPER_UNAVAILABLE');throw error;}
  const rows=(result.stdout+'\n'+result.stderr).split('\n').filter(row=>row.startsWith('WHQA_OWNED_HANDLE='));
  if(result.code&&!rows.length) {
    const code=(result.stdout+'\n'+result.stderr).match(/\bEGO_[A-Z0-9_]+\b/)?.[0];
    throw safeError(code||'EGO_WORKSPACE_CREATE_FAILED');
  }
  if(rows.length!==1)throw safeError(rows.length?'EGO_WORKSPACE_HANDLE_AMBIGUOUS':'EGO_WORKSPACE_HANDLE_UNAVAILABLE');
  let handle;try{handle=JSON.parse(rows[0].slice('WHQA_OWNED_HANDLE='.length));}catch{throw safeError('EGO_WORKSPACE_HANDLE_UNAVAILABLE');}
  return {code:result.code,handle};
}
export async function executeEgoFinishCommand(argv,env,signal,handle) {
  let result;try{result=await command(argv,env,{signal,captureStderr:true});}catch(error){if(error.code==='COMMAND_UNAVAILABLE')throw safeError('EGO_HELPER_UNAVAILABLE');throw error;}
  if(result.code) {
    const code=(result.stdout+'\n'+result.stderr).match(/\bEGO_[A-Z0-9_]+\b/)?.[0];
    throw safeError(code||'EGO_WORKSPACE_FINISH_FAILED');
  }
  const events=[];
  for(const row of (result.stdout+'\n'+result.stderr).split('\n')) {
    let event;try{event=JSON.parse(row);}catch{continue;}
    if(event?.event==='ego-workspace-finished')events.push(event);
  }
  if(events.length!==1||events[0].resolved!==true||!events[0].receipt||typeof events[0].receipt!=='object')throw safeError('EGO_WORKSPACE_FINISH_CONFIRMATION_UNAVAILABLE');
  return {resolved:true,receipt:events[0].receipt};
}
export function bindEgoTaskSpaceNameToNodejsScript(script,taskSpaceName) {
  if(typeof script!=='string')throw safeError('EGO_NODEJS_SCRIPT_UNAVAILABLE');
  if(typeof taskSpaceName!=='string'||!taskSpaceName)return script;
  return `process.env.BROWSER_QA_EGO_TASKSPACE_NAME=${JSON.stringify(taskSpaceName)};\n${script}`;
}
async function runEgoQa({env,session,evidence,scenario,scope,mode,egoHelperPath}) {
  if(mode!=='none')throw safeError('EGO_WORKSPACE_TICKET_EXPORT_UNSUPPORTED');
  if(typeof egoHelperPath!=='string'||!isAbsolute(egoHelperPath))throw safeError('EGO_HELPER_UNAVAILABLE');
  const taskId=requireTaskIdFromHost(env.BROWSER_QA_TASK_ID);
  if(env.BROWSER_QA_EGO_SPACE_ID!==undefined||env.BROWSER_QA_EGO_KEEP_OPEN!==undefined)throw safeError('EGO_TASKSPACE_REUSE_OPTIONS_UNSUPPORTED');
  if(!await egoAlreadyRunning(env))throw safeError('EGO_NOT_RUNNING');
  await mkdir(resolve(evidence),{recursive:true});
  const aborter=new AbortController();let cancelled=0;
  const stop=signal=>{cancelled=signal==='SIGINT'?130:143;aborter.abort();};
  const int=()=>stop('SIGINT'),term=()=>stop('SIGTERM');process.on('SIGINT',int);process.on('SIGTERM',term);
  try {
    await runOwnedEgoTaskSpace({
      taskId,
      createSpace:async name=>{
        const script=`const name=${JSON.stringify(name)};const task=await taskSpace(name);if(task.name!==name)throw Object.assign(new Error('EGO_WORKSPACE_NAME_MISMATCH'),{code:'EGO_WORKSPACE_NAME_MISMATCH'});console.log('WHQA_OWNED_HANDLE='+JSON.stringify({name:task.name,spaceId:task.spaceId,label:'p1'}));`;
        return executeEgoWorkspaceCommand([egoHelperPath,'nodejs','-e',script],env,aborter.signal);
      },
      runScenario:async handle=>{
        if(cancelled)throw safeError('CANCELLED');
        const result=await command(scenario,{...env,BROWSER_QA_EGO_TASKSPACE_NAME:handle.name,BROWSER_QA_EGO_PAGE_LABEL:handle.label,BROWSER_QA_EGO_HELPER_PATH:egoHelperPath,BROWSER_QA_TARGET_URL:scope.targetUrl,BROWSER_QA_EVIDENCE_DIR:resolve(evidence)},{signal:aborter.signal,inherit:true});
        if(cancelled||result.code)throw safeError(cancelled||result.code===130||result.code===143?'CANCELLED':'SCENARIO_FAILED');
        return result;
      },
      finishSpace:handle=>executeEgoFinishCommand(
        [egoHelperPath,'nodejs','-e',`const name=${JSON.stringify(handle.name)};const task=await taskSpace(name);if(task.name!==name)throw Object.assign(new Error('EGO_WORKSPACE_NAME_MISMATCH'),{code:'EGO_WORKSPACE_NAME_MISMATCH'});const value=await task.finish({keep:[]});const receipt=value&&typeof value==='object'?value:{};const entries=Object.entries(receipt);const closed=entries.filter(([key,list])=>/closed/i.test(key)&&Array.isArray(list)&&list.every(label=>typeof label==='string'));const retained=entries.filter(([key,list])=>/(retained|kept)/i.test(key)&&Array.isArray(list)&&list.every(label=>typeof label==='string'));const count=lists=>lists.reduce((total,[,list])=>total+list.length,0);const closedSpace=typeof receipt.closedSpace==='boolean'?receipt.closedSpace:typeof receipt.closed_space==='boolean'?receipt.closed_space:null;const protectedCount=Number.isSafeInteger(receipt.preservedUnmanagedCount)?receipt.preservedUnmanagedCount:Number.isSafeInteger(receipt.preserved_unmanaged_count)?receipt.preserved_unmanaged_count:null;const summary={receipt_keys:Object.keys(receipt).sort(),closed_page_label_p1:closed.some(([,list])=>list.includes('p1')),closed_page_count:count(closed),retained_page_count:count(retained),closed_space:closedSpace,preserved_unmanaged_count:protectedCount};console.log(JSON.stringify({event:'ego-workspace-finished',resolved:true,receipt:summary}));`],
        env,undefined,handle
      ),
      report:fact=>process.stdout.write(JSON.stringify(fact)+'\n')
    });
    return cancelled||0;
  } catch(error) {
    if(cancelled)return cancelled;throw error;
  } finally {process.off('SIGINT',int);process.off('SIGTERM',term);}
}
export function recordEngineFallback(report, reason, probe) {
  const fact={event:'engine-fallback',from:'ego-lite',to:'agent-browser',reason,probe};
  report.push(fact);return fact;
}
export async function selectBrowserEngine(env=process.env,{probe,systemProbe}={}) {
  const requested=env.BROWSER_QA_ENGINE||'auto';
  if(!['auto','ego-lite','agent-browser','browser-use'].includes(requested))throw safeError('UNSUPPORTED_ENGINE');
  if(requested==='browser-use')return {engine:'browser-use',fallbacks:[]};
  let result;
  try {result=await (probe||(input=>probeEgoEnvironment(input,requested,systemProbe)))(env);}
  catch(error) {if(['CANCELLED','EACCES'].includes(error.code))throw error;throw safeError('ENGINE_PROBE_UNAVAILABLE');}
  if(!result||!['present','absent','unknown'].includes(result.appInstallation))throw safeError('ENGINE_PROBE_INVALID');
  if(requested==='agent-browser') {
    if(result.appInstallation==='present')throw safeError('EGO_INSTALLED_AGENT_BROWSER_FORBIDDEN');
    if(result.appInstallation==='unknown')throw safeError('EGO_INSTALLATION_UNAVAILABLE');
    return {engine:'agent-browser',fallbacks:[]};
  }
  if(result.appInstallation==='unknown')throw safeError('EGO_INSTALLATION_UNAVAILABLE');
  if(result.appInstallation==='absent') {
    if(requested==='ego-lite')throw safeError('EGO_APP_NOT_INSTALLED');
    const fallbacks=[];recordEngineFallback(fallbacks,'Ego app confirmed absent before launch',result);
    return {engine:'agent-browser',fallbacks};
  }
  if(!Object.hasOwn(result,'helperPath')||result.helperPath!==null&&(typeof result.helperPath!=='string'||!isAbsolute(result.helperPath))||typeof result.running!=='boolean')throw safeError('ENGINE_PROBE_INVALID');
  if(result.helperPath===null)throw safeError('EGO_HELPER_UNAVAILABLE');
  if(!result.running)throw safeError('EGO_NOT_RUNNING');
  return {engine:'ego-lite',fallbacks:[],egoHelperPath:result.helperPath};
}
const registeredScripts=Object.freeze(['design-source-read-v1','design-source-prepare-v1']);
// Fixed facts are a closed name set; coordinates stay bounded data.
const registeredFacts=Object.freeze(['scroll','hit-test','reduced-motion','active-element','viewport','navigation']);
export function assertRegisteredScript(id) {
  // unregistered identifiers are rejected before executor access.
  if(!registeredScripts.includes(id))throw safeError('UNREGISTERED_SCRIPT');
  return id;
}
export async function runRegisteredScript(page,id,args={}) {
  assertRegisteredScript(id); // Reject before any page call; no arbitrary strings.
  const isPrepare=id==='design-source-prepare-v1';
  const validObject=args&&typeof args==='object'&&!Array.isArray(args);
  const boundedCoordinate=value=>Number.isFinite(value)&&value>=0&&value<=1000000;
  const validPoint=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===2&&boundedCoordinate(value.x)&&boundedCoordinate(value.y);
  const validRead=validObject&&Object.keys(args).every(key=>key==='elements')&&Array.isArray(args.elements)&&args.elements.length<=1000&&args.elements.every(item=>item&&typeof item==='object'&&!Array.isArray(item)&&Object.keys(item).every(key=>['selector','properties','facts','point'].includes(key))&&typeof item.selector==='string'&&!!item.selector&&Array.isArray(item.properties)&&item.properties.length<=1000&&item.properties.every(key=>typeof key==='string'&&!!key)&&(item.facts===undefined||Array.isArray(item.facts)&&item.facts.length<=registeredFacts.length&&item.facts.every(key=>registeredFacts.includes(key))&&new Set(item.facts).size===item.facts.length)&&(item.point===undefined||Boolean(item.facts?.includes('hit-test'))&&validPoint(item.point)));
  const validPrepare=validObject&&Object.keys(args).every(key=>key==='actions')&&Array.isArray(args.actions)&&args.actions.length<=100&&args.actions.every(action=>action&&typeof action==='object'&&!Array.isArray(action)&&Object.keys(action).every(key=>['type','selector'].includes(key))&&action.type==='click'&&typeof action.selector==='string'&&!!action.selector);
  if(!(isPrepare?validPrepare:validRead))throw safeError('INVALID_COLLECTION_ARGUMENTS');
  return page.evaluate(({id,args})=>{
    const undo=[],violations=[];
    const deny=kind=>()=>{violations.push(kind);throw new Error('READ_ONLY_'+kind);};
    const replace=(owner,key,value)=>{const descriptor=Object.getOwnPropertyDescriptor(owner,key);if(!descriptor||!descriptor.configurable)throw new Error('READ_ONLY_GUARD_UNAVAILABLE:'+key);Object.defineProperty(owner,key,{...descriptor,...value});undo.push(()=>Object.defineProperty(owner,key,descriptor));};
    const replaceIf=(owner,key,value)=>{if(owner&&Object.getOwnPropertyDescriptor(owner,key))replace(owner,key,value);};
    const listeners=[];
    const listen=(target,type,handler,options)=>{if(typeof target?.addEventListener!=='function')return;target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));};
    let observer;
    try {
      replace(window,'fetch',{value:deny('NETWORK')});
      replace(XMLHttpRequest.prototype,'open',{value:deny('NETWORK')});
      for(const key of ['appendChild','insertBefore','replaceChild','removeChild'])replace(Node.prototype,key,{value:deny('DOM_WRITE')});
      for(const key of ['innerHTML','outerHTML'])replace(Element.prototype,key,{set:deny('DOM_WRITE')});
      replace(Node.prototype,'textContent',{set:deny('DOM_WRITE')});
      replace(Element.prototype,'setAttribute',{value:deny('DOM_WRITE')});
      replaceIf(typeof HTMLFormElement==='undefined'?null:HTMLFormElement.prototype,'submit',{value:deny('DOM_WRITE')});
      replaceIf(typeof HTMLFormElement==='undefined'?null:HTMLFormElement.prototype,'requestSubmit',{value:deny('DOM_WRITE')});
      replaceIf(typeof Navigator==='undefined'?null:Navigator.prototype,'sendBeacon',{value:deny('NETWORK')});
      replaceIf(window,'open',{value:deny('NETWORK')});
      listen(document,'submit',event=>{event.preventDefault?.();violations.push('DOM_WRITE');},true);
      listen(document,'click',event=>{let node=event.target;while(node&&node!==document){if(node.tagName==='A'&&node.href){event.preventDefault?.();violations.push('NETWORK');break;}node=node.parentElement;}},true);
      observer=new MutationObserver(()=>violations.push('DOM_MUTATION_OBSERVED'));
      observer.observe(document,{subtree:true,attributes:true,childList:true,characterData:true});
      let value;
      if(id==='design-source-prepare-v1'){
        for(const {selector} of args.actions){const element=document.querySelector(selector);if(!element)throw new Error('ELEMENT_NOT_FOUND:'+selector);if(typeof element.click!=='function')throw new Error('CLICK_UNAVAILABLE:'+selector);element.click();}
        value=[];
      }else{
        if(!Array.isArray(args.elements)||args.elements.length>1000)throw new Error('INVALID_COLLECTION_ELEMENTS');
        const viewport_observed={width:window.innerWidth,height:window.innerHeight},factNames=['scroll','hit-test','reduced-motion','active-element','viewport','navigation'];
        value=args.elements.map(({selector,properties=[],facts=[],point})=>{
          if(typeof selector!=='string'||!selector||!Array.isArray(properties)||properties.length>1000)throw new Error('INVALID_COLLECTION_ELEMENT');
          if(!Array.isArray(facts)||facts.length>factNames.length||new Set(facts).size!==facts.length||!facts.every(key=>factNames.includes(key)))throw new Error('INVALID_COLLECTION_FACTS');
          if(point!==undefined&&(!facts.includes('hit-test')||!point||typeof point!=='object'||Array.isArray(point)||Object.keys(point).some(key=>!['x','y'].includes(key))||!Number.isFinite(point.x)||point.x<0||point.x>1000000||!Number.isFinite(point.y)||point.y<0||point.y>1000000))throw new Error('INVALID_COLLECTION_POINT');
          const element=document.querySelector(selector);if(!element)throw new Error('ELEMENT_NOT_FOUND:'+selector);
          const box=element.getBoundingClientRect();if(!box.width||!box.height)throw new Error('ELEMENT_NOT_RENDERED:'+selector);
          const computed=getComputedStyle(element);
          const observation={selector,viewport_observed,structure:{tag:element.tagName,text:element.textContent,...(element.tagName==='INPUT'?{input_type:element.type}:{})},rendered:{styles:Object.fromEntries(properties.map(key=>[key,computed.getPropertyValue(key)])),box:{x:box.x,y:box.y,width:box.width,height:box.height}},declared:{style:element.getAttribute('style')}};
          if(facts.length){
            const collected={};
            for(const fact of facts){
              if(fact==='scroll')collected.scroll={scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};
              else if(fact==='viewport')collected.viewport={width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio};
              else if(fact==='navigation'){const n=performance.getEntriesByType('navigation')[0];collected.navigation=n?{url:window.location.href,ttfb:n.responseStart-n.requestStart,domContentLoadedEventEnd:n.domContentLoadedEventEnd,loadEventEnd:n.loadEventEnd}:null;}
              else if(fact==='hit-test'){
                const at=point||{x:box.x+box.width/2,y:box.y+box.height/2},target=document.elementFromPoint(at.x,at.y);
                collected.hit_test={point:{x:at.x,y:at.y},target:target?{id:target.id,tag:target.tagName,class_name:target.getAttribute('class')}:null,inside_selected:Boolean(target&&element.contains(target))};
              }else if(fact==='reduced-motion'){
                const media=window.matchMedia('(prefers-reduced-motion: reduce)');
                collected.reduced_motion={media:media.media,matches:media.matches};
              }else if(fact==='active-element'){
                const active=document.activeElement,style=active?getComputedStyle(active):null;
                collected.active_element={id:active?active.id:null,tag:active?active.tagName:null,outlineStyle:style?style.outlineStyle:null,selected:active===element};
              }
            }
            observation.facts=collected;
          }
          return observation;
        });
      }
      if(observer.takeRecords().length)throw new Error('READ_ONLY_MUTATION_DETECTED');
      if(violations.length)throw new Error('READ_ONLY_VIOLATION:'+violations.join(','));
      return value;
    } finally {observer?.disconnect();for(const remove of listeners.reverse())remove();for(const restore of undo.reverse())restore();}
  },{id,args});
}
// This runner's live selector is the sole query exception; makeScope remains the shared URL validator.
function makeBrowserQaScope(value, topLevelSite) {
  const input=String(value);
  let target;
  try { target=new URL(input); } catch { throw safeError('INVALID_TARGET_SCOPE'); }
  const beforeHash=input.split('#',1)[0];
  const queryIndex=beforeHash.indexOf('?');
  const rawQuery=queryIndex<0?'':beforeHash.slice(queryIndex);
  if(target.username||target.password||target.hash||rawQuery!==target.search)throw safeError('INVALID_TARGET_SCOPE');
  if(rawQuery&&rawQuery!=='?source=live')throw safeError('INVALID_TARGET_SCOPE');
  target.search='';
  const scope=makeScope(target.href,topLevelSite);
  return rawQuery?{...scope,targetUrl:scope.targetUrl+rawQuery}:scope;
}
export async function runBrowserQa(args=process.argv.slice(2),inputEnv=process.env,selectionOptions={}) {
  let url,evidence;const a=[...args];while(a.length&&a[0]!=='--'){const flag=a.shift();if(flag==='--url')url=a.shift();else if(flag==='--evidence-dir')evidence=a.shift();else throw safeError('INVALID_RUN_ARGUMENT');}if(a.shift()!=='--'||!a.length||!evidence)throw safeError('INVALID_RUN_ARGUMENT');
  const env={...inputEnv};const sourceInput=env.BROWSER_QA_TICKET_SOURCE_WS;const site=env.BROWSER_QA_TICKET_TOP_LEVEL_SITE;delete env.BROWSER_QA_TICKET_SOURCE_WS;delete env.BROWSER_QA_TICKET_TOP_LEVEL_SITE;
  const scope=makeBrowserQaScope(url,site);const mode=env.BROWSER_QA_AUTH_MODE||'none';
  const selection=await selectBrowserEngine(env,selectionOptions);let engine=selection.engine;
  for(const fact of selection.fallbacks)console.log(JSON.stringify(fact));
  if(!['ego-lite','agent-browser','browser-use'].includes(engine))throw safeError('UNSUPPORTED_ENGINE');
  if(!['none','read-only-ticket-export'].includes(mode))throw safeError('UNSUPPORTED_AUTH_MODE');
  if(mode==='read-only-ticket-export'&&!sourceInput)throw safeError('SOURCE_UNAVAILABLE');
  const sourceEndpoint=mode==='read-only-ticket-export'?validateEndpoint(sourceInput):null;
  const host=scope.hostname;const allowed=host==='localhost'||host==='127.0.0.1'?'localhost,127.0.0.1':host;
  if(env.BROWSER_QA_ALLOWED_DOMAINS&&!env.BROWSER_QA_ALLOWED_DOMAINS.split(',').includes(host))throw safeError('TARGET_OUTSIDE_ALLOWED_DOMAINS');
  const root=await realpath(process.cwd());const session='whqa-'+createHash('sha256').update(root).digest('hex').slice(0,8)+'-'+process.pid;
  Object.assign(env,{BROWSER_QA_SESSION:session,BROWSER_QA_ENGINE:engine,BROWSER_QA_ALLOWED_DOMAINS:allowed,BROWSER_QA_AUTH_MODE:mode});
  if(engine==='browser-use')return runNativeQa({env,session,evidence,scenario:a,scope,sourceEndpoint,mode});
  if(engine==='ego-lite')return runEgoQa({env,session,evidence,scenario:a,scope,sourceEndpoint,mode,egoHelperPath:selection.egoHelperPath});
  await mkdir(resolve(evidence),{recursive:true});
  const ownedRoot=await mkdtemp(join(env.TMPDIR||tmpdir(),'whqa-'));
  Object.assign(env,{AGENT_BROWSER_SOCKET_DIR:ownedRoot,AGENT_BROWSER_HOME:ownedRoot});
  const aborter=new AbortController();let cancelled=0;let source,receiver;let cleanupOwnership;let sourceCollision=false;let receiverDistinct=!sourceEndpoint;let code=1;const secrets=new Set(sourceEndpoint?[sourceEndpoint]:[]);
  const stop=s=>{cancelled=s==='SIGINT'?130:143;aborter.abort();};const int=()=>stop('SIGINT'),term=()=>stop('SIGTERM');process.on('SIGINT',int);process.on('SIGTERM',term);
  try {
    const launch=engine==='agent-browser'?[engine,'--session',session,'--allowed-domains',allowed,'--content-boundaries','open']:[engine,'--session',session,'open'];
    const opened=await command(launch,env,{signal:aborter.signal,outputOnFailure:true,outputSecrets:secrets});if(opened.code)throw safeError('ENGINE_LAUNCH_FAILED');
    {
      const cdp=await command([engine,'--session',session,'get','cdp-url'],env,{signal:aborter.signal});
      let endpoint=cdp.stdout.trim();try{const parsed=JSON.parse(endpoint);endpoint=parsed.data?.url||parsed.data?.cdpUrl||parsed.data||parsed.url||endpoint;}catch{}
      endpoint=validateEndpoint(endpoint,'receiver');
      const identityEnv={...env,LC_ALL:'',LC_TIME:'C',LC_CTYPE:env.LC_ALL||env.LC_CTYPE||env.LANG||'C'};
      const ownership=await ownedReceiver(identityEnv,session,aborter.signal);
      receiver=await connectCdp(endpoint,{signal:aborter.signal,closeOnAbort:false});
      if(aborter.signal.aborted)throw safeError('CANCELLED');
      const identities=(await command(['ps','-axo','pid=,ppid=,lstart=,command='],identityEnv,{signal:aborter.signal})).stdout.split('\n').map(r=>r.trim());
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
// Node resolves an ESM URL through symlinks; compare both physical paths.
// A missing argv path can belong to an importing eval host, not this CLI.
const invokedModule=process.argv[1]?await realpath(process.argv[1]).catch(error=>{if(error.code==='ENOENT'||error.code==='ENOTDIR')return null;throw error;}):null;
if(invokedModule===await realpath(fileURLToPath(import.meta.url)))runBrowserQa().then(code=>{process.exitCode=code;}).catch(e=>{console.error(JSON.stringify({error:e.code||'QA_RUN_FAILED'}));process.exitCode=1;});
