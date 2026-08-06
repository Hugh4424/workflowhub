import { posix } from "node:path";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { createCanonicalReviewWriter } from "../../../runtime/evidence/canonical-receipt-writer.mjs";
import { aggregateCanonicalProviderResults } from "../../../runtime/review/canonical-review-result.mjs";

function safePart(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function providerFilePart(provider) {
  if (typeof provider !== "string" || provider.length === 0) throw new TypeError("provider is invalid");
  // Provider profile IDs intentionally use `adapter/profile`. Encode only the
  // filename component: records keep the original profile ID for attribution.
  return `p-${Buffer.from(provider, "utf8").toString("base64url")}`;
}

function normalizedIssue(value) {
  return value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}

function overlap(left, right) {
  const leftTerms = new Set(left); const rightTerms = new Set(right);
  if (!leftTerms.size || !rightTerms.size) return 0;
  let shared = 0;
  for (const item of leftTerms) if (rightTerms.has(item)) shared += 1;
  return shared / Math.min(leftTerms.size, rightTerms.size);
}

function findingKey(finding) {
  return `${finding.path}\u0000${finding.line ?? ""}\u0000${normalizedIssue(finding.issue).join(" ")}`;
}

function sameCluster(cluster, candidate) {
  const seed = cluster.members[0];
  if (seed.finding.path !== candidate.finding.path) return false;
  if (seed.finding.line !== undefined && candidate.finding.line !== undefined && seed.finding.line !== candidate.finding.line) return false;
  const left = normalizedIssue(seed.finding.issue); const right = normalizedIssue(candidate.finding.issue);
  return left.join(" ") === right.join(" ") || overlap(left, right) >= 0.7;
}

function severityOf(members) {
  if (members.some(({ finding }) => finding.severity === "blocking")) return "blocking";
  if (members.some(({ finding }) => finding.severity === "major")) return "major";
  return "minor";
}

function adapterOf(provider) { return provider.split("/", 1)[0]; }

function prioritizedValidResults(providerResults, profilePriority) {
  if (!Array.isArray(profilePriority) || profilePriority.some((provider) => typeof provider !== "string" || provider.length === 0)) {
    throw new TypeError("profilePriority must be a string array");
  }
  const priority = new Map(profilePriority.map((provider, index) => [provider, index]));
  const valid = providerResults.filter((item) => item?.review && ["pass", "revise_required"].includes(item.review.verdict));
  const byAdapter = new Map();
  for (let index = 0; index < valid.length; index += 1) {
    const candidate = valid[index]; const adapter = adapterOf(candidate.provider);
    const current = byAdapter.get(adapter);
    const candidatePriority = priority.get(candidate.provider) ?? Number.MAX_SAFE_INTEGER;
    const currentPriority = current ? (priority.get(current.item.provider) ?? Number.MAX_SAFE_INTEGER) : null;
    // Route order decides which profile represents an adapter. If a test
    // double or a non-conforming broker returns several successful profiles
    // for one CLI, only that representative contributes to quorum or verdict.
    if (!current || candidatePriority < currentPriority || (candidatePriority === currentPriority && index < current.index)) {
      byAdapter.set(adapter, { item: candidate, index });
    }
  }
  return [...byAdapter.values()].map(({ item }) => item)
    .sort((left, right) => left.provider.localeCompare(right.provider));
}

function clusterRecord(cluster) {
  const members = [...cluster.members].sort((left, right) => left.provider.localeCompare(right.provider) || left.index - right.index);
  const severity = severityOf(members);
  const validDirect = members.filter(({ finding, anchorValid }) =>
    ["direct", "machine"].includes(finding.evidence_kind) && anchorValid !== false);
  const inferredAdapters = new Set(members.filter(({ finding }) => finding.evidence_kind === "inferred").map(({ adapter }) => adapter));
  const id = `F-${createHash("sha256").update(findingKey(members[0].finding)).digest("hex").slice(0, 12)}`;
  let disposition = "nonblocking_minor"; let evidenceStatus = "minor";
  if (severity !== "minor") {
    if (validDirect.length > 0) { disposition = "actionable"; evidenceStatus = "direct"; }
    else if (inferredAdapters.size >= 2) { disposition = "actionable"; evidenceStatus = "corroborated_inference"; }
    else if (members.some(({ finding, anchorValid }) => ["direct", "machine"].includes(finding.evidence_kind) && anchorValid === false)) {
      disposition = "invalid_evidence"; evidenceStatus = "invalid_anchor";
    } else { disposition = "needs_corroboration"; evidenceStatus = "single_inference"; }
  }
  const representative = members[0].finding;
  return {
    id, severity, path: representative.path, ...(representative.line ? { line: representative.line } : {}),
    issue: representative.issue, root_cause: representative.root_cause ?? representative.issue, recommendation: representative.recommendation,
    providers: [...new Set(members.map(({ provider }) => provider))], adapter_count: new Set(members.map(({ adapter }) => adapter)).size,
    finding_count: members.length, disposition, evidence_status: evidenceStatus,
    provider_findings: members.map(({ provider, adapter, finding, anchorValid }) => ({
      provider, adapter, severity: finding.severity, evidence_kind: finding.evidence_kind ?? "unspecified",
      evidence_anchor_valid: anchorValid !== false,
    })),
  };
}

function adjudicate(valid) {
  const candidates = valid.flatMap((item) => item.review.findings.map((finding, index) => ({
    provider: item.provider, adapter: adapterOf(item.provider), finding, index, anchorValid: item.evidenceAnchors?.[index] ?? true,
  }))).sort((left, right) => findingKey(left.finding).localeCompare(findingKey(right.finding)) || left.provider.localeCompare(right.provider) || left.index - right.index);
  const grouped = [];
  for (const candidate of candidates) {
    const cluster = grouped.find((current) => sameCluster(current, candidate));
    if (cluster) cluster.members.push(candidate);
    else grouped.push({ members: [candidate] });
  }
  const clusters = grouped.map(clusterRecord).sort((left, right) => left.id.localeCompare(right.id));
  const actionable = clusters.filter(({ disposition }) => disposition === "actionable");
  const reportFindings = clusters.filter(({ disposition, severity }) => disposition === "actionable" || severity === "minor");
  return { version: "wh-review-adjudication.v1", clusters, actionable, reportFindings };
}

export function aggregateProviderResults(providerResults, minimumReviewers = 1, { profilePriority = [] } = {}) {
  return aggregateCanonicalProviderResults(providerResults, minimumReviewers, { profilePriority });
}

const DISPOSITION_DECISIONS = new Set(["accept", "partial", "reject", "needs_human"]);

// A disposition is the smallest durable fact needed after a finding is
// consumed. Replay bindings, repair flow, and re-review orchestration belong
// to the wh-review controller and are deliberately not part of this contract.
export function validateReviewDisposition(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: ["disposition must be an object"] };
  }
  if (typeof value.finding_id !== "string" || value.finding_id.trim() === "") errors.push("finding_id required");
  if (!DISPOSITION_DECISIONS.has(value.decision)) errors.push("invalid decision");
  if (["accept", "partial"].includes(value.decision)) {
    for (const field of ["verification", "root_cause", "evidence", "rereview_flow_id"]) {
      if (typeof value[field] !== "string" || value[field].trim() === "") errors.push(`${field} required for accepted finding`);
    }
  }
  if (value.decision === "reject" && (typeof value.evidence !== "string" || value.evidence.trim() === "")) {
    errors.push("evidence required for rejected finding");
  }
  return { valid: errors.length === 0, errors };
}

