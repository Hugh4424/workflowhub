const REDACTED = "[REDACTED]";

function collectKnownSecrets(value, found = new Set()) {
  if (Array.isArray(value)) { for (const item of value) collectKnownSecrets(item, found); return found; }
  if (!value || typeof value !== "object") return found;
  for (const [key, item] of Object.entries(value)) {
    if (/runtime_id|session_id|raw_output|raw_ref|absolute_path|workspace/i.test(key) && typeof item === "string" && item.length >= 4) found.add(item);
    collectKnownSecrets(item, found);
  }
  return found;
}
function escaped(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function cleanString(value, knownSecrets) {
  let result = String(value);
  for (const secret of knownSecrets) result = result.replace(new RegExp(escaped(secret), "g"), REDACTED);
  result = result
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, REDACTED)
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, REDACTED)
    .replace(/\b(?:token|api[_-]?key|secret)\s*[:=]\s*[^\s,;]+/gi, REDACTED)
    .replace(/\braw(?:_output)?_ref\s*[:=]\s*[^\s,;]+/gi, REDACTED)
    .replace(/(^|[\s("'=:])\/(?:[^/\s]+\/)+[^\s,;)"']*/g, (_, prefix) => `${prefix}${REDACTED}`);
  return result;
}
function strings(values, secrets) { return Array.isArray(values) ? values.filter((item) => typeof item === "string").map((item) => cleanString(item, secrets)) : []; }
function intent(value, secrets) {
  if (!value || typeof value !== "object") return null;
  const projected = {};
  for (const key of ["task_id", "stage", "review_track", "review_flow_id", "business_round", "round_kind", "baseline_packet_hash", "contract_hash", "material_manifest_hash", "skill_bundle_hash", "idempotency_key", "previous_core_receipt_hash"]) {
    if (value[key] !== undefined) projected[key] = typeof value[key] === "string" ? cleanString(value[key], secrets) : value[key];
  }
  return projected;
}
function finding(value, secrets) {
  if (!value || typeof value !== "object") return null;
  const projected = {};
  for (const key of ["file", "rule_id", "severity", "issue", "evidence", "suggested_fix", "finding_id"]) if (typeof value[key] === "string") projected[key] = cleanString(value[key], secrets);
  if (Number.isInteger(value.line)) projected.line = value.line;
  if (typeof value.late_finding === "boolean") projected.late_finding = value.late_finding;
  if (value.status === "open" || value.status === "closed") projected.status = value.status;
  if (Array.isArray(value.providers)) projected.providers = strings(value.providers, secrets);
  if (Array.isArray(value.evidence_by_provider)) projected.evidence_by_provider = value.evidence_by_provider.map((item) => ({ provider: cleanString(item.provider ?? "", secrets), evidence: cleanString(item.evidence ?? "", secrets), suggested_fix: cleanString(item.suggested_fix ?? "", secrets), severity: cleanString(item.severity ?? "", secrets) }));
  return projected;
}
function checklist(value, secrets) { return { id: cleanString(value?.id ?? "", secrets), passed: value?.passed === true, evidence: cleanString(value?.evidence ?? "", secrets) }; }
function passItem(value, secrets) { return { rule_id: cleanString(value?.rule_id ?? "", secrets), artifact_anchor: cleanString(value?.artifact_anchor ?? "", secrets), evidence: cleanString(value?.evidence ?? "", secrets) }; }
function skillResult(value, secrets) { return { skill: cleanString(value?.skill ?? "", secrets), bundle_hash: cleanString(value?.bundle_hash ?? "", secrets), mode: value?.mode === "lens-only" ? "lens-only" : null, checked_objects: strings(value?.checked_objects, secrets), evidence: cleanString(value?.evidence ?? "", secrets), conclusion: cleanString(value?.conclusion ?? "", secrets) }; }
function providerOutcome(value, secrets) {
  const projected = {};
  for (const key of ["provider", "transport_status", "packet_status", "semantic_verdict", "cancel_source"]) if (value?.[key] !== undefined) projected[key] = value[key] === null ? null : cleanString(value[key], secrets);
  projected.business_valid = value?.business_valid === true;
  if (value?.requires_human_confirmation === true) projected.requires_human_confirmation = true;
  projected.findings = Array.isArray(value?.findings) ? value.findings.map((item) => finding(item, secrets)) : [];
  if (typeof value?.summary === "string") projected.summary = cleanString(value.summary, secrets);
  projected.checklist = Array.isArray(value?.checklist) ? value.checklist.map((item) => checklist(item, secrets)) : [];
  projected.pass_items = Array.isArray(value?.pass_items) ? value.pass_items.map((item) => passItem(item, secrets)) : [];
  projected.skillResults = Array.isArray(value?.skillResults) ? value.skillResults.map((item) => skillResult(item, secrets)) : [];
  return projected;
}

export function projectPublicReviewCore(value, { sensitiveSource = value } = {}) {
  const secrets = collectKnownSecrets(sensitiveSource);
  return {
    version: 1,
    intent: intent(value.intent, secrets),
    semantic_verdict: value.semantic_verdict ?? null,
    needs_human: value.needs_human === true,
    merged_findings: (value.merged_findings ?? []).map((item) => finding(item, secrets)),
    hard_gates: (value.hard_gates ?? []).map((item) => finding(item, secrets)),
    ...(Array.isArray(value.dispositions) ? { dispositions: value.dispositions.map((item) => ({ finding_id: cleanString(item?.finding_id ?? "", secrets), action: cleanString(item?.action ?? "", secrets), evidence: cleanString(item?.evidence ?? "", secrets) })) } : {}),
    ...(Array.isArray(value.human_gates) ? { human_gates: value.human_gates.map((item) => ({ provider: cleanString(item?.provider ?? "", secrets), verdict: cleanString(item?.verdict ?? "", secrets), summary: cleanString(item?.summary ?? "", secrets) })) } : {}),
    provider_outcomes: (value.provider_outcomes ?? []).map((item) => providerOutcome(item, secrets)),
  };
}
