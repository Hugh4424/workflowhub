// Planning-only final one-case actual CLI oracle. Owned external transport only; no real user message/GitHub acceptance.
// Planning-only frozen oracle: accepted N18 detail contract, U012 scope, N12 until and source021.
// Owned gh transport is a mechanism fixture, NOT a real GitHub PR or user-visible message.
import { afterEach, expect, test } from 'vitest';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan } from '../../core/task-close.mjs';
const authUrl = new URL('../../runtime/interface/git-authorize.mjs', import.meta.url).href;
const cliUrl = new URL('../../tools/cli/stage-runtime.mjs', import.meta.url).href;
const packetUrl = new URL('../../skills/wh-review/scripts/review-materials.mjs', import.meta.url).href;
const roots = [], saved = { ...process.env };
const sha = text => createHash('sha256').update(text).digest('hex');
function environment(f) { const e = { ...saved }; for (const k of Object.keys(e)) if (k.startsWith('GIT_')) delete e[k]; if (f) Object.assign(e, { WORKFLOWHUB_TASK_DIR: f.storage, HOME: f.home, XDG_CONFIG_HOME: join(f.home, '.config') }); return e; }
const realGit = execFileSync('/usr/bin/which', ['git'], { encoding: 'utf8' }).trim();
const git = (cwd, ...args) => execFileSync(realGit, args, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'card05-plan-gap-'))); roots.push({ root, identity: lstatSync(root) });
  const repo = join(root, 'repo'), wt = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home'), id = 'gap-owned', taskDir = join(storage, 'Projects/workflowhub/tasks', id), bare = join(root, 'origin.git');
  for (const p of [repo, home, bare]) mkdirSync(p); mkdirSync(taskDir, { recursive: true });
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Owned planning fixture'); git(repo, 'config', 'user.email', 'owned@example.invalid'); git(repo, 'config', 'commit.gpgsign', 'false'); const hooks = join(root, 'hooks'); mkdirSync(hooks); git(repo, 'config', 'core.hooksPath', hooks);
  writeFileSync(join(repo, 'README.md'), 'baseline\n'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'owned baseline'); git(bare, 'init', '--bare', '-q'); git(repo, 'remote', 'add', 'origin', bare); git(repo, 'push', '-q', 'origin', 'main');
  const branch = 'task/workflowhub/' + id; git(repo, 'worktree', 'add', '-q', '-b', branch, wt, 'main'); const materials = join(wt, 'specs', id); mkdirSync(materials, { recursive: true });
  const decision = '# Decision\n\n## 外置事实索引\n基准：当前 task 根。\n- 原文：quality/evidence/original.md\n\n## 工作包与决定\n完整当前正文 FIRST-CURRENT\n末尾 END-CURRENT\n';
  writeFileSync(join(materials, 'decision-log.md'), decision); writeFileSync(join(materials, 'spec.md'), '# Owned visible result\nFull source for close fixture.\n'); git(wt, 'add', 'specs'); git(wt, 'commit', '-qm', 'owned task materials');
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: id, target_repo_root: repo, record_model: 'vnext-single-write', activation_cohort: 'post', workspace_mode: 'existing', workspace_root: wt })); writeFileSync(join(taskDir, 'facts.jsonl'), '');
  const original = '# 外置原文\r\n用户真实要求 COMPLETE-ORIGINAL\n末尾 END-ORIGINAL\n'; mkdirSync(join(taskDir, 'quality/evidence'), { recursive: true }); writeFileSync(join(taskDir, 'quality/evidence/original.md'), original);
  return { root, repo, wt, storage, home, id, taskDir, branch, bare, decision, original, dir: join(taskDir, 'quality/evidence/git-authorizations') };
}
afterEach(() => { for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); for (const { root, identity } of roots.splice(0)) { expect(realpathSync(root)).toBe(resolve(root)); expect(dirname(root)).toBe(realpathSync(tmpdir())); expect(basename(root).startsWith('card05-plan-gap-')).toBe(true); const now = lstatSync(root); expect([now.dev, now.ino]).toEqual([identity.dev, identity.ino]); rmSync(root, { recursive: true, force: true }); } });
function transport(f, unavailable = false) {
  const bin = join(f.root, 'bin'), calls = join(f.root, 'transport.jsonl'), state = join(f.root, 'pr.json'); mkdirSync(bin); writeFileSync(calls, '');
  const fakeUrl = 'https://github.com/owned/fixture.git'; git(f.repo, 'remote', 'set-url', 'origin', fakeUrl);
  writeFileSync(join(bin, 'git'), `#!${process.execPath}\nconst cp=require('node:child_process'),fs=require('node:fs');let args=process.argv.slice(2);if(!process.cwd().startsWith(${JSON.stringify(f.root + '/')}))process.exit(95);fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({tool:'git',args})+'\\n');if(['push','fetch','ls-remote'].includes(args[0])){args=args.map(x=>x==='origin'?${JSON.stringify(f.bare)}:x);if(args.some(x=>/^https?:|^git@/.test(x)))process.exit(96);}const r=cp.spawnSync(${JSON.stringify(realGit)},args,{cwd:process.cwd(),env:process.env,encoding:'utf8'});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??97);\n`, { mode: 0o700 });
  writeFileSync(join(bin, 'gh'), `#!${process.execPath}\nconst fs=require('node:fs'),cp=require('node:child_process'),args=process.argv.slice(2);if(!process.cwd().startsWith(${JSON.stringify(f.root + '/')}))process.exit(95);fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({tool:'gh',args})+'\\n');if(${unavailable}){process.stderr.write('owned gh unknown failure');process.exit(9);}if(args[0]==='--version'){console.log('gh fixture');}else if(args[0]==='auth'){process.exit(0);}else if(args[0]==='repo'){console.log(JSON.stringify({nameWithOwner:'owned/fixture',defaultBranchRef:{name:'main'},viewerPermission:'WRITE'}));}else if(args[0]==='pr'&&args[1]==='create'){const oid=cp.execFileSync(${JSON.stringify(realGit)},['rev-parse','HEAD'],{encoding:'utf8'}).trim();fs.writeFileSync(${JSON.stringify(state)},JSON.stringify({headRefName:${JSON.stringify(f.branch)},baseRefName:'main',headRefOid:oid,url:'https://github.com/owned/fixture/pull/1',number:1}));console.log('https://github.com/owned/fixture/pull/1');}else if(args[0]==='pr'&&(args[1]==='view'||args[1]==='list')){console.log(JSON.stringify(fs.existsSync(${JSON.stringify(state)})?(args[1]==='view'?JSON.parse(fs.readFileSync(${JSON.stringify(state)})):[JSON.parse(fs.readFileSync(${JSON.stringify(state)}))]):[]));}else process.exit(98);\n`, { mode: 0o700 });
  process.env.PATH = bin + ':' + saved.PATH; process.env.HOME = f.home; process.env.WORKFLOWHUB_TASK_DIR = f.storage;
  return { calls, state };
}
async function closeReady(f) { const p = await prepareDeliveryClosePlan({ taskDir: f.taskDir }); const c = await confirmClosePlan({ taskDir: f.taskDir, planRef: p.plan_ref, replyText: 'Owned fixture actions only, not a real user approval.' }); await authorizeClosePlan({ taskDir: f.taskDir, planRef: p.plan_ref, confirmationRef: c.confirmation_ref }); return { p, c }; }

