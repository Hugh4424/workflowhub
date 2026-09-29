import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { runTargetedCases } = await import(pathToFileURL(resolve(root, "workflows/build-code/targeted-runner.mjs")));
const catalog = JSON.parse(readFileSync(resolve(root, "docs/quality/business-case-catalog.json"), "utf8"));
const one = catalog.cases[0];
const selection = { status: "selected", cases: [one, { ...one, id: one.id + "-other" }] };
const result = await runTargetedCases({ selection, workspaceRoot: root, runner: {
  executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] } });
console.log(JSON.stringify({ status: result.status, reason: result.reason,
  observation_count: result.observations?.length, test_count: result.execution?.test_count,
  canonical_receipt: result.execution?.canonical_receipt }));
if (result.status !== "unavailable" || result.reason !== "reporter_identity_mismatch"
    || result.observations.length !== 0 || result.execution) process.exitCode = 1;
