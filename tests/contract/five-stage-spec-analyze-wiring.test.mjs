import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { STAGE_PREDICATES } from "../../runtime/stage/completion-predicates.mjs";
import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";

const MATERIALS = {
  original_requirement: "用户要求完整覆盖并减少无谓阻塞",
  decision_log: "R-001 用户要求完整覆盖；D-001 采用五阶段检查",
  spec: "FR-001 需求覆盖；AC-001 有真实证据",
  plan: "P1 交互与一致性；P2 审查恢复",
  tasks: "T001 实施；T002 测试",
  implementation: "实现了当前阶段行为",
};

  const EVIDENCE = [
  ...["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace", "review", "runtime", "delivery"]
    .map((ref) => ({ ref, kind: ref, status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40), ...(ref === "tests" ? { test_result: { command: "true", expected_exit: 0, actual_exit: 0, oracle: "ORACLE-001", actual_outcome: "当前结果" } } : {}) })),
];

function packet(overrides = {}) {
  return {
    original_requirements: [{ id: "R-001", summary: "用户要求完整覆盖并减少无谓阻塞" }],
    materials: { ...MATERIALS },
    evidence: EVIDENCE,
    coverage: [{
      requirement_id: "R-001",
      expected_behavior: "用户要求完整覆盖并减少无谓阻塞",
      actual_behavior: "当前阶段实现了用户要求完整覆盖并减少无谓阻塞",
      semantic_match: true,
      scenario_refs: ["SCN-001"],
      oracle_refs: ["ORACLE-001"],
      artifact_refs: ["decision_log"],
      evidence_refs: ["decision-log"],
      status: "covered",
    }],
    work_summary: "完成当前阶段的需求一致性检查和产物整理。",
    ...overrides,
  };
}

