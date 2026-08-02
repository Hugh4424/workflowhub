const TASK_HANDLES = new WeakSet();
const TASK_KERNELS = new WeakSet();

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

export function assertTaskKernel(value) {
  if (!value || typeof value !== "object" || !TASK_KERNELS.has(value)) {
    throw new TypeError("expected a WorkflowHub TaskKernel capability");
  }
  return value;
}

// These brands are deliberately not re-exported by the public TaskHandle API.
export function brandTaskHandle(value) {
  if (!value || typeof value !== "object") throw new TypeError("TaskHandle brand target must be an object");
  TASK_HANDLES.add(value);
  return value;
}

export function brandTaskKernel(value) {
  if (!value || typeof value !== "object") throw new TypeError("TaskKernel brand target must be an object");
  TASK_KERNELS.add(value);
  return value;
}
