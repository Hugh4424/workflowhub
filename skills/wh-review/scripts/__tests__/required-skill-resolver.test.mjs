import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { appendRequiredSkillDefinitions, resolveRequiredSkills } from "../required-skill-resolver.mjs";

const repositorySkillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..", "skills");

describe("required skill bundles", () => {
  it("resolves the make-decision direction profile from the stage plan", () => {
    const result = resolveRequiredSkills({ stage: "make-decision", reviewTrack: "direction" });
    expect(result.definitions.map((definition) => definition.name)).toEqual(["plan-ceo-review", "review"]);
    for (const definition of result.definitions) {
      expect(relative(repositorySkillsRoot, definition.source)).toBe(`${definition.name}/SKILL.md`);
      expect(definition.bundle.files).toEqual(expect.arrayContaining([expect.objectContaining({ path: "SKILL.md" })]));
      expect(definition.bundle.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(resolveRequiredSkills({ stage: "make-decision", reviewTrack: "detail" }).definitions.map((definition) => definition.name)).toEqual(["plan-ceo-review", "review"]);
  });

  it("rejects external roots and a missing required make-decision track", () => {
    const root = mkdtempSync(join(tmpdir(), "skills-"));
    mkdirSync(join(root, "review"));
    writeFileSync(join(root, "review", "SKILL.md"), "external");
    expect(() => resolveRequiredSkills({ stage: "make-decision", reviewTrack: "direction", roots: [root] })).toThrow(/repository skills root/);
    expect(() => resolveRequiredSkills({ stage: "make-decision" })).toThrow(/review_track/);
  });

  it("uses a profile-specific UI lens and keeps default delivery file-only", () => {
    const plain = resolveRequiredSkills({ stage: "build-spec" });
    const ui = resolveRequiredSkills({ stage: "build-spec", ui: true });
    expect(plain.definitions.map((definition) => definition.name)).toEqual(["plan-ceo-review", "review"]);
    expect(ui.definitions.map((definition) => definition.name)).toEqual(["plan-ceo-review", "plan-design-review", "review"]);
    expect(ui.deliveryMode).toBe("file_only");
  });

  it("selects packet-only spec and verification lenses for their stages", () => {
    const plan = resolveRequiredSkills({ stage: "build-plan" });
    const verify = resolveRequiredSkills({ stage: "verify-code" });
    expect(plan.definitions.map((definition) => definition.name)).toEqual(["plan-eng-review", "review", "spec-analyze"]);
    expect(verify.definitions.map((definition) => definition.name)).toEqual(["qa-only", "verify-change"]);
    expect([...plan.definitions, ...verify.definitions].every((definition) => definition.deliveryMode !== "always_embed")).toBe(true);
  });

  it("does not inject file-only bundles into the provider prompt", () => {
    const resolution = resolveRequiredSkills({ stage: "build-plan" });
    const augmented = appendRequiredSkillDefinitions({ contract: "CONTRACT", materials: "M", resolution });
    expect(augmented.materials).toBe("M");
    expect(augmented.contract).toBe("CONTRACT");
  });

  it.each([
    ["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null],
    ["build-plan", null], ["build-code", null], ["verify-code", null],
  ])("exposes a complete frozen StageSkillPlan for %s/%s", (stage, reviewTrack) => {
    const plan = resolveRequiredSkills({ stage, reviewTrack });
    expect(plan).toMatchObject({
      stage,
      reviewTrack,
      logicalSkillId: expect.stringMatching(/^wh-review\//),
      outputSchema: "schemas/reviewer-output.schema.json",
      checkpoints: expect.any(Array),
      expectedEvidence: expect.any(Array),
      reviewMode: "lens-only",
      deliveryMode: expect.stringMatching(/^(file_only|always_embed)$/),
      skillBundleHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      bundleClosureFiles: expect.any(Array),
    });
    expect(plan.checkpoints.length).toBeGreaterThan(0);
    expect(plan.expectedEvidence.length).toBeGreaterThan(0);
    expect(plan.bundleClosureFiles).toEqual(plan.definitions.flatMap(({ name, bundle }) => bundle.files.map(({ path, sha256 }) => ({ skill: name, path, sha256 }))));
  });

  it("rejects an incomplete StageSkillPlan profile instead of applying defaults", () => {
    expect(() => resolveRequiredSkills({
      stage: "build-code",
      stageSkillPlan: { version: 1, stages: { "build-code": { logical_skill_id: "wh-review/build-code", required_skills: [], material_profile: "diff-and-evidence", checkpoints: ["packet-attestation"], expected_evidence: ["unified_diff"], bundle_hash: "resolved-at-prepare", bundle_closure_files: "resolved-at-prepare", review_mode: "lens-only", delivery_mode: "file_only", continuation_policy: "initial-runtime-only", pass_finding_policy: "contract-only" } } },
    })).toThrow(/incomplete stage skill plan.*output_schema/i);
  });
});
