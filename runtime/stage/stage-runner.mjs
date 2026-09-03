import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { createHash, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, isAbsolute, sep } from "node:path";
import { captureWorkspaceSnapshot } from "../evidence/canonical-receipt-writer.mjs";
import { deriveStageCompletion, deriveStageProgress, STAGE_ADVISORY_PREDICATES, STAGE_PREDICATES } from "../stage/completion-predicates.mjs";
import { summarizeStageOutcome } from "../evidence/stage-completion-facts.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { CURRENT_MATERIAL_FILES } from "../task/material-workspace.mjs";
import { materialRevisionFromValues } from "../task/git-worktree-snapshot.mjs";
import { loadStageManifest } from "./step-manifest.mjs";
import { STAGE_SPEC_ANALYZE_PROFILES, projectAcceptanceExecutionData, validateStageSpecAnalyzeProfile } from "./stage-content-contracts.mjs";
import { isHumanConfirmationVersion, validateCanonicalTestReceipt } from "../evidence/canonical-evidence-validators.mjs";
import { validateSchema } from "../review/schema-validator.mjs";
import { authenticateCanonicalReviewResult } from "../review/canonical-review-result.mjs";
import { parseReviewerOutput } from "../review/review-output.mjs";
import { canonicalReviewFindings, isActionableSeriousFinding } from "../review/stage-review-disposition.mjs";
import { loadStageSkillManifest, validateSkillConsumerBinding, validateSkillOutcomeLifecycle } from "./stage-skill-runtime.mjs";
import { isDateTime, normalizeStageReflectionAvailability, publishStageReflectionAvailability, runStageReflection } from "./stage-reflect.mjs";
import { validateBrowserQaEvidence } from "../evidence/stage-content-evidence.mjs";

const UPSTREAM_STAGE = Object.freeze({
  "make-decision": null,
  "build-spec": "make-decision",
  "build-plan": "build-spec",
  "build-code": "build-plan",
  "verify-code": "build-code",
});
const UPSTREAM_INPUT = Object.freeze({
  "make-decision": "decision",
  "build-spec": null,
  "build-plan": "spec",
  "build-code": "build_plan",
  "verify-code": null,
});
const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const STAGE_OUTCOME_REF = /^quality\/evidence\/stage-outcomes\/(make-decision|build-spec|build-plan|build-code|verify-code)\/([a-f0-9]{64})\.json$/;
const STAGE_REFLECTION_NAMESPACE = "quality/stage-reflection/";
const STAGE_REFLECTION_REF = /^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\.json$/;
const OUTCOME_STATUSES = new Set(["completed", "skipped", "not_applicable", "incomplete", "unavailable"]);
const STAGE_OUTCOME_STATUSES = new Set(["completed", "skipped", "incomplete", "unavailable", "failed"]);
const SHA256 = /^[a-f0-9]{64}$/;
const REVIEW_REPAIR_STATUSES = new Set(["fixed", "rejected_invalid"]);
const DEFAULT_REFLECTION_TIMEOUT_MS = 30_000;

export function isStageReflectionRef(value) {
  return typeof value === "string" && value.startsWith(STAGE_REFLECTION_NAMESPACE) && STAGE_REFLECTION_REF.test(value);
}

function outcomeError(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  return error;
}

function outcomeObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw outcomeError(`${label} must be an object`);
  return value;
}

function outcomeText(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw outcomeError(`${label} must be non-empty`);
  return value;
}

function outcomeHash(value, label) {
  if (!SHA256.test(value ?? "")) throw outcomeError(`${label} must be a sha256`);
  return value;
}

function outcomeEvidence(ctx, entry, label, binding) {
  const value = outcomeObject(entry, label);
  const ref = outcomeText(value.ref, `${label}.ref`);
  const sha256 = outcomeHash(value.sha256, `${label}.sha256`);
  if (!ref.startsWith("quality/") || ref.includes("..")) throw outcomeError(`${label}.ref is outside the quality namespace`);
  let raw;
  try { raw = ctx.task.readRecord(ref); }
  catch (error) { throw outcomeError(`${label}.ref is unavailable: ${error.message}`); }
  const actual = createHash("sha256").update(raw).digest("hex");
  if (actual !== sha256) throw outcomeError(`${label}.ref hash mismatch`);
  let evidence;
  try { evidence = JSON.parse(raw); }
  catch { throw outcomeError(`${label}.ref must contain structured semantic evidence`); }
  if (evidence?.schema_version !== "workflowhub-stage-outcome-evidence.v1") {
    throw outcomeError(`${label}.ref has an invalid evidence schema`);
  }
  for (const [key, expected] of Object.entries({
    task_id: binding.taskId,
    stage: binding.stage,
    snapshot_tree: binding.snapshotTree,
    material_revision: binding.materialRevision,
    subject_kind: binding.subjectKind,
    subject_id: binding.subjectId,
    outcome_status: binding.outcomeStatus,
    result_summary: binding.resultSummary,
  })) {
    if (evidence[key] !== expected) throw outcomeError(`${label}.ref semantic binding mismatch: ${key}`);
  }
  return { ref, sha256 };
}

function validateOutcomeCost(value, label) {
  const cost = outcomeObject(value, label);
  const allowed = new Set(["duration_ms", "tokens", "status", "reason"]);
  const unknown = Object.keys(cost).filter((key) => !allowed.has(key));
  if (unknown.length) throw outcomeError(`${label} has unknown fields: ${unknown.join(", ")}`);
  for (const key of ["duration_ms", "tokens"]) {
    if (cost[key] !== null && cost[key] !== undefined
      && (!Number.isSafeInteger(cost[key]) || cost[key] < 0)) throw outcomeError(`${label}.${key} must be a non-negative integer or null`);
  }
  const status = outcomeText(cost.status, `${label}.status`);
  if (!["recorded", "partial", "unavailable"].includes(status)) throw outcomeError(`${label}.status must be recorded, partial or unavailable`);
  if (status === "recorded"
      && (!Number.isSafeInteger(cost.duration_ms) || cost.duration_ms < 0
        || !Number.isSafeInteger(cost.tokens) || cost.tokens < 0)) {
    throw outcomeError(`${label} recorded cost must include duration_ms and tokens`);
  }
  if (status === "partial") {
    const durationRecorded = Number.isSafeInteger(cost.duration_ms) && cost.duration_ms >= 0;
    const tokensRecorded = Number.isSafeInteger(cost.tokens) && cost.tokens >= 0;
    if (durationRecorded === tokensRecorded) throw outcomeError(`${label} partial cost requires exactly one measured field`);
    outcomeText(cost.reason, `${label}.reason`);
  }
  if (status === "unavailable") {
    if (cost.duration_ms !== null || cost.tokens !== null) {
      throw outcomeError(`${label} unavailable cost must leave duration_ms and tokens null`);
    }
    outcomeText(cost.reason, `${label}.reason`);
  }
  return cost;
}

function validateStepOutcome(ctx, stage, actual, expected, index, binding) {
  const value = outcomeObject(actual, `step_outcomes[${index}]`);
  if (value.step_id !== expected.step_id || value.step_slug !== expected.step_slug || value.order !== expected.order) {
    throw outcomeError(`step_outcomes[${index}] does not match manifest order/identity`);
  }
  if (!OUTCOME_STATUSES.has(value.status)) throw outcomeError(`step_outcomes[${index}].status is invalid`);
  if (!Array.isArray(value.input_refs)) throw outcomeError(`step_outcomes[${index}].input_refs must be an array`);
  value.input_refs.forEach((ref, refIndex) => outcomeText(ref, `step_outcomes[${index}].input_refs[${refIndex}]`));
  outcomeText(value.result_summary, `step_outcomes[${index}].result_summary`);
  if (!Array.isArray(value.evidence_refs)) throw outcomeError(`step_outcomes[${index}].evidence_refs must be an array`);
  const evidence = value.evidence_refs.map((entry, refIndex) => outcomeEvidence(ctx, entry, `step_outcomes[${index}].evidence_refs[${refIndex}]`, {
    ...binding,
    subjectKind: "step",
    subjectId: value.step_slug,
    outcomeStatus: value.status,
    resultSummary: value.result_summary,
  }));
  if (value.status === "completed" && evidence.length === 0) throw outcomeError(`completed step ${value.step_slug} must provide evidence`);
  if (value.status !== "completed") outcomeText(value.reason ?? value.error, `step_outcomes[${index}].reason`);
  validateOutcomeCost(value.cost, `step_outcomes[${index}].cost`);
  return { ...value, evidence_refs: evidence };
}

function validateSkillOutcome(ctx, actual, expected, index, binding) {
  const value = outcomeObject(actual, `skill_outcomes[${index}]`);
  if (value.skill_id !== expected.name) throw outcomeError(`skill_outcomes[${index}] does not match manifest order/identity`);
  try {
    validateSkillOutcomeLifecycle(value, `skill_outcomes[${index}]`);
  } catch (error) {
    throw outcomeError(error.message);
  }
  outcomeText(value.version, `skill_outcomes[${index}].version`);
  outcomeText(value.result_summary, `skill_outcomes[${index}].result_summary`);
  if (!Array.isArray(value.evidence_refs)) throw outcomeError(`skill_outcomes[${index}].evidence_refs must be an array`);
  const evidence = value.evidence_refs.map((entry, refIndex) => outcomeEvidence(ctx, entry, `skill_outcomes[${index}].evidence_refs[${refIndex}]`, {
    ...binding,
    subjectKind: "skill",
    subjectId: value.skill_id,
    outcomeStatus: value.status,
    resultSummary: value.result_summary,
  }));
  if (value.status === "completed" && evidence.length === 0) throw outcomeError(`completed skill ${value.skill_id} must provide evidence`);
  if (value.status !== "completed") outcomeText(value.reason ?? value.error, `skill_outcomes[${index}].reason`);
  validateOutcomeCost(value.cost, `skill_outcomes[${index}].cost`);
  const consumer = validateSkillConsumerBinding({
    dependency: expected,
    outcome: value,
    identity: {
      task_id: binding.taskId,
      stage: binding.stage,
      material_revision: binding.materialRevision,
      snapshot_tree: binding.snapshotTree,
    },
  });
  return { ...value, evidence_refs: evidence, consumer_binding: consumer };
}

function valueAtPath(value, path) {
  if (typeof path !== "string" || path.trim() === "") return undefined;
  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return current[key];
  }, value);
}

function consumerInputAvailable(worker, handlerInput, stageOutcome, input) {
  if (input.startsWith("receipts.")) {
    return Object.prototype.hasOwnProperty.call(handlerInput.receipts ?? {}, input.slice("receipts.".length));
  }
  if (input.startsWith("contract_facts.")) {
    return valueAtPath(handlerInput.contract_facts, input.slice("contract_facts.".length)) !== undefined;
  }
  if (input.startsWith("stage_outcome.")) {
    return valueAtPath(stageOutcome?.value, input.slice("stage_outcome.".length)) !== undefined;
  }
  if (input.startsWith("artifacts.")) {
    const artifactName = input.slice("artifacts.".length);
    if (typeof worker.readArtifact !== "function") return false;
    try { return typeof worker.readArtifact(artifactName) === "string"; } catch { return false; }
  }
  // A selector such as review.lens=simplicity-guard narrows a shared receipt;
  // it is only a declaration-level distinction.  It cannot satisfy the input
  // on its own: the shared receipt must be present first.
  if (input.includes("=")) return false;
  return valueAtPath(handlerInput, input) !== undefined;
}

function consumerInvocationObserved(worker, stageOutcome, consumer) {
  const observedByHandler = typeof worker?.hasConsumerInvocation === "function"
    && worker.hasConsumerInvocation(consumer);
  const observedByStageOutcome = Array.isArray(stageOutcome?.value?.consumer_invocations)
    && stageOutcome.value.consumer_invocations.includes(consumer);
  return observedByHandler || observedByStageOutcome;
}

export function validateSkillConsumerExecution({ worker, handlerInput, stageOutcome, handlerResult, binding, skillId } = {}) {
  if (!binding) return Object.freeze({ skill_id: skillId, status: "incomplete", reason: "consumer binding is unavailable" });
  if (["unavailable", "not_applicable", "skipped", "incomplete"].includes(binding.status)
      || binding.trigger !== true || binding.executed !== true) {
    return Object.freeze({ skill_id: skillId, status: binding.status, consumer: binding.consumer });
  }
  const inputs = Array.isArray(binding.inputs) ? binding.inputs : [];
  const inputAvailable = inputs.length > 0
    && inputs.every((input) => {
      if (input.includes("=")) {
        // Selectors distinguish a shared receipt (for example a review
        // lens or test kind); they cannot satisfy the input by themselves.
        // The corresponding base receipt must still be present.
        return inputs.some((candidate) => !candidate.includes("=")
          && consumerInputAvailable(worker, handlerInput, stageOutcome, candidate));
      }
      return consumerInputAvailable(worker, handlerInput, stageOutcome, input);
    });
  const resultAvailable = binding.result === undefined
    ? true
    : binding.result.startsWith("stage_outcome.")
      ? valueAtPath(stageOutcome?.value, binding.result.slice("stage_outcome.".length)) !== undefined
      : valueAtPath(handlerResult, binding.result) !== undefined;
  const consumerObserved = consumerInvocationObserved(worker, stageOutcome, binding.consumer);
  const consumed = inputAvailable && resultAvailable && consumerObserved;
  return Object.freeze({
    skill_id: skillId,
    status: consumed ? "consumed" : "incomplete",
    consumer: binding.consumer,
    inputs: Object.freeze(inputs),
    ...(consumed ? {} : {
      reason: !consumerObserved
        ? "declared consumer was not invoked by the current handler"
        : "declared consumer input or result was not observed by the current handler",
    }),
  });
}

function consumeSkillOutcomeBindings(worker, handlerInput, stageOutcome, handlerResult) {
  if (!stageOutcome?.value || !Array.isArray(stageOutcome.value.skill_outcomes)) return null;
  return Object.freeze(stageOutcome.value.skill_outcomes.map((outcome) => validateSkillConsumerExecution({
    worker,
    handlerInput,
    stageOutcome,
    handlerResult,
    binding: outcome.consumer_binding,
    skillId: outcome.skill_id,
  })));
}

