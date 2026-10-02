import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import process from "node:process";

const ROOT = realpathSync(process.cwd());
const CHILD_TIMEOUT_MS = 570_000;
const COLLECTOR_VERSION = "planning-workflow-hardening-acceptance.v1";

const TEST_FILES = Object.freeze([
  "tests/contract/decision-convergence-depth.test.mjs",
  "tests/contract/stage-interaction-batching.test.mjs",
  "tests/contract/decision-log-chain-warnings.test.mjs",
  "tests/contract/stage-reflection-wiring.test.mjs",
  "tests/contract/spec-prd-skill-contract.test.mjs",
  "tests/contract/build-prd-review-contract.test.mjs",
  "tests/integration/build-prd-delivery.test.mjs",
  "tests/close/close-contract.test.mjs",
  "tests/decision-log-content-contract.test.mjs",
]);

const ACCEPTANCE_CRITERIA = Object.freeze([
  "AC-TYPE-001",
  "AC-ASK-001",
  "AC-ASK-002",
  "AC-ASK-003",
  "AC-PRD-001",
  "AC-CHECK-001",
  "AC-CHAIN-001",
  "AC-PRD-002",
  "AC-CHILD-001",
  "AC-CHILD-002",
  "AC-CONTRACT-001",
  "AC-REFLECT-001",
  "AC-META-001",
  "AC-CLOSE-001",
  "AC-CLOSE-002",
  "AC-CLOSE-003",
]);

const QUALITATIVE_AC_REASONS = Object.freeze({
  "AC-ASK-002": "D029：未取得真实用户需求提问定性证据，结构化夹具不能替代实际对话观察",
  "AC-ASK-003": "D029：未取得真实用户选项理解与方向收敛定性证据，结构化夹具不能替代实际对话观察",
  "AC-CHILD-001": "D029：未取得真实子任务接手与边界行为定性证据，结构化合同不能替代实际执行观察",
});

const childArgs = Object.freeze([
  "node_modules/vitest/vitest.mjs",
  "run",
  ...TEST_FILES,
  "--poolOptions.forks.singleFork",
  "--no-fileParallelism",
  "--reporter=json",
]);

function selector(file, describeTitle, title, group) {
  return Object.freeze({ file, ancestors: [describeTitle], title, group });
}

