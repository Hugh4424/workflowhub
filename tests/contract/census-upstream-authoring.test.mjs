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
import { spawnSync } from "node:child_process";
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
    .replace("<对应决定/规格落点；新卡必须替换>", "D-001 / FR-001");
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
    ["R 行被移到别的小节但全局字面仍在", (text) => {
      const row = /^\| R-001 \| U-001、V-001 \| D-001 \|.*$/m.exec(text)?.[0];
      if (!row) throw new Error("fixture R row is missing before relocation");
      return text.replace(`${row}\n`, "").replace("## 原始声明层\n", `## 原始声明层\n${row}\n`);
    }, "R_outside_section"],
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

import { buildPostAcceptanceChainRows } from "../../runtime/stage/stage-runner.mjs";

// Labelled unit user quotation, never the current task's missing host source.
function card03CanonicalSourceFixture({ decision = "D-001", derived = false } = {}) {
  return `# Constructed source fixture

## 需求变更记录

### U-001

> 测试用户逐字夹具：请保留需求来源。

## 原始需求索引

| R 编号 | 来源 | 决策 |
| --- | --- | --- |
| R-001 | U-001 | ${decision} |
${derived ? `| R-002 | design.md 推导；host 用户原话 unavailable | ${decision} |\n` : ""}
## 逐字声明层（verbatim）

| V 编号 | 说话人 | 来源 | 原文 |
| --- | --- | --- | --- |
| V-001 | 用户 | fixture exact excerpt | 请保留需求来源。 |

## 构造决定

### D-001

构造性legacy决定。

## 本卡问答记录（T 表）

| 问题 id | 问题（大白话） | 选项全集 | 用户选择 | 选择含义 | 来源 |
| --- | --- | --- | --- | --- | --- |
| T-001 | 构造fixture选择 | A=保留／B=删除 | A | 保留当前构造要求 | fixture:user-message |
`;
}
function card03ChainFixture(spec, decisionLog, ac = "AC-DISP-001") {
  return buildPostAcceptanceChainRows({ rows: [{ acceptance_criterion_id: ac }], spec, decisionLog,
    boundEvidenceRefs: [], materialRevision: "unit-current-material", snapshotTree: "a".repeat(40), taskId: "unit-constructed", tests: null })[0];
}
const card03CurrentMap = (source = "R-001", decision = "T-001", headers = "Source ID | Decision ID | FR / AC | 状态 / 影响面 | 未决 / 交接") =>
  `# Spec

## 来源与决策映射

| ${headers} |
| --- | --- | --- | --- | --- |
| ${source} | ${decision} | FR-DISP-001 / AC-DISP-001 | current | no extra source |
`;

describe("CARD-03 census current T index preserves original sources (ORACLE-RT-001)", () => {
  it("recognizes a real canonical T-index edge without renumbering its original quoted U source", () => {
    const text = card03CanonicalSourceFixture({ decision: "T-001" });
    const census = deriveDecisionLogOriginalSourceCensus(text);
    expect(census.errors).toEqual([]);
    expect(census.index_entries[0]).toMatchObject({ id: "R-001", decision: "T-001", source_refs: ["U-001"] });
    expect(census.entries.map((row) => row.id)).toEqual(["U-001"]);
    const quote = census.source_units.find((row) => row.id === "U-001");
    expect(Buffer.from(text).subarray(quote.byte_start, quote.byte_end).toString()).toBe(quote.raw_excerpt);
    expect(quote.raw_excerpt).toContain("> 测试用户逐字夹具：请保留需求来源。");
  });

  it("retains D legacy and keeps design-derived R/T rows outside the original-source denominator", () => {
    const legacy = deriveDecisionLogOriginalSourceCensus(card03CanonicalSourceFixture());
    const current = deriveDecisionLogOriginalSourceCensus(card03CanonicalSourceFixture({ decision: "T-001", derived: true }));
    expect(legacy.errors).toEqual([]);
    expect(legacy.index_entries[0].decision).toBe("D-001");
    expect(current.errors).toEqual([]);
    expect(current.index_entries.find((row) => row.id === "R-002")).toMatchObject({ decision: "T-001", source_refs: [] });
    expect(current.entries.map((row) => row.id)).toEqual(legacy.entries.map((row) => row.id));
    const chain = card03ChainFixture(card03CurrentMap("R-002"), card03CanonicalSourceFixture({ decision: "T-001", derived: true }));
    expect(chain.source_ids).toEqual([]);
    expect(chain.coverage_limits).toMatch(/R-002.*没有可认证 U\/V 边|未得到可认证原始来源/);
    expect(chain).not.toHaveProperty("review_ref");
    expect(chain).not.toHaveProperty("stage_end_ref");
  });
});

