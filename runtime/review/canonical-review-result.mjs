import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function invalid(message) {
  const error = new Error(`REVIEW_EVIDENCE_INVALID: ${message}`);
  error.code = "REVIEW_EVIDENCE_INVALID";
  throw error;
}

const verdicts = new Set(["pass", "revise_required"]);
const severities = new Set(["blocking", "major", "minor"]);
const evidenceKinds = new Set(["direct", "inferred", "machine"]);

function validateFinding(value, index, requireEvidence) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`provider finding ${index} must be an object`);
  if (!severities.has(value.severity) || typeof value.path !== "string" || !value.path
      || value.path.startsWith("/") || value.path.includes("\\")
      || (value.line !== undefined && value.line !== null && (!Number.isSafeInteger(value.line) || value.line < 1))
      || typeof value.issue !== "string" || !value.issue.trim()
      || typeof value.recommendation !== "string" || !value.recommendation.trim()) {
    invalid(`provider finding ${index} is invalid`);
  }
  const needsEvidence = value.severity !== "minor";
  if (requireEvidence && needsEvidence
      && (!evidenceKinds.has(value.evidence_kind) || typeof value.evidence !== "string" || !value.evidence.trim()
        || typeof value.root_cause !== "string" || !value.root_cause.trim())) {
    invalid(`provider finding ${index} evidence is invalid`);
  }
  return {
    severity: value.severity, path: value.path, ...(Number.isSafeInteger(value.line) ? { line: value.line } : {}),
    issue: value.issue, recommendation: value.recommendation,
    ...(value.evidence_kind ? { evidence_kind: value.evidence_kind } : {}),
    ...(typeof value.evidence === "string" && value.evidence.trim() ? { evidence: value.evidence } : {}),
    ...(typeof value.root_cause === "string" && value.root_cause.trim() ? { root_cause: value.root_cause } : {}),
  };
}

