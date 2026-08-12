import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { publishTaskMonitoringProjection, rebuildGlobalMonitoringSnapshot, validateMonitoringProjection } from '../runtime/evidence/monitoring-projector.mjs';

const execFile = promisify(execFileCallback);

const root = () => realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-projector-')));
const fact = (task_id, extra = {}) => ({ fact_id: `${task_id}:fact`, task_id, project_name: 'project-a', fact_type: 'stage', stage: 'build-code', status: 'present', value: { outcome: 'completed' }, source: { ref: `stage:${task_id}`, source_id: 'stage', source_version: 'v1', kind: 'stage' }, coverage: { expected: 1, observed: 1 }, evidence_refs: [], observed_at: '2026-08-12T00:00:00.000Z', ...extra });

describe('M15 project/global projector', () => {
  it('publishes one task per atomic projection and rebuilds the root bundle from derived namespace only', () => {
    const storageRoot = root();
    const a = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'task-a', facts: [fact('task-a')], generatedAt: '2026-08-12T00:00:00.000Z' });
    const b = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-b', taskId: 'task-b', facts: [fact('task-b', { project_name: 'project-b' })], generatedAt: '2026-08-12T00:00:00.000Z' });
    expect(validateMonitoringProjection(a.value)).toBe(a.value);
    expect(validateMonitoringProjection(b.value)).toBe(b.value);
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.records.map((record) => record.task_id)).toEqual(['task-a', 'task-b']);
    expect(readFileSync(result.outputJsonl, 'utf8').trim().split('\n')).toHaveLength(2);
    expect(readFileSync(result.outputData, 'utf8')).toContain('globalThis.__WH_MONITOR_DATA__ = Object.freeze(');
    const html = readFileSync(result.outputHtml, 'utf8');
    expect(html).toContain('workflowhub-monitor-data.js');
    expect(html).toContain('任务执行情况');
    expect(html).toContain('最近任务');
    expect(html).toContain('步骤与技能');
    expect(html).toContain('五个固定阶段');
    expect(html).toContain('成本归因');
    expect(html).toContain('问题与趋势');
    expect(html).toContain('全部项目');
    expect(html).toContain('全部状态');
    expect(html).toContain('dataset.ref');
    expect(html).toContain('未采集');
    expect(html).toContain('固定五阶段连续展示');
    expect(html).toContain('不自动给修复建议');
  });

  it('keeps data.js safe when task values contain script/html text', () => {
    const storageRoot = root();
    publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'task-x', facts: [fact('task-x', { value: { outcome: '</script><img src=x onerror=alert(1)>' } })] });
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot });
    const data = readFileSync(result.outputData, 'utf8');
    const html = readFileSync(result.outputHtml, 'utf8');
    expect(data).not.toContain('</script>');
    expect(html).not.toContain('innerHTML');
    expect(html).toContain('textContent');
  });

  it('reports invalid projection identity as stale without publishing it as a valid record', () => {
    const storageRoot = root();
    const path = join(storageRoot, 'Projects', 'project-a', 'monitoring', 'tasks', 'task-a.json');
    mkdirSync(join(storageRoot, 'Projects', 'project-a', 'monitoring', 'tasks'), { recursive: true });
    writeFileSync(path, JSON.stringify({ schema_version: 'monitoring-projection.v1', project_name: 'project-a', task_id: 'other-task', generated_at: '2026-08-12T00:00:00.000Z', status: 'current', stale: false, coverage: { expected: 0, observed: 0 }, errors: [], source_refs: [], facts_summary: { count: 0, statuses: {} }, diagnostics: {} }));
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot });
    expect(result.snapshot.status).toBe('stale');
    expect(result.snapshot.records).toHaveLength(0);
    expect(result.snapshot.errors[0]).toMatch(/identity mismatch/);
  });

  it('propagates fatal facts and keeps the global snapshot stale', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({
      storageRoot,
      projectName: 'project-a',
      taskId: 'fatal-task',
      facts: [fact('fatal-task', { status: 'fatal', value: null, reason: 'binding_conflict' })],
      generatedAt: '2026-08-12T00:00:00.000Z',
    });
    expect(projection.value.status).toBe('fatal');
    expect(projection.value.coverage).toEqual({ expected: 5, observed: 0 });
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.status).toBe('stale');
    expect(result.snapshot.stale).toBe(true);
    expect(result.snapshot.errors).toEqual(expect.arrayContaining([expect.stringMatching(/fatal monitoring projection/)]));
  });

  it('keeps ordinary partial errors visible without relabeling the global snapshot stale', () => {
    const storageRoot = root();
    publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'partial-task', facts: [fact('partial-task')], status: 'partial', errors: ['source unavailable'], generatedAt: '2026-08-12T00:00:00.000Z' });
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.status).toBe('partial');
    expect(result.snapshot.stale).toBe(false);
    expect(result.snapshot.errors).toEqual(expect.arrayContaining(['project-a/partial-task: source unavailable']));
  });

  it('downgrades an explicit current source status when facts are incomplete', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({
      storageRoot,
      projectName: 'project-a',
      taskId: 'incomplete-task',
      facts: [
        fact('incomplete-task'),
        fact('incomplete-task', { fact_id: 'incomplete-task:step', fact_type: 'step', status: 'missing', value: null, reason: 'step_outcome_unavailable' }),
      ],
      status: 'current',
      generatedAt: '2026-08-12T00:00:00.000Z',
    });
    expect(projection.value.status).toBe('partial');
    expect(projection.value.stale).toBe(false);
    expect(projection.value.facts_summary.statuses).toEqual({ missing: 1, present: 1 });
  });

  it('downgrades a current label when fixed five-stage evidence has gaps', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({
      storageRoot,
      projectName: 'project-a',
      taskId: 'topology-gap',
      facts: [fact('topology-gap')],
      topology: { stages: ['make-decision', 'build-spec', 'build-plan', 'build-code', 'verify-code'].map((id) => ({ id, steps: [], skills: [] })) },
      status: 'current',
      generatedAt: '2026-08-12T00:00:00.000Z',
    });
    expect(projection.value.status).toBe('partial');
    expect(projection.value.coverage.observed).toBeLessThan(projection.value.coverage.expected);
    expect(projection.value.diagnostics.stage.some((entry) => entry.status === 'evidence_gap')).toBe(true);
  });

  it('downgrades current when quality diagnostics contain stale verification', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({
      storageRoot,
      projectName: 'project-a',
      taskId: 'stale-verify',
      facts: [fact('stale-verify'), fact('stale-verify', {
        fact_id: 'stale-verify:verify', fact_type: 'verify', stage: 'verify-code',
        value: { invoked: true, fresh: false, outcome: 'passed', source_ref: 'quality-verify' },
      })],
      topology: { stages: [] },
      status: 'current',
      generatedAt: '2026-08-12T00:00:00.000Z',
    });
    expect(projection.value.status).toBe('partial');
    expect(projection.value.diagnostics.failures).toEqual(expect.arrayContaining([expect.objectContaining({ domain: 'verify', status: 'partial' })]));
  });

  it('rejects projection snapshots that omit stale or diagnostic contract fields', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'strict-task', facts: [fact('strict-task')] });
    const missingStale = { ...projection.value };
    delete missingStale.stale;
    expect(() => validateMonitoringProjection(missingStale)).toThrow(/invalid/i);
    const missingDiagnostics = { ...projection.value, diagnostics: {} };
    expect(() => validateMonitoringProjection(missingDiagnostics)).toThrow(/invalid/i);
  });

  it('keeps the published projection compatible with the strict JSON schema', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'schema-task', facts: [fact('schema-task')] });
    const schema = JSON.parse(readFileSync(new URL('../runtime/schemas/monitoring-projection.v1.json', import.meta.url), 'utf8'));
    const validate = new Ajv2020({ strict: false, $data: true, formats: { 'date-time': true } }).compile(schema);
    expect(validate(projection.value)).toBe(true);
    expect(validate({ ...projection.value, coverage: { expected: 0, observed: 1 } })).toBe(false);
    for (const ref of ['/private/source.json', '~/private/source.json', 'quality/../source.json']) {
      expect(validate({ ...projection.value, source_refs: [ref] })).toBe(false);
    }
    const malformed = { ...projection.value, diagnostics: { ...projection.value.diagnostics, stage: [{}] } };
    expect(validate(malformed)).toBe(false);
  });

  it('accepts the namespaced skill compatibility key emitted by the projector', () => {
    const storageRoot = root();
    const skill = fact('schema-skill', {
      fact_id: 'schema-skill:skill', fact_type: 'skill', stage: 'build-code', skill_id: 'wh-review', skill_version: 'v1',
      value: { trigger: true, executed: true, version: 'v1' },
    });
    const projection = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'schema-skill', facts: [skill] });
    const schema = JSON.parse(readFileSync(new URL('../runtime/schemas/monitoring-projection.v1.json', import.meta.url), 'utf8'));
    const validate = new Ajv2020({ strict: false, $data: true, formats: { 'date-time': true } }).compile(schema);
    expect(validate(projection.value)).toBe(true);
    expect(projection.value.diagnostics.compatibility.skill_keys.some((key) => key.includes('+'))).toBe(true);
  });

  it('recovers a lock left by a dead local process', () => {
    const storageRoot = root();
    mkdirSync(join(storageRoot, 'Projects'), { recursive: true });
    writeFileSync(join(storageRoot, 'Projects', '.workflowhub-monitor.lock'), '99999999\n');
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot });
    expect(result.snapshot.status).toBe('empty');
  });

  it('keeps two concurrent task publishers in one complete root snapshot', async () => {
    const storageRoot = root();
    const moduleUrl = new URL('../runtime/evidence/monitoring-projector.mjs', import.meta.url).href;
    const child = `
      import { publishTaskMonitoringProjection, rebuildGlobalMonitoringSnapshot } from ${JSON.stringify(moduleUrl)};
      const [storageRoot, taskId] = process.argv.slice(1);
      const fact = { fact_id: taskId + ':fact', task_id: taskId, project_name: 'project-a', fact_type: 'stage', stage: 'build-code', status: 'present', value: { outcome: 'completed' }, source: { ref: 'stage:' + taskId, source_id: 'stage', source_version: 'v1', kind: 'stage' }, coverage: { expected: 1, observed: 1 }, evidence_refs: [], observed_at: '2026-08-12T00:00:00.000Z' };
      publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId, facts: [fact], generatedAt: '2026-08-12T00:00:00.000Z' });
      rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:00:00.000Z' });
    `;
    await Promise.all(['task-concurrent-a', 'task-concurrent-b'].map((taskId) => execFile(process.execPath, ['--input-type=module', '-e', child, storageRoot, taskId], { cwd: process.cwd() })));
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.status).toBe('partial');
    expect(result.snapshot.stale).toBe(false);
    expect(result.snapshot.records.map((record) => record.task_id)).toEqual(['task-concurrent-a', 'task-concurrent-b']);
    const lines = readFileSync(result.outputJsonl, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    expect(lines.map((record) => record.task_id)).toEqual(['task-concurrent-a', 'task-concurrent-b']);
  });
});
