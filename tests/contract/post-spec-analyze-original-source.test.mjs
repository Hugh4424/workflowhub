import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { deriveDecisionLogOriginalSourceCensus, validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";

const snapshot = "b".repeat(40);
const evidence = ["decision-log", "spec", "phase-index", "phases/P1.md"].map((ref) => ({
  ref,
  kind: ref,
  status: "fresh",
  hash: "a".repeat(64),
  snapshot_tree: snapshot,
}));

function covered(requirement_id, behavior) {
  return {
    requirement_id,
    expected_behavior: behavior,
    actual_behavior: behavior,
    semantic_status: "completed",
    status: "covered",
    scenario_refs: ["SCN-001"],
    oracle_refs: ["ORACLE-P1"],
    artifact_refs: ["spec"],
    evidence_refs: ["spec"],
  };
}

function packet(overrides = {}) {
  return {
    activation_cohort: "post",
    authenticated_requirement_messages: [
      { id: "R-001", text: "结果必须可见。" },
      { id: "R-002", text: "每轮都提供替代方案。" },
      { id: "R-003", text: "失败不得静默吞掉。" },
    ],
    materials: {
      original_requirement: "R-001 结果必须可见。\nR-002 每轮都提供替代方案。\nR-003 失败不得静默吞掉。",
      decision_log: "# Decision\nR-001 结果必须可见。\nR-002 每轮都提供替代方案。",
      spec: "# Spec\nR-001 结果必须可见。\nR-002 每轮都提供替代方案。",
      phase_index: "# Phase index\nP1 -> phases/P1.md",
      phases: { "phases/P1.md": "# Phase P1\nR-001 R-002 ORACLE-P1" },
    },
    original_requirements: [
      { id: "R-001", summary: "结果必须可见。" },
      { id: "R-002", summary: "每轮都提供替代方案。" },
    ],
    coverage: [
      covered("R-001", "结果必须可见"),
      covered("R-002", "每轮都提供替代方案"),
    ],
    evidence,
    ...overrides,
  };
}

describe("CARD07 P4 original source contract", () => {
  it("CARD07 P4 original AC matrix keeps all 22 CARD-02 rows independently incomplete without evidence", () => {
    const archived = readFileSync(new URL("../../specs/archive/workflowhub-thin-core-card-02-20260919/spec.md", import.meta.url), "utf8");
    const currentSpec = readFileSync(new URL("../../specs/workflowhub-thin-core-card-07-20260919/spec.md", import.meta.url), "utf8");
    const currentDecision = readFileSync(new URL("../../specs/workflowhub-thin-core-card-07-20260919/decision-log.md", import.meta.url), "utf8");
    const sourceIds = [...new Set(archived.match(/\bAC-[A-Z][A-Z0-9-]+\b/g) ?? [])]
      .filter((id) => !["AC-07", "AC-08"].includes(id));
    expect(sourceIds).toHaveLength(22);
    const matrix = sourceIds.map((id) => ({
      acceptance_criterion_id: id,
      source_present: archived.includes(id),
      current_source_refs: [currentSpec, currentDecision].filter((text) => text.includes(id)).length,
      evidence_refs: [],
      status: "incomplete",
      reason: "CARD-02 historical AC has no current build-code evidence row yet",
    }));
    expect(matrix).toHaveLength(22);
    expect(matrix.every((row) => row.source_present && row.status === "incomplete" && row.evidence_refs.length === 0)).toBe(true);
    expect(matrix.some((row) => row.status === "achieved")).toBe(false);
  });

  it("derives an independent R denominator and detects an omitted U atom even when the packet claims completeness", () => {
    const decision = `## 需求变更记录
### U-001 — 逐字
> 每轮都提供替代方案。
### U-002 — 逐字
> 要展示结果，也要明确失败。
| U-002-01 | 展示结果 | 流程 |
| U-002-02 | 明确失败 | 流程 |
## 原始需求索引
| R-001 | U-001；U-002-01 | D-001 |
## 逐字声明层（verbatim）
| V-ID | 说出者 | 场景 | 逐字原文 |
| V-001 | 用户 | 首轮 | 每轮都提供替代方案。 |
`;
    const census = deriveDecisionLogOriginalSourceCensus(decision);
    expect(census.entries.map((entry) => entry.id)).toEqual(["U-001", "U-002-01", "U-002-02"]);
    expect(census.index_entries.map((entry) => entry.id)).toEqual(["R-001"]);
    expect(census.source_units.find((entry) => entry.id === "U-002").decomposed_by).toEqual(["U-002-01", "U-002-02"]);
    expect(census.source_units.find((entry) => entry.id === "V-001").alias_of).toBe("U-001");
    expect(census.source_units.find((entry) => entry.id === "U-001")).toMatchObject({
      kind: "verbatim_u", start_line: 3, end_line: 3,
    });
    expect(census.source_units.find((entry) => entry.id === "U-001").sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(census.errors).toContain("verbatim source is absent from R index: U-002-02");
    const current = packet({
      materials: { ...packet().materials, decision_log: decision },
      original_requirements: [{ id: "R-001", summary: "U-001；U-002-01" }],
      coverage: [covered("R-001", "展示结果")],
    });
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan", packet: current,
      identity: { task_id: "source-atom-fixture", stage: "build-plan", activation_cohort: "post", snapshot_tree: snapshot },
      authenticatedSourceCensus: census,
    });
    expect(result.status).toBe("material_incomplete");
    expect(result.errors.join("; ")).toContain("U-002-02");
    expect(result.summary.requirement_coverage).toMatch(/^0\/3 条原始来源记录（尚未语义去重）/);
    expect(result.facts).toMatchObject({
      requirement_count: 3,
      source_record_count: 3,
      covered_count: 0,
      semantic_review_status: "unavailable",
    });
  });

  it("keeps an independent V statement in the denominator while exact U/V duplicates count once", () => {
    const decision = `## 需求变更记录
### U-001 — 逐字
> 结果必须可见。
## 原始需求索引
| R-001 | U-001；V-002 | D-001 |
## 逐字声明层（verbatim）
| V-001 | 用户 | 重复原话 | 结果必须可见。 |
| V-002 | 用户 | 后续新增 | 失败必须明确报错。 |
`;
    const census = deriveDecisionLogOriginalSourceCensus(decision);
    expect(census.errors).toEqual([]);
    expect(census.entries.map(({ id }) => id)).toEqual(["U-001", "V-002"]);
    expect(census.source_units.map(({ id }) => id)).toEqual(["U-001", "V-001", "V-002"]);
    expect(census.source_units.find(({ id }) => id === "V-001").alias_of).toBe("U-001");
    expect(census.source_units.find(({ id }) => id === "V-002").alias_of).toBeUndefined();
  });

  it("expands ranges for a later U family and detects missing atoms and deleted verbatim parents", () => {
    const decision = `## 需求变更记录
### U-009 — 逐字
> 三种结果都要可见。
| U-009-01 | 成功 | 流程 |
| U-009-02 | 失败 | 流程 |
| U-009-03 | 未知 | 流程 |
## 原始需求索引
| R-001 | U-009-01~03 | D-001 |
## 逐字声明层（verbatim）
| V-001 | 用户 | 原话 | 三种结果都要可见。 |
`;
    const complete = deriveDecisionLogOriginalSourceCensus(decision);
    expect(complete.errors).toEqual([]);
    const missingAtom = deriveDecisionLogOriginalSourceCensus(decision.replace("| U-009-02 | 失败 | 流程 |\n", ""));
    expect(missingAtom.errors).toContain("R index row cites absent U/V source: R-001 -> U-009-02");
    const missingOriginal = deriveDecisionLogOriginalSourceCensus(decision.replace("> 三种结果都要可见。\n", ""));
    expect(missingOriginal.errors).toContain("decomposed source has no verbatim U parent: U-009-01");
    expect(missingOriginal.errors).toContain("R index row cites absent U/V source: R-001 -> U-009");
  });

  it("does not turn caller-owned expected/actual equality into a post semantic verdict", () => {
    const decision = `## 需求变更记录
### U-001 — 逐字
> 结果必须可见。
## 原始需求索引
| R-001 | U-001 | D-001 |
## 逐字声明层（verbatim）
| V-001 | 用户 | 原话 | 结果必须可见。 |
`;
    const census = deriveDecisionLogOriginalSourceCensus(decision);
    const claim = packet({
      materials: {
        ...packet().materials,
        decision_log: decision,
        spec: "# Spec\n结果必须可见。",
        phases: { "phases/P1.md": "# Phase P1\n结果必须可见。" },
      },
      original_requirements: [{ id: "R-001", summary: "U-001" }],
      coverage: [{ ...covered("R-001", "结果必须可见。"), source_unit_refs: ["U-001"] }],
    });
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan", packet: claim,
      identity: { task_id: "self-reported-semantic-fixture", stage: "build-plan", activation_cohort: "post", snapshot_tree: snapshot },
      authenticatedSourceCensus: census,
    });
    expect(result.status).toBe("material_incomplete");
    expect(result.errors).toContain("MATERIAL_INCOMPLETE: covered R-001 needs independent semantic review");
    expect(result.summary.requirement_coverage).toMatch(/^0\/1 条原始来源记录（尚未语义去重）/);
    expect(result.facts).toMatchObject({ source_record_count: 1, covered_count: 0, semantic_review_status: "unavailable" });
  });

  it("rejects a packet that rewrites the decision-log requirement source text", () => {
    const census = { status: "present", entries: [{ id: "R-001", summary: "U-001 原话" }], errors: [] };
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ original_requirements: [{ id: "R-001", summary: "另一种需求" }], coverage: [covered("R-001", "结果必须可见")] }),
      identity: { task_id: "source-rewrite-fixture", stage: "build-plan", activation_cohort: "post", snapshot_tree: snapshot },
      authenticatedSourceCensus: census,
    });
    expect(result.errors).toContain("MATERIAL_INCOMPLETE: analyzer packet changed decision-log source text: R-001");
  });
  it("CARD07 P4 source authority does not accept packet-owned coverage as a trusted original census", () => {
    const completeInsidePacket = packet({
      original_requirements: [
        { id: "R-001", summary: "结果必须可见。" },
        { id: "R-002", summary: "每轮都提供替代方案。" },
        { id: "R-003", summary: "失败不得静默吞掉。" },
      ],
      coverage: [
        covered("R-001", "结果必须可见"),
        covered("R-002", "每轮都提供替代方案"),
        covered("R-003", "失败不得静默吞掉"),
      ],
    });
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: completeInsidePacket,
      identity: { task_id: "post-source-authority-fixture", stage: "build-plan", activation_cohort: "post", snapshot_tree: snapshot },
    });
    expect(result.status).toBe("material_incomplete");
    expect(result.errors.join("; ")).toMatch(/authenticated original source census/i);
  });

  it("CARD07 P4 source census rejects an omitted original when the independent census has three items", () => {
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet(),
      identity: { task_id: "post-source-census-fixture", stage: "build-plan", activation_cohort: "post", snapshot_tree: snapshot },
      // Comparator unit fixture only. The official runner must build this
      // argument from task-owned bytes; this test does not authenticate them.
      authenticatedSourceCensus: {
        status: "present",
        entries: [{ id: "R-001" }, { id: "R-002" }, { id: "R-003" }],
      },
    });
    expect(result.ok).toBe(false);
    expect(`${result.errors.join("; ")} ${JSON.stringify(result.findings)}`).toContain("R-003");
  });

  it("CARD07 P4 semantic strength rejects a first-round-only implementation of an every-round requirement", () => {
    const current = packet({
      authenticated_requirement_messages: [{ id: "R-002", text: "每轮都提供替代方案。" }],
      original_requirements: [{ id: "R-002", summary: "每轮都提供替代方案。" }],
      coverage: [{
        ...covered("R-002", "每轮都提供替代方案"),
        actual_behavior: "每轮都提供替代方案，仅在第一轮执行",
      }],
    });
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: current,
      identity: { activation_cohort: "post", snapshot_tree: snapshot },
    });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-002" }),
    ]));
  });

  it.each([
    "每轮都提供替代方案，仅在第二轮执行",
    "每轮都提供替代方案，只有部分轮次执行",
    "每轮都提供替代方案，至少执行一次即可",
  ])("CARD07 P4 semantic strength rejects a later scope restriction (%s)", (actual_behavior) => {
    const current = packet({
      original_requirements: [{ id: "R-002", summary: "每轮都提供替代方案。" }],
      coverage: [{ ...covered("R-002", "每轮都提供替代方案"), actual_behavior }],
    });
    const result = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: current });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-002" }),
    ]));
  });

  it.each([
    ["不得把缺失审查当成通过", "不得把缺失审查当成通过，但允许无结果时默认通过"],
    ["每个 Phase 必须独立文件", "每个 Phase 必须独立文件，但是只在 plan.md 的章节中表示"],
  ])("CARD07 P4 semantic strength rejects a contradictory exception after copied words (%s)", (expected_behavior, actual_behavior) => {
    const current = packet({
      original_requirements: [{ id: "R-001", summary: expected_behavior }],
      coverage: [{ ...covered("R-001", expected_behavior), actual_behavior }],
    });
    const result = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: current });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-001" }),
    ]));
  });
});
