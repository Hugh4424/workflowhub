const severities = new Set(["blocking", "major", "minor"]);
const evidenceKinds = new Set(["direct", "inferred", "machine"]);

function invalid(message) {
  const error = new Error(`OUTPUT_INVALID: ${message}`);
  error.code = "OUTPUT_INVALID";
  throw error;
}

function validateFinding(value, index, { requireEvidence }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`finding ${index} must be an object`);
  if (!severities.has(value.severity) || typeof value.path !== "string" || !value.path
      || value.path.startsWith("/") || value.path.includes("\\")
      || (value.line !== undefined && value.line !== null && (!Number.isSafeInteger(value.line) || value.line < 1))
      || typeof value.issue !== "string" || !value.issue.trim()
      || typeof value.recommendation !== "string" || !value.recommendation.trim()) invalid(`finding ${index} is invalid`);
  const needsEvidence = value.severity !== "minor";
  if (requireEvidence && needsEvidence
      && (!evidenceKinds.has(value.evidence_kind) || typeof value.evidence !== "string" || !value.evidence.trim()
        || typeof value.root_cause !== "string" || !value.root_cause.trim())) invalid(`finding ${index} evidence is invalid`);
  return {
    severity: value.severity, path: value.path, ...(Number.isSafeInteger(value.line) ? { line: value.line } : {}),
    issue: value.issue, recommendation: value.recommendation,
    ...(value.evidence_kind ? { evidence_kind: value.evidence_kind } : {}),
    ...(typeof value.evidence === "string" && value.evidence.trim() ? { evidence: value.evidence } : {}),
    ...(typeof value.root_cause === "string" && value.root_cause.trim() ? { root_cause: value.root_cause } : {}),
  };
}

function validate(value, options) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("provider output must be an object");
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "findings") invalid("provider output must contain only top-level findings");
  if (!Array.isArray(value.findings)) invalid("findings must be an array");
  const findings = value.findings.map((finding, index) => validateFinding(finding, index, options));
  return Object.freeze({ findings: Object.freeze(findings) });
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

function hasCompetingJsonObject(source, roots, outside = () => true) {
  return roots.some((span) => outside(span) && parseObject(source, span) !== null);
}

function hasInvalidJsonLikeObject(source, roots, unclosed, outside = () => true) {
  return roots.some((span) => outside(span) && jsonObjectStart(source, span.start) && parseObject(source, span) === null)
    || unclosed.some((start) => outside({ start, end: start + 1 }) && jsonObjectStart(source, start));
}

function terminalJsonAfterProse(raw) {
  const source = raw.trimEnd(); const { roots, unclosed } = objectSpans(source);
  const candidates = roots.filter(({ end }) => end === source.length)
    .map((span) => ({ ...span, value: parseObject(source, span) })).filter(({ value }) => value !== null);
  const terminal = candidates.length === 1 ? candidates[0] : null;
  if (!terminal || terminal.start === 0) return null;
  const prose = source.slice(0, terminal.start);
  if (/```/.test(prose)) return null;
  for (const span of roots) {
    if (span.end > terminal.start) continue;
    const value = parseObject(source, span);
    if (value === null && jsonObjectStart(source, span.start)) return null;
    if (value !== null) return null;
  }
  if (unclosed.some((start) => start < terminal.start && jsonObjectStart(source, start))) return null;
  return terminal.value;
}

export function parseReviewerOutput(raw, { requireEvidence = false } = {}) {
  if (typeof raw !== "string" || !raw.trim()) invalid("provider returned no text");
  const options = { requireEvidence };
  try { return validate(JSON.parse(raw.trim()), options); } catch (error) { if (error?.code === "OUTPUT_INVALID") throw error; }
  const fences = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  if (fences.length === 1) {
    const fence = fences[0]; const rangeStart = fence.index; const rangeEnd = rangeStart + fence[0].length;
    const scanned = objectSpans(raw); const outsideFence = ({ start, end }) => end <= rangeStart || start >= rangeEnd;
    const invalidFenceContext = ({ start, end }) => outsideFence({ start, end }) || (start < rangeStart && end > rangeEnd);
    if (hasInvalidJsonLikeObject(raw, scanned.roots, scanned.unclosed, invalidFenceContext)) invalid("fenced JSON has invalid JSON-like content outside the fence");
    if (hasCompetingJsonObject(raw, scanned.roots, outsideFence)) invalid("fenced JSON conflicts with another JSON object");
    let value; try { value = JSON.parse(fences[0][1].trim()); } catch { invalid("fenced block is not valid JSON"); }
    return validate(value, options);
  }
  const terminal = terminalJsonAfterProse(raw);
  if (terminal !== null) return validate(terminal, options);
  invalid("expected pure JSON, exactly one fenced JSON object, or one terminal JSON object after non-JSON prose");
}
