import{readFileSync}from"node:fs";import{expect,it}from"vitest";import{runSimpleReview}from"../../skills/wh-review/scripts/simple-review-runner.mjs";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";
const read=p=>readFileSync(p,"utf8");
it("keeps one review owner active through settled providers and the formal record across normal OCR and unavailable detection",()=>{
  const skill=read("skills/wh-review/SKILL.md"),section=skill.split("## Long-review host convention\n")[1]?.split("\n## ")[0];
  expect(section).toBeDefined();
  expect(section.split("\n").filter(line=>line.startsWith("- "))).toHaveLength(3);
  for(const wording of ["仅调用等待方法","正常代码审查仍由 OCR 执行","专用审查子代理","一个连续 activation","一个同步请求","全部真实 provider 终态","正常已启动请求的正式记录可读","才 final","同一 job","宿主既有长等待","失败/取消也算终态","启动失败或未知 job","unavailable","显式取消","既有信号回收","跨 activation 所有权持久性未经验证","保持同步 owner"]){expect(section).toContain(wording);}
  expect(section).not.toContain("wait/poll");
  for(const stage of ["build-code","verify-code"]){
    const {manifest}=loadStageSkillManifest(process.cwd(),stage);
    const dependency=manifest.skills.find(entry=>entry.name==="wh-review");
    expect(dependency).toEqual({name:"wh-review",path:"skills/wh-review/SKILL.md",trigger:"every_code_review_invocation_method_only"});
    expect(manifest.skills.find(entry=>entry.name==="architect-code-review").trigger).toBe(stage==="build-code" ? "every_phase_supplemental_review_not_heterologous" : "every_terminal_code_review_same_source_supplemental_axis");
    expect(manifest.external_capabilities.find(entry=>entry.id==="wh-review-provider").required_when).toBe("document_review");
    expect(manifest.external_capabilities.find(entry=>entry.id==="ocr-cli")).toMatchObject({required_when:"code_review",version_policy:">=1.12.9"});
  }
});
it("retains the terminal independent OCR code-review point and unavailable detection boundary",()=>{const s=read("workflows/verify-code/SKILL.md");for(const text of ["一次终末代码审查","一次终末独立代码审查","完整 AC","真实消费者","ENOENT","版本低于1.12.9","不换执行者","unavailable/unknown","同源补充轴","与 OCR 可用性无关"])expect(s).toContain(text);});
it("keeps current code-review input complete and separate from material permission",()=>{const m=JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];expect(m.source_bundle).toBe("diff");expect(m.required).toEqual(expect.arrayContaining(["changed_files","implementation_assessment","test_context","open_risks","review_instructions"]));const s=read("skills/wh-review/contracts/verify-code.md");expect(s).toContain("相关测试与代码风险");expect(s).toContain("不能把失败改写为空 findings");});
it("records unavailable independently of successful commands or empty findings",async()=>{let calls=0;const result=await runSimpleReview({stage:"verify-code",materials:{changed_files:"src/app.mjs",implementation_assessment:"owned code",test_context:"owned tests",open_risks:"unknown"}},{loadConfig(){calls++;throw new Error("owned missing route");}});expect(calls).toBe(1);expect(result).toMatchObject({status:"unavailable",error:{code:"ROUTE_UNAVAILABLE"},findings:[]});expect(result).not.toHaveProperty("passed");});
it("requires semantic reverse checking without repeat reviews or user evidence burden",()=>{const s=read("workflows/verify-code/SKILL.md");for(const text of["沿原始业务规则→真实入口→断言→实际效果核语义","模拟结果不当外部效果","不重派第二次正常代码审查","严重未修风险","原始失败不覆盖"]){if(text==="严重未修风险")expect(s).toContain("严重未修风险");else if(text==="原始失败不覆盖")expect(s).toContain("不能改写原 review 或用摘要覆盖失败");else expect(s).toContain(text);}});