const S = Object.freeze({
  typeAccepted: selector(
    TEST_FILES[0],
    "planning-hardening task type declaration",
    "planning-hardening AC-TYPE-001 accepts exactly one controlled declaration in the task identity section",
    "T001/T002",
  ),
  typeRejected: selector(
    TEST_FILES[0],
    "planning-hardening task type declaration",
    "planning-hardening AC-TYPE-001 fails closed for missing, duplicate, conflicting, unknown, or out-of-section declarations",
    "T001/T002",
  ),
  directionSlots: selector(
    TEST_FILES[1],
    "planning-hardening question boundary",
    "planning-hardening AC-ASK-001/002/003 and AC-PRD-001 document type-first branching and the six direction slots",
    "T001/T002",
  ),
  optionContract: selector(
    TEST_FILES[1],
    "planning-hardening question boundary",
    "planning-hardening AC-ASK-003 keeps each option understandable with meaning, consequence, and risk",
    "T001/T002",
  ),
  implementationBoundary: selector(
    TEST_FILES[1],
    "planning-hardening question boundary",
    "planning-hardening AC-ASK-001/002 rejects implementation-detail axes only for planning tasks",
    "T001/T002",
  ),
  chainRecognized: selector(
    TEST_FILES[2],
    "planning-hardening decision-log chain disclosure",
    "planning-hardening AC-CHAIN-001 recognizes h3 and h4 decisions and preserves real missing-field warnings",
    "T003/T004",
  ),
  chainEmpty: selector(
    TEST_FILES[2],
    "planning-hardening decision-log chain disclosure",
    "planning-hardening AC-CHAIN-001 explicitly warns when no decision entries are recognized",
    "T003/T004",
  ),
  manifestDisclosure: selector(
    TEST_FILES[3],
    "stage-reflection workflow wiring",
    "planning-hardening AC-CHECK-001 requires per-manifest status disclosure with separate output and completion facts",
    "T003/T004",
  ),
  prdJourney: selector(
    TEST_FILES[4],
    "planning-hardening PRD handoff contracts",
    "planning-hardening AC-PRD-001 keeps a complete journey and per-requirement ownership",
    "T005/T006",
  ),
  childBoundary: selector(
    TEST_FILES[4],
    "planning-hardening PRD handoff contracts",
    "planning-hardening AC-CHILD-001/002 keeps child work read-only and records boundary drift",
    "T005/T006",
  ),
  taskCardFields: selector(
    TEST_FILES[4],
    "planning-hardening PRD handoff contracts",
    "planning-hardening AC-CONTRACT-001 preserves all 16 existing task-card fields",
    "T005/T006",
  ),
  prdWriter: selector(
    TEST_FILES[4],
    "ORACLE-P2-SPEC-PRD",
    "ships one spec-prd writer with exactly two calls and map-before-detail ordering",
    "T005/T006",
  ),
  prdTemplate: selector(
    TEST_FILES[4],
    "ORACLE-P2-SPEC-PRD",
    "uses a navigable PRD template with shared definitions and complete task-card handoff fields",
    "T005/T006",
  ),
  reflectionHandoff: selector(
    TEST_FILES[5],
    "planning-hardening portable reflection contracts",
    "planning-hardening AC-REFLECT-001/AC-META-001 declares one save-read handoff with bound payload fields",
    "T007/T008",
  ),
  reflectionBoundary: selector(
    TEST_FILES[5],
    "planning-hardening portable reflection contracts",
    "planning-hardening AC-CHECK-001/AC-CLOSE-002 keeps portable reflection separate from formal stage and close approval",
    "T007/T008",
  ),
  closeDefaultIntegration: selector(
    TEST_FILES[6],
    "planning-hardening unarchived planning close",
    "uses four default actions for a declared planning task and leaves materials at the source path",
    "T009/T010",
  ),
  closeLegacyIntegration: selector(
    TEST_FILES[6],
    "planning-hardening unarchived planning close",
    "keeps ordinary close and explicit legacy planning mode at five actions",
    "T009/T010",
  ),
  closePushFailure: selector(
    TEST_FILES[6],
    "planning-hardening unarchived planning close",
    "does not archive or write completion when the four-action push fails",
    "T009/T010",
  ),
  closeDefaultContract: selector(
    TEST_FILES[7],
    "planning-hardening unarchived planning close",
    "prepares a declared planning task with four actions and no archive step",
    "T009/T010",
  ),
  closeLegacyContract: selector(
    TEST_FILES[7],
    "planning-hardening unarchived planning close",
    "keeps explicit legacy planning mode on the existing five-action route",
    "T009/T010",
  ),
  archivePlan: selector(
    TEST_FILES[7],
    "planning-hardening unarchived planning close",
    "prepares a two-action archive plan from a saved declaration after initial cleanup",
    "T009/T010",
  ),
  archiveAuth: selector(
    TEST_FILES[7],
    "planning-hardening unarchived planning close",
    "does not move source materials when archive authorization is missing",
    "T009/T010",
  ),
  archiveExecute: selector(
    TEST_FILES[7],
    "planning-hardening unarchived planning close",
    "executes the authorized two-action archive plan without recreating the task worktree",
    "T009/T010",
  ),
});

const P3_SELECTORS = Object.freeze([
  S.closeDefaultIntegration,
  S.closeLegacyIntegration,
  S.closePushFailure,
  S.closeDefaultContract,
  S.closeLegacyContract,
  S.archivePlan,
  S.archiveAuth,
  S.archiveExecute,
]);

