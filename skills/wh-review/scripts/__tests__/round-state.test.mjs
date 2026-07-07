import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  prepareRoundState,
  readRoundState,
  readActiveFlow,
  writeActiveFlow,
  appendHistoryEntry,
  assertTotalRoundConsistent,
  isFlowConcluded,
  recordPathFor,
  humanConfirmationPathFor,
  computePostReviewAction,
  computeFindingFingerprint,
  checkRoundLevelEscalation,
  classifyFindingSeverity,
  recordRoundOutcome,
} from "../round-state.mjs";
import { writeDocSnapshot, writeMaterialsBaseline } from "../snapshot-writer.mjs";

const TASK_ID = "wh-review-rebuild-test";
const STAGE = "build-code";

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "round-state-test-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeRoundStateFixture(reviewFlowId, overrides = {}) {
  const path = recordPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId });
  mkdirSync(join(root, "tasks", TASK_ID, "reviews"), { recursive: true });
  const base = {
    stage: STAGE,
    review_flow_id: reviewFlowId,
    heterologous_round: 1,
    same_source_round: 0,
    total_round: 1,
    mode: "full",
    actual_mode: "full",
    verdict: null,
    report_path: null,
    blocking_count: null,
    fingerprint_repeated: null,
    post_review_action: null,
    finding_fingerprints: [],
    root_cause_diagnoses: [],
    history: [],
  };
  writeFileSync(path, JSON.stringify({ ...base, ...overrides }, null, 2));
}

describe("prepareRoundState — brand new flow", () => {
  it("allocates a new review_flow_id, total_round=1, and a non-empty contract_path when no active flow exists", () => {
    const result = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(result.status).toBe("ready");
    expect(typeof result.review_flow_id).toBe("string");
    expect(result.review_flow_id.length).toBeGreaterThan(0);
    expect(result.total_round).toBe(1);
    expect(typeof result.contract_path).toBe("string");
    expect(result.contract_path.length).toBeGreaterThan(0);
  });

  it("writes the active-flow pointer and an initialized round-state file", () => {
    const result = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const activeFlow = readActiveFlow({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(activeFlow.review_flow_id).toBe(result.review_flow_id);

    const state = readRoundState({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: result.review_flow_id,
      taskTrackingRoot: root,
    });
    expect(state.stage).toBe(STAGE);
    expect(state.heterologous_round).toBe(0);
    expect(state.same_source_round).toBe(0);
    expect(state.total_round).toBe(0);
    expect(state.history).toEqual([]);
  });

  it("publishes the active-flow pointer only after the round-state file is guaranteed written (regression: previously the pointer was published FIRST, so a crash between writes left it dangling)", async () => {
    let roundStateExistedAtRouteDecisionTime = null;
    let activeFlowExistedAtRouteDecisionTime = null;

    vi.resetModules();
    vi.doMock("../route-decision-writer.mjs", async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        writeRoutePreparePhase: (args) => {
          const roundStatePath = join(
            root,
            "tasks",
            TASK_ID,
            "reviews",
            `round-state-${args.stage}-${args.reviewFlowId}.json`
          );
          const activeFlowPath = join(root, "tasks", TASK_ID, "reviews", `active-flow-${args.stage}.json`);
          roundStateExistedAtRouteDecisionTime = existsSync(roundStatePath);
          activeFlowExistedAtRouteDecisionTime = existsSync(activeFlowPath);
          return actual.writeRoutePreparePhase(args);
        },
      };
    });

    try {
      const { prepareRoundState: freshPrepareRoundState } = await import("../round-state.mjs");
      freshPrepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    } finally {
      vi.doUnmock("../route-decision-writer.mjs");
      vi.resetModules();
    }

    expect(roundStateExistedAtRouteDecisionTime).toBe(true);
    expect(activeFlowExistedAtRouteDecisionTime).toBe(false);
  });
});

describe("prepareRoundState — reuse in-progress flow", () => {
  it("reuses the same review_flow_id and increments total_round when verdict=revise_required", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    writeRoundStateFixture(first.review_flow_id, {
      verdict: "revise_required",
      total_round: 1,
      heterologous_round: 1,
    });

    const second = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(second.status).toBe("ready");
    expect(second.review_flow_id).toBe(first.review_flow_id);
    expect(second.total_round).toBe(2);
  });
});

