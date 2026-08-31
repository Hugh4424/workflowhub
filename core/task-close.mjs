import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { assertTaskHandle } from "../runtime/task/task-handle.mjs";
import { assertTaskKernel } from "../runtime/task/task-kernel.mjs";
import { captureExecutionSnapshot, captureGitWorktreeSnapshot, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES, isExecutionRecordOnlyMaterialDelta, isMaterialOnlySnapshotDelta, materialRevisionFromValues } from "../runtime/task/git-worktree-snapshot.mjs";
import { qualityFactDigest } from "../runtime/evidence/quality-fact.mjs";
import { evaluateFactFreshness } from "../runtime/evidence/freshness.mjs";
import { validateAcceptanceEvidence } from "../runtime/evidence/acceptance-evidence-validator.mjs";
import { isHumanConfirmationVersion, validateCanonicalFullTestReceipt, validateCanonicalImplementationReceipt, validateCanonicalTestReceipt, validateHumanConfirmation, validateMiniTaskAcTrace } from "../runtime/evidence/canonical-evidence-validators.mjs";
import { validateSchema } from "../runtime/review/schema-validator.mjs";
import { authenticateCanonicalReviewResult } from "../runtime/review/canonical-review-result.mjs";
import { parseReviewerOutput } from "../runtime/review/review-output.mjs";
import { canonicalReviewFindings, deriveSeriousReviewPause, isActionableSeriousFinding, validateReportableFindingDispositions, validateRiskAcceptance } from "../runtime/review/stage-review-disposition.mjs";
import { ArtifactDir, artifactReference } from "./artifact-dir.mjs";
import { CURRENT_MATERIAL_FILES, inspectMaterialWorkspace } from "../runtime/task/material-workspace.mjs";
import { appendTaskFact, initializeTaskStore, readTaskFacts } from "../runtime/task/task-store.mjs";
import { createTaskWorktreeRemoval, inspectWorktreeCleanup, openCurrentTaskWorkspace } from "../runtime/task/workspace.mjs";
import { deriveCurrentProductRelease, stageMaterialScopeRevisions, STAGE_PREDICATES, qualityPredicateSatisfied } from "../runtime/stage/completion-predicates.mjs";
import { activeAcceptanceCriterionIds } from "../runtime/stage/stage-content-contracts.mjs";

const HASH = /^[a-f0-9]{64}$/;
const STEP_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62})$/;
const GOVERNED_EXECUTORS = new WeakSet();
const PHYSICAL_DELIVERY_FACTS = Object.freeze([
  "delivery_committed",
  "archive",
  "merge",
  "push",
  "worktree_cleanup",
  "formal_cleanup_safe",
  "branch_cleanup",
]);

function plain(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function canonical(value, label = "close plan") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} contains a non-finite number`);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item, label)).join(",")}]`;
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must contain JSON values only`);
  }
  const keys = Object.keys(value).sort();
  if (keys.some((key) => value[key] === undefined || typeof value[key] === "function" || typeof value[key] === "symbol" || typeof value[key] === "bigint")) {
    throw new TypeError(`${label} must contain JSON values only`);
  }
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key], label)}`).join(",")}}`;
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function physicalDeliveryMissing(state) {
  const facts = state?.facts ?? state;
  return PHYSICAL_DELIVERY_FACTS.filter((name) => facts?.[name] !== true);
}

export function authenticateReviewEvidence(task, result) {
  const attemptRef = result.attempt_ref;
  const attempt = JSON.parse(task.readRecord(attemptRef));
  validateSchema("attempt", attempt);
  if (attempt.task_id !== task.identity.taskId
      || attempt.stage !== result.stage
      || attempt.review_track !== result.review_track
      || attempt.snapshot_tree !== result.snapshot_tree
      || attempt.material_id !== result.material_id
      || attempt.terminal_status !== "semantic"
      || attempt.error !== null) {
    throw new Error(`review attempt/result binding is invalid: ${attemptRef}`);
  }
  const attemptId = attemptRef.match(/^quality\/reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error(`review attempt identity is invalid: ${attemptRef}`);
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
        || output.content_hash !== sha256(output.content)) {
      throw new Error(`review provider output provenance is invalid: ${providerAttempt.provider}`);
    }
    providerOutputs.push({
      ref: providerAttempt.output_ref,
      provider: providerAttempt.provider,
      ...(providerAttempt.identity ? { identity: providerAttempt.identity } : {}),
      ...(output.evidence_anchor_valid === undefined ? {} : { evidenceAnchors: output.evidence_anchor_valid }),
      review: parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined }),
    });
  }
  authenticateCanonicalReviewResult({
    attempt,
    result,
    providerOutputs,
  });
}

function authenticateFindingDispositionEvidence(task, fact, nestedValues) {
  const stageQuality = nestedValues.find((value) => value?.schema_version === "stage-quality-evidence.v1"
    && value.subject === "finding_dispositions");
  if (!stageQuality || stageQuality.task_id !== task.identity.taskId
      || stageQuality.stage !== fact.stage || stageQuality.snapshot_tree !== fact.snapshot_tree) {
    throw new Error(`finding disposition evidence lacks an authenticated stage-quality subject: ${fact.subject}`);
  }
  const subjectFact = stageQuality.subject_fact;
  if (!subjectFact || !Array.isArray(subjectFact.disposition_items)
      || !Array.isArray(subjectFact.source_review_refs)
      || !Array.isArray(subjectFact.risk_acceptance_refs)) {
    throw new Error("finding disposition evidence is missing its source review and disposition bindings");
  }
  const reviews = subjectFact.source_review_refs.map((binding) => {
    if (!binding || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")
        || !binding.ref.startsWith("quality/reviews/results/")) {
      throw new Error("finding disposition source review binding is invalid");
    }
    const raw = task.readRecord(binding.ref);
    if (sha256(raw) !== binding.sha256) throw new Error(`finding disposition source review hash mismatch: ${binding.ref}`);
    const value = JSON.parse(raw);
    validateSchema("result", value);
    if (value.task_id !== task.identity.taskId || value.stage !== fact.stage || value.snapshot_tree !== fact.snapshot_tree) {
      throw new Error(`finding disposition source review is not current: ${binding.ref}`);
    }
    authenticateReviewEvidence(task, value);
    return Object.freeze({ ref: binding.ref, sha256: binding.sha256, value });
  });
  const riskIds = [];
  for (const binding of subjectFact.risk_acceptance_refs) {
    if (!binding || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")
        || typeof binding.finding_id !== "string") throw new Error("finding disposition risk acceptance binding is invalid");
    const raw = task.readRecord(binding.ref);
    if (sha256(raw) !== binding.sha256) throw new Error(`finding disposition risk acceptance hash mismatch: ${binding.ref}`);
    const acceptance = JSON.parse(raw);
    const review = reviews.find((candidate) => candidate.ref === acceptance.review_ref);
    if (!review) throw new Error(`finding disposition risk acceptance is not bound to a source review: ${binding.ref}`);
    const pause = deriveSeriousReviewPause({
      taskId: task.identity.taskId,
      stage: review.value.stage,
      reviewRef: review.ref,
      reviewHash: review.sha256,
      result: review.value,
      workflowRunId: acceptance.workflow_run_id,
    });
    validateRiskAcceptance({ acceptance, pause });
    if (acceptance.finding_id !== binding.finding_id) throw new Error(`finding disposition risk acceptance finding mismatch: ${binding.ref}`);
    riskIds.push(binding.finding_id);
  }
  const validation = validateReportableFindingDispositions({
    result: { findings: reviews.flatMap(({ value }) => canonicalReviewFindings(value)) },
    dispositions: subjectFact.disposition_items,
    authorizedRiskFindingIds: riskIds,
  });
  if (validation.missing_items.length > 0) {
    throw new Error(`finding disposition evidence is incomplete: ${validation.missing_items.join("; ")}`);
  }
}

function readQualityEvidenceBinding(task, binding, label) {
  if (!binding || typeof binding.ref !== "string" || !/^quality\/(?!.*\.\.)[^\s]+$/.test(binding.ref) || !HASH.test(binding.sha256 ?? "")) {
    throw new Error(`${label} binding is invalid`);
  }
  let raw;
  try {
    raw = task.readRecord(binding.ref);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`${label} is unavailable: missing ${binding.ref}`);
    throw error;
  }
  if (sha256(raw) !== binding.sha256) throw new Error(`${label} hash mismatch: ${binding.ref}`);
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error(`${label} is not canonical JSON: ${binding.ref}`); }
  return { raw, value };
}

function authenticateStageQualityLeaf(task, binding, context, seen = new Set(), depth = 0) {
  if (depth > 6) throw new Error("stage-quality evidence chain is too deep");
  const key = `${binding.ref}:${binding.sha256}`;
  if (seen.has(key)) throw new Error(`stage-quality evidence chain is cyclic: ${binding.ref}`);
  const nextSeen = new Set(seen).add(key);
  const { value } = readQualityEvidenceBinding(task, binding, "stage-quality evidence");
  const treeMatches = value?.snapshot_tree === context.snapshotTree
    || isMaterialOnlySnapshotDelta(task.manifest.target_repo_root, value?.snapshot_tree, context.snapshotTree, task.identity.taskId);
  const taskMatches = value?.task_id === task.identity.taskId;
  if (value?.schema_version === "workflowhub-receipt.v1") {
    if (!taskMatches || !treeMatches || typeof value.stage !== "string" || !value.producer
        || value.producer.stage !== value.stage || typeof value.producer.component !== "string"
        || typeof value.producer.version !== "string" || value.producer.version.trim() === "") {
      throw new Error(`stage-quality receipt provenance is invalid: ${binding.ref}`);
    }
    if (value.producer.component === "implementation") {
      validateCanonicalImplementationReceipt(value, {
        taskId: task.identity.taskId,
        snapshotTree: value.snapshot_tree,
        read: (ref) => task.readRecord(ref),
      });
    } else if (["build-code-test-capture", "verify-code-test-capture"].includes(value.producer.component)) {
      validateCanonicalFullTestReceipt(value, {
        taskId: task.identity.taskId,
        snapshotTree: value.snapshot_tree,
        requirePassed: context.status === "passed",
      });
      const output = task.readRecord(value.output_ref);
      if (sha256(output) !== value.output_hash) throw new Error(`stage-quality test output hash mismatch: ${value.output_ref}`);
    } else if (value.producer.component === "evidence") {
      if (!Array.isArray(value.refs) || value.refs.length === 0) throw new Error(`stage-quality evidence receipt refs are invalid: ${binding.ref}`);
      for (const nested of value.refs) authenticateStageQualityLeaf(task, nested, context, nextSeen, depth + 1);
    } else if (value.producer.component === "verification") {
      if (!Array.isArray(value.items) || value.items.length === 0) throw new Error(`stage-quality verification receipt items are invalid: ${binding.ref}`);
      for (const item of value.items) {
        if (!item || typeof item !== "object" || !Array.isArray(item.evidence_refs)) throw new Error(`verification evidence item is invalid: ${binding.ref}`);
        if (item.status === "not_applicable") continue;
        for (const nested of item.evidence_refs) {
          authenticateStageQualityLeaf(task, nested, { ...context, status: item.status === "pass" ? "passed" : "missing" }, nextSeen, depth + 1);
        }
      }
    } else {
      throw new Error(`unsupported stage-quality receipt producer: ${value.producer.component}`);
    }
    return;
  }
  if (value?.schema_version === "acceptance-evidence.v1") {
    const acceptance = validateAcceptanceEvidence(value, `nested ${binding.ref}`);
    if (!treeMatches || (context.status === "passed" && acceptance.result !== "pass")) throw new Error(`nested acceptance evidence is not current and passing: ${binding.ref}`);
    for (const nested of acceptance.refs) authenticateStageQualityLeaf(task, nested, {
      ...context,
      subject: acceptance.acceptance_criterion_id,
      status: acceptance.result === "pass" ? "passed" : "missing",
    }, nextSeen, depth + 1);
    return;
  }
  if (value?.schema_version === "workflowhub-verification-test-proof.v1") {
    if (!taskMatches || value.stage !== "verify-code" || !treeMatches || value.outcome !== "passed"
        || typeof value.test_receipt_ref !== "string" || !HASH.test(value.test_receipt_hash ?? "")) {
      throw new Error(`verification test proof provenance is invalid: ${binding.ref}`);
    }
    authenticateStageQualityLeaf(task, { ref: value.test_receipt_ref, sha256: value.test_receipt_hash }, { ...context, status: "passed" }, nextSeen, depth + 1);
    return;
  }
  if (value?.schema_version === "workflowhub-verification-material-proof.v1") {
    if (!taskMatches || value.stage !== "verify-code" || !treeMatches
        || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
        || !value.materials || Object.keys(value.materials).sort().join(",") !== "decision-log.md,plan.md,spec.md,tasks.md"
        || Object.values(value.materials).some((digest) => !HASH.test(digest ?? ""))) {
      throw new Error(`verification material proof provenance is invalid: ${binding.ref}`);
    }
    return;
  }
  // Review results historically expose `version`, while stage-quality leaves
  // use `schema_version`. Accept only the canonical result after schema
  // validation; a marker alone is not review provenance.
  if (value?.version === "wh-review-result.v1") {
    if (!taskMatches || !treeMatches || (value.stage !== context.stage && !(context.stage === "verify-code" && value.stage === "build-code"))) {
      throw new Error(`nested review provenance is invalid: ${binding.ref}`);
    }
    validateSchema("result", value);
    authenticateReviewEvidence(task, value);
    return;
  }
  if (value?.schema_version === "wh-review-attempt.v1") {
    validateSchema("attempt", value);
    if (!taskMatches || !treeMatches || value.terminal_status !== "unavailable" || context.status === "passed") {
      throw new Error(`nested unavailable review provenance is invalid: ${binding.ref}`);
    }
    return;
  }
  if (isHumanConfirmationVersion(value)) {
    if (!isHumanConfirmationVersion(value, { current: true })) {
      // v1 is readable historical evidence, but it has no subject/material/
      // snapshot provenance and cannot satisfy a current passing close fact.
      validateHumanConfirmation(value, {
        taskId: task.identity.taskId,
        stage: context.stage,
        subject: value.attempt_ref,
        requireAccepted: context.status === "passed",
      });
      if (context.status === "passed") throw new Error(`legacy human confirmation v1 cannot satisfy current evidence: ${binding.ref}`);
      return;
    }
    if (!treeMatches) throw new Error(`nested human confirmation is stale: ${binding.ref}`);
    validateHumanConfirmation(value, {
      taskId: task.identity.taskId,
      stage: context.stage,
      requireAccepted: context.status === "passed",
      requireSubjectRef: true,
    });
    return;
  }
  throw new Error(`unsupported stage-quality evidence leaf: ${binding.ref}`);
}

function authenticateStageQualityEvidence(task, fact, stageQuality, nestedValues) {
  const allowed = new Set(["schema_version", "task_id", "stage", "subject", "status", "snapshot_tree", "subject_fact"]);
  if (!stageQuality || Object.keys(stageQuality).some((key) => !allowed.has(key))
      || stageQuality.schema_version !== "stage-quality-evidence.v1"
      || stageQuality.task_id !== task.identity.taskId
      || stageQuality.stage !== fact.stage
      || stageQuality.subject !== fact.subject
      || stageQuality.status !== fact.status
      || stageQuality.snapshot_tree !== fact.snapshot_tree) {
    throw new Error(`acceptance evidence nested stage-quality subject is not bound to the current fact: ${fact.subject}`);
  }
  const subjectFact = stageQuality.subject_fact;
  if (!subjectFact || typeof subjectFact !== "object" || Array.isArray(subjectFact)
      || subjectFact.status !== fact.status
      || typeof subjectFact.detail !== "string" || subjectFact.detail.trim() === ""
      || !Array.isArray(subjectFact.evidence_refs)) {
    throw new Error(`stage-quality subject fact is incomplete: ${fact.subject}`);
  }
  const subjectAllowed = new Set(["status", "detail", "evidence_refs", "disposition_items", "source_review_refs", "risk_acceptance_refs"]);
  if (Object.keys(subjectFact).some((key) => !subjectAllowed.has(key))) throw new Error(`stage-quality subject fact has unknown fields: ${fact.subject}`);
  if (fact.subject !== "finding_dispositions" && fact.status === "passed" && subjectFact.evidence_refs.length === 0) {
    throw new Error(`passed stage-quality subject has no underlying evidence: ${fact.subject}`);
  }
  for (const binding of subjectFact.evidence_refs) authenticateStageQualityLeaf(task, binding, {
    stage: fact.stage,
    subject: fact.subject,
    snapshotTree: fact.snapshot_tree,
    status: fact.status,
  });
  if (fact.subject === "finding_dispositions" && fact.status === "passed") authenticateFindingDispositionEvidence(task, fact, nestedValues);
}

function currentQualityValue(task, ref) {
  try {
    const raw = task.readRecord(ref);
    const value = JSON.parse(raw);
    if (value?.schema_version !== "quality-fact.v1"
        || value.task_id !== task.identity.taskId
        || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
        || !/^[a-f0-9]{40,64}$/i.test(value.snapshot_tree ?? "")
        || !["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(value.stage)
        || !["test", "review", "acceptance_criterion", "confirmation"].includes(value.kind)
        || !["passed", "failed", "recorded", "unavailable", "missing"].includes(value.status)
        || typeof value.subject !== "string" || value.subject.trim() === ""
        || !Array.isArray(value.evidence) || value.evidence.length === 0
        || value.evidence.some((entry) => !entry || typeof entry.ref !== "string" || entry.ref.trim() === ""
          || !/^quality\/[^/].+$/.test(entry.ref) || entry.ref.includes("..")
          || !HASH.test(entry.sha256 ?? "")
          || entry.evidence_type !== ({
            test: "test_receipt",
            review: "review_result",
            acceptance_criterion: "acceptance_evidence",
            confirmation: "human_confirmation",
          })[value.kind])
        || !Number.isFinite(Date.parse(value.recorded_at))) {
      const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} has invalid quality fact fields`);
      invalid.code = "QUALITY_FACT_INVALID";
      throw invalid;
    }
    const digest = qualityFactDigest(value);
    if (ref !== `quality/facts/${digest}.json` || value.fact_id !== `quality-${digest}`) {
      const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} has an invalid digest binding`);
      invalid.code = "QUALITY_FACT_INVALID";
      throw invalid;
    }
    return value;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    if (error?.code === "QUALITY_FACT_INVALID") throw error;
    const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} is unreadable: ${error?.message ?? error}`);
    invalid.code = "QUALITY_FACT_INVALID";
    throw invalid;
  }
}

