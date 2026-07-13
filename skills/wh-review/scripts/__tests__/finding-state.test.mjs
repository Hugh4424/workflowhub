import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  reconcileFindingState,
  isBlocking,
  mergeCrossStageCarryovers,
  aggregateMakeDecisionTracks,
  validateClosureBundle,
} from "../finding-state.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");

const finding = (id, severity = "blocking", extra = {}) => ({
  finding_id: id, file: "src/a.mjs", line: 1, rule_id: "H1", severity,
  issue: `issue ${id}`, evidence: "packet evidence", suggested_fix: "fix", ...extra,
});

describe("finding continuation state", () => {
  it("preserves an unclosed blocking finding and increments its streak", () => {
    const result = reconcileFindingState({
      previousFindings: [finding("a")], currentFindings: [], closureEvidence: [], businessRound: 2,
    });
    expect(result.findings[0]).toMatchObject({ finding_id: "a", severity: "blocking", status: "open", blocking_streak: 2 });
    expect(result.requires_closure_bundle).toBe(true);
    expect(result.escalate_to_human).toBe(false);
  });

  it("escalates an unchanged blocking finding on the third round", () => {
    const result = reconcileFindingState({
      previousFindings: [{ ...finding("a"), blocking_streak: 2 }], currentFindings: [], closureEvidence: [], businessRound: 3,
    });
    expect(result.escalate_to_human).toBe(true);
    expect(result.findings[0].blocking_streak).toBe(3);
  });

  it("marks closure evidence closed and downgrades late blocking findings", () => {
    const result = reconcileFindingState({
      previousFindings: [finding("a")], currentFindings: [finding("b", "blocking")],
      closureEvidence: [{ finding_id: "a", evidence: "fixed in delta" }], businessRound: 2,
      introducedBlockingIds: new Set(),
    });
    expect(result.findings.find((item) => item.finding_id === "a")).toMatchObject({ status: "closed", blocking_streak: 0 });
    expect(result.findings.find((item) => item.finding_id === "b")).toMatchObject({ severity: "minor", late_finding: true, status: "open" });
    expect(result.open_blocking).toHaveLength(0);
  });

  it("does not hard-gate a late finding even when its rule is a contract hard invariant", () => {
    expect(isBlocking({ ...finding("late", "minor"), late_finding: true }, new Set(["H1"]))).toBe(false);
  });

  it("never gives an external H99 minor finding a blocking streak, closure bundle, or third-round escalation", () => {
    const contractHardIds = new Set(["H1", "H2", "H3"]);
    let state = reconcileFindingState({
      previousFindings: [], currentFindings: [finding("external", "minor", { rule_id: "H99" })], businessRound: 1,
      introducedBlockingIds: new Set(["external"]), contractHardIds,
    });
    state = reconcileFindingState({ previousFindings: state.findings, currentFindings: [], businessRound: 2, contractHardIds });
    state = reconcileFindingState({ previousFindings: state.findings, currentFindings: [], businessRound: 3, contractHardIds });
    expect(state.findings).toEqual([expect.objectContaining({ finding_id: "external", rule_id: "H99", severity: "minor", blocking_streak: 0, status: "open" })]);
    expect(state.open_blocking).toEqual([]);
    expect(state.requires_closure_bundle).toBe(false);
    expect(state.escalate_to_human).toBe(false);
  });

  it("requires an anchored current-delta closure bundle after two open blocking rounds", () => {
    const old = { ...finding("a"), blocking_streak: 2 };
    const delta = {
      unified_diff: "diff --git a/src/a.mjs b/src/a.mjs\n+@@ -1 +1 @@\n-old\n+fixed\n",
      changed_files: [{ path: "src/a.mjs", status: "modified", sha256: "a".repeat(64), size: 6 }],
    };
    const plainText = validateClosureBundle({ finding: old, closure: { finding_id: "a", evidence: "fixed" }, delta });
    expect(plainText).toMatchObject({ valid: false, reason: "CLOSURE_BUNDLE_REQUIRED" });

    const valid = validateClosureBundle({ finding: old, closure: {
      finding_id: "a", evidence: "src/a.mjs:1 now persists before publication",
      closure_bundle: {
        version: 1,
        root_cause: "publication occurred before durable persistence",
        scanned_scope: ["src/a.mjs"],
        counterexample_matrix: [{ case_id: "write-failure", expected: "no publication", observed: "no publication" }],
        closure_checklist: [{ item: "persistence precedes publication", evidence: "src/a.mjs:1" }],
        anchors: [{ file: "src/a.mjs", line: 1, sha256: "a".repeat(64) }],
        current_delta: { diff_sha256: hash(delta.unified_diff), changed_files: [{ path: "src/a.mjs", sha256: "a".repeat(64) }] },
      },
    }, delta });
    expect(valid).toEqual({ valid: true, reason: null });
  });
});

describe("cross-stage carryover", () => {
  it("keeps open carryovers, applies current closure, and preserves provenance", () => {
    const result = mergeCrossStageCarryovers(
      [{ carryover_id: "x", source_stage: "build-spec", status: "open", evidence: "old" }],
      [{ carryover_id: "x", source_stage: "build-spec", status: "closed", evidence: "verified" }, { carryover_id: "y", source_stage: "build-plan", status: "open", evidence: "new" }],
    );
    expect(result).toEqual([
      { carryover_id: "x", source_stage: "build-spec", status: "closed", evidence: "verified" },
      { carryover_id: "y", source_stage: "build-plan", status: "open", evidence: "new" },
    ]);
  });
});

describe("make-decision track aggregation", () => {
  it("does not let detail pass override direction hard gate", () => {
    const result = aggregateMakeDecisionTracks({
      direction: { semantic_verdict: "revise_required", hard_gates: [finding("d", "blocking")], merged_findings: [finding("d")] },
      detail: { semantic_verdict: "pass", hard_gates: [], merged_findings: [] },
    });
    expect(result.semantic_verdict).toBe("revise_required");
    expect(result.needs_human).toBe(false);
    expect(result.findings).toHaveLength(1);
  });

  it("escalates conflicting direction/detail verdicts and preserves both evidence sets", () => {
    const result = aggregateMakeDecisionTracks({
      direction: { semantic_verdict: "pass", hard_gates: [], merged_findings: [{ ...finding("d", "important"), evidence: "direction" }] },
      detail: { semantic_verdict: "revise_required", hard_gates: [], merged_findings: [{ ...finding("d", "important"), evidence: "detail" }] },
    });
    expect(result.semantic_verdict).toBe("escalate_to_human");
    expect(result.needs_human).toBe(true);
    expect(result.findings[0].evidence_by_track).toEqual(expect.arrayContaining([
      { track: "direction", evidence: "direction" }, { track: "detail", evidence: "detail" },
    ]));
  });
});
