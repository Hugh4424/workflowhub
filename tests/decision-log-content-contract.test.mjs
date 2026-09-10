import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");
const root = resolve(new URL("..", import.meta.url).pathname);

describe("decision-log minimum content contract", () => {
  it("keeps the decision index complete without turning it into a spec copy", () => {
    const skill = read("skills/decision-log/SKILL.md");
    const template = read("skills/decision-log/templates/decision-log-template.md");
    const currentLog = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/decision-log.md");
    for (const term of [
      "decision-entry.v1",
      "原始需求",
      "调研重点",
      "Talk",
      "Grill",
      "事实与约束",
      "Logic",
      "后果和风险",
      "未决项",
      "Supersedes",
      "Approval binding",
      "decision-omission-acceptance.v1",
      "不要复制 spec",
      "队列",
      "质量事实",
      "推进资格",
      "完成判据",
      "不可逆授权边界",
      "original_fact",
      "retain_or_delete",
      "rejected_invalid",
    ]) {
      expect(`${skill}\n${template}`).toContain(term);
    }
    for (const heading of [
      "## 原始需求",
      "## 调研",
      "## 三轮 talk",
      "## grill",
      "## 决定",
      "## 成功/失败边界",
      "## 审查处置",
      "## 风险与延期交接",
      "## Exit checks",
    ]) {
      expect(template).toContain(heading);
    }
    for (const term of ["R-001", "D-015", "Grill 与用户确认", "审查处置", "质量事实", "用户可见选择"]) {
      expect(currentLog).toContain(term);
    }
  });

  it("requires a same-log append update after every make-decision step", () => {
    const steps = JSON.parse(read(`${root}/workflows/make-decision/steps.json`)).steps;
    expect(steps).toHaveLength(14);
    for (const step of steps.filter((step) => step.step_slug !== "stage-reflection")) {
      expect(step.completion_evidence.some(({ kind, uri_or_path }) => kind === "decision_log" && uri_or_path === "decision-log.md"), step.step_slug).toBe(true);
      expect(step.observable_result).toMatch(/existing writer|same decision-log\.md/i);
    }
    const skill = read("workflows/make-decision/SKILL.md");
    expect(skill).toMatch(/same[\s\S]{0,40}`decision-log\.md` ref\/hash/);
    expect(skill).toMatch(/actual[\s\S]{0,20}user reply or `no_new_requirement`/);
    expect(skill).toMatch(/write failure stays incomplete/);
  });

  it("RED: requires one OI authority with framework/category coverage and terminal proof fields", () => {
    const skill = read("skills/decision-log/SKILL.md");
    const template = read("skills/decision-log/templates/decision-log-template.md");
    const workflow = read("workflows/make-decision/SKILL.md");
    const contract = `${skill}\n${template}\n${workflow}`;

    for (const node of ["background", "problem", "goal", "solution", "acceptance", "extension"]) {
      expect(contract, `framework node ${node}`).toContain(node);
    }
    for (const category of [
      "complete_user_flow", "page_scope", "data_state",
      "success_failure_boundary", "non_goals", "deferred",
    ]) {
      expect(contract, `fixed category ${category}`).toContain(category);
    }
    for (const field of [
      "task_id", "outline_version", "oi_id", "category", "source",
      "question", "status", "selected_disposition", "impact_dimensions",
      "requires_user_decision", "visible_group_id", "batch_id",
      "interaction_ref", "interaction_hash",
    ]) {
      expect(contract, `OI field ${field}`).toContain(field);
    }
    expect(contract).toMatch(/one current OI|唯一 OI|唯一权威.*OI/i);
    expect(contract).toMatch(/empty\s*:\s*true/);
    expect(contract).toMatch(/non-placeholder|非占位|不能只写.*none|bare.*none/i);
    expect(contract).toMatch(/questions-only/);
    expect(contract).toMatch(/direction[\s\S]{0,500}detail[\s\S]{0,500}approve-decision/i);
  });
});
