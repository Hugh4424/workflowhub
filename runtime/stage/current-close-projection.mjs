// Read-only status composition for the current task.
//
// This module deliberately owns no store and writes no record.  It composes
// the existing authenticated quality/product facts with the existing close
// plan, immutable step records, and live physical observations.  The close
// writer remains in core/task-close.mjs; this file is only its status reader.

export const CURRENT_STATUS_DOMAINS = Object.freeze([
  "work_progress",
  "stage_quality",
  "product_release",
  "physical_delivery",
]);

export const PHYSICAL_DELIVERY_STATUSES = Object.freeze([
  "not_started",
  "incomplete",
  "removed",
  "not_applicable_recorded",
  "unavailable",
  "unknown",
]);

export const PHYSICAL_DELIVERY_FACTS = Object.freeze([
  "delivery_committed",
  "archive",
  "merge",
  "push",
  "worktree_cleanup",
  "formal_cleanup_safe",
  "branch_cleanup",
]);

const FAILED_STEP_STATUSES = new Set(["failed", "error", "record_failed"]);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function asObject(value, label) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function asStepRecords(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError("close step_records must be an array");
  return value.filter((entry) => entry && typeof entry === "object").map(clone);
}

function completionRecords(close) {
  const supplied = close.completed;
  if (supplied === undefined || supplied === null) return [];
  if (typeof supplied !== "object" || Array.isArray(supplied)) throw new TypeError("close completed result must be an object");
  return [clone(supplied)];
}

function result(status, fields = {}) {
  if (!PHYSICAL_DELIVERY_STATUSES.includes(status)) throw new Error(`unsupported physical delivery status: ${status}`);
  return Object.freeze({ status, ...fields });
}

function planHashFor(close) {
  return close.plan_hash ?? close.plan?.plan_hash ?? null;
}

function physicalFacts(close) {
  return asObject(close.facts ?? close, "close facts");
}

function hasReadFailure(close) {
  return close.read_error !== undefined
    || close.read_failure !== undefined
    || close.physical_read_status === "unavailable"
    || close.read_status === "unavailable"
    || close.unavailable === true;
}

function hasInsufficientIdentity(close) {
  return close.identity_status === "insufficient"
    || close.identity_status === "unknown";
}

function completedResultConflict(records, close) {
  if (records.length > 1) return true;
  const completed = records[0];
  if (!completed) return false;
  const planHash = planHashFor(close);
  // A completion record is only current when it can be bound to the
  // immutable plan being read.  Do not let a caller with an un-hashed plan
  // promote physical facts to a completed state.
  if (!planHash) return true;
  if (completed.status !== "completed") return true;
  if (close.task_id && completed.task_id && close.task_id !== completed.task_id) return true;
  return completed.plan_hash !== planHash;
}

function cleanupShape(facts) {
  const cleanup = facts.cleanup;
  if (cleanup === undefined || cleanup === null) return null;
  if (typeof cleanup !== "object" || Array.isArray(cleanup)) return { invalid: true };
  const flags = ["removed", "skipped", "incomplete"].filter((key) => cleanup[key] === true);
  return { value: cleanup, flags };
}

/**
 * Derive exactly one physical-delivery state from an existing close view.
 * The function never treats a quality/release snapshot as an execution fact.
 */
