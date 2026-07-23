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
  it("compiles the simple review and resolution schemas", () => {
    expect(compiledSchemaNames).toEqual(["attempt", "result", "resolution"]);
  });

  it("rejects unknown attempt fields", () => {
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: "attempt-1",
      task_id: "task-1",
      stage: "build-code",
      review_track: null,
      subject_kind: "worktree", phase_id: null, base_tree: oid, candidate_tree: oid,
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
      subject_kind: "worktree", phase_id: null, base_tree: oid, candidate_tree: oid,
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

  it("rejects a resolution with an untrusted extra field", () => {
    const resolution = {
      version: "wh-review-resolution.v1", task_id: "task-1", stage: "build-spec", review_track: null,
      outcome: "recorded_non_gate_response", previous_result_ref: "reviews/results/prior.json",
      previous_result_sha256: hash, previous_snapshot_tree: oid, snapshot_tree: oid,
      evidence_state: "verified", response_ledger: {}, response_ledger_sha256: hash,
      unverified_reason: null, accepted_risk_count: 0, leaked: "secret-value",
    };
    expectSchemaError("resolution", resolution, "/leaked");
  });
});
