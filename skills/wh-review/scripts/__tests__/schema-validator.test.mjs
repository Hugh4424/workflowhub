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
      diff_sha256: hash, unified_diff: "", changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "x", test_evidence: [], host_verified_facts: [],
      contract_hash: hash, skill_bundle_hash: hash, source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
      fenced: "secret-value",
    }, "/fenced");
  });

  it("accepts null old_path for non-renames but rejects it for renames", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, unified_diff: "", raw_requirement: "x", acceptance_design_excerpt: "x",
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
      diff_sha256: hash, unified_diff: "", changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "x", test_evidence: [], host_verified_facts: [], contract_hash: hash, skill_bundle_hash: hash,
      source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
    };
    expect(validateSchema("review-packet", packet)).toBe(packet);
    packet.source_revision = { base: "b".repeat(40), head: "c".repeat(40) };
    expectSchemaError("review-packet", packet, "/source_revision/base");
  });

  it("requires typed evidence records while allowing empty evidence arrays", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "build-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, unified_diff: "", changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "x", contract_hash: hash, skill_bundle_hash: hash,
      source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
      test_evidence: [], host_verified_facts: [],
    };
    expect(validateSchema("review-packet", packet)).toBe(packet);

    packet.test_evidence = [{ fact_id: "test-unit", kind: "command", source: "npm test", captured_at: "2026-07-15T00:00:00Z", sha256: hash, status: "passed", exit_code: 0 }];
    packet.host_verified_facts = [{ fact_id: "tree", kind: "source-tree", source: "git", captured_at: "2026-07-15T00:00:00Z", sha256: hash, value: { clean: true } }];
    expect(validateSchema("review-packet", packet)).toBe(packet);

    for (const invalid of ["passed", {}, { fact_id: "x", kind: "command", source: "npm test", captured_at: "2026-07-15T00:00:00Z", sha256: hash }]) {
      packet.test_evidence = [invalid];
      try { validateSchema("review-packet", packet); throw new Error("expected typed evidence rejection"); }
      catch (error) { expect(error).toMatchObject({ code: "SCHEMA_VALIDATION_FAILED", schema: "review-packet" }); expect(error.pointer).toMatch(/^\/test_evidence\/0(?:\/|$)/); }
    }
    packet.test_evidence = [{ fact_id: "artifact", kind: "artifact", source: "result.json", captured_at: "2026-07-15T00:00:00Z", sha256: hash, status: "passed", exit_code: 0 }];
    expectSchemaError("review-packet", packet, "/test_evidence/0/kind");
  });

  it("requires typed verification closure records", () => {
    const packet = {
      version: "review-packet.v1", round_kind: "initial", baseline_packet_hash: null,
      stage: "verify-code", review_track: null, packet_hash: hash, manifest_hash: hash,
      diff_sha256: hash, unified_diff: "", changed_files: [], raw_requirement: "x",
      acceptance_design_excerpt: "AC1: x", contract_hash: hash, skill_bundle_hash: hash,
      source_revision: { base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40), captured_head: "d".repeat(40) },
      test_evidence: [], host_verified_facts: [], verification_closure: [],
    };
    expect(validateSchema("review-packet", packet)).toBe(packet);
    packet.verification_closure = [{ closure_id: "ac-1", subject_type: "acceptance", subject_id: "AC1", status: "closed", source: "acceptance-report.md#AC1", captured_at: "2026-07-15T00:00:00Z", sha256: hash, evidence: "AC1 is closed by the bound test evidence" }];
    expect(validateSchema("review-packet", packet)).toBe(packet);
    for (const invalid of ["closed", {}, { closure_id: "ac-1", subject_type: "acceptance", subject_id: "AC1", status: "closed" }]) {
      packet.verification_closure = [invalid];
      try { validateSchema("review-packet", packet); throw new Error("expected typed closure rejection"); }
      catch (error) { expect(error).toMatchObject({ code: "SCHEMA_VALIDATION_FAILED", schema: "review-packet" }); expect(error.pointer).toMatch(/^\/verification_closure\/0(?:\/|$)/); }
    }
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
      packet_status: "complete", verdict: "revise_required", summary: "x", findings: [], checklist: [],
      pass_items: [], skillResults: [], rootCause: "", fixApproach: "   ",
    };
    expectSchemaError("reviewer-output", value, "/rootCause");
  });

  it("keeps host hashes out of the provider output contract", () => {
    const value = { packet_status: "complete", verdict: "pass", summary: "reviewed", findings: [], checklist: [], pass_items: [], skillResults: [] };
    expect(validateSchema("reviewer-output", value)).toBe(value);
    value.packet_hash = hash;
    expectSchemaError("reviewer-output", value, "/packet_hash");
  });

  it("rejects malformed dispositions and round results", () => {
    expectSchemaError("dispositions", { items: [{ finding_id: "x", action: "ignore", evidence: "secret-value" }] }, "/items/0/action");
    expectSchemaError("round-run-result", { intent: {}, fenced: "secret-value" }, "/fenced");
  });
});
