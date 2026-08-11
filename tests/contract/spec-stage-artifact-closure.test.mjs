import { existsSync, readFileSync } from "node:fs";
import { statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import { buildPlanningArtifacts } from "../../skills/wh-review/scripts/review-materials.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const taskCards = (markdown) => markdown.split(/^#{3,4} /m).slice(1).map((part) => {
  const [heading, ...lines] = part.split("\n");
  return { id: heading.slice(0, 4), body: lines.join("\n") };
});
const backtickValues = (body, label) => {
  const line = body.split("\n").find((item) => item.startsWith("- **" + label + "**：")) ?? "";
  return [...line.matchAll(/`([^`]+)`/g)].map(([, value]) => value);
};
// Frozen test-side mirror of the HEAD v3 readable contract. This keeps closure
// tests independent from production runtime exports and avoids adding a runtime
// surface just to make a test pass.
const PLAN_SECTIONS_V3 = Object.freeze([
  "Quick Read", "Technical Context", "Code Anchors", "Solution Design", "File Boundary",
  "Technical Decisions", "Test Strategy", "Rollback and Recovery", "Implementation Order",
  "Dependencies and Parallelism", "Requirement and Verification Traceability",
  "Governance Synchronization Matrix", "Constitution Check",
]);
const PHASE_FIELDS_V3 = Object.freeze(["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP", "Done", "Risks and rollback"]);
const TASK_FIELDS_V3 = Object.freeze([
  "ID", "Phase", "goal", "design_state", "versioned_refs", "输入", "依赖", "并行",
  "FR", "AC", "动作", "精确文件", "boundary", "输出", "Knowledge", "verification_role",
  "paired_task", "gate_cmd", "expected_exit", "oracle", "evidence_path", "STOP", "recovery", "task risk",
]);
const parseRuntimeArray = (name) => {
  const source = read("runtime/stage/stage-content-contracts.mjs");
  const match = source.match(new RegExp(`const ${name} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) throw new Error(`${name} is missing from the HEAD runtime source`);
  return [...match[1].matchAll(/"([^"\n]+)"/g)].map(([, value]) => value);
};

