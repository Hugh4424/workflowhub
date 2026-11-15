#!/usr/bin/env node
// 写者记录与锁证明的唯一私有入口。消费者是独立测试者与 build-code 主会话；
// 只核「谁写了哪些共享文件、锁证明是否存在、中断半成品是否隔离、临时资源是否清理」，
// 不证明未进入同一把锁的外部直写不存在，也不替代真实双进程证据。
//
// 用法：node check-write-set.mjs --dir <含 write-set.json 的目录> [--worktree <工作区根>]
// 每个锁证明要记录实际取得锁的目录与锁文件，并由清理记录回读同一位置；
// 锁域必须等于当前工作区根，任务根或其它目录的锁不能标成 workspace。
// 退出码：0 通过；1 目标失败（记录不合规）；2 输入不可读。
// 失败码以本脚本的 reject()/unreadable() 调用为唯一来源；文档不复刻副本。
import {existsSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, join, resolve} from "node:path";
import {spawnSync} from "node:child_process";

const KIND = "write-set";
const RECORD_LOCK = "runtime/interface/record-lock.mjs";

function unreadable(code, detail) {
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 2;
}
function reject(code, detail) {
  process.stdout.write(JSON.stringify({ok: false, kind: KIND, error: {code, detail}}) + "\n");
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 1;
}
const nonEmpty = value => typeof value === "string" && value.trim() !== "";
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isPath = value => nonEmpty(value) && !value.includes("\\") && !value.split("/").some(part => part === ".." || part === "");
const isTime = value => nonEmpty(value) && Number.isFinite(Date.parse(value));
const isPid = value => Number.isSafeInteger(value) && value > 0;

