import { createHash } from "node:crypto";
export { CURRENT_MATERIAL_FILES as MATERIAL_FILES } from "../task/material-workspace.mjs";

import Ajv2020 from "ajv/dist/2020.js";

import decisionEntrySchema from "../schemas/decision-entry.v1.json" with { type: "json" };
import ambiguityLedgerV2Schema from "../schemas/ambiguity-ledger.v2.json" with { type: "json" };
import planTaskV2Schema from "../schemas/plan-task-contract.v2.json" with { type: "json" };

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const HASH = /^[a-f0-9]{64}$/;
const ajv = new Ajv2020({ allErrors: true, strict: false, formats: { "date-time": true } });
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

const COMPLETION_EVIDENCE_KINDS = new Set([
  "task_record",
  "git_commit",
  "workspace_file",
  "test_run",
  "review_fact",
]);

function completionEvidenceRef(entry) {
  const kind = entry?.kind ?? "task_record";
  if (!COMPLETION_EVIDENCE_KINDS.has(kind)) return false;
  if (kind === "git_commit") {
    return typeof entry.ref === "string"
      && /^(?:git\/commits\/)?[a-f0-9]{40,64}$/.test(entry.ref);
  }
  return taskRelativeRef(entry.ref);
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
  if (value?.content_profile === "spec-content.v3" && !object(value.clarification)) {
    return result(["spec-clarify must record canonical trigger=false and reason when there is no ambiguity"]);
  }
  if (!validateAmbiguityLedgerV2Schema(value)) return result(schemaErrors(validateAmbiguityLedgerV2Schema));
  const errors = [];
  const subject = value.subject_binding;
  if (subject.artifact_kind !== "spec" || !taskRelativeRef(subject.ref)
      || subject.hash !== value.spec_content_hash) {
    errors.push("subject_binding must identify the exact task-relative spec bytes");
  }

  const scenarioIds = addUniqueIds(value.scenarios ?? [], "SCN", errors);
  const pfactIds = addUniqueIds(value.pfacts, "PFACT", errors);
  const frIds = addUniqueIds(value.frs, "FR", errors);
  const acIds = addUniqueIds(value.acs, "AC", errors);
  addUniqueIds(value.open_questions ?? [], "OPEN", errors);
  const allIds = new Set([...pfactIds, ...frIds, ...acIds]);

  if (value.content_profile === "spec-content.v3") {
    for (const id of frIds) {
      if (!/^FR-[A-Z][A-Z0-9]*-[0-9]{3}$/.test(id)) {
        errors.push(`new content profile FR must use FR-{DOMAIN}-{NNN}: ${id}`);
      }
    }
  }
  for (const pfact of value.pfacts) {
    for (const evidence of pfact.evidence ?? []) {
      if (!taskRelativeRef(evidence.ref)) errors.push(`PFACT ${pfact.id} evidence ref must be task-relative`);
    }
    for (const reference of pfact.affects_frs) validateBoundSpecReference(reference, frIds, subject, `PFACT ${pfact.id} FR reference`, errors);
    for (const reference of pfact.affects_acs) validateBoundSpecReference(reference, acIds, subject, `PFACT ${pfact.id} AC reference`, errors);
  }
  for (const fr of value.frs) {
    for (const reference of fr.pfact_refs) validateBoundSpecReference(reference, pfactIds, subject, `FR ${fr.id} PFACT reference`, errors);
    for (const reference of fr.scenario_refs ?? []) validateBoundSpecReference(reference, scenarioIds, subject, `FR ${fr.id} scenario reference`, errors);
    for (const reference of fr.ac_refs) validateBoundSpecReference(reference, acIds, subject, `FR ${fr.id} AC reference`, errors);
  }
  for (const ac of value.acs) {
    for (const reference of ac.fr_refs) validateBoundSpecReference(reference, frIds, subject, `AC ${ac.id} FR reference`, errors);
  }
  for (const risk of value.risks) {
    for (const id of risk.affected_ids) if (!allIds.has(id)) errors.push(`risk ${risk.id} affects unknown ID: ${id}`);
  }
  for (const question of value.open_questions ?? []) {
    for (const id of question.affected_ids) if (!allIds.has(id)) errors.push(`open question ${question.id} affects unknown ID: ${id}`);
  }
  const clarification = value.clarification;
  if ((value.open_questions ?? []).length > 0) {
    const sameAxis = object(clarification?.ask) && object(clarification?.wait) && object(clarification?.resume)
      && clarification.ask.axis === clarification.wait.axis
      && clarification.wait.axis === clarification.resume.axis;
    const ordered = clarification?.ask?.sequence === 1
      && clarification?.wait?.sequence === 2
      && clarification?.resume?.sequence === 3;
    const hostVisible = /^host-message:\/\/ask\//.test(clarification?.ask?.ref ?? "")
      && clarification?.wait?.status === "waiting-for-user"
      && /^host-message:\/\/reply\//.test(clarification?.wait?.reply_ref ?? "")
      && /^host-message:\/\/resume\//.test(clarification?.resume?.ref ?? "");
    if (!object(clarification)
        || clarification.component !== "spec-clarify"
        || clarification.status !== "executed"
        || !sameAxis || !ordered || !hostVisible) {
      errors.push("spec-clarify open questions require canonical host-visible ask -> wait -> resume facts and reason");
    }
  } else if (!object(clarification)
      || clarification.component !== "spec-clarify"
      || clarification.status !== "trigger=false"
      || typeof clarification.reason !== "string"
      || clarification.reason.trim() === "") {
    errors.push("spec-clarify must record canonical trigger=false and reason when there is no ambiguity");
  }
  if (value.content_profile === "spec-content.v3") {
    const referencedScenarios = new Set(value.frs.flatMap((fr) => (fr.scenario_refs ?? []).map((reference) => reference.id)));
    for (const id of scenarioIds) if (!referencedScenarios.has(id)) errors.push(`scenario has no FR coverage: ${id}`);
    const unresolvedIds = new Set([
      ...value.risks.flatMap((risk) => risk.affected_ids),
      ...(value.open_questions ?? []).flatMap((question) => question.affected_ids),
    ]);
    for (const pfact of value.pfacts) {
      if (pfact.status === "unknown" && !unresolvedIds.has(pfact.id)) {
        errors.push(`unknown PFACT must be bound to a RISK or OPEN card: ${pfact.id}`);
      }
    }
  }
  return result(errors);
}

