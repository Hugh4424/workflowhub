/**
 * Native aggregation of retained development checkers.
 * Blocking failures exit 1 and name each checker; decision-log chain is advisory.
 * RUN_CHECKS_FORCE_FAIL_CHECKER provides the existing failure-injection seam.
 */
import { spawnSync } from "node:child_process";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";
import { findUndeclaredStaticDependencies } from "../../runtime/evidence/skill-static-deps.mjs";
import yaml from "js-yaml";
import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { validateContract } from "../../runtime/evidence/validate-contract.mjs";
import { CORE_FIELDS, validateRecord } from "../../metrics/record-schema.mjs";
import { GAP, SIX_KEYS, validateExecutionRecord } from "../../metrics/execution-record.mjs";
import { validateKnowledgeCard } from "../../metrics/knowledge-card.mjs";
import { resolve, dirname, isAbsolute } from "node:path";
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

function checkSkillStaticDependencies() {
  const catalog=yaml.load(readFileSync(resolve(repoRoot,"skills/catalog.yaml"),"utf8"));
  const entries=Array.isArray(catalog?.skills)?catalog.skills:[];
  const failures=[];
  for(const entry of entries) {
    if(entry.status==="retired") continue;
    if(typeof entry.path!=="string" || !entry.path.startsWith("skills/")) continue;
    const skillDir=dirname(resolve(repoRoot,entry.path));
    const checked=validateSkillBundle(repoRoot,`${entry.path.slice(0,-"SKILL.md".length)}skill-bundle.json`,entry.path);
    for(const item of findUndeclaredStaticDependencies({skillDir,fileEntries:checked.fileEntries})) failures.push(`${entry.name}/${item.source}: ${item.locator} ${item.reason}`);
  }
  return failures;
}

