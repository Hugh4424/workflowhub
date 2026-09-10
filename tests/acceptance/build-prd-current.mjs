import { spawnSync } from "node:child_process";

const ACCEPTANCE_CRITERIA = [
  "AC-PRD-001",
  "AC-PRD-002",
  "AC-PRD-003",
  "AC-PRD-004",
  "AC-PRD-005",
  "AC-PRD-006",
  "AC-PRD-007",
  "AC-PRD-008",
  "AC-PRD-009",
  "AC-PRD-010",
];

const targetedTests = [
  "tests/integration/distribution-closure.test.mjs",
  "tests/contract/spec-prd-skill-contract.test.mjs",
  "tests/contract/build-prd-review-contract.test.mjs",
  "tests/integration/build-prd-delivery.test.mjs",
];

const command = [
  "--no-install",
  "vitest",
  "run",
  ...targetedTests,
  "--poolOptions.forks.singleFork",
  "--no-fileParallelism",
  "--reporter=json",
];
const child = spawnSync("npx", command, {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

let report = null;
try {
  report = JSON.parse(child.stdout ?? "");
} catch {
  report = null;
}

const actual = {
  success: report?.success === true,
  failed_tests: Number.isSafeInteger(report?.numFailedTests) ? report.numFailedTests : null,
  passed_tests: Number.isSafeInteger(report?.numPassedTests) ? report.numPassedTests : null,
};
const expected = { success: true, failed_tests: 0, passed_tests: 45 };
const passed = child.status === 0
  && actual.success === expected.success
  && actual.failed_tests === expected.failed_tests
  && actual.passed_tests === expected.passed_tests;

process.stdout.write(`${JSON.stringify({
  entries: ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => ({
    acceptance_criterion_id,
    assertions: [{
      id: "four-targeted-tests",
      expected,
      actual,
    }],
  })),
})}\n`);
process.exitCode = passed ? 0 : (child.status ?? 1) || 1;
