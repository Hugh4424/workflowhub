import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, isAbsolute, resolve, sep } from "node:path";
import { deflateSync } from "node:zlib";

const AUTO_MANAGED_RUNTIME_BLOCK = /<!-- BEGIN ([A-Z][A-Z0-9_-]*-RUNTIME) \(auto-managed; do not edit\) -->\r?\n[\s\S]*?<!-- END \1 -->\r?\n?/g;
const SNAPSHOT_OBJECT_ROOT = resolve(tmpdir(), "workflowhub-git-snapshots");
const LFS_POINTER_VERSION = "version https://git-lfs.github.com/spec/v1";
const HASH = /^[a-f0-9]{64}$/;

/** Files written while recording execution facts are not source material. */
// Host-owned sidecar state is not WorkflowHub source or M15 evidence. Keep it
// outside authenticated snapshots so an unrelated host integration cannot
// contaminate the current task's diff, review packet, or page provenance.
export const EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES = Object.freeze(["evidence/", "quality/", ".multica/"]);
const CURRENT_MATERIAL_PATH = /^specs\/[^/]+\/(?:decision-log|spec|plan|tasks)\.md$/;

function git(root, args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: options.encoding ?? "utf8",
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    ...(options.input === undefined ? {} : { input: options.input }),
    ...(options.env === undefined ? {} : { env: options.env }),
  });
}

function gitText(root, args) { return String(git(root, args)).trim(); }
// `git ls-files --others` can represent an untracked nested repository as a
// directory entry with a trailing slash (for example `workflowhub/`). A
// snapshot contains files, not directory placeholders; retaining that entry
// makes addPath receive an empty basename and fail before the real files are
// considered. Filter only those placeholders here; ordinary untracked files
// remain part of the snapshot.
function gitPaths(root, args) {
  return Buffer.from(git(root, args, { encoding: "buffer" })).toString("utf8")
    .split("\0")
    .filter((path) => path !== "" && !path.endsWith("/"));
}

function gitCommonDir(root) {
  const value = gitText(root, ["rev-parse", "--git-common-dir"]);
  return realpathSync(isAbsolute(value) ? value : resolve(root, value));
}

function objectFormat(root) {
  const value = gitText(root, ["rev-parse", "--show-object-format"]);
  if (!new Set(["sha1", "sha256"]).has(value)) throw new Error(`unsupported Git object format: ${value}`);
  return value;
}

function snapshotObjectDir(commonDir) {
  const id = createHash("sha256").update(commonDir).digest("hex");
  const path = resolve(SNAPSHOT_OBJECT_ROOT, id, "objects");
  mkdirSync(path, { recursive: true });
  const inherited = (process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES ?? "").split(delimiter).filter(Boolean);
  if (!inherited.includes(path)) process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES = [...inherited, path].join(delimiter);
  return path;
}

/**
 * Make this repository's external snapshot objects visible to Git commands in
 * the current runner process.  Snapshot commits are facts, not refs: a later
 * stage must be able to read them without having to repeat the capture that
 * created them, and without writing the repository object database.
 */
export function ensureGitSnapshotObjectStore(root) {
  return snapshotObjectDir(gitCommonDir(root));
}

function hashObject(format, type, body) {
  return createHash(format).update(`${type} ${body.length}\0`).update(body).digest("hex");
}