function currentMaterialBinding(ctx) {
  const artifactDir = ctx.artifacts
    ?? ((ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot)
      ? ArtifactDir.open(ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace.worktreeRoot, ctx.task)
      : null);
  if (!artifactDir) throw outcomeError("stage outcome requires an authenticated ArtifactDir");
  const values = CURRENT_MATERIAL_FILES.map((file) => {
    try { return [file, artifactDir.read(file)]; }
    catch (error) {
      if (error?.code === "ENOENT") return [file, null];
      // Preserve real filesystem failures. Only a missing future material is
      // represented as an incomplete material set; permission, I/O, and
      // other non-ENOENT failures must remain directly diagnosable.
      throw error;
    }
  });
  const revision = materialRevisionFromValues(values);
  return { values, revision, hashes: Object.fromEntries(values.map(([file, content]) => [file, content === null ? null : createHash("sha256").update(content).digest("hex")])) };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function materialTextMap(materials) {
  return Object.fromEntries(materials.values.map(([file, content]) => [file, content]));
}

function analyzerQualityBinding(ctx, entry, label, snapshot) {
  const value = outcomeObject(entry, label);
  const ref = outcomeText(value.ref, `${label}.ref`);
  const sha256 = outcomeHash(value.sha256, `${label}.sha256`);
  if (!ref.startsWith("quality/") || ref.includes("..")) throw outcomeError(`${label}.ref is outside the quality namespace`);
  let raw;
  try { raw = ctx.task.readRecord(ref); }
  catch (error) { throw outcomeError(`${label}.ref is unavailable: ${error.message}`); }
  if (createHash("sha256").update(raw).digest("hex") !== sha256) throw outcomeError(`${label}.ref hash mismatch`);
  let evidence;
  try { evidence = JSON.parse(raw); }
  catch { throw outcomeError(`${label}.ref must contain structured evidence`); }
  if (evidence?.snapshot_tree !== snapshot.tree) {
    throw outcomeError(`${label}.ref is not bound to the current snapshot`);
  }
  return { ref, sha256, snapshot_tree: snapshot.tree };
}

function validateAnalyzerBindings(ctx, analyzer, packet, profile, materials, snapshot, stage) {
  const bindings = outcomeObject(analyzer.material_bindings, `${stage} spec_analyze.material_bindings`);
  const evidenceBindings = outcomeObject(analyzer.evidence_bindings, `${stage} spec_analyze.evidence_bindings`);
  const actualMaterials = materialTextMap(materials);
  const sourceByMaterial = {
    original_requirement: "decision-log.md",
    decision_log: "decision-log.md",
    spec: "spec.md",
    plan: "plan.md",
    tasks: "tasks.md",
  };
  const normalizedEvidence = {};
  for (const requiredRef of profile.required_evidence) {
    const packetEvidence = Array.isArray(packet.evidence)
      ? packet.evidence.find((entry) => entry?.ref === requiredRef)
      : null;
    const binding = outcomeObject(evidenceBindings[requiredRef], `${stage} spec_analyze.evidence_bindings.${requiredRef}`);
    const verified = analyzerQualityBinding(ctx, binding, `${stage} spec_analyze.evidence_bindings.${requiredRef}`, snapshot);
    if (!packetEvidence || packetEvidence.hash !== verified.sha256 || packetEvidence.snapshot_tree !== snapshot.tree) {
      throw outcomeError(`${stage} spec_analyze evidence ${requiredRef} is not bound to the authenticated quality record`);
    }
    normalizedEvidence[requiredRef] = verified;
  }
  for (const requiredMaterial of profile.required_materials) {
    const binding = outcomeObject(bindings[requiredMaterial], `${stage} spec_analyze.material_bindings.${requiredMaterial}`);
    if (requiredMaterial === "implementation") {
      const verified = analyzerQualityBinding(ctx, binding, `${stage} spec_analyze.material_bindings.${requiredMaterial}`, snapshot);
      if (binding.material_sha256 !== createHash("sha256").update(String(packet.materials?.[requiredMaterial] ?? "")).digest("hex")) {
        throw outcomeError(`${stage} spec_analyze implementation material binding does not match the packet`);
      }
      continue;
    }
    const expectedSource = sourceByMaterial[requiredMaterial];
    if (binding.source_ref !== expectedSource) {
      throw outcomeError(`${stage} spec_analyze material ${requiredMaterial} must bind ${expectedSource}`);
    }
    const actual = actualMaterials[expectedSource];
    if (typeof actual !== "string") throw outcomeError(`${stage} spec_analyze material ${expectedSource} is unavailable`);
    const actualHash = createHash("sha256").update(actual).digest("hex");
    if (binding.sha256 !== actualHash || binding.snapshot_tree !== snapshot.tree) {
      throw outcomeError(`${stage} spec_analyze material ${requiredMaterial} hash is not current`);
    }
    if (packet.materials?.[requiredMaterial] !== actual) {
      throw outcomeError(`${stage} spec_analyze material ${requiredMaterial} does not contain the current material bytes`);
    }
  }
  return Object.freeze({ materials: Object.freeze({ ...bindings }), evidence: Object.freeze(normalizedEvidence) });
}

function validateStageSpecAnalyzeOutcome(ctx, record, stage, snapshot, materialRevision, materials, manifest, skillManifest) {
  const analyzer = outcomeObject(record.spec_analyze, "stage outcome spec_analyze");
  if (analyzer.schema_version !== "workflowhub-spec-analyze-stage-outcome.v1") {
    throw outcomeError("stage outcome spec_analyze schema_version is invalid");
  }
  if (analyzer.stage !== stage || analyzer.snapshot_tree !== snapshot.tree || analyzer.material_revision !== materialRevision) {
    throw outcomeError("stage outcome spec_analyze is not bound to the current stage snapshot and materials");
  }
  const analyzerStep = manifest.steps.find((step) => ["stage-end-spec-analyze", "final-spec-analyze"].includes(step.step_slug));
  if (!analyzerStep || analyzer.step_slug !== analyzerStep.step_slug) {
    throw outcomeError("stage outcome spec_analyze is not bound to the declared stage-end analyzer step");
  }
  if (analyzer.skill_id !== "spec-analyze") throw outcomeError("stage outcome spec_analyze must bind the spec-analyze skill");
  const analyzerSkill = skillManifest.skills?.find((skill) => skill.name === "spec-analyze");
  if (!analyzerSkill) throw outcomeError(`${stage} manifest must declare the spec-analyze skill`);
  const analyzerSkillOutcome = record.skill_outcomes.find((entry) => entry?.skill_id === "spec-analyze");
  const analyzerStepOutcome = record.step_outcomes.find((entry) => entry?.step_slug === analyzerStep.step_slug);
  if (!analyzerSkillOutcome?.trigger || analyzerSkillOutcome.executed !== true) {
    throw outcomeError(`${stage} stage-end analyzer skill was not executed`);
  }
  if (!analyzerStepOutcome) throw outcomeError(`${stage} stage-end analyzer step outcome is missing`);

  const analysis = validateStageSpecAnalyzeProfile({
    stage,
    packet: analyzer.packet,
    strict_material_contracts: true,
    identity: {
      task_id: ctx.task?.identity?.taskId ?? ctx.identity?.taskId,
      stage,
      material_revision: materialRevision,
      snapshot_tree: snapshot.tree,
    },
  });
  const profileDefinition = STAGE_SPEC_ANALYZE_PROFILES[stage];
  validateAnalyzerBindings(ctx, analyzer, analyzer.packet, profileDefinition, materials, snapshot, stage);
  const supplied = outcomeObject(analyzer.result, "stage outcome spec_analyze.result");
  for (const key of ["status", "errors", "findings", "summary", "facts"]) {
    if (!sameJson(supplied[key], analysis[key])) throw outcomeError(`stage outcome spec_analyze.result.${key} does not match the semantic validator`);
  }
  if (record.status === "completed" && analyzerStepOutcome.status !== "completed") {
    throw outcomeError(`${stage} completed stage must mark the stage-end analyzer step completed`);
  }
  return Object.freeze({ analyzer, analysis });
}

/**
 * A review is not required to become "clean" after a repair.  The review
 * result remains bound to the snapshot it actually inspected; a later
 * current stage outcome may instead record that every actionable finding was
 * fixed (or rejected as invalid) in the same task.  Keep this small and
 * explicit so an arbitrary status string cannot turn an old review into a
 * current success claim.
 */
function codeReviewRepairResolution(result, bound = null) {
  const sourceFindings = canonicalReviewFindings(bound ?? result).filter(isActionableSeriousFinding);
  if (sourceFindings.length === 0) return result?.status === "unavailable" ? "unavailable" : "clean";
  if (result?.status !== "findings" || !Array.isArray(result.repairs)) return "findings";
  const sourceIds = new Set(sourceFindings.map((finding) => finding.id));
  const repairedIds = new Set();
  for (const repair of result.repairs) {
    if (!repair || typeof repair !== "object" || Array.isArray(repair)) return "findings";
    const findingId = repair.finding_id ?? repair.id;
    if (typeof findingId !== "string" || !sourceIds.has(findingId)
        || repairedIds.has(findingId) || !REVIEW_REPAIR_STATUSES.has(repair.status)) {
      return "findings";
    }
    repairedIds.add(findingId);
  }
  return repairedIds.size === sourceIds.size ? "resolved" : "findings";
}

function validateCodeReviewOutcome(ctx, record, stage, snapshot, materialRevision, manifest, skillManifest) {
  const review = outcomeObject(record.code_review, "stage outcome code_review");
  if (review.schema_version !== "workflowhub-code-review-stage-outcome.v1") {
    throw outcomeError("stage outcome code_review schema_version is invalid");
  }
  if (review.stage !== stage || review.snapshot_tree !== snapshot.tree || review.material_revision !== materialRevision) {
    throw outcomeError("stage outcome code_review is not bound to the current stage snapshot and materials");
  }
  const reviewStep = manifest.steps.find((step) => step.step_slug === "approve-verification");
  if (!reviewStep || review.step_slug !== reviewStep.step_slug) throw outcomeError("stage outcome code_review is not bound to approve-verification");
  const reviewSkill = skillManifest.skills?.find((skill) => skill.name === "dsh-code-review");
  if (!reviewSkill || review.skill_id !== reviewSkill.name) throw outcomeError("stage outcome code_review must bind dsh-code-review");
  const skillOutcome = record.skill_outcomes.find((entry) => entry?.skill_id === reviewSkill.name);
  const stepOutcome = record.step_outcomes.find((entry) => entry?.step_slug === reviewStep.step_slug);
  if (!skillOutcome?.trigger || skillOutcome.executed !== true) throw outcomeError("verify-code code-review skill was not executed");
  if (!stepOutcome) throw outcomeError("verify-code code-review closure step outcome is missing");
  const result = outcomeObject(review.result, "stage outcome code_review.result");
  if (!new Set(["clean", "findings", "unavailable"]).has(result.status)) throw outcomeError("stage outcome code_review.result.status is invalid");
  if (!Array.isArray(result.findings) || typeof result.summary !== "string" || result.summary.trim() === "") {
    throw outcomeError("stage outcome code_review.result must contain findings and summary");
  }
  for (const [index, finding] of result.findings.entries()) {
    if (!finding || typeof finding !== "object" || Array.isArray(finding)
        || !["blocking", "major", "minor"].includes(finding.severity)
        || typeof finding.path !== "string" || finding.path.trim() === ""
        || typeof finding.issue !== "string" || finding.issue.trim() === ""
        || typeof finding.recommendation !== "string" || finding.recommendation.trim() === "") {
      throw outcomeError(`stage outcome code_review.result.findings[${index}] is invalid`);
    }
  }
  const boundRef = review.quality_review_ref;
  const boundHash = review.quality_review_hash;
  if ((boundRef === undefined) !== (boundHash === undefined)) {
    throw outcomeError("stage outcome code_review quality_review_ref/hash must be provided together");
  }
  let resolution = codeReviewRepairResolution(result);
  if (boundRef !== undefined) {
    if (!/^quality\/reviews\/(?:results\/[^/]+\.json|attempts\/[^/]+\/attempt\.json)$/.test(boundRef)
        || !SHA256.test(boundHash)) {
      throw outcomeError("stage outcome code_review quality_review_ref/hash is invalid");
    }
    let raw;
    try { raw = ctx.task.readRecord(boundRef); }
    catch (error) { throw outcomeError(`stage outcome code_review quality_review_ref is unavailable: ${error.message}`); }
    if (createHash("sha256").update(raw).digest("hex") !== boundHash) {
      throw outcomeError("stage outcome code_review quality_review_hash does not match the referenced bytes");
    }
    let bound;
    try { bound = JSON.parse(raw); }
    catch { throw outcomeError("stage outcome code_review quality_review_ref must contain JSON"); }
    if (bound.version === "wh-review-attempt.v1") {
      const mismatches = [
        record.status === "completed" ? "stage status is completed" : null,
        result.status !== "unavailable" ? `result status is ${result.status}` : null,
        bound.task_id !== ctx.identity.taskId ? "task mismatch" : null,
        bound.stage !== stage ? "stage mismatch" : null,
        bound.snapshot_tree !== snapshot.tree ? "snapshot mismatch" : null,
        bound.material_revision !== materialRevision ? "material revision mismatch" : null,
        bound.terminal_status !== "unavailable" ? `terminal status is ${bound.terminal_status}` : null,
      ].filter(Boolean);
      if (mismatches.length) {
        throw outcomeError(`unavailable stage outcome code_review is not bound to an unavailable review attempt: ${mismatches.join(", ")}`);
      }
    } else {
      try { validateSchema("result", bound); }
      catch (error) { throw outcomeError(`stage outcome code_review quality review is invalid: ${error.message}`); }
      resolution = codeReviewRepairResolution(result, bound);
      if (bound.task_id !== ctx.identity.taskId || bound.stage !== stage
          || bound.subject_kind !== "worktree" || bound.phase_id !== null || bound.review_scope !== null
          || (bound.snapshot_tree !== snapshot.tree && resolution !== "resolved")
          || bound.material_revision !== materialRevision) {
        throw outcomeError("stage outcome code_review quality review is not bound to the current task, snapshot, or materials");
      }
      const serious = canonicalReviewFindings(bound).filter(isActionableSeriousFinding);
      if (result.status === "clean" && serious.length > 0) {
        throw outcomeError("stage outcome code_review clean result hides actionable serious findings");
      }
      const outcomeSerious = canonicalReviewFindings(result).filter(isActionableSeriousFinding);
      const seriousKey = (finding) => JSON.stringify({
        severity: finding.severity,
        path: finding.path,
        issue: finding.issue,
        recommendation: finding.recommendation,
      });
      const outcomeKeys = new Set(outcomeSerious.map(seriousKey));
      if (serious.some((finding) => !outcomeKeys.has(seriousKey(finding)))) {
        throw outcomeError("stage outcome code_review omitted an actionable serious finding from the bound quality review");
      }
    }
  }
  const actionableFindings = canonicalReviewFindings(result).filter(isActionableSeriousFinding);
  if (record.status === "completed" && (result.status === "unavailable" || (actionableFindings.length > 0 && resolution !== "resolved"))) {
    throw outcomeError("completed verify-code stage requires every actionable finding to be fixed or rejected as invalid");
  }
  if (record.status === "completed" && (skillOutcome.status !== "completed" || stepOutcome.status !== "completed")) {
    throw outcomeError("completed verify-code stage must complete the code-review skill and closure step");
  }
  return Object.freeze({ review, resolution });
}

function authenticateStageOutcome(ctx, stage, input, expectedBinding = null) {
  const ref = input?.receipts?.stage_outcomes;
  if (typeof ref !== "string") throw outcomeError(`${stage} official run requires receipts.stage_outcomes from the current WorkflowHub session`);
  const match = STAGE_OUTCOME_REF.exec(ref);
  if (!match || match[1] !== stage) throw outcomeError(`stage outcome ref must be content-addressed for ${stage}`);
  let raw;
  try { raw = ctx.task.readRecord(ref); }
  catch (error) { throw outcomeError(`stage outcome receipt is unavailable: ${error.message}`); }
  const actualHash = createHash("sha256").update(raw).digest("hex");
  if (actualHash !== match[2]) throw outcomeError("stage outcome receipt hash does not match its ref");
  let value;
  try { value = JSON.parse(raw); }
  catch { throw outcomeError("stage outcome receipt must be valid JSON"); }
  const record = outcomeObject(value, "stage outcome receipt");
  if (record.schema_version !== "workflowhub-stage-outcomes.v1") throw outcomeError("stage outcome schema_version is invalid");
  if (record.task_id !== ctx.identity.taskId || record.stage !== stage) throw outcomeError("stage outcome task/stage identity mismatch");
  if (record.run_id !== undefined && record.run_id !== null && record.run_id !== ctx.workflowRunId) throw outcomeError("stage outcome workflow run identity mismatch");
  outcomeText(record.attempt_id, "stage outcome attempt_id");
  if (input.attempt_id !== undefined && input.attempt_id !== record.attempt_id) throw outcomeError("stage outcome attempt identity mismatch");
  if (!STAGE_OUTCOME_STATUSES.has(record.status)) throw outcomeError("stage outcome status is invalid");
  const snapshot = expectedBinding?.snapshot ?? ctx.kernel.currentVNextSnapshot();
  if (record.snapshot_tree !== snapshot.tree) throw outcomeError("stage outcome snapshot_tree is stale");
  const materials = currentMaterialBinding(ctx);
  if (expectedBinding?.materials && (materials.revision !== expectedBinding.materials.revision || !sameJson(materials.hashes, expectedBinding.materials.hashes))) {
    throw outcomeError("current materials changed after stage invocation was claimed");
  }
  if (record.material_revision !== materials.revision) throw outcomeError("stage outcome material_revision is stale");
  if (JSON.stringify(record.material_hashes) !== JSON.stringify(materials.hashes)) {
    throw outcomeError(`stage outcome material_hashes do not match current materials: ${CURRENT_MATERIAL_FILES.join(", ")}`);
  }
  const stepsRef = `workflows/${stage}/steps.json`;
  const skillsRef = `workflows/${stage}/skill-deps.yaml`;
  if (record.steps_manifest_ref !== stepsRef || record.skills_manifest_ref !== skillsRef) throw outcomeError("stage outcome manifest refs are not canonical");
  const stepsRaw = readFileSync(join(REPOSITORY_ROOT, stepsRef), "utf8");
  const skillsRaw = readFileSync(join(REPOSITORY_ROOT, skillsRef), "utf8");
  if (record.steps_manifest_hash !== createHash("sha256").update(stepsRaw).digest("hex")
    || record.skills_manifest_hash !== createHash("sha256").update(skillsRaw).digest("hex")) throw outcomeError("stage outcome manifest hash is stale");
  const manifest = loadStageManifest(stage, REPOSITORY_ROOT);
  const skillManifest = loadStageSkillManifest(REPOSITORY_ROOT, stage).manifest;
  if (!Array.isArray(record.step_outcomes) || record.step_outcomes.length !== manifest.steps.length) throw outcomeError("stage outcome must contain every declared step exactly once");
  if (!Array.isArray(record.skill_outcomes) || record.skill_outcomes.length !== (skillManifest?.skills?.length ?? 0)) throw outcomeError("stage outcome must contain every declared skill exactly once");
  const binding = {
    taskId: ctx.identity.taskId,
    stage,
    snapshotTree: snapshot.tree,
    materialRevision: materials.revision,
  };
  const stepOutcomes = record.step_outcomes.map((entry, index) => validateStepOutcome(ctx, stage, entry, manifest.steps[index], index, binding));
  const skillOutcomes = record.skill_outcomes.map((entry, index) => validateSkillOutcome(ctx, entry, skillManifest.skills[index], index, binding));
  const stageReview = stage === "verify-code"
    ? validateCodeReviewOutcome(ctx, record, stage, snapshot, materials.revision, manifest, skillManifest)
    : validateStageSpecAnalyzeOutcome(ctx, record, stage, snapshot, materials.revision, materials, manifest, skillManifest);
  return Object.freeze({
    ref,
    sha256: actualHash,
    // Reuse the authenticated entry snapshot for the immediately following
    // official stage run.  The publication path still captures a fresh
    // snapshot at the end, so external material changes remain detectable.
    snapshot,
    // The analyzer consumer is executed inside this authenticated wrapper;
    // keep the observation in memory so binding validation can verify the
    // declared consumer without creating another persisted state machine.
    consumer_invocations: stage === "verify-code"
      ? Object.freeze([])
      : Object.freeze(["stage-runner#validateStageSpecAnalyzeOutcome"]),
    value: Object.freeze({
      ...record,
      step_outcomes: stepOutcomes,
      skill_outcomes: skillOutcomes,
      ...(stage === "verify-code"
        ? { code_review: stageReview.review, code_review_resolution: stageReview.resolution }
        : { spec_analyze: stageReview.analyzer }),
    }),
    step_outcomes: stepOutcomes,
    skill_outcomes: skillOutcomes,
    ...(stage === "verify-code"
      ? { code_review: stageReview.review, code_review_resolution: stageReview.resolution }
      : { spec_analyze: stageReview.analyzer }),
  });
}

/**
 * Resolve the one current, completed build-code execution that a verify-code
 * reviewer may inspect. Historical, stale, incomplete, and ambiguously
 * duplicated outcomes are not review authority.
 */
export function authenticateCurrentBuildCodeStageOutcome(context = {}) {
  const task = assertTaskHandle(context.task);
  const kernel = assertTaskKernel(context.kernel);
  if (kernel.task !== task) throw outcomeError("build-code outcome TaskHandle/TaskKernel mismatch");
  const identity = context.identity ?? task.identity;
  if (identity?.taskId !== task.identity.taskId) throw outcomeError("build-code outcome task identity mismatch");
  const authenticated = [];
  for (const ref of task.listCanonicalStageOutcomeRefs("build-code")) {
    let raw;
    let candidate;
    try { raw = task.readRecord(ref); candidate = JSON.parse(raw); }
    catch { continue; }
    if (candidate?.status !== "completed") continue;
    try {
      const current = authenticateStageOutcome({ ...context, task, kernel, identity, workflowRunId: candidate.run_id ?? null }, "build-code", { receipts: { stage_outcomes: ref }, attempt_id: candidate.attempt_id });
      const producer = outcomeObject(current.value.producer, "build-code stage outcome producer");
      const sourceId = outcomeText(producer.source_id, "build-code stage outcome producer.source_id");
      const sourceFamily = outcomeText(producer.source_family, "build-code stage outcome producer.source_family");
      if (sourceFamily !== sourceId.split("/")[0]) throw outcomeError("build-code stage outcome producer source identity mismatch");
      authenticated.push(Object.freeze({
        ...current,
        raw,
        actor: Object.freeze({
          source_kind: outcomeText(producer.kind, "build-code stage outcome producer.kind"),
          source_id: sourceId,
          run_id: outcomeText(producer.agent_run_id, "build-code stage outcome producer.agent_run_id"),
        }),
      }));
    } catch { /* Only a fully authenticated current outcome is eligible. */ }
  }
  if (authenticated.length !== 1) throw outcomeError("exactly one current completed build-code outcome is required");
  return authenticated[0];
}

/**
 * An external Stage Agent outcome is diagnostic execution evidence, not a
 * permission to run the current WorkflowHub handler. A missing or invalid
 * handoff remains visible as an unavailable diagnostic so the normal stage can
 * continue with its own authenticated receipts; structural event and bridge
 * inputs still fail before they can write current facts.
 */
function readOptionalStageOutcome(ctx, stage, input, expectedBinding = null) {
  const supplied = input?.receipts?.stage_outcomes;
  if (supplied === undefined) {
    return Object.freeze({ value: null, diagnostic: { status: "unavailable", reason: "stage_outcome_missing" } });
  }
  try {
    return Object.freeze({ value: authenticateStageOutcome(ctx, stage, input, expectedBinding), diagnostic: null });
  } catch (error) {
    const invalid = error?.code === "MATERIAL_INCOMPLETE";
    return Object.freeze({
      value: null,
      diagnostic: {
        status: "unavailable",
        reason: invalid ? "stage_outcome_invalid" : "stage_outcome_unavailable",
        error_code: typeof error?.code === "string" && error.code.trim() ? error.code : "STAGE_OUTCOME_UNAVAILABLE",
      },
    });
  }
}

function upstreamForStage(ctx, stage) {
  const slot = UPSTREAM_INPUT[stage];
  return slot && Object.prototype.hasOwnProperty.call(ctx.manifest.inputs ?? {}, slot)
    ? ctx.kernel.readInput(slot)
    : null;
}

function workerContext(ctx, publication = {}, reflectionScheduler = null) {
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    currentMaterialRevision: ctx.kernel.currentVNextMaterialRevision(),
    manifest: ctx.manifest,
    deriveStageWorkflowRunId: (stage) => ctx.kernel.deriveStageWorkflowRunId(stage),
    ...(ctx.candidateWorkspace ? { candidateWorkspace: ctx.candidateWorkspace } : {}),
    ...(ctx.workspace ? { workspace: ctx.workspace } : {}),
    ...(ctx.artifacts ? { artifacts: ctx.artifacts } : {}),
    ...(typeof reflectionScheduler === "function" ? { runStageEndReflection: reflectionScheduler } : {}),
  });
}

