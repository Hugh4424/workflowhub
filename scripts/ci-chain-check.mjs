#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolveMakeDecisionStageResultPath, resolveTaskRecordPaths } from '../core/task-record-paths.mjs';

const args = process.argv.slice(2);
const taskIdArg = args.find(a => a.startsWith('--task-id='));
const reviewFlowIdArg = args.find(a => a.startsWith('--review-flow-id='));
const taskTrackingRootArg = args.find(a => a.startsWith('--task-tracking-root='));
const taskId = taskIdArg ? taskIdArg.split('=')[1] : null;
const reviewFlowId = reviewFlowIdArg ? reviewFlowIdArg.split('=')[1] : null;
const taskTrackingRoot = taskTrackingRootArg ? taskTrackingRootArg.slice('--task-tracking-root='.length) : undefined;

if (!taskId || !reviewFlowId) {
  console.error('Usage: node scripts/ci-chain-check.mjs --task-id=<id> --review-flow-id=<id> [--task-tracking-root=<absolute-root>]');
  process.exit(2);
}

let taskRecords, makeDecisionResult;
try {
  const options = taskTrackingRoot ? { taskTrackingRoot } : {};
  taskRecords = resolveTaskRecordPaths(taskId, options);
  makeDecisionResult = resolveMakeDecisionStageResultPath(taskId, reviewFlowId, options);
} catch (error) {
  console.error(`[FAIL] make-decision: ${error.message}`);
  process.exit(2);
}
let errors = 0, warnings = 0;

// A projection guard is deliberately public so every CI consumer fails closed
// even if a prior stage-result still says pass after a process crash.
const pendingGuards = existsSync(taskRecords.reviews_dir)
  ? readdirSync(taskRecords.reviews_dir).filter(name => /^projection-pending-.*\.json$/.test(name))
  : [];
if (pendingGuards.length) {
  console.error(`[FAIL] PROJECTION_PENDING: recover public review projection first (${pendingGuards.join(', ')})`);
  errors++;
}

// 1. make-decision
try {
  JSON.parse(readFileSync(makeDecisionResult, 'utf-8'));
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
