// Extract ordinary native confirmation/authorization; old quality/snapshot permit graph retires.
import{afterEach,expect,it}from"vitest";import{execFileSync,spawnSync}from"node:child_process";import{chmodSync,existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,realpathSync,rmSync,writeFileSync}from"node:fs";import{tmpdir}from"node:os";import{basename,dirname,join}from"node:path";import{fileURLToPath}from"node:url";import{bootstrapTask}from"../../tools/cli/task-bootstrap.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function fixture(existing=false){const root=realpathSync(mkdtempSync(join(tmpdir(),"owned-current-close-")));roots.push(root);const repo=join(root,"repo"),bare=join(root,"origin.git"),storage=join(root,"storage"),home=join(root,"home");for(const d of[repo,bare,storage,home])mkdirSync(d);const env={...process.env,HOME:home,WORKFLOWHUB_TASK_DIR:storage};for(const k of Object.keys(env))if(k.startsWith("GIT_"))delete env[k];const git=(cwd,args)=>execFileSync("git",args,{cwd,env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();git(repo,["init","-q","-b","main"]);git(repo,["config","user.name","Owned close"]);git(repo,["config","user.email","owned@test.invalid"]);writeFileSync(join(repo,"README.md"),"owned base\n");git(repo,["add","README.md"]);git(repo,["commit","-qm","base"]);git(bare,["init","--bare","-q"]);git(repo,["remote","add","origin",bare]);git(repo,["push","-q","origin","main"]);const taskId="owned-close";let target=repo;if(existing){target=join(root,"existing");git(repo,["worktree","add","-q","-b",`task/workflowhub/${taskId}`,target,"main"]);}const boot=await bootstrapTask({project:"workflowhub",task:taskId,"target-repo":target},{env,home}),wt=boot.workspace.worktree_root,taskDir=boot.task_path;const materials=join(wt,"specs",taskId);mkdirSync(materials,{recursive:true});writeFileSync(join(materials,"decision-log.md"),"# Current decision\n## 任务身份\n- **任务类型**：普通任务\n");writeFileSync(join(materials,"spec.md"),"# Owned actual delivery\n");writeFileSync(join(taskDir,"facts.jsonl"),JSON.stringify({record_kind:"stage",task_id:taskId,stage:"verify-code",source:"owned-close-fixture",created_at:"2026-10-20T00:00:00Z"})+"\n");return{root,repo,bare,storage,wt,taskDir,taskId,git};}
import{prepareDeliveryClosePlan,confirmClosePlan,authorizeClosePlan,executeClosePlan,inspectDeliveryCloseState}from"../../core/task-close.mjs";
it("keeps rejection and timeout blocked without inventing a human reply or changing Git",async()=>{const f=await fixture(),p=await prepareDeliveryClosePlan({taskDir:f.taskDir}),head=f.git(f.repo,["rev-parse","HEAD"]);const rejected=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,outcome:"rejected",replyText:"Do not execute this owned plan."});expect(rejected.status).toBe("blocked");await expect(executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:rejected.confirmation_ref})).rejects.toMatchObject({code:"CONFIRMATION_REJECTED"});const timeout=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,outcome:"timeout"});expect(timeout.status).toBe("blocked");await expect(confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,outcome:"timeout",replyText:"invented reply"})).rejects.toMatchObject({code:"CONFIRMATION_REPLY"});expect(f.git(f.repo,["rev-parse","HEAD"])).toBe(head);});
it("binds authorizations to the displayed plan and rejects operations outside its actual action set",async()=>{const f=await fixture(),p=await prepareDeliveryClosePlan({taskDir:f.taskDir}),c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});await expect(authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,operations:["unlisted-operation"]})).rejects.toMatchObject({code:"AUTH_SCOPE"});const grants=await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,operations:["commit"]});expect(grants).toHaveLength(1);expect(JSON.parse(readFileSync(grants[0].path,"utf8"))).toMatchObject({operation:"commit",confirmation_ref:c.confirmation_ref});});
it("keeps an existing registered workspace outside owned-cleanup authority and reports quality separately",async()=>{const f=await fixture(true),p=await prepareDeliveryClosePlan({taskDir:f.taskDir});expect(p.plan.preserve_existing_workspace).toBe(true);expect(p.plan.worktree_root).toBe(f.wt);const physical=await inspectDeliveryCloseState({taskDir:f.taskDir,planRef:p.plan_ref});expect(physical.facts.cleanup).toMatchObject({skipped:true});expect(physical.quality_status).toBe("unknown");expect(existsSync(f.wt)).toBe(true);});

// Targeted P8 oracle: the action order is a physical fact (whole directory in
// the delivery commit, task push before merge, target push after merge), the
// two pushes carry their own native receipts, and graph states stay explicit.
const withGraph=(script,fn)=>{const dir=realpathSync(mkdtempSync(join(tmpdir(),"owned-graph-bin-")));roots.push(dir);const file=join(dir,"graphify");writeFileSync(file,script);chmodSync(file,0o755);const prior=process.env.PATH;process.env.PATH=`${dir}:${prior}`;return Promise.resolve().then(fn).finally(()=>{process.env.PATH=prior;});};
const GRAPH_UNCHANGED="#!/bin/sh\necho \"no incremental changes detected (--no-cluster); outputs left untouched.\"\nexit 0\n";
const GRAPH_UPDATED="#!/bin/sh\nmkdir -p graphify-out\nprintf '%s\\n' '{\"nodes\":[{\"id\":\"updated\"}]}' > graphify-out/graph.json\necho \"Rebuilt graph.json\"\nexit 0\n";
const GRAPH_FAILED="#!/bin/sh\necho \"graph update failed: model offline\" >&2\nexit 2\n";
const GRAPH_SLOW="#!/bin/sh\nexec sleep 5\n";
const rows=(f,commit)=>f.git(f.repo,["diff-tree","--no-commit-id","--name-status","-r","--no-renames",commit]).split("\n").filter(Boolean);
const pushesOf=f=>{const dir=join(f.taskDir,"quality","evidence","git-authorizations");return readdirSync(dir).filter(n=>/-consumed-push\.json$/.test(n)).map(n=>JSON.parse(readFileSync(join(dir,n),"utf8"))).map(row=>JSON.parse(readFileSync(join(dir,basename(row.authorization_ref)),"utf8")));};
const graphReceiptsOf=f=>readdirSync(join(f.taskDir,"quality","evidence","close")).filter(n=>/-close-graph\.json$/.test(n));

