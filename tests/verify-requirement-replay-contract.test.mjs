import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("verify-code semantic acceptance contract", () => {
  it("requires a reverse trace from the requirement through every applicable AC", () => {
    const skill = readFileSync("workflows/verify-code/SKILL.md", "utf8");
    expect(skill).toMatch(/语义反向检查/);
    expect(skill).toMatch(/原始需求[\s\S]*决策[\s\S]*spec\.md[\s\S]*完整用户流程[\s\S]*plan\.md[\s\S]*tasks\.md[\s\S]*AC[\s\S]*测试\/证据/);
    expect(skill).toMatch(/入口[、，,\s]*成功[、，,\s]*失败[和、，,\s]*恢复/);
    expect(skill).toMatch(/每个适用\s*AC|every applicable acceptance criterion/i);
    for (const status of ["pass", "fail", "unknown", "deferred", "not_applicable"]) {
      expect(skill).toContain(status);
    }
    expect(skill).toMatch(/unavailable[\s\S]{0,100}(?:绝不是|不能算)[\s\S]{0,30}pass/i);
  });
});
