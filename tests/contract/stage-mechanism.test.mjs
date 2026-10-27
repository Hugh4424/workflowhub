import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FORMAL_DEVELOPMENT_STAGES, WORKFLOW_STAGES } from '../../runtime/stage/stage-registry.mjs';
import { readTaskFacts, writeStageRow } from '../../runtime/task/task-store.mjs';
import { closeConfirmationStage, prepareDeliveryClosePlan, confirmClosePlan, executeClosePlan } from '../../core/task-close.mjs';
import { evaluateRing } from '../../runtime/task/final-chain.mjs';
import { assertReviewIdentity } from '../../runtime/review/review-policy.mjs';
import { resolveTrustedReviewRoute } from '../../skills/wh-review/scripts/third-review-host-config.mjs';
import { execFileSync } from 'node:child_process';
import { bootstrapTask } from '../../tools/cli/task-bootstrap.mjs';
import { recordSimpleReviewRequest } from '../../runtime/review/review-record-route.mjs';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';
import * as registry from '../../runtime/stage/stage-registry.mjs';

const roots=[];
afterEach(()=>roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true})));
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
function history(stage='verify-code') {
  const root=realpathSync(mkdtempSync(join(tmpdir(),'p9-stage-history-')));roots.push(root);
  writeFileSync(join(root,'task.json'),JSON.stringify({project_name:'workflowhub',task_id:'owned-p9'}));
  writeFileSync(join(root,'facts.jsonl'),JSON.stringify({record_kind:'stage',task_id:'owned-p9',stage,source:'owned historical original'})+'\n');
  mkdirSync(join(root,'quality/evidence/human-confirmations'),{recursive:true});
  const confirmation=join(root,'quality/evidence/human-confirmations/original.json');
  writeFileSync(confirmation,JSON.stringify({stage:'verify-code',decision:'confirmed',reply:'Owned historical input',material_refs:['owned-plan','#owned-hash','#owned-remote']}));
  return {root,confirmation};
}
function terminalRing(extra={}) {
  return {ref:'quality/reviews/owned.json',evidence_type:'file_sha256',sha256:'a'.repeat(64),verified:true,readable:true,
    task_id:'owned-p9',stage:'build-code',review_scope:'terminal',subject_kind:'worktree',phase_id:null,review_kind:null,
    surface:'code',independent:true,current_scope:true,final:true,phase_reviews_verified:true,
    providers:[{provider:'codex/owned',status:'completed',parse_outcome:'ok',raw_ref:'owned.output',readable:true}],
    material_coverage:[{provider:'codex/owned',read:['owned.mjs'],unread:[],undetermined:[]}],...extra};
}
const ring=item=>evaluateRing({task_id:'owned-p9',rings:{9:item}},9,{value:'complex',declared:true});

