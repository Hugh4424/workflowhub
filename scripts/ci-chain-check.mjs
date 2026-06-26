#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const taskIdArg = args.find(a => a.startsWith('--task-id='));
const taskId = taskIdArg ? taskIdArg.split('=')[1] : null;

if (!taskId) {
  console.error('Usage: node scripts/ci-chain-check.mjs --task-id=<id>');
  process.exit(2);
}

const specsDir = resolve(`specs/${taskId}`);
let errors = 0, warnings = 0;

// 1. make-decision
try {
  JSON.parse(readFileSync(`${specsDir}/stage-result-make-decision.json`, 'utf-8'));
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
  const required = ['verdict', 'evidence_ref', 'anomaly_flags', 'missing_items', 'user_decision', 'reason', 'error_code'];
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
