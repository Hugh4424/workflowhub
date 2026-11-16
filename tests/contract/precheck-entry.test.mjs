import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTrackedTempDir } from '../../runtime/interface/temp-dir.mjs';
import { prepareTaskBoundBuildCodeReviewBundle, stageRuntimeCliMain, stageRuntimeMain } from '../../tools/cli/stage-runtime.mjs';
import { PACKET_SOURCE_PREFIX, loadTrustedThirdReviewConfig } from '../../skills/wh-review/scripts/third-review-host-config.mjs';
const fixtures=[];
afterEach(()=>{vi.unstubAllEnvs();for(const f of fixtures.splice(0).reverse())f.dispose();});
function fixture(){const f=createTrackedTempDir('wh-c10-xdg-test-');fixtures.push(f);const home=path.join(f.path,'home'),xdg=path.join(f.path,'xdg');fs.mkdirSync(home);fs.mkdirSync(path.join(xdg,'workflowhub'),{recursive:true});vi.stubEnv('HOME',home);vi.stubEnv('XDG_CONFIG_HOME',xdg);return{root:f.path,home,xdg,host:path.join(xdg,'workflowhub','config.json')};}
describe('ORACLE-SAFE-ONBOARD actual host-config caller seam',()=>{
  it('forwards the XDG hostConfigPath at the actual build-code review bundle call',()=>{
    const f=fixture(), stop=new Error('STOP_AFTER_OBSERVED_CONFIG_CALL');let observed;
    const context={task:{taskPath:path.join(f.root,'task'),identity:{taskId:'c10-config-fixture'}},workspace:{worktreeRoot:f.root}};
    expect(()=>prepareTaskBoundBuildCodeReviewBundle(context,{stage:'build-code',review_scope:'phase',phase_id:'P2'},
      {loadConfig(options){observed=options;throw stop;}})).toThrow(stop);
    // The injected observer terminates before any source capture/provider call.
    // The expectation is the documented XDG location, not a value derived from the production caller.
    expect(observed,'actual caller must bind the unique XDG path').toMatchObject({hostConfigPath:f.host,requestedStage:'build-code'});
  });
  it('portable loader accepts an explicit complete host structure while bare default remains HOME scoped',()=>{
    const f=fixture(), packet=path.join(f.root,'packets'),runtime=path.join(f.root,'broker-runtime'),broker=path.join(f.root,'broker.json');
    fs.mkdirSync(packet);fs.mkdirSync(runtime);
    fs.writeFileSync(broker,JSON.stringify({version:4,tiers:[['codex']],runtime:{root:runtime},providers:{codex:{enabled:true,source_id:'fixture-codex',model:'fixture-model'}},attachment_roots:[{root:packet,sources:[PACKET_SOURCE_PREFIX]}]}));
    fs.writeFileSync(f.host,JSON.stringify({task_dir:f.root,third_review:{command:[process.execPath,'/fixture/broker.mjs'],config:broker,attachment_root:packet},wh_review:{version:2,stages:{'build-code':{initial:['codex'],mode:'full_only'}}}}));
    const trusted=loadTrustedThirdReviewConfig({hostConfigPath:f.host,requestedStage:'build-code'});
    expect(trusted.config).toBe(broker);expect(trusted.attachmentRoot).toBe(packet);
    expect(()=>loadTrustedThirdReviewConfig()).toThrow();
    const bytes=fs.readFileSync(f.host),bad=JSON.parse(bytes);delete bad.third_review.attachment_root;
    fs.writeFileSync(f.host,JSON.stringify(bad));
    expect(()=>loadTrustedThirdReviewConfig({hostConfigPath:f.host,requestedStage:'build-code'})).toThrow();
  });
});

