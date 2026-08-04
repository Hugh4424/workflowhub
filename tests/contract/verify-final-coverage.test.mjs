import { describe, expect, test } from "vitest";

import {
  parseFinalVerificationArgs,
  validateFinalCoverageRequirements,
  validateGovernanceContract,
  validateHandoffBinding,
  validateReferenceClean,
  validateReviewRawHash,
  validateReviewTreeBinding,
} from "../../tools/architecture/verify-final-coverage.mjs";

const validGovernance = {
  constitution: "Version: 1.5.0\n1.5.0（2026-07-28）：F3/F4/F6/F7/F8/F9/Q1/Q2\n### F1 薄核心\n### F2 窄契约",
  checklist: "条目数严格等于宪法条目数（21）。\n- [ ] **F1**\n- [ ] **F2**",
  context: "旧条目到新条目的映射；四材料决定推进；质量事实不作推进许可证；provenance 保留。",
  constitution_ids: ["F1", "F2"],
  checklist_ids: ["F1", "F2"],
};

describe("final coverage failure contracts", () => {
  test("final-coverage:numeric-ac-count-uses-canonical-three-digit-ids", () => {
    const parsed = parseFinalVerificationArgs(["--require-ac=43"]);
    expect(parsed.errors).toEqual([]);
    expect(parsed.required_ac).toHaveLength(43);
    expect(parsed.required_ac[0]).toBe("AC-001");
    expect(parsed.required_ac.at(-1)).toBe("AC-043");
  });

  test("final-coverage:missing-ac", () => {
    expect(validateFinalCoverageRequirements({ coverage: { items: [] }, required_ids: ["AC-01"] }))
      .toContain("missing_ac");
  });

  test("final-coverage:quality-verify-source-required", () => {
    expect(validateFinalCoverageRequirements({
      coverage: { items: [{ acceptance_criterion_id: "AC-01", detail: "observed" }] },
      required_ids: ["AC-01"],
    })).toContain("quality_verify_missing");
  });

  test("final-coverage:ac-evidence-unresolvable", () => {
    expect(validateFinalCoverageRequirements({
      coverage: { items: [{ acceptance_criterion_id: "AC-01", evidence: { ref: "missing.json" } }] },
      required_ids: ["AC-01"],
    })).toContain("ac_evidence_unresolvable");
  });

  test("final-coverage:ac-evidence-generic-fill", () => {
    expect(validateFinalCoverageRequirements({
      coverage: { items: [{ acceptance_criterion_id: "AC-01", evidence: { ref: "evidence/phase-6/test-slice.json" }, detail: "see tests" }] },
      required_ids: ["AC-01"],
    })).toContain("ac_evidence_generic_fill");
  });

  test("final-coverage:review-tree-drift", () => {
    expect(validateReviewTreeBinding({ manifest: { review_tree_hash: "a".repeat(64) }, actual_tree_hash: "b".repeat(64) }))
      .toContain("review_tree_drift");
  });

  test("final-coverage:review-raw-hash-missing", () => {
    expect(validateReviewRawHash({ review: { status: "unavailable" } })).toContain("review_raw_hash_missing");
  });

  test("final-coverage:reference-consumer-residual", () => {
    expect(validateReferenceClean({ violations: [{ path: "runtime/x.mjs" }], allowed_violations: [] }))
      .toContain("reference_consumer_residual");
  });

  test("final-coverage:final-evidence-binding-drift", () => {
    expect(validateHandoffBinding({ artifacts: { deletion_list: { ref: "missing.json", sha256: "0".repeat(64) } } }))
      .toContain("final_evidence_binding_drift");
  });

  test("final-coverage:constitution-version-drift", () => {
    expect(validateGovernanceContract({ ...validGovernance, constitution: validGovernance.constitution.replace("1.5.0", "1.4.0") }))
      .toContain("constitution_version_drift");
  });

  test("final-coverage:constitution-revision-drift", () => {
    expect(validateGovernanceContract({ ...validGovernance, constitution: validGovernance.constitution.replace("2026-07-28", "2026-07-27") }))
      .toContain("constitution_revision_drift");
  });

  test("final-coverage:constitution-mapping-drift", () => {
    expect(validateGovernanceContract({ ...validGovernance, context: "没有旧条目到新条目的对应说明。" }))
      .toContain("constitution_mapping_drift");
  });

  test("final-coverage:agents-governance-drift", () => {
    expect(validateGovernanceContract({ ...validGovernance, agents: "旧规则", require_agents: true }))
      .toContain("agents_material_authority_drift");
  });

  test("final-coverage:checklist-count-drift", () => {
    expect(validateGovernanceContract({ ...validGovernance, checklist: validGovernance.checklist.replace("21", "20") }))
      .toContain("checklist_count_drift");
  });

  test("final-coverage:checklist-entry-drift", () => {
    expect(validateGovernanceContract({ ...validGovernance, checklist_ids: ["F1"] }))
      .toContain("checklist_entry_drift");
  });

  test("final-coverage:handoff-incomplete", () => {
    expect(validateHandoffBinding({ artifacts: {} })).toContain("handoff_incomplete");
  });

  test("final-coverage:unknown-argument", () => {
    expect(parseFinalVerificationArgs(["--governance", "--not-a-real-flag"]).errors)
      .toContain("unknown_argument");
  });
});
