#!/usr/bin/env node
// 几何校验的唯一私有入口。消费者是 P4 实施者与独立测试者；只服务设计源提炼技能的校验面，
// 不进入公共运行时命令面，也不内置浏览器探针或样本专用值。
//
// 用法：node check-geometry.mjs --config <geometry.json>
// 几何配置由项目提供：每条探针同时给设计侧期望值与实施侧观测值，本脚本只做带 0.5px 容差的比较，
// 并核对 content_binding 声明的被比较文件摘要与当前 HEAD。样本值只留在 fixtures。
// 退出码：0 通过；1 目标失败（容差/取值/内容不符）；2 配置或对象不可用（unverified/unavailable）。
//
// 失败码以本脚本 reject()/unreadable() 调用为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, resolve} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const KIND = "geometry";
const CONFIG_UNAVAILABLE = "GEOMETRY_CONFIG_UNAVAILABLE";
const SHAPE_INVALID = "GEOMETRY_SHAPE_INVALID";
const OBJECT_UNAVAILABLE = "GEOMETRY_OBJECT_UNAVAILABLE";
const BINDING_INCOMPLETE = "GEOMETRY_CONTENT_BINDING_INCOMPLETE";

function sha(file) { return createHash("sha256").update(readFileSync(file)).digest("hex"); }
function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function gitHead() {
  try { const r = spawnSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}); return r.status === 0 ? String(r.stdout).trim() : null; }
  catch { return null; }
}
function unreadable(code, detail) {
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 2;
}
function reject(code, detail) {
  process.stdout.write(JSON.stringify({ok: false, kind: KIND, error: {code, detail}}) + "\n");
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 1;
}

// 内容身份：每个被比较文件必须存在且摘要等于声明值；变化（即便 HEAD 不变）即失配。
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
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return "geometry config must be an object";
  if (doc.schema_version !== "1.0.0") return "schema_version must be 1.0.0";
  if (doc.kind !== "geometry-config") return "kind must be geometry-config";
  if (typeof doc.tolerance_px !== "number" || !(doc.tolerance_px >= 0)) return "tolerance_px must be a non-negative number";
  if (!Array.isArray(doc.probes) || doc.probes.length === 0) return "probes must be a non-empty array";
  for (const [index, probe] of doc.probes.entries()) {
    if (!probe || typeof probe !== "object") return `probes[${index}] must be an object`;
    if (typeof probe.id !== "string" || probe.id === "") return `probes[${index}].id is required`;
    if (typeof probe.selector !== "string" || probe.selector === "") return `probes[${index}].selector is required`;
    if (typeof probe.property !== "string" || probe.property === "") return `probes[${index}].property is required`;
    // design 与 implementation 必须同时存在且为 number/string，避免空探针走非数值分支静默通过。
    if (probe.design === undefined || probe.design === null) return `probes[${index}].design is required`;
    if (probe.implementation === undefined || probe.implementation === null) return `probes[${index}].implementation is required`;
    if (!["number", "string"].includes(typeof probe.design) || !["number", "string"].includes(typeof probe.implementation)) {
      return `probes[${index}].design/implementation must be a number or string`;
    }
  }
  return null;
}

function compareProbes(doc) {
  const tolerance = doc.tolerance_px;
  for (const probe of doc.probes) {
    const {design, implementation} = probe;
    if (typeof design === "undefined" || typeof implementation === "undefined") {
      return {code: "GEOMETRY_VALUE_INVALID", detail: `${probe.id} is missing design or implementation`};
    }
    if (probe.unit === "px" || (typeof design === "number" && typeof implementation === "number")) {
      if (typeof design !== "number" || typeof implementation !== "number" || !Number.isFinite(design) || !Number.isFinite(implementation)) {
        return {code: "GEOMETRY_VALUE_INVALID", detail: `${probe.id}.${probe.property} must be finite numbers`};
      }
      if (Math.abs(design - implementation) > tolerance) {
        return {code: "GEOMETRY_TOLERANCE_EXCEEDED", detail: `${probe.id}.${probe.property}: design ${design} vs implementation ${implementation} exceeds ${tolerance}px`};
      }
    } else if (String(design) !== String(implementation)) {
      return {code: "GEOMETRY_VALUE_MISMATCH", detail: `${probe.id}.${probe.property}: design ${String(design)} vs implementation ${String(implementation)}`};
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
  if (!existsSync(absolute)) return unreadable(CONFIG_UNAVAILABLE, `geometry config not readable: ${configPath}`);
  let doc;
  try { doc = readJson(absolute); } catch (error) { return unreadable(CONFIG_UNAVAILABLE, `geometry config invalid JSON: ${error.message}`); }
  const shape = validateShape(doc);
  if (shape) return unreadable(SHAPE_INVALID, shape);
  const binding = checkContentBinding(doc);
  if (binding.issue) return binding.issue.code === "CONTENT_MISMATCH" ? reject(binding.issue.code, binding.issue.detail) : unreadable(binding.issue.code, binding.issue.detail);
  const issue = compareProbes(doc);
  if (issue) return reject(issue.code, issue.detail);
  process.stdout.write(JSON.stringify({ok: true, kind: KIND, checked: doc.probes.length, content: {config_sha256: sha(absolute), inputs: binding.inputs}, head: gitHead(), probes: doc.probes.map((p) => ({id: p.id, selector: p.selector, property: p.property}))}) + "\n");
  return undefined;
}

function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
