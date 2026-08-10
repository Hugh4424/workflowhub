import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as stageSkillRuntime from "../../runtime/stage/stage-skill-runtime.mjs";

const {
  loadStageSkillManifest,
  loadStageSkillStepManifest,
  resolveStageSkillPackages,
} = stageSkillRuntime;
const roots = [];

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-portable-skill-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "workflows/build-code"), { recursive: true });
  fs.mkdirSync(path.join(root, "skills/alpha"), { recursive: true });
  fs.mkdirSync(path.join(root, "skills/beta"), { recursive: true });

  for (const name of ["alpha", "beta"]) {
    fs.writeFileSync(path.join(root, `skills/${name}/SKILL.md`), `# ${name}\n`);
    fs.writeFileSync(
      path.join(root, `skills/${name}/execute.mjs`),
      `throw new Error(${JSON.stringify(`${name} package must not execute`)});\n`,
    );
    writeJson(path.join(root, `skills/${name}/skill-bundle.json`), {
      schema_version: 1,
      skill: name,
      files: ["SKILL.md", "execute.mjs"],
    });
  }

  fs.writeFileSync(path.join(root, "workflows/build-code/skill-deps.yaml"), `stage: build-code
skills:
  - { name: beta, path: skills/beta/SKILL.md, bundle: skills/beta/skill-bundle.json }
  - { name: alpha, path: skills/alpha/SKILL.md, bundle: skills/alpha/skill-bundle.json }
`);
  writeJson(path.join(root, "workflows/build-code/steps.json"), {
    schema_version: "2.0.0",
    stage_slug: "build-code",
    steps: [
      {
        step_id: 1,
        step_slug: "parse-package",
        order: 1,
        entry_conditions: [{ kind: "input", uri_or_path: "package://root" }],
        completion_evidence: [{ kind: "package", uri_or_path: "package://parsed" }],
        observable_result: "The portable package is parsed.",
        depends_on: [],
      },
      {
        step_id: 2,
        step_slug: "validate-package",
        order: 2,
        entry_conditions: [{ kind: "package", uri_or_path: "step://1" }],
        completion_evidence: [{ kind: "package", uri_or_path: "package://validated" }],
        observable_result: "The portable package is validated.",
        depends_on: [1],
      },
    ],
  });
  return root;
}

describe("stage skill portable package runtime", () => {
  it("exposes only package parsing APIs, without preflight or invocation APIs", () => {
    expect(loadStageSkillManifest).toBeTypeOf("function");
    expect(loadStageSkillStepManifest).toBeTypeOf("function");
    expect(resolveStageSkillPackages).toBeTypeOf("function");
    expect(stageSkillRuntime).not.toHaveProperty("preflightStageSkills");
    expect(stageSkillRuntime).not.toHaveProperty("dispatchStageSkill");
    expect(stageSkillRuntime).not.toHaveProperty("dispatchOrderedStageSkills");
  });

  it("parses and validates the stage and step manifests", () => {
    const root = fixture();
    const skills = loadStageSkillManifest(root, "build-code");
    const steps = loadStageSkillStepManifest(root, "build-code");

    expect(skills).toMatchObject({
      root: fs.realpathSync(root),
      relative: "workflows/build-code/skill-deps.yaml",
      source: fs.realpathSync(path.join(root, "workflows/build-code/skill-deps.yaml")),
    });
    expect(skills.manifest.skills.map(({ name }) => name)).toEqual(["beta", "alpha"]);
    expect(steps.relative).toBe("workflows/build-code/steps.json");
    expect(steps.manifest.steps.map(({ step_id, order }) => [step_id, order])).toEqual([[1, 1], [2, 2]]);
  });

  it("resolves package paths and stable content hashes in declaration order without executing assets", () => {
    const root = fixture();
    const first = resolveStageSkillPackages({ packageRoot: root, stage: "build-code" });
    const second = resolveStageSkillPackages({ packageRoot: root, stage: "build-code" });

    expect([...first.dependencies.keys()]).toEqual(["beta", "alpha"]);
    expect([...first.payloads.keys()]).toEqual(["beta", "alpha"]);
    expect([...first.payloads.values()].map(({ bundle_hash }) => bundle_hash))
      .toEqual([...second.payloads.values()].map(({ bundle_hash }) => bundle_hash));

    for (const [name, payload] of first.payloads) {
      expect(payload).toMatchObject({
        name,
        package_root: fs.realpathSync(root),
        source_manifest: fs.realpathSync(path.join(root, "workflows/build-code/skill-deps.yaml")),
        resolved_skill_path: fs.realpathSync(path.join(root, `skills/${name}/SKILL.md`)),
      });
      expect(payload.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(payload.resolved_bundle_paths).toEqual([
        fs.realpathSync(path.join(root, `skills/${name}/SKILL.md`)),
        fs.realpathSync(path.join(root, `skills/${name}/execute.mjs`)),
      ]);
    }
  });

  it("changes only the affected package hash when its content changes", () => {
    const root = fixture();
    const before = resolveStageSkillPackages({ packageRoot: root, stage: "build-code" });
    fs.appendFileSync(path.join(root, "skills/beta/SKILL.md"), "changed\n");
    const after = resolveStageSkillPackages({ packageRoot: root, stage: "build-code" });

    expect(after.payloads.get("beta").bundle_hash).not.toBe(before.payloads.get("beta").bundle_hash);
    expect(after.payloads.get("alpha").bundle_hash).toBe(before.payloads.get("alpha").bundle_hash);
  });

  it.each(["../build-code", "Build-code", "build_code", ""])("rejects invalid stage input %j", (stage) => {
    const root = fixture();
    expect(() => loadStageSkillManifest(root, stage)).toThrow(/invalid stage/);
    expect(() => loadStageSkillStepManifest(root, stage)).toThrow(/invalid stage/);
  });

  it("rejects a manifest for another stage", () => {
    const root = fixture();
    const manifestPath = path.join(root, "workflows/build-code/skill-deps.yaml");
    fs.writeFileSync(manifestPath, fs.readFileSync(manifestPath, "utf8").replace("stage: build-code", "stage: build-plan"));
    expect(() => loadStageSkillManifest(root, "build-code")).toThrow("build-code: invalid skill manifest");
  });

  it("rejects invalid step ordering", () => {
    const root = fixture();
    const manifestPath = path.join(root, "workflows/build-code/steps.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.steps[1].order = 3;
    writeJson(manifestPath, manifest);
    expect(() => loadStageSkillStepManifest(root, "build-code"))
      .toThrow(/invalid step manifest.*missing order 2/);
  });

  it("rejects paths that escape the portable package", () => {
    const root = fixture();
    const manifestPath = path.join(root, "workflows/build-code/skill-deps.yaml");
    fs.writeFileSync(
      manifestPath,
      fs.readFileSync(manifestPath, "utf8").replace("skills/beta/SKILL.md", "../outside/SKILL.md"),
    );

    let failure;
    try {
      resolveStageSkillPackages({ packageRoot: root, stage: "build-code" });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toMatchObject({
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "beta",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
    });
  });

  it("rejects a bundle with an incorrect asset hash", () => {
    const root = fixture();
    writeJson(path.join(root, "skills/beta/skill-bundle.json"), {
      schema_version: 1,
      skill: "beta",
      files: [{ path: "SKILL.md", sha256: "0".repeat(64) }],
    });

    expect(() => resolveStageSkillPackages({ packageRoot: root, stage: "build-code" }))
      .toThrow(/bundle sha256 mismatch/);
  });
});
