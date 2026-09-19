import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  createSimpleReviewPacket,
  dispatchFrozenProviderInput,
  rehydrateProviderInput,
  runSimpleReview,
  serializeProviderInput,
} from "../simple-review-runner.mjs";
import { selectTrustedReviewProviderSelection } from "../third-review-host-config.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function canonicalMaterialId(entries) {
  const normalized = entries
    .filter((entry) => !["manifest.json", "canonical-evidence.json"].includes(entry.path))
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256: sha256.toLowerCase() }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function completeBuildPrdMaterials() {
  return {
    decision_log: "# Decision\\n\\nThe direction is frozen.\\n",
    prd: "# PRD\\n\\nThe complete product requirements are here.\\n",
    task_map: "## Task map\\n\\n- T001 owns the user result.\\n",
    design_facts: { ui_applicability: "non_ui", status: "not_applicable" },
    quality_facts: { status: "unavailable", coverage: "unknown" },
  };
}

// Shared by the static-preflight and neutral-identity suites. It simulates only
// the host dependencies; production defaults still resolve the trusted route.
function trustedDependencies(attachmentRoot, {
  route = { initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 },
  selection = { providers: ["other/model"], provider_models: { "other/model": "other-model" } },
  broker = null,
  callLog = null,
} = {}) {
  let brokerCalls = 0;
  const dependencies = {
    loadConfig: () => {
      callLog?.push("loadConfig");
      return {
        whReview: {},
        config: "/unused/config.json",
        attachmentRoot,
        command: ["unused"],
        brokerProbe: { status: "unknown", reason: "probe intentionally unavailable" },
      };
    },
    resolveRoute: () => {
      callLog?.push("resolveRoute");
      return route;
    },
    selectProviders: () => {
      callLog?.push("selectProviders");
      return selection;
    },
    client: {
      async runGroup(request) {
        callLog?.push("runGroup");
        brokerCalls += 1;
        return broker?.(request) ?? { runtimeId: "runtime-preflight", outcome: "unavailable", providers: [] };
      },
    },
  };
  return { dependencies, calls: () => brokerCalls };
}

function providerSelectionFor(providers, models = {}) {
  return {
    providers: [...providers],
    provider_identities: Object.fromEntries(providers.map((provider, index) => [provider, {
      source_id: `preflight-source-${index}`,
      config_id: `preflight-config-${index}`,
    }])),
    provider_models: Object.fromEntries(providers.map((provider, index) => [provider, models[provider] ?? `preflight-model-${index}`])),
  };
}

function preparedBundle(attachmentRoot) {
  return {
    bundleRoot: join(attachmentRoot, "bundle"),
    attachmentRoot,
    sourcePrefix: "bundle",
    materialId: "a".repeat(64),
    deliveryManifest: [],
    dispose() {},
  };
}

function buildCodePhaseMaterials() {
  return {
    approved_spec: "approved spec",
    acceptance_criteria: "acceptance criteria",
    test_evidence: "test evidence",
  };
}