it("isolated archive before delivery moves the whole materials directory into the same delivery commit",async()=>{
  const f=await fixture(),taskBranch=`task/workflowhub/${f.taskId}`,materials=join(f.wt,"specs",f.taskId);
  mkdirSync(join(f.wt,"src"),{recursive:true});
  mkdirSync(join(f.wt,"graphify-out"),{recursive:true});
  writeFileSync(join(f.wt,"src","feature.mjs"),"export const feature = 1;\n");
  writeFileSync(join(materials,"extra.md"),"# extra material\n");
  writeFileSync(join(materials,"archive-exemption.json"),JSON.stringify({kind:"permanent-archive-exemption",task_id:f.taskId})+"\n");
  const decision=readFileSync(join(materials,"decision-log.md"));
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  expect(p.plan.archive_before_commit).toBe(true);
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  await withGraph(GRAPH_UNCHANGED,async()=>{
    const partial=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"merge",graphTimeoutMs:2000});
    expect(partial.status, JSON.stringify(partial.error)).toBe("partial");
    const commit=partial.records.find(row=>row.operation==="commit").source_head;
    // Commit already contains the whole directory and the delivery bytes.
    expect(f.git(f.repo,["ls-tree","-r","--name-only",commit,"--",`specs/${f.taskId}`])).toBe("");
    expect(f.git(f.repo,["ls-tree","-r","--name-only",`${commit}:specs/archive/${f.taskId}`]).split("\n").filter(Boolean).sort()).toEqual(["archive-exemption.json","decision-log.md","extra.md","spec.md"]);
    expect(f.git(f.repo,["show",`${commit}:specs/archive/${f.taskId}/decision-log.md`])).toBe(decision.toString().replace(/\n$/,""));
    expect(rows(f,commit)).toContain("A\tsrc/feature.mjs");
    // The task push happened before the merge and has its own receipt; the
    // target remote is still the pre-close tip until later.
    expect(f.git(f.bare,["rev-parse",`refs/heads/${taskBranch}`])).toBe(commit);
    expect(f.git(f.bare,["rev-parse","refs/heads/main"])).toBe(p.plan.target_head);
    const final=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000});
    expect(final.status, JSON.stringify(final.error)).toBe("completed");
    expect(final.physical.physical_delivery_status).toBe("removed");
    expect(final.physical.facts.task_branch_pushed).toBe(true);
    expect(final.physical.graph.status).toBe("unchanged");
    expect(final.physical.graph.exit_code).toBe(0);
    expect(JSON.parse(readFileSync(final.physical.graph.receipt_ref,"utf8"))).toMatchObject({status:"unchanged",exit_code:0,changed_paths:[]});
    expect(rows(f,commit).some(row=>row.includes("graphify-out/"))).toBe(false);
    const delivered=f.git(f.bare,["rev-parse","refs/heads/main"]);
    expect(f.git(f.repo,["rev-list","--count",`${p.plan.target_head}..${delivered}`])).toBe("2");
    expect(f.git(f.repo,["rev-list","--count",`${p.plan.target_head}..${commit}`])).toBe("1");
    // Both pushes have their own native receipt bound to branch and HEAD.
    const grants=pushesOf(f);
    expect(new Set(grants.map(g=>g.branch))).toEqual(new Set([taskBranch,"main"]));
    const taskPush=grants.find(g=>g.branch===taskBranch),targetPush=grants.find(g=>g.branch==="main");
    expect(taskPush.head).toBe(commit);
    expect(targetPush.head).not.toBe(commit);
    const actions=readdirSync(join(f.taskDir,"quality","evidence","close")).filter(name=>/-close-action\.json$/.test(name)).map(name=>JSON.parse(readFileSync(join(f.taskDir,"quality","evidence","close",name),"utf8")));
    expect(actions.filter(row=>row.operation==="push"&&row.status==="completed")).toHaveLength(1);
    expect(actions.filter(row=>row.operation==="archive"&&row.status==="completed")).toHaveLength(1);
    expect(graphReceiptsOf(f)).toHaveLength(1);
  });
});

it("isolated archive before delivery rejects a hand-deleted source with a stale archive and an incomplete move",async()=>{
  const f=await fixture(),materials=join(f.wt,"specs",f.taskId),base=f.git(f.repo,["rev-parse","HEAD"]);
  writeFileSync(join(materials,"extra.md"),"# extra\n");
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  rmSync(materials,{recursive:true});
  mkdirSync(join(f.wt,"specs","archive",f.taskId),{recursive:true});
  writeFileSync(join(f.wt,"specs","archive",f.taskId,"spec.md"),"stale archive bytes\n");
  const handDeleted=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(handDeleted.status).toBe("failed");
  expect(handDeleted.error.code).toBe("SOURCE_BYTES_DRIFT");
  expect(f.git(f.repo,["rev-parse","HEAD"])).toBe(base);
  expect(f.git(f.repo,["ls-remote","--heads","origin","refs/heads/main"]).split(/\s/)[0]).toBe(base);
});

