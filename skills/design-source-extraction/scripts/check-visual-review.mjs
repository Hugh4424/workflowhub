#!/usr/bin/env node
// 目视审查校验的唯一私有入口。消费者是独立设计审查者与独立测试者；只服务设计源提炼技能的目视面，
// 不进入公共运行时命令面，也不生成视觉结论——本脚本只核报告形状、固定视口/环境身份、对象身份、
// 设计对分径/字节、固定八态覆盖与差异处置是否合规。视觉意义由未参与实现的审查者实际看图判断。
//
// 与 page-audit 的分工：page-audit 跑五采集器与完整身份/版本链；本脚本只判「目视审查报告」的形状与
// 身份绑定（八项身份块必填但不重跑五采集器、不核版本链），不复刻 page-audit 的采集与评分。
//
// 用法：node check-visual-review.mjs --dir <报告目录>（目录内含 review.json 与可选截图）
// `verify_screenshot_bytes` 为 true 时核截图文件与字节、并重算 design/implementation 字节；
// 固定形状夹具可置 false（shape-only）。退出码：0 通过；1 目标失败；2 报告不可用。
//
// 失败码以本脚本 reject()/unreadable() 调用为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, statSync, realpathSync} from "node:fs";
import {resolve, join} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const KIND = "visual-review";
const CONFIG_UNAVAILABLE = "VISUAL_REVIEW_CONFIG_UNAVAILABLE";
const SHAPE_INVALID = "VISUAL_REVIEW_SHAPE_INVALID";
const DIFF_STATUSES = ["none", "fixed", "accepted"];
// P4 固定八态（实际可经 URL 观察的页面态）。timeout 无客户端接缝，是 gaps 里的 unavailable 具名缺口，不在此列。
const REQUIRED_STATES = ["success", "loading", "empty", "error", "sample-write-refused", "real-success", "receipt", "recovered"];
// 报告对象身份按 page-audit 八项：workspace/service/route/state/viewport/engine/engine_session/object_version。
const OBJECT_IDENTITY_KEYS = ["workspace", "service", "route", "state", "viewport", "engine", "engine_session", "object_version"];

