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
import { recordConfirmation } from "../../runtime/interface/human-confirm.mjs";
import { validateTaskId } from "../../runtime/task/task-identity.mjs";
import { resolveStorageRoot, resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";
import { AUTHENTICATED_EVIDENCE_PATH, redactProviderHostPaths } from "../../runtime/review/provider-material-projection.mjs";
import { authenticatedEvidenceBytes } from "../../runtime/review/review-packet-identity.mjs";
import { runSimpleReview, validateReviewSupplement, validateReviewCallerMaterials } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { prepareConfiguredOcrHostContext, runConfiguredOcrHostReview, runOcrDelegationRound, detectOcr } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { compactReviewDiff, compactVerifyCodeMaterials, gitDiffPath, verifyCodeChangedPaths } from "../../runtime/review/review-input-bounds.mjs";
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
  return kind === null && track === null && (
    (request?.stage === "build-code" && (scope === "phase" || scope === "integration"))
    || (request?.stage === "verify-code" && scope === null));
}

function ocrReviewInstructionsFor(request) {
  const focus = reviewInstructionsFor(request.stage, null, false,
    request.review_scope ?? request.reviewScope ?? null, null, "full", null, true);
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

function projectOcrCodeReviewBundle(built, attachmentRoot, request, source, nativePacketFallback = false) {
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
        ? Buffer.from(bytes.toString("utf8").split("\n").filter((line,index)=>index<4 && !line.startsWith("Review stage ")).join("\n").replaceAll("`changes.diff`",nativePacketFallback ? "`changes.diff`" : "`diff/changes.md`")+"\n"+ocrReviewInstructionsFor(request), "utf8") : bytes;
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
    const includedSources=new Set();
    for(const path of sourcePaths){
      if(isAbsolute(path)||path.split("/").some(x=>!x||x==="."||x===".."))throw new Error("OCR source path is unsafe");
      const target=join(sourceRoot,path);let named;
      try{let cursor=sourceRoot;for(const part of path.split("/")){cursor=join(cursor,part);const st=lstatSync(cursor);if(st.isSymbolicLink()||realpathSync(cursor)!==cursor)throw new Error(`OCR source path alias: ${path}`);}named=lstatSync(target);}
      catch(error){if(error.code==="ENOENT")continue;throw error;}
      if(!named.isFile()||named.nlink!==1)throw new Error(`OCR source is not a single-link regular file: ${path}`);
      const fd=openSync(target,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);let raw;
      try{const st=fstatSync(fd);if(st.dev!==named.dev||st.ino!==named.ino||!st.isFile()||st.nlink!==1)throw new Error(`OCR source changed: ${path}`);raw=readFileSync(fd);}finally{closeSync(fd);}
      const bytes=reviewMaterialBytes(path,raw);
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

function phaseReviewSourceProjection(context, request, source, attachmentRoot) {
  if (request.stage !== "build-code" || (request.review_scope ?? request.reviewScope) !== "phase"
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

function phaseReviewDiffBase(context, request) {
  if (request.stage !== "build-code" || (request.review_scope ?? request.reviewScope) !== "phase") return null;
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
  // Only the existing fallback closure sets this private transport target; it is never caller request metadata.
  nativePacketFallback = false,
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
  const changedPaths = request.stage === "verify-code" ? verifyCodeChangedPaths(execFileSync("git", [
    "diff", "--name-only", `${context.workspace.baselineCommit}...HEAD`,
  ], { cwd: context.workspace.worktreeRoot, env: gitMetadataEnvironment(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })) : undefined;
  const compacted = compactVerifyCodeMaterials(request.materials, { changedPaths });
  const source = captureSource({ workspace: context.workspace, reviewDataRoot: trusted.attachmentRoot,
    includeDiff: true, taskId: context.task.identity.taskId,
    ...(cursorDiffBase === null ? {} : { baselineCommit: cursorDiffBase }),
    ...(changedPaths === undefined ? {} : { writeSet: changedPaths }) });
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
        ? projectOcrCodeReviewBundle({ ...built, manifest }, trusted.attachmentRoot, request, selectedSource, nativePacketFallback)
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

function readPlainInputFile(path,label) {
  const absolute=resolve(path);let cursor="/";
  for(const part of absolute.split("/").filter(Boolean)){cursor=join(cursor,part);const stat=lstatSync(cursor);if(stat.isSymbolicLink()||realpathSync(cursor)!==cursor)throw Object.assign(new Error(`${label} path alias`),{code:"TASK_PATH_ALIAS"});}
  const named=lstatSync(absolute);if(!named.isFile()||named.nlink!==1)throw Object.assign(new Error(`${label} must be a single-link regular file`),{code:"TASK_FILE_INVALID"});
  const fd=openSync(absolute,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);
  try{const st=fstatSync(fd);if(st.dev!==named.dev||st.ino!==named.ino||!st.isFile()||st.nlink!==1)throw Object.assign(new Error(`${label} changed`),{code:"TASK_FILE_CHANGED"});return readFileSync(fd,"utf8");}finally{closeSync(fd);}
}

function resolveMaterialRefs(context, materials) {
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
    if (!prd && !isDesignArtifact(values.stage, values.name, context.manifest.activation_cohort ?? "pre")) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
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
    return { status: "recorded", ...(await recordConfirmation({ ...fields, stage: values.stage }, { cwd: context.workspace.worktreeRoot, dir: join(context.task.taskPath, "quality", "evidence", "human-confirmations") })) };
  }
  if (command === "authorize-operation") {
    if (!["commit", "push", "merge", "archive", "cleanup"].includes(values.operation) || !values["subject-ref"]) throw new TypeError("authorize requires a supported operation and --subject-ref");
    // The native authorization API intentionally binds process.cwd(). Invoke
    // its existing CLI in the real worktree; never mutate this process cwd.
    const output = execFileSync(process.execPath, [fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs", import.meta.url)), "record",
      "--operation", values.operation, "--confirmation-ref", values["subject-ref"], "--dir", join(context.task.taskPath, "quality", "evidence", "git-authorizations")],
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
  if (command === "review-record") {
    if(!input || typeof input!=="object" || Array.isArray(input) || !input.request || input.result!==undefined) throw new TypeError("review --action=record requires a request; importing caller-authored results is retired");
    const original=input.request;
    if(original.stage!==undefined && original.stage!==values.stage) throw new TypeError("review request stage differs from CLI stage");
    const request={...original,stage:values.stage,activation_cohort:context.manifest.activation_cohort ?? "pre"};
    request.materials = resolveMaterialRefs(context, request.materials);
    const isPhase=values.stage==="build-code" && (request.review_kind ?? request.reviewKind ?? null)===null;
    if(isPhase) {
      request.review_scope=request.review_scope ?? request.reviewScope ?? "phase";
      request.phase_id=request.phase_id ?? request.phaseId ?? values["phase-id"] ?? null;
      request.subject_kind=request.subject_kind ?? "phase";
    }
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
      if(detection.status==="unavailable")return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:detection.error?.code ?? "OCR_DETECTION_UNAVAILABLE",message:detection.reason}};
      if(detection.status==="not_installed"){
        const fallback={from:"ocr",reason:detection.reason,detected_by:detection.detected_by};
        // The only route allowed to run providers inside this host process: it
        // must declare that native packet fallback so wh-review keeps its packet
        // boundary preflight and does not open a broker session for it.
        const nativeFallback={...options,nativePacketFallback:true,readSupplementRecord,
          onManagedStall:services.onManagedStall ?? writeManagedStallDiagnostic,buildBundle:()=>{
          const built=prepareTaskBoundBuildCodeReviewBundle(context,current,{nativePacketFallback:true});
          // Reader-only transport shape adaptation: same manifest bytes and dispose, no packet rewrite.
          return {...built,deliveryManifest:built.manifest};
        }};
        const result=await whReview(current,nativeFallback);
        return {...result,executor:"wh-review",fallback};
      }
      const onProviderHealth=services.onOcrProviderHealth ?? writeOcrProviderHealthDiagnostic;
      if(typeof onProviderHealth!=="function")throw new TypeError("OCR health observer must be a function");
      const ocrRunner=services.runOcrDelegationRound;
      let bundle;
      try {
        try{bundle=prepareTaskBoundBuildCodeReviewBundle(context,current);}catch(error){return {status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],executor:"ocr",error:{code:error.code??"ROUTE_UNAVAILABLE",message:redactProviderHostPaths(String(error.message)),diagnostic:{field:"materials/route",expected:"current task-bound materials and trusted route",actual:"invalid",next_action:"repair the reported input or route before dispatch"}}};}
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
