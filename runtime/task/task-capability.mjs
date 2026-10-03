const TASK_HANDLES = new WeakSet();

export function assertTaskHandle(value) {
  if (!value || typeof value !== "object" || !TASK_HANDLES.has(value)) {
    throw new TypeError("expected a WorkflowHub TaskHandle capability");
  }
  return value;
}

/** A read-only consumer must not depend on the TaskHandle implementation. */
export function assertTaskReadCapability(value) {
  const task = assertTaskHandle(value);
  if (typeof task.readRecord !== "function") throw new TypeError("expected a readable WorkflowHub task capability");
  return task;
}

// The handle brand is deliberately not re-exported by the public TaskHandle API.
export function brandTaskHandle(value) {
  if (!value || typeof value !== "object") throw new TypeError("TaskHandle brand target must be an object");
  TASK_HANDLES.add(value);
  return value;
}

