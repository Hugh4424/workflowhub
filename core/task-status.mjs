import { assertTaskHandle, createTaskKernel } from "./task-handle.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

function acceptedRef(kernel, stage) {
  const ref = `results/${stage}/accepted.json`;
  try { kernel.readAccepted(stage); return ref; }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

export function getTaskStatus(taskHandle) {
  const task = assertTaskHandle(taskHandle);
  const kernel = createTaskKernel(task);
  const accepted = STAGES.map((stage) => ({ stage, ref: acceptedRef(kernel, stage) })).filter((entry) => entry.ref);
  const next = STAGES.find((stage) => !accepted.some((entry) => entry.stage === stage)) ?? "complete";
  return Object.freeze({
    task_ref: `projects/${task.identity.projectName}/tasks/${task.identity.taskId}`,
    manifest_ref: "task.json",
    facts_refs: Object.freeze(accepted.map((entry) => entry.ref)),
    next_action: next === "complete" ? "task complete" : `${next} prepare`,
  });
}

export function taskBootstrapView(taskHandle) {
  const status = getTaskStatus(taskHandle);
  return Object.freeze({
    task_ref: status.task_ref,
    manifest_ref: status.manifest_ref,
    next_action: status.next_action,
    facts_refs: status.facts_refs,
  });
}
