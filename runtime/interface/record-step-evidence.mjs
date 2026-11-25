/**
 * Private implementation: one declared step's evidence writer.
 *
 * Governance: this is NOT a public runtime behavior. It is invoked explicitly by
 * the build-code stage agent (and its isolated tests) as a private capability of
 * the task-store owner; it adds no public command node, no persistent object and
 * no second evidence ledger. Unique consumer: build-code step evidence for the
 * declared steps. Owner: runtime/task (task-store). Replacement: if the
 * stage-runtime grows a private subcommand, this module moves behind it without
 * changing the task-store contract. Delete condition: when the declared-step
 * evidence producer is replaced by an independently verified owner and all
 * callers are migrated.
 *
 * The single write entry for one declared step's evidence.
 *
 *   node runtime/interface/record-step-evidence.mjs \
 *     --task-path=<abs task root> --stage=<stage> --step=<positive int> \
 *     --ref=<task-relative quality/evidence/... readback original> \
 *     --command=<verbatim command> --exit-code=<int> --failure-signature=<named string|none> \
 *     (--receipt=<task-relative quality/tests/... capture> |
 *      --no-receipt --reader-action=<readback action> --reader-owner=<who>) \
 *     [--phase=<P#> | --commit=<40/64 hex>] [--material-root=<abs material root>] \
 *     [--check] [--replace --expect-sha256=<current sha256>] [--json]
 *
 * Why the receipt is required by default: a claim JSON is the recorder's own
 * statement. Only an authenticated command capture with argv/cwd/exit/output is
 * an executed fact, so the writer validates the same fields the final-chain
 * producer's `commands()` validates *before* binding the slot. A broken receipt
 * is rejected with exit 2 and never becomes a permanent slot conflict.
 *
 * The writer never decides completion: `--check` only reads what the existing
 * checker reports, and a normal write prints no `completed`/`judgment`.
 */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { appendStepEvidence } from "../task/task-store.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const text = value => typeof value === "string" && value.trim() !== "";
const usage = `usage: node runtime/interface/record-step-evidence.mjs --task-path<T> --stage<S> --step<N> --ref<R> --command<C> --exit-code<E> --failure-signature<F> (--receipt<T> | --no-receipt --reader-action<A> --reader-owner<O>) [--phase<P>|--commit<H>] [--material-root<M>] [--check] [--replace --expect-sha256<S>] [--json]`;

