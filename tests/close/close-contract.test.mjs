import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan, inspectDeliveryCloseState, closeDelivery } from "../../core/task-close.mjs";
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

describe("close actual transactions without retired workflow permits",()=>{
 it("reports missing quality as unknown and stores a single ordinary explicit plan reference",async()=>{const s=fixture(),p=await prepare(s);expect(p.quality_status).toBe("unknown");expect(p.plan_ref).toMatch(/\d{4}-\d{2}-\d{2}-\d{3}-close-plan\.json$/);expect(p.plan).not.toHaveProperty("plan_hash");expect(p.plan).not.toHaveProperty("snapshot_tree");expect(JSON.parse(readFileSync(p.plan_ref))).toEqual(p.plan);});
 it("requires an actual verbatim reply and keeps timeout distinct from confirmation",async()=>{const s=fixture(),p=await prepare(s);await expect(confirm(s,p,"confirmed","")).rejects.toThrow(/reply/);const c=await confirmClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,outcome:"timeout"});expect(c.status).toBe("blocked");expect(JSON.parse(readFileSync(c.confirmation_ref))).not.toHaveProperty("reply");});
 it("rejects unrecorded Git authorization without changing source or target HEAD",async()=>{const s=fixture(),p=await prepare(s),c=await confirm(s,p),a=git(s.worktree,["rev-parse","HEAD"]),b=git(s.repo,["rev-parse","HEAD"]);const out=await execute(s,p,c);expect(out.status).toBe("failed");expect(out.error.code).toBe("IRREVERSIBLE_AUTHORIZATION_REQUIRED");expect(git(s.worktree,["rev-parse","HEAD"])).toBe(a);expect(git(s.repo,["rev-parse","HEAD"])).toBe(b);});
 it("preserves exactly five actions and reads their real physical results after owned cleanup",async()=>{const s=fixture(),p=await prepare(s);expect(p.plan.steps).toEqual(["commit","merge","archive","push","cleanup"]);const c=await authorized(s,p),out=await execute(s,p,c);expect(out.status).toBe("completed");expect(out.records.map(r=>r.operation)).toEqual(p.plan.steps);expect(existsSync(s.worktree)).toBe(false);expect(git(s.repo,["cat-file","-e",`main:specs/archive/${s.id}/spec.md`])).toBe("");const readback=await inspectDeliveryCloseState({taskDir:s.taskDir,planRef:p.plan_ref});for(const flag of ["delivery_committed","merge","archive","push","worktree_cleanup","branch_cleanup","remote_branch_cleanup"])expect(readback.facts[flag],flag).toBe(true);});
 it("captures dirty source before planning but rejects later bytes drifting from that plan",async()=>{const s=fixture();writeFileSync(join(s.worktree,"changed.txt"),"first\n");const p=await prepare(s);expect(p.plan.source.changes.map(r=>r.path)).toContain("changed.txt");const c=await authorized(s,p);writeFileSync(join(s.worktree,"changed.txt"),"second\n");const out=await execute(s,p,c);expect(out.status).toBe("failed");expect(out.error.code).toBe("SOURCE_BYTES_DRIFT");expect(readFileSync(join(s.worktree,"changed.txt"),"utf8")).toBe("second\n");});
 it("rejects dirty target before performing any source commit",async()=>{const s=fixture();writeFileSync(join(s.worktree,"change.txt"),"planned\n");const p=await prepare(s),c=await authorized(s,p),head=git(s.worktree,["rev-parse","HEAD"]);writeFileSync(join(s.repo,"unrelated.txt"),"user-owned\n");await expect(execute(s,p,c)).rejects.toThrow(/clean|dirty/i);expect(git(s.worktree,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(join(s.repo,"unrelated.txt"),"utf8")).toBe("user-owned\n");});
 it("keeps existing worktrees and branches while marking cleanup skipped",async()=>{const s=fixture({existing:true}),p=await prepare(s),c=await authorized(s,p),out=await execute(s,p,c);expect(out.status).toBe("completed");expect(out.records.find(r=>r.operation==="cleanup").status).toBe("skipped");expect(existsSync(s.worktree)).toBe(true);expect(git(s.repo,["rev-parse",`refs/heads/${s.branch}`])).not.toBe("");});
 it("keeps the four-action planning route without automatically archiving its materials",async()=>{const s=fixture(),p=await prepare(s,"planning");expect(p.plan.steps).toEqual(["commit","merge","push","cleanup"]);const c=await authorized(s,p),out=await execute(s,p,c);expect(out.status).toBe("executed");expect(git(s.repo,["cat-file","-e",`main:${s.source}/spec.md`])).toBe("");});
 it("one-shot close executes actual five-action Git delivery after the real reply",async()=>{const s=fixture();const out=await closeDelivery({taskDir:s.taskDir,delivery:s.delivery,replyText:"Owned fixture: execute all displayed five actions"});expect(out.status).toBe("completed");expect(existsSync(s.worktree)).toBe(false);expect(git(s.repo,["cat-file","-e",`main:specs/archive/${s.id}/spec.md`])).toBe("");});
 it("reads the current planning task declaration and defaults to four actions",async()=>{const s=fixture();writeFileSync(join(s.worktree,s.source,"decision-log.md"),"# Decision\n\n## 任务身份\n- **任务类型**：规划任务\n");const p=await prepare(s);expect(p.plan.steps).toEqual(["commit","merge","push","cleanup"]);const out=await closeDelivery({taskDir:s.taskDir,delivery:s.delivery,replyText:"Owned fixture: execute four actions and leave materials"});expect(out.status).toBe("executed");expect(git(s.repo,["cat-file","-e",`main:${s.source}/spec.md`])).toBe("");expect(existsSync(join(s.repo,`specs/archive/${s.id}`))).toBe(false);});
 it("requires an explicit same-task archive declaration before the later two-action close",async()=>{const s=fixture();writeFileSync(join(s.worktree,s.source,"decision-log.md"),"# Decision\n\n## 任务身份\n- **任务类型**：规划任务\n");const out=await closeDelivery({taskDir:s.taskDir,delivery:s.delivery,replyText:"Owned fixture: planning delivery only"});expect(out.status).toBe("executed");const declaration=join(s.taskDir,"quality","evidence","archive-request.json");writeFileSync(declaration,JSON.stringify({task_id:"another-task",workflow:"build-prd",reply_text:"现在明确下令归档"}));await expect(prepareDeliveryClosePlan({taskDir:s.taskDir,priorPlanRef:out.plan_ref,archiveDeclarationRef:declaration})).rejects.toMatchObject({code:"ARCHIVE_DECLARATION"});writeFileSync(declaration,JSON.stringify({task_id:s.id,workflow:"build-prd",reply_text:"禁止归档"}));await expect(prepareDeliveryClosePlan({taskDir:s.taskDir,priorPlanRef:out.plan_ref,archiveDeclarationRef:declaration})).rejects.toMatchObject({code:"ARCHIVE_DECLARATION"});for(const status of ["in_progress","unknown","blocked","cancelled"]){writeFileSync(declaration,JSON.stringify({task_id:s.id,workflow:"build-prd",reply_text:"现在明确下令归档",step_results:[{status}]}));await expect(prepareDeliveryClosePlan({taskDir:s.taskDir,priorPlanRef:out.plan_ref,archiveDeclarationRef:declaration})).rejects.toMatchObject({code:"ARCHIVE_DECLARATION_INCOMPLETE"});}writeFileSync(declaration,JSON.stringify({task_id:s.id,workflow:"build-prd",reply_text:"现在明确下令归档"}));const p=await prepareDeliveryClosePlan({taskDir:s.taskDir,priorPlanRef:out.plan_ref,archiveDeclarationRef:declaration});expect(p.plan.steps).toEqual(["archive","push"]);const c=await confirm(s,p);await authorizeClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,operations:["push"]});const denied=await execute(s,p,c);expect(denied.status).toBe("failed");expect(denied.error.code).toBe("IRREVERSIBLE_AUTHORIZATION_REQUIRED");expect(existsSync(join(s.repo,s.source))).toBe(true);expect(existsSync(join(s.repo,`specs/archive/${s.id}`))).toBe(false);const archive=await closeDelivery({taskDir:s.taskDir,priorPlanRef:out.plan_ref,archiveDeclarationRef:declaration,replyText:"Owned fixture: execute the displayed archive and push"});expect(archive.status).toBe("completed");expect(git(s.repo,["cat-file","-e",`main:specs/archive/${s.id}/spec.md`])).toBe("");});
 it("supports the actual existing-worktree manifest whose declared target is that source worktree",async()=>{const s=fixture({existing:true});const path=join(s.taskDir,"task.json"),manifest=JSON.parse(readFileSync(path));manifest.target_repo_root=s.worktree;writeFileSync(path,JSON.stringify(manifest));const p=await prepare(s);expect(p.plan.target_repo_root).toBe(s.repo);expect(p.plan.worktree_root).toBe(s.worktree);const out=await closeDelivery({taskDir:s.taskDir,delivery:s.delivery,replyText:"Owned fixture: preserve existing source, deliver to actual main"});expect(out.status).toBe("completed");expect(existsSync(s.worktree)).toBe(true);});
});

