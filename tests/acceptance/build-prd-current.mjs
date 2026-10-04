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

// Execute each actual ordinary portable/review/publication consumer in full.
// The retired distribution-closure and receipt-delivery actors are not inputs.
// Every selected suite must execute at least one case; these observations do
// not certify external review, product acceptance or overall stage completion.
const targetedTests = [
  { file: "tests/contract/portable-workflow-run.test.mjs", minimum_passed: 1 },
  { file: "tests/contract/build-prd-review-contract.test.mjs", minimum_passed: 1 },
  { file: "core/__tests__/local-skill-resolver.test.mjs", minimum_passed: 1 },
  { file: "tests/contract/runner-contract.test.mjs", minimum_passed: 1 },
];

const command = [
  "--no-install",
  "vitest",
  "run",
  ...targetedTests.map(({ file }) => file),
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

const observedFiles = Array.isArray(report?.testResults)
  ? report.testResults.map((entry) => ({
    name: String(entry?.name ?? "").replace(/\\/g, "/"),
    passed: Array.isArray(entry?.assertionResults)
      ? entry.assertionResults.filter((assertion) => assertion?.status === "passed").length
      : 0,
  }))
  : [];
const observedFor = (file) => observedFiles.find((entry) => entry.name.endsWith(file)) ?? null;

const actual = {
  success: report?.success === true,
  failed_tests: Number.isSafeInteger(report?.numFailedTests) ? report.numFailedTests : null,
  passed_tests: Number.isSafeInteger(report?.numPassedTests) ? report.numPassedTests : null,
  files: Object.fromEntries(targetedTests.map(({ file }) => [file, observedFor(file)?.passed ?? null])),
};
const expected = {
  success: true,
  failed_tests: 0,
  passed_tests: targetedTests.reduce((total, { minimum_passed }) => total + minimum_passed, 0),
  files: Object.fromEntries(targetedTests.map(({ file, minimum_passed }) => [file, `>=${minimum_passed}`])),
};
const missingOrShrunk = targetedTests
  .filter(({ file, minimum_passed }) => (observedFor(file)?.passed ?? -1) < minimum_passed)
  .map(({ file }) => file);
const passed = child.status === 0
  && actual.success === expected.success
  && actual.failed_tests === expected.failed_tests
  && actual.passed_tests >= expected.passed_tests
  && missingOrShrunk.length === 0;

process.stdout.write(`${JSON.stringify({
  coverage_limits: ["ordinary selected consumer observations; not full external product acceptance or stage completion"],
  entries: ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => ({
    acceptance_criterion_id,
    assertions: [{
      id: "named-targeted-test-inventory",
      expected,
      actual,
      ...(missingOrShrunk.length === 0 ? {} : { missing_or_shrunk: missingOrShrunk }),
    }],
  })),
})}\n`);
process.exitCode = passed ? 0 : (child.status ?? 1) || 1;
