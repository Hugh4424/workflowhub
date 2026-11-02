import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Frozen before implementation. Exercise the existing cleanup entry, never a live browser.
// Python executes the production script with fixture-only ps/lsof and a recorded os.kill.
// Real signals are used only by the test's finally to stop its own local worker.
const cleanup = fileURLToPath(new URL('../../skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh', import.meta.url));
const python = spawnSync('/bin/sh', ['-c', 'command -v python3'], { encoding: 'utf8' }).stdout.trim();
const session = 'workflowhub-qa-n3-fixture';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function fixture({stubborn=false,identity='stable',localized=false,empty=false}={}) {
  const root = mkdtempSync(join(tmpdir(), 'n3-browser-lifecycle-界-'));
  const bin = join(root, 'bin'); const home = join(root, 'engine'); const temp = join(root, 'temp');
  for (const p of [bin, home, temp]) mkdirSync(p);
  const events = join(root, 'events.jsonl'); const state = join(root, 'processes.json');
  const stop = join(root, 'stop'); const queue = join(root, 'queue');
  writeFileSync(events, '');
  const ownedProfile = join(temp, 'agent-browser-profile-own');
  const foreignProfile = join(temp, 'agent-browser-chrome-foreign');
  mkdirSync(ownedProfile); mkdirSync(foreignProfile);
  const rows = [
    { pid: 701001, ppid: 1, command: '/fixture/bin/agent-browser-darwin-arm64' },
    { pid: 701002, ppid: 701001, command: `/fixture/Google Chrome for Testing --user-data-dir=${ownedProfile}` },
    { pid: 702001, ppid: 1, command: '/fixture/node @playwright/mcp --session foreign' },
    { pid: 703001, ppid: 1, command: '/fixture/node browser_use.skill_cli.server --session foreign' },
  ];
  if(empty)rows.length=0;
  writeFileSync(state, JSON.stringify(rows));
  for (const ext of ['pid', 'sock', 'stream', 'config', 'engine', 'target', 'version']) {
    writeFileSync(join(home, `${session}.${ext}`), ext === 'pid' ? '701001' : 'fixture');
    writeFileSync(join(home, `foreign.${ext}`), 'foreign');
  }
  writeFileSync(join(bin,'agent-browser'),'#!'+python+'\n'+"import os,json,pathlib,sys\nwith open(os.environ['N3_EVENTS'],'a') as f:f.write(json.dumps({'kind':'engine','args':sys.argv[1:],'LC_ALL':os.environ.get('LC_ALL')})+'\\n')\nif 'close' in sys.argv:\n if os.environ['N3_CLOSE_FAIL']=='1':sys.exit(29)\n pathlib.Path(os.environ['N3_STOP']).touch();pathlib.Path(os.environ['N3_STATE']).write_text(json.dumps([r for r in json.loads(pathlib.Path(os.environ['N3_STATE']).read_text()) if r['pid'] not in [701001,701002]]))\n",{mode:0o755});
  writeFileSync(join(bin,'python3'),'#!'+python+'\n'+"import os,sys,json,subprocess,signal,pathlib\nsource=sys.stdin.read();sys.argv=sys.argv[1:]\nstate=pathlib.Path(os.environ['N3_STATE']); events=pathlib.Path(os.environ['N3_EVENTS']);starts=0\ndef event(x):\n with events.open('a') as f:f.write(json.dumps(x)+'\\n')\ndef check_output(args,**kwargs):\n global starts\n rows=json.loads(state.read_text())\n if args[0]=='ps':\n  psenv=kwargs.get('env',os.environ);date='lstart=' in ''.join(args)\n  if date:starts+=1\n  result=[]\n  for r in rows:\n   command=r['command'];ctype=psenv.get('LC_ALL') or psenv.get('LC_CTYPE') or psenv.get('LANG') or 'C'\n   if os.environ['N3_LOCALIZED']=='1' and ctype=='C':command=command.encode('ascii','replace').decode()\n   prefix=str(r['pid'])+' '+(str(r['ppid'])+' ' if 'ppid' in ''.join(args) else '')\n   if date:\n    stamp='Sun Nov 1 10:00:00 2026'\n    if r['pid']==701002 and os.environ['N3_IDENTITY']=='replacement' and starts>1:stamp='Sun Nov 1 11:00:00 2026'\n    if os.environ['N3_IDENTITY']=='unknown' or (os.environ['N3_IDENTITY']=='unknown-daemon' and r['pid']==701001):stamp='??? Nov 1 10:00:00 2026'\n    locale=psenv.get('LC_ALL') or psenv.get('LC_TIME') or psenv.get('LANG') or 'C'\n    if locale.startswith('fr'):stamp=stamp.replace('Sun','dim.')\n    prefix+=stamp+' '\n   result.append(prefix+command)\n  if os.environ['N3_RECORD_PS']=='1':event({'kind':'ps','date':date,'LC_ALL':psenv.get('LC_ALL'),'LC_TIME':psenv.get('LC_TIME'),'LC_CTYPE':psenv.get('LC_CTYPE'),'rows':result})\n  return '\\n'.join(result)+'\\n'\n if args[0]=='lsof':return '701001\\n' if any(r['pid']==701001 for r in rows) else ''\n raise RuntimeError('fixture rejected subprocess '+repr(args))\ndef kill(pid,sig):\n event({'kind':'signal','pid':pid,'signal':int(sig)})\n if sig!=0:state.write_text(json.dumps([r for r in json.loads(state.read_text()) if r['pid']!=pid]))\nsubprocess.check_output=check_output;os.kill=kill\nexec(compile(source,'production-browser-qa-cleanup','exec'))\n",{mode:0o755});
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, HOME: root, TMPDIR: temp,
    AGENT_BROWSER_HOME: home, N3_EVENTS: events, N3_STATE: state, N3_STOP: stop,N3_CLOSE_FAIL:stubborn?'1':'0',N3_IDENTITY:identity,N3_LOCALIZED:localized?'1':'0',N3_RECORD_PS:stubborn||localized?'1':'0' };
  if(localized)Object.assign(env,{LC_ALL:'fr_FR.UTF-8',LC_TIME:'fr_FR.UTF-8',LC_CTYPE:'en_US.UTF-8',LANG:'C'});
  const run = () => spawnSync('bash', [cleanup, session, 'agent-browser'], { env, encoding: 'utf8', timeout: 10000 });
  const records = () => readFileSync(events, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  return { root, home, temp, ownedProfile, foreignProfile, stop, queue, env, run, records,
    destroy: () => rmSync(root, { recursive: true, force: true }) };
}
function use(check) { const f=fixture(); try { check(f, f.run()); } finally { f.destroy(); } }

