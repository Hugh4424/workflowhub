import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, isAbsolute, resolve, sep } from "node:path";
import { deflateSync } from "node:zlib";

import { artifactReference } from "../../core/artifact-dir.mjs";

const AUTO_MANAGED_RUNTIME_BLOCK = /<!-- BEGIN ([A-Z][A-Z0-9_-]*-RUNTIME) \(auto-managed; do not edit\) -->\r?\n[\s\S]*?<!-- END \1 -->\r?\n?/g;
const SNAPSHOT_OBJECT_ROOT = resolve(tmpdir(), "workflowhub-git-snapshots");
const LFS_POINTER_VERSION = "version https://git-lfs.github.com/spec/v1";
const HASH = /^[a-f0-9]{64}$/;
// Large evaluation worktrees can contain thousands of evidence paths. Git
// output is still bounded machine data, but Node's default buffer is too small
// and otherwise turns a valid snapshot into an opaque ENOBUFS failure.
const MAX_GIT_OUTPUT_BYTES = 64 * 1024 * 1024;

/** Files written while recording execution facts are not source material. */
// Host-owned sidecar state is not WorkflowHub source or M15 evidence. Keep it
// outside authenticated snapshots so an unrelated host integration cannot
// contaminate the current task's diff, review packet, or page provenance.
export const EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES = Object.freeze(["evidence/", "quality/", ".multica/"]);
// Every execution snapshot exclusion is also a close-time structural error:
// otherwise its bytes could disappear from the delivery branch. The two
// supplements are known execution products that snapshots otherwise include.
// All must be published to task storage rather than carried by the branch.
export const CLOSE_EXECUTION_SIDECAR_PREFIXES = Object.freeze([
  ...EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES,
  "qa-artifacts/",
]);
const CURRENT_MATERIAL_PATH = /^specs\/[^/]+\/(?:decision-log|spec|plan|tasks)\.md$/;

function isCurrentMaterialPath(path, taskId = null) {
  if (!CURRENT_MATERIAL_PATH.test(path)) return false;
  return taskId === null || path.split("/")[1] === taskId;
}

function git(root, args, options = {}) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: options.encoding ?? "utf8",
      maxBuffer: MAX_GIT_OUTPUT_BYTES,
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      ...(options.input === undefined ? {} : { input: options.input }),
      ...(options.env === undefined ? {} : { env: options.env }),
    });
  } catch (error) {
    if (error?.code === "ENOBUFS") {
      const limited = new Error(`SNAPSHOT_OUTPUT_LIMIT: git ${args.join(" ")} exceeded ${MAX_GIT_OUTPUT_BYTES} bytes`);
      limited.code = "SNAPSHOT_OUTPUT_LIMIT";
      limited.git_args = [...args];
      limited.max_bytes = MAX_GIT_OUTPUT_BYTES;
      limited.cause = error;
      throw limited;
    }
    throw error;
  }
}

function gitText(root, args) { return String(git(root, args)).trim(); }
// `git ls-files --others` can represent an untracked nested repository as a
// directory entry with a trailing slash (for example `workflowhub/`). A
// snapshot contains files, not directory placeholders; retaining that entry
// makes addPath receive an empty basename and fail before the real files are
// considered. Filter only those placeholders here; ordinary untracked files
// remain part of the snapshot.
function gitListedPaths(root, args) {
  return Buffer.from(git(root, args, { encoding: "buffer" })).toString("utf8")
    .split("\0")
    .filter((path) => path !== "");
}

function gitPaths(root, args) {
  return gitListedPaths(root, args)
    .filter((path) => !path.endsWith("/"));
}

function matchesPrefix(path, prefixes) {
  return prefixes.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix));
}

function currentTaskSidecarPrefix(taskId) {
  if (taskId === undefined || taskId === null) return null;
  if (typeof taskId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId)) {
    throw new TypeError("close sidecar taskId must be a task identifier");
  }
  return `tasks/${taskId}/`;
}

