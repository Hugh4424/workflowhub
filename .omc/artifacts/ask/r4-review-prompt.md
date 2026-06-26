# External Review: evidence_ref Path Validation Fix

## Source Declaration

The following files are the complete scope of this review. No other files were modified.

1. `workflows/verify-code/facts-assembly.mjs` — validation logic for `evidence_ref` path sanitization
2. `tests/verify-code-facts.test.mjs` — test coverage for the above

## Review Request

Please review the evidence_ref path validation fix in `workflows/verify-code/facts-assembly.mjs` and its tests in `tests/verify-code-facts.test.mjs`.

### Checkpoints

1. **Absolute path rejection**: `evidenceRef.startsWith('/')` must throw with a clear error message containing "absolute".
2. **Path traversal rejection**: `evidenceRef.includes('../')` must throw with a clear error message containing "traversal".
3. **specs/ prefix rejection (existing)**: `evidenceRef.startsWith('specs/')` must throw with a clear error message containing "specs".
4. **Test coverage**: All three validations have dedicated test cases, plus positive cases for valid relative paths.
5. **Error message clarity**: Each validation produces a distinct, human-readable error indicating which rule was violated.

### File: workflows/verify-code/facts-assembly.mjs

```mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const METRIC_KEYS = [
  'execution_id', 'skill_or_stage', 'stage', 'skill_version',
  'executed', 'tokens', 'duration_ms', 'rework_rounds',
  'human_intervention', 'friction_ref',
];

export function readCommand(buildResult) {
  if (!buildResult.facts || !buildResult.facts.tests) {
    const err = new Error('facts.tests not found in build result');
    err.retryable = true;
    throw err;
  }
  const cmd = buildResult.facts.tests.command;
  if (!cmd) {
    const err = new Error('command field missing in facts.tests — build-code must include command in facts output');
    err.retryable = true;
    throw err;
  }
  if (typeof cmd !== 'string') {
    const err = new Error(`facts.tests.command must be a string, got ${typeof cmd}`);
    err.retryable = true;
    throw err;
  }
  return cmd;
}

export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable }) {
  // FR-PATH-003: evidence_ref must be relative path WITHOUT specs/{task-id}/ prefix
  if (evidenceRef.startsWith('/')) {
    throw new Error(`evidence_ref must be a relative path, absolute paths are not allowed, got: ${evidenceRef}`);
  }
  if (evidenceRef.includes('../')) {
    throw new Error(`evidence_ref must not contain path traversal (../), got: ${evidenceRef}`);
  }
  if (evidenceRef.startsWith('specs/')) {
    throw new Error(`evidence_ref must be a relative path without 'specs/{task-id}/' prefix, got: ${evidenceRef}`);
  }
  return {
    verdict,
    evidence_ref: evidenceRef,
    anomaly_flags: anomalyFlags,
    missing_items: missingItems,
    user_decision: userDecision,
    reason,
    error_code: errorCode,
  };
}

export function writeStageResult(taskSpecDir, result) {
  mkdirSync(taskSpecDir, { recursive: true });
  const path = join(taskSpecDir, 'stage-result-verify-code.json');
  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
}

export function validateMetricRecord(record) {
  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
  return { valid: missing.length === 0, missing };
}
```

### File: tests/verify-code-facts.test.mjs

```mjs
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
    expect(r.verdict).toBe('pass');
    expect(r.evidence_ref).toBe('evidence/fresh-capture.json');
    expect('user_decision' in r).toBe(true);
  });

  it('should preserve all passed values', () => {
    const r = assembleStageResult({ ...baseOpts, anomalyFlags: ['stale_sha'], userDecision: true });
    expect(r.anomaly_flags).toEqual(['stale_sha']);
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
    expect(r.evidence_ref).toBe('evidence/fresh-capture.json');
  });

  it('should accept valid relative path with ./ prefix', () => {
    const r = assembleStageResult({ ...baseOpts, evidenceRef: './evidence/fresh-capture.json' });
    expect(r.evidence_ref).toBe('./evidence/fresh-capture.json');
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
    expect(JSON.parse(raw).verdict).toBe('pass');
  });

  it('should create directory if not exists', () => {
    const nested = join(tmpDir, 'nested-specs', 'm9-deep');
    writeStageResult(nested, assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false }));
    expect(JSON.parse(readFileSync(join(nested, 'stage-result-verify-code.json'), 'utf-8')).verdict).toBe('pass');
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
```

### Test Run Output

```
 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/verify-code-facts.test.mjs (19 tests) 3ms

 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  18:33:36
   Duration  138ms (transform 10ms, setup 0ms, collect 10ms, tests 3ms, environment 0ms, prepare 25ms)
```

## Expected Behavior

- `evidence_ref` values starting with `/` are rejected with an error mentioning "absolute".
- `evidence_ref` values containing `../` are rejected with an error mentioning "traversal".
- `evidence_ref` values starting with `specs/` are rejected with an error mentioning "specs".
- Valid relative paths (e.g. `evidence/fresh-capture.json`, `./evidence/fresh-capture.json`) are accepted and returned in the stage result object.
- All 19 tests in the test file pass.
- Error messages are distinct and indicate which validation rule triggered the failure.