describe("CARD-03 stage-end acceptance mapping current headers (ORACLE-RT-001)", () => {
  it("keeps the legacy four-column numeric D mapping intact", () => {
    const spec = "## 来源与决策映射\n\n| 来源 | 决策 | FR | AC |\n| --- | --- | --- | --- |\n| R-001 | D-001 | FR-001 | AC-001 |\n";
    const row = card03ChainFixture(spec, card03CanonicalSourceFixture(), "AC-001");
    expect(row.source_ids).toEqual(["U-001"]);
    expect(row.decision_ids).toEqual(["D-001"]);
    expect(row.fr_ids).toEqual(["FR-001"]);
  });

  it("reads the approved five-column combined typed FR/AC and explicit T question decision without filling rich-chain gaps", () => {
    const row = card03ChainFixture(card03CurrentMap(), card03CanonicalSourceFixture({ decision: "T-001" }));
    expect(row.source_ids).toEqual(["U-001"]);
    expect(row.decision_ids).toEqual(["T-001"]);
    expect(row.fr_ids).toEqual(["FR-DISP-001"]);
    expect(row).not.toHaveProperty("implementation_anchor");
    expect(row).not.toHaveProperty("review_ref");
    expect(row.coverage_limits).toMatch(/独立实现\/验证锚点未齐/);
  });

  it("exposes unknown mapping header, unknown source and unknown decision instead of silently inventing coverage", () => {
    const badHeader = card03ChainFixture(card03CurrentMap("R-001", "T-001", "opaque source | Decision ID | FR / AC | status | handoff"), card03CanonicalSourceFixture({ decision: "T-001" }));
    expect(badHeader.coverage_limits).toMatch(/MATERIAL_INCOMPLETE.*header|MATERIAL_INCOMPLETE.*表头/);
    expect(badHeader.source_ids).toEqual([]);
    const unknownSource = card03ChainFixture(card03CurrentMap("R-999"), card03CanonicalSourceFixture({ decision: "T-001" }));
    expect(unknownSource.source_ids).toEqual([]);
    expect(unknownSource.coverage_limits).toMatch(/R-999/);
    const unknownDecision = card03ChainFixture(card03CurrentMap("R-001", "T-999"), card03CanonicalSourceFixture({ decision: "T-001" }));
    expect(unknownDecision.decision_ids).toEqual([]);
    expect(unknownDecision.coverage_limits).toMatch(/T-999/);
  });

  it("never treats R as an original U/V source when the authenticated census is absent", () => {
    const row = card03ChainFixture(card03CurrentMap(), "## 本卡问答记录（T 表）\n\nT-001 is merely prose, no authentic decision row.");
    expect(row.source_ids).toEqual([]);
    expect(row.decision_ids).toEqual([]);
    expect(row.coverage_limits).toMatch(/原始需求索引|未得到可认证原始来源/);
  });
});


