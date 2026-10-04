import { existsSync, lstatSync, realpathSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { assertTaskHandle } from "./task-capability.mjs";
import { inspectWorkspace } from "../interface/workspace-check.mjs";
const EXECUTION_SIDECAR_PREFIXES = Object.freeze(["evidence/", "quality/", ".multica/"]);

const KNOWN_IGNORED_GENERATED = Object.freeze([
  ".vite",
  ".venv",
  ".pytest_cache",
  "test-results",
  "node_modules",
  "frontend/test-results",
  "frontend/node_modules",
  "frontend/dist",
  "data/local-qa-m08",
  "data/local-qa-m08-v2",
  "data/local-qa-m08-v3",
  "data/local-qa-m08-v4",
  "data/local-real-m08-v1",
  "data/local-real-m08-v2",
]);

function gitEnvironment() { const env = { ...process.env }; for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key]; return env; }
function gitValue(cwd, args, label) {
  try { return String(execFileSync("git", args, { cwd, env: gitEnvironment(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
  catch (error) { throw new Error(`${label} validation failed: ${error.stderr?.toString().trim() || error.message}`, { cause: error }); }
}

function gitCommonDir(root) {
  const value = gitValue(root, ["rev-parse", "--git-common-dir"], "git common dir");
  return realpathSync(isAbsolute(value) ? value : resolve(root, value));
}

function realGitToplevel(path, label) {
  if (typeof path !== "string" || !isAbsolute(path)) throw new TypeError(`${label} must be an absolute path`);
  const requested = resolve(path);
  let cursor = parse(requested).root;
  const ancestry = [];
  for (const part of requested.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    const alias = process.platform === "darwin" && ((cursor === "/tmp" && realpathSync(cursor) === "/private/tmp") || (cursor === "/var" && realpathSync(cursor) === "/private/var"));
    if ((!alias && stat.isSymbolicLink()) || (!alias && !stat.isDirectory())) throw new Error(`${label} must have real directory ancestors: ${cursor}`);
    ancestry.push({ path: cursor, dev: stat.dev, ino: stat.ino, real: realpathSync(cursor) });
  }
  const real = realpathSync(requested);
  for (const before of ancestry) if (lstatSync(before.path).dev !== before.dev || lstatSync(before.path).ino !== before.ino || realpathSync(before.path) !== before.real) throw new Error(`${label} directory ancestor changed`);
  if (realpathSync(gitValue(real, ["rev-parse", "--show-toplevel"], label)) !== real) throw new Error(`${label} must be a Git toplevel directory`);
  return real;
}

function relativeWorktreePath(value, label) {
  if (typeof value !== "string" || value === "" || isAbsolute(value) || value.split("/").includes("..")) {
    throw new Error(`${label} contains an unsafe repository-relative path: ${value}`);
  }
  return value.replace(/\/$/, "");
}

function isKnownIgnoredGenerated(path) {
  return path === ".DS_Store"
    || path.split("/").includes("__pycache__")
    || path.split("/").includes(".venv")
    || KNOWN_IGNORED_GENERATED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isExecutionSidecar(path) {
  return EXECUTION_SIDECAR_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix));
}

function cleanupError(scan) {
  const detail = [
    ...scan.tracked.map((entry) => `tracked:${entry.path}`),
    ...scan.untracked.map((entry) => `untracked:${entry.path}`),
    ...scan.ignored_unknown.map((entry) => `ignored:${entry.path}`),
  ].join(", ");
  const error = new Error(`FORMAL_CLEANUP_UNSAFE: task worktree cleanup is not path-safe${detail ? ` (${detail})` : ""}`);
  error.code = "FORMAL_CLEANUP_UNSAFE";
  error.cleanup = scan;
  return error;
}

/** Classify all worktree changes before a governed cleanup operation. */
export function inspectWorktreeCleanup(worktreeRoot) {
  const root = realGitToplevel(worktreeRoot, "task worktree cleanup scan");
  const raw = String(execFileSync("git", ["status", "--porcelain=v1", "--ignored", "--untracked-files=all", "-z"], {
    cwd: root, env: gitEnvironment(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  }));
  const tracked = [];
  const untracked = [];
  const execution_sidecars = [];
  const ignored_generated = [];
  const ignored_unknown = [];
  for (const field of raw.split("\0").filter(Boolean)) {
    const status = field.slice(0, 2);
    const path = relativeWorktreePath(field.slice(3), "task worktree cleanup scan");
    const entry = Object.freeze({ status, path });
    if (isExecutionSidecar(path)) execution_sidecars.push(entry);
    else if (status === "??") untracked.push(entry);
    else if (status === "!!") {
      (isKnownIgnoredGenerated(path) ? ignored_generated : ignored_unknown).push(entry);
    } else tracked.push(entry);
  }
  return Object.freeze({
    schema_version: "workflowhub-worktree-cleanup-scan.v1",
    worktree_root: root,
    tracked: Object.freeze(tracked),
    untracked: Object.freeze(untracked),
    execution_sidecars: Object.freeze(execution_sidecars),
    ignored_generated: Object.freeze(ignored_generated),
    ignored_unknown: Object.freeze(ignored_unknown),
    safe: tracked.length === 0 && untracked.length === 0 && ignored_unknown.length === 0,
  });
}

function cleanupParents(root, target) {
  const rel = relative(root, dirname(target));
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("cleanup parent escapes task workspace");
  let cursor = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(cursor) !== cursor) throw new Error("cleanup parent is an alias or non-directory");
  }
}

function removeKnownIgnoredGenerated(root, entry) {
  if (!isKnownIgnoredGenerated(entry.path)) throw cleanupError({
    tracked: [], untracked: [], ignored_unknown: [entry], ignored_generated: [],
  });
  const target = resolve(root, entry.path);
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error("known ignored generated path escapes task worktree");
  cleanupParents(root, target);
  let stat;
  try { stat = lstatSync(target); }
  catch (error) { if (error?.code === "ENOENT") return; throw error; }
  if (stat.isSymbolicLink()) {
    // Generated environments such as .venv contain launcher symlinks.  The
    // target is still safe to remove because only the symlink itself is
    // unlinked; we never follow it outside the authenticated worktree.
    rmSync(target, { recursive: false, force: false });
    return;
  }
  rmSync(target, { recursive: true, force: false });
}

function removeKnownExecutionSidecar(root, entry) {
  if (!isExecutionSidecar(entry.path)) throw cleanupError({
    tracked: [], untracked: [], ignored_unknown: [entry], ignored_generated: [], execution_sidecars: [],
  });
  const target = resolve(root, entry.path);
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error("execution sidecar path escapes task worktree");
  cleanupParents(root, target);
  let stat;
  try { stat = lstatSync(target); }
  catch (error) { if (error?.code === "ENOENT") return; throw error; }
  if (stat.isSymbolicLink()) {
    rmSync(target, { recursive: false, force: false });
    return;
  }
  rmSync(target, { recursive: true, force: false });
}

function restoreTrackedExecutionSidecar(root, entry) {
  if (!isExecutionSidecar(entry.path)) throw cleanupError({
    tracked: [], untracked: [], ignored_unknown: [entry], ignored_generated: [], execution_sidecars: [],
  });
  execFileSync("git", ["restore", "--worktree", "--", entry.path], {
    cwd: root, env: gitEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function workspaceExpectation(task) {
  const targetRepoRoot = realGitToplevel(task.manifest.target_repo_root, "target repository");
  let existing = task.manifest.workspace_mode === "existing";
  let existingRoot = existing ? task.manifest.workspace_root : null;
  if (!existing && task.manifest.workspace_mode === undefined) {
    const dotGit = lstatSync(join(targetRepoRoot, ".git"));
    if (dotGit.isFile() && !dotGit.isSymbolicLink() && dotGit.nlink === 1) {
      if (!registeredWorktree(targetRepoRoot, targetRepoRoot)) throw new Error("target linked workspace is not registered");
      existing = true;
      existingRoot = targetRepoRoot;
    } else if (!dotGit.isDirectory() || dotGit.isSymbolicLink()) {
      throw new Error("target Git metadata must be a real directory or single-link worktree file");
    }
  }
  const worktreeRoot = existing ? resolve(existingRoot) : resolve(dirname(targetRepoRoot), `${basename(targetRepoRoot)}-${task.identity.taskId}`);
  return { targetRepoRoot, worktreeRoot, branch: existing ? null : `task/${task.identity.projectName}/${task.identity.taskId}`, mode: existing ? "existing" : "deterministic" };
}
function registeredWorktree(targetRepoRoot, worktreeRoot) {
  const fields = gitValue(targetRepoRoot, ["worktree", "list", "--porcelain", "-z"], "task worktree registration").split("\0");
  for (let index = 0; index < fields.length; index += 1) if (fields[index].startsWith("worktree ") && resolve(fields[index].slice(9)) === worktreeRoot) {
    let branch = null;
    for (const field of fields.slice(index + 1)) { if (!field) break; if (field.startsWith("branch ")) branch = field.slice(7); }
    return { worktree: worktreeRoot, branch };
  }
  return null;
}
async function checkedWorkspace(expected, baseline = "HEAD") {
  const target = realGitToplevel(expected.targetRepoRoot, "target repository"), worktree = realGitToplevel(expected.worktreeRoot, "task worktree");
  const dotGit = lstatSync(join(worktree, ".git"));
  if (!dotGit.isFile() || dotGit.isSymbolicLink() || dotGit.nlink !== 1) throw new Error("task requires a registered linked Git worktree");
  const physical = await inspectWorkspace({ root: target, target: worktree, baseline, ...(expected.branch ? { expectBranch: expected.branch } : {}) });
  if (gitCommonDir(worktree) !== gitCommonDir(target)) throw new Error("task workspace differs from target Git repository");
  return Object.freeze({ worktreeRoot: worktree, targetRepoRoot: target, baselineCommit: baseline === "HEAD" ? physical.head : baseline, branch: physical.branch });
}
export async function validateExistingWorkspaceBinding({ targetRepoRoot, workspaceRoot } = {}) {
  const workspace = await checkedWorkspace({ targetRepoRoot, worktreeRoot: workspaceRoot, branch: null });
  return Object.freeze({ ...workspace, mode: "existing", requireBranch: false });
}
export async function assertWorkspace(value) {
  if (!value || typeof value !== "object" || typeof value.baselineCommit !== "string") throw new TypeError("workspace metadata is required");
  await checkedWorkspace({ targetRepoRoot: value.targetRepoRoot, worktreeRoot: value.worktreeRoot, branch: value.branch }, value.baselineCommit);
  return value;
}
export async function openCurrentTaskWorkspace(taskHandle) {
  const task = assertTaskHandle(taskHandle);
  return checkedWorkspace(workspaceExpectation(task), task.manifest.baseline_commit ?? "HEAD");
}
async function inspectTargetStatus(targetRepoRoot) {
  const physical = await inspectWorkspace({ root: targetRepoRoot, target: targetRepoRoot, baseline: "HEAD" });
  return Object.freeze({ ref: physical.branch, head: physical.head, dirty: physical.dirty > 0, counts: physical.counts, entries: physical.dirty_paths,
    recommendations: Object.freeze(physical.dirty ? ["先确认已修改和未跟踪文件的归属；不要自动覆盖或删除"] : ["没有需要清理的 dirty 内容"]) });
}
export async function prepareTaskWorkspace(taskHandle) {
  if (arguments.length !== 1) throw new TypeError("prepareTaskWorkspace accepts only task metadata");
  const task = assertTaskHandle(taskHandle);
  if (task.manifest.activation_cohort !== "post") throw new Error("pre/history workspace creation is read-only");
  const expected = workspaceExpectation(task);
  if (expected.mode === "existing") return checkedWorkspace(expected, task.manifest.baseline_commit ?? "HEAD");
  const pathExists = existsSync(expected.worktreeRoot);
  let branchExists;
  try { gitValue(expected.targetRepoRoot, ["show-ref", "--verify", "--quiet", `refs/heads/${expected.branch}`], "task branch"); branchExists = true; }
  catch (error) { if (error?.cause?.status !== 1) throw error; branchExists = false; }
  if (pathExists !== branchExists) throw new Error("deterministic task worktree path/branch conflict");
  await inspectTargetStatus(expected.targetRepoRoot);
  if (!pathExists) gitValue(expected.targetRepoRoot, ["worktree", "add", "-b", expected.branch, expected.worktreeRoot, "HEAD"], "task worktree creation");
  return checkedWorkspace(expected, task.manifest.baseline_commit ?? "HEAD");
}
export async function reviewSourceForWorkspace(value) {
  const workspace = await assertWorkspace(value);
  const bases = gitValue(workspace.worktreeRoot, ["merge-base", "--all", gitValue(workspace.targetRepoRoot, ["rev-parse", "HEAD"], "review target HEAD"), "HEAD"], "review baseline").split(/\s+/).filter(Boolean);
  if (bases.length !== 1) throw new Error("review workspace requires exactly one shared Git baseline");
  return Object.freeze({ worktreeRoot: workspace.worktreeRoot, targetRepoRoot: workspace.targetRepoRoot, baselineCommit: bases[0] });
}
/** Task-owned removal execution; human Git authorization belongs to interface/git-authorize. */
export function createTaskWorktreeRemoval(taskHandle) {
  if (arguments.length !== 1) throw new TypeError("worktree removal uses current task metadata, not accepted records");
  const task = assertTaskHandle(taskHandle), expected = workspaceExpectation(task);
  if (expected.mode === "existing") return Object.freeze({
    probe: () => ({ satisfied: true, skipped: true, reason: "existing worktree is not task-owned", worktree_root: expected.worktreeRoot }),
    execute: async () => {}, verify: async value => value?.satisfied === true && value?.skipped === true && value?.worktree_root === expected.worktreeRoot,
  });
  const observe = () => {
    const exists = existsSync(expected.worktreeRoot), registered = registeredWorktree(expected.targetRepoRoot, expected.worktreeRoot);
    if (!exists && !registered) return { satisfied: true, worktree_root: expected.worktreeRoot };
    if (exists !== Boolean(registered)) throw new Error("task worktree path/registration mismatch during removal");
    const root = realGitToplevel(expected.worktreeRoot, "worktree removal target");
    if (root !== expected.worktreeRoot || gitCommonDir(root) !== gitCommonDir(expected.targetRepoRoot) || registered.branch !== `refs/heads/${expected.branch}` || gitValue(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], "worktree removal branch") !== expected.branch) throw new Error("task worktree registration, repository or branch changed");
    return { satisfied: false, worktree_root: expected.worktreeRoot };
  };
  return Object.freeze({ probe: observe,
    execute: async () => {
      if (task.manifest.activation_cohort !== "post") throw new Error("pre/history worktree removal is read-only");
      if (observe().satisfied) return;
      await checkedWorkspace(expected);
      const cleanup = inspectWorktreeCleanup(expected.worktreeRoot);
      if (!cleanup.safe) throw cleanupError(cleanup);
      for (const entry of cleanup.ignored_generated) removeKnownIgnoredGenerated(expected.worktreeRoot, entry);
      for (const entry of cleanup.execution_sidecars) { if (entry.status === "??" || entry.status === "!!") removeKnownExecutionSidecar(expected.worktreeRoot, entry); else restoreTrackedExecutionSidecar(expected.worktreeRoot, entry); }
      const after = inspectWorktreeCleanup(expected.worktreeRoot); if (!after.safe) throw cleanupError(after);
      observe(); gitValue(expected.targetRepoRoot, ["worktree", "remove", "--", expected.worktreeRoot], "task worktree removal");
    }, verify: async value => value?.satisfied === true && value?.worktree_root === expected.worktreeRoot,
  });
}
