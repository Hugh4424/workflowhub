/**
 * collector.mjs — M4 metrics collection core (host-decoupled).
 *
 * FR-COLLECT-001: per-skill/stage granularity (one record per execution).
 * FR-COLLECT-003/004: three-timing one-record-three-updates; updates re-locate the
 *   target record from disk by execution_id (never relies on in-memory references),
 *   so session compaction cannot lose an update.
 * FR-COLLECT-006/007: dual-write task-level + global; global rows carry four identifiers.
 * FR-GUARD-001: only-record-never-block — write failure emits an observable warning
 *   via cfg.onWarn but never throws.
 * FR-GUARD-002: action counts dedupe by action_id, never by message_id.
 * FR-GUARD-003: stage rollup dedupes within stage before summing across stages.
 * FR-GUARD-004: an unreachable session source marks the field "gap", never zero-fills.
 *
 * Storage is JSON Lines via fs.appendFileSync (O_APPEND atomic). No third-party deps.
 */

import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync, openSync, closeSync, fsyncSync, renameSync, rmSync, constants } from "fs";
import { dirname, isAbsolute, join, resolve } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import { spawnSync } from "child_process";
import { assertTaskHandle } from "../core/task-handle.mjs";
import { assertWorkspace } from "../core/stage-context.mjs";

const GAP = "gap";
const OWN_RESULTS = new Set([
  "entry",
  "success",
  "structural-fail",
  "serious-pause",
  "risk-override",
  "omission-accept",
]);
const METRICS_LAUNCHER_CONFIGS = new WeakSet();
const COLLECTOR_CONFIGS = new WeakSet();

export function assertCollectorConfig(value) {
  if (!value || typeof value !== "object" || !COLLECTOR_CONFIGS.has(value)) {
    throw new TypeError("authentic MetricsCollector capability required");
  }
  assertTaskHandle(value.taskHandle);
  return value;
}

/**
 * configForCollector — FR-COLLECT-006/007: bridge a loaded workflowhub config (which
 * carries the configurable `metrics_path` for the global flat store, default user-level
 * dir, see config/workflowhub.yaml) into the cfg shape the collector consumes.
 *   - global store path comes from config.metrics_path (configurable, not in VCS)
 *   - task-level store is derived under the per-task directory
 *   - task_id/project default from the task identity (FR-COLLECT-007)
 * Pure mapping; no I/O. Does not modify the frozen core/load-config.mjs.
 */
// Expand a leading "~/" (or bare "~") to the user home dir. Node fs/path APIs do NOT
// expand "~", so a configured "~/.workflowhub/..." would otherwise resolve relative to
// cwd and land inside the repo — violating FR-COLLECT-007 (global store must be a
// user-level path outside VCS). Only a LEADING ~ is expanded; embedded ~ is left intact.
function expandHome(p) {
  if (typeof p !== "string" || p.length === 0) return p;
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

export function createMetricsLauncherConfig(loadedConfig) {
  const globalMetricsPath = expandHome(loadedConfig?.metrics_path);
  if (typeof globalMetricsPath !== "string" || !isAbsolute(globalMetricsPath)) {
    throw new TypeError("trusted launcher metrics_path must resolve to an absolute path");
  }
  const capability = Object.freeze({ globalMetricsPath: resolve(globalMetricsPath) });
  METRICS_LAUNCHER_CONFIGS.add(capability);
  return capability;
}

export function configForCollector(launcherConfig, { task, workspace, onWarn } = {}) {
  if (!launcherConfig || !METRICS_LAUNCHER_CONFIGS.has(launcherConfig)) {
    throw new TypeError("trusted metrics launcher config capability required");
  }
  const taskHandle = assertTaskHandle(task);
  const authenticWorkspace = workspace === undefined ? undefined : assertWorkspace(workspace);
  const capability = {
    globalMetricsPath: launcherConfig.globalMetricsPath,
    taskHandle,
    taskId: taskHandle.identity.taskId,
    project: taskHandle.identity.projectName,
    repoRoot: authenticWorkspace?.worktreeRoot,
    ...(onWarn ? { onWarn } : {}),
  };
  COLLECTOR_CONFIGS.add(capability);
  return Object.freeze(capability);
}

function readTaskAll(cfg) {
  try {
    const text = cfg.taskHandle.readRecord("task-metrics.jsonl").trim();
    if (!text) return [];
    return text.split("\n").filter(Boolean).flatMap((line) => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    warn(cfg, `metrics read failed: ${error.message}`);
    return [];
  }
}

function upsertTask(executionId, patch, cfg) {
  const records = readTaskAll(cfg);
  const index = records.findIndex((record) => record.execution_id === executionId);
  if (index < 0) records.push({ execution_id: executionId, ...patch });
  else records[index] = { ...records[index], ...patch };
  try {
    cfg.taskHandle.writeRecordAtomic("task-metrics.jsonl", records.map((record) => JSON.stringify(record)).join("\n") + "\n");
    return true;
  } catch (error) {
    warn(cfg, `metrics write failed: ${error.message}`);
    return false;
  }
}

function warn(cfg, message) {
  if (cfg && typeof cfg.onWarn === "function") cfg.onWarn(message);
}

function ownResult(value, cfg, fallback = null) {
  if (OWN_RESULTS.has(value)) return value;
  warn(cfg, `metrics own_result ignored: ${String(value)}`);
  return fallback;
}

// Read all records from a jsonl store; missing file => empty list.
function readAll(path) {
  if (!path || !existsSync(path)) return [];
  const text = readFileSync(path, "utf8").trim();
  if (!text) return [];
  return text.split("\n").filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; }
    catch { return []; }
  });
}

