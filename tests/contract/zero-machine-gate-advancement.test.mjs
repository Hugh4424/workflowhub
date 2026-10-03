import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactDir } from "../../runtime/evidence/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
const roots=[];
function git(cwd,args){return execFileSync("git",args,{cwd,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
async function fixture(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-current-zero-gate-")));roots.push(root);
 const repo=join(root,"repo"),storage=join(root,"storage"),home=join(root,"home");for(const dir of[repo,storage,home])mkdirSync(dir);
 git(repo,["init","-q","-b","main"]);git(repo,["config","user.name","Owned zero gate test"]);git(repo,["config","user.email","owned@test.invalid"]);
 writeFileSync(join(repo,"README.md"),"owned baseline\n");git(repo,["add","README.md"]);git(repo,["commit","-qm","owned baseline"]);
 const task=await createTask({storageRoot:storage,manifest:{schema_version:"1.0.0",execution_mode:"per_invocation",record_model:"vnext-single-write",activation_cohort:"post",project_name:"workflowhub",task_id:"current-zero-gate",created_at:"2026-10-03T00:00:00Z",target_repo_root:repo,issue_ids:[],inputs:{}}});
 await initializeTaskStore(task.taskPath,{taskId:task.identity.taskId});const workspace=await prepareTaskWorkspace(task),artifacts=ArtifactDir.open(workspace.worktreeRoot,task);
 for(const[name,bytes]of Object.entries({"decision-log.md":"# Decision log\n", "spec.md":"# Spec\n", "phases/index.md":"# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1.md` | zero | README.md | none | build-code |\n", "phases/P1.md":"# Phase P1\n\n### T001 — Keep ordinary current facts\n"}))await artifacts.writeAtomic(name,bytes);
 git(workspace.worktreeRoot,["add","specs"]);git(workspace.worktreeRoot,["commit","-qm","owned current materials"]);
 return{root,home,storage,task,workspace,artifacts,inputCount:0};
}
function publicCall(state,command,input){
 const args=[command,"--stage=build-code","--project=workflowhub","--task=current-zero-gate"];
 if(command==="status")args.push("--action=begin");
 if(input!==undefined){const path=join(state.root,`input-${++state.inputCount}.json`);writeFileSync(path,JSON.stringify(input)+"\n");args.push("--action=execute",`--input=${path}`);}
 const module=new URL("../../tools/cli/stage-runtime.mjs",import.meta.url).href;
 const script=`import {stageRuntimeCliMain} from ${JSON.stringify(module)};try{const value=await stageRuntimeCliMain(JSON.parse(process.argv[1]),{cwd:process.argv[2]});console.log(JSON.stringify({ok:true,value}));}catch(error){console.log(JSON.stringify({ok:false,error:{name:error.name,code:error.code??null,message:error.message}}));}`;
 return JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",script,JSON.stringify(args),state.workspace.worktreeRoot],{env:{PATH:"/usr/bin:/bin:/usr/sbin:/sbin",HOME:state.home,WORKFLOWHUB_TASK_DIR:state.storage,XDG_CONFIG_HOME:join(state.home,".config")},encoding:"utf8",timeout:10000,stdio:["ignore","pipe","pipe"]}));
}
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
describe("current ordinary facts have no machine completion permit",()=>{
 it("exposes corrupt actual facts JSON without accepting or replacing the original bytes",async()=>{
  const s=await fixture(),path=join(s.task.taskPath,"facts.jsonl"),bad=Buffer.from('{not valid JSON}\n');writeFileSync(path,bad);
  const result=publicCall(s,"status");expect(result.ok).toBe(false);expect(result.error.message).toBe("facts.jsonl line 1 is invalid JSON");expect(readFileSync(path)).toEqual(bad);
 });
 it("keeps a physically missing current material visible as not_ready rather than a completion diagnostic",async()=>{
  const s=await fixture();rmSync(s.artifacts.path("decision-log.md"));const result=publicCall(s,"status");expect(result.ok).toBe(true);
  expect(result.value.work_status).toBe("not_ready");expect(result.value.missing_materials).toContain("decision-log.md");expect(result.value.materials["decision-log.md"]).toBe(false);expect(result.value.quality_status).toBe("unknown");
 });
 it.each([{interaction_aggregate:{snapshot_tree:"f".repeat(40),decision:{}}},{receipts:{interaction:"quality/evidence/interactions/retired.json"}}])("rejects a retired aggregate/receipt progress input before modifying any task facts: %j",async legacy=>{
  const s=await fixture(),path=join(s.task.taskPath,"facts.jsonl"),before=readFileSync(path),manifest=readFileSync(join(s.task.taskPath,"task.json")),head=git(s.workspace.worktreeRoot,["rev-parse","HEAD"]);
  const result=publicCall(s,"run",legacy);expect(result.ok).toBe(false);expect(result.error.name).toBe("TypeError");expect(result.error.message).toMatch(/phase_progress.*retired|only records.*phase_progress/);
  expect(readFileSync(path)).toEqual(before);expect(readFileSync(join(s.task.taskPath,"task.json"))).toEqual(manifest);expect(git(s.workspace.worktreeRoot,["rev-parse","HEAD"])).toBe(head);
 });
 it("records a legitimate navigation cursor without manufacturing stage completion or available quality",async()=>{
  const s=await fixture();expect(publicCall(s,"status").value.quality_status).toBe("unknown");
  const run=publicCall(s,"run",{phase_progress:{phase_id:"P1",task_id:"T001"}});expect(run.ok).toBe(true);expect(run.value.status).toBe("recorded");
  const result=publicCall(s,"status");expect(result.ok).toBe(true);expect(result.value.quality_status).toBe("unknown");expect(result.value.work_status).toBe("ready");
  const rows=readTaskFacts(s.task.taskPath);expect(rows).toHaveLength(1);expect(rows[0].phase_progress).toMatchObject({phase_id:"P1",task_id:"T001"});expect(rows[0].review_origin).toBe("not_run");
  expect(rows[0].evidence.value).toBeNull();expect(rows[0].spec_analyze.value).toBeNull();expect(rows[0].handoff.value).toBeNull();expect(rows[0]).not.toHaveProperty("outline_closed");expect(rows[0]).not.toHaveProperty("status_groups");expect(rows[0]).not.toHaveProperty("completed");
 });
});
