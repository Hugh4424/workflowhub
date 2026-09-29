// CARD-04 / P6 / T013（改写版，原名与编号保留）——普查诊断的**消费侧核验**：逐条枚举，不得总结。
//
// 职责边界（用户裁定：CARD-05 先落库，本卡让出重叠实现，T013 改为「消费/核验」卡）：
//   * 生产侧 = `runtime/stage/stage-content-contracts.mjs` 里对上游普查 errors 的逐条投影
//     （`MATERIAL_INCOMPLETE: decision-log original source census: …`）与更强的锚点判定。
//     这一段由 **CARD-05 拥有**。本测试**不得**通过修改它来变绿；若实现者只能靠改 CARD-05
//     的文件才能变绿，应**停止并上报**（那是所有权冲突，不是本卡的实现缺口）。
//   * 消费侧 = 本文件。核验 D-004 口径「逐条枚举、不得总结」：上游遗漏必须在机器可读通道里
//     **逐条可见、指名具体缺失节**，不得被吞成一条笼统错误。
//
// 断言通道（本文件唯一的断言通道，①②③ 全部走它）：
//   `stage:"build-code"` + `activation_cohort:"post"` + 非空 `task_id`。
//   这是 CARD-05 落地后**仍然保留**普查投影的机器通道。**本文件不对 build-plan 通道写任何断言**：
//   CARD-05 落库后该通道不再要求普查，任何写在它上面的普查断言都会永久红。
//
// [观测/非断言] CARD-05 落地前/后的两条通道实测（node 直调，非 vitest；原始输出存于
//   `…/tasks/workflowhub-thin-core-card-04-20260919/quality/evidence/prewritten-red/P6-T013-channel-probe.txt`）。
//   以下三条实测事实供实现者与审查者复核，**不得**据本段增删断言：
//
//   事实 1｜`entries === 0` 时，HEAD 与 CARD-05 的诊断面**逐字相同**。
//     同一「缺三节」材料上，两条通道、两个版本都只剩一条笼统错误
//     `MATERIAL_INCOMPLETE: authenticated original source census is required for post build-plan`
//     （HEAD；CARD-05 文案为 `… for post build-code`），真实普查函数产出的 5 条逐条诊断全被吞掉。
//   事实 2｜真实缺口是**零条目守卫**，不是路由/channel。
//     同一断言、只改材料形状——材料保留 `## 逐字声明层（verbatim）` 一节（census.entries=1，
//     仍缺 `需求变更记录`/`原始需求索引`）——HEAD 与 CARD-05 **都**已逐条投影出 4 条互不相同的
//     消息、指名 2 个不同缺失节 ⇒ 该断言可绿。故换 channel 治不好它，改材料只是在挪动 RED 的位置。
//   事实 3｜生产侧修复位点在 CARD-05 **保留**的 build-code 普查分支内（`:6502` 进分支、`:6510`
//     才是逐条投影），修复 owner = CARD-05，**不在本卡范围**。修法：`status === "present"` 时
//     先逐条投影 `census.errors`，零条目再补那条笼统错误。
//
//   ——支撑上述三条的行号与条件原文——
//   * 本 worktree HEAD = 35a881ac3c3288249677597a9079d445949de778（**未含** CARD-05 改动）。
//     `runtime/stage/stage-content-contracts.mjs` 里两条 stage 共用同一条普查分支：
//       :6407  `const postPlan = stage === "build-plan" && (identity?.activation_cohort === "post" || packet.activation_cohort === "post");`
//       :6408  `const postBuildCode = stage === "build-code" && (identity?.activation_cohort === "post" || packet.activation_cohort === "post");`
//       :6422  `if ((postPlan || postBuildCode) && nonEmptyString(identity?.task_id)) {`
//       :6423-6425  零条目守卫：`authenticatedSourceCensus?.status !== "present" || !Array.isArray(entries) || entries.length === 0`
//                   → :6425 只推一条 `MATERIAL_INCOMPLETE: authenticated original source census is required for post build-plan`，
//                   并**跳过** `else` 分支里的逐条投影
//       :6429-6430  逐条投影 `MATERIAL_INCOMPLETE: decision-log original source census: ${error}`（同一循环里 push findings）
//   * CARD-05 worktree（同基线 commit + 未提交改动）：
//       :6410-6412  判定 `postPlanReport`；:6412-6476 build-plan 提前 return（不再要求普查，
//                   改为结构报告；返回键集与通用路径相同）
//       :6502       普查分支收窄为 `if (postBuildCode && nonEmptyString(identity?.task_id)) {`
//       :6503-6505  零条目守卫**原样保留**（:6505 笼统错误文案改为 `… for post build-code`）
//       :6510       逐条投影 `MATERIAL_INCOMPLETE: decision-log original source census: ${error}`
//   * 因此：本文件 ① 在 HEAD 就是红，且 CARD-05 落库后**不会自动变绿**。它指向的真实生产缺口是
//     「认证普查 `status:"present"` 但 `entries` 为空时，`census.errors` 仍必须逐条投影，
//     而不是被一条笼统错误顶掉」。这是可闭合的缺口（见事实 2），不是死门。
//
//   * 夹具口径：本文件已按 build-code 通道补齐必需材料与必需证据（实测
//     `facts.required_materials` = [original_requirement, decision_log, spec, phase_index, implementation]、
//     `facts.required_evidence` = [decision-log, spec, phase-index, phases/P1.md, implementation, tests, ac-trace]），
//     好让 ① 的诊断面**只剩普查口径消息**，不被 4 条与普查无关的 `… is required for build-code` 噪音淹没。
//     这是夹具保真度修正，**不改任何断言口径**。
//
// 与冻结预置版的差异逐条登记：
//   ① 逐条可见性（要害，现在必红）：入口改用 build-code + post + task_id（原为 build-plan）；
//      实质要求不变——≥2 个互不相同的缺失节标题被指名，且落在 ≥2 条互不相同的消息里。
//   ② 负控：保留并加强——用归档卡 07 的真实合规 decision-log，要求零条 /census|原始来源/ 诊断；
//      入口与 ① 同（既不在 build-plan 通道上写断言，也避免 CARD-05 后负控退化成空真）。
//   ③ 返回契约形状稳定：断言原样保留，入口与 ①② 同（形状契约与 stage 无关，已实测两条通道键集一致）。
//   ④ 删除的两个旧断言及理由（T013 让出重叠实现后不再属本文件）：
//      - 「上游 R 行必须进入覆盖判定」：那是分析器**生产侧**的新增能力，归 CARD-05／后续卡，本卡不实现。
//      - 「真实 decision-log 的普查分母非零」：那是 T009 的落地断言，不是 T013 的核验对象，
//        且会随材料改写而失稳；本文件不再代表它。
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  deriveDecisionLogOriginalSourceCensus,
  validateStageSpecAnalyzeProfile,
} from "../../runtime/stage/stage-content-contracts.mjs";

