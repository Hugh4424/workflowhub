import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("decision-log minimum content contract", () => {
  it("keeps the decision index complete without turning it into a spec copy", () => {
    const skill = read("skills/decision-log/SKILL.md");
    const template = read("skills/decision-log/templates/decision-log-template.md");
    const currentLog = read("specs/requirements-completeness-audit-20260804/decision-log.md");
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
    for (const term of ["R1", "D20", "## grill", "审查处置", "质量事实", "用户看过状态"]) {
      expect(currentLog).toContain(term);
    }
  });
});
