#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { makeDecisionStageResultFilename } from '../core/task-record-paths.mjs';

const args = process.argv.slice(2);
const taskIdArg = args.find(a => a.startsWith('--task-id='));
const reviewFlowIdArg = args.find(a => a.startsWith('--review-flow-id='));
const taskId = taskIdArg ? taskIdArg.split('=')[1] : null;
const reviewFlowId = reviewFlowIdArg ? reviewFlowIdArg.split('=')[1] : null;

if (!taskId || !reviewFlowId) {
  console.error('Usage: node scripts/ci-chain-check.mjs --task-id=<id> --review-flow-id=<id>');
  process.exit(2);
}

const specsDir = resolve(`specs/${taskId}`);
let makeDecisionResult;
try {
  makeDecisionResult = makeDecisionStageResultFilename(reviewFlowId);
} catch (error) {
  console.error(`[FAIL] make-decision: ${error.message}`);
  process.exit(2);
}
let errors = 0, warnings = 0;

// 1. make-decision
try {
  JSON.parse(readFileSync(join(specsDir, makeDecisionResult), 'utf-8'));
  console.log('[OK] make-decision stage-result exists and is valid JSON');
} catch (e) {
  console.error(`[FAIL] make-decision: ${e.message}`);
  errors++;
}

// 2. build-code: verify facts.tests.command
try {
  const bc = JSON.parse(readFileSync(`${specsDir}/stage-result-build-code.json`, 'utf-8'));
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
  const vc = JSON.parse(readFileSync(`${specsDir}/stage-result-verify-code.json`, 'utf-8'));
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