const TASK_ID = "workflowhub-thin-core-card-04-20260919";
const SNAPSHOT = "b".repeat(40);

// 本文件唯一的断言通道：CARD-05 保留的 build-code 普查通道。
const BUILD_CODE_IDENTITY = {
  task_id: TASK_ID,
  stage: "build-code",
  activation_cohort: "post",
  snapshot_tree: SNAPSHOT,
};

// 合规 decision-log 的真实字节（归档卡 07，只读）。路径若迁移，改这一处即可。
const ARCHIVED_COMPLIANT_DECISION_LOG =
  new URL("../../specs/archive/workflowhub-thin-core-card-07-20260919/decision-log.md", import.meta.url);

// 「缺普查三节」的材料：不存在 `## 需求变更记录`、`## 原始需求索引`、`## 逐字声明层（verbatim）`。
// 只写叙述性文字，不给任何逐字声明、原始需求索引或需求变更记录，因此真实普查函数
// 必然对它产出逐条的「缺节」诊断（实测 5 条）。
const DECISION_LOG_MISSING_CENSUS_SECTIONS = [
  "# Decision log（材料缺失样本：三个普查区块都不存在）",
  "",
  "## 任务身份",
  `- task_id: ${TASK_ID}`,
  "- stage: build-plan",
  "",
  "## 已选方向",
  "- 本样本只保留叙述性文字，不提供逐字声明、原始需求索引或需求变更记录。",
  "",
].join("\n");

