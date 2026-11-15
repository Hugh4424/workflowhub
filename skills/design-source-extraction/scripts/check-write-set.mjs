#!/usr/bin/env node
// 写者记录与锁证明的唯一私有入口。消费者是独立测试者与 build-code 主会话；
// 只核「谁写了哪些共享文件、锁证明是否存在、中断半成品是否隔离、临时资源是否清理」，
// 不证明未进入同一把锁的外部直写不存在，也不替代真实双进程证据。
//
// 用法：node check-write-set.mjs --dir <含 write-set.json 的目录>
// 退出码：0 通过；1 目标失败（记录不合规）；2 输入不可读。
// 失败码以本脚本的 reject()/unreadable() 调用为唯一来源；文档不复刻副本。
import {existsSync, readFileSync} from "node:fs";
import {join, resolve} from "node:path";

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

function validate(doc) {
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
  for (const entry of lockFiles) if (!isObject(entry) || !isPath(entry.path) || entry.state !== "removed") return {code: "WRITE_SET_CLEANUP_MISSING", detail: "a lock file is not removed"};
  if (!isTime(cleanup.verified_at)) return {code: "WRITE_SET_CLEANUP_MISSING", detail: "cleanup.verified_at is required"};
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  const dirIndex = argv.indexOf("--dir");
  if (dirIndex < 0 || !argv[dirIndex + 1]) return unreadable("WRITE_SET_DIR_REQUIRED", "usage: --dir <directory>");
  const dir = resolve(argv[dirIndex + 1]);
  const file = join(dir, "write-set.json");
  if (!existsSync(file)) return unreadable("WRITE_SET_UNREADABLE", `missing ${file}`);
  let doc;
  try { doc = JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { return unreadable("WRITE_SET_UNREADABLE", error.message); }
  const failure = validate(doc);
  if (failure) return reject(failure.code, failure.detail);
  process.stdout.write(JSON.stringify({
    ok: true,
    kind: KIND,
    writers: doc.writers.map(writer => writer.id),
    shared_files: doc.shared_files.length,
    lock: {name: doc.lock.name, domain: doc.lock.domain, proofs: doc.lock.proofs.length},
  }, null, 2) + "\n");
  process.exitCode = 0;
}

main();
