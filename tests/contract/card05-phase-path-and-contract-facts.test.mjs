// Frozen build-plan oracle. Source: real clarification 005 #3; N1 AC02.
// No production implementation; original card05-runtime-target-behavior test remains frozen.
import { afterEach, expect, test } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { phaseFilesFromIndex } from '../../runtime/task/material-workspace.mjs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { phaseProgressTargetExists, prepareTaskBoundBuildCodeReviewBundle } from '../../tools/cli/stage-runtime.mjs';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../runtime/task/workspace.mjs';
import { ArtifactDir } from '../../runtime/evidence/artifact-dir.mjs';
const roots = [];
const rootUrl = new URL('../../', import.meta.url), cli = fileURLToPath(new URL('tools/cli/stage-runtime.mjs', rootUrl));
const target = 'phases/P1-结果接线.md';
function materials(ref = target, { missingAc = false } = {}) {
  const command = 'node --test tests/owned.test.mjs';
  const spec = '# Spec\n- **FR-001**：Visible owned result.\n- [ ] **AC-001 — visible result**\n  - **需求**：FR-001\n  - **通过条件**：visible result is returned.\n  - **失败条件**：result is lost.\n' + (missingAc ? '- [ ] **AC-002 — deliberately uncovered failure**\n  - **需求**：FR-001\n  - **通过条件**：uncovered result remains visible.\n  - **失败条件**：uncovered result is lost.\n' : '') + '\n## 实现设计（全局权威）\n### Code Anchors\n`README.md` owns visible output.\n### Interfaces and Failure Semantics\nReturn visible output and preserve failure.\n### Requirement-to-Task Trace\n| source | FR | AC | task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 |\n### Global Verification Strategy\n`' + command + '`\n';
  const index = '# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `' + ref + '` | `phase-p1` | `README.md` | `none` | build-code |\n';
  const phase = [
    '# Phase P1 — owned result', '- **Global spec**：`spec.md`', '- **Write set**：`README.md`', '- **Dependency**：none', '- **Consumer**：build-code',
    '## L0 — Outcome', '- **gate_cmd**：`' + command + '`', '- **expected_exit**：RED nonzero; GREEN 0', '- **oracle**：ORACLE-P1', '- **evidence_path**：quality/tests/owned.output', '- **STOP**：preserve actual failure', '- **Done**：real target result',
    '## L1 — Contract', '### T001 — deliver owned result', '- **Source / FR / AC**：R-001 / FR-001 / AC-001', '- **Files / symbols**：`README.md` symbol: N/A — fixture source text', '- **Action**：return the owned result', '- **Inputs**：owned input and a negative case', '- **Outputs / failure**：visible output or explicit failure', '- **Boundary / DO NOT TOUCH**：no external repository changes', '- **Dependency**：none', '- **Test tier / skill**：feature / backend-testing', '- **Scenario / fixture or service**：owned local result', '- **RED/GREEN gate_cmd**：`' + command + '`', '- **expected_exit**：RED target nonzero; GREEN 0', '- **RED target failure**：ORACLE-P1 assertion fails when result lost', '- **GREEN oracle**：ORACLE-P1 visible output assertion', '- **Evidence**：quality/tests/owned.output', '- **STOP / recovery**：preserve failure and continue safe repair', '- **Coverage limit**：no external provider quality', '- **Done**：real result and evidence', '## L2 — Removable reference', 'Owned fixture, not a workflow permit.', '',
  ].join('\n');
  return { spec, index, phases: { [ref]: phase } };
}
const asMap = m => ({ 'spec.md': m.spec, 'phases/index.md': m.index, ...m.phases });
function temporary() { const root = realpathSync(mkdtempSync(join(tmpdir(), 'card05-path-facts-'))); roots.push({ root, identity: lstatSync(root) }); return root; }
function environment(storage, home) { const env = { ...process.env }; for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k]; if (storage) env.WORKFLOWHUB_TASK_DIR = storage; if (home) { env.HOME = home; env.XDG_CONFIG_HOME = join(home, '.config'); } return env; }
const git = (cwd, ...argv) => execFileSync('git', argv, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(ref = target, options = {}) {
  const root = temporary(), repo = join(root, 'repo'), wt = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home'), taskId = 'path-facts-owned', taskDir = join(storage, 'Projects', 'workflowhub', 'tasks', taskId);
  mkdirSync(repo); mkdirSync(home); mkdirSync(taskDir, { recursive: true }); const hooks = join(root, 'hooks'); mkdirSync(hooks);
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Owned path oracle'); git(repo, 'config', 'user.email', 'oracle@example.invalid'); git(repo, 'config', 'commit.gpgsign', 'false'); git(repo, 'config', 'core.hooksPath', hooks);
  writeFileSync(join(repo, 'README.md'), 'baseline\n'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'owned baseline'); git(repo, 'worktree', 'add', '-q', '-b', `task/workflowhub/${taskId}`, wt, 'main');
  const m = materials(ref, options), materialRoot = join(wt, 'specs', taskId); mkdirSync(join(materialRoot, 'phases'), { recursive: true }); writeFileSync(join(materialRoot, 'decision-log.md'), '# Decision\n');
  for (const [path, content] of Object.entries(asMap(m))) writeFileSync(join(materialRoot, path), content);
  git(wt, 'add', 'specs'); git(wt, 'commit', '-qm', 'owned materials');
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: taskId, target_repo_root: repo, record_model: 'vnext-single-write', activation_cohort: 'post', workspace_mode: 'existing', workspace_root: wt })); writeFileSync(join(taskDir, 'facts.jsonl'), '');
  return { root, repo, wt, storage, home, taskId, taskDir, materialRoot, m };
}
afterEach(() => { for (const { root, identity } of roots.splice(0)) { expect(realpathSync(root)).toBe(resolve(root)); expect(dirname(root)).toBe(realpathSync(tmpdir())); expect(basename(root).startsWith('card05-path-facts-')).toBe(true); const stat = lstatSync(root); expect([stat.dev, stat.ino]).toEqual([identity.dev, identity.ino]); rmSync(root, { recursive: true, force: true }); } });
test('N17 target: existing index reader returns the physical named authority', () => { const m = materials(); expect(phaseFilesFromIndex(m.index)).toEqual([target]); });
test('N17 target: validator consumes named physical Phase without weakening its write-set contract', () => { const m = materials(), r = validatePostPhaseContract(m); expect(r.facts.phase_rows, 'named Phase supplies its actual task and safe write set').toEqual(expect.arrayContaining([expect.objectContaining({ id: 'P1', path: target, write_set: ['README.md'], task_ids: ['T001'] })])); expect(r.errors.filter(e => /authority ref|missing or empty/.test(e))).toEqual([]); });
test('N17 target: cursor resolves Task through index rather than inventing P1.md', () => { expect(phaseProgressTargetExists({ phase_id: 'P1', task_id: 'T001' }, asMap(materials()))).toBe(true); });
test('N17 target: public run records current cursor for the named indexed Phase', () => {
  const f = fixture(), input = join(f.wt, 'cursor.json'); writeFileSync(input, JSON.stringify({ phase_progress: { phase_id: 'P1', task_id: 'T001' } }));
  const r = spawnSync(process.execPath, [cli, 'run', '--action=execute', '--stage=build-code', '--project=workflowhub', `--task=${f.taskId}`, `--task-path=${f.taskDir}`, `--input=${input}`], { cwd: f.wt, env: environment(f.storage, f.home), encoding: 'utf8', timeout: 15000 });
  expect(r.error).toBeUndefined(); expect(r.status, 'public run reads the named physical Phase: ' + r.stderr).toBe(0); const actual = JSON.parse(r.stdout); expect(actual.phase_progress).toMatchObject({ phase_id: 'P1', task_id: 'T001' });
  const rows = readFileSync(join(f.taskDir, 'facts.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse); expect(rows.find(r => r.stage === 'build-code').phase_progress).toMatchObject({ phase_id: 'P1', task_id: 'T001' });
});
test('N17 baseline: old physical names remain supported and missing Tasks remain absent', () => { const m = materials('phases/P1.md'); expect(phaseFilesFromIndex(m.index)).toEqual(['phases/P1.md']); expect(phaseProgressTargetExists({ phase_id: 'P1', task_id: 'T001' }, asMap(m))).toBe(true); expect(phaseProgressTargetExists({ phase_id: 'P1', task_id: 'T999' }, asMap(m))).toBe(false); expect(validatePostPhaseContract(m).facts.phase_rows[0].write_set).toEqual(['README.md']); });
test('N17 baseline: index traversal remains rejected', () => { expect(() => phaseFilesFromIndex(materials('phases/../outside.md').index)).toThrow(); });
async function packetFixture() {
  // Legacy physical name intentionally isolates N1 from N17 RED. AC002 is a fixed independent missing obligation.
  const f = fixture('phases/P1.md', { missingAc: true }); writeFileSync(join(f.wt, 'README.md'), 'owned result change\n'); writeFileSync(join(f.wt, 'outside.md'), 'OUTSIDE-PHASE-CHANGE\n');
  const task = openTask(f.taskDir, { projectName: 'workflowhub', taskId: f.taskId }), workspace = await openCurrentTaskWorkspace(task), context = { task, manifest: task.manifest, workspace, artifacts: ArtifactDir.open(f.wt, task) }, attachmentRoot = join(f.root, 'attachments'); mkdirSync(attachmentRoot);
  const bundle = prepareTaskBoundBuildCodeReviewBundle(context, { stage: 'build-code', review_scope: 'phase', subject_kind: 'phase', phase_id: 'P1', surface: 'document', materials: { approved_spec: f.m.spec, acceptance_criteria: 'AC-001: visible result; AC-002: deliberately uncovered failure', test_evidence: 'not executed: construction-only owned fixture' } }, { loadConfig: () => ({ attachmentRoot }) });
  return { f, bundle };
}
test('N1 target: actual provider packet exposes the calculated contract failure facts while still building', async () => {
  const { bundle } = await packetFixture(); try {
    expect(bundle.manifest.length, 'contract error must not block packet creation').toBeGreaterThan(0);
    const texts = bundle.manifest.filter(e => e.path !== 'manifest.json' && !e.path.startsWith('skills/') && !e.path.startsWith('contracts/') && e.path !== 'review-instructions.md').map(e => readFileSync(join(bundle.bundleRoot, e.path), 'utf8')).join('\n');
    expect(texts, 'actual delivered source/context carries readonly contract result').toContain('contract_ok'); expect(texts).toContain('contract_error_count'); expect(texts).toContain('ac_coverage'); expect(texts).toContain('fr_coverage'); expect(texts).toContain('command_oracle_checks'); expect(texts).toContain('AC has no executable Phase task coverage: AC-002');
  } finally { bundle.dispose(); }
});
test('N1 baseline: incomplete contract does not block packet creation or broaden selected Phase diff', async () => {
  const { bundle } = await packetFixture(); try { const diff = readFileSync(join(bundle.bundleRoot, 'changes.diff'), 'utf8'); expect(diff).toContain('README.md'); expect(diff).toContain('owned result change'); expect(diff).not.toContain('outside.md'); expect(diff).not.toContain('OUTSIDE-PHASE-CHANGE'); expect(existsSync(join(bundle.bundleRoot, 'manifest.json'))).toBe(true); } finally { bundle.dispose(); }
});