export function reviewRefs({ attemptId, stage, reviewTrack, snapshotTree, root = "quality/reviews" }) {
  const id = safePart(attemptId, "attemptId");
  const track = reviewTrack ?? "default";
  const reviewRoot = "quality/reviews";
  const attemptDirectoryRef = posix.join(reviewRoot, "attempts", id);
  const resultName = `${safePart(stage, "stage")}-${safePart(track, "reviewTrack")}-${safePart(snapshotTree, "snapshotTree")}-${id}.json`;
  return {
    attemptRef: posix.join(attemptDirectoryRef, "attempt.json"),
    providerDirectoryRef: posix.join(attemptDirectoryRef, "providers"),
    resultRef: posix.join(reviewRoot, "results", resultName),
    reportRef: posix.join(reviewRoot, "reports", `${id}.md`),
  };
}

export function writeProviderOutput(task, directoryRef, provider, output, sequence = 1, provenance = {}) {
  if (typeof output !== "string") return null;
  const suffix = sequence === 1 ? "" : `-${sequence}`;
  const ref = posix.join(directoryRef, `${providerFilePart(provider)}${suffix}.output.json`);
  const safeTask = assertTaskHandle(task);
  return createCanonicalReviewWriter({ task: safeTask, taskId: provenance.taskId, stage: provenance.stage }).writeProviderOutput(ref, output, { provider });
}

