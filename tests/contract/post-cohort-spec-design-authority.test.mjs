import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("post-cohort spec implementation design authority", () => {
  it("keeps four requirement translations and global engineering design in spec.md", () => {
    const skill = read("skills/spec-specify/SKILL.md");
    const template = read("skills/spec-specify/templates/spec-template.md");
    expect(skill).toMatch(/spec\.md[\s\S]*implementation design/i);
    for (const section of [
      "需求解释", "验收流程", "测试标准", "架构边界",
      "实现设计", "全局依赖", "验证策略",
    ]) expect(template, section).toContain(section);
    expect(template).toMatch(/source.*FR.*AC.*Phase.*oracle/is);
    expect(template).toMatch(/PRD.*decision-log|decision-log.*PRD/i);
    expect(template).not.toMatch(/只写产品问题、行为、边界和验收，不写文件路径/);
    expect(template).not.toMatch(/工程实施方案只属于 phase/);
    expect(skill).not.toMatch(/`plan\.md` owns verified engineering facts/);
  });

  it("uses the strict AC and PFACT examples promised by the authoring skill", () => {
    const template = read("skills/spec-specify/templates/spec-template.md");
    expect(template).toContain("PFACT-001");
    expect(template).toContain("AC-DOMAIN-001");
    for (const label of ["验证：", "通过：", "失败：", "证据："]) expect(template).toContain(label);
    expect(template).not.toMatch(/- \*\*验证方法\*\*|\*\*通过条件\*\*|\*\*失败条件\*\*|\*\*证据类型\*\*/);
  });
});
