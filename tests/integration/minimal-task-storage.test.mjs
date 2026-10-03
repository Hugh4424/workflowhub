import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts, STAGE_ROW_KEYS, writeStageRow } from "../../runtime/task/task-store.mjs";
import { appendRecord } from "../../runtime/interface/safe-write.mjs";
const EXPECTED_STAGE_KEYS=["record_kind","task_id","stage","source","created_at","review_origin","review_result_ref","finding_dispositions","spec_analyze","evidence","serious_issue_disposition","close_action","handoff"];
const roots=[];
async function fixture(){
 const storage=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-minimal-store-")));roots.push(storage);
 const repo=join(storage,"owned-target");mkdirSync(repo);
 const git=args=>execFileSync("git",args,{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
 git(["init","-q","-b","main"]);git(["config","user.name","Owned storage test"]);git(["config","user.email","owned@test.invalid"]);git(["commit","--allow-empty","-qm","owned commit"]);
 const task=await createTask({storageRoot:storage,manifest:{schema_version:"1.0.0",project_name:"legacy",task_id:"minimal-task",created_at:"2026-10-03T00:00:00Z",target_repo_root:repo,activation_cohort:"post",execution_mode:"per_invocation",record_model:"vnext-single-write",issue_ids:[],inputs:{}}});
 await initializeTaskStore(task.taskPath,{taskId:task.identity.taskId});return{task,root:task.taskPath,head:git(["rev-parse","HEAD"])};
}
const row=(stage="build-code",review_origin="not_run")=>({record_kind:"stage",stage,source:"owned-storage-fixture",review_origin,finding_dispositions:[]});
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
describe("minimal current task storage",()=>{
 it("creates only identity, the execution record and the current two quality directories",async()=>{
  const{root}=await fixture();expect(readdirSync(root).sort()).toEqual(["facts.jsonl","quality","task.json"]);expect(readdirSync(join(root,"quality")).sort()).toEqual(["reviews","tests"]);expect(readFileSync(join(root,"facts.jsonl"),"utf8")).toBe("");
 });
 it("replaces one row per stage without adding a historical sequence or lineage field",async()=>{
  const{root}=await fixture();expect((await writeStageRow(root,row())).action).toBe("inserted");expect((await writeStageRow(root,row("build-plan"))).action).toBe("inserted");expect((await writeStageRow(root,row("build-code","unavailable"))).action).toBe("replaced");
  const rows=readTaskFacts(root);expect(rows).toHaveLength(2);expect(rows.map(value=>value.stage)).toEqual(["build-code","build-plan"]);expect(rows[0].review_origin).toBe("unavailable");expect(JSON.stringify(rows)).not.toMatch(/parent|previous|generation|selector|successor/);
 });
 it("keeps exactly one current cursor with an owned Git ID and retains it when a later same-row write omits it",async()=>{
  const{root,head}=await fixture(),cursor={phase_id:"P2",task_id:"T004",phases_head:head,recorded_at:"2026-10-03T01:02:03Z"};
  await writeStageRow(root,{...row(),source:"phase-progress-cursor",phase_progress:cursor});expect(readTaskFacts(root)[0].phase_progress).toEqual(cursor);expect([...STAGE_ROW_KEYS].sort()).toEqual([...EXPECTED_STAGE_KEYS].sort());expect(Object.keys(readTaskFacts(root)[0]).sort()).toEqual([...EXPECTED_STAGE_KEYS,"phase_progress"].sort());
  await writeStageRow(root,{...row(),source:"later-ordinary-stage-fact"});const rows=readTaskFacts(root);expect(rows).toHaveLength(1);expect(rows[0].phase_progress).toEqual(cursor);expect(rows[0].review_origin).toBe("not_run");expect(rows[0].evidence.value).toBeNull();expect(rows[0]).not.toHaveProperty("completed");
 });
 it("reads original historical fields passively and keeps their line byte-for-byte during a different current stage write",async()=>{
  const{root}=await fixture(),path=join(root,"facts.jsonl"),old={...row("build-spec"),task_id:"minimal-task",created_at:"2026-08-30T00:00:00Z",review_result_ref:{value:null,reason:"old"},spec_analyze:{value:null,reason:"old"},evidence:{value:null,reason:"old"},serious_issue_disposition:{value:null,reason:"old"},close_action:{value:null,reason:"old"},handoff:{value:null,reason:"old"},snapshot_tree:"historical-source",material_digest:{value:"historical-source"},layer_states:{implementation_completion:"completed"}};
  expect(Object.keys(old)).toHaveLength(16);const raw="  "+JSON.stringify(old)+"  \n";writeFileSync(path,raw);expect(readTaskFacts(root)).toEqual([old]);expect(readFileSync(path,"utf8")).toBe(raw);
  await writeStageRow(root,row());const rows=readTaskFacts(root);expect(rows).toHaveLength(2);expect(rows[0]).toEqual(old);expect(readFileSync(path,"utf8").split("\n")[0]+"\n").toBe(raw);expect(rows[1]).not.toHaveProperty("snapshot_tree");expect(rows[1]).not.toHaveProperty("material_digest");expect(rows[1]).not.toHaveProperty("layer_states");
 });
 it("exposes bad JSON or real historical task identity mismatch without rewriting original sources",async()=>{
  const{root}=await fixture(),path=join(root,"facts.jsonl");
  for(const[raw,error]of[['{not JSON}\n',/facts\.jsonl line 1 is invalid JSON/],[JSON.stringify({task_id:"foreign",stage:"build-code"})+"\n",/invalid task identity/],[JSON.stringify({task_id:"minimal-task",project_name:"foreign"})+"\n",/invalid task identity/]]){writeFileSync(path,raw);expect(()=>readTaskFacts(root)).toThrow(error);expect(readFileSync(path,"utf8")).toBe(raw);}
 });
 it("stores immutable ordinary named fixture records in separate review/test directories without a hash-addressed publisher",async()=>{
  const{root,task}=await fixture();
  for(const kind of["reviews","tests"]){const bytes=JSON.stringify({task_id:"minimal-task",stage:"build-code",status:"unavailable",source:"owned storage-only fixture; no executed quality verdict"})+"\n";const path=await appendRecord(join(root,"quality",kind),"owned-storage","json",bytes);expect(relative(root,path)).toMatch(new RegExp('^quality/'+kind+'/[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}-owned-storage\\.json$'));expect(task.readRecord(relative(root,path))).toBe(bytes);const secondBytes=JSON.stringify({task_id:"minimal-task",stage:"build-code",status:"unavailable",source:"second distinct storage-only fixture; no executed quality verdict"})+"\n";const second=await appendRecord(join(root,"quality",kind),"owned-storage","json",secondBytes);expect(second).not.toBe(path);expect(relative(root,second)).toMatch(new RegExp('^quality/'+kind+'/[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}-owned-storage\\.json$'));expect(task.readRecord(relative(root,path))).toBe(bytes);expect(task.readRecord(relative(root,second))).toBe(secondBytes);expect(readdirSync(join(root,"quality",kind))).toHaveLength(2);}
  expect(readdirSync(root).sort()).toEqual(["facts.jsonl","quality","task.json"]);expect(readTaskFacts(root)).toEqual([]);
 });
 it("keeps current ordinary stage/close-action fields and typed storage failures without retired completion certification",async()=>{
  const{root}=await fixture(),path=join(root,"facts.jsonl");await writeStageRow(root,{...row(),review_origin:"conducted",review_result_ref:{value:"quality/reviews/owned.json"},finding_dispositions:[{finding:"F-1",disposition:"user_decided"}]});
  const first=readTaskFacts(root)[0];expect([...STAGE_ROW_KEYS].sort()).toEqual([...EXPECTED_STAGE_KEYS].sort());expect(Object.keys(first).sort()).toEqual([...EXPECTED_STAGE_KEYS].sort());expect(first.finding_dispositions).toEqual([{finding:"F-1",disposition:"user_decided"}]);
  await writeStageRow(root,{...row("close"),record_kind:"close_action",close_action:{action:"push",result:"owned fixture only—not actual Git delivery",ref:"owned/ref"}});expect(readTaskFacts(root).find(value=>value.record_kind==="close_action").close_action.ref).toBe("owned/ref");
  const before=readFileSync(path);
  for(const bad of[{...row(),review_origin:"conducted"},{...row(),close_action:{value:null}},{...row(),close_action:{value:{action:"push",result:"no"}}},{...row(),phase_progress:{phase_id:"P1",task_id:"T001",material_revision:"retired",recorded_at:"2026-10-03T00:00:00Z"}},...['layer_states','material_digest','snapshot_tree','selector'].map(key=>({...row(),[key]:"retired"}))]){await expect(writeStageRow(root,bad)).rejects.toThrow(/reference|reason|close action|phase_progress|unsupported fields/);expect(readFileSync(path)).toEqual(before);}
 });
 it("writes the two current stage rows without creating an index or status projection",async()=>{
  const{root}=await fixture();await writeStageRow(root,row());await writeStageRow(root,row("verify-code"));expect(readTaskFacts(root).map(value=>value.stage)).toEqual(["build-code","verify-code"]);expect(readdirSync(root).sort()).toEqual(["facts.jsonl","quality","task.json"]);
 });
});
