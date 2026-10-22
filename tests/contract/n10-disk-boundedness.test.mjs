import {afterEach,describe,it,expect,vi} from 'vitest';
import {mkdtempSync,realpathSync,writeFileSync,mkdirSync,rmSync,linkSync,symlinkSync,readFileSync,existsSync,truncateSync,readdirSync,statSync} from 'node:fs';
import {execFileSync,spawnSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const roots=[];
const fixture=()=>{const r=realpathSync(mkdtempSync(join(tmpdir(),'n10-disk-owned-')));roots.push(r);return r;};
afterEach(()=>{for(const r of roots.splice(0))rmSync(r,{recursive:true,force:true});});
async function moduleUnderTest(){const m=await import('../../runtime/evidence/disk-budget.mjs').catch(()=>null);expect(m,'T038 actual budget implementation must exist').not.toBeNull();return m;}
describe('T038 actual disk ownership and task write budget',()=>{
 it('counts distinct inode bytes and each hardlink pathname; read does not change source bytes/inode',async()=>{
  const m=await moduleUnderTest(),r=fixture(),d=join(r,'quality','reviews');mkdirSync(d,{recursive:true});writeFileSync(join(d,'one'),'abc');linkSync(join(d,'one'),join(d,'two'));
  const v=m.readTaskDiskUsage(r);expect(v.groups.reviews).toMatchObject({bytes:3,files:2});expect(readFileSync(join(d,'one'),'utf8')).toBe('abc');
 });
 it('deduplicates hardlink bytes across quality groups while preserving per-group usage',async()=>{
  const m=await moduleUnderTest(),r=fixture(),reviews=join(r,'quality','reviews'),evidence=join(r,'quality','evidence');mkdirSync(reviews,{recursive:true});mkdirSync(evidence,{recursive:true});writeFileSync(join(reviews,'one'),'abc');linkSync(join(reviews,'one'),join(evidence,'same'));
  const v=m.readTaskDiskUsage(r);expect(v.groups.reviews).toMatchObject({bytes:3,files:1});expect(v.groups.evidence).toMatchObject({bytes:3,files:1});expect(v).toMatchObject({bytes:3,files:2});
 });
 it('allows the hard boundary and rejects peak overflow without touching existing originals',async()=>{
  const m=await moduleUnderTest(),r=fixture(),d=join(r,'quality','reviews');mkdirSync(d,{recursive:true});writeFileSync(join(d,'old'),'abc');
  const limits={reviews:{softBytes:4,hardBytes:8,hardFiles:3}};
  expect(()=>m.assertTaskDiskBudget({taskRoot:r,subdir:'quality/reviews',incomingBytes:5,incomingFiles:1,limits})).not.toThrow();
  expect(()=>m.assertTaskDiskBudget({taskRoot:r,subdir:'quality/reviews',incomingBytes:6,incomingFiles:1,limits})).toThrowError(expect.objectContaining({code:'DISK_BUDGET_EXCEEDED',current_bytes:3,incoming_bytes:6,hard_bytes:8}));
  // Independent TCR252: 1+2 equals hard (allowed); 1+3 exceeds it.
  expect(()=>m.assertTaskDiskBudget({taskRoot:r,subdir:'quality/reviews',incomingBytes:0,incomingFiles:2,limits})).not.toThrow();
  expect(()=>m.assertTaskDiskBudget({taskRoot:r,subdir:'quality/reviews',incomingBytes:0,incomingFiles:3,limits})).toThrowError(expect.objectContaining({code:'DISK_BUDGET_EXCEEDED'}));expect(readFileSync(join(d,'old'),'utf8')).toBe('abc');
 });
 it('serializes actual concurrent writes under one leaf lock rather than checking then releasing',async()=>{
  const m=await moduleUnderTest(),r=fixture(),d=join(r,'quality','reviews');mkdirSync(d,{recursive:true});
  const perform=m.createTaskDiskWriteExecutor({taskRoot:r,limits:{reviews:{softBytes:9,hardBytes:10,hardFiles:10}}});
  const writes=await Promise.allSettled(['a','b'].map(name=>perform({kind:'create',path:join(d,name),bytes:6,incomingFiles:1},()=>writeFileSync(join(d,name),'123456'))));
  expect(writes.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(writes.find(x=>x.status==='rejected').reason.code).toBe('DISK_BUDGET_EXCEEDED');expect(m.readTaskDiskUsage(r).groups.reviews.bytes).toBe(6);
 });
 it('rejects symlink traversal and unknown write destinations instead of bypassing limits',async()=>{
  const m=await moduleUnderTest(),r=fixture(),outside=fixture();mkdirSync(join(r,'quality'));symlinkSync(outside,join(r,'quality','reviews'));
  expect(()=>m.readTaskDiskUsage(r)).toThrowError(expect.objectContaining({code:'DISK_PATH_ALIAS'}));
  const perform=m.createTaskDiskWriteExecutor({taskRoot:r});await expect(perform({kind:'create',path:join(outside,'bad'),bytes:1,incomingFiles:1},()=>writeFileSync(join(outside,'bad'),'x'))).rejects.toMatchObject({code:'DISK_PATH_OUTSIDE'});expect(existsSync(join(outside,'bad'))).toBe(false);
 });
 it('audits real task attribution read-only and refuses every cleanup argument',async()=>{
  const r=fixture();mkdirSync(join(r,'quality','evidence','review-materials'),{recursive:true});mkdirSync(join(r,'quality','reviews'),{recursive:true});
  writeFileSync(join(r,'task.json'),JSON.stringify({activation_cohort:'post'}));writeFileSync(join(r,'facts.jsonl'),'owned current stage\n');writeFileSync(join(r,'quality','evidence','unknown'),'unknown-owned');writeFileSync(join(r,'quality','reviews','one'),'owned');
  const files=[join(r,'facts.jsonl'),join(r,'quality','reviews','one')],before=files.map(p=>({bytes:readFileSync(p),ino:statSync(p).ino})),cli=fileURLToPath(new URL('../../tools/cli/audit-disk-usage.mjs',import.meta.url));
  const run=spawnSync(process.execPath,[cli,'--task-root',r],{encoding:'utf8'});expect(run.status,run.stderr).toBe(0);const audit=JSON.parse(run.stdout);
  expect(audit.attribution.find(x=>x.path==='facts.jsonl').classification).toBe('active');expect(audit.attribution.find(x=>x.path==='quality/evidence/review-materials').classification).toBe('historical');expect(audit.attribution.find(x=>x.path==='quality/evidence/unknown').classification).toBe('unknown');
  expect(spawnSync(process.execPath,[cli,'--task-root',r,'--cleanup'],{encoding:'utf8'}).status).toBe(1);
  files.forEach((p,i)=>{expect(readFileSync(p)).toEqual(before[i].bytes);expect(statSync(p).ino).toBe(before[i].ino);});
 });
 it('TCR273 audit keeps unproven review children and misplaced historical names unknown without touching originals',async()=>{
  const m=await moduleUnderTest(),r=fixture(),unknown=['quality/reviews/unowned-directory','quality/reviews/review-materials','quality/tests/review-materials','review-materials'];
  const historical='quality/evidence/review-materials';
  const paths=[...unknown,historical].map((ref,i)=>{const d=join(r,ref);mkdirSync(d,{recursive:true});const p=join(d,'original');writeFileSync(p,`owned-original-${i}`);return p;});
  const before=paths.map(p=>({bytes:readFileSync(p),ino:statSync(p).ino})),audit=m.auditTaskDiskUsage(r);
  for(const ref of unknown){const row=audit.attribution.find(x=>x.path===ref);expect(row.classification).toBe('unknown');expect(row.writer).not.toBe('review-record-route');expect(row.bytes).toBeGreaterThan(0);expect(row.files).toBe(1);}
  expect(audit.attribution.find(x=>x.path===historical).classification).toBe('historical');
  paths.forEach((p,i)=>{expect(readFileSync(p)).toEqual(before[i].bytes);expect(statSync(p).ino).toBe(before[i].ino);});
  symlinkSync(join(r,historical),join(r,'quality','reviews','alias'));
  expect(()=>m.auditTaskDiskUsage(r)).toThrow(/DISK_PATH_ALIAS/);
 });
 it('soft threshold only warns while the hard boundary continues to allow the write',async()=>{
  const r=fixture();mkdirSync(join(r,'quality','tests'),{recursive:true});writeFileSync(join(r,'quality','tests','old'),'123');
  const module=new URL('../../runtime/evidence/disk-budget.mjs',import.meta.url).href;
  const code=`import{assertTaskDiskBudget}from${JSON.stringify(module)};assertTaskDiskBudget({taskRoot:${JSON.stringify(r)},subdir:'quality/tests',incomingBytes:1,incomingFiles:1,limits:{tests:{softBytes:4,hardBytes:4,hardFiles:2}}});process.stdout.write('allowed');`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});expect(result.status).toBe(0);expect(result.stdout).toBe('allowed');expect(result.stderr).toContain('DISK_BUDGET_SOFT');
 });
 it('emits one soft warning when a sequence crosses the threshold, not for every later chunk',async()=>{
  const m=await moduleUnderTest(),r=fixture(),d=join(r,'quality','tests'),path=join(d,'stream');mkdirSync(d,{recursive:true});
  const perform=m.createTaskDiskWriteExecutor({taskRoot:r,limits:{tests:{softBytes:3,hardBytes:20,hardFiles:5}}}),write=vi.spyOn(process.stderr,'write').mockImplementation(()=>true);
  try {
   await perform({kind:'create',path,bytes:2,incomingFiles:1},()=>writeFileSync(path,'aa'));
   await perform({kind:'chunk',path,bytes:2,incomingFiles:0},()=>writeFileSync(path,'aaaa'));
   await perform({kind:'chunk',path,bytes:1,incomingFiles:0},()=>writeFileSync(path,'aaaaa'));
   expect(write.mock.calls.filter(([value])=>String(value).startsWith('DISK_BUDGET_SOFT '))).toHaveLength(1);
  } finally { write.mockRestore(); }
 });
});