function assertContext(context, stage) {
  if (!context || typeof context !== "object" || context.stage !== stage) {
    throw new TypeError(`StageContext for ${stage} is required`);
  }
  const task = assertTaskHandle(context.task);
  const kernel = assertTaskKernel(context.kernel);
  if (kernel.task !== task) throw new Error("StageContext TaskHandle/TaskKernel mismatch");
  return context;
}

function plainResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("stage handler must return a plain result object");
  }
  if (!value.facts || typeof value.facts !== "object" || Array.isArray(value.facts)) {
    throw new TypeError("stage handler result.facts is required");
  }
  if (Object.prototype.hasOwnProperty.call(value, "schema_version") && value.schema_version !== "stage-runtime-result.v2") {
    throw new TypeError("stage handler result schema_version must be stage-runtime-result.v2");
  }
  return value;
}

function stageFailureDiagnostic(error, reason) {
  const summary = error instanceof Error ? error.message : String(error);
  return Object.freeze({
    status: "failed",
    reason,
    error_code: typeof error?.code === "string" && error.code.trim() !== ""
      ? error.code
      : "STAGE_EXECUTION_FAILED",
    error_summary: summary,
  });
}

function stageReflectionAvailabilityReason(error) {
  if (error?.code === "STAGE_INTERRUPTED" || error?.code === "ABORT_ERR" || error?.name === "AbortError") {
    return "interrupted";
  }
  if (error?.code === "STAGE_IDENTITY_FAILED"
      || /identity/i.test(error?.code ?? "")
      || /identity\s+(?:mismatch|failed)/i.test(error?.message ?? "")) return "identity_failed";
  if (error?.code === "STAGE_STARTUP_FAILED"
      || error?.code === "STAGE_HANDLER_STARTUP_FAILED") return "startup_failed";
  return null;
}

const STAGE_REFLECTION_STATUSES = new Set(["completed", "failed"]);

function stageReflectionRef(stage) {
  return `quality/stage-reflection/${stage}.json`;
}

function reflectionTimestamp(value) {
  if (value === undefined || value === null) return new Date().toISOString();
  let timestamp;
  if (value instanceof Date) {
    if (Number.isNaN(value.valueOf())) throw new TypeError("stage reflection timestamp must be a valid ISO string or Date");
    timestamp = value.toISOString();
  } else if (typeof value === "string" && value.trim() !== "") {
    timestamp = value;
  } else {
    throw new TypeError("stage reflection timestamp must be an ISO string or Date");
  }
  if (!isDateTime(timestamp)) throw new TypeError("stage reflection timestamp must be a valid ISO-compatible timestamp");
  return timestamp;
}

async function executeReflectionWithDeadline(execute, input, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const execution = Promise.resolve().then(() => execute({ ...input, signal: controller.signal }));
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const error = new Error(`stage reflection timed out after ${timeoutMs}ms`);
      error.code = "STAGE_REFLECTION_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([execution, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

function reflectionRecord(ctx, stage, stageStatus, generatedAt, value, error = null) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? structuredClone(value) : {};
  if (record.schema_version !== "stage-reflection.v1"
      || record.record_kind !== "judgment"
      || record.task_id !== ctx.identity.taskId
      || record.stage !== stage
      || record.stage_status !== stageStatus
      || typeof record.generated_at !== "string"
      || !["ok", "degraded", "failed"].includes(record.status)
      || !Array.isArray(record.judgments)
      || !Array.isArray(record.interventions)
      || !Array.isArray(record.lessons_added)) {
    if (!error) throw new Error("stage reflection executor returned an invalid stage-reflection.v1 record");
  }
  if (error) {
    return {
      schema_version: "stage-reflection.v1",
      record_kind: "judgment",
      task_id: ctx.identity.taskId,
      stage,
      stage_status: stageStatus,
      generated_at: generatedAt,
      status: "failed",
      error: { summary: error.message },
      judgments: [],
      interventions: [],
      lessons_added: [],
    };
  }
  if (record.error !== null && (typeof record.error !== "object" || Array.isArray(record.error))) {
    throw new Error("stage reflection error must be null or an object");
  }
  return record;
}

function deferredReflectionPrelude(ctx, stage, reflectionRef, observation, now) {
  return Object.freeze({
    status: "deferred",
    path: join("Projects", ctx.identity.projectName, "lessons", `${stage}.jsonl`),
    entry: null,
    reflection_ref: reflectionRef,
    observation,
    observed_at: now,
  });
}

