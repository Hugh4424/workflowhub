#!/usr/bin/env node
/**
 * P4 受控测试数据夹具（非产品入口，非真实测试入口）。
 *
 * 调用者拥有显式隔离根，本脚本只在该根内读写：
 * - 缺 --data-root 或缺 --sample-version 时，在产生任何样本前具名失败；
 *   不读 cwd 的准备结果，也不回退 TMPDIR 或产品库。
 * - 请求版本或现有样本版本落后于 REQUIRED_SAMPLE_VERSION 时具名失败，
 *   不静默升级；较新且未登记的版本同样拒绝。
 * - 同一 seed 复跑得到同一字节；回执给数据来源、每任务上限依据、
 *   可重复命令、版本诊断与清理指针。
 * - --clean 只删清单列出的自有对象，回执带 owner 与 complete 完成信号；
 *   清单损坏或缺失导致归属不可证时先具名失败，确认根内只有本夹具对象后用
 *   --clean --discard-invalid-manifest 按固定自有路径恢复。
 * - 根与根内路径组件不得是符号链接；写删前都重核路径，防止经链接作用到根外。
 * - 写入走同目录临时文件 + rename；根内锁拒绝并发写者；崩溃残留的临时文件与
 *   接管 claim 在下次 prepare/clean 时按固定前缀回收。
 * - 限制：删前二次核与 rm 之间仍有同权限并发换链的 TOCTOU 窗口，路径 API 无法
 *   完全消除；本夹具靠根内单写者锁与拒绝任何符号链接组件收窄，不声称已消除。
 *
 * 为什么不直接复用 runtime/interface/temp-dir.mjs：该能力创建随机子目录并负责
 * 进程级回收；本夹具要在调用者给定的稳定根上按同一 seed 复跑同路径，并且只清
 * 清单内自有对象，因此隔离根由调用者的临时根/afterEach 拥有，夹具不建第二临时根。
 *
 * 唯一数据 owner 是 testing-system-blueprint 的测试数据约定；本文件只是
 * 受控夹具，不设第二 owner、不写固定配额。真实测试入口的配置解析者不在
 * 本夹具写集内：本夹具只证 fixture 级隔离，不声称真实入口已证。
 */

import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = "prepare-test-data.mjs";
const SCHEMA = "workflowhub-test-data.v1";
const REQUIRED_SAMPLE_VERSION = "1.0.0";
const SEED = "workflowhub-p4-synthetic-seed-v1";
const OWNER = "测试数据负责人（testing-system-blueprint 数据内容 owner）";
const MANIFEST = "manifest.json";
const RECORDS_DIR = "records";
const LOCK = ".prepare-test-data.lock";
const CLAIM_PREFIX = `${LOCK}.claim-`;
const TEMPORARY_PREFIX = ".prepare-test-data.tmp-";
const RECORDS = [
  { id: "synth-task-001", phase: "P4", checks: ["version", "isolation"] },
  { id: "synth-task-002", phase: "P5", checks: ["readiness"] },
];
const OWNED_FILES = new Set([MANIFEST, ...RECORDS.map((record) => `${RECORDS_DIR}/${record.id}.json`)]);
const USAGE = `用法: node tests/fixtures/execution-quality/${SCRIPT} --data-root <显式隔离根> --sample-version <版本> [--clean [--discard-invalid-manifest]]`;
// 1 = 读回或清理未完成；2 = 缺配置、参数、锁或隔离根越界；3 = 样本版本落后/不符。
const EXIT_READBACK = 1;
const EXIT_CONFIG = 2;
const EXIT_VERSION = 3;

class Refusal extends Error {
  constructor(exitCode, message) {
    super(message);
    this.exitCode = exitCode;
  }
}

class InvalidManifest extends Refusal {}

const refuse = (exitCode, message) => { throw new Refusal(exitCode, message); };
const manifestError = (detail) => {
  throw new InvalidManifest(EXIT_CONFIG, `现有样本清单无效（${detail}）；不覆盖无法核实的对象。修复：核隔离根内只有本夹具对象后运行 --clean --discard-invalid-manifest。`);
};

function emit(receipt) {
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isWithin = (parent, child) => {
  const rel = relative(parent, child);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
};

/** 用 lstat 判类型：悬挂符号链接同样算 symlink，不会被 existsSync 漏掉。 */
function pathKind(target) {
  try {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink()) return "symlink";
    if (stat.isFile()) return "file";
    if (stat.isDirectory()) return "directory";
    return "other";
  } catch (error) {
    if (error?.code === "ENOENT") return "missing";
    throw error;
  }
}

