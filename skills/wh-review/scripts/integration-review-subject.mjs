import {
  buildIntegrationReviewSubject as buildRuntimeIntegrationReviewSubject,
  inspectIntegrationReviewSubject as inspectRuntimeIntegrationReviewSubject,
} from "../../../runtime/review/integration-review-subject.mjs";

const EXECUTED_ENTRY_POINT = "skills/wh-review/scripts/integration-review-subject.mjs";

function withExecutedEntryPoint(options = {}) {
  const existing = Array.isArray(options.executed_entry_points) ? options.executed_entry_points : [];
  return { ...options, executed_entry_points: [...existing, EXECUTED_ENTRY_POINT] };
}

export function buildIntegrationReviewSubject(options = {}) {
  return buildRuntimeIntegrationReviewSubject(withExecutedEntryPoint(options));
}

export function inspectIntegrationReviewSubject(options = {}) {
  return inspectRuntimeIntegrationReviewSubject(withExecutedEntryPoint(options));
}
