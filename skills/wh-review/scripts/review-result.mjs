import { posix } from "node:path";
import { Buffer } from "node:buffer";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { createCanonicalReviewWriter } from "../../../runtime/evidence/canonical-receipt-writer.mjs";
import { aggregateCanonicalProviderResults } from "../../../runtime/review/canonical-review-result.mjs";

function safePart(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function providerFilePart(provider) {
  if (typeof provider !== "string" || provider.length === 0) throw new TypeError("provider is invalid");
  // Provider profile IDs intentionally use `adapter/profile`. Encode only the
  // filename component: records keep the original profile ID for attribution.
  return `p-${Buffer.from(provider, "utf8").toString("base64url")}`;
}

export function aggregateProviderResults(providerResults, minimumReviewers = 1, { profilePriority = [] } = {}) {
  return aggregateCanonicalProviderResults(providerResults, minimumReviewers, { profilePriority });
}

const DISPOSITION_DECISIONS = new Set(["accept", "partial", "reject", "needs_human"]);

// A disposition is the smallest durable fact needed after a finding is
// consumed. Replay bindings and re-review orchestration are retired and are
// deliberately not part of this contract.
export function validateReviewDisposition(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: ["disposition must be an object"] };
  }
  if (typeof value.finding_id !== "string" || value.finding_id.trim() === "") errors.push("finding_id required");
  if (!DISPOSITION_DECISIONS.has(value.decision)) errors.push("invalid decision");
  if (["accept", "partial"].includes(value.decision)) {
    for (const field of ["verification", "root_cause", "evidence"]) {
      if (typeof value[field] !== "string" || value[field].trim() === "") errors.push(`${field} required for accepted finding`);
    }
  }
  if (value.rereview_flow_id !== undefined) errors.push("rereview_flow_id is retired");
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

export function aggregateReviewMetrics(attempts = []) {
  const records = Array.isArray(attempts) ? attempts : [attempts];
  const failureTaxonomy = {};
  let providerAttemptCount = 0;
  let retryCount = 0;
  let failedDurationMs = 0;
  for (const record of records) {
    const summary = classificationSummary(record);
    providerAttemptCount += summary.provider_attempt_count;
    retryCount += summary.retry_count;
    failedDurationMs += summary.failed_duration_ms;
    for (const [code, entry] of Object.entries(summary.failure_taxonomy)) {
      failureTaxonomy[code] = { code: entry.code, category: entry.category, count: (failureTaxonomy[code]?.count ?? 0) + entry.count };
    }
  }
  return {
    attempt_count: records.length,
    provider_attempt_count: providerAttemptCount,
    retry_count: retryCount,
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
    `- semantic result: \`${result ? "available" : "unavailable"}\``,
    "",
    "## Routing and coverage",
    "",
  ];
  if (attempt.review_policy) {
    lines.push(`- policy: \`${attempt.review_policy.source}\`; configured mode \`${attempt.review_policy.mode}\``);
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
    lines.push(`### ${providerResult.provider}`);
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
