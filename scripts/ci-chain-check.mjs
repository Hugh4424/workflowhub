#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolveMakeDecisionStageResultPath, resolveTaskRecordPaths } from '../core/task-record-paths.mjs';
import { readReviewResult, aggregateMakeDecisionResults } from '../core/review-result-consumer.mjs';

const args = process.argv.slice(2);
const taskIdArg = args.find(a => a.startsWith('--task-id='));
const taskTrackingRootArg = args.find(a => a.startsWith('--task-tracking-root='));
const taskId = taskIdArg ? taskIdArg.split('=')[1] : null;
const taskTrackingRoot = taskTrackingRootArg ? taskTrackingRootArg.slice('--task-tracking-root='.length) : undefined;

if (!taskId) {
  console.error('Usage: node scripts/ci-chain-check.mjs --task-id=<id> [--task-tracking-root=<absolute-root>]');
  process.exit(2);
}

let taskRecords, makeDecisionResult;
try {
  const options = taskTrackingRoot ? { taskTrackingRoot } : {};
  taskRecords = resolveTaskRecordPaths(taskId, options);
  makeDecisionResult = resolveMakeDecisionStageResultPath(taskId, options);
} catch (error) {
  console.error(`[FAIL] make-decision: ${error.message}`);
  process.exit(2);
}
let errors = 0, warnings = 0;

// 1. make-decision
try {
  const stage = JSON.parse(readFileSync(makeDecisionResult, 'utf-8'));
  const direction = readReviewResult(stage.facts?.reviews?.direction, taskRecords.task_root, { stage: 'make-decision', track: 'direction' }).result;
  const detail = readReviewResult(stage.facts?.reviews?.detail, taskRecords.task_root, { stage: 'make-decision', track: 'detail' }).result;
  if (aggregateMakeDecisionResults(direction, detail) !== 'pass') throw new Error('direction/detail aggregate is not pass');
  console.log('[OK] make-decision stage-result exists and is valid JSON');
} catch (e) {
  console.error(`[FAIL] make-decision: ${e.message}`);
  errors++;
}

// 2. build-code: verify facts.tests.command
try {
  const bc = JSON.parse(readFileSync(taskRecords.stage_result.build_code, 'utf-8'));
  if (!bc.facts?.tests?.command || typeof bc.facts.tests.command !== 'string') {
    console.error('[FAIL] build-code: facts.tests.command missing or not string');
    errors++;
  } else {
    console.log(`[OK] build-code: facts.tests.command = ${bc.facts.tests.command}`);
  }
  readReviewResult(bc.facts?.review, taskRecords.task_root, { stage: 'build-code', track: null, requirePass: true });
} catch (e) {
  console.error(`[FAIL] build-code: ${e.message}`);
  errors++;
}

// 3. verify-code: check 7-key structure at TOP level (aligned with facts-assembly.mjs assembleStageResult)
try {
  const vc = JSON.parse(readFileSync(taskRecords.stage_result.verify_code, 'utf-8'));
  const required = ['status', 'error_code', 'retryable', 'facts', 'missing_items', 'user_decision', 'reason'];
  const missing = required.filter(k => !(k in vc));
  if (missing.length > 0) {
    console.error(`[FAIL] verify-code: missing top-level keys: ${missing.join(', ')}`);
    errors++;
  } else {
    console.log('[OK] verify-code: all 7 keys present at top level');
  }
} catch (e) {
  console.error(`[FAIL] verify-code stage-result: ${e.message}`);
  errors++;
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 ? 1 : 0);
