// Current post Phase and ordinary decision-log text contracts.
// Pure facts only: no retired appendices, hash-bound identities or stage-completion machines.
import { statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const ACCEPTANCE_CRITERION_SOURCE = String.raw`AC(?:\d{1,3}|-\d{1,3}|(?:-[A-Z][A-Z0-9]*)+-\d{1,3})`;

const ACCEPTANCE_CRITERION_ID = new RegExp(String.raw`\b${ACCEPTANCE_CRITERION_SOURCE}\b`, "g");

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function markdownSectionBody(markdown, headingPattern) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  let latest = null;
  for (let start = 0; start < lines.length; start += 1) {
    const heading = lines[start].match(/^(#{1,3})(?:\s+|$)(.+?)\s*$/);
    if (!heading || !headingPattern.test(heading[2])) continue;
    const body = [];
    for (let index = start + 1; index < lines.length; index += 1) {
      const nextHeading = lines[index].match(/^(#{1,3})\s+/);
      if (nextHeading && nextHeading[1].length <= heading[1].length) break;
      body.push(lines[index]);
    }
    latest = body.join("\n");
  }
  return latest;
}

const TASK_TYPES = new Set(["规划任务", "普通任务"]);

function cleanTaskTypeValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\*+|\*+$/g, "")
    .replace(/^`+|`+$/g, "")
    .trim();
}

export function readTaskTypeFromDecisionLog(decisionLogMarkdown) {
  const text = String(decisionLogMarkdown ?? "");
  const lines = text.split(/\r?\n/);
  const identityHeading = /^(?:任务身份|task identity)$/i;
  const identityHeadings = lines.filter((line) => {
    const match = line.match(/^#{1,3}(?:\s+|$)(.+?)\s*$/);
    return match && identityHeading.test(match[1]);
  });
  if (identityHeadings.length !== 1) return "unknown";

  const body = markdownSectionBody(text, identityHeading);
  if (body === null) return "unknown";
  const declarations = [];
  let fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    if (/^\s*\|/.test(line)) {
      const cells = line.split("|")
        .map((cell) => cell.trim())
        .filter((cell, index, all) => !(index === 0 && cell === "") && !(index === all.length - 1 && cell === ""));
      if (/^任务类型$/i.test(cleanTaskTypeValue(cells[0])) && cells.length >= 2) {
        declarations.push(cleanTaskTypeValue(cells[1]));
      }
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+\*\*任务类型\*\*\s*[:：]\s*(.*?)\s*$/i);
    if (bullet) declarations.push(cleanTaskTypeValue(bullet[1]));
  }

  if (declarations.length !== 1 || !TASK_TYPES.has(declarations[0])) return "unknown";
  return declarations[0];
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

function declaredEvidencePaths(value) {
  const text = String(value ?? "").trim();
  const spans = inlinePaths(text);
  const candidates = spans.length > 0 ? spans : [text.replace(/[（(][\s\S]*$/, "").trim()];
  return [...new Set(candidates
    .map((token) => token.replace(/^\s*(?:`+\s*)?planned\s*[:：]\s*/i, "").trim())
    .filter((token) => token !== "" && !/\s/.test(token) && /[/\\.]/.test(token)))];
}

function checkEvidencePath(token, roots) {
  if (isAbsolute(token)) {
    try {
      return statSync(token).isFile()
        ? Object.freeze({ status: "verified", resolved: token })
        : Object.freeze({ status: "missing", reason: "not a regular file" });
    } catch (error) {
      return Object.freeze({ status: "missing", reason: error.code ?? error.message });
    }
  }
  for (const root of roots) {
    const candidate = resolve(root, token);
    try {
      if (statSync(candidate).isFile()) return Object.freeze({ status: "verified", resolved: candidate });
    } catch { /* keep searching the remaining declared roots */ }
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
    if (paths.length === 0 && !explicitNone) rowErrors.push("write set is empty");
    if (EMPTY_WRITE_SET_PREFIX.test(cells[3].trim()) && !explicitNone) rowErrors.push("none write set declaration is invalid");
    for (const path of paths) if (unsafeWritePath(path, reviewReadScope)) rowErrors.push(`unsafe write set path: ${path}`);
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

function phaseTaskCards(body) {
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

export function validatePostPhaseContract({ spec, index, phases, reviewReadScope, changeScope, phase_id, prose_contract, material_path } = {}) {
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
  const archiveMaterial = /(?:^|[/\\])archive(?:[/\\]|$)/.test(material_path ?? "");
  const evidenceRoots = readableEvidenceRoots(evidenceSearchRoots(reviewReadScope, material_path));
  const evidenceFacts = { verified: [], planned: [], missing: [], unverified: [] };
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
    const declaredWriteSet = phaseWriteSet(body);
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
    const explicitNone = EXPLICIT_EMPTY_WRITE_SET.test(declaration ?? "");
    if (EMPTY_WRITE_SET_PREFIX.test(declaration ?? "") && !explicitNone) {
      errors.push(`${expectedPath} Write set none declaration is invalid`);
      scopeValid = false;
    }
    if (declaredWriteSet.length === 0 && !(explicitNone && row.write_set.length === 0)) {
      errors.push(`${expectedPath} Write set is missing`);
      scopeValid = false;
    }
    for (const path of declaredWriteSet) if (unsafeWritePath(path, reviewReadScope)) {
      errors.push(`${expectedPath} unsafe Write set path: ${path}`);
      scopeValid = false;
    }
    const sourceIdentity = path => writePathIdentity(path, reviewReadScope);
    if (!sameIds(new Set(declaredWriteSet.map(sourceIdentity)), new Set(row.write_set.map(sourceIdentity)))) {
      errors.push(`${expectedPath} write set differs from Phase index`);
      scopeValid = false;
    }
    for (const path of declaredWriteSet) {
      if (isSharedGovernancePath(path)) continue;
      const identity = sourceIdentity(path);
      const owners = writeOwners.get(identity) ?? [];
      const owner = owners.find((ref) => !serializedPair(ref, expectedPath));
      if (owner) errors.push(`${expectedPath} write set duplicates ${path} owned by ${owner}`);
      writeOwners.set(identity, [...owners, expectedPath]);
    }
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
      const [plannedPath = evidenceValue] = declaredEvidencePaths(evidenceValue);
      evidenceFacts.planned.push(Object.freeze({
        phase_id: expectedId, path: plannedPath, statement: evidenceValue,
      }));
    } else {
      const declaredPaths = declaredEvidencePaths(evidenceValue);
      if (declaredPaths.length === 0) {
        evidenceFacts.unverified.push(Object.freeze({
          phase_id: expectedId, path: null,
          reason: "evidence_path declares no concrete path", statement: evidenceValue,
        }));
      }
      for (const token of declaredPaths) {
        if (!isAbsolute(token) && evidenceRoots.length === 0) {
          evidenceFacts.unverified.push(Object.freeze({
            phase_id: expectedId, path: token,
            reason: "no readable material, repository, or task root",
          }));
          continue;
        }
        const checked = checkEvidencePath(token, evidenceRoots);
        if (checked.status === "verified") {
          evidenceFacts.verified.push(Object.freeze({
            phase_id: expectedId, path: token, resolved: checked.resolved,
          }));
          continue;
        }
        if (archiveMaterial) {
          // Archived material is historical: prose already accepts diagnostic
          // mode there, and a missing old path must not become a new gate.
          evidenceFacts.unverified.push(Object.freeze({
            phase_id: expectedId, path: token,
            reason: "archive material keeps historical evidence out of the current gate",
          }));
          continue;
        }
        evidenceFacts.missing.push(Object.freeze({ phase_id: expectedId, path: token }));
        const searched = isAbsolute(token)
          ? "absolute path checked directly"
          : `searched roots: ${evidenceRoots.join(", ")}`;
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
      if (!readOnlyTask && (filePaths.length === 0 || filePaths.some((path) => !declaredWriteSet.some(owned => sourceIdentity(owned) === sourceIdentity(path))))) {
        errors.push(`${expectedPath} ${taskId} Files / symbols must name owned write-set paths`);
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
  const declaredAcs = [...new Set([...spec.matchAll(new RegExp(String.raw`^-\s+(?:\[[ xX]\]\s+)?\*\*(${ACCEPTANCE_CRITERION_SOURCE})\b`, "gm"))].map((match) => match[1]))];
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