// decision-log.md 的三个普查区块标题（领域事实，不是本卡的实现细节）。
const CENSUS_SECTION_MARKERS = Object.freeze(["需求变更记录", "原始需求索引", "逐字声明层（verbatim）"]);
// 负控口径：任何提到「普查 / 原始来源」的诊断都算普查口径诊断。
const CENSUS_DIAGNOSTIC_MARKER = /census|原始来源/;

// build-code 通道的必需证据面（实测 `facts.required_evidence`）：
//   ["decision-log","spec","phase-index","phases/P1.md","implementation","tests","ac-trace"]
// 全部补齐，好让 ① 的诊断面**只剩普查口径消息**。否则会混入 4 条与普查无关的
// 「… is required for build-code」噪音，淹没本测试真正要核验的那个缺口。
const EVIDENCE = [
  "decision-log", "spec", "phase-index", "phases/P1.md", "implementation", "tests", "ac-trace",
].map((ref) => ({
  ref,
  kind: ref,
  status: "fresh",
  hash: "a".repeat(64),
  snapshot_tree: SNAPSHOT,
}));

function coverageRow(requirementId, behavior, status = "unavailable") {
  return {
    requirement_id: requirementId,
    expected_behavior: behavior,
    actual_behavior: null,
    semantic_status: "unavailable",
    status,
    scenario_refs: ["SCN-001"],
    oracle_refs: ["ORACLE-P1"],
    artifact_refs: ["spec"],
    evidence_refs: ["spec"],
    source_unit_refs: [requirementId],
  };
}

function packet(overrides = {}) {
  return {
    activation_cohort: "post",
    materials: {
      original_requirement: "U-001 完整单测与端到端测试。",
      decision_log: "## 逐字声明层（verbatim）\n| V-001 | 用户 | 首轮 | 完整单测与端到端测试。 |",
      spec: "# Spec\nU-001 完整单测与端到端测试。",
      phase_index: "# Phase index\nP1 -> phases/P1.md",
      phases: { "phases/P1.md": "# Phase P1\nU-001 ORACLE-P1" },
      // build-code 的必需材料（实测 `facts.required_materials` 含 `implementation`）。
      implementation: "runtime/stage/stage-runner.mjs：build-code 阶段的分析入口。",
    },
    original_requirements: [{ id: "U-001", summary: "完整单测与端到端测试。" }],
    coverage: [coverageRow("U-001", "完整单测与端到端测试。")],
    evidence: EVIDENCE,
    ...overrides,
  };
}

const U_001 = { id: "U-001", summary: "完整单测与端到端测试。", kind: "verbatim_u", source_refs: ["U-001"] };

function censusWith({ entries, indexEntries = [], errors = [] }) {
  return {
    status: "present",
    entries,
    index_entries: indexEntries,
    source_units: entries.map((entry) => ({ id: entry.id, kind: entry.kind ?? "verbatim_u", text: entry.summary })),
    source_counts: { u: entries.length, atoms: 0, v: 0, r: indexEntries.length },
    errors,
  };
}

/** 走本文件唯一的断言通道：build-code + post + 非空 task_id。 */
function analyzeBuildCode(census, overrides = {}) {
  return validateStageSpecAnalyzeProfile({
    stage: "build-code",
    packet: packet(overrides),
    identity: BUILD_CODE_IDENTITY,
    authenticatedSourceCensus: census,
  });
}

/**
 * 机器可读诊断面 = analyzer 的 `errors` ∪ `facts` 里所有字符串叶子。
 * facts 侧故意做成深度遍历：CARD-05 可以把普查 errors 放进任意嵌套账本键
 * （例如 `facts.source_census.errors`、`facts.census_ledger`），本文件都认。
 */