/** Run the non-blocking stage-end reflection through the shared reflect transaction. */
export async function runStageEndReflection(context, {
  stageStatus = "completed",
  execute,
  observation = null,
  stageOutcome = null,
  stageOutcomeDiagnostic = null,
  availabilityState,
  reasonCode,
  generatedAt,
  now,
  timeoutMs = DEFAULT_REFLECTION_TIMEOUT_MS,
} = {}) {
  const ctx = assertContext(context, context?.stage);
  const stage = ctx.stage;
  if (!STAGE_REFLECTION_STATUSES.has(stageStatus)) throw new TypeError("stage reflection stageStatus must be completed or failed");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError("stage reflection timeoutMs must be a positive safe integer");
  const declaredStep = loadStageManifest(stage, REPOSITORY_ROOT).steps.find((step) => step.on_stage_end === true);
  if (!declaredStep) throw new Error(`stage ${stage} does not declare an on_stage_end reflection step`);
  const reflectionRef = stageReflectionRef(stage);
  const observedAt = reflectionTimestamp(now);
  const generated = reflectionTimestamp(generatedAt ?? observedAt);
  if (availabilityState !== undefined || reasonCode !== undefined || typeof execute !== "function") {
    const availabilityInput = normalizeStageReflectionAvailability({ state: availabilityState, reasonCode });
    const availability = publishStageReflectionAvailability(ctx, {
      state: availabilityInput.state,
      reasonCode: availabilityInput.reasonCode,
      now: observedAt,
    });
    return Object.freeze({
      status: availabilityInput.state,
      step_status: availabilityInput.state,
      reflection_status: availabilityInput.state,
      ref: null,
      sha256: availability.sha256,
      persisted: false,
      availability,
      availability_ref: availability.ref,
      availability_sha256: availability.sha256,
    });
  }
  const lessonText = typeof observation === "string" && observation.trim() !== ""
    ? observation.trim()
    : `stage ${stage} ended with status ${stageStatus}; current-session reflection was scheduled`;
  const prelude = deferredReflectionPrelude(ctx, stage, reflectionRef, lessonText, observedAt);
  let value;
  let executionError = null;
  let executed;
  try {
    executed = await executeReflectionWithDeadline(execute, {
      taskId: ctx.identity.taskId,
      stage,
      stageStatus,
      reflectionRef,
      prelude,
      stageOutcome,
      stageOutcomeDiagnostic,
      step: Object.freeze({ ...declaredStep }),
    }, timeoutMs);
  } catch (error) {
    executionError = error instanceof Error ? error : new Error(String(error));
  }
  if (executionError) {
    value = reflectionRecord(ctx, stage, stageStatus, generated, null, executionError);
  } else {
    const executedValue = executed?.value && typeof executed.value === "object" && !Array.isArray(executed.value)
      ? executed.value
      : executed;
    try {
      value = reflectionRecord(ctx, stage, stageStatus, generated, executedValue);
    } catch (error) {
      return Object.freeze({
        status: "failed",
        step_status: "failed",
        reflection_status: "failed",
        ref: null,
        sha256: null,
        persisted: false,
        prelude,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let result;
  try {
    result = await runStageReflection(ctx, {
      input: value,
      observation: lessonText,
      now: observedAt,
    });
  } catch (error) {
    return Object.freeze({
      status: "failed",
      step_status: "failed",
      reflection_status: "failed",
      ref: null,
      sha256: null,
      persisted: false,
      prelude,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  const reflection = result.reflection ?? value;
  const reflectionStatus = reflection.status === "failed" ? "failed" : "completed";
  const reflectionError = executionError?.message ?? (result.status === "degraded" ? result.lesson?.error : null);
  return Object.freeze({
    status: reflectionStatus,
    step_status: reflectionStatus === "completed" ? "completed" : "failed",
    reflection_status: reflection.status,
    ref: result.publication?.ref ?? null,
    sha256: result.publication?.sha256 ?? null,
    persisted: result.publication !== null && result.publication !== undefined,
    prelude,
    ...(reflectionError ? { error: reflectionError } : {}),
  });
}

function assertWriteBoundary(ctx) {
  const task = ctx.task;
  const kernel = ctx.kernel;
  if (!task || kernel.task !== task) throw new Error("runner/task identity mismatch for write boundary");
  const worktreeRoot = ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot;
  if (!worktreeRoot) throw new Error("no task worktree bound for write boundary");
  // cwd is outside the task worktree: fail-loud boundary reserved for CLI invocation;
  // test runners may use sibling temp directories while still binding the same task.
  if (process.env.WORKFLOWHUB_ENFORCE_CWD && !inside(worktreeRoot, process.cwd())) {
    throw new Error("cwd is outside the task worktree");
  }
}

function inside(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function publishVNextEvidence(ctx, ref, raw) {
  assertWriteBoundary(ctx);
  // Stage runner is the producer for the agent_outcome canonical receipt; a
  // missing or invalid host result must be persisted as an unavailable fact
  // through the existing canonical receipt writer, not left as a vacuum.
  try {
    return ctx.kernel.publishCanonicalRecord(ref, raw);
  } catch (error) {
    if (error?.code !== "EEXIST" || ctx.task.readRecord(ref) !== raw) throw error;
    return { ref, idempotent: true };
  }
}

function currentMaterialTexts(ctx) {
  const reader = ctx.artifacts?.read
    ? (name) => ctx.artifacts.read(name)
    : (ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot)
      ? (() => {
        const artifacts = ArtifactDir.open(ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace.worktreeRoot, ctx.task);
        return (name) => artifacts.read(name);
      })()
      : null;
  if (!reader) return null;
  return Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => {
    try { return [name, reader(name)]; }
    catch (error) {
      if (error?.code === "ENOENT") return [name, null];
      throw error;
    }
  }));
}

function readCurrentE2eAcceptanceEvidence(ctx) {
  const materials = currentMaterialTexts(ctx);
  const projection = projectAcceptanceExecutionData(materials?.["tasks.md"], {
    decisionLog: materials?.["decision-log.md"],
    spec: materials?.["spec.md"],
  });
  if (!projection.requires_independent_verdict) return Object.freeze({ required: false });
  const snapshot = ctx.kernel.currentVNextSnapshot();
  const materialRevision = ctx.kernel.currentVNextMaterialRevision();
  const facts = (ctx.task.listCanonicalQualityFactRefs?.() ?? []).flatMap((ref) => {
    try {
      const raw = ctx.task.readRecord(ref);
      const value = JSON.parse(raw);
      if (value?.schema_version !== "quality-fact.v1" || value.task_id !== ctx.identity.taskId
          || value.stage !== "build-code" || value.kind !== "acceptance_criterion"
          || value.subject !== "acceptance_execution" || value.snapshot_tree !== snapshot.tree
          || value.material_revision !== materialRevision) return [];
      return [{ ref, sha256: createHash("sha256").update(raw).digest("hex"), value }];
    } catch { return []; }
  });
  const executionFact = facts.at(-1);
  const executionEvidence = executionFact?.value?.evidence?.[0];
  const execution = executionFact?.value?.status === "passed" && executionEvidence
    ? { status: "passed", ref: executionEvidence.ref, sha256: executionEvidence.sha256, executor_actor: null }
    : { status: "missing", ref: null, sha256: null, executor_actor: null };
  return Object.freeze({
    required: true,
    execution: Object.freeze(execution),
    independent_review: Object.freeze({ status: "missing", ref: null, sha256: null, reviewer_actor: null, frozen_material: null }),
    user_confirmation: Object.freeze({ status: "missing", ref: null, sha256: null }),
  });
}

function specAnalyzeDisclosure(value) {
  if (!value || typeof value !== "object") return null;
  return Object.freeze({
    schema_version: value.schema_version,
    stage: value.stage,
    snapshot_tree: value.snapshot_tree,
    material_revision: value.material_revision,
    step_slug: value.step_slug,
    skill_id: value.skill_id,
    result: value.result,
  });
}

function evidenceCandidate(result, kind, subject, stage) {
  const facts = result?.facts ?? {};
  const subjectFact = kind === "review"
    ? stage === "verify-code" && subject === "code_review"
      ? facts.code_review
      : ["same_build_integration_review", "integration_review", "independent_review"].includes(subject)
        ? facts.review
        : subject === "direction_review"
          ? facts.reviews?.direction
          : subject === "detail_review"
            ? facts.reviews?.detail
            : facts.review
    : facts[subject]
      ?? (kind === "test" ? facts.tests : null)
      ?? (kind === "confirmation" ? facts.human_confirmation : null);
  // verify-code's independent review is a distinct quality subject. If the
  // handler did not publish its dedicated quality_note, a generic review ref
  // (usually build-code's review) must not be reused as a false binding.
  if (kind === "review" && stage === "verify-code" && subject === "independent_review" && !subjectFact) {
    return null;
  }
  if (kind === "review" && ["direction_review", "detail_review"].includes(subject) && !subjectFact) {
    return null;
  }
  const directRef = subjectFact?.receipt_ref ?? subjectFact?.result_ref ?? subjectFact?.attempt_ref ?? subjectFact?.confirmation_ref;
  const directHash = subjectFact?.receipt_hash ?? subjectFact?.result_hash ?? subjectFact?.attempt_hash ?? subjectFact?.confirmation_hash;
  if (typeof directRef === "string" && typeof directHash === "string") {
    if (/^(?:receipts|reviews|evidence\/confirmations)\//.test(directRef)) {
      throw new Error(`vNext evidence must use quality namespace; legacy projection is retired: ${directRef}`);
    }
    return { ref: directRef, sha256: directHash };
  }
  const refs = Array.isArray(result.evidence_refs) ? result.evidence_refs : [];
  const matches = kind === "review"
    ? refs.filter((entry) => /^quality\/reviews\/(?:results|attempts)\//.test(entry?.ref ?? ""))
    : kind === "test"
      // Implementation receipts and test receipts share the receipts/
      // namespace. Select the canonical tests namespace so an implementation
      // receipt cannot be mistaken for a passing test fact.
      ? refs.filter((entry) => /^quality\/tests(?:\/|\.json$)/.test(entry?.ref ?? ""))
      : kind === "confirmation"
        ? refs.filter((entry) => /^quality\/confirmations\//.test(entry?.ref ?? ""))
        : [];
  return matches.find((entry) => typeof entry?.sha256 === "string") ?? null;
}

export function acceptanceResultForSubjectStatus(status) {
  if (status === "passed") return "pass";
  if (status === "failed") return "fail";
  if (status === "inconclusive") return "inconclusive";
  if (status === "deferred" || status === "missing") return "deferred";
  throw new Error(`unsupported acceptance subject status: ${status}`);
}

function currentConfirmationCandidate(ctx, snapshotTree) {
  const refs = typeof ctx.task.listCanonicalQualityFactRefs === "function"
    ? ctx.task.listCanonicalQualityFactRefs()
    : [];
  for (const factRef of [...refs].reverse()) {
    try {
      const factRaw = ctx.task.readRecord(factRef);
      const fact = JSON.parse(factRaw);
      const evidence = fact?.evidence?.[0];
      if (fact?.schema_version !== "quality-fact.v1"
          || fact.stage !== ctx.stage
          || fact.subject !== "human_confirmation"
          || fact.kind !== "confirmation"
          || fact.status !== "passed"
          || fact.snapshot_tree !== snapshotTree
          || typeof evidence?.ref !== "string"
          || !evidence.ref.startsWith("quality/confirmations/")
          || typeof evidence.sha256 !== "string") continue;
      const evidenceRaw = ctx.task.readRecord(evidence.ref);
      const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
      if (evidenceHash === evidence.sha256) return { ref: evidence.ref, sha256: evidence.sha256 };
    } catch {
      // Ignore unrelated or historical quality facts; the current run remains fail-closed.
    }
  }
  return null;
}

function authenticateStageReviewResult(task, result) {
  validateSchema("result", result);
  const attempt = JSON.parse(task.readRecord(result.attempt_ref));
  validateSchema("attempt", attempt);
  if (attempt.task_id !== task.identity.taskId
      || attempt.stage !== result.stage
      || attempt.review_track !== result.review_track
      || attempt.snapshot_tree !== result.snapshot_tree
      || attempt.material_id !== result.material_id
      || attempt.terminal_status !== "semantic"
      || attempt.error !== null) {
    throw new Error("review attempt/result binding is invalid");
  }
  const attemptId = result.attempt_ref.match(/^quality\/reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error("review attempt identity is invalid");
  const latest = new Map();
  for (const providerAttempt of attempt.provider_attempts) latest.set(providerAttempt.provider, providerAttempt);
  const providerOutputs = [];
  for (const providerAttempt of latest.values()) {
    if (providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
    const output = JSON.parse(task.readRecord(providerAttempt.output_ref));
    if (output.schema_version !== "wh-review-provider-output.v1"
        || output.task_id !== task.identity.taskId
        || output.stage !== attempt.stage
        || output.attempt_id !== attemptId
        || output.provider !== providerAttempt.provider
        || typeof output.content !== "string"
        || output.content_hash !== createHash("sha256").update(output.content).digest("hex")) {
      throw new Error(`review provider output provenance is invalid: ${providerAttempt.provider}`);
    }
    providerOutputs.push({
      ref: providerAttempt.output_ref,
      provider: providerAttempt.provider,
      ...(providerAttempt.identity ? { identity: providerAttempt.identity } : {}),
      ...(providerAttempt.execution ? { execution: providerAttempt.execution } : {}),
      ...(output.evidence_anchor_valid === undefined ? {} : { evidenceAnchors: output.evidence_anchor_valid }),
      review: parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined }),
    });
  }
  return authenticateCanonicalReviewResult({ attempt, result, providerOutputs });
}

function reviewEvidenceStatus(task, candidate, { stage = null, subject = null } = {}) {
  if (!candidate) return { status: "missing" };
  let record;
  let raw;
  try {
    raw = task.readRecord(candidate.ref);
    if (candidate.sha256 && createHash("sha256").update(raw).digest("hex") !== candidate.sha256) return { status: "missing" };
    record = JSON.parse(raw);
  } catch {
    // Only a canonical wh-review attempt with terminal_status=unavailable is
    // an unavailable review fact. A missing or malformed record is missing
    // evidence, not a transport result that may be disclosed as unavailable.
    return { status: "missing" };
  }
  if (/^quality\/reviews\/results\//.test(candidate.ref)) {
    if (record?.version === "wh-review-result.v1"
        && !Object.hasOwn(record, "verdict")
        && Array.isArray(record.provider_results)
        && Array.isArray(record.findings)
      && record.adjudication?.version === "wh-review-adjudication.v1") {
      if (stage === "verify-code" && ["code_review", "independent_review"].includes(subject)) {
        try {
          // An empty findings array is only meaningful after the immutable
          // attempt, terminal provider members, provider outputs, and
          // aggregation have all been authenticated. Do not let a copied or
          // partially failed result satisfy the final code-review predicate.
          authenticateStageReviewResult(task, record);
          const hasSeriousFinding = canonicalReviewFindings(record).some(isActionableSeriousFinding);
          return subject === "code_review"
            ? hasSeriousFinding
              ? { status: "missing", review_status: "findings" }
              : { status: "recorded", review_status: "clean" }
            : { status: "recorded", review_status: hasSeriousFinding ? "findings" : "clean" };
        } catch {
          return { status: "missing" };
        }
      }
      if (stage === "build-code" && subject === "integration_review") {
        try {
          authenticateStageReviewResult(task, record);
          const hasSeriousFinding = canonicalReviewFindings(record).some(isActionableSeriousFinding);
          return { status: "recorded", review_status: hasSeriousFinding ? "findings" : "clean" };
        } catch {
          return { status: "missing" };
        }
      }
      return { status: "recorded" };
    }
    return { status: "missing" };
  }
  if (/^quality\/reviews\/attempts\//.test(candidate.ref) && record?.terminal_status === "unavailable") {
    return { status: "unavailable" };
  }
  return { status: "missing" };
}

function testEvidenceStatus(task, candidate, { stage, subject } = {}) {
  if (!candidate) return { status: "missing" };
  let raw;
  try {
    raw = task.readRecord(candidate.ref);
    if (candidate.sha256 && createHash("sha256").update(raw).digest("hex") !== candidate.sha256) {
      return { status: "unavailable" };
    }
    const record = JSON.parse(raw);
    if (stage === "verify-code" && subject === "full_tests_fresh") {
      validateCanonicalFullTestReceipt(record, { taskId: task.identity.taskId, snapshotTree: record.snapshot_tree });
    }
    if (!Number.isInteger(record?.exit_code)) return { status: "unavailable" };
    return { status: record.exit_code === 0 ? "passed" : "failed" };
  } catch {
    return { status: "unavailable" };
  }
}

function confirmationEvidenceStatus(task, candidate) {
  if (!candidate) return { status: "missing" };
  try {
    const raw = task.readRecord(candidate.ref);
    if (candidate.sha256 && createHash("sha256").update(raw).digest("hex") !== candidate.sha256) return { status: "unavailable" };
    const record = JSON.parse(raw);
    if (!isHumanConfirmationVersion(record) || !new Set(["accepted", "rejected"]).has(record.decision)) return { status: "unavailable" };
    return { status: record.decision === "accepted" ? "passed" : "failed" };
  } catch {
    return { status: "unavailable" };
  }
}

function assertVNextSourceStable(ctx, expectedSnapshot) {
  const observed = ctx.kernel.currentVNextSnapshot();
  if (observed.source_digest !== expectedSnapshot.source_digest || observed.tree !== expectedSnapshot.tree) {
    const error = new Error(`FORMAL_SNAPSHOT_MISMATCH: expected source/tree ${expectedSnapshot.source_digest}/${expectedSnapshot.tree}, observed ${observed.source_digest}/${observed.tree}`);
    error.code = "FORMAL_SNAPSHOT_MISMATCH";
    error.expected_source_digest = expectedSnapshot.source_digest;
    error.observed_source_digest = observed.source_digest;
    error.expected_tree = expectedSnapshot.tree;
    error.observed_tree = observed.tree;
    throw error;
  }
  return observed;
}

/**
 * The authoring-stage spec-analyze result is the owner of the stage-end
 * quality fact. Keep its evidence publication in one place so the generic
 * predicate loop cannot silently manufacture a completion fact without a
 * current analyzer result.
 */
function publishAcceptanceQualityFact(ctx, snapshot, {
  subject,
  status,
  detail,
  evidenceRefs = [],
  dispositionItems,
  sourceReviewRefs,
  riskAcceptanceRefs,
  executionItems,
  executionBinding,
}) {
  const subjectEvidence = evidenceRefs.filter((entry) => typeof entry?.ref === "string" && typeof entry?.sha256 === "string");
  const evidenceValue = {
    schema_version: "stage-quality-evidence.v1",
    task_id: ctx.identity.taskId,
    stage: ctx.stage,
    subject,
    status,
    snapshot_tree: snapshot.tree,
    subject_fact: {
      status,
      detail: detail ?? "stage did not provide a subject-specific completion fact",
      evidence_refs: subjectEvidence,
      ...(dispositionItems ? {
        disposition_items: dispositionItems ?? [],
        source_review_refs: sourceReviewRefs ?? [],
        risk_acceptance_refs: riskAcceptanceRefs ?? [],
      } : {}),
      ...(executionItems ? {
        execution_items: executionItems,
        execution_binding: executionBinding ?? null,
      } : {}),
    },
  };
  const evidenceRaw = `${JSON.stringify(evidenceValue, null, 2)}\n`;
  const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
  const evidenceRef = `quality/evidence/stage-quality/${ctx.stage}/${subject}-${evidenceHash}.json`;
  publishVNextEvidence(ctx, evidenceRef, evidenceRaw);

  const acceptanceValue = {
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: subject,
    result: acceptanceResultForSubjectStatus(status),
    refs: [{ ref: evidenceRef, sha256: evidenceHash }],
    snapshot_tree: snapshot.tree,
    summary: { actual_outcome: status, evidence_type: "stage quality fact" },
    freshness: {
      status: "current",
      evaluated_at: new Date().toISOString(),
      snapshot_tree: snapshot.tree,
      material_revision: ctx.kernel.currentVNextMaterialRevision(),
      evidence_freshness: [{ ref: evidenceRef, sha256: evidenceHash, status: "current" }],
    },
  };
  const acceptanceRaw = `${JSON.stringify(acceptanceValue, null, 2)}\n`;
  const acceptanceHash = createHash("sha256").update(acceptanceRaw).digest("hex");
  const acceptanceRef = `quality/evidence/acceptance/${ctx.stage}/${subject}-${acceptanceHash}.json`;
  publishVNextEvidence(ctx, acceptanceRef, acceptanceRaw);

  const qualityFactStatus = new Set(["passed", "failed", "missing"]).has(status) ? status : "missing";
  const fact = ctx.kernel.publishVNextQualityFact(ctx.stage, {
    kind: "acceptance_criterion",
    status: qualityFactStatus,
    subject,
    evidence: [{ ref: acceptanceRef, sha256: acceptanceHash, evidence_type: "acceptance_evidence" }],
  });
  return Object.freeze({
    fact,
    evidence: Object.freeze({ ref: acceptanceRef, sha256: acceptanceHash }),
  });
}

function publishStageEndSpecAnalyzeFact(ctx, result, snapshot) {
  if (!Object.prototype.hasOwnProperty.call(STAGE_PREDICATES[ctx.stage] ?? {}, "stage_end_spec_analyze")) return null;
  const analyzerResult = result.spec_analyze?.result;
  const consistent = analyzerResult?.status === "consistent";
  const stageOutcomeEvidence = typeof result.stage_outcome_ref === "string"
    && typeof result.stage_outcome_hash === "string"
    ? [{ ref: result.stage_outcome_ref, sha256: result.stage_outcome_hash }]
    : [];
  return publishAcceptanceQualityFact(ctx, snapshot, {
    subject: "stage_end_spec_analyze",
    status: consistent ? "passed" : "missing",
    detail: consistent
      ? "current stage-end spec-analyze is semantically consistent"
      : `current stage-end spec-analyze is ${analyzerResult?.status ?? "unavailable"}`,
    evidenceRefs: stageOutcomeEvidence,
  });
}

function unavailableAcceptanceScenario(scenario, reason) {
  return Object.freeze({ status: "unavailable", tier: scenario.tier, reason, evidence_refs: Object.freeze([]) });
}

function sameAcceptanceScenario(candidate, expected) {
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    && ["source", "sample", "scenario", "tier"].every((field) => candidate[field] === expected[field]);
}

function sameExactIdentity(left, right, fields) {
  return left && typeof left === "object" && !Array.isArray(left)
    && right && typeof right === "object" && !Array.isArray(right)
    && fields.every((field) => left[field] === right[field]);
}

function sameBrowserAcceptanceExecutionIdentity(payload, stored) {
  return sameExactIdentity(payload.environment_identity, stored.environment_identity,
    ["kind", "name", "revision", "endpoint", "runtime_id"])
    && sameExactIdentity(payload.data_identity, stored.data_identity,
      ["kind", "name", "revision", "source", "dataset_id", "fixture_only"]);
}

function canonicalBrowserQaComparable(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const comparable = { ...value };
  delete comparable.evidence_ref;
  delete comparable.evidence_hash;
  return comparable;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function dataIdentityMatchesAcceptanceScenario(dataIdentity, acceptanceScenario) {
  return dataIdentity?.source === acceptanceScenario?.source
    && dataIdentity?.dataset_id === acceptanceScenario?.sample;
}

function browserQaAttachment(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || typeof value.ref !== "string"
      || !/^quality\/evidence\/browser-qa\/[a-f0-9]{64}\.json$/.test(value.ref)
      || !SHA256.test(value.hash ?? "")) {
    throw new Error(`${label} must bind one task-owned browser-qa publication record`);
  }
  return value;
}

function verifyBrowserQaAttachment(task, reference, label) {
  const attachment = browserQaAttachment(reference, label);
  const raw = task.readRecord(attachment.ref);
  if (createHash("sha256").update(raw).digest("hex") !== attachment.hash) throw new Error(`${label} canonical record hash mismatch`);
  let publication;
  try { publication = JSON.parse(raw); } catch { throw new Error(`${label} canonical record is not JSON`); }
  const allowed = new Set(["schema_version", "source_path", "content_sha256", "content_encoding", "content_base64", "publisher", "recorded_at"]);
  if (!publication || typeof publication !== "object" || Array.isArray(publication)
      || Object.keys(publication).some((key) => !allowed.has(key))
      || publication.schema_version !== "workflowhub-evidence-publication.v1"
      || typeof publication.source_path !== "string" || publication.source_path.trim() === ""
      || !SHA256.test(publication.content_sha256 ?? "")
      || publication.content_encoding !== "base64"
      || typeof publication.content_base64 !== "string"
      || typeof publication.publisher !== "string" || publication.publisher.trim() === ""
      || typeof publication.recorded_at !== "string" || publication.recorded_at.trim() === "") {
    throw new Error(`${label} is not a complete browser evidence publication`);
  }
  const bytes = Buffer.from(publication.content_base64, "base64");
  if (bytes.toString("base64") !== publication.content_base64
      || createHash("sha256").update(bytes).digest("hex") !== publication.content_sha256
      || attachment.ref !== `quality/evidence/browser-qa/${publication.content_sha256}.json`) {
    throw new Error(`${label} published content hash mismatch`);
  }
}

function verifyBrowserAcceptanceAttachments(ctx, candidate) {
  const screenshots = Array.isArray(candidate?.screenshots) ? candidate.screenshots : [];
  const screenshotRefs = Array.isArray(candidate?.visual?.screenshot_refs) ? candidate.visual.screenshot_refs : [];
  if (screenshots.length === 0 || screenshotRefs.length === 0
      || new Set(screenshots.map((entry) => entry?.ref)).size !== screenshots.length
      || new Set(screenshotRefs).size !== screenshotRefs.length
      || screenshots.length !== screenshotRefs.length
      || screenshots.some((entry) => !screenshotRefs.includes(entry.ref))) {
    throw new Error("browser acceptance screenshot references are incomplete or inconsistent");
  }
  screenshots.forEach((reference, index) => verifyBrowserQaAttachment(ctx.task, reference, `browser acceptance screenshot ${index + 1}`));
  const outputRef = candidate?.test?.output_ref;
  const outputHash = candidate?.test?.output_hash;
  if (typeof outputRef !== "string" || !/^quality\/tests\/output\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(outputRef) || !SHA256.test(outputHash ?? "")) {
    throw new Error("browser acceptance test output reference is invalid");
  }
  const output = ctx.task.readRecord(outputRef);
  if (createHash("sha256").update(output).digest("hex") !== outputHash) throw new Error("browser acceptance test output hash mismatch");
}

function currentBrowserAcceptanceBinding(candidate, { binding, attemptId, invocationId, acceptanceScenario }) {
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    && candidate.applicability === "ui" && candidate.result === "pass"
    && candidate.task_id === binding.task_id && candidate.stage === binding.stage
    && candidate.attempt_id === attemptId && candidate.material_revision === binding.material_revision
    && candidate.snapshot_tree === binding.snapshot_tree && candidate.invocation_id === invocationId
    && Array.isArray(binding.acceptance_criterion_ids)
    && binding.acceptance_criterion_ids.includes(candidate.acceptance_criterion_id)
    && sameAcceptanceScenario(candidate.acceptance_scenario, acceptanceScenario)
    && candidate.cancellation?.status === "not_cancelled" && candidate.cleanup?.status === "completed"
    && candidate.fixture?.fixture_only === false
    && candidate.environment_identity?.kind && candidate.environment_identity?.name
    && candidate.environment_identity?.revision && candidate.environment_identity?.endpoint
    && candidate.environment_identity?.runtime_id
    && candidate.data_identity?.kind && candidate.data_identity?.name
    && candidate.data_identity?.revision && candidate.data_identity?.source
    && candidate.data_identity?.dataset_id && candidate.data_identity?.fixture_only === false
    && dataIdentityMatchesAcceptanceScenario(candidate.data_identity, acceptanceScenario)
    && String(candidate.service_identity?.instance ?? "").toLowerCase() !== "fixture";
}

async function privateAcceptanceScenario(ctx, publication, scenario, attemptId = null) {
  if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) throw new TypeError("acceptance scenario must be an object");
  const snapshot = ctx.kernel.currentVNextSnapshot();
  const materialRevision = ctx.kernel.currentVNextMaterialRevision();
  if (scenario.task_id !== ctx.identity.taskId || scenario.stage !== "build-code" || scenario.snapshot_tree !== snapshot.tree) {
    throw new Error("acceptance scenario is not bound to the current build-code task and snapshot");
  }
  for (const field of ["source", "sample", "scenario"]) {
    if (typeof scenario[field] !== "string" || scenario[field].trim() === "") throw new TypeError(`acceptance scenario ${field} is required`);
  }
  if (!new Set(["browser", "service", "command"]).has(scenario.tier)) throw new Error("acceptance scenario tier is unsupported");
  const binding = Object.freeze({
    task_id: ctx.identity.taskId, stage: "build-code", material_revision: materialRevision, snapshot_tree: snapshot.tree,
    source: scenario.source, sample: scenario.sample, scenario: scenario.scenario, tier: scenario.tier,
    acceptance_criterion_ids: Object.freeze([...(scenario.acceptance_criterion_ids ?? [])]),
  });
  if (scenario.tier !== "browser") return unavailableAcceptanceScenario(scenario, `${scenario.tier} acceptance execution has no canonical scenario-bound evidence contract`);
  if (typeof publication.runControlledUiQa !== "function") return unavailableAcceptanceScenario(scenario, "browser acceptance execution has no controlled QA adapter");
  if (typeof attemptId !== "string" || attemptId.trim() === "") return unavailableAcceptanceScenario(scenario, "browser acceptance execution has no current attempt binding");
  const acceptanceScenario = Object.freeze({ source: scenario.source, sample: scenario.sample, scenario: scenario.scenario, tier: "browser" });
  const invocationId = `acceptance-browser-${randomUUID()}`;
  try {
    const result = await publication.runControlledUiQa(Object.freeze({
      ...binding,
      project_name: ctx.identity.projectName,
      task_path: ctx.task.taskPath,
      worktree_root: ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot,
      attempt_id: attemptId,
      invocation_id: invocationId,
      acceptance_scenario: acceptanceScenario,
    }));
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("controlled QA adapter must return an object");
    if (result.invocation_id !== undefined && result.invocation_id !== invocationId) throw new Error("controlled QA adapter invocation_id mismatch");
    const payload = result.payload ?? result.browser_qa ?? result.evidence;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("controlled QA adapter payload is missing");
    const ref = result.evidence_ref;
    const sha256 = result.evidence_hash;
    if (typeof ref !== "string" || !/^quality\/evidence\/browser-qa\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(ref) || !SHA256.test(sha256 ?? "")) throw new Error("controlled QA canonical evidence ref/hash is invalid");
    if (payload.evidence_ref !== ref || payload.evidence_hash !== sha256) throw new Error("controlled QA payload does not bind its canonical evidence ref/hash");
    const raw = ctx.task.readRecord(ref);
    if (createHash("sha256").update(raw).digest("hex") !== sha256) throw new Error("controlled QA canonical evidence hash mismatch");
    let stored;
    try { stored = JSON.parse(raw); } catch { throw new Error("controlled QA canonical evidence is not JSON"); }
    validateBrowserQaEvidence(payload);
    validateBrowserQaEvidence(stored);
    const expected = { binding, attemptId, invocationId, acceptanceScenario };
    if (!currentBrowserAcceptanceBinding(payload, expected) || !currentBrowserAcceptanceBinding(stored, expected)) throw new Error("controlled QA payload or canonical bytes do not match the current browser acceptance binding");
    if (!sameBrowserAcceptanceExecutionIdentity(payload, stored)) throw new Error("controlled QA payload execution identities do not match canonical bytes");
    if (canonicalJson(canonicalBrowserQaComparable(payload)) !== canonicalJson(canonicalBrowserQaComparable(stored))) throw new Error("controlled QA payload content does not match canonical bytes");
    verifyBrowserAcceptanceAttachments(ctx, payload);
    verifyBrowserAcceptanceAttachments(ctx, stored);
    return Object.freeze({ status: "executed", tier: "browser", executor: "controlled-browser-qa", evidence_refs: Object.freeze([{ ref, sha256 }]) });
  } catch (error) {
    return unavailableAcceptanceScenario(scenario, `browser acceptance execution is unavailable: ${error.message}`);
  }
}

function publishVNextStage(ctx, result, preflightSnapshot, preflightMaterials) {
  // Quality facts and canonical records are content-addressed and written
  // atomically by the TaskKernel. A stage-level publication lock would be a
  // second coordination control plane, not a source-of-truth requirement.
  const snapshot = assertVNextSourceStable(ctx, preflightSnapshot);
  const materials = currentMaterialBinding(ctx);
  if (preflightMaterials && (materials.revision !== preflightMaterials.revision || !sameJson(materials.hashes, preflightMaterials.hashes))) {
    throw outcomeError("current materials changed before stage publication");
  }
  const qualityFactRefs = [];
  const qualityAdvisoryFactRefs = [];
  const reviewStatuses = new Map();
  let allPassed = true;
  const qualityWarnings = [];
  const qualityAdvisories = [];
  const analyzerResult = result.spec_analyze?.result;
  // Semantic findings are quality facts. They are deliberately not an
  // execution/progression gate: the same stage can publish the finding so
  // the current WorkflowHub session repairs it in place instead of silently handing it down.
  const stageAnalyzeFact = publishStageEndSpecAnalyzeFact(ctx, result, snapshot);
  if (stageAnalyzeFact) {
    qualityFactRefs.push(stageAnalyzeFact.fact.ref);
  }
  if (stageAnalyzeFact && analyzerResult?.status !== "consistent") {
    allPassed = false;
    qualityWarnings.push(`stage-end-spec-analyze:${analyzerResult?.status ?? "unavailable"}`);
  }
  const predicateEntries = [
    ...Object.entries(STAGE_PREDICATES[ctx.stage])
      .filter(([subject]) => subject !== "stage_end_spec_analyze")
      .map(([subject, kind]) => ({ subject, kind, gating: true })),
    ...(ctx.stage === "build-spec" && result.facts?.completion_subjects?.ui_design
      ? [{ subject: "ui_design", kind: "acceptance_criterion", gating: true }]
      : []),
    ...(ctx.stage === "build-code" && result.facts?.completion_subjects?.acceptance_execution
      ? [{ subject: "acceptance_execution", kind: "acceptance_criterion", gating: false }]
      : []),
    ...(ctx.stage === "verify-code" && result.facts?.completion_subjects?.e2e_acceptance
      ? [{ subject: "e2e_acceptance", kind: "acceptance_criterion", gating: true }]
      : []),
    ...Object.entries(STAGE_ADVISORY_PREDICATES[ctx.stage] ?? {}).map(([subject, kind]) => ({ subject, kind, gating: false })),
  ];
  for (const { subject, kind, gating } of predicateEntries) {
      const candidate = evidenceCandidate(result, kind, subject, ctx.stage)
      ?? (kind === "confirmation" ? currentConfirmationCandidate(ctx, snapshot.tree) : null);
    const acceptanceSubject = kind === "acceptance_criterion"
      ? subject === "finding_dispositions"
        ? (() => {
          const dispositions = result.facts?.finding_dispositions;
          const items = Array.isArray(dispositions?.items) ? dispositions.items : [];
          const complete = dispositions?.status === "not_applicable"
            || (dispositions?.status === "recorded" && items.every((item) => item.status !== "needs_human"));
          return {
            status: complete ? "passed" : "missing",
            detail: "serious findings are fixed or explicitly risk-accepted",
            disposition_items: items,
            source_review_refs: dispositions?.source_review_refs ?? [],
            risk_acceptance_refs: dispositions?.risk_acceptance_refs ?? [],
          };
        })()
        : result.facts?.completion_subjects?.[subject]
      : null;
    let review = kind === "review" ? reviewEvidenceStatus(ctx.task, candidate, { stage: ctx.stage, subject }) : null;
    // A canonical dsh review may have inspected the pre-repair snapshot.  The
    // authenticated stage outcome can still close the current review when it
    // explicitly records every actionable finding as fixed/rejected.  Keep
    // the old review ref and snapshot untouched; only the current fact's
    // disposition changes to `resolved`.
    if (kind === "review" && ctx.stage === "verify-code" && subject === "code_review"
        && candidate !== null && result.code_review_resolution === "resolved"
        && typeof result.stage_outcome_ref === "string" && typeof result.stage_outcome_hash === "string") {
      review = { status: "recorded", review_status: "resolved" };
    }
    if (kind === "review" && review?.review_status) reviewStatuses.set(subject, review.review_status);
    const test = kind === "test" ? testEvidenceStatus(ctx.task, candidate, { stage: ctx.stage, subject }) : null;
    const confirmation = kind === "confirmation" ? confirmationEvidenceStatus(ctx.task, candidate) : null;
    const status = kind === "acceptance_criterion"
      ? acceptanceSubject?.status === undefined
        ? "missing"
        : new Set(["passed", "failed", "inconclusive", "deferred", "missing"]).has(acceptanceSubject.status)
          ? acceptanceSubject.status
          : (() => { throw new Error(`unsupported acceptance subject status: ${acceptanceSubject.status}`); })()
      : kind === "review"
        ? review.status
      : kind === "test"
        ? test.status
      : kind === "confirmation"
        ? confirmation.status
      : candidate === null
        ? "missing"
        : "passed";
    const qualityPredicatePassed = kind === "review" ? status === "recorded" : status === "passed";
    if (!qualityPredicatePassed && gating) {
      allPassed = false;
      qualityWarnings.push(`${subject}:${status}`);
    } else if (!qualityPredicatePassed) {
      qualityAdvisories.push(`${subject}:${status}`);
    }
    const evidenceType = { test: "test_receipt", review: "review_result", acceptance_criterion: "acceptance_evidence", confirmation: "human_confirmation" }[kind];
    let factEvidenceRef = kind === "acceptance_criterion" ? undefined : candidate?.ref;
    let factEvidenceHash = kind === "acceptance_criterion" ? undefined : candidate?.sha256;
    const factEvidence = kind === "acceptance_criterion" ? [] : candidate ? [candidate] : [];
    let acceptanceFact = null;
    if (kind === "acceptance_criterion") {
      const subjectEvidence = Array.isArray(acceptanceSubject?.evidence_refs)
        ? acceptanceSubject.evidence_refs.filter((entry) => typeof entry?.ref === "string" && typeof entry?.sha256 === "string")
        : [];
      acceptanceFact = publishAcceptanceQualityFact(ctx, snapshot, {
        subject,
        status,
        detail: acceptanceSubject?.detail,
        evidenceRefs: subjectEvidence,
        ...(subject === "finding_dispositions" ? {
          dispositionItems: acceptanceSubject?.disposition_items ?? [],
          sourceReviewRefs: acceptanceSubject?.source_review_refs ?? [],
          riskAcceptanceRefs: acceptanceSubject?.risk_acceptance_refs ?? [],
        } : {}),
        ...(subject === "acceptance_execution" ? {
          executionItems: acceptanceSubject?.execution_items ?? [],
          executionBinding: typeof result.stage_outcome_ref === "string" && typeof result.stage_outcome_hash === "string"
            ? { stage_outcome_ref: result.stage_outcome_ref, stage_outcome_hash: result.stage_outcome_hash }
            : null,
        } : {}),
      });
      factEvidenceRef = acceptanceFact.evidence.ref;
      factEvidenceHash = acceptanceFact.evidence.sha256;
      factEvidence.push(acceptanceFact.evidence);
    }
    if (factEvidenceRef === undefined) {
      const missingValue = {
        schema_version: "stage-quality-missing.v1",
        task_id: ctx.identity.taskId,
        stage: ctx.stage,
        subject,
        status,
        snapshot_tree: snapshot.tree,
        reason: "canonical evidence was not supplied by the stage handler",
      };
      const missingRaw = `${JSON.stringify(missingValue, null, 2)}\n`;
      factEvidenceHash = createHash("sha256").update(missingRaw).digest("hex");
      factEvidenceRef = `quality/evidence/stage-quality-missing/${ctx.stage}/${subject}-${factEvidenceHash}.json`;
      publishVNextEvidence(ctx, factEvidenceRef, missingRaw);
      factEvidence.push({ ref: factEvidenceRef, sha256: factEvidenceHash });
    }
    const qualityFactStatus = kind === "review"
      ? (new Set(["recorded", "unavailable", "missing"]).has(status) ? status : "missing")
      : (new Set(["passed", "failed", "missing"]).has(status) ? status : "missing");
    const resolvedReviewAuthorization = kind === "review"
      && reviewStatuses.get(subject) === "resolved"
      ? { resolved_review: { stage_outcome_ref: result.stage_outcome_ref, stage_outcome_hash: result.stage_outcome_hash } }
      : undefined;
    const fact = kind === "acceptance_criterion"
      ? acceptanceFact.fact
      : ctx.kernel.publishVNextQualityFact(ctx.stage, {
        kind,
        status: qualityFactStatus,
        ...(kind === "review" && reviewStatuses.has(subject) ? { review_status: reviewStatuses.get(subject) } : {}),
        subject,
        evidence: factEvidence.map(({ ref, sha256 }) => ({ ref, sha256, evidence_type: evidenceType })),
      }, resolvedReviewAuthorization);
    qualityFactRefs.push(fact.ref);
    if (!gating) qualityAdvisoryFactRefs.push(fact.ref);
  }
  // Build-code coverage is a per-AC ledger, not merely one aggregate
  // `acceptance_criteria` predicate. Publish one immutable quality fact for
  // every current spec AC so product-release derivation can authenticate the
  // actual leaves. Missing/unknown rows remain non-passing facts; no status is
  // inferred from the number of rows or from aggregate test counts.
  if (ctx.stage === "build-code" && Array.isArray(result.facts?.acceptance_coverage?.items)) {
    for (const item of result.facts.acceptance_coverage.items) {
      const subject = typeof item?.acceptance_criterion_id === "string" ? item.acceptance_criterion_id : null;
      if (!subject) continue;
      const status = item.status === "covered" ? "passed" : "missing";
      const leaf = publishAcceptanceQualityFact(ctx, snapshot, {
        subject,
        status,
        detail: item.semantic_gap ?? (status === "passed" ? "current per-AC evidence" : "current per-AC evidence is not yet complete"),
        evidenceRefs: Array.isArray(item.evidence_refs) ? item.evidence_refs : [],
      });
      qualityFactRefs.push(leaf.fact.ref);
    }
  }
  // The stage is source-bound at entry and rechecked once after publication
  // writes. Re-capturing a multi-gigabyte worktree for every AC does not add
  // protection because these writes are outside the source snapshot boundary.
  assertVNextSourceStable(ctx, preflightSnapshot);
  const observations = qualityFactRefs.map((ref) => {
    const raw = ctx.task.readRecord(ref);
    const value = JSON.parse(raw);
    return {
      fact: { ref, value },
      authenticated: true,
      freshness: { status: "current" },
      ...(reviewStatuses.has(value.subject) ? { review_status: reviewStatuses.get(value.subject) } : {}),
    };
  });
  const readiness = deriveStageProgress(ctx.stage, observations, currentMaterialTexts(ctx));
  const completion = deriveStageCompletion(ctx.stage, observations);
  for (const binding of result.skill_consumer_bindings ?? []) {
    if (binding.status === "incomplete") {
      qualityAdvisories.push(`${binding.skill_id}:consumer_incomplete`);
    }
  }
  const stageOutcomeSummary = typeof result.stage_outcome_ref === "string"
    ? summarizeStageOutcome({
      stage: ctx.stage,
      stageOutcomeRef: result.stage_outcome_ref,
      stageOutcomeHash: result.stage_outcome_hash,
      stageOutcomeStatus: result.stage_outcome_status,
      stepOutcomes: result.step_outcomes,
      skillOutcomes: result.skill_outcomes,
      specAnalyze: analyzerResult,
    })
    : null;
  return Object.freeze({
    schema_version: "stage-runtime-result.vnext",
    stage: ctx.stage,
    status: completion.status,
    work_status: readiness.work_status,
    continuation_allowed: readiness.continuation_allowed,
    readiness,
    completion,
    quality_status: allPassed && !result.verification_failure && !(result.missing_items?.length) ? "passed" : "incomplete",
    ...(allPassed && !result.verification_failure && !(result.missing_items?.length) ? {} : {
      quality_warnings: Object.freeze([
        ...qualityWarnings,
        ...(result.missing_items ?? []),
        ...(result.verification_failure ? [result.reason ?? "verification quality facts are incomplete"] : []),
      ]),
    }),
    quality_fact_refs: Object.freeze(qualityFactRefs),
    quality_advisory_fact_refs: Object.freeze(qualityAdvisoryFactRefs),
    ...(qualityAdvisories.length ? { quality_advisories: Object.freeze(qualityAdvisories) } : {}),
    ...(Array.isArray(result.skill_consumer_bindings) ? { skill_consumer_bindings: Object.freeze([...result.skill_consumer_bindings]) } : {}),
    stage_outcome_ref: typeof result.stage_outcome_ref === "string" ? result.stage_outcome_ref : null,
    stage_outcome_hash: typeof result.stage_outcome_hash === "string" ? result.stage_outcome_hash : null,
    stage_outcome_status: typeof result.stage_outcome_status === "string" ? result.stage_outcome_status : "unavailable",
    ...(typeof result.stage_outcome_ref === "string" ? {
      step_outcomes: Object.freeze([...(result.step_outcomes ?? [])]),
      skill_outcomes: Object.freeze([...(result.skill_outcomes ?? [])]),
      spec_analyze: result.spec_analyze,
      code_review: result.code_review,
      stage_outcome_summary: stageOutcomeSummary,
    } : {}),
    ...(result.stage_outcome_diagnostic ? { stage_outcome_diagnostic: Object.freeze({ ...result.stage_outcome_diagnostic }) } : {}),
    ...(result.missing_items?.length ? { missing_items: [...result.missing_items] } : {}),
  });
}

/**
 * Execute the low-level publication helper for a workflow stage.
 * The handler receives capabilities and already verified upstream data; it does
 * not discover task identity or publish records itself. Stage skills are read
 * and executed directly by the current WorkflowHub session host; this runtime only
 * records the resulting task and quality facts.
 */
export async function runStage(stage, context, handler, publication = {}, internal = {}) {
  if (!Object.prototype.hasOwnProperty.call(UPSTREAM_STAGE, stage)) {
    throw new TypeError(`unsupported stage: ${stage}`);
  }
  const ctx = assertContext(context, stage);
  if (typeof handler !== "function") throw new TypeError("stage handler is required");
  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");

  let vNextPreflightSnapshot;
  let vNextPreflightMaterials;
  const hasReflectionSchedule = Object.prototype.hasOwnProperty.call(internal ?? {}, "stageReflection");
  const reflectionOptions = hasReflectionSchedule ? internal.stageReflection : null;
  if (reflectionOptions !== null
      && (!reflectionOptions || typeof reflectionOptions !== "object" || Array.isArray(reflectionOptions))) {
    throw new TypeError("stageReflection options must be an object");
  }
  if (reflectionOptions !== null) {
    const declaredStep = loadStageManifest(stage, REPOSITORY_ROOT).steps.find((step) => step.on_stage_end === true);
    if (!declaredStep || declaredStep.blocking !== false) {
      throw new Error(`stage ${stage} must declare a non-blocking on_stage_end reflection step`);
    }
  }
  let reflectionPromise = null;
  const reflectionInput = internal?.stageReflectionInput;
  if (reflectionInput !== undefined
      && (!reflectionInput || typeof reflectionInput !== "object" || Array.isArray(reflectionInput))) {
    throw new TypeError("stageReflectionInput must be an object");
  }
  const currentReflectionInput = () => reflectionInput ? { ...reflectionInput } : {};
  const scheduleReflection = reflectionOptions === null
    ? null
    : (options = {}) => {
      if (reflectionPromise === null) {
        reflectionPromise = Promise.resolve()
          .then(() => runStageEndReflection(ctx, { ...reflectionOptions, ...currentReflectionInput(), ...options }))
          .catch((error) => Object.freeze({
            status: "failed",
            step_status: "failed",
            reflection_status: "failed",
            ref: null,
            sha256: null,
            persisted: false,
            prelude: null,
            error: error instanceof Error ? error.message : String(error),
          }));
      }
      return reflectionPromise;
    };
  let upstream;
  try {
    vNextPreflightSnapshot = internal?.preflightSnapshot ?? ctx.kernel.currentVNextSnapshot();
    vNextPreflightMaterials = internal?.preflightMaterials ?? currentMaterialBinding(ctx);
    upstream = upstreamForStage(ctx, stage);
  } catch (error) {
    if (scheduleReflection !== null) {
      await scheduleReflection({
        stageStatus: "failed",
        availabilityState: "not_scheduled",
        reasonCode: "preflight_failed",
        stageOutcomeDiagnostic: stageFailureDiagnostic(error, "stage_preflight_failed"),
        observation: `stage ${stage} was not scheduled after preflight failure: ${error.message}`,
      });
    }
    throw error;
  }
  let result;
  try {
    result = plainResult(await handler(workerContext(ctx, publication, scheduleReflection), upstream, {
      snapshot: vNextPreflightSnapshot,
      materials: vNextPreflightMaterials,
    }));
  } catch (error) {
    if (scheduleReflection !== null) {
      const diagnostic = stageFailureDiagnostic(error, "stage_handler_failed");
      const availabilityReason = stageReflectionAvailabilityReason(error);
      const reflection = await scheduleReflection({
        stageStatus: "failed",
        ...(availabilityReason === null ? {} : {
          availabilityState: "not_scheduled",
          reasonCode: availabilityReason,
        }),
        stageOutcomeDiagnostic: diagnostic,
        observation: `stage ${stage} ended with handler failure: ${diagnostic.error_summary}`,
      });
      if (reflection.status === "failed" && error && typeof error === "object") {
        error.reflection_error = reflection.error ?? "stage reflection failed";
      }
    }
    throw error;
  }

  let published;
  try {
    published = publishVNextStage(ctx, result, vNextPreflightSnapshot, vNextPreflightMaterials);
  } catch (error) {
    if (scheduleReflection !== null) {
      const diagnostic = stageFailureDiagnostic(error, "stage_publication_failed");
      const reflection = await scheduleReflection({
        stageStatus: "failed",
        stageOutcomeDiagnostic: diagnostic,
        observation: `stage ${stage} ended with publication failure: ${diagnostic.error_summary}`,
      });
      if (reflection.status === "failed" && error && typeof error === "object") {
        error.reflection_error = reflection.error ?? "stage reflection failed";
      }
    }
    throw error;
  }
  if (scheduleReflection === null) return published;
  const stageReflection = await scheduleReflection({
    stageStatus: reflectionInput?.stageStatus ?? reflectionOptions.stageStatus ?? "completed",
  });
  return Object.freeze({ ...published, stage_reflection: stageReflection });
}

function officialWorkerContext(ctx, publication = {}, invocation = {}, authenticatedRequirementContext = null, authenticatedStageOutcome = null, reflectionScheduler = null) {
  const artifactDir = ctx.artifacts
    ?? ((ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot)
      ? ArtifactDir.open(ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace.worktreeRoot, ctx.task)
      : null);
  const consumerInvocations = new Set();
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    currentMaterialRevision: ctx.kernel.currentVNextMaterialRevision(),
    recordConsumerInvocation: (target) => {
      if (typeof target === "string" && target.trim() !== "") consumerInvocations.add(target);
    },
    hasConsumerInvocation: (target) => consumerInvocations.has(target),
    ...(typeof reflectionScheduler === "function" ? { runStageEndReflection: reflectionScheduler } : {}),
    ...(typeof invocation.attempt_id === "string" && invocation.attempt_id.trim() ? { currentAttemptId: invocation.attempt_id } : {}),
    ...(authenticatedRequirementContext ? {
      authenticatedRequirementContext: Object.freeze({
        originalRequirement: authenticatedRequirementContext.originalRequirement,
        requirementMessages: Object.freeze(authenticatedRequirementContext.requirementMessages
          .map((message) => Object.freeze({ ...message }))),
        requirementCoverageOutputs: Object.freeze(authenticatedRequirementContext.requirementCoverageOutputs
          .map((output) => Object.freeze({
            ...output,
            decision_ids: Object.freeze([...(output.decision_ids ?? [])]),
            requirement_ids: Object.freeze([...(output.requirement_ids ?? [])]),
          }))),
      }),
    } : {}),
    manifest: ctx.manifest,
    accepted: Object.freeze({ readInput: (slot) => ctx.kernel.readInput(slot) }),
    readReceipt: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
    },
    readOptionalReceipt: (ref) => {
      try {
        const raw = ctx.task.readRecord(ref);
        return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    readEvidence: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ bytes: raw, sha256: createHash("sha256").update(raw).digest("hex") });
    },
    // Skill proof is private, authenticated input to the current official
    // handler. It is not a new receipt, public command, or state projection.
    ...(authenticatedStageOutcome?.value?.skill_outcomes ? {
      readSkillEvidence: (skillId) => {
        const outcome = authenticatedStageOutcome.value.skill_outcomes.find((entry) => entry.skill_id === skillId);
        if (!outcome) throw new Error(`authenticated stage outcome has no ${skillId} skill outcome`);
        return Object.freeze((outcome.evidence_refs ?? []).map(({ ref, sha256 }) => {
          const raw = ctx.task.readRecord(ref);
          if (createHash("sha256").update(raw).digest("hex") !== sha256) {
            throw new Error(`authenticated ${skillId} skill evidence hash mismatch`);
          }
          return Object.freeze({ ref, sha256, bytes: raw });
        }));
      },
    } : {}),
    readBrowserQaEvidence: (ref) => {
      if (typeof ref !== "string" || !/^quality\/evidence\/browser-qa\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(ref)) {
        throw new Error("controlled QA evidence ref is outside the browser-qa namespace");
      }
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ bytes: raw, sha256: createHash("sha256").update(raw).digest("hex") });
    },
    // External audit records are visible only for human-boundary notices.
    // They are deliberately not receipts, facts, evidence refs, or gates.
    ...(ctx.stage === "build-code" && ctx.workspace ? {
      inspectIntegrationReviewSubject: () => ({
        formal_record_status: {
          status: "unavailable",
          reason: "phase review history is retired; current quality facts remain authoritative",
        },
      }),
    } : {}),
    ...(ctx.workspace ? { workspace: Object.freeze({ worktreeRoot: ctx.workspace.worktreeRoot, baselineCommit: ctx.workspace.baselineCommit }) } : {}),
    ...(ctx.workspace ? { snapshotWorkspace: () => captureWorkspaceSnapshot(ctx.workspace, ctx.identity.taskId) } : {}),
    // Renderer inputs are task-owned source bytes. Keep this filesystem access
    // private to the authenticated handler rather than exposing a new runtime
    // input or public read API.
    ...(ctx.workspace ? { readWorkspaceSource: (sourcePath) => {
      if (typeof sourcePath !== "string" || sourcePath.trim() === "" || isAbsolute(sourcePath)) {
        throw new Error("workspace source path must be a non-empty relative path");
      }
      const root = realpathSync(ctx.workspace.worktreeRoot);
      const candidate = realpathSync(join(root, sourcePath));
      if (!candidate.startsWith(`${root}${sep}`)) throw new Error("workspace source path escapes the current worktree");
      const bytes = readFileSync(candidate);
      return Object.freeze({ sha256: createHash("sha256").update(bytes).digest("hex") });
    } } : {}),
    ...(ctx.candidateWorkspace ? { candidateWorkspace: Object.freeze({
      worktreeRoot: ctx.candidateWorkspace.worktreeRoot,
      baselineCommit: ctx.candidateWorkspace.baselineCommit,
      captureSnapshot: () => ctx.candidateWorkspace.captureSnapshot(),
    }) } : {}),
    // The real UI QA executor is an invocation-scoped host capability. It is
    // intentionally exposed only to the official build-code handler and is
    // never a public Runner, command, or persisted state object.
    ...(ctx.stage === "build-code" && typeof publication?.runControlledUiQa === "function"
      ? { runControlledUiQa: publication.runControlledUiQa }
      : {}),
    ...(ctx.stage === "build-code" ? {
      runAcceptanceScenario: (scenario) => privateAcceptanceScenario(ctx, publication, scenario, invocation.attempt_id),
    } : {}),
    ...(ctx.stage === "verify-code" ? {
      readE2eAcceptanceEvidence: () => readCurrentE2eAcceptanceEvidence(ctx),
    } : {}),
    ...(artifactDir ? {
      readArtifact: (name) => artifactDir.read(name),
      writeArtifact: (name, value) => artifactDir.writeAtomic(name, value),
      artifactRef: (name) => artifactDir.reference(name),
    } : {}),
  });
}

function verifyEvidenceReference(ctx, entry, label = "evidence") {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`${label} must be an authenticated reference`);
  const currentOnly = ctx.manifest?.record_model === "vnext-single-write";
  if (typeof entry.ref !== "string" || (currentOnly ? !entry.ref.startsWith("quality/") : !entry.ref.startsWith("evidence/") && !entry.ref.startsWith("quality/"))) {
    throw new Error(`${label} is outside a canonical namespace`);
  }
  if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new TypeError(`${label} sha256 is required`);
  const raw = ctx.task.readRecord(entry.ref);
  const actual = createHash("sha256").update(raw).digest("hex");
  if (actual !== entry.sha256) throw new Error(`${label} hash mismatch: ${entry.ref}`);
  return entry;
}

