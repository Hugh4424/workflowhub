/**
 * record-schema.mjs — M4 execution record core field set + hand-written validator.
 *
 * FR-COLLECT-002 / AC5: each record must carry the FULL core field set; a record is
 * invalid if ANY core field key is absent. execution_id additionally keys the
 * three-timing updates and must be a non-empty string. Hand-written validation, no
 * AJV (matches M1-M3 validate-contract.mjs style).
 */

// The core field set (spec section 6). Every field must be structurally PRESENT as a
// key on a complete record (AC5: 缺任一核心字段即判失败). Sentinel VALUES (null / "gap")
// are still allowed for non-id fields (FR-GUARD-004) — requiredness checks key presence,
// not value richness.
export const CORE_FIELDS = [
  { name: "execution_id", required: true },
  { name: "skill_or_stage", required: true },
  { name: "stage", required: true },
  { name: "skill_version", required: true },
  { name: "executed", required: true },
  { name: "tokens", required: true },
  { name: "duration_ms", required: true },
  { name: "rework_rounds", required: true },
  { name: "human_intervention", required: true },
  { name: "friction_ref", required: true },
];

/**
 * validateRecord — FR-COLLECT-002 / AC5: hand-written validator.
 * Returns { valid, errors }. Checks structural presence of every required field key;
 * execution_id must additionally be a non-empty string (it keys the upsert and must
 * never be blank). "gap"/null remain allowed VALUES for any non-id field (FR-GUARD-004).
 */
export function validateRecord(record) {
  const errors = [];
  if (record === null || typeof record !== "object") {
    return { valid: false, errors: ["record must be an object"] };
  }
  for (const field of CORE_FIELDS) {
    if (field.required && !(field.name in record)) {
      errors.push(`missing required field: ${field.name}`);
    }
  }
  // execution_id keys the three-timing upsert — it must be a non-empty string.
  if ("execution_id" in record) {
    const id = record.execution_id;
    if (typeof id !== "string" || id.length === 0) {
      errors.push("execution_id must be a non-empty string");
    }
  }
  return { valid: errors.length === 0, errors };
}
