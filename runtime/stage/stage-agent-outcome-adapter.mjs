import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { captureExecutionSnapshot } from "../task/git-worktree-snapshot.mjs";
import { CURRENT_MATERIAL_FILES } from "../task/material-workspace.mjs";
import { loadStageManifest } from "./step-manifest.mjs";
import { STAGE_SPEC_ANALYZE_PROFILES, validateStageSpecAnalyzeProfile } from "./stage-content-contracts.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const STATUSES = new Set(["completed", "skipped", "incomplete", "unavailable"]);
const REPOSITORY_ROOT = new URL("../../", import.meta.url);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

function status(value, label) {
  if (!STATUSES.has(value)) throw new TypeError(`${label} must be a supported stage outcome status`);
  return value;
}

function cost(value, label) {
  const entry = object(value, label);
  const allowed = new Set(["duration_ms", "tokens", "status", "reason"]);
  const unknown = Object.keys(entry).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unsupported fields: ${unknown.join(", ")}`);
  for (const key of ["duration_ms", "tokens"]) {
    if (entry[key] !== null && entry[key] !== undefined
        && (!Number.isSafeInteger(entry[key]) || entry[key] < 0)) {
      throw new TypeError(`${label}.${key} must be a non-negative integer or null`);
    }
  }
  text(entry.status, `${label}.status`);
  if (!new Set(["recorded", "unavailable"]).has(entry.status)) throw new TypeError(`${label}.status is invalid`);
  if (entry.status === "recorded" && (entry.duration_ms === null || entry.tokens === null)) {
    throw new TypeError(`${label} recorded cost requires duration_ms and tokens`);
  }
  if (entry.status === "unavailable") {
    if (entry.duration_ms !== null || entry.tokens !== null) throw new TypeError(`${label} unavailable cost requires null usage`);
    text(entry.reason, `${label}.reason`);
  }
  return structuredClone(entry);
}

function activeWorkspace({ workspace, candidateWorkspace }) {
  const active = workspace ?? candidateWorkspace;
  if (!active?.worktreeRoot) throw new TypeError("Stage Agent outcome adapter requires an authenticated Workspace");
  return active;
}

function readMaterials(artifacts) {
  if (!(artifacts instanceof ArtifactDir)) throw new TypeError("Stage Agent outcome adapter requires an authenticated ArtifactDir");
  const values = CURRENT_MATERIAL_FILES.map((file) => {
    try { return [file, artifacts.read(file)]; }
    catch (error) {
      if (error?.code === "ENOENT") return [file, null];
      throw error;
    }
  });
  const revision = `revision-${sha256(JSON.stringify(values))}`;
  return Object.freeze({
    values: Object.freeze(values),
    revision,
    hashes: Object.freeze(Object.fromEntries(values.map(([file, content]) => [
      file, content === null ? null : sha256(content),
    ]))),
  });
}

function writeProof({ kernel, taskId, stage, attemptId, snapshotTree, materialRevision, subjectKind, subjectId, outcomeStatus, resultSummary, evidence }) {
  object(evidence, `${subjectKind} ${subjectId} evidence`);
  const value = {
    schema_version: "workflowhub-stage-outcome-evidence.v1",
    task_id: taskId,
    stage,
    snapshot_tree: snapshotTree,
    material_revision: materialRevision,
    subject_kind: subjectKind,
    subject_id: subjectId,
    outcome_status: outcomeStatus,
    result_summary: resultSummary,
    attempt_id: attemptId,
    host_evidence: structuredClone(evidence),
  };
  const raw = canonicalJson(value);
  const digest = sha256(raw);
  const ref = `quality/evidence/stage-outcome-proofs/${digest}.json`;
  kernel.publishCanonicalRecord(ref, raw);
  return Object.freeze({ ref, sha256: digest });
}

function proofForSubject({ kernel, taskId, stage, attemptId, snapshotTree, materialRevision }, entry, subjectKind, subjectId) {
  const value = object(entry, `${subjectKind} ${subjectId}`);
  const resultSummary = text(value.result_summary, `${subjectKind} ${subjectId}.result_summary`);
  const outcomeStatus = status(value.status, `${subjectKind} ${subjectId}.status`);
  if (!Array.isArray(value.evidence) || (outcomeStatus === "completed" && value.evidence.length === 0)) {
    throw new TypeError(`${subjectKind} ${subjectId} requires actual evidence; completed outcomes cannot be empty`);
  }
  const evidenceRefs = value.evidence.map((evidence, index) => writeProof({
    kernel, taskId, stage, attemptId, snapshotTree, materialRevision,
    subjectKind, subjectId, outcomeStatus, resultSummary,
    evidence: object(evidence, `${subjectKind} ${subjectId}.evidence[${index}]`),
  }));
  return { value, resultSummary, outcomeStatus, evidenceRefs };
}

function materialTextMap(materials) {
  return Object.fromEntries(materials.values.map(([file, content]) => [file, content]));
}

function buildAnalyzer({ execution, taskId, stage, snapshot, materials, manifest, skills }) {
  const profile = STAGE_SPEC_ANALYZE_PROFILES[stage];
  const input = object(execution.spec_analyze, "execution.spec_analyze");
  const packetInput = object(input.packet, "execution.spec_analyze.packet");
  const analyzerStep = manifest.steps.find((step) => ["stage-end-spec-analyze", "final-spec-analyze"].includes(step.step_slug));
  const analyzerSkill = skills.skills?.find((skill) => skill.name === "spec-analyze");
  if (!analyzerStep || !analyzerSkill) throw new Error(`${stage} manifests must declare stage-end spec-analyze`);
  const materialText = materialTextMap(materials);
  const implementationMaterial = profile.required_materials.includes("implementation")
    ? text(input.implementation_material, "execution.spec_analyze.implementation_material")
    : null;
  const subjects = object(input.evidence_subjects, "execution.spec_analyze.evidence_subjects");
  const proofBySubject = new Map();
  for (const [kind, entries] of [["step", execution.steps], ["skill", execution.skills]]) {
    for (const entry of entries) {
      const id = kind === "step" ? entry.step_slug : entry.skill_id;
      const proof = entry.__adapter_result?.evidenceRefs?.[0];
      if (proof) proofBySubject.set(`${kind}:${id}`, proof);
    }
  }
  const analyzerEvidenceBindings = {};
  const analyzerEvidence = profile.required_evidence.map((logicalRef) => {
    const subject = object(subjects[logicalRef], `execution.spec_analyze.evidence_subjects.${logicalRef}`);
    const subjectKey = `${text(subject.subject_kind, `${logicalRef}.subject_kind`)}:${text(subject.subject_id, `${logicalRef}.subject_id`)}`;
    const proof = proofBySubject.get(subjectKey);
    if (!proof) throw new Error(`${stage} analyzer evidence ${logicalRef} must bind an actual step or skill evidence record`);
    analyzerEvidenceBindings[logicalRef] = { ...proof, snapshot_tree: snapshot.tree };
    return { ref: logicalRef, kind: logicalRef, status: "fresh", hash: proof.sha256, snapshot_tree: snapshot.tree };
  });
  const analyzerMaterials = Object.fromEntries(profile.required_materials.map((name) => {
    if (name === "original_requirement" || name === "decision_log") return [name, materialText["decision-log.md"]];
    if (name === "spec" || name === "plan" || name === "tasks") return [name, materialText[`${name}.md`]];
    return [name, implementationMaterial];
  }));
  const analyzerBindings = {};
  for (const name of profile.required_materials) {
    if (name === "implementation") {
      const subject = object(input.implementation_evidence_subject, "execution.spec_analyze.implementation_evidence_subject");
      const subjectKey = `${text(subject.subject_kind, "implementation_evidence_subject.subject_kind")}:${text(subject.subject_id, "implementation_evidence_subject.subject_id")}`;
      const proof = proofBySubject.get(subjectKey);
      if (!proof) throw new Error(`${stage} implementation material must bind an actual evidence record`);
      analyzerBindings[name] = { ...proof, snapshot_tree: snapshot.tree, material_sha256: sha256(implementationMaterial) };
    } else {
      const sourceRef = name === "original_requirement" || name === "decision_log" ? "decision-log.md" : `${name}.md`;
      if (typeof materialText[sourceRef] !== "string") throw new Error(`${stage} analyzer material ${sourceRef} is unavailable`);
      analyzerBindings[name] = { source_ref: sourceRef, sha256: sha256(materialText[sourceRef]), snapshot_tree: snapshot.tree };
    }
  }
  const packet = { ...structuredClone(packetInput), materials: analyzerMaterials, evidence: analyzerEvidence };
  const analysis = validateStageSpecAnalyzeProfile({ stage, packet });
  // A delivered packet may honestly contain incomplete or unavailable
  // step/skill work.  Keep the analyzer result and let the public route expose
  // quality=incomplete; only a top-level completed packet requires a
  // semantically consistent analyzer.
  if (!analysis.ok && execution.status === "completed") {
    throw new Error(`${stage} Stage Agent analyzer packet is invalid: ${analysis.errors.join("; ")}`);
  }
  return {
    schema_version: "workflowhub-spec-analyze-stage-outcome.v1",
    stage,
    snapshot_tree: snapshot.tree,
    material_revision: materials.revision,
    step_slug: analyzerStep.step_slug,
    skill_id: "spec-analyze",
    material_bindings: analyzerBindings,
    evidence_bindings: analyzerEvidenceBindings,
    packet,
    result: analysis,
  };
}

/**
 * Build a truthful host-protocol failure result when the external Stage Agent
 * did not produce its structured execution object.  This is deliberately not
 * a success shortcut: every declared subject is recorded as unavailable and
 * spec-analyze remains material_incomplete.  The value is still useful because
 * it lets the official route publish the real failure and monitoring facts.
 */
function unavailableExecution({ stage, host, agentRunId, reason, manifest, skills }) {
  const safeReason = text(reason, "unavailable reason");
  const stepSubjects = manifest.steps.map((step) => step.step_slug);
  const firstSubject = stepSubjects[0]
    ? { subject_kind: "step", subject_id: stepSubjects[0] }
    : { subject_kind: "skill", subject_id: skills.skills[0]?.name };
  const evidence = (subjectKind, subjectId) => [{
    kind: "stage-agent-protocol",
    status: "unavailable",
    reason: safeReason,
    subject_kind: subjectKind,
    subject_id: subjectId,
  }];
  const unavailableCost = { duration_ms: null, tokens: null, status: "unavailable", reason: safeReason };
  const steps = manifest.steps.map((step) => ({
    step_id: step.step_id,
    step_slug: step.step_slug,
    order: step.order,
    status: "unavailable",
    input_refs: [],
    result_summary: `Stage Agent 未提供 ${step.step_slug} 的真实执行结果`,
    evidence: evidence("step", step.step_slug),
    reason: safeReason,
    cost: unavailableCost,
  }));
  const skillsOutcomes = skills.skills.map((skill) => ({
    skill_id: skill.name,
    status: "unavailable",
    trigger: skill.name === "spec-analyze",
    executed: skill.name === "spec-analyze",
    version: "unavailable",
    result_summary: `Stage Agent 未提供 ${skill.name} 的真实执行结果`,
    evidence: evidence("skill", skill.name),
    reason: safeReason,
    cost: unavailableCost,
  }));
  const evidenceSubjects = Object.fromEntries(
    STAGE_SPEC_ANALYZE_PROFILES[stage].required_evidence.map((logicalRef) => [logicalRef, firstSubject]),
  );
  const specAnalyze = {
    packet: {
      original_requirements: [],
      coverage: [],
      current_stage_repairs: [],
      work_summary: `宿主未收到 Stage Agent 结果：${safeReason}`,
    },
    evidence_subjects: evidenceSubjects,
    ...(STAGE_SPEC_ANALYZE_PROFILES[stage].required_materials.includes("implementation")
      ? {
          implementation_material: `unavailable: ${safeReason}`,
          implementation_evidence_subject: firstSubject,
        }
      : {}),
  };
  return {
    status: "unavailable",
    provenance: { kind: "stage-agent", host: text(host, "unavailable host"), agent_run_id: text(agentRunId, "unavailable agent run id") },
    steps,
    skills: skillsOutcomes,
    spec_analyze: specAnalyze,
  };
}

/**
 * Publish the result of an already executed Stage Agent.
 *
 * This is deliberately a host-facing adapter, not a runner: it never starts
 * a model, resolves a skill, scans sessions, or invents a step result. The
 * caller must provide one actual result and at least one evidence payload for
 * every completed step/skill. All bytes go through the existing TaskKernel.
 */
export function publishStageAgentOutcome({
  task, kernel, artifacts, workspace, candidateWorkspace, stage, attemptId = "attempt-stage-agent-1", workflowRunId = null, execution,
} = {}) {
  const safeTask = assertTaskHandle(task);
  const safeKernel = assertTaskKernel(kernel);
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  const active = activeWorkspace({ workspace, candidateWorkspace });
  const safeArtifacts = artifacts instanceof ArtifactDir ? artifacts : ArtifactDir.open(active.worktreeRoot, safeTask);
  const input = object(execution, "Stage Agent execution");
  const provenance = object(input.provenance, "Stage Agent execution.provenance");
  if (provenance.kind !== "stage-agent") throw new Error("Stage Agent provenance.kind must be stage-agent");
  text(provenance.host, "Stage Agent provenance.host");
  text(provenance.agent_run_id, "Stage Agent provenance.agent_run_id");
  const stageStatus = status(input.status, "Stage Agent execution.status");
  text(attemptId, "attemptId");
  if (!Array.isArray(input.steps) || !Array.isArray(input.skills)) throw new TypeError("Stage Agent execution must include steps and skills arrays");

  const snapshot = active.captureSnapshot?.() ?? captureExecutionSnapshot(active.worktreeRoot);
  const materials = readMaterials(safeArtifacts);
  const stepsManifestRef = `workflows/${stage}/steps.json`;
  const skillsManifestRef = `workflows/${stage}/skill-deps.yaml`;
  const stepsManifestRaw = readFileSync(new URL(stepsManifestRef, REPOSITORY_ROOT), "utf8");
  const skillsManifestRaw = readFileSync(new URL(skillsManifestRef, REPOSITORY_ROOT), "utf8");
  const manifest = loadStageManifest(stage, new URL("../../", import.meta.url).pathname);
  const skills = yaml.load(skillsManifestRaw);
  if (input.steps.length !== manifest.steps.length || input.skills.length !== (skills.skills?.length ?? 0)) {
    throw new Error(`${stage} Stage Agent execution must contain every declared step and skill exactly once`);
  }
  const context = { kernel: safeKernel, taskId: safeTask.identity.taskId, stage, attemptId, snapshotTree: snapshot.tree, materialRevision: materials.revision };
  const stepOutcomes = input.steps.map((entry, index) => {
    const expected = manifest.steps[index];
    if (entry.step_id !== expected.step_id || entry.step_slug !== expected.step_slug || entry.order !== expected.order) {
      throw new Error(`${stage} Stage Agent step ${index + 1} does not match the declared manifest`);
    }
    const result = proofForSubject(context, entry, "step", expected.step_slug);
    return {
      step_id: expected.step_id,
      step_slug: expected.step_slug,
      order: expected.order,
      status: result.outcomeStatus,
      input_refs: Array.isArray(entry.input_refs) ? [...entry.input_refs] : (() => { throw new TypeError(`step ${expected.step_slug}.input_refs must be an array`); })(),
      result_summary: result.resultSummary,
      evidence_refs: result.evidenceRefs,
      ...(result.outcomeStatus === "completed" ? {} : { reason: text(entry.reason ?? entry.error, `step ${expected.step_slug}.reason`) }),
      cost: cost(entry.cost, `step ${expected.step_slug}.cost`),
    };
  });
  const skillOutcomes = input.skills.map((entry, index) => {
    const expected = skills.skills[index];
    if (entry.skill_id !== expected.name) throw new Error(`${stage} Stage Agent skill ${index + 1} does not match the declared manifest`);
    if (typeof entry.trigger !== "boolean" || typeof entry.executed !== "boolean") throw new TypeError(`skill ${expected.name} requires trigger and executed booleans`);
    const result = proofForSubject(context, entry, "skill", expected.name);
    return {
      skill_id: expected.name,
      status: result.outcomeStatus,
      trigger: entry.trigger,
      executed: entry.executed,
      version: text(entry.version, `skill ${expected.name}.version`),
      result_summary: result.resultSummary,
      evidence_refs: result.evidenceRefs,
      ...(result.outcomeStatus === "completed" ? {} : { reason: text(entry.reason ?? entry.error, `skill ${expected.name}.reason`) }),
      cost: cost(entry.cost, `skill ${expected.name}.cost`),
    };
  });
  const adapterInput = {
    ...input,
    steps: input.steps.map((entry, index) => ({ ...entry, __adapter_result: { evidenceRefs: stepOutcomes[index].evidence_refs } })),
    skills: input.skills.map((entry, index) => ({ ...entry, __adapter_result: { evidenceRefs: skillOutcomes[index].evidence_refs } })),
  };
  const analyzer = buildAnalyzer({ execution: adapterInput, taskId: safeTask.identity.taskId, stage, snapshot, materials, manifest, skills });
  const value = {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: safeTask.identity.taskId,
    stage,
    ...(workflowRunId === null ? {} : { run_id: text(workflowRunId, "workflowRunId") }),
    attempt_id: attemptId,
    status: stageStatus,
    producer: { kind: "stage-agent", host: provenance.host, agent_run_id: provenance.agent_run_id },
    snapshot_tree: snapshot.tree,
    material_revision: materials.revision,
    material_hashes: materials.hashes,
    steps_manifest_ref: stepsManifestRef,
    steps_manifest_hash: sha256(stepsManifestRaw),
    skills_manifest_ref: skillsManifestRef,
    skills_manifest_hash: sha256(skillsManifestRaw),
    step_outcomes: stepOutcomes,
    skill_outcomes: skillOutcomes,
    spec_analyze: analyzer,
  };
  const raw = canonicalJson(value);
  const digest = sha256(raw);
  const ref = `quality/evidence/stage-outcomes/${stage}/${digest}.json`;
  safeKernel.publishCanonicalRecord(ref, raw);
  return Object.freeze({ ref, sha256: digest, value: Object.freeze(value) });
}

/**
 * Publish the fail-closed record for a missing or invalid host result.
 * Authentication and all current materials still come from the same bridge
 * context as a normal Stage Agent result.
 */
export function publishUnavailableStageAgentOutcome({
  task, kernel, artifacts, workspace, candidateWorkspace, stage, attemptId = "attempt-stage-agent-1", workflowRunId = null,
  host, agentRunId, reason,
} = {}) {
  const manifest = loadStageManifest(stage, new URL("../../", import.meta.url).pathname);
  const skillsRaw = readFileSync(new URL(`../../workflows/${stage}/skill-deps.yaml`, import.meta.url), "utf8");
  const skills = yaml.load(skillsRaw);
  return publishStageAgentOutcome({
    task, kernel, artifacts, workspace, candidateWorkspace, stage, attemptId, workflowRunId,
    execution: unavailableExecution({
      stage,
      host,
      agentRunId,
      reason,
      manifest,
      skills,
    }),
  });
}
