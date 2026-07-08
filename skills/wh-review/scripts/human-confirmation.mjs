/**
 * human-confirmation.mjs — T011b (FR-D2-001)
 *
 * Owns the *approved-state* artifact write path only. This module never writes
 * any "awaiting" file — waiting is expressed entirely by round-state.mjs's
 * `post_review_action=await_human_confirmation` field (round21 fix: path
 * already isolated by stage+review_flow_id). Before a human orchestrator
 * explicitly approves, `human-confirmation-{stage}-{review_flow_id}-{total_round}.json`
 * must not exist on disk.
 *
 * Once approved, `writeHumanConfirmation()` persists exactly the fields spec.md
 * FR-D2-001 defines for this artifact: `approved_by`/`approved_at`/`stage`/
 * `review_flow_id`/`total_round` — deliberately NOT `verdict`/`awaiting_since`,
 * to avoid mixing this artifact's "approved" semantics with round-state's
 * "awaiting" semantics.
 *
 * `readHumanConfirmation()` / `isHumanConfirmed()` are the read-side consumed by
 * T019-T021 stage SKILL.md and T023a's orchestrator-restart recovery logic: the
 * *sole* basis for "approved, safe to advance" is that this artifact exists and
 * its `stage`/`review_flow_id`/`total_round` match the caller's current values
 * (AC8-3: no auto-advance code on the pass path; AC8-4: restart recovery).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import {
  FailLoudError,
  assertSafeTaskId,
  assertSafeReviewFlowId,
  assertKnownStage,
  assertValidTotalRound,
} from "./lib/safe-id.mjs";
import { humanConfirmationPathFor } from "./round-state.mjs";

export { humanConfirmationPathFor };

/**
 * Persist the approved-state artifact. Called only after a human orchestrator
 * has explicitly approved advancing past a `post_review_action=await_human_confirmation`
 * gate. `approvedBy` must be a non-empty string identifying who approved.
 */
export function writeHumanConfirmation({ taskId, stage, reviewFlowId, totalRound, approvedBy, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);
  if (typeof approvedBy !== "string" || approvedBy.trim() === "") {
    throw new FailLoudError(`approvedBy must be a non-empty string (got ${JSON.stringify(approvedBy)})`);
  }

  const root = taskTrackingRoot ?? parseTaskDir();
  const path = humanConfirmationPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });

  // round-review finding: this used to unconditionally writeFileSync, so a second
  // call (e.g. a retry, or two different approvers racing) silently overwrote the
  // approval provenance with no trace of who approved first. This artifact records
  // WHO approved — once written it must be treated like the other immutable
  // baselines in this module set: same approver re-confirming is a harmless no-op
  // (idempotent, returns the original record unchanged), but a conflicting write
  // (different approver, or somehow a different stage/flow/round for the same
  // path) must fail loud rather than silently clobber the original provenance.
  if (existsSync(path)) {
    const existing = JSON.parse(readFileSync(path, "utf8"));
    const matches =
      existing.approved_by === approvedBy &&
      existing.stage === stage &&
      existing.review_flow_id === reviewFlowId &&
      existing.total_round === totalRound;
    if (!matches) {
      throw new FailLoudError(
        `human-confirmation artifact already exists at ${path} approved_by=${JSON.stringify(existing.approved_by)}; refusing to overwrite approval provenance with a conflicting write (approvedBy=${JSON.stringify(approvedBy)})`
      );
    }
    return existing;
  }

  const record = {
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
    stage,
    review_flow_id: reviewFlowId,
    total_round: totalRound,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(record, null, 2));
  return record;
}

/** Raw read of the approved-state artifact, or null if it does not exist yet. */
export function readHumanConfirmation({ taskId, stage, reviewFlowId, totalRound, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const path = humanConfirmationPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * True iff the approved-state artifact exists AND its `stage`/`review_flow_id`/
 * `total_round` all match the caller's current values (the sole "approved,
 * safe to advance" judgment per FR-D2-001 / AC8-3 / AC8-4).
 */
export function isHumanConfirmed({ taskId, stage, reviewFlowId, totalRound, taskTrackingRoot }) {
  const record = readHumanConfirmation({ taskId, stage, reviewFlowId, totalRound, taskTrackingRoot });
  if (!record) return false;
  return record.stage === stage && record.review_flow_id === reviewFlowId && record.total_round === totalRound;
}
