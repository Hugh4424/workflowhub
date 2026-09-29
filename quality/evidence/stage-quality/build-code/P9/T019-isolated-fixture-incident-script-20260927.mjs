import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const sourceRoot = process.cwd();
const evidence = resolve(sourceRoot, 'quality/evidence/stage-quality/build-code/P9');
mkdirSync(evidence, { recursive: true });
const bootstrapTask = (await import(pathToFileURL(resolve(sourceRoot, 'tools/cli/task-bootstrap.mjs')))).bootstrapTask;
const openTask = (await import(pathToFileURL(resolve(sourceRoot, 'runtime/task/task-handle.mjs')))).openTask;
const openCurrentTaskWorkspace = (await import(pathToFileURL(resolve(sourceRoot, 'runtime/task/workspace.mjs')))).openCurrentTaskWorkspace;
const runCapture = (await import(pathToFileURL(resolve(sourceRoot, 'workflows/build-code/capture.mjs')))).runCapture;
const collectRegisteredTestInventory = (await import(pathToFileURL(resolve(sourceRoot, 'workflows/build-code/test-asset-inventory.mjs')))).collectRegisteredTestInventory;
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-p9-real-three-')));
const repo = join(temporary, 'repo'), storage = join(temporary, 'storage'), home = join(temporary, 'home');
mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function command(cmd, args, cwd = sourceRoot) {
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, npm_config_update_notifier: 'false', NPM_CONFIG_UPDATE_NOTIFIER: 'false' } });
  if (result.status !== 0 || result.error) throw new Error(`${cmd} ${args.join(' ')}: ${result.stderr || result.error?.message || result.status}`);
  return result.stdout.trim();
}
const selected = ['tests/contract/decision-log-census.test.mjs', 'tests/contract/acceptance-result-machine-classes.test.mjs', 'tests/deferred-acceptance-semantics.test.mjs'];
const anchors = [...selected, 'docs/quality/test-asset-registry.json', 'specs/workflowhub-thin-core-card-04-20260919/decision-log.md',
  'specs/workflowhub-thin-core-card-04-20260919/phases/P7.md', 'runtime/stage/stage-content-contracts.mjs',
  'runtime/evidence/acceptance-evidence-validator.mjs', 'runtime/evidence/freshness.mjs', 'runtime/evidence/quality-store.mjs'];
const before = Object.fromEntries(anchors.map((path) => [path, sha(readFileSync(resolve(sourceRoot, path)))]));
const excludes = ['--exclude=/.git/', '--exclude=/node_modules/', '--exclude=/quality/', '--exclude=/.DS_Store'];
const proof = { schema: 'card04-p9-real-three-target-capture.v1', started_at: new Date().toISOString(),
  source_root: sourceRoot, temporary_fixture: temporary, targets: [], source_anchor_before: before };