/** Read repository paths that would otherwise make close publish execution sidecars. */
export function listCloseExecutionSidecarPaths(root, { taskId } = {}) {
  const taskSidecarPrefix = currentTaskSidecarPrefix(taskId);
  const paths = new Set([
    ...gitListedPaths(root, ["ls-files", "-z"]),
    ...gitListedPaths(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
    ...gitListedPaths(root, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"]),
  ]);
  const prefixes = taskSidecarPrefix === null
    ? CLOSE_EXECUTION_SIDECAR_PREFIXES
    : [...CLOSE_EXECUTION_SIDECAR_PREFIXES, taskSidecarPrefix];
  return Object.freeze([...paths].filter((path) => matchesPrefix(path, prefixes)).sort());
}

/** Close must fail before it commits a worktree containing an execution sidecar. */
export function assertNoCloseExecutionSidecars(root, options = {}) {
  const paths = listCloseExecutionSidecarPaths(root, options);
  if (paths.length === 0) return paths;
  const error = new Error(`CLOSE_EXECUTION_SIDECAR_PATHS: ${paths.join(", ")}; publish execution artifacts to task storage before close`);
  error.code = "CLOSE_EXECUTION_SIDECAR_PATHS";
  error.paths = paths;
  throw error;
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

function repositoryObjectDir(root) {
  const path = gitText(root, ["rev-parse", "--git-path", "objects"]);
  mkdirSync(resolve(root, path), { recursive: true });
  return resolve(root, path);
}

function readBatchObjects(root, objectIds) {
  const input = Buffer.from(`${objectIds.join("\n")}\n`);
  const output = Buffer.from(git(root, ["cat-file", "--batch"], { encoding: "buffer", input }));
  const objects = [];
  let offset = 0;
  for (const objectId of objectIds) {
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd < 0) throw new Error(`snapshot object batch is truncated: ${objectId}`);
    const [returnedId, type, sizeText] = output.subarray(offset, headerEnd).toString("utf8").split(" ");
    const size = Number(sizeText);
    if (returnedId !== objectId || !["blob", "tree", "commit", "tag"].includes(type) || !Number.isSafeInteger(size) || size < 0) {
      throw new Error(`snapshot object batch contains an invalid header: ${objectId}`);
    }
    const bodyStart = headerEnd + 1;
    const bodyEnd = bodyStart + size;
    if (bodyEnd >= output.length || output[bodyEnd] !== 0x0a) throw new Error(`snapshot object batch is truncated: ${objectId}`);
    objects.push({ objectId, type, body: output.subarray(bodyStart, bodyEnd) });
    offset = bodyEnd + 1;
  }
  return objects;
}

/**
 * Promote one ephemeral snapshot into the repository object database before
 * any close operation can publish its commit as a branch ref.  Snapshot
 * capture remains side-effect free for normal evidence callers; close is the
 * explicit boundary that makes the delivery commit durable across processes.
 */
export function materializeGitSnapshot(root, snapshot) {
  if (!snapshot || typeof snapshot !== "object" || typeof snapshot.commit !== "string") {
    throw new TypeError("snapshot commit is required for materialization");
  }
  const format = objectFormat(root);
  const commitPattern = format === "sha256" ? /^[a-f0-9]{64}$/ : /^[a-f0-9]{40}$/;
  if (!commitPattern.test(snapshot.commit)) throw new TypeError("snapshot commit has an invalid object id");
  ensureGitSnapshotObjectStore(root);
  const objectIds = [...new Set(gitText(root, ["rev-list", "--objects", "--no-object-names", "--no-walk", snapshot.commit]).split(/\s+/).filter(Boolean))];
  if (!objectIds.includes(snapshot.commit)) objectIds.unshift(snapshot.commit);
  const repositoryObjects = repositoryObjectDir(root);
  for (const { objectId, type, body } of readBatchObjects(root, objectIds)) {
    const written = writeLooseObject(repositoryObjects, format, type, body);
    if (written !== objectId) throw new Error(`snapshot object hash mismatch: ${objectId}`);
  }
  return snapshot.commit;
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

function sourceManifest(root, paths, headEntriesByPath, format, excludedPrefixes, { head, gitTree, contentTree, filters: providedFilters, taskId = null } = {}) {
  // Current WorkflowHub materials are handoff records, not implementation or
  // test-contract inputs. Their edits must not invalidate a reusable full-test
  // receipt; the workspace tree still records them for material freshness.
  const filePaths = paths.filter((path) => !excluded(path, excludedPrefixes) && !isCurrentMaterialPath(path, taskId));
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
  // The source digest identifies test/review inputs, not the commit that
  // happened to carry a handoff-record writeback. Keep commit/tree ids in the
  // manifest for provenance without invalidating reusable evidence after a
  // material-only execution-status commit.
  const digestInput = {
    schema_version: unsigned.schema_version,
    content_tree: unsigned.content_tree,
    entries: unsigned.entries,
  };
  return Object.freeze({ ...unsigned, source_digest: sha256(JSON.stringify(digestInput)) });
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

function captureSnapshot(root, excludedPrefixes = [], taskId = null) {
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
    (path) => !isCurrentMaterialPath(path, taskId),
  );
  const manifest = sourceManifest(root, [...paths], sourceHeadEntriesByPath, format, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES, { head, gitTree, contentTree, filters, taskId });
  const tree = workspaceTree(root, head, format, objectDir, filters, excludedPrefixes);
  return Object.freeze({ head, tree, commit: snapshotCommit(head, tree, format, objectDir), source_digest: manifest.source_digest, source_manifest: manifest });
}

/** Capture tracked, dirty, and untracked bytes without writing repository .git. */
export function captureGitWorktreeSnapshot(root, taskId = null) { return captureSnapshot(root, [], taskId); }

/** Capture a snapshot while preserving HEAD bytes for execution-record files. */
export function captureExecutionSnapshot(root, taskId = null) { return captureSnapshot(root, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES, taskId); }

/**
 * A reusable material delta is deliberately narrow: only the executor's
 * status writeback block in tasks.md is non-semantic. Changes to decision,
 * spec, plan, or any other task-card text can change what was reviewed and
 * must invalidate the old test/review fact.
 */
export function isMaterialOnlySnapshotDelta(root, expectedTree, actualTree, taskId = null) {
  if (expectedTree === actualTree) return true;
  ensureGitSnapshotObjectStore(root);
  let changed;
  try {
    changed = gitText(root, ["diff", "--name-only", expectedTree, actualTree, "--"]).split("\n").filter(Boolean);
  } catch {
    return false;
  }
  return typeof taskId === "string" && taskId.trim() !== ""
    && changed.length === 1
    && isCurrentMaterialPath(changed[0], taskId)
    && changed[0] === artifactReference(taskId, "tasks.md")
    && isExecutionRecordOnlyMaterialDelta(root, expectedTree, actualTree, taskId);
}

/**
 * A stage fact remains current when later workflow material or unrelated
 * source bytes changed after an authoring stage. The caller supplies the
 * stage-owned material boundary; implementation stages can keep the stricter
 * source-bound behavior. This is deliberately a predicate, not a writer or
 * progression permit.
 */
export function isStageMaterialOnlySnapshotDelta(root, expectedTree, actualTree, {
  taskId = null,
  downstreamMaterials = [],
  allowNonMaterialChanges = false,
} = {}) {
  if (expectedTree === actualTree) return true;
  if (typeof root !== "string" || typeof taskId !== "string" || taskId.trim() === ""
      || !Array.isArray(downstreamMaterials)
      || downstreamMaterials.some((file) => typeof file !== "string" || file.trim() === "")) return false;
  ensureGitSnapshotObjectStore(root);
  let changed;
  try {
    changed = gitText(root, ["diff", "--name-only", expectedTree, actualTree, "--"]).split("\n").filter(Boolean);
  } catch {
    return false;
  }
  const allowed = new Set(downstreamMaterials.map((file) => artifactReference(taskId, file)));
  return changed.length > 0 && changed.every((path) => {
    if (allowNonMaterialChanges && !isCurrentMaterialPath(path, taskId)) return true;
    if (allowed.has(path)) return true;
    const tasksRef = artifactReference(taskId, "tasks.md");
    return path === tasksRef && isExecutionRecordOnlyMaterialDelta(root, expectedTree, actualTree, taskId);
  });
}

export function taskExecutionRecordOnly(text) {
  const lines = String(text ?? "").split(/\r?\n/);
  const kept = [];
  let skipLevel = null;
  for (const line of lines) {
    const heading = /^(#{3,6})\s+(.+?)\s*$/.exec(line);
    if (skipLevel !== null) {
      if (heading && heading[1].length <= skipLevel) skipLevel = null;
      else continue;
    }
    if (skipLevel === null && heading && /执行状态填写区|execution status/i.test(heading[2])) {
      skipLevel = heading[1].length;
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n").replace(/\s+$/u, "").replace(/\r\n/g, "\n");
}

/**
 * The executor's status block is bookkeeping written after quality facts
 * exist. It is excluded from material identity; substantive edits to any of
 * the four handoff records still produce a new revision.
 */
export function materialRevisionFromValues(values) {
  if (!Array.isArray(values)) throw new TypeError("material values must be an array");
  const normalized = values.map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 2) throw new TypeError(`material value ${index} must be [path, content]`);
    const [file, content] = entry;
    return [file, file === "tasks.md" && content !== null && content !== undefined
      ? taskExecutionRecordOnly(content)
      : content];
  });
  return `revision-${sha256(JSON.stringify(normalized))}`;
}

/**
 * A task card may be updated after a review only to record facts produced by
 * the executor.  That bookkeeping must not invalidate a review of the same
 * implementation, but any change outside the execution-status blocks must.
 */
export function isExecutionRecordOnlyMaterialDelta(root, expectedTree, actualTree, taskId) {
  if (expectedTree === actualTree) return true;
  if (typeof root !== "string" || typeof taskId !== "string" || taskId.trim() === "") return false;
  ensureGitSnapshotObjectStore(root);
  let changed;
  try {
    changed = gitText(root, ["diff", "--name-only", expectedTree, actualTree, "--"]).split("\n").filter(Boolean);
  } catch {
    return false;
  }
  const executionRecordRef = artifactReference(taskId, "tasks.md");
  if (changed.length !== 1 || changed[0] !== executionRecordRef) return false;
  let before;
  let after;
  try {
    before = treeFile(root, expectedTree, executionRecordRef);
    after = treeFile(root, actualTree, executionRecordRef);
  } catch {
    return false;
  }
  return Boolean(before && after && before.mode === after.mode
    && taskExecutionRecordOnly(before.text) === taskExecutionRecordOnly(after.text));
}

/** Re-read the current source manifest and require the caller's digest to be current. */
export function assertCurrentSourceDigest(root, expectedDigest, taskId = null) {
  if (!HASH.test(expectedDigest ?? "")) throw new TypeError("expected source digest must be a sha256");
  const snapshot = captureGitWorktreeSnapshot(root, taskId);
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
