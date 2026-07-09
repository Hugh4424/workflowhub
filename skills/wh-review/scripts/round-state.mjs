/**
 * round-state.mjs — T010 (FR-WHREVIEW-003)
 *
 * Owns the per-{stage,review_flow_id} round-state file
 * (`tasks/{task-id}/reviews/round-state-{stage}-{review_flow_id}.json`, Contract 4) and the
 * per-stage active-flow pointer (`tasks/{task-id}/reviews/active-flow-{stage}.json`).
 *
 * This file implements the T010 slice only:
 *  - `prepareRoundState()`: the "prepare" half of FR-WHREVIEW-007's two-phase protocol —
 *    decides whether to reuse the stage's currently active review_flow_id or allocate a new
 *    one (concurrency rule, Contract 4 附属), computes the next `total_round`, and returns
 *    the four-field `{status:"ready", review_flow_id, total_round, contract_path}` contract
 *    or the two-field `{status:"blocked_by_human_confirmation", review_flow_id}` short-circuit
 *    when a D2 human-confirmation gate is still pending (round27 fix).
 *  - `isFlowConcluded()`: the "flow already ended" judgment (round25 fix — `verdict=pass`
 *    alone is NOT enough; must be paired with `post_review_action` and, for the
 *    await_human_confirmation branch, a matching human-confirmation artifact).
 *  - `appendHistoryEntry()` / `assertTotalRoundConsistent()`: the monotonic-history and
 *    total_round=heterologous_round+same_source_round invariants used by this task and by
 *    the degrade/escalate logic landing in T011/T011a.
 *  - `computePostReviewAction()` (T011a, FR-D2-001): pass→await_human_confirmation for
 *    make-decision/build-plan/verify-code, pass→auto_advance for build-spec/build-code,
 *    revise_required/escalate_to_human→null.
 *  - `prepareRoundState()` also now decides and persists `mode` for the upcoming round
 *    (T011, FR-WHREVIEW-003 mode-transition rule): round 1 of a fresh flow → "full";
 *    reused flow with heterologous_round < 3 → "incremental"; heterologous_round === 3
 *    (cap reached, not yet escalated) → "same-source" (sticky once switched).
 *  - `recordRoundOutcome()` (T011, FR-WHREVIEW-003/005): consumes one round's raw
 *    `{verdict, findings, actual_mode}` from invoke-review-engine.mjs, classifies every
 *    raw blocking finding's severity per FR-WHREVIEW-005 (default downgrade to minor for
 *    "true new discoveries" from total_round>=2, exceptions (a)/(b)/(c) keep it blocking,
 *    "reopened historical findings" are not_applicable/keep original severity), updates
 *    `finding_fingerprints`/`root_cause_diagnoses`/`history`, evaluates FR-WHREVIEW-003's
 *    round-level (3 consecutive same-type rounds blocking_count>=3) and finding-level
 *    (fingerprint reaches consecutive_unresolved_rounds=2, diagnosis+retry within the
 *    phase's round hard-cap, direct escalate at the hard cap) escalation signals, and
 *    writes every field back to the round-state file.
 *
 * human-confirmation artifact *writing* (T011b) is explicitly OUT of scope for this file —
 * this file only reads a human-confirmation artifact if one already exists, it never writes
 * one.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import { loadConfig } from "../../../core/load-config.mjs";
import {
  FailLoudError,
  assertSafeTaskId,
  assertSafeReviewFlowId,
  assertKnownStage,
  assertValidTotalRound,
  taskRoot,
} from "./lib/safe-id.mjs";
import { writeRoutePreparePhase } from "./route-decision-writer.mjs";
import { computeDocSnapshotDiff, readMaterialsBaseline } from "./snapshot-writer.mjs";
import { recordSkeleton, updateOwnResult, configForCollector } from "../../../metrics/collector.mjs";

// ---- T024: metrics/collector.mjs integration (rounds/duration/escalation feed the metrics pipeline) ----
// FR-GUARD-001 mirror: a metrics call must never interrupt round-state's own read/write flow, so
// every call site below is wrapped in try/catch with a warn-only fallback.

function metricsExecutionId({ taskId, stage, reviewFlowId, totalRound }) {
  return `${taskId}:${stage}:${reviewFlowId}:round${totalRound}`;
}

// round-review finding (真实异源审查 codex, cfe72075-301a-4e81-b464-7137e9f90ece, blocking):
// this previously (a) hardcoded the global metrics_path literal instead of reading
// config.metrics_path via loadConfig() (spec.md §6.5 AC-METRICS-2 / collector.mjs's own
// contract), and (b) passed taskTrackingRoot straight through as configForCollector's
// taskDir instead of the per-task directory — task-level metrics landed at
// <taskTrackingRoot>/task-metrics.jsonl instead of tasks/{task-id}/task-metrics.jsonl.
function metricsConfigFor({ taskId, taskTrackingRoot }) {
  return configForCollector(loadConfig(), {
    taskDir: taskRoot(taskTrackingRoot, taskId),
    taskId,
    project: "workflowhub",
  });
}

function warnMetricsFailure(err) {
  console.warn(`[round-state] metrics call failed: ${err && err.message ? err.message : err}`);
}

// ---- path builders ----

function reviewsDir({ taskTrackingRoot, taskId }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews");
}

export function recordPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId }) {
  return join(reviewsDir({ taskTrackingRoot, taskId }), `round-state-${stage}-${reviewFlowId}.json`);
}

export function activeFlowPathFor({ taskTrackingRoot, taskId, stage }) {
  return join(reviewsDir({ taskTrackingRoot, taskId }), `active-flow-${stage}.json`);
}

export function humanConfirmationPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound }) {
  return join(
    reviewsDir({ taskTrackingRoot, taskId }),
    `human-confirmation-${stage}-${reviewFlowId}-${totalRound}.json`
  );
}

/**
 * Write `content` to `path` via temp-file+rename so a crash mid-write never leaves a
 * truncated/corrupt file at `path` — either the old content is still there, or the full new
 * content is (round-review finding: allocateNewFlow's artifacts must be safe to crash on).
 */
