import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveDecisionLogOriginalSourceCensus, validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";

const root = "specs/workflowhub-thin-core-card-05-20260919";
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

function currentPacket(overrides = {}) {
  const phases = Object.fromEntries(["P1", "P2", "P3", "P4", "P5"].map((id) => [
    `phases/${id}.md`, read(`${root}/phases/${id}.md`),
  ]));
  return {
    activation_cohort: "post",
    materials: {
      decision_log: read(`${root}/decision-log.md`),
      spec: read(`${root}/spec.md`),
      phase_index: read(`${root}/phases/index.md`),
      phases,
    },
    // These fields are deliberately caller-owned and must not become a
    // machine-generated post build-plan denominator.
    original_requirements: [],
    coverage: [],
    ...overrides,
  };
}

describe("decision-log original-source census derivation", () => {
  const decisionLog = `## 需求变更记录
### U-001 — 逐字
> 每轮都提供替代方案。
### U-002 — 逐字
> 要展示结果，也要明确失败。
| U-002-01 | 展示结果 | 流程 |
| U-002-02 | 明确失败 | 流程 |
## 原始需求索引
| R-001 | U-001；U-002-01~02；V-002 | D-001 |
## 逐字声明层（verbatim）
| V-ID | 说出者 | 场景 | 逐字原文 |
| V-001 | 用户 | 首轮 | 每轮都提供替代方案。 |
| V-002 | 用户 | 补充 | 缺少结果必须明确报错。 |
`;

  it("expands U atoms and ranges, counts independent V statements once, and deduplicates exact aliases", () => {
    const census = deriveDecisionLogOriginalSourceCensus(decisionLog);

    expect(census.errors).toEqual([]);
    expect(census.entries.map(({ id }) => id)).toEqual(["U-001", "U-002-01", "U-002-02", "V-002"]);
    expect(census.index_entries[0].source_refs).toEqual(expect.arrayContaining(["U-001", "U-002-01", "U-002-02", "V-002"]));
    expect(census.index_entries[0].source_refs).toHaveLength(5);
    expect(census.source_units.find(({ id }) => id === "U-002").decomposed_by).toEqual(["U-002-01", "U-002-02"]);
    expect(census.source_units.find(({ id }) => id === "V-001").alias_of).toBe("U-001");
    expect(census.source_units.find(({ id }) => id === "V-002")).not.toHaveProperty("alias_of");
  });

  it("reports a missing indexed atom and a deleted verbatim parent", () => {
    const missingAtom = deriveDecisionLogOriginalSourceCensus(decisionLog.replace("| U-002-02 | 明确失败 | 流程 |\n", ""));
    expect(missingAtom.errors).toContain("R index row cites absent U/V source: R-001 -> U-002-02");

    const missingParent = deriveDecisionLogOriginalSourceCensus(decisionLog.replace("> 要展示结果，也要明确失败。\n", ""));
    expect(missingParent.errors).toContain("decomposed source has no verbatim U parent: U-002-01");
  });
});

describe("post build-plan report-only source boundary", () => {
  it("reports current structural materials without a raw requirement census", () => {
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: currentPacket(),
      identity: { task_id: "card05", activation_cohort: "post" },
      strict_material_contracts: true,
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("reported");
    expect(result.errors).toEqual([]);
    expect(result.facts).toMatchObject({
      requirement_count: null,
      covered_count: null,
      semantic_review_status: "unavailable",
    });
  });

  it("keeps a physical Phase or index mismatch visible for same-task repair", () => {
    const packet = currentPacket();
    const brokenIndex = packet.materials.phase_index.replace("`phases/P5.md`", "`phases/P6.md`");
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: { ...packet, materials: { ...packet.materials, phase_index: brokenIndex } },
      identity: { task_id: "card05", activation_cohort: "post" },
      strict_material_contracts: true,
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("inconsistent");
    expect(result.errors.join("; ")).toMatch(/Phase|authority|index/i);
    expect(result.summary.next_stage_boundary).toMatch(/不授权推进|不.*推进/);
  });

  it("ignores caller supplied original_requirements, coverage, and census claims", () => {
    const packet = currentPacket({
      original_requirements: [{ id: "R-FORGED", summary: "伪造的需求" }],
      coverage: [{ requirement_id: "R-FORGED", status: "covered", expected_behavior: "伪造", actual_behavior: "伪造" }],
    });
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet,
      identity: { task_id: "card05", activation_cohort: "post" },
      authenticatedSourceCensus: { status: "present", entries: [{ id: "R-REAL" }], errors: [] },
      strict_material_contracts: true,
    });
    expect(result.status).toBe("reported");
    expect(result.facts.requirement_count).toBeNull();
    expect(result.facts.covered_count).toBeNull();
    expect(result.errors).not.toContain(expect.stringContaining("R-FORGED"));
  });

  it("names the current post build-code stage when its authenticated census is absent", () => {
    const base = currentPacket();
    const result = validateStageSpecAnalyzeProfile({
      stage: "build-code",
      packet: {
        ...base,
        materials: {
          ...base.materials,
          original_requirement: base.materials.decision_log,
          implementation: "current implementation receipt",
        },
      },
      identity: { task_id: "card05", stage: "build-code", activation_cohort: "post" },
      authenticatedSourceCensus: { status: "present", entries: [], errors: [] },
    });
    expect(result.status).toBe("material_incomplete");
    expect(result.errors).toContain("MATERIAL_INCOMPLETE: authenticated original source census is required for post build-code");
  });


});