describe("prepareRoundState — concluded flow allocates a new review_flow_id", () => {
  it("allocates a new flow when verdict=escalate_to_human", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    writeRoundStateFixture(first.review_flow_id, { verdict: "escalate_to_human" });

    const second = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(second.status).toBe("ready");
    expect(second.review_flow_id).not.toBe(first.review_flow_id);
    expect(second.total_round).toBe(1);
  });

  it("allocates a new flow when verdict=pass and post_review_action=auto_advance", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    writeRoundStateFixture(first.review_flow_id, { verdict: "pass", post_review_action: "auto_advance" });

    const second = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(second.review_flow_id).not.toBe(first.review_flow_id);
  });

  it("allocates a new flow when verdict=pass, await_human_confirmation, and a matching confirmation artifact exists", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    writeRoundStateFixture(first.review_flow_id, {
      verdict: "pass",
      post_review_action: "await_human_confirmation",
      total_round: 1,
    });
    const hcPath = humanConfirmationPathFor({
      taskTrackingRoot: root,
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: first.review_flow_id,
      totalRound: 1,
    });
    writeFileSync(
      hcPath,
      JSON.stringify({
        approved_by: "tester",
        approved_at: new Date().toISOString(),
        stage: STAGE,
        review_flow_id: first.review_flow_id,
        total_round: 1,
      })
    );

    const second = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(second.review_flow_id).not.toBe(first.review_flow_id);
  });
});

describe("prepareRoundState — pending D2 human-confirmation gate (round27 fix)", () => {
  it("returns blocked_by_human_confirmation without allocating a new flow or advancing total_round, when the confirmation artifact is missing", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    writeRoundStateFixture(first.review_flow_id, {
      verdict: "pass",
      post_review_action: "await_human_confirmation",
      total_round: 1,
    });

    const second = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(second.status).toBe("blocked_by_human_confirmation");
    expect(second.review_flow_id).toBe(first.review_flow_id);
    expect(second.total_round).toBeUndefined();
    expect(second.contract_path).toBeUndefined();
  });

  it("returns blocked_by_human_confirmation when a confirmation artifact exists but its fields don't match", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    writeRoundStateFixture(first.review_flow_id, {
      verdict: "pass",
      post_review_action: "await_human_confirmation",
      total_round: 1,
    });
    const hcPath = humanConfirmationPathFor({
      taskTrackingRoot: root,
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: first.review_flow_id,
      totalRound: 1,
    });
    // total_round mismatch (2 vs the round-state's 1) -> must not count as approved
    writeFileSync(
      hcPath,
      JSON.stringify({ approved_by: "tester", approved_at: "x", stage: STAGE, review_flow_id: first.review_flow_id, total_round: 2 })
    );

    const second = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(second.status).toBe("blocked_by_human_confirmation");
  });
});

describe("prepareRoundState — internal stage/review_flow_id consistency (T023a)", () => {
  it("fail-louds when the round-state file's internal stage does not match the requested stage/pointer", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    // Corrupt the round-state file's internal `stage` field so it disagrees with
    // the active-flow-{STAGE}.json pointer that points at it.
    writeRoundStateFixture(first.review_flow_id, {
      stage: "verify-code",
      total_round: 1,
    });

    expect(() => prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root })).toThrow();
  });

  it("fail-louds when the round-state file's internal review_flow_id does not match the active-flow pointer", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    // Corrupt the round-state file's internal `review_flow_id` field so it
    // disagrees with the active-flow-{STAGE}.json pointer's review_flow_id
    // (same file on disk still resolves via the pointer's id, but its content
    // now lies about which flow it belongs to).
    writeRoundStateFixture(first.review_flow_id, {
      review_flow_id: "some-other-flow-id",
      total_round: 1,
    });

    expect(() => prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root })).toThrow();
  });
});