// Rewrite a jsonl store atomically (used for in-place merge of the same execution_id).
function writeAll(path, records, cfg) {
  let temporary;
  try {
    mkdirSync(dirname(path), { recursive: true });
    temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
    const fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try {
      writeFileSync(fd, records.map((r) => JSON.stringify(r)).join("\n") + (records.length ? "\n" : ""));
      fsyncSync(fd);
    } finally { closeSync(fd); }
    renameSync(temporary, path);
    const directoryFd = openSync(dirname(path), constants.O_RDONLY);
    try { fsyncSync(directoryFd); } finally { closeSync(directoryFd); }
    return true;
  } catch (err) {
    if (temporary) rmSync(temporary, { force: true });
    warn(cfg, `metrics write failed: ${path}: ${err.message}`);
    return false;
  }
}

// Upsert one record by execution_id into a jsonl store (re-locate from disk + merge).
function upsertGlobal(execution_id, patch, cfg) {
  const path = cfg.globalMetricsPath;
  const records = readAll(path);
  const idx = records.findIndex((r) => r.execution_id === execution_id);
  if (idx === -1) {
    records.push({ execution_id, ...patch });
  } else {
    records[idx] = { ...records[idx], ...patch };
  }
  return writeAll(path, records, cfg);
}

export function updateTaskRecord(execution_id, patch, cfg) {
  return upsertTask(execution_id, patch, assertCollectorConfig(cfg));
}

// Count actions deduped by their own action_id (FR-GUARD-002), never by message_id.
function actionCount(actions) {
  if (!Array.isArray(actions)) return 0;
  const seen = new Set();
  for (const a of actions) {
    if (a && a.action_id) seen.add(a.action_id);
  }
  return seen.size;
}

// Resolve the tokens field honoring FR-GUARD-004 (gap when source unreachable).
function resolveTokens(value, cfg) {
  // FR-GUARD-004: "gap" sentinel ONLY when the token source is unreachable.
  if (cfg && cfg.tokenSourceReachable === false) return GAP;
  // tokens is a required core field — never leave it undefined (JSON.stringify would
  // drop the key, producing a persisted row that fails validateRecord). Absent-but-
  // reachable values become null (distinct from "gap").
  return value === undefined ? null : value;
}

// Build the global row from a task-level record + the four identifiers.
function toGlobalRow(record, cfg) {
  return {
    ...record,
    task_id: cfg.taskId,
    project: cfg.project,
    skill: record.skill_or_stage,
    version: record.skill_version,
  };
}

/**
 * recordSkeleton — timing 1: skill start. Lays down a minimal record (FR-COLLECT-003).
 * Dual-writes to task + global (FR-COLLECT-006). Never blocks (FR-GUARD-001).
 */
export function recordSkeleton(seed, cfg) {
  const record = {
    execution_id: seed.execution_id,
    skill_or_stage: seed.skill_or_stage ?? null,
    stage: seed.stage ?? null,
    skill_version: seed.skill_version ?? null,
    executed: seed.executed ?? false,
    tokens: resolveTokens(seed.tokens, cfg),
    duration_ms: seed.duration_ms ?? null,
    rework_rounds: seed.rework_rounds ?? null,
    human_intervention: seed.human_intervention ?? false,
    friction_ref: seed.friction_ref ?? null,
    action_count: actionCount(seed.actions),
    stage_unit: seed.stage_unit ?? null,
    own_result: ownResult(seed.own_result ?? "entry", cfg, "entry"),
  };
  upsertTask(record.execution_id, record, cfg);
  upsertGlobal(record.execution_id, toGlobalRow(record, cfg), cfg);
  return record;
}

/**
 * updateOwnResult — timing 2: skill end. Patches the record's own result fields
 * (tokens/duration/executed). Re-locates by execution_id from disk (FR-COLLECT-004).
 */