function diagnosticSurface(result) {
  const surface = [...(Array.isArray(result.errors) ? result.errors : [])];
  const walk = (value) => {
    if (typeof value === "string") { surface.push(value); return; }
    if (Array.isArray(value)) { for (const item of value) walk(item); return; }
    if (value && typeof value === "object") for (const item of Object.values(value)) walk(item);
  };
  walk(result.facts);
  return surface;
}

/** 诊断面里指名了某个普查节标题的全部消息。 */
function messagesNamingSection(surface, marker) {
  return surface.filter((message) => typeof message === "string" && message.includes(marker));
}

describe("spec-analyze 普查诊断的消费侧核验（T013 消费/核验 gate，build-code 通道）", () => {
  it("逐条可见性：上游遗漏必须逐条可见，至少两条互不相同、指名不同缺失节的普查诊断出现在机器可读输出里", () => {
    const census = deriveDecisionLogOriginalSourceCensus(DECISION_LOG_MISSING_CENSUS_SECTIONS);
    const derivedSections = CENSUS_SECTION_MARKERS.filter(
      (marker) => census.errors.some((error) => error.includes(marker)),
    );
    expect(
      derivedSections,
      `前提不成立：真实普查函数没有在「缺三节」材料上产出逐条的缺节诊断`
        + `（census.errors=${JSON.stringify(census.errors)}）；本测试的前提是这三节缺失会被逐条报出`,
    ).toHaveLength(CENSUS_SECTION_MARKERS.length);

    const surface = diagnosticSurface(analyzeBuildCode(census));
    const namedSections = CENSUS_SECTION_MARKERS.filter(
      (marker) => messagesNamingSection(surface, marker).length > 0,
    );
    const distinctMessages = new Set(
      CENSUS_SECTION_MARKERS.flatMap((marker) => messagesNamingSection(surface, marker)),
    );

    expect(
      namedSections.length,
      `普查诊断被吞成一条笼统错误（D-004 口径：逐条枚举、不得总结）。`
        + `机器可读输出里被指名缺失的普查节只有 ${namedSections.length} 个（需要 ≥2）：`
        + `${JSON.stringify(namedSections)}；`
        + `实际诊断面=${JSON.stringify(surface)}`,
    ).toBeGreaterThanOrEqual(2);
    expect(
      distinctMessages.size,
      `总结式诊断不满足「逐条」：指名缺失节的诊断只有 ${distinctMessages.size} 条互不相同的原文（需要 ≥2）。`
        + `把多节总结进同一条消息不算逐条枚举。实际=${JSON.stringify([...distinctMessages])}`,
    ).toBeGreaterThanOrEqual(2);
  });

  it("负控：decision-log 合规（归档卡 07 真实文本）时不得产出任何匹配 /census|原始来源/ 的诊断", () => {
    const census = deriveDecisionLogOriginalSourceCensus(readFileSync(ARCHIVED_COMPLIANT_DECISION_LOG, "utf8"));
    expect(
      census.errors,
      `负控前提不成立：归档卡 07 的 decision-log 被真实普查函数判为不合规：${JSON.stringify(census.errors)}`,
    ).toEqual([]);
    expect(
      census.entries.length,
      "负控前提不成立：合规 decision-log 的普查分母为零，负控会退化成空真",
    ).toBeGreaterThan(0);

    const complaints = diagnosticSurface(analyzeBuildCode(census)).filter((message) => CENSUS_DIAGNOSTIC_MARKER.test(message));
    expect(
      complaints,
      `负控失败：decision-log 合规，却仍然产出普查口径诊断：${complaints.join(" | ")}`,
    ).toEqual([]);
  });

  it("返回契约形状稳定：ok / status / errors / findings / summary / facts", () => {
    const census = censusWith({ entries: [U_001], indexEntries: [] });
    const result = analyzeBuildCode(census);
    expect(Object.keys(result).sort()).toEqual([
      "errors",
      "facts",
      "findings",
      "ok",
      "stage",
      "status",
      "summary",
    ]);
    expect(typeof result.ok).toBe("boolean");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(typeof result.summary).toBe("object");
  });
});
