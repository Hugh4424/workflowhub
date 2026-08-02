import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, resolve } from "node:path";

import { assertGitCheckpointPlan, createGitCheckpoint, materializeGitCheckpoint, verifyGitCheckpoint, verifyGitCheckpointPlan } from "./git-checkpoint.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "../runtime/stage/stage-acceptance-policy.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";
import { ArtifactDir, assertArtifactDir } from "./artifact-dir.mjs";
import { validateTaskMaterialRevision, validateTaskMaterialRevisionVersionAware } from "../runtime/stage/stage-content-contracts.mjs";
import { captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import factsContract from "../contracts/facts-subschema.json" with { type: "json" };
import { validateSchema } from "../runtime/review/schema-validator.mjs";
import { deriveChangeClassification } from "../runtime/review/review-controller.mjs";
import {
  authenticateCanonicalReviewResult,
  conservativelyAssessUnattestedAnchors,
  parseCanonicalReviewerOutput,
} from "../runtime/review/canonical-review-result.mjs";
import { hashAuditSummary } from "../runtime/evidence/audit-summary-carrier.mjs";
import { createRequirementLedger, createRequirementsCoverage } from "../runtime/evidence/requirement-ledger.mjs";
import { validateEntryPayload, validateExitPayload } from "./receipt-schema.mjs";
import { validateHumanConfirmation } from "./canonical-evidence-validators.mjs";
import {
  buildRiskAcceptance,
  deriveSeriousReviewPause,
  validateRiskAcceptance,
} from "../runtime/review/stage-review-disposition.mjs";
import { assertRuntimeStageSkillInvocation, serializeStageSkillInvocation, stageSkillInvocationRef } from "./stage-skill-invocation.mjs";
import { createMaterialRevision as createUnifiedMaterialRevision } from "../runtime/task/material-revision.mjs";
import { createQualityFact as createUnifiedQualityFact, publishQualityFact as publishUnifiedQualityFact } from "../runtime/evidence/quality-fact.mjs";
import { createPublication as createUnifiedPublication, publishPublication as publishUnifiedPublication } from "../runtime/stage/publication.mjs";
import { evaluateFactFreshness } from "../runtime/evidence/freshness.mjs";
import { validateAcceptanceEvidence } from "../runtime/evidence/acceptance-evidence-validator.mjs";
export { createMaterialRevision } from "../runtime/task/material-revision.mjs";
export { createQualityFact } from "../runtime/evidence/quality-fact.mjs";
export { deriveStageCompletion } from "../runtime/stage/completion-predicates.mjs";
export { validateAcceptanceEvidence } from "../runtime/evidence/acceptance-evidence-validator.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const ATTEMPT_REF = /^attempt-([0-9]{4})\.json$/;
const ACCEPTED_FILE = /^accepted(?:-attempt-([0-9]{4}))?\.json$/;
const HASH = /^[a-f0-9]{64}$/;
const STAGE_CONTENT_REF = /^evidence\/stage-content\/([a-f0-9]{64})\/interaction-completion\.(?:talk-[0-9]{4}|grill|grill-revalidation-[0-9]{4}|aggregate)\.json$/;
const DECISION_RECEIPT_REF = "receipts/decision.json";
const RESULT_REF_FOR_FLOW = /^reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const ATTEMPT_REF_FOR_FLOW = /^reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json$/;
const RESOLUTION_REF_FOR_FLOW = /^reviews\/resolutions\/[a-f0-9]{64}\.json$/;
const EXPECTED_UPSTREAM = Object.freeze({
  "make-decision": null,
  "build-spec": "make-decision",
  "build-plan": "build-spec",
  "build-code": "build-plan",
  "verify-code": "build-code",
});
const INPUT_STAGES = Object.freeze({
  decision: "make-decision",
  spec: "build-spec",
  build_plan: "build-plan",
});
const GIT_OID = /^[a-f0-9]{40}$/i;

const REQUIRED_FACTS = Object.freeze(Object.fromEntries(
  Object.entries(factsContract.stages).map(([stage, contract]) => [stage, Object.freeze([...contract.required_keys])]),
));
const ALLOWED_FACTS = Object.freeze({
  "make-decision": new Set(["worktree_root", "baseline_commit", "snapshot_tree", "decision", "scope", "risks", "decision_ref", "decision_hash", "reviews", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "audit_through_step_id", "content_evidence_refs"]),
  "build-spec": new Set(["spec_ref", "checkpoint", "review", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
  "build-plan": new Set(["plan_ref", "tasks_ref", "checkpoint", "review", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
  "build-code": new Set(["changed", "tests", "review", "phase_completion", "acceptance_coverage", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
  "verify-code": new Set(["tests", "review", "evidence_refs", "browser_qa", "verification_items", "quality_note", "audit_gaps", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
});
const AUDIT_FACT_KEYS = ["audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"];

function stageName(stage) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  return stage;
}

function plain(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function parseJson(raw, label) {
  try { return JSON.parse(raw); } catch (error) { throw new Error(`invalid ${label}: ${error.message}`); }
}

function hash(raw) { return createHash("sha256").update(raw).digest("hex"); }

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function normalizeReviewFlowIdentity(task, value) {
  plain(value, "review flow identity");
  rejectUnknown(value, new Set([
    "task_id", "workflow_run_id", "stage", "review_track", "subject_kind", "phase_id", "review_scope", "snapshot_tree",
  ]), "review flow identity");
  if (value.task_id !== undefined && value.task_id !== task.identity.taskId) throw new Error("review flow task identity mismatch");
  const workflowRunId = nonemptyString(value.workflow_run_id, "review flow workflow_run_id");
  if (workflowRunId.length > 256 || /[\u0000-\u001f]/.test(workflowRunId)) throw new TypeError("review flow workflow_run_id is invalid");
  const stage = stageName(value.stage);
  const reviewTrack = value.review_track ?? null;
  const subjectKind = nonemptyString(value.subject_kind, "review flow subject_kind");
  const phaseId = value.phase_id ?? null;
  const reviewScope = value.review_scope ?? null;
  const snapshotTree = value.snapshot_tree ?? null;
  for (const [entry, label] of [
    [reviewTrack, "review_track"], [phaseId, "phase_id"], [reviewScope, "review_scope"],
  ]) {
    if (entry !== null && (typeof entry !== "string" || entry.trim() === "" || entry.length > 256)) {
      throw new TypeError(`review flow ${label} must be null or non-empty text`);
    }
  }
  if (snapshotTree !== null && !GIT_OID.test(snapshotTree)) throw new TypeError("review flow snapshot_tree must be a Git tree id");
  if (snapshotTree !== null && !(stage === "build-code"
      && ((subjectKind === "phase" && reviewScope === "phase" && phaseId !== null)
        || (subjectKind === "worktree" && reviewScope === "integration" && phaseId === null)))) {
    throw new Error("review flow snapshot_tree is only valid for a build-code Phase or integration review");
  }
  return Object.freeze({
    task_id: task.identity.taskId,
    workflow_run_id: workflowRunId,
    stage,
    review_track: reviewTrack,
    subject_kind: subjectKind,
    phase_id: phaseId,
    review_scope: reviewScope,
    ...(snapshotTree === null ? {} : { snapshot_tree: snapshotTree }),
  });
}

function reviewFlowId(identity) {
  return hash(JSON.stringify(identity));
}

function validateRefs(refs, label) {
  if (!Array.isArray(refs)) throw new TypeError(`${label} must be an array`);
  for (const ref of refs) {
    plain(ref, `${label} entry`);
    if (!(typeof ref.task_id === "string" && STAGES.includes(ref.stage) && typeof ref.accepted_ref === "string" && /^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/accepted\.json$/.test(ref.accepted_ref))) {
      throw new TypeError(`${label} entry requires task_id, stage, and relative accepted_ref`);
    }
  }
}

export function validateStageFacts(stage, facts, {
  allowLegacyBuildCode = false,
  allowLegacyAuditRead = false,
  allowMissingAuditSupport = false,
} = {}) {
  const name = stageName(stage);
  plain(facts, `${name} facts`);
  const missing = REQUIRED_FACTS[name].filter((key) => !Object.prototype.hasOwnProperty.call(facts, key)
    && !(allowLegacyBuildCode && name === "build-code" && key === "acceptance_coverage"));
  if (missing.length) throw new Error(`${name} facts missing required keys: ${missing.join(", ")}`);
  const empty = REQUIRED_FACTS[name].filter((key) => !(allowLegacyBuildCode && name === "build-code" && key === "acceptance_coverage")
    && (facts[key] === null || facts[key] === undefined || facts[key] === ""));
  if (empty.length) throw new Error(`${name} facts contain empty required keys: ${empty.join(", ")}`);
  rejectUnknown(facts, ALLOWED_FACTS[name], `${name} facts`);
  const missingAudit = AUDIT_FACT_KEYS.filter((key) => !Object.prototype.hasOwnProperty.call(facts, key));
  const legacyAuditRead = allowLegacyAuditRead && missingAudit.length === AUDIT_FACT_KEYS.length;
  const missingAuditSupport = allowMissingAuditSupport && missingAudit.length === AUDIT_FACT_KEYS.length;
  if (missingAudit.length && !legacyAuditRead && !missingAuditSupport) {
    throw new Error(`${name} facts missing audit carrier/content evidence: ${missingAudit.join(", ")}`);
  }
  if (!legacyAuditRead && !missingAuditSupport) {
    if (facts.audit_contract_version !== "v1") throw new Error(`${name} audit carrier version must be v1`);
    if (!new RegExp(`^evidence/audits/${name}/[a-f0-9]{64}\\.json$`).test(facts.audit_summary_ref ?? "")) throw new Error(`${name} audit summary ref is invalid`);
    if (!HASH.test(facts.audit_summary_hash ?? "")) throw new Error(`${name} audit summary hash must be sha256`);
    if (!new Set(["pass", "fail"]).has(facts.audit_verdict)) throw new Error(`${name} audit verdict must be pass or fail`);
    if (!Array.isArray(facts.content_evidence_refs)) throw new Error(`${name} content evidence refs must be an array`);
  }
  if (name === "make-decision") {
    absoluteString(facts.worktree_root, "make-decision facts.worktree_root");
    gitOid(facts.baseline_commit, "make-decision facts.baseline_commit");
    if (facts.snapshot_tree !== undefined) gitOid(facts.snapshot_tree, "make-decision facts.snapshot_tree");
    if ((facts.decision_ref === undefined) !== (facts.decision_hash === undefined)) throw new TypeError("make-decision decision_ref and decision_hash must be provided together");
    if (facts.decision_ref !== undefined) {
      artifactRef(facts.decision_ref, "make-decision facts.decision_ref");
      if (!HASH.test(facts.decision_hash)) throw new TypeError("make-decision facts.decision_hash must be sha256");
    }
  }
  if (name === "build-spec") {
    artifactRef(facts.spec_ref, "build-spec facts.spec_ref");
    validateCheckpointPlan(facts.checkpoint);
  }
  if (name === "build-plan") {
    artifactRef(facts.plan_ref, "build-plan facts.plan_ref");
    artifactRef(facts.tasks_ref, "build-plan facts.tasks_ref");
    validateCheckpointPlan(facts.checkpoint);
  }
  if (name === "build-code") {
    if (!Array.isArray(facts.changed)) throw new TypeError("build-code facts.changed must be an array");
    facts.changed.forEach((ref, index) => artifactRef(ref, `build-code facts.changed[${index}]`));
    validateTests(facts.tests, "build-code facts.tests");
    validateReview(facts.review, "build-code facts.review");
    validatePhaseCompletion(facts.phase_completion, "build-code facts.phase_completion", {
      allowLegacyBoolean: allowLegacyBuildCode,
      requireAuthenticatedEvidence: !allowLegacyBuildCode,
    });
    if (typeof facts.phase_completion === "object") {
      const reviewRef = facts.review.result_ref ?? facts.review.attempt_ref;
      const reviewHash = facts.review.result_hash ?? facts.review.attempt_hash;
      if (facts.phase_completion.integration_review?.ref !== reviewRef
          || facts.phase_completion.integration_review?.sha256 !== reviewHash) {
        throw new Error("build-code phase_completion integration_review must bind facts.review");
      }
    }
  }
  if (name === "verify-code") {
    validateTests(facts.tests, "verify-code facts.tests");
    validateReview(facts.review, "verify-code facts.review");
    validateEvidenceRefs(facts.evidence_refs, "verify-code facts.evidence_refs");
    if (facts.browser_qa !== undefined) validateBrowserQaFacts(facts.browser_qa);
    if (facts.verification_items !== undefined) validateVerificationItems(facts.verification_items);
  }
  return facts;
}

const REQUIRED_VERIFY_ITEM_IDS = Object.freeze([
  "current_materials",
  "diff_scope",
  "risk_tests",
  "acceptance_criteria",
  "tasks_completion",
  "browser_qa",
  "independent_review_resolution",
  "core_gaps",
  "human_handoff",
]);

function validateVerificationItems(value) {
  if (!Array.isArray(value)) throw new TypeError("verify-code facts.verification_items must be an array");
  const seen = new Set();
  for (const [index, item] of value.entries()) {
    plain(item, `verify-code facts.verification_items[${index}]`);
    rejectUnknown(item, new Set(["id", "status", "evidence_refs", "reason"]), `verify-code facts.verification_items[${index}]`);
    nonemptyString(item.id, `verify-code facts.verification_items[${index}].id`);
    if (!REQUIRED_VERIFY_ITEM_IDS.includes(item.id)) throw new TypeError(`unknown verify item: ${item.id}`);
    if (seen.has(item.id)) throw new TypeError(`duplicate verify item: ${item.id}`);
    seen.add(item.id);
    if (!new Set(["pass", "fail", "unknown", "not_applicable"]).has(item.status)) {
      throw new TypeError(`verify item ${item.id} status must be pass, fail, unknown, or not_applicable`);
    }
    validateEvidenceRefs(item.evidence_refs, `verify item ${item.id} evidence_refs`);
    nonemptyString(item.reason, `verify item ${item.id} reason`);
  }
  for (const id of REQUIRED_VERIFY_ITEM_IDS) {
    if (!seen.has(id)) throw new Error(`missing verify item: ${id}`);
  }
  return value;
}

function validateBrowserQaFacts(value) {
  plain(value, "verify-code facts.browser_qa");
  rejectUnknown(value, new Set(["ref", "hash"]), "verify-code facts.browser_qa");
  artifactRef(value.ref, "verify-code facts.browser_qa.ref");
  if (!HASH.test(value.hash ?? "")) throw new TypeError("verify-code facts.browser_qa.hash must be sha256");
  return value;
}

function verifyBrowserQaStageContentBinding(task, workspace, binding) {
  validateBrowserQaFacts(binding);
  const raw = task.readRecord(binding.ref);
  const hash = createHash("sha256").update(raw).digest("hex");
  if (hash !== binding.hash) throw new Error("verify-code browser QA stage content integrity hash mismatch");
  let value;
  try { value = JSON.parse(raw); }
  catch { throw new Error("verify-code browser QA stage content is not valid JSON"); }
  const snapshot = captureGitWorktreeSnapshot(assertWorkspace(workspace).worktreeRoot);
  if (value?.schema_version !== "stage-content-evidence.v1"
      || value.kind !== "browser-qa-evidence.v1"
      || value.task_id !== task.identity.taskId
      || value.stage !== "verify-code"
      || value.snapshot_tree !== snapshot.tree
      || value.content_hash !== createHash("sha256").update(JSON.stringify(value.payload)).digest("hex")) {
    throw new Error("verify-code browser QA evidence task, kind, payload, or snapshot binding mismatch");
  }
  return value;
}

function nonemptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function rejectUnknown(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(`${label} contains unknown fields: ${unknown.join(", ")}`);
}

function absoluteString(value, label) {
  nonemptyString(value, label);
  if (!isAbsolute(value)) throw new TypeError(`${label} must be absolute`);
  return value;
}

function gitOid(value, label) {
  if (!GIT_OID.test(value ?? "")) throw new TypeError(`${label} must be a 40-character Git object id`);
  return value;
}

function artifactRef(value, label) {
  nonemptyString(value, label);
  if (isAbsolute(value) || value.split(/[\\/]/).includes("..")) throw new TypeError(`${label} must be a task-relative reference`);
  return value;
}

export function validatePhaseCompletion(value, label = "build-code facts.phase_completion", {
  allowLegacyBoolean = true,
  requireAuthenticatedEvidence = false,
} = {}) {
  if (typeof value === "boolean") {
    if (allowLegacyBoolean) return value;
    throw new TypeError(`${label} boolean is legacy read-only; current publication requires derived completion evidence`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a derived completion evidence object`);
  }
  rejectUnknown(value, new Set(["status", "evidence_ref", "evidence_hash", "integration_review", "formal_record_status"]), label);
  nonemptyString(value.status, `${label}.status`);
  if (requireAuthenticatedEvidence && value.status !== "completed") {
    throw new TypeError(`${label}.status must be completed for current publication`);
  }
  artifactRef(value.evidence_ref, `${label}.evidence_ref`);
  if (requireAuthenticatedEvidence && !HASH.test(value.evidence_hash ?? "")) {
    throw new TypeError(`${label}.evidence_hash must be sha256`);
  }
  if (value.evidence_hash !== undefined && !HASH.test(value.evidence_hash)) {
    throw new TypeError(`${label}.evidence_hash must be sha256`);
  }
  if (requireAuthenticatedEvidence) {
    plain(value.integration_review, `${label}.integration_review`);
    rejectUnknown(value.integration_review, new Set(["ref", "sha256"]), `${label}.integration_review`);
    artifactRef(value.integration_review.ref, `${label}.integration_review.ref`);
    if (!HASH.test(value.integration_review.sha256 ?? "")) {
      throw new TypeError(`${label}.integration_review.sha256 must be sha256`);
    }
  }
  if (requireAuthenticatedEvidence || value.formal_record_status !== undefined) {
    plain(value.formal_record_status, `${label}.formal_record_status`);
    rejectUnknown(value.formal_record_status, new Set(["status", "reason"]), `${label}.formal_record_status`);
    if (!["available", "unavailable"].includes(value.formal_record_status.status)) {
      throw new TypeError(`${label}.formal_record_status.status must be available or unavailable`);
    }
    nonemptyString(value.formal_record_status.reason, `${label}.formal_record_status.reason`);
  }
  return value;
}

function validateTests(value, label) {
  plain(value, label);
  const allowed = new Set(["command", "exit_code", "command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "receipt_ref", "receipt_hash", "output_ref", "output_hash"]);
  rejectUnknown(value, allowed, label);
  nonemptyString(value.command, `${label}.command`);
  if (!Number.isInteger(value.exit_code)) throw new TypeError(`${label}.exit_code must be an integer`);
  for (const key of ["command_hash", "receipt_hash", "output_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`${label}.${key} must be sha256 freshness evidence`);
  gitOid(value.snapshot_head, `${label}.snapshot_head`); gitOid(value.snapshot_tree, `${label}.snapshot_tree`); gitOid(value.snapshot_commit, `${label}.snapshot_commit`);
  for (const key of ["started_at", "completed_at"]) if (!Number.isFinite(Date.parse(value[key]))) throw new TypeError(`${label}.${key} must be an ISO timestamp`);
  artifactRef(value.receipt_ref, `${label}.receipt_ref`);
  artifactRef(value.output_ref, `${label}.output_ref`);
}

function validateReview(value, label) {
  plain(value, label);
  const scopeFields = ["subject_kind", "phase_id", "review_scope"];
  const hasScope = scopeFields.some((key) => Object.prototype.hasOwnProperty.call(value, key));
  if (hasScope && !scopeFields.every((key) => Object.prototype.hasOwnProperty.call(value, key))) {
    throw new TypeError(`${label} review scope must provide subject_kind, phase_id, and review_scope together`);
  }
  if (hasScope) {
    if (!new Set(["worktree", "phase"]).has(value.subject_kind)) throw new TypeError(`${label}.subject_kind must be worktree or phase`);
    if (!new Set(["phase", "integration"]).has(value.review_scope)) throw new TypeError(`${label}.review_scope must be phase or integration`);
    if (value.subject_kind === "phase") {
      if (typeof value.phase_id !== "string" || value.phase_id.trim() === "" || value.review_scope !== "phase") throw new TypeError(`${label} phase review scope is invalid`);
    } else if (value.phase_id !== null || value.review_scope !== "integration") {
      throw new TypeError(`${label} worktree review scope is invalid`);
    }
  }
  if (value.status === "unavailable") {
    rejectUnknown(value, new Set(["status", "attempt_ref", "attempt_hash", "snapshot_tree", "material_id", "error", "review_track", ...scopeFields]), label);
    artifactRef(value.attempt_ref, `${label}.attempt_ref`);
    if (!value.attempt_ref.startsWith("reviews/attempts/") || !value.attempt_ref.endsWith("/attempt.json")) throw new TypeError(`${label}.attempt_ref must reference a formal wh-review attempt`);
    if (!HASH.test(value.attempt_hash ?? "")) throw new TypeError(`${label}.attempt_hash must be sha256`);
    gitOid(value.snapshot_tree, `${label}.snapshot_tree`);
    if (!HASH.test(value.material_id ?? "")) throw new TypeError(`${label}.material_id must be sha256`);
    plain(value.error, `${label}.error`);
    rejectUnknown(value.error, new Set(["code", "message"]), `${label}.error`);
    nonemptyString(value.error.code, `${label}.error.code`);
    nonemptyString(value.error.message, `${label}.error.message`);
    if (value.review_track !== undefined && !new Set(["direction", "detail"]).has(value.review_track)) throw new TypeError(`${label}.review_track must be direction or detail`);
    return;
  }
  rejectUnknown(value, new Set(["verdict", "result_ref", "result_hash", "snapshot_tree", ...scopeFields]), label);
  nonemptyString(value.verdict, `${label}.verdict`);
  artifactRef(value.result_ref, `${label}.result_ref`);
  if (!value.result_ref.startsWith("reviews/results/")) throw new TypeError(`${label}.result_ref must reference a formal wh-review result`);
  if (!HASH.test(value.result_hash ?? "")) throw new TypeError(`${label}.result_hash must be sha256`);
  gitOid(value.snapshot_tree, `${label}.snapshot_tree`);
}

function validateEvidenceRefs(refs, label) {
  if (!Array.isArray(refs)) throw new TypeError(`${label} must be an array`);
  refs.forEach((entry, index) => {
    if (typeof entry === "string") throw new TypeError(`${label}[${index}] must be an authenticated evidence reference object`);
    plain(entry, `${label}[${index}]`);
    rejectUnknown(entry, new Set(["ref", "sha256"]), `${label}[${index}]`);
    artifactRef(entry.ref, `${label}[${index}].ref`);
    if (!HASH.test(entry.sha256 ?? "")) throw new TypeError(`${label}[${index}].sha256 must be sha256`);
  });
}

function validateCheckpoint(checkpoint) {
  plain(checkpoint, "checkpoint");
  rejectUnknown(checkpoint, new Set(["ref", "commit_oid", "tree_oid", "artifacts"]), "checkpoint");
  for (const key of ["ref", "commit_oid", "tree_oid", "artifacts"]) {
    if (!Object.prototype.hasOwnProperty.call(checkpoint, key)) throw new Error(`checkpoint missing ${key}`);
  }
  nonemptyString(checkpoint.ref, "checkpoint.ref");
  gitOid(checkpoint.commit_oid, "checkpoint.commit_oid");
  gitOid(checkpoint.tree_oid, "checkpoint.tree_oid");
  if (!Array.isArray(checkpoint.artifacts)) throw new TypeError("checkpoint.artifacts must be an array");
  checkpoint.artifacts.forEach((record, index) => {
    plain(record, `checkpoint.artifacts[${index}]`);
    rejectUnknown(record, new Set(["path", "blob_oid", "content_hash"]), `checkpoint.artifacts[${index}]`);
    artifactRef(record.path, `checkpoint.artifacts[${index}].path`);
    gitOid(record.blob_oid, `checkpoint.artifacts[${index}].blob_oid`);
    if (!HASH.test(record.content_hash ?? "")) throw new TypeError(`checkpoint.artifacts[${index}].content_hash must be sha256`);
  });
  return checkpoint;
}

function validateCheckpointPlan(plan) {
  plain(plan, "checkpoint plan");
  rejectUnknown(plan, new Set(["schema_version", "stage", "parent_commit", "artifacts", "plan_hash"]), "checkpoint plan");
  if (plan.schema_version !== "git-checkpoint-plan.v1" || !["build-spec", "build-plan"].includes(plan.stage)) throw new Error("checkpoint plan schema/stage invalid");
  gitOid(plan.parent_commit, "checkpoint plan.parent_commit");
  if (!HASH.test(plan.plan_hash ?? "")) throw new Error("checkpoint plan.plan_hash must be sha256");
  if (!Array.isArray(plan.artifacts) || plan.artifacts.length === 0) throw new Error("checkpoint plan.artifacts required");
  plan.artifacts.forEach((record, index) => { plain(record, `checkpoint plan.artifacts[${index}]`); rejectUnknown(record, new Set(["path", "blob_oid", "content_hash"]), `checkpoint plan.artifacts[${index}]`); artifactRef(record.path, `checkpoint plan.artifacts[${index}].path`); gitOid(record.blob_oid, `checkpoint plan.artifacts[${index}].blob_oid`); if (!HASH.test(record.content_hash ?? "")) throw new Error("checkpoint plan artifact content_hash must be sha256"); });
  return plan;
}

export function validateAttempt(attempt, expected = {}) {
  plain(attempt, "attempt");
  if (attempt.schema_version !== "task-attempt.v2") throw new Error("attempt schema_version must be task-attempt.v2");
  const stage = stageName(attempt.stage);
  if (typeof attempt.task_id !== "string" || typeof attempt.attempt_id !== "string") throw new Error("attempt identity fields required");
  if (!Number.isFinite(Date.parse(attempt.created_at))) throw new Error("attempt created_at invalid");
  if (attempt.workflow_run_id !== undefined
      && (stage !== "build-spec" || typeof attempt.workflow_run_id !== "string" || attempt.workflow_run_id.trim() === "")) {
    throw new Error("attempt workflow_run_id is only valid for build-spec runtime publication");
  }
  if (!Array.isArray(attempt.missing_items)) throw new Error("attempt missing_items list required");
  validateStageFacts(stage, attempt.facts, {
    allowLegacyBuildCode: expected.allowLegacyBuildCode === true,
    allowLegacyAuditRead: expected.allowLegacyAuditRead === true,
    allowMissingAuditSupport: attempt.missing_items.includes("support:audit"),
  });
  validateEvidenceRefs(attempt.evidence_refs, "attempt evidence_refs");
  validateRefs(attempt.upstream_refs, "upstream_refs");
  if (attempt.verification_failure !== undefined && (stage !== "verify-code" || attempt.verification_failure !== true)) throw new Error("verification_failure is only valid as true on verify-code attempts");
  if (expected.taskId && attempt.task_id !== expected.taskId) throw new Error("attempt task identity mismatch");
  if (expected.stage && stage !== expected.stage) throw new Error("attempt stage identity mismatch");
  if (expected.attemptId && attempt.attempt_id !== expected.attemptId) throw new Error("attempt id mismatch");
  return attempt;
}

export function validateAccepted(accepted, expected = {}) {
  plain(accepted, "accepted");
  rejectUnknown(accepted, new Set([
    "schema_version", "task_id", "stage", "attempt_ref", "integrity_hash",
    "acceptance_mode", "human_confirmation_ref", "accepted_at", "upstream_refs",
    "checkpoint",
    "full_audit_ref", "full_audit_hash", "full_audit_summary_hash", "full_audit_verdict",
  ]), "accepted");
  if (accepted.schema_version !== "task-accepted.v2") throw new Error("accepted schema_version must be task-accepted.v2");
  const stage = stageName(accepted.stage);
  if (!ATTEMPT_REF.test(accepted.attempt_ref ?? "") || !HASH.test(String(accepted.integrity_hash ?? "").replace(/^sha256:/, ""))) throw new Error("accepted attempt_ref/integrity_hash invalid");
  const hasMode = Object.prototype.hasOwnProperty.call(accepted, "acceptance_mode");
  const hasHumanRef = typeof accepted.human_confirmation_ref === "string" && accepted.human_confirmation_ref.trim() !== "";
  if (!hasMode) {
    // Legacy task-accepted.v2 records predate automatic acceptance. They always
    // carry a human ref, including records for stages that are automatic now.
    if (!hasHumanRef) throw new Error("legacy accepted human_confirmation_ref required");
  } else {
    const expectedMode = acceptanceModeFor(stage);
    if (accepted.acceptance_mode !== expectedMode) throw new Error(`accepted acceptance_mode must be ${expectedMode} for ${stage}`);
    if (accepted.acceptance_mode === "human" && !hasHumanRef) throw new Error("accepted human_confirmation_ref required for human acceptance");
    if (accepted.acceptance_mode === "automatic" && Object.prototype.hasOwnProperty.call(accepted, "human_confirmation_ref")) {
      throw new Error("automatic accepted record must not contain human_confirmation_ref");
    }
  }
  if (!Number.isFinite(Date.parse(accepted.accepted_at))) throw new Error("accepted_at invalid");
  const hasFullAudit = ["full_audit_ref", "full_audit_hash", "full_audit_summary_hash", "full_audit_verdict"]
    .some((key) => Object.prototype.hasOwnProperty.call(accepted, key));
  const hasCompleteFullAudit = ["full_audit_ref", "full_audit_hash", "full_audit_summary_hash", "full_audit_verdict"]
    .every((key) => Object.prototype.hasOwnProperty.call(accepted, key));
  if (hasFullAudit !== hasCompleteFullAudit || (hasFullAudit && (stage !== "make-decision"
      || typeof accepted.full_audit_ref !== "string"
      || !/^evidence\/audits\/make-decision\/[a-f0-9]{64}\.json$/.test(accepted.full_audit_ref)
      || !HASH.test(accepted.full_audit_hash ?? "")
      || !HASH.test(accepted.full_audit_summary_hash ?? "")
      || !new Set(["pass", "fail"]).has(accepted.full_audit_verdict)))) {
    throw new Error("accepted make-decision full audit binding invalid");
  }
  validateRefs(accepted.upstream_refs, "accepted upstream_refs");
  if (["build-spec", "build-plan"].includes(stage)) validateCheckpoint(accepted.checkpoint);
  if (expected.taskId && accepted.task_id !== expected.taskId) throw new Error("accepted task identity mismatch");
  if (expected.stage && stage !== expected.stage) throw new Error("accepted stage identity mismatch");
  return accepted;
}

export function buildTaskKernel(taskHandle, {
  now = () => new Date().toISOString(),
  workspace,
  artifacts,
  candidateWorkspace,
  attemptPublicationTestHooks,
  acceptedReplacementTestHooks,
  materialRevisionTestHooks,
} = {}, authority) {
  const {
    assertTaskHandle, openTask, createKernelRecordFor, replaceKernelAcceptedFor,
    replaceStageContentPointerFor, replaceTaskCurrentPointerFor,
  } = authority;
  const task = assertTaskHandle(taskHandle);
  const createKernelRecord = createKernelRecordFor(task);
  const replaceKernelAccepted = typeof replaceKernelAcceptedFor === "function" ? replaceKernelAcceptedFor(task) : undefined;
  const replaceStageContentPointer = typeof replaceStageContentPointerFor === "function"
    ? replaceStageContentPointerFor(task) : undefined;
  const replaceTaskCurrentPointer = typeof replaceTaskCurrentPointerFor === "function"
    ? replaceTaskCurrentPointerFor(task) : undefined;
  const candidate = candidateWorkspace === undefined ? undefined : assertCandidateWorkspace(candidateWorkspace);
  const verifyCandidateSnapshot = (facts) => {
    if (!candidate) return;
    const snapshot = candidate.captureSnapshot();
    if (snapshot.head !== facts.baseline_commit) throw new Error("make-decision CandidateWorkspace HEAD changed from baseline");
    if (facts.snapshot_tree !== undefined) {
      if (snapshot.tree !== facts.snapshot_tree) throw new Error("make-decision CandidateWorkspace snapshot_tree changed after publication");
      return;
    }
    const baselineTree = String(execFileSync("git", ["rev-parse", `${facts.baseline_commit}^{tree}`], {
      cwd: candidate.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    })).trim();
    if (snapshot.tree !== baselineTree) throw new Error("legacy make-decision attempt cannot accept unbound CandidateWorkspace changes");
  };
  const verifyCheckpoint = (stage, checkpoint, { live = true } = {}) => verifyGitCheckpoint({
    repoRoot: workspace?.worktreeRoot ?? task.manifest.target_repo_root,
    checkpoint,
    projectName: task.identity.projectName,
    taskId: task.identity.taskId,
    stage,
    artifacts: live ? artifacts : undefined,
  });
  const archivedAcceptedFileFor = (attemptRef) => `accepted-${attemptRef}`;
  const collisionArchiveFileFor = (attemptRef, acceptedRaw) => `accepted-${attemptRef.slice(0, -5)}-canonical-${hash(acceptedRaw)}.json`;
  const readAcceptedAt = (name, acceptedFile, {
    allowLegacyBuildCode = false,
    allowLegacyAuditRead = true,
  } = {}) => {
    if (!ACCEPTED_FILE.test(acceptedFile)) throw new Error("invalid accepted record name");
    const acceptedRef = `results/${name}/${acceptedFile}`;
    const acceptedRaw = task.readRecord(acceptedRef);
    const accepted = validateAccepted(parseJson(acceptedRaw, `${name} ${acceptedFile}`), { taskId: task.identity.taskId, stage: name });
    const attemptRaw = task.readRecord(`results/${name}/${accepted.attempt_ref}`);
    const expectedHash = String(accepted.integrity_hash).replace(/^sha256:/, "");
    if (expectedHash !== hash(attemptRaw)) throw new Error(`${name} accepted integrity hash mismatch`);
    const attempt = validateAttempt(parseJson(attemptRaw, `${name} attempt`), {
      taskId: task.identity.taskId,
      stage: name,
      allowLegacyBuildCode,
      allowLegacyAuditRead,
    });
    if (name === "make-decision" && attempt.facts.audit_through_step_id === 10) {
      if (!new Set(["pass", "fail"]).has(accepted.full_audit_verdict)) throw new Error("accepted make-decision full audit verdict is invalid");
      const confirmationRaw = task.readRecord(accepted.human_confirmation_ref);
      const confirmation = parseJson(confirmationRaw, "accepted make-decision human confirmation");
      if (Object.keys(confirmation).some((key) => !new Set([
        "schema_version", "task_id", "stage", "attempt_ref", "decision", "confirmed_at", "checkpoint_plan_hash",
      ]).has(key))
          || confirmation.schema_version !== "human-confirmation.v1"
          || confirmation.task_id !== task.identity.taskId || confirmation.stage !== name
          || confirmation.attempt_ref !== accepted.attempt_ref || confirmation.decision !== "accepted"
          || !Number.isFinite(Date.parse(confirmation.confirmed_at))) {
        throw new Error("accepted make-decision human confirmation binding mismatch");
      }
      const preAuditRaw = task.readRecord(attempt.facts.audit_summary_ref);
      const preAudit = parseJson(preAuditRaw, "accepted make-decision pre-confirmation audit");
      const auditRaw = task.readRecord(accepted.full_audit_ref);
      const audit = parseJson(auditRaw, "accepted make-decision full audit");
      if (preAudit.summary_hash !== attempt.facts.audit_summary_hash
          || hashAuditSummary(preAudit) !== preAudit.summary_hash
          || preAudit.verdict !== attempt.facts.audit_verdict
          || hash(auditRaw) !== accepted.full_audit_hash
          || audit.summary_hash !== accepted.full_audit_summary_hash
          || hashAuditSummary(audit) !== audit.summary_hash
          || audit.verdict !== accepted.full_audit_verdict || audit.through_step_id !== 12 || audit.audit_scope !== "full"
          || audit.task_id !== task.identity.taskId || audit.stage_slug !== name
          || preAudit.through_step_id !== 10 || preAudit.audit_scope !== "pre_confirmation"
          || audit.workflow_run_id !== preAudit.workflow_run_id
          || audit.snapshot_tree !== attempt.facts.snapshot_tree
          || JSON.stringify(audit.content_evidence_refs) !== JSON.stringify(preAudit.content_evidence_refs)) {
        throw new Error("accepted make-decision full audit binding mismatch");
      }
    }
    if (accepted.upstream_refs.length !== attempt.upstream_refs.length || JSON.stringify(accepted.upstream_refs) !== JSON.stringify(attempt.upstream_refs)) throw new Error(`${name} accepted upstream refs mismatch`);
    if (["build-spec", "build-plan"].includes(name)) verifyCheckpoint(name, accepted.checkpoint, { live: false });
    const facts = accepted.checkpoint ? { ...structuredClone(attempt.facts), checkpoint: structuredClone(accepted.checkpoint) } : attempt.facts;
    const legacyAudit = AUDIT_FACT_KEYS.every((key) => !Object.prototype.hasOwnProperty.call(attempt.facts, key));
    if (!legacyAudit) readBoundAttemptAudit(name, attempt, `${name} accepted attempt audit`);
    return deepFreeze({
      accepted_ref: acceptedRef,
      accepted_hash: hash(acceptedRaw),
      accepted,
      attempt,
      facts,
      legacy: legacyAudit,
      audit_status: legacyAudit ? "unknown" : "pass",
    });
  };
  const readAcceptedLocal = (stage, options) => {
    const name = stageName(stage);
    return readAcceptedAt(name, "accepted.json", options);
  };
  const latestStageRun = (stage) => {
    const name = stageName(stage);
    let latest = null;
    for (let sequence = 1; sequence <= 9999; sequence += 1) {
      const ref = `runs/${name}/run-${String(sequence).padStart(4, "0")}.json`;
      let raw;
      try { raw = task.readRecord(ref); }
      catch (error) {
        if (error?.code === "ENOENT") break;
        throw error;
      }
      const run = parseJson(raw, `${name} stage run`);
      if (run.schema_version !== "stage-run.v1" || run.task_id !== task.identity.taskId
          || run.stage !== name || run.run_ref !== ref || !nonemptyString(run.workflow_run_id, "stage run workflow_run_id")
          || !Number.isFinite(Date.parse(run.created_at))) throw new Error(`${name} stage run record is invalid`);
      if (sequence === 1) {
        if (run.previous_run_ref !== null || run.previous_run_hash !== null) throw new Error(`${name} initial stage run lineage is invalid`);
      } else if (run.previous_run_ref !== latest.ref || run.previous_run_hash !== latest.hash) {
        throw new Error(`${name} stage run lineage is broken`);
      }
      latest = { ref, hash: hash(raw), run, raw };
    }
    return latest;
  };
  const startStageRun = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "stage run input");
    rejectUnknown(input, new Set(["reason"]), "stage run input");
    const reason = nonemptyString(input.reason, "stage run reason");
    return task.withRecordLock(`locks/${name}.run.lock`, () => {
      const previous = latestStageRun(name);
      const sequence = previous === null ? 1 : Number(previous.ref.match(/run-([0-9]{4})\.json$/)[1]) + 1;
      if (sequence > 9999) throw new Error(`${name} stage run sequence exhausted`);
      const ref = `runs/${name}/run-${String(sequence).padStart(4, "0")}.json`;
      const run = {
        schema_version: "stage-run.v1",
        task_id: task.identity.taskId,
        stage: name,
        workflow_run_id: `${name}:${String(sequence).padStart(4, "0")}:${randomUUID()}`,
        run_ref: ref,
        previous_run_ref: previous?.ref ?? null,
        previous_run_hash: previous?.hash ?? null,
        reason,
        created_at: now(),
      };
      const raw = `${JSON.stringify(run, null, 2)}\n`;
      createKernelRecord(ref, raw);
      if (name === "make-decision") {
        const evidence = { kind: "stage_run", uri_or_path: ref, content_hash: hash(raw) };
        completeMakeDecisionStageStep({
          step_id: 1,
          entry_evidence: evidence,
          completion_evidence: evidence,
        });
      }
      return deepFreeze({ ref, hash: hash(raw), run });
    });
  };
  const activeStageRun = (stage, { required = true } = {}) => {
    const run = latestStageRun(stage);
    if (required && run === null) throw new Error(`${stageName(stage)} requires start-run before producing evidence or publishing`);
    return run;
  };
  const latestHistoricalStageRun = (stage) => {
    const run = latestStageRun(stage);
    return run === null ? null : deepFreeze(run);
  };
  const activeStageStepEvents = ({ stage, run, events }) => {
    const scoped = events.filter((event) => event.workflow_run_id === run.workflow_run_id
      && event.stage_slug === stage);
    const attempts = new Map();
    for (const event of scoped) {
      const key = `${event.step_id}\0${event.attempt_id}`;
      const attemptEvents = attempts.get(key) ?? [];
      attemptEvents.push(event);
      attempts.set(key, attemptEvents);
    }
    const latestAttemptByStep = new Map();
    for (const [key, attemptEvents] of attempts) {
      const [stepId, attemptId] = key.split("\0");
      const number = Number(String(attemptId).replace(/^attempt-/, ""));
      const previous = latestAttemptByStep.get(Number(stepId));
      if (!previous || number > previous.number) latestAttemptByStep.set(Number(stepId), { number, attemptEvents });
    }
    return [...latestAttemptByStep.values()].flatMap(({ attemptEvents }) => attemptEvents);
  };
  const readBoundAttemptAudit = (stage, attempt, label) => {
    const raw = task.readRecord(attempt.facts.audit_summary_ref);
    const audit = parseJson(raw, label);
    const unsigned = { ...audit };
    delete unsigned.summary_hash;
    if (attempt.facts.audit_summary_ref !== `evidence/audits/${stage}/${attempt.facts.audit_summary_hash}.json`
        || audit.summary_hash !== attempt.facts.audit_summary_hash
        || hashAuditSummary(unsigned) !== audit.summary_hash
        || audit.task_id !== task.identity.taskId
        || audit.stage_slug !== stage
        || audit.verdict !== attempt.facts.audit_verdict
        || !new Set(["pass", "fail"]).has(audit.verdict)) {
      throw new Error(`${label} binding mismatch`);
    }
    return audit;
  };
  const publishRequirementsLedger = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "requirements ledger input");
    rejectUnknown(input, new Set(["source_manifest", "mappings"]), "requirements ledger input");
    const active = activeStageRun(name);
    const result = createRequirementLedger({ source_manifest: input.source_manifest, mappings: input.mappings });
    if (!result.ok) throw new Error(result.errors?.join("; ") ?? "invalid requirements ledger");
    const coverage = createRequirementsCoverage(result.ledger);
    const ledgerRaw = `${canonicalJson(result.ledger)}\n`;
    const coverageRaw = `${canonicalJson(coverage)}\n`;
    const baseLedgerRef = "requirements/ledger.json";
    const baseCoverageRef = "requirements/coverage.json";
    const pointerRef = "requirements/current.json";
    let pointerRaw = readOptionalRecord(task, pointerRef);
    let pointer = null;
    if (pointerRaw !== undefined) {
      pointer = parseJson(pointerRaw, "requirements current pointer");
      const boundCoverageRaw = typeof pointer.coverage_ref === "string"
        ? readOptionalRecord(task, pointer.coverage_ref)
        : undefined;
      if (pointer.schema_version !== "requirements-current.v1"
          || pointer.task_id !== task.identity.taskId
          || !Number.isInteger(pointer.generation) || pointer.generation < 1
          || typeof pointer.ledger_ref !== "string" || !HASH.test(pointer.ledger_hash ?? "")
          || !HASH.test(pointer.content_hash ?? "")
          || typeof pointer.coverage_ref !== "string" || !HASH.test(pointer.coverage_hash ?? "")
          || boundCoverageRaw === undefined || hash(boundCoverageRaw) !== pointer.coverage_hash
          || hash(task.readRecord(pointer.ledger_ref)) !== pointer.ledger_hash) {
        throw new Error("requirements current pointer is invalid or misbound");
      }
    } else {
      const baseRaw = readOptionalRecord(task, baseLedgerRef);
      if (baseRaw !== undefined) {
        pointer = {
          schema_version: "requirements-current.v1", task_id: task.identity.taskId,
          generation: 1, ledger_ref: baseLedgerRef, ledger_hash: hash(baseRaw),
          content_hash: hash(baseRaw),
          coverage_ref: baseCoverageRef, coverage_hash: hash(task.readRecord(baseCoverageRef)),
          parent_ref: null,
        };
        pointerRaw = `${JSON.stringify(pointer, null, 2)}\n`;
        try { createKernelRecord(pointerRef, pointerRaw); }
        catch (error) {
          if (error?.code !== "EEXIST") throw error;
          pointerRaw = task.readRecord(pointerRef);
          pointer = parseJson(pointerRaw, "requirements current pointer");
        }
      }
    }
    const parentRef = pointer?.ledger_ref ?? null;
    if (pointer?.content_hash === hash(ledgerRaw)) {
      if (name === "make-decision") {
        const evidence = {
          kind: "requirements_ledger",
          uri_or_path: pointer.ledger_ref,
          content_hash: pointer.ledger_hash,
        };
        completeMakeDecisionStageStep({
          step_id: 2,
          entry_evidence: evidence,
          completion_evidence: evidence,
        });
      }
      return deepFreeze({
        ledger_ref: pointer.ledger_ref, ledger_hash: pointer.ledger_hash,
        coverage_ref: pointer.coverage_ref, coverage_hash: pointer.coverage_hash,
        workflow_run_id: active.run.workflow_run_id,
        parent_ref: pointer.parent_ref ?? null,
        supersedes: pointer.parent_ref === null ? [] : [pointer.parent_ref],
        current: true, idempotent: true,
      });
    }
    const storedLedgerRaw = pointer === null
      ? ledgerRaw
      : `${canonicalJson({
        schema_version: "requirements-ledger-revision.v1",
        task_id: task.identity.taskId,
        parent_ref: parentRef,
        supersedes: [parentRef],
        ledger: result.ledger,
      })}\n`;
    const storedCoverageRaw = pointer === null
      ? coverageRaw
      : `${canonicalJson({
        schema_version: "requirements-coverage-revision.v1",
        task_id: task.identity.taskId,
        parent_ledger_ref: parentRef,
        coverage,
      })}\n`;
    const ledgerRef = pointer === null ? baseLedgerRef : `requirements/revisions/${hash(storedLedgerRaw)}.json`;
    const coverageRef = pointer === null ? baseCoverageRef : `requirements/revisions/${hash(storedCoverageRaw)}.coverage.json`;
    for (const [ref, raw] of [[ledgerRef, storedLedgerRaw], [coverageRef, storedCoverageRaw]]) {
      try { task.createRecordAtomic(ref, raw); }
      catch (error) {
        if (error?.code !== "EEXIST" || task.readRecord(ref) !== raw) throw error;
      }
    }
    const nextPointer = {
      schema_version: "requirements-current.v1", task_id: task.identity.taskId,
      generation: (pointer?.generation ?? 0) + 1,
      ledger_ref: ledgerRef, ledger_hash: hash(storedLedgerRaw),
      content_hash: hash(ledgerRaw),
      coverage_ref: coverageRef, coverage_hash: hash(storedCoverageRaw),
      parent_ref: parentRef,
    };
    const nextPointerRaw = `${JSON.stringify(nextPointer, null, 2)}\n`;
    if (pointerRaw === undefined) {
      try { createKernelRecord(pointerRef, nextPointerRaw); }
      catch (error) {
        if (error?.code !== "EEXIST") throw error;
        if (task.readRecord(pointerRef) !== nextPointerRaw) {
          const conflict = new Error("REQUIREMENTS_REVISION_CONFLICT: current pointer changed; retry from the authenticated head");
          conflict.code = "REQUIREMENTS_REVISION_CONFLICT";
          throw conflict;
        }
      }
    } else {
      try {
        replaceTaskCurrentPointer(pointerRef, nextPointerRaw, {
          expectedPriorRaw: pointerRaw,
          validator: () => {},
        });
      } catch (error) {
        const currentRaw = task.readRecord(pointerRef);
        if (currentRaw !== nextPointerRaw) {
          const conflict = new Error("REQUIREMENTS_REVISION_CONFLICT: current pointer changed; retry from the authenticated head");
          conflict.code = "REQUIREMENTS_REVISION_CONFLICT";
          throw conflict;
        }
      }
    }
    if (name === "make-decision") {
      const evidence = { kind: "requirements_ledger", uri_or_path: ledgerRef, content_hash: hash(ledgerRaw) };
      completeMakeDecisionStageStep({
        step_id: 2,
        entry_evidence: evidence,
        completion_evidence: evidence,
      });
    }
    return deepFreeze({
      ledger_ref: ledgerRef, ledger_hash: hash(storedLedgerRaw),
      coverage_ref: coverageRef, coverage_hash: hash(storedCoverageRaw),
      workflow_run_id: active.run.workflow_run_id,
      parent_ref: parentRef,
      supersedes: parentRef === null ? [] : [parentRef],
      current: true,
    });
  };
  const publishMaterialRevision = (input = {}) => {
    plain(input, "material revision input");
    rejectUnknown(input, new Set(["change_summary", "source_refs", "expected_current_ref", "requirements"]), "material revision input");
    const summary = nonemptyString(input.change_summary, "material revision change_summary");
    if (!Array.isArray(input.source_refs) || input.source_refs.length === 0
        || input.source_refs.some((ref) => typeof ref !== "string" || ref.trim() === "")) {
      throw new TypeError("material revision source_refs must be canonical task record refs");
    }
    const sourceRefs = [...new Set(input.source_refs)].map((ref) => {
      const raw = task.readRecord(ref);
      return { ref, hash: hash(raw) };
    });
    const artifactDir = artifacts === undefined
      ? ArtifactDir.open((candidate ?? workspace).worktreeRoot, task)
      : assertArtifactDir(artifacts);
    const materialFiles = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
    const materials = Object.fromEntries(materialFiles.map((file) => [file, artifactDir.read(file)]));
    let requirementsBinding;
    if (input.requirements !== undefined) {
      plain(input.requirements, "material revision requirements");
      rejectUnknown(input.requirements, new Set(["ledger_ref", "coverage_ref"]), "material revision requirements");
      const ledgerRaw = task.readRecord(input.requirements.ledger_ref);
      const coverageRaw = task.readRecord(input.requirements.coverage_ref);
      requirementsBinding = {
        ledger: { ref: input.requirements.ledger_ref, hash: hash(ledgerRaw) },
        coverage: { ref: input.requirements.coverage_ref, hash: hash(coverageRaw) },
      };
    } else {
      if (task.manifest.record_model === "vnext-single-write") {
        throw new Error("vNext material revision requires direct requirements ledger and coverage");
      }
      const requirementsPointerRaw = readOptionalRecord(task, "requirements/current.json");
      if (requirementsPointerRaw === undefined) throw new Error("material revision requires direct requirements ledger and coverage");
      const requirementsPointer = parseJson(requirementsPointerRaw, "requirements current pointer");
      const ledgerRaw = task.readRecord(requirementsPointer.ledger_ref);
      const coverageRaw = task.readRecord(requirementsPointer.coverage_ref);
      if (requirementsPointer.schema_version !== "requirements-current.v1"
          || requirementsPointer.task_id !== task.identity.taskId
          || hash(ledgerRaw) !== requirementsPointer.ledger_hash
          || hash(coverageRaw) !== requirementsPointer.coverage_hash) {
        throw new Error("material revision requirements binding is invalid");
      }
      requirementsBinding = {
        ledger: { ref: requirementsPointer.ledger_ref, hash: requirementsPointer.ledger_hash },
        coverage: { ref: requirementsPointer.coverage_ref, hash: requirementsPointer.coverage_hash },
      };
    }
    // Serialize the authenticated-head read, stale-input decision, immutable
    // revision write, and current-pointer CAS. Without one cross-process
    // lock, two writers can both validate the same old head and publish
    // different revisions successfully.
    return task.withRecordLock("locks/materials.publication.lock", () => {
    const pointerRef = "materials/current.json";
    const priorPointerRaw = readOptionalRecord(task, pointerRef);
    let priorPointer = null;
    let priorRevision = null;
    if (priorPointerRaw !== undefined) {
      priorPointer = parseJson(priorPointerRaw, "material current pointer");
      if (priorPointer.schema_version !== "task-material-current.v1"
          || priorPointer.task_id !== task.identity.taskId
          || !Number.isInteger(priorPointer.generation) || priorPointer.generation < 1
          || !/^materials\/revisions\/[a-f0-9]{64}\.json$/.test(priorPointer.revision_ref ?? "")
          || !HASH.test(priorPointer.revision_hash ?? "")
          || hash(task.readRecord(priorPointer.revision_ref)) !== priorPointer.revision_hash) {
        throw new Error("material current pointer is invalid or misbound");
      }
      priorRevision = parseJson(task.readRecord(priorPointer.revision_ref), "material revision");
      const validation = validateTaskMaterialRevision(priorRevision);
      if (!validation.ok || priorRevision.revision_id !== priorPointer.revision_id) {
        throw new Error(`material current revision is invalid: ${validation.errors.join("; ")}`);
      }
    }
    const created = createUnifiedMaterialRevision({
      taskId: task.identity.taskId,
      materials,
      requirements: requirementsBinding,
      previous: priorRevision === null ? null : {
        ...priorRevision,
        revision_ref: priorPointer.revision_ref,
        revision_hash: priorPointer.revision_hash,
      },
      changeSummary: summary,
      sourceRefs,
    });
    const currentRef = priorPointer?.revision_ref ?? null;
    if (input.expected_current_ref !== undefined && input.expected_current_ref !== currentRef) {
      // The builder above is pure, so no record can be orphaned by this
      // check. A retry may legitimately observe a newer idempotent revision
      // published from the requested head; arbitrary stale refs still fail.
      let ancestor = priorRevision;
      let expectedIsAncestor = false;
      while (ancestor?.previous_ref) {
        if (ancestor.previous_ref === input.expected_current_ref) {
          expectedIsAncestor = true;
          break;
        }
        ancestor = parseJson(task.readRecord(ancestor.previous_ref), "material revision");
      }
      const sameInput = created.idempotent
        && priorRevision?.change_summary === summary
        && JSON.stringify(priorRevision.source_refs ?? []) === JSON.stringify(sourceRefs);
      if (!sameInput || !expectedIsAncestor) {
        const conflict = new Error("MATERIAL_REVISION_CONFLICT: expected current revision is stale");
        conflict.code = "MATERIAL_REVISION_CONFLICT";
        throw conflict;
      }
    }
    if (created.idempotent) {
      return deepFreeze({
        revision_ref: priorPointer.revision_ref, revision_hash: priorPointer.revision_hash,
        revision_id: priorPointer.revision_id, current: true, idempotent: true,
      });
    }
    const revision = created.revision;
    const validation = validateTaskMaterialRevision(revision);
    if (!validation.ok) throw new Error(`material revision is invalid: ${validation.errors.join("; ")}`);
    const revisionRef = created.revision_ref;
    const revisionRaw = created.raw;
    try { createKernelRecord(revisionRef, revisionRaw, { testHooks: materialRevisionTestHooks?.revision }); }
    catch (error) {
      if (error?.code !== "EEXIST" || task.readRecord(revisionRef) !== revisionRaw) throw error;
    }
    const pointer = {
      schema_version: "task-material-current.v1",
      task_id: task.identity.taskId,
      generation: (priorPointer?.generation ?? 0) + 1,
      revision_id: revision.revision_id,
      revision_ref: revisionRef,
      revision_hash: hash(revisionRaw),
      previous_ref: priorPointer?.revision_ref ?? null,
    };
    const pointerRaw = `${JSON.stringify(pointer, null, 2)}\n`;
    try {
      if (priorPointerRaw === undefined) createKernelRecord(pointerRef, pointerRaw, { testHooks: materialRevisionTestHooks?.current });
      else replaceTaskCurrentPointer(pointerRef, pointerRaw, {
        expectedPriorRaw: priorPointerRaw,
        validator: () => {},
        testHooks: materialRevisionTestHooks?.current,
      });
    } catch (error) {
      const concurrentPointerChange = error?.code === "EEXIST"
        || /compare-and-swap source changed|MATERIAL_REVISION_CONFLICT/.test(error?.message ?? "");
      if (!concurrentPointerChange) throw error;
      const currentRaw = task.readRecord(pointerRef);
      if (currentRaw !== pointerRaw) {
        const conflict = new Error("MATERIAL_REVISION_CONFLICT: current pointer changed; retry from the authenticated head");
        conflict.code = "MATERIAL_REVISION_CONFLICT";
        throw conflict;
      }
    }
    return deepFreeze({
      revision_ref: revisionRef, revision_hash: hash(revisionRaw),
      revision_id: revision.revision_id, parent_ref: revision.previous_ref,
      changed_files: revision.changed_files, current: true, idempotent: false,
    });
    });
  };
  const readMaterialRevisionForRepair = (artifactDir) => {
    const pointerRaw = readOptionalRecord(task, "materials/current.json");
    if (pointerRaw === undefined) return null;
    const pointer = parseJson(pointerRaw, "material current pointer");
    if (pointer.schema_version !== "task-material-current.v1"
        || pointer.task_id !== task.identity.taskId
        || !Number.isInteger(pointer.generation) || pointer.generation < 1
        || !/^materials\/revisions\/[a-f0-9]{64}\.json$/.test(pointer.revision_ref ?? "")
        || !HASH.test(pointer.revision_hash ?? "")
        || hash(task.readRecord(pointer.revision_ref)) !== pointer.revision_hash) {
      throw new Error("material current pointer is invalid or misbound");
    }
    const revisionRaw = task.readRecord(pointer.revision_ref);
    const revision = parseJson(revisionRaw, "current material revision");
    const validation = validateTaskMaterialRevisionVersionAware(revision);
    if (!validation.ok || revision.task_id !== task.identity.taskId
        || revision.revision_id !== pointer.revision_id
        || revision.previous_ref !== (pointer.previous_ref ?? null)) {
      throw new Error(`current material revision is invalid or misbound: ${validation.errors.join("; ")}`);
    }
    const seen = new Set([pointer.revision_ref]);
    let ancestor = revision;
    while (ancestor.previous_ref !== null) {
      if (seen.has(ancestor.previous_ref)) throw new Error("material revision parent chain contains a cycle");
      seen.add(ancestor.previous_ref);
      const priorRaw = task.readRecord(ancestor.previous_ref);
      const prior = parseJson(priorRaw, "previous material revision");
      const priorValidation = validateTaskMaterialRevisionVersionAware(prior);
      if (hash(priorRaw) !== ancestor.previous_hash
          || !priorValidation.ok
          || prior.task_id !== task.identity.taskId
          || prior.revision_id !== ancestor.parent_revision) {
        throw new Error("material revision parent does not match previous_ref");
      }
      ancestor = prior;
    }
    return Object.freeze({
      pointerRaw, pointer, revisionRaw, revision,
      validation,
      ref: pointer.revision_ref,
      hash: pointer.revision_hash,
    });
  };
  const repairMaterialRevision = (input = {}) => {
    plain(input, "material revision repair input");
    rejectUnknown(input, new Set(["change_summary", "source_refs", "expected_current_ref"]), "material revision repair input");
    const summary = nonemptyString(input.change_summary, "material revision repair change_summary");
    if (!Array.isArray(input.source_refs) || input.source_refs.length === 0
        || input.source_refs.some((ref) => typeof ref !== "string" || ref.trim() === "")) {
      throw new TypeError("material revision repair source_refs must be canonical task record refs");
    }
    const artifactDir = artifacts === undefined
      ? ArtifactDir.open((candidate ?? workspace).worktreeRoot, task)
      : assertArtifactDir(artifacts);
    return task.withRecordLock("locks/materials.publication.lock", () => {
      const head = readMaterialRevisionForRepair(artifactDir);
      if (head === null) throw new Error("MATERIAL_REPAIR_NOT_NEEDED: current material revision is missing");
      if (!head.validation.legacy) {
        return deepFreeze({
          repaired: false,
          idempotent: true,
          revision_ref: head.ref,
          revision_hash: head.hash,
          revision_id: head.pointer.revision_id,
          current: true,
        });
      }
      if (input.expected_current_ref !== undefined && input.expected_current_ref !== head.ref) {
        const conflict = new Error("MATERIAL_REPAIR_CONFLICT: expected current revision is stale");
        conflict.code = "MATERIAL_REPAIR_CONFLICT";
        throw conflict;
      }
      if (!head.revision.requirements) throw new Error("material revision repair requires legacy requirements binding");
      const sourceRefs = [...new Set(input.source_refs)].map((ref) => ({ ref, hash: hash(task.readRecord(ref)) }));
      const materials = Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"]
        .map((file) => [file, artifactDir.read(file)]));
      const created = createUnifiedMaterialRevision({
        taskId: task.identity.taskId,
        materials,
        requirements: head.revision.requirements,
        previous: { ...head.revision, revision_ref: head.ref, revision_hash: head.hash },
        changeSummary: summary,
        sourceRefs,
        includeRequirements: false,
        preserveChangedFiles: head.revision.changed_files,
      });
      if (created.idempotent) throw new Error("material revision repair did not produce a canonical successor");
      const canonicalValidation = validateTaskMaterialRevisionVersionAware(created.revision);
      if (!canonicalValidation.ok || canonicalValidation.legacy) {
        throw new Error(`canonical material revision is invalid: ${canonicalValidation.errors.join("; ")}`);
      }
      const revisionRaw = created.raw;
      try { createKernelRecord(created.revision_ref, revisionRaw, { testHooks: materialRevisionTestHooks?.revision }); }
      catch (error) {
        if (error?.code !== "EEXIST" || task.readRecord(created.revision_ref) !== revisionRaw) throw error;
      }
      const pointer = {
        schema_version: "task-material-current.v1",
        task_id: task.identity.taskId,
        generation: head.pointer.generation + 1,
        revision_id: created.revision.revision_id,
        revision_ref: created.revision_ref,
        revision_hash: hash(revisionRaw),
        previous_ref: head.ref,
      };
      const pointerRaw = `${JSON.stringify(pointer, null, 2)}\n`;
      try {
        replaceTaskCurrentPointer("materials/current.json", pointerRaw, {
          expectedPriorRaw: head.pointerRaw,
          validator: () => {},
          testHooks: materialRevisionTestHooks?.current,
        });
      } catch (error) {
        if (!/compare-and-swap source changed|MATERIAL_REVISION_CONFLICT/.test(error?.message ?? "")) throw error;
        const currentRaw = task.readRecord("materials/current.json");
        if (currentRaw !== pointerRaw) {
          const conflict = new Error("MATERIAL_REPAIR_CONFLICT: current pointer changed; retry from the authenticated head");
          conflict.code = "MATERIAL_REPAIR_CONFLICT";
          throw conflict;
        }
      }
      return deepFreeze({
        repaired: true,
        idempotent: false,
        legacy_ref: head.ref,
        legacy_hash: head.hash,
        revision_ref: created.revision_ref,
        revision_hash: hash(revisionRaw),
        revision_id: created.revision.revision_id,
        parent_ref: head.ref,
        current: true,
      });
    });
  };
  const currentVNextContext = () => {
    if (task.manifest.record_model !== "vnext-single-write") throw new Error("vNext writer requires a vnext-single-write task");
    const pointer = parseJson(task.readRecord("materials/current.json"), "material current pointer");
    const revision = parseJson(task.readRecord(pointer.revision_ref), "material revision");
    if (pointer.task_id !== task.identity.taskId || revision.revision_id !== pointer.revision_id) {
      throw new Error("vNext material revision is misbound");
    }
    const activeWorkspace = candidate ?? workspace;
    const snapshot = captureGitWorktreeSnapshot(activeWorkspace?.worktreeRoot ?? task.manifest.target_repo_root);
    return { pointer, revision, snapshot };
  };
  const publishVNextQualityFact = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "vNext quality fact input");
    rejectUnknown(input, new Set(["kind", "status", "subject", "evidence"]), "vNext quality fact input");
    const { revision, snapshot } = currentVNextContext();
    const fact = createUnifiedQualityFact({
      taskId: task.identity.taskId, stage: name, materialRevision: revision.revision_id,
      snapshotTree: snapshot.tree, kind: input.kind, status: input.status,
      subject: input.subject, evidence: input.evidence, recordedAt: now(),
    });
    return deepFreeze(publishUnifiedQualityFact({
      fact, read: task.readRecord, create: (ref, raw) => createKernelRecord(ref, raw),
    }));
  };
  const publishVNextPublication = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "vNext publication input");
    rejectUnknown(input, new Set(["quality_fact_refs"]), "vNext publication input");
    if (!Array.isArray(input.quality_fact_refs) || input.quality_fact_refs.length === 0) {
      throw new TypeError("vNext publication requires quality_fact_refs");
    }
    const { revision, snapshot } = currentVNextContext();
    const facts = input.quality_fact_refs.map((ref) => {
      const raw = task.readRecord(ref);
      const value = parseJson(raw, "vNext quality fact");
      return { ...value, value, ref, sha256: hash(raw) };
    });
    const freshness = facts.map((fact) => evaluateFactFreshness(fact, {
      material_revision: revision.revision_id, snapshot_tree: snapshot.tree,
    }, { read: task.readRecord }));
    const publication = createUnifiedPublication({
      taskId: task.identity.taskId, stage: name, materialRevision: revision,
      qualityFacts: facts, freshness, snapshotTree: snapshot.tree, read: task.readRecord,
    });
    return deepFreeze(publishUnifiedPublication({
      publication, read: task.readRecord, create: (ref, raw) => createKernelRecord(ref, raw),
    }));
  };
  const makeDecisionJournalAuthority = Symbol("make-decision-runtime-journal-authority");
  const writeStageStepEntry = (stage, input = {}, journalAuthority) => {
    const name = stageName(stage);
    if (name === "make-decision" && journalAuthority !== makeDecisionJournalAuthority) {
      throw new Error("make-decision journal is runtime-owned");
    }
    plain(input, "stage step entry input");
    if (input.retry_of_attempt_id !== undefined
        || (input.attempt_id !== undefined && input.attempt_id !== "attempt-1")) {
      throw new Error("step attempt identity is kernel-derived; caller cannot select an attempt");
    }
    rejectUnknown(input, new Set(["step_id", "attempt_id", "entry_evidence"]), "stage step entry input");
    const active = activeStageRun(name);
    let events = [];
    try {
      events = task.readRecord("journal.jsonl").split("\n").filter(Boolean)
        .map((line) => parseJson(line, "journal event"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const priorEntries = events.filter((event) => event.workflow_run_id === active.run.workflow_run_id
      && event.stage_slug === name && event.step_id === input.step_id
      && event.event_type === "step_entry");
    const attemptNumber = priorEntries.length + 1;
    if (attemptNumber > 1) {
      const priorAttemptId = `attempt-${attemptNumber - 1}`;
      const priorAttemptEvents = events.filter((event) =>
        event.workflow_run_id === active.run.workflow_run_id
        && event.stage_slug === name && event.step_id === input.step_id
        && event.attempt_id === priorAttemptId);
      const priorExit = priorAttemptEvents.find((event) => event.event_type === "step_exit");
      if (!priorExit) throw new Error("stage step retry requires a terminal prior attempt");
      if (!["failure", "blocked", "needs_human"].includes(priorExit.terminal_status)) {
        throw new Error("stage step retry requires a non-success terminal prior attempt");
      }
    }
    const attemptId = `attempt-${attemptNumber}`;
    const event = {
      schema_version: "v1",
      event_type: "step_entry",
      workflow_run_id: active.run.workflow_run_id,
      stage_slug: name,
      step_id: input.step_id,
      attempt_id: attemptId,
      timestamp: now(),
      journal_entry_id: randomUUID(),
      entry_evidence: structuredClone(input.entry_evidence),
      ...(attemptNumber === 1 ? {} : { retry_of_attempt_id: `attempt-${attemptNumber - 1}` }),
      manifest_schema_version: "2.0.0",
    };
    validateEntryPayload(event);
    task.appendJournal(event);
    return deepFreeze({
      journal_entry_id: event.journal_entry_id,
      workflow_run_id: event.workflow_run_id,
      attempt_id: event.attempt_id,
    });
  };
  const writeStageStepExit = (stage, input = {}, journalAuthority) => {
    const name = stageName(stage);
    if (name === "make-decision" && journalAuthority !== makeDecisionJournalAuthority) {
      throw new Error("make-decision journal is runtime-owned");
    }
    plain(input, "stage step exit input");
    if (input.attempt_id !== undefined && input.attempt_id !== "attempt-1") {
      throw new Error("step attempt identity is kernel-derived; caller cannot select an attempt");
    }
    rejectUnknown(input, new Set(["step_id", "attempt_id", "entry_journal_entry_id", "terminal_status", "completion_evidence", "skip_reason", "authorized_by", "block_reason"]), "stage step exit input");
    const active = activeStageRun(name);
    const events = task.readRecord("journal.jsonl").split("\n").filter(Boolean).map((line) => parseJson(line, "journal event"));
    const matchingEntry = [...events].reverse().find((candidate) => candidate.event_type === "step_entry"
      && candidate.workflow_run_id === active.run.workflow_run_id && candidate.stage_slug === name
      && candidate.step_id === input.step_id
      && candidate.journal_entry_id === input.entry_journal_entry_id);
    if (!matchingEntry) throw new Error("entry_journal_entry_id does not bind a canonical entry in the active run");
    const event = {
      schema_version: "v1",
      event_type: "step_exit",
      workflow_run_id: active.run.workflow_run_id,
      stage_slug: name,
      step_id: input.step_id,
      attempt_id: matchingEntry.attempt_id,
      timestamp: now(),
      entry_journal_entry_id: input.entry_journal_entry_id,
      terminal_status: input.terminal_status,
      completion_evidence: structuredClone(input.completion_evidence),
      manifest_schema_version: "2.0.0",
      ...(input.skip_reason === undefined ? {} : { skip_reason: input.skip_reason }),
      ...(input.authorized_by === undefined ? {} : { authorized_by: input.authorized_by }),
      ...(input.block_reason === undefined ? {} : { block_reason: input.block_reason }),
    };
    validateExitPayload(event);
    if (events.some((candidate) => candidate.event_type === "step_exit"
      && candidate.workflow_run_id === event.workflow_run_id && candidate.stage_slug === name
      && candidate.step_id === event.step_id && candidate.attempt_id === event.attempt_id)) {
      throw new Error("duplicate terminal exit for active run step attempt");
    }
    task.appendJournal(event);
    return deepFreeze({ workflow_run_id: event.workflow_run_id });
  };
  const completeRuntimeOwnedStageStep = (name, input = {}) => {
    if (!new Set(["make-decision", "build-spec", "build-plan"]).has(name)) {
      throw new TypeError(`unsupported runtime-owned stage: ${name}`);
    }
    plain(input, "runtime-owned stage step input");
    rejectUnknown(input, new Set(["step_id", "entry_evidence", "completion_evidence", "terminal_status", "skip_reason"]), "runtime-owned stage step input");
    if (name === "build-plan" && !new Set([7, 8]).has(input.step_id)) {
      throw new Error("runtime-owned build-plan completion is limited to steps 7 and 8");
    }
    if (name === "build-spec" && input.step_id !== 6) {
      throw new Error("runtime-owned build-spec completion is limited to step 6");
    }
    const terminalStatus = input.terminal_status ?? "success";
    if (!new Set(["success", "skipped"]).has(terminalStatus)) {
      throw new Error("runtime-owned stage step terminal_status must be success or skipped");
    }
    const isResearchSkip = name === "make-decision" && input.step_id === 4 && terminalStatus === "skipped";
    if (terminalStatus === "skipped" && (!isResearchSkip || typeof input.skip_reason !== "string" || input.skip_reason.trim() === "")) {
      throw new Error("runtime-owned skipped status is only valid for make-decision research with a skip_reason");
    }
    if (terminalStatus === "success" && input.skip_reason !== undefined) {
      throw new Error("runtime-owned successful status must not contain skip_reason");
    }
    const authorizedBy = isResearchSkip ? "stage-runtime:record-research" : undefined;
    const eventCompletesDependency = (event) => event?.terminal_status === "success"
      || (event?.step_id === 4 && event?.terminal_status === "skipped"
        && event?.authorized_by === "stage-runtime:record-research"
        && typeof event?.skip_reason === "string" && event.skip_reason.trim() !== "");
    return task.withRecordLock(`locks/${name}.progress.lock`, () => {
      const active = activeStageRun(name);
      let events = [];
      try {
        events = task.readRecord("journal.jsonl").split("\n").filter(Boolean).map((line) => parseJson(line, "journal event"));
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const activeEvents = activeStageStepEvents({ stage: name, run: active.run, events });
      const matching = activeEvents.filter((event) => event.step_id === input.step_id);
      const existingExit = matching.find((event) => event.event_type === "step_exit");
      if (existingExit) {
        const existingEntry = matching.find((event) => event.event_type === "step_entry");
        if (!existingEntry
            || canonicalJson(existingEntry.entry_evidence) !== canonicalJson(input.entry_evidence)
            || canonicalJson(existingExit.completion_evidence) !== canonicalJson(input.completion_evidence)
            || existingExit.terminal_status !== terminalStatus
            || (existingExit.skip_reason ?? null) !== (input.skip_reason ?? null)
            || (existingExit.authorized_by ?? null) !== (authorizedBy ?? null)) {
          throw new Error(`runtime-owned ${name} step ${input.step_id} already has different canonical evidence or status`);
        }
        return deepFreeze({ workflow_run_id: active.run.workflow_run_id, idempotent: true });
      }
      if (name !== "build-spec" && input.step_id > 1 && !activeEvents.some((event) => event.step_id === input.step_id - 1
          && event.event_type === "step_exit"
          && eventCompletesDependency(event))) {
        throw new Error(`runtime-owned ${name} step ${input.step_id} requires completed step ${input.step_id - 1}`);
      }
      let entry = matching.find((event) => event.event_type === "step_entry");
      if (entry && JSON.stringify(entry.entry_evidence) !== JSON.stringify(input.entry_evidence)) {
        throw new Error(`runtime-owned ${name} step ${input.step_id} already has different entry evidence`);
      }
      if (!entry) {
        const created = writeStageStepEntry(name, {
          step_id: input.step_id,
          attempt_id: "attempt-1",
          entry_evidence: input.entry_evidence,
        }, makeDecisionJournalAuthority);
        entry = { journal_entry_id: created.journal_entry_id };
      }
      writeStageStepExit(name, {
        step_id: input.step_id,
        attempt_id: "attempt-1",
        entry_journal_entry_id: entry.journal_entry_id,
        terminal_status: terminalStatus,
        completion_evidence: input.completion_evidence,
        ...(input.skip_reason === undefined ? {} : { skip_reason: input.skip_reason }),
        ...(authorizedBy === undefined ? {} : { authorized_by: authorizedBy }),
      }, makeDecisionJournalAuthority);
      return deepFreeze({ workflow_run_id: active.run.workflow_run_id, idempotent: false });
    });
  };
  const completeMakeDecisionStageStep = (input = {}) =>
    completeRuntimeOwnedStageStep("make-decision", input);
  const completeBuildSpecResultPublication = (input = {}) => {
    plain(input, "build-spec result publication input");
    rejectUnknown(input, new Set(["attempt_ref", "attempt_hash"]), "build-spec result publication input");
    const attemptRef = nonemptyString(input.attempt_ref, "build-spec result publication attempt_ref");
    const attemptHash = nonemptyString(input.attempt_hash, "build-spec result publication attempt_hash");
    if (!ATTEMPT_REF.test(attemptRef) || !HASH.test(attemptHash)) {
      throw new Error("build-spec result publication requires a canonical attempt ref and hash");
    }
    const attemptRaw = task.readRecord(`results/build-spec/${attemptRef}`);
    const attempt = validateAttempt(parseJson(attemptRaw, "build-spec result publication attempt"), {
      taskId: task.identity.taskId,
      stage: "build-spec",
    });
    const active = activeStageRun("build-spec");
    if (hash(attemptRaw) !== attemptHash || attempt.workflow_run_id !== active.run.workflow_run_id) {
      throw new Error("build-spec result publication attempt binding mismatch");
    }
    return completeRuntimeOwnedStageStep("build-spec", {
      step_id: 6,
      entry_evidence: {
        kind: "stage_attempt",
        uri_or_path: `results/build-spec/${attemptRef}`,
        content_hash: attemptHash,
      },
      completion_evidence: {
        kind: "stage_result",
        uri_or_path: `results/build-spec/${attemptRef}`,
        content_hash: attemptHash,
      },
    });
  };
  const publishBuildSpecCompletionAudit = (input = {}) => {
    plain(input, "build-spec completion audit input");
    rejectUnknown(input, new Set(["attempt_ref", "attempt_hash", "audit"]), "build-spec completion audit input");
    const attemptRef = nonemptyString(input.attempt_ref, "build-spec completion audit attempt_ref");
    const attemptHash = nonemptyString(input.attempt_hash, "build-spec completion audit attempt_hash");
    if (!ATTEMPT_REF.test(attemptRef) || !HASH.test(attemptHash)) {
      throw new Error("build-spec completion audit requires a canonical attempt ref and hash");
    }
    const attemptRaw = task.readRecord(`results/build-spec/${attemptRef}`);
    if (hash(attemptRaw) !== attemptHash) throw new Error("build-spec completion audit attempt hash mismatch");
    plain(input.audit, "build-spec completion audit status");
    rejectUnknown(input.audit, new Set(["status", "ref", "hash", "reason"]), "build-spec completion audit status");
    if (input.audit.status === "recorded") {
      if (!/^evidence\/audits\/build-spec\/[a-f0-9]{64}\.json$/.test(input.audit.ref ?? "")
          || !HASH.test(input.audit.hash ?? "") || hash(task.readRecord(input.audit.ref)) !== input.audit.hash) {
        throw new Error("build-spec completion audit canonical audit binding mismatch");
      }
    } else if (input.audit.status !== "unavailable"
        || typeof input.audit.reason !== "string" || input.audit.reason.trim() === "") {
      throw new Error("build-spec completion audit must record a canonical audit or an unavailable reason");
    }
    const record = {
      schema_version: "build-spec-completion-audit.v1",
      task_id: task.identity.taskId,
      stage: "build-spec",
      attempt_ref: attemptRef,
      attempt_hash: attemptHash,
      audit: structuredClone(input.audit),
    };
    const raw = `${JSON.stringify(record, null, 2)}\n`;
    const ref = `evidence/build-spec-completions/${attemptHash}.json`;
    try {
      createKernelRecord(ref, raw);
    } catch (error) {
      if (error?.code !== "EEXIST" || task.readRecord(ref) !== raw) throw error;
    }
    return deepFreeze({ status: input.audit.status, ref, record });
  };
  const readBuildSpecCompletionAudit = (attemptRef, attemptHash) => {
    if (!ATTEMPT_REF.test(attemptRef ?? "") || !HASH.test(attemptHash ?? "")) {
      throw new Error("build-spec completion audit lookup requires attempt ref and hash");
    }
    const ref = `evidence/build-spec-completions/${attemptHash}.json`;
    const record = parseJson(task.readRecord(ref), "build-spec completion audit");
    if (record.schema_version !== "build-spec-completion-audit.v1"
        || record.task_id !== task.identity.taskId || record.stage !== "build-spec"
        || record.attempt_ref !== attemptRef || record.attempt_hash !== attemptHash) {
      throw new Error("build-spec completion audit lookup binding mismatch");
    }
    return deepFreeze({ ref, record });
  };
  const completedMakeDecisionDependency = (workflowRunId, stepId) => {
    let events = [];
    try {
      events = task.readRecord("journal.jsonl").split("\n").filter(Boolean)
        .map((line) => parseJson(line, "journal event"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const active = activeStageRun("make-decision");
    if (active.run.workflow_run_id !== workflowRunId) return false;
    return activeStageStepEvents({ stage: "make-decision", run: active.run, events })
      .some((event) => event.step_id === stepId && event.event_type === "step_exit"
      && (event.terminal_status === "success"
        || (stepId === 4 && event.terminal_status === "skipped"
          && event.authorized_by === "stage-runtime:record-research"
          && typeof event.skip_reason === "string" && event.skip_reason.trim() !== "")));
  };
  const assertMakeDecisionProducerPredecessor = (stepId) => {
    const active = activeStageRun("make-decision");
    if (stepId > 1 && !completedMakeDecisionDependency(active.run.workflow_run_id, stepId - 1)) {
      throw new Error(`make-decision producer for step ${stepId} requires completed step ${stepId - 1}`);
    }
    return active;
  };
  const interactionStepId = (payload) => {
    if (payload?.interaction_type === "talk") {
      const round = payload.rounds?.[0]?.round_number;
      if (round === 1) return 3;
      if (round === 2) return 5;
      if (round === 3) return 7;
      throw new Error("make-decision talk evidence must bind round 1, 2, or 3");
    }
    if (payload?.interaction_type === "grill") return 8;
    if (payload?.interaction_type === "aggregate" || payload?.interaction_type === "grill-revalidation") return null;
    throw new Error("make-decision interaction evidence type is invalid");
  };
  const prepareMakeDecisionInteractionPublication = (input = {}) => {
    plain(input, "make-decision interaction publication input");
    rejectUnknown(input, new Set(["interaction_type", "round_number"]), "make-decision interaction publication input");
    const stepId = input.interaction_type === "talk"
      ? interactionStepId({ interaction_type: "talk", rounds: [{ round_number: input.round_number }] })
      : interactionStepId({ interaction_type: input.interaction_type });
    const predecessorStepId = stepId === null ? 10 : stepId - 1;
    const active = activeStageRun("make-decision");
    if (!completedMakeDecisionDependency(active.run.workflow_run_id, predecessorStepId)) {
      throw new Error(`make-decision ${input.interaction_type} publication requires completed step ${predecessorStepId}`);
    }
    return deepFreeze({ workflow_run_id: active.run.workflow_run_id, step_id: stepId });
  };
  const completeMakeDecisionInteractionPublication = (input = {}) => {
    plain(input, "make-decision interaction completion input");
    rejectUnknown(input, new Set(["evidence_ref", "evidence_hash"]), "make-decision interaction completion input");
    const evidenceRef = nonemptyString(input.evidence_ref, "make-decision interaction evidence_ref");
    const evidenceHash = nonemptyString(input.evidence_hash, "make-decision interaction evidence_hash");
    const match = STAGE_CONTENT_REF.exec(evidenceRef);
    if (!match || !HASH.test(evidenceHash)) throw new TypeError("make-decision interaction evidence binding is invalid");
    const raw = task.readRecord(evidenceRef);
    if (hash(raw) !== evidenceHash) throw new Error("make-decision interaction evidence hash mismatch");
    const value = parseJson(raw, "make-decision interaction evidence");
    const active = activeStageRun("make-decision");
    const expectedRoot = hash(`${task.identity.taskId}\0make-decision\0${active.run.workflow_run_id}`);
    if (match[1] !== expectedRoot
        || value.schema_version !== "stage-content-evidence.v1"
        || value.kind !== "interaction-completion.v1"
        || value.task_id !== task.identity.taskId || value.stage !== "make-decision"
        || value.workflow_run_id !== active.run.workflow_run_id
        || value.content_hash !== hash(JSON.stringify(value.payload))
        || !Number.isFinite(Date.parse(value.created_at))) {
      throw new Error("make-decision interaction evidence identity or content binding mismatch");
    }
    const stepId = interactionStepId(value.payload);
    if (value.payload.interaction_type === "aggregate") {
      return deepFreeze({ workflow_run_id: active.run.workflow_run_id, idempotent: true });
    }
    const skillName = value.payload.interaction_type === "talk" ? "talk-with-zhipeng" : "grill-with-docs";
    const invocationKey = value.payload.interaction_type === "talk"
      ? `talk-${value.payload.rounds[0].round_number}`
      : value.payload.interaction_type === "grill-revalidation"
        ? (() => {
          const revalidation = /interaction-completion\.grill-revalidation-(\d{4})\.json$/.exec(evidenceRef);
          if (!revalidation) throw new Error("make-decision grill revalidation evidence ref is invalid");
          return `grill-revalidation-${Number(revalidation[1])}`;
        })()
        : "grill";
    const invocation = kernel.readStageSkillInvocation("make-decision", skillName, invocationKey);
    if (invocation?.fact?.status !== "executed"
        || invocation.fact.outcome_ref !== evidenceRef
        || invocation.fact.outcome_hash !== evidenceHash
        || invocation.fact.snapshot_tree !== value.snapshot_tree) {
      return deepFreeze({
        workflow_run_id: active.run.workflow_run_id,
        step_id: stepId,
        completed: false,
        missing_invocation: `${skillName}/${invocationKey}`,
      });
    }
    if (stepId === null) {
      if (!completedMakeDecisionDependency(active.run.workflow_run_id, 10)) {
        throw new Error("make-decision grill revalidation requires completed step 10");
      }
    } else {
      assertMakeDecisionProducerPredecessor(stepId);
    }
    const activeWorkspace = candidate ?? workspace;
    if (!activeWorkspace) throw new Error("make-decision interaction completion requires CandidateWorkspace");
    const snapshot = typeof activeWorkspace.captureSnapshot === "function"
      ? activeWorkspace.captureSnapshot() : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
    if (value.snapshot_tree !== snapshot.tree || value.payload?.workspace_tree !== snapshot.tree) {
      throw new Error("make-decision interaction evidence does not bind the current Workspace");
    }
    if (stepId === null) {
      return deepFreeze({ workflow_run_id: active.run.workflow_run_id, idempotent: true, revalidated: true });
    }
    const evidence = { kind: "stage_content", uri_or_path: evidenceRef, content_hash: evidenceHash };
    return completeMakeDecisionStageStep({
      step_id: stepId,
      entry_evidence: evidence,
      completion_evidence: evidence,
    });
  };
  const completeMakeDecisionResearch = (input = {}) => {
    plain(input, "make-decision research completion input");
    rejectUnknown(input, new Set(["status", "reason", "evidence"]), "make-decision research completion input");
    if (!new Set(["performed", "skipped"]).has(input.status)
        || typeof input.reason !== "string" || input.reason.trim() === "") {
      throw new TypeError("make-decision research completion status/reason is invalid");
    }
    plain(input.evidence, "make-decision research evidence");
    rejectUnknown(input.evidence, new Set(["kind", "uri_or_path", "content_hash"]), "make-decision research evidence");
    if (typeof input.evidence.kind !== "string" || input.evidence.kind.trim() === ""
        || typeof input.evidence.uri_or_path !== "string"
        || !/^(?:evidence|receipts)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(input.evidence.uri_or_path)
        || input.evidence.uri_or_path.includes("..")
        || !HASH.test(input.evidence.content_hash ?? "")) {
      throw new TypeError("make-decision research evidence binding is invalid");
    }
    assertMakeDecisionProducerPredecessor(4);
    const raw = task.readRecord(input.evidence.uri_or_path);
    if (hash(raw) !== input.evidence.content_hash) throw new Error("make-decision research evidence hash mismatch");
    return completeMakeDecisionStageStep({
      step_id: 4,
      entry_evidence: input.evidence,
      completion_evidence: {
        ...input.evidence,
        kind: input.status === "skipped" ? "research_skip" : input.evidence.kind,
      },
      terminal_status: input.status === "skipped" ? "skipped" : "success",
      ...(input.status === "skipped" ? { skip_reason: input.reason } : {}),
    });
  };
  const completeMakeDecisionReceipt = (input = {}) => {
    plain(input, "make-decision receipt completion input");
    rejectUnknown(input, new Set(["receipt_ref", "receipt_hash"]), "make-decision receipt completion input");
    const isDecisionRevision = /^receipts\/revisions\/decision\/[a-f0-9]{64}\.json$/.test(input.receipt_ref ?? "");
    if ((input.receipt_ref !== DECISION_RECEIPT_REF && !isDecisionRevision) || !HASH.test(input.receipt_hash ?? "")) {
      throw new TypeError("make-decision receipt binding is invalid");
    }
    assertMakeDecisionProducerPredecessor(9);
    const raw = task.readRecord(input.receipt_ref);
    if (hash(raw) !== input.receipt_hash) throw new Error("make-decision receipt hash mismatch");
    const receipt = parseJson(raw, "make-decision decision receipt");
    if (isDecisionRevision) {
      const previousRef = receipt.revision?.previous_ref;
      const previousHash = receipt.revision?.previous_hash;
      if (previousRef !== DECISION_RECEIPT_REF || !HASH.test(previousHash ?? "")
          || hash(task.readRecord(previousRef)) !== previousHash
          || receipt.revision?.content_hash !== hash(`${JSON.stringify({
            schema_version: receipt.schema_version,
            task_id: receipt.task_id,
            stage: receipt.stage,
            producer: receipt.producer,
            decision_ref: receipt.decision_ref,
            decision_hash: receipt.decision_hash,
            contract_refs: receipt.contract_refs,
            content_hash: receipt.content_hash,
          }, null, 2)}\n`)) {
        throw new Error("make-decision decision revision provenance binding mismatch");
      }
    }
    const decisionRaw = task.readRecord(receipt.decision_ref);
    if (receipt.schema_version !== "workflowhub-receipt.v1"
        || receipt.task_id !== task.identity.taskId || receipt.stage !== "make-decision"
        || receipt.producer?.stage !== "make-decision" || receipt.producer?.component !== "decision"
        || !/^receipts\/decision-log\/[a-f0-9]{64}\.md$/.test(receipt.decision_ref ?? "")
        || receipt.decision_hash !== hash(decisionRaw)
        || receipt.content_hash !== receipt.decision_hash) {
      throw new Error("make-decision decision receipt canonical binding mismatch");
    }
    // Step 9 proves that a decision receipt was first produced.  A later
    // append-only revision is the current decision material, not a rewrite of
    // that historical completion.  Its provenance has been checked above, so
    // keep the old journal evidence immutable and let downstream consumers
    // select the explicit revision receipt.
    const active = activeStageRun("make-decision");
    if (isDecisionRevision && completedMakeDecisionDependency(active.run.workflow_run_id, 9)) {
      if (!completedMakeDecisionDependency(active.run.workflow_run_id, 10)) {
        throw new Error("make-decision decision revision requires completed step 10");
      }
      return deepFreeze({ workflow_run_id: active.run.workflow_run_id, idempotent: true, revision: true });
    }
    const evidence = { kind: "decision_receipt", uri_or_path: input.receipt_ref, content_hash: input.receipt_hash };
    return completeMakeDecisionStageStep({
      step_id: 9,
      entry_evidence: evidence,
      completion_evidence: evidence,
    });
  };
  const deriveStageWorkflowRunId = (stage) => {
    const name = stageName(stage);
    const active = latestStageRun(name);
    if (active !== null) return active.run.workflow_run_id;
    if (name === "make-decision") return `task-created:${nonemptyString(task.manifest.created_at, "task created_at")}`;
    const upstreamStage = EXPECTED_UPSTREAM[name];
    try {
      const upstream = readAcceptedLocal(upstreamStage, {
        allowLegacyBuildCode: upstreamStage === "build-code",
        liveCheckpoint: false,
      });
      return nonemptyString(upstream?.attempt?.attempt_id, `${name} accepted upstream attempt_id`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      return `task-current:${name}:${nonemptyString(task.manifest.created_at, "task created_at")}`;
    }
  };
  const buildPlanPreConfirmationAudit = (attempt) => {
    if (attempt?.stage !== "build-plan" || typeof attempt.facts?.audit_summary_ref !== "string") return null;
    try {
      const raw = task.readRecord(attempt.facts.audit_summary_ref);
      const value = parseJson(raw, "build-plan pre-confirmation audit");
      if (value.through_step_id !== 6
          || value.summary_hash !== attempt.facts.audit_summary_hash
          || value.verdict !== "pass" || attempt.facts.audit_verdict !== "pass"
          || hashAuditSummary(value) !== value.summary_hash
          || value.task_id !== task.identity.taskId || value.stage_slug !== "build-plan"
          || value.workflow_run_id !== deriveStageWorkflowRunId("build-plan")) return null;
      return { raw, value };
    } catch {
      return null;
    }
  };
  const verifyAuditPublication = (stage, facts) => {
    const raw = task.readRecord(facts.audit_summary_ref);
    const summary = parseJson(raw, `${stage} audit summary`);
    const unsigned = { ...summary };
    delete unsigned.summary_hash;
    if (summary.summary_hash !== hashAuditSummary(unsigned)
        || facts.audit_summary_hash !== summary.summary_hash
        || facts.audit_summary_ref !== `evidence/audits/${stage}/${summary.summary_hash}.json`) {
      throw new Error(`${stage} audit summary hash/ref binding mismatch`);
    }
    if (summary.task_id !== task.identity.taskId || summary.stage_slug !== stage
        || summary.workflow_run_id !== deriveStageWorkflowRunId(stage)) {
      throw new Error(`${stage} audit identity/run binding mismatch`);
    }
    const activeWorkspace = candidate ?? workspace;
    if (!activeWorkspace) throw new Error(`${stage} audit requires an active Workspace`);
    const snapshot = typeof activeWorkspace.captureSnapshot === "function"
      ? activeWorkspace.captureSnapshot()
      : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
    if (summary.snapshot_tree !== snapshot.tree) throw new Error(`${stage} audit snapshot tree binding mismatch`);
    if (!new Set(["pass", "fail"]).has(summary.verdict) || facts.audit_verdict !== summary.verdict) {
      throw new Error(`${stage} audit verdict binding mismatch`);
    }
    if (stage === "make-decision" && facts.audit_through_step_id !== undefined
        && facts.audit_through_step_id !== summary.through_step_id) {
      throw new Error("make-decision audit step boundary mismatch");
    }
    if (JSON.stringify(facts.content_evidence_refs) !== JSON.stringify(summary.content_evidence_refs)) {
      throw new Error(`${stage} audit/content evidence refs mismatch`);
    }
    const seenKinds = new Set();
    for (const [index, entry] of facts.content_evidence_refs.entries()) {
      if (!entry || typeof entry !== "object" || !nonemptyString(entry.kind, `content_evidence_refs[${index}].kind`)
          || !/^evidence\/stage-content\/[a-f0-9]{64}\/[a-z0-9][a-z0-9.-]*\.json$/.test(entry.ref ?? "")
          || !HASH.test(entry.hash ?? "")) throw new Error(`${stage} content evidence ref is invalid`);
      if (seenKinds.has(entry.kind)) throw new Error(`${stage} duplicate content evidence kind`);
      seenKinds.add(entry.kind);
      const contentRaw = task.readRecord(entry.ref);
      if (hash(contentRaw) !== entry.hash) throw new Error(`${stage} content evidence hash mismatch`);
      const content = parseJson(contentRaw, `${stage} content evidence`);
      if (content.kind !== entry.kind || content.task_id !== task.identity.taskId || content.stage !== stage
          || content.workflow_run_id !== summary.workflow_run_id || content.snapshot_tree !== snapshot.tree) {
        throw new Error(`${stage} content evidence binding mismatch`);
      }
    }
  };
  const verifyMakeDecisionCore = (attempt) => {
    const decisionRef = attempt.facts.decision_ref;
    const decisionHash = attempt.facts.decision_hash;
    const match = /^receipts\/decision-log\/([a-f0-9]{64})\.md$/.exec(decisionRef ?? "");
    if (!match || !HASH.test(decisionHash ?? "") || match[1] !== decisionHash) {
      throw new Error("make-decision acceptance requires a canonical core decision_ref/hash binding");
    }
    const decisionRaw = task.readRecord(decisionRef);
    if (decisionRaw.trim() === "" || hash(decisionRaw) !== decisionHash) {
      throw new Error("make-decision core decision_ref does not bind the published decision bytes");
    }
  };
  const readVerifiedCurrentMaterialRevision = () => {
    let pointerRaw;
    try {
      pointerRaw = task.readRecord("materials/current.json");
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
    const pointer = parseJson(pointerRaw, "material current pointer");
      if (pointer.schema_version !== "task-material-current.v1"
          || pointer.task_id !== task.identity.taskId
          || !Number.isInteger(pointer.generation) || pointer.generation < 1
          || !/^materials\/revisions\/[a-f0-9]{64}\.json$/.test(pointer.revision_ref ?? "")
          || !HASH.test(pointer.revision_hash ?? "")) {
        throw new Error("material current pointer is invalid or misbound");
      }
      const revisionRaw = task.readRecord(pointer.revision_ref);
      const revision = parseJson(revisionRaw, "current material revision");
      const validation = validateTaskMaterialRevision(revision);
      if (hash(revisionRaw) !== pointer.revision_hash
          || !validation.ok
          || revision.task_id !== task.identity.taskId
          || revision.revision_id !== pointer.revision_id
          || revision.previous_ref !== (pointer.previous_ref ?? null)) {
        throw new Error(`current material revision is invalid or misbound: ${validation.errors.join("; ")}`);
      }
      if (revision.previous_ref === null) {
        if (revision.parent_revision !== null || revision.previous_hash !== null) {
          throw new Error("current material root revision has a forged parent");
        }
      } else {
        const priorRaw = task.readRecord(revision.previous_ref);
        const prior = parseJson(priorRaw, "previous material revision");
        if (hash(priorRaw) !== revision.previous_hash
            || !validateTaskMaterialRevision(prior).ok
            || prior.revision_id !== revision.parent_revision) {
          throw new Error("current material revision parent does not match previous_ref");
        }
      }
      for (const file of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
        if (hash(artifacts.read(file)) !== revision.hashes[file]) {
          throw new Error(`current material revision does not bind live ${file}`);
        }
      }
    return revision;
  };
  const currentCheckpointBase = (stage) => {
    const name = stageName(stage);
    if (!["build-spec", "build-plan"].includes(name)) throw new Error(`stage does not produce a Git checkpoint: ${name}`);
    const activeWorkspace = assertWorkspace(workspace);
    const snapshot = captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
    // A new checkpoint records the current four-material snapshot. It does not
    // reconstruct that snapshot through a previously accepted checkpoint.
    const baseCommit = snapshot.head;
    const baseTree = snapshot.tree;
    return { baseCommit, baseTree };
  };
  const readReviewFlow = (value) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    const flowId = reviewFlowId(identity);
    const refs = task.listCanonicalReviewFlowEventRefs(flowId);
    if (refs.length === 0) return null;
    let prior = null;
    for (const [index, ref] of refs.entries()) {
      const expectedRef = `reviews/flows/${flowId}/event-${String(index + 1).padStart(4, "0")}.json`;
      if (ref !== expectedRef) throw new Error("review flow is discontinuous or has multiple heads");
      let event;
      try { event = parseJson(task.readRecord(ref), "review flow event"); }
      catch (error) { throw new Error(`review flow event is unreadable: ${error.message}`); }
      const eventKind = event?.event_kind ?? "semantic_result";
      if (event?.version !== "wh-review-flow-event.v1" || event.flow_id !== flowId
          || JSON.stringify(event.identity) !== JSON.stringify(identity)
          || event.sequence !== index + 1 || event.event_ref !== ref
          || event.previous_event_ref !== (prior?.event_ref ?? null)
          || event.previous_head_ref !== (prior?.head_result_ref ?? null)
          || !["semantic_result", "resolution", "provider_attempt"].includes(eventKind)
          || (event.head_result_ref !== null && !RESULT_REF_FOR_FLOW.test(event.head_result_ref ?? ""))
          || (event.root_result_ref !== null && !RESULT_REF_FOR_FLOW.test(event.root_result_ref ?? ""))
          || (event.result_sha256 !== null && !HASH.test(event.result_sha256 ?? ""))
          || (event.verdict !== null && !["pass", "revise_required"].includes(event.verdict))
          || !["initial", "closure", "full", "legacy"].includes(event.round)
          || !Number.isSafeInteger(event.semantic_result_count) || event.semantic_result_count < 0
          || !Number.isSafeInteger(event.structural_full_reviews) || event.structural_full_reviews < 0
          || !Number.isSafeInteger(event.provider_calls) || event.provider_calls < 0) {
        throw new Error("review flow event is invalid, forked, or misbound");
      }
      const sameHead = event.head_result_ref === (prior?.head_result_ref ?? null)
        && event.root_result_ref === (prior?.root_result_ref ?? null)
        && event.result_sha256 === (prior?.result_sha256 ?? null)
        && event.verdict === (prior?.verdict ?? null);
      if (eventKind === "semantic_result") {
        const semanticPrior = prior;
        let resultRaw; let result;
        try {
          resultRaw = task.readRecord(event.head_result_ref);
          result = parseJson(resultRaw, "review flow result");
        } catch (error) { throw new Error(`review flow result is unreadable: ${error.message}`); }
        if (hash(resultRaw) !== event.result_sha256 || result?.version !== "wh-review-result.v1"
            || result.task_id !== identity.task_id || result.stage !== identity.stage
            || (result.review_track ?? null) !== identity.review_track
            || result.subject_kind !== identity.subject_kind || (result.phase_id ?? null) !== identity.phase_id
            || (result.review_scope ?? null) !== identity.review_scope
            || (identity.snapshot_tree !== undefined && result.snapshot_tree !== identity.snapshot_tree)
            || result.verdict !== event.verdict || !Array.isArray(result.provider_results)
            || event.semantic_result_count !== (semanticPrior?.semantic_result_count ?? 0) + 1) {
          throw new Error("review flow result bytes or identity do not match the authoritative event");
        }
        let actualProviderCalls = result.provider_results.length;
        if (ATTEMPT_REF_FOR_FLOW.test(result.attempt_ref ?? "")) {
          try {
            const attempt = parseJson(task.readRecord(result.attempt_ref), "review flow semantic attempt");
            if (Array.isArray(attempt.provider_attempts)) actualProviderCalls = attempt.provider_attempts.length;
          } catch { /* Legacy semantic fixtures may omit their attempt record. */ }
        }
        if (event.provider_calls !== (semanticPrior?.provider_calls ?? 0) + actualProviderCalls) {
          throw new Error("review flow semantic provider-call cost is invalid");
        }
        if (semanticPrior?.head_result_ref == null) {
          const chain = result.review_chain ?? null;
          let authenticatedContinuation = false;
          if (identity.stage === "build-code" && identity.subject_kind === "phase"
              && identity.snapshot_tree !== undefined && chain
              && ["initial", "full"].includes(event.round)
              && RESULT_REF_FOR_FLOW.test(chain.parent_result_ref ?? "")
              && RESULT_REF_FOR_FLOW.test(chain.root_result_ref ?? "")
              && HASH.test(chain.response_ledger_sha256 ?? "")) {
            let parent;
            try { parent = parseJson(task.readRecord(chain.parent_result_ref), "external Phase review parent"); }
            catch (error) { throw new Error(`external Phase review parent is invalid: ${error.message}`); }
            const expectedRoot = parent.review_chain?.root_result_ref ?? chain.parent_result_ref;
            authenticatedContinuation = parent.version === "wh-review-result.v1"
              && parent.task_id === identity.task_id && parent.stage === identity.stage
              && parent.subject_kind === "phase" && parent.phase_id === identity.phase_id
              && parent.review_scope === "phase" && parent.snapshot_tree !== identity.snapshot_tree
              && chain.root_result_ref === expectedRoot && event.root_result_ref === expectedRoot
              && chain.prior_snapshot_tree === parent.snapshot_tree
              && chain.current_snapshot_tree === identity.snapshot_tree
              && event.previous_head_ref === null
              && event.structural_full_reviews === (event.round === "full" ? 1 : 0);
          }
          if (!authenticatedContinuation && (event.root_result_ref !== event.head_result_ref
              || event.previous_head_ref !== null
              || event.structural_full_reviews !== 0 || !["initial", "legacy"].includes(event.round))) {
            throw new Error("review flow has multiple roots or an invalid initial head");
          }
        } else if (event.root_result_ref !== semanticPrior.root_result_ref
            || !["closure", "full"].includes(event.round)
            || event.structural_full_reviews !== semanticPrior.structural_full_reviews + (event.round === "full" ? 1 : 0)) {
          throw new Error("review flow root, head, or budget regressed");
        }
      } else {
        if (!sameHead || event.semantic_result_count !== (prior?.semantic_result_count ?? 0)
            || event.structural_full_reviews !== (prior?.structural_full_reviews ?? 0)
            || !HASH.test(event.action_sha256 ?? "")) {
          throw new Error("review flow action moved the semantic head or budget");
        }
        let actionRaw; let action;
        try { actionRaw = task.readRecord(event.action_ref); action = parseJson(actionRaw, "review flow action"); }
        catch (error) { throw new Error(`review flow action is unreadable: ${error.message}`); }
        if (hash(actionRaw) !== event.action_sha256) throw new Error("review flow action hash mismatch");
        if (eventKind === "resolution") {
          if (!RESOLUTION_REF_FOR_FLOW.test(event.action_ref ?? "") || action?.version !== "wh-review-resolution.v1"
              || event.action_ref !== `reviews/resolutions/${hash(canonicalJson(action))}.json`
              || action.task_id !== identity.task_id || action.stage !== identity.stage
              || (action.review_track ?? null) !== identity.review_track
              || action.previous_result_ref !== event.head_result_ref
              || event.provider_calls !== (prior?.provider_calls ?? 0)) {
            throw new Error("review flow resolution action is invalid or misbound");
          }
        } else if (!ATTEMPT_REF_FOR_FLOW.test(event.action_ref ?? "") || action?.version !== "wh-review-attempt.v1"
            || action.task_id !== identity.task_id || action.stage !== identity.stage
            || (action.review_track ?? null) !== identity.review_track
            || action.subject_kind !== identity.subject_kind || (action.phase_id ?? null) !== identity.phase_id
            || (action.review_scope ?? null) !== identity.review_scope
            || action.terminal_status !== "unavailable" || !Array.isArray(action.provider_attempts)
            || event.provider_calls !== (prior?.provider_calls ?? 0) + action.provider_attempts.length) {
          throw new Error("review flow provider attempt action is invalid or misbound");
        }
      }
      prior = event;
    }
    return deepFreeze(prior);
  };
  const readReviewFlowHistory = (value) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    const flow = readReviewFlow(identity);
    if (flow === null) return deepFreeze({ flow: null, provider_attempt_refs: [] });
    const refs = task.listCanonicalReviewFlowEventRefs(reviewFlowId(identity));
    if (refs.length !== flow.sequence || refs.at(-1) !== flow.event_ref) {
      throw new Error("review flow changed while reading authenticated action history");
    }
    const providerAttemptRefs = refs.flatMap((ref) => {
      const event = parseJson(task.readRecord(ref), "review flow event");
      return (event.event_kind ?? "semantic_result") === "provider_attempt" ? [event.action_ref] : [];
    });
    return deepFreeze({ flow, provider_attempt_refs: providerAttemptRefs });
  };
  const makeDecisionReviewStepId = (identity) => {
    if (identity.stage !== "make-decision" || identity.subject_kind !== "worktree"
        || identity.phase_id !== null || identity.review_scope !== null) return null;
    if (identity.review_track === "direction") return 6;
    if (identity.review_track === "detail") return 10;
    return null;
  };
  const assertReviewFlowReady = (value) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    const stepId = makeDecisionReviewStepId(identity);
    if (stepId === null) return null;
    const active = activeStageRun("make-decision", { required: false });
    // Legacy review-only fixtures and historical roots may predate explicit
    // Stage runs. They stay readable, but cannot satisfy a later official run.
    // The review flow itself is keyed by current material/snapshot, not by a
    // historical run or accepted stage.
    if (active === null) return null;
    if (!completedMakeDecisionDependency(active.run.workflow_run_id, stepId - 1)) {
      throw new Error(`make-decision review step ${stepId} requires successful step ${stepId - 1}`);
    }
    return stepId;
  };
  const completeMakeDecisionReviewStep = (identity, stepId, evidence) => {
    if (stepId === null) return;
    completeMakeDecisionStageStep({
      step_id: stepId,
      entry_evidence: evidence,
      completion_evidence: evidence,
    });
  };
  const advanceReviewFlow = (value, update = {}) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    plain(update, "review flow update");
    rejectUnknown(update, new Set(["expected_head_ref", "expected_event_ref", "result_ref"]), "review flow update");
    const resultRef = nonemptyString(update.result_ref, "review flow result_ref");
    if (!RESULT_REF_FOR_FLOW.test(resultRef)) throw new TypeError("review flow result_ref must be canonical");
    const flowId = reviewFlowId(identity);
    return task.withRecordLock(`locks/review-flows/${flowId}.lock`, () => {
      const current = readReviewFlow(identity);
      const makeDecisionStepId = assertReviewFlowReady(identity);
      if (Object.prototype.hasOwnProperty.call(update, "expected_head_ref")
          && update.expected_head_ref !== (current?.head_result_ref ?? null)) {
        throw new Error("review flow CAS failed: previous_result_ref is stale or belongs to another flow");
      }
      if (Object.prototype.hasOwnProperty.call(update, "expected_event_ref")
          && update.expected_event_ref !== (current?.event_ref ?? null)) {
        throw new Error("review flow CAS failed: expected flow event is stale");
      }
      if (current?.head_result_ref === resultRef) {
        let progressEvent = current;
        if (current.event_kind !== "semantic_result") {
          const semanticRef = [...task.listCanonicalReviewFlowEventRefs(flowId)].reverse().find((ref) => {
            const event = parseJson(task.readRecord(ref), "review flow progress event");
            return event.event_kind === "semantic_result" && event.head_result_ref === resultRef;
          });
          if (semanticRef === undefined) throw new Error("review flow semantic progress event is missing");
          progressEvent = parseJson(task.readRecord(semanticRef), "review flow progress event");
        }
        completeMakeDecisionReviewStep(identity, makeDecisionStepId, {
          kind: "review_flow",
          uri_or_path: progressEvent.event_ref,
          content_hash: hash(task.readRecord(progressEvent.event_ref)),
        });
        return current;
      }
      const lineageCurrent = current;
      let raw; let result;
      try { raw = task.readRecord(resultRef); result = parseJson(raw, "review flow semantic result"); }
      catch (error) { throw new Error(`review flow result cannot be read: ${error.message}`); }
      if (result?.version !== "wh-review-result.v1" || result.task_id !== identity.task_id
          || result.stage !== identity.stage || (result.review_track ?? null) !== identity.review_track
          || result.subject_kind !== identity.subject_kind || (result.phase_id ?? null) !== identity.phase_id
          || (result.review_scope ?? null) !== identity.review_scope
          || (identity.snapshot_tree !== undefined && result.snapshot_tree !== identity.snapshot_tree)
          || !["pass", "revise_required"].includes(result.verdict)
          || !Array.isArray(result.provider_results)) {
        throw new Error("review flow result is non-semantic or does not match the authenticated flow");
      }
      const chain = result.review_chain ?? null;
      const round = chain?.round ?? (lineageCurrent === null ? "initial" : null);
      if (!["initial", "closure", "full", "legacy"].includes(round)) {
        throw new Error("review flow result has no valid canonical round");
      }
      let externalLineageRoot = null;
      if (lineageCurrent?.head_result_ref == null) {
        const snapshotScopedPhase = identity.stage === "build-code" && identity.subject_kind === "phase"
          && identity.snapshot_tree !== undefined;
        const externalParent = snapshotScopedPhase && chain
          && ["initial", "full"].includes(round) && RESULT_REF_FOR_FLOW.test(chain.parent_result_ref ?? "")
          && RESULT_REF_FOR_FLOW.test(chain.root_result_ref ?? "") && HASH.test(chain.response_ledger_sha256 ?? "");
        if (externalParent) {
          let parent;
          try { parent = parseJson(task.readRecord(chain.parent_result_ref), "external Phase review parent"); }
          catch (error) { throw new Error(`external Phase review parent is invalid: ${error.message}`); }
          const expectedRoot = parent.review_chain?.root_result_ref ?? chain.parent_result_ref;
          if (parent.version !== "wh-review-result.v1" || parent.task_id !== identity.task_id
              || parent.stage !== identity.stage || parent.subject_kind !== "phase"
              || parent.phase_id !== identity.phase_id || parent.review_scope !== "phase"
              || parent.snapshot_tree === identity.snapshot_tree || chain.root_result_ref !== expectedRoot
              || chain.prior_snapshot_tree !== parent.snapshot_tree
              || chain.current_snapshot_tree !== identity.snapshot_tree) {
            throw new Error("external Phase review lineage does not match the snapshot-scoped flow");
          }
          externalLineageRoot = expectedRoot;
        } else if (!["initial", "legacy"].includes(round)
            || (chain && (chain.parent_result_ref !== null || chain.root_result_ref !== null))) {
          throw new Error("review flow initial result attempts to create a second root");
        }
      } else if (!["closure", "full"].includes(round) || !chain
          || chain.parent_result_ref !== lineageCurrent.head_result_ref || chain.root_result_ref !== lineageCurrent.root_result_ref) {
        throw new Error("review flow result parent/root does not match the unique current head");
      }
      const structuralFullReviews = (lineageCurrent?.structural_full_reviews ?? 0) + (round === "full" ? 1 : 0);
      if (identity.stage !== "build-code" && structuralFullReviews > 1) {
        throw new Error("review flow structural full-review budget is already exhausted");
      }
      const sequence = (current?.sequence ?? 0) + 1;
      const eventRef = `reviews/flows/${flowId}/event-${String(sequence).padStart(4, "0")}.json`;
      const event = {
        version: "wh-review-flow-event.v1",
        event_kind: "semantic_result",
        flow_id: flowId,
        identity,
        sequence,
        event_ref: eventRef,
        previous_event_ref: current?.event_ref ?? null,
        root_result_ref: lineageCurrent?.root_result_ref ?? externalLineageRoot ?? resultRef,
        previous_head_ref: current?.head_result_ref ?? null,
        head_result_ref: resultRef,
        result_sha256: hash(raw),
        verdict: result.verdict,
        round,
        semantic_result_count: (lineageCurrent?.semantic_result_count ?? 0) + 1,
        structural_full_reviews: structuralFullReviews,
        provider_calls: (lineageCurrent?.provider_calls ?? 0) + (() => {
          if (!ATTEMPT_REF_FOR_FLOW.test(result.attempt_ref ?? "")) return result.provider_results.length;
          try {
            const attempt = parseJson(task.readRecord(result.attempt_ref), "review flow semantic attempt");
            return Array.isArray(attempt.provider_attempts) ? attempt.provider_attempts.length : result.provider_results.length;
          } catch { return result.provider_results.length; }
        })(),
        recorded_at: now(),
      };
      createKernelRecord(eventRef, `${JSON.stringify(event, null, 2)}\n`);
      completeMakeDecisionReviewStep(identity, makeDecisionStepId, {
        kind: "review_flow",
        uri_or_path: eventRef,
        content_hash: hash(task.readRecord(eventRef)),
      });
      return deepFreeze(event);
    });
  };
  const recordReviewAttempt = (value, update = {}) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    plain(update, "review flow attempt update");
    rejectUnknown(update, new Set(["expected_head_ref", "expected_event_ref", "attempt_ref"]), "review flow attempt update");
    const attemptRef = nonemptyString(update.attempt_ref, "review flow attempt_ref");
    if (!ATTEMPT_REF_FOR_FLOW.test(attemptRef)) throw new TypeError("review flow attempt_ref must be canonical");
    const flowId = reviewFlowId(identity);
    return task.withRecordLock(`locks/review-flows/${flowId}.lock`, () => {
      const current = readReviewFlow(identity);
      const makeDecisionStepId = assertReviewFlowReady(identity);
      if (current?.event_kind === "provider_attempt" && current.action_ref === attemptRef) {
        completeMakeDecisionReviewStep(identity, makeDecisionStepId, {
          kind: "review_flow",
          uri_or_path: current.event_ref,
          content_hash: hash(task.readRecord(current.event_ref)),
        });
        return current;
      }
      if (update.expected_head_ref !== (current?.head_result_ref ?? null)
          || update.expected_event_ref !== (current?.event_ref ?? null)) {
        throw new Error("review flow CAS failed: provider attempt target is stale");
      }
      const raw = task.readRecord(attemptRef);
      const attempt = parseJson(raw, "review flow unavailable attempt");
      if (attempt?.version !== "wh-review-attempt.v1" || attempt.task_id !== identity.task_id
          || attempt.stage !== identity.stage || (attempt.review_track ?? null) !== identity.review_track
          || attempt.subject_kind !== identity.subject_kind || (attempt.phase_id ?? null) !== identity.phase_id
          || (attempt.review_scope ?? null) !== identity.review_scope || attempt.terminal_status !== "unavailable"
          || !Array.isArray(attempt.provider_attempts)) {
        throw new Error("review flow attempt is not an authenticated unavailable provider attempt");
      }
      const sequence = (current?.sequence ?? 0) + 1;
      const eventRef = `reviews/flows/${flowId}/event-${String(sequence).padStart(4, "0")}.json`;
      const event = {
        version: "wh-review-flow-event.v1", event_kind: "provider_attempt", flow_id: flowId, identity,
        sequence, event_ref: eventRef, previous_event_ref: current?.event_ref ?? null,
        action_ref: attemptRef, action_sha256: hash(raw),
        root_result_ref: current?.root_result_ref ?? null, previous_head_ref: current?.head_result_ref ?? null,
        head_result_ref: current?.head_result_ref ?? null, result_sha256: current?.result_sha256 ?? null,
        verdict: current?.verdict ?? null, round: attempt.review_chain?.round ?? "legacy",
        semantic_result_count: current?.semantic_result_count ?? 0,
        structural_full_reviews: current?.structural_full_reviews ?? 0,
        provider_calls: (current?.provider_calls ?? 0) + attempt.provider_attempts.length,
        recorded_at: now(),
      };
      createKernelRecord(eventRef, `${JSON.stringify(event, null, 2)}\n`);
      completeMakeDecisionReviewStep(identity, makeDecisionStepId, {
        kind: "review_flow",
        uri_or_path: eventRef,
        content_hash: hash(task.readRecord(eventRef)),
      });
      return deepFreeze(event);
    });
  };
  const recordReviewResolution = (value, update = {}) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    plain(update, "review flow resolution update");
    rejectUnknown(update, new Set(["expected_head_ref", "expected_event_ref", "resolution"]), "review flow resolution update");
    const resolution = plain(update.resolution, "review flow resolution");
    validateSchema("resolution", resolution);
    const canonical = canonicalJson(resolution);
    const resolutionRef = `reviews/resolutions/${hash(canonical)}.json`;
    const raw = `${JSON.stringify(resolution, null, 2)}\n`;
    const flowId = reviewFlowId(identity);
    const recorded = task.withRecordLock(`locks/review-flows/${flowId}.lock`, () => {
      const current = readReviewFlow(identity);
      if (current?.event_kind === "resolution" && current.action_ref === resolutionRef) {
        return deepFreeze({ resolution_ref: resolutionRef, flow: current });
      }
      if (update.expected_head_ref !== (current?.head_result_ref ?? null)
          || update.expected_event_ref !== (current?.event_ref ?? null)) {
        throw new Error("review flow CAS failed: resolution target is stale");
      }
      if (!current?.head_result_ref || resolution.task_id !== identity.task_id
          || resolution.stage !== identity.stage || (resolution.review_track ?? null) !== identity.review_track
          || resolution.previous_result_ref !== current.head_result_ref
          || resolution.previous_result_sha256 !== current.result_sha256) {
        throw new Error("review flow resolution does not bind the authenticated semantic head");
      }
      if (resolution.evidence_state === "verified"
          && resolution.previous_snapshot_tree !== resolution.snapshot_tree) {
        const expectedClassification = deriveChangeClassification({
          previousSnapshotTree: resolution.previous_snapshot_tree,
          currentSnapshotTree: resolution.snapshot_tree,
          previousManifest: resolution.change_classification?.previous_manifest ?? null,
          currentManifest: resolution.change_classification?.current_manifest,
        });
        if (canonicalJson(resolution.change_classification) !== canonicalJson(expectedClassification)) {
          throw new Error("verified review resolution change classification is not machine-derived from the frozen diff");
        }
      }
      try {
        const existingRaw = task.readRecord(resolutionRef);
        if (existingRaw !== raw) throw new Error("canonical review resolution collision");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        createKernelRecord(resolutionRef, raw);
      }
      const sequence = current.sequence + 1;
      const eventRef = `reviews/flows/${flowId}/event-${String(sequence).padStart(4, "0")}.json`;
      const event = {
        version: "wh-review-flow-event.v1", event_kind: "resolution", flow_id: flowId, identity,
        sequence, event_ref: eventRef, previous_event_ref: current.event_ref,
        action_ref: resolutionRef, action_sha256: hash(raw),
        root_result_ref: current.root_result_ref, previous_head_ref: current.head_result_ref,
        head_result_ref: current.head_result_ref, result_sha256: current.result_sha256,
        verdict: current.verdict, round: current.round,
        semantic_result_count: current.semantic_result_count,
        structural_full_reviews: current.structural_full_reviews,
        provider_calls: current.provider_calls,
        recorded_at: now(),
      };
      createKernelRecord(eventRef, `${JSON.stringify(event, null, 2)}\n`);
      return deepFreeze({ resolution_ref: resolutionRef, flow: event });
    });
    return recorded;
  };
  const deriveBaseReviewFlowIdentity = (value) => {
    plain(value, "review flow subject");
    rejectUnknown(value, new Set([
      "stage", "review_track", "subject_kind", "phase_id", "review_scope", "snapshot_tree",
    ]), "review flow subject");
    const stage = stageName(value.stage);
    // Review identity is derived from the live material revision and the
    // reviewed snapshot. Accepted attempts and historical review records are
    // readable audit history; none authorise or block a new current-state
    // review.
    const currentMaterial = readVerifiedCurrentMaterialRevision();
    const activeWorkspace = candidate ?? workspace;
    const liveSnapshot = activeWorkspace
      ? (typeof activeWorkspace.captureSnapshot === "function"
        ? activeWorkspace.captureSnapshot()
        : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot))
      : null;
    const reviewedTree = value.snapshot_tree ?? liveSnapshot?.tree ?? "unbound";
    const materialId = currentMaterial?.revision_id ?? "legacy";
    const workflowRunId = `current:${stage}:${materialId}:${reviewedTree}`;
    return normalizeReviewFlowIdentity(task, { ...value, workflow_run_id: workflowRunId });
  };
  const deriveReviewFlowIdentity = (value) => deriveBaseReviewFlowIdentity(value);
  const adoptLegacyReviewRoot = (update = {}) => {
    plain(update, "legacy review adoption");
    rejectUnknown(update, new Set(["result_ref"]), "legacy review adoption");
    const resultRef = nonemptyString(update.result_ref, "legacy review result_ref");
    if (!RESULT_REF_FOR_FLOW.test(resultRef)) throw new TypeError("legacy review result_ref must be canonical");
    let result;
    try {
      result = parseJson(task.readRecord(resultRef), "legacy review result");
      validateSchema("result", result);
    } catch (error) {
      throw new Error(`legacy review result is invalid: ${error.message}`);
    }
    const subject = {
      stage: result.stage,
      review_track: result.review_track ?? null,
      subject_kind: result.subject_kind,
      phase_id: result.phase_id ?? null,
      review_scope: result.review_scope ?? null,
    };
    const identity = deriveReviewFlowIdentity(subject);
    return task.withRecordLock(`locks/review-flow-execution/${reviewFlowId(identity)}.lock`, () => {
      const current = readReviewFlow(identity);
      if (current?.root_result_ref === resultRef && current.head_result_ref === resultRef
          && current.sequence === 1 && current.event_kind === "semantic_result") return current;
      if (current !== null) throw new Error("legacy review adoption requires an empty review flow");
      try {
        readAcceptedLocal(result.stage, { allowLegacyBuildCode: result.stage === "build-code" });
        throw new Error("legacy review adoption requires an open, unaccepted stage");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const chain = result.review_chain;
      if (result.task_id !== identity.task_id || result.stage !== identity.stage
          || (result.review_track ?? null) !== identity.review_track
          || result.subject_kind !== identity.subject_kind
          || (result.phase_id ?? null) !== identity.phase_id
          || (result.review_scope ?? null) !== identity.review_scope
          || chain?.version !== "wh-review-chain.v1" || chain.round !== "initial"
          || chain.parent_result_ref !== null || chain.root_result_ref !== null
          || chain.prior_snapshot_tree !== null || chain.response_ledger_sha256 !== null
          || chain.current_snapshot_tree !== result.snapshot_tree
          || !HASH.test(chain.source_diff_sha256 ?? "")) {
        throw new Error("legacy review adoption accepts only a canonical semantic initial result");
      }
      const attemptMatch = String(result.attempt_ref ?? "").match(/^reviews\/attempts\/([A-Za-z0-9][A-Za-z0-9._-]*)\/attempt\.json$/);
      if (!attemptMatch) throw new Error("legacy review result attempt_ref is not canonical");
      let attempt;
      try {
        attempt = parseJson(task.readRecord(result.attempt_ref), "legacy review attempt");
        validateSchema("attempt", attempt);
      } catch (error) {
        throw new Error(`legacy review attempt is invalid: ${error.message}`);
      }
      const matchingFields = [
        "task_id", "stage", "review_track", "subject_kind", "phase_id", "review_scope",
        "source", "snapshot_tree", "material_id", "base_tree", "candidate_tree",
        "review_chain", "classification_manifest", "report_ref",
      ];
      if (attempt.attempt_id !== attemptMatch[1] || attempt.terminal_status !== "semantic"
          || attempt.error !== null
          || matchingFields.some((field) => canonicalJson(attempt[field] ?? null) !== canonicalJson(result[field] ?? null))) {
        throw new Error("legacy review attempt and result identities differ");
      }
      const outputPrefix = `reviews/attempts/${attempt.attempt_id}/providers/`;
      const providerOutputs = [];
      for (const providerAttempt of attempt.provider_attempts) {
        if (providerAttempt.output_ref === null) {
          if (providerAttempt.status === "completed") {
            throw new Error("completed legacy provider attempt has no canonical output");
          }
          continue;
        }
        if (!providerAttempt.output_ref.startsWith(outputPrefix)
            || !/^[A-Za-z0-9._-]+\.output\.json$/.test(providerAttempt.output_ref.slice(outputPrefix.length))) {
          throw new Error("legacy review provider output is outside its canonical attempt");
        }
        let output; let parsed = null;
        try {
          output = parseJson(task.readRecord(providerAttempt.output_ref), "legacy review provider output");
          if (typeof output.content === "string") {
            try { parsed = parseCanonicalReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined }); } catch { parsed = null; }
          }
        } catch (error) {
          throw new Error(`legacy review provider output is invalid: ${error.message}`);
        }
        if (output.schema_version !== "wh-review-provider-output.v1"
            || output.task_id !== identity.task_id || output.stage !== identity.stage
            || output.attempt_id !== attempt.attempt_id || output.provider !== providerAttempt.provider
            || typeof output.content !== "string" || output.content_hash !== hash(output.content)) {
          throw new Error("legacy review provider output does not match its attempt or content hash");
        }
        if (providerAttempt.status !== "completed" && parsed !== null) {
          throw new Error("failed legacy provider attempt contains a semantic review");
        }
        if (parsed !== null) providerOutputs.push({
          ref: providerAttempt.output_ref,
          provider: providerAttempt.provider,
          review: parsed,
        });
      }
      // Historical bootstrap attempts did not persist a replayable anchor
      // attestation. Adoption must not trust result-owned anchor flags, so an
      // unverifiable anchor is deterministically downgraded before the same
      // canonical aggregation and exact comparison used by normal review.
      authenticateCanonicalReviewResult({
        attempt,
        result,
        providerOutputs,
        ...(!Object.hasOwn(attempt, "evidence_anchor_attestation")
          ? { assess: conservativelyAssessUnattestedAnchors }
          : {}),
      });
      for (const ref of task.listCanonicalReviewResultRefs()) {
        let candidate;
        try { candidate = parseJson(task.readRecord(ref), `legacy review candidate ${ref}`); }
        catch (error) { throw new Error(`legacy review candidate is unreadable: ${ref}: ${error.message}`); }
        const sameSubject = candidate.task_id === identity.task_id && candidate.stage === identity.stage
          && (candidate.review_track ?? null) === identity.review_track
          && candidate.subject_kind === identity.subject_kind
          && (candidate.phase_id ?? null) === identity.phase_id
          && (candidate.review_scope ?? null) === identity.review_scope;
        if (!sameSubject) continue;
        try { validateSchema("result", candidate); }
        catch (error) { throw new Error(`same-subject legacy review result is invalid: ${ref}: ${error.message}`); }
        if (!["pass", "revise_required"].includes(candidate.verdict)) continue;
        if (ref !== resultRef) throw new Error("legacy review adoption is ambiguous or stale: multiple same-subject semantic results exist");
      }
      return advanceReviewFlow(identity, {
        expected_head_ref: null,
        expected_event_ref: null,
        result_ref: resultRef,
      });
    });
  };
  const kernel = {
    task,
    publishStageSkillInvocation(fact) {
      assertRuntimeStageSkillInvocation(fact);
      if (fact?.task_id !== task.identity.taskId) throw new Error("stage skill invocation task identity mismatch");
      const active = activeStageRun(fact.stage);
      if (fact.workflow_run_id !== active.run.workflow_run_id) throw new Error("stage skill invocation run identity mismatch");
      const ref = stageSkillInvocationRef(fact);
      // A host failure is a truthful, immutable observation, but it must not
      // permanently consume the logical invocation identity.  A later retry
      // with the same input may succeed after the provider recovers.  Keep the
      // original unavailable fact and publish the successful retry at a
      // deterministic sibling ref; readers resolve the sibling as the current
      // state without rewriting history.
      const retryRef = `${ref}.retry.json`;
      const raw = serializeStageSkillInvocation(fact);
      try {
        createKernelRecord(ref, raw);
        return deepFreeze({ ref, hash: hash(raw), fact });
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        const existingRaw = task.readRecord(ref);
        const existing = parseJson(existingRaw, "stage skill invocation");
        const semantic = ({ created_at, ...value }) => value;
        if (JSON.stringify(semantic(existing)) !== JSON.stringify(semantic(fact))) {
          if (existing.status === "unavailable" && fact.status === "executed") {
            try {
              createKernelRecord(retryRef, raw);
              return deepFreeze({ ref: retryRef, hash: hash(raw), fact, retried: true, previous_ref: ref });
            } catch (retryError) {
              if (retryError?.code !== "EEXIST") throw retryError;
              const retryRaw = task.readRecord(retryRef);
              const retried = parseJson(retryRaw, "stage skill invocation retry");
              if (JSON.stringify(semantic(retried)) !== JSON.stringify(semantic(fact))) {
                throw new Error("stage skill invocation retry identity already binds a different fact");
              }
              return deepFreeze({ ref: retryRef, hash: hash(retryRaw), fact: retried, retried: true, idempotent: true, previous_ref: ref });
            }
          }
          throw new Error("stage skill invocation identity already binds a different fact");
        }
        return deepFreeze({ ref, hash: hash(existingRaw), fact: existing, idempotent: true });
      }
    },
    readStageSkillInvocation(stage, name, invocationKey = "default") {
      const active = activeStageRun(stage);
      const ref = stageSkillInvocationRef({
        task_id: task.identity.taskId,
        workflow_run_id: active.run.workflow_run_id,
        stage,
        name,
        invocation_key: invocationKey,
      });
      try {
        const base = parseJson(task.readRecord(ref), "stage skill invocation");
        if (base.status === "unavailable") {
          try {
            const retryRaw = task.readRecord(`${ref}.retry.json`);
            return deepFreeze({ ref: `${ref}.retry.json`, fact: parseJson(retryRaw, "stage skill invocation retry"), previous_ref: ref });
          } catch (retryError) {
            if (retryError?.code !== "ENOENT") throw retryError;
          }
        }
        return deepFreeze({ ref, fact: base });
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    publishCanonicalRecord(relativePath, data) {
      if (typeof relativePath !== "string"
          || !/^(?:receipts|reviews|evidence)\//.test(relativePath)
          || relativePath.includes("..")) throw new Error("canonical receipt namespace required");
      if (relativePath.startsWith("reviews/flows/")) throw new Error("review flow records require TaskKernel review-flow authority");
      if (relativePath.startsWith("reviews/resolutions/")) throw new Error("review resolutions require TaskKernel review-flow authority");
      if (relativePath.startsWith("evidence/risk-acceptances/")) throw new Error("risk acceptance records require TaskKernel review-risk authority");
      return createKernelRecord(relativePath, data);
    },
    replaceStageContentLatestPointer(relativePath, data, options) {
      if (typeof replaceStageContentPointer !== "function") throw new Error("stage content pointer replacement authority is required");
      return replaceStageContentPointer(relativePath, data, options);
    },
    readReviewFlow,
    readReviewFlowHistory,
    assertReviewFlowReady,
    advanceReviewFlow,
    recordReviewAttempt,
    recordReviewResolution,
    startStageRun,
    activeStageRun,
    latestHistoricalStageRun,
    publishRequirementsLedger,
    publishMaterialRevision,
    repairMaterialRevision,
    writeStageStepEntry,
    writeStageStepExit,
    prepareMakeDecisionInteractionPublication,
    completeMakeDecisionInteractionPublication,
    completeMakeDecisionResearch,
    completeMakeDecisionReceipt,
    completeBuildSpecResultPublication,
    publishBuildSpecCompletionAudit,
    readBuildSpecCompletionAudit,
    deriveStageWorkflowRunId,
    deriveReviewFlowIdentity,
    adoptLegacyReviewRoot,
    withReviewFlowLock(value, operation) {
      if (typeof operation !== "function") throw new TypeError("review flow operation must be a function");
      const identity = normalizeReviewFlowIdentity(task, value);
      return task.withRecordLock(`locks/review-flow-execution/${reviewFlowId(identity)}.lock`, operation);
    },
    createCheckpoint(stage, options = {}) {
      if (!workspace || !artifacts) throw new Error("Git checkpoint requires Workspace and ArtifactDir capabilities");
      const name = stageName(stage);
      if (Object.keys(options).length) throw new Error("unsupported checkpoint options");
      return createGitCheckpoint({ workspace, artifacts, task, stage: name, ...currentCheckpointBase(name) });
    },
    prepareReviewRiskPause({
      stage,
      reviewResultRef,
    } = {}) {
      const name = stageName(stage);
      if (!RESULT_REF_FOR_FLOW.test(reviewResultRef ?? "")) throw new TypeError("review risk pause result ref is invalid");
      const raw = task.readRecord(reviewResultRef);
      const result = parseJson(raw, "review risk result");
      validateSchema("result", result);
      if (result.task_id !== task.identity.taskId || result.stage !== name) {
        throw new Error("review risk result task/stage mismatch");
      }
      const subject = {
        stage: name,
        review_track: result.review_track ?? null,
        subject_kind: result.subject_kind,
        phase_id: result.phase_id ?? null,
        review_scope: result.review_scope ?? null,
        ...(name === "build-code" && result.subject_kind === "phase" ? { snapshot_tree: result.snapshot_tree } : {}),
      };
      const identity = deriveReviewFlowIdentity(subject);
      const flow = readReviewFlow(identity);
      if (!flow || flow.event_kind !== "semantic_result" || flow.head_result_ref !== reviewResultRef
          || flow.result_sha256 !== hash(raw)) {
        throw new Error("review risk result is not the authenticated review-flow head");
      }
      const activeWorkspace = candidate ?? workspace;
      if (!activeWorkspace) throw new Error("review risk pause requires an active Workspace");
      const snapshot = typeof activeWorkspace.captureSnapshot === "function"
        ? activeWorkspace.captureSnapshot()
        : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
      if (snapshot.tree !== result.snapshot_tree) {
        throw new Error("review risk result does not bind the live Workspace snapshot");
      }
      const pause = deriveSeriousReviewPause({
        taskId: task.identity.taskId,
        stage: name,
        reviewRef: reviewResultRef,
        reviewHash: hash(raw),
        result,
        workflowRunId: identity.workflow_run_id,
      });
      if (pause.status !== "paused") return pause;
      const findings = pause.findings.map((finding) => {
        const cardRef = `evidence/review-risk-cards/${finding.card_hash}.json`;
        const cardRaw = `${JSON.stringify(finding, null, 2)}\n`;
        try {
          createKernelRecord(cardRef, cardRaw);
        } catch (error) {
          if (error?.code !== "EEXIST" || task.readRecord(cardRef) !== cardRaw) throw error;
        }
        return Object.freeze({ ...finding, card_ref: cardRef });
      });
      return deepFreeze({ ...pause, findings });
    },
    acceptReviewRisk({
      stage,
      reviewResultRef,
      findingId,
      cardRef,
      cardHash,
      selectedOption,
      replyRef,
      replyHash,
    } = {}) {
      const pause = kernel.prepareReviewRiskPause({
        stage,
        reviewResultRef,
      });
      const finding = pause.findings.find(({ finding_id: id }) => id === findingId);
      if (!finding || cardRef !== finding.card_ref || cardHash !== finding.card_hash) {
        throw new Error("risk acceptance card does not bind the canonical pause card");
      }
      const { card_ref: _cardRef, ...canonicalCard } = finding;
      const expectedCardRaw = `${JSON.stringify(canonicalCard, null, 2)}\n`;
      if (task.readRecord(cardRef) !== expectedCardRaw) {
        throw new Error("risk acceptance canonical pause card bytes mismatch");
      }
      if (typeof replyRef !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(replyRef)
          || replyRef.includes("..") || hash(task.readRecord(replyRef)) !== replyHash) {
        throw new Error("risk acceptance reply ref/hash does not bind canonical reply bytes");
      }
      const acceptance = buildRiskAcceptance({
        pause,
        findingId,
        cardRef,
        cardHash,
        selectedOption,
        replyRef,
        replyHash,
        acceptedAt: now(),
      });
      validateRiskAcceptance({ acceptance, pause });
      const raw = `${JSON.stringify(acceptance, null, 2)}\n`;
      const acceptanceHash = hash(raw);
      const acceptanceRef = `evidence/risk-acceptances/${acceptanceHash}.json`;
      try {
        createKernelRecord(acceptanceRef, raw);
      } catch (error) {
        if (error?.code !== "EEXIST" || task.readRecord(acceptanceRef) !== raw) throw error;
      }
      return deepFreeze({
        risk_acceptance_ref: acceptanceRef,
        risk_acceptance_hash: acceptanceHash,
        record: acceptance,
      });
    },
    publishAttempt(stage, data = {}) {
      if (task.manifest.record_model === "vnext-single-write") {
        throw new Error("legacy attempt writer is unavailable for vNext tasks");
      }
      const name = stageName(stage);
      return task.withRecordLock(`locks/${name}.publication.lock`, () => {
        validateRefs(data.upstream_refs ?? [], "upstream_refs");
        if (data.upstream_acceptances !== undefined) throw new Error("upstream_acceptances are kernel-derived and cannot be supplied");
        const missingItems = [...(data.missing_items ?? [])];
        let auditSupportMissing = missingItems.includes("support:audit");
        // Verify audit is diagnostic context, not a publication gate. A
        // verifier may publish a current result without a fresh audit carrier;
        // the missing fact remains visible in the attempt instead of blocking
        // the core test/AC result.
        if (name === "verify-code"
            && AUDIT_FACT_KEYS.every((key) => !Object.prototype.hasOwnProperty.call(data.facts, key))) {
          auditSupportMissing = true;
        }
        if (name === "build-plan" && !auditSupportMissing) {
          try {
            verifyAuditPublication(name, data.facts);
          } catch (error) {
            missingItems.push(`audit unavailable/unverified/mismatch: ${error.message}`, "support:audit");
            for (const key of AUDIT_FACT_KEYS) delete data.facts[key];
            auditSupportMissing = true;
          }
        }
        if (auditSupportMissing
            && AUDIT_FACT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(data.facts, key))) {
          throw new Error(`${name} missing audit support cannot publish unauthenticated audit facts`);
        }
        validateStageFacts(name, data.facts, { allowMissingAuditSupport: auditSupportMissing });
        if (name === "verify-code" && data.facts.browser_qa !== undefined) {
          verifyBrowserQaStageContentBinding(task, workspace, data.facts.browser_qa);
        }
        if (name === "make-decision" && candidate && (resolve(data.facts.worktree_root) !== candidate.worktreeRoot || data.facts.baseline_commit !== candidate.baselineCommit)) {
          throw new Error("make-decision facts do not match CandidateWorkspace");
        }
        if (name === "make-decision") verifyCandidateSnapshot(data.facts);
        if (!auditSupportMissing && !new Set(["build-plan", "verify-code"]).has(name)) verifyAuditPublication(name, data.facts);
        if (["build-spec", "build-plan"].includes(name)) {
          assertGitCheckpointPlan(data.facts.checkpoint);
          verifyGitCheckpointPlan({ workspace, artifacts, task, plan: data.facts.checkpoint, ...currentCheckpointBase(name) });
          if (data.checkpoint !== undefined && data.checkpoint !== data.facts.checkpoint) throw new Error("caller checkpoint override is forbidden");
        }
        for (let sequence = 1; sequence <= 9999; sequence += 1) {
          const filename = `attempt-${String(sequence).padStart(4, "0")}.json`;
          const attempt = {
            schema_version: "task-attempt.v2",
            task_id: task.identity.taskId,
            stage: name,
            attempt_id: `${name}:${filename.slice(0, -5)}`,
            created_at: data.created_at ?? now(),
            ...(name === "build-spec" ? { workflow_run_id: activeStageRun("build-spec").run.workflow_run_id } : {}),
            facts: structuredClone(data.facts),
            evidence_refs: [...(data.evidence_refs ?? [])],
            missing_items: [...missingItems],
            upstream_refs: structuredClone(data.upstream_refs ?? []),
            ...(data.verification_failure ? { verification_failure: true } : {}),
            ...((data.checkpoint ?? data.facts.checkpoint) ? { checkpoint: structuredClone(data.checkpoint ?? data.facts.checkpoint) } : {}),
            ...(data.reason !== undefined ? { reason: String(data.reason) } : {}),
          };
          validateAttempt(attempt, { taskId: task.identity.taskId, stage: name, attemptId: attempt.attempt_id });
          const raw = `${JSON.stringify(attempt, null, 2)}\n`;
          try {
            createKernelRecord(`results/${name}/${filename}`, raw, attemptPublicationTestHooks === undefined ? undefined : { testHooks: attemptPublicationTestHooks });
            return deepFreeze({ attempt_ref: filename, integrity_hash: hash(raw), attempt });
          } catch (error) {
            if (error?.code !== "EEXIST") throw error;
          }
        }
        throw new Error(`${name} attempt sequence exhausted`);
      });
    },
    publishVNextQualityFact,
    publishVNextPublication,
    confirmAttempt(stage, attemptRef, decision) {
      const name = stageName(stage);
      if (!requiresHumanConfirmation(name)) throw new Error(`${name} uses automatic acceptance and does not accept human confirmation`);
      if (!ATTEMPT_REF.test(attemptRef ?? "")) throw new Error("invalid attemptRef");
      if (!new Set(["accepted", "rejected"]).has(decision)) throw new TypeError("explicit confirmation decision must be accepted or rejected");
      const attempt = validateAttempt(parseJson(task.readRecord(`results/${name}/${attemptRef}`), `${name} attempt`), { taskId: task.identity.taskId, stage: name });
      const buildPlanPreAudit = buildPlanPreConfirmationAudit(attempt);
      const ref = `confirmations/${name}/${attemptRef}`;
      return task.withRecordLock(`locks/${name}.publication.lock`, () => {
        let record;
        let raw;
        try {
          raw = task.readRecord(ref);
          record = parseJson(raw, "human confirmation");
          if (record.decision !== decision) throw new Error(`${name} attempt is already confirmed with a different decision`);
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
          record = { schema_version: "human-confirmation.v1", task_id: task.identity.taskId, stage: name, attempt_ref: attemptRef, decision, confirmed_at: now(),
            ...(attempt.checkpoint ? { checkpoint_plan_hash: attempt.checkpoint.plan_hash } : {}) };
          raw = `${JSON.stringify(record, null, 2)}\n`;
          createKernelRecord(ref, raw);
        }
        if (name === "make-decision" && decision === "accepted" && attempt.facts.audit_through_step_id === 10) {
          completeMakeDecisionStageStep({
            step_id: 11,
            entry_evidence: { kind: "stage_attempt", uri_or_path: `results/${name}/${attemptRef}`, content_hash: hash(task.readRecord(`results/${name}/${attemptRef}`)) },
              completion_evidence: { kind: "human_confirmation", uri_or_path: ref, content_hash: hash(raw) },
          });
        } else if (buildPlanPreAudit && decision === "accepted") {
          try {
            completeRuntimeOwnedStageStep("build-plan", {
              step_id: 7,
              entry_evidence: {
                kind: "stage_attempt",
                uri_or_path: `results/${name}/${attemptRef}`,
                content_hash: hash(task.readRecord(`results/${name}/${attemptRef}`)),
              },
              completion_evidence: {
                kind: "human_confirmation",
                uri_or_path: ref,
                content_hash: hash(raw),
              },
            });
          } catch {
            // Build-plan journal support is diagnostic and never authorizes confirmation.
          }
        }
        return deepFreeze({ ref, confirmation: record });
      });
    },
    acceptAttempt(stage, attemptRef, humanConfirmationRef, options = {}) {
      if (arguments.length > 4) throw new TypeError("caller checkpoint override is forbidden; acceptance uses the published attempt checkpoint");
      plain(options, "acceptance options");
      rejectUnknown(options, new Set(["full_audit_writer"]), "acceptance options");
      const name = stageName(stage);
      const acceptanceMode = acceptanceModeFor(name);
      if (acceptanceMode === "automatic" && humanConfirmationRef !== undefined) {
        throw new TypeError(`${name} uses automatic acceptance; omit humanConfirmationRef`);
      }
      if (acceptanceMode === "human" && (typeof humanConfirmationRef !== "string" || humanConfirmationRef.trim() === "")) {
        throw new TypeError(`${name} requires explicit humanConfirmationRef`);
      }
      const acceptWithStageLock = () => task.withRecordLock(`locks/${name}.publication.lock`, () => {
        if (!ATTEMPT_REF.test(attemptRef ?? "")) throw new Error("invalid attemptRef");
        const attemptRaw = task.readRecord(`results/${name}/${attemptRef}`);
        const attempt = validateAttempt(parseJson(attemptRaw, `${name} attempt`), { taskId: task.identity.taskId, stage: name });
        const buildPlanPreAudit = buildPlanPreConfirmationAudit(attempt);
        let fullAudit;
        let fullAuditVerdict;
        if (name === "verify-code" && attempt.verification_failure === true) {
          throw new Error("cannot accept a failed verify-code attempt");
        }
        const readAndValidateConfirmation = (expectedRaw) => {
          const raw = task.readRecord(humanConfirmationRef);
          if (expectedRaw !== undefined && raw !== expectedRaw) throw new Error("human confirmation changed during acceptance");
          const value = parseJson(raw, "human confirmation");
          if (value.decision === "rejected") throw new Error("rejected confirmation leaves checkpoint ref unpublished");
          validateHumanConfirmation(value, {
            taskId: task.identity.taskId, stage: name, subject: attemptRef, requireAccepted: true,
          });
          return { raw, value };
        };
        let current;
        try { current = readAcceptedLocal(name, { liveCheckpoint: false }); }
        catch (error) { if (error?.code !== "ENOENT") throw error; }
        if (name === "make-decision" && current?.accepted.attempt_ref === attemptRef) {
          if (current.accepted.human_confirmation_ref !== humanConfirmationRef) {
            throw new Error("make-decision attempt is already accepted with different final bindings");
          }
          readAndValidateConfirmation();
          return current.accepted;
        }
        if (name === "make-decision" && candidate) {
          if (resolve(attempt.facts.worktree_root) !== candidate.worktreeRoot || attempt.facts.baseline_commit !== candidate.baselineCommit) {
            throw new Error("make-decision facts do not match CandidateWorkspace");
          }
          verifyCandidateSnapshot(attempt.facts);
        }
        if (name === "make-decision") verifyMakeDecisionCore(attempt);
        let confirmation;
        let confirmationRaw;
        if (acceptanceMode === "human") {
          const validatedConfirmation = readAndValidateConfirmation();
          confirmation = validatedConfirmation.value;
          confirmationRaw = validatedConfirmation.raw;
        }
        if (name === "make-decision" && attempt.facts.audit_through_step_id === 10) {
          if (typeof options.full_audit_writer !== "function") {
            throw new Error("make-decision acceptance requires the runtime-owned full audit writer");
          }
          completeMakeDecisionStageStep({
            step_id: 12,
            entry_evidence: {
              kind: "human_confirmation",
              uri_or_path: humanConfirmationRef,
              content_hash: hash(confirmationRaw),
            },
            completion_evidence: {
              kind: "stage_attempt",
              uri_or_path: `results/${name}/${attemptRef}`,
              content_hash: hash(attemptRaw),
            },
          });
          fullAudit = plain(options.full_audit_writer(), "make-decision full audit");
          rejectUnknown(fullAudit, new Set(["ref", "hash", "summary_hash"]), "make-decision full audit");
          const auditRaw = task.readRecord(fullAudit.ref);
          const audit = parseJson(auditRaw, "make-decision full audit");
          if (hash(auditRaw) !== fullAudit.hash || audit.summary_hash !== fullAudit.summary_hash
              || !new Set(["pass", "fail"]).has(audit.verdict) || audit.stage_slug !== name
              || audit.task_id !== task.identity.taskId || audit.through_step_id !== 12
              || audit.audit_scope !== "full"
              || audit.snapshot_tree !== attempt.facts.snapshot_tree) {
            throw new Error("make-decision acceptance requires a canonical bound full audit through step 12");
          }
          fullAuditVerdict = audit.verdict;
        } else if (buildPlanPreAudit) {
          try {
            completeRuntimeOwnedStageStep("build-plan", {
              step_id: 8,
              entry_evidence: {
                kind: "human_confirmation",
                uri_or_path: humanConfirmationRef,
                content_hash: hash(confirmationRaw),
              },
              completion_evidence: {
                kind: "stage_attempt",
                uri_or_path: `results/${name}/${attemptRef}`,
                content_hash: hash(attemptRaw),
              },
            });
            options.full_audit_writer?.();
          } catch {
            // Build-plan journal/audit support is diagnostic and never authorizes acceptance.
          }
        } else if (options.full_audit_writer !== undefined) {
          throw new Error("full audit writer is only valid for a bounded human-confirmation attempt");
        }
        let acceptedCheckpoint;
        if (["build-spec", "build-plan"].includes(name)) {
          if (!workspace || !artifacts) throw new Error("accepting a design checkpoint requires Workspace and ArtifactDir capabilities");
          if (acceptanceMode === "human" && confirmation.checkpoint_plan_hash !== attempt.checkpoint.plan_hash) throw new Error("human confirmation checkpoint plan hash mismatch");
          acceptedCheckpoint = materializeGitCheckpoint({ workspace, artifacts, task, plan: attempt.checkpoint, ...currentCheckpointBase(name), publishRef: (ref, commit, zeroOid) => {
            execFileSync("git", ["update-ref", ref, commit, zeroOid], { cwd: workspace.worktreeRoot, stdio: "ignore" });
          } });
          execFileSync("git", ["merge-base", "--is-ancestor", attempt.checkpoint.parent_commit, acceptedCheckpoint.commit_oid], { cwd: workspace.worktreeRoot, stdio: "ignore" });
        }
        let canonicalRef;
        let priorRaw;
        let archiveRef;
        if (current) {
          if (typeof replaceKernelAccepted !== "function") throw new Error("kernel canonical accepted replacement authority is required");
          canonicalRef = `results/${name}/accepted.json`;
          priorRaw = task.readRecord(canonicalRef);
          archiveRef = `results/${name}/${archivedAcceptedFileFor(current.accepted.attempt_ref)}`;
          try {
            if (task.readRecord(archiveRef) !== priorRaw) archiveRef = `results/${name}/${collisionArchiveFileFor(current.accepted.attempt_ref, priorRaw)}`;
          } catch (error) {
            if (error?.code !== "ENOENT") throw error;
          }
          try {
            if (task.readRecord(archiveRef) !== priorRaw) throw new Error(`${name} accepted collision archive conflicts with canonical record`);
          } catch (error) {
            if (error?.code !== "ENOENT") throw error;
          }
        }
        const accepted = {
          schema_version: "task-accepted.v2",
          task_id: task.identity.taskId,
          stage: name,
          attempt_ref: attemptRef,
          integrity_hash: hash(attemptRaw),
          acceptance_mode: acceptanceMode,
          ...(acceptanceMode === "human" ? { human_confirmation_ref: humanConfirmationRef } : {}),
          ...(fullAudit ? {
            full_audit_ref: fullAudit.ref,
            full_audit_hash: fullAudit.hash,
            full_audit_summary_hash: fullAudit.summary_hash,
            full_audit_verdict: fullAuditVerdict,
          } : {}),
          accepted_at: now(),
          upstream_refs: structuredClone(attempt.upstream_refs),
          ...(acceptedCheckpoint ? { checkpoint: structuredClone(acceptedCheckpoint) } : {}),
        };
        validateAccepted(accepted, { taskId: task.identity.taskId, stage: name });
        const acceptedRaw = `${JSON.stringify(accepted, null, 2)}\n`;
        if (!current) {
          createKernelRecord(`results/${name}/accepted.json`, acceptedRaw);
          return deepFreeze(accepted);
        }
        const replacementOptions = {
          ...(acceptedReplacementTestHooks === undefined ? {} : { testHooks: acceptedReplacementTestHooks }),
          archiveRef,
          archiveRaw: priorRaw,
        };
        replaceKernelAccepted(canonicalRef, acceptedRaw, replacementOptions);
        return deepFreeze(accepted);
      });
      const acceptWithRelatedStageLocks = () => name === "verify-code"
        ? task.withRecordLock("locks/build-code.publication.lock", acceptWithStageLock)
        : acceptWithStageLock();
      return ["build-spec", "build-plan", "build-code", "verify-code"].includes(name)
        ? task.withRecordLock("locks/design-lineage.publication.lock", acceptWithRelatedStageLocks)
        : acceptWithRelatedStageLocks();
    },
    readAccepted(stage, options) {
      if (options?.liveCheckpoint !== undefined) throw new Error("accepted reads are historical and do not compare live materials");
      return readAcceptedLocal(stage, options);
    },
    readAcceptedAudit(stage, options = {}) {
      if (Object.prototype.hasOwnProperty.call(options, "liveCheckpoint")) {
        throw new Error("accepted audit reads do not accept live checkpoint controls");
      }
      return readAcceptedLocal(stage, options);
    },
    readInput(slot) {
      const stage = INPUT_STAGES[slot];
      if (!stage || !Object.prototype.hasOwnProperty.call(task.manifest.inputs ?? {}, slot)) {
        throw new Error(`unknown or undeclared input slot: ${slot}`);
      }
      const acceptedPath = task.manifest.inputs[slot];
      absoluteString(acceptedPath, `input ${slot}`);
      const stageDirectory = dirname(acceptedPath);
      const sourceTaskPath = dirname(dirname(stageDirectory));
      const expectedPath = resolve(sourceTaskPath, "results", stage, "accepted.json");
      if (resolve(acceptedPath) !== expectedPath || basename(stageDirectory) !== stage) {
        throw new Error(`input ${slot} must reference accepted ${stage} output`);
      }
      const sourceTaskId = basename(sourceTaskPath);
      const sourceProjectName = basename(dirname(dirname(sourceTaskPath)));
      const sourceTask = openTask(sourceTaskPath, { projectName: sourceProjectName, taskId: sourceTaskId });
      const result = buildTaskKernel(sourceTask, { now }, authority).readAccepted(stage);
      if (["build-spec", "build-plan"].includes(stage)) verifyGitCheckpoint({
        repoRoot: sourceTask.manifest.target_repo_root,
        checkpoint: result.accepted.checkpoint,
        projectName: sourceTask.identity.projectName,
        taskId: sourceTask.identity.taskId,
        stage,
      });
      return result;
    },
    publishInput(slot) {
      throw new Error(`input slot ${slot} is read-only; publishing inputs is unsupported`);
    },
  };
  return kernel;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function readOptionalRecord(task, ref) {
  try { return task.readRecord(ref); }
  catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}
