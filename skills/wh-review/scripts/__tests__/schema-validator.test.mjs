import { describe, expect, it } from "vitest";
import { compiledSchemaNames, validateSchema } from "../schema-validator.mjs";

const hash = "a".repeat(64);

function expectSchemaError(name, value, pointer) {
  try {
    validateSchema(name, value);
    throw new Error("expected schema validation to fail");
  } catch (error) {
    expect(error).toMatchObject({ code: "SCHEMA_VALIDATION_FAILED", schema: name, pointer });
    expect(error.message).not.toContain("secret-value");
  }
}

describe("schema-validator", () => {
  it("compiles all schemas in strict Ajv 2020 mode", () => {
    expect(compiledSchemaNames).toEqual(["review-packet", "review-intent", "reviewer-output", "dispositions", "round-run-result"]);
    expect(validateSchema("dispositions", { items: [] })).toEqual({ items: [] });
  });

  it("rejects unknown packet fields with a stable code and JSON pointer", () => {
    expectSchemaError("review-packet", {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, diff_ref: { attachment: "changes.diff", sha256: hash, size: 0 }, changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "x", test_evidence: [], host_verified_facts: [],
      contract_hash: hash, skill_bundle_hash: hash, source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
      fenced: "secret-value",
    }, "/fenced");
  });

  it("accepts null old_path for non-renames but rejects it for renames", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, diff_ref: { attachment: "changes.diff", sha256: hash, size: 0 }, raw_requirement: "x", acceptance_design_excerpt: "x",
      test_evidence: [], host_verified_facts: [], contract_hash: hash, skill_bundle_hash: hash,
      source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
      changed_files: [{ path: "a", old_path: null, status: "modified", sha256: hash, size: 1, old_sha256: hash, old_size: 1 }],
    };
    expect(validateSchema("review-packet", packet)).toBe(packet);
    packet.changed_files[0].status = "renamed";
    expectSchemaError("review-packet", packet, "/changed_files/0/old_path");
  });

  it("accepts the complete host tree revision and rejects the retired commit pair", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, diff_ref: { attachment: "changes.diff", sha256: hash, size: 0 }, changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "x", test_evidence: [], host_verified_facts: [], contract_hash: hash, skill_bundle_hash: hash,
      source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
    };
    expect(validateSchema("review-packet", packet)).toBe(packet);
    packet.source_revision = { base: "b".repeat(40), head: "c".repeat(40) };
    expectSchemaError("review-packet", packet, "/source_revision/base");
  });

  it("fails verify-code closed without direct AC evidence and non-empty closure", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "verify-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, diff_ref: { attachment: "changes.diff", sha256: hash, size: 0 }, changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "AC-01: works", acceptance_evidence: [], verification_closure: [], test_evidence: [{ name: "unit", status: "passed" }], host_verified_facts: [],
      review_lenses: [{ skill: "qa-only", bundle_hash: hash, checked_objects: ["review-packet.v1.json:test_evidence"] }],
      contract_hash: hash, skill_bundle_hash: hash, source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
    };
    expectSchemaError("review-packet", packet, "/acceptance_evidence");
    packet.acceptance_evidence = [{ ac_id: "AC-01", status: "covered", evidence: [{ kind: "test", name: "unit", result: "passed", object: "tests/unit.test.mjs:AC-01" }] }];
    expectSchemaError("review-packet", packet, "/verification_closure");
    packet.verification_closure = [{ subject: "AC-01", state: "closed", evidence: ["tests/unit.test.mjs:AC-01 passed"] }];
    expect(validateSchema("review-packet", packet)).toBe(packet);
  });

  it("rejects an invalid review track and unknown intent controls", () => {
    const intent = {
      task_id: "t", stage: "build-code", review_track: "direction", review_flow_id: "f", business_round: 1,
      round_kind: "initial", baseline_packet_hash: hash, contract_hash: hash, material_manifest_hash: hash,
      skill_bundle_hash: hash, idempotency_key: "i", host_provider: null,
      limits: { continuation_prompt_max_bytes: 1 }, caller_limit: "secret-value",
    };
    expectSchemaError("review-intent", intent, "/caller_limit");
    delete intent.caller_limit;
    expectSchemaError("review-intent", intent, "/review_track");
  });

  it("rejects blank revise details before business validation", () => {
    const value = {
      packet_hash: hash, manifest_hash: hash, diff_sha256: hash, contract_hash: hash, skill_bundle_hash: hash,
      packet_status: "complete", verdict: "revise_required", summary: "x", findings: [], checklist: [],
      pass_items: [], skillResults: [], rootCause: "", fixApproach: "   ",
    };
    expectSchemaError("reviewer-output", value, "/rootCause");
  });

  it("rejects malformed dispositions and round results", () => {
    expectSchemaError("dispositions", { items: [{ finding_id: "x", action: "ignore", evidence: "secret-value" }] }, "/items/0/action");
    expectSchemaError("round-run-result", { intent: {}, fenced: "secret-value" }, "/fenced");
  });
});
