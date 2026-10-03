import { describe, expect, it } from "vitest";
import { compiledSchemaNames, validateSchema } from "../../../../runtime/review/schema-validator.mjs";
const result = () => ({version:"wh-review-result.v1",task_id:"task-1",stage:"build-code",review_scope:"phase",subject_kind:"phase",phase_id:"P1",status:"unavailable",provider_results:[],findings:[]});
function error(value, pointer) { try {validateSchema("result",value);throw new Error("expected schema rejection");} catch(e) {expect(e).toMatchObject({code:"SCHEMA_VALIDATION_FAILED",schema:"result",pointer});} }
describe("current review schema facts",()=>{
 it("registers only the current result writer",()=>{expect(compiledSchemaNames).toEqual(["result"]);for(const name of ["attempt","resolution","ac_evidence_summary"])expect(()=>validateSchema(name,{})).toThrow(`unknown schema: ${name}`);});
 it("accepts unavailable without inventing semantic findings",()=>{const r=result();expect(validateSchema("result",r)).toBe(r);});
 it("requires task, actual status and a concrete phase",()=>{error({...result(),task_id:""},"/task_id");error({...result(),status:"passed"},"/status");error({...result(),phase_id:"P0"},"/phase_id");});
 it("preserves observed failure and serious finding provenance",()=>{const r={...result(),provider_results:[{provider:"kimi",status:"failed",error:{code:"OUTPUT_INVALID",message:"unparsed"},session_id:"observed-session",raw_output_ref:"quality/reviews/provider.output"}],findings:[{provider:"kimi",severity:"major",path:"src/a.mjs",line:1,issue:"lost input",root_cause:"input discarded",recommendation:"preserve input",evidence_kind:"direct",evidence:"the bytes differ"}]};expect(validateSchema("result",r)).toEqual(r);});
 it("rejects malformed findings and provider identities",()=>{error({...result(),findings:[{provider:"owned",severity:"critical",path:"a",issue:"bad",recommendation:"fix"}]},"/findings/0/severity");error({...result(),provider_results:[{provider:"",status:"failed",error:{code:"OWNED",message:"owned error"}}]},"/provider_results/0/provider");});
});
