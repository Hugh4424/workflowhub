import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { publishTaskMonitoringProjection, rebuildGlobalMonitoringSnapshot, validateMonitoringProjection } from '../runtime/evidence/monitoring-projector.mjs';

const execFile = promisify(execFileCallback);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const root = () => realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-projector-')));
const fact = (task_id, extra = {}) => ({ fact_id: `${task_id}:fact`, task_id, project_name: 'project-a', fact_type: 'stage', stage: 'build-code', status: 'present', value: { outcome: 'completed' }, source: { ref: `stage:${task_id}`, source_id: 'stage', source_version: 'v1', kind: 'stage' }, coverage: { expected: 1, observed: 1 }, evidence_refs: [], observed_at: '2026-08-12T00:00:00.000Z', ...extra });

describe('M15 project/global projector', () => {
  it('publishes one task per atomic projection and rebuilds the root bundle with an explicit derived fallback', () => {
    const storageRoot = root();
    const a = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'task-a', facts: [fact('task-a')], generatedAt: '2026-08-12T00:00:00.000Z' });
    const b = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-b', taskId: 'task-b', facts: [fact('task-b', { project_name: 'project-b' })], generatedAt: '2026-08-12T00:00:00.000Z' });
    expect(validateMonitoringProjection(a.value)).toBe(a.value);
    expect(validateMonitoringProjection(b.value)).toBe(b.value);
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.records.map((record) => record.task_id)).toEqual(['task-a', 'task-b']);
    expect(readFileSync(result.outputJsonl, 'utf8').trim().split('\n')).toHaveLength(2);
    expect(readFileSync(result.outputData, 'utf8')).toContain('globalThis.__WH_MONITOR_DATA__ = Object.freeze(');
    expect(result.snapshot.in_scope_task_count).toBe(2);
    expect(result.snapshot.views.task_overview.sample_sufficiency).toBe('insufficient');
    const html = readFileSync(result.outputHtml, 'utf8');
    expect(html).toContain('workflowhub-monitor-data.js');
    expect(html).toContain('任务执行情况');
    expect(html).toContain('最近任务');
    expect(html).toContain('步骤与技能');
    expect(html).toContain('五个固定阶段');
    expect(html).toContain('成本归因');
    expect(html).toContain('问题与趋势');
    expect(html).toContain('全部项目');
    expect(html).toContain('七类筛选');
    expect(html).not.toContain('id="status-filter"');
    expect(html).toContain('data-view="overview"');
    expect(html).toContain('data-view="degradation"');
    expect(html).toContain('data-view="cost"');
    expect(html).toContain('data-view="problems"');
    expect(html).toContain('id="global-filter"');
    expect(html).toContain('id="task-filter"');
    expect(html).toContain('id="stage-filter"');
    expect(html).toContain("entry.id === stage && entry.status !== 'pending' && hasObservedEntry(entry)");
    expect(html).toContain('id="skill-filter"');
    expect(html).toContain('id="version-filter"');
    expect(html).toContain('id="time-filter"');
    expect(html).toContain('empty_valid');
    expect(html).toContain('data-ui-state="loading"');
    expect(html).toContain('snapshotValid');
    expect(html).toContain('in_scope_task_count');
    expect(html).toContain('错误：');
    expect(html).toContain('sample_sufficiency');
    expect(html).toContain('in_scope_task_count');
    expect(html).toContain('duration_breakdown');
    expect(html).toContain('stageDuration');
    expect(html).toContain('activeView');
    expect(html).toContain('dataset.ref');
    expect(html).toContain('未采集');
    expect(html).toContain('步骤和技能名称来自固定流程清单');
    expect(html).toContain('不自动给修复建议');
    expect(html).toContain('当前会话没有接入记录器，无法采集真实 token 和耗时');
  });

  it('keeps every stage and step discoverable and exposes evidence context without a hidden click', () => {
    const storageRoot = root();
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    const html = readFileSync(result.outputHtml, 'utf8');
    expect(html).toContain('展开全部阶段');
    expect(html).toContain('收起全部阶段');
    expect(html).toContain('步骤和技能名称来自固定流程清单');
    expect(html).toContain('证据摘要');
    expect(html).toContain('证据链：已绑定');
    expect(html).toContain("const label = '证据 ' + (index + 1)");
    expect(html).toContain('当前结构化覆盖');
    expect(html).toContain('stage-summary-note');
    expect(html).toContain('见证来源：后续阶段事实（不是当前阶段证据）');
    expect(html).toContain('未拆分');
    expect(html).toContain('没有稳定归属来源');
  });

  it('publishes fixed view fields, field coverage, and sample sufficiency from facts', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'readiness-task', facts: [fact('readiness-task')] });
    expect(projection.value.in_scope_task_count).toBe(1);
    expect(projection.value.views).toEqual(expect.objectContaining({
      task_overview: expect.objectContaining({
        required_fields: expect.arrayContaining(['task_id', 'project_name', 'run_id', 'attempt_id', 'stage.value.outcome', 'source.status', 'coverage']),
        sample_sufficiency: 'insufficient',
        field_coverage: expect.objectContaining({ run_id: expect.objectContaining({ status: 'missing' }) }),
      }),
      process_degradation: expect.objectContaining({ sample_sufficiency: expect.any(String) }),
      cost_attribution: expect.objectContaining({ sample_sufficiency: expect.any(String) }),
      problems_trends: expect.objectContaining({ sample_sufficiency: expect.any(String) }),
    }));
  });

  it('binds each projection to a deterministic canonical-facts hash and changes it when facts change', () => {
    const storageRoot = root();
    const first = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'hash-task', facts: [fact('hash-task')] });
    const second = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'hash-task', facts: [fact('hash-task'), fact('hash-task', { fact_id: 'hash-task:step', fact_type: 'step' })] });
    expect(first.value.facts_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.value.facts_revision).toBe(first.value.facts_hash);
    expect(second.value.facts_hash).not.toBe(first.value.facts_hash);
    expect(second.value.facts_revision).toBe(second.value.facts_hash);
  });

  it('rejects a fact whose task/project identity differs from the projection target', () => {
    const storageRoot = root();
    expect(() => publishTaskMonitoringProjection({
      storageRoot,
      projectName: 'project-a',
      taskId: 'identity-task',
      facts: [fact('identity-task', { project_name: 'project-b' })],
    })).toThrow(/monitoring fact identity mismatch/i);
  });

  it('rebuilds task and global projections from canonical facts after derived files are removed', () => {
    const storageRoot = root();
    const taskRoot = join(storageRoot, 'Projects', 'project-a', 'tasks', 'canonical-task');
    mkdirSync(taskRoot, { recursive: true });
    writeFileSync(join(taskRoot, 'task.json'), JSON.stringify({ project_name: 'project-a', task_id: 'canonical-task' }));
    const canonicalFact = {
      ...fact('canonical-task'), schema_version: 'monitoring-fact.v1', step_id: null, skill_id: null,
      session_id: 'session-1', subagent_id: null, run_id: 'run-1', attempt_id: 'attempt-1', reason: null, error: null,
      contract_version: 'm15', collector_version: 'm15', adapter_version: 'fixture', skill_version: null,
    };
    const factsRaw = `${JSON.stringify(canonicalFact)}\n`;
    writeFileSync(join(taskRoot, 'facts.jsonl'), factsRaw);
    const factsHashBefore = sha256(readFileSync(join(taskRoot, 'facts.jsonl')));
    publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'canonical-task', facts: [canonicalFact] });
    rmSync(join(storageRoot, 'Projects', 'project-a', 'monitoring'), { recursive: true, force: true });
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.records).toEqual(expect.arrayContaining([expect.objectContaining({ task_id: 'canonical-task', project_name: 'project-a' })]));
    expect(readFileSync(join(storageRoot, 'Projects', 'project-a', 'monitoring', 'tasks', 'canonical-task.json'), 'utf8')).toContain('canonical-task');
    expect(readFileSync(join(taskRoot, 'facts.jsonl'), 'utf8')).toBe(factsRaw);
    expect(sha256(readFileSync(join(taskRoot, 'facts.jsonl')))).toBe(factsHashBefore);
  });

  it('maps a legal empty current projection to empty_valid view samples', () => {
    const storageRoot = root();
    const projection = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'empty-task', facts: [], status: 'current' });
    expect(projection.value.status).toBe('current');
    expect(projection.value.in_scope_task_count).toBe(0);
    expect(Object.values(projection.value.views).every((view) => view.sample_sufficiency === 'empty_valid')).toBe(true);
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

  it('retains the prior task projection when canonical facts cannot be read', () => {
    const storageRoot = root();
    const prior = publishTaskMonitoringProjection({ storageRoot, projectName: 'project-a', taskId: 'broken-task', facts: [fact('broken-task')], generatedAt: '2026-08-12T00:00:00.000Z' });
    const taskRoot = join(storageRoot, 'Projects', 'project-a', 'tasks', 'broken-task');
    mkdirSync(taskRoot, { recursive: true });
    writeFileSync(join(taskRoot, 'task.json'), JSON.stringify({ project_name: 'project-a', task_id: 'broken-task' }));
    writeFileSync(join(taskRoot, 'facts.jsonl'), '{not-json}\n');
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.status).toBe('stale');
    expect(result.snapshot.coverage).toMatchObject({ expected: 1, observed: 0 });
    expect(result.snapshot.records).toEqual([expect.objectContaining({ task_id: 'broken-task', status: 'stale', stale: true })]);
    expect(result.snapshot.records[0].errors).toEqual(expect.arrayContaining([expect.stringMatching(/invalid JSON/)]));
    expect(prior.value.status).toBe('partial');
  });

  it('keeps valid monitoring rows visible when an old row has unsupported value fields', () => {
    const storageRoot = root();
    const taskRoot = join(storageRoot, 'Projects', 'project-a', 'tasks', 'mixed-task');
    mkdirSync(taskRoot, { recursive: true });
    writeFileSync(join(taskRoot, 'task.json'), JSON.stringify({ project_name: 'project-a', task_id: 'mixed-task' }));
    const valid = {
      ...fact('mixed-task'), schema_version: 'monitoring-fact.v1', step_id: null, skill_id: null,
      session_id: 'session-1', subagent_id: null, run_id: 'run-1', attempt_id: 'attempt-1', reason: null, error: null,
      contract_version: 'm15', collector_version: 'm15', adapter_version: 'fixture', skill_version: null,
    };
    const invalid = { ...valid, fact_id: 'mixed-task:old-step', fact_type: 'step', value: { outcome: 'completed', old_lifecycle_field: 'old-lifecycle-field' } };
    const factsRaw = `${JSON.stringify(valid)}\n${JSON.stringify(invalid)}\n`;
    writeFileSync(join(taskRoot, 'facts.jsonl'), factsRaw);
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    const record = result.snapshot.records.find((entry) => entry.task_id === 'mixed-task');
    expect(record).toMatchObject({ task_id: 'mixed-task', status: 'partial', facts_summary: { count: 1 } });
    expect(record.errors).toEqual(expect.arrayContaining([expect.stringMatching(/invalid monitoring fact/)]));
    expect(result.snapshot.errors).toEqual(expect.arrayContaining([expect.stringMatching(/project-a\/mixed-task: facts\.jsonl line 2: invalid monitoring fact/)]));
    expect(readFileSync(join(taskRoot, 'facts.jsonl'), 'utf8')).toBe(factsRaw);
  });

  it('does not let an empty historical task with a pre-cutover identity poison the current snapshot', () => {
    const storageRoot = root();
    const taskRoot = join(storageRoot, 'Projects', 'project-a', 'tasks', 'old-task');
    mkdirSync(taskRoot, { recursive: true });
    writeFileSync(join(taskRoot, 'task.json'), JSON.stringify({ project_name: 'Project-A', task_id: 'old-task' }));
    writeFileSync(join(taskRoot, 'facts.jsonl'), '');
    const result = rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt: '2026-08-12T00:01:00.000Z' });
    expect(result.snapshot.errors).toEqual([]);
    expect(result.snapshot.records).toEqual([]);
    expect(result.snapshot.status).toBe('empty');
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
