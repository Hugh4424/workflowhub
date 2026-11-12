import { mkdtempSync, realpathSync, rmSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runSimpleReview } from '../../skills/wh-review/scripts/simple-review-runner.mjs';
import { ReviewProviderClient } from '../../skills/wh-review/scripts/review-provider-client.mjs';
import { createTask } from '../../runtime/task/task-handle.mjs';
import { recordSimpleReviewRequest } from '../../runtime/review/review-record-route.mjs';
import { randomUUID } from 'node:crypto';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';
import YAML from 'js-yaml';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
const ROOT=resolve(import.meta.dirname,'../..');
function put(root,name,value){const path=join(root,name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,typeof value==='string'?value:JSON.stringify(value));return path;}

const roots=[];
afterEach(()=>{ for (const root of roots.splice(0)) rmSync(root,{recursive:true,force:true}); });
const input={stage:'make-decision',review_track:'direction',host_provider:'codex',materials:{raw_requirement:'Preserve usable review results.',research_context:'Research: one configured route fails while the sibling returns findings; source quality/evidence/research/report.md; known: sibling usable; unknown: retry behavior; conflict: none.',objective_facts:'One selected route fails.',convergence_outline:'Expose partial coverage honestly.',current_selection:'Keep the partial-coverage result.',alternatives:'Report only the successful route.',selection_rationale:'Partial coverage preserves the real failed source.',key_assumptions:'At least one provider returns usable findings.'}};
// Current transport fixture: complete prose, no historical marker or fake authority.
const postPhaseAuthority="# Phase P1\nphysical write set: src/app.mjs\n\n## Outcome and direct consumer\nThe application exposes one review subject containing the current plan and the physical Phase authority. The review provider consumes those bytes; it must not fetch a different source or substitute a pointer for the supplied authority.\n\n## Concrete work\nEdit the subject projection in src/app.mjs so the Phase member remains an independent attachment. Keep its relative member path and first heading unchanged. The execution index remains a pointer to that member. Preserve the acceptance and decision prose as separate submitted materials.\n\n## Verification\nExercise the real review runner with a controlled transport result. One selected provider returns a finding anchored on this first line; the sibling returns an explicit failure. Assert that the finding survives, the failed provider survives, and only the physically anchored material is reported read. Do not infer that the provider read the acceptance or the decision from mere delivery.\n\n## Failure and recovery\nChange the same finding to line 999. That location does not exist in this short authority, so the finding must be discarded and all submitted materials stay undetermined. A missing decision or incomplete new request must stop before transport. Restore the line and rerun the same consumer observation; do not change the parser or suppress the sibling failure.\n";
const postInput={stage:'build-plan',activation_cohort:'post',materials:{
  raw_requirement:'R-1: preserve the physical authority.',
  decision_baseline:"# Controlled fixture commitments\n\nThe accepted outcome is usable review advice with honest coverage when one selected source fails. A provider failure does not erase independently valid findings, and it cannot be represented as empty successful advice. This fixture supplies complete current-plan material rather than an old request marker.\n\nThe physical Phase is the authority for its implementation boundary. The execution index points to it and cannot replace its body. A finding at the actual Phase path and first line is direct evidence of that material being read; it does not certify the rest of the submission.\n\nKeep requirement prose, accepted decisions, specification and acceptance cases distinguishable. All are delivered as ordinary inline material. No hash object or repository reference in this request substitutes for content, and no provider is expected to access the host repository.\n\nWhen a provider cites a nonexistent line, preserve the output as a real failed anchor and keep every material undetermined for that source. Never make coverage appear complete by dropping the unobserved materials from its denominator. Keep the failed sibling explicit in the partial result.\n\nThis is transport test data. It makes no claim that a model discovered a real product defect, and its prose is not an alternative product decision authority.\n",
  draft_spec:"# Review-subject specification for the controlled fixture\n\nA caller sends the current decision excerpt, raw requirement, draft specification, acceptance criteria, physical Phase map and execution index to the existing review runner. The Phase map contains phases/P1.md as its sole physical member. Its first line names Phase P1 and its write-set line points to src/app.mjs.\n\nThe subject projection preserves every supplied body as provider-visible content. It emits the physical member at requirements/phases/P1.md and leaves the execution index as navigation. The code does not fetch a repository path from the index or interpret a nested descriptor as proof that a file was read.\n\nThe existing configured providers keep their identities. A controlled successful member returns one finding on the first line of the Phase; a second selected member fails with its original error. The combined advice retains that valid finding and the failure, with no completion verdict or fabricated repair.\n\nMaterial coverage comes from actual accepted finding anchors. The anchored Phase enters the read set; the raw requirement, decision baseline, draft specification, acceptance criteria and index remain undetermined. Delivery alone cannot move any of them into read.\n\nThe counterexample moves the finding to line 999. The normalized finding disappears because its anchor cannot be verified. Every submitted material remains in the undetermined set, including the decision baseline, and the failed member is still exposed. Neither example changes stage state.\n",
  acceptance_criteria:"# Acceptance of partial review coverage\n\nPositive case: invoke the actual review runner with this complete post request. The controlled transport returns an anchored finding from model-a and an explicit model-b failure. Observe available-with-failures, one retained logical finding at requirements/phases/P1.md, and the original provider failure. Do not assert a product pass from that status.\n\nThe successful provider's coverage contains exactly phase_authorities in read. Its unread set is empty because the transport did not declare unread material. The raw requirement, decision baseline, draft specification, acceptance criteria and execution index all remain undetermined. Keep each member in the denominator; a shorter expected array would hide unobserved input.\n\nNegative case: use the same request and response with the finding line changed to 999. That line is outside this Phase authority. The parser must retain no actionable finding, read must stay empty, and undetermined must equal all submitted material keys. The partial status and sibling failure remain real.\n\nNew-request boundary: remove decision_baseline or replace a required full body with a short placeholder. Transport must not be called and MATERIAL_MISSING must be observable. A historical marker must not be added to make this new fixture bypass the current contract.\n\nThese assertions test the actual runner and material projection with controlled outputs. They do not test model quality, business behavior or a browser, and the successful anchor does not establish full-plan coverage.\n",
  phase_authorities:{'phases/P1.md':postPhaseAuthority},
  phase_index:"## Execution Index\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1.md | phase-p1 | src/app.mjs | none | build-code |\n\n## Reading pointers\n- Current user need: raw_requirement is submitted as its own optional excerpt; it is context and remains unobserved until an actual anchor points to its body.\n- Accepted commitments: decision_baseline contains the controlled retention and coverage promises; this pointer never substitutes for that submitted body.\n- Global design: draft_spec describes the single physical Phase attachment and the existing review runner that consumes the submission.\n- Acceptance source: acceptance_criteria contains the positive anchored case, nonexistent-line counterexample, and new-request refusal boundary.\n- Physical implementation boundary: phases/P1.md is the only Phase authority. Its outcome, concrete edit, verification and recovery sections stay there.\n- Implementation consumer: src/app.mjs is the write target named by the Phase; this index does not duplicate its implementation instructions.\n- Result consumer: the partial review test reads the runner's normalized finding and coverage fields; raw provider failures are retained independently.\n- Evidence location: the controlled transport response is runtime input to the test, not a product report or a replacement Phase authority.\n",
}};
const postPhaseAuthorityFinding={severity:'minor',path:'requirements/phases/P1.md',line:1,issue:'The Phase authority needs an explicit consumer check.',recommendation:'Keep the physical Phase authority in the review packet.',evidence_kind:'direct',evidence:postPhaseAuthority};
function setup(client, extra={}) {
  const attachmentRoot=realpathSync(mkdtempSync(join(tmpdir(),'n11-review-'))); roots.push(attachmentRoot);
  return {loadConfig:()=>({whReview:{},config:'/unused/config.json',attachmentRoot,command:['unused']}),resolveRoute:()=>({initial:['model-a','model-b'],mode:'single_round'}),selectProviders:()=>({providers:['model-a','model-b'],provider_models:{'model-a':'model-a-model','model-b':'model-b-model'}}),client,...extra};
}
const success={provider:'model-a',status:'completed',identity:{provider:'model-a',model:'model-a-model'},output:JSON.stringify({findings:[]}),error:null,timing:null,usage:null};
const failure={provider:'model-b',status:'failed',identity:{provider:'model-b',model:'model-b-model'},error:{code:'PROVIDER_OUTPUT_INVALID',message:'controlled invalid response'},timing:null,usage:null};
const parseManaged=(envelope,context,method='statusManaged')=>new ReviewProviderClient({invoke:async()=>({stdout:JSON.stringify(envelope),stderr:'',exitCode:0})})[method](context);
function terminalEnvelope(context){
  const error={code:'CANCELLED',message:'controlled worker cancelled'};
  const providers=[{...success},{...failure,status:'cancelled',error}].map(item=>({provider:item.provider,status:item.status,error:item.error,output:item.output??null,usage:null,
    adapter:'controlled',model:`${item.provider}-model`,effort:null,thinking:null,runtime_id:context.runtimeId,material_id:context.materials.materialId,
    result_protocol:'workflowhub-result.v2',continuable:false,session_id:null,session_file_path:null,raw_output_ref:null,
    retry:{count:0,progress_events:0},timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},unavailable_diagnostics:item.error}));
  return {version:'workflowhub-run.v1',state:'terminal',runtime_id:context.runtimeId,request_id:context.requestId,material_id:context.materials.materialId,
    group:{version:4,host_provider:'dsh',runtime_id:context.runtimeId,outcome:'cancelled',round:0,selected_tier:null,providers}};
}

