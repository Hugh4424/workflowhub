import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { parseReviewerOutput } from "./review-output.mjs";

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

export function parseCanonicalReviewerOutput(raw, options = {}) {
  return parseReviewerOutput(raw, options);
}

// `dsh-code-review` is the canonical verify-code skill id, and older DSH
// review records used that id as the provider label while correctly declaring
// the underlying adapter as `dsh`. Keep this compatibility mapping explicit
// and centralized; arbitrary provider/adapter mismatches must still fail
// authentication.
const PROVIDER_ADAPTER_ALIASES = new Map([
  ["dsh-code-review", "dsh"],
]);

export function providerAdapter(provider) {
  if (typeof provider !== "string" || !/^[a-z][a-z0-9-]*(?:\/[a-z0-9](?:[a-z0-9-]|\.(?=[a-z0-9]))*)?$/.test(provider)) return null;
  return PROVIDER_ADAPTER_ALIASES.get(provider) ?? provider.split("/", 1)[0];
}
function sourceIdentityOf(item, { requireIdentity = false, requireSourceId = false, requireConfigId = false } = {}) {
  const provider = item?.provider;
  const adapter = item?.identity?.adapter ?? providerAdapter(provider);
  const explicitSourceId = Object.hasOwn(item ?? {}, "source_id") ? item.source_id : item?.identity?.source_id;
  if (typeof provider !== "string" || provider.trim() === "" || typeof adapter !== "string" || adapter === "") return null;
  if (requireIdentity && !Object.hasOwn(item ?? {}, "identity")) return null;
  if (Object.hasOwn(item ?? {}, "identity") && (!item.identity || typeof item.identity !== "object" || item.identity.provider !== provider || item.identity.adapter !== providerAdapter(provider) || typeof item.identity.source_id !== "string" || item.identity.source_id.trim() === "")) return null;
  if (requireConfigId && (typeof item?.identity?.config_id !== "string" || item.identity.config_id.trim() === "")) return null;
  if (Object.hasOwn(item ?? {}, "source_id") && (typeof explicitSourceId !== "string" || explicitSourceId.trim() === "")) return null;
  if (requireSourceId && (typeof explicitSourceId !== "string" || explicitSourceId.trim() === "")) return null;
  return { provider, adapter, source_id: explicitSourceId ?? provider };
}
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
    // A serious finding must carry its own root cause.  Do not turn a missing
    // root cause into an apparently complete actionable finding by copying the
    // issue text; the provider contract treats that as invalid evidence.
    issue: finding.issue,
    root_cause: finding.root_cause ?? (severity === "minor" ? finding.issue : invalid("serious finding root_cause is required")),
    recommendation: finding.recommendation,
    providers: [...new Set(members.map(({ provider }) => provider))],
    adapter_count: new Set(members.map(({ adapter }) => adapter)).size,
    finding_count: members.length, disposition, evidence_status: evidenceStatus,
    provider_findings: members.map(({ provider, adapter, finding: member, anchorValid }) => ({
      provider, adapter, severity: member.severity, evidence_kind: member.evidence_kind ?? "unspecified",
      evidence_anchor_valid: anchorValid !== false,
    })),
  };
}

