import { resolveRequiredSkills } from "./required-skill-resolver.mjs";

const VALID_SEVERITIES = new Set(["blocking", "important", "minor"]);
const VALID_VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }

export function validateReviewerOutput({ stage, reviewTrack, ui = false, output } = {}) {
  const errors = [];
  const resolution = resolveRequiredSkills({ stage, reviewTrack, ui });
  if (!output || typeof output !== "object") return { valid: false, errors: ["output must be an object"] };
  if (!VALID_VERDICTS.has(output.verdict)) errors.push("invalid verdict");
  if (!Array.isArray(output.findings)) errors.push("findings must be an array");
  else output.findings.forEach((finding, index) => {
    if (!finding || typeof finding !== "object" || !nonEmpty(finding.file) || !Number.isInteger(finding.line) || !nonEmpty(finding.rule_id) || !VALID_SEVERITIES.has(finding.severity) || !nonEmpty(finding.issue) || !nonEmpty(finding.evidence) || !nonEmpty(finding.suggested_fix)) errors.push(`invalid finding: ${index}`);
  });
  if (!Array.isArray(output.checklist)) errors.push("checklist must be an array");
  else output.checklist.forEach((item, index) => {
    if (!item || typeof item !== "object" || !nonEmpty(item.id) || typeof item.passed !== "boolean" || !nonEmpty(item.evidence)) errors.push(`invalid checklist item: ${index}`);
  });
  if (!Array.isArray(output.skillResults)) errors.push("skillResults must be an array");
  const byName = new Map((output.skillResults ?? []).filter((item) => item && typeof item === "object").map((item) => [item.skill, item]));
  for (const definition of resolution.definitions) {
    const result = byName.get(definition.name);
    if (!result) { errors.push(`missing required skill result: ${definition.name}`); continue; }
    if (result.bundle_hash !== definition.bundle.sha256) errors.push(`invalid skill bundle hash: ${definition.name}`);
    if (result.mode !== "lens-only") errors.push(`invalid skill mode: ${definition.name}`);
    if (!Array.isArray(result.checked_objects) || result.checked_objects.length === 0 || result.checked_objects.some((value) => !nonEmpty(value))) errors.push(`missing checked objects: ${definition.name}`);
    if (!nonEmpty(result.evidence)) errors.push(`missing skill evidence: ${definition.name}`);
    if (!nonEmpty(result.conclusion)) errors.push(`missing skill conclusion: ${definition.name}`);
  }
  return { valid: errors.length === 0, errors, resolution };
}
