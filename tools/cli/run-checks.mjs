/**
 * Native aggregation of retained development checkers.
 * Blocking failures exit 1 and name each checker; decision-log chain is advisory.
 * RUN_CHECKS_FORCE_FAIL_CHECKER provides the existing failure-injection seam.
 *
 * Material mode:
 *   node tools/cli/run-checks.mjs --material-root <绝对路径> [--stage=<阶段>]
 * --stage relaxes the make-decision post-phase input requirement: that stage
 * has not produced spec.md/phases yet. When --stage is omitted this reader is
 * diagnostic only: stored build-code readiness originals are read back, but a
 * missing table, missing original, stale fingerprint or drift is printed as a
 * warning and never changes the exit code. A non-archive material rooted at
 * .../specs/<task> that has both phases/P*.md and decision-log.md is the
 * canonical build-code shape this reader recognizes when --stage is omitted;
 * archive and other helper directories keep the old diagnostic behavior. Only
 * an explicit --stage=build-code turns those readiness gaps into failures
 * (exit 1). The dispatch gate itself stays the build-code entry
 * `run --action=execute` first step; this reader only replays its evidence. No
 * implicit build-plan pass.
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
import { resolve, dirname, isAbsolute, basename, sep, join } from "node:path";
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
  "  省略 --stage 时只诊断：不把材料推断成交付门；缺表、缺原件、stale 或 drift 只打印 warning，退出码不变。",
  "  省略 --stage 时，只有 非 archive、根为 .../specs/<task>、有 phases/P*.md、有 decision-log.md 的材料",
  "  才按 build-code 面读取；其余材料保留旧的诊断行为。",
  "  显式 --stage=build-code 才把上述就绪缺口当失败（exit 1）；派发门仍是 build-code 入口 run --action=execute 首步。",
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
  console.log("[run-checks] running check-decision-log-chain (advisory warnings; make-decision named evidence gaps return non-zero) ...");
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

function materialConvergenceErrors(root, files) {
  const decision = String(files?.['decision-log.md'] ?? '');
  const pointer = /清单：`([^`\n]*convergence-checklist[^`\n]*\.md)`/.exec(decision)?.[1];
  if (!pointer) return [];
  const candidates = [resolve(root, pointer), resolve(root, 'quality/evidence/decision-log-refs', pointer)];
  const ledgerPath = candidates.find(candidate => existsSync(candidate));
  if (!ledgerPath) return [`收敛清单不可读：${pointer}`];
  let ledger = '';
  try { ledger = readFileSync(ledgerPath, 'utf8'); } catch { return [`收敛清单不可读：${pointer}`]; }
  const errors = [];
  for (const line of ledger.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.split('|').map(cell => cell.trim());
    const id = cells[1], state = cells[2];
    if (!/^\d+$/.test(id) || !/^已收敛/.test(state ?? '')) continue;
    const block = new RegExp(`##\\s*工作包\\s*${id}(?![0-9])[\\s\\S]*?(?=\\n##\\s*工作包\\s*\\d|$)`).exec(ledger)?.[0] ?? '';
    if (!/冷读|真实问答|聊天呈现/.test(block)) errors.push(`包 ${id} 已收敛但缺冷读/真实问答原件`);
  }
  return errors;
}


// Pre-dispatch readiness on the material side: the same five columns and the
// same parsed facts as the build-code entry, with real argv-only probes and a
// stale read-back against the stored dispatch original. This reader never
// writes the aggregate original; the entry owns that record.
// Inference is deliberately narrow and diagnostic-only. Only this exact shape
// is read back against build-code originals when --stage is omitted: a
// non-archive root at .../specs/<task> that has phases/P*.md and a non-empty
// decision-log.md. The four conditions are named in USAGE and in
// workflows/build-code/SKILL.md; an explicit --stage=build-code is the only
// way to make a readiness gap non-zero here.
function inferMaterialStage(root, hasPhase, hasDecisionLog) {
  const archived = /(?:^|[\\/])archive(?:[\\/]|$)/.test(root);
  const canonicalMaterial = /(?:^|[\\/])specs[\\/][^\\/]+[\\/]?$/.test(root);
  return !archived && canonicalMaterial && hasPhase && hasDecisionLog ? "build-code" : null;
}

// Readiness evidence column semantics: the five-column table names the planned
// original path under the task evidence root (`quality/...`); the real original
// is the entry-stored receipt/output referenced by the stored readiness record.
// This reader therefore rejects a malformed declaration (absolute path, `..`,
// backslash) and reports whether the declared path already resolves; a planned
// path is allowed only because the stored original was checked first.
export function readinessEvidenceStatus(evidence, { recordRoot = null, materialRoot = null } = {}) {
  const declared = String(evidence ?? "").trim();
  if (!declared) return Object.freeze({ status: "missing", problem: "证据列为空" });
  const parts = declared.split("/");
  const invalid = !/^quality\/[^\\]+$/.test(declared) || parts.some((part) => !part || part === "." || part === "..")
    || /[\\:*?"<>|]/.test(declared);
  if (invalid) {
    return Object.freeze({ status: "invalid",
      problem: `证据列必须是任务证据根相对的 quality/... 路径，不得为绝对路径、反斜杠、通配符或含 ..（实际 ${JSON.stringify(declared)}）` });
  }
  for (const base of [recordRoot, materialRoot].filter(Boolean)) {
    const absolute = join(base, declared);
    if (!existsSync(absolute)) continue;
    try { readFileSync(absolute); return Object.freeze({ status: "resolved", resolved: absolute }); }
    catch (error) { return Object.freeze({ status: "invalid",
      problem: `证据列声明的原件不可读：${declared}（${error.code ?? error.message}）` }); }
  }
  return Object.freeze({ status: "planned", resolved: null });
}

function sectionBody(text, name) {
  const lines = String(text ?? "").split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${name}\\s*$`, "i").test(line));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s+/.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

function meaningfulText(value) {
  const text = String(value ?? "").replace(/[*_`]/g, "").trim();
  return text.length >= 2 && !/^(?:无|没有|空|—|-|n\/?a|未取得|unknown|tbd|todo|待补|待定|暂无)$/i.test(text);
}

const FAILURE_ELEMENTS = ["轮次", "新事实", "严重度", "结果", "选择"];

function failureRows(body) {
  const lines = String(body ?? "").split(/\r?\n/);
  const header = lines.find((line) => /^\s*\|/.test(line) && FAILURE_ELEMENTS.every((name) => line.includes(name)));
  if (header) {
    const columns = header.split("|").slice(1, -1).map((cell) => cell.trim());
    const index = Object.fromEntries(FAILURE_ELEMENTS.map((name) => [name, columns.indexOf(name)]));
    const rows = [];
    for (const line of lines.slice(lines.indexOf(header) + 1)) {
      if (!/^\s*\|/.test(line)) break;
      if (/^\s*\|\s*[-: ]+\|/.test(line)) continue;
      const cells = line.split("|").slice(1, -1);
      if (cells.every((cell) => /^\s*$/.test(cell))) continue;
      rows.push(Object.fromEntries(FAILURE_ELEMENTS.map((name) => [name, (cells[index[name]] ?? "").trim()])));
    }
    return rows;
  }
  const rows = [];
  for (const line of lines) {
    const found = {};
    for (const name of FAILURE_ELEMENTS) {
      const match = line.match(new RegExp(`${name}\\s*[：:]\\s*([^；;|\\n]*)`));
      if (match) found[name] = match[1].trim();
    }
    if (Object.keys(found).length >= 2) rows.push(found);
  }
  return rows;
}

/** 五要素、两轮锚与三类伪新事实的最小可执行记录校验。 */
export function failureDispositionProblems(text, label = "failures") {
  const body = sectionBody(text, "failures");
  if (body === null) return [`${label}：执行清单缺 failures 段`];
  if (/未发生失败|没有实际失败|本\s*Phase\s*无失败|无失败轮次/.test(body)) return [];
  const rows = failureRows(body);
  if (rows.length === 0) {
    return [`${label}：failures 未取得五要素记录（轮次/新事实/严重度/结果/选择），也没有声明「本 Phase 无失败」`];
  }
  const problems = [];
  for (const [offset, row] of rows.entries()) {
    for (const name of FAILURE_ELEMENTS) {
      const filled = name === "轮次" ? /^\d+$/.test(String(row[name] ?? "").trim()) : meaningfulText(row[name]);
      if (!filled) problems.push(`${label}：第 ${offset + 1} 行缺${name}或写空`);
    }
  }
  if (rows.length >= 2 && !/两轮/.test(body)) problems.push(`${label}：缺两轮锚（每两轮修复加验收后必须回看本段）`);
  else if (rows.length < 2 && !/未到两轮|不足两轮|仅一轮/.test(body)) problems.push(`${label}：缺两轮锚（不足两轮要写明未到两轮及原因）`);
  for (const row of rows) {
    const fact = String(row["新事实"] ?? "");
    if (/^(?:仅|只|只是|单纯)?\s*(?:改|换|移动|调整|挪)?\s*(?:报错)?行号|^只(?:是)?换(?:了)?夹具|^(?:只|仅)?(?:改|调整)断言/.test(fact.replace(/[*_`。；;]/g, ""))) {
      problems.push(`${label}：新事实写成「${row["新事实"]}」，只改行号/只换夹具/改断言都不算新事实`);
    }
  }
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1], current = rows[index];
    const none = (value) => /^(?:无|没有|none)$/i.test(String(value ?? "").replace(/[*_`。；;\s]/g, ""));
    if (none(previous["新事实"]) && none(current["新事实"]) && /继续修/.test(String(current["选择"] ?? ""))) {
      problems.push(`${label}：连续两轮同因且新事实都写「无」仍选「继续修」，应停原样修复并转查根因`);
    }
  }
  return problems;
}

// AC-P8-001：数据来源、每任务上限依据、单命令复跑、版本校验与清理五件，
// 只能从任务证据根里真实可读的原件判；没有可读原件就不算通过。
function jsonObjects(text) {
  const objects = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "{") continue;
    let depth = 0, inString = false, escaped = false;
    for (let cursor = index; cursor < text.length; cursor += 1) {
      const char = text[cursor];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          try { objects.push(JSON.parse(text.slice(index, cursor + 1))); } catch { /* not an object */ }
          index = cursor;
          break;
        }
      }
    }
  }
  return objects;
}

