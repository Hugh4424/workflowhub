import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

import { assertTaskHandle } from "../../runtime/task/task-handle.mjs";
import { inspectOfficialInvocation, persistOfficialInvocation } from "./invocation-identity.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../runtime/task/workspace.mjs";
import { assertCurrentSourceDigest, captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const OID = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function targetGitTop(targetRepoRoot) {
  try {
    return realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: targetRepoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim());
  } catch (error) {
    throw new Error(`target Git validation failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function gitCommonDir(root) {
  const value = String(execFileSync("git", ["rev-parse", "--git-common-dir"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })).trim();
  return realpathSync(resolve(root, value));
}

/**
 * Read-only structural facts shared by formal write boundaries. It deliberately
 * knows nothing about review quality, provider availability, or human approval.
 */
export function inspectWriteBoundary({ task, stage, operation, invocation, workspace, sourceDigest } = {}) {
  const handle = assertTaskHandle(task);
  if (!STAGES.has(stage)) throw new TypeError("write boundary stage is invalid");
  if (typeof operation !== "string" || !/^[a-z][a-z0-9._-]*$/.test(operation)) {
    throw new TypeError("write boundary operation is invalid");
  }

  const violations = [];
  if (sourceDigest !== undefined && !HASH.test(sourceDigest ?? "")) {
    throw new TypeError("write boundary sourceDigest must be a sha256");
  }
  const targetTop = targetGitTop(handle.manifest.target_repo_root);
  if (targetTop !== handle.manifest.target_repo_root) violations.push("TARGET_GIT_TOP_MISMATCH");
  let worktreeRoot = null;
  let observedSourceDigest = null;
  if (workspace !== undefined) {
    let authenticatedWorkspace;
    try {
      try { authenticatedWorkspace = assertWorkspace(workspace); }
      catch { authenticatedWorkspace = assertCandidateWorkspace(workspace); }
      worktreeRoot = authenticatedWorkspace.worktreeRoot;
      if (targetGitTop(worktreeRoot) !== worktreeRoot) violations.push("WORKTREE_GIT_TOP_MISMATCH");
      const common = gitCommonDir(worktreeRoot);
      const targetCommon = gitCommonDir(targetTop);
      if (common !== targetCommon) violations.push("WORKTREE_TASK_REPOSITORY_MISMATCH");
    } catch {
      violations.push("WORKTREE_IDENTITY_INVALID");
    }
    if (worktreeRoot !== null) {
      try {
      const snapshot = sourceDigest === undefined
        ? captureGitWorktreeSnapshot(worktreeRoot)
        : assertCurrentSourceDigest(worktreeRoot, sourceDigest);
      observedSourceDigest = snapshot.source_digest;
      } catch (error) {
        if (error?.code === "FORMAL_LFS_CONTENT_UNAVAILABLE" || error?.code === "FORMAL_SNAPSHOT_MISMATCH") throw error;
        violations.push("SOURCE_SNAPSHOT_UNAVAILABLE");
      }
    }
  }

  const identity = invocation?.identity;
  if (!invocation || typeof invocation.ref !== "string" || !HASH.test(invocation.hash ?? "")
      || !identity || identity.task_id !== handle.identity.taskId || identity.project_name !== handle.identity.projectName
      || identity.stage !== stage) {
    violations.push("INVOCATION_IDENTITY_INVALID");
  } else {
    const raw = typeof invocation.raw === "string"
      ? invocation.raw
      : handle.readRecord(invocation.ref);
    if (sha256(raw) !== invocation.hash) violations.push("INVOCATION_RECORD_HASH_MISMATCH");
    if (identity.source_kind !== "git_invocation" || typeof identity.source_clean !== "boolean"
        || !OID.test(identity.source?.git_oid ?? "") || !OID.test(identity.source?.git_tree ?? "")
        || !HASH.test(identity.contracts?.agents?.sha256 ?? "")
        || !HASH.test(identity.contracts?.stage_skill?.sha256 ?? "")
        || !HASH.test(identity.contracts?.constitution?.sha256 ?? "")) {
      violations.push("EXECUTION_CONTENT_IDENTITY_INVALID");
    }
  }

  return Object.freeze({
    schema_version: "workflowhub-write-boundary-preflight.v1",
    task_id: handle.identity.taskId,
    stage,
    operation,
    target_git_top: targetTop,
    worktree_root: worktreeRoot,
    invocation_ref: invocation?.ref ?? null,
    invocation_hash: invocation?.hash ?? null,
    source_digest: observedSourceDigest,
    authority_refs: invocation?.ref ? [{ ref: invocation.ref, sha256: invocation.hash }] : [],
    legacy_identity: handle.manifest.execution_mode === "per_invocation" ? "absent" : "not_applicable",
    status: violations.length === 0 ? "valid" : "invalid",
    violations: Object.freeze(violations),
    path_card: Object.freeze({
      schema_version: "workflowhub-path-card.v1",
      task_path: handle.taskPath,
      target_repo_root: targetTop,
      worktree_root: worktreeRoot,
      source: Object.freeze({
        invocation_ref: invocation?.ref ?? null,
        invocation_hash: invocation?.hash ?? null,
        source_digest: observedSourceDigest,
      }),
      authority: "informational_only",
    }),
  });
}

export function assertWriteBoundary(input) {
  const result = inspectWriteBoundary(input);
  if (result.status !== "valid") {
    throw new Error(`WRITE_BOUNDARY_PREFLIGHT_FAILED: ${result.violations.join(",")}`);
  }
  return result;
}

/**
 * Authenticate one owner transaction without leaving an invocation record
 * behind when the shared structural preflight itself fails.
 */
export function authenticateWriteBoundary({
  task,
  stage,
  operation,
  runnerRoot,
  workspace,
  sourceDigest,
  runId,
} = {}) {
  const handle = assertTaskHandle(task);
  const inspected = inspectOfficialInvocation(handle, {
    runnerRoot,
    stage,
    ...(runId === undefined ? {} : { runId }),
  });
  const boundary = assertWriteBoundary({
    task: handle,
    stage,
    operation,
    invocation: inspected,
    ...(workspace === undefined ? {} : { workspace }),
    ...(sourceDigest === undefined ? {} : { sourceDigest }),
  });
  persistOfficialInvocation(handle, inspected);
  return boundary;
}

function readOptional(task, ref) {
  try { return task.readRecord(ref); }
  catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

/**
 * Persist an informational, append-only path card after its source publication
 * exists. Cards never participate in bootstrap or authorization.
 */
export function persistWriteBoundaryPathCard({ task, boundary, source } = {}) {
  const handle = assertTaskHandle(task);
  if (!boundary || boundary.status !== "valid"
      || boundary.task_id !== handle.identity.taskId
      || boundary.schema_version !== "workflowhub-write-boundary-preflight.v1") {
    throw new TypeError("valid write boundary result is required");
  }
  if (!source || typeof source.ref !== "string" || source.ref.trim() === ""
      || !HASH.test(source.hash ?? "")) {
    throw new TypeError("path card source ref/hash is required");
  }
  const sourceRaw = handle.readRecord(source.ref);
  if (sha256(sourceRaw) !== source.hash) throw new Error("path card source hash is stale");
  const card = {
    schema_version: "workflowhub-path-card.v1",
    task_id: handle.identity.taskId,
    stage: boundary.stage,
    operation: boundary.operation,
    task_path: boundary.path_card.task_path,
    target_repo_root: boundary.target_git_top,
    worktree_root: boundary.worktree_root,
    invocation: {
      ref: boundary.invocation_ref,
      hash: boundary.invocation_hash,
    },
    source: { ref: source.ref, hash: source.hash },
    authority: "informational_only",
  };
  const raw = `${JSON.stringify(card, null, 2)}\n`;
  const ref = `identity/path-cards/${boundary.stage}/${sha256(raw)}.json`;
  const existing = readOptional(handle, ref);
  if (existing !== undefined) {
    if (existing !== raw) throw new Error("path card append-only conflict");
    return Object.freeze({ ref, hash: sha256(raw), card: Object.freeze(card) });
  }
  try { handle.createPathCardRecord(ref, raw); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (handle.readRecord(ref) !== raw) throw new Error("path card append-only conflict");
  }
  return Object.freeze({ ref, hash: sha256(raw), card: Object.freeze(card) });
}
