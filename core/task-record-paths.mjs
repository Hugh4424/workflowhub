#!/usr/bin/env node
/**
 * Resolve task execution-record paths through the canonical task_dir parser.
 *
 * This is the single consumable entry point for stage agents and scripts that
 * need task-local records such as worktree.json, stage-result-*.json, evidence,
 * reviews, journal, decision-log, or final test reports.
 */

import { existsSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTaskDir } from "./task-dir-parser.mjs";

const SAFE_TASK_ID = /^[A-Za-z0-9._-]+$/;

function fail(message) {
  process.stderr.write(`[task-record-paths] FAIL: ${message}\n`);
  process.exit(1);
}

export function validateTaskId(taskId) {
  if (typeof taskId !== "string" || taskId.trim() === "") {
    throw new Error("task_id is required");
  }
  const normalized = taskId.trim();
  if (!SAFE_TASK_ID.test(normalized) || normalized === "." || normalized === "..") {
    throw new Error(`invalid task_id "${taskId}"`);
  }
  return normalized;
}

function assertInside(baseDir, candidate) {
  const rel = relative(baseDir, candidate);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return;
  throw new Error(`resolved path escapes task record root: ${candidate}`);
}

export function resolveTaskRecordPaths(taskId, options = {}) {
  const normalizedTaskId = validateTaskId(taskId);
  const taskTrackingRoot = options.taskTrackingRoot
    ? resolve(String(options.taskTrackingRoot))
    : parseTaskDir();
  const taskRoot = resolve(taskTrackingRoot, normalizedTaskId);
  assertInside(taskTrackingRoot, taskRoot);

  return {
    task_id: normalizedTaskId,
    task_tracking_root: taskTrackingRoot,
    task_root: taskRoot,
    worktree_json: join(taskRoot, "worktree.json"),
    decision_log: join(taskRoot, "decision-log.md"),
    journal: join(taskRoot, "journal.jsonl"),
    evidence_dir: join(taskRoot, "evidence"),
    reviews_dir: join(taskRoot, "reviews"),
    test_dir: join(taskRoot, "test"),
    stage_result: {
      make_decision: join(taskRoot, "stage-result-make-decision.json"),
      build_spec: join(taskRoot, "stage-result-build-spec.json"),
      build_plan: join(taskRoot, "stage-result-build-plan.json"),
      build_code: join(taskRoot, "stage-result-build-code.json"),
      verify_code: join(taskRoot, "stage-result-verify-code.json"),
    },
  };
}

export function taskRecordPath(taskId, ...segments) {
  const paths = resolveTaskRecordPaths(taskId);
  const candidate = resolve(paths.task_root, ...segments);
  assertInside(paths.task_root, candidate);
  return candidate;
}

export function requireTaskRecordPath(taskId, ...segments) {
  const candidate = taskRecordPath(taskId, ...segments);
  if (!existsSync(candidate)) {
    throw new Error(`task record not found: ${candidate}`);
  }
  return candidate;
}

function parseCliArgs(argv) {
  const args = [...argv];
  const mustExistIndex = args.indexOf("--must-exist");
  const mustExist = mustExistIndex !== -1;
  if (mustExist) args.splice(mustExistIndex, 1);
  return { taskId: args[0], relPath: args[1], mustExist };
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const { taskId, relPath, mustExist } = parseCliArgs(process.argv.slice(2));
  if (!taskId) {
    fail("usage: node core/task-record-paths.mjs <task-id> [relative-record-path] [--must-exist]");
  }

  try {
    if (relPath) {
      const segments = relPath.split("/").filter(Boolean);
      const path = mustExist
        ? requireTaskRecordPath(taskId, ...segments)
        : taskRecordPath(taskId, ...segments);
      process.stdout.write(`${path}\n`);
    } else {
      process.stdout.write(`${JSON.stringify(resolveTaskRecordPaths(taskId), null, 2)}\n`);
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}
