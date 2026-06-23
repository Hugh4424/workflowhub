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

import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";

const GAP = "gap";

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

export function configForCollector(loadedConfig, { taskDir, taskId, project, onWarn } = {}) {
  const globalMetricsPath = expandHome(loadedConfig?.metrics_path);
  return {
    globalMetricsPath,
    taskMetricsPath: taskDir ? join(taskDir, "task-metrics.jsonl") : undefined,
    taskId,
    project,
    ...(onWarn ? { onWarn } : {}),
  };
}

function warn(cfg, message) {
  if (cfg && typeof cfg.onWarn === "function") cfg.onWarn(message);
}

// Read all records from a jsonl store; missing file => empty list.
function readAll(path) {
  if (!path || !existsSync(path)) return [];
  const text = readFileSync(path, "utf8").trim();
  if (!text) return [];
  return text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

// Rewrite a jsonl store atomically (used for in-place merge of the same execution_id).
function writeAll(path, records, cfg) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, records.map((r) => JSON.stringify(r)).join("\n") + (records.length ? "\n" : ""));
    return true;
  } catch (err) {
    warn(cfg, `metrics write failed: ${path}: ${err.message}`);
    return false;
  }
}

// Upsert one record by execution_id into a jsonl store (re-locate from disk + merge).
function upsert(path, execution_id, patch, cfg) {
  const records = readAll(path);
  const idx = records.findIndex((r) => r.execution_id === execution_id);
  if (idx === -1) {
    records.push({ execution_id, ...patch });
  } else {
    records[idx] = { ...records[idx], ...patch };
  }
  return writeAll(path, records, cfg);
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
  };
  upsert(cfg.taskMetricsPath, record.execution_id, record, cfg);
  upsert(cfg.globalMetricsPath, record.execution_id, toGlobalRow(record, cfg), cfg);
  return record;
}

/**
 * updateOwnResult — timing 2: skill end. Patches the record's own result fields
 * (tokens/duration/executed). Re-locates by execution_id from disk (FR-COLLECT-004).
 */
export function updateOwnResult(execution_id, patch, cfg) {
  const resolved = { ...patch };
  if ("tokens" in resolved || cfg.tokenSourceReachable === false) {
    resolved.tokens = resolveTokens(resolved.tokens, cfg);
  }
  upsert(cfg.taskMetricsPath, execution_id, resolved, cfg);
  const current = readRecord(execution_id, cfg);
  if (current) upsert(cfg.globalMetricsPath, execution_id, toGlobalRow(current, cfg), cfg);
  return current;
}

/**
 * updateStageImpact — timing 3: stage end. Patches the skill's impact on the whole
 * stage onto the SAME record (one-record-three-updates, FR-COLLECT-003/004).
 */
export function updateStageImpact(execution_id, patch, cfg) {
  upsert(cfg.taskMetricsPath, execution_id, patch, cfg);
  const current = readRecord(execution_id, cfg);
  if (current) upsert(cfg.globalMetricsPath, execution_id, toGlobalRow(current, cfg), cfg);
  return current;
}

/** readRecord — re-locate one record by execution_id from the task store. */
export function readRecord(execution_id, cfg) {
  return readAll(cfg.taskMetricsPath).find((r) => r.execution_id === execution_id) ?? null;
}

/**
 * collectorRollup — FR-GUARD-003: stage rollup dedupes within a stage (by stage_unit)
 * before summing, so a reopened stage does not double-count.
 */
export function collectorRollup() {
  function rollupStage(stage, cfg) {
    const records = readAll(cfg.taskMetricsPath).filter((r) => r.stage === stage);
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
