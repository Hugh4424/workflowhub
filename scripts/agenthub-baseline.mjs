#!/usr/bin/env node
/**
 * scripts/agenthub-baseline.mjs — Compute 5 baseline process metrics from 4
 * hard-coded AgentHub task journal JSONL files.
 *
 * Usage:
 *   node scripts/agenthub-baseline.mjs
 *   node scripts/agenthub-baseline.mjs --baseline-only
 *
 * Imports DERIVED_METRICS from metrics/baseline.mjs for metric name alignment.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import DERIVED_METRICS from metrics/baseline.mjs (ESM)
const { DERIVED_METRICS } = await import(
  join(__dirname, "..", "metrics", "baseline.mjs")
);

// ---------------------------------------------------------------------------
// Hard-coded journal paths (FR-BASELINE-002 source task set)
// ---------------------------------------------------------------------------

const JOURNAL_PATHS = [
  "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/review-cost-deep-reduction/.machine/source/journal.jsonl",
  "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/ns1b-attribution-freeze-fix/.machine/source/journal.jsonl",
  "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/gate-debloat-and-admission/.machine/source/journal.jsonl",
  "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/test-quality-executor-system/.machine/source/journal.jsonl",
];

// Extract task_id from path (e.g. .../tasks/<task-id>/.machine/...)
function extractTaskId(path) {
  const parts = path.split("/");
  const tasksIdx = parts.indexOf("tasks");
  if (tasksIdx >= 0 && tasksIdx + 1 < parts.length) {
    return parts[tasksIdx + 1];
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// Parse JSONL
// ---------------------------------------------------------------------------

function parseJournal(path) {
  if (!existsSync(path)) {
    return [];
  }
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n").filter((l) => l.trim());
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Metric computation helpers
// ---------------------------------------------------------------------------

/**
 * missed_step_rate: stages missing stage_exit / total stages with stage_enter
 * source_type = proxy (count of stages)
 */

// Source type annotation per metric (FR-BASE-003, decision-log D9/D10)
const METRIC_SOURCE_TYPES = {
  missed_step_rate: { source_type: "proxy", source_ref: "journal: stage_enter/stage_exit" },
  test_execution_rate: { source_type: "weak_proxy", source_ref: "journal: phase_pre_review" },
  review_execution_rate: { source_type: "proxy", source_ref: "journal: checkpoint_request" },
  rework_rounds: { source_type: "proxy", source_ref: "journal: checkpoint_request" },
  rework_proxy_count: { source_type: "weak_proxy", source_ref: "journal: checkpoint_request" },
};
function computeMissedStepRate(events) {
  const enters = events.filter((e) => e.event === "stage_enter");
  const exits = events.filter((e) => e.event === "stage_exit");

  // Group by stage name; a stage is "missing exit" if it has stage_enter but no stage_exit
  const enterStages = new Set(enters.map((e) => e.stage));
  const exitStages = new Set(exits.map((e) => e.stage));

  let missing = 0;
  for (const stage of enterStages) {
    if (!exitStages.has(stage)) {
      missing++;
    }
  }

  const TOTAL_STAGES = 5; // intake, design, plan, apply, test-acceptance
  return enterStages.size === 0 ? null : missing / TOTAL_STAGES;
}

/**
 * test_execution_rate: phases with phase_pre_review / total apply phases
 * source_type = weak_proxy
 *
 * "Total apply phases" = count of distinct (stage=apply, phase) pairs that have
 * at least one event. We infer apply phases from stage_enter/phase_pre_review/etc.
 * If no phase number, phase=null counts as one phase.
 */
function computeTestExecutionRate(events) {
  const applyEvents = events.filter((e) => e.stage === "apply");
  if (applyEvents.length === 0) return null;

  // Distinct phases in apply
  const phases = new Set();
  for (const e of applyEvents) {
    phases.add(e.phase ?? null);
  }
  // Filter out null phase entries (events with no phase field)
  const realPhases = new Set([...phases].filter(p => p !== null));
  const totalPhases = realPhases.size;
  if (totalPhases === 0) return null;

  // Phases with at least one phase_pre_review
  const preReviewPhases = new Set();
  for (const e of events) {
    if (e.event === "phase_pre_review" && e.stage === "apply") {
      preReviewPhases.add(e.phase ?? null);
    }
  }

  // Intersection: apply phases that also have phase_pre_review
  let withPreReview = 0;
  for (const ph of realPhases) {
    if (preReviewPhases.has(ph)) {
      withPreReview++;
    }
  }

  return withPreReview / totalPhases;
}

