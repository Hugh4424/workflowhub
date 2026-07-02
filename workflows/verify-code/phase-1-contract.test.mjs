import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  checkEvidenceSegment,
  checkEvidenceFreshness,
  checkFreshness,
  checkL3IronLaw,
} from './freshness.mjs';

function assertContains(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} must include ${needle}`);
}

function runSkillContractAssertions() {
  const skill = readFileSync('skills/test-strategy/SKILL.md', 'utf8');

  assertContains(skill, 'ui_change', 'input contract');
  assertContains(skill, 'risk_level', 'input contract');
  assertContains(skill, 'low | medium | high', 'risk_level values');
  assertContains(skill, 'L2', 'input contract');
  assertContains(skill, 'test-strategy.md', 'output contract');
  assertContains(skill, 'YAML front-matter', 'output contract');
  assertContains(skill, 'ac_routes', 'output contract');
  assertContains(skill, '^AC-\\d+$', 'AC ID parser');
  assertContains(skill, 'P0 | P1 | P2 | P3 | skip', 'route values');
  assertContains(skill, 'MISSING_ROUTE: {AC_ID} has no route in test-strategy.md', 'missing route error');
  assertContains(skill, 'UNKNOWN_AC: {AC_ID} not found in spec AC list', 'unknown AC error');
  assertContains(skill, 'yellow', 'timeout behavior');
}

function runFreshnessAssertions() {
  assert.equal(typeof checkFreshness, 'function', 'legacy checkFreshness export is preserved');
  assert.equal(typeof checkEvidenceSegment, 'function', 'checkEvidenceSegment export exists');
  assert.equal(typeof checkEvidenceFreshness, 'function', 'checkEvidenceFreshness export exists');
  assert.equal(typeof checkL3IronLaw, 'function', 'checkL3IronLaw export exists');

  const headSha = 'abc123';
  const valid = {
    git_sha: headSha,
    content_hash: 'hash-ok',
  };

  const pass = checkEvidenceFreshness({
    headSha,
    phaseReport: valid,
    redReport: valid,
    greenReport: valid,
    l2Report: valid,
    l3Report: { git_sha: headSha },
    expectedContentHashes: {
      1: 'hash-ok',
      2: 'hash-ok',
      3: 'hash-ok',
      4: 'hash-ok',
    },
  });

  assert.deepEqual(pass.mtime_violations, [], 'valid four-segment + l3 reports must pass');

  const fail = checkEvidenceFreshness({
    headSha,
    phaseReport: valid,
    redReport: valid,
    greenReport: { git_sha: headSha, content_hash: 'old-green-hash' },
    l2Report: null,
    l3Report: { git_sha: 'old-sha' },
    expectedContentHashes: {
      1: 'hash-ok',
      2: 'hash-ok',
      3: 'new-green-hash',
      4: 'hash-ok',
    },
    files: {
      1: 'evidence/phase-1.md',
      2: 'evidence/phase-1-RED.json',
      3: 'evidence/phase-1-GREEN.json',
      4: 'evidence/l2-report.json',
      l3: 'evidence/l3-e2e-report.json',
    },
  });

  assert.deepEqual(
    fail.mtime_violations.map(v => v.segment),
    [3, 4, 'l3-iron'],
    'GREEN content_hash mismatch, missing L2, and stale L3 must be reported'
  );
  assert.deepEqual(
    fail.mtime_violations.map(v => v.reason),
    ['content_hash_mismatch', 'missing_report', 'git_sha_mismatch'],
    'violations must report stable reason codes'
  );

  for (const violation of fail.mtime_violations) {
    assert.ok('segment' in violation, 'violation includes segment');
    assert.ok('file' in violation, 'violation includes file');
    assert.ok('reason' in violation, 'violation includes reason');
    assert.ok('expected_sha' in violation, 'violation includes expected_sha');
    assert.ok('actual_sha' in violation, 'violation includes actual_sha');
  }

  const missingExpectedSha = checkEvidenceFreshness({
    headSha: null,
    phaseReport: { git_sha: null, content_hash: 'h' },
    redReport: { git_sha: null, content_hash: 'h' },
    greenReport: { git_sha: null, content_hash: 'h' },
    l2Report: { git_sha: null, content_hash: 'h' },
    l3Report: { git_sha: null },
    expectedContentHashes: {
      1: 'h',
      2: 'h',
      3: 'h',
      4: 'h',
    },
  });

  assert.ok(
    missingExpectedSha.mtime_violations.some(v => v.reason === 'missing_git_sha'),
    'missing expected headSha must produce at least one missing_git_sha violation'
  );

  const l3Only = checkL3IronLaw({ git_sha: 'old-sha' }, headSha, 'l3-e2e-report.json');
  assert.equal(l3Only.mtime_violations[0].segment, 'l3-iron', 'L3 iron-law uses dedicated segment');
}

runSkillContractAssertions();
runFreshnessAssertions();

console.log('Test Files 1 passed: phase-1 contract assertions');
