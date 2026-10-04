// Real owned A progress/target merge remains; old resume object/certification graph retires.
import{afterEach,expect,it}from"vitest";import{execFileSync,spawnSync}from"node:child_process";import{existsSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync}from"node:fs";import{tmpdir}from"node:os";import{join,resolve}from"node:path";import{bootstrapTask}from"../../tools/cli/task-bootstrap.mjs";
import{evaluateMiniTaskScope,prepareAResumePlan,confirmAResumePlan,authorizeAResumePlan,resumeTaskA,runMiniTaskDesignReview}from"../../skills/mini-task/scripts/mini-task-runner.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function fixture(conflict=false){const root=realpathSync(mkdtempSync(join(tmpdir(),"owned-a-progress-")));roots.push(root);const repo=join(root,"repo"),storage=join(root,"storage"),home=join(root,"home");for(const d of[repo,storage,home])mkdirSync(d);const env={...process.env,HOME:home,WORKFLOWHUB_TASK_DIR:storage};for(const k of Object.keys(env))if(k.startsWith("GIT_"))delete env[k];const git=(cwd,args,optional=false)=>{const r=spawnSync("git",args,{cwd,env,encoding:"utf8"});if(optional)return r;expect(r.status,r.stderr).toBe(0);return r.stdout.trim();};git(repo,["init","-q","-b","main"]);git(repo,["config","user.name","Owned A"]);git(repo,["config","user.email","owned@test.invalid"]);writeFileSync(join(repo,"shared.txt"),"base\n");git(repo,["add","shared.txt"]);git(repo,["commit","-qm","base"]);const b=await bootstrapTask({project:"workflowhub",task:"owned-a","target-repo":repo},{env,home}),wt=b.workspace.worktree_root;writeFileSync(join(repo,"mini.txt"),"mini target\n");if(conflict)writeFileSync(join(repo,"shared.txt"),"target conflicting change\n");git(repo,["add","."]);git(repo,["commit","-qm","mini target"]);return{repo,wt,taskDir:b.task_path,git,targetOid:git(repo,["rev-parse","HEAD"])};}
async function approve(f,p){const c=await confirmAResumePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Controlled approval for this owned progress and target merge."});await authorizeAResumePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});return c;}
it("pauses scope expansion for an explicit user route choice",()=>{expect(evaluateMiniTaskScope({major_architecture:true,user_requested:true})).toMatchObject({status:"paused",choices:["shrink-mini-task","create-ordinary-five-stage-task"]});});
it("preserves dirty A progress, merges the explicit target and records rerun facts",async()=>{const f=await fixture(),before=f.git(f.wt,["rev-parse","HEAD"]);writeFileSync(join(f.wt,"a-progress.txt"),"A progress\n");const p=await prepareAResumePlan({taskDir:f.taskDir,targetOid:f.targetOid,originalStage:"build-plan"});expect(p.plan.steps).toEqual(["commit","merge"]);const c=await approve(f,p),r=await resumeTaskA({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});expect(r.status).toBe("completed");expect(r.next_action).toBe("rerun_original_stage");expect(f.git(f.wt,["rev-parse","HEAD"])).not.toBe(before);expect(f.git(f.wt,["rev-parse","HEAD^2"])).toBe(f.targetOid);expect(readFileSync(join(f.wt,"a-progress.txt"),"utf8")).toBe("A progress\n");expect(readFileSync(join(f.wt,"mini.txt"),"utf8")).toBe("mini target\n");expect(JSON.parse(readFileSync(r.evidence_ref,"utf8"))).toMatchObject({status:"completed",next_action:"rerun_original_stage"});});
it("aborts an actual merge conflict, keeps A progress and never records false completion",async()=>{const f=await fixture(true);writeFileSync(join(f.wt,"shared.txt"),"A conflicting progress\n");const p=await prepareAResumePlan({taskDir:f.taskDir,targetOid:f.targetOid}),c=await approve(f,p),r=await resumeTaskA({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});expect(r.status).toBe("failed");expect(f.git(f.wt,["rev-parse","--verify","MERGE_HEAD"],true).status).not.toBe(0);expect(f.git(f.wt,["status","--porcelain"])).toBe("");expect(readFileSync(join(f.wt,"shared.txt"),"utf8")).toBe("A conflicting progress\n");});
it("does not invent a progress commit for a clean A workspace",async()=>{const f=await fixture(),p=await prepareAResumePlan({taskDir:f.taskDir,targetOid:f.targetOid});expect(p.plan.steps).toEqual(["merge"]);const c=await approve(f,p),r=await resumeTaskA({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});expect(r.status).toBe("completed");expect(f.git(f.wt,["rev-parse","HEAD^1"])).toBe(p.plan.source.head);});

// Controlled old metadata is seeded directly; no historical writer creates these fixtures.
it.each(["pre", "history", undefined, "unknown"])("refuses mini-task writes for cohort %s before evidence or Git effects", async cohort => {
  const f = await fixture();
  const manifestPath = join(f.taskDir, "task.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  expect(manifest.activation_cohort).toBe("post");
  if (cohort === undefined) delete manifest.activation_cohort;
  else manifest.activation_cohort = cohort;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const historicalPath = join(f.taskDir, "historical-review.json");
  writeFileSync(historicalPath, '{"status":"unavailable","source":"controlled historical record"}\n');
  const progressPath = join(f.wt, "a-progress.txt");
  writeFileSync(progressPath, "owned staged progress\n");
  f.git(f.wt, ["add", "a-progress.txt"]);
  const env = {...process.env};
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  const observeGit = (cwd, args) => execFileSync("git", args, {cwd, env, encoding:"utf8"}).trimEnd();
  const indexPath = resolve(f.wt, observeGit(f.wt, ["rev-parse", "--git-path", "index"]));
  const paths = [manifestPath, join(f.taskDir, "facts.jsonl"), historicalPath, progressPath, join(f.wt, "shared.txt"), indexPath];
  const beforeBytes = paths.map(path => readFileSync(path));
  const beforeHeads = [f.repo, f.wt].map(cwd => observeGit(cwd, ["rev-parse", "HEAD"]));
  const beforeStatus = observeGit(f.wt, ["status", "--porcelain=v1", "--untracked-files=all"]);
  const beforeCachedDiff = observeGit(f.wt, ["diff", "--cached", "--binary"]);
  const evidencePath = join(f.taskDir, "quality", "evidence");
  expect(existsSync(evidencePath)).toBe(false);
  let reviewCalls = 0;
  const unchanged = () => {
    paths.forEach((path, index) => expect(readFileSync(path)).toEqual(beforeBytes[index]));
    expect([f.repo, f.wt].map(cwd => observeGit(cwd, ["rev-parse", "HEAD"]))).toEqual(beforeHeads);
    expect(observeGit(f.wt, ["status", "--porcelain=v1", "--untracked-files=all"])).toBe(beforeStatus);
    expect(observeGit(f.wt, ["diff", "--cached", "--binary"])).toBe(beforeCachedDiff);
    expect(existsSync(evidencePath)).toBe(false);
    expect(reviewCalls).toBe(0);
  };
  await expect(prepareAResumePlan({taskDir:f.taskDir, targetOid:f.targetOid})).rejects.toMatchObject({code:"MINI_TASK_READ_ONLY"});
  unchanged();
  await expect(runMiniTaskDesignReview({taskDir:f.taskDir, request:{stage:"build-code"}, reviewRunner:async () => {
    reviewCalls++;
    return {status:"unavailable", reason:"owned review must not run for a read-only task"};
  }})).rejects.toMatchObject({code:"MINI_TASK_READ_ONLY"});
  unchanged();
});
it("keeps an explicit post mini review available and records its actual unavailable outcome", async () => {
  const f = await fixture();
  expect(JSON.parse(readFileSync(join(f.taskDir, "task.json"), "utf8")).activation_cohort).toBe("post");
  let calls = 0;
  const result = await runMiniTaskDesignReview({taskDir:f.taskDir, request:{stage:"build-code"}, reviewRunner:async () => {
    calls++;
    return {status:"unavailable", reason:"owned provider unavailable"};
  }});
  expect(calls).toBe(1);
  expect(result).toMatchObject({kind:"mini_task.design", quality_status:"unavailable", outcome:{status:"unavailable"}});
  expect(result.evidence_ref.startsWith(join(f.taskDir, "quality", "evidence", "mini-task") + "/")).toBe(true);
  expect(JSON.parse(readFileSync(result.evidence_ref, "utf8"))).toMatchObject({quality_status:"unavailable", outcome:{reason:"owned provider unavailable"}});
});
