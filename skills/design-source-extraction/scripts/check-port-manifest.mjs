#!/usr/bin/env node
// 移植登记与样式生成的唯一私有检查入口。消费者是移植实施者与独立测试者；
// 本脚本只服务设计源提炼技能的移植面，不进入公共运行时命令面。
//
// 默认 --mode=check：读登记、只读设计源，按登记模拟生成并核样式闭合；
// 给了 --output 时再逐字节比较现有输出。
// --mode=generate --output <目录>：真实生成移植件与样式，手改文件已存在时保留。
// 退出码：0 通过；1 目标检查失败；2 参数或输入不可读。
import {existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {basename, dirname, isAbsolute, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const MODES = new Set(["check", "generate"]);
const FILE_MODES = new Set(["copy", "changed", "generated"]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function text(value) {
  return typeof value === "string" && value.trim() !== "";
}
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function fail(code, detail) {
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 1;
  return false;
}
function usage(code, detail) {
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 2;
  return false;
}
function looseRelative(name) {
  if (!text(name) || isAbsolute(name) || name.includes("\\")) return false;
  return name.replace(/^\.\//, "") !== "";
}
function safeRelative(name) {
  if (!looseRelative(name)) return false;
  const normalized = name.replace(/^\.\//, "");
  return !normalized.split("/").includes("..");
}
function insidePath(candidate, root) {
  return candidate === root || candidate.startsWith(root + "/");
}
// 写盘前按真实路径判定：输出目录或目标文件经符号链接指到设计源（含其子目录）时拒绝写入。
// 返回可写的解析目标；落在设计源树内时返回 null。
function resolvableTarget(targetPath, designReal) {
  const parentReal = existsSync(dirname(targetPath)) ? realpathSync(dirname(targetPath)) : null;
  if (parentReal === null) return null;
  const resolved = resolve(parentReal, basename(targetPath));
  if (insidePath(resolved, designReal)) return null;
  if (existsSync(targetPath) && insidePath(realpathSync(targetPath), designReal)) return null;
  return resolved;
}
function splitSelectorList(prelude) {
  return prelude.split(",").map((item) => item.trim()).filter(Boolean);
}
function stripComments(value) {
  return String(value).replace(/\/\*[\s\S]*?\*\//g, "");
}
function atRuleName(prelude) {
  const match = /^@([\w-]+)/.exec(String(prelude).trim());
  return match ? match[1].toLowerCase() : "";
}
// @keyframes（含厂商前缀）的帧选择器是关键字，不是页面内容选择器。
function isKeyframes(name) {
  return name === "keyframes" || name.endsWith("-keyframes");
}
function insideKeyframes(stack) {
  return stack.some((entry) => entry.kind === "at" && isKeyframes(entry.name));
}
// 单次遍历：按花括号栈区分 at-rule、关键帧与普通规则；普通规则才带页面作用域。
function scanStyles(source, {scope = null, rewrite = false} = {}) {
  const selectors = [];
  const stack = [];
  let output = "";
  let buffer = "";
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (character === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      const comment = end < 0 ? source.slice(index) : source.slice(index, end + 2);
      buffer += comment;
      index += comment.length;
      continue;
    }
    if (character === "{") {
      const prelude = buffer;
      const plain = stripComments(prelude).trim();
      buffer = "";
      if (plain.startsWith("@")) {
        stack.push({kind: "at", name: atRuleName(plain)});
        output += prelude + "{";
      } else if (insideKeyframes(stack)) {
        stack.push({kind: "frame"});
        output += prelude + "{";
      } else {
        stack.push({kind: "rule"});
        const rules = splitSelectorList(plain);
        if (rewrite && scope) {
          const scoped = rules.map((selector) => withinScope(selector, scope) ? selector : `${scope} ${selector}`);
          selectors.push(...scoped);
          output += formatPrelude(prelude, scoped) + "{";
        } else {
          selectors.push(...rules);
          output += prelude + "{";
        }
      }
      index += 1;
      continue;
    }
    if (character === "}") {
      output += buffer + "}";
      buffer = "";
      stack.pop();
      index += 1;
      continue;
    }
    buffer += character;
    index += 1;
  }
  output += buffer;
  return {text: output, selectors};
}
function collectSelectors(source) {
  return scanStyles(source).selectors;
}
function specificity(selector) {
  const value = selector.trim();
  const ids = (value.match(/#[\w-]+/g) || []).length;
  const classes = (value.match(/\.[\w-]+/g) || []).length
    + (value.match(/\[[^\]]*\]/g) || []).length
    + (value.match(/:(?!:)[\w-]+/g) || []).length;
  const elements = (value.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length
    + (value.match(/::[\w-]+/g) || []).length;
  return [ids, classes, elements];
}
function greaterThan(left, right) {
  // 特异性按字典序比较：前一位相等才看下一位。
  // 这样 (0,1,2) 的选择器不会被 (0,3,1) 的预算误判为超限。
  if (left[0] !== right[0]) return left[0] > right[0];
  if (left[1] !== right[1]) return left[1] > right[1];
  return left[2] > right[2];
}
function withinScope(selector, scope) {
  if (selector === scope) return true;
  return [" ", ">", "+", "~", ":"].some((separator) => selector.startsWith(scope + separator));
}
function classTokens(selector) {
  return (selector.match(/\.[\w-]+/g) || []).map((token) => token.slice(1));
}
function htmlClasses(html) {
  const classes = new Set();
  for (const match of html.matchAll(/class\s*=\s*"([^"]*)"/g)) {
    for (const name of match[1].split(/\s+/)) if (name) classes.add(name);
  }
  return classes;
}
function formatPrelude(prelude, selectors) {
  const leading = prelude.match(/^\s*/)[0];
  const trailing = prelude.match(/\s*$/)[0];
  return `${leading}${selectors.join(", ")}${trailing}`;
}
function generateStyles(source, scope) {
  const scanned = scanStyles(source);
  if (scanned.selectors.every((selector) => withinScope(selector, scope))) {
    return {text: source, applied: false, selectors: scanned.selectors};
  }
  // At-rule preludes (@media/@supports) and @keyframes frame selectors are structural:
  // never prefix them with the page-root selector, or the generated CSS becomes invalid.
  const rewritten = scanStyles(source, {scope, rewrite: true});
  return {text: rewritten.text, applied: true, selectors: rewritten.selectors};
}
function applyChanges(source, changes) {
  const lines = source.split("\n");
  const sorted = [...changes].sort((left, right) => left.line - right.line);
  const used = new Set();
  for (const change of sorted) {
    if (!Number.isInteger(change.line) || change.line < 1 || change.line > lines.length) {
      return {error: {code: "CHANGE_ANCHOR_MISMATCH", detail: `line ${String(change.line)} is outside ${change.source ?? "the source"}`}};
    }
    if (used.has(change.line)) return {error: {code: "DUPLICATE_CHANGE_LINE", detail: `line ${change.line} is changed twice`}};
    used.add(change.line);
    if (lines[change.line - 1] !== change.from) {
      return {error: {code: "CHANGE_ANCHOR_MISMATCH", detail: `line ${change.line} no longer matches the registered source text`}};
    }
    if (!text(change.to)) return {error: {code: "CHANGE_ANCHOR_MISMATCH", detail: `line ${change.line} has no target text`}};
  }
  const output = [];
  let cursor = 0;
  for (const change of sorted) {
    output.push(...lines.slice(cursor, change.line - 1));
    output.push(...change.to.split("\n"));
    cursor = change.line;
  }
  output.push(...lines.slice(cursor));
  return {text: output.join("\n")};
}
function refLine(ref) {
  if (!text(ref)) return null;
  const match = /^(.*):(\d+)$/.exec(ref);
  if (!match) return null;
  return {path: match[1], line: Number(match[2])};
}
function readBasisLine(manifestDir, ref) {
  const parsed = refLine(ref);
  if (!parsed || !looseRelative(parsed.path)) return null;
  const absolute = resolve(manifestDir, parsed.path);
  if (!existsSync(absolute)) return null;
  const lines = readFileSync(absolute, "utf8").split("\n");
  if (parsed.line < 1 || parsed.line > lines.length) return null;
  return lines[parsed.line - 1];
}
function componentwiseMax(rules) {
  return rules.reduce((budget, rule) => [
    Math.max(budget[0], rule.specificity[0]),
    Math.max(budget[1], rule.specificity[1]),
    Math.max(budget[2], rule.specificity[2]),
  ], [0, 0, 0]);
}
function styleIssue(selectors, {scope, budget, hostShell, usedClasses}) {
  for (const selector of selectors) {
    if (!withinScope(selector, scope)) return {code: "SCOPE_VIOLATION", detail: `selector escapes the page root: ${selector}`};
  }
  for (const selector of selectors) {
    for (const host of hostShell) {
      if (selector === host || selector.startsWith(host + " ") || selector.startsWith(host + ">")
        || selector.startsWith(host + "+") || selector.startsWith(host + "~") || selector.startsWith(host + ":")) {
        return {code: "CHROME_OWNERSHIP_VIOLATION", detail: `host shell selector is ported as content: ${selector}`};
      }
    }
  }
  for (const selector of selectors) {
    if (greaterThan(specificity(selector), budget)) {
      return {code: "SPECIFICITY_EXCEEDED", detail: `selector ${selector} (${specificity(selector).join(",")}) exceeds the host budget ${budget.join(",")}`};
    }
  }
  const cssClasses = new Set();
  for (const selector of selectors) for (const token of classTokens(selector)) cssClasses.add(token);
  for (const token of cssClasses) {
    if (!usedClasses.has(token)) return {code: "UNUSED_STYLE", detail: `style class is not declared as used: ${token}`};
  }
  for (const token of usedClasses) {
    if (!cssClasses.has(token)) return {code: "MISSING_USED_STYLE", detail: `used class has no style rule: ${token}`};
  }
  return null;
}
function validateChrome(manifest, manifestDir) {
  const target = manifest.target;
  if (!target || typeof target !== "object") return {code: "CHROME_OWNERSHIP_MISSING", detail: "target is missing"};
  if (!text(target.scope_selector)) return {code: "CHROME_OWNERSHIP_MISSING", detail: "scope_selector is missing"};
  const chrome = target.chrome;
  if (!chrome || typeof chrome !== "object") return {code: "CHROME_OWNERSHIP_MISSING", detail: "chrome ownership is missing"};
  if (chrome.owner !== "host") return {code: "CHROME_OWNERSHIP_MISSING", detail: "chrome owner must be the host"};
  if (!Array.isArray(chrome.host_shell_selectors) || chrome.host_shell_selectors.length === 0) {
    return {code: "CHROME_OWNERSHIP_MISSING", detail: "host shell selectors are empty"};
  }
  if (!Array.isArray(chrome.content_selectors) || chrome.content_selectors.length === 0) {
    return {code: "CHROME_OWNERSHIP_MISSING", detail: "content selectors are empty"};
  }
  for (const content of chrome.content_selectors) {
    for (const host of chrome.host_shell_selectors) {
      if (content === host || content.startsWith(host + " ") || content.startsWith(host + ".")) {
        return {code: "CHROME_OWNERSHIP_CONFLICT", detail: `content selector claims the host shell: ${content}`};
      }
    }
  }
  if (!chrome.content_selectors.includes(target.scope_selector)) {
    return {code: "SCOPE_NOT_IN_CONTENT", detail: "scope_selector is not listed in content_selectors"};
  }
  const basisLine = readBasisLine(manifestDir, chrome.basis_ref);
  if (basisLine === null || (text(chrome.basis_marker) && !basisLine.includes(chrome.basis_marker))) {
    return {code: "CHROME_OWNERSHIP_BASIS_MISSING", detail: "host shell ownership basis is not readable"};
  }
  return null;
}
function validateSpecificityBasis(manifest, manifestDir) {
  const basis = manifest.specificity_basis;
  if (!basis || typeof basis !== "object") return {code: "SPECIFICITY_BASIS_UNVERIFIED", detail: "specificity_basis is missing", budget: null};
  if (basis.source_status !== "read") return {code: "SPECIFICITY_BASIS_UNVERIFIED", detail: `source_status is ${String(basis.source_status)}`, budget: null};
  if (!Array.isArray(basis.host_rules) || basis.host_rules.length === 0) return {code: "SPECIFICITY_BASIS_UNVERIFIED", detail: "host_rules are empty", budget: null};
  for (const rule of basis.host_rules) {
    if (!text(rule.selector) || !Array.isArray(rule.specificity) || rule.specificity.length !== 3
      || !rule.specificity.every((value) => Number.isInteger(value) && value >= 0)) {
      return {code: "SPECIFICITY_BASIS_UNVERIFIED", detail: "a host rule has no readable selector and specificity", budget: null};
    }
    const measured = specificity(rule.selector);
    if (measured.some((value, index) => value !== rule.specificity[index])) {
      return {code: "SPECIFICITY_BASIS_MISMATCH", detail: `declared specificity for ${rule.selector} is ${rule.specificity.join(",")}, measured ${measured.join(",")}`, budget: null};
    }
    const line = readBasisLine(manifestDir, rule.ref);
    if (line === null || !line.includes(text(rule.marker) ? rule.marker : rule.selector)) {
      return {code: "SPECIFICITY_BASIS_UNREADABLE", detail: `host rule basis is not readable: ${rule.selector}`, budget: null};
    }
  }
  const computed = basis.computed_style;
  if (!computed || !text(computed.ref)) return {code: "SPECIFICITY_BASIS_UNVERIFIED", detail: "computed style baseline is missing", budget: null};
  const baseline = readBasisLine(manifestDir, computed.ref);
  if (baseline === null || !baseline.includes(text(computed.marker) ? computed.marker : "计算样式基线")) {
    return {code: "SPECIFICITY_BASIS_UNREADABLE", detail: "computed style baseline is not readable", budget: null};
  }
  return {code: null, budget: componentwiseMax(basis.host_rules)};
}
// 客户端适配是具名登记项：先核声明形状，再核实现侧（登记的来源文件及其生成字节）能对上声明。
// 只校验已有字段，不新增字段或验收面。
function validateClientAdapter(manifest, expected) {
  const adapter = manifest.client_adapter;
  if (adapter === undefined || adapter === null) return {code: "CLIENT_ADAPTER_MISSING", detail: "client_adapter is missing"};
  if (typeof adapter !== "object" || Array.isArray(adapter)) return {code: "CLIENT_ADAPTER_INVALID", detail: "client_adapter must be an object"};
  if (!safeRelative(adapter.source)) return {code: "CLIENT_ADAPTER_INVALID", detail: "client_adapter.source must be a relative path"};
  if (!text(adapter.gateway_class)) return {code: "CLIENT_ADAPTER_INVALID", detail: "client_adapter.gateway_class is missing"};
  for (const key of ["read", "write"]) {
    if (!adapter.methods || typeof adapter.methods !== "object" || !text(adapter.methods[key])) {
      return {code: "CLIENT_ADAPTER_INVALID", detail: `client_adapter.methods.${key} is missing`};
    }
    const endpoint = adapter.endpoints && typeof adapter.endpoints === "object" ? adapter.endpoints[key] : null;
    if (!text(endpoint) || !/^(GET|POST|PUT|PATCH|DELETE) \/\S+$/.test(endpoint)) {
      return {code: "CLIENT_ADAPTER_INVALID", detail: `client_adapter.endpoints.${key} must read "<METHOD> /path"`};
    }
  }
  if (!text(adapter.handler) || !adapter.handler.startsWith("#")) {
    return {code: "CLIENT_ADAPTER_INVALID", detail: "client_adapter.handler must be an id selector"};
  }
  if (adapter.generated !== "copied-without-modification") {
    return {code: "CLIENT_ADAPTER_INVALID", detail: "client_adapter.generated must be copied-without-modification"};
  }
  if (adapter.runtime_injection !== false) {
    return {code: "CLIENT_ADAPTER_INVALID", detail: "client_adapter.runtime_injection must be false"};
  }
  const registered = manifest.files.filter((file) => file && file.source === adapter.source);
  if (registered.length !== 1) {
    return {code: "CLIENT_ADAPTER_MISSING", detail: `client_adapter.source is not a registered file: ${adapter.source}`};
  }
  const file = registered[0];
  if (file.mode !== "copy") {
    return {code: "CLIENT_ADAPTER_MISMATCH", detail: `client_adapter.source is registered as ${String(file.mode)}, not an unmodified copy`};
  }
  const entry = expected.get(file.target);
  const sourceText = entry ? entry.bytes.toString("utf8") : "";
  if (!sourceText.includes(`class ${adapter.gateway_class}`)) {
    return {code: "CLIENT_ADAPTER_MISMATCH", detail: `declared gateway class is not implemented: ${adapter.gateway_class}`};
  }
  for (const key of ["read", "write"]) {
    const method = adapter.methods[key];
    const methodPattern = new RegExp(`(^|[^\\w$])${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`, "m");
    if (!methodPattern.test(sourceText)) {
      return {code: "CLIENT_ADAPTER_MISMATCH", detail: `declared adapter method is not implemented: ${method}`};
    }
    const staticPath = adapter.endpoints[key].split(/\s+/)[1].split("/:")[0] || "/";
    if (!sourceText.includes(staticPath)) {
      return {code: "CLIENT_ADAPTER_MISMATCH", detail: `declared endpoint is not implemented: ${adapter.endpoints[key]}`};
    }
  }
  if (!sourceText.includes(adapter.handler)) {
    return {code: "CLIENT_ADAPTER_MISMATCH", detail: `declared handler is not implemented: ${adapter.handler}`};
  }
  return null;
}
function validateNormalization(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return {code: "MANIFEST_INVALID", detail: "manifest must be an object"};
  if (manifest.schema_version !== "1.0.0") return {code: "MANIFEST_INVALID", detail: "schema_version must be 1.0.0"};
  if (!looseRelative(manifest.design_root)) return {code: "MANIFEST_INVALID", detail: "design_root must be a relative path"};
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) return {code: "MANIFEST_INVALID", detail: "files are empty"};
  if (!Array.isArray(manifest.used_classes) || manifest.used_classes.length === 0) return {code: "MANIFEST_INVALID", detail: "used_classes are empty"};
  for (const name of manifest.used_classes) if (!text(name)) return {code: "MANIFEST_INVALID", detail: "used_classes has an empty name"};
  if (!Array.isArray(manifest.manual_files) || manifest.manual_files.length === 0) return {code: "MANIFEST_INVALID", detail: "manual_files are empty"};
  for (const manual of manifest.manual_files) {
    if (!safeRelative(manual.path) || !text(manual.sentinel)) return {code: "MANIFEST_INVALID", detail: "manual file path or sentinel is invalid"};
  }
  const generated = manifest.files.filter((file) => file && file.mode === "generated");
  if (generated.length !== 1 || !/\.css$/.test(generated[0].source ?? "")) {
    return {code: "STYLE_ENTRY_MISSING", detail: "exactly one generated stylesheet entry is required"};
  }
  return null;
}
export function checkManifest(manifestPath, {designRoot, output, mode = "check"} = {}) {
  if (!MODES.has(mode)) return usage("ARGUMENT_INVALID", `unknown mode: ${mode}`);
  if (!text(manifestPath)) return usage("ARGUMENT_INVALID", "--manifest is required");
  const manifestAbsolute = resolve(manifestPath);
  if (!existsSync(manifestAbsolute)) return usage("MANIFEST_UNREADABLE", `manifest not found: ${manifestAbsolute}`);
  let manifest;
  try {
    manifest = readJson(manifestAbsolute);
  } catch (error) {
    return usage("MANIFEST_UNREADABLE", String(error.message));
  }
  const manifestDir = dirname(manifestAbsolute);
  const designDir = resolve(manifestDir, manifest.design_root);
  const designReal = existsSync(designDir) ? realpathSync(designDir) : null;
  if (!designReal) return usage("DESIGN_SOURCE_MISSING", `design root not found: ${designDir}`);
  if (text(designRoot)) {
    const requested = resolve(designRoot);
    if (!existsSync(requested) || realpathSync(requested) !== designReal) {
      return fail("DESIGN_ROOT_MISMATCH", `--design-root ${requested} does not resolve to ${designReal}`);
    }
  }
  const normalization = validateNormalization(manifest);
  if (normalization) return fail(normalization.code, normalization.detail);
  const chromeIssue = validateChrome(manifest, manifestDir);
  if (chromeIssue) return fail(chromeIssue.code, chromeIssue.detail);
  const basis = validateSpecificityBasis(manifest, manifestDir);
  if (basis.code) return fail(basis.code, basis.detail);
  const budget = basis.budget;
  const scope = manifest.target.scope_selector;
  const hostShell = manifest.target.chrome.host_shell_selectors;
  const usedClasses = new Set(manifest.used_classes);
  const expected = new Map();
  for (const file of manifest.files) {
    if (!file || typeof file !== "object" || !safeRelative(file.source) || !safeRelative(file.target)) {
      return fail("MANIFEST_INVALID", "a file entry has an unsafe source or target path");
    }
    if (!FILE_MODES.has(file.mode)) return fail("MANIFEST_INVALID", `unknown file mode: ${String(file.mode)}`);
    if (!text(file.source_sha256)) return fail("MANIFEST_INVALID", `file ${file.source} has no source_sha256`);
    const sourcePath = resolve(designDir, file.source);
    if (!existsSync(sourcePath) || statSync(sourcePath).isDirectory()) return fail("DESIGN_SOURCE_MISSING", `source file not found: ${file.source}`);
    const sourceBytes = readFileSync(sourcePath);
    if (sha256(sourceBytes) !== file.source_sha256) {
      return fail("SOURCE_DRIFT", `design source changed after registration: ${file.source}`);
    }
    const importChanges = Array.isArray(file.import_changes) ? file.import_changes : [];
    const directChanges = Array.isArray(file.direct_changes) ? file.direct_changes : [];
    if (file.mode === "copy" && directChanges.length > 0) return fail("UNDECLARED_DIRECT_CHANGE", `copy file ${file.source} carries direct changes`);
    if (file.mode === "generated" && (importChanges.length > 0 || directChanges.length > 0)) {
      return fail("DIRECT_CHANGE_ON_GENERATED", `generated file ${file.source} carries registered changes`);
    }
    for (const change of importChanges) {
      if (!text(change.reason)) return fail("MISSING_CHANGE_REGISTRATION", `import change on ${file.source} has no reason`);
      if (!/<link|<script|<style|src\s*=|href\s*=|import\s|require\(/.test(String(change.from ?? ""))) {
        return fail("IMPORT_RULE_VIOLATION", `import change on ${file.source} is not an import line`);
      }
    }
    for (const change of directChanges) {
      if (!text(change.reason) || !text(change.owner)) return fail("MISSING_CHANGE_REGISTRATION", `direct change on ${file.source} needs reason and owner`);
    }
    let bytes;
    let applied = false;
    if (file.mode === "generated") {
      const generated = generateStyles(sourceBytes.toString("utf8"), scope);
      bytes = Buffer.from(generated.text);
      applied = generated.applied;
      expected.set(file.target, {file, bytes, selectors: generated.selectors, applied: generated.applied});
      continue;
    }
    const result = applyChanges(sourceBytes.toString("utf8"), [...importChanges, ...directChanges]);
    if (result.error) return fail(result.error.code, `${file.source}: ${result.error.detail}`);
    bytes = Buffer.from(result.text);
    expected.set(file.target, {file, bytes, selectors: null});
  }
  const adapterIssue = validateClientAdapter(manifest, expected);
  if (adapterIssue) return fail(adapterIssue.code, adapterIssue.detail);
  const htmlEntry = [...expected.entries()].find(([target]) => /\.html$/.test(target));
  if (!htmlEntry) return fail("MANIFEST_INVALID", "no generated html target");
  const htmlSet = htmlClasses(htmlEntry[1].bytes.toString("utf8"));
  for (const token of htmlSet) {
    if (!usedClasses.has(token)) return fail("UNDECLARED_HTML_CLASS", `html class is not declared as used: ${token}`);
  }
  for (const [target, entry] of expected.entries()) {
    if (!entry.selectors) continue;
    const issue = styleIssue(entry.selectors, {scope, budget, hostShell, usedClasses});
    if (issue) return fail(issue.code, `${target}: ${issue.detail}`);
  }
  const manualDir = manifestDir;
  const manualSummary = [];
  const manualPaths = new Set();
  for (const manual of manifest.manual_files) {
    const sourcePath = resolve(manualDir, manual.path);
    if (!existsSync(sourcePath)) return fail("MANUAL_FILE_MISSING", `manual file not found: ${manual.path}`);
    const manualText = readFileSync(sourcePath, "utf8");
    if (!manualText.split("\n").slice(0, 3).join("\n").includes(manual.sentinel)) {
      return fail("MANUAL_SENTINEL_MISSING", `${manual.path} does not carry its sentinel`);
    }
    manualPaths.add(manual.path);
    manualSummary.push({path: manual.path, sentinel: manual.sentinel});
  }
  // 手改文件与生成目标必须分文件：同路径（或父/子路径）时，先写生成物会覆盖手改，
  // 事后再报哨兵缺失已经太晚。这个保护在写入前完成，不看输出目录现状。
  for (const [target] of expected.entries()) {
    for (const manualPath of manualPaths) {
      if (target === manualPath || target.startsWith(manualPath + "/") || manualPath.startsWith(target + "/")) {
        return fail("MANUAL_TARGET_OVERLAP", `generated target ${target} overlaps manual file ${manualPath}`);
      }
    }
  }
  const filesSummary = [...expected.entries()].map(([target, entry]) => ({source: entry.file.source, target, mode: entry.file.mode, sha256: sha256(entry.bytes)}));
  const summary = {
    ok: true,
    mode,
    source_root: designReal,
    target_name: manifest.target.name ?? null,
    scope_selector: scope,
    budget,
    style_scope_applied: [...expected.values()].some((entry) => entry.file.mode === "generated" && entry.applied === true),
    files: filesSummary,
    used_classes: usedClasses.size,
    client_adapter: manifest.client_adapter ?? null,
    manual_files: manualSummary,
  };
  if (mode === "generate") {
    if (!text(output)) return usage("ARGUMENT_INVALID", "--output is required for generate");
    const outputPath = resolve(output);
    if (insidePath(outputPath, designReal)) return fail("OUTPUT_INSIDE_SOURCE", `output ${outputPath} must differ from the design root ${designReal}`);
    mkdirSync(outputPath, {recursive: true});
    const outputReal = realpathSync(outputPath);
    if (insidePath(outputReal, designReal)) {
      return fail("OUTPUT_INSIDE_SOURCE", `output ${outputPath} resolves into the design root ${designReal}`);
    }
    // 先完成全部手改保护检查，再写任何生成物；否则覆盖手改后才发现问题，原件已经丢了。
    for (const manual of manualSummary) {
      const manualTarget = resolve(outputPath, manual.path);
      if (!existsSync(manualTarget)) continue;
      const existing = readFileSync(manualTarget, "utf8");
      if (!existing.split("\n").slice(0, 3).join("\n").includes(manual.sentinel)) {
        return fail("MANUAL_SENTINEL_MISSING", `existing manual file ${manual.path} lost its sentinel`);
      }
    }
    for (const [target, entry] of expected.entries()) {
      const targetPath = resolve(outputPath, target);
      mkdirSync(dirname(targetPath), {recursive: true});
      if (resolvableTarget(targetPath, designReal) === null) {
        return fail("OUTPUT_INSIDE_SOURCE", `generated target ${target} resolves into the design root ${designReal}`);
      }
      writeFileSync(targetPath, entry.bytes);
    }
    const manualResults = [];
    for (const manual of manualSummary) {
      const targetPath = resolve(outputPath, manual.path);
      if (existsSync(targetPath)) {
        manualResults.push({path: manual.path, status: "preserved", absolute: targetPath});
      } else {
        mkdirSync(dirname(targetPath), {recursive: true});
        if (resolvableTarget(targetPath, designReal) === null) {
          return fail("OUTPUT_INSIDE_SOURCE", `manual target ${manual.path} resolves into the design root ${designReal}`);
        }
        writeFileSync(targetPath, readFileSync(resolve(manualDir, manual.path)));
        manualResults.push({path: manual.path, status: "copied", absolute: targetPath});
      }
    }
    summary.ok = true;
    summary.output_root = outputPath;
    summary.manual = manualResults.length === 1 ? manualResults[0] : manualResults;
    summary.receipt = {files: filesSummary.length, source: designReal};
    process.stdout.write(JSON.stringify(summary) + "\n");
    return true;
  }
  if (text(output)) {
    const outputPath = resolve(output);
    if (!existsSync(outputPath)) return fail("OUTPUT_MISSING", `output not found: ${outputPath}`);
    for (const [target, entry] of expected.entries()) {
      const targetPath = resolve(outputPath, target);
      if (!existsSync(targetPath)) return fail("OUTPUT_FILE_MISSING", `output file not found: ${target}`);
      const actual = readFileSync(targetPath, "utf8");
      if (entry.selectors) {
        const actualSelectors = collectSelectors(actual);
        const issue = styleIssue(actualSelectors, {scope, budget, hostShell, usedClasses});
        if (issue) return fail(issue.code, `${target}: ${issue.detail}`);
      }
      if (actual !== entry.bytes.toString("utf8")) {
        const expectedLines = entry.bytes.toString("utf8").split("\n");
        const actualLines = actual.split("\n");
        let line = 1;
        while (line <= expectedLines.length && line <= actualLines.length && expectedLines[line - 1] === actualLines[line - 1]) line += 1;
        return fail("UNREGISTERED_CHANGE", `${target}: first unregistered difference at line ${line}`);
      }
    }
    const actualHtml = readFileSync(resolve(outputPath, htmlEntry[0]), "utf8");
    const actualHtmlClasses = htmlClasses(actualHtml);
    for (const token of actualHtmlClasses) {
      if (!usedClasses.has(token)) return fail("UNDECLARED_HTML_CLASS", `output html class is not declared as used: ${token}`);
    }
    for (const manual of manualSummary) {
      const targetPath = resolve(outputPath, manual.path);
      if (existsSync(targetPath)) {
        const manualText = readFileSync(targetPath, "utf8");
        if (!manualText.split("\n").slice(0, 3).join("\n").includes(manual.sentinel)) {
          return fail("MANUAL_SENTINEL_MISSING", `output manual file ${manual.path} lost its sentinel`);
        }
        manualResultsPush(summary, manual.path, targetPath);
      }
    }
  }
  process.stdout.write(JSON.stringify(summary) + "\n");
  return true;
}
function manualResultsPush(summary, path, absolute) {
  summary.manual_files = summary.manual_files.map((entry) => entry.path === path ? {...entry, status: "preserved", absolute} : entry);
}
export function main(argv = process.argv.slice(2)) {
  const options = {mode: "check", manifest: null, designRoot: null, output: null};
  const allowed = new Set(["--mode", "--manifest", "--design-root", "--output"]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const separator = argument.indexOf("=");
    const name = separator > 2 ? argument.slice(0, separator) : argument;
    if (!allowed.has(name)) return usage("ARGUMENT_INVALID", `unknown argument: ${argument}`);
    const value = separator > 2 ? argument.slice(separator + 1) : argv[index + 1];
    if (value === undefined || value === "" || (separator <= 2 && value.startsWith("--"))) return usage("ARGUMENT_INVALID", `${name} needs a value`);
    if (separator <= 2) index += 1;
    if (name === "--mode") options.mode = value;
    else if (name === "--manifest") options.manifest = value;
    else if (name === "--design-root") options.designRoot = value;
    else options.output = value;
  }
  return checkManifest(options.manifest, {designRoot: options.designRoot, output: options.output, mode: options.mode});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