describe("spec and plan content artifact closure", () => {
  it("puts the decision-log source index into the derived build-plan packet", () => {
    const matrix = JSON.parse(read("runtime/review/stage-materials.json"));
    expect(matrix.stages["build-plan"].generated).toContain("planning_artifacts");
    expect(matrix.stages["build-plan"].required).toContain("raw_requirement");
    const packet = buildPlanningArtifacts({
      rawRequirementIndex: {
        schema_version: "raw-requirement-index.v1",
        source_artifact: "decision-log",
        entries: [{ id: "R-001", decision_ids: ["D-001"], summary: "原始要求" }],
      },
      approvedSpec: "spec",
      acceptanceCriteria: "acceptance",
      draftPlan: "plan",
      draftTasks: "tasks",
    });
    expect(packet.schema_version).toBe("spec-analyze-planning-artifacts.v1");
    expect(packet.raw_requirement_index.source_artifact).toBe("decision-log");
    expect(packet).not.toHaveProperty("decision_log_index");
    expect(packet.draft_tasks).toBe("tasks");
  });

  it("keeps the recovered content skills declared by their owning stage", () => {
    const buildSpec = yaml.load(read("workflows/build-spec/skill-deps.yaml"));
    const buildPlan = yaml.load(read("workflows/build-plan/skill-deps.yaml"));
    const stageManifests = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]
      .map((stage) => read(`workflows/${stage}/skill-deps.yaml`));
    expect(buildSpec.skills.map((item) => item.name)).toContain("spec-specify");
    expect(buildSpec.skills.map((item) => item.name)).toContain("spec-clarify");
    expect(buildPlan.skills.map((item) => item.name)).toEqual(expect.arrayContaining(["spec-plan", "spec-tasks"]));
    expect(stageManifests.join("\n")).toMatch(/name:\s*spec-clarify/);
    expect(stageManifests.join("\n")).not.toMatch(/name:\s*stage-step-receipts/);
    for (const item of [...buildSpec.skills, ...buildPlan.skills]) {
      if (["spec-specify", "spec-plan", "spec-tasks"].includes(item.name)) {
        expect(item.execution).toBe("inline");
        expect(item).not.toHaveProperty("invocation");
        expect(item).not.toHaveProperty("dispatch");
      }
    }
  });

  it("keeps plan and task templates design-only without runtime sediment", () => {
    const buildPlan = yaml.load(read("workflows/build-plan/skill-deps.yaml"));
    const specSkill = read("skills/spec-specify/SKILL.md");
    const specTemplate = read("skills/spec-specify/templates/spec-template.md");
    const clarify = read("skills/spec-clarify/SKILL.md");
    const planSkill = read("skills/spec-plan/SKILL.md");
    const planTemplate = read("skills/spec-plan/templates/plan-template.md");
    const tasksSkill = read("skills/spec-tasks/SKILL.md");
    const tasksTemplate = read("skills/spec-tasks/templates/tasks-template.md");
    for (const text of [specSkill, specTemplate]) {
      expect(text).toMatch(/scenario|场景/i);
      expect(text).toMatch(/failure condition|失败条件/i);
      expect(text).toMatch(/FR/);
      expect(text).toMatch(/AC/);
    }
    expect(clarify).toMatch(/十个维度/);
    for (const text of [planSkill, planTemplate]) {
      expect(text).toMatch(/implementation solution|实现方案|Quick Read/i);
      expect(text).toMatch(/boundar|边界/i);
      expect(text).toMatch(/dependenc|依赖/i);
      expect(text).toMatch(/test strategy|test plan|测试计划|测试策略/i);
      expect(text).toMatch(/risk|风险/i);
      expect(text).toMatch(/rollback|回滚/i);
      expect(text).toMatch(/task mapping|任务映射|Requirement and Verification Traceability/i);
      expect(text).toMatch(/FR.*AC|FR\/AC/si);
    }
    for (const text of [tasksSkill, tasksTemplate]) {
      expect(text).toMatch(/RED/);
      expect(text).toMatch(/GREEN/);
      expect(text).toMatch(/gate_cmd/);
      expect(text).toMatch(/expected_exit/);
      expect(text).toMatch(/oracle/i);
      expect(text).toMatch(/evidence_path/);
      expect(text).toMatch(/STOP/);
    }
    expect(tasksSkill).toMatch(/designs?[^.]*RED[^.]*GREEN/i);
    expect(tasksSkill).toMatch(/does not run|不得执行/i);
    expect(planSkill).toMatch(/Goal/);
    expect(planSkill).toMatch(/Knowledge/);
    expect(planSkill).toMatch(/F10/);
    expect(tasksSkill).toMatch(/status|状态/);
    expect(tasksSkill).toMatch(/not.*permission|不.*授权|不.*许可证/i);
    const forbidden = /TaskKernel|ArtifactDir|StageContext|CandidateWorkspace|user_handoff|WorkflowHub Stage Progress|process index|comment projection|snapshot lineage|host bridge|review lock|retry_contract|successor|predecessor|selector|\breceipts?\b|\binvocation\b/i;
    for (const text of [planSkill, planTemplate, tasksSkill, tasksTemplate]) {
      expect(text).not.toMatch(forbidden);
    }
    const requiredCardLabels = [
      ...TASK_FIELDS_V3.slice(0, 5),
      "source_refs / decision_refs",
      ...TASK_FIELDS_V3.slice(5),
    ];
    const templateCards = tasksTemplate.split(/^#### T\d+ /m).slice(1);
    expect(templateCards).toHaveLength(3);
    for (const card of templateCards) {
      const labels = [...card.matchAll(/^- \*\*(.+?)\*\*：/gm)].map((match) => match[1]);
      expect(labels.slice(0, requiredCardLabels.length)).toEqual(requiredCardLabels);
      expect(labels).toEqual(expect.arrayContaining(requiredCardLabels));
      expect(card).toMatch(/##### 执行状态填写区（唯一完成权威）/);
      expect(card).toMatch(/- \*\*status\*\*：`pending`/);
      expect(card).toMatch(/- \*\*执行事实\*\*：N\/A — not started/);
    }
    expect(planTemplate).toMatch(/## Quick Read/);
    for (const heading of PLAN_SECTIONS_V3) {
      expect(planTemplate).toMatch(new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "m"));
    }
    expect(planTemplate).toMatch(/## Constitution Check/);
    expect(planTemplate).toMatch(/## Phase P1/);
    expect(planTemplate).not.toMatch(/## 5\. Phases/);
    expect(planTemplate).toMatch(/Risks and rollback/);
    expect(planTemplate).toMatch(/同一 `gate_cmd`/);
    expect(tasksTemplate).toMatch(/## Phase P1/);
    expect(tasksTemplate).toMatch(/### Files/);
    expect(tasksTemplate).toMatch(/### Done/);
    const phaseBlock = tasksTemplate.split("## Phase P1")[1].split("## 4. Final current-snapshot aggregate strategy")[0];
    expect(phaseBlock).toMatch(/### Goal/);
    expect(phaseBlock).toMatch(/### Files/);
    expect(phaseBlock).toMatch(/### Tasks/);
    expect(phaseBlock).toMatch(/### Verify/);
    expect(phaseBlock).toMatch(/### Knowledge/);
    expect(phaseBlock).toMatch(/### STOP/);
    expect(phaseBlock).toMatch(/### Done/);
    expect(phaseBlock).toMatch(/### Risks and rollback/);
    expect(parseRuntimeArray("PLAN_SECTIONS_V3")).toEqual(PLAN_SECTIONS_V3);
    expect(parseRuntimeArray("PHASE_FIELDS_V3")).toEqual(PHASE_FIELDS_V3);
    expect(parseRuntimeArray("TASK_FIELDS_V3")).toEqual(TASK_FIELDS_V3);
    const planPhaseFiles = planTemplate.split("## Phase P1")[1].split("### Files")[1].split("### Tasks")[0].trim();
    const tasksPhaseFiles = tasksTemplate.split("## Phase P1")[1].split("### Files")[1].split("### Tasks")[0].trim();
    expect(tasksPhaseFiles).toBe(planPhaseFiles);
    expect(planPhaseFiles).toMatch(/\*\*NEW\*\*：`[^`]+`/);
    expect(planPhaseFiles).toMatch(/\*\*MODIFY\*\*：`[^`]+`/);
    expect(tasksTemplate).toMatch(/## 4\. Final current-snapshot aggregate strategy/);
    expect(tasksTemplate).toMatch(/- \*\*tier \/ method\*\*：\[填写：最终 tier 与具体 testing skill\]/);
    expect(tasksTemplate).toMatch(/\*\*command\*\*: `\[填写：可执行最终命令\]`/);
    expect(tasksSkill).toMatch(/checkbox[\s\S]{0,120}status[\s\S]{0,120}agree/i);
    expect(tasksTemplate).not.toMatch(/## Appendix A\. Legacy import/);
    expect(tasksTemplate).not.toMatch(/## Requirement and Verification Traceability/);
    const buildPlanNames = buildPlan.skills.map((item) => item.name);
    expect(buildPlanNames).toContain("test-routing-advisor");
    expect(buildPlanNames).toContain("testing-system-blueprint");
    expect(buildPlanNames).not.toEqual(expect.arrayContaining([
      "backend-testing", "frontend-testing", "fullstack-slice-testing",
    ]));
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/Do not run Talk, Clarify, or Grill here/);
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/double-solution exercise/);
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const specPlanEntry = catalog.skills.find((item) => item.name === "spec-plan");
    expect(specPlanEntry).not.toHaveProperty("retry_contract");
    const specAnalyzeBundle = validateSkillBundle(root, "skills/spec-analyze/skill-bundle.json", "skills/spec-analyze/SKILL.md");
    expect(catalog.skills.find((item) => item.name === "spec-analyze").local_bundle_hash).toBe(specAnalyzeBundle.bundleHash);
    expect(catalog.skills.find((item) => item.name === "spec-clarify").used_by_stages).toEqual(["build-spec"]);
    expect(catalog.skills.find((item) => item.name === "stage-step-receipts").used_by_stages).toEqual([]);
    for (const item of catalog.skills.filter((entry) => entry.local_bundle_hash && entry.path)) {
      const bundle = item.path.replace(/SKILL\.md$/, "skill-bundle.json");
      if (!existsSync(join(root, bundle))) continue;
      const closure = validateSkillBundle(root, bundle, item.path);
      expect(closure.bundleHash, `${item.name} bundle hash`).toBe(item.local_bundle_hash);
    }
    const makeDecisionSteps = JSON.parse(read("workflows/make-decision/steps.json"));
    expect(makeDecisionSteps.steps[10].observable_result).toMatch(/actual confirmation/i);
    expect(makeDecisionSteps.steps[10].observable_result).toMatch(/no extra delivery-state object/i);
    const specAnalyze = read("skills/spec-analyze/SKILL.md");
    expect(specAnalyze).toMatch(/same task may continue writing and repairing/i);
    expect(specAnalyze).toMatch(/before declaring the stage complete/i);
    expect(specAnalyze).not.toMatch(/before any material is changed or work proceeds/i);
  });

  it("keeps the current P3 task cards source-bound and executable", () => {
    const markdown = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/tasks.md");
    const cards = taskCards(markdown).filter(({ id }) => ["T005", "T006"].includes(id));
    expect(cards).toHaveLength(2);
    const requiredLabels = [
      "source_refs / decision_refs",
      "execution_file_paths",
      "test_strategy_owner",
      "test tier / test method",
      "fixtures_services",
      "evidence_path",
      "coverage limits",
    ];
    for (const { id, body } of cards) {
      for (const label of requiredLabels) {
        const hasLabel = body.split("\n").some((line) => line.startsWith("- **" + label + "**：") || (label === "coverage limits" && line.startsWith("- **coverage_limits**：")));
        expect(hasLabel, id + " missing " + label).toBe(true);
      }
      const exact = backtickValues(body, "精确文件");
      const execution = backtickValues(body, "execution_file_paths").flatMap((value) => {
        try { return JSON.parse(value); } catch { return [value]; }
      });
      expect(exact.length, id + " has no exact file boundary").toBeGreaterThan(0);
      expect(execution.length, id + " has no execution file paths").toBeGreaterThan(0);
      expect(new Set(exact)).toEqual(new Set(execution));
      for (const file of [...exact, ...execution]) {
        expect(file.endsWith("/") || file.includes("*") || file.includes("..."), id + " contains a directory/glob path").toBe(false);
        expect(statSync(join(root, file)).isFile(), id + " path is not a file: " + file).toBe(true);
      }
      expect(body).toMatch(/- \*\*test_strategy_owner\*\*：`?build-plan\/high-intelligence-model/);
      expect(body).toMatch(/source_refs \/ decision_refs.*(?:R-[0-9]+|D-[0-9]+)/);
    }
    expect(markdown).toMatch(/## 4\. Final current-snapshot aggregate strategy/);
    expect(markdown).toMatch(/\*\*execution_contract\*\*：当前快照运行一次/s);
  });
});