function atomicWriteFileSync(path, content) {
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  const tmpPath = join(dir, `.${basename(path)}.tmp-${randomUUID()}`);
  writeFileSync(tmpPath, content);
  renameSync(tmpPath, path);
}

// ---- active-flow pointer ----

/** Read the active-flow pointer for {taskId, stage}, or null if none exists yet. */
export function readActiveFlow({ taskId, stage, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = activeFlowPathFor({ taskTrackingRoot: root, taskId, stage });
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Write (overwrite) the active-flow pointer for {taskId, stage}. */
export function writeActiveFlow({ taskId, stage, reviewFlowId, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = activeFlowPathFor({ taskTrackingRoot: root, taskId, stage });
  const record = { review_flow_id: reviewFlowId, updated_at: new Date().toISOString() };
  atomicWriteFileSync(path, JSON.stringify(record, null, 2));
  return record;
}

// ---- round-state file ----

/** Read the round-state file for {taskId, stage, reviewFlowId}, or null if it doesn't exist. */
export function readRoundState({ taskId, stage, reviewFlowId, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Create a brand-new round-state file for a freshly allocated review_flow_id.
 * Only the fields owned by "flow creation" are populated; verdict/report_path/blocking_count/
 * fingerprint_repeated/post_review_action/mode/actual_mode stay null until T010a/T011/T011a
 * write them back after the first round actually runs.
 */
function initializeRoundState({ taskId, stage, reviewFlowId, taskTrackingRoot }) {
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });
  const record = {
    stage,
    review_flow_id: reviewFlowId,
    heterologous_round: 0,
    same_source_round: 0,
    total_round: 0,
    mode: null,
    actual_mode: null,
    verdict: null,
    report_path: null,
    blocking_count: null,
    fingerprint_repeated: null,
    post_review_action: null,
    finding_fingerprints: [],
    root_cause_diagnoses: [],
    history: [],
  };
  atomicWriteFileSync(path, JSON.stringify(record, null, 2));
  return record;
}

/**
 * Append one snapshot entry to a round-state file's `history` array, in place, without ever
 * mutating or dropping prior entries (monotonic append — "history 数组随轮次单调追加不缩短").
 * Fails loud if the round-state file or its history array does not exist.
 */
export function appendHistoryEntry({ taskId, stage, reviewFlowId, entry, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });
  if (!existsSync(path)) {
    throw new FailLoudError(`no round-state file found at ${path}; cannot append history to a non-existent flow`);
  }
  const state = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(state.history)) {
    throw new FailLoudError(`round-state file at ${path} is missing its history array`);
  }
  state.history = [...state.history, entry];
  writeFileSync(path, JSON.stringify(state, null, 2));
  return state;
}

/**
 * Assert the Contract 4 invariant `total_round = heterologous_round + same_source_round`.
 * Throws FailLoudError if violated.
 */
export function assertTotalRoundConsistent(state) {
  const expected = (state.heterologous_round ?? 0) + (state.same_source_round ?? 0);
  if (state.total_round !== expected) {
    throw new FailLoudError(
      `total_round (${state.total_round}) !== heterologous_round + same_source_round (${expected})`
    );
  }
}

// ---- human-confirmation artifact (read-only from this file's perspective; T011b owns writes) ----

function readHumanConfirmationArtifact(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

// ---- "flow already ended" judgment (Contract 4 附属，round25/round27 fix) ----

/**
 * True only when the flow at `roundState` has definitively ended and a new review_flow_id may
 * be allocated on the next prepare() call. `verdict=pass` alone is never sufficient (round25).
 */
export function isFlowConcluded({ taskId, stage, roundState, taskTrackingRoot }) {
  if (!roundState) return false;
  if (roundState.verdict === "escalate_to_human") return true;
  if (roundState.verdict === "pass" && roundState.post_review_action === "auto_advance") return true;
  if (roundState.verdict === "pass" && roundState.post_review_action === "await_human_confirmation") {
    const root = taskTrackingRoot ?? parseTaskDir();
    const hcPath = humanConfirmationPathFor({
      taskTrackingRoot: root,
      taskId,
      stage,
      reviewFlowId: roundState.review_flow_id,
      totalRound: roundState.total_round,
    });
    const hc = readHumanConfirmationArtifact(hcPath);
    return !!(
      hc &&
      hc.stage === stage &&
      hc.review_flow_id === roundState.review_flow_id &&
      hc.total_round === roundState.total_round
    );
  }
  return false;
}

/** True when the flow is `pass` + `await_human_confirmation` and the gate is still pending. */
function isBlockedOnHumanConfirmation({ taskId, stage, roundState, taskTrackingRoot }) {
  if (!(roundState.verdict === "pass" && roundState.post_review_action === "await_human_confirmation")) {
    return false;
  }
  const root = taskTrackingRoot ?? parseTaskDir();
  const hcPath = humanConfirmationPathFor({
    taskTrackingRoot: root,
    taskId,
    stage,
    reviewFlowId: roundState.review_flow_id,
    totalRound: roundState.total_round,
  });
  const hc = readHumanConfirmationArtifact(hcPath);
  const matches =
    hc && hc.stage === stage && hc.review_flow_id === roundState.review_flow_id && hc.total_round === roundState.total_round;
  return !matches;
}

function generateReviewFlowId() {
  return randomUUID();
}

/**
 * Allocate a brand-new review_flow_id and its artifacts. round-review finding: this used to
 * publish the active-flow-{stage}.json pointer FIRST, before the round-state/route-decision
 * records were guaranteed written — a crash between writes left a dangling active-flow pointer
 * (pointing at a review_flow_id with no/partial round-state). Fixed: write every new-flow
 * artifact first (each via atomic temp-file+rename, see initializeRoundState/writeRoundStateMode/
 * writeActiveFlow), and only publish the active-flow pointer last, as the commit point — if a
 * crash happens before that final write, no pointer exists yet and the next prepare() call
 * allocates cleanly, leaving at most an orphaned (never-referenced) round-state file behind.
 */
function allocateNewFlow({ taskId, stage, taskTrackingRoot, metricsCfg }) {
  const newFlowId = generateReviewFlowId();
  initializeRoundState({ taskId, stage, reviewFlowId: newFlowId, taskTrackingRoot });
  // T011 (FR-WHREVIEW-003 mode-transition rule): round 1 of a brand new flow is always "full".
  writeRoundStateMode({ taskId, stage, reviewFlowId: newFlowId, mode: "full", taskTrackingRoot });
  const { record } = writeRoutePreparePhase({
    taskId,
    stage,
    reviewFlowId: newFlowId,
    totalRound: 1,
    taskTrackingRoot,
  });
  // Commit point: only once every other new-flow artifact is guaranteed written.
  writeActiveFlow({ taskId, stage, reviewFlowId: newFlowId, taskTrackingRoot });
  // round-review finding (真实异源审查 codex, cfe72075-301a-4e81-b464-7137e9f90ece round-4, blocking):
  // metricsConfigFor() (and its loadConfig() call) no longer runs here at all — a static config
  // parse/validation error is fail-loud (F8) and must fire BEFORE any of this function's writes
  // above, not after. prepareRoundState() now computes metricsCfg once, up front (before
  // readActiveFlow), and passes it in via this parameter; only the recordSkeleton() call itself
  // (the actual metrics write) stays warn-only.
  try {
    recordSkeleton(
      {
        execution_id: metricsExecutionId({ taskId, stage, reviewFlowId: newFlowId, totalRound: 1 }),
        skill_or_stage: "wh-review",
        stage,
        rework_rounds: 1,
      },
      metricsCfg
    );
  } catch (err) {
    warnMetricsFailure(err);
  }
  return { status: "ready", review_flow_id: newFlowId, total_round: 1, contract_path: record.contract_path };
}

/**
 * Phase 1 — prepare (FR-WHREVIEW-007 step 1). Decides review_flow_id reuse vs allocation and
 * the next total_round, per the Contract 4 附属 concurrency rule.
 *
 * @returns {{status:"ready", review_flow_id:string, total_round:number, contract_path:string}
 *          |{status:"blocked_by_human_confirmation", review_flow_id:string}}
 */
export function prepareRoundState({ taskId, stage, taskTrackingRoot } = {}) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  const root = taskTrackingRoot ?? parseTaskDir();
  // round-review finding (真实异源审查 codex, cfe72075-301a-4e81-b464-7137e9f90ece round-4,
  // blocking): metricsConfigFor()'s loadConfig() call must run BEFORE any read/write below
  // (readActiveFlow onward) — a static config parse/validation error is fail-loud (F8) and must
  // never let this function partially write state (round-state file / active-flow pointer)
  // before it surfaces. Computed once here and threaded through to allocateNewFlow() and the
  // reused-flow metrics call below so neither of them calls metricsConfigFor() a second time.
  const metricsCfg = metricsConfigFor({ taskId, taskTrackingRoot: root });

  const activeFlow = readActiveFlow({ taskId, stage, taskTrackingRoot: root });

  if (!activeFlow) {
    return allocateNewFlow({ taskId, stage, taskTrackingRoot: root, metricsCfg });
  }

  const existingState = readRoundState({
    taskId,
    stage,
    reviewFlowId: activeFlow.review_flow_id,
    taskTrackingRoot: root,
  });

  if (!existingState) {
    // round-review finding: a dangling active-flow pointer (pointing at a review_flow_id
    // whose round-state file is missing/incomplete) is a recoverable state, not fatal
    // corruption — it can legitimately occur if the round-state file was ever removed, or
    // never finished writing, while the pointer itself survived. Self-heal by treating this
    // exactly like "no active flow" (see the !activeFlow branch above): allocateNewFlow()
    // atomically overwrites the stale pointer with a freshly allocated flow, so no explicit
    // cleanup of the old pointer file is needed here.
    return allocateNewFlow({ taskId, stage, taskTrackingRoot: root, metricsCfg });
  }

  // T023a (AC8-4, restart-recovery hardening): the round-state file's own internal
  // `stage`/`review_flow_id` fields must agree with the active-flow pointer that
  // led us here (and with the requested stage). A mismatch means the pointer and
  // the on-disk round-state file have drifted apart (e.g. stale/corrupted state
  // after an interrupted write, or a copy/paste mistake) — fail loud rather than
  // silently operating on the wrong flow's data.
  if (existingState.stage !== stage) {
    throw new FailLoudError(
      `round-state file at review_flow_id=${activeFlow.review_flow_id} has internal stage=${JSON.stringify(existingState.stage)} which does not match the requested stage=${JSON.stringify(stage)} (active-flow-${stage}.json pointer); refusing to proceed`
    );
  }
  if (existingState.review_flow_id !== activeFlow.review_flow_id) {
    throw new FailLoudError(
      `round-state file has internal review_flow_id=${JSON.stringify(existingState.review_flow_id)} which does not match the active-flow-${stage}.json pointer's review_flow_id=${JSON.stringify(activeFlow.review_flow_id)}; refusing to proceed`
    );
  }

  if (isFlowConcluded({ taskId, stage, roundState: existingState, taskTrackingRoot: root })) {
    return allocateNewFlow({ taskId, stage, taskTrackingRoot: root, metricsCfg });
  }

  if (isBlockedOnHumanConfirmation({ taskId, stage, roundState: existingState, taskTrackingRoot: root })) {
    return { status: "blocked_by_human_confirmation", review_flow_id: existingState.review_flow_id };
  }

  // Still in progress (verdict not yet terminal, or revise_required): reuse the flow, advance
  // to the next round.
  const nextTotalRound = existingState.total_round + 1;
  // T011 (FR-WHREVIEW-003 mode-transition rule): heterologous_round<cap -> "incremental";
  // cap reached (not yet escalated, else isFlowConcluded above would have allocated a new
  // flow) -> "same-source" (sticky once switched, never reverts).
  const nextMode = computeModeForNextRound(existingState);
  writeRoundStateMode({
    taskId,
    stage,
    reviewFlowId: activeFlow.review_flow_id,
    mode: nextMode,
    taskTrackingRoot: root,
  });
  // round-review finding: route-decision's own input_mode must agree with the mode actually
  // decided above for this round, not silently default to "full" for round2+ incremental /
  // same-source rounds (Contract 3 input_mode is an audit field, must reflect reality).
  const { record } = writeRoutePreparePhase({
    taskId,
    stage,
    reviewFlowId: activeFlow.review_flow_id,
    totalRound: nextTotalRound,
    inputMode: nextMode,
    taskTrackingRoot: root,
  });
  // round-4 fix: metricsCfg was already computed at the top of prepareRoundState() (before
  // readActiveFlow), so this reused-flow branch reuses it instead of calling
  // metricsConfigFor() a second time. Only the recordSkeleton() call itself (the actual
  // metrics write) is warn-only.
  try {
    recordSkeleton(
      {
        execution_id: metricsExecutionId({
          taskId,
          stage,
          reviewFlowId: activeFlow.review_flow_id,
          totalRound: nextTotalRound,
        }),
        skill_or_stage: "wh-review",
        stage,
        rework_rounds: nextTotalRound,
      },
      metricsCfg
    );
  } catch (err) {
    warnMetricsFailure(err);
  }
  return {
    status: "ready",
    review_flow_id: activeFlow.review_flow_id,
    total_round: nextTotalRound,
    contract_path: record.contract_path,
  };
}

// ---- T011 mode-transition helper (round-trip patch of just the `mode` field) ----

const HETEROLOGOUS_ROUND_CAP = 3;
const SAME_SOURCE_ROUND_CAP = 3;
const ROUND_LEVEL_BLOCKING_THRESHOLD = 3;
const FINGERPRINT_CONSECUTIVE_UNRESOLVED_THRESHOLD = 2;

function computeModeForNextRound(existingState) {
  if (existingState.heterologous_round < HETEROLOGOUS_ROUND_CAP) return "incremental";
  return "same-source";
}

function writeRoundStateMode({ taskId, stage, reviewFlowId, mode, taskTrackingRoot }) {
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });
  const state = JSON.parse(readFileSync(path, "utf8"));
  state.mode = mode;
  // T024: stamp the start time of the round about to run so recordRoundOutcome can compute duration_ms.
  state.round_started_at = Date.now();
  atomicWriteFileSync(path, JSON.stringify(state, null, 2));
}

