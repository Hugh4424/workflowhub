import{afterEach,describe,expect,it}from"vitest";import{mkdtempSync,realpathSync,readFileSync,rmSync}from"node:fs";import{join}from"node:path";import{tmpdir}from"node:os";
import{providerMaterialEntries,providerMaterialPath}from"../../runtime/review/provider-material-projection.mjs";
import{assertReviewIdentity,reviewRuleFor}from"../../runtime/review/review-policy.mjs";import{buildReviewMaterials}from"../../skills/wh-review/scripts/review-materials.mjs";import{createSimpleReviewPacket,runSimpleReview}from"../../skills/wh-review/scripts/simple-review-runner.mjs";
const roots=[],ROOT=new URL("../..",import.meta.url).pathname;afterEach(()=>{for(const r of roots.splice(0))rmSync(r,{recursive:true,force:true});});function root(){const r=realpathSync(mkdtempSync(join(tmpdir(),"prd-report-packet-")));roots.push(r);return r;}const materials=()=>({decision_log:"# Decision\nparent direction",prd:"# PRD\ncomplete ordinary product",task_map:"T001: actual user output",design_facts:{ui_applicability:"non_ui",status:"not_applicable"},quality_facts:{status:"unavailable",coverage:"unknown"}});
function dependencies(r,group,call){return{loadConfig:()=>({whReview:{},attachmentRoot:r,config:"/unused/config.json",command:["unused"]}),resolveRoute:()=>({initial:["owned"],mode:"single_round",minimum_heterologous:1}),selectProviders:()=>({providers:["owned"],provider_models:{owned:"owned-model"},provider_identities:{owned:{source_id:"owned-source",config_id:"owned-config"}}}),client:{runGroup:async()=>{call();return group;}}};}
const member=(status,output,error)=>({provider:"owned",identity:{provider:"owned",adapter:"owned",source_id:"owned-source",config_id:"owned-config",model:"owned-model"},status,error,output,timing:null,usage:null});
describe("build-prd ordinary report-only document review",()=>{
 it("keeps the hyphenated sentinel and rejects a formal-stage/nonstage identity conflict",()=>{expect(reviewRuleFor("build-prd")).toMatchObject({minimum_reviewers:1,source_bundle:"none"});expect(()=>reviewRuleFor("build_prd")).toThrow();expect(assertReviewIdentity({stage:"build-prd",review_kind:"build_prd"})).toMatchObject({stage:"build-prd",reviewKind:"build_prd"});expect(()=>assertReviewIdentity({stage:"build-code",review_kind:"build_prd"})).toThrow("build_prd review_kind requires stage build-prd");});
 it("registers real build-prd contract/lens without a formal-stage entry",()=>{const plan=JSON.parse(readFileSync(join(ROOT,"skills/wh-review/stage-skill-plan.json"),"utf8")),matrix=JSON.parse(readFileSync(join(ROOT,"runtime/review/stage-materials.json"),"utf8"));expect(matrix.stages).not.toHaveProperty("build-prd");expect(plan.non_stage.build_prd).toMatchObject({review_kind:"build_prd",delivery_mode:"report_only"});expect(plan.non_stage.build_prd.required_skills).toEqual(expect.arrayContaining(["review","simplicity-guard"]));});
 it("delivers the complete actual document body and contract/lens bytes",()=>{const r=root(),submitted=materials(),b=buildReviewMaterials({attachmentRoot:r,stage:"build-prd",reviewKind:"build_prd",materials:submitted});try{const text=b.deliveryManifest.map(e=>readFileSync(join(b.bundleRoot,e.path),"utf8")).join("\n");for(const [index,[key,v]] of providerMaterialEntries({stage:"build-prd",review_kind:"build_prd",materials:submitted}).entries()){const expectedPath=providerMaterialPath(key,index,v);const e=b.deliveryManifest.find(e=>e.path===expectedPath);expect(e).toBeDefined();const bytes=readFileSync(join(b.bundleRoot,e.path),"utf8");if(typeof v==="string")expect(bytes).toBe(v);else expect(JSON.parse(bytes)).toEqual(v);}expect(b.deliveryManifest.some(e=>e.path==="contracts/build-prd.md")).toBe(true);expect(b.deliveryManifest.some(e=>e.path==="skills/review/SKILL.md")).toBe(true);}finally{b.dispose();}});
 it("rejects forbidden build-plan substitutes and invalid nonstage identity before private dispatch",async()=>{let calls=0;const r=root(),d=dependencies(r,{outcome:"completed",providers:[]},()=>calls++);for(const input of[{stage:"build-prd",review_kind:"build_prd",materials:{...materials(),draft_plan:"forbidden"}},{stage:"build-code",review_kind:"build_prd",materials:materials()}]){const result=await runSimpleReview(input,d);expect(result.status).toBe("unavailable");expect(result.dispatch_state).toBe("blocked_before_dispatch");}expect(calls).toBe(0);});
 it("preserves unavailable member facts and never manufactures a stage attempt",async()=>{const r=root();let calls=0;const result=await runSimpleReview({stage:"build-prd",review_kind:"build_prd",materials:materials()},dependencies(r,{runtimeId:"owned-runtime",outcome:"partial",providers:[member("failed",null,{code:"OWNED_UNAVAILABLE",message:"controlled unavailable"})]},()=>calls++));expect(calls).toBe(1);expect(result).toMatchObject({stage:"build-prd",review_kind:"build_prd",status:"unavailable",provider_results:[{status:"failed",error:{code:"OWNED_UNAVAILABLE"}}]});for(const key of["attempt_ref","result_ref","verdict","stage_completed"])expect(result).not.toHaveProperty(key);});
 it("records a completed readable suggestion as advisory rather than product approval",async()=>{const r=root();let calls=0;const result=await runSimpleReview({stage:"build-prd",review_kind:"build_prd",materials:materials()},dependencies(r,{runtimeId:"owned-runtime",outcome:"completed",providers:[member("completed",JSON.stringify({findings:[]}),null)]},()=>calls++));expect(calls).toBe(1);expect(result.status).toBe("available");expect(result.findings).toEqual([]);expect(result).not.toHaveProperty("passed");expect(result).not.toHaveProperty("result_ref");});
});

