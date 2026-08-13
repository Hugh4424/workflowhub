import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTask } from '../runtime/task/task-handle.mjs';
import { initializeTaskStore, readTaskFacts } from '../runtime/task/task-store.mjs';
import { createRegisteredCodexSource } from '../runtime/evidence/codex-transcript-adapter.mjs';
import { createTranscriptSourceReader } from '../runtime/evidence/fact-collector.mjs';
import { createQualityFact } from '../runtime/evidence/quality-fact.mjs';
import { publishVerifySummary } from '../runtime/evidence/quality-store.mjs';
import { publishStaleMonitoringSnapshot, runMonitoringSidecar } from '../tools/cli/stage-runtime.mjs';
import { monitoringTopology, stageRuntimeCliMain } from '../tools/cli/stage-runtime.mjs';

function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-integration-')));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-integration-repo-')));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  const task = createTask({ storageRoot, manifest: { schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'm15-integration', created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  initializeTaskStore(task.taskPath, { taskId: 'm15-integration' });
  return { storageRoot, task };
}

describe('M15 stage sidecar integration', () => {
  it('runs after publication with a registered source and reaches projection/global data', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => JSON.stringify({ id: 'm1', type: 'message', run_id: 'run-1', stage: 'build-code', usage: { input_tokens: 2, output_tokens: 3 } })) });
    const result = await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    expect(result.status).toBe('present');
    expect(readTaskFacts(task.taskPath).some((fact) => fact.fact_type === 'token' && fact.value.total_tokens === 5)).toBe(true);
    expect(readTaskFacts(task.taskPath).some((fact) => fact.fact_type === 'step' && fact.status === 'missing')).toBe(true);
    expect(readTaskFacts(task.taskPath).some((fact) => fact.fact_type === 'skill' && fact.status === 'unknown')).toBe(true);
    expect(readFileSync(result.global_snapshot, 'utf8')).toContain('globalThis.__WH_MONITOR_DATA__');
    expect(result.diagnostics?.skills ?? []).toBeDefined();
  });

  it('loads declared skill trigger topology instead of silently publishing an empty skill dimension', () => {
    const topology = monitoringTopology(realpathSync(new URL('..', import.meta.url).pathname));
    expect(topology.stages).toHaveLength(5);
    expect(topology.stages.flatMap((stage) => stage.skills).length).toBeGreaterThan(0);
    expect(topology.stages.flatMap((stage) => stage.skills).every((skill) => typeof skill.trigger_condition === 'string')).toBe(true);
  });

  it('does not duplicate facts when the same stage publication is replayed', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => JSON.stringify({ id: 'm1', type: 'message', run_id: 'run-1', usage: { input_tokens: 2, output_tokens: 3 } })) });
    await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const facts = readTaskFacts(task.taskPath);
    expect(facts.filter((fact) => fact.fact_id === 'token:session-1:m1')).toHaveLength(1);
  });

  it('keeps a new attempt and stage result when the same task stage is rerun', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => '') });
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: { status: 'failed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: { status: 'completed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const stageFacts = readTaskFacts(task.taskPath).filter((fact) => fact.fact_type === 'stage' && fact.stage === 'build-code');
    expect(stageFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ attempt_id: 'attempt-a', status: 'unknown', value: null, reason: 'stage_outcome_failed' }),
      expect.objectContaining({ attempt_id: 'attempt-b', value: { outcome: 'completed' } }),
    ]));
    expect(stageFacts).toHaveLength(2);
  });

  it('keeps transcript facts from each rerun attempt instead of filtering by a fixed fact id', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => JSON.stringify({ id: 'm1', type: 'message', run_id: 'run-1', usage: { input_tokens: 2, output_tokens: 3 } })) });
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: { status: 'failed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: { status: 'completed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const tokenFacts = readTaskFacts(task.taskPath).filter((record) => record.fact_type === 'token');
    expect(tokenFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ attempt_id: 'attempt-a', value: expect.objectContaining({ message_id: 'm1' }) }),
      expect.objectContaining({ attempt_id: 'attempt-b', value: expect.objectContaining({ message_id: 'm1' }) }),
    ]));
    expect(new Set(tokenFacts.map((record) => record.fact_id)).size).toBe(2);
  });

  it('uses one derived attempt identity for stage and quality monitoring facts', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'review',
      status: 'recorded',
      subject: 'same_build_integration_review',
      evidence: [{ ref: 'quality/reviews/results/review.json', sha256: 'c'.repeat(64), evidence_type: 'review_result' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' },
      stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const facts = readTaskFacts(task.taskPath);
    const stage = facts.find((fact) => fact.fact_type === 'stage' && fact.stage === 'build-code');
    const review = facts.find((fact) => fact.fact_type === 'review');
    expect(stage?.attempt_id).toMatch(/^attempt-[a-f0-9]{32}$/);
    expect(review?.attempt_id).toBe(stage?.attempt_id);
  });

  it('maps verify owner facts without turning stale verification into success', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'passed', fresh: true });
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const verify = readTaskFacts(task.taskPath).find((fact) => fact.fact_type === 'verify');
    expect(verify).toMatchObject({
      status: 'present',
      attempt_id: 'attempt-verify',
      value: { invoked: true, fresh: true, outcome: 'passed', source_ref: 'quality/verify.json' },
      evidence_refs: ['quality/verify.json'],
    });
  });

  it('maps quality test facts into canonical monitoring observations', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'test',
      status: 'passed',
      subject: 'm15-focused-tests',
      evidence: [{ ref: 'quality/tests/m15-focused.json', sha256: 'c'.repeat(64), evidence_type: 'test_receipt' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-test' },
      stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'test',
        status: 'present',
        attempt_id: 'attempt-test',
        evidence_refs: [quality.ref],
        value: expect.objectContaining({ invoked: true, outcome: 'passed', freshness: 'current', source_ref: quality.ref }),
      }),
    ]));
  });

  it('keeps a failed quality review as a failed observation instead of hiding it as unknown', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'review',
      status: 'failed',
      subject: 'same_build_integration_review',
      evidence: [{ ref: 'quality/reviews/results/m15-failed.json', sha256: 'c'.repeat(64), evidence_type: 'review_result' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-review-failed' },
      stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'review',
        status: 'present',
        value: expect.objectContaining({ outcome: 'failed', invoked: true, source_ref: quality.ref }),
      }),
    ]));
  });

  it('preserves verify outcome and stale freshness instead of collapsing it to unknown', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'passed', fresh: false });
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify-stale' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'verify',
        status: 'present',
        value: { invoked: true, fresh: false, outcome: 'passed', source_ref: 'quality/verify.json' },
      }),
    ]));
  });

  it('keeps incomplete verify evidence partial instead of treating it as current', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'incomplete', fresh: true });
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify-incomplete' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: 'verify', status: 'partial', reason: 'verify_incomplete', value: null }),
    ]));
  });

  it('rejects a verify record bound to another task instead of publishing success', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'passed', fresh: true });
    const verifyPath = join(task.taskPath, 'quality', 'verify.json');
    const verify = JSON.parse(readFileSync(verifyPath, 'utf8'));
    verify.task_id = 'other-task';
    writeFileSync(verifyPath, `${JSON.stringify(verify)}\n`);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify-binding' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: 'verify', status: 'unknown', reason: 'verify_binding_conflict', error: 'VERIFY_SOURCE_BINDING_MISMATCH', value: null }),
    ]));
  });

  it('records a missing quality fact ref instead of silently dropping it', async () => {
    const { storageRoot, task } = fixture();
    const missingRef = `quality/facts/${'d'.repeat(64)}.json`;
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-quality-missing' },
      stageOutcome: { status: 'completed', quality_fact_refs: [missingRef] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'source_status',
        status: 'missing',
        reason: 'quality_fact_record_missing',
        evidence_refs: [missingRef],
      }),
    ]));
  });

  it('records an invalid quality ref without exposing the raw path', async () => {
    const { storageRoot, task } = fixture();
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-quality-invalid' },
      stageOutcome: { status: 'completed', quality_fact_refs: ['../private/quality.json'] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const invalid = readTaskFacts(task.taskPath).find((fact) => fact.reason === 'quality_fact_record_unavailable');
    expect(invalid).toMatchObject({ fact_type: 'source_status', status: 'unknown', evidence_refs: [expect.stringMatching(/^quality-ref:/)] });
    expect(invalid.evidence_refs[0]).not.toContain('private');
  });

  it('keeps missing quality-source observations from repeated attempts', async () => {
    const { storageRoot, task } = fixture();
    const missingRef = `quality/facts/${'e'.repeat(64)}.json`;
    const run = (attempt_id) => runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id },
      stageOutcome: { status: 'completed', quality_fact_refs: [missingRef] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    await run('attempt-a');
    await run('attempt-b');
    const missing = readTaskFacts(task.taskPath).filter((fact) => fact.reason === 'quality_fact_record_missing');
    expect(missing.map((fact) => fact.attempt_id)).toEqual(expect.arrayContaining(['attempt-a', 'attempt-b']));
  });

  it('does not silently drop unsupported or cross-stage quality facts', async () => {
    const { storageRoot, task } = fixture();
    const unsupported = createQualityFact({ taskId: task.identity.taskId, stage: 'build-code', materialRevision: `revision-${'a'.repeat(64)}`, snapshotTree: 'b'.repeat(40), kind: 'acceptance_criterion', status: 'passed', subject: 'ac-1', evidence: [{ ref: 'quality/evidence/ac.json', sha256: 'c'.repeat(64), evidence_type: 'acceptance_evidence' }] });
    task.createRecordAtomic(unsupported.ref, unsupported.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-spec', attempt_id: 'attempt-binding' },
      stageOutcome: { status: 'completed', quality_fact_refs: [unsupported.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const status = readTaskFacts(task.taskPath).find((fact) => fact.error === 'UNSUPPORTED_QUALITY_FACT_KIND' || fact.error === 'QUALITY_FACT_STAGE_MISMATCH');
    expect(status).toMatchObject({ fact_type: 'source_status', status: 'unknown', evidence_refs: [unsupported.ref] });
  });

  it('keeps quality observations from repeated attempts when the ref is unchanged', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'test',
      status: 'passed',
      subject: 'm15-repeat-test',
      evidence: [{ ref: 'quality/tests/m15-repeat.json', sha256: 'c'.repeat(64), evidence_type: 'test_receipt' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] }, services: { resolveMonitoringSource: async () => null }, now: () => new Date('2026-08-12T00:00:00.000Z') };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: base.stageOutcome, services: base.services, now: base.now });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: base.stageOutcome, services: base.services, now: base.now });
    const tests = readTaskFacts(task.taskPath).filter((fact) => fact.fact_type === 'test');
    expect(tests.map((fact) => fact.attempt_id)).toEqual(expect.arrayContaining(['attempt-a', 'attempt-b']));
  });

  it('publishes verify missing when the quality owner record is unavailable', async () => {
    const { storageRoot, task } = fixture();
    rmSync(join(task.taskPath, 'quality/verify.json'));
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const verify = readTaskFacts(task.taskPath).find((fact) => fact.fact_type === 'verify');
    expect(verify).toMatchObject({
      status: 'missing',
      reason: 'quality_verify_record_missing',
      attempt_id: 'attempt-verify',
      coverage: { observed: 0, expected: 1 },
    });
  });

  it('keeps absent host binding as missing instead of guessing a native session', async () => {
    const { storageRoot, task } = fixture();
    const result = await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    expect(result.status).toBe('missing');
    expect(readTaskFacts(task.taskPath)[0]).toMatchObject({ fact_type: 'source_status', status: 'missing', reason: 'no_registered_source' });
  });

  it('rebuilds the global bundle when a sidecar fallback publishes stale state', () => {
    const { storageRoot, task } = fixture();
    const result = publishStaleMonitoringSnapshot({
      context: { storageRoot, task, identity: task.identity },
      message: 'monitoring sidecar failed: injected failure',
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(result.projection.value.status).toBe('stale');
    expect(result.snapshot.snapshot.status).toBe('stale');
    expect(readFileSync(result.snapshot.outputData, 'utf8')).toContain('monitoring sidecar failed: injected failure');
  });

  it('keeps monitoring source capability private to the stage-runtime seam', async () => {
    let received;
    await stageRuntimeCliMain(['run', '--action=execute', '--stage=build-code', '--project=workflowhub', '--task=m15-integration'], {
      services: { resolveMonitoringSource: () => null },
      delegate: async (_argv, options) => { received = options.services; return { ok: true }; },
    });
    expect(received).toEqual(expect.objectContaining({ resolveMonitoringSource: expect.any(Function) }));
  });
});
