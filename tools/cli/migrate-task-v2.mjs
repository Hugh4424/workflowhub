#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, readdirSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { resolveStorageRoot } from "../../runtime/evidence/storage-root.mjs";
import { deriveTaskPath } from "../../runtime/task/task-identity.mjs";
import { openTask } from "../../core/task-handle.mjs";
import { MigrationArtifactInspector } from "../../core/artifact-dir.mjs";
import { assertMigrationAuthority, readRuntimeMode } from "../../core/runtime-mode.mjs";

const DESIGN_FILES = ["spec.md", "plan.md", "tasks.md"];
const LEGACY_RECORD = /^(?:stage-result(?:-[A-Za-z0-9._-]+)?\.json|task\.json|worktree\.json|decision-log\.md|journal\.jsonl)$/;

function args(argv) {
  const values = { apply: false };
  for (const item of argv) {
    if (item === "--apply") { values.apply = true; continue; }
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  return values;
}
function required(value, label) { if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} is required`); return value; }
function absolute(value, label) { required(value, label); if (!isAbsolute(value)) throw new TypeError(`${label} must be absolute`); return resolve(value); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function realDirectory(path, label) { const stat = lstatSync(path); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a real directory: ${path}`); return realpathSync(path); }
function git(cwd, command) { try { return String(execFileSync("git", command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); } catch (error) { throw new Error(`Git validation failed at ${cwd}: ${error.stderr?.toString().trim() || error.message}`); } }
function commonDir(root) { const value = git(root, ["rev-parse", "--git-common-dir"]); return realpathSync(isAbsolute(value) ? value : resolve(root, value)); }
function regularBytes(path, label) { const stat = lstatSync(path); if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file: ${path}`); return readFileSync(path); }

function inspect(options) {
  const legacy = realDirectory(absolute(options["legacy-task-path"], "legacy-task-path"), "legacy task path");
  const targetRepo = realDirectory(absolute(options["target-repo-root"], "target-repo-root"), "target repository");
  const worktree = realDirectory(absolute(options["worktree-root"], "worktree-root"), "worktree");
  if (realpathSync(git(targetRepo, ["rev-parse", "--show-toplevel"])) !== targetRepo) throw new Error("target-repo-root must be a Git toplevel");
  if (realpathSync(git(worktree, ["rev-parse", "--show-toplevel"])) !== worktree) throw new Error("worktree-root must be a Git toplevel");
  if (commonDir(targetRepo) !== commonDir(worktree)) throw new Error("target repository and worktree must share Git common directory");
  const storageRoot = resolveStorageRoot();
  const authorityHome = options["authority-home"];
  const authority = readRuntimeMode(authorityHome ? { home: authorityHome } : {});
  if (authority.storage_root !== storageRoot || !["active", "quiescing"].includes(authority.mode)) throw new Error("migration dry-run authority root/mode mismatch");
  const project = required(options.project, "project"), taskId = required(options.task, "task");
  const taskPath = deriveTaskPath(storageRoot, project, taskId);
  const archivedRoot = join(legacy, "legacy", "archive");
  const names = new Set(readdirSync(legacy).filter((name) => LEGACY_RECORD.test(name)));
  if (existsSync(archivedRoot)) for (const name of readdirSync(archivedRoot).filter((item) => LEGACY_RECORD.test(item))) names.add(name);
  const archive = [...names].sort().map((name) => {
    const source = existsSync(join(legacy, name)) ? join(legacy, name) : join(archivedRoot, name);
    const bytes = regularBytes(source, `legacy record ${name}`);
    return { name, bytes, size: bytes.length, sha256: sha256(bytes) };
  });
  const inspector = MigrationArtifactInspector.open(worktree, taskId);
  const design = DESIGN_FILES.map((name) => {
    const path = inspector.path(name);
    try { const bytes = inspector.read(name); return { name, path, present: true, size: bytes.length, sha256: sha256(bytes) }; }
    catch (error) { if (error?.code === "ENOENT") return { name, path, present: false }; throw error; }
  });
  return { legacy, targetRepo, worktree, storageRoot, authorityHome, authority, project, taskId, taskPath, archive, design };
}

function publicReport(state, mode) {
  return {
    schema_version: "task-migration-report.v1",
    mode,
    source_legacy_task_path: state.legacy,
    target_task_path: state.taskPath,
    project_name: state.project,
    task_id: state.taskId,
    target_repo_root: state.targetRepo,
    worktree_root: state.worktree,
    cutover_epoch: state.authority.cutover_epoch,
    legacy_archive: state.archive.map(({ name, size, sha256: hash }) => ({ ref: `legacy/archive/${name}`, size, sha256: hash })),
    design_artifacts: state.design.map(({ name, path, present, size, sha256: hash }) => ({ name, path, present, ...(present ? { size, sha256: hash } : {}) })),
    legacy_stage_results_accepted: false,
    needs_replay: state.archive.some((item) => item.name.startsWith("stage-result")) || state.design.some((item) => !item.present),
  };
}

function existingResult(state) {
  if (!existsSync(state.taskPath)) return null;
  let task;
  try { task = openTask(state.taskPath, { projectName: state.project, taskId: state.taskId }); }
  catch (error) {
    if (state.legacy === state.taskPath) return null;
    throw new Error(`target exists but is not a complete matching task: ${state.taskPath}: ${error.message}`);
  }
  let report;
  try { report = JSON.parse(task.readRecord("migration-report.json")); }
  catch (error) { throw new Error(`partial or conflicting migration target lacks a valid migration-report.json: ${state.taskPath}`); }
  if (report.source_legacy_task_path !== state.legacy || report.target_repo_root !== state.targetRepo || report.worktree_root !== state.worktree) throw new Error(`migration target conflicts with requested source or repository: ${state.taskPath}`);
  for (const item of state.archive) {
    const archived = task.readRecord(`legacy/archive/${item.name}`, null);
    const bytes = Buffer.isBuffer(archived) ? archived : Buffer.from(archived);
    if (sha256(bytes) !== item.sha256) throw new Error(`archived legacy record changed: ${item.name}`);
  }
  if (state.legacy !== state.taskPath) for (const item of state.archive) {
    const source = join(state.legacy, item.name);
    if (existsSync(source)) unlinkSync(source);
  }
  return { ...report, mode: "apply", idempotent_replay: true };
}

function fsyncDirectory(path) { const fd = openSync(path, constants.O_RDONLY); try { fsyncSync(fd); } finally { closeSync(fd); } }
function atomicCreate(path, bytes) {
  const temporary = `${path}.migration-tmp`;
  const fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, path); fsyncDirectory(dirname(path));
}
function processAlive(pid) { try { process.kill(pid, 0); return true; } catch (error) { return error?.code === "EPERM"; } }
function acquireClaim(path) {
  try { return openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    let owner;
    try { owner = JSON.parse(readFileSync(path, "utf8")); } catch { throw new Error(`migration claim is unreadable: ${path}`); }
    if (owner.host !== hostname() || processAlive(owner.pid)) throw new Error(`migration already active: ${path}`);
    if (typeof owner.temporary === "string" && dirname(owner.temporary) === dirname(path) && /^\.[A-Za-z0-9._-]+\.migration-[A-Za-z0-9-]+\.tmp$/.test(owner.temporary.slice(dirname(path).length + 1)) && existsSync(owner.temporary)) {
      const stat = lstatSync(owner.temporary);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`stale migration temporary is unsafe: ${owner.temporary}`);
      rmSync(owner.temporary, { recursive: true, force: true });
    }
    unlinkSync(path);
    return openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  }
}
function applyInPlace(state, report, hooks = {}) {
  const claim = `${state.taskPath}.migration-v2.claim`;
  const claimFd = acquireClaim(claim);
  try {
    writeFileSync(claimFd, `${JSON.stringify({ pid: process.pid, host: hostname() })}\n`); fsyncSync(claimFd); closeSync(claimFd);
    const archiveRoot = join(state.taskPath, "legacy", "archive");
    mkdirSync(archiveRoot, { recursive: true });
    for (const item of state.archive) {
      const source = join(state.taskPath, item.name), destination = join(archiveRoot, item.name);
      if (existsSync(source)) {
        if (existsSync(destination)) {
          if (sha256(regularBytes(destination, `archived ${item.name}`)) !== item.sha256) throw new Error(`archive conflict: ${item.name}`);
          unlinkSync(source);
        } else renameSync(source, destination);
        fsyncDirectory(state.taskPath); fsyncDirectory(archiveRoot);
      } else if (!existsSync(destination) || sha256(regularBytes(destination, `archived ${item.name}`)) !== item.sha256) {
        throw new Error(`in-place migration lost legacy record: ${item.name}`);
      }
      hooks.afterArchiveRecord?.(item.name);
    }
    const reportPath = join(state.taskPath, "migration-report.json");
    for (const path of [`${reportPath}.migration-tmp`, `${join(state.taskPath, "task.json")}.migration-tmp`]) if (existsSync(path)) unlinkSync(path);
    if (!existsSync(reportPath)) atomicCreate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    hooks.beforeManifestCommit?.();
    const manifest = { schema_version: "1.0.0", project_name: state.project, task_id: state.taskId,
      created_at: new Date().toISOString(), target_repo_root: state.targetRepo, issue_ids: [], inputs: {} };
    atomicCreate(join(state.taskPath, "task.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    return report;
  } finally {
    try { closeSync(claimFd); } catch {}
    if (existsSync(claim)) unlinkSync(claim);
  }
}

function applyCrossDirectory(state, report, hooks = {}) {
  const parent = dirname(state.taskPath), claim = `${state.taskPath}.migration-v2.claim`;
  mkdirSync(parent, { recursive: true });
  const claimFd = acquireClaim(claim);
  const temporary = join(parent, `.${state.taskId}.migration-${randomUUID()}.tmp`);
  try {
    writeFileSync(claimFd, `${JSON.stringify({ pid: process.pid, host: hostname(), temporary })}\n`); fsyncSync(claimFd); closeSync(claimFd);
    if (existsSync(state.taskPath)) throw new Error(`migration target appeared while claimed: ${state.taskPath}`);
    mkdirSync(join(temporary, "legacy", "archive"), { recursive: true });
    hooks.afterTargetCreate?.();
    for (const item of state.archive) {
      atomicCreate(join(temporary, "legacy", "archive", item.name), item.bytes);
      hooks.afterArchiveRecord?.(item.name);
    }
    hooks.beforeReportCommit?.();
    atomicCreate(join(temporary, "migration-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    hooks.afterReport?.();
    const manifest = { schema_version: "1.0.0", project_name: state.project, task_id: state.taskId,
      created_at: new Date().toISOString(), target_repo_root: state.targetRepo, issue_ids: [], inputs: {} };
    hooks.beforeManifestCommit?.();
    atomicCreate(join(temporary, "task.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    hooks.afterManifestCommit?.();
    fsyncDirectory(temporary); hooks.beforePublish?.();
    renameSync(temporary, state.taskPath); fsyncDirectory(parent);
    for (const item of state.archive) { const source = join(state.legacy, item.name); if (existsSync(source)) unlinkSync(source); }
    fsyncDirectory(state.legacy);
    return report;
  } finally {
    try { closeSync(claimFd); } catch {}
    if (existsSync(temporary)) rmSync(temporary, { recursive: true, force: true });
    if (existsSync(claim)) unlinkSync(claim);
  }
}

export function migrateTask(argv = process.argv.slice(2), hooks = {}) {
  const options = args(argv), state = inspect(options);
  if (options.apply) assertMigrationAuthority(state.storageRoot, { ...(state.authorityHome ? { home: state.authorityHome } : {}), expectedEpoch: options.epoch });
  const existing = existingResult(state);
  if (existing) return options.apply ? existing : { ...existing, mode: "dry-run" };
  if (!options.apply) return publicReport(state, "dry-run");
  const report = publicReport(state, "apply");
  if (state.legacy === state.taskPath) return applyInPlace(state, report, hooks);
  return applyCrossDirectory(state, report, hooks);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(migrateTask(), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}
