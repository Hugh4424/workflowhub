import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { extractAcceptanceCriteria, validateCoverage } from "../../tools/architecture/verify-final-coverage.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");

describe("final direct coverage contract", () => {
  test("extracts unique acceptance criteria from the spec", () => {
    const spec = "- [ ] **AC-01**: one\n- [x] **AC-02**: two\n- [ ] **AC-01**: duplicate\n";
    expect(extractAcceptanceCriteria(spec)).toEqual(["AC-01", "AC-02"]);
  });

  test("rejects a missing or tampered direct evidence reference", () => {
    const fixture = path.join(ROOT, "tests/fixtures/mutations/identity-tree-hash.json");
    const coverage = {
      schema_version: "workflowhub-final-coverage.v1",
      snapshot_tree: "tree",
      items: [{ acceptance_criterion_id: "AC-01", status: "focused_pass", evidence_refs: [{ ref: "tests/fixtures/mutations/identity-tree-hash.json", sha256: "0".repeat(64) }] }],
    };
    const errors = validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] });
    expect(errors.some((error) => error.includes("hash mismatch"))).toBe(true);
    expect(fs.existsSync(fixture)).toBe(true);
  });

  test("accepts focused evidence while exposing deferred full verification", () => {
    const ref = "tests/fixtures/mutations/identity-tree-hash.json";
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
    const coverage = {
      schema_version: "workflowhub-final-coverage.v1",
      snapshot_tree: "tree",
      items: [{ acceptance_criterion_id: "AC-01", status: "deferred", evidence_refs: [{ ref, sha256: hash }] }],
    };
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] })).toEqual([]);
  });
});
