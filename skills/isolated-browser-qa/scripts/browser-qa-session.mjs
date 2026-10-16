import {spawn} from 'node:child_process';
import {readFile, mkdir, realpath, mkdtemp, rm} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {connectCdp,validateEndpoint,makeScope,transferTargetCookies,safeError} from './browser-qa-tickets.mjs';
const here=dirname(fileURLToPath(import.meta.url));
function command(argv,env,{signal,inherit=false}={}) {if(signal?.aborted)return Promise.reject(safeError('CANCELLED'));return new Promise((resolve,reject)=>{const c=spawn(argv[0],argv.slice(1),{env,detached:true,stdio:inherit?'inherit':['ignore','pipe','pipe']});let stdout='';if(!inherit){c.stdout.on('data',b=>stdout+=b);c.stderr.resume();}const abort=()=>{try{process.kill(-c.pid,'SIGTERM');}catch{}};signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();c.once('error',()=>reject(safeError('COMMAND_UNAVAILABLE')));c.once('close',(code)=>{signal?.removeEventListener('abort',abort);resolve({code:code??143,stdout});});});}
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
export async function runBrowserQa(args=process.argv.slice(2),inputEnv=process.env) {
  let url,evidence;const a=[...args];while(a.length&&a[0]!=='--'){const flag=a.shift();if(flag==='--url')url=a.shift();else if(flag==='--evidence-dir')evidence=a.shift();else throw safeError('INVALID_RUN_ARGUMENT');}if(a.shift()!=='--'||!a.length||!evidence)throw safeError('INVALID_RUN_ARGUMENT');
  const env={...inputEnv};const sourceInput=env.BROWSER_QA_TICKET_SOURCE_WS;const site=env.BROWSER_QA_TICKET_TOP_LEVEL_SITE;delete env.BROWSER_QA_TICKET_SOURCE_WS;delete env.BROWSER_QA_TICKET_TOP_LEVEL_SITE;
  const scope=makeScope(url,site);const mode=env.BROWSER_QA_AUTH_MODE||'none';const engine=env.BROWSER_QA_ENGINE||'agent-browser';
  if(!['agent-browser','browser-use'].includes(engine))throw safeError('UNSUPPORTED_ENGINE');
  // Native browser-use requires open URL and has no get cdp-url/agent-browser pid contract.
  // Preserve its manual isolated route rather than launching under false ownership.
  if(engine==='browser-use')throw safeError('BROWSER_USE_RUN_UNAVAILABLE');
  if(!['none','read-only-ticket-export'].includes(mode))throw safeError('UNSUPPORTED_AUTH_MODE');
  if(mode==='read-only-ticket-export'&&!sourceInput)throw safeError('SOURCE_UNAVAILABLE');
  const sourceEndpoint=mode==='read-only-ticket-export'?validateEndpoint(sourceInput):null;
  const host=scope.hostname;const allowed=host==='localhost'||host==='127.0.0.1'?'localhost,127.0.0.1':host;
  if(env.BROWSER_QA_ALLOWED_DOMAINS&&!env.BROWSER_QA_ALLOWED_DOMAINS.split(',').includes(host))throw safeError('TARGET_OUTSIDE_ALLOWED_DOMAINS');
  const root=await realpath(process.cwd());const session='whqa-'+createHash('sha256').update(root).digest('hex').slice(0,8)+'-'+process.pid;
  Object.assign(env,{BROWSER_QA_SESSION:session,BROWSER_QA_ENGINE:engine,BROWSER_QA_ALLOWED_DOMAINS:allowed,BROWSER_QA_AUTH_MODE:mode});
  await mkdir(resolve(evidence),{recursive:true});
  const ownedRoot=await mkdtemp(join(env.TMPDIR||tmpdir(),'whqa-'));
  Object.assign(env,{AGENT_BROWSER_SOCKET_DIR:ownedRoot,AGENT_BROWSER_HOME:ownedRoot});
  const aborter=new AbortController();let cancelled=0;let source,receiver;let cleanupOwnership;let sourceCollision=false;let receiverDistinct=!sourceEndpoint;let code=1;
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
      await transferTargetCookies({source,receiver,scope,signal:aborter.signal,report:r=>console.log(JSON.stringify(r))});source.close();source=null;}
    }
    const navigated=await command([engine,'--session',session,'open',scope.targetUrl],env,{signal:aborter.signal});if(navigated.code)throw safeError('TARGET_NAVIGATION_FAILED');
    const result=await command(a,env,{signal:aborter.signal,inherit:true});code=result.code;
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
  }
  return cancelled||code;
}
if(process.argv[1]===fileURLToPath(import.meta.url))runBrowserQa().then(code=>{process.exitCode=code;}).catch(e=>{console.error(JSON.stringify({error:e.code||'QA_RUN_FAILED'}));process.exitCode=1;});
