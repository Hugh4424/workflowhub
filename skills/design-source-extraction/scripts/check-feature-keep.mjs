#!/usr/bin/env node
// 功能保留校验的唯一私有入口。消费者是 P4 实施者与独立测试者；只服务设计源提炼技能的校验面，
// 不进入公共运行时命令面，也不内置样本专用选择器、文本或角色。
//
// 用法：node check-feature-keep.mjs --config <feature-keep.json>
// 配置按旧功能清单声明每条功能的期望属性（标签/文本/控件角色/旧钩子）与实施侧观测值；
// 本脚本逐条比较选择器存在性、文本、控件角色与旧钩子，并核对 content_binding 声明的文件摘要与 HEAD。
// 样本值只留在 fixtures。退出码：0 通过；1 目标失败；2 配置或对象不可用。
//
// 失败码以本脚本 reject()/unreadable() 调用为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, resolve} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const KIND = "feature-keep";
const CONFIG_UNAVAILABLE = "FEATURE_KEEP_CONFIG_UNAVAILABLE";
const SHAPE_INVALID = "FEATURE_KEEP_SHAPE_INVALID";
const OBJECT_UNAVAILABLE = "FEATURE_KEEP_OBJECT_UNAVAILABLE";
const BINDING_INCOMPLETE = "FEATURE_KEEP_CONTENT_BINDING_INCOMPLETE";

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
// 内容身份必须两侧齐备：只绑设计源时，实施字节被改也察觉不到；缺任何一侧算未验证。
// 设计侧路径相对仓库根；实施侧路径相对配置声明的实施输出根，报告与重生成输出可逐字节比对。
function bindingEntries(binding, side) {
  const section = binding && binding[side];
  return section && Array.isArray(section.files) && section.files.length > 0 ? section.files : null;
}
function checkContentBinding(doc) {
  const binding = doc && doc.content_binding;
  if (!binding || typeof binding !== "object") {
    return {issue: {code: BINDING_INCOMPLETE, detail: "content_binding must declare design and implementation sides"}};
  }
  const design = bindingEntries(binding, "design");
  const implementation = bindingEntries(binding, "implementation");
  if (!design) return {issue: {code: BINDING_INCOMPLETE, detail: "content_binding.design.files must be a non-empty array"}};
  if (!implementation) return {issue: {code: BINDING_INCOMPLETE, detail: "content_binding.implementation.files must be a non-empty array"}};
  const declaredRoot = binding.implementation && binding.implementation.root;
  if (typeof declaredRoot !== "string" || declaredRoot.trim() === "") {
    return {issue: {code: BINDING_INCOMPLETE, detail: "content_binding.implementation.root must name the implementation output directory"}};
  }
  const implementationRoot = isAbsolute(declaredRoot) ? resolve(declaredRoot) : resolve(process.cwd(), declaredRoot);
  const inputs = [];
  for (const [side, entries, root] of [["design", design, process.cwd()], ["implementation", implementation, implementationRoot]]) {
    for (const [index, entry] of entries.entries()) {
      if (!entry || typeof entry.path !== "string" || entry.path === "" || typeof entry.sha256 !== "string") {
        return {issue: {code: SHAPE_INVALID, detail: `content_binding.${side}.files[${index}] needs path and sha256`}};
      }
      const absolute = isAbsolute(entry.path) ? resolve(entry.path) : resolve(root, entry.path);
      if (!existsSync(absolute)) return {issue: {code: OBJECT_UNAVAILABLE, detail: `${side} content object not readable: ${entry.path}`}};
      const actual = sha(absolute);
      if (actual !== entry.sha256) return {issue: {code: "CONTENT_MISMATCH", detail: `${side} ${entry.path} changed: expected ${entry.sha256} got ${actual}`}};
      inputs.push({side, path: entry.path, sha256: actual});
    }
  }
  return {inputs, implementationRoot};
}
function validateShape(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return "feature-keep config must be an object";
  if (doc.schema_version !== "1.0.0") return "schema_version must be 1.0.0";
  if (doc.kind !== "feature-keep-config") return "kind must be feature-keep-config";
  if (!Array.isArray(doc.features) || doc.features.length === 0) return "features must be a non-empty array";
  for (const [i, f] of doc.features.entries()) {
    if (!f || typeof f !== "object") return `features[${i}] must be an object`;
    if (typeof f.id !== "string" || f.id === "") return `features[${i}].id is required`;
    if (typeof f.selector !== "string" || f.selector === "") return `features[${i}].selector is required`;
    if (!f.expected || typeof f.expected !== "object") return `features[${i}].expected is required`;
    if (!f.observed || typeof f.observed !== "object") return `features[${i}].observed is required`;
    if (typeof f.observed.present !== "boolean") return `features[${i}].observed.present must be an explicit boolean`;
  }
  return null;
}
// 逐条功能比较：选择器存在性 -> 标签 -> 文本 -> 控件角色 -> 旧钩子。
function compareFeatures(doc) {
  for (const feature of doc.features) {
    const e = feature.expected, o = feature.observed;
    if (o.present !== true) return {code: "FEATURE_SELECTOR_MISSING", detail: `${feature.id}: selector ${feature.selector} not present in implementation`};
    if (typeof e.tag === "string" && e.tag !== o.tag) return {code: "FEATURE_TAG_CHANGED", detail: `${feature.id}: tag ${e.tag} -> ${o.tag}`};
    if (e.text !== undefined && normText(e.text) !== normText(o.text)) return {code: "FEATURE_TEXT_CHANGED", detail: `${feature.id}: text ${JSON.stringify(normText(e.text))} -> ${JSON.stringify(normText(o.text))}`};
    if (e.role !== undefined && String(e.role) !== String(o.role)) return {code: "FEATURE_ROLE_CHANGED", detail: `${feature.id}: role ${String(e.role)} -> ${String(o.role)}`};
    if (e.attribute !== undefined || e.value !== undefined) {
      if (e.attribute !== o.attribute || e.value !== o.value) return {code: "FEATURE_HOOK_MISSING", detail: `${feature.id}: hook ${e.attribute}=${e.value} -> ${o.attribute}=${o.value}`};
    }
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
  if (!existsSync(absolute)) return unreadable(CONFIG_UNAVAILABLE, `feature-keep config not readable: ${configPath}`);
  let doc;
  try { doc = readJson(absolute); } catch (error) { return unreadable(CONFIG_UNAVAILABLE, `feature-keep config invalid JSON: ${error.message}`); }
  const shape = validateShape(doc);
  if (shape) return unreadable(SHAPE_INVALID, shape);
  const binding = checkContentBinding(doc);
  if (binding.issue) return binding.issue.code === "CONTENT_MISMATCH" ? reject(binding.issue.code, binding.issue.detail) : unreadable(binding.issue.code, binding.issue.detail);
  const issue = compareFeatures(doc);
  if (issue) return reject(issue.code, issue.detail);
  process.stdout.write(JSON.stringify({ok: true, kind: KIND, checked: doc.features.length, content: {config_sha256: sha(absolute), inputs: binding.inputs}, head: gitHead(), features: doc.features.map((f) => ({id: f.id, selector: f.selector}))}) + "\n");
  return undefined;
}
function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