function writeLooseObject(objectDir, format, type, body) {
  const oid = hashObject(format, type, body);
  const directory = resolve(objectDir, oid.slice(0, 2));
  const path = resolve(directory, oid.slice(2));
  if (!existsSync(path)) {
    mkdirSync(directory, { recursive: true });
    try {
      writeFileSync(path, deflateSync(Buffer.concat([Buffer.from(`${type} ${body.length}\0`), body])), { flag: "wx" });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  return oid;
}

function workspacePath(root, path) {
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) throw new Error(`Git path escapes workspace: ${path}`);
  return absolute;
}

function sha256(body) {
  return createHash("sha256").update(body).digest("hex");
}

function parseLfsPointer(body) {
  if (!Buffer.isBuffer(body) || body.length > 1024 * 1024) return null;
  const lines = body.toString("utf8").split(/\r?\n/);
  if (lines[0] !== LFS_POINTER_VERSION) return null;
  const oid = /^oid sha256:([a-f0-9]{64})$/.exec(lines[1] ?? "")?.[1];
  const size = /^size ([0-9]+)$/.exec(lines[2] ?? "")?.[1];
  if (!oid || size === undefined || lines.slice(3).some((line) => line.trim() !== "")) return null;
  return { oid, size: Number(size) };
}

function lfsPointerBody(body) {
  return Buffer.from(`${LFS_POINTER_VERSION}\noid sha256:${sha256(body)}\nsize ${body.length}\n`);
}

function lfsFilterMap(root, paths) {
  if (paths.length === 0) return new Map();
  const input = Buffer.from(`${paths.join("\0")}\0`);
  const output = Buffer.from(git(root, ["check-attr", "-z", "--stdin", "filter"], { encoding: "buffer", input }));
  const fields = output.toString("utf8").split("\0").filter((field, index, all) => index < all.length - 1 || field !== "");
  const filters = new Map();
  for (let index = 0; index + 2 < fields.length; index += 3) {
    if (fields[index + 1] !== "filter") continue;
    filters.set(fields[index], fields[index + 2] === "unspecified" ? null : fields[index + 2]);
  }
  return filters;
}

function formalLfsUnavailable(path, pointer) {
  const error = new Error(`FORMAL_LFS_CONTENT_UNAVAILABLE: ${path} is an unhydrated Git LFS pointer (${pointer.oid})`);
  error.code = "FORMAL_LFS_CONTENT_UNAVAILABLE";
  error.path = path;
  error.lfs_oid = pointer.oid;
  error.lfs_size = pointer.size;
  return error;
}

function sourceManifest(root, paths, headEntriesByPath, format, excludedPrefixes, { head, gitTree, contentTree, filters: providedFilters } = {}) {
  // Current WorkflowHub materials are handoff records, not implementation or
  // test-contract inputs. Their edits must not invalidate a reusable full-test
  // receipt; the workspace tree still records them for material freshness.
  const filePaths = paths.filter((path) => !excluded(path, excludedPrefixes) && !CURRENT_MATERIAL_PATH.test(path));
  const filters = providedFilters ?? lfsFilterMap(root, filePaths);
  const entries = [];
  for (const path of filePaths.sort()) {
    const absolute = workspacePath(root, path);
    const head = headEntriesByPath.get(path)?.entry ?? null;
    let stat;
    try { stat = lstatSync(absolute); }
    catch (error) {
      if (error?.code !== "ENOENT") throw error;
      entries.push({ path, status: "missing", kind: head?.type === "commit" ? "submodule" : "file", git_blob_oid: head?.oid ?? null, content_sha256: null, bytes: null, filter: filters.get(path) ?? null, lfs: null });
      continue;
    }
    if (stat.isSymbolicLink()) {
      const body = Buffer.from(readlinkSync(absolute));
      entries.push({ path, status: "present", kind: "symlink", git_blob_oid: hashObject(format, "blob", body), content_sha256: sha256(body), bytes: body.length, filter: filters.get(path) ?? null, lfs: null });
      continue;
    }
    if (stat.isDirectory()) {
      const oid = gitText(absolute, ["rev-parse", "HEAD"]);
      if (!/^[a-f0-9]{40,64}$/.test(oid)) throw new Error(`nested Git workspace has an invalid HEAD: ${path}`);
      entries.push({ path, status: "present", kind: "submodule", git_blob_oid: oid, content_sha256: null, bytes: null, filter: null, lfs: null });
      continue;
    }
    if (!stat.isFile()) throw new Error(`unsupported workspace entry type: ${path}`);
    const body = readFileSync(absolute);
    const pointer = parseLfsPointer(body);
    const filter = filters.get(path) ?? null;
    if (filter === "lfs" && pointer) throw formalLfsUnavailable(path, pointer);
    entries.push({
      path,
      status: "present",
      kind: "file",
      git_blob_oid: hashObject(format, "blob", body),
      content_sha256: sha256(body),
      bytes: body.length,
      filter,
      lfs: { configured: filter === "lfs", pointer: pointer !== null, hydrated: pointer === null, oid: pointer?.oid ?? null, size: pointer?.size ?? null },
    });
  }
  const unsigned = {
    schema_version: "workflowhub-source-manifest.v1",
    head_commit: head,
    git_tree: gitTree,
    content_tree: contentTree,
    entries,
  };
  return Object.freeze({ ...unsigned, source_digest: sha256(JSON.stringify(unsigned)) });
}

function fileEntry(root, path, format, objectDir, filters) {
  const absolute = workspacePath(root, path);
  let stat;
  try { stat = lstatSync(absolute); }
  catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  if (stat.isSymbolicLink()) return { mode: "120000", oid: writeLooseObject(objectDir, format, "blob", Buffer.from(readlinkSync(absolute))), tree: false };
  if (stat.isFile()) {
    const body = readFileSync(absolute);
    const filter = filters.get(path) ?? null;
    // A hydrated LFS file is real source content in the manifest, but its
    // publishable Git tree must retain the pointer blob.  Otherwise a close
    // reset turns a clean worktree into a permanent LFS-only diff.
    const treeBody = filter === "lfs" && parseLfsPointer(body) === null ? lfsPointerBody(body) : body;
    return { mode: (stat.mode & 0o111) === 0 ? "100644" : "100755", oid: writeLooseObject(objectDir, format, "blob", treeBody), tree: false };
  }
  if (stat.isDirectory()) {
    const oid = gitText(absolute, ["rev-parse", "HEAD"]);
    if (!/^[a-f0-9]{40,64}$/.test(oid)) throw new Error(`nested Git workspace has an invalid HEAD: ${path}`);
    return { mode: "160000", oid, tree: false };
  }
  throw new Error(`unsupported workspace entry type: ${path}`);
}

function addPath(rootNode, path, entry) {
  const parts = path.split("/");
  let node = rootNode;
  for (const part of parts.slice(0, -1)) {
    const current = node.get(part);
    if (current?.entry) throw new Error(`workspace path conflicts with a file: ${path}`);
    if (!current) node.set(part, { children: new Map() });
    node = node.get(part).children;
  }
  const name = parts.at(-1);
  if (!name) throw new Error("workspace path is empty");
  node.set(name, { entry });
}

function writeTree(node, format, objectDir) {
  const entries = [];
  for (const [name, value] of node) {
    const entry = value.entry ?? { mode: "40000", oid: writeTree(value.children, format, objectDir), tree: true };
    entries.push({ name, ...entry });
  }
  entries.sort((left, right) => Buffer.compare(Buffer.from(`${left.name}${left.tree ? "/" : ""}`), Buffer.from(`${right.name}${right.tree ? "/" : ""}`)));
  const body = Buffer.concat(entries.map((entry) => Buffer.concat([Buffer.from(`${entry.mode} ${entry.name}\0`), Buffer.from(entry.oid, "hex")])))
  return writeLooseObject(objectDir, format, "tree", body);
}

function assertExcludedPrefixes(prefixes) {
  for (const prefix of prefixes) {
    if (typeof prefix !== "string" || prefix.length === 0 || prefix.startsWith("/") || prefix.includes("..")) {
      throw new TypeError("snapshot exclusion prefix must be a safe repository-relative path");
    }
  }
}

function excluded(path, prefixes) { return prefixes.some((prefix) => path.startsWith(prefix)); }

function headEntries(root, head, prefixes) {
  if (prefixes.length === 0) return [];
  const output = Buffer.from(git(root, ["ls-tree", "-r", "-z", head, "--", ...prefixes], { encoding: "buffer" })).toString("utf8");
  return parseHeadEntries(output);
}

function allHeadEntries(root, head) {
  const output = Buffer.from(git(root, ["ls-tree", "-r", "-z", head], { encoding: "buffer" })).toString("utf8");
  return parseHeadEntries(output);
}

function parseHeadEntries(output) {
  return output.split("\0").filter(Boolean).map((line) => {
    const match = /^(\d+) (blob|commit) ([a-f0-9]{40,64})\t(.+)$/.exec(line);
    if (!match) throw new Error(`invalid Git tree entry: ${line}`);
    const [, mode, type, oid, path] = match;
    return { path, entry: { mode, oid, tree: false, type } };
  });
}

function workspaceTree(root, head, format, objectDir, filters, excludedPrefixes, preserveExcludedHead = true, includePath = () => true) {
  assertExcludedPrefixes(excludedPrefixes);
  const paths = new Set([
    ...gitPaths(root, ["ls-files", "-z"]),
    ...gitPaths(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]);
  const tree = new Map();
  for (const path of [...paths].sort()) {
    if (excluded(path, excludedPrefixes) || !includePath(path)) continue;
    const entry = fileEntry(root, path, format, objectDir, filters);
    if (entry !== null) addPath(tree, path, entry);
  }
  if (preserveExcludedHead) {
    for (const { path, entry } of headEntries(root, head, excludedPrefixes)) {
      if (includePath(path)) addPath(tree, path, entry);
    }
  }
  return writeTree(tree, format, objectDir);
}

function snapshotCommit(head, tree, format, objectDir) {
  const body = Buffer.from([`tree ${tree}`, `parent ${head}`, "author WorkflowHub <workflowhub@local> 0 +0000", "committer WorkflowHub <workflowhub@local> 0 +0000", "", "workflowhub ephemeral workspace snapshot", ""].join("\n"));
  return writeLooseObject(objectDir, format, "commit", body);
}

function captureSnapshot(root, excludedPrefixes = []) {
  const head = gitText(root, ["rev-parse", "HEAD"]);
  const gitTree = gitText(root, ["rev-parse", "HEAD^{tree}"]);
  const format = objectFormat(root);
  const objectDir = ensureGitSnapshotObjectStore(root);
  const excludedHeadEntries = headEntries(root, head, excludedPrefixes);
  const paths = new Set([
    ...gitPaths(root, ["ls-files", "-z"]),
    ...gitPaths(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
    ...excludedHeadEntries.map(({ path }) => path),
  ]);
  // Attribute lookup is repository-wide and independent of which of the two
  // trees below is being written. Resolve it once, then reuse the result for
  // the source manifest and both tree passes; per-file Git processes make
  // status scans effectively quadratic in wall-clock overhead on large repos.
  const filters = lfsFilterMap(root, [...paths]);
  // Evidence is a publication product, not source. Keep its writes from
  // changing the source digest even when the caller requests the full
  // worktree snapshot used by review.
  const sourceHeadEntries = allHeadEntries(root, head).filter(({ path }) => !excluded(path, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES));
  const sourceHeadEntriesByPath = new Map(sourceHeadEntries.map((entry) => [entry.path, entry]));
  const contentTree = workspaceTree(
    root,
    head,
    format,
    objectDir,
    filters,
    EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES,
    false,
    (path) => !CURRENT_MATERIAL_PATH.test(path),
  );
  const manifest = sourceManifest(root, [...paths], sourceHeadEntriesByPath, format, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES, { head, gitTree, contentTree, filters });
  const tree = workspaceTree(root, head, format, objectDir, filters, excludedPrefixes);
  return Object.freeze({ head, tree, commit: snapshotCommit(head, tree, format, objectDir), source_digest: manifest.source_digest, source_manifest: manifest });
}

/** Capture tracked, dirty, and untracked bytes without writing repository .git. */
export function captureGitWorktreeSnapshot(root) { return captureSnapshot(root); }

/** Capture a snapshot while preserving HEAD bytes for execution-record files. */
export function captureExecutionSnapshot(root) { return captureSnapshot(root, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES); }

/**
 * A material-only edit changes the handoff documents while leaving the
 * implementation/test candidate untouched. It is safe to reuse a full-test
 * receipt for this delta; callers still bind the current four materials
 * separately and keep the changed tree visible in the audit facts.
 */
export function isMaterialOnlySnapshotDelta(root, expectedTree, actualTree) {
  if (expectedTree === actualTree) return true;
  ensureGitSnapshotObjectStore(root);
  let changed;
  try {
    changed = gitText(root, ["diff", "--name-only", expectedTree, actualTree, "--"]).split("\n").filter(Boolean);
  } catch {
    return false;
  }
  return changed.length > 0 && changed.every((path) => CURRENT_MATERIAL_PATH.test(path));
}

/** Re-read the current source manifest and require the caller's digest to be current. */
export function assertCurrentSourceDigest(root, expectedDigest) {
  if (!HASH.test(expectedDigest ?? "")) throw new TypeError("expected source digest must be a sha256");
  const snapshot = captureGitWorktreeSnapshot(root);
  if (snapshot.source_digest !== expectedDigest) {
    const error = new Error(`FORMAL_SNAPSHOT_MISMATCH: expected ${expectedDigest}, observed ${snapshot.source_digest}`);
    error.code = "FORMAL_SNAPSHOT_MISMATCH";
    error.expected_source_digest = expectedDigest;
    error.observed_source_digest = snapshot.source_digest;
    throw error;
  }
  return snapshot;
}

function treeFile(root, tree, path) {
  const entry = gitText(root, ["ls-tree", tree, "--", path]);
  if (!entry) return null;
  const [mode, type] = entry.split(/\s+/, 3);
  if (type !== "blob") return null;
  return { mode, text: gitText(root, ["show", `${tree}:${path}`]) };
}

function withoutRuntimeBlock(text) {
  const names = [];
  const content = text.replace(AUTO_MANAGED_RUNTIME_BLOCK, (_, name) => { names.push(name); return ""; });
  return { names, content: `${content.trimEnd()}\n` };
}

export function equivalentWorkspaceTrees(root, expectedTree, actualTree) {
  ensureGitSnapshotObjectStore(root);
  if (expectedTree === actualTree) return true;
  let changed;
  try {
    changed = gitText(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", expectedTree, actualTree]).split("\n").filter(Boolean);
  } catch {
    // A receipt may point at an expired or synthetic tree.  Verification must
    // report snapshot mismatch, not leak a raw git "bad object" failure.
    return false;
  }
  if (changed.length !== 1 || !/^M\s+AGENTS\.md$/.test(changed[0])) return false;
  let before;
  let after;
  try {
    before = treeFile(root, expectedTree, "AGENTS.md");
    after = treeFile(root, actualTree, "AGENTS.md");
  } catch {
    return false;
  }
  if (!before || !after || before.mode !== after.mode || before.text === after.text) return false;
  const normalizedBefore = withoutRuntimeBlock(before.text);
  const normalizedAfter = withoutRuntimeBlock(after.text);
  return (normalizedBefore.names.length > 0 || normalizedAfter.names.length > 0)
    && JSON.stringify(normalizedBefore.names) === JSON.stringify(normalizedAfter.names)
    && normalizedBefore.content === normalizedAfter.content;
}
