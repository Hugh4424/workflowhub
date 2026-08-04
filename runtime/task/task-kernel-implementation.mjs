import { createHash } from "node:crypto";

import factsContract from "../../contracts/facts-subschema.json" with { type: "json" };
import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";
import { ArtifactDir, assertArtifactDir } from "../../core/artifact-dir.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
import { createQualityFact, publishQualityFact } from "../evidence/quality-fact.mjs";
import { createPublication, publishPublication } from "../stage/publication.mjs";
import { evaluateFactFreshness } from "../evidence/freshness.mjs";
import { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";
import { deriveStageCompletion } from "../stage/completion-predicates.mjs";
import {
  buildRiskAcceptance,
  deriveSeriousReviewPause,
  validateRiskAcceptance,
} from "../review/stage-review-disposition.mjs";
import {
  assertRuntimeStageSkillInvocation,
  serializeStageSkillInvocation,
  stageSkillInvocationRef,
} from "../../core/stage-skill-invocation.mjs";

export { createQualityFact } from "../evidence/quality-fact.mjs";
export { deriveStageCompletion } from "../stage/completion-predicates.mjs";
export { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/i;
const MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
const CONFIRMATION_REF = /^quality\/confirmations\/[a-f0-9]{64}\.json$/;
const AUTHORIZATION_OPERATIONS = new Set(["commit", "push", "merge", "archive", "cleanup"]);
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
  if (value?.schema_version !== "human-confirmation.v2" || value.task_id !== task.identity.taskId || value.decision !== "accepted") {
    throw new Error(`${label} must be an accepted human-confirmation.v2 for the current task`);
  }
  if (typeof value.subject_ref !== "string" || value.subject_ref.trim() === "") throw new Error(`${label} must bind a non-empty subject_ref`);
  if (!/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "") || !/^[a-f0-9]{40,64}$/i.test(value.snapshot_tree ?? "")) {
    throw new Error(`${label} has invalid material/snapshot provenance`);
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
  const replacePointer = typeof authority.replaceStageContentPointerFor === "function"
    ? authority.replaceStageContentPointerFor(task) : null;
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
    const values = MATERIAL_FILES.map((file) => [file, dir.read(file)]);
    const materialDigest = hash(JSON.stringify(values));
    const revision = {
      schema_version: "vnext-material-context.v1",
      task_id: task.identity.taskId,
      revision_id: `revision-${materialDigest}`,
      material_digest: materialDigest,
      source: "current-four-materials",
    };
    return { revision, snapshot: captureGitWorktreeSnapshot(active.worktreeRoot) };
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
  const kernel = {
    task,
    readInput,
    currentVNextSnapshot,
    deriveStageWorkflowRunId(stage) {
      return `vnext-${hash(`${task.identity.taskId}\0${stageName(stage)}`).slice(0, 32)}`;
    },
    publishCanonicalRecord(relativePath, raw) {
      if (Buffer.isBuffer(raw)) raw = raw.toString("utf8");
      if (typeof raw !== "string" || raw.length === 0) throw new TypeError("canonical record bytes are required");
      ref(relativePath, "canonical record ref");
      if (/^(?:receipts|reviews)\//.test(relativePath)) {
        throw new Error(`vNext canonical records must use quality namespace; legacy projection is retired: ${relativePath}`);
      }
      if (!/^(?:receipts|reviews|evidence|quality|publications)\//.test(relativePath)) {
        throw new Error("canonical record namespace required");
      }
      return createImmutable(relativePath, raw);
    },
    publishStageSkillInvocation(fact) {
      assertRuntimeStageSkillInvocation(fact);
      if (fact.task_id !== task.identity.taskId) throw new Error("stage skill invocation task identity mismatch");
      if (fact.workflow_run_id !== kernel.deriveStageWorkflowRunId(fact.stage)) throw new Error("stage skill invocation run identity mismatch");
      const relativePath = stageSkillInvocationRef(fact);
      return createImmutable(relativePath, serializeStageSkillInvocation(fact));
    },
    readStageSkillInvocation(stage, name, invocationKey = "default") {
      const identity = hash(`${task.identity.taskId}\0${stageName(stage)}\0${kernel.deriveStageWorkflowRunId(stage)}`);
      const relativePath = `evidence/invocations/${identity}/${name}/${invocationKey}.json`;
      try {
        const raw = task.readRecord(relativePath);
        return Object.freeze({ ref: relativePath, hash: hash(raw), fact: JSON.parse(raw) });
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    publishVNextQualityFact(stage, input = {}) {
      const name = stageName(stage);
      object(input, "vNext quality fact input");
      rejectUnknown(input, new Set(["kind", "status", "subject", "evidence"]), "vNext quality fact input");
      const { revision, snapshot } = currentContext();
      const fact = createQualityFact({ taskId: task.identity.taskId, stage: name, materialRevision: revision.revision_id, snapshotTree: snapshot.tree, ...input, recordedAt: now() });
      return publishQualityFact({ fact, read: task.readRecord, create: (recordRef, raw) => createRecord(recordRef, raw) });
    },
    publishVNextPublication(stage, input = {}) {
      const name = stageName(stage);
      object(input, "vNext publication input");
      rejectUnknown(input, new Set(["quality_fact_refs", "progression"]), "vNext publication input");
      if (!Array.isArray(input.quality_fact_refs) || input.quality_fact_refs.length === 0) throw new TypeError("vNext publication requires quality_fact_refs");
      if (input.progression?.status !== "completed"
          || input.progression.authority !== "current-four-materials-and-plan-tasks") {
        throw new Error("vNext publication requires current plan/tasks progress");
      }
      const { revision, snapshot } = currentContext();
      const facts = input.quality_fact_refs.map((recordRef) => {
        const raw = task.readRecord(recordRef);
        const value = JSON.parse(raw);
        return { ...value, value, ref: recordRef, sha256: hash(raw) };
      });
      const freshness = facts.map((fact) => evaluateFactFreshness(fact, { material_revision: revision.revision_id, snapshot_tree: snapshot.tree }, { read: task.readRecord }));
      const publication = createPublication({
        taskId: task.identity.taskId,
        stage: name,
        materialRevision: revision,
        qualityFacts: facts,
        freshness,
        snapshotTree: snapshot.tree,
        read: task.readRecord,
        allowIncompleteQuality: true,
        progression: input.progression,
      });
      return publishPublication({ publication, read: task.readRecord, create: (recordRef, raw) => createRecord(recordRef, raw) });
    },
    publishHumanConfirmation(stage, input = {}) {
      const name = stageName(stage);
      object(input, "human confirmation input");
      rejectUnknown(input, new Set(["decision", "subject_ref"]), "human confirmation input");
      if (!new Set(["accepted", "rejected"]).has(input.decision)) throw new TypeError("human confirmation decision is invalid");
      const { revision, snapshot } = currentContext();
      const value = { schema_version: "human-confirmation.v2", task_id: task.identity.taskId, stage: name, decision: input.decision, subject_ref: input.subject_ref ?? null, material_revision: revision.revision_id, snapshot_tree: snapshot.tree, confirmed_at: now() };
      const qualityStatus = input.decision === "accepted" ? "passed" : "failed";
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
            && quality.subject === "human_confirmation"
            ? quality.evidence?.[0]?.ref
            : null;
          if (!evidenceRef) continue;
          const existing = JSON.parse(task.readRecord(evidenceRef));
          if (existing.schema_version === value.schema_version && existing.decision === value.decision && existing.subject_ref === value.subject_ref) {
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
          snapshotTree: snapshot.tree,
          kind: "confirmation",
          status: qualityStatus,
          subject: "human_confirmation",
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
      if (candidates.length !== 1) throw new Error(`IRREVERSIBLE_AUTHORIZATION_AMBIGUOUS: ${operation} has multiple authorizations for ${confirmation.ref}`);
      const authorization = candidates[0];
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
    replaceStageContentLatestPointer() {
      if (replacePointer) throw new Error("mutable stage-content latest pointers are retired");
      throw new Error("mutable stage-content latest pointers are retired");
    },
    prepareMakeDecisionInteractionPublication: unsupported("make-decision interaction publication preparation"),
    completeMakeDecisionInteractionPublication: unsupported("make-decision interaction publication completion"),
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
        const cardRef = `evidence/review-risk-cards/${finding.card_hash}.json`;
        const cardRaw = `${JSON.stringify(finding, null, 2)}\n`;
        createImmutable(cardRef, cardRaw);
        return Object.freeze({ ...finding, card_ref: cardRef });
      });
      return Object.freeze({ ...pause, findings });
    },
    acceptReviewRisk({ stage, reviewResultRef, findingId, cardRef, cardHash, selectedOption, replyRef, replyHash } = {}) {
      const pause = kernel.prepareReviewRiskPause({ stage, reviewResultRef });
      if (pause.status !== "paused") throw new Error("risk acceptance requires a serious review pause");
      const finding = pause.findings.find(({ finding_id: id }) => id === findingId);
      if (!finding || finding.card_ref !== cardRef || finding.card_hash !== cardHash) throw new Error("risk acceptance card does not bind the canonical pause card");
      if (typeof replyRef !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(replyRef) || replyRef.includes("..")) throw new Error("risk acceptance reply ref is invalid");
      const replyRaw = task.readRecord(replyRef);
      if (hash(replyRaw) !== replyHash) throw new Error("risk acceptance reply ref/hash does not bind canonical reply bytes");
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
      const record = createImmutable(`evidence/risk-acceptances/${hash(raw)}.json`, raw);
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
    readReviewFlow: unsupported("review flow"),
    readReviewFlowHistory: unsupported("review flow history"),
    deriveReviewFlowIdentity: unsupported("review flow identity"),
    withReviewFlowLock: unsupported("review flow lock"),
    recordReviewAttempt: unsupported("review flow attempt"),
    assertReviewFlowReady: unsupported("review flow readiness"),
    advanceReviewFlow: unsupported("review flow advancement"),
    adoptLegacyReviewRoot: unsupported("legacy review adoption"),
    activeStageRun: unsupported("stage run lookup"),
    latestHistoricalStageRun: unsupported("stage run lookup"),
  };
  return kernel;
}