let failed = null;
try {
  command('rsync', ['-a', ...excludes, `${sourceRoot}/`, `${repo}/`]);
  let changes = command('rsync', ['-acn', '--out-format=%n', ...excludes, `${sourceRoot}/`, `${repo}/`]);
  if (changes) { command('rsync', ['-a', ...excludes, `${sourceRoot}/`, `${repo}/`]); changes = command('rsync', ['-acn', '--out-format=%n', ...excludes, `${sourceRoot}/`, `${repo}/`]); }
  if (changes) throw new Error(`source changed during coherent copy: ${changes.slice(0, 1000)}`);
  const after = Object.fromEntries(anchors.map((path) => [path, sha(readFileSync(resolve(sourceRoot, path)))]));
  proof.source_anchor_after_copy = after;
  if (anchors.some((path) => before[path] !== after[path])) throw new Error('source anchors changed during copy');
  for (const path of anchors) if (sha(readFileSync(resolve(repo, path))) !== before[path]) throw new Error(`copied source bytes mismatch: ${path}`);
  command('git', ['init', '-q', '-b', 'main'], repo);
  command('git', ['config', 'user.name', 'P9 real fixture'], repo);
  command('git', ['config', 'user.email', 'p9-real@example.test'], repo);
  command('git', ['add', '-A'], repo);
  command('git', ['commit', '-qm', 'coherent current source for three targeted tests'], repo);
  proof.fixture_baseline_commit = command('git', ['rev-parse', 'HEAD'], repo);
  proof.fixture_baseline_tree = command('git', ['rev-parse', 'HEAD^{tree}'], repo);
  const bootstrapped = bootstrapTask({ project: 'P9Real', task: 'p9-real-three-targets', 'target-repo': repo },
    { env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo });
  const task = openTask(bootstrapped.task_path, 'P9Real', 'p9-real-three-targets');
  const workspace = openCurrentTaskWorkspace(task);
  const worktree = workspace.worktreeRoot;
  symlinkSync('/Users/Hugh/Hugh/Project/workflowhub/node_modules', resolve(worktree, 'node_modules'));
  proof.task_id = task.identity.taskId; proof.task_path = task.taskPath; proof.worktree = worktree;
  proof.bootstrap_ref = bootstrapped.bootstrap_identity_ref;
  const bootstrapRaw = task.readRecord(proof.bootstrap_ref);
  writeFileSync(resolve(evidence, 'T019-real-three-bootstrap-20260927.json'), bootstrapRaw);
  proof.bootstrap_sha256 = sha(bootstrapRaw);
  const registryRaw = readFileSync(resolve(worktree, 'docs/quality/test-asset-registry.json'));
  writeFileSync(resolve(evidence, 'T019-real-three-registry-20260927.json'), registryRaw);
  proof.registry_sha256 = sha(registryRaw);
  proof.fixture_test_sha256 = Object.fromEntries(selected.map((path) => [path, sha(readFileSync(resolve(worktree, path)))]));
  process.env.npm_config_update_notifier = 'false'; process.env.NPM_CONFIG_UPDATE_NOTIFIER = 'false';
  for (const [index, file] of selected.entries()) {
    const testCommand = `npx vitest run ${file} --reporter=json`;
    const ref = `quality/tests/p9-real-three-target-${index + 1}.json`;
    const started_at = new Date().toISOString();
    const receipt = await runCapture(testCommand, ref, { task, workspace });
    const inventory = collectRegisteredTestInventory({ task, workspace, receipt });
    const completed_at = new Date().toISOString();
    const receiptRaw = task.readRecord(receipt.receipt_ref), outputRaw = task.readRecord(receipt.output_ref);
    const prefix = resolve(evidence, `T019-real-three-target-${index + 1}-20260927`);
    writeFileSync(`${prefix}.receipt.json`, receiptRaw); writeFileSync(`${prefix}.output.txt`, outputRaw);
    const row = { target: file, command: testCommand, started_at, completed_at, receipt_ref: receipt.receipt_ref,
      receipt_sha256: sha(receiptRaw), output_ref: receipt.output_ref, output_sha256: sha(outputRaw),
      dispatch_state: receipt.dispatch_state ?? 'executed', exit_code: receipt.exit_code,
      snapshot_head: receipt.snapshot_head, snapshot_tree: receipt.snapshot_tree, snapshot_commit: receipt.snapshot_commit,
      source_digest: receipt.source_digest, inventory_status: inventory.status,
      registry_revision: inventory.registry_revision, registry_sha256: inventory.registry_sha256,
      leaf_count: inventory.tests.length, passed_count: inventory.tests.filter((entry) => entry.status === 'passed').length,
      missing: inventory.missing, unmatched: inventory.unmatched, skipped: inventory.skipped,
      target_sha256: sha(readFileSync(resolve(worktree, file))) };
    writeFileSync(`${prefix}.meta.json`, `${JSON.stringify(row, null, 2)}\n`);
    proof.targets.push(row);
    if (row.dispatch_state === 'reused' || row.exit_code !== 0 || row.inventory_status !== 'recorded'
        || row.missing.length || row.unmatched.length || row.skipped.length) throw new Error(`target ${index + 1} not newly authenticated green`);
  }
  proof.source_anchor_after_runs = Object.fromEntries(anchors.map((path) => [path, sha(readFileSync(resolve(sourceRoot, path)))]));
  proof.fixture_test_sha256_after = Object.fromEntries(selected.map((path) => [path, sha(readFileSync(resolve(worktree, path)))]));
  if (selected.some((path) => proof.fixture_test_sha256[path] !== proof.fixture_test_sha256_after[path])) throw new Error('fixture test bytes changed during capture');
} catch (error) { failed = error.message; proof.error = failed; }
finally {
  proof.completed_at = new Date().toISOString();
  const raw = `${JSON.stringify(proof, null, 2)}\n`;
  writeFileSync(resolve(evidence, 'T019-real-three-targets-20260927.json'), raw);
  proof.manifest_sha256 = sha(raw);
  rmSync(temporary, { recursive: true, force: true });
  process.stdout.write(JSON.stringify({ status: failed ? 'failed' : 'recorded', error: failed,
    manifest_sha256: proof.manifest_sha256, targets: proof.targets.map((row) => ({ target: row.target,
      exit_code: row.exit_code, inventory_status: row.inventory_status, leaf_count: row.leaf_count,
      receipt_sha256: row.receipt_sha256, output_sha256: row.output_sha256 })) }, null, 2) + '\n');
  if (failed) process.exitCode = 1;
}