const SPEC_CONTENT_V3_SECTIONS = Object.freeze([
  /^速读卡(?:（30 秒）)?$/,
  /^1\.\s+问题与紧迫性$/,
  /^2\.\s+背景、目标与范围$/,
  /^3\.\s+用户场景与状态覆盖$/,
  /^4\.\s+产品事实与假设（PFACT）$/,
  /^5\.\s+功能需求$/,
  /^6\.\s+模块划分$/,
  /^7\.\s+关键实体$/,
  /^8\.\s+数据和生命周期$/,
  /^9\.\s+兼容性预留$/,
  /^10\.\s+明确不做与默认必须成立$/,
  /^11\.\s+验收标准$/,
  /^12\.\s+风险、未决与交接$/,
  /^13\.\s+业务影响与回归范围$/,
]);
const LEGACY_SPEC_CONTENT_V3_SECTIONS = Object.freeze([
  /^速读卡(?:（30 秒）)?$/,
  /^1\.\s+问题与紧迫性$/,
  /^2\.\s+背景、目标与范围$/,
  /^3\.\s+用户场景与状态覆盖$/,
  /^4\.\s+产品事实与假设（PFACT）$/,
  /^5\.\s+功能需求$/,
  /^6\.\s+条件式业务合同$/,
  /^7\.\s+明确不做与默认必须成立$/,
  /^8\.\s+业务影响与回归范围$/,
  /^9\.\s+验收标准$/,
  /^10\.\s+风险、未决与交接$/,
]);

