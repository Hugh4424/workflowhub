import { createHash } from "node:crypto";

import Ajv2020 from "ajv/dist/2020.js";

import decisionEntrySchema from "./schemas/decision-entry.v1.json" with { type: "json" };
import ambiguityLedgerV2Schema from "./schemas/ambiguity-ledger.v2.json" with { type: "json" };
import planTaskV2Schema from "./schemas/plan-task-contract.v2.json" with { type: "json" };

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const HASH = /^[a-f0-9]{64}$/;
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateEntrySchema = ajv.compile(decisionEntrySchema);
const validateAmbiguityLedgerV2Schema = ajv.compile(ambiguityLedgerV2Schema);
const validatePlanTaskV2Schema = ajv.compile(planTaskV2Schema);

const REQUIRED_MAIN_SECTIONS = Object.freeze([
  "原始需求", "目标", "范围", "非目标", "决定", "三轮 talk", "调研", "grill",
  "审查处置", "最终确认", "拒绝方案", "风险", "未决项", "Supersedes", "文档结果", "Exit checks",
]);

export const DECISION_CORRECTIONS = Object.freeze({
  D1: "原“全部通过后才恢复/允许 replay”读作“全部通过后必须在原 task 产生新 revision/attempt 并实际重放处理组 1；仅允许或计划 replay 不算完成”",
  D2: "原“连接 authenticated Stage-specific content records”补足为“官方发布必须消费 audit carrier 与 typed content refs；writer/handler 不产生第二 verdict”",
  D3: "原“new truthful continuation”读作“原 task 上 append-only 新 revision/attempt，旧 bytes/hash 不变，不另建替代 task”",
  D4: "原“real delivery 可证明”补足为“每题强绑 host-visible ask/reply refs、card hash、round、题号、re-rank 和每轮结束结论”",
  D5: "原“two synchronized views”补足为“同一 completion facts、同一 human-readable artifact label、同一 accepted lookup rule；formal review record 与大白话 brief 分离”",
  D6: "原“serious/evidence-backed”固定为“全部五阶段 formal review 中 `actionable + major|blocking`”；build-spec/build-code 的暂停是异常处置点，不新增正常确认",
  D7: "原“结构错误不可继续”保持；decision coverage omission 只有被机器发现、展示并进入专用 omission appendix 后才从未处置错误变成 accepted exception，review risk record 不得代替",
});