// Source-only approvals 133/180: native seam, NOT core.execute end-to-end close.
it("P10 native public six actions bind real TASK and MAIN grants to cwd HEAD and distinct step ids", async () => {
 const {dirname,basename,resolve}=await import("node:path"),{lstatSync,readdirSync}=await import("node:fs"),{fileURLToPath}=await import("node:url");
 const {bootstrapTask}=await import("../../tools/cli/task-bootstrap.mjs"),{stageRuntimeCliMain}=await import("../../tools/cli/stage-runtime.mjs");
 const authCli=fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs",import.meta.url));
 const realGit=execFileSync("/usr/bin/which",["git"],{encoding:"utf8"}).trim(),parent=realpathSync(tmpdir());
 const root=realpathSync(mkdtempSync(join(parent,"workflowhub-native-six-"))),identity=lstatSync(root),saved={...process.env};
 const repo=join(root,"repo"),bare=join(root,"origin.git"),home=join(root,"home"),storage=join(root,"storage"),taskId="native-six",branch=`task/workflowhub/${taskId}`,requests=[];
 const owned=path=>{const actual=realpathSync(path);expect(actual).toBe(resolve(path));expect(actual.startsWith(`${root}/`)).toBe(true);return actual;};
 try {
  expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-six-")).toBe(true);
  for(const path of[repo,bare,home,storage])mkdirSync(path);
  for(const key of Object.keys(process.env))if(key.startsWith("GIT_")||key==="WORKFLOWHUB_TASK_DIR")delete process.env[key];
  Object.assign(process.env,{HOME:home,XDG_CONFIG_HOME:join(home,".config"),WORKFLOWHUB_TASK_DIR:storage});
  const localGit=(cwd,args)=>{owned(cwd);if(args[0]==="push"){expect(args[1]).toBe("origin");expect(execFileSync(realGit,["remote","get-url","origin"],{cwd,encoding:"utf8",env:process.env}).trim()).toBe(bare);}requests.push({cwd,args:[...args]});return execFileSync(realGit,args,{cwd,encoding:"utf8",env:process.env,stdio:["ignore","pipe","pipe"]}).trim();};
  localGit(repo,["init","-q","-b","main"]);localGit(repo,["config","user.name","Owned native fixture"]);localGit(repo,["config","user.email","fixture@local.invalid"]);localGit(repo,["config","commit.gpgsign","false"]);
  const hooks=join(root,"hooks");mkdirSync(hooks);localGit(repo,["config","core.hooksPath",hooks]);
  writeFileSync(join(repo,"README.md"),"before owned native change\n");localGit(repo,["add","README.md"]);localGit(repo,["commit","-qm","base"]);
  localGit(bare,["init","--bare","-q"]);localGit(repo,["remote","add","origin",bare]);localGit(repo,["push","origin","main"]);
  const boot=await bootstrapTask({project:"workflowhub",task:taskId,"target-repo":repo},{env:process.env,home}),taskDir=boot.task_path,wt=boot.workspace.worktree_root;
  owned(taskDir);owned(wt);
  expect(JSON.parse(readFileSync(join(taskDir,"task.json"),"utf8"))).toMatchObject({execution_mode:"per_invocation",activation_cohort:"post",record_model:"vnext-single-write",project_name:"workflowhub",task_id:taskId,target_repo_root:repo,issue_ids:[],inputs:{}});
  expect(localGit(wt,["branch","--show-current"])).toBe(branch);
  const materials=join(wt,"specs",taskId);mkdirSync(materials,{recursive:true});writeFileSync(join(materials,"decision-log.md"),"# Decision\n\n## 任务身份\n- **任务类型**：普通任务\n");writeFileSync(join(materials,"spec.md"),"# Owned native authorization boundary\n");
  const evidence=join(taskDir,"quality","evidence");mkdirSync(evidence,{recursive:true});
  const scopeRef=join(evidence,"native-actions.md");writeFileSync(scopeRef,"Owned native TASK commit/push/pr and MAIN merge/archive/push/cleanup scope. No live GH or mother-task action.\n");
  const common=["--stage=verify-code","--project=workflowhub",`--task=${taskId}`];
  const confirmation=await stageRuntimeCliMain(["confirm","--action=decision",...common,"--decision=confirmed","--reply-text=Owned fixture native scope only, not live delivery.",`--material-ref=${scopeRef}`],{cwd:wt});
  owned(confirmation.path);expect(JSON.parse(readFileSync(confirmation.path,"utf8"))).toMatchObject({stage:"verify-code",decision:"confirmed",material_refs:[scopeRef],head:localGit(wt,["rev-parse","HEAD"])});
  // First target is owner-defined five -> six; only pr is added, not native push-task.
  const help=await stageRuntimeCliMain(["--help"]);
  expect(help.actions.authorize).toEqual(["commit","push","merge","archive","cleanup","pr"]);
  expect(help.behaviors).toEqual(["doctor","status","run","review","verify","confirm","authorize"]);
  const authDir=join(evidence,"git-authorizations");
  const native=(cwd,action,operation,stepId)=>{owned(cwd);const args=[authCli,action,"--operation",operation,"--dir",authDir,action==="record"?"--confirmation-ref":"--step-id",action==="record"?confirmation.path:stepId];const pointer=JSON.parse(execFileSync(process.execPath,args,{cwd,encoding:"utf8",env:process.env,stdio:["ignore","pipe","pipe"]}));owned(pointer.path);expect(dirname(pointer.path)).toBe(authDir);return{path:pointer.path,value:JSON.parse(readFileSync(pointer.path,"utf8"))};};
  const authorize=async(cwd,operation,suffix)=>{const head=localGit(cwd,["rev-parse","HEAD"]),actualBranch=localGit(cwd,["branch","--show-current"]);let grant;if(cwd===wt){const pointer=await stageRuntimeCliMain(["authorize",`--action=${operation}`,...common,`--subject-ref=${confirmation.path}`],{cwd});owned(pointer.path);grant={path:pointer.path,value:JSON.parse(readFileSync(pointer.path,"utf8"))};}else grant=native(cwd,"record",operation);expect(grant.value).toMatchObject({operation,branch:actualBranch,head,confirmation_ref:confirmation.path});const consumed=native(cwd,"consume",operation,`${scopeRef}:${suffix}`);expect(consumed.value).toMatchObject({operation,step_id:`${scopeRef}:${suffix}`,authorization_ref:grant.path});expect(JSON.parse(readFileSync(consumed.value.authorization_ref,"utf8"))).toEqual(grant.value);return{grant,consumed};};
  writeFileSync(join(wt,"README.md"),"after owned native change\n");await authorize(wt,"commit","commit");localGit(wt,["add","README.md","specs"]);localGit(wt,["commit","-qm","Owned delivery title"]);
  const sourceHead=localGit(wt,["rev-parse","HEAD"]),taskPush=await authorize(wt,"push","push-task");localGit(wt,["push","origin",`${branch}:${branch}`]);expect(localGit(bare,["rev-parse",`refs/heads/${branch}`])).toBe(sourceHead);
  const pr=await authorize(wt,"pr","pr");expect(pr.grant.value).toMatchObject({branch,head:sourceHead}); // Grant/consume only: no gh process.
  await authorize(repo,"merge","merge");localGit(repo,["merge","--no-ff","--no-edit",branch]);
  await authorize(repo,"archive","archive");mkdirSync(join(repo,"specs","archive"));localGit(repo,["mv",`specs/${taskId}`,`specs/archive/${taskId}`]);localGit(repo,["commit","-qm","archive owned native fixture"]);
  const targetHead=localGit(repo,["rev-parse","HEAD"]),mainPush=await authorize(repo,"push","push");localGit(repo,["push","origin","main:main"]);expect(localGit(bare,["rev-parse","refs/heads/main"])).toBe(targetHead);
  expect(taskPush.grant.value).toMatchObject({operation:"push",branch,head:sourceHead});expect(mainPush.grant.value).toMatchObject({operation:"push",branch:"main",head:targetHead});
  expect(taskPush.consumed.value.step_id).toBe(`${scopeRef}:push-task`);expect(mainPush.consumed.value.step_id).toBe(`${scopeRef}:push`);expect(taskPush.grant.path).not.toBe(mainPush.grant.path);
  await authorize(repo,"cleanup","cleanup");expect(existsSync(wt)).toBe(true); // Owned finally, no claim core cleanup ran.
  const consumed=readdirSync(authDir).filter(name=>name.includes("-consumed-")).sort().map(name=>JSON.parse(readFileSync(join(authDir,name),"utf8")));
  expect(consumed.map(row=>row.operation)).toEqual(["commit","push","pr","merge","archive","push","cleanup"]);
  expect(requests.filter(row=>row.args[0]==="push").every(row=>row.cwd===repo||row.cwd===wt)).toBe(true);
 } finally {
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);
  expect(realpathSync(root)).toBe(root);expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-six-")).toBe(true);
  const current=lstatSync(root);expect({dev:current.dev,ino:current.ino}).toEqual({dev:identity.dev,ino:identity.ino});rmSync(root,{recursive:true,force:true});
 }
});

