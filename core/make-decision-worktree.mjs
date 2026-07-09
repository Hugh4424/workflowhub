#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { resolveTaskRecordPaths } from "./task-record-paths.mjs";

const BRANCH_SLUG_RE = /^[a-z]+(-[a-z]+){1,2}$/;

function fail(message) {
  process.stderr.write(`[make-decision-worktree] FAIL: ${message}\n`);
  process.exit(1);
}

export function expandHome(value) {
  const text = String(value || "");
  return text === "~" || text.startsWith("~/") ? text.replace(/^~/, homedir()) : text;
}

export function normalizeRemoteUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

export function branchSlugFromTaskId(taskId) {
  const normalized = String(taskId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const parts = normalized.split("-").filter(Boolean);
  for (let start = 0; start < parts.length; start += 1) {
    const candidate = parts.slice(start).join("-");
    if (BRANCH_SLUG_RE.test(candidate)) return candidate;
  }
  throw new Error(
    `task_id "${taskId}" cannot derive a branch slug matching ${BRANCH_SLUG_RE}. ` +
      `Use 2-3 lowercase alphabetic words after optional module prefix.`
  );
}

function git(args, cwd) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseConfig(configPath) {
  const resolved = resolve(expandHome(configPath || "~/.workflowhub/config.json"));
  if (!existsSync(resolved)) throw new Error(`config not found: ${resolved}`);
  return JSON.parse(readFileSync(resolved, "utf8"));
}

export function resolveTargetRepoRoot({ cwd = process.cwd(), configPath } = {}) {
  const config = parseConfig(configPath);
  const remote = git(["remote", "get-url", "origin"], cwd);
  const normalizedRemote = normalizeRemoteUrl(remote);
  const repoRootMap = config.repo_root_map;
  if (!repoRootMap || typeof repoRootMap !== "object") {
    throw new Error("repo_root_map missing from ~/.workflowhub/config.json");
  }

  for (const [configuredRemote, configuredRoot] of Object.entries(repoRootMap)) {
    if (normalizeRemoteUrl(configuredRemote) !== normalizedRemote) continue;
    const candidate = resolve(expandHome(String(configuredRoot)));
    if (!existsSync(candidate) || !statSync(candidate).isDirectory()) break;
    const topLevel = git(["rev-parse", "--show-toplevel"], candidate);
    const candidateRemote = git(["remote", "get-url", "origin"], candidate);
    if (resolve(topLevel) === candidate && normalizeRemoteUrl(candidateRemote) === normalizedRemote) {
      return candidate;
    }
    break;
  }

  throw new Error(
    `no valid repo_root_map entry for remote "${remote}". ` +
      `configured keys: ${Object.keys(repoRootMap).join(", ")}`
  );
}

function branchExists(targetRepoRoot, branch) {
  try {
    git(["rev-parse", "--verify", `refs/heads/${branch}`], targetRepoRoot);
    return true;
  } catch {
    return false;
  }
}

function parseWorktrees(text) {
  const entries = [];
  let current = null;
  for (const line of text.split(/\n/)) {
    if (line.startsWith("worktree ")) {
      current = { worktree: line.slice("worktree ".length) };
      entries.push(current);
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    }
  }
  return entries;
}

export function validateActiveWorktree({ targetRepoRoot, worktreeRoot, branch }) {
  if (!existsSync(worktreeRoot) || !statSync(worktreeRoot).isDirectory()) {
    throw new Error(`worktree_root missing: ${worktreeRoot}`);
  }
  const entries = parseWorktrees(git(["worktree", "list", "--porcelain"], targetRepoRoot));
  const entry = entries.find((item) => resolve(item.worktree) === resolve(worktreeRoot));
  if (!entry) throw new Error(`worktree_root not registered in target repo: ${worktreeRoot}`);
  if (entry.branch !== branch) {
    throw new Error(`worktree branch mismatch: expected ${branch}, got ${entry.branch || "<none>"}`);
  }
}

function writeWorktreeJsonAtomic(path, record) {
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`);
  renameSync(tmp, path);
}

export function ensureMakeDecisionWorktree({ taskId, cwd = process.cwd(), configPath } = {}) {
  if (!taskId) throw new Error("taskId is required");
  const taskRecords = resolveTaskRecordPaths(taskId);
  mkdirSync(taskRecords.task_root, { recursive: true });

  const targetRepoRoot = resolveTargetRepoRoot({ cwd, configPath });
  const slug = branchSlugFromTaskId(taskId);
  const branch = `workflowhub/${slug}`;
  const worktreeRoot = join(dirname(targetRepoRoot), `${basename(targetRepoRoot)}-${slug}`);

  if (existsSync(taskRecords.worktree_json)) {
    const existing = JSON.parse(readFileSync(taskRecords.worktree_json, "utf8"));
    if (existing.status !== "active") throw new Error(`worktree.json status is not active: ${existing.status}`);
    if (existing.target_repo_root !== targetRepoRoot) {
      throw new Error(`worktree.json target_repo_root mismatch: ${existing.target_repo_root} !== ${targetRepoRoot}`);
    }
    validateActiveWorktree({ targetRepoRoot, worktreeRoot: existing.worktree_root, branch: existing.branch });
    return { action: "reuse", path: taskRecords.worktree_json, record: existing };
  }

  if (existsSync(worktreeRoot)) {
    validateActiveWorktree({ targetRepoRoot, worktreeRoot, branch });
  } else if (branchExists(targetRepoRoot, branch)) {
    execFileSync("git", ["-C", targetRepoRoot, "worktree", "add", worktreeRoot, branch], { stdio: "inherit" });
  } else {
    execFileSync("git", ["-C", targetRepoRoot, "worktree", "add", "-b", branch, worktreeRoot], { stdio: "inherit" });
  }

  validateActiveWorktree({ targetRepoRoot, worktreeRoot, branch });
  const record = {
    target_repo_root: targetRepoRoot,
    worktree_root: worktreeRoot,
    branch,
    created_by_stage: "make-decision",
    push_policy: "verify-code-only",
    status: "active",
  };
  writeWorktreeJsonAtomic(taskRecords.worktree_json, record);
  return { action: "create", path: taskRecords.worktree_json, record };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try {
    const taskId = process.argv[2];
    const result = ensureMakeDecisionWorktree({ taskId });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}