describe("prepareRoundState — dangling active-flow pointer self-heals (round-review finding)", () => {
  it("allocates a fresh flow instead of throwing when the pointer's review_flow_id has no round-state file", () => {
    // Simulate a dangling pointer: active-flow-{STAGE}.json points at a review_flow_id
    // whose round-state file was never written (or was removed) — no writeRoundStateFixture
    // call for this id.
    writeActiveFlow({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "dangling-flow-id", taskTrackingRoot: root });

    const result = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });

    expect(result.status).toBe("ready");
    expect(result.review_flow_id).not.toBe("dangling-flow-id");
    expect(result.total_round).toBe(1);

    // The stale pointer must have been overwritten to point at the freshly allocated flow.
    const activeFlow = readActiveFlow({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    expect(activeFlow.review_flow_id).toBe(result.review_flow_id);
  });
});

describe("isFlowConcluded", () => {
  it("is false for a fresh in-progress flow (verdict still null)", () => {
    expect(
      isFlowConcluded({
        taskId: TASK_ID,
        stage: STAGE,
        roundState: { verdict: null, post_review_action: null },
        taskTrackingRoot: root,
      })
    ).toBe(false);
  });

  it("is false for verdict=pass alone without post_review_action (round25 fix)", () => {
    expect(
      isFlowConcluded({
        taskId: TASK_ID,
        stage: STAGE,
        roundState: { verdict: "pass", post_review_action: null, review_flow_id: "x", total_round: 1 },
        taskTrackingRoot: root,
      })
    ).toBe(false);
  });
});

describe("assertTotalRoundConsistent", () => {
  it("does not throw when total_round = heterologous_round + same_source_round", () => {
    expect(() => assertTotalRoundConsistent({ heterologous_round: 2, same_source_round: 1, total_round: 3 })).not.toThrow();
  });

  it("throws FailLoudError when the invariant is violated", () => {
    expect(() => assertTotalRoundConsistent({ heterologous_round: 2, same_source_round: 1, total_round: 5 })).toThrow();
  });
});

describe("appendHistoryEntry — monotonic append", () => {
  it("appends new entries without dropping or mutating prior ones", () => {
    const first = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const entryA = { round_type: "heterologous", round_index: 1, total_round: 1, verdict: "revise_required", blocking_count: 2, fingerprint_repeated: false };
    const entryB = { round_type: "heterologous", round_index: 2, total_round: 2, verdict: "pass", blocking_count: 0, fingerprint_repeated: false };

    appendHistoryEntry({ taskId: TASK_ID, stage: STAGE, reviewFlowId: first.review_flow_id, entry: entryA, taskTrackingRoot: root });
    const afterFirst = readRoundState({ taskId: TASK_ID, stage: STAGE, reviewFlowId: first.review_flow_id, taskTrackingRoot: root });
    expect(afterFirst.history).toEqual([entryA]);

    appendHistoryEntry({ taskId: TASK_ID, stage: STAGE, reviewFlowId: first.review_flow_id, entry: entryB, taskTrackingRoot: root });
    const afterSecond = readRoundState({ taskId: TASK_ID, stage: STAGE, reviewFlowId: first.review_flow_id, taskTrackingRoot: root });
    expect(afterSecond.history).toEqual([entryA, entryB]);
  });

  it("fails loud when the round-state file does not exist", () => {
    expect(() =>
      appendHistoryEntry({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "does-not-exist", entry: {}, taskTrackingRoot: root })
    ).toThrow();
  });
});

describe("input validation (fail-loud)", () => {
  it("rejects an unsafe task_id before touching the filesystem", () => {
    expect(() => prepareRoundState({ taskId: "../escape", stage: STAGE, taskTrackingRoot: root })).toThrow();
  });

  it("rejects an unknown stage", () => {
    expect(() => prepareRoundState({ taskId: TASK_ID, stage: "not-a-real-stage", taskTrackingRoot: root })).toThrow();
  });
});

