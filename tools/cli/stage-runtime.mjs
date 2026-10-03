#!/usr/bin/env node

import { accessSync, closeSync, fstatSync, openSync, constants as fsConstants, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { resolveCanonicalTaskPath } from "../../core/load-config.mjs";

import { authenticateCurrentArchitectReviewFact, authenticateCurrentOcrReviewFact, authenticateStageOutcomeForProjection } from "../../runtime/stage/stage-runner.mjs";
import { validateStageInvocation, verifyUnavailableReview } from "../../runtime/stage/stage-handlers.mjs";
import { diagnoseMissingInput } from "../../runtime/stage/stage-handlers.mjs";
import {
  validateAcceptanceEvidence,
  publishEvidence,
} from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { deriveExecutionOutcomes, deriveStageCompletion, deriveStageProgress, stageMaterialScopeRevision, stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import {
  activeAcceptanceCriterionIds,
  deriveDecisionDivergenceOutline,
  deriveDecisionLogOriginalSourceCensus,
  validatePlanTaskContract,
  validatePostPhaseContract,
} from "../../runtime/stage/stage-content-contracts.mjs";
import { authenticateBuildCodeCompletion, authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { deriveResearchStatus, listCurrentResearchReports } from "../../runtime/evidence/research-report.mjs";
import { CURRENT_MATERIAL_FILES, materialFilesForCohort, phaseFilesFromIndex } from "../../runtime/task/material-workspace.mjs";
// The two stage-result projections read their current result from the frozen
// stage row of the single execution record, never from stage-outcome bytes.
import { readTaskFacts, STAGE_ROW_KEYS, writeStageRow } from "../../runtime/task/task-store.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";
import { writeFileAtomic } from "../../runtime/interface/safe-write.mjs";
import { captureCommand } from "../../runtime/interface/run-command.mjs";
import { recordConfirmation } from "../../runtime/interface/human-confirm.mjs";
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
import { AUTHENTICATED_EVIDENCE_PATH, redactProviderHostPaths } from "../../runtime/review/provider-material-projection.mjs";
import { authenticatedEvidenceBytes } from "../../runtime/review/review-packet-identity.mjs";
import { resolveSimpleReviewRouteIdentity, runSimpleReview, simpleReviewProviderMaterialId } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import {
  prepareConfiguredOcrHostContext,
  runConfiguredOcrHostReview,
  runOcrDelegationRound,
  detectOcr,
} from "../../runtime/review/ocr-delegation-adapter.mjs";
export { runConfiguredOcrHostReview };
import { compactReviewDiff, gitDiffPath } from "../../runtime/review/review-input-bounds.mjs";
import { captureReviewSource } from "../../skills/wh-review/scripts/review-source.mjs";
import { buildReviewMaterials, canonicalMaterialManifest, reviewMaterialBytes, reviewInstructionsFor, validateVerifyAcceptanceSummary } from "../../skills/wh-review/scripts/review-materials.mjs";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const POST_PHASE_ARTIFACT = /^phases\/P[1-9][0-9]*\.md$/;
const PHASE_PROGRESS_ONLY_SOURCE = "phase-progress-cursor";

function isDesignArtifact(stage, name, activationCohort = "pre") {
  if (stage === "build-plan" && activationCohort === "post") {
    return name === "spec.md" || name === "phases/index.md" || POST_PHASE_ARTIFACT.test(name ?? "");
  }
  return DESIGN_ARTIFACTS[stage]?.has(name) ?? false;
}

export function stageRuntimeProcessExitCode(result) {
  const stageRowWriteFailed = typeof result?.stage_row_error === "string"
    || typeof result?.stage_reflection?.stage_row_error === "string";
  if (Number.isInteger(result?.exit_code)) return result.exit_code;
  return result?.status === "protocol_invalid" ? 2 : stageRowWriteFailed ? 1 : 0;
}
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const GIT_OID = /^[a-f0-9]{40,64}$/;
const WORKFLOW_STAGES = Object.freeze(["make-decision", "build-plan", "build-code", "verify-code", "build-prd"]);
const PORTABLE_WORKFLOW_STAGE = "build-prd";

// Managed OCR reviews are observed until a real terminal state or explicit
// cancellation. Test-injected legacy runners retain a bounded default.
export function reviewRecordTimeoutForRunner({ managed = false } = {}) {
  if (typeof managed !== "boolean") throw new TypeError("managed review runner flag must be boolean");
  return managed ? null : undefined;
}

/** Ephemeral OCR liveness only; no provider output, host paths, or persisted state. */
export function writeOcrProviderHealthDiagnostic(health, { stderr = process.stderr } = {}) {
  const provider = typeof health?.provider === "string" && health.provider.length <= 100
    && /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/.test(health.provider)
    ? health.provider : "redacted";
  const status = new Set(["running", "completed", "failed", "cancelled"]).has(health?.status)
    ? health.status : "unknown";
  const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const diagnostic = {
    provider, status, liveness: typeof health?.liveness === "boolean" ? health.liveness : null,
    last_output_at_ms: Number.isSafeInteger(health?.last_output_at_ms) && health.last_output_at_ms >= 0
      ? health.last_output_at_ms : null,
    progress_events: count(health?.progress_events),
    stdout_bytes: count(health?.stdout_bytes), stderr_bytes: count(health?.stderr_bytes),
  };
  try { stderr.write(`[ocr-review] ${JSON.stringify(diagnostic)}\n`); }
  catch { /* diagnostics must not change the review outcome */ }
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
    throw new TypeError("task metadata is required for write identity validation");
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

function gitMetadataEnvironment() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return env;
}

function gitWorktreeRoot(cwd) {
  try {
    const value = String(execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      env: gitMetadataEnvironment(),
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
      env: gitMetadataEnvironment(),
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
  const metadata=readPlainTaskMetadata(candidate.taskPath,candidate.projectName,candidate.taskId);
  const declared=metadata.manifest.workspace_mode==="existing" ? metadata.manifest.workspace_root
    : resolve(dirname(repositoryRoot),`${basename(repositoryRoot)}-${candidate.taskId}`);
  if(typeof declared!=="string" || realpathSync(resolve(declared))!==worktreeRoot)throw new Error("task metadata workspace does not match the current Git worktree");
  return Object.freeze({
    project: metadata.identity.projectName,
    task: metadata.identity.taskId,
    taskPath: metadata.taskPath,
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

function isNormalOcrCodeReviewRequest(request) {
  const scope = request?.review_scope ?? request?.reviewScope ?? null;
  const kind = request?.review_kind ?? request?.reviewKind ?? null;
  const track = request?.review_track ?? request?.reviewTrack ?? null;
  return kind === null && track === null && (
    (request?.stage === "build-code" && (scope === "phase" || scope === "integration"))
    || (request?.stage === "verify-code" && scope === null));
}

function validateOcrCodeReviewRequest(request, stage) {
  if (!request || typeof request !== "object" || Array.isArray(request) || request.stage !== stage) {
    throw new TypeError("code review request must bind the public stage");
  }
  const scope = request.review_scope ?? request.reviewScope ?? null;
  const kind = request.subject_kind ?? request.subjectKind ?? "worktree";
  const phase = request.phase_id ?? request.phaseId ?? null;
  if ((request.review_kind ?? request.reviewKind ?? null) !== null
      || (request.review_track ?? request.reviewTrack ?? null) !== null
      || (stage === "build-code" && !(
        (scope === "phase" && kind === "phase" && /^P[1-9][0-9]*$/.test(phase ?? ""))
        || (scope === "integration" && kind === "worktree" && phase === null)))
      || (stage === "verify-code" && (scope !== null || kind !== "worktree" || phase !== null))) {
    throw new TypeError("malformed OCR code-surface request");
  }
}

function ocrReviewInstructionsFor(request) {
  const focus = reviewInstructionsFor(request.stage, null, false,
    request.review_scope ?? request.reviewScope ?? null, null, "full", null, true);
  return [
    `OCR code review: ${request.stage}/${request.phase_id ?? request.phaseId ?? "worktree"}.`,
    "Read the complete contracts/build-code.md, contracts/verify-code.md, contracts/provider-protocol.md and manifest-declared lens skill bodies. Apply the actual stage's reviewer contract and the review focus below; the other code contract supplies the adjacent review boundary.",
    "Start with source.json, review-instructions.md, the complete current diff and full acceptance-criteria text. Read included implementation, consumer and test context needed to assess concrete delivery failures. Do not replace required bodies with summaries or truncate contracts.",
    focus,
    "按根因合并重复 finding，保留真实消费者、后果和源码行证据。不可用≠空≠pass；缺少可用结果说明限制，不能当作没有问题。",
    "Return exactly one findings JSON. Code findings use packet-relative paths and real positive line numbers. Serious findings also include root_cause, evidence_kind and a verbatim source excerpt in backticks at the cited line or next two lines. Do not output verdict, stage completion or workflow permission.",
    "Read only listed packet files. Do not access parent directories, Git, shell, network or host paths; do not write.",
    "Do not invoke Agent, subagent, child-agent, or other agent tools.",
    "Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools.",
  ].join("\n");
}

function ocrProviderEvidenceProjection(evidence) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return evidence;
  const current = evidence.runtime_current_materials;
  const diff = evidence.runtime_implementation_diff;
  return {
    ...(current && typeof current === "object" && !Array.isArray(current) ? {
      runtime_current_materials: Object.fromEntries(Object.entries(current).map(([name, value]) => [name, {
        bytes: Buffer.byteLength(String(value), "utf8"), sha256: sha256(String(value)),
      }])),
    } : {}),
    ...(typeof diff === "string" ? {
      runtime_implementation_diff: { bytes: Buffer.byteLength(diff, "utf8"), sha256: sha256(diff) },
    } : diff === undefined ? {} : { runtime_implementation_diff: diff }),
    ...Object.fromEntries(Object.entries(evidence).filter(([key]) => key !== "runtime_current_materials" && key !== "runtime_implementation_diff")),
  };
}

function writeOcrCurrentMaterialProjection(bundleRoot, projected, evidence) {
  const current = evidence?.runtime_current_materials;
  if (!current || typeof current !== "object" || Array.isArray(current)) return;
  const names = Object.keys(current).some((name) => name === "phases/index.md")
    ? ["decision-log.md", "spec.md", "phases/index.md"].filter((name) => Object.hasOwn(current, name))
    : Object.keys(current);
  // Post-cohort Phase bodies remain complete in the authenticated host
  // request, but they are not all provider context. The index and spec are
  // the navigation authority; a provider can use the diff/AC packet to choose
  // any Phase body it actually needs instead of dumping every Phase file.
  for (const name of names) {
    const value = current[name];
    if (typeof value !== "string" || name === "" || isAbsolute(name)
        || name.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error("OCR authenticated current material contains an unsafe path or non-text value");
    }
    const path = `context/current-materials/${name}`;
    const bytes = Buffer.from(`${redactProviderHostPaths(value)}`, "utf8");
    const destination = join(bundleRoot, ...path.split("/"));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes, { flag: "wx", mode: 0o600 });
    projected.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
  }
}

function projectOcrCodeReviewBundle(built, attachmentRoot, request, source) {
  const selected = built.manifest.filter(({ path }) => path !== "packet-plan.json" && path !== "manifest.json");
  const paths = new Set(selected.map(({ path }) => path));
  for (const path of ["contracts/build-code.md", "contracts/verify-code.md", "contracts/provider-protocol.md", "skills/simplicity-guard/SKILL.md", "skills/review/SKILL.md"]) {
    if (!paths.has(path)) throw new Error(`OCR packet is missing its required reviewer body: ${path}`);
  }
  if (!paths.has("review-instructions.md") || !paths.has("source.json")
      || ![...paths].some((path) => /^requirements\/acceptance_criteria\.(?:md|json)$/.test(path))
      || ![...paths].some((path) => path === "changes.diff" || /^diff-shards\/[^/]+\.diff$/.test(path))) {
    throw new Error("OCR packet is missing its instructions, current diff, or full acceptance criteria");
  }
  const bundleRoot = mkdtempSync(join(attachmentRoot, ".ocr-code-review-"));
  try {
    const projected = [];
    for (const entry of selected) {
      if (typeof entry.path !== "string" || isAbsolute(entry.path)
          || entry.path.split("/").some((part) => !part || part === "." || part === "..")) {
        throw new Error("OCR packet contains an invalid relative path");
      }
      const bytes = readFileSync(join(built.bundleRoot, entry.path));
      if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) {
        throw new Error(`OCR source packet changed before projection: ${entry.path}`);
      }
      const destination = join(bundleRoot, entry.path);
      mkdirSync(dirname(destination), { recursive: true });
      const projectedBytes = entry.path === "review-instructions.md"
        ? Buffer.from(ocrReviewInstructionsFor(request), "utf8") : bytes;
      if (projectedBytes === bytes) copyFileSync(join(built.bundleRoot, entry.path), destination);
      else writeFileSync(destination, projectedBytes);
      projected.push({ path: entry.path, bytes: projectedBytes.length, sha256: sha256(projectedBytes) });
    }
    // Capture only this selected diff's physical source files, never a tree.
    // Their submitted bytes, not a private Git snapshot, support reviewer lines.
    const diffText=readFileSync(source.diffPath,"utf8");
    const sourcePaths=new Set();
    for(const line of diffText.split("\n"))if(line.startsWith("diff --git ")){
      const tokens=line.slice(11).match(/"(?:\\.|[^"\\])*"|\S+/g);
      if(tokens?.length!==2)throw new Error("OCR code diff contains an invalid Git header");
      sourcePaths.add(gitDiffPath(tokens[1]));
    }
    const sourceRoot=realpathSync(source.sourceRoot);
    for(const path of sourcePaths){
      if(isAbsolute(path)||path.split("/").some(x=>!x||x==="."||x===".."))throw new Error("OCR source path is unsafe");
      if(projected.some(entry=>entry.path===path))throw new Error(`OCR source path conflicts with packet control: ${path}`);
      const target=join(sourceRoot,path);let named;
      try{let cursor=sourceRoot;for(const part of path.split("/")){cursor=join(cursor,part);const st=lstatSync(cursor);if(st.isSymbolicLink()||realpathSync(cursor)!==cursor)throw new Error(`OCR source path alias: ${path}`);}named=lstatSync(target);}
      catch(error){if(error.code==="ENOENT")continue;throw error;}
      if(!named.isFile()||named.nlink!==1)throw new Error(`OCR source is not a single-link regular file: ${path}`);
      const fd=openSync(target,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);let raw;
      try{const st=fstatSync(fd);if(st.dev!==named.dev||st.ino!==named.ino||!st.isFile()||st.nlink!==1)throw new Error(`OCR source changed: ${path}`);raw=readFileSync(fd);}finally{closeSync(fd);}
      const bytes=reviewMaterialBytes(path,raw);
      const destination=join(bundleRoot,path);mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,bytes,{flag:"wx",mode:0o600});projected.push({path,bytes:bytes.length,sha256:sha256(bytes)});
    }
    if (request.authenticated_evidence !== undefined) {
      if (paths.has(AUTHENTICATED_EVIDENCE_PATH)) throw new Error("OCR source packet duplicated authenticated evidence");
      // The frozen request keeps the complete authenticated evidence for host
      // verification. Provider transport gets a bounded index instead: the
      // current material bytes are split into ordinary context files, while
      // execution records/outputs remain available behind the explicit
      // authenticated-evidence index. A single multi-megabyte JSON blob made
      // every provider dump unrelated material before it could review code.
      const providerEvidence = ocrProviderEvidenceProjection(request.authenticated_evidence);
      const evidenceBytes = authenticatedEvidenceBytes(providerEvidence);
      writeFileSync(join(bundleRoot, AUTHENTICATED_EVIDENCE_PATH), evidenceBytes, { flag: "wx", mode: 0o600 });
      projected.push({ path: AUTHENTICATED_EVIDENCE_PATH, bytes: evidenceBytes.length, sha256: sha256(evidenceBytes) });
      writeOcrCurrentMaterialProjection(bundleRoot, projected, request.authenticated_evidence);
    }
    const manifestText = canonicalMaterialManifest(projected);
    writeFileSync(join(bundleRoot, "manifest.json"), manifestText);
    return Object.freeze({
      bundleRoot, attachmentRoot, sourcePrefix: relative(attachmentRoot, bundleRoot).replaceAll("\\", "/"),
      materialId: sha256(Buffer.from(manifestText, "utf8")),
      manifest: Object.freeze(projected),
      files: Object.freeze([...projected.map(({ path }) => path), "manifest.json"]),
    });
  } catch (error) {
    rmSync(bundleRoot, { recursive: true, force: true });
    throw error;
  }
}

function phaseReviewSourceProjection(context, request, source, attachmentRoot) {
  if (request.stage !== "build-code" || request.review_scope !== "phase"
      || context.manifest?.activation_cohort !== "post") return source;
  const index = context.artifacts.read("phases/index.md");
  const phases = Object.fromEntries(phaseFilesFromIndex(index).map((ref) => [ref, context.artifacts.read(ref)]));
  const parsed = validatePostPhaseContract({ spec: context.artifacts.read("spec.md"), index, phases });
  const phase = parsed.facts?.phase_rows?.find((row) => row.id === request.phase_id);
  if (!phase?.write_set?.length) throw new Error("MATERIAL_INCOMPLETE: current Phase write set is unavailable");
  const selected = compactReviewDiff(readFileSync(source.diffPath, "utf8"), { writeSet: phase.write_set }).diff;
  const diffPath = join(dirname(source.diffPath), `phase-${request.phase_id}.diff`);
  writeFileSync(diffPath, selected, { flag: "wx", mode: 0o600 });
  return Object.freeze({ ...source, diffPath, diffBytes: Buffer.byteLength(selected, "utf8") });
}

/** Build the provider-visible build-code packet from the authenticated task workspace. */
export function prepareTaskBoundBuildCodeReviewBundle(context, request, {
  loadConfig = loadTrustedThirdReviewConfig,
  captureSource = captureReviewSource,
  buildMaterials = buildReviewMaterials,
} = {}) {
  if (!isTaskBoundBuildCodeReviewRequest(request)) throw new TypeError("task-bound build-code review request required");
  const reviewScope = request.review_scope ?? request.reviewScope;
  const candidateExperiment = isNormalOcrCodeReviewRequest(request);
  if (candidateExperiment && request.stage === "verify-code") {
    validateVerifyAcceptanceSummary(request.materials?.acceptance_criteria);
  }
  const trusted = loadConfig({ requestedStage: request.stage, requestedTrack: request.review_track ?? request.reviewTrack ?? null,
    requestedReviewKind: request.review_kind ?? request.reviewKind ?? null });
  const source = captureSource({ workspace: context.workspace, reviewDataRoot: trusted.attachmentRoot,
    includeDiff: true, taskId: context.task.identity.taskId });
  try {
    const selectedSource = phaseReviewSourceProjection(context, request, source, trusted.attachmentRoot);
    const built = buildMaterials({
      reviewDataRoot: trusted.attachmentRoot,
      attachmentRoot: trusted.attachmentRoot,
      source: selectedSource,
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
          "full",
          null,
          candidateExperiment,
        ),
      },
      candidateExperiment,
    });
    let packet;
    try {
      const manifest = built.deliveryManifest ?? built.manifest;
      packet = candidateExperiment && Array.isArray(manifest)
        ? projectOcrCodeReviewBundle({ ...built, manifest }, trusted.attachmentRoot, request, selectedSource)
        : built;
    } catch (error) {
      rmSync(built.bundleRoot, { recursive: true, force: true });
      throw error;
    }
    let disposed = false;
    return Object.freeze({
      ...packet,
      dispose() {
        if (disposed) return;
        disposed = true;
        if (packet !== built) rmSync(packet.bundleRoot, { recursive: true, force: true });
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

function codeReviewSource(task, fact) {
  if (!((fact?.stage === "verify-code" && fact?.subject === "code_review")
      || (fact?.stage === "build-code" && fact?.subject === "integration_review"))) return undefined;
  const identity = {
    snapshotTree: fact.snapshot_tree,
    materialRevision: fact.material_revision,
  };
  if (authenticateCurrentOcrReviewFact(task, fact, identity)) return "ocr-delegation";
  if (authenticateCurrentArchitectReviewFact(task, fact, identity)) return "architect-code-review";
  return "unverified";
}

function collectCurrentQualityFactObservations({ context, stage = null, currentSnapshot = null, materialRevision = null }) {
  const observations = [];
  for (const ref of context.task.listCanonicalQualityFactRefs()) {
    let value;
    let raw;
    try {
      raw = context.task.readRecord(ref);
      value = JSON.parse(raw);
    } catch { continue; }
    if (value?.task_id !== context.task.identity.taskId || (stage !== null && value?.stage !== stage)) continue;
    // Authentication proves which snapshot a fact belongs to; it does not
    // make that snapshot current. A verify-code review is current only while
    // both the implementation tree and its stage materials still match.
    if (value?.stage === "verify-code" && value?.subject === "code_review"
        && (typeof currentSnapshot?.tree !== "string"
          || value.snapshot_tree !== currentSnapshot.tree
          || value.material_revision !== materialRevision)) continue;
    // An authenticated E2E fact can still describe an obsolete verification
    // target. Only project it when both its source tree and stage materials
    // match the current contract inputs.
    if (value?.stage === "verify-code" && value?.subject === "e2e_acceptance"
        && (typeof currentSnapshot?.tree !== "string"
          || value.snapshot_tree !== currentSnapshot.tree
          || value.material_revision !== materialRevision)) continue;
    const authentication = authenticateQualityFactRecord({ ...value, ref, sha256: sha256(raw) }, {
      read: readQualityEvidence(context.task),
      workspaceRoot: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot,
    });
    const reviewSource = codeReviewSource(context.task, value);
    observations.push({
      fact: { ref, value }, authenticated: authentication.authenticated === true, recorded: true, authentication,
      ...(reviewSource === undefined ? {} : { review_source: reviewSource }),
    });
  }
  return observations;
}

/**
 * Read the six named status reference classes from canonical task facts.
 * Directory contents never decide which reference is current: K1-K3 are
 * fixed names, and K4-K6 are names carried by the frozen facts row.
 */
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

export function deriveNamedStatusRefs({ facts = [], activationCohort = "pre", materials = {} } = {}) {
  const materialRefs = materialFilesForCohort(activationCohort, materials);
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
    Object.freeze({ class: "K3", name: "current materials", refs: Object.freeze([...materialRefs]), source: "authenticated worktree" }),
    Object.freeze({ class: "K4", name: "named confirmations and authorizations", refs: Object.freeze([...K4].sort()), source: "facts.jsonl" }),
    Object.freeze({ class: "K5", name: "named evidence references", refs: Object.freeze([...K5].sort()), source: "facts.jsonl or close-action row" }),
    Object.freeze({ class: "K6", name: "material diff inputs", refs: Object.freeze(materialRefs.map((file) => `${file}:HEAD-diff`)), source: "git diff" }),
  ]);
}

export function deriveStatusRootCauses({ quality = null, research = null, divergenceOutline = null, sliceAdvisory = null, stale = null, activationCohort = "pre", materials = {} } = {}) {
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
  if (research?.candidate_delivery?.status === "incomplete") {
    const delivery = research.candidate_delivery;
    const ref = delivery.full_report?.ref ?? research.report_ref;
    const ids = delivery.missing_candidate_ids?.join(",") || "unknown";
    add("research_candidate_delivery", "actionable", "research report", [ref].filter(Boolean), `candidate delivery incomplete:${ids}`);
  }
  if (research?.candidate_presentation?.status === "incomplete") {
    const presentation = research.candidate_presentation;
    const ref = presentation.full_report?.ref ?? research.report_ref;
    add("research_candidate_presentation", "actionable", "decision-log.md", [ref, "decision-log.md"].filter(Boolean), `candidate presentation incomplete:${presentation.reason ?? "unknown"}`);
  }
  if (divergenceOutline?.status === "incomplete") {
    add("decision_divergence_outline", "actionable", "decision-log.md", ["decision-log.md"], `divergence outline incomplete:${divergenceOutline.reason ?? "unknown"}`);
  }
  if (sliceAdvisory?.status === "unexplained_overage" || sliceAdvisory?.diagnostics?.length) {
    const refs = activationCohort === "post"
      ? materialFilesForCohort("post", materials).filter((file) => file.startsWith("phases/"))
      : ["plan.md"];
    add("slice_advisory", "advisory", refs[0], refs, "slice advisory requires operator review");
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

function postPhaseSliceAdvisory(materials) {
  const files = materialFilesForCohort("post", materials).filter((file) => POST_PHASE_ARTIFACT.test(file));
  const validation = validatePostPhaseContract({
    spec: materials["spec.md"],
    index: materials["phases/index.md"],
    phases: Object.fromEntries(files.map((file) => [file, materials[file]])),
  });
  const details = [];
  const owners = new Map();
  for (const phase of validation.facts?.phase_rows ?? []) {
    if (new Set(phase.write_set).size > 10) {
      details.push(Object.freeze({ signal: "SIG-FILES", phase: phase.id, file_count: new Set(phase.write_set).size, explained: false }));
    }
    for (const file of phase.write_set) owners.set(file, [...(owners.get(file) ?? []), phase.id]);
  }
  for (const [file, phases] of owners) {
    if (new Set(phases).size > 1) details.push(Object.freeze({ signal: "SIG-CROSS-PHASE", file, phases: Object.freeze([...new Set(phases)]), explained: false }));
  }
  const signals = [...new Set(details.map((detail) => detail.signal))];
  return Object.freeze({
    status: validation.ok ? signals.length ? "unexplained_overage" : "within_budget" : "unavailable",
    signals: Object.freeze(signals),
    explained_signals: Object.freeze([]),
    unexplained_signals: Object.freeze(signals),
    signal_details: Object.freeze(details),
    markers: Object.freeze([]),
    marker_count: 0,
    diagnostics: Object.freeze([
      ...validation.errors,
      ...details.map((detail) => `${detail.signal} overage is not explained in ${detail.phase ?? detail.phases?.join(", ")}`),
    ]),
  });
}

/**
 * Derive the current status from authenticated quality facts and the frozen
 * task row. The result has three fact domains, six named reference classes,
 * and one stage-reflection conclusion; it does not create another authority.
 */
function buildCodeCompletionAdvisories(quality, observations, snapshotTree, materialRevision) {
  const entries = observations.filter((entry) => {
    const fact = entry.fact?.value ?? entry.fact;
    return entry.authenticated === true && fact?.stage === "build-code" && fact.status === "missing"
      && fact.snapshot_tree === snapshotTree && fact.material_revision === materialRevision
      && ((fact.subject === "acceptance_criteria" && quality.predicates.acceptance_execution?.status === "satisfied")
        || (fact.subject === "finding_dispositions" && !quality.predicates.finding_dispositions));
  });
  return { quality_advisory_fact_refs: Object.freeze(entries.map((entry) => entry.fact.ref).sort()),
    quality_advisories: Object.freeze(entries.map((entry) => `${(entry.fact.value ?? entry.fact).subject}:missing:completion_source_separate_from_quality`)) };
}

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
    authenticateBuildCodeCompletion: ({ observations: entries }) => authenticateBuildCodeCompletion({
      task: context.task, read: readQualityEvidence(context.task), currentMaterialRevision: materialRevision, snapshotTree: currentSnapshot.tree,
      spec: materials["spec.md"], activeCriterionIds: activeAcceptanceCriterionIds(materials["spec.md"]), observations: entries, verifyUnavailableReview,
    }),
    authenticateCodeReview: ({ fact }) => codeReviewSource(context.task, fact) !== "unverified",
  });
  const facts = canonicalTaskFacts(context);
  const divergenceOutline = deriveDecisionDivergenceOutline(materials["decision-log.md"]);
  const activationCohort = context.manifest?.activation_cohort ?? "pre";
  const materialRefs = materialFilesForCohort(activationCohort, materials);
  const stageReflection = readStageReflectionConclusion(context, stage, facts);
  return Object.freeze({
    work_progress: deriveStageProgress(stage, observations, materials, {
      activationCohort: context.manifest?.activation_cohort ?? "pre",
    }),
    stage_quality: quality,
    ...(stage === "build-code" ? buildCodeCompletionAdvisories(quality, observations, currentSnapshot.tree, materialRevision) : {}),
    root_causes: deriveStatusRootCauses({ quality, divergenceOutline, stale, activationCohort, materials }),
    named_refs: deriveNamedStatusRefs({ facts, activationCohort, materials }),
    stage_reflection: stageReflection,
    status_matrix: stageReflection.status_matrix ?? null,
    identity: Object.freeze({ task_id: context.identity.taskId, material_revision: materialRevision, snapshot_tree: currentSnapshot.tree }),
    source_completeness: Object.freeze({ task_json: true, facts_jsonl: facts.length > 0, materials: materialRefs.every((file) => typeof materials[file] === "string") }),
  });
}

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    const key = item.slice(2, split);
    if (Object.hasOwn(values, key)) throw new TypeError(`duplicate argument: --${key}`);
    values[key] = item.slice(split + 1);
  }
  if (!new Set(["doctor", "status", "artifact", "review-record", "capture-tests", "run", "confirm", "authorize-operation"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <doctor|status|run|review|verify|confirm|authorize> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

function readTaskBoundInput(context, inputPath) {
  const taskRef=typeof inputPath==="string"&&/^quality\/(?:tests|evidence)\//.test(inputPath)&&!inputPath.split("/").includes("..");
  const path=taskRef ? resolve(context.task.taskPath,inputPath) : resolve(context.workspace.worktreeRoot,inputPath);
  return JSON.parse(readPlainInputFile(path,"review input"));
}

// Native metadata readers are private consumers of the existing files. They
// create no TaskHandle, kernel, receipt graph, latest selector or persisted view.
function readPlainInputFile(path,label) {
  const absolute=resolve(path);let cursor="/";
  for(const part of absolute.split("/").filter(Boolean)){cursor=join(cursor,part);const stat=lstatSync(cursor);if(stat.isSymbolicLink()||realpathSync(cursor)!==cursor)throw Object.assign(new Error(`${label} path alias`),{code:"TASK_PATH_ALIAS"});}
  const named=lstatSync(absolute);if(!named.isFile()||named.nlink!==1)throw Object.assign(new Error(`${label} must be a single-link regular file`),{code:"TASK_FILE_INVALID"});
  const fd=openSync(absolute,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);
  try{const st=fstatSync(fd);if(st.dev!==named.dev||st.ino!==named.ino||!st.isFile()||st.nlink!==1)throw Object.assign(new Error(`${label} changed`),{code:"TASK_FILE_CHANGED"});return readFileSync(fd,"utf8");}finally{closeSync(fd);}
}
function readPlainTaskMetadata(taskPath,projectName,taskId) {
  const path=resolve(taskPath);if(realpathSync(path)!==path||!lstatSync(path).isDirectory())throw Object.assign(new Error("task directory must be real"),{code:"TASK_PATH_ALIAS"});
  const manifest=JSON.parse(readPlainInputFile(join(path,"task.json"),"task manifest"));
  if(manifest.project_name!==projectName||manifest.task_id!==taskId)throw Object.assign(new Error("task manifest differs from requested project/task"),{code:"TASK_ID_MISMATCH"});
  return {taskPath:path,manifest,identity:{projectName,taskId}};
}

export function phaseProgressTargetExists(cursor, materials) {
  if (!cursor || typeof cursor !== "object" || !materials || typeof materials !== "object") return false;
  const ref = `phases/${cursor.phase_id}.md`;
  if (!phaseFilesFromIndex(materials["phases/index.md"]).includes(ref) || typeof materials[ref] !== "string") return false;
  return materials[ref].split("\n").some((line) => /^###\s+T[0-9]{3,}\b/.test(line) && line.match(/^###\s+(T[0-9]{3,})\b/)[1] === cursor.task_id);
}

export function derivePhaseProgressStatus({ cursor = null, currentPhasesHead = null } = {}) {
  if (cursor === null) return null;
  const current = GIT_OID.test(currentPhasesHead ?? "") && cursor.phases_head === currentPhasesHead;
  return Object.freeze({
    freshness: current ? "current" : "stale",
    cursor: Object.freeze({
      phase_id: cursor.phase_id, task_id: cursor.task_id,
      ...(cursor.phases_head === undefined ? {} : { phases_head: cursor.phases_head }),
      recorded_at: cursor.recorded_at,
    }),
    ...(current ? {} : { reason: "phases_head_mismatch" }),
  });
}

export function projectStageExecutionOutcome(stage, outcomes, taskRows = []) {
  const outcome = outcomes?.[stage] ?? {
    status: "unavailable", blocking: false, attempt_count: 0, completed_attempt_count: 0, refs: [], diagnostic: null,
  };
  const buildCodeRows = stage === "build-code" ? taskRows.filter((row) =>
    row?.record_kind === "stage" && row.stage === "build-code") : [];
  const cursorOnly = buildCodeRows.length > 0 && buildCodeRows.every((row) =>
    row.source === PHASE_PROGRESS_ONLY_SOURCE);
  if (!cursorOnly) return outcome;
  return Object.freeze({
    status: "unavailable",
    blocking: false,
    attempt_count: 0,
    completed_attempt_count: 0,
    refs: Object.freeze([]),
    diagnostic: Object.freeze({
      kind: "unavailable",
      code: "phase_progress_cursor_only",
      reason: "facts.jsonl contains a resume cursor but no build-code stage-end result",
      refs: Object.freeze([]),
    }),
  });
}

function currentPostPhaseMaterialState(context) {
  if ((context.manifest?.activation_cohort ?? "pre") !== "post") {
    throw new Error("phase_progress requires a post-cohort task with indexed Phase files");
  }
  if (!context.artifacts) throw new Error("phase_progress requires readable current post-cohort materials");
  const materials = {};
  for (const file of ["decision-log.md", "spec.md", "phases/index.md"]) materials[file] = context.artifacts.read(file);
  const materialFiles = materialFilesForCohort("post", materials);
  for (const file of materialFiles) if (!(file in materials)) materials[file] = context.artifacts.read(file);
  const missing = materialFiles.filter((file) => typeof materials[file] !== "string" || materials[file].trim() === "");
  if (missing.length) throw new Error(`phase_progress current materials are missing: ${missing.join(", ")}`);
  return Object.freeze({
    materials: Object.freeze(materials),
    materialFiles,
    phasesHead: currentPhaseMaterialsHead(context),
  });
}

function currentPhaseMaterialsHead(context) {
  const prefix = `specs/${context.identity.taskId}`;
  const head = execFileSync("git", ["log", "-1", "--format=%H", "--", `${prefix}/spec.md`, `${prefix}/phases/`], {
    cwd: context.workspace.worktreeRoot, env: gitMetadataEnvironment(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  return GIT_OID.test(head) ? head : null;
}

async function writeBuildCodePhaseProgressCursor(context, inputCursor) {
  if (!inputCursor || typeof inputCursor !== "object" || Array.isArray(inputCursor)
      || Object.keys(inputCursor).sort().join("\0") !== ["phase_id", "task_id"].sort().join("\0")) {
    throw new TypeError("phase_progress input must contain exactly phase_id and task_id");
  }
  const { materials, phasesHead } = currentPostPhaseMaterialState(context);
  if (phasesHead === null) throw new Error("phase_progress requires a real tracked materials commit");
  if (typeof inputCursor.phase_id !== "string" || !/^P[1-9][0-9]*$/.test(inputCursor.phase_id)
      || typeof inputCursor.task_id !== "string" || !/^T[0-9]{3,}$/.test(inputCursor.task_id)) {
    throw new TypeError("phase_progress phase_id or task_id is invalid");
  }
  if (!phaseProgressTargetExists(inputCursor, materials)) {
    throw new TypeError(`phase_progress target ${inputCursor.phase_id}/${inputCursor.task_id} is not in the current indexed Phase files`);
  }
  const phaseProgress = Object.freeze({
    phase_id: inputCursor.phase_id,
    task_id: inputCursor.task_id,
    phases_head: phasesHead,
    recorded_at: new Date().toISOString(),
  });
  const currentRow = readTaskFacts(context.task.taskPath).find((row) =>
    row?.record_kind === "stage" && row.stage === "build-code") ?? null;
  const rowInput = currentRow
    ? { ...Object.fromEntries(STAGE_ROW_KEYS.filter(key => Object.hasOwn(currentRow, key)).map(key => [key, currentRow[key]])), phase_progress: phaseProgress }
    : {
      record_kind: "stage",
      task_id: context.identity.taskId,
      stage: "build-code",
      source: PHASE_PROGRESS_ONLY_SOURCE,
      phase_progress: phaseProgress,
      review_origin: "not_run",
      review_result_ref: { value: null, reason: "a resume cursor is not a review result" },
      finding_dispositions: [],
      spec_analyze: { value: null, reason: "a resume cursor does not run stage-end reflection" },
      evidence: { value: null, reason: "a resume cursor does not execute stage-end work" },
      serious_issue_disposition: { value: null, reason: "a resume cursor carries no serious-issue disposition" },
      close_action: { value: null, reason: "a resume cursor carries no close action" },
      handoff: { value: null, reason: "a resume cursor publishes no handoff" },
    };
  const written = await writeStageRow(context.task.taskPath, rowInput);
  return Object.freeze({
    status: "recorded",
    stage: "build-code",
    phase_progress: phaseProgress,
    record_ref: written.ref,
    action: written.action,
  });
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


// Public entry points use task identity, physical workspace checks, and native
// tools. The existing review recorder alone retains its old backend until T019.
function thinMaterialAccess(worktreeRoot, taskId) {
  const root = resolve(worktreeRoot, "specs", taskId);
  const check = (path, { allowMissing = false } = {}) => {
    const absolute = resolve(path);
    const rel = relative(worktreeRoot, absolute);
    if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error("material path escapes the worktree");
    let cursor = worktreeRoot;
    for (const part of rel.split(/[\\/]/)) {
      cursor = join(cursor, part);
      try {
        const stat = lstatSync(cursor);
        if (stat.isSymbolicLink() || realpathSync(cursor) !== cursor) throw new Error(`material path alias is forbidden: ${cursor}`);
        if (stat.isFile() && stat.nlink !== 1) {
          throw Object.assign(new Error(`material file must have exactly one link: ${cursor}`), { code: "MATERIAL_MULTILINK" });
        }
      } catch (error) { if (allowMissing && error.code === "ENOENT") return; throw error; }
    }
  };
  const filePath = (name) => {
    if (typeof name !== "string" || !name || isAbsolute(name) || name.split(/[\\/]/).includes("..")) throw new TypeError("material name must be a relative path");
    return resolve(root, name);
  };
  return {
    root,
    read(name) {
      const path = filePath(name);
      check(path);
      if (!lstatSync(path).isFile()) {
        throw Object.assign(new Error(`material must be a regular file: ${path}`), { code: "MATERIAL_NOT_REGULAR" });
      }
      return readFileSync(path, "utf8");
    },
    reference(name) { return filePath(name); },
    ensureRoot() { check(root, { allowMissing: true }); mkdirSync(root, { recursive: true }); check(root); },
    prepareWrite(name) { const path = filePath(name); check(dirname(path), { allowMissing: true }); mkdirSync(dirname(path), { recursive: true }); check(dirname(path)); },
  };
}

async function thinTaskContext(values, cwd) {
  const identity=resolveWorkflowHubIdentity(values,cwd);
  const task=readPlainTaskMetadata(identity.taskPath,identity.project,identity.task),manifest=task.manifest;
  const target=gitWorktreeRoot(cwd);if(!target)throw new Error("CURRENT_WORKTREE_UNAVAILABLE: current Git worktree is required");
  const repositoryRoot=gitRepositoryRoot(cwd,target);if(!repositoryRoot)throw new Error("repository root is unavailable");
  const declared=manifest.workspace_mode==="existing" ? manifest.workspace_root : resolve(dirname(repositoryRoot),`${basename(repositoryRoot)}-${identity.task}`);
  if(typeof declared!=="string"||resolve(declared)!==target||realpathSync(declared)!==target)throw Object.assign(new Error("CURRENT_WORKTREE_MISMATCH: declared task workspace differs from cwd"),{code:"WRITE_IDENTITY_PREFLIGHT_FAILED"});
  const root=resolve(manifest.target_repo_root);if(realpathSync(root)!==root)throw new Error("target repository path alias is forbidden");
  const metadataGit=args=>execFileSync("git",args,{cwd:target,env:gitMetadataEnvironment(),encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
  const head=metadataGit(["rev-parse","--verify","HEAD^{commit}"]);
  let baselineCommit=manifest.baseline_commit ?? null;
  if(baselineCommit!==null){if(!GIT_OID.test(baselineCommit))throw new TypeError("task baseline_commit must be a real Git commit");metadataGit(["cat-file","-e",`${baselineCommit}^{commit}`]);metadataGit(["merge-base","--is-ancestor",baselineCommit,head]);}
  else {const branches=metadataGit(["for-each-ref","--format=%(refname)","refs/heads/main"]);baselineCommit=branches ? metadataGit(["merge-base",head,"refs/heads/main"]) : head;}
  const workspace={worktreeRoot:target,targetRepoRoot:root,baselineCommit};
  assertTaskWriteIdentity({task,project:identity.project,taskId:identity.task,taskPath:identity.taskPath,workspace,cwd});
  const physical=await inspectWorkspace({root,target,baseline:baselineCommit});
  return {task,workspace,manifest,identity:task.identity,artifacts:thinMaterialAccess(target,task.identity.taskId),physical};
}

function thinMaterials(context) {
  const materials = {};
  const read = (file) => {
    try { materials[file] = context.artifacts.read(file); }
    catch (error) { if (error.code === "ENOENT") materials[file] = null; else throw error; }
  };
  const cohort = context.manifest.activation_cohort ?? "pre";
  for (const file of cohort === "post" ? ["decision-log.md", "spec.md", "phases/index.md"] : CURRENT_MATERIAL_FILES) read(file);
  for (const file of materialFilesForCohort(cohort, materials)) if (!(file in materials)) read(file);
  return materials;
}

function thinQuality(context, row) {
  if (!row || row.source === PHASE_PROGRESS_ONLY_SOURCE || row.review_origin === "not_run") return "unknown";
  if (row.review_origin === "unavailable") return "unavailable";
  const ref = typeof row.review_result_ref === "string" ? row.review_result_ref : row.review_result_ref?.value;
  if (typeof ref !== "string" || !ref.startsWith("quality/reviews/") || isAbsolute(ref) || ref.split(/[\\/]/).some(part => part === ".." || part === "")) return "unknown";
  let result;
  try { result = JSON.parse(readPlainInputFile(join(context.task.taskPath, ref), "review result")); }
  catch (error) { if (error.code === "ENOENT") return "unknown"; throw error; }
  if (result.task_id !== context.identity.taskId || result.stage !== row.stage) throw new Error("review result differs from current row identity");
  if (result.status === "unavailable") return "unavailable";
  // A review is one quality fact; it cannot certify stage completion.
  return ["available", "available-with-failures", "incomplete"].includes(result.status) ? "incomplete" : "unknown";
}

function requireOptions(values, names, operation) {
  const allowed = new Set(names);
  const unknown = Object.keys(values).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(`${operation} has unknown options: ${unknown.join(", ")}`);
}

export async function stageRuntimeMain(argv = process.argv.slice(2), { services = {}, cwd = process.cwd() } = {}) {
  const { command, values } = parseArgs(argv);
  if (!["make-decision", "build-plan", "build-code", "verify-code", "build-prd"].includes(values.stage)) throw new TypeError("a current five-stage --stage is required");
  const common = ["stage", "project", "task", "task-path"];
  const options = {
    doctor: common, status: [...common, "reason"], artifact: [...common, "name", "input"],
    "capture-tests": [...common, "input"], confirm: [...common, "input", "decision", "reply-text", "material-ref"],
    "authorize-operation": [...common, "operation", "subject-ref"], "review-record": [...common, "input"], run: [...common, "input"],
  };
  requireOptions(values, options[command] ?? [], command);
  if (["artifact", "capture-tests", "review-record", "run"].includes(command) && !values.input) throw new TypeError(`${command} requires --input`);
  let context = await thinTaskContext(values, cwd);
  const input = values.input === undefined || command === "artifact" ? undefined : readTaskBoundInput(context, values.input);
  if (command === "doctor") return {
    stage: values.stage, task_id: context.task.identity.taskId, worktree_root: context.workspace.worktreeRoot,
    baseline_commit: context.workspace.baselineCommit, workspace: context.physical,
    storage: doctorStorage(context), materials: thinMaterials(context), ocr: detectOcr(),
  };
  if (command === "status") {
    const rows = readTaskFacts(context.task.taskPath); // malformed JSON and permissions are real errors
    const materials = thinMaterials(context);
    const cohort = context.manifest.activation_cohort ?? "pre";
    const needed = values.stage === "make-decision" ? [] : values.stage === "build-plan" ? ["decision-log.md"]
      : values.stage === "build-prd" ? ["decision-log.md"] : materialFilesForCohort(cohort, materials);
    const missing = needed.filter((file) => materials[file] === null || !String(materials[file] ?? "").trim());
    const row = rows.find((value) => value.record_kind === "stage" && value.stage === values.stage) ?? null;
    const currentCursor = rows.find((value) => value.record_kind === "stage" && value.stage === "build-code")?.phase_progress ?? null;
    const phasesHead = cohort === "post" ? currentPhaseMaterialsHead(context) : null;
    const qualityStatus = thinQuality(context, row);
    return { task_id: context.task.identity.taskId, stage: values.stage, work_status: missing.length ? "not_ready" : "ready",
      readiness_source: "current-material-presence", missing_materials: missing, quality_status: qualityStatus,
      quality: { status: qualityStatus, review_origin: row?.review_origin ?? "not_run", review_result_ref: row?.review_result_ref ?? null },
      materials: Object.fromEntries(Object.entries(materials).map(([file, value]) => [file, value !== null])),
      ...(values.stage === "build-code" ? { phase_progress: derivePhaseProgressStatus({ cursor: currentCursor, currentPhasesHead: phasesHead }) } : {}),
      facts: rows, workspace: context.physical,
    };
  }
  if (command === "artifact") {
    const prd = values.stage === "build-prd" && values.name === "prd.md";
    if (!prd && !isDesignArtifact(values.stage, values.name, context.manifest.activation_cohort ?? "pre")) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.ensureRoot();
    const relativeName = values.name;
    context.artifacts.prepareWrite(relativeName);
    await writeFileAtomic(context.artifacts.root, relativeName, readFileSync(values.input));
    return { artifact_ref: context.artifacts.reference(relativeName) };
  }
  if (command === "capture-tests") {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("verify input must be an object");
    const allowed = new Set(["argv", "shell", "command", "slug", "timeoutMs", "timeout_ms", "receipt_ref", "output_ref"]);
    if (Object.keys(input).some((key) => !allowed.has(key))) throw new TypeError("verify input has unknown fields");
    if (input.shell !== undefined && input.command !== undefined) throw new TypeError("verify accepts shell or command, not both");
    if (input.timeoutMs !== undefined && input.timeout_ms !== undefined) throw new TypeError("verify accepts one timeout field");
    // Historical receipt/output refs are accepted input labels only: native
    // capture owns its fresh single output/receipt filenames, with no reuse.
    const recordDir = join(context.task.taskPath, "quality", "tests");
    mkdirSync(recordDir, { recursive: true });
    return captureCommand({ cwd: context.workspace.worktreeRoot, recordDir, slug: input.slug ?? `${values.stage}-verify`,
      ...(input.argv === undefined ? {} : { argv: input.argv }),
      ...((input.shell ?? input.command) === undefined ? {} : { shell: input.shell ?? input.command }),
      ...((input.timeoutMs ?? input.timeout_ms) === undefined ? {} : { timeoutMs: input.timeoutMs ?? input.timeout_ms }),
      ...(services.commandSignal === undefined ? {} : { signal: services.commandSignal }),
    });
  }
  if (command === "confirm") {
    const fields = input ?? { stage: values.stage, decision: values.decision, reply: values["reply-text"], materialRefs: values["material-ref"] === undefined ? [] : [values["material-ref"]] };
    if (fields.stage !== undefined && fields.stage !== values.stage) throw new TypeError("confirmation stage differs from CLI stage");
    return { status: "recorded", ...(await recordConfirmation({ ...fields, stage: values.stage }, { cwd: context.workspace.worktreeRoot, dir: join(context.task.taskPath, "quality", "confirmations") })) };
  }
  if (command === "authorize-operation") {
    if (!["commit", "push", "merge", "archive", "cleanup"].includes(values.operation) || !values["subject-ref"]) throw new TypeError("authorize requires a supported operation and --subject-ref");
    // The native authorization API intentionally binds process.cwd(). Invoke
    // its existing CLI in the real worktree; never mutate this process cwd.
    const output = execFileSync(process.execPath, [fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs", import.meta.url)), "record",
      "--operation", values.operation, "--confirmation-ref", values["subject-ref"], "--dir", join(context.task.taskPath, "quality", "authorizations")],
      { cwd: context.workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: "recorded", ...JSON.parse(output) };
  }
  if (command === "run") {
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).join("\0") !== "phase_progress" || values.stage !== "build-code") {
      throw new TypeError("run --action=execute only records the existing build-code phase_progress cursor; official stage execution is retired");
    }
    return writeBuildCodePhaseProgressCursor(context, input.phase_progress);
  }
  if (command === "review-record") {
    if(!input || typeof input!=="object" || Array.isArray(input) || !input.request || input.result!==undefined) throw new TypeError("review --action=record requires a request; importing caller-authored results is retired");
    const original=input.request;
    if(original.stage!==undefined && original.stage!==values.stage) throw new TypeError("review request stage differs from CLI stage");
    const request={...original,stage:values.stage,activation_cohort:context.manifest.activation_cohort ?? "pre"};
    const isPhase=values.stage==="build-code" && (request.review_kind ?? request.reviewKind ?? null)===null;
    if(isPhase) {
      request.review_scope=request.review_scope ?? request.reviewScope ?? "phase";
      request.phase_id=request.phase_id ?? request.phaseId ?? values["phase-id"] ?? null;
      request.subject_kind=request.subject_kind ?? "phase";
    }
    const codeSurface=["build-code","verify-code"].includes(request.stage)
      && (request.review_kind ?? request.reviewKind ?? null)===null && request.surface!=="document";
    if(codeSurface)request.surface="code";
    const runner=async (current,options)=>{
      const whReview=typeof services.runReviewRound==="function" ? services.runReviewRound : runSimpleReview;
      if(!codeSurface)return whReview(current,options);
      const detection=detectOcr();
      if(detection.status==="unavailable")return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:detection.error?.code ?? "OCR_DETECTION_UNAVAILABLE",message:detection.reason}};
      if(detection.status==="not_installed"){
        const fallback={from:"ocr",reason:detection.reason,detected_by:detection.detected_by};
        const result=typeof services.runReviewRound==="function" ? await whReview(current,options)
          : await whReview(current,{...options,buildBundle:()=>prepareTaskBoundBuildCodeReviewBundle(context,current)});
        return {...result,executor:"wh-review",fallback};
      }
      const ocrRunner=services.runOcrDelegationRound;
      if(typeof ocrRunner==="function")return {...await ocrRunner(current,options),executor:"ocr"};
      let bundle;
      try {
        bundle=prepareTaskBoundBuildCodeReviewBundle(context,current);
        const trustedContext=prepareConfiguredOcrHostContext(current);
        const result=await runOcrDelegationRound(current,{buildBundle:()=>bundle,signal:options.signal,
          executor:params=>runConfiguredOcrHostReview(params,{trustedContext,sourceBundle:bundle,
            rawOutputSink:async (hint,bytes,metadata={})=>options.onProviderOutput({provider:metadata.provider ?? "ocr",role:null,channel:metadata.stream ?? "raw-output",output:bytes})})});
        return {...result,executor:"ocr"};
      } finally {bundle?.dispose();}
    };
    return recordSimpleReviewRequest({taskDir:context.task.taskPath,request,runRound:runner,signal:services.reviewSignal ?? null});
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
      run_execute: "build-code phase_progress cursor only; no official stage execution",
      actions: {
        doctor: ["workspace"],
        status: ["begin", "repair"],
        run: ["draft", "execute"],
        review: ["record"],
        verify: ["execute"],
        confirm: ["decision"],
        authorize: ["commit", "push", "merge", "archive", "cleanup"],
      },
    };
  }
  if (!RUNTIME_BEHAVIORS.includes(behavior)) throw new Error("unknown public runtime behavior");
  const actionArguments = raw.filter((item) => item === "--action" || item.startsWith("--action="));
  if (actionArguments.length !== 1 || !actionArguments[0].startsWith("--action=") || actionArguments[0].slice("--action=".length).trim() === "") {
    throw new TypeError("public runtime behavior requires exactly one --action=<high-level-action>");
  }
  const actionArgument = actionArguments[0];
  if (!actionArgument) throw new TypeError("public runtime behavior requires --action=<high-level-action>");
  const action = actionArgument.slice("--action=".length);
  if (behavior === "run") {
    const commonWriteArguments = ["action", "stage", "project", "task", "task-path"];
    const writeActionArguments = {
      execute: new Set([...commonWriteArguments, "input"]),
      draft: new Set([...commonWriteArguments, "name", "input"]),
    };
    const allowedArguments = Object.hasOwn(writeActionArguments, action) ? writeActionArguments[action] : null;
    if (allowedArguments) {
      const stageArgument = raw.filter((item) => item.startsWith("--stage=")).pop();
      if (action === "execute" && stageArgument === `--stage=${PORTABLE_WORKFLOW_STAGE}`) allowedArguments.add("now");
      const unknownArgument = raw.find((item) => {
        const separator = item.indexOf("=");
        return !item.startsWith("--") || separator < 3 || !allowedArguments.has(item.slice(2, separator));
      });
      if (unknownArgument !== undefined) {
        const separator = unknownArgument.indexOf("=");
        const name = unknownArgument.startsWith("--")
          ? unknownArgument.slice(2, separator < 0 ? undefined : separator)
          : unknownArgument;
        throw new TypeError(`unknown run option: --${name}`);
      }
    }
  }
  const publicRoute = `${behavior}:${action}`;
  const internalOperation = ({
    "doctor:workspace": "doctor",
    "status:begin": "status",
    "status:repair": "status",
    "run:execute": "run",
    "run:draft": "artifact",
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
    process.stderr.write(`${JSON.stringify({ error: error.message, code: error.code ?? null, stack: error.stack ?? null, output_ref: error.output_ref ?? null, receipt_ref: error.receipt_ref ?? null })}\n`);
    process.exitCode ??= Number.isInteger(error.exitCode) ? error.exitCode : 1;
  });
}
