import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runTargetedCases } from "../../../../../workflows/build-code/targeted-runner.mjs";

const root = mkdtempSync(join(import.meta.dirname, "T020-timeout-fixture-"));
const target = "tests/hangs.test.mjs";
let result;
const started = Date.now();
try {
  mkdirSync(join(root, "tests"));
  writeFileSync(join(root, target), [
    'import { it } from "vitest";',
    'it("hangs beyond runner timeout", async () => await new Promise(() => {}), 120000);',
    '',
  ].join("\n"));
  result = await runTargetedCases({
    selection: { status: "selected", cases: [{ id: "TIMEOUT", execution: {
      target, expected_test_identity: "hangs beyond runner timeout",
      machine_command: `npx vitest run ${target} --reporter=json`,
      registered_test_ids: [`${target} > hangs beyond runner timeout`],
    } }] },
    workspaceRoot: root,
    runner: { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] },
  });
} finally { rmSync(root, { recursive: true, force: true }); }
const elapsed_ms = Date.now() - started;
console.log(JSON.stringify({ status: result.status, reason: result.reason,
  observation_count: result.observations?.length, exit_code: result.execution?.exit_code,
  elapsed_ms, raw_output_sha256: result.execution?.raw_output_sha256,
  canonical_receipt: result.execution?.canonical_receipt }));
if (result.status !== "unavailable" || result.reason !== "test_failed"
    || result.observations.length !== 0 || elapsed_ms < 29_000 || elapsed_ms > 40_000) process.exitCode = 1;
