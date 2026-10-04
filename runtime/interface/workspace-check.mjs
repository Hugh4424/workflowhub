import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function failure(code, message, facts = {}) {
  return Object.assign(new Error(message), { code, ...facts });
}

function git(cwd, args, { detached = false } = {}) {
  // Inspect the directories supplied by the caller, independently of any
  // repository selection inherited from a Git hook or another Git command.
  const env = { ...process.env };
  // Configuration injection and discovery limits can also override/reject
  // the supplied repository. Metadata reads must use this cwd's own context.
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  try {
    return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
  } catch (cause) {
    if (detached && cause.status === 1) return null;
    throw failure("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed in ${cwd}: ${String(cause.stderr ?? cause.message).trim()}`, {
      cause, argv: ["git", ...args], cwd, exitCode: cause.status, stderr: String(cause.stderr ?? ""),
    });
  }
}

function directory(path, label) {
  if (typeof path !== "string" || !path) throw failure("INVALID_ARGUMENT", `${label} is required`);
  try { return realpathSync(resolve(path)); }
  catch (cause) {
    if (cause.code === "ENOENT" || cause.code === "ENOTDIR") {
      throw failure("NOT_A_WORKTREE", `${label} does not name an existing worktree directory: ${path}`, { cause });
    }
    throw cause;
  }
}

function topLevel(path, label) {
  let top;
  try {
    const raw = git(path, ["rev-parse", "--show-toplevel"]);
    top = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  }
  catch (error) {
    if (error.stderr?.includes("not a git repository") || error.stderr?.includes("must be run in a work tree")) {
      throw failure("NOT_A_WORKTREE", `${label} is not a Git worktree: ${path}`, { cause: error });
    }
    throw error;
  }
  if (realpathSync(top) !== path) throw failure("NOT_A_WORKTREE", `${label} must name the worktree root, not a subdirectory: ${path}`);
  return path;
}

function worktreePaths(root) {
  const fields = git(root, ["worktree", "list", "--porcelain", "-z"]).split("\0");
  return fields.filter((field) => field.startsWith("worktree ")).map((field) => field.slice(9));
}

function statusEntries(raw) {
  const fields = raw.split("\0");
  if (fields.at(-1) !== "") throw failure("GIT_STATUS_INVALID", "porcelain status is not NUL terminated");
  const entries = [];
  for (let index = 0; index < fields.length - 1; index += 1) {
    const field = fields[index];
    if (field.length < 4 || field[2] !== " ") throw failure("GIT_STATUS_INVALID", "malformed porcelain v1 status record");
    const status = field.slice(0, 2);
    const path = field.slice(3);
    const entry = { status, path, category: status === "??" ? "untracked" : "tracked" };
    // With -z, Git emits destination first and the rename/copy source as a
    // second NUL-delimited field. That source is not another dirty entry.
    if (/[RC]/.test(status)) {
      const source = fields[++index];
      if (!source) throw failure("GIT_STATUS_INVALID", "rename/copy status lacks a source path");
      entry.source_path = source;
    }
    entries.push(entry);
  }
  return entries;
}

export async function inspectWorkspace({ root, target, baseline, expectBranch } = {}) {
  if (typeof baseline !== "string" || !baseline || baseline.startsWith("-") || baseline.includes("\0")) {
    throw failure("INVALID_ARGUMENT", "baseline must be an explicit Git revision, without option syntax");
  }
  if (expectBranch !== undefined && (typeof expectBranch !== "string" || !expectBranch)) {
    throw failure("INVALID_ARGUMENT", "expectBranch must be a nonempty branch name");
  }
  const repository = topLevel(directory(root, "root"), "root");
  const workspace = topLevel(directory(target, "target"), "target");
  const registered = worktreePaths(repository).some((path) => resolve(path) === workspace);
  if (!registered) throw failure("NOT_A_WORKTREE", `target is not registered with root: ${workspace}`, { root: repository, target: workspace });
  const branchRaw = git(workspace, ["symbolic-ref", "--quiet", "--short", "HEAD"], { detached: true });
  const branch = branchRaw === null ? null : branchRaw.trimEnd();
  const head = git(workspace, ["rev-parse", "--verify", "HEAD^{commit}"]).trim();
  if (expectBranch !== undefined && branch !== expectBranch) {
    throw failure("BRANCH_MISMATCH", `expected branch ${expectBranch}, actual branch ${branch ?? "detached HEAD"}`, { branch, expected_branch: expectBranch, head });
  }
  const entries = statusEntries(git(workspace, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]));
  const counts = {
    tracked: entries.filter((entry) => entry.category === "tracked").length,
    staged: entries.filter((entry) => entry.category === "tracked" && entry.status[0] !== " ").length,
    unstaged: entries.filter((entry) => entry.category === "tracked" && entry.status[1] !== " ").length,
    untracked: entries.filter((entry) => entry.category === "untracked").length,
  };
  const changed = git(workspace, ["diff", "--name-only", "-z", baseline, "--"]).split("\0").filter(Boolean);
  for (const entry of entries) {
    changed.push(entry.path);
    if (entry.source_path) changed.push(entry.source_path);
  }
  return {
    registered, branch, head, dirty: counts.tracked + counts.untracked,
    counts, dirty_paths: entries.map((entry) => entry.path).sort(),
    changed_paths: [...new Set(changed)].sort(),
  };
}

function requireClean(result) {
  if (result.dirty > 0) throw failure("DIRTY_TARGET", `target has ${result.dirty} dirty paths: ${result.dirty_paths.join(", ")}`, { facts: result });
}

export async function assertCleanTarget(options) {
  requireClean(await inspectWorkspace(options));
}

async function main(argv) {
  const options = {};
  let clean = false;
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === "--clean") {
      if (clean) throw failure("INVALID_ARGUMENT", "duplicate --clean");
      clean = true;
      continue;
    }
    const field = { "--root": "root", "--target": "target", "--baseline": "baseline", "--expect-branch": "expectBranch" }[key];
    const value = argv[++index];
    if (!field || !value || value.startsWith("--") || options[field] !== undefined) throw failure("INVALID_ARGUMENT", `unknown, missing or duplicate option: ${key}`);
    options[field] = value;
  }
  const result = await inspectWorkspace(options);
  if (clean) requireClean(result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "WORKSPACE_CHECK_FAILED", message: error.message, ...(error.facts ? { facts: error.facts } : {}) })}\n`);
    process.exitCode = 1;
  });
}
