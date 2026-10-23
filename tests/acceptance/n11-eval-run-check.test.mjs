import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'vitest';

export const STAGES = ['make-decision', 'build-plan', 'build-code', 'verify-code'];
const SIDES = ['baseline', 'candidate'];
const TASK = 'n11-same-condition-eval-20261022';
export const FIXED_IDENTITY = Object.freeze({
  task_id: TASK, cohort_id: 'developer-fixed-upstream',
  config_sha256: 'e1ae27bd491d8bd14c4fde6b37043bc7a3b0b77cdeaaa7b7f4ca00071bba6c12',
  fixture_sha256: 'cb01bfc27a336f8024f31834e896fee899173c9f7cb367292eeed9c07e7ee92a',
  fixture_commit: '3068cfd09b421bcfedc0a4e861b05871081c101b',
  runner_snapshot_sha256: 'fca584fd5fd8b4ce12fd76000597b10b740c189daf5632ce57f07c8aaa554255',
  collector_commit: 'cb021147f6b28a68c49352afa50098aea39a90ad',
  candidate_commit: 'cb021147f6b28a68c49352afa50098aea39a90ad',
  baseline_commit: '3068cfd09b421bcfedc0a4e861b05871081c101b',
});
export const DEFAULT_MANIFEST = `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/${TASK}/quality/evidence/2026-10-23-250-p7-eight-cell-actual-manifest.json`;
const key = ({ side, stage }) => `${side}/${stage}`;
const expected = SIDES.flatMap(side => STAGES.map(stage => `${side}/${stage}`)).sort();
function exactKeys(rows, label) {
  assert.ok(Array.isArray(rows), `${label}: missing eight stage cells`);
  assert.deepEqual(rows.map(key).sort(), expected, `${label}: missing/duplicate stage or excluded failure`);
}
export function assertDenominator(manifest) {
  exactKeys(manifest.runs, 'runs');
  exactKeys(manifest.denominator, 'denominator');
}
export function assertCoverageBoundary(manifest) {
  const boundary = manifest.coverage_boundary;
  assert.ok(boundary && typeof boundary === 'object', 'missing coverage_boundary');
  assert.deepEqual(Object.keys(boundary).sort(), ['excluded', 'providers', 'stages'], 'coverage_boundary requires exactly three keys');
  assert.deepEqual([...boundary.stages].sort(), [...STAGES].sort(), 'coverage stages drift');
  assert.deepEqual(boundary.providers, ['codex/luna'], 'coverage provider drift');
  for (const item of ['build-spec', 'other providers', 'other cohorts', 'judgment quality', 'cost', 'long-term effects']) {
    assert.ok(boundary.excluded.includes(item), `coverage_boundary.excluded missing ${item}`);
  }
}
export function assertCohortArtifacts(manifest, readJson = ref => JSON.parse(readFileSync(ref, 'utf8'))) {
  assertDenominator(manifest);
  for (const [field, value] of Object.entries(FIXED_IDENTITY)) assert.equal(manifest.identity?.[field], value, `identity ${field} drift/old cohort`);
  const seen = new Set();
  for (const run of manifest.runs) {
    if (!run.summary_ref) {
      assert.ok(run.failure?.name && run.failure?.reason && run.failure?.receipt_ref, `${key(run)} missing attempt or named startup failure`);
      const receipt = readJson(run.failure.receipt_ref);
      assert.ok(Number.isInteger(receipt.exit_code) && receipt.exit_code !== 0 || receipt.signal || receipt.timed_out || receipt.cancelled, `${key(run)} startup failure needs failed execution receipt`);
      continue;
    }
    assert.ok(!seen.has(run.summary_ref), 'reused summary from another stage/side'); seen.add(run.summary_ref);
    const summary = readJson(run.summary_ref);
    assert.equal(summary.schema_version, 'modeltest.us07.fixed-stage-cohort.v1', 'summary schema drift');
    assert.equal(summary.cohort, FIXED_IDENTITY.cohort_id, 'summary old cohort');
    assert.equal(summary.task_id, 'US-07-modeltest-e2e-evaluation-redesign', 'summary task identity');
    assert.equal(summary.selected_stage, run.stage, 'summary stage identity');
    assert.equal(summary.fixed_upstream_fixture_sha256, FIXED_IDENTITY.fixture_sha256, 'summary fixture drift');
    assert.equal(summary.max_attempts, 1, 'attempt policy drift');
    assert.equal(summary.providers.length, 1, 'provider count drift');
    assert.equal(summary.providers[0].profile, 'codex/luna');
    assert.equal(summary.providers[0].model, 'gpt-6-luna');
    assert.equal(summary.providers[0].effort, 'max');
    assert.deepEqual(summary.stages.map(row => row.stage), [run.stage], 'summary stage rows drift');
    assert.ok(Array.isArray(run.attempt_refs) && run.attempt_refs.length === 1, `${key(run)} missing attempt result`);
    const result = readJson(run.attempt_refs[0]);
    assert.equal(result.schema_version, 'modeltest.us07.stage-result.v1', 'attempt schema drift');
    assert.equal(result.cohort, FIXED_IDENTITY.cohort_id, 'attempt old cohort');
    assert.equal(result.task_id, summary.task_id, 'attempt task identity');
    assert.equal(result.stage, run.stage, 'attempt stage identity');
    assert.equal(result.provider, 'codex/luna', 'attempt provider identity');
  }
}
export function readAndAssertManifest(file = process.env.N11_P7_EVIDENCE_FILE || DEFAULT_MANIFEST, readBytes = ref => readFileSync(ref)) {
  let manifest;
  try { manifest = JSON.parse(readBytes(file)); }
  catch (error) { throw new Error(`ORACLE-N11-SAME-CONDITION missing eight stage attempt/failure evidence manifest: ${file}`, { cause: error }); }
  const base = dirname(resolve(file));
  assertCohortArtifacts(manifest, ref => JSON.parse(readBytes(resolve(base, ref))));
  assertCoverageBoundary(manifest);
  assertActualSourceChain(manifest, ref => readBytes(resolve(base, ref)));
  return manifest;
}

