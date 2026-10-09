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
    expect(dependency).toEqual({name:"wh-review",path:"skills/wh-review/SKILL.md",trigger:"every_code_review_invocation_method_only"});
    const architects=manifest.skills.filter(entry=>entry.name==="architect-code-review");
    expect(architects).toEqual([architectSource[stage]]);
    expect(read(`workflows/${stage}/skill-deps.yaml`)).toContain(wiringCommentSource[stage]);
    expect(manifest.external_capabilities.find(entry=>entry.id==="wh-review-provider").required_when).toBe("ocr_missing_or_version_below_1_12_9_fallback");
    expect(manifest.external_capabilities.find(entry=>entry.id==="ocr-cli")).toMatchObject({required_when:"code_review",version_policy:">=1.12.9"});
  }
});
it("retains the terminal independent OCR code-review point and precise missing-install fallback",()=>{const s=read("workflows/verify-code/SKILL.md");for(const text of ["一次终末代码审查","一次终末独立代码审查","完整 AC","真实消费者","ENOENT","版本低于1.12.9","OCR 已装而执行失败、超时或取消时不回退"])expect(s).toContain(text);});
it("keeps current code-review input complete and separate from material permission",()=>{const m=JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];expect(m.source_bundle).toBe("diff");expect(m.required).toEqual(expect.arrayContaining(["changed_files","implementation_assessment","test_context","open_risks","review_instructions"]));const s=read("skills/wh-review/contracts/verify-code.md");expect(s).toContain("相关测试与代码风险");expect(s).toContain("不能把失败改写为空 findings");});
it("records unavailable independently of successful commands or empty findings",async()=>{let calls=0;const result=await runSimpleReview({stage:"verify-code",materials:{changed_files:"src/app.mjs",implementation_assessment:"owned code",test_context:"owned tests",open_risks:"unknown"}},{loadConfig(){calls++;throw new Error("owned missing route");}});expect(calls).toBe(1);expect(result).toMatchObject({status:"unavailable",error:{code:"ROUTE_UNAVAILABLE"},findings:[]});expect(result).not.toHaveProperty("passed");});
it("requires semantic reverse checking without repeat reviews or user evidence burden",()=>{const s=read("workflows/verify-code/SKILL.md");for(const text of["沿原始业务规则→真实入口→断言→实际效果核语义","模拟结果不当外部效果","不重派第二次正常代码审查","严重未修风险","原始失败不覆盖"]){if(text==="严重未修风险")expect(s).toContain("严重未修风险");else if(text==="原始失败不覆盖")expect(s).toContain("不能改写原 review 或用摘要覆盖失败");else expect(s).toContain(text);}});

