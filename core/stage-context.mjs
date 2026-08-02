import { isAbsolute, resolve } from "node:path";

import { ArtifactDir } from "./artifact-dir.mjs";
import { resolveStorageRoot } from "../runtime/evidence/storage-root.mjs";
import { assertRuntimeAuthority } from "./runtime-mode.mjs";
import { deriveTaskPath, validateProjectName, validateTaskId } from "../runtime/task/task-identity.mjs";
import { openTask } from "./task-handle.mjs";
import { createTaskKernel } from "../runtime/task/task-kernel.mjs";
import { authenticateWriteBoundary } from "../runtime/evidence/write-boundary-preflight.mjs";
import {
  assertWorkspace,
  openCurrentTaskWorkspace,
  prepareTaskWorkspace,
  validateTaskWorkspaceAttempt,
} from "./workspace.mjs";

const STAGES = new Set([
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
]);
export { assertWorkspace } from "./workspace.mjs";

/**
 * Authenticate only when an official write is about to happen.
 */
export function authenticateStageWriteBoundary(context, { runnerRoot, operation, runId } = {}) {
  if (!context || !STAGES.has(context.stage) || !context.task) {
    throw new TypeError("authenticated StageContext is required");
  }
  return authenticateWriteBoundary({
    task: context.task,
    runnerRoot,
    stage: context.stage,
    operation,
    workspace: context.workspace ?? context.candidateWorkspace,
    ...(runId === undefined ? {} : { runId }),
  });
}

function bindCandidateWorkspace(context, candidate) {
  if (!context || context.stage !== "make-decision" || !context.task || context.candidateWorkspace) {
    throw new TypeError("unprepared make-decision StageContext required");
  }
  const kernel = createTaskKernel(context.task, { candidateWorkspace: candidate });
  return Object.freeze({
    ...context,
    kernel,
    workflowRunId: kernel.deriveStageWorkflowRunId(context.stage),
    candidateWorkspace: candidate,
  });
}

/** Prepare only after the official invocation input has been loaded successfully. */
export function prepareMakeDecisionWorkspace(context) {
  const task = context?.task;
  if (!task) throw new TypeError("unprepared make-decision StageContext required");
  return bindCandidateWorkspace(context, prepareTaskWorkspace(task));
}

/** Revalidate the published attempt immediately before acceptance. */
export function validateMakeDecisionWorkspaceAttempt(context, attemptRef) {
  if (!context || context.stage !== "make-decision" || !context.task || context.candidateWorkspace) {
    throw new TypeError("unprepared make-decision StageContext required");
  }
  if (typeof attemptRef !== "string" || !/^attempt-[0-9]{4}\.json$/.test(attemptRef)) throw new Error("valid make-decision attemptRef is required for workspace validation");
  let attempt;
  try { attempt = JSON.parse(context.task.readRecord(`results/make-decision/${attemptRef}`)); }
  catch (error) { throw new Error(`invalid make-decision attempt for workspace validation: ${error.message}`); }
  if (attempt?.task_id !== context.task.identity.taskId || attempt?.stage !== "make-decision") throw new Error("make-decision attempt identity mismatch during workspace validation");
  return bindCandidateWorkspace(context, validateTaskWorkspaceAttempt(context.task, attempt.facts));
}

function validateStage(stage) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  return stage;
}