function authenticatedQualityEvidence(task, fact) {
  const evidence = fact?.evidence ?? [];
  for (const entry of evidence) {
    const raw = task.readRecord(entry.ref);
    if (sha256(raw) !== entry.sha256) throw new Error(`quality fact evidence hash mismatch: ${entry.ref}`);
    let value;
    try { value = JSON.parse(raw); } catch { throw new Error(`quality fact evidence is invalid JSON: ${entry.ref}`); }
    // Stage publication deliberately keeps an unavailable/missing quality
    // fact as a canonical disclosure record. It is not a review result and
    // must never satisfy a close predicate, but close must be able to read it
    // and report the real missing fact instead of misclassifying it as corrupt
    // review evidence.
    if (value?.schema_version === "stage-quality-missing.v1") {
      if (!new Set(["missing", "unavailable"]).has(fact.status)
          || value.task_id !== task.identity.taskId
          || value.stage !== fact.stage
          || value.subject !== fact.subject
          || value.status !== fact.status
          || value.snapshot_tree !== fact.snapshot_tree
          || typeof value.reason !== "string" || value.reason.trim() === "") {
        throw new Error(`stage-quality missing evidence is not bound to the current fact: ${entry.ref}`);
      }
      continue;
    }
    if (fact.kind === "review") {
      const schema = value?.version === "wh-review-result.v1" ? "result" : value?.version === "wh-review-attempt.v1" ? "attempt" : null;
      if (schema === null) throw new Error(`review evidence is not a canonical wh-review result or attempt: ${entry.ref}`);
      validateSchema(schema, value);
      // The verify-code fact `same_build_integration_review` intentionally
      // points at the build-code integration review produced for the same
      // snapshot. Keep this cross-stage binding identical to freshness.mjs;
      // mini-task implementation reviews use the same trusted exception.
      const crossStageReview = fact.stage === "verify-code"
        && value.stage === "build-code"
        && (fact.subject === "same_build_integration_review"
          || value.review_kind === "mini_task.implementation");
      if (value.task_id !== task.identity.taskId
          || (value.stage !== fact.stage && !crossStageReview)
          || value.snapshot_tree !== fact.snapshot_tree) {
        throw new Error(`review evidence is not bound to the current task/stage/snapshot: ${entry.ref}`);
      }
      const reviewKind = value.review_kind ?? null;
      const subjectMatches = fact.subject === "code_review"
        ? value.stage === "verify-code"
          && reviewKind === null
          && value.subject_kind === "worktree"
          && value.phase_id === null
        : fact.subject === "same_build_integration_review"
        ? value.stage === "build-code"
          && reviewKind === null
          && value.subject_kind === "worktree"
          && value.phase_id === null
          && value.review_scope === "integration"
        : fact.subject === "integration_review"
          ? reviewKind === null
            && value.subject_kind === "worktree"
            && value.phase_id === null
            && value.review_scope === "integration"
          : reviewKind === "mini_task.implementation"
            ? value.stage === "build-code"
              && value.subject_kind === "phase"
              && value.phase_id === "mini-task-implementation"
              && value.review_scope === "phase"
            : reviewKind === null
              && value.subject_kind === "worktree"
              && value.phase_id === null;
      if (!subjectMatches) throw new Error(`review evidence subject does not match quality fact: ${entry.ref}`);
      if (schema === "attempt") {
        if (fact.status !== "unavailable" || value.terminal_status !== "unavailable") {
          throw new Error(`review attempt evidence must be an unavailable terminal fact: ${entry.ref}`);
        }
      } else {
        authenticateReviewEvidence(task, value);
        if (fact.stage === "verify-code" && fact.subject === "code_review"
            && canonicalReviewFindings(value).some(isActionableSeriousFinding)) {
          throw new Error(`verify-code code_review has actionable serious findings: ${fact.ref}`);
        }
      }
    } else if (fact.kind === "test") {
      const receiptStage = value?.stage;
      const expectedProducerComponent = receiptStage === "build-code"
        ? "build-code-test-capture"
        : receiptStage === "verify-code"
          ? "verify-code-test-capture"
          : undefined;
      if (receiptStage !== fact.stage || expectedProducerComponent === undefined) {
        throw new Error(`test evidence stage is not bound to the quality fact: ${entry.ref}`);
      }
      validateCanonicalTestReceipt(value, {
        taskId: task.identity.taskId,
        stage: receiptStage,
        snapshotTree: fact.snapshot_tree,
        expectedProducerComponent,
        requirePassed: fact.status === "passed",
      });
      const output = task.readRecord(value.output_ref);
      if (sha256(output) !== value.output_hash) throw new Error(`test evidence output hash mismatch: ${value.output_ref}`);
    } else if (fact.kind === "acceptance_criterion") {
      if (value?.schema_version === "workflowhub-mini-task-implementation-evidence.v1") {
        if (value.task_id !== task.identity.taskId || value.snapshot_tree !== fact.snapshot_tree
            || !value.test_receipt || !value.implementation_review || !value.user_result || !value.ac_trace) {
          throw new Error(`mini-task acceptance evidence is not bound to the current task/snapshot: ${entry.ref}`);
        }
        const readBound = (binding, label) => {
          if (!binding || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")) throw new Error(`${label} binding is invalid: ${entry.ref}`);
          const nestedRaw = task.readRecord(binding.ref);
          if (sha256(nestedRaw) !== binding.sha256) throw new Error(`${label} hash mismatch: ${binding.ref}`);
          return JSON.parse(nestedRaw);
        };
        const testReceipt = readBound(value.test_receipt, "mini-task test receipt");
        // A failed mini-task focused test is a real quality fact, not a
        // malformed receipt. Preserve that fact so the mini-task boundary can
        // report the concrete failure and keep delivery incomplete.
        validateCanonicalTestReceipt(testReceipt, {
          taskId: task.identity.taskId,
          stage: testReceipt.stage,
          snapshotTree: fact.snapshot_tree,
          expectedProducerComponent: "mini-task-focused-tests",
          // The packet is also referenced by the acceptance-criteria and
          // exception facts. Those facts describe whether the mini-task is
          // deliverable; they do not change a failed focused-test receipt
          // into malformed evidence. The separate full_tests_fresh fact and
          // the mini-task close assertion keep the delivery incomplete.
          requirePassed: false,
        });
        const testOutput = task.readRecord(testReceipt.output_ref);
        if (sha256(testOutput) !== testReceipt.output_hash) throw new Error(`mini-task test output hash mismatch: ${testReceipt.output_ref}`);
        const review = readBound(value.implementation_review, "mini-task implementation review");
        const reviewSchema = review?.version === "wh-review-result.v1" ? "result" : review?.version === "wh-review-attempt.v1" ? "attempt" : null;
        if (reviewSchema === null) throw new Error(`mini-task implementation review is not canonical: ${entry.ref}`);
        validateSchema(reviewSchema, review);
        if (review.task_id !== task.identity.taskId || review.review_kind !== "mini_task.implementation" || review.snapshot_tree !== fact.snapshot_tree) {
          throw new Error(`mini-task implementation review is not current: ${entry.ref}`);
        }
        if (reviewSchema === "result") authenticateReviewEvidence(task, review);
        else if (fact.status === "passed") throw new Error(`passed mini-task independent_review requires a semantic implementation review result: ${entry.ref}`);
        const userResult = readBound(value.user_result, "mini-task user result");
        if (userResult.schema_version !== "workflowhub-mini-task-user-result.v1"
            || userResult.task_id !== task.identity.taskId || userResult.snapshot_tree !== fact.snapshot_tree
            || userResult.status !== "verified") throw new Error(`mini-task user result is not current and verified: ${entry.ref}`);
        if (userResult.evidence_type !== "test_receipt"
            || userResult.evidence_ref !== value.test_receipt.ref
            || userResult.evidence_hash !== value.test_receipt.sha256) {
          throw new Error(`mini-task user result evidence is not bound to its focused test receipt: ${entry.ref}`);
        }
        const userReceiptRaw = task.readRecord(userResult.evidence_ref);
        if (sha256(userReceiptRaw) !== userResult.evidence_hash) {
          throw new Error(`mini-task user result evidence hash mismatch: ${entry.ref}`);
        }
        const userReceipt = JSON.parse(userReceiptRaw);
        validateCanonicalFullTestReceipt(userReceipt, {
          taskId: task.identity.taskId,
          snapshotTree: fact.snapshot_tree,
          requirePassed: false,
          allowMiniTaskFocused: true,
        });
        const userReceiptOutput = task.readRecord(userReceipt.output_ref);
        if (sha256(userReceiptOutput) !== userReceipt.output_hash) {
          throw new Error(`mini-task user result evidence output hash mismatch: ${entry.ref}`);
        }
        validateMiniTaskAcTrace(value.ac_trace, {
          taskId: task.identity.taskId,
          snapshotTree: fact.snapshot_tree,
          receiptRef: value.test_receipt.ref,
          receiptHash: value.test_receipt.sha256,
          read: (ref) => task.readRecord(ref),
        });
      } else {
        const acceptance = validateAcceptanceEvidence(value, `acceptance evidence ${entry.ref}`);
        if (fact.status === "passed" && acceptance.result !== "pass") {
          throw new Error(`passed acceptance fact is bound to a non-pass result: ${entry.ref}`);
        }
        const acceptanceTreeMatches = acceptance.snapshot_tree === fact.snapshot_tree
          || isMaterialOnlySnapshotDelta(task.manifest.target_repo_root, acceptance.snapshot_tree, fact.snapshot_tree, task.identity.taskId);
        if (!acceptanceTreeMatches || acceptance.acceptance_criterion_id !== fact.subject) {
          throw new Error(`acceptance evidence is not bound to the current subject/snapshot: ${entry.ref}`);
        }
        const nestedValues = [];
        for (const nested of acceptance.refs) {
          const nestedRaw = task.readRecord(nested.ref);
          if (sha256(nestedRaw) !== nested.sha256) throw new Error(`acceptance evidence nested hash mismatch: ${nested.ref}`);
          try { nestedValues.push(JSON.parse(nestedRaw)); }
          catch { throw new Error(`acceptance evidence nested record is invalid JSON: ${nested.ref}`); }
        }
        const stageQuality = nestedValues.find((nested) => nested?.schema_version === "stage-quality-evidence.v1");
        authenticateStageQualityEvidence(task, fact, stageQuality, nestedValues);
      }
    } else if (fact.kind === "confirmation") {
      if (fact.stage !== "verify-code") throw new Error(`human confirmation quality fact must target verify-code: ${entry.ref}`);
      validateHumanConfirmation(value, {
        taskId: task.identity.taskId,
        stage: fact.stage,
        requireAccepted: true,
        requireSubjectRef: true,
      });
      // The shared validator still accepts the legacy v1 interaction record
      // for older public callers. Formal delivery close only consumes the
      // current v2 verify-code confirmation, so keep that policy in this one
      // branch instead of validating the same evidence twice below.
      if (!isHumanConfirmationVersion(value, { current: true })
          || value.stage !== "verify-code"
          || value.snapshot_tree !== fact.snapshot_tree) {
        throw new Error(`human confirmation is not an accepted current verify-code confirmation: ${entry.ref}`);
      }
    } else {
      throw new Error(`unsupported quality fact kind: ${fact.kind}`);
    }
  }
  return fact;
}

function unavailableVerifySnapshotCommit(reason) {
  const error = new Error(`verify-code test receipt snapshot_commit is unavailable${reason ? `: ${reason}` : ""}`);
  error.code = "MATERIAL_INCOMPLETE";
  return error;
}

function authenticatedTestSnapshotCommit(task, fact, { currentSnapshotTree = fact?.snapshot_tree, sourceDigest = null, allowMiniTaskFocused = false } = {}) {
  const evidence = Array.isArray(fact?.evidence)
    ? fact.evidence.find((entry) => entry?.evidence_type === "test_receipt")
    : null;
  if (!evidence || typeof evidence.ref !== "string" || !HASH.test(evidence.sha256 ?? "")) {
    throw unavailableVerifySnapshotCommit("test receipt evidence is missing");
  }
  let raw;
  try { raw = task.readRecord(evidence.ref); }
  catch (error) {
    if (error?.code === "ENOENT") throw unavailableVerifySnapshotCommit(`missing ${evidence.ref}`);
    throw error;
  }
  if (sha256(raw) !== evidence.sha256) throw unavailableVerifySnapshotCommit(`hash mismatch for ${evidence.ref}`);
  let receipt;
  try { receipt = JSON.parse(raw); }
  catch { throw unavailableVerifySnapshotCommit(`invalid JSON in ${evidence.ref}`); }
  try {
    validateCanonicalFullTestReceipt(receipt, {
      taskId: task.identity.taskId,
      snapshotTree: receipt?.snapshot_tree,
      requirePassed: fact.status === "passed",
      allowMiniTaskFocused,
    });
    const output = task.readRecord(receipt.output_ref);
    if (sha256(output) !== receipt.output_hash) throw new Error(`output hash mismatch for ${receipt.output_ref}`);
  } catch (error) {
    throw unavailableVerifySnapshotCommit(`test receipt is not an authenticated passing record: ${error.message}`);
  }
  const receiptTreeMatchesCurrent = receipt?.snapshot_tree === currentSnapshotTree;
  const receiptStage = receipt?.stage;
  const crossStageReuse = receiptStage === "build-code";
  if (receipt?.schema_version !== "workflowhub-receipt.v1"
      || receipt.task_id !== task.identity.taskId
      || (receiptStage !== "verify-code" && !crossStageReuse)
      || receipt.snapshot_tree !== fact.snapshot_tree && !receiptTreeMatchesCurrent
      || (sourceDigest !== null && receipt.source_digest !== sourceDigest)
      || !/^[a-f0-9]{40,64}$/i.test(receipt.snapshot_head ?? "")
      || !/^[a-f0-9]{40,64}$/i.test(receipt.snapshot_tree ?? "")
      || !/^[a-f0-9]{40,64}$/i.test(receipt.snapshot_commit ?? "")) {
    throw unavailableVerifySnapshotCommit(`provenance mismatch for ${evidence.ref}`);
  }
  const root = task.manifest.target_repo_root;
  const tree = gitResult(root, ["rev-parse", `${receipt.snapshot_commit}^{tree}`]);
  const commit = receipt.snapshot_commit.toLowerCase();
  const head = receipt.snapshot_head.toLowerCase();
  const parents = gitResult(root, ["rev-list", "--parents", "-n", "1", commit]);
  const parentList = parents.ok ? parents.stdout.split(/\s+/).filter(Boolean).slice(1) : [];
  const isSyntheticDirtySnapshot = commit !== head;
  if (!tree.ok
      || tree.stdout.toLowerCase() !== receipt.snapshot_tree.toLowerCase()
      || !parents.ok
      || (isSyntheticDirtySnapshot && (parentList.length !== 1 || parentList[0].toLowerCase() !== head))
      || (!isSyntheticDirtySnapshot && parentList.length > 1)
  ) {
    throw unavailableVerifySnapshotCommit(`snapshot commit does not bind its tree and parent for ${evidence.ref}`);
  }
  return commit;
}

function factMatchesExpected(value, expected, root, taskId) {
  // A current close fact must bind to the exact current snapshot. Historical
  // compatibility for material or execution-only writebacks is read-only
  // diagnostic behavior and cannot satisfy a vNext completion predicate.
  const treeMatches = expected.snapshotTree === undefined || value.snapshot_tree === expected.snapshotTree;
  const materialMatches = expected.materialRevision === undefined
    || value.material_revision === expected.materialRevision;
  return treeMatches && materialMatches;
}

function deriveMiniReviewStatus(task, miniReview) {
  if (miniReview.value.status !== "recorded") return "unavailable";
  const firstEvidence = miniReview.value.evidence?.[0];
  const first = readQualityEvidenceBinding(task, firstEvidence, "mini-task review evidence").value;
  let result = first;
  if (first?.schema_version === "workflowhub-mini-task-implementation-evidence.v1") {
    if (first.task_id !== task.identity.taskId || first.snapshot_tree !== miniReview.value.snapshot_tree) {
      throw new Error("mini-task implementation review packet is not bound to the current snapshot");
    }
    result = readQualityEvidenceBinding(task, first.implementation_review, "mini-task implementation review").value;
  }
  if (result?.version !== "wh-review-result.v1"
      || result.task_id !== task.identity.taskId
      || result.snapshot_tree !== miniReview.value.snapshot_tree) {
    throw new Error("mini-task review evidence is not a canonical current review result");
  }
  validateSchema("result", result);
  authenticateReviewEvidence(task, result);
  return canonicalReviewFindings(result).some(isActionableSeriousFinding) ? "findings" : "clean";
}

function currentVerifyFacts(task, expected = {}) {
  if (expected.allowMiniTaskFocused && typeof task.listCanonicalMiniTaskQualityEvidenceRefs === "function") {
    // Mini-task quality is a delivery-local intent.  It is authenticated here
    // for the legacy close consumer, but it is deliberately never projected
    // into quality/facts or used by ordinary stage completion.
    for (const ref of task.listCanonicalQualityFactRefs()) currentQualityValue(task, ref);
    const miniValues = task.listCanonicalMiniTaskQualityEvidenceRefs().map((ref) => {
      const raw = task.readRecord(ref);
      const value = JSON.parse(raw);
      if (value?.schema_version !== "workflowhub-mini-task-quality-evidence.v1"
          || ref !== `quality/evidence/mini-task-quality/${sha256(raw)}.json`
          || value.task_id !== task.identity.taskId
          || !["build-code", "verify-code"].includes(value.stage)
          || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
          || !/^[a-f0-9]{40,64}$/i.test(value.snapshot_tree ?? "")
          || typeof value.kind !== "string"
          || typeof value.subject !== "string"
          || !Array.isArray(value.evidence)
          || value.evidence.length === 0) {
        throw new Error(`MINI_TASK_QUALITY_INVALID: ${ref} is not a bound mini-task quality intent`);
      }
      const expectedIntent = {
        mini_task_design_review: { stage: "build-code", kind: "review", statuses: new Set(["recorded", "unavailable"]) },
        mini_task_implementation_review: { stage: "build-code", kind: "review", statuses: new Set(["recorded", "unavailable"]) },
        independent_review: { stage: "verify-code", kind: "review", statuses: new Set(["recorded", "unavailable"]) },
        full_tests_fresh: { stage: "verify-code", kind: "test", statuses: new Set(["passed", "failed"]) },
        acceptance_criteria: { stage: "verify-code", kind: "acceptance_criterion", statuses: new Set(["passed", "missing"]) },
        finding_dispositions: { stage: "verify-code", kind: "acceptance_criterion", statuses: new Set(["passed", "missing"]) },
        exceptions: { stage: "verify-code", kind: "acceptance_criterion", statuses: new Set(["passed", "missing"]) },
        human_confirmation: { stage: "verify-code", kind: "confirmation", statuses: new Set(["passed", "failed", "missing"]) },
      }[value.subject];
      if (!expectedIntent || value.stage !== expectedIntent.stage || value.kind !== expectedIntent.kind || !expectedIntent.statuses.has(value.status)) {
        throw new Error(`MINI_TASK_QUALITY_INVALID: ${ref} has an invalid kind/status/stage for ${value.subject}`);
      }
      for (const [index, evidence] of value.evidence.entries()) {
        if (!evidence || typeof evidence.ref !== "string" || !/^quality\//.test(evidence.ref) || !HASH.test(evidence.sha256 ?? "")) {
          throw new Error(`MINI_TASK_QUALITY_INVALID: ${ref} evidence[${index}] is not canonical`);
        }
        if (sha256(task.readRecord(evidence.ref)) !== evidence.sha256) {
          throw new Error(`MINI_TASK_QUALITY_INVALID: ${ref} evidence[${index}] hash mismatch`);
        }
      }
      return { ref, value };
    }).filter(({ value }) => value.stage === "verify-code"
      || (value.stage === "build-code" && value.subject === "mini_task_implementation_review"))
      .filter(({ value }) => factMatchesExpected(value, expected, expected.worktreeRoot, task.identity.taskId));
    const bySubject = new Map();
    for (const item of miniValues) {
      const previous = bySubject.get(item.value.subject);
      if (previous) throw new Error(`mini-task quality intents conflict: ${item.value.subject}`);
      bySubject.set(item.value.subject, item);
    }
    const requiredSubjects = Object.keys(STAGE_PREDICATES["verify-code"]);
    // Mini-task intents are delivery-local. Never map their subjects into the
    // formal verify-code namespace, even when a caller forges a canonical
    // subject such as code_review or human_confirmation.
    const miniReview = bySubject.get("independent_review") ?? bySubject.get("mini_task_implementation_review");
    const miniConfirmation = bySubject.get("human_confirmation");
    const miniTests = bySubject.get("full_tests_fresh");
    const miniAcceptance = bySubject.get("acceptance_criteria");
    return Object.freeze({
      vnext: true,
      facts: {
        ...Object.fromEntries(requiredSubjects.map((subject) => [subject, null])),
        tests: miniTests
          ? { kind: miniTests.value.kind, snapshot_tree: miniTests.value.snapshot_tree, status: miniTests.value.status }
          : null,
        acceptance_criteria: miniAcceptance
          ? { kind: miniAcceptance.value.kind, snapshot_tree: miniAcceptance.value.snapshot_tree, status: miniAcceptance.value.status }
          : null,
        finding_dispositions: bySubject.get("finding_dispositions")
          ? { kind: bySubject.get("finding_dispositions").value.kind, snapshot_tree: bySubject.get("finding_dispositions").value.snapshot_tree, status: bySubject.get("finding_dispositions").value.status }
          : null,
        exceptions: bySubject.get("exceptions")
          ? { kind: bySubject.get("exceptions").value.kind, snapshot_tree: bySubject.get("exceptions").value.snapshot_tree, status: bySubject.get("exceptions").value.status }
          : null,
        mini_task_implementation_review: miniReview
          ? { kind: miniReview.value.kind, snapshot_tree: miniReview.value.snapshot_tree, status: miniReview.value.status, review_status: deriveMiniReviewStatus(task, miniReview) }
          : null,
        mini_task_human_confirmation: miniConfirmation
          ? { kind: miniConfirmation.value.kind, snapshot_tree: miniConfirmation.value.snapshot_tree, status: miniConfirmation.value.status }
          : null,
      },
    });
  }
  const relevantSubjects = new Set(Object.keys(STAGE_PREDICATES["verify-code"]));
  const allValues = task.listCanonicalQualityFactRefs()
    .map((ref) => {
      try {
        return { ref, value: currentQualityValue(task, ref) };
      } catch (error) {
        // Historical verify subjects are not part of the code-review close
        // contract. Preserve them for audit, but do not let their retired
        // evidence shape block a current code-review close.
        try {
          const value = JSON.parse(task.readRecord(ref));
          // Only an explicitly retired non-vNext record may be ignored here.
          // A malformed current quality-fact record must remain an integrity
          // error; otherwise close could silently discard corrupted facts.
          if (value?.stage === "verify-code" && !relevantSubjects.has(value.subject)) return { ref, value: null };
        } catch {
          // Keep the original integrity error for unreadable current facts.
        }
        throw error;
      }
    })
    .filter(({ value }) => value?.stage !== undefined);
  const currentValues = allValues
    .filter(({ value }) => factMatchesExpected(value, expected, expected.worktreeRoot, task.identity.taskId));
  const values = currentValues
    .filter(({ value }) => value?.stage === "verify-code"
    );
  const bySubject = new Map();
  for (const item of values) {
    const previous = bySubject.get(item.value.subject);
    if (!previous) {
      bySubject.set(item.value.subject, item);
      continue;
    }
    // Current duplicate facts are ambiguous. Close must share the same
    // conflict semantics as deriveStageCompletion; timestamp-based
    // latest-wins would silently bypass an unresolved quality conflict.
    throw new Error(`current verify-code quality facts conflict: ${item.value.subject}`);
  }
  const requiredSubjects = Object.keys(STAGE_PREDICATES["verify-code"]);
  const facts = Object.fromEntries(requiredSubjects.map((subject) => {
    // mini-task has one deliberately smaller review topic:
    // mini_task.implementation. It already publishes that immutable result as
    // verify-code/independent_review and its own close path performs the
    // stronger AC, focused-test, user-result, and finding-disposition checks.
    // Treat that existing fact as the required code_review only inside the
    // explicitly marked mini-task close mode. Ordinary delivery still needs a
    // real verify-code/code_review fact and cannot use this alias.
    const candidates = subject === "code_review" && expected.allowMiniTaskFocused
      ? ["code_review"]
      : [subject];
    const item = candidates.map((candidate) => bySubject.get(candidate)).find(Boolean);
    // `authenticatedQualityEvidence` validates the nested evidence bytes and
    // returns that evidence's parsed value. Close predicates, however, must
    // read the quality fact's own status/kind/snapshot identity. Mixing the
    // two shapes makes a valid review (`findings`/`clean`) look unlike the
    // fact status (`recorded`) and makes a human confirmation without a
    // `status` field look incomplete forever.
    return [subject, item ? { fact: item.value, evidence: authenticatedQualityEvidence(task, item.value) } : null];
  }));
  const incomplete = requiredSubjects.filter((subject) => {
    const fact = facts[subject]?.fact;
    if (!fact) return true;
    return subject === "code_review" ? fact.status !== "recorded" : fact.status !== "passed";
  });
  if (incomplete.length > 0 && !expected.allowMiniTaskFocused) {
    throw new Error(`current verify-code quality facts are incomplete: ${incomplete.join(", ")}`);
  }
  return Object.freeze({
    vnext: true,
    facts: {
      ...Object.fromEntries(requiredSubjects.map((subject) => {
        const fact = facts[subject]?.fact;
        return [subject, fact
          ? {
            kind: fact.kind,
            snapshot_tree: fact.snapshot_tree,
            status: fact.status,
            ...(fact.review_status === undefined ? {} : { review_status: fact.review_status }),
          }
          : null];
      })),
    },
  });
}

function currentMaterialRevision(task, worktreeRoot) {
  const artifacts = ArtifactDir.open(worktreeRoot, task);
  const values = CURRENT_MATERIAL_FILES.map((file) => [file, artifacts.read(file)]);
  return materialRevisionFromValues(values);
}

function currentDeliverySnapshotCommit(worktreeRoot, snapshot) {
  const headTree = gitResult(worktreeRoot, ["rev-parse", `${snapshot.head}^{tree}`]);
  return headTree.ok && headTree.stdout.toLowerCase() === snapshot.tree.toLowerCase()
    ? snapshot.head
    : snapshot.commit;
}

function currentWorkspaceBinding(task, kernel, delivery = null) {
  if (task.manifest.record_model !== "vnext-single-write") throw new Error("legacy delivery close is retired; use a vnext-single-write task");
  const expectedWorktree = resolve(dirname(task.manifest.target_repo_root), `${basename(task.manifest.target_repo_root)}-${task.identity.taskId}`);
  try {
    const workspace = openCurrentTaskWorkspace(task);
    return Object.freeze({
      taskId: task.identity.taskId,
      stage: "make-decision",
      worktreeRoot: workspace.worktreeRoot,
      baselineCommit: workspace.baselineCommit,
    });
  } catch (error) {
    if (existsSync(expectedWorktree)
        || !delivery
        || resolve(delivery.worktree_root ?? "") !== expectedWorktree
        || !/^[a-f0-9]{40}$/i.test(delivery.task_commit ?? "")) throw error;
    return Object.freeze({
      taskId: task.identity.taskId,
      stage: "make-decision",
      worktreeRoot: delivery.worktree_root,
      baselineCommit: delivery.task_commit,
    });
  }
}

function manualCleanupObservation(task, kernel) {
  try {
    const binding = currentWorkspaceBinding(task, kernel);
    const worktreeRoot = binding.worktreeRoot;
    if (typeof worktreeRoot === "string" && existsSync(worktreeRoot)) return inspectWorktreeCleanup(worktreeRoot);
    return Object.freeze({
      schema_version: "workflowhub-worktree-cleanup-scan.v1",
      status: "unavailable",
      worktree_root: worktreeRoot ?? null,
      reason: "worktree-removed",
    });
  } catch (error) {
    return Object.freeze({
      schema_version: "workflowhub-worktree-cleanup-scan.v1",
      status: "unavailable",
      worktree_root: null,
      reason: `cleanup-scan-unavailable:${error.message}`,
    });
  }
}

/**
 * Record a physically completed delivery whose quality/release risk was
 * explicitly accepted.
 *
 * This is intentionally distinct from task-close-completed.v1: it records the
 * real Git delivery without turning incomplete quality or product release into
 * a normal task completion. The caller must have already executed the same
 * plan-bound physical executors used by normal close.
 */
export function recordManualDeliveryClose({} = {}) {
  throw new Error("risk close is retired; use normal close with quality facts recorded separately");
}

export function closePlanHash(plan) { return sha256(canonical(plain(plan, "close plan"))); }

function validatePlan(plan, task) {
  plain(plan, "close plan");
  if (plan.schema_version !== "task-close-plan.v1") throw new TypeError("close plan schema_version must be task-close-plan.v1");
  if (plan.task_id !== task.identity.taskId) throw new Error("close plan task identity mismatch");
  if (!Array.isArray(plan.steps)) throw new TypeError("close plan steps must be an array");
  const seen = new Set();
  for (const [index, step] of plan.steps.entries()) {
    plain(step, `close plan step ${index}`);
    if (!STEP_ID.test(step.step_id ?? "")) throw new TypeError(`close plan step ${index} has an invalid step_id`);
    if (seen.has(step.step_id)) throw new Error(`duplicate close plan step_id: ${step.step_id}`);
    seen.add(step.step_id);
    if (typeof step.operation !== "string" || step.operation.trim() === "") throw new TypeError(`close plan step ${step.step_id} operation is required`);
  }
  // Canonicalization also rejects functions, undefined, class instances, and
  // other values whose meaning could change between confirmation and execution.
  canonical(plan);
  return plan;
}

function readOptional(task, path) {
  try { return task.readRecord(path); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

function createOrVerify(task, path, record, label) {
  const raw = `${JSON.stringify(record, null, 2)}\n`;
  const existing = readOptional(task, path);
  if (existing !== undefined) {
    if (existing !== raw) throw new Error(`${label} conflicts with immutable record: ${path}`);
    return record;
  }
  try { task.createRecordAtomic(path, raw); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (task.readRecord(path) !== raw) throw new Error(`${label} conflicts with immutable record: ${path}`);
  }
  return record;
}

function verifyFactsFreshForClose(acceptedVerify, worktreeRoot, taskId = null, currentSnapshotTree = null, repositoryRoot = null, closeMode = "ordinary") {
  if (acceptedVerify?.vnext !== true) {
    return Object.freeze({ current: false, reason: "legacy delivery close is retired; current verify-code quality facts are required" });
  }
  const requiredKinds = { ...STAGE_PREDICATES["verify-code"] };
  const requiredSubjects = Object.keys(requiredKinds);
  const required = requiredSubjects.map((subject) => {
    if (closeMode === "mini-task" && subject === "code_review") {
      return acceptedVerify?.facts?.mini_task_implementation_review;
    }
    if (closeMode === "mini-task" && subject === "human_confirmation") {
      return acceptedVerify?.facts?.mini_task_human_confirmation;
    }
    return acceptedVerify?.facts?.[subject === "full_tests_fresh" ? "tests" : subject];
  });
  const missing = requiredSubjects.filter((subject, index) => {
    const fact = required[index];
    const kind = requiredKinds[subject];
    return !fact || fact.kind !== kind || typeof fact.snapshot_tree !== "string" || fact.snapshot_tree === ""
      || !qualityPredicateSatisfied(fact, kind, closeMode === "mini-task"
        ? { stage: "verify-code", subject, review_status: fact.review_status }
        : {});
  });
  if (missing.length) {
    const state = existsSync(worktreeRoot) ? "current verify-code quality facts are incomplete" : "current verify-code quality facts are incomplete after worktree removal";
    return Object.freeze({
      current: false,
      reason: `${state}: ${missing.join(", ")}`,
    });
  }
  const snapshot = existsSync(worktreeRoot)
    ? captureExecutionSnapshot(worktreeRoot, taskId)
    : Object.freeze({ tree: currentSnapshotTree ?? required[0]?.snapshot_tree ?? null });
  // The verify-code quality review is the single independent review for the
  // final snapshot. Phase reviews remain immutable audit facts; requiring a
  // second build-code integration review here duplicated work without adding
  // a new acceptance question. The explicit close confirmation decides what
  // to do with the current verification conclusion.
  // Historical freshness helpers may explain execution/material writebacks,
  // but current close requires the exact snapshot that produced the facts.
  const stale = required.filter((fact) => fact?.snapshot_tree !== snapshot.tree);
  if (stale.length) {
    return Object.freeze({ current: false, reason: "current verify-code quality facts are stale relative to the Workspace", snapshot_tree: snapshot.tree, expected_trees: [...new Set(stale.map((fact) => fact.snapshot_tree))] });
  }
  return Object.freeze({ current: true, reason: "current", snapshot_tree: snapshot.tree });
}

/** Persist one immutable, plan-bound close decision. */
export function confirmClosePlan({ task: taskHandle, kernel: taskKernel, plan, outcome, replyText, stepSlug, now = () => new Date().toISOString() } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close confirmation TaskHandle/TaskKernel mismatch");
  validatePlan(plan, task);
  if (!new Set(["confirmed", "rejected", "timeout"]).has(outcome)) throw new TypeError("close confirmation outcome must be confirmed, rejected, or timeout");
  // A timeout is a boundary fact, not a user reply. Do not manufacture a
  // human-confirmation record to represent the absence of a response.
  if (outcome !== "timeout") {
    if (typeof replyText !== "string" || replyText.trim() === "") throw new TypeError("close confirmation replyText is required from the user");
    if (typeof stepSlug !== "string" || stepSlug.trim() === "") throw new TypeError("close confirmation stepSlug is required from the current step");
  }
  if (typeof now !== "function") throw new TypeError("close confirmation now must be a function");
  const planHash = closePlanHash(plan);
  const ref = `operations/close/confirmations/${planHash}/${randomUUID()}.json`;
  const human = outcome === "timeout"
    ? null
    : kernel.publishHumanConfirmation("verify-code", {
      decision: outcome === "confirmed" ? "accepted" : "rejected",
      subject_ref: `operations/close/plans/${planHash}/plan.json`,
      reply_text: replyText,
      step_slug: stepSlug,
    });
  const confirmation = {
    schema_version: "task-close-confirmation.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    outcome,
    human_confirmation_ref: human?.ref ?? null,
    human_confirmation_hash: human?.hash ?? null,
    confirmed_at: now(),
  };
  createOrVerify(task, ref, confirmation, "close confirmation");
  return Object.freeze({ ref, confirmation: Object.freeze(confirmation) });
}

function defaultDeliveryPaths(task) {
  const sourcePath = dirname(artifactReference(task.identity.taskId, "decision-log.md")).split(sep).join("/");
  const archivePath = sourcePath.replace(/^([^/]+)\//, "$1/archive/");
  return Object.freeze({ sourcePath, archivePath });
}

function deriveCurrentDeliveryInput(task, kernel, {
  remote = "origin",
  targetBranch,
  specSourcePath,
  specArchivePath,
} = {}) {
  const workspace = openCurrentTaskWorkspace(task);
  const worktree = resolve(workspace.worktreeRoot);
  const root = task.manifest.target_repo_root;
  const snapshot = captureExecutionSnapshot(worktree, task.identity.taskId);
  const defaults = defaultDeliveryPaths(task);
  return Object.freeze({
    remote,
    task_branch: git(worktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
    target_branch: targetBranch ?? git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
    task_commit: currentDeliverySnapshotCommit(worktree, snapshot),
    spec_source_path: specSourcePath ?? defaults.sourcePath,
    spec_archive_path: specArchivePath ?? defaults.archivePath,
  });
}

/**
 * Execute the one user-facing close action. The invocation itself is the
 * independent human authorization for the concrete frozen plan; operation
 * authorization records are generated internally for audit and retry safety.
 * Quality gaps become risk facts, while Git identity and physical boundaries
 * remain fail-loud.
 */
export async function closeDelivery({
  task: taskHandle,
  kernel: taskKernel,
  delivery,
  remote = "origin",
  targetBranch,
  specSourcePath,
  specArchivePath,
  replyText,
  stepSlug,
  now = () => new Date().toISOString(),
} = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  if (typeof now !== "function") throw new TypeError("close now must be a function");
  const existing = readOptional(task, "operations/close/completed.json");
  if (existing !== undefined) {
    const value = JSON.parse(existing);
    if (value?.schema_version !== "task-close-completed.v1" || value.task_id !== task.identity.taskId || value.status !== "completed") {
      throw new Error("close completion record is invalid");
    }
    return Object.freeze(value);
  }
  const requested = delivery ?? deriveCurrentDeliveryInput(task, kernel, {
    remote,
    targetBranch,
    specSourcePath,
    specArchivePath,
  });
  const prepared = prepareDeliveryClosePlan({
    task,
    kernel,
    delivery: requested,
    // Close is the single physical-delivery path. Quality gaps are recorded as
    // facts but never block the five actions.
  });
  const confirmed = confirmClosePlan({ task, kernel, plan: prepared.plan, outcome: "confirmed", replyText, stepSlug, now });
  const operations = new Set(DELIVERY_STEPS.map(([, operation]) => DELIVERY_AUTHORIZATIONS[operation]));
  for (const operation of operations) {
    kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmed.confirmation.human_confirmation_ref });
  }
  const executed = await executeClosePlan({
    task,
    kernel,
    plan: prepared.plan,
    closeConfirmationRef: confirmed.ref,
    executors: createDeliveryCloseExecutorRegistry({ task, kernel, plan: prepared.plan }),
    deferCompletionRecord: true,
    now,
  });
  const completion = {
    schema_version: "task-close-completed.v1",
    task_id: task.identity.taskId,
    plan_hash: prepared.plan_hash,
    status: "completed",
    close_mode: "normal",
    physical_state: structuredClone(executed.physical_state),
    completed_at: now(),
  };
  return task.withRecordLock("locks/close.execution.lock", () => {
    createOrVerify(task, "operations/close/completed.json", completion, "close completion");
    return Object.freeze(completion);
  });
}

function executorFor(executors, step) {
  if (!GOVERNED_EXECUTORS.has(executors)) throw new TypeError("governed close executor registry required");
  const executor = executors.executorFor(step);
  plain(executor, `close executor ${step.step_id}`);
  if (typeof executor.probe !== "function" || typeof executor.execute !== "function" || typeof executor.verify !== "function") throw new TypeError(`close executor ${step.step_id} requires probe, execute, and verify functions`);
  return executor;
}

async function probeSatisfied(executor, step, phase) {
  const observation = plain(await executor.probe(step), `close step ${step.step_id} ${phase} probe`);
  if (typeof observation.satisfied !== "boolean") throw new TypeError(`close step ${step.step_id} probe must return satisfied boolean`);
  if (observation.satisfied && executor.verify) {
    const verified = await executor.verify(observation, step);
    if (verified !== true) throw new Error(`close step ${step.step_id} physical state verification failed`);
  }
  return observation;
}

function completedRecord(task, planHash, step, observation, mode, now) {
  const physical = canonical(observation, `close step ${step.step_id} observation`);
  return {
    schema_version: "task-close-operation.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    step_id: step.step_id,
    operation: step.operation,
    action: step.step_id,
    status: "completed",
    completion_mode: mode,
    physical_state_hash: sha256(physical),
    physical_state: structuredClone(observation),
    evidence: {
      kind: "close_step_execution",
      source: `operations/close/plans/${planHash}/steps/${step.step_id}.json`,
      snapshot_tree: observation.snapshot_tree ?? null,
    },
    completed_at: now(),
  };
}

function git(cwd, args, { allowFailure = false } = {}) {
  const result = execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"] });
  return String(result).trim();
}

function gitResult(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { ok: result.status === 0, status: result.status, stdout: String(result.stdout ?? "").trim(), stderr: String(result.stderr ?? "").trim() };
}

function sourceWorktreeStatus(root) {
  // Do not use the trimmed `git()` helper here. Porcelain status reserves
  // the first two columns for the index/worktree state, so a leading space
  // is meaningful and must not be removed before parsing the path.
  const raw = String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })).trimEnd();
  return raw.split(/\r?\n/).filter(Boolean).filter((line) => {
    const paths = line.slice(3).split(" -> ").map((value) => value.trim().replace(/^"|"$/g, ""));
    return !paths.every((path) => EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix)));
  }).join("\n");
}

