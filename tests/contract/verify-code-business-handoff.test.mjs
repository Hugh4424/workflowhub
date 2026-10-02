import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const skill = readFileSync(fileURLToPath(new URL("../../workflows/verify-code/SKILL.md", import.meta.url)), "utf8");

function boundedSection(text, title, level) {
  const headings = [...text.matchAll(/^(#{1,6})[ \t]+([^\r\n]+)\r?$/gm)]
    .map((match) => ({ level: match[1].length, title: match[2].trim(), start: match.index, end: match.index + match[0].length }));
  const matches = headings.filter((heading) => heading.level === level && heading.title === title);
  expect(matches, `one ${title} section required`).toHaveLength(1);
  const selected = matches[0];
  const next = headings.find((heading) => heading.start > selected.start && heading.level <= level);
  return text.slice(selected.end, next?.start ?? text.length);
}
function riskSection(text) {
  const review = boundedSection(text, "原始需求到实际结果抽查", 2);
  return boundedSection(review, "独立业务语义风险选样", 3);
}
function handoffSection(text) {
  return boundedSection(text, "阶段末交接", 2);
}

function checkSamples(text) {
  const section = riskSection(text);
  expect(section.replace(/\s+/g, " ")).toContain("由 verify-code 执行者基于独立冻结证据");
  for (const declaration of enumDeclarations) expect(section).toContain(declaration);
    expect(section).toMatch(/风险.{0,30}(?:选样|抽样)|(?:选样|抽样).{0,30}风险/);
    expect(section).toMatch(/(?:已抽查|抽查).{0,20}(?:case|AC).{0,20}ID/i);
    expect(section).toMatch(/(?:未抽查|未复核).{0,20}(?:case|AC).{0,20}ID/i);
    expect(section).toMatch(/(?:业务效果|business_effect).{0,120}(?:测试语义充分性|semantic_test_adequacy).{0,120}(?:代码审查|code_review)/s);
}

function checkDependencies(text) {
  const section = riskSection(text);
    expect(section).toMatch(/真实.{0,20}(?:模拟|mock)|(?:模拟|mock).{0,20}真实/i);
    expect(section).toMatch(/(?:供应商|外部服务).{0,70}(?:版本|API)/i);
    expect(section).toMatch(/(?:低置信|置信不足).{0,100}(?:假设|来源)/s);
    expect(section).toMatch(/(?:金钱|资金).{0,90}(?:隐私|权限).{0,90}(?:不可逆|恢复)/s);
    expect(section).toMatch(/(?:unknown|unavailable).{0,160}(?:owner|责任人)/s);
}

function checkHandoff(text) {
  const handoff = handoffSection(text);
  const normalized = handoff.replace(/\s+/g, " ");
  expect(normalized).toContain("答复只经现有 `confirm` 和 `receipts.confirmation` 绑定");
  expect(normalized).toContain("不创建另一确认槽");
    expect(handoff).toMatch(/(?:已有|既有).{0,25}(?:最后|最终).{0,25}(?:确认|授权)/);
    expect(handoff).toMatch(/授权.{0,20}(?:业务|验收).{0,15}者/);
    for (const item of ["环境", "权限", "数据", "入口", "操作", "成功", "失败", "回滚", "日志", "截图", "责任人"]) {
      expect(handoff, `handoff lacks ${item}`).toContain(item);
    }
    expect(handoff).toMatch(/(?:接受|拒绝).{0,15}(?:延期|待定)/);
    expect(handoff).toMatch(/(?:不|不得).{0,18}(?:每天|日常).{0,20}(?:选测|跑测|回归)/);
    expect(handoff).toMatch(/(?:无回复|未答复).{0,120}(?:不|不得).{0,12}(?:通过|pass)/s);
}

describe("ORACLE-VERIFY-BUSINESS-HANDOFF: existing verify-code semantic-review and confirmation seam", () => {
  it("selects independent risk-weighted case/AC samples and records both sampled and untouched IDs", () => {
    checkSamples(skill);
  });
  it("distinguishes real dependencies, mocked effects, missing confidence and serious risk from a business pass", () => {
    checkDependencies(skill);
  });
  it("hands the existing final authorized confirmer an executable business oracle rather than daily regression work", () => {
    checkHandoff(skill);
  });
});

const enumDeclarations = [
  "business_effect=observed_pass|observed_fail|unknown|unavailable|N/A(reason)",
  "semantic_test_adequacy=adequate|inadequate|unknown",
  "code_review=clean|resolved|incomplete|failed",
];

describe("ORACLE-P12-REVIEW-FINDING-MUTATIONS", () => {
  it("does not make reviewer/source independence an active gate", () => {
    expect(skill).not.toContain("未参与本次实现");
    expect(skill).toContain("reviewer 与实现者是否同源不构成阻塞");
  });

  it("rejects handoff without the existing confirmation binding and slot restriction", () => {
    const broken = skill.replace(
      /答复只经现有 `confirm` 和 `receipts\.confirmation` 绑定；\n没有答复就保留待确认，不创建另一确认槽。/,
      "答复交给另一机制保存；另开新的确认槽。",
    );
    expect(broken).not.toBe(skill);
    expect(() => checkHandoff(broken)).toThrow();
  });

  it.each(enumDeclarations)("rejects a risk subsection missing the exact declaration %s", (declaration) => {
    const broken = skill.replace(declaration, declaration.split("=")[0]);
    expect(broken).not.toBe(skill);
    expect(() => checkSamples(broken)).toThrow();
  });

  it("rejects generic risk keywords without independent actor and machine conclusion fields", () => {
    const generic = "## 原始需求到实际结果抽查\n### 独立业务语义风险选样\n风险抽样；已抽查 case/AC ID；未抽查 case/AC ID；业务效果 business_effect；测试语义充分性 semantic_test_adequacy；代码审查 code_review。\n## Conditional UI consumer alignment\n";
    expect(() => checkSamples(generic)).toThrow();
  });

  it("rejects enum declarations moved to a sibling subsection", () => {
    let broken = skill;
    for (const declaration of enumDeclarations) broken = broken.replace(declaration, declaration.split("=")[0]);
    broken = broken.replace("## Conditional UI consumer alignment", `### 另一个说明段\n${enumDeclarations.join("\n")}\n\n## Conditional UI consumer alignment`);
    expect(() => checkSamples(broken)).toThrow();
  });

  it("rejects genuine handoff content relocated into an unrelated later section", () => {
    const body = skill.split("## 阶段末交接\n")[1];
    expect(body).toBeTruthy();
    const broken = skill.replace(body, `交接细节尚缺。\n\n## 后续补充\n${body}`);
    expect(() => checkHandoff(broken)).toThrow();
  });
});