describe('ORACLE-N11-PARTIAL-REVIEW',()=>{
  it('keeps a usable semantic route partial in both direction roles',async()=>{
    const result=await runSimpleReview(input,setup({async runGroup(){return {runtimeId:'controlled-partial',outcome:'partial',providers:[success,failure]};}}));
    expect(result.status).toBe('available-with-failures');
    expect(result.pair_status).toBe('partial');
    expect(result.role_results.red.status).toBe('available-with-failures');
    expect(result.role_results.blue.status).toBe('available-with-failures');
    expect(result.provider_results).toHaveLength(2);
    expect(result.role_results.red.provider_results).toHaveLength(2);
    expect(result.role_results.blue.provider_results).toHaveLength(2);
    expect(result.provider_results.find(p=>p.provider==='model-a').material_coverage).toEqual({provider:'model-a',read:[],unread:[],undetermined:Object.keys(input.materials)});
  });
  it('keeps zero semantic routes unavailable',async()=>{
    const result=await runSimpleReview(input,setup({async runGroup(){return {runtimeId:'controlled-zero',outcome:'partial',providers:[{...failure,provider:'model-a',identity:success.identity},failure]};}}));
    expect(result.status).toBe('unavailable');
    expect(result.findings).toEqual([]);
  });
  it('ends managed cancellation locally and preserves the last settled route without another poll',async()=>{
    const controller=new AbortController(); let polls=0, cancelled=0, request;
    const providers=['model-a','model-b'];
    const options=setup({
      async startManaged(value){request=value;return {version:'workflowhub-run.v1',state:'running',runtime_id:'managed-cancel',request_id:value.requestId,material_id:value.materials.materialId};},
      async statusManaged(context){polls++;controller.abort();return parseManaged({version:'workflowhub-run.v1',state:'running',runtime_id:'managed-cancel',request_id:request.requestId,material_id:request.materials.materialId,providers:{'model-a':{status:'completed',last_progress_at_ms:1},'model-b':{status:'running',last_progress_at_ms:1}}},context);},
      async cancelManaged(context){cancelled++;return parseManaged(terminalEnvelope(context),context,'cancelManaged');},
    },{signal:controller.signal,managedStatusPollMs:0,selectProviders:()=>({providers,provider_models:{'model-a':'model-a-model','model-b':'model-b-model'},provider_identities:{'model-a':{source_id:'a',config_id:'a'},'model-b':{source_id:'b',config_id:'b'}}})});
    const result=await runSimpleReview({...input,pair_id:'controlled-pair',role:'red'},options);
    expect(result.status).toBe('available-with-failures');
    expect(polls).toBe(1);
    expect(cancelled).toBe(1);
    expect(result.provider_results.find(p=>p.provider==='model-a').parse_outcome).toBe('ok');
    expect(result.provider_results.find(p=>p.provider==='model-b').status).toBe('cancelled');
    expect(result.error.code).toBe('REVIEW_CANCELLED');
  });
  it('records cancellation with one semantic route and deduplicates only the top level',async()=>{
    const root=realpathSync(mkdtempSync(join(tmpdir(),'n11-record-'))); roots.push(root);
    const repo=join(root,'repo');mkdirSync(repo);
    const task=await createTask({storageRoot:root,manifest:{schema_version:'1.0.0',project_name:'workflowhub',task_id:randomUUID(),created_at:'2026-10-03T00:00:00Z',target_repo_root:repo,activation_cohort:'post',record_model:'vnext-single-write',execution_mode:'per_invocation',issue_ids:[],inputs:{}}});
    const controller=new AbortController(), member={...success,parse_outcome:'ok'};
    const role_results={red:{provider_results:[member,failure]},blue:{provider_results:[failure,member]}};
    const ref=await recordSimpleReviewRequest({taskDir:task.taskPath,request:{stage:'make-decision',review_track:'direction',materials:input.materials},signal:controller.signal,runRound:async()=>{controller.abort();return {status:'unavailable',provider_results:[failure,member,{...member}],findings:[],role_results};}});
    const record=JSON.parse(task.readRecord(ref.result_ref));
    expect(record.status).toBe('available-with-failures');
    expect(record.provider_results).toHaveLength(2);
    expect(record.role_results).toEqual(role_results);
    expect(record.error.code).toBe('REVIEW_CANCELLED');
  });
  it('retains anchored findings and reports only the evidenced material as read',async()=>{
    const finding={severity:'minor',path:'materials/01-raw_requirement.md',line:1,issue:'The stated requirement needs a failure path.',recommendation:'Retain the failure result.',evidence_kind:'direct',evidence:'Preserve usable review results.'};
    const result=await runSimpleReview(input,setup({async runGroup(){return {runtimeId:'anchored-partial',outcome:'partial',providers:[{...success,output:JSON.stringify({findings:[finding]})},failure]};}}));
    expect(result.status).toBe('available-with-failures');
    expect(result.findings).toEqual([expect.objectContaining({provider:'model-a',issue:finding.issue})]);
    expect(result.provider_results[0].material_coverage).toEqual({provider:'model-a',read:['raw_requirement'],unread:[],undetermined:['research_context','objective_facts','convergence_outline','current_selection','alternatives','selection_rationale','key_assumptions']});
  });
  it('maps an anchored post Phase authority finding to the top-level material coverage',async()=>{
    const result=await runSimpleReview(postInput,setup({async runGroup(){return {runtimeId:'post-authority-anchored',outcome:'partial',providers:[{...success,output:JSON.stringify({findings:[postPhaseAuthorityFinding]})},failure]};}}));
    expect(result.status).toBe('available-with-failures');
    expect(result.findings).toEqual([expect.objectContaining({path:postPhaseAuthorityFinding.path,issue:postPhaseAuthorityFinding.issue})]);
    expect(result.provider_results[0].material_coverage).toEqual({provider:'model-a',read:['phase_authorities'],unread:[],undetermined:['raw_requirement','decision_baseline','draft_spec','acceptance_criteria','phase_index']});
  });
  it('does not mark post Phase authorities read when the finding is not anchored',async()=>{
    const result=await runSimpleReview(postInput,setup({async runGroup(){return {runtimeId:'post-authority-unanchored',outcome:'partial',providers:[{...success,output:JSON.stringify({findings:[{...postPhaseAuthorityFinding,line:999}]})},failure]};}}));
    expect(result.status).toBe('available-with-failures');
    expect(result.findings).toEqual([]);
    expect(result.provider_results[0].material_coverage).toEqual({provider:'model-a',read:[],unread:[],undetermined:Object.keys(postInput.materials)});
  });
  it('keeps a preflight-blocked sibling explicitly unread and partial',async()=>{
    const options=setup({async runGroup(request){expect(request.providers).toEqual(['model-a']);return {runtimeId:'preflight-partial',outcome:'completed',providers:[success]};}},
      {providerPreflight:({provider})=>provider==='model-b'?{provider,status:'blocked',error:{code:'MODEL_ID_INVALID',message:'controlled selected model is unavailable'}}:{provider,status:'ready'}});
    const result=await runSimpleReview({...input,pair_id:'blocked-pair',role:'red'},options);
    expect(result.status).toBe('available-with-failures');
    const blocked=result.provider_results.find(p=>p.provider==='model-b');
    expect(blocked.status).toBe('failed');
    expect(blocked.material_coverage).toEqual({provider:'model-b',read:[],unread:Object.keys(input.materials),undetermined:[]});
  });
  it('reaps a real controlled worker on managed cancellation and preserves its settled sibling',async()=>{
    const child=spawn(process.execPath,['-e','process.stdout.write("worker-started\\n");setInterval(()=>{},1000)'],{stdio:['ignore','pipe','pipe']});
    const exited=once(child,'exit');await once(child.stdout,'data');
    const controller=new AbortController();let request,polls=0,exit;
    try{
      const options=setup({async startManaged(value){request=value;return {state:'running',runtime_id:'real-worker',request_id:value.requestId,material_id:value.materials.materialId};},
        async statusManaged(context){polls++;controller.abort();return parseManaged({version:'workflowhub-run.v1',state:'running',runtime_id:'real-worker',request_id:request.requestId,material_id:request.materials.materialId,providers:{'model-a':{status:'completed',last_progress_at_ms:1},'model-b':{status:'running',last_progress_at_ms:1}}},context);},
        async cancelManaged(context){child.kill('SIGTERM');exit=await exited;return parseManaged(terminalEnvelope(context),context,'cancelManaged');}},
        {signal:controller.signal,managedStatusPollMs:0,selectProviders:()=>({providers:['model-a','model-b'],provider_models:{'model-a':'model-a-model','model-b':'model-b-model'},provider_identities:{'model-a':{source_id:'a',config_id:'a'},'model-b':{source_id:'b',config_id:'b'}}})});
      const result=await runSimpleReview({...input,pair_id:'worker-pair',role:'red'},options);
      expect(result.status).toBe('available-with-failures');expect(polls).toBe(1);
      expect(exit).toEqual([null,'SIGTERM']);expect(()=>process.kill(child.pid,0)).toThrow();
      console.log(JSON.stringify({controlled_worker_pid:child.pid,exit_code:exit[0],signal:exit[1],polls,provider_model_execution:false}));
    }finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await exited;}}
  });
  it.each(['no-envelope','cancel-failed','wrong-request','wrong-runtime','wrong-material'])('keeps cancellation %s unavailable without inventing semantic results',async(mode)=>{
    const controller=new AbortController();let request,polls=0,health;
    const options=setup({async startManaged(value){request=value;return {version:'workflowhub-run.v1',state:'running',runtime_id:'negative-cancel',request_id:value.requestId,material_id:value.materials.materialId};},
      async statusManaged(context){polls++;controller.abort();health=await parseManaged({version:'workflowhub-run.v1',state:'running',runtime_id:context.runtimeId,request_id:context.requestId,material_id:context.materials.materialId,providers:{'model-a':{status:'completed',last_progress_at_ms:1,output:success.output},'model-b':{status:'running',last_progress_at_ms:1}}},context);return health;},
      async cancelManaged(context){
        if(mode==='cancel-failed')throw Object.assign(new Error('controlled cancellation failure'),{code:'BROKER_CANCEL_FAILED'});
        if(mode==='no-envelope')return {cancelled:true};
        const envelope=terminalEnvelope(context),field={'wrong-request':'request_id','wrong-runtime':'runtime_id','wrong-material':'material_id'}[mode];
        envelope[field]='wrong-identity';
        envelope.group.providers[0].output=JSON.stringify({findings:[{severity:'minor',path:'materials/01-raw_requirement.md',line:1,issue:'must be rejected',recommendation:'ignore wrong identity',evidence_kind:'direct',evidence:input.materials.raw_requirement}]});
        // Bypass only the final response parser here to exercise runner identity
        // binding against an untrusted injected cancel response. Status is real-parser health.
        return envelope;
      }},{signal:controller.signal,managedStatusPollMs:0});
    const result=await runSimpleReview({...input,pair_id:'negative-pair',role:'red'},options);
    expect(health.providers['model-a']).toEqual({status:'completed',error:null,last_progress_at_ms:1});
    expect(health.providers['model-a']).not.toHaveProperty('output');
    expect(result.status).toBe('unavailable');expect(result.findings).toEqual([]);expect(polls).toBe(1);
    expect(result.error.code).toBe('REVIEW_CANCELLED');
    if(mode==='cancel-failed')expect(result.error.message).toContain('BROKER_CANCEL_FAILED');
    if(mode.startsWith('wrong-')||mode==='no-envelope')expect(result.error.message).toContain('PROTOCOL_INCOMPATIBLE');
    expect(result.provider_results.some(member=>member.status==='completed'&&member.parse_outcome==='ok')).toBe(false);
  });
  it('preserves already recorded semantic opinions on cancellation without admitting identity-unauthenticated additions',async()=>{
    const root=realpathSync(mkdtempSync(join(tmpdir(),'n11-record-settled-')));roots.push(root);const repo=join(root,'repo');mkdirSync(repo);
    const task=await createTask({storageRoot:root,manifest:{schema_version:'1.0.0',project_name:'workflowhub',task_id:randomUUID(),created_at:'2026-10-03T00:00:00Z',target_repo_root:repo,activation_cohort:'post',record_model:'vnext-single-write',execution_mode:'per_invocation',issue_ids:[],inputs:{}}});
    const controller=new AbortController(),finding={provider:'model-a',severity:'minor',path:'README.md',line:1,issue:'already observed semantic opinion',recommendation:'retain original opinion',evidence_kind:'direct',evidence:'already observed source'};
    const member={...success,parse_outcome:'ok'};
    const ref=await recordSimpleReviewRequest({taskDir:task.taskPath,request:{stage:'make-decision',review_track:'direction',materials:input.materials},signal:controller.signal,runRound:async()=>{
      controller.abort();return {status:'unavailable',provider_results:[member,{...failure,identity_authenticated:false}],findings:[finding,{...finding,provider:'model-b',issue:'untrusted injected opinion'}],error:{code:'REVIEW_CANCELLED',message:'cancelled after semantic result'}};
    }});
    const record=JSON.parse(task.readRecord(ref.result_ref));
    expect(record.status).toBe('available-with-failures');expect(record.findings).toEqual([finding]);
    expect(record.provider_results.find(item=>item.provider==='model-a').parse_outcome).toBe('ok');
    expect(record.error.code).toBe('REVIEW_CANCELLED');
    // This is the recorder's existing semantic-result boundary. It does not
    // model a managed health envelope or prove public transport has prior output.
  });
});

