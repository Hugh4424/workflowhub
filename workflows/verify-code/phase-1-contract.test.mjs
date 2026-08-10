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
  const skill = readFileSync('workflows/verify-code/SKILL.md', 'utf8');

  assertContains(skill, '当前完整测试命令', 'verification input contract');
  assertContains(skill, '当前完整测试事实', 'full-suite reuse contract');
  assertContains(skill, '不要仅为制造绿色结果重新运行全量测试', 'full-suite repetition guard');
  assert.match(skill, /聚焦测试\s*由 build-code 负责/, 'focused-test ownership');
  assertContains(skill, '逐 AC 结果', 'verification output contract');
  assertContains(skill, '必须记录的质量事实', 'review boundary');
  assertContains(skill, '只返回 findings', 'findings-only contract');
  assert.match(skill, /`passed` 是最终交付结论，不是 provider 的/, 'verdict boundary');
  assert.match(skill, /不创建 another task 来绕过当前/, 'handoff boundary');
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
    mode: 'phase_tdd',
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
    expectedSegmentShas: { 1: headSha, 2: headSha, 3: headSha, 4: headSha },
  });

  assert.deepEqual(pass.mtime_violations, [], 'valid four-segment + l3 reports must pass');

  const fail = checkEvidenceFreshness({
    mode: 'final_verification',
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
    mode: 'final_verification',
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

  const historicalRedSha = 'red-commit';
  const historicalGreenSha = 'green-commit';
  const finalTreeSha = 'final-index-tree';
  const finalVerification = checkEvidenceFreshness({
    mode: 'final_verification',
    headSha: 'commit-head-is-not-the-index-tree',
    currentTreeSha: finalTreeSha,
    phaseReport: { git_sha: finalTreeSha, content_hash: 'final-summary' },
    redReport: { git_sha: historicalRedSha, content_hash: 'red-proof' },
    greenReport: { git_sha: historicalGreenSha, content_hash: 'green-proof' },
    l2Report: { git_sha: finalTreeSha, content_hash: 'fresh-suite' },
    l3Report: null,
    noBrowserTest: true,
    expectedContentHashes: {
      1: 'final-summary', 2: 'red-proof', 3: 'green-proof', 4: 'fresh-suite',
    },
    isAncestor: (ancestor, descendant) =>
      (ancestor === historicalRedSha && descendant === historicalGreenSha) ||
      (ancestor === historicalGreenSha && descendant === finalTreeSha),
  });
  assert.deepEqual(finalVerification.mtime_violations, [],
    'final verification accepts historical RED/GREEN provenance and binds final reports to temp-index tree');
  assert.deepEqual(finalVerification.informational, [{
    segment: 'l3-iron', file: 'l3-e2e-report.json', reason: 'intentional_skip',
  }], 'no_browser_test records missing L3 as intentional skip');

  const phaseTdd = checkEvidenceFreshness({
    mode: 'phase_tdd',
    headSha: finalTreeSha,
    phaseReport: { git_sha: historicalGreenSha, content_hash: 'phase' },
    redReport: { git_sha: historicalRedSha, content_hash: 'red' },
    greenReport: { git_sha: historicalGreenSha, content_hash: 'green' },
    l2Report: { git_sha: historicalGreenSha, content_hash: 'l2' },
    noBrowserTest: true,
    expectedSegmentShas: {
      1: historicalGreenSha, 2: historicalRedSha, 3: historicalGreenSha, 4: historicalGreenSha,
    },
    isAncestor: (ancestor, descendant) =>
      ancestor === historicalRedSha && descendant === historicalGreenSha,
  });
  assert.deepEqual(phaseTdd.mtime_violations, [],
    'phase_tdd validates historical segment identities without forcing final HEAD equality');

  const l3Only = checkL3IronLaw({ git_sha: 'old-sha' }, headSha, 'l3-e2e-report.json');
  assert.equal(l3Only.mtime_violations[0].segment, 'l3-iron', 'L3 iron-law uses dedicated segment');
}

runSkillContractAssertions();
runFreshnessAssertions();

console.log('Test Files 1 passed: phase-1 contract assertions');