export function aggregateCanonicalProviderResults(providerResults, minimumReviewers = 1, { profilePriority = [], requireIdentity = false, requireSourceId = false } = {}) {
  if (!Number.isSafeInteger(minimumReviewers) || minimumReviewers < 1) throw new TypeError("minimumReviewers must be positive");
  const priority = new Map(profilePriority.map((provider, index) => [provider, index]));
  // A configured profile is an independent review member. Do not collapse
  // two profiles merely because they use the same CLI adapter; source/profile
  // identity is already carried by `provider` and is part of the contract.
  const byProvider = new Map();
  const canonicalReview = (review) => review && typeof review === "object" && !Array.isArray(review)
    && Object.keys(review).length === 1 && Object.hasOwn(review, "findings") && Array.isArray(review.findings)
    && review.findings.every((finding) => finding && typeof finding === "object" && !Array.isArray(finding)
      && ["blocking", "major", "minor"].includes(finding.severity)
      && typeof finding.path === "string" && finding.path.trim() !== ""
      && typeof finding.issue === "string" && finding.issue.trim() !== ""
      && typeof finding.recommendation === "string" && finding.recommendation.trim() !== ""
      && (finding.severity === "minor" || (
        typeof finding.root_cause === "string" && finding.root_cause.trim() !== ""
        && ["direct", "inferred", "machine"].includes(finding.evidence_kind)
        && typeof finding.evidence === "string" && finding.evidence.trim() !== ""
      )));
  // A transport failure is represented by review=null and remains eligible for
  // normal quorum accounting. A non-null malformed object is different: it is
  // a completed-looking member whose semantic output cannot be authenticated.
  // Do not silently drop it and let the remaining profiles appear sufficient.
  const malformedMembers = providerResults.filter((item) => item?.review !== null
    && item?.review !== undefined && !canonicalReview(item.review));
  if (malformedMembers.length > 0) {
    return {
      status: "unavailable", valid: [], findings: [],
      invalid_members: malformedMembers.map((item) => item?.provider ?? null),
      adjudication: { version: "wh-review-adjudication.v1", clusters: [], actionable: [] },
    };
  }
  const validReviewItems = providerResults.filter((item) => {
    const review = item?.review;
    return canonicalReview(review);
  });
  // A malformed identity is not a lower-quality reviewer that can be ignored:
  // it makes the quorum unverifiable. Keep the result unavailable instead of
  // silently counting the remaining profiles.
  if (validReviewItems.some((item) => sourceIdentityOf(item, { requireIdentity, requireSourceId }) === null)) {
    return { status: "unavailable", valid: [], findings: [], adjudication: { version: "wh-review-adjudication.v1", clusters: [], actionable: [] } };
  }
  validReviewItems.forEach((item, index) => {
    const current = byProvider.get(item.provider);
    const rank = priority.get(item.provider) ?? Number.MAX_SAFE_INTEGER;
    const currentRank = current ? (priority.get(current.item.provider) ?? Number.MAX_SAFE_INTEGER) : null;
    if (!current || rank < currentRank || (rank === currentRank && index < current.index)) byProvider.set(item.provider, { item, index });
  });
  const valid = [...byProvider.values()].map(({ item }) => item).sort((left, right) => left.provider.localeCompare(right.provider));
  const candidates = valid.flatMap((item) => {
    // The source identity was already authenticated above. Reuse that exact
    // identity for finding adjudication instead of deriving a second adapter
    // value from the provider label.
    const identity = sourceIdentityOf(item, { requireIdentity, requireSourceId });
    return item.review.findings.map((finding, index) => ({
      provider: item.provider, adapter: identity.adapter, finding, index,
      anchorValid: item.evidenceAnchors?.[index] ?? true,
    }));
  }).sort((left, right) => findingKey(left.finding).localeCompare(findingKey(right.finding)) || left.provider.localeCompare(right.provider) || left.index - right.index);
  const grouped = [];
  for (const candidate of candidates) {
    const cluster = grouped.find((entry) => sameCluster(entry, candidate));
    if (cluster) cluster.members.push(candidate); else grouped.push({ members: [candidate] });
  }
  const clusters = grouped.map(clusterRecord).sort((left, right) => left.id.localeCompare(right.id));
  const actionable = clusters.filter(({ disposition }) => disposition === "actionable");
  const findings = clusters.filter(({ disposition, severity }) => disposition === "actionable" || severity === "minor");
  const adjudication = { version: "wh-review-adjudication.v1", clusters, actionable };
  const distinctAdapters = new Set(valid.map((item) => sourceIdentityOf(item, { requireIdentity, requireSourceId })?.adapter).filter(Boolean)).size;
  const distinctSources = new Set(valid.map((item) => sourceIdentityOf(item, { requireIdentity, requireSourceId })?.source_id).filter(Boolean)).size;
  if (distinctAdapters < minimumReviewers || distinctSources < minimumReviewers) return { status: "unavailable", valid, findings, adjudication };
  return { status: "available", valid, findings, adjudication };
}

export function conservativelyAssessUnattestedAnchors(items) {
  return items.map((item) => ({
    ...item,
    evidenceAnchors: item.review.findings.map(() => false),
  }));
}

function policyFacts(attempt, fallbackMinimumReviewers) {
  const policy = attempt.review_policy ?? null;
  if (policy === null && attempt.version === "wh-review-attempt.v1" && Array.isArray(attempt.provider_attempts)) {
    // Simple-review attempts do not carry a wh_review.v2 policy; treat them as a
    // single-quorum review with identity inferred from the completed providers.
    const providers = attempt.provider_attempts.filter((p) => p.status === "completed");
    if (providers.length > 0) {
      return {
        minimum: 1,
        priority: providers.map((p) => p.provider),
        eligible: new Set(providers.map((p) => p.provider)),
        requireIdentity: false,
        requireSourceId: false,
      };
    }
  }
  if (policy?.source !== "wh_review.v2") invalid("formal review requires a wh_review.v2 policy");
  if (attempt.policy_snapshot_hash !== createHash("sha256").update(canonicalJson(policy)).digest("hex")) {
    invalid("review policy snapshot hash mismatch");
  }
  const attempted = new Set(attempt.provider_attempts.map(({ provider }) => provider));
  const requested = policy.requested_profiles;
  if (!Array.isArray(requested) || attempted.size !== requested.length || requested.some((provider) => !attempted.has(provider))) {
    invalid("provider attempts do not exactly match requested profiles");
  }
  if (requested.some((provider) => sourceIdentityOf(attempt.provider_attempts.find((item) => item.provider === provider), { requireIdentity: true, requireSourceId: true, requireConfigId: true }) === null)) invalid("review provider broker identity is missing");
  if (!Number.isSafeInteger(policy.minimum_heterologous) || policy.minimum_heterologous < 1) invalid("review quorum is invalid");
  if (!Array.isArray(policy.eligible_profiles)) invalid("eligible review profiles are invalid");
  if (!Array.isArray(policy.effective_profiles) || policy.effective_profiles.some((profile) => {
    const identity = sourceIdentityOf(profile);
    return identity === null || profile.adapter !== identity.adapter;
  })) invalid("review effective profile source identity is missing");
  return { minimum: policy.minimum_heterologous, priority: requested, eligible: new Set(policy.eligible_profiles), requireIdentity: true, requireSourceId: true };
}

