import { ArtifactDir } from "../evidence/artifact-dir.mjs";
import { resolveCanonicalTaskPath } from "../task/load-config.mjs";
import { openTask } from "../task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../task/workspace.mjs";
import { inspectWorkspace } from "../interface/workspace-check.mjs";

const STAGES = new Set(["make-decision", "build-plan", "build-code", "verify-code", "build-prd"]);
export { assertWorkspace } from "../task/workspace.mjs";

async function bindWorkspace(context, workspace) {
  const physical = await inspectWorkspace({ root: workspace.targetRepoRoot, target: workspace.worktreeRoot, baseline: workspace.baselineCommit });
  const targetStatus = await inspectWorkspace({ root: workspace.targetRepoRoot, target: workspace.targetRepoRoot, baseline: "HEAD" });
  return Object.freeze({ ...context, workspace, artifacts: ArtifactDir.open(workspace.worktreeRoot, context.task), physical, targetStatus });
}

/** Ordinary task identity and current physical workspace; no execution/outcome object graph. */
export async function bootstrapStage(stage, options = {}) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  const allowed = new Set(["projectName", "taskId", "taskPath", "env", "home", "readOnly"]);
  if (Object.keys(options).some(key => !allowed.has(key))) throw new TypeError("unsupported stage context option");
  const { projectName, taskId, taskPath, env, home, readOnly = false } = options;
  if (typeof readOnly !== "boolean") throw new TypeError("readOnly must be boolean");
  const resolution = resolveCanonicalTaskPath({ project: projectName, task: taskId, ...(taskPath === undefined ? {} : { taskPath }), env, home });
  const task = openTask(resolution.taskPath, resolution.project, resolution.task);
  if (!readOnly && task.manifest.activation_cohort !== "post") throw new Error("pre/history stage writes are read-only");
  const context = Object.freeze({ stage, task, identity: task.identity, manifest: task.manifest });
  let workspace;
  try { workspace = await openCurrentTaskWorkspace(task); }
  catch (error) {
    if (!readOnly || error.code !== "ENOENT") throw error;
    return Object.freeze({ ...context, workspace_unavailable: Object.freeze({ code: error.code, message: error.message, path: error.path ?? null, cause: error }) });
  }
  return bindWorkspace(context, workspace);
}

/** Existing make-decision preparation creates only its ordinary physical workspace. */
export async function prepareMakeDecisionWorkspace(context) {
  if (!context || context.stage !== "make-decision" || !context.task) throw new TypeError("make-decision StageContext is required");
  return bindWorkspace(context, await prepareTaskWorkspace(context.task));
}
