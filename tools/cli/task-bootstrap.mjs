#!/usr/bin/env node

/**
 * Official task bootstrap.
 *
 * The only supported way to create or open a task is through this CLI.
 * Hand-editing task.json, manual rollback/rebind, or creating a successor task
 * without a new official invocation is explicitly not supported. A new task
 * must have an authenticated parallel worktree prepared before the stage
 * starts. An existing task is bound explicitly via --workspace-root. Session
 * provenance is not used to select or rebind task identity during bootstrap.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertRuntimeAuthority } from "../../core/runtime-mode.mjs";
import { resolveCanonicalTaskPath } from "../../core/load-config.mjs";
import { canonical } from "../../runtime/evidence/canonical-utils.mjs";
import { authenticateOfficialInvocation, inspectOfficialInvocation } from "../../runtime/evidence/invocation-identity.mjs";
import { resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace, validateExistingWorkspaceBinding } from "../../runtime/task/workspace.mjs";

const RUNNER_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_COMMIT = /^[a-f0-9]{40,64}$/;

function isoNow(now) {
  const value = typeof now === "function" ? now() : new Date();
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) throw new TypeError("activation cohort clock must return a valid Date");
  return value.toISOString();
}

function activationFailure(fallbackCommit, diagnostic) {
  return Object.freeze({ cohort: "pre", entry_release_commit: fallbackCommit ?? "unknown", diagnostic });
}

/** Read the one-time CARD-01 activation marker. Missing or malformed is pre, never a bootstrap gate. */
export function resolveCard01Activation({ storageRoot, fallbackCommit = "unknown", read = readFileSync } = {}) {
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("activation storageRoot must be absolute");
  const marker = join(storageRoot, "activation", "card-01.json");
  if (!existsSync(marker)) return activationFailure(fallbackCommit, null);
  let value;
  try { value = JSON.parse(read(marker, "utf8")); }
  catch (error) { return activationFailure(fallbackCommit, `activation marker is unreadable: ${error.message}`); }
  const valid = value && typeof value === "object" && !Array.isArray(value)
    && value.schema_version === "card-01-activation.v1"
    && value.capability_acceptance && typeof value.capability_acceptance.ref === "string" && value.capability_acceptance.ref.trim() !== "" && SHA256.test(value.capability_acceptance.sha256 ?? "")
    && value.release_marker && GIT_COMMIT.test(value.release_marker.commit ?? "") && new Set(["main", "release"]).has(value.release_marker.channel)
    && value.entry_consumption && typeof value.entry_consumption.evidence_ref === "string" && value.entry_consumption.evidence_ref.trim() !== "" && Number.isFinite(Date.parse(value.entry_consumption.observed_at))
    && Number.isFinite(Date.parse(value.activated_at));
  if (!valid) return activationFailure(fallbackCommit, "activation marker is incomplete or invalid");
  return Object.freeze({ cohort: "post", entry_release_commit: value.release_marker.commit, diagnostic: null });
}

export function activationManifestFields({ storageRoot, fallbackCommit = "unknown", now = () => new Date(), activation = undefined } = {}) {
  const resolved = activation ?? resolveCard01Activation({ storageRoot, fallbackCommit });
  return Object.freeze({
    activation_cohort: resolved.cohort,
    activation_cohort_frozen_at: isoNow(now),
    entry_release_commit: resolved.entry_release_commit,
  });
}

