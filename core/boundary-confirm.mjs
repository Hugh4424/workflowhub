/**
 * boundary-confirm.mjs — M5 Phase 2: stage boundary + irreversible-op confirmation.
 *
 * FR-BOUND-001: missing/failed/unknown states all pass through (never block).
 * FR-BOUND-002: decisions written into boundary_decisions (source-gated, non-orphan).
 * FR-BOUND-003: findViolation reused from check-path-guard (no home-grown checker).
 * FR-GATE-003/004: all outcomes (confirmed/rejected/timeout) continue — never block.
 * FR-GUARD-001: never throws; wrap in try/catch, stderr warn on failure.
 */

import { upsert } from "../metrics/collector.mjs";
import { findViolation } from "../scripts/check-path-guard.mjs";

const IRREVERSIBLE_OPS = new Set(["delete", "push", "merge", "archive"]);
const SOURCE_TAG = "boundary-confirm@m5";

// Write a boundary_decisions entry into the execution record (source-gated).
function writeBoundaryDecision(cfg, entry) {
  const patch = {
    boundary_decisions: { source: SOURCE_TAG, ...entry },
  };
  // ponytail: dual-write matches other collector callers; global write omitted here
  // since boundary_decisions is task-level state — upgrade if global rollup needed.
  // upsert returns false on write failure (writeAll) WITHOUT throwing — surface it
  // as a stderr warn so a silent loss of the boundary decision is observable
  // (FR-GUARD-001, symmetric with collectFacts' write-failure handling).
  const ok = upsert(cfg.taskMetricsPath, cfg.execution_id, patch, cfg);
  if (ok === false) {
    process.stderr.write(
      `[boundary-confirm warn] boundary decision write failed for ${cfg.execution_id}\n`,
    );
  }
}

/**
 * confirmBoundary — FR-BOUND-001/002.
 * @param {"missing"|"failed"|"unknown"} state
 * @param {{ execution_id, taskMetricsPath, globalMetricsPath, project, taskId }} cfg
 * @returns {{ decision: string, reason: string, timestamp: string }}
 */
export function confirmBoundary(state, cfg) {
  const timestamp = new Date().toISOString();
  const reason = `state=${state}; pass-through per FR-BOUND-001`;
  const decision = "continue";
  try {
    writeBoundaryDecision(cfg, { decision, reason, timestamp, state });
  } catch (err) {
    process.stderr.write(`[boundary-confirm warn] confirmBoundary write failed: ${err.message}\n`);
  }
  return { decision, reason, timestamp };
}

/**
 * confirmIrreversible — FR-BOUND-003 / FR-GATE-003/004.
 * @param {"delete"|"push"|"merge"|"archive"} op
 * @param {{ execution_id, taskMetricsPath, ... }} cfg
 * @param {string|undefined} targetPath  repo-relative path (may be undefined)
 * @param {{ outcome: "confirmed"|"rejected"|"timeout" }} opts
 * @returns {{ decision: string, reason: string, timestamp: string }}
 */
export function confirmIrreversible(op, cfg, targetPath, opts) {
  const timestamp = new Date().toISOString();
  const outcome = opts?.outcome;

  if (!IRREVERSIBLE_OPS.has(op)) {
    // Non-irreversible op: record a pass-through but mark irreversible=false.
    const reason = `op=${op} is not irreversible; no confirmation needed`;
    try {
      writeBoundaryDecision(cfg, { decision: "continue", reason, timestamp, op, irreversible: false });
    } catch (err) {
      process.stderr.write(`[boundary-confirm warn] confirmIrreversible write failed: ${err.message}\n`);
    }
    return { decision: "continue", reason, timestamp };
  }

  // Check whether the target path hits a protected path (FR-BOUND-003 reuse).
  const violation = targetPath ? findViolation(targetPath) : null;
  const needs_manual_confirm = violation != null;

  // Build reason — all outcomes continue (FR-GATE-004 守恒铁律).
  let reason;
  if (outcome === "timeout") {
    reason = "timeout-no-confirm; continuing per FR-GATE-004";
  } else if (outcome === "rejected") {
    reason = `op=${op} rejected; continuing per FR-GATE-004`;
  } else {
    reason = `op=${op} confirmed`;
  }

  const entry = {
    decision: "continue",
    reason,
    timestamp,
    op,
    outcome,
    irreversible: true,
    ...(needs_manual_confirm ? { needs_manual_confirm: true, protected_path: violation } : {}),
  };

  try {
    writeBoundaryDecision(cfg, entry);
  } catch (err) {
    process.stderr.write(`[boundary-confirm warn] confirmIrreversible write failed: ${err.message}\n`);
  }

  return { decision: "continue", reason, timestamp };
}
