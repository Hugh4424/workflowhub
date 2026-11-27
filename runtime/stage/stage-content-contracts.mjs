// Current post Phase and ordinary decision-log text contracts.
// Pure facts only: no retired appendices, hash-bound identities or stage-completion machines.
import { readFileSync, statSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve, sep } from "node:path";

const ACCEPTANCE_CRITERION_SOURCE = String.raw`AC(?:\d{1,3}|-\d{1,3}|(?:-[A-Z][A-Z0-9]*)+-\d{1,3})`;

const ACCEPTANCE_CRITERION_ID = new RegExp(String.raw`\b${ACCEPTANCE_CRITERION_SOURCE}\b`, "g");

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

const TASK_TYPES = new Set(["规划任务", "普通任务"]);

function plainTaskTypeCell(value) {
  return value.trim().replace(/^(\*+)(.+?)\1$/, "$2").replace(/^(`+)(.+?)\1$/, "$2").trim();
}

function declaredTaskType(value) {
  // The templates end the field with punctuation. Authors may also explain
  // their selected value in parentheses; prose alone never selects a type.
  const field = value.trim().replace(/[。.]$/, "").trim();
  const match = /^([^（(]+?)(?:\s*(?:（([^（）]*)）|\(([^()]*)\)))?$/.exec(field);
  if (!match) return "unknown";
  const type = plainTaskTypeCell(match[1]);
  const note = match[2] ?? match[3] ?? "";
  if (!TASK_TYPES.has(type) || [...TASK_TYPES].some(other => other !== type && note.includes(other))) return "unknown";
  return type;
}

export function readTaskTypeFromDecisionLog(decisionLogMarkdown) {
  const lines = taskSourceLines(String(decisionLogMarkdown ?? ""), true);
  let firstSection = true;
  let inEntry = false;
  let inIdentity = false;
  let identityCount = 0;
  const declarations = [];
  for (const line of lines) {
    if (line === null) continue;
    const heading = /^(#{1,6})[ \t]+(.+?)\s*$/.exec(line);
    if (heading) {
      const [, marks, title] = heading;
      if (marks.length <= 2) {
        inEntry = marks === "##" && title === "1. 入口";
        if (inEntry && !firstSection) return "unknown";
        if (marks === "##") firstSection = false;
      }
      // A historical excerpt nested under another section is not a task identity.
      const legacyLevel = marks.length <= 2 || (marks === "###" && firstSection);
      const legacyIdentity = legacyLevel && /^(?:任务身份(?:：这是什么任务？)?|task identity)$/i.test(title);
      inIdentity = legacyIdentity || (inEntry && marks === "###" && title === "这是什么任务");
      if (inIdentity) identityCount += 1;
      continue;
    }
    if (!inIdentity) continue;
    if (/^ {0,3}\|/.test(line)) {
      const cells = line.split("|")
        .map((cell) => cell.trim())
        .filter((cell, index, all) => !(index === 0 && cell === "") && !(index === all.length - 1 && cell === ""));
      if (cells.length >= 2 && plainTaskTypeCell(cells[0]) === "任务类型") {
        declarations.push(declaredTaskType(cells[1]));
      }
      continue;
    }
    const bullet = /^ {0,3}[-*]\s+\*\*任务类型\*\*\s*[:：]\s*(.*?)\s*$/.exec(line);
    if (bullet) declarations.push(declaredTaskType(bullet[1]));
  }
  return identityCount === 1 && declarations.length === 1 ? declarations[0] : "unknown";
}

const FIELD_LABEL_ALIASES = Object.freeze({
  "Global spec": ["全局规格"],
  "Write set": ["写入集", "写集"],
  Dependency: ["依赖"],
  Consumer: ["消费者"],
  "Inputs and outputs": ["输入与输出"],
  NEW: ["新增"],
  MODIFY: ["修改"],
  "DO NOT TOUCH": ["禁止改动", "不得改动"],
  "Task order": ["任务顺序"],
  "Test strategy": ["测试策略"],
  "coverage limit": ["覆盖边界", "覆盖上限"],
  "Coverage limit": ["覆盖边界", "覆盖上限"],
  STOP: ["停止"],
  Done: ["完成"],
  "Risk and rollback": ["风险与回滚"],
  "Source / FR / AC": ["来源 / FR / AC"],
  Inputs: ["输入"],
  "Files / symbols": ["文件 / 符号"],
  Action: ["动作"],
  "Outputs / failure": ["输出 / 失败"],
  "Boundary / DO NOT TOUCH": ["边界 / 禁止改动", "边界 / 不得改动"],
  "Test tier / skill": ["测试层级 / 技能"],
  "Scenario / fixture or service": ["场景 / 夹具或服务"],
  "Prewritten test": ["预写测试"],
  "Observable seam": ["可观察接缝"],
  "RED/GREEN gate_cmd": ["RED/GREEN 门禁命令"],
  expected_exit: ["预期退出码"],
  "RED target failure": ["RED 目标失败"],
  "RED evidence": ["RED 证据"],
  "GREEN oracle": ["GREEN 判定器"],
  Evidence: ["证据"],
  "STOP / recovery": ["停止 / 恢复"],
  "test change request": ["测试变更请求"],
  gate_cmd: ["门禁命令"],
  oracle: ["判定器"],
  evidence_path: ["证据路径"],
  Selected: ["已选"],
  "Template version": ["模板版本", "模板版本号"],
  Goal: ["目标"],
  Files: ["文件"],
  Tasks: ["任务"],
  Verify: ["验证"],
  Knowledge: ["知识"],
  "Risks and rollback": ["风险与回滚"],
  "Engineering Risk Handoff": ["工程风险交接"],
  "Affected IDs": ["受影响 ID", "受影响编号"],
  Trigger: ["触发条件"],
  Consequence: ["后果"],
  "Mitigation or STOP": ["缓解或停止"],
  "Handling Stage": ["处理阶段"],
  Verification: ["验证"],
  "F10 real threat": ["F10 真实威胁"],
  "F10 existing cover": ["F10 既有覆盖"],
  "F10 bypassable": ["F10 可绕过"],
  "F10 maintenance cost": ["F10 维护成本"],
  "Constitution binding": ["宪法绑定"],
  "Non-goals": ["非目标"],
  "Global Constraints": ["全局约束"],
});

function escapeFieldLabel(label) {
  return String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const WITHOUT_PREDECESSOR = /^(?:none|无|无前序|无依赖)$/i;

function labelAlternation(name) {
  return [name, ...(FIELD_LABEL_ALIASES[name] ?? [])].map(escapeFieldLabel).join("|");
}

function markdownSections(document, level, prefix = "") {
  const lines = document.split(/\r?\n/);
  const marker = "#".repeat(level);
  const prefixes = (Array.isArray(prefix) ? prefix : [prefix]).filter(Boolean);
  const indexes = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(new RegExp(`^${marker}\\s+(.+?)\\s*$`));
    if (match && (prefixes.length === 0 || prefixes.some((item) => match[1].startsWith(item)))) {
      indexes.push({ index, heading: match[1] });
    }
  }
  return indexes.map((entry, position) => ({
    heading: entry.heading,
    body: lines.slice(entry.index + 1, indexes[position + 1]?.index ?? lines.length).join("\n").trim(),
  }));
}

// New-shape materials collect machine fields under one level-two heading.
// The heading is a location, never a new pass/fail condition; documents
// without it keep every existing reading byte for byte.
const MACHINE_FIELDS_HEADING = /^##\s+(?:机器字段|校验器字段|Machine fields?)(?:\s*[（(][^）)\n]*[）)])?\s*$/i;

function machineFieldsBlock(document) {
  const lines = String(document ?? "").split(/\r?\n/);
  const start = lines.findIndex((line) => MACHINE_FIELDS_HEADING.test(line));
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) { end = index; break; }
  }
  return { start, end, body: lines.slice(start + 1, end).join("\n").trim() };
}

function machineFieldsSection(document) {
  return machineFieldsBlock(document)?.body ?? null;
}

function withoutMachineFields(document) {
  const block = machineFieldsBlock(document);
  if (!block) return String(document ?? "");
  const lines = String(document ?? "").split(/\r?\n/);
  return [...lines.slice(0, block.start), ...lines.slice(block.end)].join("\n");
}

// Existing declarations stay authoritative in their old region; the explicit
// machine block is appended so a new-shape file can declare them at its end.
function phaseAuthorityBody(body) {
  const text = String(body ?? "");
  const machine = machineFieldsSection(text);
  const base = text.split(/^##\s+L2\b|^###\s+T\d{3,}\b/m, 1)[0];
  if (machine === null) return base;
  const authority = /^##\s+L1\b/m.test(text)
    ? base
    : text.split(/^##\s+L2\b|^###\s+(?:T\d{3,}\b|任务\s*\d+\s*[:：])/m, 1)[0];
  return `${authority}\n${machine}`;
}

function unsafeWritePath(path, reviewReadScope) {
  if (path.startsWith("/") && reviewReadScope) {
    if (resolve(path) !== path || /[\\\0*?\[\]{}]/.test(path)) return true;
    const owned = reviewReadScope.repositories?.some(repo => {
      const within = relative(repo.sourceRoot, path);
      return within && !isAbsolute(within) && !within.split("/").includes("..") && repo.paths?.includes(within);
    });
    const evidence = reviewReadScope.taskRoot && reviewReadScope.evidenceFiles?.some(({ ref }) =>
      path === resolve(reviewReadScope.taskRoot, ref));
    return !owned && !evidence;
  }
  return path.startsWith("/") || /^[A-Za-z]:/.test(path)
    || /[\\\0*?\[\]{}]/.test(path)
    || path.split("/").some((part) => !part || part === "." || part === "..");
}

const SHARED_GOVERNANCE_PATH = /(?:^|\/)(?:README|AGENTS|CLAUDE|CONTEXT|CONSTITUTION|GLOSSARY)\.md$/i;
// Compare the approved source identity while retaining original text in facts
// and diagnostics. Without a host scope the existing relative identity stays.
function writePathIdentity(path, scope) {
  if (!scope) return path;
  if (!isAbsolute(path)) return JSON.stringify(['wh', path]);
  for (const repo of scope.repositories ?? []) {
    const within = relative(repo.sourceRoot, path);
    if (repo.paths?.includes(within)) return JSON.stringify([repo.id, within]);
  }
  const evidence = scope.evidenceFiles?.find(({ref}) => path === resolve(scope.taskRoot ?? '/', ref));
  return evidence ? JSON.stringify(['task-evidence', evidence.ref]) : path;
}

const PLANNED_EVIDENCE_PATH = /^\s*(?:`+\s*)?planned\s*[:：]/i;

// Evidence paths may be repository-relative, task-relative, or absolute. Reuse
// the existing owners instead of a new resolver: authenticated repository
// roots and the task root from reviewReadScope, plus the material root that
// run-checks already passes. A material root under <repo>/specs/<task> also
// contributes its repository parent, the same convention the final-chain
// material reader uses.
function evidenceSearchRoots(reviewReadScope, materialPath) {
  const roots = [];
  const add = (value) => {
    if (typeof value !== "string" || value.trim() === "") return;
    roots.push(resolve(value));
  };
  for (const repo of reviewReadScope?.repositories ?? []) add(repo?.sourceRoot);
  add(reviewReadScope?.taskRoot);
  if (nonEmptyString(materialPath)) {
    const materialRoot = resolve(materialPath);
    const specsAt = materialRoot.lastIndexOf(`${sep}specs${sep}`);
    if (specsAt > 0) roots.push(materialRoot.slice(0, specsAt));
    roots.push(materialRoot);
  }
  return [...new Set(roots)];
}

function readableEvidenceRoots(roots) {
  return roots.filter((root) => {
    try { return statSync(root).isDirectory(); } catch { return false; }
  });
}

const DECLARED_SHA256 = /^(.*?)\s+@sha256=([0-9a-f]{64})$/i;

// A declaration span is either a bare path or `<path> @sha256=<64hex>`. The
// anchor is optional: an unanchored path is still a path, but it can only ever
// be `unverified/no-run-binding` (same name, not necessarily this run).
function declaredEvidencePaths(value) {
  const text = String(value ?? "").trim();
  const spans = inlinePaths(text);
  const candidates = spans.length > 0 ? spans : [text.replace(/[（(][\s\S]*$/, "").trim()];
  const parsed = [];
  for (const candidate of candidates) {
    const stripped = candidate.replace(/^\s*(?:`+\s*)?planned\s*[:：]\s*/i, "").trim();
    if (stripped === "") continue;
    const anchored = DECLARED_SHA256.exec(stripped);
    const token = anchored ? anchored[1].trim() : stripped;
    if (token === "" || /\s/.test(token) || !/[/\\.]/.test(token)) continue;
    parsed.push(Object.freeze({ path: token, declared_sha256: anchored ? anchored[2].toLowerCase() : null }));
  }
  const seen = new Set(), unique = [];
  for (const item of parsed) {
    const key = `${item.path}\0${item.declared_sha256 ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function taskEvidenceRoot(token, taskRecordRoot) {
  if (!token.startsWith("quality/") || token.includes("\\") || token.includes("\0")
    || token.split("/").some(part => !part || part === "." || part === "..")
    || typeof taskRecordRoot !== "string" || !isAbsolute(taskRecordRoot)) return null;
  try { return statSync(taskRecordRoot).isDirectory() ? resolve(taskRecordRoot) : null; }
  catch { return null; }
}

const unverified = (reason) => Object.freeze({ status: "unverified", reason });

// A declaration is "this run" only when at least one anchor (declared @sha256 or
// a task facts quality_evidence sha256) matches the bytes read now. The four
// status names are fixed; the diagnostic subclass is the first reason word.
function anchoredCheck(token, resolved, bytes, resolutionSource, binding) {
  const declared = typeof binding?.declared_sha256 === "string" && binding.declared_sha256.trim() !== ""
    ? binding.declared_sha256.toLowerCase() : null;
  const facts = Array.isArray(binding?.facts_sha256)
    ? binding.facts_sha256.filter((value) => typeof value === "string" && value.trim() !== "").map((value) => value.toLowerCase())
    : [];
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (declared === null && facts.length === 0) {
    return unverified("no-run-binding: 声明与任务记录都没有本次字节指纹");
  }
  if ((declared !== null && declared === actual) || facts.includes(actual)) {
    return Object.freeze({ status: "verified", resolved, ...(resolutionSource ? { resolution_source: resolutionSource } : {}) });
  }
  const expected = declared ?? facts[0] ?? "";
  return unverified(`content-mismatch: 声明 ${expected.slice(0, 8)}… 实际 ${actual.slice(0, 8)}…`);
}

export function checkEvidencePath(token, roots, taskRecordRoot, binding = Object.freeze({})) {
  if (plannedEvidence(token)) return Object.freeze({ status: "planned", reason: "declared planned" });
  if (/[{*?}]/.test(token)) return unverified(`not-single-path: ${token} 不是单一可打开路径`);
  if (isAbsolute(token)) {
    let stats;
    try { stats = statSync(token); }
    catch (error) { return Object.freeze({ status: "missing", reason: error.code ?? error.message }); }
    if (!stats.isFile()) return Object.freeze({ status: "missing", reason: "not a regular file" });
    let bytes;
    try { bytes = readFileSync(token); }
    catch (error) { return unverified(`unreadable: ${error.code ?? error.message}`); }
    return anchoredCheck(token, token, bytes, null, binding);
  }
  for (const root of Array.isArray(roots) ? roots : []) {
    const candidate = resolve(root, token);
    let stats;
    try { stats = statSync(candidate); }
    catch { continue; /* ENOENT, ENOTDIR, broken links: keep scanning the remaining roots */ }
    if (!stats.isFile()) continue; /* a directory or device in one root never hides a later root's file */
    let bytes;
    try { bytes = readFileSync(candidate); }
    catch (error) { return unverified(`unreadable: ${error.code ?? error.message}`); }
    return anchoredCheck(candidate, candidate, bytes, null, binding);
  }
  const taskRoot = taskEvidenceRoot(token, taskRecordRoot);
  if (taskRoot && !(Array.isArray(roots) && roots.includes(taskRoot))) {
    const candidate = resolve(taskRoot, token);
    try {
      const realRoot = realpathSync(taskRoot), realCandidate = realpathSync(candidate);
      const rel = relative(realRoot, realCandidate);
      const contained = rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
      if (contained && statSync(realCandidate).isFile()) {
        let bytes;
        try { bytes = readFileSync(realCandidate); }
        catch (error) { return unverified(`unreadable: ${error.code ?? error.message}`); }
        return anchoredCheck(candidate, candidate, bytes, "task_root", binding);
      }
    } catch { /* Keep the original missing evidence result, including escaping links. */ }
  }
  return Object.freeze({ status: "missing", reason: "not found under any declared root" });
}

function plannedEvidence(value) {
  if (PLANNED_EVIDENCE_PATH.test(value)) return true;
  const [firstPath] = inlinePaths(value);
  return firstPath !== undefined && PLANNED_EVIDENCE_PATH.test(firstPath);
}

function hasAffirmativeCodeWrite(action) {
  // A prohibition applies to its clause, not to a later contradictory action.
  return String(action ?? '').split(/[;；,，。\n]|\b(?:and|but|however|then|unless|except|otherwise)\b|但是|但|却|并且|同时|随后|然后|并/i).some(clause => {
    const affirmative = clause
      .replace(/\b(?:do not|don't|must not|never)\s+.*$/i, '')
      .replace(/(?:不得|禁止|无需|不)(?:产出|生产|编写|写|修改|更改|编辑|实现|新增|删除|重构|修复|调整|替换|迁移).*$/, '')
      .replace(/(?:no production writes|无生产修改)/gi, '')
      // Remove only the inspected noun span, never the rest of the action.
      .replace(/(?:核验|审查|检查|核对|复核|阅读|读取)(?:现有|已有|当前)?(?:实现|重构)(?:结果)?/g, '');
    return /\b(?:implement|refactor)\b/i.test(affirmative)
      || /(?:\b(?:produce|change|write|modify|edit|add|remove|delete|create|update|replace|fix|patch|rewrite|migrate)\b|实现|重构|产出|生产|编写|写入|修改|更改|编辑|新增|删除|修复|调整|替换|迁移)[^;；\n]*(?:\b(?:code|source|file|function|class|method|module|implementation)\b|代码|源码|源文件|函数|模块|\.[a-z][a-z0-9]*\b)/i.test(affirmative);
  });
}
function isSharedGovernancePath(path) { return SHARED_GOVERNANCE_PATH.test(path) || /(?:^|\/)architecture\/components\.ya?ml$/i.test(path); }

const EXPLICIT_EMPTY_WRITE_SET = /^none(?:\s*[（(][^`()（）\r\n]*[）)])?$/i;
const EMPTY_WRITE_SET_PREFIX = /^none(?=$|[\s（(;；])/i;
// New same-repo Phase cards point at one Execution Index row and pin its exact
// write set with a sha256 digest. The pointer is a reference, never a second
// path list: only the index column contributes executable paths.
const WRITE_SET_INDEX_POINTER = /`phases\/index\.md#execution-index`/;

function sortedPathBytes(paths) {
  return [...paths].sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
}

// Card 185: sort valid relative paths by UTF-8 bytes, one per line (LF, no
// trailing newline) and hash; a legal `none` hashes the literal string `none`.
function writeSetDigest(paths, explicitNone = false) {
  const body = explicitNone && paths.length === 0 ? "none" : sortedPathBytes(paths).join("\n");
  return createHash("sha256").update(body, "utf8").digest("hex");
}

function parseWriteSetPointer(declaration) {
  const text = String(declaration ?? "");
  if (!WRITE_SET_INDEX_POINTER.test(text)) return null;
  const tokens = inlinePaths(text);
  const digests = [...text.matchAll(/sha256\s*=\s*([0-9a-fA-F]{64})\b/g)].map((match) => match[1].toLowerCase());
  const extraTokens = tokens.filter((token) => !/^phases\/index\.md#execution-index$/.test(token)
    && !/^sha256\s*=\s*[0-9a-fA-F]{64}$/.test(token));
  return Object.freeze({ digests, extraTokens });
}

function executionIndexRows(document, errors, reviewReadScope, invalidDependency = () => {}) {
  const lines = document.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+(?:Execution Index|执行索引)\s*$/i.test(line));
  if (start < 0) return null;
  const rows = [];
  let position = 0;
  const plain = (value) => value.replace(/^`|`$/g, "").trim();
  for (let lineIndex = start + 1; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (/^##\s+/.test(line)) break;
    if (!/^\s*\|/.test(line)) continue;
    const cells = analyzeMarkdownTableCells(line);
    if (/^(?:phase|阶段)$/i.test(plain(cells[0] ?? ""))
        || cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    position += 1;
    const label = `phases/index.md:${lineIndex + 1} ${plain(cells[0] ?? "")} (${plain(cells[1] ?? "")})`;
    const rowErrors = [];
    if (![5, 6].includes(cells.length)) {
      errors.push(`${label} requires 5 or 6 cells; found ${cells.length}`);
      continue;
    }
    const phase = plain(cells[0]);
    if (phase !== `P${position}`) {
      invalidDependency();
      rowErrors.push(`Phase index must declare contiguous P1..Pn; expected P${position}`);
    }
    const authority = plain(cells[1]).match(/^phases\/(P[1-9][0-9]*)(?:-[^/\\.\s|`:\x00-\x1f]+)?\.md$/);
    if (!authority || authority[1] !== phase) rowErrors.push(`authority ref must be a safe phases/${phase}.md or named Phase file`);
    if (!plain(cells[2])) rowErrors.push("semantic anchor is required");
    const ownership = cells.length === 5 ? cells[4].split(/\s*(?:→|->)\s*/) : cells.slice(4);
    if (ownership.length !== 2 || ownership.some((value) => !plain(value))) {
      invalidDependency();
      rowErrors.push("dependency → consumer must name both fields");
    }
    const paths = inlinePaths(cells[3]);
    const explicitNone = EXPLICIT_EMPTY_WRITE_SET.test(cells[3].trim());
    // 2026-11-25 用户裁决：索引写入集列只作推荐，不校验。
    // 2026-11-25 用户裁决：索引写入集列只作推荐，不校验。
    // 2026-11-25 用户裁决：索引写入集列只作推荐，不校验。
    if (rowErrors.length) {
      errors.push(...rowErrors.map((error) => `${label} ${error}`));
      continue;
    }
    rows.push(Object.freeze({
      position,
      phase,
      authority_ref: plain(cells[1]),
      semantic_anchor: plain(cells[2]),
      write_set: Object.freeze(paths),
      explicit_none: explicitNone,
      dependency: plain(ownership[0]),
      consumer: plain(ownership[1]),
    }));
  }
  return Object.freeze(rows);
}

function phaseWriteSet(body) {
  // Phase declarations precede executable task cards and removable L2 reference.
  const authority = phaseAuthorityBody(body);
  const declaredPaths = (value) => {
    let quoted = false;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === "`") quoted = !quoted;
      if (!quoted && ["（", "("].includes(value[index])) return inlinePaths(value.slice(0, index));
    }
    return inlinePaths(value);
  };
  const lines = authority.split(/\r?\n/);
  const bullet = fieldValue(authority, "Write set");
  if (bullet !== null) return declaredPaths(bullet);
  const labels = new Set(["Write set", ...(FIELD_LABEL_ALIASES["Write set"] ?? [])]);
  for (const [index, line] of lines.entries()) {
    if (/^\s*\|/.test(line)) {
      const cells = analyzeMarkdownTableCells(line);
      if (labels.has(cells[0]?.replaceAll("**", ""))) return declaredPaths(cells[1] ?? "");
    }
    if (!new RegExp(`^\\s*-\\s*\\*\\*(?:${labelAlternation("Write set")})\\*\\*.*[:：]\\s*$`).test(line)) continue;
    const paths = [];
    for (const row of lines.slice(index + 1)) {
      if (!row.trim()) continue;
      if (!/^\s*\|/.test(row)) break;
      const cells = analyzeMarkdownTableCells(row);
      if (/^[1-9][0-9]*$/.test(cells[0] ?? "")) paths.push(...declaredPaths(cells[1] ?? ""));
    }
    return [...new Set(paths)];
  }
  return [];
}

function identifiers(text, pattern) {
  return [...new Set(text.match(pattern) ?? [])];
}

function commandFieldValue(value) {
  const text = String(value ?? "").trim();
  // A task field may carry a code span followed by an explanatory sentence.
  // Validate the executable command itself rather than requiring the entire
  // prose field to be wrapped in one pair of backticks.
  const codeSpan = text.match(/^`([^`\n]+)`/)?.[1];
  return (codeSpan ?? text).trim();
}

function hasExecutableCommand(value) {
  const command = commandFieldValue(value);
  return /^(?:mkdir\b|npx\b|npm\b|pnpm\b|yarn\b|bun\b|node\b|python\b|pytest\b|go\b|cargo\b|make\b|bash\b|sh\b|git\b|\.\/)/.test(command);
}

function placeholderOrTemplateNoise(document) {
  if (/<!--[\s\S]*?-->/.test(document)) return true;
  const prose = withoutProgrammingFencedCode(document)
    .replace(/`[^`\n]*`/g, "");
  return /\{[^{}\n]{1,120}\}|\[填写：[^\]\r\n]{1,120}\]|^\s*(?:待补充|TBD|TODO)\s*$/mi.test(prose);
}

function withoutProgrammingFencedCode(document) {
  return document.replace(
    /^(?:```|~~~)(?:javascript|js|jsx|typescript|ts|tsx|python|py|go|rust|rs|java|c|cpp|csharp|cs|ruby|rb|php|swift|kotlin|kt|shell|sh|bash|zsh|powershell|ps1|json|yaml|yml|toml|sql|html|css|scss|xml)\s*\n[\s\S]*?^(?:```|~~~)\s*$/gmi,
    "",
  );
}

const PHASE_HEADING_ALIASES = Object.freeze({
  Goal: ["目标", "结果"],
  Files: ["文件"],
  Tasks: ["任务"],
  Verify: ["验证"],
  Knowledge: ["知识"],
  STOP: ["停止"],
  Done: ["完成"],
  "Risks and rollback": ["风险与回滚"],
});

const SPEC_DESIGN_HEADING_ALIASES = Object.freeze({
  "Code Anchors": ["代码锚点"],
  "Interfaces and Failure Semantics": ["接口与失败语义"],
  "Requirement-to-Task Trace": ["需求到任务追踪"],
  "Global Verification Strategy": ["全局验证策略"],
});

function canonicalHeading(heading, aliases) {
  const trimmed = String(heading).trim();
  for (const [canonical, list] of Object.entries(aliases)) {
    if (trimmed === canonical || list.includes(trimmed)) return canonical;
  }
  return trimmed;
}

function canonicalPhaseHeading(heading) {
  return canonicalHeading(heading, PHASE_HEADING_ALIASES);
}

function canonicalDesignHeading(heading) {
  return canonicalHeading(heading, SPEC_DESIGN_HEADING_ALIASES);
}

function phaseRows(document, fields, errors, label) {
  const phases = markdownSections(document, 2, ["Phase ", "阶段 "]);
  if (phases.length === 0) errors.push(`${label} must contain at least one Phase`);
  return phases.map((phase) => {
    const sections = new Map(markdownSections(`## ${phase.heading}\n${phase.body}`, 3)
      .map((section) => [canonicalPhaseHeading(section.heading), section.body]));
    for (const field of fields) {
      const body = sections.get(field);
      if (body === undefined || body.trim() === "") errors.push(`${label} ${phase.heading} is missing ${field}`);
      else if (/^(?:None|N\/A)\.?$/i.test(body.trim())) errors.push(`${label} ${phase.heading} ${field} uses unexplained N/A`);
    }
    return {
      phase: phase.heading,
      fields: Object.fromEntries(fields.map((field) => [field, sections.get(field) ?? null])),
    };
  });
}

function inlinePaths(value) {
  return [...new Set([...String(value ?? "").matchAll(/`([^`\n]+)`/g)].map((match) => match[1]))];
}

function sameIds(left, right) {
  return [...left].sort().join("\0") === [...right].sort().join("\0");
}

function fieldValue(body, field) {
  const lines = String(body ?? "").split(/\r?\n/);
  const pattern = new RegExp(
    `^\\s*-\\s+\\*\\*(?:${labelAlternation(field)})\\*\\*\\s*[:：]\\s*(.*)$`,
  );
  for (let index = 0; index < lines.length; index += 1) {
    const match = pattern.exec(lines[index]);
    if (!match) continue;
    const first = match[1].trim();
    // A continuation is a continuation, not a substitute for an empty or
    // placeholder first-line value.
    if (!first) return null;
    if (/^(?:TBD|TODO|待补充|待补|待定|\[[^\]]*(?:占位|填写)[^\]]*\]|\{[^{}]*\})$/i.test(first.replace(/[*_`]/g, "").trim())) return null;
    const parts = [first];
    for (let next = index + 1; next < lines.length; next += 1) {
      const line = lines[next];
      if (!line.trim()) break;
      if (/^\s*#{1,6}\s/.test(line)) break;
      if (/^\s*-\s+\*\*/.test(line)) break;
      if (!/^\s+/.test(line)) break;
      parts.push(line.trim());
    }
    return parts.join(" ").trim();
  }
  return null;
}

function analyzeMarkdownTableCells(line) {
  const value = String(line ?? "").trim();
  if (!value.startsWith("|")) return [];
  return value
    .replace(/^\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

// Report only the caller-selected Phase against its own baseline scope. These
// facts never change contract errors or authorize execution.
function reconcileWriteSetDiff({ phaseRows, phase_id, changeScope, reviewReadScope, selectedPhaseScopeValid }) {
  const unavailable = reason => Object.freeze({ status: "unavailable", reason,
    out_of_scope: Object.freeze([]), listed_not_changed: Object.freeze([]),
    matched: Object.freeze([]), external_write_surfaces: Object.freeze([]) });
  const phase = phaseRows.find(row => row.id === phase_id);
  if (!phase) return unavailable("A known current phase_id is required");
  if (!selectedPhaseScopeValid) return unavailable("Current Phase write-set declaration is invalid or differs from its index");
  if (changeScope?.status !== "recorded" || !Array.isArray(changeScope.changed_paths)) {
    return unavailable(changeScope?.reason ?? "Recorded current-Phase changeScope.changed_paths is required");
  }
  if (changeScope.changed_paths.some(path => typeof path !== "string" || !path || isAbsolute(path)
      || path.split("/").some(part => !part || part === "." || part === ".."))) {
    return unavailable("changeScope contains an invalid repository-relative path");
  }
  const local = [], external = [];
  for (const path of phase.write_set) {
    const identity = writePathIdentity(path, reviewReadScope);
    if (!isAbsolute(path)) { local.push(path); continue; }
    // Approved absolute repository aliases use the existing identity owner.
    if (identity.startsWith('["wh",')) local.push(JSON.parse(identity)[1]);
    else external.push(path);
  }
  const declared = new Set(local), changed = new Set(changeScope.changed_paths);
  const sorted = paths => Object.freeze([...paths].sort());
  return Object.freeze({ status: "recorded", phase_id,
    out_of_scope: sorted([...changed].filter(path => !declared.has(path))),
    listed_not_changed: sorted([...declared].filter(path => !changed.has(path))),
    matched: sorted([...declared].filter(path => changed.has(path))),
    external_write_surfaces: sorted(new Set(external)),
    coverage_limit: "Caller-supplied current-Phase baseline scope only; external write surfaces are not covered" });
}

function missingTaskField(value) {
  const normalized = String(value ?? '').replace(/[*_`]/g, '').trim();
  return !normalized || /^(?:TBD|TODO|待补充|\[|N\/A\s*$)/i.test(normalized);
}

// A narrow fallback for an omitted label, not a general language classifier.
function hasTaskProseAction(prose, files) {
  const targets = inlinePaths(files ?? '').filter(path => /[/.]/.test(path));
  const declared = String(files ?? '').match(/(?:\bsymbols?|符号)\s*[:：]\s*([^;；\n]+)/i)?.[1] ?? '';
  const symbols = declared.replace(/[`*]/g, '').split(/[,，、]/).map(name => name.trim())
    .filter(name => /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(name))
    .map(name => new RegExp(`(?:^|[^\\w$])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\w$])`));
  return prose.split(/[;；,，。\n]|\b(?:and|but|however|then)\b|但是|但|并且|同时|随后|然后|并/i).some(clause => {
    const affirmative = clause
      .replace(/\b(?:do not|don't|must not|never)\b.*$/i, '')
      .replace(/(?:不得|禁止|无需|不必|不要|不)(?:需要)?\s*(?:读取|修改|写入|编写|删除|替换|新增|实现|校验|验证|检查|保存).*$/, '');
    return (targets.some(target => affirmative.includes(target)) || symbols.some(symbol => symbol.test(affirmative)))
      && /(?:读取|修改|写入|编写|删除|替换|新增|实现|校验|验证|检查|保存|read\b|write\b|change\b|replace\b|implement\b)/i.test(affirmative);
  });
}

// Shared visibility for prose and Phase/Task boundaries; null marks fenced lines.
function taskSourceLines(body, preserveLines = false) {
  let fence = null;
  const source = body.replace(/<!--[\s\S]*?-->/g, match => preserveLines ? match.replace(/[^\r\n]/g, ' ') : '');
  return source.split(/\r?\n/).map(line => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length
          && /^[ \t]*$/.test(marker[2])) fence = null;
      return null;
    }
    if (marker && (marker[1][0] !== '`' || !marker[2].includes('`'))) {
      fence = marker[1];
      return null;
    }
    return line;
  });
}

// Count reader prose, excluding fields, tables, quoted source and fenced examples.
function taskCardProse(body) {
  return taskSourceLines(body).filter(line => line !== null && /\S/.test(line)
    && !/^(?:\s|[-*+>#|]|\d+[.)、）])/.test(line)
    && !/^(?:机器字段|校验器用|人可跳过)/.test(line)).join('\n');
}

function taskCardId(card, allowLocator = false) {
  const headingId = card.heading.match(/^(T\d{3,})\s+[—–-]\s+\S/)?.[1];
  if (headingId) return headingId;
  if (!allowLocator) return null;
  // A reader-facing card heading uses the Chinese task number; the stable
  // machine id stays inside the card-end field block.
  return card.body.match(/^\s*-\s+\*\*(?:任务编号|任务号|Task id)\*\*\s*[:：]\s*(T\d{3,})\s*$/mi)?.[1] ?? null;
}

export function phaseTaskCards(body) {
  const visible = taskSourceLines(body, true);
  const headingSource = body.split(/\r?\n/).map((line, i) =>
    (!visible[i]?.trim() && /^#{1,3}\s/.test(line)) ? line.replace(/^#+/, marks => ' '.repeat(marks.length)) : line).join('\n');
  let region = "";
  const hasL1 = /^##\s+L1\b/m.test(headingSource);
  const newShape = !hasL1 && machineFieldsSection(body) !== null;
  if (hasL1) {
    region = headingSource.split(/^##\s+L1\b[^\n]*\n/m)[1]?.split(/^##\s+L2\b/m)[0] ?? '';
  } else if (newShape) {
    // Explicit new shape: cards may live after the narrative, outside L1.
    // The fallback never applies to a document without the machine block.
    region = withoutMachineFields(headingSource);
  }
  return markdownSections(region, 3)
    .filter(({ heading }) => newShape ? /^(?:T\d+\b|任务\s*\d+\s*[:：])/.test(heading) : /^T\d+\b/.test(heading))
    .map(card => ({ ...card, taskId: taskCardId(card, newShape), prose: taskCardProse(card.body) }));
}

// Drafts may lack a complete material set; declared L1 Task cards still need prose.
export function phaseTaskProseGaps(body) {
  return phaseTaskCards(body).filter(card => card.taskId && !card.prose).map(card => card.taskId);
}

// Pre-dispatch readiness: one five-column table per Phase (command, expected,
// evidence, machine-or-human judgement, owner). Parsing is pure; executing the
// machine rows belongs to the callers that hold a task capture identity.
const READINESS_COLUMNS = Object.freeze(["命令", "期望", "证据", "机器或人判", "负责人"]);

function readinessCells(line) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

function stripCodeTicks(value) {
  return String(value ?? "").replace(/`/g, "").trim();
}

export function phaseReadinessRows(body) {
  const lines = String(body ?? "").split(/\r?\n/);
  // Only a heading outside fenced code declares the table. A code sample or a
  // prose mention of the name must not be read as a real readiness table.
  let start = -1, fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const marker = lines[index].match(/^\s*(`{3,}|~{3,})/);
    if (marker) { fence = fence === null ? marker[1] : (fence === marker[1] ? null : fence); continue; }
    if (fence !== null) continue;
    if (/^#{1,6}\s+[^\n]*开工就绪表\s*[（(]?[^\n]*$/.test(lines[index])) { start = index; break; }
  }
  if (start < 0) return Object.freeze({ declared: false, rows: Object.freeze([]), error: null });
  let header = -1;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*#{1,6}\s/.test(lines[index])) break;
    if (/^\s*\|/.test(lines[index])) { header = index; break; }
  }
  if (header < 0) return Object.freeze({ declared: true, rows: Object.freeze([]), error: `table header is missing (${READINESS_COLUMNS.join("、")})` });
  const columns = readinessCells(lines[header]).map((cell) => cell.replace(/\*\*/g, "").trim());
  if (columns.length < READINESS_COLUMNS.length || READINESS_COLUMNS.some((name, index) => columns[index] !== name)) {
    return Object.freeze({ declared: true, rows: Object.freeze([]),
      error: `table header must carry five columns: ${READINESS_COLUMNS.join("、")}` });
  }
  const rows = [];
  for (let index = header + 2; index < lines.length; index += 1) {
    if (!/^\s*\|/.test(lines[index])) break;
    const cells = readinessCells(lines[index]);
    rows.push(Object.freeze({
      line: index + 1,
      malformed: cells.length < READINESS_COLUMNS.length,
      command: stripCodeTicks(cells[0]),
      expected: stripCodeTicks(cells[1]),
      evidence: stripCodeTicks(cells[2]),
      mode: stripCodeTicks(cells[3]),
      owner: stripCodeTicks(cells[4]),
    }));
  }
  return Object.freeze({ declared: true, rows: Object.freeze(rows), error: null });
}

export function readinessMode(mode) {
  const text = String(mode ?? "").toLowerCase();
  if (text.includes("机器") || text.includes("machine")) return "machine";
  if (text.includes("人") || text.includes("human") || text.includes("manual")) return "human";
  return "unknown";
}

// Structural facts plus named errors. Execution intentionally stays outside:
// the caller must supply its own authenticated capture for real probes.
export function phaseReadinessContract(body, path) {
  const table = phaseReadinessRows(body);
  if (!table.declared) return Object.freeze({ declared: false, rows: Object.freeze([]), errors: Object.freeze([]) });
  const errors = [];
  if (table.error) errors.push(`${path} readiness ${table.error}`);
  if (!table.error && table.rows.length === 0) {
    errors.push(`${path} readiness table has no probe rows (missing probe; owner=计划负责人)`);
  }
  const rows = [];
  for (const [offset, row] of table.rows.entries()) {
    const label = `${path} readiness row ${offset + 1}`;
    if (row.malformed) { errors.push(`${label} needs five columns`); continue; }
    if (!row.command) errors.push(`${label} has an empty command`);
    if (!row.evidence) errors.push(`${label} lacks evidence`);
    if (!row.owner) errors.push(`${label} lacks owner`);
    const kind = readinessMode(row.mode);
    if (kind === "unknown") errors.push(`${label} has unknown judgement mode ${JSON.stringify(row.mode)}`);
    if (kind === "machine" && !/^(?:nonzero|非零|-?\d+)$/i.test(row.expected)) {
      errors.push(`${label} expects a non-integer exit ${JSON.stringify(row.expected)}`);
    }
    rows.push(Object.freeze({ ...row, kind, expected_exit: kind === "machine" && /^-?\d+$/.test(row.expected) ? Number(row.expected) : null }));
  }
  return Object.freeze({ declared: true, rows: Object.freeze(rows), errors: Object.freeze(errors) });
}

// The fingerprint binds one readiness result to the exact bytes it judged.
export function materialFingerprint({ spec = "", index = "", phases = {} } = {}) {
  const files = [["spec.md", spec], ["phases/index.md", index], ...Object.entries(phases ?? {})]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  const hash = createHash("sha256");
  for (const [path, body] of files) {
    const bytes = Buffer.from(String(body ?? ""), "utf8");
    hash.update(path); hash.update("\0"); hash.update(String(bytes.length)); hash.update("\0");
    hash.update(bytes); hash.update("\0");
  }
  return hash.digest("hex");
}

// 2026-11-26 方案 C: the readiness verdict depends on the readiness rows and on
// the real state of each probe's path arguments, not on the whole material set.
// A closeout section written after the table must not invalidate the verdict;
// a changed probe target must. This key is versioned so a legacy readiness.v1
// original is never mistaken for an equal v2 record.
const READINESS_FINGERPRINT_SCHEMA = "readiness-fingerprint.v2";

function readinessPathToken(token, cwd = process.cwd()) {
  const text = String(token ?? "");
  if (!text || text.startsWith("-")) return false;
  if (isAbsolute(text) || text.includes("/") || text.includes("\\")) return true;
  try { statSync(resolve(cwd, text)); return true; }
  catch { return false; }
}

// What a probe can observe about one path token. `test -e` judges existence
// only; a directory is its own state; a readable file is bound by content; an
// unreadable target is named instead of being silently treated as absent.
function readinessTargetState(token, cwd = process.cwd(), { mode = "content" } = {}) {
  const target = resolve(cwd, String(token ?? ""));
  let stat;
  try { stat = statSync(target); }
  catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return "absent";
    return `unreadable:${error.code ?? "unknown"}`;
  }
  if (mode === "exists") return "present";
  if (mode === "directory") return stat.isDirectory() ? "directory" : "not-directory";
  if (stat.isDirectory()) return "directory";
  try { return `sha256:${createHash("sha256").update(readFileSync(target)).digest("hex")}`; }
  catch (error) { return `unreadable:${error.code ?? "unknown"}`; }
}

function readinessProbeTargets(argv) {
  const name = argv[0], rest = argv.slice(1), targets = [];
  if (name === "test") {
    const flag = rest[0], target = rest.at(-1);
    if (typeof target === "string" && target !== "") {
      targets.push({ token: target, mode: flag === "-e" ? "exists" : flag === "-d" ? "directory" : "content" });
    }
    return Object.freeze(targets);
  }
  for (const token of rest) if (readinessPathToken(token)) targets.push({ token, mode: "content" });
  return Object.freeze(targets);
}

// Hash exactly what the readiness judgement read: the table rows as written and
// the real state of the path tokens each machine probe names. spec.md,
// phases/index.md and every other Phase card stay out (plan C, 2026-11-26).
export function readinessFingerprint({ phasePath = "", rows = [], cwd = process.cwd() } = {}) {
  // phasePath names the record's owner; it is not content and stays unhashed.
  void phasePath;
  const hash = createHash("sha256");
  hash.update(`${READINESS_FINGERPRINT_SCHEMA}\0`);
  for (const row of rows ?? []) {
    const kind = row.kind ?? readinessMode(row.mode);
    hash.update(JSON.stringify([String(row.command ?? ""), String(row.expected ?? ""), kind]));
    hash.update("\0");
    if (kind !== "machine") continue;
    let argv;
    try { argv = readinessProbeArgv(row.command); } catch { continue; }
    for (const { token, mode } of readinessProbeTargets(argv)) {
      hash.update(JSON.stringify([token, readinessTargetState(token, cwd, { mode })]));
      hash.update("\0");
    }
  }
  return hash.digest("hex");
}

function legacyProbeTargetChanges(probe, cwd) {
  const argv = Array.isArray(probe?.argv) ? probe.argv : [];
  const name = argv[0], rest = argv.slice(1), changes = [];
  if (name === "test") {
    const flag = rest[0], target = rest.at(-1);
    if (typeof target !== "string" || target === "") return changes;
    if (flag === "-e") {
      const was = probe.expected === "0" ? "present" : "absent";
      const is = readinessTargetState(target, cwd, { mode: "exists" }) === "absent" ? "absent" : "present";
      if (was !== is) changes.push(`probe target ${target} ${was} -> ${is}`);
    } else if (flag === "-d") {
      const was = probe.expected === "0" ? "directory" : "not-directory";
      const state = readinessTargetState(target, cwd, { mode: "directory" });
      const is = state === "directory" ? "directory" : state === "absent" ? "absent" : "not-directory";
      if (was !== is) changes.push(`probe target ${target} ${was} -> ${is}`);
    } else {
      // A readiness.v1 original records readability, not content; a removed or
      // unreadable target is still a named change.
      const was = probe.expected === "0" ? "readable" : "unreadable";
      const state = readinessTargetState(target, cwd);
      const is = state === "absent" ? "absent" : state.startsWith("unreadable:") ? "unreadable" : "readable";
      if (was !== is) changes.push(`probe target ${target} ${was} -> ${is}`);
    }
    return changes;
  }
  if (name === "shasum" || name === "sha256sum") {
    const target = rest.at(-1);
    if (typeof target !== "string" || target === "") return changes;
    let was = null;
    try { was = String(readFileSync(probe.output_ref, "utf8")).trim().split(/\s+/)[0]; } catch { was = null; }
    const state = readinessTargetState(target, cwd);
    if (was && state === "absent") changes.push(`probe target ${target} absent (was ${was.slice(0, 12)})`);
    else if (was && state.startsWith("sha256:") && state.slice(7) !== was) changes.push(`probe target ${target} sha256 changed`);
    else if (was && state.startsWith("unreadable:")) changes.push(`probe target ${target} ${state}`);
    return changes;
  }
  return changes;
}

// --- Acceptance criterion slot status: parsed once, read by three faces ------
// A Phase card states each accepted criterion's status in one slot. Five
// historical shapes exist, and a reader that scans the whole line for a status
// word (or uses a loose id regex) miscounts 78 criteria as 80 and turns prose
// negatives into conflicts. `acCardStatuses` is the only card-text reader;
// `applyRefVerdicts` is the only place evidence existence becomes `clean`.
const ACCEPTANCE_STATUS_WORDS = Object.freeze(["pass", "fail", "incomplete", "partial", "inconclusive", "deferred", "missing", "unavailable", "inconsistent"]);
const ACCEPTANCE_STATUS_SET = new Set(ACCEPTANCE_STATUS_WORDS);
// Worst-first ranking. `AC-P9-005` writes two grades in one cell and the card
// convention is "take the worst"; `fail`/`missing` outrank `unavailable`
// because they already name a lost result.
const ACCEPTANCE_STATUS_RANK = Object.freeze({ pass: 0, deferred: 1, incomplete: 2, inconclusive: 3, partial: 4, inconsistent: 5, unavailable: 6, fail: 7, missing: 7 });
const ACCEPTANCE_SLOT_SHAPES = Object.freeze([
  Object.freeze({ shape: "bold-bullet", pattern: new RegExp(String.raw`^-\s+\*\*(${ACCEPTANCE_CRITERION_SOURCE})\*\*\s*[:：]`) }),
  Object.freeze({ shape: "table-row", pattern: new RegExp(String.raw`^\|\s*(${ACCEPTANCE_CRITERION_SOURCE})\s*\|\s*([^|]*)\|`) }),
  Object.freeze({ shape: "indented-bullet", pattern: new RegExp(String.raw`^\s+- (${ACCEPTANCE_CRITERION_SOURCE})\s*[:：]`) }),
  Object.freeze({ shape: "bullet", pattern: new RegExp(String.raw`^- (${ACCEPTANCE_CRITERION_SOURCE})\s*[:：]`) }),
  Object.freeze({ shape: "bare-line", pattern: new RegExp(String.raw`^\s{2,}(${ACCEPTANCE_CRITERION_SOURCE})\s*[:：]`) }),
]);
const ACCEPTANCE_REF_PREFIX = /^(?:quality|skills|tools|tests|specs|docs|runtime|core|workflows)\//;
const ACCEPTANCE_REF_SUFFIX = /(?:^|\/)[A-Za-z0-9._-]+\.(?:json|output|md|mjs|txt|csv|jsonl|patch|sha256|log|ya?ml|png)$/;

function declaredAcceptanceCriterionIds(spec) {
  return [...new Set([...String(spec ?? "").matchAll(new RegExp(String.raw`^-\s+(?:\[[ xX]\]\s+)?\*\*(${ACCEPTANCE_CRITERION_SOURCE})\b`, "gm"))].map((match) => match[1]))];
}

function acceptanceWorst(values) {
  let worst = null;
  for (const value of values) {
    if (!ACCEPTANCE_STATUS_SET.has(value)) continue;
    if (worst === null || ACCEPTANCE_STATUS_RANK[value] > ACCEPTANCE_STATUS_RANK[worst]) worst = value;
  }
  return worst;
}

// One slot value -> the grades it states. Only the first word after the colon
// (or after an explicit ①② marker) is a grade; prose later on the line is not.
function acceptanceSlotGrades(value) {
  const cleaned = String(value ?? "").replace(/[`*]/g, "").trim();
  const marked = [...cleaned.matchAll(/[①②③④⑤⑥]\s*([A-Za-z]+)/g)].map((match) => match[1].toLowerCase());
  if (marked.length >= 1) {
    const grades = [];
    for (const grade of marked) { if (ACCEPTANCE_STATUS_SET.has(grade) && !grades.includes(grade)) grades.push(grade); }
    if (grades.length) return { grades, word: null };
  }
  const word = /^([A-Za-z]+)/.exec(cleaned)?.[1]?.toLowerCase() ?? null;
  return { grades: word && ACCEPTANCE_STATUS_SET.has(word) ? [word] : [], word };
}

function acceptanceSubitems(value) {
  const cleaned = String(value ?? "").replace(/[`*]/g, "");
  const items = [];
  for (const match of cleaned.matchAll(/[（(]\s*子项\s*([^（）()]*)\s*[）)]/g)) {
    for (const word of match[1].split(/[、,，/;\s]+/)) for (const token of word.matchAll(/[A-Za-z]+/g)) {
      const valueWord = token[0].toLowerCase();
      if (ACCEPTANCE_STATUS_SET.has(valueWord) && !items.includes(valueWord)) items.push(valueWord);
    }
  }
  return items;
}

// Backticked tokens on the criterion's own slot line. A path token is either a
// known repository prefix or a typed file; a 3-4 digit token is a receipt
// number. Anything else (a status word, a bare sha, `x:12`) is prose, not a
// reference, so "no reference" stays a real fact rather than a scan artifact.
function acceptanceRefKind(token) {
  const value = String(token ?? "").trim();
  if (value === "") return null;
  if (/^\d{3,4}$/.test(value)) return "receipt-number";
  if (/[{*}?]/.test(value)) return "ambiguous-path";
  // A directory is not a single original: its existence can never be judged as
  // a missing file.
  if (value.endsWith("/")) return "directory-path";
  // A `path:line` citation (`ocr-delegation-route.test.mjs:846`) names a place in
  // prose, not a declared original; only a whole-token path is a reference.
  if (ACCEPTANCE_REF_PREFIX.test(value) || ACCEPTANCE_REF_SUFFIX.test(value) || value.includes("/")) return "path";
  return null;
}

function acceptanceRefs(line) {
  const refs = [];
  for (const match of String(line ?? "").matchAll(/`([^`\n]+)`/g)) {
    const token = match[1].trim();
    const kind = acceptanceRefKind(token);
    if (kind === null) continue;
    const ref = { token, kind: kind === "path" && token.startsWith("quality/") ? "task-relative" : kind };
    if (!refs.some((item) => item.token === token)) refs.push(Object.freeze(ref));
  }
  return refs;
}

function acceptanceSlotSources(spec, phases) {
  const slots = new Map();
  for (const [ref, body] of Object.entries(phases ?? {})) {
    if (typeof body !== "string") continue;
    for (const [index, line] of body.split(/\r?\n/).entries()) {
      for (const { shape, pattern } of ACCEPTANCE_SLOT_SHAPES) {
        const match = pattern.exec(line);
        if (!match) continue;
        const id = match[1];
        const value = match[2] ?? line.slice(match[0].length);
        const list = slots.get(id) ?? [];
        list.push(Object.freeze({ path: ref, line: index + 1, shape, value, refs: acceptanceRefs(line) }));
        slots.set(id, list);
        break;
      }
    }
  }
  return { slots, declared: declaredAcceptanceCriterionIds(spec) };
}

export function acCardStatuses({ spec = "", phases = {} } = {}) {
  const { slots, declared } = acceptanceSlotSources(spec, phases);
  const declaredSet = new Set(declared);
  const entries = [], conflicts = [], variants = [], unparsed = [];
  for (const id of declared) {
    const sources = slots.get(id) ?? [];
    if (sources.length === 0) { unparsed.push(Object.freeze({ id, reason: "no-slot-on-any-card" })); continue; }
    const grades = [], subitems = [];
    for (const source of sources) {
      const parsed = acceptanceSlotGrades(source.value);
      if (!parsed.grades.length) unparsed.push(Object.freeze({ id, path: source.path, line: source.line, reason: "unparsed-grade", word: parsed.word }));
      for (const grade of parsed.grades) if (!grades.includes(grade)) grades.push(grade);
      for (const item of acceptanceSubitems(source.value)) if (!subitems.includes(item)) subitems.push(item);
    }
    // Same value written twice in different shapes is one fact, not a conflict.
    const distinct = [...new Set(grades)];
    let status = acceptanceWorst(distinct);
    if (status === null) continue;
    const crossShape = distinct.length > 1;
    const sameSourceVariants = sources.some((source) => acceptanceSlotGrades(source.value).grades.length > 1);
    if (sameSourceVariants) variants.push(Object.freeze({ id, values: Object.freeze([...distinct]), status }));
    if (crossShape && !sameSourceVariants) {
      status = "inconsistent";
      conflicts.push(Object.freeze({
        id,
        sources: Object.freeze(sources.map((source) => Object.freeze({
          path: source.path, line: source.line, shape: source.shape, raw_status: acceptanceSlotGrades(source.value).grades[0] ?? null,
        }))),
      }));
    }
    if (subitems.some((item) => item !== "pass" && item !== "verified")) status = acceptanceWorst([status, "incomplete"]);
    const refs = [];
    for (const source of sources) for (const ref of source.refs) if (!refs.some((item) => item.token === ref.token)) refs.push(ref);
    entries.push(Object.freeze({
      id,
      status,
      variants: Object.freeze([...distinct]),
      subitems: Object.freeze([...subitems]),
      clean: refs.length > 0,
      refs: Object.freeze(refs.map((ref) => Object.freeze({ ...ref }))),
      sources: Object.freeze(sources.map((source) => Object.freeze({ path: source.path, line: source.line, shape: source.shape, raw_status: acceptanceSlotGrades(source.value).grades[0] ?? null }))),
    }));
  }
  const counts = { pass: 0, incomplete: 0, partial: 0, inconclusive: 0, unavailable: 0, inconsistent: 0 };
  for (const entry of entries) if (Object.hasOwn(counts, entry.status)) counts[entry.status] += 1;
  const cardFiles = new Set(Object.keys(phases ?? {}));
  const readCards = new Set();
  for (const source of slots.values()) for (const item of source) readCards.add(item.path);
  const result = {
    total_declared: declared.length,
    resolved: entries.length,
    // `read` is the true hit count (cards that carried at least one criterion
    // slot); a full parse failure must not read as "all read". The number of
    // cards supplied is a separate, named fact.
    cards: { read: [...cardFiles].filter((ref) => readCards.has(ref)).length, provided: [...cardFiles].length, missing: [], unreadable: [] },
    counts,
    clean_pass: entries.filter((entry) => entry.status === "pass" && entry.clean).length,
    entries,
    conflicts,
    variants,
    pass_without_ref: entries.filter((entry) => entry.status === "pass" && !entry.clean).map((entry) => entry.id),
    unparsed,
  };
  // The fingerprint binds card bytes only. `refs[].status`/`clean` come from the
  // filesystem, so putting them here would mix "card text changed" with
  // "evidence file vanished" and force the terminal chain to invent A's values.
  result.fingerprint = createHash("sha256").update(JSON.stringify({
    entries: entries.map((entry) => ({
      id: entry.id, status: entry.status, variants: entry.variants, subitems: entry.subitems,
      refs: entry.refs.map((ref) => ref.token),
      sources: entry.sources.map((source) => ({ path: source.path, line: source.line, shape: source.shape })),
    })),
    unparsed: unparsed.map((item) => item.id),
  })).digest("hex");
  return result;
}

// The only place a `clean`/`clean_pass`/`pass_without_ref` value is produced.
// Callers pass `{"<id>#<ref index>": {status, reason}}` from the one evidence
// reader; none of them may re-implement this rule.
export function applyRefVerdicts(status, verdictsByKey = {}) {
  const verdicts = verdictsByKey !== null && typeof verdictsByKey === "object" ? verdictsByKey : {};
  const entries = (status?.entries ?? []).map((entry) => {
    const refs = (entry.refs ?? []).map((ref, index) => {
      const verdict = verdicts[`${entry.id}#${index}`];
      if (verdict === undefined || verdict === null) return { ...ref };
      return { ...ref, status: verdict.status ?? "unverified", ...(verdict.reason ? { reason: verdict.reason } : {}) };
    });
    return Object.freeze({
      ...entry,
      refs: Object.freeze(refs),
      clean: entry.status === "pass" && refs.length > 0 && refs.every((ref) => ref.status !== "missing"),
    });
  });
  return Object.freeze({
    ...status,
    entries: Object.freeze(entries),
    clean_pass: entries.filter((entry) => entry.status === "pass" && entry.clean).length,
    pass_without_ref: Object.freeze(entries.filter((entry) => entry.status === "pass" && !entry.clean).map((entry) => entry.id)),
  });
}

// One read for the persisted fact: parse once, then attach the evidence
// verdicts from the task record root (an absent root is `unresolved`, never
// `missing`, so "no place to look" cannot masquerade as "the file is gone").
function acceptanceStatusFact({ spec, phases, taskRecordRoot }) {
  const seed = acCardStatuses({ spec, phases });
  const verdicts = {};
  const rooted = typeof taskRecordRoot === "string" && isAbsolute(taskRecordRoot);
  for (const entry of seed.entries) {
    for (const [index, ref] of entry.refs.entries()) {
      if (ref.kind !== "task-relative") continue;
      if (ref.token.endsWith("/")) { verdicts[`${entry.id}#${index}`] = { status: "unverified", reason: "directory-path: 引用的是目录而不是单一原件" }; continue; }
      if (!rooted) { verdicts[`${entry.id}#${index}`] = { status: "unresolved", reason: "no-task-record-root" }; continue; }
      const checked = checkEvidencePath(ref.token, [], taskRecordRoot);
      verdicts[`${entry.id}#${index}`] = { status: checked.status, ...(checked.reason ? { reason: checked.reason } : {}) };
    }
  }
  return applyRefVerdicts(seed, verdicts);
}

// Legacy readiness.v1 originals carry no per-object fingerprint. Their own
// recorded probes and outputs are still real evidence, so this reader names the
// judged objects that changed instead of failing every legacy original as if
// the whole material set had moved.
export function legacyReadinessChanges({ record, rows = [], cwd = process.cwd() } = {}) {
  const changes = [];
  const probes = Array.isArray(record?.probes) ? record.probes : [];
  const humans = Array.isArray(record?.human_rows) ? record.human_rows : [];
  const machineRows = (rows ?? []).filter((row) => (row.kind ?? readinessMode(row.mode)) === "machine");
  const humanRows = (rows ?? []).filter((row) => (row.kind ?? readinessMode(row.mode)) === "human");
  if (probes.length !== machineRows.length) changes.push(`machine rows ${probes.length} -> ${machineRows.length}`);
  if (humans.length !== humanRows.length) changes.push(`human rows ${humans.length} -> ${humanRows.length}`);
  for (const [index, probe] of probes.entries()) {
    const row = machineRows[index];
    if (!row) break;
    if (probe.probe !== row.command) changes.push(`machine row ${index + 1} command changed`);
    if (probe.expected !== row.expected) changes.push(`machine row ${index + 1} expected ${JSON.stringify(probe.expected)} -> ${JSON.stringify(row.expected)}`);
    changes.push(...legacyProbeTargetChanges(probe, cwd));
  }
  for (const [index, human] of humans.entries()) {
    const row = humanRows[index];
    if (!row) break;
    if (human.command !== row.command) changes.push(`human row ${index + 1} command changed`);
    if (human.expected !== row.expected) changes.push(`human row ${index + 1} expected changed`);
  }
  return Object.freeze(changes);
}


// Machine rows run as argv only. Material text is untrusted, so the command
// must name a known read-only tool with read-only arguments; interpreters and
// anything that can write or destroy are rejected rather than executed.
const READINESS_SHELL_META = /[;&|<>$`(){}[\]*?~!\\]/;

const READ_ONLY_PROBES = Object.freeze({
  // Only the side-effect-free subcommand. status/log/show/diff can refresh the
  // index or invoke external diff/textconv drivers, so they stay out.
  git: Object.freeze({ subcommands: Object.freeze(["rev-parse"]),
    forbid: Object.freeze([/^--output(?:=|$)/]) }),
  node: Object.freeze({ oneOf: Object.freeze(["-v", "--version"]) }),
  shasum: Object.freeze({ forbid: Object.freeze([/^-o$/, /^--output(?:=|$)/]) }),
  sha256sum: Object.freeze({ forbid: Object.freeze([/^-o$/, /^--output(?:=|$)/]) }),
  uname: Object.freeze({ flags: /^(?:-[asnrvmo]+|--(?:all|kernel-name|nodename|kernel-release|kernel-version|machine|operating-system))$/ }),
  sw_vers: Object.freeze({ flags: /^(?:-(?:productName|productVersion|buildVersion))$/ }),
  pwd: Object.freeze({ argv: Object.freeze([]) }),
  whoami: Object.freeze({ argv: Object.freeze([]) }),
  id: Object.freeze({ flags: /^-[ugGn]+$/ }),
  date: Object.freeze({ flags: /^(?:-u|\+.+)$/ }),
  test: Object.freeze({}),
});

const DENIED_INTERPRETERS = /^(?:sh|bash|zsh|dash|ksh|fish|csh|tcsh|python(?:\d+(?:\.\d+)?)?|pypy(?:\d+)?|ruby|perl|php|nodejs|deno|bun|osascript|swift|lua|Rscript|java|dotnet|powershell|pwsh|cmd|npm|npx|pnpm|yarn|make|cmake|ninja|gradle|mvn|xargs|env|sudo|doas|su|expect)$/;
const DENIED_COMMANDS = /^(?:rm|rmdir|mv|cp|install|dd|mkfs(?:\..+)?|chmod|chown|chgrp|ln|mkdir|touch|tee|truncate|shred|kill|pkill|killall|curl|wget|ssh|scp|sftp|rsync|nc|ncat|socat|telnet|ftp|find|sed|awk)$/;

function checkReadOnlyArgv(argv) {
  const name = argv[0];
  if (name.includes("/") || name.includes("\\")) {
    throw new TypeError(`readiness probe must name a read-only tool, not a path: ${JSON.stringify(name)}`);
  }
  if (DENIED_INTERPRETERS.test(name)) {
    throw new TypeError(`readiness probe must not execute an interpreter: ${JSON.stringify(name)}`);
  }
  if (DENIED_COMMANDS.test(name)) {
    throw new TypeError(`readiness probe command is not read-only: ${JSON.stringify(name)}`);
  }
  const allowed = Object.hasOwn(READ_ONLY_PROBES, name) ? READ_ONLY_PROBES[name] : null;
  if (!allowed) {
    throw new TypeError(`readiness probe command is not on the read-only allowlist: ${JSON.stringify(name)} (allowed: ${Object.keys(READ_ONLY_PROBES).join(", ")})`);
  }
  const rest = argv.slice(1);
  if (allowed.oneOf) {
    if (rest.length !== 1 || !allowed.oneOf.includes(rest[0])) {
      throw new TypeError(`readiness probe ${name} only accepts ${allowed.oneOf.join(" or ")}`);
    }
    return;
  }
  if (allowed.argv) {
    if (rest.length !== allowed.argv.length || rest.some((arg, index) => arg !== allowed.argv[index])) {
      throw new TypeError(`readiness probe ${name} only accepts ${allowed.argv.length === 0 ? "no arguments" : allowed.argv.join(" ")}`);
    }
    return;
  }
  if (allowed.subcommands) {
    if (rest.length === 0 || !allowed.subcommands.includes(rest[0])) {
      throw new TypeError(`readiness probe git only allows read-only subcommands: ${allowed.subcommands.join(", ")}`);
    }
    for (const arg of rest.slice(1)) {
      if (allowed.forbid.some((pattern) => pattern.test(arg))) {
        throw new TypeError(`readiness probe git argument is not read-only: ${JSON.stringify(arg)}`);
      }
    }
    return;
  }
  for (const arg of rest) {
    if (allowed.forbid?.some((pattern) => pattern.test(arg))) {
      throw new TypeError(`readiness probe ${name} argument is not read-only: ${JSON.stringify(arg)}`);
    }
    if (allowed.flags && !allowed.flags.test(arg)) {
      throw new TypeError(`readiness probe ${name} flag is not read-only: ${JSON.stringify(arg)}`);
    }
  }
}

export function readinessProbeArgv(command) {
  const text = String(command ?? "").trim();
  if (!text) throw new TypeError("readiness probe command is empty");
  const argv = [];
  let token = null, quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote) { quote = null; continue; }
      if (char === "\\" && quote === '"' && index + 1 < text.length) { token += text[index + 1]; index += 1; continue; }
      token += char; continue;
    }
    if (char === '"' || char === "'") { quote = char; token ??= ""; continue; }
    if (/\s/.test(char)) { if (token !== null) { argv.push(token); token = null; } continue; }
    if (READINESS_SHELL_META.test(char)) {
      throw new TypeError(`readiness probe must be an argv-only read-only command; shell metacharacter ${JSON.stringify(char)} is not allowed`);
    }
    token ??= ""; token += char;
  }
  if (quote) throw new TypeError("readiness probe has an unterminated quote");
  if (token !== null) argv.push(token);
  if (argv.length === 0) throw new TypeError("readiness probe command is empty");
  checkReadOnlyArgv(argv);
  return Object.freeze(argv);
}

export function validatePostPhaseContract({ spec, index, phases, reviewReadScope, changeScope, phase_id, prose_contract, material_path, task_record_root, require_readiness = false } = {}) {
  const errors = [];
  const proseMode = prose_contract ?? (/(?:^|[/\\])archive(?:[/\\]|$)/.test(material_path ?? '') ? 'diagnostic' : 'required');
  if (!['diagnostic', 'required'].includes(proseMode)) errors.push('prose_contract must be diagnostic or required');
  const fieldGaps = [], cardProseGaps = [];
  if (!nonEmptyString(spec)) errors.push("spec.md content is required");
  if (!nonEmptyString(index)) errors.push("phases/index.md content is required");
  if (!phases || typeof phases !== "object" || Array.isArray(phases)) errors.push("independent Phase files are required");
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors), facts: null });

  let dependencyValid = true;
  let commandOracleValid = true;
  const dependencyError = (message) => { dependencyValid = false; errors.push(message); };
  const commandError = (message) => { commandOracleValid = false; errors.push(message); };
  const rows = executionIndexRows(index, errors, reviewReadScope, () => { dependencyValid = false; });
  if (!rows || rows.length === 0) errors.push("phases/index.md requires an Execution Index with Phase pointers");
  const pointerLabels = ["gate_cmd", "expected_exit", "oracle", "evidence_path"]
    .map((name) => `(?:${name}\\b|(?:${labelAlternation(name)})(?=\\*\\*|[:：\\s]|$))`).join("|");
  if (new RegExp(`^\\s*[-*]\\s*(?:\\*\\*)?(?:${pointerLabels})`, "mi").test(index)) {
    errors.push("Phase index must remain pointer-only; command, oracle, and evidence belong to Phase files");
  }
  const phaseRows = [];
  const readinessPhases = [];
  const archiveMaterial = /(?:^|[/\\])archive(?:[/\\]|$)/.test(material_path ?? "");
  const evidenceRoots = readableEvidenceRoots(evidenceSearchRoots(reviewReadScope, material_path));
  const evidenceFacts = { verified: [], planned: [], missing: [], unverified: [] };
  // Anchor ②: the current task facts' quality_evidence sha256 values. Read once;
  // an absent/unreadable facts file is an empty table, never an error here.
  // The writer stores the receipt's hash when receipt_ref exists, so that sha256
  // belongs to the receipt only; attaching it to ref would be a false mismatch.
  const factsShaByRef = new Map();
  if (typeof task_record_root === "string" && isAbsolute(task_record_root)) {
    try {
      const raw = readFileSync(resolve(task_record_root, "facts.jsonl"), "utf8");
      for (const line of raw.trimEnd().split(/\r?\n/)) {
        if (line.trim() === "") continue;
        let row;
        try { row = JSON.parse(line); } catch { continue; }
        if (row === null || typeof row !== "object" || Array.isArray(row)) continue;
        const entries = Array.isArray(row.evidence?.value) ? row.evidence.value : [];
        for (const entry of entries) {
          if (entry === null || typeof entry !== "object" || entry.kind !== "quality_evidence" || typeof entry.sha256 !== "string") continue;
          const hasReceipt = typeof entry.receipt_ref === "string" && entry.receipt_ref.trim() !== "";
          const refs = hasReceipt ? [entry.receipt_ref] : [entry.ref];
          for (const ref of refs) {
            if (typeof ref !== "string" || ref.trim() === "") continue;
            const list = factsShaByRef.get(ref) ?? [];
            list.push(entry.sha256);
            factsShaByRef.set(ref, list);
          }
        }
      }
    } catch { /* missing facts.jsonl keeps the map empty; no invented anchor */ }
  }
  let selectedPhaseScopeValid = false;
  const indexedPaths = new Set();
  const writeOwners = new Map();
  const phaseAncestors = new Map();
  for (const row of (rows ?? [])) {
    const dependencies = WITHOUT_PREDECESSOR.test(row.dependency ?? "") ? [] : identifiers(row.dependency ?? "", /\bP\d+\b/g);
    phaseAncestors.set(row.authority_ref, new Set(dependencies.flatMap((id) => {
      const ref = (rows ?? []).find((candidate) => candidate.phase === id)?.authority_ref ?? `phases/${id}.md`;
      return [ref, ...(phaseAncestors.get(ref) ?? [])];
    })));
  }
  const serializedPair = (ownerRef, currentRef) => phaseAncestors.get(currentRef)?.has(ownerRef) === true;
  const design = markdownSections(spec, 2).find(({ heading }) => /^(?:实现设计（全局权威）|Implementation Design)$/i.test(heading));
  const designSections = design ? markdownSections(`## ${design.heading}\n${design.body}`, 3) : [];
  const designBody = Object.fromEntries(designSections.map(({ heading, body }) => [canonicalDesignHeading(heading), body]));
  const traceLines = (designBody["Requirement-to-Task Trace"] ?? "").split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
  const sourceIds = value => identifiers(String(value ?? "").replace(/\b((?:R|U|PRD|CARD)-[A-Z0-9-]*-)(\d+)((?:\/\d+)+)\b/g,
    (_, prefix, first, rest) => [first, ...rest.slice(1).split("/")].map(suffix => prefix + suffix).join("/")), /\b(?:R|U|PRD|CARD)-[A-Z0-9-]+\b/g);
  const nonAcceptance = value => /(?:非|不计|不属于)[^；;。|\n]*\bAC\b/i.test(value ?? "");
  const factTraceRows = traceLines.map(analyzeMarkdownTableCells).filter(cells => cells.length === 5
    && sourceIds(cells[0]).length > 0 && nonAcceptance(cells[1])
    && !/\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/.test(cells[1]) && identifiers(cells[1], ACCEPTANCE_CRITERION_ID).length === 0
    && /^P\d+\/T\d{3,}$/.test(cells[2]) && /^ORACLE-[A-Z0-9-]+$/.test(cells[3]) && cells[4].trim().length > 0
    && !/^(?:N\/A|TBD|TODO|待补充)(?:\s*[:：]|$)/i.test(cells[4].trim()));
  const factTaskTraces = new Map();
  const taskOwners = new Map();
  const taskCards = [];
  for (const row of (rows ?? [])) {
    const position = row.position - 1;
    const expectedId = row.phase;
    const expectedPath = row.authority_ref;
    if (expectedPath.match(/^phases\/(P[1-9][0-9]*)(?:-|\.md$)/)?.[1] !== expectedId) errors.push(`${expectedId} authority ref must identify ${expectedId}`);
    if (!row.semantic_anchor) errors.push(`${expectedId} semantic anchor is required`);
    if (!row.consumer) errors.push(`${expectedId} consumer is required`);
    if (indexedPaths.has(row.authority_ref)) dependencyError(`duplicate Phase authority ref: ${row.authority_ref}`);
    indexedPaths.add(row.authority_ref);
    const body = phases[expectedPath];
    if (!nonEmptyString(body)) {
      errors.push(`${expectedPath} is missing or empty`);
      continue;
    }
    let scopeValid = true;
    if (!new RegExp(`^#\\s+(?:Phase|阶段)\\s+${expectedId}\\b`, "m").test(body)) {
      errors.push(`${expectedPath} must declare Phase ${expectedId}`);
      scopeValid = false;
    }
    for (const heading of ["L0", "L1", "L2"]) {
      if (machineFieldsSection(body) === null && !new RegExp(`^##\\s+${heading}\\b`, "m").test(body)) errors.push(`${expectedPath} is missing ${heading}`);
    }
    const declaredWriteSet = [];
    const machineBlock = machineFieldsBlock(body);
    if (machineBlock && body.split(/\r?\n/).slice(machineBlock.start + 1)
      .some((line) => /^###\s+(?:T\d{3,}\b|任务\s*\d+\s*[:：])/.test(line))) {
      errors.push(`${expectedPath} task cards must appear before the file-end machine block`);
    }
    const authorityBody = phaseAuthorityBody(body);
    const authorityFields = withoutMachineFields(authorityBody);
    const machineBody = machineFieldsSection(body) ?? "";
    // Phase-level fields come only from the pre-card declaration region or the
    // file-end machine block. A same-named field inside a task card never
    // supplies a Phase-level value.
    const phaseField = (name) => fieldValue(machineBody, name) ?? fieldValue(authorityFields, name);
    const declaration = phaseField("Write set");
    // 2026-11-25 用户裁决：写入集字段只作推荐，不再校验（缺字段、摘要不符、
    // 与索引不一致、同路径多阶段重复都不报错）。仍读取它，供「只读阶段」判定使用。
    const pointer = parseWriteSetPointer(declaration);
    if (pointer) declaredWriteSet.push(...(row.write_set ?? []));
    else declaredWriteSet.push(...phaseWriteSet(body));
    let explicitNone = EXPLICIT_EMPTY_WRITE_SET.test(declaration ?? "")
      || (pointer ? (row.write_set ?? []).length === 0 : declaredWriteSet.length === 0);
    const sourceIdentity = path => writePathIdentity(path, reviewReadScope);
    const dependencyText = phaseField("Dependency");
    const dependency = dependencyText?.match(/`([^`]+)`/)?.[1] ?? dependencyText ?? null;
    const phaseDependencies = WITHOUT_PREDECESSOR.test(dependency ?? "") ? [] : identifiers(dependency ?? "", /\bP\d+\b/g);
    const indexDependencies = WITHOUT_PREDECESSOR.test(row.dependency ?? "") ? [] : identifiers(row.dependency ?? "", /\bP\d+\b/g);
    if (!sameIds(phaseDependencies, indexDependencies)
        || (!WITHOUT_PREDECESSOR.test(dependency ?? "") && phaseDependencies.length === 0)
        || (!WITHOUT_PREDECESSOR.test(row.dependency ?? "") && indexDependencies.length === 0)
        || phaseDependencies.some((id) => !(rows ?? []).some((candidate) => candidate.phase === id && candidate.position < row.position))) {
      dependencyError(`${expectedPath} dependency must match the index and reference only earlier Phase IDs`);
    }
    if (!phaseField("Global spec")?.includes("spec.md")) errors.push(`${expectedPath} requires a stable spec.md pointer`);
    const consumer = phaseField("Consumer")?.replace(/[。；;\s]+$/u, "").trim();
    if (!consumer || consumer !== row.consumer?.replace(/[。；;\s]+$/u, "").trim()) {
      errors.push(`${expectedPath} consumer differs from Phase index`);
    }
    const command = phaseField("gate_cmd");
    const oracle = phaseField("oracle");
    if (!hasExecutableCommand(command) || !/^ORACLE-[A-Z0-9-]+/.test(oracle ?? "")) {
      commandError(`${expectedPath} requires an executable gate_cmd and oracle`);
    }
    const evidenceValue = phaseField("evidence_path");
    if (!phaseField("STOP") || !phaseField("Done") || !evidenceValue) {
      errors.push(`${expectedPath} requires STOP, Done, and evidence_path`);
    } else if (plannedEvidence(evidenceValue)) {
      // An explicit known gap is not a pass and not an error: it stays visible
      // in facts so a planned path can never masquerade as generated evidence.
      const [planned] = declaredEvidencePaths(evidenceValue);
      evidenceFacts.planned.push(Object.freeze({
        phase_id: expectedId, path: planned?.path ?? evidenceValue, statement: evidenceValue,
      }));
    } else {
      const declaredPaths = declaredEvidencePaths(evidenceValue);
      if (declaredPaths.length === 0) {
        evidenceFacts.unverified.push(Object.freeze({
          phase_id: expectedId, path: null,
          reason: "not-single-path: evidence_path declares no concrete path", statement: evidenceValue,
        }));
      }
      for (const declaredPath of declaredPaths) {
        const token = declaredPath.path;
        if (!isAbsolute(token) && evidenceRoots.length === 0 && !taskEvidenceRoot(token, task_record_root)) {
          evidenceFacts.unverified.push(Object.freeze({
            phase_id: expectedId, path: token,
            reason: "no-run-binding: no readable material, repository, or task root",
          }));
          continue;
        }
        const checked = checkEvidencePath(token, evidenceRoots, task_record_root, {
          declared_sha256: declaredPath.declared_sha256 ?? undefined,
          facts_sha256: factsShaByRef.get(token) ?? [],
        });
        if (checked.status === "verified") {
          evidenceFacts.verified.push(Object.freeze({
            phase_id: expectedId, path: token, resolved: checked.resolved,
            ...(checked.resolution_source ? { resolution_source: checked.resolution_source } : {}),
          }));
          continue;
        }
        if (archiveMaterial) {
          // Archived material is historical: prose already accepts diagnostic
          // mode there, and a missing old path must not become a new gate.
          evidenceFacts.unverified.push(Object.freeze({
            phase_id: expectedId, path: token,
            reason: "no-run-binding: archive material keeps historical evidence out of the current gate",
          }));
          continue;
        }
        if (checked.status === "unverified") {
          evidenceFacts.unverified.push(Object.freeze({
            phase_id: expectedId, path: token, reason: checked.reason,
          }));
          continue;
        }
        evidenceFacts.missing.push(Object.freeze({ phase_id: expectedId, path: token }));
        const taskRoot = taskEvidenceRoot(token, task_record_root);
        const searchedRoots = taskRoot ? [...new Set([...evidenceRoots, taskRoot])] : evidenceRoots;
        const searched = isAbsolute(token)
          ? "absolute path checked directly"
          : `searched roots: ${searchedRoots.join(", ")}`;
        errors.push(`${expectedPath} evidence_path does not exist: ${token} (${searched})`);
      }
    }
    const frs = identifiers(body, /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
    const acs = identifiers(body, ACCEPTANCE_CRITERION_ID);
    const cards = phaseTaskCards(body);
    if (cards.length === 0) commandError(`${expectedPath} requires independent ### Tnnn task cards; one-line Tasks is insufficient`);
    for (const { body: cardBody, taskId, prose } of cards) {
      if (!taskId) {
        commandError(`${expectedPath} task card requires stable ### Tnnn — outcome heading`);
        continue;
      }
      if (taskOwners.has(taskId)) commandError(`${expectedPath} duplicate task card ${taskId} owned by ${taskOwners.get(taskId)}`);
      else taskOwners.set(taskId, expectedPath);
      const required = [
        "Source / FR / AC", "Files / symbols", "Action", "Inputs", "Outputs / failure",
        "Boundary / DO NOT TOUCH", "Dependency", "Test tier / skill", "Scenario / fixture or service",
        "RED/GREEN gate_cmd", "expected_exit", "RED target failure", "GREEN oracle",
        "Evidence", "STOP / recovery", "Coverage limit", "Done",
      ];
      const fields = Object.fromEntries(required.map((field) => [field, fieldValue(cardBody, field)]));
      if (!prose) {
        cardProseGaps.push(`${expectedPath} ${taskId}`);
        if (proseMode === 'required') commandError(`${expectedPath} ${taskId} task card requires reader prose`);
      }
      for (const field of required) {
        const value = fields[field];
        if (missingTaskField(value)) {
          fieldGaps.push(Object.freeze({ phase_id: expectedId, task_id: taskId, path: expectedPath, field }));
        }
      }
      // A missing label alone is advisory; an absent actual action remains a
      // real failure. Navigation outside this Task cannot supply its action.
      if (missingTaskField(fields.Action) && !hasTaskProseAction(prose, fields['Files / symbols'])) {
        commandError(`${expectedPath} ${taskId} task card missing concrete Action`);
      }
      const cardFrs = identifiers(fields["Source / FR / AC"] ?? "", /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
      const cardAcs = identifiers(fields["Source / FR / AC"] ?? "", ACCEPTANCE_CRITERION_ID);
      const filePaths = inlinePaths(fields["Files / symbols"] ?? "").filter((path) => /[/.]/.test(path));
      const readOnlyTask = explicitNone && row.write_set.length === 0 && declaredWriteSet.length === 0
        && /(?:read-only|只读)/i.test(fields["Files / symbols"] ?? "")
        && /(?:read-only|只读)/i.test(fields.Action ?? "")
        && /(?:no production writes|无生产修改|不.*(?:写|修改)|do not produce or change code)/i.test(`${fields["Files / symbols"] ?? ""} ${fields.Action ?? ""}`)
        && !hasAffirmativeCodeWrite(fields.Action);
      if (!readOnlyTask && filePaths.length === 0) {
        errors.push(`${expectedPath} ${taskId} Files / symbols must name at least one path`);
      }
      if (!/(?:\bsymbol|符号|N\/A\s+[—-]\s+\S)/i.test(fields["Files / symbols"] ?? "")) {
        errors.push(`${expectedPath} ${taskId} Files / symbols must name a symbol or explain N/A for non-code files`);
      }
      if (!hasExecutableCommand(fields["RED/GREEN gate_cmd"])) commandError(`${expectedPath} ${taskId} needs one executable RED/GREEN gate_cmd`);
      if (!/^ORACLE-[A-Z0-9-]+\b/.test(fields["GREEN oracle"] ?? "")) commandError(`${expectedPath} ${taskId} needs an identifiable GREEN oracle`);
      const greenOracle = fields["GREEN oracle"]?.match(/^ORACLE-[A-Z0-9-]+\b/)?.[0];
      const redOracle = fields["RED target failure"]?.match(/\bORACLE-[A-Z0-9-]+\b/)?.[0];
      if (!greenOracle || redOracle !== greenOracle) commandError(`${expectedPath} ${taskId} RED oracle must match GREEN oracle`);
      if (!/(?:assert|断言|expected|预期|nonzero|失败)/i.test(fields["RED target failure"] ?? "")) {
        commandError(`${expectedPath} ${taskId} RED target failure must identify the failing assertion`);
      }
      // This is a declaration-only exception, never an execution/quality fact.
      // Read Task fields and the SAME owned paths checked above, not Phase text.
      const normalize = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
      const clauses = (value) => normalize(value).split(/[；;。\n]/u).map((part) => part.trim()).filter(Boolean);
      const noBehavior = /(?:无|不|未)(?:新增)?\s*(?:runtime|运行行为)|无新行为/i;
      const docDeclaration = [fields.Inputs, fields["Scenario / fixture or service"]].some((value) =>
        /G-2/i.test(value ?? "") && /文档/.test(value ?? "") && noBehavior.test(value ?? ""));
      const behaviorExit = /RED[^\n]*\b(?:nonzero|[1-9])\b/i.test(fields.expected_exit ?? "")
        && /GREEN[^\n]*\b0\b/i.test(fields.expected_exit ?? "");
      // Mentioning G-2 while satisfying the normal behavioral contract is not
      // an exemption request. Inapplicable tags must not reject legal behavior.
      const requestsG2 = docDeclaration || (!behaviorExit && [fields.Inputs, fields["Scenario / fixture or service"]].some((value) => /G-2/i.test(value ?? "")));
      const g2Missing = [];
      if (requestsG2) {
        if (!docDeclaration) g2Missing.push("pure documentation declaration (文档无新增运行行为)");
        const ownedPaths = inlinePaths(fields["Files / symbols"] ?? "");
        const documentPath = (path) => /\.md$/i.test(path);
        if (ownedPaths.length === 0 || ownedPaths.some((path) => !documentPath(path))) g2Missing.push("documentation-only owned write set");
        // Bound this optional field to its own line: the general reader's \s
        // can otherwise consume the next field when RED evidence is empty.
        const redEvidenceLine = cardBody.split(/\r?\n/).find((line) => /^\s*-\s+\*\*(?:RED evidence|RED 证据)\*\*\s*[:：]/i.test(line));
        const redEvidence = normalize(fieldValue(redEvidenceLine, "RED evidence"));
        if (!redEvidence) g2Missing.push("empty RED evidence / reason");
        else if (/^N\/A[。.]?$/i.test(redEvidence)) g2Missing.push("bare N/A / reason");
        if (!/^N\/A\s*[—–-]/i.test(redEvidence)
            || !clauses(redEvidence).some((part) => /文档/.test(part) && noBehavior.test(part))) g2Missing.push("reason (具体纯文档、无新增 runtime/运行行为)");
        // The legacy reason can introduce risk after a comma. Only a labeled
        // segment supplies it; incidental 风险 in the reason is not a risk label.
        const risk = clauses(redEvidence).flatMap((part) => part.split(/[，,]/u))
          .map((part) => part.trim()).find((part) => /^风险(?:为|是|[:：])/u.test(part));
        const riskContent = risk?.replace(/^风险(?:为|是|[:：])\s*/u, "") ?? "";
        const riskPredicate = riskContent.match(/^(.{2,}?)(误把|误认|误用|遗漏|泄露|未执行|当作|当成)(.*)$/u);
        if (!riskPredicate || /(?:无风险|风险为风险|失败风险|失败的可能|待补|TBD|TODO)/i.test(riskContent)
            || /^(?:风险|失败|可能)$/u.test(riskPredicate?.[1] ?? "")
            || (/^(?:误把|误认|误用|当作|当成)$/u.test(riskPredicate?.[2] ?? "")
              && (riskPredicate?.[3].trim().length ?? 0) < 2)) g2Missing.push("risk (具体对象/后果)");
        const alternativeFields = [redEvidence, fields.Evidence, fields["GREEN oracle"]];
        const alternative = alternativeFields.flatMap(clauses).flatMap((part) => part.split(/[，,]/u))
          .map((part) => part.trim().replace(/^(?:`[^`]+`\s*)+/u, ""))
          .find((part) => /^客观替代(?:为|是|[:：])/u.test(part));
        // A bare assertion label is not a criterion. A document-review name can
        // use either paired ORACLE field to supply the concrete judgment object.
        const concreteCriterion = [alternative, fields["RED target failure"], fields["GREEN oracle"]].flatMap(clauses).some((part) => {
          const criterion = part.replace(/\bORACLE-[A-Z0-9-]+\b/g, "")
            .replace(/(?:断言|assert(?:ion)?|判定|预期|expected)\s*[:：]?/gi, "").trim();
          // Supported predicates bind a named subject to an observable outcome,
          // rather than treating a four-character "pass" as a judgment object.
          const subjectOutcome = criterion.match(/^(.{2,}?)(不会发布|不发布|可(?:在.{1,80})?复放|不被.{2,80}吞掉|拒绝|保留|保持可见)/u);
          const englishOutcome = criterion.match(/^([A-Za-z][\w.-]+(?:\s+[A-Za-z][\w.-]*)*)\s+(?:must not|does not|rejects|preserves|remains)\s+(.{2,})$/i);
          return Boolean((subjectOutcome && !/^(?:检查|验证|结果|测试)\s*$/u.test(subjectOutcome[1].trim()))
            || (englishOutcome && !/^(?:test|check|result)$/i.test(englishOutcome[1])));
        });
        if (!alternative || !concreteCriterion || /(?:替代为替代|按需|待补)/u.test(alternative)
            || !/(?:[A-Za-z][\w-]*\s*(?:用例|fixture|流程)?\s*(?:重放|复放)|(?:独立|逐步|具名).*文档审查)/iu.test(alternative)
            || !/(?:重放|复放|审查)/u.test(alternative)
            || !/(?:断言|assert|预期|expected)/i.test(fields["RED target failure"] ?? "")) g2Missing.push("objective alternative (具名检查和判定对象)");
        const disclosure = [fields.expected_exit, fields.Evidence, fields["Coverage limit"]].flatMap(clauses);
        if (!disclosure.some((part) => /(?:lint\s*(?:仍)?\s*false|替代.*未执行|不能.*(?:GREEN|通过)|结构接纳不等于.*(?:GREEN|替代已执行|阶段完成|质量成功))/i.test(part))) g2Missing.push("acceptance disclosure (真实限制，非已披露占位)");
        if (!/(?:客观|检查)[^；;。]*预期\s*0\b/u.test(normalize(fields.expected_exit))
            || !/不执行\s*RED\b/i.test(fields.expected_exit ?? "")) g2Missing.push("expected_exit (客观检查预期0、不执行RED)");
        const declarations = [fields.Inputs, fields["Scenario / fixture or service"], redEvidence,
          fields.expected_exit, fields.Evidence, fields["Coverage limit"], fields["GREEN oracle"], fields.Action, fields["Outputs / failure"]];
        // Strip supported negative forms before looking for affirmative conflicts.
        const affirmativeConflict = declarations.flatMap(clauses).some((part) =>
          /(?:新增\s*(?:runtime|运行行为)|修改\s*执行逻辑)/i.test(part.replace(/(?:无|不|未|不会)\s*(?:新增\s*(?:runtime|运行行为)|修改\s*执行逻辑)/gi, "")));
        if (affirmativeConflict) g2Missing.push("contradiction (新增 runtime/运行行为、修改执行逻辑)");
        for (const missing of g2Missing) commandError(`${expectedPath} ${taskId} G-2 missing concrete ${missing}`);
      }
      const pureDocumentAlternative = requestsG2 && g2Missing.length === 0;
      // A declared task-owned fact document still needs source, consumer and
      // oracle trace; an explicit non-AC contract cannot invent product IDs.
      const factPaths = scopeValid && declaredWriteSet.length > 0 && declaredWriteSet.every(path => {
        const identity = writePathIdentity(path, reviewReadScope);
        return identity.startsWith('["task-evidence",') && /\.md$/i.test(path);
      });
      const originalSources = sourceIds(fields["Source / FR / AC"]);
      const factTraces = factPaths && pureDocumentAlternative && !hasAffirmativeCodeWrite(fields.Action)
        && cardFrs.length === 0 && cardAcs.length === 0 && originalSources.length > 0
        && nonAcceptance(fields["Source / FR / AC"])
        ? factTraceRows.filter(cells => cells[2] === `${expectedId}/${taskId}`
          && cells[3] === greenOracle && sameIds(sourceIds(cells[0]), originalSources)) : [];
      if (factTraces.length === 1) factTaskTraces.set(`${expectedId}/${taskId}`, factTraces[0].join(" | "));
      else if (cardFrs.length === 0 || cardAcs.length === 0 || originalSources.length === 0) {
        errors.push(`${expectedPath} ${taskId} Source / FR / AC must bind original source, FR, and AC`);
      }
      if (!pureDocumentAlternative && !behaviorExit) {
        commandError(`${expectedPath} ${taskId} expected_exit must distinguish RED target failure from GREEN 0`);
      }
      if (!/(?:`[^`]+`|\bP\d+\b|\bT\d+\b|\bnone\b|无)/i.test(fields.Dependency ?? "")) {
        errors.push(`${expectedPath} ${taskId} Dependency must identify an existing prerequisite or none`);
      }
      taskCards.push(Object.freeze({ id: taskId, phase: expectedId, frs: Object.freeze(cardFrs), acs: Object.freeze(cardAcs), oracle: fields["GREEN oracle"] ?? null, dependency: fields.Dependency ?? "" }));
    }
    const taskIds = cards.map(({ heading, taskId }) => heading.match(/^(T\d{3,})\b/)?.[1] ?? taskId).filter(Boolean);
    const readiness = phaseReadinessContract(body, expectedPath);
    errors.push(...readiness.errors);
    if (require_readiness && !readiness.declared) {
      errors.push(`${expectedPath} missing readiness table (build-code dispatch requires the five columns 命令/期望/证据/机器或人判/负责人)`);
    }
    readinessPhases.push(Object.freeze({
      phase_id: expectedId,
      path: expectedPath,
      declared: readiness.declared,
      machine_count: readiness.rows.filter((row) => row.kind === "machine").length,
      human_count: readiness.rows.filter((row) => row.kind === "human").length,
      rows: Object.freeze(readiness.rows.map((row) => Object.freeze({
        line: row.line, command: row.command, expected: row.expected, evidence: row.evidence,
        mode: row.mode, kind: row.kind, owner: row.owner, expected_exit: row.expected_exit,
      }))),
    }));
    if (expectedId === phase_id) selectedPhaseScopeValid = scopeValid;
    phaseRows.push(Object.freeze({ id: expectedId, path: expectedPath, write_set: Object.freeze(scopeValid ? declaredWriteSet : []), dependency, frs: Object.freeze(frs), acs: Object.freeze(acs), task_ids: Object.freeze(taskIds), command, oracle }));
  }
  for (const path of Object.keys(phases)) {
    if (!indexedPaths.has(path)) errors.push(`unindexed Phase file: ${path}`);
  }
  for (const [position, card] of taskCards.entries()) {
    const refs = identifiers(card.dependency, /\b[PT]\d+\b/g);
    const leading = card.dependency.match(/^\s*(?:`([^`]+)`|([^；;。，,\s]+))(?=$|[；;。，,\s])/u);
    const declaration = leading?.[1] ?? leading?.[2] ?? "";
    if (refs.length === 0 && !WITHOUT_PREDECESSOR.test(declaration)) {
      dependencyError(`${card.phase}/${card.id} dependency must be none or identify a Phase/Task`);
    }
    for (const ref of refs) {
      if (ref.startsWith("P") && !(rows ?? []).some((row) => row.phase === ref && Number(ref.slice(1)) < Number(card.phase.slice(1)))) {
        dependencyError(`${card.phase}/${card.id} dependency ${ref} must be an earlier Phase`);
      }
      if (ref.startsWith("T") && (!taskOwners.has(ref) || taskCards.findIndex((task) => task.id === ref) >= position)) {
        dependencyError(`${card.phase}/${card.id} dependency ${ref} must be an existing earlier task`);
      }
    }
  }
  const acceptedFrs = [...new Set([...spec.matchAll(/^-\s+\*\*(FR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3}))\*\*/gm)].map((match) => match[1]))];
  // Same declaration surface as `acCardStatuses`; one regex, one function.
  const declaredAcs = declaredAcceptanceCriterionIds(spec);
  const dispositions = acceptanceCriterionDispositions(spec);
  const activeAcs = new Set(dispositions.active_ids);
  const acceptedAcs = declaredAcs.filter((id) => activeAcs.has(id));
  const deferredAcs = declaredAcs.filter((id) => dispositions.deferred_ids.includes(id));
  for (const card of taskCards) {
    for (const id of card.frs) if (!acceptedFrs.includes(id)) commandError(`${card.phase}/${card.id} task card references unknown FR: ${id}`);
    for (const id of card.acs) if (!declaredAcs.includes(id)) commandError(`${card.phase}/${card.id} task card references unknown AC: ${id}`);
  }
  if (!design) errors.push("spec.md requires Implementation Design (全局权威)");
  for (const heading of ["Code Anchors", "Interfaces and Failure Semantics", "Requirement-to-Task Trace", "Global Verification Strategy"]) {
    if (!designBody[heading] || placeholderOrTemplateNoise(designBody[heading])) errors.push(`spec.md Implementation Design requires concrete ${heading}`);
  }
  if (designBody["Code Anchors"] && !/`[^`\n]*[/.][^`\n]*`/.test(designBody["Code Anchors"])) {
    errors.push("spec.md Code Anchors must identify a concrete path");
  }
  const traceRows = traceLines.filter((line) => /\b(?:R|U|PRD|CARD)-[A-Z0-9-]+\b/.test(line)
    && /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/.test(line)
    && identifiers(line, ACCEPTANCE_CRITERION_ID).length > 0
    && /\bP\d+\/T\d{3,}\b/.test(line)
    && /\bORACLE-[A-Z0-9-]+\b/.test(line));
  if (traceRows.length === 0) commandError("spec.md Requirement-to-Task Trace needs source → FR → AC → Phase/Task → oracle rows");
  for (const id of acceptedFrs) if (!traceRows.some((row) => row.includes(id))) errors.push(`spec.md Requirement-to-Task Trace is missing FR: ${id}`);
  for (const id of acceptedAcs) if (!traceRows.some((row) => row.includes(id))) errors.push(`spec.md Requirement-to-Task Trace is missing AC: ${id}`);
  for (const card of taskCards) {
    const factTrace = factTaskTraces.get(`${card.phase}/${card.id}`);
    const trace = factTrace ? [factTrace] : traceRows.filter((row) => row.includes(`${card.phase}/${card.id}`));
    if (trace.length === 0 || card.frs.some((id) => !trace.some((row) => row.includes(id)))
        || card.acs.some((id) => !trace.some((row) => row.includes(id)))) {
      errors.push(`spec.md Requirement-to-Task Trace is missing ${card.phase}/${card.id} FR/AC binding`);
    }
    const oracle = card.oracle?.match(/^ORACLE-[A-Z0-9-]+\b/)?.[0];
    if (oracle && !trace.some((row) => row.includes(oracle))) {
      commandError(`spec.md Requirement-to-Task Trace ${card.phase}/${card.id} oracle differs from task card`);
    }
  }
  if (designBody["Global Verification Strategy"] && !/`(?:npx|npm|pnpm|yarn|bun|node|python|pytest|go|cargo|make|bash|sh|git|\.\/)[^`\n]+`/.test(designBody["Global Verification Strategy"])) {
    errors.push("spec.md Global Verification Strategy requires a concrete command");
  }
  const coveredFrs = [...new Set(taskCards.flatMap((card) => card.frs))];
  const coveredAcs = [...new Set(taskCards.flatMap((card) => card.acs))].filter((id) => acceptedAcs.includes(id));
  for (const id of acceptedFrs) if (!coveredFrs.includes(id)) errors.push(`FR has no executable Phase task coverage: ${id}`);
  for (const id of acceptedAcs) if (!coveredAcs.includes(id)) errors.push(`AC has no executable Phase task coverage: ${id}`);
  if (acceptedFrs.length === 0 || acceptedAcs.length === 0) errors.push("spec.md requires accepted FR and AC definitions");
  const facts = Object.freeze({
    prose_mode: proseMode,
    field_gaps: Object.freeze(fieldGaps),
    card_prose_gaps: Object.freeze(cardProseGaps),
    write_set_reconciliation: reconcileWriteSetDiff({ phaseRows, phase_id, changeScope, reviewReadScope, selectedPhaseScopeValid }),
    phase_count: phaseRows.length,
    task_count: [...new Set(phaseRows.flatMap((row) => row.task_ids))].length,
    phase_rows: Object.freeze(phaseRows),
    material_sha256: materialFingerprint({ spec, index, phases }),
    readiness: Object.freeze({
      declared_count: readinessPhases.filter((phase) => phase.declared).length,
      machine_count: readinessPhases.reduce((sum, phase) => sum + phase.machine_count, 0),
      human_count: readinessPhases.reduce((sum, phase) => sum + phase.human_count, 0),
      phases: Object.freeze(readinessPhases),
    }),
    fr_coverage: Object.freeze({ accepted_count: acceptedFrs.length, covered_count: acceptedFrs.filter((id) => coveredFrs.includes(id)).length, accepted_ids: Object.freeze(acceptedFrs), covered_ids: Object.freeze(coveredFrs) }),
    ac_coverage: Object.freeze({ accepted_count: acceptedAcs.length, covered_count: acceptedAcs.filter((id) => coveredAcs.includes(id)).length, accepted_ids: Object.freeze(acceptedAcs), covered_ids: Object.freeze(coveredAcs), deferred_ids: Object.freeze(deferredAcs) }),
    dependency_validation: Object.freeze({ valid: dependencyValid }),
    command_oracle_checks: Object.freeze({ valid: taskCards.length > 0 && commandOracleValid }),
    evidence_paths: Object.freeze({
      verified: Object.freeze(evidenceFacts.verified),
      planned: Object.freeze(evidenceFacts.planned),
      missing: Object.freeze(evidenceFacts.missing),
      unverified: Object.freeze(evidenceFacts.unverified),
      verified_count: evidenceFacts.verified.length,
      planned_count: evidenceFacts.planned.length,
      missing_count: evidenceFacts.missing.length,
      unverified_count: evidenceFacts.unverified.length,
      // A gate can pass with an explicitly planned gap; this boolean tells the
      // two apart without turning the known gap into an error.
      all_verified: evidenceFacts.verified.length > 0
        && evidenceFacts.planned.length === 0
        && evidenceFacts.missing.length === 0
        && evidenceFacts.unverified.length === 0,
      archive_diagnostic: archiveMaterial,
    }),
    evidence_path_summary: `${evidenceFacts.verified.length} verified; ${evidenceFacts.planned.length} planned; ${evidenceFacts.missing.length} missing; ${evidenceFacts.unverified.length} unverified`,
    // The persisted per-criterion state: parsed once here, read (or recomputed
    // with the same pure function and fingerprint) by the material check, the
    // terminal chain and the delivery reader. The three faces never merge
    // their own card parser.
    ac_status: acceptanceStatusFact({ spec, phases, taskRecordRoot: task_record_root }),
  });
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), facts });
}

function acceptanceCriterionDispositions(spec) {
  const text = String(spec ?? "");
  // A spec may legitimately carry more than one section titled 验收标准: the
  // document's own summary card and the detailed acceptance list.  Matching
  // only the first heading silently narrowed the authoritative AC set to the
  // summary card, so collect every such section.  Sections are found by
  // heading rather than by number, because the summary card can sit before the
  // numbered body.
  const headingPattern = /^##\s+(?:\d+\.\s*)?(?:验收标准|验收清单(?:（AC）|\(AC\))?|Acceptance Criteria)\s*$/gmi;
  const sections = [];
  for (const match of text.matchAll(headingPattern)) {
    sections.push(text.slice(match.index + match[0].length).split(/^##\s+/m, 1)[0]);
  }
  const body = sections.length > 0 ? sections.join("\n") : text;
  const listEntries = [...body.matchAll(/^\s*[-*]\s*(?:\[[ xX]\]\s*)?\*\*([^*]+)\*\*([^\n]*)/gm)];
  const listIds = listEntries
    .map(([, label]) => label.trim().match(new RegExp(String.raw`^(${ACCEPTANCE_CRITERION_SOURCE})(?=$|[\s（(])`, "i"))?.[1])
    .filter(Boolean);
  // Acceptance criteria may also be declared as their own heading
  // (`#### AC-S3-01 <title>`).  Heading declarations carry no status suffix,
  // so the deferred markers below only apply to the list/table forms.
  const headingEntries = [...body.matchAll(/^#{1,6}\s+([^\n]*)$/gm)]
    .map(([, label]) => label.trim().match(new RegExp(String.raw`^(${ACCEPTANCE_CRITERION_SOURCE})(?=$|[\s（(])`, "i"))?.[1])
    .filter(Boolean);
  const tableEntries = [];
  const bodyLines = body.split(/\r?\n/);
  for (let index = 0; index < bodyLines.length;) {
    if (!/^\s*\|/.test(bodyLines[index])) { index += 1; continue; }
    const rows = [];
    while (index < bodyLines.length && /^\s*\|/.test(bodyLines[index])) {
      rows.push(analyzeMarkdownTableCells(bodyLines[index]));
      index += 1;
    }
    const header = rows[0] ?? [];
    const separatorOffset = rows[1]?.every((cell) => /^:?-{3,}:?$/.test(cell)) ? 2 : 1;
    const statusIndex = header.findIndex((cell) => /^(?:status|状态|disposition|处置|scope|计入状态)$/i.test(cell));
    for (const row of rows.slice(separatorOffset)) {
      const match = row[0]?.match(new RegExp(String.raw`^(${ACCEPTANCE_CRITERION_SOURCE})(?=$|[\s（(])(.*)$`, "i"));
      if (match) tableEntries.push({ id: match[1], titleSuffix: match[2], status: statusIndex >= 0 ? row[statusIndex] : null });
    }
  }
  const tableIds = tableEntries.map(({ id }) => id);
  const headingIds = [...listIds, ...headingEntries, ...tableIds];
  const explicitDeferredLabel = /^(?:(?:deferred|延期|不计入|not_applicable)|[[(（]\s*(?:deferred|延期|不计入|not_applicable)\s*[\])）])$/i;
  const explicitDeferredAnnotation = /^\s*[[(（]\s*(?:deferred|延期|不计入|not_applicable)\s*[\])）](?=$|[\s:：—–-])/i;
  // A disposition marker must lead the text immediately after the AC title;
  // a sentence that merely discusses "status: deferred" remains an active AC.
  const explicitMetadata = /^\s*(?:[（(【[]\s*)?(?:status|状态|disposition|处置|scope|计入状态)\s*[:=：]\s*(?:deferred|延期|不计入|not_applicable)(?=$|[\s）)】\].。,:：，;；—–-])/i;
  const inactiveIds = new Set();
  const deferredIds = new Set();
  for (const [, label, suffix] of listEntries) {
    const match = label.trim().match(new RegExp(String.raw`^(${ACCEPTANCE_CRITERION_SOURCE})(.*)$`, "i"));
    if (!match) continue;
    const annotation = suffix.trim().replace(/^[:：—–-]\s*/, "");
    if (explicitDeferredLabel.test(match[2].trim())
      || explicitDeferredAnnotation.test(annotation)
      || explicitMetadata.test(annotation)) {
      inactiveIds.add(match[1]);
      if (!/not_applicable/i.test(match[2])
          && !/(?:status|状态|disposition|处置|scope|计入状态)\s*[:=：]\s*not_applicable\b|^[\s:：—–-]*[[(（]\s*not_applicable\b/i.test(suffix)) deferredIds.add(match[1]);
    }
  }
  for (const entry of tableEntries) {
    if (explicitDeferredLabel.test(entry.titleSuffix.trim()) || /^(?:deferred|延期|不计入|not_applicable)$/i.test(entry.status ?? "")) {
      inactiveIds.add(entry.id);
      if (!/not_applicable/i.test(entry.titleSuffix) && !/^not_applicable$/i.test(entry.status ?? "")) deferredIds.add(entry.id);
    }
  }
  return {
    active_ids: [...new Set(headingIds.length ? headingIds : identifiers(text, ACCEPTANCE_CRITERION_ID))]
      .filter((id) => !inactiveIds.has(id)),
    deferred_ids: [...deferredIds],
  };
}

export { CURRENT_MATERIAL_FILES as MATERIAL_FILES } from "../task/material-workspace.mjs";