export function updateOwnResult(execution_id, patch, cfg) {
  const resolved = { ...patch };
  if ("own_result" in resolved) {
    const normalized = ownResult(resolved.own_result, cfg);
    if (normalized === null) delete resolved.own_result;
    else resolved.own_result = normalized;
  }
  if ("tokens" in resolved || cfg.tokenSourceReachable === false) {
    resolved.tokens = resolveTokens(resolved.tokens, cfg);
  }
  upsertTask(execution_id, resolved, cfg);
  const current = readRecord(execution_id, cfg);
  if (current) upsertGlobal(execution_id, toGlobalRow(current, cfg), cfg);
  collectFacts(execution_id, patch, cfg);
  return current;
}

/**
 * collectFacts — FR-FACT-001/002/003: write 4 physical facts into the task record.
 * Derives facts from real zero-cost sources (patch for exit_code, git for sha/files,
 * readRecord for review_invoked). Never throws (FR-GUARD-001). On any error emits stderr warn.
 * ponytail: review_invoked derived from execution-record fields; future journal integration
 * can add richer signals without changing the signature. Ceiling: integrate with journal
 * transcript when review-phase records become available.
 */
export function collectFacts(execution_id, factSeed, cfg) {
  try {
    const patch = factSeed ?? {};

    // exit_code: host supplies via patch (real value at skill end); anything non-numeric -> null.
    const exit_code = typeof patch.exit_code === "number" ? patch.exit_code : null;

    // git_sha: zero-cost read of HEAD commit sha.
    let git_sha = null;
    try {
      if (!cfg.repoRoot) throw new Error("Workspace required for Git facts");
      const cwd = cfg.repoRoot;
      const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" });
      if (r.status === 0 && r.stdout) git_sha = r.stdout.trim();
    } catch (_) { /* non-git env: leave null */ }

    // files_changed: zero-cost list of changed paths relative to HEAD.
    let files_changed = null;
    try {
      if (!cfg.repoRoot) throw new Error("Workspace required for Git facts");
      const cwd = cfg.repoRoot;
      const r = spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd, encoding: "utf8" });
      if (r.status === 0 && r.stdout != null) {
        files_changed = r.stdout.split("\n").filter(Boolean);
      }
    } catch (_) { /* non-git env: leave null */ }

    // review_invoked: read back current execution-record and derive from it.
    // If no reliable signal is present, emit a warn and write literal false (not null).
    let review_invoked = false;
    const record = readRecord(execution_id, cfg);
    if (record && typeof record.review_invoked === "boolean") {
      review_invoked = record.review_invoked;
    } else if (patch && typeof patch.review_invoked === "boolean") {
      // Fallback: patch carries it explicitly (e.g. from test or direct call).
      review_invoked = patch.review_invoked;
    } else {
      process.stderr.write(
        `[collectFacts warn] review_invoked not derivable for ${execution_id}; defaulting to false.\n`
      );
      review_invoked = false;
    }

    const facts = { exit_code, git_sha, files_changed, review_invoked };
    const ok = upsertTask(execution_id, { facts }, cfg);
    if (ok === false) {
      process.stderr.write(
        `[collectFacts warn] fact write failed for ${execution_id}\n`
      );
    }
  } catch (err) {
    process.stderr.write(
      `[collectFacts warn] fact collection failed for ${execution_id}: ${err.message}\n`
    );
  }
}

/**
 * updateStageImpact — timing 3: stage end. Patches the skill's impact on the whole
 * stage onto the SAME record (one-record-three-updates, FR-COLLECT-003/004).
 */
export function updateStageImpact(execution_id, patch, cfg) {
  upsertTask(execution_id, patch, cfg);
  const current = readRecord(execution_id, cfg);
  if (current) upsertGlobal(execution_id, toGlobalRow(current, cfg), cfg);
  return current;
}

/** readRecord — re-locate one record by execution_id from the task store. */
export function readRecord(execution_id, cfg) {
  return readTaskAll(cfg).find((r) => r.execution_id === execution_id) ?? null;
}

/**
 * collectorRollup — FR-GUARD-003: stage rollup dedupes within a stage (by stage_unit)
 * before summing, so a reopened stage does not double-count.
 */
export function collectorRollup() {
  function rollupStage(stage, cfg) {
    const records = readTaskAll(cfg).filter((r) => r.stage === stage);
    const units = new Set();
    for (const r of records) {
      if (r.stage_unit) units.add(r.stage_unit);
    }
    return { distinct_units: units.size };
  }
  return { rollupStage };
}

// Named export so the test can also import rollupStage indirectly if needed.
export const { rollupStage } = collectorRollup();
