import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("verify-code material boundary contract", () => {
  it("does not turn material replay into a final-stage code gate", () => {
    const skill = readFileSync("workflows/verify-code/SKILL.md", "utf8");
    expect(skill).toMatch(/只审查代码/);
    expect(skill).toMatch(/不重新检查其完整性/);
    expect(skill).toMatch(/不列 AC 逐条结论/);
    expect(skill).not.toMatch(/语义反向检查/);
    expect(skill).not.toMatch(/每个适用\s*AC|every applicable acceptance criterion/i);
    expect(skill).not.toMatch(/原始需求[\s\S]*完整用户流程[\s\S]*测试\/证据/);
  });
});