function unstagedSourcePaths(root) {
  const raw = String(execFileSync("git", ["diff", "--name-only", "-z"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }));
  return raw.split("\0").filter(Boolean).filter((path) => !EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix)));
}

function oid(value, label) {
  if (!/^[a-f0-9]{40}$/i.test(value ?? "")) throw new TypeError(`${label} must be a full commit OID`);
  return value.toLowerCase();
}

function repositoryPath(value, label) {
  if (typeof value !== "string" || value === "" || /[\0\r\n\t]/.test(value) || isAbsolute(value) || value.split("/").includes("..")) {
    throw new TypeError(`${label} must be a repository-relative path`);
  }
  return value;
}

function inside(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function createArchiveParent(worktree, archivePath) {
  const root = realpathSync(worktree);
  const parent = dirname(resolve(root, repositoryPath(archivePath, "delivery spec_archive_path")));
  if (!inside(root, parent)) throw new Error("spec archive parent escapes the task worktree");
  let cursor = root;
  for (const part of relative(root, parent).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    let stat;
    try { stat = lstatSync(cursor); }
    catch (error) { if (error?.code === "ENOENT") break; throw error; }
    if (stat.isSymbolicLink()) throw new Error("spec archive parent must not traverse symbolic links");
    if (!stat.isDirectory()) throw new Error("spec archive parent ancestor must be a directory");
  }
  mkdirSync(parent, { recursive: true });
  if (!inside(root, realpathSync(parent))) throw new Error("spec archive parent escapes the task worktree");
}

function treeEntry(root, commit, path) {
  const result = gitResult(root, ["ls-tree", "-z", commit, "--", path]);
  if (!result.ok || result.stdout === "") return null;
  const match = /^([0-7]{6}) (blob|tree) ([a-f0-9]{40})\t([^\0]+)\0?$/i.exec(result.stdout);
  if (!match || match[4] !== path) return null;
  return Object.freeze({ mode: match[1], type: match[2], oid: match[3].toLowerCase() });
}

function remoteOid(root, remote, branch) {
  const result = gitResult(root, ["ls-remote", "--exit-code", remote, `refs/heads/${branch}`]);
  if (!result.ok) {
    const exit = Number.isInteger(result.status) ? result.status : "unknown";
    throw new Error(`git ls-remote failed (exit ${exit}): ${result.stderr || "no error output"}`);
  }
  const value = result.stdout.split(/\s+/)[0]?.toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(value ?? "")) throw new Error("git ls-remote returned an invalid commit OID");
  return value;
}

