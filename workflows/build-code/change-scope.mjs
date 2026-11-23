import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";
import { assertWorkspace } from "../../runtime/task/workspace.mjs";

function git(root, argv) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: "0" };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_") && key !== "GIT_OPTIONAL_LOCKS") delete env[key];
  return execFileSync("git", argv, { cwd: root, env, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}
function safePath(path) {
  if (!path || isAbsolute(path) || path.split("/").some(part => part === "." || part === "..")) throw new Error("Git change scope contains an unsafe path");
  return path;
}

// The single Git read shared by every entry: baseline-to-worktree diff plus
// untracked files, with rename sources retained as changed paths.
function readGitChangeSet(root, base) {
  const fields = git(root, ["diff", "--no-ext-diff", "--name-status", "-z", "-M", base, "--"]).split("\0").filter(Boolean);
  const changes = [], paths = new Set();
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!/^(?:[A-Z]|R\d{1,3}|C\d{1,3})$/.test(status)) throw new Error(`Git diff status is invalid: ${status}`);
    const renamed = /^[RC]\d/.test(status), old = renamed ? safePath(fields[index++]) : null, path = safePath(fields[index++]);
    if (old) paths.add(old);
    paths.add(path);
    changes.push({ status, ...(old ? { old_path: old } : {}), path });
  }
  for (const path of git(root, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean)) {
    safePath(path); paths.add(path); changes.push({ status: "?", path });
  }
  return { changes, changed_paths: [...paths].sort() };
}
function recorded(taskId, base, head, branch, set) {
  return Object.freeze({ status: "recorded", ...(taskId === undefined ? {} : { task_id: taskId }),
    baseline_commit: base, head, branch,
    changed_paths: Object.freeze(set.changed_paths), changes: Object.freeze(set.changes.map(Object.freeze)) });
}
function unknownChangeScope(taskId, error) {
  return Object.freeze({ status: "unknown_change_scope", ...(taskId === undefined ? {} : { task_id: taskId }),
    reason: `Git change scope collection failed: ${error?.message ?? error}`, error_code: error?.code ?? null,
    changed_paths: Object.freeze([]) });
}

/** Return actual Git baseline-to-worktree changes; no snapshot object or receipt authentication. */
export async function capturePreExecutionTaskChangeScope({ workspace, baseline = workspace?.baselineCommit, taskId } = {}) {
  try {
    if (!workspace || typeof workspace !== "object") throw new TypeError("plain workspace metadata is required");
    // Retain the existing linked .git single-link/common-repository boundary;
    // registration by the old root alone does not authenticate target metadata.
    await assertWorkspace({ ...workspace, baselineCommit: baseline });
    const physical = await inspectWorkspace({ root: workspace.targetRepoRoot, target: workspace.worktreeRoot,
      baseline, ...(workspace.branch ? { expectBranch: workspace.branch } : {}) });
    const base = git(workspace.worktreeRoot, ["rev-parse", "--verify", `${baseline}^{commit}`]).trim();
    return recorded(taskId, base, physical.head, physical.branch, readGitChangeSet(workspace.worktreeRoot, base));
  } catch (error) {
    return unknownChangeScope(taskId, error);
  }
}

/**
 * Synchronous sibling for the synchronously assembled review packet and readiness
 * cursor. It performs no authentication of its own: the caller hands in the
 * workspace metadata it has already authenticated, so this only reads Git and
 * names the real failure instead of reporting an empty range.
 */
export function collectTaskChangeScope({ workspace, baseline = workspace?.baselineCommit, taskId } = {}) {
  try {
    if (!workspace || typeof workspace !== "object") throw new TypeError("plain workspace metadata is required");
    for (const key of ["worktreeRoot", "targetRepoRoot"]) {
      if (typeof workspace[key] !== "string" || !isAbsolute(workspace[key])) throw new TypeError(`workspace ${key} must be an absolute path`);
    }
    if (typeof baseline !== "string" || !baseline || baseline.startsWith("-")) throw new TypeError("an explicit baseline revision is required");
    const root = realpathSync(workspace.worktreeRoot);
    const base = git(root, ["rev-parse", "--verify", `${baseline}^{commit}`]).trim();
    const branch = (() => { try { return git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).trim(); } catch { return null; } })();
    const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]).trim();
    return recorded(taskId, base, head, branch, readGitChangeSet(root, base));
  } catch (error) {
    return unknownChangeScope(taskId, error);
  }
}

export { capturePreExecutionTaskChangeScope as captureTaskChangeScope };
