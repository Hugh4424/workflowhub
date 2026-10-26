import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, realpathSync } from 'node:fs';
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
