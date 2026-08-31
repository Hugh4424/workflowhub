import { createHash } from "node:crypto";
export { CURRENT_MATERIAL_FILES as MATERIAL_FILES } from "../task/material-workspace.mjs";

import Ajv2020 from "ajv/dist/2020.js";

import decisionEntrySchema from "../schemas/decision-entry.v1.json" with { type: "json" };
import ambiguityLedgerV2Schema from "../schemas/ambiguity-ledger.v2.json" with { type: "json" };
import planTaskV2Schema from "../schemas/plan-task-contract.v2.json" with { type: "json" };
import makeDecisionSteps from "../../workflows/make-decision/steps.json" with { type: "json" };

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const HASH = /^[a-f0-9]{64}$/;
// One AC grammar for every current-material parser. Keep the legacy compact
// forms (AC1/AC-001) while accepting the namespaced form used by spec-content
// v3 (AC-{DOMAIN}-{NNN}).
const ACCEPTANCE_CRITERION_SOURCE = String.raw`AC(?:\d{1,3}|-\d{1,3}|(?:-[A-Z][A-Z0-9]*)+-\d{1,3})`;
const ACCEPTANCE_CRITERION_ID = new RegExp(String.raw`\b${ACCEPTANCE_CRITERION_SOURCE}\b`, "g");
const ACCEPTANCE_CRITERION_EXACT = new RegExp(`^${ACCEPTANCE_CRITERION_SOURCE}$`);
const ajv = new Ajv2020({ allErrors: true, strict: false, formats: { "date-time": true } });
const validateEntrySchema = ajv.compile(decisionEntrySchema);
const validateAmbiguityLedgerV2Schema = ajv.compile(ambiguityLedgerV2Schema);
const validatePlanTaskV2Schema = ajv.compile(planTaskV2Schema);
const MAX_MAKE_DECISION_STEP_ID = Math.max(...makeDecisionSteps.steps.map(({ step_id }) => step_id));

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

function result(errors, extras = {}) {
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), ...extras });
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

export const UI_APPLICABILITY_INPUTS = Object.freeze([
  "raw_requirement",
  "project_inventory",
  "planned_or_changed_frontend_fact",
]);
export const UI_APPLICABILITY_RESULTS = Object.freeze(["ui", "non_ui", "unknown"]);
export const UI_STATE_CONTRACT_FIELDS = Object.freeze([
  "name",
  "interaction_flow",
  "visible_structure",
  "fixture_shape",
  "available_actions",
  "disabled_actions",
  "trigger",
  "recovery_or_exit",
  "permission_result",
  "responsive",
  "a11y",
  "preview_browser_screenshot_assertion",
]);
export const UI_CONTRACT_FIELDS = Object.freeze([
  "page_or_region",
  "design_status",
  "missing_items",
  "fallback_visual_basis",
  "constraints",
  "assumptions",
  "rework_risk",
  "human_confirmation",
  "current_material_ref",
  "design_revision",
  "visible_labels",
  "preview_refs",
  "fixture_refs",
  "viewport_refs",
  "screenshot_refs",
]);
export const UI_COMPONENT_QUALITY_FIELDS = Object.freeze([
  "component_quality_map",
  "real_consumer",
  "state_owner",
  "typed_view_model",
  "css_token_owner",
  "story_or_test_update",
]);
export const COMPONENT_QUALITY_ACTIONS = Object.freeze([
  "reuse",
  "modify",
  "extend-state-or-variant",
  "add-local",
  "extract-shared",
  "remove-after-no-consumers",
]);

/**
 * The build-spec UI design loop is a small fact contract, not a second
 * workflow or a persisted state machine.  These values describe the fact
 * recorded in the current four materials after each design observation.
 */
export const UI_DESIGN_LOOP_STATES = Object.freeze([
  "preview_ready",
  "preview_unavailable",
  "design_prompt_ready",
  "external_design_pending",
  "external_design_returned",
  "external_design_cancelled",
  "external_design_not_returned",
  "external_design_version_mismatch",
  "human_approved",
  "human_acknowledged",
  "human_not_approved",
]);

export const UI_DESIGN_PROMPT_FIELDS = Object.freeze([
  "page_or_region",
  "interactions",
  "states",
  "visible_labels",
]);

const UI_DESIGN_ACTION_LABELS = Object.freeze({
  preview_ready: ["确认设计", "需要修改"],
  preview_unavailable: ["重新读取", "生成设计提示词", "继续并记录风险"],
  design_prompt_ready: ["取消"],
  external_design_pending: ["未返回", "取消"],
  external_design_returned: ["确认设计", "需要修改"],
  external_design_cancelled: ["继续并记录风险"],
  external_design_not_returned: ["重新生成设计提示词", "继续并记录风险"],
  external_design_version_mismatch: ["重新读取并确认"],
});

const UI_DESIGN_STATUSES = new Set(["ready", "not_ready", "unknown", "unavailable"]);
const UI_CONFIRMATION_RESULTS = new Set(["approved", "acknowledged", "not_approved"]);
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

function versionFact(value) {
  if (nonEmptyString(value)) return !UNKNOWN_LITERAL.test(value.trim());
  return object(value) && (
    nonEmptyString(value.version)
    || (MISSING_FACT_STATUSES.has(String(value.status ?? "").toLowerCase()) && nonEmptyString(value.reason))
  );
}

function resolvedConsumer(value) {
  return nonEmptyString(value) && !UNKNOWN_LITERAL.test(value.trim());
}

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

function collectionFact(value, { allowEmpty = false } = {}) {
  if (Array.isArray(value)) {
    if (value.length === 0) return allowEmpty;
    return value.every((entry) => explicitFact(entry));
  }
  return explicitFact(value);
}

function factList(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function unknownFact(reason) {
  return Object.freeze({ status: "unknown", reason });
}

function knownOrUnknown(value, reason) {
  return explicitFact(value) ? value : unknownFact(reason);
}

// Inventory values may be lists (routes, component candidates) or small
// structured maps, not only scalar facts. Preserve those values when they are
// present; otherwise keep a reasoned unknown fact instead of silently dropping
// the legacy-project surface.
function inventoryFact(value, reason) {
  if (Array.isArray(value) && value.length > 0) return value;
  if (object(value) && Object.keys(value).length > 0) return value;
  return knownOrUnknown(value, reason);
}

function designRevisionValue(value, reason = "Design.md version is unavailable") {
  return versionFact(value) ? value : unknownFact(reason);
}

function actionLabels(value) {
  return factList(value?.visible_actions ?? value?.actions);
}

function hasActions(value, required) {
  const actual = actionLabels(value);
  return required.every((label) => actual.includes(label));
}

function slug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Project-level sources are deliberately a pair of plain facts.  They are
// not task materials and they do not create another workflow state machine.
// Keeping this contract here lets build-spec/build-plan/build-code/verify-code
// share exactly the same identity and responsibility vocabulary.
export const PROJECT_STANDARD_DOCUMENT_KINDS = Object.freeze(["design", "experience"]);
export const CONSUMER_KINDS = Object.freeze(["route", "import", "lazy", "css", "data"]);
export const CONSUMER_DISCOVERY_STATUSES = Object.freeze(["discovered", "unknown", "incomplete", "unavailable"]);
export const CONSUMER_UNKNOWN_REASONS = Object.freeze([
  "dynamic_loading",
  "generated_code",
  "unsupported_framework",
  "scan_failed",
  "semantic_ambiguity",
  "missing_anchor",
  "unsupported_pattern",
  "unavailable_source",
]);
export const DELIVERY_IMPACTS = Object.freeze(["non_ui", "ui", "backend", "fullstack", "unknown"]);

const DESIGN_RESPONSIBILITY_WORDS = new Set([
  "visual", "component", "components", "token", "tokens", "layout", "responsive",
  "state", "states", "accessibility", "performance", "governance", "style", "styles",
]);
const EXPERIENCE_RESPONSIBILITY_WORDS = new Set([
  "page", "pages", "region", "regions", "interaction", "interactions", "flow", "flows",
  "recovery", "scenario", "scenarios", "long_term_scenarios", "testing", "test_scenarios",
  "accessibility_interaction", "known_gaps", "states",
]);
const DESIGN_FORBIDDEN_WORDS = /(?:page flow|user flow|interaction|scenario|test step|运行结果|页面流转|用户流程|长期场景|逐次运行)/i;
const EXPERIENCE_FORBIDDEN_WORDS = /(?:design token|color token|font|typography|spacing token|breakpoint|component api|组件规则|视觉规则|色彩|字体|间距|断点|样式)/i;
const SAFE_DOCUMENT_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;
const SAFE_REF = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))\S+$/;

function sourceIdentity(value, expectedKind, errors, label) {
  if (!object(value)) {
    errors.push(`${label} must be an object`);
    return null;
  }
  if (value.document_kind !== expectedKind) errors.push(`${label}.document_kind must be ${expectedKind}`);
  if (!nonEmptyString(value.path) || !SAFE_DOCUMENT_PATH.test(value.path)) errors.push(`${label}.path must be a project-relative path`);
  if (!HASH.test(value.content_sha256 ?? "")) errors.push(`${label}.content_sha256 must be a sha256 of the raw UTF-8 bytes`);
  if (typeof value.content === "string" && HASH.test(value.content_sha256 ?? "") && sha256(value.content) !== value.content_sha256) {
    errors.push(`${label}.content_sha256 does not match the supplied raw UTF-8 content`);
  }
  if (!nonEmptyString(value.revision) || UNKNOWN_LITERAL.test(String(value.revision))) errors.push(`${label}.revision must be a non-empty current revision`);
  if (!nonEmptyString(value.anchor_id) || UNKNOWN_LITERAL.test(String(value.anchor_id))) errors.push(`${label}.anchor_id must be an explicit stable anchor`);
  if (!nonEmptyString(value.anchor_title)) errors.push(`${label}.anchor_title is required`);
  if (value.anchor_source !== "explicit") errors.push(`${label}.anchor_source must be explicit; title slugs are not stable anchors`);
  if (!nonEmptyString(value.owner)) errors.push(`${label}.owner is required`);
  if (Array.isArray(value.anchors)) {
    const ids = value.anchors.map((entry) => entry?.anchor_id);
    if (ids.some((id) => !nonEmptyString(id)) || new Set(ids).size !== ids.length) errors.push(`${label}.anchors must contain unique explicit anchor_id values`);
  }
  return value;
}

function sourceResponsibilities(value) {
  const values = [];
  for (const field of ["responsibilities", "sections", "scope"]) {
    const raw = value?.[field];
    if (Array.isArray(raw)) values.push(...raw);
    else if (nonEmptyString(raw)) values.push(raw);
  }
  return values.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);
}

function identityComparable(value) {
  if (!object(value)) return null;
  return {
    document_kind: value.document_kind,
    path: value.path,
    content_sha256: value.content_sha256,
    revision: value.revision,
    anchor_id: value.anchor_id,
  };
}

function sameIdentity(left, right) {
  const a = identityComparable(left);
  const b = identityComparable(right);
  return Boolean(a && b && Object.keys(a).every((key) => a[key] === b[key]));
}

export function completeProjectSourceIdentity(value) {
  const identity = identityComparable(value);
  return Boolean(identity
    && PROJECT_STANDARD_DOCUMENT_KINDS.includes(identity.document_kind)
    && SAFE_DOCUMENT_PATH.test(identity.path ?? "")
    && HASH.test(identity.content_sha256 ?? "")
    && nonEmptyString(identity.revision)
    && nonEmptyString(identity.anchor_id)
    && !UNKNOWN_LITERAL.test(String(identity.revision))
    && !UNKNOWN_LITERAL.test(String(identity.anchor_id)));
}

// Replay identity must not depend on JavaScript object insertion order.  A
// scanner may construct the same scan configuration from maps in a different
// order; the census result and replay key must still be identical.
function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJsonValue(value[key])]));
}

function stableJson(value) {
  return JSON.stringify(stableJsonValue(value));
}

function identityTokens(value) {
  if (nonEmptyString(value)) return new Set([value.trim()]);
  if (!object(value)) return new Set();
  return new Set([
    value.ref,
    value.identity_ref,
    value.revision,
    value.content_sha256,
    value.anchor_id,
    value.replay_key,
    value.evidence_ref,
  ].filter(nonEmptyString).map((entry) => entry.trim()));
}

function sameBoundIdentity(declared, current) {
  if (object(declared) && object(current) && identityComparable(declared) && identityComparable(current)) {
    return sameIdentity(declared, current);
  }
  const declaredTokens = identityTokens(declared);
  const currentTokens = identityTokens(current);
  return declaredTokens.size > 0 && [...declaredTokens].some((token) => currentTokens.has(token));
}

function exactIdentityToken(value) {
  if (nonEmptyString(value)) return value.trim();
  if (!object(value)) return null;
  const tokens = [value.replay_key, value.ref, value.evidence_ref, value.identity_ref, value.identity]
    .filter(nonEmptyString)
    .map((entry) => entry.trim());
  return tokens.length === 1 ? tokens[0] : null;
}

function requireBoundIdentity(label, declared, current, errors, { structured = false, exactToken = false } = {}) {
  if (!explicitFact(current)) {
    errors.push(`${label} identity source is missing`);
    return;
  }
  if (!explicitFact(declared)) {
    errors.push(`${label} identity is required`);
    return;
  }
  if (structured && (!completeProjectSourceIdentity(declared) || !completeProjectSourceIdentity(current))) {
    errors.push(`${label} identity must be the structured Design.md/Experience.md identity object`);
    return;
  }
  if (exactToken && exactIdentityToken(declared) !== exactIdentityToken(current)) {
    errors.push(`${label} identity must exactly match the current canonical token`);
    return;
  }
  if (!sameBoundIdentity(declared, current)) errors.push(`${label} identity does not match current source`);
}

/**
 * Validate the one Design.md + one Experience.md project source contract.
 * Identity comparison is explicit (path/hash/revision/anchor); no title slug
 * or missing value is silently promoted to a current source.
 */
export function validateProjectStandardSources(input = {}) {
  const errors = [];
  if (!object(input)) return result(["project standard sources must be an object"]);
  const design = sourceIdentity(input.design ?? input.design_source, "design", errors, "design");
  const experience = sourceIdentity(input.experience ?? input.experience_source, "experience", errors, "experience");
  if (design && experience && design.path === experience.path) errors.push("Design.md and Experience.md must use distinct project paths");

  const designWords = sourceResponsibilities(design);
  const experienceWords = sourceResponsibilities(experience);
  if (design && !designWords.some((entry) => DESIGN_RESPONSIBILITY_WORDS.has(entry) || /design|visual|component|token|layout|responsive|style|accessibility|performance/i.test(entry))) {
    errors.push("Design.md must declare visual/component responsibilities");
  }
  if (design && designWords.some((entry) => EXPERIENCE_RESPONSIBILITY_WORDS.has(entry) && !DESIGN_RESPONSIBILITY_WORDS.has(entry))) {
    errors.push("Design.md must not own page, interaction, or long-term experience responsibilities");
  }
  if (design && DESIGN_FORBIDDEN_WORDS.test([...designWords, design.description, design.content].filter(Boolean).join(" "))) {
    errors.push("Design.md must not contain page-flow, interaction, scenario, or run-result semantics");
  }
  if (experience && !experienceWords.some((entry) => EXPERIENCE_RESPONSIBILITY_WORDS.has(entry) || /experience|page|interaction|flow|scenario|recovery|testing/i.test(entry))) {
    errors.push("Experience.md must declare page/interaction/scenario responsibilities");
  }
  if (experience && experienceWords.some((entry) => DESIGN_RESPONSIBILITY_WORDS.has(entry) && !EXPERIENCE_RESPONSIBILITY_WORDS.has(entry))) {
    errors.push("Experience.md must not own shared visual/component responsibilities");
  }
  if (experience && EXPERIENCE_FORBIDDEN_WORDS.test([...experienceWords, experience.description, experience.content].filter(Boolean).join(" "))) {
    errors.push("Experience.md must not define style, token, breakpoint, or visual component rules");
  }

  const bound = object(input.bound) ? input.bound : {};
  const stale = [];
  const missing = [];
  for (const [kind, current] of [["design", design], ["experience", experience]]) {
    const previous = bound[kind];
    if (!current) {
      missing.push(kind);
    } else if (previous !== undefined && !sameIdentity(current, previous)) {
      stale.push(kind);
    }
  }
  if (input.require_current_binding === true) {
    if (!completeProjectSourceIdentity(bound.design) || !completeProjectSourceIdentity(bound.experience)) {
      errors.push("current project standard sources require authenticated Design.md and Experience.md bindings");
    }
  }
  const updateRequested = input.update_required === true || input.update === true || input.change_kind === "rules_changed" || input.change_kind === "experience_changed";
  if (updateRequested && input.stage !== "build-code") errors.push("only build-code may write an updated Design.md or Experience.md identity");
  const status = stale.length > 0
    ? "stale"
    : errors.length > 0
      ? (missing.length > 0 ? "unknown" : "not_ready")
        : missing.length > 0
          ? "missing"
        : updateRequested
          ? "update_required"
          : "bound_current";
  return result(errors, {
    status,
    identities: Object.freeze({ design: design ? identityComparable(design) : null, experience: experience ? identityComparable(experience) : null }),
    stale: Object.freeze(stale),
    missing: Object.freeze(missing),
    writer: Object.freeze({ stage: input.stage ?? null, can_write: input.stage === "build-code" }),
    responsibilities: Object.freeze({ design: Object.freeze(designWords), experience: Object.freeze(experienceWords) }),
  });
}

function normalizeSupportMatrix(value, errors) {
  const entries = Array.isArray(value)
    ? value
    : object(value)
      ? Object.entries(value).map(([kind, entry]) => (object(entry) ? { kind, ...entry } : { kind, supported: entry }))
      : [];
  if (entries.length === 0) errors.push("consumer census support_matrix must enumerate route/import/lazy/css/data modes");
  const seen = new Set();
  const normalized = [];
  for (const entry of entries) {
    const kind = entry?.kind;
    if (!CONSUMER_KINDS.includes(kind)) { errors.push(`consumer census support_matrix kind is invalid: ${kind ?? "missing"}`); continue; }
    if (seen.has(kind)) { errors.push(`consumer census support_matrix kind is duplicated: ${kind}`); continue; }
    seen.add(kind);
    if (typeof entry.supported !== "boolean") errors.push(`consumer census support_matrix ${kind}.supported must be boolean`);
    const unknownReason = entry.unknown_reason;
    if (entry.supported === false && !CONSUMER_UNKNOWN_REASONS.includes(unknownReason)) errors.push(`consumer census unsupported ${kind} requires an enumerated unknown_reason`);
    normalized.push({
      kind,
      supported: entry.supported === true,
      ...(Array.isArray(entry.patterns) ? { patterns: [...entry.patterns].map(String).sort() } : {}),
      ...(unknownReason ? { unknown_reason: unknownReason } : {}),
    });
  }
  for (const kind of CONSUMER_KINDS) if (!seen.has(kind)) errors.push(`consumer census support_matrix missing ${kind}`);
  return normalized.sort((a, b) => a.kind.localeCompare(b.kind));
}

function normalizeSourceSnapshot(value, errors) {
  const snapshot = typeof value === "string" ? { tree: value } : value;
  if (!object(snapshot) || !/^[a-f0-9]{40,64}$/i.test(snapshot?.tree ?? snapshot?.snapshot_tree ?? "")) {
    errors.push("consumer census source_snapshot must bind a Git snapshot tree");
    return { tree: null };
  }
  return { tree: snapshot.tree ?? snapshot.snapshot_tree, ...(snapshot.commit ? { commit: snapshot.commit } : {}) };
}

function consumerId(kind, path, anchor) {
  return sha256(`${kind}\0${path}\0${anchor}`);
}

function normalizeConsumer(entry, source, errors, index) {
  if (!object(entry)) { errors.push(`consumer census consumer ${index + 1} must be an object`); return null; }
  const kind = entry.kind;
  const path = String(entry.path ?? entry.location?.path ?? "").trim();
  const anchor = String(entry.anchor ?? entry.anchor_id ?? "").trim();
  if (!CONSUMER_KINDS.includes(kind)) errors.push(`consumer census consumer ${index + 1} kind is invalid`);
  if (!SAFE_DOCUMENT_PATH.test(path)) errors.push(`consumer census consumer ${index + 1} path must be project-relative`);
  if (!nonEmptyString(anchor) || UNKNOWN_LITERAL.test(anchor)) errors.push(`consumer census consumer ${index + 1} needs an explicit anchor`);
  const status = entry.discovery_status ?? entry.status ?? "discovered";
  if (!CONSUMER_DISCOVERY_STATUSES.includes(status)) errors.push(`consumer census consumer ${index + 1} discovery_status is invalid`);
  const unknownReason = entry.unknown_reason;
  if (["unknown", "incomplete", "unavailable"].includes(status) && !CONSUMER_UNKNOWN_REASONS.includes(unknownReason)) {
    errors.push(`consumer census consumer ${index + 1} needs an enumerated unknown_reason`);
  }
  if (status === "discovered" && unknownReason !== undefined) errors.push(`consumer census discovered consumer ${index + 1} must not carry unknown_reason`);
  if (!nonEmptyString(entry.location) && !object(entry.location)) errors.push(`consumer census consumer ${index + 1} location is required`);
  if (kind === "route" && !nonEmptyString(entry.page) && !nonEmptyString(entry.page_ref)) {
    errors.push(`consumer census route ${index + 1} must identify its Experience page or page_ref`);
  }
  const invalidEvidenceRefs = entry.evidence_refs !== undefined
    && (!Array.isArray(entry.evidence_refs)
      || entry.evidence_refs.some((ref) => !(nonEmptyString(ref) || (object(ref) && nonEmptyString(ref.ref)))));
  if (invalidEvidenceRefs) {
    errors.push(`consumer census consumer ${index + 1} evidence_refs must contain canonical or explicit references`);
  }
  if (source === "human") {
    if (!nonEmptyString(entry.reason)) errors.push(`consumer census human addition ${index + 1} requires a reason`);
    if (!Array.isArray(entry.evidence_refs) || entry.evidence_refs.length === 0) {
      errors.push(`consumer census human addition ${index + 1} requires evidence_refs`);
    }
  }
  const normalized = {
    consumer_id: consumerId(kind, path, anchor),
    kind,
    path,
    anchor,
    location: entry.location,
    discovery_status: status,
    source,
    ...(entry.page ? { page: entry.page } : {}),
    ...(entry.page_ref ? { page_ref: entry.page_ref } : {}),
    ...(entry.data_chain ? { data_chain: entry.data_chain } : {}),
    ...(entry.evidence_refs ? { evidence_refs: Array.isArray(entry.evidence_refs) ? [...entry.evidence_refs].sort() : entry.evidence_refs } : {}),
    ...(unknownReason ? { unknown_reason: unknownReason } : {}),
    ...(entry.reason ? { reason: entry.reason } : {}),
  };
  return normalized;
}

