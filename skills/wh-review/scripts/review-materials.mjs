import { createHash } from "node:crypto";
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { redactProviderHostPaths, providerMaterialEntries, providerMaterialPath } from "../../../runtime/review/provider-material-projection.mjs";
import { deliveredMaterialId } from "../../../runtime/review/review-packet-identity.mjs";
import { assertReviewIdentity, reviewIdentityFromInput, reviewRuleFor } from "../../../runtime/review/review-policy.mjs";
import stageMaterials from "../../../runtime/review/stage-materials.json" with { type: "json" };
const here=dirname(fileURLToPath(import.meta.url));
const skillPlan=JSON.parse(readFileSync(resolve(here,"..","stage-skill-plan.json"),"utf8"));
const workflowhubSkills=resolve(here,"..","..");
const ACCEPTANCE_ID=/(?<![A-Za-z0-9_.-])AC-[A-Za-z0-9][A-Za-z0-9_-]*(?![A-Za-z0-9_.-])/;
const ACCEPTANCE_IDS=/(?<![A-Za-z0-9_.-])AC-[A-Za-z0-9][A-Za-z0-9_-]*(?![A-Za-z0-9_.-])/g;
const ANCHOR_PATH=/^(?:[A-Za-z0-9_][A-Za-z0-9._-]*)(?:\/[A-Za-z0-9_][A-Za-z0-9._-]*)*$/;
export const RETIRED_MATERIAL_KEYS=new Set(["phase_coverage","seam_index","phase_map_trace","integration_map"]);
function sha256(bytes){return createHash("sha256").update(bytes).digest("hex");}
function materialBytes(value){if(Buffer.isBuffer(value)||value instanceof Uint8Array)return Buffer.from(value);if(typeof value==="string")return Buffer.from(value,"utf8");return Buffer.from(JSON.stringify(value,null,2)+"\n","utf8");}
function materialPresent(value){return typeof value==="string" ? value.trim().length>0 : value!==undefined&&value!==null;}
export const PHASE_DIFF_INLINE_LIMIT_BYTES = 288 * 1024;
const PHASE_DIFF_SHARD_TARGET_BYTES = 96 * 1024;
const FULL_PHASE_DIFF_PREFIXES = [
  "runtime/",
  "workflows/",
  "skills/grill-with-docs/",
  "skills/spec-clarify/",
  "skills/talk-with-zhipeng/",
  "skills/wh-review/",
  "skills/mini-task/",
  "skills/backend-testing/",
  "skills/frontend-testing/",
  "skills/fullstack-slice-testing/",
  "skills/plan-ceo-review/",
  "skills/plan-design-review/",
  "skills/plan-eng-review/",
  "skills/simplicity-guard/",
  "skills/spec-analyze/",
  "skills/spec-tasks/",
  "skills/test-routing-advisor/",
  "tools/cli/",
];
const FULL_PHASE_DIFF_FILES = new Set(["skills/catalog.yaml"]);

// Provider-visible Phase diffs must include implementation and test source
// code regardless of which project owns the path. Keep documentation,
// configuration, fixtures, and generated reports as bounded summaries unless
// they are selected through the normal context/authority maps. If the complete
// semantic packet still exceeds the hard cap, the caller fails closed instead
// of replacing these sources with summaries.
const FULL_PHASE_DIFF_CODE_EXTENSIONS = new Set([
  ".c", ".cc", ".cpp", ".cxx", ".css", ".fish", ".go", ".h", ".hpp",
  ".java", ".js", ".jsx", ".kt", ".m", ".mjs", ".mm", ".php", ".py",
  ".pyi", ".rb", ".rs", ".sass", ".scss", ".sh", ".sql", ".svelte",
  ".swift", ".ts", ".tsx", ".vue", ".zsh",
]);
const VERIFY_CODE_EXCLUDED_PATH_SEGMENTS = new Set([
  ".git", "node_modules", ".venv", "vendor", "dist", "build", "coverage",
  "test-results", "__pycache__", "generated",
]);
const VERIFY_CODE_TEST_PATH_SEGMENTS = new Set(["test", "tests", "__tests__", "spec", "specs"]);

// verify-code reviews the current implementation, not every test, fixture,
// report, and workflow note changed while the task was being executed. Keep
// the production seams complete and deliver the directly relevant contract
// tests; all other changed paths remain represented by bounded summaries and
// the canonical diff archive. This is packet slicing only, not evidence
// deletion or a second review scope.
const VERIFY_CODE_FULL_DIFF_PREFIXES = [
  "core/",
  "runtime/",
  "skills/wh-review/scripts/",
  "skills/architect-code-review/",
  "tools/cli/",
  "tools/host/",
];
const VERIFY_CODE_FULL_DIFF_FILES = new Set([
  "skills/catalog.yaml",
  "skills/wh-review/SKILL.md",
  "skills/wh-review/contracts/provider-protocol.md",
  "skills/wh-review/contracts/verify-code.md",
  "skills/wh-review/skill-bundle.json",
  "runtime/review/stage-materials.json",
  "workflows/verify-code/SKILL.md",
  "workflows/verify-code/skill-deps.yaml",
  "workflows/verify-code/steps.json",
]);
const VERIFY_CODE_RELEVANT_TEST_FILES = new Set([
  "tests/contract/ocr-delegation-adapter.test.mjs",
  "tests/contract/ocr-delegation-route.test.mjs",
  "tests/contract/ocr-production-cutover.test.mjs",
  "tests/review/review-record-route.test.mjs",
  "tests/contract/review-materials-contract.test.mjs",
  "tests/contract/verify-architect-acceptance.test.mjs",
  "tests/stage-review-cost-policy.test.mjs",
]);
// The current verify-code OCR surface is the host/provider boundary and its
// authenticated execution consumer. Other implementation changes remain in
// the canonical diff index and summaries; sending every historical task
// helper/test implementation to a provider turns a code review into a bulk
// repository scan and is the source of the observed multi-minute stalls.
const VERIFY_CODE_REVIEW_SURFACE_PREFIXES = [
  "runtime/review/",
  "tools/cli/stage-runtime.mjs",
  "skills/wh-review/scripts/review-materials.mjs",
  "skills/wh-review/scripts/simple-review-runner.mjs",
  "workflows/verify-code/",
];
/**
 * Large Phase packets keep the implementation and workflow boundaries that
 * directly own the current contract complete. Configuration, generic skill
 * catalog/registry metadata, architecture reports, fixtures, generated
 * reports, and task materials stay provider-visible only as bounded summaries;
 * their canonical bytes remain available for audit. This keeps the provider
 * packet below the hard transport limit without hiding changed-file coverage.
 */