async function actualTask(){
 const {createTask}=await import('../../runtime/task/task-handle.mjs'),root=fixture();
 const task=await createTask({storageRoot:root,manifest:{schema_version:'1.0.0',project_name:'workflowhub',task_id:'disk-owned',created_at:'2026-10-21T00:00:00Z',target_repo_root:root,activation_cohort:'post',record_model:'vnext-single-write',execution_mode:'per_invocation',issue_ids:[],inputs:{}}});return {root,task};
}
function fill(task,group,bytes){const dir=task.recordPath('quality/'+group);mkdirSync(dir,{recursive:true});const path=join(dir,'owned-sparse');writeFileSync(path,'');truncateSync(path,bytes);return path;}
describe('T039 real task write owners and cross-caller budget',()=>{
 it('A create/write/append reject full evidence while known identical bytes reuse first',async()=>{
  const {task}=await actualTask(),m=await moduleUnderTest();await task.createRecord('quality/evidence/known','owned');fill(task,'evidence',m.DEFAULT_TASK_DISK_LIMITS.evidence.hardBytes-5);
  expect((await task.createRecord('quality/evidence/known','owned')).idempotent).toBe(true);
  expect((await task.writeRecordAtomic('quality/evidence/known','owned')).idempotent).toBe(true);
  await expect(task.createRecord('quality/evidence/rejected','x')).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  await expect(task.writeRecordAtomic('quality/evidence/known','changed')).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  await expect(task.appendRecord({dir:'quality/evidence',slug:'rejected',ext:'md',bytes:'x'})).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  expect(task.readRecord('quality/evidence/known')).toBe('owned');expect(existsSync(task.recordPath('quality/evidence/rejected'))).toBe(false);
 });
 it('B provider bytes reuse at hard and rejected final JSON preserves preceding originals',async()=>{
  const {task}=await actualTask(),m=await moduleUnderTest(),{recordSimpleReviewRequest}=await import('../../runtime/review/review-record-route.mjs');
  const request={stage:'build-code',review_scope:'phase',phase_id:'P8',subject_kind:'phase',surface:'code',materials:{approved_spec:'owned'}};
  // Independent TCR257: actual provider membership binds reusable bytes to identity.
  const callbackRefs=[];
  const runRound=async(_r,{onProviderOutput})=>{callbackRefs.push(await onProviderOutput({provider:'owned/source',output:'ORIGINAL'}));return {status:'unavailable',outcome:'unavailable',provider_results:[{provider:'owned/source',status:'failed',output:'ORIGINAL'}],findings:[]};};
  const first=await recordSimpleReviewRequest({taskDir:task.taskPath,request,runRound}),dir=task.recordPath('quality/reviews'),before=readdirSync(dir),usage=m.readTaskDiskUsage(task.taskPath).groups.reviews.bytes;
  fill(task,'reviews',m.DEFAULT_TASK_DISK_LIMITS.reviews.hardBytes-usage);
  await expect(recordSimpleReviewRequest({taskDir:task.taskPath,request,runRound})).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  expect(callbackRefs).toHaveLength(2);expect(callbackRefs[1]).toBe(callbackRefs[0]);
  const firstValue=JSON.parse(readFileSync(first.path,'utf8'));expect(firstValue.provider_results[0]).toMatchObject({provider:'owned/source',output_ref:join(task.taskPath,callbackRefs[0])});expect(readFileSync(firstValue.provider_results[0].output_ref,'utf8')).toBe('ORIGINAL');
  expect(readdirSync(dir).filter(n=>n.endsWith('.output'))).toHaveLength(1);expect(readFileSync(first.path,'utf8')).toContain('provider_output');
  expect(readdirSync(dir).filter(n=>n.endsWith('.json'))).toEqual(before.filter(n=>n.endsWith('.json')));
 });
 it('E stream refuses overflow, preserves actual prefix, and explicitly reports an unsaved receipt',async()=>{
  const {task,root}=await actualTask(),m=await moduleUnderTest();fill(task,'tests',m.DEFAULT_TASK_DISK_LIMITS.tests.hardBytes-10);
  let error;try{await task.captureCommand({cwd:root,slug:'prefix',argv:[process.execPath,'-e','process.stdout.write("abc");setTimeout(()=>process.stdout.write("defghijklmnop"),40)']});}catch(e){error=e;}
  expect(error).toMatchObject({code:'DISK_BUDGET_EXCEEDED',receipt_saved:false});expect(error).not.toHaveProperty('receipt_ref');expect(readFileSync(error.output_ref,'utf8')).toBe('abc');expect(error.execution).toHaveProperty('exit_code');expect(error.execution.error.code).toBe('DISK_BUDGET_EXCEEDED');
  expect(readdirSync(task.recordPath('quality/tests')).filter(n=>n.endsWith('.json'))).toHaveLength(0);
 });
 it('E does not hold the same task group budget lock while a child writes its own task record',async()=>{
  const {task,root}=await actualTask(),owner=new URL('../../runtime/task/task-handle.mjs',import.meta.url).href;
  const script=`import{openTask}from${JSON.stringify(owner)};const t=openTask(${JSON.stringify(task.taskPath)},{projectName:'workflowhub',taskId:'disk-owned'});await t.appendRecord({dir:'quality/tests',slug:'child',ext:'txt',bytes:'actual-child'});process.stdout.write('child-finished');`;
  const r=await task.captureCommand({cwd:root,slug:'parent',argv:[process.execPath,'--input-type=module','-e',script],timeoutMs:5000});expect(r.exit_code).toBe(0);expect(readFileSync(r.output_ref,'utf8')).toBe('child-finished');
 });
 it('F/G bound confirmation and Git record/consume refuse full evidence without false recorded paths',async()=>{
  const {task,root}=await actualTask(),m=await moduleUnderTest();const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});git('init','-q','-b','main');git('config','user.name','Owned test');git('config','user.email','owned@example.invalid');writeFileSync(join(root,'README'),'owned');git('add','README');git('-c','commit.gpgsign=false','commit','-qm','owned');
  const grant=await task.recordGitAuthorization({cwd:root,operation:'commit',confirmationRef:'owned-human-source',phase:'build-code'});
  const used=m.readTaskDiskUsage(task.taskPath).groups.evidence.bytes;fill(task,'evidence',m.DEFAULT_TASK_DISK_LIMITS.evidence.hardBytes-used);
  await expect(task.recordConfirmation({stage:'make-decision',decision:'confirmed',reply:'Owned reply',materialRefs:['spec.md']},{cwd:root})).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  await expect(task.recordGitAuthorization({cwd:root,operation:'commit',confirmationRef:'another-owned-source',phase:'build-code'})).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  await expect(task.consumeGitAuthorization({cwd:root,operation:'commit',stepId:'owned-step',authorizationRef:grant.path,phase:'build-code'})).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});expect(readFileSync(grant.path,'utf8')).toContain('owned-human-source');
 });
 it('A/F different real owners share one evidence budget across concurrent publications',async()=>{
  const {task,root}=await actualTask(),m=await moduleUnderTest();const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});git('init','-q','-b','main');git('config','user.name','Owned test');git('config','user.email','owned@example.invalid');writeFileSync(join(root,'README'),'owned');git('add','README');git('-c','commit.gpgsign=false','commit','-qm','owned');fill(task,'evidence',m.DEFAULT_TASK_DISK_LIMITS.evidence.hardBytes-700);
  const writes=await Promise.allSettled([task.appendRecord({dir:'quality/evidence',slug:'concurrent',ext:'txt',bytes:'x'.repeat(600)}),task.recordConfirmation({stage:'make-decision',decision:'confirmed',reply:'r'.repeat(200),materialRefs:['spec.md']},{cwd:root})]);
  expect(writes.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(writes.find(x=>x.status==='rejected').reason.code).toBe('DISK_BUDGET_EXCEEDED');expect(m.readTaskDiskUsage(task.taskPath).groups.evidence.bytes).toBeLessThanOrEqual(m.DEFAULT_TASK_DISK_LIMITS.evidence.hardBytes);
 });
});


