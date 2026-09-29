// 预置测试（build-plan 阶段写出，随后冻结）——CARD-04 / T010 的 RED gate。
//
// 目的：spec.md 必须建立「上游覆盖账本」，逐条覆盖 decision-log 的上游编号，
// 并让本地自创的同名 `R-00x` 退出编号空间（改用 `CARD-04-` 命名空间）。
//
// 上游编号全集是动态算出来的，不写死列表：
//   deriveDecisionLogOriginalSourceCensus(decision-log).entries ∪ .index_entries
//   ∪ 真实文本里实际出现的 D-\d{3} / AC-\d{2} / OI-\d{3} / SD-\d{2} / OPEN-\d{3}
//   （某类一个都没有就跳过该类）。
// 账本 = spec.md 中 `## 上游覆盖账本` 到下一个 `## ` 之间的文本；账本行 = 以 `|` 开头的表格行。
//
// 断言对象是真实材料字节：specs/workflowhub-thin-core-card-04-20260919/spec.md 与 decision-log.md。
// 本文件只读，不写仓库、不用合成 fixture 冒充本卡材料。
//
// —— 审查发现修订登记（两处，均在下方就地修掉）——
// F-02（high，编号宇宙漏项）：原 SCANNED_ID_PATTERNS 只扫 D/AC/OI（加普查的 U/V/R），
//   漏掉 decision-log.md 里真实存在的 SD-03/05/06/13/15/17 与 OPEN-001..008 共 14 个编号
//   ⇒「宣称覆盖 SD 却不查」。现补上两族；编号全集由 32 增至 46（实测见测试报告行）。
// F-03（medium，落点自我命中）：原 LANDING_POINT 含 `AC-\d`，使 AC-16..21 六行的「落点」
//   可以是它自己的编号（重言、形同虚设）。现收紧为「指向别处」：P/T 相位-任务引用，或
//   **另一个**编号（不等于本行自己的编号）；并加负控证明「只写自己编号的行」判无落点。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { deriveDecisionLogOriginalSourceCensus } from "../../runtime/stage/stage-content-contracts.mjs";

const CARD_DIR = new URL("../../specs/workflowhub-thin-core-card-04-20260919/", import.meta.url);
const SPEC_PATH = fileURLToPath(new URL("spec.md", CARD_DIR));
const DECISION_LOG_PATH = fileURLToPath(new URL("decision-log.md", CARD_DIR));

const LEDGER_HEADING = "## 上游覆盖账本";
const LEDGER_HEADING_PROBE = /^## 上游覆盖账本\s*$/m;
// 落点记号（F-03 收紧后）：落点必须是**指向别处**的引用，不得是本行自己的编号。
//   * PHASE_TASK_REF：相位-任务引用（P<数字> / T<三位数>），如 P2、phases/P2.md、T013；
//   * CROSS_REFERENCE：**另一个**编号（FR-/AC-/D-/OI-/U-/V-/R-/SD-/OPEN-/ORACLE- 整词），
//     且必须不等于本行自己的编号——「只写自己编号」不构成落点
//     （原正则含 `AC-\d`，AC-16..21 六行会落回自己的编号，是重言）。
//   * 或写明 not_done/deferred 并带 owner=...。
const PHASE_TASK_REF = /(?<![A-Za-z0-9])P\d+(?![A-Za-z0-9])|(?<![A-Za-z0-9-])T\d{3}(?![0-9])/;
const CROSS_REFERENCE =
  /(?<![A-Za-z0-9-])(?:FR|AC|D|OI|U|V|R|SD|OPEN)-\d{2,4}(?![A-Za-z0-9-])|(?<![A-Za-z0-9-])ORACLE-[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9-])/g;
