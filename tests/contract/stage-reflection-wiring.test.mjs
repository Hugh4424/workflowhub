import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { stageReflectionPublication } from "../../tools/cli/stage-runtime.mjs";

const root = resolve(import.meta.dirname, "../..");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

function read(relative) {
  return readFileSync(resolve(root, relative), "utf8");
}

describe("stage-reflection workflow wiring", () => {
  it("binds the standard stage-runtime entry to the host-owned reflection executor", () => {
    const executor = async () => ({ status: "completed" });
    expect(stageReflectionPublication({ stageReflectionExecutor: executor })).toEqual({ runStageReflection: executor });
    expect(stageReflectionPublication({})).toEqual({});
    expect(() => stageReflectionPublication({ stageReflectionExecutor: true })).toThrow(/must be a function/i);
  });

  it("mounts the non-blocking stage-end step and skill in every stage", () => {
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const catalogEntry = catalog.skills.find((entry) => entry.name === "stage-reflection");
    expect(catalogEntry).toBeTruthy();

    const bundleRaw = read("skills/stage-reflection/skill-bundle.json");
    const bundle = JSON.parse(bundleRaw);
    expect(bundle).toMatchObject({ schema_version: 1, skill: "stage-reflection" });
    expect(bundle.files.map((entry) => typeof entry === "string" ? entry : entry.path)).toEqual(expect.arrayContaining(["SKILL.md"]));
    const fileEntries = bundle.files.map((entry) => ({
      path: typeof entry === "string" ? entry : entry.path,
      sha256: createHash("sha256").update(read(`skills/stage-reflection/${typeof entry === "string" ? entry : entry.path}`)).digest("hex"),
    })).sort((a, b) => a.path.localeCompare(b.path));
    const bundleHash = createHash("sha256").update(JSON.stringify(fileEntries)).digest("hex");
    expect(catalogEntry.local_bundle_hash).toBe(bundleHash);
    expect(catalogEntry.used_by_stages).toEqual(stages);

    for (const stage of stages) {
      const steps = JSON.parse(read(`workflows/${stage}/steps.json`)).steps;
      const reflection = steps.find((step) => step.step_slug === "stage-reflection");
      expect(reflection, `${stage} stage-reflection step`).toMatchObject({
        on_stage_end: true,
        blocking: false,
        entry_conditions: expect.any(Array),
        completion_evidence: expect.any(Array),
        observable_result: expect.any(String),
        depends_on: expect.any(Array),
      });
      expect(reflection.step_id).toBe(steps.length);
      expect(reflection.order).toBe(steps.length);
      expect(reflection.depends_on).toEqual([steps.at(-2).step_id]);

      const manifest = yaml.load(read(`workflows/${stage}/skill-deps.yaml`));
      const dependency = manifest.skills.find((skill) => skill.name === "stage-reflection");
      expect(dependency, `${stage} stage-reflection dependency`).toMatchObject({
        name: "stage-reflection",
        path: "skills/stage-reflection/SKILL.md",
        execution: "inline",
        trigger: "on_stage_end",
        bundle: "skills/stage-reflection/skill-bundle.json",
        owner: "stage",
        consumer: {
          target: "stage-runner#runStageEndReflection",
          inputs: expect.arrayContaining(["stage_outcome.step_outcomes", "stage_outcome.skill_outcomes"]),
          identity: ["task_id", "stage", "material_revision", "snapshot_tree"],
          result: "stage_reflection",
        },
      });
    }
  });

  it("mounts stage-handoff only on the four author stages and keeps verify-code out", () => {
    const authorStages = ["make-decision", "build-spec", "build-plan", "build-code"];
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const catalogEntry = catalog.skills.find((entry) => entry.name === "stage-handoff");
    expect(catalogEntry).toBeTruthy();
    const bundle = JSON.parse(read("skills/stage-handoff/skill-bundle.json"));
    expect(bundle).toMatchObject({ schema_version: 1, skill: "stage-handoff" });
    const fileEntries = bundle.files.map((entry) => ({
      path: typeof entry === "string" ? entry : entry.path,
      sha256: createHash("sha256").update(read(`skills/stage-handoff/${typeof entry === "string" ? entry : entry.path}`)).digest("hex"),
    })).sort((a, b) => a.path.localeCompare(b.path));
    expect(catalogEntry.local_bundle_hash).toBe(createHash("sha256").update(JSON.stringify(fileEntries)).digest("hex"));
    expect(catalogEntry.used_by_stages).toEqual(authorStages);

    for (const stage of [...authorStages, "verify-code"]) {
      const manifest = yaml.load(read(`workflows/${stage}/skill-deps.yaml`));
      const dependency = manifest.skills.find((skill) => skill.name === "stage-handoff");
      if (authorStages.includes(stage)) {
        expect(dependency, `${stage} stage-handoff dependency`).toMatchObject({
          name: "stage-handoff",
          path: "skills/stage-handoff/SKILL.md",
          execution: "inline",
          trigger: "on_stage_end",
          bundle: "skills/stage-handoff/skill-bundle.json",
          owner: "stage",
          consumer: {
            target: "stage-runner#runStageEndReflection",
            result: "stage_handoff",
          },
        });
        expect(dependency.consumer.inputs).toEqual(expect.arrayContaining([
          "stage_outcome.producer",
          "stage_outcome.step_outcomes",
          "artifacts.decision-log.md",
          "artifacts.tasks.md",
        ]));
      } else {
        expect(dependency).toBeUndefined();
      }
    }
  });
});