// Source-approved native facet: retry must recheck real cwd identity; no new API parameter.
it("P10 native retry rejects MAIN cwd reuse of TASK consumption at the same HEAD", async () => {
 const {dirname,basename,resolve}=await import("node:path"),{lstatSync,readdirSync}=await import("node:fs"),{fileURLToPath}=await import("node:url"),{spawnSync}=await import("node:child_process");
 const {bootstrapTask}=await import("../../tools/cli/task-bootstrap.mjs"),{stageRuntimeCliMain}=await import("../../tools/cli/stage-runtime.mjs");
 const authCli=fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs",import.meta.url));
 const parent=realpathSync(tmpdir()),root=realpathSync(mkdtempSync(join(parent,"workflowhub-native-retry-"))),identity=lstatSync(root),saved={...process.env};
 const repo=join(root,"repo"),bare=join(root,"origin.git"),home=join(root,"home"),storage=join(root,"storage"),taskId="native-retry",branch=`task/workflowhub/${taskId}`;
 const owned=path=>{const actual=realpathSync(path);expect(actual).toBe(resolve(path));expect(actual.startsWith(`${root}/`)).toBe(true);return actual;};
 try {
  expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-retry-")).toBe(true);
  for(const path of[repo,bare,home,storage])mkdirSync(path);
  for(const key of Object.keys(process.env))if(key.startsWith("GIT_")||key==="WORKFLOWHUB_TASK_DIR")delete process.env[key];
  Object.assign(process.env,{HOME:home,XDG_CONFIG_HOME:join(home,".config"),WORKFLOWHUB_TASK_DIR:storage});
  const realGit=execFileSync("/usr/bin/which",["git"],{encoding:"utf8"}).trim();
  const localGit=(cwd,args)=>{owned(cwd);return execFileSync(realGit,args,{cwd,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();};
  localGit(repo,["init","-q","-b","main"]);localGit(repo,["config","user.name","Owned native retry"]);localGit(repo,["config","user.email","fixture@local.invalid"]);localGit(repo,["config","commit.gpgsign","false"]);
  const hooks=join(root,"hooks");mkdirSync(hooks);localGit(repo,["config","core.hooksPath",hooks]);writeFileSync(join(repo,"README.md"),"owned retry baseline\n");localGit(repo,["add","README.md"]);localGit(repo,["commit","-qm","base"]);
  localGit(bare,["init","--bare","-q"]);localGit(repo,["remote","add","origin",bare]); // No push: an authorization is not a Git action.
  const boot=await bootstrapTask({project:"workflowhub",task:taskId,"target-repo":repo},{env:process.env,home}),taskDir=boot.task_path,wt=boot.workspace.worktree_root;owned(taskDir);owned(wt);
  const head=localGit(wt,["rev-parse","HEAD"]);expect(localGit(repo,["rev-parse","HEAD"])).toBe(head);expect(localGit(wt,["branch","--show-current"])).toBe(branch);expect(localGit(repo,["branch","--show-current"])).toBe("main");
  const evidence=join(taskDir,"quality","evidence");mkdirSync(evidence,{recursive:true});const scopeRef=join(evidence,"native-retry-scope.md");writeFileSync(scopeRef,"Owned TASK native push authorization only; no actual push or live task closure.\n");
  const common=["--stage=verify-code","--project=workflowhub",`--task=${taskId}`];
  const confirmation=await stageRuntimeCliMain(["confirm","--action=decision",...common,"--decision=confirmed","--reply-text=Owned fixture TASK native retry scope only.",`--material-ref=${scopeRef}`],{cwd:wt});owned(confirmation.path);
  const grant=await stageRuntimeCliMain(["authorize","--action=push",...common,`--subject-ref=${confirmation.path}`],{cwd:wt});owned(grant.path);
  const authDir=join(evidence,"git-authorizations"),stepId=`${scopeRef}:push-task`,grantBytes=readFileSync(grant.path);
  expect(JSON.parse(grantBytes)).toMatchObject({operation:"push",branch,head,confirmation_ref:confirmation.path});
  const consume=cwd=>{owned(cwd);return spawnSync(process.execPath,[authCli,"consume","--operation","push","--dir",authDir,"--step-id",stepId],{cwd,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]});};
  const first=consume(wt);expect(first.error).toBeUndefined();expect(first.signal).toBeNull();expect(first.status).toBe(0);
  const receiptPath=JSON.parse(first.stdout).path;owned(receiptPath);const receiptBytes=readFileSync(receiptPath);
  expect(JSON.parse(receiptBytes)).toMatchObject({operation:"push",step_id:stepId,authorization_ref:grant.path});
  const beforeNames=readdirSync(authDir).sort(),remoteRefs=localGit(bare,["for-each-ref","--format=%(refname):%(objectname)"]);
  const same=consume(wt);expect(same.status).toBe(0);expect(JSON.parse(same.stdout).path).toBe(receiptPath);expect(readdirSync(authDir).sort()).toEqual(beforeNames);expect(readFileSync(receiptPath)).toEqual(receiptBytes);
  const wrong=consume(repo);expect(wrong.error).toBeUndefined();expect(wrong.signal).toBeNull();
  // Actual target: same HEAD is not authority to reuse a TASK receipt from MAIN.
  expect(wrong.status).not.toBe(0);
  expect(wrong.stderr.trim()).not.toBe("");expect(wrong.stdout.trim()).toBe("");
  expect(readFileSync(grant.path)).toEqual(grantBytes);expect(readFileSync(receiptPath)).toEqual(receiptBytes);expect(readdirSync(authDir).sort()).toEqual(beforeNames);
  expect(localGit(wt,["rev-parse","HEAD"])).toBe(head);expect(localGit(repo,["rev-parse","HEAD"])).toBe(head);expect(localGit(bare,["for-each-ref","--format=%(refname):%(objectname)"])).toBe(remoteRefs);
 } finally {
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);
  expect(realpathSync(root)).toBe(root);expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-retry-")).toBe(true);const current=lstatSync(root);expect({dev:current.dev,ino:current.ino}).toEqual({dev:identity.dev,ino:identity.ino});rmSync(root,{recursive:true,force:true});
 }
});

