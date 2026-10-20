import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTask } from '../../runtime/task/task-handle.mjs';
import { initializeTaskStore } from '../../runtime/task/task-store.mjs';
import { materialFilesForCohort, inspectMaterialWorkspace } from '../../runtime/task/material-workspace.mjs';

const roots = [];
const cliPath = fileURLToPath(new URL('../../tools/cli/stage-runtime.mjs', import.meta.url));
const costPath = fileURLToPath(new URL('../../tools/cli/measure-main-agent-cost.mjs', import.meta.url));
const sessionPath = fileURLToPath(new URL('../fixtures/main-agent-cost/dsh-v4.jsonl', import.meta.url));
const index = '## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n| `P2` | `phases/P2.md` |\n';
const base = ['decision-log.md', 'spec.md', 'phases/index.md'];
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wh-light-materials-'))); roots.push(root);
  const repo = join(root, 'repo'), worktree = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home');
  for (const dir of [repo, storage, home]) mkdirSync(dir);
  git(repo, ['init', '-q', '-b', 'main']); git(repo, ['config', 'user.name', 'WorkflowHub fixture']); git(repo, ['config', 'user.email', 'fixture@test.invalid']);
  git(repo, ['commit', '--allow-empty', '-qm', 'baseline']); git(repo, ['worktree', 'add', '-qb', 'task/workflowhub/light-materials', worktree]);
  const task = await createTask({ storageRoot: storage, manifest: { schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'light-materials', created_at: '2026-10-19T00:00:00.000Z', target_repo_root: repo, workspace_mode: 'existing', workspace_root: worktree, activation_cohort: 'post', execution_mode: 'per_invocation', record_model: 'vnext-single-write', issue_ids: [], inputs: {} } });
  await initializeTaskStore(task.taskPath, { taskId: 'light-materials' });
  const materials = join(worktree, 'specs', 'light-materials'); mkdirSync(materials, { recursive: true });
  writeFileSync(join(materials, 'decision-log.md'), '## 任务身份\n\n- **任务类型**：普通任务\n');
  const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, '.config'), WORKFLOWHUB_TASK_DIR: storage };
  return { root, repo, worktree, storage, home, task, materials, env };
}
function cli(f, command, stage, extra = []) {
  return spawnSync(process.execPath, [cliPath, command, ...(command === 'status' ? ['--action=begin'] : []), `--stage=${stage}`, '--project=workflowhub', '--task=light-materials', `--task-path=${f.task.taskPath}`, ...extra], { cwd: f.worktree, env: f.env, encoding: 'utf8', timeout: 15000 });
}
function draft(f, name, body, stage = 'make-decision') {
  const source = join(f.root, 'draft.txt'); writeFileSync(source, body);
  return cli(f, 'run', stage, ['--action=draft', `--name=${name}`, `--input=${source}`]);
}
function success(result) { expect(result.error).toBeUndefined(); expect(result.status, result.stderr).toBe(0); return JSON.parse(result.stdout); }