export function derivePhysicalDeliveryStatus(input = {}) {
  const close = asObject(input, "close projection");
  const plan = close.plan ?? null;
  const facts = physicalFacts(close);
  const steps = asStepRecords(close.step_records);
  const completions = completionRecords(close);
  const cleanup = cleanupShape(facts);
  const planHash = planHashFor(close);

  if (hasInsufficientIdentity(close)) {
    return result("unknown", { reason: "close identity is insufficient", plan_hash: planHash });
  }

  if (hasReadFailure(close)) {
    return result("unavailable", {
      reason: String(close.read_error ?? close.read_failure ?? "physical close state could not be read"),
      plan_hash: planHash,
    });
  }

  // No plan is an explicit lifecycle state only after the physical read has
  // succeeded. A failed read cannot safely be inferred as "not started".
  if (plan === null || plan === undefined) {
    return result("not_started", { reason: "no close plan exists", plan_hash: null });
  }

  if (cleanup?.invalid || (cleanup?.flags?.length ?? 0) > 1) {
    return result("unknown", {
      reason: "physical cleanup state is contradictory",
      plan_hash: planHash,
    });
  }

  if (completedResultConflict(completions, close)) {
    return result("unknown", {
      reason: "close completion results conflict",
      plan_hash: planHash,
      completed_count: completions.length,
    });
  }

  const existingWorkspace = close.workspace_mode === "existing"
    || close.existing_workspace === true
    || cleanup?.flags?.includes("skipped")
    || facts.cleanup?.skipped === true;
  if (existingWorkspace) {
    return result("not_applicable_recorded", {
      reason: "authenticated existing workspace is retained",
      plan_hash: planHash,
      recorded: clone(cleanup?.value ?? facts.cleanup ?? null),
    });
  }

  const missingFacts = PHYSICAL_DELIVERY_FACTS.filter((name) => facts[name] !== true);
  const cleanupRemoved = cleanup?.flags?.includes("removed");

  // A recovered plan may retain an immutable failed step for audit while its
  // later readback proves that the physical state is now complete.  Current
  // state must follow the readback; the old failure remains visible in the
  // separate close.step_records view.
  if (missingFacts.length === 0 && cleanupRemoved && completions.length === 1) {
    return result("removed", {
      plan_hash: planHash,
      completed_count: 1,
    });
  }

  const failedSteps = steps
    .filter((step) => FAILED_STEP_STATUSES.has(step.status) || step.error !== undefined)
    .map((step) => ({
      ...(step.step_id === undefined ? {} : { step_id: step.step_id }),
      ...(step.operation === undefined ? {} : { operation: step.operation }),
      ...(step.error === undefined ? {} : { error: String(step.error) }),
    }));
  if (failedSteps.length > 0) {
    return result("incomplete", {
      plan_hash: planHash,
      failed_steps: failedSteps,
      next_action: "沿用同一 close plan，先读回失败步骤的现场状态，再补做未完成动作。",
    });
  }

  if (missingFacts.length === 0 && cleanupRemoved) {
    return result("incomplete", {
      plan_hash: planHash,
      completed_count: completions.length,
      missing_completed_result: true,
      next_action: "保留当前 close plan，先完成现场读回并记录唯一 completed result。",
    });
  }

  return result("incomplete", {
    plan_hash: planHash,
    missing_facts: missingFacts,
    ...(cleanup?.value ? { cleanup: clone(cleanup.value) } : {}),
    next_action: "保留当前计划与步骤记录，补齐未完成物理动作并现场读回。",
  });
}

function domain(value, fallbackReason) {
  if (value === undefined || value === null) return Object.freeze({ status: "unknown", reason: fallbackReason });
  if (typeof value !== "object" || Array.isArray(value)) throw new TypeError("status domain must be an object");
  return Object.freeze(clone(value));
}

function closeView(input) {
  const close = asObject(input, "close projection");
  const plan = close.plan ?? null;
  const stepRecords = asStepRecords(close.step_records);
  const completions = completionRecords(close);
  return Object.freeze({
    plan: clone(plan),
    step_records: Object.freeze(stepRecords),
    completed: completions.length === 0 ? null : completions.length === 1 ? completions[0] : Object.freeze(completions),
  });
}

/**
 * Compose the four stable status domains and the separate close records.
 * `close` is deliberately returned as plan/step/completed only; no derived
 * status is persisted or promoted to a second authority.
 */
export function deriveCurrentCloseProjection({
  task_id: taskId = null,
  work_progress: workProgress,
  stage_quality: stageQuality,
  product_release: productRelease,
  close: closeInput,
  ...directClose
} = {}) {
  const close = closeInput === undefined ? directClose : asObject(closeInput, "close projection");
  const physical = derivePhysicalDeliveryStatus(close);
  const domains = {
    work_progress: domain(workProgress, "work progress is unavailable"),
    stage_quality: domain(stageQuality, "stage quality is unavailable"),
    product_release: domain(productRelease, "product release is unavailable"),
    physical_delivery: physical,
  };
  return Object.freeze({
    schema_version: "current-close-projection.v1",
    task_id: taskId,
    producer: "deriveCurrentCloseProjection",
    domains: Object.freeze(domains),
    close: closeView(close),
  });
}