export function phaseDiffDeliveryForPath(path) {
  return FULL_PHASE_DIFF_FILES.has(path)
    || FULL_PHASE_DIFF_PREFIXES.some((prefix) => path.startsWith(prefix))
    || FULL_PHASE_DIFF_CODE_EXTENSIONS.has(extname(path).toLowerCase())
    ? "included"
    : "summary";
}

function excludedVerifyCodePath(path) {
  const segments = String(path).split("/");
  const lowerSegments = segments.map((segment) => segment.toLowerCase());
  if (lowerSegments.some((segment) => VERIFY_CODE_EXCLUDED_PATH_SEGMENTS.has(segment))) return true;
  const basename = lowerSegments.at(-1) ?? "";
  return /\.(?:min|bundle|generated)(?:\.[^.]+)+$/.test(basename);
}

/** Classify source changes without resolving or normalizing their paths. */
export function classifyReviewableCodePath(path) {
  if (typeof path !== "string" || excludedVerifyCodePath(path)) return null;
  if (!FULL_PHASE_DIFF_CODE_EXTENSIONS.has(extname(path).toLowerCase())) return null;
  const segments = path.toLowerCase().split("/");
  const basename = segments.at(-1) ?? "";
  const isTest = segments.some((segment) => VERIFY_CODE_TEST_PATH_SEGMENTS.has(segment))
    || /(?:^|[._-])(?:test|spec)(?:[._-]|$)/.test(basename);
  return isTest ? "test" : "implementation";
}

export function verifyCodeDiffDeliveryForPath(path) {
  return typeof path === "string" && !excludedVerifyCodePath(path) && (VERIFY_CODE_RELEVANT_TEST_FILES.has(path)
    || VERIFY_CODE_FULL_DIFF_FILES.has(path)
    || VERIFY_CODE_FULL_DIFF_PREFIXES.some((prefix) => path.startsWith(prefix))
    // verify-code is used by projects outside WorkflowHub too.  A project
    // path must not fall back to a summary merely because it is not in this
    // runtime's own prefix list; otherwise the provider receives no code
    // anchor for the actual subject under review.
    || classifyReviewableCodePath(path) !== null)
    ? "included"
    : "summary";
}

export function selectVerifyCodeDiffPaths(sections, stage) {
  if (stage !== "verify-code") return null;
  return new Set(sections
    .filter((section) => VERIFY_CODE_FULL_DIFF_FILES.has(section.path)
      || VERIFY_CODE_REVIEW_SURFACE_PREFIXES.some((prefix) => section.path === prefix || section.path.startsWith(prefix))
      || ["implementation", "test"].includes(classifyReviewableCodePath(section.path))
      || VERIFY_CODE_RELEVANT_TEST_FILES.has(section.path))
    .map((section) => section.path));
}


export function materialAllowlistForRule(rule, { includeGenerated = true } = {}) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new TypeError("MATERIAL_INCOMPLETE: material rule must be an object");
  }
  const required = [...(rule.required ?? [])];
  const optional = [...(rule.optional ?? [])];
  const generated = [...(rule.generated ?? [])];
  const forbidden = [...(rule.forbidden ?? [])];
  const generatedKeys = new Set(generated);
  const legal = [...new Set([...required, ...optional])]
    .filter((key) => includeGenerated || !generatedKeys.has(key))
    .sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
  const known = [...new Set([...required, ...optional, ...generated, ...forbidden])];
  return Object.freeze({
    required: Object.freeze(required),
    optional: Object.freeze(optional),
    generated: Object.freeze(generated),
    forbidden: Object.freeze(forbidden),
    legal: Object.freeze(legal),
    known: Object.freeze(known),
  });
}

export function materialForbiddenMessage(key, rule, { allowedKeys = null } = {}) {
  const allowlist = materialAllowlistForRule(rule);
  const legal = allowedKeys ?? allowlist.legal;
  return `MATERIAL_FORBIDDEN: ${key} is not allowed for this review; legal material keys: ${legal.join(", ")}`;
}

function assertPlainMaterials(materials) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)
      || Object.getPrototypeOf(materials) !== Object.prototype) {
    throw new TypeError("MATERIAL_INCOMPLETE: materials must be a plain object");
  }
}

/**
 * Validate the public make-decision detail input before runner-owned fields
 * are generated.  The caller supplies the current decision log bytes; the
 * runner supplies the authenticated material revision.  Keeping this check
 * at the public boundary prevents callers from guessing packet metadata or
 * silently replacing the current decision with a summary.
 */
