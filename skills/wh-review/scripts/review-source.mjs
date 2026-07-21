import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { reviewSourceForWorkspace } from "../../../core/workspace.mjs";
import { resolvePhaseReviewSubject } from "./phase-review-subject.mjs";

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

function git(cwd, args, options = {}) {
  try {
    return execFileSync("git", args, { cwd, maxBuffer: 128 * 1024 * 1024, ...options });
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

function parseChangedFiles(root, baseTree, snapshotTree) {
  const raw = git(root, ["diff", "--name-status", "-z", "-M", baseTree, snapshotTree]);
  const fields = raw.toString("utf8").split("\0");
  if (fields.at(-1) === "") fields.pop();
  const changed = [];
  for (let index = 0; index < fields.length;) {
    const token = fields[index++];
    const tab = token.indexOf("\t");
    const statusToken = tab >= 0 ? token.slice(0, tab) : token;
    let first = tab >= 0 ? token.slice(tab + 1) : fields[index++];
    let oldPath = null;
    let path = first;
    if (statusToken.startsWith("R")) {
      oldPath = first;
      path = fields[index++];
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
  return changed;
}

function capture(root, head, indexFile) {
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  git(root, ["read-tree", head], { env });
  git(root, ["add", "-A", "--", "."], { env });
  const staged = git(root, ["ls-files", "--stage", "-z"], { env }).toString("utf8");
  if (staged.split("\0").some((line) => line.startsWith("160000 "))) {
    fail("SOURCE_UNAVAILABLE", "gitlink/submodule entries are not supported");
  }
  return text(root, ["write-tree"], { env });
}

function isAncestor(root, ancestor, descendant) {
  try { execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: root, stdio: "ignore" }); return true; }
  catch (error) {
    if (error.status === 1) return false;
    fail("SOURCE_UNAVAILABLE", error.stderr?.toString().trim() || error.message);
  }
}

export function captureReviewSource({ workspace, sourceRoot, targetRepoRoot, baselineCommit, reviewDataRoot, betweenCaptures } = {}) {
  if (!reviewDataRoot) throw new TypeError("reviewDataRoot is required");
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
  const requestedData = resolve(reviewDataRoot);
  if (inside(requestedSource, requestedData) || inside(source, requestedData)) fail("REVIEW_DATA_ROOT_INSIDE_SOURCE", "review_data_root must be outside the source repository");
  if (inside(resolve(targetRepoRoot), requestedData) || inside(target, requestedData)) fail("REVIEW_DATA_ROOT_INSIDE_TARGET", "review_data_root must be outside the target repository");
  const data = realpathSync(requestedData);
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
  const temp = mkdtempSync(resolve(data, "capture-"));
  try {
    const first = capture(source, capturedHead, resolve(temp, "index-1"));
    betweenCaptures?.();
    const secondHead = text(source, ["rev-parse", "HEAD"]);
    const second = capture(source, secondHead, resolve(temp, "index-2"));
    if (secondHead !== capturedHead || second !== first) fail("SOURCE_CHANGED_DURING_CAPTURE", "HEAD or working tree changed during capture");
    const diff = git(source, ["diff", "-M", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", baseTree, first], { encoding: "utf8" });
    const changedFiles = parseChangedFiles(source, baseTree, first);
    return Object.freeze({
      sourceRoot: source,
      targetCommit,
      capturedHead,
      baseCommit,
      baseTree,
      snapshotTree: first,
      diff,
      changedFiles: Object.freeze(changedFiles),
      readSnapshotFile(path) {
        const entry = treeEntry(source, first, path);
        if (!entry || entry.type !== "blob") fail("SOURCE_UNAVAILABLE", `snapshot file is missing: ${path}`);
        return git(source, ["cat-file", "blob", entry.oid]);
      }
    });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

export function capturePhaseReviewSource({ sourceRoot, task, phaseId } = {}) {
  if (!sourceRoot) throw new TypeError("sourceRoot is required");
  const source = realpathSync(resolve(sourceRoot));
  const subject = resolvePhaseReviewSubject({ task, sourceRoot: source, phaseId });
  const diff = git(source, ["diff", "-M", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", subject.baseTree, subject.candidateTree], { encoding: "utf8" });
  const changedFiles = parseChangedFiles(source, subject.baseTree, subject.candidateTree);
  return Object.freeze({
    sourceRoot: source,
    targetCommit: subject.baselineCommit,
    capturedHead: subject.implementationCommit,
    baseCommit: subject.baselineCommit,
    baseTree: subject.baseTree,
    snapshotTree: subject.candidateTree,
    diff,
    changedFiles: Object.freeze(changedFiles),
    readSnapshotFile(path) {
      const entry = treeEntry(source, subject.candidateTree, path);
      if (!entry || entry.type !== "blob") fail("SOURCE_UNAVAILABLE", `snapshot file is missing: ${path}`);
      return git(source, ["cat-file", "blob", entry.oid]);
    }
  });
}
