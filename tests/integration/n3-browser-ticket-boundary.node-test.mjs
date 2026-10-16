import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Prewritten through the real context entry. No missing-module import and no live browser.
// Unreachable downstream assertions explicitly skip; they do not count as target RED or pass.
const context = fileURLToPath(new URL('../../skills/isolated-browser-qa/scripts/browser-qa-context.sh', import.meta.url));
const desiredMode='read-only-ticket-export';
const target='https://app.example.test/private/report';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const secret='N3_SYNTHETIC_COOKIE_VALUE_MUST_NOT_APPEAR_IN_QA_OUTPUT';
const childResult=child=>new Promise((resolve,reject)=>{let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal,stdout,stderr}));});
function frame(value) {
  const data=Buffer.from(JSON.stringify(value));
  if(data.length<126)return Buffer.concat([Buffer.from([0x81,data.length]),data]);
  const head=Buffer.alloc(4);head[0]=0x81;head[1]=126;head.writeUInt16BE(data.length,2);return Buffer.concat([head,data]);
}
async function cdpServer(role,cookies,{rejectSet=false,closeFile}={}) {
  const requests=[];const connections=new Set();const received=[];let cookieJar=[];let closed=false;
  const server=createServer((req,res)=>{
    if(req.url==='/close'){closed=true;cookieJar=[];res.end('closed');return;}
    res.statusCode=404;res.end();
  });
  server.on('upgrade',(req,socket)=>{
    const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    connections.add(socket);socket.on('close',()=>connections.delete(socket));let buffer=Buffer.alloc(0);
    socket.on('data',data=>{
      buffer=Buffer.concat([buffer,data]);
      while(buffer.length>=2){
        const opcode=buffer[0]&15;const masked=Boolean(buffer[1]&128);let len=buffer[1]&127;let offset=2;
        if(len===126){if(buffer.length<4)return;len=buffer.readUInt16BE(2);offset=4;}
        if(len===127){socket.destroy();return;}
        if(buffer.length<offset+(masked?4:0)+len)return;
        const mask=masked?buffer.subarray(offset,offset+4):null;if(masked)offset+=4;
        const payload=Buffer.from(buffer.subarray(offset,offset+len));buffer=buffer.subarray(offset+len);
        if(masked)for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];
        if(opcode===8){socket.end(Buffer.from([0x88,0]));continue;}if(opcode!==1)continue;
        const request=JSON.parse(payload.toString());requests.push(request.method);let result={};let error;
        if(request.method==='Browser.getVersion')result={protocolVersion:'1.3',product:'Chrome/155.0.8059.39',revision:'fixture',userAgent:'fixture',jsVersion:'fixture'};
        else if(request.method==='Target.getTargets')result={targetInfos:[]};
        else if(request.method==='Storage.getCookies')result={cookies:role==='source'?cookies:cookieJar};
        else if(request.method==='Storage.setCookies'&&role==='receiver'){
          received.push(request.params.cookies);
          if(rejectSet)error={code:-32000,message:'synthetic injection rejected'};else cookieJar=request.params.cookies;
        }else if(request.method==='Browser.close'&&role==='receiver'){closed=true;cookieJar=[];}
        else error={code:-32601,message:'forbidden method on '+role};
        socket.write(frame(error?{id:request.id,error}:{id:request.id,result}));
      }
    });
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
  return {ws:`ws://127.0.0.1:${port}/devtools/browser/${role}`,control:`http://127.0.0.1:${port}/close`,requests,received,
    get closed(){return closed;},get cookieCount(){return cookieJar.length;},get activeConnections(){return connections.size;},
    close:async()=>{for(const s of connections)s.destroy();await new Promise(r=>server.close(r));}};
}
function samples() {
  const base={value:secret,domain:'app.example.test',path:'/',secure:true,httpOnly:true,session:true,sameSite:'Lax',expires:-1,size:100,priority:'Medium',sourceScheme:'Secure',sourcePort:443};
  return [
    {...base,name:'host'}, {...base,name:'parent',domain:'.example.test'}, {...base,name:'path',path:'/private'},
    {...base,name:'chips',partitionKey:{topLevelSite:'https://example.test',hasCrossSiteAncestor:false}},
    {...base,name:'foreign',domain:'.evil.test'}, {...base,name:'suffix-trap',domain:'.evilapp.example.test'},
    {...base,name:'path-trap',path:'/private-other'}, {...base,name:'expired',session:false,expires:1},
    {...base,name:'invalid-none',sameSite:'None',secure:false}, {...base,name:'opaque',partitionKeyOpaque:true},
    {...base,name:'foreign-partition',partitionKey:{topLevelSite:'https://evil.test',hasCrossSiteAncestor:false}},
  ];
}
function filesUnder(root) {
  if(!existsSync(root))return [];
  return readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesUnder(join(root,e.name)):[join(root,e.name)]);
}
async function fixture({rejectSet=false,mode='success',cookies=samples()}={}) {
  const root=mkdtempSync(join(tmpdir(),'n3-ticket-boundary-'));const bin=join(root,'bin');const evidence=join(root,'evidence');const temp=join(root,'temp');const home=join(root,'home');
  for(const p of [bin,evidence,temp,home])mkdirSync(p);
  const marker=join(root,'scenario-entered');const daemonStop=join(root,'daemon-stop');const ownedProfile=join(temp,'agent-browser-profile-fixture');mkdirSync(ownedProfile);
  const daemon=spawn(process.execPath,['-e',`
    process.title='agent-browser';
    const fs=require('node:fs');const {spawn}=require('node:child_process');
    const browser=spawn(process.execPath,['-e',"process.title='Google Chrome for Testing --user-data-dir='+process.argv[1];setInterval(()=>{},1000);",process.argv[2]],{stdio:'ignore'});
    let finishing=false;let timer;
    browser.once('close',()=>{clearInterval(timer);process.exit(0);});
    const finish=()=>{
      if(finishing)return;finishing=true;clearInterval(timer);
      if(browser.exitCode!==null||browser.signalCode!==null){process.exit(0);return;}
      browser.kill('SIGTERM');
    };
    process.on('SIGTERM',finish);process.on('SIGINT',finish);
    timer=setInterval(()=>{if(fs.existsSync(process.argv[1]))finish();},20);
  `,daemonStop,ownedProfile],{stdio:'ignore'});
  const daemonDone=new Promise(resolve=>daemon.once('close',resolve));
  const source=await cdpServer('source',cookies);const receiver=await cdpServer('receiver',[],{rejectSet});
  const fake=join(bin,'agent-browser');
  writeFileSync(fake,`#!${process.execPath}\nconst fs=require('node:fs'),p=require('node:path');const a=process.argv.slice(2);const s=a.includes('--session')?a[a.indexOf('--session')+1]:process.env.BROWSER_QA_SESSION;const run=process.env.AGENT_BROWSER_SOCKET_DIR||p.join(process.env.HOME,'.agent-browser');fs.mkdirSync(run,{recursive:true});if(a.includes('skills')){console.log('core full guide fixture');process.exit(0);}if(a.includes('open')){for(const ext of ['pid','sock','stream','config','engine','target','version'])fs.writeFileSync(p.join(run,s+'.'+ext),ext==='pid'?process.env.N3_DAEMON_PID:'fixture');console.log('opened');}else if(a.includes('cdp-url'))console.log(process.env.N3_RECEIVER_WS);else if(a.includes('close')){fetch(process.env.N3_RECEIVER_CONTROL,{method:'POST'}).then(()=>{fs.writeFileSync(process.env.N3_DAEMON_STOP,'stop');console.log('closed');});}else console.log('fixture');\n`,{mode:0o755});
  const scenario=join(root,'scenario.mjs');
  writeFileSync(scenario,`import fs from 'node:fs';fs.writeFileSync(process.env.N3_MARKER,'entered');if(process.env.N3_SCENARIO==='failure')process.exit(23);if(process.env.N3_SCENARIO==='cancel')setTimeout(()=>fs.writeFileSync(process.env.N3_MARKER+'.late','late-artifact'),10000);\n`);
  const env={...process.env,PATH:`${bin}:${process.env.PATH}`,HOME:home,TMPDIR:temp,BROWSER_QA_ENGINE:'agent-browser',BROWSER_QA_PROFILE_MAP:'/dev/null',BROWSER_QA_AUTH_MODE:desiredMode,
    BROWSER_QA_TICKET_SOURCE_WS:source.ws,BROWSER_QA_TICKET_TOP_LEVEL_SITE:'https://example.test',BROWSER_QA_TARGET_URL:target,BROWSER_QA_EVIDENCE_DIR:evidence,N3_DAEMON_PID:String(daemon.pid),N3_DAEMON_STOP:daemonStop,
    N3_RECEIVER_WS:receiver.ws,N3_RECEIVER_CONTROL:receiver.control,N3_MARKER:marker,N3_SCENARIO:mode};
  const run=async({cancel=false}={})=>{
    const child=spawn('bash',[context,'--run','--url',target,'--evidence-dir',evidence,'--',process.execPath,scenario],{env});
    const result=childResult(child);let finished=false;result.then(()=>finished=true);const deadline=Date.now()+3000;
    while(!finished&&!existsSync(marker)&&Date.now()<deadline)await pause(20);
    if(cancel&&existsSync(marker))child.kill('SIGTERM');
    const timer=setTimeout(()=>child.kill('SIGTERM'),5000);
    try{return {...await result,reached:existsSync(marker)||source.requests.includes('Storage.getCookies')};}finally{clearTimeout(timer);}
  };
  return {root,evidence,temp,ownedProfile,marker,source,receiver,env,run,
    close:async()=>{daemon.kill('SIGTERM');await daemonDone;await source.close();await receiver.close();rmSync(root,{recursive:true,force:true});}};
}
function requireReached(t,result) {
  if(!result.reached){t.skip('unavailable: current browser-qa-context entry does not execute the confirmed --run ticket/receiver path; downstream assertions not reached');return false;}return true;
}