describe("simple material-only review", () => {
  it("rehydrates and dispatches only the exact serialized provider input", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "frozen-wh-review-")));
    roots.push(attachmentRoot);
    const packet = createSimpleReviewPacket({ stage: "verify-code", materials: { implementation: "A bytes", tests: "test bytes" } });
    const bytes = serializeProviderInput({
      packet, hostProvider: "codex", providers: ["other/model"], reviewMode: "single_round", prompt: "review exact bytes",
    });
    const restored = rehydrateProviderInput(bytes, attachmentRoot);
    expect(restored.materials.materialId).toBe(packet.material_id);
    expect(readFileSync(join(restored.materials.bundleRoot, "materials/01-implementation.md"), "utf8")).toBe("A bytes");
    restored.materials.dispose();

    const seen = [];
    await dispatchFrozenProviderInput({
      bytes,
      attachmentRoot,
      client: { async runGroup(request) {
        seen.push({ strictProtocol: request.strictProtocol, materialId: request.materials.materialId,
          implementation: readFileSync(join(request.materials.bundleRoot, "materials/01-implementation.md"), "utf8") });
        return { outcome: "completed" };
      } },
    });
    expect(seen).toEqual([{ strictProtocol: true, materialId: packet.material_id, implementation: "A bytes" }]);
    expect(() => rehydrateProviderInput(Buffer.from("{}"), attachmentRoot)).toThrow(/invalid/);
  });

  it("rejects unknown or tampered envelope metadata before provider dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "frozen-wh-review-envelope-tamper-")));
    roots.push(attachmentRoot);
    const packet = createSimpleReviewPacket({ stage: "verify-code", materials: { implementation: "A bytes" } });
    const bytes = serializeProviderInput({
      packet,
      hostProvider: "codex",
      providers: ["other/model"],
      providerIdentities: { "other/model": { source_id: "review-source", config_id: "review-config" } },
      reviewMode: "single_round",
      prompt: "review exact bytes",
      subjectBinding: { task_id: "task-1", material_revision: "revision-1" },
      reviewPolicy: { source: "wh_review.v2", mode: "single_round" },
    });
    const original = JSON.parse(bytes.toString("utf8"));
    const tamperCases = [
      ["unknown top-level field", (value) => { value.extra = "unexpected"; }],
      ["host provider", (value) => { value.host_provider = "forged-host"; }],
      ["providers", (value) => { value.providers = ["forged/model"]; }],
      ["provider identities", (value) => { value.provider_identities["other/model"].source_id = "forged-source"; }],
      ["review mode", (value) => { value.review_mode = "adaptive"; }],
      ["prompt", (value) => { value.prompt = "forged prompt"; }],
      ["subject binding", (value) => { value.subject_binding.task_id = "forged-task"; }],
      ["review policy", (value) => { value.review_policy.mode = "forged-mode"; }],
    ];
    const calls = [];
    for (const [label, mutate] of tamperCases) {
      const tampered = structuredClone(original);
      mutate(tampered);
      const tamperedBytes = Buffer.from(`${JSON.stringify(tampered)}\\n`, "utf8");
      expect(() => rehydrateProviderInput(tamperedBytes, attachmentRoot), label)
        .toThrow(/invalid|unsupported|integrity/i);
      await expect(dispatchFrozenProviderInput({
        bytes: tamperedBytes,
        attachmentRoot,
        client: { async runGroup() { calls.push(label); return { outcome: "completed" }; } },
      })).rejects.toThrow(/invalid|unsupported|integrity/i);
    }
    expect(calls).toHaveLength(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("enforces build-prd allowlist and canonical generated instructions on direct packet creation", () => {
    const base = completeBuildPrdMaterials();
    expect(() => createSimpleReviewPacket({
      stage: "build-prd", review_kind: "build_prd", materials: { ...base, review_instructions: "caller spoof" },
    })).toThrow(/MATERIAL_FORBIDDEN/);
    expect(() => createSimpleReviewPacket({
      stage: "build-prd", review_kind: "build_prd", materials: { ...base, approved_spec: "forbidden" },
    })).toThrow(/MATERIAL_FORBIDDEN/);
    expect(() => createSimpleReviewPacket({
      stage: "build-prd", review_kind: "build_prd", materials: { ...base, mystery: "unknown" },
    })).toThrow(/MATERIAL_FORBIDDEN/);

    const packet = createSimpleReviewPacket({ stage: "build-prd", review_kind: "build_prd", materials: base });
    expect(packet.stage).toBe("build-prd");
    expect(packet.review_kind).toBe("build_prd");
    expect(packet.review_instructions).toBeUndefined();
    expect(packet.materials.map(({ key }) => key)).toEqual(Object.keys(base));
  });

  it("rehydrates only a contract-valid build-prd packet and leaves no packet directory on tamper", () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "frozen-wh-review-build-prd-tamper-")));
    roots.push(attachmentRoot);
    const packet = createSimpleReviewPacket({
      stage: "build-prd", review_kind: "build_prd", materials: completeBuildPrdMaterials(),
    });
    const bytes = serializeProviderInput({
      packet, hostProvider: "codex", providers: ["other/model"], reviewMode: "single_round", prompt: "review",
    });
    const tampered = JSON.parse(bytes.toString("utf8"));
    const spoof = Buffer.from("caller spoof", "utf8");
    const entry = tampered.packet.materials.find(({ key }) => key === "decision_log");
    entry.content_base64 = spoof.toString("base64");
    entry.sha256 = createHash("sha256").update(spoof).digest("hex");
    tampered.packet.materials.push({
      key: "review_instructions", value_kind: "text", content_base64: spoof.toString("base64"), sha256: entry.sha256,
    });
    const tamperedBytes = Buffer.from(`${JSON.stringify(tampered)}\\n`, "utf8");
    expect(() => rehydrateProviderInput(tamperedBytes, attachmentRoot)).toThrow(/MATERIAL_FORBIDDEN|identity|integrity|invalid/i);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("rejects build-prd serialized packet tampering before dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "frozen-wh-review-build-prd-dispatch-tamper-")));
    roots.push(attachmentRoot);
    const packet = createSimpleReviewPacket({
      stage: "build-prd", review_kind: "build_prd", materials: completeBuildPrdMaterials(),
    });
    const bytes = serializeProviderInput({
      packet, hostProvider: "codex", providers: ["other/model"], reviewMode: "single_round", prompt: "review",
    });
    const tampered = JSON.parse(bytes.toString("utf8"));
    tampered.packet.materials[0].key = "approved_spec";
    const tamperedBytes = Buffer.from(`${JSON.stringify(tampered)}\\n`, "utf8");
    const calls = [];
    await expect(dispatchFrozenProviderInput({
      bytes: tamperedBytes, attachmentRoot,
      client: { async runGroup() { calls.push("runGroup"); return { outcome: "completed" }; } },
    })).rejects.toThrow(/MATERIAL_FORBIDDEN|identity|integrity|invalid/i);
    expect(calls).toEqual([]);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  // Corrected contract: authenticated-evidence.json is provider-visible delivered
  // material, so it belongs to the delivered material identity exactly as the
  // broker's canonicalWorkflowHubMaterialId counts it. Previously the declared
  // identity excluded it while the broker included it, so every packet carrying
  // authenticated evidence was rejected as an invalid managed lifecycle envelope.
  // The base/supplemental distinction is carried by authenticated_evidence_sha256.
  it("includes authenticated supplemental evidence in the delivered material identity", () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "frozen-wh-review-supplemental-")));
    roots.push(attachmentRoot);
    const base = { stage: "build-code", materials: { implementation: "current bytes" } };
    const packetA = createSimpleReviewPacket({
      ...base,
      authenticated_evidence: { schema_version: "m401-trace.v1", material_id: "a".repeat(64), actual_result: "pass" },
    });
    const packetB = createSimpleReviewPacket({
      ...base,
      authenticated_evidence: { schema_version: "m401-trace.v1", material_id: "b".repeat(64), actual_result: "pass" },
    });
    expect(packetA.material_id).not.toBe(createSimpleReviewPacket(base).material_id);
    expect(packetB.material_id).not.toBe(packetA.material_id);
    expect(packetA.authenticated_evidence_sha256).not.toBe(packetB.authenticated_evidence_sha256);

    const bytes = serializeProviderInput({
      packet: packetA,
      hostProvider: "codex",
      providers: ["other/model"],
      reviewMode: "single_round",
    });
    const restored = rehydrateProviderInput(bytes, attachmentRoot);
    try {
      expect(restored.materials.materialId).toBe(packetA.material_id);
      expect(restored.materials).not.toHaveProperty("materialIdentityConflict");
      const evidencePath = join(restored.materials.bundleRoot, "authenticated-evidence.json");
      expect(readFileSync(evidencePath, "utf8")).toContain('"actual_result":"pass"');
      const manifest = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "manifest.json"), "utf8"));
      expect(manifest.files.map(({ path }) => path)).toEqual([
        "review-instructions.md",
        "materials/01-implementation.md",
        "authenticated-evidence.json",
      ]);
      const evidenceEntry = manifest.files.find(({ path }) => path === "authenticated-evidence.json");
      expect(evidenceEntry.sha256).toBe(createHash("sha256").update(readFileSync(evidencePath)).digest("hex"));
    } finally {
      restored.materials.dispose();
    }
  });

  it("computes material_id from sorted semantic entries and excludes transport entries", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-matid-contract-")));
    roots.push(attachmentRoot);
    let observed;
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { zebra: "zebra bytes", alpha: "alpha bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: {
        async runGroup(request) {
          const manifest = JSON.parse(readFileSync(join(request.materials.bundleRoot, "manifest.json"), "utf8"));
          const manifestBytes = readFileSync(join(request.materials.bundleRoot, "manifest.json"));
          observed = {
            materialId: request.materials.materialId,
            entries: [
              ...manifest.files,
              { path: "manifest.json", bytes: manifestBytes.length, sha256: createHash("sha256").update(manifestBytes).digest("hex") },
              { path: "canonical-evidence.json", bytes: 17, sha256: "f".repeat(64) },
            ],
          };
          return { runtimeId: "runtime-matid-contract", outcome: "completed", providers: [] };
        },
      },
    });
    expect(result.status).toBe("unavailable");
    expect(observed.materialId).toBe(canonicalMaterialId(observed.entries));
    await expect(runSimpleReview({ stage: "build-code", host_provider: "codex", materials: {} }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
    })).rejects.toThrow("materials are required");
  });

  it("uses one material identity for a bounded verify-code diff", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-bounded-identity-")));
    roots.push(attachmentRoot);
    const input = {
      stage: "verify-code",
      host_provider: "codex",
      materials: {
        "implementation-diff.patch": [
          "diff --git a/runtime/review-seam.mjs b/runtime/review-seam.mjs",
          "--- a/runtime/review-seam.mjs",
          "+++ b/runtime/review-seam.mjs",
          "@@ -1,1 +1,1 @@",
          "+" + "implementation ".repeat(10000),
          "diff --git a/tests/review-seam.test.mjs b/tests/review-seam.test.mjs",
          "--- a/tests/review-seam.test.mjs",
          "+++ b/tests/review-seam.test.mjs",
          "@@ -1,1 +1,1 @@",
          "+" + "test ".repeat(3000),
        ].join("\n"),
      },
    };
    let providerMaterialId = null;
    const result = await runSimpleReview(input, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: {
        async runGroup(request) {
          providerMaterialId = request.materials.materialId;
          return { runtimeId: "runtime-bounded-identity", outcome: "completed", material_id: providerMaterialId, providers: [{
            provider: "other/model", status: "completed", identity: { provider: "other/model", model: "other-model" }, error: null,
            output: JSON.stringify({ findings: [] }), timing: null, usage: null,
          }] };
        },
      },
    });
    expect(result.status).toBe("available");
    expect(providerMaterialId).toBe(createSimpleReviewPacket(input).material_id);
    expect(result.material_id).toBe(providerMaterialId);
    const packet = createSimpleReviewPacket(input);
    const restored = rehydrateProviderInput(serializeProviderInput({
      packet, hostProvider: "codex", providers: ["other/model"], reviewMode: "single_round", prompt: "review",
    }), attachmentRoot);
    expect(restored.materials.materialId).toBe(packet.material_id);
    restored.materials.dispose();
  });

  it("rejects a broker material identity that differs from the submitted bundle", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-broker-matid-mismatch-")));
    roots.push(attachmentRoot);
    const input = {
      stage: "build-code",
      host_provider: "codex",
      materials: { implementation: "current implementation" },
    };
    const bundleMaterialId = createSimpleReviewPacket(input).material_id;
    const forgedMaterialId = "f".repeat(64);
    const result = await runSimpleReview(input, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: { async runGroup(request) {
        expect(request.strictProtocol).toBe(true);
        return {
          runtimeId: "runtime-forged-material-id",
          outcome: "completed",
          material_id: forgedMaterialId,
          providers: [{
            provider: "other/model", status: "completed", identity: { provider: "other/model" }, error: null,
            output: JSON.stringify({ findings: [] }), timing: null, usage: null,
          }],
        };
      } },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      material_id: bundleMaterialId,
      runtime_id: "runtime-forged-material-id",
      outcome: "completed",
      provider_results: [],
      findings: [],
      error: {
        code: "REVIEW_MATERIAL_IDENTITY_MISMATCH",
      },
    });
    expect(result.material_id).not.toBe(forgedMaterialId);
  });

  it.each(["direction", "detail"])("dispatches one red/blue pair for make-decision %s", async (reviewTrack) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), `simple-wh-review-red-blue-${reviewTrack}-`)));
    roots.push(attachmentRoot);
    const calls = [];
    const result = await runSimpleReview({
      stage: "make-decision",
      review_track: reviewTrack,
      host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: {
        async runGroup(request) {
          calls.push({ pair_id: request.pair_id, role: request.role, materialId: request.materials.materialId });
          return {
            runtimeId: `runtime-${request.role}`, outcome: "completed",
            providers: [{
              provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
              output: JSON.stringify({ findings: [] }), timing: null, usage: null,
            }],
          };
        },
      },
    });
    expect(calls).toHaveLength(2);
    expect(new Set(calls.map(({ pair_id }) => pair_id)).size).toBe(1);
    expect(calls.map(({ role }) => role).sort()).toEqual(["blue", "red"]);
    expect(new Set(calls.map(({ materialId }) => materialId)).size).toBe(1);
    expect(result).toMatchObject({ status: "available", pair_id: calls[0].pair_id });
    expect(result.role_results).toEqual(expect.objectContaining({
      red: expect.objectContaining({ pair_id: calls[0].pair_id, role: "red" }),
      blue: expect.objectContaining({ pair_id: calls[0].pair_id, role: "blue" }),
    }));
  });

  // AC-C4-023 / FR-C4-004: the dispatch state belongs to the paired aggregate
  // result itself, not only inside role_results.red/blue.
  it("exposes the pair dispatch state on the aggregate result", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-pair-dispatch-")));
    roots.push(attachmentRoot);
    const dispatched = await runSimpleReview({
      stage: "make-decision", review_track: "detail", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup(request) {
        return { runtimeId: `runtime-${request.role}`, outcome: "completed", providers: [{
          provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
          output: JSON.stringify({ findings: [] }), timing: null, usage: null,
        }] };
      } },
    });
    expect(dispatched.status).toBe("available");
    expect(Object.keys(dispatched)).toContain("dispatch_state");
    expect(dispatched.dispatch_state).toBe("dispatched");
  });

  it("reports a blocked pair at the aggregate top level too", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-pair-blocked-")));
    roots.push(attachmentRoot);
    const blocked = await runSimpleReview({
      stage: "make-decision", review_track: "detail", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
      client: { async runGroup() { throw new Error("a blocked pair must not dispatch"); } },
    });
    expect(blocked.status).toBe("unavailable");
    expect(blocked.error.code).toBe("ROUTE_UNAVAILABLE");
    expect(blocked.role_results.red.dispatch_state).toBe("blocked_before_dispatch");
    expect(blocked.dispatch_state).toBe("blocked_before_dispatch");
  });

  it("keeps pair role metadata when a paired provider member identity is degraded", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-pair-identity-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "make-decision", review_track: "direction", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" }, provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-pair-identity", outcome: "unavailable", providers: [{
          provider: "model-a", status: "failed",
          identity: { provider: "model-a", source_id: "rogue-source", config_id: "rogue-config" },
          error: null, timing: null, usage: null,
        }] };
      } },
    });
    expect(result.provider_results.map(({ role }) => role).sort()).toEqual(["blue", "red"]);
    expect(result.provider_results.every(({ pair_id, role, identity_degraded }) => pair_id === result.pair_id
      && ["red", "blue"].includes(role) && identity_degraded === true)).toBe(true);
  });

  it("marks a pair with mismatched material identities as partial", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-pair-material-mismatch-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "make-decision", review_track: "direction", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      pairId: "pair-material-mismatch",
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup(request) {
        return {
          material_id: request.role === "red" ? request.materials.materialId : "f".repeat(64),
          runtimeId: `runtime-${request.role}`, outcome: "completed", providers: [{
            provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
            output: JSON.stringify({ findings: [] }), timing: null, usage: null,
          }],
        };
      } },
    });
    expect(result).toMatchObject({
      status: "available-with-failures", pair_status: "partial", material_consistency: "consistent",
      blue_incomplete: true,
    });
    expect(result.role_results.blue).toMatchObject({
      status: "unavailable",
      material_id: result.role_results.red.material_id,
      error: { code: "REVIEW_MATERIAL_IDENTITY_MISMATCH" },
      provider_results: [],
      findings: [],
    });
    expect(result.material_id).toBe(result.role_results.red.material_id);
    expect(result.material_ids.red).toBe(result.material_ids.blue);
  });

  it.each(["red", "blue"])("marks %s incomplete while retaining the other role", async (incompleteRole) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), `simple-wh-review-pair-${incompleteRole}-incomplete-`)));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "make-decision", review_track: "detail", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      pairId: `pair-${incompleteRole}-incomplete`,
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup(request) {
        if (request.role === incompleteRole) {
          return { runtimeId: `runtime-${request.role}`, outcome: "unavailable", providers: [{
            provider: "model-a", status: "failed", identity: { provider: "model-a" },
            error: { code: "RATE_LIMITED", message: "fixture" }, timing: null, usage: null,
          }] };
        }
        return { runtimeId: `runtime-${request.role}`, outcome: "completed", providers: [{
          provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
          output: JSON.stringify({ findings: [] }), timing: null, usage: null,
        }] };
      } },
    });
    expect(result).toMatchObject({ status: "available-with-failures", [`${incompleteRole}_incomplete`]: true });
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: incompleteRole, status: "failed", error: expect.objectContaining({ code: "RATE_LIMITED" }) }),
      expect.objectContaining({ role: incompleteRole === "red" ? "blue" : "red", status: "completed" }),
    ]));
  });

  it("retains successful providers when one role has a single provider failure", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-pair-provider-failure-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "make-decision", review_track: "direction", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      pairId: "pair-provider-failure",
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a", "model-b"], provider_models: { "model-a": "model-a-model", "model-b": "model-b-model" } }),
      client: { async runGroup(request) {
        const failed = request.role === "red";
        return { runtimeId: `runtime-${request.role}`, outcome: failed ? "partial" : "completed", providers: [
          { provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null },
          { provider: "model-b", status: failed ? "failed" : "completed", identity: { provider: "model-b", model: "model-b-model" }, error: failed ? { code: "RATE_LIMITED", message: "fixture" } : null, output: failed ? undefined : JSON.stringify({ findings: [] }), timing: null, usage: null },
        ] };
      } },
    });
    expect(result).toMatchObject({ status: "available-with-failures", red_incomplete: true });
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "model-a", role: "red", status: "completed" }),
      expect.objectContaining({ provider: "model-b", role: "red", status: "failed", error: expect.objectContaining({ code: "RATE_LIMITED" }) }),
      expect.objectContaining({ provider: "model-b", role: "blue", status: "completed" }),
    ]));
  });

  it("reviews submitted bytes without Workspace or TaskHandle", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-")));
    roots.push(attachmentRoot);
    const calls = [];
    const result = await runSimpleReview({
      stage: "make-decision",
      review_track: "detail",
      host_provider: "codex",
      task_path: "/does/not/exist",
      project_name: "ignored",
      task_id: "ignored",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: {
        async runGroup(request) {
          calls.push({
            prompt: request.prompt,
            instructions: readFileSync(join(request.materials.bundleRoot, "review-instructions.md"), "utf8"),
            decision: readFileSync(join(request.materials.bundleRoot, "materials/01-decision.md"), "utf8"),
          });
          return {
            runtimeId: "runtime-1", outcome: "completed",
            providers: [{
              provider: "other/model", status: "completed", identity: { provider: "other/model", model: "other-model" }, error: null,
              output: JSON.stringify({ findings: [{ severity: "minor", path: "materials/01-decision.md", line: 1, issue: "gap", recommendation: "fix" }] }),
              timing: null, usage: null,
            }],
          };
        },
      },
    });
    expect(result).toMatchObject({ status: "available", stage: "make-decision", review_track: "detail" });
    expect(result.findings).toHaveLength(1);
    expect(result.provider_results[0].evidence_anchor_valid).toEqual([true]);
    expect(calls).toHaveLength(2);
    expect(calls[0].decision).toBe("current decision bytes");
    expect(calls[0].instructions).toContain("complete user flow");
    expect(calls[0].prompt).toContain("Return exactly one JSON object");
    expect(calls[0].prompt).toContain("sample below.\n\nExample of a complete finding:");
    expect(calls[0].prompt).not.toContain("sample below.\\n\\n");
  });

  it("gives verify-code a code-only scope", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-verify-scope-")));
    roots.push(attachmentRoot);
    let instructions;
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex",
      materials: { implementation: "current implementation", tests: "current tests" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: {
        async runGroup(request) {
          instructions = readFileSync(join(request.materials.bundleRoot, "review-instructions.md"), "utf8");
          return { runtimeId: "runtime-verify-scope", outcome: "completed", providers: [] };
        },
      },
    });
    expect(result.status).toBe("unavailable");
    expect(instructions).toContain("Check only the submitted implementation and test code");
    for (const excluded of ["T010 status", "AC coverage", "repository-wide gate status", "review packet/material completeness", "release/close status"])
      expect(instructions).toContain(excluded);
  });

  it("requires only stage, host provider, and materials", async () => {
    await expect(runSimpleReview({ stage: "make-decision", host_provider: "codex", materials: {} }))
      .rejects.toThrow("materials are required");
  });

  it("marks a single provider as failed when its output is malformed and keeps other provider findings", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-bad-output-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", spec: "spec body" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a", "model-b"], provider_models: { "model-a": "model-a-model", "model-b": "model-b-model" } }),
      client: {
        async runGroup() {
          return {
            runtimeId: "runtime-bad", outcome: "partial",
            providers: [
              {
                provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
                output: "not-json", timing: null, usage: null,
              },
              {
                provider: "model-b", status: "completed", identity: { provider: "model-b", model: "model-b-model" }, error: null,
                output: JSON.stringify({ findings: [{ severity: "major", path: "materials/02-spec.md", line: 1, issue: "gap", recommendation: "fix", root_cause: "missing test", evidence_kind: "direct", evidence: "none" }] }),
                timing: null, usage: null,
              },
            ],
          };
        },
      },
    });
    expect(result).toMatchObject({ status: "available", stage: "build-code" });
    expect(result.provider_results).toHaveLength(2);
    expect(result.provider_results[0]).toMatchObject({ provider: "model-a", status: "failed", error: { code: "OUTPUT_INVALID" } });
    expect(result.provider_results[1]).toMatchObject({ provider: "model-b", status: "completed" });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ severity: "major", path: "materials/02-spec.md", provider: "model-b" });
    expect(result.provider_results[1].evidence_anchor_valid).toEqual([true]);
    expect(result).not.toHaveProperty("error_code");
    expect(result).not.toHaveProperty("attempt_ref");
  });

  it("does not treat findings with invalid evidence anchors as semantic", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-anchor-invalid-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: {
        async runGroup() {
          return {
            runtimeId: "runtime-anchor-invalid", outcome: "completed",
            providers: [{
              provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
              output: JSON.stringify({ findings: [{
                severity: "major", path: "materials/missing.md", line: 1,
                issue: "gap", recommendation: "fix", root_cause: "fixture",
                evidence_kind: "direct", evidence: "missing file",
              }] }), timing: null, usage: null,
            }],
          };
        },
      },
    });
    expect(result).toMatchObject({
      status: "unavailable",
      error: { code: "EVIDENCE_ANCHOR_INVALID" },
      findings: [],
      provider_results: [{ status: "failed", error: { code: "EVIDENCE_ANCHOR_INVALID" }, evidence_anchor_valid: [false] }],
    });
  });

  it("redacts host paths from provider transport errors", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-error-redaction-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup() { throw new Error("broker failed at /tmp/private-review/config.json"); } },
    });
    expect(result).toMatchObject({ status: "unavailable", error: { code: "REVIEW_BROKER_EXIT_NONZERO" } });
    expect(result.error.message).not.toContain("/tmp/private-review");
  });

  it.each([
    ["unix", "/private/provider logs/review.json"],
    ["windows", "C:\\Users\\reviewer\\provider logs\\review.json"],
    ["unc", "\\\\review-host\\share\\provider logs\\review.json"],
  ])("redacts %s provider-level error paths while preserving its code", async (_label, path) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-provider-error-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-error", outcome: "unavailable", providers: [{
          provider: "model-a", status: "failed", identity: { provider: "model-a" },
          error: { code: "AUTH_FAILED", message: `provider failed at ${path}` },
          timing: null, usage: null,
        }] };
      } },
    });
    expect(result.provider_results[0].error).toMatchObject({ code: "AUTH_FAILED" });
    expect(result.provider_results[0].error.message).not.toContain(path);
    expect(result.provider_results[0].error.message).toContain("<host-path-redacted>");
  });

  it("records selected providers omitted by a partial broker response as explicit failures", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-provider-missing-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a", "model-b"], provider_models: { "model-a": "model-a-model", "model-b": "model-b-model" } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-partial", outcome: "partial", providers: [{
          provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null,
          output: JSON.stringify({ findings: [] }), timing: null, usage: null,
        }] };
      } },
    });
    expect(result.status).toBe("available");
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "model-b", status: "failed", error: expect.objectContaining({ code: "PROVIDER_RESULT_MISSING" }) }),
    ]));
  });

  it.each([
    ["malformed output", "OUTPUT_INVALID", "REVIEW_PROVIDER_OUTPUT_INVALID"],
    ["provider timeout", "PROCESS_TIMEOUT", "REVIEW_EXECUTION_TIMEOUT"],
    ["provider rate limit", "RATE_LIMITED", "RATE_LIMITED"],
  ])("returns a concrete error when every provider has %s", async (label, sourceCode, publicCode) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-all-failed-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: {
        async runGroup() {
          const provider = sourceCode === "OUTPUT_INVALID"
            ? {
              provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" },
              error: null, output: "not-json", timing: null, usage: null,
            }
            : {
              provider: "model-a", status: "failed", identity: { provider: "model-a" },
              error: { code: sourceCode, message: `${label} fixture` }, timing: null, usage: null,
            };
          return {
            runtimeId: "runtime-all-failed", outcome: "unavailable",
            providers: [provider],
          };
        },
      },
    });
    expect(result).toMatchObject({ status: "unavailable", error: { code: publicCode } });
    expect(result.provider_selection).toMatchObject({ providers: ["model-a"] });
    if (publicCode !== sourceCode) expect(result.error.cause_code).toBe(sourceCode);
  });

  it.each([
    ["timeout", "PROCESS_TIMEOUT", "REVIEW_EXECUTION_TIMEOUT"],
    ["cancel", "PROCESS_CANCELLED", "REVIEW_CANCELLED"],
    ["legacy unavailable", "REVIEW_PROVIDER_UNAVAILABLE", "REVIEW_NO_SEMANTIC_RESULT"],
  ])("classifies a broker rejection without calling it provider unavailable (%s)", async (_label, sourceCode, publicCode) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-rejection-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup() { throw Object.assign(new Error("broker fixture"), { code: sourceCode }); } },
    });
    expect(result).toMatchObject({ status: "unavailable", error: { code: publicCode } });
    expect(result).not.toMatchObject({ error: { code: "REVIEW_PROVIDER_UNAVAILABLE" } });
  });

  it.each([
    ["prompt too long", "PROVIDER_HEALTH_FAILED", "API status 400: prompt too long; input token limit exceeded", "REVIEW_INPUT_TOO_LARGE"],
    ["response wait timeout", "PROCESS_EXIT_NONZERO", "Error: timeout waiting for response", "REVIEW_EXECUTION_TIMEOUT"],
  ])("preserves concrete provider transport categories (%s)", async (_label, sourceCode, message, publicCode) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-classification-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-classification", outcome: "unavailable", providers: [{
          provider: "model-a", status: "failed", identity: { provider: "model-a" },
          error: { code: sourceCode, message }, timing: null, usage: null,
        }] };
      } },
    });
    expect(result).toMatchObject({ status: "unavailable", error: { code: publicCode, cause_code: sourceCode } });
  });

  it("RESULT_PROMPT contains a parseable sample finding", async () => {
    const source = readFileSync(new URL("../simple-review-runner.mjs", import.meta.url), "utf8");
    const match = source.match(/Example of a complete finding:\\n(\{[\s\S]*\})\\nExample of an empty result/);
    expect(match).toBeTruthy();
    const sample = match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    const parsed = JSON.parse(sample);
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]).toHaveProperty("severity");
    expect(parsed.findings[0]).toHaveProperty("evidence_kind");
  });

  it("returns a recordable unavailable result when route loading fails", async () => {
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex/luna",
      materials: { implementation: "implementation bytes" },
    }, {
      loadConfig: () => { throw new Error("route config is unavailable"); },
    });
    expect(result).toMatchObject({
      status: "unavailable",
      error: { code: "ROUTE_UNAVAILABLE" },
      runtime_id: null,
      provider_results: [],
      findings: [],
    });
    expect(result.material_id).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves the broker error code when a provider member identity is degraded", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-identity-degraded-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" }, provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-identity-degraded", outcome: "unavailable", providers: [{
          provider: "model-a", status: "failed",
          identity: { provider: "model-a", source_id: "model-a", config_id: "model-a" },
          error: { code: "PUBLIC_RESULT_INVALID", message: "provider output exposes private host path /Users/Hugh/Downloads/make-decision调研深度优化方案.md" },
          timing: null, usage: null,
        }] };
      } },
    });
    const member = result.provider_results[0];
    expect(member).toMatchObject({ provider: "model-a", status: "failed", identity_degraded: true });
    expect(member.error.code).toBe("PUBLIC_RESULT_INVALID");
    expect(member.error.code).not.toBe("PROVIDER_IDENTITY_INVALID");
    expect(member.error.message).toContain("broker member identity was degraded");
    expect(member.error.message).not.toContain("/Users/");
  });

  it("keeps PROVIDER_IDENTITY_INVALID for a degraded member without a broker error", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-identity-plain-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" }, provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-identity-plain", outcome: "unavailable", providers: [{
          provider: "model-a", status: "failed",
          identity: { provider: "model-a", source_id: "rogue-source", config_id: "rogue-config" },
          error: null, timing: null, usage: null,
        }] };
      } },
    });
    const member = result.provider_results[0];
    expect(member).toMatchObject({ status: "failed", identity_degraded: true });
    expect(member.error.code).toBe("PROVIDER_IDENTITY_INVALID");
    expect(member.error.message).toContain("broker member identity was degraded");
  });

  it("records an unavailable route when the broker omits a bindable provider identity", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-missing-provider-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" }, provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
      client: { async runGroup() {
        return { runtimeId: "runtime-missing-provider", outcome: "unavailable", providers: [{
          status: "failed", identity: null, error: { code: "PROCESS_EXIT_NONZERO", message: "provider exited" },
        }] };
      } },
    });
    expect(result).toMatchObject({
      status: "unavailable",
      runtime_id: "runtime-missing-provider",
      provider_results: [],
      provider_selection: { providers: ["model-a"] },
      error: { code: "PROVIDER_RESULT_INVALID" },
    });
  });

  it("adds the trusted adapter when managed lifecycle normalizes selected identity", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-managed-identity-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" }, provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
      client: { async startManaged() {
        return { state: "terminal", group: { runtime_id: "runtime-managed-identity", outcome: "completed", providers: [{
          provider: "model-a", status: "completed", output: JSON.stringify({ findings: [] }), error: null, timing: null, usage: null,
        }] } };
      } },
    });
    expect(result).toMatchObject({
      status: "available",
      provider_results: [{
        provider: "model-a",
        identity: { provider: "model-a", adapter: "model-a", source_id: "trusted-source", config_id: "trusted-config" },
      }],
    });
  });

  it("keeps polling when one managed member failed but a running member can still satisfy quorum", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-managed-wait-")));
    roots.push(attachmentRoot);
    const statuses = [
      {
        state: "running",
        runtime_id: "runtime-managed-wait",
        providers: {
          "model-a": { status: "failed", error: { code: "RATE_LIMITED" }, last_progress_at_ms: 1 },
          "model-b": { status: "running", error: null, last_progress_at_ms: 2 },
        },
      },
      {
        state: "terminal",
        group: {
          runtime_id: "runtime-managed-wait",
          outcome: "completed",
          providers: [
            { provider: "model-a", status: "completed", output: JSON.stringify({ findings: [] }), error: null, timing: null, usage: null },
            { provider: "model-b", status: "completed", output: JSON.stringify({ findings: [] }), error: null, timing: null, usage: null },
          ],
        },
      },
    ];
    let statusCalls = 0;
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => providerSelectionFor(["model-a", "model-b"], { "model-a": "model-a-model", "model-b": "model-b-model" }),
      managedStatusPollMs: 0,
      managedTerminalWaitMs: 1000,
      client: {
        async startManaged() { return { state: "running", runtime_id: "runtime-managed-wait" }; },
        async statusManaged() { return statuses[statusCalls++]; },
      },
    });

    expect(statusCalls).toBe(2);
    expect(result).toMatchObject({ status: "available", outcome: "completed" });
  });

});

