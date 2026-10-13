// AC-C05AUD-28 public CLI regression; fixtures are local owned repositories.
import { afterEach, expect, test } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const roots = [];
const rootUrl = new URL('../../', import.meta.url), cli = fileURLToPath(new URL('tools/cli/stage-runtime.mjs', rootUrl));
const target = 'phases/P1-结果接线.md';
function materials(ref = target, { missingAc = false } = {}) {
  const command = 'node --test tests/owned.test.mjs';
  const spec = '# Spec\n- **FR-001**：Visible owned result.\n- [ ] **AC-001 — visible result**\n  - **需求**：FR-001\n  - **通过条件**：visible result is returned.\n  - **失败条件**：result is lost.\n' + (missingAc ? '- [ ] **AC-002 — deliberately uncovered failure**\n  - **需求**：FR-001\n  - **通过条件**：uncovered result remains visible.\n  - **失败条件**：uncovered result is lost.\n' : '') + '\n## 实现设计（全局权威）\n### Code Anchors\n`README.md` owns visible output.\n### Interfaces and Failure Semantics\nReturn visible output and preserve failure.\n### Requirement-to-Task Trace\n| source | FR | AC | task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 |\n### Global Verification Strategy\n`' + command + '`\n';
  const index = '# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `' + ref + '` | `phase-p1` | `README.md` | `none` | build-code |\n';
  const phase = [
    '# Phase P1 — owned result', '- **Global spec**：`spec.md`', '- **Write set**：`README.md`', '- **Dependency**：none', '- **Consumer**：build-code',
    '## L0 — Outcome', '- **gate_cmd**：`' + command + '`', '- **expected_exit**：RED nonzero; GREEN 0', '- **oracle**：ORACLE-P1', '- **evidence_path**：quality/tests/owned.output', '- **STOP**：preserve actual failure', '- **Done**：real target result',
    '## L1 — Contract', '### T001 — deliver owned result', '- **Source / FR / AC**：R-001 / FR-001 / AC-001', '- **Files / symbols**：`README.md` symbol: N/A — fixture source text', '- **Action**：return the owned result', '- **Inputs**：owned input and a negative case', '- **Outputs / failure**：visible output or explicit failure', '- **Boundary / DO NOT TOUCH**：no external repository changes', '- **Dependency**：none', '- **Test tier / skill**：feature / backend-testing', '- **Scenario / fixture or service**：owned local result', '- **RED/GREEN gate_cmd**：`' + command + '`', '- **expected_exit**：RED target nonzero; GREEN 0', '- **RED target failure**：ORACLE-P1 assertion fails when result lost', '- **GREEN oracle**：ORACLE-P1 visible output assertion', '- **Evidence**：quality/tests/owned.output', '- **STOP / recovery**：preserve failure and continue safe repair', '- **Coverage limit**：no external provider quality', '- **Done**：real result and evidence', '## L2 — Removable reference', 'Owned fixture, not a workflow permit.', '',
  ].join('\n');
  return { spec, index, phases: { [ref]: phase } };
}
const asMap = m => ({ 'spec.md': m.spec, 'phases/index.md': m.index, ...m.phases });
function temporary() { const root = realpathSync(mkdtempSync(join(tmpdir(), 'stage-evidence-contract-'))); roots.push({ root, identity: lstatSync(root) }); return root; }
function environment(storage, home) { const env = { ...process.env }; for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k]; if (storage) env.WORKFLOWHUB_TASK_DIR = storage; if (home) { env.HOME = home; env.XDG_CONFIG_HOME = join(home, '.config'); } return env; }
const git = (cwd, ...argv) => execFileSync('git', argv, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(ref = target, options = {}) {
  const root = temporary(), repo = join(root, 'repo'), wt = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home'), taskId = 'stage-evidence-owned', taskDir = join(storage, 'Projects', 'workflowhub', 'tasks', taskId);
  mkdirSync(repo); mkdirSync(home); mkdirSync(taskDir, { recursive: true }); const hooks = join(root, 'hooks'); mkdirSync(hooks);
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Owned path oracle'); git(repo, 'config', 'user.email', 'oracle@example.invalid'); git(repo, 'config', 'commit.gpgsign', 'false'); git(repo, 'config', 'core.hooksPath', hooks);
  writeFileSync(join(repo, 'README.md'), 'baseline\n'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'owned baseline'); git(repo, 'worktree', 'add', '-q', '-b', `task/workflowhub/${taskId}`, wt, 'main');
  const m = materials(ref, options), materialRoot = join(wt, 'specs', taskId); mkdirSync(join(materialRoot, 'phases'), { recursive: true }); writeFileSync(join(materialRoot, 'decision-log.md'), '# Decision\n');
  for (const [path, content] of Object.entries(asMap(m))) writeFileSync(join(materialRoot, path), content);
  git(wt, 'add', 'specs'); git(wt, 'commit', '-qm', 'owned materials');
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: taskId, target_repo_root: repo, record_model: 'vnext-single-write', activation_cohort: 'post', workspace_mode: 'existing', workspace_root: wt })); writeFileSync(join(taskDir, 'facts.jsonl'), '');
  return { root, repo, wt, storage, home, taskId, taskDir, materialRoot, m };
}
afterEach(() => { for (const { root, identity } of roots.splice(0)) { expect(realpathSync(root)).toBe(resolve(root)); expect(dirname(root)).toBe(realpathSync(tmpdir())); expect(basename(root).startsWith('stage-evidence-contract-')).toBe(true); const stat = lstatSync(root); expect([stat.dev, stat.ino]).toEqual([identity.dev, identity.ino]); rmSync(root, { recursive: true, force: true }); } });