describe("computePostReviewAction (T011a, FR-D2-001, AC8-1/AC8-2)", () => {
  it("returns await_human_confirmation for pass on make-decision/build-plan/verify-code", () => {
    for (const stage of ["make-decision", "build-plan", "verify-code"]) {
      expect(computePostReviewAction({ verdict: "pass", stage })).toBe("await_human_confirmation");
    }
  });

  it("returns auto_advance for pass on build-spec/build-code", () => {
    for (const stage of ["build-spec", "build-code"]) {
      expect(computePostReviewAction({ verdict: "pass", stage })).toBe("auto_advance");
    }
  });

  it("returns null (not applicable) for revise_required/escalate_to_human regardless of stage", () => {
    expect(computePostReviewAction({ verdict: "revise_required", stage: STAGE })).toBeNull();
    expect(computePostReviewAction({ verdict: "escalate_to_human", stage: STAGE })).toBeNull();
  });
});

describe("computeFindingFingerprint", () => {
  it("is stable for the same file+line+category and differs when any of them differ", () => {
    const a = computeFindingFingerprint({ file: "foo.js", line: 10, category: "logic" });
    const aAgain = computeFindingFingerprint({ file: "foo.js", line: 10, category: "logic" });
    const differentLine = computeFindingFingerprint({ file: "foo.js", line: 11, category: "logic" });
    const differentFile = computeFindingFingerprint({ file: "bar.js", line: 10, category: "logic" });
    expect(aAgain).toBe(a);
    expect(differentLine).not.toBe(a);
    expect(differentFile).not.toBe(a);
  });
});

describe("checkRoundLevelEscalation (FR-WHREVIEW-003 round-level signal)", () => {
  it("is false with fewer than 3 same-type history entries (insufficient data)", () => {
    const history = [
      { round_type: "heterologous", round_index: 1, blocking_count: 5 },
      { round_type: "heterologous", round_index: 2, blocking_count: 5 },
    ];
    expect(checkRoundLevelEscalation({ history, roundType: "heterologous" })).toBe(false);
  });

  it("is true when the most recent 3 same-type entries all have blocking_count>=3", () => {
    const history = [
      { round_type: "heterologous", round_index: 1, blocking_count: 3 },
      { round_type: "heterologous", round_index: 2, blocking_count: 4 },
      { round_type: "heterologous", round_index: 3, blocking_count: 3 },
    ];
    expect(checkRoundLevelEscalation({ history, roundType: "heterologous" })).toBe(true);
  });

  it("is false when any of the most recent 3 same-type entries has blocking_count<3", () => {
    const history = [
      { round_type: "heterologous", round_index: 1, blocking_count: 3 },
      { round_type: "heterologous", round_index: 2, blocking_count: 2 },
      { round_type: "heterologous", round_index: 3, blocking_count: 3 },
    ];
    expect(checkRoundLevelEscalation({ history, roundType: "heterologous" })).toBe(false);
  });

  it("filters by round_type independently (same-source entries don't count toward heterologous check)", () => {
    const history = [
      { round_type: "heterologous", round_index: 1, blocking_count: 3 },
      { round_type: "heterologous", round_index: 2, blocking_count: 3 },
      { round_type: "same-source", round_index: 1, blocking_count: 3 },
    ];
    expect(checkRoundLevelEscalation({ history, roundType: "heterologous" })).toBe(false);
  });
});