describe("authoring-stage spec-analyze profiles", () => {
  it("makes the current stage-end analyzer an explicit quality subject for every authoring stage", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code"]) {
      expect(STAGE_PREDICATES[stage].stage_end_spec_analyze, stage).toBe("acceptance_criterion");
    }
    expect(STAGE_PREDICATES["verify-code"]).not.toHaveProperty("stage_end_spec_analyze");
  });

  it("routes make-decision interaction receipts through the per-round lifecycle validator", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../../runtime/stage/stage-handlers.mjs", import.meta.url), "utf8");
    expect(source).toMatch(/validateInteractionLifecycleSequence/);
    expect(source).toMatch(/interactionAggregateFacts[\s\S]*validateInteractionAggregateLifecycle/);
  });

  it("defines cumulative inputs and evidence for the four authoring stages", () => {
    expect(contracts.STAGE_SPEC_ANALYZE_PROFILES).toBeDefined();
    expect(Object.keys(contracts.STAGE_SPEC_ANALYZE_PROFILES)).toEqual([
      "make-decision", "build-spec", "build-plan", "build-code",
    ]);
    expect(contracts.STAGE_SPEC_ANALYZE_PROFILES["build-plan"].required_materials).toEqual(
      expect.arrayContaining(["decision_log", "spec", "plan", "tasks"]),
    );
    expect(contracts.STAGE_SPEC_ANALYZE_PROFILES["build-code"].required_materials).toEqual(
      expect.arrayContaining(["decision_log", "spec", "plan", "tasks", "implementation"]),
    );
    expect(contracts.STAGE_SPEC_ANALYZE_PROFILES["build-code"].required_evidence).toEqual(
      expect.arrayContaining(["tests", "ac-trace"]),
    );
    expect(contracts.STAGE_SPEC_ANALYZE_PROFILES["verify-code"]).toBeUndefined();
  });

  it("does not accept an AC chain produced by another stage", () => {
    const tree = "b".repeat(40);
    const row = {
      acceptance_criterion_id: "AC-001",
      status: "covered",
      task_id: "task",
      material_revision: "revision-1",
      snapshot_tree: tree,
      producer_stage: "build-plan",
      source_ids: ["R-001"],
      decision_ids: ["D-001"],
      fr_ids: ["FR-001"],
      task_ids: ["T001"],
      file_symbol: "runtime/example.mjs#run",
      implementation_anchor: { id: "impl", path: "runtime/example.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "verify", path: "tests/example.test.mjs", start_line: 1, end_line: 2, role: "verification" },
      gate: { command: "true", expected_exit: 0, oracle: "ORACLE-001" },
      scenario: "当前场景",
      actual_outcome: "当前结果",
      coverage_limits: "不覆盖外部 provider",
      evidence_refs: [{ ref: "tests", hash: "a".repeat(64), snapshot_tree: tree }],
      test_result: { evidence_ref: "tests", command: "true", expected_exit: 0, actual_exit: 0, oracle: "ORACLE-001", actual_outcome: "当前结果" },
      review_ref: { ref: "review", hash: "a".repeat(64), snapshot_tree: tree },
      stage_end_ref: { ref: "ac-trace", hash: "a".repeat(64), snapshot_tree: tree },
    };
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-code",
      packet: packet({ expected_ac_ids: ["AC-001"], acceptance_coverage: [row] }),
      strict_material_contracts: true,
      identity: { task_id: "task", stage: "build-code", material_revision: "revision-1", snapshot_tree: tree },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/producer_stage is stale/);
  });

  it("does not let build-code self-report a smaller AC set than the current spec", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-code",
      packet: packet({
        materials: { ...MATERIALS, spec: "## Acceptance Criteria\n- **AC-001** first\n- **AC-002** second" },
        expected_ac_ids: ["AC-001"],
        acceptance_coverage: [],
      }),
      strict_material_contracts: true,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/expected_ac_ids must exactly match the active AC set/);
  });

  it("fails closed on malformed Clarify skip lifecycle data", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-spec",
      packet: packet({
        clarify: {
          status: "resolved",
          trigger: false,
          reason: "当前材料已经回答规格问题",
          open_direction_changing_questions: 0,
          lifecycle_rounds: { malformed: true },
        },
      }),
      strict_material_contracts: true,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/lifecycle_rounds/);
  });

  it("rejects a PFACT that declares more than one state", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-spec",
      packet: packet({
        materials: {
          ...MATERIALS,
          spec: "## 速读卡\n当前任务。\n## 1. 问题与紧迫性\n需要明确事实。\n## 4. 产品事实与假设（PFACT）\n- **PFACT-001**：verified；inferred\nFR-001 AC-001",
        },
      }),
      strict_material_contracts: true,
    });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "pfact_contract_gap", line_or_anchor: "PFACT-001" }),
    ]));
  });

  it("accepts compact decision ids and a PFACT state declared on its status line", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-spec",
      packet: packet({
        materials: {
          ...MATERIALS,
          decision_log: "R-001 用户要求完整覆盖；D1 采用五阶段检查",
          spec: readFileSync(new URL("../../specs/ui-e2e-delivery-contract-20260830/spec.md", import.meta.url), "utf8"),
        },
      }),
      strict_material_contracts: true,
    });
    expect(result).toMatchObject({ ok: true, status: "consistent" });
  });

  it("returns a six-part plain-language summary only after semantic and evidence checks", () => {
    for (const stage of Object.keys(contracts.STAGE_SPEC_ANALYZE_PROFILES)) {
      const result = contracts.validateStageSpecAnalyzeProfile({ stage, packet: packet() });
      expect(result, `${stage}: ${result?.errors?.join("; ")}`).toMatchObject({ ok: true, status: "consistent" });
      expect(Object.keys(result.summary)).toEqual([
        "stage_work", "requirement_coverage", "upstream_alignment",
        "current_stage_repairs", "remaining_risks", "next_stage_boundary",
      ]);
    }
  });

  it("finds semantic drift even when the requirement id, artifacts, and evidence refs exist", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{
        ...packet().coverage[0],
        actual_behavior: "文档文件存在",
        semantic_match: false,
      }] }),
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("inconsistent");
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-001" }),
    ]));
    for (const finding of result.findings) {
      expect(finding).toMatchObject({
        source_artifact: expect.any(String),
        target_artifact: expect.any(String),
        fr_or_task_id: expect.any(String),
        line_or_anchor: expect.any(String),
        impact: expect.any(String),
        suggested_correction: expect.any(String),
        disposition: "pending_main_agent_review",
      });
    }
  });

  it.each([
    ["批量提问测试通过", "支持批量提问"],
    ["ID存在", "支持批量提问"],
    ["hash一致", "支持批量提问"],
  ])("rejects artifact-only coverage claims (%s)", (actual_behavior, expected_behavior) => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{ ...packet().coverage[0], actual_behavior, expected_behavior }] }),
    });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-001" }),
    ]));
  });

  it("keeps a real behavior after an artifact observation from being misclassified", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{
        ...packet().coverage[0],
        actual_behavior: "hash已检查，支持批量提问",
        expected_behavior: "支持批量提问",
      }] }),
    });
    expect(result).toMatchObject({ ok: true, status: "consistent" });
  });

  it("does not treat unfinished coverage rows as covered", () => {
    for (const status of ["partial", "missing", "changed", "expanded", "stale", "unavailable"]) {
      const result = contracts.validateStageSpecAnalyzeProfile({
        stage: "build-plan",
        packet: packet({ coverage: [{ ...packet().coverage[0], status }] }),
      });
      expect(result.ok).toBe(false);
      expect(result.findings.length).toBeGreaterThan(0);
    }
  });

  it("preserves justified not-applicable and deferred rows as non-covered facts", () => {
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{
        ...packet().coverage[0],
        status: "not_applicable",
        reason: "本阶段没有页面产物；交付对象是工作流运行时",
      }] }),
    });
    expect(result).toMatchObject({ ok: true, status: "consistent", facts: { covered_count: 0 } });
    expect(result.findings).toHaveLength(0);
    expect(result.summary.requirement_coverage).toMatch(/not_applicable 1/);

    const deferred = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{
        ...packet().coverage[0],
        status: "deferred",
        owner: "build-code",
        trigger: "P2 implementation completes",
        handoff: "T004",
        close_condition: "focused test and review evidence",
      }] }),
    });
    expect(deferred).toMatchObject({ ok: true, status: "consistent", facts: { covered_count: 0 } });
    expect(deferred.findings).toHaveLength(0);
    expect(deferred.summary.requirement_coverage).toMatch(/deferred 1/);
  });

  it("rejects not-applicable without a reason and deferred without a complete handoff", () => {
    const notApplicable = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{ ...packet().coverage[0], status: "not_applicable" }] }),
    });
    expect(notApplicable.ok).toBe(false);
    expect(notApplicable.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "requirement_gap", requirement_id: "R-001" }),
    ]));

    const deferred = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ coverage: [{ ...packet().coverage[0], status: "deferred", owner: "build-code" }] }),
    });
    expect(deferred.ok).toBe(false);
    expect(deferred.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "deferred_open_handoff_gap", requirement_id: "R-001" }),
    ]));
    expect(deferred.errors.join("; ")).toMatch(/trigger|handoff|close_condition/);
  });

  it("returns material_incomplete for missing upstream input instead of guessing it", () => {
    const materials = { ...MATERIALS };
    delete materials.spec;
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-plan",
      packet: packet({ materials }),
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("material_incomplete");
    expect(result.errors.join("; ")).toMatch(/spec/i);
  });

  it("reports stale evidence as a finding rather than treating a ref as proof", () => {
    const evidence = EVIDENCE.map((entry) => entry.ref === "tests" ? { ...entry, status: "stale" } : entry);
    const result = contracts.validateStageSpecAnalyzeProfile({
      stage: "build-code",
      packet: packet({ evidence, coverage: [{
        ...packet().coverage[0], evidence_refs: ["tests"],
      }] }),
    });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "stale_evidence", evidence_ref: "tests" }),
    ]));
  });
});
