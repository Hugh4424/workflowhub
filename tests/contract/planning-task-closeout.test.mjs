// Owned fixture for the planning-task closeout contract: temporary repositories and task roots,
// NOT a real user approval, real GitHub PR or real delivered task.
// Oracle: ORACLE-CLOSE-RETIRE (AC-P7-006). The task type has one shared reader only:
// runtime/stage/stage-content-contracts.mjs readTaskTypeFromDecisionLog.
import { afterEach, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { prepareDeliveryClosePlan } from '../../core/task-close.mjs';

const roots = [], saved = { ...process.env };
const realGit = execFileSync('/usr/bin/which', ['git'], { encoding: 'utf8' }).trim();
function environment(f) {
  const e = { ...saved };
  for (const k of Object.keys(e)) if (k.startsWith('GIT_')) delete e[k];
  if (f) Object.assign(e, { WORKFLOWHUB_TASK_DIR: f.storage, HOME: f.home, XDG_CONFIG_HOME: join(f.home, '.config') });
  return e;
}
const git = (cwd, ...args) => execFileSync(realGit, args, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function fixture(decision) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'planning-closeout-')));
  roots.push({ root, identity: lstatSync(root) });
  const repo = join(root, 'repo'), wt = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home'), id = 'planning-owned', taskDir = join(storage, 'Projects/workflowhub/tasks', id), bare = join(root, 'origin.git');
  for (const p of [repo, home, bare]) mkdirSync(p);
  mkdirSync(taskDir, { recursive: true });
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.name', 'Owned planning fixture');
  git(repo, 'config', 'user.email', 'owned@example.invalid');
  git(repo, 'config', 'commit.gpgsign', 'false');
  const hooks = join(root, 'hooks'); mkdirSync(hooks); git(repo, 'config', 'core.hooksPath', hooks);
  writeFileSync(join(repo, 'README.md'), 'baseline\n'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'owned baseline');
  git(bare, 'init', '--bare', '-q'); git(repo, 'remote', 'add', 'origin', bare); git(repo, 'push', '-q', 'origin', 'main');
  const branch = 'task/workflowhub/' + id;
  git(repo, 'worktree', 'add', '-q', '-b', branch, wt, 'main');
  const materials = join(wt, 'specs', id); mkdirSync(materials, { recursive: true });
  writeFileSync(join(materials, 'decision-log.md'), decision);
  writeFileSync(join(materials, 'spec.md'), '# Owned planning result\nFixture source for planning closeout.\n');
  git(wt, 'add', 'specs'); git(wt, 'commit', '-qm', 'owned task materials');
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: id, target_repo_root: repo, record_model: 'vnext-single-write', activation_cohort: 'post', workspace_mode: 'existing', workspace_root: wt }));
  writeFileSync(join(taskDir, 'facts.jsonl'), JSON.stringify({ record_kind: 'stage', task_id: id, stage: 'verify-code', source: 'owned-planning-closeout-fixture', created_at: '2026-10-20T00:00:00Z' }) + '\n');
  return { root, repo, wt, storage, home, id, taskDir, branch, bare };
}

afterEach(() => {
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
  for (const { root, identity } of roots.splice(0)) {
    expect(realpathSync(root)).toBe(resolve(root));
    expect(dirname(root)).toBe(realpathSync(tmpdir()));
    expect(basename(root).startsWith('planning-closeout-')).toBe(true);
    const now = lstatSync(root);
    expect([now.dev, now.ino]).toEqual([identity.dev, identity.ino]);
    rmSync(root, { recursive: true, force: true });
  }
});

const ENTRY_FORM = '# Decision\n\n## 1. 入口\n\n### 这是什么任务\n\n- **任务类型**：规划任务。\n';
const IDENTITY_FORM = '# Decision\n\n## 任务身份\n\n- **任务类型**：规划任务。\n';

test('T1: an entry-form planning task closes as planning without archiving before commit', async () => {
  const f = fixture(ENTRY_FORM);
  const plan = await prepareDeliveryClosePlan({ taskDir: f.taskDir });
  expect(plan.plan.mode).toBe('planning');
  expect(plan.plan.archive_before_commit).toBe(false);
});

test('T2: an identity-form planning task closes as planning without archiving before commit', async () => {
  const f = fixture(IDENTITY_FORM);
  const plan = await prepareDeliveryClosePlan({ taskDir: f.taskDir });
  expect(plan.plan.mode).toBe('planning');
  expect(plan.plan.archive_before_commit).toBe(false);
});

test('T3: an ordinary task keeps the ordinary close baseline', async () => {
  const f = fixture('# Decision\n\n## 任务身份\n\n- **任务类型**：普通任务。\n');
  const plan = await prepareDeliveryClosePlan({ taskDir: f.taskDir });
  expect(plan.plan.mode).toBe('ordinary');
  expect(plan.plan.archive_before_commit).toBe(true);
});

test('T4: a decision log without a task-type field falls back to ordinary', async () => {
  const f = fixture('# Decision\n\n## 任务身份\n\n- **说明**：没有任务类型行。\n');
  const plan = await prepareDeliveryClosePlan({ taskDir: f.taskDir });
  expect(plan.plan.mode).toBe('ordinary');
});

test('T5: a parenthetical naming another type stays unknown and closes as ordinary', async () => {
  const f = fixture('# Decision\n\n## 任务身份\n\n- **任务类型**：规划任务。（实为普通任务）\n');
  const plan = await prepareDeliveryClosePlan({ taskDir: f.taskDir });
  expect(plan.plan.mode).toBe('ordinary');
});

test('T6: task-close calls the shared reader and keeps no private copy of the parser', () => {
  const source = readFileSync(new URL('../../core/task-close.mjs', import.meta.url), 'utf8');
  expect(source).toContain('readTaskTypeFromDecisionLog');
  expect(source).not.toContain('function declaredTaskType(');
});