export function validateSpecContentProfile(markdown) {
  if (typeof markdown !== "string" || markdown.trim() === "") return result(["spec markdown is required"]);
  const errors = markdownStructureErrors(markdown, "spec");
  const residueText = withoutProgrammingFencedCode(markdown).replace(/`[^`\n]*`/g, "");
  if (/\{[^{}"':,\n]{1,120}\}/.test(residueText)) errors.push("spec contains an unresolved placeholder");
  if (/\[填写：[^\]\r\n]{1,120}\]/.test(residueText)) errors.push("spec contains an unresolved placeholder");
  if (/<!--[\s\S]*?-->/.test(markdown)) errors.push("spec contains an authoring comment");
  if (/^\s*(?:待补充|TBD|TODO)\s*$/mi.test(markdown)) errors.push("spec contains filler");
  if ((markdown.match(/^###\s+明确不做\s*$/gm) ?? []).length !== 1) {
    errors.push("spec must contain exactly one authoritative 明确不做 section");
  }
  if (/^###\s+假设\s*$/m.test(markdown)) errors.push("assumptions must be represented only as inferred PFACT");

  const sectionHeadings = markdownSections(markdown, 2).map(({ heading }) => heading);
  const sectionProfiles = [SPEC_CONTENT_V3_SECTIONS, LEGACY_SPEC_CONTENT_V3_SECTIONS];
  const matchingProfile = sectionProfiles.find((profile) =>
    profile.every((expected) => sectionHeadings.some((heading) => expected.test(heading))));
  if (!matchingProfile) {
    for (const expected of SPEC_CONTENT_V3_SECTIONS) {
      if (!sectionHeadings.some((heading) => expected.test(heading))) {
        errors.push(`spec-content.v3 section missing: ${expected.source}`);
      }
    }
  }
  for (const [label, pattern] of [
    ["SCN card", /^###\s+SCN-\d{3}(?:\s*[:：].*)?$/m],
    ["PFACT card", /^\s*-\s+\*\*PFACT-[A-Z0-9]+\*\*\s*[:：]/m],
    ["FR card", /^\s*-\s+\*\*FR-[A-Z][A-Z0-9]*-\d{3}\*\*\s*[:：]/m],
    ["AC card", /^\s*-\s+\[[ xX]\]\s+\*\*AC-[A-Z0-9]+\*\*\s*[:：]/m],
  ]) {
    if (!pattern.test(markdown)) errors.push(`spec-content.v3 is missing a ${label}`);
  }

  const tableBlocks = [];
  let current = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*\|.*\|\s*$/.test(line)) current.push(line);
    else if (current.length) {
      tableBlocks.push(current);
      current = [];
    }
  }
  if (current.length) tableBlocks.push(current);
  for (const table of tableBlocks) {
    if (table.length < 3) errors.push("spec contains an empty table");
    const widths = table.map((line) => line.split("|").length);
    if (new Set(widths).size !== 1) errors.push("spec contains an inconsistent table");
    if (Math.max(...widths) - 2 > 5) errors.push("spec table exceeds five columns");
  }

  const engineeringPatterns = [
    /^##+\s+(?:Code Anchors?|Implementation (?:Plan|Steps?)|工程方案|实现步骤)\b/im,
    /\b(?:gate_cmd|expected_exit|display_cmd|design_state)\b/,
    /`(?:src|core|lib|skills|tests)\/[^`]+`/,
    /`[^`\n]+\.(?:js|mjs|cjs|ts|tsx|py|go|rs)(?::[^`]*)?`/,
    /\breuse\s*(?:→|->)\s*extend\s*(?:→|->)\s*new\b/i,
  ];
  if (engineeringPatterns.some((pattern) => pattern.test(markdown))) {
    errors.push("spec contains plan/task engineering material");
  }
  return result(errors);
}

/**
 * A specification may be structurally valid while leaving the acceptance
 * meaning implicit.  Catch that at build-spec: implementation results and
 * evidence anchors belong to build-code/verify-code, but every AC must already
 * say what is being exercised and how the result will be judged.
 */
export function validateAcceptanceDesignMinimum(markdown) {
  if (typeof markdown !== "string" || markdown.trim() === "") {
    return result(["spec acceptance design requires readable markdown"]);
  }
  const lines = markdown.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^###\s+AC-[A-Za-z0-9_-]+\b/i.test(lines[index])
        || /^\s*[-*]\s+\[[ xX]\]\s+\*\*AC-[A-Za-z0-9_-]+\*\*/i.test(lines[index])) {
      starts.push(index);
    }
  }
  if (starts.length === 0) return result([]);
  const errors = [];
  for (const [position, start] of starts.entries()) {
    const end = starts[position + 1] ?? lines.length;
    const block = lines.slice(start, end).join("\n");
    const id = lines[start].match(/\bAC-[A-Za-z0-9_-]+\b/i)?.[0] ?? `AC-${position + 1}`;
    const body = block.replace(/^[^\n]*\n?/, "").trim();
    const verificationIndex = body.search(/(?:^|\n)\s*(?:验证|验收|判定|oracle|verification|assertion|test\s+oracle)\s*[:：]/im);
    const scenarioText = (verificationIndex >= 0 ? body.slice(0, verificationIndex) : body).trim();
    if (scenarioText.length < 8) {
      errors.push(`${id} acceptance design is missing an observable scenario`);
    }
    if (!/(?:^|\n)\s*(?:验证|验收|判定|oracle|verification|assertion|test\s+oracle)\s*[:：]/im.test(block)) {
      errors.push(`${id} acceptance design is missing an oracle/verification rule`);
    }
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
const PLAN_SECTIONS_V3 = Object.freeze([
  "Quick Read",
  "Technical Context",
  "Code Anchors",
  "Solution Design",
  "File Boundary",
  "Technical Decisions",
  "Test Strategy",
  "Rollback and Recovery",
  "Implementation Order",
  "Dependencies and Parallelism",
  "Requirement and Verification Traceability",
  "Governance Synchronization Matrix",
  "Constitution Check",
]);
const PLAN_SECTION_ALIASES = Object.freeze({
  "Quick Read": [/速读卡/, /Quick Read/i],
  "Technical Context": [/Technical Context/i],
  "Global Constraints": [/Global Constraints/i, /全局约束/],
  "Code Anchors": [/Code Anchors/i, /代码锚点/],
  "Solution Design": [/Solution Design/i, /方案设计/],
  "File Boundary": [/File Boundary/i, /文件边界/],
  "Technical Decisions": [/Technical Decisions/i, /技术决策/],
  "Modules, Interfaces, and Data Contracts": [/Modules.*Interfaces.*Data Contracts/i, /模块职责与接口/],
  "Implementation Order": [/Implementation Order/i, /依赖与并行/, /实施顺序/],
  "Dependencies and Parallelism": [/Dependencies and Parallelism/i, /依赖与并行/],
  "Test Strategy": [/Test Strategy/i, /场景优先级与独立测试/, /测试策略/],
  "Rollback and Recovery": [/Rollback and Recovery/i, /风险与回滚/],
  "FR to AC to Step Traceability": [/FR to AC to Step Traceability/i, /FR.*AC.*Step.*追踪/i],
  "Requirement and Verification Traceability": [/Requirement and Verification Traceability/i, /需求与验证追踪/],
  "Governance Synchronization Matrix": [/Governance Synchronization Matrix/i, /治理同步矩阵/],
  "Constitution Check": [/Constitution Check/i, /宪法逐项检查/],
  "Complexity Trade-offs": [/Complexity Trade-offs/i, /候选方案.*取舍.*复杂度/],
});
const PHASE_FIELDS = Object.freeze(["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP"]);
const PHASE_FIELDS_V3 = Object.freeze([
  "Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP", "Done", "Risks and rollback",
]);
const TASK_FIELDS = Object.freeze([
  "ID", "动作", "精确文件", "输入", "输出", "依赖", "并行",
  "FR", "AC", "gate_cmd", "expected_exit", "oracle", "evidence_path",
]);
const TASK_FIELDS_V3 = Object.freeze([
  "ID", "Phase", "goal", "design_state", "versioned_refs", "输入", "依赖", "并行",
  "FR", "AC", "动作", "精确文件", "boundary", "输出", "Knowledge",
  "verification_role", "paired_task", "gate_cmd", "expected_exit", "oracle",
  "evidence_path", "STOP", "recovery", "task risk",
]);
const PLAN_TASK_V3 = "plan-task.v3";
const CURRENT_CONSTITUTION_CLAUSE_IDS = Object.freeze([
  // Deliberate governance snapshot: update this list with constitution-checklist.md.
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10",
  "Q1", "Q2", "Q3",
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
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
  const lines = document.split(/\r?\n/);
  const starts = [];
  let phase = null;
  for (let index = 0; index < lines.length; index += 1) {
    const phaseMatch = lines[index].match(/^##\s+(Phase\s+.+?)\s*$/);
    if (phaseMatch) phase = phaseMatch[1];
    const taskMatch = lines[index].match(/^####\s+(T\d+\b.*?)\s*$/);
    if (taskMatch) starts.push({ index, heading: taskMatch[1], phase });
  }
  return starts.map((entry) => {
    let end = lines.length;
    for (let index = entry.index + 1; index < lines.length; index += 1) {
      if (/^#{1,4}\s+/.test(lines[index])) {
        end = index;
        break;
      }
    }
    const body = lines.slice(entry.index + 1, end).join("\n").trim();
    const fields = {};
    for (const line of body.split(/\r?\n/)) {
      const match = line.match(/^\s*-\s+\*\*([^*]+)\*\*\s*[:：]\s*(.*)$/);
      if (match) fields[match[1].trim()] = match[2].trim();
    }
    return {
      heading: entry.heading,
      heading_id: entry.heading.match(/^(T\d+)/)?.[1],
      phase: entry.phase,
      body,
      fields,
    };
  });
}

function identifiers(text, pattern) {
  return [...new Set(text.match(pattern) ?? [])];
}

function hasExecutableCommand(value) {
  const command = value.trim().replace(/^`([\s\S]*)`$/, "$1");
  return /^(?:mkdir\b|npx\b|npm\b|pnpm\b|yarn\b|bun\b|node\b|python\b|pytest\b|go\b|cargo\b|make\b|bash\b|sh\b|git\b|\.\/)/.test(command);
}

function templateVersion(document) {
  return document.match(/^\s*(?:-\s+)?\*\*Template version\*\*\s*[:：]\s*`?([^`\s]+)`?\s*$/mi)?.[1] ?? null;
}

function placeholderOrTemplateNoise(document) {
  if (/<!--[\s\S]*?-->/.test(document)) return true;
  const prose = withoutProgrammingFencedCode(document)
    .replace(/`[^`\n]*`/g, "");
  return /\{[^{}\n]{1,120}\}|\[填写：[^\]\r\n]{1,120}\]|^\s*(?:待补充|TBD|TODO)\s*$/mi.test(prose);
}

function withoutFencedCode(document) {
  return document.replace(/^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$/gm, "");
}

function withoutProgrammingFencedCode(document) {
  return document.replace(
    /^(?:```|~~~)(?:javascript|js|jsx|typescript|ts|tsx|python|py|go|rust|rs|java|c|cpp|csharp|cs|ruby|rb|php|swift|kotlin|kt|shell|sh|bash|zsh|powershell|ps1|json|yaml|yml|toml|sql|html|css|scss|xml)\s*\n[\s\S]*?^(?:```|~~~)\s*$/gmi,
    "",
  );
}

function markdownStructureErrors(document, label) {
  const errors = [];
  const lines = withoutFencedCode(document).split(/\r?\n/);
  let previousLevel = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!heading) continue;
    const level = heading[1].length;
    if (previousLevel && level > previousLevel + 1) {
      errors.push(`${label} heading level jumps from ${previousLevel} to ${level}: ${heading[2]}`);
    }
    previousLevel = level;
    let next = index + 1;
    while (next < lines.length && lines[next].trim() === "") next += 1;
    const nextHeading = lines[next]?.match(/^(#{1,6})\s+/);
    if (nextHeading && nextHeading[1].length <= level) {
      errors.push(`${label} heading is empty: ${heading[2]}`);
    }
  }
  return errors;
}

function parseConstitutionBinding(document) {
  const value = document.match(/^\s*-\s+\*\*Constitution binding\*\*\s*[:：]\s*`(\{.*\})`\s*$/mi)?.[1];
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function phaseRows(document, fields, errors, label) {
  const phases = markdownSections(document, 2, "Phase ");
  if (phases.length === 0) errors.push(`${label} must contain at least one Phase`);
  return phases.map((phase) => {
    const sections = new Map(markdownSections(`## ${phase.heading}\n${phase.body}`, 3)
      .map((section) => [section.heading, section.body]));
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

function phaseChangePaths(filesBody) {
  return new Set(String(filesBody ?? "").split(/\r?\n/)
    .filter((line) => /\*\*(?:NEW|MODIFY)\*\*/i.test(line))
    .flatMap((line) => inlinePaths(line)));
}

function globalChangePaths(fileBoundaryBody) {
  const sections = markdownSections(`## File Boundary\n${fileBoundaryBody ?? ""}`, 3);
  return new Set(sections
    .filter(({ heading }) => /^(?:NEW|MODIFY)$/i.test(heading))
    .flatMap(({ body }) => inlinePaths(body)));
}

function boundaryPaths(value) {
  const declared = String(value ?? "").match(/(?:^|;)\s*(?:files|路径)\s*[:：]\s*([^;]+)/i)?.[1] ?? "";
  return inlinePaths(declared);
}

function oracleIdentity(value) {
  return String(value ?? "").replace(/^`|`$/g, "").match(/^([A-Z][A-Z0-9_-]+)\b/)?.[1] ?? null;
}

function normalizedCommand(value) {
  return String(value ?? "").trim().replace(/^`([\s\S]*)`$/, "$1");
}

function sameIds(left, right) {
  return [...left].sort().join("\0") === [...right].sort().join("\0");
}

function nAWithReason(value, kind = "") {
  const text = String(value ?? "").trim();
  if (!/^N\/A\s+[—-]\s+\S/i.test(text)) return false;
  return !kind || new RegExp(kind, "i").test(text);
}

function fieldValue(body, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return String(body ?? "").match(new RegExp(
    `^\\s*-\\s+\\*\\*${escaped}\\*\\*\\s*[:：]\\s*(.+?)\\s*$`,
    "mi",
  ))?.[1]?.trim() ?? null;
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

function parseJsonField(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value.trim().replace(/^`([\s\S]*)`$/, "$1"));
  } catch {
    return null;
  }
}

function completionZone(task) {
  const marker = /^#####\s+执行状态填写区（唯一完成权威）\s*$/m;
  const index = task.body.search(marker);
  return index < 0 ? null : task.body.slice(index);
}

function taskCompletionFact(task, completionEvidence) {
  const zone = completionZone(task);
  const checked = /-\s+\[[xX]\]\s+\*\*任务完成\*\*/.test(zone ?? "");
  const status = String(task.fields.status ?? "").replace(/^`|`$/g, "");
  const claimed = checked || status === "completed";
  const errors = [];
  if (zone === null) errors.push("missing unique completion status area");
  if (checked !== (status === "completed")) errors.push("completion checkbox and status must agree");
  const required = [
    "actual_changes", "executed_commands", "evidence_refs", "covered_ac",
    "review_fact", "completed_at",
  ];
  if (claimed) {
    for (const field of required) {
      const value = task.fields[field];
      if (typeof value !== "string" || value.trim() === "" || /^N\/A\b/i.test(value.trim())) {
        errors.push(`completed task is missing ${field}`);
      }
    }
  }
  const evidenceRefs = parseJsonField(task.fields.evidence_refs);
  if (claimed && (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0)) {
    errors.push("completed task evidence_refs must be a non-empty JSON array");
  }
  for (const [index, entry] of (Array.isArray(evidenceRefs) ? evidenceRefs : []).entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || !completionEvidenceRef(entry) || !HASH.test(entry.sha256 ?? "")) {
      errors.push(`evidence_refs[${index}] must contain a supported ref, optional kind, and sha256`);
      continue;
    }
    if (typeof completionEvidence === "function") {
      const authenticated = completionEvidence(entry, task.heading_id);
      if (typeof authenticated === "string") {
        if (sha256(authenticated) !== entry.sha256) errors.push(`evidence_refs[${index}] hash mismatch: ${entry.ref}`);
      } else if (!authenticated || authenticated.ok !== true) {
        errors.push(`evidence_refs[${index}] is missing: ${entry.ref}`);
      } else if (authenticated.sha256 !== entry.sha256) {
        errors.push(`evidence_refs[${index}] hash mismatch: ${entry.ref}`);
      }
    } else if (claimed) {
      errors.push(`evidence_refs[${index}] was not authenticated: ${entry.ref}`);
    }
  }
  const claimValid = !claimed || errors.length === 0;
  return Object.freeze({
    id: task.heading_id,
    checked,
    status: status || "pending",
    claimed_complete: claimed,
    claim_valid: claimValid,
    complete: claimed && claimValid,
    errors: Object.freeze(errors),
    evidence_refs: Object.freeze(Array.isArray(evidenceRefs) ? structuredClone(evidenceRefs) : []),
    actual_changes: task.fields.actual_changes ?? null,
    executed_commands: task.fields.executed_commands ?? null,
    covered_ac: Object.freeze(identifiers(task.fields.covered_ac ?? "", /\bAC-?\d+\b/g)),
    review_fact: task.fields.review_fact ?? null,
    completed_at: task.fields.completed_at ?? null,
  });
}

function sourceRows(document) {
  return [...String(document ?? "").matchAll(
    /^\|\s*([A-Z][A-Z0-9-]+)\s*\|\s*(SCN-\d+)\s*\|\s*(FR-[A-Z0-9-]+)\s*\|\s*(AC-?\d+)\s*\|\s*([^|]+)\|$/gm,
  )].map((match) => Object.freeze({
    source: match[1],
    scenario: match[2],
    fr: match[3],
    ac: match[4],
    tasks: Object.freeze(identifiers(match[5], /\bT\d+\b/g)),
  }));
}

function sourceCoverageFacts({ spec, plan, tasks, acceptedFrs, acceptedAcs, taskRows }) {
  const documents = [sourceRows(spec), sourceRows(plan), sourceRows(tasks)];
  const keys = [...new Set(documents.flatMap((rows) => rows.map(({ source }) => source)))];
  const missing = keys.filter((key) => documents.some((rows) => !rows.some(({ source }) => source === key)));
  const knownTasks = new Set(taskRows.map(({ id }) => id));
  const invalidRows = documents.flatMap((rows) => rows).filter((row) =>
    !acceptedFrs.includes(row.fr) || !acceptedAcs.includes(row.ac));
  const reverseInvalid = documents.flatMap((rows) => rows).filter((row) =>
    row.tasks.some((id) => !knownTasks.has(id)));
  return Object.freeze({
    source_count: keys.length,
    source_keys: Object.freeze(keys),
    missing_sources: Object.freeze(missing),
    orphan_sources: Object.freeze([...new Set(invalidRows.map(({ source }) => source))]),
    reverse_missing: Object.freeze([...new Set(reverseInvalid.map(({ source }) => source))]),
  });
}

export function resolvePhaseTaskIds({ plan, tasks, phaseId } = {}) {
  if (typeof plan !== "string" || typeof tasks !== "string" || typeof phaseId !== "string" || phaseId.trim() === "") {
    throw new TypeError("plan, tasks, and phaseId are required");
  }
  const planPhases = markdownSections(plan, 2, "Phase ").map(({ heading }) => heading);
  const taskPhases = markdownSections(tasks, 2, "Phase ").map(({ heading }) => heading);
  if (!sameIds(planPhases, taskPhases)) throw new Error("plan/tasks Phase headings or order differ");
  const ordinal = /^phase[-_. ]?(\d+)$/i.exec(phaseId)?.[1];
  const matchedPhase = planPhases.find((phase) => phase === phaseId)
    ?? (ordinal ? planPhases.find((phase) => new RegExp(`^Phase\\s+${Number(ordinal)}(?:\\b|\\s|[:：])`, "i").test(phase)) : undefined);
  if (!matchedPhase) throw new Error(`phase_id has no unique plan/tasks Phase mapping: ${phaseId}`);
  const rows = taskBlocks(tasks);
  const ids = rows.filter(({ phase }) => phase === matchedPhase).map(({ heading_id }) => heading_id);
  if (ids.length === 0 || ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) {
    throw new Error(`Phase has no unique non-empty Task IDs: ${matchedPhase}`);
  }
  for (const row of rows.filter(({ phase }) => phase === matchedPhase)) {
    if (row.fields.Phase !== undefined && row.fields.Phase !== matchedPhase) {
      throw new Error(`${row.heading_id} Phase field differs from its owning Phase`);
    }
  }
  return Object.freeze({ phase: matchedPhase, task_ids: Object.freeze(ids) });
}

export function validateTasksOnlyCompletionSeam({
  before,
  after,
  taskId,
  allowedTaskIds,
  requiredBindings = [],
  expectedReviewRef,
  completionEvidence,
} = {}) {
  if (typeof before !== "string" || typeof after !== "string"
      || (taskId !== undefined && typeof taskId !== "string")
      || (allowedTaskIds !== undefined && (!Array.isArray(allowedTaskIds)
        || allowedTaskIds.length === 0
        || allowedTaskIds.some((id) => typeof id !== "string")
        || new Set(allowedTaskIds).size !== allowedTaskIds.length))) {
    throw new TypeError("before and after are required; taskId must be a string when provided");
  }
  const beforeTasks = taskBlocks(before);
  const afterTasks = taskBlocks(after);
  const errors = [];
  if (!sameIds(beforeTasks.map(({ heading_id }) => heading_id), afterTasks.map(({ heading_id }) => heading_id))) {
    errors.push("tasks-only seam cannot add, remove, or reorder Task identities");
  }
  const zones = new Map();
  // `versioned_refs` is derived from the live plan/spec anchors. A legitimate
  // refresh is allowed only for the tasks explicitly in this completion seam;
  // unrelated task bindings remain visible so tampering cannot be masked.
  const derivedTaskIds = new Set(allowedTaskIds ?? (taskId ? [taskId] : []));
  const maskDerivedTaskMetadata = (document) => document.replace(
    /(^####\s+(T\d+)\b[^\n]*\n)([\s\S]*?)(?=^#{1,4}\s+|(?![\s\S]))/gm,
    (block, heading, id, body) => derivedTaskIds.has(id)
      ? `${heading}${body.replace(/^- \*\*versioned_refs\*\*：.*$/m, "- **versioned_refs**：<derived-from-live-plan>\n")}`
      : block,
  );
  const mask = (document, parsed, side) => {
    for (const task of parsed) {
      const zone = completionZone(task);
      if (zone === null) errors.push(`${task.heading_id} ${side} is missing the unique completion status area`);
      else zones.set(`${side}:${task.heading_id}`, zone);
    }
    return maskDerivedTaskMetadata(document).replace(
      /(^####\s+(T\d+)\b[^\n]*\n)([\s\S]*?)(?=^#{1,4}\s+|(?![\s\S]))/gm,
      (block, heading, id, body) => {
        const marker = body.search(/^#####\s+执行状态填写区（唯一完成权威）\s*$/m);
        return marker < 0 ? block : `${heading}${body.slice(0, marker)}##### EXECUTION_STATUS:${id}\n`;
      },
    );
  };
  if (mask(before, beforeTasks, "before") !== mask(after, afterTasks, "after")) {
    errors.push("tasks-only seam changed content outside execution status areas");
  }
  const changedIds = beforeTasks.map(({ heading_id }) => heading_id).filter((id) =>
    zones.get(`before:${id}`) !== zones.get(`after:${id}`));
  if (allowedTaskIds && !sameIds(changedIds, allowedTaskIds)) {
    errors.push(`tasks-only seam must change exactly ${allowedTaskIds.join(", ")}`);
  } else if (taskId && (changedIds.length !== 1 || changedIds[0] !== taskId)) {
    errors.push(`tasks-only seam must change only ${taskId}`);
  } else if (!taskId && changedIds.length === 0) {
    errors.push("tasks-only seam must change at least one Task completion area");
  }
  for (const changedId of changedIds) {
    const target = afterTasks.find(({ heading_id }) => heading_id === changedId);
    const targetFact = target ? taskCompletionFact(target, completionEvidence) : null;
    if (!targetFact?.claimed_complete
        || targetFact.errors.length > 0) {
      errors.push(`${changedId} completion area is not structurally complete`);
      continue;
    }
    const bindings = new Map(targetFact.evidence_refs.map((entry) => [entry.ref, entry.sha256]));
    for (const required of requiredBindings) {
      if (!required || typeof required.ref !== "string" || !HASH.test(required.sha256 ?? "")
          || bindings.get(required.ref) !== required.sha256) {
        errors.push(`${changedId} completion evidence does not bind ${required?.ref ?? "required fact"}`);
      }
    }
    const reviewRef = parseJsonField(targetFact.review_fact)?.ref
      ?? String(targetFact.review_fact ?? "").replace(/^`|`$/g, "");
    if (expectedReviewRef !== undefined && reviewRef !== expectedReviewRef) {
      errors.push(`${changedId} review_fact does not bind the Phase review`);
    }
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    changed_task_ids: Object.freeze(changedIds),
    requires_repeat_review: false,
  });
}

export function validatePlanTaskContract({
  spec, plan, tasks, completionEvidence,
} = {}) {
  const errors = [];
  for (const [name, value] of Object.entries({ spec, plan, tasks })) {
    if (typeof value !== "string" || value.trim() === "") errors.push(`${name} content is required`);
  }
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors), facts: null });
  const planVersion = templateVersion(plan);
  const tasksVersion = templateVersion(tasks);
  const isV3 = planVersion === PLAN_TASK_V3 || tasksVersion === PLAN_TASK_V3;
  for (const [label, version] of [["plan", planVersion], ["tasks", tasksVersion]]) {
    if (version !== null && version !== PLAN_TASK_V3) {
      errors.push(`${label} uses unsupported explicit template version: ${version}`);
    }
  }
  if (isV3 && (planVersion !== PLAN_TASK_V3 || tasksVersion !== PLAN_TASK_V3)) {
    errors.push("plan and tasks must use the same plan-task.v3 template version");
  }
  if (isV3 && (placeholderOrTemplateNoise(plan) || placeholderOrTemplateNoise(tasks))) {
    errors.push("generated plan/tasks must not retain placeholders, template comments, or filler");
  }
  if (isV3) {
    errors.push(...markdownStructureErrors(plan, "plan"), ...markdownStructureErrors(tasks, "tasks"));
  }

  const planSections = markdownSections(plan, 2);
  const findPlanSection = (name) => planSections.find(({ heading }) =>
    PLAN_SECTION_ALIASES[name].some((pattern) => pattern.test(heading)));
  for (const heading of isV3 ? PLAN_SECTIONS_V3 : PLAN_SECTIONS) {
    const section = findPlanSection(heading);
    const body = section?.body ?? (heading === "Rollback and Recovery" && /风险与回滚/.test(plan) ? "declared per Phase" : undefined);
    if (body === undefined || body.trim() === "") errors.push(`plan section missing or empty: ${heading}`);
  }
  const constitution = findPlanSection("Constitution Check")?.body ?? "";
  const constitutionIds = identifiers(constitution, /\b(?:F(?:10|[1-9])|Q[1-3]|S[1-8])\b/g);
  if (isV3) {
    const binding = parseConstitutionBinding(plan);
    if (!binding || binding.artifact_kind !== "constitution"
        || typeof binding.ref !== "string" || binding.ref.trim() === ""
        || !HASH.test(binding.hash ?? "") || typeof binding.id !== "string"
        || typeof binding.version !== "string" || !Number.isInteger(binding.clause_count)) {
      errors.push("Constitution Check requires a complete ref/hash/id/version/clause_count binding");
    } else {
      const expectedClauseCount = CURRENT_CONSTITUTION_CLAUSE_IDS.length;
      const missingClauseIds = CURRENT_CONSTITUTION_CLAUSE_IDS.filter((id) => !constitutionIds.includes(id));
      if (binding.clause_count !== expectedClauseCount
          || constitutionIds.length !== expectedClauseCount
          || missingClauseIds.length > 0) {
        errors.push(
          `Constitution Check must preserve the current clause snapshot (${CURRENT_CONSTITUTION_CLAUSE_IDS.join(", ")}); `
          + `binding declares ${binding.clause_count}, document contains ${constitutionIds.length}, `
          + `missing ${missingClauseIds.join(", ") || "none"}`,
        );
      }
    }
    const quickRead = findPlanSection("Quick Read")?.body ?? "";
    if (!/^\s*-\s+\*\*Non-goals\*\*\s*[:：]/mi.test(quickRead)
        || !/来源\s*[:：]|source\s*[:：]/i.test(quickRead)) {
      errors.push("plan Non-goals must preserve accepted source refs");
    }
    if (/^##\s+Verification Mapping\s*$/mi.test(plan)) {
      errors.push("plan-task.v3 uses one Requirement and Verification Traceability authority");
    }
    const globalConstraints = markdownSections(
      `## Technical Context\n${findPlanSection("Technical Context")?.body ?? ""}`,
      3,
    ).find(({ heading }) => /^Global Constraints$/i.test(heading));
    if (!globalConstraints || globalConstraints.body.trim() === "") {
      errors.push("Technical Context is missing a non-empty Global Constraints subsection");
    }
    const decisions = markdownSections(
      `## Technical Decisions\n${findPlanSection("Technical Decisions")?.body ?? ""}`,
      3,
    ).filter(({ heading }) => /^DEC-[A-Z0-9]+/i.test(heading));
    for (const decision of decisions) {
      const selected = fieldValue(decision.body, "Selected");
      if (!selected) {
        errors.push(`${decision.heading} is missing Selected`);
        continue;
      }
      if (/\bnew\b/i.test(selected)) {
        for (const question of ["F10 real threat", "F10 existing cover", "F10 bypassable", "F10 maintenance cost"]) {
          if (!fieldValue(decision.body, question)) errors.push(`${decision.heading} new mechanism is missing ${question}`);
        }
      }
    }
    const rollback = findPlanSection("Rollback and Recovery")?.body ?? "";
    const riskHandoff = markdownSections(
      `## Rollback and Recovery\n${rollback}`,
      3,
    ).find(({ heading }) => /^Engineering Risk Handoff$/i.test(heading))?.body;
    if (!riskHandoff) errors.push("Rollback and Recovery is missing Engineering Risk Handoff");
    for (const field of [
      "Affected IDs", "Trigger", "Consequence", "Mitigation or STOP",
      "Handling Stage", "Verification",
    ]) {
      if (!riskHandoff || !fieldValue(riskHandoff, field)) {
        errors.push(`Engineering Risk Handoff is missing ${field}`);
      }
    }
  } else if (constitutionIds.length !== CURRENT_CONSTITUTION_CLAUSE_IDS.length) {
    errors.push(`Constitution Check must enumerate all ${CURRENT_CONSTITUTION_CLAUSE_IDS.length} clauses; found ${constitutionIds.length}`);
  }

  const planPhaseRows = phaseRows(plan, isV3 ? PHASE_FIELDS_V3 : PHASE_FIELDS, errors, "plan");

  const parsedTasks = taskBlocks(tasks);
  if (parsedTasks.length === 0) errors.push("tasks document has no task blocks");
  const headingIds = parsedTasks.map(({ heading_id }) => heading_id);
  const duplicateIds = headingIds.filter((id, index) => headingIds.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`duplicate task ID: ${[...new Set(duplicateIds)].join(", ")}`);
  const taskRows = parsedTasks.map((task, index) => {
    for (const field of isV3 ? TASK_FIELDS_V3 : TASK_FIELDS) {
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
      phase: task.phase,
      fields: Object.freeze({ ...task.fields }),
      dependencies: Object.freeze(dependencies),
      frs: Object.freeze(frs),
      acs: Object.freeze(acs),
    });
  });
  const knownTasks = new Set(taskRows.map(({ id }) => id));
  for (const task of taskRows) {
    for (const dependency of task.dependencies) {
      if (!knownTasks.has(dependency)) errors.push(`${task.id} has unknown dependency ${dependency}`);
      else if (isV3 && taskRows.find(({ id }) => id === dependency).order >= task.order) {
        errors.push(`${task.id} dependency ${dependency} must appear before its consumer`);
      }
    }
  }
  if (cycleIn(taskRows)) errors.push("task dependency graph contains a cycle");

  if (isV3) {
    const tasksPhaseRows = phaseRows(tasks, PHASE_FIELDS_V3, errors, "tasks");
    if (planPhaseRows.length !== tasksPhaseRows.length) {
      errors.push("plan/tasks Phase counts must match");
    }
    for (const [index, planPhase] of planPhaseRows.entries()) {
      const taskPhase = tasksPhaseRows[index];
      if (!taskPhase || taskPhase.phase !== planPhase.phase) {
        errors.push(`tasks Phase must match plan Phase at position ${index + 1}`);
        continue;
      }
      if (taskPhase.fields.Files !== planPhase.fields.Files) {
        errors.push(`${planPhase.phase} Files must be copied byte-for-byte from plan to tasks`);
      }
    }
    const planPhaseByName = new Map(planPhaseRows.map((row) => [row.phase, row]));
    const taskPathsById = new Map();
    for (const task of taskRows) {
      if (task.fields.Phase !== task.phase) errors.push(`${task.id} Phase field must match its owning Phase heading`);
      const allowed = phaseChangePaths(planPhaseByName.get(task.phase)?.fields.Files);
      const taskPaths = new Set([
        ...inlinePaths(task.fields["精确文件"]),
        ...boundaryPaths(task.fields.boundary),
      ]);
      if (taskPaths.size === 0) errors.push(`${task.id} must declare at least one exact backticked file`);
      taskPathsById.set(task.id, taskPaths);
      for (const file of taskPaths) {
        if (!allowed.has(file)) errors.push(`${task.id} file/boundary is outside ${task.phase} NEW/MODIFY: ${file}`);
      }
    }
    const phaseUnion = new Set(planPhaseRows.flatMap((row) => [...phaseChangePaths(row.fields.Files)]));
    const globalUnion = globalChangePaths(findPlanSection("File Boundary")?.body);
    for (const file of phaseUnion) {
      if (!globalUnion.has(file)) errors.push(`global File Boundary is missing Phase NEW/MODIFY file: ${file}`);
    }
    for (const file of globalUnion) {
      if (!phaseUnion.has(file)) errors.push(`global File Boundary adds a file outside Phase NEW/MODIFY: ${file}`);
    }
    for (const phase of planPhaseRows) {
      for (const file of phaseChangePaths(phase.fields.Files)) {
        const owners = taskRows.filter((task) =>
          task.phase === phase.phase && taskPathsById.get(task.id)?.has(file));
        if (owners.length === 0) errors.push(`${phase.phase} planned file has no owning task: ${file}`);
      }
    }
    for (let left = 0; left < taskRows.length; left += 1) {
      if (!/(?:^|\s)(?:是|\[P\]|yes)(?:\s|$)/i.test(taskRows[left].fields.并行 ?? "")) continue;
      const leftFiles = taskPathsById.get(taskRows[left].id) ?? new Set();
      for (let right = left + 1; right < taskRows.length; right += 1) {
        if (taskRows[right].phase !== taskRows[left].phase
            || !/(?:^|\s)(?:是|\[P\]|yes)(?:\s|$)/i.test(taskRows[right].fields.并行 ?? "")) continue;
        const overlap = [...(taskPathsById.get(taskRows[right].id) ?? [])].filter((file) => leftFiles.has(file));
        if (overlap.length) errors.push(`parallel tasks ${taskRows[left].id}/${taskRows[right].id} overlap files: ${overlap.join(", ")}`);
      }
    }
    for (const task of taskRows) {
      const roleValue = task.fields.verification_role;
      const role = ["RED", "GREEN"].includes(roleValue)
        ? roleValue
        : nAWithReason(roleValue, "(?:non-behavior|非行为变更)") ? "N/A" : null;
      if (!role) errors.push(`${task.id} verification_role must be RED, GREEN, or N/A — non-behavior change: reason`);
      if (role === "RED" && (!/^-?\d+$/.test(task.fields.expected_exit ?? "") || Number(task.fields.expected_exit) === 0)) {
        errors.push(`${task.id} RED expected_exit must be a non-zero integer`);
      }
      if (role === "GREEN" && task.fields.expected_exit !== "0") errors.push(`${task.id} GREEN expected_exit must be 0`);
      if (role === "N/A") {
        if (!nAWithReason(task.fields.paired_task)) errors.push(`${task.id} non-behavior task paired_task requires N/A — reason`);
        if (task.fields.expected_exit !== "0") errors.push(`${task.id} non-behavior task expected_exit must be 0`);
      }
      if (role === "RED" || role === "GREEN") {
        const pair = taskRows.find(({ id }) => id === task.fields.paired_task);
        const expectedRole = role === "RED" ? "GREEN" : "RED";
        if (!pair || pair.fields.verification_role !== expectedRole || pair.fields.paired_task !== task.id) {
          errors.push(`${task.id} must have a reciprocal ${expectedRole} paired_task`);
        } else {
          if (normalizedCommand(task.fields.gate_cmd) !== normalizedCommand(pair.fields.gate_cmd)) {
            errors.push(`${task.id}/${pair.id} RED/GREEN must use the same gate_cmd`);
          }
          const taskOracle = oracleIdentity(task.fields.oracle);
          const pairOracle = oracleIdentity(pair.fields.oracle);
          if (!taskOracle || taskOracle !== pairOracle) {
            errors.push(`${task.id}/${pair.id} RED/GREEN must use the same oracle identity`);
          }
          if (task.phase !== pair.phase) errors.push(`${task.id}/${pair.id} RED/GREEN must use the same Phase`);
          if (!sameIds(task.frs, pair.frs)) errors.push(`${task.id}/${pair.id} RED/GREEN must use the same FR IDs`);
          if (!sameIds(task.acs, pair.acs)) errors.push(`${task.id}/${pair.id} RED/GREEN must use the same AC IDs`);
          if (role === "RED" && !pair.dependencies.includes(task.id)) {
            errors.push(`${pair.id} GREEN must depend on ${task.id} RED`);
          }
          if (role === "RED" && task.order >= pair.order) errors.push(`${task.id} RED must appear before ${pair.id} GREEN`);
        }
      }
    }
  } else {
    const redIndexes = taskRows.filter((task) => /\bRED\b/i.test(parsedTasks[task.order].heading) && Number(task.fields.expected_exit) !== 0).map(({ order }) => order);
    const greenIndexes = taskRows.filter((task) => /\bGREEN\b/i.test(parsedTasks[task.order].heading) && task.fields.expected_exit === "0").map(({ order }) => order);
    if (redIndexes.length === 0 || greenIndexes.length === 0 || Math.min(...redIndexes) >= Math.max(...greenIndexes)) {
      errors.push("behavior-changing work must show explicit RED before GREEN");
    }
  }

  const acceptedFrs = identifiers(spec, /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
  const acceptedAcs = identifiers(spec, /\bAC-?\d+\b/g);
  if (isV3 && acceptedFrs.length === 0) errors.push("plan-task.v3 spec must contain at least one accepted FR");
  if (isV3 && acceptedAcs.length === 0) errors.push("plan-task.v3 spec must contain at least one accepted AC");
  const referencedFrs = [...new Set(taskRows.flatMap(({ frs }) => frs))];
  const referencedAcs = [...new Set(taskRows.flatMap(({ acs }) => acs))];
  for (const id of acceptedFrs) if (!referencedFrs.includes(id)) errors.push(`accepted FR has no task coverage: ${id}`);
  for (const id of referencedFrs) if (!acceptedFrs.includes(id)) errors.push(`task references unknown FR: ${id}`);
  for (const id of acceptedAcs) if (!referencedAcs.includes(id)) errors.push(`accepted AC has no task coverage: ${id}`);
  for (const id of referencedAcs) if (!acceptedAcs.includes(id)) errors.push(`task references unknown AC: ${id}`);

  const completionTasks = parsedTasks.map((task) => taskCompletionFact(task, completionEvidence));
  const facts = Object.freeze({
    template_version: isV3 ? PLAN_TASK_V3 : "legacy-v1",
    phase_count: planPhaseRows.length,
    task_count: taskRows.length,
    phase_rows: Object.freeze(planPhaseRows.map((row) => Object.freeze({
      phase: row.phase,
      fields: Object.freeze(row.fields),
    }))),
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
    command_oracle_checks: Object.freeze({
      valid: !errors.some((error) => /gate_cmd|expected_exit|RED before GREEN|oracle|paired_task|RED\/GREEN|GREEN must depend/.test(error)),
    }),
    task_completion: Object.freeze({
      total_count: completionTasks.length,
      claimed_completed_count: completionTasks.filter(({ claimed_complete }) => claimed_complete).length,
      completed_count: completionTasks.filter(({ complete }) => complete).length,
      pending_ids: Object.freeze(completionTasks.filter(({ complete }) => !complete).map(({ id }) => id)),
      invalid_completed_ids: Object.freeze(completionTasks.filter(({ claimed_complete, complete }) => claimed_complete && !complete).map(({ id }) => id)),
      tasks: Object.freeze(completionTasks),
    }),
    source_coverage: sourceCoverageFacts({
      spec, plan, tasks, acceptedFrs, acceptedAcs, taskRows,
    }),
  });
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), facts });
}