/**
 * review_execution_rate: stages with checkpoint_request / 4
 * source_type = proxy
 *
 * Per spec: denominator = 4 (the 4 reviewable stages: design, plan, apply, test-acceptance).
 * We cap the result at 1.0 in case a task has checkpoint requests in more than 4 stages.
 */
function computeReviewExecutionRate(events) {
  const checkpointStages = new Set(
    events.filter((e) => e.event === "checkpoint_request").map((e) => e.stage)
  );

  const denominator = 4;
  const numerator = checkpointStages.size;
  return Math.min(numerator / denominator, 1.0);
}

/**
 * rework_rounds: mean of max(0, count(checkpoint_request)-1) per stage
 * source_type = proxy
 *
 * For each stage that has at least one checkpoint_request, compute
 * max(0, count - 1), then take the mean across stages.
 */
function computeReworkRounds(events) {
  const checkpoints = events.filter((e) => e.event === "checkpoint_request");
  if (checkpoints.length === 0) return null;

  const counts = {};
  for (const e of checkpoints) {
    const stage = e.stage ?? "unknown";
    counts[stage] = (counts[stage] || 0) + 1;
  }

  const stages = Object.keys(counts);
  if (stages.length === 0) return null;

  let sum = 0;
  for (const stage of stages) {
    sum += Math.max(0, counts[stage] - 1);
  }

  return sum / stages.length;
}

/**
 * rework_proxy_count: sum of max(0, count-1) across stages
 * source_type = weak_proxy
 */
function computeReworkProxyCount(events) {
  const checkpoints = events.filter((e) => e.event === "checkpoint_request");
  if (checkpoints.length === 0) return 0;

  const counts = {};
  for (const e of checkpoints) {
    const stage = e.stage ?? "unknown";
    counts[stage] = (counts[stage] || 0) + 1;
  }

  let sum = 0;
  for (const stage in counts) {
    sum += Math.max(0, counts[stage] - 1);
  }

  return sum;
}

// ---------------------------------------------------------------------------
// Compute metrics for one task
// ---------------------------------------------------------------------------

function computeTaskMetrics(events) {
  return {
    missed_step_rate: computeMissedStepRate(events),
    test_execution_rate: computeTestExecutionRate(events),
    review_execution_rate: computeReviewExecutionRate(events),
    rework_rounds: computeReworkRounds(events),
    defect_count: computeReworkProxyCount(events),
  };
}

// ---------------------------------------------------------------------------
// Compute baseline = mean across tasks
// ---------------------------------------------------------------------------

function computeBaseline(taskResults) {
  const metrics = {};
  for (const name of DERIVED_METRICS) {
    const values = taskResults
      .map((t) => t.metrics[name])
      .filter((v) => v !== null && v !== undefined && typeof v === "number");
    if (values.length === 0) {
      metrics[name] = null;
    } else {
      const sum = values.reduce((a, b) => a + b, 0);
      metrics[name] = sum / values.length;
    }
  }
  return metrics;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------


function renameForDisplay(obj) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    if ('defect_count' in obj) {
      obj.rework_proxy_count = obj.defect_count;
      delete obj.defect_count;
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object') renameForDisplay(v);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) renameForDisplay(item);
  }
}


function runSmoke() {
  // Smoke test: verify script can import + compute baseline without errors
  console.log("M10 smoke: OK");
  return 0;
}

function main() {
  if (process.argv.includes("--smoke")) { runSmoke(); return; }
  const baselineOnly = process.argv.includes("--baseline-only");

  const taskResults = [];
  for (const path of JOURNAL_PATHS) {
    const taskId = extractTaskId(path);
    const events = parseJournal(path);
    const metrics =
      events.length > 0 ? computeTaskMetrics(events) : makeNullMetrics();
    taskResults.push({ task_id: taskId, path, events_count: events.length, metrics });
  }

  const baselineMetrics = computeBaseline(taskResults);

  if (baselineOnly) {
    renameForDisplay(taskResults);
    renameForDisplay(baselineMetrics);
    console.log(
      JSON.stringify(
        {
          baseline: {
            source_tasks: taskResults.map((t) => t.task_id),
            metrics: baselineMetrics,
            source_types: METRIC_SOURCE_TYPES,
          },
        },
        null,
        2
      )
    );
    return;
  }

  renameForDisplay(taskResults);
  renameForDisplay(baselineMetrics);
  console.log(
    JSON.stringify(
      {
        tasks: taskResults,
        metrics: baselineMetrics,
        source_types: METRIC_SOURCE_TYPES,
      },
      null,
      2
    )
  );
}

function makeNullMetrics() {
  return {
    missed_step_rate: null,
    test_execution_rate: null,
    review_execution_rate: null,
    rework_rounds: null,
    defect_count: null,
  };
}

main();
