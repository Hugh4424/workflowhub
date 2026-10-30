#!/usr/bin/env node
import { STAGE, WORKFLOW_STAGES } from "../../runtime/stage/stage-registry.mjs";

import { closeSync, fstatSync, openSync, constants as fsConstants, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { resolveCanonicalTaskPath } from "../../runtime/task/load-config.mjs";
import { bootstrapStage } from "../../runtime/stage/stage-context.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { readTaskTypeFromDecisionLog, validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";
import { projectPortableWorkflowStatus, runPortableWorkflow } from "../../runtime/task/portable-workflow-run.mjs";
import { CURRENT_MATERIAL_FILES, materialFilesForCohort, phaseFilesFromIndex } from "../../runtime/task/material-workspace.mjs";
import { readTaskFacts, STAGE_ROW_KEYS, writeStageRow } from "../../runtime/task/task-store.mjs";
import { inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";
import { captureCommand } from "../../runtime/interface/run-command.mjs";
import { withLock } from "../../runtime/interface/record-lock.mjs";
import { recordConfirmation } from "../../runtime/interface/human-confirm.mjs";
import { confirmClosePlan } from "../../core/task-close.mjs";
import { validateTaskId } from "../../runtime/task/task-identity.mjs";
import { resolveStorageRoot, resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";
import { AUTHENTICATED_EVIDENCE_PATH, redactProviderHostPaths } from "../../runtime/review/provider-material-projection.mjs";
import { deliveredMaterialId, authenticatedEvidenceBytes } from "../../runtime/review/review-packet-identity.mjs";
import { runSimpleReview, validateReviewSupplement, validateReviewCallerMaterials } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { prepareConfiguredOcrHostContext, runConfiguredOcrHostReview, runOcrDelegationRound, detectOcr } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { compactReviewDiff, compactVerifyCodeMaterials, gitDiffPath, verifyCodeChangedPaths } from "../../runtime/review/review-input-bounds.mjs";
import { captureReviewSource, readScopedReviewMaterial } from "../../skills/wh-review/scripts/review-source.mjs";
import { buildReviewMaterials, canonicalMaterialManifest, reviewMaterialBytes, reviewInstructionsFor, validateVerifyAcceptanceSummary } from "../../skills/wh-review/scripts/review-materials.mjs";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});

const POST_PHASE_ARTIFACT = /^phases\/P[1-9][0-9]*\.md$/;

const PHASE_PROGRESS_ONLY_SOURCE = "phase-progress-cursor";

function isDesignArtifact(stage, name, activationCohort = "pre", materials = {}) {
  if (stage === "make-decision" && activationCohort === "post") {
    return materialFilesForCohort(activationCohort, materials, { stage }).includes(name);
  }
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

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const GIT_OID = /^[a-f0-9]{40,64}$/;

const PORTABLE_WORKFLOW_STAGE = "build-prd";

export function reviewRecordTimeoutForRunner({ managed = false } = {}) {
  if (typeof managed !== "boolean") throw new TypeError("managed review runner flag must be boolean");
  return managed ? null : undefined;
}

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

function gitTaskBranchIdentity(cwd) {
  let branch;
  try {
    branch = String(execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
      cwd,
      env: gitMetadataEnvironment(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim();
  } catch (error) {
    if (error?.code === "ENOENT" || error?.status !== undefined) return null;
    throw error;
  }
  const match = /^task\/([A-Za-z0-9][A-Za-z0-9._-]*)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(branch);
  return match ? Object.freeze({ projectName: match[1], taskId: match[2] }) : null;
}

function realDirectoryEntry(path, label) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a real directory: ${path}`);
  return realpathSync(path);
}

function registeredTaskCandidates(storageRoot, repositoryRoot, worktreeRoot, taskBranchIdentity) {
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
      const defaultPath = deterministicRoot === worktreeRoot;
      const defaultIdentityMatches = defaultPath && taskBranchIdentity
        && taskBranchIdentity.projectName === projectEntry.name
        && taskBranchIdentity.taskId === validTaskId;
      const mustAuthenticateDefault = defaultPath && (!taskBranchIdentity || defaultIdentityMatches);
      let manifest;
      let manifestReadable = false;
      {
        const manifestPath = resolve(taskPath, "task.json");
        try {
          const stat = lstatSync(manifestPath);
          if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("task manifest must be a regular file");
          manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
          manifestReadable = true;
        } catch (error) {
          // Keep the default-path candidate so openTask still rejects missing
          // or invalid metadata instead of falling back to explicit identity.
          if (!mustAuthenticateDefault) continue;
        }
        // A matching default-path registration must authenticate before scope
        // filtering: corrupt metadata is an error, not an absent identity.
        // A recognizable task branch lets foreign default registrations be
        // ignored before their corrupt metadata can block the current project.
        if (mustAuthenticateDefault) {
          manifest = openTask(taskPath, projectEntry.name, validTaskId).manifest;
          manifestReadable = true;
        }
        const explicitExisting = manifest?.workspace_mode === "existing" && typeof manifest.workspace_root === "string" && resolve(manifest.workspace_root) === worktreeRoot;
        const targetIsWorkspace = worktreeRoot !== repositoryRoot && manifest?.workspace_mode === undefined && typeof manifest?.target_repo_root === "string" && resolve(manifest.target_repo_root) === worktreeRoot;
        const defaultWorkspace = defaultPath && manifest?.workspace_mode === undefined
          && typeof manifest?.target_repo_root === "string" && resolve(manifest.target_repo_root) === repositoryRoot;
        if (defaultPath && taskBranchIdentity && !defaultIdentityMatches && !explicitExisting && !targetIsWorkspace) continue;
        if (manifestReadable && ((!explicitExisting && !targetIsWorkspace && !defaultWorkspace) || typeof manifest?.target_repo_root !== "string"
            || ![repositoryRoot, worktreeRoot].includes(resolve(manifest.target_repo_root)))) continue;
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
  const candidates = registeredTaskCandidates(storageRoot, repositoryRoot, worktreeRoot, gitTaskBranchIdentity(cwd));
  if (candidates.length === 0) return null;
  if (candidates.length > 1) {
    throw new Error(`WorkflowHub identity conflict: multiple task manifests are registered for worktree ${worktreeRoot}`);
  }
  const candidate = candidates[0];
  const metadata = openTask(candidate.taskPath, candidate.projectName, candidate.taskId);
  const declared = metadata.manifest.workspace_mode === "existing" ? metadata.manifest.workspace_root
    : metadata.manifest.workspace_mode === undefined && resolve(metadata.manifest.target_repo_root) === worktreeRoot
      ? worktreeRoot : resolve(dirname(repositoryRoot), `${basename(repositoryRoot)}-${candidate.taskId}`);
  if(typeof declared!=="string" || realpathSync(resolve(declared))!==worktreeRoot)throw new Error("task metadata workspace does not match the current Git worktree");
  return Object.freeze({
    project: metadata.identity.projectName,
    task: metadata.identity.taskId,
    taskPath: metadata.taskPath,
    source: "worktree",
    taskPathSource: "authenticated_worktree",
  });
}

function isTaskBoundBuildCodeReviewRequest(request) {
  const scope = request?.review_scope ?? request?.reviewScope ?? null;
  return request?.stage === "build-code"
    && (scope === "phase" || scope === "terminal");
}

function isNormalOcrCodeReviewRequest(request) {
  const scope = request?.review_scope ?? request?.reviewScope ?? null;
  const kind = request?.review_kind ?? request?.reviewKind ?? null;
  const track = request?.review_track ?? request?.reviewTrack ?? null;
  return track === null && kind === null && (
    (request?.stage === "build-code" && (scope === "phase" || scope === "terminal"))
);
}

function ocrReviewInstructionsFor(request) {
  const focus = reviewInstructionsFor(request.stage, null, false,
    request.review_scope ?? request.reviewScope ?? null, request.review_kind ?? request.reviewKind ?? null, "full", null, true);
  return [
    `OCR code review: ${request.stage}/${request.phase_id ?? request.phaseId ?? "worktree"}.`,
    "Read the complete contracts/build-code.md, contracts/provider-protocol.md and manifest-declared lens skill bodies. Apply the actual stage's reviewer contract and the review focus below; the build-code contract contains both phase and terminal boundaries.",
    "Start with source.json, diff-index.json when present, review-instructions.md and full acceptance-criteria text. The complete diff content is in all manifest-declared per-file patch shards listed in diff-index.json; small packets instead contain changes.diff. Read the complete navigation first, then the relevant full patches and current implementation/consumer/test files according to real entry points, risk and changed interfaces. Do not blindly cat a cumulative diff or every historical/deleted body. Deleted and historical patches remain fully available by index reference and must be read when a concrete removal, consumer or security claim requires them. No diff section is omitted, summarized instead of supplied, or truncated; never infer a source line from a shard line. Do not replace required bodies with summaries or truncate contracts.",
    "When a changed file in the current diff also serves as a fixed reviewer body, its identical manifest entry serves both roles. Review the complete bytes as changed implementation source as well as reviewer instructions; neither role is omitted.",
    focus,
    "按根因合并重复 finding，保留真实消费者、后果和源码行证据。不可用≠空≠pass；缺少可用结果说明限制，不能当作没有问题。",
    "Return exactly one findings JSON. Code findings use packet-relative paths and real positive line numbers. Serious findings also include root_cause, evidence_kind and a verbatim source excerpt in backticks at the cited line or next two lines. Do not output verdict, stage completion or workflow permission.",
    "Read only listed packet files. Only Codex with verified native packet filesystem, tool and environment boundaries may use cat, sed or rg for declared packet paths; this is not general shell permission. Do not access parent directories, Git, network or host paths; do not write. Minimal runtime exceptions are for tool operation, not review material.",
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
  for (const path of ["contracts/build-code.md", "contracts/provider-protocol.md", "skills/simplicity-guard/SKILL.md", "skills/review/SKILL.md"]) {
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
        ? Buffer.from(bytes.toString("utf8").split("\n").filter((line,index)=>index<4 && !line.startsWith("Review stage ")).join("\n").replaceAll("`changes.diff`","`diff/changes.md`")+"\n"+ocrReviewInstructionsFor(request), "utf8") : bytes;
      if (projectedBytes === bytes) copyFileSync(join(built.bundleRoot, entry.path), destination);
      else writeFileSync(destination, projectedBytes);
      projected.push({ path: entry.path, bytes: projectedBytes.length, sha256: sha256(projectedBytes) });
    }
    // Capture only this selected diff's physical source files, never a tree.
    // Their submitted bytes, not a private Git snapshot, support reviewer lines.
    const diffText=readFileSync(source.diffPath,"utf8");
    const sourcePaths=new Set(), binarySourcePaths=new Set();
    for(const section of diffText.match(/^diff --git [\s\S]*?(?=^diff --git |$(?![\s\S]))/gm) ?? []){
      const line=section.split("\n",1)[0];
      const tokens=line.slice(11).match(/"(?:\\.|[^"\\])*"|\S+/g);
      if(tokens?.length!==2)throw new Error("OCR code diff contains an invalid Git header");
      const path=gitDiffPath(tokens[1]);sourcePaths.add(path);
      if(/^GIT binary patch$/m.test(section))binarySourcePaths.add(path);
    }
    const sourceRoot=source.sourceBytes ? null : realpathSync(source.sourceRoot);
    const includedSources=new Set(), nonTextArchives=[];
    for(const path of sourcePaths){
      if(isAbsolute(path)||path.split("/").some(x=>!x||x==="."||x===".."))throw new Error("OCR source path is unsafe");
      let raw;
      if(source.sourceBytes){
        if(!Object.hasOwn(source.sourceBytes,path))continue;
        raw=source.sourceBytes[path];
      }else{
      const target=join(sourceRoot,path);let named;
      try{let cursor=sourceRoot;for(const part of path.split("/")){cursor=join(cursor,part);const st=lstatSync(cursor);if(st.isSymbolicLink()||realpathSync(cursor)!==cursor)throw new Error(`OCR source path alias: ${path}`);}named=lstatSync(target);}
      catch(error){if(error.code==="ENOENT")continue;throw error;}
      if(!named.isFile()||named.nlink!==1)throw new Error(`OCR source is not a single-link regular file: ${path}`);
      const fd=openSync(target,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);
      try{const st=fstatSync(fd);if(st.dev!==named.dev||st.ino!==named.ino||!st.isFile()||st.nlink!==1)throw new Error(`OCR source changed: ${path}`);raw=readFileSync(fd);}finally{closeSync(fd);}
      }
      let bytes;
      try{bytes=reviewMaterialBytes(path,raw);}
      catch(error){
        // A binary archive is not a text source body. Its complete Git binary
        // patch remains supplied; expose the missing text interpretation.
        if(error.code!=="MATERIAL_NOT_UTF8" || !/\.zip$/i.test(path)
            || !binarySourcePaths.has(path) || projected.some(entry=>entry.path===path))throw error;
        nonTextArchives.push({path,source_bytes:raw.length,source_sha256:sha256(raw),
          current_source_listed:false,current_source_ref:null,full_git_binary_diff_available:true,
          limitation:"non-UTF8 archive body is not a packet text source; no archive contents or pixel interpretation was performed"});
        continue;
      }
      includedSources.add(path);
      const existing=projected.find(entry=>entry.path===path);
      if(existing){
        // A changed reviewer body can be both source context and fixed control.
        // Reuse only the complete identical bytes, never replace either role.
        if(!readFileSync(join(bundleRoot,path)).equals(bytes))throw new Error(`OCR source path conflicts with packet control: ${path}`);
        continue;
      }
      const destination=join(bundleRoot,path);mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,bytes,{flag:"wx",mode:0o600});projected.push({path,bytes:bytes.length,sha256:sha256(bytes)});
    }
    if(nonTextArchives.length){
      const entry=projected.find(item=>item.path==="source.json");
      if(!entry)throw new Error("OCR packet source identity is unavailable");
      const path=join(bundleRoot,"source.json"),identity=JSON.parse(readFileSync(path,"utf8"));
      identity.non_text_archives=nonTextArchives;
      const bytes=reviewMaterialBytes("source.json",identity);
      writeFileSync(path,bytes);entry.bytes=bytes.length;entry.sha256=sha256(bytes);
    }
    const diffIndexEntry=projected.find(entry=>entry.path==="diff-index.json");
    if(diffIndexEntry){
      const indexPath=join(bundleRoot,"diff-index.json");
      const index=JSON.parse(readFileSync(indexPath,"utf8"));
      if(index.schema_version!=="wh-review-diff-index.v1"||!Array.isArray(index.changes))throw new Error("OCR diff index is invalid");
      for(const change of index.changes){
        change.current_source_listed=includedSources.has(change.path);
        change.current_source_ref=change.current_source_listed ? change.path : null;
      }
      const indexBytes=reviewMaterialBytes("diff-index.json",index);
      writeFileSync(indexPath,indexBytes);
      diffIndexEntry.bytes=indexBytes.length;
      diffIndexEntry.sha256=sha256(indexBytes);
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

// The host's private service supplies a short-lived scope. Request/material
// JSON is never consulted for roots or authority. This checks structure and
// the authenticated primary binding; the host retains the human provenance.
function trustedReviewReadScope(context,request,value){
  if(value===undefined||value===null)return undefined;
  const invalid=message=>{throw Object.assign(new Error(`SOURCE_UNAVAILABLE: ${message}`),{code:'SOURCE_UNAVAILABLE'});};
  const pathSafe=path=>typeof path==='string'&&path.length>0&&!isAbsolute(path)&&!/[\\\0*?\[\]{}\x01-\x1f]/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..');
  const rootSafe=root=>typeof root==='string'&&isAbsolute(root)&&resolve(root)===root&&!/[\\\0*?\[\]{}]/.test(root);
  if(value.taskId!==context.task.identity.taskId||value.primaryRoot!==context.workspace.worktreeRoot||!Array.isArray(value.repositories)||value.repositories.length<1||value.repositories.length>2)invalid('scope task/workspace mismatch');
  const ids=new Set();
  const repositories=value.repositories.map(repo=>{
    if(!repo||!['wh','pb'].includes(repo.id)||ids.has(repo.id)||!rootSafe(repo.sourceRoot)||!rootSafe(repo.targetRepoRoot)||!GIT_OID.test(repo.baseCommit??'')||!GIT_OID.test(repo.expectedHead??'')||typeof repo.expectedBranch!=='string'||!repo.expectedBranch||!Array.isArray(repo.paths)||repo.paths.some(path=>!pathSafe(path))||new Set(repo.paths).size!==repo.paths.length)invalid('invalid exact repository scope');
    ids.add(repo.id);
    if(repo.id==='wh'&&(repo.sourceRoot!==context.workspace.worktreeRoot||repo.targetRepoRoot!==context.workspace.targetRepoRoot))invalid('primary repository mismatch');
    if(repo.id==='pb'&&(repo.sourceRoot===context.workspace.worktreeRoot||repo.targetRepoRoot!==repo.sourceRoot))invalid('secondary repository mismatch');
    return Object.freeze({...repo,paths:Object.freeze([...repo.paths])});
  });
  if(!ids.has('wh'))invalid('primary repository scope missing');
  if(!Array.isArray(value.evidenceFiles)||value.evidenceFiles.some(item=>!item||Object.keys(item).join()!=='ref'||!pathSafe(item.ref)||!/^quality\/(?:tests|evidence)\//.test(item.ref)))invalid('invalid exact evidence scope');
  if(!value.authorizationSource||typeof value.authorizationSource.confirmationRef!=='string'||!value.authorizationSource.confirmationRef||!Array.isArray(value.authorizationSource.materialRefs))invalid('scope provenance missing');
  return Object.freeze({...value,repositories:Object.freeze(repositories),evidenceFiles:Object.freeze(value.evidenceFiles.map(item=>Object.freeze({...item}))),taskRoot:context.task.taskPath});
}

function captureScopedReviewSource(context,request,scope,attachmentRoot,captureSource){
  let selected=null;
  if(request.stage==='build-code'&&(request.review_scope??request.reviewScope)==='phase'&&context.manifest.activation_cohort==='post'
      && (request.phase_id != null || (request.review_kind??request.reviewKind??null)!==null)){
    const index=context.artifacts.read('phases/index.md');
    const phases=Object.fromEntries(phaseFilesFromIndex(index).map(ref=>[ref,context.artifacts.read(ref)]));
    const parsed=validatePostPhaseContract({spec:context.artifacts.read('spec.md'),index,phases,reviewReadScope:scope});
    const phase=parsed.facts?.phase_rows?.find(row=>row.id===request.phase_id);
    if(parsed.errors.some(error=>(phase&&error.startsWith(`${phase.path} unsafe Write set path:`))||(error.startsWith('phases/index.md:')&&error.includes(` ${request.phase_id} (`)&&error.includes('unsafe write set path:'))))throw new Error('SOURCE_UNAVAILABLE: Phase path outside approved read scope');
    selected=phase?.write_set;
    if(!Array.isArray(selected))throw new Error('MATERIAL_INCOMPLETE: current Phase write set is unavailable');
  }
  // Validate declarations before projecting or starting any repository capture.
  // Task-owned facts retain their existing exact material-reference reader.
  if(selected!==null)for(const path of selected){
    const canonical=!isAbsolute(path)||resolve(path)===path;
    const matches=scope.repositories.filter(repo=>{
      if(!isAbsolute(path))return repo.id==='wh'&&repo.paths.includes(path);
      const rel=relative(repo.sourceRoot,path);
      return canonical&&rel&&!isAbsolute(rel)&&!rel.split('/').includes('..')&&repo.paths.includes(rel);
    });
    const fact=canonical&&isAbsolute(path)&&scope.evidenceFiles.some(({ref})=>path===resolve(scope.taskRoot,ref));
    if(matches.length!==1&&!fact)throw new Error('SOURCE_UNAVAILABLE: Phase path outside approved read scope');
    if(matches.length>1)throw new Error('SOURCE_UNAVAILABLE: Phase path has ambiguous approved repository scope');
  }
  const captures=[];
  try{
    for(const repo of scope.repositories){
      const paths=[...new Set(selected===null ? repo.paths : selected.flatMap(path=>{
        if(!isAbsolute(path))return repo.id==='wh'&&repo.paths.includes(path) ? [path] : [];
        const rel=relative(repo.sourceRoot,path);return repo.paths.includes(rel) ? [rel] : [];
      }))];
      captures.push(captureSource({sourceRoot:repo.sourceRoot,targetRepoRoot:repo.targetRepoRoot,baselineCommit:repo.baseCommit,expectedHead:repo.expectedHead,expectedBranch:repo.expectedBranch,writeSet:paths,repositoryId:repo.id,secureRead:true,reviewDataRoot:attachmentRoot,includeDiff:true}));
    }
    const temporary=mkdtempSync(join(attachmentRoot,'review-source-'));
    try{
      const diffPath=join(temporary,'changes.diff'),diff=captures.map(source=>readFileSync(source.diffPath,'utf8')).join('');
      writeFileSync(diffPath,diff,{flag:'wx',mode:0o600});
      const primary=captures.find(source=>source.repositoryId==='wh');
      return {sourceRoot:scope.primaryRoot,capturedHead:primary.capturedHead,baseCommit:primary.baseCommit,diffPath,diffBytes:Buffer.byteLength(diff),changedPaths:captures.flatMap(source=>source.changedPaths??[]),sourceBytes:Object.assign({},...captures.map(source=>source.sourceBytes)),repositories:captures.map(source=>({id:source.repositoryId,captured_head:source.capturedHead,baseline_commit:source.baseCommit,changed_paths:source.changedPaths,selected_paths:source.selectedPaths,coverage_limit:selected===null ? 'only exact scoped paths; other working-tree changes were not read or inventoried' : 'only current Phase declared and approved paths; other source content was not captured, read or inventoried'})),dispose(){for(const source of captures)source.dispose?.();rmSync(temporary,{recursive:true,force:true});}};
    }catch(error){rmSync(temporary,{recursive:true,force:true});throw error;}
  }catch(error){for(const source of captures)source.dispose?.();throw error;}
}

function phaseReviewSourceProjection(context, request, source, attachmentRoot, reviewReadScope) {
  if (request.stage !== "build-code" || (request.review_kind ?? request.reviewKind ?? null) !== null || (request.review_scope ?? request.reviewScope) !== "phase"
      || context.manifest?.activation_cohort !== "post") return source;
  // A light implementation has no Phase contract: retain the captured whole
  // workspace (or explicitly trusted read scope) and report that it was not checked.
  if (request.phase_id == null) return Object.freeze({ ...source,
    contract_facts: Object.freeze({ contract_ok: null, contract_error_count: null,
      contract_errors: [], ac_coverage: null, fr_coverage: null, command_oracle_checks: null }),
  });
  const index = context.artifacts.read("phases/index.md");
  const phases = Object.fromEntries(phaseFilesFromIndex(index).map((ref) => [ref, context.artifacts.read(ref)]));
  const parsed = validatePostPhaseContract({ spec: context.artifacts.read("spec.md"), index, phases, reviewReadScope });
  const phase = parsed.facts?.phase_rows?.find((row) => row.id === request.phase_id);
  const invalidEmptyScope = phase?.write_set?.length === 0 && parsed.errors.some(error =>
    error.startsWith(`${phase.path} `) && /Write set is missing|Write set none declaration is invalid|unsafe Write set path:|write set differs from Phase index|must declare Phase /.test(error));
  if (!Array.isArray(phase?.write_set) || invalidEmptyScope) throw new Error("MATERIAL_INCOMPLETE: current Phase write set is unavailable");
  const selectedPaths=reviewReadScope ? phase.write_set.flatMap(path=>{
    if(!isAbsolute(path))return [`repos/wh/${path}`];
    const repo=reviewReadScope.repositories.find(repo=>repo.paths.includes(relative(repo.sourceRoot,path)));
    return repo ? [`repos/${repo.id}/${relative(repo.sourceRoot,path)}`] : [];
  }) : phase.write_set;
  const selected = compactReviewDiff(readFileSync(source.diffPath, "utf8"), { writeSet: selectedPaths }).diff;
  const diffPath = join(dirname(source.diffPath), `phase-${request.phase_id}.diff`);
  writeFileSync(diffPath, selected, { flag: "wx", mode: 0o600 });
  return Object.freeze({ ...source, diffPath, diffBytes: Buffer.byteLength(selected, "utf8"),
    contract_facts: Object.freeze({ contract_ok: parsed.ok, contract_error_count: parsed.errors.length,
      contract_errors: parsed.errors, ac_coverage: parsed.facts?.ac_coverage ?? null,
      fr_coverage: parsed.facts?.fr_coverage ?? null, command_oracle_checks: parsed.facts?.command_oracle_checks ?? null }),
  });
}

function phaseReviewDiffBase(context, request) {
  if (request.stage !== "build-code" || (request.review_kind ?? request.reviewKind ?? null) !== null || (request.review_scope ?? request.reviewScope) !== "phase") return null;
  const taskPath = context?.task?.taskPath;
  if (typeof taskPath !== "string") return null;
  try { lstatSync(join(taskPath, "facts.jsonl")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
  const cursor = readTaskFacts(taskPath).find(row => row?.record_kind === "stage" && row.stage === "build-code")?.phase_progress;
  return cursor && cursor.phase_id === request.phase_id && typeof cursor.base_head === "string" && GIT_OID.test(cursor.base_head)
    ? cursor.base_head : null;
}

export function prepareTaskBoundBuildCodeReviewBundle(context, request, {
  loadConfig = loadTrustedThirdReviewConfig,
  captureSource = captureReviewSource,
  buildMaterials = buildReviewMaterials,
  resolveReviewReadScope,
  reviewReadScope,
} = {}) {
  if (!isTaskBoundBuildCodeReviewRequest(request)) throw new TypeError("task-bound build-code review request required");
  const reviewScope = request.review_scope ?? request.reviewScope;
  const candidateExperiment = isNormalOcrCodeReviewRequest(request);
  if (candidateExperiment && reviewScope === "terminal") {
    validateVerifyAcceptanceSummary(request.materials?.acceptance_criteria);
  }
  const trusted = loadConfig({ requestedStage: request.stage, requestedTrack: request.review_track ?? request.reviewTrack ?? null,
    requestedReviewKind: request.review_kind ?? request.reviewKind ?? null });
  const cursorDiffBase = phaseReviewDiffBase(context, request);
  const scope=trustedReviewReadScope(context,request,typeof resolveReviewReadScope==='function' ? resolveReviewReadScope({task:context.task,workspace:context.workspace,stage:request.stage,phaseId:request.phase_id??null}) : reviewReadScope);
  const source = scope ? captureScopedReviewSource(context,request,scope,trusted.attachmentRoot,captureSource) : captureSource({ workspace: context.workspace, reviewDataRoot: trusted.attachmentRoot,
    includeDiff: true, taskId: context.task.identity.taskId,
    ...(cursorDiffBase === null ? {} : { baselineCommit: cursorDiffBase }) });
  try {
    const changedPaths = reviewScope === 'terminal' ? source.changedPaths : undefined;
    const compacted = compactVerifyCodeMaterials(request.materials, { changedPaths });
    const selectedSource = phaseReviewSourceProjection(context, request, source, trusted.attachmentRoot,scope);
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
      ...(changedPaths === undefined ? {} : { changed_paths: compacted.changed_paths, dropped_materials: compacted.dropped_materials }),
      materials: {
        ...(compacted.materials ?? {}),
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
        if (packet !== built) rmSync(packet.bundleRoot, { recursive: true, force: true });
        rmSync(built.bundleRoot, { recursive: true, force: true });
        disposed = true;
      },
    });
  } finally {
    source.dispose?.();
  }
}

export function writeManagedStallDiagnostic(event, { stderr = process.stderr, now = Date.now() } = {}) {
  const minutes = Math.max(0, Math.floor((now - event.unchanged_since_ms) / 60000));
  stderr.write("审查仍在运行，不是失败；已 " + minutes + " 分钟无新进展。可以继续等待，或按 Ctrl-C 停止等待并收场（已返回的发现会保留）。\n");
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

function readPlainInputFile(path,label,encoding="utf8") {
  const absolute=resolve(path);let cursor="/";
  for(const part of absolute.split("/").filter(Boolean)){cursor=join(cursor,part);const stat=lstatSync(cursor);if(stat.isSymbolicLink()||realpathSync(cursor)!==cursor)throw Object.assign(new Error(`${label} path alias`),{code:"TASK_PATH_ALIAS"});}
  const named=lstatSync(absolute);if(!named.isFile()||named.nlink!==1)throw Object.assign(new Error(`${label} must be a single-link regular file`),{code:"TASK_FILE_INVALID"});
  const fd=openSync(absolute,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);
  try{const st=fstatSync(fd);if(st.dev!==named.dev||st.ino!==named.ino||!st.isFile()||st.nlink!==1)throw Object.assign(new Error(`${label} changed`),{code:"TASK_FILE_CHANGED"});return readFileSync(fd,encoding);}finally{closeSync(fd);}
}

async function observeReviewMaterials(bundle, observer, signal) {
  if (typeof observer !== "function") throw new TypeError("review materials observer must be a function");
  const manifest = [], members = new Map();
  for (const entry of bundle.manifest ?? []) {
    const path = entry?.path;
    if (typeof path !== "string" || isAbsolute(path) || /[\\\0]/.test(path)
        || path.split("/").some(part => !part || part === "." || part === "..")
        || members.has(path) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0
        || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw Object.assign(new Error("review materials manifest is invalid or ambiguous"), { code: "MATERIAL_INCOMPLETE" });
    }
    const member = Object.freeze({ path, bytes: entry.bytes, sha256: entry.sha256 });
    members.set(path, member);
    manifest.push(member);
  }
  let active = true;
  const readMaterial = path => {
    if (!active) throw new Error("review materials observation has ended");
    const member = members.get(path);
    if (!member) throw new Error("review material is not a manifest member");
    const bytes = readPlainInputFile(join(bundle.bundleRoot, path), "review material", null);
    if (bytes.length !== member.bytes || sha256(bytes) !== member.sha256) {
      throw Object.assign(new Error("review material changed from its manifest"), { code: "MATERIAL_INCOMPLETE" });
    }
    return bytes;
  };
  const cancelled = () => Object.assign(new Error("review cancelled during material observation"), { code: "REVIEW_CANCELLED", dispatch_state: "blocked_before_dispatch" });
  let onAbort;
  try {
    if (signal?.aborted) throw cancelled();
    const aborted = signal ? new Promise((_, reject) => {
      onAbort = () => { active = false; reject(cancelled()); };
      signal.addEventListener("abort", onAbort, { once: true });
    }) : null;
    // This observer can read authenticated members only. Its return value never
    // supplies a review result or replaces the configured execution route. The
    // signal lets cooperative observers stop; revocation also bounds observers
    // that never settle. Late completion cannot reopen the reader or dispatch.
    const observing = Promise.resolve().then(() => {
      if (signal?.aborted) throw cancelled();
      return observer(Object.freeze({ materialId: bundle.materialId, manifest: Object.freeze(manifest), readMaterial }), Object.freeze({ signal }));
    });
    await (aborted ? Promise.race([observing, aborted]) : observing);
  } finally {
    active = false;
    if (onAbort) signal.removeEventListener("abort", onAbort);
  }
}

function resolveMaterialRefs(context, materials, reviewReadScope) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) return materials;
  return Object.fromEntries(Object.entries(materials).map(([key, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)
        || (!Object.hasOwn(value, "ref") && !Object.hasOwn(value, "sha256"))) return [key, value];
    try {
      if (Object.keys(value).sort().join("\0") !== "ref\0sha256"
          || typeof value.ref !== "string" || isAbsolute(value.ref)
          || value.ref.includes("\\") || value.ref.includes("\0")
          || value.ref.split("/").some(part => !part || part === "." || part === "..")
          || typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)) {
        throw new Error("material reference requires a relative ref and sha256");
      }
      const root = /^quality\/(?:tests|evidence)\//.test(value.ref)
        ? context.task.taskPath : context.workspace.worktreeRoot;
      if(reviewReadScope){
        if(root===context.task.taskPath&&!reviewReadScope.evidenceFiles.some(item=>item.ref===value.ref))throw new Error('material ref is outside approved evidence scope');
        if(root===context.workspace.worktreeRoot){
          const wh=reviewReadScope.repositories.find(repo=>repo.id==='wh');
          const granted=wh.paths.includes(value.ref)||reviewReadScope.authorizationSource.materialRefs.some(ref=>{
            if(typeof ref!=='string'||ref.includes('\\')||ref.includes('\0'))return false;
            const within=isAbsolute(ref)?relative(wh.sourceRoot,ref):ref;
            return within===value.ref;
          });
          if(!granted)throw new Error('material ref is outside approved workspace scope');
        }
        return [key,readScopedReviewMaterial({sourceRoot:root,ref:value.ref,sha256:value.sha256})];
      }
      const path = resolve(root, value.ref);
      const within = relative(resolve(root), path);
      if (!within || isAbsolute(within) || within.split(/[\\/]/).includes("..")) throw new Error("material reference escapes its root");
      // A private Node worker can bind each opened directory to its kernel cwd.
      // Absolute path checks alone cannot prevent parent-directory ABA races.
      const worker = `// CARD09_MATERIAL_CWD_READER
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const input = JSON.parse(fs.readFileSync(0, "utf8")), held = [];
const same = (a, b) => a.dev === b.dev && a.ino === b.ino;
const directoryFlags = fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW;
function verifyCwd(expected, fd) {
  const current = fs.statSync("."), opened = fs.fstatSync(fd);
  if (!current.isDirectory() || !opened.isDirectory() || !same(current, opened)
      || process.cwd() !== expected) throw new Error("material ancestor changed");
}
try {
  if (!Number.isInteger(fs.constants.O_DIRECTORY) || !Number.isInteger(fs.constants.O_NOFOLLOW)) throw new Error("directory binding unsupported");
  let expected = input.root, directory = 3;
  verifyCwd(expected, directory);
  const parts = input.ref.split("/"), leaf = parts.pop();
  for (const part of parts) {
    const next = fs.openSync(part, directoryFlags); held.push(next);
    process.chdir(part); expected = path.join(expected, part);
    verifyCwd(expected, next); directory = next;
  }
  verifyCwd(expected, directory);
  const fd = fs.openSync(leaf, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK); held.push(fd);
  const before = fs.fstatSync(fd);
  if (!before.isFile() || before.nlink !== 1) throw new Error("material must be a single-link regular file");
  const bytes = fs.readFileSync(fd), after = fs.fstatSync(fd);
  if (!after.isFile() || after.nlink !== 1 || !same(before, after)) throw new Error("material file changed");
  verifyCwd(expected, directory);
  if (createHash("sha256").update(bytes).digest("hex") !== input.sha256) throw new Error("material reference sha256 mismatch");
  if (!Buffer.from(bytes.toString("utf8"), "utf8").equals(bytes)) throw new Error("material must contain valid UTF-8");
  process.stdout.write(bytes);
} catch (error) { process.stderr.write(String(error.message)); process.exitCode = 2; }
finally { for (const fd of held.reverse()) fs.closeSync(fd); }
`;
      const named = lstatSync(root);
      if (!named.isDirectory() || named.isSymbolicLink() || realpathSync(root) !== root) throw new Error("material root alias");
      const rootFd = openSync(root, fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW);
      try {
        const opened = fstatSync(rootFd);
        if (!opened.isDirectory() || opened.dev !== named.dev || opened.ino !== named.ino) throw new Error("material root changed");
        const result = process.getBuiltinModule("node:child_process").spawnSync(process.execPath, ["--input-type=module", "-e", worker], {
          cwd: root, env: {}, input: JSON.stringify({ root, ref: value.ref, sha256: value.sha256 }),
          stdio: ["pipe", "pipe", "pipe", rootFd], maxBuffer: Infinity,
        });
        if (result.error) throw result.error;
        if (result.status !== 0 || result.signal) throw new Error(String(result.stderr || "material reader failed"));
        if (sha256(result.stdout) !== value.sha256) throw new Error("material reader output changed");
        return [key, result.stdout.toString("utf8")];
      } finally { closeSync(rootFd); }
    } catch (cause) {
      throw Object.assign(new Error(`material ${key}: ${cause.message}`, { cause }), { code: "TASK_FILE_INVALID" });
    }
  }));
}


export function phaseProgressTargetExists(cursor, materials) {
  if (!cursor || typeof cursor !== "object" || !materials || typeof materials !== "object") return false;
  const ref = phaseFilesFromIndex(materials["phases/index.md"]).find(path => path.match(/^phases\/(P[1-9][0-9]*)(?:-|\.md$)/)?.[1] === cursor.phase_id);
  if (!ref || typeof materials[ref] !== "string") return false;
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
      ...(cursor.base_head === undefined ? {} : { base_head: cursor.base_head }),
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

// Candidate ownership and invocation equality belong to the capture caller.
// The capture owner still validates bytes/path and publishes its receipt once.
function captureOutputSettlement(input, recordDir, slug) {
  let disposition = "deduplication: unknown (no eligible candidate)";
  const read = (path) => {
    if (typeof path !== "string" || resolve(path) !== path || dirname(path) !== recordDir) throw new Error("candidate outside current task tests");
    const named = lstatSync(path);
    if (!named.isFile() || named.isSymbolicLink() || named.nlink !== 1 || realpathSync(path) !== path) throw new Error("candidate is not a canonical single-link original");
    const fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    try {
      const before = fstatSync(fd);
      if (before.dev !== named.dev || before.ino !== named.ino) throw new Error("candidate replaced");
      const bytes = readFileSync(fd), after = fstatSync(fd), current = lstatSync(path);
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || current.dev !== after.dev || current.ino !== after.ino) throw new Error("candidate changed");
      return bytes;
    } finally { closeSync(fd); }
  };
  const resolveOutputRef = (observed) => {
    try {
      const taskRoot = dirname(dirname(recordDir));
      const ref = value => typeof value === "string" ? (isAbsolute(value) ? value : resolve(taskRoot, value)) : null;
      const explicitOutput = ref(input.output_ref);
      const receiptPath = ref(input.receipt_ref) ?? (explicitOutput?.endsWith(".output") ? explicitOutput.slice(0, -7) + ".json" : null);
      const prior = JSON.parse(read(receiptPath).toString("utf8"));
      const candidate = explicitOutput ?? ref(prior.output_ref);
      if (ref(prior.output_ref) !== candidate) throw new Error("candidate receipt/ref mismatch");
      const fields = ["argv", "cwd", "exit_code", "signal", "timed_out", "cancelled", "truncated", "error"];
      if (fields.some(key => JSON.stringify(prior[key]) !== JSON.stringify(observed[key])) || observed.timed_out || observed.cancelled || observed.error) throw new Error("different invocation outcome");
      const previousBytes = read(candidate), freshBytes = read(observed.output_ref);
      if (!previousBytes.equals(freshBytes)) throw new Error("bytes differ");
      disposition = `reused: ${candidate} (same bytes)`;
      return { output_ref: candidate, output_disposition: disposition };
    } catch (error) { disposition = `deduplication: unknown (${error.message})`; return { output_disposition: disposition }; }
  };
  return { resolveOutputRef };
}

async function recordBuildCodeCommandEvidence(context, receipt) {
  return withLock(context.task.taskPath, "workflowhub-build-code-row", async () => {
    const current = readTaskFacts(context.task.taskPath).find(row => row?.record_kind === "stage" && row.stage === "build-code");
    const prior = current ? Object.fromEntries([...STAGE_ROW_KEYS, "phase_progress"].filter(key => Object.hasOwn(current, key)).map(key => [key, current[key]])) : {};
    const evidence = [...(current?.evidence?.value ?? [])];
    if (Number.isInteger(receipt.exit_code)) {
      const signature = receipt.cancelled ? `cancelled: ${receipt.cancellation_reason ?? receipt.signal ?? "reason unavailable"}`
        : receipt.timed_out ? "timed out" : receipt.error ? `${receipt.error.code}: ${receipt.error.message}`
          : receipt.exit_code === 0 ? "exit 0; no failing assertion" : `exit ${receipt.exit_code}; output: ${receipt.output_ref}`;
      evidence.push({ command: JSON.stringify(receipt.argv), exit_code: receipt.exit_code,
        failure_signature: receipt.output_disposition && !signature.includes(receipt.output_disposition)
          ? `${signature}; ${receipt.output_disposition}` : signature });
    }
    await writeStageRow(context.task.taskPath, { ...prior, record_kind: "stage", task_id: context.identity.taskId, stage: "build-code",
      source: Number.isInteger(receipt.exit_code) ? `${current?.source ?? "command capture"}; receipt: ${receipt.receipt_ref}; output: ${receipt.output_ref}${receipt.output_disposition ? "; " + receipt.output_disposition : ""}`
        : `${current?.source ?? "command capture unavailable"}; receipt: ${receipt.receipt_ref}; output: ${receipt.output_ref}; ${receipt.error?.message ?? "no integer exit"}${receipt.output_disposition ? "; " + receipt.output_disposition : ""}`,
      evidence: evidence.length ? { value: evidence } : { value: null, reason: `no integer command exit; receipt: ${receipt.receipt_ref}` } });
  });
}

async function writeBuildCodePhaseProgressCursor(context, inputCursor) {
  return withLock(context.task.taskPath, "workflowhub-build-code-row", async () => {
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
    const currentRow = readTaskFacts(context.task.taskPath).find((row) =>
      row?.record_kind === "stage" && row.stage === "build-code") ?? null;
    const cursor = currentRow?.phase_progress;
    const samePhaseBase = cursor?.phase_id === inputCursor.phase_id && typeof cursor.base_head === "string" && GIT_OID.test(cursor.base_head)
      ? cursor.base_head : null;
    const baseHead = samePhaseBase ?? execFileSync("git", ["rev-parse", "--verify", "HEAD^{commit}"], {
      cwd: context.workspace.worktreeRoot, env: gitMetadataEnvironment(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (!GIT_OID.test(baseHead)) throw new TypeError("phase_progress requires a real Phase start Git commit");
    const phaseProgress = Object.freeze({
      phase_id: inputCursor.phase_id,
      task_id: inputCursor.task_id,
      phases_head: phasesHead,
      base_head: baseHead,
      recorded_at: new Date().toISOString(),
    });
    const files = Object.fromEntries(Object.entries(materials).map(([file, content]) => [file, Buffer.byteLength(content, "utf8")]));
    const materialBaseline = Object.keys(files).length ? { value: { total_bytes: Object.values(files).reduce((sum, bytes) => sum + bytes, 0), files } }
      : { value: null, reason: "no current post material sizes available" };
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
    const written = await writeStageRow(context.task.taskPath, { ...rowInput, material_bytes: materialBaseline });
    return Object.freeze({
      status: "recorded",
      stage: "build-code",
      phase_progress: phaseProgress,
      record_ref: written.ref,
      action: written.action,
    });
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

async function thinTaskContext(values, cwd, { readOnly = false } = {}) {
  const identity = resolveWorkflowHubIdentity(values, cwd);
  const context = await bootstrapStage(values.stage, { projectName: identity.project, taskId: identity.task, taskPath: identity.taskPath, readOnly });
  if (!context.workspace) throw Object.assign(new Error(context.workspace_unavailable?.message ?? "current task workspace is unavailable"), { code: context.workspace_unavailable?.code ?? "CURRENT_WORKTREE_UNAVAILABLE" });
  const target = gitWorktreeRoot(cwd);
  if (!target || target !== context.workspace.worktreeRoot) throw Object.assign(new Error("CURRENT_WORKTREE_MISMATCH: declared task workspace differs from cwd"), { code: "WRITE_IDENTITY_PREFLIGHT_FAILED" });
  const metadataGit = args => execFileSync("git", args, { cwd: target, env: gitMetadataEnvironment(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const head = metadataGit(["rev-parse", "--verify", "HEAD^{commit}"]);
  let baselineCommit = context.manifest.baseline_commit ?? null;
  if (baselineCommit !== null) {
    if (!GIT_OID.test(baselineCommit)) throw new TypeError("task baseline_commit must be a real Git commit");
    metadataGit(["cat-file", "-e", `${baselineCommit}^{commit}`]);
    metadataGit(["merge-base", "--is-ancestor", baselineCommit, head]);
  } else {
    const branches = metadataGit(["for-each-ref", "--format=%(refname)", "refs/heads/main"]);
    baselineCommit = branches ? metadataGit(["merge-base", head, "refs/heads/main"]) : head;
  }
  const workspace = Object.freeze({ ...context.workspace, baselineCommit });
  assertTaskWriteIdentity({ task: context.task, project: identity.project, taskId: identity.task, taskPath: identity.taskPath, workspace, cwd });
  const physical = await inspectWorkspace({ root: workspace.targetRepoRoot, target, baseline: baselineCommit });
  return Object.freeze({ ...context, workspace, physical });
}

function thinMaterials(context) {
  const materials = {};
  const read = (file) => {
    try { materials[file] = context.artifacts.read(file); }
    catch (error) { if (error.code === "ENOENT") materials[file] = null; else throw error; }
  };
  const cohort = context.manifest.activation_cohort ?? "pre";
  for (const file of cohort === "post" ? CURRENT_MATERIAL_FILES : ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) read(file);
  if (cohort === "post") for (const file of materialFilesForCohort(cohort, materials)) if (!(file in materials)) read(file);
  return materials;
}

// This reader projects independently produced ordinary facts. It never changes
// the canonical review, originals, cursor, or delivery authorization.
function terminalAssessmentQuality(context, row) {
  if (!row?.terminal_assessment_ref) return null;
  const gaps = [], coverage = [], refs = [];
  const requireFact = (condition, message) => { if (!condition) gaps.push(message); return condition; };
  const plain = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const reference = value => plain(value) && Object.keys(value).sort().join("\0") === "ref\0sha256"
    && typeof value.ref === "string" && /^quality\/(evidence|reviews|tests)\//.test(value.ref)
    && !value.ref.includes("\\") && !value.ref.split("/").some(p => !p || p === "." || p === "..") && /^[a-f0-9]{64}$/.test(value.sha256 ?? "");
  const read = (value,encoding="utf8") => {
    if (!reference(value)) throw new TypeError("invalid terminal evidence reference");
    const bytes = context.task.readRecordBytes(value.ref);
    if (sha256(bytes) !== value.sha256) throw new Error(`terminal evidence sha256 mismatch: ${value.ref}`);
    refs.push(value);return encoding===null?bytes:bytes.toString(encoding);
  };
  const json = value => JSON.parse(read(value));
  const sameReference=(a,b)=>reference(a)&&reference(b)&&a.ref===b.ref&&a.sha256===b.sha256;
  const identity = value => value?.task_id === context.identity.taskId && value?.stage === "build-code";
  const envelope = json(row.terminal_assessment_ref);
  requireFact(Object.keys(envelope).every(k=>["task_id","stage","raw_ref","reader"].includes(k)),"assessment provenance: conclusions must come only from independent raw");
  if(envelope.task_id!==context.identity.taskId||envelope.stage!=="build-code")throw new Error("assessment provenance differs from current task/stage identity");
  const rawVerdictBytes = envelope.raw_ref ? read(envelope.raw_ref,null) : null;
  const rawVerdict = rawVerdictBytes===null ? null : rawVerdictBytes.toString("utf8");
  const a = rawVerdict === null ? envelope : JSON.parse(rawVerdict);
  requireFact(rawVerdict !== null,"terminal reader: missing original independent verdict");
  if (!identity(a)) throw new Error("terminal assessment differs from current task/stage identity");
  const list = (value,label) => { if (!Array.isArray(value)) { gaps.push(`${label}: missing array`);return []; } return value; };
  const readRefs = (value,label) => {
    const values=list(value,label);requireFact(values.length>0,`${label}: no original evidence`);
    return values.map(ref=>{try{return {ref,raw:read(ref)};}catch(error){if(error.code==="ENOENT"){gaps.push(`${label}: missing ${ref?.ref}`);return {ref,raw:null};}throw error;}});
  };
  let terminalReaderBound=false,terminalReaderDispatch=null;
  const independent = (reader,label,proofRef=null,findingId=null,boundary=null) => {
    if (!plain(reader)||typeof reader.identity!=="string"||!reader.identity.trim()||!reader.source_ref) {gaps.push(`${label}: missing independently bound reader`);return false;}
    const readerBinding=json(reader.source_ref);
    const dispatch=readerBinding.dispatch ? json(readerBinding.dispatch) : readerBinding;
    const terminal=label === "terminal reader";if(terminal)terminalReaderDispatch=dispatch;
    const sameReader=!terminal&&reader.identity===envelope.reader?.identity;
    const roleMatches=terminal||boundary ? dispatch.role==="terminal-assessor" : dispatch.role==="finding-verifier" || dispatch.role==="terminal-assessor"&&sameReader;
    const ok=identity(dispatch)&&roleMatches&&dispatch.agent_thread_id===reader.identity
      &&dispatch.context_mode==="none"&&Array.isArray(dispatch.implementation_authors)&&dispatch.implementation_authors.length>0
      &&!dispatch.implementation_authors.includes(reader.identity);
    requireFact(ok,`${label}: task/role/thread/independent dispatch binding missing`);
    if(sameReader){
      const attested=terminalReaderBound&&(boundary ? boundary.result==="pass"&&(boundary.refs??[]).some(ref=>sameReference(ref,proofRef)) : (a.finding_verification_attestations??[]).some(v=>(v.finding_pointer??v.finding_id)===findingId&&sameReference(v.proof_ref,proofRef)));
      return requireFact(ok&&attested,`${label}: terminal raw lacks exact finding proof attestation`);
    }
    const completion=terminal?null:boundary ? (boundary.completion_ref?[{source_ref:boundary.completion_ref}]:[]) : (a.finding_verification_completions??[]).filter(v=>v.reader_identity===reader.identity&&sameReference(v.proof_ref,proofRef));
    if(!terminal&&!requireFact(completion.length===1,`${label}: missing unique public completion`))return false;
    const binding=terminal?readerBinding:json(completion[0].source_ref);
    if(!terminal&&!requireFact(sameReference(binding.dispatch,readerBinding.dispatch??reader.source_ref),`${label}: public completion dispatch differs`))return false;
    if(!binding.final||!binding.delivery){gaps.push(`${label}: incomplete public delivery binding`);return false;}
    const final=json(binding.final),delivery=json(binding.delivery);
    let outputMatches=false;
    if(typeof final.public_text==="string"){
      if(terminal)outputMatches=rawVerdictBytes!==null&&Buffer.from(final.public_text,"utf8").equals(rawVerdictBytes);
      else outputMatches=Buffer.from(final.public_text,"utf8").equals(read(proofRef,null));
      if(!outputMatches)try{const receipt=JSON.parse(final.public_text);outputMatches=identity(receipt)&&receipt.agent_thread_id===reader.identity&&sameReference(receipt.artifact_ref,terminal?envelope.raw_ref:proofRef);}catch{}
    }
    const completed=final.agent_thread_id===reader.identity&&delivery.agent_thread_id===reader.identity&&typeof final.public_text==="string"&&final.public_text===delivery.public_text&&outputMatches;
    return requireFact(ok&&completed,`${label}: public final/delivery mismatch`);
  };
  terminalReaderBound=independent(envelope.reader,"terminal reader");
  requireFact(a.result==="pass","terminal reader: no independent aggregate pass verdict");
  requireFact(Array.isArray(terminalReaderDispatch?.input_refs)&&terminalReaderDispatch.input_refs.some(ref=>sameReference(ref,a.final_report)),"terminal reader: actual dispatch did not include this report");
  let report=null;
  if(a.final_report){
    const text=read(a.final_report);let format="json";
    try{report=JSON.parse(text);}catch{
      format="md";
      const blocks=[...text.matchAll(/^ {0,3}(`{3,}|~{3,})json[ \t]*\r?\n([\s\S]*?)\r?\n\1[ \t]*$/gm)];
      if(blocks.length===1)try{report=JSON.parse(blocks[0][2]);}catch{}
    }
    requireFact(plain(report),"final report: requires one JSON object or one Markdown machine JSON segment");
    requireFact(format==="json"?a.final_report.ref.endsWith(".json"):/\.(md|markdown)$/.test(a.final_report.ref),"final report: extension differs from actual format");
    if(report!==null)requireFact(identity(report),"final report: wrong task/stage identity");
  }else gaps.push("final report: missing unique ref/hash");
  const materialFiles=materialFilesForCohort(context.manifest.activation_cohort??"pre",thinMaterials(context));
  const workspaceFile=(path)=>{
    if(typeof path!=="string"||isAbsolute(path)||path.includes("\\")||path.split("/").some(p=>!p||p==="."||p===".."))throw new TypeError("invalid terminal source path");
    const file=join(context.workspace.worktreeRoot,path);
    try{return readPlainInputFile(file,"terminal source",null);}catch(error){if(error.code==="ENOENT")return null;throw error;}
  };
  const git=args=>execFileSync("git",args,{cwd:context.workspace.worktreeRoot,env:gitMetadataEnvironment(),encoding:"utf8",stdio:["ignore","pipe","pipe"]});
  // Task creation may precede stage authorization and include other tasks'
  // history. Only a genuine earliest build-code authorization can narrow that
  // implementation boundary; later approvals never reset it.
  let implementationBase=context.workspace.baselineCommit;
  try{
    const directory=context.task.recordPath("quality/evidence/human-confirmations");
    let names;try{names=readdirSync(directory);}catch(error){if(error.code!=="ENOENT")throw error;names=[];}
    const authorizations=names.filter(name=>/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(name)).map(name=>JSON.parse(context.task.readRecord(`quality/evidence/human-confirmations/${name}`))).filter(value=>value?.stage==="build-code"&&["authorized","approve"].includes(value.decision));
    if(authorizations.length){
      if(authorizations.some(value=>typeof value.created_at!=="string"||!/^\d{4}-\d\d-\d\dT/.test(value.created_at)||!Number.isFinite(Date.parse(value.created_at))))throw Error("authorization creation time unavailable");
      authorizations.sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
      const first=authorizations[0],earliest=authorizations.filter(value=>Date.parse(value.created_at)===Date.parse(first.created_at)),materialRoot=join(context.workspace.worktreeRoot,"specs",context.identity.taskId);
      if(new Set(earliest.map(value=>value.head)).size!==1)throw Error("earliest authorization is ambiguous");
      if(earliest.some(value=>!plain(value)||typeof value.reply!=="string"||!value.reply.trim()||value.task_id!==undefined&&value.task_id!==context.identity.taskId||value.project_name!==undefined&&value.project_name!==context.manifest.project_name||!Array.isArray(value.material_refs)||!value.material_refs.includes(join(materialRoot,"spec.md"))||!value.material_refs.every(path=>typeof path==="string"&&isAbsolute(path)&&resolve(path)===path&&path.startsWith(materialRoot+"/"))))throw Error("authorization task materials differ");
      if(!/^[a-f0-9]{40,64}$/.test(first.head??"")||git(["rev-parse","--verify",`${first.head}^{commit}`]).trim()!==first.head)throw Error("authorization head is not a commit");
      git(["merge-base","--is-ancestor",context.workspace.baselineCommit,first.head]);git(["merge-base","--is-ancestor",first.head,"HEAD"]);
      implementationBase=first.head;
    }
  }catch(error){gaps.push(`implementation base: ${error.message}; retained task baseline`);}
  const deletedPaths=new Set(git(["diff","--name-only","-z","--diff-filter=D",implementationBase,"--"]).split("\0").filter(Boolean));
  const checkPaths=(values,label,expected=null)=>{
    const paths=list(values,label),seen=new Set();
    for(const entry of paths){
      if(!plain(entry)||typeof entry.path!=="string"||!(entry.deleted===true&&entry.sha256===null&&/^[a-f0-9]{64}$/.test(entry.base_sha256??"")||entry.deleted===undefined&&/^[a-f0-9]{64}$/.test(entry.sha256??"")))throw new TypeError(`invalid ${label} path/hash`);
      requireFact(!seen.has(entry.path),`${label}: duplicate ${entry.path}`);seen.add(entry.path);
      const raw=workspaceFile(entry.path);
      if(entry.deleted===true){
        const reallyDeleted=raw===null&&deletedPaths.has(entry.path);
        requireFact(reallyDeleted,`${label}: deletion does not match actual diff ${entry.path}`);
        if(reallyDeleted){const original=execFileSync("git",["show",`${implementationBase}:${entry.path}`],{cwd:context.workspace.worktreeRoot,env:gitMetadataEnvironment(),stdio:["ignore","pipe","pipe"]});requireFact(sha256(original)===entry.base_sha256,`${label}: deletion base bytes differ ${entry.path}`);}
      }else requireFact(raw!==null&&sha256(raw)===entry.sha256,`${label}: changed or missing ${entry.path}`);
    }
    if(expected)requireFact([...expected].sort().join("\0")===[...seen].sort().join("\0"),`${label}: current path denominator differs; missing=${[...expected].filter(p=>!seen.has(p)).join(",")}; extra=${[...seen].filter(p=>!expected.includes?.(p)&&!expected.has?.(p)).join(",")}`);
    return paths;
  };
  const materialPaths=materialFiles.map(p=>`specs/${context.identity.taskId}/${p}`);
  checkPaths(a.materials,"materials",materialPaths);
  const changed=new Set([...git(["diff","--name-only","-z",implementationBase,"--"]).split("\0"),...git(["ls-files","--others","--exclude-standard","-z"]).split("\0")].filter(Boolean));
  const implementationPaths=new Set([...changed].filter(p=>!materialPaths.includes(p)));
  checkPaths(a.implementation,"implementation",implementationPaths);
  const spec=context.artifacts.read("spec.md"),appendix=spec.split(/^##\s+Appendix A.*$/m)[1]??"";
  const acIds=[...new Set([...appendix.matchAll(/^\s*(?:-\s*(?:\[[ xX]\]\s*)?\*\*(AC-[A-Za-z0-9][A-Za-z0-9_-]*)\*\*|###\s+(AC-[A-Za-z0-9][A-Za-z0-9_-]*)\b|\|\s*`?(AC-[A-Za-z0-9][A-Za-z0-9_-]*)`?\s*\|)/gm)].map(m=>m[1]??m[2]??m[3]))];
  requireFact(acIds.length>0,"acceptance: current spec has no readable declared AC denominator");
  const results=new Set(["pass","fail","inconclusive","deferred","missing","inconsistent","incomplete","unavailable"]);
  if(plain(report)){
    checkPaths(report.materials,"final report materials",materialPaths);
    requireFact(Array.isArray(report.acceptance)&&report.acceptance.map(v=>v?.id).sort().join("\0")===[...acIds].sort().join("\0")&&report.acceptance.every(v=>results.has(v?.result)),"final report: AC denominator or typed result differs");
    requireFact(Array.isArray(report.six_conclusions)&&report.six_conclusions.length===6&&report.six_conclusions.every(v=>typeof v==="string"&&v.trim()),"final report: six human conclusions missing");
    const request=report.continuation_request;
    requireFact(plain(request)&&typeof request.requested==="boolean","final report: continuation request is not declared");
    if(request?.requested===true){if(reference(request.source_ref))read(request.source_ref);else gaps.push("final report: requested continuation has no actual user source");}
    else requireFact(request?.requested===false&&typeof request.reason==="string"&&request.reason.trim(),"final report: no-continuation reason missing");
    if(requireFact(/^[a-f0-9]{40,64}$/.test(report.head??""),"final report: invalid source HEAD")){
      try{
        requireFact(git(["rev-parse","--verify",`${report.head}^{commit}`]).trim()===report.head,"final report: HEAD is not a commit");
        git(["merge-base","--is-ancestor",implementationBase,report.head]);git(["merge-base","--is-ancestor",report.head,"HEAD"]);
        const treePaths=git(["diff","--name-only","-z",implementationBase,report.head,"--"]).split("\0").filter(p=>p&&!materialPaths.includes(p));
        requireFact([...treePaths].sort().join("\0")===[...implementationPaths].sort().join("\0"),"final report: HEAD tree source denominator differs");
        for(const entry of [...(a.implementation??[]),...(report.materials??[])]){
          const exists=git(["ls-tree","-z",report.head,"--",entry.path]).length>0;
          if(entry.deleted===true)requireFact(!exists,`final report: HEAD tree deletion differs ${entry.path}`);
          else if(requireFact(exists,`final report: HEAD tree lacks ${entry.path}`)){
            const bytes=execFileSync("git",["show",`${report.head}:${entry.path}`],{cwd:context.workspace.worktreeRoot,env:gitMetadataEnvironment(),stdio:["ignore","pipe","pipe"],maxBuffer:Math.max(1,workspaceFile(entry.path)?.length??0)});
            requireFact(sha256(bytes)===entry.sha256,`final report: HEAD tree bytes differ ${entry.path}`);
          }
        }
      }catch{gaps.push("final report: HEAD is foreign, unavailable or not bound to this task snapshot");}
    }
  }
  const sourceCurrent=gaps.length===0;
  const projectedAcceptance=[];
  const entries=list(a.acceptance,"acceptance");
  requireFact(entries.map(v=>v?.id).sort().join("\0")===[...acIds].sort().join("\0"),"acceptance: denominator missing, duplicated, or foreign AC");
  function originalVerdict(value,id){
    if(!plain(value))return null;
    if(value.task_id!==undefined&&value.task_id!==context.identity.taskId||value.stage!==undefined&&value.stage!=="build-code")return null;
    const identifiers=[value.id,value.acceptance_criterion_id,value.criterion_id,value.ac,value.ac_id].filter(v=>v!==undefined);
    if(typeof value.task==="string"&&value.task.split(/[^A-Za-z0-9_-]+/).some(v=>v.startsWith("AC-")))identifiers.push(value.task);
    const matches=v=>typeof v==="string"&&(v===id||v.split(/[^A-Za-z0-9_-]+/).includes(id));
    const found=[];
    if(identifiers.some(matches)){
      const verdicts=[value.result,value.conclusion,value.tier,value.independent_status].filter(v=>v!==undefined);
      if(identifiers.some(v=>!matches(v))||verdicts.some(v=>!results.has(v))||new Set(verdicts).size>1)return "inconsistent";
      if(verdicts.length)found.push(verdicts[0]);
    }
    for(const v of Object.values(value))for(const child of Array.isArray(v)?v:plain(v)?[v]:[]){const verdict=originalVerdict(child,id);if(verdict!==null)found.push(verdict);}
    if(found.length)return new Set(found).size===1?found[0]:"inconsistent";
    return null;
  }
  for(const entry of entries){
    const before=gaps.length;
    requireFact(results.has(entry?.result),`acceptance ${entry?.id}: invalid typed result`);
    requireFact(entries.filter(v=>v?.id===entry?.id).length===1,`acceptance ${entry?.id}: duplicated original`);
    requireFact(typeof entry?.current_applicability?.basis==="string"&&entry.current_applicability.basis.trim().length>0,`acceptance ${entry?.id}: current applicability not independently explained`);
    readRefs(entry?.current_applicability?.refs,`acceptance ${entry?.id} current applicability`);
    const sources=readRefs(entry?.refs,`acceptance ${entry?.id}`);
    const verdicts=[];
    for(const {ref,raw} of sources){
      if(!requireFact(ref.ref!==a.final_report?.ref&&ref.sha256!==a.final_report?.sha256,`acceptance ${entry.id}: final report cannot be its own upstream verdict`))continue;
      if(raw!==null)try{const verdict=originalVerdict(JSON.parse(raw),entry.id);if(verdict!==null)verdicts.push(verdict);}catch{}
    }
    const conflicting=verdicts.includes("inconsistent")||new Set(verdicts).size>1;
    requireFact(!conflicting,`acceptance ${entry.id}: inconsistent applicable original verdicts`);
    requireFact(verdicts.length>0&&verdicts.every(v=>v===entry.result),`acceptance ${entry.id}: no agreed original typed criterion verdict`);
    if(acIds.includes(entry?.id))projectedAcceptance.push({id:entry.id,result:conflicting?"inconsistent":sourceCurrent&&gaps.length===before?entry.result:"incomplete",refs:entry.refs??[],current_applicability:entry.current_applicability??null});
    if(entry?.result!=="pass")gaps.push(`acceptance ${entry?.id}: ${entry?.result??"unknown"}`);
  }
  for(const id of acIds)if(!projectedAcceptance.some(v=>v.id===id))projectedAcceptance.push({id,result:"missing",refs:[],current_applicability:null});
  for(const dimension of ["business_effect","semantic_test_adequacy"]){
    const facet=a[dimension];requireFact(facet?.result==="pass",`${dimension}: not pass`);readRefs(facet?.refs,dimension);
    requireFact(Array.isArray(facet?.coverage_limits),`${dimension}: coverage unknown`);coverage.push(...(facet?.coverage_limits??[]));
    requireFact(Array.isArray(facet?.covered_ac_ids)&&[...facet.covered_ac_ids].sort().join("\0")===[...acIds].sort().join("\0"),`${dimension}: declared AC scope differs`);
    const proofs=list(facet?.proofs,`${dimension} execution proofs`);
    requireFact(proofs.length>0,`${dimension}: no native execution/source proof`);
    for(const proof of proofs){
      if(!proof?.receipt||!proof?.output){gaps.push(`${dimension}: missing receipt/output pair`);continue;}
      const receipt=json(proof.receipt),output=read(proof.output);
      requireFact(receipt.cwd===context.workspace.worktreeRoot&&Array.isArray(receipt.argv)&&receipt.argv.length>0&&receipt.exit_code===0&&!receipt.signal&&!receipt.timed_out&&!receipt.cancelled&&!receipt.truncated&&Number.isFinite(Date.parse(receipt.started_at))&&Number.isFinite(Date.parse(receipt.ended_at)),`${dimension}: not an intact successful native command receipt`);
      const outputPath=typeof receipt.output_ref==="string"?(isAbsolute(receipt.output_ref)?receipt.output_ref:join(context.task.taskPath,receipt.output_ref)):null;
      requireFact(outputPath===join(context.task.taskPath,proof.output.ref)&&output.length>0,`${dimension}: receipt does not bind actual output original`);
      const inputs=checkPaths(proof.inputs,`${dimension} execution inputs`);requireFact(inputs.length>0,`${dimension}: missing source/input binding`);
      if(dimension==="semantic_test_adequacy"){
        const tests=checkPaths(proof.test_sources,`${dimension} assertion sources`);
        requireFact(tests.length>0&&tests.every(test=>(receipt.argv??[]).some(arg=>typeof arg==="string"&&(arg===test.path||resolve(receipt.cwd??"/",arg)===join(context.workspace.worktreeRoot,test.path)))),`${dimension}: actual command does not consume declared assertion sources`);
      }
    }
  }
  let review=null;
  if(a.review)review=json(a.review);else gaps.push("terminal review: missing original");
  if(review){
    requireFact(a.review.ref.startsWith("quality/reviews/")&&review.version==="wh-review-result.v1"&&review.authoritative===false,"terminal review: not the saved canonical producer artifact");
    requireFact(identity(review)&&review.review_scope==="terminal","terminal review: wrong identity or scope");
    const currentReview=typeof row.review_result_ref==="string"?row.review_result_ref:row.review_result_ref?.value;
    requireFact(row.review_origin==="conducted"&&currentReview===a.review.ref,"terminal review: current published review differs from assessed original");
    const providers=list(review.provider_results,"providers");
    requireFact(providers.some(p=>p.status==="completed"&&(p.parse_outcome??p.execution?.parse_outcome)==="ok"),"providers: no completed parsed source");
    for(const p of providers){
      const originalRefs=[p.raw_ref,p.raw_output_ref,p.raw_response_ref,p.output_ref,...(p.evidence_refs??[])].filter(value=>value!==undefined&&value!==null);
      requireFact(originalRefs.length>0,`provider ${p.provider??p.id}: missing raw original`);
      for(const raw of originalRefs){
        if(reference(raw)){read(raw);continue;}
        if(typeof raw!=="string"){gaps.push(`provider ${p.provider??p.id}: unbound raw original`);continue;}
        const relativeRef=isAbsolute(raw)?relative(context.task.taskPath,raw).split("\\").join("/"):raw;
        const bound=(a.provider_raw_refs??[]).find(value=>reference(value)&&value.ref===relativeRef);
        if(bound){read(bound);continue;}
        // Old canonical records own path-only raw refs. The fresh independent
        // verdict must bind their actual bytes; presence alone is insufficient.
        try{context.task.readRecordBytes(relativeRef);}catch(error){if(error.code==="ENOENT")gaps.push(`provider ${p.provider??p.id}: missing raw`);else throw error;}
        gaps.push(`provider ${p.provider??p.id}: raw sha256 not independently bound ${relativeRef}`);
      }
      if(p.status!=="completed"||(p.parse_outcome??p.execution?.parse_outcome)!=="ok")coverage.push(`provider ${p.provider??p.id}: ${p.status??"unknown"}`);
    }
    const findings=list(review.findings,"review findings");
    const reviewGaps=[];
    if(review.conclusion!=="needs_revision"&&review.conclusion!=="pass"&&!(review.conclusion==="reject"&&findings.length>0))reviewGaps.push(`review:${review.conclusion??"unknown"}`);
    for(const member of Array.isArray(review.material_coverage)?review.material_coverage:[])for(const item of [...(member.unread??[]),...(member.undetermined??[])])reviewGaps.push(`coverage:${member.provider}:${item}`);
    for(const provider of providers)if(provider.status!=="completed"||(provider.parse_outcome??provider.execution?.parse_outcome)!=="ok")reviewGaps.push(`provider:${provider.provider??provider.id}`);
    if(reviewGaps.length){
      const closure=a.review_coverage_closure;
      const expected=[...new Set(reviewGaps)].sort();
      const covered=Array.isArray(closure?.covered_gaps)?[...closure.covered_gaps].sort():[];
      const receipts=[...(a.business_effect?.proofs??[]),...(a.semantic_test_adequacy?.proofs??[])].map(v=>v.receipt);
      const closureRefs=readRefs(closure?.refs,"review coverage closure");
      requireFact(closure?.result==="pass"&&sameReference(closure?.review_ref,a.review)&&typeof closure?.basis==="string"&&closure.basis.trim().length>0&&JSON.stringify(expected)===JSON.stringify(covered)&&receipts.length>=2&&receipts.every(ref=>closureRefs.some(v=>sameReference(v.ref,ref)))&&closureRefs.every(v=>receipts.some(ref=>sameReference(v.ref,ref))),"terminal review: unconfirmed coverage lacks independent current scope closure");
    }
    const dispositions=list(a.finding_dispositions,"finding dispositions");
    requireFact(dispositions.length===findings.length,"findings: disposition denominator differs");
    const sourceRef=review.source_ref??a.review_source_ref;
    let reviewedSource=null,sourceBound=false;
    if(sourceRef){
      try{
        const bytes=read(sourceRef,null),manifest=review.ocr?.manifest,entry=Array.isArray(manifest)?manifest.filter(v=>v.path==="source.json"):[];
        reviewedSource=JSON.parse(bytes);
        const subject=review.request?.subject;
        const sourceIdentity=plain(reviewedSource)&&/^[a-f0-9]{40,64}$/.test(reviewedSource.captured_head??"")&&/^[a-f0-9]{40,64}$/.test(reviewedSource.baseline_commit??"")&&(!Object.hasOwn(reviewedSource,"repositories")||Array.isArray(reviewedSource.repositories));
        // source.json is the canonical packet DTO. Some callers also supply a
        // subject; when present its claims must agree, never override the DTO.
        // Legacy direct paths omit repositories; repos/ paths still require
        // their original repository mapping below.
        // Subject is ordinary producer provenance: only its explicit identity
        // claims constrain the independently authenticated source DTO.
        const subjectMatches=subject===undefined||plain(subject)
          &&[["head",reviewedSource.captured_head],["head_commit",reviewedSource.captured_head],["base",reviewedSource.baseline_commit],["base_commit",reviewedSource.baseline_commit]].every(([key,expected])=>!Object.hasOwn(subject,key)||subject[key]===expected)
          &&(!Object.hasOwn(subject,"changed_files")||Array.isArray(subject.changed_files)&&subject.changed_files.every(file=>typeof file==="string"));
        sourceBound=requireFact(entry.length===1&&entry[0].bytes===bytes.length&&entry[0].sha256===sha256(bytes)&&deliveredMaterialId(manifest)===review.request?.material_id&&sourceIdentity&&subjectMatches,"terminal review: original source packet identity differs");
        if(sourceBound){git(["cat-file","-e",`${reviewedSource.captured_head}^{commit}`]);git(["cat-file","-e",`${reviewedSource.baseline_commit}^{commit}`]);git(["merge-base","--is-ancestor",reviewedSource.baseline_commit,reviewedSource.captured_head]);git(["merge-base","--is-ancestor",reviewedSource.captured_head,"HEAD"]);}
        if(review.source_ref&&a.review_source_ref)requireFact(sameReference(review.source_ref,a.review_source_ref),"terminal review: raw source override differs from canonical");
      }catch(error){sourceBound=false;gaps.push(`terminal review: source binding unavailable: ${error.message}`);}
    }
    const originalSnapshot=f=>Object.fromEntries(["provider","path","line","issue"].map(k=>[k,f[k]??null]));
    const locatorMatches=(value,f,index)=>{
      const explicit=f.finding_id??f.id,pointer=`/findings/${index}`;
      if(value.finding_pointer!==undefined)return value.finding_pointer===pointer&&plain(value.original_finding)&&Object.keys(value.original_finding).sort().join("\0")==="issue\0line\0path\0provider"&&Object.entries(originalSnapshot(f)).every(([key,item])=>value.original_finding[key]===item)&&(value.finding_id===undefined||value.finding_id===explicit);
      return typeof explicit==="string"&&value.finding_id===explicit;
    };
    const originalPath=path=>{
      if(!path.startsWith("repos/"))return path;
      if(!sourceBound)return null;
      const repos=(reviewedSource.repositories??[]).filter(repo=>repo.id==="wh"&&path.startsWith(`repos/${repo.id}/`)&&repo.captured_head===reviewedSource.captured_head&&repo.baseline_commit===reviewedSource.baseline_commit&&repo.selected_paths?.includes(path)&&repo.changed_paths?.includes(path));
      const file=path.slice("repos/wh/".length);
      const entries=(review.ocr?.manifest??[]).filter(v=>v.path===path);
      return repos.length===1&&entries.length===1&&(!Object.hasOwn(review.request?.subject??{},"changed_files")||review.request.subject.changed_files.includes(file))&&implementationPaths.has(file)?file:null;
    };
    for(const [index,f] of findings.entries()){
      const id=f.finding_id??f.id??`/findings/${index}`,ds=dispositions.filter(d=>locatorMatches(d,f,index));
      if(!requireFact(typeof id==="string"&&ds.length===1,`finding ${id}: missing unique disposition`))continue;
      const d=ds[0];requireFact(sameReference(d.original_review_ref,a.review),`finding ${id}: original review mismatch`);
      const rejected=d.status==="rejected_invalid";
      requireFact(d.status==="fixed"||rejected,`finding ${id}: unresolved; risk acceptance not inferred`);
      if(!rejected)readRefs(d.fix_refs,`finding ${id} fix`);
      const verifications=readRefs(d.verification_refs,`finding ${id} independent verification`);
      const paths=list(d.affected_paths,`finding ${id} affected paths`);
      const originalPaths=Array.isArray(f.affected_paths)?f.affected_paths:typeof f.file==="string"?[f.file]:typeof f.path==="string"?[f.path]:typeof f.location?.path==="string"?[f.location.path]:[];
      requireFact(originalPaths.length>0&&originalPaths.every(p=>paths.includes(originalPath(p)))&&(rejected||paths.every(p=>implementationPaths.has(p))),`finding ${id}: affected scope missing/foreign or differs from original finding`);
      requireFact(verifications.some(({raw,ref})=>{if(raw===null)return false;let proof;try{proof=JSON.parse(raw);}catch{return false;}
        if(!identity(proof)||!locatorMatches(proof,f,index)||proof.result!=="pass"||!sameReference(proof.original_review_ref,a.review)||!independent(proof.reader,`finding ${id} verifier`,ref,id))return false;
        if(rejected&&!requireFact(proof.disposition==="rejected_invalid"&&typeof proof.reason==="string"&&proof.reason.trim().length>0,`finding ${id}: invalidity not independently explained`))return false;
        readRefs(proof.refs,`finding ${id} proof execution`);checkPaths(proof.implementation,`finding ${id} proof`,paths);return true;
      }),`finding ${id}: no bound independent current-byte verification`);
      requireFact(Array.isArray(d.coverage_limits),`finding ${id}: coverage unknown`);coverage.push(...(d.coverage_limits??[]));
    }
    for(const member of Array.isArray(review.material_coverage)?review.material_coverage:[])coverage.push(...(member.unread??[]),...(member.undetermined??[]));
  }
  for(const id of ["AC-BOUND-001","AC-BOUND-002"]){
    const b=a.boundary_checks?.[id];
    if(!acIds.includes(id))continue;
    requireFact(b?.result==="pass",`${id}: no independent final boundary check`);
    const proofs=readRefs(b?.refs,id);
    requireFact(proofs.some(({raw,ref})=>{if(!raw)return false;try{const v=JSON.parse(raw);if(originalVerdict(v,id)!=="pass")return false;
      if(id==="AC-BOUND-001")return true;
      if(!identity(v)||!sameReference(v.final_report,a.final_report)||!independent(v.reader,"post-report reader",ref,id,b))return false;
      const readerBinding=json(v.reader.source_ref),dispatch=readerBinding.dispatch?json(readerBinding.dispatch):readerBinding;
      const inputs=Array.isArray(dispatch.input_refs)?dispatch.input_refs:[];
      if(!requireFact(inputs.some(value=>sameReference(value,a.final_report)),`${id}: actual dispatch did not include this report`))return false;
      const request=report?.continuation_request;
      if(request?.requested===true){
        if(!requireFact(reference(v.continuation)&&sameReference(v.continuation_request_source,request.source_ref),`${id}: requested continuation or user source missing`))return false;
        read(v.continuation);
        if(!requireFact(inputs.some(value=>sameReference(value,v.continuation))&&inputs.some(value=>sameReference(value,request.source_ref)),`${id}: actual dispatch did not include requested continuation/source`))return false;
      }
      return request?.requested===true||request?.requested===false;
    }catch{return false;}}),`${id}: actual post-report independent readback not established`);
  }
  return {status:gaps.length?"incomplete":"pass",terminal_assessment_ref:row.terminal_assessment_ref,
    acceptance:projectedAcceptance,acceptance_denominator:acIds,final_report:a.final_report??null,review_conclusion:review?.conclusion??null,review_result_ref:a.review??null,
    coverage_limits:[...new Set(coverage)],gaps,evidence_refs:refs};
}

async function writeTerminalAssessmentReference(context, reference) {
  return withLock(context.task.taskPath,"workflowhub-build-code-row",async()=>{
    if(!reference||Object.keys(reference).sort().join("\0")!=="ref\0sha256"||typeof reference.ref!=="string"||!reference.ref.startsWith("quality/evidence/")||reference.ref.includes("\\")||reference.ref.split("/").some(p=>!p||p==="."||p==="..")||!/^[a-f0-9]{64}$/.test(reference.sha256??""))throw new TypeError("terminal_assessment_ref must contain a safe evidence ref and sha256");
    const raw=context.task.readRecordBytes(reference.ref);
    if(sha256(raw)!==reference.sha256)throw new Error("terminal_assessment_ref sha256 mismatch");
    const original=JSON.parse(raw.toString("utf8"));
    if(original.task_id!==context.identity.taskId||original.stage!=="build-code")throw new Error("terminal assessment differs from current task/stage identity");
    const old=readTaskFacts(context.task.taskPath).find(r=>r.record_kind==="stage"&&r.stage==="build-code");
    const fields=old?Object.fromEntries([...STAGE_ROW_KEYS,"phase_progress"].filter(k=>Object.hasOwn(old,k)).map(k=>[k,old[k]])):{stage:"build-code",source:"terminal-assessment-reference"};
    const saved=await writeStageRow(context.task.taskPath,{...fields,terminal_assessment_ref:reference});
    return {status:"recorded",task_id:context.identity.taskId,stage:"build-code",terminal_assessment_ref:reference,ref:saved.ref,authoritative:false};
  });
}

function thinQuality(context, row) {
  if (!row || row.review_origin === "not_run") return "unknown";
  if (row.review_origin === "unavailable") return "unavailable";
  const ref = typeof row.review_result_ref === "string" ? row.review_result_ref : row.review_result_ref?.value;
  if (typeof ref !== "string" || !ref.startsWith("quality/reviews/") || isAbsolute(ref) || ref.split(/[\\/]/).some(part => part === ".." || part === "")) return "unknown";
  let result;
  try { result = JSON.parse(readPlainInputFile(join(context.task.taskPath, ref), "review result")); }
  catch (error) { if (error.code === "ENOENT") return "unknown"; throw error; }
  const lightImplementation = row.stage === "make-decision" && result.stage === "build-code"
    && result.review_scope === "phase" && result.subject_kind === "phase"
    && result.review_kind === null && result.phase_id === null;
  if (result.task_id !== context.identity.taskId || result.stage !== row.stage && !lightImplementation) throw new Error("review result differs from current row identity");
  if (result.status === "unavailable") return "unavailable";
  // A review is one quality fact; it cannot certify stage completion.
  return ["available", "available-with-failures", "incomplete"].includes(result.status) ? "incomplete" : "unknown";
}

function requireOptions(values, names, operation) {
  const allowed = new Set(names);
  const unknown = Object.keys(values).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(`${operation} has unknown options: ${unknown.join(", ")}`);
}

async function recordTaskReview(context, input, values, services = {}) {
    if(!input || typeof input!=="object" || Array.isArray(input) || !input.request || input.result!==undefined) throw new TypeError("review --action=record requires a request; importing caller-authored results is retired");
    const original=input.request;
    if(original.stage!==undefined && original.stage!==values.stage) throw new TypeError("review request stage differs from CLI stage");
    const request={...original,stage:values.stage,activation_cohort:context.manifest.activation_cohort ?? "pre"};
    const isPhase=values.stage==="build-code" && (request.review_kind ?? request.reviewKind ?? null)===null && (request.review_scope ?? request.reviewScope ?? "phase") === "phase";
    if(isPhase) {
      request.review_scope=request.review_scope ?? request.reviewScope ?? "phase";
      request.phase_id=request.phase_id ?? request.phaseId ?? values["phase-id"] ?? null;
      request.subject_kind=request.subject_kind ?? "phase";
    }
    const reviewReadScope=trustedReviewReadScope(context,request,typeof services.resolveReviewReadScope==='function' ? services.resolveReviewReadScope({task:context.task,workspace:context.workspace,stage:request.stage,phaseId:request.phase_id??null}) : undefined);
    request.materials = resolveMaterialRefs(context, request.materials,reviewReadScope);
    const codeSurface=request.stage === STAGE.BUILD_CODE
      && (request.review_kind ?? request.reviewKind ?? null)===null && request.surface!=="document";
    if(codeSurface)request.surface="code";
    // Reader-only storage-root adaptation: the authenticated workspace is never mutated or published as this root.
    // Reuses P1's unchanged stable reader; only this task's ordinary review JSON is admitted.
    const readSupplementRecord=({record_ref,record_sha256})=>{
      if(typeof record_ref!=="string"||!/^quality\/reviews\/[^/\\]+\.json$/.test(record_ref)||record_ref.includes(".."))throw Object.assign(new Error("supplement ref must name this task's ordinary review JSON"),{code:"TASK_FILE_INVALID"});
      const storageContext={task:context.task,workspace:{worktreeRoot:context.task.taskPath}};
      return Buffer.from(resolveMaterialRefs(storageContext,{record:{ref:record_ref,sha256:record_sha256}}).record,"utf8");
    };
    const runner=async (current,options)=>{
      const whReview=typeof services.runReviewRound==="function" ? services.runReviewRound : runSimpleReview;
      if(!codeSurface)return whReview(current,{...options,readSupplementRecord,onManagedStall:services.onManagedStall ?? writeManagedStallDiagnostic});
      const materialPreflight=validateReviewCallerMaterials(current);
      if(materialPreflight)return {...materialPreflight,executor:"ocr"};
      const detection=detectOcr();
      if(detection.status==="unavailable")return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:detection.error?.code ?? "OCR_DETECTION_UNAVAILABLE",message:detection.reason,detected_by:detection.detected_by}};
      if(detection.status==="not_installed")return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:"OCR_NOT_INSTALLED",message:detection.reason,detected_by:detection.detected_by}};
      const onProviderHealth=services.onOcrProviderHealth ?? writeOcrProviderHealthDiagnostic;
      if(typeof onProviderHealth!=="function")throw new TypeError("OCR health observer must be a function");
      const ocrRunner=services.runOcrDelegationRound;
      let bundle,sourceMetadata=null;
      const retainSource=result=>sourceMetadata?{...result,...sourceMetadata,ocr:{...result.ocr,...sourceMetadata.ocr}}:result;
      try {
        try{bundle=prepareTaskBoundBuildCodeReviewBundle(context,current,{reviewReadScope});}catch(error){return retainSource({status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code??"ROUTE_UNAVAILABLE",message:redactProviderHostPaths(String(error.message)),diagnostic:{field:"materials/route",expected:"current task-bound materials and trusted route",actual:"invalid",next_action:"repair the reported input or route before dispatch"}}});}
        const sourceBytes=readPlainInputFile(join(bundle.bundleRoot,"source.json"),"review source",null),sourceEntries=(bundle.manifest??bundle.deliveryManifest).filter(v=>v.path==="source.json");
        if(sourceEntries.length!==1||sourceEntries[0].bytes!==sourceBytes.length||sourceEntries[0].sha256!==sha256(sourceBytes))throw new Error("review source bytes differ from packet manifest");
        const digest=sha256(sourceBytes),reviewsDir=join(context.task.taskPath,"quality/reviews");let sourceRef=null;
        for(const name of existsSync(reviewsDir)?readdirSync(reviewsDir):[]){
          if(!name.endsWith(".json"))continue;
          const prior=JSON.parse(context.task.readRecordBytes(`quality/reviews/${name}`).toString("utf8"));
          if(prior.task_id!==context.identity.taskId||prior.source_ref?.sha256!==digest)continue;
          const priorBytes=context.task.readRecordBytes(prior.source_ref.ref);
          if(priorBytes.equals(sourceBytes)){sourceRef=prior.source_ref;break;}
        }
        if(!sourceRef){const path=await context.task.appendRecord({dir:"quality/evidence",slug:"review-source",ext:"json",bytes:sourceBytes});sourceRef={ref:relative(context.task.taskPath,path).split("\\").join("/"),sha256:digest};}
        sourceMetadata={source_ref:sourceRef,material_id:bundle.materialId,ocr:{manifest:bundle.manifest??bundle.deliveryManifest}};
        if (services.onReviewMaterials !== undefined) {
          await observeReviewMaterials(bundle, services.onReviewMaterials, options.signal);
          if (options.signal?.aborted) throw Object.assign(new Error("review cancelled after material observation"), { code: "REVIEW_CANCELLED", dispatch_state: "blocked_before_dispatch" });
        }
        let trustedContext;
        try{trustedContext=prepareConfiguredOcrHostContext(current);}catch(error){
          return retainSource({status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code??"ROUTE_UNAVAILABLE",message:redactProviderHostPaths(String(error.message)),diagnostic:{field:"route/provider_selection",expected:"one current trusted code route and valid provider configuration",actual:"invalid",next_action:"repair current route/configuration before dispatch"}}});
        }
        let subset;
        try{subset=await validateReviewSupplement(current,{providers:trustedContext.selection.providers,materialId:bundle.materialId,taskId:context.task.identity.taskId,readRecord:readSupplementRecord});}
        catch(error){return retainSource({status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code,message:error.message,diagnostic:error.diagnostic}});}
        if(current.only_providers!==undefined){
          const selected=new Set(subset),original=trustedContext.selection,filterMap=map=>map?Object.fromEntries(Object.entries(map).filter(([key])=>selected.has(key))):map;
          // Only selection is narrowed. Preserve the full trusted configuration SHA and route identity drift checks.
          trustedContext={...trustedContext,selection:{...original,providers:subset,eligibleProfiles:original.eligibleProfiles.filter(p=>selected.has(p)),requestedProfiles:original.requestedProfiles.filter(p=>selected.has(p)),requestedProfileSpecs:original.requestedProfileSpecs.filter(p=>selected.has(typeof p==="string"?p:p.provider??p.id)),provider_identities:filterMap(original.provider_identities),provider_models:filterMap(original.provider_models)}};
        }
        if(typeof ocrRunner==="function")return retainSource({...await ocrRunner(current,{...options,onProviderHealth,bundle,trustedContext}),executor:"ocr"});
        const result=await runOcrDelegationRound(current,{buildBundle:()=>bundle,signal:options.signal,
          onProviderResult: async ({ result: providerResult }) => {
            // The host has already persisted each original stream before settling.
            // Reuse its references; the projected result contains no raw bytes.
            return providerResult?.raw_output_ref ?? providerResult?.evidence_refs?.[0] ?? null;
          },
          executor:params=>runConfiguredOcrHostReview(params,{trustedContext,sourceBundle:bundle,onProviderHealth,
            onProviderResult:params.onProviderResult,
            rawOutputSink:async (hint,bytes,metadata={})=>options.onProviderOutput({provider:metadata.provider ?? "ocr",role:null,channel:metadata.stream ?? "raw-output",output:bytes})})});
        return retainSource({...result,executor:"ocr"});
      } catch(error){if(sourceMetadata)Object.assign(error,sourceMetadata);throw error;} finally {bundle?.dispose();}
    };
    const saved=await recordSimpleReviewRequest({taskDir:context.task.taskPath,request,runRound:runner,signal:services.reviewSignal ?? null});
    if(typeof saved.result_ref!=="string"||!/^quality\/reviews\/[^/\\]+\.json$/.test(saved.result_ref))throw new Error("saved review artifact reference is invalid");
    const bytes=context.task.readRecordBytes(saved.result_ref),artifact=JSON.parse(bytes.toString("utf8")),digest=sha256(bytes);
    const expected={stage:values.stage,review_track:request.review_track??request.reviewTrack??null,review_kind:request.review_kind??request.reviewKind??null,review_scope:request.review_scope??request.reviewScope??null,phase_id:request.phase_id??request.phaseId??null,subject_kind:request.subject_kind??((request.review_scope??request.reviewScope)==="terminal"?"worktree":(request.review_scope??request.reviewScope)==="phase"?"phase":"document")};
    if(artifact.task_id!==context.identity.taskId||artifact.authoritative!==false||Object.entries(expected).some(([key,value])=>artifact[key]!==value)||!Array.isArray(artifact.provider_results)||!Array.isArray(artifact.findings))throw new Error("saved review artifact differs from authenticated task subject");
    await withLock(context.task.taskPath,`workflowhub-${values.stage}-row`,async()=>{
      if(sha256(context.task.readRecordBytes(saved.result_ref))!==digest)throw new Error("saved review artifact changed before publication");
      const old=readTaskFacts(context.task.taskPath).find(row=>row.record_kind==="stage"&&row.stage===values.stage);
      const fields=old?Object.fromEntries([...STAGE_ROW_KEYS,"phase_progress"].filter(key=>Object.hasOwn(old,key)).map(key=>[key,old[key]])):{stage:values.stage,source:"review-record"};
      await writeStageRow(context.task.taskPath,{...fields,review_origin:"conducted",review_result_ref:saved.result_ref});
      const row=readTaskFacts(context.task.taskPath).find(row=>row.record_kind==="stage"&&row.stage===values.stage);
      if(row?.review_result_ref!==saved.result_ref)throw new Error("saved review publication readback differs");
    });
    return saved;
}


