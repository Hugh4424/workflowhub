#!/usr/bin/env node
import fs from "node:fs";

const DECISIONS = new Set(["accept", "partial", "reject", "needs_human"]);

function trustedReplayBinding(trusted) {
  const result = trusted?.previousResult;
  const attempt = trusted?.previousAttempt;
  if (!result || !attempt || result.attempt_ref !== trusted.previousAttemptRef
      || attempt.task_id !== result.task_id || attempt.stage !== result.stage
      || attempt.review_track !== result.review_track || attempt.terminal_status !== "semantic") return null;
  const requestedProfiles = attempt.review_policy?.requested_profiles
    ?? [...new Set((attempt.provider_attempts ?? []).map(({ provider }) => provider))];
  const findingIds = new Set((result.adjudication?.clusters ?? []).map(({ id }) => id));
  const evidenceByFinding = new Map((result.adjudication?.clusters ?? []).map((cluster) => [
    cluster.id,
    (cluster.provider_findings ?? []).length > 0
      && cluster.provider_findings.every(({ evidence_anchor_valid: valid }) => valid === true),
  ]));
  return {
    previousResultRef: trusted.previousResultRef,
    requestedProfiles,
    findingIds,
    evidenceByFinding,
  };
}

export function validateReviewResponse(value, trusted = null) {
  const errors = [];
  if (!value?.finding_id) errors.push("finding_id required");
  if (!DECISIONS.has(value?.decision)) errors.push("invalid decision");
  if (["accept", "partial"].includes(value?.decision)) {
    for (const field of ["verification", "root_cause", "evidence", "rereview_flow_id"]) {
      if (!value?.[field]) errors.push(`${field} required for accepted finding`);
    }
  }
  if (value?.decision === "reject" && !value?.evidence) errors.push("evidence required for rejected finding");
  if (value?.replay !== undefined) {
    const replay = value.replay;
    const mismatch = (message) => errors.push(`REPLAY_MISMATCH: ${message}`);
    const binding = trustedReplayBinding(trusted);
    if (!replay || typeof replay !== "object" || Array.isArray(replay)) {
      mismatch("replay binding must be an object");
    } else if (binding === null) {
      mismatch("trusted prior attempt/result binding is required");
    } else {
      if (replay.previous_result_ref !== binding.previousResultRef
          || value.previous_result_ref !== binding.previousResultRef) mismatch("previous_result_ref differs from the persisted result");
      if (replay.finding_id !== value.finding_id || !binding.findingIds.has(value.finding_id)) mismatch("finding_id differs from the persisted finding");
      if (JSON.stringify(replay.requested_profiles) !== JSON.stringify(binding.requestedProfiles)) mismatch("requested_profiles differ from the persisted attempt");
      if (replay.evidence_anchor_valid !== binding.evidenceByFinding.get(value.finding_id)) mismatch("evidence anchor differs from the persisted aggregation");
    }
  }
  return { valid: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateReviewResponse(JSON.parse(fs.readFileSync(process.argv[2] || 0, "utf8")));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.valid) process.exitCode = 1;
}