function branchOid(root, branch) {
  const result = gitResult(root, ["rev-parse", "--verify", `refs/heads/${branch}`]);
  return result.ok && /^[a-f0-9]{40}$/i.test(result.stdout) ? result.stdout.toLowerCase() : null;
}

function exactDirectoryRenames(raw, source, archive) {
  const fields = raw.split("\0").filter(Boolean);
  if (fields.length === 0 || fields.length % 3 !== 0) return false;
  for (let index = 0; index < fields.length; index += 3) {
    const [status, from, to] = fields.slice(index, index + 3);
    if (status !== "R100" || !from.startsWith(`${source}/`) || to !== `${archive}/${from.slice(source.length + 1)}`) return false;
  }
  return true;
}

function archiveFacts(root, ref, delivery) {
  const contains = (ancestor, descendant) => Boolean(descendant) && gitResult(root, ["merge-base", "--is-ancestor", ancestor, descendant]).ok;
  if (!ref) return { commit: null, tree_preserved: false, only_renames: false };
  const log = gitResult(root, ["log", "-1", "--format=%H", ref, "--", delivery.spec_archive_path]);
  const commit = log.ok && /^[a-f0-9]{40}$/i.test(log.stdout) ? log.stdout.toLowerCase() : null;
  if (!commit) return { commit: null, tree_preserved: false, only_renames: false };
  const parent = gitResult(root, ["rev-parse", `${commit}^`]);
  const parentContainsTask = parent.ok && contains(delivery.task_commit, parent.stdout.toLowerCase());
  const source = treeEntry(root, delivery.task_commit, delivery.spec_source_path);
  const archive = treeEntry(root, commit, delivery.spec_archive_path);
  const treePreserved = parentContainsTask && source?.type === "tree" && archive?.type === "tree" && source.oid === archive.oid;
  const diff = gitResult(root, ["diff-tree", "--no-commit-id", "--name-status", "--find-renames=100%", "-r", "-z", `${commit}^`, commit]);
  const onlyRenames = treePreserved && diff.ok && exactDirectoryRenames(diff.stdout, delivery.spec_source_path, delivery.spec_archive_path);
  return { commit, tree_preserved: treePreserved, only_renames: onlyRenames };
}

