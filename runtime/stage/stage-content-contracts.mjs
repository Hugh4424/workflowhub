// Current post Phase and ordinary decision-log text contracts.
// Pure facts only: no retired appendices, hash-bound identities or stage-completion machines.

import yaml from "js-yaml";

const ACCEPTANCE_CRITERION_SOURCE = String.raw`AC(?:\d{1,3}|-\d{1,3}|(?:-[A-Z][A-Z0-9]*)+-\d{1,3})`;

const ACCEPTANCE_CRITERION_ID = new RegExp(String.raw`\b${ACCEPTANCE_CRITERION_SOURCE}\b`, "g");

export const DECISION_OUTLINE_FRAMEWORK_NODES = Object.freeze([
  "background", "problem", "goal", "solution", "acceptance", "extension",
]);

export const DECISION_OUTLINE_FIXED_CATEGORIES = Object.freeze([
  "complete_user_flow", "page_scope", "data_state", "success_failure_boundary", "non_goals", "deferred",
]);

const OI_STATUSES = new Set(["open", "confirmed", "deferred", "not_applicable"]);

const OI_IMPACT_DIMENSIONS = new Set(["goal", "scope", "acceptance", "ordinary_detail"]);

function result(errors, extras = {}) {
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), ...extras });
}

function object(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export const UI_APPLICABILITY_INPUTS = Object.freeze([
  "raw_requirement",
  "project_inventory",
  "planned_or_changed_frontend_fact",
]);

export const UI_APPLICABILITY_RESULTS = Object.freeze(["ui", "non_ui", "unknown"]);

const MISSING_FACT_STATUSES = new Set(["unknown", "unavailable", "not_applicable", "n/a", "na"]);

const UNKNOWN_LITERAL = /^(?:unknown|unavailable|n\/a|na)$/i;

const explicitFact = (value) => (nonEmptyString(value) && !UNKNOWN_LITERAL.test(value.trim()))
  || (object(value) && (
    nonEmptyString(value.value)
    || nonEmptyString(value.ref)
    || nonEmptyString(value.path)
    || nonEmptyString(value.reason)
    || (MISSING_FACT_STATUSES.has(String(value.status ?? "").toLowerCase()) && nonEmptyString(value.reason))
  ));

function factText(value) {
  if (typeof value === "string") return value;
  if (!object(value)) return "";
  return [value.signal, value.kind, value.type, value.name, value.title, value.description, value.value]
    .filter((entry) => typeof entry === "string")
    .join(" ");
}

function sourceConclusion(value) {
  if (object(value)) {
    const declared = [value.result, value.conclusion, value.applicability, value.ui_applicability, value.scope]
      .filter((entry) => UI_APPLICABILITY_RESULTS.includes(entry));
    const booleanSignals = [
      value.ui === true || value.is_ui === true || value.frontend === true ? "ui" : null,
      value.ui === false || value.is_ui === false || value.frontend === false ? "non_ui" : null,
    ].filter(Boolean);
    const signals = new Set([...declared, ...booleanSignals]);
    if (signals.has("ui") && signals.has("non_ui")) return "conflict";
    if (declared.length > 0) return declared[0];
    if (booleanSignals[0]) return booleanSignals[0];
  }
  const text = factText(value).toLowerCase();
  if (!text) return "unknown";
  if (UI_APPLICABILITY_RESULTS.includes(text.trim())) return text.trim();
  if (/(?:non[-_ ]?ui|backend[-_ ]?only|api[-_ ]?only|cli[-_ ]?only|command[-_ ]?line[-_ ]?only|docs?[-_ ]?only|no (?:page|screen|frontend|ui))/.test(text)) {
    return "non_ui";
  }
  if (/(?:\bui\b|frontend|front[-_ ]?end|page|screen|route|component|css|design|browser)/.test(text)) {
    return "ui";
  }
  return "unknown";
}

export function validateUiApplicability(value) {
  const errors = [];
  if (!object(value)) return result(["ui applicability must be an object"]);
  const declared = value.result ?? value.conclusion;
  if (!UI_APPLICABILITY_RESULTS.includes(declared)) {
    errors.push("ui applicability result must be ui, non_ui, or unknown");
  }
  const sources = value.sources ?? value.source_facts;
  if (!object(sources) && !Array.isArray(sources)) errors.push("ui applicability must retain the three source facts");
  const sourceValues = UI_APPLICABILITY_INPUTS.map((input) => {
    if (object(sources)) return sources[input];
    if (Array.isArray(sources)) {
      const entry = sources.find((candidate) => candidate?.name === input || candidate?.input === input);
      return entry?.value ?? entry?.fact ?? entry;
    }
    return undefined;
  });
  for (const input of UI_APPLICABILITY_INPUTS) {
    if (object(sources) && !Object.prototype.hasOwnProperty.call(sources, input)) errors.push(`ui applicability source missing ${input}`);
    if (Array.isArray(sources) && !sources.some((entry) => entry?.name === input || entry?.input === input)) errors.push(`ui applicability source missing ${input}`);
  }
  const sourceResults = sourceValues.map(sourceConclusion);
  const hasUi = sourceResults.includes("ui");
  const hasNonUi = sourceResults.includes("non_ui");
  const hasConflict = sourceResults.includes("conflict");
  const derived = hasConflict || (hasUi && hasNonUi)
    ? "unknown"
    : hasUi
      ? "ui"
      : sourceResults.every((entry) => entry === "non_ui")
        ? "non_ui"
        : "unknown";
  if (declared !== derived) {
    errors.push(`ui applicability result ${declared ?? "missing"} conflicts with derived ${derived}`);
  }
  if (derived === "unknown") {
    if (!nonEmptyString(value.reason) && !nonEmptyString(value.unknown_reason)
      && !(Array.isArray(value.source_reasons) && value.source_reasons.some((reason) => explicitFact(reason)))) {
      errors.push("unknown ui applicability requires source reasons");
    }
    if (!nonEmptyString(value.handoff) || !/make-decision/i.test(value.handoff)) errors.push("unknown ui applicability requires a make-decision handoff");
  }
  if (value.gate === true || value.is_gate === true) errors.push("ui applicability must not become a gate");
  return result(errors, { derived_result: derived, source_results: Object.freeze(sourceResults) });
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function parseCoverageRows(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const rows = [];
  let inCoverage = false;
  for (const line of lines) {
    if (/^#{1,3}\s*(?:原始需求|requirement|来源与决策映射|需求→决定|需求矩阵)/i.test(line)) inCoverage = true;
    if (inCoverage && /^#{1,3}\s+/.test(line) && !/^#{1,3}\s*(?:原始需求|requirement|来源与决策映射|需求→决定|需求矩阵)/i.test(line)) break;
    if (inCoverage && /^\s*\|/.test(line)) {
      const cells = line.split("|").map((cell) => cell.trim()).filter((cell) => cell !== "");
      if (cells.length >= 3 && !/^[-:]+$/.test(cells[0])) rows.push(cells);
    }
  }
  return rows;
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

function explicitUiQuestion(value) {
  const question = value?.user_question ?? value?.question ?? value?.talk_question;
  if (nonEmptyString(question)) return true;
  return object(question) && [question.prompt, question.text, question.question]
    .some((candidate) => nonEmptyString(candidate));
}

export function readUiApplicabilityFromDecisionLog(decisionLogMarkdown) {
  const body = markdownSectionBody(decisionLogMarkdown, /^(?:UI applicability|UI 判定|界面判定)$/i);
  if (body === null) {
    return Object.freeze({
      status: "missing", applicability: "unknown", value: null,
      errors: Object.freeze(["decision-log is missing the UI applicability fact"]),
      missing_items: Object.freeze([
        "UI applicability is missing: record the three input facts in decision-log.md",
        "UI applicability is missing: ask the user whether this task changes a page, interaction, or frontend component",
      ]),
    });
  }
  const jsonBlocks = [...body.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/gi)];
  if (jsonBlocks.length !== 1) {
    return Object.freeze({
      status: "missing", applicability: "unknown", value: null,
      errors: Object.freeze([`UI applicability section must contain exactly one JSON fact; found ${jsonBlocks.length}`]),
      missing_items: Object.freeze(["UI applicability is missing: record exactly one JSON fact with all three inputs"]),
    });
  }
  let value;
  try {
    value = JSON.parse(jsonBlocks[0][1]);
  } catch (error) {
    return Object.freeze({
      status: "missing", applicability: "unknown", value: null,
      errors: Object.freeze([`UI applicability JSON is invalid: ${error.message}`]),
      missing_items: Object.freeze(["UI applicability is missing: repair the decision-log JSON fact"]),
    });
  }
  const validation = validateUiApplicability(value);
  const applicability = value?.result ?? value?.conclusion ?? "unknown";
  const errors = [...validation.errors];
  const missingItems = validation.errors.map((error) => `UI applicability: ${error}`);
  if (validation.ok && applicability === "unknown") {
    if (!explicitUiQuestion(value)) {
      errors.push("unknown UI applicability must record the real user question");
      missingItems.push("UI applicability is unknown: ask the user whether this task changes a page, interaction, or frontend component");
    }
    errors.push("unknown UI applicability requires a user reply/ruling and updated source facts");
    missingItems.push("UI applicability is unknown: preserve the user reply/ruling, update the source fact it resolves, and recompute");
  }
  return Object.freeze({
    status: validation.ok && applicability !== "unknown" ? "recorded" : "missing",
    applicability: UI_APPLICABILITY_RESULTS.includes(applicability) ? applicability : "unknown",
    value,
    errors: Object.freeze(errors),
    missing_items: Object.freeze([...new Set(missingItems)]),
  });
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

function parseConvergenceRows(body) {
  const rows = body.split(/\r?\n/)
    .filter((line) => /^\s*\|/.test(line))
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      if (cells[0] === "") cells.shift();
      if (cells.at(-1) === "") cells.pop();
      return cells;
    })
    .filter((cells) => cells.length >= 4 && !cells.every((cell) => /^[-: ]+$/.test(cell)));
  return rows.length === 0 ? { columns: null, rows: [] } : { columns: rows[0].map((value) => value.toLowerCase()), rows: rows.slice(1) };
}

function markdownTables(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!/^\s*\|/.test(lines[index]) || !/^\s*\|?\s*:?-{2,}/.test(lines[index + 1])) continue;
    const parse = (line) => line.split("|").map((cell) => cell.trim()).filter((cell, position, cells) => !(position === 0 && cell === "") && !(position === cells.length - 1 && cell === ""));
    const headers = parse(lines[index]).map((value) => value.toLowerCase());
    const rows = [];
    for (let row = index + 2; row < lines.length && /^\s*\|/.test(lines[row]); row += 1) rows.push(parse(lines[row]));
    tables.push({ headers, rows, start: index });
    index += rows.length + 1;
  }
  return tables;
}

function tableColumn(headers, names) {
  return headers.findIndex((header) => names.some((name) => header === name || header.includes(name)));
}

function splitOiIds(value) {
  return [...new Set(String(value ?? "").split(/[\s,，、;；|]+/).map((item) => item.trim()).filter((item) => /^OI-[A-Za-z0-9][A-Za-z0-9_-]*$/i.test(item)))];
}

function parseBoolean(value) {
  if (value === true || value === false) return value;
  if (/^(?:true|yes|是)$/i.test(String(value ?? "").trim())) return true;
  if (/^(?:false|no|否)$/i.test(String(value ?? "").trim())) return false;
  return null;
}

function parseOiYamlBlocks(markdown) {
  const records = [];
  for (const match of String(markdown ?? "").matchAll(/```(?:ya?ml|json)\s*\n([\s\S]*?)```/gi)) {
    let value;
    try { value = /^\s*\{/.test(match[1]) ? JSON.parse(match[1]) : yaml.load(match[1]); } catch { continue; }
    const entries = Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray(value.ois) ? value.ois : [value];
    for (const entry of entries) {
      if (entry && typeof entry === "object" && !Array.isArray(entry) && (entry.oi_id || entry.id)) records.push(entry);
    }
  }
  return records;
}

function substantiveOutlineValue(value) {
  return substantiveConvergenceText(value)
    && !/^(?:none|nil|n\/a|na|无|无内容|暂无|待定|tbd|todo|unknown|未知|占位|placeholder)$/i.test(String(value).trim());
}

function outlineTerminalField(value, ...keys) {
  for (const key of keys) {
    const candidate = value?.[key];
    if (Array.isArray(candidate) && candidate.length > 0) return candidate.join("; ");
    if (substantiveOutlineValue(candidate)) return candidate;
  }
  return null;
}

function deriveQuestionsOnlyOutline(byId, outlineVersion, recordTaskId) {
  if (!byId || byId.size === 0) return null;
  const entries = [...byId.values()].map((record) => ({
    oi_id: record.oi_id ?? record.id,
    category: record.category,
    source: record.source,
    question: record.question,
    status: "open",
  }));
  return { task_id: recordTaskId, outline_version: outlineVersion, entries };
}

function normalizeOutlineReview(review) {
  if (!review || typeof review !== "object") return null;
  const candidates = [review.convergence_outline, review.materials?.convergence_outline, review.semantic_fields?.convergence_outline, review.value?.convergence_outline, review.value?.materials?.convergence_outline];
  const outline = candidates.find((candidate) => candidate && typeof candidate === "object");
  if (!outline) return null;
  const entries = outline.entries ?? outline.items ?? outline.ois ?? outline.records;
  return {
    ...outline,
    // Existing review packets put identity either beside or inside the
    // semantic field.  Normalize both forms without creating a second
    // persisted projection; the field remains the sole authority.
    task_id: outline.task_id ?? review.task_id,
    outline_version: outline.outline_version ?? review.outline_version,
    entries: Array.isArray(entries) ? entries : [],
  };
}

export function analyzeDecisionOutline(decisionLogMarkdown, {
  taskId = null,
  directionReview = null,
} = {}) {
  const text = String(decisionLogMarkdown ?? "");
  const errors = [];
  const tables = markdownTables(text);
  const frameworkTable = tables.find(({ headers }) => tableColumn(headers, ["framework_node"]) >= 0 && tableColumn(headers, ["oi_ids"]) >= 0);
  const categoryTable = tables.find(({ headers }) => tableColumn(headers, ["category"]) >= 0 && tableColumn(headers, ["oi_ids"]) >= 0);
  const frameworkRows = frameworkTable?.rows ?? [];
  const categoryRows = categoryTable?.rows ?? [];
  const nodeColumn = frameworkTable ? tableColumn(frameworkTable.headers, ["framework_node"]) : -1;
  const nodeOiColumn = frameworkTable ? tableColumn(frameworkTable.headers, ["oi_ids"]) : -1;
  const nodeEmptyColumn = frameworkTable ? tableColumn(frameworkTable.headers, ["empty"]) : -1;
  const nodeReasonColumn = frameworkTable ? tableColumn(frameworkTable.headers, ["reason"]) : -1;
  const categoryColumn = categoryTable ? tableColumn(categoryTable.headers, ["category"]) : -1;
  const categoryOiColumn = categoryTable ? tableColumn(categoryTable.headers, ["oi_ids"]) : -1;
  const categoryEmptyColumn = categoryTable ? tableColumn(categoryTable.headers, ["empty"]) : -1;
  const categoryReasonColumn = categoryTable ? tableColumn(categoryTable.headers, ["reason"]) : -1;
  const frameworkMap = new Map();
  const categoryMap = new Map();
  const parseCoverageRow = (row, oiIndex, emptyIndex, reasonIndex, label) => {
    const ids = splitOiIds(row[oiIndex]);
    const empty = parseBoolean(row[emptyIndex]);
    const reason = row[reasonIndex] ?? "";
    if (empty === true && !substantiveOutlineValue(reason)) errors.push(`${label} empty row requires a concrete reason`);
    if (empty !== true && ids.length === 0) errors.push(`${label} must reference an OI or declare empty: true`);
    if (empty === true && ids.length > 0) errors.push(`${label} cannot combine OI IDs with empty: true`);
    return { oi_ids: ids, empty, reason };
  };
  for (const row of frameworkRows) {
    const node = String(row[nodeColumn] ?? "").trim().toLowerCase();
    if (!DECISION_OUTLINE_FRAMEWORK_NODES.includes(node)) continue;
    if (frameworkMap.has(node)) errors.push(`framework node ${node} is duplicated`);
    frameworkMap.set(node, parseCoverageRow(row, nodeOiColumn, nodeEmptyColumn, nodeReasonColumn, `framework node ${node}`));
  }
  for (const row of categoryRows) {
    const category = String(row[categoryColumn] ?? "").trim().toLowerCase();
    if (!DECISION_OUTLINE_FIXED_CATEGORIES.includes(category)) continue;
    if (categoryMap.has(category)) errors.push(`fixed category ${category} is duplicated`);
    categoryMap.set(category, parseCoverageRow(row, categoryOiColumn, categoryEmptyColumn, categoryReasonColumn, `fixed category ${category}`));
  }
  if (!frameworkTable) errors.push("decision-log is missing the framework node OI table");
  if (!categoryTable) errors.push("decision-log is missing the fixed category OI table");
  for (const node of DECISION_OUTLINE_FRAMEWORK_NODES) if (!frameworkMap.has(node)) errors.push(`framework node ${node} is missing`);
  for (const category of DECISION_OUTLINE_FIXED_CATEGORIES) if (!categoryMap.has(category)) errors.push(`fixed category ${category} is missing`);

  const records = parseOiYamlBlocks(text);
  const byId = new Map();
  for (const raw of records) {
    const record = { ...raw, oi_id: raw.oi_id ?? raw.id };
    if (!/^OI-[A-Za-z0-9][A-Za-z0-9_-]*$/i.test(record.oi_id ?? "")) { errors.push("OI record id is invalid"); continue; }
    if (byId.has(record.oi_id)) { errors.push(`OI ${record.oi_id} is duplicated`); continue; }
    byId.set(record.oi_id, record);
  }
  const referenced = new Set([...frameworkMap.values(), ...categoryMap.values()].flatMap((row) => row.oi_ids));
  for (const id of referenced) if (!byId.has(id)) errors.push(`outline reference ${id} has no OI record`);
  for (const id of byId.keys()) if (!referenced.has(id)) errors.push(`OI ${id} is not referenced by a framework node or fixed category`);
  const first = [...byId.values()][0] ?? {};
  const outlineVersion = first.outline_version ?? first.version ?? null;
  const recordTaskId = first.task_id ?? null;
  if (taskId !== null && recordTaskId !== taskId) errors.push("OI task_id does not bind the current task");
  if (!substantiveOutlineValue(outlineVersion)) errors.push("OI outline_version is required");
  for (const [id, record] of byId.entries()) {
    const version = record.outline_version ?? record.version ?? null;
    if (record.task_id !== recordTaskId) errors.push(`OI ${id} task_id is inconsistent with the current outline`);
    if (version !== outlineVersion) errors.push(`OI ${id} outline_version is inconsistent with the current outline`);
  }
  let openCount = 0;
  for (const [id, record] of byId.entries()) {
    const status = String(record.status ?? "").trim().toLowerCase();
    const category = String(record.category ?? "").trim().toLowerCase();
    if (!DECISION_OUTLINE_FIXED_CATEGORIES.includes(category)) errors.push(`OI ${id} category is invalid`);
    for (const [field, label] of [["source", "source"], ["question", "question"]]) if (!substantiveOutlineValue(record[field])) errors.push(`OI ${id} ${label} is missing`);
    if (!OI_STATUSES.has(status)) { errors.push(`OI ${id} status is invalid`); continue; }
    if (status === "open") { openCount += 1; continue; }
    const impact = Array.isArray(record.impact_dimensions) ? record.impact_dimensions : [];
    if (impact.length === 0 || impact.some((item) => !OI_IMPACT_DIMENSIONS.has(item))) errors.push(`OI ${id} impact_dimensions is invalid`);
    const requiresUser = record.requires_user_decision === true;
    const core = impact.some((item) => ["goal", "scope", "acceptance"].includes(item));
    if (core && !requiresUser) errors.push(`OI ${id} core impact requires_user_decision=true`);
    const group = record.visible_group_id ?? record.batch_id;
    if (requiresUser && !substantiveOutlineValue(group)) errors.push(`OI ${id} visible_group_id or batch_id is required`);
    if (status === "confirmed") {
      for (const [label, keys] of [["selected_disposition", ["selected_disposition"]], ["evidence", ["evidence", "evidence_ref", "evidence_refs", "basis"]], ["acceptance", ["acceptance", "acceptance_criterion", "falsifiable_acceptance"]], ["counterexample", ["counterexample", "counterexample_boundary"]]]) {
        if (!outlineTerminalField(record, ...keys)) errors.push(`OI ${id} confirmed ${label} is missing`);
      }
    } else if (status === "deferred") {
      for (const [label, keys] of [["owner", ["owner"]], ["trigger", ["trigger", "trigger_condition"]], ["scope", ["scope", "scope_boundary"]], ["impact", ["impact"]], ["follow_up_acceptance", ["follow_up_acceptance", "follow_up", "next_acceptance"]]]) {
        if (!outlineTerminalField(record, ...keys)) errors.push(`OI ${id} deferred ${label} is missing`);
      }
      if (!requiresUser) errors.push(`OI ${id} deferred item requires user decision`);
    } else if (status === "not_applicable") {
      if (!outlineTerminalField(record, "reason")) errors.push(`OI ${id} not_applicable reason is missing`);
      if (!outlineTerminalField(record, "counterexample_boundary", "counterexample")) errors.push(`OI ${id} not_applicable counterexample boundary is missing`);
    }
  }
  const direction = normalizeOutlineReview(directionReview) ?? deriveQuestionsOnlyOutline(byId, outlineVersion, taskId ?? recordTaskId);
  let directionCurrent = false;
  if (!direction) errors.push("direction review is missing current convergence_outline questions-only snapshot");
  else {
    const entries = direction.entries;
    const ids = entries.map((entry) => entry?.oi_id ?? entry?.id);
    const expectedIds = [...byId.keys()];
    const allowedDirectionEntryFields = new Set(["oi_id", "id", "category", "source", "question", "status"]);
    const sameIds = ids.length === expectedIds.length && expectedIds.every((id) => ids.filter((candidate) => candidate === id).length === 1);
    if (direction.task_id !== (taskId ?? recordTaskId) || direction.outline_version !== outlineVersion) errors.push("direction convergence_outline task/version is stale or mismatched");
    if (!sameIds) errors.push("direction convergence_outline does not cover every current OI exactly once");
    for (const entry of entries) {
      const entryId = entry?.oi_id ?? entry?.id ?? "unknown";
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push(`direction convergence_outline ${entryId} must be an object`);
        continue;
      }
      const unknownFields = Object.keys(entry).filter((key) => !allowedDirectionEntryFields.has(key));
      if (unknownFields.length > 0) errors.push(`direction convergence_outline ${entryId} contains unsupported fields: ${unknownFields.join(", ")}`);
      const source = byId.get(entry?.oi_id ?? entry?.id);
      if (source && (entry.category !== source.category || entry.source !== source.source || entry.question !== source.question)) errors.push(`direction convergence_outline ${entry?.oi_id ?? entry?.id ?? "unknown"} does not match the current OI question/source/category`);
      if (entry?.status !== "open") errors.push(`direction convergence_outline ${entry?.oi_id ?? entry?.id ?? "unknown"} must expose status open`);
      for (const forbidden of ["answer", "selected_disposition", "disposition", "evidence", "conclusion", "proposed_answer", "interaction_ref", "interaction_hash"]) if (Object.hasOwn(entry ?? {}, forbidden)) errors.push(`direction convergence_outline leaks ${forbidden}`);
    }
    const directionEntriesValid = entries.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
      const source = byId.get(entry.oi_id ?? entry.id);
      return Object.keys(entry).every((key) => allowedDirectionEntryFields.has(key))
        && entry.status === "open"
        && source
        && entry.category === source.category
        && entry.source === source.source
        && entry.question === source.question;
    });
    directionCurrent = sameIds
      && direction.task_id === (taskId ?? recordTaskId)
      && direction.outline_version === outlineVersion
      && directionEntriesValid;
  }
  const structure = frameworkMap.size === DECISION_OUTLINE_FRAMEWORK_NODES.length && categoryMap.size === DECISION_OUTLINE_FIXED_CATEGORIES.length && byId.size > 0 && errors.every((error) => !/(framework node|fixed category|OI record|outline reference|OI .* category|OI .* source|OI .* question)/i.test(error));
  const components = {
    structure: structure ? "passed" : "missing",
    direction_snapshot: directionCurrent ? "passed" : "missing",
    no_open_items: openCount === 0 && byId.size > 0 ? "passed" : "missing",
    terminal_fields: errors.every((error) => !/confirmed|deferred|not_applicable|status is invalid|impact_dimensions/i.test(error)) ? "passed" : "missing",
  };
  const ok = Object.values(components).every((status) => status === "passed") && errors.length === 0;
  return Object.freeze({
    ok,
    errors: Object.freeze([...new Set(errors)]),
    facts: Object.freeze({ outline_closed: ok ? "passed" : "missing" }),
    components: Object.freeze(components),
    outline_version: outlineVersion,
    task_id: recordTaskId,
    oi_ids: Object.freeze([...byId.keys()]),
    oi_records: Object.freeze([...byId.values()].map((record) => Object.freeze({
      oi_id: record.oi_id ?? record.id,
      category: record.category,
      source: record.source,
      question: record.question,
    }))),
    open_items: Object.freeze([...byId.values()].filter((record) => record.status === "open").map((record) => record.oi_id)),
  });
}