export function verifyOfficialEvidence(ctx, result) {
  for (const [index, entry] of (result.evidence_refs ?? []).entries()) verifyEvidenceReference(ctx, entry, `evidence_refs[${index}]`);
  const tests = result.facts?.tests;
  const hasReceiptRef = tests && Object.prototype.hasOwnProperty.call(tests, "receipt_ref");
  const hasReceiptHash = tests && Object.prototype.hasOwnProperty.call(tests, "receipt_hash");
  const hasOutputRef = tests && Object.prototype.hasOwnProperty.call(tests, "output_ref");
  const hasOutputHash = tests && Object.prototype.hasOwnProperty.call(tests, "output_hash");
  if (hasReceiptRef !== hasReceiptHash || hasOutputRef !== hasOutputHash) {
    throw new Error("test receipt and output bindings must be provided in pairs");
  }
  const hasAnyTestBinding = hasReceiptRef || hasOutputRef;
  if (tests?.status === "passed" && !hasAnyTestBinding) {
    throw new Error("passed tests fact requires a canonical test receipt and output binding");
  }
  if (hasAnyTestBinding && !(hasReceiptRef && hasOutputRef)) {
    throw new Error("test receipt and output bindings are incomplete");
  }
  if (hasAnyTestBinding) {
    if (typeof tests.receipt_ref !== "string"
        || !/^quality\/tests\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(tests.receipt_ref)
        || !/^[a-f0-9]{64}$/.test(tests.receipt_hash ?? "")) {
      throw new Error("test receipt_ref/receipt_hash binding is invalid");
    }
    if (typeof tests.output_ref !== "string"
        || !/^[a-f0-9]{64}$/.test(tests.output_hash ?? "")) {
      throw new Error("test output_ref/output_hash binding is invalid");
    }
    const receiptRaw = ctx.task.readRecord(tests.receipt_ref);
    if (createHash("sha256").update(receiptRaw).digest("hex") !== tests.receipt_hash) throw new Error(`test receipt hash mismatch: ${tests.receipt_ref}`);
    let receiptValue;
    try { receiptValue = JSON.parse(receiptRaw); } catch { throw new Error(`test receipt is not valid JSON: ${tests.receipt_ref}`); }
    validateCanonicalTestReceipt(receiptValue, {
      taskId: ctx.identity.taskId,
      stage: ctx.stage,
      snapshotTree: tests.snapshot_tree,
    });
    for (const key of ["command", "command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "output_ref", "output_hash"]) {
      if (receiptValue[key] !== tests[key]) throw new Error(`test receipt and facts.${key} are not bound`);
    }
    if ((tests.status === "passed" && receiptValue.exit_code !== 0)
        || (tests.status === "failed" && receiptValue.exit_code === 0)) {
      throw new Error("test fact status is not bound to the canonical receipt exit_code");
    }
    const outputRaw = ctx.task.readRecord(receiptValue.output_ref);
    if (createHash("sha256").update(outputRaw).digest("hex") !== receiptValue.output_hash) throw new Error(`test output hash mismatch: ${receiptValue.output_ref}`);
  }
  return result;
}

/**
 * Consume the narrow result returned by broker-backed wh-review.  The review
 * CLI only creates this intent; this authenticated stage-runtime boundary is
 * the only place that may turn it into a current quality fact.
 */
function validateReviewFactIntent({ context, intent, receiptRef = null } = {}) {
  const ctx = assertContext(context, "verify-code");
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) throw new TypeError("review fact intent is required");
  const allowed = new Set(["schema_version", "stage", "kind", "status", "subject", "material_id", "material_revision", "evidence"]);
  const unknown = Object.keys(intent).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`review fact intent contains unsupported fields: ${unknown.join(", ")}`);
  if (intent.schema_version !== "workflowhub-quality-fact-intent.v1"
      || intent.stage !== "verify-code"
      || intent.kind !== "review"
      || !["recorded", "unavailable"].includes(intent.status)
      || !["code_review", "independent_review"].includes(intent.subject)
      || !/^[a-f0-9]{64}$/.test(intent.material_id ?? "")
      || !/^revision-[a-f0-9]{64}$/.test(intent.material_revision ?? "")
      || !Array.isArray(intent.evidence)
      || intent.evidence.length !== 1) {
    throw new Error("review fact intent is not a verify-code review intent");
  }
  const evidence = intent.evidence[0];
  if (!evidence || typeof evidence.ref !== "string" || !/^quality\/reviews\/(?:results\/[^/]+\.json|attempts\/[^/]+\/attempt\.json)$/.test(evidence.ref)
      || !/^[a-f0-9]{64}$/.test(evidence.sha256 ?? "")
      || evidence.evidence_type !== "review_result") {
    throw new Error("review fact intent evidence is invalid");
  }
  if (receiptRef !== null && receiptRef !== evidence.ref) throw new Error("review fact intent does not match its review receipt");
  const raw = ctx.task.readRecord(evidence.ref);
  if (createHash("sha256").update(raw).digest("hex") !== evidence.sha256) throw new Error("review fact intent evidence hash mismatch");
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("review fact intent evidence must be valid JSON"); }
  const snapshot = ctx.kernel.currentVNextSnapshot();
  if (value?.task_id !== ctx.identity.taskId || value.stage !== "verify-code" || value.subject_kind !== "worktree"
      || value.phase_id !== null || value.review_scope !== null || value.snapshot_tree !== snapshot.tree) {
    throw new Error("review fact intent evidence is not bound to the current verify-code snapshot");
  }
  if (value.material_id !== intent.material_id
      || value.material_revision !== intent.material_revision
      || intent.material_revision !== ctx.kernel.currentVNextMaterialRevision()) {
    throw new Error("review fact intent evidence is not bound to the current review materials");
  }
  const observed = reviewEvidenceStatus(ctx.task, evidence, {
    stage: "verify-code",
    subject: intent.subject === "code_review" ? "independent_review" : intent.subject,
  });
  const validRecorded = observed.status === "recorded";
  if (intent.status === "recorded" && !validRecorded) throw new Error("review fact intent recorded status is not authenticated");
  if (intent.status === "unavailable" && observed.status !== "unavailable") throw new Error("review fact intent unavailable status is not authenticated");
  return Object.freeze({
    status: intent.status,
    // `code_review` remains accepted at this transport boundary for old
    // callers, but it is deliberately downgraded to the existing advisory
    // subject so it cannot recreate the canonical completion fact.
    subject: "independent_review",
    evidence: Object.freeze({ ref: evidence.ref, sha256: evidence.sha256 }),
  });
}

