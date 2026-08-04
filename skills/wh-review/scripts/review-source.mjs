import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, copyFileSync, existsSync, mkdtempSync, openSync, readSync, realpathSync, rmSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { reviewSourceForWorkspace } from "../../../runtime/task/workspace.mjs";
import { isRuntimeOnlyPath } from "../../../runtime/evidence/canonical-utils.mjs";

const CHUNK_BYTES = 64 * 1024;

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

// This helper is deliberately restricted to bounded Git facts (object IDs,
// one tree entry, and configuration values). Review payloads are always sent
// to caller-owned files through runGitToFile(), never collected in memory.
function git(cwd, args, options = {}) {
  try {
    return execFileSync("git", args, { cwd, ...options });
  } catch (error) {
    fail("SOURCE_UNAVAILABLE", error.stderr?.toString().trim() || error.message);
  }
}

function text(cwd, args, options = {}) {
  return git(cwd, args, { encoding: "utf8", ...options }).trim();
}

function optionalText(cwd, args) {
  try { return execFileSync("git", args, { cwd, encoding: "utf8" }).trim(); }
  catch (error) {
    if (error.status === 1) return "";
    fail("SOURCE_UNAVAILABLE", error.stderr?.toString().trim() || error.message);
  }
}

function runGitToFile(cwd, args, destination, { env } = {}) {
  const fd = openSync(destination, "w", 0o600);
  try {
    const result = spawnSync("git", args, {
      cwd,
      env,
      stdio: ["ignore", fd, fd],
    });
    if (result.error || result.status !== 0) {
      fail("SOURCE_UNAVAILABLE", `git ${args[0]} exited ${result.status ?? "without status"}${result.error ? `: ${result.error.message}` : ""}`);
    }
  } finally {
    closeSync(fd);
  }
}

function inside(parent, child) {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function commonDir(root) {
  const value = text(root, ["rev-parse", "--git-common-dir"]);
  return realpathSync(isAbsolute(value) ? value : resolve(root, value));
}

function treeEntry(root, tree, path) {
  const output = git(root, ["ls-tree", "-z", tree, "--", path]);
  if (!output.length) return null;
  const record = output.subarray(0, output.indexOf(0));
  const tab = record.indexOf(9);
  const [mode, type, oid] = record.subarray(0, tab).toString("utf8").split(" ");
  return { mode, type, oid, size: type === "blob" ? Number(text(root, ["cat-file", "-s", oid])) : null };
}

function forEachNulRecord(path, onRecord) {
  const fd = openSync(path, "r");
  const chunk = Buffer.allocUnsafe(CHUNK_BYTES);
  let carry = Buffer.alloc(0);
  try {
    for (;;) {
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      const bytes = carry.length ? Buffer.concat([carry, chunk.subarray(0, count)]) : chunk.subarray(0, count);
      let start = 0;
      for (;;) {
        const end = bytes.indexOf(0, start);
        if (end < 0) break;
        onRecord(bytes.subarray(start, end).toString("utf8"));
        start = end + 1;
      }
      carry = Buffer.from(bytes.subarray(start));
    }
    if (carry.length) fail("SOURCE_UNAVAILABLE", `NUL-delimited Git output is incomplete: ${path}`);
  } finally {
    closeSync(fd);
  }
}

function parseChangedFiles(root, baseTree, snapshotTree, captureRoot) {
  const nameStatus = resolve(captureRoot, "name-status.z");
  runGitToFile(root, ["diff", "--name-status", "-z", "-M", baseTree, snapshotTree], nameStatus);
  const fields = [];
  forEachNulRecord(nameStatus, (record) => fields.push(record));
  const changed = [];
  for (let index = 0; index < fields.length;) {
    const token = fields[index++];
    const tab = token.indexOf("\t");
    const statusToken = tab >= 0 ? token.slice(0, tab) : token;
    const first = tab >= 0 ? token.slice(tab + 1) : fields[index++];
    if (typeof first !== "string") fail("SOURCE_UNAVAILABLE", "name-status output is incomplete");
    let oldPath = null;
    let path = first;
    if (statusToken.startsWith("R")) {
      oldPath = first;
      path = fields[index++];
      if (typeof path !== "string") fail("SOURCE_UNAVAILABLE", "rename name-status output is incomplete");
    }
    const oldEntry = treeEntry(root, baseTree, oldPath ?? path);
    const entry = treeEntry(root, snapshotTree, path);
    changed.push({
      path,
      old_path: oldPath,
      status: statusToken.startsWith("R") ? "renamed" : statusToken === "A" ? "added" : statusToken === "D" ? "deleted" : "modified",
      mode: entry?.mode ?? null,
      old_mode: oldEntry?.mode ?? null,
      blob: entry?.oid ?? null,
      old_blob: oldEntry?.oid ?? null,
      size: entry?.size ?? null,
      old_size: oldEntry?.size ?? null
    });
  }
  return changed.filter((entry) => !isRuntimeOnlyPath(entry.path) && !isRuntimeOnlyPath(entry.old_path));
}

function capture(root, head, indexFile, captureRoot, excludedPrefixes = []) {
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  git(root, ["read-tree", head], { env });
  git(root, ["add", "-A", "--", "."], { env });
  for (const prefix of excludedPrefixes) {
    if (typeof prefix !== "string" || prefix.length === 0 || prefix.startsWith("/") || prefix.includes("..")) {
      fail("SOURCE_UNAVAILABLE", "snapshot exclusion prefix is invalid");
    }
    git(root, ["reset", "-q", head, "--", prefix], { env });
  }
  const staged = resolve(captureRoot, `${relative(captureRoot, indexFile)}.stage.z`);
  runGitToFile(root, ["ls-files", "--stage", "-z"], staged, { env });
  let gitlink = false;
  forEachNulRecord(staged, (record) => { if (record.startsWith("160000 ")) gitlink = true; });
  if (gitlink) fail("SOURCE_UNAVAILABLE", "gitlink/submodule entries are not supported");
  return text(root, ["write-tree"], { env });
}

function isAncestor(root, ancestor, descendant) {
  try { execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: root, stdio: "ignore" }); return true; }
  catch (error) {
    if (error.status === 1) return false;
    fail("SOURCE_UNAVAILABLE", error.stderr?.toString().trim() || error.message);
  }
}