// Source-only finite predicates from CR220, corrected130 and fixed132/134.
const architectSource = {
  "build-code": {
    name: "architect-code-review", path: "skills/architect-code-review/SKILL.md",
    trigger: 'every_phase_supplemental_review_not_heterologous OR ((ocr command does not exist (ENOENT) OR ocr version is below 1.12.9) AND current workflows/build-code/SKILL.md section "## OCR 能力与回退" explicitly selects architect-code-review)',
  },
  "verify-code": {
    name: "architect-code-review", path: "skills/architect-code-review/SKILL.md",
    trigger: '((ocr command does not exist (ENOENT) OR ocr version is below 1.12.9) AND current workflows/verify-code/SKILL.md section "## OCR 能力与回退" explicitly selects architect-code-review)',
  },
};
const wiringCommentSource = {
  "build-code": "每次代码审查先读 Long-review host convention；正常仍由 OCR 执行。architect 条目的条件回退仅按当前 workflows/build-code/SKILL.md 的「## OCR 能力与回退」执行；该节目标经 P9 改为 architect-code-review 后才生效；已装失败、超时或取消均不回退。",
  "verify-code": "每次代码审查先读 Long-review host convention；正常仍由 OCR 执行。architect 条目的条件回退仅按当前 workflows/verify-code/SKILL.md 的「## OCR 能力与回退」执行；该节目标经 P9 改为 architect-code-review 后才生效；已装失败、超时或取消均不回退。",
};
function sourceSection(source, heading) {
  const marker = heading + "\n";
  if (source.split(marker).length !== 2) return undefined;
  return source.split(marker)[1].split(/\n#{1,6} /)[0];
}
const sourceSentences = source => source.split("。").map(sentence => sentence.trim()).filter(Boolean);
function fallbackSourceStatus(section) {
  if (!section) return "unknown";
  const sentences = sourceSentences(section);
  const allows = sentences.flatMap(sentence => {
    const start = sentence.search(/(?:只有|仅)/);
    if (start < 0) return [];
    const clause = sentence.slice(start).split("；")[0];
    return /(?:才由|才用|才允许|回退)/.test(clause)
      && !/(?:不能|不回退|不触发回退|不得)/.test(clause) ? [clause] : [];
  });
  if (allows.length !== 1) return "unknown";
  const allow = allows[0];
  if (!/命令不存在(?:（ENOENT）)?/.test(allow)
    || !/版本低于\s*1\.12\.9(?:[，,；;\s]|$)/.test(allow)
    || !/architect-code-review/.test(allow) || /wh-review/.test(allow)
    || /执行失败|审查失败|超时|取消|无效输出|零成功路|空 findings|无关|其它文件/.test(allow)) return "reject";
  const installedFailure = sentences.some(sentence => /(?:已安装|已装)/.test(sentence)
    && /失败/.test(sentence) && /超时/.test(sentence) && /取消/.test(sentence)
    && /(?:不回退|不触发回退)/.test(sentence));
  const otherDetectionError = sentences.some(sentence => /版本检测/.test(sentence)
    && /其它错误/.test(sentence) && /(?:不能猜成未安装|不推断未安装|不推断|unknown|unavailable)/.test(sentence));
  return installedFailure && otherDetectionError ? "match" : "reject";
}
function expectFallbackSource(section, label) {
  expect(section, label + ": source-completeness unavailable").toBeDefined();
  expect(fallbackSourceStatus(section), label + ": same-sentence source policy incomplete/unknown").toBe("match");
  for (const fact of [/检测/, /原因/, /(?:真实执行者|真实输出)/, /限制/]) expect(section).toMatch(fact);
}
function supplementalSourceStatus(source) {
  if (!source) return "unknown";
  const predicates = [/same_source_degraded/, /不计异源\s*quorum/, /不替代 OCR/,
    /不覆盖 OCR identity/, /(?:不合并|均不合并)/, /(?:不合并或跨轴排名|不合并排名)/,
    /主会话/, /appendRecord/, /(?:保存一次|仅存一次)/, /(?:evidence|原件)/,
    /失败/, /取消/, /迟到/, /空 findings[^。]*不冒成功/];
  return predicates.every(predicate => predicate.test(source)) ? "match" : "reject";
}

it("checks each workflow OCR policy with same-sentence conditions and rejects source canaries",()=>{
  for(const stage of ["build-code","verify-code"]){
    const source=read('workflows/'+stage+'/SKILL.md');
    expectFallbackSource(sourceSection(source,"## OCR 能力与回退"),stage);
    expect(source).toMatch(/正常(?:使用|仍由|代码审查仍由)\s*OCR|正常仍由 OCR/);
  }
  const normal="只有 OCR 命令不存在（ENOENT）或版本低于1.12.9，才由 architect-code-review 执行同一代码审查，保留检测输出、原因、真实执行者和覆盖限制。版本检测其它错误保持 unknown/unavailable，不推断未安装；OCR 已装执行失败、超时或取消时不回退。";
  expect(fallbackSourceStatus(normal)).toBe("match");
  for(const bad of [
    normal.replace("architect-code-review","wh-review"),
    normal.replace("命令不存在（ENOENT）","其它文件 ENOENT"),
    normal.replace("版本低于1.12.9","版本低于1x12x9"),
    normal.replace("或版本低于1.12.9",""),
    normal.replace("OCR 命令不存在（ENOENT）或",""),
    normal.replace("OCR 命令不存在（ENOENT）","OCR 执行失败"),
    normal.replace("OCR 命令不存在（ENOENT）","OCR 超时"),
    normal.replace("OCR 命令不存在（ENOENT）","OCR 取消"),
    normal.replace("OCR 命令不存在（ENOENT）","OCR 零成功路"),
    normal.replace("取消时不回退","取消时回退 architect-code-review"),
  ]) expect(fallbackSourceStatus(bad)).toBe("reject");
  expect(fallbackSourceStatus(undefined)).toBe("unknown");
  expect(fallbackSourceStatus("当前指针未生效，回退目标未知。architect-code-review。ENOENT。版本低于1.12.9。")).toBe("unknown");
  expect(fallbackSourceStatus(normal+"只有其它命令不存在（ENOENT）或版本低于1.12.9，才由 architect-code-review 执行。")).toBe("unknown");
  expect(sourceSection("没有对应标题。","## OCR 能力与回退")).toBeUndefined();
  const standaloneSource="## OCR 能力与回退\n"+normal+"\n## 其它\n仅其它段落。";
  expect(sourceSection(standaloneSource,"## OCR 能力与回退")).toBe(normal);
  expect(architectSource["build-code"].trigger).toContain("every_phase_supplemental_review_not_heterologous OR ((");
  expect(architectSource["verify-code"].trigger).not.toContain("every_phase_supplemental");
  for(const badTrigger of [architectSource["build-code"].trigger.replace(" OR (("," AND (("),architectSource["build-code"].trigger.replace("every_phase_supplemental_review_not_heterologous OR ",""),architectSource["build-code"].trigger.replace("architect-code-review","wh-review")]) expect(badTrigger).not.toBe(architectSource["build-code"].trigger);
});
it("checks mini-task host and verify contract as separate direct fallback consumers",()=>{
  for(const [file,heading,documentMethod]of [
    ["skills/mini-task/SKILL.md","## 方法",/文档走 wh-review/],
    ["skills/workflowhub-host-protocol/SKILL.md","## 方法与事实",/文档建议由wh-review/],
    ["skills/wh-review/contracts/verify-code.md","## 执行方式与失败",null],
  ]){
    const section=sourceSection(read(file),heading);
    expectFallbackSource(section,file);
    expect(section).toMatch(/OCR/);
    if(documentMethod)expect(section).toMatch(documentMethod);
  }
  const method="文档走 wh-review，代码走 OCR；只有 OCR 命令不存在（ENOENT）或版本低于1.12.9，才用 architect-code-review 执行，保留检测输出、原因、真实执行者和限制。版本检测其它错误 unknown，不推断未安装；OCR 已装失败、超时或取消时不回退。";
  const consumers=[method,method,method.replace("architect-code-review","wh-review")];
  expect(consumers.map(fallbackSourceStatus)).toEqual(["match","match","reject"]);
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
