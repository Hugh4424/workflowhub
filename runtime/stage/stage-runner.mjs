import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import yaml from "js-yaml";
import { captureWorkspaceSnapshot } from "../evidence/canonical-receipt-writer.mjs";
import { deriveStageCompletion, deriveStageProgress, STAGE_ADVISORY_PREDICATES, STAGE_PREDICATES } from "../stage/completion-predicates.mjs";
import { summarizeStageOutcome } from "../evidence/stage-completion-facts.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { CURRENT_MATERIAL_FILES } from "../task/material-workspace.mjs";
import { materialRevisionFromValues } from "../task/git-worktree-snapshot.mjs";
import { loadStageManifest } from "./step-manifest.mjs";
import { STAGE_SPEC_ANALYZE_PROFILES, validateStageSpecAnalyzeProfile } from "./stage-content-contracts.mjs";
import { validateCanonicalFullTestReceipt } from "../evidence/canonical-evidence-validators.mjs";
import { validateSchema } from "../review/schema-validator.mjs";
import { authenticateCanonicalReviewResult } from "../review/canonical-review-result.mjs";
import { parseReviewerOutput } from "../review/review-output.mjs";
import { canonicalReviewFindings, isActionableSeriousFinding } from "../review/stage-review-disposition.mjs";

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
const OUTCOME_STATUSES = new Set(["completed", "skipped", "not_applicable", "incomplete", "unavailable"]);
const STAGE_OUTCOME_STATUSES = new Set(["completed", "skipped", "incomplete", "unavailable", "failed"]);
const SHA256 = /^[a-f0-9]{64}$/;

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
  if (!OUTCOME_STATUSES.has(value.status)) throw outcomeError(`skill_outcomes[${index}].status is invalid`);
  if (typeof value.trigger !== "boolean" || typeof value.executed !== "boolean") {
    throw outcomeError(`skill_outcomes[${index}] requires boolean trigger and executed`);
  }
  if (value.status === "not_applicable" && (value.trigger !== false || value.executed !== false)) {
    throw outcomeError(`skill_outcomes[${index}] not_applicable requires trigger=false and executed=false`);
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
  return { ...value, evidence_refs: evidence };
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

function validateCodeReviewOutcome(record, stage, snapshot, materialRevision, manifest, skillManifest) {
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
  const actionableFindings = canonicalReviewFindings(result).filter(isActionableSeriousFinding);
  if (record.status === "completed" && (result.status === "unavailable" || actionableFindings.length > 0)) {
    throw outcomeError("completed verify-code stage requires a code review with no actionable serious findings");
  }
  if (record.status === "completed" && (skillOutcome.status !== "completed" || stepOutcome.status !== "completed")) {
    throw outcomeError("completed verify-code stage must complete the code-review skill and closure step");
  }
  return Object.freeze({ review });
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
  const skillManifest = yaml.load(skillsRaw);
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
    ? validateCodeReviewOutcome(record, stage, snapshot, materials.revision, manifest, skillManifest)
    : validateStageSpecAnalyzeOutcome(ctx, record, stage, snapshot, materials.revision, materials, manifest, skillManifest);
  return Object.freeze({
    ref,
    sha256: actualHash,
    // Reuse the authenticated entry snapshot for the immediately following
    // official stage run.  The publication path still captures a fresh
    // snapshot at the end, so external material changes remain detectable.
    snapshot,
    value: Object.freeze({ ...record, step_outcomes: stepOutcomes, skill_outcomes: skillOutcomes, ...(stage === "verify-code" ? { code_review: stageReview.review } : { spec_analyze: stageReview.analyzer }) }),
    step_outcomes: stepOutcomes,
    skill_outcomes: skillOutcomes,
    ...(stage === "verify-code" ? { code_review: stageReview.review } : { spec_analyze: stageReview.analyzer }),
  });
}

/**
 * An external Stage Agent outcome is diagnostic execution evidence, not a
 * permission to run the current WorkflowHub handler. Missing, unreadable, or
 * invalid external evidence stays visible as unavailable; the handler still
 * runs and its own material/quality/publication errors remain fail-loud.
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

function workerContext(ctx, publication = {}) {
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    manifest: ctx.manifest,
    deriveStageWorkflowRunId: (stage) => ctx.kernel.deriveStageWorkflowRunId(stage),
    ...(ctx.candidateWorkspace ? { candidateWorkspace: ctx.candidateWorkspace } : {}),
    ...(ctx.workspace ? { workspace: ctx.workspace } : {}),
    ...(ctx.artifacts ? { artifacts: ctx.artifacts } : {}),
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

function publishVNextEvidence(ctx, ref, raw) {
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
      if (stage === "verify-code" && subject === "code_review") {
        try {
          // An empty findings array is only meaningful after the immutable
          // attempt, terminal provider members, provider outputs, and
          // aggregation have all been authenticated. Do not let a copied or
          // partially failed result satisfy the final code-review predicate.
          authenticateStageReviewResult(task, record);
          return canonicalReviewFindings(record).some(isActionableSeriousFinding)
            ? { status: "missing", review_status: "findings" }
            : { status: "recorded", review_status: "clean" };
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
    if (record?.schema_version !== "human-confirmation.v2" || !new Set(["accepted", "rejected"]).has(record.decision)) return { status: "unavailable" };
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
    const review = kind === "review" ? reviewEvidenceStatus(ctx.task, candidate, { stage: ctx.stage, subject }) : null;
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
    const fact = kind === "acceptance_criterion"
      ? acceptanceFact.fact
      : ctx.kernel.publishVNextQualityFact(ctx.stage, {
        kind,
        status: qualityFactStatus,
        subject,
        evidence: factEvidence.map(({ ref, sha256 }) => ({ ref, sha256, evidence_type: evidenceType })),
      });
    qualityFactRefs.push(fact.ref);
    if (!gating) qualityAdvisoryFactRefs.push(fact.ref);
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

  const upstream = upstreamForStage(ctx, stage);
  const vNextPreflightSnapshot = internal?.preflightSnapshot ?? ctx.kernel.currentVNextSnapshot();
  const vNextPreflightMaterials = internal?.preflightMaterials ?? currentMaterialBinding(ctx);
  const result = plainResult(await handler(workerContext(ctx, publication), upstream, {
    snapshot: vNextPreflightSnapshot,
    materials: vNextPreflightMaterials,
  }));

  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");
  return publishVNextStage(ctx, result, vNextPreflightSnapshot, vNextPreflightMaterials);
}

function officialWorkerContext(ctx, publication = {}) {
  const artifactDir = ctx.artifacts
    ?? ((ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot)
      ? ArtifactDir.open(ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace.worktreeRoot, ctx.task)
      : null);
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
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
    ...(ctx.candidateWorkspace ? { candidateWorkspace: Object.freeze({
      worktreeRoot: ctx.candidateWorkspace.worktreeRoot,
      baselineCommit: ctx.candidateWorkspace.baselineCommit,
      captureSnapshot: () => ctx.candidateWorkspace.captureSnapshot(),
    }) } : {}),
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

function verifyOfficialEvidence(ctx, result) {
  for (const [index, entry] of (result.evidence_refs ?? []).entries()) verifyEvidenceReference(ctx, entry, `evidence_refs[${index}]`);
  const tests = result.facts?.tests;
  if (tests && typeof tests.output_ref === "string" && typeof tests.output_hash === "string") {
    // output_ref is independently re-read; a valid receipt cannot vouch for a
    // missing or subsequently replaced command output.
    const output_ref = tests.output_ref;
    const raw = ctx.task.readRecord(output_ref);
    if (createHash("sha256").update(raw).digest("hex") !== tests.output_hash) throw new Error(`test output_ref hash mismatch: ${output_ref}`);
  }
  return result;
}

/** Fixed repository-owned handler path; callers provide receipt references, never facts or code. */
export function runOfficialStage(stage, context, invocation, publication) {
  const ctx = assertContext(context, stage);
  const handler = officialStageHandler(stage);
  const input = Object.freeze(structuredClone(invocation));
  const handlerInput = structuredClone(input);
  // attempt_id is a runtime binding claim, not a stage-handler input. Keep it
  // visible to outcome authentication while keeping the handler contract
  // limited to receipts and quality disclosures.
  delete handlerInput.attempt_id;
  return runStage(
    stage,
    ctx,
    async (_worker, _upstream, preflight) => {
      const stageOutcome = readOptionalStageOutcome(ctx, stage, input, preflight);
      if (handlerInput.receipts && typeof handlerInput.receipts === "object" && !Array.isArray(handlerInput.receipts)) {
        delete handlerInput.receipts.stage_outcomes;
      }
      const result = verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx, publication), handlerInput));
      return {
        ...result,
        ...(stageOutcome.value ? {
          stage_outcome_ref: stageOutcome.value.ref,
          stage_outcome_hash: stageOutcome.value.sha256,
          stage_outcome_status: stageOutcome.value.value.status,
          step_outcomes: stageOutcome.value.step_outcomes,
          skill_outcomes: stageOutcome.value.skill_outcomes,
          spec_analyze: specAnalyzeDisclosure(stageOutcome.value.spec_analyze),
          code_review: stageOutcome.value.code_review ?? null,
        } : {}),
        ...(stageOutcome.diagnostic ? { stage_outcome_diagnostic: stageOutcome.diagnostic } : {}),
      };
    },
    publication,
  );
}
