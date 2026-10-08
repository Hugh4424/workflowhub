import{readFileSync}from"node:fs";import{expect,it}from"vitest";import{runSimpleReview}from"../../skills/wh-review/scripts/simple-review-runner.mjs";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";
const read=p=>readFileSync(p,"utf8");
it("keeps one review owner active through settled providers and the formal record across normal OCR and fallback",()=>{
  const skill=read("skills/wh-review/SKILL.md"),section=skill.split("## Long-review host convention\n")[1]?.split("\n## ")[0];
  expect(section).toBeDefined();
  expect(section.split("\n").filter(line=>line.startsWith("- "))).toHaveLength(3);
  for(const wording of ["仅调用等待方法","正常代码审查仍由 OCR 执行","专用审查子代理","一个连续 activation","一个同步请求","全部真实 provider 终态","正常已启动请求的正式记录可读","才 final","同一 job","宿主既有长等待","失败/取消也算终态","启动失败或未知 job","unavailable","显式取消","既有信号回收","跨 activation 所有权持久性未经验证","保持同步 owner"]){expect(section).toContain(wording);}
  expect(section).not.toContain("wait/poll");
  for(const stage of ["build-code","verify-code"]){
    const {manifest}=loadStageSkillManifest(process.cwd(),stage);
    const dependency=manifest.skills.find(entry=>entry.name==="wh-review");
    expect(dependency).toEqual({name:"wh-review",path:"skills/wh-review/SKILL.md",trigger:"every_code_review_invocation_method_only_or_existing_ocr_fallback"});
    expect(read(`workflows/${stage}/skill-deps.yaml`)).toContain("每次代码审查先读 Long-review host convention；正常仍由 OCR 执行，只有既有缺失/低版本条件才由 wh-review 回退。");
    expect(manifest.external_capabilities.find(entry=>entry.id==="wh-review-provider").required_when).toBe("ocr_missing_or_version_below_1_12_9_fallback");
    expect(manifest.external_capabilities.find(entry=>entry.id==="ocr-cli")).toMatchObject({required_when:"code_review",version_policy:">=1.12.9"});
  }
});
it("retains the terminal independent OCR code-review point and precise missing-install fallback",()=>{const s=read("workflows/verify-code/SKILL.md");for(const text of ["一次终末代码审查","一次终末独立代码审查","完整 AC","真实消费者","ENOENT","版本低于1.12.9","OCR 已装而执行失败、超时或取消时不回退"])expect(s).toContain(text);});
it("keeps current code-review input complete and separate from material permission",()=>{const m=JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];expect(m.source_bundle).toBe("diff");expect(m.required).toEqual(expect.arrayContaining(["changed_files","implementation_assessment","test_context","open_risks","review_instructions"]));const s=read("skills/wh-review/contracts/verify-code.md");expect(s).toContain("相关测试与代码风险");expect(s).toContain("不能把失败改写为空 findings");});
it("records unavailable independently of successful commands or empty findings",async()=>{let calls=0;const result=await runSimpleReview({stage:"verify-code",materials:{changed_files:"src/app.mjs",implementation_assessment:"owned code",test_context:"owned tests",open_risks:"unknown"}},{loadConfig(){calls++;throw new Error("owned missing route");}});expect(calls).toBe(1);expect(result).toMatchObject({status:"unavailable",error:{code:"ROUTE_UNAVAILABLE"},findings:[]});expect(result).not.toHaveProperty("passed");});
it("requires semantic reverse checking without repeat reviews or user evidence burden",()=>{const s=read("workflows/verify-code/SKILL.md");for(const text of["沿原始业务规则→真实入口→断言→实际效果核语义","模拟结果不当外部效果","不重派第二次正常代码审查","严重未修风险","原始失败不覆盖"]){if(text==="严重未修风险")expect(s).toContain("严重未修风险");else if(text==="原始失败不覆盖")expect(s).toContain("不能改写原 review 或用摘要覆盖失败");else expect(s).toContain(text);}});
