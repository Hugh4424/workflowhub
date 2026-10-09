import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveLocalSkill, resolveSkillPackage, validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";

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

  it("reports resolver success through workflowhub-skill-diagnostic.v1", () => {
    const root = fixture();
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    expect(resolveSkillPackage({
      packageRoot: root,
      manifestPath: "workflows/stage/skill-deps.yaml",
      dependency: { name: "demo", path: "skills/demo/SKILL.md", bundle: "skills/demo/skill-bundle.json" },
    }).diagnostic).toEqual({
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "demo",
      status: "available",
      code: "SKILL_RESOLVED",
      message: null,
      enforcement: "fail_loud",
    });
  });

  it("attaches the same diagnostic schema to a fail-loud resolver error", () => {
    const root = fixture();
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    let failure;
    try {
      resolveSkillPackage({
        packageRoot: root,
        manifestPath: "workflows/stage/skill-deps.yaml",
        dependency: { name: "demo", path: "skills/missing/SKILL.md", bundle: "skills/demo/skill-bundle.json" },
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toMatchObject({
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "demo",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
    });
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

  it("reads only declared contained assets through the active common bundle reader", () => {
    const root = fixture();
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    fs.writeFileSync(path.join(root, "skills/demo/guide.md"), "owned guide\n");
    fs.writeFileSync(path.join(root, "skills/demo/unlisted.md"), "unlisted\n");
    fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md", "guide.md"] }));
    const result = resolveSkillPackage({packageRoot:root,manifestPath:"workflows/stage/skill-deps.yaml",dependency:{name:"demo",path:"skills/demo/SKILL.md",bundle:"skills/demo/skill-bundle.json"}});
    expect(result.resolved_bundle_paths).toEqual([path.join(root,"skills/demo/SKILL.md"),path.join(root,"skills/demo/guide.md")]);
    expect(fs.readFileSync(result.resolved_bundle_paths[1],"utf8")).toBe("owned guide\n");
    expect(result.resolved_bundle_paths).not.toContain(path.join(root,"skills/demo/unlisted.md"));
  });

  it("rejects escaping, symlinked and hardlinked assets through the active common bundle reader", () => {
    const root = fixture(), set = files => fs.writeFileSync(path.join(root,"skills/demo/skill-bundle.json"), JSON.stringify({schema_version:1,skill:"demo",files}));
    const checked = () => validateSkillBundle(root,"skills/demo/skill-bundle.json","skills/demo/SKILL.md");
    set(["SKILL.md", "/tmp/owned-missing-asset.md"]); expect(checked).toThrow(/relative/);
    set(["SKILL.md", "../demo/SKILL.md"]); expect(checked).toThrow(/traverse/);
    fs.writeFileSync(path.join(root,"outside.md"),"owned external asset");
    fs.symlinkSync(path.join(root,"outside.md"),path.join(root,"skills/demo/link.md"));
    set(["SKILL.md","link.md"]); expect(checked).toThrow(/non-symlink/);
    fs.linkSync(path.join(root,"outside.md"),path.join(root,"skills/demo/hard.md"));
    set(["SKILL.md","hard.md"]); expect(checked).toThrow(/hard-linked/);
  });

  it("rejects a dependency whose declared name does not match its standard skill directory", () => {
    const root = fs.realpathSync(fixture());
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    const sourceLiteral = {
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "other",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
      enforcement: "fail_loud",
    };
    let failure;
    try {
      resolveSkillPackage({
        packageRoot: root,
        manifestPath: "workflows/stage/skill-deps.yaml",
        dependency: { name: "other", path: "skills/demo/SKILL.md", bundle: "skills/demo/skill-bundle.json" },
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toMatchObject(sourceLiteral);
    expect(failure.message).toEqual(expect.any(String));
    expect(failure.message).not.toBe("");
    expect(failure.diagnostic.message).toBe(failure.message);
  });

  it("resolves a native name/path/trigger dependency with its conventional sibling bundle", () => {
    const root = fs.realpathSync(fixture());
    const manifestLiteral = "stage: stage\nskills:\n  - name: demo\n    path: skills/demo/SKILL.md\n    trigger: owned_case\n";
    const bundleLiteral = { schema_version: 1, skill: "demo", files: ["SKILL.md", "guide.md"] };
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), manifestLiteral);
    fs.writeFileSync(path.join(root, "skills/demo/guide.md"), "owned guide\n");
    fs.writeFileSync(path.join(root, "skills/demo/unlisted.md"), "unlisted\n");
    fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify(bundleLiteral));
    expect(fs.readFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "utf8")).toBe(manifestLiteral);
    expect(fs.readFileSync(path.join(root, "skills/demo/SKILL.md"), "utf8")).toBe("# demo\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/guide.md"), "utf8")).toBe("owned guide\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/unlisted.md"), "utf8")).toBe("unlisted\n");
    expect(JSON.parse(fs.readFileSync(path.join(root, "skills/demo/skill-bundle.json"), "utf8"))).toEqual(bundleLiteral);
    const nativeDependency = loadStageSkillManifest(root, "stage").manifest.skills[0];
    expect(nativeDependency).toEqual({ name: "demo", path: "skills/demo/SKILL.md", trigger: "owned_case" });
    expect(Object.hasOwn(nativeDependency, "bundle")).toBe(false);
    const sourceLiteral = {
      name: "demo",
      resolved_skill_path: path.join(root, "skills/demo/SKILL.md"),
      resolved_bundle_paths: [path.join(root, "skills/demo/SKILL.md"), path.join(root, "skills/demo/guide.md")],
      source_manifest: path.join(root, "workflows/stage/skill-deps.yaml"),
      package_root: root,
      diagnostic: {
        schema_version: "workflowhub-skill-diagnostic.v1",
        source: "resolver",
        skill: "demo",
        status: "available",
        code: "SKILL_RESOLVED",
        message: null,
        enforcement: "fail_loud",
      },
    };
    expect(resolveSkillPackage({
      packageRoot: root,
      manifestPath: "workflows/stage/skill-deps.yaml",
      dependency: nativeDependency,
    })).toEqual(sourceLiteral);
  });

  it("rejects an explicitly wrong same-directory bundle filename instead of ignoring it", () => {
    const root = fs.realpathSync(fixture());
    const bundleLiteral = { schema_version: 1, skill: "demo", files: ["SKILL.md", "guide.md"] };
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    fs.writeFileSync(path.join(root, "skills/demo/guide.md"), "owned guide\n");
    fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify(bundleLiteral));
    fs.writeFileSync(path.join(root, "skills/demo/alternate-bundle.json"), JSON.stringify(bundleLiteral));
    expect(fs.readFileSync(path.join(root, "skills/demo/alternate-bundle.json"), "utf8")).toBe(JSON.stringify(bundleLiteral));
    expect(fs.readFileSync(path.join(root, "skills/demo/skill-bundle.json"), "utf8")).toBe(JSON.stringify(bundleLiteral));
    expect(fs.readFileSync(path.join(root, "skills/demo/SKILL.md"), "utf8")).toBe("# demo\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/guide.md"), "utf8")).toBe("owned guide\n");
    expect(fs.readFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "utf8")).toBe("stage: stage\n");
    const sourceLiteral = {
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "demo",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
      enforcement: "fail_loud",
    };
    let failure;
    try {
      resolveSkillPackage({
        packageRoot: root,
        manifestPath: "workflows/stage/skill-deps.yaml",
        dependency: { name: "demo", path: "skills/demo/SKILL.md", bundle: "skills/demo/alternate-bundle.json" },
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toMatchObject(sourceLiteral);
    expect(failure.message).toEqual(expect.any(String));
    expect(failure.message).not.toBe("");
    expect(failure.diagnostic.message).toBe(failure.message);
  });

  it("preserves native missing-bundle compatibility for an own undefined bundle", () => {
    const root = fs.realpathSync(fixture());
    const manifestLiteral = "stage: stage\nskills:\n  - name: demo\n    path: skills/demo/SKILL.md\n    trigger: owned_case\n";
    const bundleLiteral = { schema_version: 1, skill: "demo", files: ["SKILL.md", "guide.md"] };
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), manifestLiteral);
    fs.writeFileSync(path.join(root, "skills/demo/guide.md"), "owned guide\n");
    fs.writeFileSync(path.join(root, "skills/demo/unlisted.md"), "unlisted\n");
    fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify(bundleLiteral));
    expect(fs.readFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "utf8")).toBe(manifestLiteral);
    expect(JSON.parse(fs.readFileSync(path.join(root, "skills/demo/skill-bundle.json"), "utf8"))).toEqual(bundleLiteral);
    expect(fs.readFileSync(path.join(root, "skills/demo/SKILL.md"), "utf8")).toBe("# demo\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/guide.md"), "utf8")).toBe("owned guide\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/unlisted.md"), "utf8")).toBe("unlisted\n");
    const nativeDependency = loadStageSkillManifest(root, "stage").manifest.skills[0];
    expect(nativeDependency).toEqual({ name: "demo", path: "skills/demo/SKILL.md", trigger: "owned_case" });
    const dependency = { ...nativeDependency, bundle: undefined };
    expect(Object.hasOwn(dependency, "bundle")).toBe(true);
    expect(dependency.bundle).toBeUndefined();
    const sourceLiteral = {
      name: "demo",
      resolved_skill_path: path.join(root, "skills/demo/SKILL.md"),
      resolved_bundle_paths: [path.join(root, "skills/demo/SKILL.md"), path.join(root, "skills/demo/guide.md")],
      source_manifest: path.join(root, "workflows/stage/skill-deps.yaml"),
      package_root: root,
      diagnostic: {
        schema_version: "workflowhub-skill-diagnostic.v1",
        source: "resolver",
        skill: "demo",
        status: "available",
        code: "SKILL_RESOLVED",
        message: null,
        enforcement: "fail_loud",
      },
    };
    expect(resolveSkillPackage({
      packageRoot: root,
      manifestPath: "workflows/stage/skill-deps.yaml",
      dependency,
    })).toEqual(sourceLiteral);
  });

  it("rejects an explicitly null bundle instead of deriving a sibling", () => {
    const root = fs.realpathSync(fixture());
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    const dependency = { name: "demo", path: "skills/demo/SKILL.md", trigger: "owned_case", bundle: null };
    expect(Object.hasOwn(dependency, "bundle")).toBe(true);
    expect(dependency.bundle).toBe(null);
    expect(fs.readFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "utf8")).toBe("stage: stage\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/SKILL.md"), "utf8")).toBe("# demo\n");
    expect(JSON.parse(fs.readFileSync(path.join(root, "skills/demo/skill-bundle.json"), "utf8"))).toEqual({ schema_version: 1, skill: "demo", files: ["SKILL.md"] });
    const sourceLiteral = {
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "demo",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
      enforcement: "fail_loud",
    };
    let failure;
    try {
      resolveSkillPackage({ packageRoot: root, manifestPath: "workflows/stage/skill-deps.yaml", dependency });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toMatchObject(sourceLiteral);
    expect(failure.message).toEqual(expect.any(String));
    expect(failure.message).not.toBe("");
    expect(failure.diagnostic.message).toBe(failure.message);
  });

  it("rejects an explicitly empty bundle instead of deriving a sibling", () => {
    const root = fs.realpathSync(fixture());
    fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\n");
    const dependency = { name: "demo", path: "skills/demo/SKILL.md", trigger: "owned_case", bundle: "" };
    expect(Object.hasOwn(dependency, "bundle")).toBe(true);
    expect(dependency.bundle).toBe("");
    expect(fs.readFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "utf8")).toBe("stage: stage\n");
    expect(fs.readFileSync(path.join(root, "skills/demo/SKILL.md"), "utf8")).toBe("# demo\n");
    expect(JSON.parse(fs.readFileSync(path.join(root, "skills/demo/skill-bundle.json"), "utf8"))).toEqual({ schema_version: 1, skill: "demo", files: ["SKILL.md"] });
    const sourceLiteral = {
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "demo",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
      enforcement: "fail_loud",
    };
    let failure;
    try {
      resolveSkillPackage({ packageRoot: root, manifestPath: "workflows/stage/skill-deps.yaml", dependency });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toMatchObject(sourceLiteral);
    expect(failure.message).toEqual(expect.any(String));
    expect(failure.message).not.toBe("");
    expect(failure.diagnostic.message).toBe(failure.message);
  });

});
