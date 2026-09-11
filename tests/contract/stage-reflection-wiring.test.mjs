import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { stageReflectionPublication } from "../../tools/cli/stage-runtime.mjs";

const root = resolve(import.meta.dirname, "../..");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

const DISCLOSURE_FIXTURE = Object.freeze([
  { step_slug: "not-started", status: "未启动", output: "未声明", criterion: "未检查" },
  { step_slug: "skipped", status: "跳过", output: "未声明", criterion: "不适用原因" },
  { step_slug: "missing-output", status: "已执行但产物缺失", output: "缺失", criterion: "已声明" },
  { step_slug: "missing-criterion", status: "产物存在而完成判据缺失", output: "存在", criterion: "缺失" },
]);

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

  it("planning-hardening AC-CHECK-001 requires per-manifest status disclosure with separate output and completion facts", () => {
    const statuses = DISCLOSURE_FIXTURE.map((entry) => entry.status);
    expect(new Set(statuses)).toEqual(new Set([
      "未启动",
      "跳过",
      "已执行但产物缺失",
      "产物存在而完成判据缺失",
    ]));

    for (const stage of stages) {
      const workflow = read(`workflows/${stage}/SKILL.md`);
      expect(workflow, `${stage} must name the manifest`).toMatch(/steps\.json|steps manifest/i);
      expect(workflow, `${stage} must disclose every declared step`).toMatch(/逐项/);
      expect(workflow, `${stage} must separate output existence from completion`).toMatch(/产物(?:是否)?存在性|产物存在/);
      expect(workflow, `${stage} must name the completion criterion`).toMatch(/完成判据/);
      expect(workflow, `${stage} must preserve not-started facts`).toMatch(/未启动|not_started/);
      expect(workflow, `${stage} must preserve skipped facts`).toMatch(/跳过|skipped/);
      expect(workflow, `${stage} must preserve missing-output facts`).toMatch(/产物缺失/);
      expect(workflow, `${stage} must preserve missing-criterion facts`).toMatch(/完成判据缺失/);
      expect(workflow, `${stage} must keep executor absence unavailable`).toMatch(/executor_absent[\s\S]{0,120}(?:不可用|unavailable)|(?:不可用|unavailable)[\s\S]{0,120}executor_absent/i);
      expect(workflow, `${stage} must disclose a missing outcome`).toMatch(/无 outcome|没有 outcome|outcome 缺失/i);
      expect(workflow, `${stage} must keep unavailable distinct from skipped`).toMatch(/不可用[\s\S]{0,120}跳过|跳过[\s\S]{0,120}不可用/i);
    }
  });
});
