/**
 * Check freshness by comparing build-code git_sha with current HEAD.
 * Pure function — no IO, no side effects. Never throws (F3 non-blocking).
 *
 * @param {string|null|undefined} buildSha — git_sha from build-code facts
 * @param {string|null|undefined} headSha — current HEAD git_sha
 * @returns {{ anomaly_flags: string[], warnings: Array<{type:string, message:string}> }}
 */
export function checkFreshness(buildSha, headSha) {
  const anomaly_flags = [];
  const warnings = [];

  const b = (buildSha || '').toString();
  const h = (headSha || '').toString();

  if (b !== h || !b || !h) {
    anomaly_flags.push('stale_sha');
  }

  if (anomaly_flags.length > 0) {
    warnings.push({
      type: 'warning',
      message: `stale_sha: build-code facts git_sha (${b || 'missing'}) does not match current HEAD (${h || 'missing'}) — verify-code results may not reflect latest code`,
    });
  }

  return { anomaly_flags, warnings };
}

/**
 * Format anomaly_flags array into a human-readable string.
 *
 * @param {string[]} anomaly_flags
 * @returns {string}
 */
export function getAnomalyFlagsText(anomaly_flags) {
  if (!anomaly_flags || anomaly_flags.length === 0) return '';
  return `⚠ Anomaly flags: ${anomaly_flags.join(', ')}`;
}

const FOUR_SEGMENT_KEYS = [
  { key: 'phaseReport', segment: 1, defaultFile: 'phase-N.md' },
  { key: 'redReport', segment: 2, defaultFile: 'RED-report.json' },
  { key: 'greenReport', segment: 3, defaultFile: 'GREEN-report.json' },
  { key: 'l2Report', segment: 4, defaultFile: 'l2-report.json' },
];

const FRESHNESS_MODES = new Set(['phase_tdd', 'final_verification']);

function normalizeSha(value) {
  return (value || '').toString();
}

function violation({ segment, file, reason, expectedSha, actualSha, expectedContentHash, actualContentHash }) {
  const record = {
    segment,
    file,
    reason,
    expected_sha: normalizeSha(expectedSha),
    actual_sha: normalizeSha(actualSha),
  };

  if (expectedContentHash !== undefined) {
    record.expected_content_hash = (expectedContentHash || '').toString();
  }
  if (actualContentHash !== undefined) {
    record.actual_content_hash = (actualContentHash || '').toString();
  }

  return record;
}

function reportSha(report) {
  return normalizeSha(report?.git_sha);
}

function reportHash(report) {
  return (report?.content_hash || '').toString();
}

function rawReportHash(report) {
  return report?.content_hash;
}

/**
 * Validate one evidence report against the current HEAD sha and, when supplied,
 * the expected content hash for that segment.
 *
 * @param {{segment:number|string,file:string,report:object|null|undefined,expectedSha:string,expectedContentHash?:string}} input
 * @returns {Array<{segment:number|string,file:string,reason:string,expected_sha:string,actual_sha:string}>}
 */
export function checkEvidenceSegment({ segment, file, report, expectedSha, expectedContentHash }) {
  const violations = [];
  const normalizedExpectedSha = normalizeSha(expectedSha);
  const actualSha = reportSha(report);

  if (!report) {
    violations.push(violation({
      segment,
      file,
      reason: 'missing_report',
      expectedSha,
      actualSha,
    }));
    return violations;
  }

  if (!normalizedExpectedSha) {
    violations.push(violation({
      segment,
      file,
      reason: 'missing_git_sha',
      expectedSha,
      actualSha,
    }));
  } else if (actualSha !== normalizedExpectedSha) {
    violations.push(violation({
      segment,
      file,
      reason: actualSha ? 'git_sha_mismatch' : 'missing_git_sha',
      expectedSha,
      actualSha,
    }));
  }

  const rawContentHash = rawReportHash(report);
  const actualContentHash = reportHash(report);
  // Treat null/undefined and the empty string as missing; other falsy-looking
  // values are stringified and compared normally.
  if (rawContentHash == null || rawContentHash === '') {
    violations.push(violation({
      segment,
      file,
      reason: 'missing_content_hash',
      expectedSha,
      actualSha,
      expectedContentHash,
      actualContentHash,
    }));
  } else if (
    expectedContentHash !== undefined &&
    actualContentHash !== (expectedContentHash || '').toString()
  ) {
    violations.push(violation({
      segment,
      file,
      reason: 'content_hash_mismatch',
      expectedSha,
      actualSha,
      expectedContentHash,
      actualContentHash,
    }));
  }

  return violations;
}

function checkEvidenceIntegrity({ segment, file, report, expectedContentHash }) {
  if (!report) {
    return [violation({ segment, file, reason: 'missing_report' })];
  }

  const violations = [];
  const actualSha = reportSha(report);
  if (!actualSha) {
    violations.push(violation({ segment, file, reason: 'missing_git_sha', actualSha }));
  }

  const rawContentHash = rawReportHash(report);
  const actualContentHash = reportHash(report);
  if (rawContentHash == null || rawContentHash === '') {
    violations.push(violation({
      segment,
      file,
      reason: 'missing_content_hash',
      actualSha,
      expectedContentHash,
      actualContentHash,
    }));
  } else if (
    expectedContentHash !== undefined &&
    actualContentHash !== String(expectedContentHash || '')
  ) {
    violations.push(violation({
      segment,
      file,
      reason: 'content_hash_mismatch',
      actualSha,
      expectedContentHash,
      actualContentHash,
    }));
  }
  return violations;
}

