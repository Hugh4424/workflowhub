import { lstatSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isAbsolute, resolve } from "node:path";
import { assertTaskHandle } from "./task-handle.mjs";

const WORKSPACES = new WeakSet();
const CANDIDATE_WORKSPACES = new WeakSet();

function gitValue(cwd, args, label) {
  try { return String(execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
  catch (error) { throw new Error(`${label} validation failed: ${error.stderr?.toString().trim() || error.message}`); }
}

function gitCommonDir(root) {
  const value = gitValue(root, ["rev-parse", "--git-common-dir"], "git common dir");
  return realpathSync(isAbsolute(value) ? value : resolve(root, value));
}

export function assertWorkspace(value) {
  if (!value || typeof value !== "object" || !WORKSPACES.has(value)) throw new TypeError("authentic Workspace capability required");
  value.assertValid();
  return value;
}

export function assertCandidateWorkspace(value) {
  if (!value || typeof value !== "object" || !CANDIDATE_WORKSPACES.has(value)) throw new TypeError("authentic CandidateWorkspace capability required");
  value.assertValid();
  return value;
}

export function openCandidateWorkspace(taskHandle, { worktreeRoot, baselineCommit } = {}) {
  const task = assertTaskHandle(taskHandle);
  if (typeof worktreeRoot !== "string" || !isAbsolute(worktreeRoot)) throw new TypeError("candidate worktreeRoot must be absolute");
  if (typeof baselineCommit !== "string" || !/^[a-f0-9]{40}$/i.test(baselineCommit)) throw new TypeError("candidate baselineCommit must be a Git commit OID");
  const requestedRoot = resolve(worktreeRoot);
  const stat = lstatSync(requestedRoot);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`candidate worktreeRoot must be a real directory: ${requestedRoot}`);
  const realWorktree = realpathSync(requestedRoot);
  const targetRepoRoot = realpathSync(task.manifest.target_repo_root);
  if (realpathSync(gitValue(realWorktree, ["rev-parse", "--show-toplevel"], "candidate worktree root")) !== realWorktree) throw new Error("candidate Workspace must be a Git toplevel directory");
  if (realpathSync(gitValue(targetRepoRoot, ["rev-parse", "--show-toplevel"], "candidate target root")) !== targetRepoRoot) throw new Error("candidate target repository must be a Git toplevel directory");
  if (gitCommonDir(realWorktree) !== gitCommonDir(targetRepoRoot)) throw new Error("candidate worktree and target repo must share a Git common directory");
  gitValue(realWorktree, ["cat-file", "-e", `${baselineCommit}^{commit}`], "candidate baseline commit");
  const candidateHead = gitValue(realWorktree, ["rev-parse", "HEAD"], "candidate HEAD");
  if (candidateHead !== baselineCommit) throw new Error("candidate baselineCommit must equal worktree HEAD");
  const identity = lstatSync(realWorktree);
  const validate = () => {
    const current = lstatSync(realWorktree);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino || realpathSync(realWorktree) !== realWorktree) throw new Error(`CandidateWorkspace directory identity changed: ${realWorktree}`);
    return true;
  };
  const candidate = { baselineCommit, targetRepoRoot };
  Object.defineProperty(candidate, "worktreeRoot", { enumerable: true, get() { validate(); return realWorktree; } });
  Object.defineProperty(candidate, "assertValid", { enumerable: false, value: validate });
  CANDIDATE_WORKSPACES.add(candidate);
  return Object.freeze(candidate);
}

export function openWorkspace(accepted, manifest) {
  const facts = accepted?.facts;
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) throw new Error("make-decision accepted result must contain facts");
  if (typeof facts.worktree_root !== "string" || !isAbsolute(facts.worktree_root)) throw new Error("make-decision accepted facts.worktree_root must be absolute");
  if (typeof facts.baseline_commit !== "string" || facts.baseline_commit.trim() === "") throw new Error("make-decision accepted facts.baseline_commit is required");
  const requestedRoot = resolve(facts.worktree_root);
  const stat = lstatSync(requestedRoot);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`accepted worktree_root must be a real directory: ${requestedRoot}`);
  const worktreeRoot = realpathSync(requestedRoot);
  const targetRepoRoot = realpathSync(manifest.target_repo_root);
  const worktreeTop = realpathSync(gitValue(worktreeRoot, ["rev-parse", "--show-toplevel"], "worktree root"));
  const targetTop = realpathSync(gitValue(targetRepoRoot, ["rev-parse", "--show-toplevel"], "target repo root"));
  if (worktreeTop !== worktreeRoot || targetTop !== targetRepoRoot) throw new Error("workspace roots must be Git toplevel directories");
  if (gitCommonDir(worktreeRoot) !== gitCommonDir(targetRepoRoot)) throw new Error("accepted worktree and target repo must share a Git common directory");
  gitValue(worktreeRoot, ["cat-file", "-e", `${facts.baseline_commit.trim()}^{commit}`], "baseline commit");
  const identityStat = lstatSync(worktreeRoot);
  const validateWorkspace = () => {
    const current = lstatSync(worktreeRoot);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identityStat.dev || current.ino !== identityStat.ino || realpathSync(worktreeRoot) !== worktreeRoot) {
      throw new Error(`Workspace directory identity changed: ${worktreeRoot}`);
    }
    return true;
  };
  const workspace = { baselineCommit: facts.baseline_commit.trim() };
  Object.defineProperty(workspace, "worktreeRoot", { enumerable: true, get() { validateWorkspace(); return worktreeRoot; } });
  Object.defineProperty(workspace, "assertValid", { enumerable: false, value: validateWorkspace });
  WORKSPACES.add(workspace);
  return Object.freeze(workspace);
}