export function writeAttempt(task, ref, attempt) {
  for (const providerAttempt of attempt?.provider_attempts ?? []) {
    if (Object.hasOwn(providerAttempt, "session_artifact_path")) {
      throw new TypeError("session_artifact_path is legacy-only and cannot be written by managed wh-review");
    }
    if (Object.hasOwn(providerAttempt?.execution ?? {}, "session_file_path") ||
        Object.hasOwn(providerAttempt?.execution ?? {}, "raw_output_ref")) {
      throw new TypeError("broker private session/output fields cannot be written by managed wh-review");
    }
  }
  const safeTask = assertTaskHandle(task);
  return createCanonicalReviewWriter({ task: safeTask, taskId: attempt?.task_id, stage: attempt?.stage }).writeAttempt(ref, attempt);
}

export function writeSemanticResult(task, ref, result) {
  const safeTask = assertTaskHandle(task);
  return createCanonicalReviewWriter({ task: safeTask, taskId: result?.task_id, stage: result?.stage }).writeResult(ref, result);
}

function markdown(value) { return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " "); }

function tokenUsage(usage) {
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) return "TOKENS_UNAVAILABLE";
  const aliases = [
    ["input", ["input_tokens", "inputTokens", "prompt_tokens", "promptTokens"]],
    ["output", ["output_tokens", "outputTokens", "completion_tokens", "completionTokens"]],
    ["total", ["total_tokens", "totalTokens"]],
  ];
  const values = aliases.flatMap(([label, keys]) => {
    const key = keys.find((candidate) => Number.isSafeInteger(usage[candidate]) && usage[candidate] >= 0);
    return key ? [`${label}=${usage[key]}`] : [];
  });
  return values.length ? values.join(", ") : markdown(JSON.stringify(usage));
}

function latestAttempts(attempt) {
  const latest = new Map();
  for (const providerAttempt of attempt.provider_attempts ?? []) latest.set(providerAttempt.provider, providerAttempt);
  return [...latest.values()].sort((left, right) => left.provider.localeCompare(right.provider));
}

const REVIEW_ROUNDS = new Set(["initial", "incremental", "closure", "full", "legacy"]);
const FAILURE_CATEGORIES = Object.freeze({
  completed: "completed",
  OUTPUT_INVALID: "output_invalid",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  TIMEOUT: "timeout",
  SAME_SOURCE: "same_source",
  PUBLIC_RESULT_INVALID: "public_result_invalid",
  PROTOCOL_INCOMPATIBLE: "protocol_incompatible",
  MATERIAL_INCOMPLETE: "material_incomplete",
  PROFILE_MISMATCH: "profile_mismatch",
  UNKNOWN: "unknown",
});

// These are transport/protocol facts, not semantic review findings. Keep them
// distinct so a public-result safety failure is diagnosable instead of being
// collapsed into UNKNOWN in the report.
const ATTEMPT_CLASS_CODES = new Set([
  "OUTPUT_INVALID",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "SAME_SOURCE",
  "PUBLIC_RESULT_INVALID",
  "PROTOCOL_INCOMPATIBLE",
  "MATERIAL_INCOMPLETE",
  "PROFILE_MISMATCH",
]);

export function classifyAttempt(providerAttempt) {
  const taxonomy = classifyAttemptTaxonomy(providerAttempt);
  return taxonomy.category === "unknown" ? "UNKNOWN" : taxonomy.code;
}

export function classifyAttemptTaxonomy(providerAttempt) {
  const rawCode = providerAttempt?.error?.code ?? (providerAttempt?.status === "completed" ? "completed" : null);
  const code = typeof rawCode === "string" && rawCode.length > 0 ? rawCode : "UNKNOWN";
  return Object.freeze({ code, category: FAILURE_CATEGORIES[code] ?? "unknown" });
}

