#!/usr/bin/env node

import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { deriveTaskPath } from "../../runtime/task/task-identity.mjs";
import { resolveStorageRoot } from "../../runtime/evidence/storage-root.mjs";
import { createTaskKernel } from "../../runtime/task/task-kernel.mjs";
import { authenticateWriteBoundary, persistWriteBoundaryPathCard } from "../../runtime/evidence/write-boundary-preflight.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { deriveCurrentStatusDomains } from "./stage-runtime.mjs";
import {
  closePlanHash,
  closeDelivery,
  completeDeliveryClosePlan,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  inspectDeliveryCloseState,
  prepareDeliveryClosePlan,
  recordManualDeliveryClose,
} from "../../core/task-close.mjs";
import { deriveCurrentCloseProjection } from "../../runtime/stage/current-close-projection.mjs";

const RUNNER_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function args(argv) {
  const [command, ...rest] = argv;
  const values = Object.fromEntries(rest.map((arg) => {
    const index = arg.indexOf("=");
    if (!arg.startsWith("--") || index < 3) throw new TypeError(`invalid argument: ${arg}`);
    return [arg.slice(2, index), arg.slice(index + 1)];
  }));
  return { command, values };
}

function required(values, name) {
  if (typeof values[name] !== "string" || values[name] === "") throw new TypeError(`--${name} is required`);
  return values[name];
}

function taskPath(values, project, taskId) {
  if (values["task-path"] !== undefined) return required(values, "task-path");
  return deriveTaskPath(resolveStorageRoot(), project, taskId);
}

function isPostCleanupArchivePlanRecord(task, planHash) {
  if (!/^[a-f0-9]{64}$/.test(planHash ?? "")) return false;
  try {
    const record = JSON.parse(task.readRecord(`operations/close/plans/${planHash}/plan.json`));
    const steps = record?.plan?.steps;
    return record?.schema_version === "task-close-plan-record.v1"
      && record.task_id === task.identity.taskId
      && record.plan_hash === planHash
      && record.plan?.delivery?.close_mode === "ordinary"
      && record.plan?.delivery?.planning !== undefined
      && Array.isArray(steps)
      && steps.length === 2
      && steps[0]?.step_id === "archive-spec"
      && steps[0]?.operation === "archive-spec"
      && steps[1]?.step_id === "push-target-branch"
      && steps[1]?.operation === "push-target-branch";
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return false;
    throw error;
  }
}

function context(values, { workspaceRequired = true, postConfirmation = false } = {}) {
  const project = required(values, "project");
  const taskId = required(values, "task");
  const task = openTask(taskPath(values, project, taskId), project, taskId);
  const unboundKernel = createTaskKernel(task);
  const effectiveWorkspaceRequired = workspaceRequired
    && !(postConfirmation && isPostCleanupArchivePlanRecord(task, values["plan-hash"]));
  if (!effectiveWorkspaceRequired) return { task, workspace: null, kernel: unboundKernel };
  if (task.manifest.record_model !== "vnext-single-write") throw new Error("legacy delivery close is retired; use a vnext-single-write task");
  const workspace = openCurrentTaskWorkspace(task);
  return { task, workspace, kernel: createTaskKernel(task, { workspace }) };
}

function preparedPlan(task, hash) {
  if (!/^[a-f0-9]{64}$/.test(hash ?? "")) throw new TypeError("--plan-hash must be a SHA-256 hash");
  const record = JSON.parse(task.readRecord(`operations/close/plans/${hash}/plan.json`));
  if (record.schema_version !== "task-close-plan-record.v1" || record.task_id !== task.identity.taskId || record.plan_hash !== hash || closePlanHash(record.plan) !== hash) {
    throw new Error("prepared close plan record is invalid");
  }
  return record.plan;
}

