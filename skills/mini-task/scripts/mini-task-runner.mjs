import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter } from "../../../runtime/evidence/canonical-receipt-writer.mjs";
import { captureGitWorktreeSnapshot } from "../../../runtime/task/git-worktree-snapshot.mjs";
import { qualityFactDigest } from "../../../runtime/evidence/quality-fact.mjs";
import { assertTaskHandle, assertTaskKernel } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";
import {
  closePlanHash,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  prepareDeliveryClosePlan,
} from "../../../core/task-close.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/i;
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)(?!$).+/;
const MINI_REVIEW_RESULT = /^quality\/reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
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
    if (value?.schema_version !== "quality-fact.v1"
        || value.task_id !== task.identity.taskId
        || !/^revision-[a-f0-9]{64}$/.test(value.material_revision ?? "")
        || !OID.test(value.snapshot_tree ?? "")
        || !["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(value.stage)
        || value.kind !== "review"
        || !MINI_REVIEW_STATUSES.has(value.status)
        || typeof value.subject !== "string"
        || !Array.isArray(value.evidence)
        || value.evidence.length === 0
        || !Number.isFinite(Date.parse(value.recorded_at))
        || ref !== `quality/facts/${qualityFactDigest(value)}.json`
        || value.fact_id !== `quality-${qualityFactDigest(value)}`) return null;
    return value;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    return null;
  }
}

