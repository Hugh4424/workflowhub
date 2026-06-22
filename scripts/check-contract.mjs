#!/usr/bin/env node
/**
 * check-contract.mjs  (FR-NC-005)
 *
 * Validates contracts/component-output.contract.json structure and content.
 *
 * Checks:
 *   (a) Structural: version is a string, validated_by_stage is present,
 *       required_fields is an array with exactly component_id:string + output_path:string.
 *   (b) FR-NC-005 path-only constraint: required_fields name set must equal
 *       exactly {component_id, output_path} — any extra business-content field → exit 1.
 *   (c) validateContract smoke: runs accept/reject samples through validateContract
 *       to confirm the contract accepts valid output and rejects invalid output.
 *
 * Exit codes: 0 pass, 1 check failure, 2 unexpected error.
 * Flags: --contract <path>   use a custom contract file (default: contracts/component-output.contract.json)
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContract } from "../core/validate-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// ---------------------------------------------------------------------------
// Parse --contract flag
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let contractPath = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--contract" && args[i + 1]) {
      contractPath = args[i + 1];
      i++;
    }
  }
  return { contractPath };
}

// ---------------------------------------------------------------------------
// Allowed required_fields names (FR-NC-005: path-only constraint)
// ---------------------------------------------------------------------------

const ALLOWED_FIELD_NAMES = new Set(["component_id", "output_path"]);

// ---------------------------------------------------------------------------
// Main checker logic
// ---------------------------------------------------------------------------

function checkContract(contractPath) {
  const failures = [];

  // Load contract
  let raw;
  try {
    raw = readFileSync(contractPath, "utf8");
  } catch (err) {
    console.error(`[check-contract] ERROR: cannot read contract file: ${contractPath}`);
    console.error(`  ${err.message}`);
    process.exit(2);
  }

  let contract;
  try {
    contract = JSON.parse(raw);
  } catch (err) {
    console.error(`[check-contract] ERROR: contract file is not valid JSON: ${err.message}`);
    process.exit(2);
  }

  // (a) Structural checks

  // version must be a string
  if (!("version" in contract)) {
    failures.push('missing field: "version"');
  } else if (typeof contract.version !== "string") {
    failures.push(`"version" must be a string, got ${typeof contract.version}`);
  }

  // validated_by_stage must be present (may be null)
  if (!("validated_by_stage" in contract)) {
    failures.push('missing field: "validated_by_stage" (must be present, may be null)');
  }

  // required_fields must be an array
  if (!Array.isArray(contract.required_fields)) {
    failures.push('"required_fields" must be an array');
  } else {
    const fieldNames = contract.required_fields.map((f) => f.name);
    const fieldNameSet = new Set(fieldNames);

    // T010 exact-structure: must have exactly 2 entries (component_id + output_path, no more)
    if (contract.required_fields.length !== 2) {
      failures.push(
        `"required_fields" must have exactly 2 entries, got ${contract.required_fields.length}`
      );
    }

    // T010 exact-structure: no duplicate names allowed
    if (fieldNames.length !== fieldNameSet.size) {
      const seen = new Set();
      for (const name of fieldNames) {
        if (seen.has(name)) {
          failures.push(`"required_fields" contains duplicate name: "${name}"`);
        }
        seen.add(name);
      }
    }

    // (b) FR-NC-005: path-only constraint — name set must equal exactly ALLOWED_FIELD_NAMES
    for (const name of fieldNameSet) {
      if (!ALLOWED_FIELD_NAMES.has(name)) {
        failures.push(
          `FR-NC-005 violation: unexpected field "${name}" in required_fields — ` +
          `not allowed (only ${[...ALLOWED_FIELD_NAMES].join(", ")} are permitted as path-only fields)`
        );
      }
    }
    for (const name of ALLOWED_FIELD_NAMES) {
      if (!fieldNameSet.has(name)) {
        failures.push(`required field "${name}" is missing from required_fields`);
      }
    }

    // Each field entry must have name:string and type:string
    for (const field of contract.required_fields) {
      if (typeof field.name !== "string") {
        failures.push(`required_fields entry has non-string name: ${JSON.stringify(field)}`);
      }
      if (typeof field.type !== "string") {
        failures.push(`required_fields entry "${field.name}" has non-string type: ${JSON.stringify(field)}`);
      }
    }
  }

  // (c) validateContract smoke — only run if structural checks passed so far
  if (failures.length === 0) {
    // Valid sample: must pass
    const validSample = { component_id: "comp-abc", output_path: "/tmp/out.json" };
    const validResult = validateContract(validSample, contract);
    if (!validResult.valid) {
      failures.push(
        `validateContract rejected a valid sample output: ${validResult.errors.join(", ")}`
      );
    } else {
      console.log("[check-contract] valid sample PASS — validateContract accepted { component_id, output_path }");
    }

    // Invalid sample: missing output_path — must be rejected
    const invalidSample = { component_id: "comp-abc" };
    const invalidResult = validateContract(invalidSample, contract);
    if (invalidResult.valid) {
      failures.push(
        `validateContract accepted an invalid sample (missing output_path) — contract is too permissive`
      );
    } else {
      console.log("[check-contract] invalid sample correctly rejected by validateContract");
    }
  }

  return failures;
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

function main() {
  const { contractPath: argPath } = parseArgs();
  const contractPath = argPath
    ? resolve(argPath)
    : resolve(repoRoot, "contracts", "component-output.contract.json");

  console.log(`[check-contract] checking: ${contractPath}`);

  let failures;
  try {
    failures = checkContract(contractPath);
  } catch (err) {
    console.error("[check-contract] Unexpected error:", err.message);
    process.exit(2);
  }

  if (failures.length === 0) {
    console.log("[check-contract] PASS — contract structure and FR-NC-005 path-only constraint verified");
    process.exit(0);
  } else {
    for (const f of failures) {
      console.error(`[check-contract] FAIL: ${f}`);
    }
    console.error(`[check-contract] ${failures.length} check(s) failed`);
    process.exit(1);
  }
}

// Run only when invoked directly (not imported by tests)
const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  try {
    main();
  } catch (err) {
    console.error("[check-contract] Unexpected error:", err.message);
    process.exit(2);
  }
}
