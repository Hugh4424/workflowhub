import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendRequiredSkillDefinitions, resolveRequiredSkills } from "../required-skill-resolver.mjs";

describe("required skill bundles", () => {
  it("resolves the make-decision direction profile from the stage plan", () => {
    const result = resolveRequiredSkills({ stage: "make-decision", reviewTrack: "direction" });
    expect(result.definitions.map((definition) => definition.name)).toEqual(["plan-ceo-review", "review"]);
    for (const definition of result.definitions) {
      expect(definition.source).toContain("/workflowhub-wh-review-v4/skills/");
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

  it("keeps spec-analyze and verify-change outside the heterologous profiles", () => {
    const plan = resolveRequiredSkills({ stage: "build-plan" });
    const verify = resolveRequiredSkills({ stage: "verify-code" });
    expect(plan.definitions.map((definition) => definition.name)).toEqual(["plan-eng-review", "review"]);
    expect(verify.definitions.map((definition) => definition.name)).toEqual(["qa-only"]);
    expect([...plan.definitions, ...verify.definitions].map((definition) => definition.name)).not.toEqual(expect.arrayContaining(["spec-analyze", "verify-change"]));
  });

  it("does not inject file-only bundles into the provider prompt", () => {
    const resolution = resolveRequiredSkills({ stage: "build-plan" });
    const augmented = appendRequiredSkillDefinitions({ contract: "CONTRACT", materials: "M", resolution });
    expect(augmented.materials).toBe("M");
    expect(augmented.contract).toBe("CONTRACT");
  });
});
