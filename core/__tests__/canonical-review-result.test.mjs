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

function fixture({ secondStatus = "completed" } = {}) {
  const reviews = [
    { provider: "alpha/main", review: { findings: [] } },
    { provider: "beta/main", review: { findings: [] } },
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
      provider, status: index === 1 ? secondStatus : "completed",
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
  })).filter((_, index) => index === 0 || secondStatus === "completed");
  return { attempt, result, providerOutputs };
}

describe("canonical review result authentication", () => {
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

  it("rejects a persisted semantic result when completed outputs do not satisfy quorum", () => {
    const { attempt, result, providerOutputs } = fixture({ secondStatus: "failed" });
    expect(() => authenticateCanonicalReviewResult({ attempt, result, providerOutputs }))
      .toThrow(/quorum/i);
  });
});