function sourceSection(source, heading) {
  const marker = heading + "\n";
  if (source.split(marker).length !== 2) return undefined;
  return source.split(marker)[1].split(/\n#{1,6} /)[0];
}
function supplementalSourceStatus(source) {
  if (!source) return "unknown";
  const predicates = [/same_source_degraded/, /不计异源\s*quorum/, /不替代 OCR/,
    /不覆盖 OCR identity/, /(?:不合并|均不合并)/, /(?:不合并或跨轴排名|不合并排名)/,
    /主会话/, /appendRecord/, /(?:保存一次|仅存一次)/, /(?:evidence|原件)/,
    /失败/, /取消/, /迟到/, /空 findings[^。]*不冒成功/];
  return predicates.every(predicate => predicate.test(source)) ? "match" : "reject";
}

it("keeps no-substitution policy independent of the same-source supplemental axis",()=>{
  const assertPolicy = section => {
    expect(section).toBeDefined();
    for(const wording of ["不换执行者", "同源补充轴", "独立执行", "与 OCR 可用性无关", "unavailable/unknown", "保留检测输出与原始失败", "版本检测其它错误不推断未安装"])expect(section).toContain(wording);
    expect(section.replace("reset/删除/回退/cleanup 需已有授权明确覆盖", "").replace("不扫描目录、不猜路径、不从旧记录回退", "")).not.toMatch(/才由|才用|才允许|回退/);
  };
  for(const [file, heading] of [
    ["workflows/build-code/SKILL.md", "## OCR 能力与缺省记录"],
    ["workflows/verify-code/SKILL.md", "## OCR 能力与缺省记录"],
    ["skills/mini-task/SKILL.md", "## 方法"],
    ["skills/workflowhub-host-protocol/SKILL.md", "## 方法与事实"],
    ["skills/wh-review/contracts/verify-code.md", "## 执行方式与失败"],
  ]) {
    const section=sourceSection(read(file), heading);assertPolicy(section);
    for(const wording of ["不换执行者", "与 OCR 可用性无关", "版本检测其它错误不推断未安装"])expect(()=>assertPolicy(section.replace(wording,"invalid changed policy"))).toThrow();
  }
  expect(()=>assertPolicy(undefined)).toThrow();
});
it("keeps the same-source supplemental axis separate from OCR identity and source-calibrates it",()=>{
  const section=sourceSection(read("workflows/build-code/SKILL.md"),"## 同源补充轴");
  expect(section).toBeDefined();
  expect(supplementalSourceStatus(section)).toBe("match");
  for(const wording of["Standards","Spec","两个镜头","并排","review_origin","review_result_ref","不镜像","null","reason"])expect(section).toContain(wording);
  const architect=sourceSection(read("skills/architect-code-review/SKILL.md"),"## 同源补充的镜头与记录");
  expect(architect).toBeDefined();
  for(const wording of["Standards/Spec","same_source_degraded","appendRecord","单份","evidence","不覆盖真实 OCR","review_origin/review_result_ref","null","reason","失败","取消","迟到","不合并或跨轴排名"])expect(architect).toContain(wording);
  const steps=JSON.parse(read("workflows/build-code/steps.json")).steps;
  const review=steps.filter(step=>step.step_slug==="review-change");
  expect(review).toHaveLength(1);
  for(const wording of["每 Phase","独立上下文同源补充轴","Standards/Spec","并排","不合并排名","same_source_degraded","不计异源 quorum","不覆盖 OCR identity","review_result_ref","appendRecord 仅存一次","既有 evidence","失败","取消","迟到"])expect(review[0].observable_result).toContain(wording);
  const normal="same_source_degraded 不计异源 quorum，不替代 OCR，不覆盖 OCR identity；两轴并排，不合并或跨轴排名。主会话 appendRecord 保存一次，后续 evidence 引用原件；失败、取消、迟到保留，空 findings 不冒成功。";
  expect(supplementalSourceStatus(normal)).toBe("match");
  for(const [original,replacement]of[["same_source_degraded","heterologous"],["不计异源 quorum","计异源 quorum"],["不替代 OCR","替代 OCR"],["不覆盖 OCR identity","覆盖 OCR identity"],["不合并或跨轴排名","合并排名"],["保存一次","镜像两份"],["空 findings 不冒成功","空 findings 证明成功"]])expect(supplementalSourceStatus(normal.replace(original,replacement))).toBe("reject");
  expect(supplementalSourceStatus(undefined)).toBe("unknown");
});