export function validateDetailReviewInput({ materials, currentDecisionLog = null, currentMaterialRevision = null } = {}) {
  const errors = [];
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) {
    throw new TypeError("MATERIAL_INCOMPLETE: detail materials must be an object");
  }
  const rule = reviewRuleFor("make-decision", "detail");
  const allowlist = materialAllowlistForRule(rule, { includeGenerated: false });
  const required = allowlist.required.filter((key) => !allowlist.generated.includes(key));
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(materials, key)) {
      errors.push(`missing ${key}`);
      continue;
    }
    if (typeof materials[key] !== "string") {
      errors.push(`type ${key} must be text`);
      continue;
    }
    if (materials[key].trim() === "") errors.push(`empty ${key}`);
  }
  const forbidden = Object.keys(materials).filter((key) => !allowlist.legal.includes(key));
  if (forbidden.length) errors.push(`forbidden ${forbidden.join(", ")}; legal material keys: ${allowlist.legal.join(", ")}`);
  if (typeof currentDecisionLog !== "string" || currentDecisionLog.length === 0) {
    errors.push("current decision-log.md bytes are unavailable");
  } else if (typeof materials.approved_direction === "string" && materials.approved_direction !== currentDecisionLog) {
    errors.push("approved_direction must match current decision-log.md bytes");
  }
  if (errors.length) {
    const error = new Error(`MATERIAL_INCOMPLETE: detail input ${errors.join("; ")}`);
    error.code = "MATERIAL_INCOMPLETE";
    throw error;
  }
  return true;
}

export function validateVerifyAcceptanceSummary(value, { expectedCriterionIds = null } = {}) {
  const raw = Buffer.isBuffer(value) ? value.toString("utf8") : typeof value === "string" ? value : JSON.stringify(value);
  if (typeof raw !== "string" || raw.trim() === "") throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria is empty");
  const text = raw.trim();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* Markdown summaries are also supported. */ }
  if (/"criteria"\s*:\s*\[\s*\]/i.test(text) || /"acceptance_criteria"\s*:\s*\[\s*\]/i.test(text)) {
    throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria contains an empty criteria list");
  }
  const candidateArrays = [];
  if (Array.isArray(parsed)) candidateArrays.push(parsed);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const key of ["criteria", "acceptance_criteria", "items"]) {
      if (Object.hasOwn(parsed, key)) candidateArrays.push(parsed[key]);
    }
  }
  for (const entries of candidateArrays) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria must contain current AC entries");
    }
    if (entries.some((entry) => {
      if (typeof entry === "string") return !ACCEPTANCE_ID.test(entry);
      return !entry || typeof entry !== "object" || !ACCEPTANCE_ID.test(String(entry.acceptance_criterion_id ?? entry.id ?? ""));
    })) {
      throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria entries must identify ACs");
    }
  }
  if (!ACCEPTANCE_ID.test(text)) throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria must name current ACs");
  if (Array.isArray(expectedCriterionIds) && expectedCriterionIds.length > 0) {
    const actual = [...new Set([...text.matchAll(ACCEPTANCE_IDS)].map(([id]) => id.toUpperCase()))].sort();
    const expected = [...new Set(expectedCriterionIds.map((id) => String(id).toUpperCase()))].sort();
    if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
      throw new Error(`MATERIAL_INCOMPLETE: verify-code acceptance_criteria does not match current spec AC set (expected ${expected.join(", ")}, received ${actual.join(", ")})`);
    }
  }
  return true;
}

