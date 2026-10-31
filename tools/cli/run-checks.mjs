/**
 * Native aggregation of retained development checkers.
 * Blocking failures exit 1 and name each checker; decision-log chain is advisory.
 * RUN_CHECKS_FORCE_FAIL_CHECKER provides the existing failure-injection seam.
 *
 * Material mode:
 *   node tools/cli/run-checks.mjs --material-root <绝对路径> [--stage=make-decision]
 * --stage only relaxes the make-decision post-phase input requirement: that
 * stage has not produced spec.md/phases yet. Once either exists it is checked
 * as before. Other stages and calls without --stage keep the old contract.
 *
 * Task report mode:
 *   node tools/cli/run-checks.mjs --task-path <任务根> [--workflow-root <绝对路径>]
 * --workflow-root explicitly names the step-definition root (it must be an
 * absolute path). Without it the final-chain runner reads the installed
 * workflowhub package; a relative value is rejected instead of falling back.
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
import { resolve, dirname, isAbsolute, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const node = process.execPath;

const USAGE = [
  "usage:",
  "  node tools/cli/run-checks.mjs",
  "  node tools/cli/run-checks.mjs --material-root <绝对路径> [--stage=<阶段>]",
  "  node tools/cli/run-checks.mjs --task-path <任务根> [--workflow-root <绝对路径>]",
  "  --material-root 与 --task-path 是两种模式，不能混用。",
  "  --stage 只与 --material-root 同用：make-decision 阶段允许尚无 spec.md/phases。",
  "  --workflow-root 显式指定步骤定义根，必须是绝对路径；缺省读取安装根。",
].join("\n");

// One parser for both modes; mixed task/material arguments stay unsupported.
function parseArguments(args) {
  const keys = { "--task-path": "taskPath", "--workflow-root": "workflowRoot", "--material-root": "materialRoot", "--stage": "stage" };
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    let name = args[index], value;
    if (typeof name !== "string" || !name.startsWith("--")) return null;
    const equalAt = name.indexOf("=");
    if (equalAt > 0) { value = name.slice(equalAt + 1); name = name.slice(0, equalAt); }
    else { value = args[index + 1]; index += 1; }
    const key = keys[name];
    if (!key || !value || value.startsWith("-") || options[key]) return null;
    options[key] = value;
  }
  if (options.taskPath && options.materialRoot) return null;
  if (options.workflowRoot && !options.taskPath) return null;
  if (options.stage && !options.materialRoot) return null;
  if (options.materialRoot && !isAbsolute(options.materialRoot)) return null;
  return options;
}

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

async function runAggregate({ materialRoot, stage } = {}) {
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

  const materialResult = materialRoot ? await runMaterialChecks(materialRoot, { stage }) : true;
  if (materialResult === false) failures.push({ name: "material-contract", code: 1 });
  if (!materialRoot) console.error("[run-checks] material check not run: no --material-root");

  if (failures.length === 0) {
    if (materialResult === "partial") console.log("[run-checks] 可运行检查均通过；material 仅覆盖本次可检查范围，阶段完成未判");
    else console.log(materialResult === null ? "[run-checks] material input absent; material check not run" : "[run-checks] ALL CHECKS PASSED");
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

// A planned evidence path is an explicit known gap: not a failure, but it must
// not hide behind errors=0. Missing paths already fail the validator below, and
// this same line keeps their count visible next to the named errors.
function logEvidencePathSummary(facts) {
  // The validator returns facts: null for structural input errors; those errors
  // are already printed, so there is no evidence breakdown to add.
  const evidence = facts?.evidence_paths;
  if (!evidence || (evidence.planned_count === 0 && evidence.missing_count === 0)) return;
  console.log(
    `[run-checks][material] 证据路径：${evidence.verified_count} 份已生成，`
    + `${evidence.planned_count} 份 planned（未生成），${evidence.missing_count} 份缺失`,
  );
}

// Material-only callers have no task flag. A recorded task branch supplies the
// identity; the existing manifest/workspace owners must authenticate the match.
// Failure leaves the original missing-path result; never scan or guess roots.
async function materialTaskRecordRoot(materialRoot) {
  const root = resolve(materialRoot), specsAt = root.lastIndexOf(`${sep}specs${sep}`);
  if (specsAt < 1) return undefined;
  const worktreeRoot = root.slice(0, specsAt), env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  const branch = spawnSync("git", ["branch", "--show-current"], { cwd: worktreeRoot, env, encoding: "utf8" });
  if (branch.status !== 0) return undefined;
  const identity = /^task\/([^/]+)\/([^/]+)$/.exec(branch.stdout.trim());
  if (!identity || identity[2] !== basename(root)) return undefined;
  try {
    const { resolveCanonicalTaskPath } = await import("../../runtime/task/load-config.mjs");
    const { openTask } = await import("../../runtime/task/task-handle.mjs");
    const { openCurrentTaskWorkspace } = await import("../../runtime/task/workspace.mjs");
    const resolution = resolveCanonicalTaskPath({ project: identity[1], task: identity[2] });
    const task = openTask(resolution.taskPath, resolution.project, resolution.task);
    const workspace = await openCurrentTaskWorkspace(task);
    if (root !== resolve(workspace.worktreeRoot, "specs", task.identity.taskId)) return undefined;
    return task.taskPath;
  } catch { return undefined; }
}

async function runMaterialChecks(root, { stage } = {}) {
  try {
    const rootStat = statSync(root);
    const noInput = (why) => {
      if (stage === "make-decision") {
        console.log(`[run-checks][material] ${root} ${why}；make-decision 至少需要 decision-log.md`);
        console.log("[run-checks][material] errors=1");
        return false;
      }
      console.log(`[run-checks][material] ${root} 没有输入，未检查`);
      return null;
    };
    if (rootStat.isFile() && rootStat.size === 0) return noInput("材料为空文件");
    if (!rootStat.isDirectory()) throw new Error("expected a directory or empty file");
    const { inspectMaterialWorkspace, phaseFilesFromIndex } = await import("../../runtime/task/material-workspace.mjs");
    const { validatePostPhaseContract } = await import("../../runtime/stage/stage-content-contracts.mjs");
    const inspection = inspectMaterialWorkspace(root);
    if (!Object.keys(inspection.files).length && !inspection.errors.length) return noInput("材料目录为空");
    const section = inspection.files["decision-log.md"]?.match(/^## 级别与路线\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
    const basis = section?.split(/\r?\n/).find(line => /^\s*-?\s*(?:\*\*)?推荐级别(?:\*\*)?[:：]\s*(轻档|普通|复杂)(?:任务)?(?:\s*(?:（[^）\n]*）|\([^\)\n]*\)))?[。.]?\s*$/.test(line));
    const light = basis && /[:：]\s*轻档/.test(basis);
    console.log(`[run-checks][material] level basis: ${basis ?? "未读到级别事实，按完整材料检查"}`);
    const phaseDirectory = resolve(root, "phases");
    const hasPhase = existsSync(phaseDirectory) && readdirSync(phaseDirectory).some(name => /^P\d+.*\.md$/.test(name));
    if (light && !inspection.errors.length && !existsSync(resolve(root, "spec.md")) && !existsSync(resolve(root, "phases/index.md")) && !hasPhase) {
      console.log(`[run-checks][material] ${root} 这个级别不适用这类材料${stage ? '；本行不判阶段完成' : ''}`); return stage === 'make-decision' ? 'partial' : true;
    }
    // make-decision produces decision-log.md; spec.md and phases belong to the
    // next stage. A missing post-phase contract here is the stage's normal
    // input state, not a defect. Once spec/phases exist they are still checked.
    const postPhaseMaterials = Boolean(inspection.files["spec.md"] || inspection.files["phases/index.md"] || hasPhase);
    if (stage === "make-decision" && !postPhaseMaterials) {
      const errors = [...inspection.errors];
      if (!String(inspection.files["decision-log.md"] ?? "").trim()) errors.push("decision-log.md 未取得：make-decision 阶段至少要有一份可读决策日志");
      for (const error of errors) console.log(`[run-checks][material] ${root} ${error}`);
      if (errors.length) { console.log(`[run-checks][material] errors=${errors.length}`); return false; }
      console.log(`[run-checks][material] ${root} stage=make-decision：本次只核 decision-log 可读与材料结构错误=0；未要求 spec.md/phases，不判阶段完成，也不证明步骤齐备`);
      return 'partial';
    }
    const phases = {};
    if (inspection.files["phases/index.md"]) {
      try { for (const path of phaseFilesFromIndex(inspection.files["phases/index.md"])) phases[path] = inspection.files[path]; }
      catch { /* The reader and validator retain the named index error below. */ }
    }
    const input = { spec: inspection.files["spec.md"], index: inspection.files["phases/index.md"], phases, material_path: root };
    let result = validatePostPhaseContract(input);
    if (result.facts?.evidence_paths?.missing?.some(item => item.path.startsWith("quality/"))) {
      const taskRoot = await materialTaskRecordRoot(root);
      if (taskRoot) result = validatePostPhaseContract({ ...input, task_record_root: taskRoot });
    }
    for (const item of result.facts?.evidence_paths?.verified ?? []) {
      if (item.resolution_source === "task_root") console.log(`[run-checks][material] resolution_source=task_root phase=${item.phase_id} path=${item.path} resolved=${item.resolved}`);
    }
    const errors = [...inspection.errors, ...result.errors, ...triageSkipReasons(phases)];
    for (const error of errors) console.log(`[run-checks][material] ${root} ${error}`);
    if (errors.length) {
      logEvidencePathSummary(result.facts);
      console.log(`[run-checks][material] errors=${errors.length}`);
      return false;
    }
    console.log(`[run-checks][material] PASS ${root} phase_count=${result.facts.phase_count} task_count=${result.facts.task_count} errors=0`);
    logEvidencePathSummary(result.facts);
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
  const definition_unavailable = [];
  for (const row of report.workflow_steps) {
    if (!row || typeof row.stage !== "string" || !row.stage || typeof row.source !== "string"
        || typeof row.step_slug !== "string" || typeof row.state !== "string") {
      throw new TypeError("workflow step identity/state is required");
    }
    // A definition failure is not a declared step. The final-chain runner keeps
    // its <definition-unavailable> sentinel outside the evaluated denominator,
    // so it must not be reported here as a missing (or unattested) step. Its
    // stage stays visible below as undetermined, never as clean coverage.
    if (row.definition_status === "unreadable") {
      if (!definition_unavailable.includes(row.stage)) definition_unavailable.push(row.stage);
      continue;
    }
    if (!stages.has(row.stage)) stages.set(row.stage, []);
    stages.get(row.stage).push(row);
  }
  const missing_steps = [], steps_unattested = [];
  for (const [stage, rows] of stages) {
    const attested = rows.some(row => row.state === "completed" || row.state === "not_applicable");
    if (!attested) {
      steps_unattested.push({ stage, declared_steps: rows.length });
    }
    for (const { source, step_slug, state } of rows) {
      if (state !== "completed" && state !== "not_applicable") missing_steps.push({ source, step_slug, state });
    }
  }
  return {
    exit_code: 0, missing_steps, steps_unattested,
    ...(definition_unavailable.length ? {
      definition_unavailable: {
        stages: definition_unavailable,
        summary: `${definition_unavailable.length} 个阶段未判定：读不到步骤定义`,
      },
    } : {}),
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) return runAggregate();
  const options = parseArguments(args);
  if (!options) {
    console.error(`[run-checks] unsupported arguments: ${args.join(" ")}`);
    console.error(USAGE);
    process.exit(1);
  }
  // Load the stage registry only when --stage is used, so the no-argument
  // aggregate keeps its existing exact import closure.
  if (options.stage) {
    const { WORKFLOW_STAGE_SET } = await import("../../runtime/stage/stage-registry.mjs");
    if (!WORKFLOW_STAGE_SET.has(options.stage)) {
      console.error(`[run-checks] unsupported arguments: ${args.join(" ")}`);
      console.error(USAGE);
      process.exit(1);
    }
  }
  if (!options.taskPath) return runAggregate({ materialRoot: options.materialRoot, stage: options.stage });
  // A relative definition root is an invocation error, never a silent fallback
  // to the installed package: an explicit root either wins or is rejected.
  if (options.workflowRoot !== undefined && !isAbsolute(options.workflowRoot)) {
    console.error(`[run-checks] --workflow-root must be an absolute path: ${options.workflowRoot}`);
    process.exit(1);
  }
  try {
    const { runFinalChainCheck } = await import("../../runtime/task/final-chain-runner.mjs");
    const report = runFinalChainCheck({
      taskPath: resolve(options.taskPath),
      ...(options.workflowRoot === undefined ? {} : { workflowRoot: options.workflowRoot }),
    });
    const { exit_code, ...coverage } = stepCoverageExit(report);
    process.stdout.write(`${JSON.stringify({ ...report, ...coverage }, null, 2)}\n`);
    process.exitCode = exit_code;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

if (isMain) await main();