function hashFile(path) {
  const hash = createHash("sha256");
  const fd = openSync(path, "r");
  const chunk = Buffer.allocUnsafe(CHUNK_BYTES);
  try {
    for (;;) {
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      hash.update(chunk.subarray(0, count));
    }
  } finally {
    closeSync(fd);
  }
  return hash.digest("hex");
}

function sourceRecord({ source, targetCommit, capturedHead, baseCommit, baseTree, snapshotTree, diffPath, changedFiles, captureRoot, phaseEvidenceBinding }) {
  let disposed = false;
  const assertLive = () => { if (disposed || !existsSync(captureRoot)) fail("SOURCE_UNAVAILABLE", "review source capture has been released"); };
  const copySnapshotFile = (path, destination) => {
    assertLive();
    const entry = treeEntry(source, snapshotTree, path);
    if (!entry || entry.type !== "blob") fail("SOURCE_UNAVAILABLE", `snapshot file is missing: ${path}`);
    runGitToFile(source, ["cat-file", "blob", entry.oid], destination);
    return Object.freeze({ bytes: statSync(destination).size, sha256: hashFile(destination) });
  };
  return Object.freeze({
    sourceRoot: source,
    targetCommit,
    capturedHead,
    baseCommit,
    baseTree,
    snapshotTree,
    ...(phaseEvidenceBinding === undefined ? {} : { phaseEvidenceBinding }),
    ...(diffPath ? { diffPath, diffBytes: statSync(diffPath).size, diffSha256: hashFile(diffPath) } : {}),
    changedFiles: Object.freeze(changedFiles),
    copyDiffTo(destination) {
      assertLive();
      if (!diffPath) fail("SOURCE_UNAVAILABLE", "this review subject intentionally has no diff artifact");
      copyFileSync(diffPath, destination, 1);
      return Object.freeze({ bytes: statSync(destination).size, sha256: hashFile(destination) });
    },
    copySnapshotFile,
    dispose() {
      if (disposed) return;
      disposed = true;
      rmSync(captureRoot, { recursive: true, force: true });
    }
  });
}