describe("classifyFindingSeverity (FR-WHREVIEW-005 round2+ downgrade rule)", () => {
  const FLOW = "sev-flow";
  const FINDING = { file: "src/foo.js", line: 5, category: "logic" };

  it("returns not_applicable for total_round=1 regardless of anything else", () => {
    const result = classifyFindingSeverity({
      finding: FINDING, totalRound: 1, existingFingerprints: [], docType: "non-doc",
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
    });
    expect(result.severityDecision).toBe("not_applicable");
    expect(result.isReopened).toBe(false);
  });

  it("returns not_applicable (reopened) when the fingerprint already exists in history, regardless of last_status", () => {
    const fingerprint = computeFindingFingerprint(FINDING);
    const result = classifyFindingSeverity({
      finding: FINDING, totalRound: 2,
      existingFingerprints: [{ finding_fingerprint: fingerprint, last_status: "resolved", severity_decision: "default_downgraded_to_minor" }],
      docType: "non-doc", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
    });
    expect(result.severityDecision).toBe("not_applicable");
    expect(result.isReopened).toBe(true);
  });

  it("returns exception_c_scope_boundary for a true new discovery touching scope boundary", () => {
    const result = classifyFindingSeverity({
      finding: { ...FINDING, touches_scope_boundary: true }, totalRound: 2, existingFingerprints: [],
      docType: "non-doc", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
    });
    expect(result.severityDecision).toBe("exception_c_scope_boundary");
  });

  it("returns default_downgraded_to_minor for a true new discovery with no exception (doc-type, line unchanged since prior snapshot)", () => {
    writeDocSnapshot({ taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1, content: "line1\nline2\nline3\n", taskTrackingRoot: root });
    const result = classifyFindingSeverity({
      finding: { file: "spec.md", line: 2, category: "logic" }, totalRound: 2, existingFingerprints: [],
      docType: "doc", doc: "spec", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
      currentContent: "line1\nline2\nline3\n",
    });
    expect(result.severityDecision).toBe("default_downgraded_to_minor");
  });

  it("returns exception_a_new_change (doc-type) when the finding's line was actually added/changed since the prior snapshot", () => {
    writeDocSnapshot({ taskId: TASK_ID, doc: "plan", reviewFlowId: FLOW, totalRound: 1, content: "line1\nline2\nline3\n", taskTrackingRoot: root });
    const result = classifyFindingSeverity({
      finding: { file: "plan.md", line: 2, category: "logic" }, totalRound: 2, existingFingerprints: [],
      docType: "doc", doc: "plan", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
      currentContent: "line1\nchanged-line2\nline3\n",
    });
    expect(result.severityDecision).toBe("exception_a_new_change");
  });

  it("does NOT return exception_a_new_change when the finding's own line is unchanged, even though the same line text was newly added elsewhere in the doc this round (regression: naive substring-containment match against the diff text, instead of a line-number-aware lookup, wrongly matched the unrelated newly-added occurrence)", () => {
    writeDocSnapshot({ taskId: TASK_ID, doc: "plan", reviewFlowId: FLOW, totalRound: 1, content: "line1\nbug\nline3\n", taskTrackingRoot: root });
    const result = classifyFindingSeverity({
      finding: { file: "plan.md", line: 2, category: "logic" }, totalRound: 2, existingFingerprints: [],
      docType: "doc", doc: "plan", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
      // line 2 ("bug") is unchanged from the prior snapshot; "bug" is also newly added at line 4 this round.
      currentContent: "line1\nbug\nline3\nbug\n",
    });
    expect(result.severityDecision).not.toBe("exception_a_new_change");
    expect(result.severityDecision).toBe("default_downgraded_to_minor");
  });

  it("returns exception_b_undetectable_prior_round (non-doc) when the finding's file was not covered by the prior round baseline at all", () => {
    writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, gitSha: "sha1",
      materialsContent: "diff for other-file.js only", coveredPaths: ["other-file.js"], taskTrackingRoot: root,
    });
    const result = classifyFindingSeverity({
      finding: { file: "brand-new-file.js", line: 3, category: "logic" }, totalRound: 2, existingFingerprints: [],
      docType: "non-doc", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
    });
    expect(result.severityDecision).toBe("exception_b_undetectable_prior_round");
  });

  it("returns exception_a_new_change (non-doc) when the finding's file was covered before but is also in this round's changedPaths", () => {
    writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, gitSha: "sha1",
      materialsContent: "diff for foo.js", coveredPaths: ["foo.js"], taskTrackingRoot: root,
    });
    const result = classifyFindingSeverity({
      finding: { file: "foo.js", line: 3, category: "logic" }, totalRound: 2, existingFingerprints: [],
      docType: "non-doc", taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, taskTrackingRoot: root,
      changedPaths: ["foo.js"],
    });
    expect(result.severityDecision).toBe("exception_a_new_change");
  });

  it("fails loud when the prior-round baseline is missing (never silently defaults to the downgrade rule)", () => {
    expect(() =>
      classifyFindingSeverity({
        finding: FINDING, totalRound: 2, existingFingerprints: [], docType: "non-doc",
        taskId: TASK_ID, stage: STAGE, reviewFlowId: "no-baseline-flow", taskTrackingRoot: root,
      })
    ).toThrow(/not found/);
  });
});

