import {afterEach,describe,expect,it} from "vitest";
import {execFileSync,spawnSync} from "node:child_process";
import {mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync,existsSync,readdirSync,symlinkSync,linkSync} from "node:fs";
import {tmpdir} from "node:os";import{join}from"node:path";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function env(){const e={...process.env};for(const k of Object.keys(e))if(k.startsWith("GIT_"))delete e[k];return e;}
const git=(cwd,...args)=>execFileSync("git",args,{cwd,env:env(),encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
function root(){const p=realpathSync(mkdtempSync(join(tmpdir(),"card06-ordinary-consumer-")));roots.push(p);return p;}
function repository(p){mkdirSync(p);git(p,"init","-q","-b","main");git(p,"config","user.name","Owned ordinary test");git(p,"config","user.email","owned@test.invalid");writeFileSync(join(p,"README.md"),"owned baseline\n");git(p,"add",".");git(p,"commit","-qm","baseline");}
import{bootstrapTask}from"../../tools/cli/task-bootstrap.mjs";
const cli=new URL("../../tools/cli/stage-runtime.mjs",import.meta.url).href;
async function fixture(){const r=root(),repo=join(r,"repo"),storage=join(r,"storage"),home=join(r,"home");repository(repo);mkdirSync(storage);mkdirSync(home);const boot=await bootstrapTask({project:"OwnedEntry",task:"current-entry", "target-repo":repo},{env:{HOME:home,WORKFLOWHUB_TASK_DIR:storage},home,cwd:repo});const wt=boot.workspace.worktree_root,material=join(wt,"specs/current-entry");mkdirSync(join(material,"phases"),{recursive:true});const spec = [
  "# Current specification",
  "- **FR-001**：Visible owned result.",
  "- [ ] **AC-001 — visible result**",
  "  - **需求**：FR-001",
  "  - **通过条件**：visible result is returned.",
  "  - **失败条件**：result is lost.",
  "## 实现设计（全局权威）",
  "### Code Anchors",
  "`README.md` owns visible output.",
  "### Interfaces and Failure Semantics",
  "Return visible output and preserve failure.",
  "### Requirement-to-Task Trace",
  "| source | FR | AC | task | oracle |",
  "| --- | --- | --- | --- | --- |",
  "| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-PHASE-READINESS |",
  "### Global Verification Strategy",
  "`node --test tests/owned.test.mjs`",
  "",
].join("\n");
const index = [
  "# Phase index",
  "## Execution Index",
  "| phase | authority ref | semantic anchor | write set | dependency | consumer |",
  "| --- | --- | --- | --- | --- | --- |",
  "| `P1` | `phases/P1.md` | `phase-p1` | `README.md` | `none` | build-code |",
  "",
].join("\n");
const phase = [
  "# Phase P1 — owned cursor",
  "- **Global spec**：`spec.md`",
  "- **Write set**：`README.md`",
  "- **Dependency**：none",
  "- **Consumer**：build-code",
  "## L0 — Outcome",
  "### 开工就绪表",
  "| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |",
  "| --- | --- | --- | --- | --- |",
  "| `node -e \"process.exit(0)\"` | 0 | quality/tests/p5-readiness.output | 机器 | 计划负责人 |",
  "- **gate_cmd**：`node --test tests/owned.test.mjs`",
  "- **expected_exit**：RED nonzero; GREEN 0",
  "- **oracle**：ORACLE-PHASE-READINESS",
  "- **evidence_path**：quality/tests/p5-readiness.output",
  "- **STOP**：preserve actual failure",
  "- **Done**：real target result",
  "## L1 — Contract",
  "### T001 — Owned current task",
  "This card keeps the owned cursor fact and the lost-output failure replayable.",
  "- **Source / FR / AC**：R-001 / FR-001 / AC-001",
  "- **Files / symbols**：`README.md` symbol: N/A — fixture source text",
  "- **Action**：return the owned result",
  "- **Inputs**：owned input and a negative case",
  "- **Outputs / failure**：visible output or explicit failure",
  "- **Boundary / DO NOT TOUCH**：no external repository changes",
  "- **Dependency**：none",
  "- **Test tier / skill**：feature / backend-testing",
  "- **Scenario / fixture or service**：owned local result",
  "- **RED/GREEN gate_cmd**：`node --test tests/owned.test.mjs`",
  "- **expected_exit**：RED target nonzero; GREEN 0",
  "- **RED target failure**：ORACLE-PHASE-READINESS assertion fails when result lost",
  "- **GREEN oracle**：ORACLE-PHASE-READINESS visible output assertion",
  "- **Evidence**：quality/tests/p5-readiness.output",
  "- **STOP / recovery**：preserve failure and continue safe repair",
  "- **Coverage limit**：no external provider quality",
  "- **Done**：real result and evidence",
  "## L2 — Removable reference",
  "Owned fixture, not a workflow permit.",
  "",
].join("\n");
for(const[name,text]of Object.entries({"decision-log.md":"# Current decision\n\n## 任务身份\n- **任务类型**：普通任务\n","spec.md":spec,"phases/index.md":index,"phases/P1.md":phase}))writeFileSync(join(material,name),text);git(wt,"add","specs");git(wt,"commit","-qm","owned current materials");return{r,repo,storage,home,wt,material,taskPath:boot.task_path,n:0};}
function call(f,behavior,action,{stage="build-code",input,extra=[],review=false}={}){const argv=[behavior,`--action=${action}`,`--stage=${stage}`,"--project=OwnedEntry","--task=current-entry",`--task-path=${f.taskPath}`,...extra];if(input!==undefined){const p=join(f.wt,`input-${++f.n}.json`);writeFileSync(p,JSON.stringify(input)+"\n");argv.push(`--input=${p}`);}const code=`import{stageRuntimeCliMain}from${JSON.stringify(cli)};try{const value=await stageRuntimeCliMain(JSON.parse(process.argv[1]),${review?'{services:{runReviewRound:async(request,options)=>{await options.onProviderOutput({provider:"owned/stub",output:Buffer.from([0xff,0x00,0x41])});return{status:"unavailable",dispatch_state:"unknown",findings:[],provider_results:[],error:{code:"OWNED_UNAVAILABLE",message:"controlled no-model review"}};}}}':'{}'});console.log(JSON.stringify({ok:true,value}));}catch(error){console.log(JSON.stringify({ok:false,error:{code:error.code??null,message:error.message}}));}`;const result=spawnSync(process.execPath,["--input-type=module","-e",code,JSON.stringify(argv)],{cwd:f.wt,env:{...env(),HOME:f.home,XDG_CONFIG_HOME:join(f.home,".config"),WORKFLOWHUB_TASK_DIR:f.storage},encoding:"utf8",timeout:15000,stdio:["ignore","pipe","pipe"]});expect(result.error).toBeUndefined();expect(result.status).toBe(0);return JSON.parse(result.stdout);}
function originalFacts(f){return readFileSync(join(f.taskPath,"facts.jsonl"));}

describe("ordinary public facts without a reflection completion writer",()=>{
 it("rejects the removed reflect action and machine judgment before any task fact write",async()=>{const f=await fixture(),before=originalFacts(f),input={reflection_status:"ok",receipts:{review:"old"},snapshot_tree:"old-passive-data"};const removed=call(f,"run","reflect",{stage:"build-plan",input});expect(removed).toMatchObject({ok:false,error:{message:"unknown public runtime action"}});const wrong=call(f,"run","execute",{stage:"build-plan",input});expect(wrong.ok).toBe(false);expect(wrong.error.message).toMatch(/only records.*phase_progress/);expect(originalFacts(f)).toEqual(before);expect(existsSync(join(f.taskPath,"quality/stage-reflection"))).toBe(false);});
 it("stores the legitimate cursor with unknown/null quality and keeps human confirmation separate",async()=>{const f=await fixture(),run=call(f,"run","execute",{input:{phase_progress:{phase_id:"P1",task_id:"T001"}}});expect(run.ok).toBe(true);const rows=JSON.parse(originalFacts(f).toString().trim());expect(rows).toMatchObject({record_kind:"stage",stage:"build-code",phase_progress:{phase_id:"P1",task_id:"T001"},review_origin:"not_run",spec_analyze:{value:null},evidence:{value:null}});const before=originalFacts(f),confirm=call(f,"confirm","decision",{stage:"build-plan",extra:["--decision=approved","--reply-text=Only approve this owned plan.","--material-ref=spec.md"]});expect(confirm.ok).toBe(true);expect(originalFacts(f)).toEqual(before);expect(call(f,"status","begin").value.quality_status).toBe("unknown");expect(existsSync(join(f.taskPath,"quality/evidence/git-authorizations"))).toBe(false);});
});
