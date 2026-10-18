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
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'n3-browser-lifecycle-'));
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
  writeFileSync(state, JSON.stringify(rows));
  for (const ext of ['pid', 'sock', 'stream', 'config', 'engine', 'target', 'version']) {
    writeFileSync(join(home, `${session}.${ext}`), ext === 'pid' ? '701001' : 'fixture');
    writeFileSync(join(home, `foreign.${ext}`), 'foreign');
  }
  writeFileSync(join(bin, 'agent-browser'), `#!${python}\nimport os,json,pathlib\nwith open(os.environ['N3_EVENTS'],'a') as f:f.write(json.dumps({'kind':'engine','args':__import__('sys').argv[1:]})+'\\n')\nif 'close' in __import__('sys').argv:pathlib.Path(os.environ['N3_STOP']).touch();pathlib.Path(os.environ['N3_STATE']).write_text(json.dumps([r for r in json.loads(pathlib.Path(os.environ['N3_STATE']).read_text()) if r['pid'] not in [701001,701002]]))\n`, { mode: 0o755 });
  writeFileSync(join(bin, 'python3'), `#!${python}\nimport os,sys,json,subprocess,signal,pathlib\nsource=sys.stdin.read();sys.argv=sys.argv[1:]\nstate=pathlib.Path(os.environ['N3_STATE']); events=pathlib.Path(os.environ['N3_EVENTS'])\ndef event(x):\n with events.open('a') as f:f.write(json.dumps(x)+'\\n')\ndef check_output(args,**kwargs):\n rows=json.loads(state.read_text())\n if args[0]=='ps':\n  return '\\n'.join(str(r['pid'])+' '+(str(r['ppid'])+' ' if 'ppid' in ''.join(args) else '')+r['command'] for r in rows)+'\\n'\n if args[0]=='lsof':\n  return '701001\\n' if any(r['pid']==701001 for r in rows) else ''\n raise RuntimeError('fixture rejected subprocess '+repr(args))\ndef kill(pid,sig):\n event({'kind':'signal','pid':pid,'signal':int(sig)})\n if sig!=0:state.write_text(json.dumps([r for r in json.loads(state.read_text()) if r['pid']!=pid]))\nsubprocess.check_output=check_output;os.kill=kill\nexec(compile(source,'production-browser-qa-cleanup','exec'))\n`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, HOME: root, TMPDIR: temp,
    AGENT_BROWSER_HOME: home, N3_EVENTS: events, N3_STATE: state, N3_STOP: stop };
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
