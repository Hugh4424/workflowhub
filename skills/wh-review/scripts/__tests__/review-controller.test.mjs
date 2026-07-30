import { describe, expect, it } from "vitest";
import { buildNonGateReviewResponseRecord, buildReviewChain, deriveChangeClassification, selectReviewRound } from "../review-controller.mjs";

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
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    const audit = buildNonGateReviewResponseRecord({ taskId: "task", stage: "build-spec", previousResult: previous, previousResultSha256: "f".repeat(64), ledger, currentSnapshotTree: ledger.current_snapshot_tree });
    expect(audit).toMatchObject({ outcome: "recorded_non_gate_response", evidence_state: "verified", previous_result_ref: previous.result_ref, snapshot_tree: ledger.current_snapshot_tree });
    const unverified = buildNonGateReviewResponseRecord({ taskId: "task", stage: "build-spec", previousResult: previous, previousResultSha256: "f".repeat(64), ledger: { ...ledger, responses: [{ ...ledger.responses[0], status: "rejected_invalid" }] }, currentSnapshotTree: ledger.current_snapshot_tree });
    expect(unverified).toMatchObject({ outcome: "recorded_non_gate_response", evidence_state: "verified" });
  });

  it("records a passed review's ordinary delta without a provider and allows one structural full review", () => {
    const passed = {
      ...previous,
      verdict: "pass",
      adjudication: { clusters: [] },
    };
    const ordinaryDelta = {
      version: "wh-review-response-ledger.v1",
      previous_result_ref: passed.result_ref,
      previous_snapshot_tree: passed.snapshot_tree,
      current_snapshot_tree: ledger.current_snapshot_tree,
      change: {
        changed_dimensions: [],
        rationale: "clarified wording without changing the contract",
        evidence_refs: ["evidence/fix.json"],
      },
      responses: [],
    };
    expect(selectReviewRound({
      stage: "build-spec", route: structuralRoute, previousResult: passed,
      ledger: ordinaryDelta, currentSnapshotTree: ordinaryDelta.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(buildNonGateReviewResponseRecord({
      taskId: "task", stage: "build-spec", previousResult: passed,
      previousResultSha256: "f".repeat(64), ledger: ordinaryDelta,
      currentSnapshotTree: ordinaryDelta.current_snapshot_tree,
    })).toMatchObject({
      evidence_state: "verified",
      response_ledger: { change: { changed_dimensions: [] }, responses: [] },
    });

    const structuralDelta = {
      ...ordinaryDelta,
      change: { ...ordinaryDelta.change, changed_dimensions: ["schema"] },
    };
    expect(selectReviewRound({
      stage: "build-spec", route: structuralRoute, previousResult: passed,
      ledger: structuralDelta, currentSnapshotTree: structuralDelta.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({
      stage: "build-spec", route: structuralRoute, previousResult: passed,
      ledger: structuralDelta, currentSnapshotTree: structuralDelta.current_snapshot_tree,
      structuralFullAlreadyRecorded: true,
    })).toEqual({ round: "none", reason: "post_full_non_gate_recorded" });
  });

  it("keeps absent or invalid response evidence non-blocking and caps structural follow-up at one full review", () => {
    for (const stage of ["build-spec", "build-plan", "verify-code"]) {
      expect(selectReviewRound({ stage, route: structuralRoute, previousResult: previous, currentSnapshotTree: ledger.current_snapshot_tree }))
        .toEqual({ round: "none", reason: "review_non_gate_recorded" });
      expect(buildNonGateReviewResponseRecord({ taskId: "task", stage, previousResult: previous, previousResultSha256: "f".repeat(64), currentSnapshotTree: ledger.current_snapshot_tree }))
        .toMatchObject({ evidence_state: "unverified", unverified_reason: "no_response_ledger" });
    }
    const structural = { ...previous, review_chain: { round: "full" } };
    expect(selectReviewRound({ stage: "build-plan", route: structuralRoute, previousResult: structural, ledger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({ stage: "build-plan", route: structuralRoute, previousResult: previous, ledger: { ...ledger, responses: [{ ...ledger.responses[0], status: "accepted_risk", accepted_snapshot_tree: ledger.current_snapshot_tree, affected_paths: ["src/a.mjs"] }] }, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it("allows verify-code one structural full re-review but no ordinary re-review", () => {
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    const structuralLedger = { ...ledger, responses: [{ ...ledger.responses[0], changed_dimensions: ["test_strategy"] }] };
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: previous, ledger: structuralLedger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({ stage: "verify-code", route: structuralRoute, previousResult: { ...previous, review_chain: { round: "full" } }, ledger: structuralLedger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "post_full_non_gate_recorded" });
  });

  it("records one complete review per frozen build-code Phase identity", () => {
    expect(selectReviewRound({ stage: "build-code", route: { mode: "full_only", initial: ["kimi/coding", "codex/terra"] }, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree, noProgressCycles: 0 }))
      .toEqual({ round: "none", reason: "phase_quality_fact_recorded" });
    expect(selectReviewRound({ stage: "build-code", route: { mode: "full_only", initial: ["kimi/coding", "codex/terra"] }, previousResult: previous, ledger, currentSnapshotTree: ledger.current_snapshot_tree, noProgressCycles: 2 }))
      .toEqual({ round: "none", reason: "phase_quality_fact_recorded" });
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

  it("records a zero-provider resolution after a single-round result needs revision", () => {
    expect(selectReviewRound({
      stage: "make-decision",
      route: { mode: "single_round", initial: ["kimi/k3"] },
      previousResult: previous,
      ledger,
      currentSnapshotTree: ledger.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({
      stage: "make-decision",
      route: { mode: "single_round", initial: ["kimi/k3"] },
      previousResult: previous,
      ledger: null,
      currentSnapshotTree: previous.snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    const resolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage: "make-decision", reviewTrack: "direction",
      previousResult: previous, previousResultSha256: "f".repeat(64),
      ledger, currentSnapshotTree: ledger.current_snapshot_tree,
    });
    expect(resolution, "ORACLE-REVIEW: repair appends a focused resolution without another provider").toMatchObject({
      outcome: "recorded_non_gate_response",
      previous_verdict: "revise_required",
      provider_calls: 0,
      evidence_state: "verified",
    });
    expect(resolution).not.toHaveProperty("verdict", "pass");
  });

  it("rejects a self-reported replay that differs from authenticated prior evidence", () => {
    const prior = {
      ...previous,
      task_id: "task", stage: "build-spec", review_track: null,
      attempt_ref: "reviews/attempts/prior/attempt.json",
      adjudication: {
        clusters: [{
          id: "F-123456789abc", disposition: "actionable",
          provider_findings: [{ evidence_anchor_valid: true }],
        }],
      },
    };
    const attempt = {
      task_id: "task", stage: "build-spec", review_track: null, terminal_status: "semantic",
      review_policy: { requested_profiles: ["pi/k3", "cursor/grok"] },
    };
    const replayLedger = {
      ...ledger,
      responses: [{
        ...ledger.responses[0],
        replay: {
          previous_result_ref: previous.result_ref,
          finding_id: "F-123456789abc",
          requested_profiles: ["pi/k3", "forged/provider"],
          evidence_anchor_valid: true,
        },
      }],
    };
    expect(() => buildNonGateReviewResponseRecord({
      taskId: "task", stage: "build-spec", previousResult: prior, previousAttempt: attempt,
      previousResultSha256: "f".repeat(64), ledger: replayLedger,
      currentSnapshotTree: ledger.current_snapshot_tree,
    })).toThrow(/REPLAY_MISMATCH/);
  });

  it("keeps a passing single-round result closed", () => {
    expect(selectReviewRound({
      stage: "make-decision",
      route: { mode: "single_round", initial: ["kimi/k3"] },
      previousResult: { ...previous, verdict: "pass" },
      currentSnapshotTree: previous.snapshot_tree,
    })).toEqual({ round: "none", reason: "single_round_already_completed" });
    expect(selectReviewRound({
      stage: "make-decision",
      route: { mode: "single_round", initial: ["kimi/k3"] },
      previousResult: { ...previous, verdict: "pass" },
      ledger,
      currentSnapshotTree: ledger.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it("derives structural change only from frozen material manifests and ignores caller dimension claims", () => {
    const ordinary = deriveChangeClassification({
      previousSnapshotTree: "a".repeat(40),
      currentSnapshotTree: "b".repeat(40),
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "notes", category: "explanation", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "notes", category: "explanation", sha256: "2".repeat(64) }] },
    });
    const structural = deriveChangeClassification({
      previousSnapshotTree: "a".repeat(40),
      currentSnapshotTree: "b".repeat(40),
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "结构", category: "schema", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "结构", category: "schema", sha256: "2".repeat(64) }] },
    });
    expect(ordinary).toMatchObject({ structural: false, changed_dimensions: [] });
    expect(structural).toMatchObject({ structural: true, changed_dimensions: ["schema"] });
    expect(() => selectReviewRound({
      stage: "build-spec", route: structuralRoute, previousResult: previous,
      ledger: null, currentSnapshotTree: ledger.current_snapshot_tree,
      changeClassification: structural,
    })).toThrow(/structural.*ledger|ledger.*structural/i);
    expect(selectReviewRound({
      stage: "build-spec", route: structuralRoute, previousResult: previous,
      ledger: { ...ledger, responses: [{ ...ledger.responses[0], changed_dimensions: ["schema"] }] },
      currentSnapshotTree: ledger.current_snapshot_tree, changeClassification: ordinary,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it("lets make-decision record ordinary deltas, perform one structural full, then record another ordinary delta", () => {
    const ordinary = deriveChangeClassification({
      previousSnapshotTree: previous.snapshot_tree,
      currentSnapshotTree: ledger.current_snapshot_tree,
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "说明", category: "explanation", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "说明", category: "explanation", sha256: "2".repeat(64) }] },
    });
    const structural = deriveChangeClassification({
      previousSnapshotTree: previous.snapshot_tree,
      currentSnapshotTree: ledger.current_snapshot_tree,
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "决策", category: "decision", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "决策", category: "decision", sha256: "2".repeat(64) }] },
    });
    expect(selectReviewRound({
      stage: "make-decision", route: structuralRoute, previousResult: previous, ledger,
      currentSnapshotTree: ledger.current_snapshot_tree, changeClassification: ordinary,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({
      stage: "make-decision", route: structuralRoute, previousResult: previous, ledger,
      currentSnapshotTree: ledger.current_snapshot_tree, changeClassification: structural,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({
      stage: "make-decision", route: structuralRoute,
      previousResult: { ...previous, review_chain: { round: "full" } }, ledger,
      currentSnapshotTree: ledger.current_snapshot_tree, changeClassification: ordinary,
      structuralFullAlreadyRecorded: true,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it("records a complete post-full structural ledger but rejects missing or partial ledgers", () => {
    const postFull = {
      ...previous,
      review_chain: { round: "full" },
      adjudication: { clusters: [
        { id: "F-123456789abc", disposition: "actionable" },
        { id: "F-abcdef123456", disposition: "actionable" },
      ] },
    };
    const completeLedger = {
      ...ledger,
      responses: [
        ledger.responses[0],
        {
          finding_id: "F-abcdef123456", status: "accepted_risk",
          rationale: "historical evidence cannot be reconstructed",
          changed_dimensions: [], evidence_refs: [],
          accepted_snapshot_tree: ledger.current_snapshot_tree,
          affected_paths: ["specs/feature/spec.md"],
        },
      ],
    };
    const structural = deriveChangeClassification({
      previousSnapshotTree: previous.snapshot_tree,
      currentSnapshotTree: ledger.current_snapshot_tree,
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "spec", category: "contract", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "spec", category: "contract", sha256: "2".repeat(64) }] },
    });
    expect(selectReviewRound({
      stage: "build-spec", route: structuralRoute, previousResult: postFull, ledger: completeLedger,
      currentSnapshotTree: ledger.current_snapshot_tree, changeClassification: structural,
      structuralFullAlreadyRecorded: true,
    })).toEqual({ round: "none", reason: "post_full_non_gate_recorded" });
    for (const invalidLedger of [null, { ...completeLedger, responses: completeLedger.responses.slice(0, 1) }, {
      ...ledger,
      responses: [{ ...ledger.responses[0], finding_id: "F-ffffffffffff" }],
    }]) {
      expect(() => selectReviewRound({
        stage: "build-spec", route: structuralRoute, previousResult: postFull, ledger: invalidLedger,
        currentSnapshotTree: ledger.current_snapshot_tree, changeClassification: structural,
        structuralFullAlreadyRecorded: true,
      })).toThrow(/ledger|finding/i);
    }
    expect(selectReviewRound({
      stage: "build-code", route: { mode: "full_only", initial: ["kimi/coding"] },
      previousResult: postFull, ledger: completeLedger, currentSnapshotTree: ledger.current_snapshot_tree,
      changeClassification: structural, structuralFullAlreadyRecorded: true,
    })).toEqual({ round: "none", reason: "phase_quality_fact_recorded" });
  });
});
