#!/usr/bin/env node

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
import { authenticatedEvidenceBytes } from "../../runtime/review/review-packet-identity.mjs";
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
        const explicitExisting = manifest?.workspace_mode === "existing" && typeof manifest.workspace_root === "string" && resolve(manifest.workspace_root) === worktreeRoot;
        const targetIsWorkspace = worktreeRoot !== repositoryRoot && manifest?.workspace_mode === undefined && typeof manifest.target_repo_root === "string" && resolve(manifest.target_repo_root) === worktreeRoot;
        if ((!explicitExisting && !targetIsWorkspace) || typeof manifest.target_repo_root !== "string"
            || ![repositoryRoot, worktreeRoot].includes(resolve(manifest.target_repo_root))) continue;
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
  if (request?.stage === "verify-code") return scope === null;
  return request?.stage === "build-code"
    && (scope === "phase" || scope === "integration");
}

function isNormalOcrCodeReviewRequest(request) {
  const scope = request?.review_scope ?? request?.reviewScope ?? null;
  const kind = request?.review_kind ?? request?.reviewKind ?? null;
  const track = request?.review_track ?? request?.reviewTrack ?? null;
  return track === null && kind === null && (
    (request?.stage === "build-code" && (scope === "phase" || scope === "integration"))
    || (request?.stage === "verify-code" && scope === null));
}