// ---- T011a: post_review_action (FR-D2-001) ----

const AWAIT_HUMAN_CONFIRMATION_STAGES = new Set(["make-decision", "build-plan", "verify-code"]);
const AUTO_ADVANCE_STAGES = new Set(["build-spec", "build-code"]);

/**
 * post_review_action assignment rule (FR-D2-001, AC8-1/AC8-2): only applicable when
 * verdict="pass" — revise_required/escalate_to_human always yield null (field not
 * applicable, left blank/absent per spec, never a placeholder string).
 */
export function computePostReviewAction({ verdict, stage }) {
  if (verdict !== "pass") return null;
  assertKnownStage(stage);
  if (AWAIT_HUMAN_CONFIRMATION_STAGES.has(stage)) return "await_human_confirmation";
  if (AUTO_ADVANCE_STAGES.has(stage)) return "auto_advance";
  throw new FailLoudError(`stage ${JSON.stringify(stage)} has no post_review_action mapping (FR-D2-001)`);
}

// ---- T011: finding fingerprint + FR-WHREVIEW-005 severity classification ----

/**
 * Stable fingerprint for one finding: hash of its location (file+line) + category, wording
 * independent (data-contracts.md Contract 4 `finding_fingerprints[].finding_fingerprint`).
 */
export function computeFindingFingerprint({ file, line, category }) {
  return createHash("sha256").update(`${file}\u0000${line}\u0000${category}`).digest("hex");
}