function latestMiniQualityFacts(task) {
  const facts = task.listCanonicalQualityFactRefs()
    .map((ref) => ({ ref, value: readQualityFact(task, ref) }))
    .filter(({ value }) => ["mini_task_design_review", "mini_task_implementation_review"].includes(value?.subject));
  const current = new Map();
  for (const item of facts) {
    const previous = current.get(item.value.subject);
    if (!previous || Date.parse(item.value.recorded_at) > Date.parse(previous.value.recorded_at)
        || (item.value.recorded_at === previous.value.recorded_at && item.ref > previous.ref)) current.set(item.value.subject, item);
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
  return `revision-${hash(JSON.stringify(values))}`;
}

function readBoundJson(task, binding, label) {
  if (!binding || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")) throw new Error(`${label} evidence binding is invalid`);
  const raw = task.readRecord(binding.ref);
  if (hash(raw) !== binding.sha256) throw new Error(`${label} evidence hash mismatch`);
  return JSON.parse(raw);
}

function assertMiniTaskQualityForDelivery(task) {
  const workspace = openCurrentTaskWorkspace(task);
  const snapshot = captureGitWorktreeSnapshot(workspace.worktreeRoot);
  const facts = latestMiniQualityFacts(task);
  const design = facts.get("mini_task_design_review")?.value;
  if (!design || !MINI_REVIEW_CLOSE_STATUSES.has(design.status)) throw new Error("mini-task design review is incomplete for the current materials");
  if (design.material_revision !== currentMaterialRevision(task, workspace.worktreeRoot)) {
    throw new Error("mini-task design review is stale for the current materials");
  }
  const designResult = readBoundJson(task, design.evidence[0], "mini-task design review");
  if (designResult.task_id !== task.identity.taskId
      || designResult.review_kind !== "mini_task.design"
      || designResult.snapshot_tree !== design.snapshot_tree) {
    throw new Error("mini-task design review is not bound to its frozen design snapshot");
  }

  const implementation = facts.get("mini_task_implementation_review")?.value;
  if (!implementation || !MINI_REVIEW_CLOSE_STATUSES.has(implementation.status)) throw new Error("mini-task implementation review is incomplete for the current snapshot");
  const packet = readBoundJson(task, implementation.evidence[0], "mini-task implementation evidence");
  if (packet.schema_version !== "workflowhub-mini-task-implementation-evidence.v1"
      || packet.task_id !== task.identity.taskId
      || packet.snapshot_tree !== snapshot.tree
      || !Array.isArray(packet.coverage_limits)
      || !Array.isArray(packet.skip_reasons)
      || !Array.isArray(packet.remaining_risks)) throw new Error("mini-task implementation evidence is incomplete or stale");
  if (!MINI_REVIEW_CLOSE_STATUSES.has(packet.implementation_review?.status ?? implementation.status)) throw new Error("mini-task implementation review is incomplete");
  const implementationResult = readBoundJson(task, packet.implementation_review, "mini-task implementation review");
  if (implementationResult.task_id !== task.identity.taskId
      || implementationResult.review_kind !== "mini_task.implementation"
      || implementationResult.snapshot_tree !== snapshot.tree) throw new Error("mini-task implementation review is not bound to the current snapshot");
  const testReceipt = readBoundJson(task, packet.test_receipt, "mini-task focused test");
  if (testReceipt.schema_version !== "workflowhub-receipt.v1"
      || testReceipt.task_id !== task.identity.taskId
      || testReceipt.exit_code !== 0
      || testReceipt.snapshot_tree !== snapshot.tree) throw new Error("mini-task focused test evidence is incomplete or stale");
  const userResult = readBoundJson(task, packet.user_result, "mini-task user result");
  if (userResult.schema_version !== "workflowhub-mini-task-user-result.v1"
      || userResult.task_id !== task.identity.taskId
      || userResult.status !== "verified"
      || userResult.snapshot_tree !== snapshot.tree) throw new Error("mini-task real user result is incomplete or stale");
  if (!packet.ac_trace || typeof packet.ac_trace !== "object" || Array.isArray(packet.ac_trace)) throw new Error("mini-task AC trace is incomplete");
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

function progressState(root, step) {
  const branch = currentBranch(root);
  const head = currentHead(root);
  const status = currentStatus(root);
  const snapshot = captureGitWorktreeSnapshot(root);
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
  const snapshot = captureGitWorktreeSnapshot(root);
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
        const before = progressState(root, step);
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
        const after = progressState(root, step);
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
  return prepareDeliveryClosePlan({ task, kernel, delivery });
}

export function confirmMiniTaskDelivery({ task: taskHandle, kernel: taskKernel, plan, outcome = "confirmed" } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task TaskHandle/TaskKernel mismatch");
  return confirmClosePlan({ task, kernel, plan, outcome });
}

export function recordMiniTaskDesignReview({ task: taskHandle, kernel: taskKernel, review } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task design review TaskHandle/TaskKernel mismatch");
  const value = object(review, "design review");
  const ref = text(value.ref, "design review ref");
  if (!MINI_REVIEW_RESULT.test(ref) || !HASH.test(value.sha256 ?? "")) throw new TypeError("design review must bind a canonical review result");
  const raw = task.readRecord(ref);
  if (hash(raw) !== value.sha256) throw new Error("design review hash mismatch");
  const result = JSON.parse(raw);
  const snapshot = captureGitWorktreeSnapshot(openCurrentTaskWorkspace(task).worktreeRoot);
  if (result.task_id !== task.identity.taskId || result.review_kind !== "mini_task.design" || result.snapshot_tree !== snapshot.tree) {
    throw new Error("design review is not bound to the current mini-task materials");
  }
  const status = value.status ?? "passed";
  if (!MINI_REVIEW_STATUSES.has(status)) throw new TypeError("design review status is invalid");
  return kernel.publishVNextQualityFact("build-code", {
    kind: "review", status, subject: "mini_task_design_review",
    evidence: [{ ref, sha256: value.sha256, evidence_type: "review_result" }],
  });
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

export function recordMiniTaskQuality({ task: taskHandle, kernel: taskKernel, workspace, testCommand, receiptRef = "quality/tests/mini-task-implementation.json", outputRef = "quality/tests/output/mini-task-implementation.output", implementationReview, userResult, acTrace = null, coverageLimits = [], skipReasons = [], remainingRisks = [] } = {}) {
  const task = assertTaskHandle(taskHandle); const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("mini-task quality TaskHandle/TaskKernel mismatch");
  text(testCommand, "testCommand");
  const review = object(implementationReview, "implementationReview");
  const reviewRef = text(review.ref, "implementationReview.ref");
  if (!MINI_REVIEW_RESULT.test(reviewRef) || !HASH.test(review.sha256 ?? "")) throw new TypeError("implementationReview must bind a canonical review result");
  const result = object(userResult, "userResult");
  if (result.status !== "verified") throw new Error("mini-task real user result must be verified before delivery");
  if (!acTrace || typeof acTrace !== "object" || Array.isArray(acTrace)) throw new Error("mini-task AC trace is required");
  if (!Array.isArray(coverageLimits) || !Array.isArray(skipReasons) || !Array.isArray(remainingRisks)) throw new TypeError("mini-task quality limits must be arrays");
  const safeWorkspace = workspace ?? openCurrentTaskWorkspace(task);
  const writer = createCanonicalReceiptWriter({ task, workspace: safeWorkspace, stage: "verify-code", component: "mini-task-focused-tests" });
  const receipt = writer.captureTests({ command: testCommand, receiptRef, outputRef });
  const testFact = kernel.publishVNextQualityFact("verify-code", {
    kind: "test", status: receipt.exit_code === 0 ? "passed" : "failed", subject: "full_tests_fresh",
    evidence: [{ ref: receipt.receipt_ref, sha256: receipt.receipt_hash, evidence_type: "test_receipt" }],
  });
  const reviewRaw = task.readRecord(reviewRef);
  if (hash(reviewRaw) !== review.sha256) throw new Error("implementation review hash mismatch");
  const reviewValue = JSON.parse(reviewRaw);
  if (reviewValue.task_id !== task.identity.taskId
      || reviewValue.review_kind !== "mini_task.implementation"
      || reviewValue.snapshot_tree !== receipt.snapshot_tree) throw new Error("implementation review is not bound to the current mini-task snapshot");
  const reviewStatus = review.status ?? "passed";
  if (!MINI_REVIEW_STATUSES.has(reviewStatus)) throw new TypeError("implementation review status is invalid");
  const reviewFact = kernel.publishVNextQualityFact("verify-code", {
    kind: "review", status: reviewStatus, subject: "independent_review",
    evidence: [{ ref: reviewRef, sha256: review.sha256, evidence_type: "review_result" }],
  });
  const snapshot = captureGitWorktreeSnapshot(safeWorkspace.worktreeRoot);
  if (snapshot.tree !== receipt.snapshot_tree) throw new Error("mini-task user result snapshot differs from focused test snapshot");
  const userRaw = `${JSON.stringify({ ...result, schema_version: "workflowhub-mini-task-user-result.v1", task_id: task.identity.taskId, snapshot_tree: snapshot.tree }, null, 2)}\n`;
  const userRef = `quality/evidence/mini-task-user-result/${hash(userRaw)}.json`;
  const userRecord = kernel.publishCanonicalRecord(userRef, userRaw);
  const packet = {
    schema_version: "workflowhub-mini-task-implementation-evidence.v1",
    task_id: task.identity.taskId,
    snapshot_tree: snapshot.tree,
    test_receipt: { ref: receipt.receipt_ref, sha256: receipt.receipt_hash },
    implementation_review: { ref: reviewRef, sha256: review.sha256, status: reviewStatus },
    user_result: { ref: userRecord.ref, sha256: userRecord.sha256 },
    ac_trace: acTrace,
    coverage_limits: [...coverageLimits],
    skip_reasons: [...skipReasons],
    remaining_risks: [...remainingRisks],
  };
  const packetRaw = `${JSON.stringify(packet, null, 2)}\n`;
  const packetRef = `quality/evidence/mini-task-implementation/${hash(packetRaw)}.json`;
  const packetRecord = kernel.publishCanonicalRecord(packetRef, packetRaw);
  const implementationFact = kernel.publishVNextQualityFact("build-code", {
    kind: "review", status: reviewStatus, subject: "mini_task_implementation_review",
    evidence: [{ ref: packetRecord.ref, sha256: packetRecord.sha256, evidence_type: "review_result" }],
  });
  return Object.freeze({ status: receipt.exit_code === 0 && MINI_REVIEW_CLOSE_STATUSES.has(reviewStatus) ? "ready" : "incomplete", test_fact: testFact, review_fact: reviewFact, implementation_fact: implementationFact, evidence_ref: packetRecord.ref, evidence_hash: packetRecord.sha256, snapshot_tree: snapshot.tree, snapshot_commit: receipt.snapshot_commit, user_result_ref: userRecord.ref });
}
