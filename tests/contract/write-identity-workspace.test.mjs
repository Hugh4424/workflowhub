// MT6-264 current ordinary write identity; MT6-141's three ordinary
// resolver obligations are carried here before its bridge-only file retires.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
const cli=new URL("../../tools/cli/stage-runtime.mjs",import.meta.url).href;
function cleanGitEnv(){const env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];return env;}
function repository(root,name){const repo=join(root,name);mkdirSync(repo);const git=args=>execFileSync("git",args,{cwd:repo,env:cleanGitEnv(),encoding:"utf8",stdio:["ignore","pipe","pipe"]});git(["init","-q","-b","main"]);git(["config","user.name","Owned identity"]);git(["config","user.email","identity@test.invalid"]);writeFileSync(join(repo,"README.md"),name+" baseline\n");git(["add","README.md"]);git(["commit","-qm","owned baseline"]);return repo;}
async function fixture(task="write-identity"){
 const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-current-write-identity-")));roots.push(root);
 const storage=join(root,"storage"),home=join(root,"home");mkdirSync(storage);mkdirSync(home);
 const repo=repository(root,"target"),wrongCwd=repository(root,"wrong-cwd"),env={HOME:home,WORKFLOWHUB_TASK_DIR:storage};
 const bootstrap=await bootstrapTask({project:"WorkflowHub",task,"target-repo":repo},{env,home});
 const worktreeRoot=bootstrap.workspace.worktree_root,taskPath=bootstrap.task_path,materialRoot=join(worktreeRoot,"specs",task);mkdirSync(materialRoot,{recursive:true});
 writeFileSync(join(materialRoot,"decision-log.md"),"# Current decision\nOwned ordinary direction.\n");writeFileSync(join(materialRoot,"spec.md"),"# Original specification\n");
 const content=join(root,"owned-draft.md");writeFileSync(content,"# Current specification\nOrdinary owned draft bytes.\n");
 return{root,storage,home,repo,wrongCwd,env,task,taskPath,worktreeRoot,materialRoot,content};
}
function publicCall(f,behavior,action,{cwd=f.worktreeRoot,taskPath=f.taskPath,task=f.task,extra=[]}={}){
 const argv=[behavior,`--action=${action}`,"--stage=build-plan","--project=WorkflowHub",`--task=${task}`,...(taskPath===null?[]:[`--task-path=${taskPath}`]),...extra];
 const code=`import{stageRuntimeCliMain}from ${JSON.stringify(cli)};try{const result=await stageRuntimeCliMain(${JSON.stringify(argv)});process.stdout.write(JSON.stringify({ok:true,result}));}catch(error){process.stdout.write(JSON.stringify({ok:false,error:{code:error.code??null,message:error.message}}));}`;
 return JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",code],{cwd,env:{...cleanGitEnv(),...f.env},encoding:"utf8",stdio:["ignore","pipe","pipe"]}));
}
const draft=f=>["--name=spec.md",`--input=${f.content}`];
describe("current ordinary write identity and workspace",()=>{
 it("distinguishes native projects sharing a task id and preserves both originals",async()=>{
  const f=await fixture("shared-native-id"),repo=repository(f.root,"paper-builder"),worktree=join(f.root,"pb-existing");
  execFileSync("git",["worktree","add","-b","pb-owned",worktree,"HEAD"],{cwd:repo,env:cleanGitEnv(),stdio:"pipe"});
  const pb=await bootstrapTask({project:"PaperBuilder",task:f.task,"target-repo":repo,"workspace-root":worktree},{env:f.env,home:f.home});
  const originals=[f.taskPath,pb.task_path].flatMap(root=>["task.json","facts.jsonl"].map(name=>({path:join(root,name),bytes:readFileSync(join(root,name))})));
  expect(resolveWorkflowHubIdentity({},worktree,f.env)).toMatchObject({project:"PaperBuilder",task:f.task,taskPath:pb.task_path});
  const explicit=publicCall(f,"status","begin");
  expect(explicit, "explicit identity must retain normal authenticated discovery").toMatchObject({ok:true,result:{task_id:f.task}});
  expect(resolveWorkflowHubIdentity({},f.worktreeRoot,f.env)).toMatchObject({project:"WorkflowHub",task:f.task,taskPath:f.taskPath});
  expect(resolveWorkflowHubIdentity({},worktree,f.env)).toMatchObject({project:"PaperBuilder",task:f.task,taskPath:pb.task_path});
  expect(publicCall(f,"status","begin")).toMatchObject({ok:true,result:{task_id:f.task}});
  expect(()=>resolveWorkflowHubIdentity({project:"PaperBuilder",task:f.task},f.worktreeRoot,f.env)).toThrow(/identity conflict/i);
  for(const original of originals)expect(readFileSync(original.path)).toEqual(original.bytes);
 });
 it("keeps unrelated project registrations with a different task id out of discovery",async()=>{
  const f=await fixture("native-control"),repo=repository(f.root,"paper-builder"),worktree=join(f.root,"pb-existing");
  execFileSync("git",["worktree","add","-b","pb-owned",worktree,"HEAD"],{cwd:repo,env:cleanGitEnv(),stdio:"pipe"});
  await bootstrapTask({project:"PaperBuilder",task:"different-native-id","target-repo":repo,"workspace-root":worktree},{env:f.env,home:f.home});
  expect(resolveWorkflowHubIdentity({},f.worktreeRoot,f.env)).toMatchObject({project:"WorkflowHub",task:f.task});
 });
 it("ignores a malformed foreign default registration when the current task branch identifies the project",async()=>{
  const f=await fixture("foreign-default-corruption"),foreign=join(f.storage,"Projects","OtherProject","tasks",f.task);
  mkdirSync(foreign,{recursive:true});writeFileSync(join(foreign,"task.json"),"{broken");
  expect(resolveWorkflowHubIdentity({},f.worktreeRoot,f.env)).toMatchObject({project:"WorkflowHub",task:f.task,taskPath:f.taskPath});
 });
 it("retains genuine duplicate-worktree conflicts",async()=>{
  const f=await fixture("duplicate-native-id");
  await bootstrapTask({project:"OtherProject",task:f.task,"target-repo":f.repo,"workspace-root":f.worktreeRoot},{env:f.env,home:f.home});
  expect(()=>resolveWorkflowHubIdentity({},f.worktreeRoot,f.env)).toThrow(/multiple task manifests/i);
 });
 it("rejects missing, malformed and identity-mismatched default manifests without rewriting them",async()=>{
  for(const variant of ["missing","malformed","null","array","missing-target","project","task"]){
   const f=await fixture(`broken-${variant}`),path=join(f.taskPath,"task.json"),original=readFileSync(path);
   if(variant==="missing")unlinkSync(path);
   else if(variant==="malformed")writeFileSync(path,"{broken");
   else if(variant==="null")writeFileSync(path,"null");
   else if(variant==="array")writeFileSync(path,"[]");
   else if(variant==="missing-target"){const manifest=JSON.parse(original);delete manifest.target_repo_root;writeFileSync(path,JSON.stringify(manifest));}
   else writeFileSync(path,JSON.stringify({...JSON.parse(original),[variant==="project"?"project_name":"task_id"]:"foreign"}));
   const before=existsSync(path)?readFileSync(path):null;
   const material=readFileSync(join(f.materialRoot,"spec.md")),facts=readFileSync(join(f.taskPath,"facts.jsonl"));
   expect(()=>resolveWorkflowHubIdentity({},f.worktreeRoot,f.env)).toThrow();
   const metadataError={null:"task manifest must be an object",array:"task manifest must be an object","missing-target":"task manifest schema or repository path is invalid",project:"task manifest identity mismatch",task:"task manifest identity mismatch"}[variant];
   if(metadataError){
    const {openTask}=await import("../../runtime/task/task-handle.mjs");
    let rejection;try{openTask(f.taskPath,"WorkflowHub",f.task);}catch(error){rejection=error;}
    expect(rejection).toBeInstanceOf(["null","array","missing-target"].includes(variant)?TypeError:Error);
    expect(rejection.message).toBe(metadataError);
    let discoveryError;try{resolveWorkflowHubIdentity({},f.worktreeRoot,f.env);}catch(error){discoveryError=error;}
    expect.soft(discoveryError).toBeInstanceOf(rejection.constructor);
    expect.soft(discoveryError?.message).toBe(metadataError);
   }
   if(variant==="missing"||variant==="malformed"){
    let rejection;try{resolveWorkflowHubIdentity({},f.worktreeRoot,f.env);}catch(error){rejection=error;}
    if(variant==="missing")expect.soft(rejection?.code,"missing manifest retains native filesystem error").toBe("ENOENT");
    else expect.soft(rejection,"malformed manifest retains native JSON parse error").toBeInstanceOf(SyntaxError);
   }
   const result=publicCall(f,"run","draft",{extra:draft(f)});
   expect(result.ok,`explicit public draft must reject ${variant} manifest`).toBe(false);
   if(variant==="missing")expect.soft(result.error.code,"public draft retains missing manifest code").toBe("ENOENT");
   if(metadataError)expect(result.error).toEqual({code:null,message:metadataError});
   expect(readFileSync(join(f.materialRoot,"spec.md"))).toEqual(material);
   expect(readFileSync(join(f.taskPath,"facts.jsonl"))).toEqual(facts);
   expect(existsSync(path)?readFileSync(path):null).toEqual(before);
  }
 });
 it("writes only in the exact declared worktree, rejects wrong cwd before bytes, and retains current status",async()=>{
  const f=await fixture(),target=join(f.materialRoot,"spec.md");
  expect(publicCall(f,"run","draft",{extra:draft(f)})).toMatchObject({ok:true,result:{artifact_ref:`specs/${f.task}/spec.md`}});
  expect(readFileSync(target)).toEqual(readFileSync(f.content));const bytes=readFileSync(target),facts=readFileSync(join(f.taskPath,"facts.jsonl"));
  const wrong=publicCall(f,"run","draft",{cwd:f.wrongCwd,extra:draft(f)});expect(wrong.ok).toBe(false);expect(wrong.error.code).toBe("WRITE_IDENTITY_PREFLIGHT_FAILED");expect(wrong.error.message).toContain("CURRENT_WORKTREE_MISMATCH");
  expect(readFileSync(target)).toEqual(bytes);expect(readFileSync(join(f.taskPath,"facts.jsonl"))).toEqual(facts);
  expect(publicCall(f,"status","begin")).toMatchObject({ok:true,result:{task_id:f.task,quality_status:"unknown"}});
 });
 it("rejects foreign task-path, workspace and explicit task identities before draft or fact writes",async()=>{
  const f=await fixture(),foreign=await fixture();const originals=[f,foreign].map(x=>({x,material:readFileSync(join(x.materialRoot,"spec.md")),facts:readFileSync(join(x.taskPath,"facts.jsonl")),manifest:readFileSync(join(x.taskPath,"task.json"))}));
  for(const options of [{taskPath:foreign.taskPath},{cwd:foreign.worktreeRoot}]){const r=publicCall(f,"run","draft",{...options,extra:draft(f)});expect(r.ok).toBe(false);expect(r.error).toMatchObject({code:"WRITE_IDENTITY_PREFLIGHT_FAILED",message:expect.stringContaining("CURRENT_WORKTREE_MISMATCH")});}
  const conflicting=publicCall(f,"run","draft",{task:"foreign-task-id",taskPath:null,extra:draft(f)});expect(conflicting.ok).toBe(false);expect(conflicting.error.message).toMatch(/identity conflict/i);
  for(const{ x,material,facts,manifest}of originals){expect(readFileSync(join(x.materialRoot,"spec.md"))).toEqual(material);expect(readFileSync(join(x.taskPath,"facts.jsonl"))).toEqual(facts);expect(readFileSync(join(x.taskPath,"task.json"))).toEqual(manifest);}
 });
 it("keeps ordinary bootstrap metadata and facts unchanged on existing-task reuse without an execution graph",async()=>{
  const f=await fixture(),manifest=readFileSync(join(f.taskPath,"task.json")),facts=readFileSync(join(f.taskPath,"facts.jsonl"));
  expect(JSON.parse(manifest)).toMatchObject({project_name:"WorkflowHub",task_id:f.task,activation_cohort:"post",record_model:"vnext-single-write",execution_mode:"per_invocation"});expect(facts.toString("utf8")).toBe("");expect(existsSync(join(f.taskPath,"identity"))).toBe(false);
  const reopened=await bootstrapTask({"task-path":f.taskPath,project:"WorkflowHub",task:f.task},{env:f.env,home:f.home});expect(reopened.task_path).toBe(f.taskPath);
  expect(readFileSync(join(f.taskPath,"task.json"))).toEqual(manifest);expect(readFileSync(join(f.taskPath,"facts.jsonl"))).toEqual(facts);expect(existsSync(join(f.taskPath,"identity"))).toBe(false);
 });
 it("accepts complete explicit project/task identity after trimming",async()=>{
  const f=await fixture("host-outcome-task");expect(resolveWorkflowHubIdentity({project:" WorkflowHub ",task:" host-outcome-task "},f.repo,f.env)).toMatchObject({project:"WorkflowHub",task:"host-outcome-task",source:"explicit",taskPath:f.taskPath});
 });
 it("fails closed for partial, missing and conflicting ordinary identity",async()=>{
  const f=await fixture("identity-bound-task");expect(()=>resolveWorkflowHubIdentity({project:"WorkflowHub"},f.repo,f.env)).toThrow(/supplied together/i);expect(()=>resolveWorkflowHubIdentity({},f.repo,f.env)).toThrow(/identity.*missing/i);expect(()=>resolveWorkflowHubIdentity({project:"Other",task:f.task},f.worktreeRoot,f.env)).toThrow(/identity conflict/i);
 });
 it("uses authenticated worktree identity and ignores controlled legacy session fields without rewriting metadata",async()=>{
  const f=await fixture("legacy-ignored-task"),path=join(f.taskPath,"task.json"),legacy={...JSON.parse(readFileSync(path,"utf8")),session_id:"old-session",active_task_id:"old-task"};const bytes=Buffer.from(JSON.stringify(legacy,null,2)+"\n");writeFileSync(path,bytes);
  expect(resolveWorkflowHubIdentity({},f.worktreeRoot,{...f.env,CODEX_SESSION_ID:"old-session-id"})).toMatchObject({project:"WorkflowHub",task:f.task,source:"worktree",taskPath:f.taskPath});expect(readFileSync(path)).toEqual(bytes);
 });
});
