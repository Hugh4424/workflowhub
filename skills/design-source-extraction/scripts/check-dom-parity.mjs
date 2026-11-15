#!/usr/bin/env node
// 结构对等的唯一私有入口。消费者是 P4 实施者与独立测试者；只服务设计源提炼技能的校验面，
// 不进入公共运行时命令面，也不内置浏览器探针或样本专用选择器。
//
// 用法：node check-dom-parity.mjs --config <dom-parity.json>
// 配置同时给出独立设计 DOM 的期望节点与实施侧观测节点；本脚本逐节点比较标签、类名、直接文本与层级，
// 并核对 content_binding 声明的被比较文件摘要与当前 HEAD。样本值只留在 fixtures。
// 退出码：0 通过；1 目标失败；2 配置或对象不可用。
//
// 失败码以本脚本 reject()/unreadable() 调用为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, realpathSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const KIND = "dom-parity";
const CONFIG_UNAVAILABLE = "DOM_PARITY_CONFIG_UNAVAILABLE";
const SHAPE_INVALID = "DOM_PARITY_SHAPE_INVALID";
const OBJECT_UNAVAILABLE = "DOM_PARITY_OBJECT_UNAVAILABLE";

function sha(file) { return createHash("sha256").update(readFileSync(file)).digest("hex"); }
function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
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
function normText(value) { return value === null || value === undefined ? null : String(value).replace(/\s+/g, " ").trim(); }
function normClasses(value) { return Array.isArray(value) ? [...value].map(String).sort() : null; }

function checkContentBinding(doc) {
  const binding = doc && doc.content_binding;
  if (!binding || !Array.isArray(binding.files) || binding.files.length === 0) {
    return {issue: {code: SHAPE_INVALID, detail: "content_binding.files must be a non-empty array"}};
  }
  const inputs = [];
  for (const [index, entry] of binding.files.entries()) {
    if (!entry || typeof entry.path !== "string" || typeof entry.sha256 !== "string") {
      return {issue: {code: SHAPE_INVALID, detail: `content_binding.files[${index}] needs path and sha256`}};
    }
    const absolute = resolve(process.cwd(), entry.path);
    if (!existsSync(absolute)) return {issue: {code: OBJECT_UNAVAILABLE, detail: `content object not readable: ${entry.path}`}};
    const actual = sha(absolute);
    if (actual !== entry.sha256) return {issue: {code: "CONTENT_MISMATCH", detail: `${entry.path} changed: expected ${entry.sha256} got ${actual}`}};
    inputs.push({path: entry.path, sha256: actual});
  }
  return {inputs};
}

function validateShape(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return "dom-parity config must be an object";
  if (doc.schema_version !== "1.0.0") return "schema_version must be 1.0.0";
  if (doc.kind !== "dom-parity-config") return "kind must be dom-parity-config";
  if (typeof doc.selected_root !== "string" || doc.selected_root === "") return "selected_root is required";
  for (const key of ["nodes", "implementation"]) {
    if (!Array.isArray(doc[key]) || doc[key].length === 0) return `${key} must be a non-empty array`;
    for (const [index, node] of doc[key].entries()) {
      if (!node || typeof node !== "object") return `${key}[${index}] must be an object`;
      if (typeof node.tag !== "string" || node.tag === "") return `${key}[${index}].tag is required`;
      if (!Array.isArray(node.classes)) return `${key}[${index}].classes must be an array`;
      if (typeof node.depth !== "number") return `${key}[${index}].depth must be a number`;
    }
  }
  return null;
}

function compareNodes(doc) {
  const design = doc.nodes, impl = doc.implementation;
  if (design.length !== impl.length) return {code: "DOM_NODE_COUNT_MISMATCH", detail: `design ${design.length} nodes vs implementation ${impl.length}`};
  for (let i = 0; i < design.length; i += 1) {
    const d = design[i], o = impl[i];
    if (d.tag !== o.tag) return {code: "DOM_TAG_MISMATCH", detail: `node[${i}] ${d.path || d.tag}: design <${d.tag}> vs implementation <${o.tag}>`};
    const dc = normClasses(d.classes), oc = normClasses(o.classes);
    if (JSON.stringify(dc) !== JSON.stringify(oc)) return {code: "DOM_CLASS_MISMATCH", detail: `node[${i}] ${d.path || d.tag}: classes design ${JSON.stringify(dc)} vs implementation ${JSON.stringify(oc)}`};
    if (normText(d.direct_text) !== normText(o.direct_text)) return {code: "DOM_TEXT_MISMATCH", detail: `node[${i}] ${d.path || d.tag}: direct text design ${JSON.stringify(normText(d.direct_text))} vs implementation ${JSON.stringify(normText(o.direct_text))}`};
    if (d.depth !== o.depth) return {code: "DOM_DEPTH_MISMATCH", detail: `node[${i}] ${d.path || d.tag}: depth design ${d.depth} vs implementation ${o.depth}`};
  }
  return null;
}

export function main(argv = process.argv.slice(2)) {
  let configPath = null;
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i];
    if (name === "--config") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) return unreadable("ARGUMENT_INVALID", "--config needs a value");
      if (configPath) return unreadable("ARGUMENT_INVALID", "duplicate --config");
      configPath = value; i += 1;
    } else return unreadable("ARGUMENT_INVALID", `unknown argument: ${name}`);
  }
  if (!configPath) return unreadable(CONFIG_UNAVAILABLE, "--config is required");
  const absolute = resolve(process.cwd(), configPath);
  if (!existsSync(absolute)) return unreadable(CONFIG_UNAVAILABLE, `dom-parity config not readable: ${configPath}`);
  let doc;
  try { doc = readJson(absolute); } catch (error) { return unreadable(CONFIG_UNAVAILABLE, `dom-parity config invalid JSON: ${error.message}`); }
  const shape = validateShape(doc);
  if (shape) return unreadable(SHAPE_INVALID, shape);
  const binding = checkContentBinding(doc);
  if (binding.issue) return binding.issue.code === OBJECT_UNAVAILABLE ? unreadable(binding.issue.code, binding.issue.detail) : reject(binding.issue.code, binding.issue.detail);
  const issue = compareNodes(doc);
  if (issue) return reject(issue.code, issue.detail);
  process.stdout.write(JSON.stringify({ok: true, kind: KIND, checked: doc.nodes.length, content: {config_sha256: sha(absolute), inputs: binding.inputs}, head: gitHead(), selected_root: doc.selected_root}) + "\n");
  return undefined;
}

function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
