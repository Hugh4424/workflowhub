// 预置测试（build-plan 阶段写出，随后冻结）——CARD-04 / A4（普查前置到写入契约）。
//
// 根因（见 quality/reviews/a4-census-upstream-design-20260923.md §0）：card-04 实测
// 「上游需求在 build-plan 里被静默遗漏、机器判据全绿」不是「make-decision 忘了写」，
// 而是【写入契约与读取契约不一致】。解析权威
// `runtime/stage/stage-content-contracts.mjs` 的 deriveDecisionLogOriginalSourceCensus
// 要求三节共存：
//   `## 需求变更记录`（`### U-nnn` 逐字块，含 `>` 引文）
//   `## 原始需求索引`（`| R-nnn | <U/V 锚点> | D-nnn |` 三列）
//   `## 逐字声明层（verbatim）`（`| V-nnn | 用户 | … | … |` 四列，说话人列必须精确是「用户」）
// 而当前模板 `skills/decision-log/templates/decision-log-template.md` 用
// `## 原始需求`(:12) + `## 原始声明层`(:18) 替换掉了其中两节，且完全没有
// `## 需求变更记录`。实测模板与 card-04 的 decision-log 逐字相同：status="present"、
// entries=0、source_units=0、source_counts={u:0,atoms:0,v:0,r:0}、errors=5 条。
// → 此后每一张按模板正确执行的新卡，make-decision 必然产出 5 条普查错误。
//
// 本文件把三节格式钉在【写入侧】（模板 + SKILL 文本）的材料完整性要求上：
// 不做新门、只对新卡生效、不动归档卡、不改任何 runtime 代码。
//
// 【未断言的延后面，故意留白】
//   M2（在 runtime/stage/stage-handlers.mjs 的 make-decision handler 里把普查结果
//   投影成 stage outcome 的 `facts.original_source_census`，report-only、不进
//   completion_subjects/missing_items）属代码侧；用户已裁定 A-4 本相位【只做材料/skill 侧】，
//   故本文件不断言 `facts.original_source_census`、不断言 T4「非阻断三连」、
//   也不断言 T5「投影不含 sha256/byte_start/byte_end」（SD-17 内容寻址哈希护栏）。
//   这些留待 M2 相位另立预置测试，本文件不预设其存在（若在此断言会变成恒假红）。
//   M3（status 命令的 source_census 可见性）同样不在本相位范围内。
//
// 【同样故意不断言】本卡（card-04）自身 decision-log 的 errors 非空或 entries 为空：
//   同相位的 T009（specs/workflowhub-thin-core-card-04-20260919/phases/P6.md:23）
//   会给它补上三节，任何依赖「它现在为空」的断言在 T009 完成后都会变成假红。
//   本文件只断言【归档卡仍可读】与【缺三节的文本不抛错】这两条不变式。
//
// 约束：零新依赖（只用 vitest 2.1.9 与 node:*）；只读仓库文件，不写任何材料。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { deriveDecisionLogOriginalSourceCensus } from "../../runtime/stage/stage-content-contracts.mjs";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), "utf8");

const TEMPLATE_PATH = "skills/decision-log/templates/decision-log-template.md";
const DECISION_LOG_SKILL_PATH = "skills/decision-log/SKILL.md";
const MAKE_DECISION_SKILL_PATH = "workflows/make-decision/SKILL.md";
// 归档卡（card-07 在模板被"标准化"之前写成，带着普查要的三节）：M1 只改模板/SKILL 文本，
// 不得让任何既有 decision-log 从可读变成不可读。
const ARCHIVED_DECISION_LOG_PATH = "specs/archive/workflowhub-thin-core-card-07-20260919/decision-log.md";

const VERBATIM_HEADING = "## 逐字声明层（verbatim）";

// 缺三节的最小合成文本（非本卡材料，只用来证明「旧格式不抛错」）。
const SYNTHETIC_WITHOUT_TRIO = "# x\n\n## 原始需求\n\n| R-001 | U-001 | D-001 | y |\n";

const TEMPLATE_MISSING_TRIO = "根因：模板 skills/decision-log/templates/decision-log-template.md 实测 "
  + "status=\"present\" 但 entries=0、source_units=0、source_counts={u:0,atoms:0,v:0,r:0}、errors=5 条"
  + "（3 条以 \" section\" 结尾的三节缺失诊断 + 2 条 U/V、R 行缺失诊断）；"
  + "按此模板正确执行的每一张新卡都会继承这 5 条错误";

const template = read(TEMPLATE_PATH);
const templateCensus = deriveDecisionLogOriginalSourceCensus(template);