function targetPreflight(delivery, expectedLocal = delivery.target_baseline) {
  const root = delivery.target_repo_root;
  if (gitResult(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout !== delivery.target_branch) throw new Error("target branch must be checked out in the target repository");
  const dirtySource = sourceWorktreeStatus(root);
  if (dirtySource !== "") throw new Error("target repository has uncommitted source changes; preserve them under their owning task before the authorized close merge");
  if (gitResult(root, ["rev-parse", "--verify", "MERGE_HEAD"]).ok) throw new Error("target repository has an unfinished merge");
  if (expectedLocal !== null && branchOid(root, delivery.target_branch) !== expectedLocal) throw new Error("local target baseline changed");
  if (remoteOid(root, delivery.remote, delivery.target_branch) !== delivery.remote_target_baseline) throw new Error("remote target baseline changed");
}

function plannedMergePreflight(delivery) {
  const tip = branchOid(delivery.target_repo_root, delivery.task_branch);
  if (!tip) throw new Error("task branch does not exist before merge");
  const result = gitResult(delivery.target_repo_root, ["merge-tree", "--write-tree", delivery.target_baseline, tip]);
  if (result.ok) return Object.freeze({ target_baseline: delivery.target_baseline, task_tip: tip, conflict: false });
  if (result.status === 1) throw new Error("planned merge has conflicts; run skills/resolving-merge-conflicts on the task branch, then retry close");
  throw new Error(`planned merge preflight failed: ${result.stderr || result.stdout || "git merge-tree failed"}`);
}

function validateDeliveryPlan(plan, task, kernel) {
  validatePlan(plan, task);
  if (kernel.task !== task) throw new Error("delivery close TaskHandle/TaskKernel mismatch");
  const delivery = plain(plan.delivery, "delivery close plan");
  const required = ["target_repo_root", "worktree_root", "task_branch", "target_branch", "remote", "task_commit", "spec_source_path", "spec_archive_path", "target_baseline", "remote_target_baseline", "merge_strategy"];
  if (required.some((key) => typeof delivery[key] !== "string" || delivery[key] === "")) throw new TypeError("delivery close plan is missing required fields");
  if (resolve(delivery.target_repo_root) !== task.manifest.target_repo_root) throw new Error("delivery close target repository mismatch");
  const effective = currentWorkspaceBinding(task, kernel, delivery);
  if (resolve(delivery.worktree_root) !== resolve(effective.worktreeRoot)) throw new Error("delivery close worktree does not match the authenticated effective Workspace");
  oid(delivery.task_commit, "delivery task_commit");
  oid(delivery.target_baseline, "delivery target_baseline");
  oid(delivery.remote_target_baseline, "delivery remote_target_baseline");
  if (delivery.merge_strategy !== "--no-ff --no-edit") throw new Error("delivery merge strategy must be --no-ff --no-edit");
  repositoryPath(delivery.spec_source_path, "delivery spec_source_path");
  repositoryPath(delivery.spec_archive_path, "delivery spec_archive_path");
  if (delivery.spec_source_path === delivery.spec_archive_path) throw new Error("delivery spec source and archive paths must differ");
  if (delivery.risk_close !== undefined) {
    const risk = plain(delivery.risk_close, "delivery risk close");
    if (risk.accepted !== true) throw new Error("delivery risk close must record accepted=true");
    if (typeof risk.reason !== "string" || risk.reason.trim() === "") throw new TypeError("delivery risk close reason is required");
    if (!Array.isArray(risk.deferred_items) || risk.deferred_items.some((item) => typeof item !== "string" || item.trim() === "")) {
      throw new TypeError("delivery risk close deferred_items must be an array of non-empty strings");
    }
    if (!Array.isArray(risk.quality_reasons) || risk.quality_reasons.some((item) => typeof item !== "string" || item.trim() === "")) {
      throw new TypeError("delivery risk close quality_reasons must be an array of non-empty strings");
    }
  }
  for (const branch of [delivery.task_branch, delivery.target_branch]) {
    if (!gitResult(delivery.target_repo_root, ["check-ref-format", "--branch", branch]).ok) throw new TypeError(`invalid Git branch: ${branch}`);
  }
  if (delivery.task_branch === delivery.target_branch) throw new Error("task branch and target branch must differ");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(delivery.remote)) throw new TypeError("delivery remote must be an explicit remote name");
  return delivery;
}