function optionalCompletion(task) {
  try { return JSON.parse(task.readRecord("operations/close/completed.json")); }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

function optionalRiskClose(values) {
  if (values["risk-close"] === undefined) return undefined;
  try { return JSON.parse(values["risk-close"]); }
  catch { throw new TypeError("--risk-close must be JSON"); }
}

function optionalJsonArray(values, name) {
  if (values[name] === undefined) return undefined;
  let value;
  try { value = JSON.parse(values[name]); }
  catch { throw new TypeError(`--${name} must be JSON`); }
  if (!Array.isArray(value)) throw new TypeError(`--${name} must be a JSON array`);
  return value;
}

function postCleanupArchiveInput(values, command) {
  const archive = values.archive;
  const priorPlanHash = values["plan-hash"];
  if (archive === undefined && priorPlanHash === undefined) return null;
  if (archive === undefined || priorPlanHash === undefined) {
    throw new TypeError(`${command} post-cleanup archive requires both --archive and --plan-hash`);
  }
  const allowed = command === "prepare"
    ? new Set(["task-path", "project", "task", "archive", "plan-hash"])
    : new Set(["task-path", "project", "task", "archive", "plan-hash", "reply-text", "step-slug"]);
  const extra = Object.keys(values).filter((key) => !allowed.has(key));
  if (extra.length > 0) throw new TypeError(`${command} post-cleanup archive does not accept: ${extra.map((key) => `--${key}`).join(", ")}`);
  return { archiveDeclarationRef: required(values, "archive"), priorPlanHash: required(values, "plan-hash") };
}

function resultSourceRef(result, fallback) {
  if (result?.status === "delivered" && /^[a-f0-9]{64}$/.test(result.plan_hash ?? "")) {
    return `operations/close/plans/${result.plan_hash}/plan.json`;
  }
  return fallback;
}

function readCurrentStatusMaterials(artifacts) {
  return Object.fromEntries(CURRENT_MATERIAL_FILES.map((file) => {
    try { return [file, artifacts.read(file)]; }
    catch (error) {
      if (error?.code === "ENOENT") return [file, null];
      throw error;
    }
  }));
}

function currentWorkspaceUnavailable(error) {
  return error?.code === "ENOENT"
    || /target repository validation failed:.*not a git repository/i.test(String(error?.message ?? ""));
}

function currentCloseProjection(task, closeState) {
  const domains = {};
  try {
    const workspace = openCurrentTaskWorkspace(task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const statusKernel = createTaskKernel(task, { workspace, artifacts });
    const currentSnapshot = statusKernel.currentVNextSnapshot();
    const materials = readCurrentStatusMaterials(artifacts);
    const materialRevision = materialRevisionFromValues(CURRENT_MATERIAL_FILES.map((file) => [file, materials[file]]));
    Object.assign(domains, deriveCurrentStatusDomains({
      task,
      kernel: statusKernel,
      identity: task.identity,
      manifest: task.manifest,
      workspace,
      artifacts,
    }, {
      // A planning close stops at the plan stage; a delivery close reports
      // the verify-code quality that the close plan inspected.
      stage: closeState.close_mode === "planning" ? "build-plan" : "verify-code",
      currentSnapshot,
      materialRevision,
      materials,
    }));
  } catch (error) {
    // After deterministic close cleanup the worktree is intentionally gone.
    // Keep the physical readback useful while leaving the other domains
    // explicitly unknown; do not hide identity or integrity errors.
    if (!currentWorkspaceUnavailable(error)) throw error;
  }
  return deriveCurrentCloseProjection({ task_id: task.identity.taskId, ...domains, close: closeState });
}

function statusWithoutPlan(task, completion) {
  if (completion?.plan_hash) {
    const plan = preparedPlan(task, completion.plan_hash);
    const closeState = inspectDeliveryCloseState({ task, kernel: createTaskKernel(task), plan });
    return {
      status: completion.status,
      ref: "operations/close/completed.json",
      value: completion,
      plan_hash: closePlanHash(plan),
      record_status: completion.status,
      physical_state: closeState,
      current: currentCloseProjection(task, closeState),
    };
  }
  const closeState = { task_id: task.identity.taskId, plan: null };
  return {
    status: completion?.status ?? "not_completed",
    ref: "operations/close/completed.json",
    ...(completion ? { value: completion } : {}),
    current: currentCloseProjection(task, closeState),
  };
}

function usage() {
  return [
    "Usage:",
    "  task-close.mjs prepare [--task-path=...] --project=... --task=... --task-branch=... --target-branch=... --remote=... --task-commit=... --spec-source=... --spec-archive=... [--mode=planning] [--required-attachments=JSON]",
    "  task-close.mjs prepare [--task-path=...] --project=... --task=... --archive=<declaration-ref> --plan-hash=<initial-four-action-plan-hash>",
    "  task-close.mjs confirm [--task-path=...] --project=... --task=... --plan-hash=... --decision=confirmed|rejected|timeout [--reply-text=...] [--step-slug=...] (reply and step required unless timeout)",
    "  task-close.mjs execute [--task-path=...] --project=... --task=... --plan-hash=... --confirmation-ref=... [--archive=<declaration-ref>]",
    "  task-close.mjs manual-close [--task-path=...] --project=... --task=... --plan-hash=... --confirmation-ref=...",
    "  task-close.mjs complete [--task-path=...] --project=... --task=... --plan-hash=... --confirmation-ref=...",
    "  task-close.mjs status [--task-path=...] --project=... --task=... [--plan-hash=...]",
    "  task-close.mjs close [--task-path=...] --project=... --task=... --reply-text=... --step-slug=... [--mode=planning] [--required-attachments=JSON] [--remote=origin] [--target-branch=main] [--spec-source=...] [--spec-archive=...]",
    "  task-close.mjs close [--task-path=...] --project=... --task=... --archive=<declaration-ref> --plan-hash=<initial-four-action-plan-hash> --reply-text=... --step-slug=...",
  ].join("\n");
}

async function main() {
  const { command, values } = args(process.argv.slice(2));
  if (!new Set(["prepare", "confirm", "execute", "manual-close", "complete", "status", "close"]).has(command)) throw new TypeError(usage());
  const postArchive = command === "prepare" || command === "close"
    ? postCleanupArchiveInput(values, command)
    : null;
  // A retry after governed worktree removal must be able to reconcile the
  // remaining branch-cleanup step without reopening the deleted Workspace.
  const workspaceRequired = !new Set(["status", "complete", "execute", "manual-close"]).has(command)
    && postArchive === null;
  const { task, workspace, kernel } = context(values, { workspaceRequired, postConfirmation: command === "confirm" });
  const boundary = command === "status" ? null : authenticateWriteBoundary({
    task,
    stage: "verify-code",
    operation: `close.${command}`,
    runnerRoot: RUNNER_ROOT,
    ...(workspace === null ? {} : { workspace }),
  });
  const finish = (result, sourceRef) => {
    const raw = task.readRecord(sourceRef);
    persistWriteBoundaryPathCard({
      task,
      boundary,
      source: { ref: sourceRef, hash: createHash("sha256").update(raw).digest("hex") },
    });
    return result;
  };
  if (command === "close") {
    if (postArchive) {
      const result = await closeDelivery({
        task,
        kernel,
        ...postArchive,
        replyText: required(values, "reply-text"),
        stepSlug: required(values, "step-slug"),
      });
      return finish(result, resultSourceRef(result, `operations/close/plans/${postArchive.priorPlanHash}/plan.json`));
    }
    const requiredAttachments = optionalJsonArray(values, "required-attachments");
    const result = await closeDelivery({
      task,
      kernel,
      remote: values.remote ?? "origin",
      ...(values["target-branch"] ? { targetBranch: values["target-branch"] } : {}),
      ...(values["spec-source"] ? { specSourcePath: values["spec-source"] } : {}),
      ...(values["spec-archive"] ? { specArchivePath: values["spec-archive"] } : {}),
      ...(values.mode || values["close-mode"] ? { closeMode: values.mode ?? values["close-mode"] } : {}),
      ...(requiredAttachments === undefined ? {} : { requiredAttachments }),
      replyText: required(values, "reply-text"),
      stepSlug: required(values, "step-slug"),
    });
    return finish(result, resultSourceRef(result, "operations/close/completed.json"));
  }
  if (command === "status" && values["plan-hash"] === undefined) {
    const completion = optionalCompletion(task);
    return statusWithoutPlan(task, completion);
  }
  if (command === "prepare") {
    if (postArchive) {
      const result = prepareDeliveryClosePlan({ task, kernel, ...postArchive });
      return finish(result, `operations/close/plans/${result.plan_hash}/plan.json`);
    }
    const riskClose = optionalRiskClose(values);
    const requiredAttachments = optionalJsonArray(values, "required-attachments");
    const result = prepareDeliveryClosePlan({ task, kernel, delivery: {
      task_branch: required(values, "task-branch"),
      target_branch: required(values, "target-branch"),
      remote: required(values, "remote"),
      task_commit: required(values, "task-commit"),
      spec_source_path: required(values, "spec-source"),
      spec_archive_path: required(values, "spec-archive"),
      ...(values.mode || values["close-mode"] ? { close_mode: values.mode ?? values["close-mode"] } : {}),
      ...(requiredAttachments === undefined ? {} : { required_attachments: requiredAttachments }),
      ...(riskClose === undefined ? {} : { risk_close: riskClose }),
    }, closeMode: values.mode ?? values["close-mode"] });
    return finish(result, `operations/close/plans/${result.plan_hash}/plan.json`);
  }
  const plan = preparedPlan(task, required(values, "plan-hash"));
  if (command === "confirm") {
    const outcome = required(values, "decision");
    const result = confirmClosePlan({
      task,
      kernel,
      plan,
      outcome,
      ...(values["reply-text"] === undefined ? {} : { replyText: values["reply-text"] }),
      ...(values["step-slug"] === undefined ? {} : { stepSlug: values["step-slug"] }),
    });
    return finish(result, result.ref);
  }
  if (command === "execute") {
    if (plan.delivery?.risk_close !== undefined) throw new Error("risk close plans must use manual-close");
    const result = await executeClosePlan({
      task,
      kernel,
      plan,
      ...(values.archive === undefined ? {} : { archiveDeclarationRef: required(values, "archive") }),
      closeConfirmationRef: required(values, "confirmation-ref"),
      executors: createDeliveryCloseExecutorRegistry({ task, kernel, plan }),
    });
    const sourceRef = result.status === "completed"
      ? "operations/close/completed.json"
      : resultSourceRef(result, required(values, "confirmation-ref"));
    return finish(result, sourceRef);
  }
  if (command === "manual-close") {
    const result = await recordManualDeliveryClose({
      task,
      kernel,
      plan,
      closeConfirmationRef: required(values, "confirmation-ref"),
      executors: createDeliveryCloseExecutorRegistry({ task, kernel, plan }),
    });
    return finish(result, "operations/close/manual-risk-close.json");
  }
  if (command === "complete") {
    const result = await completeDeliveryClosePlan({ task, kernel, plan, closeConfirmationRef: required(values, "confirmation-ref") });
    return finish(result, "operations/close/completed.json");
  }
  const completion = optionalCompletion(task);
  if (completion && (completion.schema_version !== "task-close-completed.v1" || completion.task_id !== task.identity.taskId || completion.plan_hash !== closePlanHash(plan))) {
    throw new Error("completed close record conflicts with the requested plan");
  }
  const closeState = inspectDeliveryCloseState({ task, kernel, plan });
  return {
    plan_hash: closePlanHash(plan),
    record_status: completion?.status ?? "not_completed",
    physical_state: closeState,
    current: currentCloseProjection(task, closeState, kernel),
  };
}

main().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
  console.error(`task-close: ${error.message}`);
  process.exitCode = 1;
});