// A filled *test fixture*, not a real user's declaration or a published Task.
// Keep this separate from the old archive example so the current template is
// actually consumed by the same parser that reads new decision logs.
function filledTemplate() {
  return template
    .replace("<用户逐字原文；新卡必须替换此占位符>", "测试夹具：请保留每条原始需求的逐字来源。")
    .replace("<消息或访谈定位；新卡必须替换>", "fixture:message-1")
    .replace("<消息/时间；新卡必须替换>", "fixture:message-2")
    .replace("<用户逐字文本；新卡必须替换>", "测试夹具：验收时必须能回读来源。")
    .replace("<对应决定/规格落点；新卡必须替换>", "D-001 / FR-001")
    .replace("> 测试夹具：请保留每条原始需求的逐字来源。", "测试夹具：请保留每条原始需求的逐字来源。");
}

function sectionText(markdown, heading) {
  const headingLine = `## ${heading}\n`;
  const start = markdown.indexOf(headingLine);
  if (start < 0 || start > 0 && markdown[start - 1] !== "\n") return "";
  const tail = markdown.slice(start + headingLine.length);
  const next = /^## /m.exec(tail);
  return next ? tail.slice(0, next.index) : tail;
}

function generatedTemplateProblems(markdown) {
  const census = deriveDecisionLogOriginalSourceCensus(markdown);
  const problems = [];
  if (census.status !== "present") problems.push("missing_material");
  if (census.errors.length !== 0) problems.push("parser_errors");
  if (census.entries.length === 0) problems.push("empty_entries");
  if (!/^### U-001[^\n]*\n[\s\S]*^> 测试夹具：请保留每条原始需求的逐字来源。$/m.test(sectionText(markdown, "需求变更记录"))) problems.push("U_outside_section");
  if (!/^\| R-001 \| U-001、V-001 \| D-001 \|/m.test(sectionText(markdown, "原始需求索引"))) problems.push("R_outside_section");
  if (!/^\| V-001 \| 用户 \| fixture:message-2 \| 测试夹具：验收时必须能回读来源。 \|$/m.test(sectionText(markdown, "逐字声明层（verbatim）"))) problems.push("V_outside_section");
  return problems;
}

/** 删掉一个二级小节的整段（含标题行到下一个 `## ` 之前）。小节不存在时原样返回。
 *  写法沿用 tests/contract/decision-log-census.test.mjs:32-41。 */
function removeSection(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start < 0) return markdown;
  const lineEnd = markdown.indexOf("\n", start);
  const bodyStart = lineEnd < 0 ? markdown.length : lineEnd + 1;
  const tail = markdown.slice(bodyStart);
  const next = /^## /m.exec(tail);
  const bodyEnd = next ? bodyStart + next.index : markdown.length;
  return markdown.slice(0, start) + markdown.slice(bodyEnd);
}

