import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import yaml from "js-yaml";
import { captureWorkspaceSnapshot } from "../evidence/canonical-receipt-writer.mjs";
import { deriveStageCompletion, deriveStageProgress, STAGE_PREDICATES } from "../stage/completion-predicates.mjs";
import { summarizeStageOutcome } from "../evidence/stage-completion-facts.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { CURRENT_MATERIAL_FILES } from "../task/material-workspace.mjs";
import { loadStageManifest } from "./step-manifest.mjs";
import { STAGE_SPEC_ANALYZE_PROFILES, validateStageSpecAnalyzeProfile } from "./stage-content-contracts.mjs";

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
const OUTCOME_STATUSES = new Set(["completed", "skipped", "incomplete", "unavailable"]);
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
  if (!["recorded", "unavailable"].includes(status)) throw outcomeError(`${label}.status must be recorded or unavailable`);
  if (status === "recorded" && (cost.duration_ms === null || cost.tokens === null)) {
    throw outcomeError(`${label} recorded cost must include duration_ms and tokens`);
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
      throw outcomeError(`cannot read current material ${file}: ${error.message}`);
    }
  });
  const revision = `revision-${createHash("sha256").update(JSON.stringify(values)).digest("hex")}`;
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

  const analysis = validateStageSpecAnalyzeProfile({ stage, packet: analyzer.packet });
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

function authenticateStageOutcome(ctx, stage, input) {
  const ref = input?.receipts?.stage_outcomes;
  if (typeof ref !== "string") throw outcomeError(`${stage} official run requires receipts.stage_outcomes from the Stage Agent`);
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
  outcomeText(record.attempt_id, "stage outcome attempt_id");
  if (!STAGE_OUTCOME_STATUSES.has(record.status)) throw outcomeError("stage outcome status is invalid");
  const snapshot = ctx.kernel.currentVNextSnapshot();
  if (record.snapshot_tree !== snapshot.tree) throw outcomeError("stage outcome snapshot_tree is stale");
  const materials = currentMaterialBinding(ctx);
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
  const specAnalyze = validateStageSpecAnalyzeOutcome(ctx, record, stage, snapshot, materials.revision, materials, manifest, skillManifest);
  return Object.freeze({
    ref,
    sha256: actualHash,
    value: Object.freeze({ ...record, step_outcomes: stepOutcomes, skill_outcomes: skillOutcomes, spec_analyze: specAnalyze.analyzer }),
    step_outcomes: stepOutcomes,
    skill_outcomes: skillOutcomes,
    spec_analyze: specAnalyze.analyzer,
  });
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
    ? stage === "verify-code" && subject === "independent_review"
      ? facts.quality_note
      : subject === "same_build_integration_review"
        ? facts.review
        : subject === "direction_review"
          ? facts.reviews?.direction
          : subject === "detail_review"
            ? facts.reviews?.detail
            : facts.review
    : facts[subject]
      ?? (kind === "test" ? facts.tests : null)
      ?? (kind === "confirmation" ? facts.human_confirmation : null);
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

function reviewEvidenceStatus(task, candidate) {
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
      return { status: "recorded" };
    }
    return { status: "missing" };
  }
  if (/^quality\/reviews\/attempts\//.test(candidate.ref) && record?.terminal_status === "unavailable") {
    return { status: "unavailable" };
  }
  return { status: "missing" };
}

