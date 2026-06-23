/**
 * execution-record.mjs — M4 Phase 2: the unified execution record (a JOIN VIEW).
 *
 * FR-EXECREC-001: one record per task, six key categories, structural validation,
 *   missing any category = invalid.
 * FR-EXECREC-002: links by reference (trace_index); never copies raw detail.
 * FR-EXECREC-003: hard metrics and soft feedback stay distinct forms — this record
 *   only joins them by reference, never merges the two into one detail row.
 * FR-EXECREC-004: boundary_decisions / trace_index must carry a confirmed source
 *   (journal seq for trace_index, stage/state transitions for boundary_decisions,
 *   see decision-log D10). With no confirmed source they are marked "gap" — never an
 *   empty placeholder, never hand-filled.
 * FR-EXECREC-005: each key records its first real consumer; no-consumer keys are
 *   optional (not blocking), and an extension slot is reserved for future keys (D18).
 *
 * Hand-written validation, no AJV — matches M1-M3 validate-contract.mjs style.
 */

// The six key categories, in canonical order (spec §4 EXECREC, decision-log D9).
export const SIX_KEYS = [
  "progress",
  "facts",
  "metrics",
  "feedback",
  "boundary_decisions",
  "trace_index",
];

// Keys whose data source must be confirmed at design time (D10). Without a source
// they are marked GAP rather than left empty or hand-filled (FR-EXECREC-004).
const SOURCE_GATED_KEYS = ["boundary_decisions", "trace_index"];

// Sentinel for a key with no confirmed data source (FR-EXECREC-004, FR-GUARD-004).
export const GAP = "gap";

/**
 * assembleExecutionRecord — build the join-view record from a seed.
 * The seed provides per-key reference objects; this function never inlines raw detail.
 * Source-gated keys with no provided source collapse to GAP.
 */
export function assembleExecutionRecord(seed) {
  const record = { execution_id: seed.execution_id };

  for (const key of SIX_KEYS) {
    const provided = seed[key];
    if (SOURCE_GATED_KEYS.includes(key)) {
      // Confirmed source required; otherwise GAP (no empty placeholder, no hand-fill).
      record[key] = provided && provided.source ? provided : GAP;
    } else {
      record[key] = provided ?? {};
    }
  }

  // FR-EXECREC-005: first real consumer per key (optional), plus a reserved
  // extension slot for future keys without forcing a breaking change (D18).
  record._consumers = seed.consumers ?? {};
  record._ext = seed.ext ?? {};

  return record;
}

/**
 * validateExecutionRecord — FR-EXECREC-001: structural check over the six keys.
 * Each category key must be present. Source-gated keys may be GAP (valid) or an
 * object carrying a source; a source-gated key present as an empty/sourceless object
 * is invalid (it must be GAP instead — no empty placeholder).
 */
export function validateExecutionRecord(record) {
  const errors = [];
  if (record === null || typeof record !== "object") {
    return { valid: false, errors: ["record must be an object"] };
  }
  // execution_id keys the join view (trace_index linkage) and is declared required by
  // contracts/execution-record.contract.json — it must be a non-empty string.
  if (!("execution_id" in record)) {
    errors.push("missing required field: execution_id");
  } else if (typeof record.execution_id !== "string" || record.execution_id.length === 0) {
    errors.push("execution_id must be a non-empty string");
  }
  for (const key of SIX_KEYS) {
    if (!(key in record)) {
      errors.push(`missing required key: ${key}`);
      continue;
    }
    const value = record[key];
    if (SOURCE_GATED_KEYS.includes(key)) {
      if (value === GAP) continue; // explicit gap is valid
      if (value === null || typeof value !== "object" || !value.source) {
        errors.push(`key ${key}: source-gated key must carry a source or be marked gap`);
      }
    } else if (value === null || typeof value !== "object") {
      errors.push(`key ${key}: must be an object`);
    }
  }
  return { valid: errors.length === 0, errors };
}
