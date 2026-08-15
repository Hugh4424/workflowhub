import { describe, expect, it } from 'vitest';
import { deriveMonitoringDiagnostics, deriveMonitoringViewReadiness } from '../runtime/evidence/monitoring-diagnostics.mjs';

const fact = (overrides = {}) => ({
  schema_version: 'monitoring-fact.v1', fact_id: overrides.fact_id ?? `f-${Math.random()}`,
  task_id: 'task-a', project_name: 'workflowhub', fact_type: 'stage', stage: 'make-decision',
  step_id: null, skill_id: null, session_id: 's1', subagent_id: null, run_id: 'run-1', attempt_id: 'a1',
  status: 'present', value: {}, reason: null, error: null, observed_at: '2026-08-12T00:00:00.000Z',
  source: { kind: 'registered_codex', ref: 'facts/fixture', source_id: 'fixture', source_version: 'v1' },
  coverage: { expected: 1, observed: 1 }, contract_version: 'm15', collector_version: 'm15', adapter_version: 'fixture', skill_version: null, evidence_refs: [], ...overrides,
});

const topology = {
  stages: [
    { id: 'make-decision', steps: [{ id: 'md-1' }] },
    { id: 'build-spec', steps: [{ id: 'bs-1' }] },
    { id: 'build-plan', steps: [{ id: 'bp-1' }] },
    { id: 'build-code', steps: [{ id: 'bc-1' }], skills: [{ id: 'skill-a', trigger: true }] },
    { id: 'verify-code', steps: [{ id: 'vc-1' }] },
  ],
};