export function validateAuthorityMap(key, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`MATERIAL_INCOMPLETE: ${key} requires a structured map`);
  if (!["complete", "unknown"].includes(value.state)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.state must be complete or unknown`);
  if (typeof value.summary !== "string" || value.summary.trim() === "") throw new Error(`MATERIAL_INCOMPLETE: ${key}.summary is required`);
  if (!Array.isArray(value.entries)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.entries must be an array`);
  for (const entry of value.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof entry.id !== "string" || entry.id.trim() === "" ||
        typeof entry.subject !== "string" || entry.subject.trim() === "" ||
        typeof entry.rationale !== "string" || entry.rationale.trim() === "") {
      throw new Error(`MATERIAL_INCOMPLETE: ${key}.entries require id, subject, and rationale`);
    }
    if (Object.hasOwn(entry, "not_needed_reason")) throw new Error(`MATERIAL_FORBIDDEN: ${key}.${entry.id}.not_needed_reason is retired; declare a disposition instead`);
    if (!['complete', 'not_applicable', 'unknown'].includes(entry.disposition)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id}.disposition is required`);
    if (entry.disposition === 'complete') {
      validateAnchors(key, entry.id, entry.anchors);
    } else {
      if (entry.anchors !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id} may not mix ${entry.disposition} with anchors`);
      if (typeof entry.reason_code !== 'string' || entry.reason_code.trim() === '' || typeof entry.reason !== 'string' || entry.reason.trim() === '') {
        throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id} requires reason_code and reason for ${entry.disposition}`);
      }
    }
  }
  if (key === "evidence_map") validateDistinctAcceptanceEvidenceAnchors(value);
  if (value.state === "unknown" && (typeof value.unknown_reason !== "string" || value.unknown_reason.trim() === "")) {
    throw new Error(`MATERIAL_INCOMPLETE: ${key}.unknown_reason is required when state is unknown`);
  }
}

function validateDistinctAcceptanceEvidenceAnchors(value) {
  const owners = [];
  for (const entry of value.entries.filter(({ id, disposition }) => disposition === "complete" && /^AC-/.test(id))) {
    for (const anchor of entry.anchors ?? []) {
      const previous = owners.find(({ anchor: previousAnchor, entryId }) => entryId !== entry.id
        && previousAnchor.path === anchor.path
        && previousAnchor.start_line <= anchor.end_line
        && anchor.start_line <= previousAnchor.end_line);
      if (previous !== undefined) {
        throw new Error(`MATERIAL_INCOMPLETE: evidence_map ${previous.entryId} and ${entry.id} overlap one proving anchor; each AC needs a distinct implementation/test block`);
      }
      owners.push({ anchor, entryId: entry.id });
    }
  }
}

function validateAnchors(key, entryId, anchors) {
  if (!Array.isArray(anchors) || anchors.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entryId}.anchors must be a non-empty array`);
  const ids = new Set();
  for (const anchor of anchors) {
    if (!anchor || typeof anchor !== "object" || Array.isArray(anchor) ||
        typeof anchor.id !== "string" || anchor.id.trim() === "" || ids.has(anchor.id) ||
        !ANCHOR_PATH.test(anchor.path ?? "") || !Number.isSafeInteger(anchor.start_line) || anchor.start_line < 1 ||
        !Number.isSafeInteger(anchor.end_line) || anchor.end_line < anchor.start_line ||
        typeof anchor.role !== "string" || anchor.role.trim() === "" ||
        typeof anchor.reason !== "string" || anchor.reason.trim() === "") {
      throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entryId}.anchors require unique id, snapshot path, line range, role, and reason`);
    }
    ids.add(anchor.id);
  }
}

export function validateBuildCodeAcceptanceMap(value) {
  if (!Array.isArray(value.acceptance_ids) || value.acceptance_ids.length === 0 || value.acceptance_ids.some((id) => typeof id !== "string" || id.trim() === "") || new Set(value.acceptance_ids).size !== value.acceptance_ids.length) {
    throw new Error("MATERIAL_INCOMPLETE: acceptance_map.acceptance_ids must be a non-empty unique AC list");
  }
  const entryIds = new Set();
  for (const entry of value.entries) {
    if (!value.acceptance_ids.includes(entry.id) || entryIds.has(entry.id)) throw new Error("MATERIAL_INCOMPLETE: acceptance_map entries must map each declared AC exactly once");
    entryIds.add(entry.id);
    if (typeof entry.implementation !== "string" || entry.implementation.trim() === "" || typeof entry.verification !== "string" || entry.verification.trim() === "") {
      throw new Error("MATERIAL_INCOMPLETE: acceptance_map entries require implementation and verification");
    }
    for (const key of ["implementation_anchor_ids", "verification_anchor_ids"]) {
      if (!Array.isArray(entry[key]) || entry[key].length === 0
          || new Set(entry[key]).size !== entry[key].length
          || entry[key].some((id) => typeof id !== "string" || id.trim() === "")) {
        throw new Error(`MATERIAL_INCOMPLETE: acceptance_map ${entry.id} requires non-empty ${key}`);
      }
    }
  }
  if (entryIds.size !== value.acceptance_ids.length) throw new Error("MATERIAL_INCOMPLETE: acceptance_map must map every declared AC");
  if (value.acceptance_ids.length > 1) {
    const signatures = value.entries.map((entry) => JSON.stringify({
      change_ids: entry.change_ids ?? [],
      implementation: entry.implementation,
      verification: entry.verification,
      anchors: entry.anchors ?? [],
    }));
    if (new Set(signatures).size === 1) throw new Error("MATERIAL_INCOMPLETE: acceptance_map requires distinct evidence for each AC; generic mapping is not allowed");
  }
}

export function validatePhaseTestManifest({ required, listed } = {}) {
  if (!Array.isArray(required) || required.length === 0 || !Array.isArray(listed)) {
    throw new TypeError("phase test manifest requires required and listed path arrays");
  }
  const declared = new Set(listed);
  const missing = [...new Set(required)].filter((path) => !declared.has(path));
  if (missing.length > 0) throw new Error(`MATERIAL_INCOMPLETE: Phase test manifest is missing ${missing.join(", ")}`);
  return Object.freeze({ required: [...new Set(required)], listed: [...declared].sort() });
}

export function validateMaterialAllowlist(rule, materials) {
  const allowlist = materialAllowlistForRule(rule);
  const filtered = {};
  const discarded_facts = [];
  for (const key of Object.keys(materials)) {
    if (allowlist.legal.includes(key)) {
      filtered[key] = materials[key];
      continue;
    }
    if (allowlist.forbidden.includes(key) || RETIRED_MATERIAL_KEYS.has(key)) throw new Error(materialForbiddenMessage(key, rule));
    const fact = {
      fact_kind: "material_unknown_key_dropped",
      dropped_key: key,
      finding_excerpt: JSON.stringify({ dropped_key: key }),
      reason: "not_in_stage_material_allowlist",
    };
    console.warn(`MATERIAL_UNKNOWN_KEY_DROPPED: ${key} is not in the ${rule.stage ?? "stage"} material allowlist`);
    discarded_facts.push(fact);
  }
  return { materials: filtered, discarded_facts };
}

export function buildPlanningArtifacts({
  activationCohort = "pre",
  rawRequirementIndex = null,
  approvedSpec = null,
  draftSpec = null,
  acceptanceCriteria = null,
  draftPlan = null,
  draftTasks = null,
  phaseAuthorities = null,
  phaseIndex = null,
  deferredItems = null,
  openItems = null,
} = {}) {
  const derivedDeferredItems = deferredItems
    ?? (rawRequirementIndex && typeof rawRequirementIndex === "object" ? rawRequirementIndex.deferred_items ?? null : null);
  const derivedOpenItems = openItems
    ?? (rawRequirementIndex && typeof rawRequirementIndex === "object" ? rawRequirementIndex.open_items ?? null : null);
  const common = {
    schema_version: "spec-analyze-planning-artifacts.v1",
    source_artifact: "decision-log",
    raw_requirement_index: rawRequirementIndex,
    acceptance_criteria: acceptanceCriteria,
    ...(derivedDeferredItems === null ? {} : { deferred_items: derivedDeferredItems }),
    ...(derivedOpenItems === null ? {} : { open_items: derivedOpenItems }),
    finding_disposition: "pending_main_agent_review",
  };
  if (activationCohort === "post") return Object.freeze({
    ...common,
    schema_version: "spec-analyze-planning-artifacts.v2",
    activation_cohort: "post",
    draft_spec: draftSpec,
    phase_authorities: phaseAuthorities,
    phase_index: phaseIndex,
  });
  if (activationCohort !== "pre") throw new Error(`MATERIAL_INCOMPLETE: invalid build-plan activation cohort ${activationCohort}`);
  return Object.freeze({ ...common, approved_spec: approvedSpec, draft_plan: draftPlan, draft_tasks: draftTasks });
}

const ruleFor = reviewRuleFor;

function ruleForIdentity(stage, reviewTrack, reviewScope, reviewKind = null) {
  return ruleFor(reviewKind === "build_prd" ? "build-prd" : reviewKind ?? stage, reviewTrack, reviewKind ? null : reviewScope);
}

function stagePlanFor(stage, track, reviewKind = null) {
  if (reviewKind === "build_prd") return skillPlan.non_stage?.build_prd;
  if (reviewKind !== null && reviewKind !== undefined) return skillPlan.mini_task?.[reviewKind.split(".")[1]];
  const stagePlan = skillPlan.stages[stage];
  return stage === "make-decision" ? stagePlan?.tracks?.[track] : stagePlan;
}

function reviewSurfaceFor(stage, track, reviewScope, reviewKind) {
  if (reviewKind === "build_prd") return "build-prd";
  if (reviewKind === "mini_task.design" || reviewKind === "mini_task.implementation") return `mini-task/${reviewKind.split(".")[1]}`;
  if (stage === "make-decision") return `${stage}/${track ?? ""}`;
  if (stage === "build-code") return `${stage}/${reviewScope ?? "phase"}`;
  return stage;
}

function problemOrderFor(stage, track, reviewScope, reviewKind) {
  const surface = reviewSurfaceFor(stage, track, reviewScope, reviewKind);
  return stageMaterials.surfaces?.[surface]?.problem_order ?? [];
}

function stageReviewFocus(stage, track, reviewScope, reviewKind = null, directionMode = "full", role = null) {
  const order = problemOrderFor(stage, track, reviewScope, reviewKind);
  const ordered = order.length ? ` Review in this order: ${order.join(" -> ")}.` : "";
  const roleFocus = stage === "make-decision" && ["direction", "detail"].includes(track) && ["red", "blue"].includes(role)
    ? role === "red"
      ? " role=red：独立审查当前材料，先找会改变方向或范围的直接缺口，不依赖另一角色结论。"
      : " role=blue：对抗性审查当前材料，主动寻找隐藏前提、反例、失败后果和更小替代路径，不把 red 结果当作结论。"
    : "";
  if (reviewKind === "build_prd") return `Focus on one complete PRD review: coverage, card ownership, user flow and states, dependencies and handoff, applicable design/source facts, acceptance/failure criteria, and unnecessary scope. This is a non-stage report-only surface; debate is limited to substantive product-direction disagreement (at most two rounds), while analyze/reflection remain report-only facts. Preserve provider, transport, partial, and unavailable facts; do not invent build-plan materials or a stage result.${ordered}`;
  if (reviewKind === "mini_task.design") return `Focus on whether the mini-task current materials describe one small, safe, complete design, its risks, dependencies, boundaries, tests, rollback, and delivery; do not invent product scope.${ordered}`;
  if (reviewKind === "mini_task.implementation") return `Focus on whether the mini-task implementation matches the supplied current materials and current diff, tests, AC trace, real user result, coverage limits, and remaining risks.${ordered}`;
  if (stage === "make-decision" && track === "direction" && directionMode === "reconstruct") {
    return `First request: independently reconstruct the problem, user flow, hard constraints, non-goals, failure consequences, and the smallest reversible boundary from only the raw requirement and objective facts. Do not look for or infer a current choice.${roleFocus}${ordered}`;
  }
  if (stage === "make-decision" && track === "direction" && directionMode === "combined") {
    return `One public request: execute the broker-owned direction-review.v1 flow in order reconstruct -> reveal -> challenge. The reconstruct step may see only the raw requirement and objective facts; reveal the current choice only after the internal reconstruction is recorded; challenge the revealed choice and report one final findings object. Do not create a second public request.${roleFocus}${ordered}`;
  }
  if (stage === "make-decision" && track === "direction" && directionMode === "challenge") {
    return `Second request: use the blind reconstruction, then inspect the revealed current choice, alternatives, rationale, and assumptions. Attack the choice, failure modes, and smaller reversible alternatives; report only delivery-threatening findings.${roleFocus}${ordered}`;
  }
  if (stage === "make-decision" && track === "direction") {
    return `Focus on whether the raw requirement, user flow, boundaries, risks, and direction are complete. Do not propose or judge an implementation solution.${roleFocus}${ordered}`;
  }
  if (stage === "make-decision" && track === "detail") {
    return `Focus on whether the approved direction is turned into a complete flow, page scope, data states, success/failure boundaries, non-goals, and deferred handoff. Do not invent a new direction.${roleFocus}${ordered}`;
  }
  if (stage === "build-spec") {
    return `Focus on traceability from the approved decision to user behavior, states, boundaries, interfaces, objective acceptance, and AC 可判断性与验收盲区. Explicitly check 横向第三路、隐藏前提、防虚假共识、纵向否定. Do not re-decide product direction or plan implementation work.${ordered}`;
  }
  if (stage === "build-plan") {
    return `For post, focus on whether the current draft spec and each independent Phase execute the accepted decision in dependency order, with real consumers and test or evidence oracles; the Phase index must remain pointers only. For pre/history, inspect the legacy approved spec, plan and tasks. Do not add requirements or treat review as permission to proceed.${ordered}`;
  }
  if (stage === "build-code" && reviewScope === "phase") {
    return `Focus on the complete current Phase diff, its direct consumers, tests, acceptance trace, and actionable major or blocking risks. Ignore unrelated history and do not require a provider pass.${ordered}`;
  }
  if (stage === "build-code" && reviewScope === "integration") {
    return `Focus on the final current worktree implementation, the complete user flow, cross-Phase seams, real interfaces, state transitions, failure recovery, necessity, and actionable major or blocking risks. The host validates AC bindings separately; do not report missing or unknown task rows, receipts, snapshots, lineage, or evidence metadata unless it directly causes or conceals a user-visible behavior failure. Do not replay Phase history, cumulative diffs, or require a provider pass.${ordered}`;
  }
  if (stage === "verify-code") {
    return `Focus on the current code diff, real entry points, direct consumers, lifecycle and failure paths, security boundaries, test strength, and open implementation risks. If authenticated-evidence.json is supplied for a reviewed_execution-bound request, use it only to check whether current code and test claims match the recorded execution and to identify false-green behavior. Do not audit evidence completeness or turn missing evidence into a code finding or stage gate; report code findings only.${ordered}`;
  }
  return "Focus on the supplied stage subject, its contract, and its evidence; report advice only.";
}

const PACKET_BOUND_CODEX_READ_EXCEPTION = "Codex only when the host transport has demonstrated native hard packet filesystem, tool and environment boundaries: read-only file-view commands such as cat, sed or rg may read manifest-listed paths in this packet. This is not general shell permission. Writes, Git, network, parent/host materials, Agent/subagent and wait/poll remain prohibited. Minimal runtime read exceptions exist only to run the tools, never as review materials.";

export function reviewInstructionsFor(stage, track = null, uiScope = false, reviewScope = null, reviewKind = null, directionMode = "full", role = null, candidateExperiment = false) {
  assertReviewIdentity({ stage, reviewTrack: track, reviewScope, reviewKind });
  if (role !== null && !["red", "blue"].includes(role)) throw new Error(`MATERIAL_INCOMPLETE: invalid review role ${role}`);
  const rule = ruleForIdentity(stage, track, reviewScope, reviewKind);
  const plan = stagePlanFor(stage, track, reviewKind);
  if (!plan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${track ?? "default"}`);
  const selectedSkills = [...new Set([...(plan.required_skills ?? []), ...(uiScope === true ? (plan.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])])];
  if (["build-code", "verify-code"].includes(stage) && selectedSkills.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  const scope = reviewKind ?? (stage === "make-decision" ? `${stage}/${track}` : stage === "build-code" ? `${stage}/${reviewScope ?? "phase"}` : stage);
  const blind = stage === "make-decision" && track === "direction" && directionMode === "reconstruct"
    ? "The bundle intentionally contains no proposed solution. Judge only the requirement, facts, constraints, and decision direction."
    : stage === "verify-code"
    ? "Judge only the supplied implementation and code-review contract; the upstream stage materials are context, not a verification target."
    : "Judge the supplied stage artifact against its requirements, contract, and evidence.";
  const skillInstruction = selectedSkills.length ? `Read these manifest-declared reviewer skills before reviewing: ${selectedSkills.map((name) => `skills/${name}/SKILL.md`).join(", ")}.` : "No reviewer skills are declared for this stage.";
  const reviewInstruction = "This is a full review of the supplied current stage subject.";
  const stageFocus = stageReviewFocus(stage, track, reviewScope, reviewKind, directionMode, role);
  const verifyBound = reviewKind === "build_prd"
    ? "This is one dedicated non-stage build-prd review. Do not substitute a formal stage review, persist a canonical stage attempt/result, demand a provider verdict, or repeat an unchanged review."
    : reviewKind
    ? "This is one dedicated mini-task review. Do not substitute a standard stage review, demand a provider verdict, or repeat an unchanged review."
    : stage === "verify-code"
    ? "This is one bounded post-repair code review. Inspect the current diff, implementation assessment, real entry points and consumers, relevant test context, lifecycle and failure paths, security boundaries, and open implementation risks. When authenticated-evidence.json is supplied, use it only to check code/test execution claims for false-green behavior; do not audit completeness. Do not demand a full evidence tree, acceptance replay, material completeness, historical replay, provider pass, or another review; report only findings that can affect code delivery."
    : `${blind} ${reviewInstruction}`;
  const adviceBoundary = "Every stage produces heterologous advice as a quality fact only; this is advice only, not a completion license. An unavailable or non-terminal provider result is not advice, not empty findings, and not pass. Do not keep calling the broker to obtain pass or empty findings.";
  const buildCodeBoundary = stage === "build-code" && reviewKind === null
    ? "For build-code, record this review's real findings and transport status as advice. Downstream finding disposition and repairs continue through the manifest; they do not dispatch this completed review step again or seek a clean/provider-pass result."
    : "";
  const miniImplementationBoundary = reviewKind === "mini_task.implementation"
    ? "For mini-task implementation, perform one implementation review. Allow one focused re-review only after an actual repair or subject change; repeated findings, an unchanged subject, or no trusted terminal result remain visible as needs_human, unavailable, or incomplete. Do not mechanically retry."
    : "";
  const subjectReading = reviewKind === "build_prd"
    ? "Read the complete PRD, parent decision, task map, design facts, quality facts, and any declared source/confirmation/delivery facts; do not infer missing materials or read a repository."
    : reviewKind === "mini_task.design"
    ? "Read the supplied current materials and design risks; no implementation diff or diff index is supplied for a design review."
    : reviewKind === "mini_task.implementation"
    ? "Read the current implementation diff/snapshot and the explicitly supplied tests, AC trace, and real user result."
    : stage === "build-code" && reviewScope === "integration" && candidateExperiment
    ? "For this isolated OCR candidate integration, read the complete current worktree diff together with the final current worktree subject, full acceptance criteria, relevant test outcome, and selected implementation context. AC bindings and evidence-ledger details are host-only and are not review targets."
    : stage === "build-code" && reviewScope === "integration"
    ? "For ordinary integration, read the final current worktree subject, compact behavior requirements, relevant test outcome, and selected implementation context. No changes.diff is supplied. AC bindings and evidence-ledger details are host-only and are not review targets."
    : candidateExperiment && ["build-code", "verify-code"].includes(stage)
    ? "This isolated OCR candidate packet includes the full acceptance-criteria text; read it in full and do not substitute a compact map summary."
    : stage === "make-decision" && track === "direction" && directionMode === "reconstruct"
    ? "Read only the raw requirement and objective facts; the current choice is intentionally absent."
    : stage === "make-decision" && track === "direction" && directionMode === "challenge"
    ? "Read the raw requirement, objective facts, revealed current choice, alternatives, rationale, assumptions, and the blind reconstruction; do not treat the reconstruction as a verdict."
    : stage === "make-decision" && track === "direction" && directionMode === "combined"
    ? "Read the direction-review.v1 flow and all declared fields, but rely on the broker-enforced reveal boundary: the reconstruct step must not read current_selection before reveal."
    : "Read the complete submitted materials and any explicitly supplied diff. Do not infer files or evidence outside this bundle.";
  const roleBoundary = stage === "make-decision" && ["direction", "detail"].includes(track) && role
    ? ` This is the paired ${role} role; preserve pair_id and role provenance, and report only this role's independent advice.`
    : "";
  const findingBudget = "按根因合并同类问题；不要把同一个问题重复写成多条 finding，也不要重复描述 provider、packet、snapshot、receipt 或审查流程。每条 finding 只写最小必要的 issue、root_cause、recommendation 和一到两句可复核 evidence；不要输出推理过程、背景复述或长篇总结。不要为了凑数量少报真正独立的交付风险。";
  const candidateOcrToolBoundaries = candidateExperiment && ["build-code", "verify-code"].includes(stage)
    ? " Do not invoke Agent, subagent, child-agent, or other agent tools. Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools."
    : "";
  return `Review stage ${scope}. Read the manifest-listed relative packet paths only; begin with review-instructions.md. A broker may present the packet with a bundle/ delivery prefix; native transport presents these paths directly at its packet root. Do not add that transport prefix to findings anchors. Read contracts/ and ${skillInstruction} The manifest lists the supplied provider files. Do not fetch excluded raw logs or treat receipts and checksums as workflow permission. ${subjectReading} Use context/ only for map-selected dependencies. ${stageFocus} ${verifyBound} ${roleBoundary} ${adviceBoundary} ${buildCodeBoundary} ${miniImplementationBoundary} ${findingBudget} Return only one JSON object with findings using the requested findings-only reviewer schema; findings may be empty. Do not output verdict, pass/fail status, summary, checklist, skill execution receipts, or a second JSON object. Do not access the repository, parent directories, Git, general shell, network, or host paths. ${PACKET_BOUND_CODEX_READ_EXCEPTION}${candidateOcrToolBoundaries}\n`;
}