describe("CARD-03 stage-end acceptance mapping current header boundaries (ORACLE-RT-001)", () => {
  it("reads reordered recognized header roles rather than fixed cell positions", () => {
    const spec = "## 来源与决策映射\n\n| FR / AC | 未决 / 交接 | Decision ID | Source ID | 状态 / 影响面 |\n| --- | --- | --- | --- | --- |\n| FR-DISP-001 / AC-DISP-001 | no invented refs | T-001 | R-001 | current |\n";
    const row = card03ChainFixture(spec, card03CanonicalSourceFixture({ decision: "T-001" }));
    expect(row.source_ids).toEqual(["U-001"]);
    expect(row.decision_ids).toEqual(["T-001"]);
    expect(row.fr_ids).toEqual(["FR-DISP-001"]);
  });

  for (const headers of ["Source ID | Source ID | FR / AC | 状态 / 影响面 | 未决 / 交接",
    "Source ID | Decision ID | opaque criteria | 状态 / 影响面 | 未决 / 交接"]) {
    it(`discloses ambiguous or missing header roles: ${headers}`, () => {
      const row = card03ChainFixture(card03CurrentMap("R-001", "T-001", headers), card03CanonicalSourceFixture({ decision: "T-001" }));
      expect(row.source_ids).toEqual([]);
      expect(row.fr_ids).toEqual([]);
      expect(row.coverage_limits).toMatch(/MATERIAL_INCOMPLETE/);
    });
  }

  it("rejects an unknown legacy D decision and a T prose mention or unresolved choice", () => {
    const d = card03ChainFixture(card03CurrentMap("R-001", "D-999"), card03CanonicalSourceFixture());
    expect(d.decision_ids).toEqual([]);
    expect(d.coverage_limits).toMatch(/D-999/);
    const unresolved = card03CanonicalSourceFixture({ decision: "T-001" }).replace("| A | 保留当前构造要求 | fixture:user-message |", "| unknown | 保留当前构造要求 | fixture:user-message |");
    const row = card03ChainFixture(card03CurrentMap(), unresolved);
    expect(row.decision_ids).toEqual([]);
    expect(row.coverage_limits).toMatch(/T-001|未.*决策|没有可回读/);
  });

  it("expands only explicit same-family typed and numeric ranges without renumbering", () => {
    const current = card03CurrentMap().replace("FR-DISP-001 / AC-DISP-001", "FR-DISP-001…FR-DISP-003 / AC-DISP-001…AC-DISP-003");
    for (const ac of ["AC-DISP-001", "AC-DISP-002", "AC-DISP-003"]) {
      const row = card03ChainFixture(current, card03CanonicalSourceFixture({ decision: "T-001" }), ac);
      expect(row.fr_ids).toEqual(["FR-DISP-001", "FR-DISP-002", "FR-DISP-003"]);
      expect(row.source_ids).toEqual(["U-001"]);
    }
    const legacy = "## 来源与决策映射\n\n| 来源 | 决策 | FR | AC |\n| --- | --- | --- | --- |\n| R-001 | D-001 | FR-01..FR-02 | AC-01..AC-02 |\n";
    expect(card03ChainFixture(legacy, card03CanonicalSourceFixture(), "AC-02").fr_ids).toEqual(["FR-01", "FR-02"]);
  });

  for (const token of ["FR-DISP-003…FR-DISP-001", "FR-DISP-001…FR-SKL-003", "FR-DISP-001…FR-DISP-999", "FR-DISP-001???FR-DISP-002"]) {
    it(`keeps malformed or unsafe range explicit: ${token}`, () => {
      const row = card03ChainFixture(card03CurrentMap().replace("FR-DISP-001 / AC-DISP-001", `${token} / AC-DISP-001`), card03CanonicalSourceFixture({ decision: "T-001" }));
      expect(row.fr_ids).toEqual([]);
      expect(row.coverage_limits).toMatch(/MATERIAL_INCOMPLETE/);
    });
  }
});

describe("CARD-03 census current source negative boundaries (ORACLE-RT-001)", () => {
  it("reports a missing original U reference without creating source units or stage-chain coverage for it", () => {
    const text = card03CanonicalSourceFixture().replace("| R-001 | U-001 |", "| R-001 | U-999 |");
    const census = deriveDecisionLogOriginalSourceCensus(text);
    expect(census.errors).toEqual(expect.arrayContaining(["R index row cites absent U/V source: R-001 -> U-999"]));
    expect(census.source_units.some((row) => row.id === "U-999")).toBe(false);
    const chain = card03ChainFixture("## 来源与决策映射\n\n| 来源 | 决策 | FR | AC |\n| --- | --- | --- | --- |\n| R-001 | D-001 | FR-001 | AC-001 |\n", text, "AC-001");
    expect(chain.source_ids).toEqual([]);
    expect(chain.coverage_limits).toMatch(/未认证来源转换|没有可认证 U\/V 边/);
  });

  it("does not count an AI-speaker V or design summary as verbatim user requirements", () => {
    const text = card03CanonicalSourceFixture({ derived: true }).replace("| V-001 | 用户 |", "| V-001 | AI | ");
    const census = deriveDecisionLogOriginalSourceCensus(text);
    expect(census.entries.map((row) => row.id)).toEqual(["U-001"]);
    expect(census.source_units.some((row) => row.id === "V-001")).toBe(false);
    expect(census.index_entries.find((row) => row.id === "R-002").source_refs).toEqual([]);
  });
});


