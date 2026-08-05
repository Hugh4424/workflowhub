import { existsSync, lstatSync, realpathSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { assertTaskHandle } from "../../core/task-capability.mjs";
import { captureExecutionSnapshot } from "../task/git-worktree-snapshot.mjs";

const WORKSPACES = new WeakSet();
const CANDIDATE_WORKSPACES = new WeakSet();
const WORKSPACE_BINDINGS = new WeakMap();
const KNOWN_IGNORED_GENERATED = Object.freeze([
  ".vite",
  ".venv",
  ".pytest_cache",
  "test-results",
  "frontend/node_modules",
  "frontend/dist",
  "data/local-qa-m08",
  "data/local-qa-m08-v2",
  "data/local-qa-m08-v3",
  "data/local-qa-m08-v4",
  "data/local-real-m08-v1",
  "data/local-real-m08-v2",
]);

function gitValue(cwd, args, label) {
  try { return String(execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
  catch (error) { throw new Error(`${label} validation failed: ${error.stderr?.toString().trim() || error.message}`); }
}

function gitCommonDir(root) {
  const value = gitValue(root, ["rev-parse", "--git-common-dir"], "git common dir");
  return realpathSync(isAbsolute(value) ? value : resolve(root, value));
}

function realGitToplevel(path, label) {
  if (typeof path !== "string" || !isAbsolute(path)) throw new TypeError(`${label} must be an absolute path`);
  const requested = resolve(path);
  const stat = lstatSync(requested);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a real directory: ${requested}`);
  const real = realpathSync(requested);
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
    || KNOWN_IGNORED_GENERATED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
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
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }));
  const tracked = [];
  const untracked = [];
  const ignored_generated = [];
  const ignored_unknown = [];
  for (const field of raw.split("\0").filter(Boolean)) {
    const status = field.slice(0, 2);
    const path = relativeWorktreePath(field.slice(3), "task worktree cleanup scan");
    const entry = Object.freeze({ status, path });
    if (status === "??") untracked.push(entry);
    else if (status === "!!") {
      (isKnownIgnoredGenerated(path) ? ignored_generated : ignored_unknown).push(entry);
    } else tracked.push(entry);
  }
  return Object.freeze({
    schema_version: "workflowhub-worktree-cleanup-scan.v1",
    worktree_root: root,
    tracked: Object.freeze(tracked),
    untracked: Object.freeze(untracked),
    ignored_generated: Object.freeze(ignored_generated),
    ignored_unknown: Object.freeze(ignored_unknown),
    safe: tracked.length === 0 && untracked.length === 0 && ignored_unknown.length === 0,
  });
}

function removeKnownIgnoredGenerated(root, entry) {
  if (!isKnownIgnoredGenerated(entry.path)) throw cleanupError({
    tracked: [], untracked: [], ignored_unknown: [entry], ignored_generated: [],
  });
  const target = resolve(root, entry.path);
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error("known ignored generated path escapes task worktree");
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

function deterministicWorkspace(task) {
  const targetRepoRoot = realGitToplevel(task.manifest.target_repo_root, "target repository");
  const branch = `task/${task.identity.projectName}/${task.identity.taskId}`;
  const worktreeRoot = resolve(dirname(targetRepoRoot), `${basename(targetRepoRoot)}-${task.identity.taskId}`);
  return { targetRepoRoot, branch, worktreeRoot };
}

function acceptedWorkspaceExpectation(task) {
  return deterministicWorkspace(task);
}

function workspaceForCreation(task) {
  const expected = deterministicWorkspace(task);
  const { targetRepoRoot } = expected;
  const baselineCommit = gitValue(targetRepoRoot, ["rev-parse", "--verify", "HEAD^{commit}"], "target repository HEAD");
  if (!/^[a-f0-9]{40}$/i.test(baselineCommit)) throw new Error("target repository HEAD must be a full Git commit OID");
  if (gitValue(targetRepoRoot, ["status", "--porcelain", "--untracked-files=all"], "target repository status") !== "") {
    throw new Error("target repository must be clean before creating the task worktree");
  }
  return { ...expected, baselineCommit };
}

function registeredWorktree(targetRepoRoot, worktreeRoot) {
  const entries = gitValue(targetRepoRoot, ["worktree", "list", "--porcelain"], "task worktree registration")
    .split(/\n\s*\n/)
    .map((entry) => Object.fromEntries(entry.split("\n").filter(Boolean).map((line) => {
      const separator = line.indexOf(" ");
      return separator === -1 ? [line, true] : [line.slice(0, separator), line.slice(separator + 1)];
    })));
  return entries.find((entry) => typeof entry.worktree === "string" && resolve(entry.worktree) === worktreeRoot);
}

function assertWorktreeRegistration(expected, label) {
  const registration = registeredWorktree(expected.targetRepoRoot, expected.worktreeRoot);
  if (!registration) throw new Error(`${label} is not registered at the deterministic task worktree path`);
  if (registration.branch !== `refs/heads/${expected.branch}`) {
    throw new Error(`${label} registration does not use deterministic branch ${expected.branch}`);
  }
}

function branchExists(targetRepoRoot, branch) {
  try {
    execFileSync("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], {
      cwd: targetRepoRoot,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    if (error?.status === 1) return false;
    throw new Error(`task worktree branch validation failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function isAncestor(repoRoot, ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    if (error?.status === 1) return false;
    throw new Error(`task worktree ancestry validation failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function validateCandidate(task, expected, facts = {
  worktree_root: expected.worktreeRoot,
  baseline_commit: expected.baselineCommit,
}) {
  if (typeof facts?.worktree_root !== "string" || resolve(facts.worktree_root) !== expected.worktreeRoot) {
    throw new Error(`make-decision worktree_root does not match the deterministic task worktree: ${facts?.worktree_root}`);
  }
  if (facts?.baseline_commit !== expected.baselineCommit) {
    throw new Error("make-decision baseline_commit does not match task worktree HEAD");
  }
  const realWorktree = realGitToplevel(expected.worktreeRoot, "task worktree");
  if (realWorktree !== expected.worktreeRoot) throw new Error("task worktree realpath changed");
  assertWorktreeRegistration(expected, "task worktree");
  if (gitCommonDir(realWorktree) !== gitCommonDir(expected.targetRepoRoot)) throw new Error("task worktree and target repo must share a Git common directory");
  if (gitValue(realWorktree, ["symbolic-ref", "--quiet", "--short", "HEAD"], "task worktree branch") !== expected.branch) {
    throw new Error(`task worktree must use deterministic branch ${expected.branch}`);
  }
  if (gitValue(realWorktree, ["rev-parse", "HEAD"], "task worktree HEAD") !== expected.baselineCommit) {
    throw new Error("task worktree HEAD must equal the make-decision baseline");
  }
  if (expected.requireClean
      && gitValue(realWorktree, ["status", "--porcelain", "--untracked-files=all"], "task worktree status") !== "") {
    throw new Error("task worktree must remain clean");
  }
  const identity = lstatSync(realWorktree);
  const validate = () => {
    const current = lstatSync(realWorktree);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino || realpathSync(realWorktree) !== realWorktree) {
      throw new Error(`CandidateWorkspace directory identity changed: ${realWorktree}`);
    }
    assertWorktreeRegistration(expected, "CandidateWorkspace");
    if (gitCommonDir(realWorktree) !== gitCommonDir(expected.targetRepoRoot)) throw new Error("CandidateWorkspace Git common directory changed");
    if (gitValue(realWorktree, ["symbolic-ref", "--quiet", "--short", "HEAD"], "CandidateWorkspace branch") !== expected.branch) throw new Error("CandidateWorkspace branch changed");
    if (gitValue(realWorktree, ["rev-parse", "HEAD"], "CandidateWorkspace HEAD") !== expected.baselineCommit) throw new Error("CandidateWorkspace HEAD changed");
    if (expected.requireClean
        && gitValue(realWorktree, ["status", "--porcelain", "--untracked-files=all"], "CandidateWorkspace status") !== "") {
      throw new Error("CandidateWorkspace must remain clean");
    }
    return true;
  };
  const candidate = { baselineCommit: expected.baselineCommit, targetRepoRoot: expected.targetRepoRoot, branch: expected.branch };
  Object.defineProperty(candidate, "worktreeRoot", { enumerable: true, get() { validate(); return realWorktree; } });
  Object.defineProperty(candidate, "assertValid", { enumerable: false, value: validate });
  Object.defineProperty(candidate, "captureSnapshot", { enumerable: false, value: () => {
    validate();
    return captureExecutionSnapshot(realWorktree);
  } });
  CANDIDATE_WORKSPACES.add(candidate);
  return Object.freeze(candidate);
}

export function assertWorkspace(value) {
  if (!value || typeof value !== "object" || !WORKSPACES.has(value)) throw new TypeError("authentic Workspace capability required");
  value.assertValid();
  return value;
}

/** Return the immutable repository binding carried by an authentic accepted Workspace. */
export function reviewSourceForWorkspace(value) {
  const workspace = assertWorkspace(value);
  const binding = WORKSPACE_BINDINGS.get(workspace);
  if (!binding) throw new TypeError("Workspace review binding is unavailable");
  return Object.freeze({ worktreeRoot: workspace.worktreeRoot, targetRepoRoot: binding.targetRepoRoot, baselineCommit: workspace.baselineCommit });
}

export function assertCandidateWorkspace(value) {
  if (!value || typeof value !== "object" || !CANDIDATE_WORKSPACES.has(value)) throw new TypeError("authentic CandidateWorkspace capability required");
  value.assertValid();
  return value;
}

/** Create or validate the one deterministic worktree for this task. */
export function prepareTaskWorkspace(taskHandle) {
  if (arguments.length !== 1) throw new TypeError("prepareTaskWorkspace accepts only a TaskHandle; caller-supplied workspace paths are forbidden");
  const task = assertTaskHandle(taskHandle);
  const deterministic = deterministicWorkspace(task);
  const pathExists = existsSync(deterministic.worktreeRoot);
  const refExists = branchExists(deterministic.targetRepoRoot, deterministic.branch);
  if (pathExists !== refExists) throw new Error("deterministic task worktree path/branch conflict; refusing fallback or automatic repair");
  if (!pathExists) {
    const expected = workspaceForCreation(task);
    try {
      execFileSync("git", ["worktree", "add", "-b", expected.branch, expected.worktreeRoot, expected.baselineCommit], {
        cwd: expected.targetRepoRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      throw new Error(`task worktree creation failed: ${error.stderr?.toString().trim() || error.message}`);
    }
    return validateCandidate(task, expected);
  }
  const baselineCommit = gitValue(deterministic.worktreeRoot, ["rev-parse", "--verify", "HEAD^{commit}"], "existing task worktree HEAD");
  if (!/^[a-f0-9]{40}$/i.test(baselineCommit)) throw new Error("existing task worktree HEAD must be a full Git commit OID");
  const targetCommit = gitValue(deterministic.targetRepoRoot, ["rev-parse", "--verify", "HEAD^{commit}"], "target repository HEAD");
  if (!isAncestor(deterministic.targetRepoRoot, baselineCommit, targetCommit)) {
    throw new Error("existing task worktree HEAD is not an ancestor of target repository HEAD; refusing fallback or baseline rebinding");
  }
  return validateCandidate(task, { ...deterministic, baselineCommit });
}

/** Revalidate attempt facts against the deterministic worktree before acceptance. */
export function validateTaskWorkspaceAttempt(taskHandle, facts) {
  if (arguments.length !== 2) throw new TypeError("validateTaskWorkspaceAttempt requires TaskHandle and attempt facts");
  const task = assertTaskHandle(taskHandle);
  if (typeof facts?.baseline_commit !== "string" || !/^[a-f0-9]{40}$/i.test(facts.baseline_commit)) throw new Error("make-decision attempt baseline_commit must be a full Git commit OID");
  return validateCandidate(task, { ...deterministicWorkspace(task), baselineCommit: facts.baseline_commit }, facts);
}

/** Open the Workspace named only by the accepted make-decision result. */
export function openAcceptedWorkspace(taskHandle, accepted) {
  if (arguments.length !== 2) throw new TypeError("openAcceptedWorkspace requires TaskHandle and accepted make-decision result");
  const task = assertTaskHandle(taskHandle);
  const facts = accepted?.facts;
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) throw new Error("make-decision accepted result must contain facts");
  if (typeof facts.worktree_root !== "string" || !isAbsolute(facts.worktree_root)) throw new Error("make-decision accepted facts.worktree_root must be absolute");
  if (typeof facts.baseline_commit !== "string" || !/^[a-f0-9]{40}$/i.test(facts.baseline_commit.trim())) throw new Error("make-decision accepted facts.baseline_commit must be a Git commit OID");
  const expected = acceptedWorkspaceExpectation(task);
  if (resolve(facts.worktree_root) !== expected.worktreeRoot) throw new Error("accepted worktree_root does not match the deterministic task worktree");
  const worktreeRoot = realGitToplevel(expected.worktreeRoot, "accepted worktree_root");
  const targetRepoRoot = expected.targetRepoRoot;
  if (worktreeRoot !== expected.worktreeRoot) throw new Error("accepted task worktree realpath changed");
  assertWorktreeRegistration(expected, "accepted Workspace");
  if (gitCommonDir(worktreeRoot) !== gitCommonDir(targetRepoRoot)) throw new Error("accepted worktree and target repo must share a Git common directory");
  if (gitValue(worktreeRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"], "accepted Workspace branch") !== expected.branch) {
    throw new Error(`accepted Workspace must use deterministic branch ${expected.branch}`);
  }
  gitValue(worktreeRoot, ["cat-file", "-e", `${facts.baseline_commit.trim()}^{commit}`], "baseline commit");
  const identityStat = lstatSync(worktreeRoot);
  const validateWorkspace = () => {
    const current = lstatSync(worktreeRoot);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identityStat.dev || current.ino !== identityStat.ino || realpathSync(worktreeRoot) !== worktreeRoot) {
      throw new Error(`Workspace directory identity changed: ${worktreeRoot}`);
    }
    assertWorktreeRegistration(expected, "Workspace");
    if (gitCommonDir(worktreeRoot) !== gitCommonDir(targetRepoRoot)) throw new Error("Workspace Git common directory changed");
    if (gitValue(worktreeRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"], "Workspace branch") !== expected.branch) {
      throw new Error(`Workspace branch changed from deterministic branch ${expected.branch}`);
    }
    return true;
  };
  const workspace = { baselineCommit: facts.baseline_commit.trim() };
  Object.defineProperty(workspace, "worktreeRoot", { enumerable: true, get() { validateWorkspace(); return worktreeRoot; } });
  Object.defineProperty(workspace, "assertValid", { enumerable: false, value: validateWorkspace });
  WORKSPACES.add(workspace);
  WORKSPACE_BINDINGS.set(workspace, Object.freeze({ task, targetRepoRoot, worktreeRoot }));
  return Object.freeze(workspace);
}

/** Open the live task worktree without consulting lifecycle/audit records. */
export function openCurrentTaskWorkspace(taskHandle) {
  if (arguments.length !== 1) throw new TypeError("openCurrentTaskWorkspace accepts only a TaskHandle");
  const task = assertTaskHandle(taskHandle);
  // Migration lineage supplies only the current worktree location; it does
  // not read or require an accepted stage result.
  const expected = acceptedWorkspaceExpectation(task);
  const worktreeRoot = realGitToplevel(expected.worktreeRoot, "current task worktree");
  if (worktreeRoot !== expected.worktreeRoot) throw new Error("current task worktree realpath changed");
  assertWorktreeRegistration(expected, "current task Workspace");
  if (gitCommonDir(worktreeRoot) !== gitCommonDir(expected.targetRepoRoot)) {
    throw new Error("current task Workspace and target repo must share a Git common directory");
  }
  if (gitValue(worktreeRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"], "current task Workspace branch") !== expected.branch) {
    throw new Error(`current task Workspace must use deterministic branch ${expected.branch}`);
  }
  const identityStat = lstatSync(worktreeRoot);
  const validateWorkspace = () => {
    const current = lstatSync(worktreeRoot);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identityStat.dev || current.ino !== identityStat.ino || realpathSync(worktreeRoot) !== worktreeRoot) {
      throw new Error(`Workspace directory identity changed: ${worktreeRoot}`);
    }
    assertWorktreeRegistration(expected, "current task Workspace");
    if (gitCommonDir(worktreeRoot) !== gitCommonDir(expected.targetRepoRoot)) {
      throw new Error("current task Workspace Git common directory changed");
    }
    if (gitValue(worktreeRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"], "current task Workspace branch") !== expected.branch) {
      throw new Error(`current task Workspace branch changed from deterministic branch ${expected.branch}`);
    }
    return true;
  };
  const workspace = { baselineCommit: gitValue(worktreeRoot, ["rev-parse", "HEAD"], "current task worktree HEAD") };
  Object.defineProperty(workspace, "worktreeRoot", { enumerable: true, get() { validateWorkspace(); return worktreeRoot; } });
  Object.defineProperty(workspace, "assertValid", { enumerable: false, value: validateWorkspace });
  WORKSPACES.add(workspace);
  WORKSPACE_BINDINGS.set(workspace, Object.freeze({ task, targetRepoRoot: expected.targetRepoRoot, worktreeRoot }));
  return Object.freeze(workspace);
}

/** Mint a restart-safe remove executor from authenticated accepted facts. */
export function createTaskWorktreeRemoval(taskHandle, acceptedBinding) {
  if (arguments.length !== 2) throw new TypeError("createTaskWorktreeRemoval requires TaskHandle and authenticated accepted binding");
  const task = assertTaskHandle(taskHandle);
  const expected = acceptedWorkspaceExpectation(task);
  if (acceptedBinding?.taskId !== task.identity.taskId || acceptedBinding?.stage !== "make-decision") {
    throw new Error("authenticated accepted make-decision identity mismatch for worktree removal");
  }
  if (resolve(acceptedBinding?.worktreeRoot ?? "") !== expected.worktreeRoot || typeof acceptedBinding?.baselineCommit !== "string" || !/^[a-f0-9]{40}$/i.test(acceptedBinding.baselineCommit)) {
    throw new Error("accepted make-decision does not match the deterministic task worktree");
  }
  gitValue(expected.targetRepoRoot, ["cat-file", "-e", `${acceptedBinding.baselineCommit}^{commit}`], "accepted worktree baseline");
  const observe = () => {
    const pathExists = existsSync(expected.worktreeRoot);
    const registration = registeredWorktree(expected.targetRepoRoot, expected.worktreeRoot);
    if (!pathExists && !registration) return { satisfied: true, worktree_root: expected.worktreeRoot };
    if (pathExists !== Boolean(registration)) throw new Error("task worktree path/registration mismatch during removal");
    if (registration.branch !== `refs/heads/${expected.branch}`) throw new Error(`task worktree registration changed from deterministic branch ${expected.branch}`);
    const realWorktree = realGitToplevel(expected.worktreeRoot, "task worktree removal target");
    if (realWorktree !== expected.worktreeRoot) throw new Error("task worktree removal target realpath changed");
    if (gitCommonDir(realWorktree) !== gitCommonDir(expected.targetRepoRoot)) throw new Error("task worktree removal target Git common directory changed");
    if (gitValue(realWorktree, ["symbolic-ref", "--quiet", "--short", "HEAD"], "task worktree removal branch") !== expected.branch) {
      throw new Error(`task worktree removal target branch changed from ${expected.branch}`);
    }
    return { satisfied: false, worktree_root: expected.worktreeRoot };
  };
  return Object.freeze({
    probe: observe,
    execute: async () => {
      if (observe().satisfied) return;
      const cleanup = inspectWorktreeCleanup(expected.worktreeRoot);
      if (!cleanup.safe) throw cleanupError(cleanup);
      for (const entry of cleanup.ignored_generated) removeKnownIgnoredGenerated(expected.worktreeRoot, entry);
      const afterCleanup = inspectWorktreeCleanup(expected.worktreeRoot);
      if (!afterCleanup.safe) throw cleanupError(afterCleanup);
      execFileSync("git", ["worktree", "remove", "--", expected.worktreeRoot], { cwd: expected.targetRepoRoot, stdio: ["ignore", "pipe", "pipe"] });
    },
    verify: async (value) => value.satisfied === true && value.worktree_root === expected.worktreeRoot,
  });
}
