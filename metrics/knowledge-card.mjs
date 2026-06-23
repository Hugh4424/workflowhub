/**
 * knowledge-card.mjs — M4 Phase 3: structured friction "knowledge card" (FR-FEEDBACK-001~004).
 *
 * A card is recorded once per friction occurrence (rework / retry / human escalation /
 * known failure mode) with no threshold. It is one source for the execution record's
 * "feedback" key (FR-EXECREC-001/002), coexisting with the workflow-issues ledger
 * without degrading it.
 *
 * Hand-written validation, no AJV — matches M1-M3 validate-contract.mjs style.
 */

// Controlled enum: ten lesson-derived friction types (generalized from the accumulated
// MEMORY lessons, decision-log D11) plus an "other" fallback for the long tail.
// Covering the recurring failure classes lets `type + root_cause + honest_override`
// answer "which friction class dominates / which are systemic / which were bypassed
// not fixed" (the card's stated highest-value query).
export const CARD_TYPES = [
  "gate_deadlock",        // gate 死结 / 推进缺口
  "false_green",          // 假绿 / 验收不可信
  "orphan_deliverable",   // 代码存在但没接进活流程
  "honest_override",      // 诚实终态 / 知情绕过非伪造 pass
  "review_mechanism",     // 审查机制 / 独立性问题
  "wiring_persist",       // 接线 / persist / journal 陷阱
  "worktree_git",         // worktree / git / 并发
  "env_false_signal",     // 环境 / 工具假红假绿
  "context_pollution",    // 上下文污染 / 退化
  "format_drift",         // 字段 / 格式漂移（打地鼠类）
  "other",                // 兜底
];

// Six mandatory fields (FR-FEEDBACK-002).
export const REQUIRED_FIELDS = [
  "type",
  "stage",
  "root_cause",
  "resolution",
  "resolved",
  "occurred_at",
];

// Five optional fields (FR-FEEDBACK-003).
export const OPTIONAL_FIELDS = [
  "prevention",
  "memory_ref",
  "honest_override",
  "metrics_ref",
  "affected_deliverable",
];

const TYPE_SET = new Set(CARD_TYPES);

/**
 * normalizeCardType — FR-FEEDBACK-003: map an unknown type to the "other" fallback;
 * a known enum type is returned unchanged. Use this when ingesting a card whose type
 * may be out of vocabulary, BEFORE validation, so unknowns land in "other" rather than
 * being dropped.
 */
export function normalizeCardType(type) {
  return TYPE_SET.has(type) ? type : "other";
}

// Field type map for the six required fields — kept in sync with
// contracts/knowledge-card.contract.json required_fields (the contract is the source
// of truth; CARD_TYPES is asserted equal to the contract's allowed_types in tests).
const REQUIRED_FIELD_TYPES = {
  type: "string",
  stage: "string",
  root_cause: "string",
  resolution: "string",
  resolved: "boolean",
  occurred_at: "string",
};

/**
 * validateKnowledgeCard — FR-FEEDBACK-002/003: structural + TYPE + enum validation.
 * Returns { valid, errors }. Every required field must be present AND have the type the
 * contract declares (resolved is boolean; the rest are strings). `type` must be within
 * the controlled enum (a raw out-of-enum type is invalid — callers that want the
 * fallback must normalizeCardType first). No occurrence-count threshold is ever
 * consulted (FR-FEEDBACK-001).
 */
export function validateKnowledgeCard(card) {
  const errors = [];
  if (card === null || typeof card !== "object") {
    return { valid: false, errors: ["card must be an object"] };
  }
  for (const field of REQUIRED_FIELDS) {
    if (!(field in card)) {
      errors.push(`missing required field: ${field}`);
    } else if (typeof card[field] !== REQUIRED_FIELD_TYPES[field]) {
      errors.push(
        `field ${field}: expected type ${REQUIRED_FIELD_TYPES[field]}, got ${typeof card[field]}`
      );
    }
  }
  if ("type" in card && !TYPE_SET.has(card.type)) {
    errors.push(`type "${card.type}" is not in the controlled enum`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * makeFeedbackRef — FR-EXECREC-002/FR-FEEDBACK-004: build a reference to a persisted
 * knowledge card for the execution record's "feedback" key. Returns a reference object
 * ({ ref }), never the inlined card body — the unified record links, it does not copy.
 */
export function makeFeedbackRef(store, cardId) {
  return { ref: `${store}#${cardId}` };
}