it("isolated archive before delivery keeps the first failed push and recovers only the missing action",async()=>{
  const f=await fixture(),base=f.git(f.repo,["rev-parse","HEAD"]);
  mkdirSync(join(f.wt,"graphify-out"),{recursive:true});
  writeFileSync(join(f.wt,"src-note.md"),"delivery bytes\n");
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  // Make the target push fail deterministically: a stale ref lock is a real
  // remote-side rejection, not a mocked command.
  writeFileSync(join(f.bare,"refs","heads","main.lock"),"");
  const first=await withGraph(GRAPH_UNCHANGED,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000}));
  expect(first.status, JSON.stringify(first.error)).toBe("failed");
  expect(first.operation).toBe("push");
  expect(first.error.code).toBe("GIT_COMMAND_FAILED");
  const failedBytes=readFileSync(first.failure_ref);
  expect(JSON.parse(failedBytes.toString()).status).toBe("failed");
  expect(f.git(f.repo,["ls-remote","--heads","origin","refs/heads/main"]).split(/\s/)[0]).toBe(base);
  const [commit]=first.records.filter(row=>row.operation==="commit");
  expect(f.git(f.bare,["rev-parse",`refs/heads/task/workflowhub/${f.taskId}`])).toBe(commit.source_head);
  rmSync(join(f.bare,"refs","heads","main.lock"));
  const second=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000});
  expect(second.status, JSON.stringify(second.error)).toBe("completed");
  expect(second.records.filter(row=>row.operation==="commit")).toHaveLength(1);
  expect(second.records.filter(row=>row.operation==="archive")).toHaveLength(1);
  expect(second.records.filter(row=>row.operation==="push")).toHaveLength(1);
  expect(readFileSync(first.failure_ref)).toEqual(failedBytes);
  const delivered=f.git(f.bare,["rev-parse","refs/heads/main"]);
  expect(delivered).not.toBe(base);
  expect(second.physical.facts.push).toBe(true);
  expect(second.physical.facts.task_branch_pushed).toBe(true);
  expect(second.physical.physical_delivery_status).toBe("removed");
  // Only the missing target push ran on resume: one shared task-branch grant.
  expect(pushesOf(f)).toHaveLength(2);
});

it("isolated archive before delivery names a target archive conflict instead of merging it into the delivery commit",async()=>{
  const f=await fixture();
  mkdirSync(join(f.wt,"specs","archive",f.taskId),{recursive:true});
  writeFileSync(join(f.wt,"specs","archive",f.taskId,"spec.md"),"stale archive bytes\n");
  f.git(f.wt,["add","--",`specs/archive/${f.taskId}/spec.md`]);
  f.git(f.wt,["commit","-qm","plant stale archive"]);
  const head=f.git(f.wt,["rev-parse","HEAD"]);
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const result=await withGraph(GRAPH_UNCHANGED,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000}));
  expect(result.status).toBe("failed");
  expect(result.error.code).toBe("ARCHIVE_TARGET_CONFLICT");
  expect(result.physical.graph.status).toBe("not_applicable");
  expect(f.git(f.wt,["rev-parse","HEAD"])).toBe(head);
  expect(f.git(f.wt,["status","--porcelain"])).toContain(`?? specs/${f.taskId}/`);
  expect(f.git(f.wt,["status","--porcelain"])).not.toContain(`specs/archive/${f.taskId}/`);
});

it("bounded graph handoff and close records a failed code-graph result without blocking the delivery or rewriting it late",async()=>{
  const f=await fixture();
  mkdirSync(join(f.wt,"graphify-out"),{recursive:true});
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const partial=await withGraph(GRAPH_FAILED,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit",graphTimeoutMs:2000}));
  expect(partial.status).toBe("partial");
  expect(partial.physical.graph.status).toBe("failed");
  expect(partial.physical.graph.reason).toContain("exited 2");
  const receipt=partial.physical.graph.receipt_ref,original=readFileSync(receipt);
  expect(JSON.parse(original.toString()).stdout).toBe("");
  expect(JSON.parse(original.toString()).stderr).toContain("model offline");
  // A later available graph result must not overwrite the original failure.
  const final=await withGraph(GRAPH_UPDATED,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000}));
  expect(final.status, JSON.stringify(final.error)).toBe("completed");
  expect(final.physical.graph.status).toBe("failed");
  expect(final.physical.graph.receipt_ref).toBe(receipt);
  expect(readFileSync(receipt)).toEqual(original);
  expect(graphReceiptsOf(f)).toHaveLength(1);
});

it("bounded graph handoff and close records an actual updated code graph in its own receipt",async()=>{
  const f=await fixture();
  mkdirSync(join(f.wt,"graphify-out"),{recursive:true});
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const final=await withGraph(GRAPH_UPDATED,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000}));
  expect(final.status, JSON.stringify(final.error)).toBe("completed");
  expect(final.physical.graph.status).toBe("updated");
  expect(final.physical.graph.command).toBe("graphify update . --no-cluster");
  expect(JSON.parse(readFileSync(final.physical.graph.receipt_ref,"utf8"))).toMatchObject({kind:"code",status:"updated",plan_ref:p.plan_ref,changed_paths:["graphify-out/graph.json"]});
  const commit=final.records.find(row=>row.operation==="commit").source_head;
  expect(f.git(f.repo,["show",`${commit}:graphify-out/graph.json`])).toContain('"updated"');
});

it("bounded graph handoff and close keeps a timed-out graph diagnostic while the lawful close continues",async()=>{
  const f=await fixture();
  mkdirSync(join(f.wt,"graphify-out"),{recursive:true});
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const partial=await withGraph(GRAPH_SLOW,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"commit",graphTimeoutMs:150}));
  expect(partial.status).toBe("partial");
  expect(partial.physical.graph.status).toBe("failed");
  expect(partial.physical.graph.timed_out).toBe(true);
  expect(partial.physical.graph.reason).toContain("timed out");
  const final=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:150});
  expect(final.status, JSON.stringify(final.error)).toBe("completed");
  expect(final.physical.graph.status).toBe("failed");
  expect(final.physical.graph.timed_out).toBe(true);
});

const CLI=fileURLToPath(new URL("../../tools/cli/check-specs-archive.mjs",import.meta.url));

it("isolated archive before delivery keeps task_branch_pushed false when the task push is rejected",async()=>{
  const f=await fixture(),base=f.git(f.repo,["rev-parse","HEAD"]);
  writeFileSync(join(f.bare,"hooks","pre-receive"),"#!/bin/sh\nwhile read old new ref; do case \"$ref\" in refs/heads/task/*) echo 'reject task push' >&2; exit 1;; esac; done\nexit 0\n",{mode:0o755});
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const result=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(result.status).toBe("failed");
  expect(result.operation).toBe("push-task");
  expect(result.error.code).toBe("GIT_COMMAND_FAILED");
  expect(result.physical.facts.task_branch_pushed).toBe(false);
  expect(f.git(f.repo,["ls-remote","--heads","origin",`refs/heads/task/workflowhub/${f.taskId}`])).toBe("");
  expect(f.git(f.repo,["ls-remote","--heads","origin","refs/heads/main"]).split(/\s/)[0]).toBe(base);
  const failure=JSON.parse(readFileSync(result.failure_ref,"utf8"));
  expect(failure).toMatchObject({operation:"push-task",plan_action:"merge",sub_action:"push-task",status:"failed"});
});

