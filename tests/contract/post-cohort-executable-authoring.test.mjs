import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("post-cohort executable authoring", () => {
  it("preserves global engineering design and requirement-to-task trace in the spec template", () => {
    const template = read("skills/spec-specify/templates/spec-template.md");
    const design = template.split("## 实现设计（全局权威）")[1]?.split("## Appendix A")[0];
    expect(design).toBeTruthy();
    for (const heading of [
      "### 代码锚点", "### 接口与失败语义",
      "### 需求到任务追踪", "### 全局验证策略",
    ]) expect(design, heading).toContain(heading);
    for (const requirement of ["原始 PRD/用户要求", "来源 / 决定", "Phase / Task", "正例 + 负例判据 / 证据", "失败语义", "新增", "修改", "禁止改动"]) {
      expect(design, requirement).toContain(requirement);
    }
  });

  it("requires independently executable cards within each Phase, not one-line Task IDs", () => {
    const author = read("skills/spec-plan/SKILL.md");
    const template = read("skills/spec-plan/templates/phase-template.md");
    expect(author).toContain("execution dry-run");
    expect(author).toContain("original requirement");
    expect(template).toMatch(/^### Tnnn — /m);
    const taskCard = template.split("### Tnnn — ")[1]?.split("## L2")[0];
    expect(taskCard).toBeTruthy();
    for (const field of [
      "来源 / FR / AC", "文件 / 符号", "动作", "输入", "输出 / 失败",
      "依赖", "RED/GREEN 门禁命令", "RED 目标失败", "GREEN 判定器",
      "证据", "停止 / 恢复", "覆盖上限",
    ]) expect(taskCard, field).toContain(`**${field}**`);
    expect(taskCard).toContain("第一处改动");
    expect(taskCard).toContain("同一个判定器编号");
    expect(template).not.toContain("one-line results");
    expect(author).toContain("unique across the entire task, not per Phase");
    expect(author).toContain("Never restart at `T001` in each Phase");
    expect(template).toContain("下一个 Phase 接续编号");
  });

  it("routes blueprint and test tier into physical Phase cards, not post plan/tasks", () => {
    const deps = yaml.load(read("workflows/build-plan/skill-deps.yaml"));
    const byName = new Map(deps.skills.map((skill) => [skill.name, skill]));
    for (const name of ["spec-plan", "testing-system-blueprint", "test-routing-advisor"]) {
      const inputs = byName.get(name).consumer.inputs;
      expect(inputs, name).toContain("artifacts.phase_authorities");
      expect(inputs, name).not.toContain("artifacts.plan.md");
      expect(inputs, name).not.toContain("artifacts.tasks.md");
    }
    expect(byName.get("spec-tasks").consumer.inputs).toEqual(["artifacts.phase_index"]);
    for (const name of ["spec-analyze", "stage-reflection", "stage-handoff"]) {
      expect(byName.get(name).consumer.inputs).toContain("artifacts.phase_authorities");
      expect(byName.get(name).consumer.inputs).toContain("artifacts.phase_index");
    }
    expect(read("skills/testing-system-blueprint/SKILL.md")).toContain("逐 Task");
    expect(read("skills/test-routing-advisor/SKILL.md")).toContain("逐 Task 卡");
  });

  it("documents the narrow legacy pure-document alternative without new required fields", () => {
    const template = read("skills/spec-plan/templates/phase-template.md");
    const example = template.split("### G-2 纯文档示例（既有字段，无新增运行行为）")[1]?.split("### 编号与交接")[0];
    expect(example, "authors need a concrete compatible G-2 card, not only a footnote").toBeTruthy();
    for (const text of ["G-2文档无新行为", "理由", "风险", "客观替代", "披露", "预期0", "不执行RED", "结构接纳不等于", "行为或混合", ".md", "ORACLE-"]) {
      expect(example, text).toContain(text);
    }
    for (const field of ["输入", "文件 / 符号", "预期退出码", "RED 目标失败", "RED 证据", "GREEN 判定器", "完成"]) {
      expect(example, field).toContain(`**${field}**`);
    }
    expect(example).not.toContain("**verification_role**");
    expect(example).not.toContain("**paired_task**");
  });

  it("makes build-plan author the real test/target RED owner and freezes the oracle for build-code", () => {
    const workflow = read("workflows/build-plan/SKILL.md");
    const author = read("skills/spec-plan/SKILL.md");
    const template = read("skills/spec-plan/templates/phase-template.md");
    for (const source of [workflow, author]) {
      expect(source).toMatch(/build-plan[\s\S]{0,350}(?:write|author|预写)[\s\S]{0,160}(?:test|测试)/i);
      expect(source).toMatch(/RED[\s\S]{0,200}(?:target assertion|目标断言)[\s\S]{0,150}(?:not setup|非 setup|非环境)/i);
      expect(source).toMatch(/DO NOT TOUCH[\s\S]{0,300}(?:change request|变更请求)[\s\S]{0,100}(?:independent review|独立审查)/i);
      expect(source).toMatch(/G-2/);
      expect(source).toMatch(/pure documentation[\s\S]*(?:reason|理由)[\s\S]*(?:risk|风险)|G-2[\s\S]*(?:reason|理由)[\s\S]*(?:risk|风险)/i);
    }
    expect(workflow).not.toContain("Do not implement code or execute RED/GREEN");
    expect(author).not.toContain("Build-plan designs these checks; build-code executes them");
    for (const field of ["预写测试", "RED 证据", "禁止改动", "测试变更请求"]) {
      expect(template).toContain(field);
    }
  });
});