describe('ORACLE-N11-SAME-CONDITION', () => {
  it('reads real eight-cell evidence, retaining failures and explicit coverage', () => { readAndAssertManifest(); });
});

// Controlled objects exercise the same assertions; they do not prove a model run.
function controlledArtifacts() {
  const objects = {};
  const runs = SIDES.flatMap(side => STAGES.map(stage => {
    const summary_ref = `${side}/${stage}/cohort-summary.json`;
    const attempt = `${side}/${stage}/official-controlled.json`;
    objects[summary_ref] = {
      schema_version: 'modeltest.us07.fixed-stage-cohort.v1', task_id: 'US-07-modeltest-e2e-evaluation-redesign',
      cohort: 'developer-fixed-upstream', selected_stage: stage,
      fixed_upstream_fixture_sha256: FIXED_IDENTITY.fixture_sha256, max_attempts: 1,
      providers: [{ profile: 'codex/luna', model: 'gpt-6-luna', effort: 'max' }], stages: [{ stage }],
    };
    objects[attempt] = { schema_version: 'modeltest.us07.stage-result.v1', task_id: 'US-07-modeltest-e2e-evaluation-redesign', cohort: 'developer-fixed-upstream', stage, provider: 'codex/luna', status: 'incomplete' };
    return { side, stage, summary_ref, attempt_refs: [attempt] };
  }));
  // A named launch failure occupies a real denominator cell, with no fabricated summary.
  runs[0] = { side: 'baseline', stage: 'make-decision', failure: { name: 'START_FAILED', reason: 'controlled startup failure', receipt_ref: 'failed-receipt.json' } };
  objects['failed-receipt.json'] = { exit_code: 1 };
  return { manifest: { identity: { ...FIXED_IDENTITY }, runs, denominator: runs.map(({side,stage}) => ({side,stage})), coverage_boundary: { stages: [...STAGES], providers: ['codex/luna'], excluded: ['build-spec', 'other providers', 'other cohorts', 'judgment quality', 'cost', 'long-term effects'] } }, read: ref => { assert.ok(Object.hasOwn(objects, ref), `missing referenced artifact ${ref}`); return objects[ref]; }, objects };
}
describe('controlled counterexamples (not live evaluation)', () => {
  it('accepts complete eight-cell coverage with a named startup failure', () => {
    const { manifest, read } = controlledArtifacts();
    assertCohortArtifacts(manifest, read); assertCoverageBoundary(manifest);
  });
  it('rejects a deleted verify-code stage', () => {
    const { manifest, read } = controlledArtifacts(); manifest.runs.pop();
    assert.throws(() => assertCohortArtifacts(manifest, read), /missing\/duplicate stage/);
  });
  it('rejects exclusion of the failed startup from the denominator', () => {
    const { manifest } = controlledArtifacts(); manifest.denominator.shift();
    assert.throws(() => assertDenominator(manifest), /excluded failure/);
  });
  it('rejects a changed summary schema', () => {
    const { manifest, read, objects } = controlledArtifacts(); objects[manifest.runs[1].summary_ref].schema_version = 'modeltest.us07.fixed-stage-cohort.v2';
    assert.throws(() => assertCohortArtifacts(manifest, read), /schema drift/);
  });
  it('rejects missing coverage_boundary.excluded', () => {
    const { manifest } = controlledArtifacts(); delete manifest.coverage_boundary.excluded;
    assert.throws(() => assertCoverageBoundary(manifest), /exactly three keys/);
  });
  it('rejects the old cohort even with a current manifest identity', () => {
    const { manifest, read, objects } = controlledArtifacts(); objects[manifest.runs[1].summary_ref].cohort = '2026-09-16';
    assert.throws(() => assertCohortArtifacts(manifest, read), /old cohort/);
  });
});

