import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// card-03 P1 预写测试：只断言可观察文本事实，不引入任何门、hash 或 schema 字段。
const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const skill = (stage) => read(`workflows/${stage}/SKILL.md`);

// 取出以“按工作类型派子代理”为标题的章节正文（到下一个同级或更高级标题为止）。
function dispatchSection(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^#{2,3} .*按工作类型派子代理/.test(line));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => {
    const m = line.match(/^(#+) /);
    return m && m[1].length <= level;
  });
  return lines.slice(start, end < 0 ? undefined : start + 1 + end).join("\n");
}

describe("card-03 T001 dispatch method text (ORACLE-DISP-001)", () => {
  it.each(STAGES)("%s SKILL has a dispatch-by-work-type section that cites AGENTS.md", (stage) => {
    const section = dispatchSection(skill(stage));
    expect(section, `${stage}: missing 按工作类型派子代理 section`).not.toBeNull();
    expect(section, `${stage}: section must cite AGENTS.md as the single authority`).toContain("AGENTS.md");
  });

  it.each(["make-decision", "build-spec", "build-plan", "verify-code"])(
    "%s SKILL states the subagent output contract (先落盘、只回摘要、按子问题增量)",
    (stage) => {
      const section = dispatchSection(skill(stage)) ?? "";
      for (const phrase of ["先落盘", "只回摘要", "按子问题增量"]) expect(section, `${stage}: ${phrase}`).toContain(phrase);
    },
  );

  it("AGENTS.md carries the three observable delegation clauses", () => {
    const agents = read("AGENTS.md");
    expect(agents).toMatch(/不整份继承[^\n]*上下文/);
    expect(agents).toMatch(/不空转轮询/);
    expect(agents).toMatch(/跨 Phase 不[^\n]*全量快照/);
    // 声明不实由独立审查逐条比对发现，是事实不是门。
    expect(agents).toContain("git diff --name-only");
  });

  it("G-1 is written on both sides: build-plan produces it, build-code closes it", () => {
    const plan = skill("build-plan");
    const code = skill("build-code");
    expect(plan).toContain("G-1");
    expect(code).toContain("G-1");
    for (const phrase of ["停并行", "重排", "作废批次"]) expect(code, phrase).toContain(phrase);
    expect(plan).toContain("workflows/build-code/SKILL.md");
    expect(code).toContain("workflows/build-plan/SKILL.md");
  });

  it("build-code routes review/test repairs back to the original implementation subagent", () => {
    const section = dispatchSection(skill("build-code")) ?? "";
    expect(section).toContain("原实施子代理");
    expect(section).toContain("连续上下文");
  });
});

describe("card-03 T002 document realignment (ORACLE-DISP-003)", () => {
  const RETIRED = ["HANDOFF-make-decision-card07.md", "HANDOFF-make-decision.md", "findings.md", "progress.md", "task_plan.md"];

  it("CONTEXT.md uses 子代理 as the only execution-role vocabulary (T-023)", () => {
    const context = read("CONTEXT.md");
    expect(context).not.toContain("Phase 执行者");
    const card = context.slice(context.indexOf("**Phase Card**"), context.indexOf("**Phase Card**") + 400);
    expect(card).toContain("子代理");
  });

  it("make-decision execution model points at its own table, not a missing decision-log matrix (F-9)", () => {
    const text = skill("make-decision");
    expect(text).not.toMatch(/decision-log 的“Step×Executor 矩阵”/);
    const model = text.slice(text.indexOf("## Execution model"));
    expect(model).toContain("### Context conservation rules");
  });

  it("retires the five root progress files into docs/archive/retired-root-progress (T-029)", () => {
    for (const name of RETIRED) {
      expect(exists(name), `root ${name} should be moved`).toBe(false);
      expect(exists(`docs/archive/retired-root-progress/${name}`), `archived ${name}`).toBe(true);
    }
    expect(read("AGENTS.md")).toContain("唯一进度来源");
  });

  it("build-plan step 5 points to the phase template instead of enumerating fields (T-030)", () => {
    const text = skill("build-plan");
    expect(text).toContain("skills/spec-plan/templates/phase-template.md");
    for (const literal of [
      "phases/P<n>.md",
      "phases/index.md",
      "authority path, semantic anchor, write set, dependency, consumer",
      "The final aggregate is an ordinary Phase task, not a new public stage.",
      "L0/L1/L2",
    ]) expect(text, literal).toContain(literal);
  });

  it("build-code consumes findings by severity at phase close (G14)", () => {
    const text = skill("build-code");
    expect(text).toContain("findings-minor.md");
    expect(text).toMatch(/blocking[^\n]*major[^\n]*逐条处置/);
  });
});
