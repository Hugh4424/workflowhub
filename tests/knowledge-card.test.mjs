/**
 * knowledge-card.test.mjs — M4 Phase 3 (T012-T015).
 * Structured "knowledge card" for friction points (rework / retry / human escalation /
 * known failure modes). FR-FEEDBACK-001~004:
 *   - recorded once per occurrence, no threshold (the validator never gates on count).
 *   - six required fields: type / stage / root_cause / resolution / resolved / occurred_at.
 *   - type is a controlled enum (ten lesson-derived types + "other" fallback); an
 *     out-of-enum type is invalid; an unknown card normalizes to "other".
 *   - five optional fields: prevention / memory_ref / honest_override / metrics_ref /
 *     affected_deliverable.
 *   - the card is one source for the execution record's "feedback" key, coexisting with
 *     the workflow-issues ledger without degrading it.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CARD_TYPES,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  normalizeCardType,
  validateKnowledgeCard,
  makeFeedbackRef,
} from "../metrics/knowledge-card.mjs";

const contractPath = join(import.meta.dirname, "..", "contracts", "knowledge-card.contract.json");

function fullCard() {
  return {
    type: "gate_deadlock",
    stage: "apply",
    root_cause: "gate scanned wrong repo",
    resolution: "override delivery repo",
    resolved: true,
    occurred_at: "2026-06-23T04:00:00Z",
  };
}

describe("T012/T013 enum + required fields", () => {
  it("CARD_TYPES has ten lesson-derived types plus the other fallback", () => {
    expect(CARD_TYPES).toContain("other");
    expect(CARD_TYPES.length).toBe(11); // 10 known + other
    expect(new Set(CARD_TYPES).size).toBe(CARD_TYPES.length); // no dups
  });

  it("REQUIRED_FIELDS lists exactly the six mandatory fields", () => {
    expect(REQUIRED_FIELDS).toEqual([
      "type",
      "stage",
      "root_cause",
      "resolution",
      "resolved",
      "occurred_at",
    ]);
  });

  it("OPTIONAL_FIELDS lists the five optional fields", () => {
    expect(OPTIONAL_FIELDS).toEqual([
      "prevention",
      "memory_ref",
      "honest_override",
      "metrics_ref",
      "affected_deliverable",
    ]);
  });

  it("a card with all six required fields and a valid enum type passes", () => {
    const { valid, errors } = validateKnowledgeCard(fullCard());
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it("removing any one required field fails validation", () => {
    for (const field of REQUIRED_FIELDS) {
      const card = fullCard();
      delete card[field];
      const { valid, errors } = validateKnowledgeCard(card);
      expect(valid, `missing ${field} should fail`).toBe(false);
      expect(errors.join(" ")).toMatch(new RegExp(field));
    }
  });

  it("the shipped contract declares the six required fields", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    const names = contract.required_fields.map((f) => f.name);
    for (const field of REQUIRED_FIELDS) expect(names).toContain(field);
  });
});

describe("T012 FR-FEEDBACK-003 controlled enum + other fallback", () => {
  it("a type outside the enum is invalid", () => {
    const card = { ...fullCard(), type: "not_a_known_type" };
    const { valid, errors } = validateKnowledgeCard(card);
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/type/);
  });

  it("normalizeCardType maps an unknown type to other", () => {
    expect(normalizeCardType("totally_unknown")).toBe("other");
  });

  it("normalizeCardType keeps a known type unchanged", () => {
    expect(normalizeCardType("gate_deadlock")).toBe("gate_deadlock");
  });
});

describe("T013 FR-FEEDBACK-001/002 once-per-occurrence + optional fields", () => {
  it("validation never depends on an occurrence count/threshold", () => {
    // a single card validates exactly the same as any other — no count field gates it
    const card = fullCard();
    expect(validateKnowledgeCard(card).valid).toBe(true);
    expect("count" in card).toBe(false);
  });

  it("optional fields are accepted but not required", () => {
    const withOptional = {
      ...fullCard(),
      prevention: "set delivery repo env",
      memory_ref: ["m4-cross-repo-gate"],
      honest_override: false,
      metrics_ref: "task-metrics.jsonl#e1",
      affected_deliverable: "metrics/collector.mjs",
    };
    expect(validateKnowledgeCard(withOptional).valid).toBe(true);
    // omitting all optionals is still valid
    expect(validateKnowledgeCard(fullCard()).valid).toBe(true);
  });
});

describe("T014 FR-FEEDBACK-004 feedback-key source, coexists with ledger", () => {
  it("makeFeedbackRef yields a reference (not the card detail) for the execution record", () => {
    const ref = makeFeedbackRef("knowledge-cards.jsonl", "card-1");
    expect(typeof ref.ref).toBe("string");
    expect(ref.ref).toContain("knowledge-cards.jsonl");
    // a reference, never the inlined card body
    expect(ref.card).toBeUndefined();
  });

  it("the knowledge card is a distinct structure from the workflow-issues ledger entry", () => {
    // workflow-issues ledger entries are keyed by stage/mode/issues[]; a knowledge card
    // is keyed by type/root_cause/honest_override — the card must not carry ledger-only keys
    const card = fullCard();
    expect("issues" in card).toBe(false);
    expect("mode" in card).toBe(false);
  });
});

// ── Round-1 review fixes ──────────────────────────────────────────────────
// B1: the contract — not just runtime code — must declare the controlled type enum.
// B2: validateKnowledgeCard must enforce field TYPES (per contract), not only presence;
//     resolved must be boolean, the string fields must be strings.
describe("Round-1 review fix B1: contract declares the controlled type enum", () => {
  it("the shipped contract declares all 11 card types (10 known + other)", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    expect(Array.isArray(contract.allowed_types)).toBe(true);
    expect(contract.allowed_types).toContain("other");
    expect(contract.allowed_types.length).toBe(11);
    expect(new Set(contract.allowed_types).size).toBe(11); // no dups
  });

  it("the contract enum matches the runtime CARD_TYPES exactly", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    expect([...contract.allowed_types].sort()).toEqual([...CARD_TYPES].sort());
  });
});

describe("Round-1 review fix B2: validateKnowledgeCard enforces field types", () => {
  it("a non-boolean resolved is invalid", () => {
    const card = { ...fullCard(), resolved: "true" };
    const { valid, errors } = validateKnowledgeCard(card);
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/resolved/);
  });

  it("a non-string occurred_at is invalid", () => {
    const card = { ...fullCard(), occurred_at: 123 };
    const { valid, errors } = validateKnowledgeCard(card);
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/occurred_at/);
  });

  it("a non-string root_cause is invalid", () => {
    const card = { ...fullCard(), root_cause: 42 };
    expect(validateKnowledgeCard(card).valid).toBe(false);
  });

  it("a fully well-typed card still passes", () => {
    expect(validateKnowledgeCard(fullCard()).valid).toBe(true);
  });
});