async function runAggregate({ materialRoot } = {}) {
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

  console.log("[run-checks] running skill-static-deps ...");
  const skillDepsCode=runChecker("skill-static-deps",[],checkSkillStaticDependencies);
  if(skillDepsCode!==0)failures.push({name:"skill-static-deps",code:skillDepsCode});

  console.log("[run-checks] running check-skill-consistency ...");
  const consistencyCode=runChecker("check-skill-consistency",["--root",repoRoot]);
  if(consistencyCode!==0)failures.push({name:"check-skill-consistency",code:consistencyCode});

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

  const materialResult = materialRoot ? await runMaterialChecks(materialRoot) : true;
  if (materialResult === false) failures.push({ name: "material-contract", code: 1 });
  if (!materialRoot) console.error("[run-checks] material check not run: no --material-root");

  if (failures.length === 0) {
    console.log(materialResult === null ? "[run-checks] material input absent; material check not run" : "[run-checks] ALL CHECKS PASSED");
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

async function runMaterialChecks(root) {
  try {
    const rootStat = statSync(root);
    if (rootStat.isFile() && rootStat.size === 0) { console.log(`[run-checks][material] ${root} 没有输入，未检查`); return null; }
    if (!rootStat.isDirectory()) throw new Error("expected a directory or empty file");
    const { inspectMaterialWorkspace, phaseFilesFromIndex } = await import("../../runtime/task/material-workspace.mjs");
    const { validatePostPhaseContract } = await import("../../runtime/stage/stage-content-contracts.mjs");
    const inspection = inspectMaterialWorkspace(root);
    if (!Object.keys(inspection.files).length && !inspection.errors.length) { console.log(`[run-checks][material] ${root} 没有输入，未检查`); return null; }
    const section = inspection.files["decision-log.md"]?.match(/^## 级别与路线\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
    const basis = section?.split(/\r?\n/).find(line => /^\s*-?\s*(?:\*\*)?推荐级别(?:\*\*)?[:：]\s*(轻档|普通|复杂)(?:任务)?(?:\s*(?:（[^）\n]*）|\([^\)\n]*\)))?[。.]?\s*$/.test(line));
    const light = basis && /[:：]\s*轻档/.test(basis);
    console.log(`[run-checks][material] level basis: ${basis ?? "未读到级别事实，按完整材料检查"}`);
    const phaseDirectory = resolve(root, "phases");
    const hasPhase = existsSync(phaseDirectory) && readdirSync(phaseDirectory).some(name => /^P\d+.*\.md$/.test(name));
    if (light && !inspection.errors.length && !existsSync(resolve(root, "spec.md")) && !existsSync(resolve(root, "phases/index.md")) && !hasPhase) {
      console.log(`[run-checks][material] ${root} 这个级别不适用这类材料`); return true;
    }
    const phases = {};
    if (inspection.files["phases/index.md"]) {
      try { for (const path of phaseFilesFromIndex(inspection.files["phases/index.md"])) phases[path] = inspection.files[path]; }
      catch { /* The reader and validator retain the named index error below. */ }
    }
    const result = validatePostPhaseContract({ spec: inspection.files["spec.md"], index: inspection.files["phases/index.md"], phases });
    const errors = [...inspection.errors, ...result.errors, ...triageSkipReasons(phases)];
    for (const error of errors) console.log(`[run-checks][material] ${root} ${error}`);
    if (errors.length) { console.log(`[run-checks][material] errors=${errors.length}`); return false; }
    console.log(`[run-checks][material] PASS ${root} phase_count=${result.facts.phase_count} task_count=${result.facts.task_count} errors=0`);
    return true;
  } catch (error) { console.error(`[run-checks][material] cannot read material root ${root}: ${error.code ?? error.message}`); return false; }
}

function triageSkipReasons(phases) {
  const errors = [];
  for (const [path, body] of Object.entries(phases)) {
    let fence = false;
    for (const [index, line] of (body ?? "").split(/\r?\n/).entries()) {
      if (/^\s*```/.test(line)) { fence = !fence; continue; }
      if (fence || /^\s*>/.test(line)) continue;
      const field = /^\s*[-*]\s+(?:\*\*)?([^:：]+?)(?:\*\*)?[:：]\s*(.*)$/.exec(line);
      const value = field?.[2].trim();
      // Dependency None is a valid graph declaration, not a skipped obligation.
      const skipField = field && /状态|适用|RED 证据|必留/.test(field[1]);
      const notApplicable = skipField && /^(?:N\/A|None|不适用)(?:\s*[—–-]\s*(.*))?$/i.exec(value);
      if (notApplicable && !/[\p{L}\p{N}]/u.test(notApplicable[1] ?? "")) errors.push(`${path}:${index + 1} ${field[1]} 缺不适用理由`);
      const declaration = skipField ? value : /^\s*\|/.test(line) ? line.split("|").find(cell => /^\s*deferred\s*$/.test(cell))?.trim() : null;
      if (declaration && /^deferred(?:$|[；;])/.test(declaration)) {
        const fields = new Map();
        const readFields = text => {
          let recognized = false;
          for (const token of text.split(/[；;|]/)) {
            const match = /^\s*(?:[-*]\s+)?(?:\*\*)?(责任卡|责任|负责人|owner|触发条件|受影响结果)(?:\*\*)?\s*[:：]\s*(.*?)\s*$/i.exec(token);
            if (!match) continue;
            recognized = true;
            const name = /^(?:责任卡|责任|负责人|owner)$/i.test(match[1]) ? "责任卡" : match[1];
            if (/[\p{L}\p{N}]/u.test(match[2])) fields.set(name, match[2]);
          }
          return recognized;
        };
        readFields(line.replace(/^.*?deferred(?:[；;]|$)/, ""));
        for (const next of body.split(/\r?\n/).slice(index + 1)) {
          // Only immediately adjacent structured fields belong to this state.
          // Headings, another declaration, examples and prose end that block.
          if (!readFields(next)) break;
        }
        for (const name of ["责任卡", "触发条件", "受影响结果"]) if (!fields.has(name)) errors.push(`${path}:${index + 1} deferred 缺${name}`);
      }
    }
  }
  return errors;
}

// A report projection only: zero attestation does not claim that a workflow ran.
export function stepCoverageExit(report) {
  if (!Array.isArray(report?.workflow_steps)) throw new TypeError("workflow_steps report is required");
  const stages = new Map();
  for (const row of report.workflow_steps) {
    if (!row || typeof row.stage !== "string" || !row.stage || typeof row.source !== "string"
        || typeof row.step_slug !== "string" || typeof row.state !== "string") {
      throw new TypeError("workflow step identity/state is required");
    }
    if (!stages.has(row.stage)) stages.set(row.stage, []);
    stages.get(row.stage).push(row);
  }
  const missing_steps = [], steps_unattested = [];
  for (const [stage, rows] of stages) {
    const attested = rows.some(row => row.state === "completed" || row.state === "not_applicable");
    if (!attested) {
      steps_unattested.push({ stage, declared_steps: rows.length });
      continue;
    }
    for (const { source, step_slug, state } of rows) {
      if (state !== "completed" && state !== "not_applicable") missing_steps.push({ source, step_slug, state });
    }
  }
  return { exit_code: missing_steps.length ? 1 : 0, missing_steps, steps_unattested };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) return runAggregate();
  if (args.length === 2 && args[0] === "--material-root" && isAbsolute(args[1])) return runAggregate({ materialRoot: args[1] });
  if (args.length !== 2 || args[0] !== "--task-path" || !args[1] || args[1].startsWith("-")) {
    console.error(`[run-checks] unsupported arguments: ${args.join(" ")}`);
    process.exit(1);
  }
  try {
    const { runFinalChainCheck } = await import("../../runtime/task/final-chain-runner.mjs");
    const report = runFinalChainCheck({ taskPath: resolve(args[1]) });
    const { exit_code, ...coverage } = stepCoverageExit(report);
    process.stdout.write(`${JSON.stringify({ ...report, ...coverage }, null, 2)}\n`);
    process.exitCode = exit_code;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

if (isMain) await main();