export function acceptanceP8Problems(phaseBody, { recordRoot = null, materialRoot = null } = {}) {
  const declared = [...String(phaseBody ?? "").matchAll(/quality\/[A-Za-z0-9._/-]+/g)].map((match) => match[0]);
  const readable = [];
  for (const path of [...new Set(declared)]) {
    for (const base of [recordRoot, materialRoot].filter(Boolean)) {
      const absolute = join(base, path);
      if (!existsSync(absolute)) continue;
      try { readable.push({ path, text: readFileSync(absolute, "utf8") }); } catch { /* unreadable stays missing */ }
      break;
    }
  }
  if (readable.length === 0) {
    return ["AC-P8-001：Phase 声明的证据路径下没有可读原件，无法核数据来源/上限依据/单命令/版本校验/清理"];
  }
  const objects = readable.flatMap((entry) => jsonObjects(entry.text));
  const prepare = objects.find((entry) => entry?.action === "prepare" && entry.data_source);
  const clean = objects.find((entry) => entry?.action === "clean" && entry.complete === true);
  const problems = [];
  if (!prepare) problems.push("AC-P8-001：可读原件中缺 prepare 回执（数据来源与上限依据无处核）");
  else {
    const source = prepare.data_source ?? {};
    if (source.kind !== "synthetic-seed" || !meaningfulText(source.seed) || !meaningfulText(source.sample_version)) {
      problems.push("AC-P8-001：数据来源不是可回读的 synthetic-seed（含 seed 与 sample_version）");
    }
    const limit = prepare.per_task_limit_basis ?? {};
    if (!(Number(limit.bytes) > 0) || !(Number(limit.records) > 0 || Number(limit.files) > 0) || !meaningfulText(limit.basis)) {
      problems.push("AC-P8-001：每任务上限依据缺正数 bytes/记录数或依据说明");
    }
    const version = prepare.version_check ?? {};
    if (!meaningfulText(version.requested) || !meaningfulText(version.required) || !meaningfulText(version.status)) {
      problems.push("AC-P8-001：版本校验缺 requested/required/status");
    }
    const command = String(prepare.reproduce_command ?? "");
    if (!/^node\s+\S*prepare-test-data\.mjs\s+.*--data-root\s+\S+.*--sample-version\s+\S+/.test(command) || /[;&|]/.test(command)) {
      problems.push("AC-P8-001：缺单条可复跑命令（一条 node … --data-root … --sample-version …，不得串联多命令）");
    }
    const cleanup = prepare.cleanup ?? {};
    if (!meaningfulText(cleanup.owner) || !meaningfulText(cleanup.completion_signal)) {
      problems.push("AC-P8-001：清理缺负责人 owner 或完成信号 completion_signal");
    }
  }
  if (!clean) problems.push("AC-P8-001：可读原件中缺清理回执（complete:true 的 clean 原件）");
  return problems;
}