function fail(message) {
  const error = new Error(message);
  error.code = "STEP_EVIDENCE_INPUT";
  return error;
}
function readJson(path, label) {
  let raw;
  try { raw = readFileSync(path, "utf8"); } catch (error) { throw fail(`${label} 不可读：${error.message}`); }
  try { return JSON.parse(raw); } catch (error) { throw fail(`${label} 不是可解析 JSON：${error.message}`); }
}
function taskFile(taskPath, ref, prefix, label) {
  if (!text(ref) || ref.includes("\\") || ref.includes("\0")) throw fail(`${label} 必须是安全的普通路径：${ref}`);
  const rawRelative = relative(resolve(taskPath), isAbsolute(ref) ? resolve(ref) : resolve(taskPath, ref)).split(sep).join("/");
  if (!rawRelative || rawRelative === ".." || rawRelative.startsWith("../") || isAbsolute(rawRelative) || rawRelative.split("/").some(part => !part || part === "." || part === "..")) throw fail(`${label} 越出任务根或含非法路径段：${ref}`);
  let root, path;
  try { root = realpathSync(taskPath); path = realpathSync(resolve(taskPath, ref)); } catch (error) { throw fail(`${label} 不可读：${error.message}`); }
  const rel = relative(root, path);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw fail(`${label} 越出任务根：${ref}`);
  const normalized = rel.split(sep).join("/");
  if (!normalized.startsWith(prefix)) throw fail(`${label} 必须在 ${prefix} 下：${ref}`);
  let named;
  try { named = lstatSync(path); } catch (error) { throw fail(`${label} 不可读：${error.message}`); }
  if (!named.isFile() || named.isSymbolicLink() || named.nlink !== 1) throw fail(`${label} 不是单链接普通文件：${ref}`);
  return { ref: normalized, bytes: readFileSync(path) };
}
// Same matching as runtime/task/final-chain-runner.mjs: JSON argv equality, the
// sh -c shape, or the literal argv.join(" ") for safe tokens.
function argvMatches(command, argv) {
  if (!Array.isArray(argv) || !argv.length || !argv.every(text)) return false;
  try { const parsed = JSON.parse(command); if (Array.isArray(parsed)) return JSON.stringify(parsed) === JSON.stringify(argv); } catch { /* literal command */ }
  if (argv.length === 3 && /(?:^|\/)sh$/.test(argv[0]) && argv[1] === "-c") return command === argv[2];
  return argv.every(arg => /^[a-zA-Z0-9_./:@%+=,-]+$/.test(arg)) && command === argv.join(" ");
}
function allowedCwds(manifest, materialRoot) {
  const values = [manifest.target_repo_root, manifest.workspace_root].filter(text);
  if (text(materialRoot)) {
    const at = materialRoot.lastIndexOf(`${sep}specs${sep}`);
    if (at > 0) values.push(materialRoot.slice(0, at));
  }
  return [...new Set(values.map(value => { try { return realpathSync(value); } catch { return resolve(value); } }))];
}
function validateReceipt({ taskPath, manifest, receiptRef, command, exitCode, materialRoot }) {
  const read = taskFile(taskPath, receiptRef, "quality/tests/", "--receipt");
  const receipt = JSON.parse(read.bytes.toString("utf8"));
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) throw fail("--receipt 不是命令捕获对象");
  if (!argvMatches(command, receipt.argv)) throw fail(`--receipt 的 argv 与 --command 不一致：${JSON.stringify(receipt.argv)}`);
  if (!Number.isInteger(receipt.exit_code)) throw fail("--receipt 缺整数 exit_code");
  if (receipt.exit_code !== exitCode) throw fail(`--receipt 的 exit_code=${receipt.exit_code} 与 --exit-code=${exitCode} 不一致`);
  if (!text(receipt.cwd)) throw fail("--receipt 缺 cwd");
  const allowed = allowedCwds(manifest, materialRoot);
  if (!allowed.some(cwd => resolve(cwd) === resolve(receipt.cwd))) throw fail(`--receipt 的 cwd 不在 target_repo_root/workspace_root/材料仓内：${receipt.cwd}`);
  if (receipt.task_id !== undefined && receipt.task_id !== manifest.task_id) throw fail(`--receipt 属于另一任务：${receipt.task_id}`);
  if (receipt.signal || receipt.timed_out || receipt.cancelled || receipt.truncated) throw fail("--receipt 是取消、超时或截断的捕获，不能当作成功执行");
  const started = Date.parse(receipt.started_at), ended = Date.parse(receipt.ended_at);
  if (receipt.started_at !== undefined || receipt.ended_at !== undefined) {
    if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) throw fail("--receipt 的时间区间非法或倒置");
  }
  if (!text(receipt.output_ref)) throw fail("--receipt 缺 output_ref；不接受内联输出");
  taskFile(taskPath, receipt.output_ref, "quality/tests/", "--receipt.output_ref");
  return { ref: read.ref, bytes: read.bytes };
}
function parseArguments(argv) {
  const values = {};
  const flags = new Set();
  const known = new Set(["task-path", "stage", "step", "ref", "command", "exit-code", "failure-signature",
    "receipt", "phase", "commit", "material-root", "reader-action", "reader-owner", "expect-sha256"]);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") { flags.add("json"); continue; }
    if (arg === "--check") { flags.add("check"); continue; }
    if (arg === "--no-receipt") { flags.add("no-receipt"); continue; }
    if (arg === "--replace") { flags.add("replace"); continue; }
    const match = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(arg);
    if (!match || !known.has(match[1])) throw fail(`不支持的参数：${arg}\n${usage}`);
    let value = match[2];
    if (value === undefined) {
      value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) throw fail(`参数缺值：--${match[1]}`);
      index += 1;
    }
    if (!text(value)) throw fail(`参数缺值：--${match[1]}`);
    if (Object.hasOwn(values, match[1])) throw fail(`重复参数：--${match[1]}`);
    values[match[1]] = value;
  }
  return { values, flags };
}
function ownerRefFor(stage, step) {
  const declared = /判定消费[：:]\s*([^；;\n]+)/.exec(step.observable_result ?? "")?.[1]?.trim() ?? "";
  if (!declared) throw fail(`${stage} 第 ${step.step_id} 步缺「判定消费」声明，无法核 criteria_ref`);
  const match = /^([A-Za-z0-9_./-]+\.md)(?:#(.+))?$/.exec(declared);
  if (!match) throw fail(`${stage} 第 ${step.step_id} 步的判定消费不是可解析的 .md 锚：${declared}`);
  const file = match[1];
  const target = file.includes("/") ? file : `workflows/${stage}/${file}`;
  let anchor = match[2] ?? "";
  const selector = /^(.*?)\s+第[1-9]\d*(?:\/[1-9]\d*)*步$/.exec(anchor);
  if (selector) anchor = selector[1];
  return anchor ? `${target}#${anchor}` : target;
}
function definition(stepId, stage) {
  const source = `workflows/${stage}/steps.json`;
  const path = resolve(ROOT, source);
  const manifest = readJson(path, `步骤定义 ${source}`);
  const step = (Array.isArray(manifest?.steps) ? manifest.steps : []).find(item => item?.step_id === stepId);
  if (!step) throw fail(`${source} 不存在第 ${stepId} 步`);
  if (typeof step.skill !== "string" || !step.skill.trim()) throw fail(`${source} 第 ${stepId} 步没有 skill 声明；本入口只服务声明了技能的步骤`);
  if (manifest.stage_slug !== stage) throw fail(`${source} 的 stage_slug 不是 ${stage}`);
  return { source, step };
}
async function checkStep({ taskPath, materialRoot, stage, stepId, stepSlug }) {
  // Runtime-only preflight: the full completion judgment belongs to the
  // stage-steps checker (a tools/cli consumer). `--check` reports the producer
  // state and its limits without importing tools/cli back into runtime.
  const { runFinalChainCheck } = await import("../task/final-chain-runner.mjs");
  let report;
  try { report = runFinalChainCheck({ taskPath, materialRoot }); }
  catch (error) { throw fail(`--check 读不到步骤报告：${error.message}`); }
  const row = (report?.workflow_steps ?? []).find(item => item.stage === stage && item.step_slug === stepSlug);
  if (!row) throw fail(`--check 没有读到 ${stage} 第 ${stepId} 步（${stepSlug}）`);
  return {
    stage, step: stepId, step_slug: stepSlug, state: row.state,
    judgment: row.state === "completed" ? "已完成" : "未判定（--check 只读预演；完成判定以 check-stage-steps 的当次回执为准）",
    gap: (row.limits ?? []).slice(0, 5).join("；") || null,
    basis: row.basis ?? [],
  };
}
async function main() {
  const argv = process.argv.slice(2);
  let parsed;
  try { parsed = parseArguments(argv); } catch (error) { console.error(error.message); process.exitCode = 2; return; }
  const { values, flags } = parsed;
  const json = flags.has("json");
  try {
    if (!text(values["task-path"]) || !isAbsolute(values["task-path"])) throw fail("--task-path 必须是绝对路径");
    if (!text(values.stage)) throw fail("必须给 --stage");
    if (!/^[1-9][0-9]*$/.test(values.step ?? "")) throw fail("--step 必须是正整数");
    const stepId = Number(values.step);
    const { source, step } = definition(stepId, values.stage);
    if (!values.phase && !/^[a-f0-9]{40,64}$/.test(values.commit ?? "")) throw fail("必须给 --phase 或真实 --commit");
    const taskPath = resolve(values["task-path"]);
    const manifest = readJson(join(taskPath, "task.json"), "task.json");
    if (!text(manifest?.task_id)) throw fail("task.json 缺 task_id");
    const materialRoot = text(values["material-root"]) ? resolve(values["material-root"]) : undefined;
    if (flags.has("check")) {
      if (!materialRoot || !isAbsolute(materialRoot)) throw fail("--check 需要显式 --material-root");
      const result = await checkStep({ taskPath, materialRoot, stage: values.stage, stepId, stepSlug: step.step_slug });
      if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else process.stdout.write(`第 ${result.step} 步：state=${result.state} judgment=${result.judgment}${result.gap ? `\n原因：${result.gap}` : ""}\n`);
      return;
    }
    if (!text(values.command)) throw fail("必须给 --command");
    if (!/^-?[0-9]+$/.test(values["exit-code"] ?? "")) throw fail("--exit-code 必须是整数");
    const exitCode = Number(values["exit-code"]);
    if (!text(values["failure-signature"])) throw fail("必须给 --failure-signature（无失败写 none）");
    if (!text(values.ref)) throw fail("必须给 --ref");
    if (values["expect-sha256"] !== undefined && !flags.has("replace")) throw fail("--expect-sha256 只能与 --replace 一起使用；单独传入不会生效");
    const degraded = flags.has("no-receipt");
    if (degraded) {
      if (flags.has("receipt") || values.receipt !== undefined) throw fail("--no-receipt 与 --receipt 互斥");
      if (!text(values["reader-action"]) || !text(values["reader-owner"])) throw fail("--no-receipt 必须同时给 --reader-action 与 --reader-owner");
      if (exitCode !== 0) throw fail("降级路径的 --exit-code 必须是 0（真实读回成功）");
      if (values["failure-signature"] !== "none") throw fail("降级路径的 --failure-signature 必须是 none");
    } else {
      if (!text(values.receipt)) throw fail("默认必须给 --receipt；没有可捕获命令时用 --no-receipt 降级并写读者动作与 owner");
    }
    // The claim is read *before* the slot is bound: an unreadable or wrong-identity
    // original never becomes a permanent EVIDENCE_SLOT_CONFLICT.
    const refRead = taskFile(taskPath, values.ref, "quality/evidence/", "--ref");
    let claim;
    try { claim = JSON.parse(refRead.bytes.toString("utf8")); } catch (error) { throw fail(`--ref 不是可解析 JSON：${error.message}`); }
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) throw fail("--ref 不是 claim 对象");
    if (claim.source !== source) throw fail(`--ref 的 source=${claim.source ?? "（缺）"} 不是本步声明的 ${source}`);
    if (claim.step_slug !== step.step_slug) throw fail(`--ref 的 step_slug=${claim.step_slug ?? "（缺）"} 不是本步的 ${step.step_slug}`);
    if (values.commit !== undefined && claim.commit !== undefined && claim.commit !== values.commit) throw fail("--ref 的 commit 与 --commit 不一致");
    if (values.phase !== undefined && claim.phase !== undefined && claim.phase !== values.phase) throw fail("--ref 的 phase 与 --phase 不一致");
    // Deterministic claim fields are checked before binding. A bad claim must
    // never become a permanent slot that the producer can only read as
    // "未留痕"; the slot has no silent second-write path.
    for (const field of ["reader", "criteria_ref"]) if (!text(claim[field])) throw fail(`--ref 缺必填字段 ${field}`);
    if (!Array.isArray(claim.inputs) || claim.inputs.length === 0) throw fail("--ref 的 inputs 必须是非空数组");
    if (!(text(claim.observation) || (claim.observation && typeof claim.observation === "object"))) throw fail("--ref 缺 observation");
    if (!["completed", "incomplete", "unavailable", "skipped"].includes(claim.conclusion)) throw fail(`--ref 的 conclusion=${claim.conclusion ?? "（缺）"} 不是合法结论`);
    if (!Array.isArray(claim.limits)) throw fail("--ref 的 limits 必须是数组");
    const expectedOwner = ownerRefFor(values.stage, step);
    if (claim.criteria_ref !== expectedOwner) throw fail(`--ref 的 criteria_ref=${claim.criteria_ref} 不是本步 owner 判据 ${expectedOwner}`);
    let receipt;
    if (!degraded) receipt = validateReceipt({ taskPath, manifest, receiptRef: values.receipt, command: values.command, exitCode, materialRoot });
    const receiptRef = receipt?.ref;
    // The producer's `commands()` reads `entry.sha256` against the receipt when
    // `receipt_ref` is present, and against the claim otherwise. Keep the single
    // declared hash on that same object so the written slot cannot disagree with
    // the producer by construction.
    const sha256 = createHash("sha256").update(receipt ? receipt.bytes : refRead.bytes).digest("hex");
    const result = await appendStepEvidence(taskPath, {
      taskId: manifest.task_id, stage: values.stage, source, stepSlug: step.step_slug,
      ref: refRead.ref, sha256, command: values.command, exitCode, failureSignature: values["failure-signature"],
      ...(receiptRef ? { receiptRef } : {}),
      ...(degraded ? { degraded: { reason: "没有可捕获命令；只走 human 读回通道，program 义务未满足", owner: values["reader-owner"], action: values["reader-action"] } } : {}),
      ...(flags.has("replace") ? { replace: { expectSha256: values["expect-sha256"] } } : {}),
    });
    if (json) process.stdout.write(`${JSON.stringify({ action: result.action, ref: result.ref, slot: result.slot, sha256 }, null, 2)}\n`);
    else process.stdout.write(`写入 ${result.action}：${source}#${step.step_slug} → ${result.ref}\n`);
    if (degraded) console.error("[record-step-evidence] 无程序捕获；本条只走 human 读回，program 义务未满足");
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.code === "EVIDENCE_SLOT_CONFLICT" || error.code === "EVIDENCE_SLOT_AMBIGUOUS" ? 1 : 2;
  }
}
await main();
