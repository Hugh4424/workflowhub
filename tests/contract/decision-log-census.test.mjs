// 预置测试（build-plan 阶段写出，随后冻结）——CARD-04 / T009 的 RED gate。
//
// 目的：decision-log.md 的「原始来源普查」必须分母非零。
// make-decision 交付的 decision-log 只写了 `## 原始需求`（R-001..R-008 自创编号）、
// `## 原始声明层`（U-1..U-5 自由格式条目）这类自由格式小节；runtime 的 post-cohort
// 普查契约要求 `## 需求变更记录`（`### U-xxx` 逐字节）、`## 原始需求索引`（`R-xxx` 追溯
// 索引行）与 `## 逐字声明层（verbatim）`（`V-xxx` 行）三节共存。因此当前实测
// status="present" 但 entries=0、source_units=0、errors=5 条——分母为零，
// 后续任何「多少条原始来源被覆盖」的结论都没有分母可除。
//
// 断言对象是真实材料字节：specs/workflowhub-thin-core-card-04-20260919/decision-log.md。
// 本文件只读，不写仓库、不用合成 fixture 冒充本卡材料。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { deriveDecisionLogOriginalSourceCensus } from "../../runtime/stage/stage-content-contracts.mjs";

const DECISION_LOG_PATH = fileURLToPath(
  new URL("../../specs/workflowhub-thin-core-card-04-20260919/decision-log.md", import.meta.url),
);
const VERBATIM_HEADING = "## 逐字声明层（verbatim）";
const REQUIRED_INDEX_IDS = Object.freeze(
  Array.from({ length: 8 }, (_unused, index) => `R-${String(index + 1).padStart(3, "0")}`),
);
const ZERO_DENOMINATOR = "根因：分母为零——decision-log.md 的原始来源普查实测 "
  + "status=\"present\" 但 entries=0、source_units=0、source_counts={u:0,atoms:0,v:0,r:0}、errors=5 条，"
  + "R/U/V 三个编号空间一个都没有被识别出来";

/** 删掉一个二级小节的整段（含标题行到下一个 `## ` 之前）。小节不存在时原样返回。 */
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

let decisionLogText = "";
let census = null;

beforeAll(() => {
  decisionLogText = readFileSync(DECISION_LOG_PATH, "utf8");
  census = deriveDecisionLogOriginalSourceCensus(decisionLogText);
});

describe("decision-log 原始来源普查：分母非零（T009 gate）", () => {
  it("普查状态是 present（材料存在且被识别）", () => {
    expect(census.status, "decision-log.md 未被普查识别为 status=\"present\"").toBe("present");
  });

  it("普查 errors 为空数组", () => {
    expect(census.errors, `${ZERO_DENOMINATOR}；errors 必须清空，否则「分母成立」只是空洞结论`).toEqual([]);
  });

  it("原始来源 entries / source_units 分母非零（>= 8）", () => {
    expect(census.entries.length, `${ZERO_DENOMINATOR}；entries 必须 >= 8`).toBeGreaterThanOrEqual(8);
    expect(census.source_units.length, `${ZERO_DENOMINATOR}；source_units 必须 >= 8`).toBeGreaterThanOrEqual(8);
  });

  it("原始需求索引覆盖 R-001..R-008", () => {
    const present = new Set(census.index_entries.map((entry) => entry.id));
    const missing = REQUIRED_INDEX_IDS.filter((id) => !present.has(id));
    expect(
      missing,
      `${ZERO_DENOMINATOR}；原始需求索引缺失编号：${missing.join("、") || "（无）"}`,
    ).toEqual([]);
  });

  it("逐字 U 层至少 3 节，且逐字声明层至少 1 条「用户」V 行", () => {
    // V 行允许是某条 U 引文的别名行；但逐字声明层必须至少有一条说话人为「用户」的来源，
    // 否则「逐字」层退化成无来源的二手转述。
    expect(census.source_counts.u, `${ZERO_DENOMINATOR}；逐字 U 节数必须 >= 3`).toBeGreaterThanOrEqual(3);
    expect(
      census.source_counts.v,
      `${ZERO_DENOMINATOR}；逐字声明层（verbatim）至少要有 1 条说话人=「用户」的 V 行`,
    ).toBeGreaterThanOrEqual(1);
  });

  it("负控：删掉「## 逐字声明层（verbatim）」整节后普查必须报错", () => {
    // 有牙证明：必需小节缺失必须被抓到。（RED 基线当天该小节本就缺失，删除是恒等变换，
    // 负控仍然验证「缺失 → errors 非空」这条路径；修复后该小节存在，删除才是真实变异。）
    const mutated = removeSection(decisionLogText, VERBATIM_HEADING);
    const mutatedCensus = deriveDecisionLogOriginalSourceCensus(mutated);
    expect(
      mutatedCensus.errors.length,
      "负控失败：删掉必需小节「逐字声明层（verbatim）」后普查没有产生任何 error",
    ).toBeGreaterThan(0);
    expect(
      mutatedCensus.errors.some((message) => message.includes("逐字声明层（verbatim）")),
      "负控失败：删掉「逐字声明层（verbatim）」后普查没有点名该小节缺失",
    ).toBe(true);
  });
});
