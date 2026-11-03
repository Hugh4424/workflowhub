import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import * as runner from "../review-runner.mjs";
import { buildReviewMaterials, missingDirectionRevealMaterials, validateDirectionReviewInput } from "../review-materials.mjs";
import { runSimpleReview, validateReviewCallerMaterials } from "../simple-review-runner.mjs";
import { providerMaterialEntries, providerMaterialPath, redactProviderHostPaths } from "../../../../runtime/review/provider-material-projection.mjs";

const REVEAL_KEYS = ["current_selection", "alternatives", "selection_rationale", "key_assumptions"];
const MATERIALS = Object.freeze({
  raw_requirement: "需要可靠交付",
  objective_facts: ["当前审查重复"],
  convergence_outline: "问题：方向审查缺少揭示材料时 challenge 不可执行。",
  current_selection: "方案 A",
  alternatives: "方案 B：继续盲审并跳过 reveal（已拒绝）",
  selection_rationale: "方案 A 保留 reveal 边界且能执行 challenge。",
  key_assumptions: "主会话能提供四份揭示材料；broker 能在同一次请求内分段。",
});

function packetFor(materials) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "direction-reveal-")));
  try {
    return { root, packet: buildReviewMaterials({ attachmentRoot: root, stage: "make-decision", reviewTrack: "direction", materials }) };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

test("direction review declares one public request with a broker-enforced reveal boundary", () => {
  expect(typeof runner.planDirectionReviewRequests).toBe("function");
  const sequence = runner.planDirectionReviewRequests(MATERIALS);
  expect(sequence.requests).toHaveLength(1);
  expect(sequence.request.public_request_count).toBe(1);
  expect(sequence.request.input.current_selection).toBe("方案 A");
  expect(sequence.flow.steps.map((step) => step.id)).toEqual(["reconstruct", "reveal", "challenge"]);
  expect(sequence.flow.steps[0].visible).not.toContain("current_selection");
  expect(sequence.flow.steps[0].hidden_until).toBe("reveal");
  expect(sequence.flow.steps[1].visible).toEqual(expect.arrayContaining(REVEAL_KEYS));
  expect(sequence.logical_fact_count).toBe(1);
});

test("rejects a direction request that omits a reveal material instead of silently degrading", () => {
  const incomplete = { ...MATERIALS };
  delete incomplete.current_selection;
  expect(missingDirectionRevealMaterials(incomplete)).toEqual(["current_selection"]);
  expect(() => validateDirectionReviewInput({ materials: incomplete }))
    .toThrow(/方向审查缺少揭示材料，challenge 无法执行/);
  expect(() => packetFor(incomplete)).toThrow(/方向审查缺少揭示材料，challenge 无法执行/);
});

test("public review preflight blocks an incomplete direction request before dispatch", () => {
  const incomplete = { ...MATERIALS };
  delete incomplete.selection_rationale;
  const blocked = validateReviewCallerMaterials({ stage: "make-decision", review_track: "direction", materials: incomplete });
  expect(blocked.status).toBe("unavailable");
  expect(blocked.dispatch_state).toBe("blocked_before_dispatch");
  expect(blocked.error.code).toBe("MATERIAL_INCOMPLETE");
  expect(blocked.error.message).toContain("方向审查缺少揭示材料，challenge 无法执行");
  expect(validateReviewCallerMaterials({ stage: "make-decision", review_track: "direction", materials: MATERIALS })).toBeNull();
});

test("a complete direction request reaches the broker transport with all reveal materials", async () => {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "direction-dispatch-")));
  const calls = [];
  try {
    const result = await runSimpleReview({ stage: "make-decision", review_track: "direction", materials: MATERIALS }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a"], provider_models: { "model-a": "model-a-model" } }),
      client: {
        async runGroup(request) {
          calls.push(request);
          return {
            runtimeId: `direction-complete-${request.role}`, outcome: "completed",
            providers: [{ provider: "model-a", status: "completed", identity: { provider: "model-a", model: "model-a-model" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }],
          };
        },
      },
    });
    expect(result.status).toBe("available");
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      const paths = call.materials.deliveryManifest.map((entry) => entry.path);
      for (const key of REVEAL_KEYS) expect(paths.some((path) => path.includes(key)), key).toBe(true);
    }
  } finally {
    rmSync(attachmentRoot, { recursive: true, force: true });
  }
});

test("delivers all four reveal materials in the direction packet before the broker reveal step", () => {
  const { root, packet } = packetFor(MATERIALS);
  try {
    const entries = [...providerMaterialEntries({ stage: "make-decision", review_track: "direction", materials: MATERIALS })];
    const revealEntries = entries
      .map(([key, value], index) => ({ key, value, path: providerMaterialPath(key, index, redactProviderHostPaths(value)) }))
      .filter(({ key }) => REVEAL_KEYS.includes(key));
    expect(revealEntries.map(({ key }) => key)).toEqual(expect.arrayContaining(REVEAL_KEYS));
    for (const { key, value, path } of revealEntries) {
      expect(packet.deliveryManifest.some((entry) => entry.path === path), key).toBe(true);
      expect(readFileSync(join(packet.bundleRoot, path), "utf8")).toBe(redactProviderHostPaths(value));
    }
    expect(validateDirectionReviewInput({ materials: MATERIALS })).toBe(true);
  } finally {
    packet.dispose();
    rmSync(root, { recursive: true, force: true });
  }
});

for (const key of REVEAL_KEYS) {
  for (const [kind, empty] of [["string", ""], ["Buffer", Buffer.alloc(0)], ["Uint8Array", new Uint8Array(0)]]) {
    test(`rejects empty ${kind} reveal bytes for ${key} at the packet boundary`, () => {
      const materials = { ...MATERIALS, [key]: empty };
      let created;
      try {
        // Check both public validation and the independently callable low-level packet builder.
        const build = () => { created = packetFor(materials); };
        expect(() => validateDirectionReviewInput({ materials })).toThrow(/方向审查缺少揭示材料，challenge 无法执行/);
        expect(missingDirectionRevealMaterials(materials)).toEqual([key]);
        expect(build).toThrow(/方向审查缺少揭示材料，challenge 无法执行/);
      } finally {
        if (created) {
          created.packet.dispose();
          rmSync(created.root, { recursive: true, force: true });
        }
      }
    });
  }
}

for (const [kind, bytes] of [["Buffer", Buffer.from("方案 A")], ["Uint8Array", new TextEncoder().encode("方案 A")]]) {
  test(`preserves nonempty ${kind} reveal material support`, () => {
    const materials = { ...MATERIALS, current_selection: bytes };
    expect(missingDirectionRevealMaterials(materials)).toEqual([]);
    expect(validateDirectionReviewInput({ materials })).toBe(true);
    const { root, packet } = packetFor(materials);
    try {
      expect(packet.deliveryManifest.some(entry => entry.path.includes("current_selection"))).toBe(true);
    } finally {
      packet.dispose();
      rmSync(root, { recursive: true, force: true });
    }
  });
}