export function classifyFinding(cluster) {
  if (cluster?.disposition === "invalid_evidence" || cluster?.evidence_status === "invalid_anchor") return "invalid_anchor";
  if (cluster?.disposition === "nonblocking_minor") return "minor";
  if (cluster?.disposition === "actionable") return "valid";
  return "not_adopted";
}

export function classificationSummary(attempt, result = null) {
  const providerAttempts = Array.isArray(attempt?.provider_attempts) ? attempt.provider_attempts : [];
  const attemptBuckets = Object.fromEntries(["completed", ...ATTEMPT_CLASS_CODES, "UNKNOWN"].map((key) => [key, 0]));
  const failureTaxonomy = {};
  let failedDurationMs = 0;
  for (const providerAttempt of providerAttempts) {
    const taxonomy = classifyAttemptTaxonomy(providerAttempt);
    const bucket = classifyAttempt(providerAttempt);
    attemptBuckets[bucket] += 1;
    failureTaxonomy[bucket] = { code: taxonomy.code, category: taxonomy.category, count: (failureTaxonomy[bucket]?.count ?? 0) + 1 };
    const duration = providerAttempt.execution?.timing?.duration_ms;
    if (bucket !== "completed" && Number.isFinite(duration)) failedDurationMs += duration;
  }
  const providerCounts = new Map();
  for (const providerAttempt of providerAttempts) providerCounts.set(providerAttempt.provider, (providerCounts.get(providerAttempt.provider) ?? 0) + 1);
  const findingBuckets = Object.fromEntries(["valid", "invalid_anchor", "minor", "not_adopted"].map((key) => [key, 0]));
  for (const cluster of result?.adjudication?.clusters ?? []) findingBuckets[classifyFinding(cluster)] += 1;
  return {
    attempt: attemptBuckets,
    provider_attempt_count: providerAttempts.length,
    retry_count: [...providerCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    failure_taxonomy: failureTaxonomy,
    finding: findingBuckets,
    failed_duration_ms: failedDurationMs,
    quality_denominator: providerAttempts.filter((entry) => classifyAttempt(entry) === "completed" && entry.error == null).length,
  };
}

export function validateReviewLineage(value, label = "review lineage") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const allowed = new Set(["request_id", "prompt_hash", "round", "prior_attempt_refs", "prior_runtime_ids", "correction_ref", "dispatch_sequence"]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unsupported fields: ${unknown.join(", ")}`);
  if (typeof value.request_id !== "string" || value.request_id.trim() === "") throw new TypeError(`${label}.request_id is required`);
  if (!/^[a-f0-9]{64}$/.test(value.prompt_hash ?? "")) throw new TypeError(`${label}.prompt_hash must be sha256`);
  if (!REVIEW_ROUNDS.has(value.round)) throw new TypeError(`${label}.round is invalid`);
  const refPattern = /^(?:quality\/reviews|reviews)\/attempts\/[A-Za-z0-9._-]+\/attempt\.json$/;
  if (!Array.isArray(value.prior_attempt_refs) || value.prior_attempt_refs.some((ref) => typeof ref !== "string" || !refPattern.test(ref))) {
    throw new TypeError(`${label}.prior_attempt_refs must contain canonical attempt refs`);
  }
  if (!value.prior_runtime_ids || typeof value.prior_runtime_ids !== "object" || Array.isArray(value.prior_runtime_ids)
      || Object.values(value.prior_runtime_ids).some((runtimeId) => runtimeId !== null && (typeof runtimeId !== "string" || runtimeId.trim() === ""))) {
    throw new TypeError(`${label}.prior_runtime_ids must be a provider-to-runtime map`);
  }
  if (value.correction_ref !== null && !refPattern.test(value.correction_ref ?? "")) throw new TypeError(`${label}.correction_ref must be null or a canonical attempt ref`);
  if (!Number.isSafeInteger(value.dispatch_sequence) || value.dispatch_sequence < 0) throw new TypeError(`${label}.dispatch_sequence must be a non-negative integer`);
  return Object.freeze({
    request_id: value.request_id,
    prompt_hash: value.prompt_hash,
    round: value.round,
    prior_attempt_refs: Object.freeze([...value.prior_attempt_refs]),
    prior_runtime_ids: Object.freeze({ ...value.prior_runtime_ids }),
    correction_ref: value.correction_ref,
    dispatch_sequence: value.dispatch_sequence,
  });
}

export function createReviewLineage({ requestId, promptHash, round, priorAttemptRefs = [], priorRuntimeIds = {}, correctionRef = null, dispatchSequence = 0 } = {}) {
  return validateReviewLineage({
    request_id: requestId,
    prompt_hash: promptHash,
    round,
    prior_attempt_refs: priorAttemptRefs,
    prior_runtime_ids: priorRuntimeIds,
    correction_ref: correctionRef,
    dispatch_sequence: dispatchSequence,
  });
}

export function aggregateReviewMetrics(attempts = []) {
  const records = Array.isArray(attempts) ? attempts : [attempts];
  const failureTaxonomy = {};
  let providerAttemptCount = 0;
  let retryCount = 0;
  let correctionCount = 0;
  let failedDurationMs = 0;
  for (const record of records) {
    const summary = classificationSummary(record);
    providerAttemptCount += summary.provider_attempt_count;
    retryCount += summary.retry_count;
    if (record?.lineage?.correction_ref !== null && record?.lineage?.correction_ref !== undefined) correctionCount += 1;
    failedDurationMs += summary.failed_duration_ms;
    for (const [code, entry] of Object.entries(summary.failure_taxonomy)) {
      failureTaxonomy[code] = { code: entry.code, category: entry.category, count: (failureTaxonomy[code]?.count ?? 0) + entry.count };
    }
  }
  return {
    attempt_count: records.length,
    provider_attempt_count: providerAttemptCount,
    retry_count: retryCount,
    correction_count: correctionCount,
    failed_duration_ms: failedDurationMs,
    failure_taxonomy: failureTaxonomy,
  };
}

export function renderReviewReport({ attempt, result = null }) {
  const lines = [
    `# wh-review report — ${attempt.stage}`,
    "",
    `- attempt: \`${attempt.attempt_id}\``,
    `- task: \`${attempt.task_id}\``,
    `- subject: \`${attempt.subject_kind}${attempt.phase_id ? `/${attempt.phase_id}` : ""}\``,
    `- snapshot: \`${attempt.snapshot_tree}\``,
    `- material: \`${attempt.material_id}\``,
    `- terminal status: \`${attempt.terminal_status}\``,
    `- verdict: \`${result?.verdict ?? "unavailable"}\``,
    "",
    "## Routing and coverage",
    "",
  ];
  if (attempt.review_policy) {
    lines.push(`- policy: \`${attempt.review_policy.source}/${attempt.review_policy.round}\`; configured mode \`${attempt.review_policy.mode}\``);
    lines.push(`- requested profiles: ${attempt.review_policy.requested_profiles.map((profile) => `\`${profile}\``).join(", ") || "none"}`);
    const pins = attempt.review_policy.requested_profile_specs ?? [];
    if (pins.length > 0) lines.push(`- requested profile pins: ${pins.map((profile) => `\`${profile.provider}\` priority=${profile.priority}; model=${profile.model ?? "null"}; effort=${profile.effort ?? "null"}; thinking=${profile.thinking ?? "null"}`).join(" | ")}`);
    lines.push(`- eligible profiles: ${attempt.review_policy.eligible_profiles.map((profile) => `\`${profile}\``).join(", ") || "none"}`);
    lines.push(`- same-source exclusions: ${attempt.review_policy.same_source_exclusions.map((profile) => `\`${profile}\``).join(", ") || "none"}`);
  }
  if (attempt.coverage) lines.push(`- coverage: \`${attempt.coverage.mode}\`; ${attempt.coverage.valid_provider_count}/${attempt.coverage.minimum_required} valid reviewers`);
  const classification = classificationSummary(attempt, result);
  lines.push(`- attempt classification: ${Object.entries(classification.attempt).map(([key, value]) => `${key}=${value}`).join(", ")}`);
  lines.push(`- finding classification: ${Object.entries(classification.finding).map(([key, value]) => `${key}=${value}`).join(", ")}; quality denominator=${classification.quality_denominator}; failed duration=${classification.failed_duration_ms} ms`);
  lines.push("", "## Provider runs", "", "| Provider | Model / thinking | Duration | Token usage | Runtime / session state | Status |", "| --- | --- | ---: | --- | --- | --- |");
  for (const providerAttempt of latestAttempts(attempt)) {
    const execution = providerAttempt.execution;
    const model = execution ? `${execution.adapter}/${execution.model ?? "MODEL_UNAVAILABLE"}; effort=${execution.effort ?? "UNAVAILABLE"}; thinking=${execution.thinking ?? "UNAVAILABLE"}` : "EXECUTION_UNAVAILABLE";
    const duration = execution?.timing?.duration_ms ?? "UNAVAILABLE";
    const usage = tokenUsage(execution?.usage);
    const runtime = execution?.runtime_id ?? providerAttempt.runtime_id ?? "UNAVAILABLE";
    const session = providerAttempt.session_id ?? "SESSION_UNAVAILABLE";
    lines.push(`| ${markdown(providerAttempt.provider)} | ${markdown(model)} | ${duration} ms | ${usage} | ${markdown(runtime)}/${markdown(session)}; state=SESSION_PATH_UNAVAILABLE | ${providerAttempt.status}${providerAttempt.error ? ` (${markdown(providerAttempt.error.code)})` : ""} |`);
  }
  const diagnostics = latestAttempts(attempt).filter((providerAttempt) => providerAttempt.unavailable_diagnostics !== null && providerAttempt.unavailable_diagnostics !== undefined);
  if (diagnostics.length > 0) {
    lines.push("", "Provider unavailable diagnostics:");
    for (const providerAttempt of diagnostics) {
      const diagnostic = providerAttempt.unavailable_diagnostics;
      lines.push(`- ${markdown(providerAttempt.provider)}: ${markdown(diagnostic.code)} — ${markdown(diagnostic.message ?? "message unavailable")}`);
    }
  }
  lines.push("", "## Findings and adjudication", "");
  const clusters = result?.adjudication?.clusters ?? [];
  if (clusters.length === 0) lines.push("No adjudicated findings.");
  for (const cluster of clusters) {
    lines.push(`### ${cluster.id} — ${cluster.severity} / ${cluster.disposition}`);
    lines.push(`- providers: ${cluster.providers.map((provider) => `\`${provider}\``).join(", ")}; adapters: ${cluster.adapter_count}; evidence: \`${cluster.evidence_status}\``);
    lines.push(`- finding: ${cluster.path}${cluster.line ? `:${cluster.line}` : ""} — ${cluster.issue}`);
    lines.push(`- root cause: ${cluster.root_cause}`);
    lines.push(`- correction direction: ${cluster.recommendation}`);
  }
  lines.push("", "## Provider finding details", "");
  const providerResults = result?.provider_results ?? [];
  if (providerResults.length === 0) lines.push("No semantic provider finding output is available.");
  for (const providerResult of providerResults) {
    lines.push(`### ${providerResult.provider} — ${providerResult.output.verdict}`);
    lines.push(`- summary: ${providerResult.output.summary}`);
    if (providerResult.output.findings.length === 0) lines.push("- findings: none");
    for (const finding of providerResult.output.findings) {
      lines.push(`- ${finding.severity}: ${finding.path}${finding.line ? `:${finding.line}` : ""} — ${finding.issue}`);
      lines.push(`  - root cause: ${finding.root_cause ?? "not supplied"}`);
      lines.push(`  - correction direction: ${finding.recommendation}`);
    }
  }
  lines.push("", "Native CLI session files and broker runtime paths stay provider-private; reports expose only the public managed result.");
  if (attempt.error) lines.push("", "## Unavailable diagnostic", "", `- ${attempt.error.code}: ${attempt.error.message}`);
  return `${lines.join("\n")}\n`;
}

export function writeReviewReport(task, ref, { attempt, result = null }) {
  return createCanonicalReviewWriter({ task: assertTaskHandle(task), taskId: attempt.task_id, stage: attempt.stage })
    .writeReport(ref, renderReviewReport({ attempt, result }));
}
