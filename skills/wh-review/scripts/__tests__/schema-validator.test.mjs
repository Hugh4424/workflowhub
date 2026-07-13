import { describe, expect, it } from "vitest";
import { validateSchema } from "../schema-validator.mjs";

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
    for (const name of ["review-packet", "review-intent", "reviewer-output", "dispositions", "round-run-result"]) {
      expect(() => validateSchema(name, name === "dispositions" ? { items: [] } : {})).toThrowError();
    }
  });

  it("rejects unknown packet fields with a stable code and JSON pointer", () => {
    expectSchemaError("review-packet", {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, unified_diff: "", changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "x", test_evidence: [], host_verified_facts: [],
      contract_hash: hash, skill_bundle_hash: hash, source_revision: { base: "b".repeat(40), head: "c".repeat(40) },
      fenced: "secret-value",
    }, "/fenced");
  });

  it("accepts null old_path for non-renames but rejects it for renames", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, unified_diff: "", raw_requirement: "x", acceptance_design_excerpt: "x",
      test_evidence: [], host_verified_facts: [], contract_hash: hash, skill_bundle_hash: hash,
      source_revision: { base: "b".repeat(40), head: "c".repeat(40) },
      changed_files: [{ path: "a", old_path: null, status: "modified", sha256: hash, size: 1, old_sha256: hash, old_size: 1 }],
    };
    expect(validateSchema("review-packet", packet)).toBe(packet);
    packet.changed_files[0].status = "renamed";
    expectSchemaError("review-packet", packet, "/changed_files/0/old_path");
  });

  it("rejects an invalid review track and unknown intent controls", () => {
    const intent = {
      task_id: "t", stage: "build-code", review_track: "direction", review_flow_id: "f", business_round: 1,
      round_kind: "initial", baseline_packet_hash: hash, contract_hash: hash, material_manifest_hash: hash,
      skill_bundle_hash: hash, idempotency_key: "i", host_provider: "secret-value",
    };
    expectSchemaError("review-intent", intent, "/host_provider");
    delete intent.host_provider;
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
