import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ReviewProviderClient } from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { PACKET_SOURCE_PREFIX, selectTrustedReviewProviderSelection } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const roots = [];
const materialId = "a".repeat(64);

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function brokerFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-external-threshold-"));
  roots.push(root);
  const packetRoot = join(root, "packets");
  mkdirSync(packetRoot);
  const brokerConfig = join(root, "3rd-review.json");
  writeFileSync(brokerConfig, JSON.stringify({
    version: 4,
    tiers: [["kimi/shared", "claude-code/shared"]],
    providers: {
      "codex/host": { enabled: true, source_id: "source-host", model: "host-model" },
      "kimi/shared": { enabled: true, source_id: "source-kimi", model: "shared-model" },
      "claude-code/shared": { enabled: true, source_id: "source-claude", model: "shared-model" },
      "kimi/other": { enabled: true, source_id: "source-kimi-other", model: "other-model" },
    },
    attachment_roots: [{ root: packetRoot, sources: [PACKET_SOURCE_PREFIX] }],
  }));
  return { brokerConfig, packetRoot };
}

function v3Member(provider, model, status = "completed") {
  const adapter = provider.split("/", 1)[0];
  const error = ["completed", "running"].includes(status) ? null : { code: status === "cancelled" ? "PROCESS_CANCELLED" : "PROCESS_DEAD", message: status === "cancelled" ? "member was cancelled" : "member failed" };
  return {
    attempts: status === "running" ? [] : [{
      attempt_id: `${provider}-attempt`,
      completed_at_ms: status === "completed" ? 2 : null,
      duration_ms: status === "completed" ? 1 : null,
      error,
      kind: "initial",
      provider_retry_count: 0,
      session_id: null,
      started_at_ms: 1,
      status,
    }],
    continuable: false,
    deadline_ms: null,
    error,
    identity: { adapter, config_id: `${provider}-config`, model, provider, source_id: `${provider}-source` },
    material: { contract_hash: "contract-hash", contract_id: "contract-id", material_id: materialId, semantic_hash: "semantic-hash" },
    output: status === "completed" ? JSON.stringify({ findings: [] }) : null,
    provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: "runtime-threshold" },
    recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
    result_protocol: "workflowhub-result.v3",
    session_id: null,
    status,
    timing: { completed_at_ms: status === "completed" ? 2 : null, duration_ms: status === "completed" ? 1 : null, started_at_ms: 1 },
    usage: null,
  };
}

function v3Group(members, outcome = "partial") {
  return {
    host_provider: "codex/host",
    material_id: materialId,
    outcome,
    providers: members,
    round: 1,
    runtime_id: "runtime-threshold",
    selected_tier: null,
    version: "workflowhub-result.v3",
  };
}

function runningGroup(members) {
  return {
    ...v3Group(members, "partial"),
    initial_result_ref: null,
    publication: {
      status: "not_published",
      published_at: null,
      published_at_least_sources: 0,
      running_member_count: members.filter((item) => item.status === "running").length,
      append_window: null,
    },
    supplements: [],
  };
}

function runnerSelection() {
  const providers = ["kimi/shared", "claude-code/shared", "kimi/other"];
  return {
    providers,
    provider_identities: Object.fromEntries(providers.map((provider) => [provider, {
      source_id: `${provider}-source`,
      config_id: `${provider}-config`,
    }])),
    provider_models: {
      "kimi/shared": "shared-model",
      "claude-code/shared": "shared-model",
      "kimi/other": "other-model",
    },
  };
}

function runnerDependencies(groupFactory, requests, selectionOverrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-external-threshold-bundle-"));
  roots.push(root);
  return {
    loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: root }),
    resolveRoute: () => ({ initial: ["kimi/shared", "claude-code/shared", "kimi/other"], mode: "full_only", minimum_heterologous: 2 }),
    selectProviders: () => ({ ...runnerSelection(), ...selectionOverrides }),
    buildBundle: () => ({
      bundleRoot: root,
      materialId,
      dispose() {},
    }),
    client: {
      async runGroup(request) {
        requests.push(request);
        return groupFactory(requests.length);
      },
    },
  };
}

