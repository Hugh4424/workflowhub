import { describe, it, expect } from 'vitest';
import { buildReviewFact, getWarnings } from '../workflows/build-code/facts-schema.mjs';

describe('buildReviewFact', () => {
  it('builds a valid facts.review object for executed/third_party/pass', () => {
    const fact = buildReviewFact({
      status: 'executed',
      source: 'third_party',
      verdict: 'pass',
      artifactPath: 'x.md',
    });
    expect(fact.status).toBe('executed');
    expect(fact.source).toBe('third_party');
    expect(fact.verdict).toBe('pass');
    expect(fact.artifact_path).toBe('x.md');
  });

  it('not_executed status omits source/verdict (may be undefined/null)', () => {
    const fact = buildReviewFact({ status: 'not_executed' });
    expect(fact.status).toBe('not_executed');
    // source and verdict may be omitted — falsy is acceptable
    expect(fact.source == null || fact.source === undefined).toBe(true);
    expect(fact.verdict == null || fact.verdict === undefined).toBe(true);
  });

  it('same_source is a legal D8 downgrade — source preserved, status stays executed', () => {
    const fact = buildReviewFact({
      status: 'executed',
      source: 'same_source',
      verdict: 'revise_required',
      artifactPath: 'y.md',
    });
    expect(fact.source).toBe('same_source');
    // status must NOT be changed to not_executed
    expect(fact.status).toBe('executed');
    expect(fact.verdict).toBe('revise_required');
    expect(fact.artifact_path).toBe('y.md');
  });

  it('not_executed fact may have empty/absent artifact_path (FR-REVIEW-004)', () => {
    const fact = buildReviewFact({ status: 'not_executed' });
    // artifact_path should be absent or empty string
    const ap = fact.artifact_path;
    expect(ap == null || ap === '' || ap === undefined).toBe(true);
  });

  it('invalid status value throws', () => {
    expect(() => buildReviewFact({ status: 'bogus' })).toThrow();
  });

  it('verdict not in allowed set throws', () => {
    expect(() =>
      buildReviewFact({
        status: 'executed',
        source: 'third_party',
        verdict: 'invalid_verdict',
        artifactPath: 'z.md',
      })
    ).toThrow();
  });

  it('executed without artifactPath throws (FR-REVIEW-005)', () => {
    expect(() =>
      buildReviewFact({ status: 'executed', source: 'third_party', verdict: 'pass' })
    ).toThrow();
  });

  it('executed with empty string artifactPath throws (FR-REVIEW-005)', () => {
    expect(() =>
      buildReviewFact({ status: 'executed', source: 'third_party', verdict: 'pass', artifactPath: '' })
    ).toThrow();
  });

  it('executed with real artifactPath does NOT throw (positive case)', () => {
    expect(() =>
      buildReviewFact({ status: 'executed', source: 'third_party', verdict: 'pass', artifactPath: 'review.md' })
    ).not.toThrow();
  });

  it('not_executed without artifactPath does NOT throw (FR-REVIEW-004 preserved)', () => {
    expect(() =>
      buildReviewFact({ status: 'not_executed' })
    ).not.toThrow();
  });
});

describe('getWarnings', () => {
  // FR-REVIEW-004 warning surfacing — CRITICAL falsifiable test.
  // This test goes RED if the warning-generation code is removed:
  // it asserts PRESENCE of a {type:'warning', message containing '审查未执行'} entry.
  it('not_executed fact produces a warning with type=warning and message containing 审查未执行', () => {
    const fact = buildReviewFact({ status: 'not_executed' });
    const warnings = getWarnings(fact);
    const match = warnings.find(
      (w) => w.type === 'warning' && w.message.includes('审查未执行')
    );
    expect(match).toBeDefined();
  });

  // Negative case: executed fact must NOT contain the 审查未执行 warning.
  // This prevents the test from passing if getWarnings always emits the warning.
  it('executed fact does NOT produce the 审查未执行 warning', () => {
    const fact = buildReviewFact({
      status: 'executed',
      source: 'third_party',
      verdict: 'pass',
      artifactPath: 'x.md',
    });
    const warnings = getWarnings(fact);
    const match = warnings.find(
      (w) => w.type === 'warning' && w.message.includes('审查未执行')
    );
    expect(match).toBeUndefined();
  });
});