function validate(doc, {worktreeRoot}) {
  if (!isObject(doc)) return {code: "WRITE_SET_SHAPE_INVALID", detail: "write-set.json must be an object"};
  if (doc.schema_version !== "1.0.0") return {code: "WRITE_SET_SHAPE_INVALID", detail: "schema_version must be 1.0.0"};
  if (doc.kind !== KIND) return {code: "WRITE_SET_SHAPE_INVALID", detail: "kind must be write-set"};
  const worktree = doc.worktree;
  if (!isObject(worktree) || !nonEmpty(worktree.root_ref) || !nonEmpty(worktree.branch_ref) || !nonEmpty(worktree.session)) {
    return {code: "WRITE_SET_SHAPE_INVALID", detail: "worktree must name root_ref, branch_ref and session"};
  }
  const lock = doc.lock;
  if (!isObject(lock)) return {code: "WRITE_SET_SHAPE_INVALID", detail: "lock is required"};
  if (!nonEmpty(lock.implementation) || !lock.implementation.replace(/^\.\//, "").endsWith(RECORD_LOCK)) {
    return {code: "WRITE_SET_LOCK_DOMAIN_INVALID", detail: `workspace writes must reuse ${RECORD_LOCK}`};
  }
  if (lock.domain !== "workspace") return {code: "WRITE_SET_LOCK_DOMAIN_INVALID", detail: "lock.domain must be workspace"};
  if (!nonEmpty(lock.name) || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(lock.name)) {
    return {code: "WRITE_SET_LOCK_DOMAIN_INVALID", detail: "lock.name must be a simple lowercase name"};
  }
  if (!Array.isArray(lock.proofs) || lock.proofs.length === 0) return {code: "WRITE_SET_LOCK_PROOF_MISSING", detail: "lock.proofs is empty"};
  const proofIds = new Set();
  const proofFiles = [];
  for (const proof of lock.proofs) {
    if (!isObject(proof) || !nonEmpty(proof.id) || proofIds.has(proof.id)) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: "each proof needs a unique id"};
    }
    proofIds.add(proof.id);
    if (!isPid(proof.pid) || !nonEmpty(proof.host) || !nonEmpty(proof.nonce) || !isTime(proof.started_at) || !isTime(proof.released_at)) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: `proof ${proof.id} needs pid, host, nonce, started_at and released_at`};
    }
    if (Date.parse(proof.released_at) < Date.parse(proof.started_at)) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: `proof ${proof.id} was released before it was acquired`};
    }
    // 锁证明要落到真实取得位置：没有位置就只能算自述，不能证明这是工作区锁。
    if (!nonEmpty(proof.lock_root) || !nonEmpty(proof.lock_file)) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: `proof ${proof.id} needs lock_root and lock_file`};
    }
    const recordedRoot = isAbsolute(proof.lock_root) ? resolve(proof.lock_root) : resolve(worktreeRoot, proof.lock_root);
    if (!existsSync(recordedRoot)) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: `proof ${proof.id} lock root does not exist: ${proof.lock_root}`};
    }
    const recordedRootReal = realpathSync(recordedRoot);
    if (recordedRootReal !== worktreeRoot) {
      return {code: "WRITE_SET_LOCK_DOMAIN_INVALID", detail: `proof ${proof.id} lock root ${recordedRootReal} is not the current worktree root ${worktreeRoot}`};
    }
    const expectedFile = join(recordedRootReal, `.${lock.name}.lock`);
    const recordedFile = isAbsolute(proof.lock_file) ? resolve(proof.lock_file) : resolve(recordedRootReal, proof.lock_file);
    if (recordedFile !== expectedFile) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: `proof ${proof.id} lock file ${proof.lock_file} is not ${expectedFile}`};
    }
    proofFiles.push({id: proof.id, root: recordedRootReal, file: expectedFile});
  }
  // A worktree has exactly one writer at a time. Disjoint file lists do not make
  // two concurrent writers valid, and one shared lock proof cannot cover both.
  if (!Array.isArray(doc.writers) || doc.writers.length !== 1) {
    return {code: "WRITE_SET_DOUBLE_WRITER", detail: "exactly one unique writer is required per worktree"};
  }
  const writerIds = new Set();
  for (const writer of doc.writers) {
    if (!isObject(writer) || !nonEmpty(writer.id) || writerIds.has(writer.id)) {
      return {code: "WRITE_SET_SHAPE_INVALID", detail: "each writer needs a unique id"};
    }
    writerIds.add(writer.id);
    if (writer.role !== "唯一写者") return {code: "WRITE_SET_DOUBLE_WRITER", detail: `writer ${writer.id} is not declared the unique writer`};
    if (!nonEmpty(writer.session_ref)) return {code: "WRITE_SET_SHAPE_INVALID", detail: `writer ${writer.id} needs session_ref`};
    if (!Array.isArray(writer.files) || writer.files.length === 0) return {code: "WRITE_SET_SHAPE_INVALID", detail: `writer ${writer.id} declares no files`};
    const own = new Set();
    for (const file of writer.files) {
      if (!isPath(file) || own.has(file)) return {code: "WRITE_SET_SHAPE_INVALID", detail: `writer ${writer.id} has an invalid or duplicate path`};
      own.add(file);
    }
  }
  if (!Array.isArray(doc.shared_files) || doc.shared_files.length === 0) return {code: "WRITE_SET_SHAPE_INVALID", detail: "shared_files is empty"};
  const shared = new Set();
  for (const entry of doc.shared_files) {
    if (!isObject(entry) || !isPath(entry.path) || shared.has(entry.path)) {
      return {code: "WRITE_SET_DOUBLE_WRITER", detail: "a shared file is listed twice"};
    }
    shared.add(entry.path);
    if (!writerIds.has(entry.writer)) return {code: "WRITE_SET_WRITER_UNKNOWN", detail: `${entry.path} names unknown writer ${entry.writer}`};
    if (!doc.writers.find(writer => writer.id === entry.writer).files.includes(entry.path)) {
      return {code: "WRITE_SET_SHAPE_INVALID", detail: `${entry.path} is not declared in writer ${entry.writer}`};
    }
    if (!nonEmpty(entry.lock_proof) || !proofIds.has(entry.lock_proof)) {
      return {code: "WRITE_SET_LOCK_PROOF_MISSING", detail: `${entry.path} has no readable lock proof`};
    }
  }
  if (!Array.isArray(doc.interrupted)) return {code: "WRITE_SET_SHAPE_INVALID", detail: "interrupted must be an array"};
  for (const item of doc.interrupted) {
    if (!isObject(item) || !nonEmpty(item.id) || !isPath(item.path)) return {code: "WRITE_SET_SHAPE_INVALID", detail: "each interrupted item needs id and path"};
    if (item.isolated !== true || item.sent_for_verification !== false) {
      return {code: "WRITE_SET_INTERRUPTED_NOT_ISOLATED", detail: `${item.id} is not isolated or was sent for verification`};
    }
  }
  const cleanup = doc.cleanup;
  if (!isObject(cleanup)) return {code: "WRITE_SET_CLEANUP_MISSING", detail: "cleanup is required"};
  const tempPaths = cleanup.temp_paths, processes = cleanup.processes, lockFiles = cleanup.lock_files;
  if (!Array.isArray(tempPaths) || !Array.isArray(processes) || !Array.isArray(lockFiles)) {
    return {code: "WRITE_SET_CLEANUP_MISSING", detail: "cleanup must list temp_paths, processes and lock_files"};
  }
  if (tempPaths.length + processes.length + lockFiles.length === 0) return {code: "WRITE_SET_CLEANUP_MISSING", detail: "cleanup list is empty"};
  for (const entry of tempPaths) if (!isObject(entry) || !isPath(entry.path) || entry.state !== "removed") return {code: "WRITE_SET_CLEANUP_MISSING", detail: "a temp path is not removed"};
  for (const entry of processes) if (!isObject(entry) || !isPid(entry.pid) || entry.state !== "stopped") return {code: "WRITE_SET_CLEANUP_MISSING", detail: "a process is not stopped"};
  for (const entry of lockFiles) if (!isObject(entry) || !(isPath(entry.path) || isAbsolute(entry.path)) || entry.state !== "removed") return {code: "WRITE_SET_CLEANUP_MISSING", detail: "a lock file is not removed"};
  // 回读：清理记录必须指向与锁证明相同的位置，不能只写一个像锁文件的名字。
  const removed = new Set(lockFiles.map((entry) => isAbsolute(entry.path) ? resolve(entry.path) : resolve(worktreeRoot, entry.path)));
  for (const proof of proofFiles) {
    if (!removed.has(proof.file)) {
      return {code: "WRITE_SET_LOCK_PROOF_INVALID", detail: `proof ${proof.id} lock file ${proof.file} is not read back in cleanup.lock_files`};
    }
  }
  if (!isTime(cleanup.verified_at)) return {code: "WRITE_SET_CLEANUP_MISSING", detail: "cleanup.verified_at is required"};
  return null;
}

