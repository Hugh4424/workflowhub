import { describe, expect, it } from 'vitest';
import { validateStageSpecAnalyzeProfile } from '../../runtime/stage/stage-content-contracts.mjs';

// Consumer: build-code's existing strict spec analyzer. These synthetic rows
// exercise diagnostics only; they are not canonical execution or quality proof.
const tree = 'b'.repeat(40);
const binding = { ref: 'tests', hash: 'a'.repeat(64), snapshot_tree: tree };
const anchor = (role) => ({ id: role, path: 'runtime/example.mjs', start_line: 1, end_line: 2, role });
function analyze(overrides = {}, cohort = 'post', boundTestResult = undefined) {
  const row = {
    acceptance_criterion_id: 'AC-001', status: 'unknown', task_id: 'task',
    material_revision: 'revision-1', snapshot_tree: tree, producer_stage: 'build-code',
    source_ids: [], decision_ids: [], fr_ids: [], task_ids: [],
    scenario: 'Two independent scopes are evaluated', actual_outcome: 'unknown',
    coverage_limits: 'No unique single command can represent both scopes',
    evidence_refs: [binding], ...overrides,
  };
  const result = validateStageSpecAnalyzeProfile({
    stage: 'build-code', strict_material_contracts: true,
    identity: { task_id: 'task', stage: 'build-code', material_revision: 'revision-1', snapshot_tree: tree, activation_cohort: cohort },
    packet: {
      activation_cohort: cohort, original_requirements: [], coverage: [],
      materials: { spec: '## Acceptance Criteria\n- **AC-001** Both scopes must be evaluated', decision_log: '', phases: {}, phase_index: '' },
      evidence: [{ ...binding, status: 'fresh', ...(boundTestResult ? { test_result: boundTestResult } : {}) }], acceptance_coverage: [row],
    },
  });
  return { result, errors: result.errors.filter((error) => error.includes('build-code acceptance chain[0]')) };
}
const gateErrors = (errors) => errors.filter((error) => /\.gate\.|\.test_result/.test(error));

describe('conditional post acceptance diagnostics', () => {
  it('does not invent a mandatory single-command gate for a multi-scope post AC', () => {
    const { result, errors } = analyze();
    expect(gateErrors(errors)).toEqual([]);
    expect(result.ok).toBe(false);
    expect(errors).toContain('build-code acceptance chain[0] status must be covered for a complete analyzer chain');
    expect(errors).toContain('build-code acceptance chain[0].source_ids must be non-empty');
  });
  it('preserves pre/history mandatory gate and test-result diagnostics', () => {
    expect(gateErrors(analyze({}, 'pre').errors)).toEqual(expect.arrayContaining([
      'build-code acceptance chain[0].gate.command is required',
      'build-code acceptance chain[0].test_result must bind the gate to an actual test result',
    ]));
  });
  it.each([{ gate: {} }, { gate: null }, { gate_command: '' }, { test_result: {} }])('validates any claimed optional projection %j rather than treating it as absent', (fields) => {
    expect(gateErrors(analyze(fields).errors)).toContain('build-code acceptance chain[0].gate.command is required');
  });
  it('validates a complete optional projection against its original test-result carrier', () => {
    const test = { evidence_ref: 'tests', command: 'node check.mjs', expected_exit: 0, actual_exit: 0, oracle: 'Both checks pass', actual_outcome: 'both passed' };
    const fields = { gate: { command: test.command, expected_exit: 0, oracle: test.oracle }, test_result: test };
    expect(gateErrors(analyze(fields, 'post', test).errors)).toEqual([]);
    expect(analyze(fields, 'post', { ...test, actual_exit: 1 }).errors).toContain('build-code acceptance chain[0].test_result.actual_exit does not match bound evidence');
  });
  it('keeps actual nonzero single-command exits visible', () => {
    const test = { evidence_ref: 'tests', command: 'node check.mjs', expected_exit: 0, actual_exit: 1, oracle: 'Both checks pass', actual_outcome: 'one failed' };
    const { errors } = analyze({ gate: { command: test.command, expected_exit: 0, oracle: test.oracle }, test_result: test });
    expect(errors).toContain('build-code acceptance chain[0].test_result actual_exit does not satisfy expected_exit');
  });
  it('reports absent anchors as missing without inventing an independence collision', () => {
    const { errors } = analyze();
    expect(errors).toContain('build-code acceptance chain[0].implementation_anchor is invalid');
    expect(errors).toContain('build-code acceptance chain[0].verification_anchor is invalid');
    expect(errors.join('\n')).not.toContain('must be independently anchored');
  });
  it('does not report collision for malformed anchors with matching absent fields', () => {
    expect(analyze({ implementation_anchor: {}, verification_anchor: {} }).errors.join('\n')).not.toContain('must be independently anchored');
  });
  it('still detects a real collision between two valid anchors', () => {
    expect(analyze({ implementation_anchor: anchor('implementation'), verification_anchor: anchor('verification') }).errors.join('\n')).toContain('must be independently anchored');
  });
  it('accepts distinct valid anchor locations', () => {
    expect(analyze({ implementation_anchor: anchor('implementation'), verification_anchor: { ...anchor('verification'), start_line: 3, end_line: 4 } }).errors.join('\n')).not.toContain('must be independently anchored');
  });
});
