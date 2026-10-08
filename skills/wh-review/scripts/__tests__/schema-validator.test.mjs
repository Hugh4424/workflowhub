import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { deriveVerifyCodeConclusion } from "../../../../runtime/review/canonical-review-result.mjs";
import { compiledSchemaNames, validateSchema } from "../../../../runtime/review/schema-validator.mjs";
const result = () => ({version:"wh-review-result.v1",task_id:"task-1",stage:"build-code",review_scope:"phase",subject_kind:"phase",phase_id:"P1",status:"unavailable",provider_results:[],findings:[]});
function error(value, pointer) { try {validateSchema("result",value);throw new Error("expected schema rejection");} catch(e) {expect(e).toMatchObject({code:"SCHEMA_VALIDATION_FAILED",schema:"result",pointer});} }
const coverage = () => ({provider:"fixture",read:["spec.md"],unread:[],undetermined:[]});
const execution = () => ({adapter:"fixture",model:null,effort:null,thinking:null,timing:{started_at_ms:null,completed_at_ms:null,duration_ms:null},usage:null,retry:{count:0,progress_events:0},runtime_id:"fixture"});
const facts = () => ({providers:[{provider:"fixture",status:"failed",opinion_returned:false,findings_count:0,duration_ms:null,usage:null,usage_status:"not_reported"}],material_bytes:null,wall_clock_ms:null,usage_coverage:{reported:0,total:1},already_reviewed:{hit:false,record_ref:null}});
const schema = (path) => JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
describe("current review schema facts",()=>{
 it("counts only completed providers with an ok parse fact",()=>{
  const conclude=(members)=>deriveVerifyCodeConclusion({status:"available",provider_results:members,findings:[{severity:"minor"}]});
  expect(conclude([{provider:"a",status:"completed",parse_outcome:"ok"},{provider:"b",status:"completed",execution:{parse_outcome:"ok"}}])).toMatchObject({conclusion:"pass_with_findings",coverage:{providers_completed:2,providers_failed:0}});
  for(const member of [{provider:"b",status:"completed",parse_outcome:"invalid"},{provider:"b",status:"completed"},{provider:"b",status:"failed",parse_outcome:"ok"},{provider:"b",status:"completed",parse_outcome:"invalid",execution:{parse_outcome:"ok"}}]){
   expect(conclude([member])).toMatchObject({conclusion:"inconclusive",coverage:{providers_completed:0,providers_failed:1}});
  }
 });
 it("validates material coverage and never substitutes zero for missing usage",()=>{
  const r={...result(),material_coverage:[coverage()],provider_results:[{provider:"fixture",status:"completed",error:null,material_coverage:coverage(),usage_status:"not_reported",execution:{...execution(),usage_status:"not_reported"}}]};
  expect(validateSchema("result",r)).toBe(r);
  const missing=coverage();delete missing.provider;
  error({...result(),material_coverage:[missing]},"/material_coverage/0/provider");
  error({...result(),material_coverage:[{...coverage(),read_confirmed:false}]},"/material_coverage/0/read_confirmed");
  error({...result(),provider_results:[{...r.provider_results[0],material_coverage:{...coverage(),read:[""]}}]},"/provider_results/0/material_coverage/read/0");
  error({...result(),provider_results:[{...r.provider_results[0],usage_status:"zero"}]},"/provider_results/0/usage_status");
 });
 it("requires the complete recomputable review-facts shape when supplied",()=>{
  const r={...result(),review_facts:facts()};expect(validateSchema("result",r)).toBe(r);
  const missing=facts();delete missing.already_reviewed;
  error({...result(),review_facts:missing},"/review_facts/already_reviewed");
  const missingUsage=facts();delete missingUsage.providers[0].usage;
  error({...result(),review_facts:missingUsage},"/review_facts/providers/0/usage");
  error({...result(),review_facts:{...facts(),usage_coverage:{reported:"0",total:1}}},"/review_facts/usage_coverage/reported");
 });
 it("shares materialCoverage across three schemas and keeps attempt/v3 optional keys strict",()=>{
  const resultSchema=schema("../../../../runtime/review/schemas/result.schema.json");
  const attemptSchema=schema("../../../../runtime/review/schemas/attempt.schema.json");
  const v3Schema=schema("../../contracts/workflowhub-result.v3.json");
  expect(attemptSchema.$defs.materialCoverage).toEqual(resultSchema.$defs.materialCoverage);
  expect(v3Schema.$defs.materialCoverage).toEqual(resultSchema.$defs.materialCoverage);
  const ajv=new Ajv2020({allErrors:true,strict:true,strictRequired:false,formats:{"date-time":true}});
  const validateAttempt=ajv.compile({$schema:attemptSchema.$schema,$defs:attemptSchema.$defs,...attemptSchema.properties.provider_attempts.items});
  const attempt={provider:"fixture",status:"completed",session_id:null,runtime_id:null,output_ref:null,error:null,material_coverage:coverage(),execution:{...execution(),usage_status:"not_reported"}};
  expect(validateAttempt(attempt)).toBe(true);
  expect(validateAttempt({...attempt,unknown:true})).toBe(false);
  expect(validateAttempt({...attempt,execution:{...execution(),usage_status:"zero"}})).toBe(false);
  const validateV3=ajv.compile({$schema:v3Schema.$schema,$defs:v3Schema.$defs,$ref:"#/$defs/member"});
  const identity={adapter:"fixture",config_id:"fixture",model:null,provider:"fixture",source_id:"fixture"};
  const member={attempts:[],continuable:false,deadline_ms:null,error:null,identity,material:{contract_hash:"fixture",contract_id:"fixture",material_id:"fixture",semantic_hash:"fixture"},output:null,provenance:{raw_output_sha256:null,raw_stderr_sha256:null,runtime_id:"fixture"},recovery:{fresh_execution_retry_count:0,provider_internal_retry_count:0,same_session_repair_count:0},result_protocol:"workflowhub-result.v3",session_id:null,status:"completed",timing:execution().timing,usage:null};
  expect(validateV3(member)).toBe(true);
  const enriched={...member,parse_outcome:"ok",process_outcome:"ok",material_coverage:coverage(),usage_status:"not_reported"};
  expect(validateV3(enriched)).toBe(true);
  expect(validateV3({...enriched,parse_outcome:"passed"})).toBe(false);
  expect(validateV3({...enriched,usage_status:"zero"})).toBe(false);
  expect(validateV3({...enriched,unknown:true})).toBe(false);
  const validatePublication=ajv.compile({$schema:v3Schema.$schema,$defs:v3Schema.$defs,$ref:"#/$defs/publication"});
  for(const duration of [0,300000,600000])expect(validatePublication({status:"initial_published",published_at:0,published_at_least_sources:1,running_member_count:0,append_window:{starts_at:0,ends_at:duration,duration_ms:duration}})).toBe(true);
  expect(validatePublication({status:"initial_published",published_at:0,published_at_least_sources:1,running_member_count:0,append_window:{starts_at:0,ends_at:0,duration_ms:-1}})).toBe(false);
 });
 it("registers only the current result writer",()=>{expect(compiledSchemaNames).toEqual(["result"]);for(const name of ["attempt","resolution","ac_evidence_summary"])expect(()=>validateSchema(name,{})).toThrow(`unknown schema: ${name}`);});
 it("accepts unavailable without inventing semantic findings",()=>{const r=result();expect(validateSchema("result",r)).toBe(r);});
 it("requires task, actual status and a concrete phase",()=>{error({...result(),task_id:""},"/task_id");error({...result(),status:"passed"},"/status");error({...result(),phase_id:"P0"},"/phase_id");});
 it("preserves observed failure and serious finding provenance",()=>{const r={...result(),provider_results:[{provider:"kimi",status:"failed",error:{code:"OUTPUT_INVALID",message:"unparsed"},session_id:"observed-session",raw_output_ref:"quality/reviews/provider.output"}],findings:[{provider:"kimi",severity:"major",path:"src/a.mjs",line:1,issue:"lost input",root_cause:"input discarded",recommendation:"preserve input",evidence_kind:"direct",evidence:"the bytes differ"}]};expect(validateSchema("result",r)).toEqual(r);});
 it("rejects malformed findings and provider identities",()=>{error({...result(),findings:[{provider:"owned",severity:"critical",path:"a",issue:"bad",recommendation:"fix"}]},"/findings/0/severity");error({...result(),provider_results:[{provider:"",status:"failed",error:{code:"OWNED",message:"owned error"}}]},"/provider_results/0/provider");});
});