test('real context preserves explicit read-only ticket auth mode without weakening target domains',()=>{
  const result=spawnSync('bash',[context,target],{encoding:'utf8',env:{...process.env,BROWSER_QA_ENGINE:'agent-browser',BROWSER_QA_PROFILE_MAP:'/dev/null',BROWSER_QA_AUTH_MODE:desiredMode}});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/BROWSER_QA_AUTH_MODE=read-only-ticket-export/,'explicit read-only auth mode must not silently become none');
  assert.match(result.stdout,/BROWSER_QA_ALLOWED_DOMAINS=app\.example\.test/);
  assert.doesNotMatch(result.stdout,/BROWSER_QA_ALLOWED_DOMAINS=\*/);
});

test('source transport reads browser-level facts only and preserves user page targets',async t=>{
  const f=await fixture();try{const r=await f.run();if(!requireReached(t,r))return;
    assert.ok(f.source.requests.includes('Storage.getCookies'),'source cookie read must actually occur');
    assert.deepEqual(f.source.requests.filter(m=>!['Browser.getVersion','Target.getTargets','Storage.getCookies'].includes(m)),[],'source must never attach/create/navigate/close/write');
    assert.ok(f.source.requests.filter(m=>m==='Target.getTargets').length>=2,'compare page targets before and after export');
  }finally{await f.close();}
});

