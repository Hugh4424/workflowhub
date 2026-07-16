import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
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
  const governed=async(steps)=>{const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-close-")));roots.push(root);const repo=join(root,"repo"),taskId=`close-${roots.length}`,worktree=`${repo}-${taskId}`;mkdirSync(repo);execFileSync("git",["init","-q"],{cwd:repo});execFileSync("git",["config","user.email","t@e.co"],{cwd:repo});execFileSync("git",["config","user.name","T"],{cwd:repo});execFileSync("git",["commit","--allow-empty","-qm","base"],{cwd:repo});const head=String(execFileSync("git",["rev-parse","HEAD"],{cwd:repo})).trim();execFileSync("git",["worktree","add","-qb",`task/Demo/${taskId}`,worktree,head],{cwd:repo});const task=createTask({storageRoot:root,manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:taskId,created_at:new Date().toISOString(),target_repo_root:repo,issue_ids:[],inputs:{}}});const kernel=createTaskKernel(task),decision=kernel.publishAttempt("make-decision",{facts:{worktree_root:worktree,baseline_commit:head}});kernel.acceptAttempt("make-decision",decision.attempt_ref,writeHumanConfirmation(kernel,"make-decision",decision));const resolvedSteps=typeof steps==="function"?steps({head,worktree}):steps;const plan={schema_version:"task-close-plan.v1",task_id:task.identity.taskId,steps:resolvedSteps??[{step_id:"ancestry",operation:"verify-checkpoint-ancestry",checkpoint_oid:head,final_oid:head}]};const {closePlanHash,createGovernedCloseExecutorRegistry}=await import("../core/task-close.mjs");return{task,kernel,decision,plan,repo,worktree,head,executors:createGovernedCloseExecutorRegistry({task,kernel}),confirmation:{outcome:"confirmed",plan_hash:closePlanHash(plan),confirmation_ref:"human:test"}};};
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
    const f=await governed(), result = await taskClose.executeClosePlan({ ...f, confirmation:{...f.confirmation,outcome} });
    expect(result.status).toBe("blocked"); expect(existsSync(f.worktree)).toBe(true);
  });

  it("stops after the first failed close step", async () => {
    const taskClose = await import("../core/task-close.mjs");
    const bad="f".repeat(40),f=await governed(({head})=>[{step_id:"ancestry",operation:"verify-checkpoint-ancestry",checkpoint_oid:bad,final_oid:head},{step_id:"remove",operation:"remove-worktree"}]);
    await expect(taskClose.executeClosePlan(f)).rejects.toThrow(/ancestor|commit|Git/i);
    expect(existsSync(f.worktree)).toBe(true);
  });

  it("rejects a close plan hash mismatch before any step side effect", async () => {
    const taskClose = await import("../core/task-close.mjs"), f=await governed();
    await expect(taskClose.executeClosePlan({...f,confirmation:{...f.confirmation,plan_hash:"forged"}})).rejects.toThrow(/hash|plan/i);
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
    const stepPath=`operations/close/plans/${f.confirmation.plan_hash}/steps/remove.json`;expect(()=>f.task.readRecord(stepPath)).toThrow();
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