function closeConfirmation(task, planHash, ref) {
  const prefix = `operations/close/confirmations/${planHash}/`;
  if (typeof ref !== "string" || !ref.startsWith(prefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(ref)) {
    throw new TypeError("canonical plan-bound closeConfirmationRef is required");
  }
  const confirmation = plain(JSON.parse(task.readRecord(ref)), "close confirmation");
  const keys = new Set(["schema_version", "task_id", "plan_hash", "outcome", "human_confirmation_ref", "human_confirmation_hash", "confirmed_at"]);
  if (Object.keys(confirmation).some((key) => !keys.has(key))) throw new Error("close confirmation contains unknown fields");
  if (confirmation.schema_version !== "task-close-confirmation.v1" || confirmation.task_id !== task.identity.taskId || !Number.isFinite(Date.parse(confirmation.confirmed_at))) throw new Error("close confirmation identity is invalid");
  if (!HASH.test(confirmation.plan_hash ?? "") || confirmation.plan_hash !== planHash) throw new Error("close confirmation plan hash mismatch");
  if (!["confirmed", "rejected", "timeout"].includes(confirmation.outcome)) throw new Error("close confirmation outcome is invalid");
  if (confirmation.outcome === "timeout") {
    if (confirmation.human_confirmation_ref !== null || confirmation.human_confirmation_hash !== null) throw new Error("timeout close confirmation must not bind a human confirmation");
    return confirmation;
  }
  if (typeof confirmation.human_confirmation_ref !== "string" || !HASH.test(confirmation.human_confirmation_hash ?? "")) throw new Error("close confirmation must bind a human confirmation");
  const humanRaw = task.readRecord(confirmation.human_confirmation_ref);
  if (sha256(humanRaw) !== confirmation.human_confirmation_hash) throw new Error("close confirmation human confirmation hash mismatch");
  const human = JSON.parse(humanRaw);
  if (!isHumanConfirmationVersion(human, { current: true }) || human.task_id !== task.identity.taskId || human.subject_ref !== `operations/close/plans/${planHash}/plan.json`) throw new Error("close confirmation human confirmation is not bound to this plan");
  if (human.decision !== (confirmation.outcome === "confirmed" ? "accepted" : "rejected")) throw new Error("close confirmation human decision does not match its outcome");
  return confirmation;
}

const DELIVERY_STEPS = Object.freeze([
  ["commit-delivery", "commit-delivery"],
  ["merge-task-branch", "merge-task-branch"],
  ["archive-spec", "archive-spec"],
  ["push-target-branch", "push-target-branch"],
  ["cleanup", "cleanup"],
]);

const DELIVERY_AUTHORIZATIONS = Object.freeze({
  "commit-delivery": "commit",
  "merge-task-branch": "merge",
  "archive-spec": "archive",
  "push-target-branch": "push",
  "cleanup": "cleanup",
});

/** Freeze the concrete close actions before asking for their independent authorization. */
export function prepareDeliveryClosePlan({
  task: taskHandle,
  kernel: taskKernel,
  delivery: requested,
  allowMiniTaskFocused = false,
} = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("delivery close TaskHandle/TaskKernel mismatch");
  const input = plain(requested, "delivery close input");
  if (input.risk_close !== undefined) throw new Error("risk close is retired");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(input.remote ?? "")) throw new TypeError("delivery remote must be an explicit remote name");
  const root = task.manifest.target_repo_root;
  if (git(root, ["rev-parse", "--show-toplevel"]) !== root) throw new Error("task target repository must be the Git toplevel");
  if (task.manifest.record_model !== "vnext-single-write") throw new Error("legacy delivery close is retired; use a vnext-single-write task");
  const workspace = openCurrentTaskWorkspace(task);
  const worktree = resolve(workspace.worktreeRoot);
  if (!existsSync(worktree)) throw new Error("accepted task worktree does not exist");
  const currentSnapshot = captureExecutionSnapshot(worktree, task.identity.taskId);
  const deliverySnapshotCommit = currentDeliverySnapshotCommit(worktree, currentSnapshot);
  const materialRevision = currentMaterialRevision(task, worktree);
  const materialArtifacts = ArtifactDir.open(worktree, task);
  const materialValues = Object.fromEntries(CURRENT_MATERIAL_FILES.map((name) => [name, materialArtifacts.read(name)]));
  const qualityReasons = [];
  let acceptedVerify;
  try {
    acceptedVerify = currentVerifyFacts(task, {
      snapshotTree: currentSnapshot.tree,
      materialRevision,
      snapshotCommit: deliverySnapshotCommit,
      sourceDigest: currentSnapshot.source_digest,
      worktreeRoot: worktree,
      allowMiniTaskFocused,
    });
  } catch (error) {
    qualityReasons.push(`verify-code: ${error.message}`);
  }
  let productRelease = null;
  if (!allowMiniTaskFocused) {
    try {
      productRelease = deriveCurrentProductRelease({
        task_id: task.identity.taskId,
        read: task.readRecord,
        refs: task.listCanonicalQualityFactRefs(),
        snapshot_tree: currentSnapshot.tree,
        material_revision: materialRevision,
        material_scope_revisions: stageMaterialScopeRevisions(materialValues),
        snapshot_root: worktree,
        expected_acceptance_ids: activeAcceptanceCriterionIds(materialArtifacts.read("spec.md")),
        evaluate_freshness: evaluateFactFreshness,
      });
    } catch (error) {
      qualityReasons.push(`product-release: ${error.message}`);
    }
  }
  if (productRelease && productRelease.status !== "released") {
    qualityReasons.push(`product-release: ${productRelease.reasons.join(", ")}`);
  }
  let verifyFreshness = { current: false, reason: "verify-code facts are unavailable" };
  if (acceptedVerify) verifyFreshness = verifyFactsFreshForClose(
    acceptedVerify,
    worktree,
    task.identity.taskId,
    currentSnapshot.tree,
    null,
    allowMiniTaskFocused ? "mini-task" : "ordinary",
  );
  if (!verifyFreshness.current) {
    qualityReasons.push(`verify-code freshness: ${verifyFreshness.reason}`);
  }
  if (git(worktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]) !== input.task_branch) throw new Error("task branch does not match the accepted Workspace");
  const common = (cwd) => resolve(cwd, git(cwd, ["rev-parse", "--git-common-dir"]));
  if (common(root) !== common(worktree)) throw new Error("task worktree is not registered in the target repository");
  const taskCommit = oid(input.task_commit, "delivery task_commit");
  if (taskCommit !== deliverySnapshotCommit) {
    throw new Error(`delivery task_commit does not match the current verified Workspace snapshot (${taskCommit} !== ${deliverySnapshotCommit})`);
  }
  const branchTip = gitResult(root, ["rev-parse", "--verify", `refs/heads/${input.task_branch}`]);
  if (!branchTip.ok) throw new Error("task branch does not exist");
  const tip = branchTip.stdout.toLowerCase();
  if (tip === taskCommit) {
    if (sourceWorktreeStatus(worktree) !== "") throw new Error("published task commit requires a clean source worktree");
  } else {
    const parent = gitResult(root, ["rev-parse", `${taskCommit}^`]);
    const taskTree = gitResult(root, ["rev-parse", `${taskCommit}^{tree}`]);
    if (!parent.ok || parent.stdout.toLowerCase() !== tip) throw new Error("task snapshot commit must have the current task branch tip as its parent");
    if (!taskTree.ok) throw new Error("task snapshot commit does not exist");
    const snapshot = captureExecutionSnapshot(worktree, task.identity.taskId);
    if (snapshot.head.toLowerCase() !== tip || snapshot.tree.toLowerCase() !== taskTree.stdout.toLowerCase()) {
      throw new Error("task worktree does not match the verified task snapshot commit");
    }
  }
  const targetBaseline = branchOid(root, input.target_branch);
  if (!targetBaseline) throw new Error("target branch does not exist");
  const remoteTargetBaseline = remoteOid(root, input.remote, input.target_branch);
  if (!remoteTargetBaseline || remoteTargetBaseline !== targetBaseline) throw new Error("local and remote target baselines must match");
  const plan = {
    schema_version: "task-close-plan.v1",
    task_id: task.identity.taskId,
    delivery: {
      target_repo_root: root,
      worktree_root: worktree,
      task_branch: input.task_branch,
      target_branch: input.target_branch,
      remote: input.remote,
      task_commit: taskCommit,
      spec_source_path: repositoryPath(input.spec_source_path, "delivery spec_source_path"),
      spec_archive_path: repositoryPath(input.spec_archive_path, "delivery spec_archive_path"),
      target_baseline: targetBaseline,
      remote_target_baseline: remoteTargetBaseline,
      merge_strategy: "--no-ff --no-edit",
      close_mode: allowMiniTaskFocused ? "mini-task" : "ordinary",
      ...(productRelease ? { product_release: productRelease } : {}),
      quality_status: qualityReasons.length === 0 ? "observed" : "incomplete",
      quality_gaps: [...new Set(qualityReasons)],
    },
    steps: DELIVERY_STEPS.map(([step_id, operation]) => ({ step_id, operation })),
  };
  const delivery = validateDeliveryPlan(plan, task, kernel);
  targetPreflight(delivery);
  if (!gitResult(root, ["cat-file", "-e", `${delivery.task_commit}^{commit}`]).ok) throw new Error("task commit does not exist");
  if (treeEntry(root, delivery.task_commit, delivery.spec_source_path)?.type !== "tree") throw new Error("accepted spec source must be a directory in the task commit");
  if (gitResult(root, ["cat-file", "-e", `${delivery.task_commit}:${delivery.spec_archive_path}`]).ok) throw new Error("spec is already archived in the task commit");
  const planHash = closePlanHash(plan);
  createOrVerify(task, `operations/close/plans/${planHash}/plan.json`, {
    schema_version: "task-close-plan-record.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    plan: structuredClone(plan),
  }, "close plan");
  return Object.freeze({ plan: Object.freeze(plan), plan_hash: planHash });
}

