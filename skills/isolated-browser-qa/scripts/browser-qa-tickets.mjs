import {channel} from 'node:diagnostics_channel';
import {AsyncLocalStorage} from 'node:async_hooks';
const connectionContext=new AsyncLocalStorage();
// CDP payloads and connection capabilities stay in this process's memory.
export function safeError(code, method) { const e = new Error(code); e.code = code; e.method = method; return e; }
export function validateEndpoint(value, role = 'source') {
  const code = role === 'receiver' ? 'INVALID_RECEIVER_ENDPOINT' : 'INVALID_SOURCE_ENDPOINT';
  let u; try { u = new URL(value); } catch { throw safeError(code); }
  if (!['ws:', 'wss:'].includes(u.protocol) || !['127.0.0.1', '[::1]', 'localhost'].includes(u.hostname) || !u.port || u.username || u.password || u.search || u.hash || !/^\/devtools\/browser\/[^/]+$/.test(u.pathname)) throw safeError(code);
  return u.href;
}
export function makeScope(value, topLevelSite) {
  let u; try { u = new URL(value); } catch { throw safeError('INVALID_TARGET_SCOPE'); }
  if (!['http:', 'https:'].includes(u.protocol) || !u.hostname || u.username || u.password || u.search || u.hash) throw safeError('INVALID_TARGET_SCOPE');
  let site = null;
  if (topLevelSite) {
    let t; try { t = new URL(topLevelSite); } catch { throw safeError('INVALID_TOP_LEVEL_SITE'); }
    if (t.protocol !== 'https:' || u.protocol !== 'https:' || t.port || t.username || t.password || t.search || t.hash || t.pathname !== '/' || !(u.hostname === t.hostname || u.hostname.endsWith('.' + t.hostname))) throw safeError('INVALID_TOP_LEVEL_SITE');
    site = t.origin;
  }
  return {targetUrl:u.origin+u.pathname,hostname:u.hostname,pathname:u.pathname,secure:u.protocol==='https:',topLevelSite:site};
}
export async function connectCdp(endpoint, {signal,closeOnAbort=true} = {}) {
  if(signal?.aborted)throw safeError('CANCELLED');
  const transport={};
  const connected=channel('undici:client:connected');
  const observe=({socket})=>{if(connectionContext.getStore()===transport)transport.peer={address:socket.remoteAddress?.replace(/^::ffff:/,''),port:socket.remotePort};};
  connected.subscribe(observe);
  const ws = connectionContext.run(transport,()=>new WebSocket(endpoint)); let id=0; const pending=new Map();
  const fail=()=>{for(const p of pending.values())p.reject(safeError('CDP_CONNECTION_CLOSED'));pending.clear();};
  ws.addEventListener('message',e=>{let m;try{m=JSON.parse(String(e.data));}catch{return;}const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(safeError('CDP_METHOD_FAILED',p.method)):p.resolve(m.result);});
  ws.addEventListener('close',fail);ws.addEventListener('error',fail);
  try {await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(safeError('CDP_CONNECT_TIMEOUT'));},3000);const abort=()=>{clearTimeout(timer);ws.close();reject(safeError('CANCELLED'));};signal?.addEventListener('abort',abort,{once:true});ws.addEventListener('open',()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve();},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(safeError('CDP_CONNECT_FAILED'));},{once:true});});} finally {connected.unsubscribe(observe);}
  if(!transport.peer?.address||!transport.peer?.port){ws.close();throw safeError('CDP_PEER_UNAVAILABLE');}
  const abort=()=>{fail();ws.close();};if(closeOnAbort)signal?.addEventListener('abort',abort,{once:true});
  const peerIdentity=[transport.peer.address,transport.peer.port,new URL(endpoint).pathname].join('|');
  return {peerIdentity,call(method,params={}) {if(closeOnAbort&&signal?.aborted)return Promise.reject(safeError('CANCELLED'));return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(safeError('CDP_METHOD_TIMEOUT',method));},3000);pending.set(n,{resolve,reject,timer,method});ws.send(JSON.stringify({id:n,method,params}));});}, close(){signal?.removeEventListener('abort',abort);for(const p of pending.values())clearTimeout(p.timer);fail();ws.close();}};
}
export function filterTargetCookies(cookies, scope, now=Date.now()/1000) {
  return cookies.filter(c=>{
    if(typeof c.domain!=='string'||typeof c.path!=='string')return false;
    const domain=c.domain.startsWith('.')?scope.hostname===c.domain.slice(1)||scope.hostname.endsWith(c.domain):scope.hostname===c.domain;
    const path=scope.pathname===c.path||scope.pathname.startsWith(c.path.endsWith('/')?c.path:c.path+'/');
    if(!domain||!path||(c.secure&&!scope.secure)||(!c.session&&c.expires>0&&c.expires<=now)||(c.sameSite==='None'&&!c.secure)||c.partitionKeyOpaque)return false;
    if(c.partitionKey){const k=c.partitionKey;if(!scope.topLevelSite||typeof k!=='object'||Object.keys(k).some(key=>!['topLevelSite','hasCrossSiteAncestor'].includes(key))||k.topLevelSite!==scope.topLevelSite||k.hasCrossSiteAncestor!==false)return false;}
    return true;
  }).map(c=>{const out={};for(const k of ['name','value','domain','path','secure','httpOnly','sameSite','partitionKey'])if(c[k]!==undefined)out[k]=c[k];if(!c.session&&c.expires>0)out.expires=c.expires;return out;});
}
export async function transferTargetCookies({source,receiver,scope,signal,report=()=>{}}) {
  await source.call('Browser.getVersion');
  const before=await source.call('Target.getTargets');
  let payload=await source.call('Storage.getCookies');let selected=filterTargetCookies(payload.cookies||[],scope);payload=null;
  const after=await source.call('Target.getTargets');
  if(JSON.stringify(before)!==JSON.stringify(after))throw safeError('SOURCE_TARGETS_CHANGED');
  if(signal?.aborted)throw safeError('CANCELLED');
  try {if(selected.length)await receiver.call('Storage.setCookies',{cookies:selected});report({ticket_count:selected.length,partition_coverage:scope.topLevelSite?'scoped':'unknown'});} finally {selected.length=0;}
}
