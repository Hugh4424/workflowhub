import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PACKET_SOURCE_PREFIX, loadTrustedThirdReviewConfig, resolveTrustedReviewRoute, selectTrustedReviewProviderSelection, selectTrustedReviewProviders, validateAllWhReviewRoutes } from "../third-review-host-config.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function configuredRoot() {
  const root = mkdtempSync(join(tmpdir(), "wh-review-host-config-")); roots.push(root);
  const packetRoot = join(root, "packets"); const runtimeRoot = join(root, "runtime"); const home = join(root, "home"); const brokerConfig = join(root, "3rd-review.json");
  mkdirSync(packetRoot); mkdirSync(runtimeRoot); mkdirSync(join(home, ".config", "workflowhub"), { recursive: true });
  writeFileSync(brokerConfig, JSON.stringify({
    version: 4,
    tiers: [["opencode", "kimi"], ["claude-code", "codex"]],
    runtime: { root: runtimeRoot },
    providers: {
      opencode: { enabled: true }, kimi: { enabled: true },
      "claude-code": { enabled: true }, codex: { enabled: true },
    },
    attachment_roots: [{ root: packetRoot, sources: [PACKET_SOURCE_PREFIX] }],
  }));
  const hostConfig = join(home, ".config", "workflowhub", "config.json");
  writeFileSync(hostConfig, JSON.stringify({ task_dir: root, third_review: { command: [process.execPath, "/broker/scripts/3rd-review.mjs"], config: brokerConfig, attachment_root: packetRoot } }));
  return { packetRoot, runtimeRoot, brokerConfig, hostConfig };
}

