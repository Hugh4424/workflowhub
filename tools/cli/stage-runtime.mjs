#!/usr/bin/env node

import { accessSync, constants as fsConstants, existsSync, lstatSync, readFileSync, readdirSync, realpathSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { importCanonicalReviewResult, recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { assertRuntimeAuthority } from "../../core/runtime-mode.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { resolveCanonicalTaskPath } from "../../core/load-config.mjs";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
} from "../../runtime/stage/stage-context.mjs";
import { authenticateStageOutcomeForProjection, runOfficialStage, runStageEndReflection } from "../../runtime/stage/stage-runner.mjs";
import { validateStageInvocation } from "../../runtime/stage/stage-handlers.mjs";
import { diagnoseMissingInput } from "../../runtime/stage/stage-handlers.mjs";
import { runStageReflection } from "../../runtime/stage/stage-reflect.mjs";
import {
  validateAcceptanceEvidence,
  publishEvidence,
} from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { runCapture as captureBuildCodeTests } from "../../workflows/build-code/capture.mjs";
import { runCapture as captureVerifyCodeTests } from "../../workflows/verify-code/capture.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { deriveExecutionOutcomes, deriveStageCompletion, deriveStageProgress, stageMaterialScopeRevision, stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import { validatePlanTaskContract } from "../../runtime/stage/stage-content-contracts.mjs";
import { authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { deriveResearchStatus, listCurrentResearchReports } from "../../runtime/evidence/research-report.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
// The two stage-result projections read their current result from the frozen
// stage row of the single execution record, never from stage-outcome bytes.
import { readTaskFacts } from "../../runtime/task/task-store.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import {
  assertNoTaskTypeArguments,
  inspectTaskType,
  isTypeRelatedStage,
  readActivationCohort,
  recordTypeAttempt,
  validateStageForTopology,
} from "../../runtime/task/task-topology.mjs";
import {
  projectPortableWorkflowStatus,
  runPortableWorkflow,
} from "../../runtime/task/portable-workflow-run.mjs";
import { validateProjectName, validateTaskId } from "../../runtime/task/task-identity.mjs";
import { resolveStorageRoot, resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";
import { resolveSimpleReviewRouteIdentity, runSimpleReview, simpleReviewProviderMaterialId } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { captureReviewSource } from "../../skills/wh-review/scripts/review-source.mjs";
import { buildReviewMaterials, reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});

export function stageRuntimeProcessExitCode(result) {
  const stageRowWriteFailed = typeof result?.stage_row_error === "string"
    || typeof result?.stage_reflection?.stage_row_error === "string";
  return result?.status === "protocol_invalid" ? 2 : stageRowWriteFailed ? 1 : 0;
}
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const GIT_OID = /^[a-f0-9]{40,64}$/;
const WORKFLOW_STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const PORTABLE_WORKFLOW_STAGE = "build-prd";

// The managed broker has its own terminal-wait policy and must not be aborted
// by the recorder's short generic deadline. Test injections remain bounded so
// a non-cooperating substitute cannot retain the task lock indefinitely.
export function reviewRecordTimeoutForRunner({ managed = false } = {}) {
  if (typeof managed !== "boolean") throw new TypeError("managed review runner flag must be boolean");
  return managed ? null : undefined;
}

function topologyRouteError(message, details = {}) {
  const error = new Error(message);
  error.code = "TASK_TOPOLOGY_INVALID";
  Object.assign(error, details);
  return error;
}

/**
 * Read the sole human declaration and select the frozen topology. The public
 * run entry authenticates its write identity before calling this function,
 * because an unknown declaration can append an immutable attempt fact.
 */
export function resolveTaskTopologyRoute({ identity, stage, recordUnknownAttempt = true } = {}) {
  const task = openTask(identity?.taskPath, identity?.project, identity?.task);
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  let decisionLog = "";
  let readError = null;
  try {
    decisionLog = artifacts.read("decision-log.md");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    readError = error;
  }
  const taskType = inspectTaskType(decisionLog);
  if (taskType.status !== "known") {
    let attempt = null;
    let attemptError = null;
    if (recordUnknownAttempt) {
      try {
        attempt = recordTypeAttempt({
          task,
          observed_kind: taskType.observed_kind,
          observed_summary: readError?.message ?? taskType.reason,
        });
      } catch (error) {
        attemptError = error;
      }
    }
    throw topologyRouteError(
      "任务类型无法识别，请在 make-decision 的任务身份段声明恰一条受控值标签",
      { task_type: taskType, task_type_attempt: attempt, task_type_attempt_error: attemptError?.message ?? null },
    );
  }
  const activationCohort = readActivationCohort(task.manifest);
  const validation = validateStageForTopology({
    task_type: taskType.task_type,
    activation_cohort: activationCohort,
    stage,
  });
  if (!validation.ok) {
    throw topologyRouteError(
      `阶段 ${stage} 不在任务类型 ${taskType.task_type} 的拓扑中；期望 ${validation.expected.join(" → ")}`,
      { task_type: taskType, activation_cohort: activationCohort, topology: validation.expected },
    );
  }
  return Object.freeze({
    task,
    workspace,
    artifacts,
    task_type: taskType.task_type,
    activation_cohort: activationCohort,
    topology: validation.expected,
  });
}

export function resolveWorkflowHubIdentity(values, cwd = process.cwd(), env = process.env) {
  const hasProject = typeof values.project === "string" && values.project.trim() !== "";
  const hasTask = typeof values.task === "string" && values.task.trim() !== "";
  if (hasProject !== hasTask) throw new TypeError("--project and --task must be supplied together");
  const explicit = hasProject
    ? resolveCanonicalTaskPath({ project: values.project, task: values.task, taskPath: values["task-path"], env, home: env?.HOME })
    : null;
  const derived = deriveIdentityFromAuthenticatedWorktree(cwd, env);
  if (explicit && derived
      && (explicit.project !== derived.project || explicit.task !== derived.task)) {
    throw new Error(`WorkflowHub identity conflict: explicit ${explicit.project}/${explicit.task} does not match authenticated worktree ${derived.project}/${derived.task}`);
  }
  if (explicit) return Object.freeze({
    project: explicit.project,
    task: explicit.task,
    taskPath: explicit.taskPath,
    source: "explicit",
    taskPathSource: explicit.source,
  });
  if (derived) return derived;
  throw new Error("WorkflowHub identity missing: supply --project and --task or run from an authenticated task worktree");
}

/**
 * Check the complete identity tuple immediately before a formal write.
 * Explicit task/path values are useful diagnostics, but they never replace the
 * canonical task path or the Workspace bound to the opened TaskHandle.
 */
export function assertTaskWriteIdentity({
  task,
  project,
  taskId,
  taskPath,
  workspace,
  workspaceRoot,
  cwd = process.cwd(),
  env = process.env,
  checkCwd = true,
  requireWorkspace = true,
} = {}) {
  if (!task || typeof task !== "object" || !task.identity || !task.manifest) {
    throw new TypeError("TaskHandle is required for write identity validation");
  }
  const violations = [];
  if (project !== task.identity.projectName) violations.push("PROJECT_ID_MISMATCH");
  if (taskId !== task.identity.taskId) violations.push("TASK_ID_MISMATCH");

  let canonicalTaskPath;
  try {
    canonicalTaskPath = resolveCanonicalTaskPath({
      project: task.identity.projectName,
      task: task.identity.taskId,
      env,
      home: env?.HOME,
    }).taskPath;
  } catch {
    violations.push("CANONICAL_TASK_PATH_UNAVAILABLE");
  }
  const declaredTaskPath = taskPath ?? task.taskPath;
  if (typeof declaredTaskPath !== "string" || !isAbsolute(declaredTaskPath)) {
    violations.push("TASK_PATH_INVALID");
  } else if (canonicalTaskPath
      && (resolve(declaredTaskPath) !== canonicalTaskPath || resolve(task.taskPath) !== canonicalTaskPath)) {
    violations.push("TASK_PATH_MISMATCH");
  }

  let realDeclaredWorkspaceRoot = null;
  if (requireWorkspace) {
    let authenticatedWorkspaceRoot = null;
    try {
      authenticatedWorkspaceRoot = workspace?.worktreeRoot ?? null;
    } catch {
      violations.push("WORKSPACE_INVALID");
    }
    let declaredWorkspaceRoot = workspaceRoot ?? authenticatedWorkspaceRoot;
    if (typeof declaredWorkspaceRoot !== "string" || !isAbsolute(declaredWorkspaceRoot)) {
      violations.push("WORKSPACE_ROOT_INVALID");
      declaredWorkspaceRoot = null;
    }
    try {
      if (declaredWorkspaceRoot !== null) realDeclaredWorkspaceRoot = realpathSync(resolve(declaredWorkspaceRoot));
    } catch {
      violations.push("WORKSPACE_ROOT_INVALID");
    }
    if (authenticatedWorkspaceRoot !== null && realDeclaredWorkspaceRoot !== null) {
      try {
        if (realpathSync(authenticatedWorkspaceRoot) !== realDeclaredWorkspaceRoot) violations.push("WORKSPACE_ROOT_MISMATCH");
      } catch {
        violations.push("WORKSPACE_INVALID");
      }
    }
    if (typeof task.manifest.workspace_root === "string" && realDeclaredWorkspaceRoot !== null) {
      try {
        if (realpathSync(task.manifest.workspace_root) !== realDeclaredWorkspaceRoot) violations.push("WORKSPACE_ROOT_MISMATCH");
      } catch {
        violations.push("WORKSPACE_ROOT_INVALID");
      }
    }
  }
  if (checkCwd && requireWorkspace) {
    const currentRoot = gitWorktreeRoot(cwd);
    if (!currentRoot) violations.push("CURRENT_WORKTREE_UNAVAILABLE");
    else if (realDeclaredWorkspaceRoot !== null && currentRoot !== realDeclaredWorkspaceRoot) violations.push("CURRENT_WORKTREE_MISMATCH");
  }
  const uniqueViolations = [...new Set(violations)];
  if (uniqueViolations.length) {
    const error = new Error(`WRITE_IDENTITY_PREFLIGHT_FAILED: ${uniqueViolations.join(",")}`);
    error.code = "WRITE_IDENTITY_PREFLIGHT_FAILED";
    error.violations = Object.freeze(uniqueViolations);
    throw error;
  }
  return Object.freeze({
    task_id: task.identity.taskId,
    canonical_task_path: canonicalTaskPath,
    worktree_root: realDeclaredWorkspaceRoot,
  });
}

function gitWorktreeRoot(cwd) {
  try {
    const value = String(execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim();
    return realpathSync(value);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.status !== undefined) return null;
    throw error;
  }
}

function gitRepositoryRoot(cwd, worktreeRoot) {
  try {
    const common = String(execFileSync("git", ["rev-parse", "--git-common-dir"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim();
    const commonRoot = realpathSync(resolve(worktreeRoot, common));
    if (basename(commonRoot) !== ".git") return null;
    return dirname(commonRoot);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.status !== undefined) return null;
    throw error;
  }
}

function realDirectoryEntry(path, label) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a real directory: ${path}`);
  return realpathSync(path);
}

function registeredTaskCandidates(storageRoot, repositoryRoot, worktreeRoot) {
  const projectsRoot = resolve(storageRoot, "Projects");
  if (!existsSync(projectsRoot)) return [];
  realDirectoryEntry(projectsRoot, "WorkflowHub Projects root");
  const candidates = [];
  for (const projectEntry of readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!projectEntry.isDirectory() || projectEntry.isSymbolicLink()) continue;
    const projectRoot = resolve(projectsRoot, projectEntry.name);
    const tasksRoot = resolve(projectRoot, "tasks");
    if (!existsSync(tasksRoot)) continue;
    realDirectoryEntry(tasksRoot, "WorkflowHub task directory");
    for (const taskEntry of readdirSync(tasksRoot, { withFileTypes: true })) {
      if (!taskEntry.isDirectory() || taskEntry.isSymbolicLink()) continue;
      const taskId = taskEntry.name;
      let validTaskId;
      try { validTaskId = validateTaskId(taskId); } catch { continue; }
      const taskPath = resolve(tasksRoot, taskId);
      const deterministicRoot = resolve(dirname(repositoryRoot), `${basename(repositoryRoot)}-${validTaskId}`);
      let manifest;
      let manifestReadable = false;
      if (deterministicRoot !== worktreeRoot) {
        const manifestPath = resolve(taskPath, "task.json");
        try {
          const stat = lstatSync(manifestPath);
          if (stat.isSymbolicLink() || !stat.isFile()) continue;
          manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
          manifestReadable = true;
        } catch (error) {
          if (error?.code === "ENOENT") continue;
          continue;
        }
        if (manifest?.workspace_mode !== "existing"
            || typeof manifest.workspace_root !== "string"
            || resolve(manifest.workspace_root) !== worktreeRoot
            || typeof manifest.target_repo_root !== "string"
            || resolve(manifest.target_repo_root) !== repositoryRoot) continue;
      }
      candidates.push(Object.freeze({
        projectName: projectEntry.name,
        taskId: validTaskId,
        taskPath,
        manifestReadable,
      }));
    }
  }
  return candidates;
}

function deriveIdentityFromAuthenticatedWorktree(cwd, env) {
  const worktreeRoot = gitWorktreeRoot(cwd);
  if (!worktreeRoot) return null;
  const repositoryRoot = gitRepositoryRoot(cwd, worktreeRoot);
  if (!repositoryRoot) return null;
  const storageRoot = resolveStorageRoot({ env, home: env?.HOME });
  const candidates = registeredTaskCandidates(storageRoot, repositoryRoot, worktreeRoot);
  if (candidates.length === 0) return null;
  if (candidates.length > 1) {
    throw new Error(`WorkflowHub identity conflict: multiple task manifests are registered for worktree ${worktreeRoot}`);
  }
  const candidate = candidates[0];
  const task = openTask(candidate.taskPath, candidate.projectName, candidate.taskId);
  const workspace = openCurrentTaskWorkspace(task);
  if (workspace.worktreeRoot !== worktreeRoot) {
    throw new Error("authenticated task worktree does not match the current Git worktree");
  }
  return Object.freeze({
    project: task.identity.projectName,
    task: task.identity.taskId,
    taskPath: task.taskPath,
    source: "worktree",
    taskPathSource: "authenticated_worktree",
  });
}

export function normalizeAcceptanceEvidencePublication(input, snapshotTree) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.acceptance_criterion_id !== "string"
      || !new Set(["pass", "fail"]).has(input.result)
      || !Array.isArray(input.refs)) {
    throw new TypeError("acceptance evidence input requires acceptance_criterion_id, result, refs, and optional summary");
  }
  const allowed = new Set(["acceptance_criterion_id", "result", "refs", "summary", "source_digest"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new TypeError(`acceptance evidence input has caller-forbidden or unknown field: ${unknown.join(", ")}`);
  }
  if (!GIT_OID.test(snapshotTree ?? "")) throw new TypeError("acceptance evidence runtime snapshot_tree is required");
  return validateAcceptanceEvidence({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: input.acceptance_criterion_id,
    result: input.result,
    refs: input.refs,
    ...(input.source_digest === undefined ? {} : { source_digest: input.source_digest }),
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    snapshot_tree: snapshotTree,
  });
}

function isIntegrationReviewRequest(request) {
  return request?.stage === "build-code"
    && (request.review_scope ?? request.reviewScope ?? null) === "integration";
}

function isTaskBoundBuildCodeReviewRequest(request) {
  const scope = request?.review_scope ?? request?.reviewScope ?? null;
  if (request?.stage === "verify-code") return scope === null;
  return request?.stage === "build-code"
    && (scope === "phase" || scope === "integration");
}

/** Build the provider-visible build-code packet from the authenticated task workspace. */
export function prepareTaskBoundBuildCodeReviewBundle(context, request, {
  loadConfig = loadTrustedThirdReviewConfig,
  captureSource = captureReviewSource,
  buildMaterials = buildReviewMaterials,
} = {}) {
  if (!isTaskBoundBuildCodeReviewRequest(request)) throw new TypeError("task-bound build-code review request required");
  const reviewScope = request.review_scope ?? request.reviewScope;
  const trusted = loadConfig({ requestedStage: request.stage, requestedTrack: request.review_track ?? request.reviewTrack ?? null,
    requestedReviewKind: request.review_kind ?? request.reviewKind ?? null });
  const source = captureSource({ workspace: context.workspace, reviewDataRoot: trusted.attachmentRoot,
    includeDiff: true, taskId: context.task.identity.taskId });
  try {
    const built = buildMaterials({
      reviewDataRoot: trusted.attachmentRoot,
      attachmentRoot: trusted.attachmentRoot,
      source,
      task: context.task,
      taskId: context.task.identity.taskId,
      stage: request.stage,
      phaseId: request.phase_id ?? null,
      reviewTrack: request.review_track ?? request.reviewTrack ?? null,
      reviewScope,
      reviewKind: request.review_kind ?? request.reviewKind ?? null,
      materials: {
        ...(request.materials ?? {}),
        // The fixed instruction is a runner-owned control file. Keep it out
        // of caller packet identity and inject it only after the authenticated
        // current-worktree bundle has been selected.
        review_instructions: reviewInstructionsFor(
          request.stage,
          request.review_track ?? request.reviewTrack ?? null,
          false,
          reviewScope,
          request.review_kind ?? request.reviewKind ?? null,
        ),
      },
    });
    let disposed = false;
    return Object.freeze({
      ...built,
      dispose() {
        if (disposed) return;
        disposed = true;
        rmSync(built.bundleRoot, { recursive: true, force: true });
      },
    });
  } finally {
    source.dispose?.();
  }
}

/** Kept as a named compatibility export for integration callers. */
export function prepareTaskBoundIntegrationReviewBundle(context, request, dependencies = {}) {
  if (!isIntegrationReviewRequest(request)) throw new TypeError("task-bound integration review request required");
  return prepareTaskBoundBuildCodeReviewBundle(context, request, dependencies);
}

function readQualityEvidence(task) {
  return (ref) => /^quality\/evidence\/stage-quality\/build-code\/acceptance-(?:stdout|stderr)-[a-f0-9]{64}\.bin$/.test(ref)
    ? task.readRecordBytes(ref) : task.readRecord(ref);
}

function collectCurrentQualityFactObservations({ context, stage = null }) {
  const observations = [];
  for (const ref of context.task.listCanonicalQualityFactRefs()) {
    let value;
    let raw;
    try {
      raw = context.task.readRecord(ref);
      value = JSON.parse(raw);
    } catch { continue; }
    if (value?.task_id !== context.task.identity.taskId || (stage !== null && value?.stage !== stage)) continue;
    const authentication = authenticateQualityFactRecord({ ...value, ref, sha256: sha256(raw) }, {
      read: readQualityEvidence(context.task),
    });
    observations.push({ fact: { ref, value }, authenticated: authentication.authenticated === true, recorded: true, authentication });
  }
  return observations;
}

/**
 * Read the six named status reference classes from canonical task facts.
 * Directory contents never decide which reference is current: K1-K3 are
 * fixed names, and K4-K6 are names carried by the frozen facts row.
 */
const STATUS_MATERIAL_REFS = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
export const REFLECTION_CONCLUSION_FIELDS = Object.freeze([
  "what_helped",
  "what_to_improve",
  "blockers",
  "intervention_reasons",
  "what_to_simplify",
  "simplifiable_now",
]);

function statusRootCauseId(gap) {
  const text = String(gap);
  const prerequisite = /^verify-code prerequisite missing:\s*(.+)$/.exec(text);
  if (prerequisite) return statusRootCauseId(prerequisite[1]);
  const stagePredicate = /^stage_predicate_missing:([^:]+):(.+)$/.exec(text);
  if (stagePredicate) return `stage_predicate_missing:${stagePredicate[1]}:${stagePredicate[2]}`;
  const stageCompletion = /^stage_completion_(?:missing|not_completed|unbound):(.+)$/.exec(text);
  if (stageCompletion) return `stage_completion:${stageCompletion[1]}`;
  const acceptance = /^(acceptance_result_(?:not_pass|unbound|missing|unexpected)):(.+?)(?::.*)?$/.exec(text);
  if (acceptance) return `${acceptance[1]}:${acceptance[2]}`;
  return text;
}

function collectNamedRefs(value, refs = new Set()) {
  if (typeof value === "string") {
    const normalized = value.replace(/^\.\//, "");
    if (/^(?:quality|evidence|operations|review|reviews)\/[A-Za-z0-9._/-]+$/.test(normalized)) refs.add(normalized);
    return refs;
  }
  if (!value || typeof value !== "object") return refs;
  for (const nested of Object.values(value)) collectNamedRefs(nested, refs);
  return refs;
}

function canonicalTaskFacts(context) {
  try {
    return readTaskFacts(context.task.taskPath);
  } catch {
    return [];
  }
}

export function readStageReflectionConclusion(context, stage, facts) {
  const refs = new Set();
  for (const row of facts) {
    if (row?.stage !== stage) continue;
    for (const ref of collectNamedRefs(row)) {
      if (ref.includes("stage-reflection")) refs.add(ref);
    }
  }
  const ref = [...refs].sort()[0] ?? null;
  if (!ref) return Object.freeze({ status: "unavailable", ref: null, conclusion: null });
  try {
    const value = JSON.parse(context.task.readRecord(ref));
    return Object.freeze({
      status: typeof value?.status === "string" ? value.status : "recorded",
      ref,
      conclusion: value?.conclusion ?? value?.summary ?? value?.reflection ?? null,
      status_matrix: value?.status_matrix ?? null,
      ...Object.fromEntries(REFLECTION_CONCLUSION_FIELDS.map((field) => [field, value?.[field] ?? null])),
    });
  } catch {
    return Object.freeze({
      status: "unavailable",
      ref,
      conclusion: null,
      status_matrix: null,
      ...Object.fromEntries(REFLECTION_CONCLUSION_FIELDS.map((field) => [field, null])),
    });
  }
}

export function diagnoseStageInput(options = {}) {
  return diagnoseMissingInput(options);
}

export function deriveNamedStatusRefs({ facts = [] } = {}) {
  const K4 = new Set();
  const K5 = new Set();
  for (const row of facts) {
    for (const ref of collectNamedRefs(row)) {
      if (/^quality\/(?:confirmations|authorizations)\/[a-f0-9]{64}\.json$/.test(ref)) K4.add(ref);
      else K5.add(ref);
    }
  }
  return Object.freeze([
    Object.freeze({ class: "K1", name: "task.json", refs: Object.freeze(["task.json"]), source: "task.json" }),
    Object.freeze({ class: "K2", name: "facts.jsonl", refs: Object.freeze(["facts.jsonl"]), source: "facts.jsonl" }),
    Object.freeze({ class: "K3", name: "current materials", refs: Object.freeze([...STATUS_MATERIAL_REFS]), source: "authenticated worktree" }),
    Object.freeze({ class: "K4", name: "named confirmations and authorizations", refs: Object.freeze([...K4].sort()), source: "facts.jsonl" }),
    Object.freeze({ class: "K5", name: "named evidence references", refs: Object.freeze([...K5].sort()), source: "facts.jsonl or close-action row" }),
    Object.freeze({ class: "K6", name: "material diff inputs", refs: Object.freeze(STATUS_MATERIAL_REFS.map((file) => `${file}:HEAD-diff`)), source: "git diff" }),
  ]);
}

export function deriveStatusRootCauses({ quality = null, research = null, sliceAdvisory = null, stale = null } = {}) {
  const causes = new Map();
  const add = (id, status, source, refs = [], detail = null) => {
    const rootCauseId = statusRootCauseId(id);
    const current = causes.get(rootCauseId) ?? { root_cause_id: rootCauseId, status, source, refs: [], details: [] };
    for (const ref of refs) if (typeof ref === "string" && !current.refs.includes(ref)) current.refs.push(ref);
    if (detail !== null && !current.details.includes(detail)) current.details.push(detail);
    causes.set(rootCauseId, current);
  };
  for (const gap of quality?.missing ?? []) {
    const subject = String(gap);
    const normalized = statusRootCauseId(subject);
    add(subject, "actionable", "quality facts", [quality?.predicates?.[subject]?.fact_ref ?? quality?.predicates?.[normalized]?.fact_ref ?? "facts.jsonl"], subject);
  }
  if (["unavailable", "unknown", "incomplete"].includes(research?.status)) {
    add("research", research.status, "research report", [research.report_ref].filter(Boolean), `research:${research.status}`);
  }
  if (sliceAdvisory?.status === "unexplained_overage" || sliceAdvisory?.diagnostics?.length) {
    add("slice_advisory", "advisory", "plan.md", ["plan.md"], "slice advisory requires operator review");
  }
  if (stale?.status === "stale") {
    add("stale", "stale", stale.source ?? "named material diff", [stale.source].filter(Boolean), stale.detail ?? "current target advanced");
  }
  if (causes.size === 0) {
    add("none", "clear", "facts.jsonl", ["facts.jsonl"], "no canonical root cause recorded");
  }
  return Object.freeze([...causes.values()].map((cause) => Object.freeze({
    ...cause,
    refs: Object.freeze(cause.refs),
    details: Object.freeze(cause.details),
  })));
}

/**
 * Derive the current status from authenticated quality facts and the frozen
 * task row. The result has three fact domains, six named reference classes,
 * and one stage-reflection conclusion; it does not create another authority.
 */
export function deriveCurrentStatusDomains(context, {
  stage = "verify-code",
  currentSnapshot,
  materialRevision,
  materials,
  stale = null,
} = {}) {
  if (!context?.task || !context?.kernel || !currentSnapshot || typeof materialRevision !== "string" || !materials || typeof materials !== "object" || Array.isArray(materials)) {
    throw new TypeError("current status domain derivation requires an authenticated context, snapshot, material revision, and materials");
  }
  const observations = collectCurrentQualityFactObservations({ context, currentSnapshot, materialRevision, materials, stage });
  const quality = deriveStageCompletion(stage, observations, {
    requireOutline: stage === "make-decision" && context.manifest?.record_model === "vnext-single-write",
  });
  const facts = canonicalTaskFacts(context);
  const stageReflection = readStageReflectionConclusion(context, stage, facts);
  return Object.freeze({
    work_progress: deriveStageProgress(stage, observations, materials),
    stage_quality: quality,
    root_causes: deriveStatusRootCauses({ quality, stale }),
    named_refs: deriveNamedStatusRefs({ facts }),
    stage_reflection: stageReflection,
    status_matrix: stageReflection.status_matrix ?? null,
    identity: Object.freeze({ task_id: context.identity.taskId, material_revision: materialRevision, snapshot_tree: currentSnapshot.tree }),
    source_completeness: Object.freeze({ task_json: true, facts_jsonl: facts.length > 0, materials: STATUS_MATERIAL_REFS.every((file) => typeof materials[file] === "string") }),
  });
}

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["doctor", "status", "artifact", "review-risk-pause", "review-record", "capture-tests", "capture-evidence", "preflight", "run", "reflect", "confirm", "authorize-operation"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <doctor|status|run|review|verify|confirm|authorize> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

function readTaskBoundInput(context, inputPath) {
  try {
    return JSON.parse(readFileSync(inputPath, "utf8"));
  } catch (error) {
    // Quality inputs are written to the authenticated external task store,
    // while the launcher runs from the dedicated worktree.  Resolve only an
    // explicit canonical quality ref after the normal filesystem read fails;
    // never scan for the latest record or accept an arbitrary external path.
    if (error?.code !== "ENOENT"
        || typeof inputPath !== "string"
        || !/^quality\/(?:tests|evidence)\//.test(inputPath)
        || inputPath.includes("..")) throw error;
    const raw = context.task.readRecord(inputPath);
    return JSON.parse(raw);
  }
}

function preflightDiagnostic(error) {
  if (error?.diagnostic && typeof error.diagnostic.path === "string") return error.diagnostic;
  return {
    path: "$",
    expected: "valid stage payload",
    actual: error?.message ?? String(error),
  };
}

function preflightFactDiagnostic(path, expected, actual) {
  return { path, expected: String(expected), actual: String(actual) };
}

function executableCommand(argv) {
  if (!Array.isArray(argv) || argv.length === 0 || typeof argv[0] !== "string" || argv[0].trim() === "") return false;
  try {
    accessSync(argv[0], fsConstants.X_OK);
    return true;
  } catch {
    if (!argv[0].includes("/")) {
      return String(process.env.PATH ?? "").split(":").filter(Boolean).some((directory) => {
        try { accessSync(resolve(directory, argv[0]), fsConstants.X_OK); return true; } catch { return false; }
      });
    }
    return false;
  }
}

function runPreflight(stage, input, services = {}) {
  // Preflight is a pure payload-shape diagnostic and must remain able to
  // inspect legacy/caller-supplied fields without selecting the vNext writer.
  validateStageInvocation(stage, input, { currentOnly: false });
  const adapter = services.preflight;
  if (adapter === undefined) return { status: "valid", diagnostics: [] };
  if (!adapter || typeof adapter !== "object" || Array.isArray(adapter)) {
    return { status: "protocol_invalid", diagnostics: [preflightFactDiagnostic("services.preflight", "an object adapter", adapter)] };
  }
  const checks = [
    ["command", executableCommand(adapter.command), "an existing executable command", adapter.command ?? "missing"],
    ["paths", Array.isArray(adapter.paths) && adapter.paths.length > 0 && adapter.paths.every((value) => typeof value === "string" && value.trim() !== "" && isAbsolute(value) && existsSync(value)), "existing absolute paths", adapter.paths ?? "missing"],
    ["host_provider", typeof adapter.host_provider === "string" && adapter.host_provider.trim() !== "", "configured host_provider", adapter.host_provider ?? "missing"],
    ["route", adapter.route && Array.isArray(adapter.route.providers) && adapter.route.providers.length > 0, "a resolvable non-empty provider route", adapter.route ?? "missing"],
    ["packet.bytes", Number.isSafeInteger(adapter.packet?.bytes) && adapter.packet.bytes >= 0, "a non-negative packet byte count", adapter.packet?.bytes ?? "missing"],
    ["capabilities", adapter.capabilities && typeof adapter.capabilities === "object" && Object.keys(adapter.capabilities).length > 0 && Object.values(adapter.capabilities).every((value) => typeof value === "string" && value.trim() !== "" && value !== "unknown"), "configured non-unknown capability permissions", adapter.capabilities ?? "missing"],
  ];
  const failed = checks.find(([, ok]) => !ok);
  if (failed) {
    return { status: "protocol_invalid", diagnostics: [preflightFactDiagnostic(failed[0], failed[2], failed[3])] };
  }
  return { status: "valid", diagnostics: [] };
}

function suspectedSecondaryStorageRoots(storageRoot) {
  const normalized = resolve(storageRoot);
  if (basename(normalized) !== "Knowledge") return [];
  const candidate = resolve(dirname(dirname(normalized)), "Knowledge");
  return candidate !== normalized && existsSync(candidate) ? [candidate] : [];
}

function doctorStorage(context, { env = process.env, home = homedir() } = {}) {
  const resolution = resolveStorageRootDetails({ env, home });
  const taskWriteRoot = resolve(dirname(dirname(dirname(dirname(context.task.taskPath)))));
  const suspected = suspectedSecondaryStorageRoots(resolution.storage_root);
  const recordedSource = context.task.manifest.write_resolution_source ?? "unknown";
  const warnings = [];
  if (taskWriteRoot !== resolution.storage_root) {
    warnings.push({ type: "task_write_root_mismatch", path: taskWriteRoot, expected: resolution.storage_root });
  }
  if (recordedSource !== "unknown" && recordedSource !== resolution.selected_source) {
    warnings.push({ type: "write_resolution_source_mismatch", path: context.task.taskPath, expected: resolution.selected_source, actual: recordedSource });
  }
  for (const path of suspected) warnings.push({ type: "suspected_secondary_root", path });
  return Object.freeze({
    resolution_chain: resolution.resolution_chain,
    selected_source: resolution.selected_source,
    task_write_root: taskWriteRoot,
    write_resolution_source: recordedSource,
    suspected_secondary_roots: Object.freeze(suspected),
    warnings: Object.freeze(warnings),
  });
}

function privateEvidenceCaptureInput(input, worktreeRoot, now = () => new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.source_path !== "string" || input.source_path.trim() === ""
      || typeof input.evidence_type !== "string"
      || Object.keys(input).some((key) => !new Set(["source_path", "evidence_type"]).has(key))) {
    throw new TypeError("capture-evidence input requires source_path and evidence_type only");
  }
  const sourcePath = input.source_path.trim();
  if (isAbsolute(sourcePath) || sourcePath.split(/[\\/]/).includes("..")) {
    throw new TypeError("capture-evidence source_path must be worktree-relative");
  }
  const recordedAt = now();
  if (!(recordedAt instanceof Date) || Number.isNaN(recordedAt.valueOf())) {
    throw new TypeError("capture-evidence clock must return a valid Date");
  }
  return Object.freeze({
    sourcePath: resolve(worktreeRoot, sourcePath),
    evidenceType: input.evidence_type,
    recordedAt: recordedAt.toISOString(),
  });
}

/**
 * The current host owns the session-memory/LLM reflection executor.  Keep the
 * runtime boundary explicit: a direct launcher without that capability must
 * publish an honest failed reflection instead of synthesizing judgment facts.
 */
export function stageReflectionPublication(services = {}) {
  if (!services || typeof services !== "object" || Array.isArray(services)) {
    throw new TypeError("stage-runtime services must be an object");
  }
  if (services.stageReflectionExecutor === undefined && services.runControlledUiQa === undefined) return Object.freeze({});
  if (typeof services.stageReflectionExecutor !== "function") {
    if (services.stageReflectionExecutor === undefined) return Object.freeze({ runControlledUiQa: services.runControlledUiQa });
    throw new TypeError("services.stageReflectionExecutor must be a function");
  }
  return Object.freeze({
    ...(services.stageReflectionExecutor ? { runStageReflection: services.stageReflectionExecutor } : {}),
    ...(services.runControlledUiQa ? { runControlledUiQa: services.runControlledUiQa } : {}),
  });
}

export async function stageRuntimeMain(argv = process.argv.slice(2), { services = {}, cwd = process.cwd() } = {}) {
  const { command, values } = parseArgs(argv);
  assertNoTaskTypeArguments(values);
  if (command === "preflight" || (command === "run" && values.action === "preflight")) {
    const prefix = command === "run" ? "run:" : "";
    const allowed = new Set(command === "run" ? ["action", "stage", "input"] : ["stage", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError(`${prefix}preflight accepts only --stage and --input`);
    if (!new Set(["build-code", "verify-code"]).has(values.stage)) throw new TypeError(`${prefix}preflight requires --stage=build-code|verify-code`);
    if (typeof values.input !== "string" || values.input.trim() === "") throw new TypeError(`${prefix}preflight requires --input=<payload.json>`);
    const payload = JSON.parse(readFileSync(values.input, "utf8"));
    try {
      return runPreflight(values.stage, payload, services);
    } catch (error) {
      if (error?.preflight_protocol === true) return { status: "protocol_invalid", diagnostics: [preflightDiagnostic(error)] };
      throw error;
    }
  }
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (command === "review-risk-pause" && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "review-record" && !values.input) {
    throw new TypeError(`${command} requires --input=<simple-review-result.json>`);
  }
  if (command === "capture-tests" && (!new Set(["build-code", "verify-code"]).has(values.stage) || !values.input)) {
    throw new TypeError("capture-tests requires --stage=build-code|verify-code --input=<test-capture.json>");
  }
  if (command === "capture-evidence" && (values.stage !== "build-code" || !values.input)) {
    throw new TypeError("capture-evidence requires --stage=build-code --input=<evidence-capture.json>");
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "reflect" && (!values.stage || !values.input)) throw new TypeError("reflect requires --stage=<stage> --input=<judgment.json>");
  if (command === "authorize-operation") {
    if (!new Set(["commit", "push", "merge", "archive", "cleanup"]).has(values.operation)) throw new TypeError("authorize-operation requires --operation=commit|push|merge|archive|cleanup");
    if (typeof values["subject-ref"] !== "string" || values["subject-ref"].trim() === "") throw new TypeError("authorize-operation requires --subject-ref=<quality/confirmations/<sha256>.json>");
  }
  // Runtime quiescing is a hard launch boundary.  Check it before resolving
  // session identity so an unrelated/stale host session cannot mask the
  // authoritative refusal with a misleading multi-session binding error.
  const launchHome = homedir();
  const launchEnv = process.env;
  const launchStorageRoot = resolveStorageRoot({ env: launchEnv, home: launchHome });
  assertRuntimeAuthority(launchStorageRoot, {
    home: launchHome,
    expectedEpoch: launchEnv.WORKFLOWHUB_CUTOVER_EPOCH,
  });
  const identity = resolveWorkflowHubIdentity(values, cwd);
  let topologyRoute = null;
  if (isTypeRelatedStage(values.stage) && new Set(["run", "status", "doctor"]).has(command)) {
    if (command === "run") {
      // Every type-related run can publish stage facts or an unknown-type
      // attempt. Authenticate before resolving a route with side effects.
      const task = openTask(identity.taskPath, identity.project, identity.task);
      const workspace = openCurrentTaskWorkspace(task);
      assertTaskWriteIdentity({
        task,
        project: identity.project,
        taskId: identity.task,
        taskPath: identity.taskPath,
        workspace,
        cwd,
        env: launchEnv,
      });
    }
    topologyRoute = resolveTaskTopologyRoute({
      identity,
      stage: values.stage,
      // Read-only status/doctor must not append a diagnostic attempt.
      recordUnknownAttempt: command === "run",
    });
  }
  if (values.stage === PORTABLE_WORKFLOW_STAGE && command === "status") {
    const task = topologyRoute.task;
    const workspace = topologyRoute.workspace;
    const portable = projectPortableWorkflowStatus({ task });
    return Object.freeze({
      work_status: portable.state,
      workflow: PORTABLE_WORKFLOW_STAGE,
      portable_workflow: portable,
      identity: Object.freeze({ task_id: task.identity.taskId, worktree_root: workspace.worktreeRoot }),
    });
  }
  if (values.stage === PORTABLE_WORKFLOW_STAGE && command === "doctor") {
    const task = topologyRoute.task;
    const workspace = topologyRoute.workspace;
    return Object.freeze({
      stage: PORTABLE_WORKFLOW_STAGE,
      task_id: task.identity.taskId,
      worktree_root: workspace.worktreeRoot,
      baseline_commit: workspace.baselineCommit,
      portable_workflow: projectPortableWorkflowStatus({ task }),
    });
  }
  if (command === "run" && values.stage === PORTABLE_WORKFLOW_STAGE) {
    const portableInput = values.input === undefined
      ? undefined
      : readTaskBoundInput({ task: topologyRoute.task }, values.input);
    const portable = runPortableWorkflow({
      task: topologyRoute.task,
      worktreeRoot: topologyRoute.workspace.worktreeRoot,
      input: portableInput,
      ...(values.now === undefined ? {} : { now: () => new Date(values.now) }),
    });
    return Object.freeze({
      status: portable.state,
      stage: PORTABLE_WORKFLOW_STAGE,
      task_type: topologyRoute.task_type,
      activation_cohort: topologyRoute.activation_cohort,
      topology: topologyRoute.topology,
      ...portable,
    });
  }
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: identity.project,
    taskId: identity.task,
    taskPath: identity.taskPath,
    runnerRoot: RUNNER_ROOT,
    readOnly: command === "status",
  });
  // Identity comes only from explicit CLI values or the authenticated
  // worktree.  Host session state is intentionally not consulted here.
  const input = new Set(["review-risk-pause", "review-record", "capture-tests", "capture-evidence", "run", "reflect", "confirm"]).has(command)
      && values.input !== undefined
    ? readTaskBoundInput(context, values.input)
    : undefined;
  if (values.stage === "make-decision" && command !== "status") {
    context = prepareMakeDecisionWorkspace(context);
  }
  if (command === "status") {
    const allowed = new Set(["stage", "project", "task", "task-path", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("status accepts only --stage, --project, --task, optional --task-path, and optional --reason");
    let current = null;
    let materialRevision = null;
    const materials = {};
    for (const file of CURRENT_MATERIAL_FILES) {
      if (!context.artifacts) {
        materials[file] = null;
        continue;
      }
      try { materials[file] = context.artifacts.read(file); }
      catch (error) {
        if (error?.code === "ENOENT") materials[file] = null;
        else throw error;
      }
    }
    if (context.workspace) {
      current = context.kernel.currentVNextSnapshot();
      const materialValues = CURRENT_MATERIAL_FILES.map((file) => {
        try { return [file, context.artifacts.read(file)]; }
        catch (error) {
          if (error?.code === "ENOENT") return [file, null];
          throw error;
        }
      });
      materialRevision = materialRevisionFromValues(materialValues);
    }
    const observations = collectCurrentQualityFactObservations({ context, currentSnapshot: current, materialRevision, materials, stage: values.stage });
    const researchStage = ["make-decision", "build-spec", "build-plan"].includes(values.stage);
    const researchReports = current && researchStage
      ? listCurrentResearchReports({
          task: context.task,
          taskId: context.task.identity.taskId,
          stage: values.stage,
          snapshotTree: current.tree,
          materialScopeRevision: stageMaterialScopeRevision(values.stage, materials),
        })
      : [];
    const researchDisclosure = deriveResearchStatus(researchReports);
    const authenticatedResearchReports = researchReports.filter((report) => report?.value?.recorded_at);
    const executionOutcome = current
      ? deriveExecutionOutcomes({
          task_id: context.identity.taskId,
          read: readQualityEvidence(context.task),
          stage_outcome_refs: {},
          snapshot_tree: current.tree,
          material_revision: materialRevision,
          material_scope_revisions: stageMaterialScopeRevisions(materials),
          snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
          read_task_facts: () => readTaskFacts(context.task.taskPath),
          authenticate: ({ stage, ref }) => authenticateStageOutcomeForProjection({ ...context, stage }, stage, ref),
        })
      : null;
    const quality = deriveStageCompletion(values.stage, observations, {
      requireOutline: values.stage === "make-decision" && context.manifest?.record_model === "vnext-single-write",
    });
    const slicingValidation = typeof materials["spec.md"] === "string"
      && typeof materials["plan.md"] === "string"
      && typeof materials["tasks.md"] === "string"
      ? validatePlanTaskContract({
        spec: materials["spec.md"],
        plan: materials["plan.md"],
        tasks: materials["tasks.md"],
      })
      : null;
    const sliceAdvisory = slicingValidation?.facts?.slice_advisory ?? Object.freeze({
      status: "unavailable",
      signals: Object.freeze([]),
      explained_signals: Object.freeze([]),
      unexplained_signals: Object.freeze([]),
      signal_details: Object.freeze([]),
      markers: Object.freeze([]),
      marker_count: 0,
      diagnostics: Object.freeze(["current spec/plan/tasks are unavailable for slicing advisory"]),
    });
    const progression = deriveStageProgress(values.stage, observations, materials);
    const taskFacts = current ? canonicalTaskFacts(context) : [];
    const stageReflection = current
      ? readStageReflectionConclusion(context, values.stage, taskFacts)
      : Object.freeze({ status: "unavailable", ref: null, conclusion: null });
    return Object.freeze({
      ...progression,
      // The formal stage set has five entries, but an ordinary task's actual
      // route is cohort-selected. Surface that authenticated selection here so
      // a caller never has to infer "pre" from the presence of build-spec.
      ...(topologyRoute === null ? {} : {
        task_type: topologyRoute.task_type,
        activation_cohort: topologyRoute.activation_cohort,
        topology: topologyRoute.topology,
      }),
      quality_status: quality.status,
      quality_missing: quality.missing,
      quality_fact_refs: Object.freeze(observations.map(({ fact }) => fact.ref).sort()),
      quality_predicates: quality.predicates,
      root_causes: deriveStatusRootCauses({ quality, research: researchDisclosure, sliceAdvisory }),
      named_refs: deriveNamedStatusRefs({ facts: taskFacts }),
      stage_reflection: stageReflection,
      status_matrix: stageReflection.status_matrix ?? null,
      identity: current
        ? Object.freeze({ task_id: context.identity.taskId, material_revision: materialRevision, snapshot_tree: current.tree })
        : Object.freeze({ task_id: context.identity.taskId, material_revision: null, snapshot_tree: null }),
      source_completeness: Object.freeze({
        task_json: Boolean(context.task),
        facts_jsonl: taskFacts.length > 0,
        materials: STATUS_MATERIAL_REFS.every((file) => typeof materials[file] === "string"),
      }),
      research: researchDisclosure,
      execution_outcome: executionOutcome?.[values.stage] ?? { status: "unavailable", blocking: false, attempt_count: 0, completed_attempt_count: 0, refs: [], diagnostic: null },
    });
  }
  if (command !== "doctor") {
    assertTaskWriteIdentity({
      task: context.task,
      project: identity.project,
      taskId: identity.task,
      taskPath: identity.taskPath,
      workspace: context.workspace ?? context.candidateWorkspace,
      cwd,
      env: launchEnv,
    });
    authenticateStageWriteBoundary(context, {
      runnerRoot: RUNNER_ROOT,
      operation: command,
    });
  }
  if (command === "doctor") {
    const allowed = new Set(["stage", "project", "task", "task-path"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("doctor accepts only --stage, --project, --task, and optional --task-path");
    const activeWorkspace = context.candidateWorkspace ?? context.workspace;
    return {
      stage: values.stage,
      task_id: context.task.identity.taskId,
      worktree_root: activeWorkspace.worktreeRoot,
      baseline_commit: activeWorkspace.baselineCommit,
      materials: context.artifacts ? "working" : "not_applicable",
      storage: doctorStorage(context, { env: launchEnv, home: launchHome }),
    };
  }
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
  }
  if (command === "capture-tests") {
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.command !== "string"
        || typeof input.receipt_ref !== "string"
        || (input.output_ref !== undefined && typeof input.output_ref !== "string")
        || (input.timeout_ms !== undefined && (!Number.isSafeInteger(input.timeout_ms) || input.timeout_ms < 1))
        || Object.keys(input).some((key) => !new Set(["command", "receipt_ref", "output_ref", "timeout_ms"]).has(key))) {
      throw new TypeError("test capture input requires command, receipt_ref, optional output_ref, and optional timeout_ms");
    }
    const capture = values.stage === "build-code" ? captureBuildCodeTests : captureVerifyCodeTests;
    return capture(input.command, input.receipt_ref, {
      task: context.task,
      workspace: context.workspace,
      ...(input.output_ref === undefined ? {} : { outputRef: input.output_ref }),
      ...(input.timeout_ms === undefined ? {} : { timeoutMs: input.timeout_ms }),
    });
  }
  if (command === "capture-evidence") {
    const allowed = new Set(["stage", "project", "task", "task-path", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("capture-evidence accepts only --stage, --project, --task, and --input");
    }
    const capture = privateEvidenceCaptureInput(input, context.workspace.worktreeRoot, services.now);
    return publishEvidence({
      task: context.task,
      sourcePath: capture.sourcePath,
      sourceRoot: context.workspace.worktreeRoot,
      evidenceType: capture.evidenceType,
      publisher: "build-code",
      recordedAt: capture.recordedAt,
    });
  }
  if (command === "review-risk-pause") {
    const allowed = new Set(["review_result_ref"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.review_result_ref !== "string"
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("review-risk-pause input requires review_result_ref and optional authenticated revision ref");
    }
    return context.kernel.prepareReviewRiskPause({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
    });
  }
  if (command === "review-record") {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("review-record input requires exactly one of 'request' or 'result'");
    }
    const hasRequest = Object.prototype.hasOwnProperty.call(input, "request");
    const hasResult = Object.prototype.hasOwnProperty.call(input, "result");
    if (hasRequest === hasResult) throw new TypeError("review-record input requires exactly one of 'request' or 'result'");
    let preparedBundle = null;
    const useTaskBoundBuildCodeBundle = hasRequest
      && typeof services.runReviewRound !== "function"
      && isTaskBoundBuildCodeReviewRequest(input.request);
    const prepareBundle = (request) => {
      if (preparedBundle === null) {
        preparedBundle = prepareTaskBoundBuildCodeReviewBundle(context, request, services.reviewBundleDependencies);
      }
      return preparedBundle;
    };
    const runTaskBoundBuildCodeReview = async (request, { signal = null } = {}) => {
      const bundle = prepareBundle(request);
      const result = await runSimpleReview(request, {
        buildBundle: () => bundle,
        ...(signal === null ? {} : { signal }),
      });
      // The broker may echo a packet identity that does not match the
      // authenticated task-bound material bundle. Preserve that transport
      // failure as an unavailable review fact so the recorder can retain the
      // attempt; never let a mismatched provider identity become a review
      // result or make the route fail before recording provenance.
      if (result?.material_id !== bundle.materialId) {
        if (result?.status === "unavailable") {
          return {
            ...result,
            material_id: bundle.materialId,
          };
        }
        return {
          ...result,
          status: "unavailable",
          outcome: "unavailable",
          material_id: bundle.materialId,
          error: {
            code: "REVIEW_MATERIAL_MISMATCH",
            message: "review broker result material_id does not match the authenticated task-bound material",
          },
        };
      }
      return result;
    };
    let refs;
    try {
      refs = hasRequest
        ? await recordSimpleReviewRequest({
          task: context.task,
          kernel: context.kernel,
          request: input.request,
          resolveRouteIdentity: typeof services.resolveRouteIdentity === "function"
            ? services.resolveRouteIdentity
            : resolveSimpleReviewRouteIdentity,
          runRound: typeof services.runReviewRound === "function"
            ? services.runReviewRound
            : useTaskBoundBuildCodeBundle
              ? runTaskBoundBuildCodeReview
              : (request, options) => runSimpleReview(request, options),
          materialIdForRequest: typeof services.materialIdForRequest === "function"
            ? services.materialIdForRequest
            : useTaskBoundBuildCodeBundle
              ? (request) => prepareBundle(request).materialId
              : simpleReviewProviderMaterialId,
          reviewRoundTimeoutMs: reviewRecordTimeoutForRunner({
            managed: typeof services.runReviewRound !== "function",
          }),
          signal: services.reviewSignal ?? null,
        })
        : importCanonicalReviewResult({
          task: context.task,
          result: input.result,
          provenance: input.provenance,
          kernel: context.kernel,
        });
    } finally {
      preparedBundle?.dispose();
    }
    return refs.authoritative === false ? refs : { status: "recorded", ...refs };
  }
  if (command === "reflect") {
    const allowed = new Set(["stage", "project", "task", "task-path", "input", "now"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("reflect accepts only --stage, --project, --task, --input, and optional --now");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("reflect input must be a judgment object");
    }
    // An executed judgment must use the stage-end transaction, not only the
    // immutable reflection writer.  The transaction puts the new immutable
    // ref on the stage row (the status reader's sole carrier), preserving the
    // review facts already recorded for that stage.  Availability disclosures
    // retain their narrower writer because they have no judgment to project.
    if (["ok", "degraded", "failed"].includes(input.status)) {
      return runStageEndReflection(context, {
        stageStatus: input.stage_status,
        judgment: input,
        attemptId: input.executor?.attempt_id ?? input.identity?.attempt ?? null,
        ...(values.now === undefined ? {} : { now: values.now }),
      });
    }
    return runStageReflection(context, {
      input,
      ...(values.now === undefined ? {} : { now: values.now }),
    });
  }
  if (command === "run") {
    if (input !== undefined && (typeof input !== "object" || Array.isArray(input))) {
      throw new TypeError("run input must be an object when supplied");
    }
    const allowedRunFields = new Set([
      "receipts", "attempt_id", "acceptance_coverage", "finding_dispositions", "contract_facts",
      "fallback_protocol", "review_budget", "user_reply", "stage_reflection",
      ...(values.stage === "make-decision" ? ["research_report"] : []),
      ...(values.stage === "build-spec" || values.stage === "build-plan" ? ["decision_freeze"] : []),
      ...(values.stage === "verify-code" ? ["code_review_repairs"] : []),
    ]);
    const suppliedInput = { ...(input ?? {}) };
    const unknownRunFields = Object.keys(suppliedInput).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(suppliedInput.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    if (suppliedInput.decision_freeze
        && typeof suppliedInput.decision_freeze === "object"
        && !Array.isArray(suppliedInput.decision_freeze)
        && Object.hasOwn(suppliedInput.decision_freeze, "stage_outcome_ref")) {
      throw new TypeError("current stage run does not accept decision_freeze.stage_outcome_ref; freeze uses current confirmation and quality facts");
    }
    // Reject the retired host-outcome input before any current-run publisher
    // (including research_report) can write a partial transaction. Historical
    // outcome bytes remain readable only through explicit compatibility APIs.
    if (Object.hasOwn(suppliedInput.receipts ?? {}, "stage_outcomes")) {
      throw new TypeError("current stage run does not accept receipts.stage_outcomes; the current WorkflowHub session is the official producer");
    }
    if (Object.hasOwn(suppliedInput, "research_report")) {
      const receipts = suppliedInput.receipts && typeof suppliedInput.receipts === "object" && !Array.isArray(suppliedInput.receipts)
        ? { ...suppliedInput.receipts }
        : {};
      if (receipts.research !== undefined) throw new TypeError("run research_report cannot be combined with receipts.research");
      const publication = context.kernel.completeMakeDecisionResearch({ report: suppliedInput.research_report });
      receipts.research = publication.ref;
      suppliedInput.receipts = receipts;
      delete suppliedInput.research_report;
    }
    // Missing, stale, or unavailable upstream quality facts remain visible in
    // the read-only status projection, but never become a work permit. The
    // current WorkflowHub session is the official stage producer. Public run
    // does not accept or rebind historical host outcome packets.
    const stageResult = await runOfficialStage(values.stage, context, {
      ...suppliedInput,
      receipts: { ...(suppliedInput.receipts ?? {}) },
    }, stageReflectionPublication(services));
    return stageResult;
  }
  if (command === "confirm") {
    if (input !== undefined) {
      const allowed = new Set(["review_result_ref", "finding_id", "card_ref", "card_hash", "selected_option", "reply_ref", "reply_hash"]);
      if (!input || typeof input !== "object" || Array.isArray(input)
          || Object.keys(input).some((key) => !allowed.has(key))) {
        throw new TypeError("confirm risk input accepts review_result_ref, finding_id, card_ref, card_hash, selected_option, reply_ref, and reply_hash only");
      }
      for (const key of allowed) {
        if (typeof input[key] !== "string" || input[key].trim() === "") {
          throw new TypeError(`confirm risk input requires ${key}`);
        }
      }
      return context.kernel.acceptReviewRisk({
        stage: values.stage,
        reviewResultRef: input.review_result_ref,
        findingId: input.finding_id,
        cardRef: input.card_ref,
        cardHash: input.card_hash,
        selectedOption: input.selected_option,
        replyRef: input.reply_ref,
        replyHash: input.reply_hash,
      });
    }
    if (typeof values["reply-text"] !== "string" || values["reply-text"].trim() === "") throw new TypeError("confirm requires --reply-text=<user reply>");
    if (typeof values["step-slug"] !== "string" || values["step-slug"].trim() === "") throw new TypeError("confirm requires --step-slug=<current step>");
    return context.kernel.publishHumanConfirmation(values.stage, {
      decision: values.decision,
      ...(values.attempt === undefined ? {} : { subject_ref: values.attempt }),
      reply_text: values["reply-text"],
      step_slug: values["step-slug"],
    });
  }
  if (command === "authorize-operation") {
    return context.kernel.publishIrreversibleAuthorization({
      operation: values.operation,
      ...(values["subject-ref"] === undefined ? {} : { subject_ref: values["subject-ref"] }),
    });
  }
  throw new Error(`unknown internal runtime operation: ${command}`);
}

export async function runReviewRecordWithSignalHandling(run, { signalProcess = process } = {}) {
  if (typeof run !== "function") throw new TypeError("review record runner is required");
  if (!signalProcess || typeof signalProcess.on !== "function" || typeof signalProcess.removeListener !== "function") {
    throw new TypeError("signalProcess must support on/removeListener");
  }
  const controller = new AbortController();
  let interruptedExitCode = null;
  const interrupt = (name, exitCode) => () => {
    if (controller.signal.aborted) return;
    interruptedExitCode = exitCode;
    controller.abort(Object.assign(new Error(`review record interrupted by ${name}`), { code: "REVIEW_CANCELLED" }));
  };
  const onSigterm = interrupt("SIGTERM", 143);
  const onSigint = interrupt("SIGINT", 130);
  // Keep both listeners installed until the canonical attempt settles. A
  // second Ctrl-C/SIGTERM is intentionally idempotent, not permission for the
  // process to bypass the record/lock cleanup half way through its flush.
  signalProcess.on("SIGTERM", onSigterm);
  signalProcess.on("SIGINT", onSigint);
  try {
    return await run(controller.signal);
  } finally {
    signalProcess.removeListener("SIGTERM", onSigterm);
    signalProcess.removeListener("SIGINT", onSigint);
    if (interruptedExitCode !== null) signalProcess.exitCode = interruptedExitCode;
  }
}

export async function stageRuntimeCliMain(argv = process.argv.slice(2), {
  delegate = stageRuntimeMain,
  services = {},
  cwd = process.cwd(),
  skillBundleContract = LOCAL_SKILL_BUNDLE_CONTRACT,
  runnerContract = LOCAL_RUNNER_CONTRACT,
} = {}) {
  const [behavior, ...raw] = argv;
  if (behavior === "--help" || behavior === "help") {
    return {
      behaviors: ["doctor", "status", "run", "review", "verify", "confirm", "authorize"],
      actions: {
        doctor: ["workspace"],
        status: ["begin", "repair"],
        run: ["execute", "preflight", "draft", "reflect"],
        review: ["risk", "record"],
        verify: ["execute"],
        confirm: ["decision"],
        authorize: ["commit", "push", "merge", "archive", "cleanup"],
      },
    };
  }
  if (!RUNTIME_BEHAVIORS.includes(behavior)) throw new Error("unknown public runtime behavior");
  const actionArgument = raw.find((item) => item.startsWith("--action="));
  if (!actionArgument) throw new TypeError("public runtime behavior requires --action=<high-level-action>");
  const action = actionArgument.slice("--action=".length);
  if (behavior === "run" && action === "preflight") {
    const delegatedArgv = ["preflight", ...raw.filter((item) => item !== actionArgument)];
    return invokeRuntimeCommand(
      behavior,
      Object.freeze({ action, argv: delegatedArgv }),
      ({ argv: internalArgv }) => delegate(internalArgv, { services, cwd }),
      { skillBundleContract, runnerContract },
      "run",
    );
  }
  const publicRoute = `${behavior}:${action}`;
  const internalOperation = ({
    "doctor:workspace": "doctor",
    "status:begin": "status",
    "status:repair": "status",
    "run:execute": "run",
    "run:preflight": "run",
    "run:reflect": "reflect",
    "run:draft": "artifact",
    "review:risk": "review-risk-pause",
    "review:record": "review-record",
    "verify:execute": "capture-tests",
    "confirm:decision": "confirm",
    "authorize:commit": "authorize-operation",
    "authorize:push": "authorize-operation",
    "authorize:merge": "authorize-operation",
    "authorize:archive": "authorize-operation",
    "authorize:cleanup": "authorize-operation",
  })[publicRoute];
  if (!internalOperation) throw new Error("unknown public runtime action");
  const delegatedArgv = [
    internalOperation,
    ...raw.filter((item) => item !== actionArgument),
    ...(behavior === "authorize" ? [`--operation=${action}`] : []),
  ];
  const invoke = (reviewSignal = null) => invokeRuntimeCommand(
    behavior,
    Object.freeze({ action, argv: delegatedArgv }),
    ({ argv: internalArgv }) => delegate(internalArgv, {
      services: reviewSignal === null ? services : { ...services, reviewSignal },
      cwd,
    }),
    { skillBundleContract, runnerContract },
    internalOperation,
  );
  return publicRoute === "review:record"
    ? runReviewRecordWithSignalHandling(invoke, { signalProcess: services.signalProcess ?? process })
    : invoke();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  stageRuntimeCliMain().then((result) => {
    if (result?.status === "valid" && Array.isArray(result.diagnostics) && result.diagnostics.length === 0) {
      process.exitCode = 0;
      return;
    }
    const output = result?.status === "protocol_invalid" && Array.isArray(result.diagnostics)
      ? result.diagnostics
      : result;
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    process.exitCode ??= stageRuntimeProcessExitCode(result);
  }).catch((error) => {
    if (error?.preflight_protocol === true && error?.diagnostic) {
      process.stdout.write(`${JSON.stringify([error.diagnostic], null, 2)}\n`);
      process.exitCode = 2;
      return;
    }
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode ??= 1;
  });
}
