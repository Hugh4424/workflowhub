import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// T011 is the one current-snapshot producer. Each achieved result is derived
// from a named child assertion; deferred and unavailable results additionally
// read their current task-material boundary. A green process exit alone must
// never promote this declaration into an AC result.
export const ACCEPTANCE_CRITERIA = Object.freeze([
  "AC-DOC-001", "AC-DOC-002", "AC-DOC-003", "AC-DOC-004", "AC-DOC-005", "AC-OI-001",
  "AC-TEST-001", "AC-TEST-002", "AC-TEST-003", "AC-TEST-004",
  "AC-REVIEW-001", "AC-REVIEW-002", "AC-REVIEW-003",
  "AC-AUTH-001", "AC-AUTH-002", "AC-FLOW-001", "AC-FLOW-002", "AC-FLOW-003",
  "AC-COVER-001", "AC-COVER-002", "AC-CLEAN-001", "AC-HANDOFF-001",
]);

export const TEST_ASSERTIONS = Object.freeze({
  "AC-DOC-001": { commandIndex: 1, file: "tests/decision-log-content-contract.test.mjs", test: "keeps the decision index complete without turning it into a spec copy" },
  "AC-DOC-002": { commandIndex: 1, file: "tests/contract/spec-stage-artifact-closure.test.mjs", test: "keeps post-cohort build-plan as the coherent specification owner" },
  "AC-DOC-003": { commandIndex: 1, file: "tests/contract/spec-stage-artifact-closure.test.mjs", test: "RED: makes spec-plan the sole phase author and spec-tasks a pointer-only index" },
  "AC-DOC-004": { commandIndex: 1, file: "tests/contract/material-producer-consumer-roundtrip.test.mjs", test: "RED: makes the phase the sole engineering body and tasks a pure execution index" },
  "AC-DOC-005": { commandIndex: 1, file: "tests/contract/filled-plan-task-production.test.mjs", test: "renders the current pointer template and passes baseline validators through an explicit compatibility fixture" },
  "AC-OI-001": { commandIndex: 1, file: "tests/decision-log-content-contract.test.mjs", test: "requires a same-log append update after every make-decision step" },
  "AC-TEST-001": { commandIndex: 1, file: "tests/contract/stage-routing-and-concrete-testing.test.mjs", test: "routes build-code against actual scope and directly uses one concrete testing package" },
  "AC-TEST-002": { commandIndex: 1, file: "tests/contract/phase-quality-handoff.test.mjs", test: "keeps blueprint advisory and concrete testing single-choice in build-code" },
  "AC-TEST-003": { commandIndex: 2, file: "tests/integration/vnext-official-stage-run.test.mjs", test: "T009 RED / T010 GREEN: records incomplete dual-phase fixture fields and accepts the complete handoff after two real entries" },
  "AC-AUTH-001": { commandIndex: 1, file: "tests/contract/human-confirmation-v3.test.mjs", test: "T005 keeps a real confirmation while publishing the authenticated incomplete coverage fact" },
  "AC-AUTH-002": { commandIndex: 1, file: "tests/contract/human-confirmation-v3.test.mjs", test: "T006 publishes passed coverage only from the authenticated task raw-requirement inventory" },
  "AC-FLOW-001": { commandIndex: 1, file: "tests/stage-review-cost-policy.test.mjs", test: "keeps the post-cohort authoring chain stage-owned and wh-review as the provider review" },
  "AC-FLOW-002": { commandIndex: 1, file: "tests/stage-interaction-contract.test.mjs", test: "keeps build-plan authoring cohort-aware without executing tests" },
  "AC-FLOW-003": { commandIndex: 1, file: "tests/contract/stage-routing-and-concrete-testing.test.mjs", test: "T003 routes build-plan through exactly one merged review and rejects old split review/analyze consumers" },
  "AC-COVER-001": { commandIndex: 1, file: "tests/contract/review-materials-contract.test.mjs", test: "rejects one shared proving anchor across multiple AC evidence entries" },
  "AC-COVER-002": { commandIndex: 3, test: "canonical namespaced ACs and legacy compact ACs share the parser" },
  "AC-CLEAN-001": { commandIndex: 1, file: "tests/contract/make-decision-interaction-publication.test.mjs", test: "keeps legacy aggregate construction out of the current writer surface" },
  "AC-HANDOFF-001": { commandIndex: 1, file: "tests/contract/phase-quality-handoff.test.mjs", test: "T004 projects the real build-plan handler result into the row before its handoff reads it" },
});

