import { describe, expect, it } from "vitest";
import { compiledSchemaNames, validateSchema } from "../schema-validator.mjs";

const hash = "a".repeat(64);
const oid = "b".repeat(40);

function expectSchemaError(name, value, pointer) {
  try {
    validateSchema(name, value);
    throw new Error("expected schema validation to fail");
  } catch (error) {
    expect(error).toMatchObject({ code: "SCHEMA_VALIDATION_FAILED", schema: name, pointer });
  }
}

describe("schema-validator", () => {
  it("compiles only the simple review schemas", () => {
    expect(compiledSchemaNames).toEqual(["attempt", "result"]);
  });

  it("rejects unknown attempt fields", () => {
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: "attempt-1",
      task_id: "task-1",
      stage: "build-code",
      review_track: null,
      source: { target_commit: oid, base_commit: oid, base_tree: oid, captured_head: oid },
      snapshot_tree: oid,
      material_id: hash,
      provider_attempts: [],
      terminal_status: "semantic",
      error: null,
      leaked: "secret-value",
    };
    expectSchemaError("attempt", attempt, "/leaked");
  });

  it("rejects an invalid semantic result verdict", () => {
    const result = {
      version: "wh-review-result.v1",
      task_id: "task-1",
      stage: "build-code",
      review_track: null,
      source: { target_commit: oid, base_commit: oid, base_tree: oid, captured_head: oid },
      snapshot_tree: oid,
      material_id: hash,
      attempt_ref: "reviews/attempts/attempt-1.json",
      verdict: "unavailable",
      findings: [{ provider: "opencode", severity: "major", path: "a.mjs", issue: "bad", recommendation: "fix" }],
      provider_results: [{ provider: "opencode", output: { verdict: "pass", summary: "ok", findings: [] } }],
    };
    expectSchemaError("result", result, "/verdict");
  });
});