/** 从执行清单读 P6 失败处置记录；清单不在时不新增缺件结论，交给材料 owner。 */
function runFailureRecordChecks(root, facts, recordRoot) {
  const errors = [];
  for (const phase of facts?.phase_rows ?? []) {
    const acs = phase.acs ?? [];
    if (!acs.includes("AC-P5-001") && !acs.includes("AC-P5-002")) continue;
    if (!recordRoot) {
      errors.push(`${root} ${phase.path} 失败处置记录需要认证任务根才能读（owner=实施负责人）`);
      continue;
    }
    const checklist = join(recordRoot, "quality", "evidence", "build-code", `execution-checklist-${String(phase.id).toLowerCase()}.md`);
    if (!existsSync(checklist)) continue;
    let text;
    try { text = readFileSync(checklist, "utf8"); }
    catch (error) {
      errors.push(`${root} ${phase.path} 执行清单不可读：${checklist}（${error.code ?? error.message}）`);
      continue;
    }
    for (const problem of failureDispositionProblems(text, `${phase.id} ${checklist}`)) errors.push(`${root} ${problem}`);
  }
  return errors;
}

async function runReadinessChecks(root, facts, recordRoot, stage, { explicit = false } = {}) {
  const phases = facts?.readiness?.phases ?? [];
  if (phases.length === 0) return [];
  const errors = [];
  // A synthesized/omitted stage is a read-back, not a dispatch gate: every
  // readiness gap stays a named warning so old materials keep their historical
  // exit code. Only an explicit --stage (build-code) rejects readiness gaps.
  const inferred = !explicit;
  const fail = (message) => {
    if (inferred) console.log(`[run-checks][material] ${message} (diagnostic only: --stage was omitted; rerun with --stage=build-code to enforce)`);
    else errors.push(message);
  };
  const declared = phases.filter((phase) => phase.declared);
  for (const phase of phases.filter((entry) => !entry.declared)) {
    if (stage === "build-code" && explicit) {
      // The material-side build-code check is a dispatch gate too: deleting the
      // five columns must not turn into a green result here.
      errors.push(`${root} ${phase.path} missing readiness table `
        + `(stage=build-code requires the five columns 命令/期望/证据/机器或人判/负责人; owner=计划负责人)`);
      continue;
    }
    console.log(`[run-checks][material] readiness phase=${phase.phase_id} declared=false status=unverified`
      + ` (${stage === "build-code" ? "stage inferred from the material shape" : `stage=${stage ?? "unspecified"}`} `
      + `allows no readiness table; the build-code entry requires one)`);
  }
  if (declared.length === 0) return errors;
  const recordDir = recordRoot ? join(recordRoot, "quality", "tests") : null;
  for (const phase of declared) {
    const human = phase.rows.filter((row) => row.kind === "human");
    if (!recordRoot || !recordDir) {
      fail(`${root} readiness phase=${phase.phase_id} has no authenticated task root to read its original`);
      continue;
    }
    let names;
    try { names = readdirSync(recordDir); } catch { names = []; }
    const pattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{3}-readiness-${String(phase.phase_id).toLowerCase()}(-stale)?\\.json$`);
    const matches = names.filter((name) => pattern.test(name)).sort();
    if (matches.length === 0) {
      fail(`${root} readiness result missing: phase=${phase.phase_id} has no stored original; `
        + `run the build-code entry (run --action=execute first step) to record it (owner=${phase.rows[0]?.owner ?? "计划负责人"})`);
      continue;
    }
    const ref = join(recordDir, matches.at(-1));
    let stored;
    try { stored = JSON.parse(readFileSync(ref, "utf8")); }
    catch (error) { fail(`${root} readiness original is not readable: ${ref} (${error.code ?? error.message})`); continue; }
    if (stored.status === "stale" || stored.material_sha256 !== facts.material_sha256) {
      fail(`${root} readiness stale: stored result ${ref} is bound to material_sha256 `
        + `${stored.material_sha256 ?? "unknown"}, current ${facts.material_sha256}`);
      continue;
    }
    if (stored.status !== "pass") {
      fail(`${root} readiness status is ${JSON.stringify(stored.status)} for ${ref}, not pass`);
      continue;
    }
    let failed = false;
    let machineIndex = 0;
    for (const row of phase.rows) {
      const evidence = readinessEvidenceStatus(row.evidence, { recordRoot, materialRoot: root });
      if (evidence.status === "invalid" || evidence.status === "missing") {
        fail(`${root} readiness phase=${phase.phase_id} row=${JSON.stringify(row.command)} ${evidence.problem} (owner=${row.owner})`);
        failed = true;
      }
      if (row.kind === "human") continue;
      // The original stores machine probes only, in table order; align by that
      // counter rather than by the raw table row index.
      const probe = Array.isArray(stored.probes) ? stored.probes[machineIndex] : null;
      machineIndex += 1;
      const receiptReadable = probe?.receipt_ref ? existsSync(probe.receipt_ref) : false;
      const outputReadable = probe?.output_ref ? existsSync(probe.output_ref) : false;
      let receipt = null;
      if (receiptReadable) { try { receipt = JSON.parse(readFileSync(probe.receipt_ref, "utf8")); } catch { receipt = null; } }
      const drift = !probe || probe.probe !== row.command || probe.expected !== row.expected
        || probe.status !== "pass" || !receiptReadable || !outputReadable || !receipt
        || receipt.exit_code !== probe.exit_code
        || JSON.stringify(receipt.argv) !== JSON.stringify(probe.argv);
      const status = drift ? "drift" : "pass";
      console.log(`[run-checks][material] readiness phase=${phase.phase_id} probe=${JSON.stringify(row.command)} `
        + `expected=${row.expected} exit=${probe?.exit_code ?? "unknown"} status=${status} owner=${row.owner} `
        + `evidence=${row.evidence} evidence_status=${evidence.status} receipt=${probe?.receipt_ref ?? "missing"}`);
      if (drift) {
        fail(`${root} readiness original drift: phase=${phase.phase_id} machine_row=${machineIndex} `
          + `does not match command/expected/exit/argv/receipt in ${ref} (owner=${row.owner}); rerun the build-code entry`);
        failed = true;
      }
    }
    if (!failed) {
      console.log(`[run-checks][material] readiness phase=${phase.phase_id} status=pass `
        + `machine=${phase.rows.filter((row) => row.kind === "machine").length} human=${human.length} `
        + `material_sha256=${facts.material_sha256} original=${ref}`);
    }
  }
  return errors;
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
      const convergenceErrors = materialConvergenceErrors(root, inspection.files);
      errors.push(...convergenceErrors);
      if (errors.length) { console.log(`[run-checks][material] errors=${errors.length}`); for (const error of errors) console.log(`[run-checks][material] ${root} ${error}`); return false; }
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
    const effectiveStage = stage ?? inferMaterialStage(root, hasPhase, typeof inspection.files["decision-log.md"] === "string" && inspection.files["decision-log.md"].trim() !== "");
    const recordRoot = result.ok ? await materialTaskRecordRoot(root) : null;
    const readinessErrors = result.ok ? await runReadinessChecks(root, result.facts, recordRoot, effectiveStage, { explicit: stage !== undefined }) : [];
    // AC-P8-001 与 P6 失败处置记录只在显式 build-code 面上强制；省略 --stage 时
    // 与就绪检查同样只打印诊断，不改变旧材料的历史退出码。
    const enforcement = stage === "build-code";
    const acceptanceErrors = [], failureRecordErrors = [];
    const note = (bucket, message) => {
      if (enforcement) bucket.push(message);
      else console.log(`[run-checks][material] ${message} (diagnostic only: --stage was omitted; rerun with --stage=build-code to enforce)`);
    };
    if (result.ok && effectiveStage === "build-code") {
      // AC-P8-001 只在首个承接 Phase（P4 测试数据段）判一次；P10 等终末段也会
      // 在覆盖表里点名全部 AC，重复判会把同一缺口报成多份。
      const p8 = (result.facts.phase_rows ?? []).find((phase) => (phase.acs ?? []).includes("AC-P8-001"));
      if (p8) {
        const body = phases[p8.path] ?? inspection.files[p8.path] ?? "";
        for (const problem of acceptanceP8Problems(body, { recordRoot, materialRoot: root })) note(acceptanceErrors, `${root} ${p8.path} ${problem}`);
      }
      for (const error of runFailureRecordChecks(root, result.facts, recordRoot)) note(failureRecordErrors, error);
    }
    const errors = [...inspection.errors, ...result.errors, ...triageSkipReasons(phases), ...readinessErrors, ...acceptanceErrors, ...failureRecordErrors];
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
  // S4: a make-decision row whose named evidence basis is incomplete returns 1;
  // build-code rows and rows without basis stay report-only.
  const namedEvidenceGap = (stages.get('make-decision') ?? []).some((row) =>
    row.state === 'incomplete' && Array.isArray(row.basis)
    && row.basis.some(item => item && item.conclusion === 'incomplete'));
  return {
    exit_code: namedEvidenceGap ? 1 : 0, missing_steps, steps_unattested,
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
    let convergenceExit = exit_code;
    try {
      const manifest = JSON.parse(readFileSync(joinPath(resolve(options.taskPath), "task.json"), "utf8"));
      const material = joinPath(manifest.target_repo_root, "specs", manifest.task_id);
      if (existsSync(material)) {
        const { runStageStepsCheck } = await import("./check-stage-steps.mjs");
        const checked = runStageStepsCheck({ taskPath: resolve(options.taskPath), materialRoot: material, repoRoot: options.workflowRoot ?? undefined, stage: "make-decision" });
        const gaps = checked.convergence?.gaps ?? [];
        if (gaps.some(gap => /缺冷读原件|收敛格缺当前卡节|聊天呈现未取得|缺真实问答指针|冷读五问未绑定|先设计后提问缺证|UI设计源首问|冷读原件摘要不符|卡片摘要不符/.test(String(gap)))) convergenceExit = 1;
      }
    } catch { /* a missing material root leaves the existing aggregate unchanged */ }
    process.stdout.write(`${JSON.stringify({ ...report, ...coverage }, null, 2)}\n`);
    process.exitCode = convergenceExit;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

if (isMain) await main();