function chainFixture(kinds=['requirements-index.md','coverage-matrix.md'], sections=true){
  const root=realpathSync(mkdtempSync(join(tmpdir(),'n11-ring-')));roots.push(root);
  const taskPath=join(root,'task'),materialRoot=join(root,'repo/specs/owned-task');
  put(taskPath,'task.json',{schema_version:'1.0.0',task_id:'owned-task',baseline_commit:'HEAD',target_repo_root:ROOT,activation_cohort:'post'});
  put(materialRoot,'decision-log.md',sections?'# Decision\n## 任务身份\nowned-task\n## 原始需求\n原需\n## 工作包与决定\n### D-001\n已确认\n## 未决项\n无真实未知\n':'# Missing sections');
  const evidence=kinds.map((kind,i)=>{
    const file=kind.startsWith('/')?kind:put(taskPath,'quality/evidence/'+kind,kind.includes('requirements')?'# 需求索引\n## R-001\n原始需求':'# 覆盖表\n| 来源 | 决定 |\n| R-001 | D-001 |');
    const ref='quality/tests/check-'+i+'.json';
    const argv=['node',join(ROOT,'tools/cli/check-decision-log-chain.mjs'),'--file',file];
    const executed=spawnSync(argv[0],argv.slice(1),{cwd:ROOT,encoding:'utf8'});
    const output_ref=put(taskPath,'quality/tests/check-'+i+'.output',executed.stdout+executed.stderr);
    put(taskPath,ref,{argv,cwd:ROOT,exit_code:0,signal:null,timed_out:false,cancelled:false,truncated:false,output_ref});
    return {command:argv.join(' '),exit_code:0,ref,receipt_ref:ref,output_ref};
  });
  put(taskPath,'facts.jsonl',JSON.stringify({record_kind:'stage',task_id:'owned-task',stage:'make-decision',evidence:{value:evidence,reason:'Controlled command receipts, not real model execution.'}})+'\n');
  return {taskPath,materialRoot};
}
describe('ORACLE-N11-TEN-RINGS',()=>{
  it('consumes both actual checkpoint scan profiles for ring two',()=>{
    const result=runFinalChainCheck(chainFixture()),ring=result.rings.find(r=>r.ring===2);
    expect(ring.state).toBe('completed');
    expect(JSON.stringify(ring.basis)).toContain('requirements-index.md');
    expect(JSON.stringify(ring.basis)).toContain('coverage-matrix.md');
    expect(result.rings).toHaveLength(10);
  });
  it('keeps one scan incomplete, no scans unavailable, outside paths unavailable and missing sections incomplete',()=>{
    const state=f=>runFinalChainCheck(f).rings.find(r=>r.ring===2).state;
    expect(state(chainFixture(['requirements-index.md']))).toBe('incomplete');
    expect(state(chainFixture([]))).toBe('unavailable');
    expect(state(chainFixture(['/etc/passwd']))).toBe('unavailable');
    expect(state(chainFixture(undefined,false))).toBe('incomplete');
  });
});