it("isolated archive before delivery rejects an incomplete delivered archive on readback",async()=>{
  const f=await fixture();
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const final=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(final.status,JSON.stringify(final.error)).toBe("completed");
  f.git(f.repo,["rm","-q",`specs/archive/${f.taskId}/spec.md`]);
  f.git(f.repo,["commit","-qm","tamper archive"]);
  const readback=await inspectDeliveryCloseState({taskDir:f.taskDir,planRef:p.plan_ref});
  expect(readback.facts.archive).toBe(false);
  expect(readback.archive_readback).toMatchObject({status:"mismatch",complete:true,source_present:false});
  expect(readback.archive_readback.missing).toContain("spec.md");
  expect(readback.physical_delivery_status).toBe("incomplete");
});

it("isolated archive before delivery rejects a hand-written ordinary plan without the archive order field",async()=>{
  const f=await fixture();
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const plan=JSON.parse(readFileSync(p.plan_ref,"utf8"));
  delete plan.archive_before_commit;
  const forged=join(dirname(p.plan_ref),"2099-01-01-001-close-plan.json");
  writeFileSync(forged,JSON.stringify(plan)+"\n");
  await expect(confirmClosePlan({taskDir:f.taskDir,planRef:forged,replyText:"Approve this exact owned plan."})).rejects.toMatchObject({code:"CLOSE_PLAN_ORDER"});
  expect(f.git(f.wt,["rev-parse","HEAD"])).toBe(plan.source.head);
});

it("isolated archive before delivery does not let an unverified completed action row project removed",async()=>{
  const f=await fixture();
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const final=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(final.status,JSON.stringify(final.error)).toBe("completed");
  writeFileSync(join(dirname(p.plan_ref),"9999-12-31-999-close-action.json"),JSON.stringify({operation:"commit",status:"completed",plan_ref:p.plan_ref,source_head:"0".repeat(40),target_head:"0".repeat(40),recorded_at:"9999-12-31T00:00:00Z"})+"\n");
  const readback=await inspectDeliveryCloseState({taskDir:f.taskDir,planRef:p.plan_ref});
  expect(readback.physical_delivery_status).toBe("removed");
  expect(readback.step_records.some(row=>row.source_head==="0".repeat(40))).toBe(true);
});

it("isolated archive before delivery exposes the latest close plan through the read-only archive CLI",async()=>{
  const f=await fixture();
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const ok=spawnSync(process.execPath,[CLI,`--task-path=${f.taskDir}`],{encoding:"utf8"});
  expect(ok.status,ok.stderr).toBe(0);
  const parsed=JSON.parse(ok.stdout);
  expect(parsed.plan_ref).toBe(p.plan_ref);
  expect(parsed.archive).toBe(false);
  expect(parsed.archive_readback).toMatchObject({status:"mismatch"});
  const missing=spawnSync(process.execPath,[CLI,`--task-path=${join(f.root,"missing-task")}`],{encoding:"utf8"});
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain("CLOSE_PLAN_REFERENCE");
});

it("isolated archive before delivery recovers a graph-written archive conflict without source drift",async()=>{
  const f=await fixture();
  mkdirSync(join(f.wt,"graphify-out"),{recursive:true});
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const script="#!/bin/sh\nmkdir -p specs/archive/owned-close\necho stale > specs/archive/owned-close/spec.md\nmkdir -p graphify-out\nprintf '%s\\n' '{\"nodes\":[]}' > graphify-out/graph.json\necho 'Rebuilt graph.json'\nexit 0\n";
  const first=await withGraph(script,()=>executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000}));
  expect(first.status).toBe("failed");
  expect(first.error.code).toBe("ARCHIVE_TARGET_CONFLICT");
  expect(first.physical.graph.status).toBe("updated");
  rmSync(join(f.wt,"specs","archive",f.taskId),{recursive:true,force:true});
  const second=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:2000});
  expect(second.status,JSON.stringify(second.error)).toBe("completed");
  const commit=second.records.find(row=>row.operation==="commit").source_head;
  expect(rows(f,commit)).toContain("A\tgraphify-out/graph.json");
  expect(second.physical.graph.status).toBe("updated");
});

it("isolated archive before delivery names an unreadable consumed push receipt instead of silently resending",async()=>{
  const f=await fixture(),taskBranch=`task/workflowhub/${f.taskId}`;
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const partial=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,until:"merge",graphTimeoutMs:1000});
  expect(partial.status,JSON.stringify(partial.error)).toBe("partial");
  const authDir=join(f.taskDir,"quality","evidence","git-authorizations");
  const consumed=readdirSync(authDir).filter(name=>/-consumed-push\.json$/.test(name)).map(name=>JSON.parse(readFileSync(join(authDir,name),"utf8"))).find(row=>row.step_id.endsWith(":push-task"));
  expect(consumed).toBeTruthy();
  writeFileSync(join(authDir,basename(consumed.authorization_ref)),"{bad grant}\n");
  await expect(inspectDeliveryCloseState({taskDir:f.taskDir,planRef:p.plan_ref})).rejects.toMatchObject({code:"PUSH_RECEIPT_UNREADABLE"});
  expect(f.git(f.bare,["rev-parse",`refs/heads/${taskBranch}`])).not.toBe("");
});

