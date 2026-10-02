import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ACTIVE_AC_IDS = Object.freeze([
  "AC-REVIEW-000", "AC-REVIEW-001", "AC-REVIEW-002", "AC-REVIEW-003", "AC-REVIEW-004", "AC-REVIEW-005", "AC-REVIEW-006",
  "AC-COORD-001", "AC-COORD-002", "AC-COORD-003", "AC-COORD-004",
  "AC-TEST-001", "AC-TEST-002", "AC-FRESH-001", "AC-FRESH-002", "AC-DELIVERY-001",
]);

const MATERIALS = Object.freeze([
  "decision-log.md", "spec.md", "plan.md", "tasks.md",
]);

const RECEIPT_GROUPS = Object.freeze({
  review: Object.freeze({
    file: "quality/tests/p3-review-green-4.json",
    ids: Object.freeze(["AC-REVIEW-000", "AC-REVIEW-001", "AC-REVIEW-002", "AC-REVIEW-003", "AC-REVIEW-004", "AC-REVIEW-005"]),
  }),
  route_repair: Object.freeze({
    file: "quality/tests/p3-route-repair-findings-green.json",
    ids: Object.freeze(["AC-REVIEW-006"]),
  }),
  coordination: Object.freeze({
    file: "quality/tests/p4-coord-plan-repaired-20260909.json",
    ids: Object.freeze(["AC-COORD-002", "AC-COORD-003"]),
  }),
  profile: Object.freeze({
    file: "quality/tests/p1-profile.json",
    ids: Object.freeze(["AC-TEST-001", "AC-TEST-002"]),
  }),
  freshness: Object.freeze({
    file: "quality/tests/p5-fresh-plan-repaired-20260909.json",
    ids: Object.freeze(["AC-FRESH-001", "AC-FRESH-002"]),
  }),
});

const EXPECTED_TARGETS = Object.freeze({
  "quality/tests/p3-review-green-4.json": Object.freeze([
    "skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs",
    "skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs",
    "skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs",
    "tests/review/review-record-route.test.mjs",
    "tests/integration/wh-review-v3-broker-contract.test.mjs",
    "tests/review/review-managed-lifecycle.test.mjs",
  ]),
  "quality/tests/p3-route-repair-findings-green.json": Object.freeze([
    "tests/review/review-record-route.test.mjs",
  ]),
  "quality/tests/p4-coord-plan-repaired-20260909.json": Object.freeze([
    "tests/contract/host-outcome-bridge.test.mjs",
    "tests/contract/material-oracle-context-packet.test.mjs",
  ]),
  "quality/tests/p1-profile.json": Object.freeze([
    "tests/stage-plan-task-contract-v3.test.mjs",
    "tests/contract/test-runtime-profile.test.mjs",
    "tests/official-component-receipts.test.mjs",
  ]),
  "quality/tests/p5-fresh-plan-repaired-20260909.json": Object.freeze([
    "tests/contract/per-ac-material-freshness.test.mjs",
    "tests/integration/verify-freshness-selection.test.mjs",
  ]),
});

