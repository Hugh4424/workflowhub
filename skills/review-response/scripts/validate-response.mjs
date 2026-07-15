#!/usr/bin/env node
import fs from "node:fs";

const DECISIONS = new Set(["accept", "partial", "reject", "needs_human"]);

export function validateReviewResponse(value) {
  const errors = [];
  if (!value?.finding_id) errors.push("finding_id required");
  if (!DECISIONS.has(value?.decision)) errors.push("invalid decision");
  if (["accept", "partial"].includes(value?.decision)) {
    for (const field of ["verification", "root_cause", "evidence", "rereview_flow_id"]) {
      if (!value?.[field]) errors.push(`${field} required for accepted finding`);
    }
  }
  if (value?.decision === "reject" && !value?.evidence) errors.push("evidence required for rejected finding");
  return { valid: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateReviewResponse(JSON.parse(fs.readFileSync(process.argv[2] || 0, "utf8")));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.valid) process.exitCode = 1;
}