function assertReviewDataRoot({ sourceRoot, targetRepoRoot, reviewDataRoot }) {
  if (!reviewDataRoot) throw new TypeError("reviewDataRoot is required");
  const requestedData = resolve(reviewDataRoot);
  if (inside(resolve(sourceRoot), requestedData) || inside(sourceRoot, requestedData)) fail("REVIEW_DATA_ROOT_INSIDE_SOURCE", "review_data_root must be outside the source repository");
  if (inside(resolve(targetRepoRoot), requestedData) || inside(targetRepoRoot, requestedData)) fail("REVIEW_DATA_ROOT_INSIDE_TARGET", "review_data_root must be outside the target repository");
  return realpathSync(requestedData);
}

export function captureReviewSource({ workspace, sourceRoot, targetRepoRoot, baselineCommit, reviewDataRoot, betweenCaptures, includeDiff = true } = {}) {
  if (typeof includeDiff !== "boolean") throw new TypeError("includeDiff must be boolean");
  if (workspace !== undefined) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined || baselineCommit !== undefined) {
      throw new TypeError("Workspace review forbids sourceRoot, targetRepoRoot, and baselineCommit overrides");
    }
    ({ worktreeRoot: sourceRoot, targetRepoRoot, baselineCommit } = reviewSourceForWorkspace(workspace));
  }
  if (!(sourceRoot && targetRepoRoot)) throw new TypeError("sourceRoot and targetRepoRoot are required");
  const requestedSource = resolve(sourceRoot);
  const source = realpathSync(requestedSource);
  const target = realpathSync(targetRepoRoot);
  const data = assertReviewDataRoot({ sourceRoot: requestedSource, targetRepoRoot, reviewDataRoot });
  if (commonDir(source) !== commonDir(target)) fail("SOURCE_UNAVAILABLE", "source and target must share one Git repository");
  if (text(source, ["rev-parse", "--is-shallow-repository"]) === "true") fail("SOURCE_UNAVAILABLE", "shallow repositories are not supported");
  if (optionalText(source, ["config", "--bool", "--get", "core.sparseCheckout"]) === "true") fail("SOURCE_UNAVAILABLE", "sparse checkout is not supported");

  const targetCommit = text(target, ["rev-parse", "HEAD"]);
  const capturedHead = text(source, ["rev-parse", "HEAD"]);
  if (baselineCommit === undefined) {
    const bases = text(source, ["merge-base", "--all", targetCommit, capturedHead]).split(/\s+/).filter(Boolean);
    if (bases.length !== 1) fail("SOURCE_UNAVAILABLE", `expected exactly one merge-base, got ${bases.length}`);
    baselineCommit = bases[0];
  }
  git(source, ["cat-file", "-e", `${baselineCommit}^{commit}`]);
  if (!isAncestor(source, baselineCommit, capturedHead)) fail("SOURCE_UNAVAILABLE", "Workspace baseline commit must be an ancestor of captured HEAD");
  const baseCommit = baselineCommit;
  const baseTree = text(source, ["rev-parse", `${baseCommit}^{tree}`]);
  const captureRoot = mkdtempSync(resolve(data, "capture-"));
  try {
    // Execution evidence is task-owned data, not source material. Keep this
    // capture identical to captureExecutionSnapshot so review-chain identity
    // cannot drift merely because a receipt was published during the run.
    const first = capture(source, capturedHead, resolve(captureRoot, "index-1"), captureRoot, ["evidence/"]);
    betweenCaptures?.();
    const secondHead = text(source, ["rev-parse", "HEAD"]);
    const second = capture(source, secondHead, resolve(captureRoot, "index-2"), captureRoot, ["evidence/"]);
    if (secondHead !== capturedHead || second !== first) fail("SOURCE_CHANGED_DURING_CAPTURE", "HEAD or working tree changed during capture");
    const diffPath = includeDiff ? resolve(captureRoot, "changes.diff") : null;
    if (diffPath) runGitToFile(source, ["diff", "-M", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", baseTree, first, "--", ".", ":(exclude)node_modules"], diffPath);
    const changedFiles = includeDiff ? parseChangedFiles(source, baseTree, first, captureRoot) : [];
    return sourceRecord({ source, targetCommit, capturedHead, baseCommit, baseTree, snapshotTree: first, diffPath, changedFiles, captureRoot });
  } catch (error) {
    rmSync(captureRoot, { recursive: true, force: true });
    throw error;
  }
}
