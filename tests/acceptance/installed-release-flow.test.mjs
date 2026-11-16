import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTrackedTempDir} from '../../runtime/interface/temp-dir.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const taskRoot='/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103';
// T2: a copy root is only this run's when the tracked parent proves it (run-id
// in the marker prefix, creator pid = this process or its direct parent, recent
// creation). A same-uid sibling from an earlier attempt is a foreign root.
const RUN_ID='readback-scope';
const RUN_PREFIX='wh-c10-'+RUN_ID+'-';
function probe(copyRoot,{runId=RUN_ID}={}){const r=spawnSync(process.execPath,['tests/acceptance/c12-update-chain.mjs','prepare','--run-id='+runId,'--copy-root='+copyRoot,'--port=41924','--task-record-root='+taskRoot,'--p1-identity='+path.join(copyRoot,'intentionally-unavailable-original.json')],{cwd:root,encoding:'utf8',timeout:10000});assert.equal(r.error,undefined);const lines=r.stderr.trim().split('\n');return{...r,errorRecord:JSON.parse(lines.at(-1))};}
test('ORACLE-CROSS-TASK-READBACK actual prepare guard accepts C10-owned tracked root before probing source originals',()=>{
  const owned=createTrackedTempDir(RUN_PREFIX);try{const copy=path.join(owned.path,'carrier'),r=probe(copy);
    assert.notEqual(r.errorRecord.code,'E_COPY_ROOT_SCOPE','actual copy-root guard must accept the authenticated C10 tracked parent; source/readiness failures are separate');
    assert.equal(r.errorRecord.code,'E_P1_ORIGINALS','the scoped preflight must stop at the explicitly missing original before copy/service/evidence writes');
    assert.equal(fs.existsSync(copy),false);
  }finally{owned.dispose();}
});
test('ORACLE-CROSS-TASK-READBACK foreign root remains rejected before any side effect',()=>{
  const r=probe(path.join(root,'not-authorized-carrier'));
  assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');
  assert.equal(fs.existsSync(path.join(root,'not-authorized-carrier')),false);
});
test('C10 additive 094 T1 legacy 1280x800-only readback is rejected; the declared P6 pair is accepted', async()=>{
  const {validateP6ViewportCoverage}=await import('../../tests/acceptance/c12-update-chain.mjs');
  const legacy=validateP6ViewportCoverage([{viewport:'1280x800',status:'已取得'},{viewport:'390x844',status:'已取得'}]);
  assert.equal(legacy.ok,false);
  assert.deepEqual(legacy.missing,['1440x900']);
  assert.deepEqual(legacy.unexpected,['1280x800']);
  const half=validateP6ViewportCoverage([{viewport:'1440x900',status:'已取得'},{viewport:'390x844',status:'未测'}]);
  assert.equal(half.ok,false);
  assert.deepEqual(half.missing,['390x844']);
  const declared=validateP6ViewportCoverage([{viewport:'1440x900',status:'已取得'},{viewport:'390x844',status:'已取得'}]);
  assert.deepEqual(declared,{ok:true,required:['1440x900','390x844'],observed:['1440x900','390x844'],missing:[],unexpected:[]});
});
test('C10 additive 094 T2 stale same-uid tracked root is not this run and is never deleted',()=>{
  const owned=createTrackedTempDir(RUN_PREFIX);
  try{
    const marker=path.join(owned.path,'.workflowhub-temp.json'),value=JSON.parse(fs.readFileSync(marker));
    const carrier=path.join(owned.path,'carrier');fs.mkdirSync(carrier);
    const payload=path.join(carrier,'unchecked-payload.txt');fs.writeFileSync(payload,'keep me');
    fs.writeFileSync(marker,JSON.stringify({...value,created_at:new Date(Date.now()-3*60*60*1000).toISOString()}));
    const r=probe(carrier);
    assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');
    assert.match(r.errorRecord.message,/time window/);
    assert.equal(fs.readFileSync(payload,'utf8'),'keep me');
  }finally{owned.dispose();}
});
test('C10 additive 094 T2 tracked root created by another pid is not this run and is never deleted',()=>{
  const owned=createTrackedTempDir(RUN_PREFIX);
  try{
    const marker=path.join(owned.path,'.workflowhub-temp.json'),value=JSON.parse(fs.readFileSync(marker));
    const carrier=path.join(owned.path,'carrier');fs.mkdirSync(carrier);
    const payload=path.join(carrier,'unchecked-payload.txt');fs.writeFileSync(payload,'keep me');
    fs.writeFileSync(marker,JSON.stringify({...value,pid:process.pid+424242}));
    const r=probe(carrier);
    assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');
    assert.match(r.errorRecord.message,/direct parent/);
    assert.equal(fs.readFileSync(payload,'utf8'),'keep me');
  }finally{owned.dispose();}
});
test('C10 additive 094 T2 same-uid tracked root of a different run is rejected',()=>{
  const owned=createTrackedTempDir('wh-c10-other-run-');
  try{
    const carrier=path.join(owned.path,'carrier');fs.mkdirSync(carrier);
    const payload=path.join(carrier,'unchecked-payload.txt');fs.writeFileSync(payload,'keep me');
    const r=probe(carrier);
    assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');
    assert.match(r.errorRecord.message,/different run/);
    assert.equal(fs.readFileSync(payload,'utf8'),'keep me');
  }finally{owned.dispose();}
});
test('ORACLE-CROSS-TASK-READBACK the C12 default copy root keeps its previous acceptance after the narrow extension',()=>{
  // Same scope probe, C12's own licensed default root. It must still reach the
  // missing-original stop instead of the copy-root guard, which is the exact
  // pre-extension behaviour. Nothing is created: the original check runs first.
  const r=spawnSync(process.execPath,['tests/acceptance/c12-update-chain.mjs','prepare','--run-id=c10-scope-contract','--copy-root=/tmp/c12-c12-p1/carrier','--port=41924','--task-record-root='+taskRoot,'--p1-identity='+path.join(taskRoot,'intentionally-unavailable-original.json')],{cwd:root,encoding:'utf8',timeout:10000});
  const record=JSON.parse(r.stderr.trim().split('\n').at(-1));
  assert.equal(record.code,'E_P1_ORIGINALS');
  assert.equal(fs.existsSync('/tmp/c12-c12-p1/carrier'),false);
});

