import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";
import { resolveStageSkillPackages } from "../../runtime/stage/stage-skill-runtime.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stageSkills = Object.freeze({
  "make-decision": [
    "talk-with-zhipeng",
    "grill-with-docs",
    "decision-log",
    "deep-research",
    "wh-review",
    "spec-analyze",
    "stage-reflection",
    "stage-handoff",
  ],
  "build-spec": [
    "spec-research",
    "simplicity-guard",
    "plan-ceo-review",
    "ui-project-init",
    "design-source-readiness",
    "frontend-prototype-render",
    "plan-design-review",
    "wh-review",
    "spec-analyze",
    "stage-reflection",
    "stage-handoff",
  ],
  "build-plan": [
    "spec-research",
    "spec-clarify",
    "spec-specify",
    "spec-plan",
    "simplicity-guard",
    "plan-eng-review",
    "testing-system-blueprint",
    "frontend-component-quality",
    "test-routing-advisor",
    "spec-tasks",
    "spec-analyze",
    "wh-review",
    "stage-reflection",
    "stage-handoff",
  ],
  "build-code": [
    "test-routing-advisor",
    "backend-testing",
    "frontend-testing",
    "frontend-component-quality",
    "fullstack-slice-testing",
    "spec-analyze",
    "stage-reflection",
    "stage-handoff",
  ],
  "verify-code": ["frontend-component-quality", "stage-reflection"],
});

describe("direct stage package contract", () => {
  it("keeps code-review catalog consumers aligned with stage packages and the optional Architect bundle", () => {
    const catalog = yaml.load(fs.readFileSync(path.join(root, "skills/catalog.yaml"), "utf8"));
    for (const name of ["wh-review", "architect-code-review"]) {
      const entry = catalog.skills.find((skill) => skill.name === name);
      const declaredStages = Object.entries(stageSkills)
        .filter(([, skills]) => skills.includes(name))
        .map(([stage]) => stage);
      expect(entry.used_by_stages).toEqual(declaredStages);
      const bundlePath = entry.path.replace(/SKILL\.md$/, "skill-bundle.json");
      expect(validateSkillBundle(root, bundlePath, entry.path).bundleHash).toBe(entry.local_bundle_hash);
    }
    expect(stageSkills["build-code"]).not.toContain("architect-code-review");
    expect(stageSkills["verify-code"]).not.toContain("wh-review");
  });

  it.each(Object.entries(stageSkills))(
    "resolves every %s dependency directly from its declared bundle",
    (stage, expectedNames) => {
      const resolved = resolveStageSkillPackages({ packageRoot: root, stage });

      expect(resolved.manifest.stage).toBe(stage);
      expect(resolved.manifest.skills.map(({ name }) => name)).toEqual(expectedNames);
      expect([...resolved.dependencies.keys()]).toEqual(expectedNames);
      expect([...resolved.payloads.keys()]).toEqual(expectedNames);

      for (const dependency of resolved.manifest.skills) {
        const payload = resolved.payloads.get(dependency.name);
        const declaredSkillPath = fs.realpathSync(path.join(root, dependency.path));
        const declaredBundle = JSON.parse(fs.readFileSync(path.join(root, dependency.bundle), "utf8"));

        expect(declaredBundle.skill).toBe(dependency.name);
        expect(payload).toMatchObject({
          name: dependency.name,
          resolved_skill_path: declaredSkillPath,
          source_manifest: resolved.source,
          package_root: resolved.root,
          diagnostic: {
            source: "resolver",
            skill: dependency.name,
            status: "available",
            code: "SKILL_RESOLVED",
          },
        });
        expect(payload.resolved_bundle_paths).toContain(declaredSkillPath);
        expect(payload.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
      }
    },
  );

  it("keeps Talk and Grill exclusively in the make-decision package", () => {
    const owners = new Map([
      ["talk-with-zhipeng", []],
      ["grill-with-docs", []],
    ]);

    for (const stage of Object.keys(stageSkills)) {
      const { dependencies } = resolveStageSkillPackages({ packageRoot: root, stage });
      for (const skill of owners.keys()) {
        if (dependencies.has(skill)) owners.get(skill).push(stage);
      }
    }

    expect(Object.fromEntries(owners)).toEqual({
      "talk-with-zhipeng": ["make-decision"],
      "grill-with-docs": ["make-decision"],
    });
  });

  it("returns a stage package without a host bridge, invocation, or receipt", () => {
    const resolved = resolveStageSkillPackages({
      packageRoot: root,
      stage: "build-plan",
    });

    expect([...resolved.payloads.values()]).toHaveLength(stageSkills["build-plan"].length);
    for (const payload of resolved.payloads.values()) {
      expect(Object.keys(payload).sort()).toEqual([
        "bundle_hash",
        "diagnostic",
        "name",
        "package_root",
        "resolved_bundle_paths",
        "resolved_skill_path",
        "source_manifest",
      ]);
    }
  });
});