// --- actual dispatch entry: a missing unique user config is named before any
// OCR/provider dispatch, and unrelated doctor/status entries keep working. ---
function git(cwd,args){const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];env.GIT_OPTIONAL_LOCKS='0';return execFileSync('git',args,{cwd,env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
function taskFixture(){
  const root=fs.realpathSync(fs.mkdtempSync(path.join(process.env.TMPDIR ?? '/tmp','wh-c10-entry-')));
  fixtures.push({path:root,dispose(){fs.rmSync(root,{recursive:true,force:true});}});
  const repo=path.join(root,'repo');fs.mkdirSync(repo);
  git(repo,['init','-q','-b','main']);git(repo,['config','user.name','C10 entry fixture']);git(repo,['config','user.email','c10@workflowhub.local']);
  fs.writeFileSync(path.join(repo,'README.md'),'entry fixture\n');git(repo,['add','README.md']);git(repo,['commit','-qm','fixture']);
  const head=git(repo,['rev-parse','HEAD']);
  const taskId=`c10-entry-${Math.random().toString(16).slice(2)}`;
  const worktreeRoot=path.join(root,'worktree');
  git(repo,['worktree','add','-q','-b',`task/workflowhub/${taskId}`,worktreeRoot,'main']);
  const taskDir=path.join(root,'Projects','workflowhub','tasks',taskId);fs.mkdirSync(taskDir,{recursive:true});
  fs.writeFileSync(path.join(taskDir,'task.json'),JSON.stringify({schema_version:'1.0.0',record_model:'vnext-single-write',activation_cohort:'post',project_name:'workflowhub',task_id:taskId,created_at:'2026-11-16T00:00:00.000Z',target_repo_root:worktreeRoot,workspace_mode:'existing',workspace_root:worktreeRoot,baseline_commit:head,issue_ids:[],inputs:{}}));
  fs.writeFileSync(path.join(taskDir,'facts.jsonl'),'');
  const materialRoot=path.join(worktreeRoot,'specs',taskId);fs.mkdirSync(path.join(materialRoot,'phases'),{recursive:true});
  const gate='node node_modules/vitest/vitest.mjs run tests/contract/precheck-entry.test.mjs';
  const trace='| R-001 | FR-1 | AC-1 | P2/T002 | ORACLE-SAFE-ONBOARD |';
  fs.writeFileSync(path.join(materialRoot,'decision-log.md'),'# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n');
  fs.writeFileSync(path.join(materialRoot,'spec.md'),[
    '# C10 P2 entry fixture','- **FR-1**：safe onboarding contract.',
    '- [ ] **AC-1 — safe onboarding**','  - **需求**：FR-1','  - **验证方法**：actual assertions in the frozen entry test.',
    '  - **通过条件**：actual entry assertions pass.','  - **失败条件**：wrong diagnostics or dispatch.',
    '## 实现设计（全局权威）','### Code Anchors','The owned source is `README.md`.',
    '### Interfaces and Failure Semantics','Preserve current code surface and unavailable provider errors.',
    '### Requirement-to-Task Trace','| source | FR | AC | task | oracle |','| --- | --- | --- | --- | --- |',trace,
    '### Global Verification Strategy',gate,''].join('\n'));
  fs.writeFileSync(path.join(materialRoot,'phases','index.md'),[
    '# Phase index','## Execution Index',
    '| phase | authority ref | semantic anchor | write set | dependency | consumer |','| --- | --- | --- | --- | --- | --- |',
    '| `P1` | `phases/P1.md` | `phase-p1` | `fixture-p1.md` | none | C10 P2 fixture |',
    '| `P2` | `phases/P2.md` | `phase-p2` | `README.md` | P1 | C10 P2 fixture |',''].join('\n'));
  const p1Lines=[
    '# Phase P1 — owned fixture','- **Global spec**：`spec.md`','- **Write set**：`fixture-p1.md`','- **Dependency**：none',
    '- **Consumer**：C10 P2 fixture','## L0','- **gate_cmd**：'+gate,'- **expected_exit**：0 only after actual assertions pass',
    '- **oracle**：ORACLE-SAFE-ONBOARD','- **evidence_path**：quality/tests/entry-fixture.output',
    '- **STOP**：preserve an actual failure','- **Done**：actual assertions only, not production quality','## L1',
    '### T001 — owned entry fixture','- **Source / FR / AC**：R-001 / FR-1 / AC-1',
    '- **Files / symbols**：`fixture-p1.md` (symbol: N/A — fixture source text)','- **Action**：read the actual entry fixture',
    '- **Inputs**：owned Git and plain task metadata','- **Outputs / failure**：same code surface or observable unavailable',
    '- **Boundary / DO NOT TOUCH**：no production or user repositories','- **Dependency**：none',
    '- **Test tier / skill**：feature / backend-testing','- **Scenario / fixture or service**：owned CLI and injected OCR result',
    '- **RED/GREEN gate_cmd**：'+gate,'- **expected_exit**：RED nonzero; GREEN 0',
    '- **RED target failure**：ORACLE-SAFE-ONBOARD wrong entry diagnostic fails','- **GREEN oracle**：ORACLE-SAFE-ONBOARD actual assertions',
    '- **Evidence**：quality/tests/entry-fixture.output','- **STOP / recovery**：no claimed provider call without one',
    '- **Coverage limit**：no external provider quality','- **Done**：actual targeted assertions only','## L2',
    'Owned fixture data, not a WorkflowHub execution permit.',''].join('\n');
  fs.writeFileSync(path.join(materialRoot,'phases','P1.md'),p1Lines);
  fs.writeFileSync(path.join(materialRoot,'phases','P2.md'),[
    '# Phase P2 — owned fixture','- **Global spec**：`spec.md`','- **Write set**：`README.md`','- **Dependency**：none',
    '- **Consumer**：C10 P2 fixture','## L0','- **gate_cmd**：'+gate,'- **expected_exit**：0 only after actual assertions pass',
    '- **oracle**：ORACLE-SAFE-ONBOARD','- **evidence_path**：quality/tests/entry-fixture.output',
    '- **STOP**：preserve an actual failure','- **Done**：actual assertions only, not production quality','## L1',
    '### T002 — owned entry fixture','- **Source / FR / AC**：R-001 / FR-1 / AC-1',
    '- **Files / symbols**：`README.md` (symbol: N/A — fixture source text)','- **Action**：read the actual entry fixture',
    '- **Inputs**：owned Git and plain task metadata','- **Outputs / failure**：same code surface or observable unavailable',
    '- **Boundary / DO NOT TOUCH**：no production or user repositories','- **Dependency**：none',
    '- **Test tier / skill**：feature / backend-testing','- **Scenario / fixture or service**：owned CLI and injected OCR result',
    '- **RED/GREEN gate_cmd**：'+gate,'- **expected_exit**：RED nonzero; GREEN 0',
    '- **RED target failure**：ORACLE-SAFE-ONBOARD wrong entry diagnostic fails','- **GREEN oracle**：ORACLE-SAFE-ONBOARD actual assertions',
    '- **Evidence**：quality/tests/entry-fixture.output','- **STOP / recovery**：no claimed provider call without one',
    '- **Coverage limit**：no external provider quality','- **Done**：actual targeted assertions only','## L2',
    'Owned fixture data, not a WorkflowHub execution permit.',''].join('\n'));
  fs.appendFileSync(path.join(worktreeRoot,'README.md'),'entry fixture change\n');
  const home=path.join(root,'home'),xdg=path.join(root,'xdg');fs.mkdirSync(home);fs.mkdirSync(xdg,{recursive:true});
  vi.stubEnv('HOME',home);vi.stubEnv('XDG_CONFIG_HOME',xdg);vi.stubEnv('WORKFLOWHUB_TASK_DIR',root);
  return {root,taskId,taskDir,worktreeRoot,host:path.join(xdg,'workflowhub','config.json'),repo};
}
function reviewRequest(){return {stage:'build-code',review_scope:'phase',subject_kind:'phase',phase_id:'P2',surface:'code',
  materials:{approved_spec:'C10 P2 onboarding contract.',acceptance_criteria:'AC-C10-2 and AC-C10-009.',test_evidence:'Targeted contract tests only.'}};}
function writeHostConfig(f,{providersConfigPath,omitProvidersConfig=false}={}){
  const packets=path.join(f.root,'packets'),broker=path.join(f.root,'providers.json');
  fs.mkdirSync(packets,{recursive:true});
  fs.writeFileSync(broker,JSON.stringify({version:4,tiers:[['codex']],runtime:{root:f.root},providers:{'codex/luna':{enabled:true,source_id:'fixture-codex',model:'fixture-model',command:process.execPath}},attachment_roots:[{root:packets,sources:[PACKET_SOURCE_PREFIX]}]}));
  fs.mkdirSync(path.dirname(f.host),{recursive:true});
  fs.writeFileSync(f.host,JSON.stringify({task_dir:f.root,third_review:{command:[process.execPath],config:providersConfigPath??broker,attachment_root:packets},
    wh_review:{version:2,stages:{'build-code':{initial:['codex/luna'],mode:'full_only'}},non_stage:{}}}));
  return {broker,packets,configPath:providersConfigPath??broker,omitProvidersConfig};
}
function writeOcrStub(dir){
  fs.mkdirSync(dir,{recursive:true});
  const stub=path.join(dir,'ocr');
  fs.writeFileSync(stub,'#!/bin/sh\nif [ "$1" = "--version" ]; then\n  printf \'open-code-review v1.12.9 (test-stub) darwin/arm64\\n\'\n  exit 0\nfi\nexit 1\n',{mode:0o700});
  return dir;
}
function unavailableOcrResult(request,extra={}){
  return {status:'unavailable',stage:request.stage,review_track:null,review_kind:null,subject_kind:request.subject_kind,phase_id:request.phase_id??null,
    review_scope:request.review_scope??null,runtime_id:'ocr-unavailable-fixture',outcome:'unavailable',findings:[],dispatch_state:'dispatched',
    error:{code:'OCR_ALL_PROVIDERS_FAILED',message:'controlled OCR provider failure'},provider_results:[{
      provider:'codex/luna',status:'failed',process_outcome:'spawn_error',parse_outcome:null,
      identity:{provider:'codex/luna',adapter:'codex',source_id:'fixture/source',config_id:'fixture/config',model:'fixture-model'},
      error:{code:'OCR_PROVIDER_SPAWN_FAILED',message:'spawn codex ENOENT'},timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},usage:null,evidence_anchor_valid:[]}],...extra};
}
async function recordReview(f,services,inputPath){
  return stageRuntimeCliMain(['review','--action=record','--stage=build-code','--project=workflowhub',`--task=${f.taskId}`,`--task-path=${f.taskDir}`,`--input=${inputPath}`],{cwd:f.worktreeRoot,services});
}

describe('ORACLE-SAFE-ONBOARD real dispatch entry',()=>{
  it('names the missing unique config before OCR or provider dispatch',async()=>{
    const f=taskFixture();
    const inputPath=path.join(f.root,'review.json');fs.writeFileSync(inputPath,JSON.stringify({request:reviewRequest()}));
    const calls={ocr:0,whReview:0};
    const recorded=await stageRuntimeCliMain(['review','--action=record','--stage=build-code','--project=workflowhub',`--task=${f.taskId}`,`--task-path=${f.taskDir}`,`--input=${inputPath}`],{
      cwd:f.worktreeRoot,
      services:{runOcrDelegationRound:async()=>{calls.ocr+=1;throw new Error('OCR dispatch must not run when the user config is missing');},
        runReviewRound:async()=>{calls.whReview+=1;throw new Error('substitute executor must never run');}},
    });
    expect(calls).toEqual({ocr:0,whReview:0});
    expect(recorded.status).toBe('unavailable');
    expect(recorded.result_ref).toMatch(/^quality\/reviews\/.*build-code-phase-p2\.json$/);
    const review=JSON.parse(fs.readFileSync(path.join(f.taskDir,recorded.result_ref),'utf8'));
    expect(review).toMatchObject({status:'unavailable',dispatch_state:'blocked_before_dispatch',executor:'ocr',provider_results:[]});
    expect(review.error.code).toBe('ROUTE_UNAVAILABLE');
    expect(review.error.diagnostic).toMatchObject({field:'config',actual:'CONFIG_MISSING'});
    expect(review.error.diagnostic.next_action).toContain('config/workflowhub.config.template.json');
    // The recorded message stays host-path redacted; the named path and next
    // step remain visible in the structured diagnostic.
    expect(review.error.diagnostic.next_action).toContain(f.host);
    expect(String(review.error.message)).toContain('missing');
    expect(review).not.toHaveProperty('fallback');
    expect(fs.existsSync(f.host)).toBe(false);
  });
  it('names a missing 3rd-review config before OCR dispatch',async()=>{
    const f=taskFixture();writeHostConfig(f,{providersConfigPath:path.join(f.root,'absent-providers.json')});
    const inputPath=path.join(f.root,'review-provider.json');fs.writeFileSync(inputPath,JSON.stringify({request:reviewRequest()}));
    const calls={ocr:0,whReview:0};
    const recorded=await recordReview(f,{runOcrDelegationRound:async()=>{calls.ocr+=1;throw new Error('OCR dispatch must not run');},runReviewRound:async()=>{calls.whReview+=1;}},inputPath);
    expect(calls).toEqual({ocr:0,whReview:0});
    expect(recorded.status).toBe('unavailable');
    const review=JSON.parse(fs.readFileSync(path.join(f.taskDir,recorded.result_ref),'utf8'));
    expect(review.error.code).toBe('ROUTE_UNAVAILABLE');
    expect(review.error.diagnostic).toMatchObject({field:'provider_config',actual:'PROVIDER_CONFIG_NOT_FOUND'});
    expect(String(review.error.diagnostic.next_action)).toContain('absent-providers.json');
  });
  it('reports a missing OCR installation with the install source and verification step',async()=>{
    const f=taskFixture();writeHostConfig(f);
    const inputPath=path.join(f.root,'review-ocr.json');fs.writeFileSync(inputPath,JSON.stringify({request:reviewRequest()}));
    const previous=process.env.PATH;
    process.env.PATH=previous.split(':').filter((directory)=>{try{fs.accessSync(path.join(directory,'ocr'),fs.constants.X_OK);return false;}catch{return true;}}).join(':');
    try{
      const recorded=await recordReview(f,{runOcrDelegationRound:async()=>{throw new Error('OCR dispatch must not run');},runReviewRound:async()=>{throw new Error('substitute executor must never run');}},inputPath);
      const review=JSON.parse(fs.readFileSync(path.join(f.taskDir,recorded.result_ref),'utf8'));
      expect(review.error.code).toBe('OCR_NOT_INSTALLED');
      expect(String(review.error.diagnostic.next_action)).toMatch(/1\.12\.9/);
      expect(String(review.error.diagnostic.next_action)).toMatch(/ocr --version/);
    }finally{process.env.PATH=previous;}
  });
  it('reads the OCR host configuration from the same XDG path at the real dispatch (N3)',async()=>{
    const f=taskFixture();writeHostConfig(f);writeOcrStub(path.join(f.root,'ocr-bin'));
    const inputPath=path.join(f.root,'review-xdg-ocr.json');fs.writeFileSync(inputPath,JSON.stringify({request:reviewRequest()}));
    const previous=process.env.PATH;process.env.PATH=`${path.join(f.root,'ocr-bin')}:${previous}`;
    let observed=null;
    try{
      const recorded=await recordReview(f,{runOcrDelegationRound:async(request,options)=>{observed=options?.trustedContext??null;return unavailableOcrResult(request);},
        runReviewRound:async()=>{throw new Error('substitute executor must never run');}},inputPath);
      expect(observed).not.toBeNull();
      expect(recorded.status).toBe('unavailable');
      expect(observed.selection.providers).toEqual(['codex/luna']);
      const review=JSON.parse(fs.readFileSync(path.join(f.taskDir,recorded.result_ref),'utf8'));
      expect(review.error.code).toBe('OCR_ALL_PROVIDERS_FAILED');
    }finally{process.env.PATH=previous;}
  });
  it('adds a named provider/path/next-action diagnostic to a real provider spawn failure (N1)',async()=>{
    const f=taskFixture();const host=writeHostConfig(f);writeOcrStub(path.join(f.root,'ocr-bin'));
    const inputPath=path.join(f.root,'review-spawn.json');fs.writeFileSync(inputPath,JSON.stringify({request:reviewRequest()}));
    const previous=process.env.PATH;process.env.PATH=`${path.join(f.root,'ocr-bin')}:${previous}`;
    try{
      const recorded=await recordReview(f,{runOcrDelegationRound:async(request)=>unavailableOcrResult(request),
        runReviewRound:async()=>{throw new Error('substitute executor must never run');}},inputPath);
      const review=JSON.parse(fs.readFileSync(path.join(f.taskDir,recorded.result_ref),'utf8'));
      expect(review.error.code, JSON.stringify(review.error)).toBe('OCR_ALL_PROVIDERS_FAILED');
      expect(review.error.diagnostic).toMatchObject({field:'provider',config_path:host.configPath});
      expect(JSON.stringify(review.error.diagnostic)).toContain('codex/luna');
      expect(String(review.error.diagnostic.next_action)).toMatch(/install|repair/i);
    }finally{process.env.PATH=previous;}
  });

  it('does not echo invalid configuration content through the doctor entry',async()=>{
    const f=taskFixture();
    fs.mkdirSync(path.dirname(f.host),{recursive:true});
    fs.writeFileSync(f.host,"sk-live-DOCTOR-SECRET\n");
    let observed;
    try{await stageRuntimeMain(['doctor','--stage=build-code','--project=workflowhub',`--task=${f.taskId}`,`--task-path=${f.taskDir}`],{cwd:f.worktreeRoot});}
    catch(error){observed=error;}
    expect(observed).toBeDefined();
    const visible=String(observed.message);
    expect(visible).not.toContain('sk-live');
    expect(visible).not.toContain('SECRET');
    expect(visible).toContain(f.host);
    expect(visible).toMatch(/line|column|position/i);
  });
  it('keeps doctor and status available with the same missing review config',async()=>{
    const f=taskFixture();
    const doctor=await stageRuntimeMain(['doctor','--stage=build-code','--project=workflowhub',`--task=${f.taskId}`,`--task-path=${f.taskDir}`],{cwd:f.worktreeRoot});
    expect(doctor.task_id).toBe(f.taskId);
    expect(doctor.storage.selected_source).toBe('env');
    expect(doctor.ocr).toBeDefined();
    const status=await stageRuntimeMain(['status','--stage=build-code','--project=workflowhub',`--task=${f.taskId}`,`--task-path=${f.taskDir}`],{cwd:f.worktreeRoot});
    expect(status.task_id).toBe(f.taskId);
    expect(status.error).toBeUndefined();
    expect(status.quality_status).toBeDefined();
    expect(fs.existsSync(f.host)).toBe(false);
  });
});
