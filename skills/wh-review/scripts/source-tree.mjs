import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(root, args, { encoding = "utf8", env } = {}) {
  try {
    return execFileSync("git", args, { cwd: root, encoding, env, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const detail = String(error.stderr ?? error.message).trim();
    throw new Error(`source tree git command failed: git ${args.join(" ")}: ${detail}`);
  }
}

function repositoryRoot(root) {
  const resolved = realpathSync(resolve(root));
  const gitRoot = realpathSync(resolve(resolved, String(git(resolved, ["rev-parse", "--show-toplevel"])).trim()));
  if (gitRoot !== resolved) throw new Error("repository root must be the host git repository root");
  return resolved;
}

function treeOid(root, revision) {
  if (typeof revision !== "string" || !revision) throw new TypeError("tree revision is required");
  return String(git(root, ["rev-parse", "--verify", `${revision}^{tree}`])).trim();
}

function reviewRef(root, ref) {
  if (typeof ref !== "string" || !/^refs\/workflowhub\/review\/[A-Za-z0-9._/-]+$/.test(ref) || ref.includes("..") || ref.endsWith("/")) throw new TypeError("invalid review tree ref");
  return ref;
}

function safeRelativePath(path) {
  return typeof path === "string" && path.length > 0 && !path.includes("\\") && !path.startsWith("/")
    && !path.split("/").some((part) => !part || part === "." || part === "..");
}

function blob(root, tree, path) {
  return git(root, ["show", `${tree}:${path}`], { encoding: "buffer" });
}

function assertNotGitlink(root, tree, path) {
  const entry = String(git(root, ["ls-tree", "-z", tree, "--", path]));
  const match = entry.match(/^(\d+)\s+(\w+)\s+[0-9a-f]+\t/);
  if (match?.[1] !== "160000" && match?.[2] !== "commit") return;
  const error = new Error(`UNSUPPORTED_GITLINK_SOURCE: ${path} is a nested repository gitlink`);
  error.code = "UNSUPPORTED_GITLINK_SOURCE";
  throw error;
}

function parseNameStatus(output) {
  const fields = String(output).split("\0");
  const entries = [];
  for (let index = 0; index < fields.length - 1;) {
    const token = fields[index++];
    if (!token) continue;
    const kind = token[0];
    if (!["A", "M", "D", "R", "T"].includes(kind)) throw new Error(`unsupported source tree change status: ${token}`);
    const oldPath = kind === "R" ? fields[index++] : null;
    const path = fields[index++];
    if (!safeRelativePath(path) || (oldPath !== null && !safeRelativePath(oldPath))) throw new Error("source tree contains an unsafe path");
    entries.push({ kind, path, oldPath });
  }
  return entries;
}

export function headTree(root) {
  const repository = repositoryRoot(root);
  return treeOid(repository, "HEAD");
}

export function capturedHead(root) {
  const repository = repositoryRoot(root);
  return String(git(repository, ["rev-parse", "--verify", "HEAD^{commit}"])).trim();
}

export function captureWorktreeTree(root, { baseTree, excludePaths = [] } = {}) {
  const repository = repositoryRoot(root);
  const base = treeOid(repository, baseTree ?? "HEAD");
  if (!Array.isArray(excludePaths) || excludePaths.some((path) => !safeRelativePath(path))) throw new TypeError("source tree exclusions must be safe repository-relative paths");
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "wh-review-index-"));
  const temporaryIndex = join(temporaryDirectory, "index");
  try {
    const env = { ...process.env, GIT_INDEX_FILE: temporaryIndex };
    git(repository, ["read-tree", base], { env });
    git(repository, ["add", "-A", "--", ".", ...excludePaths.map((path) => `:(exclude)${path}`)], { env });
    return String(git(repository, ["write-tree"], { env })).trim();
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

export function buildTreeMaterial(root, { baseTree, snapshotTree } = {}) {
  const repository = repositoryRoot(root);
  const base = treeOid(repository, baseTree);
  const snapshot = treeOid(repository, snapshotTree);
  const changes = parseNameStatus(git(repository, ["diff", "--name-status", "-z", "--find-renames", base, snapshot]));
  for (const { kind, path, oldPath } of changes) {
    if (kind !== "D") assertNotGitlink(repository, snapshot, path);
    if (kind !== "A") assertNotGitlink(repository, base, oldPath ?? path);
  }
  const unified_diff = String(git(repository, ["diff", "--no-ext-diff", "--no-textconv", "--binary", "--find-renames", "--full-index", base, snapshot]));
  const changed_files = changes.map(({ kind, path, oldPath }) => {
    const entry = { path, status: ({ A: "added", M: "modified", D: "deleted", R: "renamed", T: "modified" })[kind] };
    if (oldPath !== null) entry.old_path = oldPath;
    if (kind !== "D") {
      const bytes = blob(repository, snapshot, path);
      entry.sha256 = sha256(bytes); entry.size = bytes.length;
    }
    if (kind !== "A") {
      const bytes = blob(repository, base, oldPath ?? path);
      entry.old_sha256 = sha256(bytes); entry.old_size = bytes.length;
    }
    return entry;
  });
  return { source_revision: { base_tree: base, snapshot_tree: snapshot }, unified_diff, changed_files };
}

export function assertCurrentTree(root, expectedTree) {
  const repository = repositoryRoot(root);
  const expected = treeOid(repository, expectedTree);
  const current = captureWorktreeTree(repository, { baseTree: expected });
  if (current !== expected) {
    const error = new Error(`WORKTREE_DRIFT_AFTER_REVIEW: current tree ${current} differs from approved tree ${expected}`);
    error.code = "WORKTREE_DRIFT_AFTER_REVIEW";
    throw error;
  }
  return current;
}

export function updateReviewTreeRef(root, ref, tree) {
  const repository = repositoryRoot(root);
  const name = reviewRef(repository, ref);
  const oid = treeOid(repository, tree);
  git(repository, ["update-ref", name, oid]);
  return oid;
}

export function readReviewTreeRef(root, ref) {
  const repository = repositoryRoot(root);
  const name = reviewRef(repository, ref);
  try { return String(execFileSync("git", ["rev-parse", "--verify", `${name}^{tree}`], { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
  catch { return null; }
}

export function deleteReviewTreeRef(root, ref) {
  const repository = repositoryRoot(root);
  const name = reviewRef(repository, ref);
  try { execFileSync("git", ["show-ref", "--verify", "--quiet", name], { cwd: repository, stdio: "ignore" }); }
  catch (error) {
    if (error?.status === 1) return;
    throw new Error(`review tree ref presence check failed: ${String(error.stderr ?? error.message).trim()}`);
  }
  git(repository, ["update-ref", "-d", name]);
}