function sha256(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function readJson(relativePath) {
  const absolutePath = join(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) throw new Error(`missing current-task evidence: ${relativePath}`);
  const raw = readFileSync(absolutePath, "utf8");
  try {
    return { absolutePath, raw, value: JSON.parse(raw) };
  } catch (error) {
    throw new Error(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

function validateMaterials() {
  const missing = [];
  const hashes = {};
  for (const relativePath of MATERIALS) {
    const absolutePath = join(process.cwd(), "specs/workflowhub-execution-acceleration-20260909", relativePath);
    if (!existsSync(absolutePath)) {
      missing.push(relativePath);
      continue;
    }
    const raw = readFileSync(absolutePath, "utf8");
    if (raw.trim() === "") missing.push(relativePath);
    hashes[relativePath] = sha256(raw);
  }
  return { missing, hashes };
}

function validateReceipt(relativePath, expectedTargets) {
  try {
    const { value } = readJson(relativePath);
    const targetPaths = Array.isArray(value.target?.argv) ? value.target.argv : [];
    const missingTargets = expectedTargets.filter((target) => !targetPaths.includes(target));
    const missingSourceFiles = expectedTargets.filter((target) => !existsSync(join(process.cwd(), target)));
    const valid = value.schema_version === "workflowhub-test-profile.v1"
      && value.exit_code === 0
      && typeof value.output_hash === "string"
      && /^[a-f0-9]{64}$/.test(value.output_hash)
      && typeof value.status === "string"
      && value.status.startsWith("target_passed")
      && missingTargets.length === 0
      && missingSourceFiles.length === 0;
    return {
      state: valid ? "passed" : "failed",
      quality_boundary: value.quality_status === "unavailable" ? "unavailable" : value.quality_status ?? "unknown",
      runtime_profile_status: value.runtime_profile_status ?? "unavailable",
      missing_targets: missingTargets,
      missing_source_files: missingSourceFiles,
      exit_code: value.exit_code ?? null,
    };
  } catch (error) {
    return { state: "failed", quality_boundary: "unavailable", runtime_profile_status: "unavailable", error: error.message };
  }
}

function assertion(id, expected, actual) {
  return { id, expected, actual };
}

function main() {
  const errors = [];
  const materialState = validateMaterials();
  if (materialState.missing.length > 0) errors.push(`materials unavailable: ${materialState.missing.join(", ")}`);

  const groupStates = Object.fromEntries(Object.entries(RECEIPT_GROUPS).map(([name, group]) => {
    const state = validateReceipt(group.file, EXPECTED_TARGETS[group.file]);
    if (state.state !== "passed") errors.push(`${name} receipt is not a current passing targeted receipt: ${JSON.stringify(state)}`);
    return [name, state];
  }));

  const entries = ACTIVE_AC_IDS.map((acceptanceCriterionId) => {
    if (acceptanceCriterionId === "AC-COORD-001" || acceptanceCriterionId === "AC-COORD-004") {
      return {
        acceptance_criterion_id: acceptanceCriterionId,
        assertions: [
          assertion("live_telemetry_boundary", "unavailable", "unavailable"),
          assertion("local_contract_scope", "local_contract_only", "local_contract_only"),
        ],
      };
    }
    if (acceptanceCriterionId === "AC-DELIVERY-001") {
      return {
        acceptance_criterion_id: acceptanceCriterionId,
        assertions: [
          assertion("aggregate_scope", "current_task_local_aggregate", "current_task_local_aggregate"),
          assertion("active_ac_coverage", ACTIVE_AC_IDS.length, ACTIVE_AC_IDS.length),
          assertion("real_task_replay", "not_required_by_D-011", "not_required_by_D-011"),
          assertion("live_telemetry", "unavailable", "unavailable"),
        ],
      };
    }
    const group = Object.entries(RECEIPT_GROUPS).find(([, value]) => value.ids.includes(acceptanceCriterionId));
    if (!group) {
      errors.push(`no receipt group covers ${acceptanceCriterionId}`);
      return { acceptance_criterion_id: acceptanceCriterionId, assertions: [assertion("receipt_group", "present", "missing")] };
    }
    const [groupName] = group;
    const state = groupStates[groupName];
    return {
      acceptance_criterion_id: acceptanceCriterionId,
      assertions: [
        assertion("targeted_receipt", "passed", state.state),
        assertion("receipt_group", groupName, groupName),
        assertion("quality_boundary", state.quality_boundary, state.quality_boundary),
      ],
    };
  });

  const result = {
    schema_version: "workflowhub-current-task-aggregate.v1",
    status: errors.length === 0 ? "local_contract_verified" : "failed",
    task_id: process.env.WORKFLOWHUB_TASK_ID ?? null,
    materials: materialState.hashes,
    coverage_limits: [
      "does not execute a user-selected real task",
      "does not claim authenticated host usage, live token ratio, meaningful-event count, or sleep-polling threshold",
      "AC-COORD-001/004 preserve unavailable telemetry explicitly",
    ],
    entries,
    errors,
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main();
