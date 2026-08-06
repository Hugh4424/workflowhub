import { describe, expect, it } from "vitest";
import { compiledSchemaNames, validateSchema } from "../schema-validator.mjs";

const hash = "a".repeat(64);
const oid = "b".repeat(40);
const lineage = { request_id: "schema-test", prompt_hash: hash, round: "initial", prior_attempt_refs: [], prior_runtime_ids: {}, correction_ref: null, dispatch_sequence: 0 };

function expectSchemaError(name, value, pointer) {
  try {
    validateSchema(name, value);
    throw new Error("expected schema validation to fail");
  } catch (error) {
    expect(error).toMatchObject({ code: "SCHEMA_VALIDATION_FAILED", schema: name, pointer });
  }
}

describe("schema-validator", () => {
  it("compiles only current review and AC evidence schemas", () => {
    expect(compiledSchemaNames).toEqual(["attempt", "result", "ac_evidence_summary"]);
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
      lineage,
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
      lineage,
      verdict: "unavailable",
      findings: [{ provider: "opencode", severity: "major", path: "a.mjs", issue: "bad", recommendation: "fix" }],
      provider_results: [{ provider: "opencode", output: { verdict: "pass", summary: "ok", findings: [] } }],
    };
    expectSchemaError("result", result, "/verdict");
  });

  it("keeps a provider's rejected major finding as audit evidence when aggregation passes", () => {
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
      lineage,
      verdict: "pass",
      findings: [],
      provider_results: [{
        provider: "kimi/coding",
        output: {
          verdict: "revise_required", summary: "unverified concern",
          findings: [{ severity: "major", path: "requirements/impact_map.json", issue: "scope concern", recommendation: "verify approved scope", evidence_kind: "direct", evidence: "the submitted anchor is invalid" }],
        },
      }],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [{
        id: "F-123456789abc", severity: "major", path: "requirements/impact_map.json", issue: "scope concern", root_cause: "unverified scope", recommendation: "verify approved scope",
        providers: ["kimi/coding"], adapter_count: 1, finding_count: 1, disposition: "invalid_evidence", evidence_status: "invalid_anchor",
        provider_findings: [{ provider: "kimi/coding", adapter: "kimi", severity: "major", evidence_kind: "direct", evidence_anchor_valid: false }],
      }] },
    };
    expect(validateSchema("result", result)).toEqual(result);
  });

  it("does not expose the retired resolution schema", () => {
    expect(() => validateSchema("resolution", {})).toThrow(/unknown schema: resolution/);
  });

  it("requires every provider-visible AC summary field", () => {
    const summary = {
      schema_version: "ac-evidence-summary.v1", snapshot_tree: oid, source_digest: hash,
      test_receipt: { ref: "receipts/tests.json", sha256: hash },
      criteria: [{
        acceptance_criterion_id: "AC-1", result: "pass", leaf_result: "pass", status: "passed", source_digest: hash, acceptance_leaf: { ref: "evidence/ac-1.json", sha256: hash },
        nested_evidence: [{ ref: "evidence/ac-1-proof.json", sha256: hash }], scenario: "scenario", oracle: "oracle",
        actual_outcome: "pass", evidence_type: "acceptance_leaf", coverage_limits: ["unknown"], exceptions: ["unknown"],
      }],
    };
    expect(validateSchema("ac_evidence_summary", summary)).toEqual(summary);
    expectSchemaError("ac_evidence_summary", { ...summary, criteria: [{ ...summary.criteria[0], oracle: "" }] }, "/criteria/0/oracle");
  });
});
