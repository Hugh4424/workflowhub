import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveLocalSkill, validateReviewBundleProjection, validateSkillBundle } from "../local-skill-resolver.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-skill-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "skills/demo"), { recursive: true });
  fs.writeFileSync(path.join(root, "skills/demo/SKILL.md"), "# demo\n");
  fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md"] }));
  return root;
}

describe("local skill resolver", () => {
  it("resolves only a declared repository-local skill and validates its bundle", () => {
    const root = fixture();
    expect(resolveLocalSkill(root, "skills/demo/SKILL.md")).toBe(fs.realpathSync(path.join(root, "skills/demo/SKILL.md")));
    expect(validateSkillBundle(root, "skills/demo/skill-bundle.json", "skills/demo/SKILL.md").files).toHaveLength(1);
  });

  it("rejects absolute paths, traversal and escaping symlinks", () => {
    const root = fixture();
    expect(() => resolveLocalSkill(root, "/tmp/SKILL.md")).toThrow(/relative/);
    expect(() => resolveLocalSkill(root, "skills/../outside/SKILL.md")).toThrow(/traverse/);
    fs.symlinkSync("/tmp", path.join(root, "skills/link"));
    expect(() => resolveLocalSkill(root, "skills/link/SKILL.md")).toThrow();
  });

  it("rejects bundles that omit SKILL.md", () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, "skills/demo/other.md"), "x");
    fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["other.md"] }));
    expect(() => validateSkillBundle(root, "skills/demo/skill-bundle.json", "skills/demo/SKILL.md")).toThrow(/does not include/);
  });

  it("rejects a bundle outside the declared skill directory", () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, "skills/other.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["demo/SKILL.md"] }));
    expect(() => validateSkillBundle(root, "skills/other.json", "skills/demo/SKILL.md")).toThrow(/allowed directory/);
  });

  it("rejects an externally symlinked skills root", () => {
    const root = fixture();
    const external = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-external-skills-"));
    roots.push(external);
    fs.renameSync(path.join(root, "skills"), path.join(external, "skills"));
    fs.symlinkSync(path.join(external, "skills"), path.join(root, "skills"));
    expect(() => resolveLocalSkill(root, "skills/demo/SKILL.md")).toThrow(/skills root must be a real directory/);
  });

  it("accepts only a review projection contained by the common bundle", () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, "skills/demo/review-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", mode: "lens-only", delivery_mode: "file_only", entrypoint: "SKILL.md", files: ["SKILL.md"] }));
    fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md", "review-bundle.json"] }));
    expect(validateReviewBundleProjection(root, "skills/demo/review-bundle.json", "skills/demo/SKILL.md").projectionHash).toMatch(/^[a-f0-9]{64}$/);
    fs.writeFileSync(path.join(root, "skills/demo/review-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", mode: "lens-only", delivery_mode: "file_only", entrypoint: "missing.md", files: ["missing.md"] }));
    expect(() => validateReviewBundleProjection(root, "skills/demo/review-bundle.json", "skills/demo/SKILL.md")).toThrow(/not in skill-bundle/);
  });
});
