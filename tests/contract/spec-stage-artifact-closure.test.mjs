import { readFileSync } from "node:fs";
import { statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const taskCards = (markdown) => markdown.split(/^#### /m).slice(1).map((part) => {
  const [heading, ...lines] = part.split("\n");
  return { id: heading.slice(0, 4), body: lines.join("\n") };
});
const backtickValues = (body, label) => {
  const line = body.split("\n").find((item) => item.startsWith("- **" + label + "**：")) ?? "";
  return [...line.matchAll(/`([^`]+)`/g)].map(([, value]) => value);
};

describe("spec and plan content artifact closure", () => {
  it("keeps the recovered content skills declared by their owning stage", () => {
    const buildSpec = yaml.load(read("workflows/build-spec/skill-deps.yaml"));
    const buildPlan = yaml.load(read("workflows/build-plan/skill-deps.yaml"));
    expect(buildSpec.skills.map((item) => item.name)).toEqual(expect.arrayContaining(["spec-specify", "spec-clarify"]));
    expect(buildPlan.skills.map((item) => item.name)).toEqual(expect.arrayContaining(["spec-plan", "spec-tasks"]));
    for (const item of [...buildSpec.skills, ...buildPlan.skills]) {
      if (["spec-specify", "spec-clarify", "spec-plan", "spec-tasks"].includes(item.name)) {
        expect(item.execution).toBe("inline");
        expect(item.invocation).toBe("always");
      }
    }
  });

  it("retains the high-value template fields without creating a second authority", () => {
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
      expect(text).toMatch(/Constitution/);
      expect(text).toMatch(/STOP/);
      expect(text).toMatch(/rollback|恢复/i);
      expect(text).toMatch(/FR.*AC|FR\/AC/si);
    }
    for (const text of [tasksSkill, tasksTemplate]) {
      expect(text).toMatch(/RED/);
      expect(text).toMatch(/GREEN/);
      expect(text).toMatch(/oracle/i);
      expect(text).toMatch(/evidence/i);
      expect(text).toMatch(/Dependency Graph|DAG/);
    }
    expect(tasksSkill).toMatch(/test-routing-advisor/);
    expect(tasksSkill).toMatch(/testing-system-blueprint/);
    expect(tasksTemplate).toMatch(/test_strategy_owner/);
    expect(tasksTemplate).toMatch(/scenarios \/ commands \/ expected exit \/ oracle/);
    expect(tasksTemplate).toMatch(/test method/);
    expect(tasksTemplate).toMatch(/build-code.*只执行/s);
    expect(tasksTemplate).toMatch(/coverage limits/);
    expect(tasksTemplate).toMatch(/final current-snapshot aggregate strategy/);
    expect(tasksTemplate).toMatch(/evidence_refs.*TaskKernel|TaskKernel.*evidence_refs/s);
    expect(tasksTemplate).toMatch(/evidence_note/);
    const buildPlanNames = buildPlan.skills.map((item) => item.name);
    expect(buildPlanNames).toEqual(expect.arrayContaining([
      "test-routing-advisor",
      "testing-system-blueprint",
      "backend-testing",
      "frontend-testing",
      "fullstack-slice-testing",
    ]));
  });

  it("requires every current task card to carry an executable, source-bound strategy", () => {
    const markdown = read("specs/requirements-completeness-audit-20260804/tasks.md");
    const cards = taskCards(markdown).filter(({ id }) => /^T[0-9]{3}$/.test(id) && Number(id.slice(1)) <= 28);
    expect(cards).toHaveLength(28);
    const requiredLabels = [
      "Workflow stage",
      "source_refs / decision_refs",
      "execution_file_paths",
      "test_strategy_owner",
      "test tier / test method",
      "scenarios / commands / expected exit / oracle",
      "fixtures_services",
      "browser_route",
      "execution_contract",
      "final current-snapshot aggregate strategy",
      "coverage limits",
    ];
    for (const { id, body } of cards) {
      for (const label of requiredLabels) {
        const hasLabel = body.split("\n").some((line) => line.startsWith("- **" + label + "**：") || (label === "coverage limits" && line.startsWith("- **coverage_limits**：")));
        expect(hasLabel, id + " missing " + label).toBe(true);
      }
      expect(body, id + " must retain one completion area").toContain("执行状态填写区（唯一完成权威）");
      const exact = backtickValues(body, "精确文件");
      const execution = backtickValues(body, "execution_file_paths");
      expect(exact.length, id + " has no exact file boundary").toBeGreaterThan(0);
      expect(execution.length, id + " has no execution file paths").toBeGreaterThan(0);
      expect(new Set(exact)).toEqual(new Set(execution));
      for (const file of [...exact, ...execution]) {
        expect(file.endsWith("/") || file.includes("*") || file.includes("..."), id + " contains a directory/glob path").toBe(false);
        expect(statSync(join(root, file)).isFile(), id + " path is not a file: " + file).toBe(true);
      }
      expect(body).toMatch(/- \*\*test_strategy_owner\*\*：`?build-plan\/high-intelligence-model/);
      expect(body).toMatch(/source_refs \/ decision_refs.*(?:R[0-9]+|D[0-9]+)/);
      expect(body).toMatch(/execution_contract.*build-code.*(?:消费|执行)/s);
    }
  });
});
