import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashAuditSummary } from "../core/audit-summary-carrier.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { prepareTaskWorkspace } from "../core/workspace.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

describe("stage runtime terminal contracts", () => {
  it("does not expose checkpoint override through the formal CLI", () => {
    const source = readFileSync(resolve("scripts/stage-runtime.mjs"), "utf8");
    expect(source).not.toMatch(/values\.checkpoint|--checkpoint/);
  });

  it("formal CLI dispatches real stage handlers instead of publishing caller JSON facts", () => {
    const source = readFileSync(resolve("scripts/stage-runtime.mjs"), "utf8");
    const handlers = readFileSync(resolve("core/stage-handlers.mjs"), "utf8");
    expect(source).not.toMatch(/handlerResult\s*=\s*readJson|values\.result/);
    expect(source).toMatch(/runOfficialStage/);
    expect(handlers).toMatch(/createCheckpoint/);
    expect(source).toMatch(/prepareMakeDecisionWorkspace/);
    expect(source).toMatch(/worktree-root[^\n]+no longer supported/i);
  });

  it("rejects external handler paths and exposes all five repository-owned handlers", () => {
    const source = readFileSync(resolve("scripts/stage-runtime.mjs"), "utf8");
    const handlers = readFileSync(resolve("core/stage-handlers.mjs"), "utf8");
    expect(source).not.toMatch(/handler-module/);
    for (const stage of ["make-decision","build-spec","build-plan","build-code","verify-code"]) expect(handlers).toContain(stage);
  });

  it("runStage resolves declared cross-task input mappings", () => {
    const source = readFileSync(resolve("core/stage-runner.mjs"), "utf8");
    expect(source).toMatch(/readInput\s*\(/);
  });

});

describe("verify close executor fail-stop", () => {
  const roots=[];
  afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true})});
  const governed=async(steps,outcome="confirmed")=>{
    const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-close-")));
    roots.push(root);
    const repo=join(root,"repo"),taskId=`close-${roots.length}`,worktree=`${repo}-${taskId}`;
    mkdirSync(repo);
    execFileSync("git",["init","-q"],{cwd:repo});
    execFileSync("git",["config","user.email","t@e.co"],{cwd:repo});
    execFileSync("git",["config","user.name","T"],{cwd:repo});
    execFileSync("git",["commit","--allow-empty","-qm","base"],{cwd:repo});
    const head=String(execFileSync("git",["rev-parse","HEAD"],{cwd:repo})).trim();
    execFileSync("git",["worktree","add","-qb",`task/Demo/${taskId}`,worktree,head],{cwd:repo});
    const task=createTask({storageRoot:root,manifest:{
      schema_version:"1.0.0",project_name:"Demo",task_id:taskId,
      created_at:new Date().toISOString(),target_repo_root:repo,issue_ids:[],inputs:{},
    }});
    const kernel=createTaskKernel(task,{candidateWorkspace:prepareTaskWorkspace(task)});
    const active=kernel.startStageRun("make-decision",{reason:"terminal close fixture"});
    const snapshotTree=String(execFileSync("git",["rev-parse","HEAD^{tree}"],{cwd:worktree})).trim();
    const content={
      schema_version:"stage-content-evidence.v1",kind:"make-decision.test",
      task_id:taskId,stage:"make-decision",workflow_run_id:active.run.workflow_run_id,
      snapshot_tree:snapshotTree,
    };
    const contentRaw=`${JSON.stringify(content,null,2)}\n`;
    const contentHash=createHash("sha256").update(contentRaw).digest("hex");
    const contentRef=`evidence/stage-content/${contentHash}/make-decision-test.json`;
    kernel.publishCanonicalRecord(contentRef,contentRaw);
    const contentEvidenceRefs=[{kind:content.kind,ref:contentRef,hash:contentHash}];
    const unsignedSummary={
      schema_version:"stage-audit-summary.v1",task_id:taskId,stage_slug:"make-decision",
      workflow_run_id:active.run.workflow_run_id,snapshot_tree:snapshotTree,
      verdict:"pass",content_evidence_refs:contentEvidenceRefs,
    };
    const summaryHash=hashAuditSummary(unsignedSummary);
    const summaryRef=`evidence/audits/make-decision/${summaryHash}.json`;
    kernel.publishCanonicalRecord(summaryRef,`${JSON.stringify({...unsignedSummary,summary_hash:summaryHash},null,2)}\n`);
    const decision=kernel.publishAttempt("make-decision",{facts:{
      worktree_root:worktree,baseline_commit:head,audit_contract_version:"v1",
      audit_summary_ref:summaryRef,audit_summary_hash:summaryHash,audit_verdict:"pass",
      content_evidence_refs:contentEvidenceRefs,
    }});
    kernel.acceptAttempt("make-decision",decision.attempt_ref,writeHumanConfirmation(kernel,"make-decision",decision));
    const resolvedSteps=typeof steps==="function"?steps({head,worktree}):steps;
    const plan={
      schema_version:"task-close-plan.v1",task_id:task.identity.taskId,
      steps:resolvedSteps??[{step_id:"ancestry",operation:"verify-checkpoint-ancestry",checkpoint_oid:head,final_oid:head}],
    };
    const {confirmClosePlan,createGovernedCloseExecutorRegistry}=await import("../core/task-close.mjs");
    const closeConfirmationRef=confirmClosePlan({task,kernel,plan,outcome}).ref;
    return{
      task,kernel,decision,plan,repo,worktree,head,
      executors:createGovernedCloseExecutorRegistry({task,kernel}),closeConfirmationRef,
    };
  };
  it("rejects the transitional in-memory close adapter", async () => {
    const { executeClosePlan } = await import("../core/task-close.mjs");
    await expect(executeClosePlan({ confirmationOutcome: "confirmed", steps: [async () => {}] }))
      .rejects.toThrow(/TaskHandle|TaskKernel|durable|adapter.*forbidden/i);
  });

  it("requires an independent verify capability for every physical close step", async () => {
    const source = readFileSync(resolve("core/task-close.mjs"), "utf8");
    expect(source).not.toMatch(/executor\.verify\s*!==\s*undefined/);
    expect(source).toMatch(/typeof executor\.verify[^\n]+function[^\n]+throw/i);
  });
  it.each(["rejected", "timeout"])("does not execute close steps after %s confirmation", async (outcome) => {
    const taskClose = await import("../core/task-close.mjs");
    const f=await governed(undefined,outcome), result = await taskClose.executeClosePlan(f);
    expect(result.status).toBe("blocked"); expect(existsSync(f.worktree)).toBe(true);
  });

  it("allows a later explicit close confirmation after an earlier rejection", async () => {
    const taskClose = await import("../core/task-close.mjs"), f = await governed(undefined, "rejected");
    const confirmed = taskClose.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: f.plan, outcome: "confirmed" });
    expect(confirmed.ref).not.toBe(f.closeConfirmationRef);
    await expect(taskClose.executeClosePlan({ ...f, closeConfirmationRef: confirmed.ref })).resolves.toMatchObject({ status: "completed" });
  });

  it("stops after the first failed close step", async () => {
    const taskClose = await import("../core/task-close.mjs");
    const bad="f".repeat(40),f=await governed(({head})=>[{step_id:"ancestry",operation:"verify-checkpoint-ancestry",checkpoint_oid:bad,final_oid:head},{step_id:"remove",operation:"remove-worktree"}]);
    await expect(taskClose.executeClosePlan(f)).rejects.toThrow(/ancestor|commit|Git/i);
    expect(existsSync(f.worktree)).toBe(true);
  });

  it("rejects a close plan hash mismatch before any step side effect", async () => {
    const taskClose = await import("../core/task-close.mjs"), f=await governed();
    f.plan.steps.push({step_id:"changed",operation:"verify-checkpoint-ancestry",checkpoint_oid:f.head,final_oid:f.head});
    await expect(taskClose.executeClosePlan(f)).rejects.toThrow(/closeConfirmationRef|hash|plan/i);
    expect(existsSync(f.worktree)).toBe(true);
  });

  it("persists step progress so restart reconciles without replay and writes completed last", async () => {
    const taskClose = await import("../core/task-close.mjs"),f=await governed(({head})=>[{step_id:"ancestry",operation:"verify-checkpoint-ancestry",checkpoint_oid:head,final_oid:head},{step_id:"remove",operation:"remove-worktree"}]);
    await taskClose.executeClosePlan(f); expect(existsSync(f.worktree)).toBe(false);
    await expect(taskClose.executeClosePlan(f)).resolves.toMatchObject({status:"completed"});
    expect(JSON.parse(f.task.readRecord("operations/close/completed.json")).status).toBe("completed");
  });
  it("rebuilds authority after a crash between physical remove and step recording", async () => {
    const taskClose=await import("../core/task-close.mjs"),f=await governed(()=>[{step_id:"remove",operation:"remove-worktree"}]);
    const first=f.executors.executorFor(f.plan.steps[0]);await first.execute();expect(existsSync(f.worktree)).toBe(false);
    const stepPath=`operations/close/plans/${taskClose.closePlanHash(f.plan)}/steps/remove.json`;expect(()=>f.task.readRecord(stepPath)).toThrow();
    const restartedKernel=createTaskKernel(f.task),restartedExecutors=taskClose.createGovernedCloseExecutorRegistry({task:f.task,kernel:restartedKernel});
    await expect(taskClose.executeClosePlan({...f,kernel:restartedKernel,executors:restartedExecutors})).resolves.toMatchObject({status:"completed"});
    expect(JSON.parse(f.task.readRecord(stepPath))).toMatchObject({completion_mode:"reconciled",physical_state:{satisfied:true,worktree_root:f.worktree}});
  });
  it("fails closed when the task worktree branch drifts before remove", async () => {
    const taskClose=await import("../core/task-close.mjs"),f=await governed(()=>[{step_id:"remove",operation:"remove-worktree"}]);
    execFileSync("git",["switch","-qc","drift"],{cwd:f.worktree});
    await expect(taskClose.executeClosePlan(f)).rejects.toThrow(/branch|registration/i);
    expect(existsSync(f.worktree)).toBe(true);
  });
  it("rejects a caller-selected worktree removal path", async () => {
    const taskClose = await import("../core/task-close.mjs"), f = await governed(({worktree}) => [{step_id:"remove",operation:"remove-worktree",worktree_root:worktree}]);
    await expect(taskClose.executeClosePlan(f)).rejects.toThrow(/path.*accepted Workspace|selected only/i);
    expect(existsSync(f.worktree)).toBe(true);
  });
  it("rejects an arbitrary or verify-stage confirmation ref", async () => {
    const taskClose = await import("../core/task-close.mjs"), f = await governed();
    await expect(taskClose.executeClosePlan({ ...f, closeConfirmationRef: `confirmations/make-decision/${f.decision.attempt_ref}` })).rejects.toThrow(/canonical.*closeConfirmationRef/i);
    await expect(taskClose.executeClosePlan({ ...f, closeConfirmationRef: "human:test" })).rejects.toThrow(/canonical.*closeConfirmationRef/i);
    expect(existsSync(f.worktree)).toBe(true);
  });
  it.each([
    ["accepted identity", (f) => {
      const path=join(f.task.taskPath,"results","make-decision","accepted.json"),record=JSON.parse(readFileSync(path,"utf8"));record.task_id="forged";writeFileSync(path,`${JSON.stringify(record)}\n`);
    }],
    ["attempt content", (f) => {
      const path=join(f.task.taskPath,"results","make-decision",f.decision.attempt_ref),record=JSON.parse(readFileSync(path,"utf8"));record.facts.baseline_commit="f".repeat(40);writeFileSync(path,`${JSON.stringify(record)}\n`);
    }],
    ["accepted integrity", (f) => {
      const path=join(f.task.taskPath,"results","make-decision","accepted.json"),record=JSON.parse(readFileSync(path,"utf8"));record.integrity_hash=`sha256:${"0".repeat(64)}`;writeFileSync(path,`${JSON.stringify(record)}\n`);
    }],
  ])("fails closed before remove when %s is tampered", async (_label, tamper) => {
    const taskClose=await import("../core/task-close.mjs"),f=await governed(()=>[{step_id:"remove",operation:"remove-worktree"}]);tamper(f);
    await expect(taskClose.executeClosePlan(f)).rejects.toThrow(/accepted|attempt|integrity|identity|hash/i);
    expect(existsSync(f.worktree)).toBe(true);
  });
});
