import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "./task-kernel.mjs";
import { createTaskWorktreeRemoval } from "./workspace.mjs";

const HASH = /^[a-f0-9]{64}$/;
const STEP_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62})$/;
const GOVERNED_EXECUTORS = new WeakSet();

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

/** Persist one immutable, plan-bound close decision. */
export function confirmClosePlan({ task: taskHandle, kernel: taskKernel, plan, outcome, now = () => new Date().toISOString() } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close confirmation TaskHandle/TaskKernel mismatch");
  validatePlan(plan, task);
  if (!new Set(["confirmed", "rejected", "timeout"]).has(outcome)) throw new TypeError("close confirmation outcome must be confirmed, rejected, or timeout");
  if (typeof now !== "function") throw new TypeError("close confirmation now must be a function");
  const planHash = closePlanHash(plan);
  const ref = `operations/close/confirmations/${planHash}/${randomUUID()}.json`;
  const confirmation = {
    schema_version: "task-close-confirmation.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    outcome,
    confirmed_at: now(),
  };
  createOrVerify(task, ref, confirmation, "close confirmation");
  return Object.freeze({ ref, confirmation: Object.freeze(confirmation) });
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
    status: "completed",
    completion_mode: mode,
    physical_state_hash: sha256(physical),
    physical_state: structuredClone(observation),
    completed_at: now(),
  };
}

function git(cwd, args, { allowFailure = false } = {}) {
  const result = execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"] });
  return String(result).trim();
}