// 锁域是当前 worktree 根：优先用 git 的真实工作区根，受控临时工作区由 --worktree 声明。
function gitWorktree(path) {
  try {
    const result = spawnSync("git", ["-C", path, "rev-parse", "--show-toplevel"], {encoding: "utf8"});
    return result.status === 0 ? String(result.stdout).trim() : null;
  } catch {
    return null;
  }
}
function main() {
  const argv = process.argv.slice(2);
  const option = (name) => {
    const index = argv.indexOf(name);
    return index < 0 ? null : argv[index + 1] ?? null;
  };
  const dirArg = option("--dir");
  if (!dirArg) return unreadable("WRITE_SET_DIR_REQUIRED", "usage: --dir <directory> [--worktree <worktree root>]");
  const dir = resolve(dirArg);
  const file = join(dir, "write-set.json");
  if (!existsSync(file)) return unreadable("WRITE_SET_UNREADABLE", `missing ${file}`);
  const worktreeArg = option("--worktree");
  const worktreePath = worktreeArg ? resolve(worktreeArg) : (gitWorktree(process.cwd()) || process.cwd());
  if (!worktreePath) return unreadable("WRITE_SET_WORKTREE_UNAVAILABLE", `no git worktree found for ${dir}; pass --worktree`);
  if (!existsSync(worktreePath)) return unreadable("WRITE_SET_WORKTREE_UNAVAILABLE", `worktree root not found: ${worktreePath}`);
  const worktreeRoot = realpathSync(worktreePath);
  let doc;
  try { doc = JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { return unreadable("WRITE_SET_UNREADABLE", error.message); }
  const failure = validate(doc, {worktreeRoot});
  if (failure) return reject(failure.code, failure.detail);
  process.stdout.write(JSON.stringify({
    ok: true,
    kind: KIND,
    writers: doc.writers.map(writer => writer.id),
    shared_files: doc.shared_files.length,
    lock: {name: doc.lock.name, domain: doc.lock.domain, proofs: doc.lock.proofs.length, root: worktreeRoot, files: doc.lock.proofs.map(proof => proof.lock_file)},
  }, null, 2) + "\n");
  process.exitCode = 0;
}

main();
