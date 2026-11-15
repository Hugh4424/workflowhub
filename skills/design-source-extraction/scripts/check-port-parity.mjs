#!/usr/bin/env node
// 来源与生成物覆盖校验的唯一私有入口。消费者是 P4 实施者与独立测试者；只服务设计源提炼技能的校验面，
// 不进入公共运行时命令面，也不内置样本专用文件或类名。
//
// 用法：node check-port-parity.mjs --config <port-parity.json>
// 配置声明来源清单、输出登记、使用类与已编译类，并用 content_binding.implementation.root 指明实施输出；
// 本脚本枚举该实际输出目录，检查未登记文件、缺失登记文件、来源覆盖与未编译类，
// 并核对 content_binding 两侧（设计源与实施输出）的文件摘要。样本值只留在 fixtures。
// 退出码：0 通过；1 目标失败；2 配置或对象不可用。
//
// 失败码以本脚本 reject()/unreadable() 调用为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, readdirSync, realpathSync} from "node:fs";
import {isAbsolute, join, resolve} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const KIND = "port-parity";
const CONFIG_UNAVAILABLE = "PORT_PARITY_CONFIG_UNAVAILABLE";
const SHAPE_INVALID = "PORT_PARITY_SHAPE_INVALID";
const OBJECT_UNAVAILABLE = "PORT_PARITY_OBJECT_UNAVAILABLE";
const BINDING_INCOMPLETE = "PORT_PARITY_CONTENT_BINDING_INCOMPLETE";

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
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return "port-parity config must be an object";
  if (doc.schema_version !== "1.0.0") return "schema_version must be 1.0.0";
  if (doc.kind !== "port-parity-config") return "kind must be port-parity-config";
  for (const key of ["sources", "outputs", "used_classes", "compiled_classes"]) {
    if (!Array.isArray(doc[key])) return `${key} must be an array`;
  }
  if (doc.sources.length === 0 || doc.outputs.length === 0) return "sources and outputs must be non-empty";
  for (const [i, source] of doc.sources.entries()) {
    if (!source || typeof source.source !== "string" || typeof source.target !== "string") return `sources[${i}] needs source and target`;
  }
  for (const [i, out] of doc.outputs.entries()) {
    if (!out || typeof out.target !== "string") return `outputs[${i}] needs target`;
  }
  return null;
}
// 以实际输出目录为准：未登记文件、缺失登记文件、来源覆盖与未编译类都按真实字节判断，
// 不只看配置自己声明的数组。
function enumerateOutputFiles(root) {
  const files = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      if (entry.name.startsWith(".")) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), relative);
      else files.push(relative);
    }
  };
  walk(root, "");
  return files.sort();
}
function compiledClassesFromStyles(root, targets) {
  const classes = new Set();
  for (const target of targets) {
    const file = resolve(root, target);
    if (!existsSync(file)) return null;
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/\.([A-Za-z_][\w-]*)/g)) classes.add(match[1]);
  }
  return classes;
}
function compareCoverage(doc, {outputRoot}) {
  const registered = new Set(doc.outputs.filter((o) => o.registered === true).map((o) => o.target));
  const outputTargets = new Set(doc.outputs.map((o) => o.target));
  const actual = enumerateOutputFiles(outputRoot);
  for (const file of actual) {
    if (!registered.has(file)) return {code: "UNREGISTERED_FILE", detail: `actual output ${file} is not registered in the manifest`};
  }
  for (const [i, out] of doc.outputs.entries()) {
    if (out.registered !== true) return {code: "UNREGISTERED_FILE", detail: `outputs[${i}] ${out.target} is not registered in the manifest`};
    if (!existsSync(resolve(outputRoot, out.target))) {
      return {code: "OUTPUT_FILE_MISSING", detail: `registered output ${out.target} is missing from the actual output`};
    }
  }
  for (const [i, source] of doc.sources.entries()) {
    if (!outputTargets.has(source.target)) return {code: "SOURCE_UNCOVERED", detail: `sources[${i}] ${source.source} has no registered output target ${source.target}`};
  }
  const cssTargets = doc.outputs.filter((out) => /\.css$/.test(out.target)).map((out) => out.target);
  const compiled = compiledClassesFromStyles(outputRoot, cssTargets);
  if (!compiled) return {code: "OUTPUT_FILE_MISSING", detail: "a registered stylesheet is missing from the actual output"};
  for (const className of doc.used_classes) {
    if (!compiled.has(String(className))) return {code: "UNCOMPILED_CLASS", detail: `used class has no compiled style rule in the actual output: ${className}`};
  }
  const declared = new Set(doc.compiled_classes.map(String));
  const missing = [...declared].filter((name) => !compiled.has(name));
  const extra = [...compiled].filter((name) => !declared.has(name));
  if (missing.length || extra.length) {
    return {code: "COMPILED_CLASS_DRIFT", detail: `declared compiled classes differ from the actual stylesheet (missing: ${missing.join(",") || "-"}; extra: ${extra.join(",") || "-"})`};
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
  if (!existsSync(absolute)) return unreadable(CONFIG_UNAVAILABLE, `port-parity config not readable: ${configPath}`);
  let doc;
  try { doc = readJson(absolute); } catch (error) { return unreadable(CONFIG_UNAVAILABLE, `port-parity config invalid JSON: ${error.message}`); }
  const shape = validateShape(doc);
  if (shape) return unreadable(SHAPE_INVALID, shape);
  const binding = checkContentBinding(doc);
  if (binding.issue) return binding.issue.code === "CONTENT_MISMATCH" ? reject(binding.issue.code, binding.issue.detail) : unreadable(binding.issue.code, binding.issue.detail);
  const issue = compareCoverage(doc, {outputRoot: binding.implementationRoot});
  if (issue) return reject(issue.code, issue.detail);
  process.stdout.write(JSON.stringify({ok: true, kind: KIND, checked: doc.sources.length + doc.used_classes.length, content: {config_sha256: sha(absolute), inputs: binding.inputs}, head: gitHead(), sources: doc.sources.map((s) => s.source), outputs: doc.outputs.map((o) => o.target), implementation_root: binding.implementationRoot}) + "\n");
  return undefined;
}
function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
