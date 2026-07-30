import { describe, expect, it } from 'vitest';
import { computeLedgerHash, computeRequirementContentHash } from '../core/requirement-ledger.mjs';
import { buildAuditSummaryFromJournalEvents } from '../core/audit-aggregator.mjs';
import { carryAuditSummary, verifyAuditCarrier } from '../core/audit-summary-carrier.mjs';
import { publishCanonicalAuditSummaryRecord } from '../core/canonical-receipt-writer.mjs';

const STAGES = ['make-decision', 'build-spec', 'build-plan', 'build-code', 'verify-code'];
const HASH = 'a'.repeat(64);
function ledger() {
  const requirement = { requirement_id: 'R1', status: 'accepted', source_ref: { kind: 'source', uri_or_path: 'source://R1', content_hash: HASH }, decision_ref: { kind: 'decision', uri_or_path: 'decision://R1', content_hash: 'b'.repeat(64) }, artifact_refs: [{ kind: 'artifact', uri_or_path: 'artifact://R1', content_hash: 'c'.repeat(64) }], acceptance_criteria_refs: [{ kind: 'ac', uri_or_path: 'ac://R1', content_hash: 'd'.repeat(64) }], upstream_hashes: [HASH], stale: false };
  requirement.content_hash = computeRequirementContentHash(requirement);
  const value = { schema_version: 'v1', source_manifest_hash: 'e'.repeat(64), requirements: [requirement] };
  return { ...value, ledger_hash: computeLedgerHash(value) };
}
function context(stage, steps = [{ step_id: 1, order: 1, attempt_id: 'attempt-1', depends_on: [] }]) { return { manifest: { schema_version: '2.0.0', stage_slug: stage, manifest_hash: 'f'.repeat(64), steps }, ledger: ledger() }; }
function paired(stage, run = `run-${stage}`, step = 1, attempt = 'attempt-1', extra = {}) {
  const entry = { event_type: 'step_entry', workflow_run_id: run, stage_slug: stage, step_id: step, attempt_id: attempt, timestamp: '2026-07-13T00:00:00.000Z', journal_entry_id: `${stage}-${step}-${attempt}`, entry_evidence: { kind: 'command', uri_or_path: `evidence/${stage}-${step}-entry.json` }, ...extra.entry };
  const exit = { event_type: 'step_exit', workflow_run_id: run, stage_slug: stage, step_id: step, attempt_id: attempt, timestamp: '2026-07-13T00:01:00.000Z', entry_journal_entry_id: entry.journal_entry_id, terminal_status: 'success', completion_evidence: { kind: 'command', uri_or_path: `evidence/${stage}-${step}-exit.json` }, ...extra.exit };
  return [entry, exit];
}

describe('P3 five-stage canonical audit E2E', () => {
  it('normal path: manifest expected work, observed receipts, and one carrier tuple agree for all five stages', () => {
    const summaries = STAGES.map((stage) => {
      const run = `run-${stage}`;
      const summary = buildAuditSummaryFromJournalEvents(paired(stage, run), stage, run, context(stage)).audit_summary;
      expect(summary.verdict).toBe('pass');
      expect(summary.expected_steps).toHaveLength(1);
      expect(summary.observed_steps).toMatchObject([{ step_id: 1, entry: true, terminal_exit: true, terminal_status: 'success' }]);
      return summary;
    });
    expect(verifyAuditCarrier(carryAuditSummary('evidence/audit-summary.json', summaries[0]))).toMatchObject({ ok: true, legacy: false });
  });

  it('legacy, skip, cross-attempt, and reordering records fail closed without another quality verdict', () => {
    const stage = 'build-code'; const run = 'run-adversarial';
    const legacy = buildAuditSummaryFromJournalEvents([{ event_type: 'step_entry', workflow_run_id: run, stage_slug: stage, step_id: 1 }], stage, run, context(stage)).audit_summary;
    expect(legacy).toMatchObject({ verdict: 'fail', facts: { unknown: [{ type: 'invalid_receipt', step_id: 1 }] } });
    const skipped = buildAuditSummaryFromJournalEvents(paired(stage, run, 1, 'attempt-1', { exit: { terminal_status: 'skipped' } }), stage, run, context(stage)).audit_summary;
    expect(skipped.facts.terminal_non_success).toHaveLength(1);
    const crossAttempt = paired(stage, run); crossAttempt[1].entry_journal_entry_id = 'other-entry';
    const crossed = buildAuditSummaryFromJournalEvents(crossAttempt, stage, run, context(stage)).audit_summary;
    expect(crossed.facts.cross_attempt).toHaveLength(1);
    const reordered = [...paired(stage, run, 2), ...paired(stage, run, 1)];
    const order = buildAuditSummaryFromJournalEvents(reordered, stage, run, context(stage, [{ step_id: 1, order: 1, attempt_id: 'attempt-1', depends_on: [] }, { step_id: 2, order: 2, attempt_id: 'attempt-1', depends_on: [1] }])).audit_summary;
    expect(order.facts.out_of_order.length + order.facts.dependency.length).toBeGreaterThan(0);
    for (const summary of [legacy, skipped, crossed, order]) expect(summary.verdict).toBe('fail');
  });

  it('rejects a publication whose evidence hash is bound to another summary', () => {
    const stage = 'build-code'; const run = 'run-wrong-binding';
    const summary = buildAuditSummaryFromJournalEvents(
      paired(stage, run),
      stage,
      run,
      context(stage),
    ).audit_summary;
    const writes = [];
    expect(() => publishCanonicalAuditSummaryRecord({
      summary,
      ref: 'evidence/audit-summary.json',
      expectedHash: 'b'.repeat(64),
      readExisting: () => undefined,
      write: (...args) => writes.push(args),
    }), 'ORACLE-COMP: mismatched publication evidence must fail before canonical write')
      .toThrow(/HASH_MISMATCH/i);
    expect(writes).toEqual([]);
  });
});