export const NON_ACHIEVED_READBACKS = Object.freeze({
  "AC-TEST-004": {
    outcome: "deferred", owner: "CARD-10",
    reason: "real Luna E2E is explicitly deferred; the fixture proves only the deferred boundary",
    assertion: { commandIndex: 2, file: "tests/integration/vnext-official-stage-run.test.mjs", test: "T009 RED / T010 GREEN: records incomplete dual-phase fixture fields and accepts the complete handoff after two real entries" },
    materialMarkers: ["AC-TEST-004", "real Luna E2E", "CARD-10"],
  },
  "AC-REVIEW-001": {
    outcome: "unavailable", owner: "wh-review",
    reason: "the current review route is inspected separately; no semantic provider result exists yet",
    assertion: { commandIndex: 4, file: "tests/contract/acceptance-execution-tier.test.mjs", test: "keeps explicit deferred and unavailable AC outcomes out of coverage while an independent review receives the executed command evidence" },
    materialMarkers: ["AC-REVIEW-001", "semantic_review_status=incomplete", "REVIEW_WAIT_EXCEEDED"],
  },
  "AC-REVIEW-002": {
    outcome: "unavailable", owner: "wh-review",
    reason: "there are no current semantic findings to dispose",
    assertion: { commandIndex: 4, file: "tests/contract/acceptance-execution-tier.test.mjs", test: "keeps explicit deferred and unavailable AC outcomes out of coverage while an independent review receives the executed command evidence" },
    materialMarkers: ["AC-REVIEW-002", "provider semantic result", "P1 `REVIEW_WAIT_EXCEEDED`"],
  },
  "AC-REVIEW-003": {
    outcome: "deferred", owner: "CARD-05",
    reason: "the real provider comparison remains owned by CARD-05",
    assertion: { commandIndex: 1, file: "tests/stage-review-cost-policy.test.mjs", test: "keeps unavailable review visible while same-task work continues" },
    materialMarkers: ["AC-REVIEW-003", "CARD-05", "deferred"],
  },
});

const mappedCriteria = [...Object.keys(TEST_ASSERTIONS), ...Object.keys(NON_ACHIEVED_READBACKS)];
if (mappedCriteria.length !== ACCEPTANCE_CRITERIA.length || new Set(mappedCriteria).size !== ACCEPTANCE_CRITERIA.length
    || ACCEPTANCE_CRITERIA.some((id) => !mappedCriteria.includes(id))) {
  throw new Error("CARD-02 acceptance observations must cover every criterion exactly once");
}

const commands = Object.freeze([
  ["node", ["tests/acceptance/card-01-current.mjs"], 300000],
  ["npx", ["--no-install", "vitest", "run",
    "tests/decision-log-content-contract.test.mjs",
    "tests/stage-review-cost-policy.test.mjs",
    "tests/stage-decision-contract.test.mjs",
    "tests/stage-interaction-contract.test.mjs",
    "tests/contract/spec-stage-artifact-closure.test.mjs",
    "tests/contract/material-producer-consumer-roundtrip.test.mjs",
    "tests/contract/phase-quality-handoff.test.mjs",
    "tests/contract/filled-plan-task-production.test.mjs",
    "tests/contract/stage-order-and-host-interaction.test.mjs",
    "tests/contract/stage-routing-and-concrete-testing.test.mjs",
    "tests/contract/spec-analyze-completeness.test.mjs",
    "tests/contract/review-materials-contract.test.mjs",
    "tests/contract/review-public-entrypoints.test.mjs",
    "tests/contract/review-input-bounds-portability.test.mjs",
    "tests/contract/stage-runtime-preflight.test.mjs",
    "tests/contract/human-confirmation-v3.test.mjs",
    "tests/contract/decision-log-chain-warnings.test.mjs",
    "tests/contract/make-decision-interaction-publication.test.mjs",
    "tests/contract/decision-convergence-depth.test.mjs",
    "skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs",
    "skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs",
    "--poolOptions.forks.singleFork", "--no-fileParallelism", "--reporter=verbose"], 900000],
  ["npx", ["--no-install", "vitest", "run", "tests/integration/vnext-official-stage-run.test.mjs", "-t",
    "T009 RED / T010 GREEN|guards the official stage run against monitoring fact and projection side effects|keeps a pre-dispatch oversized review attempt unavailable without blocking the repository-owned build-spec run",
    "--poolOptions.forks.singleFork", "--no-fileParallelism", "--reporter=verbose"], 300000],
  ["node", ["--test", "tests/contract/ui-stage-integration.test.mjs"], 300000],
  ["npx", ["--no-install", "vitest", "run", "tests/contract/acceptance-execution-tier.test.mjs", "-t",
    "keeps explicit deferred and unavailable AC outcomes out of coverage while an independent review receives the executed command evidence",
    "--poolOptions.forks.singleFork", "--no-fileParallelism", "--reporter=verbose"], 300000],
]);