export function validateExecutablePlanTaskMinimum({ spec, plan, tasks } = {}) {
  const errors = [];
  const concreteFile = (value) => {
    const path = String(value).trim();
    return path !== ""
      && !/^(?:N\/A|none|无|待定|TBD|TODO)$/i.test(path)
      && !path.startsWith("/")
      && !path.endsWith("/")
      && !/[*?[\]{}]/.test(path)
      && path.split("/").every((part) => part !== "" && part !== "." && part !== "..")
      && /[^/]/.test(path);
  };
  const presentCommand = (value) => {
    const command = String(value ?? "").trim().replace(/^`([\s\S]*)`$/, "$1").trim();
    return command !== "" && !/^(?:N\/A|none|无|待定|TBD|TODO)$/i.test(command);
  };
  for (const [name, value] of Object.entries({ spec, plan, tasks })) {
    if (typeof value !== "string" || value.trim() === "") errors.push(`${name} content is required`);
  }
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors) });

  const parsedTasks = taskBlocks(tasks);
  if (parsedTasks.length === 0) errors.push("tasks document has no task blocks");
  const rows = parsedTasks.map((task, index) => {
    const id = task.heading_id;
    const dependencies = identifiers(task.fields.依赖 ?? "", /\bT\d+\b/g);
    const frs = identifiers(task.fields.FR ?? "", /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
    const acs = identifiers(task.fields.AC ?? "", /\bAC-?\d+\b/g);
    const files = new Set([
      ...inlinePaths(task.fields["精确文件"]),
      ...boundaryPaths(task.fields.boundary),
    ].filter(concreteFile));
    const plainFile = String(task.fields["精确文件"] ?? "").trim().replace(/^`|`$/g, "");
    if (concreteFile(plainFile)) files.add(plainFile);
    if (files.size === 0) errors.push(`${id ?? `task ${index + 1}`} must declare at least one exact file boundary`);
    if (!presentCommand(task.fields.gate_cmd)) errors.push(`${id ?? `task ${index + 1}`} gate_cmd is missing`);
    return {
      id,
      order: index,
      heading: task.heading,
      fields: task.fields,
      dependencies,
      frs,
      acs,
    };
  });
  const known = new Set(rows.map(({ id }) => id));
  for (const row of rows) {
    for (const dependency of row.dependencies) {
      if (!known.has(dependency)) errors.push(`${row.id} has unknown dependency ${dependency}`);
    }
  }
  if (cycleIn(rows)) errors.push("task dependency graph contains a cycle");

  const acceptedFrs = identifiers(spec, /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
  const acceptedAcs = identifiers(spec, /\bAC-?\d+\b/g);
  const referencedFrs = [...new Set(rows.flatMap(({ frs }) => frs))];
  const referencedAcs = [...new Set(rows.flatMap(({ acs }) => acs))];
  if (acceptedFrs.length === 0) errors.push("spec has no accepted FR");
  if (acceptedAcs.length === 0) errors.push("spec has no accepted AC");
  for (const id of acceptedFrs) if (!referencedFrs.includes(id)) errors.push(`accepted FR has no task coverage: ${id}`);
  for (const id of referencedFrs) if (!acceptedFrs.includes(id)) errors.push(`task references unknown FR: ${id}`);
  for (const id of acceptedAcs) if (!referencedAcs.includes(id)) errors.push(`accepted AC has no task coverage: ${id}`);
  for (const id of referencedAcs) if (!acceptedAcs.includes(id)) errors.push(`task references unknown AC: ${id}`);

  const roles = rows.map((row) => ({
    ...row,
    role: ["RED", "GREEN"].includes(row.fields.verification_role)
      ? row.fields.verification_role
      : nAWithReason(row.fields.verification_role, "(?:non-behavior|非行为变更)") ? "N/A"
        : /\bRED\b/i.test(row.heading ?? "") ? "RED"
          : /\bGREEN\b/i.test(row.heading ?? "") ? "GREEN" : null,
  }));
  for (const row of roles) {
    if (row.role === null || row.role === "N/A") continue;
    const pair = row.fields.paired_task
      ? roles.find(({ id }) => id === row.fields.paired_task)
      : roles.find((candidate) => candidate.role !== row.role
        && (row.role === "RED"
          ? candidate.dependencies.includes(row.id)
          : row.dependencies.includes(candidate.id)));
    const expected = row.role === "RED" ? "GREEN" : "RED";
    const reciprocal = !row.fields.paired_task || pair?.fields.paired_task === row.id;
    if (!pair || pair.role !== expected || !reciprocal) {
      errors.push(`${row.id} behavior change must have a reciprocal ${expected} paired_task`);
    } else if (row.role === "GREEN" && !row.dependencies.includes(pair.id)) {
      errors.push(`${row.id} GREEN must depend on ${pair.id} RED`);
    }
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
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
    const normalized = value.trim().replace(/^`([\s\S]*)`$/, "$1");
    const parsed = JSON.parse(normalized);
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
  if (templateVersion(plan ?? "") === PLAN_TASK_V3 || templateVersion(tasks ?? "") === PLAN_TASK_V3) {
    const structural = validatePlanTaskContract({ spec, plan, tasks });
    for (const error of structural.errors) errors.push(`plan-task.v3: ${error}`);
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
