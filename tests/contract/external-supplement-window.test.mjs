import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import * as reviewProviderClient from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { ReviewProviderClient } from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const materialId = "b".repeat(64);
const roots = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function publication() {
  return {
    status: "late_open",
    published_at: 1000,
    published_at_least_sources: 2,
    running_member_count: 0,
    append_window: { starts_at: 1000, ends_at: 601000, duration_ms: 600000 },
  };
}

function member(provider = "kimi/shared") {
  const providerPrefix = provider + "-";
  return {
    attempts: [{
      attempt_id: providerPrefix + "attempt",
      completed_at_ms: 2,
      duration_ms: 1,
      error: null,
      kind: "initial",
      provider_retry_count: 0,
      session_id: null,
      started_at_ms: 1,
      status: "completed",
    }],
    continuable: false,
    deadline_ms: null,
    error: null,
    identity: {
      adapter: provider.split("/", 1)[0],
      config_id: providerPrefix + "config",
      model: "shared-model",
      provider,
      source_id: providerPrefix + "source",
    },
    material: {
      contract_hash: "contract-hash",
      contract_id: "contract-id",
      material_id: materialId,
      semantic_hash: "semantic-hash",
    },
    output: JSON.stringify({ findings: [] }),
    provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: "runtime-p4" },
    recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
    result_protocol: "workflowhub-result.v3",
    session_id: null,
    status: "completed",
    timing: { completed_at_ms: 2, duration_ms: 1, started_at_ms: 1 },
    usage: null,
  };
}

function publishedGroup() {
  return {
    host_provider: "codex/host",
    material_id: materialId,
    outcome: "partial",
    providers: [member()],
    round: 1,
    runtime_id: "runtime-p4",
    selected_tier: null,
    version: "workflowhub-result.v3",
    initial_result_ref: "initial-1",
    publication: publication(),
    supplements: [],
  };
}

function materials(root) {
  return {
    bundleRoot: root,
    attachmentRoot: root,
    sourcePrefix: ".wh-review-packets",
    materialId,
    contractId: "contract-id",
    contractHash: "contract-hash",
    semanticHash: "semantic-hash",
    deliveryManifest: [],
  };
}

function finding(issue) {
  return {
    provider: "kimi/shared",
    severity: "major",
    path: "materials/01-implementation.md",
    issue,
    recommendation: "keep the finding in the same aggregation surface",
    root_cause: "the late result is a separate immutable event",
    evidence_kind: "direct",
    evidence: "the fixed-clock fixture binds the late result to the initial result",
  };
}

