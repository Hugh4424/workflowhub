import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyByMr2, shouldExitPK, shouldTriggerPK } from "../pk-rules.ts";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
const outputTemplate = readFileSync(new URL("../references/output-template.md", import.meta.url), "utf8");

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

  it("uses a host-neutral parallel capability", () => {
    expect(skill).toContain("parallel_agent_capability");
    expect(skill).not.toContain("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS");
    expect(skill).not.toContain("CLAUDE.md");
  });
});

describe("debate executable rules", () => {
  it("triggers only for direction-level disputes", () => {
    const direction = classifyByMr2("双方对需求的理解不同");
    expect(shouldTriggerPK([{ id: "F1", description: "理解不同", category: direction }]).triggered).toBe(true);
    expect(shouldTriggerPK([{ id: "F2", description: "rename", category: "implementation_only" }]).triggered).toBe(false);
  });

  it("escalates unresolved disputes at the two-round cap", () => {
    expect(shouldExitPK(2, false, false)).toMatchObject({ exit: true, requiresHumanArbitration: true });
  });
});

describe("debate v2 host-neutral contract", () => {
  it("requires four independent contexts, a file mailbox, judge silence, and a two-round cap", () => {
    expect(skill).not.toMatch(/teammate/i);
    expect(skill).toMatch(/4 个独立上下文子代理/);
    expect(skill).toMatch(/文件 mailbox/);
    expect(skill).toMatch(/主代理.*法官.*禁言/);
    expect(skill).toMatch(/2 轮.*封顶/);
    expect(skill).toMatch(/降级路径/);
  });

  it("defines a truthful output shape when parallel capability is unavailable", () => {
    expect(outputTemplate).toContain("parallel_agent_capability=unavailable");
    expect(outputTemplate).toContain("debate_execution: not_executed");
    expect(outputTemplate).toContain("四队立场书：not_applicable");
    expect(outputTemplate).toContain("不是四队共识");
  });
});
