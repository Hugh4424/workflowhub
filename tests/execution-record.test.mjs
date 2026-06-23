/**
 * execution-record.test.mjs — M4 Phase 2 (T008-T011).
 * Unified execution record: a JOIN VIEW over six key categories
 * (progress / facts / metrics / feedback / boundary_decisions / trace_index).
 * It links by reference (trace_index), never copies raw detail (FR-EXECREC-002),
 * keeps hard metrics and soft feedback as distinct forms (FR-EXECREC-003), marks
 * boundary_decisions/trace_index as gap when no confirmed source (FR-EXECREC-004),
 * and marks each key's first real consumer — no-consumer keys are optional with a
 * reserved extension slot (FR-EXECREC-005).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  assembleExecutionRecord,
  validateExecutionRecord,
  SIX_KEYS,
  GAP,
} from "../metrics/execution-record.mjs";

const contractPath = join(import.meta.dirname, "..", "contracts", "execution-record.contract.json");

function fullSeed() {
  return {
    execution_id: "exec-1",
    progress: { stage: "apply", phase: 2 },
    facts: { coreDiffEmpty: true },
    metrics: { ref: "task-metrics.jsonl#exec-1" },     // reference, not detail
    feedback: { ref: "knowledge-cards.jsonl#exec-1" }, // reference, not detail
    boundary_decisions: { source: "state.json#stageTransitions", items: [] },
    trace_index: { source: "journal.jsonl#seq", entries: [] },
  };
}

describe("T008/T009 six key categories", () => {
  it("SIX_KEYS names the six categories", () => {
    expect(SIX_KEYS).toEqual([
      "progress",
      "facts",
      "metrics",
      "feedback",
      "boundary_decisions",
      "trace_index",
    ]);
  });

  it("a record with all six keys passes structural validation", () => {
    const rec = assembleExecutionRecord(fullSeed());
    const { valid, errors } = validateExecutionRecord(rec);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it("removing any one of the six keys fails validation", () => {
    for (const key of SIX_KEYS) {
      const rec = assembleExecutionRecord(fullSeed());
      delete rec[key];
      const { valid, errors } = validateExecutionRecord(rec);
      expect(valid, `missing ${key} should fail`).toBe(false);
      expect(errors.join(" ")).toMatch(new RegExp(key));
    }
  });

  it("the shipped contract declares all six keys as required fields", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    const names = contract.required_fields.map((f) => f.name);
    for (const key of SIX_KEYS) expect(names).toContain(key);
  });
});

describe("T009 FR-EXECREC-002 link-by-reference, no detail copy", () => {
  it("metrics/feedback keys hold a reference, not copied raw detail", () => {
    const rec = assembleExecutionRecord(fullSeed());
    // reference object exposes a `ref` pointer; must NOT inline raw rows
    expect(typeof rec.metrics.ref).toBe("string");
    expect(rec.metrics.rows).toBeUndefined();
    expect(typeof rec.feedback.ref).toBe("string");
    expect(rec.feedback.cards).toBeUndefined();
  });
});

describe("T010 FR-EXECREC-004 boundary_decisions/trace_index gap when no source", () => {
  it("a key with no confirmed source is marked gap, never an empty placeholder", () => {
    const seed = fullSeed();
    delete seed.boundary_decisions; // no source provided
    delete seed.trace_index;
    const rec = assembleExecutionRecord(seed);
    expect(rec.boundary_decisions).toBe(GAP);
    expect(rec.trace_index).toBe(GAP);
    // gap is a valid structural value — record still validates
    expect(validateExecutionRecord(rec).valid).toBe(true);
  });

  it("a confirmed source is carried through (not overwritten by gap)", () => {
    const rec = assembleExecutionRecord(fullSeed());
    expect(rec.trace_index).not.toBe(GAP);
    expect(rec.trace_index.source).toBe("journal.jsonl#seq");
  });
});

describe("T011 FR-EXECREC-005 first_consumer + optional + extension slot", () => {
  it("each key records its first real consumer when provided", () => {
    const seed = fullSeed();
    seed.consumers = { metrics: "baseline-rollup", trace_index: "audit-replay" };
    const rec = assembleExecutionRecord(seed);
    expect(rec._consumers.metrics).toBe("baseline-rollup");
    expect(rec._consumers.trace_index).toBe("audit-replay");
  });

  it("a key with no consumer is allowed (optional, not blocking)", () => {
    const rec = assembleExecutionRecord(fullSeed()); // no consumers map
    expect(validateExecutionRecord(rec).valid).toBe(true);
    expect(rec._consumers).toBeDefined(); // present but may be empty
  });

  it("reserves an extension slot for future keys", () => {
    const rec = assembleExecutionRecord(fullSeed());
    expect(rec).toHaveProperty("_ext");
  });
});

// ── Round-1 review fix: execution_id is the join key and must be validated ──
// The contract declares execution_id as a required string, but validateExecutionRecord
// only iterated SIX_KEYS, so a record with a missing/non-string execution_id wrongly
// passed. execution_id keys the join (trace_index linkage) and must be enforced.
describe("Round-1 review fix: execution_id presence + string type", () => {
  function full() {
    return assembleExecutionRecord({
      execution_id: "exec-1",
      progress: {}, facts: {}, metrics: { ref: "a" }, feedback: { ref: "b" },
      boundary_decisions: { source: "s" }, trace_index: { source: "j" },
    });
  }

  it("a record missing execution_id is invalid", () => {
    const rec = full();
    delete rec.execution_id;
    const { valid, errors } = validateExecutionRecord(rec);
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/execution_id/);
  });

  it("a record with a non-string execution_id is invalid", () => {
    const rec = full();
    rec.execution_id = 123;
    expect(validateExecutionRecord(rec).valid).toBe(false);
  });

  it("a record with an empty execution_id is invalid", () => {
    const rec = full();
    rec.execution_id = "";
    expect(validateExecutionRecord(rec).valid).toBe(false);
  });

  it("a complete record with a valid string execution_id still passes", () => {
    expect(validateExecutionRecord(full()).valid).toBe(true);
  });
});