function sha(file) { return createHash("sha256").update(readFileSync(file)).digest("hex"); }
function gitHead() {
  try { const r = spawnSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}); return r.status === 0 ? String(r.stdout).trim() : null; }
  catch { return null; }
}
function unreadable(code, detail) { process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n"); process.exitCode = 2; }
function reject(code, detail) {
  process.stdout.write(JSON.stringify({ok: false, kind: KIND, error: {code, detail}}) + "\n");
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 1;
}
function nonEmpty(value) { return typeof value === "string" && value.trim() !== ""; }

function validateShape(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return "visual review must be an object";
  if (doc.schema_version !== "1.0.0") return "schema_version must be 1.0.0";
  if (doc.kind !== "visual-review") return "kind must be visual-review";
  if (!doc.viewport || typeof doc.viewport !== "object") return "viewport is required";
  if (!doc.environment || typeof doc.environment !== "object") return "environment is required";
  if (!Array.isArray(doc.design_pairs)) return "design_pairs must be an array";
  if (!Array.isArray(doc.screenshots)) return "screenshots must be an array";
  if (!Array.isArray(doc.diffs)) return "diffs must be an array";
  if (!Array.isArray(doc.states_observed)) return "states_observed must be an array";
  return null;
}

function applyChecks(doc, dir) {
  // 固定视口：只接受 1440×1000、设备像素比 1。
  const vp = doc.viewport || {};
  if (vp.width !== 1440 || vp.height !== 1000 || vp.dpr !== 1) {
    return {code: "FIXED_VIEWPORT_REQUIRED", detail: `viewport must be 1440x1000@1, got ${vp.width}x${vp.height}@${vp.dpr}`};
  }
  // 环境身份：浏览器、字体、DPR 必须可读，不接受缺失；读取时点 read_at 必须记录。
  const env = doc.environment || {};
  if (!nonEmpty(env.browser) || !nonEmpty(env.font) || env.dpr !== 1) {
    return {code: "ENVIRONMENT_IDENTITY_MISSING", detail: "environment must record browser, font and dpr=1"};
  }
  if (!nonEmpty(doc.read_at)) return {code: "READ_AT_MISSING", detail: "read_at (observation timestamp) is required"};
  // 对象身份（page-audit 八项）必须齐备，缺项具名报出，不填默认值。
  const oi = doc.object_identity;
  if (!oi || typeof oi !== "object" || Array.isArray(oi)) {
    return {code: "OBJECT_IDENTITY_MISSING", detail: "object_identity is required (page-audit eight identities)"};
  }
  for (const key of OBJECT_IDENTITY_KEYS) {
    if (!(nonEmpty(oi[key]) || (typeof oi[key] === "number" && Number.isFinite(oi[key])))) return {code: "OBJECT_IDENTITY_MISSING", detail: `object_identity.${key} is required`};
  }
  // 设计对必须分径，不接受同路径自比；verify 开关下重算 design/impl 字节，实施字节改变必须失配。
  if (doc.design_pairs.length === 0) return {code: "SELF_COMPARISON", detail: "design_pairs is empty; cannot prove a design baseline"};
  for (const [i, pair] of doc.design_pairs.entries()) {
    if (!pair || !pair.design || !pair.implementation) return {code: SHAPE_INVALID, detail: `design_pairs[${i}] needs design and implementation`};
    if (!nonEmpty(pair.design.path) || !nonEmpty(pair.implementation.path) || !nonEmpty(pair.design.sha256) || !nonEmpty(pair.implementation.sha256)) {
      return {code: SHAPE_INVALID, detail: `design_pairs[${i}] needs path and sha256 on both sides`};
    }
    if (resolve(process.cwd(), pair.design.path) === resolve(process.cwd(), pair.implementation.path)) {
      return {code: "SELF_COMPARISON", detail: `design_pairs[${i}] compares a source against itself`};
    }
    if (doc.verify_screenshot_bytes === true) {
      for (const side of ["design", "implementation"]) {
        const rel = pair[side].path;
        const abs = resolve(process.cwd(), rel);
        if (!existsSync(abs) || !statSync(abs).isFile()) return {code: "DESIGN_PAIR_HASH_MISMATCH", detail: `design_pairs[${i}] ${side} object not readable: ${rel}`};
        const actual = sha(abs);
        if (actual !== pair[side].sha256) return {code: "DESIGN_PAIR_HASH_MISMATCH", detail: `design_pairs[${i}] ${side} bytes changed: declared ${pair[side].sha256} got ${actual}`};
      }
    }
  }
  // required_states 必须是 P4 固定八态的超集，不允许报告自定必测集。
  const declared = Array.isArray(doc.required_states) ? doc.required_states.map(String) : [];
  for (const state of REQUIRED_STATES) {
    if (!declared.includes(state)) return {code: "REQUIRED_STATES_INCOMPLETE", detail: `required_states missing ${state}`};
  }
  // 截图：非空；旧原型图哈希命中即旧图冒用；verify 开关下核文件存在与字节。
  if (doc.screenshots.length === 0) return {code: "SCREENSHOT_MISSING", detail: "screenshots is empty"};
  const forbidden = new Set(Array.isArray(doc.forbidden_old_hashes) ? doc.forbidden_old_hashes.map(String) : []);
  for (const [i, shot] of doc.screenshots.entries()) {
    if (!shot || !nonEmpty(shot.path) || !nonEmpty(shot.sha256)) return {code: SHAPE_INVALID, detail: `screenshots[${i}] needs path and sha256`};
    if (forbidden.has(String(shot.sha256))) return {code: "OLD_IMAGE_REUSE", detail: `screenshots[${i}] reuses a forbidden old prototype image`};
    if (doc.verify_screenshot_bytes === true) {
      const abs = resolve(dir, shot.path);
      if (!existsSync(abs) || !statSync(abs).isFile()) return {code: "SCREENSHOT_MISSING", detail: `screenshot file not readable: ${shot.path}`};
      if (sha(abs) !== shot.sha256) return {code: "SCREENSHOT_HASH_MISMATCH", detail: `screenshot ${shot.path} sha256 does not match`};
    }
  }
  // 状态核算：固定八态每个都要有截图或具名不可用缺口；gap 不冒已观察，不进 observed。
  const shotStates = new Set(doc.screenshots.map((s) => s && s.state));
  const gaps = Array.isArray(doc.gaps) ? doc.gaps : [];
  const gapStates = new Set(gaps.filter((g) => g && g.status === "unavailable" && nonEmpty(g.reason)).map((g) => String(g.state)));
  for (const state of REQUIRED_STATES) {
    if (!shotStates.has(state) && !gapStates.has(state)) return {code: "STATE_NOT_OBSERVED", detail: `state ${state} has neither a screenshot nor an unavailable gap`};
  }
  // 差异处置：只接受 DIFF_STATUSES；accepted 必带理由；未解决一律失败。
  for (const [i, diff] of doc.diffs.entries()) {
    if (!diff || typeof diff.status !== "string") return {code: SHAPE_INVALID, detail: `diffs[${i}] needs status`};
    if (diff.status === "accepted" && !nonEmpty(diff.reason)) return {code: "ACCEPTANCE_WITHOUT_REASON", detail: `diffs[${i}] is accepted without an independent reason`};
    if (!DIFF_STATUSES.includes(diff.status)) return {code: "UNRESOLVED_DIFF", detail: `diffs[${i}] status ${diff.status} is not resolved`};
  }
  if (Number(doc.unresolved) !== 0) return {code: "UNRESOLVED_DIFF", detail: `unresolved count is ${doc.unresolved}`};
  return null;
}

export function main(argv = process.argv.slice(2)) {
  let dir = null;
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i];
    if (name === "--dir") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) return unreadable("ARGUMENT_INVALID", "--dir needs a value");
      if (dir) return unreadable("ARGUMENT_INVALID", "duplicate --dir");
      dir = value; i += 1;
    } else return unreadable("ARGUMENT_INVALID", `unknown argument: ${name}`);
  }
  if (!dir) return unreadable(CONFIG_UNAVAILABLE, "--dir is required");
  const absoluteDir = resolve(process.cwd(), dir);
  const reviewFile = join(absoluteDir, "review.json");
  if (!existsSync(absoluteDir) || !statSync(absoluteDir).isDirectory() || !existsSync(reviewFile)) {
    return unreadable(CONFIG_UNAVAILABLE, `visual review not readable: ${reviewFile}`);
  }
  let doc;
  try { doc = JSON.parse(readFileSync(reviewFile, "utf8")); } catch (error) { return unreadable(CONFIG_UNAVAILABLE, `visual review invalid JSON: ${error.message}`); }
  const shape = validateShape(doc);
  if (shape) return unreadable(SHAPE_INVALID, shape);
  const issue = applyChecks(doc, absoluteDir);
  if (issue) return issue.code === SHAPE_INVALID ? unreadable(SHAPE_INVALID, issue.detail) : reject(issue.code, issue.detail);
  process.stdout.write(JSON.stringify({ok: true, kind: KIND, checked: doc.design_pairs.length, content: {review_sha256: sha(reviewFile)}, head: gitHead(), viewport: doc.viewport, states_observed: doc.states_observed, diffs: doc.diffs.length}) + "\n");
  return undefined;
}

function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
