import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { aggregateCanonicalProviderResults, authenticateCanonicalReviewResult, parseCanonicalReviewerOutput } from "../../runtime/review/canonical-review-result.mjs";
import { deriveStageCompletion, STAGE_PREDICATES } from "../../runtime/stage/completion-predicates.mjs";

const root = resolve(import.meta.dirname, "../..");
const productionRoots = ["core", "runtime", "workflows"];
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function modulesUnder(directory) {
  const absolute = resolve(root, directory);
  const paths = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) paths.push(...modulesUnder(relative(root, path)));
    else if (entry.isFile() && entry.name.endsWith(".mjs")) paths.push(relative(root, path));
  }
  return paths;
}

function hasWhReviewImport(source) {
  return /(?:\bimport\s*(?:[\s\S]*?\sfrom\s*)?|\bexport\s*\*\s+from\s*|\bimport\s*\()["'][^"']*skills\/wh-review\//.test(source);
}

describe("review layering", () => {
  it("keeps production core/runtime/workflows independent from the wh-review skill implementation", () => {
    const offenders = productionRoots.flatMap((directory) => modulesUnder(directory))
      .filter((path) => hasWhReviewImport(readFileSync(resolve(root, path), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("places production review schema, parser, policy and review subjects under runtime/review", () => {
    for (const path of [
      "runtime/review/schema-validator.mjs",
      "runtime/review/review-output.mjs",
      "runtime/review/review-policy.mjs",
      "runtime/review/integration-review-subject.mjs",
    ]) expect(readFileSync(resolve(root, path), "utf8")).not.toMatch(/skills\/wh-review/);
  });

  it("keeps the canonical parser production-owned and the skill adapter provider-isolated", () => {
    const parser = readFileSync(resolve(root, "runtime/review/review-output.mjs"), "utf8");
    const adapter = readFileSync(resolve(root, "skills/wh-review/scripts/review-output.mjs"), "utf8");
    expect(parser).toMatch(/export function parseReviewerOutput/);
    expect(parser).not.toMatch(/skills\/wh-review|review-provider-client|simple-review-runner/);
    expect(adapter).toContain('export * from "../../../runtime/review/review-output.mjs";');
    expect(adapter).not.toMatch(/function parseReviewerOutput/);
  });

  it("RED: rejects a host URI at the production findings parser boundary", () => {
    const finding = {
      severity: "major",
      path: "file://private/review.md",
      line: 1,
      issue: "host path escaped into a finding anchor",
      recommendation: "use a submitted bundle-relative material path",
      root_cause: "provider path was not constrained",
      evidence_kind: "direct",
      evidence: "the finding path is a file URI",
    };
    expect(() => parseCanonicalReviewerOutput(JSON.stringify({ findings: [finding] }), { requireEvidence: true }))
      .toThrow(/OUTPUT_INVALID/);
  });

  it("RED: records an explicit fact when an unknown severity finding is dropped", () => {
    const parsed = parseCanonicalReviewerOutput(JSON.stringify({ findings: [{
      severity: "unrecognized-severity",
      path: "materials/subject.md",
      line: 1,
      issue: "unknown severity fixture",
      recommendation: "retain a machine-readable discard fact",
    }] }));
    expect(parsed).toMatchObject({
      findings: [],
      discarded_facts: [{
        fact_kind: "unknown_severity_finding_dropped",
        finding_excerpt: expect.stringContaining("unrecognized-severity"),
        reason: "unknown_severity",
      }],
    });
  });

  it("accepts a discarded fact that carries only a dropped key", () => {
    const result = aggregateCanonicalProviderResults([{
      provider: "codex/luna",
      review: {
        findings: [],
        discarded_facts: [{
          fact_kind: "unknown_material_key_dropped",
          dropped_key: "typo_context",
          reason: "unknown_material_key",
        }],
      },
    }]);
    expect(result.status).toBe("available");
    expect(result.valid[0].review.discarded_facts[0]).toMatchObject({ dropped_key: "typo_context" });
  });

  it("keeps serious finding evidence fields mandatory at the production parser boundary", () => {
    const finding = {
      severity: "major",
      path: "materials/subject.md",
      line: 1,
      issue: "serious review gap",
      recommendation: "repair the gap",
      root_cause: "missing guard",
      evidence_kind: "direct",
      evidence: "the submitted material shows the gap",
    };
    for (const severity of ["major", "blocking"]) {
      for (const field of ["evidence_kind", "evidence", "root_cause"]) {
        const invalid = { ...finding, severity };
        delete invalid[field];
        expect(() => parseCanonicalReviewerOutput(JSON.stringify({ findings: [invalid] }), { requireEvidence: true }))
          .toThrow(/OUTPUT_INVALID/);
      }
    }
    expect(parseCanonicalReviewerOutput(JSON.stringify({ findings: [{ ...finding, severity: "minor", evidence_kind: undefined }] }), { requireEvidence: true }))
      .toMatchObject({ findings: [{ severity: "minor" }] });
  });

  it("RED: does not let a malformed provider disappear behind a clean quorum peer", () => {
    const malformed = {
      severity: "major",
      path: "materials/subject.md",
      line: 1,
      issue: "missing serious evidence",
      recommendation: "add the evidence",
    };
    const result = aggregateCanonicalProviderResults([
      { provider: "opencode/v4flash", review: { findings: [] } },
      { provider: "kimi/coding", review: { findings: [malformed] } },
    ], 1);
    expect(result).toMatchObject({
      status: "unavailable",
      valid: [],
      invalid_members: ["kimi/coding"],
    });
  });

  it("RED: rejects a completed output ref bound to a different selected provider", () => {
    const attempt = {
      version: "wh-review-attempt.v1",
      provider_attempts: [{
        provider: "opencode/v4flash",
        status: "completed",
        output_ref: "quality/reviews/opencode.output.json",
      }],
    };
    const result = {
      provider_results: [{ provider: "opencode/v4flash", output: { findings: [] } }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    };
    expect(() => authenticateCanonicalReviewResult({
      attempt,
      result,
      providerOutputs: [{
        ref: "quality/reviews/opencode.output.json",
        provider: "kimi/coding",
        review: { findings: [] },
      }],
    })).toThrow(/missing or misbound/);
  });

  it("accepts versioned provider profile identifiers in canonical review provenance", () => {
    const result = aggregateCanonicalProviderResults([
      { provider: "opencode/pax3.8", review: { findings: [] } },
    ]);
    expect(result.status).toBe("available");
    expect(result.valid[0].provider).toBe("opencode/pax3.8");
    expect(result.adjudication.clusters).toEqual([]);
  });

  it("accepts the canonical DSH provider identity when the provider id names its review skill", () => {
    const provider = "dsh-code-review";
    const identity = {
      provider,
      adapter: "dsh",
      source_id: "codex-session-dsh-review",
    };
    const result = aggregateCanonicalProviderResults([
      { provider, identity, review: { findings: [] } },
    ]);
    expect(result.status).toBe("available");
    expect(result.valid[0]).toMatchObject({ provider, identity });
  });

  it("authenticates the DSH alias through the full canonical review chain", () => {
    const provider = "dsh-code-review";
    const review = { findings: [] };
    const attempt = {
      version: "wh-review-attempt.v1",
      provider_attempts: [{
        provider,
        identity: { provider, adapter: "dsh", source_id: "codex-session-dsh-review" },
        status: "completed",
        output_ref: "quality/reviews/provider.output.json",
        execution: { adapter: "dsh" },
      }],
    };
    const result = {
      provider_results: [{ provider, output: review }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    };
    expect(() => authenticateCanonicalReviewResult({
      attempt,
      result,
      providerOutputs: [{ ref: "quality/reviews/provider.output.json", provider, review }],
    })).not.toThrow();
  });

  it("does not generalize the DSH compatibility mapping to arbitrary adapter mismatches", () => {
    const provider = "opencode/pax3.8";
    const result = aggregateCanonicalProviderResults([
      {
        provider,
        identity: { provider, adapter: "codex", source_id: "wrong-adapter" },
        review: { findings: [] },
      },
    ]);
    expect(result.status).toBe("unavailable");
    expect(result.valid).toEqual([]);
  });

  it("does not authenticate a formal review from the retired legacy policy", () => {
    const provider = "pi/coding";
    const review = { findings: [] };
    const attempt = {
      review_policy: {
        source: "legacy_3rd_review",
        requested_profiles: [provider],
      },
      provider_attempts: [{ provider, status: "completed", output_ref: "quality/reviews/provider.output.json" }],
    };
    const result = {
      provider_results: [{ provider, output: review }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    };
    expect(() => authenticateCanonicalReviewResult({
      attempt,
      result,
      providerOutputs: [{ ref: "quality/reviews/provider.output.json", provider, review }],
    })).toThrow(/wh_review\.v2|legacy review policy/i);
  });

  it("does not let a dsh diagnostic masquerade as a formal verify-code review", () => {
    const facts = Object.entries(STAGE_PREDICATES["verify-code"]).map(([subject, kind], index) => ({
      fact: {
        ref: `quality/${subject}.json`,
        value: {
          task_id: "task",
          stage: "verify-code",
          material_revision: "revision",
          snapshot_tree: "tree",
          kind,
          subject,
          status: kind === "review" ? "recorded" : "passed",
          fact_id: `fact-${index}`,
          ...(subject === "code_review" ? { source: "dsh-code-review" } : {}),
        },
      },
      freshness: { status: "current" },
      authenticated: true,
      ...(subject === "code_review" ? { review_status: "clean" } : {}),
    }));
    expect(deriveStageCompletion("verify-code", facts)).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["code_review"]),
    });
  });

  it("requires broker config identity even when the provider returned empty findings", () => {
    const provider = "pi/coding";
    const policy = {
      source: "wh_review.v2",
      mode: "single_round",
      minimum_heterologous: 1,
      requested_profiles: [provider],
      eligible_profiles: [provider],
      same_source_exclusions: [],
      effective_profiles: [{ provider, adapter: "pi", model: null, effort: null, thinking: null }],
    };
    const identity = { provider, adapter: "pi", source_id: "source-pi", config_id: "", model: null };
    const attempt = {
      review_policy: policy,
      policy_snapshot_hash: createHash("sha256").update(canonicalJson(policy)).digest("hex"),
      provider_attempts: [{ provider, identity, status: "completed", output_ref: "quality/reviews/provider.output.json" }],
    };
    const review = { findings: [] };
    const result = {
      provider_results: [{ provider, output: review }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    };
    expect(() => authenticateCanonicalReviewResult({
      attempt,
      result,
      providerOutputs: [{ ref: "quality/reviews/provider.output.json", provider, identity, review, evidenceAnchors: [] }],
    })).toThrow(/config|identity|policy snapshot/i);
  });
});
