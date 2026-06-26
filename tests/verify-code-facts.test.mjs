import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readCommand, assembleStageResult, writeStageResult, validateMetricRecord } from '../workflows/verify-code/facts-assembly.mjs';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tmpDir;
beforeAll(() => { tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-facts-')); });
afterAll(() => { if (tmpDir) rmSync(tmpDir, { recursive: true, force: true }); });

describe('readCommand', () => {
  it('should return command string from facts.tests.command', () => {
    const cmd = readCommand({ facts: { tests: { command: 'npx vitest run' } } });
    expect(cmd).toBe('npx vitest run');
  });

  it('should throw when facts.tests.command is missing', () => {
    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/);
  });

  it('should throw with retryable=true when facts.tests is missing', () => {
    try {
      readCommand({ facts: {} });
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.message).toBeTruthy();
      expect(e.retryable).toBe(true);
    }
  });

  it('should throw when facts is missing', () => {
    expect(() => readCommand({})).toThrow();
  });
});

describe('assembleStageResult', () => {
  const baseOpts = { verdict: 'pass', evidenceRef: 'evidence/fresh-capture.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false };

  it('should return 7-key stage-result object', () => {
    const r = assembleStageResult(baseOpts);
    expect(r).toHaveProperty('verdict');
    expect(r).toHaveProperty('evidence_ref');
    expect(r).toHaveProperty('anomaly_flags');
    expect(r).toHaveProperty('missing_items');
    expect(r).toHaveProperty('user_decision');
    expect(r).toHaveProperty('reason');
    expect(r).toHaveProperty('error_code');
  });

  it('should preserve all passed values', () => {
    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: ['stale_sha'], missingItems: ['browser'], userDecision: true, reason: 'ok', errorCode: 'E1', retryable: false });
    expect(r.verdict).toBe('pass');
    expect(r.evidence_ref).toBe('ev/1.json');
    expect(r.anomaly_flags).toEqual(['stale_sha']);
    expect(r.missing_items).toEqual(['browser']);
    expect(r.user_decision).toBe(true);
    expect(r.reason).toBe('ok');
    expect(r.error_code).toBe('E1');
  });

  it('evidence_ref should be relative path without specs/{task-id}/ prefix', () => {
    const r = assembleStageResult({ ...baseOpts, evidenceRef: 'specs/m9/evidence/fresh-capture.json' });
    expect(r.evidence_ref).not.toContain('specs/');
    expect(r.evidence_ref).toBe('evidence/fresh-capture.json');
  });

  it('should handle minimal opts', () => {
    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    expect(r.verdict).toBe('pass');
  });

  // Falsifiability: delete user_decision field → test must fail
  it('user_decision must be present (falsifiable)', () => {
    const r = assembleStageResult(baseOpts);
    expect('user_decision' in r).toBe(true);
  });
});

describe('writeStageResult', () => {
  it('should write stage-result JSON to specs/{task-id}/ directory', () => {
    const result = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    writeStageResult(tmpDir, 'm9-test', result);
    const raw = readFileSync(join(tmpDir, 'stage-result-verify-code.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.verdict).toBe('pass');
  });

  it('should create directory if not exists', () => {
    const nested = join(tmpDir, 'nested-specs', 'm9-deep');
    const result = assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    writeStageResult(nested, 'm9-deep', result);
    const raw = readFileSync(join(nested, 'stage-result-verify-code.json'), 'utf-8');
    expect(JSON.parse(raw).verdict).toBe('pass');
  });
});

describe('validateMetricRecord', () => {
  const validRecord = {
    execution_id: 'exec-1', skill_or_stage: 'verify-code', stage: 'apply',
    skill_version: 'v1', executed: true, tokens: 1000, duration_ms: 500,
    rework_rounds: 2, human_intervention: false, friction_ref: 'none',
  };

  it('should return valid:true for complete 10-key record', () => {
    expect(validateMetricRecord(validRecord)).toEqual({ valid: true, missing: [] });
  });

  it('should detect missing keys', () => {
    const { execution_id, ...incomplete } = validRecord;
    const r = validateMetricRecord(incomplete);
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('execution_id');
  });

  it('should detect multiple missing keys', () => {
    const r = validateMetricRecord({ execution_id: 'x' });
    expect(r.valid).toBe(false);
    expect(r.missing.length).toBeGreaterThan(1);
  });

  // Falsifiability: delete one key → test must fail
  it('falsifiable: removing a key must be detected', () => {
    const { rework_rounds, ...partial } = validRecord;
    expect(validateMetricRecord(partial).valid).toBe(false);
  });
});
