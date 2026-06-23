#!/usr/bin/env node
/**
 * check-metrics-schema.mjs — M4 Phase 5 (T021, FR-CI-001/002, decision-log D14).
 *
 * CI structure check for the metrics foundation schemas. Modeled on check-contract.mjs:
 * it validates good and bad samples of the execution-record and knowledge-card schemas
 * against their declared contracts + hand-written validators, and is wired into
 * run-checks.mjs as an aggregate checker.
 *
 * Exit codes: 0 = all schema checks pass, 1 = a check failed, 2 = unexpected error.
 *
 * Fault injection (smoke falsifiability, FR-CI-002): `--force-invalid-sample` swaps a
 * known-good sample for a broken one so the smoke can prove it goes red on demand.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { validateContract } from "../core/validate-contract.mjs";
import { validateRecord, CORE_FIELDS } from "../metrics/record-schema.mjs";
import { validateExecutionRecord, SIX_KEYS, GAP } from "../metrics/execution-record.mjs";
import { validateKnowledgeCard } from "../metrics/knowledge-card.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

function parseArgs() {
  const args = process.argv.slice(2);
  return { forceInvalid: args.includes("--force-invalid-sample") };
}

// A valid per-skill core record: every CORE_FIELDS key present, non-empty execution_id.
function goodCoreRecord() {
  const r = {};
  for (const f of CORE_FIELDS) r[f.name] = null;
  r.execution_id = "exec-smoke-1";
  r.skill_or_stage = "apply";
  r.stage = "apply";
  r.skill_version = "0.1.0";
  r.executed = true;
  return r;
}

// A valid unified execution record for the SCHEMA validator: non-empty id + all six join
// keys present. The four always-present view keys are objects; the two source-gated keys
// (boundary_decisions / trace_index) collapse to the GAP sentinel when no source attached.
function goodExecutionRecord() {
  return {
    execution_id: "exec-smoke-1",
    progress: {},
    facts: {},
    metrics: {},
    feedback: {},
    boundary_decisions: GAP,
    trace_index: GAP,
  };
}

// A fully-sourced unified record for the CONTRACT check, where the declared contract
// requires every join key to be an object (the contract describes the resolved shape,
// not the GAP-collapsed sentinel form).
function goodExecutionRecordSourced() {
  const r = { execution_id: "exec-smoke-1" };
  for (const k of SIX_KEYS) r[k] = { source: "smoke" };
  return r;
}

function goodKnowledgeCard() {
  return {
    type: "gate_deadlock",
    stage: "apply",
    root_cause: "smoke",
    resolution: "smoke",
    resolved: true,
    occurred_at: "2026-06-23T00:00:00Z",
  };
}

function checkMetricsSchema({ forceInvalid }) {
  const failures = [];

  // 1. Core per-skill record schema — good sample must validate.
  const core = forceInvalid ? { execution_id: "" } : goodCoreRecord();
  const coreResult = validateRecord(core);
  if (!coreResult.valid) {
    failures.push(`core record: ${coreResult.errors.join("; ")}`);
  }
  // Bad sample (missing keys) MUST be rejected — proves the validator is live.
  if (validateRecord({ execution_id: "x" }).valid) {
    failures.push("core record: a record missing CORE_FIELDS was wrongly accepted");
  }

  // 2. Unified execution record — good sample validates against schema + contract.
  const exec = forceInvalid ? { execution_id: "" } : goodExecutionRecord();
  const execResult = validateExecutionRecord(exec);
  if (!execResult.valid) {
    failures.push(`execution record: ${execResult.errors.join("; ")}`);
  }
  const execContract = JSON.parse(
    readFileSync(resolve(repoRoot, "contracts", "execution-record.contract.json"), "utf8")
  );
  const execContractResult = validateContract(goodExecutionRecordSourced(), execContract);
  if (!execContractResult.valid) {
    failures.push(`execution record contract: ${execContractResult.errors.join("; ")}`);
  }

  // 3. Knowledge card — good sample validates against schema + contract.
  const card = forceInvalid ? { type: "not-real" } : goodKnowledgeCard();
  const cardResult = validateKnowledgeCard(card);
  if (!cardResult.valid) {
    failures.push(`knowledge card: ${cardResult.errors.join("; ")}`);
  }
  const cardContract = JSON.parse(
    readFileSync(resolve(repoRoot, "contracts", "knowledge-card.contract.json"), "utf8")
  );
  const cardContractResult = validateContract(goodKnowledgeCard(), cardContract);
  if (!cardContractResult.valid) {
    failures.push(`knowledge card contract: ${cardContractResult.errors.join("; ")}`);
  }

  return failures;
}

function main() {
  try {
    const { forceInvalid } = parseArgs();
    console.log(
      `[check-metrics-schema] validating execution-record + knowledge-card schemas` +
        (forceInvalid ? " (FAULT INJECTION: --force-invalid-sample)" : "")
    );
    const failures = checkMetricsSchema({ forceInvalid });
    if (failures.length > 0) {
      for (const f of failures) console.error(`[check-metrics-schema] FAIL: ${f}`);
      console.error(`[check-metrics-schema] ${failures.length} schema check(s) failed`);
      process.exit(1);
    }
    console.log("[check-metrics-schema] PASS — metrics schemas + contracts validated");
    process.exit(0);
  } catch (err) {
    console.error(`[check-metrics-schema] ERROR: ${err.message}`);
    process.exit(2);
  }
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) main();
