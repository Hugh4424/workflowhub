import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

describe("local planning quality absorption", () => {
  test("spec-plan carries right-sizing, global constraints, and interfaces", () => {
    const skill = read("skills/spec-plan/SKILL.md");
    const template = read("skills/spec-plan/templates/plan-template.md");
    expect(skill).toContain("Task Right-Sizing");
    expect(skill).toContain("Global Constraints");
    expect(skill).toContain("Interfaces: Consumes / Produces");
    expect(template).toContain("## Global Constraints");
    expect(template).toContain("**Interfaces**:");
  });

  test("spec-tasks maps all six sections and requires vertical slices", () => {
    const skill = read("skills/spec-tasks/SKILL.md");
    const template = read("skills/spec-tasks/templates/tasks-template.md");
    for (const label of ["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP"]) {
      expect(skill).toContain(`\`${label}\``);
    }
    expect(skill).toContain("纵向切片");
    expect(skill).toContain("blocked_by");
    expect(skill).toContain("tracer bullet");
    expect(template).toContain("## Global Constraints");
    expect(template).toContain("**Knowledge**:");
    expect(template).toContain("**STOP**:");
  });

  test("research, review, planning and release rules cover adopted upstream ideas", () => {
    expect(read("skills/spec-research/SKILL.md")).toContain("primary source");
    const review = read("skills/review/SKILL.md");
    for (const value of ["Standards", "Spec", "DIFF-VERIFIABLE", "CROSS-REPO", "EXTERNAL-STATE", "CONTENT-SHAPE"]) expect(review).toContain(value);
    expect(read("skills/spec-plan/SKILL.md")).toContain("state/data-flow");
    expect(read("workflows/verify-code/SKILL.md")).toContain("standalone distributable");
  });
});

describe("local interview and testing quality absorption", () => {
  test("grill has four objective exits and fail-to-human semantics", () => {
    const skill = read("skills/grill-with-docs/SKILL.md");
    for (const item of ["外部依赖接口", "唯一权威定义", "失败路径/异常语义", "范围边界"]) {
      expect(skill).toContain(item);
    }
    expect(skill).toContain("立即停止并转人工");
    expect(skill).toContain("用户明确表示跳过");
    expect(skill).toContain("does not invoke or require a separate domain-modeling skill");
  });

  test("test strategy rejects mock and test-only API anti-patterns", () => {
    const skill = read("skills/test-strategy/SKILL.md");
    expect(skill).toContain("Mocks are boundaries, not assertions");
    expect(skill).toContain("No test-only production API");
    expect(skill).toContain("Vertical slices");
    expect(skill).toContain("Independent oracle");
  });
});