function assertCurrentTaskMaterials(artifacts) {
  const failures = [];
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    try {
      const content = artifacts.read(name);
      if (String(content).trim() === "") failures.push(`${name}: empty`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }
  if (failures.length) {
    throw new Error(`current task material missing or unreadable: ${failures.join("; ")}`);
  }
}

function launcherTaskPath({ projectName, taskId, taskPath, env, home }) {
  const storageRoot = resolveStorageRoot({ env, home });
  assertRuntimeAuthority(storageRoot, { home, expectedEpoch: env?.WORKFLOWHUB_CUTOVER_EPOCH });
  const derived = deriveTaskPath(storageRoot, projectName, taskId);
  if (taskPath !== undefined) {
    if (typeof taskPath !== "string" || !isAbsolute(taskPath)) {
      throw new TypeError("explicit taskPath must be absolute");
    }
    if (resolve(taskPath) !== derived) {
      throw new Error(`explicit taskPath does not match launcher-derived taskPath: ${taskPath}`);
    }
  }
  return derived;
}

/**
 * Build the only context a stage may consume.
 *
 * launcher mode resolves storage exactly once. sidecar mode never reads env or
 * derives a storage path; its absolute taskPath is supplied by the parent.
 */
export function bootstrapStage(
  stage,
  options = {},
) {
  if (Object.prototype.hasOwnProperty.call(options, "readAccepted")) {
    throw new TypeError("public readAccepted adapter is forbidden; TaskKernel owns accepted records");
  }
  if (Object.prototype.hasOwnProperty.call(options, "kernel")) {
    throw new TypeError("caller-supplied TaskKernel is forbidden; bootstrap creates the authentic kernel");
  }
  if (Object.prototype.hasOwnProperty.call(options, "candidateWorkspace")) {
    throw new TypeError("caller-supplied workspace paths are no longer supported; make-decision owns worktree preparation");
  }
  const {
    mode = "launcher",
    projectName,
    taskId,
    taskPath,
    runnerRoot,
    env,
    home,
    workspaceLifecycle,
    attemptRef,
  } = options;
  const normalizedStage = validateStage(stage);
  const project = validateProjectName(projectName);
  const task = validateTaskId(taskId);

  let resolvedTaskPath;
  if (mode === "launcher") {
    resolvedTaskPath = launcherTaskPath({ projectName: project, taskId: task, taskPath, env, home });
  } else if (mode === "sidecar") {
    if (typeof taskPath !== "string" || !isAbsolute(taskPath)) {
      throw new TypeError("sidecar mode requires an absolute taskPath");
    }
    resolvedTaskPath = resolve(taskPath);
  } else {
    throw new TypeError(`unsupported bootstrap mode: ${mode}`);
  }

  const taskHandle = openTask(resolvedTaskPath, project, task);
  if (workspaceLifecycle !== undefined && normalizedStage !== "make-decision") {
    throw new TypeError("workspaceLifecycle is only valid for make-decision");
  }
  let candidate;
  if (workspaceLifecycle === "prepare") {
    candidate = prepareTaskWorkspace(taskHandle);
  } else if (workspaceLifecycle === "validate-attempt") {
    if (typeof attemptRef !== "string" || !/^attempt-[0-9]{4}\.json$/.test(attemptRef)) throw new Error("valid make-decision attemptRef is required for workspace validation");
    let attempt;
    try { attempt = JSON.parse(taskHandle.readRecord(`results/make-decision/${attemptRef}`)); }
    catch (error) { throw new Error(`invalid make-decision attempt for workspace validation: ${error.message}`); }
    if (attempt?.task_id !== taskHandle.identity.taskId || attempt?.stage !== "make-decision") throw new Error("make-decision attempt identity mismatch during workspace validation");
    candidate = validateTaskWorkspaceAttempt(taskHandle, attempt.facts);
  } else if (workspaceLifecycle !== undefined) {
    throw new TypeError(`unsupported make-decision workspaceLifecycle: ${workspaceLifecycle}`);
  }
  const kernel = createTaskKernel(taskHandle, { candidateWorkspace: candidate });
  const base = {
    stage: normalizedStage,
    task: taskHandle,
    identity: taskHandle.identity,
    manifest: taskHandle.manifest,
    kernel,
    workflowRunId: kernel.deriveStageWorkflowRunId(normalizedStage),
  };

  if (normalizedStage === "make-decision") return Object.freeze({ ...base, ...(candidate ? { candidateWorkspace: candidate } : {}) });
  const workspace = openCurrentTaskWorkspace(taskHandle);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, taskHandle);
  const stageKernel = createTaskKernel(taskHandle, { workspace, artifacts });
  if (normalizedStage === "build-code" || normalizedStage === "verify-code") {
    assertCurrentTaskMaterials(artifacts);
  }
  return Object.freeze({ ...base, kernel: stageKernel, workflowRunId: stageKernel.deriveStageWorkflowRunId(normalizedStage), workspace, artifacts });
}