/**
 * Normalize an explicit, replayable consumer scan.  This function does not
 * walk a repository; callers provide scanner facts, and unsupported/dynamic
 * patterns remain reasoned unknown entries. Human additions are append-only.
 */
export function buildConsumerCensus(input = {}) {
  const errors = [];
  if (!object(input)) return result(["consumer census input must be an object"]);
  if (input.schema_version !== "consumer-census.v1") errors.push("consumer census schema_version must be consumer-census.v1");
  if (!nonEmptyString(input.scanner_version)) errors.push("consumer census scanner_version is required");
  const sourceSnapshot = normalizeSourceSnapshot(input.source_snapshot ?? input.source_snapshot_identity, errors);
  if (!object(input.scan_config)) errors.push("consumer census scan_config is required");
  if (!Array.isArray(input.consumers)) errors.push("consumer census consumers must be an explicit array; absence is not zero consumers");
  const supportMatrix = normalizeSupportMatrix(input.support_matrix, errors);
  const seenSourceIds = new Set();
  const consumers = [];
  for (const [index, entry] of (Array.isArray(input.consumers) ? input.consumers : []).entries()) {
    const normalized = normalizeConsumer(entry, "scanner", errors, index);
    if (!normalized) continue;
    if (seenSourceIds.has(`${normalized.source}:${normalized.consumer_id}`)) errors.push(`consumer census duplicate scanner consumer ${normalized.consumer_id}`);
    seenSourceIds.add(`${normalized.source}:${normalized.consumer_id}`);
    consumers.push(normalized);
  }
  for (const [index, entry] of (Array.isArray(input.human_additions) ? input.human_additions : []).entries()) {
    const normalized = normalizeConsumer({ ...entry, source: "human" }, "human", errors, index);
    if (!normalized) continue;
    if (seenSourceIds.has(`${normalized.source}:${normalized.consumer_id}`)
        || [...seenSourceIds].some((key) => key.endsWith(`:${normalized.consumer_id}`))) {
      errors.push(`consumer census human addition collides with existing consumer ${normalized.consumer_id}`);
      continue;
    }
    seenSourceIds.add(`${normalized.source}:${normalized.consumer_id}`);
    consumers.push(normalized);
  }
  consumers.sort((a, b) => a.consumer_id.localeCompare(b.consumer_id) || a.source.localeCompare(b.source) || a.path.localeCompare(b.path));
  const experienceIndex = consumers
    .filter((entry) => entry.kind === "route")
    .map((entry) => ({ consumer_id: entry.consumer_id, page: entry.page ?? entry.page_ref ?? unknownFact("route has no Experience page binding"), status: entry.page || entry.page_ref ? "indexed" : "incomplete" }));
  return result(errors, {
    schema_version: "consumer-census.v1",
    scanner_version: input.scanner_version ?? null,
    source_snapshot: Object.freeze(sourceSnapshot),
    scan_config: structuredClone(input.scan_config ?? {}),
    support_matrix: Object.freeze(supportMatrix),
    consumers: Object.freeze(consumers),
    experience_index: Object.freeze(experienceIndex),
    replay_key: sha256(stableJson({
      schema_version: "consumer-census.v1",
      scanner_version: input.scanner_version ?? null,
      source_snapshot: sourceSnapshot,
      scan_config: input.scan_config ?? {},
      support_matrix: supportMatrix,
      consumers,
    })),
    unknown_count: consumers.filter((entry) => entry.discovery_status !== "discovered").length
      + supportMatrix.filter((entry) => entry.supported === false).length,
  });
}

function impactSignal(value) {
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (DELIVERY_IMPACTS.includes(text)) return text;
    const hasUiSignal = /(?:\bui\b|front[-_ ]?end|frontend|page|screen|route|component|css|design|browser|页面|前端)/.test(text);
    const hasBackendSignal = /(?:backend|back[-_ ]?end|api|dto|schema|migration|persistence|后端|数据链)/.test(text);
    if (/full[-_ ]?stack|前后端|跨边界/.test(text) || (hasUiSignal && hasBackendSignal)) return "fullstack";
    if (/backend|back[-_ ]?end|api|dto|schema|migration|persistence|后端|数据链/.test(text)) return "backend";
    if (/non[-_ ]?ui|backend[-_ ]?only|api[-_ ]?only|cli[-_ ]?only|docs?[-_ ]?only/.test(text)) return "non_ui";
    if (/ui|front[-_ ]?end|frontend|page|screen|route|component|css|design|browser|页面|前端/.test(text)) return "ui";
    return "unknown";
  }
  if (!object(value)) return "unknown";
  const signals = [];
  for (const field of ["impact", "result", "conclusion", "scope", "kind"]) {
    if (value[field] !== undefined) {
      const signal = impactSignal(value[field]);
      if (signal !== "unknown") signals.push(signal);
    }
  }
  if (value.frontend === true || value.ui === true || value.is_ui === true) signals.push("ui");
  if (value.backend === true || value.api === true || value.data === true) signals.push("backend");
  if (signals.includes("ui") && signals.includes("backend")) return "fullstack";
  if (signals.includes("fullstack")) return "fullstack";
  if (signals.length > 0) return signals[0];
  if (value.frontend === false && value.backend === false) return "non_ui";
  return impactSignal(factText(value));
}

/** Derive impact from evidence, never from a caller's downgrade label. */
export function deriveChangeImpact(input = {}) {
  if (!object(input)) return Object.freeze({ impact: "unknown", status: "unknown", evidence_refs: [], unknown_reasons: ["input_unavailable"] });
  const census = input.census ?? input.consumer_census;
  const consumers = Array.isArray(census?.consumers) ? census.consumers : [];
  const signals = [];
  const unknownReasons = [];
  for (const source of [input.raw_requirement, input.project_inventory, input.planned_or_changed_frontend_fact, input.backend_fact, input.fullstack_fact]) {
    const signal = impactSignal(source);
    if (signal !== "unknown") signals.push(signal);
    else if (source !== undefined && source !== null) {
      const reason = object(source) ? source.reason ?? source.unknown_reason : null;
      if (reason) unknownReasons.push(String(reason));
    }
  }
  for (const consumer of consumers) {
    if (consumer.discovery_status !== "discovered") unknownReasons.push(consumer.unknown_reason ?? "consumer_unknown");
    if (consumer.kind === "data") signals.push("backend");
    if (["route", "import", "lazy", "css"].includes(consumer.kind)) signals.push("ui");
  }
  if (census && consumers.length === 0 && census.unknown_count > 0) unknownReasons.push("consumer_scan_unknown");
  for (const unsupported of (Array.isArray(census?.support_matrix) ? census.support_matrix : []).filter((entry) => entry?.supported === false)) {
    unknownReasons.push(unsupported.unknown_reason ?? `unsupported_${unsupported.kind ?? "consumer"}_pattern`);
  }
  const hasUi = signals.includes("ui") || signals.includes("fullstack");
  const hasBackend = signals.includes("backend") || signals.includes("fullstack");
  let impact = hasUi && hasBackend ? "fullstack" : hasUi ? "ui" : hasBackend ? "backend" : "unknown";
  if (impact === "unknown" && signals.length > 0 && signals.every((signal) => signal === "non_ui") && unknownReasons.length === 0) impact = "non_ui";
  if (impact === "unknown" && signals.length === 0 && input.raw_requirement !== undefined && input.raw_requirement !== null) {
    const reason = object(input.raw_requirement) ? input.raw_requirement.reason : null;
    if (reason && /non[-_ ]?ui|backend[-_ ]?only|no (?:page|ui)/i.test(String(reason))) impact = "non_ui";
    else unknownReasons.push(reason ?? "impact_evidence_unavailable");
  }
  if (input.declared_impact && input.declared_impact !== impact) unknownReasons.push("caller_declared_impact_did_not_match_evidence");
  const evidenceRefs = consumers.flatMap((entry) => Array.isArray(entry.evidence_refs) ? entry.evidence_refs : []).filter(nonEmptyString);
  return Object.freeze({
    impact,
    status: impact === "unknown" || unknownReasons.length > 0 ? "unknown" : "derived",
    evidence_refs: Object.freeze([...new Set(evidenceRefs)].sort()),
    unknown_reasons: Object.freeze([...new Set(unknownReasons.filter(nonEmptyString))]),
    consumer_count: consumers.length,
    basis: Object.freeze({ census: Boolean(census), signals: Object.freeze([...new Set(signals)]) }),
  });
}

const INCOMPLETE_FACT_STATUSES = new Set([
  "failed", "failure", "incomplete", "missing", "cancelled", "canceled", "blocked", "stale", "mismatch",
  "identity_mismatch", "cleanup_failed", "not_executed", "not_started", "error", "invalid",
]);
const UNKNOWN_FACT_STATUSES = new Set(["unknown", "unavailable", "unsupported", "pending"]);
const PASSED_FACT_STATUSES = new Set(["passed", "pass", "success", "succeeded", "completed", "covered", "ready", "current"]);

function factStatus(value) {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (!object(value)) return "missing";
  return String(value.status ?? value.result ?? value.conclusion ?? "missing").trim().toLowerCase();
}

function factReason(value) {
  if (typeof value === "string") return value;
  if (!object(value)) return "fact is missing";
  return value.reason ?? value.failure_reason ?? value.unknown_reason ?? value.message ?? "fact has no reason";
}

/** Apply the fixed incomplete > unknown > covered precedence. */
export function deriveDeliveryConclusion({ impact, facts = {}, contract } = {}) {
  const kind = DELIVERY_IMPACTS.includes(impact) ? impact : "unknown";
  const source = object(facts) ? facts : object(contract) ? contract : {};
  const requiredByImpact = {
    non_ui: ["impact_evidence"],
    ui: ["design", "experience", "census", "evidence"],
    backend: ["api", "dto", "schema_migration", "persistence", "consumer"],
    fullstack: ["design", "experience", "census", "evidence", "api", "dto", "schema_migration", "persistence", "consumer", "e2e_slice"],
    unknown: ["impact_evidence"],
  };
  const required = requiredByImpact[kind];
  const incomplete = [];
  const unknown = [];
  const considered = [];
  if (kind === "unknown") unknown.push({ key: "impact", reason: "impact classification is unknown" });
  for (const key of required) {
    const value = source[key];
    const status = factStatus(value);
    if (status === "not_applicable") {
      incomplete.push({ key, status, reason: factReason(value) === "fact is missing" ? "not_applicable requires a reason" : factReason(value) });
      continue;
    }
    if (INCOMPLETE_FACT_STATUSES.has(status)) incomplete.push({ key, status, reason: factReason(value) });
    else if (UNKNOWN_FACT_STATUSES.has(status)) unknown.push({ key, status, reason: factReason(value) });
    else if (PASSED_FACT_STATUSES.has(status)) considered.push({ key, status });
    else incomplete.push({ key, status: status || "missing", reason: factReason(value) });
  }
  const status = incomplete.length > 0 ? "incomplete" : unknown.length > 0 ? "unknown" : "covered";
  return Object.freeze({
    status,
    conclusion: status,
    impact: kind,
    required: Object.freeze(required),
    incomplete: Object.freeze(incomplete),
    unknown: Object.freeze(unknown),
    considered: Object.freeze(considered),
    reason: status === "covered" ? "all required current facts passed" : `${status} facts remain in the contract`,
  });
}

function validateLayer(layer, name, errors) {
  if (!object(layer)) { errors.push(`${name} layer is required`); return; }
  const status = factStatus(layer);
  if (!PASSED_FACT_STATUSES.has(status) && !INCOMPLETE_FACT_STATUSES.has(status) && !UNKNOWN_FACT_STATUSES.has(status)) errors.push(`${name} layer status is invalid`);
  for (const field of ["success", "failure", "state_owner", "recovery"]) if (!explicitFact(layer[field])) errors.push(`${name} layer requires ${field}`);
}

const API_FAILURE_CLASSES = Object.freeze(["validation", "permission", "conflict", "upstream", "timeout"]);

function validateApiFailureClasses(api, errors) {
  if (!Array.isArray(api?.failure_classes) || api.failure_classes.length === 0) {
    errors.push("api layer must enumerate applicable validation/permission/conflict/upstream/timeout failures");
    return;
  }
  const seen = new Set();
  for (const [index, entry] of api.failure_classes.entries()) {
    const kind = typeof entry === "string"
      ? entry.trim().toLowerCase()
      : object(entry)
        ? String(entry.kind ?? entry.class ?? entry.type ?? "").trim().toLowerCase()
        : "";
    if (!API_FAILURE_CLASSES.includes(kind)) {
      errors.push(`api failure_classes[${index}] must identify one of ${API_FAILURE_CLASSES.join(", ")}`);
      continue;
    }
    if (seen.has(kind)) {
      errors.push(`api failure_classes must not duplicate ${kind}`);
      continue;
    }
    seen.add(kind);
    if (object(entry) && entry.applicable !== undefined && typeof entry.applicable !== "boolean") {
      errors.push(`api failure_classes[${index}].applicable must be boolean`);
    }
    if (object(entry) && entry.applicable === false && !explicitFact(entry.reason)) {
      errors.push(`api failure_classes[${index}] not_applicable requires an explicit reason`);
    }
  }
  for (const kind of API_FAILURE_CLASSES) {
    if (!seen.has(kind)) errors.push(`api failure_classes is missing ${kind}`);
  }
}

function validateBackendContract(dataContract, errors, { requireReadBack = false } = {}) {
  if (!object(dataContract)) { errors.push("backend data_contract is required"); return; }
  for (const name of ["api", "dto", "schema_migration", "persistence", "consumer"]) validateLayer(dataContract[name], name, errors);
  const api = dataContract.api;
  if (object(api)) validateApiFailureClasses(api, errors);
  const dto = dataContract.dto;
  if (object(dto) && dto.compatibility !== "compatible") errors.push("dto incompatibility must be explicit; defaults cannot hide it");
  const migration = dataContract.schema_migration;
  if (object(migration)) {
    if (!/atomic|transaction/i.test(String(migration.atomicity ?? ""))) errors.push("schema_migration must declare atomicity");
    if (!explicitFact(migration.stop_condition)) errors.push("schema_migration must declare a stop_condition");
    if (!explicitFact(migration.forward) || (!explicitFact(migration.rollback) && !explicitFact(migration.manual_recovery))) errors.push("schema_migration must declare forward and rollback or manual_recovery");
  }
  const persistence = dataContract.persistence;
  if (object(persistence)) {
    if (persistence.atomic_commit !== true
        && !(persistence.atomic_commit === false && explicitFact(persistence.atomic_commit_reason ?? persistence.unsupported_reason ?? persistence.reason))) {
      errors.push("persistence must declare atomic_commit true or an explicit unsupported reason");
    }
    if (persistence.partial_commit_observable !== true) errors.push("persistence must expose partial-commit state");
    if (!object(persistence.idempotency) || typeof persistence.idempotency.supported !== "boolean") errors.push("persistence must declare idempotency support");
    else if (persistence.idempotency.supported && !explicitFact(persistence.idempotency.key)) errors.push("persistence idempotency needs a key");
    else if (!persistence.idempotency.supported && !explicitFact(persistence.idempotency.reason)) errors.push("unsupported idempotency needs a reason");
  }
  const consumer = dataContract.consumer;
  if (object(consumer)) {
    for (const field of ["retry", "no_retry", "unknown"]) if (!explicitFact(consumer[field])) errors.push(`consumer layer must map ${field} to a recovery action`);
  }
  if (requireReadBack || dataContract.read_back !== undefined) {
    const readBack = dataContract.read_back;
    if (!object(readBack) || !PASSED_FACT_STATUSES.has(factStatus(readBack)) || !explicitFact(readBack.correlation_id) || !explicitFact(readBack.consumer_id) || !explicitFact(readBack.value_ref)) {
      errors.push("backend consumer read_back must bind correlation_id, consumer_id, and value_ref");
    }
  }
}

/** Validate the minimal UI/backend/fullstack contract without inventing a product API. */
export function validateDeliveryContract(input = {}) {
  const errors = [];
  if (!object(input)) return result(["delivery contract must be an object"]);
  const impact = input.impact;
  const suppliedFacts = object(input.facts) ? input.facts : {};
  if (!DELIVERY_IMPACTS.includes(impact)) errors.push("delivery contract impact is invalid");
  if (impact === "non_ui") {
    if (!explicitFact(input.reason ?? input.impact_evidence ?? input.basis)) errors.push("non_ui delivery requires an evidence-based reason");
  } else if (impact === "ui" || impact === "fullstack") {
    const ui = input.ui_contract;
    if (!object(ui)) errors.push("ui delivery requires ui_contract");
    else {
      for (const field of ["design_identity", "experience_identity", "census_ref", "experience_scenario_ref", "evidence_ref"]) if (!explicitFact(ui[field])) errors.push(`ui_contract requires ${field}`);
    }
  }
  if (impact === "backend" || impact === "fullstack") validateBackendContract(input.data_contract ?? input.backend_contract, errors, { requireReadBack: impact === "fullstack" });
  if (impact === "fullstack") {
    const slice = input.e2e_slice;
    if (!object(slice)) errors.push("fullstack delivery requires e2e_slice");
    else {
      if (!PASSED_FACT_STATUSES.has(factStatus(slice))) errors.push("fullstack e2e_slice must be a current successful fact");
      for (const field of ["correlation_id", "request_ref", "consumer_read_back_ref"]) if (!explicitFact(slice[field])) errors.push(`fullstack e2e_slice requires ${field}`);
      const readBack = (input.data_contract ?? input.backend_contract)?.read_back;
      if (object(readBack) && explicitFact(slice.correlation_id) && readBack.correlation_id !== slice.correlation_id) errors.push("fullstack request/read-back correlation_id mismatch");
      if (object(readBack) && explicitFact(slice.consumer_read_back_ref) && explicitFact(readBack.value_ref)
          && slice.consumer_read_back_ref !== readBack.value_ref) errors.push("fullstack consumer read-back value_ref mismatch");
    }
  }
  if (impact === "unknown" && !explicitFact(input.reason ?? input.unknown_reason)) errors.push("unknown delivery requires a reason");
  // When build-code has current project sources/census, the UI contract must
  // bind to those exact identities.  Non-empty labels alone are not enough:
  // otherwise an unrelated Design.md/Experience.md or stale census can be
  // presented as if it covered this implementation.
  if (impact === "ui" || impact === "fullstack") {
    const ui = object(input.ui_contract) ? input.ui_contract : {};
    const standardSources = input.project_standard_sources ?? input.standard_sources;
    if (object(standardSources)) {
      const currentDesign = standardSources.design ?? standardSources.design_source ?? standardSources.identities?.design;
      const currentExperience = standardSources.experience ?? standardSources.experience_source ?? standardSources.identities?.experience;
      requireBoundIdentity("ui_contract.design", ui.design_identity, currentDesign, errors, { structured: true });
      requireBoundIdentity("ui_contract.experience", ui.experience_identity, currentExperience, errors, { structured: true });
      if (object(suppliedFacts.design) && explicitFact(suppliedFacts.design.identity ?? suppliedFacts.design.source)) {
        requireBoundIdentity("facts.design", suppliedFacts.design.identity ?? suppliedFacts.design.source, currentDesign, errors, { structured: true });
      }
      if (object(suppliedFacts.experience) && explicitFact(suppliedFacts.experience.identity ?? suppliedFacts.experience.source)) {
        requireBoundIdentity("facts.experience", suppliedFacts.experience.identity ?? suppliedFacts.experience.source, currentExperience, errors, { structured: true });
      }
    }
    const censusSource = input.consumer_census;
    if (censusSource !== undefined) {
      const census = censusSource?.ok === true && nonEmptyString(censusSource.replay_key)
        ? censusSource
        : buildConsumerCensus(censusSource);
      const declaredCensus = ui.census_ref;
      if (!census.ok) errors.push("ui_contract census identity source is invalid");
      else if (!exactIdentityToken(declaredCensus) || exactIdentityToken(declaredCensus) !== exactIdentityToken(census.replay_key)) errors.push("ui_contract.census_ref does not exactly match current consumer census");
      if (census.ok && input.current_snapshot_tree && census.source_snapshot?.tree !== input.current_snapshot_tree) {
        errors.push("ui_contract consumer census is stale for the current snapshot");
      }
      if (census.ok && census.consumers.length === 0) errors.push("ui_contract consumer census has no discovered consumer");
      if (census.ok && census.experience_index.length > 0) {
        const scenarioTokens = identityTokens(ui.experience_scenario_ref);
        const indexed = census.experience_index.flatMap((entry) => [entry.consumer_id, entry.page, entry.page_ref].filter(nonEmptyString));
        if (![...scenarioTokens].some((token) => indexed.includes(token))) errors.push("ui_contract.experience_scenario_ref does not match consumer census experience index");
      } else if (census.ok) {
        errors.push("ui_contract experience scenario has no indexed Experience page");
      }
      if (object(suppliedFacts.census) && explicitFact(suppliedFacts.census.replay_key ?? suppliedFacts.census.identity)) {
        requireBoundIdentity("facts.census", suppliedFacts.census.replay_key ?? suppliedFacts.census.identity, census.replay_key, errors, { exactToken: true });
      }
    }
    const evidenceSource = input.ui_evidence ?? input.evidence_source ?? input.current_ui_evidence;
    if (evidenceSource !== undefined) {
      const declaredEvidence = ui.evidence_ref;
      const currentEvidence = object(evidenceSource) ? (evidenceSource.ref ?? evidenceSource.evidence_ref ?? evidenceSource.identity ?? evidenceSource) : evidenceSource;
      requireBoundIdentity("ui_contract.evidence", declaredEvidence, currentEvidence, errors, { exactToken: true });
      if (object(suppliedFacts.evidence) && explicitFact(suppliedFacts.evidence.identity ?? suppliedFacts.evidence.ref ?? suppliedFacts.evidence.evidence_ref)) {
        requireBoundIdentity("facts.evidence", suppliedFacts.evidence.identity ?? suppliedFacts.evidence.ref ?? suppliedFacts.evidence.evidence_ref, currentEvidence, errors, { exactToken: true });
      }
    }
  }
  const normalizedSuppliedFacts = { ...suppliedFacts };
  if (impact === "non_ui" && typeof normalizedSuppliedFacts.impact_evidence === "string") {
    normalizedSuppliedFacts.impact_evidence = { status: "passed", reason: normalizedSuppliedFacts.impact_evidence };
  }
  const data = input.data_contract ?? input.backend_contract;
  const derivedFacts = {
    ...normalizedSuppliedFacts,
    ...(impact === "non_ui" && !Object.hasOwn(normalizedSuppliedFacts, "impact_evidence")
      ? {
        impact_evidence: (() => {
          const evidence = input.impact_evidence ?? input.reason ?? input.basis;
          return typeof evidence === "string" ? { status: "passed", reason: evidence } : evidence;
        })(),
      }
      : {}),
    ...(impact === "ui" || impact === "fullstack"
      ? {
        design: suppliedFacts.design ?? input.ui_contract?.design,
        experience: suppliedFacts.experience ?? input.ui_contract?.experience,
        census: suppliedFacts.census ?? input.ui_contract?.census,
        evidence: suppliedFacts.evidence ?? input.ui_contract?.evidence,
      }
      : {}),
    ...(impact === "backend" || impact === "fullstack"
      ? {
        api: suppliedFacts.api ?? data?.api,
        dto: suppliedFacts.dto ?? data?.dto,
        schema_migration: suppliedFacts.schema_migration ?? data?.schema_migration,
        persistence: suppliedFacts.persistence ?? data?.persistence,
        consumer: suppliedFacts.consumer ?? data?.consumer,
        ...(impact === "fullstack" ? { e2e_slice: suppliedFacts.e2e_slice ?? input.e2e_slice } : {}),
      }
      : {}),
  };
  const conclusion = deriveDeliveryConclusion({ impact, facts: derivedFacts });
  if (errors.length === 0 && conclusion.status !== "covered") {
    errors.push(`delivery contract conclusion is ${conclusion.status}; required current facts are not all covered`);
  }
  return result(errors, { status: errors.length === 0 ? conclusion.status : "incomplete", conclusion });
}