// Source-approved task-owned receipt scope; generic directories are not exercised or redefined.
it("P10 native task-owned retry rejects foreign repository at the same branch and HEAD", async () => {
 const {dirname,basename,resolve}=await import("node:path"),{lstatSync,readdirSync}=await import("node:fs"),{fileURLToPath}=await import("node:url"),{spawnSync}=await import("node:child_process");
 const {bootstrapTask}=await import("../../tools/cli/task-bootstrap.mjs"),{stageRuntimeCliMain}=await import("../../tools/cli/stage-runtime.mjs");
 const authCli=fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs",import.meta.url));
 const parent=realpathSync(tmpdir()),root=realpathSync(mkdtempSync(join(parent,"workflowhub-native-foreign-"))),identity=lstatSync(root),saved={...process.env};
 const repo=join(root,"repo"),foreign=join(root,"foreign"),home=join(root,"home"),storage=join(root,"storage"),taskId="native-foreign",branch=`task/workflowhub/${taskId}`;
 const owned=path=>{const actual=realpathSync(path);expect(actual).toBe(resolve(path));expect(actual.startsWith(`${root}/`)).toBe(true);return actual;};
 try {
  expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-foreign-")).toBe(true);for(const path of[repo,foreign,home,storage])mkdirSync(path);
  for(const key of Object.keys(process.env))if(key.startsWith("GIT_")||key==="WORKFLOWHUB_TASK_DIR")delete process.env[key];Object.assign(process.env,{HOME:home,XDG_CONFIG_HOME:join(home,".config"),WORKFLOWHUB_TASK_DIR:storage});
  const realGit=execFileSync("/usr/bin/which",["git"],{encoding:"utf8"}).trim();
  const localGit=(cwd,args)=>{owned(cwd);return execFileSync(realGit,args,{cwd,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();};
  localGit(repo,["init","-q","-b","main"]);localGit(repo,["config","user.name","Owned foreign retry"]);localGit(repo,["config","user.email","fixture@local.invalid"]);localGit(repo,["config","commit.gpgsign","false"]);
  const hooks=join(root,"hooks");mkdirSync(hooks);localGit(repo,["config","core.hooksPath",hooks]);writeFileSync(join(repo,"README.md"),"owned task scope baseline\n");localGit(repo,["add","README.md"]);localGit(repo,["commit","-qm","base"]);
  const boot=await bootstrapTask({project:"workflowhub",task:taskId,"target-repo":repo},{env:process.env,home}),taskDir=boot.task_path,wt=boot.workspace.worktree_root;owned(taskDir);owned(wt);
  const manifestPath=join(taskDir,"task.json"),manifestBytes=readFileSync(manifestPath);expect(JSON.parse(manifestBytes)).toMatchObject({task_id:taskId,project_name:"workflowhub",target_repo_root:repo,activation_cohort:"post"});
  const head=localGit(wt,["rev-parse","HEAD"]);
  // Fetch only the already-owned absolute local repo, creating an independent Git common dir.
  localGit(foreign,["init","-q","-b","main"]);localGit(foreign,["config","core.hooksPath",hooks]);
  localGit(foreign,["fetch","--no-tags",owned(repo),"refs/heads/main"]);localGit(foreign,["checkout","-q","-b",branch,"FETCH_HEAD"]);
  expect(localGit(foreign,["rev-parse","HEAD"])).toBe(head);expect(localGit(foreign,["branch","--show-current"])).toBe(branch);
  const taskCommon=realpathSync(resolve(wt,localGit(wt,["rev-parse","--git-common-dir"]))),foreignCommon=realpathSync(resolve(foreign,localGit(foreign,["rev-parse","--git-common-dir"])));
  expect(taskCommon).not.toBe(foreignCommon);expect(localGit(wt,["branch","--show-current"])).toBe(branch);
  const evidence=join(taskDir,"quality","evidence");mkdirSync(evidence,{recursive:true});const scopeRef=join(evidence,"native-task-scope.md");writeFileSync(scopeRef,"Owned authenticated task repository native push scope only. No actual push or GH.\n");
  const common=["--stage=verify-code","--project=workflowhub",`--task=${taskId}`];const confirmation=await stageRuntimeCliMain(["confirm","--action=decision",...common,"--decision=confirmed","--reply-text=Owned fixture task repository scope only.",`--material-ref=${scopeRef}`],{cwd:wt});owned(confirmation.path);
  const grant=await stageRuntimeCliMain(["authorize","--action=push",...common,`--subject-ref=${confirmation.path}`],{cwd:wt});owned(grant.path);
  const authDir=join(taskDir,"quality","evidence","git-authorizations"),grantBytes=readFileSync(grant.path),stepId=`${scopeRef}:push-task`;expect(dirname(grant.path)).toBe(authDir);expect(JSON.parse(grantBytes)).toMatchObject({operation:"push",branch,head,confirmation_ref:confirmation.path});
  const consume=cwd=>{owned(cwd);return spawnSync(process.execPath,[authCli,"consume","--operation","push","--dir",authDir,"--step-id",stepId],{cwd,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]});};
  const first=consume(wt);expect(first.error).toBeUndefined();expect(first.status).toBe(0);const receiptPath=JSON.parse(first.stdout).path;owned(receiptPath);const receiptBytes=readFileSync(receiptPath);expect(JSON.parse(receiptBytes)).toMatchObject({operation:"push",step_id:stepId,authorization_ref:grant.path});
  const names=readdirSync(authDir).sort(),taskRefs=localGit(repo,["for-each-ref","--format=%(refname):%(objectname)"]),foreignRefs=localGit(foreign,["for-each-ref","--format=%(refname):%(objectname)"]);
  const same=consume(wt);expect(same.status).toBe(0);expect(JSON.parse(same.stdout).path).toBe(receiptPath);expect(readdirSync(authDir).sort()).toEqual(names);expect(readFileSync(receiptPath)).toEqual(receiptBytes);
  const wrong=consume(foreign);expect(wrong.error).toBeUndefined();expect(wrong.signal).toBeNull();
  // Same branch and OID in another repo cannot reuse this task-owned receipt.
  expect(wrong.status).not.toBe(0);expect(wrong.stderr.trim()).not.toBe("");expect(wrong.stdout.trim()).toBe("");
  expect(readFileSync(manifestPath)).toEqual(manifestBytes);expect(readFileSync(grant.path)).toEqual(grantBytes);expect(readFileSync(receiptPath)).toEqual(receiptBytes);expect(readdirSync(authDir).sort()).toEqual(names);
  expect(localGit(wt,["rev-parse","HEAD"])).toBe(head);expect(localGit(foreign,["rev-parse","HEAD"])).toBe(head);expect(localGit(repo,["for-each-ref","--format=%(refname):%(objectname)"])).toBe(taskRefs);expect(localGit(foreign,["for-each-ref","--format=%(refname):%(objectname)"])).toBe(foreignRefs);
 } finally {
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);expect(realpathSync(root)).toBe(root);expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-foreign-")).toBe(true);const current=lstatSync(root);expect({dev:current.dev,ino:current.ino}).toEqual({dev:identity.dev,ino:identity.ino});rmSync(root,{recursive:true,force:true});
 }
});

