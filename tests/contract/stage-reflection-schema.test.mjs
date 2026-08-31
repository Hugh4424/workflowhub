import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const schemaPath = join(repoRoot, "runtime", "schemas", "stage-reflection.v1.json");

function loadSchema() {
  expect(existsSync(schemaPath), `missing schema: ${schemaPath}`).toBe(true);
  return JSON.parse(readFileSync(schemaPath, "utf8"));
}

function validRecord(overrides = {}) {
  return {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: "workflowhub-stage-reflection-fixture",
    stage: "build-code",
    stage_status: "completed",
    generated_at: "2026-08-30T00:00:00.000Z",
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "run-tests",
      subject_kind: "step",
      classification: "optimize",
      severity: "medium",
      reason: "测试覆盖了当前改动，但仍有一条邻接失败边需要补强。",
      evidence_refs: ["quality/tests/stage-reflection-fixture.json"],
      confidence: "medium",
      next_review_trigger: "下一次同类阶段再次出现邻接失败时复核。",
    }],
    interventions: [],
    lessons_added: [],
    ...overrides,
  };
}

function validator() {
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  return { schema, validate: ajv.compile(schema) };
}

describe("stage-reflection.v1 schema", () => {
  it("accepts the judgment envelope and the seven classification values", () => {
    const { validate } = validator();
    const values = ["keep", "optimize", "simplify", "merge", "remove_candidate", "add", "needs_evidence"];
    for (const classification of values) {
      const value = validRecord({ judgments: [{ ...validRecord().judgments[0], classification }] });
      expect(validate(value), `${classification}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("rejects missing identity, illegal classification, fabricated refs, and quality scores", () => {
    const { validate } = validator();
    const cases = [
      ["record_kind", { record_kind: undefined }],
      ["classification", { judgments: [{ ...validRecord().judgments[0], classification: "score" }] }],
      ["evidence ref", { judgments: [{ ...validRecord().judgments[0], evidence_refs: ["made-up/evidence.json"] }] }],
      ["quality score", { score: 0.9 }],
    ];
    for (const [label, changes] of cases) {
      const value = validRecord();
      for (const [key, changed] of Object.entries(changes)) {
        if (changed === undefined) delete value[key];
        else value[key] = changed;
      }
      expect(validate(value), label).toBe(false);
    }
  });

  it("keeps failed and degraded status semantics explicit", () => {
    const { validate } = validator();
    expect(validate(validRecord({ status: "failed", error: { summary: "reflection timed out" }, judgments: [] }))).toBe(true);
    expect(validate(validRecord({ status: "degraded", error: null }))).toBe(true);
    expect(validate(validRecord({ status: "failed", error: null }))).toBe(false);
    expect(validate(validRecord({ status: "ok", error: { summary: "unexpected" } }))).toBe(false);
  });

  it("does not permit high-confidence judgments without evidence", () => {
    const { validate } = validator();
    const value = validRecord({ judgments: [{ ...validRecord().judgments[0], confidence: "high", evidence_refs: [] }] });
    expect(validate(value)).toBe(false);
  });

  it("contains no quality scoring fields in the schema contract", () => {
    const { schema } = validator();
    const forbidden = new Set(["score", "grade", "quality"]);
    const walk = (value) => {
      if (!value || typeof value !== "object") return [];
      return Object.entries(value).flatMap(([key, child]) => [
        ...(forbidden.has(key) ? [key] : []),
        ...walk(child),
      ]);
    };
    expect(walk(schema)).toEqual([]);
  });
});