function checkLineage({ redReport, greenReport, currentSha, isAncestor, files }) {
  if (typeof isAncestor !== 'function') return [];
  const checks = [
    [reportSha(redReport), reportSha(greenReport), files[2] || 'RED-report.json'],
    [reportSha(greenReport), currentSha, files[3] || 'GREEN-report.json'],
  ];
  const violations = [];
  for (const [ancestor, descendant, file] of checks) {
    if (!ancestor || !descendant) continue;
    if (ancestor === descendant) continue;
    if (!isAncestor(ancestor, descendant)) {
      violations.push(violation({
        segment: 'tdd-lineage',
        file,
        reason: 'git_lineage_mismatch',
        expectedSha: descendant,
        actualSha: ancestor,
      }));
    }
  }
  return violations;
}

/**
 * Validate the four verify-code freshness segments plus the L3 iron-law report.
 *
 * Segment mapping:
 * 1 = phase-N.md
 * 2 = RED report
 * 3 = GREEN report
 * 4 = L2 report
 * "l3-iron" = l3-e2e-report.json git_sha iron-law
 *
 * `phase_tdd` validates each report against its historical segment SHA and may
 * validate RED -> GREEN ancestry. `final_verification` binds the final summary
 * and fresh L2 report to the captured temporary-index tree while retaining
 * RED/GREEN as hash-checked historical provenance.
 *
 * @param {object} input
 * @param {'phase_tdd'|'final_verification'} [input.mode]
 * @param {string} input.headSha
 * @param {string} [input.currentTreeSha]
 * @param {object|null|undefined} input.phaseReport
 * @param {object|null|undefined} input.redReport
 * @param {object|null|undefined} input.greenReport
 * @param {object|null|undefined} input.l2Report
 * @param {object|null|undefined} input.l3Report
 * @param {boolean} [input.noBrowserTest]
 * @param {boolean} [input.skipL3]
 * @param {Record<string,string>} [input.expectedContentHashes]
 * @param {Record<string,string>} [input.expectedSegmentShas]
 * @param {(ancestor:string,descendant:string)=>boolean} [input.isAncestor]
 * @param {Record<string,string>} [input.files]
 * @returns {{mtime_violations: Array<{segment:number|string,file:string,reason:string,expected_sha:string,actual_sha:string}>, informational: Array<{segment:string,file:string,reason:string}>}}
 */
export function checkEvidenceFreshness({
  mode = 'phase_tdd',
  headSha,
  currentTreeSha,
  phaseReport,
  redReport,
  greenReport,
  l2Report,
  l3Report,
  noBrowserTest = false,
  skipL3 = false,
  expectedContentHashes = {},
  expectedSegmentShas = {},
  isAncestor,
  files = {},
} = {}) {
  if (!FRESHNESS_MODES.has(mode)) {
    throw new TypeError(`unsupported freshness mode: ${mode}`);
  }
  const expectedSha = normalizeSha(currentTreeSha || headSha);
  const input = { phaseReport, redReport, greenReport, l2Report };
  const mtime_violations = [];
  const informational = [];

  for (const config of FOUR_SEGMENT_KEYS) {
    const file = files[config.segment] || config.defaultFile;
    if (mode === 'final_verification' && (config.segment === 2 || config.segment === 3)) {
      mtime_violations.push(...checkEvidenceIntegrity({
        segment: config.segment,
        file,
        report: input[config.key],
        expectedContentHash: expectedContentHashes[config.segment],
      }));
      continue;
    }
    const segmentSha = mode === 'phase_tdd'
      ? normalizeSha(expectedSegmentShas[config.segment])
      : expectedSha;
    mtime_violations.push(...checkEvidenceSegment({
      segment: config.segment,
      file,
      report: input[config.key],
      expectedSha: segmentSha,
      expectedContentHash: expectedContentHashes[config.segment],
    }));
  }

  mtime_violations.push(...checkLineage({
    redReport,
    greenReport,
    currentSha: mode === 'phase_tdd' ? reportSha(greenReport) : expectedSha,
    isAncestor,
    files,
  }));

  const l3File = files.l3 || 'l3-e2e-report.json';
  if (noBrowserTest || skipL3) {
    informational.push({
      segment: 'l3-iron',
      file: l3File,
      reason: 'intentional_skip',
    });
  } else {
    mtime_violations.push(
      ...checkL3IronLaw(l3Report, expectedSha, l3File).mtime_violations
    );
  }

  return { mtime_violations, informational };
}

/**
 * Enforce the L3 fresh rerun iron law: l3-e2e-report.json must come from the
 * current HEAD. This check is intentionally separate from the four L2/RED/GREEN
 * freshness segments.
 *
 * @param {object|null|undefined} l3Report
 * @param {string|null|undefined} headSha
 * @param {string} [file]
 * @returns {{mtime_violations: Array<{segment:string,file:string,reason:string,expected_sha:string,actual_sha:string}>}}
 */
export function checkL3IronLaw(l3Report, headSha, file = 'l3-e2e-report.json') {
  const expectedSha = normalizeSha(headSha);
  const actualSha = reportSha(l3Report);

  if (!l3Report) {
    return {
      mtime_violations: [violation({
        segment: 'l3-iron',
        file,
        reason: 'missing_report',
        expectedSha,
        actualSha,
      })],
    };
  }

  if (!expectedSha) {
    return {
      mtime_violations: [violation({
        segment: 'l3-iron',
        file,
        reason: 'missing_git_sha',
        expectedSha: headSha,
        actualSha,
      })],
    };
  }

  if (actualSha !== expectedSha) {
    return {
      mtime_violations: [violation({
        segment: 'l3-iron',
        file,
        reason: actualSha ? 'git_sha_mismatch' : 'missing_git_sha',
        expectedSha,
        actualSha,
      })],
    };
  }

  return { mtime_violations: [] };
}