export function authenticateCanonicalReviewResult({
  attempt, result, providerOutputs, fallbackMinimumReviewers = 1, assess = (items) => items, requireEvidenceAnchors = undefined,
}) {
  const policy = policyFacts(attempt, fallbackMinimumReviewers);
  const { minimum, priority, eligible } = policy;
  const mustHaveEvidenceAnchors = requireEvidenceAnchors ?? attempt.review_policy?.source === "wh_review.v2";
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
      provider: providerAttempt.provider,
      ...(providerAttempt.identity ? { identity: providerAttempt.identity } : {}),
      review: output.review, execution: providerAttempt.execution ?? null,
      ...(output.evidenceAnchors === undefined ? {} : { evidenceAnchors: output.evidenceAnchors }),
    });
  }
  const specs = new Map((attempt.review_policy?.requested_profile_specs ?? []).map((spec) => [spec.provider, spec]));
  for (const item of latestCompleted.values()) {
    const spec = specs.get(item.provider);
    // The public v2/v3 result exposes model reliably, but broker projections
    // intentionally expose effort/thinking as null. Null means "not directly
    // model-reported", not "the provider ignored the configured pin". The
    // managed host checks the configured tuple before dispatch and v3 carries
    // config_id as the broker-side profile attestation; do not duplicate the
    // broker's config-hash algorithm in WorkflowHub.
    const executionMatches = spec && item.execution
      && (spec.model === null || item.execution.model === spec.model)
      && (spec.effort === null || item.execution.effort === null || item.execution.effort === spec.effort)
      && (spec.thinking === null || item.execution.thinking === null || item.execution.thinking === spec.thinking);
    if (spec && !executionMatches) {
      invalid(`provider execution does not match pinned profile ${item.provider}`);
    }
    if (item.execution?.adapter !== undefined && item.execution.adapter !== providerAdapter(item.provider)) {
      invalid(`provider execution adapter does not match provider ${item.provider}`);
    }
  }
  const eligibleCompleted = [...latestCompleted.values()].filter((item) => eligible === null || eligible.has(item.provider));
  if (mustHaveEvidenceAnchors && eligibleCompleted.some((item) => !Array.isArray(item.evidenceAnchors)
      || item.evidenceAnchors.length !== item.review.findings.length
      || item.evidenceAnchors.some((value) => typeof value !== "boolean"))) {
    invalid("completed provider output evidence anchors are missing or invalid");
  }
  const assessed = assess(eligibleCompleted);
  const anchored = mustHaveEvidenceAnchors
    ? assessed.map((item) => ({
      ...item,
      evidenceAnchors: eligibleCompleted.find((candidate) => candidate.provider === item.provider)?.evidenceAnchors,
    }))
    : assessed;
  const aggregation = aggregateCanonicalProviderResults(anchored, minimum, {
    profilePriority: priority,
    requireIdentity: policy.requireIdentity ?? false,
    requireSourceId: policy.requireSourceId ?? false,
  });
  if (aggregation.status !== "available") invalid("completed provider outputs do not satisfy review quorum");
  const expectedProviderResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const expectedFindings = aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding }));
  const expectedAdjudication = { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters };
  const legacyFindings = expectedProviderResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
  const semanticMatches = result.adjudication === undefined
    ? result.verdict !== undefined && isDeepStrictEqual(result.findings, legacyFindings)
    : result.verdict === undefined && isDeepStrictEqual(result.findings, expectedFindings)
      && isDeepStrictEqual(result.adjudication, expectedAdjudication);
  if (!semanticMatches || !isDeepStrictEqual(result.provider_results, expectedProviderResults)) {
    invalid("semantic result does not exactly match completed provider evidence and aggregation");
  }
  return Object.freeze({ aggregation, expectedProviderResults, expectedFindings, expectedAdjudication });
}
