import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, symlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { inspectMaterialWorkspace, phaseFilesFromIndex } from "../../runtime/task/material-workspace.mjs";
import { checkSkillConsistency } from "../../tools/cli/check-skill-consistency.mjs";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const N8=join(ROOT,"specs/archive/n8-four-level-route-20261019");
const N9=join(ROOT,"specs/archive/n9-final-chain-verification-20261020");
const N2=join(ROOT,"specs/archive/n2-skill-catalog-portability-20261016");
const roots=[];
function temp(){const p=mkdtempSync(join(tmpdir(),"n10-material-"));roots.push(p);return p;}
afterEach(()=>{for(const p of roots.splice(0))rmSync(p,{recursive:true,force:true});});
function put(root,path,body){const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,body);}
function fixture(){const root=temp();const files=inspectMaterialWorkspace(N8).files;for(const [path,body] of Object.entries(files))put(root,path,body);return root;}
function run(args=[]){const env={...process.env};delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;const argv=[process.execPath,join(ROOT,"tools/cli/run-checks.mjs"),...args];const r=spawnSync(argv[0],argv.slice(1),{cwd:ROOT,encoding:"utf8",env,timeout:30000});console.log(JSON.stringify({argv,cwd:ROOT,exit:r.status,stdout:r.stdout,stderr:r.stderr}));return {...r,output:`${r.stdout??""}${r.stderr??""}`};}
describe("ORACLE-N10-MATERIAL-CONTRACT",()=>{
 it("T011 accepts real N8/N9 material and retains N2's two named errors",()=>{
  for(const root of [N8,N9]){const r=run(["--material-root",root]);expect(r.status,r.output).toBe(0);expect(r.stdout).toContain("[run-checks][material] PASS");expect(r.stdout).toContain(`phase_count=${phaseFilesFromIndex(readFileSync(join(root,"phases/index.md"),"utf8")).length}`);}
  const r=run(["--material-root",N2]);expect(r.status,r.output).toBe(1);expect(r.stdout).toContain("errors=2");expect(r.stdout).toContain("T006 G-2 missing concrete documentation-only owned write set");expect(r.stdout).toContain("T006 expected_exit must distinguish RED target failure from GREEN 0");
 });
 it("T011 rejects bad/mixed/duplicate parameters without aggregate output",()=>{
  for(const args of [["--material-root"],["--material-root","relative"],["--bogus"],["--material-root",N8,"--task-path","x"],["--material-root",N8,"--material-root",N9]]){const r=run(args);expect(r.status,r.output).toBe(1);expect(r.stderr).toContain("unsupported arguments");expect(r.stdout).toBe("");}
  const r=run(["--material-root",join(temp(),"missing")]);expect(r.status).toBe(1);expect(r.output).toContain("cannot read material root");
 });
 it("T012 distinguishes light from partial full material and exposes its level basis",()=>{
  const root=temp();put(root,"decision-log.md","## 级别与路线\n- **推荐级别**：轻档\n");
  const light=run(["--material-root",root]);expect(light.status,light.output).toBe(0);expect(light.stdout).toContain("这个级别不适用");expect(light.stdout).toContain("推荐级别");
  put(root,"spec.md","spec");put(root,"phases/index.md","index");const partial=run(["--material-root",root]);expect(partial.status).toBe(1);expect(partial.stdout).toContain("Phase");expect(partial.stdout).not.toContain("这个级别不适用");
 });
 it("T012 enforces explicit skip states without treating prose as a declaration",()=>{
  const root=fixture();const path=phaseFilesFromIndex(readFileSync(join(root,"phases/index.md"),"utf8"))[0];const original=readFileSync(join(root,path));
  for(const [state,status,fragment]of [["N/A",1,"理由"],["N/A — 无页面",0,""],["deferred",1,"责任卡"],["deferred；责任卡：P9；触发条件：输入到达；受影响结果：演示",0,""]]){
   put(root,path,original.toString()+`\n- **状态**：${state}\n`);const r=run(["--material-root",root]);expect(r.status,r.output).toBe(status);if(fragment){expect(r.stdout).toContain(fragment);expect(r.stdout).toContain(path+":");}
  }
  put(root,path,original.toString()+"\n这段散文讨论 deferred，不是状态声明。\n");expect(run(["--material-root",root]).status).toBe(0);
 });
 it("T012 rejects empty or prose-only deferred fields and does not borrow the next task",()=>{
  const root=fixture();const path=phaseFilesFromIndex(readFileSync(join(root,"phases/index.md"),"utf8"))[0];const original=readFileSync(join(root,path));
  for(const declaration of [
   "- **状态**：deferred；责任卡：；触发条件：；受影响结果：\n",
   "- **状态**：deferred\n尚无责任卡、触发条件、受影响结果。\n",
   "- **状态**：deferred\n### T999 — 下一任务\n- **责任卡**：P9；触发条件：输入到达；受影响结果：演示\n",
  ]){put(root,path,original.toString()+"\n"+declaration);const r=run(["--material-root",root]);expect(r.status,r.output).toBe(1);for(const field of ["责任卡","触发条件","受影响结果"])expect(r.stdout).toContain(`deferred 缺${field}`);}
 });
 it("T012 accepts nonempty adjacent multiline deferred fields in the same declaration",()=>{
  const root=fixture();const path=phaseFilesFromIndex(readFileSync(join(root,"phases/index.md"),"utf8"))[0];const original=readFileSync(join(root,path));
  put(root,path,original.toString()+"\n- **状态**：deferred\n- **责任卡**：P9\n- **触发条件**：输入到达\n- **受影响结果**：演示\n");const r=run(["--material-root",root]);expect(r.status,r.output).toBe(0);
 });
 it("T012 rejects a level prefix typo while preserving supported task and bracket suffixes",()=>{
  const root=temp();put(root,"decision-log.md","## 级别与路线\n- **推荐级别**：轻档误写\n");const bad=run(["--material-root",root]);expect(bad.status,bad.output).toBe(1);expect(bad.stdout).toContain("未读到级别事实");expect(bad.stdout).not.toContain("这个级别不适用");
  for(const level of ["轻档","轻档任务（简短说明）","轻档 (short note)"]){put(root,"decision-log.md",`## 级别与路线\n- **推荐级别**：${level}\n`);const r=run(["--material-root",root]);expect(r.status,r.output).toBe(0);expect(r.stdout).toContain("这个级别不适用");}
 });
 it("T012 rejects punctuation-only N/A reasons and preserves a short real reason",()=>{
  const root=fixture();const path=phaseFilesFromIndex(readFileSync(join(root,"phases/index.md"),"utf8"))[0];const original=readFileSync(join(root,path));
  for(const value of ["N/A —","N/A — ；。"]){put(root,path,original.toString()+`\n- **状态**：${value}\n`);const r=run(["--material-root",root]);expect(r.status,r.output).toBe(1);expect(r.stdout).toContain("缺不适用理由");}
  put(root,path,original.toString()+"\n- **状态**：N/A — 无页面\n");expect(run(["--material-root",root]).status).toBe(0);
 });
 it("T014 distinguishes no input from damaged material and restores exact bytes",()=>{
  const empty=temp();const file=join(temp(),"empty");writeFileSync(file,"");const zero=temp();put(zero,"decision-log.md","");
  for(const root of [empty,file,zero]){const r=run(["--material-root",root]);expect(r.status,r.output).toBe(0);expect(r.stdout).toContain("没有输入");expect(r.stdout).not.toContain("[run-checks][material] PASS");expect(r.stdout).not.toContain("ALL CHECKS PASSED");}
  const root=fixture();const paths=["spec.md",phaseFilesFromIndex(readFileSync(join(root,"phases/index.md"),"utf8"))[0],"phases/index.md"];
  for(const path of paths){const original=readFileSync(join(root,path));const body=original.toString();const damaged=path==="spec.md"?"":path==="phases/index.md"?body.replace(/^\| `P\d+`.*\n/gm,""):body.replace(/^## L1[^\n]*\n[\s\S]*?(?=^## |$(?![\s\S]))/m,"");expect(damaged).not.toBe(body);put(root,path,damaged);const bad=run(["--material-root",root]);expect(bad.status,bad.output).toBe(1);expect(bad.stdout).toContain(path);put(root,path,original);expect(readFileSync(join(root,path))).toEqual(original);expect(run(["--material-root",root]).status).toBe(0);}
 });
 it("T014 rejects a nonempty regular file root instead of classifying it as no input",()=>{
  const path=join(temp(),"spec.md");writeFileSync(path,"# Nonempty specification\n");const r=run(["--material-root",path]);expect(r.status,r.output).toBe(1);expect(r.output).toContain(path);expect(r.output).toContain("cannot read material root");expect(r.stdout).not.toContain("没有输入");expect(r.stdout).not.toContain("[run-checks][material] PASS");
 });
 it("T015 reports exactly one default material-not-run fact without material scanning",()=>{
  const r=run();expect(r.status,r.output).toBe(0);expect(r.stderr).toBe("[run-checks] material check not run: no --material-root\n");expect(r.stdout).not.toContain("[run-checks][material]");expect(r.stdout).not.toContain("T006 G-2 missing");
 });
 it("T013 exposes real template shape while a damaged real index remains an error",()=>{
  const result=checkSkillConsistency(ROOT);expect(result.failures).toEqual([]);expect(result.reports.find(row=>row.startsWith("material-authoring skills/spec-plan/templates/index-template.md: 必留项"))).not.toContain("缺失 纯指针边界");
  const root=fixture();put(root,"phases/index.md","## Execution Index\n");const r=run(["--material-root",root]);expect(r.status).toBe(1);expect(r.stdout).toContain("phases/index.md");
 });
 it("T016 reports only five known templates and leaves author prose unscored",()=>{
  const reports=checkSkillConsistency(ROOT).reports.filter(row=>row.startsWith("material-authoring "));
  expect(new Set(reports.map(row=>row.split(":")[0])).size).toBe(5);
  expect(reports.find(row=>row.startsWith("material-authoring skills/spec-plan/templates/index-template.md: 必留项"))).toContain("机器结构在场");
  expect(reports.some(row=>/必留项 (?:pass|fail)|评分[:：]\s*\d/i.test(row))).toBe(false);
 });
 it("T011 preserves safe reader failures instead of classifying unreadable input as empty",()=>{
  const root=temp();const target=join(temp(),"empty.md");writeFileSync(target,"");symlinkSync(target,join(root,"decision-log.md"));const r=run(["--material-root",root]);expect(r.status,r.output).toBe(1);expect(r.stdout).toContain("single-link regular file");expect(r.stdout).not.toContain("没有输入");
 });
});
