import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("verify-code bounded architect acceptance contract", () => {
  it("requires the semantic reverse check while keeping replay storage optional", () => {
    const skill = readFileSync("workflows/verify-code/SKILL.md", "utf8");
    for (const term of ["原始需求", "Design", "完整用户流程", "pass", "fail", "unknown", "deferred", "unavailable", "snapshot", "requirement replay", "证据缺失不能算 pass", "wh-review", "不重复"]) {
      expect(skill).toContain(term);
    }
    expect(skill).toMatch(/语义反向检查/);
    expect(skill).toMatch(/反向检查本身不是可选项/);
    expect(skill).toMatch(/可选的审计表现形式/);
    expect(skill).toMatch(/最多一次架构检查/);
  });
});