// ORACLE-CLOSE-CLAIMS-REPLAY — P9/T009. The three delivery claims (implemented /
// verified / accepted) each read one sourced original: the gate-results original
// written by the real `stage-runtime verify --action=execute` capture, that same
// capture's receipt, and an independent verdict plus the close readback. The
// close is the only writer of the readback; a red gate, changed bytes after
// signing, a signer who authored the implementation, a missing signature, or a
// hand-built gate original that never went through the real capture route must
// be refused before any Git action.
import{createHash}from"node:crypto";import{environmentFingerprint,stageRuntimeCliMain}from"../../tools/cli/stage-runtime.mjs";
const CLAIMS_CLI=fileURLToPath(new URL("../../tools/cli/check-delivery-claims.mjs",import.meta.url));
const REPLAY_CLI=fileURLToPath(new URL("../../tools/cli/check-replay.mjs",import.meta.url));
function claimPhases(f){
  const root=join(f.wt,"specs",f.taskId);mkdirSync(join(root,"phases"),{recursive:true});
  writeFileSync(join(root,"phases/index.md"),"# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1-owned.md` | `phase-p1` | `owned.txt` | `none` | build-code |\n");
  writeFileSync(join(root,"phases/P1-owned.md"),"# Phase P1 — owned claim bytes\n");
}
const SETUP_GATE="SETUP: gate artifact must bind the controlled material fingerprint and exit";
const factsRows=f=>readFileSync(join(f.taskDir,"facts.jsonl"),"utf8").trim().split("\n").filter(Boolean).map(row=>JSON.parse(row));
function gatePointer(f){
  const row=factsRows(f).find(value=>value.record_kind==="stage"&&value.stage==="build-code");
  const markers=[...String(row?.source??"").matchAll(/; gate: ([^\n;]+)/g)];
  expect(markers.length,"SETUP: the real verify route must record a hashed gate-results pointer in the build-code facts row").toBeGreaterThan(0);
  const bound=/^([A-Za-z0-9._/-]+)#sha256=([a-f0-9]{64})$/.exec(markers.at(-1)[1].trim());
  expect(bound,`SETUP: the recorded gate pointer must be a hashed task-relative original; got ${markers.at(-1)[1]}`).not.toBeNull();
  return{ref:bound[1],sha256:bound[2]};
}
// The fixture never builds a gate original itself: it supplies the controlled
// command to the real public verify route, which performs the capture and writes
// the one ordinary gate-results original plus its facts pointer.
async function claimsFixture({gateExit=0,slug="owned-gate"}={}){
  const f=await fixture();claimPhases(f);
  const script=join(f.root,"owned-gate.mjs");
  writeFileSync(script,gateExit===0?"console.log('owned gate ok');\n":"console.error('owned gate failure: required original missing');\nprocess.exit(1);\n");
  const input=join(f.taskDir,"quality","evidence",`${slug}-verify-input.json`);
  mkdirSync(dirname(input),{recursive:true});
  writeFileSync(input,JSON.stringify({argv:[process.execPath,script],slug,timeoutMs:30000})+"\n");
  const prior=process.env.WORKFLOWHUB_TASK_DIR;
  process.env.WORKFLOWHUB_TASK_DIR=f.storage;
  let captured;
  try{captured=await stageRuntimeCliMain(["verify","--action=execute","--stage=build-code","--project=workflowhub",`--task=${f.taskId}`,`--task-path=${f.taskDir}`,`--input=${input}`],{cwd:f.wt});}
  finally{if(prior===undefined)delete process.env.WORKFLOWHUB_TASK_DIR;else process.env.WORKFLOWHUB_TASK_DIR=prior;}
  expect(captured.exit_code,`SETUP: the real verify route must capture the controlled gate exit ${gateExit}`).toBe(gateExit);
  const gate=gatePointer(f),gateBytes=readFileSync(join(f.taskDir,gate.ref));
  expect(createHash("sha256").update(gateBytes).digest("hex"),"SETUP: the recorded gate pointer must hash the stored original bytes").toBe(gate.sha256);
  const artifact=JSON.parse(gateBytes.toString("utf8"));
  expect(artifact.capture_route,"SETUP: the gate original must come from the real verify:execute capture route").toBe("verify:execute");
  expect(artifact.exit_code,SETUP_GATE).toBe(gateExit);
  expect(artifact.material_missing,SETUP_GATE).toEqual([]);
  expect(artifact.worktree_diff_sha256,SETUP_GATE).toMatch(/^[a-f0-9]{64}$/);
  return{...f,gate,materialSha:artifact.material_sha256,gateArtifact:artifact,captured};
}
// Replace the captured gate original with hand-written bytes and rebind the facts
// pointer, so a test can prove the claim reader refuses a gate that did not come
// from the real route even when every recorded hash is self-consistent.
function rewriteGate(f,mutate){
  const file=join(f.taskDir,f.gate.ref),artifact=JSON.parse(readFileSync(file,"utf8"));
  mutate(artifact);
  const bytes=Buffer.from(`${JSON.stringify(artifact,null,2)}\n`);
  writeFileSync(file,bytes);
  const sha=createHash("sha256").update(bytes).digest("hex");
  const rows=factsRows(f).map(row=>row.record_kind==="stage"&&row.stage==="build-code"
    ?{...row,source:String(row.source).replace(`${f.gate.ref}#sha256=${f.gate.sha256}`,`${f.gate.ref}#sha256=${sha}`)}:row);
  writeFileSync(join(f.taskDir,"facts.jsonl"),rows.map(row=>JSON.stringify(row)).join("\n")+"\n");
  return{...f,gate:{ref:f.gate.ref,sha256:sha}};
}
const readbackFiles=f=>{try{return readdirSync(join(f.taskDir,"quality","evidence","close")).filter(name=>/-close-claims-readback\.json$/.test(name));}catch(error){if(error.code==="ENOENT")return[];throw error;}};
function signClaims(f,{signer="independent-acceptor-7",materialSha=f.materialSha,gate=f.gate,conclusion="pass"}={}){
  const verdict={schema_version:"delivery-verdict.v1",task_id:f.taskId,stage:"build-code",conclusion,signer:{identity:signer,role:"independent-acceptor"},reviewed:{material_sha256:materialSha,gate_ref:gate},signed_at:new Date().toISOString()};
  const dir=join(f.taskDir,"quality","evidence");mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,"verdict.json"),`${JSON.stringify(verdict,null,2)}\n`);return verdict;
}
const runClaims=f=>spawnSync(process.execPath,[CLAIMS_CLI,`--task-path=${f.taskDir}`],{encoding:"utf8"});
function claimBody(run){return JSON.parse(run.stdout);}

