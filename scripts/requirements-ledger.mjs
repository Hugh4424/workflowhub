#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "../core/canonical-source.mjs";
import { createRequirementLedger, createRequirementsCoverage } from "../core/requirement-ledger.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";

function fail(code, message) { process.stderr.write(`${code}: ${message}\n`); process.exitCode = 2; }
function args(argv) {
  const out = {};
  for (const item of argv.slice(2)) { const split = item.indexOf("="); if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`); out[item.slice(2, split)] = item.slice(split + 1); }
  return out;
}

export function persistRequirementsLedger(taskHandle, input, refs = {}) {
  const result = createRequirementLedger({ source_manifest: input.source_manifest, mappings: input.mappings });
  if (!result.ok) throw new Error(result.errors?.join("; ") ?? "invalid ledger");
  const coverage = createRequirementsCoverage(result.ledger);
  const ledgerRef = refs.ledgerRef ?? "requirements/ledger.json";
  const coverageRef = refs.coverageRef ?? "requirements/coverage.json";
  taskHandle.createRecordAtomic(ledgerRef, `${canonicalJson(result.ledger)}\n`);
  taskHandle.createRecordAtomic(coverageRef, `${canonicalJson(coverage)}\n`);
  return { ledger_ref: ledgerRef, coverage_ref: coverageRef };
}

export function requirementsLedgerMain() { try {
  const options = args(process.argv);
  for (const key of ["task-path", "project", "task", "stage"]) if (!options[key]) throw new TypeError("task capability arguments required");
  const context = bootstrapStage(options.stage, { mode: "sidecar", taskPath: options["task-path"], projectName: options.project, taskId: options.task });
  const input = JSON.parse(readFileSync(0, "utf8"));
  const result = persistRequirementsLedger(context.task, input, { ledgerRef: options["ledger-ref"], coverageRef: options["coverage-ref"] });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) { fail("REQUIREMENT_LEDGER_ERROR", error.message); } }

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) requirementsLedgerMain();
