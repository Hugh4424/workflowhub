// Diagnostic replay of copied, immutable real CARD04 reporter bytes.
// This is evidence, not a fixture imported by the contract test.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyFixedTargetedReporter } from "../../../../../../workflows/build-code/capture.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(readFileSync(join(dir, "real-manifest.json"), "utf8"));
const rawReports = manifest.reports.map((_report, index) =>
  readFileSync(join(dir, `real-case-${index + 1}.raw.json`), "utf8"));
const firstFile = JSON.parse(rawReports[0]).testResults[0].name;
const workspaceRoot = dirname(dirname(dirname(firstFile)));
const selection = { cases: manifest.reports.map((report) => ({ id: report.case_id,
  execution: { target: report.target, registered_test_ids: report.full_ids } })) };
const leafCount = manifest.reports.reduce((total, report) => total + report.test_count, 0);
if (selection.cases.length !== 3 || leafCount !== 49
    || hash(rawReports.join("\n")) !== manifest.execution.raw_output_sha256
    || manifest.reports.some((report, index) => hash(rawReports[index]) !== report.raw_sha256
      || JSON.parse(rawReports[index]).testResults[0].name !== resolve(workspaceRoot, report.target))) {
  throw new Error("real CARD04 replay input identity is invalid");
}
const input = { workspaceRoot, selection, manifest,
  rawReports, aggregateRaw: rawReports.join("\n") };
const result = verifyFixedTargetedReporter(input);
process.stdout.write(`${JSON.stringify({ result, case_count: selection.cases.length,
  leaf_count: leafCount, suite_counts: rawReports.map((raw) => JSON.parse(raw).numTotalTestSuites) })}\n`);