it("bound delivery claims: a real close consumes the three sourced originals and records the actual readback",async()=>{
  const f=await claimsFixture();
  // The gate original is the one written by the real public capture route; its
  // argv, output, receipt and material fingerprint are readable originals.
  expect(f.gateArtifact.capture_surface).toContain("stage-runtime verify --action=execute");
  expect(f.gateArtifact.argv).toEqual(f.captured.argv);
  expect(f.gateArtifact.material_sha256).toBe(f.materialSha);
  const gateOutput=readFileSync(join(f.taskDir,f.gateArtifact.output_ref));
  expect(createHash("sha256").update(gateOutput).digest("hex")).toBe(f.gateArtifact.output_sha256);
  expect(gateOutput.toString("utf8")).toContain("owned gate ok");
  const gateReceipt=readFileSync(join(f.taskDir,f.gateArtifact.receipt_ref));
  expect(createHash("sha256").update(gateReceipt).digest("hex")).toBe(f.gateArtifact.receipt_sha256);
  expect(JSON.parse(gateReceipt.toString("utf8"))).toMatchObject({argv:f.captured.argv,exit_code:f.gateArtifact.exit_code,output_ref:f.captured.output_ref});
  expect(f.captured.receipt_ref.endsWith(`/${basename(f.gateArtifact.receipt_ref)}`)).toBe(true);
  signClaims(f);
  const before=runClaims(f);
  expect(before.status,"a signed accepted claim without a downstream readback must not pass").toBe(1);
  const first=claimBody(before);
  expect(first.claims.implemented).toMatchObject({status:"pass",evidence:{ref:f.gate.ref,sha256:f.gate.sha256}});
  expect(first.claims.implemented.reasons).toEqual([]);
  expect(first.claims.verified).toMatchObject({status:"pass",evidence:{ref:f.gate.ref,sha256:f.gate.sha256}});
  expect(first.claims.verified.reasons).toEqual([]);
  expect(first.claims.accepted.status).toBe("fail");
  expect(first.claims.accepted.reasons.join(" ")).toMatch(/readback/);
  expect(readbackFiles(f)).toEqual([]);
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const final=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(final.status,JSON.stringify(final.error)).toBe("completed");
  expect(final.delivery_claims.status).toBe("pass");
  const readbackRef=final.delivery_claims.readback_ref,readback=JSON.parse(readFileSync(join(f.taskDir,readbackRef),"utf8"));
  expect(readbackRef,JSON.stringify(final.delivery_claims)).toMatch(/^quality\/evidence\/close\/\d{4}-\d{2}-\d{2}-\d{3}-close-claims-readback\.json$/);
  expect(readback).toMatchObject({schema_version:"close-claims-readback.v1",task_id:f.taskId,status:"pass",plan_ref:p.plan_ref,material_sha256:f.materialSha,gate_ref:f.gate});
  const verdictSha=createHash("sha256").update(readFileSync(join(f.taskDir,"quality","evidence","verdict.json"))).digest("hex");
  expect(readback.verdict_ref).toEqual({ref:"quality/evidence/verdict.json",sha256:verdictSha});
  // The readback records each claim's own sourced original, not one shared copy.
  expect(readback.claims).toEqual({implemented:f.gate,verified:f.gate,accepted:{ref:"quality/evidence/verdict.json",sha256:verdictSha}});
  expect(createHash("sha256").update(readFileSync(join(f.taskDir,f.gate.ref))).digest("hex")).toBe(f.gate.sha256);
  const after=runClaims(f);
  expect(after.status,after.stderr).toBe(0);
  const body=claimBody(after);
  expect(body.status).toBe("pass");expect(body.material.archived).toBe(true);
  expect(body.claims.accepted).toMatchObject({status:"pass",evidence:{ref:readbackRef}});
  expect(body.claims.accepted.reasons).toEqual([]);
  expect(body.claims.implemented.evidence).toMatchObject(f.gate);
  expect(body.claims.verified.evidence).toMatchObject(f.gate);
  expect(readbackFiles(f)).toHaveLength(1);
});

it("bound delivery claims: a genuine red gate is refused by the real close and stays a named failure",async()=>{
  const f=await claimsFixture({gateExit:1,slug:"owned-gate-red"});signClaims(f);
  // The red is the controlled command's own exit captured by the real route,
  // not a hand-written artifact exit.
  expect(f.captured.exit_code).toBe(1);
  expect(f.gateArtifact.exit_code).toBe(1);
  expect(readFileSync(join(f.taskDir,f.gateArtifact.output_ref),"utf8")).toContain("required original missing");
  const run=runClaims(f);expect(run.status).toBe(1);
  const body=claimBody(run);
  expect(body.claims.implemented.status).toBe("pass");
  expect(body.claims.verified.status).toBe("fail");
  expect(body.claims.verified.reasons.join(" ")).toMatch(/exit is 1, not 0/);
  expect(body.claims.accepted.status).toBe("fail");
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const base=f.git(f.repo,["rev-parse","HEAD"]);
  const result=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(result.status).toBe("failed");expect(result.operation).toBe("claims");expect(result.error.code).toBe("DELIVERY_CLAIMS_REJECTED");
  expect(result.error.message).toMatch(/verified/);
  expect(readbackFiles(f)).toEqual([]);
  const failure=JSON.parse(readFileSync(result.failure_ref,"utf8"));
  expect(failure).toMatchObject({operation:"claims",status:"failed",plan_ref:p.plan_ref});
  expect(f.git(f.repo,["rev-parse","HEAD"])).toBe(base);
  expect(f.git(f.repo,["ls-remote","--heads","origin","refs/heads/main"]).split(/\s/)[0]).toBe(base);
  expect(readdirSync(join(f.taskDir,"quality","evidence","close")).some(name=>/-close-action\.json$/.test(name)&&JSON.parse(readFileSync(join(f.taskDir,"quality","evidence","close",name),"utf8")).status==="completed")).toBe(false);
});

