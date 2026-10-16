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
    const r=await gateway(invalidArgs,{BROWSER_QA_AUTH_MODE:'none',BROWSER_QA_TICKET_TOP_LEVEL_SITE:'https://evil.test'});
    expect(r.code).toBe(1);expect(r.stderr).toContain('INVALID_TOP_LEVEL_SITE');
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
  it('reports unsupported cancellable run before agent-browser ownership or CDP assumptions', async () => {
    const r=await gateway(invalidArgs,{BROWSER_QA_ENGINE:'browser-use',BROWSER_QA_AUTH_MODE:'none'});
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('BROWSER_USE_RUN_UNAVAILABLE');
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
