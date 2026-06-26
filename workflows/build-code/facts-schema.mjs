// facts-schema.mjs — pure ESM, no IO

const VALID_STATUSES = ['executed', 'not_executed'];
const VALID_SOURCES = ['third_party', 'same_source'];
const VALID_VERDICTS = ['pass', 'revise_required', 'escalate_to_human'];

export function validateFacts(facts) {
  const missing = [];
  for (const key of ['changed', 'tests', 'review']) {
    if (facts[key] == null) missing.push(key);
  }
  if (facts.review != null && facts.review.status == null) {
    missing.push('review.status');
  }
  // C1 (M9): command field is optional but if present must be string
  if (facts.tests != null && facts.tests.command !== undefined && typeof facts.tests.command !== 'string') {
    missing.push('tests.command');
  }
  return { valid: missing.length === 0, missing };
}

export function buildReviewFact({ status, source, verdict, artifactPath }) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  if (status === 'executed') {
    if (!VALID_SOURCES.includes(source)) {
      throw new Error(`Invalid source: ${source}`);
    }
    if (!VALID_VERDICTS.includes(verdict)) {
      throw new Error(`Invalid verdict: ${verdict}`);
    }
    if (!artifactPath) {
      throw new Error(`executed review requires a non-empty artifactPath`);
    }
    return { status, source, verdict, artifact_path: artifactPath };
  }
  return { status };
}

export function getWarnings(reviewFact) {
  if (reviewFact.status === 'not_executed') {
    return [{ type: 'warning', message: '审查未执行' }];
  }
  return [];
}
