// MT6-264 current ordinary write identity; MT6-141's three ordinary
// resolver obligations are carried here before its bridge-only file retires.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