/**
 * Build the intentionally short prompt sent to an external design tool.
 * Design.md and the UI Contract carry technical constraints; this function
 * only emits page/region, interaction, state and visible-label context.
 */
export function buildShortUiDesignPrompt(input = {}) {
  const errors = [];
  if (!object(input)) return result(["short UI design prompt input must be an object"]);
  const pageOrRegion = String(input.page_or_region ?? input.page ?? input.region ?? "").trim();
  const interactions = factList(input.interactions ?? input.interaction);
  const states = factList(input.states ?? input.state);
  const visibleLabels = factList(input.visible_labels);
  if (!pageOrRegion) errors.push("short UI design prompt page_or_region is required");
  if (interactions.length === 0) errors.push("short UI design prompt interactions are required");
  if (states.length === 0) errors.push("short UI design prompt states are required");
  if (visibleLabels.length === 0) errors.push("short UI design prompt visible_labels are required");
  const fields = Object.freeze({
    page_or_region: pageOrRegion,
    interactions: Object.freeze(interactions),
    states: Object.freeze(states),
    visible_labels: Object.freeze(visibleLabels),
  });
  const prompt = errors.length > 0 ? null : [
    `页面/区域：${pageOrRegion}`,
    `交互：${interactions.join("；")}`,
    `状态：${states.join("；")}`,
    `可见 label：${visibleLabels.join("、")}`,
  ].join("\n");
  return result(errors, { fields, prompt });
}

/**
 * Produce the executable output contract of ui-project-init. Missing project
 * inputs are facts with reasons, not errors and never become a progression
 * gate. The function deliberately does no filesystem mutation or inference.
 */
export function buildUiProjectInitFact(input = {}) {
  const errors = [];
  if (!object(input)) return result(["ui-project-init input must be an object"]);
  const mode = input.mode;
  if (!["new", "legacy"].includes(mode)) errors.push("ui-project-init mode must be new or legacy");
  const inventory = object(input.project_inventory) ? input.project_inventory : {};
  const missingItems = [];
  const missing = (code, reason) => {
    missingItems.push(Object.freeze({ code, reason }));
    return unknownFact(reason);
  };
  const designPath = nonEmptyString(input.design_path ?? input.design_source_path)
    ? String(input.design_path ?? input.design_source_path).trim()
    : missing("DESIGN-SOURCE-PATH-MISSING", "Design.md path was not provided");
  const designRevision = versionFact(input.design_revision)
    ? input.design_revision
    : missing("DESIGN-REVISION-MISSING", "Design.md version was not provided");
  const experiencePath = nonEmptyString(input.experience_path ?? input.experience_source_path)
    ? String(input.experience_path ?? input.experience_source_path).trim()
    : missing("EXPERIENCE-SOURCE-PATH-MISSING", "Experience.md path was not provided");
  const experienceRevision = versionFact(input.experience_revision)
    ? input.experience_revision
    : missing("EXPERIENCE-REVISION-MISSING", "Experience.md version was not provided");
  const scope = knownOrUnknown(input.scope ?? input.first_page ?? inventory.first_page,
    mode === "legacy" ? "legacy first-page boundary requires human selection" : "first UI page or region is not selected");
  const componentBoundary = knownOrUnknown(
    input.component_boundary ?? (mode === "legacy" ? inventory.component_candidates : undefined),
    mode === "legacy" ? "legacy component candidates were not inventoried" : "component boundary is not selected",
  );
  const styleBoundary = knownOrUnknown(
    input.style_boundary ?? (mode === "legacy" ? inventory.css_boundary : undefined),
    mode === "legacy" ? "legacy CSS boundary was not inventoried" : "style boundary is not selected",
  );
  const fixture = knownOrUnknown(input.fixture, "fixed preview fixture is not selected");
  const viewport = knownOrUnknown(input.viewport, "preview viewport is not selected");
  const preview = knownOrUnknown(input.preview, "preview host or Story is unavailable");
  const assumptions = Array.isArray(input.assumptions) && input.assumptions.length > 0
    ? input.assumptions
    : [unknownFact("initialization assumptions are not confirmed")];
  const humanConfirmation = object(input.human_confirmation) || nonEmptyString(input.human_confirmation)
    ? input.human_confirmation
    : unknownFact("human confirmation is pending");
  const status = missingItems.length > 0 || [scope, componentBoundary, styleBoundary, fixture, viewport, preview]
    .some((value) => object(value) && MISSING_FACT_STATUSES.has(String(value.status ?? "").toLowerCase()))
    ? "not_ready"
    : "ready";
  const legacyInventory = mode === "legacy"
    ? Object.freeze({
      technology_stack: inventoryFact(
        inventory.technology_stack ?? inventory.tech_stack ?? inventory.stack,
        "legacy technology stack was not inventoried",
      ),
      routes: inventoryFact(inventory.routes, "legacy routes were not inventoried"),
      css_side_effects: inventoryFact(
        inventory.css_side_effects ?? inventory.css_effects ?? inventory.css_boundary,
        "legacy CSS side effects were not inventoried",
      ),
      data_entrypoints: inventoryFact(
        inventory.data_entrypoints ?? inventory.data_sources ?? inventory.data_entry_points,
        "legacy data entrypoints were not inventoried",
      ),
      component_candidates: inventoryFact(
        inventory.component_candidates ?? input.component_boundary,
        "legacy component candidates were not inventoried",
      ),
      testing_capability: inventoryFact(
        inventory.testing_capability ?? inventory.test_capability ?? inventory.tests,
        "legacy testing capability was not inventoried",
      ),
      baseline: inventoryFact(inventory.baseline, "legacy baseline was not recorded"),
      legacy_exceptions: inventoryFact(
        inventory.legacy_exceptions ?? inventory.exceptions,
        "legacy exceptions were not recorded",
      ),
      first_page_candidates: inventoryFact(
        inventory.first_page_candidates ?? inventory.first_page ?? input.first_page,
        "legacy first-page candidates were not inventoried",
      ),
      coupling_risks: inventoryFact(
        inventory.coupling_risks ?? inventory.coupling_risk,
        "legacy coupling risks were not inventoried",
      ),
      minimal_scope_reduction: inventoryFact(
        inventory.minimal_scope_reduction ?? inventory.scope_reduction ?? inventory.shrink_suggestion,
        "legacy minimal scope-reduction suggestion was not recorded",
      ),
    })
    : undefined;
  return result(errors, {
    mode,
    status,
    design_path: designPath,
    design_revision: designRevision,
    experience_path: experiencePath,
    experience_revision: experienceRevision,
    source_identities: Object.freeze({
      design: object(input.design_identity) ? input.design_identity : unknownFact("Design.md identity is not bound"),
      experience: object(input.experience_identity) ? input.experience_identity : unknownFact("Experience.md identity is not bound"),
    }),
    scope,
    component_boundary: componentBoundary,
    style_boundary: styleBoundary,
    fixture,
    viewport,
    preview,
    missing_items: Object.freeze(missingItems),
    assumptions: Object.freeze(assumptions),
    human_confirmation: humanConfirmation,
    ...(legacyInventory ? { legacy_inventory: legacyInventory } : {}),
    gate: false,
  });
}

function parseDesignMarkdownSections(content) {
  if (typeof content !== "string" || content.trim() === "") return [];
  return [...content.matchAll(/^#{2,6}\s+(.+?)\s*$/gm)].map(([, heading]) => ({
    page_or_region: heading.trim(),
  }));
}

/**
 * Derive a Screen Read Map from caller-parsed Design.md sections (or headings
 * in the supplied text). This is a pure lens: it reports missing fields and
 * freshness but does not rewrite Design.md or score visual quality.
 */
export function deriveDesignSourceReadiness(input = {}) {
  const errors = [];
  if (!object(input)) return result(["design-source-readiness input must be an object"]);
  const designPath = nonEmptyString(input.design_path ?? input.path)
    ? String(input.design_path ?? input.path).trim()
    : "";
  const actualRevision = input.design_revision;
  const expectedRevision = input.expected_design_revision;
  const sections = Array.isArray(input.sections)
    ? input.sections
    : Array.isArray(input.read_map)
      ? input.read_map
      : parseDesignMarkdownSections(input.design_content ?? input.content);
  const missingItems = [];
  const addMissing = (code, reason, anchor = undefined) => {
    const fact = Object.freeze({ code, reason, ...(anchor ? { anchor } : {}) });
    missingItems.push(fact);
    return fact;
  };
  let bindingState = "bindable";
  let freshnessStatus = "matching";
  if (!designPath) {
    bindingState = "not_bindable";
    freshnessStatus = "unknown";
    addMissing("DESIGN-SOURCE-MISSING", "Design.md path is unavailable");
  } else if (!versionFact(actualRevision)) {
    bindingState = "unknown";
    freshnessStatus = "unknown";
    addMissing("DESIGN-REVISION-MISSING", "Design.md version is unavailable");
  } else if (versionFact(expectedRevision) && String(actualRevision) !== String(expectedRevision)) {
    bindingState = "not_bindable";
    freshnessStatus = "stale";
    addMissing("DESIGN-REVISION-MISMATCH", "current Design.md version does not match the requested version");
  }
  if (!Array.isArray(sections)) {
    bindingState = bindingState === "bindable" ? "unknown" : bindingState;
    freshnessStatus = freshnessStatus === "matching" ? "unknown" : freshnessStatus;
    addMissing("SCREEN-READ-MAP-MISSING", "Design.md sections could not be read");
  }
  const sourceSections = Array.isArray(sections) ? sections : [];
  const readMap = sourceSections.map((section, index) => {
    const source = object(section) ? section : {};
    const explicitAnchor = source.anchor_id ?? source.anchor ?? source.id;
    const anchor = nonEmptyString(explicitAnchor)
      ? String(explicitAnchor).trim()
      : `section-${index + 1}`;
    const entryMissing = [];
    if (!nonEmptyString(explicitAnchor)) {
      entryMissing.push("anchor_id is missing; heading slugs are not stable anchors");
      addMissing("SCREEN-READ-MAP-ANCHOR-MISSING", "Design.md section needs an explicit anchor_id", anchor);
    }
    for (const field of [
      "page_or_region", "goal", "primary_action", "states", "components", "tokens",
      "fixture", "viewport", "responsive", "a11y", "evidence",
    ]) {
      const value = field === "page_or_region"
        ? (source.page_or_region ?? source.page ?? source.region)
        : source[field];
      if (!explicitFact(value) && !(Array.isArray(value) && value.length > 0)) {
        entryMissing.push(`${field} is missing`);
      }
    }
    for (const reason of entryMissing) addMissing("SCREEN-READ-MAP-FIELD-MISSING", reason, anchor);
    return Object.freeze({
      anchor,
      page_or_region: source.page_or_region ?? source.page ?? source.region ?? unknownFact("page or region is missing"),
      goal: source.goal ?? unknownFact("screen goal is missing"),
      primary_action: source.primary_action ?? unknownFact("primary action is missing"),
      states: source.states ?? unknownFact("state list is missing"),
      components: source.components ?? unknownFact("component source is missing"),
      tokens: source.tokens ?? unknownFact("token/style source is missing"),
      fixture: source.fixture ?? unknownFact("fixture is missing"),
      viewport: source.viewport ?? unknownFact("viewport is missing"),
      responsive: source.responsive ?? unknownFact("responsive intent is missing"),
      a11y: source.a11y ?? unknownFact("accessibility intent is missing"),
      evidence: source.evidence ?? unknownFact("preview/browser/screenshot evidence is missing"),
      missing_items: Object.freeze(entryMissing),
    });
  });
  if (readMap.length === 0) addMissing("SCREEN-READ-MAP-EMPTY", "Design.md contains no page or section map");
  const confirmation = object(input.human_confirmation) || nonEmptyString(input.human_confirmation)
    ? input.human_confirmation
    : unknownFact("human confirmation is pending");
  const status = bindingState === "bindable" && missingItems.length === 0 ? "ready" : "not_ready";
  return result(errors, {
    status,
    design_path: designPath || unknownFact("Design.md path is unavailable"),
    design_revision: designRevisionValue(actualRevision),
    expected_design_revision: expectedRevision ?? unknownFact("requested Design.md version is not specified"),
    binding_state: bindingState,
    read_map: Object.freeze(readMap),
    missing_items: Object.freeze(missingItems),
    freshness: Object.freeze({
      status: freshnessStatus,
      expected: expectedRevision ?? null,
      actual: actualRevision ?? null,
    }),
    human_confirmation: confirmation,
    gate: false,
  });
}

/**
 * Validate one append-only design-loop fact. It makes the failure/cancel/
 * version-mismatch labels observable while leaving continuation non-gating.
 */
export function validateUiDesignLoopFact(value) {
  const errors = [];
  if (!object(value)) return result(["UI design loop fact must be an object"]);
  const state = value.state ?? value.status;
  if (!UI_DESIGN_LOOP_STATES.includes(state)) errors.push("UI design loop state is invalid");
  if (!nonEmptyString(value.current_material_ref)) errors.push("UI design loop current_material_ref is required");
  if (value.gate === true || value.is_gate === true) errors.push("UI design loop fact must not become a gate");
  const actions = actionLabels(value);
  if (UI_DESIGN_ACTION_LABELS[state] && !hasActions(value, UI_DESIGN_ACTION_LABELS[state])) {
    errors.push(`UI design loop ${state} must preserve its visible action labels`);
  }
  if (state === "preview_ready" && !collectionFact(value.preview_refs ?? value.preview_ref)) {
    errors.push("preview_ready requires preview_refs");
  }
  if (state === "preview_unavailable" && !nonEmptyString(value.reason)) {
    errors.push("preview_unavailable requires a reason");
  }
  if (state === "design_prompt_ready") {
    const promptInput = value.prompt ?? value.design_prompt;
    const prompt = buildShortUiDesignPrompt(promptInput);
    if (!prompt.ok) errors.push(...prompt.errors.map((error) => `design_prompt: ${error}`));
    if (nonEmptyString(value.prompt_text) && value.prompt_text !== prompt.prompt) {
      errors.push("design_prompt prompt_text does not match the executable prompt builder");
    }
  }
  if (state === "external_design_pending" && !nonEmptyString(value.prompt_ref)) {
    errors.push("external_design_pending requires prompt_ref");
  }
  if (state === "external_design_returned") {
    if (!nonEmptyString(value.design_ref)) errors.push("external_design_returned requires design_ref");
    if (!versionFact(value.expected_design_revision)) errors.push("external_design_returned requires expected_design_revision");
    if (!versionFact(value.returned_design_revision)) errors.push("external_design_returned requires returned_design_revision");
    if (String(value.expected_design_revision) !== String(value.returned_design_revision)) {
      errors.push("external_design_returned cannot carry a mismatched design revision");
    }
  }
  if (["external_design_cancelled", "external_design_not_returned"].includes(state)) {
    if (!nonEmptyString(value.reason)) errors.push(`${state} requires a reason`);
    if (value.preserves_current_contract !== true) errors.push(`${state} must preserve the current UI Contract`);
  }
  if (state === "external_design_version_mismatch") {
    if (!versionFact(value.expected_design_revision)) errors.push("external_design_version_mismatch requires expected_design_revision");
    if (value.returned_design_revision !== undefined
      && versionFact(value.returned_design_revision)
      && String(value.expected_design_revision) === String(value.returned_design_revision)) {
      errors.push("external_design_version_mismatch must retain a different or missing returned revision");
    }
    if (!nonEmptyString(value.reason)) errors.push("external_design_version_mismatch requires a reason");
    if (value.preserves_current_contract !== true) errors.push("external_design_version_mismatch must preserve the current UI Contract");
  }
  if (["human_approved", "human_acknowledged", "human_not_approved"].includes(state)) {
    const expected = state === "human_approved" ? "approved" : state === "human_acknowledged" ? "acknowledged" : "not_approved";
    const confirmation = object(value.human_confirmation) ? value.human_confirmation.result : value.human_confirmation;
    if (confirmation !== expected) errors.push(`${state} requires human_confirmation=${expected}`);
    if (state === "human_approved" && value.continuation_allowed !== true) {
      errors.push("human_approved must explicitly preserve continuation_allowed=true");
    }
    if (state !== "human_approved" && value.continuation_allowed !== false) {
      errors.push(`${state} must explicitly preserve continuation_allowed=false`);
    }
    if (state !== "human_approved" && value.design_status === "ready") errors.push(`${state} cannot mark design_status=ready`);
  }
  return result(errors, {
    state,
    continuation_allowed: state === "human_approved",
    visible_actions: Object.freeze(actions),
  });
}

function namedFact(value) {
  return nonEmptyString(value) || (object(value) && (
    nonEmptyString(value.name)
    || nonEmptyString(value.page)
    || nonEmptyString(value.region)
    || nonEmptyString(value.path)
    || nonEmptyString(value.ref)
  ));
}

function componentFact(value) {
  return nonEmptyString(value) || (object(value) && (
    nonEmptyString(value.name)
    || nonEmptyString(value.path)
    || nonEmptyString(value.ref)
  ));
}

/**
 * Validate the UI applicability fact carried by the existing stage contracts.
 * It is a derived fact from three named inputs; it never acts as a gate.
 */
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

/**
 * Validate the UI Contract and its state-level eight-field observation seam.
 * Missing design/preview facts remain observable quality facts and do not
 * become a stage gate.
 */
export function validateUiContract(value) {
  const errors = [];
  if (!object(value)) return result(["ui contract must be an object"]);
  if (!UI_DESIGN_STATUSES.has(value.design_status)) errors.push("ui contract design_status is invalid");
  const pageOrRegion = value.page_or_region ?? value.page ?? value.region;
  if (!namedFact(pageOrRegion)) errors.push("ui contract page_or_region is required");
  for (const field of UI_CONTRACT_FIELDS) {
    if (field === "page_or_region") continue;
    if (value[field] === undefined || value[field] === null) errors.push(`ui contract is missing ${field}`);
  }
  if (!Array.isArray(value.missing_items)) errors.push("ui contract missing_items must be an array");
  for (const [index, item] of (Array.isArray(value.missing_items) ? value.missing_items : []).entries()) {
    if (!explicitFact(item)) errors.push(`ui contract missing_items[${index}] must include a non-empty reasoned fact`);
  }
  if (!versionFact(value.design_revision)) errors.push("ui contract design_revision must be a version or reasoned unknown");
  for (const field of ["current_material_ref", "fallback_visual_basis", "rework_risk"]) {
    if (!explicitFact(value[field])) errors.push(`ui contract ${field} must preserve a non-empty fact or reasoned unknown`);
  }
  for (const field of ["visible_labels", "preview_refs", "fixture_refs", "viewport_refs", "screenshot_refs"]) {
    if (!collectionFact(value[field])) errors.push(`ui contract ${field} must preserve a non-empty fact or reasoned unknown`);
  }
  if (!collectionFact(value.constraints, { allowEmpty: true })) errors.push("ui contract constraints must be an explicit list or reasoned fact");
  if (!collectionFact(value.assumptions, { allowEmpty: true })) errors.push("ui contract assumptions must be an explicit list or reasoned fact");
  const states = value.states ?? value.state_contracts ?? [];
  if (!Array.isArray(states)) errors.push("ui contract states must be an array");
  if (Array.isArray(states) && states.length === 0) errors.push("ui contract requires at least one state");
  for (const [index, state] of (Array.isArray(states) ? states : []).entries()) {
    if (!object(state)) {
      errors.push(`ui contract state ${index + 1} must be an object`);
      continue;
    }
    for (const field of UI_STATE_CONTRACT_FIELDS) {
      const valid = field === "name" ? namedFact(state[field]) : explicitFact(state[field]);
      if (!valid) errors.push(`ui contract state ${index + 1} missing ${field}`);
    }
  }
  if (value.human_confirmation !== undefined && value.human_confirmation !== null) {
    const confirmation = value.human_confirmation.result ?? value.human_confirmation;
    if (!UI_CONFIRMATION_RESULTS.has(confirmation)) errors.push("ui contract human_confirmation result is invalid");
  } else {
    errors.push("ui contract human_confirmation is required");
  }
  const confirmation = object(value.human_confirmation)
    ? value.human_confirmation.result
    : value.human_confirmation;
  if (value.design_status === "ready" && confirmation !== "approved") {
    errors.push("ready ui contract requires approved human_confirmation");
  }
  if (["not_ready", "unknown", "unavailable"].includes(value.design_status)) {
    const hasMissingReason = Array.isArray(value.missing_items)
      && value.missing_items.some((item) => explicitFact(item));
    if (!hasMissingReason && !explicitFact(value.rework_risk)) {
      errors.push("non-ready ui contract requires a missing-item reason or rework_risk");
    }
  }
  if (value.gate === true || value.is_gate === true) errors.push("ui contract must not become a gate");
  return result(errors);
}

/**
 * Validate the conditional Component Quality Map consumed by plan/code/verify.
 * The map records ownership and consumers; it does not grant a progression
 * permit.
 */