export function assertActualSourceChain(manifest, readBytes = ref => readFileSync(ref)) {
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const json = ref => JSON.parse(readBytes(ref));
  const checked = (ref, digest, label) => {
    assert.match(digest ?? '', /^[a-f0-9]{64}$/, `${label} missing hash`);
    const bytes = readBytes(ref); assert.equal(hash(bytes), digest, `${label} hash mismatch`);
    return JSON.parse(bytes);
  };
  assert.equal(manifest.preflight_sha256, 'e84b677a712694ff298d340e66a6b35230b03a67af8c0b27310e41e96f744a53', 'preflight identity');
  // This immutable preflight hash also fixes baseline clean and the two named
  // candidate dirty paths (Improvements.md and this task's phases/index.md).
  // Additional dirty bytes fail this hash; no second dirty-state authority.
  const preflight = checked(manifest.preflight_ref, manifest.preflight_sha256, 'preflight');
  const root = manifest.modeltest_root;
  assert.equal(root, '/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022', 'ModelTest root');
  for (const original of preflight.inputRefs) {
    assert.equal(hash(readBytes(original.path)), original.sha256, 'input/config/snapshot original hash');
  }
  const runner = json(preflight.snapshot.path);
  assert.equal(runner.snapshot.sha256, FIXED_IDENTITY.runner_snapshot_sha256, 'runner snapshot identity');
  for (const side of SIDES) {
    const source = preflight.cells.find(cell => cell.side === side).sourceRoot;
    assert.equal(preflight.identities.find(item => item.root === source)?.head, FIXED_IDENTITY[`${side}_commit`], 'source commit identity');
  }
  const paired = new Map();
  const summaryHashes = new Set(), resultHashes = new Set();
  for (const run of manifest.runs) {
    const cell = preflight.cells.find(item => item.side === run.side && item.stage === run.stage);
    assert.ok(cell, 'unknown cell');
    assert.equal(run.output_root, cell.outputRoot, 'cell output root');
    const startupFailure = !run.summary_ref;
    if (startupFailure) assert.ok(run.failure?.name && run.failure?.reason && run.failure?.receipt_ref, `${key(run)} missing attempt or named startup failure`);
    const receipt = startupFailure
      ? checked(run.failure.receipt_ref, run.failure.receipt_sha256, 'startup failure receipt')
      : checked(run.receipt_ref, run.receipt_sha256, 'receipt');
    assert.equal(receipt.cwd, cell.cwd, 'actual cwd');
    assert.deepEqual(receipt.argv, ['env', ...Object.entries(cell.env).map(([name, value]) => `${name}=${value}`), ...cell.argv], 'actual source/config/stage/output argv');
    if (startupFailure) {
      assert.ok(Number.isInteger(receipt.exit_code) && receipt.exit_code !== 0 || receipt.signal || receipt.timed_out || receipt.cancelled, `${key(run)} startup failure needs failed execution receipt`);
      continue;
    }
    assert.ok(Number.isInteger(receipt.exit_code), 'missing terminal capture exit');
    assert.equal(run.summary_ref, resolve(cell.outputRoot, 'cohort-summary.json'), 'summary cell root');
    const summary = checked(run.summary_ref, run.summary_sha256, 'summary');
    assert.ok(!summaryHashes.has(run.summary_sha256), 'same-byte summary reused across cells'); summaryHashes.add(run.summary_sha256);
    const row = summary.stages[0].providers[0];
    const resultRef = resolve(root, row.result_ref);
    assert.equal(resultRef, run.attempt_refs[0], 'summary result_ref does not resolve to cell result');
    const providerRoot = resolve(cell.outputRoot, 'stages', run.stage, 'codex-luna');
    assert.equal(dirname(resultRef), resolve(providerRoot, 'artifacts/results'), 'result cell root');
    const result = checked(resultRef, run.attempt_sha256, 'result');
    assert.ok(!resultHashes.has(run.attempt_sha256), 'same-byte result reused across cells'); resultHashes.add(run.attempt_sha256);
    assert.equal(row.execution_id, result.execution_id, 'execution ID chain');
    assert.equal(row.attempt_id, result.attempt_id, 'attempt ID chain');
    const binding = json(resolve(providerRoot, 'binding.json'));
    const artifacts = resolve(providerRoot, 'artifacts');
    const runManifest = json(resolve(artifacts, result.run_manifest_ref));
    const attempt = json(resolve(artifacts, result.attempts[0]));
    for (const object of [binding, runManifest, attempt]) {
      assert.equal(object.stage, run.stage, 'chain stage'); assert.equal(object.cohort, FIXED_IDENTITY.cohort_id, 'chain cohort'); assert.equal(object.provider, 'codex/luna', 'chain provider');
    }
    assert.equal(attempt.execution_id, result.execution_id, 'attempt execution ID');
    assert.equal(attempt.attempt_id, result.attempt_id, 'attempt ID');
    assert.equal(runManifest.binding_id, result.binding_id, 'manifest binding ID');
    assert.equal(attempt.binding_id, result.binding_id, 'attempt binding ID');
    assert.equal(resolve(artifacts, runManifest.result_ref), resultRef, 'manifest result chain');
    assert.equal(binding.snapshot_tree, summary.snapshot_tree, 'binding snapshot');
    assert.equal(result.snapshot_tree, summary.snapshot_tree, 'result snapshot');
    assert.equal(runManifest.snapshot_tree, summary.snapshot_tree, 'manifest snapshot');
    assert.equal(result.execution_identity.configured_model, 'gpt-6-luna', 'configured model');
    const provider = summary.providers[0];
    for (const field of ['model', 'effort', 'config_hash', 'route_hash', 'policy_hash', 'workflowhub_config_id']) assert.equal(binding.provider_binding[field], provider[field], `provider binding ${field}`);
    checked(run.transport_ref, run.transport_sha256, 'transport');
    assert.equal(resolve(artifacts, attempt.transport_evidence_ref), run.transport_ref, 'transport ref chain');
    assert.equal(resolve(dirname(resultRef), result.execution_trace_ref), run.execution_trace_ref, 'trace ref chain');
    assert.equal(hash(readBytes(run.execution_trace_ref)), result.execution_trace_sha256, 'trace hash');
    const sameCondition = {
      requirement: summary.original_requirement_sha256, response: summary.simulated_user_response_sha256,
      fixture: summary.fixed_upstream_fixture_sha256, snapshot: summary.snapshot_tree,
      provider: Object.fromEntries(['profile', 'model', 'effort', 'config_hash', 'route_hash', 'policy_hash', 'workflowhub_config_id'].map(field => [field, provider[field]])),
      upstream: binding.upstream_sha256, material: binding.material_id,
      acceptedUpstream: result.accepted_upstream_sha256,
    };
    for (const value of [sameCondition.requirement, sameCondition.response, sameCondition.upstream, sameCondition.acceptedUpstream]) assert.match(value ?? '', /^[a-f0-9]{64}$/, 'missing actual input identity');
    if (paired.has(run.stage)) assert.deepEqual(sameCondition, paired.get(run.stage), 'same-stage input/config/fixture/snapshot drift');
    else paired.set(run.stage, sameCondition);
  }
}
describe('SPEC-P7-1 actual source chain', () => {
  it('rejects a cross-side result even when labels and official ID match', () => {
    const manifest = JSON.parse(readFileSync('/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n11-same-condition-eval-20261022/quality/evidence/2026-10-23-250-p7-eight-cell-actual-manifest.json'));
    manifest.runs[0].attempt_refs = manifest.runs[1].attempt_refs;
    assert.throws(() => assertActualSourceChain(manifest), /result|cell/);
  });
});

