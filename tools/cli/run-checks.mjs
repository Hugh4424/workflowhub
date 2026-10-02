/**
 * Native aggregation of retained development checkers.
 * Blocking failures exit 1 and name each checker; decision-log chain is advisory.
 * RUN_CHECKS_FORCE_FAIL_CHECKER provides the existing failure-injection seam.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { validateContract } from "../../runtime/evidence/validate-contract.mjs";
import { CORE_FIELDS, validateRecord } from "../../metrics/record-schema.mjs";
import { GAP, SIX_KEYS, validateExecutionRecord } from "../../metrics/execution-record.mjs";
import { validateKnowledgeCard } from "../../metrics/knowledge-card.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const node = process.execPath;

function runChecker(checkerName, checkerArgs, localCheck) {
  const forceFailTarget = process.env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  if (forceFailTarget && forceFailTarget === checkerName) {
    // Test injection: simulate checker failure without running the real script.
    console.log(`[run-checks] ${checkerName}: FORCED FAILURE (test injection)`);
    return 1;
  }

  // Retained metrics smoke uses the existing validators directly. Its old CLI
  // wrapper can retire without creating another run-checks writer in P6.
  if (localCheck) {
    try {
      const failures = localCheck();
      for (const failure of failures) console.error(`[${checkerName}] FAIL: ${failure}`);
      if (failures.length === 0) console.log(`[${checkerName}] PASS — retained validator and contract samples checked`);
      return failures.length === 0 ? 0 : 1;
    } catch (error) {
      console.error(`[${checkerName}] ERROR: ${error.message}`);
      return 2;
    }
  }

  const scriptPath = resolve(here, `${checkerName}.mjs`);
  const result = spawnSync(node, [scriptPath, ...checkerArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  // Print checker output so aggregate stdout contains checker names
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return result.status ?? 1;
}

// Owner: P2 run-checks; consumer: runAggregate's existing development check.
// Replaces the check-metrics-schema CLI's indirect validator/contract smoke.
// Remove when retained metrics/contract duties retire or an approved replacement
// consumes them; no M2 registry/extensibility capability is retained here.
function checkMetricsSchema() {
  const failures = [];
  const requireValid = (label, result) => {
    if (!result.valid) failures.push(`${label}: ${result.errors.join("; ")}`);
  };
  const requireInvalid = (label, result) => {
    if (result.valid) failures.push(`${label}: invalid sample was wrongly accepted`);
  };

  // These are the existing check-metrics-schema samples. Keep the raw GAP
  // declaration separate from the sourced objects expected by the contract.
  const core = Object.fromEntries(CORE_FIELDS.map(({ name }) => [name, null]));
  Object.assign(core, { execution_id: "exec-smoke-1", skill_or_stage: "apply", stage: "apply", skill_version: "0.1.0", executed: true });
  requireValid("core record", validateRecord(core));
  requireInvalid("core record", validateRecord({ execution_id: "x" }));

  const execution = {
    execution_id: "exec-smoke-1", progress: {}, facts: {}, metrics: {}, feedback: {},
    boundary_decisions: GAP, trace_index: GAP,
  };
  requireValid("execution record", validateExecutionRecord(execution));
  requireInvalid("execution record", validateExecutionRecord({ execution_id: "" }));
  const sourcedExecution = { execution_id: "exec-smoke-1" };
  for (const key of SIX_KEYS) sourcedExecution[key] = { source: "smoke" };
  const executionContract = JSON.parse(readFileSync(resolve(repoRoot, "contracts/execution-record.contract.json"), "utf8"));
  requireValid("execution record contract", validateContract(sourcedExecution, executionContract));

  const card = {
    type: "gate_deadlock", stage: "apply", root_cause: "smoke", resolution: "smoke",
    resolved: true, occurred_at: "2026-06-23T00:00:00Z",
  };
  requireValid("knowledge card", validateKnowledgeCard(card));
  requireInvalid("knowledge card", validateKnowledgeCard({ type: "not-real" }));
  const cardContract = JSON.parse(readFileSync(resolve(repoRoot, "contracts/knowledge-card.contract.json"), "utf8"));
  requireValid("knowledge card contract", validateContract(card, cardContract));
  return failures;
}

function runAggregate() {
  const failures = [];

  // 1. check-anti-host (no args, scans core/**/*.mjs via scan-core-files)
  console.log("[run-checks] running check-anti-host ...");
  const antiHostCode = runChecker("check-anti-host", []);
  if (antiHostCode !== 0) {
    failures.push({ name: "check-anti-host", code: antiHostCode });
  }

  console.log("[run-checks] running check-metrics-schema ...");
  const metricsCode = runChecker("check-metrics-schema", [], checkMetricsSchema);
  if (metricsCode !== 0) failures.push({ name: "check-metrics-schema", code: metricsCode });

  // 2. check-stage-quality (M5 FR-GATE-001/002 — quality-class blocking gates = 0)
  console.log("[run-checks] running check-stage-quality ...");
  const stageQualityCode = runChecker("check-stage-quality", []);
  if (stageQualityCode !== 0) {
    failures.push({ name: "check-stage-quality", code: stageQualityCode });
  }

  // 3. check-decision-log-chain (FR-DLOG-003 — advisory only; never a gate)
  console.log("[run-checks] running check-decision-log-chain (non-blocking) ...");
  const decisionLogChainCode = runChecker("check-decision-log-chain", []);
  if (decisionLogChainCode !== 0) {
    console.error(`[run-checks] check-decision-log-chain advisory failed (exit ${decisionLogChainCode}); not added to failures`);
  }

  if (failures.length === 0) {
    console.log("[run-checks] ALL CHECKS PASSED");
    process.exit(0);
  } else {
    for (const f of failures) {
      console.error(`[run-checks] FAILED: ${f.name} (exit ${f.code})`);
    }
    console.error(`[run-checks] ${failures.length} checker(s) failed — aggregated exit 1`);
    process.exit(1);
  }
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    console.error(`[run-checks] unsupported arguments: ${args.join(" ")}`);
    process.exit(1);
  }
  runAggregate();
}