/** Read final delivery facts without performing fetch or any other Git write. */
export function inspectDeliveryCloseState({ task: taskHandle, kernel: taskKernel, plan } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const delivery = validateDeliveryPlan(plan, task, kernel);
  const root = delivery.target_repo_root;
  const taskSnapshotTree = gitResult(root, ["rev-parse", `${delivery.task_commit}^{tree}`]);
  if (task.manifest.record_model !== "vnext-single-write") throw new Error("legacy delivery close is retired; use a vnext-single-write task");
  let acceptedVerify;
  let verifyError;
  try {
    acceptedVerify = currentVerifyFacts(task, taskSnapshotTree.ok ? {
      snapshotTree: taskSnapshotTree.stdout,
      snapshotCommit: delivery.task_commit,
      worktreeRoot: delivery.target_repo_root,
      allowMiniTaskFocused: delivery.close_mode === "mini-task",
    } : {});
  } catch (error) {
    verifyError = error;
  }
  const verifyFreshness = acceptedVerify
    ? verifyFactsFreshForClose(
      acceptedVerify,
      delivery.worktree_root,
      task.identity.taskId,
      taskSnapshotTree.ok ? taskSnapshotTree.stdout : null,
      root,
      delivery.close_mode,
    )
    : { current: false, reason: verifyError?.message ?? "verify-code facts are unavailable" };
  const localTarget = gitResult(root, ["rev-parse", "--verify", `refs/heads/${delivery.target_branch}`]);
  const commitExists = gitResult(root, ["cat-file", "-e", `${delivery.task_commit}^{commit}`]).ok;
  const merged = localTarget.ok && commitExists && gitResult(root, ["merge-base", "--is-ancestor", delivery.task_commit, localTarget.stdout]).ok;
  const archivePathExists = localTarget.ok && gitResult(root, ["cat-file", "-e", `${delivery.target_branch}:${delivery.spec_archive_path}`]).ok;
  const sourcePathAbsent = localTarget.ok && !gitResult(root, ["cat-file", "-e", `${delivery.target_branch}:${delivery.spec_source_path}`]).ok;
  const archive = archiveFacts(root, localTarget.ok ? delivery.target_branch : null, delivery);
  const archiveCommitIncluded = archive.commit !== null && gitResult(root, ["merge-base", "--is-ancestor", archive.commit, localTarget.stdout]).ok;
  const remoteTarget = remoteOid(root, delivery.remote, delivery.target_branch);
  const pushed = merged && localTarget.ok && /^[a-f0-9]{40}$/.test(remoteTarget ?? "") && remoteTarget === localTarget.stdout.toLowerCase();
  const listedWorktrees = gitResult(root, ["worktree", "list", "--porcelain"]).stdout.split("\n").filter((line) => line.startsWith("worktree ")).map((line) => resolve(line.slice(9)));
  const existingWorkspace = task.manifest.workspace_mode === "existing";
  const worktreeCleanup = existingWorkspace ? true : (!existsSync(delivery.worktree_root) && !listedWorktrees.includes(resolve(delivery.worktree_root)));
  const worktreeCleanupScan = worktreeCleanup
    ? Object.freeze({ schema_version: "workflowhub-worktree-cleanup-scan.v1", status: "removed", worktree_root: resolve(delivery.worktree_root) })
    : inspectWorktreeCleanup(delivery.worktree_root);
  const formalCleanupSafe = worktreeCleanup || worktreeCleanupScan.safe === true;
  const branchCleanup = existingWorkspace ? true : !gitResult(root, ["show-ref", "--verify", "--quiet", `refs/heads/${delivery.task_branch}`]).ok;
  const cleanupFact = existingWorkspace
    ? { skipped: true, reason: "authenticated existing Workspace is not task-owned; worktree directory and branch are preserved" }
    : (worktreeCleanup && branchCleanup ? { removed: true } : { incomplete: true });
  const facts = {
    delivery_committed: merged,
    archive: archivePathExists && sourcePathAbsent && archiveCommitIncluded && archive.tree_preserved && archive.only_renames,
    archive_commit: archive.commit,
    archive_blob_preserved: archive.tree_preserved,
    archive_only_rename: archive.only_renames,
    merge: merged,
    push: pushed,
    local_target_oid: localTarget.ok ? localTarget.stdout.toLowerCase() : null,
    remote_target_oid: remoteTarget,
    worktree_cleanup: worktreeCleanup,
    formal_cleanup_safe: formalCleanupSafe,
    worktree_cleanup_scan: worktreeCleanupScan,
    branch_cleanup: branchCleanup,
    cleanup: cleanupFact,
  };
  facts.verify_facts_fresh = verifyFreshness.current;
  if (!verifyFreshness.current) facts.verify_facts_fresh_reason = verifyFreshness.reason;
  const missing = [["delivery", facts.delivery_committed], ["archive", facts.archive], ["merge", facts.merge], ["push", facts.push], ["worktree_cleanup", facts.worktree_cleanup], ["formal_cleanup_safe", facts.formal_cleanup_safe], ["branch_cleanup", facts.branch_cleanup], ["verify_facts_fresh", verifyFreshness.current]].filter(([, done]) => !done).map(([name]) => name);
  const physicalMissing = physicalDeliveryMissing(facts);
  return Object.freeze({
    schema_version: "task-close-delivery-state.v1",
    status: missing.length === 0 ? "ready" : "incomplete",
    physical_status: physicalMissing.length === 0 ? "ready" : "incomplete",
    missing: Object.freeze(missing),
    physical_missing: Object.freeze(physicalMissing),
    facts: Object.freeze(facts),
  });
}

/** Write completed only after every plan-bound delivery fact is currently true. */
export async function completeDeliveryClosePlan({ task: taskHandle, kernel: taskKernel, plan, closeConfirmationRef, now = () => new Date().toISOString() } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const delivery = validateDeliveryPlan(plan, task, kernel);
  if (delivery.risk_close !== undefined) throw new Error("risk close is retired");
  const planHash = closePlanHash(plan);
  const prepared = JSON.parse(task.readRecord(`operations/close/plans/${planHash}/plan.json`));
  if (prepared.schema_version !== "task-close-plan-record.v1" || prepared.task_id !== task.identity.taskId || prepared.plan_hash !== planHash || canonical(prepared.plan) !== canonical(plan)) throw new Error("prepared close plan record is invalid");
  const confirmation = closeConfirmation(task, planHash, closeConfirmationRef);
  if (confirmation.outcome !== "confirmed") return Object.freeze({ status: "blocked", confirmationOutcome: confirmation.outcome });
  if (typeof now !== "function") throw new TypeError("close now must be a function");
  return task.withRecordLock("locks/close.execution.lock", async () => {
    const consumedOperations = new Set();
    for (const step of plan.steps) {
      const operation = DELIVERY_AUTHORIZATIONS[step.operation];
      if (consumedOperations.has(operation)) continue;
      kernel.consumeIrreversibleAuthorization({
        operation,
        confirmation_ref: confirmation.human_confirmation_ref,
        plan_hash: planHash,
        step_id: step.step_id,
      });
      consumedOperations.add(operation);
    }
    const existing = readOptional(task, "operations/close/completed.json");
    if (existing !== undefined) {
      const completed = JSON.parse(existing);
      if (completed.schema_version !== "task-close-completed.v1" || completed.task_id !== task.identity.taskId || completed.plan_hash !== planHash || completed.status !== "completed") throw new Error("task close completed by a conflicting or invalid plan");
      return Object.freeze(completed);
    }
    const state = inspectDeliveryCloseState({ task, kernel, plan });
    if (state.physical_missing.length > 0) throw new Error(`delivery close is incomplete: ${state.physical_missing.join(", ")}`);
    const completion = { schema_version: "task-close-completed.v1", task_id: task.identity.taskId, plan_hash: planHash, status: "completed", physical_state: structuredClone(state.facts), completed_at: now() };
    createOrVerify(task, "operations/close/completed.json", completion, "close completion");
    return Object.freeze(completion);
  });
}

/** Mint the only supported close executors from a verified repository root. */
export function createGovernedCloseExecutorRegistry({ task, kernel } = {}) {
  const safeTask = assertTaskHandle(task);
  const safeKernel = assertTaskKernel(kernel);
  if (safeKernel.task !== safeTask) throw new Error("close executor TaskHandle/TaskKernel mismatch");
  const root = safeTask.manifest.target_repo_root;
  if (git(root, ["rev-parse", "--show-toplevel"]) !== root) throw new Error("task target repository must be the Git toplevel");
  let removal;
  const registry = {
    executorFor(step) {
      if (step.operation === "verify-checkpoint-ancestry") {
        const { checkpoint_oid: checkpoint, final_oid: final } = step;
        if (!/^[a-f0-9]{40}$/i.test(checkpoint ?? "") || !/^[a-f0-9]{40}$/i.test(final ?? "")) throw new TypeError("checkpoint ancestry step requires commit OIDs");
        const observe = () => {
          let satisfied = false;
          try { execFileSync("git", ["merge-base", "--is-ancestor", checkpoint, final], { cwd: root, stdio: "ignore" }); satisfied = true; } catch {}
          return { satisfied, checkpoint_oid: checkpoint, final_oid: final };
        };
        return { probe: observe, execute: async () => { if (!observe().satisfied) throw new Error("checkpoint is not an ancestor of final commit"); }, verify: async (value) => value.satisfied && value.checkpoint_oid === checkpoint && value.final_oid === final };
      }
      if (step.operation === "remove-worktree") {
        if (Object.prototype.hasOwnProperty.call(step, "worktree_root")) throw new TypeError("remove-worktree path is selected only by the current accepted Workspace");
        removal ??= createTaskWorktreeRemoval(safeTask, currentWorkspaceBinding(safeTask, safeKernel));
        return removal;
      }
      throw new Error(`unsupported governed close operation: ${step.operation}`);
    },
  };
  GOVERNED_EXECUTORS.add(registry);
  return Object.freeze(registry);
}

