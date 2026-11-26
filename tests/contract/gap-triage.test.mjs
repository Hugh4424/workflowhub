import{execFileSync,spawnSync}from"node:child_process";
import{existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,realpathSync,rmSync,writeFileSync}from"node:fs";
import{tmpdir}from"node:os";
import{join}from"node:path";
import{afterEach,expect,it}from"vitest";
import{prepareDeliveryClosePlan,confirmClosePlan,executeClosePlan}from"../../core/task-close.mjs";

// ORACLE-GAP-TRIAGE: the close gate accepts only declared gaps whose `class`
// is one of the four closed classes; an unclassified or unknown-class gap is
// rejected by name, before any close evidence of its own or Git action.
const GAP_CLASSES=["设计","实现","验收标准","资源"];
const TEN_ROWS=[
  {id:"AC-007",class:"设计"},{id:"AC-008",class:"资源"},{id:"AC-009",class:"资源"},
  {id:"AC-016",class:"资源"},{id:"AC-019",class:"资源"},{id:"AC-020",class:"资源"},
  {id:"AC-021",class:"资源"},{id:"AC-022",class:"资源"},{id:"AC-023(a)",class:"实现"},
  {id:"AC-023(b)",class:"资源"},
];
const roots=[];let counter=0;afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function git(root,args){return execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
function fixture(stage="build-code"){
  const base=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-gap-triage-")));roots.push(base);
  const repo=join(base,"repo"),bare=join(base,"origin.git"),storage=join(base,"storage"),home=join(base,"home"),id=`gap-${++counter}`;
  for(const dir of[storage,home])mkdirSync(dir);
  mkdirSync(repo);mkdirSync(bare);
  git(repo,["init","-q","-b","main"]);git(repo,["config","user.name","Gap triage fixture"]);git(repo,["config","user.email","fixture@local.invalid"]);
  writeFileSync(join(repo,"README.md"),"base\n");git(repo,["add","README.md"]);git(repo,["commit","-qm","base"]);
  git(bare,["init","--bare","-q"]);git(repo,["remote","add","origin",bare]);git(repo,["push","-q","origin","main"]);
  const worktree=join(base,`repo-${id}`),branch=`task/workflowhub/${id}`;
  git(repo,["worktree","add","-q","-b",branch,worktree,"main"]);
  const source=`specs/${id}`;mkdirSync(join(worktree,source),{recursive:true});
  writeFileSync(join(worktree,source,"decision-log.md"),"# Decision\n## 任务身份\n- **任务类型**：普通任务\n");
  writeFileSync(join(worktree,source,"spec.md"),"# Spec\n");git(worktree,["add",source]);git(worktree,["commit","-qm","materials"]);
  git(worktree,["push","-q","origin",branch]);
  const taskDir=join(storage,"Projects","workflowhub","tasks",id);mkdirSync(taskDir,{recursive:true});
  writeFileSync(join(taskDir,"task.json"),JSON.stringify({schema_version:"1.0.0",project_name:"workflowhub",task_id:id,created_at:"2026-10-02T00:00:00Z",target_repo_root:repo,record_model:"vnext-single-write",activation_cohort:"post"})+"\n");
  writeFileSync(join(taskDir,"facts.jsonl"),JSON.stringify({record_kind:"stage",task_id:id,stage,source:"owned-gap-triage-fixture",created_at:"2026-10-20T00:00:00Z"})+"\n");
  const delivery={remote:"origin",target_branch:"main",task_branch:branch,spec_source_path:source,spec_archive_path:`specs/archive/${id}`};
  return{repo,worktree,taskDir,storage,home,id,delivery};
}
// The declared-step gate runs before gap triage; seed real step claims so these
// cases judge the gap gate, not the step gate (same shape as the P9 hard-gate sample).
const GATE_STEPS=[["make-decision","module-convergence"],["build-plan","spec-plan"],["build-code","write-red-tests"],["build-code","implement-change"],["build-code","inspect-and-route-actual-tests"],["build-code","run-tests"],["build-code","inspect-acceptance-and-ui"],["build-code","scan-diff"],["build-code","review-change"],["build-code","analyze-review-findings"]];
function seedStepEvidence(taskDir,materials,id){
  mkdirSync(join(taskDir,"quality","evidence"),{recursive:true});
  const claims=[],table=[];
  for(const[stage,slug]of GATE_STEPS){
    const source=`workflows/${stage}/steps.json`,ref=`quality/evidence/${slug}.json`;
    writeFileSync(join(taskDir,ref),`${JSON.stringify({task_id:id,source,step_slug:slug,reader:"owned gap triage fixture",inputs:["controlled observation"],observation:"controlled observation read back",criteria_ref:`workflows/${stage}/SKILL.md#方法`,conclusion:"completed",limits:[]})}\n`);
    claims.push({kind:"quality_evidence",source,step_slug:slug,ref,sha256:"0".repeat(64),command:"read controlled claim",exit_code:0,failure_signature:"none"});
    table.push(`| [${stage} steps:1](<../../${source}#L1>) \`${slug}\` | 受控观察 | human | 同 source 只替泛句 |`);
  }
  writeFileSync(join(materials,"step-consumer-design.md"),`# 步骤消费者\n\n${table.join("\n")}\n`);
  const path=join(taskDir,"facts.jsonl"),raw=existsSync(path)?readFileSync(path,"utf8"):"";
  const rows=raw.trim()?raw.trim().split("\n").map(line=>JSON.parse(line)):[];
  rows.push({record_kind:"step_claims",task_id:id,created_at:"2026-10-20T00:00:00Z",evidence:{value:claims}});
  writeFileSync(path,rows.map(row=>JSON.stringify(row)).join("\n")+"\n");
}
async function planted(gap_triage,stage="build-code"){
  const s=fixture(stage);
  seedStepEvidence(s.taskDir,join(s.worktree,`specs/${s.id}`),s.id);
  const p=await prepareDeliveryClosePlan({taskDir:s.taskDir,delivery:{...s.delivery,...(gap_triage===undefined?{}:{gap_triage})}});
  const c=await confirmClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,replyText:"Owned fixture confirms the displayed gap triage plan."});
  const closeDir=join(s.taskDir,"quality","evidence","close");
  return{...s,p,c,closeEvidence:()=>readdirSync(closeDir).sort(),before:git(s.repo,["rev-parse","main"])};
}
async function preparedOnly(gap_triage,stage){
  const s=fixture(stage);
  seedStepEvidence(s.taskDir,join(s.worktree,`specs/${s.id}`),s.id);
  const p=await prepareDeliveryClosePlan({taskDir:s.taskDir,delivery:{...s.delivery,gap_triage}});
  return{...s,p};
}
function closeCli(s,args){
  const env={...process.env,HOME:s.home,WORKFLOWHUB_TASK_DIR:s.storage};
  for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];
  const cli=join(realpathSync(join(import.meta.dirname,"../..")),"tools","cli","task-close.mjs");
  const result=spawnSync(process.execPath,[cli,...args],{cwd:s.worktree,env,encoding:"utf8"});
  return{exit:result.status,stdout:result.stdout.trim(),stderr:result.stderr.trim()};
}
it("refuses a declared gap with no class by the named code, naming the gap, before any close action",async()=>{
  const{repo,worktree,taskDir,p,c,closeEvidence,before}=await planted([{id:"AC-016"}]);
  const evidenceBefore=closeEvidence();
  await expect(executeClosePlan({taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit"}))
    .rejects.toMatchObject({code:"GAP_TRIAGE_UNCLASSIFIED",message:expect.stringContaining("AC-016:(none)")});
  expect(git(repo,["rev-parse","main"])).toBe(before);
  expect(closeEvidence()).toEqual(evidenceBefore);
  expect(existsSync(join(taskDir,"quality","evidence","close-action"))).toBe(false);
});
it("refuses a class outside the four-class set, echoing the supplied value",async()=>{
  const{repo,taskDir,p,c,before}=await planted([{id:"AC-016",class:"缺材料"}]);
  await expect(executeClosePlan({taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit"}))
    .rejects.toMatchObject({code:"GAP_TRIAGE_UNCLASSIFIED",message:expect.stringContaining("AC-016:缺材料")});
  expect(git(repo,["rev-parse","main"])).toBe(before);
});
it("passes a fully classified gap triage through all four close steps",async()=>{
  const s=await preparedOnly(TEN_ROWS,"build-plan");
  expect(s.p.plan.gap_triage).toEqual(TEN_ROWS);
  const written=JSON.parse(readFileSync(s.p.plan_ref,"utf8"));
  expect(written.gap_triage).toEqual(TEN_ROWS);
  expect(written.known_gaps).toEqual([]);
  const base=["--project=workflowhub",`--task=${s.id}`,`--plan-ref=${s.p.plan_ref}`];
  // prepare went through the core export (the CLI has no --gap-triage yet), so
  // its success is the written plan above; the other three steps are the real CLI.
  const confirm=closeCli(s,["confirm",...base,"--decision=confirmed","--reply-text=Owned fixture confirms the displayed gap triage plan."]);
  const confirmationRef=JSON.parse(confirm.stdout).confirmation_ref;
  const manual=closeCli(s,["manual-close",...base,`--confirmation-ref=${confirmationRef}`,'--operations=["commit"]']);
  const execute=closeCli(s,["execute",...base,`--confirmation-ref=${confirmationRef}`,"--until=commit"]);
  expect([0,confirm.exit,manual.exit,execute.exit],execute.stderr||execute.stdout).toEqual([0,0,0,0]);
  expect(execute.stderr).not.toContain("GAP_TRIAGE_UNCLASSIFIED");
});
it("keeps old plans without gap_triage readable and unblocked",async()=>{
  const{taskDir,p,c}=await planted(undefined);
  expect(Object.prototype.hasOwnProperty.call(p.plan,"gap_triage")).toBe(false);
  const result=await executeClosePlan({taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit"});
  expect(result?.error?.code??null).not.toBe("GAP_TRIAGE_UNCLASSIFIED");
});
it("names every unclassified gap in one rejection, not only the first",async()=>{
  const{taskDir,p,c}=await planted([{id:"AC-007",class:"设计"},{id:"AC-016",class:""},{id:"AC-021"},{id:"AC-023",class:"材料"}]);
  const rejection=await executeClosePlan({taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit"}).then(()=>null,error=>error);
  expect(rejection).toMatchObject({code:"GAP_TRIAGE_UNCLASSIFIED"});
  expect(rejection.message).toContain("AC-016:(none)");
  expect(rejection.message).toContain("AC-021:(none)");
  expect(rejection.message).toContain("AC-023:材料");
});
it("accepts each of the four closed classes and records it in the plan",async()=>{
  expect(GAP_CLASSES).toEqual(["设计","实现","验收标准","资源"]);
  for(const cls of GAP_CLASSES){
    const{taskDir,p,c}=await planted([{id:"AC-007",class:cls}]);
    expect(p.plan.gap_triage).toEqual([{id:"AC-007",class:cls}]);
    const result=await executeClosePlan({taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit"});
    expect(result?.operation,`${cls}: the gap gate must pass and the call reach its next check`).toBe("claims");
    expect(result.error.code).toBe("DELIVERY_CLAIMS_REJECTED");
  }
});