function recordActivationDiagnostic(task, activation) {
  if (!activation.diagnostic) return null;
  const value = {
    record_kind: "activation_cohort_observation",
    task_id: task.identity.taskId,
    cohort: activation.cohort,
    reason: activation.diagnostic,
    observed_at: new Date().toISOString(),
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/activation-cohort-attempts/${sha256(raw)}.json`;
  task.createRecordAtomic(ref, raw);
  return ref;
}

function recordBootstrapTransaction(task, creationResult) {
  const runId = `bootstrap-${task.identity.taskId}`;
  const inspected = inspectOfficialInvocation(task, {
    runnerRoot: RUNNER_ROOT,
    stage: "make-decision",
    runId,
  });
  const { execution_manifest_hash: _oldHash, ...baseIdentity } = inspected.identity;
  const value = {
    ...baseIdentity,
    command: "task-bootstrap",
    creation_result: creationResult,
    transaction: {
      status: "closed",
      closed_at: new Date().toISOString(),
    },
  };
  value.execution_manifest_hash = sha256(canonical(value));
  const raw = `${canonical(value)}\n`;
  task.createInvocationIdentityRecord(inspected.ref, raw);
  return Object.freeze({ ref: inspected.ref, hash: sha256(raw), identity: Object.freeze(value) });
}

function args(argv) { const out = {}; for (const item of argv) { const at = item.indexOf("="); if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`); out[item.slice(2, at)] = item.slice(at + 1); } return out; }
export function bootstrapTask(values, { env = process.env, home, cwd = process.cwd() } = {}) {
  if (Object.prototype.hasOwnProperty.call(values, "candidate-worktree") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) throw new TypeError("--candidate-worktree/--baseline-commit are no longer supported; make-decision owns worktree preparation");
  if (Object.prototype.hasOwnProperty.call(values, "task-path")) {
    for (const key of ["task-path", "project", "task"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required for existing task bootstrap`);
    const allowed = new Set(["task-path", "project", "task", "runner-root", "stage"]);
    const unexpected = Object.keys(values).find((key) => !allowed.has(key));
    if (unexpected) throw new TypeError(`--${unexpected} is invalid for existing task bootstrap`);
    const pathResolution = resolveCanonicalTaskPath({
      project: values.project,
      task: values.task,
      taskPath: values["task-path"],
      env,
      home,
    });
    const task = openTask(pathResolution.taskPath, pathResolution.project, pathResolution.task);
    // createTask publishes task.json atomically before workspace/store setup.
    // Re-enter the existing official path through the idempotent store owner so
    // a manifest-only directory is never returned as an initialized task.
    initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
    const runnerIdentity = values["runner-root"] && values.stage
      ? authenticateOfficialInvocation(task, { runnerRoot: values["runner-root"], stage: values.stage }).identity
      : undefined;
    return Object.freeze({
      task_path: task.taskPath,
      project: task.identity.projectName,
      task: task.identity.taskId,
      task_path_source: pathResolution.source,
      runner_identity: runnerIdentity,
    });
  }
  for (const key of ["project", "task", "target-repo"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  const target = realpathSync(values["target-repo"]);
  let targetTop;
  try { targetTop = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()); }
  catch (error) { throw new Error(`target repository validation failed: ${error.stderr?.toString().trim() || error.message}`); }
  if (targetTop !== target) throw new Error("target repository must be a Git toplevel directory");
  const existingWorkspace = values["workspace-root"] === undefined
    ? null
    : validateExistingWorkspaceBinding({ targetRepoRoot: target, workspaceRoot: values["workspace-root"] });
  const inputs = values.inputs ? JSON.parse(readFileSync(values.inputs, "utf8")) : {};
  const rawRequirementRecords = inputs?.raw_requirement?.records;
  const safeTaskEvidenceRef = (ref) => typeof ref === "string"
    && ref.startsWith("quality/evidence/")
    && ref.slice("quality/evidence/".length).split("/").every((segment) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment));
  const safeRawRequirementRecordRef = (ref) => safeTaskEvidenceRef(ref)
    && ref.startsWith("quality/evidence/raw-requirements/");
  const validRawRequirementRecord = (record) => record && typeof record === "object" && !Array.isArray(record)
    && Object.keys(record).every((key) => ["ref", "sha256", "content"].includes(key))
    && safeRawRequirementRecordRef(record.ref)
    && SHA256.test(record.sha256 ?? "")
    && typeof record.content === "string"
    && sha256(record.content) === record.sha256;
  const validRawRequirement = (value) => value && typeof value === "object" && !Array.isArray(value)
    && safeTaskEvidenceRef(value.ref)
    && SHA256.test(value.sha256 ?? "")
    && Object.keys(value).every((key) => ["ref", "sha256", "records"].includes(key))
    && (value.records === undefined || Array.isArray(value.records)
      && value.records.length > 0
      && value.records.every(validRawRequirementRecord)
      && new Set(value.records.map((record) => record.ref)).size === value.records.length
      && value.records.some((record) => record.ref === value.ref && record.sha256 === value.sha256));
  const invalidInputs = !inputs || typeof inputs !== "object" || Array.isArray(inputs)
    || Object.keys(inputs).some((key) => !["decision", "spec", "build_plan", "raw_requirement"].includes(key))
    || Object.entries(inputs).some(([key, value]) => key === "raw_requirement"
      ? !validRawRequirement(value)
      : typeof value !== "string" || !isAbsolute(value));
  if (invalidInputs) throw new TypeError("inputs must contain absolute decision/spec/build_plan refs or a task-relative raw_requirement {ref,sha256,records?}; raw requirement records need safe evidence refs and matching source-byte hashes");
  const manifestInputs = inputs.raw_requirement
    ? { ...inputs, raw_requirement: { ref: inputs.raw_requirement.ref, sha256: inputs.raw_requirement.sha256 } }
    : inputs;
  const storageResolution = resolveStorageRootDetails({ env, home });
  const storageRoot = storageResolution.storage_root;
  const authority = assertRuntimeAuthority(storageRoot, { home, expectedEpoch: values.epoch });
  const fallbackCommit = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: target, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim();
  const activation = resolveCard01Activation({ storageRoot, fallbackCommit });
  const cohortFields = activationManifestFields({ storageRoot, fallbackCommit, activation });
  const task = createTask({ storageRoot, manifest: {
    schema_version: "1.0.0",
    execution_mode: "per_invocation",
    record_model: "vnext-single-write",
    project_name: values.project,
    task_id: values.task,
    created_at: new Date().toISOString(),
    target_repo_root: target,
    ...cohortFields,
    write_resolution_source: storageResolution.selected_source,
    ...(existingWorkspace ? { workspace_mode: "existing", workspace_root: existingWorkspace.worktreeRoot } : {}),
    issue_ids: values.issues ? values.issues.split(",").filter(Boolean) : [],
    inputs: manifestInputs,
  } });
  // A new task is not ready until its authenticated parallel worktree exists.
  // Prepare it before initializing the task store, so Git/path failures
  // surface at bootstrap rather than at publication.
  const workspace = prepareTaskWorkspace(task);
  const store = initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  for (const record of rawRequirementRecords ?? []) task.createRecordAtomic(record.ref, record.content);
  const activationDiagnosticRef = recordActivationDiagnostic(task, activation);
  const bootstrapIdentity = recordBootstrapTransaction(task, {
    status: "completed",
    task_path: task.taskPath,
    project: task.identity.projectName,
    task: task.identity.taskId,
    workspace: {
      worktree_root: workspace.worktreeRoot,
      branch: workspace.branch,
      baseline_commit: workspace.baselineCommit,
    },
    store: { record_ref: store.record_ref },
  });
  return Object.freeze({
    task_path: task.taskPath,
    project: task.identity.projectName,
    task: task.identity.taskId,
    task_path_source: "canonical_resolver",
    storage_root: authority.storage_root,
    cutover_epoch: authority.cutover_epoch,
    activation: Object.freeze({ cohort: activation.cohort, ...(activationDiagnosticRef ? { diagnostic_ref: activationDiagnosticRef } : {}) }),
    bootstrap_identity_ref: bootstrapIdentity.ref,
    workspace: Object.freeze({ worktree_root: workspace.worktreeRoot, branch: workspace.branch, baseline_commit: workspace.baselineCommit }),
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(bootstrapTask(args(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}