async function cliFixture() {
  const root=realpathSync(mkdtempSync(join(tmpdir(),'p9-terminal-cli-')));roots.push(root);
  const repo=join(root,'repo'),storage=join(root,'storage'),home=join(root,'home'),bin=join(root,'bin'),attachments=join(root,'attachments');
  for(const dir of [repo,storage,home,bin,attachments])mkdirSync(dir);
  const hostDir=join(home,'.config/workflowhub');mkdirSync(hostDir,{recursive:true});
  const providers=join(root,'providers.json');
  writeFileSync(providers,JSON.stringify({tiers:[['codex/owned']],providers:{'codex/owned':{enabled:true,model:'owned-model',command:process.execPath}},attachment_roots:[{root:attachments,sources:['.wh-review-packets']}]}));
  writeFileSync(join(hostDir,'config.json'),JSON.stringify({task_dir:storage,third_review:{command:[process.execPath],config:providers,attachment_root:attachments},wh_review:{version:2,stages:{'build-code':{initial:['codex/owned'],mode:'full_only'}}}}));
  const env={...process.env,HOME:home,XDG_CONFIG_HOME:join(home,'.config'),WORKFLOWHUB_TASK_DIR:storage,PATH:bin+':'+process.env.PATH};
  for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];
  const git=args=>execFileSync('git',args,{cwd:repo,env,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  git(['init','-q','-b','main']);git(['config','user.name','Owned P9']);git(['config','user.email','owned@test.invalid']);
  writeFileSync(join(repo,'README.md'),'before first phase\n');git(['add','README.md']);git(['commit','-qm','base']);
  writeFileSync(join(bin,'ocr'),`#!${process.execPath}\nif(process.argv[2]==='--version')console.log('1.12.9');else process.exit(9);`,{mode:0o700});
  const bound=await bootstrapTask({project:'workflowhub',task:'p9-terminal','target-repo':repo},{env,home});
  const wt=bound.workspace.worktree_root,materialRoot=join(wt,'specs/p9-terminal');mkdirSync(join(materialRoot,'phases'),{recursive:true});
  writeFileSync(join(materialRoot,'decision-log.md'),'# Decision\n\n## 任务身份\n- **任务类型**：复杂任务\n');
  writeFileSync(join(materialRoot,'spec.md'),'# Owned complete specification\nAC-001: first and final implementation are both visible\n');
  writeFileSync(join(materialRoot,'phases/index.md'),'# Phase index\n');
  writeFileSync(join(wt,'README.md'),'after first and final phase\n');
  return {root,env,wt,taskDir:bound.task_path};
}
function publicTerminal(f,override={}) {
  const request={stage:'build-code',review_scope:'terminal',subject_kind:'worktree',phase_id:null,surface:'code',subject:{changed_files:['README.md']},
    materials:{changed_files:'README.md',acceptance_criteria:'AC-001: first and final implementation are visible',implementation_assessment:'Review the complete implementation',test_context:'Owned transport only; real CLI, host and packet',open_risks:'External OCR quality unobserved'},...override};
  const input=join(f.root,'input.json');writeFileSync(input,JSON.stringify({request}));
  const cli=new URL('../../tools/cli/stage-runtime.mjs',import.meta.url).href;
  const script=`import {stageRuntimeCliMain} from ${JSON.stringify(cli)};import {readFileSync} from 'node:fs';let seen=null;try{const result=await stageRuntimeCliMain(['review','--action=record','--stage=build-code','--project=workflowhub','--task=p9-terminal','--task-path='+process.argv[1],'--input='+process.argv[2]],{services:{runOcrDelegationRound:async(req,{bundle,trustedContext,onProviderOutput})=>{seen={request:req,mode:trustedContext.route.mode,manifest:bundle.manifest.map(e=>e.path)};await onProviderOutput({provider:'codex/owned',role:null,output:'{"findings":[]}'});return {status:'available',findings:[],ocr:{manifest:bundle.manifest},provider_results:[{provider:'codex/owned',status:'completed',parse_outcome:'ok',raw_output:'{"findings":[]}',material_coverage:{provider:'codex/owned',read:Object.keys(req.materials),unread:[],undetermined:[]},identity:{provider:'codex/owned',adapter:'codex',source_id:'owned-source',config_id:'owned-config',model:'owned-model'}}]};}}});process.stdout.write(JSON.stringify({result,seen,canonical:JSON.parse(readFileSync(result.path,'utf8'))}));}catch(error){process.stdout.write(JSON.stringify({seen,error:{code:error.code,message:error.message}}));}`;
  return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script,f.taskDir,input],{cwd:f.wt,env:f.env,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000}));
}