// AC-C05AUD-28: independent exact shape oracle, shared by live entry checks and mutants.
function exactEvidence(entry, receipt) {
  expect(Object.keys(entry).sort(), 'ORACLE-P11-EXACT-THREE-KEYS').toEqual(['command', 'exit_code', 'failure_signature']);
  expect(entry.command).toBe(JSON.stringify(receipt.argv));
  expect(entry.exit_code).toBe(receipt.exit_code);
  expect(entry.failure_signature).toEqual(expect.any(String));
  expect(entry.failure_signature.length).toBeGreaterThan(0);
}
function preservedSource(actual, previous) {
  expect(actual, 'ORACLE-P11-PREVIOUS-SOURCE-PRESERVED').toContain(previous);
}
function stage(f) {
  return readFileSync(join(f.taskDir, 'facts.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).find(row => row.stage === 'build-code');
}
function invoke(f, command, input) {
  const inputPath = join(f.wt, 'capture-input.json');
  writeFileSync(inputPath, JSON.stringify(input));
  return spawnSync(process.execPath, [cli, command, '--action=execute', '--stage=build-code', '--project=workflowhub', '--task='+f.taskId, '--task-path='+f.taskDir, '--input='+inputPath],
    { cwd:f.wt, env:environment(f.storage,f.home), encoding:'utf8', timeout:15_000 });
}
function inspectReceipt(f, receipt, expected, originals) {
  const bytes=readFileSync(receipt.receipt_ref), disk=JSON.parse(bytes), raw=readFileSync(receipt.output_ref);
  expect(disk.exit_code).toBe(expected); expect(disk.cwd).toBe(f.wt); expect(disk.argv).toEqual(receipt.argv);
  expect(disk.output_ref).toBe(receipt.output_ref);
  exactEvidence(stage(f).evidence.value.at(-1), disk);
  expect(stage(f).source, 'ORACLE-P11-RECEIPT-POINTER').toContain(receipt.receipt_ref);
  expect(stage(f).source, 'ORACLE-P11-RAW-POINTER').toContain(receipt.output_ref);
  originals.push({receipt:receipt.receipt_ref,bytes,output:receipt.output_ref,raw});
  return stage(f).evidence.value.at(-1);
}
test('ORACLE-P11-EXACT-THREE-KEYS public verify preserves exit7/0/124/null/130, original refs and cursor/source', () => {
  const f=fixture(), originals=[];
  const started=invoke(f,'run',{phase_progress:{phase_id:'P1',task_id:'T001'}});
  expect(started.error).toBeUndefined(); expect(started.status,started.stderr).toBe(0);
  const cursor=stage(f).phase_progress, initialSource=stage(f).source;
  for(const exit of [7,0]) {
    const captured=invoke(f,'verify',{argv:[process.execPath,'-e','console.log("owned-three-key-'+exit+'");process.exit('+exit+')'],slug:'evidence-exit-'+exit});
    expect(captured.error).toBeUndefined(); expect(captured.status,captured.stderr).toBe(exit);
    const receipt=JSON.parse(captured.stdout); inspectReceipt(f,receipt,exit,originals);
    expect(readFileSync(receipt.output_ref,'utf8')).toContain('owned-three-key-'+exit);
    expect(stage(f).phase_progress).toEqual(cursor); preservedSource(stage(f).source,initialSource);
  }
  const timed=invoke(f,'verify',{argv:[process.execPath,'-e','setInterval(()=>{},1000)'],timeoutMs:25,slug:'evidence-timeout'});
  expect(timed.status,timed.stderr).toBe(124);
  const timedReceipt=JSON.parse(timed.stdout); expect(timedReceipt.timed_out).toBe(true);
  expect(inspectReceipt(f,timedReceipt,124,originals).failure_signature).toContain('timed out');

  const absent=invoke(f,'verify',{argv:[join(f.root,'absent-executable')],slug:'evidence-spawn-failure'});
  expect(absent.status).not.toBe(0); const absentError=JSON.parse(absent.stderr);
  expect(absentError.code).toBe('ENOENT');
  const nullBytes=readFileSync(absentError.receipt_ref), nullReceipt=JSON.parse(nullBytes);
  expect(nullReceipt.exit_code).toBeNull(); expect(nullReceipt.error.code).toBe('ENOENT');
  expect(stage(f).evidence.value.map(entry=>entry.exit_code),'ORACLE-P11-NULL-NOT-INTEGER').toEqual([7,0,124]);
  expect(stage(f).source).toContain(absentError.receipt_ref); expect(stage(f).source).toContain(absentError.output_ref);
  originals.push({receipt:absentError.receipt_ref,bytes:nullBytes,output:absentError.output_ref,raw:readFileSync(absentError.output_ref)});

  const inputPath=join(f.wt,'cancel-input.json');
  writeFileSync(inputPath,JSON.stringify({argv:[process.execPath,'-e','setInterval(()=>{},1000)'],slug:'evidence-cancel'}));
  const args=['verify','--action=execute','--stage=build-code','--project=workflowhub','--task='+f.taskId,'--task-path='+f.taskDir,'--input='+inputPath];
  const driver='import{stageRuntimeCliMain}from '+JSON.stringify(new URL('../../tools/cli/stage-runtime.mjs',import.meta.url).href)+';const controller=new AbortController();setTimeout(()=>controller.abort("owned-evidence-cancel"),200);try{await stageRuntimeCliMain('+JSON.stringify(args)+',{services:{commandSignal:controller.signal}});throw Error("unexpected success");}catch(error){console.log(JSON.stringify({code:error.code,receipt_ref:error.receipt_ref,output_ref:error.output_ref}));if(error.code!=="ABORT_ERR")process.exitCode=1;}';
  const cancelled=spawnSync(process.execPath,['--input-type=module','-e',driver],{cwd:f.wt,env:environment(f.storage,f.home),encoding:'utf8',timeout:15000});
  expect(cancelled.error).toBeUndefined(); expect(cancelled.status,cancelled.stderr).toBe(0);
  const cancelError=JSON.parse(cancelled.stdout); expect(cancelError.code).toBe('ABORT_ERR');
  const cancelReceipt={...JSON.parse(readFileSync(cancelError.receipt_ref,'utf8')),receipt_ref:cancelError.receipt_ref};
  expect(cancelReceipt.cancelled).toBe(true);
  expect(inspectReceipt(f,cancelReceipt,130,originals).failure_signature).toContain('cancelled: owned-evidence-cancel');
  const evidence=stage(f).evidence, source=stage(f).source;
  preservedSource(source,initialSource);
  // Scoring negative only: the same live-entry assertion rejects losing the old source.
  // This does not mutate runtime or claim a separately exercised production mutant.
  const overwrittenSource=source.replace(initialSource,'OWNED-OLD-SOURCE-OVERWRITTEN');
  expect(()=>preservedSource(overwrittenSource,initialSource),'source overwrite scoring negative').toThrow();
  const updated=invoke(f,'run',{phase_progress:{phase_id:'P1',task_id:'T001'}});
  expect(updated.status,updated.stderr).toBe(0); expect(stage(f).evidence).toEqual(evidence);
  expect(stage(f).source,'ORACLE-P11-CURSOR-SOURCE-PRESERVED').toBe(source);
  for(const original of originals) {
    expect(readFileSync(original.receipt)).toEqual(original.bytes);
    expect(readFileSync(original.output)).toEqual(original.raw);
  }
}, 30_000);

test('ORACLE-P11-MUTANTS exact oracle rejects added/missing keys and false exit without changing production', () => {
  const receipt={argv:['node','owned.mjs'],exit_code:7};
  const correct={command:'["node","owned.mjs"]',exit_code:7,failure_signature:'owned exit 7'};
  expect(()=>exactEvidence(correct,receipt)).not.toThrow();
  for(const mutant of [
    {...correct,receipt_ref:'extra'}, {...correct,output_ref:'extra'},
    {command:correct.command,exit_code:7}, {...correct,exit_code:0}, {...correct,command:'other'},
  ]) expect(()=>exactEvidence(mutant,receipt),'named in-memory mutant must be rejected').toThrow();
});