function result(errors) {
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function schemaErrors(validate) {
  return (validate.errors ?? []).map((error) => {
    const missing = error.params?.missingProperty;
    return missing ? `${missing} is required` : `${error.instancePath || "/"} ${error.message}`;
  });
}

function object(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function validateInteractionQuestionProgress(value) {
  const errors = [];
  if (!object(value)) return Object.freeze({
    ok: false,
    errors: Object.freeze(["interaction question progress must be an object"]),
    facts: Object.freeze({}),
  });
  const asked = value.asked_question_ids;
  const open = value.open_direction_changing_question_ids;
  if (!Array.isArray(asked) || asked.some((id) => typeof id !== "string" || id.trim() === "")) {
    errors.push("asked_question_ids must be non-empty string identifiers");
  }
  if (!Array.isArray(open) || open.some((id) => typeof id !== "string" || id.trim() === "")) {
    errors.push("open_direction_changing_question_ids must be non-empty string identifiers");
  }
  const askedIds = Array.isArray(asked) ? asked : [];
  const openIds = Array.isArray(open) ? open : [];
  const allIds = [...askedIds, ...openIds];
  if (new Set(allIds).size !== allIds.length) errors.push("asked and open question identifiers must be unique");

  const currentTotal = askedIds.length + openIds.length;
  const expectedQuestionNumber = openIds.length === 0 ? askedIds.length : askedIds.length + 1;
  if (value.displayed_total !== currentTotal) {
    errors.push("displayed_total must equal asked questions plus open direction-changing questions");
  }
  if (value.displayed_question_number !== expectedQuestionNumber) {
    errors.push("displayed_question_number must identify the next open question");
  }

  const previous = value.previous;
  const previousTotal = object(previous) && Number.isInteger(previous.displayed_total)
    ? previous.displayed_total
    : currentTotal;
  const totalDelta = currentTotal - previousTotal;
  if (object(previous) && totalDelta !== 0) {
    if (typeof value.reply_ref !== "string" || value.reply_ref.trim() === "" || !HASH.test(value.reply_hash ?? "")) {
      errors.push("a changed total requires a bound real reply ref/hash");
    }
    if (typeof value.total_change_reason !== "string" || value.total_change_reason.trim() === "") {
      errors.push("a changed total requires a factual change reason");
    }
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    facts: Object.freeze({
      displayed_question_number: value.displayed_question_number,
      current_total: currentTotal,
      total_delta: totalDelta,
    }),
  });
}

export function validateDecisionEntry(value) {
  return result(validateEntrySchema(value) ? [] : schemaErrors(validateEntrySchema));
}

function validateMain(input, errors) {
  if (!object(input.main)) {
    errors.push("main decision log is required");
    return;
  }
  if (typeof input.main.markdown !== "string" || input.main.markdown.trim() === "") errors.push("main markdown is required");
  if (typeof input.main.ref !== "string" || input.main.ref.trim() === "") errors.push("main ref is required");
  if (!HASH.test(input.main.hash ?? "") || input.main.hash !== sha256(input.main.markdown ?? "")) errors.push("main decision log hash binding mismatch");
  for (const section of REQUIRED_MAIN_SECTIONS) {
    if (!new RegExp(`^##\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "mi").test(input.main.markdown ?? "")) {
      errors.push(`main decision log section missing: ${section}`);
    }
  }
  if (!Array.isArray(input.main.entries) || input.main.entries.length === 0) errors.push("main decision entries are required");
  for (const [index, entry] of (input.main.entries ?? []).entries()) {
    const validation = validateDecisionEntry(entry);
    for (const error of validation.errors) errors.push(`main.entries[${index}].${error}`);
  }
}

function appendixEntries(input, errors) {
  const byRef = new Map();
  for (const [index, appendix] of (input.appendices ?? []).entries()) {
    if (!object(appendix)) {
      errors.push(`appendices[${index}] must be an object`);
      continue;
    }
    if (appendix.kind !== "decision-omission-acceptance.v1") {
      errors.push(`${appendix.kind ?? "appendix"} cannot replace the dedicated omission schema`);
      continue;
    }
    if (typeof appendix.ref !== "string" || byRef.has(appendix.ref)) {
      errors.push("omission appendix ref must be unique");
      continue;
    }
    const entryValidation = validateDecisionEntry(appendix.decision_entry);
    for (const error of entryValidation.errors) errors.push(`appendix ${appendix.ref}: ${error}`);
    byRef.set(appendix.ref, appendix.decision_entry);
  }
  return byRef;
}

function completeDetailPacket(input, errors) {
  const packet = input.detail_review_packet;
  if (!object(packet) || !/^[a-f0-9]{40}$/.test(packet.candidate_tree ?? "")) errors.push("detail review candidate tree is required");
  if (!object(packet?.interaction_aggregate) || packet.interaction_aggregate.complete !== true
      || !HASH.test(packet.interaction_aggregate.hash ?? "")) {
    errors.push("detail review requires the complete interaction aggregate");
  }
  const decision = packet?.decision_log;
  if (!object(decision) || typeof decision.complete_bytes !== "string") {
    errors.push("detail review requires complete decision-log bytes; a summary is forbidden");
    return;
  }
  let decoded;
  try { decoded = Buffer.from(decision.complete_bytes, "base64").toString("utf8"); }
  catch { errors.push("detail review complete decision-log bytes are invalid"); return; }
  if (decision.ref !== input.main?.ref || decision.hash !== input.main?.hash || decoded !== input.main?.markdown
      || sha256(decoded) !== decision.hash) {
    errors.push("detail review decision-log complete bytes binding mismatch");
  }
}

export function validateDecisionLogContract(input) {
  const errors = [];
  if (!object(input)) return result(["decision log contract must be an object"]);
  validateMain(input, errors);
  if (!Array.isArray(input.appendices)) errors.push("appendices must be an array");
  const appendices = appendixEntries(input, errors);
  const coverage = input.coverage;
  if (!object(coverage) || !Array.isArray(coverage.items)) {
    errors.push("decision coverage items are required");
  } else {
    if (coverage.decision_log_ref !== input.main?.ref || coverage.decision_log_hash !== input.main?.hash) {
      errors.push("decision coverage main ref/hash binding mismatch");
    }
    const seen = new Set();
    for (const item of coverage.items) {
      const key = item?.source_item_ref;
      if (typeof key !== "string" || !HASH.test(item?.source_item_hash ?? "")) errors.push("coverage source ref/hash is invalid");
      if (seen.has(key)) errors.push(`source ${key} is covered more than once; every source must map exactly once`);
      seen.add(key);
      if (!new Set(["covered", "accepted_omission"]).has(item?.coverage_status)) errors.push(`source ${key} has invalid coverage status`);
      if (item?.coverage_status === "covered" && (item?.decision_location?.kind !== "main" || item.decision_location.ref !== input.main?.ref)) {
        errors.push(`source ${key} covered location must bind the main decision log`);
      }
      if (item?.coverage_status === "accepted_omission"
          && (item?.decision_location?.kind !== "appendix" || !appendices.has(item.decision_location.ref))) {
        errors.push(`source ${key} accepted omission must bind a dedicated omission appendix`);
      }
    }
    const counts = coverage.items.reduce((value, item) => {
      if (item.coverage_status === "covered") value.covered += 1;
      else if (item.coverage_status === "accepted_omission") value.accepted_omission += 1;
      else value.missing += 1;
      return value;
    }, { covered: 0, accepted_omission: 0, missing: 0 });
    if (JSON.stringify(counts) !== JSON.stringify(coverage.summary)) errors.push("decision coverage summary does not match items");
    if (counts.missing !== 0) errors.push("unhandled decision omission blocks final confirmation");
  }
  const coverageByRef = new Map((coverage?.items ?? []).map((item) => [item.source_item_ref, item]));
  for (const selection of input.interaction?.selections ?? []) {
    const covered = coverageByRef.get(selection.source_item_ref);
    if (!covered || covered.source_item_hash !== selection.source_item_hash) errors.push("interaction source hash binding mismatch");
    const entry = covered?.coverage_status === "accepted_omission"
      ? appendices.get(covered?.decision_location?.ref)
      : input.main?.entries?.[covered?.decision_location?.entry_index];
    if (!entry || entry.selected_option !== selection.selected_option
        || entry.approval_ref !== selection.reply_ref || entry.approval_hash !== selection.reply_hash) {
      errors.push("interaction selected option/reply hash binding mismatch");
    }
  }
  completeDetailPacket(input, errors);
  return result(errors);
}

export function validateDecisionCorrectionAppendix(value) {
  const errors = [];
  if (!object(value)) return result(["decision correction appendix must be an object"]);
  if (!HASH.test(value.source_decision_hash ?? "") || typeof value.source_decision_ref !== "string") errors.push("source decision ref/hash is invalid");
  if (value.does_not_rewrite_upstream !== true) errors.push("does_not_rewrite_upstream must be true");
  const corrections = new Map((value.corrections ?? []).map((entry) => [entry?.id, entry?.text]));
  for (const [id, text] of Object.entries(DECISION_CORRECTIONS)) {
    if (corrections.get(id) !== text) errors.push(`${id} correction must match the accepted literal text`);
  }
  if (corrections.size !== Object.keys(DECISION_CORRECTIONS).length) errors.push("correction appendix must contain exactly D1-D7");
  return result(errors);
}

export function buildDecisionCoverageAudit({
  decisionLogRef,
  decisionLogHash,
  sourceItems = [],
  mappings = [],
} = {}) {
  if (typeof decisionLogRef !== "string" || !HASH.test(decisionLogHash ?? "")) {
    throw new TypeError("decision log ref/hash is required");
  }
  if (!Array.isArray(sourceItems) || !Array.isArray(mappings)) throw new TypeError("sourceItems and mappings must be arrays");
  const mappingBySource = new Map();
  for (const mapping of mappings) {
    if (mappingBySource.has(mapping?.source_item_ref)) throw new Error(`duplicate decision coverage mapping: ${mapping?.source_item_ref}`);
    mappingBySource.set(mapping?.source_item_ref, mapping);
  }
  const seenSources = new Set();
  const items = sourceItems.map((source) => {
    if (typeof source?.source_item_ref !== "string" || !HASH.test(source?.source_item_hash ?? "")) {
      throw new TypeError("source item ref/hash is invalid");
    }
    if (seenSources.has(source.source_item_ref)) throw new Error(`duplicate decision source item: ${source.source_item_ref}`);
    seenSources.add(source.source_item_ref);
    const mapping = mappingBySource.get(source.source_item_ref);
    if (!mapping) return { ...source, coverage_status: "missing", decision_location: null };
    if (mapping.source_item_hash !== source.source_item_hash) throw new Error(`decision source hash mismatch: ${source.source_item_ref}`);
    if (!new Set(["covered", "accepted_omission"]).has(mapping.coverage_status)) {
      throw new Error(`invalid decision coverage status: ${source.source_item_ref}`);
    }
    return {
      ...source,
      coverage_status: mapping.coverage_status,
      decision_location: structuredClone(mapping.decision_location),
    };
  });
  const unknown = [...mappingBySource.keys()].filter((ref) => !seenSources.has(ref));
  if (unknown.length) throw new Error(`decision coverage maps unknown source items: ${unknown.join(", ")}`);
  const summary = items.reduce((counts, item) => {
    counts[item.coverage_status] += 1;
    return counts;
  }, { covered: 0, accepted_omission: 0, missing: 0 });
  return Object.freeze({
    decision_log_ref: decisionLogRef,
    decision_log_hash: decisionLogHash,
    items: Object.freeze(items),
    summary: Object.freeze(summary),
  });
}

export function assertDecisionCoverageReadyForConfirmation(audit) {
  if (!object(audit) || !object(audit.summary) || !Array.isArray(audit.items)) throw new TypeError("decision coverage audit is required");
  if (audit.summary.missing !== 0 || audit.items.some((item) => item.coverage_status === "missing")) {
    throw new Error("unhandled decision omissions must be shown to the user and resolved before final confirmation");
  }
  return audit;
}

export function buildDecisionCorrectionAppendix({
  sourceDecisionRef,
  sourceDecisionHash,
  reason,
  impactScope = [],
} = {}) {
  const value = {
    source_decision_ref: sourceDecisionRef,
    source_decision_hash: sourceDecisionHash,
    corrections: Object.entries(DECISION_CORRECTIONS).map(([id, text]) => ({ id, text })),
    reason,
    impact_scope: structuredClone(impactScope),
    does_not_rewrite_upstream: true,
  };
  const validation = validateDecisionCorrectionAppendix(value);
  if (!validation.ok) throw new TypeError(validation.errors.join("; "));
  return Object.freeze(value);
}

function taskRelativeRef(value) {
  return typeof value === "string" && value.trim() !== ""
    && !value.startsWith("/") && !value.split(/[\\/]+/).includes("..");
}

function addUniqueIds(items, label, errors) {
  const ids = new Set();
  for (const item of items ?? []) {
    if (ids.has(item.id)) errors.push(`duplicate ${label} ID: ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}

function validateBoundSpecReference(reference, knownIds, subject, label, errors) {
  if (reference.artifact_kind !== "spec" || reference.ref !== subject.ref
      || reference.hash !== subject.hash || !knownIds.has(reference.id)) {
    errors.push(`${label} must resolve to the bound spec identity`);
  }
}

/**
 * v2 derives identity/closure facts from one spec snapshot. It deliberately
 * stores only IDs and bindings, never a second copy of product prose.
 */
export function validateAmbiguityLedgerV2(value) {
  if (!validateAmbiguityLedgerV2Schema(value)) return result(schemaErrors(validateAmbiguityLedgerV2Schema));
  const errors = [];
  const subject = value.subject_binding;
  if (subject.artifact_kind !== "spec" || !taskRelativeRef(subject.ref)
      || subject.hash !== value.spec_content_hash) {
    errors.push("subject_binding must identify the exact task-relative spec bytes");
  }

  const pfactIds = addUniqueIds(value.pfacts, "PFACT", errors);
  const frIds = addUniqueIds(value.frs, "FR", errors);
  const acIds = addUniqueIds(value.acs, "AC", errors);
  const allIds = new Set([...pfactIds, ...frIds, ...acIds]);

  for (const pfact of value.pfacts) {
    for (const evidence of pfact.evidence ?? []) {
      if (!taskRelativeRef(evidence.ref)) errors.push(`PFACT ${pfact.id} evidence ref must be task-relative`);
    }
    for (const reference of pfact.affects_frs) validateBoundSpecReference(reference, frIds, subject, `PFACT ${pfact.id} FR reference`, errors);
    for (const reference of pfact.affects_acs) validateBoundSpecReference(reference, acIds, subject, `PFACT ${pfact.id} AC reference`, errors);
  }
  for (const fr of value.frs) {
    for (const reference of fr.pfact_refs) validateBoundSpecReference(reference, pfactIds, subject, `FR ${fr.id} PFACT reference`, errors);
    for (const reference of fr.ac_refs) validateBoundSpecReference(reference, acIds, subject, `FR ${fr.id} AC reference`, errors);
  }
  for (const ac of value.acs) {
    for (const reference of ac.fr_refs) validateBoundSpecReference(reference, frIds, subject, `AC ${ac.id} FR reference`, errors);
  }
  for (const risk of value.risks) {
    for (const id of risk.affected_ids) if (!allIds.has(id)) errors.push(`risk ${risk.id} affects unknown ID: ${id}`);
  }
  return result(errors);
}

const PLAN_SECTIONS = Object.freeze([
  "Technical Context",
  "Global Constraints",
  "Modules, Interfaces, and Data Contracts",
  "Implementation Order",
  "Test Strategy",
  "Rollback and Recovery",
  "FR to AC to Step Traceability",
  "Constitution Check",
  "Complexity Trade-offs",
]);
const PLAN_SECTION_ALIASES = Object.freeze({
  "Technical Context": [/Technical Context/i],
  "Global Constraints": [/Global Constraints/i, /全局约束/],
  "Modules, Interfaces, and Data Contracts": [/Modules.*Interfaces.*Data Contracts/i, /模块职责与接口/],
  "Implementation Order": [/Implementation Order/i, /依赖与并行/, /实施顺序/],
  "Test Strategy": [/Test Strategy/i, /场景优先级与独立测试/, /测试策略/],
  "Rollback and Recovery": [/Rollback and Recovery/i, /风险与回滚/],
  "FR to AC to Step Traceability": [/FR to AC to Step Traceability/i, /FR.*AC.*Step.*追踪/i],
  "Constitution Check": [/Constitution Check/i, /宪法逐项检查/],
  "Complexity Trade-offs": [/Complexity Trade-offs/i, /候选方案.*取舍.*复杂度/],
});
const PHASE_FIELDS = Object.freeze(["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP"]);
const TASK_FIELDS = Object.freeze([
  "ID", "动作", "精确文件", "输入", "输出", "依赖", "并行",
  "FR", "AC", "gate_cmd", "expected_exit", "oracle", "evidence_path",
]);

function markdownSections(document, level, prefix = "") {
  const lines = document.split(/\r?\n/);
  const marker = "#".repeat(level);
  const indexes = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(new RegExp(`^${marker}\\s+(.+?)\\s*$`));
    if (match && (!prefix || match[1].startsWith(prefix))) indexes.push({ index, heading: match[1] });
  }
  return indexes.map((entry, position) => ({
    heading: entry.heading,
    body: lines.slice(entry.index + 1, indexes[position + 1]?.index ?? lines.length).join("\n").trim(),
  }));
}

function taskBlocks(document) {
  return markdownSections(document, 4)
    .filter(({ heading }) => /^T\d+\b/.test(heading))
    .map(({ heading, body }) => {
      const fields = {};
      for (const line of body.split(/\r?\n/)) {
        const match = line.match(/^\s*-\s+\*\*([^*]+)\*\*\s*[:：]\s*(.*)$/);
        if (match) fields[match[1].trim()] = match[2].trim();
      }
      return { heading, heading_id: heading.match(/^(T\d+)/)?.[1], fields };
    });
}

function identifiers(text, pattern) {
  return [...new Set(text.match(pattern) ?? [])];
}

function hasExecutableCommand(value) {
  const command = value.trim().replace(/^`([\s\S]*)`$/, "$1");
  return /^(?:mkdir\b|npx\b|npm\b|pnpm\b|yarn\b|bun\b|node\b|python\b|pytest\b|go\b|cargo\b|make\b|bash\b|sh\b|git\b|\.\/)/.test(command);
}

function cycleIn(tasks) {
  const edges = new Map(tasks.map((task) => [task.id ?? task.heading_id, task.dependencies]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of edges.get(id) ?? []) if (edges.has(dependency) && visit(dependency)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return [...edges.keys()].some(visit);
}

export function validatePlanTaskContract({ spec, plan, tasks } = {}) {
  const errors = [];
  for (const [name, value] of Object.entries({ spec, plan, tasks })) {
    if (typeof value !== "string" || value.trim() === "") errors.push(`${name} content is required`);
  }
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors), facts: null });

  const planSections = markdownSections(plan, 2);
  const findPlanSection = (name) => planSections.find(({ heading }) =>
    PLAN_SECTION_ALIASES[name].some((pattern) => pattern.test(heading)));
  for (const heading of PLAN_SECTIONS) {
    const section = findPlanSection(heading);
    const body = section?.body ?? (heading === "Rollback and Recovery" && /风险与回滚/.test(plan) ? "declared per Phase" : undefined);
    if (body === undefined || body.trim() === "") errors.push(`plan section missing or empty: ${heading}`);
  }
  const constitution = findPlanSection("Constitution Check")?.body ?? "";
  const constitutionIds = identifiers(constitution, /\b(?:F(?:10|[1-9])|Q[1-3]|S[1-8])\b/g);
  if (constitutionIds.length !== 21) errors.push(`Constitution Check must enumerate all 21 clauses; found ${constitutionIds.length}`);

  const phases = markdownSections(plan, 2, "Phase ");
  if (phases.length === 0) errors.push("plan must contain at least one Phase");
  const phaseRows = phases.map((phase) => {
    const fields = new Map(markdownSections(`## ${phase.heading}\n${phase.body}`, 3).map((section) => [section.heading, section.body]));
    for (const field of PHASE_FIELDS) {
      const body = fields.get(field);
      if (body === undefined || body.trim() === "") errors.push(`${phase.heading} is missing ${field}`);
      else if (/^None\.?$/i.test(body.trim())) errors.push(`${phase.heading} ${field} uses unexplained None`);
    }
    return Object.freeze({
      phase: phase.heading,
      fields: Object.freeze(Object.fromEntries(PHASE_FIELDS.map((field) => [field, fields.get(field) ?? null]))),
    });
  });

  const parsedTasks = taskBlocks(tasks);
  if (parsedTasks.length === 0) errors.push("tasks document has no task blocks");
  const headingIds = parsedTasks.map(({ heading_id }) => heading_id);
  const duplicateIds = headingIds.filter((id, index) => headingIds.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`duplicate task ID: ${[...new Set(duplicateIds)].join(", ")}`);
  const taskRows = parsedTasks.map((task, index) => {
    for (const field of TASK_FIELDS) {
      if (!(field in task.fields) || task.fields[field].trim() === "") errors.push(`${task.heading_id ?? `task ${index + 1}`} is missing ${field}`);
    }
    if (task.fields.ID && task.fields.ID !== task.heading_id) errors.push(`task heading/ID mismatch: ${task.heading_id} != ${task.fields.ID}`);
    if (task.fields.gate_cmd && !hasExecutableCommand(task.fields.gate_cmd)) errors.push(`${task.heading_id} gate_cmd is not an executable command`);
    if (task.fields.expected_exit && !/^-?\d+$/.test(task.fields.expected_exit)) errors.push(`${task.heading_id} expected_exit must be an integer`);
    const dependencies = identifiers(task.fields.依赖 ?? "", /\bT\d+\b/g);
    const frs = identifiers(task.fields.FR ?? "", /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
    const acs = identifiers(task.fields.AC ?? "", /\bAC-?\d+\b/g);
    return Object.freeze({
      id: task.heading_id,
      order: index,
      fields: Object.freeze({ ...task.fields }),
      dependencies: Object.freeze(dependencies),
      frs: Object.freeze(frs),
      acs: Object.freeze(acs),
    });
  });
  const knownTasks = new Set(taskRows.map(({ id }) => id));
  for (const task of taskRows) {
    for (const dependency of task.dependencies) if (!knownTasks.has(dependency)) errors.push(`${task.id} has unknown dependency ${dependency}`);
  }
  if (cycleIn(taskRows)) errors.push("task dependency graph contains a cycle");

  const redIndexes = taskRows.filter((task) => /\bRED\b/i.test(parsedTasks[task.order].heading) && task.fields.expected_exit === "1").map(({ order }) => order);
  const greenIndexes = taskRows.filter((task) => /\bGREEN\b/i.test(parsedTasks[task.order].heading) && task.fields.expected_exit === "0").map(({ order }) => order);
  if (redIndexes.length === 0 || greenIndexes.length === 0 || Math.min(...redIndexes) >= Math.max(...greenIndexes)) {
    errors.push("behavior-changing work must show explicit RED before GREEN");
  }

  const acceptedFrs = identifiers(spec, /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
  const acceptedAcs = identifiers(spec, /\bAC-?\d+\b/g);
  const referencedFrs = [...new Set(taskRows.flatMap(({ frs }) => frs))];
  const referencedAcs = [...new Set(taskRows.flatMap(({ acs }) => acs))];
  for (const id of acceptedFrs) if (!referencedFrs.includes(id)) errors.push(`accepted FR has no task coverage: ${id}`);
  for (const id of referencedFrs) if (!acceptedFrs.includes(id)) errors.push(`task references unknown FR: ${id}`);
  for (const id of acceptedAcs) if (!referencedAcs.includes(id)) errors.push(`accepted AC has no task coverage: ${id}`);
  for (const id of referencedAcs) if (!acceptedAcs.includes(id)) errors.push(`task references unknown AC: ${id}`);

  const facts = Object.freeze({
    phase_count: phaseRows.length,
    task_count: taskRows.length,
    phase_rows: Object.freeze(phaseRows),
    task_rows: Object.freeze(taskRows),
    fr_coverage: Object.freeze({
      accepted_count: acceptedFrs.length,
      covered_count: acceptedFrs.filter((id) => referencedFrs.includes(id)).length,
      accepted_ids: Object.freeze(acceptedFrs),
      covered_ids: Object.freeze(referencedFrs.filter((id) => acceptedFrs.includes(id))),
    }),
    ac_coverage: Object.freeze({
      accepted_count: acceptedAcs.length,
      covered_count: acceptedAcs.filter((id) => referencedAcs.includes(id)).length,
      accepted_ids: Object.freeze(acceptedAcs),
      covered_ids: Object.freeze(referencedAcs.filter((id) => acceptedAcs.includes(id))),
    }),
    dependency_validation: Object.freeze({ valid: !errors.some((error) => /dependency|cycle/.test(error)) }),
    command_oracle_checks: Object.freeze({ valid: !errors.some((error) => /gate_cmd|expected_exit|RED before GREEN/.test(error)) }),
  });
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), facts });
}

export function buildPlanTaskContract({
  spec,
  plan,
  tasks,
  planRef,
  planHash,
  tasksRef,
  tasksHash,
} = {}) {
  if (typeof planRef !== "string" || !HASH.test(planHash ?? "")
      || typeof tasksRef !== "string" || !HASH.test(tasksHash ?? "")) {
    throw new TypeError("plan/tasks canonical ref/hash bindings are required");
  }
  if (sha256(plan ?? "") !== planHash || sha256(tasks ?? "") !== tasksHash) {
    throw new Error("plan/tasks content hash binding mismatch");
  }
  const validation = validatePlanTaskContract({ spec, plan, tasks });
  if (!validation.ok) throw new Error(`plan-task contract is incomplete: ${validation.errors.join("; ")}`);
  return Object.freeze({
    plan_ref: planRef,
    plan_hash: planHash,
    tasks_ref: tasksRef,
    tasks_hash: tasksHash,
    phase_rows: validation.facts.phase_rows,
    task_rows: validation.facts.task_rows,
    fr_coverage: validation.facts.fr_coverage,
    ac_coverage: validation.facts.ac_coverage,
    dependency_validation: validation.facts.dependency_validation,
    command_oracle_checks: validation.facts.command_oracle_checks,
    errors: Object.freeze([]),
  });
}

const V2_FR = /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g;
const V2_AC = /\bAC-?\d+\b/g;

function parseReferenceList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validReference(value) {
  return object(value) && ["spec", "plan", "tasks", "evidence"].includes(value.artifact_kind)
    && typeof value.ref === "string" && value.ref.trim() !== ""
    && HASH.test(value.hash ?? "") && typeof value.id === "string" && value.id.trim() !== "";
}

function v2TaskRows(tasks, errors) {
  const rows = taskBlocks(tasks).map((task, order) => {
    const f = task.fields;
    const id = task.heading_id;
    const refs = parseReferenceList(f.versioned_refs ?? f.versioned_refs_json);
    const row = {
      id,
      phase: f.Phase ?? f.phase ?? f["所属 Phase"] ?? "",
      goal: f.goal ?? f.Goal ?? "",
      versioned_refs: refs,
      knowledge: f.Knowledge ?? f.knowledge ?? "",
      boundary: f.boundary ?? f["边界"] ?? "",
      action: f.action ?? f["动作"] ?? "",
      command: f["test/acceptance command"] ?? f.gate_cmd ?? "",
      design_state: f.design_state ?? "",
      stop: f.STOP ?? f.stop ?? "",
      recovery: f.recovery ?? "",
      risk: f.risk ?? f["task risk"] ?? "",
    };
    for (const field of ["phase", "goal", "knowledge", "boundary", "action", "command", "stop", "recovery", "risk"]) {
      if (typeof row[field] !== "string" || row[field].trim() === "") errors.push(`${id} is missing authoritative ${field}`);
    }
    if (!["ready", "blocked-by-design"].includes(row.design_state)) errors.push(`${id} design_state must be ready or blocked-by-design`);
    if (!Array.isArray(refs) || refs.length === 0) errors.push(`${id} versioned_refs must be a non-empty JSON array`);
    for (const ref of refs) if (!validReference(ref)) errors.push(`${id} has an incomplete ReferenceBinding`);
    return row;
  });
  return rows;
}

/**
 * Strict v2 projection facts. v1 remains the read-only compatibility parser;
 * this function is used when a new build-plan publishes plan-task-contract.v2.
 */
export function validatePlanTaskContractV2({ spec, plan, tasks, specRef, specHash, planRef, planHash, tasksRef, tasksHash } = {}) {
  const errors = [];
  for (const [name, value] of Object.entries({ spec, plan, tasks })) {
    if (typeof value !== "string" || value.trim() === "") errors.push(`${name} content is required`);
  }
  for (const [name, ref, hash] of [["spec", specRef, specHash], ["plan", planRef, planHash], ["tasks", tasksRef, tasksHash]]) {
    if (typeof ref !== "string" || ref.trim() === "" || !HASH.test(hash ?? "")) errors.push(`${name} artifact ref/hash is required`);
    else if (sha256(({ spec, plan, tasks })[name] ?? "") !== hash) errors.push(`${name} content hash binding mismatch`);
  }
  const acceptedFrs = identifiers(spec ?? "", V2_FR);
  const acceptedAcs = identifiers(spec ?? "", V2_AC);
  if (acceptedFrs.length === 0) errors.push("spec must contain at least one accepted FR");
  if (acceptedAcs.length === 0) errors.push("spec must contain at least one accepted AC");
  if (/^\s*[-*]?\s*PFACT-[A-Z0-9]+\s*[—:-]/m.test(plan ?? "")) errors.push("plan must not copy product facts into an authoritative section");
  const rows = v2TaskRows(tasks ?? "", errors);
  const acceptedArtifacts = new Map([
    ["spec", { ref: specRef, hash: specHash }],
    ["plan", { ref: planRef, hash: planHash }],
    ["tasks", { ref: tasksRef, hash: tasksHash }],
  ]);
  for (const row of rows) {
    for (const binding of row.versioned_refs) {
      const accepted = acceptedArtifacts.get(binding.artifact_kind);
      if (accepted && (binding.ref !== accepted.ref || binding.hash !== accepted.hash)) {
        errors.push(`${row.id} has stale or mismatched ${binding.artifact_kind} ReferenceBinding`);
      }
    }
  }
  const ids = new Set(rows.map((row) => row.id));
  const dependencies = new Map();
  for (const row of rows) {
    const raw = taskBlocks(tasks ?? "").find((item) => item.heading_id === row.id)?.fields?.依赖 ?? "";
    const deps = identifiers(raw, /\bT\d+\b/g);
    dependencies.set(row.id, deps);
    for (const dependency of deps) if (!ids.has(dependency)) errors.push(`${row.id} has unknown dependency ${dependency}`);
  }
  if (cycleIn(rows.map((row) => ({ id: row.id, dependencies: dependencies.get(row.id) ?? [] })))) errors.push("task dependency graph contains a cycle");
  const referencedFrs = identifiers(tasks ?? "", V2_FR);
  const referencedAcs = identifiers(tasks ?? "", V2_AC);
  for (const id of acceptedFrs) if (!referencedFrs.includes(id)) errors.push(`accepted FR has no task coverage: ${id}`);
  for (const id of acceptedAcs) if (!referencedAcs.includes(id)) errors.push(`accepted AC has no task coverage: ${id}`);
  const value = {
    schema_version: "plan-task-contract.v2",
    spec: { artifact_kind: "spec", ref: specRef, hash: specHash, id: "SPEC" },
    plan: { artifact_kind: "plan", ref: planRef, hash: planHash, id: "PLAN" },
    tasks: { artifact_kind: "tasks", ref: tasksRef, hash: tasksHash, id: "TASKS" },
    task_rows: rows,
    fr_coverage: { accepted_count: acceptedFrs.length, covered_count: acceptedFrs.filter((id) => referencedFrs.includes(id)).length, accepted_ids: acceptedFrs, covered_ids: referencedFrs.filter((id) => acceptedFrs.includes(id)) },
    ac_coverage: { accepted_count: acceptedAcs.length, covered_count: acceptedAcs.filter((id) => referencedAcs.includes(id)).length, accepted_ids: acceptedAcs, covered_ids: referencedAcs.filter((id) => acceptedAcs.includes(id)) },
    dependency_validation: { valid: !errors.some((error) => /dependency|cycle/.test(error)) },
    errors,
  };
  if (errors.length === 0 && !validatePlanTaskV2Schema(value)) errors.push(...schemaErrors(validatePlanTaskV2Schema));
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), facts: Object.freeze(value) });
}

export function buildPlanTaskContractV2(options = {}) {
  const result = validatePlanTaskContractV2(options);
  if (!result.ok) throw new Error(`plan-task v2 contract is incomplete: ${result.errors.join("; ")}`);
  return Object.freeze(result.facts);
}