export function validateComponentQualityMap(value) {
  const errors = [];
  const risks = [];
  const entries = Array.isArray(value) ? value : value?.entries;
  if (!Array.isArray(entries)) return result(["component quality map must contain entries"]);
  for (const [index, entry] of entries.entries()) {
    if (!object(entry)) {
      errors.push(`component quality entry ${index + 1} must be an object`);
      continue;
    }
    if (!COMPONENT_QUALITY_ACTIONS.includes(entry.action)) errors.push(`component quality entry ${index + 1} action is invalid`);
    if (!componentFact(entry.component)) errors.push(`component quality entry ${index + 1} missing component`);
    const consumers = Array.isArray(entry.real_consumers)
      ? entry.real_consumers
      : entry.real_consumer === undefined ? [] : [entry.real_consumer];
    const hasUnknownConsumer = consumers.some((consumer) => object(consumer)
      && MISSING_FACT_STATUSES.has(String(consumer.status ?? "").toLowerCase())
      && nonEmptyString(consumer.reason));
    const hasMalformedConsumer = consumers.some((consumer) => (
      (typeof consumer === "string" && UNKNOWN_LITERAL.test(consumer.trim()))
      || (!nonEmptyString(consumer) && !(
        object(consumer)
        && MISSING_FACT_STATUSES.has(String(consumer.status ?? "").toLowerCase())
        && nonEmptyString(consumer.reason)
      ))
    ));
    const validConsumers = consumers.filter(resolvedConsumer);
    const distinctConsumers = new Set(validConsumers.map((consumer) => consumer.trim()));
    if (hasMalformedConsumer) errors.push(`component quality entry ${index + 1} contains a malformed real consumer fact`);
    if (hasUnknownConsumer) risks.push(`component quality entry ${index + 1} retains an unresolved real_consumer fact`);
    if (entry.action === "extract-shared" && distinctConsumers.size < 2 && !hasUnknownConsumer) errors.push(`component quality entry ${index + 1} extract-shared requires two distinct real consumers`);
    if (entry.action === "extract-shared" && distinctConsumers.size < 2 && hasUnknownConsumer) risks.push(`component quality entry ${index + 1} cannot confirm two distinct real consumers`);
    if (entry.action !== "remove-after-no-consumers" && validConsumers.length === 0 && !hasUnknownConsumer) errors.push(`component quality entry ${index + 1} requires a real consumer`);
    if (entry.action === "remove-after-no-consumers" && validConsumers.length > 0) errors.push(`component quality entry ${index + 1} removal still has a real consumer`);
    if (entry.action === "remove-after-no-consumers") {
      const hasRemovalEvidence = nonEmptyString(entry.no_consumer_evidence)
        || (Array.isArray(entry.evidence_refs) && entry.evidence_refs.some(nonEmptyString));
      if (!hasRemovalEvidence) errors.push(`component quality entry ${index + 1} removal requires no-consumer evidence`);
    }
    for (const field of ["state_owner", "typed_view_model", "css_token_owner"]) {
      if (!explicitFact(entry[field])) errors.push(`component quality entry ${index + 1} missing ${field}`);
    }
    if (["modify", "extend-state-or-variant", "add-local", "extract-shared"].includes(entry.action) && !explicitFact(entry.story_or_test_update)) {
      errors.push(`component quality entry ${index + 1} ${entry.action} requires story_or_test_update`);
    }
    if (entry.gate === true || entry.is_gate === true) errors.push("component quality map must not become a gate");
  }
  return result(errors, { risks: Object.freeze(risks) });
}

function semanticAnchor(value, expectedRole = null) {
  return object(value)
    && nonEmptyString(value.id)
    && nonEmptyString(value.path)
    && !value.path.startsWith("/")
    && !value.path.split("/").includes("..")
    && Number.isSafeInteger(value.start_line)
    && value.start_line >= 1
    && Number.isSafeInteger(value.end_line)
    && value.end_line >= value.start_line
    && nonEmptyString(value.role)
    && (expectedRole === null || value.role === expectedRole);
}

const GIT_OID = /^[a-f0-9]{40,64}$/i;

/**
 * Validate the small, append-only evidence carrier used by a build-code
 * phase.  Implementation and integration baselines are deliberately typed
 * separately: equal commit values in a fixture do not make them the same
 * fact.  The carrier is bound to one candidate snapshot and never acts as a
 * completion permit by itself.
 */
export function validateBuildCodePhaseEvidence(value, { snapshotTree } = {}) {
  if (!object(value)) throw new TypeError("build-code phase evidence must be an object");
  const allowed = new Set(["schema_version", "phase_id", "phase_order", "snapshot_tree", "baseline", "evidence", "failure_attribution"]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`build-code phase evidence contains unsupported fields: ${unknown.join(", ")}`);
  if (value.schema_version !== "build-code-phase-evidence.v1") throw new Error("build-code phase evidence schema_version is invalid");
  if (typeof value.phase_id !== "string" || value.phase_id.trim() === "") throw new TypeError("build-code phase evidence phase_id is required");
  if (!Array.isArray(value.phase_order) || value.phase_order.length === 0
      || value.phase_order.some((entry) => typeof entry !== "string" || entry.trim() === "")
      || new Set(value.phase_order).size !== value.phase_order.length) {
    throw new TypeError("build-code phase evidence phase_order must contain unique non-empty task ids");
  }
  if (!GIT_OID.test(value.snapshot_tree ?? "")) throw new TypeError("build-code phase evidence snapshot_tree must be a Git object id");
  if (snapshotTree !== undefined && value.snapshot_tree !== snapshotTree) throw new Error("build-code phase evidence snapshot_tree drift");
  if (!object(value.baseline)) throw new TypeError("build-code phase evidence baseline is required");
  const baselines = {};
  for (const role of ["implementation", "integration"]) {
    const baseline = value.baseline[role];
    if (!object(baseline) || Object.keys(baseline).some((key) => !new Set(["kind", "commit"]).has(key))
        || baseline.kind !== role || !GIT_OID.test(baseline.commit ?? "")) {
      throw new TypeError(`build-code phase evidence ${role} baseline is invalid`);
    }
    baselines[role] = { kind: role, commit: baseline.commit };
  }
  if (!Array.isArray(value.evidence) || value.evidence.length === 0) throw new TypeError("build-code phase evidence requires evidence");
  const evidence = value.evidence.map((entry, index) => {
    if (!object(entry) || Object.keys(entry).some((key) => !new Set(["ref", "sha256", "snapshot_tree"]).has(key))
        || typeof entry.ref !== "string" || entry.ref.trim() === "" || !HASH.test(entry.sha256 ?? "")
        || !GIT_OID.test(entry.snapshot_tree ?? value.snapshot_tree) || (entry.snapshot_tree ?? value.snapshot_tree) !== value.snapshot_tree) {
      throw new TypeError(`build-code phase evidence evidence[${index}] is invalid or stale`);
    }
    return { ref: entry.ref, sha256: entry.sha256, snapshot_tree: entry.snapshot_tree ?? value.snapshot_tree };
  });
  if (!object(value.failure_attribution)
      || Object.keys(value.failure_attribution).some((key) => !new Set(["status", "category", "code", "reason", "exit_code"]).has(key))
      || !new Set(["passed", "failed", "unknown", "incomplete"]).has(value.failure_attribution.status)
      || typeof value.failure_attribution.category !== "string" || value.failure_attribution.category.trim() === ""
      || typeof value.failure_attribution.code !== "string" || value.failure_attribution.code.trim() === ""
      || typeof value.failure_attribution.reason !== "string" || value.failure_attribution.reason.trim() === ""
      || (value.failure_attribution.exit_code !== undefined && !Number.isInteger(value.failure_attribution.exit_code))) {
    throw new TypeError("build-code phase evidence failure_attribution is invalid");
  }
  return Object.freeze({
    schema_version: value.schema_version,
    phase_id: value.phase_id,
    phase_order: Object.freeze([...value.phase_order]),
    snapshot_tree: value.snapshot_tree,
    baseline: Object.freeze(baselines),
    evidence: Object.freeze(evidence),
    failure_attribution: Object.freeze({ ...value.failure_attribution }),
  });
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

const INTERACTION_LIFECYCLE = Object.freeze(["ask", "wait", "reply", "resume"]);
const DECISION_LOG_STEP_DISPOSITIONS = new Set([
  "current",
  "deferred",
  "non_goal",
  "non-goal",
  "open",
  "no_new_requirement",
  "no-new-requirement",
  "evidence_only",
  "evidence-only",
  "historical",
]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function validHash(value) {
  return HASH.test(value ?? "");
}

function validInteractionRound(value) {
  return Number.isSafeInteger(value) && value >= 1;
}

function questionIdentity(question, interactionType = "interaction") {
  return interactionType === "Grill"
    ? question?.frontier_id ?? question?.question_id ?? question?.axis
    : question?.question_id ?? question?.frontier_id ?? question?.axis;
}

export function validateInteractionQuestionBatch(questions, { interactionType = "interaction" } = {}) {
  const errors = [];
  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push(`${interactionType} ask must contain at least one independent question`);
    return Object.freeze({ ok: false, errors: Object.freeze(errors), question_ids: Object.freeze([]), option_ids: Object.freeze(Object.create(null)) });
  }
  const ids = questions.map((question) => questionIdentity(question, interactionType));
  const axes = questions.map((question) => question?.axis ?? question?.frontier_id ?? question?.question_id);
  // Question ids are user/content supplied. A null-prototype map prevents a
  // question named "constructor" or "__proto__" from resolving to an object
  // prototype member during reply validation.
  const optionIdsByQuestion = Object.create(null);
  if (ids.some((id) => !nonEmptyString(id)) || new Set(ids).size !== ids.length) {
    errors.push(`${interactionType} questions must have unique question ids or axes`);
  }
  if (axes.some((axis) => !nonEmptyString(axis)) || new Set(axes).size !== axes.length) {
    errors.push(`${interactionType} questions must each contain one unique decision axis`);
  }
  for (const [index, question] of questions.entries()) {
    if (question?.independent !== true) {
      errors.push(`${interactionType} may batch only independent questions, never review work`);
    }
    if (question?.review === true) errors.push(`${interactionType} may not batch review work`);
    const options = question?.options;
    if (!Array.isArray(options) || options.length < 2 || options.length > 3) {
      errors.push(`${interactionType} question ${index + 1} must provide 2 or 3 options`);
      continue;
    }
    const optionIds = options.map((option) => option?.option_id ?? option?.number);
    optionIdsByQuestion[ids[index]] = optionIds;
    if (optionIds.some((id) => id === undefined || id === null) || new Set(optionIds).size !== optionIds.length) {
      errors.push(`${interactionType} question ${index + 1} options must have unique numbers or ids`);
    }
    for (const [optionIndex, option] of options.entries()) {
      for (const field of ["label", "meaning", "consequence", "risk"]) {
        if (!nonEmptyString(option?.[field])) errors.push(`${interactionType} question ${index + 1} option ${optionIndex + 1} needs ${field}`);
      }
    }
    const recommended = question?.recommended_option;
    if (!optionIds.includes(recommended) || !nonEmptyString(question?.recommendation_reason)) {
      errors.push(`${interactionType} question ${index + 1} needs a valid recommended option and reason`);
    }
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    question_ids: Object.freeze(ids),
    option_ids: Object.freeze(optionIdsByQuestion),
  });
}

function validateInteractionQuestions(questions, interactionType, errors) {
  const batch = validateInteractionQuestionBatch(questions, { interactionType });
  errors.push(...batch.errors);
  return batch;
}

/**
 * Validate the host-visible lifecycle used by Talk, Grill, and Clarify.
 *
 * The events are an in-memory interaction fact, not a new persisted object.
 * Both skills must expose a real ask -> wait -> user reply -> resume seam;
 * the validator deliberately rejects an aggregate that merely claims it
 * completed.
 */
export function validateInteractionLifecycleContract(value) {
  const errors = [];
  if (!object(value)) return Object.freeze({ ok: false, errors: Object.freeze(["interaction lifecycle must be an object"]), facts: Object.freeze({}) });

  const interactionType = value.interaction_type ?? value.kind;
  if (!new Set(["talk", "grill", "spec-clarify"]).has(interactionType)) errors.push("interaction lifecycle kind must be talk, grill, or spec-clarify");
  if (!Array.isArray(value.events) || value.events.length !== INTERACTION_LIFECYCLE.length) {
    errors.push("interaction lifecycle must contain ask -> wait -> reply -> resume events");
  }
  const events = Array.isArray(value.events) ? value.events : [];
  for (const [index, expected] of INTERACTION_LIFECYCLE.entries()) {
    if (events[index]?.event !== expected) errors.push(`interaction lifecycle event ${index + 1} must be ${expected}`);
  }

  const [ask, wait, reply, resume] = events;
  if (!nonEmptyString(ask?.card_ref) || !validHash(ask?.card_hash) || !validInteractionRound(ask?.round)) {
    errors.push("ask must bind a card ref, hash, and positive round");
  }
  if (wait?.card_ref !== ask?.card_ref || wait?.card_hash !== ask?.card_hash
      || wait?.round !== ask?.round || wait?.status !== "waiting-for-user") {
    errors.push("wait must pause on the exact ask card and round until the user replies");
  }
  if (reply?.card_ref !== ask?.card_ref || reply?.card_hash !== ask?.card_hash
      || reply?.round !== ask?.round
      || reply?.source !== "user" || !nonEmptyString(reply?.reply_ref) || !validHash(reply?.reply_hash)) {
    errors.push("reply must be a real user reply bound to the ask card and round");
  }
  if (resume?.card_ref !== ask?.card_ref || resume?.card_hash !== ask?.card_hash
      || resume?.round !== ask?.round
      || resume?.reply_ref !== reply?.reply_ref || resume?.reply_hash !== reply?.reply_hash
      || resume?.status !== "resumed") {
    errors.push("resume must bind the exact user reply, ask card, and round");
  }

  if (interactionType === "talk" || interactionType === "spec-clarify") {
    const batch = validateInteractionQuestions(ask?.questions, interactionType, errors);
    const questionIds = batch.question_ids;
    const hasBatchReply = Array.isArray(reply?.answers) && reply.answers.length > 0;
    if (!hasBatchReply || reply?.re_ranked !== true) {
      errors.push(`${interactionType} reply must contain the user answer(s) and re-rank the remaining questions`);
    }
    const answeredIds = new Set();
    if (hasBatchReply) for (const answer of reply.answers) {
      const answerId = questionIdentity(answer, interactionType);
      if (!questionIds.includes(answerId)) errors.push(`${interactionType} reply answers must bind to questions in the current batch`);
      if (answeredIds.has(answerId)) errors.push(`${interactionType} reply must not answer one question twice`);
      answeredIds.add(answerId);
      const selectedOption = answer?.option_id ?? answer?.number;
      if (!(batch.option_ids[answerId] ?? []).includes(selectedOption)) {
        errors.push(`${interactionType} reply option must belong to its question`);
      }
    }
    const remaining = reply?.remaining_question_ids;
    if (!Array.isArray(remaining) || remaining.some((id) => !questionIds.includes(id))
        || new Set(remaining).size !== remaining.length
        || questionIds.some((id) => !answeredIds.has(id) && !remaining.includes(id))
        || remaining.some((id) => answeredIds.has(id))) {
      errors.push(`${interactionType} reply must preserve and re-rank remaining question ids`);
    }
  }

  if (interactionType === "grill") {
    const questions = ask?.questions;
    const batch = validateInteractionQuestions(questions, "Grill", errors);
    const frontierIds = batch.question_ids;
    if (Object.prototype.hasOwnProperty.call(value, "review_fact") || value.produces_review_fact === true
        || Object.prototype.hasOwnProperty.call(reply ?? {}, "review_fact")) {
      errors.push("Grill must not produce a review fact");
    }
    if (!Array.isArray(reply?.answers) || reply.answers.length === 0 || reply?.re_ranked !== true
        || !Array.isArray(reply?.remaining_frontier_ids)
        || reply.remaining_frontier_ids.some((id) => !frontierIds.includes(id))
        || new Set(reply.remaining_frontier_ids).size !== reply.remaining_frontier_ids.length
        || reply.answers.some((answer) => !frontierIds.includes(questionIdentity(answer, "Grill")))
        || reply.answers.some((answer) => !(batch.option_ids[questionIdentity(answer, "Grill")] ?? []).includes(answer?.option_id ?? answer?.number))
        || reply.answers.some((answer, index, all) => all.findIndex((candidate) => questionIdentity(candidate, "Grill") === questionIdentity(answer, "Grill")) !== index)
        || frontierIds.some((id) => !reply.answers.some((answer) => questionIdentity(answer, "Grill") === id) && !reply.remaining_frontier_ids.includes(id))
        || reply.answers.some((answer) => reply.remaining_frontier_ids.includes(questionIdentity(answer, "Grill")))) {
      errors.push("Grill reply must preserve the reply, partial answers, and re-rank remaining frontiers");
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    facts: Object.freeze({
      interaction_type: interactionType,
      lifecycle: Object.freeze([...INTERACTION_LIFECYCLE]),
      card_ref: ask?.card_ref ?? null,
      round: ask?.round ?? null,
      user_reply_ref: reply?.reply_ref ?? null,
    }),
  });
}

/** Validate several real interaction rounds without treating them as duplicate skills. */
export function validateInteractionLifecycleSequence(value) {
  const errors = [];
  const rounds = Array.isArray(value) ? value : value?.rounds;
  const expectedType = Array.isArray(value) ? null : value?.interaction_type ?? value?.kind;
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return Object.freeze({ ok: false, errors: Object.freeze(["interaction lifecycle sequence must contain one or more rounds"]), facts: Object.freeze({}) });
  }
  const seenRounds = new Set();
  const seenCards = new Set();
  let previousRound = 0;
  for (const [index, round] of rounds.entries()) {
    const lifecycle = round?.lifecycle ?? round;
    const interactionType = lifecycle?.interaction_type ?? lifecycle?.kind;
    if (expectedType !== null && interactionType !== expectedType) errors.push(`interaction round ${index + 1} has a different interaction type`);
    const result = validateInteractionLifecycleContract(lifecycle);
    if (!result.ok) errors.push(...result.errors.map((error) => `round ${index + 1}: ${error}`));
    const roundNumber = lifecycle?.events?.[0]?.round;
    const cardRef = lifecycle?.events?.[0]?.card_ref;
    if (!validInteractionRound(roundNumber)) errors.push(`interaction round ${index + 1} must contain a positive round`);
    if (seenRounds.has(roundNumber)) errors.push(`interaction round ${roundNumber} was started more than once`);
    if (seenCards.has(cardRef)) errors.push(`interaction card ${cardRef} was started more than once`);
    if (validInteractionRound(roundNumber) && roundNumber <= previousRound) errors.push("interaction rounds must be strictly ordered");
    seenRounds.add(roundNumber);
    seenCards.add(cardRef);
    if (validInteractionRound(roundNumber)) previousRound = roundNumber;
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    facts: Object.freeze({ interaction_type: expectedType ?? rounds[0]?.interaction_type ?? rounds[0]?.kind ?? null, rounds: rounds.length }),
  });
}

/**
 * Validate the input-side shape of the single make-decision interaction
 * aggregate.  Writing, hashing, replay and conflict handling remain owned by
 * the make-decision kernel writer in the later phase; P1 only supplies the
 * shared, fail-loud contract.
 */
export function validateInteractionAggregateContract(value) {
  const errors = [];
  if (!object(value)) return result(["interaction aggregate must be an object"]);
  if (value.schema_version !== "workflowhub-interaction-aggregate.v1") errors.push("interaction aggregate schema_version is invalid");
  if (!nonEmptyString(value.task_id)) errors.push("interaction aggregate task_id is required");
  if (value.stage !== "make-decision") errors.push("interaction aggregate stage must be make-decision");
  if (!/^[a-f0-9]{40,64}$/i.test(value.snapshot_tree ?? "")) errors.push("interaction aggregate snapshot_tree must be a Git snapshot tree");
  const allowed = new Set([
    "schema_version", "task_id", "stage", "snapshot_tree", "original_requirement", "decision", "confirmation",
    "talk", "grill", "advice", "decision_ref", "decision_hash", "clarify", "generated_at",
  ]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`interaction aggregate contains unsupported field ${key}`);
  if (value.generated_at !== undefined && !Number.isFinite(Date.parse(value.generated_at))) {
    errors.push("interaction aggregate generated_at must be an ISO timestamp");
  }

  const requirement = value.original_requirement;
  if (!object(requirement) || !SAFE_REF.test(requirement.ref ?? "") || !HASH.test(requirement.hash ?? "")) {
    errors.push("interaction aggregate original_requirement must bind a ref and hash");
  }
  const decision = value.decision ?? (value.decision_ref ? { ref: value.decision_ref, hash: value.decision_hash, revision: value.material_revision } : null);
  if (!object(decision) || !SAFE_REF.test(decision.ref ?? "") || !HASH.test(decision.hash ?? "") || !/^revision-[a-f0-9]{64}$/.test(decision.revision ?? "")) {
    errors.push("interaction aggregate decision must bind ref, hash, and material revision");
  }
  const confirmation = value.confirmation;
  if (!object(confirmation) || !/^quality\/confirmations\/[a-f0-9]{64}\.json$/.test(confirmation.ref ?? "") || !HASH.test(confirmation.hash ?? "") || confirmation.result !== "accepted") {
    errors.push("interaction aggregate confirmation must bind an accepted confirmation ref and hash");
  }

  const talk = value.talk;
  if (!object(talk) || talk.status !== "completed" || !Number.isSafeInteger(talk.round_count) || talk.round_count < 1 || !Array.isArray(talk.lifecycle_rounds)) {
    errors.push("interaction aggregate talk must contain completed status, round_count, and lifecycle_rounds");
  } else {
    const lifecycle = validateInteractionLifecycleSequence({ interaction_type: "talk", rounds: talk.lifecycle_rounds });
    if (!lifecycle.ok) errors.push(...lifecycle.errors.map((error) => `Talk: ${error}`));
    if (lifecycle.facts.rounds !== talk.round_count) errors.push("interaction aggregate Talk round_count does not match lifecycle_rounds");
  }
  const grill = value.grill;
  if (!object(grill) || !["completed", "recorded"].includes(grill.status) || !explicitFact(grill.summary)) {
    errors.push("interaction aggregate grill must retain a completed summary");
  }
  if (object(grill) && (Object.hasOwn(grill, "review_fact") || grill.produces_review_fact === true)) errors.push("interaction aggregate Grill summary must not become a review fact");
  const advice = value.advice ?? value.detail_advice;
  if (!object(advice) || !["completed", "recorded", "unavailable"].includes(advice.status)) {
    errors.push("interaction aggregate advice summary is required");
  } else if (advice.status === "unavailable") {
    if (!explicitFact(advice.reason)) errors.push("unavailable interaction advice requires a reason");
  } else if (!SAFE_REF.test(advice.result_ref ?? "") || !HASH.test(advice.result_hash ?? "")) {
    errors.push("interaction aggregate advice must bind result_ref and result_hash");
  }
  return result(errors, {
    status: errors.length === 0 ? "valid" : "invalid",
    bound: Object.freeze({
      task_id: value.task_id ?? null,
      stage: value.stage ?? null,
      decision_ref: decision?.ref ?? null,
      confirmation_ref: confirmation?.ref ?? null,
    }),
  });
}

