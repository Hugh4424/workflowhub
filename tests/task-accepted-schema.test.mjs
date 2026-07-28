import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync(new URL("../schemas/task-accepted.v2.schema.json", import.meta.url), "utf8"));
const validate = new Ajv2020({ strict: false, formats: { "date-time": true } }).compile(schema);
const base = {
  schema_version: "task-accepted.v2",
  task_id: "task-one",
  stage: "make-decision",
  attempt_ref: "attempt-0001.json",
  integrity_hash: "a".repeat(64),
  accepted_at: "2026-07-16T00:00:00.000Z",
  upstream_refs: [],
};

describe("task-accepted.v2 acceptance provenance", () => {
  it("accepts legacy human records without an acceptance mode", () => {
    expect(validate({ ...base, stage: "build-code", human_confirmation_ref: "confirmations/build-code/attempt-0001.json" })).toBe(true);
  });

  it("accepts current human and automatic records", () => {
    expect(validate({ ...base, acceptance_mode: "human", human_confirmation_ref: "confirmations/make-decision/attempt-0001.json" })).toBe(true);
    expect(validate({ ...base, stage: "build-code", acceptance_mode: "automatic" })).toBe(true);
  });

  it("rejects missing, false, or stage-mismatched provenance", () => {
    expect(validate({ ...base })).toBe(false);
    expect(validate({ ...base, stage: "build-code", acceptance_mode: "automatic", human_confirmation_ref: "human:false" })).toBe(false);
    expect(validate({ ...base, stage: "make-decision", acceptance_mode: "automatic" })).toBe(false);
    expect(validate({ ...base, stage: "build-code", acceptance_mode: "human", human_confirmation_ref: "human:false" })).toBe(false);
  });

  it("accepts only a complete make-decision full-audit binding", () => {
    const fullAudit = {
      full_audit_ref: `evidence/audits/make-decision/${"b".repeat(64)}.json`,
      full_audit_hash: "c".repeat(64),
      full_audit_summary_hash: "d".repeat(64),
      full_audit_verdict: "pass",
    };
    const accepted = {
      ...base,
      acceptance_mode: "human",
      human_confirmation_ref: "confirmations/make-decision/attempt-0001.json",
      ...fullAudit,
    };
    expect(validate(accepted)).toBe(true);
    expect(validate({ ...accepted, full_audit_hash: undefined })).toBe(false);
    expect(validate({ ...accepted, stage: "build-code", acceptance_mode: "automatic" })).toBe(false);
    expect(validate({ ...accepted, full_audit_verdict: "revise_required" })).toBe(false);
  });

  it("rejects unknown accepted fields", () => {
    expect(validate({
      ...base,
      acceptance_mode: "human",
      human_confirmation_ref: "confirmations/make-decision/attempt-0001.json",
      invented: true,
    })).toBe(false);
  });
});
