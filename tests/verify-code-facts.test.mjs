import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readCommand, assembleStageResult, writeStageResult, validateMetricRecord } from '../workflows/verify-code/facts-assembly.mjs';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tmpDir;
beforeAll(() => { tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-facts-')); });
afterAll(() => { if (tmpDir) rmSync(tmpDir, { recursive: true, force: true }); });

describe('readCommand', () => {
  it('should return command string from facts.tests.command', () => {
    expect(readCommand({ facts: { tests: { command: 'npx vitest run' } } })).toBe('npx vitest run');
  });

  it('should throw when facts.tests.command is missing', () => {
    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/);
  });

  it('should throw with retryable=true when facts.tests.command is missing', () => {
    try { readCommand({ facts: { tests: {} } }); expect.fail(); }
    catch (e) { expect(e.retryable).toBe(true); }
  });

  it('should throw with retryable=true when facts.tests is missing', () => {
    try { readCommand({ facts: {} }); expect.fail(); }
    catch (e) { expect(e.retryable).toBe(true); }
  });

  it('should throw when command is not a string (type check)', () => {
    expect(() => readCommand({ facts: { tests: { command: 123 } } })).toThrow(/string/);
  });

  it('should have retryable=true when command type is wrong', () => {
    try { readCommand({ facts: { tests: { command: 123 } } }); expect.fail(); }
    catch (e) { expect(e.retryable).toBe(true); }
  });
});

describe('assembleStageResult', () => {
  const baseOpts = { verdict: 'pass', evidenceRef: 'evidence/fresh-capture.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false };

  it('should return 7-key stage-result object', () => {
    const r = assembleStageResult(baseOpts);
    expect(r.status).toBe('pass');
    expect(r.facts.evidence_ref).toBe('evidence/fresh-capture.json');
    expect('user_decision' in r).toBe(true);
  });

  it('should preserve all passed values', () => {
    const r = assembleStageResult({ ...baseOpts, anomalyFlags: ['stale_sha'], userDecision: true });
    expect(r.facts.anomaly_flags).toEqual(['stale_sha']);
    expect(r.user_decision).toBe(true);
  });

  // FR-PATH-003: evidence_ref must NOT contain specs/{task-id}/ prefix
  it('should throw when evidence_ref contains specs/ prefix', () => {
    expect(() => assembleStageResult({ ...baseOpts, evidenceRef: 'specs/m9/evidence/fresh-capture.json' }))
      .toThrow(/specs/);
  });

  it('should throw when evidence_ref is an absolute path', () => {
    expect(() => assembleStageResult({ ...baseOpts, evidenceRef: '/tmp/evidence.json' }))
      .toThrow(/absolute/);
  });

  it('should throw when evidence_ref contains ../ traversal', () => {
    expect(() => assembleStageResult({ ...baseOpts, evidenceRef: '../evidence.json' }))
      .toThrow(/traversal/);
    expect(() => assembleStageResult({ ...baseOpts, evidenceRef: 'evidence/../../secret.json' }))
      .toThrow(/traversal/);
  });

  it('should accept evidence_ref without specs/ prefix', () => {
    const r = assembleStageResult({ ...baseOpts, evidenceRef: 'evidence/fresh-capture.json' });
    expect(r.facts.evidence_ref).toBe('evidence/fresh-capture.json');
  });

  it('should accept valid relative path with ./ prefix', () => {
    const r = assembleStageResult({ ...baseOpts, evidenceRef: './evidence/fresh-capture.json' });
    expect(r.facts.evidence_ref).toBe('./evidence/fresh-capture.json');
  });

  it('user_decision must be present (falsifiable)', () => {
    expect('user_decision' in assembleStageResult(baseOpts)).toBe(true);
  });
});

describe('writeStageResult', () => {
  it('should write stage-result JSON', () => {
    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    writeStageResult(tmpDir, r);
    const raw = readFileSync(join(tmpDir, 'stage-result-verify-code.json'), 'utf-8');
    expect(JSON.parse(raw).status).toBe('pass');
  });

  it('should create directory if not exists', () => {
    const nested = join(tmpDir, 'nested-specs', 'm9-deep');
    writeStageResult(nested, assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false }));
    expect(JSON.parse(readFileSync(join(nested, 'stage-result-verify-code.json'), 'utf-8')).status).toBe('pass');
  });

  it('should attach audit_summary from verify-code journal events', () => {
    const taskDir = mkdtempSync(join(tmpDir, 'audit-summary-'));
    const events = [
      {
        event_type: 'step_entry',
        workflow_run_id: 'run-123',
        step_id: 'vc.work.1',
        check_status: 'ok',
        prev_step_id: null,
        next_step_id: 'vc.check.1',
      },
      {
        event_type: 'step_exit',
        workflow_run_id: 'run-123',
        step_id: 'vc.work.1',
        verdict: 'passed',
        prev_step_id: null,
        next_step_id: 'vc.check.1',
      },
      {
        event_type: 'step_entry',
        workflow_run_id: 'run-123',
        step_id: 'vc.check.1',
        check_status: 'blocked',
        prev_step_id: 'vc.work.1',
        next_step_id: null,
      },
      {
        event_type: 'step_auto_rollback',
        workflow_run_id: 'run-123',
        affected_step_id: 'vc.check.1',
        rollback_from_step_id: 'vc.check.1',
        rollback_to_step_id: 'vc.work.1',
        attempt_seq: 1,
        ineffective: true,
        reason: 'blocked check',
      },
      {
        event_type: 'step_entry',
        workflow_run_id: 'other-run',
        step_id: 'vc.work.1',
        check_status: 'skipped',
        prev_step_id: null,
        next_step_id: null,
      },
    ];
    writeFileSync(join(taskDir, 'journal.jsonl'), `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);

    writeStageResult(
      taskDir,
      assembleStageResult({
        verdict: 'pass',
        evidenceRef: 'e.json',
        anomalyFlags: [],
        missingItems: [],
        userDecision: null,
        reason: '',
        errorCode: null,
        retryable: false,
      }),
      { workflowRunId: 'run-123' },
    );

    const written = JSON.parse(readFileSync(join(taskDir, 'stage-result-verify-code.json'), 'utf-8'));
    expect(written.audit_summary).toEqual({
      total_step_count: 2,
      passed_step_count: 1,
      blocked_step_count: 1,
      skipped_step_count: 0,
      rollback_count: 1,
    });
    expect(written.reason).toBe('');
  });

  it('should record an audit_summary warning instead of silently omitting audit_summary', () => {
    const taskDir = mkdtempSync(join(tmpDir, 'audit-summary-missing-run-'));
    writeStageResult(
      taskDir,
      assembleStageResult({
        verdict: 'pass',
        evidenceRef: 'e.json',
        anomalyFlags: [],
        missingItems: [],
        userDecision: null,
        reason: 'done',
        errorCode: null,
        retryable: false,
      }),
    );

    const written = JSON.parse(readFileSync(join(taskDir, 'stage-result-verify-code.json'), 'utf-8'));
    expect(written.audit_summary).toEqual({
      total_step_count: 0,
      passed_step_count: 0,
      blocked_step_count: 0,
      skipped_step_count: 0,
      rollback_count: 0,
    });
    expect(written.reason).toContain('audit_summary_omitted:missing_workflow_run_id');
  });

  it('should catch malformed journal and record audit_summary_omitted:malformed_journal without throwing', () => {
    const taskDir = mkdtempSync(join(tmpDir, 'audit-summary-malformed-'));
    // Write a journal.jsonl that is syntactically invalid JSON
    writeFileSync(join(taskDir, 'journal.jsonl'), 'not-valid-json\n{broken');
    writeStageResult(
      taskDir,
      assembleStageResult({
        verdict: 'pass',
        evidenceRef: 'e.json',
        anomalyFlags: [],
        missingItems: [],
        userDecision: null,
        reason: '',
        errorCode: null,
        retryable: false,
      }),
      { workflowRunId: 'run-123' },
    );
    const written = JSON.parse(readFileSync(join(taskDir, 'stage-result-verify-code.json'), 'utf-8'));
    expect(written.reason).toContain('audit_summary_omitted:malformed_journal');
    // stage-result must still be written (not interrupted by the parse error)
    expect(written.status).toBe('pass');
  });
});

describe('validateMetricRecord', () => {
  const validRecord = { execution_id: 'e1', skill_or_stage: 'vc', stage: 'apply', skill_version: 'v1', executed: true, tokens: 1000, duration_ms: 500, rework_rounds: 2, human_intervention: false, friction_ref: 'none' };

  it('valid for complete 10-key record', () => {
    expect(validateMetricRecord(validRecord)).toEqual({ valid: true, missing: [] });
  });

  it('detects missing keys', () => {
    expect(validateMetricRecord({ execution_id: 'x' }).valid).toBe(false);
  });

  it('falsifiable: removing a key must be detected', () => {
    const { rework_rounds, ...partial } = validRecord;
    expect(validateMetricRecord(partial).valid).toBe(false);
  });
});