test('cleanup first requests selected-engine graceful close before exact-session reclamation', () => use((f, result) => {
  assert.equal(result.error, undefined);
  const events=f.records();
  assert.ok(events.some(x => x.kind==='engine' && x.args.includes('close')), 'selected engine close must actually run');
  assert.equal(events[0]?.kind, 'engine', 'graceful close must precede process reclamation');
}));

test('cleanup never SIGKILLs browser or daemon process trees', () => use(f => {
  assert.deepEqual(f.records().filter(x => x.kind==='signal' && x.signal===9), [], 'no force kill on either engine');
}));

test('cleanup preserves concurrent other-engine sessions', () => use(f => {
  assert.deepEqual(f.records().filter(x => x.kind==='signal' && [702001,703001].includes(x.pid)), [], 'foreign session must receive no signal');
}));

test('cleanup removes the owned agent-browser-profile directory', () => use(f => {
  assert.equal(existsSync(f.ownedProfile), false, 'owned profile including injected cookies must disappear');
}));

test('cleanup does not delete unrelated stale-looking temporary directories', () => use(f => {
  assert.equal(existsSync(f.foreignProfile), true, 'a filename prefix does not prove ownership');
}));

test('cleanup removes all owned session metadata and preserves foreign metadata', () => use(f => {
  for (const ext of ['pid','sock','stream','config','engine','target','version']) {
    assert.equal(existsSync(join(f.home,`${session}.${ext}`)), false, `owned .${ext} must be removed`);
    assert.equal(readFileSync(join(f.home,`foreign.${ext}`),'utf8'), 'foreign');
  }
}));

test('cleanup returns true selected-session residual status without failing for foreign processes', () => use((_f, result) => {
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /agent_browser_session_residual_processes=0/);
}));

test('cancellation cleanup stops browser-side work and frees a real queued probe', async () => {
  const f=fixture();
  // A local independent worker models an in-flight browser task and its serialized queue.
  // It emits a late artifact only if cancellation fails. No browser/credentials involved.
  const worker=spawn(process.execPath, ['-e', `
    const fs=require('node:fs');const [stop,queue]=process.argv.slice(1);
    const deadline=Date.now()+4000;
    const timer=setInterval(()=>{if(fs.existsSync(stop)){clearInterval(timer);fs.writeFileSync(queue,'cancelled');process.exit(0);}if(Date.now()>=deadline){clearInterval(timer);fs.writeFileSync(queue,'late-artifact');process.exit(0);}},10);
  `,f.stop,f.queue], { stdio:'ignore' });
  try {
    await pause(100);
    const result=f.run();
    assert.equal(result.error, undefined);
    const until=Date.now()+500;
    while (!existsSync(f.queue) && Date.now()<until) await pause(20);
    assert.equal(existsSync(f.queue), true, 'browser work and following queued probe must be released within 500 ms of cleanup');
    assert.equal(readFileSync(f.queue,'utf8'),'cancelled','cancelled browser work must not publish a late artifact');
  } finally { worker.kill('SIGTERM'); await pause(30); f.destroy(); }
});