describe("普查前置到写入契约：模板与 SKILL 必须自带三节格式（A4 / M1）", () => {
  it("T1e 当前模板填入测试来源后，可由真实普查器读取非空分母且三类行各在本节", () => {
    expect(generatedTemplateProblems(filledTemplate())).toEqual([]);
  });

  it.each([
    ["U 引文缺失", (text) => text.replace("> 测试夹具：请保留每条原始需求的逐字来源。", "测试夹具：请保留每条原始需求的逐字来源。"), "U_outside_section"],
    ["R 索引行缺失", (text) => text.replace("| R-001 | U-001、V-001 | D-001 |", "| R-001 | 没有来源 | 未定 |"), "R_outside_section"],
    ["V 用户原文行缺失", (text) => text.replace("| V-001 | 用户 | fixture:message-2 | 测试夹具：验收时必须能回读来源。 |", "| V-001 | 摘要 | fixture:message-2 | 测试夹具：验收时必须能回读来源。 |"), "V_outside_section"],
    ["U/V 都缺而分母为空", (text) => text.replace("> 测试夹具：请保留每条原始需求的逐字来源。", "测试夹具：请保留每条原始需求的逐字来源。")
      .replace("| V-001 | 用户 | fixture:message-2 | 测试夹具：验收时必须能回读来源。 |", "| V-001 | 摘要 | fixture:message-2 | 测试夹具：验收时必须能回读来源。 |"), "empty_entries"],
  ])("T1f 负控：%s 不得被模板普查放行", (_name, breakTemplate, requiredProblem) => {
    const good = filledTemplate();
    const bad = breakTemplate(good);
    expect(bad).not.toBe(good);
    expect(generatedTemplateProblems(bad)).toContain(requiredProblem);
  });

  it("T1a 模板满足普查三节契约：errors 里没有任何 section 缺失诊断", () => {
    const missingSections = templateCensus.errors.filter((error) => error.includes(" section"));
    expect(
      missingSections,
      `${TEMPLATE_MISSING_TRIO}；三节缺失诊断必须清空（实测 ${missingSections.length} 条）`,
    ).toEqual([]);
  });

  it("T1b 模板携带普查可识别的行形态：V-001（说话人=用户）/ R-001→D-nnn / ### U-001", () => {
    expect(
      template,
      `${TEMPLATE_MISSING_TRIO}；## 逐字声明层（verbatim）内必须有一行 | V-001 | 用户 | … | … |`
        + "（说话人列必须精确是「用户」，否则被 stage-content-contracts.mjs 的 vRows 过滤掉）",
    ).toMatch(/^\| V-001 \| 用户 \|/m);
    expect(
      template,
      `${TEMPLATE_MISSING_TRIO}；## 原始需求索引内必须有一行 | R-001 | <U/V 锚点> | D-nnn |`
        + "（必须 3 列且第 3 格是 D-\\d{3}）",
    ).toMatch(/^\| R-001 \| [^|]+ \| D-\d{3} \|/m);
    expect(
      template,
      `${TEMPLATE_MISSING_TRIO}；## 需求变更记录内必须有 ### U-001 逐字块（含 ">" 引文行）`,
    ).toMatch(/^### U-\d{3}/m);
  });

  it("T1c 负控：删掉「## 逐字声明层（verbatim）」整节后，普查必须点名该节缺失", () => {
    // 有牙证明：断言 T1a 不是因为「普查对任何模板都返回空 errors」而通过。
    const mutated = removeSection(template, VERBATIM_HEADING);
    const mutatedCensus = deriveDecisionLogOriginalSourceCensus(mutated);
    expect(
      mutatedCensus.errors.some((error) => error.includes("逐字声明层（verbatim）")),
      "负控失败：删掉必需小节「逐字声明层（verbatim）」后普查没有点名该节缺失",
    ).toBe(true);
  });

  it("T1d 护栏：模板仍保留既有内容契约的标题（## 原始需求 / ### ADR-001 / ## 三级追溯链）", () => {
    // 防止 M1 为了让普查变绿而顺手删掉 tests/decision-log-content-contract.test.mjs:38-50 与 :103 钉住的标题。
    for (const heading of ["## 原始需求", "### ADR-001", "## 三级追溯链"]) {
      expect(
        template,
        `护栏失败：M1 不得删除既有契约标题 ${heading}（tests/decision-log-content-contract.test.mjs:38-50/:103）`,
      ).toContain(heading);
    }
  });

  it("T2a skills/decision-log/SKILL.md 写明「原始需求索引」", () => {
    expect(
      read(DECISION_LOG_SKILL_PATH),
      "写入契约缺一半：decision-log SKILL 文本没有要求 `## 原始需求索引`，agent 落笔时无从知道要写它",
    ).toContain("原始需求索引");
  });

  it("T2b skills/decision-log/SKILL.md 写明「逐字声明层（verbatim）」", () => {
    expect(
      read(DECISION_LOG_SKILL_PATH),
      "写入契约缺一半：decision-log SKILL 文本没有要求 `## 逐字声明层（verbatim）`，agent 落笔时无从知道要写它",
    ).toContain("逐字声明层（verbatim）");
  });

  it("T2c workflows/make-decision/SKILL.md 写明「需求变更记录」", () => {
    expect(
      read(MAKE_DECISION_SKILL_PATH),
      "写入契约缺一半：make-decision SKILL 文本没有要求 `## 需求变更记录`，agent 完成声明前无从核对",
    ).toContain("需求变更记录");
  });

  it("T3a 归档卡 card-07 的 decision-log 仍可读：普查 errors 为空", () => {
    const archivedCensus = deriveDecisionLogOriginalSourceCensus(read(ARCHIVED_DECISION_LOG_PATH));
    expect(
      archivedCensus.errors,
      "M1 只改模板/SKILL 文本，不得让归档卡（普查通过的历史材料）从可读变成不可读",
    ).toEqual([]);
    expect(archivedCensus.entries.length, "归档卡的原始来源分母必须仍非零").toBeGreaterThan(0);
  });

  it("T3b 缺三节的文本不抛错，且返回对象含 errors 数组（旧 decision-log 仍可读，不是门）", () => {
    let census = null;
    expect(
      () => { census = deriveDecisionLogOriginalSourceCensus(SYNTHETIC_WITHOUT_TRIO); },
      "普查是纯读：缺三节的旧格式必须能返回诊断结果，不能 throw（throw 就等于把材料完整性变成门）",
    ).not.toThrow();
    expect(census.status, "缺三节时 status 仍是 present（有材料），不是 missing").toBe("present");
    expect(Array.isArray(census.errors), "缺三节时必须返回 errors 数组用于报告，而不是抛错").toBe(true);
    expect(typeof census.entries?.length, "缺三节时 entries 仍是可读数组").toBe("number");
  });
});