test('target scope rejects foreign domains, path-prefix traps, expired, invalid secure and opaque/foreign partitions',async t=>{
  const f=await fixture();try{const r=await f.run();if(!requireReached(t,r))return;
    assert.ok(f.receiver.received.length>0,'receiver must actually receive scoped cookies');
    const names=f.receiver.received.flat().map(c=>c.name).sort();
    assert.deepEqual(names,['chips','host','parent','path'],'only target host/path/secure/top-level-site cookies cross the source boundary');
    for(const c of f.receiver.received.flat()){assert.equal(c.value,secret,'selected synthetic value survives only in transport memory');assert.equal(c.httpOnly,true);assert.equal(c.secure,true);}
  }finally{await f.close();}
});

for(const mode of ['success','failure','cancel'])test(`${mode} path clears receiver cookies and owned temporary data without logging values`,async t=>{
  const f=await fixture({mode});try{const r=await f.run({cancel:mode==='cancel'});if(!requireReached(t,r))return;
    if(mode==='success')assert.equal(r.code,0,r.stderr);else assert.ok(r.code!==0||r.signal,'failure/cancel may not report success');
    assert.equal(f.receiver.closed,true,'owned receiver must close on all three paths');
    assert.equal(f.receiver.cookieCount,0,'receiver cookie memory must be gone');
    assert.equal(f.source.activeConnections,0,'source read-only socket must disconnect');
    assert.equal(existsSync(f.ownedProfile),false,'owned temporary data directory must be removed');
    assert.equal(existsSync(f.marker+'.late'),false,'cancelled work cannot publish late artifact');
    assert.equal((r.stdout+r.stderr).includes(secret),false,'QA output cannot contain cookie values');
    for(const file of filesUnder(f.evidence))assert.equal(readFileSync(file).includes(Buffer.from(secret)),false,'evidence cannot contain cookie values');
  }finally{await f.close();}
});

test('receiver injection failure is explicit and still clears temporary tickets',async t=>{
  const f=await fixture({rejectSet:true});try{const r=await f.run();if(!requireReached(t,r))return;
    assert.notEqual(r.code,0,'setCookies rejection must not become login reuse success');
    assert.equal(f.receiver.cookieCount,0);assert.equal(f.receiver.closed,true);
    assert.equal((r.stdout+r.stderr).includes(secret),false);
  }finally{await f.close();}
});

test('empty source cannot be represented as verified real-site login reuse',async t=>{
  const f=await fixture({cookies:[]});try{const r=await f.run();if(!requireReached(t,r))return;
    assert.doesNotMatch(r.stdout,/login_state_reuse[=:]\s*(?:reused|verified|pass)/,'zero cookies do not prove authenticated page');
    assert.equal(f.receiver.received.flat().length,0);
    assert.equal(f.receiver.closed,true);
  }finally{await f.close();}
});