/** Mint the fixed five delivery executors for one prepared delivery plan. */
export function createDeliveryCloseExecutorRegistry({ task: taskHandle, kernel: taskKernel, plan } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const delivery = validateDeliveryPlan(plan, task, kernel);
  if (plan.steps.length !== DELIVERY_STEPS.length || plan.steps.some((step, index) => step.step_id !== DELIVERY_STEPS[index][0] || step.operation !== DELIVERY_STEPS[index][1])) {
    throw new Error("delivery close plan must contain exactly the fixed five steps in order commit→merge→archive→push→cleanup");
  }
  const root = delivery.target_repo_root;
  const worktree = delivery.worktree_root;
  const contains = (ancestor, descendant) => Boolean(descendant) && gitResult(root, ["merge-base", "--is-ancestor", ancestor, descendant]).ok;
  const findArchive = () => {
    const taskTip = branchOid(root, delivery.task_branch);
    const targetTip = branchOid(root, delivery.target_branch);
    const ref = targetTip && contains(delivery.task_commit, targetTip) ? delivery.target_branch : taskTip && contains(delivery.task_commit, taskTip) ? delivery.task_branch : null;
    return archiveFacts(root, ref, delivery);
  };
  const published = () => {
    const taskTip = branchOid(root, delivery.task_branch);
    const targetTip = branchOid(root, delivery.target_branch);
    const referenced = contains(delivery.task_commit, taskTip) || contains(delivery.task_commit, targetTip);
    const staged = existsSync(worktree) ? gitResult(worktree, ["diff", "--cached", "--name-status", "--find-renames=100%", "-z"]).stdout : "";
    const advanced = !existsSync(worktree) || (contains(delivery.task_commit, git(worktree, ["rev-parse", "HEAD"])) && (sourceWorktreeStatus(worktree) === "" || exactDirectoryRenames(staged, delivery.spec_source_path, delivery.spec_archive_path)));
    return { satisfied: referenced && advanced, task_commit: delivery.task_commit };
  };
  const archived = () => {
    const value = findArchive();
    return { satisfied: value.commit !== null && value.tree_preserved && value.only_renames, archive_commit: value.commit, tree_oid: treeEntry(root, delivery.task_commit, delivery.spec_source_path)?.oid ?? null };
  };
  const mergeState = () => {
    const target = branchOid(root, delivery.target_branch);
    if (!target) return { satisfied: false, target_oid: null, task_tip: null, archive_commit: null, planned_merge_oid: null, resolved: false };
    const list = gitResult(root, ["rev-list", "--first-parent", target]).stdout.split(/\s+/).filter(Boolean);
    for (const commit of list) {
      const parents = gitResult(root, ["rev-list", "--parents", "-n", "1", commit]).stdout.split(" ").slice(1);
      if (parents.length === 2 && parents[0] === delivery.target_baseline && contains(delivery.task_commit, parents[1])) {
        return { satisfied: true, target_oid: target, task_tip: parents[1], archive_commit: null, planned_merge_oid: commit, resolved: false };
      }
    }
    return { satisfied: false, target_oid: target, task_tip: null, archive_commit: null, planned_merge_oid: null, resolved: false };
  };
  let removal;
  const registry = {
    executorFor(step) {
      if (step.operation === "commit-delivery") return {
        probe: published,
        execute: async () => {
          targetPreflight(delivery);
          const tip = branchOid(root, delivery.task_branch);
          if (tip !== delivery.task_commit) {
            const parent = gitResult(root, ["rev-parse", `${delivery.task_commit}^`]).stdout.toLowerCase();
            if (tip !== parent) throw new Error("task branch changed before publishing verified snapshot");
            git(root, ["update-ref", `refs/heads/${delivery.task_branch}`, delivery.task_commit, parent]);
          }
          const snapshot = captureExecutionSnapshot(worktree);
          const plannedTree = git(root, ["rev-parse", `${delivery.task_commit}^{tree}`]).toLowerCase();
          if (snapshot.tree.toLowerCase() !== plannedTree) {
            if (isMaterialOnlySnapshotDelta(worktree, plannedTree, snapshot.tree, task.identity.taskId)) {
              throw new Error("delivery plan is stale after executor-only tasks.md writeback; refresh the close plan without rerunning quality review");
            }
            throw new Error("task worktree bytes changed before snapshot publish");
          }
          git(worktree, ["reset", "--mixed", delivery.task_commit]);
          if (sourceWorktreeStatus(worktree) !== "") throw new Error("published task source worktree is not clean");
        },
        verify: async (value) => value.satisfied && value.task_commit === delivery.task_commit,
      };
      if (step.operation === "archive-spec") return {
        probe: archived,
        execute: async () => {
          targetPreflight(delivery, null);
          if (!mergeState().satisfied) throw new Error("target branch is not merged before archive");
          const staged = gitResult(root, ["diff", "--cached", "--name-status", "--find-renames=100%", "-z"]).stdout;
          if (existsSync(join(root, delivery.spec_source_path))) {
            if (sourceWorktreeStatus(root) !== "") throw new Error("target source worktree changed before spec archive");
            createArchiveParent(root, delivery.spec_archive_path);
            git(root, ["mv", "--", delivery.spec_source_path, delivery.spec_archive_path]);
          } else if (!existsSync(join(root, delivery.spec_archive_path)) || !exactDirectoryRenames(staged, delivery.spec_source_path, delivery.spec_archive_path)) {
            throw new Error("partial spec archive does not match the planned directory move");
          }
          // Quality/evidence files are execution sidecars and are deliberately
          // outside the published source snapshot. Check only source bytes so
          // a live evidence write cannot block the exact spec-directory move.
          if (unstagedSourcePaths(root).length > 0) throw new Error("spec archive contains unstaged source changes");
          const moves = gitResult(root, ["diff", "--cached", "--name-status", "--find-renames=100%", "-z"]).stdout;
          if (!exactDirectoryRenames(moves, delivery.spec_source_path, delivery.spec_archive_path)) throw new Error("spec archive is not an exact directory move");
          git(root, ["commit", "-m", `archive ${delivery.spec_source_path}`]);
        },
        verify: async (value) => value.satisfied && value.tree_oid === treeEntry(root, delivery.task_commit, delivery.spec_source_path)?.oid,
      };
      if (step.operation === "merge-task-branch") return {
        probe: mergeState,
        execute: async () => {
          targetPreflight(delivery);
          plannedMergePreflight(delivery);
          targetPreflight(delivery);
          try {
            git(root, ["merge", "--no-ff", "--no-edit", delivery.task_branch]);
          } catch (error) {
            if (gitResult(root, ["rev-parse", "--verify", "MERGE_HEAD"]).ok) gitResult(root, ["merge", "--abort"]);
            throw new Error(`merge-task-branch failed; target merge was aborted: ${error.message}`);
          }
        },
        verify: async (value) => value.satisfied && value.target_oid !== null,
      };
      if (step.operation === "push-target-branch") return {
        probe: () => { const merged = mergeState(); const remote = remoteOid(root, delivery.remote, delivery.target_branch); return { satisfied: merged.satisfied && remote === merged.target_oid, target_oid: merged.target_oid, remote_oid: remote }; },
        execute: async () => {
          targetPreflight(delivery, null);
          const merged = mergeState();
          if (!merged.satisfied) throw new Error("target branch is not the planned no-ff merge");
          if (remoteOid(root, delivery.remote, delivery.target_branch) !== delivery.remote_target_baseline) throw new Error("remote target baseline changed before push");
          git(root, ["push", delivery.remote, `refs/heads/${delivery.target_branch}:refs/heads/${delivery.target_branch}`]);
        },
        verify: async (value) => value.satisfied && value.target_oid === value.remote_oid,
      };
      if (step.operation === "cleanup") {
        const existingWorkspace = task.manifest.workspace_mode === "existing";
        const branchRemover = {
          probe: () => ({ satisfied: branchOid(root, delivery.task_branch) === null, task_branch: delivery.task_branch }),
          execute: async () => {
            if (!existingWorkspace && existsSync(worktree)) throw new Error("task worktree must be removed before branch cleanup");
            const target = branchOid(root, delivery.target_branch);
            const tip = branchOid(root, delivery.task_branch);
            if (!tip || !contains(tip, target)) throw new Error("task branch is not merged into target");
            git(root, ["branch", "-d", "--", delivery.task_branch]);
          },
          verify: async (value) => value.satisfied && value.task_branch === delivery.task_branch,
        };
        if (existingWorkspace) {
          return {
            probe: async () => {
              const branchObservation = { satisfied: true, skipped: true, reason: "authenticated existing Workspace is not task-owned; task branch and directory are preserved", task_branch: delivery.task_branch };
              const worktreeObservation = { satisfied: true, skipped: true, reason: "authenticated existing Workspace is not task-owned; task worktree directory is preserved", worktree_root: resolve(delivery.worktree_root) };
              return { satisfied: true, worktree_cleanup: worktreeObservation, branch_cleanup: branchObservation };
            },
            execute: async () => {},
            verify: async (value) => {
              return value.worktree_cleanup?.skipped === true && value.branch_cleanup?.skipped === true;
            },
          };
        }
        const effective = currentWorkspaceBinding(task, kernel, delivery);
        removal ??= createTaskWorktreeRemoval(task, {
          ...effective,
          worktreeRoot: delivery.worktree_root,
        });
        return {
          probe: async () => {
            const worktreeObservation = await removal.probe();
            const branchObservation = branchRemover.probe();
            if (worktreeObservation.satisfied && branchObservation.satisfied) {
              return { satisfied: true, worktree_cleanup: worktreeObservation, branch_cleanup: branchObservation };
            }
            return { satisfied: false, worktree_cleanup: worktreeObservation, branch_cleanup: branchObservation };
          },
          execute: async () => {
            const worktreeObservation = await removal.probe();
            if (!worktreeObservation.satisfied) await removal.execute();
            const branchObservation = branchRemover.probe();
            if (!branchObservation.satisfied) await branchRemover.execute();
          },
          verify: async (value) => {
            if (!value.worktree_cleanup || !value.branch_cleanup) return false;
            const worktreeVerified = await removal.verify(value.worktree_cleanup);
            const branchVerified = await branchRemover.verify(value.branch_cleanup);
            return worktreeVerified && branchVerified;
          },
        };
      }
      if (step.operation === "remove-task-branch") return {
        probe: () => ({ satisfied: branchOid(root, delivery.task_branch) === null, task_branch: delivery.task_branch }),
        execute: async () => {
          if (existsSync(worktree)) throw new Error("task worktree must be removed before branch cleanup");
          const target = branchOid(root, delivery.target_branch);
          const tip = branchOid(root, delivery.task_branch);
          if (!tip || !contains(tip, target)) throw new Error("task branch is not merged into target");
          git(root, ["branch", "-d", "--", delivery.task_branch]);
        },
        verify: async (value) => value.satisfied && value.task_branch === delivery.task_branch,
      };
      throw new Error(`unsupported delivery close operation: ${step.operation}`);
    },
  };
  GOVERNED_EXECUTORS.add(registry);
  return Object.freeze(registry);
}

/**
 * Execute a confirmed immutable close plan.
 *
 * `executors` is keyed by plan step_id. Each executor probes physical state,
 * performs the operation only when needed, then probes/verifies again. Durable
 * task records are create-only; after a crash, physical state is authoritative.
 */
export async function executeClosePlan(options = {}) {
  const task = assertTaskHandle(options.task);
  const kernel = assertTaskKernel(options.kernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  const plan = validatePlan(options.plan, task);
  if (plan.delivery?.risk_close !== undefined) throw new Error("risk close is retired");
  const planRaw = canonical(plan);
  const planHash = sha256(planRaw);
  const preparedRef = `operations/close/plans/${planHash}/plan.json`;
  const preparedRaw = readOptional(task, preparedRef);
  if (preparedRaw === undefined) {
    throw new Error("close execution requires a prepared close plan");
  }
  let prepared;
  try { prepared = JSON.parse(preparedRaw); } catch { throw new Error("prepared close plan record is invalid JSON"); }
  if (prepared?.schema_version !== "task-close-plan-record.v1"
      || prepared.task_id !== task.identity.taskId
      || prepared.plan_hash !== planHash
      || canonical(prepared.plan) !== planRaw) {
    throw new Error("prepared close plan record is invalid");
  }
  const confirmationRef = options.closeConfirmationRef;
  const confirmationPrefix = `operations/close/confirmations/${planHash}/`;
  if (typeof confirmationRef !== "string" || !confirmationRef.startsWith(confirmationPrefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(confirmationRef)) {
    throw new TypeError("canonical plan-bound closeConfirmationRef is required");
  }
  const confirmation = closeConfirmation(task, planHash, confirmationRef);
  if (confirmation.outcome !== "confirmed") return Object.freeze({ status: "blocked", confirmationOutcome: confirmation.outcome });
  const executors = options.executors;
  // Validate every executable boundary before creating a record or performing a
  // physical probe. A malformed later step must have zero side effects.
  for (const step of plan.steps) executorFor(executors, step);
  const now = options.now ?? (() => new Date().toISOString());
  if (typeof now !== "function") throw new TypeError("close now must be a function");

  return task.withRecordLock("locks/close.execution.lock", async () => {
    const base = `operations/close/plans/${planHash}`;
    createOrVerify(task, `${base}/plan.json`, {
      schema_version: "task-close-plan-record.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      plan: structuredClone(plan),
    }, "close plan");
    createOrVerify(task, `${base}/confirmation.json`, {
      schema_version: "task-close-confirmation.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      confirmation_ref: confirmationRef,
      human_confirmation_ref: confirmation.human_confirmation_ref,
      human_confirmation_hash: confirmation.human_confirmation_hash,
      outcome: "confirmed",
    }, "close confirmation");

    const existingCompletion = readOptional(task, "operations/close/completed.json");
    let acceptedCompletion;
    if (existingCompletion !== undefined) {
      const completed = JSON.parse(existingCompletion);
      if (completed.plan_hash !== planHash || completed.task_id !== task.identity.taskId) throw new Error("task close completed by a conflicting plan");
      if (completed.schema_version !== "task-close-completed.v1" || completed.status !== "completed") throw new Error("task close completed record is invalid");
      acceptedCompletion = completed;
    }

    const consumedOperations = new Set();
    for (const step of plan.steps) {
      const executor = executorFor(executors, step);
      const recordPath = `${base}/steps/${step.step_id}.json`;
      const operation = DELIVERY_AUTHORIZATIONS[step.operation];
      if (!consumedOperations.has(operation)) {
        kernel.consumeIrreversibleAuthorization({
          operation,
          confirmation_ref: confirmation.human_confirmation_ref,
          plan_hash: planHash,
          step_id: step.step_id,
        });
        consumedOperations.add(operation);
      }
      const priorRaw = readOptional(task, recordPath);
      const before = await probeSatisfied(executor, step, priorRaw === undefined ? "initial" : "reconcile");
      if (priorRaw !== undefined) {
        const prior = JSON.parse(priorRaw);
        if (prior.plan_hash !== planHash || prior.step_id !== step.step_id || prior.status !== "completed") throw new Error(`close step ${step.step_id} record conflicts with plan`);
        if (!before.satisfied) throw new Error(`close step ${step.step_id} completed record conflicts with physical state`);
        continue;
      }
      if (before.satisfied) {
        createOrVerify(task, recordPath, completedRecord(task, planHash, step, before, "reconciled", now), `close step ${step.step_id}`);
        continue;
      }
      await executor.execute(step, before);
      const after = await probeSatisfied(executor, step, "post-execution");
      if (!after.satisfied) throw new Error(`close step ${step.step_id} did not reach its declared physical state`);
      createOrVerify(task, recordPath, completedRecord(task, planHash, step, after, "executed", now), `close step ${step.step_id}`);
    }

    const deliveryState = plan.delivery ? inspectDeliveryCloseState({ task, kernel, plan }) : null;
    if (deliveryState) {
      const missing = deliveryState.physical_missing;
      if (missing.length > 0) throw new Error(`delivery close is incomplete: ${missing.join(", ")}`);
    }
    if (acceptedCompletion) return Object.freeze(acceptedCompletion);
    const completion = {
      schema_version: "task-close-completed.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      status: "completed",
      ...(deliveryState ? { physical_state: structuredClone(deliveryState.facts) } : {}),
      completed_at: now(),
    };
    if (!options.deferCompletionRecord) createOrVerify(task, "operations/close/completed.json", completion, "close completion");
    return Object.freeze(completion);
  });
}
