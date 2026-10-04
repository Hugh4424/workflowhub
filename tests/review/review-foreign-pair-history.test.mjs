// MT6-311: ordinary historical bytes remain passive; post is the only new review writer.
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
const roots=[]; afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function fixture(cohort="post") {
 const root=realpathSync(mkdtempSync(join(tmpdir(),"review-passive-history-")));roots.push(root);
 const repo=join(root,"owned-repository");mkdirSync(repo);
 const taskId=randomUUID(),taskPath=join(root,"Projects","workflowhub","tasks",taskId);
 const manifest={schema_version:"1.0.0",project_name:"workflowhub",task_id:taskId,created_at:"2026-10-03T00:00:00.000Z",target_repo_root:repo,activation_cohort:"post",record_model:"vnext-single-write",execution_mode:"per_invocation",issue_ids:[],inputs:{}};
 let task;
 if(cohort==="post")task=await createTask({storageRoot:root,taskPath,manifest});
 else {mkdirSync(taskPath,{recursive:true});if(cohort===null)delete manifest.activation_cohort;else manifest.activation_cohort=cohort;manifest.snapshot_tree="passive-old-value";writeFileSync(join(taskPath,"task.json"),JSON.stringify(manifest,null,2)+"\n");task=openTask(taskPath,{projectName:"workflowhub",taskId});}
 const facts=Buffer.from(JSON.stringify({task_id:taskId,stage:"build-code",snapshot_tree:"passive-old-facts"})+"\n");writeFileSync(join(taskPath,"facts.jsonl"),facts);
 mkdirSync(join(taskPath,"legacy"));const history=Buffer.from("# Historical partial pair\nmissing blue role binding; prior unavailable is not quality passed\n");writeFileSync(join(taskPath,"legacy","history.md"),history);
 return{task,taskPath,taskId,manifestBytes:readFileSync(join(taskPath,"task.json")),facts,history};
}
const request={stage:"build-plan",surface:"document",subject_kind:"document",subject:{scope:"owned current material"},materials:{approved_spec:"current ordinary specification"}};
const unavailable=()=>({status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],error:{code:"OWNED_REVIEW_UNAVAILABLE",message:"controlled local fixture, no provider"}});
it("preserves old partial and malformed pair bytes while a post ordinary review writes only current facts",async()=>{
 const f=await fixture();mkdirSync(join(f.taskPath,"quality","reviews","results"),{recursive:true});
 const partial=Buffer.from(JSON.stringify({outcome:"partial",role_results:{blue:{result_ref:null}},snapshot_tree:"old-passive"})+"\n"),broken=Buffer.from('{"old_pair":');
 writeFileSync(join(f.taskPath,"quality","reviews","results","partial.json"),partial);writeFileSync(join(f.taskPath,"quality","reviews","results","broken.json"),broken);
 let rounds=0;const result=await recordSimpleReviewRequest({taskDir:f.taskPath,request,runRound:async()=>{rounds++;return unavailable();}});
 expect(rounds).toBe(1);expect(result.status).toBe("unavailable");expect(result.authoritative).toBe(false);
 const current=JSON.parse(f.task.readRecord(result.result_ref));expect(current.task_id).toBe(f.taskId);expect(current.status).toBe("unavailable");expect(current.authoritative).toBe(false);expect(current.findings).toEqual([]);expect(current.request.subject).toEqual(request.subject);
 expect(f.task.readRecordBytes("quality/reviews/results/partial.json")).toEqual(partial);expect(f.task.readRecordBytes("quality/reviews/results/broken.json")).toEqual(broken);
 expect(f.task.readRecordBytes("legacy/history.md")).toEqual(f.history);expect(f.task.readRecordBytes("task.json")).toEqual(f.manifestBytes);expect(f.task.readRecordBytes("facts.jsonl")).toEqual(f.facts);
});
it("rejects pre/history/missing/unknown new review writes before directories or runner and keeps old bytes",async()=>{
 for(const cohort of ["pre","history",null,"unknown"]){const f=await fixture(cohort);let rounds=0;
 expect(existsSync(join(f.taskPath,"quality"))).toBe(false);
 await expect(recordSimpleReviewRequest({taskDir:f.taskPath,request,runRound:async()=>{rounds++;return unavailable();}})).rejects.toMatchObject({code:"REVIEW_TASK_READ_ONLY"});
 expect(rounds).toBe(0);expect(existsSync(join(f.taskPath,"quality"))).toBe(false);
 expect(f.task.readRecordBytes("task.json")).toEqual(f.manifestBytes);expect(f.task.readRecordBytes("facts.jsonl")).toEqual(f.facts);expect(f.task.readRecordBytes("legacy/history.md")).toEqual(f.history);
 }
});
