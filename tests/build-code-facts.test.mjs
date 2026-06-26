import { describe, it, expect } from 'vitest';
import { validateFacts } from '../workflows/build-code/facts-schema.mjs';

const completeReview = {
  status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'x.md',
};
const completeFacts = {
  changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview,
};

describe('validateFacts (C1 baseline — regression guard)', () => {
  it('complete C1 facts object is valid with empty missing', () => {
    const result = validateFacts(completeFacts);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });
  it('missing facts.changed → invalid', () => {
    expect(validateFacts({ tests: completeFacts.tests, review: completeReview }).valid).toBe(false);
  });
  it('missing facts.tests → invalid', () => {
    expect(validateFacts({ changed: completeFacts.changed, review: completeReview }).valid).toBe(false);
  });
  it('missing facts.review → invalid', () => {
    expect(validateFacts({ changed: completeFacts.changed, tests: completeFacts.tests }).valid).toBe(false);
  });
  it('review missing status → invalid', () => {
    const f = { changed: completeFacts.changed, tests: completeFacts.tests, review: { source: 'third_party', verdict: 'pass', artifact_path: 'x.md' } };
    expect(validateFacts(f).valid).toBe(false);
    expect(validateFacts(f).missing).toContain('review.status');
  });
  it('complete three-key structure is valid (M9 can read directly)', () => {
    expect(validateFacts({ changed: { summary: 'refactor' }, tests: { coverage: 90 }, review: { status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'r.md' } }).valid).toBe(true);
  });
});

describe('validateFacts — C1 command field (M9 optional)', () => {
  it('old M8 facts without command field → still valid (backward compat)', () => {
    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview };
    expect(validateFacts(facts).valid).toBe(true);
  });

  it('command field present with string type → valid', () => {
    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 'npx vitest run' }, review: completeReview };
    expect(validateFacts(facts).valid).toBe(true);
  });

  it('command field present but not string → invalid with missing=[tests.command]', () => {
    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 123 }, review: completeReview };
    const r = validateFacts(facts);
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('tests.command');
  });

  // Falsifiability: if command were made required (validation removed), old facts would break
  it('falsifiable: old M8 facts remain valid when command is absent', () => {
    const oldFacts = { changed: { files: ['old.ts'] }, tests: { passed: true }, review: { status: 'not_executed' } };
    expect(validateFacts(oldFacts).valid).toBe(true);
  });
});