function convergenceDimension(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (/^(?:目标|goal|target)$/.test(normalized)) return "goal";
  if (/^(?:范围|scope)$/.test(normalized)) return "scope";
  if (/^(?:方案|solution|direction)$/.test(normalized)) return "solution";
  if (/^(?:验收|acceptance)$/.test(normalized)) return "acceptance";
  return null;
}

function substantiveConvergenceText(value) {
  const text = String(value ?? "").trim();
  return text.length > 1
    && !/^(?:n\/?a|none|无|未知|unknown|tbd|todo|待定|待确认|未回答|缺失|-)$/i.test(text)
    && !/(?:未回答|待确认|待定|\btbd\b|\btodo\b|未知|\bunknown\b|缺失)/i.test(text);
}

function recordedUserAnswer(value) {
  const text = String(value ?? "").trim();
  if (!substantiveConvergenceText(text)) return false;
  if (/无新需求|no_new_requirement/i.test(text)) return true;
  if (!/(?:用户|user)/i.test(text)) return false;
  const answer = text.replace(/(?:用户|user)\s*(?:(?:已)?(?:确认|回答|答复|选择|回复|confirmed|answered|replied|selected))?/gi, "").trim();
  return substantiveConvergenceText(answer);
}

function concreteMaterialReference(value) {
  const text = String(value ?? "").trim();
  return substantiveConvergenceText(text)
    && /(?:\b(?:R|D|F|FR|AC|PFACT)-?[A-Za-z0-9][A-Za-z0-9_-]*\b|(?:decision-log|spec|plan|tasks)\.md(?:[:#][^\s]+)?)/i.test(text);
}

function labelledSubstantiveValue(text, label) {
  const match = new RegExp(`${label}\\s*(?:[:：=]|是)?\\s*([^；;。\\n]+)`, "i").exec(String(text ?? ""));
  return match !== null && substantiveConvergenceText(match[1]);
}

function structuredConvergenceFacts(decisionLogMarkdown) {
  const body = markdownSectionBody(decisionLogMarkdown, /^(?:收敛检查|convergence check)$/i);
  const hasCurrentUiFact = markdownSectionBody(decisionLogMarkdown, /^(?:UI applicability|UI 判定|界面判定)$/i) !== null;
  const emptyFacts = { goal: false, scope: false, solution: false, acceptance: false };
  if (body === null) {
    return hasCurrentUiFact
      ? { present: true, facts: emptyFacts, errors: ["current decision-log with UI applicability must contain its four-dimension convergence table"] }
      : { present: false, facts: {}, errors: [] };
  }
  const { columns, rows } = parseConvergenceRows(body);
  if (!columns) return { present: true, facts: emptyFacts, errors: ["decision convergence check must contain its four-dimension table"] };
  const indexFor = (names) => columns.findIndex((column) => names.some((name) => column.includes(name)));
  const dimensionIndex = indexFor(["维度", "dimension"]);
  const answerIndex = indexFor(["用户答案", "answer", "无新需求"]);
  const referenceIndex = indexFor(["事实", "材料", "reference"]);
  const acceptanceIndex = indexFor(["可执行验收", "acceptance"]);
  if ([dimensionIndex, answerIndex, referenceIndex, acceptanceIndex].some((index) => index < 0)) {
    return { present: true, facts: emptyFacts, errors: ["decision convergence table must include dimension, user answer, material reference, and executable acceptance columns"] };
  }
  const errors = [];
  const byDimension = new Map();
  for (const row of rows) {
    const dimension = convergenceDimension(row[dimensionIndex]);
    if (!dimension) continue;
    if (byDimension.has(dimension)) {
      errors.push(`decision convergence ${dimension} has duplicate rows`);
      continue;
    }
    byDimension.set(dimension, { answer: row[answerIndex] ?? "", reference: row[referenceIndex] ?? "", acceptance: row[acceptanceIndex] ?? "" });
  }
  const facts = {};
  for (const dimension of ["goal", "scope", "solution", "acceptance"]) {
    const row = byDimension.get(dimension);
    if (!row) {
      facts[dimension] = false;
      errors.push(`decision convergence ${dimension} is missing`);
      continue;
    }
    let valid = true;
    if (!recordedUserAnswer(row.answer)) {
      valid = false;
      errors.push(`decision convergence ${dimension} is missing a real user answer or no_new_requirement record`);
    }
    if (!concreteMaterialReference(row.reference)) {
      valid = false;
      errors.push(`decision convergence ${dimension} is missing a concrete fact or material reference`);
    }
    if (dimension === "solution" && (!labelledSubstantiveValue(row.answer, "(?:取舍|tradeoff)")
        || !labelledSubstantiveValue(row.answer, "(?:被拒方案|被拒选项|rejected option)")
        || !(/无未决项|no open items/i.test(row.answer) || labelledSubstantiveValue(row.answer, "(?:未决项|open item)")))) {
      valid = false;
      errors.push("decision convergence solution is missing tradeoff, rejected option, or open-item disposition");
    }
    if (dimension === "acceptance" && (!labelledSubstantiveValue(row.acceptance, "(?:场景|scenario)")
        || !labelledSubstantiveValue(row.acceptance, "(?:数据来源|data source)")
        || !labelledSubstantiveValue(row.acceptance, "(?:通过|pass)")
        || !labelledSubstantiveValue(row.acceptance, "(?:失败|fail)"))) {
      valid = false;
      errors.push("decision convergence acceptance is missing scenario, data source, pass, or fail criterion");
    }
    facts[dimension] = valid;
  }
  return { present: true, facts, errors };
}

function meaningfulSectionBody(markdown, headingPattern) {
  const body = markdownSectionBody(markdown, headingPattern);
  if (body === null) return "";
  const meaningful = body.split(/\r?\n/).map((line) => line.replace(/^\s*[-*|]\s*/, "").replace(/[`|]/g, "").trim())
    .find((line) => line !== ""
      && !/^[-: ]+$/.test(line)
      && !/^(?:(?:R|D|AC|FR|RISK)-[A-Za-z0-9_-]+[，,;；:\s]*)+$/i.test(line));
  if (meaningful) return meaningful;
  return "";
}

export function analyzeDecisionConvergence(decisionLogMarkdown, {
  originalRequirement = "",
  requirementMessages = [],
  requirementCoverageOutputs = [],
  taskId = null,
  directionReview = null,
  requireOutline = false,
} = {}) {
  const errors = [];
  const text = String(decisionLogMarkdown ?? "");
  const hasSection = (pattern) => pattern.test(text);
  const hasTaskIdentitySection = /^#{1,3}(?:\s+|$)(?:任务身份|task identity)\s*$/im.test(text);
  const taskType = readTaskTypeFromDecisionLog(text);
  if (hasTaskIdentitySection && taskType === "unknown") {
    errors.push("decision-log task type declaration is missing or invalid");
  }

  const goalBody = meaningfulSectionBody(text, /^(?:核心目标|目标|goal|成功意图|success intent)$/i);
  const acceptanceBody = meaningfulSectionBody(text, /^(?:验收标准|acceptance|验收目标|AC)$/i);
  const directionBody = meaningfulSectionBody(text, /^(?:决定|decision|方案|direction|已选方向|selected direction|结论)$/i);
  const riskBody = meaningfulSectionBody(text, /^(?:开放问题|风险|延期|未决|风险与延期交接|open questions|risks|deferred)$/i);
  const coreRequirementBody = meaningfulSectionBody(text, /^(?:核心需求|core requirement)$/i);
  const structuredConvergence = structuredConvergenceFacts(text);
  const outline = analyzeDecisionOutline(text, { taskId, directionReview });

  const requirementCoverage = hasSection(/^#{1,3}\s*(?:原始需求|requirement|来源与决策映射|需求→决定|需求矩阵)/im)
    || /(?:R-001|原始需求|requirement).*(?:D-001|决定|decision)/i.test(text);
  let goalAchievement = goalBody !== "" && /(?:实现|达成|确认|可执行|完成|achiev|executable|confirmed)/i.test(goalBody);
  let scope = meaningfulSectionBody(text, /^(?:范围|scope|目标、用户流程与边界)$/i) !== "";
  let acceptanceClarity = acceptanceBody !== "" && /(?:可验证|通过|失败|条件|边界|verify|pass|fail|condition|boundary)/i.test(acceptanceBody);
  let solutionConvergence = directionBody !== "" && riskBody !== "";
  const plainLanguageCard = coreRequirementBody !== "" && goalBody !== "" && directionBody !== "";

  if (structuredConvergence.present) {
    goalAchievement = structuredConvergence.facts.goal === true;
    scope = structuredConvergence.facts.scope === true;
    solutionConvergence = structuredConvergence.facts.solution === true;
    acceptanceClarity = structuredConvergence.facts.acceptance === true;
    errors.push(...structuredConvergence.errors);
  }

  if (!requirementCoverage) errors.push("decision-log does not present a requirement-to-decision coverage matrix");
  if (!goalAchievement) errors.push("decision-log does not state the core goal achievement");
  if (!scope) errors.push("decision-log does not state the scoped user flow, surface, or functional boundary");
  if (!acceptanceClarity) errors.push("decision-log does not make acceptance criteria explicit");
  if (!solutionConvergence) errors.push("decision-log does not show a converged solution with open items");
  if (!plainLanguageCard) errors.push("decision-log end card is missing core requirement, core goal, or selected direction");

  const originalLines = String(originalRequirement ?? "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (originalLines.length > 0 && !requirementCoverage) {
    errors.push("original requirement exists but coverage matrix is missing");
  }

  const coverageRows = requirementCoverage ? parseCoverageRows(text) : [];
  let dispositionsValid = true;
  let requiredDimensionsPresent = true;
  if (requirementCoverage && coverageRows.length < 2) {
    errors.push("requirement coverage section does not contain a mapped rows");
  }
  if (coverageRows.length > 0) {
    const dispositionColumn = coverageRows[0].findIndex((cell) => /状态|处置|disposition|status/i.test(cell));
    if (dispositionColumn < 0) {
      dispositionsValid = false;
      errors.push("coverage matrix header is missing a disposition/status column");
    } else {
      const dataRows = coverageRows.slice(1);
      for (const row of dataRows) {
        const disposition = row[dispositionColumn];
        if (!disposition || !/(?:covered|accepted_omission|deferred|rejected|non.?goal|延期|拒绝|覆盖|已接受)/i.test(disposition)) {
          dispositionsValid = false;
          errors.push(`coverage row "${row.join(" | ")}" lacks a valid disposition`);
        }
      }
    }
  }

  const coverageDataRows = coverageRows.slice(1);
  const coverageText = coverageRows.map((row) => row.join(" ")).join("\n");
  for (const requirementMessage of requirementMessages) {
    const directClass = typeof requirementMessage === "string" ? requirementMessage : requirementMessage?.message_class;
    const messageId = typeof requirementMessage === "object" && requirementMessage !== null ? requirementMessage.id : null;
    // The host-authenticated message carries identity only; the semantic
    // classification is a make-decision artifact.  Derive each message's
    // classes from its ordinary requirement coverage outputs instead of
    // requiring the transcript line to carry a class it cannot know.
    const outputClasses = typeof messageId === "string"
      ? requirementCoverageOutputs
        .filter((entry) => entry?.message_id === messageId)
        .map((entry) => entry?.message_class)
      : [];
    const messageClasses = [...new Set([directClass, ...outputClasses]
      .filter((value) => typeof value === "string" && value.trim() !== ""))];
    if (messageClasses.length === 0) {
      requiredDimensionsPresent = false;
      errors.push("authenticated requirement message class is missing");
      continue;
    }
    for (const messageClass of messageClasses) {
      if (!new RegExp(`\\b${messageClass.replace(/_/g, "[_\\\\-]?")}\\b`, "i").test(coverageText)) {
        requiredDimensionsPresent = false;
        errors.push(`coverage matrix is missing the required dimension: ${messageClass}`);
      }
      if (typeof requirementMessage === "object" && requirementMessage !== null) {
        const { id } = requirementMessage;
        const output = typeof id === "string"
          ? requirementCoverageOutputs.find((entry) => entry?.message_id === id && entry?.message_class === messageClass)
          : null;
        const boundRow = output && coverageDataRows.find((row) => {
          const rowText = row.join(" ");
          // A row may legitimately map one requirement to several decisions
          // ("D-001、D-009"), so containment is checked against the row text,
          // not exact cell equality.  Requirement/decision ids are fixed-width
          // (R-001/D-001), so substring containment cannot alias a longer id.
          return output.requirement_ids?.some((requirementId) => rowText.includes(requirementId))
            && output.decision_ids?.some((decisionId) => rowText.includes(decisionId))
            && new RegExp(`\\b${messageClass.replace(/_/g, "[_\\\\-]?")}\\b`, "i").test(rowText);
        });
        if (!boundRow) {
          requiredDimensionsPresent = false;
          errors.push(`coverage matrix does not bind authenticated message through its requirement/decision coverage output: ${id ?? "unknown"}`);
        }
      }
    }
  }

  const completeRequirementCoverage = requirementCoverage
    && coverageRows.length >= 2
    && dispositionsValid
    && requiredDimensionsPresent;

  return Object.freeze({
    ok: errors.length === 0 && (!requireOutline || outline.ok),
    errors: Object.freeze([...errors, ...(requireOutline ? outline.errors : [])]),
    facts: Object.freeze({
      requirement_coverage: completeRequirementCoverage ? "passed" : "missing",
      goal_achievement: goalAchievement ? "passed" : "missing",
      scope: scope ? "passed" : "missing",
      acceptance_clarity: acceptanceClarity ? "passed" : "missing",
      solution_convergence: solutionConvergence ? "passed" : "missing",
      plain_language_card: plainLanguageCard ? "passed" : "missing",
      outline_closed: outline.facts.outline_closed,
    }),
    outline,
  });
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

function executionIndexRows(document) {
  const section = markdownSections(document, 2).find(({ heading }) => /^(?:Execution Index|执行索引)$/i.test(heading));
  if (!section) return null;
  const rows = [];
  for (const line of section.body.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line) || /^\s*\|\s*(?:---|phase\s*\||阶段\s*\|)/i.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 6 || cells.every((cell) => /^-+$/.test(cell))) continue;
    const plain = (value) => value.replace(/^`|`$/g, "").trim();
    rows.push(Object.freeze({
      phase: plain(cells[0]),
      authority_ref: plain(cells[1]),
      semantic_anchor: plain(cells[2]),
      write_set: Object.freeze(inlinePaths(cells[3])),
      dependency: plain(cells[4]),
      consumer: plain(cells[5]),
    }));
  }
  return Object.freeze(rows);
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
  return String(body ?? "").match(new RegExp(
    `^\\s*-\\s+\\*\\*(?:${labelAlternation(field)})\\*\\*\\s*[:：]\\s*(.+?)\\s*$`,
    "mi",
  ))?.[1]?.trim() ?? null;
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

export function validatePostPhaseContract({ spec, index, phases } = {}) {
  const errors = [];
  if (!nonEmptyString(spec)) errors.push("spec.md content is required");
  if (!nonEmptyString(index)) errors.push("phases/index.md content is required");
  if (!phases || typeof phases !== "object" || Array.isArray(phases)) errors.push("independent Phase files are required");
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors), facts: null });

  const rows = executionIndexRows(index);
  if (!rows || rows.length === 0) errors.push("phases/index.md requires an Execution Index with Phase pointers");
  if (/^\s*[-*]\s*(?:\*\*)?(?:gate_cmd|expected_exit|oracle|evidence_path)\b/mi.test(index)) {
    errors.push("Phase index must remain pointer-only; command, oracle, and evidence belong to Phase files");
  }
  const phaseRows = [];
  const indexedPaths = new Set();
  const writeOwners = new Map();
  const taskOwners = new Map();
  const taskCards = [];
  for (const [position, row] of (rows ?? []).entries()) {
    const expectedId = `P${position + 1}`;
    if (row.phase !== expectedId) errors.push(`Phase index must declare contiguous P1..Pn; expected ${expectedId}`);
    const expectedPath = `phases/${expectedId}.md`;
    if (row.authority_ref !== expectedPath) errors.push(`${expectedId} authority ref must be ${expectedPath}`);
    if (!row.semantic_anchor) errors.push(`${expectedId} semantic anchor is required`);
    if (!row.consumer) errors.push(`${expectedId} consumer is required`);
    if (indexedPaths.has(row.authority_ref)) errors.push(`duplicate Phase authority ref: ${row.authority_ref}`);
    indexedPaths.add(row.authority_ref);
    const body = phases[expectedPath];
    if (!nonEmptyString(body)) {
      errors.push(`${expectedPath} is missing or empty`);
      continue;
    }
    if (!new RegExp(`^#\\s+(?:Phase|阶段)\\s+${expectedId}\\b`, "m").test(body)) errors.push(`${expectedPath} must declare Phase ${expectedId}`);
    for (const heading of ["L0", "L1", "L2"]) {
      if (!new RegExp(`^##\\s+${heading}\\b`, "m").test(body)) errors.push(`${expectedPath} is missing ${heading}`);
    }
    const declaredWriteSet = inlinePaths(fieldValue(body, "Write set") ?? "");
    if (declaredWriteSet.length === 0) errors.push(`${expectedPath} Write set is missing`);
    if (!sameIds(declaredWriteSet, row.write_set)) errors.push(`${expectedPath} write set differs from Phase index`);
    for (const path of declaredWriteSet) {
      const owner = writeOwners.get(path);
      if (owner) errors.push(`${expectedPath} write set duplicates ${path} owned by ${owner}`);
      else writeOwners.set(path, expectedPath);
    }
    const dependencyText = fieldValue(body, "Dependency");
    const dependency = dependencyText?.match(/`([^`]+)`/)?.[1] ?? dependencyText ?? null;
    const phaseDependencies = WITHOUT_PREDECESSOR.test(dependency ?? "") ? [] : identifiers(dependency ?? "", /\bP\d+\b/g);
    const indexDependencies = WITHOUT_PREDECESSOR.test(row.dependency ?? "") ? [] : identifiers(row.dependency ?? "", /\bP\d+\b/g);
    if (!sameIds(phaseDependencies, indexDependencies)
        || (!WITHOUT_PREDECESSOR.test(dependency ?? "") && phaseDependencies.length === 0)
        || (!WITHOUT_PREDECESSOR.test(row.dependency ?? "") && indexDependencies.length === 0)
        || phaseDependencies.some((id) => Number(id.slice(1)) >= position + 1)) {
      errors.push(`${expectedPath} dependency must match the index and reference only earlier Phase IDs`);
    }
    if (!fieldValue(body, "Global spec")?.includes("spec.md")) errors.push(`${expectedPath} requires a stable spec.md pointer`);
    const consumer = fieldValue(body, "Consumer")?.replace(/[。；;\s]+$/u, "").trim();
    if (!consumer || consumer !== row.consumer?.replace(/[。；;\s]+$/u, "").trim()) {
      errors.push(`${expectedPath} consumer differs from Phase index`);
    }
    const command = fieldValue(body, "gate_cmd");
    const oracle = fieldValue(body, "oracle");
    if (!hasExecutableCommand(command) || !/^ORACLE-[A-Z0-9-]+/.test(oracle ?? "")) {
      errors.push(`${expectedPath} requires an executable gate_cmd and oracle`);
    }
    if (!fieldValue(body, "STOP") || !fieldValue(body, "Done") || !fieldValue(body, "evidence_path")) {
      errors.push(`${expectedPath} requires STOP, Done, and evidence_path`);
    }
    const frs = identifiers(body, /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
    const acs = identifiers(body, ACCEPTANCE_CRITERION_ID);
    const l1 = body.split(/^##\s+L1\b[^\n]*\n/m)[1]?.split(/^##\s+L2\b/m)[0] ?? "";
    const cards = markdownSections(l1, 3).filter(({ heading }) => /^T\d+\b/.test(heading));
    if (cards.length === 0) errors.push(`${expectedPath} requires independent ### Tnnn task cards; one-line Tasks is insufficient`);
    for (const { heading, body: cardBody } of cards) {
      const taskId = heading.match(/^(T\d{3,})\s+[—–-]\s+\S/)?.[1];
      if (!taskId) {
        errors.push(`${expectedPath} task card requires stable ### Tnnn — outcome heading`);
        continue;
      }
      if (taskOwners.has(taskId)) errors.push(`${expectedPath} duplicate task card ${taskId} owned by ${taskOwners.get(taskId)}`);
      else taskOwners.set(taskId, expectedPath);
      const required = [
        "Source / FR / AC", "Files / symbols", "Action", "Inputs", "Outputs / failure",
        "Boundary / DO NOT TOUCH", "Dependency", "Test tier / skill", "Scenario / fixture or service",
        "RED/GREEN gate_cmd", "expected_exit", "RED target failure", "GREEN oracle",
        "Evidence", "STOP / recovery", "Coverage limit", "Done",
      ];
      const fields = Object.fromEntries(required.map((field) => [field, fieldValue(cardBody, field)]));
      for (const field of required) {
        const value = fields[field];
        if (!value || /^(?:TBD|TODO|待补充|\[|N\/A\s*$)/i.test(value)) {
          errors.push(`${expectedPath} ${taskId} task card missing concrete ${field}`);
        }
      }
      const cardFrs = identifiers(fields["Source / FR / AC"] ?? "", /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
      const cardAcs = identifiers(fields["Source / FR / AC"] ?? "", ACCEPTANCE_CRITERION_ID);
      if (cardFrs.length === 0 || cardAcs.length === 0 || !/\b(?:R|U|PRD|CARD)-[A-Z0-9-]+\b/.test(fields["Source / FR / AC"] ?? "")) {
        errors.push(`${expectedPath} ${taskId} Source / FR / AC must bind original source, FR, and AC`);
      }
      const filePaths = inlinePaths(fields["Files / symbols"] ?? "").filter((path) => /[/.]/.test(path));
      if (filePaths.length === 0 || filePaths.some((path) => !declaredWriteSet.includes(path))) {
        errors.push(`${expectedPath} ${taskId} Files / symbols must name owned write-set paths`);
      }
      if (!/(?:\bsymbol|符号|N\/A\s+[—-]\s+\S)/i.test(fields["Files / symbols"] ?? "")) {
        errors.push(`${expectedPath} ${taskId} Files / symbols must name a symbol or explain N/A for non-code files`);
      }
      if (!hasExecutableCommand(fields["RED/GREEN gate_cmd"])) errors.push(`${expectedPath} ${taskId} needs one executable RED/GREEN gate_cmd`);
      if (!/^ORACLE-[A-Z0-9-]+\b/.test(fields["GREEN oracle"] ?? "")) errors.push(`${expectedPath} ${taskId} needs an identifiable GREEN oracle`);
      const greenOracle = fields["GREEN oracle"]?.match(/^ORACLE-[A-Z0-9-]+\b/)?.[0];
      const redOracle = fields["RED target failure"]?.match(/\bORACLE-[A-Z0-9-]+\b/)?.[0];
      if (!greenOracle || redOracle !== greenOracle) errors.push(`${expectedPath} ${taskId} RED oracle must match GREEN oracle`);
      if (!/(?:assert|断言|expected|预期|nonzero|失败)/i.test(fields["RED target failure"] ?? "")) {
        errors.push(`${expectedPath} ${taskId} RED target failure must identify the failing assertion`);
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
      const requestsG2 = !behaviorExit && [fields.Inputs, fields["Scenario / fixture or service"]].some((value) => /G-2/i.test(value ?? ""));
      const g2Missing = [];
      if (requestsG2) {
        if (!docDeclaration) g2Missing.push("pure documentation declaration (文档无新增运行行为)");
        const ownedPaths = inlinePaths(fields["Files / symbols"] ?? "");
        if (ownedPaths.length === 0 || ownedPaths.some((path) => !/\.md$/i.test(path))) g2Missing.push("documentation-only owned write set");
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
        if (affirmativeConflict) g2Missing.push("contradiction (新增 runtime/运行行为或修改执行逻辑)");
        for (const missing of g2Missing) errors.push(`${expectedPath} ${taskId} G-2 missing concrete ${missing}`);
      }
      const pureDocumentAlternative = requestsG2 && g2Missing.length === 0;
      if (!pureDocumentAlternative && !behaviorExit) {
        errors.push(`${expectedPath} ${taskId} expected_exit must distinguish RED target failure from GREEN 0`);
      }
      if (!/(?:`[^`]+`|\bP\d+\b|\bT\d+\b|\bnone\b|无)/i.test(fields.Dependency ?? "")) {
        errors.push(`${expectedPath} ${taskId} Dependency must identify an existing prerequisite or none`);
      }
      taskCards.push(Object.freeze({ id: taskId, phase: expectedId, frs: Object.freeze(cardFrs), acs: Object.freeze(cardAcs), oracle: fields["GREEN oracle"] ?? null, dependency: fields.Dependency ?? "" }));
    }
    const taskIds = cards.map(({ heading }) => heading.match(/^(T\d{3,})\b/)?.[1]).filter(Boolean);
    phaseRows.push(Object.freeze({ id: expectedId, path: expectedPath, write_set: Object.freeze(declaredWriteSet), dependency, frs: Object.freeze(frs), acs: Object.freeze(acs), task_ids: Object.freeze(taskIds), command, oracle }));
  }
  for (const path of Object.keys(phases)) {
    if (!indexedPaths.has(path)) errors.push(`unindexed Phase file: ${path}`);
  }
  for (const [position, card] of taskCards.entries()) {
    const refs = identifiers(card.dependency, /\b[PT]\d+\b/g);
    if (refs.length === 0 && !WITHOUT_PREDECESSOR.test(card.dependency)) {
      errors.push(`${card.phase}/${card.id} dependency must be none or identify a Phase/Task`);
    }
    for (const ref of refs) {
      if (ref.startsWith("P") && Number(ref.slice(1)) >= Number(card.phase.slice(1))) {
        errors.push(`${card.phase}/${card.id} dependency ${ref} must be an earlier Phase`);
      }
      if (ref.startsWith("T") && (!taskOwners.has(ref) || taskCards.findIndex((task) => task.id === ref) >= position)) {
        errors.push(`${card.phase}/${card.id} dependency ${ref} must be an existing earlier task`);
      }
    }
  }
  const acceptedFrs = [...new Set([...spec.matchAll(/^-\s+\*\*(FR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3}))\*\*/gm)].map((match) => match[1]))];
  const declaredAcs = [...new Set([...spec.matchAll(/^-\s+(?:\[[ xX]\]\s+)?\*\*(AC-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3}))\b/gm)].map((match) => match[1]))];
  const dispositions = acceptanceCriterionDispositions(spec);
  const activeAcs = new Set(dispositions.active_ids);
  const acceptedAcs = declaredAcs.filter((id) => activeAcs.has(id));
  const deferredAcs = declaredAcs.filter((id) => dispositions.deferred_ids.includes(id));
  for (const card of taskCards) {
    for (const id of card.frs) if (!acceptedFrs.includes(id)) errors.push(`${card.phase}/${card.id} task card references unknown FR: ${id}`);
    for (const id of card.acs) if (!declaredAcs.includes(id)) errors.push(`${card.phase}/${card.id} task card references unknown AC: ${id}`);
  }
  const design = markdownSections(spec, 2).find(({ heading }) => /^(?:实现设计（全局权威）|Implementation Design)$/i.test(heading));
  if (!design) errors.push("spec.md requires Implementation Design (全局权威)");
  const designSections = design ? markdownSections(`## ${design.heading}\n${design.body}`, 3) : [];
  const designBody = Object.fromEntries(designSections.map(({ heading, body }) => [canonicalDesignHeading(heading), body]));
  for (const heading of ["Code Anchors", "Interfaces and Failure Semantics", "Requirement-to-Task Trace", "Global Verification Strategy"]) {
    if (!designBody[heading] || placeholderOrTemplateNoise(designBody[heading])) errors.push(`spec.md Implementation Design requires concrete ${heading}`);
  }
  if (designBody["Code Anchors"] && !/`[^`\n]*[/.][^`\n]*`/.test(designBody["Code Anchors"])) {
    errors.push("spec.md Code Anchors must identify a concrete path");
  }
  const traceLines = (designBody["Requirement-to-Task Trace"] ?? "").split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
  const traceRows = traceLines.filter((line) => /\b(?:R|U|PRD|CARD)-[A-Z0-9-]+\b/.test(line)
    && /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/.test(line)
    && identifiers(line, ACCEPTANCE_CRITERION_ID).length > 0
    && /\bP\d+\/T\d{3,}\b/.test(line)
    && /\bORACLE-[A-Z0-9-]+\b/.test(line));
  if (traceRows.length === 0) errors.push("spec.md Requirement-to-Task Trace needs source → FR → AC → Phase/Task → oracle rows");
  for (const id of acceptedFrs) if (!traceRows.some((row) => row.includes(id))) errors.push(`spec.md Requirement-to-Task Trace is missing FR: ${id}`);
  for (const id of acceptedAcs) if (!traceRows.some((row) => row.includes(id))) errors.push(`spec.md Requirement-to-Task Trace is missing AC: ${id}`);
  for (const card of taskCards) {
    const trace = traceRows.filter((row) => row.includes(`${card.phase}/${card.id}`));
    if (trace.length === 0 || card.frs.some((id) => !trace.some((row) => row.includes(id)))
        || card.acs.some((id) => !trace.some((row) => row.includes(id)))) {
      errors.push(`spec.md Requirement-to-Task Trace is missing ${card.phase}/${card.id} FR/AC binding`);
    }
    const oracle = card.oracle?.match(/^ORACLE-[A-Z0-9-]+\b/)?.[0];
    if (oracle && !trace.some((row) => row.includes(oracle))) {
      errors.push(`spec.md Requirement-to-Task Trace ${card.phase}/${card.id} oracle differs from task card`);
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
    phase_count: phaseRows.length,
    task_count: [...new Set(phaseRows.flatMap((row) => row.task_ids))].length,
    phase_rows: Object.freeze(phaseRows),
    fr_coverage: Object.freeze({ accepted_count: acceptedFrs.length, covered_count: acceptedFrs.filter((id) => coveredFrs.includes(id)).length, accepted_ids: Object.freeze(acceptedFrs), covered_ids: Object.freeze(coveredFrs) }),
    ac_coverage: Object.freeze({ accepted_count: acceptedAcs.length, covered_count: acceptedAcs.filter((id) => coveredAcs.includes(id)).length, accepted_ids: Object.freeze(acceptedAcs), covered_ids: Object.freeze(coveredAcs), deferred_ids: Object.freeze(deferredAcs) }),
    dependency_validation: Object.freeze({ valid: !errors.some((error) => /dependency|contiguous|duplicate Phase/.test(error)) }),
    command_oracle_checks: Object.freeze({ valid: taskCards.length > 0 && !errors.some((error) => /task card|gate_cmd|oracle|RED target|expected_exit/i.test(error)) }),
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

/** Validate the material's decision text; supplied old hashes/appendices are not authority. */
export function validateDecisionLogContract(input) {
  const markdown = typeof input === "string" ? input : input?.main?.markdown ?? input?.markdown;
  if (typeof markdown !== "string" || !markdown.trim()) return result(["decision-log markdown content is required"]);
  return analyzeDecisionConvergence(markdown, {
    originalRequirement: typeof input?.original_requirement === "string" ? input.original_requirement : "",
    requirementMessages: Array.isArray(input?.requirement_messages) ? input.requirement_messages : [],
    requirementCoverageOutputs: Array.isArray(input?.requirement_coverage_outputs) ? input.requirement_coverage_outputs : [],
    taskId: input?.task_id ?? null,
  });
}

export { CURRENT_MATERIAL_FILES as MATERIAL_FILES } from "../task/material-workspace.mjs";