const DEFERRED_DISPOSITION = /not_done|deferred/;
const OWNER_ASSIGNMENT = /owner\s*=/;
// 本地自创的同名编号定义行：R 编号空间已被追溯索引占用。
// G-03 实测修正——早期只匹配 `- **R-001**`，在本仓库 spec.md 上零命中 ⇒ 该断言空真。
// 真实形态有二：① §「来源与决策映射」表行 `| R-00x（本地解读标签） | … |`；② §1.2 展开条目 `- R-00x：…`。
// 账本行与 Trace 行形如 `| R-001 | … |`（编号后紧跟半角竖线）不算本地定义，故不匹配。
const LOCAL_R_DEFINITION_LINE = /^\|\s*R-\d{3}（|^- R-\d{3}：/;
// 上游编号里「文本扫出来的类别」：某类一个都没有就跳过该类，不凭空造编号。
// F-02：SD-\d{2} 与 OPEN-\d{3} 是后来补上的两族——缺了它们，decision-log.md 里真实存在的
// 14 个编号（SD-03/05/06/13/15/17、OPEN-001..008）既不会被检查，也不会在缺失清单里出现。
const SCANNED_ID_PATTERNS = Object.freeze([
  /\bD-\d{3}\b/g,
  /\bAC-\d{2}\b/g,
  /\bOI-\d{3}\b/g,
  /\bSD-\d{2}\b/g,
  /\bOPEN-\d{3}\b/g,
]);
// F-02 登记的两族（用于防止扫描模式被改回去时静默缩表）。
const SCANNED_ID_FAMILIES = Object.freeze([
  ["SD-", /^SD-\d{2}$/],
  ["OPEN-", /^OPEN-\d{3}$/],
]);

/** 取 `## 上游覆盖账本` 小节文本（标题行到下一个 `## ` 之前）；小节不存在时返回空串。 */
function ledgerSection(specText) {
  const match = LEDGER_HEADING_PROBE.exec(specText);
  if (!match) return "";
  const tail = specText.slice(match.index + match[0].length);
  const next = /^## /m.exec(tail);
  return next ? tail.slice(0, next.index) : tail;
}

/** 账本行 = 以 `|` 开头的表格行。 */
function ledgerRows(specText) {
  return ledgerSection(specText)
    .split("\n")
    .filter((line) => line.startsWith("|"));
}

