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
function decodeStringLiteral(raw, quote) {
  return raw.replace(/\\([\\'"`])/g, "$1").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
}
function quotedStrings(raw) {
  const values = [];
  for (let index = 0; index < raw.length;) {
    const quote = raw[index];
    if (!["'", '"', "`"].includes(quote)) { index += 1; continue; }
    let end = index + 1; let escaped = false;
    for (; end < raw.length; end += 1) {
      const char = raw[end];
      if (escaped) { escaped = false; continue; }
      if (char === "\\") { escaped = true; continue; }
      if (char === quote) break;
    }
    if (end >= raw.length) break;
    values.push(decodeStringLiteral(raw.slice(index + 1, end), quote)); index = end + 1;
  }
  return values;
}
function matchingParen(source, open) {
  let depth = 0; let quote = null; let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (["'", '"', "`"].includes(char)) { quote = char; continue; }
    if (char === "(") depth += 1;
    else if (char === ")" && --depth === 0) return index;
  }
  return -1;
}
function parameterizedTitles(source) {
  const titles = [];
  for (const call of source.matchAll(/\bit\.each\s*\(/g)) {
    const open = call.index + call[0].length - 1;
    const close = matchingParen(source, open);
    if (close < 0) continue;
    const table = source.slice(open + 1, close).trim();
    if (!table.startsWith("[")) continue;
    const titleMatch = source.slice(close + 1).match(/^\s*\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/);
    if (!titleMatch) continue;
    const template = decodeStringLiteral(titleMatch[2], titleMatch[1]);
    let depth = 0; let rowStart = -1; let quote = null; let escaped = false;
    for (let index = 0; index < table.length; index += 1) {
      const char = table[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (["'", '"', "`"].includes(char)) { quote = char; continue; }
      if (char === "[") { depth += 1; if (depth === 2) rowStart = index + 1; }
      else if (char === "]") {
        if (depth === 2 && rowStart >= 0) {
          const args = quotedStrings(table.slice(rowStart, index)); let argIndex = 0;
          titles.push(template.replace(/%[sdifjoO]/g, (token) => token === "%%" ? "%%" : String(args[argIndex++] ?? token)));
          rowStart = -1;
        }
        depth -= 1;
      }
    }
  }
  return titles;
}
const sourceAssertions = new Map(expectedTests.map((test) => {
  const source = readFileSync(resolve(test), "utf8");
  const titles = [
    ...[...source.matchAll(/\bit(?:\.(?:runIf|skipIf)\s*\([^)]*\)|\.(?:skip|only|todo))?\s*\(\s*(["'`])([^"'`]+)\1/g)].map((match) => match[2]),
    ...parameterizedTitles(source),
  ].sort();
  if (titles.length === 0) process.exit(23);
  return [test, titles];
}));
for (const result of report.testResults) {
  const absolute = resolve(result.name ?? "");
  const relative = absolute.startsWith(`${process.cwd()}/`) ? absolute.slice(process.cwd().length + 1) : "";
  const actualTitles = result.assertionResults.map((assertion) => assertion.title).sort();
  const expectedTitles = sourceAssertions.get(relative) ?? [];
  if (actualTitles.length !== expectedTitles.length || actualTitles.some((title, index) => title !== expectedTitles[index])) process.exit(23);
}
const failedAssertions = report.testResults.flatMap((result) => result?.assertionResults ?? []).filter((assertion) => assertion?.status === "failed");
const allAssertions = report.testResults.flatMap((result) => result.assertionResults);
const passedAssertions = allAssertions.filter((assertion) => assertion.status === "passed");
const reportedFailure = report.success === false || report.numFailedTests > 0 || report.numFailedTestSuites > 0 || failedAssertions.length > 0
  || report.testResults.some((result) => result?.status === "failed");
const sameTests = expectedTests.length === reportedTests.length && expectedTests.every((test, index) => test === reportedTests[index]);
if (!sameTests
    || report.numTotalTests !== report.numPassedTests + report.numFailedTests + (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0)
    || allAssertions.length !== report.numTotalTests || passedAssertions.length !== report.numPassedTests || failedAssertions.length !== report.numFailedTests
    || report.numTotalTests <= 0 || (report.numPendingTests ?? 0) !== 0 || (report.numTodoTests ?? 0) !== 0
    || (phase === "red" && (!reportedFailure || report.success !== false))
    || (phase !== "red" && (reportedFailure || report.success !== true))) process.exit(23);
const materialRefs = ["specs/workflowhub-m16-evolution-20260831/decision-log.md", "specs/workflowhub-m16-evolution-20260831/spec.md", "specs/workflowhub-m16-evolution-20260831/plan.md", "specs/workflowhub-m16-evolution-20260831/tasks.md"];
const materialSha256 = createHash("sha256").update(materialRefs.map((ref) => readFileSync(resolve(ref))).join("\0")).digest("hex");
const suiteSourcesSha256 = createHash("sha256").update(expectedTests.map((ref) => `${ref}\0${createHash("sha256").update(readFileSync(resolve(ref))).digest("hex")}`).join("\n")).digest("hex");
const gate = { schema_version: "workflow-evolution-gate.v1", suite, phase, command_tests: expectedTests, exit_code: exitCode, baseline_exit_code: baselineExit, baseline_sha256: baselineHash, output_sha256: outputHash, suite_sources_sha256: suiteSourcesSha256, material_sha256: materialSha256, status: exitCode === 0 ? "green" : "red" };
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