export function minimumReviewersFor(stage, track = null, reviewScope = null) { return ruleFor(stage, track, reviewScope).minimum_reviewers; }

function readRegisteredFile(path,label) {
  const absolute=resolve(path);let cursor="/";
  for(const part of absolute.split("/").filter(Boolean)){cursor=join(cursor,part);const st=lstatSync(cursor);if(st.isSymbolicLink()||realpathSync(cursor)!==cursor)throw new Error(`MATERIAL_INCOMPLETE: ${label} path alias ${cursor}`);}
  const named=lstatSync(absolute);if(!named.isFile()||named.nlink!==1)throw new Error(`MATERIAL_INCOMPLETE: ${label} must be a single-link regular file ${absolute}`);
  const fd=openSync(absolute,constants.O_RDONLY|constants.O_NOFOLLOW);try{const opened=fstatSync(fd);if(opened.dev!==named.dev||opened.ino!==named.ino||!opened.isFile()||opened.nlink!==1)throw new Error(`MATERIAL_INCOMPLETE: ${label} changed ${absolute}`);return readFileSync(fd);}finally{closeSync(fd);}
}

export {redactProviderHostPaths};
export function canonicalMaterialManifest(entries){return JSON.stringify([...entries].sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path))).map(({path,bytes,sha256})=>({path,bytes,sha256})));}
export function reviewMaterialBytes(key,value){return materialBytes(redactProviderHostPaths(value));}
export function requirementIds(value){return [...new Set([...String(value).matchAll(ACCEPTANCE_IDS)].map(([id])=>id))];}
export function buildReviewMaterials({attachmentRoot,reviewDataRoot,stage,reviewTrack=null,reviewScope=null,reviewKind=null,materials,source=null,role=null,uiScope=false,activationCohort="pre",authenticated_evidence=undefined,surface=null,phaseId=null}={}) {
  const identity=reviewIdentityFromInput({stage,review_track:reviewTrack,review_scope:reviewScope,review_kind:reviewKind});
  const rule=identity.stage==="build-plan"&&activationCohort==="post" ? stageMaterials.stages["build-plan"].profiles.post : ruleForIdentity(identity.stage,identity.reviewTrack,identity.reviewScope,identity.reviewKind);
  assertPlainMaterials(materials);const filtered=validateMaterialAllowlist(rule,materials);
  const generated=new Set(rule.generated ?? []);const missing=(rule.required ?? []).filter(key=>!generated.has(key)&&!materialPresent(filtered.materials[key]));
  const base=resolve(attachmentRoot ?? reviewDataRoot);if(realpathSync(base)!==base||!lstatSync(base).isDirectory())throw new Error("MATERIAL_INCOMPLETE: attachment root must be a real directory");
  const packetParent=join(base,".wh-review-packets");mkdirSync(packetParent,{recursive:true});if(realpathSync(packetParent)!==packetParent)throw new Error("MATERIAL_INCOMPLETE: packet path alias");
  const bundleRoot=mkdtempSync(join(packetParent,"review-"));const entries=[];
  const write=(path,value)=>{if(isAbsolute(path)||path.split("/").some(x=>!x||x===".."||x==="."))throw new Error("MATERIAL_INCOMPLETE: unsafe bundle path");const bytes=materialBytes(redactProviderHostPaths(value));const target=join(bundleRoot,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes,{flag:"wx",mode:0o600});entries.push({path,bytes:bytes.length,sha256:sha256(bytes)});};
  try {
    const documentFace=surface==="document"&&stage==="build-code";
    const codePacket=["build-code","verify-code"].includes(stage)&&!documentFace;
    const instruction=documentFace
      ? `Review stage build-code; subject_kind=phase; review_scope=phase; phase_id=${phaseId ?? "not supplied"}; surface=document. This is the current Phase's document review, not a build-plan stage result or an OCR code review. Read the complete submitted specification, Phase material, method/contract documents and metadata. Apply contracts/build-plan.md as the existing document review lens: requirement-to-implementation-to-consumer-to-verification, dependencies, boundary, recovery and necessity. The actual stage remains build-code. Do not evaluate unsubmitted code or demand snapshot/hash/receipt/lineage permits. Read manifest-declared reviewer skills and contracts/provider-protocol.md. Report only concrete delivery findings with relative file/line anchors and genuine serious evidence. Findings, including empty findings, are advice only; missing quality stays unknown and provider/transport/parse failure remains unavailable/incomplete. Do not access repository files, Git, general shell, network or host paths. ${PACKET_BOUND_CODEX_READ_EXCEPTION} Return exactly one findings JSON.\n`
      : reviewInstructionsFor(stage,reviewTrack,uiScope,reviewScope,reviewKind,stage==="make-decision"&&reviewTrack==="direction"?"combined":"full",role);
    write("review-instructions.md",instruction+(missing.length ? `\nSupplied material is incomplete: ${missing.join(", ")}. Missing quality is unknown, not a pass.\n` : ""));
    const plan=stagePlanFor(stage,reviewTrack,reviewKind);if(!plan)throw new Error(`MATERIAL_INCOMPLETE: no skill plan for ${stage}`);
    const surfaceName=surface==="document"&&stage==="build-code" ? "build-plan" : reviewSurfaceFor(stage,reviewTrack,reviewScope,reviewKind);const contract=stageMaterials.surfaces?.[surfaceName]?.contract;
    if(typeof contract!=="string" || !/^contracts\/[a-z0-9-]+\.md$/.test(contract))throw new Error(`MATERIAL_INCOMPLETE: missing contract for ${surfaceName}`);
    write(contract,readRegisteredFile(resolve(here,"..",contract),contract));
    write("contracts/provider-protocol.md",readRegisteredFile(resolve(here,"..","contracts","provider-protocol.md"),"provider-protocol.md"));
    if(codePacket)for(const name of ["build-code.md","verify-code.md"]){const path=`contracts/${name}`;if(!entries.some(entry=>entry.path===path))write(path,readRegisteredFile(resolve(here,"..","contracts",name),path));}
    const lensPlans=codePacket ? [plan,stagePlanFor("build-code",null),stagePlanFor("verify-code",null)] : [plan];
    for(const name of [...new Set(lensPlans.flatMap(p=>[...(p.required_skills ?? []),...(uiScope ? (p.optional_skills ?? []).filter(x=>x.when==="ui").map(x=>x.name) : [])]))]) {
      if(typeof name!=="string" || !/^[a-z0-9][a-z0-9-]*$/.test(name))throw new Error("MATERIAL_INCOMPLETE: unsafe skill name");
      write(`skills/${name}/SKILL.md`,readRegisteredFile(resolve(workflowhubSkills,name,"SKILL.md"),name));
    }
    providerMaterialEntries({stage,review_track:reviewTrack,review_scope:reviewScope,review_kind:reviewKind,activation_cohort:activationCohort,materials:filtered.materials}).forEach(([key,value],index)=>{if(key!=="review_instructions")write(codePacket&&key==="acceptance_criteria" ? `requirements/acceptance_criteria.${typeof value==="string" ? "md" : "json"}` : providerMaterialPath(key,index,redactProviderHostPaths(value)),value);});
    if(codePacket&&source)write("source.json",{captured_head:source.capturedHead,baseline_commit:source.baseCommit});
    if(source?.diffPath)write("changes.diff",readRegisteredFile(source.diffPath,"supplied diff"));
    if(authenticated_evidence!==undefined)write("authenticated-evidence.json",authenticated_evidence);
    const manifest={version:1,stage,review_scope:reviewScope,subject_kind:reviewScope==="phase" ? "phase" : "document",phase_id:phaseId,surface:surface ?? reviewKind ?? stage,files:[...entries]};write("manifest.json",JSON.stringify(manifest,null,2)+"\n");
    return {bundleRoot,attachmentRoot:base,sourcePrefix:relative(base,bundleRoot).split("\\").join("/"),materialId:deliveredMaterialId(entries),deliveryManifest:entries,discarded_facts:filtered.discarded_facts,dispose(){rmSync(bundleRoot,{recursive:true,force:true});}};
  } catch(error){rmSync(bundleRoot,{recursive:true,force:true});throw error;}
}