/** Publish an already authenticated broker intent through the official writer. */
export function publishReviewFactIntent({ context, intent, receiptRef = null } = {}) {
  const ctx = assertContext(context, "verify-code");
  const validated = validateReviewFactIntent({ context: ctx, intent, receiptRef });
  return ctx.kernel.publishVNextQualityFact("verify-code", {
    kind: "review",
    status: validated.status,
    subject: validated.subject,
    evidence: [{ ref: validated.evidence.ref, sha256: validated.evidence.sha256, evidence_type: "review_result" }],
  });
}

/** Official stage-runtime handoff for a previously recorded stage outcome. */
export async function publishOfficialStageOutcome({ context, outcome, stage, attemptId, receipts = {} } = {}) {
  if (!context || typeof context !== "object") throw new TypeError("WorkflowHub session context is required");
  if (!outcome || typeof outcome.ref !== "string") throw new TypeError("stage outcome is required");
  if (!receipts || typeof receipts !== "object" || Array.isArray(receipts)) throw new TypeError("host quality receipts must be an object");
  if (Object.hasOwn(receipts, "stage_outcomes")) throw new Error("host quality receipts cannot override the bridge stage outcome");
  const quality = await runOfficialStage(stage, context, {
    attempt_id: attemptId,
    receipts: { ...receipts, stage_outcomes: outcome.ref },
  });
  return Object.freeze({ outcome, quality });
}