describe('ORACLE-LIGHT-MATERIALS', () => {
  it('allows decision/spec/index and only indexed Phases without relaxing historical cohorts', () => {
    expect(materialFilesForCohort('post', {}, { stage: 'make-decision' })).toEqual(base);
    expect(materialFilesForCohort('post', { 'phases/index.md': index }, { stage: 'make-decision' })).toEqual([...base, 'phases/P1.md', 'phases/P2.md']);
    expect(() => materialFilesForCohort('post', { 'phases/P1.md': 'orphan' }, { stage: 'make-decision' })).toThrow(/without an index/);
    expect(() => materialFilesForCohort('post', { 'phases/index.md': index, 'phases/P3.md': 'orphan' }, { stage: 'make-decision' })).toThrow(/unindexed Phase/);
    expect(() => materialFilesForCohort('pre', {}, { stage: 'make-decision' })).toThrow(/historical materials are read-only/);
  });
  it('writes and reads real light spec/Phase artifacts while material publication creates no stage facts', async () => {
    const f = await fixture(), before = readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8');
    expect(success(cli(f, 'status', 'make-decision')).missing_materials).toEqual([]);
    expect(success(cli(f, 'status', 'build-plan')).missing_materials).toEqual([]);
    const spec = '# Light spec\n\nWrite set: src/feature.mjs\nAC-001: show actual output\nOracle: output equals expected\nCommand: node --test tests/feature.mjs\n';
    success(draft(f, 'spec.md', spec)); success(draft(f, 'phases/index.md', index));
    for (const phase of ['P1', 'P2']) success(draft(f, `phases/${phase}.md`, `# ${phase}\nWrite set: src/feature.mjs\nAC-001; oracle: output equals expected; command: node --test tests/feature.mjs\n`));
    expect(readFileSync(join(f.materials, 'spec.md'), 'utf8')).toBe(spec);
    const inspected = inspectMaterialWorkspace(f.materials, { stage: 'make-decision' });
    expect(inspected.status).toBe('working'); expect(Object.keys(inspected.files)).toEqual([...base, 'phases/P1.md', 'phases/P2.md']);
    for (const name of ['phases/P3.md', '../escape.md', 'plan.md']) {
      const rejected = draft(f, name, 'must not publish\n'); expect(rejected.status).toBe(1); expect(existsSync(join(f.materials, name))).toBe(false);
    }
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe(before);
    expect(success(cli(f, 'status', 'make-decision')).facts).toEqual([]);
    rmSync(join(f.materials, 'decision-log.md'));
    expect(success(cli(f, 'status', 'make-decision')).missing_materials).toEqual([]);
    expect(success(cli(f, 'status', 'build-plan')).missing_materials).toEqual(['decision-log.md']);
  });
  it('keeps build-plan artifact ownership and rejects missing-index light Phase publication', async () => {
    const f = await fixture();
    const rejected = draft(f, 'phases/P1.md', 'unindexed\n'); expect(rejected.status).toBe(1); expect(existsSync(join(f.materials, 'phases/P1.md'))).toBe(false);
    success(draft(f, 'spec.md', 'build-plan spec\n', 'build-plan'));
    expect(draft(f, 'decision-log.md', 'wrong owner\n', 'build-plan').status).toBe(1);
    expect(readFileSync(join(f.materials, 'decision-log.md'), 'utf8')).toContain('任务身份');
  });
  it('samples actual light spec/index/Phase bytes through the cost CLI, not main checkout materials', async () => {
    const f = await fixture(); mkdirSync(join(f.materials, 'phases'));
    const texts = { 'decision-log.md': readFileSync(join(f.materials, 'decision-log.md'), 'utf8'), 'spec.md': 'spec\n', 'phases/index.md': index, 'phases/P1.md': 'first\n', 'phases/P2.md': 'second\n' };
    for (const [name, body] of Object.entries(texts)) writeFileSync(join(f.materials, name), body);
    mkdirSync(join(f.repo, 'specs', 'light-materials'), { recursive: true }); writeFileSync(join(f.repo, 'specs', 'light-materials', 'decision-log.md'), 'POISON_MAIN');
    const records = readFileSync(sessionPath, 'utf8').trim().split('\n').map(JSON.parse); records[0].cwd = f.worktree;
    const session = join(f.root, 'session.v4.jsonl'); writeFileSync(session, records.map(JSON.stringify).join('\n') + '\n');
    const r = spawnSync(process.execPath, [costPath, '--project=workflowhub', '--task=light-materials', '--stage=make-decision', `--session=${session}`], { cwd: f.worktree, env: f.env, encoding: 'utf8', timeout: 15000 });
    expect(r.error).toBeUndefined(); expect(r.status, r.stderr).toBe(0);
    const bytes = Object.values(texts).reduce((total, text) => total + Buffer.byteLength(text), 0);
    expect(r.stdout).toContain(`materialBytes [byte]: ${bytes};`);
    expect(r.stdout).toContain(join(f.materials, 'phases/P2.md'));
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
});
