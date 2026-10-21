import { closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync } from "node:fs";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { deriveTaskPath, validateProjectName, validateTaskId } from "./task-identity.mjs";
import { assertTaskHandle, brandTaskHandle } from "./task-capability.mjs";
import { createFileOnce, writeFileAtomic, appendRecord as appendOrdinaryRecord } from "../interface/safe-write.mjs";
import { createTaskDiskWriteExecutor } from "../evidence/disk-budget.mjs";
import { captureCommand as captureNativeCommand } from "../interface/run-command.mjs";
import { recordConfirmation as recordHumanConfirmation } from "../interface/human-confirm.mjs";
import { record as recordGitGrant, consume as consumeGitGrant } from "../interface/git-authorize.mjs";
import { withLock } from "../interface/record-lock.mjs";
import { createTrackedTempDir, cleanupStaleTempDirs } from "../interface/temp-dir.mjs";
export { assertTaskHandle } from "./task-capability.mjs";

const plain = value => value && typeof value === "object" && !Array.isArray(value);
const same = (a, b) => a.dev === b.dev && a.ino === b.ino;
function wantedIdentity(expected, expectedTaskId) {
  const projectName = typeof expected === "string" ? expected : expected?.projectName;
  const taskId = typeof expected === "string" ? expectedTaskId : expected?.taskId;
  return { projectName: validateProjectName(projectName), taskId: validateTaskId(taskId) };
}
function directories(path, create = false) {
  let cursor = parse(path).root;
  const names = [cursor];
  for (const part of path.slice(cursor.length).split(sep).filter(Boolean)) { cursor = join(cursor, part); names.push(cursor); }
  const snapshot = [];
  for (const path of names) {
    verifyDirectories(snapshot);
    let stat;
    try { stat = lstatSync(path); }
    catch (error) { if (!create || error.code !== "ENOENT") throw error; mkdirSync(path, { mode: 0o700 }); stat = lstatSync(path); }
    const alias = process.platform === "darwin" && ((path === "/tmp" && realpathSync(path) === "/private/tmp") || (path === "/var" && realpathSync(path) === "/private/var"));
    if ((!alias && stat.isSymbolicLink()) || (!alias && !stat.isDirectory())) throw new Error("task storage ancestor must be a real directory");
    snapshot.push({ path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) });
    verifyDirectories(snapshot);
  }
  verifyDirectories(snapshot);
  return snapshot;
}
function verifyDirectories(snapshot) {
  for (const before of snapshot) {
    const current = lstatSync(before.path);
    if (!same(current, before) || realpathSync(before.path) !== before.real) throw new Error("task storage ancestor changed during I/O");
  }
}
function recordPath(root, ref) {
  if (typeof ref !== "string" || !ref || isAbsolute(ref) || ref.includes("\\") || ref.includes("\0") || ref.split("/").some(part => !part || part === "." || part === "..")) throw new TypeError("record path must remain inside task storage");
  const path = resolve(root, ref), rel = relative(root, path);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("record path escapes task storage");
  return path;
}
function readBytes(root, ref) {
  if (!Number.isInteger(constants.O_NOFOLLOW)) throw new Error("O_NOFOLLOW is required for task reads");
  const path = recordPath(root, ref), ancestry = directories(dirname(path));
  const named = lstatSync(path);
  if (named.isSymbolicLink() || !named.isFile() || named.nlink !== 1) throw new Error("task record must be a single-link regular file");
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1 || !same(opened, named)) throw new Error("task record changed while opening");
    verifyDirectories(ancestry);
    const bytes = readFileSync(fd), after = lstatSync(path);
    if (after.isSymbolicLink() || after.nlink !== 1 || !same(after, opened)) throw new Error("task record changed during read");
    verifyDirectories(ancestry);
    return bytes;
  } finally { closeSync(fd); }
}
function manifestIdentity(manifest) {
  if (!plain(manifest)) throw new TypeError("task manifest must be an object");
  const identity = { projectName: validateProjectName(manifest.project_name), taskId: validateTaskId(manifest.task_id) };
  if (manifest.schema_version !== "1.0.0" || typeof manifest.target_repo_root !== "string" || !isAbsolute(manifest.target_repo_root)) throw new TypeError("task manifest schema or repository path is invalid");
  if (Object.hasOwn(manifest, "workspace_mode") || Object.hasOwn(manifest, "workspace_root")) {
    if (manifest.workspace_mode !== "existing" || typeof manifest.workspace_root !== "string" || !isAbsolute(manifest.workspace_root)) throw new TypeError("task workspace metadata is invalid");
  }
  return identity;
}
function deepFreeze(value) {
  if (value && typeof value === "object") { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); }
  return value;
}
/** Current metadata and protected record I/O; no publication or completion capability. */
export function openTask(taskPath, expected, expectedTaskId) {
  if (typeof taskPath !== "string" || !isAbsolute(taskPath)) throw new TypeError("taskPath must be absolute");
  const wanted = wantedIdentity(expected, expectedTaskId), rawPath = resolve(taskPath);
  const ancestry = directories(rawPath), root = realpathSync(rawPath);
  const suffix = ["Projects", wanted.projectName, "tasks", wanted.taskId];
  const segments = root.split(sep).slice(-suffix.length);
  const pathSegmentEqual = (actual, expected) => process.platform === "darwin"
    ? actual.toLowerCase() === expected.toLowerCase() : actual === expected;
  if (segments.length !== suffix.length || !segments.every((actual, index) => pathSegmentEqual(actual, suffix[index]))) throw new Error("task storage path does not match project/task identity");
  const manifestBytes = readBytes(root, "task.json"), manifest = JSON.parse(manifestBytes.toString("utf8")), actual = manifestIdentity(manifest);
  if (actual.projectName !== wanted.projectName || actual.taskId !== wanted.taskId) throw new Error("task manifest identity mismatch");
  const verify = () => { verifyDirectories(ancestry); if (!readBytes(root, "task.json").equals(manifestBytes)) throw new Error("task manifest changed after open"); };
  const writable = () => { verify(); if (manifest.activation_cohort !== "post") throw new Error("pre/history task records are read-only"); };
  const parents = ref => { recordPath(root, ref); directories(dirname(recordPath(root, ref)), true); verify(); };
  const performWrite = createTaskDiskWriteExecutor({taskRoot:root});
  const quality = ref => /^quality\/(?:evidence|reviews|tests)(?:\/|$)/.test(ref);
  const writeOptions = ref => quality(ref) ? {performWrite} : undefined;
  const sameOriginal = (ref,bytes) => { try { return readBytes(root,ref).equals(Buffer.from(bytes)); } catch(error) { if(error.code==='ENOENT')return false;throw error; } };
  const taskEvidenceDir = name => { const ref=`quality/evidence/${name}`;parents(`${ref}/.directory-probe`);return recordPath(root,ref); };
  const handle = {
    taskPath: root, identity: Object.freeze(actual), manifest: deepFreeze(manifest),
    recordPath(ref) { verify(); return recordPath(root, ref); },
    readRecord(ref) { verify(); const value = readBytes(root, ref).toString("utf8"); verify(); return value; },
    readRecordBytes(ref) { verify(); const value = readBytes(root, ref); verify(); return value; },
    async createRecord(ref, bytes, options = {}) { writable(); if (Object.keys(options).length) throw new TypeError("record write options are retired"); parents(ref); const result = await createFileOnce(root, ref, bytes, writeOptions(ref)); verify(); return result; },
    async writeRecordAtomic(ref, bytes, options = {}) { writable(); if (Object.keys(options).length) throw new TypeError("record write options are retired"); if (ref === "task.json") throw new Error("opened task metadata is immutable"); parents(ref);if(quality(ref)&&sameOriginal(ref,bytes))return {path:recordPath(root,ref),idempotent:true}; const guarded = quality(ref) ? {performWrite:(request,actualWrite)=>performWrite({...request,resolveExisting:()=>{verify();if(!sameOriginal(ref,bytes))return undefined;verify();return {path:recordPath(root,ref),idempotent:true};}},actualWrite)} : undefined; const result = await writeFileAtomic(root, ref, bytes, guarded); verify(); return result; },
    async appendRecord({dir,slug,ext,bytes}={}) { writable();recordPath(root,dir);if(!quality(dir))throw new TypeError('task append records belong to quality evidence/reviews/tests');parents(`${dir}/.directory-probe`);const path=await appendOrdinaryRecord(recordPath(root,dir),slug,ext,bytes,{performWrite});verify();return path; },
    async captureCommand({cwd,slug,argv,shell,timeoutMs,signal,resolveOutputRef}={}) { writable();parents('quality/tests/.directory-probe');return captureNativeCommand({cwd,recordDir:recordPath(root,'quality/tests'),slug,argv,shell,timeoutMs,signal,resolveOutputRef,performWrite}); },
    async recordConfirmation(fields,{cwd}={}) { writable();return recordHumanConfirmation(fields,{cwd,dir:taskEvidenceDir('human-confirmations'),lockDir:root,performWrite}); },
    async recordGitAuthorization({cwd,operation,confirmationRef,phase}={}) { writable();const path=await recordGitGrant({cwd,operation,confirmationRef,phase,dir:taskEvidenceDir('git-authorizations'),lockDir:root,performWrite});return {path}; },
    async consumeGitAuthorization({cwd,operation,stepId,authorizationRef,phase}={}) { writable();return consumeGitGrant({cwd,operation,stepId,authorizationRef,phase,dir:taskEvidenceDir('git-authorizations'),lockDir:root,performWrite}); },
    async withRecordLock(name, fn, options = {}) { writable(); return withLock(root, name, fn, options); },
    listCanonicalReviewResultRefs() {
      verify(); const ref = "quality/reviews/results", path = recordPath(root, ref);
      let ancestry; try { ancestry = directories(path); } catch (error) { if (error.code === "ENOENT") return Object.freeze([]); throw error; }
      const refs = readdirSync(path).filter(name => name.endsWith(".json")).map(name => {
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(name)) throw new Error("review result filename is unsafe");
        const result = `${ref}/${name}`; readBytes(root, result); return result;
      }).sort(); verifyDirectories(ancestry); verify(); return Object.freeze(refs);
    },
  };
  brandTaskHandle(handle);
  return Object.freeze(handle);
}