// Ticket transfer has no current executable entry. It is deliberately NOT an import-missing
// RED test. P7 must extend the existing context/cleanup route with in-memory source/receiver
// seams, then add tests for domain/path/secure/partition filtering and success/failure/cancel
// zero-secret logging, before implementing that behavior. Real-site reuse remains unavailable.


test('cleanup:localized-stable-unicode-main-browser-actually-gets-TERM',()=>{
 const f=fixture({stubborn:true,localized:true});try{const r=f.run(),events=f.records();assert.equal(r.error,undefined);assert.ok(events.some(x=>x.kind==='engine'&&x.args.includes('close')));assert.deepEqual(events.filter(x=>x.kind==='signal'&&x.signal!==0).map(x=>[x.pid,x.signal]),[[701002,15]],'only authenticated stable main browser receives TERM');assert.equal(existsSync(f.ownedProfile),false);assert.equal(existsSync(f.foreignProfile),true);assert.equal(r.status,1,'unclosed daemon remains a real nonzero cleanup');assert.match(r.stdout,/agent_browser_session_residual_processes=1/);assert.equal(readFileSync(join(f.home,'foreign.pid'),'utf8'),'foreign');for(const x of events.filter(x=>x.kind==='ps')){assert.equal(x.LC_ALL,'');assert.equal(x.LC_TIME,'C');assert.equal(x.LC_CTYPE,'fr_FR.UTF-8');}assert.equal(events.find(x=>x.kind==='engine').LC_ALL,'fr_FR.UTF-8');}finally{f.destroy();}
});
for(const identity of ['replacement','unknown'])test('cleanup:'+identity+'-identity-never-authorizes-TERM',()=>{
 const f=fixture({stubborn:true,identity});try{const r=f.run(),events=f.records();assert.ok(events.some(x=>x.kind==='engine'&&x.args.includes('close')));assert.ok(events.some(x=>x.kind==='ps'&&x.date),'real identity boundary reached');assert.deepEqual(events.filter(x=>x.kind==='signal'&&x.signal!==0),[]);assert.equal(existsSync(f.ownedProfile),true);assert.equal(existsSync(f.foreignProfile),true);assert.equal(r.status,1);assert.match(r.stdout,/agent_browser_session_residual_processes=1/);}finally{f.destroy();}
});
test('cleanup:empty-owned-process-set-is-normal-and-foreign-files-stay',()=>{
 const f=fixture({empty:true});try{const r=f.run();assert.equal(r.status,0,r.stderr);assert.ok(f.records().some(x=>x.kind==='engine'));assert.deepEqual(f.records().filter(x=>x.kind==='signal'),[]);assert.match(r.stdout,/agent_browser_session_residual_processes=0/);assert.equal(existsSync(f.ownedProfile),true,'unobserved profile is not owned');assert.equal(existsSync(f.foreignProfile),true);assert.equal(readFileSync(join(f.home,'foreign.pid'),'utf8'),'foreign');}finally{f.destroy();}
});


test('cleanup:unknown-daemon-stays-while-known-main-browser-alone-is-TERMed',()=>{
 const f=fixture({stubborn:true,identity:'unknown-daemon'});try{const r=f.run(),events=f.records();assert.ok(events.some(x=>x.kind==='ps'&&x.date&&x.rows.some(row=>row.startsWith('701001 ')&&row.includes('???'))));assert.deepEqual(events.filter(x=>x.kind==='signal'&&x.signal!==0).map(x=>[x.pid,x.signal]),[[701002,15]]);assert.equal(r.status,1);assert.match(r.stdout,/agent_browser_session_residual_processes=1/);assert.equal(existsSync(f.foreignProfile),true);}finally{f.destroy();}
});
test('cleanup:existing-valid-LC_CTYPE-is-preserved-without-LC_ALL',()=>{
 const f=fixture({stubborn:true,localized:true});f.env.LC_ALL='';try{const r=f.run(),events=f.records();assert.deepEqual(events.filter(x=>x.kind==='signal'&&x.signal!==0).map(x=>[x.pid,x.signal]),[[701002,15]]);assert.equal(existsSync(f.ownedProfile),false);assert.equal(r.status,1);const ps=events.filter(x=>x.kind==='ps');assert.ok(ps.length);for(const x of ps){assert.equal(x.LC_ALL,'');assert.equal(x.LC_TIME,'C');assert.equal(x.LC_CTYPE,'en_US.UTF-8');}}finally{f.destroy();}
});