/** 该行是否逐字提到某个上游编号（整词匹配，避免 R-001 命中 R-0011、U-001 命中 U-001-01）。 */
function rowMentionsId(rowLine, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9-])${escaped}(?![A-Za-z0-9-])`).test(rowLine);
}

/** 该账本行对 `rowId` 是否有落点记号（落点须指向别处，见上方 F-03 注释）。 */
function hasLandingPoint(rowLine, rowId) {
  if (PHASE_TASK_REF.test(rowLine)) return true;
  for (const [token] of rowLine.matchAll(CROSS_REFERENCE)) {
    if (token !== rowId) return true;
  }
  return DEFERRED_DISPOSITION.test(rowLine) && OWNER_ASSIGNMENT.test(rowLine);
}

/** 纯检查函数：哪些上游编号在账本里一行都没有。 */
function missingLedgerIds(specText, ids) {
  const rows = ledgerRows(specText);
  return ids.filter((id) => !rows.some((row) => rowMentionsId(row, id)));
}

/** 纯检查函数：哪些上游编号没有落点记号（含「连一行都没有」的编号）。 */
function idsWithoutLandingPoint(specText, ids) {
  const rows = ledgerRows(specText);
  return ids.filter((id) => {
    const mentioning = rows.filter((row) => rowMentionsId(row, id));
    return !mentioning.some((row) => hasLandingPoint(row, id));
  });
}

/** 上游编号全集：普查的 entries ∪ index_entries 编号 + 真实文本里实际出现的 D/AC/OI 编号。 */
function upstreamIdsOf(decisionLogText) {
  const census = deriveDecisionLogOriginalSourceCensus(decisionLogText);
  const ids = new Set([
    ...census.entries.map((entry) => entry.id),
    ...census.index_entries.map((entry) => entry.id),
  ]);
  for (const pattern of SCANNED_ID_PATTERNS) {
    for (const [id] of decisionLogText.matchAll(pattern)) ids.add(id);
  }
  return [...ids].sort();
}

let specText = "";
let decisionLogText = "";
let upstreamIds = [];
let rows = [];

beforeAll(() => {
  specText = readFileSync(SPEC_PATH, "utf8");
  decisionLogText = readFileSync(DECISION_LOG_PATH, "utf8");
  upstreamIds = upstreamIdsOf(decisionLogText);
  rows = ledgerRows(specText);
});

describe("spec.md 上游覆盖账本（T010 gate）", () => {
  it("spec.md 建立了「## 上游覆盖账本」节", () => {
    expect(
      LEDGER_HEADING_PROBE.test(specText),
      `spec.md 缺少「${LEDGER_HEADING}」小节：上游编号没有逐条落点账本`,
    ).toBe(true);
    expect(
      ledgerSection(specText).trim().length,
      `spec.md 的「${LEDGER_HEADING}」小节是空的`,
    ).toBeGreaterThan(0);
  });

  it("上游编号全集非空（防止账本检查退化成空真）", () => {
    expect(
      upstreamIds.length,
      "上游编号全集为空：decision-log.md 既没有普查条目，也没有 D/AC/OI/SD/OPEN 编号，账本检查会退化为空真",
    ).toBeGreaterThan(0);
  });

  it("F-02：SD- 与 OPEN- 两族编号必须进入上游编号全集（否则整类被静默跳过）", () => {
    // F-02 修订前这两族不在 SCANNED_ID_PATTERNS 里：decision-log.md 真实含有的 14 个编号
    // （SD-03/05/06/13/15/17、OPEN-001..008）既不会被检查，也不会出现在缺失清单里。
    for (const [family, shape] of SCANNED_ID_FAMILIES) {
      const hits = upstreamIds.filter((id) => shape.test(id));
      expect(
        hits.length,
        `上游编号全集里没有任何 ${family} 族编号：decision-log.md 真实含有该族编号，`
          + `扫描模式漏掉它时「宣称覆盖、实则不查」不会被发现（F-02）。`
          + `该族命中=${JSON.stringify(hits)}；全集=${JSON.stringify(upstreamIds)}`,
      ).toBeGreaterThan(0);
    }
  });

  it("每个上游编号都有一行账本行", () => {
    const missing = missingLedgerIds(specText, upstreamIds);
    expect(
      missing,
      `缺失的上游编号清单（${missing.length}/${upstreamIds.length} 条无账本行）：${missing.join("、") || "（无）"}；`
        + "每个上游编号必须逐字出现在一行以 `|` 开头的账本行里（同一行可带多个编号，但编号字形必须逐个写出）",
    ).toEqual([]);
  });

  it("每个上游编号所在账本行都有落点记号", () => {
    const without = idsWithoutLandingPoint(specText, upstreamIds);
    expect(
      without,
      `没有落点记号的上游编号清单（${without.length}/${upstreamIds.length} 条）：${without.join("、") || "（无）"}；`
        + "每行必须给出指向别处的落点（P\\d / T\\d{3} 相位-任务引用，或另一个编号，"
        + "如 FR-\\d、AC-\\d、D-\\d{3}、OI-\\d{3}、SD-\\d{2}、OPEN-\\d{3}、ORACLE-[A-Z0-9-]+），"
        + "或写明 not_done/deferred 并带 owner=...；只写本行自己的编号不构成落点（F-03）",
    ).toEqual([]);
  });

  it("F-03 负控：落点必须指向别处——只写自己编号的行必须被判为无落点", () => {
    // 合成账本文本（纯函数输入，不冒充本卡材料）：三行只有落点写法不同。
    const synthetic = [
      "## 上游覆盖账本",
      "| 编号 | 覆盖内容 | 落点 |",
      "| --- | --- | --- |",
      "| AC-16 | 只写自己的编号（旧正则 `AC-\\d` 会自我命中，是重言） | 见 AC-16 |",
      "| SD-17 | 指向相位-任务引用 | phases/P2.md、T013 |",
      "| OPEN-006 | 指向另一个编号 | D-007 |",
      "",
      "## 下一节",
      "",
    ].join("\n");
    const ids = ["AC-16", "SD-17", "OPEN-006"];
    // 缺行与缺落点是两个不同的失败，不能互相掩盖：三行都在，落点只有一个不合格。
    expect(
      missingLedgerIds(synthetic, ids),
      "F-03 负控失败：合成账本的三行都存在，missingLedgerIds 却报缺行（行识别被改坏了）",
    ).toEqual([]);
    expect(
      idsWithoutLandingPoint(synthetic, ids),
      "F-03 负控失败：落点判定仍在自我命中——只写自己编号的 AC-16 行被判为「有落点」。"
        + "落点必须指向 P/T 相位-任务引用或另一个编号；指向别处的 SD-17（P2/T013）"
        + "与 OPEN-006（D-007）两行必须判为有落点",
    ).toEqual(["AC-16"]);
  });

  it("spec.md 不再本地定义同名 `R-00x`（本地条目退出 R 编号空间）", () => {
    const localDefinitions = specText.split("\n").filter((line) => LOCAL_R_DEFINITION_LINE.test(line));
    expect(
      localDefinitions,
      "spec.md 仍以 `| R-00x（…） |` 表行或 `- R-00x：…` 展开条目的形式本地定义同名编号："
        + "R 编号空间已属于 decision-log 的原始需求条目，本地裁定必须改用 `CARD-04-` 命名空间",
    ).toEqual([]);
  });

  it("spec.md 至少出现一次 `CARD-04-`（本地条目的新命名空间）", () => {
    const hits = [...specText.matchAll(/CARD-04-/g)].length;
    expect(
      hits,
      "spec.md 没有任何 `CARD-04-` 本地条目命名空间：退出 R 编号空间的本地自创裁定必须先改名到 CARD-04- 空间",
    ).toBeGreaterThan(0);
  });

  it("负控：删掉一行账本行后，同一检查函数必须报出该编号缺失", () => {
    // 负控直接调用文件内的纯函数 missingLedgerIds，证明检查逻辑对「少一行」有牙。
    // 优先选「只被一行账本行提到」的上游编号，这样删掉那一行后它必须变成缺失；
    // 若所有编号都被多行共享（例如落点列互相引用），则把提到它的行整组删掉。
    const mentioningRowsOf = (id) => rows.filter((row) => rowMentionsId(row, id));
    const targetId = upstreamIds.find((id) => mentioningRowsOf(id).length === 1)
      ?? upstreamIds.find((id) => mentioningRowsOf(id).length > 0);
    if (!targetId) {
      // RED 基线：spec.md 尚无账本行，没有真实账本行可删。此时负控取等价退化形态——
      // 真实文本对每个上游编号都缺行，检查函数必须把它们全部报出来（而不是空真通过）。
      const missing = missingLedgerIds(specText, upstreamIds);
      expect(
        missing,
        "负控失败：spec.md 没有任何账本行，missingLedgerIds 却认为编号都被覆盖了（空真通过）",
      ).toEqual(upstreamIds);
      return;
    }
    let mutated = specText;
    for (const row of mentioningRowsOf(targetId)) mutated = mutated.replace(row, "");
    const missing = missingLedgerIds(mutated, [targetId]);
    expect(
      missing,
      `负控失败：删掉 ${targetId} 的账本行后，missingLedgerIds 仍认为它已被覆盖（检查函数没有牙）`,
    ).toEqual([targetId]);
  });
});
