// build-plan target oracle: freeze these bytes; later edits require test change request + independent review.
// Requirements: N1/AC01, latest U012 (stage scope build-code), N12 row17, N20/AC23.
import { afterEach, expect, test } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan } from '../../core/task-close.mjs';
import { checkDecisionLogChain } from '../../tools/cli/check-decision-log-chain.mjs';
const rootUrl = new URL('../../', import.meta.url);
const authUrl = new URL('runtime/interface/git-authorize.mjs', rootUrl).href;
const cli = fileURLToPath(new URL('tools/cli/stage-runtime.mjs', rootUrl));
const roots = [];
const env = () => { const e = { ...process.env }; for (const k of Object.keys(e)) if (k.startsWith('GIT_')) delete e[k]; return e; };
const git = (cwd, ...args) => execFileSync('git', args, { cwd, env: env(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'card05-runtime-target-')));
  roots.push({ root, identity: lstatSync(root) });
  const repo = join(root, 'repo'), taskDir = join(root, 'storage', 'Projects', 'workflowhub', 'tasks', 'card05-owned');
  mkdirSync(repo); mkdirSync(taskDir, { recursive: true });
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Owned card05 oracle'); git(repo, 'config', 'user.email', 'oracle@example.invalid');
  git(repo, 'config', 'commit.gpgsign', 'false'); const hooks = join(root, 'hooks'); mkdirSync(hooks); git(repo, 'config', 'core.hooksPath', hooks);
  writeFileSync(join(repo, 'README.md'), 'baseline\n'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'baseline');
  const branch = 'task/workflowhub/card05-owned', wt = join(root, 'worktree');
  git(repo, 'worktree', 'add', '-q', '-b', branch, wt, 'main');
  const materials = join(wt, 'specs', 'card05-owned'); mkdirSync(materials, { recursive: true });
  writeFileSync(join(materials, 'decision-log.md'), '# Decision\n'); writeFileSync(join(materials, 'spec.md'), '# Spec\n');
  git(wt, 'add', 'specs'); git(wt, 'commit', '-qm', 'materials');
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'card05-owned', created_at: '2026-10-12T00:00:00Z', target_repo_root: repo, record_model: 'vnext-single-write', activation_cohort: 'post', workspace_mode: 'existing', workspace_root: wt }));
  writeFileSync(join(taskDir, 'facts.jsonl'), '');
  return { root, repo, wt, taskDir, branch, dir: join(taskDir, 'quality', 'evidence', 'git-authorizations') };
}
afterEach(() => {
  for (const { root, identity } of roots.splice(0)) {
    expect(realpathSync(root)).toBe(resolve(root)); expect(dirname(root)).toBe(realpathSync(tmpdir())); expect(basename(root).startsWith('card05-runtime-target-')).toBe(true);
    const now = lstatSync(root); expect([now.dev, now.ino]).toEqual([identity.dev, identity.ino]); rmSync(root, { recursive: true, force: true });
  }
});
function authorize(f, action, fields) {
  const source = `import {record,consume} from ${JSON.stringify(authUrl)};try {const value=await (${action === 'record' ? 'record' : 'consume'})(${JSON.stringify({ ...fields, dir: f.dir })});console.log(JSON.stringify({ok:true,value}));}catch(e){console.log(JSON.stringify({ok:false,code:e.code,message:e.message}));}`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: f.wt, env: env(), encoding: 'utf8', timeout: 15000 });
  expect(result.error, 'owned API process started').toBeUndefined(); expect(result.status, result.stderr).toBe(0); return JSON.parse(result.stdout);
}
function moveHead(f) { writeFileSync(join(f.wt, 'README.md'), 'next head\n'); git(f.wt, 'add', 'README.md'); git(f.wt, 'commit', '-qm', 'owned head move'); }
const scope = 'build-code'; // latest U012 says stage, NOT P<n>; no Phase-ID product choice is inferred.
test('N11 target: record persists explicit build-code stage scope', () => {
  const f = fixture(), r = authorize(f, 'record', { operation: 'commit', confirmationRef: 'owned-reply', phase: scope });
  expect(r.ok).toBe(true); expect(JSON.parse(readFileSync(r.value))).toMatchObject({ phase: scope, branch: f.branch });
});
test('N11 target: same branch and explicit stage can consume after HEAD advances', () => {
  const f = fixture(), g = authorize(f, 'record', { operation: 'commit', confirmationRef: 'owned-reply', phase: scope }); expect(g.ok).toBe(true);
  moveHead(f); const result = authorize(f, 'consume', { operation: 'commit', stepId: 'phase-end-1', authorizationRef: g.value, phase: scope });
  expect(result, 'explicit same-stage grant survives a legal HEAD move').toMatchObject({ ok: true });
});
test('N11 target: one stage grant supports distinct steps while original bytes stay immutable', () => {
  const f = fixture(), g = authorize(f, 'record', { operation: 'commit', confirmationRef: 'owned-reply', phase: scope }); expect(g.ok).toBe(true); const bytes = readFileSync(g.value);
  const first = authorize(f, 'consume', { operation: 'commit', stepId: 'phase-end-1', authorizationRef: g.value, phase: scope }); expect(first.ok).toBe(true);
  const second = authorize(f, 'consume', { operation: 'commit', stepId: 'phase-end-2', authorizationRef: g.value, phase: scope });
  expect(second, 'latest U012 permits same-stage reuse').toMatchObject({ ok: true }); expect(second.value.path).not.toBe(first.value.path); expect(readFileSync(g.value)).toEqual(bytes);
});
test.each([undefined, 'verify-code'])('N11 target: scoped grant rejects omitted or different consumer stage (%s)', phase => {
  const f = fixture(), g = authorize(f, 'record', { operation: 'commit', confirmationRef: 'owned-reply', phase: scope }); expect(g.ok).toBe(true);
  const result = authorize(f, 'consume', { operation: 'commit', stepId: 'wrong-scope', authorizationRef: g.value, ...(phase === undefined ? {} : { phase }) });
  expect(result, 'scope must not silently degrade to branch-only authorization').toMatchObject({ ok: false, code: 'AUTH_SCOPE' });
});
test('N11 control: legacy grant still rejects changed HEAD', () => {
  const f = fixture(), g = authorize(f, 'record', { operation: 'commit', confirmationRef: 'owned-reply' }); expect(g.ok).toBe(true); const bytes = readFileSync(g.value); moveHead(f);
  expect(authorize(f, 'consume', { operation: 'commit', stepId: 'legacy-step', authorizationRef: g.value })).toMatchObject({ ok: false, code: 'AUTHORIZATION_HEAD_MISMATCH' }); expect(readFileSync(g.value)).toEqual(bytes);
});
test('N11 control: legacy same-step retry remains idempotent', () => {
  const f = fixture(), g = authorize(f, 'record', { operation: 'commit', confirmationRef: 'owned-reply' }); expect(g.ok).toBe(true);
  const fields = { operation: 'commit', stepId: 'legacy-step', authorizationRef: g.value }, first = authorize(f, 'consume', fields); expect(first.ok).toBe(true);
  expect(authorize(f, 'consume', fields)).toEqual(first);
});
test('N1 target: public verify preserves real nonzero receipt and summarizes it in stage evidence', () => {
  const f = fixture(), input = join(f.wt, 'verify-input.json'); writeFileSync(input, JSON.stringify({ argv: [process.execPath, '-e', 'process.stderr.write("owned target failure\\n"); process.exit(7)'], slug: 'card05-owned-failure' }));
  const r = spawnSync(process.execPath, [cli, 'verify', '--action=execute', '--stage=build-code', '--project=workflowhub', '--task=card05-owned', `--task-path=${f.taskDir}`, `--input=${input}`], { cwd: f.wt, env: { ...env(), WORKFLOWHUB_TASK_DIR: join(f.root, 'storage') }, encoding: 'utf8', timeout: 15000 });
  expect(r.error).toBeUndefined(); const receipt = JSON.parse(r.stdout); expect(receipt.exit_code).toBe(7); expect(readFileSync(receipt.output_ref, 'utf8')).toContain('owned target failure');
  const rows = readFileSync(join(f.taskDir, 'facts.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse), row = rows.find(x => x.record_kind === 'stage' && x.stage === 'build-code');
  expect(row?.evidence?.value, 'executed command fact is not discarded at public verify boundary').toEqual(expect.arrayContaining([expect.objectContaining({ exit_code: 7, failure_signature: expect.any(String) })]));
});
test('N12 target: explicit until=commit returns partial without executing later close actions', async () => {
  const f = fixture(), bare = join(f.root, 'origin.git'); mkdirSync(bare); git(bare, 'init', '--bare', '-q'); git(f.repo, 'remote', 'add', 'origin', bare); git(f.repo, 'push', '-q', 'origin', 'main');
  // TCR-P8-6 / independent250: actual close identity needs an owned stage fact.
  writeFileSync(join(f.taskDir,'facts.jsonl'),JSON.stringify({record_kind:'stage',task_id:'card05-owned',stage:'verify-code',source:'owned-test',created_at:'2026-10-20T00:00:00Z'})+'\n');
  const p = await prepareDeliveryClosePlan({ taskDir: f.taskDir }); const c = await confirmClosePlan({ taskDir: f.taskDir, planRef: p.plan_ref, replyText: 'Owned local fixture close actions only.' });
  await authorizeClosePlan({ taskDir: f.taskDir, planRef: p.plan_ref, confirmationRef: c.confirmation_ref });
  const out = await executeClosePlan({ taskDir: f.taskDir, planRef: p.plan_ref, confirmationRef: c.confirmation_ref, until: 'commit' });
  expect(out.status, 'explicit cutoff returns after its completed action').toBe('partial'); expect(out.stopped_at).toBe('commit'); expect(out.records.map(r => r.operation)).toEqual(['commit']); expect(existsSync(f.wt)).toBe(true);
});
const currentBlock = '# Decision\n\n### N1 接住真实结果\n- **做什么**：接结果。\n- **不做什么**：不加门。\n- **风险**：结果可误读。\n- **改动**：现有文件。\n';
test('N20 target: checker recognizes current N block and four fields without becoming a gate', () => {
  const r = checkDecisionLogChain({ markdown: currentBlock }); expect(r.recognized_blocks).toBe(1); expect(r.recognized_fields).toBeGreaterThanOrEqual(4); expect(r.failures).toEqual([]); expect(r.exit_code).toBe(0);
});
test('N20 target: missing current decision field produces named structural fact', () => {
  const r = checkDecisionLogChain({ markdown: currentBlock.replace('- **风险**：结果可误读。\n', '') });
  expect(r.warnings.some(w => w.decision_id === 'N1' && w.field === '风险'), 'missing field must be attributable to N1.风险').toBe(true); expect(r.failures).toEqual([]); expect(r.exit_code).toBe(0);
});
test('N20 target: broken current decision reference produces named reference fact', () => {
  const r = checkDecisionLogChain({ markdown: currentBlock + '本块依赖 N99。\n' });
  expect(r.warnings.some(w => w.decision_id === 'N1' && w.message.includes('N99')), 'missing referenced decision is observable').toBe(true); expect(r.failures).toEqual([]); expect(r.exit_code).toBe(0);
});
