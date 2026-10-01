import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("post-cohort build-plan material authors", () => {
  it("routes implementation design into spec and one independent file per Phase", () => {
    const workflow = read("workflows/build-plan/SKILL.md");
    const author = read("skills/spec-plan/SKILL.md");
    const template = read("skills/spec-plan/templates/phase-template.md");

    expect(workflow).toContain("phases/P<n>.md");
    expect(author).toContain("phases/P<n>.md");
    expect(author).toMatch(/spec\.md[\s\S]*implementation design/i);
    expect(author).not.toMatch(/Write only `plan\.md`/);
    expect(template).toMatch(/全局规格[\s\S]*spec\.md/);
    for (const field of ["L0", "L1", "L2", "写入集", "依赖", "停止", "RED/GREEN 门禁命令", "判定器", "覆盖上限", "禁止改动"]) {
      expect(template, field).toContain(field);
    }
    expect(template).not.toContain("plan.md");
    expect(template).not.toContain("tasks.md");
  });

  it("renders phases/index.md as pointers only", () => {
    const author = read("skills/spec-tasks/SKILL.md");
    const template = read("skills/spec-tasks/templates/index-template.md");
    expect(author).toContain("phases/index.md");
    expect(author).not.toMatch(/Write only `tasks\.md`/);
    expect(template).toMatch(/phases\/P<n>\.md/);
    for (const field of ["语义锚点", "写入集", "依赖", "消费者"]) expect(template).toContain(field);
    for (const forbidden of ["gate_cmd", "expected_exit", "oracle", "evidence_path", "execution status", "门禁命令", "预期退出码", "判定器", "证据路径", "执行状态"]) {
      expect(template).not.toContain(forbidden);
    }
  });

  it("makes the final consistency lens compare source, design, phase files, and pointers", () => {
    const lens = read("skills/spec-analyze/SKILL.md");
    expect(lens).toContain("phases/P<n>.md");
    expect(lens).toContain("phases/index.md");
    expect(lens).toMatch(/raw requirement[\s\S]*spec\.md[\s\S]*phases\/P<n>\.md/i);
  });
});
