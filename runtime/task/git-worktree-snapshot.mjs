import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, isAbsolute, resolve, sep } from "node:path";
import { deflateSync } from "node:zlib";

const AUTO_MANAGED_RUNTIME_BLOCK = /<!-- BEGIN ([A-Z][A-Z0-9_-]*-RUNTIME) \(auto-managed; do not edit\) -->\r?\n[\s\S]*?<!-- END \1 -->\r?\n?/g;
const SNAPSHOT_OBJECT_ROOT = resolve(tmpdir(), "workflowhub-git-snapshots");

/** Files written while recording execution facts are not source material. */
export const EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES = Object.freeze(["evidence/"]);

function git(root, args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: options.encoding ?? "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...(options.env === undefined ? {} : { env: options.env }),
  });
}

function gitText(root, args) { return String(git(root, args)).trim(); }
function gitPaths(root, args) { return Buffer.from(git(root, args, { encoding: "buffer" })).toString("utf8").split("\0").filter(Boolean); }

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

function fileEntry(root, path, format, objectDir) {
  const absolute = workspacePath(root, path);
  let stat;
  try { stat = lstatSync(absolute); }
  catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  if (stat.isSymbolicLink()) return { mode: "120000", oid: writeLooseObject(objectDir, format, "blob", Buffer.from(readlinkSync(absolute))), tree: false };
  if (stat.isFile()) return { mode: (stat.mode & 0o111) === 0 ? "100644" : "100755", oid: writeLooseObject(objectDir, format, "blob", readFileSync(absolute)), tree: false };
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
  return output.split("\0").filter(Boolean).map((line) => {
    const match = /^(\d+) (blob|commit) ([a-f0-9]{40,64})\t(.+)$/.exec(line);
    if (!match) throw new Error(`invalid Git tree entry: ${line}`);
    const [, mode, type, oid, path] = match;
    return { path, entry: { mode, oid, tree: false, type } };
  });
}

function workspaceTree(root, head, format, objectDir, excludedPrefixes) {
  assertExcludedPrefixes(excludedPrefixes);
  const paths = new Set([
    ...gitPaths(root, ["ls-files", "-z"]),
    ...gitPaths(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]);
  const tree = new Map();
  for (const path of [...paths].sort()) {
    if (excluded(path, excludedPrefixes)) continue;
    const entry = fileEntry(root, path, format, objectDir);
    if (entry !== null) addPath(tree, path, entry);
  }
  for (const { path, entry } of headEntries(root, head, excludedPrefixes)) addPath(tree, path, entry);
  return writeTree(tree, format, objectDir);
}

function snapshotCommit(head, tree, format, objectDir) {
  const body = Buffer.from([`tree ${tree}`, `parent ${head}`, "author WorkflowHub <workflowhub@local> 0 +0000", "committer WorkflowHub <workflowhub@local> 0 +0000", "", "workflowhub ephemeral workspace snapshot", ""].join("\n"));
  return writeLooseObject(objectDir, format, "commit", body);
}

function captureSnapshot(root, excludedPrefixes = []) {
  const head = gitText(root, ["rev-parse", "HEAD"]);
  const format = objectFormat(root);
  const objectDir = ensureGitSnapshotObjectStore(root);
  const tree = workspaceTree(root, head, format, objectDir, excludedPrefixes);
  return Object.freeze({ head, tree, commit: snapshotCommit(head, tree, format, objectDir) });
}

/** Capture tracked, dirty, and untracked bytes without writing repository .git. */
export function captureGitWorktreeSnapshot(root) { return captureSnapshot(root); }

/** Capture a snapshot while preserving HEAD bytes for execution-record files. */
export function captureExecutionSnapshot(root) { return captureSnapshot(root, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES); }

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
  const changed = gitText(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", expectedTree, actualTree]).split("\n").filter(Boolean);
  if (changed.length !== 1 || !/^M\s+AGENTS\.md$/.test(changed[0])) return false;
  const before = treeFile(root, expectedTree, "AGENTS.md");
  const after = treeFile(root, actualTree, "AGENTS.md");
  if (!before || !after || before.mode !== after.mode || before.text === after.text) return false;
  const normalizedBefore = withoutRuntimeBlock(before.text);
  const normalizedAfter = withoutRuntimeBlock(after.text);
  return (normalizedBefore.names.length > 0 || normalizedAfter.names.length > 0)
    && JSON.stringify(normalizedBefore.names) === JSON.stringify(normalizedAfter.names)
    && normalizedBefore.content === normalizedAfter.content;
}
