import { describe, expect, it } from 'vitest';
import { carryAuditSummary, hashAuditSummary, loadAuditSummary, verifyAuditCarrier, verifyAuditSummary } from '../core/audit-summary-carrier.mjs';
import { validateStageResult } from '../scripts/validate-stage-result.mjs';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function summary(verdict = 'pass') {
  const value = { schema_version: 'v1', workflow_run_id: 'run-1', expected_steps: [], observed_steps: [], requirement_coverage: {}, facts: {}, verdict, evidence_refs: [], ledger_hash: null, manifest_hash: null };
  return { ...value, summary_hash: hashAuditSummary(value) };
}
function result(stage, facts) {
  const stageFacts = stage === 'make-decision' ? { decision: 'go', scope: 'small', decision_log_path: 'decision.md', flow_profile: 'full_vibecoding' }
    : stage === 'build-spec' ? { spec_ref: 'spec.md', requirements: ['R1'] }
    : stage === 'build-plan' ? { plan_ref: 'plan.md', tasks: ['P1'] }
    : stage === 'build-code' ? { changed: ['a.mjs'], tests: { command: 'npm test' }, review: { core_receipt_hash: 'a'.repeat(64), semantic_verdict: 'pass', needs_human: false }, worktree_root: '/tmp/worktree', task_tracking_root: '/tmp/task', phase_completion: { commit_records: [], no_change_records: [{ phase_id: 'P1', no_change_reason: 'fixture' }] } }
    : { verdict: 'pass', evidence_ref: 'test/report.md' };
  return { status: 'success', error_code: '', retryable: false, facts: { ...stageFacts, ...facts }, missing_items: [], user_decision: false, reason: 'ok' };
}

describe('P3 audit summary carrier', () => {
  it('preserves one published tuple across all five stage result consumers', () => {
    const published = summary();
    const tuple = carryAuditSummary('evidence/audit-summary.json', published);
    for (const stage of ['make-decision', 'build-spec', 'build-plan', 'build-code', 'verify-code']) {
      const checked = validateStageResult(stage, result(stage, tuple));
      expect(checked.ok, `${stage}: ${checked.errors.join('; ')}`).toBe(true);
    }
  });

  it('rejects a forged verdict or incomplete v1 tuple and detects hash disagreement with the published record', () => {
    const published = summary();
    const tuple = carryAuditSummary('evidence/audit-summary.json', published);
    expect(verifyAuditSummary(tuple.audit_summary_ref, published, { hash: 'b'.repeat(64) }).ok).toBe(false);
    expect(verifyAuditCarrier({ ...tuple, audit_verdict: 'revise_required' }).ok).toBe(false);
    expect(verifyAuditCarrier({ ...tuple, audit_summary_hash: undefined }).ok).toBe(false);
  });

  it('marks absent fields as legacy with an explicit migration hint, never a new verdict', () => {
    const carrier = verifyAuditCarrier({});
    expect(carrier).toMatchObject({ ok: true, legacy: true });
    expect(carrier.migration_hint).toMatch(/audit_contract_version/);
  });

  it('loads task-local published summary and detects tampering', () => {
    const root = mkdtempSync(join(tmpdir(), 'audit-carrier-'));
    try {
      const published = summary();
      writeFileSync(join(root, 'audit.json'), JSON.stringify(published));
      expect(loadAuditSummary(root, 'audit.json', { hash: published.summary_hash, verdict: 'pass' }).ok).toBe(true);
      writeFileSync(join(root, 'audit.json'), JSON.stringify({ ...published, verdict: 'fail' }));
      expect(loadAuditSummary(root, 'audit.json').errors.join(' ')).toMatch(/HASH_MISMATCH/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