// Source CR744, independently scope-approved: optional exact original grant selection.
it("P10 native exact authorization reference consumes A without spending later confirmation B", async () => {
 const {dirname,basename,resolve}=await import("node:path"),{lstatSync,readdirSync}=await import("node:fs"),{fileURLToPath}=await import("node:url"),{spawnSync}=await import("node:child_process");
 const {bootstrapTask}=await import("../../tools/cli/task-bootstrap.mjs"),{stageRuntimeCliMain}=await import("../../tools/cli/stage-runtime.mjs");
 const authCli=fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs",import.meta.url));
 const parent=realpathSync(tmpdir()),root=realpathSync(mkdtempSync(join(parent,"workflowhub-native-exact-"))),identity=lstatSync(root),saved={...process.env};
 const repo=join(root,"repo"),home=join(root,"home"),storage=join(root,"storage"),taskId="native-exact",branch=`task/workflowhub/${taskId}`;
 const owned=path=>{const actual=realpathSync(path);expect(actual).toBe(resolve(path));expect(actual.startsWith(`${root}/`)).toBe(true);return actual;};
 try {
  expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-exact-")).toBe(true);for(const path of[repo,home,storage])mkdirSync(path);
  for(const key of Object.keys(process.env))if(key.startsWith("GIT_")||key==="WORKFLOWHUB_TASK_DIR")delete process.env[key];Object.assign(process.env,{HOME:home,XDG_CONFIG_HOME:join(home,".config"),WORKFLOWHUB_TASK_DIR:storage});
  const realGit=execFileSync("/usr/bin/which",["git"],{encoding:"utf8"}).trim(),localGit=(cwd,args)=>{owned(cwd);return execFileSync(realGit,args,{cwd,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();};
  localGit(repo,["init","-q","-b","main"]);localGit(repo,["config","user.name","Owned exact grants"]);localGit(repo,["config","user.email","fixture@local.invalid"]);localGit(repo,["config","commit.gpgsign","false"]);
  const hooks=join(root,"hooks");mkdirSync(hooks);localGit(repo,["config","core.hooksPath",hooks]);writeFileSync(join(repo,"README.md"),"owned exact grant baseline\n");localGit(repo,["add","README.md"]);localGit(repo,["commit","-qm","base"]);
  const boot=await bootstrapTask({project:"workflowhub",task:taskId,"target-repo":repo},{env:process.env,home}),taskDir=boot.task_path,wt=boot.workspace.worktree_root;owned(taskDir);owned(wt);
  const head=localGit(wt,["rev-parse","HEAD"]);expect(localGit(wt,["branch","--show-current"])).toBe(branch);
  const evidence=join(taskDir,"quality","evidence");mkdirSync(evidence,{recursive:true});const scopeRef=join(evidence,"native-exact-scope.md");writeFileSync(scopeRef,"Owned TASK native A selection only; B separate consent must remain unused. No Git push.\n");
  const common=["--stage=verify-code","--project=workflowhub",`--task=${taskId}`],authDir=join(evidence,"git-authorizations");
  const makeGrant=async(label)=>{const confirmation=await stageRuntimeCliMain(["confirm","--action=decision",...common,"--decision=confirmed",`--reply-text=Owned fixture ${label} consent only.`,`--material-ref=${scopeRef}`],{cwd:wt});owned(confirmation.path);const grant=await stageRuntimeCliMain(["authorize","--action=push",...common,`--subject-ref=${confirmation.path}`],{cwd:wt});owned(grant.path);return{confirmation,grant,bytes:readFileSync(grant.path)};};
  const a=await makeGrant("A"),b=await makeGrant("B");expect(a.confirmation.path).not.toBe(b.confirmation.path);expect(a.grant.path).not.toBe(b.grant.path);
  expect(JSON.parse(a.bytes)).toMatchObject({operation:"push",branch,head,confirmation_ref:a.confirmation.path});expect(JSON.parse(b.bytes)).toMatchObject({operation:"push",branch,head,confirmation_ref:b.confirmation.path});
  const initialNames=readdirSync(authDir).sort(),stepId=`${scopeRef}:push-task`,refs=localGit(repo,["for-each-ref","--format=%(refname):%(objectname)"]);
  const consume=()=>spawnSync(process.execPath,[authCli,"consume","--operation","push","--dir",authDir,"--step-id",stepId,"--authorization-ref",a.grant.path],{cwd:wt,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]});
  const selected=consume();expect(selected.error).toBeUndefined();expect(selected.signal).toBeNull();
  // New approved feature may first fail as unsupported CLI flag; not a dynamic core race claim.
  expect(selected.status).toBe(0);
  const receiptPath=JSON.parse(selected.stdout).path;owned(receiptPath);expect(dirname(receiptPath)).toBe(authDir);const receiptBytes=readFileSync(receiptPath);
  expect(JSON.parse(receiptBytes)).toMatchObject({operation:"push",step_id:stepId,authorization_ref:a.grant.path});
  const consumptionRows=()=>readdirSync(authDir).filter(name=>/^\d{4}-\d{2}-\d{2}-\d{3}-consumed-push\.json$/.test(name)).sort().map(name=>JSON.parse(readFileSync(join(authDir,name),"utf8")));
  expect(consumptionRows().map(row=>row.authorization_ref)).toEqual([a.grant.path]);expect(consumptionRows().some(row=>row.authorization_ref===b.grant.path)).toBe(false);
  expect(readFileSync(a.grant.path)).toEqual(a.bytes);expect(readFileSync(b.grant.path)).toEqual(b.bytes);
  const afterNames=readdirSync(authDir).sort();expect(afterNames.length).toBe(initialNames.length+1);const same=consume();expect(same.status).toBe(0);expect(JSON.parse(same.stdout).path).toBe(receiptPath);expect(readdirSync(authDir).sort()).toEqual(afterNames);expect(readFileSync(receiptPath)).toEqual(receiptBytes);
  expect(localGit(wt,["rev-parse","HEAD"])).toBe(head);expect(localGit(repo,["for-each-ref","--format=%(refname):%(objectname)"])).toBe(refs);
 } finally {
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);expect(realpathSync(root)).toBe(root);expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-exact-")).toBe(true);const current=lstatSync(root);expect({dev:current.dev,ino:current.ino}).toEqual({dev:identity.dev,ino:identity.ino});rmSync(root,{recursive:true,force:true});
 }
});