describe("external review threshold contract", () => {
  it("sends an explicit positive threshold and accepts running v3 members as running facts", async () => {
    const { packetRoot } = brokerFixture();
    const seen = [];
    const client = new ReviewProviderClient({
      invoke: async ({ request }) => {
        seen.push(request);
        return { exitCode: 0, stdout: JSON.stringify(runningGroup([
          v3Member("kimi/shared", "shared-model", "completed"),
          v3Member("claude-code/shared", "shared-model", "running"),
        ])), stderr: "" };
      },
    });
    const materials = {
      bundleRoot: packetRoot,
      attachmentRoot: packetRoot,
      sourcePrefix: PACKET_SOURCE_PREFIX,
      materialId,
      contractId: "contract-id",
      contractHash: "contract-hash",
      semanticHash: "semantic-hash",
      deliveryManifest: [],
    };

    await expect(client.runGroup({
      hostProvider: "codex/host",
      providers: ["kimi/shared", "claude-code/shared"],
      materials,
      prompt: "review",
      minimumHeterologous: 2,
    })).resolves.toMatchObject({ providers: [{ status: "completed" }, { status: "running" }] });
    expect(seen[0].minimum_heterologous).toBe(2);
    await expect(client.runGroup({
      hostProvider: "codex/host",
      providers: ["kimi/shared"],
      materials,
      prompt: "review",
      minimumHeterologous: 0,
    })).rejects.toThrow(/minimum_heterologous/);
  });

  it("counts distinct underlying models, not adapter or profile names, and rejects impossible thresholds before dispatch", () => {
    const { brokerConfig } = brokerFixture();
    const sameModelAcrossAdapters = {
      initial: ["kimi/shared", "claude-code/shared"],
      mode: "full_only",
      minimum_heterologous: 2,
    };
    expect(() => selectTrustedReviewProviderSelection(brokerConfig, "codex/host", sameModelAcrossAdapters))
      .toThrow(/model|insufficient/i);

    const twoModelsUnderOneAdapter = {
      initial: ["kimi/shared", "kimi/other"],
      mode: "full_only",
      minimum_heterologous: 2,
    };
    expect(selectTrustedReviewProviderSelection(brokerConfig, "codex/host", twoModelsUnderOneAdapter))
      .toMatchObject({ providers: ["kimi/shared", "kimi/other"], provider_models: { "kimi/shared": "shared-model", "kimi/other": "other-model" } });

    expect(() => selectTrustedReviewProviderSelection(brokerConfig, "codex/host", {
      initial: ["kimi/shared"], mode: "full_only",
    })).toThrow(/minimum_heterologous/);
  });

  it("keeps terminal member states truthful and only completed distinct models satisfy the threshold", async () => {
    const requests = [];
    const input = { stage: "build-code", host_provider: "codex/host", materials: { implementation: "current" } };
    const first = await runSimpleReview(input, runnerDependencies(() => v3Group([
      v3Member("kimi/shared", "shared-model", "completed"),
      v3Member("claude-code/shared", "shared-model", "completed"),
      v3Member("kimi/other", "other-model", "running"),
    ]), requests));
    expect(requests[0].minimumHeterologous).toBe(2);
    expect(first).toMatchObject({ status: "unavailable", outcome: "partial", minimum_heterologous: 2 });
    expect(first.provider_results.map(({ status }) => status)).toEqual(["completed", "completed", "running"]);

    const second = await runSimpleReview(input, runnerDependencies(() => v3Group([
      v3Member("kimi/shared", "shared-model", "completed"),
      v3Member("claude-code/shared", "shared-model", "failed"),
      v3Member("kimi/other", "other-model", "completed"),
    ], "completed"), requests));
    expect(second).toMatchObject({ status: "available", outcome: "completed", minimum_heterologous: 2 });
    expect(second.provider_results.map(({ status }) => status)).toEqual(["completed", "failed", "completed"]);

    let calls = 0;
    const impossible = await runSimpleReview(input, {
      ...runnerDependencies(() => v3Group([]), []),
      resolveRoute: () => ({ initial: ["kimi/shared", "claude-code/shared", "kimi/other"], mode: "full_only", minimum_heterologous: 3 }),
      client: { async runGroup() { calls += 1; throw new Error("must not dispatch"); } },
    });
    expect(impossible).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch" });
    expect(impossible.error.code).toMatch(/THRESHOLD|ROUTE/);
    expect(calls).toBe(0);
  });

  it("does not count a completed profile excluded from eligible quorum", async () => {
    const requests = [];
    const input = { stage: "build-code", host_provider: "codex/host", materials: { implementation: "current" } };
    const result = await runSimpleReview(input, runnerDependencies(() => v3Group([
      v3Member("kimi/shared", "shared-model", "completed"),
      v3Member("claude-code/shared", "third-model", "completed"),
      v3Member("kimi/other", "other-model", "failed"),
    ]), requests, {
      eligibleProfiles: ["kimi/shared", "kimi/other"],
      provider_models: { "kimi/shared": "shared-model", "claude-code/shared": "third-model", "kimi/other": "other-model" },
    }));
    // The dispatch group contains all profiles, but only the trusted eligible
    // profiles may satisfy the heterologous threshold.
    expect(result).toMatchObject({ status: "unavailable", minimum_heterologous: 2 });
  });
});