describe("planning-hardening portable reflection contracts", () => {
  it("planning-hardening AC-REFLECT-001/AC-META-001 declares one save-read handoff with bound payload fields", () => {
    const workflow = readFileSync(join(ROOT, "workflows/build-prd/SKILL.md"), "utf8");
    expect(workflow).toContain("report-facts-and-handoff");
    expect(workflow).toContain("reportFactsAndHandoff");
    expect(workflow).toContain("readReflectionForReport");
    expect(workflow).toContain("publishCanonicalRecord");
    expect(workflow).toContain("raw");
    expect(workflow).toContain("SHA");
    expect(workflow).toContain("task_id");
    expect(workflow).toContain("workflow");
    expect(workflow).toContain("material_refs");
    expect(workflow).toContain("reply_text");
    expect(workflow).toContain("step_results");
    expect(workflow).toContain("reflection_facts");
    expect(workflow).toContain("仅 task_id、workflow、material_refs、reply_text、step_results、reflection_facts");

  });

  it("planning-hardening AC-CHECK-001/AC-CLOSE-002 keeps portable reflection separate from formal stage and close approval", () => {
    const text = `${readFileSync(join(ROOT, "workflows/build-prd/SKILL.md"), "utf8")}\n${readFileSync(join(ROOT, "workflows/build-prd/steps.json"), "utf8")}`;
    expect(text).toMatch(/不是正式stage|not a formal stage/);
    expect(text).toMatch(/不.*(?:stage-reflection|正式stage).*(?:复盘|reflection)|reflection.*(?:not|不).*(?:formal stage|正式stage)/i);
    expect(text).toMatch(/不.*(?:close|操作确认|approval)/i);
    expect(text).toMatch(/不增加第三次.*内容调用|not.*third content call/i);
  });
});
