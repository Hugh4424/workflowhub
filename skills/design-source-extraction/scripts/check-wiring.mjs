#!/usr/bin/env node
// 既有功能接线与恢复的唯一私有检查入口。消费者是 P3 接线实施者与独立测试者；
// 本脚本只服务设计源提炼技能的接线面，不进入公共运行时命令面。
//
// 输入是一份 wiring.md，正文给人读，机器块给本脚本读。检查由机器块自身声明驱动：
// legacy_interface 与 legacy_hooks 决定「旧接口」和「旧钩子」，链条按声明逐项校验，
// 不内置任何样本专用链名、参数值或钩子。样本的具体参数只留在夹具与测试。
// 退出码：0 三链已接回或缺口合规；1 断开/错接/缺证明/恢复不足；2 输入不可读或参数错误。
//
// 失败码以本脚本 reject()/unreadable() 调用为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, realpathSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const CHAIN_DIMENSIONS = ["function", "interface", "entry"];

function text(value) {
  return typeof value === "string" && value.trim() !== "";
}

function reject(code, detail) {
  process.stdout.write(JSON.stringify({wiring_valid: false, ok: false, error: {code, detail}}) + "\n");
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 1;
}

function unreadable(code, detail) {
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 2;
}

export function readWiringMap(path) {
  if (!text(path)) throw Object.assign(new Error("--map is required"), {code: "MAP_REQUIRED", kind: "usage"});
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw Object.assign(new Error(`wiring map not found: ${absolute}`), {code: "WIRING_MAP_UNREADABLE", kind: "io"});
  const bytes = readFileSync(absolute, "utf8");
  const match = /```json\r?\n([\s\S]*?)```/.exec(bytes);
  if (!match) throw Object.assign(new Error("wiring.md has no fenced json machine block"), {code: "WIRING_MACHINE_BLOCK_MISSING", kind: "io"});
  let value;
  try {
    value = JSON.parse(match[1]);
  } catch (error) {
    throw Object.assign(new Error(`machine block is not valid JSON: ${error.message}`), {code: "WIRING_MACHINE_BLOCK_INVALID", kind: "io"});
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("machine block must be an object"), {code: "WIRING_MACHINE_BLOCK_INVALID", kind: "io"});
  return value;
}

function interfacePath(interfaceValue) {
  const parts = String(interfaceValue || "").trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : "";
}

function chainHasHook(chain, required) {
  if (!Array.isArray(chain.hooks)) return false;
  return chain.hooks.some((hook) => hook && hook.selector === required.selector && hook.attribute === required.attribute && hook.value === required.value);
}

function checkChain(chain, context) {
  if (!chain || typeof chain !== "object" || Array.isArray(chain)) return {code: "INCOMPLETE_CHAIN", detail: "a chain must be an object"};
  if (chain.status === "disconnected" || chain.status === "broken") return {code: "DISCONNECTED_HANDLER", detail: `${chain.id} handler is disconnected`};
  if (chain.status === "wrong_interface" || chain.status === "miswired") return {code: "WRONG_INTERFACE", detail: `${chain.id} points at the wrong interface`};
  if (!["wired", "gap"].includes(chain.status)) return {code: "INVALID_STATUS", detail: `${chain.id} has status ${String(chain.status)}`};
  if (chain.status === "gap") {
    if (!text(chain.reason)) return {code: "GAP_WITHOUT_REASON", detail: `${chain.id} gap has no reason`};
    if (!text(chain.attempt_ref)) return {code: "GAP_WITHOUT_ATTEMPT", detail: `${chain.id} gap has no attempt_ref`};
    if (!text(chain.review_ref)) return {code: "GAP_WITHOUT_REVIEW", detail: `${chain.id} gap has no review_ref`};
    return null;
  }
  for (const key of CHAIN_DIMENSIONS) {
    if (!text(chain[key])) return {code: "INCOMPLETE_CHAIN", detail: `${chain.id}.${key} is empty`};
  }
  if (!chain.entry.startsWith("#")) return {code: "WRONG_ENTRY", detail: `${chain.id}.entry must be a page selector`};
  const path = interfacePath(chain.interface);
  if (!(path === context.legacyInterface || path.startsWith(context.legacyInterface + "/"))) {
    return {code: "WRONG_INTERFACE", detail: `${chain.id}.interface must stay under the declared legacy interface ${context.legacyInterface}`};
  }
  for (const hook of context.legacyHooks) {
    if (!chainHasHook(chain, hook)) return {code: "LEGACY_HOOK_MISSING", detail: `${chain.id} is missing the ${hook.selector}[${hook.attribute}=${hook.value}] hook`};
  }
  if (!chain.expected_params || typeof chain.expected_params !== "object" || Array.isArray(chain.expected_params) || Object.keys(chain.expected_params).length === 0) {
    return {code: "PARAM_MISMATCH", detail: `${chain.id}.expected_params must be a non-empty object`};
  }
  if (!text(chain.receipt_ref)) return {code: "RECEIPT_MISSING", detail: `${chain.id}.receipt_ref is empty`};
  if (!text(chain.attempt_ref)) return {code: "WIRED_MISSING_ATTEMPT", detail: `${chain.id}.attempt_ref is empty for a wired chain`};
  if (!text(chain.review_ref)) return {code: "WIRED_MISSING_REVIEW", detail: `${chain.id}.review_ref is empty for a wired chain`};
  return null;
}

