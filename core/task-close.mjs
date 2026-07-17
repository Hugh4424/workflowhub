import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "./task-kernel.mjs";
import { consumeTaskHumanConfirmation } from "./human-confirmation.mjs";
import { repositoryRootForTask } from "./repository-registry.mjs";

const HASH = /^[a-f0-9]{64}$/;
const STEP_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62})$/;

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

const CLOSE_PLAN_SCHEMA_ID = "https://workflowhub.dev/schemas/task-close-plan.v1.schema.json";
function validateV1Plan(plan, task) {
  plain(plan, "close plan");
  if (plan.schema_id !== CLOSE_PLAN_SCHEMA_ID || plan.schema_version !== "1.0.0") throw new Error("close plan schema is invalid");
  if (plan.task_id !== task.identity.taskId) throw new Error("close plan task identity mismatch");
  if (!HASH.test(plan.plan_hash ?? "") || !HASH.test(plan.release_hash ?? "") || !HASH.test(plan.lineage_hash ?? "")) throw new Error("close plan hash binding is invalid");
  const unsigned = { ...plan }; delete unsigned.plan_hash;
  if (sha256(canonical(unsigned)) !== plan.plan_hash) throw new Error("close plan hash mismatch");
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) throw new Error("close plan steps are required");
  plan.steps.forEach(v1Step);
  return plan;
}

function v1Step(step, index = 0) {
  plain(step, `close step ${index}`);
  if (!STEP_ID.test(step.step_id ?? "")) throw new TypeError(`close step ${index} has an invalid step_id`);
  if (typeof step.operation !== "string" || step.operation === "") throw new TypeError(`close step ${step.step_id} operation is required`);
  for (const field of ["precondition_hash", "postcondition_hash"]) if (!HASH.test(step[field] ?? "")) throw new TypeError(`close step ${step.step_id} ${field} is invalid`);
  return step;
}

/** Build a v1 close plan. Cleanup remains opt-in and ancestry exists only for a final commit. */
function prepareClosePlan(input = {}) {
  const taskId = input.taskId ?? input.task_id;
  const releaseRef = input.releaseRef ?? input.release_ref;
  const releaseHash = input.releaseHash ?? input.release_hash;
  const lineageHash = input.lineageHash ?? input.lineage_hash;
  const supplied = Array.isArray(input.steps) ? input.steps.map((step) => ({ ...v1Step(step) })) : [];
  const steps = supplied.length ? supplied : [{
    step_id: "logical-close",
    operation: "close-task",
    precondition_hash: sha256(canonical({ task_id: taskId, status: "accepted", lineage_hash: lineageHash })),
    postcondition_hash: sha256(canonical({ task_id: taskId, status: "closed", lineage_hash: lineageHash })),
  }];
  if (input.finalCommit) {
    steps.push({
      step_id: "final-commit-ancestry",
      operation: "ancestry",
      final_commit: input.finalCommit,
      target_ref: input.targetRef,
      precondition_hash: sha256(canonical({ final_commit: input.finalCommit, target_ref: input.targetRef, verified: false })),
      postcondition_hash: sha256(canonical({ final_commit: input.finalCommit, target_ref: input.targetRef, verified: true })),
    });
  }
  if (input.authorizeCleanup === true) {
    steps.push({
      step_id: "cleanup",
      operation: "cleanup",
      precondition_hash: sha256(canonical({ task_id: taskId, cleanup: "present" })),
      postcondition_hash: sha256(canonical({ task_id: taskId, cleanup: "removed" })),
    });
  }
  const plan = {
    schema_id: input.schemaId ?? CLOSE_PLAN_SCHEMA_ID,
    schema_version: "1.0.0",
    task_id: taskId,
    release_ref: releaseRef,
    release_hash: releaseHash,
    lineage_hash: lineageHash,
    steps,
  };
  plan.plan_hash = sha256(canonical(plan));
  return Object.freeze({ ...plan, steps: Object.freeze(steps.map(Object.freeze)) });
}

/** Prepare close only from the accepted verify-code lineage and commit fact. */
export function prepareTaskCloseOperation({ task: taskHandle, kernel: taskKernel, authorizeCleanup = false } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  if (authorizeCleanup) throw new Error("close cleanup requires a separate cleanup authorization and operation");
  const accepted = kernel.readAccepted("verify-code");
  const acceptedRaw = task.readRecord(accepted.accepted_ref);
  const commitRaw = readOptional(task, "operations/commit/completed.json");
  const commit = commitRaw === undefined ? undefined : JSON.parse(commitRaw);
  const plan = prepareClosePlan({
    taskId: task.identity.taskId,
    releaseRef: task.manifest.release_manifest_ref,
    releaseHash: task.manifest.release_manifest_hash,
    lineageHash: sha256(acceptedRaw),
    finalCommit: commit?.commit_oid,
    targetRef: commit?.target_ref,
    authorizeCleanup,
  });
  return task.withRecordLock("locks/close.operation.lock", () => Object.freeze(createOrVerify(task, "operations/close/plan.json", plan, "close plan")));
}

export function confirmTaskCloseOperation({ task: taskHandle, kernel: taskKernel, confirmation, confirmationVerification = {} } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  const plan = validateV1Plan(JSON.parse(task.readRecord("operations/close/plan.json")), task);
  const outcome = consumeTaskHumanConfirmation(task, confirmation, {
    purpose: "close",
    taskId: task.identity.taskId,
    boundRef: "operations/close/plan.json",
    boundHash: plan.plan_hash,
    verifyPlatformReadback: confirmationVerification.verifyPlatformReadback,
    verifyTrustedSignature: confirmationVerification.verifyTrustedSignature,
  });
  const record = {
    schema_version: "task-close-confirmation.v1",
    task_id: task.identity.taskId,
    plan_hash: plan.plan_hash,
    decision: outcome.decision,
    confirmation_ref: outcome.confirmationRef,
  };
  createOrVerify(task, "operations/close/confirmation.json", record, "close confirmation");
  return Object.freeze(record);
}