function sourceChainFixture() {
  const manifest = JSON.parse(readFileSync(DEFAULT_MANIFEST));
  const overrides = new Map();
  const read = ref => overrides.get(ref) ?? readFileSync(ref);
  const replace = (ref, object) => {
    const bytes = Buffer.isBuffer(object) ? object : Buffer.from(JSON.stringify(object)); overrides.set(ref, bytes);
    return createHash('sha256').update(bytes).digest('hex');
  };
  return { manifest, read, replace };
}
describe('SPEC-P7-1 controlled actual-shape counterexamples', () => {
  it('rejects an actual receipt invoking the wrong source side', () => {
    const { manifest, read, replace } = sourceChainFixture(); const run = manifest.runs[0];
    const receipt = JSON.parse(read(run.receipt_ref));
    receipt.argv[1] = 'MODELTEST_WORKFLOWHUB_ROOT=/Users/Hugh/Hugh/Project/workflowhub-n11-same-condition-eval-20261022';
    run.receipt_sha256 = replace(run.receipt_ref, receipt);
    assert.throws(() => assertActualSourceChain(manifest, read), /actual source/);
  });
  it('rejects a different path containing the other side exact result bytes', () => {
    const { manifest, read, replace } = sourceChainFixture(); const [baseline, candidate] = manifest.runs;
    candidate.attempt_sha256 = replace(candidate.attempt_refs[0], read(baseline.attempt_refs[0]));
    assert.throws(() => assertActualSourceChain(manifest, read), /same-byte result/);
  });
  it('rejects same-byte summaries copied to another cell path', () => {
    const { manifest, read, replace } = sourceChainFixture(); const [baseline, candidate] = manifest.runs;
    candidate.summary_sha256 = replace(candidate.summary_ref, read(baseline.summary_ref));
    assert.throws(() => assertActualSourceChain(manifest, read), /same-byte summary/);
  });
  it('rejects a changed actual same-stage business input despite an updated summary hash', () => {
    const { manifest, read, replace } = sourceChainFixture(); const run = manifest.runs[1];
    const summary = JSON.parse(read(run.summary_ref)); summary.original_requirement_sha256 = 'a'.repeat(64);
    run.summary_sha256 = replace(run.summary_ref, summary);
    assert.throws(() => assertActualSourceChain(manifest, read), /same-stage input/);
  });
  it('rejects config drift inside actual binding', () => {
    const { manifest, read, replace } = sourceChainFixture(); const run = manifest.runs[1];
    const ref = resolve(run.output_root, 'stages', run.stage, 'codex-luna/binding.json');
    const binding = JSON.parse(read(ref)); binding.provider_binding.config_hash = 'a'.repeat(64); replace(ref, binding);
    assert.throws(() => assertActualSourceChain(manifest, read), /provider binding config_hash/);
  });
  it('rejects an actual snapshot mismatch', () => {
    const { manifest, read, replace } = sourceChainFixture(); const run = manifest.runs[1];
    const result = JSON.parse(read(run.attempt_refs[0])); result.snapshot_tree = 'b'.repeat(40);
    run.attempt_sha256 = replace(run.attempt_refs[0], result);
    assert.throws(() => assertActualSourceChain(manifest, read), /result snapshot/);
  });
});