export async function createTask({ storageRoot, taskPath, manifest } = {}) {
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("storageRoot must be absolute");
  const identity = manifestIdentity(manifest);
  if (manifest.activation_cohort !== "post") throw new TypeError("new task metadata requires post cohort");
  const allowed = new Set(["schema_version", "project_name", "task_id", "created_at", "target_repo_root", "activation_cohort", "write_resolution_source", "baseline_commit", "workspace_mode", "workspace_root", "issue_ids", "inputs", "execution_mode", "record_model"]);
  if (Object.keys(manifest).some(key => !allowed.has(key))) throw new TypeError("new task metadata contains retired or unknown fields");
  if (manifest.record_model !== "vnext-single-write" || manifest.execution_mode !== "per_invocation") throw new TypeError("new task metadata requires the current record and execution model");
  if (!Number.isFinite(Date.parse(manifest.created_at)) || !Array.isArray(manifest.issue_ids) || !manifest.issue_ids.every(value => typeof value === "string" && value.trim()) || !plain(manifest.inputs)) throw new TypeError("new task metadata inputs are invalid");
  // Serialization is fallible and must precede every creation side effect (TCR259).
  const manifestBytes=JSON.stringify(manifest,null,2)+"\n";
  const storage = resolve(storageRoot); directories(storage);
  const root = realpathSync(storage), derived = deriveTaskPath(root, identity.projectName, identity.taskId);
  if (taskPath !== undefined && resolve(taskPath) !== derived) throw new Error("taskPath differs from storage-derived identity");
  const parent = dirname(derived), parentSnapshot=directories(parent, true);
  const requireAbsent=()=>{try{lstatSync(derived);}catch(error){if(error.code==='ENOENT')return;throw error;}throw Object.assign(new Error('task already exists'),{code:'EEXIST'});};
  await withLock(parent, "task-create", async () => {
    verifyDirectories(parentSnapshot);requireAbsent();
    const prefix='workflowhub-task-'+identity.taskId+'-create-';
    cleanupStaleTempDirs({root:realpathSync(parent),prefixes:[prefix],olderThanMs:0});
    const temporary=createTrackedTempDir(prefix,{root:realpathSync(parent)});
    let primaryError;
    try {
      const payload=join(temporary.path,'task');mkdirSync(payload,{mode:0o700});
      const payloadSnapshot=directories(payload);
      await createFileOnce(payload, "task.json", manifestBytes);
      verifyDirectories(parentSnapshot);verifyDirectories(payloadSnapshot);requireAbsent();
      renameSync(payload,derived);
      // Directory publication is durable only after the canonical parent sync.
      verifyDirectories(parentSnapshot);
      const fd=openSync(parent,constants.O_RDONLY|constants.O_NOFOLLOW);
      try { if(!same(fstatSync(fd),parentSnapshot.at(-1)))throw new Error('task parent changed during publication');fsyncSync(fd); }
      finally {closeSync(fd);}
    } catch(error) {primaryError=error;throw error;}
    finally {try{temporary.dispose();}catch(cleanupError){if(primaryError)throw Object.assign(new AggregateError([primaryError,cleanupError],'task creation and wrapper cleanup failed'),{code:'TASK_CREATE_CLEANUP_FAILED'});throw cleanupError;}}
  });
  return openTask(derived, identity);
}