function testEvidenceStatus(task, candidate) {
  if (!candidate) return { status: "missing" };
  let raw;
  try {
    raw = task.readRecord(candidate.ref);
    if (candidate.sha256 && createHash("sha256").update(raw).digest("hex") !== candidate.sha256) {
      return { status: "unavailable" };
    }
    const record = JSON.parse(raw);
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

function publishVNextStage(ctx, result, preflightSnapshot) {
  // Quality facts and canonical records are content-addressed and written
  // atomically by the TaskKernel. A stage-level publication lock would be a
  // second coordination control plane, not a source-of-truth requirement.
  const snapshot = assertVNextSourceStable(ctx, preflightSnapshot);
  const qualityFactRefs = [];
  let allPassed = true;
  const qualityWarnings = [];
  const analyzerResult = result.spec_analyze?.result;
  // Semantic findings are quality facts. They are deliberately not an
  // execution/progression gate: the same stage can publish the finding so
  // the Stage Agent repairs it in place instead of silently handing it down.
  if (analyzerResult?.status && analyzerResult.status !== "consistent") {
    allPassed = false;
    qualityWarnings.push(`stage-end-spec-analyze:${analyzerResult.status}`);
  }
  for (const [subject, kind] of Object.entries(STAGE_PREDICATES[ctx.stage])) {
      const candidate = evidenceCandidate(result, kind, subject, ctx.stage)
      ?? (kind === "confirmation" ? currentConfirmationCandidate(ctx, snapshot.tree) : null);
    const acceptanceSubject = kind === "acceptance_criterion"
      ? subject === "finding_dispositions"
        ? (() => {
          const dispositions = result.facts?.finding_dispositions;
          const items = Array.isArray(dispositions?.items) ? dispositions.items : [];
          const complete = dispositions?.status === "not_applicable"
            || (dispositions?.status === "recorded" && items.every((item) => item.status !== "needs_human"));
          return { status: complete ? "passed" : "missing", detail: "serious findings are fixed or explicitly risk-accepted" };
        })()
        : result.facts?.completion_subjects?.[subject]
      : null;
    const review = kind === "review" ? reviewEvidenceStatus(ctx.task, candidate) : null;
    const test = kind === "test" ? testEvidenceStatus(ctx.task, candidate) : null;
    const confirmation = kind === "confirmation" ? confirmationEvidenceStatus(ctx.task, candidate) : null;
    const status = kind === "acceptance_criterion"
      ? new Set(["passed", "failed", "missing"]).has(acceptanceSubject?.status)
        ? acceptanceSubject.status
        : "missing"
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
    if (!qualityPredicatePassed) {
      allPassed = false;
      qualityWarnings.push(`${subject}:${status}`);
    }
    const evidenceType = { test: "test_receipt", review: "review_result", acceptance_criterion: "acceptance_evidence", confirmation: "human_confirmation" }[kind];
    let factEvidenceRef = kind === "acceptance_criterion" ? undefined : candidate?.ref;
    let factEvidenceHash = kind === "acceptance_criterion" ? undefined : candidate?.sha256;
    const factEvidence = kind === "acceptance_criterion" ? [] : candidate ? [candidate] : [];
    if (kind === "acceptance_criterion") {
      const subjectEvidence = Array.isArray(acceptanceSubject?.evidence_refs)
        ? acceptanceSubject.evidence_refs.filter((entry) => typeof entry?.ref === "string" && typeof entry?.sha256 === "string")
        : [];
      const evidenceValue = {
        schema_version: "stage-quality-evidence.v1",
        task_id: ctx.identity.taskId,
        stage: ctx.stage,
        subject,
        status,
        snapshot_tree: snapshot.tree,
        subject_fact: {
          status,
          detail: acceptanceSubject?.detail ?? "handler did not provide a subject-specific completion fact",
          evidence_refs: subjectEvidence,
        },
      };
      const evidenceRaw = `${JSON.stringify(evidenceValue, null, 2)}\n`;
      const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
      const evidenceRef = `quality/evidence/stage-quality/${ctx.stage}/${subject}-${evidenceHash}.json`;
      publishVNextEvidence(ctx, evidenceRef, evidenceRaw);
      const acceptanceValue = {
        schema_version: "acceptance-evidence.v1",
        acceptance_criterion_id: subject,
        result: status === "passed" ? "pass" : "fail",
        refs: [{ ref: evidenceRef, sha256: evidenceHash }],
        snapshot_tree: snapshot.tree,
        summary: { actual_outcome: status, evidence_type: "stage quality fact" },
      };
      const acceptanceRaw = `${JSON.stringify(acceptanceValue, null, 2)}\n`;
      factEvidenceHash = createHash("sha256").update(acceptanceRaw).digest("hex");
      factEvidenceRef = `quality/evidence/acceptance/${ctx.stage}/${subject}-${factEvidenceHash}.json`;
      publishVNextEvidence(ctx, factEvidenceRef, acceptanceRaw);
      factEvidence.push({ ref: factEvidenceRef, sha256: factEvidenceHash });
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
    const fact = ctx.kernel.publishVNextQualityFact(ctx.stage, {
      kind,
      status,
      subject,
      evidence: factEvidence.map(({ ref, sha256 }) => ({ ref, sha256, evidence_type: evidenceType })),
    });
    qualityFactRefs.push(fact.ref);
  }
  // The stage is source-bound at entry and rechecked once after publication
  // writes. Re-capturing a multi-gigabyte worktree for every AC does not add
  // protection because these writes are outside the source snapshot boundary.
  assertVNextSourceStable(ctx, preflightSnapshot);
  const observations = qualityFactRefs.map((ref) => {
    const raw = ctx.task.readRecord(ref);
    return {
      fact: { ref, value: JSON.parse(raw) },
      authenticated: true,
      freshness: { status: "current" },
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
    ...(typeof result.stage_outcome_ref === "string" ? {
      stage_outcome_ref: result.stage_outcome_ref,
      stage_outcome_hash: result.stage_outcome_hash,
      stage_outcome_status: result.stage_outcome_status,
      step_outcomes: Object.freeze([...(result.step_outcomes ?? [])]),
      skill_outcomes: Object.freeze([...(result.skill_outcomes ?? [])]),
      spec_analyze: result.spec_analyze,
      stage_outcome_summary: stageOutcomeSummary,
    } : {}),
    ...(result.missing_items?.length ? { missing_items: [...result.missing_items] } : {}),
  });
}

/**
 * Execute the low-level publication helper for a workflow stage.
 * The handler receives capabilities and already verified upstream data; it does
 * not discover task identity or publish records itself. Stage skills are read
 * and executed directly by the current host Stage Agent; this runtime only
 * records the resulting task and quality facts.
 */
export async function runStage(stage, context, handler, publication = {}) {
  if (!Object.prototype.hasOwnProperty.call(UPSTREAM_STAGE, stage)) {
    throw new TypeError(`unsupported stage: ${stage}`);
  }
  const ctx = assertContext(context, stage);
  if (typeof handler !== "function") throw new TypeError("stage handler is required");

  const upstream = upstreamForStage(ctx, stage);
  const vNextPreflightSnapshot = ctx.kernel.currentVNextSnapshot();
  const result = plainResult(await handler(workerContext(ctx, publication), upstream));

  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");
  return publishVNextStage(ctx, result, vNextPreflightSnapshot);
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
    ...(ctx.workspace ? { snapshotWorkspace: () => captureWorkspaceSnapshot(ctx.workspace) } : {}),
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
  if (tests) {
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
  const stageOutcome = authenticateStageOutcome(ctx, stage, input);
  return runStage(
    stage,
    ctx,
    async () => {
      const result = verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx, publication), input));
      return {
        ...result,
        stage_outcome_ref: stageOutcome.ref,
        stage_outcome_hash: stageOutcome.sha256,
        stage_outcome_status: stageOutcome.value.status,
        step_outcomes: stageOutcome.step_outcomes,
        skill_outcomes: stageOutcome.skill_outcomes,
        spec_analyze: specAnalyzeDisclosure(stageOutcome.spec_analyze),
      };
    },
    publication,
  );
}
