import { describe, expect, it } from "vitest";

import { validateAcFourSegmentCards, validateDiagnosticReport, validateMaterialOracleContract, validateTaskOracleContract } from "../../runtime/stage/stage-content-contracts.mjs";
import { buildStageInputPacket, verifyStageInputPacket } from "../../runtime/task/material-workspace.mjs";

const goodAc = `### AC-TEST-001\n可观察的阶段完成事实\n验证：运行契约测试\n通过：结果状态为 recorded\n失败：结果状态为 incomplete\n证据：test\n`;
const goodOracle = (role = "RED", pairedTask = "T002", reject = true) => `#### T001\n- **verification_role**：${role}\n- **paired_task**：${pairedTask}\n- **oracle**：\`ORACLE-P2-TEST ${JSON.stringify({ pass: "正向事实可观察", ...(reject ? { reject: { input: "坏输入", expected_rejection: "返回 incomplete", observation: "看到 incomplete" } } : {}) })}\`\n- **semantic_review_status**：completed\n- **semantic_review_ref**：quality/evidence/semantic-review.json\n- **semantic_review_reason**：结构与语义已独立复核\n`;

describe("Phase 2 material and oracle contracts", () => {
  it("rejects old labels, empty AC segments, and whole-line placeholders", () => {
    expect(validateAcFourSegmentCards("### AC-TEST-001\n- **验证方法**：old\n- **通过条件**：old\n- **失败条件**：old\n- **证据类型**：test")).toMatchObject({ ok: false, status: "incomplete" });
    expect(validateAcFourSegmentCards("### AC-TEST-001\n验证：\n通过：通过\n失败：失败\n证据：test")).toMatchObject({ ok: false, status: "incomplete" });
    expect(validateAcFourSegmentCards(`${goodAc}\nTODO`)).toMatchObject({ ok: false, status: "incomplete" });
  });

  it("accepts four non-empty plain segments and applies RED-only reject semantics", () => {
    expect(validateAcFourSegmentCards(goodAc)).toMatchObject({ ok: true, status: "ready", cards: [{ id: "AC-TEST-001" }] });
    expect(validateTaskOracleContract(goodOracle("RED", "T002", false))).toMatchObject({ ok: false, status: "incomplete" });
    expect(validateTaskOracleContract(goodOracle("GREEN", "T001", false))).toMatchObject({ ok: true, status: "ready" });
    expect(validateMaterialOracleContract({ spec: goodAc, plan: goodAc, tasks: goodOracle("GREEN", "T001", false) })).toMatchObject({ ok: true, status: "ready" });
  });
});

describe("Phase 3 stage input packet contracts", () => {
  const navigation = `## 材料导航\n| 章节 | 一句话摘要 | 建议读取时机 |\n| --- | --- | --- |\n| 目标 | 说明范围 | M/S/B/P |\n`;

  it("T012 builds a deterministic packet hash over source and derived files", () => {
    const packet = buildStageInputPacket({
      task_id: "task-1",
      stage: "build-plan",
      material_revision: "rev-1",
      snapshot_tree: "a".repeat(40),
      source_materials: {
        spec: `${navigation}\r\n# Spec\r\nbody\r\n`,
        plan: `${navigation}\n# Plan\nbody\n`,
      },
      derived_files: [{ path: "evidence/context-baseline.json", content: "{\"baseline\":1}\n", producer: "build-spec", consumer: "build-plan" }],
    });
    expect(packet).toMatchObject({ schema_version: "workflowhub-stage-input-packet.v1", packet_freeze_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(packet.manifest.algorithm_version).toBe("stage-input-packet.v1");
    expect(packet.manifest.source_materials.map(({ path }) => path)).toEqual(["plan.md", "spec.md"]);
    expect(verifyStageInputPacket(packet)).toMatchObject({ ok: true, packet_freeze_hash: packet.packet_freeze_hash });
  });

  it("rejects packet drift and derived files that are treated as authoritative materials", () => {
    const packet = buildStageInputPacket({
      task_id: "task-1",
      stage: "build-plan",
      material_revision: "rev-1",
      snapshot_tree: "a".repeat(40),
      source_materials: { spec: navigation },
      derived_files: [{ path: "evidence/context-baseline.json", content: "{}\n", producer: "build-spec", consumer: "build-plan" }],
    });
    expect(verifyStageInputPacket({ ...packet, files: { ...packet.files, "spec.md": "changed\n" } })).toMatchObject({ ok: false, reason: "packet_file_hash_mismatch" });
    expect(() => buildStageInputPacket({
      task_id: "task-1", stage: "build-plan", material_revision: "rev-1", snapshot_tree: "a".repeat(40),
      source_materials: { spec: navigation },
      derived_files: [{ path: "spec.md", content: "derived", producer: "build-spec", consumer: "build-plan" }],
    })).toThrow(/duplicate packet path|derived file path cannot be a material path/i);
  });
});

describe("Phase 4 diagnostic, flow, preflight, governance, and report contracts [P4]", () => {
  const report = `## research-Q1\nsource: decision-log.md#Q1\nevidence: quality/evidence/q1.json\nimpact: make-decision effect is bounded\nconclusion: supported with limits\n\n## research-Q2\nsource: decision-log.md#Q2\nevidence: quality/evidence/q2.json\nimpact: context repetition is structural\nconclusion: token reduction is not proven\n\n## research-Q3\nsource: decision-log.md#Q3\nevidence: quality/evidence/q3.json\nimpact: material contracts need executable oracles\nconclusion: current materials are only partially sufficient\n\n## 综合结论\nsource: decision-log.md#summary\nevidence: quality/evidence/summary.json\nimpact: close states must remain separate\nconclusion: continue with truthful incomplete facts`;

  it("T015 rejects a report without source/evidence/impact/conclusion bindings", () => {
    expect(validateDiagnosticReport("## research-Q1\nconclusion: guessed\n## 综合结论\nconclusion: guessed")).toMatchObject({ ok: false, status: "incomplete" });
    expect(validateDiagnosticReport(report)).toMatchObject({ ok: true, status: "ready", sections: 4 });
  });

  it("T015 rejects flow, phase confirmation, and preflight boundary omissions", () => {
    expect(validateDiagnosticReport(report, {
      required_context: {
        task_id: "task-1",
        material_revision: "rev-1",
        snapshot_tree: "a".repeat(40),
        phase: "build-code",
        confirmation_ref: null,
      },
    })).toMatchObject({ ok: false, errors: expect.arrayContaining(["missing_confirmation_receipt"]) });
  });
});