describe("CARD-03 census multiple decision cell keeps original trace (ORACLE-RT-001)", () => {
  it("preserves a real multi-T decision cell string with explicitly constructed quoted source", () => {
    const text = card03CanonicalSourceFixture({ decision: "T-009、T-020" });
    const census = deriveDecisionLogOriginalSourceCensus(text);
    expect(census.errors).toEqual([]);
    expect(census.index_entries[0]).toMatchObject({ id: "R-001", decision: "T-009、T-020", source_refs: ["U-001"] });
    expect(typeof census.index_entries[0].decision).toBe("string");
    const quote = census.source_units.find((row) => row.id === "U-001");
    expect(Buffer.from(text).subarray(quote.byte_start, quote.byte_end).toString()).toBe(quote.raw_excerpt);
  });

  it("retains legacy multi-D and mixed explicit D/T list tokens without new decision fields", () => {
    for (const decision of ["D-001、D-002", "D-001, T-001"]) {
      const census = deriveDecisionLogOriginalSourceCensus(card03CanonicalSourceFixture({ decision }));
      expect(census.errors).toEqual([]);
      expect(census.index_entries[0].decision).toBe(decision);
      expect(census.index_entries[0].source_refs).toEqual(["U-001"]);
      expect(census.index_entries[0]).not.toHaveProperty("decision_ids");
    }
  });

  for (const decision of ["X-001", "T-001???T-002", "T-001、", "T-001、unknown"]) {
    it(`discloses invalid decision cell rather than hiding the R row: ${decision}`, () => {
      const census = deriveDecisionLogOriginalSourceCensus(card03CanonicalSourceFixture({ decision }));
      expect(census.errors.some((error) => /R-001/.test(error) && /decision|决策/.test(error))).toBe(true);
      expect(census.index_entries.some((row) => row.id === "R-001")).toBe(false);
    });
  }

  it("does not authenticate an unknown syntactically valid decision just because its index token is readable", () => {
    const text = card03CanonicalSourceFixture({ decision: "T-999、T-998" });
    const census = deriveDecisionLogOriginalSourceCensus(text);
    expect(census.index_entries[0].decision).toBe("T-999、T-998");
    const row = card03ChainFixture(card03CurrentMap("R-001", "T-999、T-998"), text);
    expect(row.decision_ids).toEqual([]);
    expect(row.coverage_limits).toMatch(/T-999.*T-998/);
  });

  it("reads all twenty real current R rows while derived edges and unauthenticated originals stay incomplete", () => {
    const decisionLog = read("specs/workflowhub-thin-core-card-03-20260919/decision-log.md");
    const spec = read("specs/workflowhub-thin-core-card-03-20260919/spec.md");
    const census = deriveDecisionLogOriginalSourceCensus(decisionLog);
    expect(census.index_entries.map((row) => row.id)).toEqual(Array.from({ length: 20 }, (_, i) => `R-${String(i + 1).padStart(3, "0")}`));
    expect(census.index_entries.find((row) => row.id === "R-003").decision).toBe("T-009、T-020");
    const derived = census.index_entries.filter((row) => row.source.includes("derived trace"));
    expect(derived).toHaveLength(18);
    expect(derived.every((row) => row.source_refs.length === 0)).toBe(true);
    expect(census.errors).toHaveLength(4); // Real four V originals have no provable R edge; no fake edges.
    for (const ac of ["AC-DISP-001", "AC-ACC-001"]) {
      const row = card03ChainFixture(spec, decisionLog, ac);
      expect(row.source_ids).toEqual(ac === "AC-DISP-001" ? ["U-001"] : []); // Valid local edge survives; whole census remains incomplete.
      expect(row.coverage_limits).toMatch(/未认证来源转换|没有可认证|未得到可认证/);
      expect(row).not.toHaveProperty("review_ref");
      expect(row).not.toHaveProperty("stage_end_ref");
    }
  });
});

// Run the real synchronous consumer in an owned child: an unsafe Number loop
// must fail the test without blocking the test runner itself.
function card03EndpointChild({ fr, ac = "AC-001", criterion = ac }) {
  const timeout = 5000;
  const entered = "CARD03_ENTERED_CURRENT_MAPPING";
  const returned = "CARD03_RETURNED_CURRENT_MAPPING:";
  const fixture = {
    rows: [{ acceptance_criterion_id: criterion }],
    spec: `## 来源与决策映射\n\n| 来源 | 决策 | FR | AC |\n| --- | --- | --- | --- |\n| R-001 | D-001 | ${fr} | ${ac} |\n`,
    decisionLog: card03CanonicalSourceFixture(), boundEvidenceRefs: [],
    materialRevision: "unit-current-material", snapshotTree: "a".repeat(40),
    taskId: "unit-constructed", tests: null,
  };
  const moduleUrl = new URL("../../runtime/stage/stage-runner.mjs", import.meta.url).href;
  const program = `import { readFileSync, writeSync } from "node:fs";
    import { buildPostAcceptanceChainRows } from ${JSON.stringify(moduleUrl)};
    const fixture = JSON.parse(readFileSync(0, "utf8"));
    writeSync(1, ${JSON.stringify(entered + "\n")});
    const rows = buildPostAcceptanceChainRows(fixture);
    writeSync(1, ${JSON.stringify(returned)} + JSON.stringify(rows) + ${JSON.stringify("\n")});`;
  const child = spawnSync(process.execPath, ["--input-type=module", "--eval", program], {
    input: JSON.stringify(fixture), encoding: "utf8", timeout, maxBuffer: 8 * 1024 * 1024,
  });
  const diagnostic = JSON.stringify({ fr, ac, criterion, timeout,
    status: child.status, signal: child.signal,
    error: child.error && { code: child.error.code, message: child.error.message },
    stdout: child.stdout, stderr: child.stderr });
  expect(child.stdout, `consumer reach missing (environment/import failure): ${diagnostic}`).toContain(entered);
  expect(child.error, `consumer did not return: ${diagnostic}`).toBeUndefined();
  expect(child.status, diagnostic).toBe(0);
  expect(child.signal, diagnostic).toBeNull();
  expect(child.stdout, diagnostic).toContain(returned);
  return { row: JSON.parse(child.stdout.split(returned)[1].trim())[0], diagnostic };
}

