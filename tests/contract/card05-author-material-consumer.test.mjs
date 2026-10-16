// AC-C05AUD-29: consume complete author-owned examples without repairing them in fixtures.
// Missing examples are a document target failure, not runtime behavioral RED.
import { afterEach, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { prepareTaskBoundBuildCodeReviewBundle } from '../../tools/cli/stage-runtime.mjs';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../runtime/task/workspace.mjs';
import { ArtifactDir } from '../../runtime/evidence/artifact-dir.mjs';
const roots=[], phase1='phases/P1-行为结果.md', phase2='phases/P2-文档核对.md', owned=['src/owned.mjs','docs/owned.md'];
const templatePath=fileURLToPath(new URL('../../skills/spec-plan/templates/phase-template.md',import.meta.url));
function examples(bindings={TASK_ID:'author-example-owned',TASK_ROOT:'/owned/task',WORKTREE_ROOT:'/owned/worktree'}) {
  const text=readFileSync(templatePath,'utf8'), blocks={};
  for(const name of ['spec','index','phase-behavior','phase-document']) {
    const marker='<!-- card05-author-example:'+name+' -->';
    expect(text.split(marker).length-1,'ORACLE-P11-AUTHOR-SOURCE missing/duplicate full '+name+' example').toBe(1);
    const tail=text.slice(text.indexOf(marker)+marker.length);
    const match=tail.match(/^\s*(\x60{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
    expect(match,'ORACLE-P11-AUTHOR-SOURCE full markdown fence after '+name).not.toBeNull();
    blocks[name]=match[2].replace(/\{\{(TASK_ID|TASK_ROOT|WORKTREE_ROOT)\}\}/g,(_all,key)=>bindings[key]);
    expect(blocks[name]).not.toMatch(/\{\{[^}]+\}\}/);
  }
  return {spec:blocks.spec,index:blocks.index,phases:{[phase1]:blocks['phase-behavior'],[phase2]:blocks['phase-document']}};
}
const env=()=>{const value={...process.env};for(const key of Object.keys(value))if(key.startsWith('GIT_'))delete value[key];return value;};
const git=(cwd,...args)=>execFileSync('git',args,{cwd,env:env(),encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
async function fixture(change=()=>{},selected='P1') {
  examples(); // Check target before creating any fixture.
  const root=realpathSync(mkdtempSync(join(tmpdir(),'card05-author-consumer-')));roots.push(root);
  const repo=join(root,'repo'),wt=join(root,'worktree'),taskId='author-example-owned',taskDir=join(root,'Projects','workflowhub','tasks',taskId);
  mkdirSync(repo);mkdirSync(taskDir,{recursive:true});mkdirSync(join(root,'hooks'));
  git(repo,'init','-q','-b','main');git(repo,'config','user.name','Owned example oracle');git(repo,'config','user.email','oracle@example.invalid');git(repo,'config','commit.gpgsign','false');git(repo,'config','core.hooksPath',join(root,'hooks'));
  for(const path of owned){mkdirSync(dirname(join(repo,path)),{recursive:true});writeFileSync(join(repo,path),path.endsWith('.mjs')?'export const owned = true;\n':'# Owned\n');}
  git(repo,'add','.');git(repo,'commit','-qm','owned baseline');git(repo,'worktree','add','-q','-b','task/workflowhub/'+taskId,wt,'main');
  const materials=examples({TASK_ID:taskId,TASK_ROOT:taskDir,WORKTREE_ROOT:wt});change(materials);
  const materialRoot=join(wt,'specs',taskId);mkdirSync(join(materialRoot,'phases'),{recursive:true});
  writeFileSync(join(materialRoot,'decision-log.md'),'## 任务身份\n\n- **任务类型**：普通任务\n');
  for(const[path,bytes]of Object.entries({'spec.md':materials.spec,'phases/index.md':materials.index,...materials.phases}))writeFileSync(join(materialRoot,path),bytes+'\n');
  git(wt,'add','specs');git(wt,'commit','-qm','owned complete author materials');
  writeFileSync(join(taskDir,'task.json'),JSON.stringify({schema_version:'1.0.0',project_name:'workflowhub',task_id:taskId,target_repo_root:repo,record_model:'vnext-single-write',activation_cohort:'post',workspace_mode:'existing',workspace_root:wt}));
  writeFileSync(join(taskDir,'facts.jsonl'),'');
  writeFileSync(join(wt,owned[0]),'export const owned = false;\n');writeFileSync(join(wt,owned[1]),'# Owned documentation changed\n');writeFileSync(join(wt,'outside.md'),'OUTSIDE-PHASE-MUST-NOT-LEAK\n');
  const task=openTask(taskDir,{projectName:'workflowhub',taskId}),workspace=await openCurrentTaskWorkspace(task);
  const context={task,manifest:task.manifest,workspace,artifacts:ArtifactDir.open(wt,task)},attachmentRoot=join(root,'attachments');mkdirSync(attachmentRoot);
  const parsed=validatePostPhaseContract(materials);
  const bundle=()=>prepareTaskBoundBuildCodeReviewBundle(context,{stage:'build-code',review_scope:'phase',subject_kind:'phase',phase_id:selected,surface:'document',materials:{approved_spec:materials.spec,acceptance_criteria:'AC-EXAMPLE-001 and AC-EXAMPLE-002: structural consumer check only',test_evidence:'not executed: construction-only consumer test'}},{loadConfig:()=>({attachmentRoot})});
  return {materials,parsed,bundle};
}
function sourceFacts(bundle) {
  expect(bundle.manifest.some(entry=>entry.path==='source.json')).toBe(true);
  const disk=JSON.parse(readFileSync(join(bundle.bundleRoot,'source.json'),'utf8'));
  expect(disk.contract_facts).toBeDefined();return disk.contract_facts;
}
function field(materials,path,name,replacement) {
  const prefix='- **'+name+'**',lines=materials.phases[path].split('\n'),indexes=lines.map((line,index)=>line.startsWith(prefix)?index:-1).filter(index=>index>=0);
  expect(indexes,'negative fixture requires exactly one author field '+name).toHaveLength(1);
  lines[indexes[0]]='- **'+name+'**：'+replacement;materials.phases[path]=lines.join('\n');
}
test('ORACLE-P11-AUTHOR-SOURCE complete spec/index/behavior/G2 examples bind parser and real source.json',async()=>{
  const f=await fixture();expect(f.parsed.errors,'complete author materials are consumable without test repairs').toEqual([]);expect(f.parsed.ok).toBe(true);
  expect(f.parsed.facts.phase_rows.map(row=>({id:row.id,path:row.path,write_set:row.write_set,task_ids:row.task_ids}))).toEqual([{id:'P1',path:phase1,write_set:['src/owned.mjs'],task_ids:['T001']},{id:'P2',path:phase2,write_set:['docs/owned.md'],task_ids:['T002']}]);
  const bundle=f.bundle();try{
    const facts=sourceFacts(bundle);expect(facts.contract_ok).toBe(true);expect(facts.contract_error_count).toBe(0);
    // Independent literals come from the agreed two-example contract, not the parser.
    const expectedAc={accepted_count:2,covered_count:2,accepted_ids:['AC-EXAMPLE-001','AC-EXAMPLE-002'],covered_ids:['AC-EXAMPLE-001','AC-EXAMPLE-002'],deferred_ids:[]};
    const expectedFr={accepted_count:2,covered_count:2,accepted_ids:['FR-EXAMPLE-001','FR-EXAMPLE-002'],covered_ids:['FR-EXAMPLE-001','FR-EXAMPLE-002']};
    for(const actual of [facts,f.parsed.facts]){expect(actual.ac_coverage).toEqual(expectedAc);expect(actual.fr_coverage).toEqual(expectedFr);expect(actual.command_oracle_checks).toEqual({valid:true});}
    const trace=f.materials.spec.split('\n').filter(line=>/^\s*\|/.test(line)&&/R-00[12]/.test(line)).map(line=>line.split('|').slice(1,-1).map(cell=>cell.replaceAll(String.fromCharCode(96),'').trim()).slice(0,5));
    expect(trace).toEqual([['R-001','FR-EXAMPLE-001','AC-EXAMPLE-001','P1/T001','ORACLE-EXAMPLE-BEHAVIOR'],['R-002','FR-EXAMPLE-002','AC-EXAMPLE-002','P2/T002','ORACLE-EXAMPLE-DOCUMENT']]);
    const diff=readFileSync(join(bundle.bundleRoot,'changes.diff'),'utf8');expect(diff).toContain('src/owned.mjs');expect(diff).not.toContain('docs/owned.md');expect(diff).not.toContain('OUTSIDE-PHASE-MUST-NOT-LEAK');
  }finally{bundle.dispose();}
});
test.each([
  ['missing source',(m)=>field(m,phase1,'Source / FR / AC','FR-EXAMPLE-001 / AC-EXAMPLE-001'),/Source \/ FR \/ AC must bind original source/],
  ['missing AC',(m)=>field(m,phase1,'Source / FR / AC','R-001 / FR-EXAMPLE-001'),/AC has no executable Phase task coverage|Source \/ FR \/ AC must bind/],
  ['wrong oracle',(m)=>field(m,phase1,'GREEN oracle','ORACLE-WRONG; expected visible result'),/RED oracle must match GREEN oracle/],
])('ORACLE-P11-AUTHOR-FACTS %s becomes false facts without blocking selected Phase',async(_name,change,signature)=>{
  const f=await fixture(change);expect(f.parsed.ok).toBe(false);expect(f.parsed.errors.join('\n')).toMatch(signature);
  const bundle=f.bundle();try{const facts=sourceFacts(bundle);expect(facts.contract_ok).toBe(false);expect(facts.contract_errors.join('\n')).toMatch(signature);expect(readFileSync(join(bundle.bundleRoot,'changes.diff'),'utf8')).not.toContain('outside.md');}finally{bundle.dispose();}
});
test.each([['empty',''],['../outside.mjs','../outside.mjs']])('ORACLE-P11-AUTHOR-SCOPE %s keeps current MATERIAL_INCOMPLETE',async(_name,path)=>{
  const f=await fixture(m=>{field(m,phase1,'Write set','\u0060'+path+'\u0060');m.index=m.index.replace('src/owned.mjs',path);});
  expect(f.parsed.ok).toBe(false);expect(()=>f.bundle()).toThrow(/MATERIAL_INCOMPLETE/);
});
test('ORACLE-P11-AUTHOR-G2 mixed executable scope cannot use pure-document exception',async()=>{
  const f=await fixture(m=>{field(m,phase2,'Write set','\u0060docs/owned.md\u0060, \u0060src/owned.mjs\u0060');field(m,phase2,'Files / symbols','\u0060docs/owned.md\u0060, \u0060src/owned.mjs\u0060; symbol: owned');m.index=m.index.replace('`docs/owned.md`','`docs/owned.md`, `src/owned.mjs`');},'P2');
  expect(f.parsed.ok).toBe(false);expect(f.parsed.errors.join('\n')).toMatch(/documentation-only owned write set|G-2|RED.*nonzero/);
  const bundle=f.bundle();try{expect(sourceFacts(bundle).contract_ok).toBe(false);}finally{bundle.dispose();}
});

test.each([
  ['comment method','`config/method.yaml`（仅注释方法）',false],
  ['comma separated docs','`config/method.yaml`（仅注释方法）, `docs/owned.md`',false],
  ['Chinese separator and read anchor','`config/method.yaml`（仅注释方法）；只读锚点 runtime/publish.mjs:20',false],
  ['data fields','`config/method.yaml`（数据字段）',false],
  ['comma data conflict','`config/method.yaml`（仅注释方法）, 修改数据字段',false],
  ['semicolon data conflict','`config/method.yaml`（仅注释方法）；修改数据字段',false],
  ['unknown extra scope','`config/method.yaml`（仅注释方法）；调整其它内容',false],
  ['Chinese comma data conflict','`config/method.yaml`（仅注释方法），修改数据字段',false],
  ['unclassified','`config/method.yaml`',false],
  ['mixed executable','`config/method.yaml`（仅注释方法）, `src/owned.mjs`',false],
  ['other unclassified yaml','`config/method.yaml`（仅注释方法）, `config/other.yaml`',false],
  ['global comment claim','仅注释方法；`config/method.yaml`',false],
  ['same path data claim','`config/method.yaml`（仅注释方法）; `config/method.yaml`（数据字段）',false],
])('ORACLE-G2-YAML %s projects declaration facts through real source.json',async(_name,files,accepted)=>{
  const f=await fixture(m=>{
    m.phases[phase2]=m.phases[phase2].replaceAll('docs/owned.md','config/method.yaml');
    field(m,phase2,'Files / symbols',files+'; symbol: N/A — 非代码方法说明');
    const paths=[...files.matchAll(/`([^`]+)`/g)].map(match=>'`'+match[1]+'`').join(', ');
    field(m,phase2,'Write set',paths);m.index=m.index.replace('`docs/owned.md`',paths);
    m.spec=m.spec.replaceAll('docs/owned.md','config/method.yaml');
  },'P2');
  const bundle=f.bundle();try{
    const facts=sourceFacts(bundle);
    expect(f.parsed.ok,f.parsed.errors.join('\n')).toBe(accepted);
    expect(facts.contract_ok).toBe(accepted);
    if (['comment method','comma separated docs','Chinese separator and read anchor'].includes(_name)) {
      for (const errors of [f.parsed.errors,facts.contract_errors]) {
        expect(errors).toContain('phases/P2-文档核对.md T002 G-2 missing concrete documentation-only owned write set');
        expect(errors).toContain('phases/P2-文档核对.md T002 expected_exit must distinguish RED target failure from GREEN 0');
      }
      for (const actual of [f.parsed.facts,facts]) expect(actual.command_oracle_checks.valid).toBe(false);
    }
  }finally{bundle.dispose();}
});

test.each([
  ['Action','将 config/method.yaml 的 enabled 数据字段改为 false。',false],
  ['Outputs / failure','config/method.yaml 的 enabled 数据字段更新为 false；失败时保留错误。',false],
  ['Action','不修改数据字段，仅调整注释方法文字。',false],
])('ORACLE-G2-YAML cross-field %s declaration conflicts are projected',async(name,value,accepted)=>{
  const f=await fixture(m=>{
    m.phases[phase2]=m.phases[phase2].replaceAll('docs/owned.md','config/method.yaml');
    field(m,phase2,'Files / symbols','`config/method.yaml`（仅注释方法）; symbol: N/A — 非代码方法说明');
    field(m,phase2,name,value);
    m.index=m.index.replace('docs/owned.md','config/method.yaml');m.spec=m.spec.replaceAll('docs/owned.md','config/method.yaml');
  },'P2');
  const bundle=f.bundle();try{
    const facts=sourceFacts(bundle);
    expect(f.parsed.ok,f.parsed.errors.join('\n')).toBe(accepted);
    expect(facts.contract_ok).toBe(accepted);
    if (name === 'Action' && value === '不修改数据字段，仅调整注释方法文字。') {
      for (const errors of [f.parsed.errors,facts.contract_errors]) {
        expect(errors).toContain('phases/P2-文档核对.md T002 G-2 missing concrete documentation-only owned write set');
        expect(errors).toContain('phases/P2-文档核对.md T002 expected_exit must distinguish RED target failure from GREEN 0');
      }
      for (const actual of [f.parsed.facts,facts]) expect(actual.command_oracle_checks.valid).toBe(false);
    }
  }finally{bundle.dispose();}
});

// N3 current contract: G-2 exempts only owned .md paths; YAML remains legal
// under the ordinary behavioral RED/GREEN contract. These check material facts,
// not execution of the declared command or YAML business behavior.
test.each([
  ['pure .md G-2',false],
  ['ordinary YAML with RED nonzero and GREEN 0',true],
])('ORACLE-N3-G2-MD-ONLY %s retains parser and real source.json acceptance',async(_name,yamlBehavior)=>{
  const f=await fixture(m=>{
    if (!yamlBehavior) return;
    m.phases[phase2]=m.phases[phase2].replaceAll('docs/owned.md','config/method.yaml');
    m.index=m.index.replace('docs/owned.md','config/method.yaml');
    m.spec=m.spec.replaceAll('docs/owned.md','config/method.yaml');
    field(m,phase2,'expected_exit','RED nonzero; GREEN 0；正常行为合同，不申请G-2免RED。');
  },'P2');
  expect(f.parsed.ok,f.parsed.errors.join('\n')).toBe(true);
  expect(f.parsed.errors).toEqual([]);
  expect(f.parsed.facts.command_oracle_checks.valid).toBe(true);
  const bundle=f.bundle();try{
    const facts=sourceFacts(bundle);
    expect(facts.contract_ok).toBe(true);
    expect(facts.contract_errors).toEqual([]);
    expect(facts.command_oracle_checks.valid).toBe(true);
  }finally{bundle.dispose();}
});
