import { readFileSync } from "node:fs";
import { statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import { buildPlanningArtifacts } from "../../skills/wh-review/scripts/review-materials.mjs";

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
    expect(buildSpec.skills.map((item) => item.name)).toContain("spec-specify");
    expect(buildSpec.skills.map((item) => item.name)).not.toContain("spec-clarify");
    expect(buildPlan.skills.map((item) => item.name)).toEqual(expect.arrayContaining(["spec-plan", "spec-tasks"]));
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
      expect(text).toMatch(/implementation solution|实现方案/i);
      expect(text).toMatch(/boundar|边界/i);
      expect(text).toMatch(/dependenc|依赖/i);
      expect(text).toMatch(/test plan|测试计划/i);
      expect(text).toMatch(/risk|风险/i);
      expect(text).toMatch(/rollback|回滚/i);
      expect(text).toMatch(/task mapping|任务映射/i);
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
    const forbidden = /TaskKernel|\bsnapshot\b|\binvocation\b|user_handoff|WorkflowHub Stage Progress|process index|comment projection|执行状态填写区/i;
    for (const text of [planSkill, planTemplate, tasksSkill, tasksTemplate]) {
      expect(text).not.toMatch(forbidden);
    }
    const allowedCardLabels = ["目标", "依赖", "精确文件", "动作", "验证", "证据", "Trace", "STOP", "状态", "执行事实"];
    const templateCards = tasksTemplate.split(/^## /m).slice(1);
    expect(templateCards).toHaveLength(2);
    for (const card of templateCards) {
      const labels = [...card.matchAll(/^- \*\*(.+?)\*\*：/gm)].map((match) => match[1]);
      expect(labels).toEqual(allowedCardLabels);
    }
    const buildPlanNames = buildPlan.skills.map((item) => item.name);
    expect(buildPlanNames).toContain("test-routing-advisor");
    expect(buildPlanNames).not.toEqual(expect.arrayContaining([
      "testing-system-blueprint", "backend-testing", "frontend-testing", "fullstack-slice-testing",
    ]));
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