describe("review flow static preflight", () => {
  it("blocks missing required caller material before bundle, lock, or broker and exposes only the diagnostic fields", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-missing-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot);
    const secret = "/Users/Hugh/private/review-input.md";
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials: { raw_requirement: `sensitive ${secret}`, approved_decision: "decision" },
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_results: [],
      findings: [],
      error: {
        code: "MATERIAL_INCOMPLETE",
        diagnostic: {
          field: "draft_spec",
          expected: "non-empty caller material",
          actual: "missing",
          next_action: "supply current material and retry",
        },
      },
    });
    expect(Object.keys(result.error.diagnostic).sort()).toEqual(["actual", "expected", "field", "next_action"]);
    expect(JSON.stringify(result.error)).not.toContain(secret);
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it.each([
    ["empty route", { initial: [], mode: "single_round" }, { providers: ["other/model"] }, "route"],
    ["same-source route", { initial: ["codex/luna"], mode: "single_round" }, new Error("SAME_SOURCE: host and reviewer share an adapter"), "host_provider"],
  ])("rejects %s before provider dispatch", async (_label, route, selection, field) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-route-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot, { route });
    if (selection instanceof Error) dependencies.selectProviders = () => { throw selection; };
    else dependencies.selectProviders = () => selection;
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", approved_decision: "decision", draft_spec: "spec" },
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "ROUTE_UNAVAILABLE", diagnostic: { field } },
    });
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("does not block a legal request when broker health is unknown and does not require generated materials", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-unknown-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot, {
      broker: async () => ({ runtimeId: "runtime-unknown-health", outcome: "unavailable", providers: [] }),
    });
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", approved_decision: "decision", draft_spec: "spec" },
    }, dependencies);

    expect(calls()).toBe(1);
    expect(result).toMatchObject({ status: "unavailable", outcome: "unavailable" });
    expect(result).not.toHaveProperty("dispatch_state", "blocked_before_dispatch");
    expect(result.error?.code).not.toBe("ROUTE_UNAVAILABLE");
  });

  it("resolves the configured build-prd non-stage route before provider dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-build-prd-route-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot, {
      broker: async () => ({ runtimeId: "runtime-build-prd-route", outcome: "unavailable", providers: [] }),
    });
    const result = await runSimpleReview({
      stage: "build-prd",
      review_kind: "build_prd",
      host_provider: "codex",
      materials: completeBuildPrdMaterials(),
    }, dependencies);

    expect(calls()).toBe(1);
    expect(result).toMatchObject({ status: "unavailable", outcome: "unavailable" });
    expect(result.error?.code).not.toBe("MATERIAL_INCOMPLETE");
  });

  it("fails closed for unknown material keys on integration review requests", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-unknown-integration-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code",
      review_scope: "integration",
      host_provider: "codex",
      materials: { mystery_material: "unrecognized" },
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "MATERIAL_FORBIDDEN", diagnostic: { field: "mystery_material", actual: "unknown" } },
    });
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("rejects an unknown material alongside valid build-spec materials before provider dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-valid-unknown-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials: {
        raw_requirement: "requirement",
        approved_decision: "decision",
        draft_spec: "spec",
        junk_material: "must not dispatch",
      },
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_results: [],
      findings: [],
      error: { code: "MATERIAL_FORBIDDEN", diagnostic: { field: "junk_material", actual: "unknown" } },
    });
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("rejects junk-only build-prd materials before route/provider dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-build-prd-junk-")));
    roots.push(attachmentRoot);
    const calls = [];
    const { dependencies } = trustedDependencies(attachmentRoot, { callLog: calls });
    const result = await runSimpleReview({
      stage: "build-prd",
      review_kind: "build_prd",
      host_provider: "codex",
      materials: { junk_material: "must not dispatch" },
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_results: [],
      findings: [],
      error: { code: "MATERIAL_FORBIDDEN", diagnostic: { field: "junk_material", actual: "unknown" } },
    });
    expect(calls).toEqual([]);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("runs the build-prd allowlist before route resolution for unknown-only materials", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-static-preflight-build-prd-order-")));
    roots.push(attachmentRoot);
    const calls = [];
    const result = await runSimpleReview({
      stage: "build-prd",
      review_kind: "build_prd",
      host_provider: "codex",
      materials: { unknown_only: "must not dispatch" },
    }, {
      loadConfig: () => { calls.push("loadConfig"); throw new Error("loadConfig must not run"); },
      resolveRoute: () => { calls.push("resolveRoute"); throw new Error("resolveRoute must not run"); },
      selectProviders: () => { calls.push("selectProviders"); throw new Error("selectProviders must not run"); },
      client: { async runGroup() { calls.push("runGroup"); return { outcome: "completed" }; } },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "MATERIAL_FORBIDDEN", diagnostic: { field: "unknown_only", actual: "unknown" } },
      provider_results: [],
      findings: [],
    });
    expect(calls).toEqual([]);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  // AC-PREFLIGHT-001 / FR-PREFLIGHT-001: the invalid host must be rejected by
  // the trusted host-config seam before the runner can create a bundle or ask
  // the provider client to acquire its dispatch/claim boundary.
  it("blocks an unsupported host_provider before bundle, lock, or dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-host-provider-preflight-")));
    roots.push(attachmentRoot);
    const brokerConfig = join(attachmentRoot, "3rd-review.json");
    writeFileSync(brokerConfig, JSON.stringify({
      version: 4,
      tiers: [["antigravity/flash"]],
      providers: {
        "antigravity/flash": { enabled: true, source_id: "preflight-source", model: "gemini-3.8-flash-high" },
      },
    }));
    const route = { initial: ["antigravity/flash"], mode: "single_round", minimum_heterologous: 1 };
    const events = [];
    let dispatches = 0;
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "claude",
      preflight: true,
      materials: buildCodePhaseMaterials(),
    }, {
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => route,
      selectProviders: (configPath, hostProvider, selectedRoute) =>
        selectTrustedReviewProviderSelection(configPath, hostProvider, selectedRoute),
      buildBundle: () => { events.push("bundle"); return preparedBundle(attachmentRoot); },
      client: { async runGroup() {
        events.push("lock", "dispatch");
        dispatches += 1;
        return { runtimeId: "runtime-invalid-host", outcome: "unavailable", providers: [] };
      } },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_attempts: 0,
    });
    expect(dispatches).toBe(0);
    expect(events).toEqual([]);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  // AC-PREFLIGHT-002 / FR-PREFLIGHT-002: keep every probe's machine code and
  // the existing four-field diagnostic shape at the public blocked boundary.
  it.each([
    ["model id", "MODEL_ID_INVALID", {
      field: "model_id", expected: "provider CLI model list", actual: "agy-model-not-listed",
      next_action: "repair the provider model and retry",
    }],
    ["CLI", "CLI_UNAVAILABLE", {
      field: "cli", expected: "executable provider CLI", actual: "missing-cli",
      next_action: "install or repair the provider CLI and retry",
    }],
    ["authentication", "AUTH_INVALID", {
      field: "auth", expected: "valid native or env authentication", actual: "required credential is missing",
      next_action: "repair provider authentication and retry",
    }],
    ["active probe", "ACTIVE_PROBE_FAILED", {
      field: "active_probe", expected: "provider responds to the lightweight probe", actual: "probe exited non-zero",
      next_action: "repair provider availability and retry",
    }],
  ])("blocks a provider with an invalid %s before bundle, lock, or dispatch", async (label, code, diagnostic) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-provider-preflight-")));
    roots.push(attachmentRoot);
    const provider = "antigravity/flash";
    const selection = providerSelectionFor([provider], { [provider]: "agy-model-not-listed" });
    const route = { initial: [provider], mode: "single_round", minimum_heterologous: 1 };
    const events = [];
    let dispatches = 0;
    const { dependencies, calls } = trustedDependencies(attachmentRoot, {
      route,
      selection,
      callLog: events,
    });
    dependencies.providerPreflight = ({ provider: currentProvider } = {}) => {
      events.push(`preflight:${currentProvider}`);
      return {
        provider: currentProvider,
        status: "blocked",
        error: { code, message: `${label} preflight failed`, diagnostic },
      };
    };
    dependencies.buildBundle = () => { events.push("bundle"); return preparedBundle(attachmentRoot); };
    dependencies.client = { async runGroup() {
      events.push("lock", "dispatch");
      dispatches += 1;
      return {
        runtimeId: "runtime-provider-preflight",
        outcome: "unavailable",
        providers: [{
          provider,
          status: "failed",
          identity: { provider, adapter: "antigravity", ...selection.provider_identities[provider] },
          error: { code: "RUNTIME_FIXTURE", message: "provider was reached" },
          timing: null,
          usage: null,
        }],
      };
    } };

    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      preflight: true,
      materials: buildCodePhaseMaterials(),
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_attempts: 0,
      error: { code, diagnostic },
    });
    expect(events).toContain(`preflight:${provider}`);
    expect(events).not.toContain("bundle");
    expect(events).not.toContain("lock");
    expect(events).not.toContain("dispatch");
    expect(dispatches).toBe(0);
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("RED: maps a preflight-blocked provider to the public failed result contract", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-provider-preflight-partial-")));
    roots.push(attachmentRoot);
    const blockedProvider = "antigravity/flash";
    const healthyProvider = "kimi/coding";
    const selection = providerSelectionFor([blockedProvider, healthyProvider], {
      [blockedProvider]: "agy-model-not-listed",
      [healthyProvider]: "kimi-for-coding",
    });
    const route = { initial: [blockedProvider, healthyProvider], mode: "single_round", minimum_heterologous: 1 };
    const events = [];
    const dispatchProviders = [];
    const { dependencies } = trustedDependencies(attachmentRoot, { route, selection, callLog: events });
    dependencies.providerPreflight = ({ provider } = {}) => {
      events.push(`preflight:${provider}`);
      return provider === blockedProvider
        ? {
            provider,
            status: "blocked",
            error: {
              code: "MODEL_ID_INVALID",
              message: "model is not listed by the provider CLI",
              diagnostic: {
                field: "model_id", expected: "provider CLI model list", actual: "agy-model-not-listed",
                next_action: "repair the provider model and retry",
              },
            },
          }
        : { provider, status: "ready" };
    };
    dependencies.buildBundle = () => { events.push("bundle"); return preparedBundle(attachmentRoot); };
    dependencies.client = { async runGroup(request) {
      events.push("lock", "dispatch");
      dispatchProviders.push([...request.providers]);
      return {
        runtimeId: "runtime-provider-preflight-partial",
        outcome: "completed",
        providers: [{
          provider: healthyProvider,
          status: "completed",
          identity: {
            provider: healthyProvider,
            adapter: "kimi",
            ...selection.provider_identities[healthyProvider],
            model: selection.provider_models[healthyProvider],
          },
          error: null,
          output: JSON.stringify({ findings: [] }),
          timing: null,
          usage: null,
        }],
      };
    } };

    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      preflight: true,
      materials: buildCodePhaseMaterials(),
    }, dependencies);

    expect(result).toMatchObject({ status: "available", dispatch_state: "dispatched", provider_attempts: 1 });
    const blockedOutput = result.provider_results.find(({ provider }) => provider === blockedProvider);
    expect(blockedOutput).toMatchObject({
      provider: blockedProvider,
      status: "failed",
      error: expect.objectContaining({ code: "PROVIDER_HEALTH_FAILED" }),
    });
    expect(result.provider_results.map(({ status }) => status)).not.toContain("blocked");
    expect(dispatchProviders).toEqual([[healthyProvider]]);
    expect(events.indexOf(`preflight:${blockedProvider}`)).toBeGreaterThanOrEqual(0);
    expect(events.indexOf(`preflight:${healthyProvider}`)).toBeGreaterThanOrEqual(0);
    expect(events.indexOf("bundle")).toBeGreaterThan(events.indexOf(`preflight:${healthyProvider}`));
  });

  // AC-PREFLIGHT-003 / FR-PREFLIGHT-003: a static probe can pass while an
  // antigravity-style exit-0/empty-output failure appears only at runtime.
  it("keeps a runtime agy timeout as a dispatched provider failure, not a static preflight capture", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-provider-preflight-runtime-")));
    roots.push(attachmentRoot);
    const provider = "antigravity/flash";
    const selection = providerSelectionFor([provider], { [provider]: "gemini-3.8-flash-high" });
    const route = { initial: [provider], mode: "single_round", minimum_heterologous: 1 };
    const events = [];
    const { dependencies } = trustedDependencies(attachmentRoot, { route, selection, callLog: events });
    dependencies.providerPreflight = ({ provider: currentProvider } = {}) => {
      events.push(`preflight:${currentProvider}`);
      return { provider: currentProvider, status: "ready" };
    };
    dependencies.buildBundle = () => { events.push("bundle"); return preparedBundle(attachmentRoot); };
    dependencies.client = { async runGroup() {
      events.push("lock", "dispatch");
      return {
        runtimeId: "runtime-agy-timeout",
        outcome: "unavailable",
        providers: [{
          provider,
          status: "failed",
          identity: { provider, adapter: "antigravity", ...selection.provider_identities[provider], model: selection.provider_models[provider] },
          error: { code: "PROCESS_TIMEOUT", message: "agy print timeout after 5m0s with empty stdout" },
          execution: { process_outcome: "timeout", parse_outcome: "empty_output" },
          timing: null,
          usage: null,
        }],
      };
    } };

    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      preflight: true,
      materials: buildCodePhaseMaterials(),
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "dispatched",
      provider_attempts: 1,
      error: { code: "REVIEW_EXECUTION_TIMEOUT", cause_code: "PROCESS_TIMEOUT" },
      provider_results: [{
        provider,
        status: "failed",
        error: { code: "PROCESS_TIMEOUT" },
        execution: { process_outcome: "timeout", parse_outcome: "empty_output" },
      }],
    });
    expect(events).toContain(`preflight:${provider}`);
    expect(events).toContain("dispatch");
    expect(result.dispatch_state).not.toBe("blocked_before_dispatch");
  });
});

