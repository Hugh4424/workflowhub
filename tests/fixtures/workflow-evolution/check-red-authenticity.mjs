#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const [suite, phase = "red", exitText = "1", baselineExitText = "1", baselineHash = "", outputHash = "", outputRef = ""] = process.argv.slice(2);
const suites = {
  "pool-tax": ["tests/contract/workflow-evolution-candidates.test.mjs"],
  "ledger-brief": ["tests/contract/workflow-evolution-ledgers.test.mjs", "tests/contract/generate-iteration-brief.test.mjs", "tests/contract/check-skill-updates.test.mjs"],
  monitor: ["tests/contract/build-reflection-page.test.mjs"],
  governance: ["tests/contract/workflow-evolution-governance.test.mjs", "tests/e2e/workflow-evolution-current.test.mjs", "tests/contract/public-behavior-baseline.test.mjs"],
};
const EXPECTED_BASELINE_SHA256 = "7acdc8b7ec06a88e3bb15aa4b8d89c952eafbc586fb30b28286ded4c8e2b47af";
const exitCode = Number(exitText); const baselineExit = Number(baselineExitText);
if (!suites[suite] || !["red", "green", "verify"].includes(phase) || !Number.isInteger(exitCode) || baselineExit !== 0
    || baselineHash !== EXPECTED_BASELINE_SHA256 || !/^[a-f0-9]{64}$/.test(outputHash) || !outputRef) process.exit(24);
try {
  const baselineRef = resolve("tests/fixtures/workflow-evolution/red-baseline.v1.json"); const baselineBytes = readFileSync(baselineRef); const baseline = JSON.parse(baselineBytes); const test = baseline.tests?.[0];
  if (createHash("sha256").update(baselineBytes).digest("hex") !== EXPECTED_BASELINE_SHA256 || typeof test?.ref !== "string"
      || createHash("sha256").update(readFileSync(resolve(test.ref))).digest("hex") !== test.sha256) process.exit(24);
} catch { process.exit(24); }
if ((phase === "red" && exitCode !== 1) || (phase !== "red" && exitCode !== 0)) process.exit(23);
let report;
let outputBytes;
try {
  outputBytes = readFileSync(resolve(outputRef));
  report = JSON.parse(outputBytes);
} catch {
  process.exit(24);
}
if (createHash("sha256").update(outputBytes).digest("hex") !== outputHash
    || typeof report !== "object" || report === null || !Array.isArray(report.testResults)
    || !Number.isInteger(report.numTotalTests) || !Number.isInteger(report.numPassedTests) || !Number.isInteger(report.numFailedTests)
    || typeof report.success !== "boolean") process.exit(23);
const expectedTests = [...suites[suite], ...(suite === "pool-tax" && phase !== "red"
  ? ["tests/contract/derive-consumption-edges.test.mjs", "tests/contract/stage-reflection-skill-contract.test.mjs"]
  : [])].sort();
const reportedTests = report.testResults.map((result) => {
  if (!result || !["passed", "failed"].includes(result.status) || !Array.isArray(result.assertionResults) || result.assertionResults.length === 0
      || result.assertionResults.some((assertion) => !assertion || !["passed", "failed"].includes(assertion.status) || typeof assertion.fullName !== "string")) process.exit(23);
  const absolute = resolve(result?.name ?? "");
  const relative = absolute.startsWith(`${process.cwd()}/`) ? absolute.slice(process.cwd().length + 1) : "";
  return relative;
}).sort();
const failedAssertions = report.testResults.flatMap((result) => result?.assertionResults ?? []).filter((assertion) => assertion?.status === "failed");
const reportedFailure = report.success === false || report.numFailedTests > 0 || report.numFailedTestSuites > 0 || failedAssertions.length > 0
  || report.testResults.some((result) => result?.status === "failed");
const sameTests = expectedTests.length === reportedTests.length && expectedTests.every((test, index) => test === reportedTests[index]);
if (!sameTests
    || report.numTotalTests !== report.numPassedTests + report.numFailedTests + (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0)
    || report.numTotalTests <= 0 || (report.numPendingTests ?? 0) !== 0 || (report.numTodoTests ?? 0) !== 0
    || (phase === "red" && (!reportedFailure || report.success !== false))
    || (phase !== "red" && (reportedFailure || report.success !== true))) process.exit(23);
const materialRefs = ["specs/workflowhub-m16-evolution-20260831/decision-log.md", "specs/workflowhub-m16-evolution-20260831/spec.md", "specs/workflowhub-m16-evolution-20260831/plan.md", "specs/workflowhub-m16-evolution-20260831/tasks.md"];
const materialSha256 = createHash("sha256").update(materialRefs.map((ref) => readFileSync(resolve(ref))).join("\0")).digest("hex");
const gate = { schema_version: "workflow-evolution-gate.v1", suite, phase, command_tests: expectedTests, exit_code: exitCode, baseline_exit_code: baselineExit, baseline_sha256: baselineHash, output_sha256: outputHash, material_sha256: materialSha256, status: exitCode === 0 ? "green" : "red" };
const out = resolve(process.cwd(), {
  "pool-tax": "quality/tests/m16-p1-pool-tax/gate.json",
  "ledger-brief": "quality/tests/m16-p1-ledger-brief/gate.json",
  monitor: "quality/tests/m16-p2-monitor/gate.json",
  governance: "quality/tests/m16-p3-governance/gate.json",
}[suite] ?? `quality/tests/${suite}/gate.json`);
mkdirSync(dirname(out), { recursive: true });
const tmp = `${out}.tmp-${process.pid}`;
const raw = `${JSON.stringify({ ...gate, content_sha256: createHash("sha256").update(JSON.stringify(gate)).digest("hex") }, null, 2)}\n`;
writeFileSync(tmp, raw, "utf8");
renameSync(tmp, out);
if (!existsSync(out) || !readFileSync(out, "utf8")) process.exit(25);
process.exit(exitCode);