/**
 * Round-level escalation signal (FR-WHREVIEW-003): true only when the most recent 3
 * same-`roundType` history entries all have blocking_count>=3. Fewer than 3 same-type
 * entries in history is "insufficient data", never treated as satisfied (never falsely
 * assume satisfied per the task's explicit implementation note).
 */
export function checkRoundLevelEscalation({ history, roundType }) {
  const sameType = history
    .filter((entry) => entry.round_type === roundType)
    .sort((a, b) => a.round_index - b.round_index);
  if (sameType.length < 3) return false;
  return sameType.slice(-3).every((entry) => entry.blocking_count >= ROUND_LEVEL_BLOCKING_THRESHOLD);
}

/**
 * Line-number-aware lookup into a `unifiedTextDiff()` output: true only when the diff line
 * that lands at `targetNewIndex` (0-based index into the *new* text's lines, i.e. `currentContent`)
 * is itself a "+ " (added) line — never a naive substring/text-containment match against the
 * whole diff, which would wrongly match an unrelated line elsewhere in the doc that happens to
 * share the same text as a newly-added line (round-review finding).
 *
 * Walks the diff top-to-bottom tracking the position in the new text: "  " (context) and "+ "
 * (added) lines each consume one new-text position; "- " (removed) lines consume none.
 */