function p4Finding(overrides = {}) {
  return {
    severity: "minor",
    path: "materials/01-implementation.md",
    line: 1,
    issue: "P4 format tolerance fixture",
    recommendation: "retain the semantic finding",
    root_cause: "format fixture",
    evidence_kind: "direct",
    evidence: "implementation line 1",
    ...overrides,
  };
}

async function runP4Provider({ output = null, error = null, materials = {
  implementation: "implementation line 1\nimplementation line 2\n",
} } = {}) {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-p4-format-")));
  roots.push(attachmentRoot);
  const { dependencies } = trustedDependencies(attachmentRoot);
  dependencies.client = { async runGroup() {
    return {
      runtimeId: "runtime-p4-format",
      outcome: error ? "unavailable" : "completed",
      providers: [{
        provider: "other/model",
        status: error ? "failed" : "completed",
        identity: { provider: "other/model", model: "other-model" },
        error,
        ...(error ? {} : { output }),
        timing: null,
        usage: null,
      }],
    };
  } };
  return runSimpleReview({ stage: "build-code", host_provider: "codex", materials }, dependencies);
}

describe("T007 P4 format tolerance", () => {
  // AC-FORMAT-003 / OPEN-003: JSONL has precedence and contributes every
  // parseable findings row instead of falling through to one JSON candidate.
  it("prefers JSONL and collects findings from every parseable row", async () => {
    const first = p4Finding({ issue: "jsonl first" });
    const second = p4Finding({ line: 2, issue: "jsonl second" });
    const result = await runP4Provider({
      output: [
        JSON.stringify({ trace_id: "first-row", findings: [first] }),
        JSON.stringify({ findings: [second] }),
      ].join("\n"),
    });

    expect(result).toMatchObject({ status: "available", findings: [
      expect.objectContaining({ issue: "jsonl first", severity: "minor", provider: "other/model" }),
      expect.objectContaining({ issue: "jsonl second", severity: "minor", provider: "other/model" }),
    ] });
    expect(result.provider_results[0]).toMatchObject({ status: "completed", evidence_anchor_valid: [true, true] });
  });

  it("selects the unique findings-bearing fence when multiple fences are present", async () => {
    const finding = p4Finding({ issue: "unique fenced finding" });
    const result = await runP4Provider({
      output: [
        "provider explanation",
        "```json",
        JSON.stringify({ note: "not a review result" }),
        "```",
        "```json",
        JSON.stringify({ findings: [finding] }),
        "```",
      ].join("\n"),
    });

    expect(result).toMatchObject({
      status: "available",
      findings: [expect.objectContaining({ issue: "unique fenced finding", provider: "other/model" })],
      provider_results: [{ status: "completed", evidence_anchor_valid: [true] }],
    });
  });

  it("extracts nested findings from a larger object and ignores top-level extra keys", async () => {
    const finding = p4Finding({ issue: "nested finding" });
    const result = await runP4Provider({
      output: JSON.stringify({
        response: { payload: { findings: [finding] } },
        trace_id: "ignored-top-level-key",
      }),
    });

    expect(result).toMatchObject({
      status: "available",
      findings: [expect.objectContaining({ issue: "nested finding", provider: "other/model" })],
    });
    expect(result.provider_results[0]).toMatchObject({ status: "completed", evidence_anchor_valid: [true] });
  });

  it("accepts extra top-level keys beside findings", async () => {
    const finding = p4Finding({ issue: "extra-key finding" });
    const result = await runP4Provider({
      output: JSON.stringify({ findings: [finding], trace_id: "ignored" }),
    });

    expect(result).toMatchObject({
      status: "available",
      findings: [expect.objectContaining({ issue: "extra-key finding", provider: "other/model" })],
      provider_results: [{ status: "completed", evidence_anchor_valid: [true] }],
    });
  });

  it("uses the first parseable JSON candidate when JSONL and fence extraction do not apply", async () => {
    const first = p4Finding({ issue: "first candidate" });
    const later = p4Finding({ issue: "later candidate" });
    const result = await runP4Provider({
      output: `provider prose: ${JSON.stringify({ findings: [first] })} then ${JSON.stringify({ findings: [later] })}`,
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ issue: "first candidate", provider: "other/model" });
    expect(result.provider_results[0]).toMatchObject({ status: "completed", evidence_anchor_valid: [true] });
  });

  it.each([
    ["blocker", "blocking"], ["critical", "blocking"], ["fatal", "blocking"],
    ["important", "major"], ["moderate", "major"], ["warning", "major"], ["significant", "major"],
    ["nit", "minor"], ["trivial", "minor"], ["suggestion", "minor"], ["info", "minor"], ["note", "minor"],
  ])("normalizes severity alias %s to %s", async (alias, canonical) => {
    const result = await runP4Provider({ output: JSON.stringify({ findings: [p4Finding({ severity: alias, issue: `${alias} alias` })] }) });

    expect(result).toMatchObject({
      status: "available",
      findings: [expect.objectContaining({ severity: canonical, issue: `${alias} alias`, provider: "other/model" })],
      provider_results: [{ status: "completed", evidence_anchor_valid: [true] }],
    });
  });

  it("drops only an unknown-severity finding and keeps the provider completed", async () => {
    const kept = p4Finding({ issue: "known severity" });
    const dropped = p4Finding({ severity: "unrecognized-severity", issue: "drop only this finding" });
    const result = await runP4Provider({ output: JSON.stringify({ findings: [kept, dropped] }) });

    expect(result).toMatchObject({
      status: "available",
      findings: [expect.objectContaining({ issue: "known severity", severity: "minor", provider: "other/model" })],
      provider_results: [{ status: "completed", evidence_anchor_valid: [true] }],
    });
    expect(result.findings).toHaveLength(1);
  });

  it("returns structured OUTPUT_INVALID with the parser error when all candidates are invalid", async () => {
    const result = await runP4Provider({
      output: [
        "provider prose",
        '{"findings":[}',
        "```json",
        '{"findings":[}',
        "```",
      ].join("\n"),
    });

    expect(result).toMatchObject({
      status: "unavailable",
      findings: [],
      provider_results: [{
        status: "failed",
        error: { code: "OUTPUT_INVALID", parse_error: expect.any(String) },
      }],
    });
    expect(result.provider_results[0].error.parse_error).toMatch(/JSON|fence|findings/i);
  });
});

