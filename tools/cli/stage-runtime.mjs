#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { assertRuntimeAuthority } from "../../core/runtime-mode.mjs";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
} from "../../runtime/stage/stage-context.mjs";
import { authenticateStageOutcomeForProjection, runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { validateStageInvocation } from "../../runtime/stage/stage-handlers.mjs";
import { runStageReflection } from "../../runtime/stage/stage-reflect.mjs";
import {
  validateAcceptanceEvidence,
  publishEvidence,
} from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { runCapture as captureBuildCodeTests } from "../../workflows/build-code/capture.mjs";
import { runCapture as captureVerifyCodeTests } from "../../workflows/verify-code/capture.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { deriveCurrentProductRelease, deriveProductRelease, deriveStageCompletion, deriveStageOutcomeStatuses, deriveStageProgress, stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import { activeAcceptanceCriterionIds } from "../../runtime/stage/stage-content-contracts.mjs";
import { evaluateFactFreshness } from "../../runtime/evidence/freshness.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { validateProjectName, validateTaskId } from "../../runtime/task/task-identity.mjs";
import { resolveStorageRoot, resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const GIT_OID = /^[a-f0-9]{40,64}$/;
const WORKFLOW_STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

export function resolveWorkflowHubIdentity(values, cwd = process.cwd(), env = process.env) {
  const hasProject = typeof values.project === "string" && values.project.trim() !== "";
  const hasTask = typeof values.task === "string" && values.task.trim() !== "";
  if (hasProject !== hasTask) throw new TypeError("--project and --task must be supplied together");
  const explicit = hasProject
    ? Object.freeze({ project: validateProjectName(values.project), task: validateTaskId(values.task) })
    : null;
  const derived = deriveIdentityFromAuthenticatedWorktree(cwd, env);
  if (explicit && derived
      && (explicit.project !== derived.project || explicit.task !== derived.task)) {
    throw new Error(`WorkflowHub identity conflict: explicit ${explicit.project}/${explicit.task} does not match authenticated worktree ${derived.project}/${derived.task}`);
  }
  if (explicit) return Object.freeze({ ...explicit, taskPath: undefined, source: "explicit" });
  if (derived) return derived;
  throw new Error("WorkflowHub identity missing: supply --project and --task or run from an authenticated task worktree");
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

function evaluateFreshnessWithReuse({ fact, factRaw, factSha256, currentSnapshot, materialRevision, materials, read, workspaceRoot, taskId }) {
  const acceptanceEvidence = (fact.evidence ?? []).find((entry) => entry?.evidence_type === "acceptance_evidence" && typeof entry?.ref === "string" && typeof entry?.sha256 === "string");
  if (acceptanceEvidence && currentSnapshot?.tree && materialRevision) {
    try {
      const raw = read(acceptanceEvidence.ref);
      const parsed = validateAcceptanceEvidence(JSON.parse(raw));
      if (
        parsed.freshness?.status === "current"
        && parsed.freshness.snapshot_tree === currentSnapshot.tree
        && parsed.freshness.material_revision === materialRevision
        && parsed.freshness.evidence_freshness.every((entry) => entry.status === "current" && entry.sha256 === acceptanceEvidence.sha256)
      ) {
        return Object.freeze({
          fact_ref: fact.ref,
          status: "current",
          authenticated: true,
          reused: true,
          dependencies: Object.freeze({ material: "current", tree: "current", fact: "current", evidence: "current" }),
        });
      }
    } catch {
      // Fall through to full freshness evaluation on any mismatch or validation failure.
    }
  }
  if (!currentSnapshot?.tree || !materialRevision) {
    return Object.freeze({ fact_ref: fact.ref, status: "unknown", authenticated: false });
  }
  return evaluateFactFreshness(
    { ...fact, ref: fact.ref, sha256: factSha256 },
    {
      material_revision: materialRevision,
      material_scope_revisions: stageMaterialScopeRevisions(materials),
      snapshot_tree: currentSnapshot.tree,
    },
    { read, workspaceRoot, taskId },
  );
}
function currentProductReleaseView({ context, currentSnapshot, materialRevision, materials }) {
  const stageOutcomeRefs = Object.fromEntries(WORKFLOW_STAGES.map((stage) => [
    stage,
    context.task.listCanonicalStageOutcomeRefs(stage),
  ]));
  const stageOutcomeStatuses = deriveStageOutcomeStatuses({
    task_id: context.identity.taskId,
    read: context.task.readRecord,
    stage_outcome_refs: stageOutcomeRefs,
    snapshot_tree: currentSnapshot.tree,
    material_revision: materialRevision,
    material_scope_revisions: stageMaterialScopeRevisions(materials),
    snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
    authenticate: ({ stage, ref }) => authenticateStageOutcomeForProjection({ ...context, stage }, stage, ref),
  });
  return deriveCurrentProductRelease({
    task_id: context.identity.taskId,
    read: context.task.readRecord,
    refs: context.task.listCanonicalQualityFactRefs(),
    snapshot_tree: currentSnapshot?.tree,
    material_revision: materialRevision,
    material_scope_revisions: stageMaterialScopeRevisions(materials),
    snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
    expected_acceptance_ids: activeAcceptanceCriterionIds(materials["spec.md"] ?? ""),
    evaluate_freshness: evaluateFactFreshness,
    stage_outcome_statuses: stageOutcomeStatuses,
  });
}

// Keep status as a read-only projection of the existing facts. The grouping
// makes the next action obvious without turning quality facts into a new gate
// or hiding unavailable/not-applicable evidence.
export function deriveStatusGroups({ stage = null, quality, productRelease, observations = [] } = {}) {
  // Status is a projection of the same authenticated/current facts used by
  // deriveStageCompletion. Never let a stale or unauthenticated attempt hide
  // a current actionable gap, and never let array order decide which attempt
  // wins.
  const current = observations.filter((observation) => observation?.authenticated === true
    && observation?.freshness?.status === "current");
  const byRef = new Map();
  const bySubject = new Map();
  for (const observation of current) {
    const fact = observation?.fact?.value ?? observation?.fact;
    const subject = fact?.subject;
    if (typeof observation?.fact?.ref === "string") byRef.set(observation.fact.ref, observation);
    if (typeof subject !== "string" || subject.trim() === "") continue;
    const candidates = bySubject.get(subject) ?? [];
    candidates.push(observation);
    bySubject.set(subject, candidates);
  }
  const latestFor = (subject) => {
    const candidates = bySubject.get(subject) ?? [];
    if (candidates.length === 0) return null;
    const ranked = candidates.map((observation) => ({
      observation,
      recordedAt: Date.parse((observation.fact?.value ?? observation.fact)?.recorded_at ?? ""),
    }));
    if (ranked.some(({ recordedAt }) => !Number.isFinite(recordedAt))) return { conflict: true };
    const latestRecordedAt = Math.max(...ranked.map(({ recordedAt }) => recordedAt));
    const latest = ranked.filter(({ recordedAt }) => recordedAt === latestRecordedAt);
    return latest.length === 1 ? latest[0].observation : { conflict: true };
  };
  const selectedFor = (subject) => {
    const selectedRef = quality?.predicates?.[subject]?.fact_ref;
    return (selectedRef && byRef.get(selectedRef)) ?? latestFor(subject);
  };
  const actionable_now = [];
  const external_unavailable = [];
  const not_applicable = [];
  const missing = quality?.missing ?? [];
  for (const subject of missing) {
    const selected = selectedFor(subject);
    const fact = selected?.fact?.value ?? selected?.fact;
    if (selected?.conflict) {
      actionable_now.push(subject);
    } else if (["unavailable", "unknown"].includes(fact?.status)) {
      external_unavailable.push(`${subject}:${fact.status}`);
    } else if (fact?.status === "not_applicable") {
      not_applicable.push(`${subject}:not_applicable`);
    } else {
      actionable_now.push(subject);
    }
  }
  const quality_gaps = [...new Set(productRelease?.reasons ?? [])];
  const close_supported = stage === "verify-code";
  // Read-only preflight for physical close. These are facts to surface to the
  // operator, never a new gate or a replacement for verify-code quality.
  const close_preparation_gaps = close_supported
    ? [...new Set([
      ...missing.map((subject) => `verify-code prerequisite missing: ${subject}`),
      ...quality_gaps,
    ])]
    : [];
  return Object.freeze({
    actionable_now: Object.freeze(actionable_now),
    external_unavailable: Object.freeze(external_unavailable),
    not_applicable: Object.freeze(not_applicable),
    quality_gaps: Object.freeze(quality_gaps),
    release_gaps: Object.freeze(quality_gaps),
    close_supported,
    close_preparation_gaps: Object.freeze(close_preparation_gaps),
    next_action: actionable_now[0] ?? (external_unavailable[0] ?? null),
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

function preflightDiagnostic(error) {
  if (error?.diagnostic && typeof error.diagnostic.path === "string") return error.diagnostic;
  return {
    path: "$",
    expected: "valid stage payload",
    actual: error?.message ?? String(error),
  };
}

function runPreflight(stage, input) {
  validateStageInvocation(stage, input);
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
  if (command === "preflight" || (command === "run" && values.action === "preflight")) {
    const prefix = command === "run" ? "run:" : "";
    const allowed = new Set(command === "run" ? ["action", "stage", "input"] : ["stage", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError(`${prefix}preflight accepts only --stage and --input`);
    if (!new Set(["build-code", "verify-code"]).has(values.stage)) throw new TypeError(`${prefix}preflight requires --stage=build-code|verify-code`);
    if (typeof values.input !== "string" || values.input.trim() === "") throw new TypeError(`${prefix}preflight requires --input=<payload.json>`);
    const payload = JSON.parse(readFileSync(values.input, "utf8"));
    try {
      return runPreflight(values.stage, payload);
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
  const input = new Set(["review-risk-pause", "review-record", "capture-tests", "capture-evidence", "run", "reflect"]).has(command)
      && values.input !== undefined
    ? JSON.parse(readFileSync(values.input, "utf8"))
    : undefined;
  if (values.stage === "make-decision" && command !== "status") {
    context = prepareMakeDecisionWorkspace(context);
  }
  if (command === "status") {
    const allowed = new Set(["stage", "project", "task", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("status accepts only --stage, --project, --task, and optional --reason");
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
    const observations = [];
    for (const ref of context.task.listCanonicalQualityFactRefs()) {
      let value;
      let raw;
      try {
        raw = context.task.readRecord(ref);
        value = JSON.parse(raw);
      } catch { continue; }
      if (value?.task_id !== context.task.identity.taskId || value?.stage !== values.stage) continue;
      const freshness = current
        ? evaluateFreshnessWithReuse({
            fact: { ...value, ref },
            factRaw: raw,
            factSha256: sha256(raw),
            currentSnapshot: current,
            materialRevision,
            materials,
            read: context.task.readRecord,
            workspaceRoot: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
            taskId: context.task.identity.taskId,
          })
        : { status: "unknown", authenticated: false };
      observations.push({ fact: { ref, value }, authenticated: freshness.authenticated === true, recorded: true, freshness });
    }
    const stageOutcomeStatuses = current
      ? deriveStageOutcomeStatuses({
          task_id: context.identity.taskId,
          read: context.task.readRecord,
          stage_outcome_refs: Object.fromEntries(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].map((stage) => [stage, context.task.listCanonicalStageOutcomeRefs(stage)])),
          snapshot_tree: current.tree,
          material_revision: materialRevision,
          material_scope_revisions: stageMaterialScopeRevisions(materials),
          snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
          authenticate: ({ stage, ref }) => authenticateStageOutcomeForProjection({ ...context, stage }, stage, ref),
        })
      : null;
    const quality = deriveStageCompletion(values.stage, observations, {
      requireStageOutcome: stageOutcomeStatuses !== null,
      stageOutcomeStatus: stageOutcomeStatuses?.[values.stage] ?? "unavailable",
    });
    const progression = deriveStageProgress(values.stage, observations, materials);
    const productRelease = current
      ? currentProductReleaseView({ context, currentSnapshot: current, materialRevision, materials })
      : deriveProductRelease({
        stage_completions: [],
        acceptance_results: [],
        expected_acceptance_ids: activeAcceptanceCriterionIds(materials["spec.md"] ?? ""),
        verify_confirmation: null,
      });
    const statusGroups = deriveStatusGroups({ stage: values.stage, quality, productRelease, observations });
    return Object.freeze({
      ...progression,
      quality_status: quality.status,
      quality_missing: quality.missing,
      quality_fact_refs: Object.freeze(observations.map(({ fact }) => fact.ref).sort()),
      quality_predicates: quality.predicates,
      product_release_status: productRelease.status,
      product_release_reasons: productRelease.reasons,
      product_release_input_refs: productRelease.input_refs,
      status_groups: statusGroups,
    });
  }
  authenticateStageWriteBoundary(context, {
    runnerRoot: RUNNER_ROOT,
    operation: command,
  });
  if (command === "doctor") {
    const allowed = new Set(["stage", "project", "task"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("doctor accepts only --stage, --project, and --task");
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
        || Object.keys(input).some((key) => !new Set(["command", "receipt_ref", "output_ref"]).has(key))) {
      throw new TypeError("test capture input requires command, receipt_ref, and optional output_ref only");
    }
    const capture = values.stage === "build-code" ? captureBuildCodeTests : captureVerifyCodeTests;
    return capture(input.command, input.receipt_ref, {
      task: context.task,
      workspace: context.workspace,
      ...(input.output_ref === undefined ? {} : { outputRef: input.output_ref }),
    });
  }
  if (command === "capture-evidence") {
    const allowed = new Set(["stage", "project", "task", "input"]);
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
    if (!input || typeof input !== "object" || Array.isArray(input) || !Object.prototype.hasOwnProperty.call(input, "result")) {
      throw new TypeError("review-record input requires a 'result' field with the simple review public result");
    }
    const refs = recordSimpleReviewResult({
      task: context.task,
      result: input.result,
      kernel: context.kernel,
    });
    return { status: "recorded", ...refs };
  }
  if (command === "reflect") {
    const allowed = new Set(["stage", "project", "task", "input", "now"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("reflect accepts only --stage, --project, --task, --input, and optional --now");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("reflect input must be a judgment object");
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
    const allowedRunFields = new Set(values.stage === "build-code"
      ? ["receipts", "attempt_id", "acceptance_coverage", "finding_dispositions", "contract_facts"]
      : ["receipts", "attempt_id", "finding_dispositions", "contract_facts"]);
    const suppliedInput = input ?? {};
    const unknownRunFields = Object.keys(suppliedInput).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(suppliedInput.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    // Missing, stale, or unavailable upstream quality facts remain visible in
    // quality/product-release projections, but never become a work permit.
    // Stage outcomes must be supplied explicitly by the caller; no host
    // session is scanned or rebound as a side effect of public run.
    return runOfficialStage(values.stage, context, {
      ...suppliedInput,
      receipts: { ...(suppliedInput.receipts ?? {}) },
    }, stageReflectionPublication(services));
  }
  if (command === "confirm") {
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
        review: ["risk"],
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
  return invokeRuntimeCommand(
    behavior,
    Object.freeze({ action, argv: delegatedArgv }),
    ({ argv: internalArgv }) => delegate(internalArgv, { services, cwd }),
    { skillBundleContract, runnerContract },
    internalOperation,
  );
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
    process.exitCode = result?.status === "protocol_invalid" ? 2 : 0;
  }).catch((error) => {
    if (error?.preflight_protocol === true && error?.diagnostic) {
      process.stdout.write(`${JSON.stringify([error.diagnostic], null, 2)}\n`);
      process.exitCode = 2;
      return;
    }
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
