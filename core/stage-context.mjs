import { isAbsolute, resolve } from "node:path";

import { ArtifactDir } from "./artifact-dir.mjs";
import { resolveStorageRoot } from "./storage-root.mjs";
import { assertRuntimeAuthority } from "./runtime-mode.mjs";
import { deriveTaskPath, validateProjectName, validateTaskId } from "./task-identity.mjs";
import { openTask } from "./task-handle.mjs";
import { createTaskKernel } from "./task-kernel.mjs";
import { assertWorkspace, openCandidateWorkspace, openWorkspace } from "./workspace.mjs";

const STAGES = new Set([
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
]);
export { assertWorkspace } from "./workspace.mjs";

function validateStage(stage) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  return stage;
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
  const {
    mode = "launcher",
    projectName,
    taskId,
    taskPath,
    env,
    home,
    candidateWorkspace,
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
  const candidate = normalizedStage === "make-decision" && candidateWorkspace
    ? openCandidateWorkspace(taskHandle, candidateWorkspace)
    : undefined;
  const kernel = createTaskKernel(taskHandle, { candidateWorkspace: candidate });
  const base = {
    stage: normalizedStage,
    task: taskHandle,
    identity: taskHandle.identity,
    manifest: taskHandle.manifest,
    kernel,
  };

  if (normalizedStage === "make-decision") return Object.freeze({ ...base, ...(candidate ? { candidateWorkspace: candidate } : {}) });
  const hasDecisionInput = Object.prototype.hasOwnProperty.call(taskHandle.manifest.inputs ?? {}, "decision");
  let localDecision;
  try { localDecision = kernel.readAccepted("make-decision"); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (hasDecisionInput && localDecision) throw new Error("task has both current accepted make-decision and manifest decision input");
  const decision = hasDecisionInput ? kernel.readInput("decision") : localDecision;
  if (!decision) throw new Error("stage requires an accepted make-decision result or declared decision input");
  const workspace = openWorkspace(decision, taskHandle.manifest);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, taskHandle);
  const stageKernel = createTaskKernel(taskHandle, { workspace, artifacts });
  return Object.freeze({ ...base, kernel: stageKernel, workspace, artifacts });
}