describe("neutral review instruction identity and trusted selection", () => {
  it("keeps the runtime packet identity equal to the skill packet identity for every formal surface", async () => {
    const { reviewPacketMaterialId } = await import("../../../../runtime/review/review-packet-identity.mjs");
    const surfaces = [
      { stage: "make-decision", review_track: "direction", materials: { decision: "direction bytes" } },
      { stage: "make-decision", review_track: "detail", materials: { decision: "detail bytes" } },
      { stage: "build-spec", materials: { spec: "build-spec bytes" } },
      { stage: "build-plan", materials: { plan: "build-plan bytes" } },
      { stage: "build-code", review_scope: "phase", materials: { implementation: "phase bytes" } },
      { stage: "build-code", review_scope: "integration", materials: { implementation: "integration bytes" } },
      { stage: "verify-code", materials: { implementation: "verify bytes" } },
    ];
    for (const input of surfaces) {
      const label = `${input.stage}/${input.review_track ?? input.review_scope ?? ""}`;
      expect(reviewPacketMaterialId(input), label).toBe(createSimpleReviewPacket(input).material_id);
    }
  });

  it("distinguishes the two make-decision tracks and the two build-code scopes", async () => {
    const { reviewPacketMaterialId } = await import("../../../../runtime/review/review-packet-identity.mjs");
    const direction = reviewPacketMaterialId({ stage: "make-decision", review_track: "direction", materials: { decision: "same bytes" } });
    const detail = reviewPacketMaterialId({ stage: "make-decision", review_track: "detail", materials: { decision: "same bytes" } });
    const phase = reviewPacketMaterialId({ stage: "build-code", review_scope: "phase", materials: { implementation: "same bytes" } });
    const integration = reviewPacketMaterialId({ stage: "build-code", review_scope: "integration", materials: { implementation: "same bytes" } });
    expect(new Set([direction, detail, phase, integration]).size).toBe(4);
  });

  it("fails closed instead of inventing an instruction source for build_prd", async () => {
    const { reviewPacketMaterialId } = await import("../../../../runtime/review/review-packet-identity.mjs");
    expect(() => reviewPacketMaterialId({
      stage: "build-prd", review_kind: "build_prd", materials: completeBuildPrdMaterials(),
    })).toThrow(/instruction source is required for build_prd/);
  });

  it("rejects caller-supplied review_instructions before the broker and never writes a packet", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-caller-instructions-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot);
    const materials = {
      raw_requirement: "requirement",
      approved_decision: "decision",
      draft_spec: "spec",
      review_instructions: "caller spoof",
    };
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials,
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_results: [],
      findings: [],
      error: { code: "MATERIAL_FORBIDDEN", diagnostic: { field: "review_instructions", actual: "caller-supplied" } },
    });
    expect(calls()).toBe(0);
    expect(() => createSimpleReviewPacket({ stage: "build-spec", materials })).toThrow(/MATERIAL_FORBIDDEN/);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("generates the instruction source itself and never exposes it as a packet material", () => {
    const packet = createSimpleReviewPacket({
      stage: "build-code",
      materials: { implementation: "current implementation" },
    });
    expect(packet.materials.map(({ key }) => key)).not.toContain("review_instructions");
    expect(packet.materials.map(({ key }) => key)).toEqual(["implementation"]);
  });

  it("rejects a binary material the host-path redaction boundary cannot inspect", () => {
    expect(() => createSimpleReviewPacket({
      stage: "build-code",
      materials: { implementation: Buffer.from("/Users/Hugh/private/secret.md") },
    })).toThrow(/MATERIAL_FORBIDDEN.*binary material/);
  });

  it("blocks a binary material before the provider and writes no packet", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-binary-material-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { implementation: Buffer.from("/Users/Hugh/private/secret.md") },
    }, dependencies);

    expect(result).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch" });
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("binds authenticated evidence with the same canonical bytes as the runtime recorder", async () => {
    const { authenticatedEvidenceDigest } = await import("../../../../runtime/review/review-packet-identity.mjs");
    const evidence = { ref: "quality/x.json", note: "see /Users/Hugh/private/secret.md" };
    const packet = createSimpleReviewPacket({
      stage: "build-code",
      materials: { implementation: "current implementation" },
      authenticated_evidence: evidence,
    });

    expect(packet.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(evidence));
    // The recorded projection is the redacted one; the digest must not be the
    // raw-value hash, which is what made a path-bearing value unrecordable.
    expect(JSON.stringify(packet.authenticated_evidence)).not.toContain("/Users/Hugh/private/secret.md");
    expect(packet.authenticated_evidence_sha256).not.toBe(
      createHash("sha256").update(`${JSON.stringify(evidence)}\n`).digest("hex"),
    );
  });

  it("lets a host-supplied bundle keep its own validated review_instructions template", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-host-bundle-")));
    roots.push(attachmentRoot);
    let dispatches = 0;
    const hostBundle = {
      materialId: "d".repeat(64),
      bundleRoot: join(attachmentRoot, "host-bundle"),
      dispose() {},
    };
    const result = await runSimpleReview({
      stage: "build-code",
      review_scope: "phase",
      host_provider: "codex",
      materials: {
        approved_spec: "spec",
        acceptance_criteria: "AC",
        test_evidence: "evidence",
        review_instructions: "host validated fixed stage template",
      },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      buildBundle: () => hostBundle,
      client: { async runGroup() {
        dispatches += 1;
        return { runtimeId: "runtime-host-bundle", outcome: "completed", material_id: hostBundle.materialId, providers: [] };
      } },
    });

    expect(dispatches).toBe(1);
    expect(result.error?.code).not.toBe("MATERIAL_FORBIDDEN");
  });

  it.each([
    ["null identity", { providers: ["other/model"], provider_identities: { "other/model": null } }],
    ["scalar identity", { providers: ["other/model"], provider_identities: { "other/model": "trusted-source" } }],
    ["extra identity key", { providers: ["other/model"], provider_identities: {
      "other/model": { source_id: "trusted-source", config_id: "trusted-config" },
      "extra/model": { source_id: "trusted-source", config_id: "trusted-config" },
    } }],
    ["missing identity key", { providers: ["other/model", "third/model"], provider_identities: {
      "other/model": { source_id: "trusted-source", config_id: "trusted-config" },
    } }],
    ["empty source id", { providers: ["other/model"], provider_identities: { "other/model": { source_id: "   ", config_id: "trusted-config" } } }],
    ["unknown identity field", { providers: ["other/model"], provider_identities: { "other/model": {
      source_id: "trusted-source", config_id: "trusted-config", model: "smuggled",
    } } }],
  ])("rejects a %s trusted provider selection before dispatch", async (_label, selection) => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-selection-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot, { selection });
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", approved_decision: "decision", draft_spec: "spec" },
    }, dependencies);

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "ROUTE_UNAVAILABLE", diagnostic: { field: "provider_selection" } },
    });
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });

  it("still accepts a provider selection without an identity map", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-selection-omitted-")));
    roots.push(attachmentRoot);
    const { dependencies, calls } = trustedDependencies(attachmentRoot, {
      broker: async () => ({ runtimeId: "runtime-omitted-identity", outcome: "unavailable", providers: [] }),
    });
    const result = await runSimpleReview({
      stage: "build-spec",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", approved_decision: "decision", draft_spec: "spec" },
    }, dependencies);

    expect(calls()).toBe(1);
    expect(result.error?.code).not.toBe("ROUTE_UNAVAILABLE");
  });
});