export async function stageRuntimeMain(argv = process.argv.slice(2), { services = {}, cwd = process.cwd() } = {}) {
  const { command, values } = parseArgs(argv);
  if (!WORKFLOW_STAGES.includes(values.stage)) throw new TypeError("a current workflow --stage is required");
  const common = ["stage", "project", "task", "task-path"];
  const options = {
    doctor: common, status: [...common, "reason"], artifact: [...common, "name", "input"],
    "capture-tests": [...common, "input"], confirm: [...common, "input", "decision", "reply-text", "material-ref"],
    "authorize-operation": [...common, "operation", "subject-ref"], "review-record": [...common, "input"], run: [...common, "input"],
  };
  requireOptions(values, options[command] ?? [], command);
  if (["artifact", "capture-tests", "review-record", "run"].includes(command) && !values.input
      && !(command === "run" && values.stage === PORTABLE_WORKFLOW_STAGE)) throw new TypeError(`${command} requires --input`);
  let context = await thinTaskContext(values, cwd, { readOnly: command === "doctor" || command === "status" });
  const input = values.input === undefined || command === "artifact" ? undefined : readTaskBoundInput(context, values.input);
  if (command === "doctor") return {
    stage: values.stage, task_id: context.task.identity.taskId, worktree_root: context.workspace.worktreeRoot,
    baseline_commit: context.workspace.baselineCommit, workspace: context.physical,
    storage: doctorStorage(context), materials: thinMaterials(context), ocr: detectOcr(), target_workspace: context.targetStatus,
    ...(values.stage === PORTABLE_WORKFLOW_STAGE ? { portable_workflow: projectPortableWorkflowStatus({ task: context.task }) } : {}),
  };
  if (command === "status") {
    const rows = readTaskFacts(context.task.taskPath); // malformed JSON and permissions are real errors
    const materials = thinMaterials(context);
    const cohort = context.manifest.activation_cohort ?? "pre";
    const needed = values.stage === "make-decision" ? [] : values.stage === "build-plan" ? ["decision-log.md"]
      : values.stage === "build-prd" ? ["decision-log.md"] : cohort === "post" ? materialFilesForCohort(cohort, materials) : ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
    const missing = needed.filter((file) => materials[file] === null || !String(materials[file] ?? "").trim());
    const row = rows.find((value) => value.record_kind === "stage" && value.stage === values.stage) ?? null;
    const currentCursor = rows.find((value) => value.record_kind === "stage" && value.stage === "build-code")?.phase_progress ?? null;
    const phasesHead = cohort === "post" ? currentPhaseMaterialsHead(context) : null;
    const assessment = values.stage === "build-code" ? terminalAssessmentQuality(context, row) : null;
    const qualityStatus = assessment?.status ?? thinQuality(context, row);
    return { task_id: context.task.identity.taskId, stage: values.stage, work_status: missing.length ? "not_ready" : "ready",
      readiness_source: "current-material-presence", missing_materials: missing, quality_status: qualityStatus,
      quality: { status: qualityStatus, review_origin: row?.review_origin ?? "not_run", review_result_ref: row?.review_result_ref ?? null, ...(assessment ? {terminal_assessment:assessment,terminal_assessment_ref:row.terminal_assessment_ref} : {}) },
      materials: Object.fromEntries(Object.entries(materials).map(([file, value]) => [file, value !== null])),
      ...(values.stage === "build-code" ? { phase_progress: derivePhaseProgressStatus({ cursor: currentCursor, currentPhasesHead: phasesHead }) } : {}),
      facts: rows, workspace: context.physical, target_workspace: context.targetStatus,
      ...(values.stage === PORTABLE_WORKFLOW_STAGE ? { portable_workflow: projectPortableWorkflowStatus({ task: context.task }) } : {}),
    };
  }
  if (command === "artifact") {
    const prd = values.stage === "build-prd" && values.name === "prd.md";
    const indexedMaterials = values.stage === "make-decision" && context.manifest.activation_cohort === "post"
      && typeof values.name === "string" && values.name.startsWith("phases/") && values.name !== "phases/index.md"
      ? { "phases/index.md": context.artifacts.read("phases/index.md") } : {};
    if (!prd && !isDesignArtifact(values.stage, values.name, context.manifest.activation_cohort ?? "pre", indexedMaterials)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    if (prd && readTaskTypeFromDecisionLog(context.artifacts.read("decision-log.md")) !== "规划任务") {
      throw new TypeError("portable build-prd writes require an explicit planning task type in the current decision-log");
    }
    const relativeName = values.name;
    await context.artifacts.writeAtomic(relativeName, readFileSync(values.input));
    return { artifact_ref: context.artifacts.reference(relativeName) };
  }
  if (command === "capture-tests") {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("verify input must be an object");
    const allowed = new Set(["argv", "shell", "command", "slug", "timeoutMs", "timeout_ms", "receipt_ref", "output_ref"]);
    if (Object.keys(input).some((key) => !allowed.has(key))) throw new TypeError("verify input has unknown fields");
    if (input.shell !== undefined && input.command !== undefined) throw new TypeError("verify accepts shell or command, not both");
    if (input.timeoutMs !== undefined && input.timeout_ms !== undefined) throw new TypeError("verify accepts one timeout field");
    // Only supplied current-task originals may be selected before receipt publication.
    const recordDir = join(context.task.taskPath, "quality", "tests");
    mkdirSync(recordDir, { recursive: true });
    const settlement = input.output_ref !== undefined || input.receipt_ref !== undefined ? captureOutputSettlement(input, recordDir, input.slug ?? `${values.stage}-verify`) : null;
    let captured;
    try { captured = await context.task.captureCommand({ cwd: context.workspace.worktreeRoot, slug: input.slug ?? `${values.stage}-verify`,
      ...(input.argv === undefined ? {} : { argv: input.argv }),
      ...((input.shell ?? input.command) === undefined ? {} : { shell: input.shell ?? input.command }),
      ...((input.timeoutMs ?? input.timeout_ms) === undefined ? {} : { timeoutMs: input.timeoutMs ?? input.timeout_ms }),
      ...(services.commandSignal === undefined ? {} : { signal: services.commandSignal }),
      ...(settlement ? { resolveOutputRef: settlement.resolveOutputRef } : {}),
    }); } catch (error) {
      const disposition = settlement ? error.code === "OUTPUT_SETTLEMENT_FAILED" ? error.message
        : `deduplication: unknown; capture failed before output settlement; ${error.code ?? "CAPTURE_FAILED"}: ${error.message}` : null;
      if (disposition && error.code !== "OUTPUT_SETTLEMENT_FAILED") error.message = disposition;
      if (values.stage === "build-code" && error.receipt_ref) {
        try {
          const receipt = JSON.parse(readFileSync(error.receipt_ref, "utf8"));
          await recordBuildCodeCommandEvidence(context, { ...receipt, receipt_ref: error.receipt_ref,
            ...(disposition ? { output_disposition: disposition } : {}),
          });
        } catch (evidenceError) {
          // Preserve the capture Error and its receipt; expose the secondary
          // failure through the stack already rendered by the CLI error path.
          error.stack = `${error.stack ?? `${error.name}: ${error.message}`}\n[command-evidence] ${JSON.stringify({ code: evidenceError.code ?? null, message: evidenceError.message })}\n${evidenceError.stack ?? ""}`;
        }
      }
      throw error;
    }
    if (values.stage === "build-code") await recordBuildCodeCommandEvidence(context, captured);
    return captured;
  }
  if (command === "confirm") {
    const fields = input ?? { stage: values.stage, decision: values.decision, reply: values["reply-text"], materialRefs: values["material-ref"] === undefined ? [] : [values["material-ref"]] };
    if (fields.stage !== undefined && fields.stage !== values.stage) throw new TypeError("confirmation stage differs from CLI stage");
    const refs = fields.materialRefs;
    const closeDir = join(context.task.taskPath, "quality", "evidence", "close");
    const isClosePlanRef = ref => typeof ref === "string"
      && dirname(resolve(context.workspace.worktreeRoot, ref)) === closeDir
      && /^\d{4}-\d{2}-\d{2}-\d{3}-close-plan\.json(?:#.*)?$/.test(basename(ref));
    if ([STAGE.BUILD_CODE, STAGE.BUILD_PRD, STAGE.MAKE_DECISION].includes(values.stage) && Array.isArray(refs) && refs.some(isClosePlanRef)) {
      if (refs.length !== 1) throw new TypeError("close confirmation requires exactly one plan reference");
      if (refs[0].includes("#") || !isAbsolute(refs[0]) || resolve(refs[0]) !== refs[0]) throw new TypeError("close confirmation requires a canonical plain plan path without fragments");
      if (Object.keys(fields).some(key => !["stage", "decision", "reply", "materialRefs"].includes(key))) throw new TypeError("close confirmation contains unsupported fields");
      const confirmed = await confirmClosePlan({ taskDir: context.task.taskPath, planRef: refs[0], outcome: fields.decision, replyText: fields.reply });
      return { status: "recorded", path: confirmed.confirmation_ref, ...confirmed.record };
    }
    return { status: "recorded", ...(await context.task.recordConfirmation({ ...fields, stage: values.stage }, { cwd: context.workspace.worktreeRoot })) };
  }
  if (command === "authorize-operation") {
    if (!["commit", "push", "merge", "archive", "cleanup", "pr"].includes(values.operation) || !values["subject-ref"]) throw new TypeError("authorize requires a supported operation and --subject-ref");
    const grant=await context.task.recordGitAuthorization({cwd:context.workspace.worktreeRoot,operation:values.operation,confirmationRef:values["subject-ref"],...(values.stage==="build-code"&&values.operation==="commit"?{phase:"build-code"}:{})});
    return { status: "recorded", ...grant };
  }
  if (command === "run") {
    if (values.stage === PORTABLE_WORKFLOW_STAGE) {
      if (input !== undefined && readTaskTypeFromDecisionLog(context.artifacts.read("decision-log.md")) !== "规划任务") {
        throw new TypeError("portable build-prd writes require an explicit planning task type in the current decision-log");
      }
      const result = await runPortableWorkflow({ task: context.task, worktreeRoot: context.workspace.worktreeRoot, input });
      return { ...result, exit_code: result.state === "failed" ? 1 : 0 };
    }
    if(input && values.stage === "build-code" && Object.keys(input).join("\0") === "terminal_assessment_ref") return writeTerminalAssessmentReference(context,input.terminal_assessment_ref);
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).join("\0") !== "phase_progress" || values.stage !== "build-code") {
      throw new TypeError("run --action=execute only records the existing build-code phase_progress cursor; official stage execution is retired");
    }
    return writeBuildCodePhaseProgressCursor(context, input.phase_progress);
  }
  if (command === "review-record") return recordTaskReview(context, input, values, services);

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
      run_execute: "build-code: mutually exclusive phase_progress cursor or terminal_assessment_ref ordinary original reference only; build-prd: supplied step outcomes require an explicit planning task type for writes; no input returns not-started/ref=null without writing; records do not certify business or quality success; no official stage execution",
      actions: {
        doctor: ["workspace"],
        status: ["begin", "repair"],
        run: ["draft", "execute"],
        review: ["record"],
        verify: ["execute"],
        confirm: ["decision"],
        authorize: ["commit", "push", "merge", "archive", "cleanup", "pr"],
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
    "authorize:pr": "authorize-operation",
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
      services: reviewSignal === null ? services : {
        ...services,
        reviewSignal: services.reviewSignal == null
          ? reviewSignal : AbortSignal.any([reviewSignal, services.reviewSignal]),
      },
      cwd,
    }),
    { skillBundleContract, runnerContract },
    internalOperation,
  );
  return publicRoute === "review:record"
    ? runReviewRecordWithSignalHandling(invoke, { signalProcess: services.signalProcess ?? process })
    : invoke();
}

export { runConfiguredOcrHostReview };

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
    process.stderr.write(`${JSON.stringify({ error: error.message, code: error.code ?? null, stack: error.stack ?? null, output_ref: error.output_ref ?? null, ...(error.receipt_ref?{receipt_ref:error.receipt_ref}:{}), ...(error.execution?{execution:error.execution,receipt_saved:error.receipt_saved}:{}),...Object.fromEntries(["subdir","current_bytes","incoming_bytes","hard_bytes","current_files","incoming_files","hard_files"].filter(k=>error[k]!==undefined).map(k=>[k,error[k]])) })}\n`);
    process.exitCode ??= Number.isInteger(error.exitCode) ? error.exitCode : 1;
  });
}