function commandPassed(result) {
  return result?.exit_code === 0 && result.signal === null && result.error === null && result.timed_out === false;
}

function observedVitestAssertion(result, { file, test }) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const line = new RegExp(`(?:^|\\n)\\s*✓\\s+${escape(file)} > .+ > ${escape(test)}(?:\\s|$)`);
  return line.test(String(result?.stdout ?? "")) ? "passed" : "missing";
}

function observedNodeAssertion(result, { test }) {
  return String(result?.stdout ?? "").includes(`✔ ${test} `) ? "passed" : "missing";
}

function observedAssertion(results, assertion) {
  const result = results[assertion.commandIndex];
  return assertion.file ? observedVitestAssertion(result, assertion) : observedNodeAssertion(result, assertion);
}

/** Derive rows from observed child assertions and the current task boundary. */
export function deriveCard02Entries({ results, taskMaterials }) {
  const commandsPassed = results.length === commands.length && results.every(commandPassed);
  return ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => {
    const achieved = TEST_ASSERTIONS[acceptance_criterion_id];
    if (achieved) {
      const observed = observedAssertion(results, achieved);
      const outcome = commandsPassed && observed === "passed" ? "achieved" : "incomplete";
      return {
        acceptance_criterion_id, outcome,
        ...(outcome === "achieved" ? {} : { owner: "T011", reason: "the named current-snapshot assertion did not pass" }),
        assertions: [{ id: `${acceptance_criterion_id}:${achieved.test}`, expected: { status: "passed" }, actual: { status: observed } }],
      };
    }
    const readback = NON_ACHIEVED_READBACKS[acceptance_criterion_id];
    const observed = observedAssertion(results, readback.assertion);
    const materialPresent = readback.materialMarkers.every((marker) => taskMaterials.includes(marker));
    const outcome = commandsPassed && observed === "passed" && materialPresent ? readback.outcome : "incomplete";
    return {
      acceptance_criterion_id, outcome,
      ...(outcome === "incomplete"
        ? { owner: "T011", reason: "the current task material or named boundary assertion is missing" }
        : { owner: readback.owner, reason: readback.reason }),
      assertions: [{
        id: `${acceptance_criterion_id}:current-boundary-readback`,
        expected: { status: "present" },
        actual: { status: observed === "passed" && materialPresent ? "present" : "missing" },
      }],
    };
  });
}

export function produceCard02Current({ run = spawnSync, cwd = process.cwd(), taskMaterials = null } = {}) {
  const results = [];
  for (const [command, args, timeout] of commands) {
    const result = run(command, args, { cwd, encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"] });
    results.push({
      command, args, timeout_ms: timeout,
      exit_code: Number.isInteger(result.status) ? result.status : null,
      signal: result.signal ?? null,
      timed_out: result.error?.code === "ETIMEDOUT",
      error: result.error ? { code: result.error.code ?? "CHILD_PROCESS_ERROR", message: result.error.message } : null,
      stdout: result.stdout ?? "", stderr: result.stderr ?? "",
    });
    if (!commandPassed(results.at(-1))) break;
  }
  const materials = taskMaterials ?? readFileSync("specs/workflowhub-thin-core-card-02-20260919/tasks.md", "utf8");
  const entries = deriveCard02Entries({ results, taskMaterials: materials });
  return { schema_version: "card02-current-acceptance.v2", commands: results, entries };
}

function main() {
  const output = produceCard02Current();
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exitCode = output.commands.length === commands.length && output.commands.every(commandPassed)
    && output.entries.every((entry) => entry.assertions.every((assertion) => assertion.expected.status === assertion.actual.status)) ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
