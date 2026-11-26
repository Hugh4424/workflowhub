import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan, inspectDeliveryCloseState } from "../../core/task-close.mjs";
const roots=[];let counter=0;
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function git(root,args){return execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
// The declared-step gate (core/task-close.mjs) reads real step claims and the
// material's step-consumer declaration. Fixtures seed both so this file keeps
// judging its own subject instead of tripping the gate. Evidence shape follows
// the P9 hard-gate sample; no assertion or expectation is relaxed.
const GATE_STEPS=[["make-decision","module-convergence"],["build-plan","spec-plan"],["build-code","write-red-tests"],["build-code","implement-change"],["build-code","inspect-and-route-actual-tests"],["build-code","run-tests"],["build-code","inspect-acceptance-and-ui"],["build-code","scan-diff"],["build-code","review-change"],["build-code","analyze-review-findings"]];
function seedStepEvidence(taskDir,materials,id){
  mkdirSync(join(taskDir,"quality","evidence"),{recursive:true});
  const claims=[],table=[];
  for(const[stage,slug]of GATE_STEPS){
    const source=`workflows/${stage}/steps.json`,ref=`quality/evidence/${slug}.json`;
    writeFileSync(join(taskDir,ref),`${JSON.stringify({task_id:id,source,step_slug:slug,reader:"owned close fixture",inputs:["controlled observation"],observation:"controlled observation read back",criteria_ref:`workflows/${stage}/SKILL.md#方法`,conclusion:"completed",limits:[]})}\n`);
    claims.push({kind:"quality_evidence",source,step_slug:slug,ref,sha256:"0".repeat(64),command:"read controlled claim",exit_code:0,failure_signature:"none"});
    table.push(`| [${stage} steps:1](<../../${source}#L1>) \`${slug}\` | 受控观察 | human | 同 source 只替泛句 |`);
  }
  writeFileSync(join(materials,"step-consumer-design.md"),`# 步骤消费者\n\n${table.join("\n")}\n`);
  const path=join(taskDir,"facts.jsonl"),raw=existsSync(path)?readFileSync(path,"utf8"):"";
  const rows=raw.trim()?raw.trim().split("\n").map(line=>JSON.parse(line)):[];
  rows.push({record_kind:"step_claims",task_id:id,created_at:"2026-10-20T00:00:00Z",evidence:{value:claims}});
  writeFileSync(path,rows.map(row=>JSON.stringify(row)).join("\n")+"\n");
}
function fixture({existing=false,remoteTask=true}={}){
  const base=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-close-narrow-")));roots.push(base);
  const repo=join(base,"repo"),bare=join(base,"origin.git"),id=`close-${++counter}`,worktree=join(base,`repo-${id}`),taskDir=join(base,"storage","Projects","workflowhub","tasks",id);
  mkdirSync(repo);mkdirSync(bare);mkdirSync(taskDir,{recursive:true});
  git(repo,["init","-q","-b","main"]);git(repo,["config","user.name","Owned close fixture"]);git(repo,["config","user.email","fixture@local.invalid"]);
  const hooks=join(base,"hooks");mkdirSync(hooks);git(repo,["config","core.hooksPath",hooks]);
  writeFileSync(join(repo,"README.md"),"base\n");git(repo,["add","README.md"]);git(repo,["commit","-qm","base"]);
  git(bare,["init","--bare","-q"]);git(repo,["remote","add","origin",bare]);git(repo,["push","-q","origin","main"]);
  const branch=`task/workflowhub/${id}`;git(repo,["worktree","add","-q","-b",branch,worktree,"main"]);
  const source=`specs/${id}`;mkdirSync(join(worktree,source),{recursive:true});writeFileSync(join(worktree,source,"decision-log.md"),"# Decision\n");writeFileSync(join(worktree,source,"spec.md"),"# Spec\n");
  git(worktree,["add",source]);git(worktree,["commit","-qm","materials"]);if(remoteTask)git(worktree,["push","-q","origin",branch]);
  writeFileSync(join(taskDir,"task.json"),JSON.stringify({schema_version:"1.0.0",project_name:"workflowhub",task_id:id,created_at:"2026-10-02T00:00:00Z",target_repo_root:repo,record_model:"vnext-single-write",activation_cohort:"post",...(existing?{workspace_mode:"existing",workspace_root:worktree}:{})})+"\n");
  writeFileSync(join(taskDir,"facts.jsonl"),JSON.stringify({record_kind:"stage",task_id:id,stage:"verify-code",source:"owned-close-fixture",created_at:"2026-10-20T00:00:00Z"})+"\n");
  seedStepEvidence(taskDir,join(worktree,source),id);
  return {base,repo,bare,worktree,id,taskDir,branch,source,delivery:{remote:"origin",target_branch:"main",task_branch:branch,spec_source_path:source,spec_archive_path:`specs/archive/${id}`}};
}
async function prepare(s,mode){return prepareDeliveryClosePlan({taskDir:s.taskDir,delivery:s.delivery,...(mode?{closeMode:mode}:{})});}
async function confirm(s,p,outcome="confirmed",replyText="Owned fixture explicit reply"){return confirmClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,outcome,replyText});}
async function authorized(s,p){const c=await confirm(s,p);await authorizeClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});return c;}
async function execute(s,p,c){return executeClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});}

describe("real remote and cleanup failure boundaries",()=>{
 it("reports an absent remote target ref specifically as unavailable before planning",async()=>{const s=fixture();git(s.bare,["update-ref","-d","refs/heads/main"]);await expect(prepare(s)).rejects.toMatchObject({code:"REMOTE_TARGET_UNAVAILABLE"});});
 it("keeps a read-only explicit close status when the remote probe fails",async()=>{const s=fixture(),p=await prepare(s);git(s.repo,["remote","set-url","origin",join(s.base,"missing.git")]);const out=await inspectDeliveryCloseState({taskDir:s.taskDir,planRef:p.plan_ref});expect(out.remote.status).toBe("unavailable");expect(out.facts.push).toBe(false);expect(out.facts.remote_branch_cleanup).toBe(false);});
 it("never removes a remote task branch without the recorded cleanup operation",async()=>{const s=fixture(),p=await prepare(s),c=await confirm(s,p);await authorizeClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,operations:["commit","merge","archive","push"]});const out=await execute(s,p,c);expect(out.status).toBe("failed");expect(out.operation).toBe("cleanup");expect(out.error.code).toBe("IRREVERSIBLE_AUTHORIZATION_REQUIRED");expect(git(s.repo,["ls-remote","--heads","origin",s.branch])).not.toBe("");expect(existsSync(s.worktree)).toBe(true);});
 it("preserves a failed remote delete and the owned worktree instead of reporting completed",async()=>{const s=fixture(),p=await prepare(s),c=await authorized(s,p);git(s.bare,["config","receive.denyDeletes","true"]);const out=await execute(s,p,c);expect(out.status).toBe("failed");expect(out.operation).toBe("cleanup");expect(existsSync(s.worktree)).toBe(true);expect(git(s.repo,["ls-remote","--heads","origin",s.branch])).not.toBe("");expect(JSON.parse(readFileSync(out.failure_ref)).status).toBe("failed");});
});
