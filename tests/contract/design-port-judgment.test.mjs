// ORACLE-JUDGMENT
// 本文件通过只证明工作流文本契约与固定判断样本的可重放判定，不证明未来真实
// 稿件可运行、真实项目效果或其它视口。样本与临时副本只作受控输入，不是真实
// 设计源。RED 只落目标断言；收集、导入与环境失败另记。
import {describe, it, expect} from 'vitest';
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const ROOT=process.cwd();
const SCRIPT=join(ROOT,"skills/design-source-extraction/scripts/check-judgment.mjs");
const FIXTURE=join(ROOT,"tests/fixtures/design-port-sample/judgment");
const BUILD_CODE=join(ROOT,"workflows/build-code/SKILL.md");
const BUILD_PLAN=join(ROOT,"workflows/build-plan/SKILL.md");
const BUILD_PRD=join(ROOT,"workflows/build-prd/SKILL.md");
const EXTRACTION=join(ROOT,"skills/design-source-extraction/SKILL.md");
const UNTOUCHED='{"state":"untouched"}\n';

function runJudgment(args){
  return spawnSync(process.execPath,[SCRIPT,...args],{cwd:ROOT,encoding:"utf8",timeout:120000});
}
function jsonBlock(text){
  const match=/```json\n([\s\S]*?)```/.exec(text);
  if(!match)throw new Error("judgment fixture has no machine block");
  return JSON.parse(match[1]);
}
function mutateJudgment(sourcePath,mutate){
  const dir=mkdtempSync(join(tmpdir(),"p2-judgment-"));
  const text=readFileSync(sourcePath,"utf8");
  const value=jsonBlock(text);
  mutate(value);
  const target=join(dir,"judgment.md");
  writeFileSync(target,text.replace(/```json\n[\s\S]*?```/,"```json\n"+JSON.stringify(value,null,2)+"\n```"));
  return {dir,target};
}
function attemptConstruction(inputPath,{confirmationRef}={}){
  const dir=mkdtempSync(join(tmpdir(),"p2-construction-"));
  const target=join(dir,"construction.json");
  writeFileSync(target,UNTOUCHED);
  const args=["--input",inputPath];
  if(confirmationRef)args.push("--confirmation-ref",confirmationRef);
  const result=runJudgment(args);
  const writer={
    calls:[],
    construct(){
      this.calls.push(target);
      writeFileSync(target,JSON.stringify({constructed:true,input:inputPath})+"\n");
    },
  };
  let built=false;
  try{built=result.status===0&&JSON.parse(result.stdout).allowed_for_construction===true;}catch{}
  if(built)writer.construct();
  return {result,dir,target,writer,bytes:readFileSync(target,"utf8")};
}
function rejected(result,code){
  expect(result.status,result.stderr).not.toBe(0);
  expect(result.stderr,result.stderr).toContain(code);
}
function accepted(result,verdict,{constructible=true}={}){
  expect(result.status,result.stderr).toBe(0);
  const summary=JSON.parse(result.stdout);
  expect(summary.judgment_valid,result.stdout).toBe(true);
  expect(summary.allowed_for_construction,result.stdout).toBe(constructible);
  expect(summary.verdict,result.stdout).toBe(verdict);
  return summary;
}
function sample(name){return join(FIXTURE,name,"judgment.md");}

