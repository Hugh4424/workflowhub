#!/usr/bin/env node
import fs from "node:fs";

export function validateDiagnosis(value) {
  const errors = [];
  if (!value?.reproduction) errors.push("reproduction required");
  if (!Array.isArray(value?.hypotheses) || value.hypotheses.length < 3 || value.hypotheses.length > 5) errors.push("3-5 hypotheses required");
  if (!value?.confirmed_root_cause) errors.push("confirmed_root_cause required before fix");
  if (!value?.probe_evidence) errors.push("probe_evidence required before fix");
  if (value?.fix && errors.length > 0) errors.push("fix forbidden without root-cause evidence");
  return { valid: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateDiagnosis(JSON.parse(fs.readFileSync(process.argv[2] || 0, "utf8")));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.valid) process.exitCode = 1;
}
