import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter } from "../../../runtime/evidence/canonical-receipt-writer.mjs";
import { captureExecutionSnapshot, isExecutionRecordOnlyMaterialDelta, isMaterialOnlySnapshotDelta, materialRevisionFromValues } from "../../../runtime/task/git-worktree-snapshot.mjs";
import { qualityFactDigest } from "../../../runtime/evidence/quality-fact.mjs";
import { assertTaskHandle, assertTaskKernel } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";
import { validateCanonicalFullTestReceipt, validateMiniTaskAcTrace } from "../../../runtime/evidence/canonical-evidence-validators.mjs";
import { validateReportableFindingDispositions } from "../../../runtime/review/stage-review-disposition.mjs";
import { validateSchema } from "../../../runtime/review/schema-validator.mjs";
import {
  closePlanHash,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  authenticateReviewEvidence,
  prepareDeliveryClosePlan,
} from "../../../core/task-close.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/i;
const SAFE_PATH = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*)(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const MINI_REVIEW_RESULT = /^quality\/reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const MINI_REVIEW_ATTEMPT = /^quality\/reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json$/;
const MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
const RESUME_PLAN_PREFIX = "operations/close/plans/";
const CLOSE_CONFIRMATION_PREFIX = "operations/close/confirmations/";
const DELIVERY_AUTH_STEP_IDS = Object.freeze({
  commit: ["commit-delivery"],
  archive: ["archive-spec"],
  merge: ["merge-task-branch"],
  push: ["push-target-branch"],
  cleanup: ["remove-task-worktree", "remove-task-branch"],
});
const MINI_REVIEW_STATUSES = new Set(["passed", "failed", "recorded", "unavailable", "missing"]);
const MINI_REVIEW_CLOSE_STATUSES = new Set(["passed", "recorded"]);
const MINI_REVIEW_KIND = Object.freeze({ design: "mini_task.design", implementation: "mini_task.implementation" });
const MINI_REVIEW_PHASE = Object.freeze({ design: "mini-task-design", implementation: "mini-task-implementation" });
const NOT_APPLICABLE_REASON_CODES = new Set(["out_of_scope", "no_ui", "no_code_change", "no_runtime_path", "deferred_scope"]);

async function runWhReview(input) {
  const module = await import("../../../skills/wh-review/scripts/wh-review-cli.mjs");
  return module.runReviewRecovery(input);
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

function oid(value, label) {
  if (!OID.test(value ?? "")) throw new TypeError(`${label} must be a full Git object id`);
  return value.toLowerCase();
}

function hash(raw) { return createHash("sha256").update(raw).digest("hex"); }

function originalRequirementSection(decisionLog) {
  if (typeof decisionLog !== "string") return null;
  const lines = decisionLog.replaceAll("\r\n", "\n").split("\n");
  const start = lines.findIndex((line) => /^##[ \t]+原始需求(?:[ \t（(]|$)/.test(line));
  if (start < 0) return null;
  const nextHeading = lines.findIndex((line, index) => index > start && /^##[ \t]+\S/.test(line));
  const end = nextHeading < 0 ? lines.length : nextHeading;
  const section = lines.slice(start, end).join("\n").trim();
  return section.length > 0 ? `${section}\n` : null;
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const keys = Object.keys(object(value, "canonical value")).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function git(root, args, { allowFailure = false } = {}) {
  if (allowFailure) {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: result.status === 0, status: result.status, stdout: String(result.stdout ?? "").trim(), stderr: String(result.stderr ?? "").trim() };
  }
  return String(execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim();
}

function safePaths(value) {
  if (!Array.isArray(value) || value.length === 0 || value.some((path) => typeof path !== "string" || !SAFE_PATH.test(path))) {
    throw new TypeError("progress_paths must contain at least one safe repository-relative path");
  }
  return [...new Set(value)].sort();
}

function writeCreateOnly(task, ref, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  try { task.createRecordAtomic(ref, raw); }
  catch (error) {
    if (error?.code !== "EEXIST" || task.readRecord(ref) !== raw) throw error;
  }
  return { ref, sha256: hash(raw), raw };
}

function readAcceptedCloseConfirmation(task, plan, confirmationRef) {
  const planHash = closePlanHash(plan);
  const prefix = `${CLOSE_CONFIRMATION_PREFIX}${planHash}/`;
  if (typeof confirmationRef !== "string" || !confirmationRef.startsWith(prefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(confirmationRef)) {
    throw new TypeError("plan-bound close confirmation is required");
  }
  const confirmation = JSON.parse(task.readRecord(confirmationRef));
  if (confirmation.schema_version !== "task-close-confirmation.v1"
      || confirmation.task_id !== task.identity.taskId
      || confirmation.plan_hash !== planHash
      || confirmation.outcome !== "confirmed"
      || typeof confirmation.human_confirmation_ref !== "string"
      || !HASH.test(confirmation.human_confirmation_hash ?? "")) {
    throw new Error("A resume confirmation is invalid or not bound to this plan");
  }
  const humanRaw = task.readRecord(confirmation.human_confirmation_ref);
  if (hash(humanRaw) !== confirmation.human_confirmation_hash) throw new Error("A resume human confirmation hash mismatch");
  const human = JSON.parse(humanRaw);
  if (human.schema_version !== "human-confirmation.v2"
      || human.task_id !== task.identity.taskId
      || human.decision !== "accepted"
      || human.subject_ref !== `${RESUME_PLAN_PREFIX}${planHash}/plan.json`) {
    throw new Error("A resume human confirmation is not bound to this plan");
  }
  return Object.freeze({
    confirmation: Object.freeze(confirmation),
    human: Object.freeze({ ...human, ref: confirmation.human_confirmation_ref, sha256: confirmation.human_confirmation_hash }),
  });
}

function readCloseConfirmationOutcome(task, plan, confirmationRef) {
  const planHash = closePlanHash(plan);
  const prefix = `${CLOSE_CONFIRMATION_PREFIX}${planHash}/`;
  if (typeof confirmationRef !== "string" || !confirmationRef.startsWith(prefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(confirmationRef)) {
    throw new TypeError("canonical plan-bound closeConfirmationRef is required");
  }
  const confirmation = JSON.parse(task.readRecord(confirmationRef));
  if (confirmation.schema_version !== "task-close-confirmation.v1"
      || confirmation.task_id !== task.identity.taskId
      || confirmation.plan_hash !== planHash
      || !["confirmed", "rejected"].includes(confirmation.outcome)) {
    throw new Error("mini-task close confirmation is invalid or not bound to this plan");
  }
  return confirmation.outcome;
}

function planSteps(plan, operation) {
  const stepIds = DELIVERY_AUTH_STEP_IDS[operation] ?? [];
  return plan.steps.filter((step) => stepIds.includes(step.step_id));
}

function readQualityFact(task, ref) {
  try {
    const raw = task.readRecord(ref);
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || value.schema_version !== "quality-fact.v1") {
      const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} is not a quality-fact.v1 record`);
      invalid.code = "QUALITY_FACT_INVALID";
      throw invalid;
    }
    if (value.task_id !== task.identity.taskId
        || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
        || !OID.test(value.snapshot_tree ?? "")
        || !["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(value.stage)
        || typeof value.kind !== "string"
        || typeof value.subject !== "string"
        || !Array.isArray(value.evidence)
        || value.evidence.length === 0
        || !Number.isFinite(Date.parse(value.recorded_at))
        || ref !== `quality/facts/${qualityFactDigest(value)}.json`
        || value.fact_id !== `quality-${qualityFactDigest(value)}`) {
      const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} has invalid quality fact fields`);
      invalid.code = "QUALITY_FACT_INVALID";
      throw invalid;
    }
    if (!MINI_REVIEW_STATUSES.has(value.status)) {
      const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} has an invalid quality status`);
      invalid.code = "QUALITY_FACT_INVALID";
      throw invalid;
    }
    if (value.status === "recorded" && value.kind !== "review") {
      const invalid = new Error(`QUALITY_FACT_INVALID: ${ref} has recorded status for a non-review fact`);
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

function latestMiniQualityFacts(task, { worktreeRoot, snapshotTree, materialRevision, snapshotMode = "required", subjects = ["mini_task_design_review", "mini_task_implementation_review"] } = {}) {
  const facts = task.listCanonicalQualityFactRefs()
    .map((ref) => ({ ref, value: readQualityFact(task, ref) }))
    .filter(({ value }) => subjects.includes(value?.subject))
    .filter(({ value }) => {
      if (!value || typeof materialRevision !== "string") return true;
      if (value.material_revision === materialRevision && snapshotMode === "material") return true;
      if (typeof worktreeRoot !== "string" || typeof snapshotTree !== "string") return value.material_revision === materialRevision;
      const recordOnlyDelta = value.snapshot_tree !== snapshotTree && (
        isExecutionRecordOnlyMaterialDelta(worktreeRoot, value.snapshot_tree, snapshotTree, task.identity.taskId)
        || isMaterialOnlySnapshotDelta(worktreeRoot, value.snapshot_tree, snapshotTree, task.identity.taskId)
      );
      return (snapshotMode === "material" || value.snapshot_tree === snapshotTree || recordOnlyDelta)
        && (value.material_revision === materialRevision || recordOnlyDelta);
    });
  const current = new Map();
  for (const item of facts) {
    const subject = item.value.subject;
    if (!current.has(subject)) current.set(subject, item);
    else if (current.get(subject) !== null) {
      // Multiple current facts are a conflict. Do not guess by recorded_at or
      // ref ordering; the caller must keep delivery incomplete and repair the
      // same task's facts.
      current.set(subject, null);
    }
  }
  return current;
}

function currentMaterialRevision(task, worktreeRoot) {
  const artifacts = ArtifactDir.open(worktreeRoot, task);
  const values = MATERIAL_FILES.map((file) => {
    try { return [file, artifacts.read(file)]; }
    catch (error) {
      if (error?.code === "ENOENT") return [file, null];
      throw error;
    }
  });
  return materialRevisionFromValues(values);
}

function currentMiniTaskMaterials(task, worktreeRoot) {
  const artifacts = ArtifactDir.open(worktreeRoot, task);
  const read = (name) => artifacts.read(name);
  const decisionLog = read("decision-log.md");
  const rawRequirement = originalRequirementSection(decisionLog);
  if (rawRequirement === null) {
    throw new Error("MATERIAL_INCOMPLETE: mini-task decision-log has no original requirement section");
  }
  return {
    raw_requirement: rawRequirement,
    decision_log: decisionLog,
    spec: read("spec.md"),
    plan: read("plan.md"),
    tasks: read("tasks.md"),
  };
}

function reviewRequest(task, _workspace, reviewKind, materials, hostProvider) {
  text(hostProvider, "hostProvider");
  return {
    task_path: task.taskPath,
    project_name: task.identity.projectName,
    task_id: task.identity.taskId,
    stage: "build-code",
    phase_id: MINI_REVIEW_PHASE[reviewKind.split(".")[1]],
    review_kind: reviewKind,
    host_provider: hostProvider,
    materials,
  };
}

function canonicalReviewBinding(task, review, expectedKind, expectedSnapshot, label) {
  const value = object(review, label);
  if (Object.prototype.hasOwnProperty.call(value, "status")) {
    throw new TypeError(`${label}.status is not accepted; status is derived from canonical wh-review evidence`);
  }
  const resultRef = value.result_ref ?? value.resultRef ?? value.ref;
  const attemptRef = value.attempt_ref ?? value.attemptRef;
  const ref = resultRef ?? attemptRef;
  const digest = value.sha256 ?? value.hash;
  const unavailableRef = typeof ref === "string" && /^quality\/evidence\/mini-task-review-unavailable\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(ref);
  if (typeof ref !== "string" || (!MINI_REVIEW_RESULT.test(ref) && !MINI_REVIEW_ATTEMPT.test(ref) && !unavailableRef) || !HASH.test(digest ?? "")) {
    throw new TypeError(`${label} must bind a canonical wh-review result or attempt`);
  }
  const raw = task.readRecord(ref);
  if (hash(raw) !== digest) throw new Error(`${label} evidence hash mismatch`);
  const canonical = JSON.parse(raw);
  if (canonical.version === "wh-review-result.v1") validateSchema("result", canonical);
  if (canonical.version === "wh-review-attempt.v1") validateSchema("attempt", canonical);
  if (canonical.task_id !== task.identity.taskId || canonical.review_kind !== expectedKind || canonical.snapshot_tree !== expectedSnapshot) {
    throw new Error(`${label} is not bound to the current mini-task snapshot`);
  }
  const available = canonical.version === "wh-review-result.v1" && ref === resultRef;
  const unavailable = (canonical.version === "wh-review-attempt.v1" && canonical.terminal_status === "unavailable" && ref === attemptRef)
    || (canonical.schema_version === "workflowhub-mini-task-review-unavailable.v1" && canonical.status === "unavailable");
  if (!available && !unavailable) throw new Error(`${label} is not a canonical terminal wh-review record`);
  if (available) authenticateReviewEvidence(task, canonical);
  return Object.freeze({ ref, sha256: digest, status: available ? "recorded" : "unavailable", value: canonical });
}

function bindingInput(binding) {
  return { ref: binding.ref, sha256: binding.sha256 };
}

function resultBindingOrUnavailable({ task, kernel, runResult, reviewKind, snapshotTree }) {
  const value = object(runResult, `${reviewKind} review result`);
  const resultRef = value.result_ref ?? value.resultRef;
  const attemptRef = value.attempt_ref ?? value.attemptRef;
  const ref = value.status === "available" ? resultRef : attemptRef;
  const suppliedDigest = ref === resultRef ? value.result_sha256 ?? value.resultHash : value.attempt_sha256 ?? value.attemptHash;
  const digest = typeof suppliedDigest === "string" && HASH.test(suppliedDigest ?? "") ? suppliedDigest : (typeof ref === "string" ? hash(task.readRecord(ref)) : null);
  if (typeof ref === "string" && HASH.test(digest ?? "")) {
    const binding = canonicalReviewBinding(task, value.status === "available" ? { result_ref: ref, sha256: digest } : { attempt_ref: ref, sha256: digest }, reviewKind, snapshotTree, `${reviewKind} review`);
    return bindingInput(binding);
  }
  if (value.status !== "unavailable") throw new Error(`${reviewKind} review did not return canonical evidence`);
  const fallback = unavailableReviewRecord({
    task,
    kernel,
    reviewKind,
    snapshotTree,
    errorCode: value.error_code ?? "REVIEW_UNAVAILABLE",
    reason: value.error?.message ?? value.recovery ?? "wh-review returned unavailable without a canonical record",
  });
  return bindingInput(fallback);
}

function reviewRunnerFor(options) {
  const runner = options.reviewRunner ?? options.runReview ?? runWhReview;
  if (typeof runner !== "function") throw new TypeError("reviewRunner must be a function");
  return runner;
}

function readUserResultFields(value) {
  const result = object(value, "userResult");
  if (result.status !== "verified") throw new Error("userResult.status must be verified");
  for (const field of ["method", "scenario", "expected", "observed", "oracle"]) text(result[field], `userResult.${field}`);
  return result;
}

function receiptBinding(value, label = "mini-task focused test") {
  const ref = value?.receipt_ref ?? value?.ref;
  const digest = value?.receipt_hash ?? value?.sha256;
  if (typeof ref !== "string" || !ref.startsWith("quality/tests/") || !HASH.test(digest ?? "")) {
    throw new Error(`${label} binding is invalid`);
  }
  return { ref, sha256: digest };
}

function validateUserResultEvidence({ task, result, receipt, snapshotTree }) {
  const expected = receiptBinding(receipt);
  if (result.evidence_type !== "test_receipt"
      || result.evidence_ref !== expected.ref
      || result.evidence_hash !== expected.sha256) {
    throw new Error("mini-task user result must bind its evidence_ref/evidence_hash to the focused test receipt");
  }
  const raw = task.readRecord(expected.ref);
  if (hash(raw) !== expected.sha256) throw new Error("mini-task user result evidence hash mismatch");
  const bound = JSON.parse(raw);
  validateCanonicalFullTestReceipt(bound, {
    taskId: task.identity.taskId,
    snapshotTree: snapshotTree ?? bound.snapshot_tree,
    requirePassed: false,
    allowMiniTaskFocused: true,
  });
  const output = task.readRecord(bound.output_ref);
  if (hash(output) !== bound.output_hash) throw new Error("mini-task user result evidence output hash mismatch");
  return bound;
}

function publishMiniTaskUserResult({ task, kernel, receipt, userResult }) {
  const result = readUserResultFields(userResult);
  if (result.snapshot_tree !== undefined && result.snapshot_tree !== receipt.snapshot_tree) {
    throw new Error("mini-task user result snapshot differs from focused test snapshot");
  }
  const value = {
    ...result,
    schema_version: "workflowhub-mini-task-user-result.v1",
    task_id: task.identity.taskId,
    snapshot_tree: receipt.snapshot_tree,
    evidence_type: "test_receipt",
    evidence_ref: receipt.receipt_ref,
    evidence_hash: receipt.receipt_hash,
  };
  validateUserResultEvidence({ task, result: value, receipt, snapshotTree: receipt.snapshot_tree });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/mini-task-user-result/${hash(raw)}.json`;
  return kernel.publishCanonicalRecord(ref, raw);
}

function assertMiniTaskUserResult(task, binding, snapshotTree, receipt = null) {
  const result = readBoundJson(task, binding, "mini-task user result");
  if (result.schema_version !== "workflowhub-mini-task-user-result.v1"
      || result.task_id !== task.identity.taskId
      || result.snapshot_tree !== snapshotTree) {
    throw new Error("mini-task user result is not a canonical current-snapshot record");
  }
  const expectedReceipt = receipt ?? { receipt_ref: result.evidence_ref, receipt_hash: result.evidence_hash };
  validateUserResultEvidence({ task, result, receipt: expectedReceipt, snapshotTree });
  return readUserResultFields(result);
}

function assertAcTraceForMiniTask(acTrace, { task, receipt, receiptBinding = null }) {
  if (acTrace === null || acTrace === undefined) throw new Error("mini-task AC trace is required");
  return validateMiniTaskAcTrace(acTrace, {
    taskId: task.identity.taskId,
    snapshotTree: receipt.snapshot_tree,
    receiptRef: receipt.receipt_ref ?? receiptBinding?.ref,
    receiptHash: receipt.receipt_hash ?? receiptBinding?.sha256,
    read: (ref) => task.readRecord(ref),
  });
}

function unavailableReviewRecord({ task, kernel, reviewKind, snapshotTree, reason, errorCode = "REVIEW_UNAVAILABLE" }) {
  const value = {
    schema_version: "workflowhub-mini-task-review-unavailable.v1",
    task_id: task.identity.taskId,
    review_kind: reviewKind,
    snapshot_tree: snapshotTree,
    status: "unavailable",
    error_code: errorCode,
    reason,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/mini-task-review-unavailable/${hash(raw)}.json`;
  const record = kernel.publishCanonicalRecord(ref, raw);
  return { ref: record.ref, sha256: record.sha256, status: "unavailable" };
}

function readBoundJson(task, binding, label) {
  if (!binding || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")) throw new Error(`${label} evidence binding is invalid`);
  const raw = task.readRecord(binding.ref);
  if (hash(raw) !== binding.sha256) throw new Error(`${label} evidence hash mismatch`);
  return JSON.parse(raw);
}

function authenticateMiniReviewResult(task, value, label) {
  if (value?.version !== "wh-review-result.v1") throw new Error(`${label} is not a canonical semantic review result`);
  validateSchema("result", value);
  authenticateReviewEvidence(task, value);
  return value;
}

function miniFindingDispositions({ reviewResult, supplied, label }) {
  const result = validateReportableFindingDispositions({ result: reviewResult, dispositions: supplied });
  if (result.facts.status === "incomplete") {
    throw new Error(`${label} finding dispositions are incomplete: ${result.missing_items.join("; ")}`);
  }
  return result.facts;
}

function writeMiniFindingDispositionEvidence({ task, kernel, reviewResult, dispositions, reviewBinding, label }) {
  const facts = miniFindingDispositions({ reviewResult, supplied: dispositions, label });
  if (facts.status === "not_applicable") return Object.freeze({ facts, evidence: null });
  const value = {
    schema_version: "workflowhub-mini-task-finding-dispositions.v1",
    task_id: task.identity.taskId,
    review_ref: reviewBinding.ref,
    review_hash: reviewBinding.sha256,
    snapshot_tree: reviewResult.snapshot_tree,
    ...facts,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const record = kernel.publishCanonicalRecord(`quality/evidence/mini-task-finding-dispositions/${hash(raw)}.json`, raw);
  return Object.freeze({ facts, evidence: { ref: record.ref, sha256: record.sha256, evidence_type: "review_result" } });
}

function assertMiniTaskQualityForDelivery(task) {
  const workspace = openCurrentTaskWorkspace(task);
  const snapshot = captureExecutionSnapshot(workspace.worktreeRoot, task.identity.taskId);
  const materialRevision = currentMaterialRevision(task, workspace.worktreeRoot);
  const facts = new Map([
    ...latestMiniQualityFacts(task, {
      worktreeRoot: workspace.worktreeRoot,
      snapshotTree: snapshot.tree,
      materialRevision,
      snapshotMode: "material",
      subjects: ["mini_task_design_review"],
    }),
    ...latestMiniQualityFacts(task, {
      worktreeRoot: workspace.worktreeRoot,
      snapshotTree: snapshot.tree,
      materialRevision,
      subjects: ["mini_task_implementation_review"],
    }),
  ]);
  const designFact = facts.get("mini_task_design_review");
  if (designFact === null) throw new Error("mini-task design review facts conflict for the current materials");
  const design = designFact?.value;
  if (!design || !MINI_REVIEW_CLOSE_STATUSES.has(design.status)) throw new Error("mini-task design review is incomplete for the current materials");
  const designSnapshotReusable = design.snapshot_tree === snapshot.tree
    || isExecutionRecordOnlyMaterialDelta(workspace.worktreeRoot, design.snapshot_tree, snapshot.tree, task.identity.taskId)
    || isMaterialOnlySnapshotDelta(workspace.worktreeRoot, design.snapshot_tree, snapshot.tree, task.identity.taskId);
  if (design.material_revision !== materialRevision && !designSnapshotReusable) {
    throw new Error("mini-task design review is stale for the current materials");
  }
  const designResult = readBoundJson(task, design.evidence[0], "mini-task design review");
  if (designResult.task_id !== task.identity.taskId
      || designResult.review_kind !== "mini_task.design"
      || designResult.snapshot_tree !== design.snapshot_tree) {
    throw new Error("mini-task design review is not bound to its frozen design snapshot");
  }
  authenticateMiniReviewResult(task, designResult, "mini-task design review");
  const designDispositionEvidence = (design.evidence ?? []).slice(1).map((entry) => {
    try { return readBoundJson(task, entry, "mini-task design finding dispositions"); } catch { return null; }
  }).find((value) => value?.schema_version === "workflowhub-mini-task-finding-dispositions.v1");
  const designDispositionFacts = miniFindingDispositions({
    reviewResult: designResult,
    supplied: designDispositionEvidence?.items ?? [],
    label: "mini-task design review",
  });
  if (designDispositionFacts.status !== (designDispositionEvidence?.status ?? designDispositionFacts.status)) {
    throw new Error("mini-task design finding disposition status is inconsistent");
  }

  const implementationFact = facts.get("mini_task_implementation_review");
  if (implementationFact === null) throw new Error("mini-task implementation review facts conflict for the current snapshot");
  const implementation = implementationFact?.value;
  if (!implementation || !MINI_REVIEW_CLOSE_STATUSES.has(implementation.status)) throw new Error("mini-task implementation review is incomplete for the current snapshot");
  const packet = readBoundJson(task, implementation.evidence[0], "mini-task implementation evidence");
  const implementationSnapshotReusable = packet.snapshot_tree === snapshot.tree
    || isExecutionRecordOnlyMaterialDelta(workspace.worktreeRoot, packet.snapshot_tree, snapshot.tree, task.identity.taskId)
    || isMaterialOnlySnapshotDelta(workspace.worktreeRoot, packet.snapshot_tree, snapshot.tree, task.identity.taskId);
  if (packet.schema_version !== "workflowhub-mini-task-implementation-evidence.v1"
      || packet.task_id !== task.identity.taskId
      || !implementationSnapshotReusable
      || !Array.isArray(packet.coverage_limits)
      || !Array.isArray(packet.skip_reasons)
      || !Array.isArray(packet.remaining_risks)) throw new Error("mini-task implementation evidence is incomplete or stale");
  if (!MINI_REVIEW_CLOSE_STATUSES.has(packet.implementation_review?.status ?? implementation.status)) throw new Error("mini-task implementation review is incomplete");
  const implementationResult = readBoundJson(task, packet.implementation_review, "mini-task implementation review");
  const implementationReviewReusable = implementationResult.snapshot_tree === snapshot.tree
    || isExecutionRecordOnlyMaterialDelta(workspace.worktreeRoot, implementationResult.snapshot_tree, snapshot.tree, task.identity.taskId)
    || isMaterialOnlySnapshotDelta(workspace.worktreeRoot, implementationResult.snapshot_tree, snapshot.tree, task.identity.taskId);
  if (implementationResult.task_id !== task.identity.taskId
      || implementationResult.review_kind !== "mini_task.implementation"
      || !implementationReviewReusable) throw new Error("mini-task implementation review is not bound to the current snapshot");
  authenticateMiniReviewResult(task, implementationResult, "mini-task implementation review");
  const dispositionFacts = miniFindingDispositions({
    reviewResult: implementationResult,
    supplied: packet.finding_dispositions?.items ?? [],
    label: "mini-task implementation review",
  });
  if (dispositionFacts.status !== packet.finding_dispositions?.status) throw new Error("mini-task finding disposition status is inconsistent");
  const testReceipt = readBoundJson(task, packet.test_receipt, "mini-task focused test");
  validateCanonicalFullTestReceipt(testReceipt, {
    taskId: task.identity.taskId,
    snapshotTree: testReceipt.snapshot_tree,
    requirePassed: false,
    allowMiniTaskFocused: true,
  });
  if (!(testReceipt.snapshot_tree === snapshot.tree
      || isExecutionRecordOnlyMaterialDelta(workspace.worktreeRoot, testReceipt.snapshot_tree, snapshot.tree, task.identity.taskId)
      || isMaterialOnlySnapshotDelta(workspace.worktreeRoot, testReceipt.snapshot_tree, snapshot.tree, task.identity.taskId))) throw new Error("mini-task focused test evidence is incomplete or stale");
  const testOutput = task.readRecord(testReceipt.output_ref);
  if (hash(testOutput) !== testReceipt.output_hash) throw new Error("mini-task focused test output hash mismatch");
  if (testReceipt.exit_code !== 0) {
    throw new Error(`mini-task focused test failed; delivery remains incomplete (exit_code=${testReceipt.exit_code})`);
  }
  const userResult = readBoundJson(task, packet.user_result, "mini-task user result");
  if (userResult.schema_version !== "workflowhub-mini-task-user-result.v1"
      || userResult.task_id !== task.identity.taskId
        || userResult.status !== "verified"
      || !(userResult.snapshot_tree === snapshot.tree
        || isExecutionRecordOnlyMaterialDelta(workspace.worktreeRoot, userResult.snapshot_tree, snapshot.tree, task.identity.taskId)
        || isMaterialOnlySnapshotDelta(workspace.worktreeRoot, userResult.snapshot_tree, snapshot.tree, task.identity.taskId))) throw new Error("mini-task real user result is incomplete or stale");
  assertMiniTaskUserResult(task, packet.user_result, testReceipt.snapshot_tree, {
    receipt_ref: packet.test_receipt.ref,
    receipt_hash: packet.test_receipt.sha256,
  });
  assertAcTraceForMiniTask(packet.ac_trace, { task, receipt: testReceipt, receiptBinding: packet.test_receipt });
  return Object.freeze({ snapshot_tree: snapshot.tree, design_fact: design, implementation_fact: implementation, packet });
}

function currentBranch(root) { return git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]); }
function currentHead(root) { return git(root, ["rev-parse", "HEAD^{commit}"]).toLowerCase(); }
function currentStatus(root) { return git(root, ["status", "--porcelain", "--untracked-files=all"]); }

function statusPaths(root) {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(`A progress status scan failed: ${String(result.stderr ?? "").trim()}`);
  const fields = String(result.stdout ?? "").split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const status = field.slice(0, 2);
    if (status.includes("R") || status.includes("C")) throw new Error("A progress rename/copy must be resolved before mini-task resume");
    const path = field.slice(3);
    if (!SAFE_PATH.test(path)) throw new Error(`A progress path is unsafe: ${path}`);
    paths.push(path);
  }
  return [...new Set(paths)].sort();
}

function progressState(root, step, taskId) {
  const branch = currentBranch(root);
  const head = currentHead(root);
  const status = currentStatus(root);
  const snapshot = captureExecutionSnapshot(root, taskId);
  const expectedHead = oid(step.expected_head, "expected_head");
  const expectedTree = oid(step.progress_snapshot_tree, "progress_snapshot_tree");
  const parents = git(root, ["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/).slice(1).map((value) => value.toLowerCase());
  const committed = head !== expectedHead
    && parents.length === 1
    && parents[0] === expectedHead
    && git(root, ["rev-parse", "HEAD^{tree}"]).toLowerCase() === expectedTree
    && status === "";
  const preservedInMerge = head !== expectedHead
    && parents.length === 2
    && parents[0] !== expectedHead
    && git(root, ["rev-list", "--parents", "-n", "1", parents[0]]).split(/\s+/)[1]?.toLowerCase() === expectedHead
    && git(root, ["rev-parse", `${parents[0]}^{tree}`]).toLowerCase() === expectedTree
    && status === "";
  const ready = head === expectedHead && snapshot.tree.toLowerCase() === expectedTree && status !== "";
  return { satisfied: committed || preservedInMerge, branch, head, status, snapshot_tree: snapshot.tree, commit_oid: committed ? head : preservedInMerge ? parents[0] : null, ready, expected_head: expectedHead, expected_tree: expectedTree };
}

function mergeState(root, step) {
  const branch = currentBranch(root);
  const head = currentHead(root);
  const parents = git(root, ["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/).slice(1).map((value) => value.toLowerCase());
  const target = oid(step.target_oid, "target_oid");
  const satisfied = parents.length === 2 && parents.includes(target) && currentStatus(root) === "";
  return { satisfied, branch, head, parents, target_oid: target, status: currentStatus(root), merge_commit_oid: satisfied ? head : null };
}

function progressParentForSatisfiedMerge(root, plan) {
  if (!plan.steps.some((candidate) => candidate.operation === "commit")) return null;
  return git(root, ["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/).slice(1)[0]?.toLowerCase() ?? null;
}

function publishResumeEvidence({ task, kernel, plan, planHash, targetOid, branch, progressCommitOid, mergeCommitOid, status, reason = null, error = null, idempotent = false }) {
  const evidence = {
    schema_version: "workflowhub-mini-task-a-resume.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    original_stage: plan.resume.original_stage,
    target_oid: targetOid,
    branch,
    progress_commit_oid: progressCommitOid,
    merge_commit_oid: mergeCommitOid,
    status,
    ...(status === "completed" ? {
      next_action: "rerun_original_stage",
      revalidation: { status: "pending", next_action: "rerun_original_stage" },
      ...(idempotent ? { idempotent: true } : {}),
    } : {}),
    ...(reason ? { reason } : {}),
    forbidden_relationships: ["continuation", "rebind", "successor", "recovery"],
    recorded_at: new Date().toISOString(),
  };
  const raw = `${JSON.stringify(evidence, null, 2)}\n`;
  const ref = `quality/evidence/mini-task-a-resume/${hash(raw)}.json`;
  const written = kernel.publishCanonicalRecord(ref, raw);
  return Object.freeze({ ...evidence, evidence_ref: written.ref, evidence_hash: written.sha256, ...(error ? { error: error.message } : {}) });
}

function validatePlanForTask(task, plan) {
  object(plan, "A resume plan");
  if (plan.schema_version !== "task-close-plan.v1" || plan.task_id !== task.identity.taskId || !Array.isArray(plan.steps) || !plan.resume) throw new Error("A resume plan is invalid");
  if (plan.steps.some((step) => !["commit", "merge"].includes(step.operation))) throw new Error("A resume plan contains an unsupported operation");
  return plan;
}

function createResumePlan({ task, workspace, targetOid: requestedTargetOid, originalStage = "unknown" }) {
  const targetOid = oid(requestedTargetOid, "target_oid");
  const root = workspace.worktreeRoot;
  const branch = currentBranch(root);
  const expectedHead = currentHead(root);
  const snapshot = captureExecutionSnapshot(root, task.identity.taskId);
  const paths = statusPaths(root);
  const steps = [];
  if (paths.length > 0) {
    steps.push({ step_id: "commit-a-progress", operation: "commit", expected_head: expectedHead, progress_snapshot_tree: snapshot.tree, progress_paths: paths });
  }
  steps.push({ step_id: "merge-mini-target", operation: "merge", target_oid: targetOid, expected_head: expectedHead, progress_snapshot_tree: paths.length > 0 ? snapshot.tree : null });
  const plan = {
    schema_version: "task-close-plan.v1",
    task_id: task.identity.taskId,
    resume: { original_stage: text(originalStage, "original_stage"), branch, target_repo_root: task.manifest.target_repo_root, target_oid: targetOid },
    steps,
  };
  const planHash = closePlanHash(plan);
  writeCreateOnly(task, `${RESUME_PLAN_PREFIX}${planHash}/plan.json`, { schema_version: "task-close-plan-record.v1", task_id: task.identity.taskId, plan_hash: planHash, plan: structuredClone(plan) });
  return Object.freeze({ plan: Object.freeze(plan), plan_hash: planHash, progress_paths: paths, snapshot_tree: snapshot.tree, expected_head: expectedHead });
}

function authorizeResumeOperations({ task, kernel, plan, confirmationRef, operations }) {
  const accepted = readAcceptedCloseConfirmation(task, plan, confirmationRef);
  const allowed = new Set(operations ?? plan.steps.map((step) => step.operation));
  const refs = [];
  for (const operation of ["commit", "merge"]) {
    if (!allowed.has(operation) || !plan.steps.some((step) => step.operation === operation)) continue;
    refs.push(kernel.publishIrreversibleAuthorization({ operation, subject_ref: accepted.human.ref }));
  }
  return Object.freeze(refs);
}

async function executeResume({ task, kernel, plan, closeConfirmationRef }) {
  validatePlanForTask(task, plan);
  const accepted = readAcceptedCloseConfirmation(task, plan, closeConfirmationRef);
  const workspace = openCurrentTaskWorkspace(task);
  const root = workspace.worktreeRoot;
  const planHash = closePlanHash(plan);
  return task.withRecordLock("locks/close.execution.lock", async () => {
    let progressCommitOid = null;
    for (const step of plan.steps) {
      if (step.operation === "commit") {
        const before = progressState(root, step, task.identity.taskId);
        if (before.satisfied) {
          progressCommitOid = before.commit_oid;
          continue;
        }
        kernel.consumeIrreversibleAuthorization({ operation: step.operation, confirmation_ref: accepted.human.ref, plan_hash: planHash, step_id: step.step_id });
        if (!before.satisfied) {
          if (!before.ready) throw new Error("A progress snapshot or HEAD changed before authorized commit");
          const observed = statusPaths(root);
          if (canonical(observed) !== canonical(step.progress_paths)) throw new Error("A progress paths changed before authorized commit");
          git(root, ["add", "--all", "--", ...step.progress_paths]);
          if (currentStatus(root) === "") throw new Error("A progress commit has no changes");
          git(root, ["commit", "-m", "mini-task: preserve A progress"]);
        }
        const after = progressState(root, step, task.identity.taskId);
        if (!after.satisfied) throw new Error("A progress commit did not reach the declared physical state");
        progressCommitOid = after.commit_oid;
        continue;
      }
      const before = mergeState(root, step);
      if (before.satisfied) {
        if (progressCommitOid === null && plan.steps.some((candidate) => candidate.operation === "commit")) {
          progressCommitOid = progressParentForSatisfiedMerge(root, plan);
        }
        return publishResumeEvidence({
          task,
          kernel,
          plan,
          planHash,
          targetOid: step.target_oid,
          branch: plan.resume.branch,
          progressCommitOid,
          mergeCommitOid: before.merge_commit_oid,
          status: "completed",
          idempotent: true,
        });
      }
      kernel.consumeIrreversibleAuthorization({ operation: step.operation, confirmation_ref: accepted.human.ref, plan_hash: planHash, step_id: step.step_id });
      if (before.status !== "") throw new Error("A worktree must be clean before merging mini-task target");
      const expectedHead = plan.steps.some((candidate) => candidate.operation === "commit")
        ? git(root, ["rev-parse", `${plan.steps.find((candidate) => candidate.operation === "commit").expected_head}`]).toLowerCase()
        : oid(step.expected_head, "merge expected_head");
      const current = currentHead(root);
      const progressParent = git(root, ["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/).slice(1).map((value) => value.toLowerCase());
      const allowedHead = current === expectedHead || (plan.steps.some((candidate) => candidate.operation === "commit") && progressParent.length === 1 && progressParent[0] === expectedHead);
      if (!allowedHead) throw new Error("A HEAD changed before authorized merge");
      if (!git(root, ["cat-file", "-e", `${step.target_oid}^{commit}`], { allowFailure: true }).ok) throw new Error("mini-task target commit is unavailable");
      try { git(root, ["merge", "--no-ff", "--no-edit", step.target_oid]); }
      catch (error) {
        if (git(root, ["rev-parse", "--verify", "MERGE_HEAD"], { allowFailure: true }).ok) git(root, ["merge", "--abort"]);
        const mergeError = [error.message, error.stderr, error.stdout].filter(Boolean).join("\n");
        return publishResumeEvidence({
          task,
          kernel,
          plan,
          planHash,
          targetOid: step.target_oid,
          branch: plan.resume.branch,
          progressCommitOid,
          mergeCommitOid: null,
          status: "blocked",
          reason: /conflict|CONFLICT|automatic merge failed/i.test(mergeError) ? "merge_conflict" : "merge_failed",
          error,
        });
      }
      const after = mergeState(root, step);
      if (!after.satisfied) throw new Error("A merge did not reach the declared physical state");
      return publishResumeEvidence({
        task,
        kernel,
        plan,
        planHash,
        targetOid: step.target_oid,
        branch: plan.resume.branch,
        progressCommitOid,
        mergeCommitOid: after.merge_commit_oid,
        status: "completed",
      });
    }
    throw new Error("A resume plan has no merge step");
  });
}

export function evaluateMiniTaskScope(input = {}) {
  const value = object(input, "mini-task scope input");
  const userRequested = value.user_requested === true || value.userRequested === true;
  const flags = {
    boundary_clear: value.boundary_clear !== false && value.boundaryClear !== false,
    single_outcome: value.single_outcome !== false && value.singleOutcome !== false,
    limited_impact: value.limited_impact !== false && value.limitedImpact !== false,
    major_architecture: value.major_architecture === true || value.majorArchitecture === true,
    migration: value.migration === true || value.migrationRisk === true,
    permission: value.permission === true || value.permissionRisk === true,
    security: value.security === true || value.securityRisk === true,
  };
  const expanded = Object.entries(flags).filter(([key, enabled]) => ["major_architecture", "migration", "permission", "security"].includes(key) && enabled).map(([key]) => key);
  const suitable = flags.boundary_clear && flags.single_outcome && flags.limited_impact && expanded.length === 0;
  if (expanded.length > 0) {
    return Object.freeze({
      status: "paused",
      user_requested: userRequested,
      reason: userRequested
        ? "mini-task scope includes a materially expanded boundary and requires an explicit route choice"
        : "mini-task suitability is not established",
      expanded_risks: expanded,
      choices: ["shrink-mini-task", "create-ordinary-five-stage-task"],
      flags,
    });
  }
  if (suitable) return Object.freeze({ status: "suitable", user_requested: userRequested, risks: userRequested ? ["用户显式指定了精简流程，仍需关注范围扩大"] : [], flags });
  if (userRequested) return Object.freeze({ status: "suitable_with_risk", user_requested: true, risks: expanded.length > 0 ? expanded : ["需求边界或影响面需要持续监控"], execution_boundary: "若执行中继续扩大，必须重新评估并暂停让用户选择", flags });
  return Object.freeze({ status: "paused", user_requested: false, reason: "mini-task suitability is not established", expanded_risks: expanded, choices: ["shrink-mini-task", "create-ordinary-five-stage-task"], flags });
}

export function prepareMiniTaskDelivery({ task: taskHandle, kernel: taskKernel, delivery } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task TaskHandle/TaskKernel mismatch");
  const workspace = openCurrentTaskWorkspace(task);
  const snapshot = captureExecutionSnapshot(workspace.worktreeRoot, task.identity.taskId);
  const focusedFacts = latestMiniQualityFacts(task, {
    worktreeRoot: workspace.worktreeRoot,
    snapshotTree: snapshot.tree,
    materialRevision: currentMaterialRevision(task, workspace.worktreeRoot),
    subjects: ["full_tests_fresh"],
  });
  if (focusedFacts.get("full_tests_fresh") === null) {
    throw new Error("mini-task full_tests_fresh quality facts conflict for the current snapshot");
  }
  const focusedTestFact = focusedFacts.get("full_tests_fresh");
  if (focusedTestFact?.value?.status === "failed") {
    const evidence = focusedTestFact.value.evidence?.find((entry) => entry.evidence_type === "test_receipt");
    if (evidence) {
      const receipt = readBoundJson(task, evidence, "mini-task focused test");
      if (receipt.exit_code !== 0) {
        throw new Error(`mini-task focused test failed; delivery remains incomplete (exit_code=${receipt.exit_code})`);
      }
    }
  }
  return prepareDeliveryClosePlan({ task, kernel, delivery, allowMiniTaskFocused: true });
}

export function confirmMiniTaskDelivery({ task: taskHandle, kernel: taskKernel, plan, outcome = "confirmed" } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task TaskHandle/TaskKernel mismatch");
  return confirmClosePlan({ task, kernel, plan, outcome });
}

export function recordMiniTaskDesignReview({ task: taskHandle, kernel: taskKernel, review, findingDispositions } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task design review TaskHandle/TaskKernel mismatch");
  const snapshot = captureExecutionSnapshot(openCurrentTaskWorkspace(task).worktreeRoot, task.identity.taskId);
  const binding = canonicalReviewBinding(task, review, MINI_REVIEW_KIND.design, snapshot.tree, "design review");
  const dispositionEvidence = writeMiniFindingDispositionEvidence({
    task, kernel, reviewResult: binding.value, dispositions: findingDispositions,
    reviewBinding: binding, label: "mini-task design review",
  });
  return kernel.publishVNextQualityFact("build-code", {
    kind: "review", status: binding.status, subject: "mini_task_design_review",
    evidence: [
      { ref: binding.ref, sha256: binding.sha256, evidence_type: "review_result" },
      ...(dispositionEvidence.evidence ? [dispositionEvidence.evidence] : []),
    ],
  });
}

export async function runMiniTaskDesignReview({ task: taskHandle, kernel: taskKernel, reviewRunner, runReview, hostProvider, findingDispositions } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task design review TaskHandle/TaskKernel mismatch");
  text(hostProvider, "hostProvider");
  const workspace = openCurrentTaskWorkspace(task);
  const snapshot = captureExecutionSnapshot(workspace.worktreeRoot, task.identity.taskId);
  const runner = reviewRunnerFor({ reviewRunner, runReview });
  let outcome;
  try {
    outcome = await runner(reviewRequest(task, workspace, MINI_REVIEW_KIND.design, currentMiniTaskMaterials(task, workspace.worktreeRoot), hostProvider));
  } catch (error) {
    outcome = { status: "unavailable", error_code: error?.code ?? "REVIEW_UNAVAILABLE", error: { message: String(error?.message ?? error) } };
  }
  const binding = resultBindingOrUnavailable({ task, kernel, runResult: outcome, reviewKind: MINI_REVIEW_KIND.design, snapshotTree: snapshot.tree });
  return Object.freeze({ review: recordMiniTaskDesignReview({ task, kernel, review: binding, findingDispositions }), outcome, snapshot_tree: snapshot.tree });
}

export function authorizeMiniTaskDelivery({ task: taskHandle, kernel: taskKernel, plan, confirmationRef, operations = ["commit", "archive", "merge", "push", "cleanup"] } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task TaskHandle/TaskKernel mismatch");
  const accepted = readAcceptedCloseConfirmation(task, plan, confirmationRef);
  const refs = [];
  for (const operation of operations) {
    if (!["commit", "archive", "merge", "push", "cleanup"].includes(operation)) throw new TypeError(`unsupported mini-task authorization operation: ${operation}`);
    const count = planSteps(plan, operation).length > 0 ? 1 : 0;
    for (let index = 0; index < count; index += 1) refs.push(kernel.publishIrreversibleAuthorization({ operation, subject_ref: accepted.human.ref }));
  }
  return Object.freeze(refs);
}

export async function executeMiniTaskDelivery({ task: taskHandle, kernel: taskKernel, plan, confirmationRef } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task TaskHandle/TaskKernel mismatch");
  if (readCloseConfirmationOutcome(task, plan, confirmationRef) === "confirmed") assertMiniTaskQualityForDelivery(task);
  return executeClosePlan({ task, kernel, plan, closeConfirmationRef: confirmationRef, executors: createDeliveryCloseExecutorRegistry({ task, kernel, plan }) });
}

export function prepareAResumePlan({ task: taskHandle, kernel: taskKernel, targetOid, originalStage = "unknown" } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("A resume TaskHandle/TaskKernel mismatch");
  const workspace = openCurrentTaskWorkspace(task);
  return createResumePlan({ task, workspace, targetOid, originalStage });
}

export function confirmAResumePlan({ task: taskHandle, kernel: taskKernel, plan, outcome = "confirmed" } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("A resume TaskHandle/TaskKernel mismatch");
  return confirmClosePlan({ task, kernel, plan, outcome });
}

export function authorizeAResumePlan({ task: taskHandle, kernel: taskKernel, plan, confirmationRef } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("A resume TaskHandle/TaskKernel mismatch");
  const accepted = readAcceptedCloseConfirmation(task, plan, confirmationRef);
  return authorizeResumeOperations({ task, kernel, plan, confirmationRef, operations: plan.steps.map((step) => step.operation) });
}

export async function resumeTaskA({ task: taskHandle, kernel: taskKernel, plan, closeConfirmationRef } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("A resume TaskHandle/TaskKernel mismatch");
  // The helper intentionally receives the kernel explicitly so evidence is
  // written by the authenticated task capability, never by a path writer.
  return executeResume({ task, kernel, plan, closeConfirmationRef });
}

export function createMiniTaskRunner({ task: taskHandle, kernel: taskKernel } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task TaskHandle/TaskKernel mismatch");
  return Object.freeze({
    evaluateScope: evaluateMiniTaskScope,
    runDesignReview: (input) => runMiniTaskDesignReview({ ...input, task, kernel }),
    runImplementationReview: (input) => runMiniTaskImplementationReview({ ...input, task, kernel }),
    prepareDelivery: (input) => prepareMiniTaskDelivery({ ...input, task, kernel }),
    confirmDelivery: (input) => confirmMiniTaskDelivery({ ...input, task, kernel }),
    authorizeDelivery: (input) => authorizeMiniTaskDelivery({ ...input, task, kernel }),
    executeDelivery: (input) => executeMiniTaskDelivery({ ...input, task, kernel }),
    prepareAResume: (input) => prepareAResumePlan({ ...input, task, kernel }),
    confirmAResume: (input) => confirmAResumePlan({ ...input, task, kernel }),
    authorizeAResume: (input) => authorizeAResumePlan({ ...input, task, kernel }),
    resumeA: (input) => resumeTaskA({ ...input, task, kernel }),
  });
}

function recordCapturedMiniTaskQuality({ task, kernel, receipt, testFact, implementationReview, userRecord, acTrace, coverageLimits, skipReasons, remainingRisks, findingDispositions, humanConfirmation = null }) {
  const snapshot = captureExecutionSnapshot(openCurrentTaskWorkspace(task).worktreeRoot, task.identity.taskId);
  if (snapshot.tree !== receipt.snapshot_tree) throw new Error("mini-task evidence snapshot changed before review record");
  const userResult = assertMiniTaskUserResult(task, userRecord, receipt.snapshot_tree, receipt);
  const trace = assertAcTraceForMiniTask(acTrace, { task, receipt });
  const reviewBinding = canonicalReviewBinding(task, implementationReview, MINI_REVIEW_KIND.implementation, receipt.snapshot_tree, "implementation review");
  const dispositionEvidence = writeMiniFindingDispositionEvidence({
    task, kernel, reviewResult: reviewBinding.value, dispositions: findingDispositions,
    reviewBinding, label: "mini-task implementation review",
  });
  const reviewFact = kernel.publishVNextQualityFact("verify-code", {
    kind: "review", status: reviewBinding.status, subject: "independent_review",
    evidence: [{ ref: reviewBinding.ref, sha256: reviewBinding.sha256, evidence_type: "review_result" }],
  });
  const packet = {
    schema_version: "workflowhub-mini-task-implementation-evidence.v1",
    task_id: task.identity.taskId,
    snapshot_tree: receipt.snapshot_tree,
    test_receipt: { ref: receipt.receipt_ref, sha256: receipt.receipt_hash },
    implementation_review: { ref: reviewBinding.ref, sha256: reviewBinding.sha256, status: reviewBinding.status },
    finding_dispositions: dispositionEvidence.facts,
    user_result: { ref: userRecord.ref, sha256: userRecord.sha256 },
    ac_trace: trace,
    coverage_limits: [...coverageLimits],
    skip_reasons: [...skipReasons],
    remaining_risks: [...remainingRisks],
  };
  const packetRaw = `${JSON.stringify(packet, null, 2)}\n`;
  const packetRef = `quality/evidence/mini-task-implementation/${hash(packetRaw)}.json`;
  const packetRecord = kernel.publishCanonicalRecord(packetRef, packetRaw);
  const acceptanceStatus = (facts) => facts.status === "not_applicable"
    || (facts.status === "recorded" && facts.items.every((item) => item.status !== "needs_human"))
    ? "passed"
    : "missing";
  const publishMiniAcceptanceFact = (subject, status) => kernel.publishVNextQualityFact("verify-code", {
    kind: "acceptance_criterion", status, subject,
    evidence: [{ ref: packetRecord.ref, sha256: packetRecord.sha256, evidence_type: "acceptance_evidence" }],
  });
  let humanConfirmationStatus = "missing";
  publishMiniAcceptanceFact("finding_dispositions", acceptanceStatus(dispositionEvidence.facts));
  const acceptanceCriteriaStatus = receipt.exit_code === 0
    && userResult.status === "verified"
    && trace.entries.every((entry) => entry.status === "passed")
    ? "passed"
    : "missing";
  const structuredExceptionLists = [coverageLimits, skipReasons, remainingRisks].every((values) => Array.isArray(values)
    && values.every((value) => typeof value === "string" && value.trim() !== "" && value.trim().toLowerCase() !== "unknown"));
  const exceptionsStatus = structuredExceptionLists && acceptanceStatus(dispositionEvidence.facts) === "passed" ? "passed" : "missing";
  publishMiniAcceptanceFact("acceptance_criteria", acceptanceCriteriaStatus);
  publishMiniAcceptanceFact("exceptions", exceptionsStatus);
  if (humanConfirmation !== null) {
    const confirmation = object(humanConfirmation, "mini-task human confirmation");
    if (!["accepted", "rejected"].includes(confirmation.decision)) throw new TypeError("mini-task human confirmation decision is invalid");
    text(confirmation.subject_ref, "mini-task human confirmation subject_ref");
    kernel.publishHumanConfirmation("verify-code", {
      decision: confirmation.decision,
      subject_ref: confirmation.subject_ref,
    });
    humanConfirmationStatus = confirmation.decision === "accepted" ? "passed" : "failed";
  } else {
    const missingRaw = `${JSON.stringify({
      schema_version: "workflowhub-mini-task-human-confirmation-missing.v1",
      task_id: task.identity.taskId,
      snapshot_tree: receipt.snapshot_tree,
      status: "missing",
      reason: "explicit human confirmation is required before mini-task delivery close",
    }, null, 2)}\n`;
    const missingRecord = kernel.publishCanonicalRecord(`quality/evidence/mini-task-human-confirmation-missing/${hash(missingRaw)}.json`, missingRaw);
    kernel.publishVNextQualityFact("verify-code", {
      kind: "confirmation", status: "missing", subject: "human_confirmation",
      evidence: [{ ref: missingRecord.ref, sha256: missingRecord.sha256, evidence_type: "human_confirmation" }],
    });
  }
  const implementationFact = kernel.publishVNextQualityFact("build-code", {
    kind: "review", status: reviewBinding.status, subject: "mini_task_implementation_review",
    evidence: [{ ref: packetRecord.ref, sha256: packetRecord.sha256, evidence_type: "review_result" }],
  });
  const qualityReady = reviewBinding.status === "recorded"
    && receipt.exit_code === 0
    && acceptanceStatus(dispositionEvidence.facts) === "passed"
    && acceptanceCriteriaStatus === "passed"
    && exceptionsStatus === "passed"
    && humanConfirmationStatus === "passed";
  return Object.freeze({
    status: qualityReady ? "ready" : "incomplete",
    test_fact: testFact,
    review_fact: reviewFact,
    implementation_fact: implementationFact,
    evidence_ref: packetRecord.ref,
    evidence_hash: packetRecord.sha256,
    snapshot_tree: receipt.snapshot_tree,
    snapshot_commit: receipt.snapshot_commit,
    user_result_ref: userRecord.ref,
  });
}

export function recordMiniTaskQuality({ task: taskHandle, kernel: taskKernel, workspace, testCommand, receiptRef = "quality/tests/mini-task-implementation.json", outputRef = "quality/tests/output/mini-task-implementation.output", implementationReview, userResult, acTrace = null, coverageLimits = [], skipReasons = [], remainingRisks = [], findingDispositions, humanConfirmation = null, capturedReceipt = null, capturedUserResult = null } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task quality TaskHandle/TaskKernel mismatch");
  text(testCommand, "testCommand");
  if (!Array.isArray(coverageLimits) || !Array.isArray(skipReasons) || !Array.isArray(remainingRisks)) throw new TypeError("mini-task quality limits must be arrays");
  const safeWorkspace = workspace ?? openCurrentTaskWorkspace(task);
  const receipt = capturedReceipt ?? createCanonicalReceiptWriter({ task, workspace: safeWorkspace, stage: "verify-code", component: "mini-task-focused-tests" }).captureTests({ command: testCommand, receiptRef, outputRef });
  const trace = assertAcTraceForMiniTask(acTrace, { task, receipt });
  const userRecord = capturedUserResult ?? publishMiniTaskUserResult({ task, kernel, receipt, userResult });
  assertMiniTaskUserResult(task, userRecord, receipt.snapshot_tree);
  const testFact = kernel.publishVNextQualityFact("verify-code", {
    kind: "test", status: receipt.exit_code === 0 ? "passed" : "failed", subject: "full_tests_fresh",
    evidence: [{ ref: receipt.receipt_ref, sha256: receipt.receipt_hash, evidence_type: "test_receipt" }],
  });
  return recordCapturedMiniTaskQuality({ task, kernel, receipt, testFact, implementationReview, userRecord, acTrace: trace, coverageLimits, skipReasons, remainingRisks, findingDispositions, humanConfirmation });
}

export async function runMiniTaskImplementationReview({ task: taskHandle, kernel: taskKernel, workspace, testCommand, receiptRef = "quality/tests/mini-task-implementation.json", outputRef = "quality/tests/output/mini-task-implementation.output", userResult, acTrace = null, coverageLimits = [], skipReasons = [], remainingRisks = [], findingDispositions, humanConfirmation = null, reviewRunner, runReview, hostProvider } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task implementation review TaskHandle/TaskKernel mismatch");
  text(hostProvider, "hostProvider");
  const safeWorkspace = workspace ?? openCurrentTaskWorkspace(task);
  text(testCommand, "testCommand");
  if (!Array.isArray(coverageLimits) || !Array.isArray(skipReasons) || !Array.isArray(remainingRisks)) throw new TypeError("mini-task quality limits must be arrays");
  const receipt = createCanonicalReceiptWriter({ task, workspace: safeWorkspace, stage: "verify-code", component: "mini-task-focused-tests" }).captureTests({ command: testCommand, receiptRef, outputRef });
  const trace = assertAcTraceForMiniTask(acTrace, { task, receipt });
  const userRecord = publishMiniTaskUserResult({ task, kernel, receipt, userResult });
  const testFact = kernel.publishVNextQualityFact("verify-code", {
    kind: "test", status: receipt.exit_code === 0 ? "passed" : "failed", subject: "full_tests_fresh",
    evidence: [{ ref: receipt.receipt_ref, sha256: receipt.receipt_hash, evidence_type: "test_receipt" }],
  });
  let outcome;
  if (receipt.exit_code !== 0) {
    outcome = { status: "unavailable", error_code: "FOCUSED_TEST_FAILED", recovery: "review_not_dispatched" };
  } else {
    const runner = reviewRunnerFor({ reviewRunner, runReview });
    try {
      const materials = {
        ...currentMiniTaskMaterials(task, safeWorkspace.worktreeRoot),
        test_evidence: { receipt_ref: receipt.receipt_ref, receipt_hash: receipt.receipt_hash, command: testCommand, suite_scope: "mini-task focused tests", coverage_classes: ["focused"] },
        ac_trace: trace,
        user_result: { ref: userRecord.ref, sha256: userRecord.sha256 },
        coverage_limits: [...coverageLimits],
        skip_reasons: [...skipReasons],
        remaining_risks: [...remainingRisks],
      };
      outcome = await runner(reviewRequest(task, safeWorkspace, MINI_REVIEW_KIND.implementation, materials, hostProvider));
    } catch (error) {
      outcome = { status: "unavailable", error_code: error?.code ?? "REVIEW_UNAVAILABLE", error: { message: String(error?.message ?? error) } };
    }
  }
  const snapshot = captureExecutionSnapshot(safeWorkspace.worktreeRoot, task.identity.taskId);
  const implementationReview = resultBindingOrUnavailable({ task, kernel, runResult: outcome, reviewKind: MINI_REVIEW_KIND.implementation, snapshotTree: snapshot.tree });
  const quality = recordCapturedMiniTaskQuality({ task, kernel, receipt, testFact, implementationReview, userRecord, acTrace: trace, coverageLimits, skipReasons, remainingRisks, findingDispositions, humanConfirmation });
  return Object.freeze({ ...quality, outcome });
}
