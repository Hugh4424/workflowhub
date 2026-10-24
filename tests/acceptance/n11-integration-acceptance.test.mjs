import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { describe, it } from 'vitest';
import { resolveCanonicalTaskPath } from '../../runtime/task/load-config.mjs';

const reportPath = () => process.env.N11_P9_EVIDENCE_FILE || resolve(resolveCanonicalTaskPath({ project: 'workflowhub', task: 'n11-same-condition-eval-20261022' }).taskPath, 'quality/evidence/n11-same-condition-eval-20261022/P9-integration.json');
const NAMES = ['discussion', 'solution', 'implementation', 'acceptance'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function original(item) {
  assert.ok(item && typeof item.ref === 'string' && /^[a-f0-9]{64}$/.test(item.sha256), 'missing original ref/hash');
  assert.equal(sha(readFileSync(item.ref)), item.sha256, `original changed: ${item.ref}`);
}
function belongsToTask(report, ref) {
  const local = relative(dirname(report.task.manifest.ref), resolve(ref));
  assert.ok(local && local !== '..' && !local.startsWith(`..${sep}`) && !local.startsWith(sep), 'artifact belongs to another task');
}
const isTarget = (report, receipt) => receipt.cwd === report.task.workspace
  && Array.isArray(receipt.argv) && receipt.argv.at(-1) === 'tests/contract/task-close-cli-resolution.test.mjs';
function actualTargetReceipts(report) {
  const dir = resolve(dirname(report.task.manifest.ref), 'quality/tests');
  return readdirSync(dir).filter(name => name.endsWith('.json')).map(name => {
    const ref = resolve(dir, name);
    return { ref, receipt: JSON.parse(readFileSync(ref, 'utf8')) };
  }).filter(row => isTarget(report, row.receipt));
}
export function assertNoSimulatedTask(report) {
  assert.equal(report.task.kind, 'real_repository_task', 'simulated task forbidden');
  assert.equal(report.task.stage, 'make-decision', 'small flow has one actual stage');
  assert.equal(report.task.baseline_commit, 'a7d6035eb0aa67596eca1503254f790c39b80fe5');
  original(report.task.manifest);
  const manifest = JSON.parse(readFileSync(report.task.manifest.ref, 'utf8'));
  assert.equal(manifest.task_id, 'n11-p9-task-close-cli-fixture-20261023');
  assert.equal(manifest.activation_cohort, 'post');
  assert.equal(manifest.baseline_commit, report.task.baseline_commit);
  assert.equal(manifest.workspace_root, report.task.workspace);
  assert.notEqual(manifest.task_id, 'n11-same-condition-eval-20261022', 'parent/eval task cannot replace real small task');
}
export function assertFourSegments(report) {
  assertNoSimulatedTask(report);
  assert.deepEqual(report.segments.map(row => row.name).sort(), [...NAMES].sort(), 'missing/duplicate real segment');
  for (const row of report.segments) {
    assert.equal(row.stage, 'make-decision');
    assert.ok(row.owner, 'missing actual owner');
    assert.ok(['pass', 'fail', 'incomplete'].includes(row.outcome), 'missing explicit segment outcome');
    assert.ok(!/P[78]-|cohort-summary|stage-result/.test(row.artifact.ref), 'eval artifact cannot replace real segment');
    belongsToTask(report, row.artifact.ref);
    original(row.artifact);
  }
  assert.ok(report.execution.length > 0, 'missing real command evidence');
  const successful = [];
  for (const item of report.execution) {
    original(item);
    const receipt = JSON.parse(readFileSync(item.ref, 'utf8'));
    if (!isTarget(report, receipt)) continue;
    belongsToTask(report, item.ref);
    if (receipt.exit_code !== 0) continue;
    assert.equal(receipt.signal, null, 'successful target was signalled');
    assert.equal(receipt.timed_out, false, 'successful target timed out');
    assert.equal(receipt.cancelled, false, 'successful target cancelled');
    assert.equal(receipt.truncated, false, 'successful target output truncated');
    belongsToTask(report, receipt.output_ref);
    const output = readFileSync(receipt.output_ref, 'utf8');
    assert.match(output, /Tests\s+1 passed\s+\(1\)/, 'successful target requires 1/1');
    assert.doesNotMatch(output, /Unhandled/i, 'successful target has Unhandled rejection');
    successful.push(item.ref);
  }
  assert.ok(successful.length > 0, 'missing successful target execution');
}
export function assertFailureAttribution(report) {
  assert.ok(report.attribution.length > 0, 'missing observed setup failure');
  for (const row of report.attribution) {
    assert.ok(NAMES.includes(row.segment), 'failure attributed to unknown segment');
    assert.ok(row.reason && row.disposition, 'missing failure reason/disposition');
    original(row.receipt);
    belongsToTask(report, row.receipt.ref);
    const execution = JSON.parse(readFileSync(row.receipt.ref, 'utf8'));
    assert.ok(execution.exit_code !== 0 || execution.signal || execution.timed_out || execution.cancelled, 'failure needs real failed execution');
  }
  const failed = actualTargetReceipts(report).filter(row => row.receipt.exit_code !== 0 || row.receipt.signal || row.receipt.timed_out || row.receipt.cancelled).map(row => row.ref).sort();
  assert.deepEqual(report.attribution.map(row => resolve(row.receipt.ref)).sort(), failed, 'attribution must match complete failed execution set');
}
const load = () => JSON.parse(readFileSync(reportPath(), 'utf8'));
describe('ORACLE-N11-E2E-FOUR', () => {
  it('reads four real small-task segments and rejects missing/simulated/eval substitutes', () => {
    const report = load();
    assertFourSegments(report);
    const missing = structuredClone(report); missing.segments = missing.segments.filter(row => row.name !== 'acceptance');
    assert.throws(() => assertFourSegments(missing), /missing\/duplicate real segment/);
    const simulated = structuredClone(report); simulated.task.kind = 'simulated';
    assert.throws(() => assertFourSegments(simulated), /simulated task forbidden/);
    const replaced = structuredClone(report); replaced.segments[0].artifact.ref += '/P7-baseline-eval.json';
    assert.throws(() => assertFourSegments(replaced), /eval artifact cannot replace real segment/);
    const mixed = structuredClone(report); mixed.segments[0].artifact = report.approval;
    assert.throws(() => assertFourSegments(mixed), /another task/);
    const failedOnly = structuredClone(report); failedOnly.execution = report.attribution.map(row => row.receipt);
    assert.throws(() => assertFourSegments(failedOnly), /successful target execution/);
  });
  it('reads original failures and rejects unknown-stage attribution', () => {
    const report = load();
    assertFailureAttribution(report);
    const unknown = structuredClone(report); unknown.attribution[0].segment = 'unknown';
    assert.throws(() => assertFailureAttribution(unknown), /unknown segment/);
    const omitted = structuredClone(report); omitted.attribution.pop();
    assert.throws(() => assertFailureAttribution(omitted), /complete failed execution set/);
  });
});
