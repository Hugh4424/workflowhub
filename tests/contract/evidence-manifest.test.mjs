import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createTask } from '../../runtime/task/task-handle.mjs';
import { initializeTaskStore, readTaskFacts, writeStageRow } from '../../runtime/task/task-store.mjs';
import { RINGS } from '../../runtime/task/final-chain.mjs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
describe('ORACLE-EVIDENCE-PHASE', () => {
  it('method names one manifest, stage-only costs and final-ring consumption', () => {
    const standard = read('docs/standard-workflow.md');
    for (const field of ['phase_id', 'task_ids', 'cursor_ref', 'commands', 'failures', 'diffs', 'evidence_refs', 'materials', 'reviews', 'acceptance', 'cost', 'final_chain_ref']) expect(standard, field).toContain('`' + field + '`');
    expect(standard).toContain('每 Phase 一份执行清单');
    expect(standard).toContain('审后冻结');
    expect(standard).toContain('resolveOutputRef');
    const build = read('workflows/build-code/SKILL.md');
    expect(build).toContain('本 Phase 只多一份清单');
    expect(build).toContain('首笔带 `--start-ref`');
    expect(build).toContain('run-checks.mjs --task-path');
    expect(build).toContain('missing_steps');
    expect(read('skills/stage-reflection/SKILL.md')).toContain('五数');
    expect(RINGS).toHaveLength(10);
  });

  it('native captures reuse equal bytes, retain failure, and one manifest points at one cursor', async () => {
    const storage = realpathSync(mkdtempSync(join(tmpdir(), 'wh-phase-manifest-')));
    const cwd = join(storage, 'checkout'); mkdirSync(cwd);
    const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    try {
      git(['init', '-q', '-b', 'main']); git(['config', 'user.name', 'Phase fixture']); git(['config', 'user.email', 'fixture@test.invalid']); git(['commit', '--allow-empty', '-qm', 'fixture']);
      const head = git(['rev-parse', 'HEAD']);
      const task = await createTask({ storageRoot: storage, manifest: { schema_version: '1.0.0', project_name: 'fixture', task_id: 'phase-manifest', created_at: '2026-10-26T00:00:00Z', target_repo_root: cwd, activation_cohort: 'post', execution_mode: 'per_invocation', record_model: 'vnext-single-write', issue_ids: [], inputs: {} } });
      await initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
      const argv = [process.execPath, '-e', 'process.stdout.write("same bytes\\n")'];
      const first = await task.captureCommand({ cwd, slug: 'first', argv });
      const second = await task.captureCommand({ cwd, slug: 'same', argv, resolveOutputRef: observed => {
        expect(observed.argv).toEqual(first.argv); expect(observed.exit_code).toBe(first.exit_code);
        expect(readFileSync(observed.output_ref)).toEqual(readFileSync(first.output_ref));
        return { output_ref: first.output_ref, output_disposition: 'reused: same bytes' };
      } });
      const failure = await task.captureCommand({ cwd, slug: 'failure', argv: [process.execPath, '-e', 'process.stderr.write("intentional failure\\n");process.exit(7)'] });
      expect(second.output_ref).toBe(first.output_ref); expect(failure.exit_code).toBe(7);
      for (const receipt of [first, second, failure]) {
        const native = JSON.parse(readFileSync(receipt.receipt_ref, 'utf8'));
        expect(native.output_ref).toBe(receipt.output_ref);
        expect(readFileSync(native.output_ref).length).toBeGreaterThan(0);
      }
      expect(readFileSync(failure.output_ref, 'utf8')).toContain('intentional failure');
      expect(readdirSync(task.recordPath('quality/tests')).filter(name => name.endsWith('.output'))).toHaveLength(2);
      const row = { stage: 'build-code', source: 'phase-fixture', review_origin: 'not_run', finding_dispositions: [], evidence: { value: [{ command: argv.join(' '), exit_code: 0, failure_signature: 'none' }] } };
      for (const phase of [6, 7]) await writeStageRow(task.taskPath, { ...row, phase_progress: { phase_id: 'P' + phase, task_id: 'T00' + phase, phases_head: head, base_head: head, recorded_at: '2026-10-26T00:00:00Z' } });
      await writeStageRow(task.taskPath, { ...row, source: 'ordinary-evidence-refresh' });
      const facts = readTaskFacts(task.taskPath);
      expect(facts).toHaveLength(1); expect(facts[0].phase_progress.phase_id).toBe('P7'); expect(Object.keys(facts[0].phase_progress)).toHaveLength(5); expect(facts[0].evidence.value[0].exit_code).toBe(0);
      const before = task.readRecord('facts.jsonl');
      await expect(writeStageRow(task.taskPath, { ...row, phase_progress: { ...facts[0].phase_progress, history: [] } })).rejects.toThrow(/phase_progress/);
      expect(task.readRecord('facts.jsonl')).toBe(before);
      // Isolated task ledger only. The real build-code stage is still running.
      const entry = fileURLToPath(new URL('../../tools/cli/measure-main-agent-cost.mjs', import.meta.url));
      const session = fileURLToPath(new URL('../fixtures/main-agent-cost/dsh-v4.jsonl', import.meta.url));
      const costArgs = ['--project=fixture', '--task=phase-manifest', '--stage=build-code', '--record', '--session=' + session, '--start-ref=' + session + '#seq=9'];
      const env = { ...process.env, WORKFLOWHUB_TASK_DIR: storage, XDG_CONFIG_HOME: storage, DSH_SESSION_ID: '', CODEX_THREAD_ID: '', CODEX_SESSION_ID: '' };
      const cost = spawnSync(process.execPath, [entry, ...costArgs], { cwd, env, encoding: 'utf8', timeout: 10000 });
      expect([0, 1], cost.stderr).toContain(cost.status);
      const ledger = task.readRecord('main-agent-cost.md');
      expect(ledger.trim().split('\n')).toHaveLength(3);
      expect(cost.stdout).toContain('#L3');
      const duplicate = spawnSync(process.execPath, [entry, ...costArgs], { cwd, env, encoding: 'utf8', timeout: 10000 });
      expect(duplicate.status).toBe(2); expect(duplicate.stderr).toContain('start-ref cannot reset an existing ledger');
      expect(task.readRecord('main-agent-cost.md')).toBe(ledger);
      const manifest = { phase_id: 'P7', task_ids: ['T007'], cursor_ref: 'facts.jsonl#1', commands: [first, second, failure].map(({ argv, cwd, exit_code, started_at, ended_at, output_ref }) => ({ argv, cwd, exit_code, started_at, ended_at, output_ref })), failures: [{ failure_signature: 'exit 7; intentional failure', original_output_ref: failure.output_ref }], diffs: [{ command: 'git diff --name-only', cwd, exit_code: 0, paths: git(['diff', '--name-only']).split('\n').filter(Boolean), numstat: git(['diff', '--numstat']) }], evidence_refs: [{ ref: failure.output_ref, sha256: hash(readFileSync(failure.output_ref)), kept_because: 'failure' }], materials: [], reviews: [], acceptance: [], cost: { status: 'incomplete', reason: 'stage end has not occurred' }, final_chain_ref: null };
      await task.createRecord('quality/evidence/P7-execution.json', JSON.stringify(manifest));
      await expect(task.createRecord('quality/evidence/P7-execution.json', JSON.stringify({ ...manifest, phase_id: 'P6' }))).rejects.toThrow();
      expect(readdirSync(task.recordPath('quality/evidence'))).toEqual(['P7-execution.json']);
      expect(JSON.parse(task.readRecord('quality/evidence/P7-execution.json')).cursor_ref).toBe('facts.jsonl#1');
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });
});