const REQUIREMENT_COVERAGE_CLASSES = new Set([
  "goal",
  "flow_or_surface",
  "data_or_state",
  "success_failure_acceptance",
  "constraint_non_goal_defer",
]);
const REQUIREMENT_IMPACTS = new Set(["high", "medium", "low"]);
const REQUIREMENT_DISPOSITIONS = new Set(["selected", "represented", "explicitly_deferred", "not_asked"]);

/**
 * Validate the semantic output produced after authenticated messages are
 * classified by a product skill. The runtime checks bindings and omissions;
 * it does not classify natural language itself or let a host source do so.
 */
export function validateRequirementCoverage({ messages, outputs } = {}) {
  const errors = [];
  if (!Array.isArray(messages) || messages.length === 0) errors.push("authenticated requirement messages are required");
  if (!Array.isArray(outputs)) errors.push("requirement coverage outputs are required");
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors), facts: Object.freeze({}) });
  const byId = new Map();
  for (const message of messages) {
    if (!nonEmptyString(message?.id) || !validHash(message?.content_hash)) {
      errors.push("authenticated message identity and hash are required");
      continue;
    }
    if (byId.has(message.id)) errors.push(`authenticated message ${message.id} is duplicated`);
    byId.set(message.id, message);
  }
  const coveredClasses = new Set();
  const coveredMessages = new Set();
  const coveredAxes = new Set();
  for (const [index, output] of outputs.entries()) {
    const message = byId.get(output?.message_id);
    if (!message) { errors.push(`coverage output ${index + 1} must bind an authenticated message`); continue; }
    if (output.message_hash !== message.content_hash) errors.push(`coverage output ${index + 1} message hash binding mismatch`);
    if (!REQUIREMENT_COVERAGE_CLASSES.has(output.message_class)) errors.push(`coverage output ${index + 1} message class is invalid`);
    if (!nonEmptyString(output.axis_id)) errors.push(`coverage output ${index + 1} axis_id is required`);
    if (!REQUIREMENT_IMPACTS.has(output.impact)) errors.push(`coverage output ${index + 1} impact is invalid`);
    if (!REQUIREMENT_DISPOSITIONS.has(output.disposition)) errors.push(`coverage output ${index + 1} disposition is invalid`);
    // make-decision owns the original-requirement and decision bindings.
    // Functional requirements and acceptance criteria are created only by
    // build-spec, so requiring their IDs here would force a fabricated
    // downstream contract into the decision stage.
    const ids = ["decision_ids", "requirement_ids"];
    for (const field of ids) {
      if (!Array.isArray(output[field]) || output[field].length === 0 || output[field].some((id) => !nonEmptyString(id))) errors.push(`coverage output ${index + 1} ${field} must be non-empty`);
    }
    if (["high", "medium"].includes(output.impact) && output.disposition === "explicitly_deferred" && !nonEmptyString(output.skip_reason)) {
      errors.push(`coverage output ${index + 1} explicitly_deferred needs skip_reason`);
    }
    if (["high", "medium"].includes(output.impact) && output.disposition === "not_asked" && !nonEmptyString(output.skip_reason)) {
      errors.push(`coverage output ${index + 1} not_asked needs skip_reason`);
    }
    if (REQUIREMENT_COVERAGE_CLASSES.has(output.message_class)) coveredClasses.add(output.message_class);
    coveredMessages.add(message.id);
    if (nonEmptyString(output.axis_id)) coveredAxes.add(output.axis_id);
  }
  for (const message of messages) if (!coveredMessages.has(message.id)) errors.push(`authenticated message ${message.id} has no coverage output`);
  for (const category of REQUIREMENT_COVERAGE_CLASSES) if (!coveredClasses.has(category)) errors.push(`requirement message class ${category} has no coverage output`);
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    facts: Object.freeze({ message_count: messages.length, output_count: outputs.length, class_count: coveredClasses.size, axis_count: coveredAxes.size }),
  });
}

/**
 * Validate one or more append-only updates made by the existing decision-log
 * writer when a make-decision step completes. This is a contract over facts;
 * it does not create a writer, ledger, status machine, or additional material.
 */