describe("ORACLE-JUDGMENT executable judgment entry",()=>{
  it("script exists and reads one judgment input",()=>{
    expect(existsSync(SCRIPT),"check-judgment.mjs must exist").toBe(true);
    const result=runJudgment(["--input",sample("direct")]);
    expect(result.status,result.stderr).toBe(0);
  });
  for(const [name,verdict,adaptationCount] of [["direct","direct",0],["adapt","adapt",4],["unusable","unusable",0],["no-old-page","direct",0]]){
    it("accepts the "+name+" sample with three chains, six checks and a destination",()=>{
      const input=sample(name);
      const {result,target,writer,dir,bytes}=attemptConstruction(input);
      try{
        const constructible=verdict!=="unusable";
        const summary=accepted(result,verdict,{constructible});
        expect(summary.chains,result.stdout).toMatchObject({page:true,data:true,function:true});
        expect(summary.checks,result.stdout).toBe(6);
        expect(summary.next.length,result.stdout).toBeGreaterThan(0);
        expect(summary.owner.length,result.stdout).toBeGreaterThan(0);
        expect(summary.adaptation_count,result.stdout).toBe(adaptationCount);
        if(constructible){
          expect(writer.calls,[name+" must reach the real writer"]).toEqual([target]);
          expect(JSON.parse(readFileSync(target,"utf8")).constructed).toBe(true);
        }else{
          expect(summary.route,result.stdout).toBe("stop_construction");
          expect(writer.calls,[name+" must not reach the writer"]).toEqual([]);
          expect(bytes).toBe(UNTOUCHED);
        }
      }finally{rmSync(dir,{recursive:true,force:true});}
    });
  }
  it("keeps four adaptation items as adapt when no hard condition is hit",()=>{
    const {result,dir}=attemptConstruction(sample("adapt"));
    try{
      const summary=accepted(result,"adapt");
      expect(summary.adaptation_count).toBe(4);
      expect(summary.hard_conditions).toEqual([]);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });
  it("unusable keeps two destinations with named owners but never reaches the writer",()=>{
    const {result,writer,dir,bytes}=attemptConstruction(sample("unusable"));
    try{
      const summary=accepted(result,"unusable",{constructible:false});
      expect(summary.route).toBe("stop_construction");
      expect(summary.destinations).toHaveLength(2);
      expect(summary.destinations.every(item=>typeof item.owner==="string"&&item.owner.length>0)).toBe(true);
      expect(writer.calls).toEqual([]);
      expect(bytes).toBe(UNTOUCHED);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });
});

describe("ORACLE-JUDGMENT refuses construction before the writer",()=>{
  for(const [name,code] of [["unusable-missing-next","MISSING_NEXT"],["unusable-missing-owner","MISSING_OWNER"]]){
    it("rejects "+name+" without calling the writer",()=>{
      const {result,target,writer,bytes,dir}=attemptConstruction(sample(name));
      try{
        rejected(result,code);
        expect(writer.calls).toEqual([]);
        expect(bytes).toBe(UNTOUCHED);
        expect(statSync(target).size).toBe(Buffer.byteLength(UNTOUCHED));
      }finally{rmSync(dir,{recursive:true,force:true});}
    });
  }
  it("rejects a deleted old-page disposition",()=>{
    const copy=mutateJudgment(sample("direct"),data=>{delete data.old_pages[0].disposition;});
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"MISSING_OLD_PAGE_DISPOSITION");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("rejects a deleted old-page reason",()=>{
    const copy=mutateJudgment(sample("direct"),data=>{delete data.old_pages[0].reason;});
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"MISSING_OLD_PAGE_REASON");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("rejects a deleted chain",()=>{
    const copy=mutateJudgment(sample("direct"),data=>{delete data.chains.data;});
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"MISSING_CHAIN");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("rejects an implementation fixture posing as a real design source",()=>{
    const copy=mutateJudgment(sample("direct"),data=>{
      data.design_source.role="implementation_fixture";
      data.design_source.ref="tests/fixtures/design-port-sample/prototype";
    });
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"ROLE_CONFLICT");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("rejects a real design source outside specs/design/prototypes",()=>{
    const copy=mutateJudgment(sample("direct"),data=>{
      data.design_source.role="real_design_source";
      data.design_source.ref="specs/workflowhub-design-port-flow-20261115/prototype";
    });
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"ROLE_CONFLICT");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("rejects a normalized design-source path that escapes its declared root",()=>{
    const copy=mutateJudgment(sample("direct"),data=>{data.design_source.ref="tests/fixtures/../specs/design/prototypes/other";});
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"ROLE_CONFLICT");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("rejects hard conditions declared on an adapt verdict",()=>{
    const copy=mutateJudgment(sample("adapt"),data=>{data.hard_conditions=["interaction_unportable"];});
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{rejected(result,"VERDICT_CONFLICT");expect(writer.calls).toEqual([]);expect(bytes).toBe(UNTOUCHED);}
      finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
});

describe("ORACLE-JUDGMENT awaiting confirmation pauses before verdict success",()=>{
  it("keeps the valid adapt verdict but does not write while awaiting",()=>{
    const copy=mutateJudgment(sample("adapt"),data=>{data.pending_confirmation={status:"awaiting",reason:"等方向 owner 确认"};});
    try{
      const {result,writer,bytes,dir}=attemptConstruction(copy.target);
      try{
        rejected(result,"AWAITING_CONFIRMATION");
        expect(writer.calls).toEqual([]);
        expect(bytes).toBe(UNTOUCHED);
        expect(result.stdout,result.stdout).toContain("adapt");
      }finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("resumes only from a readable confirmation original",()=>{
    const copy=mutateJudgment(sample("adapt"),data=>{data.pending_confirmation={status:"awaiting",reason:"等方向 owner 确认"};});
    try{
      const confirmation=join(copy.dir,"confirmation.md");
      writeFileSync(confirmation,"# 确认\n\n方向 owner 确认按适配后套用继续。\n");
      const {result,writer,target,dir}=attemptConstruction(copy.target,{confirmationRef:confirmation});
      try{
        const summary=accepted(result,"adapt");
        expect(summary.confirmation).toMatchObject({status:"confirmed"});
        expect(resolve(summary.confirmation.confirmation_ref)).toBe(resolve(confirmation));
        expect(writer.calls).toEqual([target]);
        expect(JSON.parse(readFileSync(target,"utf8")).constructed).toBe(true);
      }finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
  it("fails when a provided confirmation original is unreadable",()=>{
    const copy=mutateJudgment(sample("adapt"),data=>{data.pending_confirmation={status:"awaiting",reason:"等方向 owner 确认"};});
    try{
      const missing=join(copy.dir,"not-created.md");
      const {result,writer,bytes,dir}=attemptConstruction(copy.target,{confirmationRef:missing});
      try{
        expect(result.status,result.stderr).not.toBe(0);
        expect(result.stderr,result.stderr).toContain("CONFIRMATION_UNREADABLE");
        expect(writer.calls).toEqual([]);
        expect(bytes).toBe(UNTOUCHED);
      }finally{rmSync(dir,{recursive:true,force:true});}
    }finally{rmSync(copy.dir,{recursive:true,force:true});}
  });
});

describe("ORACLE-JUDGMENT real workflow consumption actions",()=>{
  it("build-code step 1 starts from status:begin, then runs the judgment pre-check and can refuse",()=>{
    const text=readFileSync(BUILD_CODE,"utf8");
    const start=text.indexOf('<a id="step-read-current-task-documents"></a>');
    const end=text.indexOf('<a id="step-write-red-tests"></a>');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const step1=text.slice(start,end);
    expect(step1).toContain("status:begin");
    expect(step1).toContain("check-judgment");
    expect(step1.indexOf("status:begin")).toBeLessThan(step1.indexOf("check-judgment"));
    expect(step1).toMatch(/拒绝施工/);
    expect(step1).toMatch(/等待确认|awaiting/);
  });
  it("build-plan owns the judgment contract with three chains, six checks, hard conditions and destinations",()=>{
    const text=readFileSync(BUILD_PLAN,"utf8");
    expect(text).toMatch(/## 有稿判断/);
    for(const token of ["三链","六项判断","硬条件","三档","两条去向","负责人","check-judgment"])expect(text,`build-plan must carry ${token}`).toContain(token);
  });
  it("build-prd records the judgment original without creating a second PRD authority",()=>{
    const text=readFileSync(BUILD_PRD,"utf8");
    expect(text).toContain("有稿");
    expect(text).toContain("判断");
    expect(text).toContain("不另建");
    expect(text).toContain("judgment.md");
  });
  it("extraction skill carries the port consumption entry without changing old fields",()=>{
    const text=readFileSync(EXTRACTION,"utf8");
    expect(text).toContain("references/port-method.md");
    expect(text).toContain("移植登记");
    expect(text).toContain("check-port-manifest.mjs");
    expect(text).toContain("design-source-extraction.json");
  });
});

describe("ORACLE-JUDGMENT public status:begin chain",()=>{
  it("records the authenticated task context before construction without caller-supplied identity",()=>{
    const status=spawnSync(process.execPath,[join(ROOT,"tools/cli/stage-runtime.mjs"),"status","--action=begin","--stage=build-code"],{cwd:ROOT,encoding:"utf8",timeout:120000});
    expect(status.status,status.stderr).toBe(0);
    const context=JSON.parse(status.stdout);
    expect(context.stage).toBe("build-code");
    expect(typeof context.task_id).toBe("string");
    expect(context.task_id.length).toBeGreaterThan(0);
    expect(Array.isArray(context.missing_materials)).toBe(true);
  });
});