it("bound delivery claims: material bytes changed after signing invalidate the signature and the close, keeping both originals",async()=>{
  const f=await claimsFixture();signClaims(f);
  const verdictBefore=readFileSync(join(f.taskDir,"quality","evidence","verdict.json"));
  const gateBefore=readFileSync(join(f.taskDir,f.gate.ref));
  writeFileSync(join(f.wt,"specs",f.taskId,"spec.md"),"# Owned actual delivery changed after signing\n");
  const run=runClaims(f);expect(run.status).toBe(1);
  const body=claimBody(run);
  expect(body.claims.accepted.status).toBe("fail");
  expect(body.claims.accepted.reasons.join(" ")).toMatch(/differ from the signed fingerprint/);
  expect(body.material.sha256).not.toBe(f.materialSha);
  expect(body.claims.implemented.status).toBe("pass");
  expect(body.claims.verified.status).toBe("pass");
  const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
  const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const base=f.git(f.repo,["rev-parse","HEAD"]);
  const result=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(result.status).toBe("failed");expect(result.error.code).toBe("DELIVERY_CLAIMS_REJECTED");
  expect(result.error.message).toMatch(/differ from the signed fingerprint/);
  expect(readbackFiles(f)).toEqual([]);
  expect(f.git(f.repo,["rev-parse","HEAD"])).toBe(base);
  // Neither the signature nor the gate original is rewritten by the refusal.
  expect(readFileSync(join(f.taskDir,"quality","evidence","verdict.json"))).toEqual(verdictBefore);
  expect(readFileSync(join(f.taskDir,f.gate.ref))).toEqual(gateBefore);
});

