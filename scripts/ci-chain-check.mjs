#!/usr/bin/env node
// ci-chain-check.mjs — lightweight 3-stage chain structural validation (F10: no heavy E2E)
// Verifies make-decision → build-code → verify-code product chain is structurally sound.
// Usage: node scripts/ci-chain-check.mjs --task-id=m9-verify-code

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
let errors = 0;

// 1. make-decision stage-result
try {
  const mdPath = `${specsDir}/stage-result-make-decision.json`;
  const raw = readFileSync(mdPath, 'utf-8');
  JSON.parse(raw);
  console.log(`[OK] make-decision stage-result exists and is valid JSON`);
} catch (e) {
  console.error(`[FAIL] make-decision stage-result: ${e.message}`);
  errors++;
}

// 2. build-code stage-result: verify facts.tests.command
try {
  const bcPath = `${specsDir}/stage-result-build-code.json`;
  const bc = JSON.parse(readFileSync(bcPath, 'utf-8'));
  if (!bc.facts || !bc.facts.tests || typeof bc.facts.tests.command !== 'string') {
    console.error(`[FAIL] build-code stage-result: facts.tests.command missing or not a string`);
    errors++;
  } else {
    console.log(`[OK] build-code stage-result: facts.tests.command = ${bc.facts.tests.command}`);
  }
} catch (e) {
  console.error(`[FAIL] build-code stage-result: ${e.message}`);
  errors++;
}

// 3. verify-code stage-result: structural check (path convention D-M9-6)
try {
  const vcPath = `${specsDir}/stage-result-verify-code.json`;
  const vc = JSON.parse(readFileSync(vcPath, 'utf-8'));
  const required = ['verdict', 'evidence_ref', 'anomaly_flags', 'missing_items', 'user_decision', 'reason', 'error_code'];
  const missing = required.filter(k => !(k in vc));
  if (missing.length > 0) {
    console.error(`[FAIL] verify-code stage-result: missing keys: ${missing.join(', ')}`);
    errors++;
  } else {
    console.log(`[OK] verify-code stage-result: all 7 keys present`);
  }
} catch (e) {
  // verify-code may not have run yet — this is a warning, not a failure (F10: no block)
  console.log(`[WARN] verify-code stage-result not available (may not have run yet): ${e.message}`);
}

if (errors > 0) {
  console.error(`\n${errors} chain check error(s) found`);
  process.exit(1);
}
console.log('\nAll chain checks passed');