describe('M15 diagnostics', () => {
  it('keeps repeated step ids scoped to their stage', () => {
    const scopedTopology = { stages: [
      { id: 'build-spec', steps: [{ id: '1' }], skills: [] },
      { id: 'build-plan', steps: [{ id: '1' }], skills: [] },
    ] };
    const result = deriveMonitoringDiagnostics({ topology: scopedTopology, facts: [
      fact({ fact_id: 'step-a', fact_type: 'step', stage: 'build-spec', step_id: '1', value: { outcome: 'completed' } }),
      fact({ fact_id: 'step-b', fact_type: 'step', stage: 'build-plan', step_id: '1', value: { outcome: 'skipped' } }),
    ] });
    expect(result.steps).toEqual([
      expect.objectContaining({ stage: 'build-spec', id: '1', status: 'completed' }),
      expect.objectContaining({ stage: 'build-plan', id: '1', status: 'skipped' }),
    ]);
  });

  it('keeps repeated skill ids scoped to their stage', () => {
    const scopedTopology = { stages: [
      { id: 'build-spec', steps: [], skills: [{ id: 'shared-skill', trigger: true }] },
      { id: 'build-plan', steps: [], skills: [{ id: 'shared-skill', trigger: true }] },
    ] };
    const result = deriveMonitoringDiagnostics({ topology: scopedTopology, facts: [
      fact({ fact_id: 'skill-a', fact_type: 'skill', stage: 'build-spec', skill_id: 'shared-skill', value: { trigger: true, executed: true } }),
      fact({ fact_id: 'skill-b', fact_type: 'skill', stage: 'build-plan', skill_id: 'shared-skill', value: { trigger: false, reason: 'not applicable' } }),
    ] });
    expect(result.skills).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-spec', id: 'shared-skill', status: 'executed' }),
      expect.objectContaining({ stage: 'build-plan', id: 'shared-skill', status: 'not_applicable' }),
    ]));
  });

  it('does not call a triggered but unexecuted skill present', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'skill-not-run', fact_type: 'skill', stage: 'build-code', skill_id: 'skill-a', value: { trigger: true, executed: false } }),
    ] });
    expect(result.skills).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'skill-a', status: 'missing' })]));
  });

  it('distinguishes future stage pending, stage gap, step outcome, and legal skill trigger false', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'stage-1', fact_type: 'stage', stage: 'build-code', value: { outcome: 'started' } }),
      fact({ fact_id: 'step-1', fact_type: 'step', stage: 'build-code', step_id: 'bc-1', value: { outcome: 'skipped' } }),
      fact({ fact_id: 'skill-1', fact_type: 'skill', stage: 'build-code', skill_id: 'skill-a', value: { trigger: false, reason: 'not applicable' } }),
    ] });
    expect(result.stage).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'verify-code', status: 'pending' }),
      expect.objectContaining({ id: 'build-code', status: 'present' }),
    ]));
    expect(result.steps).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'bc-1', status: 'skipped' })]));
    expect(result.skills).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'skill-a', status: 'not_applicable' })]));
  });

  it('does not claim a trigger-false skill is not applicable without a skip reason', () => {
    const result = deriveMonitoringDiagnostics({ topology: {
      stages: [{ id: 'build-code', steps: [], skills: [{ id: 'skip-without-reason', trigger: false }] }],
    }, facts: [] });
    expect(result.skills).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'skip-without-reason', status: 'incomplete', reason: 'skill_skip_reason_unavailable' }),
    ]));
  });

  it('keeps a failed stage outcome visible as a failed process fact', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'stage-failed', fact_type: 'stage', stage: 'build-code', value: { outcome: 'failed' } }),
    ] });
    expect(result.stage).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'build-code', status: 'failed' })]));
  });

  it('keeps reasons and controlled source refs on process diagnostics', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'missing-step', fact_type: 'step', stage: 'build-code', step_id: 'bc-1', status: 'missing', value: null, reason: 'step_outcome_unavailable', source: { ...fact().source, ref: 'stage-source' } }),
    ] });
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', reason: 'step_outcome_unavailable', source_refs: ['stage-source'] }),
    ]));
  });

  it('marks a missing middle stage as an evidence gap and detects out-of-order steps', () => {
    const orderTopology = { ...topology, stages: topology.stages.map((stage) => stage.id === 'build-code' ? { ...stage, steps: [{ id: 'bc-1' }, { id: 'bc-2' }] } : stage) };
    const result = deriveMonitoringDiagnostics({ topology: orderTopology, facts: [
      fact({ fact_id: 'stage-1', fact_type: 'stage', stage: 'build-code' }),
      fact({ fact_id: 'step-2', fact_type: 'step', stage: 'build-code', step_id: 'bc-2' }),
      fact({ fact_id: 'step-1', fact_type: 'step', stage: 'build-code', step_id: 'bc-1' }),
    ] });
    expect(result.stage).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'build-spec', status: 'evidence_gap' })]));
    expect(result.steps).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'bc-1', status: 'out_of_order' })]));
  });

  it('treats distinct attempts as versions and selects the latest stage/step result', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'stage-old', fact_type: 'stage', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-a', value: { outcome: 'failed' }, observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'step-old', fact_type: 'step', stage: 'build-code', step_id: 'bc-1', run_id: 'run-1', attempt_id: 'attempt-a', value: { outcome: 'failed' }, observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'stage-new', fact_type: 'stage', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-b', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:01:00.000Z' }),
      fact({ fact_id: 'step-new', fact_type: 'step', stage: 'build-code', step_id: 'bc-1', run_id: 'run-1', attempt_id: 'attempt-b', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:01:00.000Z' }),
    ] });
    expect(result.stage).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'build-code', status: 'present' })]));
    expect(result.stage).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'build-code', status: 'conflict' })]));
    expect(result.steps).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'bc-1', status: 'completed' })]));
  });

  it('keeps the latest attempt for every stage visible when stages ran separately', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'build-stage', fact_type: 'stage', stage: 'build-code', run_id: 'run-build', attempt_id: 'attempt-build', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'build-step', fact_type: 'step', stage: 'build-code', step_id: 'bc-1', run_id: 'run-build', attempt_id: 'attempt-build', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'verify-stage', fact_type: 'stage', stage: 'verify-code', run_id: 'run-verify', attempt_id: 'attempt-verify', status: 'incomplete', value: { outcome: 'incomplete' }, observed_at: '2026-08-12T00:01:00.000Z' }),
      fact({ fact_id: 'verify-step', fact_type: 'step', stage: 'verify-code', step_id: 'vc-1', run_id: 'run-verify', attempt_id: 'attempt-verify', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:01:00.000Z' }),
    ] });
    expect(result.current.selection).toBe('latest_attempt_per_stage');
    expect(result.current.run_id).toBeNull();
    expect(result.current.attempt_id).toBeNull();
    expect(result.current.run_ids).toEqual(['run-build', 'run-verify']);
    expect(result.current.attempt_ids).toEqual(['attempt-build', 'attempt-verify']);
    expect(result.current.stage_attempts).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', run_id: 'run-build', attempt_id: 'attempt-build', fact_count: 2 }),
      expect.objectContaining({ stage: 'verify-code', run_id: 'run-verify', attempt_id: 'attempt-verify', fact_count: 2 }),
    ]));
    expect(result.stage).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'build-code', status: 'present', run_id: 'run-build', attempt_id: 'attempt-build' }),
      expect.objectContaining({ id: 'verify-code', status: 'incomplete', run_id: 'run-verify', attempt_id: 'attempt-verify' }),
    ]));
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'completed' }),
      expect.objectContaining({ stage: 'verify-code', id: 'vc-1', status: 'completed' }),
    ]));
  });

  it('uses the latest attempt for source and overview readiness without deleting old gaps', () => {
    const facts = [
      fact({ fact_id: 'source-old', fact_type: 'source_status', run_id: 'run-1', attempt_id: 'attempt-old', status: 'missing', source: { ...fact().source, source_id: 'codex-source' }, value: null, reason: 'no_registered_source', observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'stage-old', fact_type: 'stage', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-old', value: { outcome: 'failed' }, observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'source-new', fact_type: 'source_status', run_id: 'run-1', attempt_id: 'attempt-new', status: 'present', source: { ...fact().source, source_id: 'codex-thread' }, value: { source_id: 'codex-rollout' }, observed_at: '2026-08-12T00:01:00.000Z' }),
      fact({ fact_id: 'stage-new', fact_type: 'stage', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-new', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:01:00.000Z' }),
    ];
    const readiness = deriveMonitoringViewReadiness({ facts, topology, inScopeTaskCount: 1 });
    expect(readiness.task_overview.field_coverage.task_id.status).toBe('present');
    expect(readiness.task_overview.field_coverage.run_id.status).toBe('present');
    expect(readiness.task_overview.field_coverage.attempt_id.status).toBe('present');
    expect(readiness.task_overview.field_coverage['stage.value.outcome'].status).toBe('present');
    expect(readiness.task_overview.field_coverage['source.status']).toMatchObject({ status: 'present', observed: 1 });
    expect(deriveMonitoringDiagnostics({ topology, facts }).stage).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'build-code', status: 'present' }),
    ]));
  });

  it('lets a later present source status recover an earlier missing marker in the same attempt', () => {
    const facts = [
      fact({ fact_id: 'source-missing', fact_type: 'source_status', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-1', status: 'missing', source: { ...fact().source, kind: 'unknown', source_id: 'codex-source-missing' }, value: null, reason: 'no_registered_source', observed_at: '2026-08-12T00:00:00.000Z' }),
      fact({ fact_id: 'source-present', fact_type: 'source_status', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-1', status: 'present', source: { ...fact().source, kind: 'registered_codex', source_id: 'codex-thread' }, value: { source_id: 'codex-thread', registration_id: 'registration-1', required: true, scope: 'stage', capabilities: ['step', 'skill'] }, observed_at: '2026-08-12T00:01:00.000Z' }),
      fact({ fact_id: 'stage-current', fact_type: 'stage', stage: 'build-code', run_id: 'run-1', attempt_id: 'attempt-1', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:01:00.000Z' }),
    ];
    const readiness = deriveMonitoringViewReadiness({ facts, topology, inScopeTaskCount: 1 });
    expect(readiness.task_overview.field_coverage['source.status']).toMatchObject({ status: 'present', observed: 1 });
    expect(deriveMonitoringDiagnostics({ topology, facts }).steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'missing' }),
    ]));
  });

  it('does not treat quality evidence gaps as transcript collection gaps', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'codex-present', fact_type: 'source_status', stage: 'build-code', status: 'present', source: { ...fact().source, kind: 'registered_codex', source_id: 'codex-thread' }, value: { source_id: 'codex-thread', registration_id: 'codex-thread', required: true, scope: 'stage', capabilities: ['step', 'skill'] } }),
      fact({ fact_id: 'quality-missing', fact_type: 'source_status', status: 'unsupported', source: { ...fact().source, kind: 'quality', source_id: 'quality-owner' }, value: null, reason: 'quality_fact_unsupported' }),
    ] });
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'missing' }),
    ]));
    expect(result.failures).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'transcript', status: 'unsupported' }),
    ]));
  });

  it('does not call undeclared step or skill capabilities workflow degradation', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'codex-present-undeclared', fact_type: 'source_status', status: 'present', source: { ...fact().source, kind: 'registered_codex', source_id: 'codex-thread' }, value: { source_id: 'codex-thread', registration_id: 'codex-thread', required: true } }),
    ] });
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'unknown' }),
    ]));
    expect(result.skills).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'skill-a', status: 'unknown' }),
    ]));
  });

  it('does not apply a stage-less source status from one stage to another stage', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'verify-source-missing', fact_type: 'source_status', stage: null, run_id: 'run-verify', attempt_id: 'attempt-verify', status: 'missing', value: null, reason: 'no_registered_source', observed_at: '2026-08-12T00:01:00.000Z' }),
      fact({ fact_id: 'build-stage', fact_type: 'stage', stage: 'build-code', run_id: 'run-build', attempt_id: 'attempt-build', value: { outcome: 'completed' }, observed_at: '2026-08-12T00:00:00.000Z' }),
    ] });
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'unknown', reason: 'source_unknown' }),
    ]));
    expect(result.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'transcript', status: 'missing' }),
    ]));
  });

  it('uses controlled failure domains and never emits score or solution', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [fact({ fact_id: 'health-1', fact_type: 'health', value: { domain: 'task_dir', status: 'missing' }, status: 'missing', reason: 'task path unavailable' })] });
    expect(result.failures).toEqual([expect.objectContaining({ domain: 'task_dir', status: 'missing' })]);
    expect(result.failures[0]).not.toHaveProperty('severity');
    expect(result.failures[0]).not.toHaveProperty('solution');
  });

  it('uses the typed health status instead of the envelope present status', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [fact({
      fact_id: 'health-value-missing', fact_type: 'health', status: 'present',
      value: { domain: 'review', status: 'missing' }, reason: null,
    })] });
    expect(result.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'review', status: 'missing' }),
    ]));
    expect(result.failures).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'review', status: 'present' }),
    ]));
  });

  it('maps an unsupported typed health status to a controlled diagnostic status', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [fact({
      fact_id: 'health-value-mismatch', fact_type: 'health', status: 'present',
      value: { domain: 'worktree', status: 'mismatch' }, reason: null,
    })] });
    expect(result.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'worktree', status: 'partial' }),
    ]));
  });

  it('dedupes tokens by message id, tools by tool id, preserves conflicts, and refuses one-bucket trends', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 't1', fact_type: 'token', value: { message_id: 'm1', tokens: 10, grain: 'message' }, stage: 'build-code' }),
      fact({ fact_id: 't2', fact_type: 'token', value: { message_id: 'm1', tokens: 10, grain: 'message' }, stage: 'build-code' }),
      fact({ fact_id: 'u1', fact_type: 'tool_use', value: { tool_use_id: 'u1', name: 'read', grain: 'tool_use' }, stage: 'build-code' }),
      fact({ fact_id: 'u2', fact_type: 'tool_use', value: { tool_use_id: 'u1', name: 'read', grain: 'tool_use' }, stage: 'build-code' }),
      fact({ fact_id: 'c1', fact_type: 'token', status: 'conflict', value: null, reason: 'source_conflict', error: 'SOURCE_CONFLICT', stage: 'build-code' }),
      fact({ fact_id: 'cost-1', fact_type: 'token', value: { message_id: 'm3', tokens: 8, grain: 'message' }, stage: 'build-code', observed_at: '2026-08-11T00:00:00.000Z' }),
    ] });
    expect(result.cost.token_count).toBe(18);
    expect(result.cost.breakdown.stage['build-code']).toBe(18);
    expect(result.cost.tool_use_count).toBe(1);
    expect(result.cost.conflicts).toBe(1);
    expect(result.cost.token_waste.status).toBe('unknown');
    expect(result.trends.status).toBe('insufficient_samples');
  });

  it('binds step cost to the manifest slug and carries cost evidence to the step row', () => {
    const result = deriveMonitoringDiagnostics({ topology: {
      stages: [{ id: 'build-code', steps: [{ id: 'bc-1', slug: 'implement-change', order: 1 }], skills: [] }],
    }, facts: [fact({ fact_id: 'token-bound', fact_type: 'token', stage: 'build-code', step_id: 'bc-1', step_slug: 'implement-change', evidence_refs: ['quality/evidence/token-bound'], value: { message_id: 'm-bound', total_tokens: 7, grain: 'message' } })] });
    expect(result.cost.breakdown.step['build-code+implement-change']).toBe(7);
    expect(result.cost.breakdown_evidence.step['build-code+implement-change']).toContain('quality/evidence/token-bound');
    expect(result.steps[0]).toMatchObject({ step_slug: 'implement-change', status: 'unknown' });
    expect(result.steps[0].source_refs).toContain('quality/evidence/token-bound');
  });

  it('keeps transcript totals separate from stage-outcome step and skill attribution', () => {
    const result = deriveMonitoringDiagnostics({ topology: {
      stages: [{ id: 'build-code', steps: [{ id: 'bc-1', slug: 'implement-change', order: 1 }], skills: [{ id: 'skill-a' }] }],
    }, facts: [
      fact({ fact_id: 'transcript-token', fact_type: 'token', stage: 'build-code', value: { message_id: 'message-1', total_tokens: 5, grain: 'message' } }),
      fact({ fact_id: 'outcome-step-token', fact_type: 'token', stage: 'build-code', step_id: 'bc-1', step_slug: 'implement-change', value: { message_id: 'stage-outcome:step:bc-1', tokens: 7, grain: 'stage_outcome' } }),
      fact({ fact_id: 'outcome-skill-token', fact_type: 'token', stage: 'build-code', skill_id: 'skill-a', value: { message_id: 'stage-outcome:skill:skill-a', tokens: 9, grain: 'stage_outcome' } }),
      fact({ fact_id: 'transcript-duration', fact_type: 'duration', stage: 'build-code', value: { event_id: 'event-1', duration_ms: 100, grain: 'message' } }),
      fact({ fact_id: 'outcome-step-duration', fact_type: 'duration', stage: 'build-code', step_id: 'bc-1', step_slug: 'implement-change', value: { event_id: 'stage-outcome:duration:step:bc-1', duration_ms: 200, grain: 'stage_outcome' } }),
      fact({ fact_id: 'outcome-skill-duration', fact_type: 'duration', stage: 'build-code', skill_id: 'skill-a', value: { event_id: 'stage-outcome:duration:skill:skill-a', duration_ms: 300, grain: 'stage_outcome' } }),
    ] });
    expect(result.cost.token_count).toBe(5);
    expect(result.cost.breakdown.stage['build-code']).toBe(5);
    expect(result.cost.breakdown.step['build-code+implement-change']).toBe(7);
    expect(result.cost.breakdown.skill['skill-a']).toBe(9);
    expect(result.cost.duration_ms).toBe(100);
    expect(result.cost.duration_breakdown.stage['build-code']).toBe(100);
    expect(result.cost.duration_breakdown.step['build-code+implement-change']).toBe(200);
    expect(result.cost.duration_breakdown.skill['skill-a']).toBe(300);
  });

  it('counts the producer token shape and exposes mechanically proven duplicate waste', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 't1', fact_type: 'token', value: { message_id: 'm1', input_tokens: 2, output_tokens: 3, total_tokens: 5, grain: 'message' }, stage: 'build-code' }),
      fact({ fact_id: 't2', fact_type: 'token', status: 'conflict', value: null, reason: 'duplicate_id_conflict', error: 'MESSAGE_ID_CONFLICT', stage: 'build-code' }),
    ] });
    expect(result.cost.token_count).toBe(5);
    expect(result.cost.token_waste).toMatchObject({ status: 'present', value: 1 });
    expect(result.failures).toEqual(expect.arrayContaining([expect.objectContaining({ domain: 'token_waste' })]));
  });

  it('sums input and output tokens when a producer omits total_tokens', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 't-input-output', fact_type: 'token', value: { message_id: 'm-input-output', input_tokens: 2, output_tokens: 3, grain: 'message' }, stage: 'build-code' }),
    ] });
    expect(result.cost.token_count).toBe(5);
    expect(result.cost.breakdown.stage['build-code']).toBe(5);
  });

  it('does not double count one duration exposed by token and duration facts', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'token-duration', fact_type: 'token', stage: 'build-code', value: { message_id: 'm-duration', total_tokens: 4, event_id: 'event-duration', duration_ms: 125, grain: 'session' } }),
      fact({ fact_id: 'explicit-duration', fact_type: 'duration', stage: 'build-code', value: { event_id: 'event-duration', duration_ms: 125, grain: 'session' } }),
    ] });
    expect(result.cost.duration_ms).toBe(125);
    expect(result.cost.duration_breakdown.stage['build-code']).toBe(125);
  });

  it('does not silently choose or add same-grain token facts from different sources', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'source-a', fact_type: 'token', source: { ...fact().source, source_id: 'source-a' }, value: { message_id: 'm-shared', total_tokens: 5, grain: 'message' }, stage: 'build-code' }),
      fact({ fact_id: 'source-b', fact_type: 'token', source: { ...fact().source, source_id: 'source-b' }, value: { message_id: 'm-shared', total_tokens: 9, grain: 'message' }, stage: 'build-code' }),
    ] });
    expect(result.cost.token_count).toBeNull();
    expect(result.cost.breakdown.stage['build-code']).toBeUndefined();
    expect(result.cost.token_waste).toMatchObject({ status: 'unknown', value: null });
    expect(result.cost.conflicts).toBe(1);
  });

  it('does not silently choose same tool ids from different sources', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'tool-source-a', fact_type: 'tool_use', source: { ...fact().source, source_id: 'source-a' }, value: { tool_use_id: 'tool-shared', name: 'Read', grain: 'tool_use' }, stage: 'build-code' }),
      fact({ fact_id: 'tool-source-b', fact_type: 'tool_use', source: { ...fact().source, source_id: 'source-b' }, value: { tool_use_id: 'tool-shared', name: 'Write', grain: 'tool_use' }, stage: 'build-code' }),
    ] });
    expect(result.cost.tool_use_count).toBeNull();
    expect(result.cost.conflicts).toBe(1);
  });

  it('shows cost for the current attempt instead of mixing older attempts into the task view', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'token-a', fact_type: 'token', run_id: 'run-1', attempt_id: 'attempt-a', value: { message_id: 'm-reused', total_tokens: 5, grain: 'message' }, stage: 'build-code' }),
      fact({ fact_id: 'token-b', fact_type: 'token', run_id: 'run-1', attempt_id: 'attempt-b', value: { message_id: 'm-reused', total_tokens: 5, grain: 'message' }, stage: 'build-code' }),
      fact({ fact_id: 'tool-a', fact_type: 'tool_use', run_id: 'run-1', attempt_id: 'attempt-a', value: { tool_use_id: 'tool-reused', name: 'Read', grain: 'tool_use' }, stage: 'build-code' }),
      fact({ fact_id: 'tool-b', fact_type: 'tool_use', run_id: 'run-1', attempt_id: 'attempt-b', value: { tool_use_id: 'tool-reused', name: 'Read', grain: 'tool_use' }, stage: 'build-code' }),
    ] });
    expect(result.cost.token_count).toBe(5);
    expect(result.cost.tool_use_count).toBe(1);
    expect(result.cost.conflicts).toBe(0);
  });

  it('keeps automation unknown without origin and calls a problem common only at count two', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'a1', fact_type: 'automation', value: { origin: 'agent', action: 'x' } }),
      fact({ fact_id: 'a2', fact_type: 'automation', value: { origin: null, action: 'y' } }),
      fact({ fact_id: 'f1', fact_type: 'health', value: { domain: 'review', friction_type: 'missing', error_code: 'E1' } }),
      fact({ fact_id: 'f2', fact_type: 'health', value: { domain: 'review', friction_type: 'missing', error_code: 'E1' } }),
    ] });
    expect(result.automation.rate).toMatchObject({ status: 'unknown', value: null, numerator: 1, denominator: 2, excluded_unknown: 1 });
    expect(result.problems).toEqual([expect.objectContaining({ count: 2, common: true, domain: 'review', friction_type: 'missing', error_code: 'E1' })]);
  });

  it('does not turn source collection gaps into common workflow problems', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'source-unavailable', fact_type: 'source_status', status: 'unavailable', value: null, reason: 'read_error', coverage: { observed: 0, expected: null } }),
      fact({ fact_id: 'source-unsupported', fact_type: 'source_status', status: 'unsupported', value: null, reason: 'format_not_supported', coverage: { observed: 0, expected: null } }),
    ] });
    expect(result.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'transcript', status: 'unavailable' }),
      expect.objectContaining({ domain: 'transcript', status: 'unsupported' }),
    ]));
    expect(result.problems).toEqual([]);
  });

  it('does not call an applicable step missing when its source is not registered', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'source-missing', fact_type: 'source_status', stage: 'build-code', status: 'missing', value: null, reason: 'no_registered_source', coverage: { observed: 0, expected: null } }),
    ] });
    expect(result.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'unavailable' }),
    ]));
    expect(result.steps).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'build-code', id: 'bc-1', status: 'missing' }),
    ]));
  });

  it('keeps metric-specific trends and unavailable skill evidence explicit', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'r1', fact_type: 'review', value: { invoked: true }, observed_at: '2026-08-10T00:00:00.000Z' }),
      fact({ fact_id: 'r2', fact_type: 'review', value: { invoked: true }, observed_at: '2026-08-11T00:00:00.000Z' }),
      fact({ fact_id: 'v1', fact_type: 'verify', value: { fresh: false }, observed_at: '2026-08-10T00:00:00.000Z' }),
      fact({ fact_id: 'v2', fact_type: 'verify', value: { fresh: true }, observed_at: '2026-08-11T00:00:00.000Z' }),
      fact({ fact_id: 's1', fact_type: 'skill', stage: 'build-code', skill_id: 'skill-a', status: 'unknown', reason: 'unavailable', value: null }),
    ] });
    expect(result.trends.status).toBe('insufficient_samples');
    expect(result.trends.metrics.review_invoked.status).toBe('present');
    expect(result.trends.metrics.review_invoked.numerator).toBe(2);
    expect(result.trends.metrics.review_invoked.denominator).toBe(2);
    expect(result.trends.metrics.verify_fresh.status).toBe('present');
    expect(result.trends.metrics.verify_fresh.numerator).toBe(1);
    expect(result.trends.metrics.verify_fresh.denominator).toBe(2);
    expect(result.trends.metrics.automation.status).toBe('insufficient_samples');
    expect(result.skills).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'skill-a', status: 'unavailable' })]));
  });

  it('does not count review or verify trend rows without the typed boolean', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'review-unknown', fact_type: 'review', value: {}, observed_at: '2026-08-10T00:00:00.000Z' }),
      fact({ fact_id: 'verify-unknown', fact_type: 'verify', value: {}, observed_at: '2026-08-11T00:00:00.000Z' }),
    ] });
    expect(result.trends.metrics.review_invoked).toMatchObject({ status: 'insufficient_samples', buckets: 0, usable_buckets: 0, numerator: 0, denominator: 0 });
    expect(result.trends.metrics.verify_fresh).toMatchObject({ status: 'insufficient_samples', buckets: 0, usable_buckets: 0, numerator: 0, denominator: 0 });
  });

  it('does not merge incompatible source buckets into a trend', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'review-source-a', fact_type: 'review', value: { invoked: true }, observed_at: '2026-08-10T00:00:00.000Z', source: { kind: 'registered_codex', ref: 'facts/a', source_id: 'source-a', source_version: 'v1' } }),
      fact({ fact_id: 'review-source-b', fact_type: 'review', value: { invoked: true }, observed_at: '2026-08-10T00:00:00.000Z', source: { kind: 'registered_codex', ref: 'facts/b', source_id: 'source-b', source_version: 'v1' } }),
    ] });
    expect(result.trends.metrics.review_invoked).toMatchObject({ status: 'insufficient_samples', buckets: 2, usable_buckets: 0, numerator: 0, denominator: 0 });
  });

  it('uses distinct tasks as trend denominators and counts compatible date buckets', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'review-a-1', task_id: 'task-a', fact_type: 'review', value: { invoked: true }, observed_at: '2026-08-10T00:00:00.000Z' }),
      fact({ fact_id: 'review-a-2', task_id: 'task-a', fact_type: 'review', value: { invoked: true }, observed_at: '2026-08-10T01:00:00.000Z' }),
      fact({ fact_id: 'review-b-1', task_id: 'task-b', fact_type: 'review', value: { invoked: false }, observed_at: '2026-08-11T00:00:00.000Z' }),
    ] });
    expect(result.trends.metrics.review_invoked).toMatchObject({ buckets: 2, usable_buckets: 2, numerator: 1, denominator: 2, status: 'present' });
  });

  it('shows retries from the current attempt instead of mixing older attempts into the task view', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'retry-a', fact_type: 'retry', attempt_id: 'attempt-a', value: { retry_id: 'retry-1', retry_count: 1, attempt_id: 'attempt-a', grain: 'session' } }),
      fact({ fact_id: 'retry-b', fact_type: 'retry', attempt_id: 'attempt-b', value: { retry_id: 'retry-1', retry_count: 1, attempt_id: 'attempt-b', grain: 'session' } }),
    ] });
    expect(result.cost.retry_count).toBe(1);
  });

  it('keeps unobserved cost dimensions unknown instead of zero-filling them', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [fact({ fact_id: 'stage-only' })] });
    expect(result.cost.token_count).toBeNull();
    expect(result.cost.tool_use_count).toBeNull();
    expect(result.cost.retry_count).toBeNull();
    expect(result.cost.duration_ms).toBeNull();
  });

  it('does not double count explicit duration with the same event start/end pair', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'duration-explicit', fact_type: 'duration', stage: 'build-code', value: { event_id: 'event-1', duration_ms: 100, grain: 'session' } }),
      fact({ fact_id: 'session-start', fact_type: 'session', stage: 'build-code', value: { event_id: 'event-1', event: 'start', timestamp: '2026-08-12T00:00:00.000Z' } }),
      fact({ fact_id: 'session-end', fact_type: 'session', stage: 'build-code', value: { event_id: 'event-1', event: 'end', timestamp: '2026-08-12T00:00:02.000Z' } }),
    ] });
    expect(result.cost.duration_ms).toBe(100);
    expect(result.cost.duration_breakdown.stage['build-code']).toBe(100);
    expect(result.cost.duration_breakdown.session.s1).toBe(100);
  });

  it('does not double count session explicit duration with the same event start/end pair', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'session-start', fact_type: 'session', value: { event_id: 'event-session', event: 'start', timestamp: '2026-08-12T00:00:00.000Z', duration_ms: 100 } }),
      fact({ fact_id: 'session-end', fact_type: 'session', value: { event_id: 'event-session', event: 'end', timestamp: '2026-08-12T00:00:02.000Z' } }),
    ] });
    expect(result.cost.duration_ms).toBe(100);
  });

  it('surfaces non-present quality-owner facts as controlled failure diagnostics', () => {
    const result = deriveMonitoringDiagnostics({ topology, facts: [
      fact({ fact_id: 'review-missing', fact_type: 'review', status: 'missing', value: null, reason: 'quality_review_missing', stage: 'build-code' }),
      fact({ fact_id: 'test-failed', fact_type: 'test', status: 'partial', value: null, reason: 'quality_test_failed', stage: 'build-code' }),
      fact({ fact_id: 'verify-stale', fact_type: 'verify', status: 'present', value: { invoked: true, fresh: false, outcome: 'passed' }, stage: 'verify-code' }),
      fact({ fact_id: 'artifact-missing', fact_type: 'artifact', status: 'missing', value: null, reason: 'artifact_missing', stage: 'build-code' }),
    ] });
    expect(result.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'review', status: 'missing' }),
      expect.objectContaining({ domain: 'review', status: 'partial' }),
      expect.objectContaining({ domain: 'artifact_missing', status: 'missing' }),
      expect.objectContaining({ domain: 'verify', status: 'partial' }),
    ]));
    expect(result.failures).not.toEqual(expect.arrayContaining([expect.objectContaining({ domain: 'verify', status: 'present' })]));
  });
});