function startupFailureFixture() {
  const fixture = sourceChainFixture(); const run = fixture.manifest.runs[0];
  run.failure = { name: 'START_FAILED', reason: 'controlled launch failure', receipt_ref: run.receipt_ref, receipt_sha256: run.receipt_sha256 };
  delete run.summary_ref; delete run.attempt_refs;
  const file = '/controlled-p7-startup-manifest.json';
  return { ...fixture, run, check() {
    fixture.replace(file, fixture.manifest);
    return readAndAssertManifest(file, fixture.read);
  } };
}
describe('OCR072 startup failure full gate', () => {
  it('accepts a named startup failure without fabricated summary or result', () => {
    startupFailureFixture().check();
  });
  it('rejects a success receipt mislabeled as startup failure', () => {
    const fixture = startupFailureFixture(); const receipt = JSON.parse(fixture.read(fixture.run.failure.receipt_ref));
    receipt.exit_code = 0; receipt.signal = null; receipt.timed_out = false; receipt.cancelled = false;
    fixture.run.failure.receipt_sha256 = fixture.replace(fixture.run.failure.receipt_ref, receipt);
    assert.throws(() => fixture.check(), /startup failure needs failed execution receipt/);
  });
  it('rejects a missing startup failure reason', () => {
    const fixture = startupFailureFixture(); delete fixture.run.failure.reason;
    assert.throws(() => fixture.check(), /missing attempt or named startup failure/);
  });
  it('rejects a startup failure launched against the wrong source side', () => {
    const fixture = startupFailureFixture(); const receipt = JSON.parse(fixture.read(fixture.run.failure.receipt_ref));
    receipt.argv[1] = 'MODELTEST_WORKFLOWHUB_ROOT=/Users/Hugh/Hugh/Project/workflowhub-n11-same-condition-eval-20261022';
    fixture.run.failure.receipt_sha256 = fixture.replace(fixture.run.failure.receipt_ref, receipt);
    assert.throws(() => fixture.check(), /actual source/);
  });
});

describe('OCR072 preflight dirty scope', () => {
  it('rejects additional source dirty state through the fixed preflight original hash', () => {
    const { manifest, read, replace } = sourceChainFixture();
    const preflight = JSON.parse(read(manifest.preflight_ref));
    preflight.identities[0].dirty += '\n M runtime/stage/unauthorized.mjs';
    replace(manifest.preflight_ref, preflight);
    assert.throws(() => assertActualSourceChain(manifest, read), /preflight hash mismatch/);
  });
});