function pathShapeDetail(value, what) {
  if (typeof value !== "string" || !value) return `${what} 不是非空字符串`;
  if (isAbsolute(value)) return `${what} 不是相对路径`;
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) return `${what} 含空段或越界段`;
  return null;
}

function parseArguments(argv) {
  const options = { dataRoot: null, sampleVersion: null, clean: false, discardInvalidManifest: false };
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--clean" || token === "--discard-invalid-manifest") {
      if (seen.has(token)) refuse(EXIT_CONFIG, `重复的 ${token}`);
      seen.add(token);
      options[token === "--clean" ? "clean" : "discardInvalidManifest"] = true;
      continue;
    }
    if (token === "--data-root" || token === "--sample-version") {
      if (seen.has(token)) refuse(EXIT_CONFIG, `重复的 ${token}`);
      seen.add(token);
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) refuse(EXIT_CONFIG, `${token} 缺少取值`);
      options[token === "--data-root" ? "dataRoot" : "sampleVersion"] = value;
      index += 1;
      continue;
    }
    refuse(EXIT_CONFIG, `未知参数 ${token}`);
  }
  if (options.discardInvalidManifest && !options.clean) refuse(EXIT_CONFIG, "--discard-invalid-manifest 只能与 --clean 一起使用");
  return options;
}

function checkedDataRoot(value) {
  if (!value) {
    refuse(EXIT_CONFIG, "缺少必需的 --data-root（显式隔离根）；本夹具不回退 cwd、TMPDIR 或产品库。");
  }
  if (!isAbsolute(value)) refuse(EXIT_CONFIG, `--data-root 必须是绝对路径: ${value}`);
  const declaredKind = pathKind(value);
  if (declaredKind === "missing") refuse(EXIT_CONFIG, `--data-root 不存在: ${value}`);
  if (declaredKind === "symlink") refuse(EXIT_CONFIG, `--data-root 不能是符号链接（传它指向的真实目录）: ${value}`);
  if (declaredKind !== "directory") refuse(EXIT_CONFIG, `--data-root 不是目录: ${value}`);
  const root = realpathSync(value);
  const repoRoot = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
  if (root === "/") refuse(EXIT_CONFIG, "--data-root 不能是文件系统根");
  if (root === realpathSync(process.cwd())) {
    refuse(EXIT_CONFIG, "--data-root 不能是当前工作目录：cwd 是回退来源，不能充当隔离根");
  }
  if (isWithin(root, repoRoot)) refuse(EXIT_CONFIG, `--data-root 不能是产品仓根或其祖先: ${root}`);
  if (isWithin(repoRoot, root)) refuse(EXIT_CONFIG, `--data-root 不能位于产品仓内: ${root}`);
  return root;
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function checkedVersion(value) {
  if (!value) {
    refuse(EXIT_CONFIG, "缺少必需的 --sample-version（夹具要求的样本版本）；本夹具不猜版本，也不从 cwd 读准备结果。");
  }
  const requested = parseVersion(value);
  if (!requested) refuse(EXIT_CONFIG, `无法解析的样本版本 ${JSON.stringify(value)}；要求 ${REQUIRED_SAMPLE_VERSION}`);
  const order = compareVersions(requested, parseVersion(REQUIRED_SAMPLE_VERSION));
  if (order < 0) {
    refuse(EXIT_VERSION, `样本版本 ${value} 落后于要求的 ${REQUIRED_SAMPLE_VERSION}（stale）；拒绝准备，不静默升级。`);
  }
  if (order > 0) {
    refuse(EXIT_VERSION, `样本版本 ${value} 高于要求的 ${REQUIRED_SAMPLE_VERSION}（unsupported）；未登记的更新版本不认。`);
  }
  return value;
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "ESRCH" ? false : true;
  }
}