function gitResult(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { ok: result.status === 0, stdout: String(result.stdout ?? "").trim(), stderr: String(result.stderr ?? "").trim() };
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

function treeEntry(root, commit, path) {
  const result = gitResult(root, ["ls-tree", "-z", commit, "--", path]);
  if (!result.ok || result.stdout === "") return null;
  const match = /^([0-7]{6}) (blob|tree) ([a-f0-9]{40})\t([^\0]+)\0?$/i.exec(result.stdout);
  if (!match || match[4] !== path) return null;
  return Object.freeze({ mode: match[1], type: match[2], oid: match[3].toLowerCase() });
}

function validateDeliveryPlan(plan, task, kernel) {
  validatePlan(plan, task);
  if (kernel.task !== task) throw new Error("delivery close TaskHandle/TaskKernel mismatch");
  const delivery = plain(plan.delivery, "delivery close plan");
  const required = ["target_repo_root", "worktree_root", "task_branch", "target_branch", "remote", "task_commit", "spec_source_path", "spec_archive_path"];
  if (required.some((key) => typeof delivery[key] !== "string" || delivery[key] === "")) throw new TypeError("delivery close plan is missing required fields");
  if (resolve(delivery.target_repo_root) !== task.manifest.target_repo_root) throw new Error("delivery close target repository mismatch");
  const accepted = kernel.readAccepted("make-decision");
  if (resolve(delivery.worktree_root) !== resolve(accepted.facts.worktree_root)) throw new Error("delivery close worktree does not match accepted make-decision");
  oid(delivery.task_commit, "delivery task_commit");
  repositoryPath(delivery.spec_source_path, "delivery spec_source_path");
  repositoryPath(delivery.spec_archive_path, "delivery spec_archive_path");
  if (delivery.spec_source_path === delivery.spec_archive_path) throw new Error("delivery spec source and archive paths must differ");
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
  const keys = new Set(["schema_version", "task_id", "plan_hash", "outcome", "confirmed_at"]);
  if (Object.keys(confirmation).some((key) => !keys.has(key))) throw new Error("close confirmation contains unknown fields");
  if (confirmation.schema_version !== "task-close-confirmation.v1" || confirmation.task_id !== task.identity.taskId || !Number.isFinite(Date.parse(confirmation.confirmed_at))) throw new Error("close confirmation identity is invalid");
  if (!HASH.test(confirmation.plan_hash ?? "") || confirmation.plan_hash !== planHash) throw new Error("close confirmation plan hash mismatch");
  return confirmation;
}

const DELIVERY_STEPS = Object.freeze([
  ["commit-delivery", "commit-delivery"],
  ["archive-spec", "archive-spec"],
  ["merge-task-branch", "merge-task-branch"],
  ["push-target-branch", "push-target-branch"],
  ["remove-task-worktree", "remove-task-worktree"],
  ["remove-task-branch", "remove-task-branch"],
]);

/** Freeze the concrete close actions before asking for their independent authorization. */
export function prepareDeliveryClosePlan({ task: taskHandle, kernel: taskKernel, delivery: requested } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("delivery close TaskHandle/TaskKernel mismatch");
  const accepted = kernel.readAccepted("make-decision");
  const input = plain(requested, "delivery close input");
  const root = task.manifest.target_repo_root;
  if (git(root, ["rev-parse", "--show-toplevel"]) !== root) throw new Error("task target repository must be the Git toplevel");
  const worktree = resolve(accepted.facts.worktree_root);
  if (!existsSync(worktree)) throw new Error("accepted task worktree does not exist");
  if (git(worktree, ["status", "--porcelain"]) !== "") throw new Error("task worktree has uncommitted delivery changes");
  const taskCommit = oid(input.task_commit, "delivery task_commit");
  const branchTip = gitResult(root, ["rev-parse", "--verify", `refs/heads/${input.task_branch}`]);
  if (!branchTip.ok || branchTip.stdout.toLowerCase() !== taskCommit) throw new Error("task commit must be the clean task branch tip before archive");
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
    },
    steps: DELIVERY_STEPS.map(([step_id, operation]) => ({ step_id, operation })),
  };
  const delivery = validateDeliveryPlan(plan, task, kernel);
  if (!gitResult(root, ["cat-file", "-e", `${delivery.task_commit}^{commit}`]).ok) throw new Error("task commit does not exist");
  if (!gitResult(root, ["cat-file", "-e", `${delivery.task_commit}:${delivery.spec_source_path}`]).ok) throw new Error("accepted spec source does not exist in the task commit");
  if (gitResult(root, ["cat-file", "-e", `${delivery.task_commit}:${delivery.spec_archive_path}`]).ok) throw new Error("spec is already archived in the task commit");
  if (!gitResult(root, ["rev-parse", "--verify", `refs/heads/${delivery.target_branch}`]).ok) throw new Error("target branch does not exist");
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
  const localTarget = gitResult(root, ["rev-parse", "--verify", `refs/heads/${delivery.target_branch}`]);
  const commitExists = gitResult(root, ["cat-file", "-e", `${delivery.task_commit}^{commit}`]).ok;
  const merged = localTarget.ok && commitExists && gitResult(root, ["merge-base", "--is-ancestor", delivery.task_commit, localTarget.stdout]).ok;
  const archivePathExists = localTarget.ok && gitResult(root, ["cat-file", "-e", `${delivery.target_branch}:${delivery.spec_archive_path}`]).ok;
  const sourcePathAbsent = localTarget.ok && !gitResult(root, ["cat-file", "-e", `${delivery.target_branch}:${delivery.spec_source_path}`]).ok;
  const archiveLog = localTarget.ok ? gitResult(root, ["log", "-1", "--format=%H", delivery.target_branch, "--", delivery.spec_archive_path]) : { ok: false, stdout: "" };
  const archiveCommit = archiveLog.ok && /^[a-f0-9]{40}$/i.test(archiveLog.stdout) ? archiveLog.stdout.toLowerCase() : null;
  const archiveParent = archiveCommit === null ? { ok: false, stdout: "" } : gitResult(root, ["rev-parse", `${archiveCommit}^`]);
  const archiveCommitIncluded = archiveCommit !== null && archiveParent.ok && archiveParent.stdout.toLowerCase() === delivery.task_commit && gitResult(root, ["merge-base", "--is-ancestor", archiveCommit, localTarget.stdout]).ok;
  const sourceEntry = treeEntry(root, delivery.task_commit, delivery.spec_source_path);
  const archiveEntry = archiveCommit === null ? null : treeEntry(root, archiveCommit, delivery.spec_archive_path);
  const archiveBlobPreserved = sourceEntry !== null && archiveEntry !== null && sourceEntry.type === "blob" && archiveEntry.type === "blob" && sourceEntry.mode === archiveEntry.mode && sourceEntry.oid === archiveEntry.oid;
  const archiveDiff = archiveCommit === null ? { ok: false, stdout: "" } : gitResult(root, ["diff-tree", "--no-commit-id", "--name-status", "--find-renames=100%", "-r", "-z", `${archiveCommit}^`, archiveCommit]);
  const archiveChanges = archiveDiff.ok ? archiveDiff.stdout.split("\0").filter((value) => value !== "") : [];
  const archiveOnlyRename = archiveBlobPreserved && archiveChanges.length === 3 && archiveChanges[0] === "R100" && archiveChanges[1] === delivery.spec_source_path && archiveChanges[2] === delivery.spec_archive_path;
  const remote = gitResult(root, ["ls-remote", "--exit-code", delivery.remote, `refs/heads/${delivery.target_branch}`]);
  const remoteTarget = remote.ok ? remote.stdout.split(/\s+/)[0]?.toLowerCase() : null;
  const pushed = localTarget.ok && /^[a-f0-9]{40}$/.test(remoteTarget ?? "") && remoteTarget === localTarget.stdout.toLowerCase();
  const listedWorktrees = gitResult(root, ["worktree", "list", "--porcelain"]).stdout.split("\n").filter((line) => line.startsWith("worktree ")).map((line) => resolve(line.slice(9)));
  const worktreeCleanup = !existsSync(delivery.worktree_root) && !listedWorktrees.includes(resolve(delivery.worktree_root));
  const branchCleanup = !gitResult(root, ["show-ref", "--verify", "--quiet", `refs/heads/${delivery.task_branch}`]).ok;
  const facts = {
    delivery_committed: commitExists,
    archive: archivePathExists && sourcePathAbsent && archiveCommitIncluded && archiveBlobPreserved && archiveOnlyRename,
    archive_commit: archiveCommit,
    archive_blob_preserved: archiveBlobPreserved,
    archive_only_rename: archiveOnlyRename,
    merge: merged,
    push: pushed,
    local_target_oid: localTarget.ok ? localTarget.stdout.toLowerCase() : null,
    remote_target_oid: remoteTarget,
    worktree_cleanup: worktreeCleanup,
    branch_cleanup: branchCleanup,
  };
  const missing = [["delivery", facts.delivery_committed], ["archive", facts.archive], ["merge", facts.merge], ["push", facts.push], ["worktree_cleanup", facts.worktree_cleanup], ["branch_cleanup", facts.branch_cleanup]].filter(([, done]) => !done).map(([name]) => name);
  return Object.freeze({ schema_version: "task-close-delivery-state.v1", status: missing.length === 0 ? "ready" : "incomplete", missing: Object.freeze(missing), facts: Object.freeze(facts) });
}