describe('TCR277 concurrent identical publication under the real task budget lock',()=>{
 it('rechecks createFileOnce identical bytes inside the lock before the hard budget',async()=>{
  const r=fixture(),dir=join(r,'quality','evidence');mkdirSync(dir,{recursive:true});
  const m=await moduleUnderTest(),{createFileOnce}=await import('../../runtime/interface/safe-write.mjs');
  const executor=m.createTaskDiskWriteExecutor({taskRoot:r,limits:{evidence:{softBytes:3,hardBytes:3,hardFiles:2}}});
  let arrived=0,release;const barrier=new Promise(resolve=>release=resolve);
  const performWrite=async(request,actual)=>{if(++arrived===2)release();await barrier;return executor(request,actual);};
  const results=await Promise.all([createFileOnce(dir,'same','abc',{performWrite}),createFileOnce(dir,'same','abc',{performWrite})]);
  expect(arrived).toBe(2);expect(results.some(r=>r.idempotent)).toBe(true);expect(readdirSync(dir)).toEqual(['same']);expect(readFileSync(join(dir,'same'),'utf8')).toBe('abc');
  await expect(createFileOnce(dir,'same','xyz',{performWrite:executor})).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  const ample=m.createTaskDiskWriteExecutor({taskRoot:r,limits:{evidence:{softBytes:20,hardBytes:20,hardFiles:10}}});
  await expect(createFileOnce(dir,'same','xyz',{performWrite:ample})).rejects.toMatchObject({code:'RECORD_CONFLICT'});
  expect(readFileSync(join(dir,'same'),'utf8')).toBe('abc');
  symlinkSync(join(dir,'same'),join(dir,'alias'));await expect(createFileOnce(dir,'alias','abc',{performWrite:ample})).rejects.toMatchObject({code:'SYMLINK_TARGET'});
 });
 for(const method of ['createRecord','writeRecordAtomic'])it('rechecks real TaskHandle '+method+' across two synchronized processes',async()=>{
  const {root,task}=await actualTask(),m=await moduleUnderTest();fill(task,'evidence',m.DEFAULT_TASK_DISK_LIMITS.evidence.hardBytes-3);
  const release=join(root,'release'),module=new URL('../../runtime/task/task-handle.mjs',import.meta.url).href;
  const source=String.raw`
    import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
    const original=fs.openSync;let hit=false;
    fs.openSync=(path,...args)=>{if(!hit&&String(path).endsWith('/.disk-budget-evidence.lock')){hit=true;fs.writeSync(1,'READY\n');const end=Date.now()+5000;while(!fs.existsSync(process.env.BARRIER)){if(Date.now()>end)throw Error('barrier timeout');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}}return original(path,...args);};
    syncBuiltinESMExports();const {openTask}=await import(process.env.MODULE);const task=openTask(process.env.TASK,{projectName:'workflowhub',taskId:'disk-owned'});
    try{const result=await task[process.env.METHOD]('quality/evidence/same','abc');console.log(JSON.stringify({hit,result}));}catch(error){console.log(JSON.stringify({hit,error:{code:error.code,message:error.message}}));process.exitCode=1;}
  `;
  let ready=0;const children=[];
  const run=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',source],{env:{...process.env,BARRIER:release,MODULE:module,TASK:task.taskPath,METHOD:method},stdio:['ignore','pipe','pipe']});children.push(child);let output='',stderr='',announced=false;child.stdout.on('data',b=>{output+=b;if(!announced&&output.includes('READY\n')){announced=true;if(++ready===2)writeFileSync(release,'go');}});child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal,output,stderr}));});
  let outcomes;try{outcomes=await Promise.all([run(),run()]);}finally{children.forEach(c=>{if(c.exitCode===null)c.kill('SIGKILL');});}
  expect(ready).toBe(2);for(const outcome of outcomes)expect(outcome.code,outcome.output+outcome.stderr).toBe(0);
  const results=outcomes.map(o=>JSON.parse(o.output.trim().split('\n').at(-1)));expect(results.every(o=>o.hit)).toBe(true);expect(results.some(o=>o.result.idempotent)).toBe(true);
  expect(task.readRecord('quality/evidence/same')).toBe('abc');expect(readdirSync(task.recordPath('quality/evidence')).sort()).toEqual(['owned-sparse','same']);
 });
});