export function validateWiringMap(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return {code: "WIRING_MACHINE_BLOCK_INVALID", detail: "wiring map must be an object"};
  if (doc.schema_version !== "1.0.0") return {code: "SCHEMA_UNSUPPORTED", detail: "schema_version must be 1.0.0"};
  if (doc.kind !== "wiring-map") return {code: "KIND_UNSUPPORTED", detail: "kind must be wiring-map"};
  if (doc.version !== "wiring-map.v1") return {code: "VERSION_UNSUPPORTED", detail: "version must be wiring-map.v1"};
  if (!Array.isArray(doc.chain_dimensions) || !CHAIN_DIMENSIONS.every((dimension) => doc.chain_dimensions.includes(dimension))) {
    return {code: "MISSING_CHAIN_DIMENSION", detail: "chain_dimensions must name function, interface and entry"};
  }
  if (!text(doc.legacy_interface) || !doc.legacy_interface.startsWith("/")) {
    return {code: "LEGACY_INTERFACE_MISSING", detail: "legacy_interface must be a path starting with /"};
  }
  if (!Array.isArray(doc.legacy_hooks) || doc.legacy_hooks.length === 0) {
    return {code: "LEGACY_HOOKS_MISSING", detail: "legacy_hooks must be a non-empty array"};
  }
  for (const [index, hook] of doc.legacy_hooks.entries()) {
    if (!hook || typeof hook !== "object" || !text(hook.selector) || !text(hook.attribute) || !text(hook.value)) {
      return {code: "LEGACY_HOOKS_INVALID", detail: `legacy_hooks[${index}] needs selector, attribute and value`};
    }
  }
  if (!Array.isArray(doc.chains) || doc.chains.length < 2) return {code: "MISSING_CHAINS", detail: "chains must list at least two chains"};
  const context = {legacyInterface: doc.legacy_interface, legacyHooks: doc.legacy_hooks};
  for (const chain of doc.chains) {
    const issue = checkChain(chain, context);
    if (issue) return issue;
  }
  const gaps = Array.isArray(doc.gaps) ? doc.gaps : [];
  for (const [index, gap] of gaps.entries()) {
    if (!gap || typeof gap !== "object" || Array.isArray(gap)) return {code: "GAP_INVALID", detail: `gaps[${index}] is not an object`};
    if (!text(gap.reason)) return {code: "GAP_WITHOUT_REASON", detail: `gaps[${index}] has no reason`};
    if (!text(gap.attempt_ref)) return {code: "GAP_WITHOUT_ATTEMPT", detail: `gaps[${index}] has no attempt_ref`};
    if (!text(gap.review_ref)) return {code: "GAP_WITHOUT_REVIEW", detail: `gaps[${index}] has no review_ref`};
  }
  const recovery = doc.recovery;
  if (!recovery || typeof recovery !== "object") return {code: "MISSING_RECOVERY", detail: "recovery is missing"};
  if (!text(recovery.object)) return {code: "MISSING_RECOVERY", detail: "recovery.object is empty"};
  if (!Array.isArray(recovery.replay) || recovery.replay.length === 0) return {code: "MISSING_RECOVERY", detail: "recovery.replay must list the replayed legacy inputs"};
  if (recovery.restored !== true) return {code: "RECOVERY_NOT_RESTORED", detail: "recovery.restored must be true"};
  return null;
}

export function summarize(doc) {
  return {
    chain_dimensions: Array.isArray(doc.chain_dimensions) ? doc.chain_dimensions : [],
    legacy_interface: typeof doc.legacy_interface === "string" ? doc.legacy_interface : null,
    chains: Array.isArray(doc.chains) ? doc.chains.map((chain) => ({id: chain && chain.id, status: chain && chain.status, interface: chain && chain.interface, entry: chain && chain.entry})) : [],
    gaps: Array.isArray(doc.gaps) ? doc.gaps.length : 0,
    recovery_restored: Boolean(doc.recovery && doc.recovery.restored === true),
  };
}

export function main(argv = process.argv.slice(2)) {
  let mapPath = null;
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === "--map") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) return unreadable("ARGUMENT_INVALID", "--map needs a value");
      if (mapPath) return unreadable("ARGUMENT_INVALID", "duplicate --map");
      mapPath = value;
      index += 1;
    } else {
      return unreadable("ARGUMENT_INVALID", `unknown argument: ${name}`);
    }
  }
  let doc;
  try {
    doc = readWiringMap(mapPath);
  } catch (error) {
    return unreadable(error.code || "WIRING_MAP_UNREADABLE", error.message);
  }
  let issue;
  try {
    issue = validateWiringMap(doc);
  } catch (error) {
    return reject("WIRING_VALIDATION_ERROR", String(error && error.message || error));
  }
  if (issue) return reject(issue.code, issue.detail);
  process.stdout.write(JSON.stringify({wiring_valid: true, ok: true, ...summarize(doc)}) + "\n");
  return undefined;
}

function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
