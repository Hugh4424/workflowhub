import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import {
  loadStageSkillManifest,
  validateSkillConsumerBinding,
} from "../../runtime/stage/stage-skill-runtime.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
import { validateSkillConsumerExecution } from "../../runtime/stage/stage-runner.mjs";
import { validateUiDesignLoopFact } from "../../runtime/stage/stage-content-contracts.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const repoRoot = new URL("../..", import.meta.url).pathname;

function decisionLogWithUiApplicability(result) {
  const reason = result === "ui" ? "fixture includes a page consumer" : "fixture has no page or frontend consumer";
  return `# Fixture decision\n\n## UI applicability\n\`\`\`json\n${JSON.stringify({
    result,
    sources: {
      raw_requirement: { conclusion: result, reason },
      project_inventory: { conclusion: result, reason },
      planned_or_changed_frontend_fact: { conclusion: result, reason },
    },
  }, null, 2)}\n\`\`\`\n`;
}

function readManifest(stage) {
  return yaml.load(readFileSync(join(repoRoot, "workflows", stage, "skill-deps.yaml"), "utf8"));
}

function allDeclarations() {
  return STAGES.flatMap((stage) => readManifest(stage).skills.map((skill) => ({ stage, skill })));
}

describe("stage Skill declaration to formal consumer contract", () => {
  it("requires every dynamically discovered declaration to name one concrete consumer and its identity inputs", () => {
    const declarations = allDeclarations();
    expect(declarations.length).toBeGreaterThan(0);
    for (const { stage, skill } of declarations) {
      expect(skill.consumer, `${stage}/${skill.name} consumer`).toEqual(expect.objectContaining({
        target: expect.stringMatching(/^stage-(?:handlers|runner|content-contracts)#.+/),
        inputs: expect.arrayContaining([expect.any(String)]),
        identity: ["task_id", "stage", "material_revision", "snapshot_tree"],
      }));
      expect(skill.consumer.target).not.toMatch(/(?:executed|package|event|monitoring|generic)/i);
      expect(skill.consumer.inputs.every((input) => input.trim() !== "")).toBe(true);
    }
  });

  it("fails before package resolution when a declaration is missing, duplicated, or generic", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-skill-consumer-"));
    const stageDir = join(root, "workflows", "build-spec");
    mkdirSync(stageDir, { recursive: true });
    const base = readManifest("build-spec");
    try {
      const variants = [
        ["missing", (manifest) => { delete manifest.skills[0].consumer; }],
        ["duplicate", (manifest) => { manifest.skills[1].name = manifest.skills[0].name; }],
        ["generic", (manifest) => { manifest.skills[0].consumer = { ...manifest.skills[0].consumer, target: "stage-runtime#executed" }; }],
      ];
      for (const [label, mutate] of variants) {
        const manifest = structuredClone(base);
        mutate(manifest);
        writeFileSync(join(stageDir, "skill-deps.yaml"), yaml.dump(manifest));
        expect(() => loadStageSkillManifest(root, "build-spec"), label).toThrow(/consumer|dependency/i);
      }
      const selectorManifest = structuredClone(base);
      selectorManifest.skills[0].consumer.inputs = ["receipts.review", "review.lens=obsolete"];
      writeFileSync(join(stageDir, "skill-deps.yaml"), yaml.dump(selectorManifest));
      expect(() => loadStageSkillManifest(root, "build-spec")).toThrow(/selector/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds a triggered result to the current identity and keeps unavailable/not_applicable explicit", () => {
    const dependency = allDeclarations().find(({ stage, skill }) => stage === "build-spec" && skill.name === "spec-specify").skill;
    const identity = {
      task_id: "task-1",
      stage: "build-spec",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
    };
    expect(validateSkillConsumerBinding({
      dependency,
      outcome: { status: "completed", trigger: true, executed: true },
      identity,
    })).toMatchObject({ status: "completed", consumer: dependency.consumer.target });
    expect(validateSkillConsumerBinding({
      dependency,
      outcome: { status: "unavailable", trigger: true, executed: true, reason: "provider unavailable" },
      identity,
    })).toMatchObject({ status: "unavailable" });
    expect(validateSkillConsumerBinding({
      dependency,
      outcome: { status: "not_applicable", trigger: false, executed: false, reason: "not in scope" },
      identity,
    })).toMatchObject({ status: "not_applicable" });
    expect(() => validateSkillConsumerBinding({
      dependency,
      outcome: { status: "completed", trigger: true, executed: true },
      identity: { ...identity, material_revision: "stale" },
    })).toThrow(/material_revision|identity/i);
  });

  it("does not let lifecycle flags spoof a completed or not-applicable result", () => {
    const dependency = allDeclarations().find(({ stage, skill }) => stage === "build-spec" && skill.name === "spec-specify").skill;
    const identity = {
      task_id: "task-1",
      stage: "build-spec",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
    };
    expect(() => validateSkillConsumerBinding({
      dependency,
      outcome: { status: "completed", trigger: false, executed: false },
      identity,
    })).toThrow(/completed.*trigger=true.*executed=true/i);
    expect(() => validateSkillConsumerBinding({
      dependency,
      outcome: { status: "completed", trigger: true, executed: false },
      identity,
    })).toThrow(/completed.*trigger=true.*executed=true/i);
    expect(() => validateSkillConsumerBinding({
      dependency,
      outcome: { status: "not_applicable", trigger: true, executed: false, reason: "wrong scope" },
      identity,
    })).toThrow(/not_applicable.*trigger=false.*executed=false/i);
  });

  it("does not let an acknowledged UI reply pretend that design approval is complete", () => {
    const result = validateUiDesignLoopFact({
      state: "human_acknowledged",
      current_material_ref: "spec.md",
      human_confirmation: { result: "acknowledged" },
      continuation_allowed: true,
    });
    expect(result.ok).toBe(false);
  });

  it("keeps an empty component-quality contract unknown without changing the explicit non-UI default", async () => {
    const worker = {
      stage: "verify-code",
      identity: { taskId: "task-component-quality" },
      manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: `revision-${"b".repeat(64)}`,
      snapshotWorkspace: () => ({ tree: "a".repeat(40) }),
      readArtifact: () => "# Fixture decision\n",
    };
    const unknown = await officialStageHandler("verify-code")(worker, { contract_facts: {} });
    expect(unknown.facts.component_quality).toMatchObject({ status: "unknown", applicability: "unknown" });
    expect(unknown.missing_items).toContain("component quality applicability is unknown");

    const nonUiWorker = { ...worker, readArtifact: () => decisionLogWithUiApplicability("non_ui") };
    const nonUi = await officialStageHandler("verify-code")(nonUiWorker, { contract_facts: { impact: "non_ui" } });
    expect(nonUi.facts.component_quality).toMatchObject({ status: "not_applicable", applicability: "non_ui" });
  });

  it("does not call a declared Skill consumer consumed until that consumer was observed", () => {
    const binding = {
      status: "completed",
      trigger: true,
      executed: true,
      consumer: "stage-content-contracts#validateComponentQualityMap",
      inputs: ["contract_facts.component_quality_map"],
      result: "facts.component_quality",
    };
    const args = {
      skillId: "frontend-component-quality",
      binding,
      handlerInput: { contract_facts: { component_quality_map: [{ component: "SettingsForm" }] }, receipts: {} },
      stageOutcome: { value: {} },
      handlerResult: { facts: { component_quality: { status: "recorded" } } },
    };
    expect(validateSkillConsumerExecution({ ...args, worker: {} })).toMatchObject({ status: "incomplete" });
    expect(validateSkillConsumerExecution({
      ...args,
      worker: { hasConsumerInvocation: (target) => target === binding.consumer },
    })).toMatchObject({ status: "consumed", consumer: binding.consumer });
  });
});
