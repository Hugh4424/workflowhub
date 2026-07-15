const safeId = /^[A-Za-z0-9._-]+$/;

export class FailLoudError extends Error {}

export function assertSafeTaskId(taskId) {
  if (typeof taskId !== "string" || !safeId.test(taskId) || taskId === "." || taskId === ".." || taskId.includes("..")) {
    throw new FailLoudError(`unsafe task_id: ${JSON.stringify(taskId)}`);
  }
}
