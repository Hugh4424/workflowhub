import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { validateTaskId } from "../task/task-identity.mjs";
import { writeFileAtomic } from "../interface/safe-write.mjs";

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

export function assertArtifactDir(value) {
  if (!value || typeof value !== "object" || !ARTIFACT_DIR_STATES.has(value)) throw new TypeError("authentic ArtifactDir capability required");
  value.verifyIdentity();
  return value;
}

export function artifactReference(taskId, relativeName) {
  const task = validateTaskId(taskId);
  return ["specs", task, ...artifactSegments(relativeName)].join("/");
}

function assertOpenedPath(fd, path, trustedRoot, label) {
  const opened = fstatSync(fd);
  const pathStat = lstatSync(path);
  if (!opened.isFile() || opened.nlink !== 1 || !pathStat.isFile() || pathStat.nlink !== 1 || pathStat.isSymbolicLink() || opened.dev !== pathStat.dev || opened.ino !== pathStat.ino) {
    throw new Error(`${label} changed while opening: ${path}`);
  }
  try {
    assertInside(trustedRoot, realpathSync(path));
  } catch {
    throw new Error(`${label} race escaped trusted artifact root: ${path}`);
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
      throw new TypeError("ArtifactDir.open accepts only worktreeRoot and task metadata; extra caller identity is forbidden");
    }
    if (typeof worktreeRoot !== "string" || !isAbsolute(worktreeRoot)) {
      throw new TypeError("worktreeRoot must be an absolute path");
    }
    if (!taskHandle || typeof taskHandle !== "object" || Array.isArray(taskHandle)
        || !taskHandle.manifest || typeof taskHandle.manifest !== "object" || Array.isArray(taskHandle.manifest)
        || !taskHandle.identity || typeof taskHandle.identity !== "object" || Array.isArray(taskHandle.identity)) {
      throw new TypeError("task manifest and identity metadata are required");
    }
    const task = validateTaskId(taskHandle.manifest?.task_id);
    if (taskHandle.identity?.taskId !== task) throw new Error("TaskHandle identity does not match manifest task_id");
    const realWorktree = ensureRealDirectory(resolve(worktreeRoot), "worktreeRoot");
    const specsRoot = resolve(realWorktree, "specs");

    const root = resolve(specsRoot, task);
    assertInside(specsRoot, root);
    if (existsSync(specsRoot)) ensureRealDirectory(specsRoot, "specs directory");
    if (existsSync(root)) ensureRealDirectory(root, "artifact directory");
    return new ArtifactDir(realWorktree, root, ARTIFACT_DIR_TOKEN, {
      activationCohort: taskHandle.manifest.activation_cohort,
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
    const ancestry = [];
    let cursor = this.worktreeRoot;
    const segments = relative(this.worktreeRoot, candidate).split(/[\\/]/);
    for (let index = 0; index < segments.length; index += 1) {
      cursor = resolve(cursor, segments[index]);
      let stat;
      try { stat = lstatSync(cursor); }
      catch (error) { if (error.code === "ENOENT") break; throw error; }
      if (stat.isSymbolicLink() || realpathSync(cursor) !== cursor) throw new Error(`artifact path alias is forbidden: ${cursor}`);
      if (index < segments.length - 1 && !stat.isDirectory()) throw new Error(`artifact parent must be a real directory: ${cursor}`);
      if (stat.isFile() && stat.nlink !== 1) throw Object.assign(new Error(`material file must have exactly one link: ${cursor}`), { code: "MATERIAL_MULTILINK" });
      if (stat.isDirectory()) ancestry.push(snapshotDirectory(cursor));
    }
    for (const before of ancestry) verifyDirectory(before);
    this.verifyIdentity();
    return candidate;
  }

  /** Canonical task-relative reference; construction authority stays here. */
  reference(relativeName) {
    const segments = artifactSegments(relativeName);
    this.path(relativeName);
    return ["specs", this.root.split(/[\\/]/).at(-1), ...segments].join("/");
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
      assertOpenedPath(fd, artifactPath, rootSnapshot.real, "artifact");
      this.path(relativeName);
      verifyDirectory(rootSnapshot);
      this.verifyIdentity();
      return value;
    } finally { closeSync(fd); }
  }

  async writeAtomic(relativeName, data, options = {}) {
    const { encoding = "utf8", mode = 0o600 } = options;
    if (mode !== 0o600 || Object.keys(options).some(key => key !== "encoding" && key !== "mode")) {
      throw new TypeError("artifact writes use safe-write permissions and do not accept private write hooks");
    }
    const state = this.verifyIdentity();
    if (state.activationCohort !== "post") throw new Error("pre/history material writes are read-only");
    const segments = artifactSegments(relativeName);
    const bytes = typeof data === "string" ? Buffer.from(data, encoding) : Buffer.from(data);
    const specsRoot = resolve(this.worktreeRoot, "specs");
    if (!existsSync(specsRoot)) mkdirSync(specsRoot);
    else ensureRealDirectory(specsRoot, "specs directory");
    if (!existsSync(this.root)) mkdirSync(this.root);
    else ensureRealDirectory(this.root, "artifact directory");
    assertInside(this.worktreeRoot, realpathSync(this.root));
    if (!state.root) state.root = snapshotDirectory(this.root);
    else verifyDirectory(state.root);
    ensureParentDirectories(this.root, segments.slice(0, -1));
    const destination = this.path(relativeName);
    // Identical material bytes keep their existing inode and timestamps;
    // this ordinary protected read does not restore a digest/CAS authority.
    if (existsSync(destination) && this.read(relativeName, null).equals(bytes)) return destination;
    const published = await writeFileAtomic(this.root, segments.join("/"), bytes);
    this.verifyIdentity();
    return published.path;
  }
}
