import { describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { stepCoverageExit } from '../../tools/cli/run-checks.mjs';

// ORACLE-P1-STAGE-STEPS — approved P1/T001 seam: report -> visible gaps + exit.
describe('ORACLE-P1-STAGE-STEPS zero attestation', () => {
  it('keeps partial missing evidence visible without blocking', () => {
    expect(stepCoverageExit({ workflow_steps: [
      { stage: 'build-code', source: 'steps.json', step_slug: 'done', state: 'completed' },
      { stage: 'build-code', source: 'steps.json', step_slug: 'missing', state: 'incomplete' },
    ] })).toEqual({ exit_code: 0, steps_unattested: [], missing_steps: [{ source: 'steps.json', step_slug: 'missing', state: 'incomplete' }] });
  });
  it('returns non-zero for a make-decision evidence gap but keeps build-code at zero', () => {
    const basis = [{ evidence_level: 'record_ref', conclusion: 'incomplete', reason: 'named discussion original missing' }];
    expect(stepCoverageExit({ workflow_steps: [
      { stage: 'make-decision', source: 'steps.json', step_slug: 'gap', state: 'incomplete', basis },
    ] }).exit_code).toBe(1);
    expect(stepCoverageExit({ workflow_steps: [
      { stage: 'build-code', source: 'steps.json', step_slug: 'gap', state: 'incomplete', basis },
    ] }).exit_code).toBe(0);
  });
  it('runs the real CLI on a controlled task and returns its exit code', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p8-runchecks-')));
    try {
      const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(repo, 'specs/controlled');
      const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
      mkdirSync(materials, { recursive: true });
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'controlled', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
      put(materials, 'decision-log.md', '# Controlled complex fixture\n');
      const source = 'workflows/make-decision/steps.json';
      const slugs = ['first-owned-step', 'second-owned-step'];
      const steps = slugs.map((slug, index) => ({ step_id: index + 1, step_slug: slug, observable_result: 'Read the exact controlled observation. 判定消费：SKILL.md#方法；原件：controlled human record', completion_evidence: [{ kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }] }));
      put(repo, source, { schema_version: '2.0.0', stage_slug: 'make-decision', steps });
      put(repo, 'workflows/make-decision/SKILL.md', '# Controlled method\n## 方法\nRead the controlled observation.\n');
      const entries = slugs.map(slug => {
        const ref = `quality/evidence/${slug}.json`;
        put(task, ref, { source, step_slug: slug, reader: 'controlled fixture reader', inputs: ['controlled observation'], observation: 'The named controlled output was read.', criteria_ref: 'workflows/make-decision/SKILL.md#方法', conclusion: 'completed', limits: [] });
        return { ref, source, step_slug: slug };
      });
      // TCR-2 (decision-log 2026-11-26 裁决三): the report face refuses an
      // unreadable step definition, so a complex fixture must ship readable
      // definitions for every stage its report covers. These two stages stay
      // report-only (no `skill`) and their single step is attested, which keeps
      // this test on its own subject: an unattested step, not a missing manifest.
      const designRows = slugs.map(slug => `| [controlled](../../${source}#L1) \`${slug}\` | observation | human | owner |`);
      for (const stage of ['build-plan', 'build-code']) {
        const stageSource = `workflows/${stage}/steps.json`;
        const stageSlug = `${stage}-owned-step`;
        put(repo, stageSource, { schema_version: '2.0.0', stage_slug: stage, steps: [{ step_id: 1, step_slug: stageSlug, observable_result: 'Read the exact controlled observation. 判定消费：SKILL.md#方法；原件：controlled human record', completion_evidence: [{ kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }] }] });
        put(repo, `workflows/${stage}/SKILL.md`, `# Controlled ${stage} method\n## 方法\nRead the controlled observation.\n`);
        designRows.push(`| [controlled](../../${stageSource}#L1) \`${stageSlug}\` | observation | human | owner |`);
        const ref = `quality/evidence/${stage}-${stageSlug}.json`;
        put(task, ref, { source: stageSource, step_slug: stageSlug, reader: 'controlled fixture reader', inputs: ['controlled observation'], observation: 'The named controlled output was read.', criteria_ref: `workflows/${stage}/SKILL.md#方法`, conclusion: 'completed', limits: [] });
        entries.push({ ref, source: stageSource, step_slug: stageSlug });
      }
      put(materials, 'step-consumer-design.md', designRows.join('\n'));
      put(task, 'facts.jsonl', JSON.stringify({ record_kind: 'stage', task_id: 'controlled', stage: 'make-decision', source: 'controlled test inputs, not real user approval', evidence: { value: entries } }) + '\n');
      const result = spawnSync(process.execPath, [resolve('tools/cli/run-checks.mjs'), '--task-path', task, '--workflow-root', repo], { cwd: repo, encoding: 'utf8' });
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).missing_steps).toEqual([]);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it('rejects malformed reports instead of reporting success', () => {
    expect(() => stepCoverageExit({})).toThrow('workflow_steps');
    expect(() => stepCoverageExit({ workflow_steps: [{}] })).toThrow('identity/state');
  });
  it('preserves real CLI unreadable-task exit 2 and unsupported-argument exit 1', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-invalid-task-')));
    try {
      const result = spawnSync(process.execPath, [resolve('tools/cli/run-checks.mjs'), '--task-path', root], { encoding: 'utf8' });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('task.json');
      expect(spawnSync(process.execPath, [resolve('tools/cli/run-checks.mjs'), '--unsupported'], { encoding: 'utf8' }).status).toBe(1);
    } finally { rmSync(root, { recursive: true }); }
  });
  it('lists every unattested step without blocking or changing the report', () => {
    const report = { workflow_steps: [
      { stage: 'make-decision', source: 'workflows/make-decision/steps.json', step_slug: 'first', state: 'unavailable' },
      { stage: 'make-decision', source: 'workflows/make-decision/steps.json', step_slug: 'eighth', state: 'unavailable' },
    ] };
    const before = JSON.stringify(report);
    expect(stepCoverageExit(report)).toEqual({
      exit_code: 0,
      steps_unattested: [{ stage: 'make-decision', declared_steps: 2 }],
      missing_steps: [
        { source: 'workflows/make-decision/steps.json', step_slug: 'first', state: 'unavailable' },
        { source: 'workflows/make-decision/steps.json', step_slug: 'eighth', state: 'unavailable' },
      ],
    });
    expect(JSON.stringify(report)).toBe(before);
  });
});
