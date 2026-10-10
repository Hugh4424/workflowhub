const severityAliases = new Map([
  ["blocking", "blocking"], ["blocker", "blocking"], ["critical", "blocking"], ["fatal", "blocking"],
  ["major", "major"], ["important", "major"], ["moderate", "major"], ["warning", "major"], ["significant", "major"],
  ["minor", "minor"], ["nit", "minor"], ["trivial", "minor"], ["suggestion", "minor"], ["info", "minor"], ["note", "minor"],
]);
const evidenceKinds = new Set(["direct", "inferred", "machine"]);
export const MAX_REVIEWER_OUTPUT_BYTES = 16 * 1024 * 1024;

function safeParseError(value) {
  const message = typeof value === "string" ? value : value?.message;
  return (message || "reviewer output candidate is invalid").replace(/\s+/g, " ").slice(0, 256);
}

function invalid(message, parseError = message) {
  const error = new Error(`OUTPUT_INVALID: ${message}`);
  error.code = "OUTPUT_INVALID";
  error.parse_error = safeParseError(parseError);
  throw error;
}

function validateFinding(value, index, { requireEvidence }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`finding ${index} must be an object`);
  const severity = severityAliases.get(value.severity);
  if (!severity) return null;
  if (typeof value.path !== "string" || !value.path.trim()
      || value.path.startsWith("/") || value.path.includes("\\")
      || /^[a-z][a-z\d+.-]*:/i.test(value.path)
      || (value.line !== undefined && value.line !== null && (!Number.isSafeInteger(value.line) || value.line < 1))
      || typeof value.issue !== "string" || !value.issue.trim()
      || typeof value.recommendation !== "string" || !value.recommendation.trim()) invalid(`finding ${index} is invalid`);
  const needsEvidence = severity !== "minor";
  if (requireEvidence && needsEvidence
      && (!evidenceKinds.has(value.evidence_kind) || typeof value.evidence !== "string" || !value.evidence.trim()
        || typeof value.root_cause !== "string" || !value.root_cause.trim())) invalid(`finding ${index} evidence is invalid`);
  return {
    severity, path: value.path, ...(Number.isSafeInteger(value.line) ? { line: value.line } : {}),
    issue: value.issue, recommendation: value.recommendation,
    ...(value.evidence_kind ? { evidence_kind: value.evidence_kind } : {}),
    ...(typeof value.evidence === "string" && value.evidence.trim() ? { evidence: value.evidence } : {}),
    ...(typeof value.root_cause === "string" && value.root_cause.trim() ? { root_cause: value.root_cause } : {}),
  };
}

const MISSING_FINDINGS = Symbol("missing_findings");

function findNestedFindings(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return MISSING_FINDINGS;
  seen.add(value);
  if (!Array.isArray(value) && Object.hasOwn(value, "findings")) return value.findings;
  for (const child of Object.values(value)) {
    const findings = findNestedFindings(child, seen);
    if (findings !== MISSING_FINDINGS) return findings;
  }
  return MISSING_FINDINGS;
}

function freezeReview(findings, discardedFacts = [], parseRoute = null) {
  return Object.freeze({
    findings: Object.freeze(findings),
    ...(parseRoute ? { parse_route: parseRoute } : {}),
    ...(discardedFacts.length > 0 ? { discarded_facts: Object.freeze(discardedFacts) } : {}),
  });
}

function validate(value, options, parseRoute = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("provider output must be an object");
  const findingsValue = findNestedFindings(value);
  if (findingsValue === MISSING_FINDINGS) invalid("provider output must contain findings");
  if (!Array.isArray(findingsValue)) invalid("findings must be an array");
  const findings = [];
  const discardedFacts = [];
  findingsValue.forEach((finding, index) => {
    if (finding && typeof finding === "object" && !Array.isArray(finding) && !severityAliases.has(finding.severity)) {
      discardedFacts.push({
        fact_kind: "unknown_severity_finding_dropped",
        finding_excerpt: JSON.stringify({ severity: finding.severity ?? null, path: finding.path ?? null, line: finding.line ?? null, issue: finding.issue ?? null }),
        reason: "unknown_severity",
      });
    }
    const normalized = validateFinding(finding, index, options);
    if (normalized) findings.push(normalized);
  });
  return freezeReview(findings, discardedFacts, parseRoute);
}