describe("recordRoundOutcome (T011, FR-WHREVIEW-003/005 end-to-end)", () => {
  const FLOW = "outcome-flow";

  function prepFlow() {
    return prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
  }

  it("round1: heterologous_round=1, blocking_count/finding_fingerprints computed, post_review_action set (build-code -> auto_advance)", () => {
    const prep = prepFlow();
    const finding = { file: "foo.js", line: 1, category: "logic", severity: "blocking" };
    const result = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "reviews/report-r1.md",
      rawFindings: [finding], docType: "non-doc",
    });
    expect(result.heterologous_round).toBe(1);
    expect(result.same_source_round).toBe(0);
    expect(result.total_round).toBe(1);
    expect(result.mode).toBe("full");
    expect(result.blocking_count).toBe(1);
    expect(result.post_review_action).toBeNull();
    expect(result.finding_fingerprints).toHaveLength(1);
    expect(result.finding_fingerprints[0].last_status).toBe("open");
    expect(result.finding_fingerprints[0].consecutive_unresolved_rounds).toBe(1);
    expect(result.finding_fingerprints[0].first_seen_round).toBe(1);
    expect(result.history).toHaveLength(1);
  });

  it("AC3-3: 3 consecutive heterologous rounds with blocking_count>=3 escalate at round3 without switching to same-source", () => {
    const prep = prepFlow();
    const findingsFor = (n) => Array.from({ length: 3 }, (_, i) => ({ file: `f${i}.js`, line: i + 1, category: `cat${n}-${i}`, severity: "blocking" }));

    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "r1.md", rawFindings: findingsFor(1), docType: "non-doc",
    });
    // round1's materials baseline (empty covered_paths -> round2's new-category findings are
    // undetectable-prior-round / exception_b, i.e. still blocking, not silently downgraded).
    writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1,
      gitSha: "sha1", materialsContent: "m1", coveredPaths: [], taskTrackingRoot: root,
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r2.md", rawFindings: findingsFor(2), docType: "non-doc",
    });
    writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2,
      gitSha: "sha2", materialsContent: "m2", coveredPaths: [], taskTrackingRoot: root,
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const result = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 3, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r3.md", rawFindings: findingsFor(3), docType: "non-doc",
    });

    expect(result.verdict).toBe("escalate_to_human");
    expect(result.heterologous_round).toBe(3);
    expect(result.same_source_round).toBe(0);
    expect(result.total_round).toBe(3);
  });

  it("AC3-6 (round16/26): a finding recurring for 2 consecutive rounds within the round cap triggers diagnosis+retry, not immediate escalation", () => {
    const prep = prepFlow();
    const finding = { file: "foo.js", line: 1, category: "logic", severity: "blocking" };

    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "r1.md", rawFindings: [finding], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const result = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r2.md", rawFindings: [finding], docType: "non-doc",
    });

    expect(result.verdict).not.toBe("escalate_to_human");
    expect(result.root_cause_diagnoses).toHaveLength(1);
    expect(result.root_cause_diagnoses[0].triggered_round).toBe(2);
    expect(result.root_cause_diagnoses[0].fix_attempt_round).toBe(3);

    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const round3Open = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 3, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r3.md", rawFindings: [finding], docType: "non-doc",
    });
    expect(round3Open.verdict).toBe("escalate_to_human");
    expect(round3Open.root_cause_diagnoses[0].resolved).toBe(false);
  });

  it("AC3-6: the fix-attempt round resolving the recurring finding does not force escalation, and marks the diagnosis resolved=true", () => {
    const prep = prepFlow();
    const finding = { file: "foo.js", line: 1, category: "logic", severity: "blocking" };

    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "r1.md", rawFindings: [finding], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r2.md", rawFindings: [finding], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const round3Resolved = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 3, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "pass", reportPath: "r3.md", rawFindings: [], docType: "non-doc",
    });
    expect(round3Resolved.verdict).toBe("pass");
    expect(round3Resolved.root_cause_diagnoses[0].resolved).toBe(true);
    expect(round3Resolved.finding_fingerprints[0].last_status).toBe("resolved");
  });

  it("escalates immediately (no diagnosis record) when a finding first reaches consecutive_unresolved_rounds=2 exactly at the phase's round hard-cap", () => {
    const prep = prepFlow();
    const finding = { file: "foo.js", line: 1, category: "logic", severity: "blocking" };
    const otherFinding = (n) => ({ file: `unrelated${n}.js`, line: 1, category: "unrelated", severity: "blocking" });

    // round1: unrelated finding only, so `finding` first appears at round2 (not round1).
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "r1.md", rawFindings: [otherFinding(1)], docType: "non-doc",
    });
    // round1's materials baseline (empty covered_paths -> round2's `finding` on foo.js is
    // undetectable-prior-round / exception_b, i.e. still blocking, not silently downgraded).
    writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1,
      gitSha: "sha1", materialsContent: "m1", coveredPaths: [], taskTrackingRoot: root,
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r2.md", rawFindings: [finding], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    // round3 (heterologous hard cap) is where `finding` reaches consecutive_unresolved_rounds=2.
    const result = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 3, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r3.md", rawFindings: [finding], docType: "non-doc",
    });

    expect(result.verdict).toBe("escalate_to_human");
    const findingEntry = result.finding_fingerprints.find((e) => e.finding_fingerprint === computeFindingFingerprint(finding));
    expect(findingEntry.consecutive_unresolved_rounds).toBe(2);
    expect(result.root_cause_diagnoses).toHaveLength(0);
  });

  it("marks a fingerprint resolved when it existed as open but is not returned at all this round (closed/fixed)", () => {
    const prep = prepFlow();
    const finding = { file: "foo.js", line: 1, category: "logic", severity: "blocking" };

    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "r1.md", rawFindings: [finding], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const result = recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "pass", reportPath: "r2.md", rawFindings: [], docType: "non-doc",
    });
    expect(result.finding_fingerprints[0].last_status).toBe("resolved");
    expect(result.finding_fingerprints[0].consecutive_unresolved_rounds).toBe(0);
  });

  it("post_review_action reflects await_human_confirmation for a make-decision pass verdict", () => {
    const prep = prepareRoundState({ taskId: TASK_ID, stage: "make-decision", taskTrackingRoot: root });
    const result = recordRoundOutcome({
      taskId: TASK_ID, stage: "make-decision", reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "pass", reportPath: "r1.md", rawFindings: [], docType: "non-doc",
    });
    expect(result.post_review_action).toBe("await_human_confirmation");
  });

  it("switches mode to same-source after the heterologous hard-cap is reached without escalation", () => {
    const prep = prepFlow();
    // 3 heterologous rounds that must each keep a genuinely open blocking finding
    // (round-review fix: verdict is now renormalized to "pass" whenever effective
    // blocking_count is 0, so a 0-finding revise_required round no longer stays
    // "in progress" — it correctly concludes as pass). Each round uses a distinct
    // scope-boundary finding (exception_c, never downgraded) on a distinct
    // file/fingerprint so blocking_count stays 1 (never >=3, no round-level
    // escalation) and no single fingerprint repeats across rounds (never reaches
    // the consecutive_unresolved_rounds threshold, no finding-level escalation).
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 1, taskTrackingRoot: root,
      actualMode: "full", verdict: "revise_required", reportPath: "r1.md",
      rawFindings: [{ file: "a.js", line: 1, category: "x", severity: "blocking" }], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 2, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r2.md",
      rawFindings: [{ file: "b.js", line: 1, category: "y", severity: "blocking", touches_scope_boundary: true }], docType: "non-doc",
    });
    prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    recordRoundOutcome({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: prep.review_flow_id, totalRound: 3, taskTrackingRoot: root,
      actualMode: "incremental", verdict: "revise_required", reportPath: "r3.md",
      rawFindings: [{ file: "c.js", line: 1, category: "z", severity: "blocking", touches_scope_boundary: true }], docType: "non-doc",
    });
    const next = prepareRoundState({ taskId: TASK_ID, stage: STAGE, taskTrackingRoot: root });
    const state = readRoundState({ taskId: TASK_ID, stage: STAGE, reviewFlowId: next.review_flow_id, taskTrackingRoot: root });
    expect(state.mode).toBe("same-source");
  });
});
