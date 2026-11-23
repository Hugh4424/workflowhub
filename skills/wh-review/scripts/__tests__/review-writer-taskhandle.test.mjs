import { afterEach,describe,expect,it } from "vitest";
import {mkdtempSync,realpathSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";import {join} from "node:path";
import {createTask} from "../../../../runtime/task/task-handle.mjs";
import {recordSimpleReviewRequest} from "../../../../runtime/review/review-record-route.mjs";
import Ajv2020 from "ajv/dist/2020.js";
const resultSchema=JSON.parse(readFileSync(new URL("../../../../runtime/review/schemas/result.schema.json",import.meta.url),"utf8"));
const validateResult=new Ajv2020({allErrors:true,strict:true,strictRequired:false,formats:{"date-time":true}}).compile(resultSchema);
const roots=[];afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
async function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),"review-writer-current-")));roots.push(root);return await createTask({storageRoot:root,manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:"review-task",created_at:"2026-10-03T00:00:00Z",target_repo_root:join(root,"repo"),activation_cohort:"post",execution_mode:"per_invocation",record_model:"vnext-single-write",issue_ids:[],inputs:{}}});}
const request={stage:"build-plan",materials:{approved_spec:"owned spec"}};
describe("ordinary review writer protected task storage",()=>{
 it("rejects malformed request before dispatch",async()=>{let calls=0;await expect(recordSimpleReviewRequest({taskDir:"/missing",request:null,runRound:()=>{calls++;}})).rejects.toThrow(/request/);expect(calls).toBe(0);});
 it("publishes immutable current records readable through TaskHandle",async()=>{const task=await fixture();const input={taskDir:task.taskPath,request,runRound:async()=>({status:"unavailable",provider_results:[],findings:[],error:{code:"ROUTE_UNAVAILABLE",message:"owned failure"}})};const first=await recordSimpleReviewRequest(input),raw=task.readRecord(first.result_ref);const second=await recordSimpleReviewRequest(input);expect(second.result_ref).not.toBe(first.result_ref);expect(task.readRecord(first.result_ref)).toEqual(raw);const saved=JSON.parse(raw);expect(validateResult(saved),JSON.stringify(validateResult.errors)).toBe(true);expect(saved).toMatchObject({status:"unavailable",authoritative:false});});
 it("retains observed process, parse and raw output facts",async()=>{const task=await fixture();const raw=Buffer.from([0,255,10]);const out=await recordSimpleReviewRequest({taskDir:task.taskPath,request,runRound:async(_,options)=>{const ref=await options.onProviderOutput({provider:"owned",output:raw});return {status:"unavailable",provider_results:[{provider:"owned",status:"failed",session_id:"started-only",process_outcome:"timeout",parse_outcome:"unknown",raw_output_ref:ref,error:{code:"OCR_PROVIDER_TIMEOUT",message:"deadline"}}],findings:[]};}});const fact=JSON.parse(task.readRecord(out.result_ref));expect(fact.provider_results[0]).toMatchObject({session_id:"started-only",process_outcome:"timeout",parse_outcome:"unknown"});expect(readFileSync(join(task.taskPath,fact.provider_results[0].raw_output_ref))).toEqual(raw);});
});