describe("trusted third-review host configuration", () => {
  it("loads one canonical packet root only when the broker allowlist accepts its packet source", () => {
    const { packetRoot, brokerConfig, hostConfig } = configuredRoot();
    expect(loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toEqual({ command: [process.execPath, "/broker/scripts/3rd-review.mjs"], config: realpathSync(brokerConfig), attachmentRoot: realpathSync(packetRoot), attachmentSource: PACKET_SOURCE_PREFIX });
  });

  it("does not expose or require the broker runtime root", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    const broker = JSON.parse(readFileSync(brokerConfig, "utf8"));
    broker.runtime.root = join(brokerConfig, "..", "runtime-not-present");
    writeFileSync(brokerConfig, JSON.stringify(broker));
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig });
    expect(trusted).not.toHaveProperty("runtimeRoot");
  });

  it("fails loud when the broker allowlist omits the fixed packet source", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    writeFileSync(brokerConfig, JSON.stringify({ version: 4, attachment_roots: [{ root: join(brokerConfig, "..", "packets"), sources: ["skills"] }] }));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toThrow(/packet source.*allowlisted/i);
  });

  it("returns the complete first candidate tier while separately deriving the heterologous quorum", () => {
    const { brokerConfig } = configuredRoot();
    expect(selectTrustedReviewProviders(brokerConfig, "codex")).toEqual(["opencode", "kimi"]);
    expect(selectTrustedReviewProviders(brokerConfig, "opencode")).toEqual(["opencode", "kimi"]);
    expect(selectTrustedReviewProviderSelection(brokerConfig, "opencode").eligibleProfiles).toEqual(["kimi"]);
  });

  it("moves to the next configured tier only when the earlier tier has no eligible provider", () => {
    const { brokerConfig } = configuredRoot();
    const config = JSON.parse(readFileSync(brokerConfig, "utf8"));
    config.providers.opencode.enabled = false;
    config.providers.kimi.enabled = false;
    writeFileSync(brokerConfig, JSON.stringify(config));
    expect(selectTrustedReviewProviders(brokerConfig, "codex")).toEqual(["claude-code", "codex"]);
    expect(selectTrustedReviewProviderSelection(brokerConfig, "codex").eligibleProfiles).toEqual(["claude-code"]);
  });

  it("fails loud when a fallback tier references an unknown provider", () => {
    const { brokerConfig } = configuredRoot();
    const config = JSON.parse(readFileSync(brokerConfig, "utf8"));
    config.tiers[0] = ["missing-provider"];
    writeFileSync(brokerConfig, JSON.stringify(config));
    expect(() => selectTrustedReviewProviders(brokerConfig, "codex"))
      .toThrow(/tier references unknown provider missing-provider/i);
  });

  it("uses a declared wh_review route and excludes the host adapter by profile family", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    const broker = JSON.parse(readFileSync(brokerConfig, "utf8"));
    broker.providers["codex/terra"] = { enabled: true };
    writeFileSync(brokerConfig, JSON.stringify(broker));
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, profiles: {
      "codex/terra": { model: null, effort: null, thinking: null, priority: 1 },
      kimi: { model: null, effort: null, thinking: null, priority: 1 },
      opencode: { model: null, effort: null, thinking: null, priority: 2 },
    }, stages: {
      "build-code": { initial: ["codex/terra", "kimi"], mode: "full_only", minimum_heterologous: 1 },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig });
    const route = resolveTrustedReviewRoute(trusted.whReview, "build-code");
    expect(route).toMatchObject({ initial: ["codex/terra", "kimi"], mode: "full_only", minimum_heterologous: 1 });
    expect(selectTrustedReviewProviders(brokerConfig, "codex", route)).toEqual(["codex/terra", "kimi"]);
    expect(selectTrustedReviewProviderSelection(brokerConfig, "codex", route)).toMatchObject({
      requestedProfiles: ["codex/terra", "kimi"],
      providers: ["codex/terra", "kimi"],
      eligibleProfiles: ["kimi"],
      sameSourceExcluded: ["codex/terra"],
      effectiveProfiles: [{ provider: "kimi", adapter: "kimi", model: null, effort: null, thinking: null }],
    });
  });

  it("loads legacy make-decision single_round routes as bounded delta/full semantics", () => {
    const { hostConfig } = configuredRoot();
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, stages: {
      "make-decision": {
        direction: { initial: ["kimi"], mode: "single_round" },
        detail: { initial: ["opencode"], mode: "single_round" },
      },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig });
    expect(resolveTrustedReviewRoute(trusted.whReview, "make-decision", "direction"))
      .toMatchObject({ initial: ["kimi"], mode: "full_on_structural_rework" });
  });

  it("counts distinct adapters, while retaining all configured profiles for broker attestation", () => {
    const { brokerConfig } = configuredRoot();
    const broker = JSON.parse(readFileSync(brokerConfig, "utf8"));
    broker.providers["kimi/k3"] = { enabled: true, model: "k3", thinking: true };
    broker.providers["kimi/coding"] = { enabled: true, model: "kimi-for-coding", thinking: true };
    broker.providers["claude-code/opus"] = { enabled: true, model: "claude-opus-4-8", effort: "high" };
    writeFileSync(brokerConfig, JSON.stringify(broker));
    const route = {
      initial: ["kimi/k3", "kimi/coding", "claude-code/opus"], mode: "adaptive", minimum_heterologous: 2,
    };
    expect(selectTrustedReviewProviderSelection(brokerConfig, "codex", route)).toMatchObject({
      // The full group is sent to 3rd-review, which is authoritative for
      // SAME_SOURCE facts. WorkflowHub's quorum is adapter, not profile, based.
      requestedProfiles: ["kimi/k3", "kimi/coding", "claude-code/opus"],
      providers: ["kimi/k3", "kimi/coding", "claude-code/opus"],
      eligibleProfiles: ["kimi/k3", "claude-code/opus"],
      effectiveProfiles: [
        { provider: "kimi/k3", adapter: "kimi", model: "k3", effort: null, thinking: true },
        { provider: "claude-code/opus", adapter: "claude-code", model: "claude-opus-4-8", effort: "high", thinking: null },
      ],
    });
    expect(() => selectTrustedReviewProviderSelection(brokerConfig, "codex", { ...route, minimum_heterologous: 3 }))
      .toThrow(/insufficient enabled heterologous providers/i);
  });

  it("pins declared profile tuples, requires priority order, and preserves those pins for dispatch", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    const broker = JSON.parse(readFileSync(brokerConfig, "utf8"));
    broker.providers["claude-code/opus"] = { enabled: true, model: "claude-opus-4-8", effort: "high" };
    broker.providers["kimi/coding"] = { enabled: true, model: "kimi-for-coding", thinking: true };
    broker.providers["kimi/k3"] = { enabled: true, model: "k3", thinking: true };
    writeFileSync(brokerConfig, JSON.stringify(broker));
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, profiles: {
      "claude-code/opus": { model: "claude-opus-4-8", effort: "high", thinking: null, priority: 10 },
      "kimi/coding": { model: "kimi-for-coding", effort: null, thinking: true, priority: 20 },
      "kimi/k3": { model: "k3", effort: null, thinking: true, priority: 30 },
    }, stages: {
      "build-code": { initial: ["claude-code/opus", "kimi/coding", "kimi/k3"], mode: "full_only", minimum_heterologous: 2 },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig });
    const route = resolveTrustedReviewRoute(trusted.whReview, "build-code");
    expect(route).toMatchObject({
      initial: ["claude-code/opus", "kimi/coding", "kimi/k3"],
      profile_priorities: { "claude-code/opus": 10, "kimi/coding": 20, "kimi/k3": 30 },
    });
    expect(selectTrustedReviewProviderSelection(brokerConfig, "codex", route)).toMatchObject({
      requestedProfiles: ["claude-code/opus", "kimi/coding", "kimi/k3"],
      requestedProfileSpecs: [
        { provider: "claude-code/opus", model: "claude-opus-4-8", effort: "high", thinking: null, priority: 10 },
        { provider: "kimi/coding", model: "kimi-for-coding", effort: null, thinking: true, priority: 20 },
        { provider: "kimi/k3", model: "k3", effort: null, thinking: true, priority: 30 },
      ],
      providers: ["claude-code/opus", "kimi/coding", "kimi/k3"],
      eligibleProfiles: ["claude-code/opus", "kimi/coding"],
    });
    host.wh_review.profiles["kimi/k3"].model = "wrong";
    writeFileSync(hostConfig, JSON.stringify(host));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toThrow(/kimi\/k3\.model must match/i);
    host.wh_review.profiles["kimi/k3"].model = "k3";
    host.wh_review.profiles["kimi/k3"].priority = 15;
    writeFileSync(hostConfig, JSON.stringify(host));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toThrow(/must be ordered by ascending/i);
  });

  it("fails loud for a declared disabled route instead of using a legacy tier", () => {
    const { brokerConfig } = configuredRoot();
    const broker = JSON.parse(readFileSync(brokerConfig, "utf8"));
    broker.providers.kimi.enabled = false;
    writeFileSync(brokerConfig, JSON.stringify(broker));
    expect(() => selectTrustedReviewProviders(brokerConfig, "codex", { initial: ["kimi"], mode: "adaptive" })).toThrow(/disabled/i);
  });

  it("accepts full_on_structural_rework without a closure route and rejects a hidden closure fallback", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, stages: {
      "build-spec": { initial: ["kimi", "claude-code"], mode: "full_on_structural_rework", minimum_heterologous: 2 },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    expect(resolveTrustedReviewRoute(loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig }).whReview, "build-spec"))
      .toEqual({ initial: ["kimi", "claude-code"], mode: "full_on_structural_rework", minimum_heterologous: 2 });
    host.wh_review.stages["build-spec"].closure = ["kimi"];
    writeFileSync(hostConfig, JSON.stringify(host));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toThrow(/closure.*adaptive/i);
  });

  it("rejects V2 modes that could reopen a cheap non-code closure review", () => {
    const { hostConfig } = configuredRoot();
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, stages: {
      "build-plan": { initial: ["kimi", "claude-code"], closure: ["kimi"], mode: "adaptive", minimum_heterologous: 2 },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig }))
      .toThrow(/build-plan\.mode must be full_on_structural_rework/i);
  });

  it("uses the legacy tier when wh_review or the current stage is absent", () => {
    expect(resolveTrustedReviewRoute(null, "build-code")).toBeNull();
    expect(resolveTrustedReviewRoute({ version: 2, stages: {} }, "build-code")).toBeNull();
  });

  it("keeps non-current route errors as warnings while doctor remains strict", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    const broker = JSON.parse(readFileSync(brokerConfig, "utf8"));
    broker.providers["claude-code/opus"] = { enabled: true, model: "claude-opus-4-8", effort: "high" };
    writeFileSync(brokerConfig, JSON.stringify(broker));
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, profiles: {
      kimi: { model: null, effort: null, thinking: null, priority: 20 },
      "claude-code/opus": { model: "claude-opus-4-8", effort: "high", thinking: null, priority: 10 },
    }, stages: {
      "build-code": { initial: ["kimi"], mode: "full_only" },
      "build-plan": { initial: ["claude-code/opus", "kimi"], mode: "full_on_structural_rework" },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig, requestedStage: "build-code" });
    expect(trusted.routeWarnings).toEqual([]);
    host.wh_review.stages["build-plan"].initial = ["kimi", "claude-code/opus"];
    writeFileSync(hostConfig, JSON.stringify(host));
    const hot = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig, requestedStage: "build-code" });
    expect(hot.routeWarnings).toHaveLength(1);
    expect(() => validateAllWhReviewRoutes(hot.whReview)).toThrow(/ascending/i);
  });

  it("returns the validated current route without mutating provider order", () => {
    const { hostConfig } = configuredRoot();
    const host = JSON.parse(readFileSync(hostConfig, "utf8"));
    host.wh_review = { version: 2, profiles: {
      kimi: { model: null, effort: null, thinking: null, priority: 1 },
      opencode: { model: null, effort: null, thinking: null, priority: 2 },
    }, stages: {
      "build-code": { initial: ["kimi", "opencode"], mode: "full_only", minimum_heterologous: 1 },
    } };
    writeFileSync(hostConfig, JSON.stringify(host));
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig, requestedStage: "build-code" });
    expect(trusted.whReview.stages["build-code"].initial).toEqual(["kimi", "opencode"]);
  });
});