export function validateDecisionLogStepUpdateContract(value) {
  const errors = [];
  const updates = Array.isArray(value) ? value : value?.updates ?? (object(value) ? [value] : []);
  if (updates.length === 0) return Object.freeze({ ok: false, errors: Object.freeze(["decision-log step updates are required"]), facts: Object.freeze({}) });

  const seenSteps = new Set();
  let ref = null;
  let hash = null;
  for (const update of updates) {
    const stepId = update?.step_id;
    if (update?.stage !== "make-decision") errors.push("decision-log step update stage must be make-decision");
    if (!Number.isInteger(stepId) || stepId < 1 || stepId > MAX_MAKE_DECISION_STEP_ID) errors.push(`decision-log step update step_id must be 1..${MAX_MAKE_DECISION_STEP_ID}`);
    if (seenSteps.has(stepId)) errors.push(`decision-log step ${stepId} was updated more than once in one batch`);
    seenSteps.add(stepId);
    if (!nonEmptyString(update?.decision_log_ref) || !validHash(update?.decision_log_hash)) {
      errors.push(`decision-log step ${stepId ?? "unknown"} must bind decision-log ref/hash`);
    }
    if (ref === null) ref = update?.decision_log_ref;
    if (hash === null) hash = update?.decision_log_hash;
    if (update?.decision_log_ref !== ref || update?.decision_log_hash !== hash) {
      errors.push("all make-decision step updates must bind the same decision-log ref/hash");
    }
    if (update?.writer?.owner !== "make-decision" || update?.writer?.artifact !== "decision-log.md"
        || update?.writer?.mode !== "append-only") {
      errors.push(`decision-log step ${stepId ?? "unknown"} must use the existing make-decision append-only writer`);
    }
    if (!DECISION_LOG_STEP_DISPOSITIONS.has(update?.coverage_disposition)) {
      errors.push(`decision-log step ${stepId ?? "unknown"} must record a requirement disposition`);
    }
    if (!nonEmptyString(update?.outcome)) errors.push(`decision-log step ${stepId ?? "unknown"} outcome is required`);
    if (!new Set(["written", "incomplete"]).has(update?.write_status)) {
      errors.push(`decision-log step ${stepId ?? "unknown"} write_status must be written or incomplete`);
    }
    if (update?.write_status === "incomplete" && !nonEmptyString(update?.write_error)) {
      errors.push(`decision-log step ${stepId ?? "unknown"} incomplete write must preserve the error`);
    }
  }

  const sortedSteps = [...seenSteps].sort((left, right) => left - right);
  if (updates.length > 1 && sortedSteps.some((step, index) => step !== sortedSteps[0] + index)) {
    errors.push("a multi-step decision-log update batch must cover contiguous steps");
  }
  const incomplete = updates.some((update) => update?.write_status === "incomplete");
  return Object.freeze({
    ok: errors.length === 0 && !incomplete,
    errors: Object.freeze(incomplete && errors.length === 0
      ? ["decision-log write is incomplete; preserve the failure and do not claim step completion"]
      : errors),
    facts: Object.freeze({
      stage: "make-decision",
      step_ids: Object.freeze(sortedSteps),
      decision_log_ref: ref,
      decision_log_hash: hash,
      write_status: incomplete ? "incomplete" : "written",
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

/**
 * Analyze a make-decision decision-log for the four convergence dimensions and
 * the plain-language end card required by the convergence spec.
 *
 * The checks are operational: they look for readable sections/labels, not just
 * IDs or file existence. IDs are internal anchors; the user-facing surface is
 * plain language.
 */
const REQUIREMENT_MESSAGE_CLASSES = [
  "goal",
  "flow_or_surface",
  "data_or_state",
  "success_failure_acceptance",
  "constraint_non_goal_defer",
];

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

function meaningfulSectionBody(markdown, headingPattern) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  for (let start = 0; start < lines.length; start += 1) {
    const heading = lines[start].match(/^(#{1,3})\s*(.+?)\s*$/);
    if (!heading || !headingPattern.test(heading[2])) continue;
    const body = [];
    for (let index = start + 1; index < lines.length; index += 1) {
      const nextHeading = lines[index].match(/^(#{1,3})\s+/);
      if (nextHeading && nextHeading[1].length <= heading[1].length) break;
      body.push(lines[index]);
    }
    const meaningful = body.map((line) => line.replace(/^\s*[-*|]\s*/, "").replace(/[`|]/g, "").trim())
      .find((line) => line !== ""
        && !/^[-: ]+$/.test(line)
        && !/^(?:(?:R|D|AC|FR|RISK)-[A-Za-z0-9_-]+[，,;；:\s]*)+$/i.test(line));
    if (meaningful) return meaningful;
  }
  return "";
}

/**
 * Analyze a make-decision decision-log for the four convergence dimensions and
 * the plain-language end card required by the convergence spec.
 *
 * The checks are operational: they look for readable sections/labels, not just
 * IDs or file existence. IDs are internal anchors; the user-facing surface is
 * plain language.
 */
export function analyzeDecisionConvergence(decisionLogMarkdown, {
  originalRequirement = "",
  requirementMessages = [],
  requirementCoverageOutputs = [],
} = {}) {
  const errors = [];
  const text = String(decisionLogMarkdown ?? "");
  const hasSection = (pattern) => pattern.test(text);

  const goalBody = meaningfulSectionBody(text, /^(?:核心目标|目标|goal|成功意图|success intent)$/i);
  const acceptanceBody = meaningfulSectionBody(text, /^(?:验收标准|acceptance|验收目标|AC)$/i);
  const directionBody = meaningfulSectionBody(text, /^(?:决定|decision|方案|direction|已选方向|selected direction|结论)$/i);
  const riskBody = meaningfulSectionBody(text, /^(?:开放问题|风险|延期|未决|风险与延期交接|open questions|risks|deferred)$/i);
  const coreRequirementBody = meaningfulSectionBody(text, /^(?:核心需求|core requirement)$/i);

  const requirementCoverage = hasSection(/^#{1,3}\s*(?:原始需求|requirement|来源与决策映射|需求→决定|需求矩阵)/im)
    || /(?:R-001|原始需求|requirement).*(?:D-001|决定|decision)/i.test(text);
  const goalAchievement = goalBody !== "" && /(?:实现|达成|确认|可执行|完成|achiev|executable|confirmed)/i.test(goalBody);
  const acceptanceClarity = acceptanceBody !== "" && /(?:可验证|通过|失败|条件|边界|verify|pass|fail|condition|boundary)/i.test(acceptanceBody);
  const solutionConvergence = directionBody !== "" && riskBody !== "";
  const plainLanguageCard = coreRequirementBody !== "" && goalBody !== "" && directionBody !== "";

  if (!requirementCoverage) errors.push("decision-log does not present a requirement-to-decision coverage matrix");
  if (!goalAchievement) errors.push("decision-log does not state the core goal achievement");
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
    const messageHash = typeof requirementMessage === "object" && requirementMessage !== null ? requirementMessage.content_hash : null;
    // The host-authenticated message carries identity only; the semantic
    // classification is a make-decision artifact.  Derive each message's
    // classes from its hash-bound requirement coverage outputs instead of
    // requiring the transcript line to carry a class it cannot know.
    const outputClasses = typeof messageId === "string"
      ? requirementCoverageOutputs
        .filter((entry) => entry?.message_id === messageId
          && (!/^[a-f0-9]{64}$/.test(messageHash ?? "") || entry?.message_hash === messageHash))
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
        const { id, content_hash: contentHash } = requirementMessage;
        const output = typeof id === "string" && /^[a-f0-9]{64}$/.test(contentHash ?? "")
          ? requirementCoverageOutputs.find((entry) => entry?.message_id === id
            && entry?.message_hash === contentHash && entry?.message_class === messageClass)
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
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    facts: Object.freeze({
      requirement_coverage: completeRequirementCoverage ? "passed" : "missing",
      goal_achievement: goalAchievement ? "passed" : "missing",
      acceptance_clarity: acceptanceClarity ? "passed" : "missing",
      solution_convergence: solutionConvergence ? "passed" : "missing",
      plain_language_card: plainLanguageCard ? "passed" : "missing",
    }),
  });
}

function hasMarkdownHeadings(value) {
  return /^#{1,3}\s+\S/m.test(String(value ?? ""));
}

/**
 * Check that build-spec does not invent product direction and that Clarify
 * evidence is present when the spec has material ambiguity or direction change.
 */
export function validateSpecClarifyAndDirectionFidelity(specMarkdown, decisionLogMarkdown) {
  const errors = [];
  const spec = String(specMarkdown ?? "");
  const decision = String(decisionLogMarkdown ?? "");

  const directionInventionMarkers = [
    /(?:新增产品方向|new product direction|扩展到原始决策未授权|expand beyond the authorized decision|重命名为完全不同的产品)/i,
  ];
  const explicitDirectionAuthorization = decision.split(/\r?\n/).some((line) => {
    const namesDirectionChange = directionInventionMarkers.some((pattern) => pattern.test(line));
    const authorizes = /(?:明确授权|用户(?:已)?确认允许|已批准|决定允许|同意(?:新增|扩展|重命名)|explicitly authorized|approved|allowed)/i.test(line);
    const rejects = /(?:不|未|禁止|拒绝|without|not)\s*(?:授权|批准|允许|同意|authorized|approved|allowed)/i.test(line);
    return namesDirectionChange && authorizes && !rejects;
  });
  const invented = directionInventionMarkers.some((pattern) => pattern.test(spec))
    && !explicitDirectionAuthorization;

  if (invented) errors.push("spec.md invents product direction not present in decision-log.md");

  const ambiguityLines = spec.split(/\r?\n/).filter((line) => {
    if (/(?:没有|无|零|不存在|已解决|已关闭|no)\s*(?:实质材料|材料|方向性)?\s*(?:歧义|ambiguity)/i.test(line)
        || /(?:material ambiguity|open material ambiguity)\s*=\s*0/i.test(line)) return false;
    return /(?:待澄清|仍有[^\n]{0,20}歧义|歧义[^\n]{0,20}(?:未解决|未关闭|待处理|需要用户)|\bneeds clarification\b|\bopen material ambiguity\b|\bdirection-changing ambiguity\b)/i.test(line);
  });
  const hasAmbiguity = ambiguityLines.length > 0;
  const hasTriggerTrue = /(?:spec-clarify[^\n]*|clarify[^\n]*|batch[^\n]*)trigger\s*=\s*true/i.test(spec);
  const hasTriggerFalse = /(?:spec-clarify[^\n]*|clarify[^\n]*)trigger\s*=\s*false/i.test(spec);
  const hasSkipReason = /trigger\s*=\s*false[^\n]*(?:reason\s*=\s*\S+|理由\s*[:=：]\s*\S+)/i.test(spec);
  const hasZeroOpenQuestions = /(?:open(?:_direction_changing_questions| material ambiguity| material ambiguities)?|开放(?:方向性)?问题|开放项)\s*[:=：]\s*0/i.test(spec);

  if (hasAmbiguity && !hasTriggerTrue) {
    errors.push("spec.md has material ambiguity and must record Clarify trigger=true with a reason");
  }
  if (!hasAmbiguity && !hasTriggerTrue && !(hasTriggerFalse && hasSkipReason && hasZeroOpenQuestions)) {
    errors.push("spec.md with no material ambiguity must explicitly record Clarify trigger=false, a reason, and zero open questions");
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    clarify: Object.freeze({
      trigger: hasTriggerTrue ? true : hasTriggerFalse ? false : undefined,
      reason: hasAmbiguity ? "material ambiguity present in spec" : hasTriggerTrue && hasZeroOpenQuestions
        ? "recorded Clarify completed with zero open material ambiguities"
        : "no material ambiguity detected by contract check",
      open_direction_changing_questions: hasAmbiguity && !hasTriggerTrue ? 1 : 0,
    }),
  });
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
    ["AC card", new RegExp(String.raw`^\s*-\s+\[[ xX]\]\s+\*\*${ACCEPTANCE_CRITERION_SOURCE}\*\*\s*[:：]`, "m")],
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
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11",
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
    const taskMatch = lines[index].match(/^#{3,4}\s+(T\d+\b.*?)\s*$/);
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
    covered_ac: Object.freeze(identifiers(task.fields.covered_ac ?? "", ACCEPTANCE_CRITERION_ID)),
    review_fact: task.fields.review_fact ?? null,
    completed_at: task.fields.completed_at ?? null,
  });
}

function sourceRows(document) {
  const pattern = new RegExp(String.raw`^\|\s*([A-Z][A-Z0-9-]+)\s*\|\s*(SCN-\d+)\s*\|\s*(FR-[A-Z0-9-]+)\s*\|\s*(${ACCEPTANCE_CRITERION_SOURCE})\s*\|\s*([^|]+)\|$`, "gm");
  return [...String(document ?? "").matchAll(pattern)].map((match) => Object.freeze({
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

const SPEC_ANALYZE_SOURCE_ID = /\bR-[0-9]{3}\b/g;
const SPEC_ANALYZE_DECISION_ID = /\bD-[0-9]{3}\b/g;
const SPEC_ANALYZE_FR_ID = /\bFR-[A-Z0-9]+(?:-[0-9]{3})?\b/g;
const SPEC_ANALYZE_AC_ID = new RegExp(String.raw`\b${ACCEPTANCE_CRITERION_SOURCE}\b`, "g");
const SPEC_ANALYZE_TASK_ID = /\bT[0-9]{3}\b/g;
const SPEC_ANALYZE_DEFERRED_OPEN_ID = /\b(?:DEFER|OPEN)-[0-9]{3}\b/g;
const SPEC_ANALYZE_DEFERRED_OPEN_ID_EXACT = /^(?:DEFER|OPEN)-[0-9]{3}$/;

const SPEC_ANALYZE_DEFERRED_FIELDS = Object.freeze({
  // The current four-material handoff index uses its phase/task routing
  // columns as the explicit owner/trigger carrier. These aliases are only
  // accepted inside the item-specific row/block above, never document-wide.
  owner: Object.freeze([/\bowner\b/i, /负责人|责任人|处理阶段|owner\/阶段|任务\/阶段|处理 Stage|plan\/tasks 去向/i]),
  trigger: Object.freeze([/\btrigger\b|\bwhen\b/i, /触发|条件|前置|依赖|进入阶段|进入 build-|spec 承接|plan\/tasks 去向|owner\/阶段|任务\/阶段/i]),
  handoff: Object.freeze([/\bhandoff\b|\bconsumer\b/i, /交接|去向|plan\/tasks|下游|消费者|输出|下一步|paired_task/i]),
  close_condition: Object.freeze([/\bclose(?: condition)?\b|\bacceptance\b/i, /关闭|验收|结果边界|完成条件|通过条件|失败条件|保留边界|验证|oracle|STOP|Done/i]),
});

function analyzeIds(value, pattern) {
  return [...new Set(String(value ?? "").match(pattern) ?? [])];
}

function containsAnalyzedId(value, id) {
  const text = String(value ?? "");
  if (text.includes(id)) return true;
  const match = /^(.*-)(\d+)$/.exec(id);
  if (!match) return false;
  const [, prefix, numberText] = match;
  const target = Number(numberText);
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const range = new RegExp(`${escapedPrefix}(\\d+)\\s*[—-]{1,2}\\s*(\\d+)`, "g");
  return [...text.matchAll(range)].some(([, start, end]) => {
    const low = Math.min(Number(start), Number(end));
    const high = Math.max(Number(start), Number(end));
    return target >= low && target <= high;
  });
}

function normalizeAnalyzeTrackedItems(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === "string") return { id: entry };
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      return { ...entry, id: entry.id ?? entry.item_id };
    }).filter((entry) => typeof entry?.id === "string" && SPEC_ANALYZE_DEFERRED_OPEN_ID_EXACT.test(entry.id));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([id, entry]) => ({
      ...(entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {}),
      id: entry && typeof entry === "object" && !Array.isArray(entry) ? (entry.id ?? id) : id,
    })).filter((entry) => typeof entry.id === "string" && SPEC_ANALYZE_DEFERRED_OPEN_ID_EXACT.test(entry.id));
  }
  return [];
}

function analyzeTrackedDeferredOpenItems({ decisionText, specText, planText, tasksText, raw, deferredItems, openItems }) {
  const byId = new Map();
  const add = (entry) => {
    const id = entry?.id;
    if (typeof id !== "string" || !SPEC_ANALYZE_DEFERRED_OPEN_ID_EXACT.test(id)) return;
    byId.set(id, Object.freeze({ ...(byId.get(id) ?? {}), ...entry, id }));
  };
  for (const entry of [
    ...normalizeAnalyzeTrackedItems(deferredItems),
    ...normalizeAnalyzeTrackedItems(openItems),
    ...normalizeAnalyzeTrackedItems(raw?.deferred_items),
    ...normalizeAnalyzeTrackedItems(raw?.open_items),
  ]) add(entry);
  for (const document of [decisionText, specText, planText, tasksText]) {
    for (const id of analyzeIds(document, SPEC_ANALYZE_DEFERRED_OPEN_ID)) add({ id });
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function isAnalyzeMarkdownTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(String(line ?? ""));
}

function isAnalyzeMarkdownHeading(line) {
  return /^\s*#{1,6}\s+/.test(String(line ?? ""));
}

function containsOtherDeferredOpenId(line, id) {
  return analyzeIds(line, SPEC_ANALYZE_DEFERRED_OPEN_ID).some((candidate) => candidate !== id);
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

function analyzeTableRowContext(headerLine, rowLine) {
  const headers = analyzeMarkdownTableCells(headerLine);
  const cells = analyzeMarkdownTableCells(rowLine);
  return headers.map((header, index) => {
    const cell = cells[index] ?? "";
    return cell === "" ? "" : `- **${header}**: ${cell}`;
  }).filter(Boolean).join("\n");
}

function analyzeReferenceBlock(documentLines, index, kind) {
  const marker = kind === "source"
    ? /^#{3,4}\s+/
    : /^(?:\s*-\s+\*\*(?:RISK|PLAN-RISK|F-|风险)|#{1,6}\s+)/i;
  let start = index;
  while (start > 0 && !marker.test(documentLines[start - 1])) start -= 1;
  let end = index + 1;
  while (end < documentLines.length && !marker.test(documentLines[end])) end += 1;
  return documentLines.slice(start, end).join("\n");
}

function analyzeDocumentContexts(document, id) {
  const lines = String(document ?? "").split(/\r?\n/);
  const contexts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!containsAnalyzedId(line, id)) continue;

    // A table row gets its own header and row only. This makes a grouped
    // handoff row usable for the IDs named in that row, without allowing a
    // different row elsewhere in the document to lend it fields.
    if (isAnalyzeMarkdownTableLine(line)) {
      let tableStart = index;
      while (tableStart > 0 && isAnalyzeMarkdownTableLine(lines[tableStart - 1])) tableStart -= 1;
      let tableEnd = index;
      while (tableEnd + 1 < lines.length && isAnalyzeMarkdownTableLine(lines[tableEnd + 1])) tableEnd += 1;
      const separator = lines.slice(tableStart, tableEnd + 1)
        .findIndex((candidate) => /^\s*\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(candidate));
      const header = separator > 0 ? tableStart + separator - 1 : tableStart;
      const normalized = separator > 0 ? analyzeTableRowContext(lines[header], line) : "";
      contexts.push(normalized || lines.slice(header, index + 1).join("\n"));
      continue;
    }

    // A source/affected-ID reference is only evidence that the item is
    // mentioned. It is not a handoff contract and must not absorb fields from
    // the rest of its task/risk section.
    if (/(?:source_refs|decision_refs)/i.test(line)) {
      contexts.push(analyzeReferenceBlock(lines, index, "source"));
      continue;
    }
    if (/(?:受影响 ID|affected IDs)/i.test(line)) {
      contexts.push(analyzeReferenceBlock(lines, index, "affected"));
      continue;
    }

    // For prose bullets, keep the contiguous item block. A blank line,
    // heading, or the next DEFER/OPEN item is a hard boundary. This covers
    // an item's owner/trigger/handoff/close lines while preventing a sibling
    // item's fields from satisfying it.
    let end = index + 1;
    while (end < lines.length
      && !/^\s*$/.test(lines[end])
      && !isAnalyzeMarkdownHeading(lines[end])
      && !isAnalyzeMarkdownTableLine(lines[end])
      && !containsOtherDeferredOpenId(lines[end], id)) {
      end += 1;
    }
    contexts.push(lines.slice(index, end).join("\n"));
  }
  return [...new Set(contexts)];
}

function analyzeDocumentHasField(document, id, patterns) {
  return analyzeDocumentContexts(document, id)
    .some((context) => patterns.some((pattern) => pattern.test(context)));
}

function analyzeDeferredOpenHandoff({ decisionText, specText, planText, tasksText, raw, deferredItems, openItems, findings, errors }) {
  const items = analyzeTrackedDeferredOpenItems({
    decisionText,
    specText,
    planText,
    tasksText,
    raw,
    deferredItems,
    openItems,
  });
  const documents = [
    ...(decisionText.trim() ? [{ name: "decision-log", text: decisionText }] : []),
    { name: "spec", text: specText },
    { name: "plan", text: planText },
    { name: "tasks", text: tasksText },
  ];
  const downstreamDocuments = documents.filter(({ name }) => name !== "decision-log");
  const missingByItem = new Map();
  for (const item of items) {
    const missing = [];
    if (decisionText.trim() && !decisionText.includes(item.id)) missing.push("id missing in decision-log");
    for (const { name, text } of downstreamDocuments) {
      if (!String(text ?? "").includes(item.id)) missing.push(`id missing in ${name}`);
    }
    for (const [field, patterns] of Object.entries(SPEC_ANALYZE_DEFERRED_FIELDS)) {
      const absentFrom = downstreamDocuments.filter(({ text }) => !analyzeDocumentHasField(text, item.id, patterns)).map(({ name }) => name);
      if (absentFrom.length > 0) missing.push(`${field} missing in ${absentFrom.join(",")}`);
    }
    if (missing.length > 0) {
      missingByItem.set(item.id, Object.freeze([...missing]));
      const targetArtifact = missing[0].split(" missing in ")[1] ?? "planning_artifacts";
      const finding = analyzeFinding({
        type: "deferred_open_handoff_gap",
        sourceArtifact: "decision-log",
        targetArtifact,
        id: item.id,
        anchor: `${item.id}:${missing.join(";")}`,
        impact: "延期/未决事项可能在下游材料中静默丢失，后续阶段会自行猜测",
        correction: `补齐 ${item.id} 的 owner、触发、去向和关闭条件，并传播到 spec、plan、tasks；不能由 build-code 猜测`,
      });
      findings.push(Object.freeze({ ...finding, id: item.id }));
      errors.push(`${item.id} deferred/open handoff gap: ${missing.join("; ")}`);
    }
  }
  return Object.freeze({
    ids: Object.freeze(items.map(({ id }) => id)),
    coverage: Object.freeze({
      checked: items.length,
      missing: Object.freeze([...missingByItem.keys()]),
    }),
  });
}

function analyzeField(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return String(body ?? "").match(new RegExp(`^\\s*-\\s+\\*\\*${escaped}\\*\\*\\s*[:：]\\s*(.+?)\\s*$`, "mi"))?.[1]?.trim() ?? null;
}

function hasAnalyzeField(body, ...labels) {
  return labels.some((label) => {
    const value = analyzeField(body, label);
    return typeof value === "string" && value.trim() !== "";
  });
}

function analyzeFinding({ type, sourceArtifact, targetArtifact, id, anchor, impact, correction }) {
  return Object.freeze({
    type,
    source_artifact: sourceArtifact,
    target_artifact: targetArtifact,
    fr_or_task_id: id,
    line_or_anchor: anchor,
    impact,
    suggested_correction: correction,
    disposition: "pending_main_agent_review",
  });
}

function addAnalyzeFinding(findings, errors, finding, error) {
  findings.push(finding);
  errors.push(error);
}

function addConsistencyFinding(findings, errors, { type, sourceArtifact, targetArtifact, id, anchor, impact, correction }, message) {
  addAnalyzeFinding(findings, errors, analyzeFinding({
    type,
    sourceArtifact,
    targetArtifact,
    id,
    anchor,
    impact,
    correction,
  }), message);
}

function analyzeCrossMaterialPlanningGaps({ specText, decisionText, planText, tasksText, taskRows, findings, errors }) {
  const specFrs = analyzeIds(specText, SPEC_ANALYZE_FR_ID);
  const specAcs = analyzeIds(specText, SPEC_ANALYZE_AC_ID);
  const planSections = markdownSections(planText, 2);
  const traceability = planSections.find(({ heading }) => /Requirement and Verification Traceability/i.test(heading));
  if (traceability) {
    for (const id of [...specFrs, ...specAcs]) {
      if (!containsAnalyzedId(traceability.body, id)) {
        addConsistencyFinding(findings, errors, {
          type: "missing_plan_trace",
          sourceArtifact: "spec",
          targetArtifact: "plan.traceability",
          id,
          anchor: `plan:Requirement and Verification Traceability:${id}`,
          impact: "需求虽可能落到 task，但 plan 的汇总追踪表没有声明它，人工和普通执行模型会看到不完整的交接地图",
          correction: `在 plan 的 Requirement and Verification Traceability 表补齐 ${id}、Task、AC、Phase 和 gate/evidence 行`,
        }, `plan trace gap: ${id}`);
      }
    }
  }

  const implementationOrder = planSections.find(({ heading }) => /Implementation Order/i.test(heading));
  if (implementationOrder) {
    const phaseIds = [...new Set(markdownSections(planText, 2, "Phase ")
      .flatMap(({ heading }) => heading.match(/\bP\d+\b/g) ?? []))];
    for (const phaseId of phaseIds) {
      if (!containsAnalyzedId(implementationOrder.body, phaseId)) {
        addConsistencyFinding(findings, errors, {
          type: "missing_phase_order_trace",
          sourceArtifact: "plan",
          targetArtifact: "plan.Implementation Order",
          id: phaseId,
          anchor: `plan:Implementation Order:${phaseId}`,
          impact: "Phase 已定义但执行顺序汇总没有包含它，可能导致 producer/consumer 反转",
          correction: `把 ${phaseId} 加入 Implementation Order，并与 Dependencies and Parallelism 保持一致`,
        }, `implementation order gap: ${phaseId}`);
      }
    }
  }

  const phaseSections = markdownSections(planText, 2, "Phase ");
  const hasAnyVerifySection = phaseSections.some((phase) =>
    markdownSections(`## ${phase.heading}\n${phase.body}`, 3)
      .some(({ heading }) => /^Verify$/i.test(heading)));
  if (hasAnyVerifySection) {
    for (const phase of phaseSections) {
      const verify = markdownSections(`## ${phase.heading}\n${phase.body}`, 3)
        .find(({ heading }) => /^Verify$/i.test(heading));
      const phaseTaskRows = taskRows.filter((task) => task.phase === phase.heading);
      const taskOracles = new Set(phaseTaskRows.map((task) => oracleIdentity(task.fields.oracle)).filter(Boolean));
      const verifyOracle = oracleIdentity(verify?.body);
      if (!verify) {
        addConsistencyFinding(findings, errors, {
          type: "missing_phase_verification",
          sourceArtifact: "plan",
          targetArtifact: "tasks",
          id: phase.heading,
          anchor: `plan:${phase.heading}:Verify`,
          impact: "Phase 没有独立验证合同，执行模型无法判断何时可以交接",
          correction: "补齐与该 Phase task oracle、命令和 evidence path 对齐的 Verify 小节",
        }, `phase verification gap: ${phase.heading}`);
      } else if (taskOracles.size > 0 && (!verifyOracle || !taskOracles.has(verifyOracle))) {
        addConsistencyFinding(findings, errors, {
          type: "phase_verification_mismatch",
          sourceArtifact: "plan",
          targetArtifact: "tasks",
          id: phase.heading,
          anchor: `plan:${phase.heading}:Verify:oracle`,
          impact: "Phase Verify 使用了另一套 oracle，可能把错误的测试结果当成当前 Phase 交接依据",
          correction: `让 Verify oracle 与该 Phase task oracle 对齐；当前 task oracles=${[...taskOracles].join(", ")}`,
        }, `phase verification mismatch: ${phase.heading}`);
      }
    }
  }

  const t004 = taskRows.find((task) => task.heading_id === "T004");
  if (t004 && /build-plan[^\n]*(?:blueprint|concrete testing)/i.test(t004.body)
      && !/(?:supersede|已废止|历史)/i.test(t004.body)) {
    addConsistencyFinding(findings, errors, {
      type: "stale_task_contract",
      sourceArtifact: "tasks:T004",
      targetArtifact: "build-code",
      id: "T004",
      anchor: "tasks:T004:输出",
      impact: "普通执行模型可能把已废止的 blueprint/concrete testing 调用当成当前 build-plan 合同",
      correction: "标记旧文本已被 D-015/P5 supersede，并指向当前 T013/T014 顺序",
    }, "stale task contract: T004 retains superseded build-plan testing order");
  }

  const hashFromHeader = (document, label) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    return document.match(new RegExp("^\\s*-\\s+\\*\\*" + escapedLabel + " SHA-256\\*\\*\\s*[:：]\\s*`?([a-f0-9]{64})`?\\s*$", "mi"))?.[1] ?? null;
  };
  const planSpecHash = hashFromHeader(planText, "Spec");
  const planDecisionHash = hashFromHeader(planText, "Decision-log");
  const tasksSpecHash = hashFromHeader(tasksText, "Spec");
  const tasksPlanHash = hashFromHeader(tasksText, "Plan");
  const expectedSpecHash = sha256(specText);
  const expectedPlanHash = sha256(planText);
  const expectedDecisionHash = decisionText ? sha256(decisionText) : null;
  const hashChecks = [
    ["plan Spec SHA-256", planSpecHash, expectedSpecHash, "plan"],
    ["plan Decision-log SHA-256", planDecisionHash, expectedDecisionHash, "decision-log"],
    ["tasks Spec SHA-256", tasksSpecHash, expectedSpecHash, "tasks"],
    ["tasks Plan SHA-256", tasksPlanHash, expectedPlanHash, "tasks"],
  ];
  for (const [label, actual, expected, target] of hashChecks) {
    if (actual && expected && actual !== expected) {
      addConsistencyFinding(findings, errors, {
        type: "material_hash_binding_gap",
        sourceArtifact: target === "decision-log" ? "decision-log" : target,
        targetArtifact: target,
        id: label,
        anchor: `${target}:${label}`,
        impact: "材料身份绑定到旧快照，普通执行模型无法确定它读的是哪一版 spec/plan",
        correction: `重算 ${label} 并与当前材料正文 SHA-256 一致；不要保留两个确定 hash`,
      }, `${label} does not match the supplied current material`);
    }
  }
  const bindingHash = planText.match(/\*\*Spec binding\*\*[^\n]*\"hash\"\s*:\s*\"([a-f0-9]{64})\"/i)?.[1] ?? null;
  if (bindingHash && bindingHash !== expectedSpecHash) {
    addConsistencyFinding(findings, errors, {
      type: "material_hash_binding_gap",
      sourceArtifact: "plan",
      targetArtifact: "spec",
      id: "Spec binding",
      anchor: "plan:Spec binding",
      impact: "plan §11 与 plan 头部可能绑定不同 spec 快照",
      correction: "让 §11 Spec binding 使用当前 spec.md 的 SHA-256",
    }, "plan Spec binding does not match the supplied current spec");
  }
}

function analyzeStrategyGaps(body, subject, { aggregate = false } = {}) {
  const gaps = [];
  if (aggregate) {
    const required = [
      ["tier / method", /\b(?:tier|test tier)\s*\/\s*(?:method|test method)\b/i],
      ["scenarios", /\bscenarios\b|场景/i],
      ["command", /\bcommand\b|命令/i],
      ["expected exit", /\bexpected[_ ]exit\b|预期退出/i],
      ["oracle", /\boracle\b/i],
      ["fixtures_services", /\bfixtures_services\b/i],
      ["evidence_path", /\bevidence_path\b/i],
      ["coverage limits", /\bcoverage limits\b/i],
      ["STOP", /\bSTOP\b/i],
    ];
    for (const [field, pattern] of required) {
      if (!pattern.test(String(body ?? ""))) gaps.push(field);
    }
    return gaps.map((field) => `${subject} missing ${field}`);
  }

  // Task cards intentionally keep executable fields separate so a normal
  // build-code model can read and execute them without decoding a long
  // combined sentence. Keep the legacy combined field valid for old cards and
  // fixtures, but accept the canonical split form as the current contract.
  const combined = hasAnalyzeField(body, "scenarios / commands / expected exit / oracle");
  const required = [
    ["test tier / test method", ["test tier / test method"]],
    ["scenarios", ["scenarios", "scenarios / commands / expected exit / oracle"]],
    ["command", ["gate_cmd", "command", "scenarios / commands / expected exit / oracle"]],
    ["expected exit", ["expected_exit", "expected exit", "scenarios / commands / expected exit / oracle"]],
    ["oracle", ["oracle", "scenarios / commands / expected exit / oracle"]],
    ["fixtures_services", ["fixtures_services"]],
    ["evidence_path", ["evidence_path"]],
    ["coverage limits", ["coverage limits"]],
    ["STOP", ["STOP"]],
  ];
  for (const [field, labels] of required) {
    if (field === "scenarios" || field === "command" || field === "expected exit" || field === "oracle") {
      if (combined) continue;
    }
    if (!hasAnalyzeField(body, ...labels)) gaps.push(field);
  }
  return gaps.map((field) => `${subject} missing ${field}`);
}

/**
 * Report-only consistency facts for spec-analyze. The raw requirement index is
 * a derived view of decision-log, never a fifth current material or a writer.
 * Findings deliberately remain pending until the main agent reviews them.
 */
export function validateSpecAnalyzeCompleteness({
  planningArtifacts,
  rawRequirementIndex,
  decisionLog,
  spec,
  plan,
  tasks,
  deferredItems,
  openItems,
} = {}) {
  const source = planningArtifacts && object(planningArtifacts) ? planningArtifacts : {};
  const raw = rawRequirementIndex ?? source.raw_requirement_index;
  const decision = decisionLog ?? source.decision_log ?? source.decision_log_index;
  const decisionText = typeof decision === "string" ? decision : "";
  const specText = spec ?? source.approved_spec ?? source.spec;
  const planText = plan ?? source.draft_plan ?? source.plan;
  const tasksText = tasks ?? source.draft_tasks ?? source.tasks;
  const errors = [];
  const findings = [];

  if (!object(raw) || raw.schema_version !== "raw-requirement-index.v1" || !Array.isArray(raw.entries) || raw.entries.length === 0) {
    errors.push("MATERIAL_INCOMPLETE: raw requirement index from decision-log is required");
  }
  for (const [name, value] of [["spec", specText], ["plan", planText], ["tasks", tasksText]]) {
    if (typeof value !== "string" || value.trim() === "") errors.push(`MATERIAL_INCOMPLETE: ${name} excerpt is required`);
  }
  if (errors.some((error) => error.startsWith("MATERIAL_INCOMPLETE:")) && (!specText || !planText || !tasksText)) {
    return Object.freeze({ ok: false, errors: Object.freeze(errors), findings: Object.freeze(findings), facts: Object.freeze({}) });
  }

  const sourceEntries = Array.isArray(raw?.entries) ? raw.entries : [];
  const sourceIds = sourceEntries.map((entry) => entry?.id).filter((id) => typeof id === "string" && /^R-[0-9]{3}$/.test(id));
  if (sourceIds.length !== sourceEntries.length || new Set(sourceIds).size !== sourceIds.length) {
    errors.push("MATERIAL_INCOMPLETE: raw requirement index entries need unique R-NNN ids");
  }
  for (const entry of sourceEntries) {
    const id = entry?.id;
    if (typeof id !== "string" || !/^R-[0-9]{3}$/.test(id)) continue;
    if (decisionText && !decisionText.includes(id)) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "source_gap",
        sourceArtifact: "decision-log",
        targetArtifact: "planning_artifacts",
        id,
        anchor: `decision-log:${id}`,
        impact: "原始需求没有进入当前分析输入",
        correction: "补回 decision-log 的 source index 绑定，不能由 spec-analyze 猜测",
      }), `source gap: ${id} is absent from decision-log`);
    }
    for (const decisionId of entry.decision_ids ?? []) {
      if (typeof decisionId === "string" && decisionText && !decisionText.includes(decisionId)) {
        addAnalyzeFinding(findings, errors, analyzeFinding({
          type: "source_gap",
          sourceArtifact: "decision-log",
          targetArtifact: "planning_artifacts",
          id,
          anchor: `decision-log:${decisionId}`,
          impact: "原始需求的关键决定无法回放",
          correction: `补回 ${decisionId} 的 decision-log 绑定或标记真实延期原因`,
        }), `source gap: ${id} references missing ${decisionId}`);
      }
    }
  }

  const specFrs = analyzeIds(specText, SPEC_ANALYZE_FR_ID);
  const specAcs = analyzeIds(specText, SPEC_ANALYZE_AC_ID);
  for (const id of specFrs) {
    if (!containsAnalyzedId(planText, id) || !containsAnalyzedId(tasksText, id)) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "uncovered_functional_requirement",
        sourceArtifact: "spec",
        targetArtifact: !containsAnalyzedId(planText, id) ? "plan" : "tasks",
        id,
        anchor: id,
        impact: "功能要求没有完整落到实施和执行任务",
        correction: "补齐 plan/task 映射，不在 build-code 临时补需求",
      }), `FR coverage gap: ${id}`);
    }
  }
  for (const id of specAcs) {
    if (!containsAnalyzedId(planText, id) || !containsAnalyzedId(tasksText, id)) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "uncovered_acceptance_criterion",
        sourceArtifact: "spec",
        targetArtifact: !containsAnalyzedId(planText, id) ? "plan" : "tasks",
        id,
        anchor: id,
        impact: "验收点没有完整落到任务和测试策略",
        correction: "补齐对应 task、命令、oracle 和 evidence path",
      }), `AC coverage gap: ${id}`);
    }
  }

  const taskRows = taskBlocks(String(tasksText));
  const taskIds = taskRows.map(({ heading_id }) => heading_id).filter(Boolean);
  const planTaskIds = analyzeIds(planText, SPEC_ANALYZE_TASK_ID);
  for (const id of taskIds) {
    if (!planTaskIds.includes(id)) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "orphan_task",
        sourceArtifact: "tasks",
        targetArtifact: "plan",
        id,
        anchor: `tasks:${id}`,
        impact: "任务没有计划来源，普通执行模型无法判断它是否在范围内",
        correction: "把任务挂回 plan 的 Phase/traceability，或按主 agent 评审结果删除",
      }), `orphan task: ${id} is absent from plan`);
    }
  }
  for (const id of planTaskIds) {
    if (!taskIds.includes(id)) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "orphan_task",
        sourceArtifact: "plan",
        targetArtifact: "tasks",
        id,
        anchor: `plan:${id}`,
        impact: "计划声明了没有执行卡的任务",
        correction: "补齐 tasks 执行卡，或移除无来源的计划任务",
      }), `orphan task: ${id} is absent from tasks`);
    }
  }
  for (const task of taskRows) {
    const referenceLine = task.body.match(/source_refs\s*\/\s*decision_refs[^\n]*/i)?.[0] ?? "";
    if (!analyzeIds(referenceLine, SPEC_ANALYZE_SOURCE_ID).length && !analyzeIds(referenceLine, SPEC_ANALYZE_DECISION_ID).length) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "missing_source_reference",
        sourceArtifact: "tasks",
        targetArtifact: "decision-log",
        id: task.heading_id ?? "TASK-UNKNOWN",
        anchor: `${task.heading_id ?? "task"}:source_refs / decision_refs`,
        impact: "任务无法回放到已确认需求和决定",
        correction: "补回 inherited source_refs / decision_refs",
      }), `${task.heading_id ?? "task"} missing source_refs / decision_refs`);
    }
    for (const gap of analyzeStrategyGaps(task.body, task.heading_id ?? "task")) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "missing_test_strategy",
        sourceArtifact: "tasks",
        targetArtifact: "build-code",
        id: task.heading_id ?? "TASK-UNKNOWN",
        anchor: `${task.heading_id ?? "task"}:test_strategy`,
        impact: "普通 build-code 模型缺少可直接执行的测试合同",
        correction: `补齐 ${gap.replace(`${task.heading_id ?? "task"} missing `, "")}`,
      }), gap);
    }
  }

  analyzeCrossMaterialPlanningGaps({
    specText,
    decisionText,
    planText,
    tasksText,
    taskRows,
    findings,
    errors,
  });

  const deferredOpen = analyzeDeferredOpenHandoff({
    decisionText,
    specText,
    planText,
    tasksText,
    raw,
    deferredItems: deferredItems ?? source.deferred_items,
    openItems: openItems ?? source.open_items,
    findings,
    errors,
  });

  const aggregateStart = String(tasksText).search(/^##\s+(?:4\.\s+)?Final current-snapshot aggregate strategy\b/im);
  if (aggregateStart < 0) {
    addAnalyzeFinding(findings, errors, analyzeFinding({
      type: "missing_test_strategy",
      sourceArtifact: "tasks",
      targetArtifact: "final-aggregate",
      id: "FINAL",
      anchor: "Final current-snapshot aggregate strategy",
      impact: "最终完整测试没有预先设计，build-code 可能临场重选路线",
      correction: "在 tasks 中固定最终 tier、具体 testing skill、命令、oracle、evidence 和 STOP",
    }), "missing test strategy: final current-snapshot aggregate strategy");
  } else {
    for (const gap of analyzeStrategyGaps(String(tasksText).slice(aggregateStart), "FINAL", { aggregate: true })) {
      addAnalyzeFinding(findings, errors, analyzeFinding({
        type: "missing_test_strategy",
        sourceArtifact: "tasks",
        targetArtifact: "final-aggregate",
        id: "FINAL",
        anchor: "Final current-snapshot aggregate strategy",
        impact: "最终完整测试合同不完整",
        correction: `补齐 ${gap}`,
      }), `FINAL missing ${gap}`);
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    findings: Object.freeze(findings),
    facts: Object.freeze({
      source_ids: Object.freeze(sourceIds),
      spec_fr_ids: Object.freeze(specFrs),
      spec_ac_ids: Object.freeze(specAcs),
      task_ids: Object.freeze(taskIds),
      plan_task_ids: Object.freeze(planTaskIds),
      deferred_open_ids: deferredOpen.ids,
      deferred_open_coverage: deferredOpen.coverage,
      strategy: Object.freeze({
        task_count: taskRows.length,
        final_aggregate_present: aggregateStart >= 0,
      }),
    }),
  });
}

