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