function acquireLock(root) {
  const path = join(root, LOCK);
  const lockBytes = () => `${JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() })}\n`;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const lockKind = pathKind(path);
    if (lockKind === "missing") {
      try {
        writeFileSync(path, lockBytes(), { flag: "wx", mode: 0o600 });
        return path;
      } catch (error) {
        if (error?.code === "EEXIST") continue;
        throw error;
      }
    }
    if (lockKind !== "file") refuse(EXIT_CONFIG, `锁路径不是普通文件: ${path}`);
    let holder = null;
    try { holder = JSON.parse(readFileSync(path, "utf8"))?.pid; } catch { holder = null; }
    if (Number.isSafeInteger(holder) && holder > 0 && isPidAlive(holder)) {
      refuse(EXIT_CONFIG, `另一个夹具进程正在使用该隔离根（pid=${holder}，锁=${path}）；等它结束后重跑。`);
    }
    // 陈旧锁用 rename 成唯一 claim 再 O_EXCL 重建；rename 失败即他人已接管，重读后重判。
    const claim = join(root, `${CLAIM_PREFIX}${process.pid}-${Date.now()}-${attempt}`);
    try {
      renameSync(path, claim);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    let moved = null;
    try { moved = JSON.parse(readFileSync(claim, "utf8"))?.pid; } catch { moved = null; }
    if (Number.isSafeInteger(moved) && moved > 0 && moved !== process.pid && isPidAlive(moved)) {
      // 竞态中接管到别人的新锁：原路径空则放回，本进程退出，绝不删除活锁。
      try { if (pathKind(path) === "missing") renameSync(claim, path); } catch { /* claim 留给下轮按前缀回收 */ }
      refuse(EXIT_CONFIG, "锁竞争：另一个夹具进程已接管该隔离根，重跑。");
    }
    rmSync(claim, { force: true });
  }
  refuse(EXIT_CONFIG, "锁竞争：多次尝试仍未能取得隔离根锁，重跑。");
}

function releaseLock(path) {
  try {
    if (pathKind(path) !== "file") return;
    const holder = JSON.parse(readFileSync(path, "utf8"))?.pid;
    if (holder === process.pid) rmSync(path, { force: true });
  } catch (error) {
    process.stderr.write(`${SCRIPT}: 释放锁失败（${error?.code ?? "UNKNOWN"}）：${error?.message ?? String(error)}\n`);
    if (!process.exitCode) process.exitCode = EXIT_READBACK;
  }
}