const SELECTORS_BY_AC = Object.freeze({
  "AC-TYPE-001": [S.typeAccepted, S.typeRejected],
  "AC-ASK-001": [S.directionSlots, S.implementationBoundary],
  "AC-PRD-001": [S.directionSlots, S.prdJourney],
  "AC-CHECK-001": [S.manifestDisclosure, S.reflectionBoundary],
  "AC-CHAIN-001": [S.chainRecognized, S.chainEmpty],
  "AC-PRD-002": [S.prdWriter, S.prdTemplate],
  "AC-CHILD-002": [S.childBoundary, S.closeDefaultIntegration, S.closeLegacyIntegration, S.closeDefaultContract, S.closeLegacyContract],
  "AC-REFLECT-001": [S.reflectionHandoff],
  "AC-META-001": [S.reflectionHandoff, S.closeDefaultIntegration, S.closeLegacyIntegration, S.closeDefaultContract, S.closeLegacyContract, S.archivePlan],
  "AC-CLOSE-001": [S.closeDefaultIntegration, S.closeDefaultContract],
  "AC-CLOSE-002": [S.reflectionBoundary, ...P3_SELECTORS],
  "AC-CLOSE-003": [S.closeLegacyIntegration, S.closeLegacyContract, S.closePushFailure],
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeText(value) {
  return typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
}

function normalizeFileName(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  let candidate = value;
  try {
    if (candidate.startsWith("file:")) candidate = fileURLToPath(candidate);
  } catch {
    return null;
  }
  const absolute = isAbsolute(candidate) ? candidate : resolve(ROOT, candidate);
  let canonical = absolute;
  try { canonical = realpathSync(absolute); } catch { /* preserve an unavailable path for explicit reporting */ }
  const relativeName = relative(ROOT, canonical).replaceAll("\\", "/");
  return relativeName && !relativeName.startsWith("../") && relativeName !== ".." ? relativeName : null;
}

function normalizeStatus(value) {
  const status = safeText(value).trim().toLowerCase();
  return ({ pass: "passed", passed: "passed", fail: "failed", failure: "failed" })[status] ?? (status || "unknown");
}

function fullNameFor(assertion) {
  if (typeof assertion?.fullName === "string" && assertion.fullName.trim() !== "") return assertion.fullName;
  const ancestors = Array.isArray(assertion?.ancestorTitles) ? assertion.ancestorTitles : [];
  return [...ancestors, safeText(assertion?.title)].filter(Boolean).join(" ");
}

function assertionId(file, fullName) {
  return `${file}::${fullName}`;
}

function flattenReport(report) {
  const observations = [];
  for (const suite of report?.testResults ?? []) {
    const file = normalizeFileName(suite?.name);
    for (const assertion of Array.isArray(suite?.assertionResults) ? suite.assertionResults : []) {
      const ancestors = Array.isArray(assertion?.ancestorTitles) ? assertion.ancestorTitles.map(safeText) : [];
      const title = safeText(assertion?.title);
      const fullName = fullNameFor(assertion);
      observations.push({
        file,
        ancestors,
        title,
        full_name: fullName,
        id: assertionId(file ?? "<unknown-file>", fullName),
        status: normalizeStatus(assertion?.status ?? assertion?.state),
        duration_ms: assertion?.duration ?? null,
        failure_messages: Array.isArray(assertion?.failureMessages) ? assertion.failureMessages.map(safeText) : [],
        failure_details: Array.isArray(assertion?.failureDetails) ? assertion.failureDetails : [],
      });
    }
  }
  return observations;
}

function selectorId(item) {
  return assertionId(item.file, [...item.ancestors, item.title].join(" "));
}

function matchesSelector(observation, item) {
  return observation.file === item.file
    && observation.title === item.title
    && JSON.stringify(observation.ancestors) === JSON.stringify(item.ancestors)
    && observation.full_name === [...item.ancestors, item.title].join(" ");
}

function observedAssertion(observation) {
  return {
    id: observation.id,
    expected: "passed",
    actual: observation.status,
    test_file: observation.file,
    full_name: observation.full_name,
    observed_status: observation.status,
    duration_ms: observation.duration_ms,
    failure_messages: observation.failure_messages,
    failure_details: observation.failure_details,
  };
}

function unavailableAssertion(id, reason, item = null) {
  return {
    id,
    expected: "passed",
    actual: "unavailable",
    ...(item ? {
      test_file: item.file,
      full_name: [...item.ancestors, item.title].join(" "),
      group: item.group,
    } : {}),
    observed_status: "unavailable",
    reason,
  };
}

function selectedAssertions(selectors, observations, errors, acId) {
  const result = [];
  const ids = new Set();
  for (const item of selectors) {
    const matches = observations.filter((observation) => matchesSelector(observation, item));
    if (matches.length !== 1) {
      errors.push({
        acceptance_criterion_id: acId,
        selector: selectorId(item),
        group: item.group,
        match_count: matches.length,
        reason: matches.length === 0 ? "selector did not match exactly one assertion" : "selector matched more than one assertion",
      });
    }
    for (const observation of matches) {
      const row = observedAssertion(observation);
      if (ids.has(row.id)) errors.push({ acceptance_criterion_id: acId, selector: row.id, reason: "duplicate selector in AC mapping" });
      ids.add(row.id);
      result.push(row);
    }
    if (matches.length === 0) result.push(unavailableAssertion(selectorId(item), "selector missing from child JSON report", item));
  }
  return result;
}

function allContractAssertions(observations) {
  const byFile = new Map();
  for (const observation of observations) {
    if (!TEST_FILES.includes(observation.file)) continue;
    const rows = byFile.get(observation.file) ?? [];
    rows.push(observation);
    byFile.set(observation.file, rows);
  }
  return TEST_FILES.flatMap((file) => {
    const rows = byFile.get(file) ?? [];
    if (rows.length > 0) return rows.map(observedAssertion);
    return [unavailableAssertion(
      `${file}::<suite-setup>`,
      "fixed test file produced no assertion result",
      { file, ancestors: [], title: "<suite-setup>", group: "all-files" },
    )];
  });
}

function reportSummary(report) {
  return Object.fromEntries([
    "success",
    "numTotalTestSuites",
    "numPassedTestSuites",
    "numFailedTestSuites",
    "numPendingTestSuites",
    "numRuntimeErrorTestSuites",
    "numTotalTests",
    "numPassedTests",
    "numFailedTests",
    "numPendingTests",
    "numTodoTests",
  ].map((key) => [key, report?.[key] ?? null]));
}

function suiteErrors(report, observations) {
  const errors = [];
  const suites = Array.isArray(report?.testResults) ? report.testResults : [];
  const counts = new Map();
  for (const suite of suites) {
    const file = normalizeFileName(suite?.name);
    if (!file) {
      errors.push({ reason: "child report contains a suite with an untrusted path" });
      continue;
    }
    if (!TEST_FILES.includes(file)) {
      errors.push({ file, reason: "child report contains a suite outside the fixed test-file scope" });
      continue;
    }
    counts.set(file, (counts.get(file) ?? 0) + 1);
  }
  for (const file of TEST_FILES) {
    const count = counts.get(file) ?? 0;
    if (count !== 1) errors.push({ file, reason: "expected exactly one Vitest suite", suite_count: count });
  }
  if (observations.some((entry) => entry.file === null)) errors.push({ reason: "child report contains an assertion with an untrusted suite path" });
  if (observations.length === 0) errors.push({ reason: "child report contains zero assertion results" });
  return errors;
}

function coverageContractErrors() {
  const errors = [];
  const closeSelectors = SELECTORS_BY_AC["AC-CLOSE-002"] ?? [];
  const closeSelectorIds = new Set(closeSelectors.map(selectorId));
  for (const required of P3_SELECTORS) {
    if (!closeSelectorIds.has(selectorId(required))) {
      errors.push({ acceptance_criterion_id: "AC-CLOSE-002", selector: selectorId(required), reason: "T009/T010 selector is missing from the required cross-pair AC entry" });
    }
  }
  for (const acId of ACCEPTANCE_CRITERIA.filter((id) => !QUALITATIVE_AC_REASONS[id] && id !== "AC-CONTRACT-001")) {
    if (!Array.isArray(SELECTORS_BY_AC[acId]) || SELECTORS_BY_AC[acId].length === 0) {
      errors.push({ acceptance_criterion_id: acId, reason: "mechanical AC has no explicit selector mapping" });
    }
  }
  return errors;
}

function buildEntries(observations, mappingErrors) {
  return ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => {
    const qualitativeReason = QUALITATIVE_AC_REASONS[acceptance_criterion_id];
    if (qualitativeReason) {
      return {
        acceptance_criterion_id,
        assertions: [{
          id: `${acceptance_criterion_id}::D029-qualitative-evidence`,
          expected: { status: "available" },
          actual: { status: "unavailable", reason: qualitativeReason },
          observed_status: "unavailable",
          reason: qualitativeReason,
        }],
      };
    }
    const assertions = acceptance_criterion_id === "AC-CONTRACT-001"
      ? allContractAssertions(observations)
      : selectedAssertions(SELECTORS_BY_AC[acceptance_criterion_id] ?? [], observations, mappingErrors, acceptance_criterion_id);
    return { acceptance_criterion_id, assertions };
  });
}

function parseChildReport(raw) {
  let report;
  try {
    report = JSON.parse(raw);
  } catch (error) {
    return { report: null, error: { reason: "Vitest JSON reporter output is malformed", detail: error.message } };
  }
  if (!report || typeof report !== "object" || Array.isArray(report) || !Array.isArray(report.testResults)) {
    return { report: null, error: { reason: "Vitest JSON reporter output has no testResults array" } };
  }
  return { report, error: null };
}

function collect() {
  const startedAt = new Date().toISOString();
  const mappingErrors = coverageContractErrors();
  let child;
  let childError = null;
  try {
    child = spawnSync(process.execPath, childArgs, {
      cwd: ROOT,
      encoding: null,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: CHILD_TIMEOUT_MS,
      killSignal: "SIGTERM",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    childError = { code: error?.code ?? "CHILD_SPAWN_ERROR", message: error?.message ?? String(error) };
    child = { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), status: null, signal: null, error };
  }
  const stdoutBytes = Buffer.isBuffer(child?.stdout) ? child.stdout : Buffer.from(child?.stdout ?? "");
  const stderrBytes = Buffer.isBuffer(child?.stderr) ? child.stderr : Buffer.from(child?.stderr ?? "");
  const childStdout = stdoutBytes.toString("utf8");
  const childStderr = stderrBytes.toString("utf8");
  const timedOut = child?.error?.code === "ETIMEDOUT";
  const parsed = parseChildReport(childStdout);
  const observations = parsed.report ? flattenReport(parsed.report) : [];
  mappingErrors.push(...suiteErrors(parsed.report, observations));
  if (parsed.error) mappingErrors.push(parsed.error);
  if (childError) mappingErrors.push(childError);
  if (child?.error && !childError) {
    mappingErrors.push({ code: child.error.code ?? "CHILD_ERROR", reason: "Vitest child returned a process error", detail: child.error.message ?? String(child.error) });
  }
  if (timedOut) mappingErrors.push({ reason: "Vitest child exceeded collector timeout", timeout_ms: CHILD_TIMEOUT_MS });
  if (child?.signal && !timedOut) mappingErrors.push({ reason: "Vitest child terminated by signal", signal: child.signal });
  const entries = buildEntries(observations, mappingErrors);
  const assertionObservations = observations.map(({ id, file, full_name, status, duration_ms, failure_messages, failure_details }) => ({
    id, file, full_name, status, duration_ms, failure_messages, failure_details,
  }));
  const reportValid = parsed.report !== null && !parsed.error;
  const collectorStatus = reportValid && !timedOut && !child?.signal && mappingErrors.length === 0 ? "complete" : "failed";
  const finishedAt = new Date().toISOString();
  const collection = {
    status: collectorStatus,
    collector_version: COLLECTOR_VERSION,
    started_at: startedAt,
    completed_at: finishedAt,
    timeout_ms: CHILD_TIMEOUT_MS,
    child_command: { command: process.execPath, args: childArgs },
    child: {
      exit_code: Number.isInteger(child?.status) ? child.status : null,
      signal: child?.signal ?? null,
      timed_out: timedOut,
      error: child?.error ? { code: child.error.code ?? "CHILD_ERROR", message: child.error.message ?? String(child.error) } : null,
    },
    report_valid: reportValid,
    report_summary: reportSummary(parsed.report),
    selected_files: TEST_FILES,
    assertion_observations: assertionObservations,
    selected_assertions: assertionObservations.filter(({ status }) => status === "passed"),
    skipped_assertions: assertionObservations.filter(({ status }) => ["skipped", "pending", "todo"].includes(status)),
    failed_assertions: assertionObservations.filter(({ status }) => status === "failed"),
    mapping_errors: mappingErrors,
    raw_stdout: childStdout,
    raw_stderr: childStderr,
    raw_stdout_sha256: sha256(stdoutBytes),
    raw_stderr_sha256: sha256(stderrBytes),
  };
  return {
    schema_version: "planning-workflow-hardening-acceptance.v1",
    collector_version: COLLECTOR_VERSION,
    acceptance_criteria: ACCEPTANCE_CRITERIA,
    mechanical_acceptance_criteria: ACCEPTANCE_CRITERIA.filter((id) => !QUALITATIVE_AC_REASONS[id]),
    qualitative_unavailable_acceptance_criteria: Object.keys(QUALITATIVE_AC_REASONS),
    mapping_contract: {
      selector_id: "<test_file>::<full_test_name>",
      selector_match: "exactly_once",
      close_002_required_groups: ["T007/T008", "T009/T010"],
      selected_file_count: TEST_FILES.length,
    },
    collection,
    entries,
  };
}

try {
  const output = collect();
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  process.exitCode = output.collection.status === "complete" ? 0 : 1;
} catch (error) {
  const reason = error?.message ?? String(error);
  const fallbackEntries = ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => ({
    acceptance_criterion_id,
    assertions: [{
      id: `${acceptance_criterion_id}::collector-error`,
      expected: "passed",
      actual: "unavailable",
      observed_status: "unavailable",
      reason: `collector failed before producing a bounded report: ${reason}`,
    }],
  }));
  process.stdout.write(`${JSON.stringify({
    schema_version: "planning-workflow-hardening-acceptance.v1",
    collector_version: COLLECTOR_VERSION,
    acceptance_criteria: ACCEPTANCE_CRITERIA,
    collection: { status: "failed", mapping_errors: [{ reason }] },
    entries: fallbackEntries,
  }, null, 2)}\n`);
  process.exitCode = 1;
}
