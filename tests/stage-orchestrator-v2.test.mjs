import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../core/task-handle.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";
import { requiresHumanConfirmation } from "../core/stage-acceptance-policy.mjs";

const temporary = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runner-"))); temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "repo-chain-task"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo }); execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  const oid = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(); execFileSync("git", ["worktree", "add", "-q", "-b", "task/Demo/chain-task", worktree, oid], { cwd: repo });
  const taskPath = join(root, "Projects", "Demo", "tasks", "chain-task");
  const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "chain-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  return { root, task, taskPath, worktree, oid };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });
describe("stage-runner capability unit", () => {
  it("fails closed when task manifest changes between bootstrap and publish", async()=>{
    const {task,taskPath,worktree,oid}=fixture();const {runStage}=await import("../core/stage-runner.mjs");const {bootstrapStage}=await import("../core/stage-context.mjs");const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"});
    writeFileSync(join(task.taskPath,"task.json"),JSON.stringify({...task.manifest,project_name:"Forged"}));
    await expect(runStage("make-decision",context,async()=>({facts:{worktree_root:worktree,baseline_commit:oid}}))).rejects.toThrow(/manifest|identity|changed|tamper/i);
    expect(()=>task.readRecord("results/make-decision/attempt-0001.json")).toThrow();
  });
  it("gives handlers a least-authority worker context without task, kernel, or accept", async () => {
    const {taskPath,worktree,oid}=fixture();const {runStage}=await import("../core/stage-runner.mjs");const {bootstrapStage}=await import("../core/stage-context.mjs");const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"});
    await runStage("make-decision",context,async(worker)=>{expect(worker).not.toHaveProperty("task");expect(worker).not.toHaveProperty("kernel");expect(worker).not.toHaveProperty("accept");return{facts:{worktree_root:worktree,baseline_commit:oid}};});
  });
  it("keeps a cross-task decision read-only while the consumer owns its Workspace", async () => {
    const { root, task, taskPath, worktree, oid }=fixture(); const { runStage,acceptStageAttempt }=await import("../core/stage-runner.mjs"); const { bootstrapStage,prepareMakeDecisionWorkspace }=await import("../core/stage-context.mjs");
    const sourceContext=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"}); const decision=await runStage("make-decision",sourceContext,async()=>({facts:{worktree_root:worktree,baseline_commit:oid}})); acceptStageAttempt("make-decision",sourceContext,{attemptRef:decision.attempt_ref,humanConfirmationRef:writeHumanConfirmation(sourceContext.kernel,"make-decision",decision)});
    const consumerPath=join(root,"Projects","Demo","tasks","ZHI-138"); createTask({storageRoot:root,taskPath:consumerPath,manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:"ZHI-138",created_at:new Date().toISOString(),target_repo_root:task.manifest.target_repo_root,issue_ids:["ZHI-138"],inputs:{decision:join(task.taskPath,"results","make-decision","accepted.json")}}});
    expect(()=>bootstrapStage("build-spec",{mode:"sidecar",taskPath:consumerPath,projectName:"Demo",taskId:"ZHI-138"})).toThrow(/current task.*accepted make-decision/i);
    const consumerDecisionContext=prepareMakeDecisionWorkspace(bootstrapStage("make-decision",{mode:"sidecar",taskPath:consumerPath,projectName:"Demo",taskId:"ZHI-138"}));
    const consumerDecision=await runStage("make-decision",consumerDecisionContext,async(ctx,upstream)=>{expect(upstream.accepted.task_id).toBe("chain-task");return{facts:{worktree_root:ctx.candidateWorkspace.worktreeRoot,baseline_commit:ctx.candidateWorkspace.baselineCommit}};});
    expect(consumerDecision.attempt.upstream_refs[0].task_id).toBe("chain-task");
    acceptStageAttempt("make-decision",consumerDecisionContext,{attemptRef:consumerDecision.attempt_ref,humanConfirmationRef:writeHumanConfirmation(consumerDecisionContext.kernel,"make-decision",consumerDecision)});
    const consumer=bootstrapStage("build-spec",{mode:"sidecar",taskPath:consumerPath,projectName:"Demo",taskId:"ZHI-138"});
    expect(consumer.workspace.worktreeRoot).not.toBe(worktree);
    const attempt=await runStage("build-spec",consumer,async(ctx,upstream)=>{expect(upstream.accepted.task_id).toBe("ZHI-138");ctx.artifacts.writeAtomic("spec.md","spec\n");const checkpoint=ctx.createCheckpoint("build-spec");return{facts:{spec_ref:"specs/ZHI-138/spec.md",checkpoint}};});
    expect(attempt.attempt.upstream_refs[0].task_id).toBe("ZHI-138");
    expect(()=>execFileSync("git",["status","--porcelain"],{cwd:worktree,encoding:"utf8"})).not.toThrow();
  });
  it("acceptance cannot override checkpoint data", async () => {
    const { taskPath, worktree, oid }=fixture(); const { runStage,acceptStageAttempt }=await import("../core/stage-runner.mjs"); const { bootstrapStage }=await import("../core/stage-context.mjs");
    const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"}); const attempt=await runStage("make-decision",context,async()=>({facts:{worktree_root:worktree,baseline_commit:oid}}));
    expect(()=>acceptStageAttempt("make-decision",context,{attemptRef:attempt.attempt_ref,humanConfirmationRef:"human:yes",checkpoint:{forged:true}})).toThrow(/checkpoint override|forbidden/i);
  });
  it("rejects handler output that fails the canonical runtime result schema", async () => {
    const { taskPath, worktree, oid } = fixture(); const { runStage } = await import("../core/stage-runner.mjs"); const { bootstrapStage } = await import("../core/stage-context.mjs");
    const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"});
    await expect(runStage("make-decision",context,async()=>({schema_version:"forged.v0",facts:{worktree_root:worktree,baseline_commit:oid}}))).rejects.toThrow(/schema_version|stage-result|runtime schema/i);
  });
  it("bootstraps, reads accepted upstream, invokes handlers, publishes and accepts a real v2 chain", async () => {
    const { task, taskPath, worktree, oid } = fixture();
    const { runStage, acceptStageAttempt } = await import("../core/stage-runner.mjs");
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const seen = [];
    const tree=execFileSync("git",["rev-parse","HEAD^{tree}"],{cwd:worktree,encoding:"utf8"}).trim(), hash="a".repeat(64);
    const testFacts=(prefix)=>({command:"npm test",exit_code:0,command_hash:hash,snapshot_head:oid,snapshot_tree:tree,snapshot_commit:"b".repeat(40),started_at:"2026-07-16T00:00:00.000Z",completed_at:"2026-07-16T00:00:01.000Z",receipt_ref:`evidence/${prefix}-receipt.json`,receipt_hash:hash,output_ref:`evidence/${prefix}-output.txt`,output_hash:hash});
    const reviewFacts=(stage)=>({verdict:"pass",result_ref:`reviews/results/${stage}.json`,result_hash:hash,snapshot_tree:tree});
    const contextFor = (stage) => bootstrapStage(stage, { mode:"sidecar", taskPath, projectName:"Demo", taskId:"chain-task" });
    const execute = async (stage, handler) => { const context=contextFor(stage); const attempt=await runStage(stage,context,handler); const request={attemptRef:attempt.attempt_ref}; if(requiresHumanConfirmation(stage)) request.humanConfirmationRef=writeHumanConfirmation(context.kernel,stage,attempt); acceptStageAttempt(stage,context,request); };
    await execute("make-decision", async (context, upstream) => { seen.push([context.stage, upstream]); return { facts: { worktree_root: worktree, baseline_commit: oid } }; });
    await execute("build-spec", async (context, upstream) => { seen.push([context.stage, upstream.attempt.stage]); context.artifacts.writeAtomic("spec.md","spec\n"); const cp=context.createCheckpoint("build-spec"); return { facts: { spec_ref: "specs/chain-task/spec.md", checkpoint: cp } }; });
    await execute("build-plan", async (context, upstream) => { seen.push([context.stage, upstream.attempt.stage]); context.artifacts.writeAtomic("plan.md","plan\n"); context.artifacts.writeAtomic("tasks.md","tasks\n"); const cp=context.createCheckpoint("build-plan"); return { facts: { plan_ref: "specs/chain-task/plan.md", tasks_ref: "specs/chain-task/tasks.md", checkpoint: cp } }; });
    await execute("build-code", async (context, upstream) => { seen.push([context.stage, upstream.attempt.stage]); return { facts: { changed: [], tests: testFacts("build"), review: reviewFacts("build-code"), phase_completion: true } }; });
    await execute("verify-code", async (context, upstream) => { seen.push([context.stage, upstream.attempt.stage]); return { facts: { tests: testFacts("verify"), review: reviewFacts("verify-code"), evidence_refs: [] } }; });
    expect(seen).toEqual([["make-decision", null], ["build-spec", "make-decision"], ["build-plan", "build-spec"], ["build-code", "build-plan"], ["verify-code", "build-code"]]);
    for (const stage of ["make-decision","build-spec","build-plan","build-code","verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "task-accepted.v2", stage });
    }
  });

  it("can publish without accepting when the caller omits human confirmation", async () => {
    const { task, taskPath, worktree, oid } = fixture(); const { runStage } = await import("../core/stage-runner.mjs"); const { bootstrapStage } = await import("../core/stage-context.mjs");
    const result = await runStage("make-decision", bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"}), async()=>({facts:{worktree_root:worktree,baseline_commit:oid}}));
    expect(task.readRecord(`results/make-decision/${result.attempt_ref}`)).toContain("task-attempt.v2");
    expect(() => task.readRecord("results/make-decision/accepted.json")).toThrow(/ENOENT|no such/i);
  });
});