describe("direction review flow transport parity", () => {
  const DIRECTION_FLOW = Object.freeze({
    version: "direction-review.v1",
    public_request_count: 1,
    steps: [
      { id: "reconstruct", visible: ["raw_requirement", "objective_facts"], hidden_until: "reveal" },
      { id: "reveal", after: ["reconstruct"], visible: ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"] },
      { id: "challenge", after: ["reveal"], visible: ["revealed_choice", "independent_reconstruction"], output: "findings" },
    ],
    output: { one_provider_result: true, one_logical_fact: true },
  });

  it("forwards the governed direction flow to the unmanaged provider transport", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-direction-flow-")));
    roots.push(attachmentRoot);
    const seen = [];
    const result = await runSimpleReview({
      stage: "make-decision",
      review_track: "direction",
      host_provider: "codex",
      materials: { decision: "current decision bytes" },
      review_flow: DIRECTION_FLOW,
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: { async runGroup(request) {
        seen.push(request.reviewFlow ?? null);
        return { runtimeId: "runtime-direction-flow", outcome: "unavailable", providers: [] };
      } },
    });

    expect(seen).toHaveLength(2);
    expect(seen.every((flow) => flow?.version === "direction-review.v1")).toBe(true);
    expect(seen.every((flow) => flow.steps.map((step) => step.id).join(">") === "reconstruct>reveal>challenge")).toBe(true);
    expect(result.stage).toBe("make-decision");
  });

  it("uses one provider input envelope per role and never opens a second round", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-direction-single-round-")));
    roots.push(attachmentRoot);
    const materialIds = [];
    await runSimpleReview({
      stage: "make-decision",
      review_track: "direction",
      host_provider: "codex",
      materials: { decision: "current decision bytes" },
      review_flow: DIRECTION_FLOW,
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["other/model"], provider_models: { "other/model": "other-model" } }),
      client: { async runGroup(request) {
        materialIds.push(request.materials.materialId);
        return { runtimeId: "runtime-single-round", outcome: "unavailable", providers: [] };
      } },
    });

    expect(materialIds).toHaveLength(2);
    expect(new Set(materialIds).size).toBe(1);
  });
});