/** Write completed only after every plan-bound delivery fact is currently true. */
export async function completeDeliveryClosePlan({ task: taskHandle, kernel: taskKernel, plan, closeConfirmationRef, now = () => new Date().toISOString() } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  validateDeliveryPlan(plan, task, kernel);
  const planHash = closePlanHash(plan);
  const prepared = JSON.parse(task.readRecord(`operations/close/plans/${planHash}/plan.json`));
  if (prepared.schema_version !== "task-close-plan-record.v1" || prepared.task_id !== task.identity.taskId || prepared.plan_hash !== planHash || canonical(prepared.plan) !== canonical(plan)) throw new Error("prepared close plan record is invalid");
  const confirmation = closeConfirmation(task, planHash, closeConfirmationRef);
  if (confirmation.outcome !== "confirmed") return Object.freeze({ status: "blocked", confirmationOutcome: confirmation.outcome });
  if (typeof now !== "function") throw new TypeError("close now must be a function");
  return task.withRecordLock("locks/close.execution.lock", async () => {
    const existing = readOptional(task, "operations/close/completed.json");
    if (existing !== undefined) {
      const completed = JSON.parse(existing);
      if (completed.schema_version !== "task-close-completed.v1" || completed.task_id !== task.identity.taskId || completed.plan_hash !== planHash || completed.status !== "completed") throw new Error("task close completed by a conflicting or invalid plan");
      return Object.freeze(completed);
    }
    const state = inspectDeliveryCloseState({ task, kernel, plan });
    if (state.status !== "ready") throw new Error(`delivery close is incomplete: ${state.missing.join(", ")}`);
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
        const acceptedDecision = safeKernel.readAccepted("make-decision");
        const acceptedBinding = Object.freeze({
          taskId: acceptedDecision.accepted.task_id,
          stage: acceptedDecision.accepted.stage,
          worktreeRoot: acceptedDecision.facts.worktree_root,
          baselineCommit: acceptedDecision.facts.baseline_commit,
        });
        removal ??= createTaskWorktreeRemoval(safeTask, acceptedBinding);
        return removal;
      }
      throw new Error(`unsupported governed close operation: ${step.operation}`);
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
  const planRaw = canonical(plan);
  const planHash = sha256(planRaw);
  const confirmationRef = options.closeConfirmationRef;
  const confirmationPrefix = `operations/close/confirmations/${planHash}/`;
  if (typeof confirmationRef !== "string" || !confirmationRef.startsWith(confirmationPrefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(confirmationRef)) {
    throw new TypeError("canonical plan-bound closeConfirmationRef is required");
  }
  const confirmation = plain(JSON.parse(task.readRecord(confirmationRef)), "close confirmation");
  const confirmationKeys = new Set(["schema_version", "task_id", "plan_hash", "outcome", "confirmed_at"]);
  if (Object.keys(confirmation).some((key) => !confirmationKeys.has(key))) throw new Error("close confirmation contains unknown fields");
  if (confirmation.schema_version !== "task-close-confirmation.v1" || confirmation.task_id !== task.identity.taskId || !Number.isFinite(Date.parse(confirmation.confirmed_at))) {
    throw new Error("close confirmation identity is invalid");
  }
  if (!HASH.test(confirmation.plan_hash ?? "") || confirmation.plan_hash !== planHash) {
    throw new Error("close confirmation plan hash mismatch");
  }
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

    for (const step of plan.steps) {
      const executor = executorFor(executors, step);
      const recordPath = `${base}/steps/${step.step_id}.json`;
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

    if (acceptedCompletion) return Object.freeze(acceptedCompletion);
    const completion = {
      schema_version: "task-close-completed.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      status: "completed",
      completed_at: now(),
    };
    createOrVerify(task, "operations/close/completed.json", completion, "close completion");
    return Object.freeze(completion);
  });
}
