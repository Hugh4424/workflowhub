import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
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

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function canonicalMaterialId(entries) {
  const normalized = entries
    .filter((entry) => !["manifest.json", "canonical-evidence.json"].includes(entry.path))
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256: sha256.toLowerCase() }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
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

  it("binds authenticated supplemental evidence without changing the base material identity", () => {
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
    expect(packetA.material_id).toBe(createSimpleReviewPacket(base).material_id);
    expect(packetB.material_id).toBe(packetA.material_id);
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
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
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
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
      client: {
        async runGroup(request) {
          providerMaterialId = request.materials.materialId;
          return { runtimeId: "runtime-bounded-identity", outcome: "completed", material_id: providerMaterialId, providers: [{
            provider: "other/model", status: "completed", identity: { provider: "other/model" }, error: null,
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
      client: {
        async runGroup(request) {
          calls.push({ pair_id: request.pair_id, role: request.role, materialId: request.materials.materialId });
          return {
            runtimeId: `runtime-${request.role}`, outcome: "completed",
            providers: [{
              provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
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

  it("keeps pair role metadata when a paired provider member identity is degraded", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-pair-identity-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "make-decision", review_track: "direction", host_provider: "codex",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"], provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
      client: { async runGroup(request) {
        return {
          material_id: request.role === "red" ? request.materials.materialId : "f".repeat(64),
          runtimeId: `runtime-${request.role}`, outcome: "completed", providers: [{
            provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
            output: JSON.stringify({ findings: [] }), timing: null, usage: null,
          }],
        };
      } },
    });
    expect(result).toMatchObject({
      status: "available-with-failures", pair_status: "partial", material_consistency: "partial",
      error: { code: "PAIR_MATERIAL_MISMATCH" },
    });
    expect(result.material_id).toBeNull();
    expect(result.material_ids.red).not.toBe(result.material_ids.blue);
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
      client: { async runGroup(request) {
        if (request.role === incompleteRole) {
          return { runtimeId: `runtime-${request.role}`, outcome: "unavailable", providers: [{
            provider: "model-a", status: "failed", identity: { provider: "model-a" },
            error: { code: "RATE_LIMITED", message: "fixture" }, timing: null, usage: null,
          }] };
        }
        return { runtimeId: `runtime-${request.role}`, outcome: "completed", providers: [{
          provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
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
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a", "model-b"] }),
      client: { async runGroup(request) {
        const failed = request.role === "red";
        return { runtimeId: `runtime-${request.role}`, outcome: failed ? "partial" : "completed", providers: [
          { provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null },
          { provider: "model-b", status: failed ? "failed" : "completed", identity: { provider: "model-b" }, error: failed ? { code: "RATE_LIMITED", message: "fixture" } : null, output: failed ? undefined : JSON.stringify({ findings: [] }), timing: null, usage: null },
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
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
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
              provider: "other/model", status: "completed", identity: { provider: "other/model" }, error: null,
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
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
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
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a", "model-b"] }),
      client: {
        async runGroup() {
          return {
            runtimeId: "runtime-bad", outcome: "partial",
            providers: [
              {
                provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
                output: "not-json", timing: null, usage: null,
              },
              {
                provider: "model-b", status: "completed", identity: { provider: "model-b" }, error: null,
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
      client: {
        async runGroup() {
          return {
            runtimeId: "runtime-anchor-invalid", outcome: "completed",
            providers: [{
              provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
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
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a", "model-b"] }),
      client: { async runGroup() {
        return { runtimeId: "runtime-partial", outcome: "partial", providers: [{
          provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
      client: {
        async runGroup() {
          const provider = sourceCode === "OUTPUT_INVALID"
            ? {
              provider: "model-a", status: "completed", identity: { provider: "model-a" },
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"] }),
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"], provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"], provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
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
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"], provider_identities: { "model-a": { source_id: "trusted-source", config_id: "trusted-config" } } }),
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

});

describe("review flow static preflight", () => {
  function trustedDependencies(attachmentRoot, { route = { initial: ["other/model"], mode: "single_round" }, selection = { providers: ["other/model"] }, broker = null } = {}) {
    let brokerCalls = 0;
    const dependencies = {
      loadConfig: () => ({
        whReview: {},
        config: "/unused/config.json",
        attachmentRoot,
        command: ["unused"],
        brokerProbe: { status: "unknown", reason: "probe intentionally unavailable" },
      }),
      resolveRoute: () => route,
      selectProviders: () => selection,
      client: {
        async runGroup(request) {
          brokerCalls += 1;
          return broker?.(request) ?? { runtimeId: "runtime-preflight", outcome: "unavailable", providers: [] };
        },
      },
    };
    return { dependencies, calls: () => brokerCalls };
  }

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
      error: { code: "MATERIAL_INCOMPLETE", diagnostic: { field: "approved_spec" } },
    });
    expect(calls()).toBe(0);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
  });
});
