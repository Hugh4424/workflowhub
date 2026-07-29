import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, resolve } from "node:path";

import { assertGitCheckpointPlan, createGitCheckpoint, materializeGitCheckpoint, overlayCheckpointArtifacts, verifyGitCheckpoint, verifyGitCheckpointPlan } from "./git-checkpoint.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "./stage-acceptance-policy.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";
import { captureGitWorktreeSnapshot, equivalentWorkspaceTrees } from "./git-worktree-snapshot.mjs";
import factsContract from "../contracts/facts-subschema.json" with { type: "json" };
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";
import { deriveChangeClassification } from "../skills/wh-review/scripts/review-controller.mjs";
import {
  authenticateCanonicalReviewResult,
  conservativelyAssessUnattestedAnchors,
  parseCanonicalReviewerOutput,
} from "./canonical-review-result.mjs";
import { hashAuditSummary } from "./audit-summary-carrier.mjs";
import { createRequirementLedger, createRequirementsCoverage } from "./requirement-ledger.mjs";
import { validateEntryPayload, validateExitPayload } from "./receipt-schema.mjs";
import { validateBuildCodeAdjudicationCorrection, validateReviewFlowReset } from "./review-flow-authority.mjs";
import {
  BUILD_SPEC_RECOVERY_REFS,
  buildSpecReviewAction,
  consumeBuildSpecRecoveryOwnerCapability,
  validateBuildSpecBase,
  validateBuildSpecRecoveryInvocation,
  validateBuildSpecRecoveryMarker,
  validateBuildSpecRevision,
} from "./build-spec-receipt-recovery.mjs";
import {
  buildRiskAcceptance,
  deriveSeriousReviewPause,
  validateRiskAcceptance,
  validateRiskAcceptanceSet,
} from "./stage-review-disposition.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const ATTEMPT_REF = /^attempt-([0-9]{4})\.json$/;
const ACCEPTED_FILE = /^accepted(?:-attempt-([0-9]{4}))?\.json$/;
const REOPEN_REF = /^results\/build-code\/revisions\/reopen-([0-9]{4})\.json$/;
const ADJUDICATION_CORRECTION_REF = /^results\/build-code\/revisions\/adjudication-correction-([A-Za-z0-9][A-Za-z0-9._-]*)\.json$/;
const BASELINE_REBIND_REF = /^results\/build-plan\/revisions\/baseline-rebind-([0-9]{4})\.json$/;
const CONTINUATION_REF = /^results\/(make-decision|build-spec|build-plan|build-code|verify-code)\/revisions\/continuation-([0-9]{4})\.json$/;
const HASH = /^[a-f0-9]{64}$/;
const STAGE_CONTENT_REF = /^evidence\/stage-content\/([a-f0-9]{64})\/interaction-completion\.(?:talk-[0-9]{4}|grill|aggregate)\.json$/;
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
const ACCEPTANCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const REQUIRED_FACTS = Object.freeze(Object.fromEntries(
  Object.entries(factsContract.stages).map(([stage, contract]) => [stage, Object.freeze([...contract.required_keys])]),
));
const ALLOWED_FACTS = Object.freeze({
  "make-decision": new Set(["worktree_root", "baseline_commit", "snapshot_tree", "decision", "scope", "risks", "decision_ref", "decision_hash", "reviews", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "audit_through_step_id", "content_evidence_refs"]),
  "build-spec": new Set(["spec_ref", "checkpoint", "review", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
  "build-plan": new Set(["plan_ref", "tasks_ref", "checkpoint", "review", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
  "build-code": new Set(["changed", "tests", "review", "phase_completion", "acceptance_coverage", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
  "verify-code": new Set(["tests", "review", "evidence_refs", "quality_note", "audit_contract_version", "audit_summary_ref", "audit_summary_hash", "audit_verdict", "content_evidence_refs"]),
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
  if (snapshotTree !== null && !(stage === "build-code" && subjectKind === "phase" && reviewScope === "phase" && phaseId !== null)) {
    throw new Error("review flow snapshot_tree is only valid for a build-code Phase");
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

export function validateAcceptanceEvidence(value, label = "acceptance evidence") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!["schema_version", "acceptance_criterion_id", "result", "refs", "snapshot_tree", "summary"].includes(key)) throw new Error(`${label} has unknown field ${key}`);
  if (value.schema_version !== "acceptance-evidence.v1") throw new Error(`${label} schema_version must be acceptance-evidence.v1`);
  if (typeof value.acceptance_criterion_id !== "string" || !ACCEPTANCE_ID.test(value.acceptance_criterion_id)) throw new Error(`${label} acceptance_criterion_id must be stable and non-empty`);
  if (!new Set(["pass", "fail"]).has(value.result)) throw new Error(`${label} result must be pass or fail`);
  if (!Array.isArray(value.refs) || value.refs.length === 0) throw new Error(`${label} refs must be a non-empty array`);
  const refs = value.refs.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some((key) => !["ref", "sha256"].includes(key)) || typeof entry.ref !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(entry.ref) || entry.ref.includes("..") || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new Error(`${label} refs[${index}] must contain canonical ref and sha256`);
    return { ref: entry.ref, sha256: entry.sha256 };
  });
  if (value.snapshot_tree !== undefined && (typeof value.snapshot_tree !== "string" || !GIT_OID.test(value.snapshot_tree))) throw new Error(`${label} snapshot_tree must be a Git tree id`);
  let summary;
  if (value.summary !== undefined) {
    if (!value.summary || typeof value.summary !== "object" || Array.isArray(value.summary)) throw new Error(`${label}.summary must be an object`);
    const fields = ["scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions"];
    for (const key of Object.keys(value.summary)) if (!fields.includes(key)) throw new Error(`${label}.summary has unknown field ${key}`);
    summary = {};
    for (const key of ["scenario", "oracle", "actual_outcome", "evidence_type"]) {
      if (value.summary[key] !== undefined) {
        if (typeof value.summary[key] !== "string" || value.summary[key].trim() === "") throw new Error(`${label}.summary.${key} must be non-empty text`);
        summary[key] = value.summary[key];
      }
    }
    for (const key of ["coverage_limits", "exceptions"]) {
      if (value.summary[key] !== undefined) {
        if (!Array.isArray(value.summary[key]) || value.summary[key].length === 0 || value.summary[key].some((item) => typeof item !== "string" || item.trim() === "")) throw new Error(`${label}.summary.${key} must be a non-empty text array`);
        summary[key] = Object.freeze([...value.summary[key]]);
      }
    }
  }
  return Object.freeze({ schema_version: value.schema_version, acceptance_criterion_id: value.acceptance_criterion_id, result: value.result, refs: Object.freeze(refs), ...(value.snapshot_tree === undefined ? {} : { snapshot_tree: value.snapshot_tree }), ...(summary === undefined ? {} : { summary: Object.freeze(summary) }) });
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

function validateUpstreamAcceptances(entries) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) throw new TypeError("upstream_acceptances must be an array");
  for (const [index, entry] of entries.entries()) {
    plain(entry, `upstream_acceptances[${index}]`);
    rejectUnknown(entry, new Set(["task_id", "stage", "accepted_ref", "integrity_hash"]), `upstream_acceptances[${index}]`);
    nonemptyString(entry.task_id, `upstream_acceptances[${index}].task_id`);
    stageName(entry.stage);
    if (!/^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/accepted(?:-attempt-[0-9]{4})?\.json$/.test(entry.accepted_ref ?? "")) throw new TypeError("upstream acceptance reference invalid");
    if (!HASH.test(entry.integrity_hash ?? "")) throw new TypeError("upstream acceptance integrity_hash must be sha256");
  }
}

function validateReopenProvenance(value) {
  if (value === undefined) return;
  plain(value, "reopen_provenance");
  rejectUnknown(value, new Set(["reopen_ref", "reopen_hash", "previous_accepted_ref", "previous_accepted_hash", "verify_failure_ref", "verify_failure_hash"]), "reopen_provenance");
  if (!REOPEN_REF.test(value.reopen_ref ?? "")) throw new TypeError("reopen_provenance.reopen_ref invalid");
  if (!/^results\/build-code\/accepted(?:-attempt-[0-9]{4})?\.json$/.test(value.previous_accepted_ref ?? "")) throw new TypeError("reopen_provenance.previous_accepted_ref invalid");
  if (!/^results\/verify-code\/attempt-[0-9]{4}\.json$/.test(value.verify_failure_ref ?? "")) throw new TypeError("reopen_provenance.verify_failure_ref invalid");
  for (const key of ["reopen_hash", "previous_accepted_hash", "verify_failure_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`reopen_provenance.${key} must be sha256`);
}

function validateBaselineRebindProvenance(value) {
  if (value === undefined) return;
  plain(value, "baseline_rebind_provenance");
  rejectUnknown(value, new Set(["authorization_ref", "authorization_hash"]), "baseline_rebind_provenance");
  if (!BASELINE_REBIND_REF.test(value.authorization_ref ?? "")) throw new Error("baseline_rebind_provenance.authorization_ref invalid");
  if (!HASH.test(value.authorization_hash ?? "")) throw new Error("baseline_rebind_provenance.authorization_hash invalid");
}

function validateBuildSpecContinuationProvenance(value, { requireArchive = false } = {}) {
  if (value === undefined) return;
  plain(value, "build_spec_continuation_provenance");
  rejectUnknown(value, new Set([
    "continuation_ref", "continuation_hash", "invalidation_ref", "invalidation_hash",
    "previous_accepted_ref", "previous_accepted_hash", "previous_attempt_ref", "previous_attempt_hash",
    "previous_accepted_archive_ref", "previous_accepted_archive_hash",
  ]), "build_spec_continuation_provenance");
  if (!/^results\/build-spec\/revisions\/continuation-[0-9]{4}\.json$/.test(value.continuation_ref ?? "")) {
    throw new Error("build_spec_continuation_provenance.continuation_ref invalid");
  }
  if (!/^results\/build-spec\/invalidations\/[a-f0-9]{64}\.json$/.test(value.invalidation_ref ?? "")) {
    throw new Error("build_spec_continuation_provenance.invalidation_ref invalid");
  }
  if (value.previous_accepted_ref !== "results/build-spec/accepted.json"
      || !/^results\/build-spec\/attempt-[0-9]{4}\.json$/.test(value.previous_attempt_ref ?? "")) {
    throw new Error("build_spec_continuation_provenance previous acceptance binding invalid");
  }
  for (const key of ["continuation_hash", "invalidation_hash", "previous_accepted_hash", "previous_attempt_hash"]) {
    if (!HASH.test(value[key] ?? "")) throw new Error(`build_spec_continuation_provenance.${key} must be sha256`);
  }
  const hasArchive = value.previous_accepted_archive_ref !== undefined || value.previous_accepted_archive_hash !== undefined;
  if (hasArchive && (!/^results\/build-spec\/accepted-attempt-[0-9]{4}(?:-canonical-[a-f0-9]{64})?\.json$/.test(value.previous_accepted_archive_ref ?? "")
      || !HASH.test(value.previous_accepted_archive_hash ?? ""))) {
    throw new Error("build_spec_continuation_provenance archive binding invalid");
  }
  if (requireArchive && !hasArchive) throw new Error("accepted build-spec continuation provenance requires archive binding");
}

function validateVerifyFailurePublication(value) {
  if (value === undefined) return;
  plain(value, "verify_failure_publication");
  rejectUnknown(value, new Set(["previous_accepted_ref", "previous_accepted_hash", "previous_attempt_ref", "previous_attempt_hash", "active_build_accepted_ref", "active_build_accepted_hash", "active_build_attempt_ref", "active_build_attempt_hash", "failure_evidence_ref", "failure_evidence_hash", "workspace_head", "workspace_tree"]), "verify_failure_publication");
  if (value.previous_accepted_ref !== "results/verify-code/accepted.json" || !ATTEMPT_REF.test(value.previous_attempt_ref ?? "")) throw new Error("verify_failure_publication previous verify acceptance is invalid");
  if (value.active_build_accepted_ref !== "results/build-code/accepted.json" || !ATTEMPT_REF.test(value.active_build_attempt_ref ?? "")) throw new Error("verify_failure_publication active build-code acceptance is invalid");
  if (!/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value.failure_evidence_ref ?? "")) throw new Error("verify_failure_publication failure evidence reference is invalid");
  for (const key of ["previous_accepted_hash", "previous_attempt_hash", "active_build_accepted_hash", "active_build_attempt_hash", "failure_evidence_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`verify_failure_publication.${key} must be sha256`);
  for (const key of ["workspace_head", "workspace_tree"]) gitOid(value[key], `verify_failure_publication.${key}`);
}

function validateVerifyPassingPublication(value) {
  if (value === undefined) return;
  plain(value, "verify_passing_publication");
  rejectUnknown(value, new Set(["previous_accepted_ref", "previous_accepted_hash", "previous_attempt_ref", "previous_attempt_hash", "active_build_accepted_ref", "active_build_accepted_hash", "active_build_attempt_ref", "active_build_attempt_hash", "test_receipt_ref", "test_receipt_hash", "review_result_ref", "review_result_hash", "acceptance_evidence_refs", "workspace_head", "workspace_tree"]), "verify_passing_publication");
  if (value.previous_accepted_ref !== "results/verify-code/accepted.json" || !ATTEMPT_REF.test(value.previous_attempt_ref ?? "")) throw new Error("verify_passing_publication previous verify acceptance is invalid");
  if (value.active_build_accepted_ref !== "results/build-code/accepted.json" || !ATTEMPT_REF.test(value.active_build_attempt_ref ?? "")) throw new Error("verify_passing_publication active build-code acceptance is invalid");
  if (!/^receipts\/[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/.test(value.test_receipt_ref ?? "")) throw new Error("verify_passing_publication test receipt reference is invalid");
  if (!RESULT_REF_FOR_FLOW.test(value.review_result_ref ?? "")
      && !ATTEMPT_REF_FOR_FLOW.test(value.review_result_ref ?? "")) {
    throw new Error("verify_passing_publication review quality-fact reference is invalid");
  }
  validateEvidenceRefs(value.acceptance_evidence_refs, "verify_passing_publication.acceptance_evidence_refs");
  if (value.acceptance_evidence_refs.length === 0 || value.acceptance_evidence_refs.some((entry) => !entry.ref.startsWith("evidence/"))) throw new Error("verify_passing_publication requires canonical acceptance evidence");
  for (const key of ["previous_accepted_hash", "previous_attempt_hash", "active_build_accepted_hash", "active_build_attempt_hash", "test_receipt_hash", "review_result_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`verify_passing_publication.${key} must be sha256`);
  for (const key of ["workspace_head", "workspace_tree"]) gitOid(value[key], `verify_passing_publication.${key}`);
}

function validateStageUpstream(stage, _taskId, refs) {
  const expected = EXPECTED_UPSTREAM[stage];
  if (expected === null) {
    if (refs.length > 1 || refs.some((ref) => ref.stage !== "make-decision" || ref.accepted_ref !== "results/make-decision/accepted.json")) {
      throw new Error("make-decision may declare only its manifest decision input as upstream");
    }
    return;
  }
  if (!refs.some((ref) => ref.stage === expected && ref.accepted_ref === `results/${expected}/accepted.json`)) {
    throw new Error(`${stage} missing accepted upstream reference to ${expected}`);
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
    if (facts.audit_verdict !== "pass") throw new Error(`${name} audit verdict must be pass`);
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
  }
  return facts;
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
  rejectUnknown(plan, new Set(["schema_version", "stage", "parent_commit", "artifacts", "plan_hash", "baseline_rebind_hash"]), "checkpoint plan");
  if (plan.schema_version !== "git-checkpoint-plan.v1" || !["build-spec", "build-plan"].includes(plan.stage)) throw new Error("checkpoint plan schema/stage invalid");
  gitOid(plan.parent_commit, "checkpoint plan.parent_commit");
  if (!HASH.test(plan.plan_hash ?? "")) throw new Error("checkpoint plan.plan_hash must be sha256");
  if (plan.baseline_rebind_hash !== undefined && !HASH.test(plan.baseline_rebind_hash)) throw new Error("checkpoint plan.baseline_rebind_hash must be sha256");
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
  if (!Array.isArray(attempt.missing_items)) throw new Error("attempt missing_items list required");
  validateStageFacts(stage, attempt.facts, {
    allowLegacyBuildCode: expected.allowLegacyBuildCode === true,
    allowLegacyAuditRead: expected.allowLegacyAuditRead === true,
    allowMissingAuditSupport: attempt.missing_items.includes("support:audit"),
  });
  validateEvidenceRefs(attempt.evidence_refs, "attempt evidence_refs");
  validateRefs(attempt.upstream_refs, "upstream_refs");
  validateUpstreamAcceptances(attempt.upstream_acceptances);
  validateReopenProvenance(attempt.reopen_provenance);
  validateBaselineRebindProvenance(attempt.baseline_rebind_provenance);
  validateBuildSpecContinuationProvenance(attempt.build_spec_continuation_provenance);
  validateVerifyFailurePublication(attempt.verify_failure_publication);
  validateVerifyPassingPublication(attempt.verify_passing_publication);
  if (attempt.baseline_rebind_provenance !== undefined && stage !== "build-plan") throw new Error("baseline_rebind_provenance is only valid for build-plan");
  if (attempt.build_spec_continuation_provenance !== undefined && stage !== "build-spec") throw new Error("build_spec_continuation_provenance is only valid for build-spec");
  if (attempt.reopen_provenance !== undefined && stage !== "build-code") throw new Error("reopen_provenance is only valid for build-code");
  if (attempt.verify_failure_publication !== undefined && stage !== "verify-code") throw new Error("verify_failure_publication is only valid for verify-code");
  if (attempt.verify_passing_publication !== undefined && stage !== "verify-code") throw new Error("verify_passing_publication is only valid for verify-code");
  if (attempt.verification_failure !== undefined && (stage !== "verify-code" || attempt.verification_failure !== true)) throw new Error("verification_failure is only valid as true on verify-code attempts");
  if (attempt.verify_failure_publication !== undefined && attempt.verify_passing_publication !== undefined) throw new Error("verify publication modes are mutually exclusive");
  validateStageUpstream(stage, attempt.task_id, attempt.upstream_refs);
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
    "checkpoint", "baseline_rebind_provenance",
    "build_spec_continuation_provenance",
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
      || accepted.full_audit_verdict !== "pass"))) {
    throw new Error("accepted make-decision full audit binding invalid");
  }
  validateRefs(accepted.upstream_refs, "accepted upstream_refs");
  if (["build-spec", "build-plan"].includes(stage)) validateCheckpoint(accepted.checkpoint);
  validateBaselineRebindProvenance(accepted.baseline_rebind_provenance);
  validateBuildSpecContinuationProvenance(accepted.build_spec_continuation_provenance, {
    requireArchive: stage === "build-spec" && accepted.build_spec_continuation_provenance !== undefined,
  });
  if (accepted.baseline_rebind_provenance !== undefined && stage !== "build-plan") throw new Error("baseline_rebind_provenance is only valid for build-plan");
  if (accepted.build_spec_continuation_provenance !== undefined && stage !== "build-spec") throw new Error("build_spec_continuation_provenance is only valid for build-spec");
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
  buildSpecRecoveryTestHooks,
} = {}, authority) {
  const { assertTaskHandle, openTask, createKernelRecordFor, replaceKernelAcceptedFor, replaceStageContentPointerFor } = authority;
  const task = assertTaskHandle(taskHandle);
  const createKernelRecord = createKernelRecordFor(task);
  const replaceKernelAccepted = typeof replaceKernelAcceptedFor === "function" ? replaceKernelAcceptedFor(task) : undefined;
  const replaceStageContentPointer = typeof replaceStageContentPointerFor === "function"
    ? replaceStageContentPointerFor(task) : undefined;
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
    liveCheckpoint = true,
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
      if (accepted.full_audit_verdict !== "pass") throw new Error("accepted make-decision requires a passing full audit");
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
          || preAudit.verdict !== "pass"
          || hash(auditRaw) !== accepted.full_audit_hash
          || audit.summary_hash !== accepted.full_audit_summary_hash
          || hashAuditSummary(audit) !== audit.summary_hash
          || audit.verdict !== "pass" || audit.through_step_id !== 12 || audit.audit_scope !== "full"
          || audit.task_id !== task.identity.taskId || audit.stage_slug !== name
          || preAudit.through_step_id !== 10 || preAudit.audit_scope !== "pre_confirmation"
          || audit.workflow_run_id !== preAudit.workflow_run_id
          || audit.snapshot_tree !== attempt.facts.snapshot_tree
          || JSON.stringify(audit.content_evidence_refs) !== JSON.stringify(preAudit.content_evidence_refs)) {
        throw new Error("accepted make-decision full audit binding mismatch");
      }
    }
    if (accepted.upstream_refs.length !== attempt.upstream_refs.length || JSON.stringify(accepted.upstream_refs) !== JSON.stringify(attempt.upstream_refs)) throw new Error(`${name} accepted upstream refs mismatch`);
    if (accepted.build_spec_continuation_provenance !== undefined) {
      const provenance = accepted.build_spec_continuation_provenance;
      const {
        previous_accepted_archive_ref: _archiveRef,
        previous_accepted_archive_hash: _archiveHash,
        ...attemptProvenance
      } = provenance;
      if (JSON.stringify(attemptProvenance) !== JSON.stringify(attempt.build_spec_continuation_provenance)) {
        throw new Error(`${name} accepted build-spec continuation provenance mismatch`);
      }
      const continuationRaw = task.readRecord(provenance.continuation_ref);
      const invalidationRaw = task.readRecord(provenance.invalidation_ref);
      const previousAttemptRaw = task.readRecord(provenance.previous_attempt_ref);
      const archiveRaw = task.readRecord(provenance.previous_accepted_archive_ref);
      const continuation = parseJson(continuationRaw, "accepted build-spec continuation authorization");
      const invalidation = parseJson(invalidationRaw, "accepted build-spec invalidation authorization");
      const unsignedInvalidation = { ...invalidation };
      delete unsignedInvalidation.content_hash;
      const previousAttempt = validateAttempt(parseJson(previousAttemptRaw, "accepted build-spec previous attempt"), {
        taskId: task.identity.taskId, stage: "build-spec",
      });
      const previousAccepted = validateAccepted(parseJson(archiveRaw, "accepted build-spec previous accepted archive"), {
        taskId: task.identity.taskId, stage: "build-spec",
      });
      const previousAudit = readBoundAttemptAudit("build-spec", previousAttempt, "accepted build-spec previous audit");
      if (hash(continuationRaw) !== provenance.continuation_hash
          || hash(invalidationRaw) !== provenance.invalidation_hash
          || hash(previousAttemptRaw) !== provenance.previous_attempt_hash
          || hash(archiveRaw) !== provenance.previous_accepted_archive_hash
          || provenance.previous_accepted_archive_hash !== provenance.previous_accepted_hash
          || continuation.previous_accepted?.ref !== provenance.previous_accepted_ref
          || continuation.previous_accepted?.sha256 !== provenance.previous_accepted_hash
          || continuation.previous_attempt?.ref !== provenance.previous_attempt_ref
          || continuation.previous_attempt?.sha256 !== provenance.previous_attempt_hash
          || continuation.previous_attempt?.attempt_id !== previousAttempt.attempt_id
          || previousAccepted.attempt_ref !== provenance.previous_attempt_ref.split("/").at(-1)
          || String(previousAccepted.integrity_hash).replace(/^sha256:/, "") !== provenance.previous_attempt_hash
          || invalidation.attempt_ref !== provenance.previous_attempt_ref
          || invalidation.attempt_hash !== provenance.previous_attempt_hash
          || invalidation.attempt_id !== previousAttempt.attempt_id
          || invalidation.workflow_run_id !== previousAudit.workflow_run_id
          || invalidation.content_hash !== hash(`${JSON.stringify(unsignedInvalidation, null, 2)}\n`)) {
        throw new Error("build-spec continuation authorization changed");
      }
    }
    if (["build-spec", "build-plan"].includes(name)) verifyCheckpoint(name, accepted.checkpoint, { live: liveCheckpoint });
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
      ...(legacyAudit ? { continuation_condition: "publish_new_attempt_with_v1_audit_carrier" } : {}),
    });
  };
  const readAcceptedLocal = (stage, options) => {
    const name = stageName(stage);
    return readAcceptedAt(name, "accepted.json", options);
  };
  const readAcceptedBuildSpecForContinuation = () => readAcceptedAt("build-spec", "accepted.json", {
    liveCheckpoint: false,
  });
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
      if (run.continuation_ref !== undefined) {
        const match = String(run.continuation_ref).match(CONTINUATION_REF);
        if (!match || match[1] !== name || !HASH.test(run.continuation_hash ?? "")
            || hash(task.readRecord(run.continuation_ref)) !== run.continuation_hash) {
          throw new Error(`${name} stage run continuation binding is invalid`);
        }
      } else if (run.continuation_hash !== undefined) {
        throw new Error(`${name} stage run continuation hash has no ref`);
      }
      if (sequence === 1) {
        if (run.previous_run_ref !== null || run.previous_run_hash !== null) throw new Error(`${name} initial stage run lineage is invalid`);
      } else if (run.previous_run_ref !== latest.ref || run.previous_run_hash !== latest.hash) {
        throw new Error(`${name} stage run lineage is broken`);
      }
      latest = { ref, hash: hash(raw), run, raw };
    }
    return latest;
  };
  const stageRunInvalidation = (stage, run) => {
    const name = stageName(stage);
    const ref = `runs/${name}/invalidations/${run.hash}.json`;
    let raw;
    try { raw = task.readRecord(ref); }
    catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
    const record = parseJson(raw, `${name} stage run invalidation`);
    if (record.schema_version !== "stage-run-invalidation.v1"
        || record.task_id !== task.identity.taskId || record.stage !== name
        || record.invalidation_ref !== ref || record.run_ref !== run.ref
        || record.run_hash !== run.hash || !nonemptyString(record.reason, "stage run invalidation reason")
        || !Number.isFinite(Date.parse(record.created_at))) {
      throw new Error(`${name} stage run invalidation is invalid`);
    }
    return { ref, hash: hash(raw), record, raw };
  };
  const trustedActiveStageRun = (stage) => {
    const name = stageName(stage);
    let current = latestStageRun(name);
    while (current !== null && stageRunInvalidation(name, current) !== null) {
      if (current.run.previous_run_ref === null) return null;
      const raw = task.readRecord(current.run.previous_run_ref);
      if (hash(raw) !== current.run.previous_run_hash) throw new Error(`${name} stage run fallback hash mismatch`);
      const run = parseJson(raw, `${name} previous stage run`);
      current = { ref: current.run.previous_run_ref, hash: current.run.previous_run_hash, run, raw };
    }
    return current;
  };
  const createStageContinuation = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "stage continuation input");
    rejectUnknown(input, new Set(["reason", "previous_attempt_ref", "previous_accepted_ref", "previous_review_refs"]), "stage continuation input");
    const reason = nonemptyString(input.reason, "stage continuation reason");
    const attemptRef = nonemptyString(input.previous_attempt_ref, "stage continuation previous_attempt_ref");
    if (!new RegExp(`^results/${name}/attempt-[0-9]{4}\\.json$`).test(attemptRef)) {
      throw new Error("stage continuation previous attempt must belong to the same task and stage");
    }
    const attemptRaw = task.readRecord(attemptRef);
    const attempt = validateAttempt(parseJson(attemptRaw, "stage continuation previous attempt"), {
      taskId: task.identity.taskId,
      stage: name,
      allowLegacyAuditRead: true,
    });
    let acceptedBinding;
    if (input.previous_accepted_ref !== undefined) {
      if (input.previous_accepted_ref !== `results/${name}/accepted.json`) {
        throw new Error("stage continuation previous accepted ref must be canonical");
      }
      const acceptedRaw = task.readRecord(input.previous_accepted_ref);
      const accepted = validateAccepted(parseJson(acceptedRaw, "stage continuation previous accepted"), {
        taskId: task.identity.taskId,
        stage: name,
      });
      if (accepted.attempt_ref !== attemptRef.slice(`results/${name}/`.length)
          || String(accepted.integrity_hash).replace(/^sha256:/, "") !== hash(attemptRaw)) {
        throw new Error("stage continuation accepted record does not bind the previous attempt");
      }
      acceptedBinding = { ref: input.previous_accepted_ref, sha256: hash(acceptedRaw) };
    } else {
      try {
        task.readRecord(`results/${name}/accepted.json`);
        throw new Error("stage continuation must bind the existing accepted record");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    if (!Array.isArray(input.previous_review_refs)) throw new TypeError("stage continuation previous_review_refs must be an array");
    const reviewBindings = input.previous_review_refs.map((ref, index) => {
      if (typeof ref !== "string" || !/^reviews\/(?:results|attempts)\/[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/.test(ref)
          || ref.includes("..")) throw new TypeError(`stage continuation previous_review_refs[${index}] is invalid`);
      return { ref, sha256: hash(task.readRecord(ref)) };
    });
    return task.withRecordLock(`locks/${name}.continuation.lock`, () => {
      for (let sequence = 1; sequence <= 9999; sequence += 1) {
        const ref = `results/${name}/revisions/continuation-${String(sequence).padStart(4, "0")}.json`;
        const record = {
          schema_version: "stage-continuation.v1",
          task_id: task.identity.taskId,
          stage: name,
          continuation_id: `${name}:continuation-${String(sequence).padStart(4, "0")}`,
          reason,
          previous_attempt: { ref: attemptRef, sha256: hash(attemptRaw), attempt_id: attempt.attempt_id },
          ...(acceptedBinding ? { previous_accepted: acceptedBinding } : {}),
          previous_reviews: reviewBindings,
          created_at: now(),
        };
        const raw = `${JSON.stringify(record, null, 2)}\n`;
        try {
          createKernelRecord(ref, raw);
          return deepFreeze({ continuation_ref: ref, continuation_hash: hash(raw), record });
        } catch (error) {
          if (error?.code !== "EEXIST") throw error;
        }
      }
      throw new Error(`${name} continuation sequence exhausted`);
    });
  };
  const startStageRun = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "stage run input");
    rejectUnknown(input, new Set(["reason", "continuation_ref"]), "stage run input");
    const reason = nonemptyString(input.reason, "stage run reason");
    let continuation;
    if (input.continuation_ref !== undefined) {
      const match = String(input.continuation_ref).match(CONTINUATION_REF);
      if (!match || match[1] !== name) throw new Error("stage run continuation must belong to the same stage");
      const raw = task.readRecord(input.continuation_ref);
      const record = parseJson(raw, "stage continuation");
      if (record.schema_version !== "stage-continuation.v1" || record.task_id !== task.identity.taskId
          || record.stage !== name || record.continuation_id !== `${name}:continuation-${match[2]}`) {
        throw new Error("stage run continuation identity is invalid");
      }
      continuation = { ref: input.continuation_ref, hash: hash(raw) };
    }
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
        ...(continuation ? { continuation_ref: continuation.ref, continuation_hash: continuation.hash } : {}),
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
    const run = trustedActiveStageRun(stage);
    if (required && run === null) throw new Error(`${stageName(stage)} requires start-run before producing evidence or publishing`);
    return run;
  };
  const allowsAcceptedMakeDecisionContinuation = (current) => {
    if (!current) return false;
    const active = trustedActiveStageRun("make-decision");
    if (!active?.run?.continuation_ref) return false;
    const raw = task.readRecord(active.run.continuation_ref);
    const continuation = parseJson(raw, "make-decision stage continuation");
    const previous = continuation.previous_accepted;
    return continuation.schema_version === "stage-continuation.v1"
      && continuation.task_id === task.identity.taskId
      && continuation.stage === "make-decision"
      && previous?.ref === current.accepted_ref
      && previous.sha256 === current.accepted_hash
      && continuation.previous_attempt?.ref === `results/make-decision/${current.accepted.attempt_ref}`
      && continuation.previous_attempt?.sha256 === hash(task.readRecord(`results/make-decision/${current.accepted.attempt_ref}`))
      && continuation.previous_attempt?.attempt_id === current.attempt.attempt_id;
  };
  const invalidateStageRun = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "stage run invalidation input");
    rejectUnknown(input, new Set(["run_ref", "run_hash", "reason"]), "stage run invalidation input");
    const runRef = nonemptyString(input.run_ref, "stage run invalidation run_ref");
    const runHash = nonemptyString(input.run_hash, "stage run invalidation run_hash");
    if (!HASH.test(runHash)) throw new TypeError("stage run invalidation run_hash is invalid");
    const reason = nonemptyString(input.reason, "stage run invalidation reason");
    return task.withRecordLock(`locks/${name}.run.lock`, () => {
      const active = trustedActiveStageRun(name);
      if (active === null || active.ref !== runRef || active.hash !== runHash) {
        throw new Error("stage run invalidation CAS failed: target is not the active trusted run");
      }
      const ref = `runs/${name}/invalidations/${runHash}.json`;
      const record = {
        schema_version: "stage-run-invalidation.v1",
        task_id: task.identity.taskId,
        stage: name,
        invalidation_ref: ref,
        run_ref: runRef,
        run_hash: runHash,
        reason,
        created_at: now(),
      };
      const raw = `${JSON.stringify(record, null, 2)}\n`;
      createKernelRecord(ref, raw);
      return deepFreeze({ ref, hash: hash(raw), record, active_run: activeStageRun(name, { required: false }) });
    });
  };
  const validateStageStepAttemptInvalidation = ({
    stage,
    run,
    stepId,
    attemptId,
    events,
    record,
  }) => {
    if (record.schema_version !== "stage-step-attempt-invalidation.v1"
        || record.task_id !== task.identity.taskId || record.stage !== stage
        || record.workflow_run_id !== run.workflow_run_id
        || record.step_id !== stepId || record.attempt_id !== attemptId
        || record.events_hash !== hash(canonicalJson(events))
        || typeof record.reason !== "string" || record.reason.trim() === ""
        || !Number.isFinite(Date.parse(record.created_at))) {
      throw new Error("stage step retry invalidation binding mismatch");
    }
    return record;
  };
  const invalidateStageStepAttempt = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "stage step attempt invalidation input");
    rejectUnknown(input, new Set(["step_id", "attempt_id", "reason"]), "stage step attempt invalidation input");
    if (!Number.isInteger(input.step_id) || input.step_id < 1) {
      throw new TypeError("stage step attempt invalidation step_id must be a positive integer");
    }
    const attemptId = nonemptyString(input.attempt_id, "stage step attempt invalidation attempt_id");
    const reason = nonemptyString(input.reason, "stage step attempt invalidation reason");
    const active = activeStageRun(name);
    const events = task.readRecord("journal.jsonl").split("\n").filter(Boolean)
      .map((line) => parseJson(line, "journal event"))
      .filter((event) => event.workflow_run_id === active.run.workflow_run_id
        && event.stage_slug === name && event.step_id === input.step_id
        && event.attempt_id === attemptId);
    if (events.length === 0) throw new Error("stage step attempt invalidation target is missing");
    const identityHash = hash(`${active.run.workflow_run_id}\0${input.step_id}\0${attemptId}`);
    const ref = `runs/${name}/journal-invalidations/${identityHash}.json`;
    const record = {
      schema_version: "stage-step-attempt-invalidation.v1",
      task_id: task.identity.taskId,
      stage: name,
      workflow_run_id: active.run.workflow_run_id,
      step_id: input.step_id,
      attempt_id: attemptId,
      events_hash: hash(canonicalJson(events)),
      reason,
      created_at: now(),
    };
    const raw = `${JSON.stringify(record, null, 2)}\n`;
    createKernelRecord(ref, raw);
    return deepFreeze({ ref, hash: hash(raw), record });
  };
  const invalidateStageAttempt = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "stage attempt invalidation input");
    rejectUnknown(input, new Set(["attempt_ref", "attempt_hash", "reason"]), "stage attempt invalidation input");
    const attemptRef = nonemptyString(input.attempt_ref, "stage attempt invalidation attempt_ref");
    const attemptHash = nonemptyString(input.attempt_hash, "stage attempt invalidation attempt_hash");
    const reason = nonemptyString(input.reason, "stage attempt invalidation reason");
    if (!new RegExp(`^results/${name}/attempt-[0-9]{4}\\.json$`).test(attemptRef) || !HASH.test(attemptHash)) {
      throw new TypeError("stage attempt invalidation target is invalid");
    }
    const raw = task.readRecord(attemptRef);
    if (hash(raw) !== attemptHash) throw new Error("stage attempt invalidation hash mismatch");
    const attempt = validateAttempt(parseJson(raw, "stage attempt invalidation target"), {
      taskId: task.identity.taskId, stage: name, allowLegacyAuditRead: true,
    });
    const active = activeStageRun(name);
    const audit = readBoundAttemptAudit(name, attempt, "stage attempt audit");
    if (audit.workflow_run_id !== active.run.workflow_run_id || audit.stage_slug !== name) {
      throw new Error("stage attempt invalidation target does not belong to the active run");
    }
    const ref = `results/${name}/invalidations/${attemptHash}.json`;
    const unsignedRecord = {
      schema_version: "stage-attempt-invalidation.v1", task_id: task.identity.taskId, stage: name,
      attempt_ref: attemptRef, attempt_hash: attemptHash, attempt_id: attempt.attempt_id,
      workflow_run_id: active.run.workflow_run_id, reason, created_at: now(),
    };
    const record = { ...unsignedRecord, content_hash: hash(`${JSON.stringify(unsignedRecord, null, 2)}\n`) };
    const recordRaw = `${JSON.stringify(record, null, 2)}\n`;
    createKernelRecord(ref, recordRaw);
    return deepFreeze({ ref, hash: hash(recordRaw), record });
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
        || audit.verdict !== "pass") {
      throw new Error(`${label} binding mismatch`);
    }
    return audit;
  };
  const assertNoAcceptedBuildSpecDownstream = () => {
    // An accepted plan does not close build-spec clarification. Once execution
    // has been accepted, replacement still fails closed.
    for (const stage of ["build-code", "verify-code"]) {
      try {
        task.readRecord(`results/${stage}/accepted.json`);
        throw new Error(`accepted build-spec continuation is blocked by accepted downstream stage ${stage}`);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  };
  const assertAcceptedBuildSpecContinuation = (current, attempt) => {
    if (!current || current.accepted.stage !== "build-spec") {
      throw new Error("accepted build-spec continuation requires the current accepted specification");
    }
    const active = activeStageRun("build-spec");
    const continuationRef = active.run.continuation_ref;
    if (!continuationRef) throw new Error("accepted build-spec continuation requires an active continuation run");
    const continuationRaw = task.readRecord(continuationRef);
    const continuation = parseJson(continuationRaw, "accepted build-spec continuation");
    const previousAttemptRef = `results/build-spec/${current.accepted.attempt_ref}`;
    const previousAttemptHash = String(current.accepted.integrity_hash).replace(/^sha256:/, "");
    if (continuation.schema_version !== "stage-continuation.v1"
        || continuation.task_id !== task.identity.taskId
        || continuation.stage !== "build-spec"
        || continuation.previous_accepted?.ref !== current.accepted_ref
        || continuation.previous_accepted?.sha256 !== current.accepted_hash
        || continuation.previous_attempt?.ref !== previousAttemptRef
        || continuation.previous_attempt?.sha256 !== previousAttemptHash
        || continuation.previous_attempt?.attempt_id !== current.attempt.attempt_id) {
      throw new Error("accepted build-spec continuation does not bind the current accepted specification");
    }
    const invalidationRef = `results/build-spec/invalidations/${previousAttemptHash}.json`;
    let invalidationRaw;
    try { invalidationRaw = task.readRecord(invalidationRef); }
    catch (error) {
      if (error?.code === "ENOENT") throw new Error("accepted build-spec continuation requires prior attempt invalidation");
      throw error;
    }
    const invalidation = parseJson(invalidationRaw, "accepted build-spec attempt invalidation");
    const unsignedInvalidation = { ...invalidation };
    delete unsignedInvalidation.content_hash;
    assertNoAcceptedBuildSpecDownstream();
    const previousAudit = readBoundAttemptAudit("build-spec", current.attempt, "accepted build-spec prior audit");
    if (invalidation.schema_version !== "stage-attempt-invalidation.v1"
        || invalidation.task_id !== task.identity.taskId
        || invalidation.stage !== "build-spec"
        || invalidation.attempt_ref !== previousAttemptRef
        || invalidation.attempt_hash !== previousAttemptHash
        || invalidation.attempt_id !== current.attempt.attempt_id
        || invalidation.workflow_run_id !== previousAudit.workflow_run_id
        || invalidation.content_hash !== hash(`${JSON.stringify(unsignedInvalidation, null, 2)}\n`)
        || !nonemptyString(invalidation.reason, "accepted build-spec invalidation reason")
        || !Number.isFinite(Date.parse(invalidation.created_at))) {
      throw new Error("accepted build-spec prior attempt invalidation is invalid");
    }
    if (attempt !== undefined) {
      const audit = readBoundAttemptAudit("build-spec", attempt, "accepted build-spec continuation audit");
      if (audit.workflow_run_id !== active.run.workflow_run_id || audit.stage_slug !== "build-spec") {
        throw new Error("accepted build-spec continuation attempt does not belong to the active continuation run");
      }
    }
    const provenance = {
      continuation_ref: continuationRef,
      continuation_hash: hash(continuationRaw),
      invalidation_ref: invalidationRef,
      invalidation_hash: hash(invalidationRaw),
      previous_accepted_ref: current.accepted_ref,
      previous_accepted_hash: current.accepted_hash,
      previous_attempt_ref: previousAttemptRef,
      previous_attempt_hash: previousAttemptHash,
    };
    if (attempt?.build_spec_continuation_provenance !== undefined
        && JSON.stringify(attempt.build_spec_continuation_provenance) !== JSON.stringify(provenance)) {
      throw new Error("accepted build-spec continuation attempt authorization changed");
    }
    return deepFreeze(provenance);
  };
  const invalidateReviewBinding = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "review binding invalidation input");
    rejectUnknown(input, new Set(["result_ref", "flow_event_ref", "reason"]), "review binding invalidation input");
    if (name !== "make-decision") throw new Error("review binding invalidation is only supported for make-decision legacy bindings");
    const resultRef = nonemptyString(input.result_ref, "review binding invalidation result_ref");
    const eventRef = nonemptyString(input.flow_event_ref, "review binding invalidation flow_event_ref");
    const reason = nonemptyString(input.reason, "review binding invalidation reason");
    if (!RESULT_REF_FOR_FLOW.test(resultRef) || !/^reviews\/flows\/[a-f0-9]{64}\/event-[0-9]{4}\.json$/.test(eventRef)) {
      throw new TypeError("review binding invalidation refs are invalid");
    }
    if (reason !== "legacy-task-created-not-active-stage-run") throw new Error("review binding invalidation reason is invalid");
    const active = activeStageRun(name);
    const resultRaw = task.readRecord(resultRef);
    const result = parseJson(resultRaw, "review result");
    const eventRaw = task.readRecord(eventRef);
    const event = parseJson(eventRaw, "review flow event");
    const activeWorkspace = candidate ?? workspace;
    if (!activeWorkspace) throw new Error("review binding invalidation requires an active Workspace");
    const snapshot = typeof activeWorkspace.captureSnapshot === "function"
      ? activeWorkspace.captureSnapshot() : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
    if (result.task_id !== task.identity.taskId || result.stage !== name
        || !new Set(["direction", "detail"]).has(result.review_track) || result.snapshot_tree !== snapshot.tree) {
      throw new Error("review binding invalidation result task/stage/snapshot mismatch");
    }
    if (event.head_result_ref !== resultRef || event.result_sha256 !== hash(resultRaw)
        || event.identity?.task_id !== task.identity.taskId || event.identity?.stage !== name
        || event.identity?.review_track !== result.review_track
        || event.identity?.workflow_run_id === active.run.workflow_run_id
        || !String(event.identity?.workflow_run_id ?? "").startsWith("task-created:")) {
      throw new Error("review binding invalidation does not bind a legacy flow for a different active run");
    }
    const ref = `reviews/binding-invalidations/${hash(resultRaw)}.json`;
    const record = {
      schema_version: "review-binding-invalidation.v1", task_id: task.identity.taskId, stage: name,
      status: "binding_invalid", reason, result_ref: resultRef, result_hash: hash(resultRaw),
      flow_event_ref: eventRef, flow_event_hash: hash(eventRaw),
      invalid_workflow_run_id: event.identity.workflow_run_id,
      active_run_ref: active.ref, active_run_hash: active.hash,
      active_workflow_run_id: active.run.workflow_run_id, snapshot_tree: snapshot.tree, created_at: now(),
    };
    const raw = `${JSON.stringify(record, null, 2)}\n`;
    createKernelRecord(ref, raw);
    return deepFreeze({ ref, hash: hash(raw), record });
  };
  const publishRequirementsLedger = (stage, input = {}) => {
    const name = stageName(stage);
    plain(input, "requirements ledger input");
    rejectUnknown(input, new Set(["source_manifest", "mappings"]), "requirements ledger input");
    const active = activeStageRun(name);
    const result = createRequirementLedger({ source_manifest: input.source_manifest, mappings: input.mappings });
    if (!result.ok) throw new Error(result.errors?.join("; ") ?? "invalid requirements ledger");
    const coverage = createRequirementsCoverage(result.ledger);
    const ledgerRef = "requirements/ledger.json";
    const coverageRef = "requirements/coverage.json";
    const ledgerRaw = `${canonicalJson(result.ledger)}\n`;
    const coverageRaw = `${canonicalJson(coverage)}\n`;
    for (const [ref, raw] of [[ledgerRef, ledgerRaw], [coverageRef, coverageRaw]]) {
      try { task.createRecordAtomic(ref, raw); }
      catch (error) {
        if (error?.code !== "EEXIST" || task.readRecord(ref) !== raw) throw error;
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
      ledger_ref: ledgerRef, ledger_hash: hash(ledgerRaw),
      coverage_ref: coverageRef, coverage_hash: hash(coverageRaw),
      workflow_run_id: active.run.workflow_run_id,
    });
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
      const invalidationHash = hash(`${active.run.workflow_run_id}\0${input.step_id}\0${priorAttemptId}`);
      let invalidation;
      try {
        invalidation = parseJson(
          task.readRecord(`runs/${name}/journal-invalidations/${invalidationHash}.json`),
          "stage step attempt invalidation",
        );
      } catch (error) {
        if (error?.code === "ENOENT") {
          throw new Error("stage step retry requires invalidation of the prior target-step attempt");
        }
        throw error;
      }
      const priorAttemptEvents = events.filter((event) =>
        event.workflow_run_id === active.run.workflow_run_id
        && event.stage_slug === name && event.step_id === input.step_id
        && event.attempt_id === priorAttemptId);
      validateStageStepAttemptInvalidation({
        stage: name,
        run: active.run,
        stepId: input.step_id,
        attemptId: priorAttemptId,
        events: priorAttemptEvents,
        record: invalidation,
      });
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
    const invalidationHash = hash(`${active.run.workflow_run_id}\0${input.step_id}\0${matchingEntry.attempt_id}`);
    try {
      const invalidation = parseJson(
        task.readRecord(`runs/${name}/journal-invalidations/${invalidationHash}.json`),
        "stage step attempt invalidation",
      );
      const attemptEvents = events.filter((event) =>
        event.workflow_run_id === active.run.workflow_run_id
        && event.stage_slug === name && event.step_id === input.step_id
        && event.attempt_id === matchingEntry.attempt_id);
      validateStageStepAttemptInvalidation({
        stage: name,
        run: active.run,
        stepId: input.step_id,
        attemptId: matchingEntry.attempt_id,
        events: attemptEvents,
        record: invalidation,
      });
      throw new Error("cannot write an exit for an invalidated stage step attempt");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
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
  const completeMakeDecisionStageStep = (input = {}) => {
    const name = "make-decision";
    plain(input, "runtime-owned stage step input");
    rejectUnknown(input, new Set(["step_id", "entry_evidence", "completion_evidence", "terminal_status", "skip_reason"]), "runtime-owned stage step input");
    const terminalStatus = input.terminal_status ?? "success";
    if (!new Set(["success", "skipped"]).has(terminalStatus)) {
      throw new Error("runtime-owned stage step terminal_status must be success or skipped");
    }
    const isResearchSkip = input.step_id === 4 && terminalStatus === "skipped";
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
      const matching = events.filter((event) => event.workflow_run_id === active.run.workflow_run_id
        && event.stage_slug === name && event.step_id === input.step_id && event.attempt_id === "attempt-1");
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
      if (input.step_id > 1 && !events.some((event) => event.workflow_run_id === active.run.workflow_run_id
          && event.stage_slug === name && event.step_id === input.step_id - 1
          && event.attempt_id === "attempt-1" && event.event_type === "step_exit"
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
  const completedMakeDecisionDependency = (workflowRunId, stepId) => {
    let events = [];
    try {
      events = task.readRecord("journal.jsonl").split("\n").filter(Boolean)
        .map((line) => parseJson(line, "journal event"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    return events.some((event) => event.workflow_run_id === workflowRunId
      && event.stage_slug === "make-decision" && event.step_id === stepId
      && event.attempt_id === "attempt-1" && event.event_type === "step_exit"
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
    if (payload?.interaction_type === "aggregate") return null;
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
    if (stepId === null) return deepFreeze({ workflow_run_id: active.run.workflow_run_id, idempotent: true });
    assertMakeDecisionProducerPredecessor(stepId);
    const activeWorkspace = candidate ?? workspace;
    if (!activeWorkspace) throw new Error("make-decision interaction completion requires CandidateWorkspace");
    const snapshot = typeof activeWorkspace.captureSnapshot === "function"
      ? activeWorkspace.captureSnapshot() : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
    if (value.snapshot_tree !== snapshot.tree || value.payload?.workspace_tree !== snapshot.tree) {
      throw new Error("make-decision interaction evidence does not bind the current Workspace");
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
    const evidence = { kind: "decision_receipt", uri_or_path: input.receipt_ref, content_hash: input.receipt_hash };
    return completeMakeDecisionStageStep({
      step_id: 9,
      entry_evidence: evidence,
      completion_evidence: evidence,
    });
  };
  const deriveStageWorkflowRunId = (stage) => {
    const name = stageName(stage);
    const active = trustedActiveStageRun(name);
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
    if (summary.verdict !== "pass" || facts.audit_verdict !== summary.verdict) throw new Error(`${stage} audit verdict is not pass`);
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
  const acceptedDecisionMaterial = () => {
    const decision = readAcceptedLocal("make-decision");
    const content = artifacts.read("decision-log.md");
    if (hash(content) !== decision.facts.decision_hash) {
      throw new Error("live decision-log.md differs from the accepted make-decision material");
    }
    return {
      path: artifacts.reference("decision-log.md"),
      blob_oid: String(execFileSync(
        "git",
        ["hash-object", "-w", "--no-filters", artifacts.path("decision-log.md")],
        { cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      )).trim(),
    };
  };
  const checkpointBase = (stage) => {
    const name = stageName(stage);
    if (name === "build-spec") {
      const decision = readAcceptedLocal("make-decision");
      const baseCommit = decision.facts.baseline_commit;
      const decisionBaseTree = decision.facts.snapshot_tree ?? String(execFileSync("git", ["rev-parse", `${baseCommit}^{tree}`], {
        cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      })).trim();
      const baseTree = overlayCheckpointArtifacts({
        repoRoot: workspace.worktreeRoot,
        baseTree: decisionBaseTree,
        artifacts: [acceptedDecisionMaterial()],
      });
      return { baseCommit, baseTree };
    }
    if (name === "build-plan") {
      const spec = readAcceptedLocal("build-spec");
      return { baseCommit: spec.accepted.checkpoint.commit_oid, baseTree: spec.accepted.checkpoint.tree_oid };
    }
    throw new Error(`stage does not produce a Git checkpoint: ${name}`);
  };
  const readBaselineRebind = (ref) => {
    if (!BASELINE_REBIND_REF.test(ref ?? "")) throw new Error("invalid build-plan baseline rebind reference");
    const raw = task.readRecord(ref);
    const record = parseJson(raw, "build-plan baseline rebind");
    if (record.schema_version !== "build-plan-baseline-rebind.v1" || record.task_id !== task.identity.taskId || record.stage !== "build-plan") throw new Error("invalid build-plan baseline rebind record");
    for (const key of ["previous_accepted_hash", "previous_attempt_hash", "accepted_spec_hash", "accepted_spec_attempt_hash", "integration_head", "integration_tree", "base_tree", "workspace_tree", "accepted_spec_checkpoint_commit", "accepted_spec_checkpoint_tree"]) {
      const pattern = key.includes("hash") ? HASH : GIT_OID;
      if (!pattern.test(record[key] ?? "")) throw new Error(`invalid build-plan baseline rebind ${key}`);
    }
    if (typeof record.previous_accepted_raw !== "string" || hash(record.previous_accepted_raw) !== record.previous_accepted_hash) throw new Error("invalid build-plan baseline rebind prior accepted raw binding");
    return { ref, raw, hash: hash(raw), record };
  };
  const assertBaselineRebind = (ref, currentPlan = readAcceptedLocal("build-plan")) => {
    const authorization = readBaselineRebind(ref);
    const spec = readAcceptedLocal("build-spec");
    const repoRoot = assertWorkspace(workspace).worktreeRoot;
    const snapshot = captureGitWorktreeSnapshot(repoRoot);
    const value = authorization.record;
    const integrationTree = String(execFileSync("git", ["rev-parse", `${value.integration_head}^{tree}`], { cwd: repoRoot, encoding: "utf8" })).trim();
    const decisionBaseTree = overlayCheckpointArtifacts({
      repoRoot,
      baseTree: integrationTree,
      artifacts: [acceptedDecisionMaterial()],
    });
    const baseTree = overlayCheckpointArtifacts({ repoRoot, baseTree: decisionBaseTree, artifacts: spec.accepted.checkpoint.artifacts });
    if (value.previous_accepted_ref !== currentPlan.accepted_ref || value.previous_accepted_hash !== currentPlan.accepted_hash ||
      value.previous_accepted_raw !== task.readRecord(currentPlan.accepted_ref) ||
      value.previous_attempt_ref !== currentPlan.accepted.attempt_ref || value.previous_attempt_hash !== String(currentPlan.accepted.integrity_hash).replace(/^sha256:/, "") ||
      value.accepted_spec_ref !== spec.accepted_ref || value.accepted_spec_hash !== spec.accepted_hash ||
      value.accepted_spec_attempt_ref !== spec.accepted.attempt_ref || value.accepted_spec_attempt_hash !== String(spec.accepted.integrity_hash).replace(/^sha256:/, "") ||
      value.accepted_spec_checkpoint_commit !== spec.accepted.checkpoint.commit_oid || value.accepted_spec_checkpoint_tree !== spec.accepted.checkpoint.tree_oid ||
      value.integration_head !== snapshot.head || value.integration_tree !== integrationTree || value.base_tree !== baseTree ||
      value.workspace_tree !== snapshot.tree) throw new Error("build-plan baseline rebind authorization no longer matches active records or Workspace");
    return authorization;
  };
  const verifyUpstream = (stage, refs) => {
    validateStageUpstream(stage, task.identity.taskId, refs);
    const bindings = [];
    for (const ref of refs) {
      if (ref.task_id === task.identity.taskId) {
        const source = readAcceptedLocal(ref.stage, {
          allowLegacyBuildCode: stage === "verify-code" && ref.stage === "build-code",
          liveCheckpoint: false,
        });
        bindings.push({ task_id: source.accepted.task_id, stage: source.accepted.stage, accepted_ref: source.accepted_ref, integrity_hash: String(source.accepted.integrity_hash).replace(/^sha256:/, "") });
        continue;
      }
      const slot = Object.entries(INPUT_STAGES).find(([name, inputStage]) => inputStage === ref.stage
        && Object.prototype.hasOwnProperty.call(task.manifest.inputs ?? {}, name))?.[0];
      if (!slot) throw new Error(`${stage} upstream task identity is not declared by a manifest input`);
      const source = kernel.readInput(slot);
      if (source.accepted.task_id !== ref.task_id || source.accepted.stage !== ref.stage) throw new Error(`${stage} upstream source identity mismatch`);
      bindings.push({ task_id: source.accepted.task_id, stage: source.accepted.stage, accepted_ref: source.accepted_ref, integrity_hash: String(source.accepted.integrity_hash).replace(/^sha256:/, "") });
    }
    return bindings;
  };
  const readReopen = (reopenRef) => {
    if (!REOPEN_REF.test(reopenRef ?? "")) throw new Error("invalid build-code reopen reference");
    const raw = task.readRecord(reopenRef);
    const record = parseJson(raw, "build-code reopen record");
    plain(record, "build-code reopen record");
    rejectUnknown(record, new Set(["schema_version", "task_id", "stage", "previous_accepted_ref", "previous_accepted_hash", "previous_attempt_ref", "previous_attempt_hash", "verify_failure_ref", "verify_failure_hash", "failure_evidence_ref", "failure_evidence_hash", "reopened_at"]), "build-code reopen record");
    if (record.schema_version !== "stage-reopen.v1" || record.task_id !== task.identity.taskId || record.stage !== "build-code" ||
      !/^results\/build-code\/accepted(?:-attempt-[0-9]{4})?\.json$/.test(record.previous_accepted_ref ?? "") ||
      !ATTEMPT_REF.test(record.previous_attempt_ref ?? "") || !/^results\/verify-code\/attempt-[0-9]{4}\.json$/.test(record.verify_failure_ref ?? "") ||
      !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(record.failure_evidence_ref ?? "") || !Number.isFinite(Date.parse(record.reopened_at))) throw new Error("invalid build-code reopen record");
    for (const key of ["previous_accepted_hash", "previous_attempt_hash", "verify_failure_hash", "failure_evidence_hash"]) if (!HASH.test(record[key] ?? "")) throw new Error(`invalid build-code reopen ${key}`);
    return { ref: reopenRef, raw, hash: hash(raw), record };
  };
  const readAdjudicationCorrection = (correctionRef) => {
    if (!ADJUDICATION_CORRECTION_REF.test(correctionRef ?? "")) throw new Error("invalid build-code adjudication correction reference");
    const raw = task.readRecord(correctionRef);
    const record = parseJson(raw, "build-code adjudication correction");
    if (record.schema_version !== "workflowhub-build-code-adjudication-correction.v1"
        || record.task_id !== task.identity.taskId || record.stage !== "build-code"
        || correctionRef !== `results/build-code/revisions/adjudication-correction-${record.phase_id}.json`) {
      throw new Error("invalid build-code adjudication correction record");
    }
    return { ref: correctionRef, raw, hash: hash(raw), record };
  };
  const assertReopenProvenance = (provenance, current) => {
    validateReopenProvenance(provenance);
    if (!provenance) throw new Error("build-code accepted stage requires controlled reopen provenance");
    const reopen = readReopen(provenance.reopen_ref);
    if (provenance.reopen_hash !== reopen.hash || provenance.previous_accepted_ref !== current.accepted_ref || provenance.previous_accepted_hash !== current.accepted_hash ||
      provenance.previous_accepted_ref !== reopen.record.previous_accepted_ref || provenance.previous_accepted_hash !== reopen.record.previous_accepted_hash ||
      provenance.verify_failure_ref !== reopen.record.verify_failure_ref || provenance.verify_failure_hash !== reopen.record.verify_failure_hash) {
      throw new Error("build-code reopen provenance does not match the active accepted record");
    }
    return reopen;
  };
  const readFailureEvidence = (evidenceRef) => {
    if (!/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(evidenceRef ?? "")) throw new Error("failure evidence must be a canonical evidence reference");
    const raw = task.readRecord(evidenceRef);
    const value = validateAcceptanceEvidence(parseJson(raw, "failure evidence"), "failure evidence");
    if (value.result !== "fail") throw new Error("failure evidence must be acceptance-evidence.v1 with result=fail");
    for (const [index, nested] of value.refs.entries()) {
      if (hash(task.readRecord(nested.ref)) !== nested.sha256) throw new Error(`failure evidence refs[${index}] hash mismatch`);
    }
    return { ref: evidenceRef, hash: hash(raw) };
  };
  const verifyFailureEvidence = (verifyAttempt, evidenceRef) => {
    const failure = readFailureEvidence(evidenceRef);
    const entry = verifyAttempt.facts.evidence_refs.find((item) => item.ref === failure.ref);
    if (!entry) throw new Error("failure evidence is not declared by the verify-code attempt");
    if (entry.sha256 !== failure.hash) throw new Error("failure evidence hash mismatch");
    return failure;
  };
  const readPassingEvidence = (entry) => {
    const raw = task.readRecord(entry.ref);
    if (hash(raw) !== entry.sha256) throw new Error(`verify-code passing acceptance evidence hash mismatch: ${entry.ref}`);
    const value = parseJson(raw, "passing acceptance evidence");
    if (!value || value.schema_version !== "acceptance-evidence.v1" || typeof value.acceptance_criterion_id !== "string" || value.acceptance_criterion_id.trim() === "" || value.result !== "pass" || !Array.isArray(value.refs) || value.refs.length === 0) {
      throw new Error("verify-code passing publication requires acceptance-evidence.v1 with result=pass and evidence refs");
    }
    for (const nested of value.refs) {
      if (!nested || typeof nested.ref !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(nested.ref) || !HASH.test(nested.sha256 ?? "")) throw new Error("verify-code passing acceptance evidence contains an invalid nested reference");
      if (hash(task.readRecord(nested.ref)) !== nested.sha256) throw new Error(`verify-code passing nested evidence hash mismatch: ${nested.ref}`);
    }
    return { ref: entry.ref, hash: hash(raw), value };
  };
  const assertSnapshotCommitBinding = (snapshotCommit, snapshotHead, snapshotTree, label) => {
    const repoRoot = assertWorkspace(workspace).worktreeRoot;
    let commitTree;
    let commitParents;
    try {
      commitTree = String(execFileSync("git", ["show", "-s", "--format=%T", snapshotCommit], {
        cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      })).trim();
      commitParents = String(execFileSync("git", ["show", "-s", "--format=%P", snapshotCommit], {
        cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      })).trim().split(/\s+/).filter(Boolean);
    } catch (error) {
      throw new Error(`${label} snapshot_commit is not readable from the active Workspace`, { cause: error });
    }
    if (commitTree !== snapshotTree || commitParents.length !== 1 || commitParents[0] !== snapshotHead) {
      throw new Error(`${label} snapshot_commit does not bind its declared snapshot head/tree`);
    }
  };
  const reviewFactBinding = (reviewFacts, label) => {
    const semantic = reviewFacts?.result_ref !== undefined;
    const unavailable = reviewFacts?.status === "unavailable" && reviewFacts?.attempt_ref !== undefined;
    if (semantic === unavailable) throw new Error(`${label} must contain exactly one authenticated review quality fact`);
    return semantic
      ? { kind: "semantic", ref: reviewFacts.result_ref, hash: reviewFacts.result_hash }
      : { kind: "unavailable", ref: reviewFacts.attempt_ref, hash: reviewFacts.attempt_hash };
  };
  const assertPassingMaterials = (publication, facts, attemptEvidenceRefs, previousVerify, activeBuild) => {
    if (facts.tests.exit_code !== 0) throw new Error("verify-code passing publication requires tests with exit_code=0");
    const reviewBinding = reviewFactBinding(facts.review, "verify-code passing review");
    const activeBuildReviewBinding = reviewFactBinding(activeBuild.facts.review, "active accepted build review");
    if (reviewBinding.ref !== publication.review_result_ref || reviewBinding.hash !== publication.review_result_hash
        || activeBuildReviewBinding.ref !== publication.review_result_ref
        || activeBuildReviewBinding.hash !== publication.review_result_hash) {
      throw new Error("verify-code passing review quality-fact binding mismatch");
    }
    const snapshot = captureGitWorktreeSnapshot(assertWorkspace(workspace).worktreeRoot);
    const workspaceRoot = assertWorkspace(workspace).worktreeRoot;
    const matchesCurrentOrCertifiedTasksCompletion = (expectedTree) => {
      if (equivalentWorkspaceTrees(workspaceRoot, expectedTree, snapshot.tree)) return true;
      const changed = String(execFileSync("git", ["diff", "--name-only", expectedTree, snapshot.tree, "--"], {
        cwd: workspaceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      })).trim().split("\n").filter(Boolean);
      const phaseCompletion = activeBuild.facts.phase_completion;
      const tasksRef = `specs/${task.identity.taskId}/tasks.md`;
      return changed.length === 1
        && changed[0] === tasksRef
        && phaseCompletion?.status === "completed"
        && phaseCompletion.evidence_ref === tasksRef
        && HASH.test(phaseCompletion.evidence_hash ?? "")
        && hash(artifacts.read("tasks.md")) === phaseCompletion.evidence_hash;
    };
    const snapshotsMatch = equivalentWorkspaceTrees(workspaceRoot, facts.tests.snapshot_tree, snapshot.tree)
      && matchesCurrentOrCertifiedTasksCompletion(facts.review.snapshot_tree)
      && matchesCurrentOrCertifiedTasksCompletion(activeBuild.facts.tests.snapshot_tree)
      && matchesCurrentOrCertifiedTasksCompletion(activeBuild.facts.review.snapshot_tree);
    if (publication.workspace_head !== snapshot.head || facts.tests.snapshot_head !== snapshot.head || !snapshotsMatch) {
      throw new Error("verify-code passing publication Workspace binding changed before publication");
    }
    if (activeBuild.facts.tests.snapshot_head !== snapshot.head) {
      throw new Error("verify-code passing publication active accepted build tests/review snapshot does not match the active Workspace");
    }
    assertSnapshotCommitBinding(facts.tests.snapshot_commit, facts.tests.snapshot_head, facts.tests.snapshot_tree, "verify-code passing tests");
    assertSnapshotCommitBinding(activeBuild.facts.tests.snapshot_commit, activeBuild.facts.tests.snapshot_head, activeBuild.facts.tests.snapshot_tree, "active accepted build tests");
    const oldBuildBinding = (previousVerify.attempt.upstream_acceptances ?? []).find((entry) => entry.task_id === task.identity.taskId && entry.stage === "build-code");
    if (!oldBuildBinding || oldBuildBinding.integrity_hash === String(activeBuild.accepted.integrity_hash).replace(/^sha256:/, "")) throw new Error("verify-code passing publication requires a new active accepted build");
    const reopenProvenance = activeBuild.attempt.reopen_provenance;
    validateReopenProvenance(reopenProvenance);
    if (!reopenProvenance) throw new Error("verify-code passing publication requires active build reopen provenance");
    const reopen = readReopen(reopenProvenance.reopen_ref);
    if (reopenProvenance.reopen_hash !== reopen.hash || reopenProvenance.verify_failure_ref !== reopen.record.verify_failure_ref || reopenProvenance.verify_failure_hash !== reopen.record.verify_failure_hash) throw new Error("verify-code passing publication active build reopen provenance mismatch");
    const verifyFailureRaw = task.readRecord(reopen.record.verify_failure_ref);
    if (hash(verifyFailureRaw) !== reopen.record.verify_failure_hash) throw new Error("verify-code passing publication verify failure attempt hash mismatch");
    const verifyFailureRef = basename(reopen.record.verify_failure_ref);
    const verifyFailure = validateAttempt(parseJson(verifyFailureRaw, "verify-code failure attempt"), { taskId: task.identity.taskId, stage: "verify-code", attemptId: `verify-code:${verifyFailureRef.slice(0, -5)}` });
    const failurePublication = verifyFailure.verify_failure_publication;
    if (!failurePublication || failurePublication.previous_accepted_ref !== previousVerify.accepted_ref || failurePublication.previous_accepted_hash !== previousVerify.accepted_hash || failurePublication.previous_attempt_ref !== previousVerify.accepted.attempt_ref || failurePublication.previous_attempt_hash !== String(previousVerify.accepted.integrity_hash).replace(/^sha256:/, "")) throw new Error("verify-code passing publication active build does not descend from the accepted verify result");
    if (previousVerify.facts.tests.receipt_hash === publication.test_receipt_hash) throw new Error("verify-code passing publication requires fresh test receipt content");
    if (reviewFactBinding(previousVerify.facts.review, "previous accepted verify review").hash === publication.review_result_hash) {
      throw new Error("verify-code passing publication requires the revised build's final review quality fact");
    }
    const oldEvidence = previousVerify.facts.evidence_refs.map(readPassingEvidence);
    const oldEvidenceHashes = new Set(oldEvidence.map((entry) => entry.hash));
    if (publication.acceptance_evidence_refs.some((entry) => oldEvidenceHashes.has(entry.sha256))) throw new Error("verify-code passing publication requires fresh acceptance evidence content");

    const testRaw = task.readRecord(publication.test_receipt_ref);
    if (hash(testRaw) !== publication.test_receipt_hash) throw new Error("verify-code passing test receipt changed before publication");
    const testReceipt = parseJson(testRaw, "verify-code passing test receipt");
    if (testReceipt.schema_version !== "workflowhub-receipt.v1" || testReceipt.task_id !== task.identity.taskId || testReceipt.stage !== "verify-code") throw new Error("verify-code passing test receipt provenance mismatch");
    const testFields = ["command", "exit_code", "command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "output_ref", "output_hash"];
    if (testFields.some((key) => testReceipt[key] !== facts.tests[key]) || facts.tests.receipt_ref !== publication.test_receipt_ref || facts.tests.receipt_hash !== publication.test_receipt_hash) throw new Error("verify-code passing test facts do not match the fresh receipt");
    if (hash(task.readRecord(facts.tests.output_ref)) !== facts.tests.output_hash) throw new Error("verify-code passing test output changed before publication");

    const reviewRaw = task.readRecord(publication.review_result_ref);
    if (hash(reviewRaw) !== publication.review_result_hash) throw new Error("verify-code passing review quality fact changed before publication");
    const review = parseJson(reviewRaw, "verify-code passing review quality fact");
    const integrationScopeError = "MATERIAL_INCOMPLETE: build-code final review must be a same-snapshot formal integration quality fact (subject_kind=worktree, review_scope=integration, phase_id=null); return to build-code";
    if (review.subject_kind !== "worktree" || review.review_scope !== "integration" || review.phase_id !== null || review.candidate_tree !== review.snapshot_tree ||
      facts.review.subject_kind !== "worktree" || facts.review.review_scope !== "integration" || facts.review.phase_id !== null ||
      activeBuild.facts.review?.subject_kind !== "worktree" || activeBuild.facts.review?.review_scope !== "integration" || activeBuild.facts.review?.phase_id !== null) throw new Error(integrationScopeError);
    const flowIdentity = deriveReviewFlowIdentity({
      stage: "build-code",
      review_track: null,
      subject_kind: "worktree",
      phase_id: null,
      review_scope: "integration",
      ...(activeBuild.attempt.reopen_provenance?.reopen_ref
        ? { revision_ref: activeBuild.attempt.reopen_provenance.reopen_ref }
        : {}),
    });
    const flow = readReviewFlow(flowIdentity);
    if (review.task_id !== task.identity.taskId || review.stage !== "build-code"
        || review.snapshot_tree !== facts.review.snapshot_tree) {
      throw new Error("verify-code passing review quality-fact provenance mismatch");
    }
    if (reviewBinding.kind === "semantic") {
      try { validateSchema("result", review); }
      catch (error) { throw new Error(`verify-code passing formal integration result schema is invalid: ${error.message}`); }
      if (!ATTEMPT_REF_FOR_FLOW.test(review.attempt_ref ?? "")) throw new Error("verify-code passing formal integration result attempt reference is invalid");
      const reviewAttempt = parseJson(task.readRecord(review.attempt_ref), "verify-code passing review attempt");
      try { validateSchema("attempt", reviewAttempt); }
      catch (error) { throw new Error(`verify-code passing formal integration attempt schema is invalid: ${error.message}`); }
      for (const key of ["task_id", "stage", "review_track", "snapshot_tree", "material_id", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree"]) {
        if (reviewAttempt[key] !== review[key]) throw new Error(`verify-code passing formal integration attempt/result ${key} mismatch`);
      }
      if (reviewAttempt.terminal_status !== "semantic" || reviewAttempt.error !== null) throw new Error("verify-code passing formal integration result is not backed by a semantic attempt");
      if (!["pass", "revise_required"].includes(review.verdict)
          || review.verdict !== facts.review.verdict
          || flow?.event_kind !== "semantic_result"
          || flow.head_result_ref !== publication.review_result_ref
          || flow.result_sha256 !== publication.review_result_hash
          || flow.verdict !== review.verdict) {
        throw new Error("verify-code passing semantic review is not the authenticated quality-fact head");
      }
      const pause = deriveSeriousReviewPause({
        taskId: task.identity.taskId,
        stage: "build-code",
        reviewRef: publication.review_result_ref,
        reviewHash: publication.review_result_hash,
        result: review,
        workflowRunId: flowIdentity.workflow_run_id,
      });
      if (pause.status === "paused") {
        const acceptances = (activeBuild.attempt.evidence_refs ?? []).flatMap((entry) => {
          if (!/^evidence\/risk-acceptances\/[a-f0-9]{64}\.json$/.test(entry.ref)) return [];
          const raw = task.readRecord(entry.ref);
          if (hash(raw) !== entry.sha256) throw new Error(`active accepted build risk acceptance changed: ${entry.ref}`);
          const acceptance = parseJson(raw, "active accepted build risk acceptance");
          return acceptance.review_ref === publication.review_result_ref
            && acceptance.review_hash === publication.review_result_hash
            ? [acceptance]
            : [];
        });
        try { validateRiskAcceptanceSet({ acceptances, pause }); }
        catch (error) { throw new Error(`verify-code passing serious integration findings are unresolved: ${error.message}`); }
      }
    } else {
      try { validateSchema("attempt", review); }
      catch (error) { throw new Error(`verify-code passing formal integration unavailable attempt schema is invalid: ${error.message}`); }
      if (review.terminal_status !== "unavailable" || review.error === null
          || !Array.isArray(review.provider_attempts) || review.provider_attempts.length === 0
          || facts.review.status !== "unavailable"
          || flow?.event_kind !== "provider_attempt"
          || flow.action_ref !== publication.review_result_ref
          || flow.action_sha256 !== publication.review_result_hash) {
        throw new Error("verify-code passing unavailable review is not the authenticated quality-fact action");
      }
    }

    if (JSON.stringify(facts.evidence_refs) !== JSON.stringify(publication.acceptance_evidence_refs)) throw new Error("verify-code passing acceptance evidence binding mismatch");
    const criterionIds = new Set();
    for (const entry of publication.acceptance_evidence_refs) {
      const evidence = readPassingEvidence(entry);
      if (criterionIds.has(evidence.value.acceptance_criterion_id)) throw new Error(`verify-code passing publication contains duplicate acceptance criterion: ${evidence.value.acceptance_criterion_id}`);
      criterionIds.add(evidence.value.acceptance_criterion_id);
    }
    const previousCriterionIds = new Set(oldEvidence.map((entry) => entry.value.acceptance_criterion_id));
    if (criterionIds.size !== previousCriterionIds.size || [...criterionIds].some((id) => !previousCriterionIds.has(id))) throw new Error("verify-code passing publication acceptance criterion set does not match the accepted verify result");
    for (const entry of attemptEvidenceRefs) {
      if (hash(task.readRecord(entry.ref)) !== entry.sha256) throw new Error(`verify-code passing attempt evidence changed before publication: ${entry.ref}`);
    }
  };
  const visitAttempts = (stage, visitor, options = {}) => {
    for (let sequence = 1; sequence <= 9999; sequence += 1) {
      const attemptRef = `attempt-${String(sequence).padStart(4, "0")}.json`;
      let raw;
      try { raw = task.readRecord(`results/${stage}/${attemptRef}`); }
      catch (error) { if (error?.code === "ENOENT") return; throw error; }
      const attempt = validateAttempt(parseJson(raw, `${stage} attempt`), { taskId: task.identity.taskId, stage, attemptId: `${stage}:${attemptRef.slice(0, -5)}`, ...options });
      if (visitor(attempt, attemptRef)) return;
    }
  };
  const rejectPublishedBuildReopen = (reopenRef) => visitAttempts("build-code", (attempt, attemptRef) => {
    if (attempt.reopen_provenance?.reopen_ref !== reopenRef) return false;
    throw new Error(`build-code reopen already published as ${attemptRef}; resume and accept that attempt`);
  }, { allowLegacyBuildCode: true });
  const controlledVerifyFailurePublications = new WeakSet();
  const controlledVerifyPassingPublications = new WeakSet();
  const duplicateVerifyFailurePublication = (publication) => {
    for (let sequence = 1; sequence <= 9999; sequence += 1) {
      const attemptRef = `attempt-${String(sequence).padStart(4, "0")}.json`;
      let raw;
      try { raw = task.readRecord(`results/verify-code/${attemptRef}`); }
      catch (error) { if (error?.code === "ENOENT") continue; throw error; }
      const attempt = validateAttempt(parseJson(raw, "verify-code attempt"), { taskId: task.identity.taskId, stage: "verify-code", attemptId: `verify-code:${attemptRef.slice(0, -5)}` });
      const existing = attempt.verify_failure_publication;
      if (existing && existing.previous_accepted_hash === publication.previous_accepted_hash && existing.active_build_accepted_hash === publication.active_build_accepted_hash) {
        throw new Error("verify-code controlled failure publication already exists for this accepted verify/build-code binding");
      }
    }
  };
  const duplicateVerifyPassingPublication = (publication) => {
    for (let sequence = 1; sequence <= 9999; sequence += 1) {
      const attemptRef = `attempt-${String(sequence).padStart(4, "0")}.json`;
      let raw;
      try { raw = task.readRecord(`results/verify-code/${attemptRef}`); }
      catch (error) { if (error?.code === "ENOENT") continue; throw error; }
      const attempt = validateAttempt(parseJson(raw, "verify-code attempt"), { taskId: task.identity.taskId, stage: "verify-code", attemptId: `verify-code:${attemptRef.slice(0, -5)}` });
      const existing = attempt.verify_passing_publication;
      if (existing && existing.previous_accepted_hash === publication.previous_accepted_hash && existing.active_build_accepted_hash === publication.active_build_accepted_hash) {
        throw new Error("verify-code controlled passing publication already exists for this accepted verify/build-code binding");
      }
    }
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
        let resetFromInvalidatedHead = false;
        if (prior?.head_result_ref && event.head_result_ref !== prior.head_result_ref) {
          const priorRaw = task.readRecord(prior.head_result_ref);
          const priorHash = hash(priorRaw);
          try {
            const invalidation = parseJson(task.readRecord(`reviews/binding-invalidations/${priorHash}.json`), "review binding invalidation");
            resetFromInvalidatedHead = invalidation.schema_version === "review-binding-invalidation.v1"
              && invalidation.status === "binding_invalid"
              && invalidation.result_ref === prior.head_result_ref
              && invalidation.result_hash === priorHash;
            if (!resetFromInvalidatedHead) throw new Error("review binding invalidation does not bind the prior flow head");
          } catch (error) {
            if (error?.code !== "ENOENT") throw error;
          }
        }
        const semanticPrior = resetFromInvalidatedHead ? null : prior;
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
              || (!resetFromInvalidatedHead && event.previous_head_ref !== null)
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
    // Stage runs. They stay readable, but cannot satisfy a later official run
    // because their flow identity is not bound to that run.
    if (active === null) return null;
    if (active.run.workflow_run_id !== identity.workflow_run_id) {
      throw new Error("make-decision review flow does not bind the active run");
    }
    let events = [];
    try {
      events = task.readRecord("journal.jsonl").split("\n").filter(Boolean).map((line) => parseJson(line, "journal event"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (!events.some((event) => event.workflow_run_id === identity.workflow_run_id
        && event.stage_slug === "make-decision" && event.step_id === stepId - 1
        && event.attempt_id === "attempt-1" && event.event_type === "step_exit"
        && event.terminal_status === "success")) {
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
  function assertActiveReviewGeneration(identity) {
    const baseWorkflowRunId = identity.workflow_run_id.replace(/:review-reset:[a-f0-9]{64}$/, "");
    const baseIdentity = normalizeReviewFlowIdentity(task, {
      ...identity,
      workflow_run_id: baseWorkflowRunId,
    });
    const reset = activeReviewFlowReset(baseIdentity);
    const activeIdentity = reset === null ? baseIdentity : normalizeReviewFlowIdentity(task, {
      ...baseIdentity,
      workflow_run_id: `${baseIdentity.workflow_run_id}:review-reset:${reset.hash}`,
    });
    if (JSON.stringify(identity) !== JSON.stringify(activeIdentity)) {
      throw new Error("review flow generation is superseded by the active reset");
    }
  }
  const advanceReviewFlow = (value, update = {}) => {
    const identity = normalizeReviewFlowIdentity(task, value);
    assertActiveReviewGeneration(identity);
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
      let lineageCurrent = current;
      if (current?.head_result_ref) {
        const currentRaw = task.readRecord(current.head_result_ref);
        const currentHash = hash(currentRaw);
        try {
          const invalidation = parseJson(task.readRecord(`reviews/binding-invalidations/${currentHash}.json`), "review binding invalidation");
          if (invalidation.schema_version !== "review-binding-invalidation.v1"
              || invalidation.status !== "binding_invalid"
              || invalidation.result_ref !== current.head_result_ref
              || invalidation.result_hash !== currentHash) {
            throw new Error("review binding invalidation does not bind the current flow head");
          }
          lineageCurrent = null;
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
      }
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
    assertActiveReviewGeneration(identity);
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
    assertActiveReviewGeneration(identity);
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
    if (resolution.evidence_state === "verified" && resolution.change_classification?.structural === true) {
      const subject = {
        stage: identity.stage,
        review_track: identity.review_track,
        subject_kind: identity.subject_kind,
        phase_id: identity.phase_id,
        review_scope: identity.review_scope,
        ...(identity.snapshot_tree === undefined ? {} : { snapshot_tree: identity.snapshot_tree }),
      };
      const reset = createReviewFlowReset(subject, {
        reason: "authenticated structural change starts a fresh initial review generation",
        resolution_ref: resolutionRef,
      });
      return deepFreeze({ ...recorded, reset });
    }
    return recorded;
  };
  const deriveBaseReviewFlowIdentity = (value) => {
    plain(value, "review flow subject");
    rejectUnknown(value, new Set([
      "stage", "review_track", "subject_kind", "phase_id", "review_scope", "snapshot_tree", "revision_ref", "adjudication_correction_ref",
    ]), "review flow subject");
    const stage = stageName(value.stage);
    if (value.revision_ref !== undefined && stage !== "build-code") {
      throw new Error("review flow revision_ref is only valid for an authenticated build-code reopen");
    }
    if (value.adjudication_correction_ref !== undefined && stage !== "build-code") {
      throw new Error("review flow adjudication_correction_ref is only valid for build-code");
    }
    if (value.revision_ref !== undefined && value.adjudication_correction_ref !== undefined) {
      throw new Error("review flow reopen and adjudication correction are mutually exclusive");
    }
    let workflowRunId;
    if (stage === "make-decision") {
      let accepted;
      try {
        accepted = readAcceptedLocal("make-decision");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      if (accepted && !allowsAcceptedMakeDecisionContinuation(accepted)) {
        throw new Error("make-decision review revision is not authorized after stage acceptance");
      }
      workflowRunId = nonemptyString(activeStageRun(stage).run.workflow_run_id, "make-decision active stage workflow_run_id");
    } else {
      const upstreamStage = EXPECTED_UPSTREAM[stage];
      const upstream = readAcceptedLocal(upstreamStage, {
        allowLegacyBuildCode: upstreamStage === "build-code",
        liveCheckpoint: false,
      });
      workflowRunId = nonemptyString(upstream?.attempt?.attempt_id, `${stage} accepted upstream attempt_id`);
    }
    if (value.revision_ref !== undefined) {
      const current = readAcceptedLocal("build-code", { allowLegacyBuildCode: true });
      const reopen = readReopen(value.revision_ref);
      const pendingRevision = reopen.record.previous_accepted_ref === current.accepted_ref
        && reopen.record.previous_accepted_hash === current.accepted_hash;
      const activeRevision = current.attempt.reopen_provenance?.reopen_ref === reopen.ref
        && current.attempt.reopen_provenance?.reopen_hash === reopen.hash
        && current.attempt.reopen_provenance?.previous_accepted_ref === reopen.record.previous_accepted_ref
        && current.attempt.reopen_provenance?.previous_accepted_hash === reopen.record.previous_accepted_hash;
      if (!pendingRevision && !activeRevision) {
        throw new Error("review flow revision_ref is stale or not authorized for the active build-code acceptance");
      }
      workflowRunId = `${workflowRunId}:reopen:${reopen.hash}`;
    }
    if (value.adjudication_correction_ref !== undefined) {
      const correction = readAdjudicationCorrection(value.adjudication_correction_ref);
      if (correction.record.phase_id !== value.phase_id || value.subject_kind !== "phase" || value.review_scope !== "phase") {
        throw new Error("review flow adjudication correction does not match the build-code Phase subject");
      }
      workflowRunId = `${workflowRunId}:adjudication-correction:${correction.hash}`;
    }
    const { revision_ref: _revisionRef, adjudication_correction_ref: _correctionRef, ...subject } = value;
    return normalizeReviewFlowIdentity(task, { ...subject, workflow_run_id: workflowRunId });
  };
  const activeReviewFlowReset = (baseIdentity) => {
    const baseFlowId = reviewFlowId(baseIdentity);
    const refs = task.listCanonicalReviewFlowResetRefs(baseFlowId);
    if (refs.length > 9999) throw new Error("review flow reset sequence exhausted");
    let previous = null;
    for (const [index, ref] of refs.entries()) {
      const sequence = index + 1;
      const expectedRef = `reviews/flow-resets/${baseFlowId}/reset-${String(sequence).padStart(4, "0")}.json`;
      if (ref !== expectedRef) {
        throw new Error(`review flow reset generation gap before ${ref}`);
      }
      const raw = task.readRecord(ref);
      const record = parseJson(raw, "review flow reset");
      const previousIdentity = previous === null
        ? baseIdentity
        : normalizeReviewFlowIdentity(task, {
          ...baseIdentity,
          workflow_run_id: `${baseIdentity.workflow_run_id}:review-reset:${previous.hash}`,
        });
      if (!RESULT_REF_FOR_FLOW.test(record.previous_head_ref ?? "")
          || !HASH.test(record.previous_head_hash ?? "")
          || !/^reviews\/flows\/[a-f0-9]{64}\/event-[0-9]{4}\.json$/.test(record.previous_event_ref ?? "")
          || !HASH.test(record.previous_event_hash ?? "")
          || !GIT_OID.test(record.previous_snapshot_tree ?? "")
          || !GIT_OID.test(record.current_snapshot_tree ?? "")
          || !RESOLUTION_REF_FOR_FLOW.test(record.resolution_ref ?? "")
          || !HASH.test(record.resolution_hash ?? "")
          || typeof record.reason !== "string" || record.reason.trim() === "") {
        throw new Error("review flow reset record is invalid or discontinuous");
      }
      const previousFlow = readReviewFlow(previousIdentity);
      const resultRaw = task.readRecord(record.previous_head_ref);
      const result = parseJson(resultRaw, "review flow reset previous head");
      const resolutionRaw = task.readRecord(record.resolution_ref);
      const resolution = parseJson(resolutionRaw, "review flow reset resolution");
      validateReviewFlowReset({
        record,
        taskId: task.identity.taskId,
        resetRef: ref,
        baseFlowId,
        sequence,
        baseIdentity,
        previousIdentity,
        previousResetRef: previous?.ref ?? null,
        previousResetHash: previous?.hash ?? null,
        previousFlow,
        previousResult: result,
        previousHeadHash: hash(resultRaw),
        previousEventHash: hash(task.readRecord(record.previous_event_ref)),
        resolution,
        resolutionHash: hash(resolutionRaw),
      });
      previous = { ref, hash: hash(raw), record };
    }
    return previous;
  };
  const deriveReviewFlowIdentity = (value) => {
    const baseIdentity = deriveBaseReviewFlowIdentity(value);
    const reset = activeReviewFlowReset(baseIdentity);
    if (reset === null) return baseIdentity;
    return normalizeReviewFlowIdentity(task, {
      ...baseIdentity,
      workflow_run_id: `${baseIdentity.workflow_run_id}:review-reset:${reset.hash}`,
    });
  };
  const createReviewFlowReset = (value, input = {}) => {
    plain(input, "review flow reset input");
    rejectUnknown(input, new Set(["reason", "resolution_ref"]), "review flow reset input");
    const reason = nonemptyString(input.reason, "review flow reset reason");
    const resolutionRef = nonemptyString(input.resolution_ref, "review flow reset resolution_ref");
    if (!RESOLUTION_REF_FOR_FLOW.test(resolutionRef)) {
      throw new Error("review flow reset resolution_ref must be canonical");
    }
    const baseIdentity = deriveBaseReviewFlowIdentity(value);
    if (!new Set(["build-spec", "build-plan", "verify-code"]).has(baseIdentity.stage)) {
      throw new Error("review flow reset is only supported for open design and verification stages");
    }
    try {
      readAcceptedLocal(baseIdentity.stage);
      throw new Error("review flow reset requires an open, unaccepted stage");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const previousReset = activeReviewFlowReset(baseIdentity);
    const previousIdentity = previousReset === null
      ? baseIdentity
      : normalizeReviewFlowIdentity(task, {
        ...baseIdentity,
        workflow_run_id: `${baseIdentity.workflow_run_id}:review-reset:${previousReset.hash}`,
      });
    const current = readReviewFlow(previousIdentity);
    if (!current?.head_result_ref) {
      throw new Error(previousReset === null
        ? "review flow reset requires a current semantic head"
        : "review flow reset is stale: active generation has no current semantic head");
    }
    const resultRaw = task.readRecord(current.head_result_ref);
    const result = parseJson(resultRaw, "review flow reset previous result");
    const activeWorkspace = candidate ?? workspace;
    if (!activeWorkspace) throw new Error("review flow reset requires an authenticated Workspace");
    const snapshot = typeof activeWorkspace.captureSnapshot === "function"
      ? activeWorkspace.captureSnapshot()
      : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
    if (result.snapshot_tree === snapshot.tree) {
      throw new Error("review flow reset requires a changed Workspace snapshot");
    }
    const resolutionRaw = task.readRecord(resolutionRef);
    const resolution = parseJson(resolutionRaw, "review flow reset resolution");
    const structuralDimensions = [...new Set(resolution.change_classification?.changed_dimensions ?? [])].sort();
    if (current.event_kind !== "resolution" || current.action_ref !== resolutionRef
        || current.action_sha256 !== hash(resolutionRaw)
        || resolution.version !== "wh-review-resolution.v1"
        || resolution.task_id !== task.identity.taskId || resolution.stage !== baseIdentity.stage
        || (resolution.review_track ?? null) !== baseIdentity.review_track
        || resolution.previous_result_ref !== current.head_result_ref
        || resolution.previous_result_sha256 !== hash(resultRaw)
        || resolution.previous_snapshot_tree !== result.snapshot_tree
        || resolution.snapshot_tree !== snapshot.tree
        || resolution.evidence_state !== "verified"
        || resolution.change_classification?.structural !== true
        || structuralDimensions.length === 0) {
      throw new Error("review flow reset requires the current authenticated structural resolution");
    }
    const baseFlowId = reviewFlowId(baseIdentity);
    return task.withRecordLock(`locks/review-flow-resets/${baseFlowId}.lock`, () =>
      task.withRecordLock(`locks/review-flows/${reviewFlowId(previousIdentity)}.lock`, () => {
        const liveReset = activeReviewFlowReset(baseIdentity);
        if ((liveReset?.hash ?? null) !== (previousReset?.hash ?? null)) {
          throw new Error("review flow reset CAS failed: active generation changed");
        }
        const live = readReviewFlow(previousIdentity);
        if (live?.head_result_ref !== current.head_result_ref || live?.event_ref !== current.event_ref) {
          throw new Error("review flow reset CAS failed: current head changed");
        }
        const sequence = (previousReset?.record.sequence ?? 0) + 1;
        const ref = `reviews/flow-resets/${baseFlowId}/reset-${String(sequence).padStart(4, "0")}.json`;
        const record = {
          schema_version: "review-flow-reset.v1",
          task_id: task.identity.taskId,
          reset_ref: ref,
          base_flow_id: baseFlowId,
          sequence,
          base_identity: baseIdentity,
          previous_identity: previousIdentity,
          previous_reset_ref: previousReset?.ref ?? null,
          previous_reset_hash: previousReset?.hash ?? null,
          previous_head_ref: current.head_result_ref,
          previous_head_hash: hash(resultRaw),
          previous_event_ref: current.event_ref,
          previous_event_hash: hash(task.readRecord(current.event_ref)),
          previous_snapshot_tree: result.snapshot_tree,
          current_snapshot_tree: snapshot.tree,
          resolution_ref: resolutionRef,
          resolution_hash: hash(resolutionRaw),
          structural_dimensions: structuralDimensions,
          reason,
          created_at: now(),
        };
        const raw = `${JSON.stringify(record, null, 2)}\n`;
        validateReviewFlowReset({
          record,
          taskId: task.identity.taskId,
          resetRef: ref,
          baseFlowId,
          sequence,
          baseIdentity,
          previousIdentity,
          previousResetRef: previousReset?.ref ?? null,
          previousResetHash: previousReset?.hash ?? null,
          previousFlow: current,
          previousResult: result,
          previousHeadHash: hash(resultRaw),
          previousEventHash: hash(task.readRecord(current.event_ref)),
          resolution,
          resolutionHash: hash(resolutionRaw),
        });
        createKernelRecord(ref, raw);
        const resetHash = hash(raw);
        return deepFreeze({
          reset_ref: ref,
          reset_hash: resetHash,
          identity: normalizeReviewFlowIdentity(task, {
            ...baseIdentity,
            workflow_run_id: `${baseIdentity.workflow_run_id}:review-reset:${resetHash}`,
          }),
        });
      }));
  };
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
    publishCanonicalRecord(relativePath, data) {
      if (typeof relativePath !== "string" || !/^(?:receipts|reviews|evidence)\//.test(relativePath) || relativePath.includes("..")) throw new Error("canonical receipt namespace required");
      if (relativePath === BUILD_SPEC_RECOVERY_REFS.marker || relativePath.startsWith("receipts/revisions/spec/")) {
        throw new Error("trusted prepublish recovery is required; build-spec recovery authority owns this namespace");
      }
      if (relativePath.startsWith("reviews/flows/")) throw new Error("review flow records require TaskKernel review-flow authority");
      if (relativePath.startsWith("reviews/resolutions/")) throw new Error("review resolutions require TaskKernel review-flow authority");
      if (relativePath.startsWith("evidence/risk-acceptances/")) throw new Error("risk acceptance records require TaskKernel review-risk authority");
      return createKernelRecord(relativePath, data);
    },
    recoverBuildSpecReceiptRecords(records, ownerCapability) {
      if (!workspace || !artifacts) throw new Error("build-spec receipt recovery requires Workspace and ArtifactDir capabilities");
      plain(records, "build-spec receipt recovery records");
      rejectUnknown(records, new Set(["revisionRef", "revisionRaw", "markerRaw"]), "build-spec receipt recovery records");
      if (typeof records.revisionRef !== "string" || typeof records.revisionRaw !== "string"
          || typeof records.markerRaw !== "string") {
        throw new TypeError("build-spec receipt recovery records must contain revisionRef, revisionRaw, and markerRaw");
      }
      const invocation = consumeBuildSpecRecoveryOwnerCapability({
        task,
        workspace,
        capability: ownerCapability,
      });
      const flowIdentity = deriveReviewFlowIdentity({
        stage: "build-spec",
        review_track: null,
        subject_kind: "worktree",
        phase_id: null,
        review_scope: null,
      });
      const flowId = reviewFlowId(flowIdentity);
      return task.withRecordLock(`locks/review-flow-execution/${flowId}.lock`, () =>
        task.withRecordLock(`locks/review-flows/${flowId}.lock`, () =>
          task.withRecordLock("locks/build-spec.publication.lock", () => {
            if (task.listStageAttemptRefs("build-spec").length !== 0) {
              throw new Error("build-spec receipt recovery requires no published stage attempt");
            }
            const checkpointPrefix = `refs/workflowhub/checkpoints/${task.identity.projectName}/${task.identity.taskId}/build-spec/`;
            const checkpointRefs = String(execFileSync(
              "git",
              ["for-each-ref", "--format=%(refname)", checkpointPrefix],
              { cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
            )).trim();
            if (checkpointRefs !== "") throw new Error("build-spec receipt recovery requires no published checkpoint");

            const baseRaw = task.readRecord(BUILD_SPEC_RECOVERY_REFS.base);
            validateBuildSpecBase(parseJson(baseRaw, "build-spec base receipt"), baseRaw, task.identity.taskId);
            const content = artifacts.read("spec.md", "utf8");
            const snapshot = captureGitWorktreeSnapshot(workspace.worktreeRoot);
            const flow = readReviewFlow(flowIdentity);
            if (flow === null) throw new Error("build-spec receipt recovery requires an authenticated review flow");
            const action = buildSpecReviewAction(task, { authentication: { flow } });
            const reviewRaw = task.readRecord(action.head_result_ref);
            if (hash(reviewRaw) !== action.head_result_hash) throw new Error("build-spec authenticated review result changed");
            const actionRaw = task.readRecord(action.action_ref);
            if (hash(actionRaw) !== action.action_hash) throw new Error("build-spec authenticated review action changed");
            const actionValue = parseJson(actionRaw, "build-spec authenticated review action");
            if (actionValue.task_id !== task.identity.taskId || actionValue.stage !== "build-spec"
                || actionValue.snapshot_tree !== snapshot.tree) {
              throw new Error("build-spec recovery review action does not bind the final current snapshot");
            }

            const revision = parseJson(records.revisionRaw, "build-spec recovered receipt");
            validateBuildSpecRevision(revision, records.revisionRaw, {
              ref: records.revisionRef,
              taskId: task.identity.taskId,
              baseHash: hash(baseRaw),
              content,
            });
            const marker = parseJson(records.markerRaw, "build-spec receipt recovery marker");
            validateBuildSpecRecoveryMarker(marker, records.markerRaw, {
              taskId: task.identity.taskId,
              baseRaw,
              recoveredRaw: records.revisionRaw,
              recoveredRef: records.revisionRef,
              artifactRef: artifacts.reference("spec.md"),
              content,
              snapshotTree: snapshot.tree,
              action,
              invocation,
            });

            let existingMarkerRaw;
            try { existingMarkerRaw = task.readRecord(BUILD_SPEC_RECOVERY_REFS.marker); }
            catch (error) {
              if (error?.code !== "ENOENT") throw error;
            }
            if (existingMarkerRaw !== undefined) {
              const existingMarker = parseJson(existingMarkerRaw, "existing build-spec receipt recovery marker");
              let existingInvocation;
              try {
                const identity = parseJson(
                  task.readRecord(existingMarker.invocation?.ref),
                  "existing build-spec recovery invocation",
                );
                existingInvocation = validateBuildSpecRecoveryInvocation(task, {
                  ...existingMarker.invocation,
                  identity,
                });
                validateBuildSpecRecoveryMarker(existingMarker, existingMarkerRaw, {
                  taskId: task.identity.taskId,
                  baseRaw,
                  recoveredRaw: records.revisionRaw,
                  recoveredRef: records.revisionRef,
                  artifactRef: artifacts.reference("spec.md"),
                  content,
                  snapshotTree: snapshot.tree,
                  action,
                  invocation: existingInvocation,
                });
              } catch {
                throw new Error("build-spec bootstrap recovery is frozen to its recorded invocation, review action, snapshot, and content");
              }
              const existingRevisionRaw = task.readRecord(records.revisionRef);
              if (existingRevisionRaw !== records.revisionRaw) {
                throw new Error("build-spec recovered revision conflicts with the authoritative recovery");
              }
              return deepFreeze({
                receipt_ref: records.revisionRef,
                receipt_hash: hash(records.revisionRaw),
                revision: true,
                previous_receipt_ref: BUILD_SPEC_RECOVERY_REFS.base,
                previous_receipt_hash: hash(baseRaw),
                content_hash: revision.revision.content_hash,
                recovery_marker_ref: BUILD_SPEC_RECOVERY_REFS.marker,
                recovery_marker_hash: hash(existingMarkerRaw),
              });
            }

            if (buildSpecRecoveryTestHooks?.seedRevisionRaw !== undefined) {
              try { createKernelRecord(records.revisionRef, buildSpecRecoveryTestHooks.seedRevisionRaw); }
              catch (error) {
                if (error?.code !== "EEXIST") throw error;
              }
            }
            let existingRevisionRaw;
            try { existingRevisionRaw = task.readRecord(records.revisionRef); }
            catch (error) {
              if (error?.code !== "ENOENT") throw error;
            }
            if (existingRevisionRaw === undefined) createKernelRecord(records.revisionRef, records.revisionRaw);
            else if (existingRevisionRaw !== records.revisionRaw) {
              throw new Error("build-spec recovered revision conflicts with existing provenance");
            }
            buildSpecRecoveryTestHooks?.afterRevision?.();
            createKernelRecord(BUILD_SPEC_RECOVERY_REFS.marker, records.markerRaw);
            return deepFreeze({
              receipt_ref: records.revisionRef,
              receipt_hash: hash(records.revisionRaw),
              revision: true,
              previous_receipt_ref: BUILD_SPEC_RECOVERY_REFS.base,
              previous_receipt_hash: hash(baseRaw),
              content_hash: revision.revision.content_hash,
              recovery_marker_ref: BUILD_SPEC_RECOVERY_REFS.marker,
              recovery_marker_hash: hash(records.markerRaw),
            });
          })));
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
    invalidateStageRun,
    invalidateStageStepAttempt,
    invalidateStageAttempt,
    invalidateReviewBinding,
    createStageContinuation,
    activeStageRun,
    publishRequirementsLedger,
    writeStageStepEntry,
    writeStageStepExit,
    prepareMakeDecisionInteractionPublication,
    completeMakeDecisionInteractionPublication,
    completeMakeDecisionResearch,
    completeMakeDecisionReceipt,
    deriveStageWorkflowRunId,
    deriveReviewFlowIdentity,
    createReviewFlowReset,
    readActiveReviewFlowReset(value) {
      const baseIdentity = deriveBaseReviewFlowIdentity(value);
      const reset = activeReviewFlowReset(baseIdentity);
      if (reset === null) return null;
      return deepFreeze({
        reset_ref: reset.ref,
        reset_hash: reset.hash,
        record: structuredClone(reset.record),
      });
    },
    adoptLegacyReviewRoot,
    withReviewFlowLock(value, operation) {
      if (typeof operation !== "function") throw new TypeError("review flow operation must be a function");
      const identity = normalizeReviewFlowIdentity(task, value);
      return task.withRecordLock(`locks/review-flow-execution/${reviewFlowId(identity)}.lock`, operation);
    },
    createCheckpoint(stage, options = {}) {
      if (!workspace || !artifacts) throw new Error("Git checkpoint requires Workspace and ArtifactDir capabilities");
      const name = stageName(stage);
      if (options.baselineRebindRef !== undefined) {
        if (name !== "build-plan") throw new Error("baseline rebind is only valid for build-plan");
        const authorization = assertBaselineRebind(options.baselineRebindRef);
        return createGitCheckpoint({ workspace, artifacts, task, stage: name, baseCommit: authorization.record.integration_head, baseTree: authorization.record.base_tree, baselineRebindHash: authorization.hash });
      }
      if (Object.keys(options).length) throw new Error("unsupported checkpoint options");
      return createGitCheckpoint({ workspace, artifacts, task, stage: name, ...checkpointBase(name) });
    },
    authorizeBuildPlanBaselineRebind(stage = "build-plan") {
      if (stage !== "build-plan") throw new Error("baseline rebind is only valid for build-plan");
      if (!workspace || !artifacts) throw new Error("build-plan baseline rebind requires Workspace and ArtifactDir capabilities");
      return task.withRecordLock("locks/build-plan.publication.lock", () => {
        const plan = readAcceptedLocal("build-plan");
        const spec = readAcceptedLocal("build-spec");
        const repoRoot = assertWorkspace(workspace).worktreeRoot;
        const snapshot = captureGitWorktreeSnapshot(repoRoot);
        const integrationTree = String(execFileSync("git", ["rev-parse", `${snapshot.head}^{tree}`], { cwd: repoRoot, encoding: "utf8" })).trim();
        const decisionBaseTree = overlayCheckpointArtifacts({
          repoRoot,
          baseTree: integrationTree,
          artifacts: [acceptedDecisionMaterial()],
        });
        const baseTree = overlayCheckpointArtifacts({ repoRoot, baseTree: decisionBaseTree, artifacts: spec.accepted.checkpoint.artifacts });
        const expectedTree = overlayCheckpointArtifacts({ repoRoot, baseTree, artifacts: plan.accepted.checkpoint.artifacts });
        if (snapshot.tree !== expectedTree) throw new Error("build-plan baseline rebind rejects changed design bytes or unrelated Workspace drift");
        const payload = {
          schema_version: "build-plan-baseline-rebind.v1", task_id: task.identity.taskId, stage: "build-plan",
          previous_accepted_ref: plan.accepted_ref, previous_accepted_hash: plan.accepted_hash,
          previous_accepted_raw: task.readRecord(plan.accepted_ref),
          previous_attempt_ref: plan.accepted.attempt_ref, previous_attempt_hash: String(plan.accepted.integrity_hash).replace(/^sha256:/, ""),
          accepted_spec_ref: spec.accepted_ref, accepted_spec_hash: spec.accepted_hash,
          accepted_spec_attempt_ref: spec.accepted.attempt_ref, accepted_spec_attempt_hash: String(spec.accepted.integrity_hash).replace(/^sha256:/, ""),
          accepted_spec_checkpoint_commit: spec.accepted.checkpoint.commit_oid, accepted_spec_checkpoint_tree: spec.accepted.checkpoint.tree_oid,
          integration_head: snapshot.head, integration_tree: integrationTree, base_tree: baseTree, workspace_tree: snapshot.tree,
          authorized_at: now(),
        };
        for (let sequence = 1; sequence <= 9999; sequence += 1) {
          const ref = `results/build-plan/revisions/baseline-rebind-${String(sequence).padStart(4, "0")}.json`;
          try {
            const existing = readBaselineRebind(ref);
            const comparable = { ...existing.record, authorized_at: payload.authorized_at };
            if (JSON.stringify(comparable) === JSON.stringify(payload)) return deepFreeze(existing);
          } catch (error) { if (error?.code !== "ENOENT") throw error; }
          const raw = `${JSON.stringify(payload, null, 2)}\n`;
          try { createKernelRecord(ref, raw); return deepFreeze({ ref, raw, hash: hash(raw), record: payload }); }
          catch (error) { if (error?.code !== "EEXIST") throw error; }
        }
        throw new Error("build-plan baseline rebind sequence exhausted");
      });
    },
    readBuildCodeAdjudicationCorrection(correctionRef, { phaseId, snapshotTree } = {}) {
      const correction = readAdjudicationCorrection(correctionRef);
      if (correction.record.phase_id !== phaseId || correction.record.repair?.snapshot_tree !== snapshotTree) {
        throw new Error("build-code adjudication correction does not bind the requested Phase repair snapshot");
      }
      return deepFreeze(correction);
    },
    authorizeBuildCodeAdjudicationCorrection({
      phaseId,
      priorResultRef,
      findingId,
      repairImplementationReceiptRef,
      repairTestReceiptRef,
    } = {}) {
      if (!workspace) throw new Error("build-code adjudication correction requires an active Workspace");
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(phaseId ?? "")) throw new TypeError("build-code adjudication correction phaseId is invalid");
      if (!RESULT_REF_FOR_FLOW.test(priorResultRef ?? "")) throw new TypeError("build-code adjudication correction priorResultRef is invalid");
      if (!/^F-[a-f0-9]{12,16}$/.test(findingId ?? "")) throw new TypeError("build-code adjudication correction findingId is invalid");
      if (!/^receipts\/revisions\/implementation\/[a-f0-9]{64}\.json$/.test(repairImplementationReceiptRef ?? "")
          || !/^receipts\/[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/.test(repairTestReceiptRef ?? "")) {
        throw new TypeError("build-code adjudication correction repair receipt refs are invalid");
      }
      const correctionRef = `results/build-code/revisions/adjudication-correction-${phaseId}.json`;
      return task.withRecordLock(`locks/build-code-adjudication-correction-${phaseId}.lock`, () => {
        try {
          readAdjudicationCorrection(correctionRef);
          throw new Error(`build-code Phase ${phaseId} already used its one adjudication correction`);
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
        try {
          readAcceptedLocal("build-code", { allowLegacyBuildCode: true });
          throw new Error("build-code adjudication correction is unavailable after build-code acceptance");
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }

        const priorResultRaw = task.readRecord(priorResultRef);
        const priorResult = parseJson(priorResultRaw, "prior build-code review result");
        validateSchema("result", priorResult);
        if (priorResult.stage !== "build-code" || priorResult.subject_kind !== "phase"
            || priorResult.phase_id !== phaseId || priorResult.review_scope !== "phase"
            || priorResult.verdict !== "pass") {
          throw new Error("adjudication correction requires a passed build-code Phase result");
        }
        const priorAttemptRef = priorResult.attempt_ref;
        const priorAttemptRaw = task.readRecord(priorAttemptRef);
        const priorAttempt = parseJson(priorAttemptRaw, "prior build-code review attempt");
        validateSchema("attempt", priorAttempt);
        const cluster = priorResult.adjudication?.clusters?.find(({ id }) => id === findingId);
        if (!cluster) throw new Error("adjudication correction finding is absent from the prior result");
        const providerFinding = priorResult.provider_results?.flatMap(({ provider, output }) =>
          output?.verdict === "revise_required"
            ? (output.findings ?? []).map((finding) => ({ provider, verdict: output.verdict, finding }))
            : []).find(({ provider, finding }) =>
          cluster.providers?.includes(provider) && finding.severity === cluster.severity
          && finding.path === cluster.path && finding.issue === cluster.issue);
        if (!providerFinding) throw new Error("adjudication correction has no matching original provider finding");

        const identity = deriveReviewFlowIdentity({
          stage: "build-code",
          review_track: null,
          subject_kind: "phase",
          phase_id: phaseId,
          review_scope: "phase",
          snapshot_tree: priorResult.snapshot_tree,
        });
        const flow = readReviewFlow(identity);
        if (!flow || flow.head_result_ref !== priorResultRef || flow.result_sha256 !== hash(priorResultRaw)
            || flow.event_kind !== "semantic_result") {
          throw new Error("adjudication correction prior result is not the authenticated review-flow head");
        }

        const implementationRaw = task.readRecord(repairImplementationReceiptRef);
        const implementation = parseJson(implementationRaw, "repair implementation receipt");
        const testRaw = task.readRecord(repairTestReceiptRef);
        const tests = parseJson(testRaw, "repair test receipt");
        if (implementation.snapshot_tree !== tests.snapshot_tree) {
          throw new Error("adjudication correction repair receipts do not share one snapshot");
        }
        const repoRoot = assertWorkspace(workspace).worktreeRoot;
        const phaseResult = parseJson(task.readRecord("phase-result.json"), "current Phase result");
        const phaseEvidenceRef = phaseResult.evidence?.canonical_phase_evidence_ref;
        if (phaseResult.phase_id !== phaseId || phaseResult.status !== "awaiting_review"
            || phaseResult.evidence?.implementation_receipt_ref !== repairImplementationReceiptRef
            || phaseResult.evidence?.green_test_receipt_ref !== repairTestReceiptRef
            || !new RegExp(`^evidence/phases/${phaseId}/${implementation.snapshot_tree}/phase-evidence-[a-f0-9]{64}\\.json$`).test(phaseEvidenceRef ?? "")) {
          throw new Error("adjudication correction current Phase result does not bind the repair receipts and snapshot");
        }
        const phaseEvidenceRaw = task.readRecord(phaseEvidenceRef);
        const phaseEvidence = parseJson(phaseEvidenceRaw, "repair Phase evidence");
        if (phaseEvidence.phase_id !== phaseResult.phase_id || phaseEvidence.status !== phaseResult.status
            || phaseEvidence.evidence?.implementation_receipt_ref !== repairImplementationReceiptRef
            || phaseEvidence.evidence?.green_test_receipt_ref !== repairTestReceiptRef) {
          throw new Error("adjudication correction canonical Phase evidence does not match the current Phase result");
        }
        const readSnapshotFile = (tree, path) => {
          if (!GIT_OID.test(tree ?? "") || typeof path !== "string" || path.startsWith("/") || path.includes("..") || path.includes(":")) {
            throw new Error("adjudication correction snapshot path is invalid");
          }
          try {
            return String(execFileSync("git", ["show", `${tree}:${path}`], {
              cwd: repoRoot,
              encoding: "utf8",
              stdio: ["ignore", "pipe", "pipe"],
            }));
          } catch (error) {
            throw new Error("adjudication correction cannot read the finding path from the bound snapshot", { cause: error });
          }
        };
        let priorParseError;
        try { JSON.parse(readSnapshotFile(priorResult.snapshot_tree, cluster.path)); }
        catch (error) { priorParseError = error instanceof Error ? error.message : String(error); }
        if (!priorParseError) throw new Error("adjudication correction mechanical proof did not reproduce a JSON parse failure");
        JSON.parse(readSnapshotFile(implementation.snapshot_tree, cluster.path));
        const proofValue = {
          schema_version: "workflowhub-mechanical-proof.v1",
          kind: "json_parse_failure",
          path: cluster.path,
          prior_snapshot_tree: priorResult.snapshot_tree,
          repair_snapshot_tree: implementation.snapshot_tree,
          prior_error: priorParseError,
        };
        const proofRaw = `${JSON.stringify(proofValue, null, 2)}\n`;
        const proofHash = hash(proofRaw);
        const proofRef = `evidence/adjudication-corrections/${proofHash}.json`;
        const correction = {
          schema_version: "workflowhub-build-code-adjudication-correction.v1",
          task_id: task.identity.taskId,
          stage: "build-code",
          phase_id: phaseId,
          prior_snapshot_tree: priorResult.snapshot_tree,
          prior_result_ref: priorResultRef,
          prior_result_hash: hash(priorResultRaw),
          prior_attempt_ref: priorAttemptRef,
          prior_attempt_hash: hash(priorAttemptRaw),
          finding_id: findingId,
          finding_severity: cluster.severity,
          prior_disposition: cluster.disposition,
          provider_verdict: providerFinding.verdict,
          proof: { kind: "mechanical", evidence_ref: proofRef, evidence_hash: proofHash },
          repair: {
            implementation_receipt_ref: repairImplementationReceiptRef,
            implementation_receipt_hash: hash(implementationRaw),
            test_receipt_ref: repairTestReceiptRef,
            test_receipt_hash: hash(testRaw),
            phase_evidence_ref: phaseEvidenceRef,
            phase_evidence_hash: hash(phaseEvidenceRaw),
            snapshot_tree: implementation.snapshot_tree,
          },
          authorized_at: now(),
        };
        validateBuildCodeAdjudicationCorrection({
          correction,
          priorResult: { ref: priorResultRef, hash: hash(priorResultRaw), value: priorResult },
          priorAttempt: { ref: priorAttemptRef, hash: hash(priorAttemptRaw), value: priorAttempt },
          providerFinding,
          proof: { ref: proofRef, hash: proofHash, value: proofValue },
          implementationReceipt: { ref: repairImplementationReceiptRef, hash: hash(implementationRaw), value: implementation },
          testReceipt: { ref: repairTestReceiptRef, hash: hash(testRaw), value: tests },
          phaseEvidence: { ref: phaseEvidenceRef, hash: hash(phaseEvidenceRaw), value: phaseEvidence },
          existingCorrections: [],
          readSnapshotFile,
        });
        createKernelRecord(proofRef, proofRaw);
        const raw = `${JSON.stringify(correction, null, 2)}\n`;
        createKernelRecord(correctionRef, raw);
        return deepFreeze({ correction_ref: correctionRef, correction_hash: hash(raw), record: correction });
      });
    },
    prepareReviewRiskPause({
      stage,
      reviewResultRef,
      revisionRef,
      adjudicationCorrectionRef,
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
        ...(revisionRef === undefined ? {} : { revision_ref: revisionRef }),
        ...(adjudicationCorrectionRef === undefined ? {} : { adjudication_correction_ref: adjudicationCorrectionRef }),
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
      revisionRef,
      adjudicationCorrectionRef,
    } = {}) {
      const pause = kernel.prepareReviewRiskPause({
        stage,
        reviewResultRef,
        ...(revisionRef === undefined ? {} : { revisionRef }),
        ...(adjudicationCorrectionRef === undefined ? {} : { adjudicationCorrectionRef }),
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
      const name = stageName(stage);
      if (data.verify_failure_publication !== undefined && !controlledVerifyFailurePublications.has(data)) {
        throw new Error("verify-code controlled failure publication requires the official kernel entrypoint");
      }
      if (data.verify_passing_publication !== undefined && !controlledVerifyPassingPublications.has(data)) {
        throw new Error("verify-code controlled passing publication requires the official kernel entrypoint");
      }
      return task.withRecordLock(`locks/${name}.publication.lock`, () => {
        let current;
        const activeContinuation = name === "build-spec"
          && trustedActiveStageRun(name)?.run?.continuation_ref !== undefined;
        try {
          current = activeContinuation
            ? readAcceptedBuildSpecForContinuation()
            : readAcceptedLocal(name, {
              allowLegacyBuildCode: name === "build-code" && data.reopen_provenance !== undefined,
            });
        }
        catch (error) { if (error?.code !== "ENOENT") throw error; }
        const controlledVerifyFailure = data.verify_failure_publication !== undefined;
        const controlledVerifyPassing = data.verify_passing_publication !== undefined;
        const baselineRebind = name === "build-plan" && data.baseline_rebind_ref !== undefined;
        const continuationPublication = name === "make-decision" && allowsAcceptedMakeDecisionContinuation(current);
        const buildSpecContinuation = current && activeContinuation
          ? assertAcceptedBuildSpecContinuation(current)
          : null;
        if (current && name !== "build-code" && !controlledVerifyFailure && !controlledVerifyPassing
            && !baselineRebind && !continuationPublication && !buildSpecContinuation) {
          throw new Error(`${name} is accepted and closed`);
        }
        let baselineRebindAuthorization;
        if (baselineRebind) baselineRebindAuthorization = assertBaselineRebind(data.baseline_rebind_ref, current);
        if (controlledVerifyFailure) {
          if (name !== "verify-code" || !current) throw new Error("controlled verify failure publication requires an accepted verify-code stage");
          const activeBuild = readAcceptedLocal("build-code");
          const publication = data.verify_failure_publication;
          const workspaceCapability = assertWorkspace(workspace);
          const snapshot = captureGitWorktreeSnapshot(workspaceCapability.worktreeRoot);
          if (publication.previous_accepted_ref !== current.accepted_ref || publication.previous_accepted_hash !== current.accepted_hash || publication.previous_attempt_ref !== current.accepted.attempt_ref || publication.previous_attempt_hash !== String(current.accepted.integrity_hash).replace(/^sha256:/, "") || publication.active_build_accepted_ref !== activeBuild.accepted_ref || publication.active_build_accepted_hash !== activeBuild.accepted_hash || publication.active_build_attempt_ref !== activeBuild.accepted.attempt_ref || publication.active_build_attempt_hash !== String(activeBuild.accepted.integrity_hash).replace(/^sha256:/, "") || publication.workspace_head !== snapshot.head || publication.workspace_tree !== snapshot.tree) {
            throw new Error("controlled verify failure publication binding changed before publication");
          }
          const failure = readFailureEvidence(publication.failure_evidence_ref);
          if (failure.hash !== publication.failure_evidence_hash) throw new Error("controlled verify failure publication evidence changed before publication");
          duplicateVerifyFailurePublication(publication);
        }
        if (controlledVerifyPassing) {
          if (name !== "verify-code" || !current) throw new Error("controlled verify passing publication requires an accepted verify-code stage");
          const activeBuild = readAcceptedLocal("build-code");
          const publication = data.verify_passing_publication;
          if (publication.previous_accepted_ref !== current.accepted_ref || publication.previous_accepted_hash !== current.accepted_hash || publication.previous_attempt_ref !== current.accepted.attempt_ref || publication.previous_attempt_hash !== String(current.accepted.integrity_hash).replace(/^sha256:/, "") || publication.active_build_accepted_ref !== activeBuild.accepted_ref || publication.active_build_accepted_hash !== activeBuild.accepted_hash || publication.active_build_attempt_ref !== activeBuild.accepted.attempt_ref || publication.active_build_attempt_hash !== String(activeBuild.accepted.integrity_hash).replace(/^sha256:/, "")) {
            throw new Error("controlled verify passing publication binding changed before publication");
          }
          assertPassingMaterials(publication, data.facts, data.evidence_refs ?? [], current, activeBuild);
          duplicateVerifyPassingPublication(publication);
        }
        if (current && name === "build-code") {
          const reopen = assertReopenProvenance(data.reopen_provenance, current);
          rejectPublishedBuildReopen(reopen.ref);
        }
        if (!current && data.reopen_provenance !== undefined) throw new Error("build-code reopen provenance requires an accepted build-code stage");
        validateRefs(data.upstream_refs ?? [], "upstream_refs");
        if (data.upstream_acceptances !== undefined) throw new Error("upstream_acceptances are kernel-derived and cannot be supplied");
        const upstreamAcceptances = verifyUpstream(name, data.upstream_refs ?? []);
        const missingItems = [...(data.missing_items ?? [])];
        const auditSupportMissing = missingItems.includes("support:audit");
        if (auditSupportMissing
            && AUDIT_FACT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(data.facts, key))) {
          throw new Error(`${name} missing audit support cannot publish unauthenticated audit facts`);
        }
        validateStageFacts(name, data.facts, { allowMissingAuditSupport: auditSupportMissing });
        if (name === "make-decision" && candidate && (resolve(data.facts.worktree_root) !== candidate.worktreeRoot || data.facts.baseline_commit !== candidate.baselineCommit)) {
          throw new Error("make-decision facts do not match CandidateWorkspace");
        }
        if (name === "make-decision") verifyCandidateSnapshot(data.facts);
        if (!auditSupportMissing) verifyAuditPublication(name, data.facts);
        if (["build-spec", "build-plan"].includes(name)) {
          assertGitCheckpointPlan(data.facts.checkpoint);
          const base = baselineRebindAuthorization ? { baseCommit: baselineRebindAuthorization.record.integration_head, baseTree: baselineRebindAuthorization.record.base_tree } : checkpointBase(name);
          verifyGitCheckpointPlan({ workspace, artifacts, task, plan: data.facts.checkpoint, ...base, ...(baselineRebindAuthorization ? { baselineRebindHash: baselineRebindAuthorization.hash } : {}) });
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
            facts: structuredClone(data.facts),
            evidence_refs: [...(data.evidence_refs ?? [])],
            missing_items: [...(data.missing_items ?? [])],
            upstream_refs: structuredClone(data.upstream_refs ?? []),
            ...(upstreamAcceptances.length ? { upstream_acceptances: upstreamAcceptances } : {}),
            ...(data.reopen_provenance ? { reopen_provenance: structuredClone(data.reopen_provenance) } : {}),
            ...(buildSpecContinuation ? { build_spec_continuation_provenance: structuredClone(buildSpecContinuation) } : {}),
            ...(baselineRebindAuthorization ? { baseline_rebind_provenance: { authorization_ref: baselineRebindAuthorization.ref, authorization_hash: baselineRebindAuthorization.hash } } : {}),
            ...(data.verify_failure_publication ? { verify_failure_publication: structuredClone(data.verify_failure_publication) } : {}),
            ...(data.verify_passing_publication ? { verify_passing_publication: structuredClone(data.verify_passing_publication) } : {}),
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
    publishVerifyFailureFromAccepted({ failureEvidenceRef } = {}) {
      const previousVerify = readAcceptedLocal("verify-code");
      const activeBuild = readAcceptedLocal("build-code");
      const workspaceCapability = assertWorkspace(workspace);
      const snapshot = captureGitWorktreeSnapshot(workspaceCapability.worktreeRoot);
      const failure = readFailureEvidence(failureEvidenceRef);
      const evidenceRefs = [...previousVerify.facts.evidence_refs];
      if (!evidenceRefs.some((entry) => entry.ref === failure.ref && entry.sha256 === failure.hash)) evidenceRefs.push({ ref: failure.ref, sha256: failure.hash });
      const publication = {
        previous_accepted_ref: previousVerify.accepted_ref,
        previous_accepted_hash: previousVerify.accepted_hash,
        previous_attempt_ref: previousVerify.accepted.attempt_ref,
        previous_attempt_hash: String(previousVerify.accepted.integrity_hash).replace(/^sha256:/, ""),
        active_build_accepted_ref: activeBuild.accepted_ref,
        active_build_accepted_hash: activeBuild.accepted_hash,
        active_build_attempt_ref: activeBuild.accepted.attempt_ref,
        active_build_attempt_hash: String(activeBuild.accepted.integrity_hash).replace(/^sha256:/, ""),
        failure_evidence_ref: failure.ref,
        failure_evidence_hash: failure.hash,
        workspace_head: snapshot.head,
        workspace_tree: snapshot.tree,
      };
      const data = {
        facts: { ...structuredClone(previousVerify.facts), evidence_refs: evidenceRefs },
        evidence_refs: [{ ref: failure.ref, sha256: failure.hash }],
        upstream_refs: [{ task_id: task.identity.taskId, stage: "build-code", accepted_ref: "results/build-code/accepted.json" }],
        verify_failure_publication: publication,
      };
      controlledVerifyFailurePublications.add(data);
      return kernel.publishAttempt("verify-code", data);
    },
    publishVerifyPassingFromAccepted({ facts, evidenceRefs = [], missingItems = [], reason } = {}) {
      validateStageFacts("verify-code", facts);
      validateEvidenceRefs(evidenceRefs, "verify-code passing attempt evidence_refs");
      const previousVerify = readAcceptedLocal("verify-code");
      const activeBuild = readAcceptedLocal("build-code");
      const snapshot = captureGitWorktreeSnapshot(assertWorkspace(workspace).worktreeRoot);
      const reviewBinding = reviewFactBinding(facts.review, "verify-code passing review");
      const publication = {
        previous_accepted_ref: previousVerify.accepted_ref,
        previous_accepted_hash: previousVerify.accepted_hash,
        previous_attempt_ref: previousVerify.accepted.attempt_ref,
        previous_attempt_hash: String(previousVerify.accepted.integrity_hash).replace(/^sha256:/, ""),
        active_build_accepted_ref: activeBuild.accepted_ref,
        active_build_accepted_hash: activeBuild.accepted_hash,
        active_build_attempt_ref: activeBuild.accepted.attempt_ref,
        active_build_attempt_hash: String(activeBuild.accepted.integrity_hash).replace(/^sha256:/, ""),
        test_receipt_ref: facts.tests.receipt_ref,
        test_receipt_hash: facts.tests.receipt_hash,
        review_result_ref: reviewBinding.ref,
        review_result_hash: reviewBinding.hash,
        acceptance_evidence_refs: structuredClone(facts.evidence_refs),
        workspace_head: snapshot.head,
        workspace_tree: snapshot.tree,
      };
      const data = {
        facts: structuredClone(facts),
        evidence_refs: structuredClone(evidenceRefs),
        missing_items: structuredClone(missingItems),
        upstream_refs: [{ task_id: task.identity.taskId, stage: "build-code", accepted_ref: "results/build-code/accepted.json" }],
        verify_passing_publication: publication,
        ...(reason !== undefined ? { reason } : {}),
      };
      controlledVerifyPassingPublications.add(data);
      return kernel.publishAttempt("verify-code", data);
    },
    confirmAttempt(stage, attemptRef, decision) {
      const name = stageName(stage);
      if (!requiresHumanConfirmation(name)) throw new Error(`${name} uses automatic acceptance and does not accept human confirmation`);
      if (!ATTEMPT_REF.test(attemptRef ?? "")) throw new Error("invalid attemptRef");
      if (!new Set(["accepted", "rejected"]).has(decision)) throw new TypeError("explicit confirmation decision must be accepted or rejected");
      const attempt = validateAttempt(parseJson(task.readRecord(`results/${name}/${attemptRef}`), `${name} attempt`), { taskId: task.identity.taskId, stage: name });
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
        let fullAudit;
        if (name === "verify-code" && attempt.verification_failure === true) {
          throw new Error("cannot accept a failed verify-code attempt");
        }
        const readAndValidateConfirmation = (expectedRaw) => {
          const raw = task.readRecord(humanConfirmationRef);
          if (expectedRaw !== undefined && raw !== expectedRaw) throw new Error("human confirmation changed during acceptance");
          const value = parseJson(raw, "human confirmation");
          rejectUnknown(value, new Set(["schema_version", "task_id", "stage", "attempt_ref", "decision", "confirmed_at", "checkpoint_plan_hash"]), "human confirmation");
          if (value.decision === "rejected") throw new Error("rejected confirmation leaves checkpoint ref unpublished");
          if (value.schema_version !== "human-confirmation.v1" || value.task_id !== task.identity.taskId || value.stage !== name || value.attempt_ref !== attemptRef || value.decision !== "accepted" || !Number.isFinite(Date.parse(value.confirmed_at))) throw new Error("human confirmation does not bind this task/stage/attempt");
          return { raw, value };
        };
        let current;
        const activeContinuation = name === "build-spec"
          && trustedActiveStageRun(name)?.run?.continuation_ref !== undefined;
        try {
          current = activeContinuation
            ? readAcceptedBuildSpecForContinuation()
            : readAcceptedLocal(name, {
              allowLegacyBuildCode: name === "build-code" && attempt.reopen_provenance !== undefined,
            });
        }
        catch (error) { if (error?.code !== "ENOENT") throw error; }
        if (name === "make-decision" && current?.accepted.attempt_ref === attemptRef) {
          if (current.accepted.human_confirmation_ref !== humanConfirmationRef) {
            throw new Error("make-decision attempt is already accepted with different final bindings");
          }
          readAndValidateConfirmation();
          return current.accepted;
        }
        const controlledVerifyPassing = name === "verify-code" && attempt.verify_passing_publication !== undefined;
        if (controlledVerifyPassing && current?.accepted.attempt_ref === attemptRef) {
          if (current.accepted.human_confirmation_ref !== humanConfirmationRef) {
            throw new Error(`${name} attempt is already accepted with a different confirmation`);
          }
          if (acceptanceMode === "human") readAndValidateConfirmation();
          return current.accepted;
        }
        if (name === "build-plan" && attempt.baseline_rebind_provenance !== undefined && current?.accepted.attempt_ref === attemptRef) {
          if (current.accepted.human_confirmation_ref !== humanConfirmationRef) throw new Error("build-plan attempt is already accepted with a different confirmation");
          readAndValidateConfirmation();
          return current.accepted;
        }
        const controlledBaselineRebind = name === "build-plan" && attempt.baseline_rebind_provenance !== undefined;
        const buildSpecContinuation = current && activeContinuation
          ? assertAcceptedBuildSpecContinuation(current, attempt)
          : null;
        if (current && name !== "build-code" && !controlledVerifyPassing
            && !controlledBaselineRebind && !buildSpecContinuation) {
          throw new Error(`${name} is accepted and closed`);
        }
        let baselineRebindAuthorization;
        if (controlledBaselineRebind) {
          baselineRebindAuthorization = assertBaselineRebind(attempt.baseline_rebind_provenance.authorization_ref, current);
          if (attempt.baseline_rebind_provenance.authorization_hash !== baselineRebindAuthorization.hash) throw new Error("build-plan baseline rebind authorization hash mismatch");
        }
        if (current && name === "build-code") assertReopenProvenance(attempt.reopen_provenance, current);
        if (!current && attempt.reopen_provenance !== undefined) throw new Error("build-code reopen provenance requires an accepted build-code stage");
        if (name === "make-decision" && candidate) {
          if (resolve(attempt.facts.worktree_root) !== candidate.worktreeRoot || attempt.facts.baseline_commit !== candidate.baselineCommit) {
            throw new Error("make-decision facts do not match CandidateWorkspace");
          }
          verifyCandidateSnapshot(attempt.facts);
        }
        if (name === "make-decision") verifyMakeDecisionCore(attempt);
        const liveUpstreamAcceptances = verifyUpstream(name, attempt.upstream_refs);
        if (JSON.stringify(attempt.upstream_acceptances ?? []) !== JSON.stringify(liveUpstreamAcceptances)) {
          throw new Error(`${name} accepted upstream lineage changed after attempt publication`);
        }
        let confirmation;
        let confirmationRaw;
        let revalidateControlledVerifyPassing;
        if (controlledVerifyPassing) {
          if (!current) throw new Error("controlled verify passing acceptance requires an accepted verify-code stage");
          const expectedAttemptHash = hash(attemptRaw);
          revalidateControlledVerifyPassing = (mode = "pre") => {
            const liveAttemptRaw = task.readRecord(`results/${name}/${attemptRef}`);
            if (liveAttemptRaw !== attemptRaw || hash(liveAttemptRaw) !== expectedAttemptHash) {
              throw new Error("controlled verify passing attempt changed during acceptance");
            }
            const liveAttempt = validateAttempt(parseJson(liveAttemptRaw, `${name} attempt`), { taskId: task.identity.taskId, stage: name });
            const publication = liveAttempt.verify_passing_publication;
            if (!publication) throw new Error("controlled verify passing publication disappeared during acceptance");
            if (acceptanceMode === "human") readAndValidateConfirmation(confirmationRaw);
            let sourceVerify;
            if (mode === "pre") {
              sourceVerify = readAcceptedLocal("verify-code");
              if (sourceVerify.accepted_hash !== current.accepted_hash || sourceVerify.accepted.attempt_ref !== current.accepted.attempt_ref) {
                throw new Error("controlled verify passing acceptance source verify changed after publication");
              }
            } else if (mode === "post") {
              const previousAttemptRaw = task.readRecord(`results/verify-code/${current.accepted.attempt_ref}`);
              if (hash(previousAttemptRaw) !== String(current.accepted.integrity_hash).replace(/^sha256:/, "")) {
                throw new Error("controlled verify passing acceptance source verify attempt changed");
              }
              const previousAttempt = validateAttempt(parseJson(previousAttemptRaw, "previous accepted verify-code attempt"), { taskId: task.identity.taskId, stage: "verify-code" });
              sourceVerify = { ...current, attempt: previousAttempt, facts: previousAttempt.facts };
            } else {
              throw new Error("controlled verify passing acceptance validator mode invalid");
            }
            const activeBuild = readAcceptedLocal("build-code");
            if (publication.previous_accepted_ref !== sourceVerify.accepted_ref || publication.previous_accepted_hash !== sourceVerify.accepted_hash || publication.previous_attempt_ref !== sourceVerify.accepted.attempt_ref || publication.previous_attempt_hash !== String(sourceVerify.accepted.integrity_hash).replace(/^sha256:/, "") || publication.active_build_accepted_ref !== activeBuild.accepted_ref || publication.active_build_accepted_hash !== activeBuild.accepted_hash || publication.active_build_attempt_ref !== activeBuild.accepted.attempt_ref || publication.active_build_attempt_hash !== String(activeBuild.accepted.integrity_hash).replace(/^sha256:/, "")) {
              throw new Error("controlled verify passing acceptance binding changed after publication");
            }
            const liveUpstreamAcceptances = verifyUpstream(name, liveAttempt.upstream_refs);
            if (JSON.stringify(liveAttempt.upstream_acceptances ?? []) !== JSON.stringify(liveUpstreamAcceptances)) {
              throw new Error("controlled verify passing acceptance active build lineage changed after publication");
            }
            assertPassingMaterials(publication, liveAttempt.facts, liveAttempt.evidence_refs, sourceVerify, activeBuild);
          };
        }
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
              || audit.verdict !== "pass" || audit.stage_slug !== name
              || audit.task_id !== task.identity.taskId || audit.through_step_id !== 12
              || audit.audit_scope !== "full"
              || audit.snapshot_tree !== attempt.facts.snapshot_tree) {
            throw new Error("make-decision acceptance requires a canonical passing full audit through step 12");
          }
        } else if (options.full_audit_writer !== undefined) {
          throw new Error("full audit writer is only valid for a bounded make-decision attempt");
        }
        revalidateControlledVerifyPassing?.("pre");
        let acceptedCheckpoint;
        if (["build-spec", "build-plan"].includes(name)) {
          if (!workspace || !artifacts) throw new Error("accepting a design checkpoint requires Workspace and ArtifactDir capabilities");
          if (acceptanceMode === "human" && confirmation.checkpoint_plan_hash !== attempt.checkpoint.plan_hash) throw new Error("human confirmation checkpoint plan hash mismatch");
          const base = baselineRebindAuthorization ? { baseCommit: baselineRebindAuthorization.record.integration_head, baseTree: baselineRebindAuthorization.record.base_tree } : checkpointBase(name);
          acceptedCheckpoint = materializeGitCheckpoint({ workspace, artifacts, task, plan: attempt.checkpoint, ...base, ...(baselineRebindAuthorization ? { baselineRebindHash: baselineRebindAuthorization.hash } : {}), publishRef: (ref, commit, zeroOid) => {
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
          priorRaw = controlledBaselineRebind
            ? baselineRebindAuthorization.record.previous_accepted_raw
            : task.readRecord(canonicalRef);
          if (buildSpecContinuation && hash(priorRaw) !== current.accepted_hash) {
            throw new Error("build-spec canonical accepted changed before replacement");
          }
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
            full_audit_verdict: "pass",
          } : {}),
          accepted_at: now(),
          upstream_refs: structuredClone(attempt.upstream_refs),
          ...(acceptedCheckpoint ? { checkpoint: structuredClone(acceptedCheckpoint) } : {}),
          ...(attempt.baseline_rebind_provenance ? { baseline_rebind_provenance: structuredClone(attempt.baseline_rebind_provenance) } : {}),
          ...(attempt.build_spec_continuation_provenance ? {
            build_spec_continuation_provenance: {
              ...structuredClone(attempt.build_spec_continuation_provenance),
              previous_accepted_archive_ref: archiveRef,
              previous_accepted_archive_hash: hash(priorRaw),
            },
          } : {}),
        };
        validateAccepted(accepted, { taskId: task.identity.taskId, stage: name });
        const acceptedRaw = `${JSON.stringify(accepted, null, 2)}\n`;
        if (!current) {
          createKernelRecord(`results/${name}/accepted.json`, acceptedRaw);
          return deepFreeze(accepted);
        }
        revalidateControlledVerifyPassing?.("pre");
        const replacementOptions = {
          ...(acceptedReplacementTestHooks === undefined ? {} : { testHooks: acceptedReplacementTestHooks }),
          archiveRef,
          archiveRaw: priorRaw,
          ...(buildSpecContinuation ? {
            expectedPriorRaw: priorRaw,
            validator: () => {
              const liveAttemptRaw = task.readRecord(`results/${name}/${attemptRef}`);
              if (liveAttemptRaw !== attemptRaw) throw new Error("build-spec continuation attempt changed during acceptance");
              const authorization = assertAcceptedBuildSpecContinuation(current, attempt);
              if (JSON.stringify(authorization) !== JSON.stringify(buildSpecContinuation)) {
                throw new Error("build-spec continuation authorization changed during acceptance");
              }
            },
          } : {}),
          ...(controlledVerifyPassing ? { validator: revalidateControlledVerifyPassing, expectedPriorRaw: priorRaw } : {}),
          ...(controlledBaselineRebind ? {
            expectedPriorRaw: priorRaw,
            validator: (mode) => {
              const live = task.readRecord(`results/${name}/${attemptRef}`);
              if (live !== attemptRaw) throw new Error("build-plan baseline rebind attempt changed during acceptance");
              if (mode === "pre") assertBaselineRebind(attempt.baseline_rebind_provenance.authorization_ref, current);
              else {
                const authorization = readBaselineRebind(attempt.baseline_rebind_provenance.authorization_ref);
                if (authorization.hash !== attempt.baseline_rebind_provenance.authorization_hash) throw new Error("build-plan baseline rebind authorization changed");
              }
            },
          } : {}),
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
    reopenBuildCode({ verifyAttemptRef, failureEvidenceRef } = {}) {
      if (!ATTEMPT_REF.test(verifyAttemptRef ?? "")) throw new Error("valid verify-code attempt reference is required");
      return task.withRecordLock("locks/build-code.publication.lock", () => {
        const current = readAcceptedLocal("build-code", { allowLegacyBuildCode: true });
        const verifyRef = `results/verify-code/${verifyAttemptRef}`;
        const verifyRaw = task.readRecord(verifyRef);
        const verifyAttempt = validateAttempt(parseJson(verifyRaw, "verify-code failure attempt"), { taskId: task.identity.taskId, stage: "verify-code", attemptId: `verify-code:${verifyAttemptRef.slice(0, -5)}` });
        const expectedUpstream = verifyAttempt.upstream_refs.filter((ref) => ref.task_id === task.identity.taskId && ref.stage === "build-code" && ref.accepted_ref === "results/build-code/accepted.json");
        if (expectedUpstream.length !== 1) throw new Error("verify-code failure does not reference this task's build-code acceptance");
        const binding = (verifyAttempt.upstream_acceptances ?? []).find((entry) => entry.task_id === task.identity.taskId && entry.stage === "build-code");
        if (binding && (binding.accepted_ref !== current.accepted_ref || binding.integrity_hash !== String(current.accepted.integrity_hash).replace(/^sha256:/, ""))) throw new Error("verify-code failure source does not match the active build-code acceptance");
        if (!binding && current.attempt.reopen_provenance !== undefined) throw new Error("legacy verify-code failure without upstream acceptance cannot reopen a revised build-code acceptance");
        const failure = verifyFailureEvidence(verifyAttempt, failureEvidenceRef);
        for (let sequence = 1; sequence <= 9999; sequence += 1) {
          const reopenRef = `results/build-code/revisions/reopen-${String(sequence).padStart(4, "0")}.json`;
          try {
            const existing = readReopen(reopenRef);
            if (existing.record.verify_failure_ref === verifyRef || existing.record.previous_accepted_hash === current.accepted_hash) throw new Error("build-code reopen already exists for this failure or accepted record");
          } catch (error) {
            if (error?.code !== "ENOENT") throw error;
            const record = {
              schema_version: "stage-reopen.v1", task_id: task.identity.taskId, stage: "build-code",
              previous_accepted_ref: current.accepted_ref, previous_accepted_hash: current.accepted_hash,
              previous_attempt_ref: current.accepted.attempt_ref, previous_attempt_hash: String(current.accepted.integrity_hash).replace(/^sha256:/, ""),
              verify_failure_ref: verifyRef, verify_failure_hash: hash(verifyRaw),
              failure_evidence_ref: failure.ref, failure_evidence_hash: failure.hash, reopened_at: now(),
            };
            const raw = `${JSON.stringify(record, null, 2)}\n`;
            createKernelRecord(reopenRef, raw);
            return deepFreeze({ reopen_ref: reopenRef, reopen_hash: hash(raw), previous_accepted_ref: record.previous_accepted_ref, previous_accepted_hash: record.previous_accepted_hash, verify_failure_ref: record.verify_failure_ref, verify_failure_hash: record.verify_failure_hash });
          }
        }
        throw new Error("build-code reopen sequence exhausted");
      });
    },
    buildCodeReopenProvenance(reopenRef) {
      const current = readAcceptedLocal("build-code", { allowLegacyBuildCode: true });
      const reopen = readReopen(reopenRef);
      if (reopen.record.previous_accepted_ref !== current.accepted_ref || reopen.record.previous_accepted_hash !== current.accepted_hash) throw new Error("build-code reopen is not authorized for the active accepted record");
      return deepFreeze({ reopen_ref: reopen.ref, reopen_hash: reopen.hash, previous_accepted_ref: reopen.record.previous_accepted_ref, previous_accepted_hash: reopen.record.previous_accepted_hash, verify_failure_ref: reopen.record.verify_failure_ref, verify_failure_hash: reopen.record.verify_failure_hash });
    },
    readAccepted(stage, options) {
      if (options?.liveCheckpoint !== undefined) {
        throw new Error("liveCheckpoint is an internal build-spec continuation capability");
      }
      return readAcceptedLocal(stage, options);
    },
    readAcceptedAudit(stage, options = {}) {
      if (Object.prototype.hasOwnProperty.call(options, "liveCheckpoint")) {
        throw new Error("accepted audit reads do not accept live checkpoint controls");
      }
      return readAcceptedLocal(stage, { ...options, liveCheckpoint: false });
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