export function parseCanonicalReviewerOutput(raw, { requireEvidence = false } = {}) {
  if (typeof raw !== "string" || !raw.trim()) invalid("provider returned no text");
  let value;
  try { value = JSON.parse(raw.trim()); }
  catch { invalid("canonical provider output must be pure JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value) || !verdicts.has(value.verdict)
      || typeof value.summary !== "string" || !value.summary.trim() || !Array.isArray(value.findings)) {
    invalid("provider output shape is invalid");
  }
  const findings = value.findings.map((finding, index) => validateFinding(finding, index, requireEvidence));
  if (value.verdict === "revise_required" && findings.length === 0) invalid("revise_required needs a finding");
  if (value.verdict === "pass" && findings.some((finding) => finding.severity !== "minor")) invalid("pass contains a major finding");
  return Object.freeze({ verdict: value.verdict, summary: value.summary, findings: Object.freeze(findings) });
}

function adapterOf(provider) { return provider.split("/", 1)[0]; }
function normalizedIssue(value) {
  return value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}
function overlap(left, right) {
  const leftTerms = new Set(left); const rightTerms = new Set(right);
  if (!leftTerms.size || !rightTerms.size) return 0;
  let shared = 0;
  for (const term of leftTerms) if (rightTerms.has(term)) shared += 1;
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
function clusterRecord(cluster) {
  const members = [...cluster.members].sort((left, right) => left.provider.localeCompare(right.provider) || left.index - right.index);
  const severity = members.some(({ finding }) => finding.severity === "blocking") ? "blocking"
    : members.some(({ finding }) => finding.severity === "major") ? "major" : "minor";
  const validDirect = members.filter(({ finding, anchorValid }) => ["direct", "machine"].includes(finding.evidence_kind) && anchorValid !== false);
  const inferredAdapters = new Set(members.filter(({ finding }) => finding.evidence_kind === "inferred").map(({ adapter }) => adapter));
  let disposition = "nonblocking_minor"; let evidenceStatus = "minor";
  if (severity !== "minor") {
    if (validDirect.length) { disposition = "actionable"; evidenceStatus = "direct"; }
    else if (inferredAdapters.size >= 2) { disposition = "actionable"; evidenceStatus = "corroborated_inference"; }
    else if (members.some(({ finding, anchorValid }) => ["direct", "machine"].includes(finding.evidence_kind) && anchorValid === false)) {
      disposition = "invalid_evidence"; evidenceStatus = "invalid_anchor";
    } else { disposition = "needs_corroboration"; evidenceStatus = "single_inference"; }
  }
  const finding = members[0].finding;
  return {
    id: `F-${createHash("sha256").update(findingKey(finding)).digest("hex").slice(0, 12)}`,
    severity, path: finding.path, ...(finding.line ? { line: finding.line } : {}),
    issue: finding.issue, root_cause: finding.root_cause ?? finding.issue, recommendation: finding.recommendation,
    providers: [...new Set(members.map(({ provider }) => provider))],
    adapter_count: new Set(members.map(({ adapter }) => adapter)).size,
    finding_count: members.length, disposition, evidence_status: evidenceStatus,
    provider_findings: members.map(({ provider, adapter, finding: member, anchorValid }) => ({
      provider, adapter, severity: member.severity, evidence_kind: member.evidence_kind ?? "unspecified",
      evidence_anchor_valid: anchorValid !== false,
    })),
  };
}

export function aggregateCanonicalProviderResults(providerResults, minimumReviewers = 1, { profilePriority = [] } = {}) {
  if (!Number.isSafeInteger(minimumReviewers) || minimumReviewers < 1) throw new TypeError("minimumReviewers must be positive");
  const priority = new Map(profilePriority.map((provider, index) => [provider, index]));
  const byAdapter = new Map();
  providerResults.filter((item) => item?.review && verdicts.has(item.review.verdict)).forEach((item, index) => {
    const adapter = adapterOf(item.provider); const current = byAdapter.get(adapter);
    const rank = priority.get(item.provider) ?? Number.MAX_SAFE_INTEGER;
    const currentRank = current ? (priority.get(current.item.provider) ?? Number.MAX_SAFE_INTEGER) : null;
    if (!current || rank < currentRank || (rank === currentRank && index < current.index)) byAdapter.set(adapter, { item, index });
  });
  const valid = [...byAdapter.values()].map(({ item }) => item).sort((left, right) => left.provider.localeCompare(right.provider));
  const candidates = valid.flatMap((item) => item.review.findings.map((finding, index) => ({
    provider: item.provider, adapter: adapterOf(item.provider), finding, index,
    anchorValid: item.evidenceAnchors?.[index] ?? true,
  }))).sort((left, right) => findingKey(left.finding).localeCompare(findingKey(right.finding)) || left.provider.localeCompare(right.provider) || left.index - right.index);
  const grouped = [];
  for (const candidate of candidates) {
    const cluster = grouped.find((entry) => sameCluster(entry, candidate));
    if (cluster) cluster.members.push(candidate); else grouped.push({ members: [candidate] });
  }
  const clusters = grouped.map(clusterRecord).sort((left, right) => left.id.localeCompare(right.id));
  const actionable = clusters.filter(({ disposition }) => disposition === "actionable");
  const reportFindings = clusters.filter(({ disposition, severity }) => disposition === "actionable" || severity === "minor");
  const adjudication = { version: "wh-review-adjudication.v1", clusters, actionable, reportFindings };
  if (valid.length < minimumReviewers) return { status: "unavailable", verdict: null, valid, adjudication };
  return { status: "semantic", verdict: actionable.length ? "revise_required" : "pass", valid, adjudication };
}

export function conservativelyAssessUnattestedAnchors(items) {
  return items.map((item) => ({
    ...item,
    evidenceAnchors: item.review.findings.map(() => false),
  }));
}

function policyFacts(attempt, fallbackMinimumReviewers) {
  const policy = attempt.review_policy ?? null;
  if (policy?.source !== "wh_review.v2") {
    return { minimum: fallbackMinimumReviewers, priority: policy?.requested_profiles ?? [], eligible: null };
  }
  if (attempt.policy_snapshot_hash !== createHash("sha256").update(canonicalJson(policy)).digest("hex")) {
    invalid("review policy snapshot hash mismatch");
  }
  const attempted = new Set(attempt.provider_attempts.map(({ provider }) => provider));
  const requested = policy.requested_profiles;
  if (!Array.isArray(requested) || attempted.size !== requested.length || requested.some((provider) => !attempted.has(provider))) {
    invalid("provider attempts do not exactly match requested profiles");
  }
  if (!Number.isSafeInteger(policy.minimum_heterologous) || policy.minimum_heterologous < 1) invalid("review quorum is invalid");
  if (!Array.isArray(policy.eligible_profiles)) invalid("eligible review profiles are invalid");
  return { minimum: policy.minimum_heterologous, priority: requested, eligible: new Set(policy.eligible_profiles) };
}

export function authenticateCanonicalReviewResult({
  attempt, result, providerOutputs, fallbackMinimumReviewers = 1, assess = (items) => items,
}) {
  const { minimum, priority, eligible } = policyFacts(attempt, fallbackMinimumReviewers);
  const outputByRef = new Map(providerOutputs.map((item) => [item.ref, item]));
  const terminalProviderAttempts = new Map();
  for (const providerAttempt of attempt.provider_attempts) {
    if (providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
    terminalProviderAttempts.set(providerAttempt.provider, providerAttempt);
  }
  const latestCompleted = new Map();
  for (const providerAttempt of terminalProviderAttempts.values()) {
    const output = outputByRef.get(providerAttempt.output_ref);
    if (!output || output.provider !== providerAttempt.provider) invalid("completed provider output is missing or misbound");
    latestCompleted.set(providerAttempt.provider, {
      provider: providerAttempt.provider, review: output.review, execution: providerAttempt.execution ?? null,
    });
  }
  const specs = new Map((attempt.review_policy?.requested_profile_specs ?? []).map((spec) => [spec.provider, spec]));
  for (const item of latestCompleted.values()) {
    const spec = specs.get(item.provider);
    if (spec && (!item.execution || item.execution.model !== spec.model
        || item.execution.effort !== spec.effort || item.execution.thinking !== spec.thinking)) {
      invalid(`provider execution does not match pinned profile ${item.provider}`);
    }
  }
  const eligibleCompleted = [...latestCompleted.values()].filter((item) => eligible === null || eligible.has(item.provider));
  const aggregation = aggregateCanonicalProviderResults(assess(eligibleCompleted), minimum, { profilePriority: priority });
  if (aggregation.status !== "semantic") invalid("completed provider outputs do not satisfy review quorum");
  const expectedProviderResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const expectedFindings = aggregation.adjudication.reportFindings.map((finding) => ({ provider: finding.providers[0], ...finding }));
  const expectedAdjudication = { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters };
  const legacyFindings = expectedProviderResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
  const legacyVerdict = expectedProviderResults.some(({ output }) => output.verdict === "revise_required") ? "revise_required" : "pass";
  const semanticMatches = result.adjudication === undefined
    ? result.verdict === legacyVerdict && isDeepStrictEqual(result.findings, legacyFindings)
    : result.verdict === aggregation.verdict && isDeepStrictEqual(result.findings, expectedFindings)
      && isDeepStrictEqual(result.adjudication, expectedAdjudication);
  if (!semanticMatches || !isDeepStrictEqual(result.provider_results, expectedProviderResults)) {
    invalid("semantic result does not exactly match completed provider evidence and aggregation");
  }
  return Object.freeze({ aggregation, expectedProviderResults, expectedFindings, expectedAdjudication });
}
