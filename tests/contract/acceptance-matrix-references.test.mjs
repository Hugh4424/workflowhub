// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
// Authored by build-plan before implementation. Encodes D-014 of
// specs/n7-route-delivery-closeout-experience-20261018/decision-log.md and AC-011 of the same task's spec.md Appendix A.
// Only the ORACLE-FIX-001 references are governed here; the wider staleness of the acceptance script is a recorded
// open item owned outside this task and is not silently rewritten by this test.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const MATRIX = 'tests/acceptance/card-03-current.mjs';
const DRIVER = 'tests/acceptance/card-03-current.test.mjs';
const MISSING = 'tests/contract/stage-reflection-e2e-constructed.test.mjs';
const read = path => (existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), 'utf8') : null);

describe('ORACLE-P5-ACCEPTANCE-MATRIX acceptance matrix reference integrity', () => {
  it('stops pointing the fix oracle at a file that does not exist', () => {
    for (const path of [MATRIX, DRIVER]) {
      const body = read(path);
      expect(body, `${path} must be readable`).not.toBeNull();
      expect(body.includes(MISSING), `${path} must not reference ${MISSING}`).toBe(false);
    }
  });

  it('either resolves the fix oracle to a real file or records it as uncovered', () => {
    const body = read(MATRIX) ?? '';
    const oracleLines = body.split('\n').filter(line => line.includes('ORACLE-FIX-001'));
    expect(oracleLines.length, 'the fix oracle keeps at least one matrix row').toBeGreaterThan(0);
    const referenced = new Set();
    for (const line of oracleLines) {
      for (const match of line.matchAll(/"((?:tests|core|runtime|skills)\/[^"]+)"/gu)) referenced.add(match[1]);
    }
    if (referenced.size === 0) {
      expect(body, 'an uncovered fix oracle must be declared as uncovered').toMatch(/ORACLE-FIX-001[^\n]*未覆盖/u);
      return;
    }
    const missing = [...referenced].filter(path => !existsSync(resolve(ROOT, path)));
    expect(missing, 'every file still referenced by the fix oracle must exist').toEqual([]);
  });

  it('keeps the driver and the matrix describing the same fix oracle target', () => {
    const driver = read(DRIVER) ?? '';
    const matrix = read(MATRIX) ?? '';
    expect(driver).toContain('ORACLE-FIX-001');
    expect(matrix).toContain('ORACLE-FIX-001');
    const driverTargets = new Set([...driver.matchAll(/"((?:tests)\/[^"]+test\.mjs)"/gu)].map(match => match[1]));
    const shared = [...driverTargets].filter(path => matrix.includes(path));
    expect(shared.length, 'the fix oracle target is named by both the driver and the matrix').toBeGreaterThan(0);
  });
});