const closeCli = new URL('../../tools/cli/task-close.mjs', import.meta.url).pathname;
test('N12 CLI target: actual stdout returns PR URL before merge and same confirmed plan resumes without reply or duplicate send', async () => {
  const f = fixture(), t = transport(f), { p, c } = await closeReady(f); expect(p.plan.steps).toContain('pr'); const original = git(f.repo, 'rev-parse', 'main');
  const args = ['execute', '--project=workflowhub', '--task=' + f.id, '--task-path=' + f.taskDir, '--plan-ref=' + p.plan_ref, '--confirmation-ref=' + c.confirmation_ref];
  const first = spawnSync(process.execPath, [closeCli, ...args, '--until=pr'], { cwd: f.wt, env: { ...environment(f), PATH: process.env.PATH }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  expect(first.error).toBeUndefined(); expect(first.status, 'ORACLE-N12-CLI-PR-CUTOFF: ' + first.stderr).toBe(0);
  const actual = JSON.parse(first.stdout); expect(actual.status).toBe('partial'); expect(actual.stopped_at).toBe('pr'); expect(actual.records.find(r => r.operation === 'pr').pr.url).toBe('https://github.com/owned/fixture/pull/1'); expect(first.stdout).toContain('https://github.com/owned/fixture/pull/1'); expect(git(f.repo, 'rev-parse', 'main')).toBe(original);
  // The URL above is actual CLI stdout, not a test-produced message. Ignore stdin precludes another human reply.
  const next = spawnSync(process.execPath, [closeCli, ...args], { cwd: f.wt, env: { ...environment(f), PATH: process.env.PATH }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  expect(next.error).toBeUndefined(); expect(next.status, next.stderr).toBe(0); expect(JSON.parse(next.stdout).status).toBe('completed'); const calls = readFileSync(t.calls, 'utf8').split('\n').filter(Boolean).map(JSON.parse); expect(calls.filter(r => r.tool === 'gh' && r.args[0] === 'pr' && r.args[1] === 'create')).toHaveLength(1);
});
