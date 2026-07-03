/**
 * core/audit-aggregator.mjs
 *
 * Audit counting — pure functions, no I/O.
 * Uses the LATEST-exit view for counting final step outcomes.
 * Consumes receipt_write_warn events that carry original_exit_payload so that
 * a write failure never silently drops a step from the count.
 */

import { AUDIT_SUMMARY_FIELDS, JOURNAL_EVENT_TYPES } from "./journal-schema.mjs";
import { discoverChainStepIds, firstByStepId } from "./chain-topology.mjs";

const STAGE_SLUGS = new Set(["bs", "bp", "bc", "vc", "md"]);

function isStageStepId(stepId, stageSlug) {
  return typeof stepId === "string" && stepId.startsWith(`${stageSlug}.`);
}

function assertEnum(value, allowed, name) {
  if (!allowed.has(value)) {
    throw new TypeError(`${name} must be one of: ${Array.from(allowed).join(", ")}`);
  }
}

function assertNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

// ---- public exports ----

/**
 * Build a Map keyed by step_id from the latest occurrence of each exit event.
 * Used exclusively for counting (not for topology discovery).
 *
 * @param {object[]} events
 * @returns {Map<string, object>}
 */
export function latestByStepId(events) {
  const map = new Map();
  for (const event of events) {
    map.set(event.step_id, event);
  }
  return map;
}

/**
 * Build a Map keyed by `${step_id}::${journal_entry_id}` from the latest
 * occurrence of each (step_id, journal_entry_id) pair.
 * Reserved for future fine-grained attempt-level counting.
 *
 * @param {object[]} exitEvents
 * @returns {Map<string, object>}
 */
export function latestByStepAndEntry(exitEvents) {
  const map = new Map();
  for (const event of exitEvents) {
    const entryId = event.exit_journal_entry_id ?? event.step_id;
    const key = `${event.step_id}::${entryId}`;
    map.set(key, event);
  }
  return map;
}

/**
 * Build the full audit_summary from all journal events for a given run+stage.
 *
 * - Topology discovery uses firstByStepId (chain-topology module).
 * - Counting uses latestByStepId (latest-exit view).
 * - receipt_write_warn events carrying original_exit_payload are treated as
 *   virtual STEP_EXIT events so write failures never silently drop a step count.
 *
 * @param {object[]} events - All parsed journal.jsonl events
 * @param {string} stageSlug
 * @param {string} workflowRunId
 * @returns {{ audit_summary: object, warnings: string[] }}
 */
export function buildAuditSummaryFromJournalEvents(events, stageSlug, workflowRunId) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }
  assertEnum(stageSlug, STAGE_SLUGS, "stageSlug");
  assertNonEmptyString(workflowRunId, "workflowRunId");

  const sameRun = (event) => event?.workflow_run_id === workflowRunId;
  const sameStageStep = (stepId) => isStageStepId(stepId, stageSlug);

  const entryEvents = events.filter(
    (event) =>
      event?.event_type === JOURNAL_EVENT_TYPES.STEP_ENTRY && sameRun(event) && sameStageStep(event.step_id),
  );

  const exitEvents = events.filter(
    (event) =>
      event?.event_type === JOURNAL_EVENT_TYPES.STEP_EXIT && sameRun(event) && sameStageStep(event.step_id),
  );

  // Recover virtual exit events from receipt_write_warn events that carry original_exit_payload.
  // These fill in for STEP_EXIT events that failed to write (non-blocking write path).
  // Normal write takes priority: only use warn payload if no real exit exists for this step.
  const warnExitEvents = [];
  for (const event of events) {
    if (event?.event !== "receipt_write_warn") continue;
    if (!sameRun(event)) continue;
    const payload = event.original_exit_payload;
    if (!payload || !sameStageStep(payload.step_id)) continue;
    // Check if a real STEP_EXIT already exists for this step — if so, prefer it.
    const alreadyHasRealExit = exitEvents.some((e) => e.step_id === payload.step_id);
    if (!alreadyHasRealExit) {
      warnExitEvents.push(payload);
    }
  }

  const effectiveExitEvents = [...exitEvents, ...warnExitEvents];

  // Topology uses FIRST exit so retry attempts don't alter the visible chain.
  const firstExitByStepId = firstByStepId(effectiveExitEvents);
  const { stepIds, warnings } = discoverChainStepIds(entryEvents, firstExitByStepId, stageSlug);
  const reachable = new Set(stepIds);

  // Counting uses LATEST exit so retried steps reflect most-recent outcome.
  const latestReachableEntries = latestByStepId(entryEvents.filter((e) => reachable.has(e.step_id)));
  const latestExitByStepId = latestByStepId(effectiveExitEvents.filter((e) => reachable.has(e.step_id)));

  let passed_step_count = 0;
  let blocked_step_count = 0;
  let skipped_step_count = 0;

  for (const stepId of stepIds) {
    const entry = latestReachableEntries.get(stepId);
    const exit = latestExitByStepId.get(stepId);
    if (entry?.check_status === "skipped") skipped_step_count += 1;
    if (exit?.verdict === "passed") passed_step_count += 1;
    if (entry?.check_status === "blocked" || entry?.judgement?.status === "blocked" || exit?.verdict === "blocked") {
      blocked_step_count += 1;
    }
  }

  let rollback_count = 0;
  for (const event of events) {
    if (event?.event_type !== JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK || !sameRun(event)) continue;
    if (!sameStageStep(event.affected_step_id) || !reachable.has(event.affected_step_id)) continue;
    rollback_count += 1;
    if (
      !sameStageStep(event.rollback_from_step_id) ||
      !sameStageStep(event.rollback_to_step_id) ||
      !reachable.has(event.rollback_from_step_id) ||
      !reachable.has(event.rollback_to_step_id)
    ) {
      warnings.push(`rollback_pointer_outside_chain:${event.affected_step_id}`);
    }
  }

  const audit_summary = {
    total_step_count: stepIds.length,
    passed_step_count,
    blocked_step_count,
    skipped_step_count,
    rollback_count,
  };

  for (const field of AUDIT_SUMMARY_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(audit_summary, field)) {
      throw new TypeError(`audit_summary missing schema field: ${field}`);
    }
  }

  return {
    audit_summary,
    warnings,
  };
}
