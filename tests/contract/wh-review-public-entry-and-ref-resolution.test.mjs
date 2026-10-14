// C01 frozen oracle: public ref-resolution is existing behavior (GUARD); method clarity is document TARGET.
// Synthetic provider observes the real public seam. No real review/provider/network is executed.
import { afterEach, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageRuntimeCliMain } from '../../tools/cli/stage-runtime.mjs';
import { runReviewRecovery } from '../../skills/wh-review/scripts/wh-review-cli.mjs';
import { buildReviewMaterials } from '../../skills/wh-review/scripts/review-materials.mjs';
const roots = [];
const originalTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
const hash = text => createHash('sha256').update(text).digest('hex');
const environment = () => {
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  for (const key of Object.keys(env)) if (key.startsWith('GIT_') && !['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_SYSTEM', 'GIT_CONFIG_NOSYSTEM'].includes(key)) delete env[key];
  return env;
};
const git = (cwd, ...args) => execFileSync('git', args, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
afterEach(() => { for (const path of roots.splice(0)) {
  // Cleanup only a verified absolute temporary root created by this test.
  if (!path.startsWith(realpathSync(tmpdir()) + '/c01-public-ref-')) throw new Error('unexpected fixture cleanup path');
  rmSync(path, { recursive: true, force: true });
} if (originalTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = originalTaskDir; });
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'c01-public-ref-'))); roots.push(root);
  const repo = join(root, 'repo'), work = join(root, 'worktree'), task = join(root, 'Projects', 'workflowhub', 'tasks', 'c01-ref-fixture');
  process.env.WORKFLOWHUB_TASK_DIR = root;
  mkdirSync(repo); mkdirSync(task, { recursive: true }); mkdirSync(join(root, 'hooks'));
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Owned C01 oracle'); git(repo, 'config', 'user.email', 'oracle@example.invalid'); git(repo, 'config', 'commit.gpgsign', 'false'); git(repo, 'config', 'core.hooksPath', join(root, 'hooks'));
  writeFileSync(join(repo, 'material.md'), 'CURRENT ACTUAL MATERIAL BYTES\n'); git(repo, 'add', 'material.md'); git(repo, 'commit', '-qm', 'owned baseline'); git(repo, 'worktree', 'add', '-q', '-b', 'task/workflowhub/c01-ref-fixture', work, 'main');
  writeFileSync(join(task, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'c01-ref-fixture', target_repo_root: repo, workspace_mode: 'existing', workspace_root: work, activation_cohort: 'post', record_model: 'vnext-single-write', inputs: {} }));
  writeFileSync(join(task, 'facts.jsonl'), ''); mkdirSync(join(task, 'quality', 'evidence'), { recursive: true });
  const request = { stage: 'build-plan', surface: 'document', materials: { raw_requirement: { ref: 'material.md', sha256: hash('CURRENT ACTUAL MATERIAL BYTES\n') } } };
  const input = join(task, 'quality', 'evidence', 'request.json');
  const save = () => writeFileSync(input, JSON.stringify({ request })); save();
  const argv = ['review', '--action=record', '--stage=build-plan', '--project=workflowhub', '--task=c01-ref-fixture', `--task-path=${task}`, '--input=quality/evidence/request.json'];
  return { root, repo, work, task, request, save, argv };
}
function unavailable(req) { return { status: 'unavailable', stage: req.stage, review_track: null, review_kind: null, review_scope: null, subject_kind: 'document', phase_id: null, provider_results: [], findings: [], error: { code: 'OWNED_OBSERVER_ONLY', message: 'Synthetic interface observation; not provider quality' } }; }
test('GUARD ORACLE-C01-PUBLIC-REF public owner resolves top-level worktree and task evidence refs before dispatch', async () => {
  const f = fixture(); writeFileSync(join(f.task, 'quality', 'evidence', 'owned.md'), 'TASK EVIDENCE BYTES\n');
  f.request.materials.context_map = { ref: 'quality/evidence/owned.md', sha256: hash('TASK EVIDENCE BYTES\n') }; f.save();
  let observed, calls = 0;
  const record = await stageRuntimeCliMain(f.argv, { cwd: f.work, services: { runReviewRound: async req => { calls++; observed = req; return unavailable(req); } } });
  expect(calls).toBe(1); expect(observed.materials.raw_requirement).toBe('CURRENT ACTUAL MATERIAL BYTES\n'); expect(observed.materials.context_map).toBe('TASK EVIDENCE BYTES\n'); expect(observed.activation_cohort).toBe('post');
  expect(readFileSync(join(f.task, 'facts.jsonl'), 'utf8')).toBe(''); expect(JSON.parse(readFileSync(record.path, 'utf8')).status).toBe('unavailable');
});
test('GUARD ORACLE-C01-PUBLIC-REF hash mismatch rejects before any provider dispatch', async () => {
  const f = fixture(); f.request.materials.raw_requirement.sha256 = '0'.repeat(64); f.save(); let calls = 0;
  await expect(stageRuntimeCliMain(f.argv, { cwd: f.work, services: { runReviewRound: async req => { calls++; return unavailable(req); } } })).rejects.toThrow(/sha256 mismatch/);
  expect(calls).toBe(0);
});
test('GUARD ORACLE-C01-PUBLIC-REF nonauthenticated current worktree is rejected before dispatch', async () => {
  const f = fixture(); let calls = 0;
  await expect(stageRuntimeCliMain(f.argv, { cwd: f.repo, services: { runReviewRound: async req => { calls++; return unavailable(req); } } })).rejects.toThrow(/CURRENT_WORKTREE_MISMATCH/);
  expect(calls).toBe(0); expect(existsSync(join(f.task, 'quality', 'reviews'))).toBe(false);
});
test('GUARD ORACLE-C01-PUBLIC-REF nested phase refs are not recursively resolved', async () => {
  const f = fixture(), nested = { 'phases/P1-结果.md': { ref: 'missing-phase.md', sha256: '1'.repeat(64) } };
  f.request.materials.phase_authorities = nested; f.save(); let observed;
  await stageRuntimeCliMain(f.argv, { cwd: f.work, services: { runReviewRound: async req => { observed = req.materials.phase_authorities; return unavailable(req); } } });
  expect(observed).toEqual(nested);
});
test('GUARD ORACLE-C01-PUBLIC-REF bare owner preserves ref objects and packet serializes them rather than reading paths', async () => {
  const f = fixture(); let observed;
  await runReviewRecovery({ stage: 'make-decision', review_track: 'detail', materials: { raw_requirement: f.request.materials.raw_requirement, approved_direction: 'owned direction' } }, { runRound: async req => { observed = req; return unavailable(req); } });
  expect(observed.materials.raw_requirement).toEqual(f.request.materials.raw_requirement);
  const attachmentRoot = join(f.root, 'attachments'); mkdirSync(attachmentRoot);
  const bundle = buildReviewMaterials({ attachmentRoot, stage: 'make-decision', reviewTrack: 'detail', materials: observed.materials });
  try {
    const entry = bundle.deliveryManifest.find(row => /raw_requirement\.json$/.test(row.path)); expect(entry).toBeDefined();
    const bytes = readFileSync(join(bundle.bundleRoot, entry.path), 'utf8'); expect(JSON.parse(bytes)).toEqual(f.request.materials.raw_requirement); expect(bytes).not.toContain('CURRENT ACTUAL MATERIAL BYTES');
  } finally { bundle.dispose(); }
});
test('TARGET ORACLE-C01-PUBLIC-REF wh-review method names public entry, request wrapper, top-level parsing and bare limitation', () => {
  const method = readFileSync(new URL('../../skills/wh-review/SKILL.md', import.meta.url), 'utf8');
  for (const literal of ['stage-runtime.mjs review --action=record', 'resolveMaterialRefs', '顶层', 'wh-review-cli.mjs run', 'CURRENT_WORKTREE_MISMATCH']) expect(method, `ORACLE-C01-PUBLIC-REF method missing ${literal}`).toContain(literal);
  expect(method).toMatch(/request[\s\S]*materials/);
  expect(method).toMatch(/(?:裸|bare)[^\n]*(?:不解析|does not resolve|不.*ref)/i);
});
