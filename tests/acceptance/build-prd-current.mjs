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

// The named inventory, not only the total, is the regression guard. A total
// floor alone lets tests disappear from one file while the sum stays above the
// floor. Each declared suite must therefore still be present and still
// contribute at least the tests it contributed when this floor was last
// reviewed. Additions are free; a removal or an emptied file fails.
const targetedTests = [
  { file: "tests/integration/distribution-closure.test.mjs", minimum_passed: 22 },
  { file: "tests/contract/spec-prd-skill-contract.test.mjs", minimum_passed: 13 },
  { file: "tests/contract/build-prd-review-contract.test.mjs", minimum_passed: 10 },
  { file: "tests/integration/build-prd-delivery.test.mjs", minimum_passed: 9 },
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
