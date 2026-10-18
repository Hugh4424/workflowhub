import { accessSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

import { fileURLToPath } from "node:url";
import { validateSkillBundle } from "../../../runtime/adapters/local-skill-resolver.mjs";
const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
const context = readFileSync(new URL("../scripts/browser-qa-context.sh", import.meta.url), "utf8");

describe("isolated-browser-qa portability", () => {
  it("resolves from workflowhub package root", () => {
    expect(skill).toContain("workflowhub_package_root");
    expect(skill).not.toMatch(/\/Users\//);
  });

  it("uses workflowhub-owned profile namespace", () => {
    expect(context).toContain(".config/workflowhub/browser-qa-profiles.conf");
    expect(context).toContain("workflowhub-qa-");
  });
});

describe("isolated-browser-qa executable context", () => {
  it("derives a localhost-only session without touching a browser", () => {
    const output = execFileSync("bash", [new URL("../scripts/browser-qa-context.sh", import.meta.url).pathname, "http://localhost:3000"], {
      encoding: "utf8",
      env: { ...process.env, BROWSER_QA_ENGINE: "agent-browser", BROWSER_QA_PROFILE_MAP: "/dev/null" },
    });
    expect(output).toContain("BROWSER_QA_SESSION=workflowhub-qa-");
    expect(output).toContain("BROWSER_QA_HOST=localhost");
    expect(output).toContain("BROWSER_QA_ALLOWED_DOMAINS=localhost\\,127.0.0.1");
  });

  it("fails loud for an unsupported engine", () => {
    expect(() => execFileSync("bash", [new URL("../scripts/browser-qa-context.sh", import.meta.url).pathname], {
      env: { ...process.env, BROWSER_QA_ENGINE: "unknown" }, stdio: "pipe",
    })).toThrow();
  });
});

describe("isolated-browser-qa evidence contract", () => {
  it.each([
    ["route/page and scenario", /route[\s\S]{0,100}page[\s\S]{0,120}scenario/i],
    ["tool, engine, and derived session", /tool[\s\S]{0,100}engine[\s\S]{0,120}(?:derived )?session/i],
    ["auth mode and login-state reuse", /auth(?:entication)? mode[\s\S]{0,140}(?:login state|登录态)[\s\S]{0,80}reus/i],
    ["measured or explained performance", /performance[\s\S]{0,160}(?:measured|not_measured)[\s\S]{0,120}reason/i],
    ["screenshot references", /screenshots?[\s\S]{0,100}(?:ref|reference)/i],
    ["test command, file, output, and exit", /test command[\s\S]{0,100}test file[\s\S]{0,100}output[\s\S]{0,100}exit/i],
    ["completed cleanup", /cleanup[\s\S]{0,100}completed/i],
    ["no engine switch", /engine_switch[\s\S]{0,40}no/i],
  ])("requires %s in the reportable evidence", (_label, pattern) => {
    expect(skill, `ORACLE-BQA: missing ${_label} contract`).toMatch(pattern);
  });

  it("forbids credential and profile contents in evidence", () => {
    expect(skill).toMatch(/(?:cookie|token|profile content)[\s\S]{0,180}(?:must not|never|禁止|不得)/i);
  });
});


describe("isolated-browser-qa bundled lifecycle", () => {
  it("resolves both executable private helpers to readable files", () => {
    const root = fileURLToPath(new URL("../../../", import.meta.url));
    const checked = validateSkillBundle(root, "skills/isolated-browser-qa/skill-bundle.json", "skills/isolated-browser-qa/SKILL.md");
    for (const file of ["scripts/browser-qa-session.mjs", "scripts/browser-qa-tickets.mjs"]) {
      const entry = checked.fileEntries.find(entry => entry.path === file);
      expect(entry).toBeDefined();
      expect(checked.files).toContain(entry.resolved);
      accessSync(entry.resolved);
    }
  });
});

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const contextEntry = fileURLToPath(new URL('../scripts/browser-qa-context.sh', import.meta.url));
function gateway(args, env) {
  return new Promise(resolve => {
    const child = spawn('bash', [contextEntry, '--run', ...args], {env:{...process.env,...env}});
    let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
    child.once('close',code=>resolve({code,stdout,stderr}));
  });
}
const invalidArgs = ['--url','https://app.example.test/private','--evidence-dir',tmpdir(),'--',process.execPath,'-e','process.exit(99)'];
describe('isolated-browser-qa gateway boundary', () => {
  it('missing source never connects or falls back to none', async () => {
    const r=await gateway(invalidArgs,{BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:''});
    expect(r.code).toBe(1);expect(r.stderr).toContain('SOURCE_UNAVAILABLE');
  });
  it('invalid source endpoint is rejected before connection', async () => {
    const r=await gateway(invalidArgs,{BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:'ws://127.0.0.1:9222/devtools/page/forbidden'});
    expect(r.code).toBe(1);expect(r.stderr).toContain('INVALID_SOURCE_ENDPOINT');expect(r.stderr).not.toContain('9222');
  });
  it('invalid target scope never widens allowed domains', async () => {
    const r=await gateway(invalidArgs,{BROWSER_QA_AUTH_MODE:'none',BROWSER_QA_ALLOWED_DOMAINS:'other.example.test'});
    expect(r.code).toBe(1);expect(r.stderr).toContain('TARGET_OUTSIDE_ALLOWED_DOMAINS');
  });
  it('invalid top-level site is rejected before ticket transfer', async () => {
    const source=await memoryCdp([]);
    try {
      const r=await gateway(invalidArgs,{BROWSER_QA_ENGINE:'unsupported-synthetic-engine',BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:source.endpoint,BROWSER_QA_TICKET_TOP_LEVEL_SITE:'https://evil.test'});
      expect(r.code).toBe(1);expect(r.stderr).toContain('INVALID_TOP_LEVEL_SITE');expect(r.stderr).not.toContain('UNSUPPORTED_ENGINE');
      expect(source.methods).toEqual([]);expect(source.peers).toEqual([]);
    } finally { await source.close(); }
  });
});

// Independent transport fixture exercises the public shell seam, never a helper-only call.
async function memoryCdp(cookies, {beforeHandshake, host='127.0.0.1', port=0} = {}) {
  const sockets=new Set();const received=[];const methods=[];const peers=[];
  const server=createServer();
  server.on('upgrade',async(req,socket)=>{
    peers.push(socket.remoteAddress);
    sockets.add(socket);socket.on('close',()=>sockets.delete(socket));
    await beforeHandshake?.();
    if (socket.destroyed) return;
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');
    let bytes=Buffer.alloc(0);socket.on('data',chunk=>{
      bytes=Buffer.concat([bytes,chunk]);while(bytes.length>=2){
        const opcode=bytes[0]&15;let n=bytes[1]&127,offset=2;const masked=bytes[1]&128;
        if(n===126){if(bytes.length<4)return;n=bytes.readUInt16BE(2);offset=4;}
        if(n===127){socket.destroy();return;}if(bytes.length<offset+(masked?4:0)+n)return;
        const mask=bytes.subarray(offset,offset+4);if(masked)offset+=4;const body=Buffer.from(bytes.subarray(offset,offset+n));bytes=bytes.subarray(offset+n);
        if(masked)for(let i=0;i<body.length;i++)body[i]^=mask[i%4];if(opcode===8){socket.end(Buffer.from([0x88,0]));continue;}if(opcode!==1)continue;
        const m=JSON.parse(body);methods.push(m.method);let result={};if(m.method==='Storage.getCookies')result={cookies};if(m.method==='Target.getTargets')result={targetInfos:[]};if(m.method==='Storage.setCookies')received.push(...m.params.cookies);
        const out=Buffer.from(JSON.stringify({id:m.id,result}));let header;if(out.length<126)header=Buffer.from([0x81,out.length]);else{header=Buffer.alloc(4);header[0]=0x81;header[1]=126;header.writeUInt16BE(out.length,2);}socket.write(Buffer.concat([header,out]));
      }
    });
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return {endpoint:`ws://${host.includes(':')?'['+host+']':host}:${server.address().port}/devtools/browser/controlled`,received,methods,peers,close:async()=>{for(const s of sockets)s.destroy();await new Promise(r=>server.close(r));}};
}
async function runBoundaryFixture({receiverEndpoint, samePortOtherHost=false, sameReceiverViaLocalhost=false} = {}) {
  const root=mkdtempSync(join(tmpdir(),'bqa-contract-'));const bin=join(root,'bin');const evidence=join(root,'evidence');const profile=join(root,'agent-browser-profile-owned');for(const p of [bin,evidence,profile])mkdirSync(p);
  const resourceHandle=join(root,'owned-resource-handle');
  const cookie={name:'ordinary',value:'CONTROLLED_MEMORY_VALUE',domain:'app.example.test',path:'/',secure:true,httpOnly:true,session:true};
  const source=await memoryCdp([cookie,{...cookie,name:'partition',partitionKey:{topLevelSite:'https://example.test',hasCrossSiteAncestor:false}}]);const receiver=await memoryCdp([],samePortOtherHost?{host:'::1',port:Number(new URL(source.endpoint).port)}:sameReceiverViaLocalhost?{host:'::1'}:{});
  const sourceUrl=new URL(sameReceiverViaLocalhost?receiver.endpoint:source.endpoint);
  if(sameReceiverViaLocalhost)sourceUrl.hostname='localhost';
  const daemon=spawn(process.execPath,['-e',`process.title='agent-browser';const {spawn}=require('node:child_process');const b=spawn(process.execPath,['-e',"process.title='Chrome --user-data-dir='+process.argv[1];setInterval(()=>{},1000)",process.argv[1]],{stdio:'ignore'});process.on('SIGTERM',()=>b.kill('SIGTERM'));b.on('close',()=>process.exit());setInterval(()=>{},1000);`,profile],{stdio:'ignore'});
  writeFileSync(join(bin,'agent-browser'),`#!${process.execPath}\nconst fs=require('node:fs'),p=require('node:path'),a=process.argv.slice(2),s=a[a.indexOf('--session')+1];if(a.includes('open')){fs.writeFileSync(p.join(process.env.AGENT_BROWSER_SOCKET_DIR,s+'.pid'),process.env.BQA_DAEMON);fs.writeFileSync(process.env.BQA_RESOURCE_HANDLE,JSON.stringify({session:s,ownedRoot:process.env.AGENT_BROWSER_SOCKET_DIR}));}if(a.includes('cdp-url'))console.log(process.env.BQA_RECEIVER);if(a.includes('close'))process.kill(Number(process.env.BQA_DAEMON),'SIGTERM');\n`,{mode:0o755});
  try {
    const args=['--url','https://app.example.test/private','--evidence-dir',evidence,'--',process.execPath,'-e',`const keys=['BROWSER_QA_TICKET_SOURCE_WS','BROWSER_QA_TICKET_TOP_LEVEL_SITE'];console.log('capability_present='+keys.some(k=>process.env[k]));console.log('payload_present='+Object.values(process.env).some(v=>v.includes('CONTROLLED_MEMORY_VALUE')));`];
    const r=await gateway(args,{PATH:bin+':'+process.env.PATH,TMPDIR:root,BROWSER_QA_ENGINE:'agent-browser',BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:sourceUrl.href,BROWSER_QA_TICKET_TOP_LEVEL_SITE:'',BQA_RECEIVER:receiverEndpoint??receiver.endpoint,BQA_DAEMON:String(daemon.pid),BQA_RESOURCE_HANDLE:resourceHandle});
    const cleanupHandle=JSON.parse(readFileSync(resourceHandle,'utf8'));
    return {r,received:receiver.received,receiverMethods:receiver.methods,receiverPeers:receiver.peers,cleanupHandle,
      retainedOwnedMetadata:existsSync(join(cleanupHandle.ownedRoot,cleanupHandle.session+'.pid')),retainedOwnedProfile:existsSync(profile)};
  } finally {daemon.kill('SIGTERM');await source.close();await receiver.close();rmSync(root,{recursive:true,force:true});}
}
describe('isolated-browser-qa transport boundary',()=>{
  it('missing top-level site omits partition cookies but keeps eligible unpartitioned cookies',async()=>{
    const {r,received}=await runBoundaryFixture();expect(r.code,r.stderr).toBe(0);expect(received.map(c=>c.name)).toEqual(['ordinary']);expect(r.stdout).toContain('"partition_coverage":"unknown"');
  });
  it('scenario environment excludes source capability and ticket payload',async()=>{
    const {r}=await runBoundaryFixture();expect(r.code,r.stderr).toBe(0);expect(r.stdout).toContain('capability_present=false');expect(r.stdout).toContain('payload_present=false');expect(r.stdout+r.stderr).not.toContain('CONTROLLED_MEMORY_VALUE');
  });
});

import { existsSync } from 'node:fs';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForOwnedFixture(check, label) {
  const until = Date.now() + 4000;
  while (!check() && Date.now() < until) await delay(10);
  if (!check()) throw new Error(`owned fixture did not reach ${label}`);
}

// ORACLE-P7-CANCEL-AWAIT: a signal already delivered during ownership/CDP work
// forbids later target navigation and scenario launch. Drive the public shell
// entry with owned dummy processes and a local CDP server, never user Chrome.
async function cancelBetweenSteps(window) {
  const root = mkdtempSync(join(tmpdir(), 'bqa-cancel-window-'));
  const bin = join(root, 'bin'), evidence = join(root, 'evidence');
  const profile = join(root, 'agent-browser-profile-owned');
  for (const dir of [bin, evidence, profile]) mkdirSync(dir);
  const checkpoint = join(root, 'ownership-wait'), events = join(root, 'commands');
  const marker = join(evidence, 'scenario-entered');
  let handshakeReached = false, releaseHandshake;
  const handshakeGate = new Promise(resolve => { releaseHandshake = resolve; });
  const receiver = await memoryCdp([], {beforeHandshake: async () => {
    if (window === 'receiver-connect') { handshakeReached = true; await handshakeGate; }
  }});
  const daemon = spawn(process.execPath, ['-e', "process.title='agent-browser';const b=require('node:child_process').spawn(process.execPath,['-e',\"process.title='Chrome '+process.argv[1];setInterval(()=>{},1000)\",'--',process.argv[2]],{stdio:'ignore'});process.on('SIGTERM',()=>b.kill('SIGTERM'));b.on('close',()=>process.exit());setInterval(()=>{},1000);", 'agent-browser', '--user-data-dir='+profile], {stdio:'ignore'});
  const daemonDone = new Promise(resolve => daemon.once('close', resolve));
  writeFileSync(join(bin, 'agent-browser'), `#!${process.execPath}
const fs=require('node:fs'),p=require('node:path'),a=process.argv.slice(2),s=a[a.indexOf('--session')+1];
fs.appendFileSync(process.env.BQA_EVENTS,JSON.stringify(a)+'\\n');
if(a.includes('open'))fs.writeFileSync(p.join(process.env.AGENT_BROWSER_SOCKET_DIR,s+'.pid'),process.env.BQA_DAEMON);
if(a.includes('cdp-url'))console.log(process.env.BQA_RECEIVER);
if(a.includes('close')){try{process.kill(Number(process.env.BQA_DAEMON),'SIGTERM')}catch{}}
`, {mode:0o755});
  // Only the production ownership query pauses; cleanup reads actual OS facts.
  writeFileSync(join(bin, 'ps'), `#!${process.execPath}
const fs=require('node:fs'),a=process.argv.slice(2);
const run=()=>{const r=require('node:child_process').spawnSync('/bin/ps',a,{stdio:'inherit'});process.exit(r.status??1)};
if(process.env.BQA_WINDOW==='ownership-ps'&&a.some(x=>x.includes('lstart'))){fs.writeFileSync(process.env.BQA_CHECKPOINT,'waiting');setTimeout(run,500)}else run();
`, {mode:0o755});
  const scenario = join(root, 'scenario.mjs');
  writeFileSync(scenario, `import fs from 'node:fs';fs.writeFileSync(process.env.BQA_MARKER,'entered');setTimeout(()=>{},2500);`);
  const env = {...process.env, PATH:bin+':'+process.env.PATH, TMPDIR:root,
    BROWSER_QA_ENGINE:'agent-browser', BROWSER_QA_AUTH_MODE:'none',
    BROWSER_QA_ALLOWED_DOMAINS:'app.example.test', BROWSER_QA_TICKET_SOURCE_WS:'',
    BROWSER_QA_TICKET_TOP_LEVEL_SITE:'', BQA_DAEMON:String(daemon.pid),
    BQA_RECEIVER:receiver.endpoint, BQA_EVENTS:events, BQA_MARKER:marker,
    BQA_WINDOW:window, BQA_CHECKPOINT:checkpoint};
  const child = spawn('bash', [contextEntry, '--run', '--url', 'https://app.example.test/private',
    '--evidence-dir', evidence, '--', process.execPath, scenario], {env});
  let stdout='', stderr='';
  child.stdout.on('data', b => { stdout += b; }); child.stderr.on('data', b => { stderr += b; });
  const done = new Promise(resolve => child.once('close', (code, signal) => resolve({code,signal})));
  let watchdog;
  try {
    await waitForOwnedFixture(() => window === 'ownership-ps' ? existsSync(checkpoint) : handshakeReached, window);
    const cancelledAt = Date.now(); child.kill('SIGTERM');
    await delay(100); releaseHandshake();
    watchdog = setTimeout(() => child.kill('SIGTERM'), 7000);
    const result = await done;
    const commands = existsSync(events) ? readFileSync(events,'utf8').trim().split('\n').map(JSON.parse) : [];
    return {...result, elapsedMs:Date.now()-cancelledAt, stdout, stderr,
      targetNavigations:commands.filter(a => a.includes('https://app.example.test/private')).length,
      scenarioEntered:existsSync(marker), profileRemoved:!existsSync(profile)};
  } finally {
    clearTimeout(watchdog); releaseHandshake();
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    daemon.kill('SIGTERM'); await daemonDone; await receiver.close();
    rmSync(root,{recursive:true,force:true});
  }
}

describe('isolated-browser-qa cancellation between lifecycle steps', () => {
  it.each(['ownership-ps', 'receiver-connect'])('does not navigate or launch a scenario after cancellation during %s', async window => {
    const r = await cancelBetweenSteps(window);
    console.log(`ORACLE-P7-CANCEL-AWAIT ${window}: ${JSON.stringify(r)}`);
    expect(r.targetNavigations, 'a delivered cancellation must prevent target navigation').toBe(0);
    expect(r.scenarioEntered, 'a delivered cancellation must prevent scenario launch').toBe(false);
    expect(r.code, r.stderr).toBe(143);
    expect(r.elapsedMs, 'cancellation must not wait for the 2500 ms scenario').toBeLessThan(2200);
    expect(r.profileRemoved, 'owned receiver profile must be removed after cancellation').toBe(true);
  }, 15000);
});

// ORACLE-P7-START-IDENTITY: P7 requires PID/start-time/data-dir identity.
// Reuse the public cleanup CLI with synthetic ps rows and a recorded os.kill;
// all metadata/profile paths belong to this fixture, no real process is signalled.
describe('isolated-browser-qa cleanup start identity', () => {
  it('preserves a replacement process and profile with the same PID/command but a changed start time', () => {
    const root=mkdtempSync(join(tmpdir(),'bqa-start-identity-'));
    const bin=join(root,'bin'), home=join(root,'home'), temp=join(root,'temp');
    for(const dir of [bin,home,temp])mkdirSync(dir);
    const session='owned-start-identity', profile=join(temp,'agent-browser-profile-replacement');mkdirSync(profile);
    const retained=join(profile,'replacement-data');writeFileSync(retained,'must survive');
    const state=join(root,'state'), events=join(root,'signals');
    writeFileSync(state,'original');writeFileSync(events,'');writeFileSync(join(home,session+'.pid'),'701001');
    const python=execFileSync('/bin/sh',['-c','command -v python3'],{encoding:'utf8'}).trim();
    writeFileSync(join(bin,'agent-browser'),`#!${python}\nimport os,pathlib\npathlib.Path(os.environ['BQA_STATE']).write_text('replacement')\n`,{mode:0o755});
    writeFileSync(join(bin,'python3'),`#!${python}
import os,sys,json,subprocess,pathlib
source=sys.stdin.read();sys.argv=sys.argv[1:]
state=pathlib.Path(os.environ['BQA_STATE']);events=pathlib.Path(os.environ['BQA_EVENTS']);profile=os.environ['BQA_PROFILE']
def check_output(args,**kwargs):
 if args[0]=='lsof':return ''
 if args[0]!='ps':raise RuntimeError('fixture forbids subprocess '+repr(args))
 if state.read_text()=='killed':return ''
 stamp='Fri Oct 16 01:00:00 2026' if state.read_text()=='original' else 'Fri Oct 16 02:00:00 2026'
 rows=[(701001,1,'agent-browser'),(701002,701001,'Chrome --user-data-dir='+profile)]
 fields=args[-1].replace('=','').split(',')
 return '\\n'.join(' '.join(str({'pid':pid,'ppid':ppid,'lstart':stamp,'command':cmd}[field]) for field in fields) for pid,ppid,cmd in rows)+'\\n'
def kill(pid,sig):
 with events.open('a') as f:f.write(json.dumps({'pid':pid,'signal':int(sig)})+'\\n')
 state.write_text('killed')
subprocess.check_output=check_output;os.kill=kill
exec(compile(source,'production-browser-qa-cleanup','exec'))
`,{mode:0o755});
    try {
      let output='';try {output=execFileSync('bash',[fileURLToPath(new URL('../scripts/browser-qa-cleanup.sh',import.meta.url)),session,'agent-browser'],{
        env:{...process.env,PATH:bin+':'+process.env.PATH,TMPDIR:temp,AGENT_BROWSER_HOME:home,
          BQA_STATE:state,BQA_EVENTS:events,BQA_PROFILE:profile},encoding:'utf8',timeout:10000});
      } catch(e) {if(e.signal||e.status===undefined)throw e;output=String(e.stdout||'');}
      const signals=readFileSync(events,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
      console.log(`ORACLE-P7-START-IDENTITY ${JSON.stringify({signals,replacementDataPresent:existsSync(retained),output})}`);
      expect(signals, 'PID and command equality must not authorize signalling a replacement process').toEqual([]);
      expect(existsSync(retained), 'replacement profile must not be deleted').toBe(true);
    } finally {rmSync(root,{recursive:true,force:true});}
  });
});


describe('isolated-browser-qa native browser-use capability', () => {
  it('reports missing native capability before scenario without agent-browser ownership or source misattribution', async () => {
    const r=await gateway(invalidArgs,{BROWSER_QA_ENGINE:'browser-use',BROWSER_QA_AUTH_MODE:'none',
      BROWSER_QA_BROWSER_USE_PYTHON:join(tmpdir(),'bqa-deliberately-absent-python')});
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('BROWSER_USE_CAPABILITY_UNAVAILABLE');
    expect(r.stderr).not.toMatch(/RECEIVER_OWNERSHIP|INVALID_SOURCE_ENDPOINT/);
  });
});

// OCR057's receiver endpoint finding: two browser-level local endpoints may
// share a numeric port while belonging to separate IPv4/IPv6 listeners.
describe('isolated-browser-qa receiver endpoint semantics', () => {
  it('reports malformed owned receiver endpoint as receiver failure without blaming the source', async () => {
    const {r}=await runBoundaryFixture({receiverEndpoint:'not-a-websocket'});
    console.log(`ORACLE-P7-RECEIVER-ENDPOINT invalid: ${JSON.stringify(r)}`);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('INVALID_RECEIVER_ENDPOINT');
    expect(r.stderr).not.toContain('INVALID_SOURCE_ENDPOINT');
  });
  it('does not reject distinct IPv4 and IPv6 receiver/source listeners merely for sharing a port', async () => {
    const {r,received}=await runBoundaryFixture({samePortOtherHost:true});
    console.log(`ORACLE-P7-RECEIVER-ENDPOINT distinct-listeners: ${JSON.stringify({r,names:received.map(c=>c.name)})}`);
    expect(r.code,r.stderr).toBe(0);
    expect(received.map(c=>c.name)).toEqual(['ordinary']);
    expect(r.stderr).not.toContain('SOURCE_RECEIVER_IDENTICAL');
  });
});

describe('isolated-browser-qa localhost endpoint identity', () => {
  it('rejects localhost source and explicit IPv6 receiver when actual connections reach the same owned listener', async () => {
    const {r,receiverMethods,receiverPeers}=await runBoundaryFixture({sameReceiverViaLocalhost:true});
    console.log(`ORACLE-P7-LOCALHOST-IDENTITY ${JSON.stringify({r,receiverMethods,receiverPeers})}`);
    // A connection failure is an environment/fixture failure, not this oracle's RED.
    expect(r.stderr).not.toMatch(/CDP_CONNECT_FAILED|CDP_CONNECT_TIMEOUT/);
    if(r.code===0){expect(receiverMethods).toContain('Storage.getCookies');expect(receiverPeers).toEqual(['::1','::1']);}
    expect(r.code, 'aliases reaching the same instance must be rejected').toBe(1);
    expect(r.stderr).toContain('SOURCE_RECEIVER_IDENTICAL');
  });
});

describe('isolated-browser-qa incomplete cleanup handoff', () => {
  it('reports an exact owned session/root handle when identity uncertainty prevents cleanup', async () => {
    const {r,receiverMethods,cleanupHandle,retainedOwnedMetadata,retainedOwnedProfile}=await runBoundaryFixture({sameReceiverViaLocalhost:true});
    const output=r.stdout+r.stderr;
    console.log(`ORACLE-P7-INCOMPLETE-CLEANUP-HANDLE ${JSON.stringify({r,receiverMethods,retainedOwnedMetadata,retainedOwnedProfile,
      reportsOwnedRoot:output.includes(cleanupHandle.ownedRoot),reportsSession:output.includes(cleanupHandle.session)})}`);
    expect(r.code).toBe(1);
    expect(r.stdout).toContain('cleanup_incomplete=source_receiver_identity_collision');
    expect(receiverMethods, 'uncertain cleanup must not close or read the source').toEqual([]);
    expect(retainedOwnedMetadata).toBe(true);
    expect(retainedOwnedProfile).toBe(true);
    expect(output, 'retained owned metadata must be precisely locatable without scanning profiles or ports').toContain(cleanupHandle.ownedRoot);
    expect(output, 'caller needs the runner-derived session rather than the old context export').toContain(cleanupHandle.session);
  });
});

// Independent 514 native increment: real public gateway/parser/handlers, no AG mock.
import { homedir } from 'node:os';
import { createServer as createUnixServer } from 'node:net';
import { statSync, readdirSync } from 'node:fs';
const nativePython=process.env.BROWSER_QA_BROWSER_USE_PYTHON||join(homedir(),'.local/share/uv/tools/browser-use/bin/python');
const nativeChrome=process.env.BROWSER_QA_BROWSER_EXECUTABLE||join(homedir(),'.agent-browser/browsers/chrome-155.0.8059.39/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const nativeOwned=String.raw`
test -n "$BROWSER_QA_OWNED_BROWSER_PID"
test -n "$BROWSER_QA_OWNED_HELPER_PID"
test -n "$BROWSER_QA_OWNED_ROOT"
printf '%s\n%s\n%s\n' "$BROWSER_QA_OWNED_BROWSER_PID" "$BROWSER_QA_OWNED_HELPER_PID" "$BROWSER_QA_OWNED_ROOT" > "$P7_NATIVE_EVIDENCE/owned"
`;
const shellWord=value=>"'"+String(value).replaceAll("'","'\\''")+"'";
async function nativeFixture({redirectTo}={}){
  const root=mkdtempSync(join(tmpdir(),'bqa-native-contract-'));
  const evidence=join(root,'evidence'),cwd=join(root,'scenario'),temp=join(root,'temp'),home=join(root,'home');
  for(const dir of [evidence,cwd,temp,home])mkdirSync(dir);
  const hits=[],requests=[];const server=createServer((req,res)=>{hits.push(req.url);requests.push({url:req.url,cookie:req.headers.cookie||''});console.log('ORACLE-P7-NATIVE-HTTP '+JSON.stringify({hit_count:hits.length}));if(req.url.startsWith('/guard-allowed-'))writeFileSync(join(evidence,'allowed-navigation-hit'),'seen');if(req.url==='/guard-redirect'){res.writeHead(302,{location:redirectTo});res.end();return;}if(req.url==='/redirect'){res.writeHead(302,{location:'http://off-target.invalid/blocked'});res.end();return;}res.setHeader('content-type','text/html');res.end('<!doctype html><title>P7 native fixture</title><input id="field"><input id="upload" type="file"><button id="button" onclick="document.title=\'clicked\'">Go</button><p>native ready</p>');});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const env={...process.env,BROWSER_QA_ENGINE:'browser-use',BROWSER_QA_AUTH_MODE:'none',BROWSER_QA_BROWSER_USE_PYTHON:nativePython,BROWSER_QA_BROWSER_EXECUTABLE:nativeChrome,BROWSER_QA_TICKET_SOURCE_WS:'',BROWSER_QA_TICKET_TOP_LEVEL_SITE:'',BROWSER_QA_ALLOWED_DOMAINS:'127.0.0.1',P7_NATIVE_URL:url,P7_NATIVE_EVIDENCE:evidence,P7_NATIVE_CWD:cwd,P7_NATIVE_TEST_HOME:home,P7_NATIVE_TEST_TMPDIR:temp};
  const runs=[];
  function start(script,extra={}){const file=join(root,`scenario-${runs.length}.sh`);writeFileSync(file,script);const child=spawn('bash',[contextEntry,'--run','--url',url,'--evidence-dir',evidence,'--','bash',file],{cwd,env:{...env,...extra}});let stdout='',stderr='',phaseBuffer='';
    // Harness safety only: preserve the ordinary exit assertion, request normal
    // gateway cancellation before Vitest/outer execution budgets can force-kill.
    const watchdog=setTimeout(()=>{if(child.exitCode===null&&child.signalCode===null){console.log('ORACLE-P7-NATIVE-WATCHDOG '+JSON.stringify({pid:child.pid,signal:'SIGTERM'}));child.kill('SIGTERM');}},50000);
    child.stdout.on('data',b=>{stdout+=b;phaseBuffer+=b;const rows=phaseBuffer.split('\n');phaseBuffer=rows.pop();for(const row of rows){try{const event=JSON.parse(row);if(event.native_qa==='owned'){console.log('ORACLE-P7-NATIVE-OWNED '+JSON.stringify({browser_pid:event.browser_pid,browser_start:event.browser_start,helper_pid:event.helper_pid,helper_start:event.helper_start,profile:event.profile}));}if(event.native_qa==='identity_pending'){console.log('ORACLE-P7-NATIVE-IDENTITY-PENDING '+JSON.stringify(Object.fromEntries(['helper_path_matches','role_matches','session_matches','root_matches','profile_matches'].map(key=>[key,event[key]===true]))));}if(event.native_qa==='identity_unavailable'&&['helper','browser'].includes(event.resource)){console.log('ORACLE-P7-NATIVE-IDENTITY '+JSON.stringify({resource:event.resource,present:event.present===true,parent_matches:event.parent_matches===true,marker_matches:event.marker_matches===true}));}if(event.native_qa==='phase'&&['received','lock_acquired','handler_returned','approval_sent','approval_received','drained'].includes(event.phase)){const safe={phase:event.phase,hit_count:hits.length};if(['open','state','get','python','screenshot','wait','click','input','type','keys','upload','eval','shutdown'].includes(event.action))safe.action=event.action;console.log('ORACLE-P7-NATIVE-PHASE '+JSON.stringify(safe));}}catch{}}});
    child.stderr.on('data',b=>stderr+=b);const run={child,output:()=>stdout+stderr,done:new Promise(resolve=>child.once('close',(code,signal)=>{clearTimeout(watchdog);const errors=stderr.split('\n').flatMap(line=>{try{const value=JSON.parse(line).error;return typeof value==='string'&&/^[A-Z][A-Z0-9_]*$/.test(value)?[value]:[];}catch{return [];}});console.log('ORACLE-P7-NATIVE-RESULT '+JSON.stringify({code,signal,errors,hit_count:hits.length}));resolve({code,signal,stdout,stderr});}))};runs.push(run);return run;}
  return{root,evidence,cwd,temp,home,url,hits,requests,env,start,run:async(script,extra)=>start(script,extra).done,close:async()=>{for(const {child,done} of runs){if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');await done;}await new Promise(resolve=>server.close(resolve));let ownedRoot;try{ownedRoot=readFileSync(join(evidence,'owned'),'utf8').trim().split('\n')[2];}catch{}if(!ownedRoot){for(const run of runs){const match=run.output().match(/^cleanup_owned_root=(.+)$/m);if(match){try{const value=JSON.parse(match[1]);if(typeof value==='string'&&value.startsWith('/'))ownedRoot=value;}catch{}}}}const incomplete=runs.some(run=>run.output().includes('cleanup_incomplete'));if(readdirSync(temp).length||incomplete||ownedRoot&&existsSync(ownedRoot))console.log('ORACLE-P7-NATIVE-RETAINED '+JSON.stringify({fixture_root:root,owned_root:ownedRoot||null,incomplete}));else rmSync(root,{recursive:true,force:true});}};
}
function nativeExit(r){expect(Number.isInteger(r.code),'native failure must have a real numeric exit code').toBe(true);expect(r.signal,'policy failure must not be a killed process').toBe(null);}
function nativeResult(r,code=0){nativeExit(r);expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);expect(r.code,r.stderr+'\n'+r.stdout).toBe(code);}
function nativeClean(f){const own=readFileSync(join(f.evidence,'owned'),'utf8').trim().split('\n');expect(own).toHaveLength(3);for(const pid of own.slice(0,2)){expect(Number(pid)).toBeGreaterThan(1);expect(()=>process.kill(Number(pid),0),'actual owned child must be gone').toThrow();}expect(existsSync(own[2]),'owned profile/socket/metadata root must be gone').toBe(false);}
describe('isolated-browser-qa real native gateway increment',()=>{
  it('native gateway accepts real bash commands',async()=>{
    const f=await nativeFixture();try{const r=await f.run('set -eu\n'+nativeOwned+String.raw`
command -v browser-use > "$P7_NATIVE_EVIDENCE/cli-path"
browser-use --session "$BROWSER_QA_SESSION" open "$P7_NATIVE_URL"
browser-use --json get title > "$P7_NATIVE_EVIDENCE/title.json"
browser-use state > "$P7_NATIVE_EVIDENCE/state.txt"
browser-use wait text 'native ready' --timeout 2000
browser-use python 'import os; print(os.getpid())' > "$P7_NATIVE_EVIDENCE/helper-pid"
browser-use screenshot "$P7_NATIVE_EVIDENCE/screen.png"
`);nativeResult(r);expect(JSON.parse(readFileSync(join(f.evidence,'title.json'),'utf8')).data.title).toBe('P7 native fixture');expect(readFileSync(join(f.evidence,'state.txt'),'utf8')).toContain('native');expect(readFileSync(join(f.evidence,'helper-pid'),'utf8').trim()).toBe(readFileSync(join(f.evidence,'owned'),'utf8').split('\n')[1]);expect(statSync(join(f.evidence,'screen.png')).size).toBeGreaterThan(100);const digest=createHash('sha256').update(readFileSync(join(f.evidence,'screen.png'))).digest('hex');nativeClean(f);expect(digest).toHaveLength(64);}finally{await f.close();}
  },90000);
  it('native cwd and literal tilde preserve file semantics and screenshot output',async()=>{
    const f=await nativeFixture();mkdirSync(join(f.cwd,'sub'));mkdirSync(join(f.cwd,'sub','~'));writeFileSync(join(f.cwd,'sub','~','literal.py'),'from pathlib import Path\nPath("relative.txt").write_text("same cwd")\nprint("literal-file")\n');
    try{const r=await f.run('set -eu\n'+nativeOwned+String.raw`
cd "$P7_NATIVE_CWD/sub"
browser-use python --file '~/literal.py'
browser-use screenshot shot.png > "$P7_NATIVE_EVIDENCE/saved-output"
browser-use python 'from pathlib import Path; print(Path("relative.txt").read_text())'
`);nativeResult(r);expect(r.stdout).toContain('literal-file');expect(r.stdout).toContain('same cwd');expect(readFileSync(join(f.evidence,'saved-output'),'utf8')).toContain('saved: shot.png');expect(statSync(join(f.cwd,'sub','shot.png')).size).toBeGreaterThan(100);expect(readFileSync(join(f.cwd,'sub','relative.txt'),'utf8')).toBe('same cwd');nativeClean(f);}finally{await f.close();}
  },90000);
  it.each(['--json click 999999','python "raise ValueError(\'controlled failure\')"'])('native failure is latched despite a successful last shell command: %s',async command=>{
    const f=await nativeFixture();try{const r=await f.run('set -u\n'+nativeOwned+`\nif browser-use ${command}; then exit 88; fi\necho shell-last-command-succeeded\n`);expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(88);expect(r.stdout).toContain('shell-last-command-succeeded');nativeClean(f);}finally{await f.close();}
  },90000);
  it('native eval nested error remains ordinary successful data',async()=>{
    const f=await nativeFixture();try{const r=await f.run('set -eu\n'+nativeOwned+`\nbrowser-use --json eval '({error:"business data"})' > "$P7_NATIVE_EVIDENCE/eval.json"\n`);nativeResult(r);const response=JSON.parse(readFileSync(join(f.evidence,'eval.json'),'utf8'));expect(response.success).toBe(true);expect(JSON.stringify(response.data)).toContain('business data');nativeClean(f);}finally{await f.close();}
  },90000);
  it('native guard preserves live foreign legacy socket and files while rejecting global commands',async()=>{
    const f=await nativeFixture();let bytes='',connections=0;const foreign=createUnixServer(socket=>{connections++;socket.on('data',b=>bytes+=b);socket.end();});await new Promise(resolve=>foreign.listen(join(f.temp,'browser-use-cli.sock'),resolve));const old=join(f.home,'.browser-use','run');mkdirSync(old,{recursive:true});writeFileSync(join(old,'browser-use-preserve'),'foreign bytes');
    try{const r=await f.run('set -u\n'+nativeOwned+String.raw`
native_cli(){ env HOME="$P7_NATIVE_TEST_HOME" TMPDIR="$P7_NATIVE_TEST_TMPDIR" browser-use "$@"; }
native_cli get title || exit 77
for command in '--session foreign open http://127.0.0.1/' '--con open http://127.0.0.1/' 'close --all' 'install' 'init' 'setup' '--mcp'; do
  if native_cli $command; then exit 88; fi
done
echo forbidden-commands-rejected
`);expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);expect(r.stdout).toContain('forbidden-commands-rejected');nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(77);expect(r.code).not.toBe(88);expect(connections,'foreign legacy socket must not even be connected').toBe(0);expect(bytes).toBe('');expect(readFileSync(join(old,'browser-use-preserve'),'utf8')).toBe('foreign bytes');nativeClean(f);}finally{await new Promise(resolve=>foreign.close(resolve));await f.close();}
  },90000);
  it('native missing socket fails closed without a replacement daemon',async()=>{
    const f=await nativeFixture();try{const r=await f.run('set -u\n'+nativeOwned+String.raw`
rm "$BROWSER_USE_HOME/$BROWSER_QA_SESSION.sock"
if browser-use get title; then exit 88; fi
test ! -S "$BROWSER_USE_HOME/$BROWSER_QA_SESSION.sock" || exit 89
echo missing-socket-refused
`);expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);expect(r.stdout).toContain('missing-socket-refused');nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(88);expect(r.code).not.toBe(89);nativeClean(f);}finally{await f.close();}
  },90000);
  it.each(['wait','python'])('native %s real 20 second work cancels after 2 seconds without late artifact',async kind=>{
    const f=await nativeFixture();const entered=join(f.evidence,'work-entered'),late=join(f.evidence,'late-artifact');const operation=kind==='wait'?`browser-use wait selector '#never-created' --timeout 20000\nprintf late > ${shellWord(late)}\n`:`browser-use python ${shellWord(`import time; from pathlib import Path; Path(${JSON.stringify(entered)}).write_text('entered'); time.sleep(20); Path(${JSON.stringify(late)}).write_text('late')`)}\n`;
    try{const run=f.start('set -eu\n'+nativeOwned+(kind==='wait'?`printf entered > ${shellWord(entered)}\n`:'')+operation);const readyDeadline=Date.now()+30000;while(!existsSync(entered)&&Date.now()<readyDeadline&&run.child.exitCode===null)await delay(25);expect(existsSync(entered),'real native work must start').toBe(true);await delay(2000);const start=Date.now();run.child.kill('SIGTERM');const r=await run.done;nativeResult(r,143);expect(Date.now()-start).toBeLessThan(15000);nativeClean(f);const next=await f.run('set -eu\n'+nativeOwned+'browser-use get title\n');nativeResult(next);nativeClean(f);expect(Date.now()-start,'next command must finish before original work deadline').toBeLessThan(18000);await delay(Math.max(0,21000-(Date.now()-start)-2000));expect(existsSync(late)).toBe(false);}finally{await f.close();}
  },90000);
});

// Further independent real-native boundaries. Controlled HTTP/CDP source fixtures
// are explicitly not evidence of real user login; receiver always uses native engine.
describe('isolated-browser-qa native lifecycle and scope increment',()=>{
  it.each(['direct','redirect'])('native navigation rejects off-target %s navigation without treating it as success',async mode=>{
    const f=await nativeFixture();try{
      const target=mode==='direct'?'http://off-target.invalid/blocked':f.url+'redirect';
      const r=await f.run('set -u\n'+nativeOwned+`\nif browser-use open ${shellWord(target)}; then exit 88; fi\nbrowser-use --json get title > "$P7_NATIVE_EVIDENCE/after-rejection.json"\necho rejected-navigation\n`);
      expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(88);expect(r.stdout).toContain('rejected-navigation');
      expect(JSON.parse(readFileSync(join(f.evidence,'after-rejection.json'),'utf8')).data.title).toBe('P7 native fixture');
      if(mode==='redirect')expect(f.hits).toContain('/redirect');nativeClean(f);
    }finally{await f.close();}
  },90000);
  it('native page failure keeps evidence readable and clears only owned resources',async()=>{
    const f=await nativeFixture();try{const r=await f.run('set -eu\n'+nativeOwned+String.raw`
browser-use screenshot "$P7_NATIVE_EVIDENCE/failure.png"
exit 17
`);nativeResult(r,17);nativeClean(f);const bytes=readFileSync(join(f.evidence,'failure.png'));expect(bytes.length).toBeGreaterThan(100);expect(createHash('sha256').update(bytes).digest('hex')).toHaveLength(64);}finally{await f.close();}
  },90000);
  it('native busy command disconnect fails closed after authenticated helper death without a new daemon',async()=>{
    const f=await nativeFixture();try{const r=await f.run('set -u\n'+nativeOwned+String.raw`
browser-use wait selector '#never-created' --timeout 20000 &
request=$!
sleep 1
# This PID is supplied by the same gateway and was recorded before the fault.
kill -TERM "$BROWSER_QA_OWNED_HELPER_PID"
wait "$request" && exit 88
if browser-use get title; then exit 89; fi
echo disconnected-native-refused
`);expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(88);expect(r.code).not.toBe(89);nativeClean(f);}finally{await f.close();}
  },90000);
  it('native cancellation preserves a parallel owned session and its HTTP service',async()=>{
    const a=await nativeFixture(),b=await nativeFixture();const ready=join(b.evidence,'parallel-ready'),release=join(b.evidence,'release');
    try{
      const other=b.start('set -eu\n'+nativeOwned+`\nprintf ready > ${shellWord(ready)}\nwhile ! test -e ${shellWord(release)}; do sleep .1; done\nbrowser-use get title\nbrowser-use screenshot "$P7_NATIVE_EVIDENCE/parallel.png"\n`);
      const readyDeadline=Date.now()+30000;while(!existsSync(ready)&&Date.now()<readyDeadline&&other.child.exitCode===null)await delay(25);expect(existsSync(ready)).toBe(true);
      const marker=join(a.evidence,'cancel-ready');const run=a.start('set -eu\n'+nativeOwned+`\nprintf ready > ${shellWord(marker)}\nbrowser-use wait selector '#never-created' --timeout 20000\n`);
      const deadline=Date.now()+30000;while(!existsSync(marker)&&Date.now()<deadline&&run.child.exitCode===null)await delay(25);expect(existsSync(marker)).toBe(true);await delay(2000);run.child.kill('SIGTERM');nativeResult(await run.done,143);nativeClean(a);
      const own=readFileSync(join(b.evidence,'owned'),'utf8').trim().split('\n');for(const pid of own.slice(0,2))expect(()=>process.kill(Number(pid),0)).not.toThrow();expect((await fetch(b.url)).status).toBe(200);
      writeFileSync(release,'continue');nativeResult(await other.done);nativeClean(b);expect(statSync(join(b.evidence,'parallel.png')).size).toBeGreaterThan(100);
    }finally{writeFileSync(release,'continue');await a.close();await b.close();}
  },90000);
  it.each(['success','failure'])('native receiver transfers only eligible controlled tickets and cleans on %s',async mode=>{
    const f=await nativeFixture();const secret='P7_CONTROLLED_NATIVE_TICKET_SENTINEL';
    const ordinary={name:'p7ordinary',value:secret,domain:'127.0.0.1',path:'/',secure:false,httpOnly:true,session:true};
    const source=await memoryCdp([ordinary,{...ordinary,name:'wrong-path',path:'/other'},{...ordinary,name:'partition',partitionKey:{topLevelSite:'https://example.test',hasCrossSiteAncestor:false}}]);
    try{
      const r=await f.run('set -eu\n'+nativeOwned+`\nbrowser-use open "$P7_NATIVE_URL"\nbrowser-use screenshot "$P7_NATIVE_EVIDENCE/ticket.png"\nexit ${mode==='success'?0:17}\n`,{BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:source.endpoint});
      nativeResult(r,mode==='success'?0:17);expect(f.requests.some(req=>req.cookie.includes('p7ordinary='+secret)),'eligible HttpOnly ticket must reach actual native receiver request').toBe(true);expect(f.requests.some(req=>req.cookie.includes('wrong-path=')||req.cookie.includes('partition='))).toBe(false);expect((r.stdout+r.stderr).includes(secret),'ticket payload must not reach output').toBe(false);
      expect(source.methods).toContain('Storage.getCookies');expect(source.methods).toContain('Target.getTargets');expect(source.methods.every(method=>['Browser.getVersion','Storage.getCookies','Target.getTargets'].includes(method)),'source must remain strictly read-only').toBe(true);nativeClean(f);expect(statSync(join(f.evidence,'ticket.png')).size).toBeGreaterThan(100);
    }finally{await source.close();await f.close();}
  },90000);
});

describe('isolated-browser-qa native complete shell interaction increment',()=>{
  it('native state indices drive real input click keys and upload with original tilde expansion',async()=>{
    const f=await nativeFixture();writeFileSync(join(f.home,'upload.txt'),'controlled upload');
    // State indices are intentionally obtained from native state, not fabricated.
    const findIndex=String.raw`const fs=require('node:fs');const text=fs.readFileSync(process.argv[1],'utf8');const line=text.split('\n').find(x=>x.includes('id='+process.argv[2])||x.includes('id="'+process.argv[2]+'"'));const m=line&&line.match(/\[(\d+)\]/);if(!m)process.exit(91);console.log(m[1]);`;
    const node=shellWord(process.execPath);
    try{const r=await f.run('set -eu\n'+nativeOwned+`
browser-use state > "$P7_NATIVE_EVIDENCE/indices"
field=$(${node} -e ${shellWord(findIndex)} "$P7_NATIVE_EVIDENCE/indices" field)
browser-use input "$field" 'native value'
browser-use keys 'End'
browser-use type '!'
browser-use --json get value "$field" > "$P7_NATIVE_EVIDENCE/value.json"
browser-use state > "$P7_NATIVE_EVIDENCE/indices"
upload=$(${node} -e ${shellWord(findIndex)} "$P7_NATIVE_EVIDENCE/indices" upload)
env HOME="$P7_NATIVE_TEST_HOME" browser-use upload "$upload" '~/upload.txt'
browser-use --json eval 'document.querySelector("#upload").files[0]?.name' > "$P7_NATIVE_EVIDENCE/upload.json"
browser-use state > "$P7_NATIVE_EVIDENCE/indices"
button=$(${node} -e ${shellWord(findIndex)} "$P7_NATIVE_EVIDENCE/indices" button)
browser-use click "$button"
browser-use --json get title > "$P7_NATIVE_EVIDENCE/clicked.json"
`);nativeResult(r);expect(JSON.parse(readFileSync(join(f.evidence,'value.json'),'utf8')).data.value).toBe('native value!');expect(JSON.parse(readFileSync(join(f.evidence,'upload.json'),'utf8')).data.result).toBe('upload.txt');expect(JSON.parse(readFileSync(join(f.evidence,'clicked.json'),'utf8')).data.title).toBe('clicked');nativeClean(f);}finally{await f.close();}
  },90000);
  it('native controlled ticket value cannot escape through Python output or vars',async()=>{
    const f=await nativeFixture(),secret='P7_CONTROLLED_OUTPUT_SECRET';const source=await memoryCdp([{name:'p7ordinary',value:secret,domain:'127.0.0.1',path:'/',secure:false,httpOnly:true,session:true}]);
    try{const r=await f.run('set -u\n'+nativeOwned+`\nif browser-use python ${shellWord(`print(${JSON.stringify(secret)})`)}; then exit 88; fi\nif browser-use python --vars; then :; fi\necho secret-output-was-refused\n`,{BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:source.endpoint});expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);expect((r.stdout+r.stderr).includes(secret)).toBe(false);nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(88);expect(r.stdout).toContain('secret-output-was-refused');nativeClean(f);}finally{await source.close();await f.close();}
  },90000);
  it('native controlled tickets are removed with owned resources after real cancellation',async()=>{
    const f=await nativeFixture(),secret='P7_CONTROLLED_CANCEL_TICKET';const source=await memoryCdp([{name:'p7ordinary',value:secret,domain:'127.0.0.1',path:'/',secure:false,httpOnly:true,session:true}]);const entered=join(f.evidence,'ticket-cancel-entered');
    try{const run=f.start('set -eu\n'+nativeOwned+`\nprintf ready > ${shellWord(entered)}\nbrowser-use wait selector '#never-created' --timeout 20000\n`,{BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:source.endpoint});const deadline=Date.now()+30000;while(!existsSync(entered)&&Date.now()<deadline&&run.child.exitCode===null)await delay(25);expect(existsSync(entered)).toBe(true);expect(f.requests.some(req=>req.cookie.includes('p7ordinary='+secret))).toBe(true);await delay(2000);run.child.kill('SIGTERM');const r=await run.done;nativeResult(r,143);expect((r.stdout+r.stderr).includes(secret)).toBe(false);nativeClean(f);expect(source.methods.every(method=>['Browser.getVersion','Storage.getCookies','Target.getTargets'].includes(method))).toBe(true);}finally{await source.close();await f.close();}
  },90000);
});

describe('isolated-browser-qa native startup and refusal increment',()=>{
  it('native startup cancellation never reaches the scenario and retains no owned profile process',async()=>{
    const f=await nativeFixture(),marker=join(f.evidence,'must-not-enter');
    const helperPath=fileURLToPath(new URL('../scripts/browser-qa-browser-use.py',import.meta.url));
    // TCR-P7-NATIVE-STARTUP-OWNERSHIP-ROOT-01 (522): authenticate public OS
    // process facts and actual argv root; caller TMPDIR is not an ownership oracle.
    const observe=String.raw`
import json,os,sys
import psutil
owner=int(sys.argv[1]);helper_path=sys.argv[2];browser_exe=os.path.realpath(sys.argv[3])
rows=[]
try:
 for p in psutil.Process(owner).children(recursive=False):
  try: rows.append(dict(pid=p.pid,ppid=p.ppid(),start=p.create_time(),exe=p.exe(),argv=p.cmdline(),status=p.status()))
  except psutil.Error: pass
except psutil.Error: pass
helper=next((p for p in rows if len(p['argv'])>=6 and p['argv'][1]==helper_path and p['argv'][2]=='adapter' and p['argv'][3].startswith('whqa-') and p['ppid']==owner),None)
result=None
if helper:
 session,root,profile=helper['argv'][3:6]
 browser=next((p for p in rows if p['ppid']==owner and os.path.realpath(p['exe'])==browser_exe and '--user-data-dir='+profile in p['argv'] and p['status']!=psutil.STATUS_ZOMBIE),None)
 if browser and helper['status']!=psutil.STATUS_ZOMBIE and os.path.isabs(root) and os.path.isdir(root) and os.path.isdir(profile):result=dict(helper=helper,browser=browser,session=session,root=root,profile=profile)
print(json.dumps(result))
`;
    try{
      writeFileSync(join(f.evidence,'startup-evidence'),'preserve startup evidence');
      const run=f.start('set -eu\n'+`printf late > ${shellWord(marker)}\n`);
      let identity;const deadline=Date.now()+30000;
      while(!identity&&Date.now()<deadline&&run.child.exitCode===null&&!existsSync(marker)){
        identity=JSON.parse(execFileSync(nativePython,['-c',observe,String(run.child.pid),helperPath,nativeChrome],{encoding:'utf8'}));
        if(!identity)await delay(20);
      }
      expect(identity,'must observe authenticated helper AND browser startup before cancelling').not.toBeNull();
      expect(identity).toBeDefined();expect(existsSync(marker),'scenario must not already have started').toBe(false);
      expect(identity.helper.ppid).toBe(run.child.pid);expect(identity.browser.ppid).toBe(run.child.pid);
      run.child.kill('SIGTERM');const r=await run.done;nativeResult(r,143);
      expect(r.stdout+r.stderr).not.toContain('cleanup_incomplete');expect(existsSync(marker)).toBe(false);
      const remaining=JSON.parse(execFileSync(nativePython,['-c',String.raw`
import json,sys
import psutil
result=[]
for row in json.loads(sys.argv[1]):
 try:
  p=psutil.Process(row['pid'])
  if p.create_time()==row['start']:result.append(dict(pid=p.pid,status=p.status()))
 except psutil.Error:pass
print(json.dumps(result))
`,JSON.stringify([identity.helper,identity.browser])],{encoding:'utf8'}));
      expect(remaining,'the exact observed child identities must be gone; PID reuse is distinct').toEqual([]);
      for(const path of [identity.profile,join(identity.root,identity.session+'.pid'),join(identity.root,identity.session+'.sock'),identity.root])expect(existsSync(path),'observed owned resource must be removed: '+path).toBe(false);
      await delay(500);expect(existsSync(marker),'no late scenario artifact after cleanup').toBe(false);
      expect(readFileSync(join(f.evidence,'startup-evidence'),'utf8')).toBe('preserve startup evidence');
    }finally{await f.close();}
  },90000);
  it('native refused socket never starts a daemon or rewrites the owned PID record',async()=>{
    const f=await nativeFixture();try{const r=await f.run('set -u\n'+nativeOwned+String.raw`
pid_before=$(cat "$BROWSER_USE_HOME/$BROWSER_QA_SESSION.pid")
rm "$BROWSER_USE_HOME/$BROWSER_QA_SESSION.sock"
: > "$BROWSER_USE_HOME/$BROWSER_QA_SESSION.sock"
if browser-use get title; then exit 88; fi
pid_after=$(cat "$BROWSER_USE_HOME/$BROWSER_QA_SESSION.pid")
test "$pid_before" = "$pid_after" || exit 89
echo refused-socket-no-replacement
`);expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);expect(r.stdout).toContain('refused-socket-no-replacement');nativeExit(r);expect(r.code).not.toBe(0);expect(r.code).not.toBe(88);expect(r.code).not.toBe(89);nativeClean(f);}finally{await f.close();}
  },90000);
});

import { get as plainHttpGet } from 'node:http';
// Oracle 560: one real reachable off-allowlist Document endpoint, not DNS failure.
async function reachableDenyDocument(){
  let documents=0;
  const server=createServer((req,res)=>{if(req.url==='/denied-document')documents++;res.setHeader('content-type','text/html');res.end('<!doctype html><title>reachable deny</title><p>deny fixture</p>');});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'::1',resolve);});
  const url=`http://[::1]:${server.address().port}/denied-document`;
  let status;try{status=await new Promise((resolve,reject)=>{const request=plainHttpGet(url,response=>{response.resume();response.once('end',()=>resolve(response.statusCode));});request.once('error',reject);request.setTimeout(3000,()=>request.destroy(new Error('DENY_BASELINE_TIMEOUT')));});
  expect(status,'off-allowlist endpoint must actually be reachable before testing refusal').toBe(200);
  expect(documents,'baseline must reach exactly the controlled Document').toBe(1);documents=0;}catch(error){await new Promise(resolve=>server.close(resolve));throw error;}
  return{url,count:()=>documents,close:()=>new Promise(resolve=>server.close(resolve))};
}
describe('isolated-browser-qa real reachable Document frontgate increment',()=>{
  it.each(['direct','redirect','newtab','iframe'])('native reachable deny Document is refused before request on %s',async mode=>{
    const deny=await reachableDenyDocument();let f;
    try{
      f=await nativeFixture({redirectTo:deny.url});
      expect(f.env.BROWSER_QA_ALLOWED_DOMAINS.split(',')).not.toContain('::1');
      let allowed='';
      if(mode==='newtab'||mode==='iframe'){
        const allowedUrl=f.url+'guard-allowed-'+mode;
        const js=mode==='newtab'?`window.open(${JSON.stringify(allowedUrl)},'_blank');'allowed-created'`:`var allowedFrame=document.createElement('iframe');allowedFrame.src=${JSON.stringify(allowedUrl)};document.body.append(allowedFrame);'allowed-created'`;
        allowed=`browser-use eval ${shellWord(js)}\nfor ((i=0;i<500;i++)); do test -f "$P7_NATIVE_EVIDENCE/allowed-navigation-hit" && break; sleep .01; done\ntest -f "$P7_NATIVE_EVIDENCE/allowed-navigation-hit" || exit 87\n`;
      }
      let trigger;
      if(mode==='direct')trigger=`browser-use open ${shellWord(deny.url)}`;
      if(mode==='redirect')trigger=`browser-use open ${shellWord(f.url+'guard-redirect')}`;
      if(mode==='newtab')trigger=`browser-use eval ${shellWord(`window.open(${JSON.stringify(deny.url)},'_blank');'deny-created'`)}`;
      if(mode==='iframe')trigger=`browser-use eval ${shellWord(`var deniedFrame=document.createElement('iframe');deniedFrame.src=${JSON.stringify(deny.url)};document.body.append(deniedFrame);'deny-created'`)}`;
      const r=await f.run('set -u\n'+nativeOwned+`\nbrowser-use open "$P7_NATIVE_URL" || exit 86\n`+allowed+`printf 'deny-trigger-started\\n'\n${trigger}\nsleep 1\n`);
      const observation={mode,allowed_hits:f.hits.length,denied_documents:deny.count(),code:r.code,typed_rejection:(r.stdout+r.stderr).includes('TARGET_OUTSIDE_ALLOWED_DOMAINS'),trigger_started:r.stdout.includes('deny-trigger-started')};
      console.log('ORACLE-P7-REACHABLE-DOCUMENT '+JSON.stringify(observation));
      expect(r.stderr).not.toMatch(/BROWSER_USE_RUN_UNAVAILABLE|BROWSER_USE_CAPABILITY_UNAVAILABLE/);
      expect(observation.trigger_started,'must reach the actual native navigation trigger').toBe(true);
      expect(f.hits).toContain('/');
      if(mode==='newtab'||mode==='iframe')expect(f.hits,'allowed new pages/frames must work in the same run').toContain('/guard-allowed-'+mode);
      nativeClean(f);expect(r.stdout+r.stderr).not.toContain('cleanup_incomplete');
      expect(observation.denied_documents,'reachable deny server must receive zero Document requests').toBe(0);
      expect(observation.typed_rejection,'network failures and generic command errors are not policy refusals').toBe(true);
      nativeExit(r);expect(r.code,'an ignored policy failure must remain latched by the owner').not.toBe(0);
      expect(r.code).not.toBe(86);expect(r.code).not.toBe(87);expect(r.code).not.toBe(143);
    }finally{await f?.close();await deny.close();}
  },90000);
});

// Independent 574/195 increment: real fs-await cancellation, not SDK handshake.
describe('isolated-browser-qa native prespawn cancellation increment',()=>{
  for(const stage of ['before-helper','before-chrome'])it(`native prespawn cancellation at ${stage} retains no later owned child`,async()=>{
    const f=await nativeFixture();const checkpoint=join(f.root,'prespawn-checkpoint.json'),release=join(f.root,'prespawn-release'),events=join(f.root,'prespawn-events.jsonl'),hook=join(f.root,'prespawn-hook.mjs'),marker=join(f.evidence,'scenario-entered'),late=join(f.evidence,'late');
    const helperPath=fileURLToPath(new URL('../scripts/browser-qa-browser-use.py',import.meta.url));
    const sessionPath=fileURLToPath(new URL('../scripts/browser-qa-session.mjs',import.meta.url));
    writeFileSync(hook,String.raw`
import fs from 'node:fs/promises';
import syncfs from 'node:fs';
import cp from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {dirname,join} from 'node:path';
const e=process.env;
if(process.argv[1]===e.P7_PRE_ENTRY&&e.P7_PRE_TOKEN&&e.P7_PRE_CHECKPOINT.startsWith(e.P7_PRE_TOKEN+'/')){
  const originalWrite=fs.writeFile,originalRead=fs.readFile,originalAccess=fs.access,originalSpawn=cp.spawn;
  let hit=false,helperRoot;
  const record=value=>syncfs.appendFileSync(e.P7_PRE_EVENTS,JSON.stringify(value)+'\n');
  record({event:'observer',pid:process.pid,entry_matches:true,token_matches:true});
  cp.spawn=function(executable,args=[],options){
    const child=originalSpawn.call(this,executable,args,options);
    let role='other';
    if(args[0]===e.P7_PRE_HELPER&&args[1]==='adapter'){role='helper';helperRoot=args[3];}
    if(executable===e.P7_PRE_CHROME&&args.some(arg=>String(arg).startsWith('--user-data-dir=')))role='chrome';
    record({event:'spawn',pid:child.pid??null,role,exe:executable,argv:role==='helper'?args:[],time:Date.now()});
    return child;
  };
  const barrier=async(stage,root)=>{
    if(hit)throw new Error('duplicate prespawn checkpoint');hit=true;
    await originalWrite(e.P7_PRE_CHECKPOINT,JSON.stringify({stage,root,pid:process.pid,real_operation_completed:true}));
    while(true){try{await originalRead(e.P7_PRE_RELEASE);break;}catch(error){if(error.code!=='ENOENT')throw error;}await new Promise(resolve=>setTimeout(resolve,10));}
  };
  fs.writeFile=async function(path,data,...rest){
    const result=await originalWrite.call(this,path,data,...rest);
    if(e.P7_PRE_STAGE==='before-helper'&&typeof path==='string'&&path.endsWith('/bin/browser-use')&&typeof data==='string'&&data.startsWith('#!/bin/sh\nexec ')&&data.includes("'"+e.P7_PRE_HELPER+"' 'cli'"))await barrier('before-helper',dirname(dirname(path)));
    return result;
  };
  fs.access=async function(path,...rest){
    const result=await originalAccess.call(this,path,...rest);
    if(e.P7_PRE_STAGE==='before-chrome'&&path===e.P7_PRE_CHROME&&helperRoot)await barrier('before-chrome',helperRoot);
    return result;
  };
  syncBuiltinESMExports();
}
`);
    let run;try{
      run=f.start(`set -eu\nprintf entered > ${shellWord(marker)}\nsleep 2\nprintf late > ${shellWord(late)}\n`,{
        NODE_OPTIONS:`--import=${hook}`,P7_PRE_TOKEN:f.root,P7_PRE_ENTRY:sessionPath,P7_PRE_HELPER:helperPath,P7_PRE_CHROME:nativeChrome,P7_PRE_STAGE:stage,P7_PRE_CHECKPOINT:checkpoint,P7_PRE_RELEASE:release,P7_PRE_EVENTS:events
      });
      const deadline=Date.now()+30000;while(!existsSync(checkpoint)&&Date.now()<deadline&&run.child.exitCode===null&&run.child.signalCode===null)await delay(20);
      expect(existsSync(checkpoint),'must hit the successful real fs operation before cancellation').toBe(true);
      const point=JSON.parse(readFileSync(checkpoint,'utf8'));
      expect(point).toMatchObject({stage,pid:run.child.pid,real_operation_completed:true});expect(point.root.startsWith('/')).toBe(true);
      const before=readFileSync(events,'utf8').trim().split('\n').map(JSON.parse);
      expect(before[0]).toMatchObject({event:'observer',pid:run.child.pid,entry_matches:true,token_matches:true});
      const helpers=before.filter(event=>event.role==='helper'),browsers=before.filter(event=>event.role==='chrome');
      expect(browsers).toHaveLength(0);expect(helpers).toHaveLength(stage==='before-helper'?0:1);
      let identity;
      if(stage==='before-chrome'){
        identity=JSON.parse(execFileSync(nativePython,['-c',String.raw`
import psutil,json,sys
p=psutil.Process(int(sys.argv[1]));a=p.cmdline()
print(json.dumps({'pid':p.pid,'start':p.create_time(),'parent_matches':p.ppid()==int(sys.argv[2]),'role_matches':len(a)>5 and a[1]==sys.argv[3] and a[2]=='adapter' and a[4]==sys.argv[4],'exe':p.exe()}))
`,String(helpers[0].pid),String(run.child.pid),helperPath,point.root],{encoding:'utf8'}));
        expect(identity.parent_matches).toBe(true);expect(identity.role_matches).toBe(true);expect(identity.start).toBeGreaterThan(0);
      }
      expect(existsSync(marker)).toBe(false);const signalledAt=Date.now();expect(run.child.kill('SIGTERM'),'exact real gateway must accept the single TERM').toBe(true);
      await delay(100);writeFileSync(release,'release');const r=await run.done;nativeResult(r,143);expect(Date.now()-signalledAt,'normal cleanup must finish before harness watchdog').toBeLessThan(15000);
      expect(r.stdout).not.toContain('cleanup_incomplete');expect(r.stdout).not.toContain('ORACLE-P7-NATIVE-WATCHDOG');
      const after=readFileSync(events,'utf8').trim().split('\n').map(JSON.parse);
      expect(after.filter(event=>event.role==='helper')).toHaveLength(stage==='before-helper'?0:1);expect(after.filter(event=>event.role==='chrome')).toHaveLength(0);
      const live=JSON.parse(execFileSync(nativePython,['-c',String.raw`
import psutil,json,sys,os
root=sys.argv[1];pid=int(sys.argv[2]);start=float(sys.argv[3]);same=False;matching=0
if pid:
 try:same=psutil.Process(pid).create_time()==start
 except psutil.NoSuchProcess:pass
for p in psutil.process_iter(['cmdline']):
 try:
  a=p.info['cmdline'] or []
  if p.pid!=os.getpid() and (root in a or '--user-data-dir='+root+'/browser-use-user-data-dir-owned' in a):matching+=1
 except (psutil.NoSuchProcess,psutil.AccessDenied):pass
print(json.dumps({'same_helper_alive':same,'owned_argv_processes':matching}))
`,point.root,String(identity?.pid||0),String(identity?.start||0)],{encoding:'utf8'}));
      expect(live).toEqual({same_helper_alive:false,owned_argv_processes:0});expect(existsSync(point.root),'actual profile/socket/metadata root must be removed before fixture cleanup').toBe(false);
      await delay(Math.max(0,2500-(Date.now()-signalledAt)));expect(existsSync(marker)).toBe(false);expect(existsSync(late)).toBe(false);
      console.log('ORACLE-P7-PRESPAWN '+JSON.stringify({stage,checkpoint:true,code:r.code,signal:r.signal,helper_spawns:helpers.length,chrome_spawns:0,helper_identity_exited:!live.same_helper_alive,root_removed:true}));
    }finally{if(!existsSync(release))writeFileSync(release,'release');await f.close();}
  },90000);
});

// Independent 582/196-197 increment: exact SDK-await and FIFO-write windows.
describe('isolated-browser-qa native exact cancellation increment',()=>{
  it('native SDK connected await cancellation never reaches ready or scenario',async()=>{
    const f=await nativeFixture(),hooks=join(f.root,'sdk-hooks'),checkpoint=join(f.evidence,'sdk-checkpoint.json'),release=join(f.root,'sdk-release'),marker=join(f.evidence,'sdk-scenario'),late=join(f.evidence,'sdk-late');mkdirSync(hooks);
    const helperPath=fileURLToPath(new URL('../scripts/browser-qa-browser-use.py',import.meta.url));
    writeFileSync(join(hooks,'sitecustomize.py'),String.raw`
import os,sys,pathlib
if len(sys.argv)==5 and sys.argv[0]==os.environ.get('P7_SDK_HELPER') and sys.argv[1]=='adapter' and sys.argv[2].startswith('whqa-') and sys.argv[4]==str(pathlib.Path(sys.argv[3])/'browser-use-user-data-dir-owned') and os.environ.get('P7_SDK_CHECKPOINT','').startswith(os.environ.get('P7_SDK_TOKEN','!')+'/'):
 import asyncio,json
 from urllib.parse import urlparse
 from cdp_use import CDPClient
 original=CDPClient.start
 hit=False
 async def controlled(self,*args,**kwargs):
  global hit
  result=await original(self,*args,**kwargs)
  parsed=urlparse(self.url)
  if not hit and parsed.hostname in ('127.0.0.1','localhost') and parsed.path.startswith('/devtools/browser/'):
   hit=True
   info=await self.send.SystemInfo.getProcessInfo()
   browsers=[p['id'] for p in info['processInfo'] if p['type']=='browser']
   if len(browsers)!=1:raise RuntimeError('owned SystemInfo browser count mismatch')
   pathlib.Path(os.environ['P7_SDK_CHECKPOINT']).write_text(json.dumps({'helper_pid':os.getpid(),'browser_pid':browsers[0],'port':parsed.port,'session':sys.argv[2],'root':sys.argv[3],'profile':sys.argv[4],'real_connection_completed':True}))
   while not pathlib.Path(os.environ['P7_SDK_RELEASE']).exists():await asyncio.sleep(.01)
  return result
 CDPClient.start=controlled
`);
    let run;try{
      run=f.start(`set -eu\nprintf entered > ${shellWord(marker)}\nsleep 2\nprintf late > ${shellWord(late)}\n`,{PYTHONPATH:hooks+(process.env.PYTHONPATH?':'+process.env.PYTHONPATH:''),P7_SDK_HELPER:helperPath,P7_SDK_TOKEN:f.root,P7_SDK_CHECKPOINT:checkpoint,P7_SDK_RELEASE:release});
      const deadline=Date.now()+30000;while(!existsSync(checkpoint)&&Date.now()<deadline&&run.child.exitCode===null&&run.child.signalCode===null)await delay(20);
      expect(existsSync(checkpoint),'must reach real SDK CDP start after successful connection').toBe(true);const point=JSON.parse(readFileSync(checkpoint,'utf8'));expect(point.real_connection_completed).toBe(true);
      const ids=JSON.parse(execFileSync(nativePython,['-c',String.raw`
import psutil,json,sys
h=psutil.Process(int(sys.argv[1]));b=psutil.Process(int(sys.argv[2]));owner=int(sys.argv[3]);a=h.cmdline();ba=b.cmdline()
print(json.dumps({'helper_start':h.create_time(),'browser_start':b.create_time(),'parent_matches':h.ppid()==owner and b.ppid()==owner,'helper_role_matches':len(a)==6 and a[1]==sys.argv[4] and a[2]=='adapter' and a[3]==sys.argv[5] and a[4]==sys.argv[6] and a[5]==sys.argv[7],'browser_profile_matches':'--user-data-dir='+sys.argv[7] in ba,'browser_exe_matches':b.exe()==sys.argv[8]}))
`,String(point.helper_pid),String(point.browser_pid),String(run.child.pid),helperPath,point.session,point.root,point.profile,nativeChrome],{encoding:'utf8'}));
      expect(ids.parent_matches).toBe(true);expect(ids.helper_role_matches).toBe(true);expect(ids.browser_profile_matches).toBe(true);expect(ids.browser_exe_matches).toBe(true);
      const connections=execFileSync('/usr/sbin/lsof',['-nP','-a','-p',String(point.helper_pid),'-iTCP','-Fn'],{encoding:'utf8'});expect(connections.split('\n').some(row=>row.startsWith('n')&&row.includes('->127.0.0.1:'+point.port))).toBe(true);
      expect(existsSync(join(point.root,point.session+'.sock')),'SDK ready socket must not exist at this await').toBe(false);expect(run.output()).not.toContain('"native_qa":"owned"');expect(existsSync(marker)).toBe(false);expect(f.hits).toHaveLength(0);
      const start=Date.now();expect(run.child.kill('SIGTERM')).toBe(true);await delay(100);writeFileSync(release,'release');const r=await run.done;nativeResult(r,143);expect(Date.now()-start).toBeLessThan(15000);expect(r.stdout).not.toContain('cleanup_incomplete');expect(r.stdout).not.toContain('"native_qa":"owned"');
      const alive=JSON.parse(execFileSync(nativePython,['-c',String.raw`
import psutil,json,sys
result=[]
for pid,start in [(int(sys.argv[1]),float(sys.argv[2])),(int(sys.argv[3]),float(sys.argv[4]))]:
 try:result.append(psutil.Process(pid).create_time()==start)
 except psutil.NoSuchProcess:result.append(False)
print(json.dumps(result))
`,String(point.helper_pid),String(ids.helper_start),String(point.browser_pid),String(ids.browser_start)],{encoding:'utf8'}));expect(alive).toEqual([false,false]);expect(existsSync(point.root)).toBe(false);await delay(Math.max(0,2500-(Date.now()-start)));expect(existsSync(marker)).toBe(false);expect(existsSync(late)).toBe(false);expect(f.hits).toHaveLength(0);
      console.log('ORACLE-P7-SDK-AWAIT '+JSON.stringify({connected:true,system_info_same_browser:true,helper_tcp_matches:true,before_ready:true,code:r.code,signal:r.signal,both_identities_exited:true,root_removed:true}));
    }finally{writeFileSync(release,'release');await f.close();}
  },90000);

  it('native FIFO screenshot write cancellation leaves no late write or owned child',async()=>{
    const f=await nativeFixture(),fifo=join(f.evidence,'screen.fifo'),baseline=join(f.evidence,'baseline.png'),ready=join(f.evidence,'fifo-ready'),go=join(f.root,'fifo-go'),after=join(f.evidence,'screenshot-returned'),late=join(f.evidence,'screenshot-late');
    execFileSync('/usr/bin/mkfifo',[fifo]);const fs=await import('node:fs');const info=fs.statSync(fifo);expect(info.isFIFO()).toBe(true);const reader=fs.openSync(fifo,fs.constants.O_RDONLY|fs.constants.O_NONBLOCK),writer=fs.openSync(fifo,fs.constants.O_WRONLY|fs.constants.O_NONBLOCK);let capacity=0;
    try{const block=Buffer.alloc(4096);while(true){try{capacity+=fs.writeSync(writer,block);}catch(error){if(error.code==='EAGAIN')break;throw error;}}}finally{fs.closeSync(writer);}expect(capacity).toBeGreaterThan(0);const buffer=Buffer.alloc(65536);while(true){try{if(fs.readSync(reader,buffer)===0)break;}catch(error){if(error.code==='EAGAIN')break;throw error;}}
    let run;try{
      const noise=`(()=>{const c=document.createElement('canvas');c.width=2048;c.height=2048;const x=c.getContext('2d');const d=x.createImageData(2048,2048);let n=1;for(let i=0;i<d.data.length;i+=4){n=(n*1664525+1013904223)>>>0;d.data[i]=n&255;d.data[i+1]=(n>>>8)&255;d.data[i+2]=(n>>>16)&255;d.data[i+3]=255;}x.putImageData(d,0,0);document.body.replaceChildren(c);return true})()`;
      run=f.start('set -eu\n'+nativeOwned+`browser-use eval ${shellWord(noise)}\nbrowser-use screenshot --full ${shellWord(baseline)}\nprintf ready > ${shellWord(ready)}\nwhile [ ! -f ${shellWord(go)} ]; do sleep 0.05; done\nbrowser-use screenshot --full ${shellWord(fifo)}\nprintf returned > ${shellWord(after)}\nsleep 2\nprintf late > ${shellWord(late)}\n`);
      let deadline=Date.now()+30000;while(!existsSync(ready)&&Date.now()<deadline&&run.child.exitCode===null&&run.child.signalCode===null)await delay(25);expect(existsSync(ready),'real large screenshot preparation must finish').toBe(true);expect(statSync(baseline).size).toBeGreaterThan(capacity);
      const own=readFileSync(join(f.evidence,'owned'),'utf8').trim().split('\n'),helper=Number(own[1]);const helperStart=Number(execFileSync(nativePython,['-c','import psutil,sys;print(psutil.Process(int(sys.argv[1])).create_time())',String(helper)],{encoding:'utf8'}));writeFileSync(go,'go');
      const canonicalFifo=fs.realpathSync(fifo),stableFifo=value=>value.isFIFO()&&value.dev===info.dev&&value.ino===info.ino;
      expect(stableFifo(fs.fstatSync(reader))).toBe(true);expect(stableFifo(fs.statSync(fifo))).toBe(true);
      let head=Buffer.alloc(0),fdMatched=false;deadline=Date.now()+15000;
      while(Date.now()<deadline&&run.child.exitCode===null&&run.child.signalCode===null){
        if(head.length<8){try{const bytes=Buffer.alloc(8-head.length),n=fs.readSync(reader,bytes);if(n)head=Buffer.concat([head,bytes.subarray(0,n)]);}catch(error){if(error.code!=='EAGAIN')throw error;}}
        try{
          const rows=execFileSync('/usr/sbin/lsof',['-nP','-a','-p',String(helper),'-Ffaitn'],{encoding:'utf8'}).split('\n');let fd,mode,inode,type,name;
          for(const row of [...rows,'fEND']){
            if(row.startsWith('f')){
              if(/^\d+$/.test(fd||'')&&mode==='w'&&type==='FIFO'&&inode===String(info.ino)&&name&&!name.includes(' (deleted)')&&fs.realpathSync(name)===canonicalFifo&&stableFifo(fs.statSync(name))&&stableFifo(fs.fstatSync(reader))&&stableFifo(fs.statSync(fifo))){
                const currentStart=Number(execFileSync(nativePython,['-c','import psutil,sys;print(psutil.Process(int(sys.argv[1])).create_time())',String(helper)],{encoding:'utf8'}));
                if(currentStart===helperStart)fdMatched=true;
              }
              fd=row.slice(1);mode=inode=type=name=undefined;
            }else if(row.startsWith('a'))mode=row.slice(1);else if(row.startsWith('i'))inode=row.slice(1);else if(row.startsWith('t'))type=row.slice(1);else if(row.startsWith('n'))name=row.slice(1);
          }
        }catch{}
        if(fdMatched&&head.length===8)break;await delay(25);
      }
      expect([...head]).toEqual([137,80,78,71,13,10,26,10]);expect(fdMatched,'must observe real helper writable FIFO FD/inode').toBe(true);expect(existsSync(after)).toBe(false);expect(run.child.exitCode).toBe(null);await delay(2000);expect(existsSync(after)).toBe(false);const start=Date.now();expect(run.child.kill('SIGTERM')).toBe(true);const r=await run.done;nativeResult(r,143);expect(Date.now()-start).toBeLessThan(15000);
      const same=JSON.parse(execFileSync(nativePython,['-c','import psutil,json,sys\ntry: alive=psutil.Process(int(sys.argv[1])).create_time()==float(sys.argv[2])\nexcept psutil.NoSuchProcess: alive=False\nprint(json.dumps(alive))',String(helper),String(helperStart)],{encoding:'utf8'}));expect(same).toBe(false);nativeClean(f);expect(r.stdout).not.toContain('cleanup_incomplete');
      let drained=0;while(true){try{const n=fs.readSync(reader,buffer);if(!n)break;drained+=n;}catch(error){if(error.code==='EAGAIN')break;throw error;}}await delay(2500);expect(existsSync(after)).toBe(false);expect(existsSync(late)).toBe(false);expect(stableFifo(fs.fstatSync(reader))).toBe(true);expect(stableFifo(fs.statSync(fifo))).toBe(true);expect(fs.realpathSync(fifo)).toBe(canonicalFifo);
      console.log('ORACLE-P7-FIFO-WRITE '+JSON.stringify({capacity,baseline_bytes:statSync(baseline).size,png_header:true,helper_write_fd_inode:true,reader_held_through_exit:true,code:r.code,signal:r.signal,drained_bytes:drained,root_removed:true}));
    }finally{if(!existsSync(go))writeFileSync(go,'go');await f.close();fs.closeSync(reader);}
  },90000);
});

// Independent terminal verify TCR: append only; old 57 cases/frozen 16 unchanged.
// Fake engine/CDP isolates credentials; production context/session owns the run.
async function verifyAgentCookieOutput(channel){
  const root=mkdtempSync(join(tmpdir(),'bqa-verify-cookie-')),bin=join(root,'bin'),evidence=join(root,'evidence'),profile=join(root,'agent-browser-profile-owned');
  for(const dir of [bin,evidence,profile])mkdirSync(dir);
  const cookie={name:'ordinary',value:'VERIFY_SYNTHETIC_TICKET_OUTPUT_SENTINEL',domain:'app.example.test',path:'/',secure:true,httpOnly:true,session:true};
  const source=await memoryCdp([cookie]),receiver=await memoryCdp([]);let toolReads=0;
  const jarServer=createServer((req,res)=>{toolReads++;res.setHeader('content-type','application/json');res.end(JSON.stringify(receiver.received));});
  await new Promise(resolve=>jarServer.listen(0,'127.0.0.1',resolve));
  const daemon=spawn(process.execPath,['-e',`process.title='agent-browser';const {spawn}=require('node:child_process');const b=spawn(process.execPath,['-e',"process.title='Chrome --user-data-dir='+process.argv[1];setInterval(()=>{},1000)",process.argv[1]],{stdio:'ignore'});process.on('SIGTERM',()=>b.kill('SIGTERM'));b.on('close',()=>process.exit());setInterval(()=>{},1000);`,profile],{stdio:'ignore'});
  const daemonDone=new Promise(resolve=>daemon.once('close',resolve));
  writeFileSync(join(bin,'agent-browser'),`#!${process.execPath}
const fs=require('node:fs'),p=require('node:path'),a=process.argv.slice(2),s=a[a.indexOf('--session')+1]||process.env.BROWSER_QA_SESSION;
if(a.includes('open'))fs.writeFileSync(p.join(process.env.AGENT_BROWSER_SOCKET_DIR,s+'.pid'),process.env.BQA_DAEMON);
else if(a.includes('cdp-url'))console.log(process.env.BQA_RECEIVER);
else if(a.includes('close')){try{process.kill(Number(process.env.BQA_DAEMON),'SIGTERM')}catch{}}
else if(a.includes('cookies'))fetch(process.env.BQA_JAR).then(r=>r.json()).then(jar=>{const text=JSON.stringify(jar);const channel=process.env.BQA_OUTPUT;const stream=channel==='stderr'?process.stderr:process.stdout;if(channel==='split-stdout'){const pos=text.indexOf(jar[0].value)+Math.floor(jar[0].value.length/2);stream.write(text.slice(0,pos));setTimeout(()=>stream.write(text.slice(pos)+'\\n'),80);}else stream.write(text+'\\n');});
`,{mode:0o755});
  const scenario=join(root,'scenario.sh');writeFileSync(scenario,channel==='safe'?'echo safe-scenario\n':`agent-browser --session "$BROWSER_QA_SESSION" cookies\n`);
  const env={...process.env,PATH:bin+':'+process.env.PATH,BROWSER_QA_ENGINE:'agent-browser',BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:source.endpoint,BROWSER_QA_TICKET_TOP_LEVEL_SITE:'',BROWSER_QA_ALLOWED_DOMAINS:'app.example.test',BQA_DAEMON:String(daemon.pid),BQA_RECEIVER:receiver.endpoint,BQA_JAR:`http://127.0.0.1:${jarServer.address().port}/jar`,BQA_OUTPUT:channel};
  try{
    const r=await gateway(['--url','https://app.example.test/private','--evidence-dir',evidence,'--','bash',scenario],env);
    const hit=(r.stdout+r.stderr).includes(cookie.value);
    console.log('ORACLE-VERIFY-COOKIE '+JSON.stringify({channel,code:r.code,transferred:receiver.received.length,tool_reads:toolReads,output_contains_synthetic_cookie:hit,output_sha256:createHash('sha256').update(r.stdout+r.stderr).digest('hex')}));
    expect(source.methods).toEqual(['Browser.getVersion','Target.getTargets','Storage.getCookies','Target.getTargets']);
    expect(receiver.received).toHaveLength(1);expect(receiver.received[0].value).toBe(cookie.value);
    expect(toolReads).toBe(channel==='safe'?0:1);
    expect(existsSync(profile),'production cleanup must remove owned profile').toBe(false);
    expect(hit,'AC007 transferred cookie must not enter stdout or stderr').toBe(false);
    if(channel==='safe')expect(r.code).toBe(0);else{expect(Number.isInteger(r.code)).toBe(true);expect(r.code,'secret output refusal must stay nonzero').not.toBe(0);}
  }finally{daemon.kill('SIGTERM');await daemonDone;await source.close();await receiver.close();await new Promise(resolve=>jarServer.close(resolve));rmSync(root,{recursive:true,force:true});}
}
describe('N3 verify cookie-output protection',()=>{
  it.each(['stdout','stderr','split-stdout','safe'])('agent-browser receiver cookie %s follows the output contract',async channel=>{await verifyAgentCookieOutput(channel);},15000);
});

// The native source uses a real loopback transport. The collision relay rewrites
// only this run's owned DevToolsActivePort file, not peerIdentity or its comparison.
async function verifyNativeSourceCleanup(mode){
  const f=await nativeFixture(),hook=join(f.root,'verify-owner-hook.mjs'),events=join(f.root,'verify-owner-events.jsonl'),nativeEndpoint=join(f.root,'verify-native-endpoint.json'),marker=join(f.evidence,'must-not-enter');
  const sessionPath=fileURLToPath(new URL('../scripts/browser-qa-session.mjs',import.meta.url)),helperPath=fileURLToPath(new URL('../scripts/browser-qa-browser-use.py',import.meta.url));
  let upgradeHit=false,upgradeCount=0;const sockets=new Set(),methods=[],upstreams=new Set();
  const server=createServer();
  server.on('upgrade',(req,socket,head)=>{
    upgradeHit=true;upgradeCount++;sockets.add(socket);socket.on('close',()=>sockets.delete(socket));
    if(mode==='refused'){socket.destroy();return;}
    if(mode==='cancel-before-compare')return;
    const point=JSON.parse(readFileSync(nativeEndpoint,'utf8'));
    import('node:net').then(({connect})=>{
      const remote=connect({host:'127.0.0.1',port:point.port});upstreams.add(remote);remote.on('close',()=>upstreams.delete(remote));remote.on('error',()=>socket.destroy());socket.on('error',()=>remote.destroy());socket.on('close',()=>remote.destroy());
      remote.once('connect',()=>{const headers=Object.entries(req.headers).map(([k,v])=>k+': '+v).join('\r\n');remote.write('GET '+point.path+' HTTP/1.1\r\n'+headers+'\r\n\r\n');if(head.length)remote.write(head);});
      // Observe client websocket frames without changing their bytes or methods.
      let buffered=Buffer.alloc(0);socket.on('data',chunk=>{buffered=Buffer.concat([buffered,chunk]);while(buffered.length>=2){let n=buffered[1]&127,o=2;if(n===126){if(buffered.length<4)break;n=buffered.readUInt16BE(2);o=4;}if(n===127)break;const masked=Boolean(buffered[1]&128);if(buffered.length<o+(masked?4:0)+n)break;const mask=buffered.subarray(o,o+4);if(masked)o+=4;const body=Buffer.from(buffered.subarray(o,o+n));const opcode=buffered[0]&15;buffered=buffered.subarray(o+n);if(masked)for(let i=0;i<body.length;i++)body[i]^=mask[i%4];if(opcode===1){try{methods.push(JSON.parse(body).method);}catch{}}}});
      socket.pipe(remote);remote.pipe(socket);
    }).catch(()=>socket.destroy());
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port,sourceEndpoint=`ws://127.0.0.1:${port}/devtools/browser/verify-controlled`;
  writeFileSync(hook,String.raw`
import cp from 'node:child_process';import fs from 'node:fs/promises';import syncfs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
const e=process.env;if(process.argv[1]===e.P7_VERIFY_ENTRY&&e.P7_VERIFY_EVENTS.startsWith(e.P7_VERIFY_ROOT+'/')){
 const record=v=>syncfs.appendFileSync(e.P7_VERIFY_EVENTS,JSON.stringify(v)+'\n');const spawn=cp.spawn,read=fs.readFile;let root,changed=false;
 const WS=globalThis.WebSocket;globalThis.WebSocket=class extends WS{send(data){try{const m=JSON.parse(String(data));if(typeof m.method==='string')record({event:'cdp-method',method:m.method});}catch{}return super.send(data);}};
 cp.spawn=function(exe,args=[],options){const c=spawn.call(this,exe,args,options);const role=args[0]===e.P7_VERIFY_HELPER&&args[1]==='adapter'?'helper':exe===e.P7_VERIFY_CHROME&&args.some(a=>String(a).startsWith('--user-data-dir='))?'browser':null;if(role){if(role==='helper')root=args[3];const identity=cp.spawnSync('/bin/ps',['-ww','-p',String(c.pid),'-o','pid=,ppid=,lstart=,command='],{encoding:'utf8'}).stdout.trim();record({event:'spawn',role,pid:c.pid,identity,root});const kill=c.kill;c.kill=function(signal){record({event:'kill',role,pid:c.pid,signal});return kill.call(this,signal);};if(role==='helper'){const write=c.stdin.write;c.stdin.write=function(data,...rest){try{const m=JSON.parse(String(data));if(m.endpoint)record({event:'helper_attach'});}catch{}return write.call(this,data,...rest);};}}return c;};
 fs.readFile=async function(path,...args){const result=await read.call(this,path,...args);if(e.P7_VERIFY_MODE==='collision'&&!changed&&root&&path===root+'/browser-use-user-data-dir-owned/DevToolsActivePort'){changed=true;const lines=String(result).trim().split('\n');await fs.writeFile(e.P7_VERIFY_NATIVE,JSON.stringify({port:Number(lines[0]),path:lines[1]}));await fs.writeFile(path,e.P7_VERIFY_PORT+'\n/devtools/browser/verify-controlled\n');record({event:'relay-bound',root});return read.call(this,path,...args);}return result;};syncBuiltinESMExports();
}
`);
  let run,settled=false,result,beforeCleanup=[];
  const readEvents=()=>existsSync(events)?readFileSync(events,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
  try{
    run=f.start(`printf entered > ${shellWord(marker)}\n`,{NODE_OPTIONS:`--import=${hook}`,P7_VERIFY_ENTRY:sessionPath,P7_VERIFY_HELPER:helperPath,P7_VERIFY_CHROME:nativeChrome,P7_VERIFY_ROOT:f.root,P7_VERIFY_EVENTS:events,P7_VERIFY_NATIVE:nativeEndpoint,P7_VERIFY_MODE:mode,P7_VERIFY_PORT:String(port),BROWSER_QA_AUTH_MODE:'read-only-ticket-export',BROWSER_QA_TICKET_SOURCE_WS:sourceEndpoint});
    run.done.then(r=>{settled=true;result=r;});
    const deadline=Date.now()+20000;while(!upgradeHit&&!settled&&Date.now()<deadline)await delay(20);
    expect(upgradeHit,'must reach actual source connection after native receiver identity').toBe(true);
    if(mode==='cancel-before-compare')expect(run.child.kill('SIGTERM')).toBe(true);
    const until=Date.now()+9000;while(!settled&&Date.now()<until)await delay(20);
    beforeCleanup=readEvents();const children=beforeCleanup.filter(e=>e.event==='spawn');
    expect(children.map(c=>c.role).sort()).toEqual(['browser','helper']);
    const current=children.map(c=>({role:c.role,pid:c.pid,alive:(()=>{try{process.kill(c.pid,0);return true;}catch{return false;}})()}));
    console.log('ORACLE-VERIFY-SOURCE-CLEANUP '+JSON.stringify({mode,source_upgrade:true,gateway_settled:settled,gateway_exit:result?.code??null,source_upgrade_count:upgradeCount,samepeer_typed_failure:run.output().includes('SOURCE_RECEIVER_IDENTICAL'),methods,child_observations:current,browser_term_calls:beforeCleanup.filter(e=>e.event==='kill'&&e.role==='browser').length,helper_attach_calls:beforeCleanup.filter(e=>e.event==='helper_attach').length,port}));
    expect(existsSync(marker)).toBe(false);
    expect(methods).not.toContain('Browser.close');expect(beforeCleanup.filter(e=>e.event==='cdp-method').map(e=>e.method),'unverified or samepeer must never send Browser.close').not.toContain('Browser.close');
    if(mode==='collision'){
      expect(upgradeCount,'receiver and source must both reach the same real relay').toBe(2);expect(run.output(),'must hit actual samepeer classification, not relay failure').toContain('SOURCE_RECEIVER_IDENTICAL');
      expect(beforeCleanup.filter(e=>e.event==='relay-bound')).toHaveLength(1);
      expect(beforeCleanup.filter(e=>e.event==='kill'&&e.role==='browser'),'samepeer must never TERM the browser').toEqual([]);
      expect(beforeCleanup.filter(e=>e.event==='helper_attach')).toEqual([]);
      expect(current.find(c=>c.role==='browser').alive).toBe(true);
      expect(current.find(c=>c.role==='helper').alive,'unattached owned helper must be reclaimed').toBe(false);
    }else{
      expect(current.every(c=>!c.alive),'only authenticated owned children must exit before harness cleanup').toBe(true);
      expect(children[0].root&&existsSync(children[0].root),'owned root removed after observed exits').toBe(false);
    }
    expect(settled,'gateway must settle before fixture signals any retained child').toBe(true);
    nativeResult(result,mode==='cancel-before-compare'?143:1);
    if(mode==='collision')expect(result.stdout).toContain('cleanup_incomplete');else expect(result.stdout).not.toContain('cleanup_incomplete');
  }finally{
    // Harness cleanup is after every oracle observation; only this run's direct
    // child with unchanged start/PPID/command may be signalled, never a scan kill.
    const children=readEvents().filter(e=>e.event==='spawn');
    for(const c of children){let now='';try{now=execFileSync('/bin/ps',['-ww','-p',String(c.pid),'-o','pid=,ppid=,lstart=,command='],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}const parts=now.split(/\s+/),original=c.identity.split(/\s+/);const stable=now&&parts.slice(0,7).join(' ')===original.slice(0,7).join(' ')&&Number(parts[1])===run?.child.pid;const role= c.role==='helper'?parts.slice(8).join(' ')===original.slice(8).join(' ')&&parts.slice(8).join(' ').includes(helperPath+' adapter ')&&parts.includes(c.root)&&parts.includes(c.root+'/browser-use-user-data-dir-owned'):now===c.identity;if(stable&&role)try{process.kill(c.pid,'SIGTERM');}catch{}}
    for(const remote of upstreams)remote.destroy();for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve));
    if(run){await Promise.race([run.done,delay(5000)]);if(run.child.exitCode===null&&run.child.signalCode===null)run.child.kill('SIGTERM');await run.done;}
    for(const c of children){for(let n=0;n<100;n++){try{process.kill(c.pid,0);await delay(20);}catch{break;}}}
    for(const c of children)if(c.root&&!children.some(x=>{try{process.kill(x.pid,0);return true;}catch{return false;}}))rmSync(c.root,{recursive:true,force:true});
    await f.close();rmSync(f.root,{recursive:true,force:true});console.log('ORACLE-VERIFY-SOURCE-FIXTURE-CLEAN '+JSON.stringify({mode,port,fixture_removed:!existsSync(f.root)}));
  }
}
describe('N3 verify source-unverified cleanup',()=>{
  it.each(['refused','cancel-before-compare','collision'])('native source %s preserves source and settles owned cleanup',async mode=>{await verifyNativeSourceCleanup(mode);},45000);
});

// Independent OCR184 TCR: one owned-group cancellation counterexample. No
// setsid escape; the leader exits on TERM while its real same-group work ignores it.
async function verifyCommandProcess(pid){
  return JSON.parse(execFileSync(nativePython,['-c',String.raw`
import json,os,psutil,sys
try:
 p=psutil.Process(int(sys.argv[1]));print(json.dumps({'pid':p.pid,'ppid':p.ppid(),'pgid':os.getpgid(p.pid),'start':p.create_time(),'exe':p.exe(),'argv':p.cmdline(),'status':p.status()}))
except psutil.NoSuchProcess:print('null')
`,String(pid)],{encoding:'utf8'}));
}
describe('N3 verify scenario group cancellation',()=>{
  it('settles cancellation when the leader exits but owned same-group work ignores TERM and holds pipes',async()=>{
    const f=await nativeFixture(),ready=join(f.evidence,'term-ready.json'),ignored=join(f.evidence,'term-ignored'),leafFile=join(f.root,'same-group-work.mjs');
    writeFileSync(leafFile,`import fs from 'node:fs';process.on('SIGTERM',()=>fs.writeFileSync(${JSON.stringify(ignored)},'TERM received and ignored'));fs.writeFileSync(${JSON.stringify(ready)},JSON.stringify({pid:process.pid,leader:process.ppid}));process.stdout.write('owned same-group work ready');setInterval(()=>{},1000);`);
    execFileSync(process.execPath,['--check',leafFile],{stdio:'pipe'});
    const foreign=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'}),foreignDone=new Promise(resolve=>foreign.once('close',resolve));
    let run,leafBefore,leaderBefore,foreignBefore,settled=false,result,observation;
    try{
      foreignBefore=await verifyCommandProcess(foreign.pid);expect(foreignBefore).not.toBe(null);
      run=f.start('set -eu\n'+nativeOwned+`\ntrap 'exit 0' TERM\n${shellWord(process.execPath)} ${shellWord(leafFile)} &\nwait\n`);
      run.done.then(r=>{settled=true;result=r;});
      const readyDeadline=Date.now()+30000;while(!existsSync(ready)&&!settled&&Date.now()<readyDeadline)await delay(20);
      expect(existsSync(ready),'real handler must be installed and the work must enter before cancellation: '+run.output()).toBe(true);
      const point=JSON.parse(readFileSync(ready,'utf8'));leafBefore=await verifyCommandProcess(point.pid);leaderBefore=await verifyCommandProcess(point.leader);
      expect(leafBefore).not.toBe(null);expect(leaderBefore).not.toBe(null);expect(leaderBefore.ppid).toBe(run.child.pid);expect(leaderBefore.pgid).toBe(leaderBefore.pid);expect(leafBefore.ppid).toBe(leaderBefore.pid);expect(leafBefore.pgid).toBe(leaderBefore.pgid);expect(leafBefore.argv).toContain(leafFile);expect(foreignBefore.pgid).not.toBe(leaderBefore.pgid);
      expect(run.child.kill('SIGTERM'),'send exactly one real cancellation to the gateway').toBe(true);
      const ignoredDeadline=Date.now()+1200;while(!existsSync(ignored)&&Date.now()<ignoredDeadline&&!settled)await delay(10);
      expect(existsSync(ignored),'the real same-group work must receive and ignore TERM').toBe(true);
      let leaderAfter;const leaderDeadline=Date.now()+1000;do{leaderAfter=await verifyCommandProcess(leaderBefore.pid);if(!leaderAfter||leaderAfter.status==='zombie')break;await delay(10);}while(Date.now()<leaderDeadline);
      const ignoring=await verifyCommandProcess(leafBefore.pid);expect(!leaderAfter||leaderAfter.status==='zombie','the actual detached leader must exit before this counterexample').toBe(true);expect(ignoring?.start).toBe(leafBefore.start);expect(ignoring?.pgid).toBe(leafBefore.pgid);expect(ignoring?.status).not.toBe('zombie');
      const settledDeadline=Date.now()+15000;while(!settled&&Date.now()<settledDeadline)await delay(20);
      const leafAfter=await verifyCommandProcess(leafBefore.pid),foreignAfter=await verifyCommandProcess(foreign.pid);
      observation={handler_ready:true,term_received_and_ignored:true,leader_exited_before_escalation:true,owned_pgid:leaderBefore.pgid,owned_work_pid:leafBefore.pid,owned_work_start:leafBefore.start,gateway_settled_before_harness_cleanup:settled,gateway_code:result?.code??null,gateway_signal:result?.signal??null,owned_work_still_live:Boolean(leafAfter&&leafAfter.status!=='zombie'),foreign_pid:foreign.pid,foreign_start_unchanged:foreignAfter?.start===foreignBefore.start,foreign_pgid:foreignAfter?.pgid??null};
      console.log('ORACLE-VERIFY-IGNORE-TERM '+JSON.stringify(observation));
      expect(observation.foreign_start_unchanged).toBe(true);expect(observation.foreign_pgid).toBe(foreignBefore.pgid);
      expect(settled,'cancellation must settle before the harness reclaims ignored-TERM work').toBe(true);
      nativeResult(result,143);expect(observation.owned_work_still_live,'owned same-group work must really exit despite the missing leader').toBe(false);nativeClean(f);expect(result.stdout).not.toContain('cleanup_incomplete');
    }finally{
      if(leafBefore){const live=await verifyCommandProcess(leafBefore.pid);if(live&&live.start===leafBefore.start&&live.pgid===leafBefore.pgid&&live.argv.includes(leafFile)&&live.pgid!==foreignBefore?.pgid&&live.status!=='zombie'){process.kill(-live.pgid,'SIGKILL');console.log('ORACLE-VERIFY-IGNORE-TERM-HARNESS '+JSON.stringify({owned_group:live.pgid,authenticated_survivor:live.pid,signal:'SIGKILL',after_oracle:true}));}}
      if(run){await Promise.race([run.done,delay(10000)]);if(run.child.exitCode===null&&run.child.signalCode===null)run.child.kill('SIGTERM');await run.done;}
      foreign.kill('SIGTERM');await foreignDone;await f.close();console.log('ORACLE-VERIFY-IGNORE-TERM-CLEAN '+JSON.stringify({fixture_removed:!existsSync(f.root),foreign_owned_test_process_exited:true}));
    }
  },60000);
});
