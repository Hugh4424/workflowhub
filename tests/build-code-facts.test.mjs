import { describe, it, expect } from 'vitest';
import { validateFacts } from '../workflows/build-code/facts-schema.mjs';

const completeReview = {
  status: 'executed',
  source: 'third_party',
  verdict: 'pass',
  artifact_path: 'x.md',
};

const completeFacts = {
  changed: { files: ['a.ts'] },
  tests: { passed: true },
  review: completeReview,
};

describe('validateFacts', () => {
  it('complete C1 facts object is valid with empty missing', () => {
    const result = validateFacts(completeFacts);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('missing facts.changed → invalid with missing=[changed]', () => {
    const facts = { tests: completeFacts.tests, review: completeReview };
    const result = validateFacts(facts);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('changed');
  });

  it('missing facts.tests → invalid with missing=[tests]', () => {
    const facts = { changed: completeFacts.changed, review: completeReview };
    const result = validateFacts(facts);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('tests');
  });

  it('missing facts.review → invalid with missing=[review]', () => {
    const facts = { changed: completeFacts.changed, tests: completeFacts.tests };
    const result = validateFacts(facts);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('review');
  });

  it('review present but missing status field → invalid with missing=[review.status]', () => {
    const facts = {
      changed: completeFacts.changed,
      tests: completeFacts.tests,
      review: { source: 'third_party', verdict: 'pass', artifact_path: 'x.md' },
    };
    const result = validateFacts(facts);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('review.status');
  });

  it('complete three-key structure is valid (M9 can read directly)', () => {
    const facts = {
      changed: { summary: 'refactor' },
      tests: { coverage: 90 },
      review: { status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'r.md' },
    };
    const result = validateFacts(facts);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });
});