it("bound delivery claims: a signer who authored the implementation and a missing signature are both refused",async()=>{
  const author=await claimsFixture({slug:"owned-gate-author"});signClaims(author,{signer:"Owned close"});
  const selfSigned=runClaims(author);expect(selfSigned.status).toBe(1);
  const selfBody=claimBody(selfSigned);
  expect(selfBody.claims.accepted.reasons.join(" ")).toMatch(/implementation authors/);
  // Only acceptance fails: the real gate and its receipt still prove implementation/verification.
  expect(selfBody.claims.implemented.status).toBe("pass");
  expect(selfBody.claims.verified.status).toBe("pass");
  const unsigned=await claimsFixture({slug:"owned-gate-unsigned"});
  const missing=runClaims(unsigned);expect(missing.status).toBe(1);
  const missingBody=claimBody(missing);
  expect(missingBody.claims.accepted.reasons.join(" ")).toMatch(/no independent signature original/);
  expect(missingBody.claims.accepted.evidence).toBeNull();
  expect(missingBody.claims.implemented.status).toBe("pass");
  expect(missingBody.claims.verified.status).toBe("pass");
  for(const f of [author,unsigned]){
    const p=await prepareDeliveryClosePlan({taskDir:f.taskDir});
    const c=await confirmClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
    await authorizeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
    const base=f.git(f.repo,["rev-parse","HEAD"]);
    const result=await executeClosePlan({taskDir:f.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
    expect(result.status).toBe("failed");expect(result.error.code).toBe("DELIVERY_CLAIMS_REJECTED");
    expect(result.error.message).toMatch(/accepted/);
    expect(readbackFiles(f)).toEqual([]);
    expect(f.git(f.repo,["rev-parse","HEAD"])).toBe(base);
  }
});

it("bound delivery claims: a hand-built gate original that never went through the real verify capture is refused",async()=>{
  const f=await claimsFixture();signClaims(f);
  // A fabricated gate can copy every field; it cannot honestly claim the real
  // capture route. The claim reader must refuse it, not treat it as the gate.
  const forged=rewriteGate(f,artifact=>{artifact.capture_route="direct:buildGateResultArtifact";artifact.capture_surface="hand-written gate-results artifact";});
  const run=runClaims(forged);expect(run.status).toBe(1);
  const body=claimBody(run);
  expect(body.claims.implemented.status).toBe("fail");
  expect(body.claims.implemented.reasons.join(" ")).toMatch(/verify --action=execute/);
  expect(body.claims.verified.status).toBe("fail");
  expect(body.claims.verified.reasons.join(" ")).toMatch(/verify --action=execute/);
  const p=await prepareDeliveryClosePlan({taskDir:forged.taskDir});
  const c=await confirmClosePlan({taskDir:forged.taskDir,planRef:p.plan_ref,replyText:"Approve this exact owned plan."});
  await authorizeClosePlan({taskDir:forged.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref});
  const base=forged.git(forged.repo,["rev-parse","HEAD"]);
  const result=await executeClosePlan({taskDir:forged.taskDir,planRef:p.plan_ref,confirmationRef:c.confirmation_ref,graphTimeoutMs:1000});
  expect(result.status).toBe("failed");expect(result.operation).toBe("claims");expect(result.error.code).toBe("DELIVERY_CLAIMS_REJECTED");
  expect(result.error.message).toMatch(/verify --action=execute/);
  expect(readbackFiles(forged)).toEqual([]);
  expect(forged.git(forged.repo,["rev-parse","HEAD"])).toBe(base);
});

it("matched target replay: a lost T6/T16 original is reported unavailable with reason and owner and never passes",()=>{
  const root=realpathSync(mkdtempSync(join(tmpdir(),"owned-replay-lost-")));roots.push(root);
  const red=join(root,"target-red.mjs");
  writeFileSync(red,"console.error('T6 controlled target failure: required-original-missing');\nprocess.exit(1);\n");
  const sha=value=>createHash("sha256").update(value).digest("hex");
  const redSha=sha(readFileSync(red)),env=environmentFingerprint();
  const lost=id=>({id,original:{status:"lost",reason:`${id}: the historical original was lost before this task`,owner:"P9 acceptance owner"},input:"target-red.mjs",input_sha256:redSha,target:{argv:[process.execPath,red],expected:{exit:1,gap:"required-original-missing"}},environment:{hash:env}});
  const casesFile=join(root,"lost-originals.json");
  const matched={id:"owned-matched-red",input:"target-red.mjs",input_sha256:redSha,target:{argv:[process.execPath,red],expected:{exit:1,gap:"required-original-missing"}},environment:{hash:env}};
  writeFileSync(casesFile,JSON.stringify({schema_version:"1.0.0",cases:[lost("t6-lost-original"),lost("t16-lost-original"),matched]},null,2));
  const run=spawnSync(process.execPath,[REPLAY_CLI,`--cases=${casesFile}`],{cwd:root,encoding:"utf8"});
  expect(run.status,`a lost original must keep the replay incomplete:\n${run.stdout}${run.stderr}`).toBe(1);
  const body=JSON.parse(run.stdout);
  expect(body.status,"a matched red must not turn two lost originals into a replayed pass").toBe("incomplete");
  expect(body.unavailable).toEqual([
    {id:"t6-lost-original",status:"unavailable",reason:"t6-lost-original: the historical original was lost before this task",owner:"P9 acceptance owner"},
    {id:"t16-lost-original",status:"unavailable",reason:"t16-lost-original: the historical original was lost before this task",owner:"P9 acceptance owner"},
  ]);
  const [t6,t16,replayed]=body.cases;
  for(const row of [t6,t16]){
    expect(row).toMatchObject({verdict:"unavailable",original_status:"lost",input_sha256:redSha});
    expect(row.unavailable).toMatchObject({status:"unavailable",label:"未取得",owner:"P9 acceptance owner"});
    expect(row.unavailable.reason).toMatch(/lost before this task/);
    // The controlled copy was not executed as if it were the lost original.
    expect(row.observed).toBeUndefined();
  }
  expect(replayed).toMatchObject({id:"owned-matched-red",verdict:"target_red"});
  expect(run.stdout).not.toMatch(/"verdict"\s*:\s*"pass"|"status"\s*:\s*"passed"|已回放/);
  // A lost declaration that names no reason or owner is invalid, not silently unavailable.
  const unnamed=join(root,"lost-without-owner.json");
  writeFileSync(unnamed,JSON.stringify({schema_version:"1.0.0",cases:[{...lost("t6-lost-without-owner"),original:{status:"lost"}}]},null,2));
  const rejected=spawnSync(process.execPath,[REPLAY_CLI,`--cases=${unnamed}`],{cwd:root,encoding:"utf8"});
  expect(rejected.status).toBe(1);
  const rejectedBody=JSON.parse(rejected.stdout);
  expect(rejectedBody.status).toBe("incomplete");
  expect(rejectedBody.unavailable).toEqual([]);
  expect(rejectedBody.cases[0]).toMatchObject({id:"t6-lost-without-owner",verdict:"invalid_case"});
  expect(rejectedBody.cases[0].reason).toMatch(/reason and owner/);
});

it("matched environment replay confirms the named target failure and separates incomparable environments from swapped fixtures",()=>{
  const root=realpathSync(mkdtempSync(join(tmpdir(),"owned-replay-")));roots.push(root);
  const red=join(root,"target-red.mjs"),green=join(root,"swapped-green.mjs");
  writeFileSync(red,"console.error('T6 controlled target failure: required-original-missing');\nprocess.exit(1);\n");
  writeFileSync(green,"console.log('fixture replaced: the target now behaves green');\n");
  const sha=value=>createHash("sha256").update(value).digest("hex");
  const redSha=sha(readFileSync(red)),env=environmentFingerprint();
  const judge=cases=>{const file=join(root,`${cases[0].id}.json`);writeFileSync(file,JSON.stringify({schema_version:"1.0.0",cases},null,2));const run=spawnSync(process.execPath,[REPLAY_CLI,`--cases=${file}`],{cwd:root,encoding:"utf8"});return{run,body:JSON.parse(run.stdout)}};
  const matched=judge([{id:"owned-matched-red",input:"target-red.mjs",input_sha256:redSha,target:{argv:[process.execPath,red],expected:{exit:1,gap:"required-original-missing"}},environment:{hash:env}}]);
  expect(matched.run.status,matched.run.stderr).toBe(0);
  expect(matched.body.status).toBe("replayed");
  expect(matched.body.cases[0]).toMatchObject({id:"owned-matched-red",verdict:"target_red"});
  const incomparable=judge([{id:"owned-incomparable",input:"target-red.mjs",input_sha256:redSha,target:{argv:[process.execPath,red],expected:{exit:1,gap:"required-original-missing"}},environment:{hash:"0".repeat(64)}}]);
  expect(incomparable.run.status).toBe(1);
  expect(incomparable.body.cases[0].verdict).toBe("incomparable");
  const swapped=judge([{id:"owned-swapped",input:"swapped-green.mjs",input_sha256:redSha,target:{argv:[process.execPath,green],expected:{exit:1,gap:"required-original-missing"}},environment:{hash:env}}]);
  expect(swapped.run.status).toBe(1);
  expect(swapped.body.cases[0].verdict).toBe("fixture_mismatch");
  const greenSha=sha(readFileSync(green));
  const renamed=judge([{id:"owned-green",input:"swapped-green.mjs",input_sha256:greenSha,target:{argv:[process.execPath,green],expected:{exit:1,gap:"required-original-missing"}},environment:{hash:env}}]);
  expect(renamed.run.status).toBe(1);
  expect(renamed.body.cases[0].verdict).toBe("target_green");
  expect(`${matched.run.stdout}${incomparable.run.stdout}${swapped.run.stdout}${renamed.run.stdout}`).not.toMatch(/"verdict"\s*:\s*"pass"|"status"\s*:\s*"passed"|"matched"\s*:\s*true|已回放/);
  const blockedShell=judge([{id:"owned-blocked-shell",input:"target-red.mjs",input_sha256:redSha,target:{argv:["/bin/sh","-c","echo owned-free-text"],expected:{exit:1}},environment:{hash:env}}]);
  expect(blockedShell.run.status).toBe(1);expect(blockedShell.body.cases[0].verdict).toBe("invalid_case");
  const blockedPath=judge([{id:"owned-blocked-path",input:"target-red.mjs",input_sha256:redSha,target:{argv:[process.execPath,"/etc/hosts"],expected:{exit:1}},environment:{hash:env}}]);
  expect(blockedPath.run.status).toBe(1);expect(blockedPath.body.cases[0].verdict).toBe("invalid_case");

});
