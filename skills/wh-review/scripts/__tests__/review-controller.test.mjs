import { describe, expect, it } from "vitest";
import { buildNonGateReviewResponseRecord, buildReviewChain, selectReviewRound } from "../review-controller.mjs";

const route = { mode: "adaptive", initial: ["claude-code/opus", "kimi/k3"], closure: ["kimi/coding", "antigravity/flash"] };
const previous = {
  result_ref: "reviews/results/spec.json", verdict: "revise_required", snapshot_tree: "a".repeat(40),
  adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
};
const ledger = {
  version: "wh-review-response-ledger.v1", previous_result_ref: previous.result_ref,
  previous_snapshot_tree: previous.snapshot_tree, current_snapshot_tree: "b".repeat(40),
  responses: [{ finding_id: "F-123456789abc", status: "fixed", rationale: "added the missing evidence", changed_dimensions: [], evidence_refs: ["evidence/fix.json"] }],
};
const structuralRoute = { mode: "full_on_structural_rework", initial: ["claude-code/opus", "kimi/k3"] };

describe("review round controller", () => {
  it("uses closure only for a complete non-material ledger", () => {
    expect(selectReviewRound({ stage: "build-spec", route, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree })).toEqual({ round: "closure", reason: "bounded_non_material_response_ledger" });
    expect(selectReviewRound({ stage: "build-spec", route, previousResult: previous, ledger: { ...ledger, responses: [{ ...ledger.responses[0], changed_dimensions: ["schema"] }] }, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "full", reason: "material_change" });
  });

  it("records ordinary repairs as non-gate audit data and repeats one structural repair in full", () => {
    expect(selectReviewRound({ stage: "build-spec", route: structuralRoute, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({ stage: "build-plan", route: structuralRoute, previousResult: previous, ledger: { ...ledger, responses: [{ ...ledger.responses[0], changed_dimensions: ["schema"] }] }, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "full", reason: "structural_rework" });
    const audit = buildNonGateReviewResponseRecord({ taskId: "task", stage: "build-spec", previousResult: previous, previousResultSha256: "f".repeat(64), ledger, currentSnapshotTree: ledger.current_snapshot_tree });
    expect(audit).toMatchObject({ outcome: "recorded_non_gate_response", evidence_state: "verified", previous_result_ref: previous.result_ref, snapshot_tree: ledger.current_snapshot_tree });
    const unverified = buildNonGateReviewResponseRecord({ taskId: "task", stage: "build-spec", previousResult: previous, previousResultSha256: "f".repeat(64), ledger: { ...ledger, responses: [{ ...ledger.responses[0], status: "rejected_invalid" }] }, currentSnapshotTree: ledger.current_snapshot_tree });
    expect(unverified).toMatchObject({ outcome: "recorded_non_gate_response", evidence_state: "verified" });
  });

  it("keeps absent or invalid response evidence non-blocking and caps structural follow-up at one full review", () => {
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: previous, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(buildNonGateReviewResponseRecord({ taskId: "task", stage: "verify-code", previousResult: previous, previousResultSha256: "f".repeat(64), currentSnapshotTree: ledger.current_snapshot_tree }))
      .toMatchObject({ evidence_state: "unverified", unverified_reason: "no_response_ledger" });
    const structural = { ...previous, review_chain: { round: "full" } };
    expect(selectReviewRound({ stage: "build-plan", route: structuralRoute, previousResult: structural, ledger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "structural_rework_already_reviewed" });
    expect(selectReviewRound({ stage: "build-plan", route: structuralRoute, previousResult: previous, ledger: { ...ledger, responses: [{ ...ledger.responses[0], status: "accepted_risk", accepted_snapshot_tree: ledger.current_snapshot_tree, affected_paths: ["src/a.mjs"] }] }, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it("allows verify-code one structural full re-review but no ordinary re-review", () => {
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    const structuralLedger = { ...ledger, responses: [{ ...ledger.responses[0], changed_dimensions: ["test_strategy"] }] };
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: previous, ledger: structuralLedger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "full", reason: "structural_rework" });
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: { ...previous, review_chain: { round: "full" } }, ledger: structuralLedger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "structural_rework_already_reviewed" });
  });

  it("never sends build-code to closure or stops after repeated full reviews", () => {
    expect(selectReviewRound({ stage: "build-code", route: { mode: "full_only", initial: ["kimi/coding", "codex/terra"] }, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree, noProgressCycles: 0 }))
      .toEqual({ round: "full", reason: "build_code_requires_fresh_full_review" });
    expect(selectReviewRound({ stage: "build-code", route: { mode: "full_only", initial: ["kimi/coding", "codex/terra"] }, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree, noProgressCycles: 2 }))
      .toEqual({ round: "full", reason: "build_code_requires_fresh_full_review" });
  });

  it("expires accepted risk on a changed snapshot", () => {
    const risk = { ...ledger, responses: [{ ...ledger.responses[0], status: "accepted_risk", accepted_snapshot_tree: previous.snapshot_tree, affected_paths: ["src/a.mjs"] }] };
    expect(selectReviewRound({ stage: "build-plan", route, previousResult: previous, ledger: risk, currentSnapshotTree: risk.current_snapshot_tree }))
      .toEqual({ round: "full", reason: "accepted_risk_expired" });
  });

  it("binds the ledger to the previous result, frozen snapshot, and a stable chain hash", () => {
    const chain = buildReviewChain({ previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree, round: "closure" });
    expect(chain).toMatchObject({
      version: "wh-review-chain.v1", parent_result_ref: previous.result_ref,
      root_result_ref: previous.result_ref, prior_snapshot_tree: previous.snapshot_tree,
      current_snapshot_tree: ledger.current_snapshot_tree,
    });
    expect(chain.response_ledger_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(() => buildReviewChain({ previousResult: previous, ledger, currentSnapshotTree: "c".repeat(40), round: "closure" })).toThrow(/current_snapshot_tree/);
  });

  it("rejects a second single-round review even when its prior result needs revision", () => {
    expect(selectReviewRound({ stage: "make-decision", route: { mode: "single_round", initial: ["kimi/k3"] }, previousResult: previous }))
      .toEqual({ round: "none", reason: "single_round_already_completed" });
  });
});
