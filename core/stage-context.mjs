import { createHash } from "node:crypto";
import { isAbsolute, resolve } from "node:path";

import { ArtifactDir } from "./artifact-dir.mjs";
import {
  assertTaskLaunchAuthority,
  createLauncherAuthority,
  openTaskFromLaunchAuthority,
  taskAuthorityFor,
} from "./launcher-authority.mjs";
import { validateProjectName, validateTaskId } from "./task-identity.mjs";
import { bindTaskRepository } from "./repository-registry.mjs";
import { openTask } from "./task-handle.mjs";
import { createTaskKernel } from "./task-kernel.mjs";
import {
  assertWorkspace,
  openAcceptedWorkspace,
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
const CONTEXT_CONFIRMATION_VERIFICATION = new WeakMap();
export { assertWorkspace } from "./workspace.mjs";

function withConfirmationVerification(context, verification) {
  CONTEXT_CONFIRMATION_VERIFICATION.set(context, verification ?? Object.freeze({}));
  return context;
}

function bindCandidateWorkspace(context, candidate) {
  if (!context || context.stage !== "make-decision" || !context.task || context.candidateWorkspace) {
    throw new TypeError("unprepared make-decision StageContext required");
  }
  const next = Object.freeze({
    ...context,
    kernel: createTaskKernel(context.task, { candidateWorkspace: candidate, confirmationVerification: CONTEXT_CONFIRMATION_VERIFICATION.get(context) ?? {} }),
    candidateWorkspace: candidate,
  });
  return withConfirmationVerification(next, CONTEXT_CONFIRMATION_VERIFICATION.get(context));
}

/** Prepare only after the official invocation input has been loaded successfully. */
export function prepareMakeDecisionWorkspace(context) {
  return bindCandidateWorkspace(context, prepareTaskWorkspace(context?.task));
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
  let facts = attempt.facts;
  if (attempt.schema_version === "1.0.0") {
    const resultRaw = context.task.readRecord(facts.result_ref);
    if (createHash("sha256").update(resultRaw).digest("hex") !== facts.result_hash) throw new Error("make-decision attempt result hash mismatch during workspace validation");
    facts = JSON.parse(resultRaw);
  }
  return bindCandidateWorkspace(context, validateTaskWorkspaceAttempt(context.task, facts));
}

function validateStage(stage) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  return stage;
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
    env,
    home,
    launcherAuthority,
    repositoryAuthority,
    workspaceLifecycle,
    attemptRef,
    confirmationVerification,
  } = options;
  const normalizedStage = validateStage(stage);
  const project = validateProjectName(projectName);
  const task = validateTaskId(taskId);

  let taskHandle;
  if (mode === "launcher") {
    if (taskPath !== undefined) throw new TypeError("launcher mode derives taskPath; caller-supplied taskPath is forbidden");
    const launch = launcherAuthority === undefined
      ? taskAuthorityFor(createLauncherAuthority({ env, home }), { projectName: project, taskId: task })
      : launcherAuthority;
    assertTaskLaunchAuthority(launch, { projectName: project, taskId: task });
    taskHandle = openTaskFromLaunchAuthority(launch, { projectName: project, taskId: task });
    if (taskHandle.manifest.target_repository_ref !== undefined) {
      if (repositoryAuthority === undefined) throw new TypeError("launcher must provide repository authority for a canonical repository ref");
      bindTaskRepository(taskHandle, repositoryAuthority);
    }
  } else if (mode === "sidecar") {
    if (launcherAuthority !== undefined) throw new TypeError("sidecar mode must not receive launcher authority");
    if (typeof taskPath !== "string" || !isAbsolute(taskPath)) {
      throw new TypeError("sidecar mode requires an absolute taskPath");
    }
    taskHandle = openTask(resolve(taskPath), project, task);
  } else {
    throw new TypeError(`unsupported bootstrap mode: ${mode}`);
  }

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
  if (confirmationVerification !== undefined && (!confirmationVerification || typeof confirmationVerification !== "object" || Array.isArray(confirmationVerification))) {
    throw new TypeError("launcher confirmationVerification must be an object");
  }
  const kernelOptions = { candidateWorkspace: candidate, confirmationVerification: confirmationVerification ?? {} };
  const kernel = createTaskKernel(taskHandle, kernelOptions);
  const base = {
    stage: normalizedStage,
    task: taskHandle,
    identity: taskHandle.identity,
    manifest: taskHandle.manifest,
    kernel,
  };

  if (normalizedStage === "make-decision") return withConfirmationVerification(Object.freeze({ ...base, ...(candidate ? { candidateWorkspace: candidate } : {}) }), confirmationVerification);
  let localDecision;
  try { localDecision = kernel.readAccepted("make-decision"); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (!localDecision) throw new Error("stage requires the current task's accepted make-decision result");
  const workspace = openAcceptedWorkspace(taskHandle, localDecision);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, taskHandle);
  const stageKernel = createTaskKernel(taskHandle, { workspace, artifacts, confirmationVerification: confirmationVerification ?? {} });
  return withConfirmationVerification(Object.freeze({ ...base, kernel: stageKernel, workspace, artifacts }), confirmationVerification);
}
