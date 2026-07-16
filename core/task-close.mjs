import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

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

function confirmationFields(options) {
  if (options.confirmation !== undefined) {
    const value = plain(options.confirmation, "close confirmation");
    return { outcome: value.outcome, planHash: value.plan_hash, confirmationRef: value.confirmation_ref };
  }
  return {
    outcome: options.confirmationOutcome,
    planHash: options.planHash,
    confirmationRef: options.humanConfirmationRef,
  };
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
  const { outcome, planHash: confirmedHash, confirmationRef } = confirmationFields(options);
  if (outcome !== "confirmed") return Object.freeze({ status: "blocked", confirmationOutcome: outcome });

  const task = assertTaskHandle(options.task);
  const kernel = assertTaskKernel(options.kernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  const plan = validatePlan(options.plan, task);
  const planRaw = canonical(plan);
  const planHash = sha256(planRaw);
  if (!HASH.test(confirmedHash ?? "") || confirmedHash !== planHash) {
    throw new Error("close confirmation plan hash mismatch");
  }
  if (typeof confirmationRef !== "string" || confirmationRef.trim() === "") {
    throw new TypeError("close confirmation_ref is required");
  }
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
