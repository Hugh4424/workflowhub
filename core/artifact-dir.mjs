import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { validateTaskId } from "../runtime/task/task-identity.mjs";
import { assertTaskHandle } from "./task-capability.mjs";

function assertInside(basePath, candidatePath) {
  const rel = relative(basePath, candidatePath);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return;
  throw new Error(`artifact path escapes artifact root: ${candidatePath}`);
}

function artifactSegments(relativeName) {
  if (typeof relativeName !== "string" || relativeName.trim() === "") {
    throw new TypeError("artifact name must be a non-empty relative path");
  }
  if (isAbsolute(relativeName) || relativeName.includes("\\")) {
    throw new TypeError(`artifact name must be relative: ${relativeName}`);
  }
  const segments = relativeName.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new TypeError(`artifact name contains an unsafe segment: ${relativeName}`);
  }
  return segments;
}

function assertExistingAncestorInside(root, candidate) {
  let cursor = candidate;
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  assertInside(root, realpathSync(cursor));
}

function ensureRealDirectory(path, label) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} must be a real directory: ${path}`);
  }
  return realpathSync(path);
}

const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const ARTIFACT_DIR_TOKEN = Symbol("ArtifactDir constructor token");
const ARTIFACT_DIR_STATES = new WeakMap();
const MIGRATION_INSPECTORS = new WeakSet();

export function assertArtifactDir(value) {
  if (!value || typeof value !== "object" || !ARTIFACT_DIR_STATES.has(value)) throw new TypeError("authentic ArtifactDir capability required");
  value.verifyIdentity();
  return value;
}

export function artifactReference(taskId, relativeName) {
  const task = validateTaskId(taskId);
  return ["specs", task, ...artifactSegments(relativeName)].join("/");
}

/** Read-only authority used before a legacy directory has an authentic TaskHandle. */
export class MigrationArtifactInspector {
  static open(worktreeRoot, taskId) {
    if (typeof worktreeRoot !== "string" || !isAbsolute(worktreeRoot)) throw new TypeError("worktreeRoot must be absolute");
    const worktree = ensureRealDirectory(resolve(worktreeRoot), "migration worktreeRoot");
    const specsRoot = resolve(worktree, "specs");
    const root = resolve(specsRoot, validateTaskId(taskId));
    assertInside(specsRoot, root);
    if (existsSync(specsRoot)) ensureRealDirectory(specsRoot, "migration specs directory");
    if (existsSync(root)) ensureRealDirectory(root, "migration artifact directory");
    const inspector = Object.freeze({
      path(name) { if (!MIGRATION_INSPECTORS.has(inspector)) throw new TypeError("authentic MigrationArtifactInspector required"); const candidate = resolve(root, ...artifactSegments(name)); assertInside(root, candidate); return candidate; },
      read(name) { const path = inspector.path(name), before = lstatSync(path); if (!before.isFile() || before.isSymbolicLink()) throw new Error(`migration artifact must be a regular non-symlink file: ${path}`); const fd = openSync(path, constants.O_RDONLY | NOFOLLOW); try { if (!fstatSync(fd).isFile()) throw new Error(`migration artifact must be a regular non-symlink file: ${path}`); assertOpenedPath(fd, path, root, "migration artifact"); return readFileSync(fd); } finally { closeSync(fd); } },
    });
    MIGRATION_INSPECTORS.add(inspector);
    return inspector;
  }
}

function assertOpenedPath(fd, path, trustedRoot, label) {
  const opened = fstatSync(fd);
  const pathStat = lstatSync(path);
  if (pathStat.isSymbolicLink() || opened.dev !== pathStat.dev || opened.ino !== pathStat.ino) {
    throw new Error(`${label} changed while opening: ${path}`);
  }
  try {
    assertInside(trustedRoot, realpathSync(path));
  } catch {
    throw new Error(`${label} race escaped trusted artifact root: ${path}`);
  }
}

function fsyncDirectory(path) {
  const fd = openSync(path, constants.O_RDONLY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function writeBytes(data, encoding) {
  return typeof data === "string" ? Buffer.from(data, encoding) : Buffer.from(data);
}

function readDestinationBytes(path, trustedRoot) {
  const fd = openSync(path, constants.O_RDONLY | NOFOLLOW);
  try {
    if (!fstatSync(fd).isFile()) throw new Error(`artifact destination must be a regular file: ${path}`);
    assertOpenedPath(fd, path, trustedRoot, "artifact destination");
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

function snapshotDirectory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`artifact ancestor must be a real directory: ${path}`);
  return { path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) };
}

function verifyDirectory(snapshot) {
  const stat = lstatSync(snapshot.path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.dev !== snapshot.dev || stat.ino !== snapshot.ino || realpathSync(snapshot.path) !== snapshot.real) {
    throw new Error(`artifact directory changed during operation: ${snapshot.path}`);
  }
}

function ensureParentDirectories(root, segments) {
  let cursor = root;
  for (const segment of segments) {
    cursor = resolve(cursor, segment);
    assertInside(root, cursor);
    if (existsSync(cursor)) ensureRealDirectory(cursor, "artifact parent directory");
    else mkdirSync(cursor);
    assertInside(root, realpathSync(cursor));
  }
  return cursor;
}

/**
 * Controlled access to <worktree>/specs/<task>/.
 */
export class ArtifactDir {
  static open(worktreeRoot, taskHandle) {
    if (arguments.length !== 2) {
      throw new TypeError("ArtifactDir.open accepts only worktreeRoot and TaskHandle; caller task identity is forbidden");
    }
    if (typeof worktreeRoot !== "string" || !isAbsolute(worktreeRoot)) {
      throw new TypeError("worktreeRoot must be an absolute path");
    }
    assertTaskHandle(taskHandle);
    const task = validateTaskId(taskHandle.manifest?.task_id);
    if (taskHandle.identity?.taskId !== task) throw new Error("TaskHandle identity does not match manifest task_id");
    const realWorktree = ensureRealDirectory(resolve(worktreeRoot), "worktreeRoot");
    const specsRoot = resolve(realWorktree, "specs");

    const root = resolve(specsRoot, task);
    assertInside(specsRoot, root);
    if (existsSync(specsRoot)) ensureRealDirectory(specsRoot, "specs directory");
    if (existsSync(root)) ensureRealDirectory(root, "artifact directory");
    return new ArtifactDir(realWorktree, root, ARTIFACT_DIR_TOKEN, {
      worktree: snapshotDirectory(realWorktree),
      root: existsSync(root) ? snapshotDirectory(root) : null,
    });
  }

  constructor(worktreeRoot, root, token, state) {
    if (token !== ARTIFACT_DIR_TOKEN) throw new TypeError("ArtifactDir must be created with ArtifactDir.open()");
    this.worktreeRoot = worktreeRoot;
    this.root = root;
    ARTIFACT_DIR_STATES.set(this, state);
    Object.freeze(this);
  }

  verifyIdentity() {
    const state = ARTIFACT_DIR_STATES.get(this);
    if (!state) throw new Error("ArtifactDir capability state missing");
    verifyDirectory(state.worktree);
    if (state.root) verifyDirectory(state.root);
    return state;
  }

  path(relativeName) {
    this.verifyIdentity();
    const candidate = resolve(this.root, ...artifactSegments(relativeName));
    assertInside(this.root, candidate);
    const containmentRoot = existsSync(this.root) ? realpathSync(this.root) : this.worktreeRoot;
    assertExistingAncestorInside(containmentRoot, candidate);
    return candidate;
  }

  reference(relativeName) {
    this.verifyIdentity();
    return relative(this.worktreeRoot, this.path(relativeName)).split("\\").join("/");
  }

  /** Canonical task-relative reference; construction authority stays here. */
  reference(relativeName) {
    const segments = artifactSegments(relativeName);
    this.path(relativeName);
    return ["specs", this.root.split("/").at(-1), ...segments].join("/");
  }

  read(relativeName, encoding = "utf8") {
    this.verifyIdentity();
    const artifactPath = this.path(relativeName);
    const rootSnapshot = snapshotDirectory(this.root);
    const fd = openSync(artifactPath, constants.O_RDONLY | NOFOLLOW);
    try {
      if (!fstatSync(fd).isFile()) throw new Error(`artifact must be a regular file: ${artifactPath}`);
      assertOpenedPath(fd, artifactPath, rootSnapshot.real, "artifact");
      const value = readFileSync(fd, encoding);
      verifyDirectory(rootSnapshot);
      this.verifyIdentity();
      return value;
    } finally { closeSync(fd); }
  }

  writeAtomic(relativeName, data, { encoding = "utf8", mode = 0o600, testHooks } = {}) {
    const state = this.verifyIdentity();
    const segments = artifactSegments(relativeName);
    const desiredBytes = writeBytes(data, encoding);
    const specsRoot = resolve(this.worktreeRoot, "specs");
    if (!existsSync(specsRoot)) mkdirSync(specsRoot);
    else ensureRealDirectory(specsRoot, "specs directory");
    if (!existsSync(this.root)) mkdirSync(this.root);
    else ensureRealDirectory(this.root, "artifact directory");
    assertInside(this.worktreeRoot, realpathSync(this.root));
    if (!state.root) state.root = snapshotDirectory(this.root);
    else verifyDirectory(state.root);
    fsyncDirectory(specsRoot);
    const destination = this.path(relativeName);
    const parent = ensureParentDirectories(this.root, segments.slice(0, -1));
    const rootSnapshot = snapshotDirectory(this.root);
    const parentSnapshot = snapshotDirectory(parent);

    if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) {
      throw new Error(`artifact destination must not be a symlink: ${destination}`);
    }

    const temporary = resolve(parent, `.${randomUUID()}.tmp`);
    let fd;
    try {
      testHooks?.afterParentPrecheck?.();
      verifyDirectory(rootSnapshot);
      verifyDirectory(parentSnapshot);
      this.verifyIdentity();
      testHooks?.afterVerifyBeforeOpen?.();
      if (existsSync(destination)) {
        const existingBytes = readDestinationBytes(destination, rootSnapshot.real);
        verifyDirectory(rootSnapshot);
        verifyDirectory(parentSnapshot);
        this.verifyIdentity();
        if (Buffer.compare(existingBytes, desiredBytes) === 0) return destination;
      }
      fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, mode);
      assertOpenedPath(fd, temporary, rootSnapshot.real, "artifact temporary");
      writeFileSync(fd, desiredBytes);
      fsyncSync(fd);
      closeSync(fd);
      fd = undefined;
      verifyDirectory(rootSnapshot);
      verifyDirectory(parentSnapshot);
      renameSync(temporary, destination);
      fsyncDirectory(parent);
      verifyDirectory(rootSnapshot);
      verifyDirectory(parentSnapshot);
    } finally {
      if (fd !== undefined) closeSync(fd);
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    return destination;
  }
}
