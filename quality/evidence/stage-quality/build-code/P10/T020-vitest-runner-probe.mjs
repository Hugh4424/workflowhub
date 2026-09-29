import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runTargetedCases } from "../../../../../workflows/build-code/targeted-runner.mjs";

const root = resolve(import.meta.dirname, "../../../../..");
const catalog = JSON.parse(readFileSync(resolve(root, "docs/quality/business-case-catalog.json"), "utf8"));
const entry = catalog.cases.find((item) => item.id === "CARD04-DECISION-LOG-CENSUS");
if (!entry) throw new Error("P8 census case missing");
const runner = { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] };
const run = (caseEntry) => runTargetedCases({
  selection: { status: "selected", catalog_revision: catalog.revision, cases: [caseEntry] },
  workspaceRoot: root,
  runner,
});

const positive = await run(entry);
const wrongCommand = await run({ ...entry, execution: { ...entry.execution,
  machine_command: `${entry.execution.machine_command} --help` } });
const wrongId = await run({ ...entry, execution: { ...entry.execution,
  registered_test_ids: [...entry.execution.registered_test_ids, "tests/contract/decision-log-census.test.mjs > injected"] } });
const wrongTarget = await run({ ...entry, execution: { ...entry.execution,
  target: "tests/contract/acceptance-result-machine-classes.test.mjs" } });
const allCases = await runTargetedCases({
  selection: { status: "selected", catalog_revision: catalog.revision, cases: catalog.cases.slice(0, 3) },
  workspaceRoot: root,
  runner,
});

const fixtureRoot = mkdtempSync(join(import.meta.dirname, "T020-vitest-fixture-"));
const fixtureTarget = "tests/effect.test.mjs";
const fixtureExecution = {
  target: fixtureTarget, expected_test_identity: "fixture suite",
  machine_command: `npx vitest run ${fixtureTarget} --reporter=json`,
  registered_test_ids: [`${fixtureTarget} > fixture suite > actual effect`],
};
const fixtureRun = async (testBody, signal) => {
  writeFileSync(join(fixtureRoot, fixtureTarget), [
    'import { describe, expect, it } from "vitest";',
    'describe("fixture suite", () => {',
    testBody,
    '});',
    '',
  ].join("\n"));
  return runTargetedCases({
    selection: { status: "selected", cases: [{ id: "FIXTURE", execution: fixtureExecution }] },
    workspaceRoot: fixtureRoot,
    runner: { ...runner, ...(signal ? { signal } : {}) },
  });
};
let failed, skipped, zero, setupError, aborted;
try {
  mkdirSync(join(fixtureRoot, "tests"));
  failed = await fixtureRun('it("actual effect", () => expect(1).toBe(2));');
  skipped = await fixtureRun('it.skip("actual effect", () => expect(1).toBe(1));');
  zero = await fixtureRun('// no runnable assertion');
  setupError = await fixtureRun('throw new Error("setup failure");');
  const controller = new AbortController();
  controller.abort();
  aborted = await fixtureRun('it("actual effect", () => expect(1).toBe(1));', controller.signal);
} finally { rmSync(fixtureRoot, { recursive: true, force: true }); }

for (const [name, result] of Object.entries({ positive, wrongCommand, wrongId,
  wrongTarget, allCases, failed, skipped, zero, setupError, aborted })) {
  console.log(JSON.stringify({ name, status: result.status, reason: result.reason,
    observation_count: result.observations?.length,
    full_ids: result.observations?.map(({ full_id }) => full_id),
    argv: result.execution?.argv, exit_code: result.execution?.exit_code,
    raw_output_sha256: result.execution?.raw_output_sha256 }));
}
const allRegistered = catalog.cases.slice(0, 3).flatMap((item) => item.execution.registered_test_ids);
if (positive.status !== "completed"
    || positive.observations.length !== entry.execution.registered_test_ids.length
    || !positive.observations.every((item) => item.status === "passed"
      && entry.execution.registered_test_ids.includes(item.full_id))
    || allCases.status !== "completed" || allCases.observations.length !== allRegistered.length
    || !allCases.observations.every((item) => item.status === "passed" && allRegistered.includes(item.full_id))
    || wrongCommand.status !== "unavailable"
    || wrongId.status !== "unavailable" || wrongTarget.status !== "unavailable"
    || failed.reason !== "test_failed" || skipped.reason !== "test_failed"
    || zero.status !== "unavailable" || zero.observations.length !== 0
    || setupError.status !== "unavailable" || setupError.observations.length !== 0
    || aborted.reason !== "test_failed") process.exitCode = 1;
