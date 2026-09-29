import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';

const repo='/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919';
const taskId='workflowhub-thin-core-card-04-20260919';
const taskRoot=`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/${taskId}`;
const spec=`specs/${taskId}`;
const materialFiles=['decision-log.md','spec.md','phases/index.md',...Array.from({length:13},(_,i)=>`phases/P${i+1}.md`)].map(p=>`${spec}/${p}`);
const phaseFiles={
  P6:['tests/contract/decision-log-census.test.mjs','tests/contract/upstream-coverage-ledger.test.mjs','tests/contract/spec-analyze-truthfulness.test.mjs','tests/contract/review-history-canonical-reader.test.mjs','tests/contract/oracle-mirror.test.mjs','tests/e2e/card-04-real-entry-chain-e2e.test.mjs','tests/contract/post-phase-official-handler.test.mjs','tests/contract/post-spec-analyze-original-source.test.mjs','runtime/stage/stage-content-contracts.mjs','runtime/stage/stage-runner.mjs','runtime/review/review-record-route.mjs','runtime/evidence/freshness.mjs','tools/cli/stage-runtime.mjs'],
  P7:['tests/contract/acceptance-result-machine-classes.test.mjs','tests/deferred-acceptance-semantics.test.mjs','tests/contract/census-upstream-authoring.test.mjs','tests/decision-log-content-contract.test.mjs','runtime/evidence/acceptance-evidence-validator.mjs','runtime/evidence/freshness.mjs','runtime/evidence/quality-store.mjs','skills/decision-log/SKILL.md','skills/decision-log/templates/decision-log-template.md','workflows/make-decision/SKILL.md','tools/cli/stage-runtime.mjs']
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const cmd=(exe,args)=>{const r=spawnSync(exe,args,{cwd:repo,encoding:'utf8',env:{...process.env,TERM:'xterm'}});if(r.status!==0)throw new Error(`${exe} ${args.join(' ')} exit=${r.status}: ${r.stderr}`);return r.stdout.trim()};
const status=()=>JSON.parse(cmd('node',['tools/cli/stage-runtime.mjs','status','--action=begin','--stage=build-code','--project=workflowhub',`--task=${taskId}`]));
const filehash=p=>{try{return hash(fs.readFileSync(p))}catch(e){return `MISSING:${e.code}`}};
const manifest=phase=>Object.fromEntries([...materialFiles,...phaseFiles[phase]].map(p=>[p,filehash(path.join(repo,p))]));
const identity=phase=>({at_utc:new Date().toISOString(),task_json_sha256:filehash(path.join(taskRoot,'task.json')),facts_jsonl_sha256:filehash(path.join(taskRoot,'facts.jsonl')),facts_line_count:fs.readFileSync(path.join(taskRoot,'facts.jsonl'),'utf8').trimEnd().split('\n').length,branch:cmd('git',['branch','--show-current']),head:cmd('git',['rev-parse','HEAD']),status:status(),files:manifest(phase)});
const save=(p,x)=>fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');
async function capture(phase){
  const phaseText=fs.readFileSync(path.join(repo,`${spec}/phases/${phase}.md`),'utf8');
  const match=phaseText.match(/^- \*\*gate_cmd\*\*: `([^`]+)`/m);
  if(!match)throw new Error(`${phase} gate_cmd missing`);
  const command=match[1];
  const n=phase==='P6'?8:4;
  if(command.split(/\s+/).filter(x=>x.endsWith('.mjs')).length!==n)throw new Error(`${phase} expected ${n} test files`);
  const uuid=crypto.randomUUID();
  const dir=path.join(repo,`quality/evidence/stage-quality/build-code/${phase}/${phase==='P6'?'T009-T014':'T015-T016'}-official-current-20260927-${uuid.slice(0,8)}`);
  fs.mkdirSync(dir,{recursive:true});
  const pre1=identity(phase),pre2=identity(phase);
  save(path.join(dir,'identity-before-first.json'),pre1);
  save(path.join(dir,'identity-before-second.json'),pre2);
  if(JSON.stringify(pre1.status.identity)!==JSON.stringify(pre2.status.identity)||pre1.branch!==pre2.branch||pre1.head!==pre2.head||JSON.stringify(pre1.files)!==JSON.stringify(pre2.files)||pre1.facts_jsonl_sha256!==pre2.facts_jsonl_sha256)throw new Error(`${phase} preflight drift; evidence ${dir}`);
  if(pre2.status.identity.task_id!==taskId||pre2.status.required_materials?.length!==16||pre2.status.missing_materials?.length!==0)throw new Error(`${phase} unauthenticated/incomplete materials`);
  if(phase==='P6'){
    const guard=`node -e 'const [maj,min]=process.versions.node.split(".").map(Number);if(maj!==24||min<14){console.error(\`Node >=24.14.0 <25 required, got \${process.versions.node}\`);process.exit(1)}console.log(process.versions.node)'`;
    if(!phaseText.includes(guard))throw new Error('P6 Node guard text mismatch');
    const g=spawnSync('bash',['-c',guard],{cwd:repo,encoding:'utf8',env:{...process.env,TERM:'xterm'}});
    save(path.join(dir,'node-guard.command.txt'),guard+'\n');save(path.join(dir,'node-guard.stdout.raw.txt'),g.stdout??'');save(path.join(dir,'node-guard.stderr.raw.txt'),g.stderr??'');save(path.join(dir,'node-guard.result.json'),{exit_code:g.status,signal:g.signal,error:g.error?.message??null});
    if(g.status!==0)throw new Error(`P6 Node guard failed exit=${g.status}; evidence ${dir}`);
  }
  const receipt_ref=`quality/tests/card04-${phase}-L0-current-${uuid}.json`;
  const output_ref=`quality/tests/output/card04-${phase}-L0-current-${uuid}.output`;
  const request={command,receipt_ref,output_ref,timeout_ms:phase==='P6'?900000:600000};
  const requestPath=path.join(dir,'request.json');save(requestPath,request);
  const args=['tools/cli/stage-runtime.mjs','verify','--action=execute','--stage=build-code','--project=workflowhub',`--task=${taskId}`,`--input=${requestPath}`];
  const started=new Date().toISOString();
  console.log(`${phase} START ${started} ${dir}`,true);
  const stdoutPath=path.join(dir,'cli.stdout.raw.json'),stderrPath=path.join(dir,'cli.stderr.raw.txt');
  const out=fs.createWriteStream(stdoutPath),err=fs.createWriteStream(stderrPath);
  const child=spawn('node',args,{cwd:repo,env:{...process.env,TERM:'xterm'},detached:true});
  child.stdout.pipe(out);child.stderr.pipe(err);
  let timedOut=false;
  const limit=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid,'SIGTERM')}catch{};setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL')}catch{}},10000).unref()},request.timeout_ms+60000);
  const result=await new Promise(resolve=>{child.on('error',e=>resolve({code:null,signal:null,error:e.message}));child.on('close',(code,signal)=>resolve({code,signal,error:null}))});
  clearTimeout(limit);
  await Promise.all([new Promise(r=>out.end(r)),new Promise(r=>err.end(r))]);
  const ended=new Date().toISOString();
  save(path.join(dir,'cli.result.json'),{command:`node ${args.join(' ')}`,started_at_utc:started,ended_at_utc:ended,exit_code:result.code,signal:result.signal,error:result.error,timed_out:timedOut});
  const post=identity(phase);save(path.join(dir,'identity-after.json'),post);
  const sameIdentity=JSON.stringify(pre2.status.identity)===JSON.stringify(post.status.identity)&&pre2.branch===post.branch&&pre2.head===post.head&&pre2.task_json_sha256===post.task_json_sha256&&pre2.facts_jsonl_sha256===post.facts_jsonl_sha256&&JSON.stringify(pre2.files)===JSON.stringify(post.files);
  let receipt=null, readback={};
  try{
    receipt=JSON.parse(fs.readFileSync(stdoutPath,'utf8'));
    const canonicalReceipt=fs.readFileSync(path.join(taskRoot,receipt_ref));
    const canonicalOutput=fs.readFileSync(path.join(taskRoot,output_ref));
    fs.writeFileSync(path.join(dir,'canonical-receipt.copy.json'),canonicalReceipt);
    fs.writeFileSync(path.join(dir,'canonical-output.copy.txt'),canonicalOutput);
    const outputText=canonicalOutput.toString('utf8');
    readback={receipt_ref,receipt_sha256:hash(canonicalReceipt),receipt_hash_claimed:receipt.receipt_hash,output_ref,output_sha256:hash(canonicalOutput),output_hash_claimed:receipt.output_hash,receipt_exit_code:receipt.exit_code,cli_exit_code:result.code,receipt_snapshot_tree:receipt.snapshot_tree,receipt_snapshot_head:receipt.snapshot_head,receipt_source_digest:receipt.source_digest,tests_summary:outputText.split('\n').filter(s=>/Test Files\s|Tests\s|Duration\s/.test(s)).slice(-3),copy_matches:canonicalReceipt.equals(fs.readFileSync(stdoutPath)),ref_hashes_match:hash(canonicalReceipt)===receipt.receipt_hash&&hash(canonicalOutput)===receipt.output_hash,material_and_source_unchanged:sameIdentity};
  }catch(e){readback={error:e.message,cli_exit_code:result.code,material_and_source_unchanged:sameIdentity}}
  save(path.join(dir,'readback.json'),readback);
  save(path.join(dir,'artifact-sha256.json'),Object.fromEntries(fs.readdirSync(dir).filter(n=>fs.statSync(path.join(dir,n)).isFile()).map(n=>[n,filehash(path.join(dir,n))])));
  console.log(`${phase} END ${ended} cli=${result.code} test=${receipt?.exit_code??'missing'} stable=${sameIdentity} hashes=${readback.ref_hashes_match??false} ${dir}`);
  return {phase,dir,cli_exit:result.code,test_exit:receipt?.exit_code??null,stable:sameIdentity,hashes:readback.ref_hashes_match??false,timedOut};
}
const p6=await capture('P6');
if(p6.cli_exit!==0||p6.test_exit!==0||!p6.stable||!p6.hashes||p6.timedOut){console.log('STOP_AFTER_P6 '+JSON.stringify(p6));process.exitCode=1}else{
  const p7=await capture('P7');
  if(p7.cli_exit!==0||p7.test_exit!==0||!p7.stable||!p7.hashes||p7.timedOut){console.log('STOP_AFTER_P7 '+JSON.stringify(p7));process.exitCode=1}else console.log('BOTH_OFFICIAL_TEST_RECEIPTS_CAPTURED '+JSON.stringify({p6,p7}));
}