function ocrReviewInstructionsFor(request) {
  const focus = reviewInstructionsFor(request.stage, null, false,
    request.review_scope ?? request.reviewScope ?? null, request.review_kind ?? request.reviewKind ?? null, "full", null, true);
  return [
    `OCR code review: ${request.stage}/${request.phase_id ?? request.phaseId ?? "worktree"}.`,
    "Read the complete contracts/build-code.md, contracts/verify-code.md, contracts/provider-protocol.md and manifest-declared lens skill bodies. Apply the actual stage's reviewer contract and the review focus below; the other code contract supplies the adjacent review boundary.",
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
  if (candidateExperiment && request.stage === "verify-code") {
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
    const changedPaths = request.stage === 'verify-code' ? source.changedPaths : undefined;
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

function thinQuality(context, row) {
  if (!row || row.source === PHASE_PROGRESS_ONLY_SOURCE || row.review_origin === "not_run") return "unknown";
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
    const isPhase=values.stage==="build-code" && (request.review_kind ?? request.reviewKind ?? null)===null;
    if(isPhase) {
      request.review_scope=request.review_scope ?? request.reviewScope ?? "phase";
      request.phase_id=request.phase_id ?? request.phaseId ?? values["phase-id"] ?? null;
      request.subject_kind=request.subject_kind ?? "phase";
    }
    const reviewReadScope=trustedReviewReadScope(context,request,typeof services.resolveReviewReadScope==='function' ? services.resolveReviewReadScope({task:context.task,workspace:context.workspace,stage:request.stage,phaseId:request.phase_id??null}) : undefined);
    request.materials = resolveMaterialRefs(context, request.materials,reviewReadScope);
    const codeSurface=["build-code","verify-code"].includes(request.stage)
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
      let bundle;
      try {
        try{bundle=prepareTaskBoundBuildCodeReviewBundle(context,current,{reviewReadScope});}catch(error){return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code??"ROUTE_UNAVAILABLE",message:redactProviderHostPaths(String(error.message)),diagnostic:{field:"materials/route",expected:"current task-bound materials and trusted route",actual:"invalid",next_action:"repair the reported input or route before dispatch"}}};}
        if (services.onReviewMaterials !== undefined) {
          await observeReviewMaterials(bundle, services.onReviewMaterials, options.signal);
          if (options.signal?.aborted) throw Object.assign(new Error("review cancelled after material observation"), { code: "REVIEW_CANCELLED", dispatch_state: "blocked_before_dispatch" });
        }
        let trustedContext;
        try{trustedContext=prepareConfiguredOcrHostContext(current);}catch(error){
          return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code??"ROUTE_UNAVAILABLE",message:redactProviderHostPaths(String(error.message)),diagnostic:{field:"route/provider_selection",expected:"one current trusted code route and valid provider configuration",actual:"invalid",next_action:"repair current route/configuration before dispatch"}}};
        }
        let subset;
        try{subset=await validateReviewSupplement(current,{providers:trustedContext.selection.providers,materialId:bundle.materialId,taskId:context.task.identity.taskId,readRecord:readSupplementRecord});}
        catch(error){return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code,message:error.message,diagnostic:error.diagnostic}};}
        if(current.only_providers!==undefined){
          const selected=new Set(subset),original=trustedContext.selection,filterMap=map=>map?Object.fromEntries(Object.entries(map).filter(([key])=>selected.has(key))):map;
          // Only selection is narrowed. Preserve the full trusted configuration SHA and route identity drift checks.
          trustedContext={...trustedContext,selection:{...original,providers:subset,eligibleProfiles:original.eligibleProfiles.filter(p=>selected.has(p)),requestedProfiles:original.requestedProfiles.filter(p=>selected.has(p)),requestedProfileSpecs:original.requestedProfileSpecs.filter(p=>selected.has(typeof p==="string"?p:p.provider??p.id)),provider_identities:filterMap(original.provider_identities),provider_models:filterMap(original.provider_models)}};
        }
        if(typeof ocrRunner==="function")return {...await ocrRunner(current,{...options,onProviderHealth,bundle,trustedContext}),executor:"ocr"};
        const result=await runOcrDelegationRound(current,{buildBundle:()=>bundle,signal:options.signal,
          onProviderResult: async ({ result: providerResult }) => {
            // The host has already persisted each original stream before settling.
            // Reuse its references; the projected result contains no raw bytes.
            return providerResult?.raw_output_ref ?? providerResult?.evidence_refs?.[0] ?? null;
          },
          executor:params=>runConfiguredOcrHostReview(params,{trustedContext,sourceBundle:bundle,onProviderHealth,
            onProviderResult:params.onProviderResult,
            rawOutputSink:async (hint,bytes,metadata={})=>options.onProviderOutput({provider:metadata.provider ?? "ocr",role:null,channel:metadata.stream ?? "raw-output",output:bytes})})});
        return {...result,executor:"ocr"};
      } finally {bundle?.dispose();}
    };
    return recordSimpleReviewRequest({taskDir:context.task.taskPath,request,runRound:runner,signal:services.reviewSignal ?? null});
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
    const qualityStatus = thinQuality(context, row);
    return { task_id: context.task.identity.taskId, stage: values.stage, work_status: missing.length ? "not_ready" : "ready",
      readiness_source: "current-material-presence", missing_materials: missing, quality_status: qualityStatus,
      quality: { status: qualityStatus, review_origin: row?.review_origin ?? "not_run", review_result_ref: row?.review_result_ref ?? null },
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
    try { captured = await captureCommand({ cwd: context.workspace.worktreeRoot, recordDir, slug: input.slug ?? `${values.stage}-verify`,
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
    if (["verify-code", "make-decision"].includes(values.stage) && Array.isArray(refs) && refs.some(isClosePlanRef)) {
      if (refs.length !== 1) throw new TypeError("close confirmation requires exactly one plan reference");
      if (refs[0].includes("#") || !isAbsolute(refs[0]) || resolve(refs[0]) !== refs[0]) throw new TypeError("close confirmation requires a canonical plain plan path without fragments");
      if (Object.keys(fields).some(key => !["stage", "decision", "reply", "materialRefs"].includes(key))) throw new TypeError("close confirmation contains unsupported fields");
      const confirmed = await confirmClosePlan({ taskDir: context.task.taskPath, planRef: refs[0], outcome: fields.decision, replyText: fields.reply });
      return { status: "recorded", path: confirmed.confirmation_ref, ...confirmed.record };
    }
    return { status: "recorded", ...(await recordConfirmation({ ...fields, stage: values.stage }, { cwd: context.workspace.worktreeRoot, dir: join(context.task.taskPath, "quality", "evidence", "human-confirmations") })) };
  }
  if (command === "authorize-operation") {
    if (!["commit", "push", "merge", "archive", "cleanup", "pr"].includes(values.operation) || !values["subject-ref"]) throw new TypeError("authorize requires a supported operation and --subject-ref");
    // The native authorization API intentionally binds process.cwd(). Invoke
    // its existing CLI in the real worktree; never mutate this process cwd.
    const output = execFileSync(process.execPath, [fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs", import.meta.url)), "record",
      "--operation", values.operation, "--confirmation-ref", values["subject-ref"],
      ...(values.stage === "build-code" && values.operation === "commit" ? ["--phase", "build-code"] : []), "--dir", join(context.task.taskPath, "quality", "evidence", "git-authorizations")],
      { cwd: context.workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: "recorded", ...JSON.parse(output) };
  }
  if (command === "run") {
    if (values.stage === PORTABLE_WORKFLOW_STAGE) {
      if (input !== undefined && readTaskTypeFromDecisionLog(context.artifacts.read("decision-log.md")) !== "规划任务") {
        throw new TypeError("portable build-prd writes require an explicit planning task type in the current decision-log");
      }
      const result = await runPortableWorkflow({ task: context.task, worktreeRoot: context.workspace.worktreeRoot, input });
      return { ...result, exit_code: result.state === "failed" ? 1 : 0 };
    }
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
      run_execute: "build-code: phase_progress cursor only; build-prd: supplied step outcomes require an explicit planning task type for writes; no input returns not-started/ref=null without writing; records do not certify business or quality success; no official stage execution",
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
    process.stderr.write(`${JSON.stringify({ error: error.message, code: error.code ?? null, stack: error.stack ?? null, output_ref: error.output_ref ?? null, receipt_ref: error.receipt_ref ?? null })}\n`);
    process.exitCode ??= Number.isInteger(error.exitCode) ? error.exitCode : 1;
  });
}
