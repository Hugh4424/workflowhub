import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  aggregateCanonicalProviderResults,
  authenticateCanonicalReviewResult,
} from "../../runtime/review/canonical-review-result.mjs";

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function fixture({ secondStatus = "completed", findings = [] } = {}) {
  const reviews = [
    { provider: "alpha/main", identity: { provider: "alpha/main", adapter: "alpha", source_id: "alpha-source", config_id: "alpha-config", model: null }, review: { findings } },
    { provider: "beta/main", identity: { provider: "beta/main", adapter: "beta", source_id: "beta-source", config_id: "beta-config", model: null }, review: { findings } },
  ];
  const policy = {
    source: "wh_review.v2", mode: "single_round", minimum_heterologous: 2,
    requested_profiles: reviews.map(({ provider }) => provider),
    eligible_profiles: reviews.map(({ provider }) => provider),
    same_source_exclusions: [], effective_profiles: reviews.map(({ provider }) => ({
      provider, adapter: provider.split("/")[0], model: null, effort: null, thinking: null,
    })),
    round: "initial",
  };
  const attempt = {
    review_policy: policy,
    policy_snapshot_hash: createHash("sha256").update(canonicalJson(policy)).digest("hex"),
    provider_attempts: reviews.map(({ provider }, index) => ({
      provider, identity: reviews[index].identity, status: index === 1 ? secondStatus : "completed",
      output_ref: index === 1 && secondStatus !== "completed" ? null : `reviews/attempts/a/providers/${index}.output.json`,
      execution: null,
    })),
  };
  const aggregation = aggregateCanonicalProviderResults(reviews, 2, { profilePriority: policy.requested_profiles });
  const result = {
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  const providerOutputs = reviews.map((item, index) => ({
    ref: `reviews/attempts/a/providers/${index}.output.json`, ...item,
    evidenceAnchors: item.review.findings.map(() => true),
  })).filter((_, index) => index === 0 || secondStatus === "completed");
  return { attempt, result, providerOutputs };
}

describe("canonical review result authentication", () => {
  it("requires distinct adapters for the heterologous quorum, not distinct profiles", () => {
    const sameAdapter = [
      { provider: "kimi/k3", review: { findings: [] } },
      { provider: "kimi/coding", review: { findings: [] } },
    ];
    expect(aggregateCanonicalProviderResults(sameAdapter, 2).status).toBe("unavailable");
    expect(aggregateCanonicalProviderResults(sameAdapter, 1).status).toBe("available");

    const distinctAdapters = [
      ...sameAdapter,
      { provider: "opencode/v4flash", review: { findings: [] } },
    ];
    expect(aggregateCanonicalProviderResults(distinctAdapters, 2).status).toBe("available");
  });

  it("does not count different adapters backed by the same broker source as heterologous", () => {
    const sharedSource = [
      { provider: "kimi/k3", identity: { provider: "kimi/k3", adapter: "kimi", source_id: "shared-source", config_id: "k3", model: null }, review: { findings: [] } },
      { provider: "opencode/v4flash", identity: { provider: "opencode/v4flash", adapter: "opencode", source_id: "shared-source", config_id: "flash", model: null }, review: { findings: [] } },
    ];
    expect(aggregateCanonicalProviderResults(sharedSource, 2).status).toBe("unavailable");
    expect(aggregateCanonicalProviderResults([
      ...sharedSource.slice(0, 1),
      { ...sharedSource[1], identity: { ...sharedSource[1].identity, source_id: "other-source" } },
    ], 2).status).toBe("available");
  });

  it("requires an explicit source id when the managed review policy is active", () => {
    const providers = [
      { provider: "alpha/main", review: { findings: [] } },
      { provider: "beta/main", review: { findings: [] } },
    ];
    expect(aggregateCanonicalProviderResults(providers, 2, { requireIdentity: true, requireSourceId: true }).status).toBe("unavailable");
    expect(aggregateCanonicalProviderResults(providers, 2).status).toBe("available");
  });

  it("fails closed when a provider source identity is missing", () => {
    expect(aggregateCanonicalProviderResults([
      { review: { findings: [] } },
      { provider: "beta/main", review: { findings: [] } },
    ], 1).status).toBe("unavailable");
    expect(aggregateCanonicalProviderResults([{
      provider: "beta/main",
      identity: { provider: "beta/main", adapter: "beta", source_id: "" },
      review: { findings: [] },
    }], 1).status).toBe("unavailable");
  });

  it("does not silently drop a malformed member before quorum accounting", () => {
    const result = aggregateCanonicalProviderResults([
      { provider: "alpha/main", review: { findings: [], verdict: "pass" } },
      { provider: "beta/main", review: { findings: [] } },
    ], 1);
    expect(result.status).toBe("unavailable");
    expect(result.invalid_members).toEqual(["alpha/main"]);
  });

  it("does not turn a serious finding without a root cause into an actionable finding", () => {
    const result = aggregateCanonicalProviderResults([{
      provider: "alpha/main",
      review: { findings: [{ severity: "major", path: "runtime/example.mjs", line: 1, issue: "unsafe branch", recommendation: "fix it" }] },
    }], 1);
    expect(result.status).toBe("unavailable");
    expect(result.invalid_members).toEqual(["alpha/main"]);
  });

  it("does not accept a serious finding without explicit evidence", () => {
    const result = aggregateCanonicalProviderResults([{
      provider: "alpha/main",
      review: { findings: [{ severity: "major", path: "runtime/example.mjs", line: 1, issue: "unsafe branch", root_cause: "missing guard", recommendation: "fix it", evidence_kind: "direct" }] },
    }], 1);
    expect(result.status).toBe("unavailable");
    expect(result.invalid_members).toEqual(["alpha/main"]);
  });

  it("accepts the exact aggregation and rejects semantic field tampering or omitted completed providers", () => {
    const { attempt, result, providerOutputs } = fixture();
    expect(authenticateCanonicalReviewResult({ attempt, result, providerOutputs }).aggregation.status).toBe("available");
    for (const tampered of [
      { ...result, verdict: "revise_required" },
      { ...result, findings: [{ provider: "alpha/main", severity: "minor", path: "x", issue: "x", recommendation: "x" }] },
      { ...result, adjudication: { ...result.adjudication, clusters: [{ forged: true }] } },
      { ...result, provider_results: result.provider_results.slice(0, 1) },
    ]) {
      expect(() => authenticateCanonicalReviewResult({ attempt, result: tampered, providerOutputs }))
        .toThrow(/aggregation|exactly match/i);
    }
  });

  it("does not trust result adjudication when authenticating evidence anchors", () => {
    const finding = {
      severity: "major", path: "runtime/example.mjs", line: 7, issue: "unsafe fallback permits invalid data",
      root_cause: "the fallback is used as a success signal", recommendation: "reject the fallback", evidence_kind: "direct",
      evidence: "runtime/example.mjs:7 shows the fallback bypassing validation",
    };
    const { attempt, result, providerOutputs } = fixture({ findings: [finding] });
    const tampered = {
      ...result,
      findings: [],
      adjudication: {
        ...result.adjudication,
        clusters: result.adjudication.clusters.map((cluster) => ({
          ...cluster,
          disposition: "invalid_evidence",
          evidence_status: "invalid_anchor",
          provider_findings: cluster.provider_findings.map((item) => ({ ...item, evidence_anchor_valid: false })),
        })),
      },
    };
    expect(() => authenticateCanonicalReviewResult({ attempt, result: tampered, providerOutputs }))
      .toThrow(/aggregation|exactly match/i);
  });

  it("rejects a persisted semantic result when completed outputs do not satisfy quorum", () => {
    const { attempt, result, providerOutputs } = fixture({ secondStatus: "failed" });
    expect(() => authenticateCanonicalReviewResult({ attempt, result, providerOutputs }))
      .toThrow(/quorum/i);
  });

  it("does not reject a pinned effort or thinking value that the public result cannot observe", () => {
    const { attempt, result, providerOutputs } = fixture();
    attempt.review_policy.requested_profile_specs = [
      { provider: "alpha/main", model: null, effort: "max", thinking: null },
      { provider: "beta/main", model: null, effort: null, thinking: "deep" },
    ];
    attempt.provider_attempts[0].execution = { model: null, effort: null, thinking: null };
    attempt.provider_attempts[1].execution = { model: null, effort: null, thinking: null };
    attempt.policy_snapshot_hash = createHash("sha256").update(canonicalJson(attempt.review_policy)).digest("hex");
    expect(authenticateCanonicalReviewResult({ attempt, result, providerOutputs }).aggregation.status).toBe("available");
  });

  it("still rejects an explicitly observed pinned execution mismatch", () => {
    const { attempt, result, providerOutputs } = fixture();
    attempt.review_policy.requested_profile_specs = [
      { provider: "alpha/main", model: null, effort: "max", thinking: null },
      { provider: "beta/main", model: null, effort: null, thinking: null },
    ];
    attempt.provider_attempts[0].execution = { model: null, effort: "low", thinking: null };
    attempt.policy_snapshot_hash = createHash("sha256").update(canonicalJson(attempt.review_policy)).digest("hex");
    expect(() => authenticateCanonicalReviewResult({ attempt, result, providerOutputs }))
      .toThrow(/pinned profile/i);
  });

  it("rejects an observed execution adapter that is inconsistent with the provider identity", () => {
    const { attempt, result, providerOutputs } = fixture();
    attempt.provider_attempts[0].execution = {
      adapter: "spoofed-adapter", model: null, effort: null, thinking: null,
    };
    expect(() => authenticateCanonicalReviewResult({ attempt, result, providerOutputs }))
      .toThrow(/execution adapter/i);
  });
});