function wasLineNewlyAddedAtIndex(diffText, targetNewIndex) {
  const diffLines = diffText.split("\n");
  let newIndex = 0;
  for (const diffLine of diffLines) {
    const marker = diffLine.slice(0, 2);
    if (marker === "- ") continue;
    if (newIndex === targetNewIndex) return marker === "+ ";
    newIndex++;
  }
  return false;
}

/**
 * FR-WHREVIEW-005 severity classification for one raw blocking finding.
 *
 * `total_round<2`, or the finding's fingerprint already appears anywhere in this flow's
 * `finding_fingerprints` history (a "reopened historical finding" — regardless of whether
 * its current `last_status` is resolved/open or its `severity_decision` was previously
 * default-downgraded) — the round2+ downgrade rule does not apply; returns "not_applicable"
 * (original severity is kept, never downgraded).
 *
 * Otherwise ("true new discovery"): exception (c) scope-boundary findings are never
 * downgraded; exceptions (a)/(b) are decided by reading the actual prior-round materials
 * baseline (never by subjective impression, per FR-WHREVIEW-005/006 — missing baseline is
 * fail-loud via computeDocSnapshotDiff/readMaterialsBaseline, never silently skipped);
 * anything else defaults to "default_downgraded_to_minor".
 */
export function classifyFindingSeverity({
  finding,
  totalRound,
  existingFingerprints,
  docType,
  doc,
  taskId,
  stage,
  reviewFlowId,
  taskTrackingRoot,
  currentContent,
  changedPaths,
}) {
  const fingerprint = computeFindingFingerprint(finding);
  const isReopened = existingFingerprints.some((entry) => entry.finding_fingerprint === fingerprint);

  if (totalRound < 2 || isReopened) {
    return { fingerprint, severityDecision: "not_applicable", isReopened };
  }

  if (finding.touches_scope_boundary) {
    return { fingerprint, severityDecision: "exception_c_scope_boundary", isReopened: false };
  }

  if (docType === "doc") {
    const diff = computeDocSnapshotDiff({
      taskId,
      doc,
      reviewFlowId,
      totalRound,
      currentContent,
      taskTrackingRoot,
    });
    const currentLines = currentContent.split("\n");
    const lineExists = finding.line >= 1 && finding.line <= currentLines.length;
    if (lineExists && wasLineNewlyAddedAtIndex(diff, finding.line - 1)) {
      return { fingerprint, severityDecision: "exception_a_new_change", isReopened: false };
    }
  } else {
    const priorBaseline = readMaterialsBaseline({
      taskId,
      stage,
      reviewFlowId,
      totalRound: totalRound - 1,
      taskTrackingRoot,
    });
    // round-review finding: covered_paths is only a declared-scope metadata list — a file can
    // be listed there while the actual submitted materials text never shows that file's
    // content (e.g. truncated/partial dump). Checking covered_paths alone risks wrongly
    // treating an actually-invisible finding as "was visible last round" and default-downgrading
    // it. Require the prior round's real materialsContent to literally reference the file too.
    const wasActuallyVisible =
      priorBaseline.covered_paths.includes(finding.file) && priorBaseline.materialsContent.includes(finding.file);
    if (!wasActuallyVisible) {
      return { fingerprint, severityDecision: "exception_b_undetectable_prior_round", isReopened: false };
    }
    if (Array.isArray(changedPaths) && changedPaths.includes(finding.file)) {
      return { fingerprint, severityDecision: "exception_a_new_change", isReopened: false };
    }
  }

  return { fingerprint, severityDecision: "default_downgraded_to_minor", isReopened: false };
}