export async function executeTaskCloseOperation({ task: taskHandle, kernel: taskKernel } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  return task.withRecordLock("locks/close.operation.lock", async () => {
    const plan = validateV1Plan(JSON.parse(task.readRecord("operations/close/plan.json")), task);
    if (task.manifest.release_manifest_ref !== plan.release_ref || task.manifest.release_manifest_hash !== plan.release_hash) {
      throw new Error("close authorization invalidated by release pin drift");
    }
    const confirmation = JSON.parse(task.readRecord("operations/close/confirmation.json"));
    if (confirmation.plan_hash !== plan.plan_hash || confirmation.decision !== "accepted") throw new Error("close has no accepted plan-bound confirmation");
    const accepted = kernel.readAccepted("verify-code");
    if (sha256(task.readRecord(accepted.accepted_ref)) !== plan.lineage_hash) throw new Error("close authorization invalidated by accepted lineage drift");
    const commitRaw = readOptional(task, "operations/commit/completed.json");
    const commit = commitRaw === undefined ? undefined : JSON.parse(commitRaw);
    const root = repositoryRootForTask(task);
    const logicalStateRef = "operations/close/logical-state.json";
    const probe = (step) => {
      if (step.operation === "close-task") {
        const stateRaw = readOptional(task, logicalStateRef);
        if (stateRaw === undefined) return step.precondition_hash;
        try {
          const state = JSON.parse(stateRaw);
          if (state.schema_version === "task-logical-close.v1" && state.task_id === task.identity.taskId && state.plan_hash === plan.plan_hash && state.lineage_hash === plan.lineage_hash && state.status === "closed") return step.postcondition_hash;
        } catch {}
        return sha256(stateRaw);
      }
      if (step.operation === "ancestry") {
        if (!commit?.commit_oid || !commit?.target_ref || commit.commit_oid !== step.final_commit || commit.target_ref !== step.target_ref) return sha256("final-commit-binding-drift");
        try {
          execFileSync("git", ["merge-base", "--is-ancestor", commit.commit_oid, commit.target_ref], { cwd: root, stdio: "ignore" });
          return step.postcondition_hash;
        } catch { return step.precondition_hash; }
      }
      return sha256(`unsupported:${step.operation}`);
    };
    for (const step of plan.steps) {
      const stepRef = `operations/close/steps/${step.step_id}.json`;
      const priorStepRaw = readOptional(task, stepRef);
      const before = probe(step);
      if (priorStepRaw !== undefined) {
        const priorStep = JSON.parse(priorStepRaw);
        if (priorStep.plan_hash !== plan.plan_hash || priorStep.step_id !== step.step_id || priorStep.status !== "completed") throw new Error(`close step ${step.step_id} record conflicts with plan`);
        if (before !== step.postcondition_hash) throw new Error(`close authorization invalidated: ${step.step_id} completed record conflicts with live postcondition`);
        continue;
      }
      if (before === step.postcondition_hash) {
        createOrVerify(task, stepRef, { schema_version: "task-close-step.v1", task_id: task.identity.taskId, plan_hash: plan.plan_hash, step_id: step.step_id, operation: step.operation, status: "completed", completion_mode: "reconciled", observed_hash: before }, `close step ${step.step_id}`);
        continue;
      }
      if (before !== step.precondition_hash) throw new Error(`close authorization invalidated: ${step.step_id} live state matches neither exact precondition nor postcondition`);
      if (step.operation === "close-task") {
        createOrVerify(task, logicalStateRef, { schema_version: "task-logical-close.v1", task_id: task.identity.taskId, plan_hash: plan.plan_hash, lineage_hash: plan.lineage_hash, status: "closed" }, "logical close state");
      } else if (step.operation === "ancestry") {
        throw new Error("close final commit ancestry precondition is not satisfied");
      } else {
        throw new Error(`unsupported close operation: ${step.operation}`);
      }
      const after = probe(step);
      if (after !== step.postcondition_hash) throw new Error(`close step ${step.step_id} postcondition verification failed`);
      createOrVerify(task, stepRef, { schema_version: "task-close-step.v1", task_id: task.identity.taskId, plan_hash: plan.plan_hash, step_id: step.step_id, operation: step.operation, status: "completed", completion_mode: "executed", observed_hash: after }, `close step ${step.step_id}`);
    }
    const prior = readOptional(task, "operations/close/completed.json");
    if (prior !== undefined) {
      const completed = JSON.parse(prior);
      if (completed.task_id !== task.identity.taskId || completed.plan_hash !== plan.plan_hash || completed.status !== "completed") throw new Error("close completion conflicts with current plan");
      return Object.freeze(completed);
    }
    const completed = {
      schema_version: "task-close-operation.v1",
      task_id: task.identity.taskId,
      plan_hash: plan.plan_hash,
      status: "completed",
      cleanup: "not-authorized",
    };
    createOrVerify(task, "operations/close/completed.json", completed, "close completion");
    return Object.freeze(completed);
  });
}

export function taskCloseOperationStatus(taskHandle) {
  const task = assertTaskHandle(taskHandle);
  for (const [ref, status] of [["operations/close/completed.json", "completed"], ["operations/close/confirmation.json", "confirmed"], ["operations/close/plan.json", "prepared"]]) {
    const raw = readOptional(task, ref);
    if (raw !== undefined) return Object.freeze({ status, record_ref: ref, record: JSON.parse(raw) });
  }
  return Object.freeze({ status: "unprepared" });
}