describe("CARD-03 mapping numeric endpoint finite safe boundary (ORACLE-RT-001)", () => {
  const unsafeCases = [
    ["FR", "9007199254740992", "single"],
    ["AC", "9007199254740992", "single"],
    ["FR", "9007199254740991..FR-9007199254740992", "range unsafe end"],
    ["AC", "9007199254740991..AC-9007199254740992", "range unsafe end"],
    ["FR", "9".repeat(400), "single infinite Number"],
    ["AC", "9".repeat(400), "single infinite Number"],
  ];
  for (const [prefix, value, form] of unsafeCases) {
    it(`rejects ${prefix} ${form} without blocking the current mapping consumer`, () => {
      const token = `${prefix}-${value}`;
      const { row, diagnostic } = card03EndpointChild(prefix === "FR"
        ? { fr: token } : { fr: "FR-001", ac: token, criterion: token.split("..")[0] });
      expect(row.coverage_limits, diagnostic).toMatch(/MATERIAL_INCOMPLETE/);
      expect(row.fr_ids, diagnostic).toEqual([]);
      if (prefix === "AC") expect(row.source_ids, diagnostic).toEqual([]);
      expect(row, diagnostic).not.toHaveProperty("review_ref");
      expect(row, diagnostic).not.toHaveProperty("stage_end_ref");
    }, 10000);
  }
  it("preserves the largest safe single FR endpoint literally", () => {
    const { row, diagnostic } = card03EndpointChild({ fr: "FR-9007199254740991" });
    expect(row.fr_ids, diagnostic).toEqual(["FR-9007199254740991"]);
    expect(row.source_ids, diagnostic).toEqual(["U-001"]);
    expect(row.decision_ids, diagnostic).toEqual(["D-001"]);
    expect(row.coverage_limits, diagnostic).not.toContain("MATERIAL_INCOMPLETE");
  }, 10000);
  it("preserves both exact FR IDs in the bounded range ending at the largest safe integer", () => {
    const { row, diagnostic } = card03EndpointChild({ fr: "FR-9007199254740990..FR-9007199254740991" });
    expect(row.fr_ids, diagnostic).toEqual(["FR-9007199254740990", "FR-9007199254740991"]);
    expect(row.source_ids, diagnostic).toEqual(["U-001"]);
    expect(row.coverage_limits, diagnostic).not.toContain("MATERIAL_INCOMPLETE");
  }, 10000);
});


describe("CARD-03 stage-end existing native acceptance projection (ORACLE-RT-001)", () => {
  it("keeps pure trusted mapping short of rich native facts despite a green outer unit receipt", () => {
    const row = buildPostAcceptanceChainRows({
      rows: [{ acceptance_criterion_id: "AC-DISP-001", status: "unknown" }],
      spec: card03CurrentMap(), decisionLog: card03CanonicalSourceFixture({ decision: "T-001" }),
      boundEvidenceRefs: [{ ref: "tests", kind: "tests", status: "fresh", hash: "b".repeat(64), snapshot_tree: "a".repeat(40),
        test_result: { command: "unit outer command", expected_exit: 0, actual_exit: 0, oracle: "outer unit", actual_outcome: "unit pass" } }],
      materialRevision: "unit-current-material", snapshotTree: "a".repeat(40), taskId: "unit-constructed",
      tests: { receipt_ref: "unit-tests", exit_code: 0 },
    })[0];
    expect(row.source_ids).toEqual(["U-001"]);
    expect(row.status).toBe("unknown");
    for (const field of ["scenario", "actual_outcome", "gate", "test_result", "file_symbol", "implementation_anchor", "verification_anchor", "review_ref", "stage_end_ref"]) {
      expect(row).not.toHaveProperty(field);
    }
    expect(row.coverage_limits).toMatch(/独立实现\/验证锚点未齐/);
  });
});