describe("external review publication and supplement window", () => {
  it("parses publication metadata through the existing workflowhub-result.v3 client", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-supplement-client-"));
    roots.push(root);
    const client = new ReviewProviderClient({ invoke: async () => ({
      exitCode: 0,
      stdout: JSON.stringify(publishedGroup()),
      stderr: "",
    }) });

    await expect(client.runGroup({
      hostProvider: "codex/host",
      providers: ["kimi/shared"],
      materials: materials(root),
      prompt: "review",
      minimumHeterologous: 1,
    })).resolves.toMatchObject({
      outcome: "partial",
      initial_result_ref: "initial-1",
      publication: publication(),
      supplements: [],
    });
  });

  it("registers in-window findings append-only and preserves the initial result bytes", () => {
    expect(typeof reviewProviderClient.registerReviewSupplement).toBe("function");
    const register = reviewProviderClient.registerReviewSupplement;
    const initial = Object.freeze({
      result_ref: "initial-1",
      status: "available",
      findings: [finding("initial finding")],
      publication: publication(),
      supplements: [],
    });
    const initialBytes = JSON.stringify(initial);
    const inWindow = register(initial, {
      supplement_id: "late-in-window",
      initial_result_ref: "initial-1",
      provider: "kimi/shared",
      arrival_at: 600999,
      findings: [finding("in-window finding")],
    });
    expect(JSON.stringify(initial)).toBe(initialBytes);
    expect(inWindow).toMatchObject({
      result_ref: "initial-1",
      findings: [finding("initial finding"), finding("in-window finding")],
      supplements: [{
        supplement_id: "late-in-window",
        initial_result_ref: "initial-1",
        arrival_elapsed_ms: 599999,
        window_status: "in_window",
      }],
    });

    const overWindow = register(inWindow, {
      supplement_id: "late-over-window",
      initial_result_ref: "initial-1",
      provider: "kimi/shared",
      arrival_at: 601000,
      findings: [finding("over-window finding")],
    });
    expect(overWindow.supplements[1]).toMatchObject({
      arrival_elapsed_ms: 600000,
      window_status: "over_window_unjudged",
    });
    expect(overWindow.findings).toEqual(inWindow.findings);
    expect(register(overWindow, {
      supplement_id: "late-over-window",
      initial_result_ref: "initial-1",
      provider: "kimi/shared",
      arrival_at: 601000,
      findings: [finding("over-window finding")],
    })).toEqual(overWindow);
  });

  it("keeps publication and registered supplements on the runner aggregation surface", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-supplement-runner-"));
    roots.push(root);
    mkdirSync(join(root, "materials"));
    writeFileSync(join(root, "materials", "01-implementation.md"), "anchored implementation\n");
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex/host",
      materials: { implementation: "current" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: root }),
      resolveRoute: () => ({ initial: ["kimi/shared"], mode: "full_only", minimum_heterologous: 1 }),
      selectProviders: () => ({
        providers: ["kimi/shared"],
        eligibleProfiles: ["kimi/shared"],
        provider_identities: { "kimi/shared": { source_id: "kimi/shared-source", config_id: "kimi/shared-config" } },
        provider_models: { "kimi/shared": "shared-model" },
      }),
      buildBundle: () => ({ bundleRoot: root, materialId, dispose() {} }),
      client: {
        async runGroup() {
          return {
            ...publishedGroup(),
            outcome: "completed",
            supplements: [{
              supplement_id: "late-in-window",
              initial_result_ref: "initial-1",
              provider: "kimi/shared",
              arrival_at: 600999,
              findings: [finding("runner-visible supplement")],
            }],
          };
        },
      },
    });
    expect(result).toMatchObject({
      status: "available",
      initial_result_ref: "initial-1",
      publication: publication(),
      supplements: [{
        window_status: "in_window",
        arrival_elapsed_ms: 599999,
      }],
    });
    expect(result.findings).toEqual([finding("runner-visible supplement")]);
  });

  it("rejects malformed, unanchored, and unconfigured supplement findings", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-supplement-invalid-"));
    roots.push(root);
    expect(() => reviewProviderClient.registerReviewSupplement({
      result_ref: "initial-1",
      status: "available",
      findings: [],
      publication: publication(),
      supplements: [],
    }, {
      supplement_id: "malformed",
      initial_result_ref: "initial-1",
      provider: "kimi/shared",
      arrival_at: 1001,
      findings: [{ severity: "major", path: "materials/01-implementation.md" }],
    })).toThrow(/SUPPLEMENT_INVALID/);

    const run = (supplement) => runSimpleReview({
      stage: "build-code",
      host_provider: "codex/host",
      materials: { implementation: "current" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: root }),
      resolveRoute: () => ({ initial: ["kimi/shared"], mode: "full_only", minimum_heterologous: 1 }),
      selectProviders: () => ({
        providers: ["kimi/shared"],
        eligibleProfiles: ["kimi/shared"],
        provider_identities: { "kimi/shared": { source_id: "kimi/shared-source", config_id: "kimi/shared-config" } },
        provider_models: { "kimi/shared": "shared-model" },
      }),
      buildBundle: () => ({ bundleRoot: root, materialId, dispose() {} }),
      client: { async runGroup() { return { ...publishedGroup(), outcome: "completed", supplements: [supplement] }; } },
    });

    await expect(run({
      supplement_id: "unconfigured-provider",
      initial_result_ref: "initial-1",
      provider: "unknown/provider",
      arrival_at: 1001,
      findings: [finding("unconfigured provider")],
    })).resolves.toMatchObject({ status: "unavailable", error: { code: "SUPPLEMENT_PROVIDER_INVALID" } });

    await expect(run({
      supplement_id: "unanchored-finding",
      initial_result_ref: "initial-1",
      provider: "kimi/shared",
      arrival_at: 1001,
      findings: [finding("missing anchor")],
    })).resolves.toMatchObject({ status: "unavailable", error: { code: "EVIDENCE_ANCHOR_INVALID" } });
  });
});
