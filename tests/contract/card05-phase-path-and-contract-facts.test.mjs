// Frozen build-plan oracle. Source: real clarification 005 #3; N1 AC02.
// No production implementation; original card05-runtime-target-behavior test remains frozen.
import { afterEach, expect, test } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { phaseFilesFromIndex } from '../../runtime/task/material-workspace.mjs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { phaseProgressTargetExists, prepareTaskBoundBuildCodeReviewBundle } from '../../tools/cli/stage-runtime.mjs';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../runtime/task/workspace.mjs';
import { ArtifactDir } from '../../runtime/evidence/artifact-dir.mjs';
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
function temporary() { const root = realpathSync(mkdtempSync(join(tmpdir(), 'card05-path-facts-'))); roots.push({ root, identity: lstatSync(root) }); return root; }
function environment(storage, home) { const env = { ...process.env }; for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k]; if (storage) env.WORKFLOWHUB_TASK_DIR = storage; if (home) { env.HOME = home; env.XDG_CONFIG_HOME = join(home, '.config'); } return env; }
const git = (cwd, ...argv) => execFileSync('git', argv, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(ref = target, options = {}) {
  const root = temporary(), repo = join(root, 'repo'), wt = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home'), taskId = 'path-facts-owned', taskDir = join(storage, 'Projects', 'workflowhub', 'tasks', taskId);
  mkdirSync(repo); mkdirSync(home); mkdirSync(taskDir, { recursive: true }); const hooks = join(root, 'hooks'); mkdirSync(hooks);
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Owned path oracle'); git(repo, 'config', 'user.email', 'oracle@example.invalid'); git(repo, 'config', 'commit.gpgsign', 'false'); git(repo, 'config', 'core.hooksPath', hooks);
  writeFileSync(join(repo, 'README.md'), 'baseline\n'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'owned baseline'); git(repo, 'worktree', 'add', '-q', '-b', `task/workflowhub/${taskId}`, wt, 'main');
  const m = materials(ref, options), materialRoot = join(wt, 'specs', taskId); mkdirSync(join(materialRoot, 'phases'), { recursive: true }); writeFileSync(join(materialRoot, 'decision-log.md'), '# Decision\n');
  for (const [path, content] of Object.entries(asMap(m))) writeFileSync(join(materialRoot, path), content);
  git(wt, 'add', 'specs'); git(wt, 'commit', '-qm', 'owned materials');
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: taskId, target_repo_root: repo, record_model: 'vnext-single-write', activation_cohort: 'post', workspace_mode: 'existing', workspace_root: wt })); writeFileSync(join(taskDir, 'facts.jsonl'), '');
  return { root, repo, wt, storage, home, taskId, taskDir, materialRoot, m };
}
afterEach(() => { for (const { root, identity } of roots.splice(0)) { expect(realpathSync(root)).toBe(resolve(root)); expect(dirname(root)).toBe(realpathSync(tmpdir())); expect(basename(root).startsWith('card05-path-facts-')).toBe(true); const stat = lstatSync(root); expect([stat.dev, stat.ino]).toEqual([identity.dev, identity.ino]); rmSync(root, { recursive: true, force: true }); } });
test('N17 target: existing index reader returns the physical named authority', () => { const m = materials(); expect(phaseFilesFromIndex(m.index)).toEqual([target]); });
test('N17 target: validator consumes named physical Phase without weakening its write-set contract', () => { const m = materials(), r = validatePostPhaseContract(m); expect(r.facts.phase_rows, 'named Phase supplies its actual task and safe write set').toEqual(expect.arrayContaining([expect.objectContaining({ id: 'P1', path: target, write_set: ['README.md'], task_ids: ['T001'] })])); expect(r.errors.filter(e => /authority ref|missing or empty/.test(e))).toEqual([]); });
test('N17 target: cursor resolves Task through index rather than inventing P1.md', () => { expect(phaseProgressTargetExists({ phase_id: 'P1', task_id: 'T001' }, asMap(materials()))).toBe(true); });
test('N17 target: public run records current cursor for the named indexed Phase', () => {
  const f = fixture(), input = join(f.wt, 'cursor.json'); writeFileSync(input, JSON.stringify({ phase_progress: { phase_id: 'P1', task_id: 'T001' } }));
  const r = spawnSync(process.execPath, [cli, 'run', '--action=execute', '--stage=build-code', '--project=workflowhub', `--task=${f.taskId}`, `--task-path=${f.taskDir}`, `--input=${input}`], { cwd: f.wt, env: environment(f.storage, f.home), encoding: 'utf8', timeout: 15000 });
  expect(r.error).toBeUndefined(); expect(r.status, 'public run reads the named physical Phase: ' + r.stderr).toBe(0); const actual = JSON.parse(r.stdout); expect(actual.phase_progress).toMatchObject({ phase_id: 'P1', task_id: 'T001' });
  const rows = readFileSync(join(f.taskDir, 'facts.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse); expect(rows.find(r => r.stage === 'build-code').phase_progress).toMatchObject({ phase_id: 'P1', task_id: 'T001' });
});
test('N17 baseline: old physical names remain supported and missing Tasks remain absent', () => { const m = materials('phases/P1.md'); expect(phaseFilesFromIndex(m.index)).toEqual(['phases/P1.md']); expect(phaseProgressTargetExists({ phase_id: 'P1', task_id: 'T001' }, asMap(m))).toBe(true); expect(phaseProgressTargetExists({ phase_id: 'P1', task_id: 'T999' }, asMap(m))).toBe(false); expect(validatePostPhaseContract(m).facts.phase_rows[0].write_set).toEqual(['README.md']); });
test('N17 baseline: index traversal remains rejected', () => { expect(() => phaseFilesFromIndex(materials('phases/../outside.md').index)).toThrow(); });
async function packetFixture() {
  // Legacy physical name intentionally isolates N1 from N17 RED. AC002 is a fixed independent missing obligation.
  const f = fixture('phases/P1.md', { missingAc: true }); writeFileSync(join(f.wt, 'README.md'), 'owned result change\n'); writeFileSync(join(f.wt, 'outside.md'), 'OUTSIDE-PHASE-CHANGE\n');
  const task = openTask(f.taskDir, { projectName: 'workflowhub', taskId: f.taskId }), workspace = await openCurrentTaskWorkspace(task), context = { task, manifest: task.manifest, workspace, artifacts: ArtifactDir.open(f.wt, task) }, attachmentRoot = join(f.root, 'attachments'); mkdirSync(attachmentRoot);
  const bundle = prepareTaskBoundBuildCodeReviewBundle(context, { stage: 'build-code', review_scope: 'phase', subject_kind: 'phase', phase_id: 'P1', surface: 'document', materials: { approved_spec: f.m.spec, acceptance_criteria: 'AC-001: visible result; AC-002: deliberately uncovered failure', test_evidence: 'not executed: construction-only owned fixture' } }, { loadConfig: () => ({ attachmentRoot }) });
  return { f, bundle };
}
test('N1 target: actual provider packet exposes the calculated contract failure facts while still building', async () => {
  const { bundle } = await packetFixture(); try {
    expect(bundle.manifest.length, 'contract error must not block packet creation').toBeGreaterThan(0);
    const texts = bundle.manifest.filter(e => e.path !== 'manifest.json' && !e.path.startsWith('skills/') && !e.path.startsWith('contracts/') && e.path !== 'review-instructions.md').map(e => readFileSync(join(bundle.bundleRoot, e.path), 'utf8')).join('\n');
    expect(texts, 'actual delivered source/context carries readonly contract result').toContain('contract_ok'); expect(texts).toContain('contract_error_count'); expect(texts).toContain('ac_coverage'); expect(texts).toContain('fr_coverage'); expect(texts).toContain('command_oracle_checks'); expect(texts).toContain('AC has no executable Phase task coverage: AC-002');
  } finally { bundle.dispose(); }
});
test('N1 baseline: incomplete contract does not block packet creation or broaden selected Phase diff', async () => {
  const { bundle } = await packetFixture(); try { const diff = readFileSync(join(bundle.bundleRoot, 'changes.diff'), 'utf8'); expect(diff).toContain('README.md'); expect(diff).toContain('owned result change'); expect(diff).not.toContain('outside.md'); expect(diff).not.toContain('OUTSIDE-PHASE-CHANGE'); expect(existsSync(join(bundle.bundleRoot, 'manifest.json'))).toBe(true); } finally { bundle.dispose(); }
});


// C01 additions: independent scope/owned oracle; existing assertions above remain frozen.
test('C01 wiring approved host scope and readonly owned boundaries', async () => {
  const { pathToFileURL } = await import('node:url');
  const production = process.env.C01_WIRING_PRODUCTION_ROOT ?? fileURLToPath(rootUrl);
  const { prepareTaskBoundBuildCodeReviewBundle: prepare } = await import(pathToFileURL(join(production,'tools/cli/stage-runtime.mjs')).href);
  const { validatePostPhaseContract: validate } = await import(pathToFileURL(join(production,'runtime/stage/stage-content-contracts.mjs')).href);
  const f=fixture(), pb=join(f.root,'pb'), attachmentRoot=join(f.root,'attachments');mkdirSync(pb);mkdirSync(attachmentRoot);
  git(pb,'init','-q','-b','main');git(pb,'config','user.name','C01 scope oracle');git(pb,'config','user.email','oracle@example.invalid');git(pb,'config','commit.gpgsign','false');
  writeFileSync(join(pb,'README.md'),'PB BASE\n');git(pb,'add','.');git(pb,'commit','-qm','PB baseline');
  const task=openTask(f.taskDir,{projectName:'workflowhub',taskId:f.taskId}), workspace=await openCurrentTaskWorkspace(task);
  const context={task,manifest:task.manifest,workspace,artifacts:ArtifactDir.open(f.wt,task)};
  const scope={taskId:f.taskId,primaryRoot:f.wt,repositories:[
    {id:'wh',sourceRoot:f.wt,targetRepoRoot:f.repo,baseCommit:git(f.wt,'rev-parse','HEAD'),expectedHead:git(f.wt,'rev-parse','HEAD'),expectedBranch:workspace.branch,paths:['README.md']},
    {id:'pb',sourceRoot:pb,targetRepoRoot:pb,baseCommit:git(pb,'rev-parse','HEAD'),expectedHead:git(pb,'rev-parse','HEAD'),expectedBranch:'main',paths:['README.md']},
  ],evidenceFiles:[],authorizationSource:{confirmationRef:'controlled human-source fixture',materialRefs:[]}};
  const owned='`README.md`；`'+pb+'/README.md`';
  const phase=f.m.phases[target].replaceAll('`README.md`',owned);
  writeFileSync(join(f.materialRoot,target),phase);writeFileSync(join(f.materialRoot,'phases/index.md'),f.m.index.replace('`README.md`',owned));
  const request={stage:'build-code',review_scope:'phase',phase_id:'P1',materials:{approved_spec:f.m.spec,acceptance_criteria:'AC-001: actual approved source',test_evidence:'controlled construction only'}};
  writeFileSync(join(f.wt,'README.md'),'WH APPROVED\n');writeFileSync(join(pb,'README.md'),'PB APPROVED\n');
  const attempt=options=>{let bundle;try{bundle=prepare(context,request,{loadConfig:()=>({attachmentRoot}),...options});return {error:null,text:readFileSync(join(bundle.bundleRoot,'changes.diff'),'utf8')};}catch(error){return {error,text:''};}finally{bundle?.dispose();}};
  const approved=attempt({resolveReviewReadScope:()=>scope});
  expect(approved.error,'approved exact host scope must reach the real phase producer').toBeNull();expect(approved.text).toContain('WH APPROVED');expect(approved.text).toContain('PB APPROVED');
  expect(approved.text).toContain('repos/wh/README.md');expect(approved.text).toContain('repos/pb/README.md');
  expect(attempt({reviewReadScope:{...scope,primaryRoot:pb}}).error).toBeTruthy();
  expect(attempt({reviewReadScope:{...scope,taskId:'another-task'}}).error).toBeTruthy();
  expect(attempt({reviewReadScope:{...scope,repositories:scope.repositories.map(r=>r.id==='pb'?{...r,sourceRoot:pb+'-sibling'}:r)}}).error).toBeTruthy();
  expect(attempt({reviewReadScope:{...scope,repositories:scope.repositories.map(r=>r.id==='pb'?{...r,paths:['../outside.md']}:r)}}).error).toBeTruthy();
  expect(attempt({reviewReadScope:{...scope,repositories:scope.repositories.map(r=>r.id==='pb'?{...r,paths:[]}:r)}}).error).toBeTruthy();
  expect(attempt({}).error,'external Phase has no self-granted default read authority').toBeTruthy();
  const spoof={...request,materials:{...request.materials,reviewReadScope:scope}};
  expect(()=>prepare(context,spoof,{loadConfig:()=>({attachmentRoot})})).toThrow();
  const readOnly=materials();readOnly.index=readOnly.index.replace('`README.md`','none（只读验收，无生产修改）');readOnly.phases[target]=readOnly.phases[target]
    .replace('- **Write set**：`README.md`','- **Write set**：none（只读验收，无生产修改）')
    .replace('`README.md` symbol: N/A — fixture source text','N/A — read-only symbol result; no production writes')
    .replace('return the owned result','read-only verification; do not produce or change code');
  expect(validate(readOnly).errors.filter(e=>/Files \/ symbols must name owned write-set paths/.test(e))).toEqual([]);
  const ordinary=materials();ordinary.phases[target]=ordinary.phases[target].replace('`README.md` symbol: N/A — fixture source text','`outside.md` symbol: result');
  expect(validate(ordinary).errors.some(e=>/Files \/ symbols must name owned write-set paths/.test(e))).toBe(true);
  readOnly.phases[target]=readOnly.phases[target].replace('read-only verification; do not produce or change code','implement new code');
  expect(validate(readOnly).errors.some(e=>/Files \/ symbols must name owned write-set paths/.test(e))).toBe(true);
});


// P1 independent-review regression cases; earlier scope/oracle bodies remain unchanged.
async function c01ReviewedScopeFixture({none=false,aliases=false}={}){
  const {pathToFileURL}=await import('node:url');const production=process.env.C01_WIRING_PRODUCTION_ROOT??fileURLToPath(rootUrl);
  const {prepareTaskBoundBuildCodeReviewBundle:prepare}=await import(pathToFileURL(join(production,'tools/cli/stage-runtime.mjs')).href);
  const {validatePostPhaseContract:validate}=await import(pathToFileURL(join(production,'runtime/stage/stage-content-contracts.mjs')).href);
  const {captureReviewSource:capture}=await import(pathToFileURL(join(production,'skills/wh-review/scripts/review-source.mjs')).href);
  const f=fixture(),pb=join(f.root,'pb'),attachmentRoot=join(f.root,'reviewed-attachments');mkdirSync(pb);mkdirSync(attachmentRoot);
  git(pb,'init','-q','-b','main');git(pb,'config','user.name','Reviewed scope oracle');git(pb,'config','user.email','oracle@example.invalid');git(pb,'config','commit.gpgsign','false');writeFileSync(join(pb,'owned.mjs'),'PB METADATA ONLY\n');git(pb,'add','.');git(pb,'commit','-qm','PB baseline');
  writeFileSync(join(f.wt,'owned.mjs'),'WH BASE\n');git(f.wt,'add','owned.mjs');git(f.wt,'commit','-qm','WH owned baseline');
  const task=openTask(f.taskDir,{projectName:'workflowhub',taskId:f.taskId}),workspace=await openCurrentTaskWorkspace(task),context={task,manifest:task.manifest,workspace,artifacts:ArtifactDir.open(f.wt,task)};
  const scope={taskId:f.taskId,primaryRoot:f.wt,repositories:[{id:'wh',sourceRoot:f.wt,targetRepoRoot:f.repo,baseCommit:git(f.wt,'rev-parse','HEAD'),expectedHead:git(f.wt,'rev-parse','HEAD'),expectedBranch:workspace.branch,paths:none?[]:['owned.mjs']},{id:'pb',sourceRoot:pb,targetRepoRoot:pb,baseCommit:git(pb,'rev-parse','HEAD'),expectedHead:git(pb,'rev-parse','HEAD'),expectedBranch:'main',paths:[]}],evidenceFiles:[],authorizationSource:{confirmationRef:'controlled reviewed scope',materialRefs:[]}};
  const m=materials();m.spec=m.spec.replaceAll('README.md','owned.mjs');m.index=m.index.replaceAll('README.md','owned.mjs');m.phases[target]=m.phases[target].replaceAll('README.md','owned.mjs');
  if(none){m.index=m.index.replace('`owned.mjs`','none（只读验收，无生产修改）');m.phases[target]=m.phases[target].replace('- **Write set**：`owned.mjs`','- **Write set**：none（只读验收，无生产修改）').replace('`owned.mjs` symbol: N/A — fixture source text','N/A — read-only symbol result; no production writes').replace('return the owned result','read-only verification; do not produce or change code');}
  if(aliases){const pair='`owned.mjs`；`'+f.wt+'/owned.mjs`';m.index=m.index.replace('`owned.mjs`',pair);m.phases[target]=m.phases[target].replaceAll('`owned.mjs`',pair);}
  for(const [path,text]of Object.entries(asMap(m)))writeFileSync(join(f.materialRoot,path),text);
  const request={stage:'build-code',review_scope:'phase',phase_id:'P1',materials:{approved_spec:m.spec,acceptance_criteria:'AC-001: actual metadata and canonical source identity',test_evidence:'owned fixture; no provider'}};
  const attempt=(selected=scope)=>{let bundle;const captures=[];try{bundle=prepare(context,request,{loadConfig:()=>({attachmentRoot}),reviewReadScope:selected,captureSource:options=>{const source=capture(options);captures.push({id:options.repositoryId,paths:options.writeSet,bytes:Object.keys(source.sourceBytes??{})});return source;}});return{error:null,diff:readFileSync(join(bundle.bundleRoot,'changes.diff'),'utf8'),source:JSON.parse(readFileSync(join(bundle.bundleRoot,'source.json'),'utf8')),captures};}catch(error){return{error,diff:'',source:null,captures};}finally{bundle?.dispose();}};
  return{f,pb,m,scope,validate,attempt,attachmentRoot};
}
function c01BusinessReadObserver(f){
  const instrument=join(f.f.root,'business-read-observer'),log=join(f.f.root,'business-read-observer.jsonl');mkdirSync(instrument);
  const fs=process.getBuiltinModule('node:fs'),forbidden=f.scope.repositories.map(repo=>{const st=fs.statSync(join(repo.sourceRoot,'owned.mjs'),{bigint:true});return{dev:String(st.dev),ino:String(st.ino)};});
  writeFileSync(join(instrument,'sitecustomize.py'),String.raw`
import os,json,subprocess
writer=open(os.environ['C01_EMPTY_READ_OBSERVER_LOG'],'a',buffering=1);realopen=os.open;realread=os.read;realrun=subprocess.run
def note(value):writer.write(json.dumps(value)+'\n')
def opened(path,*args,**kwargs):
 fd=realopen(path,*args,**kwargs);st=os.fstat(fd);note({'event':'open','dev':str(st.st_dev),'ino':str(st.st_ino)});return fd
def read(fd,*args,**kwargs):
 st=os.fstat(fd);note({'event':'read','dev':str(st.st_dev),'ino':str(st.st_ino)});return realread(fd,*args,**kwargs)
def command(argv,*args,**kwargs):
 note({'event':'git','cwd':os.getcwd(),'argv':argv});return realrun(argv,*args,**kwargs)
if realopen in os.supports_dir_fd:os.supports_dir_fd.add(opened)
os.open=opened;os.read=read;subprocess.run=command
`);
  const keys={PYTHONPATH:instrument,C01_EMPTY_READ_OBSERVER_LOG:log},prior={};for(const[key,value]of Object.entries(keys)){prior[key]=process.env[key];process.env[key]=value;}
  return{forbidden,records:()=>fs.existsSync(log)?readFileSync(log,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[],restore(){for(const[key,value]of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}};
}
test('C01 wiring approved host scope and readonly owned boundaries — empty repositories report observed metadata',async()=>{
  const f=await c01ReviewedScopeFixture({none:true}),observer=c01BusinessReadObserver(f);let actual;try{actual=f.attempt();}finally{observer.restore();}expect(actual.error).toBeNull();
  expect(actual.source.repositories,'both empty-scope Git identities must actually be observed').toEqual(expect.arrayContaining(f.scope.repositories.map(repo=>expect.objectContaining({id:repo.id,captured_head:git(repo.sourceRoot,'rev-parse','HEAD'),baseline_commit:repo.baseCommit,changed_paths:[]}))));
  expect(actual.captures).toEqual([{id:'wh',paths:[],bytes:[]},{id:'pb',paths:[],bytes:[]}]);expect(actual.diff).toBe('');
  const events=observer.records();
  for(const repo of f.scope.repositories)expect(events.some(event=>event.event==='git'&&event.cwd===repo.sourceRoot&&event.argv.includes('rev-parse')&&event.argv.includes('HEAD')),'observer must witness actual HEAD metadata for '+repo.id).toBe(true);
  expect(events.filter(event=>(event.event==='open'||event.event==='read')&&observer.forbidden.some(inode=>inode.dev===event.dev&&inode.ino===event.ino)),'empty metadata capture must never open/read either regular business inode').toEqual([]);
  const gitPrefix=['git','--no-optional-locks','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','-c','diff.external=','-c','protocol.allow=never'];
  expect(events.filter(event=>event.event==='git').every(event=>{const repo=f.scope.repositories.find(repo=>repo.sourceRoot===event.cwd);if(!repo)return false;const tails=[['rev-parse','--show-toplevel'],['rev-parse','--git-common-dir'],['rev-parse','--verify','HEAD'],['symbolic-ref','--quiet','--short','HEAD'],['cat-file','-e',repo.baseCommit+'^{commit}']];return tails.some(tail=>JSON.stringify(event.argv)===JSON.stringify([...gitPrefix,...tail]));}),'empty capture permits only exact metadata/object-existence argv with the fixed safe prefix').toBe(true);
  expect(actual.source.captured_head).toBe(git(f.f.wt,'rev-parse','HEAD'));expect(JSON.stringify(actual.source)).not.toContain('PB METADATA ONLY');
  expect(readFileSync(join(f.pb,'owned.mjs'),'utf8')).toBe('PB METADATA ONLY\n');
});
test('C01 wiring approved host scope and readonly owned boundaries — empty repositories reject identity drift',async()=>{
  const f=await c01ReviewedScopeFixture({none:true});
  const changes=[{id:'wh',expectedHead:'0'.repeat(40)},{id:'pb',expectedBranch:'wrong-branch'},{id:'pb',baseCommit:'0'.repeat(40)},{id:'pb',sourceRoot:f.pb+'-missing',targetRepoRoot:f.pb+'-missing'}];
  for(const change of changes){const scope={...f.scope,repositories:f.scope.repositories.map(repo=>repo.id===change.id?{...repo,...change}:repo)};const actual=f.attempt(scope);expect(actual.error,'empty capture must reject '+JSON.stringify(change)).toBeTruthy();expect(actual.error.message).toContain('SOURCE_UNAVAILABLE');expect(actual.diff).toBe('');}
  expect(readFileSync(join(f.pb,'owned.mjs'),'utf8')).toBe('PB METADATA ONLY\n');
  expect(readdirSyncForReviewedScope(f.attachmentRoot).filter(name=>name.startsWith('review-source-')||name.startsWith('.ocr-code-review-'))).toEqual([]);
});
function readdirSyncForReviewedScope(path){return process.getBuiltinModule('node:fs').readdirSync(path);}
test('C01 wiring approved host scope and readonly owned boundaries — canonical aliases share one owner',async()=>{
  const f=await c01ReviewedScopeFixture(),abs='`'+f.f.wt+'/owned.mjs`',relative='`owned.mjs`';
  const equivalent={...f.m,index:f.m.index.replace(relative,abs),reviewReadScope:f.scope};
  expect(f.validate(equivalent).errors.filter(error=>/write set differs from Phase index/.test(error)),'different text for one approved source must have one identity').toEqual([]);
  const phase2=f.m.phases[target].replaceAll('P1','P2').replaceAll('T001','T002').replaceAll(relative,abs);
  const index=f.m.index+'| `P2` | `phases/P2-owned.md` | `phase-p2` | '+abs+' | `none` | build-code |\n';
  const duplicate=f.validate({...f.m,index,phases:{...f.m.phases,'phases/P2-owned.md':phase2},reviewReadScope:f.scope});
  expect(duplicate.errors.some(error=>/write set duplicates.*owned.mjs.*owned by/.test(error)),'independent phases cannot disguise a source alias as a second owner').toBe(true);
});
test('C01 wiring approved host scope and readonly owned boundaries — alias capture emits one patch',async()=>{
  const f=await c01ReviewedScopeFixture({aliases:true});writeFileSync(join(f.f.wt,'owned.mjs'),'WH UNIQUE CURRENT\n');const actual=f.attempt();expect(actual.error).toBeNull();
  expect((actual.diff.match(/^diff --git /gm)??[]).length,'relative/absolute aliases must not duplicate the physical patch').toBe(1);
  expect(actual.captures.find(source=>source.id==='wh').paths).toEqual(['owned.mjs']);expect(actual.diff).toContain('WH UNIQUE CURRENT');
  expect(f.validate({...f.m,reviewReadScope:f.scope}).errors.some(error=>/write set duplicates.*owned.mjs.*owned by/.test(error))).toBe(true);
});


// OCR037 regressions: exact host grants and coherent readonly declaration.
async function c01PublicScopedMaterialFixture(){
 const f=await c01ReviewedScopeFixture(),{stageRuntimeCliMain}=await import(new URL('../../tools/cli/stage-runtime.mjs',import.meta.url));
 const {createHash}=await import('node:crypto'),sha=text=>createHash('sha256').update(text).digest('hex');
 mkdirSync(join(f.f.taskDir,'quality','evidence'),{recursive:true});
 const declared='guidance.md';writeFileSync(join(f.f.wt,declared),'TRUSTED GUIDANCE\n');f.scope.authorizationSource.materialRefs=[join(f.f.wt,declared)];
 const attempt=async(ref,selected=f.scope)=>{const text=readFileSync(join(f.f.wt,ref),'utf8');writeFileSync(join(f.f.taskDir,'quality','evidence','scope-request.json'),JSON.stringify({request:{stage:'build-plan',surface:'document',materials:{raw_requirement:{ref,sha256:sha(text)}}}}));let calls=0,received,error=null;
 const priorStorage=process.env.WORKFLOWHUB_TASK_DIR;process.env.WORKFLOWHUB_TASK_DIR=f.f.storage;
 try{await stageRuntimeCliMain(['review','--action=record','--stage=build-plan','--project=workflowhub','--task='+f.f.taskId,'--task-path='+f.f.taskDir,'--input=quality/evidence/scope-request.json'],{cwd:f.f.wt,services:{resolveReviewReadScope:()=>selected,runReviewRound:async req=>{calls++;received=req.materials.raw_requirement;return{status:'unavailable',stage:req.stage,review_track:null,review_kind:null,review_scope:null,subject_kind:'document',phase_id:null,provider_results:[],findings:[],error:{code:'OWNED_OBSERVER_ONLY',message:'controlled transport observation, not quality'}};}}});}catch(cause){error=cause;}finally{if(priorStorage===undefined)delete process.env.WORKFLOWHUB_TASK_DIR;else process.env.WORKFLOWHUB_TASK_DIR=priorStorage;}return{error,calls,received};};
 return{...f,attemptMaterial:attempt,declared};
}
test('C01 wiring reviewed major material scope — exact repository and material grants resolve',async()=>{
 const f=await c01PublicScopedMaterialFixture();
 for(const ref of ['owned.mjs',f.declared]){const actual=await f.attemptMaterial(ref);expect(actual.error).toBeNull();expect(actual.calls).toBe(1);expect(actual.received).toBe(readFileSync(join(f.f.wt,ref),'utf8'));}
});
test.each(['owned.mjs.backup','guidance.md-sibling'])('C01 wiring reviewed major material scope — denied exact-prefix sibling %s is never opened',async ref=>{
 const f=await c01PublicScopedMaterialFixture();writeFileSync(join(f.f.wt,ref),'UNAPPROVED PRIVATE CONTENT\n');const observer=c01BusinessReadObserver(f),st=process.getBuiltinModule('node:fs').statSync(join(f.f.wt,ref),{bigint:true}),secret={dev:String(st.dev),ino:String(st.ino)};let actual,events;
 try{const prime=await f.attemptMaterial('owned.mjs');expect(prime.error).toBeNull();expect(prime.calls).toBe(1);expect(observer.records().some(event=>event.event==='read'&&observer.forbidden.some(inode=>inode.dev===event.dev&&inode.ino===event.ino)),'real worker observer must load and observe positive material read').toBe(true);const start=observer.records().length;actual=await f.attemptMaterial(ref);events=observer.records().slice(start);}finally{observer.restore();}
 expect(actual.error,'matching SHA must not grant a workspace sibling').toBeTruthy();expect(actual.error.code).toBe('TASK_FILE_INVALID');expect(actual.error.message).toContain('outside approved');expect(actual.calls).toBe(0);expect(actual.received).toBeUndefined();
 expect(events.filter(event=>(event.event==='open'||event.event==='read')&&event.dev===secret.dev&&event.ino===secret.ino),'denial must precede actual worker open/read of this regular inode').toEqual([]);
});
test.each(['read-only verification; do not produce or change code; but implement new code in owned.mjs','只读核验，不修改代码；但是修改 owned.mjs 代码'])('C01 wiring reviewed major readonly scope — contradictory Action rejected: %s',async action=>{
 const f=await c01ReviewedScopeFixture({none:true}),original='read-only verification; do not produce or change code';
 expect(f.validate(f.m).errors.filter(error=>/Files \/ symbols must name owned write-set paths/.test(error)),'coherent readonly none remains supported').toEqual([]);
 const contradictory={...f.m,phases:{...f.m.phases,[target]:f.m.phases[target].replace(original,action)}};
 expect(f.validate(contradictory).errors.some(error=>/Files \/ symbols must name owned write-set paths/.test(error)),'negative phrase cannot conceal affirmative code mutation').toBe(true);
});

// Supplement050: inspection nouns are readonly, later code actions remain owned.
test.each([
 {read:'只读核验实现，不修改代码',write:'只读核验实现，不修改代码；但实现 owned.mjs 新代码'},
 {read:'只读审查重构结果，不修改代码',write:'只读审查重构结果，不修改代码；但重构 owned.mjs 模块'},
])('C01 wiring readonly inspection noun — $read',async({read,write})=>{
 const f=await c01ReviewedScopeFixture({none:true}),original='read-only verification; do not produce or change code';
 const check=action=>f.validate({...f.m,phases:{...f.m.phases,[target]:f.m.phases[target].replace(original,action)}}).errors.filter(error=>/Files \/ symbols must name owned write-set paths/.test(error));
 expect(check(read),'readonly inspection of implementation/refactor result is not a production action').toEqual([]);
 expect(check(write).length,'inspection prefix cannot hide a later affirmative code action').toBeGreaterThan(0);
});

// Non-AC fact trace regression: declaration validator only, no filesystem grants or quality result.
function c01NonAcFactTraceFixture() {
  const m = materials(), phase = 'phases/P2-事实原件.md';
  const taskRoot = '/controlled/task', paths = ['quality/evidence/baseline.md', 'quality/evidence/environment.md'];
  const owned = paths.map(path => taskRoot + '/' + path), quoted = owned.map(path => '`' + path + '`').join('；').replaceAll('\`', '`');
  // Match the current five-column trace shape; retain the ordinary accepted FR/AC task.
  m.spec = m.spec.replace('| source | FR | AC | task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 |',
    '| source | FR / AC | task | oracle | consumer |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-001 / AC-001 | P1/T001 | ORACLE-P1 | build-code reads README result |\n| U-FACT-01/U-FACT-02 | 附加Z，非产品AC | P2/T002 | ORACLE-FACT-PIN | C09 owner reads baseline and environment facts; absent measurements remain absent |');
  m.spec += '\n## 附加Z — 基线事实（不计产品 AC）\nP2/T002 only records original baseline and environment facts for C09 owner; it is not a product acceptance condition. U-FACT-01/U-FACT-02 bind the input; ORACLE-FACT-PIN preserves absent measurements.\n';
  m.index += '| `P2` | `' + phase + '` | `phase-p2` | ' + quoted + ' | `P1` | C09 input owner |\n';
  let body = m.phases[target].replace('# Phase P1 — owned result', '# Phase P2 — baseline fact records')
    .replace('- **Global spec**：`spec.md`', '- **Global spec**：`spec.md#附加z--基线事实不计产品-ac`')
    .replace('- **Write set**：`README.md`', '- **Write set**：' + quoted)
    .replaceAll('- **Dependency**：none', '- **Dependency**：P1')
    .replace('- **Consumer**：build-code', '- **Consumer**：C09 input owner\n- **覆盖 AC**：附加Z；不计产品AC')
    .replace('### T001 — deliver owned result', '### T002 — record original baseline facts')
    .replace('- **Source / FR / AC**：R-001 / FR-001 / AC-001', '- **Source / FR / AC**：U-FACT-01/02；spec附加Z，非产品AC：只整理原事实，不形成产品验收条件')
    .replace('- **Files / symbols**：`README.md` symbol: N/A — fixture source text', '- **Files / symbols**：' + quoted + ' symbol: N/A — task-owned documentation facts only')
    .replace('- **Action**：return the owned result', '- **Action**：只读整理原baseline事实；不产出或修改生产代码；保存形成时与当前差异')
    .replace('- **Inputs**：owned input and a negative case', '- **Inputs**：G-2文档无新增runtime；原baseline与环境输入，仅保事实不采实验结果')
    .replace('- **Scenario / fixture or service**：owned local result', '- **Scenario / fixture or service**：G-2文档无新增运行行为；原始输入的具名只读整理')
    .replace('- **expected_exit**：RED target nonzero; GREEN 0', '- **expected_exit**：客观检查预期0，不执行RED；结构接纳不等于GREEN')
    .replace('- **RED target failure**：ORACLE-P1 assertion fails when result lost', '- **RED target failure**：ORACLE-FACT-PIN 断言 baseline facts preserves absent measurements\n- **RED evidence**：N/A — 文档无新增运行行为；风险：C09 owner误把fixed对象当collected导致收益比较失真；客观替代：具名pin复放和独立文档审查')
    .replace('- **GREEN oracle**：ORACLE-P1 visible output assertion', '- **GREEN oracle**：ORACLE-FACT-PIN baseline facts preserves absent measurements')
    .replaceAll('ORACLE-P1', 'ORACLE-FACT-PIN');
  m.phases[phase] = body;
  m.reviewReadScope = { taskRoot, repositories: [{ id: 'wh', sourceRoot: '/controlled/wh', paths: ['README.md'] }], evidenceFiles: paths.map(ref => ({ ref })) };
  return { m, phase, owned };
}
test('C01 trace fact-only — source-bound non-AC task remains in graph without inflating FR/AC coverage', () => {
  const { m, phase } = c01NonAcFactTraceFixture(), result = validatePostPhaseContract(m);
  expect(result.errors, 'same source, addendum, task and oracle must be a legal fact trace').toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.facts.task_count).toBe(2);
  expect(result.facts.phase_rows.find(row => row.path === phase)).toMatchObject({ task_ids: ['T002'], frs: [], acs: [] });
  expect(result.facts.fr_coverage).toMatchObject({ accepted_count: 1, covered_count: 1, accepted_ids: ['FR-001'], covered_ids: ['FR-001'] });
  expect(result.facts.ac_coverage).toMatchObject({ accepted_count: 1, covered_count: 1, accepted_ids: ['AC-001'], covered_ids: ['AC-001'] });
});
test.each([
  ['missing source', ({ m, phase }) => { m.phases[phase] = m.phases[phase].replace('U-FACT-01/02', 'N/A'); }],
  ['wrong source suffix', ({ m, phase }) => { m.phases[phase] = m.phases[phase].replace('U-FACT-01/02', 'U-FACT-01/99'); }],
  ['bare N/A reason', ({ m, phase }) => { m.phases[phase] = m.phases[phase].replace('spec附加Z，非产品AC：只整理原事实，不形成产品验收条件', 'N/A'); }],
  ['wrong task', ({ m }) => { m.spec = m.spec.replace('| P2/T002 |', '| P2/T999 |'); }],
  ['missing oracle', ({ m }) => { m.spec = m.spec.replace('| ORACLE-FACT-PIN |', '| |'); }],
  ['wrong oracle', ({ m }) => { m.spec = m.spec.replace('| ORACLE-FACT-PIN |', '| ORACLE-WRONG |'); }],
  ['missing consumer', ({ m }) => { m.spec = m.spec.replace('C09 owner reads baseline and environment facts; absent measurements remain absent |', ' |'); }],
  ['fake non-AC row containing product IDs', ({ m }) => { m.spec = m.spec.replace('附加Z，非产品AC |', '附加Z，非产品AC FR-001 AC-001 |'); }],
  ['ordinary method write set', ({ m, phase, owned }) => { const path = 'skills/method/SKILL.md'; m.index = m.index.replaceAll(owned[0], path); m.phases[phase] = m.phases[phase].replaceAll(owned[0], path); m.reviewReadScope.repositories[0].paths.push(path); }],
  ['affirmative code mutation after readonly clause', ({ m, phase }) => { m.phases[phase] = m.phases[phase].replace('保存形成时与当前差异', '但是修改 owned.mjs 代码'); }],
])('C01 trace fact-only protection — %s', (name, mutate) => {
  const fixture = c01NonAcFactTraceFixture(); mutate(fixture);
  const result = validatePostPhaseContract(fixture.m);
  expect(result.errors.some(error => /Source \/ FR \/ AC must bind|Requirement-to-Task Trace.*P2\/T002/.test(error)), name + ' cannot bypass product trace obligations').toBe(true);
});

test.each(['unapproved fact file', 'scope absent'])('C01 trace fact-only scope protection — %s', name => {
  const { m } = c01NonAcFactTraceFixture();
  if (name === 'scope absent') delete m.reviewReadScope;
  else m.reviewReadScope.evidenceFiles.pop();
  const result = validatePostPhaseContract(m);
  expect(result.errors.some(error => error.includes('P2') && error.includes('unsafe write set path: /controlled/task/quality/evidence/environment.md'))).toBe(true);
  expect(result.facts.phase_rows.some(row => row.id === 'P2')).toBe(false);
});


async function c01ApprovedSubsetFixture() {
  const f = await c01ReviewedScopeFixture(), declared = ['owned.mjs', 'picked.mjs', 'unapproved-1.mjs', 'unapproved-2.mjs', 'unapproved-3.mjs', 'unapproved-4.mjs', 'unapproved-5.mjs'];
  const quote = String.fromCharCode(96), original = quote + 'owned.mjs' + quote, owned = declared.map(path => quote + path + quote).join('；');
  f.m.index = f.m.index.replace(original, owned); f.m.phases[target] = f.m.phases[target].replaceAll(original, owned);
  for (const [path, text] of Object.entries(asMap(f.m))) writeFileSync(join(f.f.materialRoot, path), text);
  for (const path of declared) writeFileSync(join(f.f.wt, path), 'CURRENT ' + path + '\n');
  writeFileSync(join(f.f.wt, 'extra.mjs'), 'APPROVED UNDECLARED MUST NOT BE CAPTURED\n');
  f.scope.repositories[0].paths = declared.slice(0, 2);
  return { f, declared };
}
test('C01 capture approved subset — real WH source captures two out of seven declared paths', async () => {
  const { f, declared } = await c01ApprovedSubsetFixture(), result = f.attempt();
  expect(result.error, 'approved intersection must reach real held-FD source capture').toBeNull();
  expect(result.captures.find(row => row.id === 'wh')).toEqual({ id: 'wh', paths: declared.slice(0, 2), bytes: declared.slice(0, 2).map(path => 'repos/wh/' + path) });
  expect(result.source.repositories.find(row => row.id === 'wh').selected_paths).toEqual(declared.slice(0, 2).map(path => 'repos/wh/' + path));
  for (const path of declared.slice(0, 2)) expect(result.diff).toContain('CURRENT ' + path);
  for (const path of declared.slice(2)) expect(result.diff).not.toContain('CURRENT ' + path);
});
test('C01 capture approved subset — approved undeclared source still stays outside packet', async () => {
  const { f, declared } = await c01ApprovedSubsetFixture(); f.scope.repositories[0].paths.push('extra.mjs');
  const result = f.attempt(); expect(result.error).toBeNull();
  expect(result.captures.find(row => row.id === 'wh').paths).toEqual(declared.slice(0, 2));
  expect(result.captures.find(row => row.id === 'wh').bytes).not.toContain('repos/wh/extra.mjs');
  expect(result.diff).not.toContain('APPROVED UNDECLARED MUST NOT BE CAPTURED');
});
test('C01 capture approved subset — selected symlink and traversal grant are rejected by real owners', async () => {
  const { f, declared } = await c01ApprovedSubsetFixture(), fs = process.getBuiltinModule('node:fs');
  fs.unlinkSync(join(f.f.wt, declared[0])); fs.symlinkSync(join(f.f.wt, declared[2]), join(f.f.wt, declared[0]));
  const alias = f.attempt(); expect(alias.error?.message).toMatch(/secure source capture failed/); expect(alias.captures).toEqual([]); expect(alias.diff).toBe('');
  const traversal = f.attempt({ ...f.scope, repositories: f.scope.repositories.map(repo => repo.id === 'wh' ? { ...repo, paths: ['../outside.mjs'] } : repo) });
  expect(traversal.error?.message).toMatch(/invalid exact repository scope/); expect(traversal.captures).toEqual([]);
});


test.each(['N/A', 'TBD', 'TODO', '待补充'])('C01 trace consumer placeholder — bare %s cannot stand for a named consumer', placeholder => {
  const { m } = c01NonAcFactTraceFixture();
  m.spec = m.spec.replace('C09 owner reads baseline and environment facts; absent measurements remain absent |', placeholder + ' |');
  const result = validatePostPhaseContract(m);
  expect(result.ok, 'bare consumer placeholder must not qualify for a non-AC fact trace').toBe(false);
  expect(result.errors.some(error => /Source \/ FR \/ AC must bind|Requirement-to-Task Trace.*P2\/T002/.test(error))).toBe(true);
});
test.each(['N/A', 'TBD', 'TODO', '待补充'])('C01 trace consumer placeholder — named consumer describing %s remains valid', placeholder => {
  const { m } = c01NonAcFactTraceFixture();
  m.spec = m.spec.replace('C09 owner reads baseline and environment facts; absent measurements remain absent |', 'C09 owner reads baseline and environment facts; ' + placeholder + ' measurements stay absent |');
  const result = validatePostPhaseContract(m);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.facts.phase_rows.find(row => row.id === 'P2').task_ids).toEqual(['T002']);
});

test.each(['TBD: consumer not assigned', 'TODO: assign a consumer', '待补充：消费者尚未确定', 'N/A: no consumer assigned'])('C01 trace consumer assignment — unresolved %s cannot qualify', consumer => {
  const { m } = c01NonAcFactTraceFixture();
  m.spec = m.spec.replace('C09 owner reads baseline and environment facts; absent measurements remain absent |', consumer + ' |');
  const result = validatePostPhaseContract(m);
  expect(result.ok, 'unassigned consumer status cannot stand for a named receiver').toBe(false);
  expect(result.errors.some(error => /Source \/ FR \/ AC must bind|Requirement-to-Task Trace.*P2\/T002/.test(error))).toBe(true);
});
test.each(['C09 owner reads baseline facts; TBD: absent measurement', 'C09 owner reads baseline facts; TODO: collect later', 'C09 owner reads baseline facts; 待补充：实际测量', 'TBD archive owner reads baseline facts'])('C01 trace consumer assignment — named description %s remains valid', consumer => {
  const { m } = c01NonAcFactTraceFixture();
  m.spec = m.spec.replace('C09 owner reads baseline and environment facts; absent measurements remain absent |', consumer + ' |');
  const result = validatePostPhaseContract(m);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.facts.phase_rows.find(row => row.id === 'P2').task_ids).toEqual(['T002']);
});