// Source-approved F-P10-EXACT-01: exact original grant must be singly linked.
it("P10 native exact authorization rejects a hard-linked original task grant", async () => {
 const {dirname,basename,resolve}=await import("node:path"),{lstatSync,readdirSync,linkSync}=await import("node:fs"),{fileURLToPath}=await import("node:url"),{spawnSync}=await import("node:child_process");
 const {bootstrapTask}=await import("../../tools/cli/task-bootstrap.mjs"),{stageRuntimeCliMain}=await import("../../tools/cli/stage-runtime.mjs");
 const authCli=fileURLToPath(new URL("../../runtime/interface/git-authorize.mjs",import.meta.url));
 const parent=realpathSync(tmpdir()),root=realpathSync(mkdtempSync(join(parent,"workflowhub-native-hardlink-"))),identity=lstatSync(root),saved={...process.env};
 const repo=join(root,"repo"),home=join(root,"home"),storage=join(root,"storage"),taskId="native-hardlink";
 const owned=path=>{const actual=realpathSync(path);expect(actual).toBe(resolve(path));expect(actual.startsWith(`${root}/`)).toBe(true);return actual;};
 try {
  expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-hardlink-")).toBe(true);for(const path of[repo,home,storage])mkdirSync(path);
  for(const key of Object.keys(process.env))if(key.startsWith("GIT_")||key==="WORKFLOWHUB_TASK_DIR")delete process.env[key];Object.assign(process.env,{HOME:home,XDG_CONFIG_HOME:join(home,".config"),WORKFLOWHUB_TASK_DIR:storage});
  const realGit=execFileSync("/usr/bin/which",["git"],{encoding:"utf8"}).trim(),localGit=(cwd,args)=>{owned(cwd);return execFileSync(realGit,args,{cwd,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();};
  localGit(repo,["init","-q","-b","main"]);localGit(repo,["config","user.name","Owned hardlink grants"]);localGit(repo,["config","user.email","fixture@local.invalid"]);localGit(repo,["config","commit.gpgsign","false"]);const hooks=join(root,"hooks");mkdirSync(hooks);localGit(repo,["config","core.hooksPath",hooks]);writeFileSync(join(repo,"README.md"),"owned hardlink baseline\n");localGit(repo,["add","README.md"]);localGit(repo,["commit","-qm","base"]);
  const boot=await bootstrapTask({project:"workflowhub",task:taskId,"target-repo":repo},{env:process.env,home}),taskDir=boot.task_path,wt=boot.workspace.worktree_root;owned(taskDir);owned(wt);
  const head=localGit(wt,["rev-parse","HEAD"]),evidence=join(taskDir,"quality","evidence");mkdirSync(evidence,{recursive:true});const scopeRef=join(evidence,"native-hardlink-scope.md");writeFileSync(scopeRef,"Owned singly linked original TASK grant only; no Git push.\n");
  const common=["--stage=verify-code","--project=workflowhub",`--task=${taskId}`],confirmation=await stageRuntimeCliMain(["confirm","--action=decision",...common,"--decision=confirmed","--reply-text=Owned fixture single-link grant scope only.",`--material-ref=${scopeRef}`],{cwd:wt});owned(confirmation.path);
  const grant=await stageRuntimeCliMain(["authorize","--action=push",...common,`--subject-ref=${confirmation.path}`],{cwd:wt});owned(grant.path);const grantBytes=readFileSync(grant.path),original=lstatSync(grant.path);expect(original.isFile()).toBe(true);expect(original.isSymbolicLink()).toBe(false);expect(original.nlink).toBe(1);
  const alias=join(root,"owned-grant-hardlink.json");expect(dirname(resolve(alias))).toBe(root);linkSync(grant.path,alias);owned(alias);
  const linked=lstatSync(grant.path),aliasStat=lstatSync(alias);expect(linked.nlink).toBe(2);expect(aliasStat.nlink).toBe(2);expect({dev:aliasStat.dev,ino:aliasStat.ino}).toEqual({dev:original.dev,ino:original.ino});expect(readFileSync(alias)).toEqual(grantBytes);
  const authDir=join(evidence,"git-authorizations"),names=readdirSync(authDir).sort(),refs=localGit(repo,["for-each-ref","--format=%(refname):%(objectname)"]);
  const denied=spawnSync(process.execPath,[authCli,"consume","--operation","push","--dir",authDir,"--step-id",`${scopeRef}:push-task`,"--authorization-ref",grant.path],{cwd:wt,env:process.env,encoding:"utf8",stdio:["ignore","pipe","pipe"]});expect(denied.error).toBeUndefined();expect(denied.signal).toBeNull();
  // Target begins only after actual nlink2/same-inode setup succeeded.
  expect(denied.status).not.toBe(0);expect(denied.stderr.trim()).not.toBe("");expect(denied.stdout.trim()).toBe("");
  expect(readdirSync(authDir).sort()).toEqual(names);expect(readdirSync(authDir).filter(name=>name.includes("-consumed-"))).toEqual([]);expect(readFileSync(grant.path)).toEqual(grantBytes);expect(readFileSync(alias)).toEqual(grantBytes);
  expect(localGit(wt,["rev-parse","HEAD"])).toBe(head);expect(localGit(repo,["for-each-ref","--format=%(refname):%(objectname)"])).toBe(refs);
 } finally {
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);expect(realpathSync(root)).toBe(root);expect(dirname(root)).toBe(parent);expect(basename(root).startsWith("workflowhub-native-hardlink-")).toBe(true);const current=lstatSync(root);expect({dev:current.dev,ino:current.ino}).toEqual({dev:identity.dev,ino:identity.ino});rmSync(root,{recursive:true,force:true});
 }
});

// Source-approved pre-cancel P2P control; NOT mid-operation cancel or resume coverage.
it("P10 pre-aborted confirmed close leaves native grants unconsumed and publishes nothing", async () => {
 const {dirname,basename,resolve}=await import("node:path"),{lstatSync,readdirSync}=await import("node:fs");
 const saved={...process.env};let s,identity;
 try {
  for(const key of Object.keys(process.env))if(key.startsWith("GIT_"))delete process.env[key];
  s=fixture();identity=lstatSync(s.base);
  const parent=realpathSync(tmpdir());expect(dirname(s.base)).toBe(parent);expect(basename(s.base).startsWith("workflowhub-close-narrow-")).toBe(true);
  const home=join(s.base,"home");mkdirSync(home);Object.assign(process.env,{HOME:home,XDG_CONFIG_HOME:join(home,".config"),WORKFLOWHUB_TASK_DIR:join(s.base,"storage")});
  expect(git(s.worktree,["remote","get-url","origin"])).toBe(s.bare);
  const p=await prepare(s);expect(p.plan.steps).toEqual(["commit","merge","archive","push","cleanup"]);
  const c=await confirm(s,p,"confirmed","Owned fixture: authorize this displayed local-bare close, cancelled before execution.");await authorizeClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const authDir=join(s.taskDir,"quality","evidence","git-authorizations"),names=readdirSync(authDir).sort();expect(names.filter(name=>name.includes("-consumed-"))).toEqual([]);
  const grants=names.filter(name=>name.includes("-authorize-"));expect(grants).toHaveLength(5);const grantBytes=grants.map(name=>[name,readFileSync(join(authDir,name))]);
  const before=await inspectDeliveryCloseState({taskDir:s.taskDir,planRef:p.plan_ref});expect(before.step_records).toEqual([]);
  const planBytes=readFileSync(p.plan_ref),taskHead=git(s.worktree,["rev-parse","HEAD"]),mainHead=git(s.repo,["rev-parse","HEAD"]),remoteRefs=git(s.bare,["for-each-ref","--format=%(refname):%(objectname)"]);
  // Wrap only the external Git process to observe publications; native modules stay real.
  const realGit=execFileSync("/usr/bin/which",["git"],{encoding:"utf8"}).trim(),bin=join(s.base,"bin"),log=join(s.base,"preabort-processes.jsonl");mkdirSync(bin);writeFileSync(log,"");
  writeFileSync(join(bin,"git"),`#!${process.execPath}\nconst fs=require('node:fs'),cp=require('node:child_process');const args=process.argv.slice(2),cwd=process.cwd();if(!cwd.startsWith(${JSON.stringify(s.base+'/')})){process.stderr.write('OUTSIDE_OWNED_FIXTURE');process.exit(95);}fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({tool:'git',cwd,args})+'\\n');if(args.some(x=>['push','fetch','pull','clone'].includes(x))){process.stderr.write('PUBLICATION_FORBIDDEN_AFTER_PREABORT');process.exit(96);}const r=cp.spawnSync(${JSON.stringify(realGit)},args,{cwd,env:process.env,encoding:'utf8'});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status===null?97:r.status);\n`,{mode:0o700});
  process.env.PATH=`${bin}:${saved.PATH}`;
  const controller=new AbortController();controller.abort();const out=await executeClosePlan({taskDir:s.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,signal:controller.signal});
  expect(out.status).toBe("cancelled");expect(out.records).toEqual([]);expect(out.physical.step_records).toEqual([]);
  const requests=readFileSync(log,"utf8").split("\n").filter(Boolean).map(JSON.parse);expect(requests.filter(row=>row.args.some(x=>["push","fetch","pull","clone","commit","merge","mv"].includes(x)))).toEqual([]);
  expect(readFileSync(p.plan_ref)).toEqual(planBytes);expect(readdirSync(authDir).sort()).toEqual(names);for(const[name,bytes]of grantBytes)expect(readFileSync(join(authDir,name))).toEqual(bytes);
  expect(git(s.worktree,["rev-parse","HEAD"])).toBe(taskHead);expect(git(s.repo,["rev-parse","HEAD"])).toBe(mainHead);expect(git(s.bare,["for-each-ref","--format=%(refname):%(objectname)"])).toBe(remoteRefs);expect(existsSync(s.worktree)).toBe(true);
 } finally {
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);
  if(s){expect(realpathSync(s.base)).toBe(resolve(s.base));expect(dirname(s.base)).toBe(realpathSync(tmpdir()));expect(basename(s.base).startsWith("workflowhub-close-narrow-")).toBe(true);const current=lstatSync(s.base);expect({dev:current.dev,ino:current.ino}).toEqual({dev:identity.dev,ino:identity.ino});const at=roots.indexOf(s.base);expect(at).not.toBe(-1);roots.splice(at,1);rmSync(s.base,{recursive:true,force:true});}
 }
});
