import { createHash } from "node:crypto";

import factsContract from "../../contracts/facts-subschema.json" with { type: "json" };
import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";
import { ArtifactDir, assertArtifactDir } from "../../core/artifact-dir.mjs";
import { captureExecutionSnapshot, materialRevisionFromValues } from "./git-worktree-snapshot.mjs";
import { createQualityFact, publishQualityFact } from "../evidence/quality-fact.mjs";
import { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";
import { isHumanConfirmationVersion, validateHumanConfirmation } from "../evidence/canonical-evidence-validators.mjs";
import { deriveStageCompletion, STAGE_FACT_MATERIALS } from "../stage/completion-predicates.mjs";
import {
  buildRiskAcceptance,
  canonicalReviewFindings,
  deriveSeriousReviewPause,
  isActionableSeriousFinding,
  validateRiskAcceptance,
} from "../review/stage-review-disposition.mjs";
import { validateInteractionAggregateContract } from "../stage/stage-content-contracts.mjs";
export { createQualityFact } from "../evidence/quality-fact.mjs";
export { deriveStageCompletion } from "../stage/completion-predicates.mjs";
export { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/i;
const MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
const CONFIRMATION_REF = /^quality\/confirmations\/[a-f0-9]{64}\.json$/;
const STAGE_REFLECTION_NAMESPACE = "quality/stage-reflection/";
const STAGE_REFLECTION_REF = /^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\.json$/;
const AUTHORIZATION_OPERATIONS = new Set(["commit", "push", "merge", "archive", "cleanup"]);
const CLOSE_PLAN_REF = /^operations\/close\/plans\/[a-f0-9]{64}\/plan\.json$/;
const RESOLVED_REVIEW_STAGE_OUTCOME_REF = /^quality\/evidence\/stage-outcomes\/verify-code\/[a-f0-9]{64}\.json$/;
const RESOLVED_REVIEW_REPAIR_STATUSES = new Set(["fixed", "rejected_invalid"]);
const RESOLVED_REVIEW_STATUS = "resolved";
const REQUIRED_FACTS = Object.freeze(Object.fromEntries(
  Object.entries(factsContract.stages).map(([stage, contract]) => [stage, Object.freeze([...contract.required_keys])]),
));

function hash(raw) { return createHash("sha256").update(raw).digest("hex"); }
function stageName(stage) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  return stage;
}
function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}
function rejectUnknown(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unsupported fields: ${unknown.join(", ")}`);
}
function ref(value, label) {
  text(value, label);
  if (value.includes("..") || value.startsWith("/") || !/^[a-z][a-z0-9_-]*\//.test(value)) {
    throw new TypeError(`${label} must be a task-relative canonical ref`);
  }
  if (value.startsWith(STAGE_REFLECTION_NAMESPACE) && STAGE_REFLECTION_REF.test(value)) return value;
  return value;
}
function oid(value, label) {
  if (!OID.test(value ?? "")) throw new TypeError(`${label} must be a Git object id`);
  return value;
}
function sha(value, label) {
  if (!HASH.test(value ?? "")) throw new TypeError(`${label} must be sha256`);
  return value;
}
function readAcceptedHumanConfirmation(task, confirmationRef, label = "human confirmation") {
  if (!CONFIRMATION_REF.test(confirmationRef ?? "")) throw new TypeError(`${label} ref must use quality/confirmations/<sha256>.json`);
  let raw;
  try { raw = task.readRecord(confirmationRef); }
  catch (error) { if (error?.code === "ENOENT") throw new Error(`${label} is missing: ${confirmationRef}`); throw error; }
  if (hash(raw) !== confirmationRef.slice("quality/confirmations/".length, -".json".length)) throw new Error(`${label} hash does not bind its canonical bytes`);
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error(`${label} must be valid JSON`); }
  if (!isHumanConfirmationVersion(value)
      || value.task_id !== task.identity.taskId || value.decision !== "accepted"
      || typeof value.stage !== "string" || value.stage.trim() === "") {
    throw new Error(`${label} must be an accepted human confirmation for the current task`);
  }
  try {
    validateHumanConfirmation(value, {
      taskId: task.identity.taskId,
      stage: value.stage,
      requireAccepted: true,
    });
  } catch (error) {
    throw new Error(`${label} is invalid: ${error.message}`);
  }
  if (!isHumanConfirmationVersion(value, { current: true })) {
    throw new Error(`${label} uses legacy human-confirmation.v1; it remains readable but cannot authorize current operations`);
  }
  if (typeof value.subject_ref !== "string" || value.subject_ref.trim() === "") throw new Error(`${label} must bind a non-empty subject_ref`);
  if (!/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "") || !/^[a-f0-9]{40,64}$/i.test(value.snapshot_tree ?? "")) {
    throw new Error(`${label} has invalid material/snapshot provenance`);
  }
  if (value.schema_version === "human-confirmation.v3"
      && (typeof value.reply_text !== "string" || value.reply_text.trim() === ""
        || typeof value.step_slug !== "string" || value.step_slug.trim() === "")) {
    throw new Error(`${label} v3 must preserve the non-empty reply_text and step_slug`);
  }
  return Object.freeze({ ref: confirmationRef, sha256: hash(raw), raw, value: Object.freeze(value) });
}
function validateTests(value, label) {
  const tests = object(value, label);
  text(tests.command, `${label}.command`);
  if (!Number.isInteger(tests.exit_code)) throw new TypeError(`${label}.exit_code must be integer`);
  for (const key of ["command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "output_ref", "output_hash"]) text(tests[key], `${label}.${key}`);
  return tests;
}
function validateReview(value, label) {
  const review = object(value, label);
  const reviewRef = review.result_ref ?? review.attempt_ref;
  const reviewHash = review.result_hash ?? review.attempt_hash;
  ref(reviewRef, `${label}.result_ref`);
  sha(reviewHash, `${label}.result_hash`);
  oid(review.snapshot_tree, `${label}.snapshot_tree`);
  return review;
}
function validateEvidenceRefs(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  value.forEach((entry, index) => {
    object(entry, `${label}[${index}]`);
    ref(entry.ref, `${label}[${index}].ref`);
    sha(entry.sha256, `${label}[${index}].sha256`);
  });
  return value;
}

function validateResolvedReviewAuthorization({ task, stage, input, authorization, currentContext }) {
  if (input.review_status !== RESOLVED_REVIEW_STATUS) {
    if (authorization !== undefined && authorization !== null) {
      throw new Error("resolved review authorization is only valid for a resolved verify-code review");
    }
    return;
  }
  if (stage !== "verify-code" || input.kind !== "review" || input.subject !== "code_review") {
    throw new Error("resolved review status is only valid for verify-code code_review");
  }
  const proof = object(authorization, "resolved review authorization");
  if (Object.keys(proof).some((key) => !new Set(["stage_outcome_ref", "stage_outcome_hash"]).has(key))) {
    throw new Error("resolved review authorization contains unsupported fields");
  }
  const outcomeRef = proof.stage_outcome_ref;
  const outcomeHash = proof.stage_outcome_hash;
  if (!RESOLVED_REVIEW_STAGE_OUTCOME_REF.test(outcomeRef ?? "") || !HASH.test(outcomeHash ?? "")) {
    throw new Error("resolved review authorization must bind a verify-code stage outcome");
  }
  if (outcomeRef.slice("quality/evidence/stage-outcomes/verify-code/".length, -".json".length) !== outcomeHash) {
    throw new Error("resolved review authorization stage outcome ref/hash do not match");
  }
  const { revision, snapshot } = currentContext();
  let outcomeRaw;
  try { outcomeRaw = task.readRecord(outcomeRef); }
  catch (error) { throw new Error(`resolved review authorization stage outcome is unavailable: ${error.message}`); }
  if (hash(outcomeRaw) !== outcomeHash) throw new Error("resolved review authorization stage outcome hash mismatch");
  let outcome;
  try { outcome = JSON.parse(outcomeRaw); }
  catch { throw new Error("resolved review authorization stage outcome must be valid JSON"); }
  if (outcome?.schema_version !== "workflowhub-stage-outcomes.v1"
      || outcome.task_id !== task.identity.taskId
      || outcome.stage !== "verify-code"
      || outcome.status !== "completed"
      || outcome.snapshot_tree !== snapshot.tree
      || outcome.material_revision !== revision.revision_id) {
    throw new Error("resolved review authorization stage outcome is not current and completed");
  }
  const stageReview = object(outcome.code_review, "resolved review authorization code_review");
  const reviewEvidence = Array.isArray(input.evidence)
    ? input.evidence.find((entry) => entry?.ref === stageReview.quality_review_ref && entry?.sha256 === stageReview.quality_review_hash)
    : null;
  if (!reviewEvidence || !RESOLVED_REVIEW_STAGE_OUTCOME_REF.test(outcomeRef)) {
    throw new Error("resolved review authorization does not bind the current review evidence");
  }
  if (stageReview.stage !== "verify-code"
      || stageReview.step_slug !== "approve-verification"
      || stageReview.skill_id !== "dsh-code-review"
      || typeof stageReview.quality_review_ref !== "string"
      || !HASH.test(stageReview.quality_review_hash ?? "")) {
    throw new Error("resolved review authorization code_review binding is invalid");
  }
  let reviewRaw;
  try { reviewRaw = task.readRecord(stageReview.quality_review_ref); }
  catch (error) { throw new Error(`resolved review authorization review result is unavailable: ${error.message}`); }
  if (hash(reviewRaw) !== stageReview.quality_review_hash) throw new Error("resolved review authorization review result hash mismatch");
  let review;
  try { review = JSON.parse(reviewRaw); }
  catch { throw new Error("resolved review authorization review result must be valid JSON"); }
  if (review?.task_id !== task.identity.taskId || review.stage !== "verify-code") {
    throw new Error("resolved review authorization review result identity mismatch");
  }
  const sourceFindings = canonicalReviewFindings(review).filter(isActionableSeriousFinding);
  const result = object(stageReview.result, "resolved review authorization result");
  if (result.status !== "findings" || sourceFindings.length === 0 || !Array.isArray(result.repairs)) {
    throw new Error("resolved review authorization must prove repaired actionable findings");
  }
  const findingKey = (finding) => JSON.stringify({
    severity: finding.severity,
    path: finding.path,
    issue: finding.issue,
    recommendation: finding.recommendation,
  });
  const outcomeKeys = new Set(canonicalReviewFindings(result).filter(isActionableSeriousFinding).map(findingKey));
  if (sourceFindings.some((finding) => !outcomeKeys.has(findingKey(finding)))) {
    throw new Error("resolved review authorization omitted an actionable finding");
  }
  const sourceIds = new Set(sourceFindings.map((finding) => finding.id));
  const repairedIds = new Set();
  for (const repair of result.repairs) {
    if (!repair || typeof repair !== "object" || Array.isArray(repair)
        || typeof (repair.finding_id ?? repair.id) !== "string"
        || !sourceIds.has(repair.finding_id ?? repair.id)
        || repairedIds.has(repair.finding_id ?? repair.id)
        || !RESOLVED_REVIEW_REPAIR_STATUSES.has(repair.status)) {
      throw new Error("resolved review authorization contains an invalid repair disposition");
    }
    repairedIds.add(repair.finding_id ?? repair.id);
  }
  if (repairedIds.size !== sourceIds.size) throw new Error("resolved review authorization does not cover every actionable finding");
}

function interactionAggregateIdentity(value) {
  return {
    task_id: value?.task_id,
    stage: value?.stage,
    snapshot_tree: value?.snapshot_tree,
    original_requirement: value?.original_requirement,
    decision: value?.decision,
    confirmation: value?.confirmation,
  };
}

function interactionAggregateContent(value) {
  const { generated_at: _generatedAt, ...content } = value ?? {};
  return content;
}

// Content-addressed replay must not depend on object-property insertion order.
// Arrays retain their declared order because Talk/Clarify lifecycle order is
// semantic; plain object keys are sorted before identity/content comparison.
function canonicalizeAggregate(value) {
  if (Array.isArray(value)) return value.map((entry) => canonicalizeAggregate(entry));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalizeAggregate(value[key])]));
}

function aggregateJson(value) {
  return JSON.stringify(canonicalizeAggregate(value));
}

export function validatePhaseCompletion(value, label = "phase_completion", { allowLegacyBoolean = true } = {}) {
  if (typeof value === "boolean") {
    if (allowLegacyBoolean) return value;
    throw new TypeError(`${label} boolean is legacy read-only; current publication requires derived completion evidence`);
  }
  const completion = object(value, label);
  if (completion.status !== "completed") throw new Error(`${label}.status must be completed`);
  ref(completion.evidence_ref, `${label}.evidence_ref`);
  sha(completion.evidence_hash, `${label}.evidence_hash`);
  const review = object(completion.integration_review, `${label}.integration_review`);
  ref(review.ref, `${label}.integration_review.ref`);
  sha(review.sha256, `${label}.integration_review.sha256`);
  return value;
}

export function validateStageFacts(stage, facts, { allowLegacyBuildCode = false } = {}) {
  const name = stageName(stage);
  const value = object(facts, `${name} facts`);
  const missing = REQUIRED_FACTS[name].filter((key) => !Object.hasOwn(value, key)
    && !(allowLegacyBuildCode && name === "build-code" && key === "acceptance_coverage"));
  if (missing.length) throw new Error(`${name} facts missing required keys: ${missing.join(", ")}`);
  if (name === "make-decision") {
    text(value.worktree_root, "make-decision facts.worktree_root");
    oid(value.baseline_commit, "make-decision facts.baseline_commit");
  } else if (name === "build-spec") {
    ref(value.spec_ref, "build-spec facts.spec_ref");
    oid(value.snapshot_tree, "build-spec facts.snapshot_tree");
    sha(value.source_digest, "build-spec facts.source_digest");
  } else if (name === "build-plan") {
    ref(value.plan_ref, "build-plan facts.plan_ref");
    ref(value.tasks_ref, "build-plan facts.tasks_ref");
    oid(value.snapshot_tree, "build-plan facts.snapshot_tree");
    sha(value.source_digest, "build-plan facts.source_digest");
  } else if (name === "build-code") {
    if (!Array.isArray(value.changed)) throw new TypeError("build-code facts.changed must be an array");
    validateTests(value.tests, "build-code facts.tests");
    validateReview(value.review, "build-code facts.review");
    validatePhaseCompletion(value.phase_completion, "build-code facts.phase_completion", { allowLegacyBoolean: allowLegacyBuildCode });
    if (!allowLegacyBuildCode) object(value.acceptance_coverage, "build-code facts.acceptance_coverage");
  } else {
    validateTests(value.tests, "verify-code facts.tests");
    validateReview(value.review, "verify-code facts.review");
    validateEvidenceRefs(value.evidence_refs, "verify-code facts.evidence_refs");
  }
  return facts;
}

function unsupported(name) {
  return () => { throw new Error(`${name} is retired; use current four materials and immutable quality facts`); };
}

export function buildTaskKernel(taskHandle, {
  now = () => new Date().toISOString(),
  workspace,
  artifacts,
  candidateWorkspace,
} = {}, authority) {
  const task = authority.assertTaskHandle(taskHandle);
  const createRecord = authority.createKernelRecordFor(task);
  const candidate = candidateWorkspace === undefined ? undefined : assertCandidateWorkspace(candidateWorkspace);
  const activeWorkspace = () => candidate ?? workspace;
  const artifactDir = () => artifacts === undefined
    ? ArtifactDir.open(activeWorkspace().worktreeRoot, task)
    : assertArtifactDir(artifacts);
  const currentContext = () => {
    if (task.manifest.record_model !== "vnext-single-write") throw new Error("vNext writer requires a vnext-single-write task");
    const active = activeWorkspace();
    if (!active) throw new Error("vNext current material context requires an authenticated Workspace");
    const dir = artifactDir();
    const values = MATERIAL_FILES.map((file) => {
      try { return [file, dir.read(file)]; }
      catch (error) {
        if (error?.code === "ENOENT") return [file, null];
        throw error;
      }
    });
    const revisionId = materialRevisionFromValues(values);
    const materialDigest = revisionId.slice("revision-".length);
    const revision = {
      schema_version: "vnext-material-context.v1",
      task_id: task.identity.taskId,
      revision_id: revisionId,
      material_digest: materialDigest,
      source: "current-four-materials",
    };
    return { revision, snapshot: captureExecutionSnapshot(active.worktreeRoot, task.identity.taskId) };
  };
  const readInput = (slot) => {
    const input = task.manifest.inputs?.[slot];
    if (input === undefined) return null;
    if (typeof input === "string") {
      const raw = task.readRecord(input);
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return structuredClone(input);
  };
  const currentVNextSnapshot = () => currentContext().snapshot;
  const createImmutable = (relativePath, raw) => {
    try { createRecord(relativePath, raw); }
    catch (error) {
      if (error?.code !== "EEXIST" || task.readRecord(relativePath) !== raw) throw error;
    }
    return { ref: relativePath, sha256: hash(raw) };
  };
  const readBoundRecord = (relativePath, label) => {
    const decisionRef = artifactDir().reference("decision-log.md");
    if (relativePath === decisionRef) return artifactDir().read("decision-log.md");
    try { return task.readRecord(relativePath); }
    catch (error) {
      if (error?.code === "ENOENT") throw new Error(`${label} is missing: ${relativePath}`);
      throw error;
    }
  };
  const prepareInteractionPublication = (input = {}) => {
    object(input, "make-decision interaction publication input");
    const candidateInput = input.aggregate && !input.schema_version ? input.aggregate : input;
    object(candidateInput, "make-decision interaction aggregate");
    const { revision, snapshot } = currentContext();
    if (candidateInput.snapshot_tree !== undefined && candidateInput.snapshot_tree !== snapshot.tree) {
      throw new Error("make-decision interaction aggregate is stale relative to the current Workspace snapshot");
    }
    const decision = object(candidateInput.decision, "interaction aggregate decision");
    const currentDecisionRef = artifactDir().reference("decision-log.md");
    const currentDecisionRaw = artifactDir().read("decision-log.md");
    if (decision.ref !== currentDecisionRef || decision.hash !== hash(currentDecisionRaw)) {
      throw new Error("make-decision interaction aggregate decision is not bound to the current decision-log.md");
    }
    if (decision.revision !== revision.revision_id) {
      throw new Error("make-decision interaction aggregate decision revision is stale");
    }
    const confirmation = readAcceptedHumanConfirmation(task, candidateInput.confirmation?.ref, "interaction aggregate confirmation");
    if (candidateInput.confirmation?.hash !== confirmation.sha256
        || candidateInput.confirmation?.result !== "accepted"
        || confirmation.value.stage !== "make-decision"
        || confirmation.value.subject_ref !== currentDecisionRef
        || confirmation.value.material_revision !== revision.revision_id
        || confirmation.value.snapshot_tree !== snapshot.tree) {
      throw new Error("make-decision interaction aggregate confirmation does not bind the current decision and snapshot");
    }
    const requirement = object(candidateInput.original_requirement, "interaction aggregate original_requirement");
    const requirementRaw = readBoundRecord(requirement.ref, "interaction aggregate original_requirement");
    if (hash(requirementRaw) !== requirement.hash) throw new Error("interaction aggregate original_requirement hash does not bind canonical bytes");
    const normalized = {
      ...structuredClone(candidateInput),
      schema_version: "workflowhub-interaction-aggregate.v1",
      task_id: task.identity.taskId,
      stage: "make-decision",
      snapshot_tree: snapshot.tree,
      decision: { ref: currentDecisionRef, hash: hash(currentDecisionRaw), revision: revision.revision_id },
      decision_ref: currentDecisionRef,
      decision_hash: hash(currentDecisionRaw),
      confirmation: { ref: confirmation.ref, hash: confirmation.sha256, result: "accepted" },
      generated_at: candidateInput.generated_at ?? now(),
    };
    const validation = validateInteractionAggregateContract(normalized);
    if (!validation.ok) throw new Error(`MATERIAL_INCOMPLETE: interaction aggregate is invalid: ${validation.errors.join("; ")}`);
    return deepFreeze(normalized);
  };
  const completeInteractionPublication = (input = {}) => {
    const prepared = prepareInteractionPublication(input);
    const identity = aggregateJson(interactionAggregateIdentity(prepared));
    const content = aggregateJson(interactionAggregateContent(prepared));
    for (const qualityRef of task.listCanonicalQualityFactRefs()) {
      let qualityRaw;
      try { qualityRaw = task.readRecord(qualityRef); } catch { continue; }
      let quality;
      try { quality = JSON.parse(qualityRaw); } catch { continue; }
      if (quality?.task_id !== task.identity.taskId || quality.stage !== "make-decision"
          || quality.kind !== "acceptance_criterion" || quality.subject !== "talk_clarify") continue;
      const evidence = quality.evidence?.[0];
      if (!evidence?.ref || !/^quality\/evidence\/interactions\/[a-f0-9]{64}\.json$/.test(evidence.ref)) continue;
      let aggregateRaw;
      try { aggregateRaw = task.readRecord(evidence.ref); } catch { continue; }
      if (hash(aggregateRaw) !== evidence.sha256) continue;
      let aggregate;
      try { aggregate = JSON.parse(aggregateRaw); } catch { continue; }
      if (aggregateJson(interactionAggregateIdentity(aggregate)) !== identity) continue;
      if (aggregateJson(interactionAggregateContent(aggregate)) !== content) {
        throw new Error("INTERACTION_AGGREGATE_CONFLICT: bound interaction content changed; obtain a new confirmation");
      }
      return Object.freeze({
        ref: evidence.ref,
        hash: evidence.sha256,
        value: Object.freeze(aggregate),
        quality_fact_ref: qualityRef,
        quality_fact_hash: hash(qualityRaw),
        idempotent: true,
      });
    }
    const raw = `${JSON.stringify(prepared, null, 2)}\n`;
    const record = createImmutable(`quality/evidence/interactions/${hash(raw)}.json`, raw);
    const qualityFact = kernel.publishVNextQualityFact("make-decision", {
      kind: "acceptance_criterion",
      status: "passed",
      subject: "talk_clarify",
      evidence: [{ ref: record.ref, sha256: record.sha256, evidence_type: "acceptance_evidence" }],
    });
    return Object.freeze({
      ref: record.ref,
      hash: record.sha256,
      value: prepared,
      quality_fact_ref: qualityFact.ref,
      quality_fact_hash: qualityFact.sha256,
      idempotent: false,
    });
  };
  const kernel = {
    task,
    readInput,
    currentVNextSnapshot,
    currentVNextMaterialRevision() {
      return currentContext().revision.revision_id;
    },
    deriveStageWorkflowRunId(stage) {
      return `vnext-${hash(`${task.identity.taskId}\0${stageName(stage)}`).slice(0, 32)}`;
    },
    publishCanonicalRecord(relativePath, raw) {
      if (Buffer.isBuffer(raw)) raw = raw.toString("utf8");
      if (typeof raw !== "string" || raw.length === 0) throw new TypeError("canonical record bytes are required");
      ref(relativePath, "canonical record ref");
      if (task.manifest.record_model === "vnext-single-write" && !relativePath.startsWith("quality/")) {
        throw new Error(`vNext canonical records must use quality namespace: ${relativePath}`);
      }
      if (/^(?:receipts|reviews)\//.test(relativePath)) {
        throw new Error(`vNext canonical records must use quality namespace; legacy projection is retired: ${relativePath}`);
      }
      if (/^evidence\/stage-content\/[a-f0-9]{64}\/[a-z0-9][a-z0-9.-]*\.latest\.json$/.test(relativePath)) {
        throw new Error(`stage-content latest projection is retired and read-only: ${relativePath}`);
      }
      if (!/^(?:receipts|reviews|evidence|quality)\//.test(relativePath)) {
        throw new Error("canonical record namespace required");
      }
      return createImmutable(relativePath, raw);
    },
    publishVNextQualityFact(stage, input = {}, options = {}) {
      const name = stageName(stage);
      object(input, "vNext quality fact input");
      object(options, "vNext quality fact options");
      rejectUnknown(options, new Set(["resolved_review"]), "vNext quality fact options");
      rejectUnknown(input, new Set(["kind", "status", "review_status", "subject", "evidence"]), "vNext quality fact input");
      if (input.evidence.some((entry) => typeof entry?.ref !== "string" || !entry.ref.startsWith("quality/"))) {
        throw new Error("vNext quality facts must reference the quality namespace");
      }
      validateResolvedReviewAuthorization({
        task,
        stage: name,
        input,
        authorization: options.resolved_review,
        currentContext,
      });
      const { revision, snapshot } = currentContext();
      const materialScope = STAGE_FACT_MATERIALS[name];
      // Read the current materials once through the authenticated ArtifactDir;
      // the global revision remains the publication identity while the fixed
      // stage scope prevents downstream-only material writes from invalidating
      // upstream quality facts.
      const dir = artifactDir();
      const values = MATERIAL_FILES.map((file) => {
        try { return [file, dir.read(file)]; }
        catch (error) {
          if (error?.code === "ENOENT") return [file, null];
          throw error;
        }
      });
      const currentValues = Object.fromEntries(values);
      const scopeRevision = materialRevisionFromValues(materialScope.map((file) => [file, currentValues[file] ?? null]));
      const { review_status: reviewStatus, ...factInput } = input;
      const fact = createQualityFact({
        taskId: task.identity.taskId,
        stage: name,
        materialRevision: revision.revision_id,
        materialScope,
        materialScopeRevision: scopeRevision,
        snapshotTree: snapshot.tree,
        ...factInput,
        reviewStatus,
        recordedAt: now(),
      });
      return publishQualityFact({ fact, read: task.readRecord, create: (recordRef, raw) => createRecord(recordRef, raw) });
    },
    publishHumanConfirmation(stage, input = {}) {
      const name = stageName(stage);
      object(input, "human confirmation input");
      rejectUnknown(input, new Set(["decision", "subject_ref", "attempt_ref", "reply_text", "step_slug"]), "human confirmation input");
      if (!new Set(["accepted", "rejected"]).has(input.decision)) throw new TypeError("human confirmation decision is invalid");
      const subjectRef = input.subject_ref ?? null;
      if (subjectRef !== null && (typeof subjectRef !== "string" || subjectRef.trim() === "")) throw new TypeError("human confirmation subject_ref must be non-empty when supplied");
      const attemptRef = input.attempt_ref === undefined ? undefined : text(input.attempt_ref, "human confirmation attempt_ref");
      const { revision, snapshot } = currentContext();
      const value = {
        schema_version: "human-confirmation.v3",
        task_id: task.identity.taskId,
        stage: name,
        ...(attemptRef === undefined ? {} : { attempt_ref: attemptRef }),
        decision: input.decision,
        subject_ref: subjectRef,
        material_revision: revision.revision_id,
        snapshot_tree: snapshot.tree,
        confirmed_at: now(),
        reply_text: text(input.reply_text, "human confirmation reply_text"),
        step_slug: text(input.step_slug, "human confirmation step_slug"),
      };
      const qualityStatus = input.decision === "accepted" ? "passed" : "failed";
      // A close-plan confirmation authorizes an irreversible close operation;
      // it is not the verify-code stage's human quality confirmation. Keep the
      // canonical human-confirmation record unchanged, but give its quality
      // fact a distinct internal subject so strict current-fact conflict
      // detection cannot merge two different meanings. This is not a new
      // stage, public command, or progression permit.
      const qualitySubject = CLOSE_PLAN_REF.test(input.subject_ref ?? "")
        ? "close_confirmation"
        : "human_confirmation";
      for (const qualityRef of task.listCanonicalQualityFactRefs()) {
        try {
          const qualityRaw = task.readRecord(qualityRef);
          const quality = JSON.parse(qualityRaw);
          const evidenceRef = quality.kind === "confirmation"
            && quality.task_id === value.task_id
            && quality.stage === value.stage
            && quality.material_revision === value.material_revision
            && quality.snapshot_tree === value.snapshot_tree
            && quality.status === qualityStatus
            && quality.subject === qualitySubject
            ? quality.evidence?.[0]?.ref
            : null;
          if (!evidenceRef) continue;
          const existing = JSON.parse(task.readRecord(evidenceRef));
          if (JSON.stringify(existing) === JSON.stringify(value)) {
            return { ref: evidenceRef, hash: hash(task.readRecord(evidenceRef)), value: existing, quality_fact_ref: qualityRef, quality_fact_hash: hash(qualityRaw), idempotent: true };
          }
        } catch {
          // Ignore unrelated or historical malformed records; the new write remains fail-loud.
        }
      }
      const raw = `${JSON.stringify(value, null, 2)}\n`;
      const record = createImmutable(`quality/confirmations/${hash(raw)}.json`, raw);
      const quality = publishQualityFact({
        fact: createQualityFact({
          taskId: task.identity.taskId,
          stage: name,
          materialRevision: revision.revision_id,
          materialScope: STAGE_FACT_MATERIALS[name],
          materialScopeRevision: materialRevisionFromValues(STAGE_FACT_MATERIALS[name].map((file) => {
            try { return [file, artifactDir().read(file)]; }
            catch (error) { if (error?.code === "ENOENT") return [file, null]; throw error; }
          })),
          snapshotTree: snapshot.tree,
          kind: "confirmation",
          status: qualityStatus,
          subject: qualitySubject,
          evidence: [{ ref: record.ref, sha256: record.sha256, evidence_type: "human_confirmation" }],
          recordedAt: value.confirmed_at,
        }),
        read: task.readRecord,
        create: (recordRef, qualityRaw) => createRecord(recordRef, qualityRaw),
      });
      return { ref: record.ref, hash: record.sha256, value, quality_fact_ref: quality.ref, quality_fact_hash: quality.sha256 };
    },
    publishIrreversibleAuthorization(input = {}) {
      object(input, "irreversible authorization input");
      rejectUnknown(input, new Set(["operation", "subject_ref"]), "irreversible authorization input");
      const operation = text(input.operation, "authorization operation");
      if (!AUTHORIZATION_OPERATIONS.has(operation)) {
        throw new TypeError("authorization operation must be commit, push, merge, archive, or cleanup");
      }
      const subjectRef = text(input.subject_ref, "authorization subject_ref");
      const { revision, snapshot } = currentContext();
      const confirmation = readAcceptedHumanConfirmation(task, subjectRef, "authorization subject_ref");
      if (confirmation.value.material_revision !== revision.revision_id || confirmation.value.snapshot_tree !== snapshot.tree) {
        throw new Error("authorization subject_ref is stale relative to the current materials and Workspace snapshot");
      }
      const value = {
        schema_version: "irreversible-authorization.v1",
        task_id: task.identity.taskId,
        operation,
        subject_ref: subjectRef,
        subject_hash: confirmation.sha256,
        material_revision: revision.revision_id,
        snapshot_tree: snapshot.tree,
        authorized_at: now(),
      };
      const raw = `${JSON.stringify(value, null, 2)}\n`;
      const record = createImmutable(`quality/authorizations/${hash(raw)}.json`, raw);
      return { ref: record.ref, hash: record.sha256, value };
    },
    consumeIrreversibleAuthorization(input = {}) {
      object(input, "irreversible authorization consumption input");
      rejectUnknown(input, new Set(["operation", "confirmation_ref", "plan_hash", "step_id"]), "irreversible authorization consumption input");
      const operation = text(input.operation, "authorization operation");
      if (!AUTHORIZATION_OPERATIONS.has(operation)) throw new TypeError("authorization operation is invalid");
      const confirmation = readAcceptedHumanConfirmation(task, text(input.confirmation_ref, "authorization confirmation_ref"), "authorization confirmation_ref");
      const planHash = input.plan_hash;
      if (!HASH.test(planHash ?? "")) throw new TypeError("authorization plan_hash must be sha256");
      const stepId = text(input.step_id, "authorization step_id");
      const expectedPlanRef = `operations/close/plans/${planHash}/plan.json`;
      if (confirmation.value.subject_ref !== expectedPlanRef) throw new Error("authorization confirmation is not bound to the requested close plan");
      const candidates = task.listCanonicalAuthorizationRefs().map((authorizationRef) => {
        let raw;
        try { raw = task.readRecord(authorizationRef); } catch { return null; }
        let value;
        try { value = JSON.parse(raw); } catch { return null; }
        const authHash = authorizationRef.slice("quality/authorizations/".length, -".json".length);
        if (hash(raw) !== authHash || value?.schema_version !== "irreversible-authorization.v1"
            || value.task_id !== task.identity.taskId || value.operation !== operation
            || value.subject_ref !== confirmation.ref || value.subject_hash !== confirmation.sha256
            || value.material_revision !== confirmation.value.material_revision || value.snapshot_tree !== confirmation.value.snapshot_tree) return null;
        return { ref: authorizationRef, hash: authHash, raw, value };
      }).filter(Boolean);
      if (candidates.length === 0) throw new Error(`IRREVERSIBLE_AUTHORIZATION_REQUIRED: authorize --operation=${operation} with --subject-ref=${confirmation.ref} before close`);

      // A retry may reuse only the authorization consumed by this same close step.
      const withConsumption = candidates.map((candidate) => {
        const consumptionRef = `quality/authorizations/consumed/${candidate.hash}.json`;
        let consumption = null;
        try { consumption = JSON.parse(task.readRecord(consumptionRef)); }
        catch (error) { if (error?.code !== "ENOENT") throw error; }
        return { ...candidate, consumption };
      });
      const sameStep = withConsumption.filter(({ consumption }) => consumption?.plan_hash === planHash
        && consumption.operation === operation && consumption.confirmation_ref === confirmation.ref
        && consumption.step_id === stepId);
      const unused = withConsumption.filter(({ consumption }) => consumption === null);
      let authorization;
      if (sameStep.length === 1) authorization = sameStep[0];
      else if (sameStep.length > 1) throw new Error(`IRREVERSIBLE_AUTHORIZATION_AMBIGUOUS: ${operation} has multiple step authorizations for ${confirmation.ref}`);
      else if (unused.length === 1) authorization = unused[0];
      else throw new Error(`IRREVERSIBLE_AUTHORIZATION_AMBIGUOUS: ${operation} has multiple authorizations for ${confirmation.ref}`);
      const consumptionRef = `quality/authorizations/consumed/${authorization.hash}.json`;
      const consumed = {
        schema_version: "irreversible-authorization-consumption.v1",
        task_id: task.identity.taskId,
        plan_hash: planHash,
        step_id: stepId,
        operation,
        authorization_ref: authorization.ref,
        authorization_hash: authorization.hash,
        confirmation_ref: confirmation.ref,
        confirmation_hash: confirmation.sha256,
        consumed_at: now(),
      };
      const raw = `${JSON.stringify(consumed, null, 2)}\n`;
      try { createRecord(consumptionRef, raw); }
      catch (error) {
        if (error?.code !== "EEXIST") throw error;
        const existingRaw = task.readRecord(consumptionRef);
        const existing = JSON.parse(existingRaw);
        if (existing.task_id !== consumed.task_id || existing.plan_hash !== consumed.plan_hash || existing.step_id !== consumed.step_id || existing.operation !== consumed.operation || existing.authorization_ref !== consumed.authorization_ref || existing.confirmation_ref !== consumed.confirmation_ref) {
          throw new Error("irreversible authorization was already consumed by a different close step");
        }
        return Object.freeze({ ref: consumptionRef, hash: hash(existingRaw), value: existing, idempotent: true });
      }
      return Object.freeze({ ref: consumptionRef, hash: hash(raw), value: consumed });
    },
    prepareMakeDecisionInteractionPublication: prepareInteractionPublication,
    completeMakeDecisionInteractionPublication: completeInteractionPublication,
    completeMakeDecisionResearch: unsupported("make-decision research publication"),
    completeMakeDecisionReceipt: unsupported("make-decision receipt completion"),
    completeBuildSpecResultPublication: unsupported("build-spec result publication"),
    publishBuildSpecCompletionAudit: unsupported("build-spec completion audit"),
    readBuildSpecCompletionAudit: unsupported("build-spec completion audit read"),
    prepareReviewRiskPause({ stage, reviewResultRef } = {}) {
      const name = stageName(stage);
      const reviewPattern = /^quality\/reviews\/(?:results\/|attempts\/).+\.json$/;
      if (!reviewPattern.test(reviewResultRef ?? "")) throw new TypeError("review risk pause result ref is invalid");
      const raw = task.readRecord(reviewResultRef);
      const result = JSON.parse(raw);
      if (result.task_id !== task.identity.taskId || result.stage !== name) throw new Error("review risk result task/stage mismatch");
      const { snapshot } = currentContext();
      if (result.snapshot_tree !== snapshot.tree) throw new Error("review risk result does not bind the current Workspace snapshot");
      const pause = deriveSeriousReviewPause({
        taskId: task.identity.taskId,
        stage: name,
        reviewRef: reviewResultRef,
        reviewHash: hash(raw),
        result,
        workflowRunId: kernel.deriveStageWorkflowRunId(name),
      });
      if (pause.status !== "paused") return pause;
      const findings = pause.findings.map((finding) => {
        const { card_hash: _semanticHash, ...card } = finding;
        const cardRaw = `${JSON.stringify(card, null, 2)}\n`;
        const cardHash = hash(cardRaw);
        const cardRef = `quality/evidence/risk-cards/${cardHash}.json`;
        createImmutable(cardRef, cardRaw);
        return Object.freeze({ ...card, card_hash: cardHash, card_ref: cardRef });
      });
      return Object.freeze({ ...pause, findings });
    },
    acceptReviewRisk({ stage, reviewResultRef, findingId, cardRef, cardHash, selectedOption, replyRef, replyHash } = {}) {
      const pause = kernel.prepareReviewRiskPause({ stage, reviewResultRef });
      if (pause.status !== "paused") throw new Error("risk acceptance requires a serious review pause");
      const finding = pause.findings.find(({ finding_id: id }) => id === findingId);
      if (!finding || finding.card_ref !== cardRef || finding.card_hash !== cardHash) throw new Error("risk acceptance card does not bind the canonical pause card");
      if (typeof replyRef !== "string" || !/^quality\/evidence\/risk-replies\/[a-f0-9]{64}\.json$/.test(replyRef) || replyRef.includes("..")) throw new Error("risk acceptance reply ref must use content-addressed quality/evidence/risk-replies/<sha256>.json");
      const replyRaw = task.readRecord(replyRef);
      if (hash(replyRaw) !== replyHash) throw new Error("risk acceptance reply ref/hash does not bind canonical reply bytes");
      if (replyRef.slice("quality/evidence/risk-replies/".length, -".json".length) !== replyHash) throw new Error("risk acceptance reply path is not content-addressed by the canonical reply bytes");
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
      const record = createImmutable(`quality/evidence/risk-acceptances/${hash(raw)}.json`, raw);
      return Object.freeze({ risk_acceptance_ref: record.ref, risk_acceptance_hash: record.sha256, record: acceptance });
    },
    startStageRun: unsupported("stage run writer"),
    publishRequirementsLedger: unsupported("requirements ledger writer"),
    publishMaterialRevision: unsupported("material revision writer"),
    repairMaterialRevision: unsupported("material revision repair"),
    writeStageStepEntry: unsupported("stage step journal"),
    writeStageStepExit: unsupported("stage step journal"),
    readAccepted: unsupported("accepted projection"),
    readAcceptedAudit: unsupported("accepted projection"),
    confirmHistoricalAttempt: unsupported("historical attempt confirmation"),
    acceptHistoricalAttempt: unsupported("historical attempt acceptance"),
    publishHistoricalAttempt: unsupported("historical attempt writer"),
    activeStageRun: unsupported("stage run lookup"),
    latestHistoricalStageRun: unsupported("stage run lookup"),
  };
  return kernel;
}
