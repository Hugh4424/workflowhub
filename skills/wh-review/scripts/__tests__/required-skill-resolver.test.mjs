import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendRequiredSkillDefinitions, parseRequiredSkillManifest, resolveRequiredSkills } from "../required-skill-resolver.mjs";

const manifest = '<!-- wh-review-skills: {"required":["review","plan-ceo-review"]} -->';

describe("required skill bundles", () => {
  it("parses and sorts exact repository skill names", () => {
    expect(parseRequiredSkillManifest(manifest)).toEqual({ required: ["plan-ceo-review", "review"], optional: [] });
  });

  it("resolves the sealed repository bundle closure", () => {
    const result = resolveRequiredSkills({ contract: manifest });
    expect(result.definitions.map((definition) => definition.name)).toEqual(["plan-ceo-review", "review"]);
    for (const definition of result.definitions) {
      expect(definition.source).toContain("/workflowhub-wh-review-v4/skills/");
      expect(definition.bundle.files).toEqual(expect.arrayContaining([expect.objectContaining({ path: "SKILL.md" })]));
      expect(definition.bundle.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("rejects external roots, nested host roots, and traversal names", () => {
    const root = mkdtempSync(join(tmpdir(), "skills-"));
    mkdirSync(join(root, "review"));
    writeFileSync(join(root, "review", "SKILL.md"), "external");
    expect(() => resolveRequiredSkills({ contract: '<!-- wh-review-skills: {"required":["review"]} -->', roots: [root] })).toThrow(/repository skills root/);
    expect(() => parseRequiredSkillManifest('<!-- wh-review-skills: {"required":["../escape"]} -->')).toThrow(/required-skill-unavailable/);
  });

  it("fails closed when the repository skill lacks a declared bundle", () => {
    expect(() => resolveRequiredSkills({ contract: '<!-- wh-review-skills: {"required":["test-strategy"]} -->' })).toThrow(/review-bundle\.json/);
  });

  it("injects complete skill bytes and immutable bundle metadata", () => {
    const resolution = resolveRequiredSkills({ contract: manifest });
    const augmented = appendRequiredSkillDefinitions({ contract: manifest, materials: "M", resolution });
    expect(augmented.materials).toBe("M");
    expect(augmented.contract).toContain("## Required skill definitions");
    expect(augmented.contract).toContain("plan-ceo-review");
    expect(augmented.contract).toContain("review");
  });
});