/**
 * Narrow, report-only consistency profiles used at the end of the four
 * authoring stages. verify-code uses the separate code-review outcome.
 * These profiles consume the current packet; they never create a material,
 * writer, status gate, or fifth source of truth.
 */
export const STAGE_SPEC_ANALYZE_PROFILES = Object.freeze({
  "make-decision": Object.freeze({
    required_materials: Object.freeze(["original_requirement", "decision_log"]),
    required_evidence: Object.freeze(["decision-log"]),
    next_stage: "build-spec",
  }),
  "build-spec": Object.freeze({
    required_materials: Object.freeze(["original_requirement", "decision_log", "spec"]),
    required_evidence: Object.freeze(["decision-log", "spec"]),
    next_stage: "build-plan",
  }),
  "build-plan": Object.freeze({
    required_materials: Object.freeze(["original_requirement", "decision_log", "spec", "plan", "tasks"]),
    required_evidence: Object.freeze(["decision-log", "spec", "plan", "tasks"]),
    next_stage: "build-code",
  }),
  "build-code": Object.freeze({
    required_materials: Object.freeze(["original_requirement", "decision_log", "spec", "plan", "tasks", "implementation"]),
    required_evidence: Object.freeze(["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace"]),
    next_stage: "verify-code",
  }),
});

function stageAnalyzeFinding({
  type,
  requirementId,
  artifact,
  evidenceRef,
  sourceArtifact = "original_requirement",
  targetArtifact = artifact ?? "current-stage-output",
  frOrTaskId = requirementId ?? "stage-packet",
  lineOrAnchor = evidenceRef ?? artifact ?? "coverage",
  rule = "semantic-and-evidence-coverage",
  impact,
  correction,
}) {
  return Object.freeze({
    type,
    requirement_id: requirementId ?? null,
    artifact: artifact ?? null,
    evidence_ref: evidenceRef ?? null,
    source_artifact: sourceArtifact,
    target_artifact: targetArtifact,
    fr_or_task_id: frOrTaskId,
    line_or_anchor: lineOrAnchor,
    rule,
    evidence: Object.freeze({ artifact_ref: artifact ?? null, evidence_ref: evidenceRef ?? null }),
    impact,
    suggested_correction: correction,
    disposition: "pending_main_agent_review",
  });
}

function stageAnalyzeSummary(stage, packet, status, findings, errors = []) {
  const requirements = Array.isArray(packet.original_requirements) ? packet.original_requirements : [];
  const coverage = Array.isArray(packet.coverage) ? packet.coverage : [];
  const invalidRequirements = new Set(findings.map((item) => item.requirement_id).filter(nonEmptyString));
  const covered = requirements.filter((requirement) => coverage.some((item) =>
    item?.requirement_id === requirement?.id
      && item.status === "covered"
      && !invalidRequirements.has(requirement.id))).length;
  const total = requirements.length;
  const next = STAGE_SPEC_ANALYZE_PROFILES[stage]?.next_stage ?? "unknown";
  const repairs = Array.isArray(packet.current_stage_repairs) ? packet.current_stage_repairs : [];
  const dispositionCounts = coverage.reduce((counts, item) => {
    const disposition = item?.status ?? "unknown";
    if (disposition !== "covered") counts[disposition] = (counts[disposition] ?? 0) + 1;
    return counts;
  }, {});
  const dispositionSummary = Object.entries(dispositionCounts)
    .map(([disposition, count]) => `${disposition} ${count}`)
    .join("、");
  return Object.freeze({
    stage_work: String(packet.work_summary ?? "当前 stage 已完成产物一致性检查。"),
    requirement_coverage: `${covered}/${total} 条原始需求有语义和证据绑定（状态：${status}；以实际校验结果计数）${dispositionSummary ? `；非 covered 终态：${dispositionSummary}` : ""}。`,
    upstream_alignment: `已按 ${stage} 的累计输入检查前序产物、实际语义和证据；发现 ${findings.filter((item) => item.type === "semantic_mismatch").length} 条语义偏差、${findings.filter((item) => item.type === "stale_evidence").length} 条证据问题。`,
    current_stage_repairs: repairs.length > 0
      ? `当前 stage 已记录 ${repairs.length} 项修复：${repairs.join("；")}`
      : findings.length === 0 && errors.length === 0 ? "本次未发现需要修复的问题。" : `发现 ${findings.length + errors.length} 条输入、语义或证据问题，必须在当前 stage 修复后复查。`,
    remaining_risks: findings.length === 0 && errors.length === 0 ? "当前没有发现已知一致性风险。" : `当前仍有 ${findings.length + errors.length} 条输入、语义或证据问题，不能由下游猜测或静默移交。`,
    next_stage_boundary: `下一阶段：${next}；不得把当前问题静默移交或由下游猜测。`,
  });
}

function semanticMeaningMatches(expected, actual) {
  const normalize = (value) => String(value ?? "").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
  const left = normalize(expected);
  const right = normalize(actual);
  if (left === "" || right === "") return false;
  // Very short Chinese terms are ambiguous labels, not sufficient semantic
  // proof when the actual statement adds a different operation or outcome.
  if (left.length <= 2 && left !== right) return false;
  // A document/path/identifier/test-result claim is metadata, not proof that
  // the requested behavior exists. Only reject artifact-result phrases when
  // they are the whole actual statement or a clearly prefixed artifact claim;
  // a genuine behavior may still mention ordinary "存在" or "测试".
  const artifactClaim = /^(?:(?:文件|文档|路径|编号|id|hash)(?:存在|一致|匹配|通过|正确|可用)|(?:绿色)?测试(?:通过|成功|通过了)|测试结果(?:为|是)?(?:通过|成功))$/u;
  const compoundArtifactClaim = /^(?:文件|文档|路径|编号|id|hash)(?:已|且|有|为)?(?:检查|覆盖|存在|一致|匹配|通过|正确|可用)(?:且(?:检查|覆盖|存在|一致|匹配|通过|正确|可用))*$/u;
  const verificationClaim = /^(?:(?:已|已经)?(?:检查|核验|验证|确认|审查|复核)(?:了)?|(?:已|已经)?完成)$/u;
  const negativeClaim = /(?:不再|不支持|不能|不会|不要|不必|没法|没有|尚未|未(?:能|支持|实现|包含)?|无法|不满足|不完全|不具备|不符合|不允许|禁止|拒绝|取消|删除|移除|去掉|停止|不提供|not|no|without)/u;
  if (artifactClaim.test(right) || compoundArtifactClaim.test(right) || verificationClaim.test(left) || verificationClaim.test(right)
      || (negativeClaim.test(right) && !negativeClaim.test(left))) return false;
  if (right.includes(left)) {
    const negation = /(?:不|没|未|无|非|否|没有|尚未|不满足|不完全|不具备|不符合|未包含|not|no|without)$/u;
    let offset = right.indexOf(left);
    while (offset >= 0) {
      if (!negation.test(right.slice(0, offset))) return true;
      offset = right.indexOf(left, offset + left.length);
    }
    return false;
  }
  // Do not use fuzzy n-gram overlap as proof: short Chinese phrases can share
  // most grams while changing the behavior (提问 vs 回答). A stage profile
  // must provide an explicit semantic statement, not a lexical guess.
  return false;
}

function hasEvidenceBinding(entry) {
  return nonEmptyString(entry?.ref)
    && HASH.test(entry?.hash ?? "")
    && GIT_OID.test(entry?.snapshot_tree ?? "");
}

function addStageContractError(errors, findings, {
  type = "stage_contract_gap",
  artifact,
  anchor,
  message,
  correction = "在当前 stage 修复该产物或事实，并用同一 current revision 重跑 spec-analyze",
}) {
  errors.push(message);
  findings.push(stageAnalyzeFinding({
    type,
    artifact,
    targetArtifact: artifact,
    lineOrAnchor: anchor,
    rule: "production-stage-material-contract",
    impact: message,
    correction,
  }));
}

function hasStructuredSpecMaterial(markdown) {
  return typeof markdown === "string"
    && /^##\s+速读卡(?:（30 秒）)?\s*$/m.test(markdown)
    && /^##\s+1\.\s+/m.test(markdown);
}

function hasPlanTaskV3Material(markdown) {
  return typeof markdown === "string"
    && (templateVersion(markdown) === PLAN_TASK_V3 || /\bplan-task\.v3\b/i.test(markdown));
}

export function validateSpecFailureConditions(markdown) {
  const errors = [];
  const lines = markdown.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*-\s+\[[ xX]\]\s+\*\*AC-[A-Za-z0-9_-]+\*\*/i.test(lines[index])) starts.push(index);
  }
  for (const [position, start] of starts.entries()) {
    const block = lines.slice(start, starts[position + 1] ?? lines.length).join("\n");
    const id = lines[start].match(/\bAC-[A-Za-z0-9_-]+\b/i)?.[0] ?? `AC-${position + 1}`;
    const hasFailureCondition = /(?:^|\n)\s*(?:-\s+)?(?:\*\*)?失败(?:条件)?(?:\*\*)?\s*[:：]/m.test(block)
      || /(?:^|\n)\s*(?:-\s+)?(?:\*\*)?(?:failure condition|failure)(?:\*\*)?\s*[:：]/im.test(block);
    if (!hasFailureCondition) {
      errors.push(`${id} acceptance design is missing a failure condition`);
    }
  }
  return errors;
}

