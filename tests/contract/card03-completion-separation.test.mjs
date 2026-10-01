import { describe, expect, it } from 'vitest';
import { deriveStageCompletion } from '../../runtime/stage/completion-predicates.mjs';
import { acceptanceCoverageSummary, acceptanceExecutionFacts, findingDispositions } from '../../runtime/stage/stage-handlers.mjs';
const ref = { ref: 'quality/evidence/leaf.json', sha256: 'a'.repeat(64) };
const coverage = (status, evidence_refs = [ref]) => ({ accepted_criterion_ids: ['AC-ONE'], items: [{ acceptance_criterion_id: 'AC-ONE', status, evidence_refs }] });
describe('CARD03 completion separates implementation, execution and acceptance', () => {
  it('does not infer partial implementation from absent quality facts or complete implementation from execution alone', () => {
    const result = deriveStageCompletion('build-code', [], { authenticateBuildCodeCompletion: () => ({ unavailable_phase_review: true, acceptance_execution_complete: true }) });
    expect(result).toMatchObject({ status: 'in_progress', implementation_completion: 'unknown', missing: expect.arrayContaining(['acceptance_criteria', 'finding_dispositions']) });
  });
  it('preserves a completed failing evaluation as failure rather than missing work', () => {
    expect(acceptanceCoverageSummary({ ...coverage('missing'), items: [{ ...coverage('missing').items[0], evaluation_result: 'failed' }] })).toMatchObject({ evaluation_status: 'evaluated', result: 'failed' });
  });
  it('preserves unknown judgment even when the scenario produced authentic evidence', () => {
    expect(acceptanceCoverageSummary(coverage('unknown'))).toMatchObject({ evaluation_status: 'evaluated', result: 'inconclusive' });
    expect(acceptanceCoverageSummary(coverage('missing'))).toMatchObject({ evaluation_status: 'evaluated', result: 'inconclusive' });
  });
  it('does not invent an evaluation for absent source, an empty set or duplicate rows', () => {
    expect(acceptanceCoverageSummary(coverage('unknown', []))).toMatchObject({ evaluation_status: 'missing', result: 'missing' });
    expect(acceptanceCoverageSummary({ accepted_criterion_ids: [], items: [] })).toMatchObject({ evaluation_status: 'missing', result: 'missing' });
    const invalid = coverage('covered'); invalid.items.push(invalid.items[0]);
    expect(acceptanceCoverageSummary(invalid)).toMatchObject({ evaluation_status: 'missing', result: 'missing' });
  });
  it('passes only complete covered or explicitly not-applicable judgments', () => {
    expect(acceptanceCoverageSummary(coverage('covered'))).toMatchObject({ evaluation_status: 'evaluated', result: 'passed' });
    expect(acceptanceCoverageSummary(coverage('covered', []))).toMatchObject({ result: 'missing' });
  });
});

const tasks = `# Tasks

- **Template version**：\`plan-task.v4\`

## Phase P6 — delivery acceptance

#### T019 — acceptance
- **ID**：T019
- **ui_scope**：ui
- **acceptance_role**：acceptance
- **e2e_scope**：ui
- **AC**：AC-ONE
- **acceptance_data**：\`[{"source":"qa/browser","sample":"real page fixture","scenario":"user saves settings","tier":"browser"},{"source":"service/api","sample":"real request","scenario":"service persists settings","tier":"service","execution":{"module_ref":"tests/accept-service.mjs","export_name":"accept","input":{"sample":"real request"},"timeout_ms":5000}},{"source":"command/cli","sample":"real task store","scenario":"command verifies evidence","tier":"command","execution":{"command":"node","args":["tests/accept-command.mjs"],"timeout_ms":5000}}]\`
`;

const tree = 'b'.repeat(40);
function worker() {
  return { stage: 'build-code', identity: { taskId: 'task' }, currentMaterialRevision: 'revision', currentAttemptId: 'attempt', workflowRunId: 'run',
    readArtifact: (name) => name === 'tasks.md' ? tasks : '# Current materials',
    runAcceptanceScenario: async (scenario) => ({ status: 'executed', tier: scenario.tier, evidence_refs: [{ ...ref, ref: 'quality/evidence/' + scenario.tier + '.json' }], ...(scenario.tier === 'browser' ? { executor: 'controlled-browser-qa' } : {}) }) };
}
describe('CARD03 private acceptance reuse contract', () => {
  it('reuses immutable execution only through the runner capability and preserves original attempt', async () => {
    const source = await acceptanceExecutionFacts(worker(), tree);
    const next = worker(); next.currentAttemptId = 'second';
    next.readCurrentAcceptanceExecution = () => ({ authenticated: true, execution: source });
    next.runAcceptanceScenario = () => { throw new Error('unexpected re-execution'); };
    const reused = await acceptanceExecutionFacts(next, tree);
    expect(reused.execution_binding.attempt_id).toBe('attempt');
    expect(reused.items).toEqual(source.items);
  });
  it('executes when the authenticated reader has no current source', async () => {
    const next = worker(); next.readCurrentAcceptanceExecution = () => null;
    expect(await acceptanceExecutionFacts(next, tree)).toMatchObject({ status: 'executed' });
  });
  it('fails loudly for a reader returning an unauthenticated or different scenario', async () => {
    const source = await acceptanceExecutionFacts(worker(), tree);
    const next = worker(); next.readCurrentAcceptanceExecution = () => ({ authenticated: false, execution: source });
    await expect(acceptanceExecutionFacts(next, tree)).rejects.toThrow('unauthenticated');
    next.readCurrentAcceptanceExecution = () => ({ authenticated: true, execution: { ...source, items: source.items.map((item, index) => index === 0 ? { ...item, scenario: 'changed' } : item) } });
    await expect(acceptanceExecutionFacts(next, tree)).rejects.toThrow('scenario');
  });
});

describe('CARD03 unavailable disposition source separation', () => {
  it('retains each authenticated source error with its own immutable tuple', () => {
    const reviews = ['direction', 'detail'].map((name, index) => ({
      authenticated_unavailable_source: true,
      facts: { status: 'unavailable', error: { code: 'REVIEW_EXECUTION_FAILED', message: name + ' unavailable' } },
      ref: 'quality/reviews/attempts/' + name + '/attempt.json',
      evidence: { sha256: String(index + 1).repeat(64) },
      value: { material_revision: name + '-material', snapshot_tree: String(index + 1).repeat(40) },
    }));
    const result = findingDispositions(reviews, {});
    expect(result.facts.status).toBe('not_applicable');
    expect(result.facts.items).toEqual([]);
    expect(result.facts.source_review_refs).toEqual(reviews.map(({ ref, evidence }) => ({ ref, sha256: evidence.sha256 })));
    expect(result.facts.attempts).toEqual(reviews.map((review) => ({
      status: 'unavailable', error: review.facts.error,
      attempt_ref: review.ref, attempt_hash: review.evidence.sha256,
      material_revision: review.value.material_revision, snapshot_tree: review.value.snapshot_tree,
    })));
  });
  it('does not turn a missing unverified source or a recorded finding into unavailable N/A', () => {
    expect(findingDispositions([{ facts: { status: 'unavailable' } }], {}).facts.status).toBe('missing');
    expect(findingDispositions([{ facts: { status: 'recorded' }, value: { findings: [{ id: 'finding-one', severity: 'major', actionable: true }] } }], {}).facts.status).not.toBe('not_applicable');
  });
});