/**
 * Record one round's outcome into the round-state file (T011, FR-WHREVIEW-003/005): applies
 * severity classification to every raw blocking finding, updates `finding_fingerprints`
 * (open/resolved/newly-seen), computes this round's `blocking_count` (downgraded findings
 * excluded) and `fingerprint_repeated`, appends a `history` snapshot, evaluates round-level
 * and finding-level escalation (with the diagnosis+retry-within-hard-cap branching), computes
 * `post_review_action` (T011a), and writes every field back to
 * `round-state-{stage}-{review_flow_id}.json` (Contract 4). `mode` for this round is read
 * from the state file itself (already decided by `prepareRoundState()`), not re-derived here.
 */
export function recordRoundOutcome({
  taskId,
  stage,
  reviewFlowId,
  totalRound,
  taskTrackingRoot,
  actualMode,
  verdict,
  reportPath,
  rawFindings,
  docType,
  doc,
  currentContent,
  changedPaths,
}) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  // round-review finding (真实异源审查 codex, cfe72075-301a-4e81-b464-7137e9f90ece round-4,
  // blocking): metricsConfigFor()'s loadConfig() call must run before this function's own
  // state read/write below — a static config parse/validation error is fail-loud (F8) and
  // must fire before the round-state file is ever rewritten, not after (previously this ran
  // right before the warn-only metrics write at the very end, well after
  // writeFileSync(path, ...) had already landed the new round's outcome on disk).
  const metricsCfg = metricsConfigFor({ taskId, taskTrackingRoot: root });

  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });
  const state = readRoundState({ taskId, stage, reviewFlowId, taskTrackingRoot: root });
  if (!state) {
    throw new FailLoudError(`round-state file not found at ${path}; cannot record outcome for a non-existent flow`);
  }

  const mode = state.mode;
  // round-review finding: this used to treat ANY non-"same-source" value
  // (including a corrupted/partially-written null/unknown mode) as
  // "heterologous" by default — silently masking state-file corruption
  // instead of failing loud, which could then corrupt heterologous_round/
  // total_round/escalation/history bookkeeping downstream.
  if (mode !== "full" && mode !== "incremental" && mode !== "same-source") {
    throw new FailLoudError(
      `round-state at ${path} has invalid mode ${JSON.stringify(mode)}; expected "full", "incremental", or "same-source"`
    );
  }
  const roundType = mode === "same-source" ? "same-source" : "heterologous";
  const heterologousRound = roundType === "heterologous" ? state.heterologous_round + 1 : state.heterologous_round;
  const sameSourceRound = roundType === "same-source" ? state.same_source_round + 1 : state.same_source_round;
  if (heterologousRound + sameSourceRound !== totalRound) {
    throw new FailLoudError(
      `totalRound (${totalRound}) !== heterologous_round+same_source_round after this round (${heterologousRound + sameSourceRound})`
    );
  }
  const roundIndex = roundType === "heterologous" ? heterologousRound : sameSourceRound;
  const hardCap = roundType === "heterologous" ? HETEROLOGOUS_ROUND_CAP : SAME_SOURCE_ROUND_CAP;

  // ---- classify every raw finding, update finding_fingerprints ----
  const existingFingerprints = state.finding_fingerprints ?? [];
  const rootCauseDiagnoses = [...(state.root_cause_diagnoses ?? [])];
  const seenFingerprints = new Set();
  const updatedByFingerprint = new Map(existingFingerprints.map((entry) => [entry.finding_fingerprint, { ...entry }]));
  let blockingCount = 0;

  // Only findings the engine itself marked "blocking" enter FR-WHREVIEW-005
  // downgrade judging / finding_fingerprints tracking (spec.md FR-WHREVIEW-003:
  // "本轮 3rd-review 原始返回的全部 blocking finding" — engine-side "minor"
  // findings are out of scope for this loop and must never inflate
  // blocking_count or be written as fingerprint entries).
  const blockingRawFindings = (rawFindings ?? []).filter((finding) => finding.severity === "blocking");

  for (const finding of blockingRawFindings) {
    const { fingerprint, severityDecision } = classifyFindingSeverity({
      finding,
      totalRound,
      existingFingerprints,
      docType,
      doc,
      taskId,
      stage,
      reviewFlowId,
      taskTrackingRoot: root,
      currentContent,
      changedPaths,
    });
    seenFingerprints.add(fingerprint);
    const isBlockingAfterDowngrade = severityDecision !== "default_downgraded_to_minor";
    if (isBlockingAfterDowngrade) blockingCount += 1;

    const existing = updatedByFingerprint.get(fingerprint);
    const firstSeenRound = existing ? existing.first_seen_round : totalRound;
    const consecutiveUnresolvedRounds = isBlockingAfterDowngrade
      ? existing
        ? existing.consecutive_unresolved_rounds + 1
        : 1
      : 0;
    updatedByFingerprint.set(fingerprint, {
      finding_fingerprint: fingerprint,
      file: finding.file ?? (existing ? existing.file : null),
      line: finding.line ?? (existing ? existing.line : null),
      category: finding.category ?? (existing ? existing.category : null),
      first_seen_round: firstSeenRound,
      consecutive_unresolved_rounds: consecutiveUnresolvedRounds,
      last_status: isBlockingAfterDowngrade ? "open" : "resolved",
      diagnosed: existing ? existing.diagnosed : false,
      severity_decision: severityDecision,
    });
  }
  // fingerprints that existed before but were not returned at all this round: closed (resolved).
  for (const [fingerprint, entry] of updatedByFingerprint) {
    if (!seenFingerprints.has(fingerprint) && entry.last_status === "open") {
      updatedByFingerprint.set(fingerprint, { ...entry, last_status: "resolved", consecutive_unresolved_rounds: 0 });
    }
  }
  const findingFingerprints = [...updatedByFingerprint.values()];

  // ---- fingerprint_repeated: this round's open set === the set that was open going in ----
  const priorOpenSet = new Set(
    existingFingerprints.filter((entry) => entry.last_status === "open").map((entry) => entry.finding_fingerprint)
  );
  const newOpenSet = new Set(
    findingFingerprints.filter((entry) => entry.last_status === "open").map((entry) => entry.finding_fingerprint)
  );
  const fingerprintRepeated =
    totalRound >= 2 &&
    priorOpenSet.size > 0 &&
    priorOpenSet.size === newOpenSet.size &&
    [...priorOpenSet].every((fp) => newOpenSet.has(fp));

  // ---- finding-level escalation: fingerprints newly reaching the threshold this round ----
  let findingLevelEscalate = false;
  for (const entry of findingFingerprints) {
    if (entry.last_status !== "open" || entry.consecutive_unresolved_rounds !== FINGERPRINT_CONSECUTIVE_UNRESOLVED_THRESHOLD) {
      continue;
    }
    if (entry.diagnosed) continue; // already diagnosed in an earlier round; settled below instead
    if (roundIndex === hardCap) {
      findingLevelEscalate = true;
    } else {
      rootCauseDiagnoses.push({
        finding_fingerprint: entry.finding_fingerprint,
        triggered_round: roundIndex,
        diagnosis: "recurring finding at consecutive_unresolved_rounds=2; targeted fix attempt required",
        category: "other",
        fix_attempt_round: roundIndex + 1,
        resolved: false,
      });
      entry.diagnosed = true;
    }
  }
  // settle any pending diagnosis whose fix_attempt_round is this round
  for (const diagnosis of rootCauseDiagnoses) {
    if (diagnosis.fix_attempt_round !== roundIndex) continue;
    const entry = findingFingerprints.find((e) => e.finding_fingerprint === diagnosis.finding_fingerprint);
    if (!entry) continue;
    if (entry.last_status === "open") {
      diagnosis.resolved = false;
      findingLevelEscalate = true;
    } else {
      diagnosis.resolved = true;
    }
  }

  // ---- round-level escalation (history entry appended first, per the spec's evaluation order) ----
  const historyEntry = {
    round_type: roundType,
    round_index: roundIndex,
    total_round: totalRound,
    verdict,
    blocking_count: blockingCount,
    fingerprint_repeated: fingerprintRepeated,
  };
  const history = [...(state.history ?? []), historyEntry];
  const roundLevelEscalate = checkRoundLevelEscalation({ history, roundType });

  // round-review finding (FR-WHREVIEW-005): a round whose raw 3rd-review verdict
  // was revise_required but whose only blocking findings were all
  // default-downgraded to minor must not stay stuck revise_required — downgrading
  // to minor is defined to not block a pass. Recompute the base verdict from the
  // *effective* (post-downgrade) blocking_count before applying escalation rules —
  // symmetrically: a raw "pass" that still has effective blocking findings open
  // (e.g. a runner reporting pass while findings weren't actually all resolved/
  // downgraded) must not be trusted as pass either. escalate_to_human is a
  // terminal engine-level decision independent of blocking_count and is left as-is.
  const normalizedVerdict =
    verdict === "escalate_to_human" ? verdict : blockingCount === 0 ? "pass" : "revise_required";

  // round-review finding (FR-WHREVIEW-003): same-source mode has a hard round cap —
  // once same_source_round reaches the cap without a pass, the flow must be forced
  // to escalate_to_human here, or prepareRoundState would keep letting it spin into
  // a 4th+ same-source round with no exit.
  const sameSourceHardCapHit =
    roundType === "same-source" && sameSourceRound === SAME_SOURCE_ROUND_CAP && normalizedVerdict !== "pass";

  // Priority rule: escalation is checked first; only escalate short-circuits to
  // escalate_to_human regardless of 3rd-review's own verdict for this round.
  const finalVerdict =
    roundLevelEscalate || findingLevelEscalate || sameSourceHardCapHit ? "escalate_to_human" : normalizedVerdict;
  const postReviewAction = computePostReviewAction({ verdict: finalVerdict, stage });

  const nextState = {
    ...state,
    heterologous_round: heterologousRound,
    same_source_round: sameSourceRound,
    total_round: totalRound,
    mode,
    actual_mode: actualMode,
    verdict: finalVerdict,
    report_path: reportPath,
    blocking_count: blockingCount,
    fingerprint_repeated: fingerprintRepeated,
    post_review_action: postReviewAction,
    finding_fingerprints: findingFingerprints,
    root_cause_diagnoses: rootCauseDiagnoses,
    history,
  };
  assertTotalRoundConsistent(nextState);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(nextState, null, 2));
  // round-4 fix: metricsCfg was already computed at the top of this function (before the
  // round-state file was read/rewritten), so it is reused here instead of calling
  // metricsConfigFor() a second time. Only the metrics write itself is warn-only.
  try {
    const durationMs = Date.now() - (state.round_started_at ?? Date.now());
    updateOwnResult(
      metricsExecutionId({ taskId, stage, reviewFlowId, totalRound }),
      {
        duration_ms: durationMs,
        rework_rounds: totalRound,
        human_intervention: finalVerdict === "escalate_to_human",
      },
      metricsCfg
    );
  } catch (err) {
    warnMetricsFailure(err);
  }
  return nextState;
}