function validateStructuredSpecContracts({ markdown, packet, identity }) {
  const errors = [];
  const findings = [];
  const structure = validateSpecContentProfile(markdown);
  for (const error of structure.errors) addStageContractError(errors, findings, {
    type: "spec_contract_gap", artifact: "spec", anchor: "spec-content.v3", message: error,
  });
  const acceptance = validateAcceptanceDesignMinimum(markdown);
  for (const error of acceptance.errors) addStageContractError(errors, findings, {
    type: "acceptance_contract_gap", artifact: "spec", anchor: "验收标准", message: error,
  });
  for (const error of validateSpecFailureConditions(markdown)) addStageContractError(errors, findings, {
    type: "acceptance_contract_gap", artifact: "spec", anchor: "验收标准/失败条件", message: error,
  });

  const mappingStart = markdown.search(/^###\s+来源与决策映射\s*$/m);
  const mapping = mappingStart < 0 ? "" : markdown.slice(mappingStart);
  if (mappingStart < 0 || !/\bR-\d+\b/.test(mapping) || !/\bD-\d+\b/.test(mapping)
      || !/\bFR-[A-Z][A-Z0-9]*-\d{3}\b/.test(mapping) || !/\bAC-[A-Za-z0-9_-]+\b/.test(mapping)) {
    addStageContractError(errors, findings, {
      type: "traceability_gap", artifact: "spec", anchor: "来源与决策映射",
      message: "spec source/decision to FR/AC mapping is missing or incomplete",
    });
  }

  const frIds = identifiers(markdown, /\bFR-[A-Z][A-Z0-9]*-\d{3}\b/g);
  const acIds = identifiers(markdown, /\bAC-[A-Za-z0-9_-]+\b/g);
  for (const id of frIds) {
    if ((markdown.match(new RegExp(`\\b${id}\\b`, "g")) ?? []).length < 2) addStageContractError(errors, findings, {
      type: "traceability_gap", artifact: "spec", anchor: id,
      message: `${id} has no downstream source/decision or acceptance reference`,
    });
  }
  for (const id of acIds) {
    if ((markdown.match(new RegExp(`\\b${id}\\b`, "g")) ?? []).length < 2) addStageContractError(errors, findings, {
      type: "traceability_gap", artifact: "spec", anchor: id,
      message: `${id} has no upstream FR/source mapping reference`,
    });
  }

  const pfactLines = markdown.split(/\r?\n/).filter((line) => /^\s*-\s+\*\*PFACT-[^*]+\*\*/.test(line));
  for (const line of pfactLines) {
    const id = line.match(/\*\*(PFACT-[^*]+)\*\*/)?.[1] ?? "PFACT";
    const states = line.match(/\b(?:verified|inferred|unknown|not_applicable)\b/gi) ?? [];
    if (states.length !== 1) addStageContractError(errors, findings, {
      type: "pfact_contract_gap", artifact: "spec", anchor: id,
      message: `${id} must declare exactly one PFACT state: verified, inferred, unknown, or not_applicable`,
    });
  }

  const clarification = packet?.clarify_outcome ?? packet?.clarify;
  if (clarification !== undefined) {
    const clarifyErrors = validateClarifyOutcome(clarification, { stage: "build-spec", identity });
    for (const error of clarifyErrors) addStageContractError(errors, findings, {
      type: "clarify_contract_gap", artifact: "clarify", anchor: "spec-clarify", message: error,
    });
  } else if (!/spec-clarify[\s\S]{0,260}(?:trigger\s*=\s*false|trigger=false|executed)/i.test(markdown)) {
    addStageContractError(errors, findings, {
      type: "clarify_contract_gap", artifact: "spec", anchor: "spec-clarify",
      message: "build-spec production profile has no current Clarify outcome or explicit trigger=false reason",
    });
  }
  return { errors, findings };
}

function validateIdentityBinding(value, identity, label, errors) {
  if (!object(value)) {
    errors.push(`${label} is required`);
    return;
  }
  for (const [field, expected] of Object.entries(identity ?? {})) {
    if (expected === undefined || expected === null) continue;
    if (value[field] !== expected) errors.push(`${label}.${field} is not bound to the current ${field}`);
  }
}

function validateLifecycleEvents(value, label, errors) {
  const events = value?.events ?? value?.lifecycle_events;
  if (!Array.isArray(events) || events.map((entry) => entry?.event).join(",") !== "ask,wait,reply,resume") {
    errors.push(`${label} must contain the real ask -> wait -> reply -> resume lifecycle`);
  }
}

function validateClarifyOutcome(value, { stage = "build-spec", identity } = {}) {
  const errors = [];
  if (!object(value)) return [`${stage} Clarify outcome is required`];
  if (!new Set(["resolved", "completed"]).has(value.status)) errors.push("Clarify outcome status must be resolved or completed");
  validateIdentityBinding(value, identity, "Clarify outcome", errors);
  if (value.trigger === false) {
    if (!nonEmptyString(value.reason)) errors.push("Clarify trigger=false requires a concrete reason");
    if (value.open_direction_changing_questions !== undefined
        && value.open_direction_changing_questions !== 0) {
      errors.push("Clarify trigger=false must have zero open direction-changing questions");
    }
    if (value.lifecycle_rounds !== undefined
        && (!Array.isArray(value.lifecycle_rounds) || value.lifecycle_rounds.length > 0)) {
      errors.push("Clarify trigger=false must omit lifecycle_rounds or provide an empty array");
    }
  } else if (value.trigger === true) {
    const lifecycle = validateInteractionLifecycleSequence({ interaction_type: "spec-clarify", rounds: value.lifecycle_rounds });
    if (!lifecycle.ok) errors.push(...lifecycle.errors);
  } else {
    errors.push("Clarify outcome must explicitly declare trigger=true or trigger=false");
  }
  return errors;
}

function validateGrillSummary(value, { identity } = {}) {
  const errors = [];
  if (!object(value)) return ["make-decision analyzer requires the completed full-requirement Grill summary"];
  if (value.status !== "completed") errors.push("Grill summary must be completed");
  validateIdentityBinding(value, identity, "Grill summary", errors);
  const coverage = value.requirement_coverage;
  const expected = ["goal", "flow_or_surface", "data_or_state", "success_failure_acceptance", "constraint_non_goal_defer"];
  if (!object(coverage) || coverage.status !== "complete") errors.push("Grill requirement_coverage must be complete");
  if (!expected.every((kind) => coverage?.message_classes?.includes(kind))) errors.push("Grill must cover all five original-requirement message classes");
  if (!Array.isArray(coverage?.uncovered) || coverage.uncovered.length !== 0) errors.push("Grill must not leave an uncovered requirement class or axis");
  for (const [name, status] of Object.entries(value.exit_checks ?? {})) if (status !== "pass") errors.push(`Grill exit check ${name} is not pass`);
  return errors;
}

function validateFinalConfirmation(value, { stage = "make-decision", identity } = {}) {
  const errors = [];
  if (!object(value)) return [`${stage} analyzer requires the current final confirmation fact`];
  if (value.decision !== "accepted" && value.status !== "accepted") errors.push("final confirmation must be accepted");
  validateIdentityBinding(value, identity, "final confirmation", errors);
  if (!nonEmptyString(value.subject_ref) && !nonEmptyString(value.subject_id)) errors.push("final confirmation subject binding is required");
  if (!HASH.test(value.material_hash ?? value.decision_hash ?? "") && !nonEmptyString(value.material_revision)) errors.push("final confirmation must bind the current material identity");
  validateLifecycleEvents(value, "final confirmation", errors);
  return errors;
}

function validateEvidenceEntry(entry, evidenceByRef, identity, label, errors) {
  if (!object(entry)) {
    errors.push(`${label} must be an object with ref/hash/snapshot_tree`);
    return;
  }
  if (!hasEvidenceBinding(entry)) errors.push(`${label} ref/hash/snapshot_tree binding is invalid`);
  const current = evidenceByRef.get(entry.ref);
  if (!current || current.status !== "fresh" || current.hash !== entry.hash || current.snapshot_tree !== entry.snapshot_tree) {
    errors.push(`${label} does not bind a fresh current evidence entry`);
  }
  if (identity?.snapshot_tree && entry.snapshot_tree !== identity.snapshot_tree) errors.push(`${label} snapshot_tree is stale`);
}

function containsMaterialIdentifier(value, identifier) {
  if (!nonEmptyString(value) || !nonEmptyString(identifier)) return false;
  const escaped = identifier.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9_-])${escaped}([^A-Za-z0-9_-]|$)`).test(value);
}

function validateBuildCodeTestResult(row, evidenceByRef, identity, label, errors) {
  const test = row.test_result;
  if (!object(test)) {
    errors.push(`${label}.test_result must bind the gate to an actual test result`);
    return;
  }
  const testRef = test.evidence_ref ?? test.ref;
  if (!nonEmptyString(testRef)) errors.push(`${label}.test_result.evidence_ref is required`);
  if (!nonEmptyString(test.command)) errors.push(`${label}.test_result.command is required`);
  if (!Number.isInteger(test.expected_exit)) errors.push(`${label}.test_result.expected_exit is required`);
  if (!Number.isInteger(test.actual_exit)) errors.push(`${label}.test_result.actual_exit is required`);
  if (!nonEmptyString(test.oracle)) errors.push(`${label}.test_result.oracle is required`);
  if (!nonEmptyString(test.actual_outcome)) errors.push(`${label}.test_result.actual_outcome is required`);
  const gate = row.gate ?? {};
  if (test.command !== (gate.command ?? row.gate_command)) errors.push(`${label}.test_result.command does not match gate.command`);
  if (test.expected_exit !== (gate.expected_exit ?? row.expected_exit)) errors.push(`${label}.test_result.expected_exit does not match gate.expected_exit`);
  if (test.oracle !== (gate.oracle ?? row.oracle)) errors.push(`${label}.test_result.oracle does not match gate.oracle`);
  if (Number.isInteger(test.expected_exit) && Number.isInteger(test.actual_exit) && test.expected_exit !== test.actual_exit) {
    errors.push(`${label}.test_result actual_exit does not satisfy expected_exit`);
  }
  if (!Array.isArray(row.evidence_refs) || !row.evidence_refs.some((entry) => entry?.ref === testRef)) {
    errors.push(`${label}.test_result.evidence_ref must be one of evidence_refs`);
  }
  const evidence = evidenceByRef.get(testRef);
  if (!evidence || !object(evidence.test_result)) {
    errors.push(`${label}.test_result must bind a test_result-bearing current evidence entry`);
    return;
  }
  const bound = evidence.test_result;
  for (const field of ["command", "expected_exit", "actual_exit", "oracle", "actual_outcome"]) {
    if (bound[field] !== test[field]) errors.push(`${label}.test_result.${field} does not match bound evidence`);
  }
  if (identity?.snapshot_tree && evidence.snapshot_tree !== identity.snapshot_tree) {
    errors.push(`${label}.test_result evidence snapshot_tree is stale`);
  }
}

function validateBuildCodeAcceptanceChain({ packet, evidenceByRef, identity } = {}) {
  const errors = [];
  const findings = [];
  const currentSpecIds = activeAcceptanceCriterionIds(packet?.materials?.spec ?? "");
  const explicitExpectedIds = packet?.expected_ac_ids ?? packet?.accepted_ac_ids;
  const expectedIds = currentSpecIds;
  if (explicitExpectedIds !== undefined
      && (!Array.isArray(explicitExpectedIds)
        || explicitExpectedIds.length !== currentSpecIds.length
        || new Set(explicitExpectedIds).size !== currentSpecIds.length
        || explicitExpectedIds.some((id) => !currentSpecIds.includes(id)))) {
    errors.push("build-code acceptance chain expected_ac_ids must exactly match the active AC set in spec.md");
  }
  const rows = packet?.acceptance_coverage ?? packet?.ac_trace?.entries;
  if (!Array.isArray(rows) || rows.length === 0) return { errors: [...errors, "build-code acceptance chain is missing"], findings: [stageAnalyzeFinding({ type: "acceptance_chain_gap", artifact: "ac-trace", targetArtifact: "build-code", frOrTaskId: "AC", lineOrAnchor: "acceptance-chain", impact: "逐 AC 结果没有完整 current lineage", correction: "在当前 build-code 记录每条 AC 修复该字段并重跑 stage-end spec-analyze" })] };
  if (!Array.isArray(expectedIds) || expectedIds.length === 0) {
    errors.push("build-code acceptance chain requires a non-empty current AC set from spec.md or expected_ac_ids");
  }
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    const label = `build-code acceptance chain[${index}]`;
    if (!object(row)) { errors.push(`${label} must be an object`); continue; }
    const acId = row.acceptance_criterion_id ?? row.ac_id;
    if (!nonEmptyString(acId)) errors.push(`${label}.acceptance_criterion_id is required`);
    const keyParts = [row.task_id, acId, row.material_revision, row.snapshot_tree, row.producer_stage];
    if (keyParts.some((part) => !nonEmptyString(part))) errors.push(`${label} exact identity key task_id + AC id + material_revision + snapshot_tree + producer_stage is required`);
    if (identity) {
      if (row.task_id !== identity.task_id) errors.push(`${label}.task_id is stale`);
      if (row.material_revision !== identity.material_revision) errors.push(`${label}.material_revision is stale`);
      if (row.snapshot_tree !== identity.snapshot_tree) errors.push(`${label}.snapshot_tree is stale`);
      if (row.producer_stage !== identity.stage) errors.push(`${label}.producer_stage is stale`);
    }
    const key = keyParts.join("|");
    if (seen.has(key)) errors.push(`${label} conflicts with another result for the same exact identity key`);
    seen.add(key);
    if (row.status !== "covered") errors.push(`${label} status must be covered for a complete analyzer chain`);
    for (const field of ["source_ids", "decision_ids", "fr_ids", "task_ids"]) {
      if (!Array.isArray(row[field]) || row[field].length === 0 || row[field].some((id) => !nonEmptyString(id))) errors.push(`${label}.${field} must be non-empty`);
    }
    const materials = packet.materials ?? {};
    const requirementIds = new Set((packet.original_requirements ?? []).map((entry) => entry?.id).filter(nonEmptyString));
    for (const id of row.source_ids ?? []) if (!requirementIds.has(id)) errors.push(`${label}.source_ids contains an unknown original requirement: ${id}`);
    for (const id of row.decision_ids ?? []) if (!containsMaterialIdentifier(materials.decision_log, id)) errors.push(`${label}.decision_ids is not present in decision-log.md: ${id}`);
    for (const id of row.fr_ids ?? []) if (!containsMaterialIdentifier(materials.spec, id)) errors.push(`${label}.fr_ids is not present in spec.md: ${id}`);
    for (const id of row.task_ids ?? []) if (!containsMaterialIdentifier(materials.tasks, id)) errors.push(`${label}.task_ids is not present in tasks.md: ${id}`);
    if (!nonEmptyString(row.file_symbol)) errors.push(`${label}.file_symbol is required`);
    const implementationAnchor = row.implementation_anchor;
    const verificationAnchor = row.verification_anchor;
    if (!semanticAnchor(implementationAnchor, "implementation")) errors.push(`${label}.implementation_anchor is invalid`);
    if (!semanticAnchor(verificationAnchor, "verification")) errors.push(`${label}.verification_anchor is invalid`);
    if (implementationAnchor?.path === verificationAnchor?.path && implementationAnchor?.start_line === verificationAnchor?.start_line) errors.push(`${label} implementation and verification must be independently anchored`);
    const gate = row.gate ?? {};
    if (!nonEmptyString(gate.command ?? row.gate_command)) errors.push(`${label}.gate.command is required`);
    if (!Number.isInteger(gate.expected_exit ?? row.expected_exit)) errors.push(`${label}.gate.expected_exit is required`);
    if (!nonEmptyString(gate.oracle ?? row.oracle)) errors.push(`${label}.gate.oracle is required`);
    for (const field of ["scenario", "actual_outcome", "coverage_limits"]) if (!nonEmptyString(row[field])) errors.push(`${label}.${field} is required`);
    if (!Array.isArray(row.evidence_refs) || row.evidence_refs.length === 0) errors.push(`${label}.evidence_refs is required`);
    else for (const [refIndex, entry] of row.evidence_refs.entries()) validateEvidenceEntry(entry, evidenceByRef, identity, `${label}.evidence_refs[${refIndex}]`, errors);
    validateBuildCodeTestResult(row, evidenceByRef, identity, label, errors);
    validateEvidenceEntry(row.review_ref, evidenceByRef, identity, `${label}.review_ref`, errors);
    validateEvidenceEntry(row.stage_end_ref, evidenceByRef, identity, `${label}.stage_end_ref`, errors);
  }
  if (Array.isArray(expectedIds) && expectedIds.length > 0) {
    const actual = new Set(rows.map((row) => row?.acceptance_criterion_id ?? row?.ac_id).filter(nonEmptyString));
    for (const id of expectedIds) if (!actual.has(id)) errors.push(`acceptance chain is missing ${id}`);
    for (const id of actual) if (!expectedIds.includes(id)) errors.push(`acceptance chain contains unexpected ${id}`);
  }
  for (const error of errors) findings.push(stageAnalyzeFinding({ type: "acceptance_chain_gap", artifact: "ac-trace", targetArtifact: "build-code", frOrTaskId: "AC", lineOrAnchor: "acceptance-chain", impact: error, correction: "在当前 build-code 修复该字段并重跑 stage-end spec-analyze" }));
  return { errors, findings };
}

function validateStageMaterialContracts({ stage, materials, packet, evidenceByRef, identity } = {}) {
  const errors = [];
  const findings = [];
  if (stage === "make-decision") {
    const messages = packet?.authenticated_requirement_messages;
    const outputs = packet?.requirement_coverage_outputs ?? packet?.requirement_outputs;
    const coverage = validateRequirementCoverage({ messages, outputs });
    for (const error of coverage.errors) addStageContractError(errors, findings, {
      type: "requirement_coverage_gap", artifact: "registered-requirements", anchor: "requirement-coverage", message: error,
    });
    for (const error of validateGrillSummary(packet?.grill_summary ?? packet?.grill, { identity })) addStageContractError(errors, findings, {
      type: "grill_coverage_gap", artifact: "grill", anchor: "full-requirement-matrix", message: error,
    });
    for (const error of validateFinalConfirmation(packet?.final_confirmation ?? packet?.confirmation, { identity })) addStageContractError(errors, findings, {
      type: "confirmation_contract_gap", artifact: "confirmation", anchor: "final-confirmation", message: error,
    });
  }
  if (stage === "build-spec") {
    const checked = validateStructuredSpecContracts({ markdown: typeof materials?.spec === "string" ? materials.spec : "", packet, identity });
    errors.push(...checked.errors); findings.push(...checked.findings);
  }
  if (stage === "build-plan") {
    const structural = validatePlanTaskContract({
      spec: typeof materials?.spec === "string" ? materials.spec : "",
      plan: typeof materials?.plan === "string" ? materials.plan : "",
      tasks: typeof materials?.tasks === "string" ? materials.tasks : "",
    });
    const executable = validateExecutablePlanTaskMinimum({
      spec: typeof materials?.spec === "string" ? materials.spec : "",
      plan: typeof materials?.plan === "string" ? materials.plan : "",
      tasks: typeof materials?.tasks === "string" ? materials.tasks : "",
    });
    for (const error of [...structural.errors, ...executable.errors]) addStageContractError(errors, findings, {
      type: "plan_task_contract_gap", artifact: "plan/tasks", anchor: "plan-task.v3", message: error,
    });
  }
  if (stage === "build-code") {
    const chain = validateBuildCodeAcceptanceChain({ packet, evidenceByRef, identity });
    errors.push(...chain.errors); findings.push(...chain.findings);
  }
  return { errors, findings };
}

/**
 * Check actual semantic coverage and evidence bindings, not just IDs or file
 * existence. Missing packet input is explicitly material_incomplete.
 */
export function validateStageSpecAnalyzeProfile({ stage, packet, strict_material_contracts = false, identity } = {}) {
  const profile = STAGE_SPEC_ANALYZE_PROFILES[stage];
  if (!profile) throw new TypeError(`unknown stage spec-analyze profile: ${stage}`);
  if (!object(packet)) return Object.freeze({ ok: false, status: "material_incomplete", stage, errors: Object.freeze(["MATERIAL_INCOMPLETE: packet is required"]), findings: Object.freeze([]), summary: stageAnalyzeSummary(stage, {}, "material_incomplete", [], ["MATERIAL_INCOMPLETE: packet is required"]) });

  const errors = [];
  const findings = [];
  const materials = object(packet.materials) ? packet.materials : {};
  const evidence = Array.isArray(packet.evidence) ? packet.evidence : [];
  const evidenceByRef = new Map(evidence.map((entry) => [entry?.ref, entry]));
  const requirements = Array.isArray(packet.original_requirements) ? packet.original_requirements : [];
  const coverage = Array.isArray(packet.coverage) ? packet.coverage : [];

  if (strict_material_contracts) {
    const materialContracts = validateStageMaterialContracts({
      stage, materials, packet, evidenceByRef, identity,
    });
    errors.push(...materialContracts.errors);
    findings.push(...materialContracts.findings);
  }

  if (requirements.length === 0) errors.push("MATERIAL_INCOMPLETE: original_requirements is required");
  if (coverage.length === 0) errors.push("MATERIAL_INCOMPLETE: semantic coverage is required");
  for (const name of profile.required_materials) {
    if (!nonEmptyString(materials[name])) errors.push(`MATERIAL_INCOMPLETE: ${name} material is required for ${stage}`);
  }
  for (const ref of profile.required_evidence) {
    const entry = evidenceByRef.get(ref);
    if (!entry) errors.push(`MATERIAL_INCOMPLETE: evidence ${ref} is required for ${stage}`);
    else if (entry.status !== "fresh" || !hasEvidenceBinding(entry)) {
      findings.push(stageAnalyzeFinding({
        type: "stale_evidence",
        artifact: entry.kind ?? ref,
        evidenceRef: ref,
        impact: "证据引用存在但不是当前快照的可用证据",
        correction: `在 ${stage} 重新采集 ${ref} 的真实证据，或明确记录不可用原因`,
      }));
      errors.push(`stale evidence: ${ref}`);
    }
  }

  const requirementIds = new Set(requirements.map((entry) => entry?.id).filter(nonEmptyString));
  const coverageById = new Map();
  for (const item of coverage) {
    if (!nonEmptyString(item?.requirement_id)) {
      errors.push("coverage entry requirement_id is required");
      continue;
    }
    if (!requirementIds.has(item.requirement_id)) {
      findings.push(stageAnalyzeFinding({
        type: "requirement_gap",
        requirementId: item.requirement_id,
        artifact: Array.isArray(item.artifact_refs) ? item.artifact_refs.join(",") || null : null,
        evidenceRef: Array.isArray(item.evidence_refs) ? item.evidence_refs.join(",") || null : null,
        impact: "coverage 引用了不存在于原始需求索引的 requirement_id，不能证明任何真实需求",
        correction: "在当前 stage 删除错误编号或补回原始需求索引中的真实条目；不能用新编号掩盖遗漏",
      }));
      errors.push(`unknown requirement coverage: ${item.requirement_id}`);
      continue;
    }
    if (coverageById.has(item.requirement_id)) {
      findings.push(stageAnalyzeFinding({
        type: "requirement_gap",
        requirementId: item.requirement_id,
        artifact: Array.isArray(item.artifact_refs) ? item.artifact_refs.join(",") || null : null,
        evidenceRef: Array.isArray(item.evidence_refs) ? item.evidence_refs.join(",") || null : null,
        impact: "同一原始需求有重复 coverage，按顺序覆盖会造成结果不确定",
        correction: "在当前 stage 合并为一个明确的语义和证据绑定条目",
      }));
      errors.push(`duplicate requirement coverage: ${item.requirement_id}`);
      continue;
    }
    coverageById.set(item.requirement_id, item);
    const artifactRefs = Array.isArray(item.artifact_refs) ? item.artifact_refs : [];
    const evidenceRefs = Array.isArray(item.evidence_refs) ? item.evidence_refs : [];
    const semanticOk = item.semantic_match !== false
      && semanticMeaningMatches(item.expected_behavior, item.actual_behavior);
    const artifactOk = artifactRefs.length > 0 && artifactRefs.every((ref) => nonEmptyString(materials[ref]));
    const evidenceOk = evidenceRefs.length > 0 && evidenceRefs.every((ref) => {
      const evidenceEntry = evidenceByRef.get(ref);
      return evidenceEntry?.status === "fresh" && hasEvidenceBinding(evidenceEntry);
    });
    const scenarioOk = Array.isArray(item.scenario_refs) && item.scenario_refs.length > 0
      && item.scenario_refs.every(nonEmptyString);
    const oracleOk = Array.isArray(item.oracle_refs) && item.oracle_refs.length > 0
      && item.oracle_refs.every(nonEmptyString);
    if (item.status === "covered" && (!semanticOk || !scenarioOk || !oracleOk || !artifactOk || !evidenceOk)) {
      const type = !semanticOk || !scenarioOk || !oracleOk
        ? "semantic_mismatch" : !artifactOk ? "artifact_evidence_gap" : "stale_evidence";
      findings.push(stageAnalyzeFinding({
        type,
        requirementId: item.requirement_id,
        artifact: artifactRefs.join(",") || null,
        evidenceRef: evidenceRefs.join(",") || null,
        impact: "编号和引用存在，但没有证明实际语义与原始需求一致",
        correction: "在当前 stage 修复实际产物或补充真实证据；不能只补编号或文档路径",
      }));
      errors.push(`${type}: ${item.requirement_id}`);
    }
    const knownCoverageStates = new Set(["partial", "missing", "changed", "expanded", "stale", "not_applicable", "unavailable", "incomplete", "deferred"]);
    if (item.status !== "covered") {
      if (!knownCoverageStates.has(item.status)) {
        errors.push(`unknown coverage status: ${item.requirement_id}`);
        findings.push(stageAnalyzeFinding({
          type: "requirement_gap",
          requirementId: item.requirement_id,
          artifact: artifactRefs.join(",") || null,
          evidenceRef: evidenceRefs.join(",") || null,
          impact: `需求覆盖状态 ${String(item.status)} 未被当前 stage 合同识别，不能继续猜测`,
          correction: "在当前 stage 明确合法 coverage status 及其真实语义和证据",
        }));
        continue;
      }
      if (item.status === "not_applicable" || item.status === "deferred") {
        const requiredDispositionFields = item.status === "not_applicable"
          ? ["reason"]
          : ["owner", "trigger", "handoff", "close_condition"];
        const missingDispositionFields = requiredDispositionFields.filter((field) => !nonEmptyString(item[field]));
        if (missingDispositionFields.length > 0) {
          const type = item.status === "deferred" ? "deferred_open_handoff_gap" : "requirement_gap";
          findings.push(stageAnalyzeFinding({
            type,
            requirementId: item.requirement_id,
            artifact: artifactRefs.join(",") || null,
            evidenceRef: evidenceRefs.join(",") || null,
            impact: `${item.status} 是合法的非 covered 终态，但缺少处置依据，后续阶段可能静默猜测或丢失它`,
            correction: item.status === "deferred"
              ? `在当前 stage 补齐延期项的 owner、trigger、handoff、close_condition：${missingDispositionFields.join(", ")}`
              : "在当前 stage 补齐 not_applicable 的明确 reason；不能把不适用写成空白",
          }));
          errors.push(`${type}: ${item.requirement_id} status=${item.status} missing=${missingDispositionFields.join(",")}`);
        }
        continue;
      }
      const type = ["stale", "unavailable"].includes(item.status)
        ? "stale_evidence"
        : ["changed", "expanded"].includes(item.status) ? "semantic_mismatch" : "requirement_gap";
      findings.push(stageAnalyzeFinding({
        type,
        requirementId: item.requirement_id,
        artifact: artifactRefs.join(",") || null,
        evidenceRef: evidenceRefs.join(",") || null,
        impact: `当前需求覆盖状态为 ${item.status}，不能宣称已完整实现`,
        correction: "在当前 stage 补齐实际语义、产物或真实证据，并重新分析",
      }));
      errors.push(`${type}: ${item.requirement_id} status=${item.status}`);
    }
  }
  for (const requirementId of requirementIds) {
    if (!coverageById.has(requirementId)) {
      findings.push(stageAnalyzeFinding({
        type: "requirement_gap",
        requirementId,
        impact: "原始需求没有当前 stage 的语义覆盖记录",
        correction: "在当前 stage 补齐实际产物和证据映射，不能留给下游猜测",
      }));
      errors.push(`requirement coverage gap: ${requirementId}`);
    }
  }

  if (stage === "make-decision" && nonEmptyString(materials.decision_log) && hasMarkdownHeadings(materials.decision_log)) {
    const authenticatedMessages = Array.isArray(packet?.authenticated_requirement_messages)
      ? packet.authenticated_requirement_messages
      : [];
    const convergence = analyzeDecisionConvergence(materials.decision_log, {
      requirementMessages: authenticatedMessages,
      requirementCoverageOutputs: Array.isArray(packet?.requirement_coverage_outputs)
        ? packet.requirement_coverage_outputs
        : [],
    });
    for (const [dimension, value] of Object.entries(convergence.facts)) {
      if (value !== "passed") {
        findings.push(stageAnalyzeFinding({
          type: "convergence_gap",
          requirementId: dimension,
          impact: `decision-log convergence dimension ${dimension} is ${value}`,
          correction: "在 make-decision 补齐需求覆盖、目标达成、验收清晰、方案收敛或结束卡三要素",
        }));
        errors.push(`convergence gap: ${dimension}`);
      }
    }
  }

  if (stage === "build-spec" && nonEmptyString(materials.spec) && nonEmptyString(materials.decision_log)
      && (hasMarkdownHeadings(materials.spec) || hasMarkdownHeadings(materials.decision_log))) {
    const fidelity = validateSpecClarifyAndDirectionFidelity(materials.spec, materials.decision_log);
    if (!fidelity.ok) {
      for (const error of fidelity.errors) {
        findings.push(stageAnalyzeFinding({
          type: "spec_direction_gap",
          impact: error,
          correction: "build-spec 必须回到 make-decision 处理方向性歧义，或显式记录 Clarify 触发/跳过",
        }));
        errors.push(`spec direction fidelity: ${error}`);
      }
    }
  }

  const status = errors.some((error) => error.startsWith("MATERIAL_INCOMPLETE:"))
    ? "material_incomplete"
    : errors.length > 0 ? "inconsistent" : "consistent";
  return Object.freeze({
    ok: status === "consistent",
    status,
    stage,
    errors: Object.freeze(errors),
    findings: Object.freeze(findings),
    summary: stageAnalyzeSummary(stage, packet, status, findings, errors),
    facts: Object.freeze({
      required_materials: Object.freeze([...profile.required_materials]),
      required_evidence: Object.freeze([...profile.required_evidence]),
      requirement_count: requirements.length,
      covered_count: requirements.filter((requirement) => coverage.some((item) =>
        item?.requirement_id === requirement?.id
          && item.status === "covered"
          && !findings.some((finding) => finding.requirement_id === requirement.id))).length,
    }),
  });
}

/**
 * Single public entry point for every stage. The legacy planning call remains
 * available for old build-plan callers, while stage packets use the same
 * semantic/evidence validator instead of growing a second contract.
 */
export function validateSpecAnalyze({ profile, packet, ...legacy } = {}) {
  if (profile !== undefined) {
    if (packet === undefined) throw new TypeError("stage spec-analyze profile requires packet");
    return validateStageSpecAnalyzeProfile({ stage: profile, packet });
  }
  return validateSpecAnalyzeCompleteness(legacy);
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
  const constitutionIds = identifiers(constitution, /\b(?:F(?:11|10|[1-9])|Q[1-3]|S[1-8])\b/g);
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
  const activeAcSet = new Set(activeAcceptanceCriterionIds(spec));
  const taskRows = parsedTasks.map((task, index) => {
    for (const field of isV3 ? TASK_FIELDS_V3 : TASK_FIELDS) {
      if (!(field in task.fields) || task.fields[field].trim() === "") errors.push(`${task.heading_id ?? `task ${index + 1}`} is missing ${field}`);
    }
    if (task.fields.ID && task.fields.ID !== task.heading_id) errors.push(`task heading/ID mismatch: ${task.heading_id} != ${task.fields.ID}`);
    if (task.fields.gate_cmd && !hasExecutableCommand(task.fields.gate_cmd)) errors.push(`${task.heading_id} gate_cmd is not an executable command`);
    if (task.fields.expected_exit && !/^-?\d+$/.test(task.fields.expected_exit)) errors.push(`${task.heading_id} expected_exit must be an integer`);
    const dependencies = identifiers(task.fields.依赖 ?? "", /\bT\d+\b/g);
    const frs = identifiers(task.fields.FR ?? "", /\bFR-(?:[A-Z][A-Z0-9]*-\d{3}|\d{1,3})\b/g);
    const acs = identifiers(task.fields.AC ?? "", ACCEPTANCE_CRITERION_ID)
      .filter((id) => activeAcSet.has(id));
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
  const acceptedAcs = activeAcceptanceCriterionIds(spec);
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
    const acs = identifiers(task.fields.AC ?? "", ACCEPTANCE_CRITERION_ID);
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
  const acceptedAcs = activeAcceptanceCriterionIds(spec);
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
const V2_AC = ACCEPTANCE_CRITERION_ID;

export function activeAcceptanceCriterionIds(spec) {
  const text = String(spec ?? "");
  const heading = text.match(/^##\s+(?:\d+\.\s*)?(?:验收标准|验收清单(?:（AC）|\(AC\))?|Acceptance Criteria)\s*$/mi);
  const body = heading
    ? text.slice(heading.index + heading[0].length).split(/^##\s+/m, 1)[0]
    : text;
  const listIds = [...body.matchAll(/^\s*[-*]\s*(?:\[[ xX]\]\s*)?\*\*([^*]+)\*\*/gm)]
    .map(([, label]) => label.trim().match(new RegExp(String.raw`^(${ACCEPTANCE_CRITERION_SOURCE})(?=$|[\s（(])`, "i"))?.[1])
    .filter(Boolean);
  const tableIds = [...body.matchAll(new RegExp(String.raw`^\s*\|\s*(${ACCEPTANCE_CRITERION_SOURCE})\s*\|`, "gmi"))]
    .map(([, id]) => id);
  const headingIds = [...listIds, ...tableIds];
  const deferredIds = new Set([...text.matchAll(new RegExp(
    String.raw`\b(${ACCEPTANCE_CRITERION_SOURCE})\b[^\n]{0,180}\b(?:deferred|延期|不计入|not_applicable)\b`, "gi",
  ))].map(([, id]) => id));
  return [...new Set(headingIds.length ? headingIds : identifiers(text, ACCEPTANCE_CRITERION_ID))]
    .filter((id) => !deferredIds.has(id));
}

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
  const acceptedAcs = activeAcceptanceCriterionIds(spec ?? "");
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
