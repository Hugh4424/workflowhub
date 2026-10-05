import {afterEach,expect,test,vi} from "vitest";
import {execFileSync} from "node:child_process";
import {createHash,randomUUID} from "node:crypto";
import {existsSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync,symlinkSync,linkSync,unlinkSync} from "node:fs";
import {join,relative} from "node:path";
import {tmpdir} from "node:os";
import {createTask} from "../../runtime/task/task-handle.mjs";
import {recordSimpleReviewRequest} from "../../runtime/review/review-record-route.mjs";
import {reviewMaterialBytes} from "../../skills/wh-review/scripts/review-materials.mjs";
import {runSimpleReview} from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import {stageRuntimeMain,stageRuntimeCliMain,prepareTaskBoundBuildCodeReviewBundle,writeManagedStallDiagnostic} from "../../tools/cli/stage-runtime.mjs";
import {prepareConfiguredOcrHostContext,runConfiguredOcrHostReview,runOcrDelegationRound} from "../../runtime/review/ocr-delegation-adapter.mjs";
import {openTask} from "../../runtime/task/task-handle.mjs";
import {openCurrentTaskWorkspace} from "../../runtime/task/workspace.mjs";
import {ArtifactDir} from "../../runtime/evidence/artifact-dir.mjs";
const roots=[];afterEach(()=>{vi.unstubAllEnvs();for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
const sha=b=>createHash("sha256").update(b).digest("hex"),providers=["review/a","review/b","review/c"];
const finding={severity:"minor",path:"materials/01-approved_spec.md",line:1,issue:"C's original finding.",recommendation:"Keep this original unchanged.",evidence_kind:"direct",evidence:"owned current specification"};
const request=()=>({stage:"build-code",review_scope:"phase",subject_kind:"phase",phase_id:"P2",surface:"document",materials:{approved_spec:"owned current specification",acceptance_criteria:"AC-60: only retry A and preserve B/C.",test_evidence:"owned test"}});
function selection(){return{providers,provider_models:Object.fromEntries(providers.map(p=>[p,"model-"+p])),provider_identities:Object.fromEntries(providers.map(p=>[p,{source_id:"source-"+p,config_id:"config-"+p}]))};}
function member(p,repaired=false){const good=p==="review/c"||repaired;return{provider:p,identity:{provider:p,adapter:"review",model:"model-"+p,source_id:"source-"+p,config_id:"config-"+p},status:good?"completed":"failed",error:good?null:{code:p==="review/a"?"BROKER_SPAWN_FAILED":"PROCESS_TIMEOUT",message:"owned source failed"},output:good?JSON.stringify({findings:p==="review/c"?[finding]:[]}):null,timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},usage:null};}
async function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),"card09-dispatch-")));roots.push(root);mkdirSync(join(root,"repo"));const task=await createTask({storageRoot:root,manifest:{schema_version:"1.0.0",project_name:"workflowhub",task_id:randomUUID(),created_at:new Date().toISOString(),target_repo_root:join(root,"repo"),activation_cohort:"post",execution_mode:"per_invocation",record_model:"vnext-single-write",issue_ids:[],inputs:{}}});let repaired=false;const dispatch=[];const client={runGroup:async({providers:selected,materials})=>{dispatch.push([...selected]);return{runtimeId:"owned-runtime",material_id:materials.materialId,outcome:"completed",providers:selected.map(p=>member(p,repaired))};}};const dependencies={loadConfig:()=>({whReview:{},config:"unused",attachmentRoot:root,command:["unused"]}),resolveRoute:()=>({initial:providers,mode:"single_round"}),selectProviders:selection,client,taskId:task.identity.taskId,readSupplementRecord:({record_ref})=>readFileSync(join(task.taskPath,record_ref))};const record=async input=>{const saved=await recordSimpleReviewRequest({taskDir:task.taskPath,request:input,runRound:(actual,options)=>runSimpleReview(actual,{...dependencies,...options})});return{saved,bytes:readFileSync(saved.path),value:JSON.parse(readFileSync(saved.path,"utf8"))};};const first=await record(request());const supplements={record_ref:relative(task.taskPath,first.saved.path),record_sha256:sha(first.bytes)};return{root,task,first,supplements,dispatch,record,repair:()=>{repaired=true;}};}
test("only failed A is supplemented with actual material binding and dispatch reason; original C record bytes stay unchanged",async()=>{const f=await fixture();f.repair();const result=await f.record({...request(),only_providers:["review/a"],dispatch_reason:"A configuration repaired",supplements:f.supplements});expect(f.dispatch).toEqual([providers,["review/a"]]);expect(readFileSync(f.first.saved.path)).toEqual(f.first.bytes);expect(result.value.request).toMatchObject({only_providers:["review/a"],dispatch_reason:"A configuration repaired",supplements:f.supplements,material_id:f.first.value.request.material_id});expect(typeof result.value.request.material_id).toBe("string");});
test.each(["empty selection","outside selection","missing reason","duplicate","completed C","wrong hash","changed material","wrong subject","missing prior material id"])("rejects %s before dispatch",async mode=>{const f=await fixture(),input={...request(),only_providers:["review/a"],dispatch_reason:"A repaired",supplements:{...f.supplements}};if(mode==="empty selection")input.only_providers=[];if(mode==="outside selection")input.only_providers=["review/foreign"];if(mode==="missing reason")delete input.dispatch_reason;if(mode==="duplicate")input.only_providers=["review/a","review/a"];if(mode==="completed C")input.only_providers=["review/c"];if(mode==="wrong hash")input.supplements.record_sha256="0".repeat(64);if(mode==="changed material")input.materials.approved_spec="different current material";if(mode==="wrong subject")input.phase_id="P1";if(mode==="missing prior material id"){const modified=structuredClone(f.first.value);delete modified.request.material_id;const ref="quality/reviews/owned-no-material.json";writeFileSync(join(f.task.taskPath,ref),JSON.stringify(modified));input.supplements={record_ref:ref,record_sha256:sha(readFileSync(join(f.task.taskPath,ref)))};}const result=await f.record(input);expect(result.value).toMatchObject({status:"unavailable",dispatch_state:"blocked_before_dispatch",error:{code:"ROUTE_UNAVAILABLE"}});expect(result.value.error.diagnostic).toMatchObject({field:"only_providers",next_action:expect.any(String)});expect(f.dispatch).toHaveLength(1);});

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function nativeFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-review-contract-current-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `ocr-review-contract-current-${Math.random().toString(16).slice(2)}`;
  const worktreeRoot = join(root, "worktree");
  git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktreeRoot, "main"]);
  const taskDir = join(root, "Projects", "workflowhub", "tasks", taskId);
  mkdirSync(taskDir, { recursive: true });
  writeFileSync(join(taskDir, "task.json"), JSON.stringify({
    schema_version: "1.0.0", record_model: "vnext-single-write", activation_cohort: "post",
    project_name: "workflowhub", task_id: taskId, created_at: "2026-10-03T00:00:00.000Z",
    target_repo_root: worktreeRoot, workspace_mode: "existing", workspace_root: worktreeRoot,
    issue_ids: [], inputs: {},
  }));
  writeFileSync(join(taskDir, "facts.jsonl"), "");
  const materialRoot = join(worktreeRoot, "specs", taskId);
  mkdirSync(join(materialRoot, "phases"), { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  const gate = "npx --no-install vitest run tests/contract/ocr-review-contract-current.test.mjs --reporter=dot";
  const paths = ["prior-one.md", "prior-two.md", "README.md"];
  const trace = paths.map((_file, i) => `| R-001 | FR-1 | AC-1 | P${i + 1}/T00${i + 1} | ORACLE-OCR-FALLBACK |`);
  writeFileSync(join(materialRoot, "spec.md"), [
    "# Owned OCR routing fixture", "- **FR-1**：OCR availability and same-surface fallback.",
    "- [ ] **AC-1 — OCR routing**", "  - **需求**：FR-1",
    "  - **验证方法**：actual assertions in this frozen fallback test.",
    "  - **通过条件**：actual routing and failure assertions pass.", "  - **失败条件**：wrong route or false fallback.",
    "## 实现设计（全局权威）", "### Code Anchors", "The owned source is `README.md`.",
    "### Interfaces and Failure Semantics", "Preserve current code surface and unavailable provider errors.",
    "### Requirement-to-Task Trace", "| source | FR | AC | task | oracle |", "| --- | --- | --- | --- | --- |", ...trace,
    "### Global Verification Strategy", `\`${gate}\``, "",
  ].join("\n"));
  writeFileSync(join(materialRoot, "phases", "index.md"), [
    "# Phase index", "## Execution Index",
    "| phase | authority ref | semantic anchor | write set | dependency | consumer |", "| --- | --- | --- | --- | --- | --- |",
    ...paths.map((file, i) => `| \`P${i + 1}\` | \`phases/P${i + 1}.md\` | \`phase-p${i + 1}\` | \`${file}\` | ${i === 0 ? "none" : `P${i}`} | OCR routing fixture |`), "",
  ].join("\n"));
  for (const [i, file] of paths.entries()) {
    const n = i + 1;
    writeFileSync(join(materialRoot, "phases", `P${n}.md`), [
      `# Phase P${n} — owned fixture`, "- **Global spec**：`spec.md`", `- **Write set**：\`${file}\``,
      `- **Dependency**：${i === 0 ? "none" : `P${i}`}`, "- **Consumer**：OCR routing fixture", "## L0",
      `- **gate_cmd**：\`${gate}\``, "- **expected_exit**：0 only after actual assertions pass",
      "- **oracle**：ORACLE-OCR-FALLBACK", "- **evidence_path**：quality/tests/output/owned-fixture.output",
      "- **STOP**：preserve an actual routing failure", "- **Done**：actual assertions only, not production quality", "## L1",
      `### T00${n} — owned routing fixture`, "- **Source / FR / AC**：R-001 / FR-1 / AC-1",
      `- **Files / symbols**：\`${file}\` (symbol: N/A — fixture source text)`, "- **Action**：read the actual routing fixture",
      "- **Inputs**：owned Git and plain task metadata", "- **Outputs / failure**：same code surface or observable unavailable",
      "- **Boundary / DO NOT TOUCH**：no production or user repositories", `- **Dependency**：${i === 0 ? "none" : `T00${i}`}`,
      "- **Test tier / skill**：feature / backend-testing", "- **Scenario / fixture or service**：owned CLI and injected reviewer result",
      `- **RED/GREEN gate_cmd**：\`${gate}\``, "- **expected_exit**：RED nonzero; GREEN 0",
      "- **RED target failure**：ORACLE-OCR-FALLBACK wrong routing assertion fails", "- **GREEN oracle**：ORACLE-OCR-FALLBACK actual assertions",
      "- **Evidence**：quality/tests/output/owned-fixture.output", "- **STOP / recovery**：no claimed provider call without one",
      "- **Coverage limit**：no external provider quality", "- **Done**：actual targeted assertions only", "## L2",
      "Owned fixture data, not a WorkflowHub execution permit.", "",
    ].join("\n"));
  }
  writeFileSync(join(worktreeRoot, "README.md"), "fallback implementation under review\n");

  // host config：third_review/wh_review 可解析，但 provider 命令指向不存在路径
  // （「config 无可用 provider」）。
  const home = join(root, "home");
  const hostDir = join(home, ".config", "workflowhub");
  mkdirSync(hostDir, { recursive: true });
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  const configPath = join(root, "providers.json");
  writeFileSync(configPath, JSON.stringify({
    tiers: [["codex/a","codex/b","codex/c"]],
    providers: Object.fromEntries(["codex/a","codex/b","codex/c"].map(id=>[id,{enabled:true,model:"reviewer-model",source_id:"source-"+id,command:join(root,"missing-ocr-provider")}])),
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: [join(root, "missing-wh-review-broker")], config: configPath, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/a","codex/b","codex/c"], mode: "full_only", minimum_heterologous: 1 } } },
  }));
  const task = openTask(taskDir, { projectName: "workflowhub", taskId });
  return { root, home, taskId, taskDir, worktreeRoot, task };
}


async function contextFor(state) {
  return { task: state.task, manifest: state.task.manifest, workspace: await openCurrentTaskWorkspace(state.task), artifacts: ArtifactDir.open(state.worktreeRoot, state.task) };
}

// Public record -> standard trusted context -> real native consumer. Only execution is simulated.
test.each([false,true])("public code supplement selects only failed A and final native navigation resolves complete bytes (%s)",async large=>{
 const f=nativeFixture();vi.stubEnv("HOME",f.home);vi.stubEnv("WORKFLOWHUB_TASK_DIR",f.root);
 if(large)writeFileSync(join(f.worktreeRoot,"README.md"),"x".repeat(300000)+"\n");
 const context=await contextFor(f),calls=[];let repaired=false;const snapshots=[];
 const services={runOcrDelegationRound:async(request,options)=>{
   const bundle=options.bundle??prepareTaskBoundBuildCodeReviewBundle(context,request);
   const trustedContext=options.trustedContext??prepareConfiguredOcrHostContext(request);
   try{return await runOcrDelegationRound(request,{buildBundle:()=>bundle,executor:params=>runConfiguredOcrHostReview(params,{trustedContext,sourceBundle:bundle,providerExecutor:async({provider,cwd})=>{
     calls.push(provider);const entries=params.packet.manifest;
     const instruction=readFileSync(join(cwd,"review-instructions.md"),"utf8");const nav=instruction.split("\n").slice(0,4).join("\n");console.log("NATIVE_NAV_META",JSON.stringify({provider,nav,manifest_paths:entries.map(e=>e.path)}));expect(nav).toContain("先读");
     for(const path of [...nav.matchAll(/\x60([^\x60]+)\x60/g)].map(m=>m[1])){const entry=entries.find(e=>e.path===path);expect(entry,path).toBeTruthy();expect(sha(readFileSync(join(cwd,path)))).toBe(entry.sha256);}
     const ac=entries.find(e=>/^requirements\/acceptance_criteria\.(md|json)$/.test(e.path));expect(nav).toContain(ac.path);expect(readFileSync(join(cwd,ac.path),"utf8")).toContain("AC-1");
     if(large){expect(nav).toContain("diff-index.json");const index=JSON.parse(readFileSync(join(cwd,"diff-index.json"),"utf8"));const nativeShards=index.changes.flatMap(c=>c.shards);for(const shard of nativeShards){const entry=entries.find(e=>e.path===shard.ref);expect(entry,shard.ref).toBeTruthy();expect(sha(readFileSync(join(cwd,shard.ref)))).toBe(entry.sha256);expect(entry.sha256).toBe(shard.sha256);}const bytes=Buffer.concat(nativeShards.map(sh=>readFileSync(join(cwd,sh.ref))));const originalIndex=JSON.parse(readFileSync(join(bundle.bundleRoot,"diff-index.json"),"utf8"));const originalBytes=Buffer.concat(originalIndex.changes.flatMap(c=>c.shards).map(sh=>readFileSync(join(bundle.bundleRoot,sh.ref))));const sourceIdentity=JSON.parse(readFileSync(join(bundle.bundleRoot,"source.json"),"utf8")),env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];env.GIT_OPTIONAL_LOCKS="0";const completeSource=execFileSync("git",["diff","--binary",sourceIdentity.baseline_commit,"--","README.md"],{cwd:f.worktreeRoot,env,maxBuffer:8*1024*1024});const expectedDiff=reviewMaterialBytes("changes.diff",completeSource);expect(originalBytes).toEqual(expectedDiff);expect(bytes).toEqual(expectedDiff);console.log("NATIVE_COMPLETE_DIFF",JSON.stringify({provider,source_bytes:completeSource.length,normalized_bytes:expectedDiff.length,source_sha:sha(expectedDiff),native_sha:sha(bytes),shards:nativeShards.length}));}
     snapshots.push({provider,nav,paths:entries.map(e=>e.path)});
     const good=repaired||provider==="codex/c";return {status:good?"completed":"failed",error:good?null:{code:"OWNED_FAILED",message:"repair A"},output:good?JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\n"+JSON.stringify({type:"turn.completed"})+"\n":null,timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},usage:null};
   }})});}finally{if(!options.bundle)bundle.dispose();}
 }};
 const request={stage:"build-code",review_scope:"phase",subject_kind:"phase",phase_id:"P3",surface:"code",materials:{approved_spec:"Current source risk AC-1.",phase_map:"README.md real consumer.",acceptance_criteria:"AC-1: current native navigation and supplement.",test_evidence:"owned simulated provider fixture"}};
 const invoke=async req=>{const input=join(f.taskDir,"quality","evidence","execution-inputs","owned-"+randomUUID()+".json");mkdirSync(join(f.taskDir,"quality","evidence","execution-inputs"),{recursive:true});writeFileSync(input,JSON.stringify({request:req}));const saved=await stageRuntimeCliMain(["review","--action=record","--stage=build-code","--project=workflowhub","--task="+f.taskId,"--task-path="+f.taskDir,"--input="+input],{cwd:f.worktreeRoot,services});return{saved,bytes:readFileSync(saved.path),record:JSON.parse(readFileSync(saved.path,"utf8"))};};
 const first=await invoke(request);console.log("NATIVE_FIRST",JSON.stringify({status:first.record.status,error:first.record.error,members:first.record.provider_results.map(m=>({provider:m.provider,status:m.status,error:m.error}))}));expect(calls).toEqual(["codex/a","codex/b","codex/c"]);expect(first.record.provider_results.find(m=>m.provider==="codex/c").status).toBe("completed");repaired=true;
 const next=await invoke({...request,only_providers:["codex/a"],dispatch_reason:"A repaired",supplements:{record_ref:first.saved.result_ref,record_sha256:sha(first.bytes)}});
 expect(calls).toEqual(["codex/a","codex/b","codex/c","codex/a"]);expect(next.record.request.material_id).toBe(first.record.request.material_id);expect(readFileSync(first.saved.path)).toEqual(first.bytes);expect(snapshots).toHaveLength(4);
 if(!large){
  const hostPath=join(f.home,".config","workflowhub","config.json"),providerPath=join(f.root,"providers.json"),hostBytes=readFileSync(hostPath),providerBytes=readFileSync(providerPath);
  for(const mode of ["missing material","route conflict","wrong lifecycle","invalid parse"]){
    const invalid=structuredClone(request);if(mode==="missing material")delete invalid.materials.approved_spec;
    if(mode==="route conflict"){const host=JSON.parse(hostBytes);host.wh_review.stages["build-code"].mode="single_round";writeFileSync(hostPath,JSON.stringify(host));}
    if(mode==="wrong lifecycle")invalid.review_scope="wrong";
    if(mode==="invalid parse")writeFileSync(providerPath,"{not valid JSON");
    const before=calls.length;let observed;
    try{const out=await invoke(invalid);observed={code:out.record.error?.code,diagnostic:out.record.error?.diagnostic,dispatch_state:out.record.dispatch_state};}
    catch(error){observed={code:error.code,diagnostic:error.diagnostic,message:error.message};}
    finally{writeFileSync(hostPath,hostBytes);writeFileSync(providerPath,providerBytes);}
    console.log("CONTROLLED_PUBLIC_NATIVE",JSON.stringify({mode,...observed,dispatchCount:calls.length-before}));expect(observed.diagnostic).toBeTruthy();expect(observed.code).toBe(mode==="missing material"?"MATERIAL_INCOMPLETE":mode==="wrong lifecycle"?"REVIEW_IDENTITY_INVALID":"ROUTE_UNAVAILABLE");expect(calls.length).toBe(before);
  }
  for(const mode of ["outside root","symlink","hardlink","wrong hash","wrong task","completed C"]){
    const alias=join(f.taskDir,"quality","reviews","owned-"+randomUUID()+".json"),input={...request,only_providers:["codex/a"],dispatch_reason:"A repaired",supplements:{record_ref:first.saved.result_ref,record_sha256:sha(first.bytes)}};
    if(mode==="outside root")input.supplements.record_ref="../foreign.json";
    if(mode==="wrong hash")input.supplements.record_sha256="0".repeat(64);
    if(mode==="completed C")input.only_providers=["codex/c"];
    if(mode==="symlink"||mode==="hardlink"){(mode==="symlink"?symlinkSync:linkSync)(first.saved.path,alias);input.supplements.record_ref=relative(f.taskDir,alias);}
    if(mode==="wrong task"){const old=JSON.parse(first.bytes);old.task_id="foreign-task";writeFileSync(alias,JSON.stringify(old));input.supplements={record_ref:relative(f.taskDir,alias),record_sha256:sha(readFileSync(alias))};}
    const before=calls.length;try{const out=await invoke(input);console.log("SUPPLEMENT_PUBLIC_REJECT",JSON.stringify({mode,code:out.record.error?.code,dispatchCount:calls.length-before}));expect(out.record.error.code).toBe("ROUTE_UNAVAILABLE");expect(out.record.error.diagnostic.field).toBe("only_providers");expect(calls.length).toBe(before);}finally{if(existsSync(alias)||mode==="symlink")unlinkSync(alias);}
  }
 }

});

// Default native fallback returns terminal directly; this fixture mirrors that lifecycle.
// It proves actual public fallback/runner binding with simulated provider output, not live native dispatch or stall polling.
test.each(["supplement","callback"])('not-installed fallback preserves explicit supplement binding and declared callback transfer (%s)',async mode=>{
 const f=nativeFixture();vi.stubEnv("HOME",f.home);vi.stubEnv("WORKFLOWHUB_TASK_DIR",f.root);
 const context=await contextFor(f),request={stage:"build-code",review_scope:"phase",subject_kind:"phase",phase_id:"P3",surface:"code",materials:{approved_spec:"Current accepted scope.",acceptance_criteria:"AC-1: keep the original C and repair only A.",test_evidence:"owned fallback transport simulation"}};
 const trusted=prepareConfiguredOcrHostContext(request),configSha=trusted.provider_config_sha256;
 const bin=join(f.root,"no-ocr-bin");mkdirSync(bin);symlinkSync(execFileSync("which",["git"],{encoding:"utf8"}).trim(),join(bin,"git"));vi.stubEnv("PATH",bin);
 let repaired=false,statusPolls=0;const dispatch=[],received=[];
 const client={startManaged:async({requestId,providers:selected,materials,nativePacketFallback})=>{
   expect(nativePacketFallback).toBe(true);dispatch.push([...selected]);
   const entries=materials.deliveryManifest??materials.manifest,nav=readFileSync(join(materials.bundleRoot,"review-instructions.md"),"utf8").split("\n").slice(0,4).join("\n"),paths=[...nav.matchAll(/\x60([^\x60]+)\x60/g)].map(match=>match[1]);
   console.log("FALLBACK_NAV_META",JSON.stringify({native_source_packet:true,paths:paths.map(path=>({path,listed:entries.some(entry=>entry.path===path)}))}));
   expect(nav).toContain("先读");for(const path of paths){const entry=entries.find(entry=>entry.path===path);expect(entry,path).toBeTruthy();const bytes=readFileSync(join(materials.bundleRoot,path));expect(bytes.length).toBe(entry.bytes);expect(sha(bytes)).toBe(entry.sha256);}
   const acEntry=(materials.deliveryManifest??materials.manifest).find(entry=>/^requirements\/acceptance_criteria\.(md|json)$/.test(entry.path));expect(acEntry).toBeTruthy();const acLines=readFileSync(join(materials.bundleRoot,acEntry.path),"utf8").split("\n"),acLine=acLines.findIndex(line=>line.includes("AC-1"));expect(acLine).toBeGreaterThanOrEqual(0);
   const members=selected.map(provider=>{const completed=repaired||provider==="codex/c",identity=trusted.selection.provider_identities[provider];return{provider,identity:{provider,adapter:"codex",...identity,model:trusted.selection.provider_models[provider]},status:completed?"completed":"failed",error:completed?null:{code:"OWNED_FALLBACK_FAILURE",message:"A needs explicit repair"},output:completed?JSON.stringify({findings:provider==="codex/c"?[{severity:"minor",path:acEntry.path,line:acLine+1,issue:"Keep C's original source advice.",recommendation:"Repair only the selected failed source.",evidence_kind:"direct",evidence:acLines[acLine]}]:[]}):null,timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},usage:null};});
   return{state:"terminal",request_id:requestId,runtime_id:"owned-native-fallback",material_id:materials.materialId,group:{runtime_id:"owned-native-fallback",material_id:materials.materialId,outcome:"completed",providers:members},transport:"codex-native"};
 },statusManaged:async()=>{statusPolls++;throw new Error("native terminal fallback must not poll");}};
 const services={runReviewRound:(current,options)=>{received.push(options);return runSimpleReview(current,{...options,loadConfig:()=>({...trusted.trusted,command:["unused"]}),resolveRoute:()=>trusted.route,selectProviders:()=>trusted.selection,client,buildBundle:options.buildBundle});}};
 const invoke=async req=>{const input=join(f.taskDir,"quality","evidence","execution-inputs","fallback-"+randomUUID()+".json");mkdirSync(join(f.taskDir,"quality","evidence","execution-inputs"),{recursive:true});writeFileSync(input,JSON.stringify({request:req}));const saved=await stageRuntimeCliMain(["review","--action=record","--stage=build-code","--project=workflowhub","--task="+f.taskId,"--task-path="+f.taskDir,"--input="+input],{cwd:f.worktreeRoot,services});return{saved,bytes:readFileSync(saved.path),record:JSON.parse(readFileSync(saved.path,"utf8"))};};
 const first=await invoke(request);console.log("FIRST_FALLBACK",JSON.stringify({status:first.record.status,error:first.record.error??null,discarded:first.record.discarded_facts??[],members:first.record.provider_results.map(member=>({provider:member.provider,status:member.status,error:member.error,identity_authenticated:member.identity_authenticated,evidence_anchor_valid:member.evidence_anchor_valid}))}));expect(first.record).toMatchObject({status:"available",executor:"wh-review",fallback:{from:"ocr",reason:"not_installed: ENOENT"}});expect(first.record.findings).toMatchObject([{provider:"codex/c",issue:"Keep C's original source advice."}]);expect(dispatch).toEqual([["codex/a","codex/b","codex/c"]]);expect(first.record.provider_results).toMatchObject([{provider:"codex/a",status:"failed",error:{code:"OWNED_FALLBACK_FAILURE"}},{provider:"codex/b",status:"failed",error:{code:"OWNED_FALLBACK_FAILURE"}},{provider:"codex/c",status:"completed",error:null}]);
 if(mode==="supplement"){repaired=true;const supplements={record_ref:first.saved.result_ref,record_sha256:sha(first.bytes)},next=await invoke({...request,only_providers:["codex/a"],dispatch_reason:"A repair completed",supplements});console.log("FALLBACK_SUPPLEMENT",JSON.stringify({status:next.record.status,error:next.record.error??null,dispatch,prior_record_sha:sha(first.bytes),current_record_unchanged:sha(readFileSync(first.saved.path))===sha(first.bytes)}));expect(next.record.status).toBe("available");expect(dispatch).toEqual([["codex/a","codex/b","codex/c"],["codex/a"]]);expect(next.record.request).toMatchObject({material_id:first.record.request.material_id,only_providers:["codex/a"],dispatch_reason:"A repair completed",supplements});expect(readFileSync(first.saved.path)).toEqual(first.bytes);}
 else {console.log("FALLBACK_CALLBACK_TRANSFER",JSON.stringify({nativePacketFallback:received[0].nativePacketFallback,onManagedStall_type:typeof received[0].onManagedStall,readSupplementRecord_type:typeof received[0].readSupplementRecord,status_polls:statusPolls,stall_effect:"not_applicable: actual native fallback returns terminal without managed polling"}));expect(received[0].onManagedStall).toBe(writeManagedStallDiagnostic);expect(typeof received[0].readSupplementRecord).toBe("function");}
 expect(statusPolls).toBe(0);expect(trusted.provider_config_sha256).toBe(configSha);
});
