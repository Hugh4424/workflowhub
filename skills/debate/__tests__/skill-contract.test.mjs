import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

describe("debate optional contract", () => {
  it("is optional and degrades without teams", () => {
    expect(skill).toContain("可选便利层");
    expect(skill).toContain("自动降级单人三档");
    expect(skill).toContain("不阻塞工作流");
  });

  it("does not replace independent review", () => {
    expect(skill).toContain("不替代独立审查");
    expect(skill).toContain("不得用 `debate` 的子代理去**生成审查发现本身**");
  });
});