function readExistingManifest(root) {
  const path = join(root, MANIFEST);
  const kind = pathKind(path);
  if (kind === "missing") return null;
  if (kind !== "file") manifestError("清单不是普通文件");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    manifestError(`JSON 不可解析: ${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) manifestError("顶层不是对象");
  if (parsed.schema !== SCHEMA) manifestError(`schema 应为 ${SCHEMA}`);
  if (parsed.owner !== OWNER) manifestError("owner 不符");
  if (typeof parsed.seed !== "string" || !parsed.seed) manifestError("seed 不是非空字符串");
  if (typeof parsed.sample_version !== "string" || !parseVersion(parsed.sample_version)) manifestError("sample_version 不可解析");
  if (!Array.isArray(parsed.files)) manifestError("files 不是数组");
  if (parsed.total_bytes !== undefined && (!Number.isSafeInteger(parsed.total_bytes) || parsed.total_bytes < 0)) manifestError("total_bytes 不是非负整数");
  const seen = new Set();
  parsed.files.forEach((file, index) => {
    if (!file || typeof file !== "object" || Array.isArray(file)) manifestError(`files[${index}] 不是对象`);
    const detail = pathShapeDetail(file.path, `files[${index}].path`);
    if (detail) manifestError(detail);
    if (typeof file.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(file.sha256)) manifestError(`files[${index}].sha256 形态不符`);
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0) manifestError(`files[${index}].bytes 不是非负整数`);
    if (seen.has(file.path)) manifestError(`files[${index}].path 重复`);
    seen.add(file.path);
  });
  return parsed;
}

function assertCurrentSample(manifest) {
  const existing = manifest.sample_version;
  const parsed = parseVersion(existing);
  const order = compareVersions(parsed, parseVersion(REQUIRED_SAMPLE_VERSION));
  if (order < 0) refuse(EXIT_VERSION, `现有样本版本 ${existing} 落后于要求的 ${REQUIRED_SAMPLE_VERSION}（stale）；先用 --clean 回收再由负责人重新准备。`);
  if (order > 0) refuse(EXIT_VERSION, `现有样本版本 ${existing} 高于要求的 ${REQUIRED_SAMPLE_VERSION}（unsupported）；先用 --clean 回收再准备。`);
}

/** 拒绝符号链接与根外路径；返回必须在 root 内的目标绝对路径。 */
function assertOwnedPath(root, relativePath) {
  const detail = pathShapeDetail(relativePath, "清单路径");
  if (detail) refuse(EXIT_CONFIG, `${detail}，拒绝处理: ${JSON.stringify(relativePath)}`);
  let current = root;
  for (const part of relativePath.split("/")) {
    current = join(current, part);
    if (pathKind(current) === "symlink") refuse(EXIT_CONFIG, `路径经过符号链接，拒绝处理: ${relativePath}`);
  }
  if (pathKind(current) !== "missing") {
    const parent = realpathSync(dirname(current));
    if (!isWithin(root, parent)) refuse(EXIT_CONFIG, `路径解析到隔离根外，拒绝处理: ${relativePath}`);
  }
  return current;
}

function ensureOwnedDirectory(root, relativeDirectory) {
  let current = root;
  for (const part of relativeDirectory.split("/")) {
    current = join(current, part);
    const kind = pathKind(current);
    if (kind === "symlink") refuse(EXIT_CONFIG, `样本目录经过符号链接，拒绝写入: ${current}`);
    if (kind === "directory") continue;
    if (kind === "missing") {
      mkdirSync(current, { mode: 0o700 });
      continue;
    }
    refuse(EXIT_CONFIG, `样本目录不是目录，拒绝写入: ${current}`);
  }
  return current;
}

let temporaryCounter = 0;

function writeAtomic(target, content) {
  temporaryCounter += 1;
  const temporary = join(dirname(target), `${TEMPORARY_PREFIX}${process.pid}-${temporaryCounter}`);
  try {
    writeFileSync(temporary, content, { flag: "wx", mode: 0o600 });
    renameSync(temporary, target);
  } catch (error) {
    try { rmSync(temporary, { force: true }); } catch { /* 具名失败仍按下一行给出 */ }
    refuse(EXIT_READBACK, `写入失败（${target}）：${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

function sweepTemporaries(root) {
  const removeTemporaries = (directory) => {
    if (pathKind(directory) !== "directory") return;
    for (const name of readdirSync(directory)) {
      if (!name.startsWith(TEMPORARY_PREFIX) && !name.startsWith(CLAIM_PREFIX)) continue;
      const target = join(directory, name);
      if (pathKind(target) !== "file") refuse(EXIT_CONFIG, `残留临时路径不是普通文件，拒绝清理: ${target}`);
      rmSync(target, { force: true });
    }
  };
  removeTemporaries(root);
  const recordsDirectory = join(root, RECORDS_DIR);
  removeTemporaries(recordsDirectory);
  if (pathKind(recordsDirectory) === "directory" && readdirSync(recordsDirectory).length === 0) {
    rmdirSync(recordsDirectory);
  }
}

function buildSample() {
  const files = RECORDS.map((record) => {
    const path = `${RECORDS_DIR}/${record.id}.json`;
    const content = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
    return { path, sha256: sha256(content), bytes: content.length, content };
  });
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const manifest = {
    schema: SCHEMA,
    sample_version: REQUIRED_SAMPLE_VERSION,
    seed: SEED,
    owner: OWNER,
    files: files.map(({ path, sha256: hash, bytes }) => ({ path, sha256: hash, bytes })),
    total_bytes: totalBytes,
    cleanup: {
      owner: OWNER,
      command: `node tests/fixtures/execution-quality/${SCRIPT} --data-root <该隔离根> --clean`,
      completion_signal: "clean 回执 complete:true 且隔离根为空",
    },
  };
  const manifestContent = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  return { files, manifestContent };
}

function writeSample(root, sample) {
  const written = [];
  const reused = [];
  for (const file of sample.files) {
    const target = assertOwnedPath(root, file.path);
    ensureOwnedDirectory(root, RECORDS_DIR);
    const targetKind = pathKind(target);
    if (targetKind !== "missing") {
      if (targetKind !== "file") refuse(EXIT_CONFIG, `目标位置不是普通文件，拒绝覆盖: ${target}`);
      if (readFileSync(target).equals(file.content)) {
        reused.push(file.path);
        continue;
      }
    }
    writeAtomic(target, file.content);
    written.push(file.path);
  }
  const manifestPath = assertOwnedPath(root, MANIFEST);
  const manifestKind = pathKind(manifestPath);
  if (manifestKind !== "missing") {
    if (manifestKind !== "file") refuse(EXIT_CONFIG, `目标位置不是普通文件，拒绝覆盖: ${manifestPath}`);
    if (readFileSync(manifestPath).equals(sample.manifestContent)) {
      reused.push(MANIFEST);
    } else {
      writeAtomic(manifestPath, sample.manifestContent);
      written.push(MANIFEST);
    }
  } else {
    writeAtomic(manifestPath, sample.manifestContent);
    written.push(MANIFEST);
  }
  return { written, reused };
}

function verifySample(root, sample) {
  const declared = [...sample.files, { path: MANIFEST, sha256: sha256(sample.manifestContent) }];
  const failed = declared.filter((file) => {
    const target = assertOwnedPath(root, file.path);
    const kind = pathKind(target);
    if (kind === "missing") refuse(EXIT_READBACK, `读回缺文件: ${file.path}`);
    if (kind !== "file") refuse(EXIT_READBACK, `读回目标不是普通文件: ${file.path}`);
    return sha256(readFileSync(target)) !== file.sha256;
  });
  if (failed.length) refuse(EXIT_READBACK, `读回校验失败: ${failed.map((file) => file.path).join(", ")}`);
  return declared.length;
}

function prepareSample(root) {
  sweepTemporaries(root);
  const existing = readExistingManifest(root);
  if (existing) {
    assertCurrentSample(existing);
  } else {
    const unowned = readdirSync(root).filter((name) => name !== LOCK).sort();
    if (unowned.length) {
      refuse(EXIT_CONFIG, `隔离根已有非本夹具对象（${unowned.join(", ")}）；换一个创建它的调用者拥有的空隔离根。`);
    }
  }
  const sample = buildSample();
  const { written, reused } = writeSample(root, sample);
  const verified = verifySample(root, sample);
  emit({
    action: "prepare",
    data_root: root,
    data_source: { kind: "synthetic-seed", seed: SEED, sample_version: REQUIRED_SAMPLE_VERSION },
    per_task_limit_basis: {
      records: RECORDS.length,
      files: sample.files.length + 1,
      bytes: sample.files.reduce((sum, file) => sum + file.bytes, 0) + sample.manifestContent.length,
      basis: "最小合成样本只覆盖读回所需的两条记录；上限依据是当前消费入口的实际输入量，不是固定配额。",
    },
    reproduce_command: `node tests/fixtures/execution-quality/${SCRIPT} --data-root <同一隔离根> --sample-version ${REQUIRED_SAMPLE_VERSION}`,
    version_check: { requested: REQUIRED_SAMPLE_VERSION, required: REQUIRED_SAMPLE_VERSION, status: "current" },
    cleanup: {
      owner: OWNER,
      command: `node tests/fixtures/execution-quality/${SCRIPT} --data-root <该隔离根> --clean`,
      completion_signal: "clean 回执 complete:true 且隔离根为空",
    },
    readback: { verified },
    written,
    reused,
  });
}

function recoverSample(root, reason) {
  const entries = readdirSync(root).filter((name) => name !== LOCK).sort();
  const unknownTopLevel = entries.filter((name) => name !== MANIFEST && name !== RECORDS_DIR);
  if (unknownTopLevel.length) {
    refuse(EXIT_CONFIG, `恢复清理拒绝：隔离根含未知对象（${unknownTopLevel.join(", ")}）；先由负责人处理。`);
  }
  const recordsDirectory = join(root, RECORDS_DIR);
  const recordsKind = pathKind(recordsDirectory);
  if (recordsKind !== "missing") {
    if (recordsKind !== "directory") {
      refuse(EXIT_CONFIG, "恢复清理拒绝：records 不是普通目录。");
    }
    const unknownRecords = readdirSync(recordsDirectory).filter((name) => !OWNED_FILES.has(`${RECORDS_DIR}/${name}`));
    if (unknownRecords.length) refuse(EXIT_CONFIG, `恢复清理拒绝：records 含未知对象（${unknownRecords.join(", ")}）；先由负责人处理。`);
  }
  const removed = [];
  for (const relativePath of OWNED_FILES) {
    const target = assertOwnedPath(root, relativePath);
    const kind = pathKind(target);
    if (kind === "missing") continue;
    if (kind !== "file") refuse(EXIT_CONFIG, `恢复清理拒绝：${relativePath} 不是普通文件。`);
    rmSync(target, { force: true });
    removed.push(relativePath);
  }
  if (pathKind(recordsDirectory) === "directory" && readdirSync(recordsDirectory).length === 0) {
    rmdirSync(recordsDirectory);
  }
  const residual = readdirSync(root).filter((name) => name !== LOCK).sort();
  emit({ action: "clean", data_root: root, owner: OWNER, recovered: true, recovered_reason: reason, removed, residual, complete: residual.length === 0 });
  if (residual.length) refuse(EXIT_READBACK, `恢复清理未完成，隔离根仍有非本夹具对象: ${residual.join(", ")}`);
}

function cleanSample(root, options) {
  // 先按自有前缀回收崩溃残留（临时文件与接管 claim），避免它们把清理/恢复路径卡死。
  sweepTemporaries(root);
  const manifestPath = join(root, MANIFEST);
  if (pathKind(manifestPath) === "missing") {
    const residual = readdirSync(root).filter((name) => name !== LOCK).sort();
    if (!residual.length) {
      emit({ action: "clean", data_root: root, owner: OWNER, removed: [], missing: [], modified: [], residual, already_clean: true, complete: true });
      return;
    }
    if (!options.discardInvalidManifest) {
      refuse(EXIT_CONFIG, `缺少 ${MANIFEST} 且隔离根非空（${residual.join(", ")}）；没有清单说不清归属，拒绝删除。若确认只有本夹具对象，用 --clean --discard-invalid-manifest 恢复。`);
    }
    recoverSample(root, "missing_manifest");
    return;
  }
  let manifest;
  try {
    manifest = readExistingManifest(root);
  } catch (error) {
    if (error instanceof InvalidManifest) {
      if (!options.discardInvalidManifest) throw error;
      recoverSample(root, "invalid_manifest");
      return;
    }
    throw error;
  }
  if (options.discardInvalidManifest) refuse(EXIT_CONFIG, "现有清单有效，用 --clean 即可；--discard-invalid-manifest 只用于损坏清单。");
  if (options.sampleVersion && options.sampleVersion !== manifest.sample_version) {
    refuse(EXIT_VERSION, `请求版本 ${options.sampleVersion} 与现有样本版本 ${manifest.sample_version} 不一致；清理前版本须一致。`);
  }
  const removed = [];
  const missing = [];
  const modified = [];
  for (const file of manifest.files) {
    const owned = assertOwnedPath(root, file.path);
    const kind = pathKind(owned);
    if (kind === "missing") {
      missing.push(file.path);
      continue;
    }
    if (kind !== "file") refuse(EXIT_CONFIG, `清单路径不是普通文件，拒绝删除: ${file.path}`);
    if (sha256(readFileSync(owned)) !== file.sha256) modified.push(file.path);
    // 删前按当前字节再核一次路径，符号链接或根外解析在此刻仍被拒绝。
    rmSync(assertOwnedPath(root, file.path), { force: true });
    removed.push(file.path);
  }
  if (pathKind(manifestPath) !== "file") refuse(EXIT_CONFIG, `清单不是普通文件，拒绝删除: ${MANIFEST}`);
  rmSync(manifestPath, { force: true });
  const recordsDirectory = join(root, RECORDS_DIR);
  if (pathKind(recordsDirectory) === "directory" && readdirSync(recordsDirectory).length === 0) {
    rmdirSync(recordsDirectory);
  }
  const residual = readdirSync(root).filter((name) => name !== LOCK).sort();
  const complete = pathKind(manifestPath) === "missing" && residual.length === 0;
  emit({ action: "clean", data_root: root, owner: OWNER, removed, missing, modified, residual, already_clean: false, complete });
  if (!complete) refuse(EXIT_READBACK, `清理未完成，隔离根仍有非本夹具对象: ${residual.join(", ")}`);
}

let lockPath = null;

try {
  const options = parseArguments(process.argv.slice(2));
  const root = checkedDataRoot(options.dataRoot);
  if (options.clean) {
    lockPath = acquireLock(root);
    cleanSample(root, options);
  } else {
    checkedVersion(options.sampleVersion);
    lockPath = acquireLock(root);
    prepareSample(root);
  }
} catch (error) {
  if (error instanceof Refusal) {
    process.stderr.write(`${SCRIPT}: ${error.message}\n${USAGE}\n`);
    process.exitCode = error.exitCode;
  } else {
    process.stderr.write(`${SCRIPT}: 夹具执行失败（${error?.code ?? "UNKNOWN"}）：${error?.message ?? String(error)}\n${USAGE}\n`);
    process.exitCode = EXIT_READBACK;
  }
} finally {
  if (lockPath) releaseLock(lockPath);
}