// The real journey requires current-task readiness originals. An absent original
// is an explicit skipped condition, never a target RED or a business success.
test('ORACLE-INSTALLED-FLOW installed caller and real HTTP/external SQLite cancel/restore',
  {skip: !process.env.C10_DATA_READY_REF || !process.env.C10_ENV_READY_REF}, async(t)=>{
  const {openTask}=await import('../../runtime/task/task-handle.mjs');
  const handle=openTask(taskRoot,'workflowhub','workflowhub-ui-frontend-c10-release-onboarding-20261103');
  const evidenceRef=name=>{const value=process.env[name];assert.ok(value&&!path.isAbsolute(value)&&value.startsWith('quality/evidence/')&&!value.split('/').includes('..'));return value;};
  const data=JSON.parse(handle.readRecordBytes(evidenceRef('C10_DATA_READY_REF')));
  const env=JSON.parse(handle.readRecordBytes(evidenceRef('C10_ENV_READY_REF')));
  assert.equal(env.task_id,handle.identity.taskId);
  // T3 precondition: a stale readiness original or a foreign service on the
  // same port must never be mutated. The environment original has to bind the
  // listening API to this task id and to the same qa_root the data original
  // names; otherwise this journey is skipped (with the reason) instead of
  // sending discard/restore at an unproven target.
  const boundApiTask=env.api_task_id??env.release_task_id??null;
  if(boundApiTask!==handle.identity.taskId){t.skip(`readiness environment original does not bind the API to this task (api_task_id=${JSON.stringify(boundApiTask)}, task=${handle.identity.taskId}); no request was sent`);return;}
  if(data.task_id!==undefined&&data.task_id!==handle.identity.taskId){t.skip(`data readiness original names task ${JSON.stringify(data.task_id)}, not ${handle.identity.taskId}; no request was sent`);return;}
  if(typeof data.qa_root!=='string'||typeof env.qa_root!=='string'||fs.realpathSync(data.qa_root)!==fs.realpathSync(env.qa_root)){t.skip('data and environment originals do not name the same qa_root; no request was sent');return;}
  assert.deepEqual(data.allowed_simulation_ids,['simulation-qa-running','simulation-qa-stopped','simulation-qa-pending']);
  assert.equal(data.target_session_date,'2026-06-29');assert.equal(data.initial_discarded,false);
  const qa=fs.realpathSync(data.qa_root),tasks=fs.realpathSync(data.tasks_root);
  assert.ok(qa.startsWith(taskRoot+path.sep)&&tasks.startsWith(taskRoot+path.sep)&&qa!==tasks,'only this task QA roots may be mutated');
  const api=new URL(env.api_url);assert.equal(api.hostname,'127.0.0.1');assert.equal(api.port,String(env.api_port));
  const packageRoot=fs.realpathSync(env.installed_package_root);
  assert.ok(packageRoot.startsWith(taskRoot+path.sep)&&packageRoot!==root,'use the isolated installed runner, not source checkout');
  const cli=path.join(packageRoot,'tools/cli/stage-runtime.mjs');assert.ok(fs.statSync(cli).isFile());
  const installed=await handle.captureCommand({cwd:root,slug:'c10-business-installed-caller',argv:[process.execPath,cli,'doctor','--action=workspace','--stage=build-code','--project=workflowhub','--task='+handle.identity.taskId,'--task-path='+taskRoot],timeoutMs:10000});
  assert.equal(installed.exit_code,0,'actual installed public caller must load before the journey');
  async function request(method,route,expected,body){
    const response=await fetch(new URL(route,api),{method,headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
    const bytes=await response.text();await handle.appendRecord({dir:'quality/evidence',slug:'c10-business-http',ext:'json',bytes:JSON.stringify({observed_at:new Date().toISOString(),task_id:handle.identity.taskId,request:{method,url:new URL(route,api).href,body},response:{status:response.status,body:bytes},expected_status:expected,qa_root:qa})});
    assert.equal(response.status,expected);return JSON.parse(bytes);
  }
  async function externalDiscarded(){
    const python=fs.realpathSync(env.python_executable),db=path.join(qa,'metadata/metadata.sqlite3');
    const code="import sqlite3,sys,json\nfrom pathlib import Path\nwith sqlite3.connect(Path(sys.argv[1]).resolve(strict=True).as_uri()+'?mode=ro',uri=True) as c:\n print(json.dumps(c.execute(\"SELECT json_extract(payload_json,'$.discarded') FROM v2_simulation_cards WHERE simulation_id=?\",('simulation-qa-pending',)).fetchone()))";
    const r=spawnSync(python,['-c',code,db],{encoding:'utf8',timeout:10000});
    await handle.appendRecord({dir:'quality/evidence',slug:'c10-business-external-sql',ext:'json',bytes:JSON.stringify({observed_at:new Date().toISOString(),task_id:handle.identity.taskId,executable:python,argv:['-c',code,db],exit_code:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr})});
    assert.equal(r.error,undefined);assert.equal(r.status,0);return JSON.parse(r.stdout)[0];
  }
  const list=await request('GET','/api/v2/simulation-record-summaries',200);
  assert.ok(data.allowed_simulation_ids.every(id=>list.records.some(row=>row.card.simulation_id===id)));
  const baseline=list.records.find(row=>row.card.simulation_id==='simulation-qa-pending').card;assert.equal(baseline.discarded,false);
  assert.equal((await request('GET','/api/v2/simulation-summaries/simulation-qa-stopped?target_session_date=2026-06-29',200)).card.simulation_id,'simulation-qa-stopped');
  // A discard is considered possibly applied from the moment the request is
  // sent, so a timeout, a lost response or a failed evidence write still
  // triggers the restore attempt and never leaves the QA card dirty.
  let discardIssued=false,restored=false;
  async function bestEffortRestore(reason){
    for(let attempt=1;attempt<=2&&!restored;attempt++){
      try{
        const response=await fetch(new URL('/api/v2/simulation-cards/simulation-qa-pending/restore',api),{method:'POST',headers:{'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(30000)});
        const bytes=await response.text();
        await handle.appendRecord({dir:'quality/evidence',slug:'c10-business-restore-recovery',ext:'json',bytes:JSON.stringify({observed_at:new Date().toISOString(),task_id:handle.identity.taskId,reason,attempt,request:{method:'POST',url:new URL('/api/v2/simulation-cards/simulation-qa-pending/restore',api).href},response:{status:response.status,body:bytes},qa_root:qa})});
        if(response.status===200||response.status===409){restored=true;return true;}
      }catch(error){
        try{await handle.appendRecord({dir:'quality/evidence',slug:'c10-business-restore-recovery',ext:'json',bytes:JSON.stringify({observed_at:new Date().toISOString(),task_id:handle.identity.taskId,reason,attempt,error:String(error&&error.message||error),qa_root:qa})});}catch{}
      }
    }
    return restored;
  }
  try{
    discardIssued=true;
    const discarded=await request('POST','/api/v2/simulation-cards/simulation-qa-pending/discard',200,{});
    assert.equal(discarded.card.discarded,true,'the discard response must itself report discarded=true');
    const readback=await request('GET','/api/v2/simulation-cards/simulation-qa-pending',200);
    assert.equal(readback.card.discarded,true);assert.equal(readback.card.strategy_version_id,baseline.strategy_version_id);assert.deepEqual(readback.card.history_run_ids,baseline.history_run_ids);assert.equal(await externalDiscarded(),1);
    assert.equal((await request('POST','/api/v2/simulation-cards/simulation-qa-pending/discard',200,{})).card.discarded,true);
    assert.equal((await request('POST','/api/v2/simulation-cards/simulation-qa-pending/restore',200,{})).card.discarded,false);restored=true;
    assert.equal(await externalDiscarded(),0);
    await request('POST','/api/v2/simulation-cards/simulation-qa-pending/restore',409,{});
    await request('POST','/api/v2/simulation-cards/simulation-qa-running/discard',409,{});
    await request('GET','/api/v2/simulation-cards/does-not-exist',404);
  }finally{
    if(discardIssued&&!restored){
      await bestEffortRestore('discard was issued but the journey did not confirm a restore');
      assert.equal(await externalDiscarded(),0,'external SQLite must read discarded=0 after the recovery restore');
    }
  }
  // This freezes the HTTP/SQL subset only. Same-root restart, page states,
  // offline recovery and owned-browser cleanup require their actual originals.
});

// Additive boundary cases consume the existing CLI/TaskHandle/shape producers.
// They neither implement a readiness/conclusion validator nor certify effects.
test('C10 additive 076 T006 unmarked parent is rejected before source or service work',()=>{
  const owned=createTrackedTempDir('wh-c10-unmarked-');try{const unmarked=path.join(owned.path,'unmarked');fs.mkdirSync(unmarked);const copy=path.join(unmarked,'carrier');const r=probe(copy);assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');assert.equal(fs.existsSync(copy),false);assert.equal(fs.existsSync(unmarked),true);}finally{owned.dispose();}
});
test('C10 additive 076 T006 symbolic parent is rejected without following or changing its target',()=>{
  const owned=createTrackedTempDir('wh-c10-symbolic-');const native=createTrackedTempDir('wh-c10-native-',{root:owned.path});try{const alias=path.join(owned.path,'alias'),marker=path.join(native.path,'.workflowhub-temp.json'),before=fs.readFileSync(marker);fs.symlinkSync(native.path,alias);const r=probe(path.join(alias,'carrier'));assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');assert.deepEqual(fs.readFileSync(marker),before);assert.equal(fs.lstatSync(alias).isSymbolicLink(),true);}finally{native.dispose();owned.dispose();}
});
test('C10 additive 076 T006 foreign marker UID is rejected; this does not prove a new guard UID branch',()=>{
  const owned=createTrackedTempDir('wh-c10-foreign-marker-');try{const marker=path.join(owned.path,'.workflowhub-temp.json'),value=JSON.parse(fs.readFileSync(marker));value.uid=(process.getuid?.()??0)+1;fs.writeFileSync(marker,JSON.stringify(value));const before=fs.readFileSync(marker),r=probe(path.join(owned.path,'carrier'));assert.equal(r.errorRecord.code,'E_COPY_ROOT_SCOPE');assert.deepEqual(fs.readFileSync(marker),before);}finally{owned.dispose();}
});
async function withReadinessTask(run){
  const {createTask}=await import('../../runtime/task/task-handle.mjs'),owned=createTrackedTempDir('wh-c10-readiness-record-');
  try{const handle=await createTask({storageRoot:owned.path,manifest:{schema_version:'1.0.0',project_name:'workflowhub',task_id:'c10-readiness-fixture',created_at:new Date().toISOString(),target_repo_root:root,activation_cohort:'post',workspace_mode:'existing',workspace_root:root,record_model:'vnext-single-write',execution_mode:'per_invocation',issue_ids:[],inputs:{}}});await run(handle,owned.path);}finally{owned.dispose();}
}
test('C10 additive 076 T007 actual TaskHandle rejects wrong expected task and wrong root',async()=>{
  const {openTask}=await import('../../runtime/task/task-handle.mjs');await withReadinessTask(async(handle,ownedRoot)=>{
    assert.throws(()=>openTask(handle.taskPath,'workflowhub','foreign-task'),/does not match project\/task identity/);
    assert.throws(()=>openTask(ownedRoot,'workflowhub',handle.identity.taskId),/does not match project\/task identity/);
    assert.equal(openTask(handle.taskPath,'workflowhub',handle.identity.taskId).identity.taskId,handle.identity.taskId);
  });
});
test('C10 additive 076 T007 actual TaskHandle rejects escaping or absolute readiness refs',async()=>{
  await withReadinessTask(async handle=>{for(const ref of ['../task.json',path.join(handle.taskPath,'task.json'),'quality\\evidence\\ready.json'])assert.throws(()=>handle.readRecordBytes(ref),/record path must remain inside task storage/);assert.throws(()=>handle.readRecordBytes('quality/evidence/not-created-ready.json'),error=>error.code==='ENOENT');});
});
test('C10 additive 076 T007 actual openTask rejects a correctly shaped path with a foreign task manifest',async()=>{
  const {openTask}=await import('../../runtime/task/task-handle.mjs');await withReadinessTask(async handle=>{const file=path.join(handle.taskPath,'task.json'),manifest=JSON.parse(fs.readFileSync(file));manifest.task_id='foreign-task';fs.writeFileSync(file,JSON.stringify(manifest));assert.throws(()=>openTask(handle.taskPath,'workflowhub','c10-readiness-fixture'),/task manifest identity mismatch/);});
});
test('C10 additive 076 T008 real shape producers reject empty evidence and stale AC sets, without acting as semantic judges',async()=>{
  const {validateVerifyAcceptanceSummary}=await import('../../skills/wh-review/scripts/review-materials.mjs');
  const {validateAcceptanceEvidence}=await import('../../runtime/evidence/acceptance-evidence-validator.mjs');
  assert.throws(()=>validateVerifyAcceptanceSummary({criteria:[],result:'pass'}),/empty criteria list/);
  assert.throws(()=>validateVerifyAcceptanceSummary({criteria:[{id:'AC-C12-004',status:'pass'}]},{expectedCriterionIds:['AC-C10-6']}),/does not match current spec AC set/);
  assert.throws(()=>validateAcceptanceEvidence({schema_version:'acceptance-evidence.v1',acceptance_criterion_id:'AC-C10-6',result:'pass',refs:[]}),/refs must be a non-empty array/);
  // A shape-valid assertion of success is deliberately accepted by this shape
  // producer. The independent bad-input protocol must still reject its meaning.
  assert.equal(validateVerifyAcceptanceSummary({criteria:[{id:'AC-C10-6',status:'pass',actual_outcome:'未执行真实业务'}]},{expectedCriterionIds:['AC-C10-6']}),true);
});
