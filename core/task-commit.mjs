import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "./task-kernel.mjs";
import { captureTaskSnapshotV1Sync } from "./task-snapshot.mjs";
import { assertWorkspace } from "./workspace.mjs";
import { consumeTaskHumanConfirmation } from "./human-confirmation.mjs";

const PLAN_SCHEMA = "https://workflowhub.dev/schemas/task-commit-plan.v1.schema.json";
const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40}$/;
const PLAN_FIELDS = Object.freeze(["task_id", "release_ref", "release_hash", "lineage_hash", "parent_oid", "candidate_tree_oid", "diff_hash", "target_ref"]);
const LIVE_FIELDS = Object.freeze(["release_ref", "release_hash", "lineage_hash", "parent_oid", "candidate_tree_oid", "diff_hash", "target_ref"]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function readOptional(task, ref) {
  try { return task.readRecord(ref); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

function createOrVerify(task, ref, value, label) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const prior = readOptional(task, ref);
  if (prior !== undefined) {
    if (prior !== raw) throw new Error(`${label} conflicts with immutable record`);
    return value;
  }
  task.createRecordAtomic(ref, raw);
  return value;
}

function taskCommitPlanHash(plan) {
  const copy = { ...object(plan, "commit plan") };
  delete copy.plan_hash;
  return sha256(canonical(copy));
}

function validatePlan(plan) {
  object(plan, "commit plan");
  if (plan.schema_id !== PLAN_SCHEMA || plan.schema_version !== "1.0.0") throw new Error("commit plan schema is invalid");
  for (const field of PLAN_FIELDS) if (typeof plan[field] !== "string" || plan[field] === "") throw new TypeError(`commit plan ${field} is required`);
  for (const field of ["release_hash", "lineage_hash", "diff_hash", "plan_hash"]) if (!HASH.test(plan[field])) throw new TypeError(`commit plan ${field} is invalid`);
  for (const field of ["parent_oid", "candidate_tree_oid"]) if (!OID.test(plan[field])) throw new TypeError(`commit plan ${field} is invalid`);
  if (!plan.target_ref.startsWith("refs/")) throw new TypeError("commit plan target_ref is invalid");
  if (plan.plan_hash !== taskCommitPlanHash(plan)) throw new Error("commit plan hash mismatch");
  return plan;
}

function prepareTaskCommit(input = {}) {
  const plan = {
    schema_id: PLAN_SCHEMA,
    schema_version: "1.0.0",
    task_id: input.taskId ?? input.task_id,
    release_ref: input.releaseRef ?? input.release_ref,
    release_hash: input.releaseHash ?? input.release_hash,
    lineage_hash: input.lineageHash ?? input.lineage_hash,
    parent_oid: input.parentOid ?? input.parent_oid,
    candidate_tree_oid: input.candidateTreeOid ?? input.candidate_tree_oid,
    diff_hash: input.diffHash ?? input.diff_hash,
    target_ref: input.targetRef ?? input.target_ref,
  };
  plan.plan_hash = taskCommitPlanHash(plan);
  validatePlan(plan);
  return Object.freeze(plan);
}

function git(root, args, options = {}) {
  return String(execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"], input: options.input })).trim();
}

/** Mint the Git executor only from authentic task/workspace capabilities. */
export function createGitTaskCommitExecutor({ task: taskHandle, workspace: workspaceCapability, message } = {}) {
  const task = assertTaskHandle(taskHandle);
  const workspace = assertWorkspace(workspaceCapability);
  const root = workspace.worktreeRoot;
  const commitMessage = typeof message === "string" && message.trim() ? message.trim() : `task(${task.identity.taskId}): accepted implementation`;
  const liveState = (plan) => {
    const parentOid = git(root, ["rev-parse", "--verify", `${plan.target_ref}^{commit}`]);
    const snapshot = captureTaskSnapshotV1Sync({ taskId: task.identity.taskId, workspaceRoot: root, baselineCommit: parentOid });
    return {
      task_id: task.identity.taskId,
      release_ref: task.manifest.release_manifest_ref ?? plan.release_ref,
      release_hash: task.manifest.release_manifest_hash ?? plan.release_hash,
      lineage_hash: plan.lineage_hash,
      parent_oid: parentOid,
      candidate_tree_oid: snapshot.tree_oid,
      diff_hash: snapshot.diff_hash,
      target_ref: plan.target_ref,
    };
  };
  return Object.freeze({
    liveState,
    async execute(plan) {
      const before = liveState(plan);
      for (const field of LIVE_FIELDS) if (before[field] !== plan[field]) throw new Error(`commit authorization invalidated by ${field} drift`);
      const commitOid = git(root, ["commit-tree", plan.candidate_tree_oid, "-p", plan.parent_oid], { input: `${commitMessage}\n` });
      try {
        execFileSync("git", ["update-ref", plan.target_ref, commitOid, plan.parent_oid], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
      } catch (error) {
        throw new Error(`commit target ref CAS failed: ${error.stderr?.toString().trim() || error.message}`);
      }
      return { commit_oid: commitOid, target_ref: plan.target_ref };
    },
    async verify(result, plan) {
      if (git(root, ["rev-parse", "--verify", plan.target_ref]) !== result.commit_oid) return false;
      if (git(root, ["show", "-s", "--format=%T", result.commit_oid]) !== plan.candidate_tree_oid) return false;
      return git(root, ["show", "-s", "--format=%P", result.commit_oid]) === plan.parent_oid;
    },
    async reconcile(plan) {
      let commitOid;
      try { commitOid = git(root, ["rev-parse", "--verify", `${plan.target_ref}^{commit}`]); }
      catch { return undefined; }
      const result = { commit_oid: commitOid, target_ref: plan.target_ref };
      return await this.verify(result, plan) === true ? result : undefined;
    },
  });
}

/** Prepare the single durable commit plan from accepted verify-code truth. */
export function prepareTaskCommitOperation({ task: taskHandle, kernel: taskKernel, workspace: workspaceCapability } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const workspace = assertWorkspace(workspaceCapability);
  if (kernel.task !== task) throw new Error("commit TaskHandle/TaskKernel mismatch");
  const accepted = kernel.readAccepted("verify-code");
  const acceptedRaw = task.readRecord(accepted.accepted_ref);
  const parentOid = git(workspace.worktreeRoot, ["rev-parse", "--verify", "HEAD^{commit}"]);
  const targetRef = git(workspace.worktreeRoot, ["symbolic-ref", "-q", "HEAD"]);
  const snapshot = captureTaskSnapshotV1Sync({ taskId: task.identity.taskId, workspaceRoot: workspace.worktreeRoot, baselineCommit: parentOid });
  const plan = prepareTaskCommit({
    taskId: task.identity.taskId,
    releaseRef: task.manifest.release_manifest_ref,
    releaseHash: task.manifest.release_manifest_hash,
    lineageHash: sha256(acceptedRaw),
    parentOid,
    candidateTreeOid: snapshot.tree_oid,
    diffHash: snapshot.diff_hash,
    targetRef,
  });
  return task.withRecordLock("locks/commit.operation.lock", () => Object.freeze(createOrVerify(task, "operations/commit/plan.json", plan, "commit plan")));
}

export function confirmTaskCommitOperation({ task: taskHandle, kernel: taskKernel, confirmation, confirmationVerification = {} } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("commit TaskHandle/TaskKernel mismatch");
  const plan = validatePlan(JSON.parse(task.readRecord("operations/commit/plan.json")));
  const outcome = consumeTaskHumanConfirmation(task, confirmation, {
    purpose: "commit",
    taskId: task.identity.taskId,
    boundRef: "operations/commit/plan.json",
    boundHash: plan.plan_hash,
    verifyPlatformReadback: confirmationVerification.verifyPlatformReadback,
    verifyTrustedSignature: confirmationVerification.verifyTrustedSignature,
  });
  const record = {
    schema_version: "task-commit-confirmation.v1",
    task_id: task.identity.taskId,
    plan_hash: plan.plan_hash,
    decision: outcome.decision,
    confirmation_ref: outcome.confirmationRef,
  };
  createOrVerify(task, "operations/commit/confirmation.json", record, "commit confirmation");
  return Object.freeze(record);
}

export async function executeTaskCommitOperation({ task: taskHandle, kernel: taskKernel, workspace: workspaceCapability, executor } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const workspace = assertWorkspace(workspaceCapability);
  if (kernel.task !== task) throw new Error("commit TaskHandle/TaskKernel mismatch");
  return task.withRecordLock("locks/commit.operation.lock", async () => {
    const completedRaw = readOptional(task, "operations/commit/completed.json");
    if (completedRaw !== undefined) return Object.freeze(JSON.parse(completedRaw));
    const plan = validatePlan(JSON.parse(task.readRecord("operations/commit/plan.json")));
    const confirmationRecord = JSON.parse(task.readRecord("operations/commit/confirmation.json"));
    if (confirmationRecord.plan_hash !== plan.plan_hash || confirmationRecord.decision !== "accepted") throw new Error("commit has no accepted plan-bound confirmation");
    const accepted = kernel.readAccepted("verify-code");
    if (sha256(task.readRecord(accepted.accepted_ref)) !== plan.lineage_hash) throw new Error("commit authorization invalidated by accepted lineage drift");
    const governed = executor ?? createGitTaskCommitExecutor({ task, workspace });
    if (typeof governed.liveState !== "function" || typeof governed.execute !== "function" || typeof governed.verify !== "function") throw new TypeError("commit executor requires liveState, execute, and verify");
    const reconciled = typeof governed.reconcile === "function" ? await governed.reconcile(plan) : undefined;
    if (reconciled) {
      const completed = { schema_version: "task-commit-operation.v1", task_id: task.identity.taskId, plan_hash: plan.plan_hash, status: "completed", commit_oid: reconciled.commit_oid, target_ref: reconciled.target_ref, completion_mode: "reconciled" };
      createOrVerify(task, "operations/commit/completed.json", completed, "commit completion");
      return Object.freeze(completed);
    }
    const live = governed.liveState(plan);
    for (const field of LIVE_FIELDS) if (live[field] !== plan[field]) throw new Error(`commit authorization invalidated by ${field} drift`);
    const result = await governed.execute(plan);
    if (await governed.verify(result, plan) !== true) throw new Error("commit postcondition verification failed");
    const completed = {
      schema_version: "task-commit-operation.v1",
      task_id: task.identity.taskId,
      plan_hash: plan.plan_hash,
      status: "completed",
      commit_oid: result.commit_oid,
      target_ref: result.target_ref,
    };
    createOrVerify(task, "operations/commit/completed.json", completed, "commit completion");
    return Object.freeze(completed);
  });
}

export function taskCommitOperationStatus(taskHandle) {
  const task = assertTaskHandle(taskHandle);
  for (const [ref, status] of [["operations/commit/completed.json", "completed"], ["operations/commit/confirmation.json", "confirmed"], ["operations/commit/plan.json", "prepared"]]) {
    const raw = readOptional(task, ref);
    if (raw !== undefined) return Object.freeze({ status, record_ref: ref, record: JSON.parse(raw) });
  }
  return Object.freeze({ status: "unprepared" });
}