function rememberParseError(errors, message) {
  if (errors.length < 8) errors.push(safeParseError(message));
}

function validateCandidate(value, options, errors, label, parseRoute = null) {
  try { return validate(value, options, parseRoute); } catch (error) {
    if (error?.code !== "OUTPUT_INVALID") throw error;
    rememberParseError(errors, `${label}: ${error.parse_error}`);
    return null;
  }
}

function parseJsonl(raw, options, errors) {
  let inFence = false; let validRows = 0; const findings = []; const discardedFacts = [];
  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence || !line.trim()) continue;
    let value;
    try { value = JSON.parse(line.trim()); } catch {
      rememberParseError(errors, "JSONL row is not valid JSON");
      continue;
    }
    const parsed = validateCandidate(value, options, errors, "JSONL row");
    if (!parsed) continue;
    validRows += 1;
    findings.push(...parsed.findings);
    discardedFacts.push(...(parsed.discarded_facts ?? []));
  }
  return validRows > 0 ? freezeReview(findings, discardedFacts) : null;
}

function parseUniqueFence(raw, options, errors) {
  const fences = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  const valid = [];
  for (const fence of fences) {
    let value;
    try { value = JSON.parse(fence[1].trim()); } catch {
      rememberParseError(errors, "fenced JSON is not valid JSON");
      continue;
    }
    const parsed = validateCandidate(value, options, errors, "fenced JSON");
    if (parsed) valid.push(parsed);
  }
  return valid.length === 1 ? valid[0] : null;
}

function embeddedObjectCandidates(raw) {
  const candidates = [];
  for (let start = 0; start < raw.length; start += 1) {
    if (raw[start] !== "{") continue;
    let depth = 0; let quoted = false; let escaped = false; let end = start;
    for (; end < raw.length; end += 1) {
      const character = raw[end];
      if (quoted) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') quoted = false;
      } else if (character === '"') quoted = true;
      else if (character === "{") depth += 1;
      else if (character === "}" && --depth === 0) break;
    }
    const closed = end < raw.length;
    candidates.push({ text: raw.slice(start, end + 1), start, end, closed });
    start = end;
  }
  return candidates;
}

function parseUniqueEmbeddedObject(raw, options, errors) {
  const candidates = embeddedObjectCandidates(raw);
  if (candidates.length === 0) return null;
  if (candidates.length > 1) {
    rememberParseError(errors, `embedded JSON object: ${candidates.length} candidates are ambiguous`);
    return null;
  }
  const candidate = candidates[0];
  let reason;
  if (!candidate.closed) reason = "is not a closed JSON object";
  else if (candidate.start === 0 || /\s$/.test(raw.slice(0, candidate.start))) reason = "is not glued to a prose prefix";
  else if (raw.slice(candidate.end + 1).trim()) reason = "is not the final content";
  if (reason) { rememberParseError(errors, `embedded JSON object ${reason}`); return null; }
  let value;
  try { value = JSON.parse(candidate.text); }
  catch { rememberParseError(errors, "embedded JSON object is not valid JSON"); return null; }
  return validateCandidate(value, options, errors, "embedded JSON object", "embedded_json");
}

export function parseReviewerOutput(raw, { requireEvidence = false } = {}) {
  if (typeof raw !== "string" || !raw.trim()) invalid("provider returned no text");
  if (Buffer.byteLength(raw, "utf8") > MAX_REVIEWER_OUTPUT_BYTES) invalid(`provider output exceeds ${MAX_REVIEWER_OUTPUT_BYTES} bytes`);
  const options = { requireEvidence };
  const errors = [];
  let whole;
  try { whole = JSON.parse(raw.trim()); } catch {
    rememberParseError(errors, "whole output is not JSON");
  }
  if (whole !== undefined) {
    const parsed = validateCandidate(whole, options, errors, "whole JSON");
    if (parsed) return parsed;
  }
  const jsonl = parseJsonl(raw, options, errors);
  if (jsonl) return jsonl;
  const fenced = parseUniqueFence(raw, options, errors);
  if (fenced) return fenced;
  const embedded = parseUniqueEmbeddedObject(raw, options, errors);
  if (embedded) return embedded;
  invalid("no valid JSON/fence/embedded findings candidate", errors.join("; ") || "no parseable JSON candidate");
}
