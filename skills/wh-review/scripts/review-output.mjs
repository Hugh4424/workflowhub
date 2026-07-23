const verdicts = new Set(["pass", "revise_required"]);
const severities = new Set(["blocking", "major", "minor"]);
const evidenceKinds = new Set(["direct", "inferred", "machine"]);

function invalid(message) {
  const error = new Error(`OUTPUT_INVALID: ${message}`); error.code = "OUTPUT_INVALID"; throw error;
}

function validateFinding(value, index, { requireEvidence }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`finding ${index} must be an object`);
  if (!severities.has(value.severity)) invalid(`finding ${index} severity is invalid`);
  if (typeof value.path !== "string" || !value.path || value.path.startsWith("/") || value.path.includes("\\")) invalid(`finding ${index} path is invalid`);
  if (value.line !== undefined && value.line !== null && (!Number.isSafeInteger(value.line) || value.line < 1)) invalid(`finding ${index} line is invalid`);
  if (typeof value.issue !== "string" || !value.issue.trim()) invalid(`finding ${index} issue is required`);
  if (typeof value.recommendation !== "string" || !value.recommendation.trim()) invalid(`finding ${index} recommendation is required`);
  const needsEvidence = value.severity !== "minor";
  if (requireEvidence && needsEvidence && !evidenceKinds.has(value.evidence_kind)) invalid(`finding ${index} evidence_kind is required for major or blocking findings`);
  if (requireEvidence && needsEvidence && (typeof value.evidence !== "string" || !value.evidence.trim())) invalid(`finding ${index} evidence is required for major or blocking findings`);
  if (requireEvidence && needsEvidence && (typeof value.root_cause !== "string" || !value.root_cause.trim())) invalid(`finding ${index} root_cause is required for major or blocking findings`);
  if (!needsEvidence && value.evidence_kind !== undefined && !evidenceKinds.has(value.evidence_kind)) invalid(`finding ${index} evidence_kind is invalid`);
  return {
    severity: value.severity, path: value.path, ...(Number.isSafeInteger(value.line) ? { line: value.line } : {}),
    issue: value.issue, recommendation: value.recommendation,
    ...(value.evidence_kind ? { evidence_kind: value.evidence_kind } : {}),
    ...(typeof value.evidence === "string" && value.evidence.trim() ? { evidence: value.evidence } : {}),
    ...(typeof value.root_cause === "string" && value.root_cause.trim() ? { root_cause: value.root_cause } : {}),
  };
}

function validate(value, options) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !verdicts.has(value.verdict)) invalid("verdict is invalid");
  if (typeof value.summary !== "string" || !value.summary.trim()) invalid("summary is required");
  if (!Array.isArray(value.findings)) invalid("findings must be an array");
  const findings = value.findings.map((finding, index) => validateFinding(finding, index, options));
  if (value.verdict === "revise_required" && findings.length === 0) invalid("revise_required needs at least one finding");
  if (value.verdict === "pass" && findings.some((finding) => finding.severity !== "minor")) invalid("pass may contain only minor findings");
  return Object.freeze({ verdict: value.verdict, summary: value.summary, findings: Object.freeze(findings) });
}

export function parseReviewerOutput(raw, { requireEvidence = false } = {}) {
  if (typeof raw !== "string" || !raw.trim()) invalid("provider returned no text");
  const options = { requireEvidence };
  try { return validate(JSON.parse(raw.trim()), options); } catch (error) { if (error?.code === "OUTPUT_INVALID") throw error; }
  const fences = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  if (fences.length !== 1) invalid("expected pure JSON or exactly one fenced JSON object");
  let value; try { value = JSON.parse(fences[0][1].trim()); } catch { invalid("fenced block is not valid JSON"); }
  return validate(value, options);
}

export const FORMAT_CORRECTION_PROMPT = "Your previous final response had an invalid format. Do not repeat the review. Return only one JSON object with verdict, summary, and findings that matches review-instructions.md.";
