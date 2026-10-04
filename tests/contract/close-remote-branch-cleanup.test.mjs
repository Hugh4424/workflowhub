import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan, inspectDeliveryCloseState } from "../../core/task-close.mjs";
const roots=[];let counter=0;
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function git(root,args){return execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
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
  writeFileSync(join(taskDir,"facts.jsonl"),"");
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