describe('P5 OCR regression oracles',()=>{
  it.each([null,undefined])('retains protocol failure for missing cancellation response %s',async(response)=>{
    const controller=new AbortController();
    const options=setup({async startManaged(request){controller.abort();return {version:'workflowhub-run.v1',state:'running',runtime_id:'missing-response',request_id:request.requestId,material_id:request.materials.materialId};},
      async statusManaged(){throw new Error('must not poll after cancellation');},async cancelManaged(){return response;}},{signal:controller.signal,managedStatusPollMs:0});
    const result=await runSimpleReview({...input,pair_id:'missing-response-pair',role:'red'},options);
    expect(result.status).toBe('unavailable');expect(result.findings).toEqual([]);
    expect(result.error.code).toBe('REVIEW_CANCELLED');expect(result.error.message).toContain('PROTOCOL_INCOMPATIBLE');
  });
  it('merges only evidenced red and blue coverage through the canonical recorder',async()=>{
    const finding=path=>({severity:'minor',path,line:1,issue:'bounded evidence '+path,recommendation:'retain evidence',evidence_kind:'direct',evidence:'submitted material'});
    const result=await runSimpleReview(input,setup({async runGroup(request){return {runtimeId:'role-coverage',outcome:'partial',providers:[{...success,output:JSON.stringify({findings:[finding(request.role==='red'?'materials/01-raw_requirement.md':'materials/03-objective_facts.md')]})},failure]};}}));
    const expected={provider:'model-a',read:['raw_requirement','objective_facts'],unread:[],undetermined:['research_context','convergence_outline','current_selection','alternatives','selection_rationale','key_assumptions']};
    expect(result.provider_results[0].material_coverage).toEqual(expected);
    expect(result.role_results.red.provider_results[0].material_coverage.read).toEqual(['raw_requirement']);
    expect(result.role_results.blue.provider_results[0].material_coverage.read).toEqual(['objective_facts']);
    const root=realpathSync(mkdtempSync(join(tmpdir(),'n11-coverage-record-')));roots.push(root);const repo=join(root,'repo');mkdirSync(repo);
    const task=await createTask({storageRoot:root,manifest:{schema_version:'1.0.0',project_name:'workflowhub',task_id:randomUUID(),created_at:'2026-10-03T00:00:00Z',target_repo_root:repo,activation_cohort:'post',record_model:'vnext-single-write',execution_mode:'per_invocation',issue_ids:[],inputs:{}}});
    const ref=await recordSimpleReviewRequest({taskDir:task.taskPath,request:{stage:'make-decision',review_track:'direction',materials:input.materials},runRound:async()=>result});
    expect(JSON.parse(task.readRecord(ref.result_ref)).material_coverage[0]).toEqual(expected);
  });
  it.each(['unsigned','changed-input','source-mismatch','conflicting'])('does not certify an execution with %s signature',mode=>{
    const f=chainFixture();
    const output=join(f.taskPath,'quality/tests/check-0.output');
    if(mode==='changed-input')writeFileSync(join(f.taskPath,'quality/evidence/requirements-index.md'),'# 需求索引\nChanged after scanner execution.');
    else {const rows=readFileSync(output,'utf8').split('\n');if(mode==='conflicting')rows.push(rows.find(line=>line.startsWith('[check-decision-log-chain] scanned ')));writeFileSync(output,rows.map(line=>{if(!line.startsWith('[check-decision-log-chain] scanned '))return line;if(mode==='unsigned')return '';if(mode==='conflicting')return line;const value=JSON.parse(line.slice('[check-decision-log-chain] scanned '.length));value.checker_sha256='0'.repeat(64);return '[check-decision-log-chain] scanned '+JSON.stringify(value);}).join('\n'));}
    expect(runFinalChainCheck(f).rings.find(row=>row.ring===2).state).toBe('unavailable');
  });
  it('keeps newest checkpoint pair ahead of older failed scans',()=>{
    const f=chainFixture(),fact=JSON.parse(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')),old=structuredClone(fact.evidence.value[0]);
    old.ref=old.receipt_ref='quality/tests/old-failed.json';old.exit_code=1;
    const receipt=JSON.parse(readFileSync(join(f.taskPath,'quality/tests/check-0.json'),'utf8'));receipt.exit_code=1;put(f.taskPath,old.ref,receipt);
    fact.evidence.value.unshift(old);put(f.taskPath,'facts.jsonl',JSON.stringify(fact)+'\n');
    const ring=runFinalChainCheck(f).rings.find(row=>row.ring===2);
    expect(ring.state).toBe('completed');expect(JSON.stringify(ring.basis)).not.toContain('old-failed.json');
  });
  it('does not promote a failed role claimed read to evidenced coverage',async()=>{
    const result=await runSimpleReview(input,setup({async runGroup(request){const failed=request.role==='red';return {runtimeId:'coverage-negative',outcome:failed?'partial':'completed',providers:[failed?{...failure,provider:'model-a',identity:success.identity,material_coverage:{provider:'model-a',read:['objective_facts'],unread:[],undetermined:[]}}:{...success,output:JSON.stringify({findings:[{severity:'minor',path:'materials/01-raw_requirement.md',line:1,issue:'real anchor',recommendation:'retain',evidence_kind:'direct',evidence:'real source'}]})},failure]};}}));
    expect(result.provider_results[0].material_coverage).toEqual({provider:'model-a',read:['raw_requirement'],unread:[],undetermined:['research_context','objective_facts','convergence_outline','current_selection','alternatives','selection_rationale','key_assumptions']});
    expect(result.role_results.red.provider_results[0].status).toBe('failed');
  });
  it('keeps latest failure and identifies its actual checkpoint input, without falling back to old success',()=>{
    const f=chainFixture(),fact=JSON.parse(readFileSync(join(f.taskPath,'facts.jsonl'),'utf8')),latest=structuredClone(fact.evidence.value[0]);
    latest.ref=latest.receipt_ref='quality/tests/latest-failed.json';latest.exit_code=1;
    const receipt=JSON.parse(readFileSync(join(f.taskPath,'quality/tests/check-0.json'),'utf8'));receipt.exit_code=1;put(f.taskPath,latest.ref,receipt);
    fact.evidence.value.push(latest);put(f.taskPath,'facts.jsonl',JSON.stringify(fact)+'\n');
    const ring=runFinalChainCheck(f).rings.find(row=>row.ring===2),basis=JSON.stringify(ring.basis);
    expect(ring.state).toBe('incomplete');expect(basis).toContain('latest-failed.json');expect(basis).toContain('requirements-index.md');expect(basis).not.toContain('decision-log.md');
  });
  it.each(['empty','read-failed'])('does not emit scanned execution facts for %s input',mode=>{
    const root=realpathSync(mkdtempSync(join(tmpdir(),'n11-scan-empty-')));roots.push(root);const file=join(root,'input.md');if(mode==='empty')writeFileSync(file,'');
    const result=spawnSync(process.execPath,[join(ROOT,'tools/cli/check-decision-log-chain.mjs'),'--file',file],{cwd:ROOT,encoding:'utf8'});
    expect(result.stdout).not.toContain('[check-decision-log-chain] scanned ');expect(result.status).toBe(mode==='empty'?0:1);
  });

});

const adoptionNames=['n1-observability-and-instrumentation','n1-performance-optimization','n1-explain-the-number','n2-security-and-hardening','n2-using-agent-skills','n2-setup-pstack','n2-poteto-help','n2-make-operations-idempotent','n2-type-system-discipline','n2-boundary-discipline','n2-experience-first'];
function registryErrors(bytes){
  const catalog=YAML.load(bytes),errors=[];
  for(const name of adoptionNames){
    const entry=catalog.capability_decisions.find(d=>d.name===name);
    if(!entry){if(!bytes.includes('# '+name+' not_backfilled: missing=upstream.commit; owner=wh-review/catalog maintainer; impact='))errors.push(name+': registration or named missing coordinate');continue;}
    for(const key of ['purpose','design_idea','local_path','local_changes','update_policy'])if(!entry[key])errors.push(name+': '+key);
    if(entry.status!=='absorbed'||!Array.isArray(entry.used_by_stages))errors.push(name+': status/stages');
    for(const source of entry.upstream??[])if(!/^[a-f0-9]{40}$/.test(source.commit??'')||!source.license||!source.github_url)errors.push(name+': upstream');
    if(!entry.upstream?.length)errors.push(name+': upstream');
    for(const file of String(entry.local_path??'').split(';')){try{readFileSync(join(ROOT,file.trim()));}catch{errors.push(name+': consumer');}}
  }
  return errors;
}
describe('ORACLE-N11-REGISTRY-CONCLUSION',()=>{
  it('accounts for all eleven existing adoptions with complete registration or a named missing commit',()=>{
    expect(registryErrors(readFileSync(join(ROOT,'skills/catalog.yaml'),'utf8'))).toEqual([]);
  });
  it('rejects missing commit, license and nonexistent consumer in copied registration bytes',()=>{
    const bytes=readFileSync(join(ROOT,'skills/catalog.yaml'),'utf8'),catalog=YAML.load(bytes);
    const entry=catalog.capability_decisions.find(d=>d.name==='n1-observability-and-instrumentation');
    expect(entry).toBeDefined();
    for(const change of [e=>delete e.upstream[0].commit,e=>delete e.upstream[0].license,e=>e.local_path='missing-n11-consumer.md']){
      const copy=structuredClone(catalog),target=copy.capability_decisions.find(d=>d.name===entry.name);change(target);
      expect(registryErrors(YAML.dump(copy))).toContain(entry.name+': '+(target.local_path==='missing-n11-consumer.md'?'consumer':'upstream'));
    }
  });
});
