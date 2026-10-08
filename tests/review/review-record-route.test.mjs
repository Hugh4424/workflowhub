// Current canonical ordinary request/result producer. No kernel, pair/role
// authentication, hash freshness, retry authority or receipt readback machine.
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),"ordinary-review-record-")));roots.push(root);const repo=join(root,"metadata-repo");mkdirSync(repo);const task=await createTask({storageRoot:root,manifest:{schema_version:"1.0.0",project_name:"workflowhub",task_id:randomUUID(),created_at:"2026-10-03T00:00:00Z",target_repo_root:repo,activation_cohort:"post",record_model:"vnext-single-write",execution_mode:"per_invocation",issue_ids:[],inputs:{}}});return{root,task};}
const request=(phase="P1")=>({stage:"build-code",review_scope:"phase",phase_id:phase,subject_kind:"phase",surface:"code",subject:{files:["README.md"]},materials:{approved_spec:"owned ordinary current specification"}});
const member=(provider="codex/owned",extra={})=>({provider,status:"completed",identity:{provider,adapter:provider.split('/')[0],source_id:`${provider}-source`,config_id:`${provider}-config`,model:"owned-model"},error:null,timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},usage:null,evidence_anchor_valid:[],...extra});
const result=(extra={})=>({status:"unavailable",outcome:"unavailable",dispatch_state:"unknown",provider_results:[],findings:[],...extra});
const finding=(provider="codex/owned")=>({provider,severity:"major",path:"README.md",line:1,issue:"current branch has a defect",recommendation:"repair the branch",root_cause:"missing required branch",evidence_kind:"direct",evidence:"owned observed line"});
async function record(f,runRound,input=request(),extra={}){const ref=await recordSimpleReviewRequest({taskDir:f.task.taskPath,request:input,runRound,...extra});return{ref,value:JSON.parse(f.task.readRecord(ref.result_ref)),bytes:f.task.readRecordBytes(ref.result_ref)};}
function results(f){const dir=join(f.task.taskPath,"quality","reviews");return existsSync(dir)?readdirSync(dir).filter(x=>x.endsWith(".json")):[];}
describe("ordinary review request/result lifecycle",()=>{
 it("assembles recomputable provider facts, nullable usage and coverage without changing failed provenance",async()=>{
   const f=await fixture(),claim=finding();
   const providers=[member("codex/owned",{parse_outcome:"ok",usage:{input_tokens:5},material_coverage:{provider:"codex/owned",read:["approved_spec"],unread:[],undetermined:[]}}),
     member("other/owned",{parse_outcome:"invalid",status:"failed",error:{code:"OUTPUT_INVALID",message:"owned invalid"},material_coverage:{provider:"other/owned",read:["approved_spec"],unread:[],undetermined:[]}}),
     member("third/owned",{execution:{adapter:"third",model:"owned-model",effort:null,thinking:null,parse_outcome:"ok",usage:null,timing:{started_at_ms:1,completed_at_ms:10,duration_ms:9},retry:{count:0,progress_events:0},runtime_id:"owned-runtime"},timing:null})];
   const {value}=await record(f,async()=>result({status:"available-with-failures",provider_results:providers,findings:[claim]}));
   expect(value.review_facts.providers.map(p=>[p.provider,p.status,p.opinion_returned,p.findings_count,p.duration_ms,p.usage,p.usage_status])).toEqual([
     ["codex/owned","completed",true,1,1,{input_tokens:5},"reported"],
     ["other/owned","failed",false,0,1,null,"not_reported"],
     ["third/owned","completed",true,0,9,null,"not_reported"]]);
   expect(value.review_facts).toMatchObject({material_bytes:Buffer.byteLength(request().materials.approved_spec),usage_coverage:{reported:1,total:3},already_reviewed:{hit:false,record_ref:null}});
   expect(Number.isSafeInteger(value.review_facts.wall_clock_ms)).toBe(true);
   expect(value.review_facts.wall_clock_ms).toBeGreaterThanOrEqual(0);
   expect(value.request.material_id).toBeNull();
   expect(value.material_coverage).toEqual([
     {provider:"codex/owned",read:["approved_spec"],unread:[],undetermined:[]},
     {provider:"other/owned",read:[],unread:[],undetermined:["approved_spec"]},
     {provider:"third/owned",read:[],unread:[],undetermined:["approved_spec"]}]);
   expect(()=>validateSchema("result",value)).not.toThrow();
 });
 it("records the latest same material after dispatch while damaged top-level history remains passive",async()=>{
   const f=await fixture(),id="a".repeat(64);let calls=0;
   const run=async()=>{calls++;return result({material_id:id});};
   const first=await record(f,run),second=await record(f,run);
   const broken=join(f.task.taskPath,"quality","reviews","9999-foreign.json");writeFileSync(broken,'{"request":');
   const third=await record(f,run);
   expect(calls).toBe(3);
   expect(second.value.review_facts.already_reviewed).toEqual({hit:true,record_ref:first.ref.result_ref});
   expect(third.value.review_facts.already_reviewed).toEqual({hit:true,record_ref:second.ref.result_ref});
   expect(f.task.readRecordBytes(first.ref.result_ref)).toEqual(first.bytes);
   expect(readFileSync(broken,"utf8")).toBe('{"request":');
   const missing=await record(f,async()=>result());
   expect(missing.value.request).toHaveProperty("material_id",null);
   expect(missing.value.review_facts.already_reviewed).toEqual({hit:false,record_ref:null});
 });
 it("does not persist empty sink or member outputs and retains nonempty failed output with omission facts",async()=>{
   const f=await fixture();let emptyRef,fullRef;
   const {value}=await record(f,async(_input,{onProviderOutput})=>{
     emptyRef=await onProviderOutput({provider:"codex/owned",output:Buffer.alloc(0)});
     fullRef=await onProviderOutput({provider:"codex/owned",output:"owned failure\n"});
     return result({provider_results:[member("codex/owned",{status:"failed",output:"",raw_output:"",raw_output_ref:fullRef,error:{code:"PROCESS_FAILED",message:"owned failure"}})]});
   });
   expect(emptyRef).toBeNull();
   expect(value.provider_results[0]).not.toHaveProperty("output");
   expect(value.provider_results[0]).not.toHaveProperty("raw_output");
   expect(f.task.readRecord(fullRef)).toBe("owned failure\n");
   const outputs=readdirSync(join(f.task.taskPath,"quality","reviews")).filter(name=>name.endsWith(".output"));
   expect(outputs).toHaveLength(1);
   expect(value.discarded_facts.map(fact=>fact.dropped_key)).toEqual(["provider-output:codex/owned","codex/owned:output","codex/owned:raw_output"]);
   expect(value.discarded_facts.every(fact=>fact.reason==="zero_bytes")).toBe(true);
   expect(()=>validateSchema("result",value)).not.toThrow();
 });
 it("counts material UTF8 and byte views without filling absent material or usage with zero",async()=>{
   const f=await fixture(),materials={text:"中文",bytes:Buffer.from([0,255]),view:new Uint8Array([1,2,3]),json:{flag:true}};
   const mixed=await record(f,async()=>result(),{...request(),materials});
   expect(mixed.value.review_facts.material_bytes).toBe(Buffer.byteLength("中文")+2+3+Buffer.byteLength(JSON.stringify(materials.json)));
   const absent=await record(f,async()=>result(),{...request(),materials:{}});
   expect(absent.value.review_facts.material_bytes).toBeNull();
   expect(absent.value.review_facts.usage_coverage).toEqual({reported:0,total:0});
 });
 it("preserves all submitted semantic members and duplicate claims with their actual provider rather than certifying corroboration",async()=>{const f=await fixture(),providers=[member(),member("other/owned")],claims=[finding(),finding("other/owned"),{...finding(),line:2,issue:"unique claim"}],{value}=await record(f,async()=>result({status:"available-with-failures",outcome:"partial",dispatch_state:"dispatched",provider_results:[...providers,member("third/owned",{status:"failed",error:{code:"OWNED_FAILED",message:"failed sibling"}})],findings:claims}));expect(value.findings).toEqual(claims);expect(value.provider_results.map(p=>p.status)).toEqual(["completed","completed","failed"]);expect(value.provider_results[2].error.code).toBe("OWNED_FAILED");expect(value.authoritative).toBe(false);expect(value).not.toHaveProperty("coverage");});
 it("keeps process/parse/health/error/null usage as observed facts without inventing fallback outcomes",async()=>{const f=await fixture(),p=member("codex/owned",{status:"failed",process_outcome:null,output_parse:null,usage:null,health:{provider:"codex/owned",status:"failed",stdout_bytes:7},error:{code:"PROCESS_TIMEOUT",message:"owned fixed deadline",cause_code:"OWNED_CAUSE"},raw_output:"owned original error stream"}),{value}=await record(f,async()=>result({provider_results:[p],error:{code:"PROCESS_TIMEOUT",message:"owned fixed deadline",cause_code:"OWNED_CAUSE"}}));expect(value.provider_results[0]).toMatchObject({process_outcome:null,output_parse:null,usage:null,health:p.health,error:p.error});expect(value.error).toEqual(p.error);expect(f.task.readRecord(value.provider_results[0].raw_output_ref)).toBe(p.raw_output);expect(value.status).toBe("unavailable");});
 it("stores raw nonUTF8 provider output as one original and carries the reference into the ordinary result",async()=>{const f=await fixture(),raw=Buffer.from([0x66,0x00,0xff,0x80]);let ref;const saved=await record(f,async(_input,options)=>{ref=await options.onProviderOutput({provider:"codex/owned",output:raw});return result({provider_results:[member("codex/owned",{status:"failed",raw_output_ref:ref,error:{code:"OUTPUT_INVALID",message:"owned invalid bytes"}})]});});expect(f.task.readRecordBytes(ref)).toEqual(raw);expect(saved.value.provider_results[0].raw_output_ref).toBe(ref);expect(readdirSync(join(f.task.taskPath,"quality","reviews")).filter(n=>n.endsWith(".output"))).toHaveLength(1);});
 it("keeps an unavailable valid partial finding and its provider source, leaving the required minimum unchanged",async()=>{const f=await fixture(),partial=finding(),{value}=await record(f,async()=>result({minimum_heterologous:2,provider_results:[member()],findings:[partial],error:{code:"REVIEW_MINIMUM_UNMET",message:"one source only"}}));expect(value).toMatchObject({status:"unavailable",minimum_heterologous:2,error:{code:"REVIEW_MINIMUM_UNMET"},findings:[partial],authoritative:false});});
 it.each(["stage","review_track","review_scope","phase_id","subject_kind","surface"])("rejects a returned %s mismatch rather than relabelling the subject",async key=>{const f=await fixture();await expect(record(f,async()=>result({[key]:"wrong"}))).rejects.toMatchObject({code:"REVIEW_SUBJECT_MISMATCH"});expect(results(f)).toEqual([]);});
 it.each([{stage:"build-code",review_scope:"phase",reviewScope:"integration",phase_id:"P1"},{stage:"make-decision",review_track:"direction",reviewTrack:"detail"},{stage:"verify-code",review_scope:"phase"},{stage:"build-code",phase_id:"not-a-phase"}])("rejects an invalid request identity before calling a runner %j",async input=>{const f=await fixture();let calls=0;await expect(record(f,async()=>{calls++;return result();},{...input,materials:{approved_spec:"owned"}})).rejects.toThrow();expect(calls).toBe(0);expect(results(f)).toEqual([]);});
 it("preserves concrete phase and mini-task identities from the submitted current tuple",async()=>{const f=await fixture();for(const input of [request("P1"),request("P2"),{...request("P2"),review_scope:undefined,review_kind:"mini_task.implementation"}]){const {value}=await record(f,async received=>{expect(received.phase_id).toBe(input.phase_id);return result();},input);expect(value.phase_id).toBe(input.phase_id);expect(value.review_scope).toBe("phase");expect(value.request.subject).toEqual(input.subject);expect(value.review_kind).toBe(input.review_kind??null);}});
 it("appends each explicit request without retry/head/reuse gates and preserves prior original bytes",async()=>{const f=await fixture();let calls=0;const run=async()=>{calls++;return result();};const first=await record(f,run),second=await record(f,run,{...request(),reason:"another explicit request"}),third=await record(f,run,{...request(),materials:{approved_spec:"changed ordinary material"}});expect(calls).toBe(3);expect(new Set([first.ref.result_ref,second.ref.result_ref,third.ref.result_ref]).size).toBe(3);expect(f.task.readRecordBytes(first.ref.result_ref)).toEqual(first.bytes);});
 it("serializes concurrent ordinary requests and retains every original result",async()=>{const f=await fixture(),trace=[];let number=0;const run=async()=>{const id=++number;trace.push(`start${id}`);await new Promise(r=>setTimeout(r,20));trace.push(`end${id}`);return result();};const records=await Promise.all([record(f,run),record(f,run)]);expect(trace).toEqual(["start1","end1","start2","end2"]);expect(records[0].ref.result_ref).not.toBe(records[1].ref.result_ref);expect(results(f)).toHaveLength(2);});
 it("does not call an already cancelled runner and publishes no fake result",async()=>{const f=await fixture(),controller=new AbortController();controller.abort();let calls=0;await expect(record(f,async()=>{calls++;return result();},request(),{signal:controller.signal})).rejects.toMatchObject({code:"REVIEW_CANCELLED"});expect(calls).toBe(0);expect(results(f)).toEqual([]);});
 it("waits for a live cancelled round to settle, retains its original facts and releases the lock only after cleanup",async()=>{const f=await fixture(),controller=new AbortController();let started,finish;const ready=new Promise(r=>started=r),cleanup=new Promise(r=>finish=r),trace=[];const first=record(f,async(_input,{signal})=>{trace.push("first-start");started();await cleanup;expect(signal.aborted).toBe(true);trace.push("first-cleaned");return result({provider_results:[member("codex/owned",{status:"cancelled",error:{code:"OCR_PROVIDER_CANCELLED",message:"owned cancellation"}})]});},request(),{signal:controller.signal});await ready;controller.abort();const second=record(f,async()=>{trace.push("second-start");return result();});await new Promise(r=>setTimeout(r,20));expect(trace).toEqual(["first-start"]);finish();const [a,b]=await Promise.all([first,second]);expect(trace).toEqual(["first-start","first-cleaned","second-start"]);expect(a.value).toMatchObject({status:"unavailable",error:{code:"REVIEW_CANCELLED"},provider_results:[{status:"cancelled",error:{code:"OCR_PROVIDER_CANCELLED"}}]});expect(b.value.status).toBe("unavailable");});
 it("records a typed throwing runner failure with unknown dispatch instead of inferring send from invocation",async()=>{const f=await fixture(),{value}=await record(f,async()=>{throw Object.assign(new Error("owned launch failure"),{code:"BROKER_SPAWN_FAILED"});});expect(value).toMatchObject({status:"unavailable",dispatch_state:"unknown",provider_results:[],findings:[],error:{code:"BROKER_SPAWN_FAILED",message:"owned launch failure"}});});
 it("keeps malformed foreign history passive and stores a new current result without a namespace gate",async()=>{const f=await fixture(),dir=join(f.task.taskPath,"quality","reviews","results");mkdirSync(dir,{recursive:true});const raw=Buffer.from('{"old-pair":');writeFileSync(join(dir,"old.json"),raw);const {value}=await record(f,async()=>result());expect(value.status).toBe("unavailable");expect(readFileSync(join(dir,"old.json"))).toEqual(raw);});
});
