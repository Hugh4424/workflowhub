import { describe, expect, it } from "vitest";

import {
  alignCurrentEvidence,
  createTaskProjection,
} from "../workflows/verify-code/design-alignment.mjs";

const HASH = (char) => char.repeat(64);
const TREE = "a".repeat(40);

function binding(artifactKind, id, char) {
  return {
    artifact_kind: artifactKind,
    ref: `specs/demo/${artifactKind}.md`,
    hash: HASH(char),
    id,
  };
}

function taskFixture() {
  const refs = [
    binding("spec", "FR-10", "a"),
    binding("plan", "DEC-04", "b"),
    binding("tasks", "T008", "c"),
  ];
  return {
    task: { id: "T008", versioned_refs: refs },
    selectedRefs: refs,
    acceptedRefs: refs,
  };
}

function alignmentFixture() {
  return {
    acceptedDesign: {
      alignment_id: "FR-15",
      acceptance_criteria: ["AC-08", "AC-15"],
      design_ids: ["FR-10", "FR-15", "DEC-04", "CTRL-04"],
    },
    currentEvidence: {
      snapshot_tree: TREE,
      acceptance_coverage: {
        snapshot_tree: TREE,
        items: [
          { acceptance_criterion_id: "AC-08", status: "covered", evidence_refs: ["evidence/ac-08.json"] },
          { acceptance_criterion_id: "AC-15", status: "covered", evidence_refs: ["evidence/ac-15.json"] },
        ],
      },
      phase_evidence: { snapshot_tree: TREE, ref: "evidence/phase.json" },
      test_evidence: { snapshot_tree: TREE, ref: "receipts/verify-tests.json" },
      review_evidence: { snapshot_tree: TREE, ref: "reviews/results/build-code.json" },
      deviations: [],
    },
  };
}

describe("task context projection", () => {
  it("returns only the task-declared accepted refs and no copied source material", () => {
    const input = taskFixture();
    const result = createTaskProjection(input);

    expect(result).toMatchObject({
      status: "ready",
      task_id: "T008",
      selected_refs: input.selectedRefs,
      gaps: [],
    });
    expect(result).not.toHaveProperty("spec");
    expect(result).not.toHaveProperty("plan");
    expect(result).not.toHaveProperty("tasks");
  });

  it("stops when a task reference is omitted, overwide, or not accepted", () => {
    const input = taskFixture();
    const overwide = binding("evidence", "AC-99", "d");
    const result = createTaskProjection({
      ...input,
      selectedRefs: [input.selectedRefs[0], overwide],
    });

    expect(result.status).toBe("stop");
    expect(result.gaps.map(({ reason }) => reason)).toEqual(expect.arrayContaining([
      "missing_selected_reference",
      "overwide_projection",
      "unaccepted_reference",
    ]));
    expect(result.gaps.every(({ affected_id, recovery }) => affected_id && recovery)).toBe(true);
  });

  it("stops instead of guessing when a versioned reference is incomplete", () => {
    const input = taskFixture();
    const result = createTaskProjection({
      ...input,
      task: { id: "T008", versioned_refs: [{ artifact_kind: "spec", id: "FR-10" }] },
      selectedRefs: [{ artifact_kind: "spec", id: "FR-10" }],
      acceptedRefs: [],
    });

    expect(result.status).toBe("stop");
    expect(result.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ affected_id: "FR-10", reason: "invalid_reference" }),
    ]));
  });

  it("stops when an otherwise complete reference has an invalid authenticated hash", () => {
    const input = taskFixture();
    const invalid = { ...input.selectedRefs[0], hash: "not-a-hash" };
    const result = createTaskProjection({
      task: { id: "T008", versioned_refs: [invalid] },
      selectedRefs: [invalid],
      acceptedRefs: [invalid],
    });

    expect(result.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ affected_id: "FR-10", reason: "invalid_reference" }),
    ]));
  });
});

describe("current design/evidence alignment", () => {
  it("aligns accepted IDs with same-snapshot AC, phase, test, and review evidence", () => {
    const result = alignCurrentEvidence(alignmentFixture());

    expect(result).toMatchObject({ status: "aligned", gaps: [] });
    expect(result.observation).toEqual({
      status: "unknown",
      reason: "formal context observation is unavailable",
    });
  });

  it("names stale, unknown, and missing AC evidence with a recovery condition", () => {
    const input = alignmentFixture();
    input.currentEvidence.acceptance_coverage.snapshot_tree = "b".repeat(40);
    input.currentEvidence.acceptance_coverage.items = [
      { acceptance_criterion_id: "AC-08", status: "unknown", evidence_refs: [] },
    ];
    const result = alignCurrentEvidence(input);

    expect(result.status).toBe("gaps");
    expect(result.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ affected_id: "FR-15", reason: "stale_acceptance_coverage" }),
      expect.objectContaining({ affected_id: "AC-08", reason: "unknown_current_evidence" }),
      expect.objectContaining({ affected_id: "AC-15", reason: "missing_acceptance_coverage" }),
    ]));
    expect(result.gaps.every(({ affected_id, evidence_refs, recovery }) =>
      affected_id && Array.isArray(evidence_refs) && recovery,
    )).toBe(true);
  });

  it("reports a stale current review and an unauthorized DEC/CTRL deviation without rerunning review", () => {
    const input = alignmentFixture();
    input.currentEvidence.review_evidence.snapshot_tree = "b".repeat(40);
    input.currentEvidence.deviations = [
      { design_id: "DEC-04", authorized: false, evidence_refs: ["evidence/deviation.json"] },
      { design_id: "CTRL-04", authorized: false, evidence_refs: [] },
    ];
    const result = alignCurrentEvidence(input);

    expect(result.status).toBe("gaps");
    expect(result.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ affected_id: "FR-15", reason: "stale_current_review_evidence" }),
      expect.objectContaining({ affected_id: "DEC-04", reason: "unauthorized_design_deviation" }),
      expect.objectContaining({ affected_id: "CTRL-04", reason: "unauthorized_design_deviation" }),
    ]));
    expect(result).not.toHaveProperty("review_verdict");
  });

  it("keeps packet/token observation advisory and explicit", () => {
    const input = alignmentFixture();
    input.currentEvidence.context_observation = {
      source: "formal",
      packet_bytes: 320,
      reference_count: 3,
      implementation_tokens: 17,
      rework_reason: "unknown",
      final_defects: "unknown",
      acceptance_failures: 0,
    };

    const result = alignCurrentEvidence(input);
    expect(result.observation).toEqual({
      status: "observed",
      packet_bytes: 320,
      reference_count: 3,
      implementation_tokens: 17,
      rework_reason: "unknown",
      final_defects: "unknown",
      acceptance_failures: 0,
    });
    expect(result).not.toHaveProperty("token_budget");
  });
});
