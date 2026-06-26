import { describe, it, expect } from 'vitest';
import { checkFreshness, getAnomalyFlagsText } from '../workflows/verify-code/freshness.mjs';

describe('checkFreshness', () => {
  it('should return empty anomaly_flags and warnings when sha matches', () => {
    const sha = 'a'.repeat(40);
    const result = checkFreshness(sha, sha);
    expect(result.anomaly_flags).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('should return stale_sha flag when sha does not match', () => {
    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
    expect(result.anomaly_flags).toContain('stale_sha');
  });

  it('should include warnings when anomaly_flags is non-empty', () => {
    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toHaveProperty('type', 'warning');
    expect(result.warnings[0]).toHaveProperty('message');
    expect(result.warnings[0].message).toContain('stale');
  });

  it('should never throw (F3 non-blocking)', () => {
    expect(() => checkFreshness('', '')).not.toThrow();
    expect(() => checkFreshness(null, undefined)).not.toThrow();
    expect(() => checkFreshness('abc', 'def')).not.toThrow();
  });

  it('should handle edge cases without throwing', () => {
    const r1 = checkFreshness(undefined, undefined);
    expect(Array.isArray(r1.anomaly_flags)).toBe(true);
    expect(Array.isArray(r1.warnings)).toBe(true);

    const r2 = checkFreshness(null, null);
    expect(Array.isArray(r2.anomaly_flags)).toBe(true);
    expect(Array.isArray(r2.warnings)).toBe(true);
  });
});

describe('getAnomalyFlagsText', () => {
  it('should return empty string for empty array', () => {
    expect(getAnomalyFlagsText([])).toBe('');
  });

  it('should format stale_sha flag', () => {
    const text = getAnomalyFlagsText(['stale_sha']);
    expect(text).toContain('stale_sha');
    expect(text.length).toBeGreaterThan(0);
  });

  it('should format multiple flags', () => {
    const text = getAnomalyFlagsText(['stale_sha', 'future_flag']);
    expect(text).toContain('stale_sha');
    expect(text).toContain('future_flag');
  });
});

// Falsifiability: if warnings generation is broken, this must catch it
describe('falsifiability guard', () => {
  it('warnings should be non-empty when anomaly_flags is non-empty (falsifiable)', () => {
    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
    // If someone comments out the warnings generation, this fails
    expect(result.anomaly_flags.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