describe('ORACLE-STAGE-MECHANISM',()=>{
  it.each([false,true])('uses one complete terminal as the indexed last Phase review (single=%s), preserving earlier and explicit failed observations',async single=>{
    const f=await cliFixture(),mr=join(f.wt,'specs/p9-terminal'),ids=single?['P1']:['P1','P2'];
    const git=args=>execFileSync('git',args,{cwd:f.wt,env:f.env,stdio:['ignore','pipe','pipe']});
    if(!single)writeFileSync(join(f.wt,'EARLY.md'),'Earlier Phase actual change\n');
    const changed=single?['README.md']:['README.md','EARLY.md'];git(['add',...changed]);git(['commit','-qm','owned full delivery']);
    writeFileSync(join(mr,'phases/index.md'),'| phase | ref |\n| --- | --- |\n'+ids.map(id=>`| ${id} | \`phases/${id}.md\` |`).join('\n')+'\n');
    for(const [i,id]of ids.entries())writeFileSync(join(mr,`phases/${id}.md`),`# ${id}\n- **Write set**：\`${!single&&i===0?'EARLY.md':'README.md'}\`\n`);
    const phase=async(id,status='available')=>recordSimpleReviewRequest({taskDir:f.taskDir,request:{stage:'build-code',review_scope:'phase',subject_kind:'phase',phase_id:id,surface:'code',subject:{changed_files:[id==='P1'&&!single?'EARLY.md':'README.md']},materials:{approved_spec:'Owned actual Phase input'}},runRound:async()=>({status,findings:[],provider_results:status==='available'?[{provider:'codex/owned',status:'completed',parse_outcome:'ok',raw_output:'{"findings":[]}',material_coverage:{provider:'codex/owned',read:[],unread:[],undetermined:['approved_spec']}}]:[]})});
    const earlier=single?null:await phase('P1');
    const terminal=publicTerminal(f,{subject:{changed_files:changed}});expect(terminal.result?.status,JSON.stringify(terminal)).toBe('available');
    await writeStageRow(f.taskDir,{stage:'build-code',source:'One actual combined last-Phase terminal',review_origin:'conducted',review_result_ref:{value:terminal.result.result_ref}});
    const actual=()=>runFinalChainCheck({taskPath:f.taskDir,materialRoot:mr}).rings.find(row=>row.ring===9);
    expect(actual().state).toBe('completed');
    const terminalBytes=readFileSync(terminal.result.path),canonical=JSON.parse(terminalBytes);
    for(const patch of [{task_id:'foreign-task'},{provider_results:[]},{request:{...canonical.request,subject:{changed_files:['stale.mjs']}}},
      {ocr:{...canonical.ocr,manifest:canonical.ocr.manifest.filter(entry=>entry.path!=='README.md'&&!entry.path.endsWith('/README.md'))}}]){
      writeFileSync(terminal.result.path,JSON.stringify({...canonical,...patch}));expect(actual().state).toBe('unavailable');
    }
    writeFileSync(terminal.result.path,terminalBytes);
    if(earlier){const bytes=readFileSync(earlier.path);rmSync(earlier.path);expect(actual().state).toBe('unavailable');writeFileSync(earlier.path,bytes);}
    const lastFailure=await phase(ids.at(-1),'unavailable');expect(actual().state).toBe('unavailable');rmSync(lastFailure.path);
    expect(actual().state).toBe('completed');
  });
  it.each(['build-code','make-decision','build-plan'])('binds real close confirmation to its actual %s owner or a stored retired confirmation, never an unrelated stage',async stageOwner=>{
    const f=await cliFixture(),bare=join(f.root,'origin.git');mkdirSync(bare);
    const git=(cwd,args)=>execFileSync('git',args,{cwd,env:f.env,stdio:['ignore','pipe','pipe']});
    git(bare,['init','--bare','-q']);git(f.wt,['remote','add','origin',bare]);git(f.wt,['push','-q','origin','main']);
    if(stageOwner==='build-plan')writeFileSync(join(f.wt,'specs/p9-terminal/decision-log.md'),'# Decision\n## 任务身份\n- **任务类型**：规划任务\n');
    await writeStageRow(f.taskDir,{stage:stageOwner,source:'Owned current close identity'});
    const prepared=await prepareDeliveryClosePlan({taskDir:f.taskDir}),confirmed=await confirmClosePlan({taskDir:f.taskDir,planRef:prepared.plan_ref,replyText:'Owned temporary fixture approval only.'});
    const bytes=readFileSync(confirmed.confirmation_ref),record=JSON.parse(bytes),controller=new AbortController();controller.abort();
    const call=ref=>executeClosePlan({taskDir:f.taskDir,planRef:prepared.plan_ref,confirmationRef:ref,signal:controller.signal});
    expect((await call(confirmed.confirmation_ref)).status).toBe('cancelled');
    const legacyDir=join(f.taskDir,'quality/confirmations');mkdirSync(legacyDir,{recursive:true});
    const legacy=join(legacyDir,'owned-old-confirmation.json');writeFileSync(legacy,JSON.stringify({...record,stage:'verify-code'}));const old=readFileSync(legacy);
    expect((await call(legacy)).status).toBe('cancelled');expect(readFileSync(legacy)).toEqual(old);
    for(const stage of ['make-decision','build-plan','build-code','build-prd','unknown-stage'].filter(value=>value!==stageOwner)){
      const wrong=join(legacyDir,'wrong-'+stage+'.json');writeFileSync(wrong,JSON.stringify({...record,stage}));
      await expect.soft(call(wrong),stage).rejects.toMatchObject({code:'CONFIRMATION_REJECTED'});
    }
    const bad=join(legacyDir,'bad-plan-binding.json');writeFileSync(bad,JSON.stringify({...record,stage:'verify-code',material_refs:record.material_refs.map(ref=>ref.includes('#sha256=')?prepared.plan_ref+'#sha256='+'0'.repeat(64):ref)}));
    await expect(call(bad)).rejects.toMatchObject({code:'CONFIRMATION_PLAN_CHANGED'});
    expect(readFileSync(confirmed.confirmation_ref)).toEqual(bytes);
  });
  it('records a legal terminal through the public CLI, selected packet and trusted host mode',async()=>{
    const f=await cliFixture(),observed=publicTerminal(f);
    expect(observed.error).toBeUndefined();
    expect(observed.result?.status,JSON.stringify(observed)).toBe('available');
    expect(observed.seen).toMatchObject({mode:'single_round',request:{stage:'build-code',review_scope:'terminal',subject_kind:'worktree',phase_id:null}});
    expect(observed.seen.manifest).toContain('contracts/build-code.md');
    expect(observed.seen.manifest).not.toContain('contracts/verify-code.md');
    expect(observed.canonical).toMatchObject({review_scope:'terminal',subject_kind:'worktree',phase_id:null});
    const invalid=publicTerminal(f,{review_scope:'unknown'});expect(invalid.error).toBeDefined();expect(invalid.seen).toBe(null);
  });
  it('recovers two actual Phase review originals after the single build-code row points at terminal',async()=>{
    const f=await cliFixture(),mr=join(f.wt,'specs/p9-terminal');
    const git=args=>execFileSync('git',args,{cwd:f.wt,env:f.env,stdio:['ignore','pipe','pipe']});
    git(['add','README.md']);git(['commit','-qm','owned implementation']);
    writeFileSync(join(mr,'phases/index.md'),'| phase | ref |\n| --- | --- |\n| P1 | `phases/P1.md` |\n| P2 | `phases/P2.md` |\n');
    for(const id of ['P1','P2'])writeFileSync(join(mr,`phases/${id}.md`),`# ${id}\n- **Write set**：\`README.md\`\n`);
    const phase=async(id,status='available')=>recordSimpleReviewRequest({taskDir:f.taskDir,request:{stage:'build-code',review_scope:'phase',subject_kind:'phase',phase_id:id,surface:'code',subject:{changed_files:['README.md']},materials:{approved_spec:'Owned phase criteria'}},runRound:async()=>({status,findings:[],provider_results:status==='available'?[{provider:'codex/owned',status:'completed',parse_outcome:'ok',raw_output:'{"findings":[]}',material_coverage:{provider:'codex/owned',read:['approved_spec'],unread:[],undetermined:[]}}]:[]})});
    const p1=await phase('P1');const p2=await phase('P2');
    const terminal=publicTerminal(f);expect(terminal.result?.status,JSON.stringify(terminal)).toBe('available');
    await writeStageRow(f.taskDir,{stage:'build-code',source:'Owned terminal review',review_origin:'conducted',review_result_ref:{value:terminal.result.result_ref}});
    const actual=()=>runFinalChainCheck({taskPath:f.taskDir,materialRoot:mr}).rings.find(row=>row.ring===9);
    expect(actual().state).toBe('completed');
    const original=readFileSync(p2.path),earlyBytes=readFileSync(p1.path);rmSync(p1.path);expect(actual().state).toBe('unavailable');writeFileSync(p1.path,earlyBytes);
    const failed=await phase('P2','unavailable');expect(actual().state).toBe('unavailable');rmSync(failed.path);
    const foreign=JSON.parse(original);foreign.task_id='foreign-task';writeFileSync(p2.path,JSON.stringify(foreign));expect(actual().state).toBe('unavailable');
    for(const patch of [{provider_results:[]},{request:{...JSON.parse(original).request,subject:{changed_files:['outside-declared-scope.mjs']}}}]) {
      writeFileSync(p2.path,JSON.stringify({...JSON.parse(original),...patch}));expect(actual().state).toBe('unavailable');
    }
    writeFileSync(p2.path,original);expect(actual().state).toBe('completed');
    // A newer selected original must clear the prior successful observation before any read/JSON failure.
    const latest=await phase('P2'),latestBytes=readFileSync(latest.path);
    for(const malformed of ['{invalid selected Phase JSON','null']){writeFileSync(latest.path,malformed);expect.soft(actual().state).toBe('unavailable');}
    writeFileSync(latest.path,latestBytes);expect(actual().state).toBe('completed');
    rmSync(latest.path);symlinkSync(p2.path,latest.path);expect.soft(actual().state).toBe('unavailable');
    rmSync(latest.path);writeFileSync(latest.path,latestBytes);expect(actual().state).toBe('completed');
  });
  it('writes exactly three formal stages while retaining the independent planning route',()=>{
    expect(FORMAL_DEVELOPMENT_STAGES).toEqual(['make-decision','build-plan','build-code']);
    expect(WORKFLOW_STAGES).toEqual(['make-decision','build-plan','build-code','build-prd']);
    expect(()=>assertReviewIdentity({stage:'verify-code'})).toThrow();
    expect(registry.RETIRED_STAGE_VERIFY_CODE).toBe('verify-code');
    expect(WORKFLOW_STAGES).not.toContain(registry.RETIRED_STAGE_VERIFY_CODE);
  });
  it('rejects new retired stage rows but returns original historical facts without rewriting them',async()=>{
    const {root,confirmation}=history(),facts=readFileSync(join(root,'facts.jsonl')),original=readFileSync(confirmation);
    expect(readTaskFacts(root)).toMatchObject([{stage:'verify-code'}]);
    await expect(writeStageRow(root,{stage:'verify-code',source:'new rejected stage'})).rejects.toThrow(/stage/);
    expect(readFileSync(join(root,'facts.jsonl'))).toEqual(facts);
    expect(readFileSync(confirmation)).toEqual(original);
  });
  it('derives current close ownership from build-code without rejecting historical-only task facts',()=>{
    const current=history('build-code');expect(closeConfirmationStage(current.root)).toBe('build-code');
    const old=history();expect(()=>closeConfirmationStage(old.root)).not.toThrow();
    expect(readTaskFacts(old.root)[0].stage).toBe('verify-code');
  });
  it('selects the terminal effective mode using the existing build-code host route',()=>{
    const wh={stages:{'build-code':{initial:['codex/owned'],mode:'full_only'}}};
    expect(resolveTrustedReviewRoute(wh,'build-code',null,null,'terminal')).toMatchObject({mode:'single_round',initial:['codex/owned']});
    expect(resolveTrustedReviewRoute(wh,'build-code',null,null,'phase')).toMatchObject({mode:'full_only'});
    expect(()=>resolveTrustedReviewRoute(wh,'build-code',null,null,'unknown')).toThrow();
  });
  it('accepts terminal ring 9 only with the complete original identity and provider proof',()=>{
    expect(ring(terminalRing()).state).toBe('completed');
    for(const patch of [{current_scope:false},{phase_reviews_verified:false},{final:false},{task_id:'another-task'},
      {review_scope:'unknown'},{providers:[]},{material_coverage:[]},{providers:[{provider:'codex/owned',status:'completed',parse_outcome:'ok',raw_ref:'owned.output',readable:false}]}]) {
      expect(ring(terminalRing(patch)).state,JSON.stringify(patch)).toBe('unavailable');
    }
    expect(ring(terminalRing({review_scope:'phase',subject_kind:'phase',final:false})).state).toBe('unavailable');
  });
  it('removes retired writable matrix and schema entries while preserving terminal materials',()=>{
    const matrix=JSON.parse(read('runtime/review/stage-materials.json'));
    expect(Object.keys(matrix.stages)).toEqual(['make-decision','build-plan','build-code']);
    expect(matrix.stages['build-code'].profiles.terminal.required).toEqual(expect.arrayContaining(['changed_files','implementation_assessment','test_context','open_risks']));
    for(const path of ['runtime/review/schemas/result.schema.json','runtime/review/schemas/attempt.schema.json',
      'runtime/review/schemas/stage-materials.schema.json','runtime/schemas/human-confirmation.v1.schema.json','runtime/schemas/risk-acceptance.v1.json']) {
      expect(read(path),path).not.toContain('verify-code');
    }
  });
});
