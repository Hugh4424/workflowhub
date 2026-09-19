const severityAliases = new Map([
  ["blocking", "blocking"], ["blocker", "blocking"], ["critical", "blocking"], ["fatal", "blocking"],
  ["major", "major"], ["important", "major"], ["moderate", "major"], ["warning", "major"], ["significant", "major"],
  ["minor", "minor"], ["nit", "minor"], ["trivial", "minor"], ["suggestion", "minor"], ["info", "minor"], ["note", "minor"],
]);
const evidenceKinds = new Set(["direct", "inferred", "machine"]);
export const MAX_REVIEWER_OUTPUT_BYTES = 128 * 1024;

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

function freezeReview(findings, discardedFacts = []) {
  return Object.freeze({
    findings: Object.freeze(findings),
    ...(discardedFacts.length > 0 ? { discarded_facts: Object.freeze(discardedFacts) } : {}),
  });
}

function validate(value, options) {
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
  return freezeReview(findings, discardedFacts);
}

function jsonObjectStart(source, start) {
  let index = start + 1;
  while (index < source.length && " \t\n\r".includes(source[index])) index += 1;
  return source[index] === '"' || source[index] === "}";
}

function objectSpans(source) {
  const spans = []; const open = [];
  let quoted = false; let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (open.length === 0) {
      if (char === "{") open.push({ start: index, parentStart: null, jsonAware: jsonObjectStart(source, index) });
      continue;
    }
    const current = open.at(-1);
    if (!current.jsonAware) {
      if (char === "{") open.push({ start: index, parentStart: current.start, jsonAware: jsonObjectStart(source, index) });
      else if (char === "}") { const frame = open.pop(); spans.push({ start: frame.start, end: index + 1, parentStart: frame.parentStart }); }
      continue;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") open.push({ start: index, parentStart: current.start, jsonAware: jsonObjectStart(source, index) });
    else if (char === "}") { const frame = open.pop(); spans.push({ start: frame.start, end: index + 1, parentStart: frame.parentStart }); }
  }
  const starts = new Set(spans.map(({ start }) => start));
  return { roots: spans.filter(({ parentStart }) => !starts.has(parentStart)), unclosed: open.map(({ start }) => start) };
}

function parseObject(source, { start, end }) {
  try { return JSON.parse(source.slice(start, end)); } catch { return null; }
}

function rememberParseError(errors, message) {
  if (errors.length < 8) errors.push(safeParseError(message));
}

function validateCandidate(value, options, errors, label) {
  try { return validate(value, options); } catch (error) {
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

function firstJsonCandidate(raw, options, errors) {
  const { roots } = objectSpans(raw);
  for (const span of roots.sort((left, right) => left.start - right.start)) {
    if (span.start === 0 && raw.slice(span.end).trim()) {
      rememberParseError(errors, "JSON candidate has trailing non-JSON text");
      continue;
    }
    const value = parseObject(raw, span);
    if (value === null) {
      rememberParseError(errors, "JSON candidate is not valid JSON");
      continue;
    }
    const parsed = validateCandidate(value, options, errors, "JSON candidate");
    if (parsed) return parsed;
  }
  return null;
}

export function parseReviewerOutput(raw, { requireEvidence = false } = {}) {
  if (typeof raw !== "string" || !raw.trim()) invalid("provider returned no text");
  if (Buffer.byteLength(raw, "utf8") > MAX_REVIEWER_OUTPUT_BYTES) invalid(`provider output exceeds ${MAX_REVIEWER_OUTPUT_BYTES} bytes`);
  const options = { requireEvidence };
  const errors = [];
  const jsonl = parseJsonl(raw, options, errors);
  if (jsonl) return jsonl;
  const fenced = parseUniqueFence(raw, options, errors);
  if (fenced) return fenced;
  const candidate = firstJsonCandidate(raw, options, errors);
  if (candidate) return candidate;
  invalid("no valid JSON/fence findings candidate", errors.join("; ") || "no parseable JSON candidate");
}