/** Fixed repository-owned handler path; callers provide receipt references, never facts or code. */
export function runOfficialStage(stage, context, invocation, publication) {
  const ctx = assertContext(context, stage);
  const handler = officialStageHandler(stage);
  const input = Object.freeze(structuredClone(invocation));
  const handlerInput = structuredClone(input);
  const stageReflectionInput = {};
  // attempt_id is a runtime binding claim, not a stage-handler input. Keep it
  // visible to outcome authentication while keeping the handler contract
  // limited to receipts and quality disclosures.
  delete handlerInput.attempt_id;
  return runStage(
    stage,
    ctx,
    async (worker, _upstream, preflight) => {
      const stageOutcome = readOptionalStageOutcome(ctx, stage, input, preflight);
      const stageOutcomeStatus = stageOutcome.value?.value?.status ?? stageOutcome.diagnostic?.status ?? "unavailable";
      Object.assign(stageReflectionInput, {
        stageStatus: stageOutcomeStatus === "completed" ? "completed" : "failed",
        stageOutcome: stageOutcome.value,
        stageOutcomeDiagnostic: stageOutcome.diagnostic,
        observation: `official ${stage} stage ended; stage outcome status ${stageOutcomeStatus}`,
      });
      // A missing/invalid host outcome is a quality fact, not a work permit.
      // Keep its diagnostic on the returned result and let the current stage
      // continue with its own authenticated receipts.
      if (stage === "build-code"
          && handlerInput.acceptance_coverage === undefined
          && Array.isArray(stageOutcome.value?.spec_analyze?.packet?.acceptance_coverage)
          && stageOutcome.value.spec_analyze.packet.acceptance_coverage.length > 0) {
        const rows = stageOutcome.value.spec_analyze.packet.acceptance_coverage;
        handlerInput.acceptance_coverage = {
          snapshot_tree: preflight.snapshot.tree,
          accepted_criterion_ids: rows.map((row) => row.acceptance_criterion_id).filter((id) => typeof id === "string"),
          items: rows.map((row) => ({
            ...row,
            evidence_refs: Array.isArray(row.evidence_refs)
              ? row.evidence_refs.map((entry) => ({ ref: entry.canonical_ref ?? entry.ref, sha256: entry.hash ?? entry.sha256 }))
              : [],
          })),
        };
      }
      if (stage === "verify-code") {
        const receipts = handlerInput.receipts && typeof handlerInput.receipts === "object" && !Array.isArray(handlerInput.receipts)
          ? handlerInput.receipts
          : (handlerInput.receipts = {});
        const stageReview = stageOutcome.value?.code_review ?? null;
        const boundReviewRef = stageReview?.quality_review_ref;
        const suppliedReviewRef = receipts.quality_review;
        if (!stageOutcome.value && suppliedReviewRef !== undefined) {
          throw new Error("verify-code quality_review requires a bound dsh-code-review stage outcome");
        }
        if (stageOutcome.value && boundReviewRef === undefined && suppliedReviewRef !== undefined) {
          throw new Error("verify-code quality_review is not bound to the dsh-code-review stage outcome");
        }
        if (boundReviewRef !== undefined) {
          if (suppliedReviewRef !== undefined && suppliedReviewRef !== boundReviewRef) {
            throw new Error("verify-code quality_review does not match the dsh-code-review stage outcome");
          }
          receipts.quality_review = boundReviewRef;
        }
      }
      if (handlerInput.receipts && typeof handlerInput.receipts === "object" && !Array.isArray(handlerInput.receipts)) {
        delete handlerInput.receipts.stage_outcomes;
      }
      const reviewFactIntent = handlerInput.review_fact_intent;
      delete handlerInput.review_fact_intent;
      // Authenticate the broker intent before invoking the stage handler. The
      // handler is allowed to publish other current facts through the later
      // stage transaction, so a malformed or cross-bound review intent must
      // fail before any handler work can begin.
      let validatedReviewFactIntent = null;
      if (reviewFactIntent !== undefined) {
        if (stage !== "verify-code") throw new Error("review fact intent is only valid for verify-code");
        if (typeof handlerInput.receipts?.review !== "string") {
          throw new Error("verify-code advisory review intent requires receipts.review");
        }
        validatedReviewFactIntent = validateReviewFactIntent({
          context: ctx,
          intent: reviewFactIntent,
          receiptRef: handlerInput.receipts.review,
        });
      }
      const authenticatedRequirementContext = stage === "make-decision" && stageOutcome.value?.spec_analyze?.packet
        ? {
          originalRequirement: stageOutcome.value.spec_analyze.packet.materials?.original_requirement ?? "",
          requirementMessages: (stageOutcome.value.spec_analyze.packet.authenticated_requirement_messages ?? [])
            .filter((message) => message && typeof message === "object" && !Array.isArray(message))
            .map((message) => ({
              id: message.id,
              order: message.order,
              message_class: message.message_class,
              content_hash: message.content_hash,
              source_id: message.source_id,
              source_ref: message.source_ref,
              source_version: message.source_version,
              task_id: message.task_id,
              session_id: message.session_id,
              stage: message.stage,
            })),
          requirementCoverageOutputs: (stageOutcome.value.spec_analyze.packet.requirement_coverage_outputs ?? [])
            .filter((output) => output && typeof output === "object" && !Array.isArray(output))
            .map((output) => ({
              message_id: output.message_id,
              message_hash: output.message_hash,
              message_class: output.message_class,
              decision_ids: [...(output.decision_ids ?? [])],
              requirement_ids: [...(output.requirement_ids ?? [])],
              disposition: output.disposition,
            })),
        }
        : null;
      const officialWorker = officialWorkerContext(ctx, publication, input, authenticatedRequirementContext, stageOutcome, worker.runStageEndReflection);
      officialWorker.recordConsumerInvocation("stage-runner#runStageEndReflection");
      const verifiedHandlerResult = verifyOfficialEvidence(ctx, await handler(officialWorker, handlerInput));
      // The concrete reflection is published only after the stage result has
      // crossed the single write boundary. Keep an internal result marker so
      // the authenticated stage-outcome consumer binding can observe that the
      // declared reflection result is scheduled before final publication.
      let handlerResult = typeof officialWorker.runStageEndReflection === "function"
        ? { ...verifiedHandlerResult, stage_reflection: { status: "scheduled" } }
        : verifiedHandlerResult;
      const skillConsumerBindings = consumeSkillOutcomeBindings(officialWorker, handlerInput, stageOutcome, handlerResult);
      if (stage === "verify-code" && stageOutcome.value?.code_review?.quality_review_ref) {
        const reviewFacts = handlerResult.facts?.code_review ?? {};
        const actualReviewRef = reviewFacts.result_ref ?? reviewFacts.attempt_ref;
        const actualReviewHash = reviewFacts.result_hash ?? reviewFacts.attempt_hash;
        if (actualReviewRef !== stageOutcome.value.code_review.quality_review_ref
            || actualReviewHash !== stageOutcome.value.code_review.quality_review_hash) {
          throw new Error("verify-code canonical code_review is not bound to the dsh-code-review stage outcome");
        }
      }
      let result = handlerResult;
      if (validatedReviewFactIntent !== null) {
        // Keep the intent in memory until the official stage publication has
        // passed handler/evidence validation. publishVNextStage then becomes
        // the single writer and can publish the review fact with the rest of
        // the current stage facts; a failed handler leaves no review fact.
        result = {
          ...handlerResult,
          facts: {
            ...(handlerResult.facts ?? {}),
            review: {
              status: validatedReviewFactIntent.status,
              result_ref: validatedReviewFactIntent.evidence.ref,
              result_hash: validatedReviewFactIntent.evidence.sha256,
            },
          },
        };
      }
      return {
        ...result,
        ...(skillConsumerBindings ? { skill_consumer_bindings: skillConsumerBindings } : {}),
        ...(stageOutcome.value ? {
          stage_outcome_ref: stageOutcome.value.ref,
          stage_outcome_hash: stageOutcome.value.sha256,
          stage_outcome_status: stageOutcome.value.value.status,
          step_outcomes: stageOutcome.value.step_outcomes,
          skill_outcomes: stageOutcome.value.skill_outcomes,
          spec_analyze: specAnalyzeDisclosure(stageOutcome.value.spec_analyze),
          code_review: stageOutcome.value.code_review ?? null,
          code_review_resolution: stageOutcome.value.code_review_resolution ?? null,
        } : {}),
        ...(stageOutcome.diagnostic ? { stage_outcome_diagnostic: stageOutcome.diagnostic } : {}),
      };
    },
    publication,
    {
      stageReflectionInput,
      stageReflection: {
        ...(typeof publication?.runStageReflection === "function" ? { execute: publication.runStageReflection } : {}),
      },
    },
  );
}
